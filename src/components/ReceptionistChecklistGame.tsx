import React, { useState, useEffect, useMemo } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  UserCheck,
  MessageSquare,
  AlertTriangle,
  Award,
  ChevronRight,
  Receipt,
  CheckSquare,
  ArrowRight,
  Sparkles,
  FileText,
} from 'lucide-react';
import { TrainingCertificateModal } from './TrainingCertificateModal';

interface ReceptionistChecklistGameProps {
  documents: FoodSafetyDoc[];
  staffName: string;
  staffPosition?: string;
  staffBranch?: string;
  onOpenDoc: (doc: FoodSafetyDoc) => void;
  initialFocusDoc?: FoodSafetyDoc | null;
}

interface SimulationStep {
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

const SIMULATION_SCENARIOS: SimulationStep[] = [
  {
    id: 'step-1',
    stageLabel: 'STAGE 1',
    scenarioTitle: 'Walk-In Guest Arrival',
    guestAvatar: '👨‍👩‍👧‍👦',
    guestName: 'Ms. Reyes & Family (5 Pax)',
    guestContext: 'Walk-in guests arriving at the reception podium on a Wednesday afternoon.',
    guestDialogue: '"Good afternoon! Table for 5, please. We’ve eaten at your Makati branch before!"',
    taskPrompt:
      'Select the exact compliant greeting and response for this guest arrival:',
    options: [
      {
        id: '1a',
        scriptOrAction:
          '"Xie xie! Welcome to Jiang Nan! Have you reserved a table with us today po?" → Respond: "Please wait while we prepare your bill."',
        isCorrect: false,
        feedback:
          'Incorrect. "Xie xie" is used upon departure, not arrival. Task 1.1 requires greeting with "Ni Hao! Welcome to Jiang Nan! Is this your first time dining with us po?" and replying "Welcome back po!" to returning guests.',
      },
      {
        id: '1b',
        scriptOrAction:
          '"Ni Hao! Welcome to Jiang Nan! Is this your first time dining with us po?" → Respond: "Welcome back po!"',
        isCorrect: true,
        feedback:
          'Correct! Task 1.1 requires greeting every guest warmly with "Ni Hao! Welcome to Jiang Nan! Is this your first time dining with us po?" and replying "Welcome back po!" to returning guests.',
      },
      {
        id: '1c',
        scriptOrAction:
          '"Ni Hao! Welcome to Jiang Nan! How many heads are dining today po?" → Respond: "Enjoy your meal po!"',
        isCorrect: false,
        feedback:
          'Incorrect. You omitted the mandatory first-time/returning guest verification question and the "Welcome back po!" response.',
      },
      {
        id: '1d',
        scriptOrAction:
          '"Good afternoon po! Welcome to Jiang Nan Hotpot & Grill! Please follow me to your table right away."',
        isCorrect: false,
        feedback:
          'Incorrect. You skipped the standard "Ni Hao!" script, first-time inquiry, and guest details/table verification.',
      },
    ],
  },
  {
    id: 'step-2',
    stageLabel: 'STAGE 2',
    scenarioTitle: 'Guest Details & Full Seating Protocol',
    guestAvatar: '👨‍👩‍👧‍👦',
    guestName: 'Ms. Reyes & Family (5 Pax)',
    guestContext: 'All 6-seater tables are currently occupied for approximately the next 15 minutes.',
    guestDialogue: '"Oh, are there any tables open right now for the 5 of us?"',
    taskPrompt:
      'Which guest details and waitlist actions must you complete at this point?',
    options: [
      {
        id: '2a',
        scriptOrAction:
          'Confirm Name, Pax (5), & Contact Number; accept Cash or GCash only; log on the waitlist without an estimated time and ask them to return when called.',
        isCorrect: false,
        feedback:
          'Incorrect. You must confirm preferred mode of payment (Cash, Credit Card, Debit Card, or GCash), state the estimated waiting time, and hand them the menu.',
      },
      {
        id: '2b',
        scriptOrAction:
          'Confirm Pax (5) and Soup Base choice upfront; collect a ₱500 reservation deposit; and seat them at two separate 2-seater tables immediately.',
        isCorrect: false,
        feedback:
          'Incorrect. No deposit is collected at the waitlist podium; you must verify Name, Pax, and Preferred Payment Mode, record on the approved waitlist, and provide the estimated wait time and menu.',
      },
      {
        id: '2c',
        scriptOrAction:
          'Confirm Name, Pax (5), & Preferred Mode of Payment (Cash, Credit Card, Debit Card, or GCash). Record on the approved waitlist, state the estimated waiting time, hand them the menu, explain policies/reminders, and monitor waiting guests.',
        isCorrect: true,
        feedback:
          'Correct! Section II requires confirming name, pax, and preferred mode of payment (Cash, Credit, Debit, or GCash), logging them on the waitlist with estimated wait time, handing the menu, and monitoring waiting guests.',
      },
      {
        id: '2d',
        scriptOrAction:
          'Confirm Name, Pax (5), & Preferred Mode of Payment (Cash or Credit Card only). Hand them the Bill Out form to fill out themselves while waiting.',
        isCorrect: false,
        feedback:
          'Incorrect. Debit Card and GCash are also accepted payment modes, and the Receptionist—not the guest—completes the Bill Out form.',
      },
    ],
  },
  {
    id: 'step-3',
    stageLabel: 'STAGE 3',
    scenarioTitle: 'Weekend Dinner Rate Inquiry',
    guestAvatar: '🧑🏻‍💼',
    guestName: 'Mr. Tan (Saturday Walk-In, 2 Pax)',
    guestContext: 'Saturday evening dinner service. Mr. Tan asks about the rates and what happens if they only want Hotpot.',
    guestDialogue: '"How much is your rate today (Saturday), and how much if we only avail Hotpot without the grill?"',
    taskPrompt:
      'Select the compliant rate presentation and upgrade offer for this Saturday inquiry:',
    options: [
      {
        id: '3a',
        scriptOrAction:
          'Lead with Hotpot with Grill at ₱899/person (+5% service charge). Since the guest asked for Hotpot-only, state the rate is ₱699 (Grill is ₱200), and offer the Premium Meat Selection upgrade for +₱200/person.',
        isCorrect: false,
        feedback:
          'Incorrect. ₱899 (and ₱699 Hotpot-only) is the Weekday rate. On weekends, Hotpot with Grill is ₱999 (+5% SC) and Hotpot-only is ₱799.',
      },
      {
        id: '3b',
        scriptOrAction:
          'Lead with Hotpot with Grill at ₱999/person (+10% service charge). State that Hotpot-only is ₱699 on weekends (Grill is ₱300), and offer the Premium Meat Selection upgrade for +₱250/person.',
        isCorrect: false,
        feedback:
          'Incorrect. Service charge is 5% (not 10%), Weekend Hotpot-only is ₱799 with ₱200 Grill, and Premium Meat upgrade is +₱200/person.',
      },
      {
        id: '3c',
        scriptOrAction:
          'Present both Hotpot-only (₱799) and Hotpot with Grill (₱999) upfront at the same time (+5% service charge), and offer the Premium Meat Selection upgrade for +₱150/person.',
        isCorrect: false,
        feedback:
          'Incorrect. You must always lead with the Hotpot with Grill Package first (only stating the Hotpot-only rate when asked), and the Premium Meat upgrade is +₱200/person.',
      },
      {
        id: '3d',
        scriptOrAction:
          'Lead with Hotpot with Grill at ₱999/person on weekends (+5% service charge). Since the guest asked for Hotpot-only, state the Weekend Hotpot-only rate is ₱799 (Grill is ₱200). Also offer the Premium Meat Selection upgrade for +₱200/person.',
        isCorrect: true,
        feedback:
          'Correct! Always lead with Hotpot with Grill (₱899 Weekday / ₱999 Weekend + 5% service charge). Only state Hotpot-only when asked (₱699 Weekday / ₱799 Weekend, Grill ₱200), and offer the +₱200/person Premium Meat Selection upgrade.',
      },
    ],
    billOutCheck: {
      label: 'Bill Out Form — Weekend Package Entry:',
      correctValue: '₱999/pax + 5% SC (or ₱799 Hotpot-only if requested)',
      choices: [
        '₱899/pax + 5% SC (or ₱699 Hotpot-only if requested)',
        '₱999/pax + 5% SC (or ₱799 Hotpot-only if requested)',
        '₱999/pax + 10% SC (or ₱699 Hotpot-only if requested)',
      ],
    },
  },
  {
    id: 'step-4',
    stageLabel: 'STAGE 4',
    scenarioTitle: 'Dietary & Allergy Disclosure',
    guestAvatar: '👩🏻‍🦱',
    guestName: 'Ms. Reyes (Dine-In Table 8)',
    guestContext: 'During menu introduction, Ms. Reyes mentions her son has a severe shrimp and shellfish allergy.',
    guestDialogue: '"My son is allergic to shrimp and shellfish. How do you make sure the server and kitchen know?"',
    taskPrompt:
      'What is the required procedure for handling this guest allergy disclosure?',
    options: [
      {
        id: '4a',
        scriptOrAction:
          'Refer to the approved Allergen Information / Allergen Guide (never provide unverified info), and write the specific allergen directly on the Bill Out form so it is visible when endorsed to the Server.',
        isCorrect: true,
        feedback:
          'Correct! Task 3.5 strictly requires referring to the approved Allergen Guide, never giving unverified answers, and writing the specific allergen on the Bill Out form for the Server.',
      },
      {
        id: '4b',
        scriptOrAction:
          'Refer to the approved Allergen Guide, log the allergen on the Waitlist Sheet only, and instruct the guest to inform the Server once seated at the table.',
        isCorrect: false,
        feedback:
          'Incorrect. Logging on the waitlist alone is not enough—you must write the specific allergen directly on the Bill Out form and verbally endorse it to the Server.',
      },
      {
        id: '4c',
        scriptOrAction:
          'Ask the guest to sign an Outside Food Waiver Form for their allergy and verbally tell the Cashier before seating the group.',
        isCorrect: false,
        feedback:
          'Incorrect. The Outside Food Waiver Form is for outside food brought in by guests, not for in-house allergen screening. Allergens must be verified via the Allergen Guide and written on the Bill Out form.',
      },
      {
        id: '4d',
        scriptOrAction:
          'Advise the guest from memory which broths are shellfish-free and mark a star symbol on the Additional Order Form.',
        isCorrect: false,
        feedback:
          'Incorrect. Never provide unverified allergen information from memory, and always write the specific allergen on the Bill Out form.',
      },
    ],
    billOutCheck: {
      label: 'Bill Out Form — Allergen Documentation:',
      correctValue: 'Write specific allergen ("Shrimp/Shellfish") on Bill Out form',
      choices: [
        'Write specific allergen ("Shrimp/Shellfish") on Waitlist form only',
        'Write specific allergen ("Shrimp/Shellfish") on Additional Order Form',
        'Write specific allergen ("Shrimp/Shellfish") on Bill Out form',
      ],
    },
  },
  {
    id: 'step-5',
    stageLabel: 'STAGE 5',
    scenarioTitle: 'Group Celebration & ID Inquiry',
    guestAvatar: '🎂',
    guestName: 'Lolo Ernesto & Family Group',
    guestContext: 'The group has 1 birthday celebrant (celebrating within her birth month, not exact birthday) and Lolo Ernesto with a valid Senior Citizen ID.',
    guestDialogue: '"It’s my daughter’s birth month (her birthday was last week), and I have my Senior Citizen ID! How do both promos work?"',
    taskPrompt:
      'Select the accurate explanation for both the Birthday Promo and Senior Citizen / PWD discount:',
    options: [
      {
        id: '5a',
        scriptOrAction:
          'Birthday Promo: Exact birthday needs 3 paying guests (+1 free), while Birth Month needs 4 paying guests (+1 free). Senior/PWD: 20% discount plus 12% VAT exemption applies to the package rate.',
        isCorrect: false,
        feedback:
          'Incorrect. Exact birthday requires 4 paying guests and Birth Month requires 5 paying guests (+1 celebrant free). For Senior/PWD, only the 12% VAT component is deducted because the rate already reflects an unlimited dining promotion.',
      },
      {
        id: '5b',
        scriptOrAction:
          'Birthday Promo: Exact birthday today needs 4 paying guests (+1 celebrant FREE), while within Birth Month needs 5 paying guests (+1 celebrant FREE) with valid ID. Senior/PWD: Only the 12% VAT component is deducted because our rate already reflects an unlimited dining promotion. Verify IDs & endorse to Bill Out form.',
        isCorrect: true,
        feedback:
          'Correct! Exact birthday = 4 paying + 1 free; Birth month = 5 paying + 1 free. For Senior/PWD, only the 12% VAT component is deducted since the rate is already an unlimited dining promotion. Both must be verified with valid IDs and noted on the Bill Out form.',
      },
      {
        id: '5c',
        scriptOrAction:
          'Birthday Promo: Both Exact Birthday and Birth Month require 5 paying guests (+1 celebrant FREE) with valid ID. Senior/PWD: Only the 12% VAT component is deducted from the unlimited promo rate.',
        isCorrect: false,
        feedback:
          'Incorrect. Exact birthday requires 4 paying guests (+1 free), whereas celebrating within the Birth Month requires 5 paying guests (+1 free).',
      },
      {
        id: '5d',
        scriptOrAction:
          'Birthday Promo: Exact birthday needs 4 paying guests (+1 free), while Birth Month needs 5 paying guests (+1 free). Senior/PWD: 5% service charge is waived instead of VAT deduction.',
        isCorrect: false,
        feedback:
          'Incorrect. For Senior Citizen and PWD cardholders, the 12% VAT component is deducted (not the 5% service charge).',
      },
    ],
    billOutCheck: {
      label: 'Bill Out Form — Promo & Discount Endorsement:',
      correctValue: 'Birth Month (5 Paying + 1 Free, ID Verified) & Senior ID (12% VAT Deduction)',
      choices: [
        'Birth Month (4 Paying + 1 Free, ID Verified) & Senior ID (12% VAT Deduction)',
        'Birth Month (5 Paying + 1 Free, ID Verified) & Senior ID (20% Promo Discount)',
        'Birth Month (5 Paying + 1 Free, ID Verified) & Senior ID (12% VAT Deduction)',
      ],
    },
  },
  {
    id: 'step-6',
    stageLabel: 'STAGE 6',
    scenarioTitle: 'Soup Base & First Order Inquiry',
    guestAvatar: '🍲',
    guestName: 'Ms. Reyes & Family (Table 8)',
    guestContext: 'One guest avoids pork and asks which soup bases are pork-free, how many soup flavors they can choose, and how many meat plates are in the initial order.',
    guestDialogue: '"Which of your soup bases has NO pork? How many soup flavors can we pick, and how many meat plates can we get on our first round?"',
    taskPrompt:
      'Which response accurately states the soup base composition, flavor limit, initial meat limit, and inclusions?',
    options: [
      {
        id: '6a',
        scriptOrAction:
          'All soup bases are pork-based EXCEPT the Tomato Soup and Mushroom Soup. You may choose up to two (2) soup flavors per table and up to four (4) plates of meat for the initial order.',
        isCorrect: false,
        feedback:
          'Incorrect. All soup bases are pork-based EXCEPT the Mushroom Soup only, and the initial order is up to three (3) plates of meat.',
      },
      {
        id: '6b',
        scriptOrAction:
          'All soup bases are beef-based EXCEPT the Plain Pork Bone Soup. You may choose up to two (2) soup flavors per table and up to three (3) plates of meat for the initial order.',
        isCorrect: false,
        feedback:
          'Incorrect. All soup bases are pork-based except the Mushroom Soup.',
      },
      {
        id: '6c',
        scriptOrAction:
          'All soup bases are pork-based EXCEPT the Mushroom Soup. You may choose up to two (2) soup flavors per table. For the initial order, you may choose up to three (3) plates of meat (reorders anytime via the Additional Order Form on the table). Desserts and beverages are unlimited and included.',
        isCorrect: true,
        feedback:
          'Correct! All soup bases are pork-based except Mushroom Soup; max 2 soup flavors per table; up to 3 plates of meat for the initial order; reorders anytime via Additional Order Form; unlimited desserts and beverages.',
      },
      {
        id: '6d',
        scriptOrAction:
          'All soup bases are pork-based EXCEPT the Mushroom Soup. You may choose up to three (3) soup flavors per table and up to two (2) plates of meat for the initial order. Beverages are unlimited, while desserts are limited to 1 serving.',
        isCorrect: false,
        feedback:
          'Incorrect. Guests may choose up to two (2) soup flavors per table, up to three (3) plates of meat for the initial order, and both desserts and beverages are unlimited.',
      },
    ],
  },
  {
    id: 'step-7',
    stageLabel: 'STAGE 7',
    scenarioTitle: 'House Policies & Outside Cake',
    guestAvatar: '🍰',
    guestName: 'Ms. Reyes & Family',
    guestContext: 'The family is holding a birthday cake from an outside bakery and asks about house rules before being seated.',
    guestDialogue: '"Can we bring this birthday cake inside to our table? And what are your house rules on dining time and leftovers?"',
    taskPrompt:
      'Select the compliant house guidelines to communicate to the guest:',
    options: [
      {
        id: '7a',
        scriptOrAction:
          'Dining time is up to three (3) hours. Excessive leftovers incur a ₱500 charge per table, and outside cakes are allowed after completing the Updated Outside Food Waiver Form.',
        isCorrect: false,
        feedback:
          'Incorrect. Dining time is up to two (2) hours and the excessive leftover charge is ₱1,000.',
      },
      {
        id: '7b',
        scriptOrAction:
          'Dining time is up to two (2) hours. Excessive leftovers incur a ₱500 charge per person, and outside food is allowed after signing the Bill Out form.',
        isCorrect: false,
        feedback:
          'Incorrect. Excessive leftovers incur a ₱1,000 charge, and guests must complete the Updated Outside Food Waiver Form for outside food.',
      },
      {
        id: '7c',
        scriptOrAction:
          'Dining time is up to two (2) hours. We observe a No Leftover Policy where excessive leftovers incur a ₱1,000 charge. Outside food is not allowed inside the dining room under any circumstances.',
        isCorrect: false,
        feedback:
          'Incorrect. Outside food is permitted provided the guest completes the Updated Outside Food Waiver Form.',
      },
      {
        id: '7d',
        scriptOrAction:
          'Dining time is up to two (2) hours. We observe a No Leftover Policy where excessive leftovers incur a ₱1,000 charge. Outside food is allowed provided you complete our Updated Outside Food Waiver Form before bringing it to the table.',
        isCorrect: true,
        feedback:
          'Correct! Up to 2 hours dining time, ₱1,000 excessive leftover charge, and outside food is allowed once the guest completes the Updated Outside Food Waiver Form.',
      },
    ],
  },
  {
    id: 'step-8',
    stageLabel: 'STAGE 8',
    scenarioTitle: 'Table Seating & Guest Exit',
    guestAvatar: '🧾',
    guestName: 'Table 8 Turnover & Departure',
    guestContext: 'Part A: Table 8 is ready for seating. Part B: After dining, the guests walk toward the exit.',
    guestDialogue: '"Thank you! We’re heading out now!"',
    taskPrompt:
      'Select the procedure that properly executes both the Server Turnover and Guest Departure:',
    options: [
      {
        id: '8a',
        scriptOrAction:
          'Turnover: Escort to ready table & endorse to Server ("Table 8 po, 5 pax, hotpot with grill, with shrimp allergen & birthday/senior request"). Departure: Politely check & stamp OR/Invoice receipt ("May I kindly check your receipt or OR/Invoice before you go?")—if missing, courteously check with Cashier first—then say "Xie xie! Thank you for dining with us at Jiang Nan Hotpot! See us again!"',
        isCorrect: true,
        feedback:
          'Correct! You executed the complete Server endorsement script, verified and stamped the OR/Invoice receipt (with courteous non-accusatory cashier check if missing), and closed with "Xie xie! Thank you for dining with us at Jiang Nan Hotpot! See us again!"',
      },
      {
        id: '8b',
        scriptOrAction:
          'Turnover: Escort to ready table & hand the Bill Out form silently to the Server. Departure: Collect and keep the customer’s original OR/Invoice receipt at the podium and say "Ni Hao! Thank you for coming!"',
        isCorrect: false,
        feedback:
          'Incorrect. You must verbally endorse table number, pax, package, and special requests/allergens to the Server; upon departure, you stamp the OR/Invoice receipt (do not confiscate it) and say "Xie xie! Thank you for dining with us at Jiang Nan Hotpot! See us again!"',
      },
      {
        id: '8c',
        scriptOrAction:
          'Turnover: Endorse the guests to the Cashier before seating. Departure: Stamp the Bill Out form instead of the OR/Invoice receipt, and if missing, ask the guest to return to their table until the Server finds it.',
        isCorrect: false,
        feedback:
          'Incorrect. Guests are endorsed to the assigned Server at the table, and upon departure you verify and stamp the official OR/Invoice receipt (checking courteously with the Cashier first if unavailable).',
      },
      {
        id: '8d',
        scriptOrAction:
          'Turnover: Escort to ready table & endorse to Server. Departure: Only check receipts for Cash transactions (skip Card/GCash guests) and say "Xie xie! Welcome back po!"',
        isCorrect: false,
        feedback:
          'Incorrect. Every departing group’s OR/Invoice receipt must be politely checked and stamped regardless of payment mode, followed by "Xie xie! Thank you for dining with us at Jiang Nan Hotpot! See us again!"',
      },
    ],
  },
];

const SEQUENCE_STEPS = [
  { order: 1, title: 'Initial Greeting and Accommodation' },
  { order: 2, title: 'Guest Details Verification' },
  { order: 3, title: 'Service and Menu Introduction' },
  { order: 4, title: 'Promotions and Special Occasions' },
  { order: 5, title: 'Dining and Ordering Information' },
  { order: 6, title: 'Dining Guidelines and Policies' },
  { order: 7, title: 'Guest Turnover to Service Team' },
  { order: 8, title: 'Guest Departure' },
];

function buildStepsForDoc(doc: FoodSafetyDoc): SimulationStep[] {
  if (doc.customSimulationSteps && doc.customSimulationSteps.length > 0) {
    return doc.customSimulationSteps.map((s, idx) => ({
      id: `${doc.id}-step-${idx + 1}`,
      stageLabel: s.stageLabel || `STAGE ${idx + 1}`,
      scenarioTitle: s.scenarioTitle,
      guestAvatar: s.guestAvatar || '📋',
      guestName: s.guestName || `${doc.category} Audit Scenario`,
      guestContext: s.guestContext || `Active station check for ${doc.code}: ${doc.title}`,
      guestDialogue: s.guestDialogue,
      taskPrompt: s.taskPrompt,
      options: s.options,
      billOutCheck: s.billOutCheck,
    }));
  }

  // Fallback builder from sections / quizQuestions so ANY uploaded document is playable
  if (doc.quizQuestions && doc.quizQuestions.length > 0) {
    return doc.quizQuestions.map((q, idx) => ({
      id: `${doc.id}-qstep-${idx + 1}`,
      stageLabel: `STAGE ${idx + 1}`,
      scenarioTitle: `${doc.code} Protocol #${idx + 1}`,
      guestAvatar: '🧑‍🍳',
      guestName: `QA Auditor — ${doc.category}`,
      guestContext: `Verifying ${doc.code}: ${doc.title}`,
      guestDialogue: `"${q.question}"`,
      taskPrompt: `Select the exact compliant protocol required by ${doc.code}:`,
      options: q.options.map((optText, oIdx) => ({
        id: `${doc.id}-q-${idx}-o-${oIdx}`,
        scriptOrAction: optText,
        isCorrect: oIdx === q.correctAnswer,
        feedback:
          oIdx === q.correctAnswer
            ? `Correct! ${q.explanation}`
            : `Incorrect. ${q.explanation}`,
      })),
    }));
  }

  return doc.sections.map((sec, idx) => {
    const primaryLine = sec.items[0] || sec.content || doc.summary;
    return {
      id: `${doc.id}-sec-${idx + 1}`,
      stageLabel: `STAGE ${idx + 1}`,
      scenarioTitle: sec.heading,
      guestAvatar: '📋',
      guestName: `Station Lead (${doc.category})`,
      guestContext: `Executing ${doc.code} — ${sec.heading}`,
      guestDialogue: `"We are now at ${sec.heading}. What is the mandatory standard under ${doc.code}?"`,
      taskPrompt: `Select the compliant action for ${sec.heading}:`,
      options: [
        {
          id: `${doc.id}-s-${idx}-a`,
          scriptOrAction: primaryLine,
          isCorrect: true,
          feedback: `Correct! Per ${doc.code} (${sec.heading}): ${primaryLine}`,
        },
        {
          id: `${doc.id}-s-${idx}-b`,
          scriptOrAction: `Skip ${sec.heading} during peak hours and log it at closing.`,
          isCorrect: false,
          feedback: `Incorrect. ${doc.code} requires strict real-time execution: ${primaryLine}`,
        },
        {
          id: `${doc.id}-s-${idx}-c`,
          scriptOrAction: `Perform a partial visual check without following ${doc.code} verification.`,
          isCorrect: false,
          feedback: `Incorrect. All steps in ${sec.heading} must be completed in full.`,
        },
      ],
    };
  });
}

export const ReceptionistChecklistGame: React.FC<ReceptionistChecklistGameProps> = ({
  documents,
  staffName,
  staffPosition = 'Front of House Receptionist',
  staffBranch = 'Jiangnan Hotpot - SM Mall of Asia',
  onOpenDoc,
  initialFocusDoc = null,
}) => {
  const customUploadedDocs = useMemo(
    () => documents.filter((d) => d.isCustom),
    [documents]
  );

  // Selected simulation deck: 'default-receptionist' | 'all-combined' | custom doc id
  const [selectedDeckId, setSelectedDeckId] = useState<string>(() => {
    if (initialFocusDoc && initialFocusDoc.code !== 'JNLD-CHK-FOH-REC-001') {
      return initialFocusDoc.id;
    }
    return 'default-receptionist';
  });

  useEffect(() => {
    if (initialFocusDoc) {
      if (initialFocusDoc.code === 'JNLD-CHK-FOH-REC-001') {
        setSelectedDeckId('default-receptionist');
      } else {
        setSelectedDeckId(initialFocusDoc.id);
      }
      setCurrentStepIdx(0);
      setSelectedOptionId(null);
      setSelectedBillOutChoice(null);
      setStepSubmitted(false);
    }
  }, [initialFocusDoc]);

  const activeCustomDoc = useMemo(
    () => documents.find((d) => d.id === selectedDeckId) || null,
    [documents, selectedDeckId]
  );

  const receptionistDoc =
    activeCustomDoc ||
    documents.find((d) => d.code === 'JNLD-CHK-FOH-REC-001') ||
    documents[0];

  const activeScenarios: SimulationStep[] = useMemo(() => {
    if (selectedDeckId === 'default-receptionist') {
      return SIMULATION_SCENARIOS;
    }
    if (selectedDeckId === 'all-combined') {
      const customSteps = customUploadedDocs.flatMap((d) => buildStepsForDoc(d));
      return [...SIMULATION_SCENARIOS, ...customSteps];
    }
    if (activeCustomDoc) {
      const built = buildStepsForDoc(activeCustomDoc);
      return built.length > 0 ? built : SIMULATION_SCENARIOS;
    }
    return SIMULATION_SCENARIOS;
  }, [selectedDeckId, customUploadedDocs, activeCustomDoc]);

  const activeSequenceSteps = useMemo(() => {
    if (selectedDeckId === 'default-receptionist' || selectedDeckId === 'all-combined') {
      return SEQUENCE_STEPS;
    }
    if (activeCustomDoc && activeCustomDoc.sections.length >= 2) {
      return activeCustomDoc.sections.map((sec, idx) => ({
        order: idx + 1,
        title: sec.heading.replace(/^\d+\.\s*/, ''),
      }));
    }
    return activeScenarios.map((step, idx) => ({
      order: idx + 1,
      title: step.scenarioTitle,
    }));
  }, [selectedDeckId, activeCustomDoc, activeScenarios]);

  const [gameMode, setGameMode] = useState<'simulation' | 'sequencer'>('simulation');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedBillOutChoice, setSelectedBillOutChoice] = useState<string | null>(null);
  const [stepSubmitted, setStepSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Sequencer mini-challenge state
  const [shuffledSequence, setShuffledSequence] = useState(() =>
    [...SEQUENCE_STEPS].sort(() => Math.random() - 0.5)
  );
  const [pickedSequence, setPickedSequence] = useState<{ order: number; title: string }[]>([]);
  const [sequenceError, setSequenceError] = useState<string | null>(null);
  const [sequenceCompleted, setSequenceCompleted] = useState(false);

  useEffect(() => {
    setPickedSequence([]);
    setSequenceCompleted(false);
    setSequenceError(null);
    setShuffledSequence([...activeSequenceSteps].sort(() => Math.random() - 0.5));
  }, [activeSequenceSteps]);

  const safeStepIdx = Math.min(currentStepIdx, Math.max(0, activeScenarios.length - 1));
  const currentStep = activeScenarios[safeStepIdx] || SIMULATION_SCENARIOS[0];
  const totalSimSteps = activeScenarios.length;
  const isFinished = Object.keys(completedSteps).length === totalSimSteps;

  const handleSubmitStep = () => {
    if (!selectedOptionId) return;
    if (currentStep.billOutCheck && !selectedBillOutChoice) return;

    const chosenOpt = currentStep.options.find((o) => o.id === selectedOptionId);
    const isOptCorrect = !!chosenOpt?.isCorrect;
    const isBillOutCorrect = currentStep.billOutCheck
      ? selectedBillOutChoice === currentStep.billOutCheck.correctValue
      : true;

    const passedBoth = isOptCorrect && isBillOutCorrect;
    setStepSubmitted(true);

    if (passedBoth && !completedSteps[currentStep.id]) {
      setScore((prev) => prev + 125 + streak * 15);
      setStreak((prev) => prev + 1);
      setCompletedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
    } else if (!passedBoth) {
      setStreak(0);
    }
  };

  const handleNextStep = () => {
    setSelectedOptionId(null);
    setSelectedBillOutChoice(null);
    setStepSubmitted(false);
    if (safeStepIdx < totalSimSteps - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handleResetGame = () => {
    setCurrentStepIdx(0);
    setSelectedOptionId(null);
    setSelectedBillOutChoice(null);
    setStepSubmitted(false);
    setScore(0);
    setStreak(0);
    setCompletedSteps({});
    setPickedSequence([]);
    setSequenceCompleted(false);
    setSequenceError(null);
    setShuffledSequence([...activeSequenceSteps].sort(() => Math.random() - 0.5));
  };

  const handlePickSequenceItem = (item: { order: number; title: string }) => {
    const expectedNext = activeSequenceSteps[pickedSequence.length];
    if (expectedNext && item.order === expectedNext.order) {
      const nextPicked = [...pickedSequence, item];
      setPickedSequence(nextPicked);
      setSequenceError(null);
      if (nextPicked.length === activeSequenceSteps.length) {
        setSequenceCompleted(true);
        setScore((prev) => prev + 250);
      }
    } else {
      setSequenceError(
        'Incorrect sequence! That stage does not come next in the official station workflow. Try again.'
      );
      setStreak(0);
    }
  };

  const currentOpt = currentStep.options.find((o) => o.id === selectedOptionId);
  const billOutCorrect = currentStep.billOutCheck
    ? selectedBillOutChoice === currentStep.billOutCheck.correctValue
    : true;
  const stepPassed = !!currentOpt?.isCorrect && billOutCorrect;

  return (
    <div className="space-y-4 pb-8">
      {/* Top Hero Header */}
      <div className="bg-gradient-to-br from-amber-950/90 via-slate-900 to-red-950/80 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <ClipboardCheck className="w-3 h-3" />
                Station Checklist Simulator
              </span>
              <span className="font-mono text-xs font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                {activeCustomDoc ? `${activeCustomDoc.code} (Master Uploaded)` : 'JNLD-CHK-FOH-REC-001 (Ver. 2)'}
              </span>
              {customUploadedDocs.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  +{customUploadedDocs.length} Master Uploaded Deck{customUploadedDocs.length > 1 ? 's' : ''} Active
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {activeCustomDoc
                ? `${activeCustomDoc.title} — Interactive Station Simulator`
                : 'Receptionist Station Master: Guest Journey & Script Challenge'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {activeCustomDoc
                ? `${activeCustomDoc.summary} Complete all ${totalSimSteps} interactive station simulation stages.`
                : 'Complete all 8 Front-of-House Receptionist stages from memory without hints or clues. Select the exact standard scripts, policy mechanics, and Bill Out form endorsements.'}
            </p>
          </div>

          {/* Score & Progress */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Hospitality Score</div>
              <div className="text-base font-black text-amber-400 flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                {score} pts
              </div>
            </div>
            <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Stages Cleared</div>
              <div className="text-base font-black text-emerald-400">
                {Object.keys(completedSteps).length}/{totalSimSteps}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Station Deck Selector (Includes Official Receptionist + Any Master-Uploaded SOP/Policy/Guide/Checklist) */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold mr-1">
            Select Station Deck:
          </span>
          <button
            onClick={() => {
              setSelectedDeckId('default-receptionist');
              setCurrentStepIdx(0);
              setSelectedOptionId(null);
              setSelectedBillOutChoice(null);
              setStepSubmitted(false);
              setCompletedSteps({});
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedDeckId === 'default-receptionist'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            JNLD-CHK-FOH-REC-001: Receptionist (8 Stages)
          </button>

          {customUploadedDocs.map((cDoc) => (
            <button
              key={cDoc.id}
              onClick={() => {
                setSelectedDeckId(cDoc.id);
                setCurrentStepIdx(0);
                setSelectedOptionId(null);
                setSelectedBillOutChoice(null);
                setStepSubmitted(false);
                setCompletedSteps({});
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                selectedDeckId === cDoc.id
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/40'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {cDoc.code}: {cDoc.title} ({buildStepsForDoc(cDoc).length} Stages)
              </span>
            </button>
          ))}

          {customUploadedDocs.length > 0 && (
            <button
              onClick={() => {
                setSelectedDeckId('all-combined');
                setCurrentStepIdx(0);
                setSelectedOptionId(null);
                setSelectedBillOutChoice(null);
                setStepSubmitted(false);
                setCompletedSteps({});
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedDeckId === 'all-combined'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-slate-950/80 text-amber-300 hover:text-white border border-amber-500/30'
              }`}
            >
              All Station Decks Combined
            </button>
          )}
        </div>

        {/* Mode Switcher Tabs + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGameMode('simulation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'simulation'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>1. Live Station Roleplay ({totalSimSteps} Stages)</span>
            </button>
            <button
              onClick={() => setGameMode('sequencer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'sequencer'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>2. Workflow Sequence Drill {sequenceCompleted ? '✓' : ''}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {receptionistDoc && (
              <button
                onClick={() => onOpenDoc(receptionistDoc)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Read {receptionistDoc.code}</span>
              </button>
            )}
            <button
              onClick={handleResetGame}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: LIVE STATION SIMULATION */}
      {gameMode === 'simulation' && (
        <div className="space-y-4">
          {/* Progress Stepper */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {activeScenarios.map((step, idx) => {
              const done = !!completedSteps[step.id];
              const isCurrent = idx === safeStepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setCurrentStepIdx(idx);
                    setSelectedOptionId(null);
                    setSelectedBillOutChoice(null);
                    setStepSubmitted(false);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                      : done
                      ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>STAGE {idx + 1}</span>
                    {done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] font-bold truncate mt-0.5">
                    {step.scenarioTitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Guest Podium Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {currentStep.stageLabel}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {currentStep.scenarioTitle}
                </h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                Stage {currentStepIdx + 1} of {totalSimSteps}
              </span>
            </div>

            {/* Guest Dialogue Bubble */}
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                {currentStep.guestAvatar}
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">{currentStep.guestName}</span>
                  <span className="text-[11px] text-slate-400">• {currentStep.guestContext}</span>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/50 to-slate-900 border border-amber-700/40 text-amber-100 text-xs sm:text-sm font-medium italic">
                  {currentStep.guestDialogue}
                </div>
              </div>
            </div>

            {/* Task Question Prompt */}
            <div className="space-y-2.5">
              <div className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{currentStep.taskPrompt}</span>
              </div>

              <div className="space-y-2.5">
                {currentStep.options.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const optionLetter = String.fromCharCode(65 + idx);
                  let cardStyle =
                    'bg-slate-950/70 hover:bg-slate-950 border-slate-800 text-slate-200';
                  if (stepSubmitted) {
                    if (opt.isCorrect) {
                      cardStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-100';
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = 'bg-red-950/60 border-red-500 text-red-100';
                    }
                  } else if (isSelected) {
                    cardStyle = 'bg-amber-950/50 border-amber-400 text-white shadow-md';
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={stepSubmitted}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${cardStyle}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700 flex-shrink-0 mt-0.5">
                          {optionLetter}
                        </span>
                        <p className="text-xs sm:text-sm leading-relaxed font-medium">
                          {opt.scriptOrAction}
                        </p>
                      </div>
                      <div className="mt-1 flex-shrink-0">
                        {stepSubmitted ? (
                          opt.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : null
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full border ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400'
                                : 'border-slate-600'
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Bill Out Form Endorsement Sub-Task (if applicable to stage) */}
            {currentStep.billOutCheck && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4" />
                    <span>Receptionist Bill Out Form Endorsement</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-semibold">
                  {currentStep.billOutCheck.label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentStep.billOutCheck.choices.map((choice) => {
                    const isPicked = selectedBillOutChoice === choice;
                    const isRightChoice = choice === currentStep.billOutCheck?.correctValue;
                    let btnClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                    if (stepSubmitted) {
                      if (isRightChoice) {
                        btnClass = 'bg-emerald-950/70 border-emerald-500 text-emerald-200';
                      } else if (isPicked && !isRightChoice) {
                        btnClass = 'bg-red-950/70 border-red-500 text-red-200';
                      }
                    } else if (isPicked) {
                      btnClass = 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold';
                    }

                    return (
                      <button
                        key={choice}
                        disabled={stepSubmitted}
                        onClick={() => setSelectedBillOutChoice(choice)}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${btnClass}`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback Banner after Submission */}
            {stepSubmitted && currentOpt && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  stepPassed
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/50 border-red-500/50 text-red-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  {stepPassed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Standard Met! +125 Hospitality Points</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Checklist Deviation Detected</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed">{currentOpt.feedback}</p>
                {currentStep.billOutCheck && !billOutCorrect && (
                  <p className="text-amber-300 font-semibold">
                    Bill Out Form Note: You must select "{currentStep.billOutCheck.correctValue}" on the Bill Out endorsement slip.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              {!stepSubmitted ? (
                <button
                  onClick={handleSubmitStep}
                  disabled={!selectedOptionId || (!!currentStep.billOutCheck && !selectedBillOutChoice)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Receptionist Response</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {!stepPassed && (
                    <button
                      onClick={() => setStepSubmitted(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry This Stage</span>
                    </button>
                  )}
                  {currentStepIdx < totalSimSteps - 1 && (
                    <button
                      onClick={handleNextStep}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Guest Stage</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {isFinished && (
                <button
                  onClick={() => setIsCertModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Claim Receptionist Station Certificate</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: WORKFLOW SEQUENCER DRILL */}
      {gameMode === 'sequencer' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                {receptionistDoc?.code || 'JNLD-CHK-FOH-REC-001'} • WORKFLOW ORDER DRILL
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                Arrange the {activeSequenceSteps.length} Official Station Workflow Sections in Order
              </h3>
            </div>
            <button
              onClick={() => {
                setPickedSequence([]);
                setSequenceCompleted(false);
                setSequenceError(null);
                setShuffledSequence([...activeSequenceSteps].sort(() => Math.random() - 0.5));
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold self-start cursor-pointer"
            >
              Shuffle Again
            </button>
          </div>

          {sequenceError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{sequenceError}</span>
            </div>
          )}

          {sequenceCompleted && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm text-white">
                    Perfect {activeSequenceSteps.length}-Stage Sequence! (+250 Bonus Points)
                  </div>
                  <p>You have mastered the exact workflow order for {receptionistDoc?.code}.</p>
                </div>
              </div>
              <button
                onClick={() => setGameMode('simulation')}
                className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex-shrink-0 cursor-pointer"
              >
                Back to Roleplay
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Remaining Unordered Tasks */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tap the Next Checklist Section in Order:
              </div>
              {shuffledSequence
                .filter((item) => !pickedSequence.some((p) => p.order === item.order))
                .map((item) => (
                  <button
                    key={item.order}
                    onClick={() => handlePickSequenceItem(item)}
                    className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                    <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  </button>
                ))}
            </div>

            {/* Right: Verified Sequence */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Your Verified Station Sequence ({pickedSequence.length}/{activeSequenceSteps.length}):
              </div>
              <div className="space-y-2 min-h-[240px] p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                {pickedSequence.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-8 text-center">
                    Select the first workflow stage from the left column to begin...
                  </p>
                ) : (
                  pickedSequence.map((item, i) => (
                    <div
                      key={item.order}
                      className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/40 flex items-center gap-2.5 text-xs text-emerald-200"
                    >
                      <span className="font-mono font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Stage {i + 1}
                      </span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal when all stages completed */}
      {receptionistDoc && (
        <TrainingCertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          quizTitle={`${receptionistDoc.code}: ${receptionistDoc.title} — Station Master Simulation`}
          staffName={staffName || 'Station Staff'}
          staffPosition={staffPosition}
          staffBranch={staffBranch}
          score={totalSimSteps}
          totalQuestions={totalSimSteps}
        />
      )}
    </div>
  );
};

