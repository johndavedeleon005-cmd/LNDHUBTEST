import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  UserPlus,
  LogIn,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Building2,
  Briefcase,
  Mail,
  User,
  AlertCircle,
  Flame,
  Eye,
  EyeOff,
  X,
  FileSignature,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Users,
  Sparkles,
  Award,
  BookOpen,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';
import { PortalUser } from '../types/foodSafety';
import {
  MASTER_ACCOUNT_DETAILS,
  signInWithCredentials,
  registerStaffAccount,
  signInWithGoogleAccount,
  signInWithGoogleCloudDirect,
  checkCurrentAccountStatus,
} from '../services/authAndUploadService';

interface AuthGateModalProps {
  currentUser: PortalUser | null;
  onAuthenticated: (user: PortalUser) => void;
  onSignOut: () => void;
  onClose?: () => void;
}

const BRANCH_OPTIONS = [
  'Jiangnan Hotpot - SM Mall of Asia',
  'Jiangnan Hotpot - BGC High Street',
  'Jiangnan Hotpot - Makati Paseo',
  'Jiangnan Hotpot - Banawe QC',
  'Jiangnan Hotpot - Greenhills',
  'Jiangnan Hotpot - Alabang Town Center',
  'Imperial Kitchen Central Commissary',
  'Imperial Kitchen Group HQ - L&D Department',
];

const POSITION_OPTIONS = [
  'FOH Receptionist',
  'FOH Server / Service Crew',
  'FOH Cashier',
  'Kitchen Shift Lead',
  'BOH Meat Slicer & Prep Cook',
  'BOH Broth & Dispatch Specialist',
  'Restaurant Store Manager',
  'Commissary QA Inspector',
];

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  currentUser,
  onAuthenticated,
  onSignOut,
  onClose,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPosition, setRegPosition] = useState(POSITION_OPTIONS[0]);
  const [regBranch, setRegBranch] = useState(BRANCH_OPTIONS[0]);
  const [regNdaTyping, setRegNdaTyping] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // GitHub Pages / Custom Domain Direct Google Sign-In state (bypasses auth/unauthorized-domain)
  const [showGoogleCloudForm, setShowGoogleCloudForm] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleNdaTyping, setGoogleNdaTyping] = useState('');
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isAboutLndModalOpen, setIsAboutLndModalOpen] = useState(false);

  const currentHostname =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'johndavedeleon005.github.io';

  const isNdaTypedValid = regNdaTyping.trim().toUpperCase() === 'I AGREE';
  const isGoogleNdaValid = googleNdaTyping.trim().toUpperCase() === 'I AGREE';
  const isMasterGoogleTyped =
    googleEmail.trim().toLowerCase() === MASTER_ACCOUNT_DETAILS.googleOwnerEmail.toLowerCase() ||
    googleEmail.trim().toLowerCase() === MASTER_ACCOUNT_DETAILS.email.toLowerCase();

  // Automatically sync pending account to Firestore/Server and poll for Master approval every 3.5s
  useEffect(() => {
    if (!currentUser || currentUser.role === 'master' || currentUser.status === 'approved') {
      return;
    }

    let mounted = true;
    const syncAndCheck = async () => {
      try {
        const updated = await checkCurrentAccountStatus(currentUser);
        if (mounted && updated && updated.status !== currentUser.status) {
          onAuthenticated(updated);
        }
      } catch {
        // ignore
      }
    };

    syncAndCheck();
    const timer = setInterval(syncAndCheck, 3500);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [currentUser, onAuthenticated]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your authorized Email / Employee ID and Password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithCredentials(identifier, password);
      onAuthenticated(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in your Full Name, Email / Employee ID, and Password.');
      return;
    }
    if (regPassword.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!isNdaTypedValid) {
      setError('You must manually type "I AGREE" in the Confidentiality Agreement box to create an account.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await registerStaffAccount({
        email: regEmail,
        password: regPassword,
        displayName: regName,
        position: regPosition,
        branch: regBranch,
        ndaSignature: 'I AGREE',
      });
      onAuthenticated(user);
    } catch (err: any) {
      setError(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogleAccount(regPosition, regBranch);
      onAuthenticated(user);
    } catch (err: any) {
      const codeStr = String(err?.code || '').toLowerCase();
      const msgStr = String(err?.message || '').toLowerCase();
      if (
        codeStr.includes('unauthorized-domain') ||
        msgStr.includes('unauthorized-domain') ||
        msgStr.includes('unauthorized domain') ||
        codeStr.includes('operation-not-supported')
      ) {
        // Instead of showing a raw Firebase unauthorized-domain error on GitHub Pages,
        // seamlessly switch to Firestore-backed Google Account Cloud Sign-In!
        setShowGoogleCloudForm(true);
        setError(null);
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setShowGoogleCloudForm(true);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCloudDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setError('Please enter your Google Email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogleCloudDirect({
        email: googleEmail,
        displayName: googleName || undefined,
        password: googlePassword || undefined,
        position: regPosition,
        branch: regBranch,
        ndaSignature: isGoogleNdaValid ? 'I AGREE' : undefined,
      });
      onAuthenticated(user);
    } catch (err: any) {
      setError(err.message || 'Could not complete Google Cloud Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHostname = () => {
    navigator.clipboard?.writeText(currentHostname).catch(() => {});
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleRefreshPendingStatus = async () => {
    if (!currentUser) return;
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      const updated = await checkCurrentAccountStatus(currentUser);
      onAuthenticated(updated);
      if (updated.status === 'pending') {
        setStatusMessage(
          'Approval request transmitted & active in Master Account queue. Awaiting Master Admin click to approve.'
        );
      } else if (updated.status === 'rejected') {
        setStatusMessage('Your account request was declined by the Master Account.');
      }
    } catch {
      setStatusMessage('Unable to reach server. Please try again shortly.');
    } finally {
      setCheckingStatus(false);
    }
  };

  // =========================================================================
  // VIEW 1: ACCOUNT PENDING OR REJECTED BY MASTER ACCOUNT (STRICT LOCKOUT)
  // =========================================================================
  if (currentUser && currentUser.role !== 'master' && currentUser.status !== 'approved') {
    const isRejected = currentUser.status === 'rejected';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isRejected
                  ? 'bg-red-950/80 border-red-500/40 text-red-400'
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
              }`}
            >
              {isRejected ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <span
                className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-bold mb-1 ${
                  isRejected
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {isRejected ? 'ACCESS DECLINED' : 'PRIVATE PORTAL • PENDING MASTER APPROVAL'}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {isRejected
                  ? 'Account Access Request Declined'
                  : 'Account Awaiting Master Account Approval'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isRejected
                  ? 'Your staff account registration was declined by the Master Account administrator. Portal access remains locked.'
                  : 'This training hub is strictly private. Your account and signed Confidentiality Agreement have been recorded and are awaiting Master Account approval.'}
              </p>
            </div>
          </div>

          {/* Account Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Staff Name:</span>
              <span className="font-bold text-white">{currentUser.displayName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Email / ID:</span>
              <span className="font-mono text-slate-200">{currentUser.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Position:</span>
              <span className="text-slate-200">{currentUser.position}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Assigned Branch:</span>
              <span className="text-slate-200">{currentUser.branch}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Confidentiality Agreement:</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ACCEPTED (&quot;{currentUser.ndaSignature || 'I AGREE'}&quot;)</span>
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Approval Status:</span>
              <span className="font-mono font-bold text-amber-400 uppercase">
                {currentUser.status}
              </span>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300">
              {statusMessage}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            {!isRejected && (
              <button
                onClick={handleRefreshPendingStatus}
                disabled={checkingStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>
                  {checkingStatus ? 'Checking Master Approval Status...' : 'Check Approval Status Now'}
                </span>
              </button>
            )}

            <button
              onClick={onSignOut}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Return to Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PRIVATE SIGN IN / CREATE STAFF ACCOUNT GATE (WITH ABOUT L&D TEAM)
  // =========================================================================
  return (
    <div
      className={`${
        onClose
          ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md'
          : 'min-h-screen bg-slate-950'
      } text-slate-100 flex items-start lg:items-center justify-center p-3 sm:p-5 select-none`}
    >
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative my-auto">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        )}

        {/* Left Column: Private Corporate Security Banner + About the L&D Team (Order 2 on mobile/tablet so Sign In is always at the very top, Order 1 on desktop) */}
        <div className="order-2 lg:order-1 lg:col-span-5 bg-gradient-to-br from-red-950/90 via-slate-900 to-slate-950 border border-red-800/40 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-2xl">
          <div className="space-y-3.5">
            {/* Top Brand & Animated L&D Logo Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black ring-1 ring-red-500/60 shadow-lg shrink-0">
                  <img
                    src="./assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp"
                    alt="Jiangnan Hotpot Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Imperial Kitchen Group Inc.</span>
                  </div>
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                    IKQA &amp; L&amp;D Training Hub
                  </h1>
                </div>
              </div>

              {/* Animated L&D Badge */}
              <div
                onClick={() => setIsAboutLndModalOpen(true)}
                className="w-12 h-12 rounded-2xl overflow-hidden bg-white border-2 border-amber-500/60 shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title="Click to view About the L&D Team & Mission"
              >
                <video
                  src="./assets/aistudio/ANIMATED_LND_LOGO_9bad3066.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/90 border border-red-700/60 text-red-200 text-[10px] font-bold">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>STRICTLY PRIVATE INTERNAL PORTAL</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAboutLndModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
              >
                <Users className="w-3 h-3 text-amber-400" />
                <span>Full L&amp;D Team &amp; Mission</span>
              </button>
            </div>

            {/* About The Learning and Development (L&D) Team Card */}
            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/90">
                <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>About the L&amp;D Team</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span>Imperial Kitchen Group</span>
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Developed by the Learning and Development Department to empower kitchen and service professionals in Food Safety Mastery, Standard Operating Procedures, and Career Excellence.
              </p>

              <div className="space-y-2">
                {/* L&D Manager */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-red-500/30 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-red-400">
                      Learning &amp; Development Manager
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-white">
                      Joy Bernardo
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Department Leadership, Training Strategy &amp; Compliance Governance
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-700/50 shrink-0">
                    Leadership
                  </span>
                </div>

                {/* L&D Specialists (FSCO) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/25 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      L&amp;D Specialist
                    </div>
                    <div className="text-xs font-bold text-white flex items-center gap-1 flex-wrap">
                      <span>John Dave De Leon</span>
                      <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50">
                        FSCO
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Food Safety Compliance &amp; Kitchen Standards
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/25 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      L&amp;D Specialist
                    </div>
                    <div className="text-xs font-bold text-white flex items-center gap-1 flex-wrap">
                      <span>Lany Ann Nemenzo</span>
                      <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50">
                        FSCO
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Service Standards &amp; Operational Sequences
                    </div>
                  </div>
                </div>

                {/* L&D Coordinator */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      L&amp;D Training Coordinator
                    </div>
                    <div className="text-xs font-bold text-white">
                      Dice Divine Torralba
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Training Administration, Scheduling &amp; Staff Assessment Records
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    Coordination
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Access & Approval Policy */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 space-y-1.5 text-[11px]">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Access &amp; Approval Policy</span>
              </div>
              <ul className="space-y-1 text-[10px] text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Approved Personnel:</strong> Sign in with verified credentials to unlock the hub.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <FileSignature className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mandatory NDA:</strong> New staff must manually type <code>&quot;I AGREE&quot;</code> and await Master Account approval.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>RA 10611 &amp; PD 856 Compliant</span>
            <span>Imperial Kitchen Group L&amp;D</span>
          </div>
        </div>

        {/* Right Column: Sign In / Create Staff Account Form (Order 1 on mobile/tablet so Sign In is ALWAYS at the top) */}
        <div className="order-1 lg:order-2 lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl space-y-4">
          <div className="space-y-4">
            {/* Compact Header inside Sign In Card so Title + Sign In Status are always visible at the very top */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black ring-1 ring-red-500/60 shrink-0">
                  <img
                    src="./assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp"
                    alt="Jiangnan Hotpot Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Imperial Kitchen Group Inc. • Private Portal
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-white">
                    Staff &amp; Master Account Sign In
                  </h2>
                </div>
              </div>

              {currentUser && (
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline text-[10px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-1 rounded-lg border border-emerald-700/50">
                    Signed in: {currentUser.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mode Switcher Tabs + About L&D Team Button */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`py-2.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`py-2.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Create Account</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAboutLndModalOpen(true)}
                className="py-2.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-amber-300 hover:bg-slate-900 border border-amber-500/30 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">About L&amp;D Team</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Email Address or Account ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your authorized Email or ID"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to Private L&D Hub'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Employee Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Juan Dela Cruz"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Email or Employee ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="juan.delacruz@jiangnanhotpot.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Position / Station Role
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={regPosition}
                        onChange={(e) => setRegPosition(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                      >
                        {POSITION_OPTIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Assigned Branch
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={regBranch}
                        onChange={(e) => setRegBranch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                      >
                        {BRANCH_OPTIONS.map((br) => (
                          <option key={br} value={br}>
                            {br}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Create Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create account password"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Mandatory Confidentiality & Non-Disclosure Agreement (Manual "I AGREE") */}
                <div
                  className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
                    isNdaTypedValid
                      ? 'bg-emerald-950/25 border-emerald-500/50'
                      : 'bg-slate-950 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <FileSignature className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Mandatory Confidentiality &amp; Non-Disclosure Agreement</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isNdaTypedValid
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      {isNdaTypedValid ? '✔ "I AGREE" VERIFIED' : 'MANUAL TYPING REQUIRED'}
                    </span>
                  </div>

                  <div className="max-h-24 overflow-y-auto pr-1 text-[11px] text-slate-300 leading-relaxed space-y-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                    <p>
                      <strong>1. Proprietary Company Property:</strong> All SOPs (IKQA-SOP#001–#012+), Policies (IKQAP#001–#021+), Station Checklists (JNLD-CHK-FOH-REC-001+), recipes, broth formulations, supplier lists, and training materials inside this Hub are strictly confidential trade secrets of <strong>Imperial Kitchen Group Inc. / Jiangnan Hotpot</strong>.
                    </p>
                    <p>
                      <strong>2. Strict Non-Disclosure &amp; Anti-Leakage:</strong> I agree never to screenshot, record, copy, download, forward, or disclose any document, checklist, or portal credential to unauthorized individuals or external parties.
                    </p>
                    <p>
                      <strong>3. Audit &amp; Master Account Logging:</strong> I understand that my acceptance of this Confidentiality Agreement is permanently logged alongside my name in the Master Account registry and enforced under company policy and RA 10173 (Data Privacy Act).
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-200 block mb-1">
                      To accept this Confidentiality Agreement, manually type{' '}
                      <span className="font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700">
                        I AGREE
                      </span>{' '}
                      below:
                    </label>
                    <input
                      type="text"
                      value={regNdaTyping}
                      onChange={(e) => setRegNdaTyping(e.target.value)}
                      onPaste={(e) => e.preventDefault()}
                      placeholder='Type "I AGREE" manually here'
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase focus:outline-none ${
                        isNdaTypedValid
                          ? 'border-emerald-500 text-emerald-300'
                          : 'border-slate-700 focus:border-amber-500 text-white'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isNdaTypedValid}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {loading
                      ? 'Submitting Registration...'
                      : isNdaTypedValid
                      ? 'Submit Account & Signed NDA for Master Approval'
                      : 'Type "I AGREE" Above to Enable Account Creation'}
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* Firebase Google Sign-In Option + GitHub Pages Cloud Direct Fallback */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            {!showGoogleCloudForm ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Continue with Google Account (Firebase Auth)</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block">
                      GITHUB PAGES &amp; EXTERNAL DOMAIN CLOUD SIGN-IN
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      Sign In with Google Email via Firebase Firestore
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Works immediately on <code className="text-amber-300">{currentHostname}</code> without popup domain restrictions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGoogleCloudForm(false)}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleGoogleCloudDirectSubmit} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="Google Email (e.g. name@gmail.com)"
                      className="bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="password"
                      value={googlePassword}
                      onChange={(e) => setGooglePassword(e.target.value)}
                      placeholder={
                        isMasterGoogleTyped
                          ? 'Enter Master Password'
                          : 'Portal Password (or create new)'
                      }
                      className="bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {!isMasterGoogleTyped && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                        placeholder="Full Name (for new Google sign-up)"
                        className="bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={googleNdaTyping}
                        onChange={(e) => setGoogleNdaTyping(e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        placeholder='New user? Type "I AGREE" manually'
                        className={`bg-slate-900 border rounded-xl px-3 py-1.5 text-xs font-mono font-bold uppercase focus:outline-none ${
                          isGoogleNdaValid
                            ? 'border-emerald-500 text-emerald-300'
                            : 'border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {loading
                          ? 'Connecting to Firestore...'
                          : isMasterGoogleTyped
                          ? 'Sign In as Master Google Account'
                          : 'Continue with Google Email'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDomainGuide((p) => !p)}
                      className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      <span>Authorize GitHub Domain</span>
                    </button>
                  </div>
                </form>

                {showDomainGuide && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-2">
                    <div className="font-bold text-amber-300 flex items-center justify-between">
                      <span>Enable Native Google Popup on GitHub Pages:</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Project: commanding-gearbox-5w2pc
                      </span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>
                        Copy your GitHub Pages domain:{' '}
                        <button
                          type="button"
                          onClick={handleCopyHostname}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-amber-300 hover:border-amber-400 cursor-pointer"
                        >
                          <span>{currentHostname}</span>
                          {copiedDomain ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </li>
                      <li>
                        Open{' '}
                        <a
                          href="https://console.firebase.google.com/project/commanding-gearbox-5w2pc/authentication/settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 underline inline-flex items-center gap-1 font-semibold"
                        >
                          <span>Firebase Console → Auth Settings → Authorized Domains</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        Click <strong>Add domain</strong>, paste <code className="text-amber-300">{currentHostname}</code>, and click <strong>Add</strong>.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full About the Learning & Development Team & Mission Modal */}
      {isAboutLndModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
          onClick={() => setIsAboutLndModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="relative bg-gradient-to-r from-red-900 via-red-800 to-amber-900 px-6 py-5 text-white border-b border-red-700/50 shrink-0">
              <button
                onClick={() => setIsAboutLndModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-black/30 hover:bg-black/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-black ring-1 ring-red-400/50 shadow-md shrink-0">
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
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-amber-300 shrink-0" />
                <span>About the Learning and Development Team</span>
              </h2>
              <p className="mt-1 text-xs text-red-100/90 leading-relaxed">
                The centralized training, quality assurance, and standard operating procedures department for Imperial Kitchen Group Inc. and Jiangnan Hotpot.
              </p>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200 text-sm leading-relaxed">
              {/* Animated L&D Logo Video */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-amber-500/50 ring-4 ring-red-900/30 flex items-center justify-center">
                  <video
                    src="./assets/aistudio/ANIMATED_LND_LOGO_9bad3066.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>
              </div>

              {/* Mission & Purpose */}
              <div className="bg-slate-800/70 rounded-xl p-4 sm:p-5 border border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Our Mission &amp; Purpose</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  This hub is developed to help employees improve their operational efficiency, master food safety compliance, uphold five-star culinary standards, and build long-term career growth. By providing instantaneous digital access to our complete Standard Operating Procedures (SOPs), Quality Assurance Policies (IKQAP), practical kitchen checklists, and AI-assisted compliance guidance, this platform empowers every kitchen and service team member to deliver exceptional guest experiences safely, consistently, and with pride.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-red-400 font-semibold text-xs flex items-center gap-1.5 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Food Safety Mastery</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      HACCP, allergen defense, FIFO/FEFO storage &amp; strict sanitation controls.
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-amber-400 font-semibold text-xs flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Standard Operating Procedures</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Precise portioning, wire slicing, pest control &amp; hygiene discipline.
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5 mb-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Career Excellence</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Continuous employee audits, skill assessments &amp; knowledge recognition.
                    </div>
                  </div>
                </div>
              </div>

              {/* L&D Team Directory */}
              <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/40 to-slate-900 rounded-xl p-4 sm:p-5 border border-slate-700">
                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-700/70">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <Users className="w-4 h-4" />
                    <span>The Learning and Development Team</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>Imperial Kitchen Group</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-900/80 p-3.5 rounded-lg border border-red-500/20 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                        Learning and Development Manager
                      </div>
                      <div className="text-base font-extrabold text-white">Joy Bernardo</div>
                      <div className="text-[11px] text-slate-400">
                        Department Leadership, Training Strategy &amp; Compliance Governance
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700/50 shrink-0">
                      Leadership
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-500/20 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Learning and Development Specialist
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>John Dave De Leon</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50">
                          FSCO
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Food Safety Compliance &amp; Kitchen Standards
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-500/20 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Learning and Development Specialist
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Lany Ann Nemenzo</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50">
                          FSCO
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Service Standards and Operational Sequences
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Learning and Development Training Coordinator
                      </div>
                      <div className="text-sm font-bold text-white">Dice Divine Torralba</div>
                      <div className="text-[11px] text-slate-400">
                        Training Administration, Session Scheduling &amp; Staff Assessment Records
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      Coordination
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400">
                Imperial Kitchen Group Inc. • L&amp;D Department
              </span>
              <button
                type="button"
                onClick={() => setIsAboutLndModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
