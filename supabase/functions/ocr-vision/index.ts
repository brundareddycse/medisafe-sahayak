import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a pharmacist AI. Look at this image of medicine packaging, strip, box, label, or prescription.

Extract ALL medicine/drug names visible in the image. For each medicine found, include the dosage if visible (e.g. "Amlodipine 5mg", "Thyronorm 50mcg").

Rules:
- Return ONLY a JSON array of strings, each being a medicine name with dosage
- Include Indian brand names as-is (Thyronorm, Ecosprin, Dolo, Crocin, etc.)
- If you see generic names, include those too
- If no medicines are found, return an empty array []
- Do NOT include any explanation, just the JSON array

Example output: ["Thyronorm 50mcg", "Ecosprin 75mg", "Metformin 500mg"]`,
                },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini Vision error:", response.status, errorText);
      throw new Error(`Gemini Vision error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let medicines: string[] = [];
    if (jsonMatch) {
      try {
        medicines = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("Failed to parse Gemini response as JSON:", text);
        medicines = [];
      }
    }

    return new Response(
      JSON.stringify({ medicines, rawText: text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ocr-vision error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Vision OCR failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
