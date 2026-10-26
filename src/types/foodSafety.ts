export type DocumentType = 'policy' | 'sop' | 'guide' | 'checklist';

export type DepartmentCategory =
  | 'All'
  | 'Station Checklists'
  | 'Corporate & Quality'
  | 'Temperature & Cold Chain'
  | 'Allergens & Health'
  | 'Sanitation & Pest'
  | 'Receiving & Storage'
  | 'Operations & Maintenance'
  | 'Uniform & Visitor';

export interface PolicySection {
  id: string;
  title: string;
  heading?: string;
  content: string;
  bulletPoints?: string[];
  items?: string[];
  subsections?: {
    id: string;
    title: string;
    content: string;
    bulletPoints?: string[];
  }[];
}

export interface PolicyTable {
  title: string;
  headers: string[];
  rows: (string | { color?: string; text: string; bg?: string })[][];
}

export interface PolicySignatories {
  preparedBy: string;
  reviewedBy: string[];
  approvedBy: string;
}

export interface ChangeHistoryItem {
  rev: number;
  date: string;
  author: string;
  purpose: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  correctAnswer?: number;
  explanation: string;
}

export interface QuickRule {
  title: string;
  rule: string;
  type: 'critical' | 'warning' | 'info';
}

export interface CustomSimulationStep {
  id: string;
  stageLabel: string;
  scenarioTitle: string;
  guestAvatar: string;
  guestName: string;
  guestContext: string;
  guestDialogue: string;
  taskPrompt: string;
  options: {
    id: string;
    scriptOrAction: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  billOutCheck?: {
    label: string;
    correctValue: string;
    choices: string[];
  };
}

export interface CustomHazardSpot {
  id: string;
  hazardTitle: string;
  sopViolation: string;
  correctFixIndex: number;
  fixOptions: string[];
}

export interface FoodSafetyDoc {
  id: string;
  code: string; // e.g. "IKQAP#001" or "IKQA-SOP#010"
  title: string;
  type: DocumentType;
  category: DepartmentCategory;
  revision: number;
  effectiveDate: string;
  pdfUrl: string; // e.g. "/assets/aistudio/..."
  summary: string;
  keyTakeaways: string[];
  quickRules?: QuickRule[];
  tables?: PolicyTable[];
  sections: PolicySection[];
  signatories: PolicySignatories;
  changeHistory: ChangeHistoryItem[];
  quizQuestions?: QuizQuestion[];
  customSimulationSteps?: CustomSimulationStep[];
  customHazardSpots?: CustomHazardSpot[];
  tags: string[];
  isCustom?: boolean;
  uploadedBy?: string;
  uploadedAt?: string;
}

export type AccountRole = 'master' | 'staff';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface PortalUser {
  uid: string;
  email: string;
  displayName: string;
  position: string;
  branch: string;
  role: AccountRole;
  status: AccountStatus;
  ndaAccepted?: boolean;
  ndaSignature?: string;
  ndaAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  authProvider?: 'master_credentials' | 'staff_credentials' | 'google';
}

export interface ComplianceStats {
  totalDocs: number;
  policiesCount: number;
  sopsCount: number;
  guidesCount: number;
  readCount: number;
  bookmarkedCount: number;
}
