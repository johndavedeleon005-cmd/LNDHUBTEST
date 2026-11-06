import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';

export type GameShellState =
  | 'TITLE_MENU'
  | 'WHEEL_STAGE'
  | 'QUIZ_POPUP'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER';

export interface WheelCategorySlice {
  id: string;
  label: string;
  shortTitle: string;
  subCode: string;
  color: string;
  darkColor: string;
  accentColor: string;
  multiplier: number;
  matchCategories: string[];
}

const WHEEL_SLICES: WheelCategorySlice[] = [
  {
    id: 'cat-temp',
    label: 'Temperature & Cold Chain',
    shortTitle: 'Temp & Cold Chain',
    subCode: 'IKQAP#001 · #003 · SOP#006',
    color: '#0284c7',
    darkColor: '#082f49',
    accentColor: '#38bdf8',
    multiplier: 1,
    matchCategories: ['Temperature & Cold Chain'],
  },
  {
    id: 'cat-colors',
    label: 'Color Matrices & Slicer',
    shortTitle: 'Boards, Towels & Slicer',
    subCode: 'SOP#010 · #012 · IKQAP#015',
    color: '#d97706',
    darkColor: '#451a03',
    accentColor: '#fbbf24',
    multiplier: 1,
    matchCategories: ['Operations & Maintenance'],
  },
  {
    id: 'cat-hygiene',
    label: 'Handwash & Staff Hygiene',
    shortTitle: '6-Step Wash & Hygiene',
    subCode: 'SOP#001 · #002 · #008',
    color: '#059669',
    darkColor: '#064e3b',
    accentColor: '#34d399',
    multiplier: 1,
    matchCategories: ['Uniform & Visitor'],
  },
  {
    id: 'cat-allergens',
    label: 'Big 9 Allergens & Complaints',
    shortTitle: 'Allergens & Audits',
    subCode: 'IKQAP#002 · #004 · GDE#001',
    color: '#e11d48',
    darkColor: '#4c0519',
    accentColor: '#fb7185',
    multiplier: 1,
    matchCategories: ['Allergens & Health'],
  },
  {
    id: 'cat-checklists',
    label: 'FOH & Station Checklists',
    shortTitle: 'Station Checklists',
    subCode: 'JNLD-CHK-FOH-REC-001',
    color: '#7c3aed',
    darkColor: '#2e1065',
    accentColor: '#a78bfa',
    multiplier: 1,
    matchCategories: ['Station Checklists'],
  },
  {
    id: 'cat-sanitation',
    label: 'Sanitation, Waste & Pest IPM',
    shortTitle: 'Sanitation & Pest IPM',
    subCode: 'SOP#003 · #009 · IKQAP#013',
    color: '#0d9488',
    darkColor: '#134e4a',
    accentColor: '#2dd4bf',
    multiplier: 1,
    matchCategories: ['Sanitation & Pest'],
  },
  {
    id: 'cat-receiving',
    label: 'Receiving, 5S Chiller & FEFO',
    shortTitle: '5S Storage & FEFO',
    subCode: 'IKQAP#011 · SOP#004 · #005',
    color: '#ea580c',
    darkColor: '#431407',
    accentColor: '#fb923c',
    multiplier: 1,
    matchCategories: ['Receiving & Storage', 'Corporate & Quality'],
  },
  {
    id: 'cat-jackpot',
    label: '2X JACKPOT: All-Data CCP Blitz',
    shortTitle: '2X All-Data Blitz',
    subCode: 'ALL 35+ SOPs & POLICIES',
    color: '#ca8a04',
    darkColor: '#422006',
    accentColor: '#fde047',
    multiplier: 2,
    matchCategories: ['ALL'],
  },
];

export interface QuizQuestionItem {
  id: string;
  sliceId: string;
  categoryLabel: string;
  docId?: string;
  docCode: string;
  docTitle: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

// High-yield Quick Reference & Floor Cheat-Sheet questions to supplement every document's quizQuestions
const SUPPLEMENTAL_FLOOR_QUESTIONS: QuizQuestionItem[] = [
  {
    id: 'supp-boards-1',
    sliceId: 'cat-colors',
    categoryLabel: 'Color Matrices & Slicer',
    docCode: 'IKQA-SOP#010',
    docTitle: 'Color-Coded Cutting Board Matrix',
    question: 'Which cutting board color is strictly designated for slicing Raw Seafood (fish, shrimp, squid) to prevent cross-contamination?',
    options: [
      'Red Cutting Board',
      'Blue Cutting Board',
      'Yellow Cutting Board',
      'White Cutting Board',
    ],
    answerIndex: 1,
    explanation: 'Under IKQA-SOP#010, Blue is for Raw Seafood, Red for Raw Meat (Beef/Pork/Lamb), Yellow for Raw Poultry, Green for Washed Vegetables/Fruits, and White for Ready-to-Eat (RTE) & Dairy.',
  },
  {
    id: 'supp-plates-1',
    sliceId: 'cat-colors',
    categoryLabel: 'Color Matrices & Slicer',
    docCode: 'IKQA-SOP#010',
    docTitle: 'Jiangnan Hotpot Raw Meat Plate Color Coding',
    question: 'At Jiangnan Hotpot, which plate color combination is used exclusively for serving sliced US Beef vs. Pork Belly?',
    options: [
      'Red/Yellow plate for US Beef; Brown/Green plate for Pork Belly',
      'White plate for US Beef; Blue plate for Pork Belly',
      'Green plate for US Beef; Red plate for Pork Belly',
      'Black plate for all raw meats',
    ],
    answerIndex: 0,
    explanation: 'IKQA-SOP#010 mandates Red/Yellow plates for US Beef, Brown/Green plates for Pork Belly, and Orange plates for Premium Angus Beef.',
  },
  {
    id: 'supp-towels-1',
    sliceId: 'cat-colors',
    categoryLabel: 'Color Matrices & Slicer',
    docCode: 'IKQAP#015',
    docTitle: 'Color-Coded Wiping Towel Matrix',
    question: 'Which color wiping towel must be used to sanitize FOH guest dining tables and induction stove glass tops?',
    options: [
      'Red Towel (Restroom & Toilet Surfaces)',
      'Yellow Towel (BOH Kitchen Prep Counters)',
      'Blue Towel (FOH Dining Tables & Induction Stoves)',
      'Green Towel (Bar & Beverage Station)',
    ],
    answerIndex: 2,
    explanation: 'IKQAP#015 assigns Blue towels to FOH Dining Tables & Induction Stoves, Yellow to BOH Kitchen Prep, Green to Bar/Beverage, and Red strictly to Restrooms.',
  },
  {
    id: 'supp-slicer-1',
    sliceId: 'cat-colors',
    categoryLabel: 'Color Matrices & Slicer',
    docCode: 'IKQA-SOP#012',
    docTitle: 'Luncheon Meat Wire Slicer Standard',
    question: 'What is the mandatory portion weight, slice count, and PPE requirement when operating the Luncheon Meat Wire Slicer?',
    options: [
      '100g ± 10g (5 slices) with latex gloves only',
      '150g ± 5g (8 even slices) while wearing a cut-resistant glove on the non-dominant hand',
      '200g ± 15g (10 slices) with bare hands',
      '250g exact weight with cotton gloves',
    ],
    answerIndex: 1,
    explanation: 'IKQA-SOP#012 mandates checking wire tension before slicing, wearing a cut-resistant glove, and portioning luncheon meat to 150g ± 5g (8 uniform slices).',
  },
  {
    id: 'supp-retention-1',
    sliceId: 'cat-temp',
    categoryLabel: 'Temperature & Cold Chain',
    docCode: 'IKQA-SOP#011',
    docTitle: 'Food Retention Sample Collection',
    question: 'What is the required minimum weight and refrigerated holding duration for official Food Retention Samples?',
    options: [
      'At least 50g held for 12 hours in the freezer',
      'At least 100g collected with an alcohol-sanitized spoon and stored at 0°C–4°C for 48 hours',
      '25g held at room temperature for 24 hours',
      '500g held for 7 days',
    ],
    answerIndex: 1,
    explanation: 'IKQA-SOP#011 requires collecting at least 100g of each high-risk batch in a labeled sterile container and holding it at 0°C to 4°C for 48 hours.',
  },
  {
    id: 'supp-5s-chiller-1',
    sliceId: 'cat-receiving',
    categoryLabel: 'Receiving, 5S Chiller & FEFO',
    docCode: 'IKQAP#011',
    docTitle: '5S Walk-In Chiller Top-to-Bottom Storage Hierarchy',
    question: 'In the 5S Walk-In Chiller rack hierarchy, where must Raw Poultry (chicken/duck) always be stored?',
    options: [
      'Top Shelf (Shelf 1) next to Ready-to-Eat foods',
      'Second Shelf (Shelf 2) above Whole Seafood',
      'Middle Shelf (Shelf 3) above Ground Meat',
      'Bottom Shelf (Shelf 5) in leak-proof trays so juices can never drip onto other foods',
    ],
    answerIndex: 3,
    explanation: 'Top-to-Bottom Chiller Hierarchy (IKQAP#011): 1. Ready-to-Eat/Cooked (Top) -> 2. Whole Seafood -> 3. Whole Cuts of Beef/Pork -> 4. Ground Meats -> 5. Raw Poultry (Bottom Shelf).',
  },
  {
    id: 'supp-fefo-1',
    sliceId: 'cat-receiving',
    categoryLabel: 'Receiving, 5S Chiller & FEFO',
    docCode: 'IKQA-SOP#004',
    docTitle: 'FIFO & FEFO Inventory Rotation Precedence',
    question: 'If a newly delivered batch of hotpot fish tofu has an EARLIER expiration date than a batch delivered last week, which rule governs?',
    options: [
      'FIFO strictly applies; always use last week’s delivery first',
      'FEFO (First-Expired, First-Out) overrides FIFO; place the earlier-expiring batch in front to be used first',
      'Mix both batches together in the samecambro container',
      'Freeze both batches indefinitely',
    ],
    answerIndex: 1,
    explanation: 'Under IKQA-SOP#004, FEFO (First-Expired, First-Out) always takes precedence over FIFO for any product with a printed expiration or use-by date.',
  },
  {
    id: 'supp-foh-rec-1',
    sliceId: 'cat-checklists',
    categoryLabel: 'FOH & Station Checklists',
    docCode: 'JNLD-CHK-FOH-REC-001',
    docTitle: 'FOH Receptionist Station Checklist (Version 1)',
    question: 'When endorsing a newly seated table to the Server using the Bill Out form, what critical details must the Receptionist verify and write down?',
    options: [
      'Only the table number',
      'Table number, pax count, package tier, max 2 soup bases (Mushroom for non-pork), and any Big 9 food allergies or birthday/senior notes',
      'Only the guest’s first name',
      'The closing time of the mall',
    ],
    answerIndex: 1,
    explanation: 'Per JNLD-CHK-FOH-REC-001, the Receptionist must record pax count, package tier, soup base selection (max 2 flavors), and any food allergies on the Bill Out form and verbally endorse them to the assigned Server.',
  },
  {
    id: 'supp-waste-1',
    sliceId: 'cat-sanitation',
    categoryLabel: 'Sanitation, Waste & Pest IPM',
    docCode: 'IKQA-SOP#009',
    docTitle: 'Waste Management & Reject Can Crushing',
    question: 'Why does IKQA-SOP#009 require staff to physically crush or deform rejected/expired cans before placing them in the disposal bin?',
    options: [
      'To make them heavier for weighing',
      'To permanently prevent accidental re-entry or unauthorized reuse in the kitchen production line',
      'To sharpen the can opener blade',
      'It is optional and only done once a month',
    ],
    answerIndex: 1,
    explanation: 'IKQA-SOP#009 mandates crushing or puncturing rejected cans and spoiling condemned food so it can never be accidentally returned to active inventory.',
  },
  {
    id: 'supp-calibration-1',
    sliceId: 'cat-temp',
    categoryLabel: 'Temperature & Cold Chain',
    docCode: 'IKQAP#020',
    docTitle: 'Probe Thermometer Ice-Point Calibration',
    question: 'What is the required temperature reading and acceptable tolerance when calibrating a food probe thermometer in a 50/50 crushed ice and potable water slurry?',
    options: [
      '0.0°C (±0.5°C tolerance, i.e., -0.5°C to +0.5°C)',
      '4.0°C (±2.0°C tolerance)',
      '-18.0°C in the deep freezer',
      '10.0°C under running tap water',
    ],
    answerIndex: 0,
    explanation: 'Under IKQAP#020, the Ice-Point Method requires submerging the probe stem in a 50/50 crushed ice-water slurry and verifying it reads 0.0°C within ±0.5°C.',
  },
];

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

// Procedural Web Audio Synthesizer for Wheel Peg Ticks, Countdown Beeps, and Quiz Chimes
class QuizShowAudioEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playWheelPegTick(speedRatio: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const freq = 420 + Math.min(1, speedRatio) * 520;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playCategoryLocked(isJackpot: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isJackpot
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  playCountdownTick(urgent: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(urgent ? 880 : 587.33, now);
    gain.gain.setValueAtTime(urgent ? 0.1 : 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playCorrectAnswer(streak: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const base = [523.25, 659.25, 783.99, Math.min(1318.5, 1046.5 + streak * 40)];
    base.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  playWrongOrTimeout() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.32);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

interface FullDataComplianceGameProps {
  documents: FoodSafetyDoc[];
  staffName: string;
  staffPosition: string;
  staffBranch: string;
  onOpenDoc?: (doc: FoodSafetyDoc) => void;
  onExitShell?: () => void;
  isFullViewport?: boolean;
  onToggleFullViewport?: (full: boolean) => void;
}

const QUESTION_TIME_LIMIT = 15.0; // 15-second strict countdown per question
const TOTAL_ROUND_QUESTIONS = 10;

export const FullDataComplianceGame: React.FC<FullDataComplianceGameProps> = ({
  documents,
  staffName,
  staffPosition,
  staffBranch,
  onOpenDoc,
  onExitShell,
  isFullViewport = true,
  onToggleFullViewport,
}) => {
  const sfxRef = useRef<QuizShowAudioEngine>(new QuizShowAudioEngine());

  // Build 100% Data-Driven Question Bank from ALL `documents` + Quick Reference rules
  const questionBank = useMemo<QuizQuestionItem[]>(() => {
    const bank: QuizQuestionItem[] = [...SUPPLEMENTAL_FLOOR_QUESTIONS];

    documents.forEach((doc, docIdx) => {
      // Determine which wheel slice this document belongs to
      const matchedSlice =
        WHEEL_SLICES.find(
          (s) => s.id !== 'cat-jackpot' && s.matchCategories.includes(doc.category)
        ) || WHEEL_SLICES[docIdx % (WHEEL_SLICES.length - 1)];

      // 1. Add all explicit quizQuestions from the document
      if (Array.isArray(doc.quizQuestions) && doc.quizQuestions.length > 0) {
        doc.quizQuestions.forEach((qq, qIdx) => {
          bank.push({
            id: `doc-q-${doc.id}-${qIdx}`,
            sliceId: matchedSlice.id,
            categoryLabel: matchedSlice.label,
            docId: doc.id,
            docCode: doc.code,
            docTitle: doc.title,
            question: qq.question,
            options: qq.options,
            answerIndex: qq.answerIndex,
            explanation: qq.explanation,
          });
        });
      }

      // 2. Also synthesize a question from quickRules[0] if the document had no quizQuestions
      if ((!doc.quizQuestions || doc.quizQuestions.length === 0) && doc.quickRules?.[0]) {
        const qr = doc.quickRules[0];
        bank.push({
          id: `doc-qr-${doc.id}`,
          sliceId: matchedSlice.id,
          categoryLabel: matchedSlice.label,
          docId: doc.id,
          docCode: doc.code,
          docTitle: doc.title,
          question: `Under ${doc.code} (${doc.title}), what is the mandatory requirement for "${qr.title}"?`,
          options: [
            qr.rule,
            'This step is optional during peak dining hours.',
            'Only verbal confirmation is required without logging.',
            'Defer compliance until the end-of-month inventory count.',
          ],
          answerIndex: 0,
          explanation: `${doc.code} (${doc.title}): ${qr.rule}`,
        });
      }
    });

    return bank;
  }, [documents]);

  const [shellState, setShellState] = useState<GameShellState>('TITLE_MENU');
  const shellStateRef = useRef<GameShellState>(shellState);
  shellStateRef.current = shellState;

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [codexOpen, setCodexOpen] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Game Session State
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('ikqa_spinquiz_highscore') || 0);
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [questionNumber, setQuestionNumber] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [masteredCodes, setMasteredCodes] = useState<string[]>([]);

  // Active Wheel Landed Category & 15s Pop-Up Quiz State
  const [landedSlice, setLandedSlice] = useState<WheelCategorySlice | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestionItem | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerOutcome, setAnswerOutcome] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [lastEarnedPoints, setLastEarnedPoints] = useState<number>(0);

  const usedQuestionIdsRef = useRef<Set<string>>(new Set());
  const lastWholeSecondRef = useRef<number>(15);

  // Canvas & 60fps Wheel Physics Simulation Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelSimRef = useRef({
    angle: 0, // current wheel angle in radians
    angularVelocity: 0.28, // slow ambient rotation on title screen, high when spinning
    isSpinning: false,
    flapperAngle: 0, // top pointer deflection angle
    flapperVelocity: 0,
    lastSliceIdx: -1,
    shakeIntensity: 0,
    hitstopTimer: 0,
    highlightedSliceIdx: -1,
    particles: Array.from({ length: 140 }, (): Particle => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 4,
      color: '#fbbf24',
    })),
  });

  const spawnCanvasBurst = useCallback(
    (x: number, y: number, color: string, count: number, speedScale = 1) => {
      const pool = wheelSimRef.current.particles;
      let spawned = 0;
      for (let i = 0; i < pool.length && spawned < count; i++) {
        if (!pool[i].active) {
          const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.4;
          const speed = (80 + Math.random() * 190) * speedScale;
          pool[i].active = true;
          pool[i].x = x;
          pool[i].y = y;
          pool[i].vx = Math.cos(angle) * speed;
          pool[i].vy = Math.sin(angle) * speed;
          pool[i].life = 0;
          pool[i].maxLife = 0.45 + Math.random() * 0.45;
          pool[i].size = 3.5 + Math.random() * 4.5;
          pool[i].color = color;
          spawned++;
        }
      }
    },
    []
  );

  // Select a non-repeating question matching the landed wheel slice
  const pickQuestionForSlice = useCallback(
    (slice: WheelCategorySlice): QuizQuestionItem => {
      const candidates =
        slice.id === 'cat-jackpot'
          ? questionBank
          : questionBank.filter((q) => q.sliceId === slice.id);
      const pool = candidates.length > 0 ? candidates : questionBank;

      const unused = pool.filter((q) => !usedQuestionIdsRef.current.has(q.id));
      const finalPool = unused.length > 0 ? unused : pool;
      const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
      usedQuestionIdsRef.current.add(picked.id);
      return picked;
    },
    [questionBank]
  );

  // Trigger a Physics Spin of the Category Wheel
  const triggerWheelSpin = useCallback(() => {
    const w = wheelSimRef.current;
    if (w.isSpinning) return;

    setLandedSlice(null);
    setActiveQuestion(null);
    setSelectedOption(null);
    setAnswerOutcome(null);
    setIsSpinning(true);
    setShellState('WHEEL_STAGE');

    // Give the wheel a strong randomized angular impulse (14 to 22 rad/s)
    w.isSpinning = true;
    w.highlightedSliceIdx = -1;
    w.angularVelocity = 15 + Math.random() * 8;
  }, []);

  // Start a new 10-question Game Run
  const startNewGameRun = useCallback(() => {
    usedQuestionIdsRef.current.clear();
    setScore(0);
    setLives(3);
    setStreak(0);
    setMaxStreak(0);
    setQuestionNumber(0);
    setCorrectCount(0);
    setMasteredCodes([]);
    setLandedSlice(null);
    setActiveQuestion(null);
    setSelectedOption(null);
    setAnswerOutcome(null);
    wheelSimRef.current.isSpinning = false;
    wheelSimRef.current.angularVelocity = 0.25;
    setShellState('WHEEL_STAGE');
  }, []);

  // Handle when the wheel finishes spinning and locks onto a category slice
  const handleWheelStoppedOnSlice = useCallback(
    (sliceIndex: number, canvasW: number, canvasH: number) => {
      const slice = WHEEL_SLICES[sliceIndex] || WHEEL_SLICES[0];
      const w = wheelSimRef.current;
      w.isSpinning = false;
      w.highlightedSliceIdx = sliceIndex;
      w.hitstopTimer = 0.06;
      w.shakeIntensity = slice.id === 'cat-jackpot' ? 12 : 7;

      setIsSpinning(false);
      setLandedSlice(slice);

      sfxRef.current.playCategoryLocked(slice.id === 'cat-jackpot');
      spawnCanvasBurst(canvasW * 0.5, canvasH * 0.48, slice.accentColor, 36, 1.25);

      const q = pickQuestionForSlice(slice);
      // Open the 15-Second Pop-Up Quiz after a brief 550ms celebratory beat so the player sees the slice lock in
      setTimeout(() => {
        if (shellStateRef.current !== 'WHEEL_STAGE') return;
        setActiveQuestion(q);
        setSelectedOption(null);
        setAnswerOutcome(null);
        setTimeLeft(QUESTION_TIME_LIMIT);
        lastWholeSecondRef.current = Math.ceil(QUESTION_TIME_LIMIT);
        setQuestionNumber((prev) => prev + 1);
        setShellState('QUIZ_POPUP');
      }, 550);
    },
    [pickQuestionForSlice, spawnCanvasBurst]
  );

  // Submit an Answer in the 15-Second Pop-Up Quiz
  const handleSelectQuizOption = useCallback(
    (optionIdx: number) => {
      if (!activeQuestion || answerOutcome !== null) return;

      setSelectedOption(optionIdx);
      const isCorrect = optionIdx === activeQuestion.answerIndex;
      const mult = landedSlice?.multiplier || 1;

      if (isCorrect) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak > maxStreak) setMaxStreak(nextStreak);
        setCorrectCount((c) => c + 1);

        const speedBonus = Math.round(timeLeft * 20);
        const streakBonus = Math.min(300, (nextStreak - 1) * 50);
        const earned = (250 + speedBonus + streakBonus) * mult;

        setLastEarnedPoints(earned);
        setAnswerOutcome('correct');
        sfxRef.current.playCorrectAnswer(nextStreak);

        setScore((prev) => {
          const next = prev + earned;
          if (next > highScore) {
            setHighScore(next);
            try {
              localStorage.setItem('ikqa_spinquiz_highscore', String(next));
            } catch {
              // ignore
            }
          }
          return next;
        });

        setMasteredCodes((prev) =>
          prev.includes(activeQuestion.docCode) ? prev : [...prev, activeQuestion.docCode]
        );

        const canvas = canvasRef.current;
        if (canvas) {
          spawnCanvasBurst(
            canvas.clientWidth * 0.5,
            canvas.clientHeight * 0.48,
            '#34d399',
            42,
            1.35
          );
        }
      } else {
        setStreak(0);
        setLastEarnedPoints(0);
        setAnswerOutcome('wrong');
        setLives((prev) => Math.max(0, prev - 1));
        wheelSimRef.current.shakeIntensity = 12;
        sfxRef.current.playWrongOrTimeout();
      }
    },
    [activeQuestion, answerOutcome, highScore, landedSlice, maxStreak, spawnCanvasBurst, streak, timeLeft]
  );

  // Proceed after answering a Pop-Up Quiz question
  const handleProceedAfterQuiz = useCallback(() => {
    if (lives <= 0) {
      setShellState('GAME_OVER');
      return;
    }
    if (questionNumber >= TOTAL_ROUND_QUESTIONS) {
      sfxRef.current.playCategoryLocked(true);
      setShellState('VICTORY');
      return;
    }
    setActiveQuestion(null);
    setSelectedOption(null);
    setAnswerOutcome(null);
    setShellState('WHEEL_STAGE');
  }, [lives, questionNumber]);

  // 15-Second High-Precision Countdown Timer when QUIZ_POPUP is active
  useEffect(() => {
    if (shellState !== 'QUIZ_POPUP' || !activeQuestion || answerOutcome !== null) {
      return;
    }

    let rafId = 0;
    let prevTime = performance.now();

    const tickTimer = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      setTimeLeft((prev) => {
        const next = Math.max(0, prev - dt);
        const whole = Math.ceil(next);
        if (whole < lastWholeSecondRef.current && whole > 0 && whole <= 5) {
          lastWholeSecondRef.current = whole;
          sfxRef.current.playCountdownTick(whole <= 3);
        }
        if (next <= 0) {
          // 15 Seconds Expired!
          setStreak(0);
          setLastEarnedPoints(0);
          setAnswerOutcome('timeout');
          setLives((l) => Math.max(0, l - 1));
          wheelSimRef.current.shakeIntensity = 14;
          sfxRef.current.playWrongOrTimeout();
          return 0;
        }
        return next;
      });

      rafId = requestAnimationFrame(tickTimer);
    };

    rafId = requestAnimationFrame(tickTimer);
    return () => cancelAnimationFrame(rafId);
  }, [shellState, activeQuestion, answerOutcome]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sfxRef.current.muted = next;
      return next;
    });
  }, []);

  // Keyboard Controls (Enter / Space to Start & Spin, 1-4 to Answer Pop-Up Quiz, Esc to Pause, M to Mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'm') {
        toggleMute();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setCodexOpen((p) => !p);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (codexOpen) {
          setCodexOpen(false);
          return;
        }
        if (shellState === 'WHEEL_STAGE') {
          setShellState('PAUSED');
        } else if (shellState === 'PAUSED') {
          setShellState('WHEEL_STAGE');
        }
        return;
      }

      if (codexOpen) return;

      if (shellState === 'TITLE_MENU') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewGameRun();
        }
        return;
      }

      if (shellState === 'WHEEL_STAGE') {
        if ((e.key === 'Enter' || e.key === ' ') && !isSpinning) {
          e.preventDefault();
          triggerWheelSpin();
        }
        return;
      }

      if (shellState === 'QUIZ_POPUP') {
        if (answerOutcome === null) {
          if (['1', '2', '3', '4'].includes(key)) {
            e.preventDefault();
            const idx = Number(key) - 1;
            if (activeQuestion && idx < activeQuestion.options.length) {
              handleSelectQuizOption(idx);
            }
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleProceedAfterQuiz();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeQuestion,
    answerOutcome,
    codexOpen,
    handleProceedAfterQuiz,
    handleSelectQuizOption,
    isSpinning,
    shellState,
    startNewGameRun,
    toggleMute,
    triggerWheelSpin,
  ]);

  // Isolated 60fps Canvas Loop for the Spin-the-Wheel Arena
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const numSlices = WHEEL_SLICES.length;
    const sliceArc = (Math.PI * 2) / numSlices;

    const renderFrame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      lastTime = now;

      const width = canvas.clientWidth || 1280;
      const height = canvas.clientHeight || 720;
      const w = wheelSimRef.current;

      // 1. Update Wheel Physics
      if (w.hitstopTimer > 0) {
        w.hitstopTimer = Math.max(0, w.hitstopTimer - dt);
      } else {
        if (shellStateRef.current === 'TITLE_MENU') {
          w.angle = (w.angle + 0.32 * dt) % (Math.PI * 2);
        } else if (w.isSpinning) {
          w.angle = (w.angle + w.angularVelocity * dt) % (Math.PI * 2);
          // Smooth exponential friction deceleration
          w.angularVelocity *= Math.pow(0.26, dt);
          if (w.angularVelocity < 1.8) {
            w.angularVelocity = Math.max(0, w.angularVelocity - 1.15 * dt);
          }

          // Top pointer is at -Math.PI / 2 (12 o'clock). Compute which slice is currently under the pointer:
          const pointerAngle = (Math.PI * 1.5 - w.angle + Math.PI * 4) % (Math.PI * 2);
          const currentSliceIdx = Math.floor(pointerAngle / sliceArc) % numSlices;

          if (currentSliceIdx !== w.lastSliceIdx) {
            w.lastSliceIdx = currentSliceIdx;
            // Deflect the top pointer flapper and play peg click sound
            w.flapperAngle = -0.58;
            sfxRef.current.playWheelPegTick(Math.min(1, w.angularVelocity / 16));
          }

          if (w.angularVelocity <= 0.03) {
            w.angularVelocity = 0;
            handleWheelStoppedOnSlice(currentSliceIdx, width, height);
          }
        }
      }

      // Spring-return the top pointer flapper
      const flapperSpring = -w.flapperAngle * 180;
      w.flapperVelocity = (w.flapperVelocity + flapperSpring * dt) * Math.pow(0.04, dt);
      w.flapperAngle += w.flapperVelocity * dt;

      // Decay camera shake
      if (w.shakeIntensity > 0) {
        w.shakeIntensity = Math.max(0, w.shakeIntensity - dt * 30);
      }

      // Update particles
      for (const p of w.particles) {
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt; // subtle gravity on confetti sparks
        p.vx *= 0.96;
      }

      // =======================================================================
      // 2. DRAW STUDIO BACKGROUND & SPIN-THE-WHEEL CENTERPIECE
      // =======================================================================
      ctx.save();
      if (w.shakeIntensity > 0) {
        ctx.translate(
          (Math.random() - 0.5) * w.shakeIntensity * 2,
          (Math.random() - 0.5) * w.shakeIntensity * 2
        );
      }

      // Deep Culinary Stage Background
      ctx.fillStyle = '#040814';
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Subtle radial stage spotlight behind wheel
      const cx = width * 0.5;
      const cy = height * 0.51;
      const maxDim = Math.max(width, height);
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxDim * 0.6);
      bgGrad.addColorStop(0, 'rgba(185, 28, 28, 0.22)');
      bgGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.6)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 23, 1)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Wheel radius scaled to viewport so >=85% playfield is crisp and unobstructed
      const radius = Math.min(width * 0.36, height * 0.37, 255);

      // Outer Golden & Crimson Hotpot Rim
      ctx.save();
      ctx.translate(cx, cy);

      // Drop shadow under wheel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.arc(0, 10, radius + 22, 0, Math.PI * 2);
      ctx.fill();

      // Outer metallic casing
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotate canvas by current wheel angle
      ctx.rotate(w.angle);

      // Draw 8 Category Slices
      for (let i = 0; i < numSlices; i++) {
        const slice = WHEEL_SLICES[i];
        const startAngle = i * sliceArc;
        const endAngle = startAngle + sliceArc;
        const isHighlighted = w.highlightedSliceIdx === i && !w.isSpinning;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        const sliceGrad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
        sliceGrad.addColorStop(0, slice.darkColor);
        sliceGrad.addColorStop(1, isHighlighted ? slice.accentColor : slice.color);
        ctx.fillStyle = sliceGrad;
        ctx.fill();

        ctx.strokeStyle = isHighlighted ? '#ffffff' : '#0f172a';
        ctx.lineWidth = isHighlighted ? 3.5 : 2;
        ctx.stroke();

        // Slice Label & Document Codes along the radial spoke
        ctx.save();
        ctx.rotate(startAngle + sliceArc * 0.5);
        ctx.textAlign = 'right';

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${Math.max(11, Math.round(radius * 0.056))}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(slice.shortTitle, radius - 18, -4);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `600 ${Math.max(9, Math.round(radius * 0.042))}px "JetBrains Mono", monospace`;
        ctx.fillText(slice.subCode, radius - 18, 12);
        ctx.restore();
      }

      // Draw Brass Pegs on the Rim between slices
      for (let i = 0; i < numSlices; i++) {
        const pegAngle = i * sliceArc;
        const px = Math.cos(pegAngle) * (radius + 6);
        const py = Math.sin(pegAngle) * (radius + 6);
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Center Hub Medallion
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.21, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `800 ${Math.max(11, Math.round(radius * 0.055))}px "JetBrains Mono", monospace`;
      ctx.fillText(w.isSpinning ? 'SPINNING' : 'IKQA L&D', 0, 0);

      ctx.restore();

      // Draw Top 12-o'clock Deflecting Pointer Flapper
      ctx.save();
      ctx.translate(cx, cy - radius - 18);
      ctx.rotate(w.flapperAngle);

      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(14, -14);
      ctx.lineTo(0, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render Pooled Confetti & Spark Particles
      for (const p of w.particles) {
        if (!p.active) continue;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleWheelStoppedOnSlice]);

  const shellContainerClass = isFullViewport
    ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 overflow-hidden select-none'
    : 'relative w-full h-[660px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden select-none';

  return (
    <div className={shellContainerClass}>
      {/* =====================================================================
          ISOLATED 60FPS SPIN-THE-WHEEL CANVAS
         ===================================================================== */}
      <div className="absolute inset-0 w-full h-full">
        <canvas
          ref={canvasRef}
          onClick={() => {
            if (shellState === 'WHEEL_STAGE' && !isSpinning) {
              triggerWheelSpin();
            }
          }}
          className={`block w-full h-full ${
            shellState === 'WHEEL_STAGE' && !isSpinning ? 'cursor-pointer' : 'cursor-default'
          }`}
        />
      </div>

      {/* =====================================================================
          PERIMETER HUD (LOW-OCCLUSION, >=85% UNOBSTRUCTED, NO BACKDROP-FILTER)
         ===================================================================== */}
      {(shellState === 'WHEEL_STAGE' || shellState === 'QUIZ_POPUP') && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
          {/* Top Perimeter Status Row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            {/* Left Status Cluster: Score, Question Progress, Streak, Lives */}
            <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/95 border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Question Round</div>
                <div className="text-sm font-bold text-white font-mono tabular-nums">
                  {Math.min(questionNumber + (shellState === 'WHEEL_STAGE' ? 1 : 0), TOTAL_ROUND_QUESTIONS)} / {TOTAL_ROUND_QUESTIONS} · {score} PTS
                </div>
              </div>

              <span className="text-slate-700" aria-hidden="true">|</span>

              <div>
                <div className="text-[11px] text-slate-400 font-medium">Audit Lives</div>
                <div className="text-sm font-bold font-mono tabular-nums text-rose-400">
                  {lives} / 3 · {lives >= 2 ? 'STABLE' : 'CRITICAL'}
                </div>
              </div>

              <span className="text-slate-700" aria-hidden="true">|</span>

              <div>
                <div className="text-[11px] text-slate-400 font-medium">Streak</div>
                <div className="text-sm font-bold font-mono tabular-nums text-amber-400">
                  {streak}x
                </div>
              </div>
            </div>

            {/* Right Controls Cluster */}
            <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/95 border border-slate-800 rounded-xl p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => setCodexOpen((p) => !p)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                All Data ({questionBank.length} Qs)
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isMuted ? 'Audio Off' : 'Audio On'}
              </button>
              <button
                type="button"
                onClick={() => setShellState('PAUSED')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Pause (Esc)
              </button>
              {onExitShell && (
                <button
                  type="button"
                  onClick={onExitShell}
                  className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Exit Game
                </button>
              )}
            </div>
          </div>

          {/* Bottom Perimeter Action Bar during WHEEL_STAGE */}
          {shellState === 'WHEEL_STAGE' && (
            <div className="flex flex-col items-center gap-2 pb-1">
              {landedSlice && (
                <div className="bg-slate-950/95 border border-amber-400 rounded-xl px-4 py-1.5 text-xs font-mono font-bold text-amber-300 shadow-lg">
                  Category Locked: {landedSlice.label} ({landedSlice.subCode}) — Opening 15s Pop-Up Quiz…
                </div>
              )}

              <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/95 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-2xl">
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={triggerWheelSpin}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs sm:text-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isSpinning
                    ? 'Wheel Spinning…'
                    : `Spin Category Wheel for Question #${questionNumber + 1} (Space / Click)`}
                </button>

                <span className="hidden sm:inline text-xs font-mono text-slate-400">
                  15s Time Limit per Pop-Up Question · Keys 1-4 Answer
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          15-SECOND POP-UP QUIZ MODAL (SPRINGS OPEN WHEN WHEEL LANDS ON CATEGORY)
         ===================================================================== */}
      {shellState === 'QUIZ_POPUP' && activeQuestion && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-30">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            {/* Top Header: Selected Wheel Category + 15-Second Countdown Clock */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold text-amber-400">
                  {activeQuestion.categoryLabel} · {activeQuestion.docCode}
                  {landedSlice?.multiplier === 2 ? ' · 2X JACKPOT POINTS' : ''}
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  Source Document: {activeQuestion.docTitle}
                </div>
              </div>

              {/* 15.0s Tabular Countdown Readout */}
              <div
                className={`px-3.5 py-1.5 rounded-xl border font-mono font-extrabold text-sm sm:text-base tabular-nums flex items-center gap-2 ${
                  timeLeft > 7
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                    : timeLeft > 3.5
                    ? 'bg-amber-950/90 border-amber-500/70 text-amber-300'
                    : 'bg-red-950 border-red-500 text-red-300'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9V13L14.5 14.5" />
                  <path d="M9 2H15" />
                </svg>
                <span>{timeLeft.toFixed(1)}s / 15.0s</span>
              </div>
            </div>

            {/* Smooth 15-Second Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className="h-full transition-colors duration-150"
                style={{
                  width: `${Math.max(0, Math.min(100, (timeLeft / QUESTION_TIME_LIMIT) * 100))}%`,
                  backgroundColor:
                    timeLeft > 7 ? '#10b981' : timeLeft > 3.5 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>

            {/* Question Prompt */}
            <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
              {activeQuestion.question}
            </h3>

            {/* 4 Selectable Answer Options */}
            <div className="space-y-2.5">
              {activeQuestion.options.map((optText, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === activeQuestion.answerIndex;

                let btnClasses =
                  'bg-slate-950 hover:bg-slate-800/90 border-slate-800 hover:border-amber-500/50 text-slate-100';
                if (answerOutcome !== null) {
                  if (isCorrect) {
                    btnClasses = 'bg-emerald-950/90 border-emerald-400 text-emerald-100';
                  } else if (isSelected) {
                    btnClasses = 'bg-red-950/90 border-red-500 text-red-200';
                  } else {
                    btnClasses = 'bg-slate-950/50 border-slate-800/60 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={answerOutcome !== null}
                    onClick={() => handleSelectQuizOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors flex items-start gap-3 cursor-pointer ${btnClasses}`}
                  >
                    <span className="font-mono font-extrabold text-amber-400 shrink-0">
                      [{idx + 1}]
                    </span>
                    <span className="flex-1 leading-relaxed">{optText}</span>
                    {answerOutcome !== null && isCorrect && (
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        CORRECT
                      </span>
                    )}
                    {answerOutcome !== null && isSelected && !isCorrect && (
                      <span className="text-xs font-mono font-bold text-red-400 shrink-0">
                        WRONG
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Explanation & Spin-Next CTA once answered or timed out */}
            {answerOutcome !== null && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    answerOutcome === 'correct'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-red-950/60 border-red-500/50 text-red-200'
                  }`}
                >
                  <div className="font-mono font-bold mb-1">
                    {answerOutcome === 'correct' &&
                      `CORRECT! +${lastEarnedPoints} PTS (Speed Bonus Included)`}
                    {answerOutcome === 'wrong' &&
                      'INCORRECT RESPONSE (-1 Audit Life) — Review Official Standard:'}
                    {answerOutcome === 'timeout' &&
                      '15-SECOND TIME LIMIT EXPIRED (-1 Audit Life) — Review Official Standard:'}
                  </div>
                  <p className="text-slate-200">{activeQuestion.explanation}</p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    Progress: {questionNumber} / {TOTAL_ROUND_QUESTIONS} Questions · Correct: {correctCount}
                  </span>
                  <button
                    type="button"
                    onClick={handleProceedAfterQuiz}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {lives <= 0
                      ? 'View Final Audit Summary'
                      : questionNumber >= TOTAL_ROUND_QUESTIONS
                      ? 'Complete Audit Round (Space)'
                      : 'Spin Wheel for Next Question (Space)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TITLE SCREEN (BESPOKE INLINE SVG LOCKUP, NEGATIVE SPACE, START CTA)
         ===================================================================== */}
      {shellState === 'TITLE_MENU' && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/45 flex flex-col justify-between p-6 sm:p-10 overflow-y-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              Player: {staffName} · {staffPosition} · High Score: {highScore} PTS · {questionBank.length} Total Questions ({documents.length} Docs)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCodexOpen((p) => !p)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Inspect All {documents.length} Source Docs
              </button>
              {onToggleFullViewport && (
                <button
                  type="button"
                  onClick={() => onToggleFullViewport(!isFullViewport)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isFullViewport ? 'Windowed View' : 'Full Viewport'}
                </button>
              )}
              {onExitShell && (
                <button
                  type="button"
                  onClick={onExitShell}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Return to L&amp;D Hub
                </button>
              )}
            </div>
          </div>

          {/* Center Hero Lockup over generous negative space */}
          <div className="my-auto max-w-3xl mx-auto text-center space-y-6 py-6">
            <div className="flex justify-center">
              <svg
                className="w-24 h-24 sm:w-28 sm:h-28"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Jiangnan Hotpot Spin the Wheel Compliance Quiz Crest"
              >
                <circle cx="60" cy="60" r="54" fill="#0F172A" stroke="#F59E0B" strokeWidth="3.5" />
                <path d="M60 60L60 10A50 50 0 0 1 104 36L60 60Z" fill="#DC2626" />
                <path d="M60 60L104 36A50 50 0 0 1 104 84L60 60Z" fill="#D97706" />
                <path d="M60 60L104 84A50 50 0 0 1 60 110L60 60Z" fill="#059669" />
                <path d="M60 60L60 110A50 50 0 0 1 16 84L60 60Z" fill="#0284C7" />
                <path d="M60 60L16 84A50 50 0 0 1 16 36L60 60Z" fill="#7C3AED" />
                <path d="M60 60L16 36A50 50 0 0 1 60 10L60 60Z" fill="#E11D48" />
                <circle cx="60" cy="60" r="16" fill="#0F172A" stroke="#FBBF24" strokeWidth="3" />
                <polygon points="52,4 68,4 60,20" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-amber-400 tracking-wide">
                Imperial Kitchen Group Inc. · All-Data Spin-the-Wheel Pop-Up Quiz
              </div>
              <h1
                className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Spin the Wheel: 15-Second Food Safety Pop-Up Quiz
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Spin the 8-slice category wheel covering all {documents.length} Policies, SOPs, Guides, Station Checklists, and Floor Cheat-Sheets. Beat the 15-second pop-up timer on every question to build your streak.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={startNewGameRun}
                className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Start Spin &amp; Quiz Show (Press Enter / Space)
              </button>

              <div className="text-xs font-mono text-slate-400">
                Space Spin Wheel · 1-4 Select Pop-Up Answer (15s Limit) · Tab Data Index · Esc Pause
              </div>
            </div>
          </div>

          {/* 8 Wheel Categories Preview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-5xl mx-auto w-full">
            {WHEEL_SLICES.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-0.5"
              >
                <div className="text-xs font-bold text-white truncate" style={{ color: s.accentColor }}>
                  {s.shortTitle}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {s.subCode}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          PAUSE / VICTORY / GAME OVER MODAL
         ===================================================================== */}
      {(shellState === 'PAUSED' || shellState === 'VICTORY' || shellState === 'GAME_OVER') && (
        <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-30">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5 shadow-2xl text-center">
            <div className="space-y-1">
              <div className="text-xs font-mono text-amber-400">
                {shellState === 'PAUSED' && 'Quiz Show Paused'}
                {shellState === 'VICTORY' && '10-Question Spin-the-Wheel Audit Complete'}
                {shellState === 'GAME_OVER' && 'Audit Lives Depleted — Retraining Recommended'}
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                {shellState === 'PAUSED' && 'Game Paused'}
                {shellState === 'VICTORY' && 'Grand Food Safety Quiz Master!'}
                {shellState === 'GAME_OVER' && 'Round Ended'}
              </h2>
              <p className="text-xs text-slate-300">
                {staffName} · {staffPosition} · {staffBranch}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Total Score</div>
                <div className="text-lg font-extrabold text-amber-400 font-mono tabular-nums">
                  {score}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Correct</div>
                <div className="text-lg font-extrabold text-emerald-400 font-mono tabular-nums">
                  {correctCount} / {TOTAL_ROUND_QUESTIONS}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Best Streak</div>
                <div className="text-lg font-extrabold text-white font-mono tabular-nums">
                  {maxStreak}x
                </div>
              </div>
            </div>

            {masteredCodes.length > 0 && (
              <div className="text-left bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">
                  SOPs, Policies &amp; Checklists Mastered This Run:
                </div>
                <div className="text-xs font-mono text-emerald-300 leading-relaxed">
                  {masteredCodes.join(' · ')}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {shellState === 'PAUSED' && (
                <button
                  type="button"
                  onClick={() => setShellState('WHEEL_STAGE')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Resume Game
                </button>
              )}

              <button
                type="button"
                onClick={startNewGameRun}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Play Again
              </button>

              <button
                type="button"
                onClick={() => setShellState('TITLE_MENU')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Title Screen
              </button>

              {onExitShell && (
                <button
                  type="button"
                  onClick={onExitShell}
                  className="px-4 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Exit to Hub
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ALL-DATA QUESTION & DOCUMENT INDEX DRAWER
         ===================================================================== */}
      {codexOpen && (
        <div className="absolute inset-0 bg-slate-950/95 z-40 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Complete Spin-the-Wheel Question &amp; Document Bank ({documents.length} Docs · {questionBank.length} Questions)
              </h2>
              <p className="text-xs text-slate-400">
                All 8 wheel categories draw directly from these official Imperial Kitchen Group Policies, SOPs, Guides, and Checklists.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCodexOpen(false)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Close Index (Tab)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => {
              const verified = masteredCodes.includes(doc.code);
              return (
                <div
                  key={doc.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-amber-400">{doc.code}</span>
                      <span className={verified ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {verified ? 'Mastered' : doc.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{doc.summary}</p>
                  </div>
                  {onOpenDoc && (
                    <button
                      type="button"
                      onClick={() => {
                        setCodexOpen(false);
                        if (onExitShell) onExitShell();
                        onOpenDoc(doc);
                      }}
                      className="self-start text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                    >
                      Open Full Document →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
