import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  ShieldAlert,
  Layers,
  Sparkles,
  AlertTriangle,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Scissors,
  Trash2,
  Bug,
  ShieldCheck,
  Archive,
  UserCheck,
  Repeat,
  Check,
  Flame,
  PhoneOff,
  PackageCheck,
  Droplets,
} from 'lucide-react';

type SectionId =
  | 'handwashing'
  | 'boards'
  | 'retention'
  | 'fefo'
  | 'slicer'
  | 'pest'
  | 'waste'
  | 'hygiene_effects'
  | 'recall'
  | 'towels'
  | 'temperatures'
  | 'allergens'
  | 'storage'
  | 'calibration';

interface SectionMeta {
  id: SectionId;
  label: string;
  sub: string;
  type: 'sop' | 'policy';
  icon: string;
}

export const QuickReferenceView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('handwashing');
  const [filterType, setFilterType] = useState<'all' | 'sop' | 'policy'>('all');

  // Interactive 40-60 Second Handwashing Practice Timer
  const [targetDuration, setTargetDuration] = useState<40 | 60>(60);
  const [washTimer, setWashTimer] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && washTimer > 0) {
      interval = setInterval(() => {
        setWashTimer((prev) => prev - 1);
      }, 1000);
    } else if (washTimer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setTimerCompleted(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, washTimer]);

  const handleSelectTarget = (dur: 40 | 60) => {
    setTargetDuration(dur);
    setIsTimerRunning(false);
    setTimerCompleted(false);
    setWashTimer(dur);
  };

  const handleStartTimer = () => {
    setWashTimer(targetDuration);
    setTimerCompleted(false);
    setIsTimerRunning(true);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setWashTimer(targetDuration);
    setTimerCompleted(false);
  };

  const sections: SectionMeta[] = [
    // Standard Operating Procedures (SOPs)
    { id: 'handwashing', label: '6-Step Handwash', sub: 'IKQA-SOP#001', type: 'sop', icon: '🧼' },
    { id: 'boards', label: 'Boards & Plates', sub: 'IKQA-SOP#010', type: 'sop', icon: '🥩' },
    { id: 'retention', label: 'Food Retention Samples', sub: 'IKQA-SOP#011', type: 'sop', icon: '🧪' },
    { id: 'fefo', label: 'FIFO & FEFO Precedence', sub: 'IKQA-SOP#004', type: 'sop', icon: '🔄' },
    { id: 'slicer', label: 'Wire Slicer & Luncheon', sub: 'IKQA-SOP#012', type: 'sop', icon: '🔪' },
    { id: 'pest', label: 'Pest Control (IPM)', sub: 'IKQA-SOP#003', type: 'sop', icon: '🪲' },
    { id: 'waste', label: 'Waste & Reject Crushing', sub: 'IKQA-SOP#009', type: 'sop', icon: '🗑️' },
    { id: 'hygiene_effects', label: 'Hygiene & Bare Elbows', sub: 'IKQA-SOP#002/#008', type: 'sop', icon: '🪒' },
    { id: 'recall', label: 'Traceability & Recall', sub: 'IKQA-SOP#005/#007', type: 'sop', icon: '🚨' },

    // Core Policies
    { id: 'towels', label: 'Towel Matrix', sub: 'IKQAP#015', type: 'policy', icon: '🧽' },
    { id: 'temperatures', label: 'Cold Chain & Danger Zone', sub: 'IKQAP#001/#003', type: 'policy', icon: '❄️' },
    { id: 'allergens', label: 'Big 9 Allergens', sub: 'IKQAP#004', type: 'policy', icon: '⚠️' },
    { id: 'storage', label: '5S Chiller Rack', sub: 'IKQAP#011', type: 'policy', icon: '📦' },
    { id: 'calibration', label: 'Scale & Temp Calibration', sub: 'IKQAP#020', type: 'policy', icon: '⚖️' },
  ];

  const filteredSections = sections.filter((s) => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-red-800/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Floor Compliance Cheat-Sheets
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-700/50">
            {sections.length} Quick Refs
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Instant visual standards, operational SOPs, and food safety thresholds for Jiangnan Hotpot & Imperial Kitchen Group.
        </p>

        {/* Filter Toggle Chips */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-900/40">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              filterType === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Cheat-Sheets ({sections.length})
          </button>
          <button
            onClick={() => setFilterType('sop')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              filterType === 'sop'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>📋 Standard Operating Procedures ({sections.filter((s) => s.type === 'sop').length})</span>
          </button>
          <button
            onClick={() => setFilterType('policy')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              filterType === 'policy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🏛️ Policies ({sections.filter((s) => s.type === 'policy').length})</span>
          </button>
        </div>
      </div>

      {/* Pill Selector Scrollable */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {filteredSections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold flex flex-col items-center gap-0.5 transition-all ${
              activeSection === sec.id
                ? 'bg-red-600 text-white shadow-md scale-102 ring-2 ring-red-400/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </div>
            <span
              className={`text-[9px] font-mono px-1 rounded ${
                activeSection === sec.id
                  ? 'bg-red-800/80 text-red-100'
                  : sec.type === 'sop'
                  ? 'bg-amber-950/70 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {sec.sub}
            </span>
          </button>
        ))}
      </div>

      {/* =========================================================================
          SOP 1: HANDWASHING & DOUBLE WASH (IKQA-SOP#001)
         ========================================================================= */}
      {activeSection === 'handwashing' && (
        <div className="space-y-4">
          {/* Practice Timer Card */}
          <div className="bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-800/50 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1 justify-center sm:justify-start">
                <Droplets className="w-3.5 h-3.5" />
                <span>Audited Skill Drill • Standard: 40–60 Seconds</span>
              </span>
              <h3 className="text-sm font-bold text-white">
                40–60 Second Handwashing Practice Timer
              </h3>
              <p className="text-xs text-slate-300">
                Complete 40 to 60 seconds total wash (vigorous scrubbing of palms, wrists, nails &amp; between fingers, plus thorough rinse &amp; single-use paper towel dry).
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Timer Target:</span>
                <button
                  type="button"
                  onClick={() => handleSelectTarget(40)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                    targetDuration === 40
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  40s (Min Standard)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTarget(60)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                    targetDuration === 60
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  60s (Full Standard)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-mono font-black text-xl border-4 transition-all ${
                  timerCompleted
                    ? 'border-emerald-500 bg-emerald-950 text-emerald-300 scale-105'
                    : isTimerRunning
                    ? 'border-cyan-400 bg-cyan-950 text-cyan-200 animate-pulse'
                    : 'border-slate-700 bg-slate-950 text-slate-400'
                }`}
              >
                {timerCompleted ? (
                  <Check className="w-7 h-7 text-emerald-400" />
                ) : (
                  <span>{washTimer}s</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {!isTimerRunning ? (
                  <button
                    onClick={handleStartTimer}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{timerCompleted ? 'Wash Again' : `Start ${targetDuration}s Wash`}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResetTimer}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
                {timerCompleted && (
                  <span className="text-[10px] text-emerald-400 font-bold text-center">
                    PASSED QA! ({targetDuration}s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 6-Step Visual Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Six-Step 40–60 Second Technique (IKQA-SOP#001 Section 3)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { step: '1', title: 'Wet Hands', desc: 'Warm potable water (38°C - 43°C).' },
                { step: '2', title: 'Liquid Soap', desc: 'Apply antimicrobial liquid soap. (No bar soap!)' },
                { step: '3', title: 'Scrub Vigorously', desc: 'Vigorously rub palms, wrists, fingers, under nails (40–60s total wash).' },
                { step: '4', title: 'Rinse Well', desc: 'Clean running water flowing fingertips down.' },
                { step: '5', title: 'Single Towel', desc: 'Dry thoroughly with single-use paper towel.' },
                { step: '6', title: 'Turn Tap Off', desc: 'Use paper towel as barrier to close faucet.' },
              ].map((s) => (
                <div key={s.step} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center border border-cyan-500/40">
                      {s.step}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Step {s.step}</span>
                  </div>
                  <span className="text-xs font-bold text-white block mb-0.5">{s.title}</span>
                  <p className="text-[11px] text-slate-400 leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The Restroom Double Wash & Bar Soap Prohibition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-red-950/40 border border-red-700/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>Restroom Double Wash Method</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Employees leaving the comfort room <strong>MUST</strong> wash hands once inside the restroom, and immediately perform a <strong>second complete 40–60 second wash</strong> at the kitchen handwash sink before handling food or clean wares.
              </p>
              <div className="text-[10px] font-semibold text-red-300 bg-red-900/40 p-2 rounded-lg border border-red-800/40">
                ⚠️ Automatic Contamination: Any food touched after a missed handwash is deemed adulterated and must be immediately discarded.
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/40 border border-amber-700/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Prohibited Handwash Practices</span>
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Bar Soap Banned:</strong> Harbors bacterial biofilm reservoirs. Liquid antimicrobial only.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Hand Sink Misuse:</strong> Never wash food, prep ingredients, rinse dishes, or dump mop water in hand sinks.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Unobstructed Access:</strong> Sinks must remain 100% free of boxes, pans, or trash cans at all times.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SOP 2: FOOD RETENTION SAMPLES (IKQA-SOP#011)
         ========================================================================= */}
      {activeSection === 'retention' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-400" />
                <span>Daily Food Retention Protocol (IKQA-SOP#011)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/40">
                Hold Period: 5 to 7 Days
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mandatory samples collected every morning <strong>before the shift opens</strong> to provide legal and scientific defence against foodborne illness claims:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {[
                {
                  item: 'Hotpot Broths',
                  sub: 'Signature Spicy & Bone Broth',
                  qty: '100mL - 150mL',
                  container: 'PE Retain Pouch',
                  storage: '≤4°C (Chilled)',
                  color: 'border-red-800/60 bg-red-950/30 text-red-200',
                },
                {
                  item: 'Raw Marinated Proteins',
                  sub: 'US Beef, Angus, Pork, Chicken',
                  qty: '100 grams',
                  container: 'Vacuum PE Pouch',
                  storage: '≤-18°C (Frozen)',
                  color: 'border-amber-800/60 bg-amber-950/30 text-amber-200',
                },
                {
                  item: 'Proprietary Dipping Sauces',
                  sub: 'House Special Sauce Blends',
                  qty: '100 grams',
                  container: 'Sterile Retain Cup',
                  storage: '≤4°C (Chilled)',
                  color: 'border-blue-800/60 bg-blue-950/30 text-blue-200',
                },
                {
                  item: 'Potable & RO Ice/Water',
                  sub: 'Filtered Water Dispenser & Ice',
                  qty: '250mL',
                  container: 'Sterile Retain Bottle',
                  storage: '≤4°C (Chilled)',
                  color: 'border-cyan-800/60 bg-cyan-950/30 text-cyan-200',
                },
              ].map((sample, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border ${sample.color} space-y-1.5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{sample.item}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-white border border-slate-700">
                      {sample.qty}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{sample.sub}</p>
                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{sample.container}</span>
                    <span className="font-semibold text-emerald-400">{sample.storage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-white block">🏷️ Mandatory Sample Label Format:</span>
              <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 space-y-0.5">
                <div>[Sample Name] - [Batch/Lot #]</div>
                <div>Date & Time: YYYY-MM-DD | 09:30 AM</div>
                <div>Collected By: [Staff Name & Designation]</div>
                <div>Storage Temp: ≤4°C or ≤-18°C</div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-white block">🔒 Chain of Custody & Disposal:</span>
              <p className="leading-relaxed">
                Samples are held in a <strong>dedicated locked QA storage box</strong>. If no complaints arise after <strong>7 days</strong>, samples are doused with sanitizer and safely disposed. If a complaint occurs, samples are delivered to an accredited laboratory under strict chain of custody.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SOP 3: FIFO & FEFO PRECEDENCE (IKQA-SOP#004)
         ========================================================================= */}
      {activeSection === 'fefo' && (
        <div className="space-y-4">
          <div className="p-3 bg-red-950/40 border border-red-700/50 rounded-xl flex items-start gap-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300">GOLDEN RULE OF PRECEDENCE:</strong> <strong>FEFO (First-Expiry, First-Out) STRICTLY OVERRIDES FIFO.</strong> An item with an earlier expiration date must always be stocked in front and prepped first, regardless of when it arrived at the store.
            </div>
          </div>

          {/* Stocking Motion Diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-400" />
              <span>Back-to-Front Stocking Workflow</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-800/40 space-y-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                  FRONT OF SHELF (Use First)
                </span>
                <h4 className="text-xs font-bold text-white">Nearest Expiry Date</h4>
                <p className="text-[11px] text-slate-300">
                  Items expiring soonest (e.g., Oct 24). Readily accessible to cooks and prep cooks.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  MIDDLE OF SHELF
                </span>
                <h4 className="text-xs font-bold text-white">Intermediate Expiry</h4>
                <p className="text-[11px] text-slate-300">
                  Items with standard rotation buffer (e.g., Oct 28). Moved forward as front items deplete.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-800/40 space-y-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/40">
                  BACK OF SHELF (New Stock)
                </span>
                <h4 className="text-xs font-bold text-white">Latest Expiry Date</h4>
                <p className="text-[11px] text-slate-300">
                  Newly delivered stock (e.g., Nov 15). Loaded from rear; never stacked directly in front of older items.
                </p>
              </div>
            </div>
          </div>

          {/* Near-Expiry Action Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-white block">⚡ Near-Expiry Action Protocol:</span>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">&lt; 48 Hours:</span>
                  <span>Apply yellow fluorescent dot sticker. Prioritize for immediate prep into broths or marinades.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">&lt; 24 Hours:</span>
                  <span>Alert Kitchen Lead. If not cookable before expiration, log in IQAF-007 and move to waste quarantine.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-500 font-bold">Expired:</span>
                  <span>Strict zero tolerance. NEVER use, relabel, or extend shelf-life. Mechanically deface and discard.</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-white block">📋 Mandatory 4-Point Receiving Tag:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">POINT 1</span>
                  <span className="text-white font-bold">Item Description</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">POINT 2</span>
                  <span className="text-white font-bold">Intake Date / Time</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">POINT 3</span>
                  <span className="text-amber-400 font-bold">Expiration Date</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">POINT 4</span>
                  <span className="text-cyan-400 font-bold">Supplier Lot #</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SOP 4: WIRE SLICER & LUNCHEON MEAT (IKQA-SOP#012)
         ========================================================================= */}
      {activeSection === 'slicer' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Portioning Luncheon Meat with Wire Slicer (IKQA-SOP#012)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/40">
                Target: 0.8cm - 1.0cm
              </span>
            </div>

            {/* Thickness Gauge Visual */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-white block">Standardized Portioning Gauge</span>
                <p className="text-[11px] text-slate-300">
                  Uniform slicing ensures even cooking in the hotpot and protects plate presentation margins.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-mono text-center">
                  <div className="w-8 h-12 rounded bg-amber-800/80 border-2 border-amber-400 flex items-center justify-center font-bold text-xs text-white shadow">
                    8mm
                  </div>
                  <span className="text-slate-400 text-xs">to</span>
                  <div className="w-10 h-12 rounded bg-amber-800/80 border-2 border-amber-400 flex items-center justify-center font-bold text-xs text-white shadow">
                    10mm
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 border-l border-slate-800 pl-3">
                  <span className="text-emerald-400 font-bold block">✓ Optimal Hotpot Dip</span>
                  <span>Cooks evenly in boiling broth in 60-90s</span>
                </div>
              </div>
            </div>

            {/* Pre-Op & Sanitization Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-cyan-300 block">🔍 Pre-Operational Inspection:</span>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Wire Tension:</strong> Check all stainless cutting wires for slack, fraying, or rust.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Frame Alignment:</strong> Verify frame hinges are snug with no loose screws or wobbling.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Pre-Sanitized:</strong> Ensure wire slicer was sanitized prior to shift contact.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-red-950/40 border border-red-700/50 rounded-xl space-y-2 text-xs text-red-200">
                <span className="font-bold text-red-300 block">🚨 Wire Break Emergency Protocol:</span>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-400 font-bold">1.</span>
                    <span><strong>Immediate Stop:</strong> Halt portioning instantly if any wire snaps or loosens.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-400 font-bold">2.</span>
                    <span><strong>Quarantine Batch:</strong> Discard the entire current batch of sliced meat due to metal fragment risk.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-400 font-bold">3.</span>
                    <span><strong>Tag Out:</strong> Affix "OUT OF SERVICE" tag and replace cutting wire cartridge.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>⏱️ <strong>Sanitization Cycle:</strong> Complete wash, rinse, and 100-200ppm chlorine sanitization every <strong>4 hours</strong>.</span>
              <span className="font-mono text-emerald-400 text-[10px]">3-Compartment Sink</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SOP 5: INTEGRATED PEST MANAGEMENT (IKQA-SOP#003 & IKQAP#006)
         ========================================================================= */}
      {activeSection === 'pest' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bug className="w-4 h-4 text-emerald-400" />
              <span>IPM 3 Lines of Defense (IKQA-SOP#003)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                  Line 1: Exclusion
                </span>
                <h4 className="text-xs font-bold text-white">Physical Barriers</h4>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  <li>• <strong>Door Sweeps:</strong> Maximum <strong>6mm (0.25in)</strong> gap under exterior doors.</li>
                  <li>• <strong>Window Screens:</strong> 16-mesh minimum on all openable kitchen windows.</li>
                  <li>• <strong>Air Curtains:</strong> MUST run continuously during goods intake.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
                  Line 2: Restriction
                </span>
                <h4 className="text-xs font-bold text-white">Clearance Distances</h4>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  <li>• <strong>Floor Clearance:</strong> Minimum <strong>15cm (6in)</strong> off the floor.</li>
                  <li>• <strong>Wall Clearance:</strong> Minimum <strong>45cm (18in)</strong> away from perimeter walls.</li>
                  <li>• <strong>Zero Standing Water:</strong> Squeegee drains dry after every rush.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  Line 3: Elimination
                </span>
                <h4 className="text-xs font-bold text-white">Traps & Certified PCO</h4>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  <li>• <strong>EFK Bug Zappers:</strong> Placed <strong>2 to 3 meters</strong> away from exposed food.</li>
                  <li>• <strong>No Toxic Baits:</strong> Open chemical bait prohibited in food prep lines.</li>
                  <li>• <strong>Monthly PCO:</strong> Certified pest control technician audit & flush.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-red-950/40 border border-red-700/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300">PEST SIGHTING ACTION:</strong> Log the exact location, time, and pest species in the <strong>IQAF-PST Pest Sighting Log</strong> within 15 minutes. Cordon off the affected storage zone, discard exposed unpackaged foods, and notify the QA Specialist immediately.
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SOP 6: WASTE MANAGEMENT & REJECT PULVERIZATION (IKQA-SOP#009)
         ========================================================================= */}
      {activeSection === 'waste' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-emerald-400" />
              <span>Color-Coded Waste Segregation (RA 9003 & IKQA-SOP#009)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/50 space-y-1">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block" />
                <h4 className="text-xs font-bold text-white">🟢 Green Bin</h4>
                <span className="text-[10px] text-emerald-300 font-bold block">Biodegradable</span>
                <p className="text-[11px] text-slate-400">Vegetable trimmings, cooked hotpot broth residue, food scraps.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-blue-800/50 space-y-1">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block" />
                <h4 className="text-xs font-bold text-white">🔵 Blue Bin</h4>
                <span className="text-[10px] text-blue-300 font-bold block">Recyclable</span>
                <p className="text-[11px] text-slate-400">Clean cardboard, beverage cans, plastic sauce jugs (rinsed).</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-700/50 space-y-1">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-400 inline-block" />
                <h4 className="text-xs font-bold text-white">⚫ Black Bin</h4>
                <span className="text-[10px] text-slate-300 font-bold block">Residual / General</span>
                <p className="text-[11px] text-slate-400">Soiled wrappers, used napkins, single-use sanitary towels.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-amber-800/50 space-y-1">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 inline-block" />
                <h4 className="text-xs font-bold text-white">🟡 Yellow Bin</h4>
                <span className="text-[10px] text-amber-300 font-bold block">Hazardous / Special</span>
                <p className="text-[11px] text-slate-400">Chemical bottles, expired sanitizer test strips, broken glass.</p>
              </div>
            </div>
          </div>

          {/* Rejection Mechanical Destruction Protocol */}
          <div className="p-4 bg-red-950/40 border border-red-700/50 rounded-2xl space-y-2 text-xs">
            <h4 className="text-xs font-bold text-red-300 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Mandatory Food Reject Pulverization Protocol</span>
            </h4>
            <p className="text-slate-200 leading-relaxed">
              To prevent illegal salvaging, resale, or pilferage of rejected food goods:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-200 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <strong className="text-amber-400 block mb-0.5">1. Mechanically Crush</strong>
                <span>Puncture, cut, or pulverize spoiled or recalled food products.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <strong className="text-cyan-400 block mb-0.5">2. Douse with Sanitizer</strong>
                <span>Spray with colored disinfectant to render it 100% inedible.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <strong className="text-red-400 block mb-0.5">3. Deface Branding</strong>
                <span>Slash through company logo, barcodes, and cartons with permanent markers.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SOP 7: HYGIENE & BARE BELOW ELBOWS (IKQA-SOP#002 & #008)
         ========================================================================= */}
      {activeSection === 'hygiene_effects' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Personnel Hygiene & Bare Below Elbows Standards</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-lg">👔</span>
                <h4 className="text-xs font-bold text-white">Bare Below Elbows</h4>
                <p className="text-[11px] text-slate-400">
                  Zero wristwatches, fitness trackers, rings, or bracelets. (One plain smooth wedding band allowed).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-lg">🪒</span>
                <h4 className="text-xs font-bold text-white">Beard Snood Rule</h4>
                <p className="text-[11px] text-slate-400">
                  Facial hair longer than <strong>1.25cm (0.5 inch)</strong> must be 100% contained within an approved beard snood.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-lg">💅</span>
                <h4 className="text-xs font-bold text-white">Nails & Cosmetics</h4>
                <p className="text-[11px] text-slate-400">
                  Short, clean, unpolished nails. False nails, false eyelashes, and loose glitter are strictly prohibited.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-red-800/40 space-y-1">
                <span className="text-lg">📵</span>
                <h4 className="text-xs font-bold text-red-300">Mobile Phone Ban</h4>
                <p className="text-[11px] text-slate-400">
                  Personal cellphones are strictly barred from active prep and cooking lines (high pathogen vector).
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
            <span className="font-bold text-white block">🔒 Staff Locker & Personal Items Protocol (IKQA-SOP#008):</span>
            <p className="leading-relaxed">
              All street clothing, jackets, bags, and medication must remain secured inside designated staff lockers. Personal water tumblers must be transparent, sealable, and kept exclusively at designated employee hydration stations outside the active food prep perimeter.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          SOP 8: RECALL & TRACEABILITY (IKQA-SOP#005 & #007)
         ========================================================================= */}
      {activeSection === 'recall' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Traceability & Product Recall Mandate (IKQA-SOP#005)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
                  2-Hour Target
                </span>
                <h4 className="text-xs font-bold text-white">One Step Back</h4>
                <p className="text-[11px] text-slate-300">
                  Identify supplier name, PO number, delivery invoice, intake batch, and delivery vehicle license in &lt;2 hours.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  2-Hour Target
                </span>
                <h4 className="text-xs font-bold text-white">One Step Forward</h4>
                <p className="text-[11px] text-slate-300">
                  Trace store dispatches, cold storage location, and table POS transaction records in &lt;2 hours.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-red-800/50 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">
                  Mock Recall
                </span>
                <h4 className="text-xs font-bold text-white">4-Hour Drill</h4>
                <p className="text-[11px] text-slate-300">
                  Bi-annual unannounced mock drills must achieve 100% reconciliation of target inventory in &lt;4 hours.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-red-950/40 border border-red-700/50 rounded-xl space-y-1.5 text-xs text-red-200">
            <span className="font-bold text-red-300 block">🛑 Quarantine Cage Protocol:</span>
            <p className="leading-relaxed">
              Suspect recalled inventory must immediately be relocated to the locked Quarantine Cage, physically tagged with high-visibility RED tags stamped <strong>"HOLD - DO NOT USE / FOR RECALL ONLY"</strong>, and documented in the Recall Logbook.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          POLICY 1: TOWEL MANAGEMENT MATRIX (IKQAP#015)
         ========================================================================= */}
      {activeSection === 'towels' && (
        <div className="space-y-3">
          <div className="p-3 bg-red-950/40 border border-red-700/50 rounded-xl flex items-start gap-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300">STRICT CROSS-CONTAMINATION RULE:</strong> A single incident of a Red (Restroom) or Green (Kitchen) towel crossing into White (Wares) or Blue (FOH) zones constitutes an immediate major health code breach.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                color: 'White',
                border: 'border-slate-300/40',
                bg: 'bg-slate-100 text-slate-950',
                badge: 'bg-slate-800 text-white',
                title: 'Clean Wares & Cutlery',
                desc: 'Reserved exclusively for handling, polishing, or drying clean sanitized smallwares, glassware, cutlery, and cooking utensils.',
                caution: 'Must NEVER contact raw food or uncleaned surfaces.',
              },
              {
                color: 'Yellow',
                border: 'border-yellow-500/40',
                bg: 'bg-yellow-400 text-yellow-950',
                badge: 'bg-yellow-900 text-yellow-200',
                title: 'Handwashing Stations',
                desc: 'Strictly for dedicated employee handwashing sinks. Used solely for drying clean hands or wiping sink basin perimeter.',
                caution: 'Never used on dining tables or food prep boards.',
              },
              {
                color: 'Blue',
                border: 'border-blue-500/40',
                bg: 'bg-blue-600 text-white',
                badge: 'bg-blue-950 text-blue-200',
                title: 'Front of House (FOH)',
                desc: 'Utilized for guest-facing areas: dining tables, host stands, bar counters, booths, and service ledges.',
                caution: 'Maintain clean deployment; keep discrete from patrons.',
              },
              {
                color: 'Green',
                border: 'border-emerald-500/40',
                bg: 'bg-emerald-600 text-white',
                badge: 'bg-emerald-950 text-emerald-200',
                title: 'Kitchen & Prep Lines (BOH)',
                desc: 'Dedicated to general BOH environments, hot line stations, prep tables, and cutting boards.',
                caution: 'Rotate when shifting from vegetable prep to allergen zones.',
              },
              {
                color: 'Red',
                border: 'border-red-600/70',
                bg: 'bg-red-600 text-white',
                badge: 'bg-red-950 text-red-200',
                title: 'Restrooms & Sanitation ONLY',
                desc: 'Strictly confined to restroom facilities for cleaning toilets, sinks, fixtures, or vanity surfaces.',
                caution: 'UNDER NO CIRCUMSTANCE MAY A RED TOWEL LEAVE RESTROOM.',
              },
            ].map((towel, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full shadow-md ${towel.bg}`} />
                    <h4 className="text-sm font-bold text-white">{towel.color} Towel</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${towel.badge}`}>
                    {towel.title}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{towel.desc}</p>
                <div className="text-[11px] font-semibold text-amber-300/90 pt-1 border-t border-slate-800/80">
                  ⚠️ {towel.caution}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white block">Thermal Laundering Protocol:</span>
            <p>1. Scrub with industrial detergent at 45°C - 50°C. 2. Submerge in static hot water bath at ≥71°C (160°F) for at least 25 minutes. 3. Hang until 100% bone-dry.</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          POLICY 2 & SOP: CUTTING BOARDS & SERVING PLATES (IKQA-SOP#010)
         ========================================================================= */}
      {activeSection === 'boards' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" />
              <span>Cutting Board Color Code Matrix (IKQA-SOP#010)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { color: 'Red', hex: '#ef4444', food: 'Raw Meat', items: 'Beef, Pork, Lamb' },
                { color: 'Yellow', hex: '#eab308', food: 'Raw Poultry', items: 'Chicken, Turkey, Duck' },
                { color: 'Blue', hex: '#3b82f6', food: 'Raw Seafood', items: 'Fish, Shellfish, Squid' },
                { color: 'Green', hex: '#22c55e', food: 'Produce', items: 'Fresh Vegetables & Fruits' },
                { color: 'Brown', hex: '#a16207', food: 'Cooked Foods & Dairy', items: 'Cooked meats, cheeses, prepared sides' },
                { color: 'White', hex: '#f8fafc', food: 'Allergen-Free Orders', items: 'STRICTLY RESERVED for special allergy orders' },
              ].map((board, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-md flex-shrink-0"
                    style={{
                      backgroundColor: board.hex,
                      color: board.color === 'White' || board.color === 'Yellow' ? '#0f172a' : '#ffffff',
                    }}
                  >
                    {board.color.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block">{board.food}</span>
                    <span className="text-[11px] text-slate-400 truncate block">{board.items}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meat Serving Plates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Meat Serving Plate Color Matrix (IKQA-SOP#010 Section 5.3)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Guarantees zero confusion between guest tables and prevents raw juice cross-contact:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="w-7 h-7 rounded-full bg-red-600 border-2 border-slate-950 shadow" />
                  <span className="w-7 h-7 rounded-full bg-yellow-500 border-2 border-slate-950 shadow" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">US Beef</span>
                  <span className="text-[10px] text-red-400 font-mono">Red & Yellow Plates</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="w-7 h-7 rounded-full bg-amber-800 border-2 border-slate-950 shadow" />
                  <span className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-slate-950 shadow" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Pork Belly</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Brown & Green Plates</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-orange-500 border-2 border-slate-950 shadow" />
                <div>
                  <span className="text-xs font-bold text-white block">Angus Beef</span>
                  <span className="text-[10px] text-orange-400 font-mono">Orange Plates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POLICY 3: TEMPERATURES & COLD CHAIN (IKQAP#001 & #003)
         ========================================================================= */}
      {activeSection === 'temperatures' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <span>Critical Temperature Thresholds (IKQAP#001 & #003)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50">
                <span className="text-[10px] uppercase font-bold text-cyan-300 block">Frozen Storage</span>
                <span className="text-lg font-black text-cyan-200 block">-18°C or below</span>
                <span className="text-[10px] text-slate-400">Zero ice crystals or wet boxes</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50">
                <span className="text-[10px] uppercase font-bold text-blue-300 block">Cold Storage & Receiving</span>
                <span className="text-lg font-black text-blue-200 block">4°C - 5°C or below</span>
                <span className="text-[10px] text-slate-400">Vertical fridge 3°C - 5°C</span>
              </div>

              <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/60">
                <span className="text-[10px] uppercase font-bold text-red-300 block">Temperature Danger Zone</span>
                <span className="text-lg font-black text-red-400 block">5°C to 60°C</span>
                <span className="text-[10px] text-red-200 font-bold">MAX 1 HOUR cumulative!</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Kill Step / Cooked-Only</span>
                <span className="text-lg font-black text-amber-300 block">74°C (165°F)</span>
                <span className="text-[10px] text-slate-400">Internal core thermal target</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">The 15-Minute Intake Rule</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All accepted refrigerated and frozen deliveries must be transferred from the loading dock into deep cold storage within <strong>15 minutes of truck arrival</strong>.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">The 30-Minute Batch Prepping Rule</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                During production, kitchen staff can only remove from refrigeration the exact amount of food that can be realistically prepped within a <strong>30-minute window</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POLICY 4: BIG 9 ALLERGENS (IKQAP#004)
         ========================================================================= */}
      {activeSection === 'allergens' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>The 9 Major Allergens (FDA & CODEX - IKQAP#004)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: 'Milk / Dairy', icon: '🥛', examples: 'Cheese, butter, cream' },
                { name: 'Eggs', icon: '🥚', examples: 'Egg noodles, mayonnaise' },
                { name: 'Fish', icon: '🐟', examples: 'Fish sauce, broth, fillet' },
                { name: 'Shellfish', icon: '🦐', examples: 'Shrimp, crab, lobster, clams' },
                { name: 'Tree Nuts', icon: '🌰', examples: 'Almonds, cashews, walnuts' },
                { name: 'Peanuts', icon: '🥜', examples: 'Peanut dipping sauce, oils' },
                { name: 'Wheat / Gluten', icon: '🌾', examples: 'Wheat noodles, flour batter' },
                { name: 'Soybeans', icon: '🌱', examples: 'Tofu, soy sauce, bean paste' },
                { name: 'Sesame', icon: '🫘', examples: 'Sesame oil, dipping paste' },
              ].map((all, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-purple-900/40">
                  <div className="text-lg">{all.icon}</div>
                  <span className="text-xs font-bold text-white block mt-1">{all.name}</span>
                  <span className="text-[10px] text-slate-400 block">{all.examples}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-red-300 uppercase tracking-wide">
              Anaphylaxis Emergency Response (IKQAP#004 Section 7)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-red-400 block mb-1">1. Call EMS</span>
                <p className="text-slate-300">Dial 911 / emergency services immediately.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">2. Notify Manager</span>
                <p className="text-slate-300">Alert Shift and Restaurant Manager on duty.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">3. Keep Stationary</span>
                <p className="text-slate-300">Do not move the guest if dizzy or fainting.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">4. Secure Food</span>
                <p className="text-slate-300">Keep plate for lab testing; DO NOT discard.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POLICY 5: 5S STORAGE HIERARCHY (IKQAP#011)
         ========================================================================= */}
      {activeSection === 'storage' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Upright Chiller Vertical Shelf Hierarchy (IKQAP#011)</span>
            </h3>

            {/* Visual Rack Illustration */}
            <div className="space-y-2 pt-1">
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-300">TOP SHELVES (Ready-to-Eat / Cooked)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200">Zero Raw Juices</span>
                </div>
                <p className="text-xs text-slate-300">
                  Cooked broths, dipping sauce blends, condiments, and pre-portioned cooked side items in clear, tightly sealed lidded plastic boxes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-300">MIDDLE SHELVES (Fresh Produce & Leafy Greens)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900 text-blue-200">Airflow baskets</span>
                </div>
                <p className="text-xs text-slate-300">
                  Washed and portioned vegetables organized into uniform, perforated plastic baskets to allow air circulation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-300">LOWER SHELVES / DEDICATED (Raw Proteins)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900 text-red-200">Bottom Racks Only</span>
                </div>
                <p className="text-xs text-slate-300">
                  Raw sliced meats, hotpot meatballs, raw seafood. NEVER placed above cooked items or raw vegetables.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-700 text-center text-xs text-amber-400 font-semibold">
                ⬇️ FLOOR CLEARANCE: Minimum 6 inches (15 cm) from ground. Nothing sits directly on floor!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POLICY 6: CALIBRATION TOLERANCES (IKQAP#020)
         ========================================================================= */}
      {activeSection === 'calibration' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Daily Pre-Shift Calibration Checks (IKQAP#020)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-300 block">🧊 Ice-Point Method (Cold Verification)</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Place probe directly into center of crushed ice water bath.<br />
                  2. Keep submerged for 30 seconds without touching container sides.<br />
                  3. Display must read <strong>0°C (32°F) ± 2°C</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-300 block">🔥 Boiling-Point Method (Hot Verification)</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Place probe into boiling water.<br />
                  2. Keep submerged for 30 seconds without touching sides.<br />
                  3. Display must read <strong>100°C (212°F) ± 2°C</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <strong className="text-white block mb-1">Correction Factor Calculation:</strong>
              <code>{'{Actual Measurement} = {Equipment Reading} - {Highest Error in Reading}'}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
