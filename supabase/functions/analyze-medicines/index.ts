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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Analyze these medicines for a patient in India: ${medicines.join(", ")}

Check ALL pairwise drug interactions, food interactions, and create an optimal dosing schedule. Use Indian brand names and prices in INR.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "medicine_safety_report",
                description: "Return a complete medicine safety analysis report",
                parameters: {
                  type: "object",
                  properties: {
                    medicines: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string", description: "Brand name with dosage" },
                          genericName: { type: "string", description: "Generic/salt name" },
                          dosage: { type: "string", description: "Dosage instructions" },
                          type: { type: "string", description: "tablet, capsule, syrup, or injection" },
                          price: { type: "number", description: "MRP in INR" },
                          genericPrice: { type: "number", description: "Jan Aushadhi price in INR" },
                          genericBrand: { type: "string", description: "Jan Aushadhi alternative name" },
                        },
                        required: ["id", "name", "genericName", "dosage", "type", "price"],
                      },
                    },
                    interactions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          medicine1: { type: "string" },
                          medicine2: { type: "string" },
                          severity: { type: "string", description: "critical, moderate, or minor" },
                          description: { type: "string", description: "Clinical explanation in simple language" },
                          recommendation: { type: "string", description: "What the patient should do" },
                        },
                        required: ["id", "medicine1", "medicine2", "severity", "description", "recommendation"],
                      },
                    },
                    foodInteractions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          medicine: { type: "string" },
                          food: { type: "string" },
                          icon: { type: "string", description: "Single emoji for the food" },
                          severity: { type: "string", description: "avoid, caution, or timing" },
                          description: { type: "string" },
                        },
                        required: ["medicine", "food", "icon", "severity", "description"],
                      },
                    },
                    schedule: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          time: { type: "string", description: "Time like 6:00 AM" },
                          label: { type: "string", description: "e.g. Empty Stomach, After Breakfast" },
                          medicines: {
                            type: "array",
                            items: { type: "string" },
                            description: "Medicine names for this time slot",
                          },
                        },
                        required: ["time", "label", "medicines"],
                      },
                    },
                    summary: {
                      type: "string",
                      description: "Brief 1-2 sentence overall safety summary for the patient",
                    },
                  },
                  required: ["medicines", "interactions", "foodInteractions", "schedule", "summary"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "medicine_safety_report" } },
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();

    // Extract tool call result from OpenAI-compatible response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Unexpected AI response:", JSON.stringify(data));
      throw new Error("AI did not return structured data");
    }

    let report;
    try {
      report = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch (parseErr) {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      throw new Error("Failed to parse AI response");
    }

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
