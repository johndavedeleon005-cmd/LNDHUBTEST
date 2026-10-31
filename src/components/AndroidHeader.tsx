import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Wifi,
  Battery,
  Sparkles,
  Smartphone,
  Monitor,
  Search,
  Bookmark,
  Lock,
  GraduationCap,
  X,
  ChevronRight,
  Layers,
  Crown,
  LogOut,
  UserCheck,
  Award,
  Upload,
  KeyRound,
  Cpu,
  Sliders,
  Building2,
  Briefcase,
  Wrench,
} from 'lucide-react';
import { FoodSafetyDoc, PortalUser, ItPortalConfig } from '../types/foodSafety';
import { isMasterAccountUser, isItAccountUser } from '../services/authAndUploadService';

interface AndroidHeaderProps {
  onSearchClick: () => void;
  bookmarksCount: number;
  onBookmarksClick: () => void;
  isPhoneFrame: boolean;
  togglePhoneFrame: () => void;
  onOpenAssistant: () => void;
  onOpenWelcomeModal?: () => void;
  documents?: FoodSafetyDoc[];
  activeDoc?: FoodSafetyDoc | null;
  onSelectDoc?: (doc: FoodSafetyDoc) => void;
  currentUser?: PortalUser | null;
  onOpenMasterHub?: () => void;
  onOpenMasterHubSection?: (
    section: 'certificates' | 'approvals' | 'uploader' | 'credentials'
  ) => void;
  onOpenItHub?: () => void;
  onOpenItHubSection?: (
    section: 'features' | 'branches' | 'positions' | 'troubleshooting'
  ) => void;
  itConfig?: ItPortalConfig;
  activeTab?: string;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  pendingApprovalsCount?: number;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  onSearchClick,
  bookmarksCount,
  onBookmarksClick,
  isPhoneFrame,
  togglePhoneFrame,
  onOpenAssistant,
  onOpenWelcomeModal,
  documents = [],
  activeDoc = null,
  onSelectDoc,
  currentUser = null,
  onOpenMasterHub,
  onOpenMasterHubSection,
  onOpenItHub,
  onOpenItHubSection,
  itConfig,
  activeTab,
  onOpenAuthModal,
  onSignOut,
  pendingApprovalsCount = 0,
}) => {
  const isMaster = isMasterAccountUser(currentUser);
  const isIt = isItAccountUser(currentUser);
  const flags = itConfig?.featureFlags;
  const showQuickSearch = flags ? flags.enableQuickSearch : true;
  const showAiAssistant = flags ? flags.enableAiAssistant : true;
  const showBookmarks = flags ? flags.enableBookmarks : true;
  const showPhoneToggle = flags ? flags.enablePhoneFrameToggle : true;

  const [time, setTime] = useState<string>('');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to open Quick-Access Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && showQuickSearch) {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isQuickSearchOpen) {
        setIsQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSearchOpen, showQuickSearch]);

  useEffect(() => {
    if (isQuickSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuickQuery('');
    }
  }, [isQuickSearchOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsQuickSearchOpen(false);
      }
    };
    if (isQuickSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuickSearchOpen]);

  // Compute related and matching documents for Quick-Access Search
  const quickSearchResults = useMemo(() => {
    const q = quickQuery.toLowerCase().trim();

    if (!q) {
      if (activeDoc) {
        return documents
          .filter((d) => d.id !== activeDoc.id)
          .map((d) => {
            let score = 0;
            if (d.category === activeDoc.category) score += 3;
            const sharedTags = d.tags.filter((t) =>
              activeDoc.tags.some((at) => at.toLowerCase() === t.toLowerCase())
            );
            score += sharedTags.length * 2;
            return { doc: d, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((item) => item.doc);
      }
      return documents.slice(0, 6);
    }

    const directMatches = documents.filter((doc) => {
      const inCode = doc.code.toLowerCase().includes(q);
      const inTitle = doc.title.toLowerCase().includes(q);
      const inCategory = doc.category.toLowerCase().includes(q);
      const inSummary = doc.summary.toLowerCase().includes(q);
      const inTags = doc.tags.some((tag) => tag.toLowerCase().includes(q));
      const inTakeaways = doc.keyTakeaways.some((t) => t.toLowerCase().includes(q));
      return inCode || inTitle || inCategory || inSummary || inTags || inTakeaways;
    });

    if (directMatches.length > 0 && directMatches.length < 6) {
      const primaryCategories = new Set(directMatches.map((m) => m.category));
      const directIds = new Set(directMatches.map((m) => m.id));
      const relatedByCategory = documents.filter(
        (d) => !directIds.has(d.id) && primaryCategories.has(d.category)
      );
      return [...directMatches, ...relatedByCategory].slice(0, 8);
    }

    return directMatches.slice(0, 8);
  }, [quickQuery, documents, activeDoc]);

  const quickTags = [
    'RA 10611',
    'SOP#001 Handwash',
    'Cold Chain',
    'FEFO',
    'Towel Colors',
    'Retention Sample',
    'Wire Slicer',
    'Allergens',
  ];

  return (
    <header
      ref={dropdownRef}
      className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm select-none"
    >
      {/* Android Native Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 text-xs text-slate-400 font-mono tracking-tight border-b border-slate-800/40">
        <span className="font-semibold text-slate-300">{time || '09:41'}</span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-sans text-[10px] font-semibold">
            L&D 5G
          </span>
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px]">98%</span>
            <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div
          onClick={onOpenWelcomeModal}
          className={`flex items-center gap-2.5 min-w-0 ${
            onOpenWelcomeModal ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
          }`}
          title="Click to view Learning and Development Training Hub & Team Info"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-lg shadow-red-950/60 ring-1 ring-red-500/50 flex-shrink-0">
            <img
              src="./assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp"
              alt="Jiangnan Hotpot Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white truncate">
                JIANGNAN HOTPOT
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-900/80 text-amber-200 border border-amber-600/50">
                L&D
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>Confidential</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              L&D Training Hub • Internal Only
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quick-Access Search Trigger Pill */}
          {showQuickSearch && (
            <button
              onClick={() => setIsQuickSearchOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                isQuickSearchOpen
                  ? 'bg-red-600 text-white border-red-500 shadow-md'
                  : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
              title="Quick-access search for related documents (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Quick Search</span>
            </button>
          )}

          {/* L&D Training Hub & Team Info */}
          {onOpenWelcomeModal && (
            <button
              onClick={onOpenWelcomeModal}
              title="Welcome to Learning and Development Training Hub & Team Info"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 text-xs font-semibold active:scale-95 transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">L&D Hub</span>
            </button>
          )}

          {/* L&D Virtual Support Assistant */}
          {showAiAssistant && (
            <button
              onClick={onOpenAssistant}
              title="L&D Virtual Support"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-red-600/20 to-amber-600/20 border border-red-500/30 hover:border-red-400 text-red-300 text-xs font-semibold active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">L&D Virtual Support</span>
            </button>
          )}

          {/* Bookmarks */}
          {showBookmarks && (
            <button
              onClick={onBookmarksClick}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-300 relative active:scale-90 transition-all"
              title="Bookmarked documents"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarksCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                  {bookmarksCount}
                </span>
              )}
            </button>
          )}

          {/* Master Account Hub Button */}
          {isMaster && onOpenMasterHub && (
            <button
              onClick={onOpenMasterHub}
              title="Open Master Account Upload, Certificate Verification & Staff Approval Hub"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-200/60 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Crown className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>Master Hub</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {/* IT Hub Account Button */}
          {(isIt || isMaster) && onOpenItHub && (
            <button
              onClick={onOpenItHub}
              title="Open IT Hub Console (Add/Remove App Features, Edit Branch List & Positions, Troubleshooting)"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 ring-1 ring-cyan-200/60 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>IT Hub</span>
            </button>
          )}

          {currentUser && onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              title={`Signed in as ${currentUser.displayName} (${currentUser.position}) — Click to Log In / Switch Account`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[100px] truncate hidden sm:inline">
                {currentUser.displayName.split(' ')[0]}
              </span>
              <span className="sm:hidden">Account</span>
            </button>
          )}

          {currentUser && onSignOut ? (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-700/70 text-red-200 text-xs font-bold transition-all cursor-pointer"
              title={`Log out (${currentUser.email})`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          ) : (
            onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-2.5 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black cursor-pointer"
              >
                Log In
              </button>
            )
          )}

          {/* Desktop Frame Switcher */}
          {showPhoneToggle && (
            <button
              onClick={togglePhoneFrame}
              className="hidden md:flex items-center justify-center p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              title={isPhoneFrame ? 'Switch to Full Width View' : 'Simulate Android Phone Frame'}
            >
              {isPhoneFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Persistent Master Account Control Bar (Always Visible for Master Accounts Across All Tabs) */}
      {isMaster && onOpenMasterHub && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-amber-950/95 via-slate-900 to-amber-950/90 border-t border-amber-500/40 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              <Crown className="w-3 h-3 text-slate-950" />
              <span>Master Account</span>
            </span>
            <span className="text-[11px] font-bold text-amber-200 hidden md:inline truncate max-w-[200px]">
              {currentUser?.displayName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenMasterHub}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'master'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50'
              }`}
            >
              <Crown className="w-3 h-3" />
              <span>Master Hub</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenMasterHubSection ? onOpenMasterHubSection('certificates') : onOpenMasterHub()
              }
              className="px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Award className="w-3 h-3 text-emerald-400" />
              <span>Verify Certificates</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenMasterHubSection ? onOpenMasterHubSection('approvals') : onOpenMasterHub()
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <UserCheck className="w-3 h-3 text-amber-400" />
              <span>Staff Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenMasterHubSection ? onOpenMasterHubSection('uploader') : onOpenMasterHub()
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Upload className="w-3 h-3 text-amber-400" />
              <span>Upload SOPs &amp; Checklists</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenMasterHubSection ? onOpenMasterHubSection('credentials') : onOpenMasterHub()
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Master Credentials</span>
            </button>

            {onOpenItHub && (
              <button
                type="button"
                onClick={onOpenItHub}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'it'
                    ? 'bg-cyan-400 text-slate-950 shadow-sm'
                    : 'bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span>IT Hub</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Persistent IT Hub Account Control Bar (Always Visible for IT Hub Accounts Across All Tabs) */}
      {isIt && onOpenItHub && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-cyan-950/95 via-slate-900 to-cyan-950/90 border-t border-cyan-500/40 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              <Cpu className="w-3 h-3 text-slate-950" />
              <span>IT Hub Account</span>
            </span>
            <span className="text-[11px] font-bold text-cyan-200 hidden md:inline truncate max-w-[200px]">
              {currentUser?.displayName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                onOpenItHubSection ? onOpenItHubSection('features') : onOpenItHub()
              }
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Sliders className="w-3 h-3 text-cyan-300" />
              <span>Add / Remove Features</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenItHubSection ? onOpenItHubSection('branches') : onOpenItHub()
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>Edit Branch List</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenItHubSection ? onOpenItHubSection('positions') : onOpenItHub()
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Briefcase className="w-3 h-3 text-amber-400" />
              <span>Edit Branch Positions</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenItHubSection ? onOpenItHubSection('troubleshooting') : onOpenItHub()
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Wrench className="w-3 h-3 text-emerald-400" />
              <span>IT Troubleshooting</span>
            </button>
          </div>
        </div>
      )}

      {/* Expandable Quick-Access Related Documents Search Bar & Live Results */}
      {isQuickSearchOpen && showQuickSearch && (
        <div className="px-4 pb-3 pt-1 bg-slate-900/98 border-t border-slate-800/80 shadow-2xl animate-in slide-in-from-top-1 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Quick-access search for related SOPs, policies, RA 10611, keywords..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {quickQuery && (
                <button
                  onClick={() => setQuickQuery('')}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsQuickSearchOpen(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
              >
                ESC
              </button>
            </div>
          </div>

          {/* Quick-Access Topic Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex-shrink-0 mr-1">
              Quick Topics:
            </span>
            {quickTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuickQuery(tag.replace(/^SOP#\d+\s*/, ''))}
                className="px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-red-950/80 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-600/50 text-[10px] font-semibold whitespace-nowrap transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Live Related Documents List */}
          <div className="mt-1 max-h-72 overflow-y-auto divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/90">
            <div className="px-3 py-1.5 bg-slate-900/90 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-amber-400" />
                {quickQuery.trim()
                  ? `Matching & Related Documents (${quickSearchResults.length})`
                  : activeDoc
                  ? `Related to ${activeDoc.code}: ${activeDoc.title}`
                  : 'Featured & Related Compliance Documents'}
              </span>
              <button
                onClick={() => {
                  setIsQuickSearchOpen(false);
                  onSearchClick();
                }}
                className="text-amber-400 hover:underline normal-case font-semibold"
              >
                Open Full Library Search
              </button>
            </div>

            {quickSearchResults.length > 0 ? (
              quickSearchResults.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (onSelectDoc) {
                      onSelectDoc(doc);
                    }
                    setIsQuickSearchOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-900/90 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/60">
                        {doc.code}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        {doc.type}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {doc.category}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                      {doc.title}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {doc.summary}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching documents found for "{quickQuery}". Try searching by code (e.g. RA 10611, SOP#001, IKQAP#003) or topic.
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
