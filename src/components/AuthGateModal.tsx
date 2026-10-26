import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  UserPlus,
  LogIn,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Copy,
  Check,
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
} from 'lucide-react';
import { PortalUser } from '../types/foodSafety';
import {
  MASTER_ACCOUNT_DETAILS,
  signInWithCredentials,
  registerStaffAccount,
  signInWithGoogleAccount,
  checkCurrentAccountStatus,
} from '../services/authAndUploadService';

interface AuthGateModalProps {
  currentUser: PortalUser | null;
  onAuthenticated: (user: PortalUser) => void;
  onSignOut: () => void;
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleQuickFillMaster = () => {
    setMode('signin');
    setIdentifier(MASTER_ACCOUNT_DETAILS.email);
    setPassword(MASTER_ACCOUNT_DETAILS.password);
    setError(null);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your Email / Master ID and Password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithCredentials(identifier, password);
      onAuthenticated(user);
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
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
    setLoading(true);
    setError(null);
    try {
      const newUser = await registerStaffAccount({
        displayName: regName,
        email: regEmail,
        password: regPassword,
        position: regPosition,
        branch: regBranch,
      });
      onAuthenticated(newUser);
    } catch (err: any) {
      setError(err.message || 'Account creation failed.');
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
      setError(
        err.message?.includes('popup-closed')
          ? 'Google sign-in popup was closed. You can also sign in using the Master or Staff credentials below.'
          : err.message || 'Google sign-in failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPendingStatus = async () => {
    if (!currentUser) return;
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      const updated = await checkCurrentAccountStatus(currentUser);
      onAuthenticated(updated);
      if (updated.status === 'pending') {
        setStatusMessage('Still awaiting Master Account approval. Sign in as the Master Account to approve this request.');
      } else if (updated.status === 'approved') {
        setStatusMessage('Account approved! Entering portal...');
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  // =========================================================================
  // VIEW 1: ACCOUNT PENDING OR REJECTED BY MASTER ACCOUNT
  // =========================================================================
  if (currentUser && currentUser.status !== 'approved') {
    const isRejected = currentUser.status === 'rejected';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-black ring-1 ring-red-500/50 flex-shrink-0">
                <img
                  src="./assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp"
                  alt="Jiangnan Hotpot Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  Imperial Kitchen Group Inc. · L&D Security Gate
                </span>
                <h1 className="text-base font-extrabold text-white">
                  {isRejected ? 'Account Access Declined' : 'Awaiting Master Account Approval'}
                </h1>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isRejected
                ? 'bg-red-950/40 border-red-800/60 text-red-200'
                : 'bg-amber-950/30 border-amber-700/50 text-amber-100'
            } space-y-2`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {isRejected ? (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span>
                {isRejected
                  ? 'Your registration request was declined by the Master Account.'
                  : 'Your staff account has been created and is queued for Master Account approval.'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isRejected
                ? 'Please contact the Learning & Development Master Administrator to review your staff access permissions.'
                : 'For confidentiality and food safety security, all newly created staff accounts must be approved by the Master Account before accessing SOPs, Policies, Guides, Station Checklists, AI Support, and Training Games.'}
            </p>
          </div>

          {/* Account Summary Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Employee Name</span>
              <span className="font-bold text-white">{currentUser.displayName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Email / Employee ID</span>
              <span className="font-mono text-slate-200">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Position & Branch</span>
              <span className="text-slate-200 text-right">
                {currentUser.position} · {currentUser.branch}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Approval Status</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  onSignOut();
                  setMode('signin');
                  setIdentifier(MASTER_ACCOUNT_DETAILS.email);
                  setPassword(MASTER_ACCOUNT_DETAILS.password);
                }}
                className="py-2.5 px-3 rounded-xl bg-red-950/70 hover:bg-red-900/70 text-red-200 border border-red-800/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In as Master to Approve</span>
              </button>

              <button
                onClick={onSignOut}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Back to Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SIGN IN / CREATE ACCOUNT GATE
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Brand & Master Account Details Reference Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-red-950/90 via-slate-900 to-slate-950 border border-red-800/40 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-2xl">
          <div className="space-y-4">
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
                <h1 className="text-lg font-black text-white tracking-tight">
                  IKQA & L&D Training Hub
                </h1>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in with the Master Account to approve newly registered staff accounts and upload SOPs, Policies, Guides, and Station Checklists with automatic AI & Training Game integration.
            </p>

            {/* Master Account Credentials Box */}
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Master Account Credentials</span>
                </span>
                <button
                  type="button"
                  onClick={handleQuickFillMaster}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Auto-Fill Master
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">Master Email / Username</span>
                    <span className="font-mono font-bold text-white truncate block">
                      {MASTER_ACCOUNT_DETAILS.email}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">
                      or ID: {MASTER_ACCOUNT_DETAILS.username}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(MASTER_ACCOUNT_DETAILS.email, 'email')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
                    title="Copy Master Email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">Master Password</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {MASTER_ACCOUNT_DETAILS.password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(MASTER_ACCOUNT_DETAILS.password, 'pw')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
                    title="Copy Master Password"
                  >
                    {copiedField === 'pw' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  • <strong className="text-slate-200">Master Capabilities:</strong> Approve/Reject staff accounts, upload SOPs, Policies, Guides & Station Checklists, auto-sync with AI Support & Games.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>RA 10611 & PD 856 Compliant</span>
            <span>Internal L&D Portal</span>
          </div>
        </div>

        {/* Right Column: Sign In / Create Staff Account Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl space-y-4">
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Staff Account</span>
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
                    Email Address or Master ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="master@jiangnanhotpot.com or IKQA-MASTER"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Master or Staff password"
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
                  <span>{loading ? 'Signing In...' : 'Sign In to L&D Portal'}</span>
                </button>

                {/* Quick Demo Account Buttons */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[11px] text-slate-400 block">
                    Quick Sign-In Presets (Master & Sample Staff):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleQuickFillMaster}
                      className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Fill Master Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('maria.santos@jiangnanhotpot.com');
                        setPassword('Staff2026!');
                        setError(null);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fill Approved Staff (Maria)</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 text-[11px] text-amber-200 leading-relaxed">
                  <strong>Master Approval Required:</strong> Creating a new staff account submits your profile to the Master Account (`master@jiangnanhotpot.com`) for verification before you can access the portal.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Submitting Registration...' : 'Submit Account for Master Approval'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Firebase Google Sign-In Option */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Continue with Google Account (Firebase Auth)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
