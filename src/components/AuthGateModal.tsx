import React, { useState } from 'react';
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
} from 'lucide-react';
import { PortalUser } from '../types/foodSafety';
import {
  signInWithCredentials,
  registerStaffAccount,
  signInWithGoogleAccount,
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    try {
      const user = await registerStaffAccount({
        email: regEmail,
        password: regPassword,
        displayName: regName,
        position: regPosition,
        branch: regBranch,
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
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(
          err.message ||
            'Google Sign-In could not be completed. You may also sign in with your Portal Email & Password.'
        );
      }
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
        setStatusMessage(
          'Your account is still awaiting approval from the Master Account. Please contact L&D Administration.'
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
                  : 'This training hub is strictly private. Your account has been registered and is locked until the Master Account administrator approves your access.'}
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
  // VIEW 2: PRIVATE SIGN IN / CREATE STAFF ACCOUNT GATE
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Left Column: Private Corporate Security Banner */}
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
                  IKQA &amp; L&amp;D Training Hub
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/90 border border-red-700/60 text-red-200 text-[11px] font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>STRICTLY PRIVATE INTERNAL PORTAL</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Access to Imperial Kitchen Group Inc. and Jiangnan Hotpot SOPs, Policies, Station Checklists, AI Virtual Support, and Training Simulators is strictly restricted to authenticated and Master-approved personnel.
            </p>

            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Access &amp; Approval Policy</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Approved Personnel:</strong> Sign in with your verified credentials or authorized Google account to unlock the training hub.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>New Staff Registration:</strong> Newly created accounts remain locked in <em>Pending</em> status until approved by the Master Account.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Master Account Control:</strong> Only the Master Account can approve staff registrations and publish new SOPs, Policies, Guides, and Station Checklists.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>RA 10611 &amp; PD 856 Compliant</span>
            <span>Authorized Personnel Only</span>
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
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 text-[11px] text-amber-200 leading-relaxed">
                  <strong>Master Approval Required:</strong> Creating a new staff account submits your registration to the Master Account for verification before you can access the portal.
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
