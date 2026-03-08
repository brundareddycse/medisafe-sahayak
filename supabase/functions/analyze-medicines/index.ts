import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are MediSafe AI, an expert clinical pharmacist AI specialized in Indian medicines. You analyze drug interactions for Indian patients.

Given a list of medicine names, you MUST return a JSON response using the tool provided. Analyze:

1. **Medicine Details**: For each medicine, provide:
   - Full brand name and dosage as detected
   - Generic/salt name (INN name)
   - Standard dosage instructions
   - Type (tablet/capsule/syrup/injection)
   - Approximate MRP price in INR
   - Jan Aushadhi generic alternative name and price if available

2. **Drug-Drug Interactions**: Check ALL pairwise combinations for:
   - Severity: "critical" (avoid combination), "moderate" (use with caution), "minor" (generally safe)
   - Clinical description of the interaction mechanism
   - Practical recommendation for the patient

3. **Food & Lifestyle Interactions**: For each medicine, list relevant food/drink interactions:
   - The food/drink item
   - An emoji icon for the food
   - Severity: "avoid" (must not combine), "caution" (be careful), "timing" (timing matters)
   - Practical description

4. **Dosing Schedule**: Create an optimal daily schedule:
   - Time slots with labels (Empty Stomach, After Breakfast, etc.)
   - Which medicines go in each slot
   - Consider interactions when scheduling

Focus on accuracy for Indian brand names (Thyronorm, Ecosprin, Dolo, Crocin, Glycomet, etc.) and Jan Aushadhi alternatives. Be thorough but patient-friendly in descriptions.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicines } = await req.json();

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide a list of medicine names" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const userPrompt = `Analyze these medicines for a patient in India: ${medicines.join(", ")}

Check ALL pairwise drug interactions, food interactions, and create an optimal dosing schedule. Use Indian brand names and prices in INR.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] },
          ],
          tools: [
            {
              functionDeclarations: [
                {
                  name: "medicine_safety_report",
                  description: "Return a complete medicine safety analysis report",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      medicines: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            id: { type: "STRING" },
                            name: { type: "STRING", description: "Brand name with dosage" },
                            genericName: { type: "STRING", description: "Generic/salt name" },
                            dosage: { type: "STRING", description: "Dosage instructions" },
                            type: { type: "STRING", description: "tablet, capsule, syrup, or injection" },
                            price: { type: "NUMBER", description: "MRP in INR" },
                            genericPrice: { type: "NUMBER", description: "Jan Aushadhi price in INR" },
                            genericBrand: { type: "STRING", description: "Jan Aushadhi alternative name" },
                          },
                          required: ["id", "name", "genericName", "dosage", "type", "price"],
                        },
                      },
                      interactions: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            id: { type: "STRING" },
                            medicine1: { type: "STRING" },
                            medicine2: { type: "STRING" },
                            severity: { type: "STRING", description: "critical, moderate, or minor" },
                            description: { type: "STRING", description: "Clinical explanation in simple language" },
                            recommendation: { type: "STRING", description: "What the patient should do" },
                          },
                          required: ["id", "medicine1", "medicine2", "severity", "description", "recommendation"],
                        },
                      },
                      foodInteractions: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            medicine: { type: "STRING" },
                            food: { type: "STRING" },
                            icon: { type: "STRING", description: "Single emoji for the food" },
                            severity: { type: "STRING", description: "avoid, caution, or timing" },
                            description: { type: "STRING" },
                          },
                          required: ["medicine", "food", "icon", "severity", "description"],
                        },
                      },
                      schedule: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            time: { type: "STRING", description: "Time like 6:00 AM" },
                            label: { type: "STRING", description: "e.g. Empty Stomach, After Breakfast" },
                            medicines: {
                              type: "ARRAY",
                              items: { type: "STRING" },
                              description: "Medicine names for this time slot",
                            },
                          },
                          required: ["time", "label", "medicines"],
                        },
                      },
                      summary: {
                        type: "STRING",
                        description: "Brief 1-2 sentence overall safety summary for the patient",
                      },
                    },
                    required: ["medicines", "interactions", "foodInteractions", "schedule", "summary"],
                  },
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
              allowedFunctionNames: ["medicine_safety_report"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again in a few seconds." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract function call result from Gemini response
    const parts = data.candidates?.[0]?.content?.parts;
    const functionCall = parts?.find((p: any) => p.functionCall)?.functionCall;
    if (!functionCall?.args) {
      throw new Error("AI did not return structured data");
    }

    const report = functionCall.args;

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-medicines error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
