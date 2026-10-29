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
  onSnapshot,
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
  TrainingCertificateRecord,
  CertificateVerificationStatus,
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
const LOCAL_CERTS_KEY = 'ikqa_issued_certificates_v1';
const SYNC_CHANNEL_NAME = 'ikqa_portal_sync_v1';
const CLOUD_API_ORIGIN = 'https://ais-pre-76tv6e65bsiare5wrmxxvo-551232212768.asia-east1.run.app';

export function toDeterministicUid(email: string): string {
  return `user-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 90)}`;
}

export function toDeterministicCertId(staffEmail: string, staffName?: string): string {
  const key = (staffEmail || staffName || 'staff-member')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
  return `cert-${key || 'staff'}`;
}

export function generateDeterministicCertSerial(staffEmail: string, staffName?: string): string {
  const seed = `${(staffEmail || '').trim().toLowerCase()}|${(staffName || '').trim().toLowerCase()}`;
  let h1 = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h1 ^= seed.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  const hex = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
  const initials = (staffName || staffEmail || 'ST')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
    .padEnd(2, 'X');
  return `IKG-LD-2026-${initials}${hex}`;
}

function broadcastAccountSync() {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage({ type: 'ACCOUNTS_UPDATED', timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // ignore
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(path, init);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return res;
    }
    if (res.status === 400 || res.status === 401 || res.status === 404) {
      if (contentType.includes('application/json')) {
        return res;
      }
    }
  } catch {
    // Fallback to Cloud Run origin when hosted on static GitHub Pages
  }

  try {
    if (typeof window !== 'undefined' && !window.location.origin.includes('ais-')) {
      const cloudRes = await fetch(`${CLOUD_API_ORIGIN}${path}`, init);
      return cloudRes;
    }
  } catch {
    // ignore
  }
  return null;
}

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
    ndaAccepted: true,
    ndaSignature: 'I AGREE',
    ndaAcceptedAt: '2026-01-01T00:00:00.000Z',
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
    ndaAccepted: true,
    ndaSignature: 'I AGREE',
    ndaAcceptedAt: '2026-10-25T08:30:00.000Z',
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
    ndaAccepted: true,
    ndaSignature: 'I AGREE',
    ndaAcceptedAt: '2026-10-20T09:00:00.000Z',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a: any) => ({
          ...a,
          ndaAccepted: a.ndaAccepted ?? true,
          ndaSignature: a.ndaSignature || 'I AGREE',
          ndaAcceptedAt: a.ndaAcceptedAt || a.createdAt || new Date().toISOString(),
        }));
      }
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

async function syncAccountToFirestore(
  user: PortalUser & { password?: string }
): Promise<void> {
  const docId = (user.uid || toDeterministicUid(user.email)).slice(0, 128);
  const nowIso = new Date().toISOString();
  const payload: Record<string, any> = {
    uid: docId,
    email: user.email.trim().toLowerCase().slice(0, 254),
    displayName: (user.displayName || user.email).trim().slice(0, 120),
    position: (user.position || 'Kitchen / Service Staff').trim().slice(0, 120),
    branch: (user.branch || 'Jiangnan Hotpot - SM Mall of Asia').trim().slice(0, 160),
    role: user.role === 'master' ? 'master' : 'staff',
    status:
      user.status === 'approved' || user.status === 'rejected' ? user.status : 'pending',
    ndaAccepted: true,
    ndaSignature: 'I AGREE',
    ndaAcceptedAt: (user.ndaAcceptedAt || user.createdAt || nowIso).slice(0, 64),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (user.password) {
    payload.credentialPass = user.password.slice(0, 128);
  }

  try {
    await setDoc(doc(db, 'users', docId), payload, { merge: true });
  } catch {
    // Also try deterministic ID if user.uid was different
  }

  const detId = toDeterministicUid(user.email);
  if (detId !== docId) {
    try {
      await setDoc(
        doc(db, 'users', detId),
        { ...payload, uid: detId },
        { merge: true }
      );
    } catch {
      // ignore
    }
  }
}

export async function signInWithCredentials(
  identifier: string,
  password: string
): Promise<PortalUser> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPw = password.trim();

  // 1. Check Master Account credentials immediately
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
      ndaAccepted: true,
      ndaSignature: 'I AGREE',
      ndaAcceptedAt: '2026-01-01T00:00:00.000Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authProvider: 'master_credentials',
    };
    saveSessionUser(masterUser);
    return masterUser;
  }

  // 2. Check Firebase Firestore /users so cross-device accounts work everywhere
  try {
    const detUid = toDeterministicUid(cleanId);
    const snap = await getDoc(doc(db, 'users', detUid));
    if (snap.exists()) {
      const d = snap.data();
      if (!d.credentialPass || d.credentialPass === cleanPw) {
        const nowIso = new Date().toISOString();
        const fsUser: PortalUser = {
          uid: d.uid || detUid,
          email: d.email || cleanId,
          displayName: d.displayName || cleanId,
          position: d.position || 'Staff',
          branch: d.branch || 'Jiangnan Hotpot',
          role: d.role === 'master' ? 'master' : 'staff',
          status: d.status || 'pending',
          ndaAccepted: true,
          ndaSignature: d.ndaSignature || 'I AGREE',
          ndaAcceptedAt: d.ndaAcceptedAt || nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
          authProvider: 'staff_credentials',
        };
        saveSessionUser(fsUser);
        return fsUser;
      }
    }
  } catch {
    // ignore and continue
  }

  // 3. Check Express API
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password: cleanPw }),
    });
    if (res && res.ok) {
      const data = await res.json();
      if (data.user) {
        saveSessionUser(data.user);
        return data.user;
      }
    }
  } catch {
    // continue to local check
  }

  // 4. Local fallback check
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
  ndaSignature?: string;
}): Promise<PortalUser> {
  const cleanSig = String(params.ndaSignature || 'I AGREE').trim().toUpperCase();
  if (cleanSig !== 'I AGREE') {
    throw new Error('You must manually type "I AGREE" to accept the Confidentiality Agreement.');
  }

  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPw = params.password.trim();
  const isMaster =
    cleanEmail === MASTER_ACCOUNT_DETAILS.email.toLowerCase() ||
    cleanEmail === MASTER_ACCOUNT_DETAILS.googleOwnerEmail.toLowerCase();

  const deterministicUid = toDeterministicUid(cleanEmail);
  const nowIso = new Date().toISOString();

  const newEntry: PortalUser & { password?: string } = {
    uid: deterministicUid,
    email: cleanEmail,
    password: cleanPw,
    displayName: params.displayName.trim().slice(0, 120),
    position: (params.position || 'Kitchen / Service Staff').trim().slice(0, 120),
    branch: (params.branch || 'Jiangnan Hotpot - SM Mall of Asia').trim().slice(0, 160),
    role: isMaster ? 'master' : 'staff',
    status: isMaster ? 'approved' : 'pending',
    ndaAccepted: true,
    ndaSignature: 'I AGREE',
    ndaAcceptedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
    authProvider: 'staff_credentials',
  };

  // 1. Save to LocalStorage and broadcast across tabs
  const localAccs = getLocalAccounts();
  const existingIdx = localAccs.findIndex(
    (a) => a.email.toLowerCase() === cleanEmail || a.uid === deterministicUid
  );
  if (existingIdx >= 0) {
    localAccs[existingIdx] = {
      ...localAccs[existingIdx],
      ...newEntry,
      status:
        localAccs[existingIdx].status === 'approved' ? 'approved' : newEntry.status,
    };
  } else {
    localAccs.push(newEntry);
  }
  saveLocalAccounts(localAccs);

  // 2. Write directly to Firebase Firestore so Master Account receives it in real time across any browser/device/GitHub Pages!
  await syncAccountToFirestore(newEntry);

  // 3. Also register on Express backend
  try {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        uid: deterministicUid,
        ndaSignature: 'I AGREE',
        syncOnly: true,
      }),
    });
    if (res && res.ok) {
      const data = await res.json();
      if (data.user) {
        broadcastAccountSync();
        saveSessionUser(data.user);
        return data.user;
      }
    }
  } catch {
    // Fallback to Firestore + local entry
  }

  broadcastAccountSync();
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
  const nowIso = new Date().toISOString();

  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      const d = snap.data();
      firestoreProfile = {
        uid: d.uid || fbUser.uid,
        email: d.email || email,
        displayName: d.displayName || fbUser.displayName || email,
        position: d.position || defaultPosition,
        branch: d.branch || defaultBranch,
        role: isMaster ? 'master' : d.role || 'staff',
        status: isMaster ? 'approved' : d.status || 'pending',
        ndaAccepted: true,
        ndaSignature: d.ndaSignature || 'I AGREE',
        ndaAcceptedAt: d.ndaAcceptedAt || nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
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
        ndaAccepted: true,
        ndaSignature: 'I AGREE',
        ndaAcceptedAt: nowIso,
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
        ndaAccepted: true,
        ndaSignature: 'I AGREE',
        ndaAcceptedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
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

  try {
    const res = await apiFetch('/api/auth/google-sync', {
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
    if (res && res.ok) {
      const data = await res.json();
      if (data.user) {
        firestoreProfile = {
          ...data.user,
          role: isMaster ? 'master' : firestoreProfile?.role || data.user.role,
          status: isMaster ? 'approved' : firestoreProfile?.status || data.user.status,
          ndaAccepted: true,
          ndaSignature: 'I AGREE',
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
    ndaAccepted: true,
    ndaSignature: 'I AGREE',
    ndaAcceptedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
    authProvider: 'google',
  };

  const localAccs = getLocalAccounts();
  const idx = localAccs.findIndex((a) => a.uid === finalUser.uid || a.email === finalUser.email);
  if (idx >= 0) {
    localAccs[idx] = { ...localAccs[idx], ...finalUser };
  } else {
    localAccs.push(finalUser);
  }
  saveLocalAccounts(localAccs);
  saveSessionUser(finalUser);
  broadcastAccountSync();

  return finalUser;
}

/**
 * Direct Firestore-backed Google Account Sign-In / Registration for GitHub Pages (*.github.io)
 * and external domains where Firebase Auth's OAuth popup throws auth/unauthorized-domain.
 */
export async function signInWithGoogleCloudDirect(params: {
  email: string;
  displayName?: string;
  password?: string;
  position?: string;
  branch?: string;
  ndaSignature?: string;
}): Promise<PortalUser> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid Google Email address (e.g. name@gmail.com).');
  }

  const isMaster =
    cleanEmail === MASTER_ACCOUNT_DETAILS.googleOwnerEmail.toLowerCase() ||
    cleanEmail === MASTER_ACCOUNT_DETAILS.email.toLowerCase();

  if (isMaster) {
    const cleanPw = (params.password || '').trim();
    if (cleanPw !== MASTER_ACCOUNT_DETAILS.password) {
      throw new Error(
        'Master Google Account detected. Please enter the Master Account Password to verify ownership on GitHub Pages.'
      );
    }
    return signInWithCredentials(cleanEmail, cleanPw);
  }

  // Check if this Google email already exists in Firebase Firestore
  const detUid = toDeterministicUid(cleanEmail);
  const nowIso = new Date().toISOString();

  try {
    const snap = await getDoc(doc(db, 'users', detUid));
    if (snap.exists()) {
      const d = snap.data();
      if (d.credentialPass && params.password && d.credentialPass !== params.password.trim()) {
        throw new Error('Incorrect password for this registered Google account.');
      }
      const existingUser: PortalUser = {
        uid: d.uid || detUid,
        email: d.email || cleanEmail,
        displayName: d.displayName || params.displayName || cleanEmail.split('@')[0],
        position: d.position || params.position || 'Kitchen / Service Staff',
        branch: d.branch || params.branch || 'Jiangnan Hotpot - SM Mall of Asia',
        role: d.role === 'master' ? 'master' : 'staff',
        status:
          d.status === 'approved' || d.status === 'rejected' ? d.status : 'pending',
        ndaAccepted: true,
        ndaSignature: d.ndaSignature || 'I AGREE',
        ndaAcceptedAt: d.ndaAcceptedAt || nowIso,
        createdAt: d.ndaAcceptedAt || nowIso,
        updatedAt: nowIso,
        authProvider: 'google',
      };
      saveSessionUser(existingUser);
      broadcastAccountSync();
      return existingUser;
    }
  } catch (err: any) {
    if (err.message?.includes('Incorrect password')) {
      throw err;
    }
  }

  // If account doesn't exist yet, require "I AGREE" and register directly in Firestore
  const cleanSig = String(params.ndaSignature || '').trim().toUpperCase();
  if (cleanSig !== 'I AGREE') {
    throw new Error(
      'New Google Account detected. Please type "I AGREE" in the Confidentiality Agreement box below to submit your Google account for Master Account approval.'
    );
  }

  return registerStaffAccount({
    email: cleanEmail,
    password: (params.password || 'GoogleAuth2026!').trim(),
    displayName: (params.displayName || cleanEmail.split('@')[0]).trim(),
    position: params.position || 'FOH Receptionist',
    branch: params.branch || 'Jiangnan Hotpot - SM Mall of Asia',
    ndaSignature: 'I AGREE',
  });
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

  const upsertAccount = (acc: PortalUser) => {
    const key = acc.email.trim().toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        ...acc,
        ndaAccepted: acc.ndaAccepted ?? true,
        ndaSignature: acc.ndaSignature || 'I AGREE',
        ndaAcceptedAt: acc.ndaAcceptedAt || acc.createdAt,
      });
      return;
    }

    // Prefer non-pending status if one source already recorded Master approval/rejection
    const resolvedStatus =
      acc.status !== 'pending'
        ? acc.status
        : existing.status !== 'pending'
        ? existing.status
        : 'pending';

    const resolvedRole =
      acc.role === 'master' || existing.role === 'master' ? 'master' : 'staff';

    merged.set(key, {
      ...existing,
      ...acc,
      role: resolvedRole,
      status: resolvedStatus,
      ndaAccepted: true,
      ndaSignature: acc.ndaSignature || existing.ndaSignature || 'I AGREE',
      ndaAcceptedAt: acc.ndaAcceptedAt || existing.ndaAcceptedAt || acc.createdAt,
    });
  };

  // 1. Seed & local accounts
  for (const acc of getLocalAccounts()) {
    const { password: _pw, ...safe } = acc;
    upsertAccount(safe);
  }

  // 2. Express backend accounts
  try {
    const res = await apiFetch('/api/auth/accounts');
    if (res && res.ok) {
      const data = await res.json();
      if (Array.isArray(data.accounts)) {
        for (const acc of data.accounts) {
          upsertAccount(acc);
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. ALWAYS query Firebase Firestore /users (even when signed in via Master Email/Password!)
  try {
    const q = query(
      collection(db, 'users'),
      where('ndaAccepted', '==', true),
      where('ndaSignature', '==', 'I AGREE')
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && d.email) {
        const nowIso = new Date().toISOString();
        upsertAccount({
          uid: d.uid || docSnap.id,
          email: d.email,
          displayName: d.displayName || d.email,
          position: d.position || 'Staff',
          branch: d.branch || 'Jiangnan Hotpot',
          role: d.role === 'master' ? 'master' : 'staff',
          status:
            d.status === 'approved' || d.status === 'rejected' ? d.status : 'pending',
          ndaAccepted: true,
          ndaSignature: d.ndaSignature || 'I AGREE',
          ndaAcceptedAt: d.ndaAcceptedAt || nowIso,
          createdAt: d.ndaAcceptedAt || nowIso,
          updatedAt: nowIso,
          authProvider: 'staff_credentials',
        });
      }
    });
  } catch {
    // ignore if offline
  }

  // Sort so pending accounts appear right at the top for the Master Account
  const list = Array.from(merged.values()).sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  saveLocalAccounts(
    list.map((u) => {
      const existingLocal = getLocalAccounts().find(
        (la) => la.email.toLowerCase() === u.email.toLowerCase()
      );
      return { ...u, password: existingLocal?.password };
    })
  );

  return list;
}

export function subscribeToPortalAccounts(
  onUpdate: (accounts: PortalUser[]) => void
): () => void {
  let active = true;

  const refresh = () => {
    if (!active) return;
    fetchAllPortalAccounts()
      .then((list) => {
        if (active) onUpdate(list);
      })
      .catch(() => {});
  };

  // Initial load
  refresh();

  // 1. Live Firestore listener for instant cross-device account registration notifications
  let unsubFirestore: (() => void) | null = null;
  try {
    const q = query(
      collection(db, 'users'),
      where('ndaAccepted', '==', true),
      where('ndaSignature', '==', 'I AGREE')
    );
    unsubFirestore = onSnapshot(
      q,
      () => {
        refresh();
      },
      () => {
        // Ignore snapshot error and rely on polling
      }
    );
  } catch {
    // ignore
  }

  // 2. BroadcastChannel listener for same-browser tabs
  let bc: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.onmessage = () => refresh();
    }
  } catch {
    // ignore
  }

  // 3. Storage event listener
  const handleStorage = (e: StorageEvent) => {
    if (!e.key || e.key === LOCAL_ACCOUNTS_KEY || e.key === LOCAL_SESSION_KEY) {
      refresh();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 4. Periodic 4-second poll as rock-solid fallback
  const intervalId = setInterval(refresh, 4000);

  return () => {
    active = false;
    if (unsubFirestore) unsubFirestore();
    if (bc) bc.close();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
    clearInterval(intervalId);
  };
}

export async function updateAccountApprovalStatus(
  targetUser: PortalUser,
  status: 'pending' | 'approved' | 'rejected',
  role?: 'master' | 'staff'
): Promise<PortalUser[]> {
  const nextRole = role || targetUser.role;
  const nowIso = new Date().toISOString();

  // 1. Update local store
  const localAccs = getLocalAccounts();
  let foundLocal = false;
  const updatedLocal = localAccs.map((a) => {
    if (a.uid === targetUser.uid || a.email.toLowerCase() === targetUser.email.toLowerCase()) {
      foundLocal = true;
      return {
        ...a,
        status,
        role: nextRole,
        updatedAt: nowIso,
      };
    }
    return a;
  });
  if (!foundLocal) {
    updatedLocal.push({
      ...targetUser,
      status,
      role: nextRole,
      updatedAt: nowIso,
    });
  }
  saveLocalAccounts(updatedLocal);

  // 2. ALWAYS update Firestore /users (works for both Master credential login & Google login)
  await syncAccountToFirestore({
    ...targetUser,
    status,
    role: nextRole,
    updatedAt: nowIso,
  });

  // 3. Update Express backend store
  try {
    await apiFetch('/api/auth/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUid: targetUser.uid,
        email: targetUser.email,
        displayName: targetUser.displayName,
        position: targetUser.position,
        branch: targetUser.branch,
        ndaSignature: targetUser.ndaSignature || 'I AGREE',
        status,
        role: nextRole,
      }),
    });
  } catch {
    // ignore
  }

  broadcastAccountSync();
  return fetchAllPortalAccounts();
}

export async function updateStaffProfileByMaster(
  targetUser: PortalUser,
  updates: {
    displayName: string;
    position: string;
    branch: string;
    status?: 'pending' | 'approved' | 'rejected';
    role?: 'master' | 'staff';
  }
): Promise<PortalUser[]> {
  const cleanName = (updates.displayName || targetUser.displayName).trim().slice(0, 120);
  const cleanPosition = (updates.position || targetUser.position).trim().slice(0, 120);
  const cleanBranch = (updates.branch || targetUser.branch).trim().slice(0, 160);
  const nextStatus = updates.status || targetUser.status;
  const nextRole = updates.role || targetUser.role;
  const nowIso = new Date().toISOString();

  const updatedAccount: PortalUser = {
    ...targetUser,
    displayName: cleanName,
    position: cleanPosition,
    branch: cleanBranch,
    status: nextStatus,
    role: nextRole,
    updatedAt: nowIso,
  };

  // 1. Update local accounts list
  const localAccs = getLocalAccounts();
  let foundLocal = false;
  const updatedLocal = localAccs.map((a) => {
    if (
      a.uid === targetUser.uid ||
      a.email.toLowerCase() === targetUser.email.toLowerCase()
    ) {
      foundLocal = true;
      return {
        ...a,
        displayName: cleanName,
        position: cleanPosition,
        branch: cleanBranch,
        status: nextStatus,
        role: nextRole,
        updatedAt: nowIso,
      };
    }
    return a;
  });
  if (!foundLocal) {
    updatedLocal.push(updatedAccount);
  }
  saveLocalAccounts(updatedLocal);

  // If the currently signed-in session matches this user, update their session immediately
  const activeSession = getSavedSessionUser();
  if (
    activeSession &&
    (activeSession.uid === targetUser.uid ||
      activeSession.email.toLowerCase() === targetUser.email.toLowerCase())
  ) {
    saveSessionUser({
      ...activeSession,
      displayName: cleanName,
      position: cleanPosition,
      branch: cleanBranch,
      status: nextStatus,
      role: nextRole,
      updatedAt: nowIso,
    });
  }

  // 2. Update Firebase Firestore /users/{uid}
  const detUid = toDeterministicUid(targetUser.email);
  const candidateIds = Array.from(new Set([targetUser.uid, detUid].filter(Boolean)));
  for (const cid of candidateIds) {
    try {
      await setDoc(
        doc(db, 'users', cid),
        {
          displayName: cleanName,
          position: cleanPosition,
          branch: cleanBranch,
          status: nextStatus,
          role: nextRole,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Fallback to full syncAccountToFirestore if document didn't exist yet
      await syncAccountToFirestore(updatedAccount);
    }
  }

  // 3. Update Express backend
  try {
    await apiFetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUid: targetUser.uid,
        email: targetUser.email,
        displayName: cleanName,
        position: cleanPosition,
        branch: cleanBranch,
        ndaSignature: targetUser.ndaSignature || 'I AGREE',
        status: nextStatus,
        role: nextRole,
      }),
    });
  } catch {
    // ignore
  }

  // 4. Sync any existing certificate for this staff member so their certificate identity matches Master Hub edits
  try {
    const existingCerts = getLocalCertificates();
    const matchedCert = existingCerts.find(
      (c) =>
        c.staffEmail.toLowerCase() === targetUser.email.toLowerCase() ||
        c.id === toDeterministicCertId(targetUser.email, targetUser.displayName)
    );
    if (matchedCert) {
      await issueOrUpdateTrainingCertificate({
        ...matchedCert,
        staffName: cleanName,
        staffPosition: cleanPosition,
        staffBranch: cleanBranch,
      });
    }
  } catch {
    // ignore
  }

  broadcastAccountSync();
  return fetchAllPortalAccounts();
}

export async function checkCurrentAccountStatus(user: PortalUser): Promise<PortalUser> {
  const cleanEmail = user.email.trim().toLowerCase();
  const detUid = toDeterministicUid(cleanEmail);

  // 1. Check Firebase Firestore first (tried by both user.uid and deterministic UID)
  const candidateIds = Array.from(new Set([user.uid, detUid].filter(Boolean)));
  for (const cid of candidateIds) {
    try {
      const snap = await getDoc(doc(db, 'users', cid));
      if (snap.exists()) {
        const d = snap.data();
        const resolved: PortalUser = {
          ...user,
          uid: d.uid || cid,
          displayName: d.displayName || user.displayName,
          position: d.position || user.position,
          branch: d.branch || user.branch,
          role: d.role === 'master' ? 'master' : 'staff',
          status:
            d.status === 'approved' || d.status === 'rejected' ? d.status : 'pending',
          ndaAccepted: true,
          ndaSignature: d.ndaSignature || 'I AGREE',
        };
        saveSessionUser(resolved);
        return resolved;
      }
    } catch {
      // ignore
    }
  }

  // Self-healing: If the pending user's account was created before Firestore sync was added,
  // push it to Firestore and the server right now so the Master Account immediately sees it!
  if (user.status === 'pending') {
    await syncAccountToFirestore(user);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid || detUid,
          email: user.email,
          displayName: user.displayName,
          position: user.position,
          branch: user.branch,
          ndaSignature: 'I AGREE',
          syncOnly: true,
        }),
      });
    } catch {
      // ignore
    }
  }

  // 2. Check Express backend status endpoint
  try {
    const res = await apiFetch(
      `/api/auth/status/${encodeURIComponent(user.uid)}?email=${encodeURIComponent(cleanEmail)}`
    );
    if (res && res.ok) {
      const data = await res.json();
      if (data.user) {
        saveSessionUser(data.user);
        return data.user;
      }
    }
  } catch {
    // ignore
  }

  // 3. Check local storage
  const localAccs = getLocalAccounts();
  const found = localAccs.find(
    (a) => a.uid === user.uid || a.email.toLowerCase() === cleanEmail
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
    const res = await apiFetch('/api/documents/ai-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res && res.ok) {
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
    await apiFetch('/api/custom-documents', {
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
    await apiFetch(`/api/custom-documents/${encodeURIComponent(docId)}`, {
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
    const res = await apiFetch('/api/custom-documents');
    if (res && res.ok) {
      const data = await res.json();
      if (Array.isArray(data.documents)) {
        return data.documents;
      }
    }
  } catch {
    // ignore
  }

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

  return results;
}

export function saveDocumentsToLocalStorage(docs: FoodSafetyDoc[]) {
  try {
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
  } catch {
    // ignore
  }
}

// ============================================================================
// SINGLE OFFICIAL CERTIFICATE REGISTRY & MASTER HUB VERIFICATION
// ============================================================================

const DEFAULT_SEED_CERTIFICATES: TrainingCertificateRecord[] = [
  {
    id: toDeterministicCertId('maria.santos@jiangnanhotpot.com', 'Maria Santos'),
    serialCode: generateDeterministicCertSerial('maria.santos@jiangnanhotpot.com', 'Maria Santos'),
    staffName: 'Maria Santos',
    staffEmail: 'maria.santos@jiangnanhotpot.com',
    staffPosition: 'Kitchen Shift Lead',
    staffBranch: 'Jiangnan Hotpot - SM Mall of Asia',
    quizTitle: 'Food Safety, SOP & Operational Compliance Competency Assessment',
    score: 10,
    totalQuestions: 10,
    percentage: 100,
    status: 'verified',
    issuedAt: '2026-10-22T10:15:00.000Z',
    verifiedBy: 'Imperial Kitchen Group L&D Team (Master Hub Verified)',
  },
];

function deduplicateCertificatesList(
  certs: TrainingCertificateRecord[]
): TrainingCertificateRecord[] {
  const byStaffKey = new Map<string, TrainingCertificateRecord>();

  for (const cert of certs) {
    if (!cert) continue;
    const emailKey = (cert.staffEmail || '').trim().toLowerCase();
    const nameKey = (cert.staffName || '').trim().toLowerCase();
    // Strictly 1 certificate per staff member (keyed by email or deterministic ID)
    const staffUniqueKey = emailKey || cert.id || nameKey;
    if (!staffUniqueKey) continue;

    const canonicalId = toDeterministicCertId(emailKey || nameKey, cert.staffName);
    const canonicalSerial =
      cert.serialCode && cert.serialCode.startsWith('IKG-LD-')
        ? cert.serialCode
        : generateDeterministicCertSerial(emailKey || nameKey, cert.staffName);

    const normalized: TrainingCertificateRecord = {
      ...cert,
      id: canonicalId,
      serialCode: canonicalSerial,
      staffEmail: emailKey || `${nameKey.replace(/[^a-z0-9]/g, '.')}@jiangnanhotpot.com`,
      staffName: (cert.staffName || 'Staff Member').trim(),
      staffPosition: (cert.staffPosition || 'Kitchen Shift Lead').trim(),
      staffBranch: (cert.staffBranch || 'Jiangnan Hotpot - SM Mall of Asia').trim(),
      quizTitle:
        cert.quizTitle ||
        'Food Safety, SOP & Operational Compliance Competency Assessment',
      score: Number(cert.score ?? 10),
      totalQuestions: Number(cert.totalQuestions ?? 10),
      percentage: Math.round(
        (Number(cert.score ?? 10) / Math.max(1, Number(cert.totalQuestions ?? 10))) * 100
      ),
      status: cert.status === 'revoked' ? 'revoked' : 'verified',
      issuedAt: cert.issuedAt || new Date().toISOString(),
      verifiedBy:
        cert.verifiedBy || 'Imperial Kitchen Group L&D Team (Master Hub Verified)',
    };

    const existing = byStaffKey.get(staffUniqueKey);
    if (!existing) {
      byStaffKey.set(staffUniqueKey, normalized);
    } else {
      // Keep the latest updated/issued record while preserving revoked status if revoked by Master
      const nextStatus: CertificateVerificationStatus =
        normalized.status === 'revoked' || existing.status === 'revoked'
          ? normalized.status
          : 'verified';
      byStaffKey.set(staffUniqueKey, {
        ...existing,
        ...normalized,
        id: canonicalId,
        serialCode: existing.serialCode || canonicalSerial,
        status: nextStatus,
      });
    }
  }

  return Array.from(byStaffKey.values()).sort((a, b) =>
    (b.issuedAt || '').localeCompare(a.issuedAt || '')
  );
}

export function getLocalCertificates(): TrainingCertificateRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_CERTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateCertificatesList(parsed);
      }
    }
  } catch {
    // ignore
  }
  return deduplicateCertificatesList(DEFAULT_SEED_CERTIFICATES);
}

export function saveLocalCertificates(certs: TrainingCertificateRecord[]) {
  try {
    const deduped = deduplicateCertificatesList(certs);
    localStorage.setItem(LOCAL_CERTS_KEY, JSON.stringify(deduped));
  } catch {
    // ignore
  }
}

async function syncCertificateToFirestore(
  cert: TrainingCertificateRecord
): Promise<void> {
  const docId = cert.id.slice(0, 128);
  const payload = {
    id: docId,
    serialCode: cert.serialCode.slice(0, 64),
    staffName: cert.staffName.slice(0, 120),
    staffEmail: cert.staffEmail.trim().toLowerCase().slice(0, 254),
    staffPosition: cert.staffPosition.slice(0, 120),
    staffBranch: cert.staffBranch.slice(0, 160),
    quizTitle: cert.quizTitle.slice(0, 240),
    score: Number(cert.score || 10),
    totalQuestions: Number(cert.totalQuestions || 10),
    percentage: Number(cert.percentage || 100),
    status: cert.status === 'revoked' ? 'revoked' : 'verified',
    issuedAt: (cert.issuedAt || new Date().toISOString()).slice(0, 64),
    verifiedBy: (
      cert.verifiedBy || 'Imperial Kitchen Group L&D Team (Master Hub Verified)'
    ).slice(0, 160),
    visibility: 'portal_verified',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const ref = doc(db, 'certificates', docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const existingData = snap.data();
      await setDoc(ref, {
        ...payload,
        serialCode: existingData.serialCode || payload.serialCode,
        staffEmail: existingData.staffEmail || payload.staffEmail,
        createdAt: existingData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, payload);
    }
  } catch {
    // ignore if offline
  }
}

export async function issueOrUpdateTrainingCertificate(params: {
  staffName: string;
  staffEmail?: string;
  staffPosition: string;
  staffBranch: string;
  quizTitle?: string;
  score?: number;
  totalQuestions?: number;
  issuedAt?: string;
  status?: CertificateVerificationStatus;
}): Promise<TrainingCertificateRecord> {
  const sessionUser = getSavedSessionUser();
  const resolvedEmail = (
    params.staffEmail ||
    (sessionUser &&
    sessionUser.displayName.toLowerCase() === (params.staffName || '').trim().toLowerCase()
      ? sessionUser.email
      : '') ||
    `${(params.staffName || 'staff.member')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')}@jiangnanhotpot.com`
  )
    .trim()
    .toLowerCase();

  const certId = toDeterministicCertId(resolvedEmail, params.staffName);
  const existingLocal = getLocalCertificates().find(
    (c) => c.id === certId || c.staffEmail.toLowerCase() === resolvedEmail
  );

  const serialCode =
    existingLocal?.serialCode ||
    generateDeterministicCertSerial(resolvedEmail, params.staffName);
  const score = Number(params.score ?? existingLocal?.score ?? 10);
  const totalQuestions = Math.max(
    1,
    Number(params.totalQuestions ?? existingLocal?.totalQuestions ?? 10)
  );
  const percentage = Math.round((score / totalQuestions) * 100);
  const issuedAt =
    params.issuedAt || existingLocal?.issuedAt || new Date().toISOString();
  const status: CertificateVerificationStatus =
    params.status || existingLocal?.status || 'verified';

  const record: TrainingCertificateRecord = {
    id: certId,
    serialCode,
    staffName: (params.staffName || existingLocal?.staffName || 'Staff Member').trim(),
    staffEmail: resolvedEmail,
    staffPosition: (
      params.staffPosition ||
      existingLocal?.staffPosition ||
      'Kitchen Shift Lead'
    ).trim(),
    staffBranch: (
      params.staffBranch ||
      existingLocal?.staffBranch ||
      'Jiangnan Hotpot - SM Mall of Asia'
    ).trim(),
    quizTitle:
      params.quizTitle ||
      existingLocal?.quizTitle ||
      'Food Safety, SOP & Operational Compliance Competency Assessment',
    score,
    totalQuestions,
    percentage,
    status,
    issuedAt,
    verifiedBy: 'Imperial Kitchen Group L&D Team (Master Hub Verified)',
  };

  // 1. Save deduplicated single certificate per user in LocalStorage
  const allLocal = getLocalCertificates().filter(
    (c) => c.id !== certId && c.staffEmail.toLowerCase() !== resolvedEmail
  );
  allLocal.unshift(record);
  saveLocalCertificates(allLocal);

  // 2. Sync to Firestore /certificates/{certId}
  await syncCertificateToFirestore(record);

  // 3. Sync to Express backend
  try {
    await apiFetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificate: record }),
    });
  } catch {
    // ignore
  }

  broadcastAccountSync();
  return record;
}

export async function fetchAllIssuedCertificates(): Promise<TrainingCertificateRecord[]> {
  const combined: TrainingCertificateRecord[] = [...getLocalCertificates()];

  // 1. Express backend certificates
  try {
    const res = await apiFetch('/api/certificates');
    if (res && res.ok) {
      const data = await res.json();
      if (Array.isArray(data.certificates)) {
        combined.push(...data.certificates);
      }
    }
  } catch {
    // ignore
  }

  // 2. Firebase Firestore /certificates
  try {
    const q = query(
      collection(db, 'certificates'),
      where('visibility', '==', 'portal_verified')
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && d.serialCode && d.staffName) {
        combined.push({
          id: d.id || docSnap.id,
          serialCode: d.serialCode,
          staffName: d.staffName,
          staffEmail: d.staffEmail || 'staff@jiangnanhotpot.com',
          staffPosition: d.staffPosition || 'Restaurant Staff',
          staffBranch: d.staffBranch || 'Jiangnan Hotpot',
          quizTitle:
            d.quizTitle ||
            'Food Safety, SOP & Operational Compliance Competency Assessment',
          score: Number(d.score ?? 10),
          totalQuestions: Number(d.totalQuestions ?? 10),
          percentage: Number(d.percentage ?? 100),
          status: d.status === 'revoked' ? 'revoked' : 'verified',
          issuedAt: d.issuedAt || new Date().toISOString(),
          verifiedBy:
            d.verifiedBy || 'Imperial Kitchen Group L&D Team (Master Hub Verified)',
        });
      }
    });
  } catch {
    // ignore
  }

  const deduped = deduplicateCertificatesList(combined);
  saveLocalCertificates(deduped);
  return deduped;
}

export async function updateCertificateStatusByMaster(
  cert: TrainingCertificateRecord,
  status: CertificateVerificationStatus
): Promise<TrainingCertificateRecord[]> {
  await issueOrUpdateTrainingCertificate({
    ...cert,
    status,
  });

  try {
    await apiFetch('/api/certificates/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cert.id,
        serialCode: cert.serialCode,
        staffEmail: cert.staffEmail,
        status,
      }),
    });
  } catch {
    // ignore
  }

  return fetchAllIssuedCertificates();
}

export function subscribeToIssuedCertificates(
  onUpdate: (certs: TrainingCertificateRecord[]) => void
): () => void {
  let active = true;

  const refresh = () => {
    if (!active) return;
    fetchAllIssuedCertificates()
      .then((list) => {
        if (active) onUpdate(list);
      })
      .catch(() => {});
  };

  refresh();

  let unsubFirestore: (() => void) | null = null;
  try {
    const q = query(
      collection(db, 'certificates'),
      where('visibility', '==', 'portal_verified')
    );
    unsubFirestore = onSnapshot(
      q,
      () => refresh(),
      () => {}
    );
  } catch {
    // ignore
  }

  let bc: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.onmessage = () => refresh();
    }
  } catch {
    // ignore
  }

  const intervalId = setInterval(refresh, 5000);

  return () => {
    active = false;
    if (unsubFirestore) unsubFirestore();
    if (bc) bc.close();
    clearInterval(intervalId);
  };
}

