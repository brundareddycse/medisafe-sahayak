import Tesseract from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';

export interface OCRResult {
  rawText: string;
  confidence: number;
  medicineNames: string[];
}

/**
 * Convert a File to base64 string (without the data URI prefix)
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the "data:image/...;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Primary OCR: Use Gemini Vision API for accurate medicine detection
 */
async function runVisionOCR(imageFile: File): Promise<{ medicines: string[]; rawText: string } | null> {
  try {
    const imageBase64 = await fileToBase64(imageFile);
    const { data, error } = await supabase.functions.invoke('ocr-vision', {
      body: { imageBase64, mimeType: imageFile.type || 'image/jpeg' },
    });

    if (error) {
      console.error('Vision OCR error:', error);
      return null;
    }

    if (data?.error) {
      console.error('Vision OCR returned error:', data.error);
      return null;
    }

    return {
      medicines: data.medicines || [],
      rawText: data.rawText || '',
    };
  } catch (err) {
    console.error('Vision OCR failed:', err);
    return null;
  }
}

// Common Indian medicine name patterns for Tesseract fallback
const MEDICINE_KEYWORDS = [
  'amlodipine', 'metformin', 'diclofenac', 'levothyroxine', 'aspirin',
  'paracetamol', 'omeprazole', 'pantoprazole', 'atorvastatin', 'losartan',
  'telmisartan', 'ramipril', 'enalapril', 'glimepiride', 'sitagliptin',
  'clopidogrel', 'rosuvastatin', 'cetirizine', 'montelukast', 'azithromycin',
  'amoxicillin', 'ciprofloxacin', 'metoprolol', 'atenolol', 'furosemide',
  'hydrochlorothiazide', 'spironolactone', 'prednisolone', 'dexamethasone',
  'ranitidine', 'domperidone', 'ondansetron', 'ibuprofen', 'naproxen',
  'gabapentin', 'pregabalin', 'duloxetine', 'escitalopram', 'sertraline',
  'thyronorm', 'ecosprin', 'crocin', 'dolo', 'combiflam', 'saridon',
  'voveran', 'volini', 'glycomet', 'galvus', 'januvia', 'amaryl',
  'telma', 'stamlo', 'amlong', 'cardace', 'envas', 'clopitab',
  'rozavel', 'atorva', 'tonact', 'pan', 'pantocid', 'razo',
  'shelcal', 'calcimax', 'becosules', 'neurobion', 'supradyn',
  'zifi', 'azee', 'augmentin', 'monocef', 'taxim',
];

function cleanOCRText(text: string): string {
  return text
    .replace(/[|\\{}[\]]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,-]/g, ' ')
    .trim();
}

function extractMedicineNames(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const found: string[] = [];

  for (const keyword of MEDICINE_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
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

  const dosageMatches = text.matchAll(/\b([A-Za-z]{3,})\s+(\d+\.?\d*\s*(?:mg|mcg|ml|g))\b/gi);
  for (const match of dosageMatches) {
    const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    const dosage = match[2].trim();
    const entry = `${name} ${dosage}`;
    if (!found.some(f => f.toLowerCase().includes(name.toLowerCase()))) {
      found.push(entry);
    }
  }

  return [...new Set(found.map(f => f.trim()))];
}

/**
 * Run OCR on an image file — Gemini Vision first, Tesseract.js fallback
 */
export async function runOCR(
  imageFile: File,
  onProgress?: (progress: number, status?: string) => void
): Promise<OCRResult> {
  onProgress?.(10, 'Sending image to AI Vision...');

  // 1. Try Gemini Vision API first (much better accuracy)
  const visionResult = await runVisionOCR(imageFile);

  if (visionResult && visionResult.medicines.length > 0) {
    onProgress?.(90, 'Medicines detected via AI Vision!');
    onProgress?.(100, 'Done!');
    return {
      rawText: `[AI Vision] ${visionResult.medicines.join(', ')}`,
      confidence: 95,
      medicineNames: visionResult.medicines,
    };
  }

  // 2. Fallback to Tesseract.js if Vision fails or finds nothing
  onProgress?.(20, 'Falling back to OCR engine...');

  const result = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(20 + Math.round(m.progress * 50), 'Reading medicine text...');
      }
    },
  });

  onProgress?.(75, 'Identifying medicines...');

  const rawText = result.data.text;
  const confidence = result.data.confidence;
  const cleanedText = cleanOCRText(rawText);

  onProgress?.(90, 'Extracting medicine names...');

  const medicineNames = extractMedicineNames(cleanedText);

  onProgress?.(100, 'Done!');

  return { rawText: cleanedText, confidence, medicineNames };
}

/**
 * Parse manual text input for medicine names
 */
export function parseManualInput(text: string): string[] {
  const lines = text.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1 && text.length > 20) {
    const extracted = extractMedicineNames(text);
    if (extracted.length > 0) return extracted;
  }
  return lines;
}
