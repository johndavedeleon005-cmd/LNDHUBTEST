import React, { useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  CheckCircle2,
  Printer,
  Share2,
  X,
  ShieldCheck,
  Clock,
  Briefcase,
  Sparkles,
  Lock,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  generateDeterministicCertSerial,
  getSavedSessionUser,
  issueOrUpdateTrainingCertificate,
  getLocalCertificates,
  toDeterministicCertId,
} from '../services/authAndUploadService';
import { CertificateVerificationStatus } from '../types/foodSafety';

// Module-level singleton guard so only ONE certificate modal can ever be rendered at a time
let activeCertificateInstanceId: string | null = null;

interface TrainingCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  staffEmail?: string;
  staffPosition: string;
  staffBranch: string;
  quizTitle?: string;
  score?: number;
  totalQuestions?: number;
  completedAt?: string;
  serialCode?: string;
  verificationStatus?: CertificateVerificationStatus;
  readOnlyPreview?: boolean;
  onUpdateStaffProfile?: (name: string, position: string, branch: string) => void;
}

export const TrainingCertificateModal: React.FC<TrainingCertificateModalProps> = ({
  isOpen,
  onClose,
  staffName,
  staffEmail,
  staffPosition,
  staffBranch,
  quizTitle = 'Food Safety, SOP & Operational Compliance Competency Assessment',
  score = 10,
  totalQuestions = 10,
  completedAt,
  serialCode: propSerialCode,
  verificationStatus: propVerificationStatus,
  readOnlyPreview = false,
}) => {
  const instanceId = useId();
  const [isPrimaryInstance, setIsPrimaryInstance] = useState(false);

  const sessionUser = getSavedSessionUser();
  const lockedName = (staffName || sessionUser?.displayName || 'Staff Member').trim();
  const lockedPosition = (staffPosition || sessionUser?.position || 'Kitchen Shift Lead').trim();
  const lockedBranch = (
    staffBranch ||
    sessionUser?.branch ||
    'Jiangnan Hotpot - SM Mall of Asia'
  ).trim();
  const resolvedEmail = (
    staffEmail ||
    (sessionUser &&
    sessionUser.displayName.toLowerCase() === lockedName.toLowerCase()
      ? sessionUser.email
      : '') ||
    `${lockedName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@jiangnanhotpot.com`
  )
    .trim()
    .toLowerCase();

  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [dateTimeStr, setDateTimeStr] = useState('');
  const [certSerial, setCertSerial] = useState(() =>
    propSerialCode || generateDeterministicCertSerial(resolvedEmail, lockedName)
  );
  const [certStatus, setCertStatus] = useState<CertificateVerificationStatus>(
    propVerificationStatus || 'verified'
  );

  // Enforce singleton so multiple copies of the certificate modal can never mount simultaneously
  useEffect(() => {
    if (isOpen) {
      if (!activeCertificateInstanceId || activeCertificateInstanceId === instanceId) {
        activeCertificateInstanceId = instanceId;
        setIsPrimaryInstance(true);
      } else {
        setIsPrimaryInstance(false);
      }
    } else {
      if (activeCertificateInstanceId === instanceId) {
        activeCertificateInstanceId = null;
      }
      setIsPrimaryInstance(false);
    }
    return () => {
      if (activeCertificateInstanceId === instanceId) {
        activeCertificateInstanceId = null;
      }
    };
  }, [isOpen, instanceId]);

  useEffect(() => {
    if (!isOpen || !isPrimaryInstance) return;

    const existingCert = getLocalCertificates().find(
      (c) =>
        c.id === toDeterministicCertId(resolvedEmail, lockedName) ||
        c.staffEmail.toLowerCase() === resolvedEmail
    );

    const effectiveIso = completedAt || existingCert?.issuedAt || new Date().toISOString();
    const dt = new Date(effectiveIso);
    const validDt = isNaN(dt.getTime()) ? new Date() : dt;

    const formattedDate = validDt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = validDt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    setDateTimeStr(`${formattedDate} • ${formattedTime} (PHT)`);

    const deterministicSerial =
      propSerialCode ||
      existingCert?.serialCode ||
      generateDeterministicCertSerial(resolvedEmail, lockedName);
    setCertSerial(deterministicSerial);
    setCertStatus(propVerificationStatus || existingCert?.status || 'verified');

    if (!readOnlyPreview) {
      issueOrUpdateTrainingCertificate({
        staffName: lockedName,
        staffEmail: resolvedEmail,
        staffPosition: lockedPosition,
        staffBranch: lockedBranch,
        quizTitle,
        score,
        totalQuestions,
        issuedAt: effectiveIso,
      })
        .then((savedRecord) => {
          setCertSerial(savedRecord.serialCode);
          setCertStatus(savedRecord.status);
        })
        .catch(() => {});
    }
  }, [
    isOpen,
    isPrimaryInstance,
    completedAt,
    lockedName,
    lockedPosition,
    lockedBranch,
    resolvedEmail,
    quizTitle,
    score,
    totalQuestions,
    propSerialCode,
    propVerificationStatus,
    readOnlyPreview,
  ]);

  if (!isOpen || !isPrimaryInstance) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySerial = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(certSerial).catch(() => {});
      setCopiedSerial(true);
      setCopyStatus(`Certificate Serial ${certSerial} copied! Paste in Master Hub to verify.`);
      setTimeout(() => {
        setCopiedSerial(false);
        setCopyStatus(null);
      }, 3000);
    }
  };

  const handleShare = () => {
    const shareText = `Official Training Certificate: ${lockedName} (${lockedPosition} - ${lockedBranch}) passed the ${quizTitle} with a score of ${score}/${totalQuestions} on ${dateTimeStr}. Master Hub Verification Serial: ${certSerial}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
      setCopyStatus('Certificate verification details copied to clipboard!');
      setTimeout(() => setCopyStatus(null), 3000);
    }
  };

  const percentage = Math.round((score / Math.max(1, totalQuestions)) * 100);

  const modalContent = (
    <div
      id="certificate-print-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Print Specific CSS: Collapses #root completely so strictly ONE (1) single certificate prints on 1 page */}
      <style>{`
        @page {
          size: landscape;
          margin: 8mm;
        }
        @media print {
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body > *:not(#certificate-print-portal) {
            display: none !important;
          }
          #certificate-print-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          #certificate-print-portal .no-print {
            display: none !important;
          }
          #certificate-print-portal .print-shell {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #official-training-certificate {
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 20px 28px !important;
            background: #fffdf7 !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: 5px solid #991b1b !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
        }
      `}</style>

      <div className="print-shell relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>Official Single Training Certificate</span>
                {certStatus === 'verified' ? (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Master Hub Verified</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-red-950 text-red-300 border border-red-700/50 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                    <span>Revoked in Master Hub</span>
                  </span>
                )}
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-700/60 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span>Sign-In Identity Locked</span>
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Verification Serial:{' '}
                <strong className="font-mono text-amber-300">{certSerial}</strong> • Verifiable in Master Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopySerial}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy Certificate Serial Code to verify in Master Hub"
            >
              {copiedSerial ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{copiedSerial ? 'Copied Serial!' : certSerial}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Print or Save Single Certificate as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy verification details"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Copy confirmation toast */}
        {copyStatus && (
          <div className="no-print bg-emerald-900/90 text-emerald-200 text-xs text-center py-1.5 px-4 font-semibold border-b border-emerald-700 animate-fadeIn">
            {copyStatus}
          </div>
        )}

        {/* Scrollable Preview Area (Strictly ONE Certificate Canvas) */}
        <div className="print-shell p-3 sm:p-6 overflow-y-auto bg-slate-950/70 flex justify-center">
          {/* THE SINGLE OFFICIAL CERTIFICATE CANVAS */}
          <div
            id="official-training-certificate"
            className="w-full max-w-[800px] bg-gradient-to-b from-[#fffefc] via-[#fffbf3] to-[#fbf5e6] text-slate-900 p-6 sm:p-10 rounded-2xl shadow-2xl relative border-[6px] border-[#991b1b] ring-4 ring-[#b45309]/50 overflow-hidden select-none font-sans"
          >
            {/* Subtle ornamental background pattern & Guilloche style ring */}
            <div className="absolute inset-0 border-[2px] border-[#b45309]/30 m-2.5 pointer-events-none rounded-xl" />
            <div className="absolute inset-0 border border-dashed border-[#b45309]/20 m-4 pointer-events-none rounded-lg" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Corner Ornaments */}
            <div className="absolute top-4 left-4 text-[#991b1b] font-serif text-lg leading-none select-none">✦</div>
            <div className="absolute top-4 right-4 text-[#991b1b] font-serif text-lg leading-none select-none">✦</div>
            <div className="absolute bottom-4 left-4 text-[#991b1b] font-serif text-lg leading-none select-none">✦</div>
            <div className="absolute bottom-4 right-4 text-[#991b1b] font-serif text-lg leading-none select-none">✦</div>

            {/* Certificate Header */}
            <div className="text-center relative z-10 space-y-2">
              <div className="inline-flex items-center justify-center gap-2 mb-1">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-md border-2 border-amber-500/80">
                  <img
                    src="./assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp"
                    alt="Jiangnan Hotpot Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#991b1b] block">
                  Imperial Kitchen Group Inc. • Jiangnan Hotpot
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#b45309] block mt-0.5">
                  Learning &amp; Development Department
                </span>
              </div>

              <div className="pt-2 pb-1">
                <h1 className="text-xl sm:text-3xl font-black text-[#1e1b4b] uppercase tracking-wider font-serif">
                  Certificate of Competency
                </h1>
                <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#b45309] to-transparent mx-auto mt-1.5" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#991b1b] block mt-1">
                  Standard Operating Procedures &amp; Food Safety Training
                </span>
              </div>
            </div>

            {/* Recipient Certification Statement */}
            <div className="text-center relative z-10 my-5 sm:my-7 space-y-3">
              <p className="text-xs sm:text-sm text-slate-600 italic font-serif">
                This official credential is system-generated and proudly presented to:
              </p>

              {/* Employee Full Name (Locked to Sign-In Account) */}
              <div className="py-1">
                <div className="text-2xl sm:text-4xl font-extrabold text-[#7f1d1d] tracking-tight uppercase border-b-2 border-[#b45309]/40 pb-1 max-w-lg mx-auto font-serif">
                  {lockedName}
                </div>
              </div>

              {/* Position and Branch (Locked to Sign-In Account) */}
              <div className="space-y-0.5">
                <p className="text-sm sm:text-base font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#b45309]" />
                  <span>{lockedPosition}</span>
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {lockedBranch}
                </p>
              </div>

              {/* Description of achievement */}
              <p className="text-xs sm:text-[13px] text-slate-700 max-w-xl mx-auto leading-relaxed pt-1">
                For successfully completing and passing the official shift compliance assessment in{' '}
                <strong className="text-slate-900">{quizTitle}</strong> with a verified passing grade of{' '}
                <strong className="text-[#991b1b]">{score}/{totalQuestions} ({percentage}%)</strong>, demonstrating verified competency in restaurant hygiene, food safety protocols, and operational sequence standards.
              </p>
            </div>

            {/* Date, Time & Master Hub Verification Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-amber-500/10 border border-[#b45309]/30 text-center relative z-10 my-4 text-[11px]">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Date &amp; Time Issued</span>
                <span className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-[#b45309]" />
                  <span>{dateTimeStr || 'October 22, 2026'}</span>
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Assessment Score</span>
                <span className="font-black text-emerald-800 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{score}/{totalQuestions} ({percentage}%) • Passed</span>
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Master Hub Verification Serial
                </span>
                <span className="font-mono font-black text-[#7f1d1d] tracking-wider">
                  {certSerial}
                </span>
              </div>
            </div>

            {/* THE L&D TEAM DIGITAL SIGNATURES */}
            <div className="relative z-10 pt-3 border-t-2 border-[#b45309]/30">
              <div className="text-center mb-2.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#991b1b]">
                  Digitally Endorsed &amp; Approved by the Learning and Development Team
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {/* 1. Joy Bernardo */}
                <div className="space-y-1 flex flex-col items-center">
                  <div className="h-9 flex items-end justify-center">
                    <span className="font-serif italic text-base sm:text-lg text-slate-800 tracking-wider font-bold select-none border-b border-slate-400/80 px-2 pb-0.5">
                      Joy Bernardo
                    </span>
                  </div>
                  <div className="text-[10px] font-extrabold text-[#7f1d1d] uppercase tracking-tight">
                    Joy Bernardo
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold leading-tight">
                    L&amp;D Manager
                  </div>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold bg-red-100 text-red-800 border border-red-300">
                    Department Head
                  </span>
                </div>

                {/* 2. John Dave De Leon */}
                <div className="space-y-1 flex flex-col items-center">
                  <div className="h-9 flex items-end justify-center">
                    <span className="font-serif italic text-base sm:text-lg text-slate-800 tracking-wider font-bold select-none border-b border-slate-400/80 px-2 pb-0.5">
                      J.D. De Leon
                    </span>
                  </div>
                  <div className="text-[10px] font-extrabold text-[#7f1d1d] uppercase tracking-tight">
                    John Dave De Leon
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold leading-tight">
                    L&amp;D Specialist
                  </div>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300" title="Food Safety Compliance Officer">
                    FSCO Certified
                  </span>
                </div>

                {/* 3. Lany Ann Nemenzo */}
                <div className="space-y-1 flex flex-col items-center">
                  <div className="h-9 flex items-end justify-center">
                    <span className="font-serif italic text-base sm:text-lg text-slate-800 tracking-wider font-bold select-none border-b border-slate-400/80 px-2 pb-0.5">
                      L.A. Nemenzo
                    </span>
                  </div>
                  <div className="text-[10px] font-extrabold text-[#7f1d1d] uppercase tracking-tight">
                    Lany Ann Nemenzo
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold leading-tight">
                    L&amp;D Specialist
                  </div>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300" title="Food Safety Compliance Officer">
                    FSCO Certified
                  </span>
                </div>

                {/* 4. Dice Divine Torralba */}
                <div className="space-y-1 flex flex-col items-center">
                  <div className="h-9 flex items-end justify-center">
                    <span className="font-serif italic text-base sm:text-lg text-slate-800 tracking-wider font-bold select-none border-b border-slate-400/80 px-2 pb-0.5">
                      D.D. Torralba
                    </span>
                  </div>
                  <div className="text-[10px] font-extrabold text-[#7f1d1d] uppercase tracking-tight">
                    Dice Divine Torralba
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold leading-tight">
                    L&amp;D Training Coordinator
                  </div>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                    Records Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Embossed Golden Seal Stamp with Master Hub Verification Footer */}
            <div className="mt-5 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-[#b45309]/20 text-[9px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  Master Hub Verifiable Credential • Code: <strong className="font-mono text-[#7f1d1d]">{certSerial}</strong> • Status:{' '}
                  <strong className={certStatus === 'verified' ? 'text-emerald-700 uppercase' : 'text-red-700 uppercase'}>
                    {certStatus}
                  </strong>
                </span>
              </div>
              <div className="sm:text-right">
                <span>Imperial Kitchen Group Inc. • Single Official Certificate Copy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Hidden on print) */}
        <div className="no-print p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              Single official certificate registered under Serial{' '}
              <strong className="font-mono text-amber-300">{certSerial}</strong> for Master Hub Verification.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySerial}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Serial for Verification</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Single Certificate</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

