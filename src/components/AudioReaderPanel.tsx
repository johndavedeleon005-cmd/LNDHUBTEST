import React, { useState, useRef, useEffect } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Sparkles,
  CheckCircle2,
  ListMusic,
  FileText,
} from 'lucide-react';
import { TTSService } from '../services/ttsService';

interface AudioReaderPanelProps {
  documents: FoodSafetyDoc[];
  selectedDoc: FoodSafetyDoc | null;
  onSelectDoc: (doc: FoodSafetyDoc) => void;
}

export const AudioReaderPanel: React.FC<AudioReaderPanelProps> = ({
  documents,
  selectedDoc,
  onSelectDoc,
}) => {
  const [currentDoc, setCurrentDoc] = useState<FoodSafetyDoc>(selectedDoc || documents[0]);
  const [voice, setVoice] = useState<'Kore' | 'Puck' | 'Fenrir' | 'Zephyr'>('Kore');
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedDoc) {
      setCurrentDoc(selectedDoc);
    }
  }, [selectedDoc]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      TTSService.stopCurrentAudio();
    };
  }, []);

  const handleTogglePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && !audioRef.current.ended && audioRef.current.currentTime > 0) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const speechText = `${currentDoc.code}: ${currentDoc.title}. Imperial Kitchen Group compliance brief. ${currentDoc.summary} Key Floor Rules: ${currentDoc.keyTakeaways.slice(0, 4).join('. ')}. Effective Date: ${currentDoc.effectiveDate}.`;

    try {
      const audioUrl = await TTSService.generateSpeech({
        text: speechText,
        voice,
        style: 'Clear, authoritative, highly intelligible food safety compliance officer for kitchen staff',
      });

      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setPlaybackTime(audio.currentTime);
        setDuration(audio.duration || 0);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setErrorMsg('Audio playback fallback initialized');
        TTSService.playWebSpeechFallback(speechText, () => setIsPlaying(false));
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.warn('Gemini TTS error, falling back to Web Speech API:', err);
      setErrorMsg('Using device audio voice reader');
      const ok = TTSService.playWebSpeechFallback(speechText, () => setIsPlaying(false));
      if (ok) {
        setIsPlaying(true);
      } else {
        setErrorMsg('Audio reader could not play. Please verify audio permissions.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeedToggle = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleSelectDocToPlay = (doc: FoodSafetyDoc) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    TTSService.stopCurrentAudio();
    setIsPlaying(false);
    setCurrentDoc(doc);
    onSelectDoc(doc);
  };

  const formatSec = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Player Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/60 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Food Safety Audio Reader
              </span>
              <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Powered by Gemini 3.8 Flash TTS
              </span>
            </div>
          </div>

          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-red-950 text-red-300 border border-red-800/60">
            {currentDoc.code}
          </span>
        </div>

        {/* Current Track Info */}
        <div className="py-4 text-center space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
            {currentDoc.category}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white px-2">
            {currentDoc.title}
          </h2>
          <p className="text-xs text-slate-400 line-clamp-2 max-w-md mx-auto pt-1">
            {currentDoc.summary}
          </p>
        </div>

        {/* Animated Waveform when playing */}
        <div className="py-2 flex items-center justify-center gap-1 h-10">
          {[20, 45, 75, 90, 60, 30, 80, 100, 65, 40, 85, 50, 35, 70, 95, 40].map(
            (height, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlaying
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-700 h-2'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(8, Math.round(height * Math.random()))}px` : '4px',
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            )
          )}
        </div>

        {/* Audio Progress */}
        {duration > 0 && (
          <div className="space-y-1 pt-1">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${(playbackTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{formatSec(playbackTime)}</span>
              <span>{formatSec(duration)}</span>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="pt-3 flex items-center justify-center gap-4">
          <button
            onClick={handleTogglePlay}
            disabled={isLoading}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
            }`}
          >
            {isLoading ? (
              <RotateCcw className="w-6 h-6 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-slate-950" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-1" />
            )}
          </button>
        </div>

        {/* Voice and Speed Selection Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Voice:</span>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as any)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs"
            >
              <option value="Kore">Kore (Auditor)</option>
              <option value="Puck">Puck (Trainer)</option>
              <option value="Fenrir">Fenrir (Inspector)</option>
              <option value="Zephyr">Zephyr (Narrator)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 mr-1">Speed:</span>
            {[0.8, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedToggle(s)}
                className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                  speed === s
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-amber-400 text-center mt-2 font-medium">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Document Queue / Playlist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-red-400" />
            <span>Policy Audio Library ({documents.length} tracks)</span>
          </span>
          <span className="text-[11px] text-slate-400">Tap to queue</span>
        </h3>

        <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto pr-1">
          {documents.map((doc) => {
            const isCurrent = currentDoc.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => handleSelectDocToPlay(doc)}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-red-950/40 text-red-200'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {doc.code}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {doc.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isCurrent && isPlaying ? (
                    <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
