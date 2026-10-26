import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Flame,
  Award,
  Users,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Building2,
  X,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface WelcomeTrainingHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasAgreedNDA: boolean;
  onAgreeNDA: () => void;
}

export const WelcomeTrainingHubModal: React.FC<WelcomeTrainingHubModalProps> = ({
  isOpen,
  onClose,
  hasAgreedNDA,
  onAgreeNDA,
}) => {
  const [agreed, setAgreed] = useState(hasAgreedNDA);
  const [attemptedSubmitWithoutAgreement, setAttemptedSubmitWithoutAgreement] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    if (hasAgreedNDA) {
      setAgreed(true);
    }
  }, [hasAgreedNDA]);

  // Ensure the animated L&D video plays continuously like a GIF while the popup is open
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isOpen) {
      vid.muted = true;
      vid.loop = true;
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnterClick = () => {
    if (!agreed && !hasAgreedNDA) {
      setAttemptedSubmitWithoutAgreement(true);
      return;
    }
    if (!hasAgreedNDA) {
      onAgreeNDA();
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={() => {
        // Only allow clicking backdrop to close if NDA is already agreed
        if (hasAgreedNDA) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-red-900 via-red-800 to-amber-900 px-6 py-5 text-white border-b border-red-700/50 flex-shrink-0">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button ONLY if NDA was already signed */}
          {hasAgreedNDA && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/30 hover:bg-black/50 text-slate-300 hover:text-white transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black ring-1 ring-red-400/50 shadow-md flex-shrink-0">
              <img 
                src="./assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp" 
                alt="Jiangnan Hotpot Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                Jiangnan Hotpot • Imperial Kitchen Group
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-950/80 text-red-200 border border-red-700/40">
                Internal Portal
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-amber-300 flex-shrink-0" />
            <span>Welcome to Learning and Development Training Hub!</span>
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm text-red-100/90 leading-relaxed">
            The centralized training, quality assurance, and standard operating procedures platform for all restaurant staff and kitchen professionals.
          </p>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200 text-sm leading-relaxed custom-scrollbar">
          
          {/* Animated L&D Logo Video Showcase (GIF-style continuous loop, un-pausable while modal is open) */}
          <div className="flex flex-col items-center justify-center">
            <div 
              className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-amber-500/50 ring-4 ring-red-900/30 flex items-center justify-center select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              <video
                ref={videoRef}
                src="./assets/aistudio/ANIMATED_LND_LOGO_9bad3066.mp4"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                disablePictureInPicture
                disableRemotePlayback
                onContextMenu={(e) => e.preventDefault()}
                onPause={(e) => {
                  // Prevent pausing while popup is open so it acts strictly like a looping GIF
                  if (isOpen) {
                    e.currentTarget.play().catch(() => {});
                  }
                }}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          </div>

          {/* Mandatory Agreement Gate Notice if not yet signed */}
          {!hasAgreedNDA && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200 leading-relaxed">
                <span className="font-bold text-amber-300 block mb-0.5">Confidentiality Agreement Required</span>
                To protect proprietary culinary and standard operational secrets, all employees must review and accept the Confidentiality & Non-Disclosure Agreement below before accessing the Training Hub.
              </div>
            </div>
          )}

          {/* Purpose Statement */}
          <div className="bg-slate-800/70 rounded-xl p-4 sm:p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2.5 text-amber-400 font-bold text-sm tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>Our Mission & Purpose</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              This hub is developed to help employees improve their operational efficiency, master food safety compliance, uphold five-star culinary standards, and build long-term career growth. By providing instantaneous digital access to our complete Standard Operating Procedures (SOPs), Quality Assurance Policies (IKQAP), practical kitchen checklists, and AI-assisted compliance guidance, this platform empowers every kitchen and service team member to deliver exceptional guest experiences safely, consistently, and with pride.
            </p>

            {/* Pillar highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div className="text-red-400 font-semibold text-xs flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Food Safety Mastery
                </div>
                <div className="text-[11px] text-slate-400">
                  HACCP, allergen defense, FIFO/FEFO storage & strict sanitation controls.
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div className="text-amber-400 font-semibold text-xs flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Standard Operating Procedures
                </div>
                <div className="text-[11px] text-slate-400">
                  Precise portioning, wire slicing, pest control & hygiene discipline.
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5" />
                  Career Excellence
                </div>
                <div className="text-[11px] text-slate-400">
                  Continuous employee audits, skill assessments & knowledge recognition.
                </div>
              </div>
            </div>
          </div>

          {/* The Learning and Development Team */}
          <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/40 to-slate-900 rounded-xl p-4 sm:p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-700/70">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm tracking-wide">
                <Users className="w-4 h-4" />
                <span>The Learning and Development Team</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" />
                Imperial Kitchen Group
              </span>
            </div>

            <div className="space-y-3">
              {/* L&D Manager */}
              <div className="bg-slate-900/80 p-3.5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                    Learning and Development Manager
                  </div>
                  <div className="text-base font-extrabold text-white">
                    Joy Bernardo
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Department Leadership, Training Strategy & Compliance Governance
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700/50 flex-shrink-0">
                  Leadership
                </span>
              </div>

              {/* L&D Specialists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Learning and Development Specialist
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>John Dave De Leon</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50" title="Food Safety Compliance Officer">
                      FSCO
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Food Safety Compliance & Kitchen Standards
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Learning and Development Specialist
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Lany Ann Nemenzo</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50" title="Food Safety Compliance Officer">
                      FSCO
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Service Standards and Operational Sequences
                  </div>
                </div>
              </div>

              {/* L&D Coordinator */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Learning and Development Training Coordinator
                  </div>
                  <div className="text-sm font-bold text-white">
                    Dice Divine Torralba
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Training Administration, Session Scheduling & Staff Assessment Records
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0">
                  Coordination
                </span>
              </div>
            </div>
          </div>

          {/* Confidentiality & Non-Disclosure Agreement */}
          <div 
            className={`rounded-xl p-4 sm:p-5 space-y-3.5 transition-all ${
              attemptedSubmitWithoutAgreement && !agreed
                ? 'bg-red-950/50 border-2 border-red-500 shadow-lg shadow-red-950/60 animate-pulse'
                : hasAgreedNDA
                ? 'bg-slate-950/70 border border-emerald-600/40'
                : 'bg-red-950/30 border-2 border-red-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm tracking-wide">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Confidentiality & Non-Disclosure Agreement</span>
              </div>
              {hasAgreedNDA && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Agreement Signed & Verified</span>
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-slate-950/80 p-3.5 rounded-lg border border-red-900/40 font-mono">
              <p className="font-sans font-medium text-slate-200">
                <strong>STRICT NOTICE:</strong> All Standard Operating Procedures (SOPs), Quality Assurance Policies (IKQAP), proprietary recipes, culinary preparation techniques, hygiene checklists, and audit materials contained within this Hub are proprietary trade secrets of <strong>Imperial Kitchen Group / Jiangnan Hotpot</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1 font-sans text-slate-300 text-[11px]">
                <li>Access is granted strictly for authorized internal employee training and operational guidance.</li>
                <li>Any unauthorized copying, downloading, photographing, screen recording, or transmitting of materials to outside parties is strictly prohibited.</li>
                <li>Breach of this confidentiality agreement will result in immediate administrative disciplinary action, up to termination of employment and legal action under Philippine Intellectual Property and Trade Secret laws.</li>
                <li><strong>Document Security:</strong> Actual document viewing is via store documents. Official physical manuals remain secured in store archives.</li>
              </ul>
            </div>

            {/* Checkbox Section */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={agreed}
                  disabled={hasAgreedNDA}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) {
                      setAttemptedSubmitWithoutAgreement(false);
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-xs text-slate-200 group-hover:text-white transition-colors leading-relaxed">
                  I have read, understood, and solemnly agree to the <strong>Confidentiality & Non-Disclosure Agreement</strong>. I commit to maintaining complete confidentiality and upholding the operational and food safety standards set by the Learning and Development Team.
                </span>
              </label>

              {attemptedSubmitWithoutAgreement && !agreed && (
                <p className="text-xs text-red-400 font-semibold mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  Please check the box above to acknowledge and agree before entering the Hub.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            {hasAgreedNDA ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Access Authorized • Imperial Kitchen Group L&D
              </span>
            ) : (
              <span className="text-slate-400">
                Acceptance is required to unlock the Training Hub
              </span>
            )}
          </div>

          <button
            onClick={handleEnterClick}
            disabled={!agreed && !hasAgreedNDA}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              agreed || hasAgreedNDA
                ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-950/60 active:scale-98 cursor-pointer'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
          >
            {hasAgreedNDA ? (
              <>
                <span>Return to Training Hub</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : agreed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Agree & Enter Training Hub</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Agree to Confidentiality & NDA to Enter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
