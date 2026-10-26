import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FoodSafetyDoc, QuizQuestion } from '../types/foodSafety';
import {
  ArrowLeft,
  FileText,
  Headphones,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldAlert,
  Eye,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Users,
  History,
  HelpCircle,
  Flame,
  Share2,
  Check,
  Store,
  BookOpen,
  Award,
  Search,
  X,
  ChevronRight,
  Link2,
} from 'lucide-react';
import { TTSService } from '../services/ttsService';
import { StoreDocumentLockModal } from './StoreDocumentLockModal';
import { TrainingCertificateModal } from './TrainingCertificateModal';

interface DocumentViewerProps {
  doc: FoodSafetyDoc;
  onBack: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  isRead: boolean;
  onToggleRead: (id: string) => void;
  staffName: string;
  staffPosition?: string;
  staffBranch?: string;
  onOpenPdfModal: (doc: FoodSafetyDoc) => void;
  allDocuments?: FoodSafetyDoc[];
  onSelectDoc?: (doc: FoodSafetyDoc) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  doc,
  onBack,
  isBookmarked,
  onToggleBookmark,
  isRead,
  onToggleRead,
  staffName,
  staffPosition = 'Kitchen Shift Lead',
  staffBranch = 'Jiangnan Hotpot - SM Mall of Asia',
  onOpenPdfModal,
  allDocuments = [],
  onSelectDoc,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'pdf' | 'quiz' | 'signatories'>('text');
  const [relatedSearchQuery, setRelatedSearchQuery] = useState('');

  // Reset quiz & search when switching documents
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setRelatedSearchQuery('');
  }, [doc.id]);

  // Compute related documents based on search query or shared category/tags
  const relatedDocuments = useMemo(() => {
    const others = allDocuments.filter((d) => d.id !== doc.id);
    const q = relatedSearchQuery.trim().toLowerCase();

    if (q) {
      return others
        .filter((d) => {
          const inCode = d.code.toLowerCase().includes(q);
          const inTitle = d.title.toLowerCase().includes(q);
          const inSummary = d.summary.toLowerCase().includes(q);
          const inCat = d.category.toLowerCase().includes(q);
          const inTags = d.tags.some((t) => t.toLowerCase().includes(q));
          const inTakeaways = d.keyTakeaways.some((t) => t.toLowerCase().includes(q));
          return inCode || inTitle || inSummary || inCat || inTags || inTakeaways;
        })
        .slice(0, 6);
    }

    // Score by shared category and shared tags
    return [...others]
      .map((candidate) => {
        let score = 0;
        if (candidate.category === doc.category) score += 5;
        const sharedTags = candidate.tags.filter((t) =>
          doc.tags.some((dt) => dt.toLowerCase() === t.toLowerCase())
        ).length;
        score += sharedTags * 2;
        if (candidate.type === 'guide') score += 1;
        return { doc: candidate, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.doc);
  }, [allDocuments, doc, relatedSearchQuery]);

  // TTS State
  const [ttsLoading, setTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Fenrir' | 'Zephyr'>('Kore');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quiz & Certificate state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // Cleanup audio on unmount or doc change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      TTSService.stopCurrentAudio();
    };
  }, [doc.id]);

  // Handle TTS Play/Pause
  const handleToggleAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && !audioRef.current.ended) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setTtsLoading(true);
    setTtsError(null);

    try {
      // Prepare text to read: title + summary + key takeaways
      const textToRead = `${doc.code}: ${doc.title}. ${doc.summary} Key requirements: ${doc.keyTakeaways.join('. ')}`;

      const audioSrc = await TTSService.generateSpeech({
        text: textToRead,
        voice: selectedVoice,
        style: 'Clear, authoritative, and helpful food safety compliance officer',
      });

      const audio = new Audio(audioSrc);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setTtsError('Audio playback error, attempting voice synthesis fallback...');
        TTSService.playWebSpeechFallback(textToRead, () => setIsPlaying(false));
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.warn('Gemini TTS server call failed, using Web Speech API fallback:', err);
      setTtsError('Switched to device voice reader');
      const textToRead = `${doc.code}: ${doc.title}. ${doc.summary}`;
      const success = TTSService.playWebSpeechFallback(textToRead, () => setIsPlaying(false));
      if (success) {
        setIsPlaying(true);
      } else {
        setTtsError('Audio playback unavailable.');
      }
    } finally {
      setTtsLoading(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleQuizSelect = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateQuizScore = () => {
    if (!doc.quizQuestions) return { score: 0, total: 0 };
    let correct = 0;
    doc.quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answerIndex) correct++;
    });
    return { score: correct, total: doc.quizQuestions.length };
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-slate-100 animate-fadeIn">
      {/* Top sticky navigation bar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-2 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-red-400" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Copy document link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onToggleBookmark(doc.id)}
            className={`p-2 rounded-xl transition-colors ${
              isBookmarked
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Bookmarked' : 'Add to shift bookmarks'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Locked Original Document Button */}
          <button
            onClick={() => {
              setIsLockModalOpen(true);
              onOpenPdfModal(doc);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 text-xs font-semibold active:scale-95 transition-all shadow-sm"
            title="Actual document viewing is via store documents"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Original Doc</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-900/60 border border-amber-700/60">
              Locked
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Strictly Confidential Security Banner */}
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-700/60 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-red-200 shadow-sm select-none">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
            <span className="font-bold tracking-tight text-[11px] sm:text-xs">
              CONFIDENTIAL & PROPRIETARY • Imperial Kitchen Group Inc.
            </span>
          </div>
          <span className="text-[10px] text-red-300 font-mono font-semibold hidden sm:inline px-2 py-0.5 rounded bg-red-950/60 border border-red-800/40">
            Internal Staff Use Only • No Download / Copying
          </span>
        </div>

        {/* Official Document Header Badge */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-red-950/30 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top row with stamps */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <Flame className="w-4 h-4 text-red-400 fill-red-400" />
              </div>
              <div>
                <span className="text-xs font-black tracking-wide text-white block">
                  IMPERIAL KITCHEN GROUP INC.
                </span>
                <span className="text-[10px] text-red-300 font-semibold">
                  Jiangnan Hotpot Compliance Standard
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-red-900/80 text-red-200 border border-red-700/60 shadow-inner">
                {doc.code}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                Rev {doc.revision}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Document Title & Metadata */}
          <div className="mt-3">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {doc.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
              <span>Category: <strong className="text-slate-200">{doc.category}</strong></span>
              <span>Effective Date: <strong className="text-slate-200">{doc.effectiveDate}</strong></span>
              <span>Type: <strong className="text-red-400 capitalize">{doc.type}</strong></span>
            </div>
          </div>

          {/* Summary Box */}
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {doc.summary}
          </p>

          {/* TTS Player Widget */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-red-950/20 p-3 rounded-xl border border-red-900/30">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleAudio}
                disabled={ttsLoading}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 flex-shrink-0 ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                title={isPlaying ? 'Pause Audio' : 'Play with Gemini 3.8 Flash TTS'}
              >
                {ttsLoading ? (
                  <RotateCcw className="w-5 h-5 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-slate-950" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gemini 3.8 Flash TTS Audio</span>
                  </span>
                  {isPlaying && (
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-amber-400 animate-pulse rounded-full" />
                      <span className="w-1 h-4 bg-amber-400 animate-pulse delay-75 rounded-full" />
                      <span className="w-1 h-2 bg-amber-400 animate-pulse delay-150 rounded-full" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {isPlaying ? 'Playing policy audio...' : 'Listen to full policy summary & requirements'}
                </p>
                {ttsError && <p className="text-[10px] text-amber-400 mt-0.5">{ttsError}</p>}
              </div>
            </div>

            {/* Voice & Speed controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as any)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-red-500"
                title="Select Voice Persona"
              >
                <option value="Kore">Voice: Kore (Auditor)</option>
                <option value="Puck">Voice: Puck (Trainer)</option>
                <option value="Fenrir">Voice: Fenrir (Inspector)</option>
                <option value="Zephyr">Voice: Zephyr (Narrator)</option>
              </select>

              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px]">
                {[1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-1.5 py-0.5 rounded font-mono ${
                      playbackSpeed === speed
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSubTab('text')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'text'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Policy Text</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('pdf');
              setIsLockModalOpen(true);
            }}
            className={`flex-1 min-w-[105px] py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'pdf'
                ? 'bg-amber-600 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Official PDF 🔒</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'quiz'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz & Test</span>
          </button>

          <button
            onClick={() => setActiveSubTab('signatories')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'signatories'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Signatories</span>
          </button>
        </div>

        {/* SUBTAB 1: Formatted Document Text */}
        {activeSubTab === 'text' && (
          <div className="space-y-4">
            {/* Quick Rules Section */}
            {doc.quickRules && doc.quickRules.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Immediate Floor Compliance Rules</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {doc.quickRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col justify-between ${
                        rule.type === 'critical'
                          ? 'bg-red-950/40 border-red-800/60 text-red-100'
                          : rule.type === 'warning'
                          ? 'bg-amber-950/40 border-amber-800/60 text-amber-100'
                          : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-100'
                      }`}
                    >
                      <span className="font-bold text-xs mb-1 flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rule.type === 'critical'
                              ? 'bg-red-500'
                              : rule.type === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                        />
                        {rule.title}
                      </span>
                      <p className="text-xs leading-relaxed opacity-90">{rule.rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Key Compliance Takeaways for Staff</span>
              </h3>
              <ul className="space-y-2">
                {doc.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tables if any */}
            {doc.tables &&
              doc.tables.map((table, tIdx) => (
                <div key={tIdx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-400" />
                    <span>{table.title}</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800/90 border-b border-slate-700 text-slate-300 font-bold">
                          {table.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2.5">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 align-top">
                                {typeof cell === 'string' ? (
                                  cell
                                ) : (
                                  <span
                                    className="px-2 py-0.5 rounded text-[11px] font-semibold"
                                    style={{
                                      backgroundColor: cell.bg || '#1e293b',
                                      color: cell.color || '#f8fafc',
                                    }}
                                  >
                                    {cell.text}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

            {/* Sections Accordion / Clean Articles */}
            <div className="space-y-3">
              {doc.sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-2.5"
                >
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-red-600 rounded-full" />
                    <span>{section.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>

                  {section.bulletPoints && section.bulletPoints.length > 0 && (
                    <div className="mt-3 space-y-1.5 pl-2 border-l-2 border-slate-800">
                      {section.bulletPoints.map((pt, pIdx) => (
                        <div key={pIdx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className="text-red-400 font-bold">•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Staff Compliance Acknowledgment Box */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-800/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Mandatory Policy Read & Sign-Off</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Confirm that you have reviewed and will comply with all instructions in {doc.code}.
                </p>
              </div>

              <button
                onClick={() => onToggleRead(doc.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 ${
                  isRead
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isRead ? 'text-white' : 'text-slate-400'}`} />
                <span>{isRead ? 'Signed & Acknowledged' : 'Mark as Read & Understood'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Original Official PDF Preview - LOCKED */}
        {activeSubTab === 'pdf' && (
          <div className="bg-slate-900 border-2 border-amber-800/50 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-xl relative overflow-hidden">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-950/60 ring-1 ring-amber-400/30">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-2.5 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[11px] font-mono font-bold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Feature Locked • Store Document Policy</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-amber-300 tracking-tight">
                &ldquo;Actual document viewing is via store documents&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Direct digital display and downloading of the original source document for{' '}
                <strong className="text-white font-mono">{doc.code}: {doc.title}</strong> has been locked to protect proprietary information.
              </p>
            </div>

            {/* Step-by-step notice card */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-lg mx-auto text-left space-y-2.5 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Official Physical Copy Location:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Official signed, stamped, and verified original copies are maintained on-site in the{' '}
                <strong className="text-white">Store Quality Assurance Compliance Binder</strong> kept inside the Store Manager&apos;s office.
              </p>
              <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>Contact your Shift Supervisor or QA Officer for physical binder access.</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setActiveSubTab('text')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Return to Policy Text & Rules</span>
              </button>

              <button
                onClick={() => setIsLockModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 font-bold text-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>View Lock Notice</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Policy Knowledge Check / Quiz */}
        {activeSubTab === 'quiz' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>Knowledge Check: {doc.code}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Answer these questions to test your compliance knowledge on the floor.
              </p>
            </div>

            {doc.quizQuestions && doc.quizQuestions.length > 0 ? (
              <div className="space-y-4">
                {doc.quizQuestions.map((q, qIdx) => {
                  const selectedOpt = quizAnswers[qIdx];
                  const isAnswered = selectedOpt !== undefined;
                  const isCorrect = selectedOpt === q.answerIndex;

                  return (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2.5"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                        {qIdx + 1}. {q.question}
                      </h4>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isThisSelected = selectedOpt === optIdx;
                          let optStyle =
                            'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700';

                          if (quizSubmitted) {
                            if (optIdx === q.answerIndex) {
                              optStyle = 'bg-emerald-950/80 text-emerald-200 border-emerald-700 font-bold';
                            } else if (isThisSelected && !isCorrect) {
                              optStyle = 'bg-red-950/80 text-red-200 border-red-700 font-medium';
                            }
                          } else if (isThisSelected) {
                            optStyle = 'bg-red-950/70 text-red-200 border-red-700 font-bold';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleQuizSelect(qIdx, optIdx)}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && optIdx === q.answerIndex && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div
                          className={`p-2.5 rounded-lg text-xs mt-2 ${
                            isCorrect
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                              : 'bg-red-950/40 text-red-300 border border-red-800/40'
                          }`}
                        >
                          <strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white">
                        Score: {calculateQuizScore().score} / {calculateQuizScore().total}
                      </div>
                      {calculateQuizScore().score >= Math.ceil(calculateQuizScore().total * 0.7) && (
                        <button
                          onClick={() => setIsCertModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Award className="w-3.5 h-3.5 text-slate-950" />
                          <span>View Training Certificate</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        className="text-xs text-red-400 hover:underline font-semibold flex items-center gap-1 ml-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Quiz</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Quiz questions for this policy are being updated by Learning & Development.
              </p>
            )}
          </div>
        )}

        {/* SUBTAB 4: Signatories & Revision History */}
        {activeSubTab === 'signatories' && (
          <div className="space-y-4">
            {/* Signatories Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                <span>Authorized Document Signatories</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Prepared By
                  </span>
                  <p className="text-xs font-bold text-white">{doc.signatories.preparedBy}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Reviewed By
                  </span>
                  <ul className="text-xs text-slate-300 space-y-0.5">
                    {doc.signatories.reviewedBy.map((rev, i) => (
                      <li key={i}>{rev}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Approved By
                  </span>
                  <p className="text-xs font-bold text-emerald-400">{doc.signatories.approvedBy}</p>
                </div>
              </div>
            </div>

            {/* Change History Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Document Revision History</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-700 text-slate-300 font-bold">
                      <th className="p-2">Rev</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Author & Position</th>
                      <th className="p-2">Purpose of Revision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {doc.changeHistory.map((ch, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-mono font-bold text-red-400">{ch.rev}</td>
                        <td className="p-2 whitespace-nowrap text-slate-400">{ch.date}</td>
                        <td className="p-2 font-medium">{ch.author}</td>
                        <td className="p-2 text-slate-300">{ch.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Quick-Access Related Documents Search Bar & Recommendations */}
        {allDocuments.length > 0 && onSelectDoc && (
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-red-400" />
                  <span>Quick-Access Search for Related Documents</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Search any related SOP, Policy, or Regulatory Guide (or select a related document in{' '}
                  <strong className="text-slate-200">{doc.category}</strong>)
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 self-start sm:self-auto">
                {relatedDocuments.length} Related Found
              </span>
            </div>

            {/* Quick-access search input inside DocumentViewer */}
            <div className="relative">
              <Search className="w-4 h-4 text-red-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={relatedSearchQuery}
                onChange={(e) => setRelatedSearchQuery(e.target.value)}
                placeholder={`Search documents related to ${doc.code} (e.g., RA 10611, temperature, handwash, FEFO)...`}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/80 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              {relatedSearchQuery && (
                <button
                  onClick={() => setRelatedSearchQuery('')}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick filter tag pills from current document tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap mr-1">
                  Related Tags:
                </span>
                {doc.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setRelatedSearchQuery((prev) => (prev === tag ? '' : tag))
                    }
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap border transition-all ${
                      relatedSearchQuery.toLowerCase() === tag.toLowerCase()
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-red-500/50 hover:text-white'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Related Document Cards */}
            {relatedDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {relatedDocuments.map((relDoc) => (
                  <button
                    key={relDoc.id}
                    onClick={() => onSelectDoc(relDoc)}
                    className="text-left p-3 rounded-xl bg-slate-950/90 hover:bg-slate-800/80 border border-slate-800/90 hover:border-red-500/40 transition-all flex items-start justify-between gap-2.5 group"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            relDoc.type === 'policy'
                              ? 'bg-red-950/80 text-red-300 border-red-800/60'
                              : relDoc.type === 'sop'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {relDoc.code}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {relDoc.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">
                        {relDoc.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {relDoc.summary}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800/60">
                No matching related documents found for &ldquo;{relatedSearchQuery}&rdquo;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Store Document Lock Notice Modal */}
      <StoreDocumentLockModal
        isOpen={isLockModalOpen}
        doc={doc}
        onClose={() => setIsLockModalOpen(false)}
        onReadDigitalText={() => setActiveSubTab('text')}
      />

      {/* Official System Training Certificate Modal */}
      <TrainingCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        staffName={staffName}
        staffPosition={staffPosition}
        staffBranch={staffBranch}
        quizTitle={`${doc.code}: ${doc.title}`}
        score={calculateQuizScore().score}
        totalQuestions={calculateQuizScore().total}
      />
    </div>
  );
};
