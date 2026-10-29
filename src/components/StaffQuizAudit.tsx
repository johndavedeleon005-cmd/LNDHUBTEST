import React, { useState, useEffect } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  User,
  RefreshCw,
  GraduationCap,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import { TrainingCertificateModal } from './TrainingCertificateModal';
import {
  issueOrUpdateTrainingCertificate,
  resolveStaffCertificateIdentity,
  getLocalCertificates,
} from '../services/authAndUploadService';

interface StaffQuizAuditProps {
  documents: FoodSafetyDoc[];
  readDocIds: string[];
  staffName: string;
  staffEmail?: string;
  setStaffName?: (name: string) => void;
  staffPosition: string;
  setStaffPosition?: (pos: string) => void;
  staffBranch: string;
  setStaffBranch?: (branch: string) => void;
  onOpenDoc: (doc: FoodSafetyDoc) => void;
  onOpenWelcomeModal?: () => void;
  isMasterAccount?: boolean;
  onOpenMasterHub?: (serialCode?: string) => void;
}

export const StaffQuizAudit: React.FC<StaffQuizAuditProps> = ({
  documents,
  readDocIds,
  staffName,
  staffEmail: propStaffEmail,
  staffPosition,
  staffBranch,
  onOpenWelcomeModal,
  isMasterAccount = false,
  onOpenMasterHub,
}) => {
  const identity = resolveStaffCertificateIdentity({
    staffName,
    staffEmail: propStaffEmail,
    staffPosition,
    staffBranch,
  });
  const staffEmail = identity.staffEmail;
  const existingLocalCert = getLocalCertificates().find(
    (c) =>
      c.id === identity.certId ||
      c.staffEmail.toLowerCase() === identity.staffEmail.toLowerCase()
  );
  const officialSerial = existingLocalCert?.serialCode || identity.serialCode;
  const [copiedSerial, setCopiedSerial] = useState(false);

  // Aggregate all quiz questions across all documents
  const allQuestions = documents.flatMap((d) =>
    (d.quizQuestions || []).map((q) => ({
      ...q,
      docCode: d.code,
      docTitle: d.title,
    }))
  );

  const [activeQuizQuestions, setActiveQuizQuestions] = useState(() =>
    allQuestions.slice(0, 10)
  );
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Completed timestamp & history persistence
  const [certCompletedAt, setCertCompletedAt] = useState<string>(() => {
    try {
      return localStorage.getItem('ikqa_cert_completed_at') || '';
    } catch {
      return '';
    }
  });
  const [hasPassedHistory, setHasPassedHistory] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ikqa_has_passed_quiz') === 'true';
    } catch {
      return false;
    }
  });
  const [lastPassedScore, setLastPassedScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ikqa_last_passed_score');
      return saved ? parseInt(saved, 10) : 10;
    } catch {
      return 10;
    }
  });

  const readPercentage = Math.round((readDocIds.length / documents.length) * 100);

  const calculateScore = () => {
    let s = 0;
    activeQuizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answerIndex) s++;
    });
    return s;
  };

  const score = calculateScore();
  const passed = score >= 8; // 8 out of 10 to pass

  // Record pass result and register single official certificate in Master Hub when submitted
  useEffect(() => {
    if (isSubmitted && passed) {
      const timestamp = new Date().toISOString();
      setCertCompletedAt(timestamp);
      setHasPassedHistory(true);
      setLastPassedScore(score);
      try {
        localStorage.setItem('ikqa_has_passed_quiz', 'true');
        localStorage.setItem('ikqa_last_passed_score', String(score));
        localStorage.setItem('ikqa_cert_completed_at', timestamp);
      } catch (e) {
        console.error(e);
      }

      issueOrUpdateTrainingCertificate({
        staffName: identity.staffName,
        staffEmail,
        staffPosition: identity.staffPosition,
        staffBranch: identity.staffBranch,
        quizTitle: 'Food Safety, SOP & Operational Compliance Competency Assessment',
        score,
        totalQuestions: 10,
        issuedAt: timestamp,
        serialCode: officialSerial,
      }).catch(() => {});
    }
  }, [
    isSubmitted,
    passed,
    score,
    identity.staffName,
    staffEmail,
    identity.staffPosition,
    identity.staffBranch,
    officialSerial,
  ]);

  const handleRestartQuiz = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setActiveQuizQuestions(shuffled.slice(0, 10));
    setUserAnswers({});
    setIsSubmitted(false);
  };

  const hasEarnedSingleCertificate =
    hasPassedHistory || (isSubmitted && passed) || !!existingLocalCert;
  const effectiveCertScore =
    isSubmitted && passed ? score : existingLocalCert?.score || lastPassedScore;

  // Ensure any earned certificate displayed on this page is synced to the Master Hub registry on mount
  useEffect(() => {
    if (hasEarnedSingleCertificate) {
      issueOrUpdateTrainingCertificate({
        staffName: identity.staffName,
        staffEmail,
        staffPosition: identity.staffPosition,
        staffBranch: identity.staffBranch,
        quizTitle: 'Food Safety, SOP & Operational Compliance Competency Assessment',
        score: effectiveCertScore,
        totalQuestions: 10,
        issuedAt: certCompletedAt || existingLocalCert?.issuedAt || new Date().toISOString(),
        serialCode: officialSerial,
      }).catch(() => {});
    }
  }, [
    hasEarnedSingleCertificate,
    identity.staffName,
    staffEmail,
    identity.staffPosition,
    identity.staffBranch,
    effectiveCertScore,
    certCompletedAt,
    existingLocalCert?.issuedAt,
    officialSerial,
  ]);

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Staff ID, Position & Branch Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-red-400" />
              <span>Staff Compliance &amp; Certificate Identity (Sign-In Locked)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                Recorded from your Sign-In Account for your single official certificate. Staff cannot edit Name or Position — only the Master Account can modify via the Master Hub.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isMasterAccount && onOpenMasterHub && (
              <button
                type="button"
                onClick={() => onOpenMasterHub(officialSerial)}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Verify Certificates &amp; Edit Profiles in Master Hub</span>
              </button>
            )}
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40">
              Audit Ready
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between mb-1">
              <span>Employee Full Name (For Certificate):</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            </label>
            <div
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white flex items-center justify-between select-none"
              title="Recorded on Sign-In Page — Only Master Account can change via Master Hub"
            >
              <span className="truncate">{staffName || 'Staff Member'}</span>
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between mb-1">
              <span>Position / Designation (For Certificate):</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            </label>
            <div
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white flex items-center justify-between select-none"
              title="Recorded on Sign-In Page — Only Master Account can change via Master Hub"
            >
              <span className="truncate">{staffPosition || 'Restaurant Staff'}</span>
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between mb-1">
              <span>Branch / Store Location:</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            </label>
            <div
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white flex items-center justify-between select-none"
              title="Recorded on Sign-In Page — Only Master Account can change via Master Hub"
            >
              <span className="truncate">{staffBranch || 'Jiangnan Hotpot'}</span>
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Read Progress Bar */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Policy Review Progress</span>
            <span className="font-mono font-bold text-red-400">
              {readDocIds.length} / {documents.length} ({readPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${readPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* SINGLE OFFICIAL SYSTEM CERTIFICATE CARD (Consolidated so only 1 certificate is ever shown) */}
      {hasEarnedSingleCertificate && (
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950/40 border-2 border-emerald-500/70 rounded-2xl p-5 sm:p-6 text-center space-y-3.5 shadow-2xl animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/80">
            <Award className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Single Official Competency Certificate Issued
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(officialSerial).catch(() => {});
                  setCopiedSerial(true);
                  setTimeout(() => setCopiedSerial(false), 2000);
                }}
                className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-600/60 inline-flex items-center gap-1.5 cursor-pointer"
                title="Click to copy Certificate Serial Code"
              >
                <span>Verification Serial: {officialSerial}</span>
                {copiedSerial ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-amber-400" />
                )}
              </button>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white pt-1">
              Food Safety &amp; SOP Compliance Certified!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              <strong className="text-white">{staffName || 'Staff Member'}</strong> (
              {staffPosition || 'Kitchen Shift Lead'}) at{' '}
              <span className="text-amber-300">{staffBranch || 'Jiangnan Hotpot'}</span> holds the official verified certificate with a passing score of{' '}
              <strong className="text-emerald-400">
                {effectiveCertScore}/10 ({effectiveCertScore * 10}%)
              </strong>
              .
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCertModalOpen(true)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/70 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>View &amp; Print Official Certificate (1 Copy)</span>
            </button>

            {isMasterAccount && onOpenMasterHub && (
              <button
                type="button"
                onClick={() => onOpenMasterHub(officialSerial)}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verify Certificate in Master Hub</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* The Learning and Development Team Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>The Learning and Development Team</span>
          </h2>
          <span className="text-[11px] font-bold text-red-400">
            Imperial Kitchen Group
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* L&D Manager */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-red-900/30 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                Learning and Development Manager
              </span>
              <span className="text-sm font-bold text-white">Joy Bernardo</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Department Leadership &amp; Standards
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700/40">
              Leadership
            </span>
          </div>

          {/* L&D Specialists */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-900/30 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Learning and Development Specialist
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">John Dave De Leon</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50">
                  FSCO
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Food Safety Compliance &amp; Kitchen Standards
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/40">
              FSCO
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-900/30 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Learning and Development Specialist
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">Lany Ann Nemenzo</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50">
                  FSCO
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Service Standards and Operational Sequences
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/40">
              FSCO
            </span>
          </div>

          {/* L&D Coordinator */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Learning and Development Training Coordinator
              </span>
              <span className="text-sm font-bold text-white">Dice Divine Torralba</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Training Administration, Scheduling &amp; Assessment Records
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Records
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Confidentiality Agreement Active • Internal Staff Training Only</span>
          </div>
          {onOpenWelcomeModal && (
            <button
              onClick={onOpenWelcomeModal}
              className="text-amber-400 font-bold hover:underline ml-2 flex-shrink-0"
            >
              Read Agreement
            </button>
          )}
        </div>
      </div>

      {/* Comprehensive 10-Question Shift Quiz */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Shift Compliance Assessment (10 Questions)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pass score is 8/10 to verify operational readiness and issue your single official certificate.
            </p>
          </div>

          <button
            onClick={handleRestartQuiz}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>New Questions</span>
          </button>
        </div>

        <div className="space-y-4">
          {activeQuizQuestions.map((q, idx) => {
            const selectedOpt = userAnswers[idx];
            const isCorrect = selectedOpt === q.answerIndex;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-red-400 font-bold">{q.docCode}</span>
                  <span>Question {idx + 1} of 10</span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                  {q.question}
                </h4>

                <div className="space-y-1.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    let btnStyle = 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700';

                    if (isSubmitted) {
                      if (optIdx === q.answerIndex) {
                        btnStyle = 'bg-emerald-950/80 text-emerald-200 border-emerald-700 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-red-950/80 text-red-200 border-red-700 font-medium';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-red-950 text-red-200 border-red-700 font-bold';
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isSubmitted}
                        onClick={() => setUserAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isSubmitted && optIdx === q.answerIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div
                    className={`p-2 rounded-lg text-[11px] mt-1 ${
                      isCorrect
                        ? 'bg-emerald-950/40 text-emerald-300'
                        : 'bg-red-950/40 text-red-300'
                    }`}
                  >
                    <strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
          {!isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(true)}
              disabled={Object.keys(userAnswers).length === 0}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Submit Assessment
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-white">
                Final Score: {score} / 10 ({score >= 8 ? 'Passed — Certificate Updated Above' : 'Needs Review'})
              </span>
              <button
                onClick={handleRestartQuiz}
                className="text-xs text-red-400 hover:underline font-semibold cursor-pointer"
              >
                Retake Assessment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Single Official System Training Certificate Modal */}
      <TrainingCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        staffName={staffName}
        staffEmail={staffEmail}
        staffPosition={staffPosition}
        staffBranch={staffBranch}
        quizTitle="Food Safety, SOP & Operational Compliance Competency Assessment"
        score={effectiveCertScore}
        totalQuestions={10}
        completedAt={certCompletedAt}
        serialCode={officialSerial}
      />
    </div>
  );
};

