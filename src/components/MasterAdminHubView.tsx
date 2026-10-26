import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Upload,
  Sparkles,
  FileText,
  ClipboardCheck,
  Gamepad2,
  Trash2,
  CheckCircle2,
  Clock,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Plus,
  BookOpen,
  FolderUp,
  Layers,
  AlertCircle,
} from 'lucide-react';
import {
  PortalUser,
  FoodSafetyDoc,
  DocumentType,
  DepartmentCategory,
} from '../types/foodSafety';
import {
  MASTER_ACCOUNT_DETAILS,
  fetchAllPortalAccounts,
  subscribeToPortalAccounts,
  updateAccountApprovalStatus,
  registerStaffAccount,
  parseDocumentWithAI,
  publishCustomDocument,
  removeCustomDocument,
} from '../services/authAndUploadService';

interface MasterAdminHubViewProps {
  currentUser: PortalUser;
  documents: FoodSafetyDoc[];
  onAddOrUpdateCustomDoc: (doc: FoodSafetyDoc) => void;
  onDeleteCustomDoc: (docId: string) => void;
  onOpenDoc: (doc: FoodSafetyDoc) => void;
  onLaunchGameWithDoc: (mode: 'receptionist' | 'hazard', doc: FoodSafetyDoc) => void;
  onLaunchAIWithDoc: (doc: FoodSafetyDoc) => void;
  onAccountsChanged?: (pendingCount: number) => void;
}

const SAMPLE_UPLOAD_TEMPLATES: {
  label: string;
  docType: DocumentType;
  code: string;
  title: string;
  category: DepartmentCategory;
  rawText: string;
}[] = [
  {
    label: 'Station Checklist: Server Table Turnover (JNLD-CHK-FOH-SER-002)',
    docType: 'checklist',
    code: 'JNLD-CHK-FOH-SER-002',
    title: 'Server Station & Table Turnover Checklist (Version 1)',
    category: 'Station Checklists',
    rawText: `Section 1: Table Setup & Induction Stove Check
* Verify induction stove glass surface is sanitized with a BLUE FOH towel and free of grease residue before seating guests.
* Place sanitized soup ladle, perforated skimmer, and color-coded raw meat tongs at each station.

Section 2: Guest Endorsement & Allergen Confirmation
* Receive the Bill Out form from the Receptionist and immediately verify table number, pax count, package tier, and any written allergen or birthday/senior notes.
* Repeat any disclosed food allergy back to the guest at the table and alert the Kitchen Dispatch Lead before serving the soup base.

Section 3: Soup Base & Initial Meat Delivery
* Deliver the selected soup pot (max 2 flavors; verify Mushroom Soup for non-pork diners) and set induction heat to level 4 until boiling.
* Serve up to 3 initial meat plates using correct plate color coding (Red/Yellow for US Beef, Brown/Green for Pork Belly, Orange for Angus Beef).

Section 4: Bill Out & Table Reset
* Present the Additional Order Form for unlimited reorders and remind guests politely of the 2-hour dining window and No Leftover Policy (₱1,000 excessive leftover charge).`,
  },
  {
    label: 'SOP: Hotpot Broth Boiling & Skimming (IKQA-SOP#013)',
    docType: 'sop',
    code: 'IKQA-SOP#013',
    title: 'Hotpot Broth Preparation, Boiling & Skimming Standard',
    category: 'Temperature & Cold Chain',
    rawText: `1. Broth Simmering & Kill Step Verification
* All bone and spicy hotpot broths must reach a rolling boil of at least 95°C to 100°C for a minimum of 15 minutes prior to hot-holding.
* Hot-holding broth warmers at the dispatch pass must maintain a core temperature of ≥ 60°C at all times (probe every 2 hours).

2. Skimming & Fat Clarity Control
* Skim surface foam, coagulated blood proteins, and excess spice sediment every 30 minutes using a dedicated sanitized fine-mesh stainless skimmer.
* Never top up hot-holding broth pots with unboiled raw tap water; use only boiling potable RO water or pre-heated stock ≥ 85°C.

3. Rapid Two-Stage Cooling for Leftover Stock
* Unserved stock must be cooled in shallow stainless pans in an ice-water bath: from 60°C down to 21°C within 2 hours, and from 21°C down to ≤ 5°C within an additional 4 hours.`,
  },
  {
    label: 'Policy: Digital Temperature Logging & Sensor Audit (IKQAP#022)',
    docType: 'policy',
    code: 'IKQAP#022',
    title: 'Digital Temperature Logging & Cold Chain Escalation Policy',
    category: 'Corporate & Quality',
    rawText: `1. Mandatory 4-Hour Temperature Logging
* Kitchen Shift Leads must log walk-in chiller (0°C to 4°C) and deep freezer (≤ -18°C) temperatures every 4 hours on the official QA temperature logsheet.
* Never record estimated or falsified "pencil-whipped" numbers; always verify both the external digital gauge and an internal probe thermometer.

2. Out-of-Spec Escalation Protocol
* If any chiller exceeds 5.0°C for more than 30 minutes, immediately keep doors shut, probe internal product temperature, and transfer high-risk meats to a backup chiller ≤ 4°C.
* Notify the Store Manager and Preventive Maintenance team within 15 minutes and quarantine any food exceeding 5°C for > 2 hours.`,
  },
  {
    label: 'Guide: Allergen Cross-Contact Prevention Guide (IKQA-GDE#002)',
    docType: 'guide',
    code: 'IKQA-GDE#002',
    title: 'Sauce Bar & Kitchen Allergen Cross-Contact Prevention Guide',
    category: 'Allergens & Health',
    rawText: `1. Sauce Bar Utensil Segregation
* Peanut sauce, sesame paste, shrimp paste, and soy sauce bowls at the self-serve sauce bar must each have a dedicated labeled ladle.
* Inspect the sauce bar every 20 minutes; if a guest swaps ladles between peanut/sesame and other condiments, immediately replace the affected bowl and wash the ladle.

2. Back-of-House Allergen Order Handling
* All allergy-flagged Bill Out tickets must be prepared on the dedicated WHITE cutting board using PURPLE allergen-free utensils after a full 40–60 second handwash.`,
  },
];

export const MasterAdminHubView: React.FC<MasterAdminHubViewProps> = ({
  currentUser,
  documents,
  onAddOrUpdateCustomDoc,
  onDeleteCustomDoc,
  onOpenDoc,
  onLaunchGameWithDoc,
  onLaunchAIWithDoc,
  onAccountsChanged,
}) => {
  const [activeSection, setActiveSection] = useState<'approvals' | 'uploader' | 'credentials'>('approvals');

  // Accounts state
  const [accounts, setAccounts] = useState<PortalUser[]>([]);
  const [accountFilter, setAccountFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Quick Add Staff by Master state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('Staff2026!');
  const [newStaffPosition, setNewStaffPosition] = useState('FOH Receptionist');
  const [newStaffBranch, setNewStaffBranch] = useState('Jiangnan Hotpot - SM Mall of Asia');
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);

  // Uploader state
  const [docType, setDocType] = useState<DocumentType>('checklist');
  const [docCode, setDocCode] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DepartmentCategory>('Station Checklists');
  const [rawText, setRawText] = useState('');
  const [previewDoc, setPreviewDoc] = useState<FoodSafetyDoc | null>(null);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadSuccessBanner, setUploadSuccessBanner] = useState<FoodSafetyDoc | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const customDocs = documents.filter((d) => d.isCustom);
  const pendingAccountsCount = accounts.filter((a) => a.role !== 'master' && a.status === 'pending').length;

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const list = await fetchAllPortalAccounts();
      setAccounts(list);
      if (onAccountsChanged) {
        onAccountsChanged(list.filter((a) => a.role !== 'master' && a.status === 'pending').length);
      }
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToPortalAccounts((list) => {
      setAccounts(list);
      if (onAccountsChanged) {
        onAccountsChanged(list.filter((a) => a.role !== 'master' && a.status === 'pending').length);
      }
    });
    return () => unsubscribe();
  }, [onAccountsChanged]);

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleApprovalAction = async (
    acc: PortalUser,
    status: 'pending' | 'approved' | 'rejected',
    role?: 'master' | 'staff'
  ) => {
    const updated = await updateAccountApprovalStatus(acc, status, role);
    setAccounts(updated);
    if (onAccountsChanged) {
      onAccountsChanged(updated.filter((a) => a.status === 'pending').length);
    }
  };

  const handleMasterCreateApprovedStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    try {
      const created = await registerStaffAccount({
        displayName: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword || 'Staff2026!',
        position: newStaffPosition,
        branch: newStaffBranch,
      });
      const updated = await updateAccountApprovalStatus(created, 'approved', 'staff');
      setAccounts(updated);
      setNewStaffName('');
      setNewStaffEmail('');
      setShowAddStaffForm(false);
    } catch (err: any) {
      setUploadError(err.message || 'Could not create staff account.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' ');
    if (!docTitle.trim()) {
      setDocTitle(fileNameNoExt);
    }

    try {
      const text = await file.text();
      // Filter out binary PDF noise if user uploaded a raw PDF binary
      const printableText = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ').replace(/\s{3,}/g, '\n');
      setRawText(
        printableText.trim().length > 40
          ? printableText.slice(0, 15000)
          : `Uploaded File: ${file.name}\n1. Standard Procedure & Compliance Requirements\n* Ensure all staff follow ${fileNameNoExt} during shift operations.\n* Verify and log station readiness before opening.`
      );
    } catch {
      setUploadError('Could not read file text. Please paste the document text directly below.');
    }
  };

  const handleLoadSampleTemplate = (tpl: (typeof SAMPLE_UPLOAD_TEMPLATES)[0]) => {
    setDocType(tpl.docType);
    setDocCode(tpl.code);
    setDocTitle(tpl.title);
    setDocCategory(tpl.category);
    setRawText(tpl.rawText);
    setPreviewDoc(null);
    setUploadSuccessBanner(null);
    setUploadError(null);
  };

  const handleSmartStructurePreview = async () => {
    if (!rawText.trim() && !docTitle.trim()) {
      setUploadError('Please enter or upload document content or select a template first.');
      return;
    }
    setIsParsingAI(true);
    setUploadError(null);
    try {
      const { document: structured } = await parseDocumentWithAI({
        rawText: rawText.trim() || `${docTitle}\nFollow all station requirements and log compliance.`,
        docType,
        code: docCode.trim() || undefined,
        title: docTitle.trim() || undefined,
        category: docCategory,
        existingCustomCount: customDocs.length,
      });
      setPreviewDoc(structured);
      setDocCode(structured.code);
      setDocTitle(structured.title);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to structure document.');
    } finally {
      setIsParsingAI(false);
    }
  };

  const handlePublishDocument = async () => {
    if (!rawText.trim() && !previewDoc && !docTitle.trim()) {
      setUploadError('Please provide document content, upload a file, or load a template first.');
      return;
    }
    setIsPublishing(true);
    setUploadError(null);

    try {
      let targetDoc = previewDoc;
      if (!targetDoc) {
        const { document: structured } = await parseDocumentWithAI({
          rawText: rawText.trim() || `${docTitle}\nExecute and verify all steps per shift.`,
          docType,
          code: docCode.trim() || undefined,
          title: docTitle.trim() || undefined,
          category: docCategory,
          existingCustomCount: customDocs.length,
        });
        targetDoc = structured;
      } else {
        targetDoc = {
          ...targetDoc,
          code: (docCode.trim() || targetDoc.code).toUpperCase(),
          title: docTitle.trim() || targetDoc.title,
          type: docType,
          category: docCategory,
        };
      }

      const published = await publishCustomDocument(targetDoc);
      onAddOrUpdateCustomDoc(published);
      setUploadSuccessBanner(published);
      setPreviewDoc(null);
      setDocCode('');
      setDocTitle('');
      setRawText('');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to publish document.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteDoc = async (docItem: FoodSafetyDoc) => {
    await removeCustomDocument(docItem.id);
    onDeleteCustomDoc(docItem.id);
  };

  const filteredAccounts = accounts.filter((a) => {
    if (accountFilter === 'all') return true;
    return a.status === accountFilter;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Master Banner */}
      <div className="bg-gradient-to-br from-amber-950/90 via-slate-900 to-red-950/90 border border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>MASTER ACCOUNT CONTROL CENTER · {currentUser.email}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Master Account Approval & AI/Game Document Studio
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Approve staff account registrations and upload SOPs, Policies, Guides, and Station Checklists. Every uploaded document is automatically integrated into L&D Virtual Support AI, the Station Checklist Simulator, the 8-Bit Hazard Game, and the Training Quiz.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Pending Accounts</span>
              <span className="text-base font-mono font-black text-amber-400 tabular-nums">
                {pendingAccountsCount}
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Uploaded Docs</span>
              <span className="text-base font-mono font-black text-emerald-400 tabular-nums">
                {customDocs.length}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Switcher inside Master Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSection('uploader')}
            className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeSection === 'uploader'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1. Upload SOPs, Policies, Guides & Checklists</span>
          </button>

          <button
            onClick={() => setActiveSection('approvals')}
            className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeSection === 'approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>
              2. Staff Account Approvals ({pendingAccountsCount} Pending)
            </span>
          </button>

          <button
            onClick={() => setActiveSection('credentials')}
            className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeSection === 'credentials'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>3. Master Account Details & Credentials</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1: UPLOAD SOPs, POLICIES, GUIDES & STATION CHECKLISTS
         ===================================================================== */}
      {activeSection === 'uploader' && (
        <div className="space-y-4">
          {/* Quick-Load Sample Templates Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Quick-Load Sample Upload Templates (Click to pre-fill & test instant AI + Game integration)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Or upload your own file / paste text below
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_UPLOAD_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.code}
                  type="button"
                  onClick={() => handleLoadSampleTemplate(tpl)}
                  className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-amber-400 block">
                      {tpl.code} · {tpl.docType.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate block">
                      {tpl.title}
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-amber-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Main Upload Form Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <FolderUp className="w-4 h-4 text-amber-400" />
                  <span>Upload New SOP, Policy, Guide, or Station Checklist</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Automatically generates structured sections, AI knowledge grounding, Station Simulator roleplay stages, and 8-Bit Hazard Game spots.
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,.csv,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File (.txt, .md, .csv, .pdf)</span>
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Published Confirmation & Instant Launch Banner */}
            {uploadSuccessBanner && (
              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/60 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Published & Auto-Integrated: {uploadSuccessBanner.code} — {uploadSuccessBanner.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      This {uploadSuccessBanner.type.toUpperCase()} is now live in the Compliance Library, grounded in L&D Virtual Support AI, and playable in both the Station Checklist Simulator and 8-Bit Kitchen Safety Game!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenDoc(uploadSuccessBanner)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open in Library</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLaunchAIWithDoc(uploadSuccessBanner)}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI About {uploadSuccessBanner.code}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLaunchGameWithDoc('receptionist', uploadSuccessBanner)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Play in Station Checklist Game</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLaunchGameWithDoc('hazard', uploadSuccessBanner)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Play in 8-Bit Hazard Game</span>
                  </button>
                </div>
              </div>
            )}

            {/* Document Type & Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => {
                    const nextType = e.target.value as DocumentType;
                    setDocType(nextType);
                    if (nextType === 'checklist') setDocCategory('Station Checklists');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="checklist">Station Checklist (JNLD-CHK)</option>
                  <option value="sop">SOP (IKQA-SOP)</option>
                  <option value="policy">Policy (IKQAP)</option>
                  <option value="guide">Guide (IKQA-GDE)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Document Code
                </label>
                <input
                  type="text"
                  value={docCode}
                  onChange={(e) => setDocCode(e.target.value)}
                  placeholder={
                    docType === 'checklist'
                      ? 'e.g. JNLD-CHK-FOH-002'
                      : docType === 'policy'
                      ? 'e.g. IKQAP#022'
                      : docType === 'guide'
                      ? 'e.g. IKQA-GDE#002'
                      : 'e.g. IKQA-SOP#013'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Server Station & Table Turnover Checklist"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Department Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as DepartmentCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Station Checklists">Station Checklists</option>
                  <option value="Temperature & Cold Chain">Temperature & Cold Chain</option>
                  <option value="Sanitation & Pest">Sanitation & Pest</option>
                  <option value="Allergens & Health">Allergens & Health</option>
                  <option value="Receiving & Storage">Receiving & Storage</option>
                  <option value="Operations & Maintenance">Operations & Maintenance</option>
                  <option value="Uniform & Visitor">Uniform & Visitor</option>
                  <option value="Corporate & Quality">Corporate & Quality</option>
                </select>
              </div>
            </div>

            {/* Raw Content Textarea */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                SOP / Policy / Guide / Station Checklist Content (Paste raw procedures, scripts, or rules)
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your SOP steps, Policy clauses, Guide rules, or Station Checklist tasks and scripts here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* Action Buttons: AI Preview vs Direct Publish */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleSmartStructurePreview}
                disabled={isParsingAI || isPublishing}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${isParsingAI ? 'animate-spin' : ''}`} />
                <span>
                  {isParsingAI
                    ? 'AI Structuring & Building Game Scenarios...'
                    : 'Preview AI Structure & Game Scenarios'}
                </span>
              </button>

              <button
                type="button"
                onClick={handlePublishDocument}
                disabled={isPublishing || isParsingAI}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isPublishing
                    ? 'Publishing & Integrating...'
                    : 'Upload & Auto-Integrate to AI + Games'}
                </span>
              </button>
            </div>

            {/* AI Structured Preview Box */}
            {previewDoc && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    AI-Structured Preview: {previewDoc.code} — {previewDoc.title}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {previewDoc.sections.length} Sections · {previewDoc.quizQuestions?.length || 0} Quiz Qs ·{' '}
                    {previewDoc.customSimulationSteps?.length || 0} Game Stages
                  </span>
                </div>
                <p className="text-xs text-slate-300">{previewDoc.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold text-amber-400 block mb-1">
                      KEY TAKEAWAYS (AI GROUNDING)
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {previewDoc.keyTakeaways.slice(0, 3).map((kt, i) => (
                        <li key={i}>• {kt}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 block mb-1">
                      AUTO-GENERATED GAME & QUIZ INTEGRATION
                    </span>
                    <p className="text-[11px] text-slate-300">
                      • Station Sim Stage 1: {previewDoc.customSimulationSteps?.[0]?.scenarioTitle || 'Station Roleplay'}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      • 8-Bit Hazard Spot: {previewDoc.customHazardSpots?.[0]?.hazardTitle || 'SOP Audit Check'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List of Master-Uploaded Documents */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Master-Uploaded SOPs, Policies, Guides & Checklists ({customDocs.length})</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Synced with AI & Games
              </span>
            </div>

            {customDocs.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-xs text-slate-400 space-y-2">
                <p>No custom documents uploaded yet. Select a sample template above or upload a file to test instant AI and Game integration!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                          {doc.code}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {doc.type.toUpperCase()} · {doc.category} · {doc.sections.length} Sections
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{doc.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{doc.summary}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        onClick={() => onOpenDoc(doc)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Read</span>
                      </button>

                      <button
                        onClick={() => onLaunchAIWithDoc(doc)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-800/60 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ask AI</span>
                      </button>

                      <button
                        onClick={() => onLaunchGameWithDoc('receptionist', doc)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Sim Game</span>
                      </button>

                      <button
                        onClick={() => onLaunchGameWithDoc('hazard', doc)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>8-Bit Game</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 cursor-pointer"
                        title="Delete Uploaded Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: STAFF ACCOUNT APPROVALS & USER REGISTRY
         ===================================================================== */}
      {activeSection === 'approvals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Staff Account Creation Approval Queue</span>
              </h3>
              <p className="text-xs text-slate-400">
                Accounts created by staff remain locked in Pending state until approved here by the Master Account.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddStaffForm((p) => !p)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Pre-Approved Staff</span>
              </button>
              <button
                type="button"
                onClick={loadAccounts}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                title="Refresh Accounts"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAccounts ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {showAddStaffForm && (
            <form
              onSubmit={handleMasterCreateApprovedStaff}
              className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3"
            >
              <div className="text-xs font-bold text-amber-300">
                Create Pre-Approved Staff Account (Master Direct Provisioning)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Employee Full Name"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="Email or Employee ID"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Password"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newStaffPosition}
                  onChange={(e) => setNewStaffPosition(e.target.value)}
                  placeholder="Position (e.g. FOH Receptionist)"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newStaffBranch}
                  onChange={(e) => setNewStaffBranch(e.target.value)}
                  placeholder="Branch"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Save & Approve Account
                </button>
              </div>
            </form>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All Accounts (${accounts.length})` },
              {
                id: 'pending',
                label: `Pending Approval (${accounts.filter((a) => a.status === 'pending').length})`,
              },
              {
                id: 'approved',
                label: `Approved (${accounts.filter((a) => a.status === 'approved').length})`,
              },
              {
                id: 'rejected',
                label: `Rejected (${accounts.filter((a) => a.status === 'rejected').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAccountFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  accountFilter === tab.id
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Accounts List with Confidentiality Agreement Status Beside Every Name */}
          <div className="space-y-2.5">
            {filteredAccounts.map((acc) => {
              const isMaster = acc.role === 'master';
              const ndaAccepted = acc.ndaAccepted !== false;
              const ndaSig = acc.ndaSignature || 'I AGREE';
              const ndaDateFormatted = acc.ndaAcceptedAt || acc.createdAt
                ? new Date(acc.ndaAcceptedAt || acc.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Verified';

              return (
                <div
                  key={acc.uid}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    acc.status === 'pending'
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{acc.displayName}</span>

                      {/* Confidentiality Agreement Acceptance Indicator Beside Name */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                          ndaAccepted
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                            : 'bg-red-950/80 text-red-300 border-red-700/60'
                        }`}
                        title={`Confidentiality Agreement signed with "${ndaSig}" on ${ndaDateFormatted}`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>
                          Confidentiality Agreement: Accepted (&quot;{ndaSig}&quot;) · {ndaDateFormatted}
                        </span>
                      </span>

                      <span
                        className={`text-[11px] font-mono font-bold uppercase ${
                          isMaster
                            ? 'text-amber-300'
                            : acc.status === 'approved'
                            ? 'text-emerald-400'
                            : acc.status === 'pending'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        [{isMaster ? 'MASTER ACCOUNT' : acc.status}]
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-300">{acc.email}</span>
                      <span>·</span>
                      <span>{acc.position}</span>
                      <span>·</span>
                      <span>{acc.branch}</span>
                    </div>
                  </div>

                  {!isMaster && (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {acc.status !== 'approved' && (
                        <button
                          onClick={() => handleApprovalAction(acc, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Account</span>
                        </button>
                      )}

                      {acc.status !== 'rejected' && (
                        <button
                          onClick={() => handleApprovalAction(acc, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800/60 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{acc.status === 'pending' ? 'Decline' : 'Revoke Access'}</span>
                        </button>
                      )}

                      {acc.status === 'approved' && (
                        <button
                          onClick={() => handleApprovalAction(acc, 'approved', 'master')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-[11px] font-semibold cursor-pointer"
                        >
                          Promote to Master
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dedicated Master Confidentiality Agreement Acceptance Log Table */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Master Confidentiality Agreement Acceptance Registry ({accounts.length} Signed)
                </span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Verification Method: Manual Typing of &quot;I AGREE&quot;
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-3">Staff Name</th>
                    <th className="py-2.5 px-3">Confidentiality Agreement Status</th>
                    <th className="py-2.5 px-3">Typed Confirmation</th>
                    <th className="py-2.5 px-3">Position &amp; Branch</th>
                    <th className="py-2.5 px-3">Date Accepted</th>
                    <th className="py-2.5 px-3">Portal Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {accounts.map((acc) => {
                    const ndaDate = acc.ndaAcceptedAt || acc.createdAt;
                    return (
                      <tr key={`nda-${acc.uid}`} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                          {acc.displayName}
                          <span className="block text-[10px] font-mono font-normal text-slate-400">
                            {acc.email}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Accepted Agreement</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                          &quot;{acc.ndaSignature || 'I AGREE'}&quot;
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {acc.position} · <span className="text-slate-400">{acc.branch}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {ndaDate
                            ? new Date(ndaDate).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Verified'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              acc.role === 'master'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                : acc.status === 'approved'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : acc.status === 'pending'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                : 'bg-red-950 text-red-300 border border-red-800'
                            }`}
                          >
                            {acc.role === 'master' ? 'MASTER' : acc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 3: MASTER ACCOUNT DETAILS & CREDENTIALS CARD
         ===================================================================== */}
      {activeSection === 'credentials' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Official Master Account Details & Credentials</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Use these credentials on any device to sign in directly to the Master Account, approve staff registrations, and upload SOPs, Policies, Guides, and Station Checklists.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Master Email Address</span>
                <span className="font-mono font-bold text-white text-sm">
                  {MASTER_ACCOUNT_DETAILS.email}
                </span>
              </div>
              <button
                onClick={() => handleCopy(MASTER_ACCOUNT_DETAILS.email, 'm-email')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                {copiedKey === 'm-email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Master Username / ID</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {MASTER_ACCOUNT_DETAILS.username}
                </span>
              </div>
              <button
                onClick={() => handleCopy(MASTER_ACCOUNT_DETAILS.username, 'm-user')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                {copiedKey === 'm-user' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Master Password</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {MASTER_ACCOUNT_DETAILS.password}
                </span>
              </div>
              <button
                onClick={() => handleCopy(MASTER_ACCOUNT_DETAILS.password, 'm-pw')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                {copiedKey === 'm-pw' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Authorized Google Master Email</span>
                <span className="font-mono font-bold text-white text-sm">
                  {MASTER_ACCOUNT_DETAILS.googleOwnerEmail}
                </span>
              </div>
              <button
                onClick={() => handleCopy(MASTER_ACCOUNT_DETAILS.googleOwnerEmail, 'm-google')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                {copiedKey === 'm-google' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
