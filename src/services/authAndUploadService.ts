import {
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  PortalUser,
  FoodSafetyDoc,
  DocumentType,
  DepartmentCategory,
  CustomSimulationStep,
  CustomHazardSpot,
} from '../types/foodSafety';

export const MASTER_ACCOUNT_DETAILS = {
  email: 'master@jiangnanhotpot.com',
  username: 'IKQA-MASTER',
  googleOwnerEmail: 'johndavedeleon005@gmail.com',
  password: 'JiangnanMaster2026!',
  displayName: 'John Dave De Leon (Master Admin)',
  position: 'L&D Specialist & FSCO (Master Account)',
  branch: 'Imperial Kitchen Group HQ - L&D Department',
};

const LOCAL_ACCOUNTS_KEY = 'ikqa_portal_accounts_v1';
const LOCAL_SESSION_KEY = 'ikqa_active_session_v1';
const LOCAL_DOCS_KEY = 'ikqa_documents_v2';

const DEFAULT_SEED_ACCOUNTS: (PortalUser & { password?: string })[] = [
  {
    uid: 'master-admin-001',
    email: MASTER_ACCOUNT_DETAILS.email,
    password: MASTER_ACCOUNT_DETAILS.password,
    displayName: MASTER_ACCOUNT_DETAILS.displayName,
    position: MASTER_ACCOUNT_DETAILS.position,
    branch: MASTER_ACCOUNT_DETAILS.branch,
    role: 'master',
    status: 'approved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    authProvider: 'master_credentials',
  },
  {
    uid: 'staff-pending-001',
    email: 'kevin.lim@jiangnanhotpot.com',
    password: 'Staff2026!',
    displayName: 'Kevin Lim',
    position: 'FOH Receptionist',
    branch: 'Jiangnan Hotpot - BGC High Street',
    role: 'staff',
    status: 'pending',
    createdAt: '2026-10-25T08:30:00.000Z',
    updatedAt: '2026-10-25T08:30:00.000Z',
    authProvider: 'staff_credentials',
  },
  {
    uid: 'staff-approved-001',
    email: 'maria.santos@jiangnanhotpot.com',
    password: 'Staff2026!',
    displayName: 'Maria Santos',
    position: 'Kitchen Shift Lead',
    branch: 'Jiangnan Hotpot - SM Mall of Asia',
    role: 'staff',
    status: 'approved',
    createdAt: '2026-10-20T09:00:00.000Z',
    updatedAt: '2026-10-20T09:15:00.000Z',
    authProvider: 'staff_credentials',
  },
];

export function getLocalAccounts(): (PortalUser & { password?: string })[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SEED_ACCOUNTS;
}

export function saveLocalAccounts(accounts: (PortalUser & { password?: string })[]) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

export function getSavedSessionUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSessionUser(user: PortalUser | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export async function signInWithCredentials(
  identifier: string,
  password: string
): Promise<PortalUser> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPw = password.trim();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password: cleanPw }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveSessionUser(data.user);
        return data.user;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 401 && errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (err: any) {
    if (err.message?.includes('Invalid credentials')) {
      throw err;
    }
  }

  // Local fallback check
  if (
    (cleanId === MASTER_ACCOUNT_DETAILS.email.toLowerCase() ||
      cleanId === MASTER_ACCOUNT_DETAILS.username.toLowerCase() ||
      cleanId === MASTER_ACCOUNT_DETAILS.googleOwnerEmail.toLowerCase()) &&
    cleanPw === MASTER_ACCOUNT_DETAILS.password
  ) {
    const masterUser: PortalUser = {
      uid: 'master-admin-001',
      email: MASTER_ACCOUNT_DETAILS.email,
      displayName: MASTER_ACCOUNT_DETAILS.displayName,
      position: MASTER_ACCOUNT_DETAILS.position,
      branch: MASTER_ACCOUNT_DETAILS.branch,
      role: 'master',
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authProvider: 'master_credentials',
    };
    saveSessionUser(masterUser);
    return masterUser;
  }

  const localAccs = getLocalAccounts();
  const matched = localAccs.find(
    (a) => a.email.toLowerCase() === cleanId || a.uid.toLowerCase() === cleanId
  );
  if (!matched || (matched.password && matched.password !== cleanPw)) {
    throw new Error(
      'Invalid credentials. Check your Email/ID and password, or create a new staff account for Master Account approval.'
    );
  }

  const { password: _pw, ...safeUser } = matched;
  saveSessionUser(safeUser);
  return safeUser;
}

export async function registerStaffAccount(params: {
  email: string;
  password: string;
  displayName: string;
  position: string;
  branch: string;
}): Promise<PortalUser> {
  const cleanEmail = params.email.trim().toLowerCase();
  const isMaster =
    cleanEmail === MASTER_ACCOUNT_DETAILS.email.toLowerCase() ||
    cleanEmail === MASTER_ACCOUNT_DETAILS.googleOwnerEmail.toLowerCase();

  const localAccs = getLocalAccounts();
  if (localAccs.some((a) => a.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this Email / Employee ID already exists. Please sign in.');
  }

  const newEntry: PortalUser & { password?: string } = {
    uid: `staff-${Date.now()}`,
    email: cleanEmail,
    password: params.password.trim(),
    displayName: params.displayName.trim().slice(0, 120),
    position: (params.position || 'Kitchen / Service Staff').trim().slice(0, 120),
    branch: (params.branch || 'Jiangnan Hotpot - SM Mall of Asia').trim().slice(0, 160),
    role: isMaster ? 'master' : 'staff',
    status: isMaster ? 'approved' : 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authProvider: 'staff_credentials',
  };

  const updatedLocal = [...localAccs, newEntry];
  saveLocalAccounts(updatedLocal);

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveSessionUser(data.user);
        return data.user;
      }
    }
  } catch {
    // Fallback to local
  }

  const { password: _pw, ...safeUser } = newEntry;
  saveSessionUser(safeUser);
  return safeUser;
}

export async function signInWithGoogleAccount(
  defaultPosition = 'Kitchen / Service Staff',
  defaultBranch = 'Jiangnan Hotpot - SM Mall of Asia'
): Promise<PortalUser> {
  const cred = await signInWithPopup(auth, googleProvider);
  const fbUser = cred.user;
  const email = (fbUser.email || 'staff@jiangnanhotpot.com').toLowerCase();
  const isMaster =
    email === MASTER_ACCOUNT_DETAILS.googleOwnerEmail.toLowerCase() ||
    email === MASTER_ACCOUNT_DETAILS.email.toLowerCase();

  let firestoreProfile: PortalUser | null = null;
  const userDocPath = `users/${fbUser.uid}`;

  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      const d = snap.data();
      firestoreProfile = {
        uid: d.uid,
        email: d.email,
        displayName: d.displayName,
        position: d.position,
        branch: d.branch,
        role: isMaster ? 'master' : d.role,
        status: isMaster ? 'approved' : d.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: 'google',
      };
    } else {
      const newProfilePayload = {
        uid: fbUser.uid.slice(0, 128),
        email: email.slice(0, 254),
        displayName: (fbUser.displayName || email.split('@')[0] || 'Staff Member').slice(0, 120),
        position: (isMaster ? MASTER_ACCOUNT_DETAILS.position : defaultPosition).slice(0, 120),
        branch: (isMaster ? MASTER_ACCOUNT_DETAILS.branch : defaultBranch).slice(0, 160),
        role: isMaster ? 'master' : 'staff',
        status: isMaster ? 'approved' : 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', fbUser.uid), newProfilePayload);
      firestoreProfile = {
        uid: newProfilePayload.uid,
        email: newProfilePayload.email,
        displayName: newProfilePayload.displayName,
        position: newProfilePayload.position,
        branch: newProfilePayload.branch,
        role: newProfilePayload.role as 'master' | 'staff',
        status: newProfilePayload.status as 'pending' | 'approved' | 'rejected',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: 'google',
      };
    }
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    } catch {
      // Continue to sync with server/local store
    }
  }

  // Also sync with backend store so Master Dashboard shows all accounts in one unified table
  try {
    const res = await fetch('/api/auth/google-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: fbUser.uid,
        email,
        displayName: fbUser.displayName || email.split('@')[0],
        position: firestoreProfile?.position || defaultPosition,
        branch: firestoreProfile?.branch || defaultBranch,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        firestoreProfile = {
          ...data.user,
          role: isMaster ? 'master' : firestoreProfile?.role || data.user.role,
          status: isMaster ? 'approved' : firestoreProfile?.status || data.user.status,
        };
      }
    }
  } catch {
    // ignore
  }

  const finalUser: PortalUser = firestoreProfile || {
    uid: fbUser.uid,
    email,
    displayName: fbUser.displayName || email.split('@')[0],
    position: isMaster ? MASTER_ACCOUNT_DETAILS.position : defaultPosition,
    branch: isMaster ? MASTER_ACCOUNT_DETAILS.branch : defaultBranch,
    role: isMaster ? 'master' : 'staff',
    status: isMaster ? 'approved' : 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authProvider: 'google',
  };

  // Sync to local accounts list
  const localAccs = getLocalAccounts();
  const idx = localAccs.findIndex((a) => a.uid === finalUser.uid || a.email === finalUser.email);
  if (idx >= 0) {
    localAccs[idx] = { ...localAccs[idx], ...finalUser };
  } else {
    localAccs.push(finalUser);
  }
  saveLocalAccounts(localAccs);
  saveSessionUser(finalUser);

  return finalUser;
}

export async function signOutPortalUser() {
  saveSessionUser(null);
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch {
    // ignore
  }
}

export async function fetchAllPortalAccounts(): Promise<PortalUser[]> {
  const merged = new Map<string, PortalUser>();

  for (const acc of getLocalAccounts()) {
    const { password: _pw, ...safe } = acc;
    merged.set(safe.email.toLowerCase(), safe);
  }

  try {
    const res = await fetch('/api/auth/accounts');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.accounts)) {
        for (const acc of data.accounts) {
          merged.set(acc.email.toLowerCase(), acc);
        }
      }
    }
  } catch {
    // ignore
  }

  // If signed in with Firebase Auth as admin, also merge Firestore /users
  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && d.email) {
          merged.set(String(d.email).toLowerCase(), {
            uid: d.uid || docSnap.id,
            email: d.email,
            displayName: d.displayName || d.email,
            position: d.position || 'Staff',
            branch: d.branch || 'Jiangnan Hotpot',
            role: d.role || 'staff',
            status: d.status || 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authProvider: 'google',
          });
        }
      });
    } catch {
      // Non-admin Firebase user or offline
    }
  }

  const list = Array.from(merged.values());
  return list;
}

export async function updateAccountApprovalStatus(
  targetUser: PortalUser,
  status: 'pending' | 'approved' | 'rejected',
  role?: 'master' | 'staff'
): Promise<PortalUser[]> {
  const nextRole = role || targetUser.role;

  // 1. Update local store
  const localAccs = getLocalAccounts().map((a) => {
    if (a.uid === targetUser.uid || a.email.toLowerCase() === targetUser.email.toLowerCase()) {
      return {
        ...a,
        status,
        role: nextRole,
        updatedAt: new Date().toISOString(),
      };
    }
    return a;
  });
  saveLocalAccounts(localAccs);

  // 2. Update server store
  try {
    await fetch('/api/auth/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUid: targetUser.uid,
        status,
        role: nextRole,
      }),
    });
  } catch {
    // ignore
  }

  // 3. Update Firestore if authenticated with Firebase
  if (auth.currentUser) {
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const existing = snap.data();
        await updateDoc(userRef, {
          role: nextRole,
          status,
          displayName: existing.displayName,
          position: existing.position,
          branch: existing.branch,
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // ignore if account only exists in credential store
    }
  }

  return fetchAllPortalAccounts();
}

export async function checkCurrentAccountStatus(user: PortalUser): Promise<PortalUser> {
  try {
    const res = await fetch(`/api/auth/status/${encodeURIComponent(user.uid)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveSessionUser(data.user);
        return data.user;
      }
    }
  } catch {
    // ignore
  }

  const localAccs = getLocalAccounts();
  const found = localAccs.find(
    (a) => a.uid === user.uid || a.email.toLowerCase() === user.email.toLowerCase()
  );
  if (found) {
    const { password: _pw, ...safe } = found;
    saveSessionUser(safe);
    return safe;
  }

  return user;
}

// ============================================================================
// CUSTOM DOCUMENT PARSING & UPLOAD SYNC (AI + GAMES INTEGRATION)
// ============================================================================

export function buildLocalStructuredDocument(params: {
  rawText: string;
  docType: DocumentType;
  code?: string;
  title?: string;
  category?: DepartmentCategory;
  existingCustomCount?: number;
}): FoodSafetyDoc {
  const lines = params.rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const docType = params.docType;
  const prefix =
    docType === 'policy'
      ? 'IKQAP'
      : docType === 'checklist'
      ? 'JNLD-CHK'
      : docType === 'guide'
      ? 'IKQA-GDE'
      : 'IKQA-SOP';
  const seq = String((params.existingCustomCount || 0) + 13).padStart(3, '0');
  const code = (params.code?.trim() || `${prefix}#${seq}`).toUpperCase();
  const title =
    params.title?.trim() ||
    lines[0]?.replace(/^[#*\-\s]+/, '').slice(0, 120) ||
    'Master Uploaded Operational Standard';
  const category: DepartmentCategory =
    params.category && params.category !== 'All'
      ? params.category
      : docType === 'checklist'
      ? 'Station Checklists'
      : 'Operations & Maintenance';

  const bulletLines = lines
    .filter((l) => /^(\*|\-|\d+\.|•)/.test(l) || l.length > 20)
    .map((l) => l.replace(/^(\*|\-|\d+\.|•)\s*/, ''))
    .slice(0, 12);

  const keyTakeaways =
    bulletLines.length >= 2
      ? bulletLines.slice(0, 6)
      : [
          `Mandatory compliance with ${code} (${title}) across all Jiangnan Hotpot branches.`,
          `Station leads and supervisors must verify ${code} execution during shift opening and turnover.`,
          `All deviations must be immediately corrected and documented in the store compliance log.`,
        ];

  const quickRules = keyTakeaways.slice(0, 3).map((t, i) => ({
    type: (i === 0 ? 'critical' : i === 1 ? 'warning' : 'info') as 'critical' | 'warning' | 'info',
    title: `${code} Control Point #${i + 1}`,
    rule: t,
  }));

  const sections: FoodSafetyDoc['sections'] = [];
  let currentSecTitle = '1. Standard Operating Steps & Requirements';
  let currentBullets: string[] = [];

  for (const line of lines.slice(0, 45)) {
    if (/^(section|stage|task|step|i\.|ii\.|iii\.|iv\.|v\.|\d+\.)/i.test(line) && line.length < 95) {
      if (currentBullets.length > 0) {
        sections.push({
          id: `sec-${sections.length + 1}`,
          title: currentSecTitle,
          content: currentBullets.join(' '),
          bulletPoints: [...currentBullets],
        });
        currentBullets = [];
      }
      currentSecTitle = line.replace(/^[#*]+\s*/, '');
    } else {
      currentBullets.push(line.replace(/^[\*\-•]\s*/, ''));
    }
  }

  if (currentBullets.length > 0 || sections.length === 0) {
    sections.push({
      id: `sec-${sections.length + 1}`,
      title: currentSecTitle,
      content: currentBullets.join(' ') || params.rawText.slice(0, 600),
      bulletPoints: currentBullets.length > 0 ? currentBullets.slice(0, 6) : keyTakeaways,
    });
  }

  const primaryRule = keyTakeaways[0] || `Execute ${title} (${code}) as specified.`;
  const secondaryRule = keyTakeaways[1] || `Verify and log ${code} compliance every shift.`;

  const quizQuestions = [
    {
      question: `According to ${code} (${title}), what is the mandatory primary requirement?`,
      options: [
        primaryRule,
        'Skip verification during peak hours to speed up service',
        'Perform the procedure only during quarterly audits',
        'Allow unverified estimates without checking the official standard',
      ],
      answerIndex: 0,
      explanation: `Per ${code} (${title}): ${primaryRule}`,
    },
    {
      question: `Under ${code} (${title}), what secondary control rule must staff observe?`,
      options: [
        'Verbally estimate without documenting',
        secondaryRule,
        'Wait until store closing to check compliance',
        'Apply the standard only on weekends',
      ],
      answerIndex: 1,
      explanation: `Per ${code}: ${secondaryRule}`,
    },
  ];

  const customSimulationSteps: CustomSimulationStep[] = sections.slice(0, 4).map((sec, idx) => {
    const rightAction = sec.bulletPoints?.[0] || sec.content.slice(0, 180) || primaryRule;
    return {
      id: `${code.toLowerCase()}-sim-${idx + 1}`,
      stageLabel: `STAGE ${idx + 1} • ${code}`,
      scenarioTitle: sec.title,
      guestAvatar: docType === 'checklist' ? '📋' : '🛡️',
      guestName: `Station Verification #${idx + 1}`,
      guestContext: `Live shift execution for ${code}: ${title}`,
      guestDialogue: `"We are executing ${sec.title}. What is the required standard under ${code}?"`,
      taskPrompt: `Select the compliant script or action required by ${code} (${sec.title}):`,
      options: [
        {
          id: `opt-${idx}-a`,
          scriptOrAction: rightAction,
          isCorrect: true,
          feedback: `Correct! This adheres to ${code} (${sec.title}): ${rightAction}`,
        },
        {
          id: `opt-${idx}-b`,
          scriptOrAction:
            'Bypass this verification step during busy dining hours and proceed without logging.',
          isCorrect: false,
          feedback: `Incorrect. ${code} strictly requires: ${rightAction}`,
        },
        {
          id: `opt-${idx}-c`,
          scriptOrAction:
            'Provide an unverified response from memory without checking the official station standard.',
          isCorrect: false,
          feedback: `Incorrect. Unverified actions violate ${code}.`,
        },
        {
          id: `opt-${idx}-d`,
          scriptOrAction:
            'Defer the task to the closing shift without completing the required endorsement.',
          isCorrect: false,
          feedback: `Incorrect. Immediate compliance is required under ${code}.`,
        },
      ],
      billOutCheck: {
        label: `${code} — Station Endorsement & Log Check:`,
        correctValue: `Verified & Logged: ${sec.title.slice(0, 50)}`,
        choices: [
          `Verified & Logged: ${sec.title.slice(0, 50)}`,
          'Unverified — Verbal Estimate Only',
          'Omitted During Peak Service',
        ],
      },
    };
  });

  const customHazardSpots: CustomHazardSpot[] = [
    {
      id: `${code.toLowerCase()}-haz-1`,
      hazardTitle: `${code} Breach: ${title}`,
      sopViolation: `Audit inspection detected a violation of ${code} (${title}). Staff failed to follow: ${primaryRule}`,
      correctFixIndex: 0,
      fixOptions: [
        `Enforce ${code} immediately: ${primaryRule.slice(0, 120)}`,
        'Ignore the violation until closing shift',
        'Sign off the logbook without correcting the station',
        'Continue operations without supervisor notification',
      ],
    },
  ];

  return {
    id: `custom-${Date.now()}`,
    code,
    title,
    type: docType,
    category,
    revision: 1,
    effectiveDate: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    pdfUrl: '',
    summary:
      lines.slice(0, 3).join(' ').slice(0, 350) ||
      `Official Master-uploaded ${docType.toUpperCase()} covering ${title}.`,
    keyTakeaways,
    quickRules,
    sections,
    signatories: {
      preparedBy: 'John Dave De Leon (Master Account / L&D)',
      reviewedBy: ['Joy Bernardo (L&D Manager)', 'QA & Operations Department'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      {
        rev: 1,
        date: new Date().toISOString().slice(0, 10),
        author: 'Master Account (L&D Hub)',
        purpose: 'Uploaded and automatically integrated into AI Virtual Support & Training Games',
      },
    ],
    quizQuestions,
    customSimulationSteps,
    customHazardSpots,
    tags: [
      code.toLowerCase(),
      docType,
      ...title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 6),
    ],
    isCustom: true,
    uploadedBy: MASTER_ACCOUNT_DETAILS.displayName,
    uploadedAt: new Date().toISOString(),
  };
}

export async function parseDocumentWithAI(params: {
  rawText: string;
  docType: DocumentType;
  code?: string;
  title?: string;
  category?: DepartmentCategory;
  existingCustomCount?: number;
}): Promise<{ document: FoodSafetyDoc; aiStructured: boolean }> {
  try {
    const res = await fetch('/api/documents/ai-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.document) {
        return {
          document: data.document as FoodSafetyDoc,
          aiStructured: !!data.aiStructured,
        };
      }
    }
  } catch {
    // Fallback to local structurer
  }

  return {
    document: buildLocalStructuredDocument(params),
    aiStructured: false,
  };
}

export async function publishCustomDocument(docItem: FoodSafetyDoc): Promise<FoodSafetyDoc> {
  const cleanId = (docItem.id || `custom-${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  const normalized: FoodSafetyDoc = {
    ...docItem,
    id: cleanId,
    isCustom: true,
    uploadedAt: docItem.uploadedAt || new Date().toISOString(),
  };

  // 1. Save to Express backend
  try {
    await fetch('/api/custom-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: normalized }),
    });
  } catch {
    // ignore
  }

  // 2. Save to Firebase Firestore if authenticated with Firebase
  if (auth.currentUser) {
    try {
      const contentBody = (normalized.sections || [])
        .map((s) => `${s.title}: ${s.content} ${(s.bulletPoints || []).join(' ')}`)
        .join('\n')
        .slice(0, 49000);

      await setDoc(doc(db, 'custom_documents', cleanId), {
        id: cleanId,
        code: normalized.code.slice(0, 64),
        title: normalized.title.slice(0, 240),
        type: normalized.type,
        category: normalized.category.slice(0, 120),
        revision: Number(normalized.revision || 1),
        effectiveDate: normalized.effectiveDate.slice(0, 64),
        summary: normalized.summary.slice(0, 4000),
        contentBody: contentBody || normalized.summary,
        keyTakeaways: (normalized.keyTakeaways || []).join(' | ').slice(0, 9500) || normalized.summary,
        visibility: 'approved_staff',
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // ignore if user signed in via credential mode rather than Google Auth
    }
  }

  return normalized;
}

export async function removeCustomDocument(docId: string): Promise<void> {
  try {
    await fetch(`/api/custom-documents/${encodeURIComponent(docId)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }

  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'custom_documents', docId));
    } catch {
      // ignore
    }
  }
}

export async function fetchServerCustomDocuments(): Promise<FoodSafetyDoc[]> {
  const results: FoodSafetyDoc[] = [];
  try {
    const res = await fetch('/api/custom-documents');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.documents)) {
        return data.documents;
      }
    }
  } catch {
    // ignore
  }

  if (auth.currentUser) {
    try {
      const q = query(
        collection(db, 'custom_documents'),
        where('visibility', '==', 'approved_staff')
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && d.code && d.title) {
          const built = buildLocalStructuredDocument({
            rawText: `${d.summary}\n${d.contentBody || ''}`,
            docType: d.type || 'sop',
            code: d.code,
            title: d.title,
            category: d.category || 'Operations & Maintenance',
          });
          results.push({
            ...built,
            id: d.id || docSnap.id,
          });
        }
      });
    } catch {
      // ignore
    }
  }

  return results;
}

export function saveDocumentsToLocalStorage(docs: FoodSafetyDoc[]) {
  try {
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
  } catch {
    // ignore
  }
}
