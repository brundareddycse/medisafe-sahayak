export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  type: 'tablet' | 'capsule' | 'syrup' | 'injection';
  price: number;
  genericPrice?: number;
  genericBrand?: string;
}

export interface Interaction {
  id: string;
  medicine1: string;
  medicine2: string;
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
  recommendation: string;
}

export interface FoodInteraction {
  medicine: string;
  food: string;
  icon: string;
  severity: 'avoid' | 'caution' | 'timing';
  description: string;
}

export interface ScheduleItem {
  time: string;
  label: string;
  medicines: string[];
}

export const sampleMedicines: Medicine[] = [
  { id: '1', name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', dosage: '5mg once daily', type: 'tablet', price: 45, genericPrice: 8, genericBrand: 'Jan Aushadhi Amlodipine 5mg' },
  { id: '2', name: 'Metformin 500mg', genericName: 'Metformin Hydrochloride', dosage: '500mg twice daily', type: 'tablet', price: 65, genericPrice: 12, genericBrand: 'Jan Aushadhi Metformin 500mg' },
  { id: '3', name: 'Diclofenac 50mg', genericName: 'Diclofenac Sodium', dosage: '50mg when needed', type: 'tablet', price: 30, genericPrice: 5, genericBrand: 'Jan Aushadhi Diclofenac 50mg' },
  { id: '4', name: 'Thyronorm 50mcg', genericName: 'Levothyroxine Sodium', dosage: '50mcg empty stomach, morning', type: 'tablet', price: 120, genericPrice: 25, genericBrand: 'Jan Aushadhi Thyroxine 50mcg' },
  { id: '5', name: 'Ecosprin 75mg', genericName: 'Aspirin (Acetylsalicylic Acid)', dosage: '75mg once daily after food', type: 'tablet', price: 35, genericPrice: 6, genericBrand: 'Jan Aushadhi Aspirin 75mg' },
];

export const sampleInteractions: Interaction[] = [
  {
    id: '1',
    medicine1: 'Diclofenac 50mg',
    medicine2: 'Ecosprin 75mg',
    severity: 'critical',
    description: 'Both Diclofenac (NSAID) and Ecosprin (Aspirin) affect blood clotting and irritate the stomach lining. Taking them together significantly increases the risk of stomach ulcers, GI bleeding, and may reduce the cardioprotective effect of Aspirin.',
    recommendation: 'Do NOT take together. Ask your doctor for Paracetamol as a safer pain reliever. If both are prescribed, a stomach-protecting medicine (PPI like Pantoprazole) is essential.',
  },
  {
    id: '2',
    medicine1: 'Diclofenac 50mg',
    medicine2: 'Amlodipine 5mg',
    severity: 'critical',
    description: 'Diclofenac (NSAID) can reduce the blood-pressure-lowering effect of Amlodipine by causing sodium and water retention. This may lead to swelling of face, hands, and legs, and can worsen blood pressure control.',
    recommendation: 'Avoid this combination. Use Paracetamol for pain relief instead. If Diclofenac is essential, monitor blood pressure closely and limit use to 3-5 days.',
  },
  {
    id: '3',
    medicine1: 'Diclofenac 50mg',
    medicine2: 'Metformin 500mg',
    severity: 'moderate',
    description: 'Diclofenac may impair kidney function over time. Since Metformin is cleared by the kidneys, reduced kidney function can cause Metformin to accumulate, increasing the risk of a rare but serious condition called lactic acidosis.',
    recommendation: 'Use with caution and for short duration only. Stay well hydrated. Get kidney function (creatinine) tested if using Diclofenac regularly.',
  },
  {
    id: '4',
    medicine1: 'Thyronorm 50mcg',
    medicine2: 'Ecosprin 75mg',
    severity: 'moderate',
    description: 'Aspirin in high doses can displace thyroid hormones from blood proteins, temporarily increasing free thyroid hormone levels. At the 75mg dose used here, the effect is usually minimal but should be monitored.',
    recommendation: 'Generally safe at low-dose Aspirin (75mg). Take Thyronorm on empty stomach 30-60 minutes before Ecosprin. Monitor thyroid levels (TSH) regularly.',
  },
  {
    id: '5',
    medicine1: 'Amlodipine 5mg',
    medicine2: 'Metformin 500mg',
    severity: 'minor',
    description: 'No significant interaction. Amlodipine does not affect blood sugar control or Metformin metabolism. These are commonly and safely prescribed together for patients with both hypertension and diabetes.',
    recommendation: 'Safe to take together. No dose adjustment needed. Continue as prescribed.',
  },
  {
    id: '6',
    medicine1: 'Amlodipine 5mg',
    medicine2: 'Ecosprin 75mg',
    severity: 'minor',
    description: 'Low-dose Aspirin (75mg) does not significantly interact with Amlodipine. This is a very common combination for cardiac patients managing both blood pressure and heart protection.',
    recommendation: 'Safe combination. Take Ecosprin after food to reduce stomach irritation.',
  },
];

export const sampleFoodInteractions: FoodInteraction[] = [
  { medicine: 'Thyronorm 50mcg', food: 'Milk & Dairy Products', icon: '🥛', severity: 'avoid', description: 'Calcium in milk, curd, and paneer reduces Levothyroxine absorption by up to 40%. Take Thyronorm on empty stomach 30-60 minutes before any dairy.' },
  { medicine: 'Thyronorm 50mcg', food: 'Soy Products & Iron', icon: '🫘', severity: 'avoid', description: 'Soy-based foods and iron supplements reduce thyroid hormone absorption. Maintain at least 4 hours gap between Thyronorm and these items.' },
  { medicine: 'Metformin 500mg', food: 'Alcohol', icon: '🍺', severity: 'avoid', description: 'Alcohol increases the risk of dangerous lactic acidosis with Metformin and can cause sudden drops in blood sugar (hypoglycemia). Avoid alcohol completely.' },
  { medicine: 'Amlodipine 5mg', food: 'Grapefruit / Citrus', icon: '🍊', severity: 'caution', description: 'Grapefruit juice inhibits CYP3A4 enzyme, increasing Amlodipine blood levels. This can cause dizziness, headache, and excessive blood pressure drop.' },
  { medicine: 'Ecosprin 75mg', food: 'Spicy / Acidic Food', icon: '🌶️', severity: 'caution', description: 'Aspirin irritates the stomach lining. Spicy foods, pickles, and acidic items compound this effect. Always take Ecosprin after a meal, never on empty stomach.' },
  { medicine: 'Metformin 500mg', food: 'High-Sugar Foods', icon: '🍰', severity: 'caution', description: 'While Metformin controls blood sugar, consuming excess sweets, sugary drinks, or white rice counteracts its effect. Maintain a balanced diet for best results.' },
];

export const sampleSchedule: ScheduleItem[] = [
  { time: '6:00 AM', label: 'Empty Stomach', medicines: ['Thyronorm 50mcg'] },
  { time: '8:00 AM', label: 'After Breakfast', medicines: ['Metformin 500mg', 'Amlodipine 5mg', 'Ecosprin 75mg'] },
  { time: '8:00 PM', label: 'After Dinner', medicines: ['Metformin 500mg'] },
];

// Note: Diclofenac is PRN (as-needed) and not in the regular schedule.
// It should be taken only when needed, after food, and NOT with Ecosprin on the same day.
