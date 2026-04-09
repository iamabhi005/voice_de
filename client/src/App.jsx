import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RefreshCcw, Music, CheckCircle, XCircle, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const SINGERS = [
    { id: 'kumar_sanu', name: 'Kumar Sanu', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' },
    { id: 'udit_narayan', name: 'Udit Narayan', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100&h=100&fit=crop' },
    { id: 'alka_yagnik', name: 'Alka Yagnik', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
    { id: 'sonu_nigam', name: 'Sonu Nigam', image: 'https://images.unsplash.com/photo-1514525253361-bee8a1874403?w=100&h=100&fit=crop' },
];

export default function App() {
    const [songs, setSongs] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [selectedSinger, setSelectedSinger] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSongDropdownOpen, setIsSongDropdownOpen] = useState(false);

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await axios.get('/api/songs');
                setSongs(response.data);
                if (response.data.length > 0) {
                    setSelectedSong(response.data[0]);
                    const singer = SINGERS.find(s => s.name.toLowerCase() === response.data[0].singer.toLowerCase()) || SINGERS[0];
                    setSelectedSinger(singer);
                }
            } catch (err) {
                console.error("Failed to fetch songs", err);
            }
        };
        fetchSongs();
    }, []);

    useEffect(() => {
        if (selectedSong) {
            const singer = SINGERS.find(s => s.name.toLowerCase() === selectedSong.singer.toLowerCase());
            if (singer) {
                setSelectedSinger(singer);
            } else {
                // Fallback for singers not in the SINGERS constant
                setSelectedSinger({ name: selectedSong.singer, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' });
            }
        }
    }, [selectedSong]);

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
            setResult(null);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 10) {
                        stopRecording();
                        return 10;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error("Microphone access denied", err);
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
        if (selectedSong) {
            formData.append('song_id', selectedSong.id);
        } else {
            formData.append('singer', selectedSinger.name);
        }

        try {
            const response = await axios.post('/api/verify', formData);
            setResult(response.data);
        } catch (err) {
            console.error("Verification failed", err);
            let errorMessage = err.response?.data?.detail || "Verification failed.";

            if (err.message === "Network Error") {
                errorMessage = "Connection refused. Please ensure the backend is running (run 'npm run dev' from root).";
            } else if (err.response?.status === 404 && !err.response?.data?.detail) {
                errorMessage = "Singer not found or backend endpoint missing.";
            }

            setResult({
                is_match: false,
                confidence: 0,
                message: errorMessage,
                is_error: true
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setAudioBlob(null);
        setResult(null);
        setRecordingTime(0);
    };

    return (
        <div className="min-h-screen bg-retro-dark flex flex-col items-center justify-center p-4 font-['Outfit'] select-none">
            {/* Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-retro-purple/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-retro-pink/10 blur-[120px] rounded-full" />
            </div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="bg-black border border-retro-purple/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(125,18,255,0.2)] relative overflow-hidden min-h-[600px] flex flex-col items-center">
                    {/* Decorative Corners */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-retro-purple/40 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-retro-purple/40 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-retro-purple/40 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-retro-purple/40 rounded-br-lg" />

                    {/* Corner Circles (as seen in image) */}
                    <div className="absolute bottom-2 left-2 w-8 h-8 opacity-40">
                        <div className="absolute bottom-0 left-0 w-full h-full border-2 border-retro-purple/40 rounded-full clip-path-polygon-[0_0,0_100%,100%_100%]" />
                    </div>
                    <div className="absolute bottom-2 right-2 w-8 h-8 opacity-40">
                        <div className="absolute bottom-0 right-0 w-full h-full border-2 border-retro-purple/40 rounded-full clip-path-polygon-[100%_0,100%_100%,0_100%]" />
                    </div>

                    <header className="text-center mb-12 flex flex-col items-center">
                        <div className="bg-retro-purple/10 border border-retro-purple/30 px-6 py-2 rounded-xl mb-2 shadow-[0_0_20px_rgba(125,18,255,0.2)]">
                            <h1 className="text-3xl font-black italic tracking-tighter text-white">
                                RETRO <span className="text-retro-purple-400">SINGER</span>
                            </h1>
                        </div>
                        <p className="text-retro-purple/60 font-bold text-[10px] tracking-[0.4em] uppercase">VERIFIER AI</p>
                    </header>

                    {!result ? (
                        <div className="w-full space-y-12 flex flex-col items-center flex-grow">
                            {/* Singer Selector */}
                            <div className="w-full relative">
                                <div
                                    className="relative cursor-pointer group"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 group-hover:border-retro-purple transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-retro-gradient p-[2px] shadow-lg">
                                                <img src={selectedSinger?.image} alt={selectedSinger?.name} className="w-full h-full rounded-full object-cover border-2 border-black" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Target Singer</span>
                                                <span className="text-lg font-black tracking-tight text-white">{selectedSinger?.name || 'Loading...'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Song Selector */}
                            <div className="w-full relative mt-[-2rem]">
                                <div
                                    className="relative cursor-pointer group"
                                    onClick={() => setIsSongDropdownOpen(!isSongDropdownOpen)}
                                >
                                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 group-hover:border-retro-purple transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-retro-purple/20 p-2 rounded-xl">
                                                <Music className="w-6 h-6 text-retro-purple" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Select Song</span>
                                                <span className="text-base font-black tracking-tight text-white truncate max-w-[180px]">
                                                    {selectedSong?.title || 'Select a song'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${isSongDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    <AnimatePresence>
                                        {isSongDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-0 w-full mt-2 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-[300px] overflow-y-auto"
                                            >
                                                {songs.map((song) => (
                                                    <div
                                                        key={song.id}
                                                        className="flex flex-col p-4 hover:bg-retro-purple/20 transition-colors cursor-pointer border-b border-white/5 last:border-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSong(song);
                                                            setIsSongDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className="font-bold text-white">{song.title}</span>
                                                        <span className="text-[10px] text-white/40 uppercase tracking-tighter">{song.singer} • {song.movie} ({song.year})</span>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Recorder Section */}
                            <div className="flex flex-col items-center justify-center py-4 flex-grow">
                                <div className="relative">
                                    {isRecording && (
                                        <motion.div
                                            className="absolute inset-[-20px] rounded-full bg-retro-purple/20 blur-2xl"
                                            animate={{ scale: [1, 1.4, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    )}
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isProcessing}
                                        className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording
                                            ? 'bg-retro-pink shadow-[0_0_50px_#ff007f]'
                                            : 'bg-black border-4 border-retro-purple/30 shadow-[0_0_30px_rgba(125,18,255,0.2)] hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        {isRecording ? (
                                            <Square fill="white" className="w-10 h-10 text-white" />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Mic className="w-12 h-12 text-white mb-1" />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                <div className="mt-8 text-center">
                                    {isRecording ? (
                                        <div className="space-y-3">
                                            <div className="text-retro-pink font-black text-3xl italic tracking-tighter">00:{recordingTime.toString().padStart(2, '0')}</div>
                                            <div className="flex gap-1.5 h-8 items-center justify-center">
                                                {[...Array(15)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: [10, Math.random() * 30 + 10, 10] }}
                                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                                                        className="w-1 bg-retro-pink rounded-full"
                                                    />
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

                            {/* Submit Button */}
                            {audioBlob && !isRecording && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handleVerify}
                                    disabled={isProcessing}
                                    className="w-full bg-retro-purple text-white py-5 rounded-3xl font-black text-lg tracking-widest uppercase shadow-[0_10px_30px_rgba(125,18,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden group relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin w-6 h-6" />
                                            ANALYZING...
                                        </>
                                    ) : (
                                        <>
                                            <Music className="w-6 h-6" />
                                            VERIFY VOICE
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ type: "spring", damping: 12 }}
                            className={`w-full py-6 flex flex-col items-center space-y-10 flex-grow relative ${result.is_match ? 'perspective-1000' : ''}`}
                        >
                            {/* Party Particles (only for TRUE) */}
                            {result.is_match && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute bottom-0 animate-particle"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                '--tx': `${(Math.random() - 0.5) * 200}px`,
                                                '--duration': `${2 + Math.random() * 3}s`,
                                                '--delay': `${Math.random() * 2}s`,
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: i % 2 === 0 ? '#00ff7f' : '#7d12ff',
                                                borderRadius: i % 3 === 0 ? '50%' : '2px',
                                                zIndex: -1
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Result Icon */}
                            <div className="relative">
                                <motion.div
                                    animate={result.is_match ? {
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 5, -5, 0]
                                    } : {}}
                                    transition={{ duration: 0.5, repeat: result.is_match ? Infinity : 0, repeatDelay: 2 }}
                                    className={`w-32 h-32 rounded-full absolute inset-0 blur-3xl opacity-40 ${result.is_match ? 'bg-retro-success' : 'bg-red-500'}`}
                                />
                                <motion.div
                                    animate={result.is_match ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.3, repeat: result.is_match ? Infinity : 0, repeatDelay: 1 }}
                                    className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 ${result.is_error ? 'border-amber-500 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : result.is_match ? 'border-retro-success text-retro-success shadow-[0_0_50px_rgba(0,255,127,0.5)]' : 'border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}
                                >
                                    {result.is_error ? <RefreshCcw className="w-16 h-16" /> : result.is_match ? <CheckCircle className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
                                </motion.div>
                            </div>

                            {/* Result Text */}
                            <div className="text-center relative">
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className={`text-7xl font-black italic tracking-tighter uppercase mb-2 ${result.is_error ? 'text-amber-500' : result.is_match ? 'text-retro-success shimmer-text' : 'text-red-500'} drop-shadow-[0_0_20px_currentColor]`}
                                >
                                    {result.is_error ? 'ERROR' : result.is_match ? 'TRUE' : 'FALSE'}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/80 font-bold text-sm tracking-wide"
                                >
                                    {result.is_error
                                        ? result.message
                                        : result.is_match
                                            ? `🎉 AMAZING MATCH! Sounds just like ${selectedSinger.name}!`
                                            : `This voice does not match ${selectedSinger.name}.`}
                                </motion.p>
                            </div>

                            {/* Confidence Bar Section */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full bg-white/[0.05] rounded-3xl p-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                            >
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Accuracy Rating</span>
                                    <span className={`text-2xl font-black ${result.is_match ? 'text-retro-success' : 'text-red-400'}`}>
                                        {(result.confidence * 100).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden p-[3px]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${result.confidence * 100}%` }}
                                        transition={{ duration: 1.5, ease: "backOut" }}
                                        className={`h-full rounded-full ${result.is_match ? 'bg-retro-success shadow-[0_0_20px_#00ff7f]' : 'bg-red-500 shadow-[0_0_20px_#ef4444]'}`}
                                    />
                                </div>
                            </motion.div>

                            {/* Try Again Button */}
                            <button
                                onClick={reset}
                                className="mt-auto bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-10 py-4 rounded-full border border-white/10 font-black tracking-widest uppercase transition-all flex items-center gap-3 group active:scale-90 shadow-lg"
                            >
                                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                <span>Try Again</span>
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-10 text-center text-white/20 text-[10px] font-black tracking-[0.4em] uppercase">
                    MADE WITH 80S LOVE • AI POWERED
                </footer>
            </motion.div>
        </div>
    );
}
