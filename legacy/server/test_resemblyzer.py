import os
import numpy as np
import librosa
from resemblyzer import VoiceEncoder, preprocess_wav

encoder = VoiceEncoder()
DATA_DIR = "data/singers"

for singer_name in os.listdir(DATA_DIR):
    singer_path = os.path.join(DATA_DIR, singer_name)
    if os.path.isdir(singer_path):
        print(f"Testing {singer_name}...")
        for file in os.listdir(singer_path):
            if file.endswith(".wav"):
                file_path = os.path.join(singer_path, file)
                try:
                    wav = preprocess_wav(file_path)
                    embedding = encoder.embed_utterance(wav)
                    print(f"  {file}: Success, embedding shape {embedding.shape}")
                except Exception as e:
                    print(f"  {file}: FAILED with error {e}")
