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
  Pencil,
  Save,
  X,
  Award,
  Search,
  Eye,
} from 'lucide-react';
import {
  PortalUser,
  FoodSafetyDoc,
  DocumentType,
  DepartmentCategory,
  TrainingCertificateRecord,
  CertificateVerificationStatus,
} from '../types/foodSafety';
import {
  MASTER_ACCOUNT_DETAILS,
  fetchAllPortalAccounts,
  subscribeToPortalAccounts,
  updateAccountApprovalStatus,
  updateStaffProfileByMaster,
  registerStaffAccount,
  parseDocumentWithAI,
  publishCustomDocument,
  removeCustomDocument,
  fetchAllIssuedCertificates,
  subscribeToIssuedCertificates,
  updateCertificateStatusByMaster,
  issueOrUpdateTrainingCertificate,
  verifyTrainingCertificateByCode,
  findMatchingCertificateInList,
  extractCleanCertQuery,
} from '../services/authAndUploadService';
import { TrainingCertificateModal } from './TrainingCertificateModal';

interface MasterAdminHubViewProps {
  currentUser: PortalUser;
  documents: FoodSafetyDoc[];
  onAddOrUpdateCustomDoc: (doc: FoodSafetyDoc) => void;
  onDeleteCustomDoc: (docId: string) => void;
  onOpenDoc: (doc: FoodSafetyDoc) => void;
  onLaunchGameWithDoc: (mode: 'receptionist' | 'hazard', doc: FoodSafetyDoc) => void;
  onLaunchAIWithDoc: (doc: FoodSafetyDoc) => void;
  onAccountsChanged?: (pendingCount: number) => void;
  onAccountProfileUpdated?: (updatedAccount: PortalUser) => void;
  initialCertVerifyCode?: string | null;
  onClearInitialCertVerifyCode?: () => void;
  initialSection?: 'approvals' | 'uploader' | 'certificates' | 'credentials' | null;
  onClearInitialSection?: () => void;
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
  onAccountProfileUpdated,
  initialCertVerifyCode,
  onClearInitialCertVerifyCode,
  initialSection,
  onClearInitialSection,
}) => {
  const [activeSection, setActiveSection] = useState<
    'approvals' | 'uploader' | 'certificates' | 'credentials'
  >(initialSection || 'certificates');

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
      if (onClearInitialSection) {
        onClearInitialSection();
      }
    }
  }, [initialSection, onClearInitialSection]);

  // Accounts state
  const [accounts, setAccounts] = useState<PortalUser[]>([]);
  const [accountFilter, setAccountFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Master Edit Staff Name / Position / Branch state
  const [editingAccountUid, setEditingAccountUid] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [savingProfileUid, setSavingProfileUid] = useState<string | null>(null);
  const [savedProfileMessage, setSavedProfileMessage] = useState<string | null>(null);

  // Quick Add Staff / Master Account by Master state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('Staff2026!');
  const [newStaffPosition, setNewStaffPosition] = useState('FOH Receptionist');
  const [newStaffBranch, setNewStaffBranch] = useState('Jiangnan Hotpot - SM Mall of Asia');
  const [newStaffRole, setNewStaffRole] = useState<'staff' | 'master'>('staff');
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);

  // Certificate Verification & Single-Certificate Registry state
  const [certificates, setCertificates] = useState<TrainingCertificateRecord[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [isVerifyingCert, setIsVerifyingCert] = useState(false);
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [verifiedLookupResult, setVerifiedLookupResult] = useState<TrainingCertificateRecord | null>(null);
  const [certLookupAttempted, setCertLookupAttempted] = useState(false);
  const [previewCert, setPreviewCert] = useState<TrainingCertificateRecord | null>(null);
  const [certStatusMessage, setCertStatusMessage] = useState<string | null>(null);

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
  const verifiedCertificatesCount = certificates.filter((c) => c.status === 'verified').length;

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

  const loadCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const list = await fetchAllIssuedCertificates();
      setCertificates(list);
    } finally {
      setLoadingCertificates(false);
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

  useEffect(() => {
    const unsubCerts = subscribeToIssuedCertificates((list) => {
      setCertificates(list);
    });
    return () => unsubCerts();
  }, []);

  const handleVerifyCertificateQuery = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const raw = (customCode !== undefined ? customCode : certSearchQuery).trim();
    const cleaned = extractCleanCertQuery(raw);
    if (!cleaned) {
      setCertLookupAttempted(false);
      setVerifiedLookupResult(null);
      return;
    }

    // Normalize input box if user pasted share text with a serial code inside
    if (customCode === undefined && cleaned.startsWith('IKG-LD-') && raw !== cleaned) {
      setCertSearchQuery(cleaned);
    }

    // 1. Instant synchronous check against loaded certificates & accounts
    const immediateHit = findMatchingCertificateInList(cleaned, certificates, accounts);
    if (immediateHit) {
      setVerifiedLookupResult(immediateHit);
      setCertLookupAttempted(true);
    }

    // 2. Full cross-store verification (Express + Firestore + LocalStorage + Account Self-Healing)
    setIsVerifyingCert(true);
    try {
      const { certificate, allCertificates } = await verifyTrainingCertificateByCode(cleaned);
      setCertificates(allCertificates);
      setVerifiedLookupResult(certificate || immediateHit || null);
      setCertLookupAttempted(true);
    } finally {
      setIsVerifyingCert(false);
    }
  };

  useEffect(() => {
    if (initialCertVerifyCode && initialCertVerifyCode.trim()) {
      const code = extractCleanCertQuery(initialCertVerifyCode);
      setActiveSection('certificates');
      setCertSearchQuery(code);
      handleVerifyCertificateQuery(undefined, code);
      if (onClearInitialCertVerifyCode) {
        onClearInitialCertVerifyCode();
      }
    }
  }, [initialCertVerifyCode]);

  const handleToggleCertificateStatus = async (
    cert: TrainingCertificateRecord,
    nextStatus: CertificateVerificationStatus
  ) => {
    const updatedList = await updateCertificateStatusByMaster(cert, nextStatus);
    setCertificates(updatedList);
    const refreshed =
      updatedList.find((c) => c.id === cert.id || c.serialCode === cert.serialCode) || null;
    if (verifiedLookupResult && verifiedLookupResult.serialCode === cert.serialCode) {
      setVerifiedLookupResult(refreshed);
    }
    setCertStatusMessage(
      nextStatus === 'verified'
        ? `Certificate ${cert.serialCode} (${cert.staffName}) marked as VERIFIED & AUTHENTIC in Master Hub.`
        : `Certificate ${cert.serialCode} (${cert.staffName}) marked as REVOKED in Master Hub.`
    );
    setTimeout(() => setCertStatusMessage(null), 4000);
  };

  const handleMasterIssueSingleCertForAccount = async (acc: PortalUser) => {
    const issued = await issueOrUpdateTrainingCertificate({
      staffName: acc.displayName,
      staffEmail: acc.email,
      staffPosition: acc.position,
      staffBranch: acc.branch,
      quizTitle: 'Food Safety, SOP & Operational Compliance Competency Assessment',
      score: 10,
      totalQuestions: 10,
      status: 'verified',
    });
    const refreshed = await fetchAllIssuedCertificates();
    setCertificates(refreshed);
    setActiveSection('certificates');
    setCertSearchQuery(issued.serialCode);
    setCertLookupAttempted(true);
    setVerifiedLookupResult(issued);
    setCertStatusMessage(
      `Issued & verified single official certificate (${issued.serialCode}) for ${acc.displayName}.`
    );
    setTimeout(() => setCertStatusMessage(null), 4000);
  };

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

  const handleStartEditProfile = (acc: PortalUser) => {
    setEditingAccountUid(acc.uid);
    setEditDisplayName(acc.displayName || '');
    setEditPosition(acc.position || '');
    setEditBranch(acc.branch || '');
    setSavedProfileMessage(null);
  };

  const handleCancelEditProfile = () => {
    setEditingAccountUid(null);
    setEditDisplayName('');
    setEditPosition('');
    setEditBranch('');
  };

  const handleSaveEditedProfile = async (acc: PortalUser) => {
    if (!editDisplayName.trim() || !editPosition.trim()) return;
    setSavingProfileUid(acc.uid);
    try {
      const updatedList = await updateStaffProfileByMaster(acc, {
        displayName: editDisplayName.trim(),
        position: editPosition.trim(),
        branch: editBranch.trim() || acc.branch,
      });
      setAccounts(updatedList);
      const matchedUpdated = updatedList.find(
        (u) => u.uid === acc.uid || u.email.toLowerCase() === acc.email.toLowerCase()
      );
      if (matchedUpdated && onAccountProfileUpdated) {
        onAccountProfileUpdated(matchedUpdated);
      }
      setEditingAccountUid(null);
      setSavedProfileMessage(
        `Updated certificate identity for ${editDisplayName.trim()} (${editPosition.trim()})`
      );
      setTimeout(() => setSavedProfileMessage(null), 4000);
    } finally {
      setSavingProfileUid(null);
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
        preserveCurrentSession: true,
      });
      const updated = await updateAccountApprovalStatus(created, 'approved', newStaffRole);
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
              Master Account Approval, Certificate Verification &amp; AI/Game Studio
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Verify staff training certificates by Serial Code or Name, approve staff account registrations, edit locked certificate identities, and upload SOPs, Policies, Guides, and Station Checklists.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Pending Accounts</span>
              <span className="text-base font-mono font-black text-amber-400 tabular-nums">
                {pendingAccountsCount}
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Verified Certs</span>
              <span className="text-base font-mono font-black text-emerald-400 tabular-nums">
                {verifiedCertificatesCount}
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Uploaded Docs</span>
              <span className="text-base font-mono font-black text-white tabular-nums">
                {customDocs.length}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Switcher inside Master Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSection('certificates')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'certificates'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>1. Verify Certificates ({certificates.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('approvals')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>2. Staff Approvals ({pendingAccountsCount} Pending)</span>
          </button>

          <button
            onClick={() => setActiveSection('uploader')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'uploader'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>3. Upload SOPs &amp; Checklists</span>
          </button>

          <button
            onClick={() => setActiveSection('credentials')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'credentials'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>4. Master Credentials</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECTION 0: MASTER HUB CERTIFICATE VERIFICATION & SINGLE-CERT REGISTRY
         ===================================================================== */}
      {activeSection === 'certificates' && (
        <div className="space-y-4">
          {/* Certificate Serial / Staff Name Instant Verification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Master Hub Official Certificate Verification Tool</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter any Certificate Serial Code (e.g. <code className="text-amber-300">IKG-LD-2026-...</code>), Employee Name, or Email to verify authenticity. Strictly one official certificate is maintained per staff member.
                </p>
              </div>

              <button
                type="button"
                onClick={loadCertificates}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCertificates ? 'animate-spin' : ''}`} />
                <span>Refresh Registry</span>
              </button>
            </div>

            {certStatusMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs font-bold text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{certStatusMessage}</span>
              </div>
            )}

            {/* Search & Verify Input Form */}
            <form
              onSubmit={(e) => handleVerifyCertificateQuery(e)}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={certSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCertSearchQuery(val);
                    if (!val.trim()) {
                      setCertLookupAttempted(false);
                      setVerifiedLookupResult(null);
                      return;
                    }
                    const cleaned = extractCleanCertQuery(val);
                    const liveMatch = findMatchingCertificateInList(
                      cleaned,
                      certificates,
                      accounts
                    );
                    if (liveMatch && cleaned.length >= 3) {
                      setVerifiedLookupResult(liveMatch);
                      setCertLookupAttempted(true);
                      if (/^IKG-LD-/i.test(cleaned)) {
                        handleVerifyCertificateQuery(undefined, cleaned);
                      }
                    } else if (/^IKG-LD-\d{4}-[A-Z0-9]{6,}/i.test(cleaned)) {
                      handleVerifyCertificateQuery(undefined, cleaned);
                    } else {
                      setCertLookupAttempted(false);
                      setVerifiedLookupResult(null);
                    }
                  }}
                  placeholder="Enter Certificate Serial (e.g. IKG-LD-2026-...), Staff Name, or Email..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-9 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                />
                {certSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCertSearchQuery('');
                      setCertLookupAttempted(false);
                      setVerifiedLookupResult(null);
                    }}
                    className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingCert}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-60 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerifyingCert ? 'Verifying Code...' : 'Verify Certificate'}</span>
              </button>
            </form>

            {/* Quick-Verify Serial Chips */}
            {certificates.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-400 font-semibold">Quick Verify Issued Serials:</span>
                {certificates.slice(0, 5).map((c) => (
                  <button
                    key={`quick-${c.id}`}
                    type="button"
                    onClick={() => {
                      setCertSearchQuery(c.serialCode);
                      handleVerifyCertificateQuery(undefined, c.serialCode);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-amber-300 font-mono font-bold text-[10px] cursor-pointer"
                  >
                    {c.serialCode} ({c.staffName})
                  </button>
                ))}
              </div>
            )}

            {/* Instant Verification Lookup Result Card */}
            {certLookupAttempted && (
              <div className="pt-1">
                {verifiedLookupResult ? (
                  <div
                    className={`p-4 rounded-2xl border-2 space-y-3 ${
                      verifiedLookupResult.status === 'verified'
                        ? 'bg-emerald-950/30 border-emerald-500/70'
                        : 'bg-red-950/30 border-red-500/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            verifiedLookupResult.status === 'verified'
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-red-500/20 border-red-400 text-red-300'
                          }`}
                        >
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase ${
                                verifiedLookupResult.status === 'verified'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-red-600 text-white'
                              }`}
                            >
                              {verifiedLookupResult.status === 'verified'
                                ? '✓ AUTHENTIC & VERIFIED BY MASTER HUB'
                                : '✕ CERTIFICATE REVOKED'}
                            </span>
                            <span className="font-mono text-xs font-black text-amber-300">
                              Serial: {verifiedLookupResult.serialCode}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                            {verifiedLookupResult.staffName} — {verifiedLookupResult.staffPosition}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(verifiedLookupResult)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Single Certificate</span>
                        </button>
                        {verifiedLookupResult.status === 'verified' ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCertificateStatus(verifiedLookupResult, 'revoked')
                            }
                            className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-bold cursor-pointer"
                          >
                            Revoke Certificate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCertificateStatus(verifiedLookupResult, 'verified')
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
                          >
                            Re-Verify Certificate
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Staff Email / ID</span>
                        <span className="font-mono font-bold text-slate-200 truncate block">
                          {verifiedLookupResult.staffEmail}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Branch Location</span>
                        <span className="font-semibold text-slate-200 truncate block">
                          {verifiedLookupResult.staffBranch}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Verified Score</span>
                        <span className="font-bold text-emerald-400">
                          {verifiedLookupResult.score}/{verifiedLookupResult.totalQuestions} (
                          {verifiedLookupResult.percentage}%) • Passed
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Date Issued</span>
                        <span className="font-mono text-slate-200">
                          {new Date(verifiedLookupResult.issuedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-950/40 border border-red-700/60 flex items-center justify-between gap-3 text-xs text-red-200">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">
                          No Matching Certificate Found for &ldquo;{certSearchQuery}&rdquo;
                        </span>
                        <span>
                          Verify that the Certificate Serial Code (e.g. IKG-LD-2026-...) or Staff Name is entered accurately.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Master Hub Registry Table of All Issued Single Certificates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>
                    Official Issued Certificates Registry ({certificates.length} Staff Certified — 1 Certificate Per Staff)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Every staff member is strictly limited to one (1) official verifiable certificate locked to their approved Sign-In Name &amp; Position.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {verifiedCertificatesCount} Verified · {certificates.length - verifiedCertificatesCount} Revoked
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-3">Verification Serial</th>
                    <th className="py-2.5 px-3">Staff Name &amp; Email</th>
                    <th className="py-2.5 px-3">Locked Position &amp; Branch</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Date Issued</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Master Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-amber-300">
                            {cert.serialCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(cert.serialCode, `cert-${cert.id}`)}
                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                            title="Copy Serial Code"
                          >
                            {copiedKey === `cert-${cert.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {cert.staffName}
                        <span className="block text-[10px] font-mono font-normal text-slate-400">
                          {cert.staffEmail}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="font-semibold text-amber-300">{cert.staffPosition}</span>
                        <span className="block text-[10px] text-slate-400">{cert.staffBranch}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-emerald-400">
                        {cert.score}/{cert.totalQuestions} ({cert.percentage}%)
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {cert.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-700/60 font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <span>REVOKED</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setCertSearchQuery(cert.serialCode);
                              handleVerifyCertificateQuery(undefined, cert.serialCode);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verify</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Cert</span>
                          </button>

                          {cert.status === 'verified' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleCertificateStatus(cert, 'revoked')}
                              className="px-2 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-800/50 text-[10px] font-semibold cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleCertificateStatus(cert, 'verified')}
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black cursor-pointer"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                Create Pre-Approved Staff or Master Account (Master Direct Provisioning)
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
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
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as 'staff' | 'master')}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300"
                >
                  <option value="staff">Role: Staff Account</option>
                  <option value="master">Role: Master Account (Full Master Hub)</option>
                </select>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Save &amp; Approve Account
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

          {savedProfileMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs font-bold text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{savedProfileMessage}</span>
            </div>
          )}

          {/* Accounts List with Confidentiality Agreement Status & Master Name/Position Editor */}
          <div className="space-y-2.5">
            {filteredAccounts.map((acc) => {
              const isMaster = acc.role === 'master';
              const ndaAccepted = acc.ndaAccepted !== false;
              const ndaSig = acc.ndaSignature || 'I AGREE';
              const isEditingThis = editingAccountUid === acc.uid;
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
                  className={`p-3.5 rounded-2xl border space-y-3 ${
                    acc.status === 'pending'
                      ? 'bg-amber-950/20 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        <span className="text-amber-300 font-semibold">{acc.position}</span>
                        <span>·</span>
                        <span>{acc.branch}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          isEditingThis ? handleCancelEditProfile() : handleStartEditProfile(acc)
                        }
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border transition-colors ${
                          isEditingThis
                            ? 'bg-slate-800 text-slate-200 border-slate-600'
                            : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                        }`}
                        title="Master Account Only: Edit Employee Name, Position & Branch for Certificates"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isEditingThis ? 'Cancel Edit' : 'Edit Name & Position'}</span>
                      </button>

                      {acc.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleMasterIssueSingleCertForAccount(acc)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          title="Issue or Verify Single Official Certificate for this Staff Member"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verify / Issue Cert</span>
                        </button>
                      )}

                      {!isMaster && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline Master Account Profile Editor (Name, Position, Branch for Certificates) */}
                  {isEditingThis && (
                    <div className="p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/50 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            Master Override: Edit Certificate Name, Position &amp; Branch for {acc.email}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Changes sync to all Training Certificates immediately
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                            Employee Full Name (Certificate Name)
                          </label>
                          <input
                            type="text"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            placeholder="Employee Full Name"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                            Official Position / Designation
                          </label>
                          <input
                            type="text"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            placeholder="e.g. FOH Receptionist / Kitchen Shift Lead"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                            Branch / Store Location
                          </label>
                          <input
                            type="text"
                            value={editBranch}
                            onChange={(e) => setEditBranch(e.target.value)}
                            placeholder="e.g. Jiangnan Hotpot - SM Mall of Asia"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEditProfile}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedProfile(acc)}
                          disabled={savingProfileUid === acc.uid}
                          className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>
                            {savingProfileUid === acc.uid
                              ? 'Saving Profile...'
                              : 'Save Certificate Name & Position'}
                          </span>
                        </button>
                      </div>
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
                Verification Method: Manual Typing of &quot;I AGREE&quot; · Name &amp; Position Editable by Master
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-3">Staff Name (Certificate)</th>
                    <th className="py-2.5 px-3">Confidentiality Agreement Status</th>
                    <th className="py-2.5 px-3">Typed Confirmation</th>
                    <th className="py-2.5 px-3">Position &amp; Branch</th>
                    <th className="py-2.5 px-3">Date Accepted</th>
                    <th className="py-2.5 px-3">Master Action</th>
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
                          <span className="font-semibold text-amber-300">{acc.position}</span> ·{' '}
                          <span className="text-slate-400">{acc.branch}</span>
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
                          <div className="flex items-center gap-1.5">
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
                            <button
                              type="button"
                              onClick={() => handleStartEditProfile(acc)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              <span>Edit Name/Pos</span>
                            </button>
                          </div>
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

          {/* GitHub Pages & Firebase Authorized Domains Setup Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>GitHub Pages &amp; Firebase Authorized Domains Setup</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                Firebase Project ID: commanding-gearbox-5w2pc
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Portal Email/Password Sign-In, Staff Account Creation (&quot;I AGREE&quot;), and Google Email Cloud Sign-In work automatically on GitHub Pages via Firestore without domain popup restrictions. To also enable the 1-click Google OAuth Popup on GitHub Pages (<code className="text-amber-300">johndavedeleon005.github.io</code>), add your GitHub Pages domain to Firebase Authorized Domains:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    typeof window !== 'undefined' && window.location.hostname.includes('github.io')
                      ? window.location.hostname
                      : 'johndavedeleon005.github.io',
                    'gh-domain'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'gh-domain' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Domain: johndavedeleon005.github.io</span>
              </button>
              <a
                href="https://console.firebase.google.com/project/commanding-gearbox-5w2pc/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
              >
                <span>Open Firebase Auth Authorized Domains</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Single Certificate Preview Modal when inspecting from Master Hub */}
      {previewCert && (
        <TrainingCertificateModal
          isOpen={!!previewCert}
          onClose={() => setPreviewCert(null)}
          staffName={previewCert.staffName}
          staffEmail={previewCert.staffEmail}
          staffPosition={previewCert.staffPosition}
          staffBranch={previewCert.staffBranch}
          quizTitle={previewCert.quizTitle}
          score={previewCert.score}
          totalQuestions={previewCert.totalQuestions}
          completedAt={previewCert.issuedAt}
          serialCode={previewCert.serialCode}
          verificationStatus={previewCert.status}
          readOnlyPreview={true}
        />
      )}
    </div>
  );
};

