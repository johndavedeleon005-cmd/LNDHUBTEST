import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FoodSafetyDoc } from '../types/foodSafety';
import {
  Gamepad2,
  Volume2,
  VolumeX,
  Music,
  Heart,
  Trophy,
  RotateCcw,
  Play,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Award,
  ChevronRight,
  HelpCircle,
  Search,
  Crosshair,
  Flame,
  Lock,
  Sparkles,
} from 'lucide-react';
import { TrainingCertificateModal } from './TrainingCertificateModal';

interface SpotTheHazardGameProps {
  documents: FoodSafetyDoc[];
  staffName: string;
  staffPosition?: string;
  staffBranch?: string;
  onOpenDoc?: (doc: FoodSafetyDoc) => void;
  initialFocusDoc?: FoodSafetyDoc | null;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'HAZARD_QUIZ' | 'STAGE_CLEAR' | 'GAME_OVER' | 'VICTORY';

interface KitchenSpot {
  id: string;
  x: number; // SVG coordinate 0-960
  y: number; // SVG coordinate 0-540
  width: number;
  height: number;
  isHazard: boolean;
  docCode: string;
  docId: string;
  hazardTitle: string;
  sopViolation: string;
  correctFixIndex: number;
  fixOptions: string[];
  safeExplanation?: string;
}

interface ClickMarker {
  id: number;
  x: number;
  y: number;
  kind: 'hazard' | 'penalty';
  label: string;
}

interface GameStage {
  stageNumber: number;
  title: string;
  zoneSubtitle: string;
  timeLimit: number;
  spots: KitchenSpot[];
}

const GAME_STAGES: GameStage[] = [
  // =========================================================================
  // STAGE 1: RECEIVING & COLD STORAGE ROOM (5 Subtle Hazards + 6 Safe Distractors)
  // =========================================================================
  {
    stageNumber: 1,
    title: 'STAGE 1: RECEIVING & COLD STORAGE ROOM',
    zoneSubtitle: '5 hidden SOP violations in this room. Zero clues — inspect every gauge, shelf, box, and door carefully.',
    timeLimit: 75,
    spots: [
      {
        id: 's1-h1',
        x: 50,
        y: 120,
        width: 125,
        height: 250,
        isHazard: true,
        docCode: 'IKQAP#003',
        docId: 'ikqap-003',
        hazardTitle: 'Chiller #1 Operating at 7.8°C',
        sopViolation:
          'Chiller #1 reads 7.8°C while Chiller #2 reads 2.4°C. Per IKQAP#003, chillers must be maintained between 0°C and 4°C.',
        correctFixIndex: 2,
        fixOptions: [
          'Chillers are allowed up to 8.0°C during receiving hours',
          'Record 4.0°C on the log sheet and check again tomorrow',
          'Adjust thermostat to 0°C–4°C immediately, probe internal food temperature, and transfer items to Chiller #2 if >5°C',
          'Turn off the evaporator fan for 30 minutes',
        ],
      },
      {
        id: 's1-h2',
        x: 412,
        y: 252,
        width: 46,
        height: 56,
        isHazard: true,
        docCode: 'IKQA-SOP#009',
        docId: 'ikqa-sop-009',
        hazardTitle: 'Single Swollen Can in Middle Stack',
        sopViolation:
          'The middle can in the receiving stack has a convex bulging top lid and seam dent (Clostridium botulinum neurotoxin risk per IKQA-SOP#009).',
        correctFixIndex: 1,
        fixOptions: [
          'Use the swollen can first under FEFO rules',
          'Segregate in the Reject/Quarantine area immediately, log batch details, and return/dispose per SOP',
          'Puncture the lid to release the pressure and refrigerate',
          'Boil the contents for 3 minutes before serving',
        ],
      },
      {
        id: 's1-h3',
        x: 590,
        y: 165,
        width: 155,
        height: 115,
        isHazard: true,
        docCode: 'IKQAP#011',
        docId: 'ikqap-011',
        hazardTitle: 'Raw Meat Stored Above Uncovered Tofu',
        sopViolation:
          'On the left cold rack, raw meat trays are stored on the middle shelf directly above uncovered Ready-to-Eat white tofu on the lower shelf.',
        correctFixIndex: 0,
        fixOptions: [
          'Discard the contaminated tofu, sanitize the shelf, and store raw meat on the lowest rack below all RTE foods',
          'Cover the tofu with cling wrap and keep raw meat on the shelf above it',
          'Rinse the tofu in cold water for 10 seconds',
          'Move raw meat to the top shelf above sauces',
        ],
      },
      {
        id: 's1-h4',
        x: 765,
        y: 432,
        width: 120,
        height: 62,
        isHazard: true,
        docCode: 'IKQA-SOP#004',
        docId: 'ikqa-sop-004',
        hazardTitle: 'Carton Stored Directly on Floor Tiles (0 cm Clearance)',
        sopViolation:
          'Per IKQA-SOP#004 & IKQAP#011, all food cartons must be elevated at least 6 inches (15 cm) off the floor on dunnage racks—never placed directly on floor tiles.',
        correctFixIndex: 3,
        fixOptions: [
          'Slide a flattened cardboard sheet underneath the box',
          'Leave it on the floor as long as it is sealed',
          'Push it flush against the wet perimeter wall',
          'Elevate onto a sanitized dunnage rack at least 6 inches (15 cm) off the floor and 15 cm away from walls',
        ],
      },
      {
        id: 's1-h5',
        x: 885,
        y: 135,
        width: 65,
        height: 240,
        isHazard: true,
        docCode: 'IKQA-SOP#003',
        docId: 'ikqa-sop-003',
        hazardTitle: 'Back Receiving Door Propped Open with Air Curtain Off',
        sopViolation:
          'The exterior receiving door gap is propped open with a brick while the overhead air curtain indicator is OFF, allowing rodents and flies into the storage bay.',
        correctFixIndex: 1,
        fixOptions: [
          'Place a glue board in the open doorway and leave the brick there',
          'Remove the doorstop immediately, close & seal the exterior door, and switch ON the overhead air curtain',
          'Spray aerosol insecticide over the food crates',
          'Only close the door during night shift',
        ],
      },
      // Safe Distractors in Stage 1 (Clicking these costs a Heart & -5s!)
      {
        id: 's1-ok1',
        x: 185,
        y: 120,
        width: 125,
        height: 250,
        isHazard: false,
        docCode: 'IKQAP#003',
        docId: 'ikqap-003',
        hazardTitle: 'Chiller #2 (2.4°C)',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Chiller #2 is at 2.4°C, which is within the compliant 0°C–4°C range.',
      },
      {
        id: 's1-ok2',
        x: 55,
        y: 410,
        width: 195,
        height: 85,
        isHazard: false,
        docCode: 'IKQAP#003',
        docId: 'ikqap-003',
        hazardTitle: 'Chest Freezer (-19.5°C)',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Deep Freezer is at -19.5°C (compliant with ≤ -18°C standard).',
      },
      {
        id: 's1-ok3',
        x: 345,
        y: 252,
        width: 62,
        height: 56,
        isHazard: false,
        docCode: 'IKQA-SOP#009',
        docId: 'ikqa-sop-009',
        hazardTitle: 'Left Stack of Cans',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Those left cans have flat lids and intact seams. Look closer at the other cans!',
      },
      {
        id: 's1-ok4',
        x: 335,
        y: 410,
        width: 215,
        height: 85,
        isHazard: false,
        docCode: 'IKQA-SOP#004',
        docId: 'ikqa-sop-004',
        hazardTitle: 'Elevated Dunnage Rack Boxes',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: These cartons are properly elevated 15 cm on a dunnage rack with FEFO labels.',
      },
      {
        id: 's1-ok5',
        x: 750,
        y: 120,
        width: 120,
        height: 255,
        isHazard: false,
        docCode: 'IKQAP#011',
        docId: 'ikqap-011',
        hazardTitle: 'Right Shelf Rack',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: The right rack has sealed sauces on top and boxed dry goods below.',
      },
    ],
  },

  // =========================================================================
  // STAGE 2: MEAT SLICING & HOTPOT PREP LINE (5 Subtle Hazards + 6 Safe Distractors)
  // =========================================================================
  {
    stageNumber: 2,
    title: 'STAGE 2: MEAT SLICING & HOTPOT PREP LINE',
    zoneSubtitle: '5 hidden SOP violations in this prep kitchen. Check every board color, tool, drink, thermometer, and pot.',
    timeLimit: 75,
    spots: [
      {
        id: 's2-h1',
        x: 75,
        y: 255,
        width: 135,
        height: 72,
        isHazard: true,
        docCode: 'IKQA-SOP#012',
        docId: 'ikqa-sop-012',
        hazardTitle: 'Wire Slicer With Broken Tension Wire',
        sopViolation:
          'A multi-wire luncheon meat slicer on the left station has a snapped metal wire strand (physical metal contamination hazard per IKQA-SOP#012).',
        correctFixIndex: 0,
        fixOptions: [
          'Stop slicing immediately, discard the entire sliced meat batch, and remove the broken wire frame from service',
          'Pull out the broken wire strand with pliers and keep using the frame',
          'Visually inspect the meat slices and serve them',
          'Switch the wire slicer to soft tofu only',
        ],
      },
      {
        id: 's2-h2',
        x: 245,
        y: 278,
        width: 48,
        height: 52,
        isHazard: true,
        docCode: 'IKQA-SOP#002',
        docId: 'ikqa-sop-002',
        hazardTitle: 'Personal Drink Cup With Straw on Prep Table',
        sopViolation:
          'An open personal iced beverage cup with a straw is sitting directly on the stainless steel food prep counter (saliva & spill contamination hazard per IKQA-SOP#002).',
        correctFixIndex: 2,
        fixOptions: [
          'Put a paper napkin over the straw',
          'Hide the cup behind the cutting board rack',
          'Discard the drink, wash & sanitize the prep table surface, and wash hands for 40–60 seconds',
          'Move the cup onto the overhead spice shelf',
        ],
      },
      {
        id: 's2-h3',
        x: 340,
        y: 270,
        width: 155,
        height: 55,
        isHazard: true,
        docCode: 'IKQA-SOP#010',
        docId: 'ikqa-sop-010',
        hazardTitle: 'Raw Poultry on Green Cutting Board',
        sopViolation:
          'Raw pink chicken drumsticks are placed on a GREEN cutting board. Under IKQA-SOP#010, Green is strictly for Fruits & Vegetables; Raw Poultry requires a YELLOW board.',
        correctFixIndex: 1,
        fixOptions: [
          'Wipe the green board with a wet cloth after cutting chicken',
          'Transfer raw poultry to a sanitized YELLOW board and send the green board to the 3-compartment sink for full wash & sanitization',
          'Switch to a Blue seafood board instead',
          'Flip the green board to the back side',
        ],
      },
      {
        id: 's2-h4',
        x: 715,
        y: 215,
        width: 165,
        height: 112,
        isHazard: true,
        docCode: 'IKQAP#006',
        docId: 'ikqap-006',
        hazardTitle: 'Deep Stockpot Cooling on Counter (36.5°C Since 10:00)',
        sopViolation:
          'The wall clock reads 14:30 (4.5 hours elapsed) and the deep stockpot of bone broth is still sitting on the counter at 36.5°C instead of cooling in shallow pans in an ice bath per IKQAP#006.',
        correctFixIndex: 3,
        fixOptions: [
          'Re-boil the broth for 2 minutes and serve it',
          'Place the giant pot into the walk-in chiller now',
          'Add ice cubes directly into the lukewarm broth',
          'Discard the time-abused broth (>4 hrs in Danger Zone); cool future batches from 60°C→21°C in 2 hrs and 21°C→5°C in 4 hrs',
        ],
      },
      {
        id: 's2-h5',
        x: 745,
        y: 410,
        width: 150,
        height: 92,
        isHazard: true,
        docCode: 'IKQAP#005',
        docId: 'ikqap-005',
        hazardTitle: 'Ice Scoop Stored Handle-Down Inside Ice Bin',
        sopViolation:
          'Inside the open ice bin, the metal ice scoop is buried directly in the edible ice with the handle touching the ice (hand-to-ice contamination per IKQAP#005).',
        correctFixIndex: 0,
        fixOptions: [
          'Remove the scoop, burn/discard the contaminated ice, sanitize the bin & scoop, and store the scoop in an external sanitized holder',
          'Leave the scoop inside the ice bin but point the handle upward',
          'Use bare hands or a glass cup to scoop ice instead',
          'Wipe the scoop handle with a dry apron',
        ],
      },
      // Safe Distractors in Stage 2
      {
        id: 's2-ok1',
        x: 525,
        y: 270,
        width: 155,
        height: 55,
        isHazard: false,
        docCode: 'IKQA-SOP#010',
        docId: 'ikqa-sop-010',
        hazardTitle: 'Red Board With Raw Beef',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Raw beef on a RED cutting board with a red-handled knife is 100% compliant with IKQA-SOP#010.',
      },
      {
        id: 's2-ok2',
        x: 85,
        y: 95,
        width: 190,
        height: 85,
        isHazard: false,
        docCode: 'IKQA-SOP#010',
        docId: 'ikqa-sop-010',
        hazardTitle: 'Magnetic Strip With Solid Knives',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: One-piece stainless steel cleavers on a sanitized magnetic rack are compliant.',
      },
      {
        id: 's2-ok3',
        x: 85,
        y: 410,
        width: 210,
        height: 92,
        isHazard: false,
        docCode: 'IKQA-SOP#010',
        docId: 'ikqa-sop-010',
        hazardTitle: 'Vertical Cutting Board Drying Rack',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Color-coded cutting boards stored vertically in a rack to air-dry are compliant.',
      },
      {
        id: 's2-ok4',
        x: 385,
        y: 410,
        width: 185,
        height: 92,
        isHazard: false,
        docCode: 'IKQAP#020',
        docId: 'ikqap-020',
        hazardTitle: 'Thermometer Calibration Slurry (0.0°C)',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Digital probe thermometer reading 0.0°C in crushed ice-water slurry is properly calibrated.',
      },
    ],
  },

  // =========================================================================
  // STAGE 3: HANDWASH STATION, DISH PIT & CHEMICALS (5 Subtle Hazards + 5 Safe Distractors)
  // =========================================================================
  {
    stageNumber: 3,
    title: 'STAGE 3: HANDWASH STATION, DISH PIT & CHEMICALS',
    zoneSubtitle: '5 hidden SOP violations in this sanitation room. Inspect the sink, soap, towels, chemical concentrations, and floor drains.',
    timeLimit: 75,
    spots: [
      {
        id: 's3-h1',
        x: 65,
        y: 170,
        width: 195,
        height: 165,
        isHazard: true,
        docCode: 'IKQA-SOP#001',
        docId: 'ikqa-sop-001',
        hazardTitle: 'Bar Soap & Wristwatch at Handwash Station',
        sopViolation:
          'At the handwashing sink, there is a yellow bar of soap on the basin rim and the staff member is wearing a gold wristwatch (IKQA-SOP#001 requires liquid antimicrobial soap, 40–60s scrub, and Bare Below Elbows).',
        correctFixIndex: 1,
        fixOptions: [
          'Keep the wristwatch on and scrub with the bar soap for 20 seconds',
          'Remove the wristwatch, discard bar soap, use wall-mounted liquid antimicrobial soap, and perform the 6-step wash for 40–60 seconds',
          'Dip gloved hands into the 3-compartment dish sink',
          'Use alcohol gel instead of washing hands with soap and water',
        ],
      },
      {
        id: 's3-h2',
        x: 345,
        y: 268,
        width: 115,
        height: 55,
        isHazard: true,
        docCode: 'IKQAP#015',
        docId: 'ikqap-015',
        hazardTitle: 'Red Cloth Lying on Kitchen Prep Counter',
        sopViolation:
          'A RED cloth is resting on the stainless kitchen prep table next to food pans. Per IKQAP#015, RED cloths are strictly designated for Restrooms & Toilets; Green is for Kitchen BOH Prep.',
        correctFixIndex: 0,
        fixOptions: [
          'Quarantine the red cloth immediately, fully wash & sanitize the contaminated prep counter, and use a GREEN towel stored in sanitizer solution',
          'Rinse the red cloth in hot water and continue wiping the counter',
          'Use a Blue dining table cloth to dry the clean dishes',
          'Hang the red cloth on the soup pot handle',
        ],
      },
      {
        id: 's3-h3',
        x: 765,
        y: 135,
        width: 75,
        height: 105,
        isHazard: true,
        docCode: 'IKQAP#007',
        docId: 'ikqap-007',
        hazardTitle: 'Trigger Spray Bottle on Overhead Seasoning Shelf',
        sopViolation:
          'An unlabeled purple trigger spray bottle is sitting on the seasoning shelf right beside Sesame Oil and Soy Sauce (IKQAP#007 Chemical Storage Violation).',
        correctFixIndex: 2,
        fixOptions: [
          'Move the spray bottle to the bottom shelf below the soy sauce',
          'Write "Soap" on a piece of masking tape and leave it on the spice rack',
          'Remove from food area immediately, label with SDS chemical identity, and lock inside the dedicated Chemical Cabinet',
          'Pour the chemical into an empty drinking water bottle',
        ],
      },
      {
        id: 's3-h4',
        x: 230,
        y: 405,
        width: 95,
        height: 95,
        isHazard: true,
        docCode: 'IKQA-SOP#002',
        docId: 'ikqa-sop-002',
        hazardTitle: '3-Compartment Sink #3 Sanitizer at 10 ppm Chlorine',
        sopViolation:
          'Sink #3 (Sanitize compartment) digital/strip readout shows only 10 ppm Chlorine. Standard chlorine sanitization requires 100–200 ppm (or ≥50 ppm minimum per local code).',
        correctFixIndex: 3,
        fixOptions: [
          'Add dishwashing detergent foam into Sink #3',
          'Towel-dry the plates with a blue rag instead of sanitizing',
          'Dip dishes for 1 second in cold water',
          'Drain and remix Sink #3 to 100–200 ppm Chlorine, verify with a test strip, and air-dry all sanitized wares',
        ],
      },
      {
        id: 's3-h5',
        x: 525,
        y: 435,
        width: 115,
        height: 68,
        isHazard: true,
        docCode: 'IKQA-SOP#003',
        docId: 'ikqa-sop-003',
        hazardTitle: 'Missing Floor Drain Grate With Cockroach Activity',
        sopViolation:
          'The kitchen floor drain grate is removed/unsealed, exposing an open sewer pipe with a cockroach emerging (IKQA-SOP#003 Pest Defense & Structural Sealing violation).',
        correctFixIndex: 1,
        fixOptions: [
          'Kick a cardboard box over the open floor drain',
          'Sanitize the surrounding floor, install a tight-fitting stainless mesh drain grate, and log for licensed PCO treatment',
          'Leave the drain uncovered so mop water flows faster',
          'Spray toxic bug spray onto the nearby prep counter',
        ],
      },
      // Safe Distractors in Stage 3
      {
        id: 's3-ok1',
        x: 475,
        y: 265,
        width: 115,
        height: 60,
        isHazard: false,
        docCode: 'IKQAP#015',
        docId: 'ikqap-015',
        hazardTitle: 'Green Towel in Sanitizer Bucket',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: A GREEN towel stored inside a labeled sanitizer bucket is compliant for BOH kitchen prep.',
      },
      {
        id: 's3-ok2',
        x: 65,
        y: 405,
        width: 160,
        height: 95,
        isHazard: false,
        docCode: 'IKQA-SOP#002',
        docId: 'ikqa-sop-002',
        hazardTitle: 'Sink #1 Wash (45°C) & Sink #2 Rinse',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Wash (45°C detergent) and Clear Rinse compartments are operating properly. Check Sink #3!',
      },
      {
        id: 's3-ok3',
        x: 645,
        y: 135,
        width: 115,
        height: 105,
        isHazard: false,
        docCode: 'IKQA-SOP#004',
        docId: 'ikqa-sop-004',
        hazardTitle: 'Labeled Sesame Oil & Soy Sauce',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Sealed, date-labeled Sesame Oil and Soy Sauce jugs are compliant.',
      },
      {
        id: 's3-ok4',
        x: 680,
        y: 405,
        width: 215,
        height: 98,
        isHazard: false,
        docCode: 'IKQA-SOP#009',
        docId: 'ikqa-sop-009',
        hazardTitle: 'Closed Foot-Pedal Waste Bins',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Color-coded foot-pedal bins with closed lids (Green/Blue/Black) comply with RA 9003.',
      },
    ],
  },

  // =========================================================================
  // STAGE 4: HOTPOT DISPATCH PASS, RETENTION & SAUCE BAR (5 Subtle Hazards + 5 Safe Distractors)
  // =========================================================================
  {
    stageNumber: 4,
    title: 'STAGE 4: HOTPOT DISPATCH PASS, RETENTION & SAUCE BAR',
    zoneSubtitle: 'Final Boss Audit: 5 subtle violations across the retention bank, allergy pass, broth pots, meat plates, and staff hygiene.',
    timeLimit: 75,
    spots: [
      {
        id: 's4-h1',
        x: 55,
        y: 135,
        width: 185,
        height: 215,
        isHazard: true,
        docCode: 'IKQA-SOP#011',
        docId: 'ikqa-sop-011',
        hazardTitle: 'Empty Today Slot in Food Retention Fridge',
        sopViolation:
          'Inside the QA Retention Fridge (2.2°C), the top row for today’s shift has empty, unlabeled sample jars while service is already underway (IKQA-SOP#011 requires 100–150g/mL collected before opening).',
        correctFixIndex: 1,
        fixOptions: [
          'Fill the jars at midnight using leftover soup from customer tables',
          'Halt dispatch until 100–150g/mL samples of all broths, sauces, and marinated meats are collected in sterile labeled jars',
          'Relabel yesterday’s sample jars with today’s date',
          'Store 20g samples on the warm counter for 12 hours',
        ],
      },
      {
        id: 's4-h2',
        x: 315,
        y: 215,
        width: 175,
        height: 125,
        isHazard: true,
        docCode: 'IKQAP#004',
        docId: 'ikqap-004',
        hazardTitle: 'Shared Ladle in Peanut & Sesame Sauce Bowls on Allergy Order',
        sopViolation:
          'Ticket #08 specifies "NO PEANUTS", yet a single shared metal ladle is resting across the Peanut Sauce and Sesame Paste bowls right beside the plate (IKQAP#004 Allergen Cross-Contact).',
        correctFixIndex: 0,
        fixOptions: [
          'Discard the compromised dish, wash hands for 40–60s, and prepare fresh on the WHITE Allergen-Free board using dedicated utensils',
          'Wipe the ladle handle with a paper towel',
          'Scoop sauce from the bottom of the bowl',
          'Tell the server that trace peanut oil is safe',
        ],
      },
      {
        id: 's4-h3',
        x: 545,
        y: 215,
        width: 145,
        height: 130,
        isHazard: true,
        docCode: 'IKQAP#003',
        docId: 'ikqap-003',
        hazardTitle: 'Broth Warmer #1 Holding at 51.5°C',
        sopViolation:
          'Broth Warmer #1 reads 51.5°C while Warmer #2 reads 68.0°C. Per IKQAP#003, hot-held broths must be maintained at ≥ 60.0°C at all times.',
        correctFixIndex: 2,
        fixOptions: [
          '51.5°C is warm enough if the lid stays closed',
          'Mix half of Warmer #2 into Warmer #1 without checking temperature',
          'Rapidly reheat Broth #1 to ≥ 74°C for 15 seconds (if <2 hrs) and adjust warmer thermostat to hold ≥ 60°C',
          'Turn off the warmer to save electricity between orders',
        ],
      },
      {
        id: 's4-h4',
        x: 295,
        y: 410,
        width: 195,
        height: 92,
        isHazard: true,
        docCode: 'IKQA-SOP#010',
        docId: 'ikqa-sop-010',
        hazardTitle: 'Raw Chicken Served on Orange Angus Beef Plate',
        sopViolation:
          'Raw pale poultry pieces are plated on an ORANGE serving dish. Per IKQA-SOP#010, Orange plates are strictly for Angus Beef; Chicken must be served on White plates.',
        correctFixIndex: 3,
        fixOptions: [
          'Serve it anyway since it will be cooked in the hotpot',
          'Move the raw chicken onto a Blue seafood plate',
          'Cover the orange rim with lettuce leaves',
          'Re-plate raw chicken onto a sanitized WHITE plate and send the contaminated orange plate to the 3-compartment sink',
        ],
      },
      {
        id: 's4-h5',
        x: 725,
        y: 395,
        width: 185,
        height: 110,
        isHazard: true,
        docCode: 'IKQA-SOP#002',
        docId: 'ikqa-sop-002',
        hazardTitle: 'Dispatcher Wearing Mask Below Nose & Dangling Bracelet',
        sopViolation:
          'Staff Member B at the dispatch counter has their mask pulled below the nose/mouth and is wearing a wrist bracelet while handling plates (IKQA-SOP#002 Personal Hygiene violation).',
        correctFixIndex: 0,
        fixOptions: [
          'Have staff step off the line, remove the bracelet, fit a clean mask over nose and mouth, and wash hands for 40–60 seconds',
          'Pull the sleeve down to hide the bracelet',
          'Only wear masks when the store manager is watching',
          'Put a plastic glove over the bracelet',
        ],
      },
      // Safe Distractors in Stage 4
      {
        id: 's4-ok1',
        x: 705,
        y: 215,
        width: 145,
        height: 130,
        isHazard: false,
        docCode: 'IKQAP#003',
        docId: 'ikqap-003',
        hazardTitle: 'Broth Warmer #2 (68.0°C)',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Broth Warmer #2 is holding at 68.0°C, which exceeds the ≥ 60.0°C hot-holding minimum.',
      },
      {
        id: 's4-ok2',
        x: 65,
        y: 410,
        width: 195,
        height: 92,
        isHazard: false,
        docCode: 'IKQA-SOP#010',
        docId: 'ikqa-sop-010',
        hazardTitle: 'Orange Plate With Sliced Angus Beef',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Sliced red Angus Beef on an Orange plate is compliant with IKQA-SOP#010.',
      },
      {
        id: 's4-ok3',
        x: 525,
        y: 395,
        width: 180,
        height: 110,
        isHazard: false,
        docCode: 'IKQA-SOP#002',
        docId: 'ikqa-sop-002',
        hazardTitle: 'Staff Member A (Compliant Uniform)',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'FALSE ALARM: Staff Member A has full hairnet, mask covering nose & mouth, and bare wrists.',
      },
    ],
  },
];

// 8-Bit Chiptune Synthesizer using Web Audio API
class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private step = 0;
  public isBgmMuted = false;
  public isSfxMuted = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
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

  public playTone(
    freq: number,
    durationMs: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    delayMs = 0
  ) {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delayMs / 1000;
    const duration = durationMs / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  public playBlip() {
    this.playTone(587.33, 60, 'square', 0.06, 0);
  }

  public playHazardSpotted() {
    this.playTone(523.25, 70, 'square', 0.09, 0);
    this.playTone(659.25, 70, 'square', 0.09, 70);
    this.playTone(783.99, 120, 'square', 0.1, 140);
  }

  public playCorrectFix() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 95, 'square', 0.1, i * 80);
    });
  }

  public playWrongPenalty() {
    this.playTone(196.0, 140, 'sawtooth', 0.11, 0);
    this.playTone(130.81, 240, 'sawtooth', 0.12, 130);
  }

  public playStageClear() {
    const melody = [
      { f: 523.25, d: 100, t: 0 },
      { f: 659.25, d: 100, t: 100 },
      { f: 783.99, d: 100, t: 200 },
      { f: 1046.5, d: 220, t: 300 },
      { f: 783.99, d: 100, t: 540 },
      { f: 1046.5, d: 350, t: 650 },
    ];
    melody.forEach((m) => this.playTone(m.f, m.d, 'square', 0.1, m.t));
  }

  public playGameOver() {
    const melody = [
      { f: 392.0, d: 160, t: 0 },
      { f: 369.99, d: 160, t: 180 },
      { f: 349.23, d: 160, t: 360 },
      { f: 329.63, d: 400, t: 540 },
    ];
    melody.forEach((m) => this.playTone(m.f, m.d, 'sawtooth', 0.09, m.t));
  }

  public startBGM() {
    this.stopBGM();
    if (this.isBgmMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const leadMelody = [
      659.25, 0, 587.33, 523.25, 587.33, 659.25, 783.99, 0,
      659.25, 523.25, 440.0, 523.25, 587.33, 0, 493.88, 0,
      523.25, 0, 659.25, 0, 783.99, 880.0, 783.99, 659.25,
      587.33, 523.25, 493.88, 587.33, 523.25, 0, 523.25, 0,
    ];
    const bassLine = [
      130.81, 130.81, 196.0, 196.0, 146.83, 146.83, 196.0, 196.0,
      164.81, 164.81, 220.0, 220.0, 146.83, 146.83, 196.0, 196.0,
      130.81, 130.81, 196.0, 196.0, 174.61, 174.61, 220.0, 220.0,
      146.83, 146.83, 196.0, 196.0, 130.81, 196.0, 130.81, 0,
    ];

    this.step = 0;
    this.bgmInterval = window.setInterval(() => {
      if (this.isBgmMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const idx = this.step % leadMelody.length;
      const leadFreq = leadMelody[idx];
      const bassFreq = bassLine[idx];

      if (leadFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(leadFreq, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }

      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.045, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.17);
      }

      this.step++;
    }, 180);
  }

  public stopBGM() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const SpotTheHazardGame: React.FC<SpotTheHazardGameProps> = ({
  documents,
  staffName,
  staffPosition = 'Kitchen Shift Lead',
  staffBranch = 'Jiangnan Hotpot - SM Mall of Asia',
  onOpenDoc,
  initialFocusDoc = null,
}) => {
  const customUploadedDocs = useMemo(
    () => documents.filter((d) => d.isCustom),
    [documents]
  );

  // Dynamically build Stage 5 whenever Master Account has uploaded custom SOPs/Policies/Guides/Checklists
  const allGameStages: GameStage[] = useMemo(() => {
    if (customUploadedDocs.length === 0) {
      return GAME_STAGES;
    }

    const customHazards: KitchenSpot[] = [];
    const slotPositions = [
      { x: 65, y: 155, width: 155, height: 155 },
      { x: 250, y: 155, width: 155, height: 155 },
      { x: 435, y: 155, width: 155, height: 155 },
      { x: 620, y: 155, width: 155, height: 155 },
      { x: 790, y: 155, width: 130, height: 155 },
    ];

    customUploadedDocs.forEach((doc) => {
      if (doc.customHazardSpots && doc.customHazardSpots.length > 0) {
        doc.customHazardSpots.forEach((hz, idx) => {
          if (customHazards.length < 5) {
            const pos = slotPositions[customHazards.length];
            customHazards.push({
              id: `s5-custom-${doc.id}-${idx}`,
              x: pos.x,
              y: pos.y,
              width: pos.width,
              height: pos.height,
              isHazard: true,
              docCode: doc.code,
              docId: doc.id,
              hazardTitle: hz.hazardTitle,
              sopViolation: hz.sopViolation,
              correctFixIndex: hz.correctFixIndex,
              fixOptions: hz.fixOptions,
            });
          }
        });
      } else {
        // Fallback hazard spot generated directly from uploaded document sections/takeaways
        if (customHazards.length < 5) {
          const pos = slotPositions[customHazards.length];
          const primaryRule = doc.keyTakeaways[0] || doc.sections[0]?.items[0] || doc.summary;
          customHazards.push({
            id: `s5-fallback-${doc.id}`,
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
            isHazard: true,
            docCode: doc.code,
            docId: doc.id,
            hazardTitle: `${doc.code} Non-Compliance at Station`,
            sopViolation: `Station is violating ${doc.code} (${doc.title}): ${primaryRule}`,
            correctFixIndex: 0,
            fixOptions: [
              `Immediately enforce ${doc.code}: ${primaryRule}`,
              'Delay corrective action until closing shift',
              'Cover the station without logging or correcting the deviation',
              'Ignore the standard during peak dining service',
            ],
          });
        }
      }
    });

    // Pad up to at least 3 hazards if only 1 custom doc with 2 hazards was uploaded
    while (customHazards.length < 3 && customUploadedDocs[0]) {
      const doc = customUploadedDocs[0];
      const idx = customHazards.length;
      const pos = slotPositions[idx];
      const sec = doc.sections[idx % doc.sections.length];
      const ruleText = sec?.items[0] || doc.summary;
      customHazards.push({
        id: `s5-pad-${idx}`,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        isHazard: true,
        docCode: doc.code,
        docId: doc.id,
        hazardTitle: `${doc.code}: ${sec?.heading || 'Station Verification'} Deviation`,
        sopViolation: `Unverified station step in ${doc.code}: ${ruleText}`,
        correctFixIndex: 0,
        fixOptions: [
          `Execute ${doc.code} requirement: ${ruleText}`,
          'Bypass station logbook verification',
          'Proceed without supervisor sign-off',
          'Wait until next weekly audit',
        ],
      });
    }

    const customDistractors: KitchenSpot[] = [
      {
        id: 's5-ok-1',
        x: 90,
        y: 395,
        width: 210,
        height: 95,
        isHazard: false,
        docCode: customUploadedDocs[0]?.code || 'IKQAP#001',
        docId: customUploadedDocs[0]?.id || 'ikqap-001',
        hazardTitle: 'Verified Master Logbook Terminal',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'COMPLIANT: This digital QA logbook station is up to date and verified!',
      },
      {
        id: 's5-ok-2',
        x: 380,
        y: 395,
        width: 210,
        height: 95,
        isHazard: false,
        docCode: customUploadedDocs[0]?.code || 'IKQAP#018',
        docId: customUploadedDocs[0]?.id || 'ikqap-018',
        hazardTitle: 'Sanitized Prep & Calibration Station',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'COMPLIANT: Sanitizer concentration and calibrated thermometer are within target!',
      },
      {
        id: 's5-ok-3',
        x: 660,
        y: 395,
        width: 210,
        height: 95,
        isHazard: false,
        docCode: customUploadedDocs[0]?.code || 'IKQA-SOP#004',
        docId: customUploadedDocs[0]?.id || 'ikqa-sop-004',
        hazardTitle: 'FEFO Date-Labeled Storage Rack',
        sopViolation: '',
        correctFixIndex: 0,
        fixOptions: [],
        safeExplanation: 'COMPLIANT: All containers are elevated 15cm off the floor with valid FEFO labels!',
      },
    ];

    const stage5: GameStage = {
      stageNumber: 5,
      title: `STAGE 5: MASTER UPLOADED SOP & CHECKLIST AUDIT (${customUploadedDocs.map((d) => d.code).join(', ')})`,
      zoneSubtitle: `Inspect all Master-Uploaded stations (${customHazards.length} Active Custom Violations + 3 Compliant Distractors)`,
      timeLimit: 90,
      spots: [...customHazards, ...customDistractors],
    };

    return [...GAME_STAGES, stage5];
  }, [customUploadedDocs]);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [requireQuizFix, setRequireQuizFix] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('ikqa_hazard_highscore') || '0');
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(75);
  const [resolvedSpotIds, setResolvedSpotIds] = useState<string[]>([]);
  const [activeHazardSpot, setActiveHazardSpot] = useState<KitchenSpot | null>(null);
  const [lastSpottedHazard, setLastSpottedHazard] = useState<KitchenSpot | null>(null);
  const [selectedFixOption, setSelectedFixOption] = useState<number | null>(null);
  const [fixFeedback, setFixFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);
  const [clickMarkers, setClickMarkers] = useState<ClickMarker[]>([]);
  const [toastBanner, setToastBanner] = useState<{
    type: 'ok' | 'warn' | 'hazard';
    text: string;
  } | null>(null);

  const [bgmMuted, setBgmMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const audioRef = useRef<RetroAudioEngine | null>(null);
  if (!audioRef.current) {
    audioRef.current = new RetroAudioEngine();
  }

  const safeStageIdx = Math.min(currentStageIdx, allGameStages.length - 1);
  const currentStage = allGameStages[safeStageIdx] || allGameStages[0];
  const stageHazards = currentStage.spots.filter((s) => s.isHazard);
  const remainingStageHazards = stageHazards.filter((h) => !resolvedSpotIds.includes(h.id));
  const totalHazardsInGame = allGameStages.reduce(
    (acc, st) => acc + st.spots.filter((s) => s.isHazard).length,
    0
  );
  const totalResolvedHazards = resolvedSpotIds.length;

  useEffect(() => {
    return () => {
      audioRef.current?.stopBGM();
    };
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('ikqa_hazard_highscore', String(score));
      } catch {
        // ignore storage errors
      }
    }
  }, [score, highScore]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          audioRef.current?.stopBGM();
          audioRef.current?.playGameOver();
          setGameState('GAME_OVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const addClickMarker = (x: number, y: number, kind: ClickMarker['kind'], label: string) => {
    const id = Date.now() + Math.random();
    setClickMarkers((prev) => [...prev.slice(-3), { id, x, y, kind, label }]);
    window.setTimeout(() => {
      setClickMarkers((prev) => prev.filter((m) => m.id !== id));
    }, 1400);
  };

  const handleToggleBgm = () => {
    const next = !bgmMuted;
    setBgmMuted(next);
    if (audioRef.current) {
      audioRef.current.isBgmMuted = next;
      if (next) {
        audioRef.current.stopBGM();
      } else if (gameState === 'PLAYING' || gameState === 'HAZARD_QUIZ') {
        audioRef.current.startBGM();
      }
    }
  };

  const handleToggleSfx = () => {
    const next = !sfxMuted;
    setSfxMuted(next);
    if (audioRef.current) {
      audioRef.current.isSfxMuted = next;
    }
  };

  const startNewGame = useCallback(
    (startStage = 0) => {
      const targetIdx = Math.min(startStage, allGameStages.length - 1);
      setCurrentStageIdx(targetIdx);
      setScore(0);
      setLives(3);
      setCombo(1);
      setResolvedSpotIds([]);
      setActiveHazardSpot(null);
      setLastSpottedHazard(null);
      setSelectedFixOption(null);
      setFixFeedback(null);
      setClickMarkers([]);
      const st = allGameStages[targetIdx] || allGameStages[0];
      const hazCount = st.spots.filter((s) => s.isHazard).length;
      setToastBanner({
        type: 'hazard',
        text: `HARD AUDIT: Find all ${hazCount} SOP Violations in this room. Random/wrong clicks cost -5s & -1 Heart!`,
      });
      setTimeLeft(st.timeLimit);
      setGameState('PLAYING');
      audioRef.current?.playBlip();
      audioRef.current?.startBGM();
    },
    [allGameStages]
  );

  // If user launched SpotTheHazardGame focusing on a Master-uploaded custom doc, open Stage 5 directly
  useEffect(() => {
    if (initialFocusDoc && initialFocusDoc.isCustom && allGameStages.length >= 5) {
      startNewGame(4);
    }
  }, [initialFocusDoc, allGameStages.length, startNewGame]);

  const applyWrongClickPenalty = (x: number, y: number, reasonText: string) => {
    audioRef.current?.playWrongPenalty();
    setCombo(1);
    addClickMarker(x, y, 'penalty', '-1 ♥  -5 SEC');
    setToastBanner({
      type: 'warn',
      text: `${reasonText} (-1 Heart & -5s Penalty!)`,
    });
    setTimeLeft((prev) => {
      const nextTime = Math.max(0, prev - 5);
      if (nextTime <= 0) {
        audioRef.current?.stopBGM();
        audioRef.current?.playGameOver();
        setGameState('GAME_OVER');
      }
      return nextTime;
    });
    setLives((prev) => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        audioRef.current?.stopBGM();
        audioRef.current?.playGameOver();
        setGameState('GAME_OVER');
      }
      return nextLives;
    });
  };

  const completeHazardResolution = (spot: KitchenSpot, earnedPoints: number) => {
    const updatedResolved = [...resolvedSpotIds, spot.id];
    setResolvedSpotIds(updatedResolved);
    setLastSpottedHazard(spot);

    const allStageHazardsDone = stageHazards.every((h) => updatedResolved.includes(h.id));
    if (allStageHazardsDone) {
      const timeBonus = timeLeft * 15;
      setScore((prev) => prev + earnedPoints + timeBonus);
      audioRef.current?.playStageClear();
      window.setTimeout(() => {
        if (safeStageIdx + 1 >= allGameStages.length) {
          audioRef.current?.stopBGM();
          setGameState('VICTORY');
        } else {
          setGameState('STAGE_CLEAR');
        }
      }, 750);
    } else {
      setScore((prev) => prev + earnedPoints);
      const remaining = stageHazards.filter((h) => !updatedResolved.includes(h.id)).length;
      setToastBanner({
        type: 'ok',
        text: `VERIFIED: ${spot.hazardTitle} (${spot.docCode}). ${remaining} violation${
          remaining > 1 ? 's' : ''
        } remaining in this room!`,
      });
    }
  };

  const handleSpotClick = (e: React.MouseEvent, spot: KitchenSpot) => {
    e.stopPropagation();
    if (gameState !== 'PLAYING') return;

    const centerX = spot.x + spot.width / 2;
    const centerY = spot.y + spot.height / 2;

    if (resolvedSpotIds.includes(spot.id)) {
      return;
    }

    if (spot.isHazard) {
      audioRef.current?.playHazardSpotted();
      addClickMarker(centerX, centerY, 'hazard', `SPOTTED! +${200 * combo}`);

      if (!requireQuizFix) {
        const pts = 250 * combo;
        setCombo((prev) => Math.min(prev + 1, 5));
        completeHazardResolution(spot, pts);
      } else {
        setScore((prev) => prev + 150 * combo);
        setActiveHazardSpot(spot);
        setSelectedFixOption(null);
        setFixFeedback(null);
        setGameState('HAZARD_QUIZ');
      }
    } else {
      applyWrongClickPenalty(
        centerX,
        centerY,
        spot.safeExplanation || 'That station is SOP compliant!'
      );
    }
  };

  const handleBackgroundMissClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (gameState !== 'PLAYING' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 960;
    const clickY = ((e.clientY - rect.top) / rect.height) * 540;
    applyWrongClickPenalty(
      clickX,
      clickY,
      'MISSED CLICK: No violation at that spot! Inspect equipment carefully.'
    );
  };

  const handleAnswerHazardFix = (optionIdx: number) => {
    if (!activeHazardSpot || fixFeedback) return;
    setSelectedFixOption(optionIdx);

    const isCorrect = optionIdx === activeHazardSpot.correctFixIndex;
    if (isCorrect) {
      audioRef.current?.playCorrectFix();
      const bonus = 250 * combo;
      setScore((prev) => prev + bonus);
      setCombo((prev) => Math.min(prev + 1, 5));
      setFixFeedback({
        correct: true,
        message: `CORRECT SOP ACTION! +${bonus} PTS (${activeHazardSpot.docCode})`,
      });
    } else {
      audioRef.current?.playWrongPenalty();
      setCombo(1);
      setFixFeedback({
        correct: false,
        message: `INCORRECT PROTOCOL (-1 HEART)! You must re-inspect this violation.`,
      });
      setLives((prev) => {
        const nextLives = prev - 1;
        if (nextLives <= 0) {
          audioRef.current?.stopBGM();
          audioRef.current?.playGameOver();
          setGameState('GAME_OVER');
        }
        return nextLives;
      });
    }
  };

  const handleContinueAfterHazard = () => {
    if (!activeHazardSpot || !fixFeedback) return;
    const spot = activeHazardSpot;
    const wasCorrect = fixFeedback.correct;
    setActiveHazardSpot(null);
    setSelectedFixOption(null);
    setFixFeedback(null);
    setGameState('PLAYING');
    if (wasCorrect) {
      completeHazardResolution(spot, 0);
    } else {
      setToastBanner({
        type: 'warn',
        text: `Violation still active! Click it again and select the right ${spot.docCode} corrective action.`,
      });
    }
  };

  const handleNextStage = () => {
    const nextIdx = safeStageIdx + 1;
    if (nextIdx >= allGameStages.length) {
      audioRef.current?.stopBGM();
      setGameState('VICTORY');
      return;
    }
    setCurrentStageIdx(nextIdx);
    setLastSpottedHazard(null);
    setTimeLeft(allGameStages[nextIdx].timeLimit);
    const hazCount = allGameStages[nextIdx].spots.filter((s) => s.isHazard).length;
    setToastBanner({
      type: 'hazard',
      text: `${allGameStages[nextIdx].title} — Find all ${hazCount} hidden SOP Violations!`,
    });
    audioRef.current?.playBlip();
    setGameState('PLAYING');
  };

  const handleOpenPolicyById = (docId: string) => {
    if (!onOpenDoc) return;
    const found = documents.find((d) => d.id === docId);
    if (found) {
      audioRef.current?.stopBGM();
      onOpenDoc(found);
    }
  };

  // ============================================================================
  // HARD MODE KITCHEN SCENE RENDERER (ZERO SPOILER LABELS, UNIFORM STYLING)
  // ============================================================================
  const renderKitchenSceneSVG = () => {
    const isResolved = (id: string) => resolvedSpotIds.includes(id);

    return (
      <svg
        ref={svgRef}
        viewBox="0 0 960 540"
        onClick={handleBackgroundMissClick}
        className="w-full h-auto block cursor-crosshair select-none"
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          <pattern id="wallTiles" width="48" height="24" patternUnits="userSpaceOnUse">
            <rect width="48" height="24" fill="#1e293b" />
            <path d="M 48 0 L 0 0 0 24" fill="none" stroke="#334155" strokeWidth="2" />
          </pattern>
          <pattern id="floorTiles" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect width="32" height="32" fill="#0f172a" />
            <rect x="32" width="32" height="32" fill="#1e293b" />
            <rect y="32" width="32" height="32" fill="#1e293b" />
            <rect x="32" y="32" width="32" height="32" fill="#0f172a" />
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#334155" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>

        {/* BACK WALL & FLOOR */}
        <rect x="0" y="0" width="960" height="370" fill="url(#wallTiles)" />
        <rect x="0" y="365" width="960" height="12" fill="#475569" />
        <rect x="0" y="377" width="960" height="163" fill="url(#floorTiles)" />

        {/* CEILING DUCT & LIGHTS */}
        <rect x="0" y="0" width="960" height="40" fill="#090d16" />
        <rect x="0" y="40" width="960" height="5" fill="#475569" />
        <rect x="120" y="12" width="160" height="10" rx="3" fill="#e2e8f0" />
        <rect x="400" y="12" width="160" height="10" rx="3" fill="#e2e8f0" />
        <rect x="680" y="12" width="160" height="10" rx="3" fill="#e2e8f0" />

        {/* =====================================================================
            STAGE 1: RECEIVING & COLD STORAGE ROOM (5 Hazards + 5 Distractors)
           ===================================================================== */}
        {currentStage.stageNumber === 1 && (
          <g>
            {/* 1. CHILLER #1 (LEFT) - s1-h1 (7.8°C in uniform cyan LED font — no red alarm giveaway!) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[0])}>
              <rect x="50" y="120" width="125" height="250" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
              <rect x="60" y="130" width="105" height="230" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
              <rect x="75" y="142" width="75" height="26" rx="3" fill="#020617" stroke="#334155" strokeWidth="2" />
              <text x="112" y="160" textAnchor="middle" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                {!isResolved('s1-h1') ? '7.8°C' : '2.2°C'}
              </text>
              <rect x="78" y="182" width="70" height="55" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <rect x="148" y="235" width="10" height="32" fill="#334155" />
              <text x="112" y="348" textAnchor="middle" fill="#334155" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                CHILLER #1
              </text>
            </g>

            {/* 2. CHILLER #2 (NEXT TO CHILLER #1) - s1-ok1 (2.4°C Compliant Distractor) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[5])}>
              <rect x="185" y="120" width="125" height="250" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
              <rect x="195" y="130" width="105" height="230" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
              <rect x="210" y="142" width="75" height="26" rx="3" fill="#020617" stroke="#334155" strokeWidth="2" />
              <text x="247" y="160" textAnchor="middle" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                2.4°C
              </text>
              <rect x="213" y="182" width="70" height="55" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <rect x="283" y="235" width="10" height="32" fill="#334155" />
              <text x="247" y="348" textAnchor="middle" fill="#334155" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                CHILLER #2
              </text>
            </g>

            {/* RECEIVING STAINLESS TABLE (CENTER) */}
            <rect x="330" y="308" width="230" height="14" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            <rect x="345" y="322" width="10" height="55" fill="#64748b" />
            <rect x="535" y="322" width="10" height="55" fill="#64748b" />

            {/* Left Cans Stack (Safe Distractor s1-ok3) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[7])}>
              <rect x="348" y="268" width="26" height="40" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
              <rect x="348" y="266" width="26" height="4" fill="#cbd5e1" />
              <rect x="378" y="268" width="26" height="40" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
              <rect x="378" y="266" width="26" height="4" fill="#cbd5e1" />
            </g>

            {/* Middle Bulging/Dented Can (Hazard s1-h2) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[1])}>
              {!isResolved('s1-h2') ? (
                <>
                  {/* Subtle convex dome lid & indented side seam */}
                  <path d="M416 266 Q410 286 418 308 L448 308 Q456 286 450 266 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
                  <ellipse cx="433" cy="264" rx="17" ry="7" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
                  <ellipse cx="445" cy="309" rx="12" ry="3" fill="#65a30d" opacity="0.7" />
                </>
              ) : (
                <>
                  <rect x="418" y="268" width="28" height="40" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
                  <rect x="418" y="266" width="28" height="4" fill="#cbd5e1" />
                </>
              )}
            </g>

            {/* Right Cans on Table (Visual clutter) */}
            <rect x="464" y="268" width="26" height="40" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
            <rect x="464" y="266" width="26" height="4" fill="#cbd5e1" />
            <rect x="494" y="268" width="26" height="40" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
            <rect x="494" y="266" width="26" height="4" fill="#cbd5e1" />

            {/* 3. LEFT MULTI-TIER STORAGE RACK (s1-h3: Raw meat above uncovered white tofu) */}
            <rect x="590" y="120" width="8" height="255" fill="#64748b" />
            <rect x="738" y="120" width="8" height="255" fill="#64748b" />
            <rect x="590" y="162" width="156" height="7" fill="#94a3b8" />
            <rect x="590" y="222" width="156" height="7" fill="#94a3b8" />
            <rect x="590" y="282" width="156" height="7" fill="#94a3b8" />
            <rect x="590" y="342" width="156" height="7" fill="#94a3b8" />

            {/* Top shelf: Sealed dry noodle tubs */}
            <rect x="605" y="132" width="55" height="30" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <rect x="670" y="132" width="55" height="30" rx="2" fill="#334155" stroke="#64748b" strokeWidth="1.5" />

            <g onClick={(e) => handleSpotClick(e, currentStage.spots[2])}>
              {!isResolved('s1-h3') ? (
                <>
                  {/* Shelf 2: Raw marbled red meat cuts */}
                  <rect x="605" y="196" width="125" height="26" rx="2" fill="#7f1d1d" />
                  <ellipse cx="642" cy="195" rx="26" ry="7" fill="#dc2626" />
                  <ellipse cx="695" cy="195" rx="26" ry="7" fill="#b91c1c" />
                  {/* Subtle red droplets falling onto Shelf 3 white tofu */}
                  <circle cx="645" cy="236" r="2.5" fill="#dc2626" />
                  <circle cx="688" cy="242" r="2.5" fill="#dc2626" />
                  {/* Shelf 3: Uncovered white tofu blocks */}
                  <rect x="610" y="252" width="115" height="30" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <ellipse cx="688" cy="254" rx="10" ry="3" fill="#ef4444" />
                </>
              ) : (
                <>
                  {/* Fixed: White Tofu above, Raw Meat on bottom */}
                  <rect x="610" y="192" width="115" height="30" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="605" y="256" width="125" height="26" rx="2" fill="#7f1d1d" />
                </>
              )}
            </g>
            {/* Bottom shelf: Green produce crate */}
            <rect x="608" y="310" width="120" height="32" rx="2" fill="#166534" />

            {/* RIGHT STORAGE RACK (Safe Distractor s1-ok5) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[9])}>
              <rect x="755" y="120" width="8" height="255" fill="#64748b" />
              <rect x="862" y="120" width="8" height="255" fill="#64748b" />
              <rect x="755" y="190" width="115" height="7" fill="#94a3b8" />
              <rect x="755" y="270" width="115" height="7" fill="#94a3b8" />
              <rect x="755" y="342" width="115" height="7" fill="#94a3b8" />
              <rect x="770" y="148" width="82" height="42" rx="3" fill="#475569" />
              <rect x="770" y="225" width="82" height="45" rx="3" fill="#334155" />
              <rect x="770" y="295" width="82" height="47" rx="3" fill="#1e293b" />
            </g>

            {/* 4. BACK RECEIVING DOOR & AIR CURTAIN (FAR RIGHT) - s1-h5 */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[4])}>
              {/* Overhead Air Curtain Unit */}
              <rect x="880" y="102" width="72" height="24" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
              {/* Status LED on Air Curtain */}
              <circle cx="892" cy="114" r="4" fill={!isResolved('s1-h5') ? '#475569' : '#10b981'} />
              {/* Door Frame */}
              <rect x="885" y="130" width="65" height="240" fill="#334155" stroke="#475569" strokeWidth="3" />
              {!isResolved('s1-h5') ? (
                <>
                  {/* Open gap showing dark alley outside + red brick propping door open + 2 small flies */}
                  <rect x="888" y="134" width="22" height="234" fill="#020617" />
                  <rect x="886" y="352" width="26" height="16" fill="#991b1b" stroke="#450a0a" strokeWidth="1.5" />
                  <circle cx="880" cy="210" r="2.5" fill="#020617" />
                  <circle cx="874" cy="222" r="2" fill="#020617" />
                </>
              ) : (
                <rect x="888" y="134" width="58" height="234" fill="#64748b" />
              )}
            </g>

            {/* 5. DEEP FREEZER (BOTTOM LEFT) - Safe Distractor s1-ok2 */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[6])}>
              <rect x="55" y="410" width="195" height="85" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="2.5" />
              <rect x="55" y="410" width="195" height="18" fill="#94a3b8" />
              <rect x="115" y="440" width="75" height="24" rx="3" fill="#020617" />
              <text x="152" y="456" textAnchor="middle" fill="#38bdf8" fontSize="13" fontFamily="monospace" fontWeight="bold">
                -19.5°C
              </text>
            </g>

            {/* 6. DUNNAGE RACK CARTONS (BOTTOM CENTER) - Safe Distractor s1-ok4 */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[8])}>
              <rect x="335" y="472" width="215" height="10" fill="#475569" />
              <rect x="345" y="482" width="12" height="16" fill="#334155" />
              <rect x="525" y="482" width="12" height="16" fill="#334155" />
              <rect x="350" y="412" width="88" height="60" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="2" />
              <rect x="448" y="412" width="88" height="60" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="2" />
            </g>

            {/* 7. CARTON SITTING DIRECTLY ON FLOOR TILES (BOTTOM RIGHT) - Hazard s1-h4 */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[3])}>
              {!isResolved('s1-h4') ? (
                /* Sitting directly on floor tiles at y=438 with no rack underneath */
                <rect x="770" y="436" width="110" height="60" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="2" />
              ) : (
                <>
                  <rect x="762" y="472" width="126" height="10" fill="#475569" />
                  <rect x="770" y="482" width="10" height="16" fill="#334155" />
                  <rect x="868" y="482" width="10" height="16" fill="#334155" />
                  <rect x="770" y="412" width="110" height="60" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="2" />
                </>
              )}
            </g>
          </g>
        )}

        {/* =====================================================================
            STAGE 2: MEAT SLICING & HOTPOT PREP LINE (5 Hazards + 4 Distractors)
           ===================================================================== */}
        {currentStage.stageNumber === 2 && (
          <g>
            {/* WALL CLOCK SHOWING 14:30 */}
            <circle cx="585" cy="95" r="26" fill="#f8fafc" stroke="#334155" strokeWidth="4" />
            <line x1="585" y1="95" x2="585" y2="76" stroke="#0f172a" strokeWidth="2.5" />
            <line x1="585" y1="95" x2="600" y2="104" stroke="#dc2626" strokeWidth="2.5" />
            <text x="585" y="135" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              14:30
            </text>

            {/* LONG STAINLESS STEEL PREP COUNTER */}
            <rect x="50" y="325" width="860" height="18" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
            <rect x="75" y="343" width="14" height="115" fill="#64748b" />
            <rect x="475" y="343" width="14" height="115" fill="#64748b" />
            <rect x="870" y="343" width="14" height="115" fill="#64748b" />

            {/* 1. WALL MAGNETIC KNIFE RACK (Safe Distractor s2-ok2) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[6])}>
              <rect x="85" y="110" width="190" height="14" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
              <rect x="110" y="95" width="22" height="60" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              <rect x="165" y="95" width="22" height="60" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              <rect x="220" y="95" width="22" height="60" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
            </g>

            {/* 2. WIRE SLICER ON LEFT PREP STATION (Hazard s2-h1) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[0])}>
              <rect x="75" y="308" width="135" height="17" rx="2" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
              <rect x="95" y="278" width="85" height="30" rx="3" fill="#f472b6" stroke="#be185d" strokeWidth="1.5" />
              {!isResolved('s2-h1') ? (
                <>
                  <rect x="85" y="258" width="108" height="50" fill="none" stroke="#94a3b8" strokeWidth="4" />
                  <line x1="105" y1="258" x2="105" y2="308" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="122" y1="258" x2="122" y2="308" stroke="#cbd5e1" strokeWidth="1" />
                  {/* Subtle snapped wire bent sideways */}
                  <path d="M140 258 L136 280 L149 288" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                  <line x1="158" y1="258" x2="158" y2="308" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="175" y1="258" x2="175" y2="308" stroke="#cbd5e1" strokeWidth="1" />
                </>
              ) : (
                <rect x="115" y="262" width="65" height="16" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
              )}
            </g>

            {/* 3. PERSONAL ICED COFFEE CUP WITH STRAW ON PREP COUNTER (Hazard s2-h2) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[1])}>
              {!isResolved('s2-h2') && (
                <>
                  <polygon points="255,286 285,286 280,325 260,325" fill="#d97706" opacity="0.85" stroke="#f8fafc" strokeWidth="1.5" />
                  <path d="M252 286 Q270 274 288 286 Z" fill="#e2e8f0" opacity="0.7" />
                  <line x1="270" y1="295" x2="282" y2="264" stroke="#ef4444" strokeWidth="3" />
                </>
              )}
            </g>

            {/* 4. GREEN CUTTING BOARD WITH RAW CHICKEN DRUMSTICKS (Hazard s2-h3) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[2])}>
              <rect
                x="340"
                y="302"
                width="155"
                height="23"
                rx="3"
                fill={!isResolved('s2-h3') ? '#16a34a' : '#eab308'}
                stroke="#334155"
                strokeWidth="2"
              />
              {/* Raw pink chicken legs */}
              <ellipse cx="395" cy="290" rx="26" ry="12" fill="#fda4af" stroke="#e11d48" strokeWidth="1.5" />
              <rect x="418" y="287" width="18" height="6" rx="2" fill="#fff1f2" />
              <ellipse cx="455" cy="292" rx="22" ry="10" fill="#fda4af" stroke="#e11d48" strokeWidth="1.5" />
            </g>

            {/* 5. RED CUTTING BOARD WITH RAW BEEF (Safe Distractor s2-ok1) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[5])}>
              <rect x="525" y="302" width="155" height="23" rx="3" fill="#dc2626" stroke="#334155" strokeWidth="2" />
              <ellipse cx="585" cy="290" rx="32" ry="11" fill="#991b1b" stroke="#fecaca" strokeWidth="1.5" />
              <ellipse cx="635" cy="292" rx="24" ry="9" fill="#991b1b" stroke="#fecaca" strokeWidth="1.5" />
            </g>

            {/* 6. DEEP BONE BROTH STOCKPOT ON COUNTER (Hazard s2-h4) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[3])}>
              {!isResolved('s2-h4') ? (
                <>
                  <rect x="725" y="225" width="145" height="100" rx="4" fill="#64748b" stroke="#334155" strokeWidth="3" />
                  <ellipse cx="797" cy="225" rx="72" ry="10" fill="#d97706" stroke="#475569" strokeWidth="2" />
                  {/* Standard digital thermometer readout & batch time sticker */}
                  <rect x="752" y="252" width="90" height="44" rx="3" fill="#020617" stroke="#475569" strokeWidth="1.5" />
                  <text x="797" y="271" textAnchor="middle" fill="#38bdf8" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    36.5°C
                  </text>
                  <text x="797" y="288" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                    OUT: 10:00
                  </text>
                </>
              ) : (
                <>
                  <rect x="715" y="280" width="165" height="45" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  <rect x="730" y="268" width="60" height="24" fill="#cbd5e1" />
                  <rect x="802" y="268" width="60" height="24" fill="#cbd5e1" />
                </>
              )}
            </g>

            {/* 7. VERTICAL CUTTING BOARD RACK (Safe Distractor s2-ok3) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[7])}>
              <rect x="85" y="475" width="210" height="16" fill="#475569" />
              <rect x="105" y="415" width="14" height="60" rx="2" fill="#eab308" />
              <rect x="135" y="415" width="14" height="60" rx="2" fill="#16a34a" />
              <rect x="165" y="415" width="14" height="60" rx="2" fill="#2563eb" />
              <rect x="195" y="415" width="14" height="60" rx="2" fill="#dc2626" />
              <rect x="225" y="415" width="14" height="60" rx="2" fill="#f8fafc" />
            </g>

            {/* 8. THERMOMETER ICE SLURRY CALIBRATION CUP (Safe Distractor s2-ok4) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[8])}>
              <rect x="385" y="415" width="185" height="82" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <rect x="405" y="430" width="38" height="52" rx="3" fill="#38bdf8" opacity="0.4" stroke="#7dd3fc" strokeWidth="1.5" />
              <line x1="424" y1="412" x2="424" y2="470" stroke="#e2e8f0" strokeWidth="2.5" />
              <text x="505" y="460" textAnchor="middle" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                0.0°C
              </text>
            </g>

            {/* 9. ICE BIN WITH SCOOP INSIDE ICE (Hazard s2-h5) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[4])}>
              <rect x="745" y="410" width="150" height="88" rx="4" fill="#64748b" stroke="#475569" strokeWidth="2.5" />
              <rect x="757" y="422" width="126" height="45" fill="#bae6fd" />
              {!isResolved('s2-h5') ? (
                <>
                  {/* Scoop buried directly inside the ice */}
                  <ellipse cx="815" cy="445" rx="20" ry="10" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
                  <line x1="832" y1="445" x2="858" y2="452" stroke="#0f172a" strokeWidth="5" />
                </>
              ) : (
                /* Fixed: Scoop hanging in external holder on side of bin */
                <rect x="900" y="425" width="18" height="35" rx="3" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
              )}
            </g>
          </g>
        )}

        {/* =====================================================================
            STAGE 3: HANDWASH STATION, DISH PIT & CHEMICALS (5 Hazards + 4 Distractors)
           ===================================================================== */}
        {currentStage.stageNumber === 3 && (
          <g>
            {/* 1. HANDWASHING SINK STATION (LEFT) - s3-h1 */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[0])}>
              <rect x="65" y="155" width="195" height="180" rx="5" fill="#334155" stroke="#64748b" strokeWidth="3" />
              <rect x="85" y="255" width="155" height="58" rx="5" fill="#cbd5e1" stroke="#475569" strokeWidth="2.5" />
              <path d="M162 255 L162 205 Q162 190 180 190 L180 208" fill="none" stroke="#94a3b8" strokeWidth="5" />
              {/* Wall Dispenser */}
              <rect x="92" y="175" width="26" height="38" rx="3" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />

              {!isResolved('s3-h1') ? (
                <>
                  {/* Yellow bar soap sitting on sink rim + hands with gold wristwatch */}
                  <rect x="95" y="242" width="28" height="12" rx="3" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />
                  <rect x="138" y="222" width="52" height="20" rx="7" fill="#fdba74" stroke="#9a3412" strokeWidth="1.5" />
                  <rect x="145" y="219" width="10" height="26" fill="#eab308" stroke="#713f12" strokeWidth="1.5" />
                </>
              ) : (
                <>
                  <circle cx="162" cy="232" r="12" fill="#e0f2fe" opacity="0.85" />
                  <circle cx="176" cy="226" r="9" fill="#bae6fd" opacity="0.85" />
                </>
              )}
            </g>

            {/* 2. PREP COUNTER WITH RED CLOTH (Hazard s3-h2) & GREEN TOWEL BUCKET (Safe s3-ok1) */}
            <rect x="325" y="315" width="285" height="16" fill="#cbd5e1" stroke="#475569" strokeWidth="2.5" />
            <rect x="345" y="331" width="12" height="80" fill="#64748b" />
            <rect x="575" y="331" width="12" height="80" fill="#64748b" />

            {/* Red Towel on Counter (Hazard s3-h2) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[1])}>
              {!isResolved('s3-h2') ? (
                <path d="M355 288 L435 288 L428 318 L348 318 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
              ) : (
                <path d="M355 288 L435 288 L428 318 L348 318 Z" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
              )}
            </g>

            {/* Green Towel in Sanitizer Bucket on right side of table (Safe Distractor s3-ok1) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[5])}>
              <rect x="495" y="272" width="65" height="43" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
              <path d="M508 264 L545 264 L540 285 L505 285 Z" fill="#16a34a" stroke="#bbf7d0" strokeWidth="1.5" />
            </g>

            {/* 3. OVERHEAD SEASONING SHELF: Oils (Safe s3-ok3) + Spray Bottle (Hazard s3-h3) */}
            <rect x="640" y="232" width="225" height="10" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[7])}>
              <rect x="655" y="162" width="44" height="70" rx="5" fill="#d97706" stroke="#78350f" strokeWidth="2" />
              <rect x="708" y="166" width="42" height="66" rx="4" fill="#451a03" stroke="#78350f" strokeWidth="2" />
            </g>

            <g onClick={(e) => handleSpotClick(e, currentStage.spots[2])}>
              {!isResolved('s3-h3') && (
                <>
                  {/* Purple chemical trigger spray bottle sitting next to soy sauce */}
                  <rect x="775" y="168" width="44" height="64" rx="5" fill="#7e22ce" stroke="#581c87" strokeWidth="2" />
                  <rect x="787" y="148" width="18" height="20" fill="#cbd5e1" />
                  <path d="M805 152 L822 158" stroke="#ef4444" strokeWidth="3.5" />
                </>
              )}
            </g>

            {/* 4. 3-COMPARTMENT DISH SINK: Wash & Rinse (Safe s3-ok2) + Sanitize 10 ppm (Hazard s3-h4) */}
            <rect x="65" y="405" width="260" height="92" rx="4" fill="#64748b" stroke="#475569" strokeWidth="3" />
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[6])}>
              <rect x="75" y="416" width="74" height="52" fill="#0ea5e9" opacity="0.55" />
              <rect x="156" y="416" width="74" height="52" fill="#38bdf8" opacity="0.55" />
              <text x="112" y="446" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="monospace" fontWeight="bold">
                45°C
              </text>
              <text x="193" y="446" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="monospace" fontWeight="bold">
                RINSE
              </text>
            </g>

            <g onClick={(e) => handleSpotClick(e, currentStage.spots[3])}>
              <rect x="237" y="416" width="78" height="52" fill="#0284c7" opacity="0.55" />
              <text x="276" y="446" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                {!isResolved('s3-h4') ? '10 ppm' : '150 ppm'}
              </text>
            </g>

            {/* 5. UNSEALED FLOOR DRAIN WITH PEST (BOTTOM CENTER) - Hazard s3-h5 */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[4])}>
              {!isResolved('s3-h5') ? (
                <>
                  {/* Dark open drain hole + displaced grate beside it + small brown roach */}
                  <circle cx="565" cy="468" r="22" fill="#020617" stroke="#334155" strokeWidth="3" />
                  <circle cx="605" cy="474" r="18" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 2" />
                  <ellipse cx="545" cy="452" rx="7" ry="4" fill="#451a03" />
                  <path d="M538 450 L530 445 M538 454 L530 458" stroke="#451a03" strokeWidth="1.5" />
                </>
              ) : (
                <>
                  <circle cx="565" cy="468" r="22" fill="#334155" stroke="#64748b" strokeWidth="3" />
                  <line x1="548" y1="462" x2="582" y2="462" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="548" y1="468" x2="582" y2="468" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="548" y1="474" x2="582" y2="474" stroke="#94a3b8" strokeWidth="2" />
                </>
              )}
            </g>

            {/* 6. COLOR-CODED FOOT-PEDAL WASTE BINS (Safe Distractor s3-ok4) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[8])}>
              <rect x="685" y="410" width="58" height="88" rx="3" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
              <rect x="755" y="410" width="58" height="88" rx="3" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2" />
              <rect x="825" y="410" width="58" height="88" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="2" />
            </g>
          </g>
        )}

        {/* =====================================================================
            STAGE 4: HOTPOT DISPATCH PASS, RETENTION & SAUCE BAR (5 Hazards + 3 Distractors)
           ===================================================================== */}
        {currentStage.stageNumber === 4 && (
          <g>
            {/* 1. QA DAILY RETENTION CHILLER (LEFT) - s4-h1 */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[0])}>
              <rect x="55" y="135" width="185" height="215" rx="5" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
              <rect x="70" y="148" width="155" height="22" rx="2" fill="#020617" />
              <text x="147" y="163" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                RETENTION: 2.2°C
              </text>
              <line x1="70" y1="242" x2="225" y2="242" stroke="#64748b" strokeWidth="2.5" />
              <line x1="70" y1="312" x2="225" y2="312" stroke="#64748b" strokeWidth="2.5" />

              {/* Top Shelf (Today's Shift): Empty clear jars vs filled jars */}
              {!isResolved('s4-h1') ? (
                <>
                  <rect x="82" y="196" width="32" height="42" rx="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="130" y="196" width="32" height="42" rx="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="178" y="196" width="32" height="42" rx="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                </>
              ) : (
                <>
                  <rect x="82" y="196" width="32" height="42" rx="3" fill="#dc2626" stroke="#e2e8f0" strokeWidth="1.5" />
                  <rect x="130" y="196" width="32" height="42" rx="3" fill="#d97706" stroke="#e2e8f0" strokeWidth="1.5" />
                  <rect x="178" y="196" width="32" height="42" rx="3" fill="#16a34a" stroke="#e2e8f0" strokeWidth="1.5" />
                </>
              )}

              {/* Bottom Shelf (Yesterday's Labeled Samples - filled) */}
              <rect x="82" y="266" width="32" height="42" rx="3" fill="#dc2626" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="130" y="266" width="32" height="42" rx="3" fill="#d97706" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="178" y="266" width="32" height="42" rx="3" fill="#16a34a" stroke="#e2e8f0" strokeWidth="1.5" />
            </g>

            {/* 2. SAUCE & ALLERGY DISPATCH PASS (CENTER LEFT) - s4-h2 */}
            <rect x="295" y="330" width="225" height="16" fill="#cbd5e1" stroke="#475569" strokeWidth="2.5" />
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[1])}>
              {/* Ticket #08 */}
              <rect x="335" y="205" width="135" height="36" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
              <text x="402" y="221" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                TBL #08: NO PEANUT
              </text>
              <text x="402" y="234" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontFamily="monospace">
                SESAME SAUCE ONLY
              </text>

              {/* Two Sauce Bowls & Shared Ladle */}
              <ellipse cx="365" cy="312" rx="34" ry="12" fill="#78350f" stroke="#cbd5e1" strokeWidth="2" />
              <ellipse cx="445" cy="312" rx="34" ry="12" fill="#d97706" stroke="#cbd5e1" strokeWidth="2" />
              {!isResolved('s4-h2') && (
                /* Shared ladle bridging both bowls + peanut crumbs on rim */
                <path d="M360 310 Q405 275 450 310" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              )}
            </g>

            {/* 3. BROTH WARMER #1 (51.5°C Hazard s4-h3) & WARMER #2 (68.0°C Safe s4-ok1) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[2])}>
              <rect x="550" y="220" width="135" height="125" rx="6" fill="#334155" stroke="#64748b" strokeWidth="3" />
              <ellipse cx="617" cy="220" rx="62" ry="12" fill="#dc2626" stroke="#475569" strokeWidth="2" />
              <rect x="572" y="262" width="90" height="34" rx="3" fill="#020617" stroke="#475569" strokeWidth="1.5" />
              <text x="617" y="284" textAnchor="middle" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                {!isResolved('s4-h3') ? '51.5°C' : '74.5°C'}
              </text>
              <text x="617" y="325" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                BROTH POT #1
              </text>
            </g>

            <g onClick={(e) => handleSpotClick(e, currentStage.spots[5])}>
              <rect x="710" y="220" width="135" height="125" rx="6" fill="#334155" stroke="#64748b" strokeWidth="3" />
              <ellipse cx="777" cy="220" rx="62" ry="12" fill="#f59e0b" stroke="#475569" strokeWidth="2" />
              <rect x="732" y="262" width="90" height="34" rx="3" fill="#020617" stroke="#475569" strokeWidth="1.5" />
              <text x="777" y="284" textAnchor="middle" fill="#38bdf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                68.0°C
              </text>
              <text x="777" y="325" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                BROTH POT #2
              </text>
            </g>

            {/* 4. MEAT SERVING PLATES: Safe Orange Plate w/ Angus Beef (s4-ok2) vs Orange Plate w/ Raw Chicken (s4-h4) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[6])}>
              <rect x="65" y="410" width="195" height="88" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <ellipse cx="162" cy="452" rx="65" ry="24" fill="#f97316" stroke="#ffedd5" strokeWidth="2" />
              {/* Marbled dark red beef rolls */}
              <ellipse cx="145" cy="450" rx="22" ry="9" fill="#991b1b" stroke="#fecaca" strokeWidth="1.5" />
              <ellipse cx="180" cy="452" rx="22" ry="9" fill="#991b1b" stroke="#fecaca" strokeWidth="1.5" />
            </g>

            <g onClick={(e) => handleSpotClick(e, currentStage.spots[3])}>
              <rect x="295" y="410" width="195" height="88" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <ellipse
                cx="392"
                cy="452"
                rx="65"
                ry="24"
                fill={!isResolved('s4-h4') ? '#f97316' : '#f8fafc'}
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              {/* Pale pink raw poultry drumsticks sitting on Orange plate */}
              <ellipse cx="378" cy="450" rx="24" ry="10" fill="#fda4af" stroke="#e11d48" strokeWidth="1.5" />
              <rect x="398" y="448" width="16" height="5" rx="2" fill="#fff1f2" />
            </g>

            {/* 5. DISPATCH STAFF A (Safe s4-ok3) & STAFF B (Mask Down + Bracelet Hazard s4-h5) */}
            <g onClick={(e) => handleSpotClick(e, currentStage.spots[7])}>
              <rect x="525" y="405" width="180" height="95" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              {/* Head with Hairnet & Proper Mask Over Nose */}
              <circle cx="575" cy="450" r="22" fill="#fdba74" />
              <path d="M553 442 Q575 420 597 442" fill="#1e293b" />
              <rect x="558" y="446" width="34" height="18" rx="4" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
              {/* Bare Wrist */}
              <rect x="615" y="448" width="45" height="14" rx="5" fill="#fdba74" />
            </g>

            <g onClick={(e) => handleSpotClick(e, currentStage.spots[4])}>
              <rect x="725" y="405" width="185" height="95" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <circle cx="775" cy="450" r="22" fill="#fdba74" />
              <path d="M753 442 Q775 420 797 442" fill="#1e293b" />
              {!isResolved('s4-h5') ? (
                <>
                  {/* Mask pulled down onto chin exposing nose & mouth + gold bracelet on wrist */}
                  <circle cx="775" cy="452" r="2.5" fill="#9a3412" />
                  <path d="M768 460 Q775 464 782 460" fill="none" stroke="#7c2d12" strokeWidth="2" />
                  <rect x="760" y="464" width="30" height="10" rx="3" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
                  <rect x="815" y="448" width="45" height="14" rx="5" fill="#fdba74" />
                  <rect x="832" y="445" width="6" height="20" fill="#eab308" />
                </>
              ) : (
                <>
                  <rect x="758" y="446" width="34" height="18" rx="4" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x="815" y="448" width="45" height="14" rx="5" fill="#fdba74" />
                </>
              )}
            </g>
          </g>
        )}

        {/* =====================================================================
            STAGE 5: MASTER UPLOADED SOP & CHECKLIST AUDIT ROOM
           ===================================================================== */}
        {currentStage.stageNumber === 5 && (
          <g>
            {/* Header Signboard in Kitchen */}
            <rect x="240" y="62" width="480" height="36" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text x="480" y="84" textAnchor="middle" fill="#fbbf24" fontSize="12" fontFamily="monospace" fontWeight="bold">
              MASTER UPLOADED SOP &amp; STATION AUDIT ZONE
            </text>

            {/* Long Stainless Steel Counter */}
            <rect x="45" y="310" width="870" height="16" fill="#94a3b8" stroke="#475569" strokeWidth="2" />

            {/* Render each dynamic spot (custom hazards on upper counter, compliant distractors on lower floor/racks) */}
            {currentStage.spots.map((spot, idx) => {
              const resolved = isResolved(spot.id);
              if (spot.isHazard) {
                return (
                  <g key={spot.id} onClick={(e) => handleSpotClick(e, spot)}>
                    <rect
                      x={spot.x}
                      y={spot.y}
                      width={spot.width}
                      height={spot.height}
                      rx="6"
                      fill="#1e293b"
                      stroke="#64748b"
                      strokeWidth="2.5"
                    />
                    <rect
                      x={spot.x + 10}
                      y={spot.y + 12}
                      width={spot.width - 20}
                      height="24"
                      rx="3"
                      fill="#020617"
                      stroke="#334155"
                      strokeWidth="1.5"
                    />
                    <text
                      x={spot.x + spot.width / 2}
                      y={spot.y + 28}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {spot.docCode}
                    </text>

                    {/* Equipment visual state */}
                    {!resolved ? (
                      <>
                        <rect
                          x={spot.x + 18}
                          y={spot.y + 48}
                          width={spot.width - 36}
                          height="62"
                          rx="4"
                          fill="#334155"
                          stroke="#475569"
                          strokeWidth="1.5"
                        />
                        {/* Subtle anomaly indicator (uncalibrated dial / open lid / unverified clipboard) */}
                        <circle
                          cx={spot.x + spot.width / 2}
                          cy={spot.y + 78}
                          r="16"
                          fill="#0f172a"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                        <line
                          x1={spot.x + spot.width / 2}
                          y1={spot.y + 78}
                          x2={spot.x + spot.width / 2 + 11}
                          y2={spot.y + 68}
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                        />
                        <text
                          x={spot.x + spot.width / 2}
                          y={spot.y + 132}
                          textAnchor="middle"
                          fill="#cbd5e1"
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          STATION #{idx + 1}
                        </text>
                      </>
                    ) : (
                      <>
                        <rect
                          x={spot.x + 18}
                          y={spot.y + 48}
                          width={spot.width - 36}
                          height="62"
                          rx="4"
                          fill="#064e3b"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                        <text
                          x={spot.x + spot.width / 2}
                          y={spot.y + 84}
                          textAnchor="middle"
                          fill="#34d399"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          SOP VERIFIED
                        </text>
                        <text
                          x={spot.x + spot.width / 2}
                          y={spot.y + 132}
                          textAnchor="middle"
                          fill="#10b981"
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          FIXED ✓
                        </text>
                      </>
                    )}
                  </g>
                );
              }

              // Compliant Distractor Station
              return (
                <g key={spot.id} onClick={(e) => handleSpotClick(e, spot)}>
                  <rect
                    x={spot.x}
                    y={spot.y}
                    width={spot.width}
                    height={spot.height}
                    rx="6"
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  <rect
                    x={spot.x + 12}
                    y={spot.y + 12}
                    width={spot.width - 24}
                    height="22"
                    rx="3"
                    fill="#020617"
                  />
                  <text
                    x={spot.x + spot.width / 2}
                    y={spot.y + 27}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {spot.hazardTitle.slice(0, 24)}
                  </text>
                  <rect
                    x={spot.x + 20}
                    y={spot.y + 44}
                    width={spot.width - 40}
                    height="36"
                    rx="3"
                    fill="#334155"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* =====================================================================
            ONLY SHOW GREEN OUTLINE AFTER A VIOLATION HAS BEEN FOUND & FIXED
           ===================================================================== */}
        {currentStage.spots.map((spot) => {
          const resolved = isResolved(spot.id);
          if (!resolved) return null;
          return (
            <g key={`resolved-${spot.id}`} className="pointer-events-none">
              <rect
                x={spot.x - 2}
                y={spot.y - 2}
                width={spot.width + 4}
                height={spot.height + 4}
                rx="6"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {/* Floating Click Feedback Popups */}
        {clickMarkers.map((m) => (
          <g key={m.id} className="pointer-events-none">
            <circle
              cx={m.x}
              cy={m.y}
              r="16"
              fill="none"
              stroke={m.kind === 'hazard' ? '#10b981' : '#ef4444'}
              strokeWidth="3"
            />
            <rect
              x={Math.min(Math.max(10, m.x - 95), 760)}
              y={Math.max(15, m.y - 40)}
              width="190"
              height="22"
              rx="4"
              fill={m.kind === 'hazard' ? '#064e3b' : '#7f1d1d'}
              stroke={m.kind === 'hazard' ? '#10b981' : '#ef4444'}
              strokeWidth="1.5"
            />
            <text
              x={Math.min(Math.max(105, m.x), 855)}
              y={Math.max(30, m.y - 25)}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {m.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Top Game Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-600 border border-amber-400 flex items-center justify-center shadow">
              <Flame className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span className="font-mono font-bold text-red-400">
                  STRICT QA AUDIT MODE (NO CLUES)
                </span>
                <span>·</span>
                <span className="font-mono text-amber-300 font-semibold">
                  {totalHazardsInGame} HIDDEN VIOLATIONS ACROSS {allGameStages.length} ROOMS
                </span>
                {customUploadedDocs.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    ROOM 05: MASTER UPLOADED SOPs ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight font-mono">
                SPOT THE HAZARD: HARD KITCHEN AUDIT
              </h2>
            </div>
          </div>

          {/* Mode & Audio Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setRequireQuizFix(true)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                  requireQuizFix
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Strict Audit (Spot + 4-Choice Fix)
              </button>
              <button
                onClick={() => setRequireQuizFix(false)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                  !requireQuizFix
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rapid Spot Mode
              </button>
            </div>

            <button
              onClick={handleToggleBgm}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                !bgmMuted
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>{bgmMuted ? 'BGM: OFF' : 'BGM: ON'}</span>
            </button>

            <button
              onClick={handleToggleSfx}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                !sfxMuted
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {sfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{sfxMuted ? 'SFX: OFF' : 'SFX: ON'}</span>
            </button>
          </div>
        </div>

        {/* Arcade Top HUD Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-800 font-mono">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-400 block">SCORE</span>
            <span className="text-sm sm:text-base font-black text-amber-400 tabular-nums">
              {String(score).padStart(6, '0')}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-400 block">HIGH SCORE</span>
            <span className="text-sm sm:text-base font-black text-cyan-400 tabular-nums">
              {String(highScore).padStart(6, '0')}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-400 block">QA HEARTS (3 MAX)</span>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3].map((h) => (
                <Heart
                  key={h}
                  className={`w-4 h-4 ${
                    h <= lives ? 'text-red-500 fill-red-500' : 'text-slate-700'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-300 ml-1 tabular-nums">
                {lives}/3
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-400 block">TOTAL HAZARDS FOUND</span>
            <span className="text-sm sm:text-base font-black text-emerald-400 tabular-nums">
              {totalResolvedHazards} / {totalHazardsInGame}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block">AUDIT TIMER</span>
            <span
              className={`text-sm sm:text-base font-black tabular-nums ${
                timeLeft <= 15 ? 'text-red-400' : 'text-white'
              }`}
            >
              {timeLeft}s · x{combo}
            </span>
          </div>
        </div>
      </div>

      {/* Main Kitchen Viewport */}
      <div className="relative rounded-2xl border-2 border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
        {/* STATE 1: TITLE MENU */}
        {gameState === 'TITLE_MENU' && (
          <div className="p-6 sm:p-10 text-center space-y-6 font-mono relative z-10 bg-gradient-to-b from-slate-950 via-red-950/25 to-slate-950">
            <div className="inline-flex items-center gap-2 text-red-400 text-xs font-bold">
              <Search className="w-4 h-4 text-red-400" />
              <span>ZERO-CLUE HARD AUDIT · NO HOVER BOXES · NO WARNING LABELS</span>
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h1 className="text-2xl sm:text-4xl font-black text-amber-400 tracking-wider">
                HARD MODE: SPOT THE HAZARD
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                All text spoilers, red alarm boxes, and hover outlines have been removed. Each kitchen room has{' '}
                <strong className="text-white">subtle SOP violations</strong> hidden among compliant equipment. Clicking a compliant item or empty space costs{' '}
                <strong className="text-red-400">-1 Heart &amp; -5 Seconds</strong>!
              </p>
            </div>

            {/* Stage Preview Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left font-sans">
              {allGameStages.map((st, idx) => {
                const hazCount = st.spots.filter((s) => s.isHazard).length;
                return (
                  <button
                    key={st.stageNumber}
                    onClick={() => startNewGame(idx)}
                    className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-2 text-left cursor-pointer ${
                      st.stageNumber === 5
                        ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/50 sm:col-span-2'
                        : 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 hover:border-red-500/50'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-[10px] font-bold text-amber-400 block">
                        ROOM 0{st.stageNumber} {st.stageNumber === 5 ? '· MASTER UPLOADED ROOM' : ''}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">
                        {st.title.replace(/^STAGE \d:\s*/, '')}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{st.zoneSubtitle}</p>
                    </div>
                    <span className="font-mono text-[11px] text-red-400 font-bold shrink-0">
                      {hazCount} Hazards
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => startNewGame(0)}
                className="px-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-black text-sm border border-red-400 shadow-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START HARD KITCHEN AUDIT ({totalHazardsInGame} HAZARDS)</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: PLAYING OR HAZARD_QUIZ */}
        {(gameState === 'PLAYING' || gameState === 'HAZARD_QUIZ') && (
          <div className="relative z-10">
            {/* Stage Toolbar */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-mono text-xs sm:text-sm font-black text-amber-300">
                  {currentStage.title}
                </h3>
                <p className="text-[11px] text-slate-400">{currentStage.zoneSubtitle}</p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <div className="hidden md:flex items-center gap-1 mr-2">
                  {allGameStages.map((st, idx) => (
                    <button
                      key={st.stageNumber}
                      onClick={() => {
                        setCurrentStageIdx(idx);
                        setLastSpottedHazard(null);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        safeStageIdx === idx
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Room {st.stageNumber}
                    </button>
                  ))}
                </div>

                <span className="text-slate-300 whitespace-nowrap">
                  Room Violations Left:{' '}
                  <strong className="text-red-400 tabular-nums">
                    {remainingStageHazards.length} / {stageHazards.length}
                  </strong>
                </span>

                <button
                  onClick={() => startNewGame(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Live Status Banner */}
            {toastBanner && (
              <div
                className={`px-4 py-2 text-xs font-mono font-bold flex items-center justify-between gap-2 border-b ${
                  toastBanner.type === 'ok'
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
                    : toastBanner.type === 'warn'
                    ? 'bg-amber-950/90 text-amber-200 border-amber-700'
                    : 'bg-red-950/90 text-red-200 border-red-800'
                }`}
              >
                <span className="truncate">▶ {toastBanner.text}</span>
                <span className="text-[10px] opacity-80 whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  <span>NO HINTS · WRONG CLICK = -1♥ &amp; -5s</span>
                </span>
              </div>
            )}

            {/* FULL INTERACTIVE KITCHEN SCENE */}
            <div className="relative bg-slate-950">
              {renderKitchenSceneSVG()}
            </div>

            {/* Instant Violation Explanation Bar (after resolving a hazard) */}
            {lastSpottedHazard && gameState === 'PLAYING' && (
              <div className="bg-slate-900 border-t border-emerald-500/50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-400">
                      VIOLATION VERIFIED:
                    </span>
                    <span className="font-bold text-white">{lastSpottedHazard.hazardTitle}</span>
                    <span className="text-amber-300 font-bold">({lastSpottedHazard.docCode})</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lastSpottedHazard.sopViolation}
                  </p>
                </div>

                {onOpenDoc && (
                  <button
                    onClick={() => handleOpenPolicyById(lastSpottedHazard.docId)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open {lastSpottedHazard.docCode}</span>
                  </button>
                )}
              </div>
            )}

            {/* MODAL OVERLAY FOR 4-OPTION SOP QUIZ */}
            {gameState === 'HAZARD_QUIZ' && activeHazardSpot && (
              <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
                <div className="bg-slate-900 border-2 border-red-500 rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 shadow-2xl">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="font-mono text-[10px] font-black text-red-400 uppercase block">
                        ⚠ VIOLATION SPOTTED · {activeHazardSpot.docCode}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                        {activeHazardSpot.hazardTitle}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {activeHazardSpot.sopViolation}
                  </p>

                  <div className="space-y-2">
                    <span className="font-mono text-[11px] font-bold text-amber-300 block">
                      REQUIRED CORRECTIVE ACTION (WRONG ANSWER = -1 HEART):
                    </span>
                    {activeHazardSpot.fixOptions.map((opt, idx) => {
                      const isSelected = selectedFixOption === idx;
                      const isRight = idx === activeHazardSpot.correctFixIndex;
                      let btnStyle =
                        'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700';

                      if (fixFeedback) {
                        if (isRight && fixFeedback.correct) {
                          btnStyle =
                            'bg-emerald-950 text-emerald-200 border-emerald-500 font-bold';
                        } else if (isSelected && !isRight) {
                          btnStyle = 'bg-red-950 text-red-200 border-red-500';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={!!fixFeedback}
                          onClick={() => handleAnswerHazardFix(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2 ${btnStyle}`}
                        >
                          <span className="font-mono font-bold text-amber-400 shrink-0">
                            [{String.fromCharCode(65 + idx)}]
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {fixFeedback && (
                    <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono font-bold ${
                          fixFeedback.correct ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {fixFeedback.message}
                      </span>
                      <button
                        onClick={handleContinueAfterHazard}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-black text-xs border border-amber-200 whitespace-nowrap shrink-0"
                      >
                        {fixFeedback.correct ? 'APPLY FIX & CONTINUE ▶' : 'TRY AGAIN ▶'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATE 3: STAGE CLEAR */}
        {gameState === 'STAGE_CLEAR' && (
          <div className="p-6 sm:p-10 text-center space-y-5 font-mono relative z-10 bg-slate-950">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-emerald-400 font-bold">
                KITCHEN ROOM 0{currentStage.stageNumber} CLEARED!
              </span>
              <h3 className="text-2xl font-black text-white">ALL ROOM VIOLATIONS RESOLVED!</h3>
              <p className="text-xs text-slate-400 font-sans">
                You found every hidden hazard in {currentStage.title}. Time Bonus: +{timeLeft * 15} PTS!
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleNextStage}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs border border-emerald-200 flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>PROCEED TO ROOM {currentStage.stageNumber + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: GAME OVER */}
        {gameState === 'GAME_OVER' && (
          <div className="p-6 sm:p-10 text-center space-y-5 font-mono relative z-10 bg-gradient-to-b from-red-950/60 to-slate-950">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-red-400 font-bold">QA AUDIT FAILED</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">AUDIT TERMINATED</h3>
              <p className="text-xs text-slate-300 font-sans max-w-md mx-auto">
                You resolved {totalResolvedHazards} of {totalHazardsInGame} kitchen violations with a score of{' '}
                <strong className="text-amber-400">{score} PTS</strong>.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => startNewGame(0)}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs border border-amber-200 flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RETRY HARD AUDIT</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 5: VICTORY */}
        {gameState === 'VICTORY' && (
          <div className="p-6 sm:p-10 text-center space-y-5 font-mono relative z-10 bg-gradient-to-b from-amber-950/40 via-slate-950 to-emerald-950/40">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
              <Award className="w-9 h-9 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-amber-400 font-bold">
                100% ZERO-CLUE AUDIT CLEARANCE · ALL {totalHazardsInGame} VIOLATIONS RESOLVED!
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                MASTER QA AUDITOR VICTORY!
              </h3>
              <p className="text-xs text-slate-300 font-sans max-w-lg mx-auto">
                Congratulations <strong className="text-white">{staffName}</strong>! You spotted and fixed all{' '}
                {totalHazardsInGame} hidden food safety violations without clues, scoring{' '}
                <strong className="text-amber-300">{score} PTS</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs border border-amber-200 flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Award className="w-4 h-4" />
                <span>CLAIM OFFICIAL L&amp;D CERTIFICATE</span>
              </button>

              <button
                onClick={() => startNewGame(0)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Redacted Audit Log: Only reveals hazards AFTER the player spots them in the kitchen */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Discovered Violations Log ({totalResolvedHazards} / {totalHazardsInGame} Uncovered)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Undiscovered hazards remain classified until you spot them in the kitchen
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allGameStages.flatMap((st) =>
            st.spots
              .filter((sp) => sp.isHazard)
              .map((haz, i) => ({ ...haz, roomNum: st.stageNumber, indexInRoom: i + 1 }))
          ).map((haz) => {
            const isCleared = resolvedSpotIds.includes(haz.id);
            return (
              <div
                key={haz.id}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
              >
                {isCleared ? (
                  <>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-mono font-bold text-amber-300">{haz.docCode}</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-bold">✓ Spotted in Room {haz.roomNum}</span>
                      </div>
                      <p className="text-slate-200 font-semibold truncate mt-0.5">
                        {haz.hazardTitle}
                      </p>
                    </div>
                    {onOpenDoc && (
                      <button
                        onClick={() => handleOpenPolicyById(haz.docId)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold whitespace-nowrap shrink-0"
                      >
                        View SOP
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 py-1">
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="font-mono text-[11px]">
                      Room 0{haz.roomNum} · Violation #{haz.indexInRoom} — [UNDISCOVERED IN KITCHEN]
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificate Modal for Completing Spot the Hazard */}
      <TrainingCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        staffName={staffName}
        staffPosition={staffPosition}
        staffBranch={staffBranch}
        quizTitle="Hard Mode Spot the Hazard: Kitchen QA Audit"
        score={totalResolvedHazards}
        totalQuestions={totalHazardsInGame}
      />
    </div>
  );
};
