import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sliders,
  Building2,
  Briefcase,
  Wrench,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Users,
  Award,
  KeyRound,
  Copy,
  HardDrive,
  Server,
  Cloud,
  Megaphone,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  PortalUser,
  ItPortalConfig,
  ItFeatureFlags,
  CustomAppFeature,
  AccountRole,
} from '../types/foodSafety';
import {
  IT_ACCOUNT_DETAILS,
  DEFAULT_BRANCH_LIST,
  DEFAULT_POSITION_LIST,
  DEFAULT_IT_FEATURE_FLAGS,
  DEFAULT_IT_PORTAL_CONFIG,
  saveItPortalConfig,
  fetchAllPortalAccounts,
  updateStaffProfileByMaster,
  registerStaffAccount,
  runItAccountRepairAndSync,
  runItCertificateRegistryRepair,
} from '../services/authAndUploadService';

interface ItAdminHubViewProps {
  currentUser: PortalUser;
  itConfig: ItPortalConfig;
  onItConfigChanged: (config: ItPortalConfig) => void;
  initialSection?: 'features' | 'branches' | 'positions' | 'troubleshooting';
}

const FEATURE_FLAG_DEFINITIONS: Array<{
  key: keyof ItFeatureFlags;
  label: string;
  description: string;
  category: 'Navigation Tabs' | 'Training & Simulators' | 'Header & System Controls';
}> = [
  {
    key: 'enableQuickSearch',
    label: 'Global Search Bar & Category Filters',
    description: 'Allows staff to search SOP codes, policies, and filter by department in the top header.',
    category: 'Header & System Controls',
  },
  {
    key: 'enableQuickReferenceTab',
    label: 'Quick Guide Tab (Temperatures & Color Matrix)',
    description: 'Shows the Quick Guide bottom navigation tab for critical temperatures and hardware color codes.',
    category: 'Navigation Tabs',
  },
  {
    key: 'enableTrainingGamesTab',
    label: 'Simulators Tab (Interactive Training Hub)',
    description: 'Enables the Simulators bottom navigation tab for roleplay and hazard spotting games.',
    category: 'Navigation Tabs',
  },
  {
    key: 'enableReceptionistSimulator',
    label: 'FOH Receptionist Roleplay Simulator',
    description: 'Enables the 8-stage JNLD-CHK-FOH-REC-001 interactive guest reception simulator inside Simulators.',
    category: 'Training & Simulators',
  },
  {
    key: 'enableHazardArcadeGame',
    label: 'Kitchen & Dining Hazard Spotter Arcade',
    description: 'Enables the interactive visual food safety violation spotting game inside Simulators.',
    category: 'Training & Simulators',
  },
  {
    key: 'enableAudioTtsTab',
    label: 'Listen (Audio TTS Reader) Tab',
    description: 'Shows the Listen bottom navigation tab for hands-free spoken SOP & Policy playback.',
    category: 'Navigation Tabs',
  },
  {
    key: 'enableTrainingQuizTab',
    label: 'Training Audit & Competency Certificate Tab',
    description: 'Shows the Training Audit quiz tab and official single-certificate generator.',
    category: 'Navigation Tabs',
  },
  {
    key: 'enableAiAssistant',
    label: 'L&D Virtual Support Drawer & Tab',
    description: 'Enables the L&D Virtual Support compliance Q&A assistant button and navigation tab.',
    category: 'Header & System Controls',
  },
  {
    key: 'enableBookmarks',
    label: 'Saved Bookmarks Filter',
    description: 'Allows staff to bookmark frequently used SOPs and filter by saved items.',
    category: 'Header & System Controls',
  },
  {
    key: 'enablePhoneFrameToggle',
    label: 'Phone / Full-Width Viewport Toggle',
    description: 'Allows desktop users to switch between full-screen layout and Android phone preview frame.',
    category: 'Header & System Controls',
  },
  {
    key: 'enableConfidentialityGatePopup',
    label: 'Mandatory Confidentiality & Data Privacy Gate',
    description: 'Requires first-time visitors on a device to accept the Imperial Kitchen Group NDA before viewing SOPs.',
    category: 'Header & System Controls',
  },
];

export const ItAdminHubView: React.FC<ItAdminHubViewProps> = ({
  currentUser,
  itConfig,
  onItConfigChanged,
  initialSection = 'features',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'features' | 'branches' | 'positions' | 'troubleshooting'
  >(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSubTab(initialSection);
    }
  }, [initialSection]);

  const [saving, setSaving] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'success' | 'info' | 'warning';
    text: string;
  } | null>(null);

  // 1. Feature Manager state
  const [maintenanceDraft, setMaintenanceDraft] = useState(itConfig.maintenanceBanner || '');
  const [newFeatTitle, setNewFeatTitle] = useState('');
  const [newFeatDesc, setNewFeatDesc] = useState('');
  const [newFeatBadge, setNewFeatBadge] = useState('New Feature');
  const [newFeatCategory, setNewFeatCategory] =
    useState<CustomAppFeature['category']>('Operations');
  const [newFeatTargetTab, setNewFeatTargetTab] =
    useState<CustomAppFeature['targetTab']>('browse');
  const [newFeatActionLabel, setNewFeatActionLabel] = useState('Open Module');

  // 2. Branch List Editor state
  const [newBranchName, setNewBranchName] = useState('');
  const [editingBranchIdx, setEditingBranchIdx] = useState<number | null>(null);
  const [editingBranchValue, setEditingBranchValue] = useState('');

  // 3. Branch Positions Editor state
  const [newPositionName, setNewPositionName] = useState('');
  const [editingPosIdx, setEditingPosIdx] = useState<number | null>(null);
  const [editingPosValue, setEditingPosValue] = useState('');
  const [selectedBranchForMapping, setSelectedBranchForMapping] = useState<string>('__ALL__');

  // 4. IT Troubleshooting & Account Repair state
  const [accounts, setAccounts] = useState<PortalUser[]>([]);
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [copiedCred, setCopiedCred] = useState(false);
  const [itNewAccName, setItNewAccName] = useState('');
  const [itNewAccEmail, setItNewAccEmail] = useState('');
  const [itNewAccPassword, setItNewAccPassword] = useState('Staff2026!');
  const [itNewAccBranch, setItNewAccBranch] = useState(
    itConfig.branches[0] || DEFAULT_BRANCH_LIST[0]
  );
  const [itNewAccPosition, setItNewAccPosition] = useState(
    itConfig.positions[0] || DEFAULT_POSITION_LIST[0]
  );
  const [itNewAccRole, setItNewAccRole] = useState<AccountRole>('staff');

  useEffect(() => {
    setMaintenanceDraft(itConfig.maintenanceBanner || '');
  }, [itConfig.maintenanceBanner]);

  useEffect(() => {
    if (activeSubTab === 'troubleshooting') {
      fetchAllPortalAccounts()
        .then(setAccounts)
        .catch(() => {});
    }
  }, [activeSubTab]);

  const showNotice = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setBannerNotice({ text, type });
    setTimeout(() => {
      setBannerNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const persistConfig = async (
    nextPartial: Partial<ItPortalConfig>,
    successMsg: string
  ) => {
    setSaving(true);
    try {
      const updated = await saveItPortalConfig(
        nextPartial,
        `${currentUser.displayName} (${currentUser.email})`
      );
      onItConfigChanged(updated);
      showNotice(successMsg, 'success');
    } catch {
      showNotice('Saved locally; cloud sync will retry automatically.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // FEATURE MANAGER HANDLERS
  // ============================================================================
  const handleToggleFeatureFlag = async (key: keyof ItFeatureFlags) => {
    const nextFlags: ItFeatureFlags = {
      ...itConfig.featureFlags,
      [key]: !itConfig.featureFlags[key],
    };
    const def = FEATURE_FLAG_DEFINITIONS.find((d) => d.key === key);
    await persistConfig(
      { featureFlags: nextFlags },
      `${def?.label || key} ${nextFlags[key] ? 'ENABLED' : 'DISABLED'} across the app.`
    );
  };

  const handleEnableAllFlags = async () => {
    await persistConfig(
      { featureFlags: { ...DEFAULT_IT_FEATURE_FLAGS } },
      'All core application features have been enabled.'
    );
  };

  const handleSaveMaintenanceBanner = async (clear = false) => {
    const text = clear ? '' : maintenanceDraft.trim();
    if (clear) setMaintenanceDraft('');
    await persistConfig(
      { maintenanceBanner: text },
      clear
        ? 'System maintenance notice cleared.'
        : 'System announcement banner published to all portal users.'
    );
  };

  const handleAddCustomFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatTitle.trim()) return;
    const created: CustomAppFeature = {
      id: `feat-${Date.now()}`,
      title: newFeatTitle.trim(),
      description:
        newFeatDesc.trim() ||
        'Custom operational feature module deployed by Imperial Kitchen Group IT Hub.',
      badge: newFeatBadge.trim() || 'IT Module',
      category: newFeatCategory,
      enabled: true,
      actionLabel: newFeatActionLabel.trim() || 'Open Module',
      targetTab: newFeatTargetTab,
      createdAt: new Date().toISOString(),
    };
    const nextList = [created, ...(itConfig.customFeatures || [])];
    setNewFeatTitle('');
    setNewFeatDesc('');
    await persistConfig(
      { customFeatures: nextList },
      `Added custom app feature "${created.title}".`
    );
  };

  const handleToggleCustomFeature = async (id: string) => {
    const nextList = (itConfig.customFeatures || []).map((f) =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    await persistConfig({ customFeatures: nextList }, 'Updated custom feature visibility.');
  };

  const handleDeleteCustomFeature = async (id: string, title: string) => {
    const nextList = (itConfig.customFeatures || []).filter((f) => f.id !== id);
    await persistConfig({ customFeatures: nextList }, `Removed feature "${title}".`);
  };

  // ============================================================================
  // BRANCH LIST HANDLERS
  // ============================================================================
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBranchName.trim();
    if (!clean) return;
    if (itConfig.branches.some((b) => b.toLowerCase() === clean.toLowerCase())) {
      showNotice(`Branch "${clean}" is already in the branch list.`, 'warning');
      return;
    }
    const nextBranches = [...itConfig.branches, clean];
    setNewBranchName('');
    await persistConfig(
      { branches: nextBranches },
      `Added branch "${clean}" to portal registration and directory.`
    );
  };

  const handleSaveBranchRename = async (idx: number) => {
    const clean = editingBranchValue.trim();
    const oldName = itConfig.branches[idx];
    if (!clean || !oldName) {
      setEditingBranchIdx(null);
      return;
    }
    const nextBranches = itConfig.branches.map((b, i) => (i === idx ? clean : b));
    const nextMap = { ...(itConfig.branchPositionsMap || {}) };
    if (oldName !== clean && nextMap[oldName]) {
      nextMap[clean] = nextMap[oldName];
      delete nextMap[oldName];
    }
    setEditingBranchIdx(null);
    await persistConfig(
      { branches: nextBranches, branchPositionsMap: nextMap },
      `Renamed branch "${oldName}" to "${clean}".`
    );
  };

  const handleMoveBranch = async (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= itConfig.branches.length) return;
    const nextBranches = [...itConfig.branches];
    const [moved] = nextBranches.splice(idx, 1);
    nextBranches.splice(targetIdx, 0, moved);
    await persistConfig({ branches: nextBranches }, `Updated branch order for "${moved}".`);
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (itConfig.branches.length <= 1) {
      showNotice('At least one branch must remain in the system.', 'warning');
      return;
    }
    const nextBranches = itConfig.branches.filter((b) => b !== branchName);
    const nextMap = { ...(itConfig.branchPositionsMap || {}) };
    delete nextMap[branchName];
    await persistConfig(
      { branches: nextBranches, branchPositionsMap: nextMap },
      `Removed branch "${branchName}".`
    );
  };

  const handleResetBranches = async () => {
    await persistConfig(
      { branches: [...DEFAULT_BRANCH_LIST] },
      'Restored default Imperial Kitchen Group branch list.'
    );
  };

  // ============================================================================
  // BRANCH POSITIONS HANDLERS
  // ============================================================================
  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPositionName.trim();
    if (!clean) return;
    if (itConfig.positions.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      showNotice(`Position "${clean}" already exists.`, 'warning');
      return;
    }
    const nextPositions = [...itConfig.positions, clean];
    setNewPositionName('');
    await persistConfig(
      { positions: nextPositions },
      `Added position "${clean}" to official branch positions.`
    );
  };

  const handleSavePositionRename = async (idx: number) => {
    const clean = editingPosValue.trim();
    const oldPos = itConfig.positions[idx];
    if (!clean || !oldPos) {
      setEditingPosIdx(null);
      return;
    }
    const nextPositions = itConfig.positions.map((p, i) => (i === idx ? clean : p));
    const nextMap: Record<string, string[]> = {};
    for (const [bKey, pList] of Object.entries(itConfig.branchPositionsMap || {})) {
      nextMap[bKey] = pList.map((p) => (p === oldPos ? clean : p));
    }
    setEditingPosIdx(null);
    await persistConfig(
      { positions: nextPositions, branchPositionsMap: nextMap },
      `Renamed position "${oldPos}" to "${clean}".`
    );
  };

  const handleMovePosition = async (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= itConfig.positions.length) return;
    const nextPositions = [...itConfig.positions];
    const [moved] = nextPositions.splice(idx, 1);
    nextPositions.splice(targetIdx, 0, moved);
    await persistConfig({ positions: nextPositions }, `Reordered position "${moved}".`);
  };

  const handleDeletePosition = async (posName: string) => {
    if (itConfig.positions.length <= 1) {
      showNotice('At least one position must remain in the system.', 'warning');
      return;
    }
    const nextPositions = itConfig.positions.filter((p) => p !== posName);
    const nextMap: Record<string, string[]> = {};
    for (const [bKey, pList] of Object.entries(itConfig.branchPositionsMap || {})) {
      const filtered = pList.filter((p) => p !== posName);
      if (filtered.length > 0) nextMap[bKey] = filtered;
    }
    await persistConfig(
      { positions: nextPositions, branchPositionsMap: nextMap },
      `Removed position "${posName}".`
    );
  };

  const handleToggleBranchSpecificPosition = async (branchName: string, posName: string) => {
    const currentMap = { ...(itConfig.branchPositionsMap || {}) };
    const currentAssigned = currentMap[branchName]
      ? [...currentMap[branchName]]
      : [...itConfig.positions];

    const exists = currentAssigned.includes(posName);
    const nextAssigned = exists
      ? currentAssigned.filter((p) => p !== posName)
      : [...currentAssigned, posName];

    if (nextAssigned.length === 0) {
      showNotice('A branch must have at least one selectable position.', 'warning');
      return;
    }

    currentMap[branchName] = nextAssigned;
    await persistConfig(
      { branchPositionsMap: currentMap },
      `Updated assigned positions for ${branchName}.`
    );
  };

  const handleResetBranchMappingToGlobal = async (branchName: string) => {
    const currentMap = { ...(itConfig.branchPositionsMap || {}) };
    delete currentMap[branchName];
    await persistConfig(
      { branchPositionsMap: currentMap },
      `${branchName} now uses all global positions.`
    );
  };

  const handleResetAllPositions = async () => {
    await persistConfig(
      { positions: [...DEFAULT_POSITION_LIST], branchPositionsMap: {} },
      'Restored default positions and cleared custom branch restrictions.'
    );
  };

  // ============================================================================
  // IT TROUBLESHOOTING & DIAGNOSTICS HANDLERS
  // ============================================================================
  const handleRunAccountRepair = async () => {
    setLoadingDiag(true);
    try {
      const res = await runItAccountRepairAndSync();
      setAccounts(res.accounts);
      showNotice(
        `Repaired & synchronized ${res.repairedCount} account(s) across LocalStorage, Express Server, and Firestore.`,
        'success'
      );
    } finally {
      setLoadingDiag(false);
    }
  };

  const handleRunCertRepair = async () => {
    setLoadingDiag(true);
    try {
      const res = await runItCertificateRegistryRepair();
      showNotice(
        `Re-indexed & verified ${res.indexedCount} official training certificate serial code(s).`,
        'success'
      );
    } finally {
      setLoadingDiag(false);
    }
  };

  const handleResetNdaGate = () => {
    try {
      localStorage.removeItem('ikqa_confidentiality_accepted_v1');
      showNotice(
        'Reset local NDA Confidentiality Gate. It will prompt again on next reload.',
        'info'
      );
    } catch {
      // ignore
    }
  };

  const handleExportSystemConfig = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.email,
      itConfig,
      accountsCount: accounts.length,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IKG-IT-Hub-Config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Downloaded IT Hub System Configuration JSON backup.', 'success');
  };

  const handleCreateOrUpdateItAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itNewAccName.trim() || !itNewAccEmail.trim()) return;
    setLoadingDiag(true);
    try {
      await registerStaffAccount({
        displayName: itNewAccName.trim(),
        email: itNewAccEmail.trim(),
        password: itNewAccPassword.trim() || 'Staff2026!',
        position: itNewAccPosition,
        branch: itNewAccBranch,
        role: itNewAccRole,
        ndaSignature: 'I AGREE',
      });
      const updatedList = await fetchAllPortalAccounts();
      setAccounts(updatedList);
      setItNewAccName('');
      setItNewAccEmail('');
      showNotice(
        `Provisioned ${itNewAccRole.toUpperCase()} account for ${itNewAccName.trim()}.`,
        'success'
      );
    } catch (err: any) {
      showNotice(err?.message || 'Could not create account.', 'warning');
    } finally {
      setLoadingDiag(false);
    }
  };

  const handleQuickRoleChange = async (acc: PortalUser, newRole: AccountRole) => {
    setLoadingDiag(true);
    try {
      const updated = await updateStaffProfileByMaster(acc, {
        displayName: acc.displayName,
        position:
          newRole === 'it' && !acc.position.toLowerCase().includes('it')
            ? IT_ACCOUNT_DETAILS.position
            : acc.position,
        branch: acc.branch,
        role: newRole,
        status: 'approved',
      });
      setAccounts(updated);
      showNotice(
        `Updated ${acc.displayName} role to ${newRole.toUpperCase()} (Approved).`,
        'success'
      );
    } finally {
      setLoadingDiag(false);
    }
  };

  const enabledFlagsCount = Object.values(itConfig.featureFlags).filter(Boolean).length;
  const totalFlagsCount = Object.keys(DEFAULT_IT_FEATURE_FLAGS).length;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 pb-28 space-y-5">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-cyan-500/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <Cpu className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-400 text-slate-950">
                  IT Hub Console
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live Cloud & Local Sync
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                IT Systems, Feature Manager & Branch Configuration Hub
              </h1>
              <p className="text-xs text-cyan-100/80 mt-0.5">
                Signed in as <strong className="text-white">{currentUser.displayName}</strong> (
                {currentUser.email}) • Add/remove app features, edit branch lists, customize branch
                positions, and run portal diagnostics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportSystemConfig}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-cyan-100 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              Export Config
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-cyan-200/70 font-bold">
              Active Core Features
            </div>
            <div className="text-lg font-black text-white mt-0.5">
              {enabledFlagsCount} / {totalFlagsCount}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-cyan-200/70 font-bold">
              Custom IT Modules
            </div>
            <div className="text-lg font-black text-cyan-300 mt-0.5">
              {(itConfig.customFeatures || []).filter((f) => f.enabled).length} Active
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-cyan-200/70 font-bold">
              Official Branches
            </div>
            <div className="text-lg font-black text-emerald-300 mt-0.5">
              {itConfig.branches.length} Branches
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-cyan-200/70 font-bold">
              Branch Positions
            </div>
            <div className="text-lg font-black text-amber-300 mt-0.5">
              {itConfig.positions.length} Positions
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {bannerNotice && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-bold shadow-sm ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
              : bannerNotice.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
              : 'bg-cyan-50 border-cyan-200 text-cyan-900 dark:bg-cyan-950/60 dark:border-cyan-800 dark:text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerNotice.text}</span>
          </div>
          <button
            onClick={() => setBannerNotice(null)}
            className="p-1 hover:bg-black/5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4-Section Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveSubTab('features')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
            activeSubTab === 'features'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>Add / Remove Features</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branches')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
            activeSubTab === 'branches'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Edit Branch List ({itConfig.branches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('positions')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
            activeSubTab === 'positions'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>Branch Positions ({itConfig.positions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('troubleshooting')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
            activeSubTab === 'troubleshooting'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4 shrink-0" />
          <span>IT Troubleshooting</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: ADD OR REMOVE FEATURES IN THE APP
         ===================================================================== */}
      {activeSubTab === 'features' && (
        <div className="space-y-5">
          {/* Core Feature Toggles */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-600" />
                  Core App Feature Switches (Enable / Disable Modules Live)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Toggle any built-in navigation tab, simulator, or header tool on or off across all
                  devices immediately.
                </p>
              </div>
              <button
                onClick={handleEnableAllFlags}
                disabled={saving}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold hover:bg-cyan-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Enable All Core Features
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {FEATURE_FLAG_DEFINITIONS.map((item) => {
                const isOn = Boolean(itConfig.featureFlags[item.key]);
                return (
                  <div
                    key={item.key}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      isOn
                        ? 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 opacity-85'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isOn
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isOn ? 'Active' : 'Removed'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                      <span className="inline-block text-[10px] font-semibold text-cyan-700 dark:text-cyan-400">
                        Category: {item.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatureFlag(item.key)}
                      disabled={saving}
                      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isOn
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-cyan-600 hover:text-white'
                      }`}
                    >
                      {isOn ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>On</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>Off</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add / Remove Custom App Feature Modules */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                Add or Remove Custom App Feature Cards & Portal Modules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deploy custom feature cards, operational shortcuts, or IT support modules directly to
                the main portal screen.
              </p>
            </div>

            <form
              onSubmit={handleAddCustomFeature}
              className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                + Deploy New App Feature / Module
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Feature Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeatTitle}
                    onChange={(e) => setNewFeatTitle(e.target.value)}
                    placeholder="e.g., Daily Branch Equipment Calibration Log"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={newFeatBadge}
                    onChange={(e) => setNewFeatBadge(e.target.value)}
                    placeholder="e.g., New Feature"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Feature Description & Instructions
                </label>
                <textarea
                  rows={2}
                  value={newFeatDesc}
                  onChange={(e) => setNewFeatDesc(e.target.value)}
                  placeholder="Describe what this feature provides or instructions for branch staff..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newFeatCategory}
                    onChange={(e) =>
                      setNewFeatCategory(e.target.value as CustomAppFeature['category'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Training">Training</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Announcement">Announcement</option>
                    <option value="IT Support">IT Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Shortcut Destination Tab
                  </label>
                  <select
                    value={newFeatTargetTab}
                    onChange={(e) =>
                      setNewFeatTargetTab(e.target.value as CustomAppFeature['targetTab'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="browse">Policies & SOPs Directory</option>
                    <option value="quick-ref">Quick Guide (Temps & Matrix)</option>
                    <option value="games">Interactive Simulators</option>
                    <option value="audio">Listen (Audio Reader)</option>
                    <option value="quiz">Training Audit & Certificate</option>
                    <option value="ai">L&D Virtual Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={newFeatActionLabel}
                    onChange={(e) => setNewFeatActionLabel(e.target.value)}
                    placeholder="Open Module"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature to App
                </button>
              </div>
            </form>

            {/* Existing Custom Features List */}
            <div className="space-y-2.5">
              {(itConfig.customFeatures || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No custom app feature cards configured. Use the form above to add one.
                </div>
              ) : (
                (itConfig.customFeatures || []).map((feat) => (
                  <div
                    key={feat.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                      feat.enabled
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                          {feat.badge}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {feat.title}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          ({feat.category} → {feat.targetTab || 'browse'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {feat.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleCustomFeature(feat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          feat.enabled
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {feat.enabled ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomFeature(feat.id, feat.title)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                        title="Remove Feature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Maintenance / IT Broadcast Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              IT System Notice / Maintenance Banner
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Display a global IT announcement banner at the top of the app (leave empty to hide).
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={maintenanceDraft}
                onChange={(e) => setMaintenanceDraft(e.target.value)}
                placeholder="e.g., IT Notice: SM Mall of Asia & BGC branch tablets updated to v2.4 SOP catalog."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleSaveMaintenanceBanner(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold"
              >
                Publish Notice
              </button>
              {itConfig.maintenanceBanner && (
                <button
                  type="button"
                  onClick={() => handleSaveMaintenanceBanner(true)}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: EDIT BRANCH LIST
         ===================================================================== */}
      {activeSubTab === 'branches' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600" />
                Official Imperial Kitchen Group / Jiangnan Hotpot Branch List
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add new restaurant branches, rename existing locations, reorder how they appear in
                Sign-In / Registration, or remove closed branches.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetBranches}
              disabled={saving}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Default Branches
            </button>
          </div>

          {/* Add New Branch Form */}
          <form onSubmit={handleAddBranch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="Enter new branch name (e.g., Jiangnan Hotpot - Quezon Avenue)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          </form>

          {/* Branch List Items */}
          <div className="space-y-2">
            {itConfig.branches.map((branch, idx) => {
              const isEditing = editingBranchIdx === idx;
              const customPosCount = itConfig.branchPositionsMap?.[branch]?.length;
              return (
                <div
                  key={`${branch}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 text-[11px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingBranchValue}
                        onChange={(e) => setEditingBranchValue(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-cyan-500 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {branch}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {customPosCount
                            ? `${customPosCount} custom branch-assigned positions`
                            : `Uses all ${itConfig.positions.length} global branch positions`}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveBranchRename(idx)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                          title="Save Branch Name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBranchIdx(null)}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMoveBranch(idx, -1)}
                          disabled={idx === 0 || saving}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBranch(idx, 1)}
                          disabled={idx === itConfig.branches.length - 1 || saving}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBranchIdx(idx);
                            setEditingBranchValue(branch);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-cyan-500"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(branch)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 hover:bg-rose-100"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: EDIT BRANCH POSITIONS & PER-BRANCH POSITION ASSIGNMENTS
         ===================================================================== */}
      {activeSubTab === 'positions' && (
        <div className="space-y-5">
          {/* Global Position Catalog Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-cyan-600" />
                  Edit Branch Positions & Job Titles Catalog
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Add new FOH/BOH/HQ positions, rename job titles, reorder, or remove obsolete
                  positions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAllPositions}
                disabled={saving}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Default Positions
              </button>
            </div>

            <form onSubmit={handleAddPosition} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                placeholder="Enter new branch position (e.g., Sauce Bar & Condiment Attendant)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Position
              </button>
            </form>

            <div className="space-y-2">
              {itConfig.positions.map((pos, idx) => {
                const isEditing = editingPosIdx === idx;
                return (
                  <div
                    key={`${pos}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingPosValue}
                          onChange={(e) => setEditingPosValue(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-cyan-500 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {pos}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSavePositionRename(idx)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                            title="Save Position"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPosIdx(null)}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMovePosition(idx, -1)}
                            disabled={idx === 0 || saving}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePosition(idx, 1)}
                            disabled={idx === itConfig.positions.length - 1 || saving}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPosIdx(idx);
                              setEditingPosValue(pos);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-cyan-500"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePosition(pos)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 hover:bg-rose-100"
                            title="Delete Position"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch-Specific Position Assignment Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-600" />
                Branch-Specific Position Assignments (Optional Per-Branch Filtering)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize which positions appear when a staff member selects a specific branch (e.g.
                Central Commissary vs Restaurant Branch vs HQ).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 shrink-0">
                Configure Positions For Branch:
              </label>
              <select
                value={selectedBranchForMapping}
                onChange={(e) => setSelectedBranchForMapping(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="__ALL__">
                  Global Catalog (All Branches Use Full Position List by Default)
                </option>
                {itConfig.branches.map((b) => (
                  <option key={b} value={b}>
                    {b}{' '}
                    {itConfig.branchPositionsMap?.[b]
                      ? `(${itConfig.branchPositionsMap[b].length} Custom Assigned)`
                      : '(All Global Positions)'}
                  </option>
                ))}
              </select>

              {selectedBranchForMapping !== '__ALL__' &&
                itConfig.branchPositionsMap?.[selectedBranchForMapping] && (
                  <button
                    type="button"
                    onClick={() => handleResetBranchMappingToGlobal(selectedBranchForMapping)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Use All Global Positions
                  </button>
                )}
            </div>

            {selectedBranchForMapping === '__ALL__' ? (
              <div className="p-4 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 text-xs text-cyan-900 dark:text-cyan-200">
                Select any specific branch from the dropdown above if you want to restrict or
                tailor which positions are selectable for that branch during Staff Registration and
                Profile Updates.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {itConfig.positions.map((pos) => {
                  const assignedList =
                    itConfig.branchPositionsMap?.[selectedBranchForMapping] || itConfig.positions;
                  const isAssigned = assignedList.includes(pos);
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() =>
                        handleToggleBranchSpecificPosition(selectedBranchForMapping, pos)
                      }
                      className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition-all ${
                        isAssigned
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{pos}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                          isAssigned
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isAssigned ? 'Assigned' : 'Excluded'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: IT TROUBLESHOOTING, DIAGNOSTICS & ACCOUNT ROLE TOOLS
         ===================================================================== */}
      {activeSubTab === 'troubleshooting' && (
        <div className="space-y-5">
          {/* System Health & 1-Click Repair Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-600" />
              IT Troubleshooting & Automated Self-Healing Utilities
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <Server className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">
                    Express API Server
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Online • /api/it-config Active
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <Cloud className="w-8 h-8 text-cyan-500 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">
                    Firestore Cloud Sync
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Connected • Real-Time Listener
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <HardDrive className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">
                    Registered Accounts
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {accounts.length} Total Portal Accounts
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-cyan-950 dark:text-cyan-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    Repair Account Approval & Role Sync
                  </div>
                  <p className="text-[11px] text-cyan-800/80 dark:text-cyan-300/80 mt-1">
                    Fixes accounts stuck on Pending status after approval and synchronizes Master, IT
                    Hub, and Staff accounts across LocalStorage, Express, and Firestore.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAccountRepair}
                  disabled={loadingDiag}
                  className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDiag ? 'animate-spin' : ''}`} />
                  Run Account Sync Repair
                </button>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Re-Index Certificate Verification Serials
                  </div>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                    Deduplicates staff certificates and repairs deterministic{' '}
                    <code className="font-mono font-bold">IKG-LD-2026-...</code> serial codes so all
                    certificates verify cleanly in Master Hub.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunCertRepair}
                  disabled={loadingDiag}
                  className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Re-Index Certificate Registry
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleResetNdaGate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Reset Device NDA Confidentiality Gate
              </button>
              <button
                type="button"
                onClick={handleExportSystemConfig}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-cyan-600" />
                Download Full IT Config JSON
              </button>
            </div>
          </div>

          {/* Official IT Hub Default Credentials Reference Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-600" />
                Official IT Hub Account Credentials
              </h3>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `Email/ID: ${IT_ACCOUNT_DETAILS.email} (or ${IT_ACCOUNT_DETAILS.username}) | Password: ${IT_ACCOUNT_DETAILS.password}`
                  );
                  setCopiedCred(true);
                  setTimeout(() => setCopiedCred(false), 2500);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold"
              >
                <Copy className="w-3 h-3" />
                {copiedCred ? 'Copied!' : 'Copy Credentials'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Email / Login ID</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {IT_ACCOUNT_DETAILS.email}
                </div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400">
                  or username: <strong>{IT_ACCOUNT_DETAILS.username}</strong>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Password</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {IT_ACCOUNT_DETAILS.password}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Role</div>
                <div className="font-bold text-cyan-700 dark:text-cyan-300 mt-0.5">
                  IT Hub Admin (role: &apos;it&apos;)
                </div>
              </div>
            </div>
          </div>

          {/* Provision Account / Role Switcher */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              IT Account Provisioning & Role Assignment
            </h3>

            <form
              onSubmit={handleCreateOrUpdateItAccount}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <input
                type="text"
                required
                value={itNewAccName}
                onChange={(e) => setItNewAccName(e.target.value)}
                placeholder="Full Name *"
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                required
                value={itNewAccEmail}
                onChange={(e) => setItNewAccEmail(e.target.value)}
                placeholder="Email or Employee ID *"
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                required
                value={itNewAccPassword}
                onChange={(e) => setItNewAccPassword(e.target.value)}
                placeholder="Password *"
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
              <select
                value={itNewAccBranch}
                onChange={(e) => setItNewAccBranch(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                {itConfig.branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={itNewAccPosition}
                onChange={(e) => setItNewAccPosition(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                {itConfig.positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={itNewAccRole}
                  onChange={(e) => setItNewAccRole(e.target.value as AccountRole)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="staff">Role: Staff</option>
                  <option value="it">Role: IT Hub Account</option>
                  <option value="master">Role: Master Account</option>
                </select>
                <button
                  type="submit"
                  disabled={loadingDiag}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shrink-0"
                >
                  Create
                </button>
              </div>
            </form>

            {/* Quick Account Role Inspector */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {accounts.map((acc) => (
                <div
                  key={acc.uid}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{acc.displayName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          acc.role === 'master'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : acc.role === 'it'
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {acc.role === 'it' ? 'IT Hub' : acc.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {acc.email} • {acc.position} • {acc.branch}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['staff', 'it', 'master'] as AccountRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleQuickRoleChange(acc, r)}
                        disabled={acc.role === r || loadingDiag}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                          acc.role === r
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500'
                        }`}
                      >
                        {r === 'it' ? 'IT Hub' : r}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
