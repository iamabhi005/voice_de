"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, RefreshCcw, Music, CheckCircle, XCircle, Loader2, ChevronDown, Search, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const SINGERS = [
  { id: 'kumar_sanu', name: 'Kumar Sanu', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' },
  { id: 'udit_narayan', name: 'Udit Narayan', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100&h=100&fit=crop' },
  { id: 'alka_yagnik', name: 'Alka Yagnik', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
  { id: 'sonu_nigam', name: 'Sonu Nigam', image: 'https://images.unsplash.com/photo-1514525253361-bee8a1874403?w=100&h=100&fit=crop' },
];

// ─────────────────────────────────────────────
// Search Result Card Component
// ─────────────────────────────────────────────
function SearchResultCard({ data, onReset }) {
  const { query, singer_metadata: md, youtube_results } = data;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14 }}
      className="w-full flex flex-col gap-5 flex-grow"
    >
      {/* Transcription */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
          <Globe className="w-3 h-3" /> Interpreted Lyrics
        </p>
        <p className="text-white font-bold italic text-sm">"{query}"</p>
      </div>

      {/* Singer Metadata Card */}
      {md && (md.singer_name ? (
        <div className="bg-gradient-to-br from-retro-purple/20 to-retro-pink/10 border border-retro-purple/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-retro-gradient p-[2px] shadow-lg flex-shrink-0">
              <div className="w-full h-full rounded-full bg-retro-purple/40 flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{md.singer_name}</h2>
              <p className="text-retro-purple text-xs font-bold uppercase tracking-widest">{md.genre || 'Bollywood'} • {md.era || 'Retro'}</p>
            </div>
            {md.confidence && (
              <span className={`ml-auto text-[10px] font-black uppercase px-2 py-1 rounded-full ${md.confidence === 'high' ? 'bg-retro-success/20 text-retro-success' : md.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {md.confidence}
              </span>
            )}
          </div>

          {(md.song_title || md.movie) && (
            <div className="space-y-1">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Detected Song</p>
              <p className="text-white font-black text-base">{md.song_title || 'Unknown'}</p>
              <p className="text-white/50 text-xs">{md.movie || 'N/A'} {md.year ? `(${md.year})` : ''}</p>
            </div>
          )}

          {md.creators && md.creators.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Artists & Creators</p>
              <div className="flex flex-wrap gap-2">
                {md.creators.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                    <span className="text-white font-bold text-[10px]">{c.name}</span>
                    <span className="text-retro-purple/60 text-[9px] font-black uppercase tracking-tighter">{c.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {md.bio && (
            <p className="text-white/60 text-xs leading-relaxed border-t border-white/10 pt-3 italic">{md.bio}</p>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Analysis Result</p>
          <p className="text-white/70 text-xs whitespace-pre-wrap leading-relaxed italic">
            {md.raw_response || JSON.stringify(md, null, 2)}
          </p>
        </div>
      ))}

      {/* YouTube Results */}
      {youtube_results && youtube_results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Top YouTube Matches</p>
          {youtube_results.slice(0, 3).map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all group">
              <span className="text-retro-purple font-black text-sm mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate group-hover:text-retro-purple transition-colors">{r.title}</p>
                <p className="text-white/40 text-[10px]">{r.channel}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      <button
        onClick={onReset}
        className="mt-auto bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-10 py-4 rounded-full border border-white/10 font-black tracking-widest uppercase transition-all flex items-center justify-center gap-3 group active:scale-90 shadow-lg"
      >
        <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
        Search Again
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function Home() {
  // MODE: 'verify' | 'search'
  const [mode, setMode] = useState('verify');

  // Verify mode state
  const [selectedSinger, setSelectedSinger] = useState(SINGERS[0]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Search mode state
  const [searchResult, setSearchResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Shared recording state (verify mode only)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setVerifyResult(null);
      setSearchResult(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) { stopRecording(); return 10; }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      alert("Please allow microphone access to record your voice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleVerify = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('singer', selectedSinger.name);
    try {
      const response = await axios.post('/api/verify', formData);
      setVerifyResult(response.data);
    } catch (err) {
      setVerifyResult({
        is_match: false, confidence: 0,
        message: err.response?.data?.error || "Verification failed. Please try again.",
        is_error: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => { setIsListening(true); setTranscript(''); };
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(text);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => { console.error(e); setIsListening(false); };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleSearch = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(transcript)}`);
      setSearchResult(response.data);
    } catch (err) {
      setSearchResult({
        query: transcript,
        youtube_results: [],
        singer_metadata: { raw_response: err.response?.data?.error || 'Search failed.' }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setVerifyResult(null);
    setSearchResult(null);
    setRecordingTime(0);
    setTranscript('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    reset();
  };

  return (
    <div className="min-h-screen bg-retro-dark flex flex-col items-center justify-center p-4 select-none">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-retro-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-retro-pink/10 blur-[120px] rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
        <div className="bg-black border border-retro-purple/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(125,18,255,0.2)] relative overflow-hidden min-h-[600px] flex flex-col items-center">
          {/* Decorative Corners */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-retro-purple/40 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-retro-purple/40 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-retro-purple/40 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-retro-purple/40 rounded-br-lg" />

          <header className="text-center mb-6 flex flex-col items-center">
            <div className="bg-retro-purple/10 border border-retro-purple/30 px-6 py-2 rounded-xl mb-2 shadow-[0_0_20px_rgba(125,18,255,0.2)]">
              <h1 className="text-3xl font-black italic tracking-tighter text-white">
                RETRO <span className="text-retro-purple-400">SINGER</span>
              </h1>
            </div>
            <p className="text-retro-purple/60 font-bold text-[10px] tracking-[0.4em] uppercase">VERIFIER AI</p>
          </header>

          {/* Mode Toggle */}
          <div className="flex w-full bg-white/5 rounded-2xl p-1 mb-6 border border-white/10">
            <button
              onClick={() => switchMode('verify')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all ${mode === 'verify' ? 'bg-retro-purple text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
            >
              <CheckCircle className="w-4 h-4" /> Verify
            </button>
            <button
              onClick={() => switchMode('search')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all ${mode === 'search' ? 'bg-retro-purple text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
            >
              <Search className="w-4 h-4" /> Find Song
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── VERIFY MODE ── */}
            {mode === 'verify' && !verifyResult && (
              <motion.div key="verify-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full space-y-6 flex flex-col items-center flex-grow">
                {/* Singer Selector */}
                <div className="w-full relative">
                  <div className="relative cursor-pointer group" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 group-hover:border-retro-purple transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-retro-gradient p-[2px] shadow-lg">
                          <img src={selectedSinger.image} alt={selectedSinger.name} className="w-full h-full rounded-full object-cover border-2 border-black" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Target Singer</span>
                          <span className="text-lg font-black tracking-tight text-white">{selectedSinger.name}</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 w-full mt-2 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl">
                          {SINGERS.map((singer) => (
                            <div key={singer.id} className="flex items-center gap-3 p-4 hover:bg-retro-purple/20 transition-colors cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); setSelectedSinger(singer); setIsDropdownOpen(false); }}>
                              <img src={singer.image} alt={singer.name} className="w-8 h-8 rounded-full object-cover" />
                              <span className="font-bold text-white">{singer.name}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Recorder */}
                <RecorderSection isRecording={isRecording} recordingTime={recordingTime} audioBlob={audioBlob}
                  isProcessing={isProcessing} onStart={startRecording} onStop={stopRecording} />

                {audioBlob && !isRecording && (
                  <ActionButton isProcessing={isProcessing} onClick={handleVerify} label="VERIFY VOICE" />
                )}
              </motion.div>
            )}

            {/* ── VERIFY RESULT ── */}
            {mode === 'verify' && verifyResult && (
              <motion.div key="verify-result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="w-full py-6 flex flex-col items-center space-y-8 flex-grow">
                <VerifyResultView result={verifyResult} singerName={selectedSinger.name} />
                <button onClick={reset} className="mt-auto bg-white/5 hover:bg-white/10 text-white/80 px-10 py-4 rounded-full border border-white/10 font-black tracking-widest uppercase transition-all flex items-center gap-3 group active:scale-90">
                  <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                  Try Again
                </button>
              </motion.div>
            )}

            {/* ── SEARCH MODE ── */}
            {mode === 'search' && !searchResult && (
              <motion.div key="search-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center flex-grow gap-5">
                <div className="text-center">
                  <p className="text-white/50 text-xs tracking-widest uppercase font-bold">Sing or speak any lyrics</p>
                  <p className="text-white/30 text-[10px] mt-1">Hindi or English • Tap mic to start</p>
                </div>

                {/* Listen Button */}
                <div className="flex flex-col items-center gap-4 flex-grow justify-center">
                  <div className="relative">
                    {isListening && (
                      <motion.div className="absolute inset-[-20px] rounded-full bg-retro-pink/20 blur-2xl"
                        animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    )}
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isProcessing}
                      className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${isListening
                        ? 'bg-retro-pink shadow-[0_0_50px_#ff007f]'
                        : 'bg-black border-4 border-retro-purple/30 shadow-[0_0_30px_rgba(125,18,255,0.2)] hover:scale-105 active:scale-95'
                        }`}>
                      {isListening ? <Square fill="white" className="w-10 h-10 text-white" /> : <Mic className="w-12 h-12 text-white" />}
                    </button>
                  </div>

                  {/* Transcript display */}
                  <div className="w-full min-h-[60px] bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    {isListening ? (
                      <div className="flex gap-1.5 h-6 items-center justify-center">
                        {[...Array(12)].map((_, i) => (
                          <motion.div key={i}
                            animate={{ height: [6, Math.random() * 22 + 6, 6] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.06 }}
                            className="w-1 bg-retro-pink rounded-full" />
                        ))}
                      </div>
                    ) : transcript ? (
                      <p className="text-white font-bold text-sm italic">"{transcript}"</p>
                    ) : (
                      <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">TAP TO LISTEN</p>
                    )}
                  </div>
                </div>

                {transcript && !isListening && (
                  <ActionButton isProcessing={isProcessing} onClick={handleSearch} label="FIND SONG" icon={<Search className="w-6 h-6" />} processingLabel="SEARCHING..." />
                )}
              </motion.div>
            )}

            {/* ── SEARCH RESULT ── */}
            {mode === 'search' && searchResult && (
              <motion.div key="search-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full h-full flex-grow overflow-y-auto pr-1 custom-scrollbar">
                <SearchResultCard data={searchResult} onReset={reset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-10 text-center text-white/20 text-[10px] font-black tracking-[0.4em] uppercase">
          MADE WITH 80S LOVE • AI POWERED
        </footer>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────
function RecorderSection({ isRecording, recordingTime, audioBlob, isProcessing, onStart, onStop }) {
  return (
    <div className="flex flex-col items-center justify-center py-4 flex-grow">
      <div className="relative">
        {isRecording && (
          <motion.div className="absolute inset-[-20px] rounded-full bg-retro-purple/20 blur-2xl"
            animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        )}
        <button onClick={isRecording ? onStop : onStart} disabled={isProcessing}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-retro-pink shadow-[0_0_50px_#ff007f]' : 'bg-black border-4 border-retro-purple/30 shadow-[0_0_30px_rgba(125,18,255,0.2)] hover:scale-105 active:scale-95'}`}>
          {isRecording ? <Square fill="white" className="w-10 h-10 text-white" /> : <Mic className="w-12 h-12 text-white" />}
        </button>
      </div>
      <div className="mt-8 text-center">
        {isRecording ? (
          <div className="space-y-3">
            <div className="text-retro-pink font-black text-3xl italic tracking-tighter">00:{recordingTime.toString().padStart(2, '0')}</div>
            <div className="flex gap-1.5 h-8 items-center justify-center">
              {[...Array(15)].map((_, i) => (
                <motion.div key={i} animate={{ height: [10, Math.random() * 30 + 10, 10] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                  className="w-1 bg-retro-pink rounded-full" />
              ))}
            </div>
          </div>
        ) : audioBlob ? (
          <div className="text-retro-success font-black tracking-widest text-xs uppercase animate-pulse">RECORDING READY 📼</div>
        ) : (
          <div className="text-white/30 font-bold text-[10px] tracking-[0.3em] uppercase">TAP TO RECORD 5-10S</div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ isProcessing, onClick, label, icon = <Music className="w-6 h-6" />, processingLabel = "ANALYZING..." }) {
  return (
    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick} disabled={isProcessing}
      className="w-full bg-retro-purple text-white py-5 rounded-3xl font-black text-lg tracking-widest uppercase shadow-[0_10px_30px_rgba(125,18,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      {isProcessing ? <><Loader2 className="animate-spin w-6 h-6" />{processingLabel}</> : <>{icon}{label}</>}
    </motion.button>
  );
}

function VerifyResultView({ result, singerName }) {
  return (
    <>
      <div className="relative">
        <motion.div animate={result.is_match ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 0.5, repeat: result.is_match ? Infinity : 0, repeatDelay: 2 }}
          className={`w-32 h-32 rounded-full absolute inset-0 blur-3xl opacity-40 ${result.is_match ? 'bg-retro-success' : 'bg-red-500'}`} />
        <motion.div animate={result.is_match ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3, repeat: result.is_match ? Infinity : 0, repeatDelay: 1 }}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 ${result.is_error ? 'border-amber-500 text-amber-500' : result.is_match ? 'border-retro-success text-retro-success shadow-[0_0_50px_rgba(0,255,127,0.5)]' : 'border-red-500 text-red-500'}`}>
          {result.is_error ? <RefreshCcw className="w-16 h-16" /> : result.is_match ? <CheckCircle className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
        </motion.div>
      </div>

      <div className="text-center">
        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className={`text-7xl font-black italic tracking-tighter uppercase mb-2 ${result.is_error ? 'text-amber-500' : result.is_match ? 'text-retro-success shimmer-text' : 'text-red-500'} drop-shadow-[0_0_20px_currentColor]`}>
          {result.is_error ? 'ERROR' : result.is_match ? 'TRUE' : 'FALSE'}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-white/80 font-bold text-sm tracking-wide">
          {result.is_error ? result.message : result.is_match ? `🎉 AMAZING MATCH! Sounds just like ${singerName}!` : `This voice does not match ${singerName}.`}
        </motion.p>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="w-full bg-white/[0.05] rounded-3xl p-6 border border-white/10">
        <div className="flex justify-between items-end mb-4">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Accuracy Rating</span>
          <span className={`text-2xl font-black ${result.is_match ? 'text-retro-success' : 'text-red-400'}`}>
            {(result.confidence * 100).toFixed(2)}%
          </span>
        </div>
        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-[3px]">
          <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }}
            transition={{ duration: 1.5, ease: 'backOut' }}
            className={`h-full rounded-full ${result.is_match ? 'bg-retro-success shadow-[0_0_20px_#00ff7f]' : 'bg-red-500 shadow-[0_0_20px_#ef4444]'}`} />
        </div>
      </motion.div>
    </>
  );
}
