import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FoodSafetyDoc, DocumentType, DepartmentCategory, PortalUser } from './types/foodSafety';
import { INITIAL_FOOD_SAFETY_DOCUMENTS } from './data/foodSafetyDocuments';
import { AndroidHeader } from './components/AndroidHeader';
import { AndroidBottomNav, TabType } from './components/AndroidBottomNav';
import { DocumentCard } from './components/DocumentCard';
import { DocumentViewer } from './components/DocumentViewer';
import { QuickReferenceView } from './components/QuickReferenceView';
import { AudioReaderPanel } from './components/AudioReaderPanel';
import { StaffQuizAudit } from './components/StaffQuizAudit';
import { ComplianceAssistantModal } from './components/ComplianceAssistantModal';
import { ComplianceAssistantView } from './components/ComplianceAssistantView';
import { PdfViewerModal } from './components/PdfViewerModal';
import { ConfidentialityPopup } from './components/ConfidentialityPopup';
import { StoreDocumentLockModal } from './components/StoreDocumentLockModal';
import { WelcomeTrainingHubModal } from './components/WelcomeTrainingHubModal';
import { SpotTheHazardGame } from './components/SpotTheHazardGame';
import { ReceptionistChecklistGame } from './components/ReceptionistChecklistGame';
import { AuthGateModal } from './components/AuthGateModal';
import { MasterAdminHubView } from './components/MasterAdminHubView';
import {
  getSavedSessionUser,
  signOutPortalUser,
  fetchServerCustomDocuments,
  fetchAllPortalAccounts,
  subscribeToPortalAccounts,
  updateAccountApprovalStatus,
  checkCurrentAccountStatus,
  saveDocumentsToLocalStorage,
} from './services/authAndUploadService';
import {
  Search,
  Bookmark,
  CheckCircle2,
  Filter,
  FileText,
  ShieldCheck,
  Flame,
  Layers,
  Sparkles,
  BookOpen,
  Headphones,
  SlidersHorizontal,
  X,
  Gamepad2,
  ClipboardCheck,
  Crown,
  Upload,
  UserCheck,
  UserX,
  Lock,
  LogOut,
} from 'lucide-react';

export default function App() {
  // Authentication & Approval State
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => getSavedSessionUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [pendingAccountsList, setPendingAccountsList] = useState<PortalUser[]>([]);

  // Documents state (persisted with any custom added docs)
  const [documents, setDocuments] = useState<FoodSafetyDoc[]>(() => {
    try {
      const savedCustom = localStorage.getItem('ikqa_custom_docs_v3');
      if (savedCustom) {
        const parsedCustom: FoodSafetyDoc[] = JSON.parse(savedCustom);
        const existingIds = new Set(INITIAL_FOOD_SAFETY_DOCUMENTS.map((d) => d.id));
        const uniqueCustom = parsedCustom.filter((d) => !existingIds.has(d.id));
        return [...INITIAL_FOOD_SAFETY_DOCUMENTS, ...uniqueCustom];
      }
      const saved = localStorage.getItem('ikqa_documents_v2') || localStorage.getItem('ikqa_documents_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const customDocs = parsed.filter((d: FoodSafetyDoc) => d.isCustom);
        return [...INITIAL_FOOD_SAFETY_DOCUMENTS, ...customDocs];
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FOOD_SAFETY_DOCUMENTS;
  });

  // Selected document for full view
  const [selectedDoc, setSelectedDoc] = useState<FoodSafetyDoc | null>(null);

  // Bottom navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [activeGameMode, setActiveGameMode] = useState<'hazard' | 'receptionist'>('receptionist');
  const [focusedGameDoc, setFocusedGameDoc] = useState<FoodSafetyDoc | null>(null);
  const [aiFocusDoc, setAiFocusDoc] = useState<FoodSafetyDoc | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | DocumentType>('all');
  const [selectedCategory, setSelectedCategory] = useState<DepartmentCategory>('All');
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ikqa_bookmarks');
      return saved ? JSON.parse(saved) : ['ikqap-003', 'ikqap-015', 'ikqa-sop-010'];
    } catch {
      return ['ikqap-003', 'ikqap-015'];
    }
  });

  // Read Acknowledgments
  const [readDocIds, setReadDocIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ikqa_read_docs');
      return saved ? JSON.parse(saved) : ['ikqap-001', 'ikqap-003'];
    } catch {
      return ['ikqap-001'];
    }
  });

  // Staff Info: Name, Position & Branch (auto-synced when user signs in)
  const [staffName, setStaffName] = useState(() => {
    try {
      return localStorage.getItem('ikqa_staff_name') || 'Maria Santos';
    } catch {
      return 'Maria Santos';
    }
  });
  const [staffPosition, setStaffPosition] = useState(() => {
    try {
      return localStorage.getItem('ikqa_staff_position') || 'Kitchen Shift Lead';
    } catch {
      return 'Kitchen Shift Lead';
    }
  });
  const [staffBranch, setStaffBranch] = useState(() => {
    try {
      return localStorage.getItem('ikqa_staff_branch') || 'Jiangnan Hotpot - SM Mall of Asia';
    } catch {
      return 'Jiangnan Hotpot - SM Mall of Asia';
    }
  });

  // Frame Simulation State (phone frame vs desktop)
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Modals state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [pdfModalDoc, setPdfModalDoc] = useState<FoodSafetyDoc | null>(null);

  // Mandatory Confidentiality & Non-Disclosure Agreement Gatekeeper
  const [hasAgreedNDA, setHasAgreedNDA] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ld_training_hub_nda_accepted') === 'true';
    } catch {
      return false;
    }
  });

  // Welcome to Learning and Development Training Hub Pop-up from the start
  // Must remain open until the user accepts the Confidentiality & Non-Disclosure Agreement
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(() => {
    try {
      const agreed = localStorage.getItem('ld_training_hub_nda_accepted') === 'true';
      return !agreed;
    } catch {
      return true;
    }
  });

  // Confidentiality Agreement State (Required popup on every page viewed)
  const [pendingDocToView, setPendingDocToView] = useState<FoodSafetyDoc | null>(null);
  const [isConfidentialityOpen, setIsConfidentialityOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'viewDoc' | 'viewPdf'>('viewDoc');
  const [storeLockDoc, setStoreLockDoc] = useState<FoodSafetyDoc | null>(null);

  // Load custom uploaded documents from Firestore / Express on mount
  const loadPortalCustomDocs = useCallback(async () => {
    try {
      const customDocs = await fetchServerCustomDocuments();
      if (customDocs.length > 0) {
        setDocuments((prev) => {
          const existingMap = new Map<string, FoodSafetyDoc>();
          for (const d of prev) existingMap.set(d.id, d);
          for (const cd of customDocs) existingMap.set(cd.id, cd);
          const merged = Array.from(existingMap.values());
          saveDocumentsToLocalStorage(merged);
          return merged;
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadPendingApprovals = useCallback(async () => {
    if (currentUser?.role !== 'master') {
      setPendingApprovalsCount(0);
      setPendingAccountsList([]);
      return;
    }
    try {
      const accounts = await fetchAllPortalAccounts();
      const pending = accounts.filter((a) => a.role !== 'master' && a.status === 'pending');
      setPendingApprovalsCount(pending.length);
      setPendingAccountsList(pending);
    } catch {
      // ignore
    }
  }, [currentUser?.role]);

  const isApprovedUser =
    !!currentUser && (currentUser.role === 'master' || currentUser.status === 'approved');

  useEffect(() => {
    if (isApprovedUser) {
      loadPortalCustomDocs();
    }
  }, [isApprovedUser, loadPortalCustomDocs]);

  useEffect(() => {
    if (!currentUser) {
      setPendingApprovalsCount(0);
      setPendingAccountsList([]);
      return;
    }
    const unsub = subscribeToPortalAccounts((accounts) => {
      if (currentUser.role === 'master') {
        const pending = accounts.filter((a) => a.role !== 'master' && a.status === 'pending');
        setPendingApprovalsCount(pending.length);
        setPendingAccountsList(pending);
      } else {
        setPendingApprovalsCount(0);
        setPendingAccountsList([]);
      }

      // If the Master Account updated this user's Name, Position, Branch, or Status in the Hub, sync it immediately
      const matchedSelf = accounts.find(
        (a) =>
          a.uid === currentUser.uid ||
          a.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (
        matchedSelf &&
        (matchedSelf.displayName !== currentUser.displayName ||
          matchedSelf.position !== currentUser.position ||
          matchedSelf.branch !== currentUser.branch ||
          matchedSelf.status !== currentUser.status ||
          matchedSelf.role !== currentUser.role)
      ) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                displayName: matchedSelf.displayName,
                position: matchedSelf.position,
                branch: matchedSelf.branch,
                status: matchedSelf.status,
                role: matchedSelf.role,
              }
            : prev
        );
      }
    });
    return () => unsub();
  }, [
    currentUser?.uid,
    currentUser?.email,
    currentUser?.role,
    currentUser?.displayName,
    currentUser?.position,
    currentUser?.branch,
    currentUser?.status,
  ]);

  // Verify user approval & profile status on mount
  useEffect(() => {
    if (currentUser) {
      checkCurrentAccountStatus(currentUser).then((updated) => {
        if (
          updated &&
          (updated.status !== currentUser.status ||
            updated.displayName !== currentUser.displayName ||
            updated.position !== currentUser.position ||
            updated.branch !== currentUser.branch)
        ) {
          setCurrentUser(updated);
        }
      });
    }
  }, [currentUser?.uid]);

  // Strictly lock staffName, staffPosition & staffBranch to the signed-in account's recorded details
  useEffect(() => {
    if (currentUser) {
      setStaffName(currentUser.displayName || 'Staff Member');
      setStaffPosition(currentUser.position || 'Restaurant Staff');
      setStaffBranch(currentUser.branch || 'Jiangnan Hotpot - SM Mall of Asia');
    }
  }, [currentUser?.displayName, currentUser?.position, currentUser?.branch]);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('ikqa_bookmarks', JSON.stringify(bookmarkedIds));
    } catch {
      // Ignore storage errors in private/restricted browsers
    }
  }, [bookmarkedIds]);

  // Persist read documents
  useEffect(() => {
    try {
      localStorage.setItem('ikqa_read_docs', JSON.stringify(readDocIds));
    } catch {
      // Ignore storage errors in private/restricted browsers
    }
  }, [readDocIds]);

  // Persist staff profile
  useEffect(() => {
    try {
      localStorage.setItem('ikqa_staff_name', staffName);
      localStorage.setItem('ikqa_staff_position', staffPosition);
      localStorage.setItem('ikqa_staff_branch', staffBranch);
    } catch {
      // Ignore storage errors in private/restricted browsers
    }
  }, [staffName, staffPosition, staffBranch]);

  // Handlers
  const handleAuthenticated = (user: PortalUser) => {
    setCurrentUser(user);
    setStaffName(user.displayName);
    setStaffPosition(user.position);
    setStaffBranch(user.branch);
    setIsAuthModalOpen(false);
    loadPortalCustomDocs();
  };

  const handleSignOut = async () => {
    await signOutPortalUser();
    setCurrentUser(null);
    setActiveTab('library');
    setSelectedDoc(null);
  };

  const handleDocumentUploaded = (newDoc: FoodSafetyDoc) => {
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.id !== newDoc.id);
      const updated = [...filtered, newDoc];
      saveDocumentsToLocalStorage(updated);
      return updated;
    });
  };

  const handleDocumentDeleted = (docId: string) => {
    setDocuments((prev) => {
      const updated = prev.filter((d) => d.id !== docId);
      saveDocumentsToLocalStorage(updated);
      return updated;
    });
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
    }
  };

  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleRead = (id: string) => {
    setReadDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAgreeNDA = () => {
    try {
      localStorage.setItem('ld_training_hub_nda_accepted', 'true');
      localStorage.setItem('ld_training_hub_nda_timestamp', new Date().toISOString());
    } catch (e) {
      console.error(e);
    }
    setHasAgreedNDA(true);
    setIsWelcomeOpen(false);
  };

  const handleQuickTTS = (doc: FoodSafetyDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDoc(doc);
    setActiveTab('audio');
  };

  // Confidentiality Gatekeeper: Required popup on every page / document viewed
  const handleInitiateViewDoc = (doc: FoodSafetyDoc) => {
    setPendingDocToView(doc);
    setPendingAction('viewDoc');
    setIsConfidentialityOpen(true);
  };

  const handleInitiateViewPdf = (doc: FoodSafetyDoc, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStoreLockDoc(doc);
  };

  const handleAgreeConfidentiality = () => {
    if (pendingDocToView) {
      if (pendingAction === 'viewDoc') {
        setSelectedDoc(pendingDocToView);
      } else {
        setPdfModalDoc(pendingDocToView);
      }
    }
    setIsConfidentialityOpen(false);
    setPendingDocToView(null);
  };

  const handleCancelConfidentiality = () => {
    setIsConfidentialityOpen(false);
    setPendingDocToView(null);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedType !== 'all' && doc.type !== selectedType) return false;
      if (selectedCategory !== 'All' && doc.category !== selectedCategory) return false;
      if (showOnlyBookmarks && !bookmarkedIds.includes(doc.id)) return false;
      if (showOnlyUnread && readDocIds.includes(doc.id)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inCode = doc.code.toLowerCase().includes(query);
        const inTitle = doc.title.toLowerCase().includes(query);
        const inSummary = doc.summary.toLowerCase().includes(query);
        const inTakeaways = doc.keyTakeaways.some((t) => t.toLowerCase().includes(query));
        const inTags = doc.tags.some((tag) => tag.toLowerCase().includes(query));
        return inCode || inTitle || inSummary || inTakeaways || inTags;
      }

      return true;
    });
  }, [
    documents,
    selectedType,
    selectedCategory,
    showOnlyBookmarks,
    showOnlyUnread,
    searchQuery,
    bookmarkedIds,
    readDocIds,
  ]);

  // Document Counts
  const policiesCount = documents.filter((d) => d.type === 'policy').length;
  const sopsCount = documents.filter((d) => d.type === 'sop').length;
  const guidesCount = documents.filter((d) => d.type === 'guide').length;
  const checklistsCount = documents.filter((d) => d.type === 'checklist').length;
  const customUploadedCount = documents.filter((d) => d.isCustom).length;

  // STRICT PRIVATE HUB GATEKEEPER:
  // Zero hub content, headers, documents, or modals are rendered unless the user is signed in AND approved (or Master Account)
  if (!isApprovedUser) {
    return (
      <AuthGateModal
        currentUser={currentUser}
        onAuthenticated={handleAuthenticated}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-red-500 selection:text-white">
      {/* App Container - Responsive or simulated Android frame */}
      <div
        className={`w-full transition-all duration-300 flex flex-col min-h-screen ${
          isPhoneFrame
            ? 'max-w-md my-4 rounded-[40px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-slate-700/60'
            : 'max-w-4xl'
        }`}
      >
        {/* Header */}
        <AndroidHeader
          onSearchClick={() => {
            if (activeTab !== 'library') setActiveTab('library');
            const searchInput = document.getElementById('main-search-input');
            searchInput?.focus();
          }}
          bookmarksCount={bookmarkedIds.length}
          onBookmarksClick={() => {
            setActiveTab('library');
            setShowOnlyBookmarks((prev) => !prev);
          }}
          isPhoneFrame={isPhoneFrame}
          togglePhoneFrame={() => setIsPhoneFrame((prev) => !prev)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onOpenWelcomeModal={() => setIsWelcomeOpen(true)}
          documents={documents}
          activeDoc={selectedDoc}
          onSelectDoc={(d) => handleInitiateViewDoc(d)}
          currentUser={currentUser}
          onOpenMasterHub={() => {
            setSelectedDoc(null);
            setActiveTab('master');
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto">
          {/* If a document is selected, render DocumentViewer */}
          {selectedDoc ? (
            <DocumentViewer
              doc={selectedDoc}
              onBack={() => setSelectedDoc(null)}
              isBookmarked={bookmarkedIds.includes(selectedDoc.id)}
              onToggleBookmark={handleToggleBookmark}
              isRead={readDocIds.includes(selectedDoc.id)}
              onToggleRead={handleToggleRead}
              staffName={staffName}
              staffPosition={staffPosition}
              staffBranch={staffBranch}
              onOpenPdfModal={(d) => handleInitiateViewPdf(d)}
              allDocuments={documents}
              onSelectDoc={(d) => handleInitiateViewDoc(d)}
            />
          ) : (
            <div className="p-4 space-y-4">
              {/* SIGNED-IN ACCOUNT & LOCKED CERTIFICATE IDENTITY BAR (WITH LOG IN / SWITCH ACCOUNT & LOG OUT) */}
              {currentUser && (
                <div className="bg-slate-900/95 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-[10px] font-mono font-bold">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Certificate Identity Locked</span>
                    </span>
                    <div className="text-xs text-slate-200 truncate">
                      <span className="font-bold text-white">{staffName}</span>
                      <span className="text-slate-500 mx-1.5">·</span>
                      <span className="text-amber-300 font-semibold">{staffPosition}</span>
                      <span className="text-slate-500 mx-1.5 hidden md:inline">·</span>
                      <span className="text-slate-400 hidden md:inline">{staffBranch}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {currentUser.role === 'master' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('master')}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>Edit Staff Names/Positions in Hub</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
                        Only Master Account can modify Name &amp; Position
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span>Log In / Switch Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-2.5 py-1 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}

              {/* LIVE INCOMING STAFF ACCOUNT APPROVAL REQUESTS BANNER FOR MASTER ACCOUNT */}
              {currentUser?.role === 'master' &&
                pendingAccountsList.length > 0 &&
                activeTab !== 'master' && (
                  <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/80 border-2 border-amber-500/70 rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
                          <UserCheck className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300 block">
                            LIVE APPROVAL QUEUE · {pendingAccountsList.length} REQUEST
                            {pendingAccountsList.length > 1 ? 'S' : ''} AWAITING MASTER APPROVAL
                          </span>
                          <h3 className="text-sm font-black text-white">
                            Incoming Staff Account Creation Request{pendingAccountsList.length > 1 ? 's' : ''}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('master')}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs cursor-pointer self-start sm:self-center"
                      >
                        View All in Master Hub ({pendingAccountsList.length})
                      </button>
                    </div>

                    <div className="space-y-2">
                      {pendingAccountsList.slice(0, 3).map((reqAcc) => (
                        <div
                          key={reqAcc.uid}
                          className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                {reqAcc.displayName}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-600/60 text-[10px] font-mono font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>
                                  Confidentiality Agreement: Accepted (&quot;{reqAcc.ndaSignature || 'I AGREE'}&quot;)
                                </span>
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-slate-200">{reqAcc.email}</span>
                              <span>·</span>
                              <span>{reqAcc.position}</span>
                              <span>·</span>
                              <span>{reqAcc.branch}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={async () => {
                                const updated = await updateAccountApprovalStatus(reqAcc, 'approved');
                                const rem = updated.filter(
                                  (a) => a.role !== 'master' && a.status === 'pending'
                                );
                                setPendingApprovalsCount(rem.length);
                                setPendingAccountsList(rem);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Account</span>
                            </button>
                            <button
                              onClick={async () => {
                                const updated = await updateAccountApprovalStatus(reqAcc, 'rejected');
                                const rem = updated.filter(
                                  (a) => a.role !== 'master' && a.status === 'pending'
                                );
                                setPendingApprovalsCount(rem.length);
                                setPendingAccountsList(rem);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800/60 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* TAB 1: LIBRARY */}
              {activeTab === 'library' && (
                <div className="space-y-4">
                  {/* Hero compliance banner */}
                  <div className="bg-gradient-to-br from-red-950 via-slate-900 to-amber-950/60 border border-red-800/40 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-black ring-1 ring-red-500/50 shadow-xl flex-shrink-0 mt-0.5">
                          <img
                            src="./assets/aistudio/JN_HOTPOT_LOGO_d76d212e.webp"
                            alt="Jiangnan Hotpot Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-700/60 text-[10px] font-bold">
                              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                              Imperial Kitchen Group Inc.
                            </span>
                            {currentUser?.role === 'master' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[10px] font-black">
                                <Crown className="w-3 h-3 text-amber-400" />
                                MASTER ACCOUNT ACTIVE
                              </span>
                            )}
                          </div>
                          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                            Learning and Development Training Hub
                          </h1>
                          <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                            Official compliance standards for Jiangnan Hotpot restaurants, commissaries, and logistics.
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        {currentUser?.role === 'master' && (
                          <button
                            onClick={() => setActiveTab('master')}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg active:scale-95 transition-all cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload SOPs &amp; Approve Staff</span>
                            {pendingApprovalsCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
                                {pendingApprovalsCount}
                              </span>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setIsWelcomeOpen(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold shadow-lg active:scale-95 transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>L&amp;D Team &amp; NDA</span>
                        </button>
                      </div>
                    </div>

                    {/* Master Account Quick Action Banner when signed in as Master */}
                    {currentUser?.role === 'master' && (
                      <div className="mt-3 pt-3 border-t border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-950/30 p-3 rounded-2xl border border-amber-500/40">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
                            <Crown className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-white">
                                Master Account Control Center ({currentUser.email})
                              </span>
                              {customUploadedCount > 0 && (
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  {customUploadedCount} Custom Uploaded Doc{customUploadedCount > 1 ? 's' : ''} Integrated
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-amber-200/90">
                              Upload SOPs, Policies, Guides &amp; Station Checklists (auto-synced to AI &amp; Games) or approve staff sign-ups.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('master')}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>Open Master Hub</span>
                        </button>
                      </div>
                    )}

                    {/* Quick Metric Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
                      <div className="p-2 rounded-xl bg-slate-950/60 text-center border border-amber-500/40">
                        <span className="text-[10px] uppercase font-bold text-amber-300 block">Station Checklists</span>
                        <span className="text-sm font-black text-amber-400">{checklistsCount} Active</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 text-center border border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Policies</span>
                        <span className="text-sm font-black text-white">{policiesCount} Active</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 text-center border border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">SOPs &amp; Guides</span>
                        <span className="text-sm font-black text-amber-400">{sopsCount + guidesCount} Stored</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/60 text-center border border-slate-800/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Reviewed</span>
                        <span className="text-sm font-black text-emerald-400">
                          {readDocIds.length} / {documents.length}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Training Games Callout Bar (Receptionist Station Checklist + 8-Bit Kitchen Safety) */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center justify-between gap-2.5 bg-slate-950/90 p-3 rounded-2xl border border-amber-500/50">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
                            <ClipboardCheck className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] font-black text-amber-400 uppercase block truncate">
                              NEW · STATION CHECKLIST GAME
                            </span>
                            <p className="text-xs font-bold text-white truncate">
                              Receptionist &amp; Custom Simulators
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setFocusedGameDoc(null);
                            setActiveGameMode('receptionist');
                            setActiveTab('game');
                          }}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-[11px] border-2 border-amber-200 shadow-[0_3px_0_#92400e] active:translate-y-0.5 transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>PLAY FOH SIM</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-red-500/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-400/50 flex items-center justify-center shrink-0">
                            <Gamepad2 className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] font-black text-red-400 uppercase block truncate">
                              8-BIT KITCHEN SAFETY ARCADE
                            </span>
                            <p className="text-xs font-bold text-white truncate">
                              Spot the Hazard: BOH Kitchen
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setFocusedGameDoc(null);
                            setActiveGameMode('hazard');
                            setActiveTab('game');
                          }}
                          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-black text-[11px] border-2 border-red-300 shadow-[0_3px_0_#7f1d1d] active:translate-y-0.5 transition-all flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>PLAY 8-BIT</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Document Type Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    <button
                      onClick={() => setSelectedType('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                        selectedType === 'all'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      All Documents ({documents.length})
                    </button>

                    <button
                      onClick={() => setSelectedType('checklist')}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedType === 'checklist'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-amber-950/50 text-amber-300 hover:bg-amber-900/60 border border-amber-500/40'
                      }`}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Station Checklists ({checklistsCount})</span>
                    </button>

                    <button
                      onClick={() => setSelectedType('policy')}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                        selectedType === 'policy'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      Policies ({policiesCount})
                    </button>

                    <button
                      onClick={() => setSelectedType('sop')}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                        selectedType === 'sop'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      SOPs ({sopsCount})
                    </button>

                    <button
                      onClick={() => setSelectedType('guide')}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                        selectedType === 'guide'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      Guides ({guidesCount})
                    </button>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {[
                      'All',
                      'Station Checklists',
                      'Temperature & Cold Chain',
                      'Sanitation & Pest',
                      'Allergens & Health',
                      'Receiving & Storage',
                      'Operations & Maintenance',
                      'Uniform & Visitor',
                      'Corporate & Quality',
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as DepartmentCategory)}
                        className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-slate-200 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Active Filters Bar */}
                  {(showOnlyBookmarks || showOnlyUnread) && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                      <span className="text-slate-400">Active Filters:</span>
                      {showOnlyBookmarks && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                          <Bookmark className="w-3 h-3 fill-amber-300" /> Bookmarked Only
                          <button onClick={() => setShowOnlyBookmarks(false)}>
                            <X className="w-3 h-3 ml-1" />
                          </button>
                        </span>
                      )}
                      {showOnlyUnread && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
                          Unreviewed Only
                          <button onClick={() => setShowOnlyUnread(false)}>
                            <X className="w-3 h-3 ml-1" />
                          </button>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Document Grid / List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>Showing {filteredDocuments.length} compliance documents</span>
                      <button
                        onClick={() => setShowOnlyUnread((p) => !p)}
                        className={`text-[11px] hover:underline font-semibold ${
                          showOnlyUnread ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {showOnlyUnread ? 'Show All Docs' : 'Filter Unread'}
                      </button>
                    </div>

                    {filteredDocuments.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredDocuments.map((doc) => (
                            <DocumentCard
                              key={doc.id}
                              doc={doc}
                              onSelect={(d) => handleInitiateViewDoc(d)}
                              isBookmarked={bookmarkedIds.includes(doc.id)}
                              onToggleBookmark={handleToggleBookmark}
                              isRead={readDocIds.includes(doc.id)}
                              onQuickTTS={handleQuickTTS}
                              onOpenPdf={handleInitiateViewPdf}
                            />
                          ))}
                        </div>

                        {/* Related Documents in Same Category when searching */}
                        {searchQuery.trim() && (() => {
                          const matchedIds = new Set(filteredDocuments.map((d) => d.id));
                          const matchedCategories = new Set(filteredDocuments.map((d) => d.category));
                          const relatedInCat = documents
                            .filter((d) => !matchedIds.has(d.id) && matchedCategories.has(d.category))
                            .slice(0, 4);
                          if (relatedInCat.length === 0) return null;
                          return (
                            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-200">
                                  Related Documents in Same Category
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Based on your search results
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {relatedInCat.map((rel) => (
                                  <button
                                    key={rel.id}
                                    onClick={() => handleInitiateViewDoc(rel)}
                                    className="text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-red-500/40 transition-all flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono font-bold text-red-300 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">
                                          {rel.code}
                                        </span>
                                        <span className="text-[10px] text-slate-400 truncate">
                                          {rel.category}
                                        </span>
                                      </div>
                                      <p className="text-xs font-bold text-slate-200 truncate mt-1">
                                        {rel.title}
                                      </p>
                                    </div>
                                    <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-6 space-y-3">
                        <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                        <h4 className="text-sm font-bold text-white">No documents matched your search</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Try adjusting your search terms or clearing category filters.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedType('all');
                            setSelectedCategory('All');
                            setShowOnlyBookmarks(false);
                            setShowOnlyUnread(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: QUICK REFERENCE */}
              {activeTab === 'quickref' && <QuickReferenceView />}

              {/* TAB: TRAINING GAMES (STATION CHECKLIST GAME + 8-BIT SPOT THE HAZARD) */}
              {activeTab === 'game' && (
                <div className="space-y-4">
                  {/* Game Hub Switcher Bar */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={() => setActiveGameMode('receptionist')}
                      className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeGameMode === 'receptionist'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>
                        Station Checklist Simulator (Receptionist {customUploadedCount > 0 ? `+ ${customUploadedCount} Master Uploaded` : ''})
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveGameMode('hazard')}
                      className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        activeGameMode === 'hazard'
                          ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/20'
                          : 'bg-slate-950/60 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>
                        Kitchen Safety Game: 8-Bit Spot the Hazard ({customUploadedCount > 0 ? '5 Rooms Active' : 'BOH'})
                      </span>
                    </button>
                  </div>

                  {activeGameMode === 'receptionist' ? (
                    <ReceptionistChecklistGame
                      documents={documents}
                      staffName={staffName}
                      staffPosition={staffPosition}
                      staffBranch={staffBranch}
                      onOpenDoc={(d) => handleInitiateViewDoc(d)}
                      initialFocusDoc={focusedGameDoc}
                    />
                  ) : (
                    <SpotTheHazardGame
                      documents={documents}
                      staffName={staffName}
                      staffPosition={staffPosition}
                      staffBranch={staffBranch}
                      onOpenDoc={(d) => handleInitiateViewDoc(d)}
                      initialFocusDoc={focusedGameDoc}
                    />
                  )}
                </div>
              )}

              {/* TAB 3: AUDIO READER (GEMINI 3.8 FLASH TTS) */}
              {activeTab === 'audio' && (
                <AudioReaderPanel
                  documents={documents}
                  selectedDoc={selectedDoc}
                  onSelectDoc={(d) => setSelectedDoc(d)}
                />
              )}

              {/* TAB 4: AUDIT & QUIZ */}
              {activeTab === 'audit' && (
                <StaffQuizAudit
                  documents={documents}
                  readDocIds={readDocIds}
                  staffName={staffName}
                  staffPosition={staffPosition}
                  staffBranch={staffBranch}
                  onOpenDoc={(d) => handleInitiateViewDoc(d)}
                  onOpenWelcomeModal={() => setIsWelcomeOpen(true)}
                  isMasterAccount={currentUser?.role === 'master'}
                  onOpenMasterHub={() => setActiveTab('master')}
                />
              )}

              {/* TAB 5: AI COMPLIANCE ASSISTANT */}
              {activeTab === 'assistant' && (
                <ComplianceAssistantView
                  activeDoc={aiFocusDoc || selectedDoc}
                  documents={documents}
                  onOpenDoc={(id) => {
                    const found = documents.find((d) => d.id === id);
                    if (found) handleInitiateViewDoc(found);
                  }}
                />
              )}

              {/* TAB 6: MASTER ACCOUNT HUB (UPLOAD SOPs/POLICIES/GUIDES/CHECKLISTS + APPROVE STAFF) */}
              {activeTab === 'master' && currentUser && (
                <MasterAdminHubView
                  currentUser={currentUser}
                  documents={documents}
                  onAddOrUpdateCustomDoc={handleDocumentUploaded}
                  onDeleteCustomDoc={handleDocumentDeleted}
                  onOpenDoc={(d) => handleInitiateViewDoc(d)}
                  onLaunchGameWithDoc={(mode, doc) => {
                    setFocusedGameDoc(doc);
                    setActiveGameMode(mode);
                    setActiveTab('game');
                  }}
                  onLaunchAIWithDoc={(doc) => {
                    setAiFocusDoc(doc);
                    setActiveTab('assistant');
                  }}
                  onAccountsChanged={(pendingCount) => setPendingApprovalsCount(pendingCount)}
                  onAccountProfileUpdated={(updatedAcc) => {
                    if (
                      currentUser &&
                      (updatedAcc.uid === currentUser.uid ||
                        updatedAcc.email.toLowerCase() === currentUser.email.toLowerCase())
                    ) {
                      setCurrentUser((prev) =>
                        prev
                          ? {
                              ...prev,
                              displayName: updatedAcc.displayName,
                              position: updatedAcc.position,
                              branch: updatedAcc.branch,
                            }
                          : prev
                      );
                      setStaffName(updatedAcc.displayName);
                      setStaffPosition(updatedAcc.position);
                      setStaffBranch(updatedAcc.branch);
                    }
                  }}
                />
              )}
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <AndroidBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedDoc(null);
            setActiveTab(tab);
          }}
          totalDocsCount={documents.length}
          isMasterAccount={currentUser?.role === 'master'}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* AI Compliance Assistant Modal */}
        <ComplianceAssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          activeDoc={aiFocusDoc || selectedDoc}
          documents={documents}
          onOpenDoc={(id) => {
            const found = documents.find((d) => d.id === id);
            if (found) handleInitiateViewDoc(found);
          }}
        />

        {/* Source PDF Preview Modal (Maintained for emergency admin fallback) */}
        {pdfModalDoc && (
          <PdfViewerModal
            doc={pdfModalDoc}
            onClose={() => setPdfModalDoc(null)}
          />
        )}

        {/* Store Document Lock Modal: "Actual document viewing is via store documents" */}
        <StoreDocumentLockModal
          isOpen={!!storeLockDoc}
          doc={storeLockDoc}
          onClose={() => setStoreLockDoc(null)}
          onReadDigitalText={() => {
            if (storeLockDoc) {
              handleInitiateViewDoc(storeLockDoc);
            }
            setStoreLockDoc(null);
          }}
        />

        {/* Confidentiality Agreement Gatekeeper Popup on every page viewed */}
        <ConfidentialityPopup
          doc={pendingDocToView}
          isOpen={isConfidentialityOpen}
          onAgree={handleAgreeConfidentiality}
          onCancel={handleCancelConfidentiality}
        />

        {/* Welcome to Learning and Development Training Hub Modal (Agreement required before entering) */}
        <WelcomeTrainingHubModal
          isOpen={isWelcomeOpen || !hasAgreedNDA}
          onClose={() => {
            if (hasAgreedNDA) {
              setIsWelcomeOpen(false);
            }
          }}
          hasAgreedNDA={hasAgreedNDA}
          onAgreeNDA={handleAgreeNDA}
          onSwitchAccount={() => {
            setIsWelcomeOpen(false);
            setIsAuthModalOpen(true);
          }}
          onSignOut={handleSignOut}
        />

        {/* Account Switch / Re-Auth Modal when opened from header */}
        {isAuthModalOpen && (
          <AuthGateModal
            currentUser={currentUser}
            onAuthenticated={handleAuthenticated}
            onSignOut={handleSignOut}
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

