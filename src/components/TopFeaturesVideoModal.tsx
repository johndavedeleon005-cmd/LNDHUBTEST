import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Film,
  Download,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Zap,
  Gamepad2,
  Headphones,
  Award,
  Sparkles,
  Crown,
  Cpu,
  CheckCircle2,
  ExternalLink,
  Maximize2,
  Minimize2,
  Video,
} from 'lucide-react';

export interface FeatureVideoScene {
  id: string;
  chapterNumber: string;
  title: string;
  subtitle: string;
  category: string;
  durationSec: number;
  accentHex: string;
  secondaryHex: string;
  badgeText: string;
  narrationText: string;
  highlights: string[];
  metrics: { label: string; value: string }[];
  targetTab?: 'library' | 'quickref' | 'game' | 'audio' | 'audit' | 'assistant' | 'master' | 'it';
  ctaLabel?: string;
}

export const TOP_FEATURE_SCENES: FeatureVideoScene[] = [
  {
    id: 'scene-library',
    chapterNumber: '01',
    title: 'Centralized SOP, Policy & Checklist Library',
    subtitle: 'Instantaneous Digital Access to 34+ Official Compliance Documents',
    category: 'Operations & Compliance Core',
    durationSec: 6,
    accentHex: '#ef4444',
    secondaryHex: '#f59e0b',
    badgeText: 'RA 10611 & PD 856 COMPLIANT',
    narrationText:
      'Chapter 1: Centralized SOP, Policy, and Checklist Library. Instant access to over 34 official Imperial Kitchen Group policies, standard operating procedures, operational guides, and station checklists.',
    highlights: [
      '21 Official IKQAP Food Safety Policies & 12 Core Kitchen SOPs',
      'Smart Ctrl+K Quick Search with tag, code, and category filtering',
      'Interactive PDF viewer, read-receipt tracking & saved bookmarks',
    ],
    metrics: [
      { label: 'Official Docs', value: '34+ Active' },
      { label: 'Compliance', value: 'RA 10611 / HACCP' },
      { label: 'Cloud Sync', value: 'Real-Time' },
    ],
    targetTab: 'library',
    ctaLabel: 'Explore SOP Library',
  },
  {
    id: 'scene-quickref',
    chapterNumber: '02',
    title: 'Critical Control Quick-Reference Cards',
    subtitle: 'At-a-Glance Kitchen Temperatures, Towel Colors & Storage Hierarchy',
    category: 'Kitchen Floor Reference',
    durationSec: 6,
    accentHex: '#f59e0b',
    secondaryHex: '#ef4444',
    badgeText: 'CRITICAL CONTROL POINTS',
    narrationText:
      'Chapter 2: Critical Control Quick Reference Cards. At-a-glance kitchen standards including the 5 to 60 degrees Celsius Temperature Danger Zone, the 4-color coding towel system, and 5-tier cold room storage hierarchy.',
    highlights: [
      'Temperature Danger Zone (5°C – 60°C) & Cold Chain Receiving Logs',
      '4-Color Microfiber Towel Matrix (Green, Blue, Yellow, Red)',
      '5-Tier Chiller Storage Hierarchy & 20-Second Handwashing Protocol',
    ],
    metrics: [
      { label: 'Chiller Target', value: '0°C to 4°C' },
      { label: 'Freezer Target', value: '≤ -18°C' },
      { label: 'Hot Holding', value: '≥ 60°C' },
    ],
    targetTab: 'quickref',
    ctaLabel: 'Open Quick Reference',
  },
  {
    id: 'scene-games',
    chapterNumber: '03',
    title: 'Interactive Simulators & 8-Bit Safety Arcade',
    subtitle: 'Hands-On FOH Receptionist Shift Simulator & BOH Hazard Spotter',
    category: 'Gamified Staff Training',
    durationSec: 6,
    accentHex: '#10b981',
    secondaryHex: '#f59e0b',
    badgeText: 'INTERACTIVE SIMULATIONS',
    narrationText:
      'Chapter 3: Interactive Simulators and 8-Bit Safety Arcade. Train front-of-house staff with the Receptionist Station Checklist Simulator and test back-of-house teams with the 8-bit Spot the Hazard arcade game.',
    highlights: [
      'FOH Receptionist Simulator: Opening, Peak Shift & Closing Shifts',
      '8-Bit Kitchen Safety Arcade: Spot BOH cross-contamination & hazards',
      'Supports custom station checklists uploaded by Master Accounts',
    ],
    metrics: [
      { label: 'FOH Shifts', value: 'Opening / Peak / Close' },
      { label: 'Arcade Mode', value: '8-Bit BOH Audit' },
      { label: 'Scoring', value: 'Live Combo & XP' },
    ],
    targetTab: 'game',
    ctaLabel: 'Play Training Simulators',
  },
  {
    id: 'scene-audio',
    chapterNumber: '04',
    title: 'Hands-Free Audio SOP & Policy Reader',
    subtitle: 'Voice-Synthesized Training Playback for Active Kitchen Prep',
    category: 'Accessibility & Audio Learning',
    durationSec: 5,
    accentHex: '#3b82f6',
    secondaryHex: '#06b6d4',
    badgeText: 'HANDS-FREE TTS STUDIO',
    narrationText:
      'Chapter 4: Hands-Free Audio SOP and Policy Reader. Staff can listen to complete Standard Operating Procedures, key takeaways, and hygiene rules with adjustable playback speed.',
    highlights: [
      'One-tap Text-to-Speech narration for every SOP, Policy, and Guide',
      'Adjustable reading speed (0.75x to 1.5x) and voice selection',
      'Queue full department playlists for pre-shift huddles',
    ],
    metrics: [
      { label: 'Audio Coverage', value: '100% of Docs' },
      { label: 'Speed Control', value: '0.75x – 1.5x' },
      { label: 'Mode', value: 'Hands-Free Prep' },
    ],
    targetTab: 'audio',
    ctaLabel: 'Launch Audio Reader',
  },
  {
    id: 'scene-certificates',
    chapterNumber: '05',
    title: 'Certification Exam & Verifiable Serial Registry',
    subtitle: 'Locked Official Staff Credentials & Master-Verified Serial Codes',
    category: 'Assessment & Governance',
    durationSec: 6,
    accentHex: '#eab308',
    secondaryHex: '#10b981',
    badgeText: 'VERIFIABLE CERTIFICATES',
    narrationText:
      'Chapter 5: Certification Exam and Verifiable Serial Registry. Staff accounts lock registered names and positions for tamper-proof certificates issued with unique IKG-JN serial codes.',
    highlights: [
      'Single canonical certificate per staff member with unique serial code',
      'Tamper-proof name, branch & position locked from staff sign-in profile',
      'Instant lookup & verification inside the Master Admin Hub',
    ],
    metrics: [
      { label: 'Serial Format', value: 'IKG-JN-YYYY-XXXX' },
      { label: 'Identity Lock', value: 'Master Controlled' },
      { label: 'Verification', value: 'Cloud Registry' },
    ],
    targetTab: 'audit',
    ctaLabel: 'Open Certification Quiz',
  },
  {
    id: 'scene-master-hub',
    chapterNumber: '06',
    title: 'Master Admin Governance & Document Hub',
    subtitle: 'Centralized Staff Approvals, Custom SOP Publishing & Certificate Verification',
    category: 'Enterprise Governance',
    durationSec: 6,
    accentHex: '#f59e0b',
    secondaryHex: '#ef4444',
    badgeText: 'MASTER ADMIN HUB',
    narrationText:
      'Chapter 6: Master Admin Governance and Document Hub. Approve staff accounts in real time, publish custom SOPs and checklists, and verify official staff training certificates.',
    highlights: [
      'Real-time staff account approval queue & credential management',
      'AI-powered custom SOP, Policy, Guide & Checklist publisher',
      'Instant certificate serial verification & compliance tracking',
    ],
    metrics: [
      { label: 'Master Account', value: 'IKQA-MASTER' },
      { label: 'Approvals', value: 'Instant Cloud Sync' },
      { label: 'Custom Docs', value: 'Live Publishing' },
    ],
    targetTab: 'master',
    ctaLabel: 'Open Master Hub',
  },
];

interface TopFeaturesVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (
    tab: 'library' | 'quickref' | 'game' | 'audio' | 'audit' | 'assistant' | 'master' | 'it'
  ) => void;
}

export const TopFeaturesVideoModal: React.FC<TopFeaturesVideoModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'canvas_reel' | 'mp4_video'>('canvas_reel');
  const [isPlaying, setIsPlaying] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 1
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecordingWebm, setIsRecordingWebm] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const lastSpokenSceneRef = useRef<string | null>(null);

  const currentScene = TOP_FEATURE_SCENES[sceneIndex] || TOP_FEATURE_SCENES[0];

  // Load logo image for canvas rendering
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = './assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp';
    img.onload = () => {
      logoImgRef.current = img;
    };
  }, []);

  // Optional Web Speech narration when scene changes
  const speakScene = useCallback(
    (scene: FeatureVideoScene) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      if (!voiceEnabled) return;
      const utter = new SpeechSynthesisUtterance(scene.narrationText);
      utter.rate = 1.03;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    },
    [voiceEnabled]
  );

  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    if (voiceEnabled && isPlaying && viewMode === 'canvas_reel') {
      if (lastSpokenSceneRef.current !== currentScene.id) {
        lastSpokenSceneRef.current = currentScene.id;
        speakScene(currentScene);
      }
    } else if (!voiceEnabled || !isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, voiceEnabled, isPlaying, currentScene, viewMode, speakScene]);

  // Advance scene timer
  useEffect(() => {
    if (!isOpen || !isPlaying || viewMode !== 'canvas_reel') return;
    const stepMs = 40;
    const durationMs = currentScene.durationSec * 1000;
    const timer = setInterval(() => {
      setSceneProgress((prev) => {
        const next = prev + stepMs / durationMs;
        if (next >= 1) {
          setSceneIndex((idx) => (idx + 1) % TOP_FEATURE_SCENES.length);
          return 0;
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentScene.durationSec, viewMode]);

  // Render 60fps 16:9 HD Showcase Frame onto HTML5 Canvas
  useEffect(() => {
    if (!isOpen || viewMode !== 'canvas_reel') return;
    let animFrameId: number;
    let startTime = performance.now();

    const renderFrame = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width; // 1280
      const H = canvas.height; // 720
      const elapsedSec = (now - startTime) / 1000;
      const easeIn = Math.min(1, sceneProgress * 4.5);
      const slideUp = (1 - easeIn) * 28;

      // 1. Deep cinematic background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.55, '#0f172a');
      bgGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Ambient animated glow orbs using scene accent colors
      const orbX = W * 0.78 + Math.sin(elapsedSec * 1.4) * 40;
      const orbY = H * 0.35 + Math.cos(elapsedSec * 1.1) * 30;
      const radGrad = ctx.createRadialGradient(orbX, orbY, 20, orbX, orbY, 380);
      radGrad.addColorStop(0, `${currentScene.accentHex}44`);
      radGrad.addColorStop(0.6, `${currentScene.secondaryHex}18`);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle architectural grid lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // 3. Top Header Bar inside video frame
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(48, 36, W - 96, 68);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(48, 36, W - 96, 68);

      if (logoImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(66, 48, 44, 44, 10);
        ctx.clip();
        ctx.drawImage(logoImgRef.current, 66, 48, 44, 44);
        ctx.restore();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 18px sans-serif';
      ctx.fillText('JIANGNAN HOTPOT • IMPERIAL KITCHEN GROUP', 124, 68);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 13px monospace';
      ctx.fillText(
        `OFFICIAL PLATFORM SHOWCASE  ·  CHAPTER ${currentScene.chapterNumber} OF 0${TOP_FEATURE_SCENES.length}`,
        124,
        89
      );

      // Right badge in top bar
      ctx.fillStyle = currentScene.accentHex;
      ctx.beginPath();
      ctx.roundRect(W - 330, 52, 260, 36, 8);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.font = '800 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(currentScene.badgeText, W - 200, 75);
      ctx.textAlign = 'left';

      // 4. Main Left Content Column
      ctx.save();
      ctx.translate(0, slideUp);
      ctx.globalAlpha = easeIn;

      // Category Kicker
      ctx.fillStyle = currentScene.accentHex;
      ctx.font = '800 15px monospace';
      ctx.fillText(
        `FEATURE HIGHLIGHT ${currentScene.chapterNumber}  —  ${currentScene.category.toUpperCase()}`,
        56,
        164
      );

      // Scene Title (Wrapped if needed)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px sans-serif';
      const words = currentScene.title.split(' ');
      let line = '';
      let yCursor = 214;
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > 720 && line !== '') {
          ctx.fillText(line.trim(), 56, yCursor);
          line = word + ' ';
          yCursor += 46;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ctx.fillText(line.trim(), 56, yCursor);
        yCursor += 38;
      }

      // Subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 19px sans-serif';
      ctx.fillText(currentScene.subtitle, 56, yCursor + 6);

      // 3 Feature Highlight Cards
      let cardY = yCursor + 36;
      currentScene.highlights.forEach((point, idx) => {
        const itemProgress = Math.max(0, Math.min(1, (sceneProgress - idx * 0.08) * 4));
        ctx.save();
        ctx.globalAlpha = itemProgress;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(56, cardY, 720, 64, 14);
        ctx.fill();
        ctx.strokeStyle = idx === 0 ? currentScene.accentHex : 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = idx === 0 ? 2 : 1;
        ctx.stroke();

        // Number circle
        ctx.fillStyle = currentScene.accentHex;
        ctx.beginPath();
        ctx.arc(92, cardY + 32, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#020617';
        ctx.font = '900 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`0${idx + 1}`, 92, cardY + 37);
        ctx.textAlign = 'left';

        // Highlight text
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 17px sans-serif';
        ctx.fillText(point, 124, cardY + 38);
        ctx.restore();

        cardY += 78;
      });

      // 5. Right Visual Telemetry / Mockup Card
      const panelX = 816;
      const panelY = 148;
      const panelW = 416;
      const panelH = 440;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 20);
      ctx.fill();
      ctx.strokeStyle = currentScene.accentHex;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Panel Header
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.roundRect(panelX + 16, panelY + 16, panelW - 32, 46, 12);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 14px monospace';
      ctx.fillText('LIVE MODULE SNAPSHOT', panelX + 34, panelY + 44);

      // Metric Boxes inside Right Panel
      currentScene.metrics.forEach((m, mIdx) => {
        const my = panelY + 82 + mIdx * 104;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.roundRect(panelX + 24, my, panelW - 48, 86, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 12px monospace';
        ctx.fillText(m.label.toUpperCase(), panelX + 44, my + 30);

        ctx.fillStyle = mIdx === 0 ? currentScene.accentHex : '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.fillText(m.value, panelX + 44, my + 64);
      });

      // Animated pulse indicator in right panel footer
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(panelX + 38, panelY + panelH - 26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 12px monospace';
      ctx.fillText('IMPERIAL KITCHEN GROUP L&D PORTAL v2026', panelX + 54, panelY + panelH - 22);

      ctx.restore();

      // 6. Bottom Progress Timeline Bar inside video canvas
      const barY = H - 54;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(0, barY, W, 54);

      const totalProgress =
        (sceneIndex + sceneProgress) / TOP_FEATURE_SCENES.length;
      ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
      ctx.fillRect(48, barY + 22, W - 96, 8);

      ctx.fillStyle = currentScene.accentHex;
      ctx.fillRect(48, barY + 22, (W - 96) * totalProgress, 8);

      animFrameId = requestAnimationFrame(renderFrame);
    };

    animFrameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, [isOpen, currentScene, sceneIndex, sceneProgress, viewMode]);

  if (!isOpen) return null;

  const handleSelectChapter = (idx: number) => {
    setSceneIndex(idx);
    setSceneProgress(0);
    lastSpokenSceneRef.current = null;
  };

  const handleRestart = () => {
    setSceneIndex(0);
    setSceneProgress(0);
    setIsPlaying(true);
    lastSpokenSceneRef.current = null;
    if (videoElRef.current) {
      videoElRef.current.currentTime = 0;
      videoElRef.current.play().catch(() => {});
    }
  };

  const handleRecordWebm = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') return;
    try {
      setIsRecordingWebm(true);
      setSceneIndex(0);
      setSceneProgress(0);
      setIsPlaying(true);

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Jiangnan_Hotpot_Top_Features_Highlight.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecordingWebm(false);
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 8000);
    } catch {
      setIsRecordingWebm(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className={`relative w-full ${
          isFullscreen ? 'max-w-6xl' : 'max-w-4xl'
        } bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-red-950/80 to-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                  Official Feature Walkthrough Video
                </span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  6 Chapters · HD 1080p
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                Jiangnan Hotpot L&amp;D Portal — Top Features Highlight Video
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Switch between Interactive Feature Reel & MP4 Video Player */}
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('canvas_reel')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  viewMode === 'canvas_reel'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive HD Video
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mp4_video')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'mp4_video'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>MP4 File Player</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen((p) => !p)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Compact Size' : 'Expand Player'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Video Stage */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 bg-slate-950/60">
          {/* Mobile mode switcher */}
          <div className="flex sm:hidden items-center justify-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('canvas_reel')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === 'canvas_reel'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400'
              }`}
            >
              Interactive HD Video
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mp4_video')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === 'mp4_video'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400'
              }`}
            >
              MP4 File Player
            </button>
          </div>

          {viewMode === 'canvas_reel' ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-black shadow-2xl">
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                onClick={() => setIsPlaying((p) => !p)}
                className="w-full aspect-video block cursor-pointer"
              />

              {/* Transport Controls Overlay Bar */}
              <div className="bg-slate-950/95 border-t border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSelectChapter(
                        (sceneIndex - 1 + TOP_FEATURE_SCENES.length) %
                          TOP_FEATURE_SCENES.length
                      )
                    }
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Previous Feature"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSelectChapter((sceneIndex + 1) % TOP_FEATURE_SCENES.length)
                    }
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    title="Next Feature"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Restart Video"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceEnabled((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                      voiceEnabled
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/50'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title="Toggle Voiceover Narration"
                  >
                    {voiceEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Voiceover ON</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Voiceover OFF</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateTab && currentScene.targetTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab(currentScene.targetTab!);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{currentScene.ctaLabel || 'Try This Feature'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <a
                    href="./assets/aistudio/TOP_FEATURES_SHOWCASE.mp4"
                    download="Jiangnan_Hotpot_Top_Features_Highlight.mp4"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-black shadow-2xl">
              <video
                ref={videoElRef}
                src="./assets/aistudio/TOP_FEATURES_SHOWCASE.mp4"
                controls
                autoPlay
                loop
                playsInline
                className="w-full aspect-video bg-black"
              />
              <div className="bg-slate-950/95 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-medium">
                  Playing standalone MP4 file: <code className="text-amber-300">TOP_FEATURES_SHOWCASE.mp4</code>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRecordWebm}
                    disabled={isRecordingWebm}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isRecordingWebm ? 'Recording Clip...' : 'Export WebM Clip'}
                  </button>
                  <a
                    href="./assets/aistudio/TOP_FEATURES_SHOWCASE.mp4"
                    download="Jiangnan_Hotpot_Top_Features_Highlight.mp4"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Chapter Selector Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-bold text-slate-200">
                Video Chapters — Click any feature to jump directly
              </span>
              <span className="font-mono text-[11px]">
                Chapter {sceneIndex + 1} of {TOP_FEATURE_SCENES.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TOP_FEATURE_SCENES.map((scene, idx) => {
                const isActive = idx === sceneIndex;
                const getIcon = () => {
                  if (idx === 0) return <BookOpen className="w-4 h-4 text-red-400" />;
                  if (idx === 1) return <Zap className="w-4 h-4 text-amber-400" />;
                  if (idx === 2) return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
                  if (idx === 3) return <Headphones className="w-4 h-4 text-blue-400" />;
                  if (idx === 4) return <Award className="w-4 h-4 text-yellow-400" />;
                  return <Cpu className="w-4 h-4 text-cyan-400" />;
                };

                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => {
                      setViewMode('canvas_reel');
                      handleSelectChapter(idx);
                    }}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-slate-800/95 border-amber-500/80 shadow-lg'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] font-bold text-amber-400">
                          CHAPTER {scene.chapterNumber}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Playing
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-white truncate mt-0.5">
                        {scene.title}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {scene.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
