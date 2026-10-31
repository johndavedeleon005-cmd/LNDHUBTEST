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

export type AccountRole = 'master' | 'it' | 'staff';
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
  authProvider?: 'master_credentials' | 'it_credentials' | 'staff_credentials' | 'google';
}

export interface ItFeatureFlags {
  enableQuickSearch: boolean;
  enableQuickReferenceTab: boolean;
  enableTrainingGamesTab: boolean;
  enableReceptionistSimulator: boolean;
  enableHazardArcadeGame: boolean;
  enableAudioTtsTab: boolean;
  enableTrainingQuizTab: boolean;
  enableAiAssistant: boolean;
  enableBookmarks: boolean;
  enableConfidentialityGatePopup: boolean;
  enablePhoneFrameToggle: boolean;
}

export interface CustomAppFeature {
  id: string;
  title: string;
  description: string;
  badge: string;
  category:
    | 'Operations'
    | 'Training'
    | 'Compliance'
    | 'Announcement'
    | 'IT Support'
    | 'operations'
    | 'it_support'
    | 'announcement'
    | 'training_tool';
  enabled: boolean;
  actionLabel?: string;
  targetTab?:
    | 'browse'
    | 'library'
    | 'quickref'
    | 'game'
    | 'audio'
    | 'quiz'
    | 'audit'
    | 'assistant';
  createdAt: string;
}

export interface ItPortalConfig {
  branches: string[];
  positions: string[];
  /** Optional map of branchName -> allowed positions (if empty or omitted for a branch, all positions in `positions` are shown) */
  branchPositionsMap?: Record<string, string[]>;
  featureFlags: ItFeatureFlags;
  customFeatures: CustomAppFeature[];
  maintenanceBanner?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ComplianceStats {
  totalDocs: number;
  policiesCount: number;
  sopsCount: number;
  guidesCount: number;
  readCount: number;
  bookmarkedCount: number;
}

export type CertificateVerificationStatus = 'verified' | 'revoked';

export interface TrainingCertificateRecord {
  id: string;
  serialCode: string;
  staffName: string;
  staffEmail: string;
  staffPosition: string;
  staffBranch: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  status: CertificateVerificationStatus;
  issuedAt: string;
  verifiedBy: string;
}

