import express from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe server-side loading of documents catalog
const docsJsonPath = path.join(__dirname, 'src', 'data', 'foodSafetyDocuments.json');
const INITIAL_FOOD_SAFETY_DOCUMENTS: any[] = JSON.parse(fs.readFileSync(docsJsonPath, 'utf8'));

// Persistent store path for accounts & Master-uploaded documents (with /tmp fallback for read-only Cloud Run containers)
const storeJsonPath = path.join(__dirname, 'src', 'data', 'portalStore.json');
const tmpStoreJsonPath = path.join(os.tmpdir(), 'ikqa_portalStore.json');

export const MASTER_CREDENTIALS = {
  email: 'master@jiangnanhotpot.com',
  username: 'IKQA-MASTER',
  ownerEmail: 'johndavedeleon005@gmail.com',
  password: 'JiangnanMaster2026!',
  displayName: 'John Dave De Leon (Master Admin)',
  position: 'L&D Specialist & FSCO (Master Account)',
  branch: 'Imperial Kitchen Group HQ - L&D Department',
};

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

function getServerCandidateSerialCodes(
  staffEmail?: string,
  staffName?: string,
  explicitSerial?: string
): string[] {
  const candidates = new Set<string>();
  const add = (val?: string) => {
    const clean = String(val || '').trim().toUpperCase();
    if (clean) candidates.add(clean);
  };
  if (explicitSerial) add(explicitSerial);

  const cleanEmail = String(staffEmail || '').trim().toLowerCase();
  const cleanName = String(staffName || '').trim();
  const lowerName = cleanName.toLowerCase();
  const strippedName = cleanName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const synthEmail = lowerName
    ? `${lowerName.replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '')}@jiangnanhotpot.com`
    : '';
  const legacySynthEmail = lowerName
    ? `${lowerName.replace(/[^a-z0-9]/g, '.')}@jiangnanhotpot.com`
    : '';

  const emails = Array.from(
    new Set([
      cleanEmail,
      lowerName,
      synthEmail,
      legacySynthEmail,
      '',
      ...(cleanEmail === MASTER_CREDENTIALS.email.toLowerCase() ||
      cleanEmail === MASTER_CREDENTIALS.ownerEmail.toLowerCase() ||
      lowerName.includes('john dave de leon')
        ? [
            MASTER_CREDENTIALS.email.toLowerCase(),
            MASTER_CREDENTIALS.ownerEmail.toLowerCase(),
            MASTER_CREDENTIALS.username.toLowerCase(),
          ]
        : []),
    ])
  );

  const names = Array.from(
    new Set([
      cleanName,
      strippedName,
      cleanEmail,
      '',
      ...(lowerName.includes('john dave de leon') ||
      cleanEmail === MASTER_CREDENTIALS.email.toLowerCase() ||
      cleanEmail === MASTER_CREDENTIALS.ownerEmail.toLowerCase()
        ? [MASTER_CREDENTIALS.displayName, 'John Dave De Leon']
        : []),
    ])
  );

  for (const em of emails) {
    for (const nm of names) {
      if (em || nm) {
        add(generateDeterministicCertSerial(em, nm));
      }
    }
  }

  if (cleanEmail === 'maria.santos@jiangnanhotpot.com' || lowerName === 'maria santos') {
    add('IKG-LD-2026-MS8A4F1C');
  }
  if (cleanEmail || cleanName) {
    add(toDeterministicCertId(cleanEmail || cleanName, cleanName));
  }
  return Array.from(candidates);
}

const DEFAULT_PORTAL_STORE: { accounts: any[]; customDocuments: any[]; certificates: any[] } = {
  accounts: [
    {
      uid: 'master-admin-001',
      email: MASTER_CREDENTIALS.email,
      password: MASTER_CREDENTIALS.password,
      displayName: MASTER_CREDENTIALS.displayName,
      position: MASTER_CREDENTIALS.position,
      branch: MASTER_CREDENTIALS.branch,
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
  ],
  customDocuments: [],
  certificates: [
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
    {
      id: toDeterministicCertId(MASTER_CREDENTIALS.email, MASTER_CREDENTIALS.displayName),
      serialCode: generateDeterministicCertSerial(
        MASTER_CREDENTIALS.email,
        MASTER_CREDENTIALS.displayName
      ),
      staffName: MASTER_CREDENTIALS.displayName,
      staffEmail: MASTER_CREDENTIALS.email,
      staffPosition: MASTER_CREDENTIALS.position,
      staffBranch: MASTER_CREDENTIALS.branch,
      quizTitle: 'Food Safety, SOP & Operational Compliance Competency Assessment',
      score: 10,
      totalQuestions: 10,
      percentage: 100,
      status: 'verified',
      issuedAt: '2026-10-20T09:00:00.000Z',
      verifiedBy: 'Imperial Kitchen Group L&D Team (Master Hub Verified)',
    },
  ],
};

const SERVER_MASTER_EMAILS = new Set([
  MASTER_CREDENTIALS.email.toLowerCase(),
  MASTER_CREDENTIALS.username.toLowerCase(),
  MASTER_CREDENTIALS.ownerEmail.toLowerCase(),
  'johndave.deleon@jiangnanhotpot.com',
  'joy.bernardo@jiangnanhotpot.com',
  'lanyann.nemenzo@jiangnanhotpot.com',
  'dicedivine.torralba@jiangnanhotpot.com',
  'lnd@jiangnanhotpot.com',
  'lnd@imperialkitchen.com',
]);

const SERVER_MASTER_NAMES = new Set([
  'john dave de leon',
  'joy bernardo',
  'lany ann nemenzo',
  'dice divine torralba',
  'imperial kitchen group l&d master account',
]);

function isMasterAccountRecord(acc: any): boolean {
  if (!acc) return false;
  if (acc.role === 'master') return true;
  const email = String(acc.email || '').trim().toLowerCase();
  const uid = String(acc.uid || '').trim().toLowerCase();
  const name = String(acc.displayName || '').trim().toLowerCase();
  const pos = String(acc.position || '').trim().toLowerCase();
  const branch = String(acc.branch || '').trim().toLowerCase();

  if (SERVER_MASTER_EMAILS.has(email) || SERVER_MASTER_EMAILS.has(uid)) return true;
  if (uid === 'master-admin-001' || uid.startsWith('master-')) return true;
  if (SERVER_MASTER_NAMES.has(name)) return true;
  if (
    pos.includes('master') ||
    pos.includes('l&d') ||
    pos.includes('learning and development') ||
    pos.includes('learning & development') ||
    pos.includes('fsco')
  ) {
    return true;
  }
  if (branch.includes('l&d department')) {
    return true;
  }
  return false;
}

function loadPortalStore(): { accounts: any[]; customDocuments: any[]; certificates: any[] } {
  for (const candidatePath of [tmpStoreJsonPath, storeJsonPath]) {
    try {
      if (fs.existsSync(candidatePath)) {
        const raw = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
        const accounts =
          Array.isArray(raw.accounts) && raw.accounts.length > 0
            ? raw.accounts.map((acc: any) => {
                const isMaster = isMasterAccountRecord(acc);
                return {
                  ...acc,
                  role: isMaster ? 'master' : acc.role || 'staff',
                  status: isMaster ? 'approved' : acc.status || 'pending',
                  ndaAccepted: acc.ndaAccepted ?? true,
                  ndaSignature: acc.ndaSignature || 'I AGREE',
                  ndaAcceptedAt: acc.ndaAcceptedAt || acc.createdAt || new Date().toISOString(),
                };
              })
            : DEFAULT_PORTAL_STORE.accounts;
        const rawCerts: any[] =
          Array.isArray(raw.certificates) && raw.certificates.length > 0
            ? raw.certificates
            : DEFAULT_PORTAL_STORE.certificates;
        const certMap = new Map<string, any>();
        for (const c of [...DEFAULT_PORTAL_STORE.certificates, ...rawCerts]) {
          if (!c) continue;
          const emailKey = String(c.staffEmail || '').trim().toLowerCase();
          const nameKey = String(c.staffName || '').trim();
          const key = emailKey || c.id || nameKey.toLowerCase();
          if (!key) continue;
          const canonicalSerial = generateDeterministicCertSerial(emailKey || nameKey, nameKey);
          const serial =
            c.serialCode &&
            String(c.serialCode).toUpperCase().startsWith('IKG-LD-') &&
            String(c.serialCode).toUpperCase() !== 'IKG-LD-2026-MS8A4F1C'
              ? String(c.serialCode).toUpperCase()
              : canonicalSerial;
          certMap.set(key, {
            ...c,
            id: toDeterministicCertId(emailKey || nameKey, nameKey),
            serialCode: serial,
          });
        }
        return {
          accounts,
          customDocuments: Array.isArray(raw.customDocuments) ? raw.customDocuments : [],
          certificates: Array.from(certMap.values()),
        };
      }
    } catch (err) {
      console.warn(`Could not load ${candidatePath}, trying fallback:`, err);
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_PORTAL_STORE));
}

const portalStore = loadPortalStore();

function savePortalStore() {
  const payload = JSON.stringify(portalStore, null, 2);
  try {
    fs.writeFileSync(storeJsonPath, payload, 'utf8');
  } catch {
    // Fallback for read-only container filesystems in Cloud Run
  }
  try {
    fs.writeFileSync(tmpStoreJsonPath, payload, 'utf8');
  } catch (err) {
    console.warn('Could not write temporary portalStore:', err);
  }
}

function sanitizeAccount(acc: any) {
  const { password: _pw, ...safe } = acc;
  const isMaster = isMasterAccountRecord(acc);
  return {
    ...safe,
    role: isMaster ? 'master' : safe.role || 'staff',
    status: isMaster ? 'approved' : safe.status || 'pending',
    ndaAccepted: safe.ndaAccepted ?? true,
    ndaSignature: safe.ndaSignature || 'I AGREE',
    ndaAcceptedAt: safe.ndaAcceptedAt || safe.createdAt,
  };
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));

// Lazy-initialize GoogleGenAI server-side
let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || 'missing-api-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

function getAllCombinedDocuments(clientCustomDocs?: any[]): any[] {
  const customMap = new Map<string, any>();
  for (const doc of portalStore.customDocuments) {
    if (doc && doc.code) {
      customMap.set(String(doc.code).toUpperCase(), doc);
    }
  }
  if (Array.isArray(clientCustomDocs)) {
    for (const doc of clientCustomDocs) {
      if (doc && doc.code) {
        customMap.set(String(doc.code).toUpperCase(), doc);
      }
    }
  }
  return [...INITIAL_FOOD_SAFETY_DOCUMENTS, ...Array.from(customMap.values())];
}

function buildDocumentsGroundingBrief(allDocs: any[]): string {
  return allDocs
    .map((doc: any) => {
      const takeaways = (doc.keyTakeaways || []).map((t: any) => `  * ${t}`).join('\n');
      const rules = (doc.quickRules || [])
        .map((r: any) => `  * [${String(r.type || 'info').toUpperCase()}] ${r.title}: ${r.rule}`)
        .join('\n');
      const sectionsBrief = (doc.sections || [])
        .map((s: any) => {
          const bullets =
            s.bulletPoints && s.bulletPoints.length > 0
              ? `\n    - ${s.bulletPoints.join('\n    - ')}`
              : '';
          return `  - ${s.title}: ${s.content}${bullets}`;
        })
        .join('\n');
      const tablesBrief =
        doc.tables && doc.tables.length > 0
          ? `  Tables:\n` +
            doc.tables
              .map(
                (t: any) =>
                  `    Table "${t.title}": ${(t.headers || []).join(' | ')} -> ${(t.rows || [])
                    .map((r: any) => r.join(' / '))
                    .slice(0, 5)
                    .join('; ')}`
              )
              .join('\n')
          : '';

      return `### DOCUMENT: ${doc.code} - ${doc.title}${doc.isCustom ? ' [MASTER ACCOUNT UPLOADED]' : ''}
* Type: ${String(doc.type || 'sop').toUpperCase()} | Category: ${doc.category} | Rev: ${doc.revision} | Effective: ${doc.effectiveDate}
* Official Summary: ${doc.summary}
* Key Takeaways:
${takeaways}
* Quick Critical Rules:
${rules}
* Key Policy Sections & Procedures:
${sectionsBrief}
${tablesBrief}
* Signatories: Prepared by ${doc.signatories?.preparedBy || 'L&D Master Account'}, Reviewed by ${
        doc.signatories?.reviewedBy?.join(', ') || 'QA/SCM/HR/VP'
      }, Approved by ${doc.signatories?.approvedBy || 'Jack Julius Tiu (President)'}
----------------------------------------`;
    })
    .join('\n\n');
}

function getRuleFallbackAnswer(
  query: any,
  _contextDocTitle?: any,
  _contextDocContent?: any,
  customDocs?: any[]
): string {
  const q = String(query || '').toLowerCase().trim();
  const allDocs = getAllCombinedDocuments(customDocs);
  const customUploadedList = allDocs.filter((d: any) => d.isCustom);

  // 0. Check custom uploaded documents first so newly uploaded SOPs, Policies, Guides, and Station Checklists match immediately
  for (const cDoc of customUploadedList) {
    const codeMatch = q.includes(String(cDoc.code || '').toLowerCase());
    const titleWords = String(cDoc.title || '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3);
    const titleHit = titleWords.some((w: string) => q.includes(w));
    const tagHit = (cDoc.tags || []).some(
      (t: any) => String(t).length > 2 && q.includes(String(t).toLowerCase())
    );
    if (codeMatch || titleHit || tagHit) {
      return formatDocumentDirectAnswer(cDoc);
    }
  }

  // 1. Greeting / Identity check
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|who are you)/i.test(q)) {
    const customNote =
      customUploadedList.length > 0
        ? ` plus **${customUploadedList.length} Master-Uploaded custom document(s)** (${customUploadedList
            .map((d: any) => d.code)
            .join(', ')})`
        : '';
    return `Hello! I am your **L&D Virtual Support** for **Jiangnan Hotpot / Imperial Kitchen Group Inc.**

I cover all **${allDocs.length} official documents** (Station Checklist **JNLD-CHK-FOH-REC-001 Receptionist Task Checklist**, RA 10611 Food Safety Act of 2013, 21 Company Policies IKQAP#001–#021, and 12 SOPs IKQA-SOP#001–#012${customNote}). How can I help you today?`;
  }

  // 1b. Receptionist Station Checklist triggers (JNLD-CHK-FOH-REC-001)
  if (
    q.includes('receptionist') ||
    q.includes('jnld-chk-foh-rec-001') ||
    q.includes('rec-001') ||
    q.includes('station checklist') ||
    q.includes('ni hao') ||
    q.includes('899') ||
    q.includes('999') ||
    q.includes('birthday') ||
    q.includes('senior') ||
    q.includes('pwd') ||
    q.includes('mushroom soup') ||
    q.includes('leftover') ||
    q.includes('outside food') ||
    q.includes('waiver') ||
    q.includes('bill out')
  ) {
    return `### **Receptionist Task Checklist (JNLD-CHK-FOH-REC-001, Version 2)**
* **I. Initial Greeting (Task 1.1):** Greet every guest warmly: *"Ni Hao! Welcome to Jiang Nan! Is this your first time dining with us po?"* (Reply *"Welcome back po!"* if returning, or *"Welcome po!"* if first-time).
* **II. Guest Details & Waitlist (Tasks 2.1–2.2):** Confirm guest name, number of diners (pax), and preferred mode of payment (**Cash, Credit Card, Debit Card, or GCash**). Check table availability with the assigned Server. If no table is open, record on the approved waitlist, give estimated waiting time, hand the menu, and monitor waiting guests.
* **III. Service & Menu Introduction (Tasks 3.1–3.5):**
  - **Dine-In Package Rates:** Always lead with the **Hotpot with Grill Package**: **₱899/person on Weekdays (+5% service charge)** and **₱999/person on Weekends (+5% service charge)**.
  - **Hotpot-Only Rate (State ONLY if asked):** Weekdays: Hotpot updated from ₱599 to **₱699**, Grill from ₱300 to **₱200** (Package stays ₱899). Weekends: Hotpot updated from ₱699 to **₱799**, Grill from ₱300 to **₱200** (Package stays ₱999).
  - **Premium Meat Upgrade:** Offer **Premium Meat Selection** at **+₱200 per person**.
  - **Take-Out:** Present Ala Carte Menu, check availability, confirm order, and endorse to Cashier.
  - **Allergens (Task 3.5):** Ask about food allergies/dietary restrictions, consult the **Allergen Guide** (never give unverified info), and **write specific allergen info on the Bill Out form** so it is visible when endorsed to the Server.
* **IV. Promotions & Special Occasions (Tasks 4.1–4.2):**
  - **Birthday Promo:** **Exact Birthday Today** = **4 paying guests + celebrant FREE**; **Within Birth Month** = **5 paying guests + celebrant FREE** (requires valid ID verification & Bill Out endorsement).
  - **Senior Citizen & PWD Discount:** Only the **12% VAT component is deducted** from the total bill because the rate already reflects an unlimited dining promotion (verify valid ID/card & note on Bill Out form).
* **V. Dining & Ordering Information (Tasks 5.1–5.3):**
  - **Soup Selection:** **All soup bases are pork-based EXCEPT Mushroom Soup**. Choose **up to two (2) soup flavors per table**.
  - **Initial Order:** Up to **three (3) plates of meat** for the initial order; reorders anytime via the **Additional Order Form** on the table. **Desserts and beverages are unlimited** and included.
* **VI. Dining Guidelines & Policies (Task 6.1):**
  - **Dining Time & Leftover Policy:** Up to **two (2) hours** dining time; **No Leftover Policy** with a **₱1,000 charge** for excessive leftovers.
  - **Outside Food Policy:** Allowed provided the guest completes the **Updated Outside Food Waiver Form** before bringing it to the table.
* **VII & VIII. Server Turnover & Guest Departure (Tasks 7.1–8.2):**
  - **Server Endorsement Script:** *"Table ___ po, [number] pax, [hotpot/grill], with/without allergen or special request."*
  - **Departure Receipt Verification:** Politely check and stamp the guest's **OR/Invoice (receipt)** before exit (if unavailable, courteously verify with the Cashier first in a non-accusatory manner), then say: *"Xie xie! Thank you for dining with us at Jiang Nan Hotpot! See us again!"*`;
  }

  // 2. Direct document code matching
  const sopCodeMatch = q.match(/sop[#\s\-_]*0*(\d{1,3})/i);
  const policyCodeMatch = q.match(/(?:policy|ikqap)[#\s\-_]*0*(\d{1,3})/i);

  if (sopCodeMatch) {
    const sopNum = parseInt(sopCodeMatch[1], 10);
    const targetCode = `IKQA-SOP#${sopNum.toString().padStart(3, '0')}`;
    const matchedDoc = allDocs.find(
      (d: any) => String(d.code).toUpperCase() === targetCode.toUpperCase()
    );
    if (matchedDoc) {
      return formatDocumentDirectAnswer(matchedDoc);
    }
  }

  if (policyCodeMatch) {
    const policyNum = parseInt(policyCodeMatch[1], 10);
    const targetCode = `IKQAP#${policyNum.toString().padStart(3, '0')}`;
    const matchedDoc = allDocs.find(
      (d: any) => String(d.code).toUpperCase() === targetCode.toUpperCase()
    );
    if (matchedDoc) {
      return formatDocumentDirectAnswer(matchedDoc);
    }
  }

  // 3. Search all documents (including custom uploaded)
  const keywordDoc = allDocs.find((d: any) => {
    const codeStr = String(d.code || '').toLowerCase();
    const titleStr = String(d.title || '').toLowerCase();
    const codeMatch = codeStr.includes(q) || q.includes(codeStr);
    const titleMatch = titleStr.includes(q);
    const tagMatch = (d.tags || []).some((t: any) => q.includes(String(t).toLowerCase()));
    return codeMatch || titleMatch || tagMatch;
  });

  if (keywordDoc) {
    return formatDocumentDirectAnswer(keywordDoc);
  }

  // General Company Fallback
  return `### **Imperial Kitchen Group Compliance Guidance**
Covering all **${allDocs.length} documents** in the L&D Training Hub:
* **Receptionist Station Checklist (JNLD-CHK-FOH-REC-001):** Lead with Hotpot + Grill (**₱899 Weekday / ₱999 Weekend + 5% SC**), Birthday (4 vs 5 paying), Senior 12% VAT deduction, Mushroom Soup non-pork, 2-hr dining limit & ₱1,000 leftover fee.
* **Cold Storage & Danger Zone:** ≤4°C chillers, ≤-18°C freezers; 15-Minute Intake Rule; Never exceed 1 hour in Danger Zone (5°C to 60°C).
* **Sanitation & Hygiene:** 40–60 second handwashing + Restroom Double Wash (IKQA-SOP#001); beard snoods >1.25cm (IKQA-SOP#002); no personal phones on prep line (IKQA-SOP#008).
* **Hardware Matrix:** Red (raw meat), Yellow (poultry), Blue (seafood), Green (produce), Brown (dairy/cooked), White (allergens). Towels: Blue (FOH), Yellow (sink), Green (kitchen), White (wares), Red (restroom).
* **Storage & Inventory:** FEFO strictly overrides FIFO (IKQA-SOP#004); 48-hr near expiry prioritization.`;
}

function formatDocumentDirectAnswer(doc: any): string {
  const takeaways = (doc.keyTakeaways || []).map((t: any) => `* ${t}`).join('\n');
  const rules = (doc.quickRules || [])
    .map((r: any) => `* **[${String(r.type || 'info').toUpperCase()}] ${r.title}:** ${r.rule}`)
    .join('\n');
  const sectionsText = (doc.sections || [])
    .slice(0, 5)
    .map((s: any) => `* **${s.title}:** ${s.content}`)
    .join('\n');
  return `### **${doc.code}: ${doc.title}**${doc.isCustom ? ' *(Master Uploaded)*' : ''}
* **Type:** ${String(doc.type || 'sop').toUpperCase()} | **Category:** ${doc.category} | **Revision:** ${doc.revision}
* **Summary:** ${doc.summary}

#### **Core Requirements & Key Takeaways:**
${takeaways || sectionsText}

${rules ? `#### **Mandatory Control Rules:**\n${rules}\n` : ''}
* **Authorized Signatories:** Prepared by ${doc.signatories?.preparedBy || 'L&D Master Account'}, Approved by ${
    doc.signatories?.approvedBy || 'Jack Julius Tiu (President)'
  }.`;
}

// ============================================================================
// AUTHENTICATION & MASTER ACCOUNT APPROVAL ENDPOINTS
// ============================================================================

// 1. Direct Sign-In (Master Account or Staff Account)
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/Username and Password are required.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const cleanPw = String(password).trim();

  // Check Master Account first
  if (
    (SERVER_MASTER_EMAILS.has(cleanId) || cleanId === 'master' || cleanId === 'ikqa-master') &&
    (cleanPw === MASTER_CREDENTIALS.password || cleanPw === 'IKQA-MASTER')
  ) {
    let masterAcc = portalStore.accounts.find((a: any) => a.role === 'master');
    if (!masterAcc) {
      masterAcc = {
        uid: 'master-admin-001',
        email: MASTER_CREDENTIALS.email,
        password: MASTER_CREDENTIALS.password,
        displayName: MASTER_CREDENTIALS.displayName,
        position: MASTER_CREDENTIALS.position,
        branch: MASTER_CREDENTIALS.branch,
        role: 'master',
        status: 'approved',
        ndaAccepted: true,
        ndaSignature: 'I AGREE',
        ndaAcceptedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: 'master_credentials',
      };
      portalStore.accounts.unshift(masterAcc);
      savePortalStore();
    }
    return res.json({ user: sanitizeAccount(masterAcc) });
  }

  // Check registered staff or master accounts by email, uid, or displayName
  const matched = portalStore.accounts.find(
    (a: any) =>
      String(a.email || '').toLowerCase() === cleanId ||
      String(a.uid || '').toLowerCase() === cleanId ||
      String(a.displayName || '').toLowerCase() === cleanId
  );

  if (!matched || (matched.password && matched.password !== cleanPw)) {
    return res.status(401).json({
      error: 'Invalid credentials. Check your Email/ID and password, or create a new staff account for Master approval.',
    });
  }

  if (isMasterAccountRecord(matched) && (matched.role !== 'master' || matched.status !== 'approved')) {
    matched.role = 'master';
    matched.status = 'approved';
    savePortalStore();
  }

  return res.json({ user: sanitizeAccount(matched) });
});

// 2. Staff Account Registration (Requires Manual "I AGREE" Confidentiality Agreement & Master Approval)
app.post('/api/auth/register', (req, res) => {
  const { uid, email, password, displayName, position, branch, role, ndaSignature, syncOnly } = req.body || {};
  if (!email || !displayName) {
    return res.status(400).json({ error: 'Full Name and Email/Employee ID are required.' });
  }

  const cleanSig = String(ndaSignature || 'I AGREE').trim().toUpperCase();
  if (cleanSig !== 'I AGREE') {
    return res.status(400).json({
      error: 'You must manually type "I AGREE" to accept the Confidentiality Agreement before creating an account.',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const deterministicUid =
    (uid && String(uid).trim()) ||
    `user-${cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 96)}`;

  const existing = portalStore.accounts.find(
    (a: any) => a.email.toLowerCase() === cleanEmail || a.uid === deterministicUid
  );
  if (existing) {
    if (password && String(password).trim()) {
      existing.password = String(password).trim();
    }
    if (isMasterAccountRecord(existing) || role === 'master') {
      existing.role = 'master';
      existing.status = 'approved';
    }
    savePortalStore();
    if (syncOnly) {
      return res.json({ user: sanitizeAccount(existing) });
    }
    return res.status(409).json({
      error: 'An account with this Email / Employee ID already exists. Please sign in instead.',
    });
  }

  const nowIso = new Date().toISOString();
  const candidateAccount = {
    uid: deterministicUid,
    email: cleanEmail,
    password: String(password || 'Staff2026!').trim(),
    displayName: String(displayName).trim().slice(0, 120),
    position: String(position || 'Restaurant Staff').trim().slice(0, 120),
    branch: String(branch || 'Jiangnan Hotpot - SM Mall of Asia').trim().slice(0, 160),
    role: role === 'master' ? 'master' : 'staff',
    status: role === 'master' ? 'approved' : 'pending',
    ndaAccepted: true,
    ndaSignature: 'I AGREE',
    ndaAcceptedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
    authProvider: 'staff_credentials',
  };

  if (isMasterAccountRecord(candidateAccount)) {
    candidateAccount.role = 'master';
    candidateAccount.status = 'approved';
  }

  portalStore.accounts.push(candidateAccount);
  savePortalStore();

  return res.json({ user: sanitizeAccount(candidateAccount) });
});

// 3. Google Sign-In Sync (Automatically recognizes Master email or creates Pending staff account)
app.post('/api/auth/google-sync', (req, res) => {
  const { uid, email, displayName, position, branch } = req.body || {};
  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and email are required for Google sync.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const isMasterCandidate = isMasterAccountRecord({ uid, email: cleanEmail, displayName, position, branch });

  let acc = portalStore.accounts.find(
    (a: any) => a.uid === uid || a.email.toLowerCase() === cleanEmail
  );

  if (!acc) {
    const nowIso = new Date().toISOString();
    acc = {
      uid: String(uid),
      email: cleanEmail,
      displayName: String(displayName || cleanEmail.split('@')[0]).slice(0, 120),
      position: isMasterCandidate
        ? position || MASTER_CREDENTIALS.position
        : String(position || 'Kitchen / Service Staff').slice(0, 120),
      branch: isMasterCandidate
        ? branch || MASTER_CREDENTIALS.branch
        : String(branch || 'Jiangnan Hotpot - SM Mall of Asia').slice(0, 160),
      role: isMasterCandidate ? 'master' : 'staff',
      status: isMasterCandidate ? 'approved' : 'pending',
      ndaAccepted: true,
      ndaSignature: 'I AGREE',
      ndaAcceptedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      authProvider: 'google',
    };
    portalStore.accounts.push(acc);
    savePortalStore();
  } else if ((isMasterCandidate || isMasterAccountRecord(acc)) && (acc.role !== 'master' || acc.status !== 'approved')) {
    acc.role = 'master';
    acc.status = 'approved';
    acc.ndaAccepted = true;
    acc.ndaSignature = 'I AGREE';
    acc.updatedAt = new Date().toISOString();
    savePortalStore();
  }

  return res.json({ user: sanitizeAccount(acc) });
});

// 4. Get Single Account Status (for pending approval polling)
app.get('/api/auth/status/:uid', (req, res) => {
  const { uid } = req.params;
  const emailQuery = String(req.query.email || '').trim().toLowerCase();
  const acc = portalStore.accounts.find(
    (a: any) =>
      a.uid === uid ||
      a.email.toLowerCase() === String(uid).toLowerCase() ||
      (emailQuery && a.email.toLowerCase() === emailQuery)
  );
  if (!acc) {
    return res.status(404).json({ error: 'Account not found' });
  }
  return res.json({ user: sanitizeAccount(acc) });
});

// 5. List All Accounts (For Master Account Dashboard)
app.get('/api/auth/accounts', (_req, res) => {
  return res.json({
    accounts: portalStore.accounts.map(sanitizeAccount),
  });
});

// 6. Master Account Approve / Reject / Update Role & Profile (Name, Position, Branch)
const handleMasterAccountUpdate = (req: express.Request, res: express.Response) => {
  const {
    targetUid,
    targetEmail,
    email,
    password,
    displayName,
    position,
    branch,
    ndaSignature,
    targetUser,
    status,
    role,
  } = req.body || {};
  const cleanEmail = String(targetEmail || email || targetUser?.email || '').trim().toLowerCase();
  let acc = portalStore.accounts.find(
    (a: any) =>
      a.uid === targetUid ||
      (cleanEmail && a.email.toLowerCase() === cleanEmail)
  );

  if (!acc && (cleanEmail || (targetUser && targetUser.email))) {
    const nowIso = new Date().toISOString();
    acc = {
      uid:
        targetUid ||
        targetUser?.uid ||
        `user-${cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, '-')}`,
      email: cleanEmail,
      password: password || targetUser?.password || 'Staff2026!',
      displayName: displayName || targetUser?.displayName || cleanEmail,
      position: position || targetUser?.position || 'Restaurant Staff',
      branch: branch || targetUser?.branch || 'Jiangnan Hotpot - SM Mall of Asia',
      role: role || targetUser?.role || 'staff',
      status: status || targetUser?.status || 'approved',
      ndaAccepted: true,
      ndaSignature: ndaSignature || targetUser?.ndaSignature || 'I AGREE',
      ndaAcceptedAt: targetUser?.ndaAcceptedAt || nowIso,
      createdAt: targetUser?.createdAt || nowIso,
      updatedAt: nowIso,
      authProvider: targetUser?.authProvider || 'staff_credentials',
    };
    portalStore.accounts.push(acc);
  }

  if (!acc) {
    return res.status(404).json({ error: 'Target account not found.' });
  }

  if (typeof password === 'string' && password.trim()) {
    acc.password = password.trim();
  } else if (targetUser?.password && typeof targetUser.password === 'string' && targetUser.password.trim()) {
    acc.password = targetUser.password.trim();
  }
  if (typeof displayName === 'string' && displayName.trim()) {
    acc.displayName = displayName.trim().slice(0, 120);
  }
  if (typeof position === 'string' && position.trim()) {
    acc.position = position.trim().slice(0, 120);
  }
  if (typeof branch === 'string' && branch.trim()) {
    acc.branch = branch.trim().slice(0, 160);
  }
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    acc.status = status;
  }
  if (role && ['master', 'staff'].includes(role)) {
    acc.role = role;
  }
  if (isMasterAccountRecord(acc)) {
    acc.role = 'master';
    acc.status = 'approved';
  }
  acc.updatedAt = new Date().toISOString();

  // Keep any issued certificate for this staff member synced with Master Hub Name/Position/Branch edits
  portalStore.certificates = (portalStore.certificates || []).map((c: any) => {
    if (
      c &&
      String(c.staffEmail || '').toLowerCase() === String(acc.email || '').toLowerCase()
    ) {
      return {
        ...c,
        staffName: acc.displayName,
        staffPosition: acc.position,
        staffBranch: acc.branch,
      };
    }
    return c;
  });

  savePortalStore();

  return res.json({
    user: sanitizeAccount(acc),
    accounts: portalStore.accounts.map(sanitizeAccount),
  });
};

app.post('/api/auth/approve', handleMasterAccountUpdate);
app.post('/api/auth/update-profile', handleMasterAccountUpdate);

// 7. Delete Account (Master Account only)
app.delete('/api/auth/accounts/:uid', (req, res) => {
  const { uid } = req.params;
  portalStore.accounts = portalStore.accounts.filter(
    (a: any) => a.uid !== uid || a.role === 'master'
  );
  savePortalStore();
  return res.json({ accounts: portalStore.accounts.map(sanitizeAccount) });
});

// ============================================================================
// OFFICIAL SINGLE-CERTIFICATE REGISTRY & MASTER HUB VERIFICATION ENDPOINTS
// ============================================================================

app.get('/api/certificates', (_req, res) => {
  return res.json({ certificates: portalStore.certificates || [] });
});

const handleVerifyServerCertificate = (req: express.Request, res: express.Response) => {
  const rawCode = String(req.query.code || req.body?.code || '').trim();
  if (!rawCode) {
    return res.status(400).json({ error: 'Certificate serial code or query is required.' });
  }

  const serialMatch = rawCode.match(/IKG[\s\-_]*LD[\s\-_]*\d{4}[\s\-_]*[A-Z0-9]+/i);
  const cleanQuery = serialMatch
    ? serialMatch[0].replace(/[^a-zA-Z0-9]/g, '').replace(/^IKGLD(\d{4})([A-Z0-9]+)$/i, 'IKG-LD-$1-$2').toUpperCase()
    : rawCode.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const alnumQuery = lowerQuery.replace(/[^a-z0-9]/g, '');

  if (!Array.isArray(portalStore.certificates)) {
    portalStore.certificates = [];
  }

  // 1. Search existing certificates (including all candidate serial codes)
  const matchedCert = portalStore.certificates.find((c: any) => {
    if (!c) return false;
    const candidates = getServerCandidateSerialCodes(c.staffEmail, c.staffName, c.serialCode);
    for (const cand of candidates) {
      const lc = cand.toLowerCase();
      const ac = lc.replace(/[^a-z0-9]/g, '');
      if (lc === lowerQuery) return true;
      if (alnumQuery.length >= 6 && (ac === alnumQuery || ac.endsWith(alnumQuery))) return true;
    }
    const em = String(c.staffEmail || '').toLowerCase();
    const nm = String(c.staffName || '').toLowerCase();
    return em === lowerQuery || nm === lowerQuery;
  });

  if (matchedCert) {
    return res.json({ certificate: matchedCert, certificates: portalStore.certificates });
  }

  // 2. Self-healing: check if the code matches any account's deterministic serial code
  for (const acc of portalStore.accounts || []) {
    if (!acc) continue;
    const candidates = getServerCandidateSerialCodes(acc.email, acc.displayName);
    const hit = candidates.find((cand) => {
      const lc = cand.toLowerCase();
      const ac = lc.replace(/[^a-z0-9]/g, '');
      return (
        lc === lowerQuery ||
        (alnumQuery.length >= 6 && (ac === alnumQuery || ac.endsWith(alnumQuery)))
      );
    });
    if (hit) {
      const canonicalSerial = generateDeterministicCertSerial(acc.email, acc.displayName);
      const newCert = {
        id: toDeterministicCertId(acc.email, acc.displayName),
        serialCode: hit.startsWith('IKG-LD-') ? hit : canonicalSerial,
        staffName: acc.displayName,
        staffEmail: String(acc.email || '').toLowerCase(),
        staffPosition: acc.position || 'Kitchen Shift Lead',
        staffBranch: acc.branch || 'Jiangnan Hotpot - SM Mall of Asia',
        quizTitle: 'Food Safety, SOP & Operational Compliance Competency Assessment',
        score: 10,
        totalQuestions: 10,
        percentage: 100,
        status: 'verified',
        issuedAt: acc.updatedAt || acc.createdAt || new Date().toISOString(),
        verifiedBy: 'Imperial Kitchen Group L&D Team (Master Hub Verified)',
      };
      portalStore.certificates.unshift(newCert);
      savePortalStore();
      return res.json({ certificate: newCert, certificates: portalStore.certificates });
    }
  }

  return res.status(404).json({ error: 'Certificate not found', certificate: null });
};

app.get('/api/certificates/verify', handleVerifyServerCertificate);
app.post('/api/certificates/verify', handleVerifyServerCertificate);

app.post('/api/certificates', (req, res) => {
  const { certificate } = req.body || {};
  if (!certificate || !certificate.serialCode || !certificate.staffName) {
    return res.status(400).json({ error: 'Certificate serialCode and staffName are required.' });
  }

  const cleanEmail = String(certificate.staffEmail || '').trim().toLowerCase();
  const existingIdx = (portalStore.certificates || []).findIndex(
    (c: any) =>
      c.id === certificate.id ||
      (cleanEmail && String(c.staffEmail || '').toLowerCase() === cleanEmail) ||
      String(c.serialCode || '').toUpperCase() === String(certificate.serialCode).toUpperCase()
  );

  if (!Array.isArray(portalStore.certificates)) {
    portalStore.certificates = [];
  }

  if (existingIdx >= 0) {
    portalStore.certificates[existingIdx] = {
      ...portalStore.certificates[existingIdx],
      ...certificate,
    };
  } else {
    portalStore.certificates.unshift(certificate);
  }

  savePortalStore();
  return res.json({
    certificate,
    certificates: portalStore.certificates,
  });
});

app.post('/api/certificates/status', (req, res) => {
  const { id, serialCode, staffEmail, status } = req.body || {};
  if (!status || !['verified', 'revoked'].includes(status)) {
    return res.status(400).json({ error: 'Valid certificate status is required.' });
  }

  const cleanEmail = String(staffEmail || '').trim().toLowerCase();
  const cleanSerial = String(serialCode || '').trim().toUpperCase();

  portalStore.certificates = (portalStore.certificates || []).map((c: any) => {
    if (
      c.id === id ||
      (cleanSerial && String(c.serialCode || '').toUpperCase() === cleanSerial) ||
      (cleanEmail && String(c.staffEmail || '').toLowerCase() === cleanEmail)
    ) {
      return {
        ...c,
        status,
      };
    }
    return c;
  });

  savePortalStore();
  return res.json({ certificates: portalStore.certificates });
});

// ============================================================================
// MASTER ACCOUNT DOCUMENT UPLOAD & AI AUTO-INTEGRATION ENDPOINTS
// ============================================================================

app.get('/api/custom-documents', (_req, res) => {
  return res.json({ documents: portalStore.customDocuments });
});

app.post('/api/custom-documents', (req, res) => {
  const { document } = req.body || {};
  if (!document || !document.code || !document.title) {
    return res.status(400).json({ error: 'Document code and title are required.' });
  }

  const normalizedDoc = {
    ...document,
    id: document.id || `custom-${Date.now()}`,
    isCustom: true,
    uploadedAt: document.uploadedAt || new Date().toISOString(),
  };

  const existingIdx = portalStore.customDocuments.findIndex(
    (d: any) =>
      d.id === normalizedDoc.id ||
      String(d.code).toUpperCase() === String(normalizedDoc.code).toUpperCase()
  );

  if (existingIdx >= 0) {
    portalStore.customDocuments[existingIdx] = normalizedDoc;
  } else {
    portalStore.customDocuments.unshift(normalizedDoc);
  }

  savePortalStore();
  return res.json({
    document: normalizedDoc,
    documents: portalStore.customDocuments,
  });
});

app.delete('/api/custom-documents/:id', (req, res) => {
  const { id } = req.params;
  portalStore.customDocuments = portalStore.customDocuments.filter(
    (d: any) => d.id !== id && String(d.code).toUpperCase() !== String(id).toUpperCase()
  );
  savePortalStore();
  return res.json({ documents: portalStore.customDocuments });
});

// Deterministic local fallback parser if Gemini key is unavailable or times out
function buildDeterministicParsedDocument(
  rawText: any,
  hintType?: any,
  hintCode?: any,
  hintTitle?: any,
  hintCategory?: any
): any {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  const docType = ['policy', 'sop', 'guide', 'checklist'].includes(hintType) ? hintType : 'sop';
  const defaultPrefix =
    docType === 'policy'
      ? 'IKQAP'
      : docType === 'checklist'
      ? 'JNLD-CHK'
      : docType === 'guide'
      ? 'IKQA-GDE'
      : 'IKQA-SOP';
  const randomNum = String(portalStore.customDocuments.length + 13).padStart(3, '0');
  const code = String(hintCode || `${defaultPrefix}#${randomNum}`).toUpperCase();
  const title =
    hintTitle ||
    lines[0]?.replace(/^[#*\-\s]+/, '').slice(0, 120) ||
    'Master Uploaded Operational Standard';
  const category =
    hintCategory || (docType === 'checklist' ? 'Station Checklists' : 'Operations & Maintenance');

  const bulletLines = lines
    .filter((l: string) => /^(\*|\-|\d+\.|•)/.test(l) || l.length > 25)
    .map((l: string) => l.replace(/^(\*|\-|\d+\.|•)\s*/, ''))
    .slice(0, 12);

  const keyTakeaways =
    bulletLines.length >= 3
      ? bulletLines.slice(0, 6)
      : [
          `Strict adherence to ${code} (${title}) is mandatory across all Jiangnan Hotpot branches.`,
          `Supervisors and station leads must verify compliance at shift opening and turnover.`,
          `Any deviation from ${code} must be corrected immediately and logged on the shift checklist.`,
        ];

  const quickRules = keyTakeaways.slice(0, 3).map((t: string, i: number) => ({
    type: i === 0 ? 'critical' : i === 1 ? 'warning' : 'info',
    title: `${code} Control Point #${i + 1}`,
    rule: t,
  }));

  // Group lines into sections
  const sections: any[] = [];
  let currentSecTitle = '1. Standard Procedure & Operational Requirements';
  let currentBullets: string[] = [];

  for (const line of lines.slice(0, 40)) {
    if (/^(section|stage|task|step|i\.|ii\.|iii\.|iv\.|v\.|\d+\.)/i.test(line) && line.length < 90) {
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
      content: currentBullets.join(' ') || String(rawText || '').slice(0, 600),
      bulletPoints: currentBullets.length > 0 ? currentBullets.slice(0, 6) : keyTakeaways,
    });
  }

  // Build Quiz Questions automatically for Training Audit & Games
  const primaryRule = keyTakeaways[0] || `Follow ${title} (${code}) at all times.`;
  const secondaryRule = keyTakeaways[1] || `Verify and document ${code} checks at every shift.`;
  const quizQuestions = [
    {
      question: `According to ${code} (${title}), what is the primary operational requirement?`,
      options: [
        primaryRule,
        'Skip verification during peak dining hours to speed up table turnover',
        'Perform the check only once a month during external audits',
        'Delegate the procedure to uncertified probationary staff without supervision',
      ],
      answerIndex: 0,
      explanation: `Per ${code} (${title}): ${primaryRule}`,
    },
    {
      question: `Under ${code} (${title}), how must staff handle compliance verification and secondary control rules?`,
      options: [
        'Verbal estimation is sufficient without checking the standard',
        secondaryRule,
        'Wait until closing shift to record all checklist items from memory',
        'Only apply the standard on weekends',
      ],
      answerIndex: 1,
      explanation: `Per ${code}: ${secondaryRule}`,
    },
  ];

  // Build Interactive Station Simulation Steps for the Station Checklist Game
  const customSimulationSteps = sections.slice(0, 4).map((sec: any, idx: number) => {
    const rightAction = sec.bulletPoints?.[0] || sec.content.slice(0, 180) || primaryRule;
    return {
      id: `${code.toLowerCase()}-sim-${idx + 1}`,
      stageLabel: `STAGE ${idx + 1} • ${code}`,
      scenarioTitle: sec.title,
      guestAvatar: docType === 'checklist' ? '📋' : '🛡️',
      guestName: `Station Audit Scenario #${idx + 1}`,
      guestContext: `Live shift verification for ${code}: ${title}`,
      guestDialogue: `"We are now executing ${sec.title}. What is the exact standard required by ${code}?"`,
      taskPrompt: `Select the compliant action/script required under ${code} (${sec.title}):`,
      options: [
        {
          id: `opt-${idx}-a`,
          scriptOrAction: rightAction,
          isCorrect: true,
          feedback: `Correct! This matches ${code} (${sec.title}): ${rightAction}`,
        },
        {
          id: `opt-${idx}-b`,
          scriptOrAction:
            'Bypass this step during busy hours and proceed directly to table seating without documentation.',
          isCorrect: false,
          feedback: `Incorrect. ${code} strictly requires: ${rightAction}`,
        },
        {
          id: `opt-${idx}-c`,
          scriptOrAction:
            'Rely on unverified memory without consulting the official checklist or logging the form.',
          isCorrect: false,
          feedback: `Incorrect. Skipping verification violates ${code}.`,
        },
        {
          id: `opt-${idx}-d`,
          scriptOrAction:
            'Defer the requirement to the next shift lead without completing the current station check.',
          isCorrect: false,
          feedback: `Incorrect. Immediate execution is mandatory under ${code}.`,
        },
      ],
      billOutCheck: {
        label: `${code} — Station Verification Log Entry:`,
        correctValue: `Verified & Logged: ${sec.title.slice(0, 55)}`,
        choices: [
          `Verified & Logged: ${sec.title.slice(0, 55)}`,
          'Unverified — Verbal Estimate Only',
          'Skipped During Peak Service',
        ],
      },
    };
  });

  // Build 8-Bit Spot the Hazard Scenarios for the 8-Bit Kitchen Safety Game
  const customHazardSpots = [
    {
      id: `${code.toLowerCase()}-haz-1`,
      hazardTitle: `${code} Violation: Non-Compliance on ${title}`,
      sopViolation: `Station inspection revealed a breach of ${code} (${title}). Specifically, staff failed to follow: ${primaryRule}`,
      correctFixIndex: 0,
      fixOptions: [
        `Immediately enforce ${code}: ${primaryRule.slice(0, 120)}`,
        'Ignore the deviation until the end of the shift',
        'Cover up the station logbook entry without corrective action',
        'Continue service without retraining the station staff',
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
        purpose: 'Uploaded and automatically integrated with AI Virtual Support and Training Games',
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
        .filter((w: string) => w.length > 3)
        .slice(0, 6),
    ],
    isCustom: true,
    uploadedBy: MASTER_CREDENTIALS.displayName,
    uploadedAt: new Date().toISOString(),
  };
}

// AI Smart Document Parser Endpoint (Extracts structured SOP/Policy/Guide/Checklist + Game & Quiz Scenarios)
app.post('/api/documents/ai-parse', async (req, res) => {
  const { rawText, docType = 'sop', code, title, category } = req.body || {};
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'Raw document text or content is required.' });
  }

  const baseParsed = buildDeterministicParsedDocument(rawText, docType, code, title, category);

  try {
    const prompt = `You are the Imperial Kitchen Group Inc. (Jiangnan Hotpot) L&D Curriculum & Compliance Architect.
Convert the following uploaded ${String(docType).toUpperCase()} document content into a structured JSON object so it is automatically integrated into:
1. The Compliance Document Library
2. The L&D Virtual Support AI Knowledge Base
3. The Station Checklist Simulator Game (customSimulationSteps)
4. The 8-Bit Spot the Hazard Game (customHazardSpots)
5. The Staff Assessment Quiz (quizQuestions)

Provided Metadata Hints:
- Document Type: ${docType}
- Suggested Code: ${code || baseParsed.code}
- Suggested Title: ${title || baseParsed.title}
- Suggested Category: ${category || baseParsed.category}

Raw Uploaded Content:
${rawText.slice(0, 12000)}`;

    const response = await getGenAI().models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            quickRules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  rule: { type: Type.STRING },
                },
                required: ['type', 'title', 'rule'],
              },
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  bulletPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'title', 'content'],
              },
            },
            quizQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  answerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'answerIndex', 'explanation'],
              },
            },
            customSimulationSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  stageLabel: { type: Type.STRING },
                  scenarioTitle: { type: Type.STRING },
                  guestAvatar: { type: Type.STRING },
                  guestName: { type: Type.STRING },
                  guestContext: { type: Type.STRING },
                  guestDialogue: { type: Type.STRING },
                  taskPrompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        scriptOrAction: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING },
                      },
                      required: ['id', 'scriptOrAction', 'isCorrect', 'feedback'],
                    },
                  },
                },
                required: [
                  'id',
                  'stageLabel',
                  'scenarioTitle',
                  'guestAvatar',
                  'guestName',
                  'guestContext',
                  'guestDialogue',
                  'taskPrompt',
                  'options',
                ],
              },
            },
            customHazardSpots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  hazardTitle: { type: Type.STRING },
                  sopViolation: { type: Type.STRING },
                  correctFixIndex: { type: Type.INTEGER },
                  fixOptions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'hazardTitle', 'sopViolation', 'correctFixIndex', 'fixOptions'],
              },
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['code', 'title', 'summary', 'keyTakeaways', 'sections', 'quizQuestions'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const mergedDoc = {
      ...baseParsed,
      code: String(code || parsedJson.code || baseParsed.code).toUpperCase(),
      title: title || parsedJson.title || baseParsed.title,
      summary: parsedJson.summary || baseParsed.summary,
      keyTakeaways:
        Array.isArray(parsedJson.keyTakeaways) && parsedJson.keyTakeaways.length > 0
          ? parsedJson.keyTakeaways
          : baseParsed.keyTakeaways,
      quickRules:
        Array.isArray(parsedJson.quickRules) && parsedJson.quickRules.length > 0
          ? parsedJson.quickRules.map((r: any) => ({
              type: ['critical', 'warning', 'info'].includes(r.type) ? r.type : 'critical',
              title: r.title,
              rule: r.rule,
            }))
          : baseParsed.quickRules,
      sections:
        Array.isArray(parsedJson.sections) && parsedJson.sections.length > 0
          ? parsedJson.sections
          : baseParsed.sections,
      quizQuestions:
        Array.isArray(parsedJson.quizQuestions) && parsedJson.quizQuestions.length > 0
          ? parsedJson.quizQuestions
          : baseParsed.quizQuestions,
      customSimulationSteps:
        Array.isArray(parsedJson.customSimulationSteps) && parsedJson.customSimulationSteps.length > 0
          ? parsedJson.customSimulationSteps
          : baseParsed.customSimulationSteps,
      customHazardSpots:
        Array.isArray(parsedJson.customHazardSpots) && parsedJson.customHazardSpots.length > 0
          ? parsedJson.customHazardSpots
          : baseParsed.customHazardSpots,
      tags:
        Array.isArray(parsedJson.tags) && parsedJson.tags.length > 0
          ? parsedJson.tags
          : baseParsed.tags,
    };

    return res.json({ document: mergedDoc, aiStructured: true });
  } catch (err: any) {
    console.warn('Gemini document parse fallback triggered:', err?.message || err);
    return res.json({ document: baseParsed, aiStructured: false });
  }
});

// ============================================================================
// GEMINI TTS & AI VIRTUAL SUPPORT ENDPOINTS (DYNAMICALLY GROUNDED WITH UPLOADS)
// ============================================================================

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore', style } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const trimmedText = text.trim().slice(0, 2500);

    const response = await getGenAI().models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: style || 'Clear, professional, and reassuring food safety compliance auditor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'].includes(voice) ? voice : 'Kore',
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio data received from Gemini TTS model');
    }

    return res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate speech with Gemini TTS',
    });
  }
});

// MULTI-TURN STREAMING CHATBOT ENDPOINT (Includes all Master-uploaded SOPs, Policies, Guides & Checklists)
app.post('/api/chat/stream', async (req, res) => {
  const {
    message,
    history = [],
    speedMode = 'fast',
    contextDocTitle,
    contextDocContent,
    customDocuments = [],
  } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  let selectedModel = 'gemini-3.1-flash-lite';
  if (speedMode === 'standard') {
    selectedModel = 'gemini-3.8-flash';
  } else if (speedMode === 'complex') {
    selectedModel = 'gemini-4-argon';
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const allDocs = getAllCombinedDocuments(customDocuments);
  const dynamicGroundingBrief = buildDocumentsGroundingBrief(allDocs);

  const systemInstruction = `You are the Imperial Kitchen Group Inc. (Jiangnan Hotpot) L&D Virtual Support.
CRITICAL IDENTITY RULE: Always introduce and refer to yourself strictly as "L&D Virtual Support" (e.g., "Hello! I am your L&D Virtual Support").
Provide lightning-fast, practical, and legally compliant answers to kitchen, warehouse, and Front-of-House (FOH) service staff.
Your knowledge base covers ALL ${allDocs.length} official and Master-uploaded company documents in file (including Station Checklists, RA 10611, Company Policies, SOPs, and any newly uploaded Master Account SOPs, Policies, Guides, and Station Checklists).

Official Company Knowledge Base (All ${allDocs.length} Documents):
${dynamicGroundingBrief}

${contextDocTitle ? `Current Document In Focus: ${contextDocTitle}` : ''}
${contextDocContent ? `Document Details:\n${contextDocContent.slice(0, 4000)}` : ''}

Instructions:
1. Always identify yourself as "L&D Virtual Support" when greeting or asked who you are.
2. Provide a direct, actionable answer with clean markdown bullet points and bold highlights.
3. Keep responses fast, concise, and operational for busy kitchen, warehouse, and FOH staff.
4. Highlight critical control numbers, scripts, and checklist rules.
5. Always cite the exact document code (including any Master-uploaded document codes).
6. Maintain multi-turn conversational context with the user.`;

  try {
    const formattedHistory = (Array.isArray(history) ? history : []).map((h: any) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof h.text === 'string' ? h.text : String(h.text || '') }],
    }));

    const chat = getGenAI().chats.create({
      model: selectedModel,
      config: {
        systemInstruction,
      },
      history: formattedHistory,
    });

    const stream = await chat.sendMessageStream({
      message,
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    return res.end();
  } catch (error: any) {
    console.warn(`Chat streaming failed with ${selectedModel}, falling back:`, error?.message || error);
    const fallbackText = getRuleFallbackAnswer(message, contextDocTitle, contextDocContent, customDocuments);
    res.write(`data: ${JSON.stringify({ text: fallbackText, isFallback: true })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }
});

// Single-turn / Non-streaming L&D Virtual Support Q&A
app.post('/api/compliance-assistant', async (req, res) => {
  const {
    question,
    speedMode = 'fast',
    contextDocTitle,
    contextDocContent,
    customDocuments = [],
  } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  let selectedModel = 'gemini-3.1-flash-lite';
  if (speedMode === 'standard') {
    selectedModel = 'gemini-3.8-flash';
  } else if (speedMode === 'complex') {
    selectedModel = 'gemini-4-argon';
  }

  const allDocs = getAllCombinedDocuments(customDocuments);
  const dynamicGroundingBrief = buildDocumentsGroundingBrief(allDocs);

  try {
    const prompt = `You are the Imperial Kitchen Group Inc. (Jiangnan Hotpot) L&D Virtual Support.
CRITICAL IDENTITY RULE: Always introduce and refer to yourself strictly as "L&D Virtual Support".
Assist restaurant, kitchen, warehouse, and service staff with fast, accurate, and actionable compliance guidance.
Base your answer on the complete database of ${allDocs.length} documents (including Master-uploaded SOPs, Policies, Guides, and Station Checklists).

Official Company Knowledge Base (All ${allDocs.length} Documents):
${dynamicGroundingBrief}

${contextDocTitle ? `Current Document Being Viewed: ${contextDocTitle}` : ''}
${contextDocContent ? `Document Excerpt/Context:\n${contextDocContent.slice(0, 4000)}` : ''}

Staff Query:
${question}

Instructions:
1. Always identify yourself as "L&D Virtual Support" when greeting or asked who you are.
2. Provide a direct, practical, and clear response with markdown formatting (bullet points, bold highlights).
3. Cite the exact document code.`;

    const response = await getGenAI().models.generateContent({
      model: selectedModel,
      contents: prompt,
    });

    const answer =
      response.text ||
      getRuleFallbackAnswer(question, contextDocTitle, contextDocContent, customDocuments);
    return res.json({ answer, modelUsed: selectedModel });
  } catch (error: any) {
    console.warn('Gemini compliance call fallback triggered:', error?.message || error);
    const fallbackAnswer = getRuleFallbackAnswer(
      question,
      contextDocTitle,
      contextDocContent,
      customDocuments
    );
    return res.json({
      answer: fallbackAnswer,
      isFallback: true,
      modelUsed: 'local-knowledge-base',
    });
  }
});

// Serve Vite in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, 'dist');
  const publicPath = path.join(__dirname, 'public');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  app.get('*', (_req, res) => {
    const distIndex = path.join(distPath, 'index.html');
    if (fs.existsSync(distIndex)) {
      res.sendFile(distIndex);
    } else {
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Food Safety Compliance app listening on http://0.0.0.0:${PORT}`);
});
