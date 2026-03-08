import Tesseract from 'tesseract.js';

export interface OCRResult {
  rawText: string;
  confidence: number;
  medicineNames: string[];
}

// Common Indian medicine name patterns to look for in OCR text
const MEDICINE_KEYWORDS = [
  // Generic names
  'amlodipine', 'metformin', 'diclofenac', 'levothyroxine', 'aspirin',
  'paracetamol', 'omeprazole', 'pantoprazole', 'atorvastatin', 'losartan',
  'telmisartan', 'ramipril', 'enalapril', 'glimepiride', 'sitagliptin',
  'clopidogrel', 'rosuvastatin', 'cetirizine', 'montelukast', 'azithromycin',
  'amoxicillin', 'ciprofloxacin', 'metoprolol', 'atenolol', 'furosemide',
  'hydrochlorothiazide', 'spironolactone', 'prednisolone', 'dexamethasone',
  'ranitidine', 'domperidone', 'ondansetron', 'ibuprofen', 'naproxen',
  'gabapentin', 'pregabalin', 'duloxetine', 'escitalopram', 'sertraline',
  // Indian brand names
  'thyronorm', 'ecosprin', 'crocin', 'dolo', 'combiflam', 'saridon',
  'voveran', 'volini', 'glycomet', 'galvus', 'januvia', 'amaryl',
  'telma', 'stamlo', 'amlong', 'cardace', 'envas', 'clopitab',
  'rozavel', 'atorva', 'tonact', 'pan', 'pantocid', 'razo',
  'shelcal', 'calcimax', 'becosules', 'neurobion', 'supradyn',
  'zifi', 'azee', 'augmentin', 'monocef', 'taxim',
];

// Dosage patterns
const DOSAGE_PATTERN = /\b(\d+\.?\d*)\s*(mg|mcg|ml|g|iu|units?)\b/gi;

/**
 * Clean and normalize OCR text
 */
function cleanOCRText(text: string): string {
  return text
    .replace(/[|\\{}[\]]/g, '') // Remove OCR artifacts
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .replace(/[^\w\s.,-]/g, ' ') // Keep only useful chars
    .trim();
}

/**
 * Extract medicine names from OCR text using fuzzy matching
 */
function extractMedicineNames(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const found: string[] = [];

  for (const keyword of MEDICINE_KEYWORDS) {
    // Check for exact or near match (allowing 1-2 char OCR errors)
    if (normalizedText.includes(keyword)) {
      // Try to capture with dosage
      const regex = new RegExp(
        `(${keyword}[\\w]*)[\\s-]*(\\d+\\.?\\d*\\s*(?:mg|mcg|ml|g))?`,
        'gi'
      );
      const match = regex.exec(text);
      if (match) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const dosage = match[2] ? ` ${match[2].trim()}` : '';
        found.push(`${name}${dosage}`);
      } else {
        found.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
  }

  // Also extract any word followed by a dosage pattern that we might have missed
  const dosageMatches = text.matchAll(/\b([A-Za-z]{3,})\s+(\d+\.?\d*\s*(?:mg|mcg|ml|g))\b/gi);
  for (const match of dosageMatches) {
    const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    const dosage = match[2].trim();
    const entry = `${name} ${dosage}`;
    if (!found.some(f => f.toLowerCase().includes(name.toLowerCase()))) {
      found.push(entry);
    }
  }

  // Deduplicate
  const unique = [...new Set(found.map(f => f.trim()))];
  return unique;
}

/**
 * Run OCR on an image file and extract medicine names
 */
export async function runOCR(
  imageFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> {
  onProgress?.(0, 'Initializing OCR engine...');

  const result = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(Math.round(m.progress * 60), 'Reading medicine text...');
      }
    },
  });

  onProgress?.(60, 'Identifying medicines...');

  const rawText = result.data.text;
  const confidence = result.data.confidence;
  const cleanedText = cleanOCRText(rawText);

  onProgress?.(80, 'Extracting medicine names...');

  const medicineNames = extractMedicineNames(cleanedText);

  onProgress?.(100, 'Done!');

  return {
    rawText: cleanedText,
    confidence,
    medicineNames,
  };
}

/**
 * Parse manual text input for medicine names
 */
export function parseManualInput(text: string): string[] {
  // Split by newlines, commas, or semicolons
  const lines = text.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
  
  // Also try to extract from continuous text
  if (lines.length <= 1 && text.length > 20) {
    const extracted = extractMedicineNames(text);
    if (extracted.length > 0) return extracted;
  }

  return lines;
}
