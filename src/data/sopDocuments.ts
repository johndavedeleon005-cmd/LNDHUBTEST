import { FoodSafetyDoc } from '../types/foodSafety';

export const ALL_SOP_DOCUMENTS: FoodSafetyDoc[] = [
  // IKQA-SOP#001 Handwashing
  {
    id: 'ikqa-sop-001',
    code: 'IKQA-SOP#001',
    title: 'Standard Operating Procedure: Handwashing',
    type: 'sop',
    category: 'Uniform & Visitor',
    revision: 2,
    effectiveDate: 'June 22, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_001__Handwashing.docx_04f3bb68.pdf',
    summary:
      'Scientifically validated 6-step hand hygiene methodology lasting 40 to 60 seconds. Mandates the restroom Double Wash Method, strict prohibition of bar soap, critical control points (CCPs), and automatic adulteration/disposal of food handled during hygiene breaches.',
    keyTakeaways: [
      'Six-Step 40–60 Second Technique: Wet hands with potable water -> Apply liquid antimicrobial soap -> Rub vigorously for 20s+ (40–60s total procedure: backs, wrists, webbing, nails) -> Rinse thoroughly -> Dry with paper towel/air dryer -> Turn off tap using towel.',
      'Restroom Double Wash Method: Wash first in restroom immediately after use, then perform a second complete wash at the kitchen handwash station before entering production.',
      'Bar Soap Strictly Prohibited: Only liquid antimicrobial soap in dispensers allowed; bar soap harbors bacterial reservoirs.',
      'Unobstructed Handwash Sinks: Sinks must remain 100% accessible with no boxes or trash bins blocking them; strictly forbidden for food prep or mop water disposal.',
      'Adulterated Food Policy: Any food handled during a hygiene breach is officially contaminated and must be immediately discarded.',
      'Just-In-Time Retraining: Employees observed bypassing handwashing are removed from the floor for immediate retraining and validation before resuming duties.',
    ],
    quickRules: [
      {
        title: '6-Step 40–60s Method',
        rule: 'Wet, apply antimicrobial soap, scrub vigorously (including wrists & nails), rinse, dry with towel, turn off tap with paper (40–60s total).',
        type: 'critical',
      },
      {
        title: 'Restroom Double Wash',
        rule: 'Wash hands inside the comfort room, then wash again at the kitchen sink before touching food.',
        type: 'critical',
      },
      {
        title: 'Exclusivity of Sinks',
        rule: 'Handwashing sinks are for hands ONLY. Never rinse food, dishes, or mop buckets in them.',
        type: 'warning',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'To mandate a scientifically validated hand hygiene methodology that serves as a primary barrier against the introduction and transmission of pathogens within the food handling environment. By standardizing mechanical and chemical actions, it eliminates transient microbial loads (enteric viruses and bacteria) and prevents human-vector contamination across all permanent and contractual employees.',
      },
      {
        id: '2',
        title: '2. Responsibilities',
        content:
          'All Employees: Personally execute the 40–60 second handwashing protocol exactly as prescribed.\nRestaurant Managers: Ensure structural integrity, continuous floor monitoring, and guaranteed 100% provisioning of antimicrobial soap, paper towels, and potable water.',
      },
      {
        id: '3',
        title: '3. The Six (6) Step Handwashing Method (40–60 Seconds)',
        content:
          'Step 1 (Wet Hands): Use clean, running potable water.\nStep 2 (Apply Soap): Use a generous amount of liquid antimicrobial soap (bar soap is strictly banned).\nStep 3 (Scrub): Rub hands vigorously (total handwashing duration of 40–60 seconds). Scrub backs of hands, wrists, between fingers, and under fingernails.\nStep 4 (Rinse): Rinse thoroughly under clean running water to remove all soap and loosened soil.\nStep 5 (Dry): Use a single-use paper towel or high-velocity HEPA electric air dryer.\nStep 6 (Turn Off Tap): Use a single-use paper towel to turn off the faucet and open doors to prevent re-contaminating clean hands.',
      },
      {
        id: '4',
        title: '4. Critical Control Points (Mandatory Handwashing Moments)',
        content: 'Employees must wash hands immediately at these junctures:',
        bulletPoints: [
          'Before starting work or entering the establishment.',
          'After using the restroom (Mandatory Double Wash Method: Wash in restroom, then wash again at kitchen station).',
          'After coughing, sneezing, or blowing nose with a tissue.',
          'After touching hair, face, wounds, or any part of the body.',
          'After handling trash, chemicals, mop buckets, or cleaning tools.',
          'After touching raw produce (especially unwashed root vegetables) before handling RTE sliced produce.',
          'After busing dirty dining tables, handling used plates, glasses, or cutlery.',
          'After taking a break, eating, or smoking/vaping.',
          'After removing soiled gloves, before donning fresh gloves.',
        ],
      },
      {
        id: '5',
        title: '5. Corrective Actions & Contamination Assessment',
        content:
          'Immediate Intervention: Manager removes non-compliant employee from food areas for just-in-time retraining.\nProduct Disposition: If an employee contacts a high-risk surface and touches food without washing, a contamination event is officially declared; all handled food is legally deemed adulterated and discarded immediately.\nSurface Sanitization: All affected preparation surfaces and utensils must be stripped, washed, and sanitized before production resumes.',
      },
      {
        id: '6',
        title: '6. Facility Infrastructure & Multilingual Signage',
        content:
          'Sinks must be completely unobstructed with zero physical barriers. Prominent eye-level "Wash Hands" signage must be posted in all primary languages spoken by staff, supplemented by visual diagrams illustrating the 40–60 second scrubbing technique.',
      },
    ],
    tables: [
      {
        title: 'Six (6) Step Handwashing Protocol (40–60 Second Duration)',
        headers: ['Step', 'Action', 'Standard Description'],
        rows: [
          ['Step 1', 'Wet Hands', 'Use clean, running potable water.'],
          ['Step 2', 'Apply Soap', 'Use generous amount of liquid antimicrobial soap (no bar soap).'],
          ['Step 3', 'Scrub', 'Rub vigorously (40–60s total wash): backs of hands, wrists, between fingers, nails.'],
          ['Step 4', 'Rinse', 'Rinse thoroughly under clean running water to remove soap & soil.'],
          ['Step 5', 'Dry', 'Use single-use paper towel or HEPA electric air dryer.'],
          ['Step 6', 'Turn Off Tap', 'Use paper towel to turn off faucet & open door handle.'],
        ],
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'February 10, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'March 05, 2026', author: 'Marielle Louise Macabale', purpose: 'Changed addressing to employees; added L&D Manager' },
      { rev: 2, date: 'June 2, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms' },
    ],
    quizQuestions: [
      {
        question: 'Under IKQA-SOP#001, what is the Restroom Double Wash Method?',
        options: [
          'Washing hands with soap twice in the restroom',
          'Washing hands in the restroom, then washing again at the kitchen sink before entering prep',
          'Washing hands with cold water then hot water',
          'Washing hands before and after taking off shoes',
        ],
        answerIndex: 1,
        explanation: 'The Double Wash Method requires washing first inside the restroom, and performing a second complete wash at the kitchen handwash station.',
      },
      {
        question: 'What must happen to food handled by an employee who bypassed mandatory handwashing?',
        options: [
          'It can be served if cooked immediately',
          'It is wiped down with sanitizer',
          'It is legally deemed adulterated and must be discarded immediately',
          'It is placed on 1-hour hold',
        ],
        answerIndex: 2,
        explanation: 'Any food handled during a hygiene breach is legally classified as adulterated and must be discarded immediately.',
      },
    ],
    tags: ['SOP', 'Handwashing', 'Double Wash', 'CCPs', 'Antimicrobial Soap', '40-60 Seconds'],
  },

  // IKQA-SOP#002 Personnel Hygiene
  {
    id: 'ikqa-sop-002',
    code: 'IKQA-SOP#002',
    title: 'Standard Operating Procedure: Personnel Hygiene',
    type: 'sop',
    category: 'Uniform & Visitor',
    revision: 2,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_002__Personnel_Hygiene.docx_1f59d19a.pdf',
    summary:
      'Harmonizes personnel appearance, personal cleanliness, and health reporting. Defines the strict jewelry restriction (plain wedding band only), beard snood rules (>1.25cm / 0.5in), exclusion vs restriction health actions, and the Stop-and-Discard product protocol.',
    keyTakeaways: [
      'Daily Hygiene: Daily bathing/showering; nails kept short, clean, and trimmed; polish, acrylics, and false nails strictly prohibited.',
      'Hair Restraints & Beard Snoods: Clean hats/hairnets covering all hair; beard snoods mandatory for facial hair exceeding 1.25 cm (0.5 inch).',
      'Uniform Integrity: Uniforms must not be worn during the commute to work to prevent ambient environmental contamination; aprons removed before leaving kitchen.',
      'Jewelry Policy: Only a plain, smooth wedding band is permitted. Visible watches and stud earrings allowed for receptionists only.',
      'Illness Action Required: Vomiting, Diarrhea, Jaundice, Sore throat with fever -> Immediate EXCLUSION (sent home). Infected cuts/boils -> RESTRICT to non-food tasks with waterproof bandage & glove.',
      'Stop-and-Discard Protocol: Immediate disposal of any food items handled by non-compliant employees.',
      'Tasting Food: Always use a clean sanitized utensil for every taste test; never double-dip.',
    ],
    quickRules: [
      {
        title: 'Beard Snood Rule',
        rule: 'Beard snood is mandatory for any facial hair exceeding 1.25 cm (0.5 inches).',
        type: 'critical',
      },
      {
        title: 'No False Nails or Polish',
        rule: 'Nail polish, acrylics, and fake nails are strictly prohibited in food areas.',
        type: 'critical',
      },
      {
        title: 'Plain Wedding Band Only',
        rule: 'No watches, bracelets, or stone rings allowed (Bare Below the Elbows).',
        type: 'warning',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'To mitigate biological, physical, and chemical risks by neutralizing human vectors as a primary source of foodborne illness. Harmonizes operational practices with RA 10611, Code on Sanitation PD 856, and CODEX guidelines across all departments from frontline to back-of-house.',
      },
      {
        id: '2',
        title: '2. Personal Cleanliness & Appearance',
        content:
          'Daily bathing prior to work. Nails short, clean, and trimmed. Nail polish, acrylics, and false nails are strictly prohibited due to physical chipping and bacterial niches. Hairnets/hats must fully cover hair. Beard snoods required for facial hair exceeding 1.25 cm (0.5 inch).',
      },
      {
        id: '3',
        title: '3. Proper Attire & Protective Clothing',
        content:
          'Uniform Integrity: Store uniforms must never be worn to and from work during commutes. Aprons must be hung in designated areas before leaving prep zones. Jewelry: Only a plain, smooth wedding band is permitted. Watches and bracelets strictly banned in kitchen (bare below elbows).',
      },
      {
        id: '4',
        title: '4. Illness Reporting & Corrective Actions',
        content:
          'Symptoms (vomiting, diarrhea, jaundice, fever) require immediate EXCLUSION. Infected sores/cuts require RESTRICTION with waterproof bandages and gloves. Hygiene breaches require immediate manager intervention, "just-in-time" retraining, Stop-and-Discard product protocol, and IQAF-001 documentation.',
      },
    ],
    tables: [
      {
        title: 'Employee Health and Illness Reporting Action Matrix',
        headers: ['Condition / Symptoms', 'Required Operational Action'],
        rows: [
          ['Symptoms (Vomiting, Diarrhea, Jaundice, Sore Throat with Fever)', 'Exclude: Employee must be sent home immediately until 24-48h asymptomatic.'],
          ['Infected Wounds (Cuts, Boils, Sores)', 'Restrict: Cover with waterproof bandage and fresh glove; reassign to non-food duties.'],
          ['Confirmed Pathogens (Salmonella, E. Coli, Norovirus, Hep A)', 'Report & Exclude: Notify health authorities; employee excluded until physician clearance.'],
        ],
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'February 10, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'March 06, 2026', author: 'Marielle Louise Macabale', purpose: 'Updated roles to Restaurant Managers; added L&D' },
      { rev: 2, date: 'June 2, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms' },
    ],
    quizQuestions: [
      {
        question: 'At what facial hair length is a beard snood legally required under IKQA-SOP#002?',
        options: ['1.25 cm (0.5 inches)', '2.5 cm (1 inch)', '5 cm (2 inches)', 'Only full beards'],
        answerIndex: 0,
        explanation: 'Beard snoods are mandatory for any facial hair exceeding 1.25 cm (0.5 inches) in length.',
      },
    ],
    tags: ['SOP', 'Hygiene', 'Beard Snood', 'Nails', 'Exclusion', 'Attire'],
  },

  // IKQA-SOP#003 Integrated Pest Management
  {
    id: 'ikqa-sop-003',
    code: 'IKQA-SOP#003',
    title: 'Standard Operating Procedure: Integrated Pest Management',
    type: 'sop',
    category: 'Sanitation & Pest',
    revision: 2,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_003__Integrated_Pest_Management.docx_feeb52b5.pdf',
    summary:
      'Systematic non-chemical and chemical IPM program combating rodents, cockroaches, flies, and ants. Mandates 6mm door sweep limits, 16-mesh window screens, 15cm floor clearance, 45cm wall clearance in dry storage, electronic fly killers (EFKs), and emergency flush-out protocols.',
    keyTakeaways: [
      'Physical Prevention: Door sweeps maintained with gap ≤6mm to stop rodent entry; windows fitted with 16-mesh screens; utility penetrations sealed with SS mesh or concrete.',
      'Restriction Distances: Food stored 15 cm (6 inches) off floor AND 45 cm (18 inches) away from walls to allow inspection and deny harborage.',
      'Water Management: Zero standing water overnight in drains, under chillers, or in mop buckets.',
      'Elimination Controls: Inside food prep areas = non-toxic mechanical traps (glue boards, multi-catch) and EFKs ONLY. Toxic bait strictly limited to exterior tamper-resistant stations.',
      'Pest Sighting Protocol: Record date, time, location, and pest type in Pest Sighting Log immediately.',
      'Emergency Flush-Out: Sighting in food prep area triggers immediate area isolation, halting prep, discarding compromised items (IKQA-WI#006), calling PCO for flush-out, and comprehensive post-treatment deep clean.',
    ],
    quickRules: [
      {
        title: '6mm Door Gap Rule',
        rule: 'Door sweeps must have a gap of no more than 6mm to prevent rodent entry.',
        type: 'critical',
      },
      {
        title: '15cm Floor / 45cm Wall',
        rule: 'In dry storage, keep items 15cm off floor and 45cm away from walls.',
        type: 'warning',
      },
      {
        title: 'No Toxic Bait Inside',
        rule: 'Toxic rodenticides are strictly prohibited inside food prep and dining zones.',
        type: 'critical',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'Provides a systematic approach to preventing, monitoring, and eliminating pest activity (rodents, cockroaches, flies, and ants) through physical, non-chemical, and licensed chemical means across all Jiangnan Hotpot restaurants and facilities in alignment with RA 10611.',
      },
      {
        id: '2',
        title: '2. Physical Prevention & Exclusion',
        content:
          'External Doors: Must remain closed when not in use. Door sweeps maintained with gap ≤6mm.\nScreening: Windows and ventilation points must have 16-mesh screens free of tears.\nSealants: Pipes, conduits, and wall penetrations sealed with stainless steel mesh or concrete.',
      },
      {
        id: '3',
        title: '3. Restriction & Elimination Standards',
        content:
          'Dry Storage: 15cm (6 in) off floor, 45cm (18 in) away from walls.\nWater: Eliminate standing water in drains, drip pans, or mop buckets overnight.\nInterior Traps: Mechanical glue boards and Electronic Fly Killers (EFKs) only. Zero toxic bait inside food areas.\nExterior: Tamper-resistant bait stations anchored along building perimeter.',
      },
      {
        id: '4',
        title: '4. Corrective Action for Pest Sightings',
        content:
          'Isolate affected zone, halt prep immediately, inspect and discard exposed food (IKQA-WI#006), contact PCO for emergency flush-out, and complete a full deep-clean sanitization before resuming operations.',
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'February 13, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'March 05, 2026', author: 'Marielle Louise Macabale', purpose: 'Added FDA approved pest chemicals & IKQA-WI#006' },
      { rev: 2, date: 'June 2, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms' },
    ],
    quizQuestions: [
      {
        question: 'Under IKQA-SOP#003, what is the maximum permissible gap underneath external doors?',
        options: ['6 mm', '12 mm', '15 mm', '25 mm'],
        answerIndex: 0,
        explanation: 'Door sweeps must be maintained with a gap of no more than 6mm to prevent rodent entry.',
      },
      {
        question: 'How far away from walls must dry storage items be placed to allow inspection?',
        options: ['15 cm (6 inches)', '45 cm (18 inches)', '5 cm (2 inches)', 'Touching the wall is fine'],
        answerIndex: 1,
        explanation: 'Items in dry storage must be kept 15cm off the floor and 45cm (18 inches) away from walls to discourage pest nesting.',
      },
    ],
    tags: ['SOP', 'Pest Control', 'IPM', '6mm Gap', '45cm Wall', 'PCO'],
  },

  // IKQA-SOP#004 Storage FIFO & FEFO
  {
    id: 'ikqa-sop-004',
    code: 'IKQA-SOP#004',
    title: 'Standard Operating Procedure: Storage FIFO & FEFO',
    type: 'sop',
    category: 'Receiving & Storage',
    revision: 2,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_004__Storage_First_In__First_Out_and_First_Expiry__First_Out.docx_1563eef9.pdf',
    summary:
      'Inventory rotation framework enforcing First-In, First-Out (FIFO) and First-Expiry, First-Out (FEFO). Codifies that FEFO always overrides FIFO, mandates back-to-front stocking, discard dates on in-house prep sub-assemblies, and logging in the IQAF-007 Spoilage/Waste Tracker.',
    keyTakeaways: [
      'FEFO Overrides FIFO: Products with the closest expiration date must ALWAYS be placed at the front and used first, regardless of arrival date.',
      'FIFO Application: Used for items without printed expiration dates (fresh produce, non-perishables, or dry goods).',
      'Back-to-Front Stocking: New deliveries staged behind existing stock so older inventory is pushed forward.',
      'Internal Prep Items: Any in-house sub-assemblies (chopped veggies, marinated proteins, portioned broth) must be labeled with calculated discard dates.',
      'Front-Row Selection: Staff must pull items strictly from the front of the shelf.',
      'Expired Stock Action: Immediate isolation and recording in IQAF-007 Spoilage/Waste Tracker prior to disposal.',
      'Daily Audits: Managers audit dry storage, walk-in chillers, chest freezers, and prep lines daily.',
    ],
    quickRules: [
      {
        title: 'FEFO Always Overrides',
        rule: 'Earliest expiring items are always placed in front and used first, even if received later.',
        type: 'critical',
      },
      {
        title: 'Back-to-Front Stocking',
        rule: 'Always load new stock from behind; older stock remains at the front edge.',
        type: 'info',
      },
      {
        title: 'Label Discard Dates',
        rule: 'Every internal prep container must feature a clearly calculated discard date.',
        type: 'warning',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Principles',
        content:
          'Establishes a standardized framework for initial receipt, storage, and issuance of goods across all storage environments. Eliminates inventory stagnation and preventable waste while ensuring peak safety for high-risk proteins and produce.',
      },
      {
        id: '2',
        title: '2. FIFO vs FEFO Framework',
        content:
          'FIFO: Utilized in the exact sequence of acquisition (for non-perishables and items without manufacturer expiration dates).\nFEFO: Prioritizes designated shelf-life over receipt date. FEFO maintains operational precedence over FIFO at all times.',
      },
      {
        id: '3',
        title: '3. Strategic Storage & Front-Row Selection',
        content:
          'Receiving & Labeling: Incoming goods labeled on arrival. In-house prep items labeled with calculated discard dates.\nBack-to-Front Stocking: New stock loaded from behind.\nIssuance: Employees pull items strictly from front row.',
      },
      {
        id: '4',
        title: '4. Non-Compliance & Waste Tracking',
        content:
          'Discovered expired stock is immediately isolated and logged in the IQAF-007 Spoilage/Waste Tracker. Improper stocking triggers an immediate physical re-sorting intervention and employee retraining event logged in HR files.',
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'February 23, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'March 05, 2026', author: 'Marielle Louise Macabale', purpose: 'Added IQAF-004 Spoilage Tracker' },
      { rev: 2, date: 'June 2, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms, Procedures, Verification' },
    ],
    quizQuestions: [
      {
        question: 'Between FIFO and FEFO, which principle takes operational precedence in food safety?',
        options: ['FIFO takes precedence', 'FEFO always overrides FIFO', 'The supervisor decides each shift', 'Whichever arrived first'],
        answerIndex: 1,
        explanation: 'FEFO (First Expiry, First Out) maintains operational precedence over FIFO to prevent expired items from reaching guests.',
      },
    ],
    tags: ['SOP', 'FIFO', 'FEFO', 'Stock Rotation', 'Discard Dates', 'Waste Tracker'],
  },

  // IKQA-SOP#005 Product Recall and Traceability
  {
    id: 'ikqa-sop-005',
    code: 'IKQA-SOP#005',
    title: 'Standard Operating Procedure: Product Recall and Traceability',
    type: 'sop',
    category: 'Receiving & Storage',
    revision: 1,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_005__Product_Recall_and_Traceability__For_supplies_.docx_44a2cc9f.pdf',
    summary:
      'Execution framework for the "one step back, one step forward" traceability mandate under RA 10611. Outlines receiving log requirements, sub-recipe lot tracking, POS consumer mapping, 3-step recall execution (Stop, Quarantine, Inventory Reconciliation), regulatory reporting, and mandatory 4-hour annual mock recalls.',
    keyTakeaways: [
      'One Step Back: Every delivery recorded in Receiving Log with Supplier Name, Date, Description, Lot/Batch Number, Expiration Date, DR Number.',
      'Internal Culinary Traceability: Sub-recipes in secondary containers must preserve original supplier batch/lot numbers.',
      'One Step Forward: POS transaction data and reservation logs mapped to identify exposed consumer cohorts.',
      'Recall Protocol: 1. Stop Process (halt sale immediately); 2. Quarantine (tag "RECALL: DO NOT USE / NOT FOR CONSUMPTION"); 3. Inventory Reconciliation (calculate received vs consumed).',
      'Regulatory Reporting: FSCO notifies City Health Office (CHO) and FDA within statutory timeframes.',
      'Annual Mock Recall: Mandatory stress test conducted annually requiring full trace from supplier to customer within a strictly defined 4-HOUR WINDOW.',
    ],
    quickRules: [
      {
        title: 'One Step Back / Forward',
        rule: 'Track exact source supplier and forward recipient for all food and packaging.',
        type: 'critical',
      },
      {
        title: '4-Hour Mock Recall',
        rule: 'Traceability data trail must be proven within 4 hours during annual mock recalls.',
        type: 'warning',
      },
      {
        title: 'Recall Quarantine Tag',
        rule: 'Conspicuously tag recalled goods with "RECALL: DO NOT USE / NOT FOR CONSUMPTION".',
        type: 'critical',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Traceability Mandate',
        content:
          'Establishes a rigorous, verifiable system to track all food products, raw materials, and packaging throughout the supply chain under RA 10611. Guarantees rapid product isolation during food safety hazards and regulatory compliance with FDA and LGU authorities.',
      },
      {
        id: '2',
        title: '2. The Three Dimensions of Traceability',
        content:
          '1. Supplier Traceability (One Step Back): Receiving log captures supplier, date, batch/lot, expiry, DR number. Missing batch info triggers immediate rejection.\n2. Internal Traceability: Secondary prep containers cross-reference original lot numbers.\n3. Service Traceability (One Step Forward): POS orders and table reservations mapped to isolate exposed timeframes.',
      },
      {
        id: '3',
        title: '3. Recall Execution Protocol',
        content:
          'Step 1 (Stop Process): FSCO or QA immediately halts preparation and sale.\nStep 2 (Quarantine): Isolate remaining stock tagged "RECALL: DO NOT USE / NOT FOR CONSUMPTION".\nStep 3 (Reconciliation): Calculate total received vs consumed.\nStep 4 (Reporting): Notify City Health Office and FDA; conduct supervised product destruction.',
      },
      {
        id: '4',
        title: '4. Annual Mock Recalls',
        content:
          'FSCO facilitates an annual mock recall simulation. The team must demonstrate a seamless data trail for a randomly selected high-risk ingredient within a strictly defined 4-hour window.',
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'March 09, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'June 2, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms and Verification' },
    ],
    quizQuestions: [
      {
        question: 'Within what maximum timeframe must an annual Mock Recall be successfully completed?',
        options: ['4 hours', '12 hours', '24 hours', '48 hours'],
        answerIndex: 0,
        explanation: 'Annual mock recalls mandate that the food safety team map the complete traceability data trail within a strictly defined 4-hour window.',
      },
    ],
    tags: ['SOP', 'Recall', 'Traceability', 'Mock Recall', 'RA 10611', 'Quarantine'],
  },

  // IKQA-SOP#006 Employee Training
  {
    id: 'ikqa-sop-006',
    code: 'IKQA-SOP#006',
    title: 'Standard Operating Procedure: Employee Training',
    type: 'sop',
    category: 'Corporate & Quality',
    revision: 2,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_006__Employee_Training.docx_f8d59767.pdf',
    summary:
      'Three-phase workforce competency framework (New Hire Induction, Role-Specific Technical Training, Annual Refresher). Establishes bifurcated assessments (written/digital quizzes + practical observation), the Talent and Capability Matrix, and sign-off archiving.',
    keyTakeaways: [
      'Three Training Phases: 1. New Hire Induction (orientation & food safety basics before active shifts); 2. Role-Specific Training (HACCP, equipment, POS); 3. Annual Refresher & Compliance.',
      'Two-Pronged Competency Verification: Theoretical comprehension tested via quizzes + practical observation by supervisors on shift.',
      'If It Is Not Documented, It Never Happened: Every session requires signed physical or digital sign-off sheets.',
      'Talent & Capability Matrix: Centralized spreadsheet tracking who has been trained, skill gaps, and upcoming due dates.',
      'Personnel Record Retention: Training certificates and sign-off sheets stored in employee files for employment duration plus 1 year.',
      'Retraining on Safety Violations: Any employee observed violating safety standards is immediately pulled from duty for documented retraining.',
    ],
    quickRules: [
      {
        title: 'Induction Before Duties',
        rule: 'New hires cannot work active shifts without completing the mandatory induction orientation.',
        type: 'critical',
      },
      {
        title: 'Bifurcated Testing',
        rule: 'Employees must pass both a written quiz and practical supervisory observation.',
        type: 'info',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Three-Phase Scope',
        content:
          'Ensures every employee possesses knowledge and skills to perform duties competently and safely. Covers: 1. New Hire Induction (culture, basic safety, emergency); 2. Role-Specific Training (technical duties, equipment, HACCP); 3. Refresher and Compliance (annual mandatory updates).',
      },
      {
        id: '2',
        title: '2. Competency Assessment Methodology',
        content:
          'Attendance alone does not equal competency. Capability is proven through: 1. Written or digital quizzes for theoretical knowledge; 2. Practical observation where supervisor physically observes task execution. Failures trigger immediate retraining.',
      },
      {
        id: '3',
        title: '3. Documentation & Talent Matrix',
        content:
          'Sign-off sheets signed by both trainer and trainee. L&D logs milestones into the Talent and Capability Matrix. Physical records forwarded to HR and retained for employment duration + 1 year.',
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'February 20, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'March 05, 2026', author: 'Marielle Louise Macabale', purpose: 'Renamed to Talent and Capability Matrix; added L&D' },
      { rev: 2, date: 'June 2, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms, Procedure, Verification' },
    ],
    quizQuestions: [
      {
        question: 'Under IKQA-SOP#006, how is employee competency verified?',
        options: [
          'Attendance check only',
          'Self-reporting by employee',
          'Two-pronged: written/digital quizzes plus practical supervisory observation',
          'Annual verbal interview',
        ],
        answerIndex: 2,
        explanation: 'Competency requires both theoretical testing (quizzes) and practical behavioral observation by a direct supervisor.',
      },
    ],
    tags: ['SOP', 'Training', 'Induction', 'Talent Matrix', 'Competency'],
  },

  // IKQA-SOP#007 Crisis Management
  {
    id: 'ikqa-sop-007',
    code: 'IKQA-SOP#007',
    title: 'Standard Operating Procedure: Crisis Management',
    type: 'sop',
    category: 'Corporate & Quality',
    revision: 1,
    effectiveDate: 'June 28, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_007__Crisis_Management.docx_9f60e2da.pdf',
    summary:
      'Rapid-response protocol for food safety emergencies (foodborne illness outbreaks, physical contamination, chemical hazards, or health office shutdowns). Outlines the Crisis Management Team hierarchy, 3 phases of management, Disciplinary Matrix with 30-day preventive suspensions, and 14-shift probation.',
    keyTakeaways: [
      'CMT Response Hierarchy: President/Owner (Crisis Director) -> VP (Deputy Director) -> FSCO/QA (Facilitator) -> Operations Manager, SCM Manager, Area Manager, L&D Manager.',
      'Three Phases: Phase 1: Preparedness & HACCP; Phase 2: Crisis Response (immediate containment, evidence isolation "DO NOT USE", records securitization); Phase 3: Operational Recovery (CAPA, regulatory clearance, post-audit).',
      'External Communications: No premature admissions of liability. All media and external statements routed exclusively through Communications Lead or President.',
      'Regulatory Clearance: Full operational resumption is strictly prohibited until formal written clearance is issued by the sanitary inspector/health office.',
      'Disciplinary Matrix: Minor Infraction -> Verbal/Written Reminders; Major Infraction -> Written Reprimand & 3-day suspension; Critical Infraction (willful endangerment, falsifying logs) -> 30-day preventive suspension pending termination.',
      'Post-Incident: Non-compliant employees undergo retraining and a 14-shift supervised probation.',
    ],
    quickRules: [
      {
        title: 'Centralized Messaging',
        rule: 'Never admit liability or speak to media. All inquiries go to the President/Crisis Director.',
        type: 'critical',
      },
      {
        title: 'Immediate Evidence Hold',
        rule: 'Immediately tag suspected food and batches with "DO NOT USE" for third-party lab testing.',
        type: 'critical',
      },
      {
        title: '14-Shift Probation',
        rule: 'Employees involved in safety violations must complete a 14-shift supervised probation.',
        type: 'info',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'Structured rapid-response framework prioritizing public health by containing food safety risks while ensuring compliance with DOH, FDA, and LGU reporting. Covers foodborne illness outbreaks, glass/metal physical contamination, toxic chemical residues, and regulatory shutdown orders.',
      },
      {
        id: '2',
        title: '2. Crisis Management Team (CMT) Hierarchy',
        content:
          'President/Owner: Final executive authority on closures, public statements, and recalls.\nVice President: Strategic decisions and emergency resource allocation.\nFSCO / QA: Internal traceability audit, regulatory liaison, NCR and CAPA.\nOperations Manager: Large-scale operational halts, workflow adjustments.\nArea Manager: Investigation, evidence collection, employee interviews.\nSCM Manager: Supply chain quarantine and vendor traceability.\nL&D Manager: Initial customer complaint intake and documentation.',
      },
      {
        id: '3',
        title: '3. Three-Phase Crisis Management Lifecycle',
        content:
          'Phase 1 (Pre-Crisis): HACCP risk assessment, one-step-back traceability, supplier accreditation.\nPhase 2 (Response): Operational suspension, evidence isolation ("DO NOT USE"), records securitization, regulatory notification, and centralized media messaging.\nPhase 3 (Recovery): CAPA implementation, written regulatory clearance before reopening, post-incident review, and customer transparency.',
      },
    ],
    tables: [
      {
        title: 'Food Safety Crisis Disciplinary Matrix',
        headers: ['Severity', 'Definition & Examples', 'Mandatory Disciplinary Action'],
        rows: [
          [
            'Minor Infraction',
            'Unintentional errors with no immediate risk to health (e.g. missing 1 column on temp log, minor server lapse)',
            '1st: Verbal Warning (Written Reminder); 2nd: Incident Report (Reprimand) & Retraining',
          ],
          [
            'Major Infraction',
            'Negligence creating potential health risk or violating RA 10611 (e.g. failing to hold suspected batch, mixing batches, failing to escalate illness)',
            '1st: Incident Report (Written Reprimand) & Retraining; 2nd: 3 Days Suspension',
          ],
          [
            'Critical Infraction',
            'Willful endangerment, gross negligence, or intentional cover-ups (e.g. serving known contaminated food, falsifying logs, hiding health notices)',
            '1st Offense: 30 days preventive suspension pending investigation, leading to termination.',
          ],
        ],
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'March 25, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'June 3, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms and Verification' },
      { rev: 2, date: 'June 26, 2026', author: 'Celine Joy Sanchez', purpose: 'Revised CMT Structure; added L&D and Operations Manager' },
    ],
    quizQuestions: [
      {
        question: 'Under IKQA-SOP#007, what is the mandatory penalty for a Critical Infraction such as falsifying logs?',
        options: [
          'Verbal coaching',
          'Written reminder',
          '30 days preventive suspension pending investigation, leading to termination',
          '1 day deduction',
        ],
        answerIndex: 2,
        explanation: 'Critical infractions involving willful endangerment or falsifying logs trigger 30 days preventive suspension leading to termination.',
      },
    ],
    tags: ['SOP', 'Crisis Management', 'Outbreak', 'CMT', 'CAPA', 'Disciplinary Matrix'],
  },

  // IKQA-SOP#008 Personal Effects
  {
    id: 'ikqa-sop-008',
    code: 'IKQA-SOP#008',
    title: 'Standard Operating Procedure: Personal Effects',
    type: 'sop',
    category: 'Uniform & Visitor',
    revision: 2,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_008_Personal_Effects.docx_f77011f7.pdf',
    summary:
      'Controls restricting personal belongings, outside food, cosmetics, and jewelry in food zones. Enforces Bare Below the Elbows, bans false eyelashes and loose glitter, prohibits personal mobile phones on line, and mandates company-approved tumblers stored on lower designated shelves.',
    keyTakeaways: [
      'Locker Storage: All personal effects (money, coins, bags, e-cigarettes, nail clippers) must be locked in employee lockers before washing hands and entering kitchen.',
      'Bare Below the Elbows: No watches, bracelets, or rings with stones (only plain, smooth wedding band permitted).',
      'Cosmetic Standards: Light, blended makeup only. Water-resistant eye makeup. NO LOOSE GLITTER, SHIMMER, OR HEAVY POWDERS (risk of airborne migration).',
      'False Eyelashes Strictly Banned: False lashes and eyelash extensions are strictly prohibited in all food preparation areas.',
      'Fragrance Ban: Scented perfumes and lotions prohibited to prevent sensory taint of high-fat foods.',
      'Mobile Phones: Personal cellphones are strictly banned in food prep and storage areas. Emergency calls taken in break area with apron removed.',
      'Beverages: Hydration permitted only through company-approved tumblers with secured lids and straws placed on designated bottom shelves away from prep surfaces.',
      'Contamination Event: If a personal item (phone, earring) falls into food, the affected food batch must be immediately condemned and discarded (IKQA-WI#005).',
    ],
    quickRules: [
      {
        title: 'No False Lashes / Glitter',
        rule: 'False eyelashes, eyelash extensions, and loose glitter are strictly prohibited in food areas.',
        type: 'critical',
      },
      {
        title: 'No Phones on the Line',
        rule: 'Personal mobile phones are prohibited in food prep. Step into breakroom and wash hands upon return.',
        type: 'critical',
      },
      {
        title: 'Approved Tumblers Only',
        rule: 'Drink only from company-approved tumblers with lids/straws kept on designated lower shelves.',
        type: 'info',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'Eliminates physical, biological, and chemical contamination caused by personal belongings, outside food, and unapproved grooming items in active food handling areas. Applies to all kitchen lines, walk-in coolers, dry stores, dishwashing, and external visitors.',
      },
      {
        id: '2',
        title: '2. Cosmetic & Grooming Standards',
        content:
          'Makeup: Light, thoroughly blended. Loose glitter and heavy powders forbidden due to airborne migration.\nFalse Eyelashes: Strictly prohibited in food handling areas due to detachment from heat, steam, and perspiration.\nFragrances: Perfumes and scented lotions prohibited to prevent sensory taint.',
      },
      {
        id: '3',
        title: '3. Jewelry & Mobile Electronics',
        content:
          'Jewelry: Bare below the elbows. Plain wedding band only. Facial piercings must be removed or covered with metal-detectable plaster.\nMobile Phones: Strictly prohibited in food areas. Returning from personal phone use requires complete 40–60 second handwashing.',
      },
      {
        id: '4',
        title: '4. Outside Food, Drink & Medication',
        content:
          'Outside food forbidden in kitchen. Hydration permitted only via company tumblers with lids/straws stored below prep tables. Routine meds in lockers; emergency meds (EpiPens, inhalers) declared to Manager and kept in first-aid box.',
      },
    ],
    signatories: {
      preparedBy: 'Marielle Louise Macabale / Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'February 26, 2026', author: 'Marielle Louise Macabale', purpose: 'Originator' },
      { rev: 1, date: 'March 05, 2026', author: 'Marielle Louise Macabale', purpose: 'Standardized addressing; added L&D' },
      { rev: 2, date: 'June 3, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Definition of Terms and Verification' },
    ],
    quizQuestions: [
      {
        question: 'Are false eyelashes or eyelash extensions permitted for kitchen employees under IKQA-SOP#008?',
        options: ['Yes, if wearing goggles', 'Yes, for light extensions', 'Strictly prohibited in all food handling areas', 'Permitted with hairnet'],
        answerIndex: 2,
        explanation: 'False eyelashes and extensions are strictly prohibited because steam, heat, and sweat cause them to fall into food.',
      },
    ],
    tags: ['SOP', 'Personal Effects', 'Bare Below Elbows', 'False Eyelashes', 'Cellphones', 'Tumblers'],
  },

  // IKQA-SOP#009 Waste Management
  {
    id: 'ikqa-sop-009',
    code: 'IKQA-SOP#009',
    title: 'Standard Operating Procedure: Waste Management',
    type: 'sop',
    category: 'Sanitation & Pest',
    revision: 3,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_009_Waste_Management.docx_3cd82a1e.pdf',
    summary:
      'Compliant waste segregation and disposal under RA 9003 and RA 6969. Mandates segregation at source (biodegradable, non-biodegradable, recyclables, hazardous), pre-treatment of food production rejects (crushing/pulverizing + sanitizer), intellectual property protection (defacing Jiangnan branding on boxes), and DENR-accredited hauler protocols.',
    keyTakeaways: [
      'Regulatory Alignment: Full compliance with RA 9003 (Ecological Solid Waste) and RA 6969 (Toxic Substances & Hazardous Wastes).',
      'Segregation at Source: Biodegradable (organic food scraps), Non-Biodegradable (black bags to LGU landfill), Recyclables (sold to certified scrap buyers), Hazardous (spent bulbs, used oils in drums to DENR agents).',
      'Food Production Rejects Pre-Treatment: Substandard rejects sealed in clear plastic with "Red" (Rejected) sticker signed by Kitchen Captain; MUST BE CRUSHED/PULVERIZED AND TREATED WITH SANITIZER to prevent unauthorized human consumption.',
      'Intellectual Property Protection: All discarded cardboard boxes, vacuum bags, and stickers bearing Jiang Nan Hotpot branding MUST BE DEFACED OR DESTROYED before disposal; brochures shredded.',
      'Medical / First-Aid Waste: Dedicated labeled bins emptied daily into secondary containers.',
      'Construction Debris: Contractor sole responsibility; payment withheld until site cleared according to DENR standards.',
    ],
    quickRules: [
      {
        title: 'Pulverize Product Rejects',
        rule: 'Food production rejects must be crushed/pulverized and sanitized before disposal to prevent consumption.',
        type: 'critical',
      },
      {
        title: 'Deface Brand Logos',
        rule: 'All discarded packaging with Jiangnan Hotpot labels must be defaced or torn to protect IP.',
        type: 'warning',
      },
      {
        title: 'Non-Recyclable Black Bags',
        rule: 'Non-recyclable waste must be enclosed in heavy-duty black bags for LGU landfill collection.',
        type: 'info',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'Standardized process for control, handling, segregation, storage, and disposal of waste from Commissary, Warehouse, and Stores in compliance with RA 9003 and RA 6969.',
      },
      {
        id: '2',
        title: '2. Waste Categories & Handling Protocols',
        content:
          'Recyclables: Cardboard, PET, metals stored in designated areas and sold to authorized scrap buyers.\nNon-Recyclables: Black bags collected by LGU trucks.\nHazardous Wastes: Used machine oils in drums, burnt bulbs wrapped in cardboard, chemical residues collected by DENR-accredited haulers.\nBiodegradable: Scraps and rejects managed separately.',
      },
      {
        id: '3',
        title: '3. Pre-Treatment of Production Rejects & IP Protection',
        content:
          'Substandard meat or ingredient rejects sealed with Red sticker, approved by Captain. Rejects must be crushed/pulverized and treated with sanitizer to ensure they cannot be salvaged or consumed. All branded packaging defaced.',
      },
      {
        id: '4',
        title: '4. Corrective Actions & Root Cause Analysis',
        content:
          'Improperly mixed waste triggers immediate re-segregation using PPE, disinfection of area, spill kit deployment, NCR documentation, and refresher training.',
      },
    ],
    signatories: {
      preparedBy: 'Celine Joy Sanchez / Marielle Louise Macabale (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'April 16, 2026', author: 'Celine Joy Sanchez', purpose: 'Originator' },
      { rev: 1, date: 'June 3, 2026', author: 'Celine Joy Sanchez', purpose: 'Migrated waste categories to definitions' },
      { rev: 2, date: 'June 26, 2026', author: 'Marielle Louise Macabale', purpose: 'Unified format & revised scope' },
      { rev: 3, date: 'June 26, 2026', author: 'Celine Joy Sanchez', purpose: 'Added Engineering, Commissary, Sanitation, Third-Party roles' },
    ],
    quizQuestions: [
      {
        question: 'Under IKQA-SOP#009, how must substandard food production rejects be treated prior to disposal?',
        options: [
          'Thrown into regular black trash bags immediately',
          'Given away to employees',
          'Crushed or pulverized and treated with sanitizer to prevent unauthorized human consumption',
          'Left outside in dumpsters',
        ],
        answerIndex: 2,
        explanation: 'Rejects must be sealed with a Red sticker, crushed/pulverized, and treated with sanitizer to prevent unauthorized consumption.',
      },
    ],
    tags: ['SOP', 'Waste Management', 'RA 9003', 'RA 6969', 'Pulverize Rejects', 'IP Protection'],
  },

  // IKQA-SOP#010 Cross-Contamination (Master SOP)
  {
    id: 'ikqa-sop-010',
    code: 'IKQA-SOP#010',
    title: 'Standard Operating Procedure: Cross - Contamination',
    type: 'sop',
    category: 'Operations & Maintenance',
    revision: 0,
    effectiveDate: 'June 29, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_010__Cross-Contamination.docx_61777ef8.pdf',
    summary:
      'Master 11-page SOP establishing hardware color-coding matrices (cutting boards, towels, meat serving plates), the 15-minute intake cold chain rule, chronological batching sequences, cooking line boundaries, and allergen segregation protocols across Warehouse, Commissary, and Stores.',
    keyTakeaways: [
      'Cutting Board Color Matrix: Red = Raw Meat; Yellow = Raw Poultry; Blue = Raw Seafood; Green = Produce; Brown = Dairy & Cooked Foods; White = Allergen-Free Orders ONLY.',
      'Meat Serving Plates Color Coding: Red & Yellow = US Beef; Brown & Green = Pork Belly; Orange = Angus Beef.',
      'Sanitation Towels: Blue = FOH Dining; Yellow = Handwash Sinks; Green = BOH Kitchen; White = Clean Wares; Red = Restroom ONLY.',
      'Chronological Batching Sequence: Shift Start = Clean Run (allergen-free, RTE items, clean vegetables); Shift End = Raw/Allergen Run.',
      'Cooking Line Boundary: Line of demarcation. Line cooks must use entirely separate dedicated tongs & plates for raw protein placement versus cooked protein retrieval.',
      'Hygienic Reset: 40–60 second handwashing + fresh gloves when switching tasks or food groups.',
      'Spill Response: Cordon off area immediately, deploy color-coded spill kit, wash/rinse/sanitize before resuming.',
    ],
    quickRules: [
      {
        title: 'Cutting Board Matrix',
        rule: '🔴 Red=Meat, 🟡 Yellow=Poultry, 🔵 Blue=Fish, 🟢 Green=Produce, 🟤 Brown=Cooked/Dairy, ⚪ White=Allergens.',
        type: 'critical',
      },
      {
        title: 'Meat Plate Colors',
        rule: 'Red/Yellow plates = US Beef; Brown/Green = Pork Belly; Orange = Angus Beef.',
        type: 'info',
      },
      {
        title: 'Separate Grill Tongs',
        rule: 'Never use the same tongs for raw protein placement and cooked protein retrieval.',
        type: 'critical',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'Establishes standardized procedures for prevention, control, and absolute segregation of biological, chemical, and physical hazards, as well as major allergens, across Warehouse, Commissary, and Store levels of Imperial Kitchen Group Inc.',
      },
      {
        id: '2',
        title: '2. Hardware Color Coding (Boards, Towels & Meat Plates)',
        content:
          'Cutting Boards: Red (meat), Yellow (poultry), Blue (seafood), Green (produce), Brown (cooked/dairy), White (allergen-free only).\nTowels: Blue (FOH), Yellow (handwash), Green (kitchen), White (wares), Red (restroom only).\nPlates: Red/Yellow (US Beef), Brown/Green (Pork Belly), Orange (Angus Beef).',
      },
      {
        id: '3',
        title: '3. Gateway Intake & 15-Minute Rule',
        content:
          'Incoming shipments checked for COAs and vehicle cleanliness. Chilled products (≤5°C) and frozen goods (≤-18°C) must be moved into deep cold storage within 15 minutes of vehicle arrival.',
      },
      {
        id: '4',
        title: '4. Chronological Batching & Hygienic Reset',
        content:
          'Shift Start (Clean Run) processes allergen-free and RTE items. Shift End (Allergen/Raw Run) processes marinations. 40–60 second hygienic reset with fresh gloves required when switching tasks.',
      },
    ],
    tables: [
      {
        title: 'Master Cutting Board Color Coding',
        headers: ['Board Color', 'Food Category', 'Standard Items Covered'],
        rows: [
          ['🔴 Red', 'Raw Meat', 'Beef, Pork, Lamb'],
          ['🟡 Yellow', 'Raw Poultry', 'Chicken, Turkey, Duck'],
          ['🔵 Blue', 'Raw Seafood', 'Fish and Shellfish'],
          ['🟢 Green', 'Produce', 'Fresh Fruits and Vegetables'],
          ['🟤 Brown', 'Dairy & Cooked Foods', 'Dairy products and pre-cooked items'],
          ['⚪ White', 'Allergen-Free', 'Strictly for allergen-free orders (No exceptions)'],
        ],
      },
      {
        title: 'Meat Serving Plates Color Coding',
        headers: ['Plate Color', 'Approved Usage & Target Protein'],
        rows: [
          ['🔴 Red & 🟡 Yellow', 'Intended for US Beef'],
          ['🟤 Brown & 🟢 Green', 'Intended for Pork Belly'],
          ['🟠 Orange', 'Intended for Angus Beef'],
        ],
      },
    ],
    signatories: {
      preparedBy: 'Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'June 18, 2026', author: 'Celine Joy Sanchez', purpose: 'Originator' },
    ],
    quizQuestions: [
      {
        question: 'Under IKQA-SOP#010, which cutting board color is strictly reserved for Allergen-Free orders?',
        options: ['Green', 'White', 'Blue', 'Yellow'],
        answerIndex: 1,
        explanation: 'The White cutting board is strictly reserved for allergen-free orders with zero exceptions.',
      },
    ],
    tags: ['SOP', 'Cross-Contamination', 'Cutting Boards', 'Plates Color Coding', 'Towels', 'Batching'],
  },

  // IKQA-SOP#011 Food Retention Sample
  {
    id: 'ikqa-sop-011',
    code: 'IKQA-SOP#011',
    title: 'Standard Operating Procedure: Food Retention Sample',
    type: 'sop',
    category: 'Receiving & Storage',
    revision: 0,
    effectiveDate: 'October 01, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_011__Food_Retention_Sample.docx_cb9b1c97.pdf',
    summary:
      'Mandatory daily collection, labeling, storage, and disposal of food retention samples across all branches and commissary. Defines sampling portions (broths 100-150mL, meats 100g, sauces 100g, ice cream 100mL, service water 250mL, ice 100g), 5-7 days holding period at ≤4°C or ≤-18°C, and vacuum-sealed packaging.',
    keyTakeaways: [
      'Universal Compliance: Daily retention sampling is compulsory across all branches regardless of sales volume or guest traffic.',
      'Mandatory Sampling Matrix: Soup/broths (100-150mL), Meats (100g per type), Sauces (100g per type), Sauce bar items (100g), Produce (100g), Ball items (100g / 2-4 pcs), Ice cream mix (100mL), Halo-halo mix (100mL), Service water (250mL), Edible ice (100g).',
      'Packaging: Sterile, food-grade PE plastic bags, vacuum-sealed to prevent air exposure and leaks.',
      'Storage Temperatures: Refrigerated items at ≤4°C; Frozen items at ≤-18°C in dedicated retention freezers.',
      'Retention Period: Exactly 5 to 7 days from collection date and time.',
      'Labeling Standard: Item Name, Date & Time Collected, Batch No, Collected By & signature, Retention End By, Manager on Duty (MOD) signature.',
      'Disposal: After 5-7 days, logged in Daily Retention Monitoring and disposed of as wastage; NEVER consumed, reused, or returned to service.',
    ],
    quickRules: [
      {
        title: '5-7 Days Retention Period',
        rule: 'Hold all daily samples under controlled cold storage for 5 to 7 days before disposal.',
        type: 'critical',
      },
      {
        title: 'Dedicated Retention Freezer',
        rule: 'Retention samples must be stored in dedicated freezers (≤-18°C) or chillers (≤4°C).',
        type: 'warning',
      },
      {
        title: 'Never Consume Samples',
        rule: 'Expired retention samples must be discarded as waste; never consumed or reused.',
        type: 'critical',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'Establishes a consistent, documented procedure for collecting, labeling, storing, and disposing retention samples of all food served. Samples are retained for microbiological/chemical testing or reference in case of customer safety complaints or regulatory inspections across all operating days.',
      },
      {
        id: '2',
        title: '2. Responsibilities',
        content:
          'Commissary Supervisor & Assistant: Sample batch broths, sauces, and raw materials at commissary.\nRestaurant Manager & Shift Manager: Branch-wide adherence, sign off Daily Retention Sample Logs, verify freezer temps twice daily (≤-18°C).\nBOH & FOH Employees: Collect, vacuum-seal, label, and store samples at start of shift.',
      },
      {
        id: '3',
        title: '3. Packaging, Storage & Labeling Standards',
        content:
          'Packaging: Food-grade PE plastic vacuum-sealed to eliminate leaks.\nStorage: Refrigerated (0-4°C) or Frozen (≤-18°C).\nHolding Period: 5 to 7 days.\nLabeling Tag: Must display Item Name, Date/Time, Batch ID, Collector Name & Signature, Retention End Date, and Manager on Duty signature.',
      },
      {
        id: '4',
        title: '4. Disposal & Documentation',
        content:
          'Samples exceeding 7 days are deemed wastage, logged in Daily Retention Monitoring form, and segregated into waste streams. Reusing or consuming retention samples is strictly forbidden.',
      },
    ],
    tables: [
      {
        title: 'Master Food Retention Sampling Matrix',
        headers: ['Food Category', 'Sample Point', 'Sample Portion', 'Holding Temp & Condition', 'Retention Duration'],
        rows: [
          ['Soup / Broth Stock (Mushroom, Spicy, Bone broth)', 'Holding kettle prior to dining dispatch', '100 - 150 mL', '0-4°C Chilled or ≤-18°C Frozen', '5 - 7 Days'],
          ['Meats (Beef, Pork, Chicken, Seafood)', 'Slicing station before service', '100g per protein', '≤-18°C Frozen (Vacuum-sealed)', '5 - 7 Days'],
          ['Sauces & Sauce Bar Ingredients', 'First batch / prep station', '100g per sauce type', '0-4°C Chilled (Vacuum-sealed)', '5 - 7 Days'],
          ['Fresh Produce (Spinach, Lettuce, Corn)', 'Washing & trimming station', '100g', '0-4°C Chilled (PE sealed)', '5 - 7 Days'],
          ['Ball Items (Fish roe, Cheese ball, Crab roe)', 'Prep counter prior to serving', '100g (2-4 pcs)', '≤-18°C Frozen', '5 - 7 Days'],
          ['Dessert Mixes (Ice cream mix, Halo-halo base)', 'Milk dispenser / prep container', '100 mL', '0-4°C Chilled or ≤-18°C', '5 - 7 Days'],
          ['Service Water & Juices', 'Water station pitcher / juice batch', '250 mL water / 100 mL juice', '0-4°C Chilled (PE bottle)', '5 - 7 Days'],
          ['Edible Tube Ice', 'Ice storage bin / fresh delivery', '100g', '≤-18°C Frozen', '5 - 7 Days'],
        ],
      },
    ],
    signatories: {
      preparedBy: 'Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'September 8, 2026', author: 'Celine Joy Sanchez', purpose: 'Originator' },
    ],
    quizQuestions: [
      {
        question: 'What is the required retention holding period for daily food samples under IKQA-SOP#011?',
        options: ['24 to 48 hours', '5 to 7 days', '14 days', '30 days'],
        answerIndex: 1,
        explanation: 'All retention samples must be retained for a minimum of 5 days and a maximum of 7 days before disposal.',
      },
      {
        question: 'What is the required sample volume for hotpot soup/broth bases?',
        options: ['10 - 20 mL', '50 mL', '100 - 150 mL', '500 mL'],
        answerIndex: 2,
        explanation: 'Hotpot soup and broth bases must be collected in portions of 100 to 150 mL.',
      },
    ],
    tags: ['SOP', 'Retention Samples', '5-7 Days', 'Broth', 'Vacuum Sealed', 'Traceability'],
  },

  // IKQA-SOP#012 Cutting and Portioning Luncheon Meat Using a Wire Slicer
  {
    id: 'ikqa-sop-012',
    code: 'IKQA-SOP#012',
    title: 'Standard Operating Procedure: Cutting and Portioning Luncheon Meat',
    type: 'sop',
    category: 'Operations & Maintenance',
    revision: 0,
    effectiveDate: 'October 12, 2026',
    pdfUrl: '/assets/aistudio/IKQA-SOP_012__Cutting_and_Portioning_Luncheon_Meat_Using_a_Wire_Slicer.docx_cc8eb461.pdf',
    summary:
      'Standardized procedure for safe, hygienic, uniform cutting and portioning of luncheon meat using a wire slicer. Ensures consistent slice thickness, portion control, presentation standards, pre-operational wire inspections, and post-shift sanitation.',
    keyTakeaways: [
      'Wire Slicer Inspection: Inspect wire slicer prior to use; report damaged, slack, or frayed slicing wires immediately.',
      'Personal Hygiene & Gloves: Don clean food-grade disposable gloves prior to touching luncheon meat or slicer food contact surfaces.',
      'Uniform Slice Presentation: Safely operate wire slicer to cut luncheon meat uniformly, maintaining portion control and hotpot visual plating standards.',
      'Sanitation & Storage: Slicers and preparation utensils must be thoroughly washed, rinsed, sanitized, and stored after each shift.',
      'Supervisory Oversight: Kitchen Captain inspects portion accuracy, plate aesthetics, and equipment condition daily.',
    ],
    quickRules: [
      {
        title: 'Inspect Wires Before Slicing',
        rule: 'Check wire slicer for damaged, loose, or broken wires before beginning portioning.',
        type: 'warning',
      },
      {
        title: 'Food-Grade Gloves Mandatory',
        rule: 'Always wear fresh food-grade gloves when handling luncheon meat and operating the slicer.',
        type: 'critical',
      },
    ],
    sections: [
      {
        id: '1',
        title: '1. Purpose & Scope',
        content:
          'To establish a standardized procedure for safe, hygienic, uniform cutting and portioning of luncheon meat using a wire slicer to ensure product consistency, visual presentation standards, portion control, and food safety compliance across kitchen employees, prep staff, and shift leaders.',
      },
      {
        id: '2',
        title: '2. Responsibilities',
        content:
          'Kitchen Employees: Wear clean food-grade gloves, safely operate wire slicer, portion and plate uniformly, report damaged slicers.\nKitchen Captain: Directly supervise daily prep, inspect portion accuracy and visual plating standards, verify slicer cleaning and sanitization after each shift.',
      },
      {
        id: '3',
        title: '3. Operational Procedures & Equipment Care',
        content:
          'Pre-Operational Check: Verify wire tension and hygiene cleanliness.\nSlicing & Portioning: Place chilled luncheon meat block firmly on base; depress wire frame in smooth single downward stroke to yield uniform slices.\nPlating: Fan slices neatly according to Jiangnan presentation guidelines.\nSanitation: Strip food debris, wash with warm detergent, rinse, sanitize with approved food-contact sanitizer, and air dry.',
      },
    ],
    signatories: {
      preparedBy: 'Celine Joy Sanchez (QA Specialist)',
      reviewedBy: ['Jackquelyn Aquino (SCM)', 'Virna Joy Bernardo (L&D)', 'Anthony Co (HR)', 'Aries Tambasacan (Ops)', 'Eric Co (VP)'],
      approvedBy: 'Jack Julius Tiu (President)',
    },
    changeHistory: [
      { rev: 0, date: 'October 6, 2026', author: 'Celine Joy Sanchez', purpose: 'Originator' },
    ],
    quizQuestions: [
      {
        question: 'Under IKQA-SOP#012, what must employees check before using a luncheon meat wire slicer?',
        options: [
          'Verify the color of the cutting board only',
          'Inspect equipment conditions for damaged, loose, or broken wires',
          'Weigh the slicer on a calibrated scale',
          'Soak the entire slicer in hot water for 1 hour',
        ],
        answerIndex: 1,
        explanation: 'Employees must inspect equipment conditions prior to use to ensure wires are intact, tensioned, and sanitized.',
      },
    ],
    tags: ['SOP', 'Luncheon Meat', 'Wire Slicer', 'Portioning', 'Plating', 'Kitchen Prep'],
  },
];
