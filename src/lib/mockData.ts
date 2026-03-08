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
  description: string;
}

export interface ScheduleItem {
  time: string;
  label: string;
  medicines: string[];
}

export const sampleMedicines: Medicine[] = [
  { id: '1', name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', dosage: '5mg once daily', type: 'tablet', price: 45, genericPrice: 8, genericBrand: 'Jan Aushadhi Amlodipine' },
  { id: '2', name: 'Metformin 500mg', genericName: 'Metformin HCl', dosage: '500mg twice daily', type: 'tablet', price: 65, genericPrice: 12, genericBrand: 'Jan Aushadhi Metformin' },
  { id: '3', name: 'Diclofenac 50mg', genericName: 'Diclofenac Sodium', dosage: '50mg as needed', type: 'tablet', price: 30, genericPrice: 5, genericBrand: 'Jan Aushadhi Diclofenac' },
  { id: '4', name: 'Thyronorm 50mcg', genericName: 'Levothyroxine', dosage: '50mcg morning empty stomach', type: 'tablet', price: 120, genericPrice: 25, genericBrand: 'Jan Aushadhi Thyroxine' },
  { id: '5', name: 'Ecosprin 75mg', genericName: 'Aspirin', dosage: '75mg once daily', type: 'tablet', price: 35, genericPrice: 6, genericBrand: 'Jan Aushadhi Aspirin' },
];

export const sampleInteractions: Interaction[] = [
  {
    id: '1',
    medicine1: 'Diclofenac 50mg',
    medicine2: 'Amlodipine 5mg',
    severity: 'critical',
    description: 'Diclofenac (NSAID) can reduce the blood-pressure-lowering effect of Amlodipine and may cause fluid retention, leading to swelling of face and legs.',
    recommendation: 'Avoid this combination. Ask your doctor for an alternative pain reliever like Paracetamol.',
  },
  {
    id: '2',
    medicine1: 'Diclofenac 50mg',
    medicine2: 'Ecosprin 75mg',
    severity: 'critical',
    description: 'Both are NSAIDs/blood-thinners. Taking together significantly increases risk of stomach bleeding and ulcers.',
    recommendation: 'Never take these together without doctor supervision. High risk of GI bleeding.',
  },
  {
    id: '3',
    medicine1: 'Metformin 500mg',
    medicine2: 'Diclofenac 50mg',
    severity: 'moderate',
    description: 'Diclofenac may affect kidney function, which can impair Metformin clearance and increase risk of lactic acidosis.',
    recommendation: 'Use with caution. Monitor kidney function if taken together.',
  },
  {
    id: '4',
    medicine1: 'Amlodipine 5mg',
    medicine2: 'Metformin 500mg',
    severity: 'minor',
    description: 'Generally safe together. Amlodipine does not significantly affect blood sugar levels.',
    recommendation: 'Safe to take together. No dose adjustment needed.',
  },
];

export const sampleFoodInteractions: FoodInteraction[] = [
  { medicine: 'Thyronorm 50mcg', food: 'Milk & Dairy', icon: '🥛', description: 'Take on empty stomach, 30 min before food. Calcium in milk reduces absorption.' },
  { medicine: 'Metformin 500mg', food: 'Alcohol', icon: '🍺', description: 'Avoid alcohol. Increases risk of dangerous lactic acidosis.' },
  { medicine: 'Amlodipine 5mg', food: 'Grapefruit', icon: '🍊', description: 'Avoid grapefruit juice. It can increase drug levels and cause dizziness.' },
  { medicine: 'Ecosprin 75mg', food: 'Spicy Food', icon: '🌶️', description: 'Take after meals. Spicy food with aspirin increases stomach irritation.' },
];

export const sampleSchedule: ScheduleItem[] = [
  { time: '6:00 AM', label: 'Empty Stomach', medicines: ['Thyronorm 50mcg'] },
  { time: '8:00 AM', label: 'After Breakfast', medicines: ['Metformin 500mg', 'Amlodipine 5mg', 'Ecosprin 75mg'] },
  { time: '8:00 PM', label: 'After Dinner', medicines: ['Metformin 500mg'] },
];
