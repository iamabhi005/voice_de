import os
import shutil
import uuid
import subprocess
import numpy as np
import librosa
import soundfile as sf
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from resemblyzer import VoiceEncoder, preprocess_wav
from typing import List, Dict, Optional
import json
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_singer_embeddings()
    load_songs_data()
    yield

app = FastAPI(title="Retro Singer Verifier API", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Voice Encoder
encoder = VoiceEncoder()

# Paths
DATA_DIR = "data/singers"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def convert_to_wav(input_path: str) -> str:
    """Convert any audio format to 16kHz mono WAV using ffmpeg."""
    output_path = input_path.rsplit(".", 1)[0] + "_converted.wav"
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", input_path,
                "-ac", "1",        # mono
                "-ar", "16000",    # 16kHz sample rate
                "-f", "wav",
                output_path
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            print(f"ffmpeg error: {result.stderr}")
            raise RuntimeError(f"ffmpeg failed: {result.stderr}")
        return output_path
    except FileNotFoundError:
        raise RuntimeError("ffmpeg not found. Please install ffmpeg.")

# Singer reference embeddings cache
singer_embeddings: Dict[str, np.ndarray] = {}
# Song dataset
songs_data: List[Dict] = []

def load_songs_data():
    """Load the song dataset from data/songs.json."""
    songs_file = os.path.join("data", "songs.json")
    if os.path.exists(songs_file):
        try:
            with open(songs_file, "r") as f:
                global songs_data
                songs_data = json.load(f)
            print(f"Loaded {len(songs_data)} songs from {songs_file}")
        except Exception as e:
            print(f"Error loading songs.json: {e}")
    else:
        print(f"Warning: {songs_file} not found.")

def load_singer_embeddings():
    """Load and pre-compute embeddings for all singers in the DATA_DIR."""
    if not os.path.exists(DATA_DIR):
        print(f"Warning: {DATA_DIR} does not exist.")
        return

    for singer_name in os.listdir(DATA_DIR):
        singer_path = os.path.join(DATA_DIR, singer_name)
        if os.path.isdir(singer_path):
            embeddings = []
            for file in os.listdir(singer_path):
                if file.endswith(".wav"):
                    try:
                        file_path = os.path.join(singer_path, file)
                        wav = preprocess_wav(file_path)
                        embedding = encoder.embed_utterance(wav)
                        embeddings.append(embedding)
                    except Exception as e:
                        print(f"Error processing {file}: {e}")
            
            if embeddings:
                # Store the mean embedding for better representation
                singer_embeddings[singer_name.lower()] = np.mean(embeddings, axis=0)
                print(f"Loaded {len(embeddings)} samples for {singer_name}")

@app.get("/singers")
async def get_singers():
    return list(singer_embeddings.keys())

@app.get("/songs")
async def get_songs():
    return songs_data

@app.post("/identify")
async def identify_singer(
    file: UploadFile = File(...)
):
    print(f"DEBUG: Identify request with file='{file.filename}'")
    
    # Save uploaded file
    file_id = str(uuid.uuid4())
    temp_file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"DEBUG: Saved file to {temp_file_path}")
    converted_path = None
    try:
        # Convert to WAV (browser may send WebM/OGG)
        print("DEBUG: Converting audio to WAV with ffmpeg")
        converted_path = convert_to_wav(temp_file_path)
        # Preprocess and embed the user's voice
        print("DEBUG: Loading audio with librosa")
        wav, sr = librosa.load(converted_path, sr=16000)
        print(f"DEBUG: Loaded audio, shape={wav.shape}, sr={sr}")
        
        # Audio Normalization
        wav = librosa.util.normalize(wav)
        
        # Ensure it's a numpy array suitable for preprocess_wav
        processed_wav = preprocess_wav(wav)
        user_embedding = encoder.embed_utterance(processed_wav)
        print(f"DEBUG: Generated user embedding, shape={user_embedding.shape}")

        # Find the best matching singer
        best_singer = None
        best_similarity = -1
        
        for singer_key, ref_embedding in singer_embeddings.items():
            similarity = np.dot(user_embedding, ref_embedding) / (
                np.linalg.norm(user_embedding) * np.linalg.norm(ref_embedding)
            )
            print(f"DEBUG: Similarity to {singer_key}: {similarity:.4f}")
            if similarity > best_similarity:
                best_similarity = similarity
                best_singer = singer_key

        confidence = float(best_similarity)
        print(f"DEBUG: Best match: {best_singer}, confidence: {confidence:.4f}")

        return {
            "predicted_singer": best_singer,
            "confidence": confidence,
            "all_similarities": {s: float(np.dot(user_embedding, singer_embeddings[s]) / (
                np.linalg.norm(user_embedding) * np.linalg.norm(singer_embeddings[s])
            )) for s in singer_embeddings}
        }
    except Exception as e:
        print(f"DEBUG: Backend Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")
    finally:
        # Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if converted_path and os.path.exists(converted_path):
            os.remove(converted_path)

@app.post("/verify")
async def verify_voice(
    file: UploadFile = File(...),
    singer: Optional[str] = Form(None),
    song_id: Optional[str] = Form(None)
):
    print(f"DEBUG: Received singer='{singer}', song_id='{song_id}', file='{file.filename}'")
    
    target_singer = singer
    
    # If song_id is provided, get the singer for that song
    if song_id:
        song = next((s for s in songs_data if s["id"] == song_id), None)
        if song:
            target_singer = song["singer"]
            print(f"DEBUG: Song ID '{song_id}' matches singer '{target_singer}'")
        else:
            print(f"DEBUG: Song ID '{song_id}' not found")
            if not target_singer:
                raise HTTPException(status_code=404, detail=f"Song ID '{song_id}' not found")

    if not target_singer:
        raise HTTPException(status_code=400, detail="Either singer or song_id must be provided")

    singer_key = target_singer.lower()
    if singer_key not in singer_embeddings:
        print(f"DEBUG: Singer '{singer_key}' not in embeddings")
        # Check if the directory exists and has files, maybe they weren't loaded
        singer_path = os.path.join(DATA_DIR, singer)
        if not os.path.exists(singer_path):
            raise HTTPException(status_code=404, detail=f"Singer directory '{singer}' not found in {DATA_DIR}")
        
        files = [f for f in os.listdir(singer_path) if f.endswith(".wav")]
        if not files:
            raise HTTPException(
                status_code=400, 
                detail=f"No .wav samples found for '{singer}'. Please add them to: server/data/singers/{singer}/"
            )
        
        raise HTTPException(
            status_code=404, 
            detail=f"Singer '{singer}' embeddings not loaded. Try restarting the server after adding .wav files."
        )

    # Save uploaded file
    file_id = str(uuid.uuid4())
    temp_file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"DEBUG: Saved file to {temp_file_path}")
    converted_path = None
    try:
        # Convert to WAV (browser may send WebM/OGG)
        print("DEBUG: Converting audio to WAV with ffmpeg")
        converted_path = convert_to_wav(temp_file_path)
        # Preprocess and embed the user's voice
        print("DEBUG: Loading audio with librosa")
        wav, sr = librosa.load(converted_path, sr=16000)
        print(f"DEBUG: Loaded audio, shape={wav.shape}, sr={sr}")
        
        # Audio Normalization
        wav = librosa.util.normalize(wav)
        
        # Ensure it's a numpy array suitable for preprocess_wav
        processed_wav = preprocess_wav(wav)
        user_embedding = encoder.embed_utterance(processed_wav)
        print(f"DEBUG: Generated user embedding, shape={user_embedding.shape}")

        # Calculate cosine similarity
        reference_embedding = singer_embeddings[singer_key]
        similarity = np.dot(user_embedding, reference_embedding) / (
            np.linalg.norm(user_embedding) * np.linalg.norm(reference_embedding)
        )

        # Threshold for TRUE/FALSE
        THRESHOLD = 0.5
        is_match = bool(similarity > THRESHOLD)
        confidence = float(similarity)

        print(f"DEBUG: Singer={target_singer}, Similarity={confidence:.4f}, Match={is_match}")

        return {
            "is_match": is_match,
            "confidence": confidence,
            "singer": target_singer,
            "threshold": THRESHOLD,
            "message": f"Singer {target_singer} matched successfully!" if is_match else f"Voice did not match {target_singer}."
        }
    except Exception as e:
        print(f"DEBUG: Backend Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")
    finally:
        # Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if converted_path and os.path.exists(converted_path):
            os.remove(converted_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
