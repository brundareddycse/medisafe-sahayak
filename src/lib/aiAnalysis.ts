import { supabase } from '@/integrations/supabase/client';
import type { Medicine, Interaction, FoodInteraction, ScheduleItem } from './mockData';

export interface AIAnalysisResult {
  medicines: Medicine[];
  interactions: Interaction[];
  foodInteractions: FoodInteraction[];
  schedule: ScheduleItem[];
  summary: string;
}

export async function analyzeMedicines(medicineNames: string[]): Promise<AIAnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-medicines', {
    body: { medicines: medicineNames },
  });

  if (error) {
    console.error('AI analysis error:', error);
    throw new Error(error.message || 'Failed to analyze medicines');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AIAnalysisResult;
}
