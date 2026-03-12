import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = ['https://staymakom.com','https://www.staymakom.com','https://stay-makom-experiences.lovable.app','http://localhost:5173','http://localhost:8080'];
function getCorsHeaders(req: Request) { const o = req.headers.get('Origin')||''; return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o)?o:ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }; }

interface TranslateRequest {
  texts: string[];
  targetLang: "he" | "en" | "fr";
}

// Common city/region translations for Israel (short terms only)
const hebrewTranslations: Record<string, string> = {
  // Cities
  "tel aviv": "תל אביב",
  "tel aviv-yafo": "תל אביב-יפו",
  "tel-aviv": "תל אביב",
  "jerusalem": "ירושלים",
  "haifa": "חיפה",
  "eilat": "אילת",
  "herzliya": "הרצליה",
  "netanya": "נתניה",
  "ashdod": "אשדוד",
  "beer sheva": "באר שבע",
  "beersheba": "באר שבע",
  "tiberias": "טבריה",
  "nazareth": "נצרת",
  "acre": "עכו",
  "akko": "עכו",
  "nahariya": "נהריה",
  "safed": "צפת",
  "zefat": "צפת",
  "tzfat": "צפת",
  "rishon lezion": "ראשון לציון",
  "petah tikva": "פתח תקווה",
  "holon": "חולון",
  "bat yam": "בת ים",
  "ramat gan": "רמת גן",
  "bnei brak": "בני ברק",
  "rehovot": "רחובות",
  "ashkelon": "אשקלון",
  "kfar saba": "כפר סבא",
  "raanana": "רעננה",
  "lod": "לוד",
  "ramla": "רמלה",
  "modi'in": "מודיעין",
  "modiin": "מודיעין",
  "rosh pina": "ראש פינה",
  "mitzpe ramon": "מצפה רמון",
  "dead sea": "ים המלח",
  "ein bokek": "עין בוקק",
  "neve zohar": "נווה זוהר",
  "arad": "ערד",
  "dimona": "דימונה",
  "sde boker": "שדה בוקר",
  "caesarea": "קיסריה",
  "zichron yaakov": "זכרון יעקב",
  "beit shean": "בית שאן",
  "kiryat shmona": "קריית שמונה",
  "yotvata": "יטבתה",
  "timna": "תמנע",
  "ein gedi": "עין גדי",
  "masada": "מצדה",
  
  // Regions
  "tel aviv district": "מחוז תל אביב",
  "tel aviv area": "אזור תל אביב",
  "central district": "מחוז המרכז",
  "central israel": "מרכז ישראל",
  "jerusalem district": "מחוז ירושלים",
  "northern district": "מחוז הצפון",
  "north israel": "צפון ישראל",
  "northern israel": "צפון ישראל",
  "southern district": "מחוז הדרום",
  "south israel": "דרום ישראל",
  "southern israel": "דרום ישראל",
  "haifa district": "מחוז חיפה",
  "judea and samaria": "יהודה ושומרון",
  "golan heights": "רמת הגולן",
  "galilee": "גליל",
  "upper galilee": "גליל עליון",
  "lower galilee": "גליל תחתון",
  "western galilee": "גליל מערבי",
  "negev": "נגב",
  "negev desert": "מדבר הנגב",
  "judean desert": "מדבר יהודה",
  "sharon": "השרון",
  "sharon plain": "מישור השרון",
  "coastal plain": "מישור החוף",
  "jezreel valley": "עמק יזרעאל",
  "jordan valley": "בקעת הירדן",
  "arava": "ערבה",
  "carmel": "כרמל",
  "mount carmel": "הר הכרמל",
  
  // Common terms
  "israel": "ישראל",
};

// Check if text is a short term that can use dictionary lookup
function isShortTerm(text: string): boolean {
  // Consider it short if it's less than 50 characters and likely a city/region name
  return text.length < 50;
}

function translateToHebrewDictionary(text: string): string | null {
  if (!text) return "";
  
  const lowerText = text.toLowerCase().trim();
  
  // Direct match only for short terms
  if (hebrewTranslations[lowerText]) {
    return hebrewTranslations[lowerText];
  }
  
  return null; // No dictionary match
}

// Use Lovable AI to translate longer texts
async function translateWithAI(texts: string[], targetLang: string): Promise<string[]> {
  const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY is not configured");
    return texts;
  }
  
  const languageNames: Record<string, string> = {
    he: "Hebrew",
    en: "English",
    fr: "French",
  };
  
  const targetLanguage = languageNames[targetLang] || "Hebrew";
  
  const prompt = `Translate the following texts to ${targetLanguage}. Return ONLY a JSON array of translated strings, in the same order as the input. Do not include any explanation or markdown formatting.

Input texts:
${JSON.stringify(texts, null, 2)}

Return format example: ["translated text 1", "translated text 2"]`;

  try {
    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in ${targetLanguage}. Translate accurately while maintaining the original meaning and tone. For hotel/tourism content, use appropriate hospitality terminology.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error("AI translation failed:", response.status, bodyText);
      return texts; // Return original on error
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON array from the response
    // Try to extract JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const translations = JSON.parse(jsonMatch[0]);
      if (Array.isArray(translations) && translations.length === texts.length) {
        return translations;
      }
    }
    
    console.error("Failed to parse AI translation response:", content);
    return texts; // Return original on parse error
  } catch (error) {
    console.error("AI translation error:", error);
    return texts; // Return original on error
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLang } = (await req.json()) as TranslateRequest;

    if (!texts || !Array.isArray(texts)) {
      return new Response(
        JSON.stringify({ error: "texts array is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (targetLang !== "he" && targetLang !== "fr") {
      // For English or unsupported languages, just return original texts
      return new Response(
        JSON.stringify({ translations: texts }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Separate texts into short (dictionary) and long (AI) translation
    const translations: string[] = new Array(texts.length);
    const textsNeedingAI: { index: number; text: string }[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      if (!text || text.trim() === "") {
        translations[i] = "";
        continue;
      }
      
      // For Hebrew target, try dictionary first for short terms
      if (targetLang === "he" && isShortTerm(text)) {
        const dictTranslation = translateToHebrewDictionary(text);
        if (dictTranslation !== null) {
          translations[i] = dictTranslation;
          continue;
        }
      }
      
      // Queue for AI translation
      textsNeedingAI.push({ index: i, text });
    }
    
    // If there are texts needing AI translation, do it in one batch
    if (textsNeedingAI.length > 0) {
      console.log(`Translating ${textsNeedingAI.length} texts with AI to ${targetLang}`);
      const aiTexts = textsNeedingAI.map(t => t.text);
      const aiTranslations = await translateWithAI(aiTexts, targetLang);
      
      // Map AI translations back to their original positions
      for (let i = 0; i < textsNeedingAI.length; i++) {
        translations[textsNeedingAI[i].index] = aiTranslations[i];
      }
    }

    console.log(`Translated ${texts.length} texts to ${targetLang}:`, { 
      original: texts.map(t => t?.slice(0, 30) + (t?.length > 30 ? "..." : "")), 
      translated: translations.map(t => t?.slice(0, 30) + (t?.length > 30 ? "..." : "")) 
    });

    return new Response(
      JSON.stringify({ translations }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to translate texts" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
