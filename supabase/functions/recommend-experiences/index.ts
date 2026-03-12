import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  'https://stay-makom-experiences.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

interface Hotel {
  name: string;
  name_he: string;
  city: string;
  city_he: string;
  region: string;
  region_he: string;
}

interface Category {
  name: string;
  name_he: string;
  slug: string;
}

interface Experience {
  id: string;
  title: string;
  title_he: string | null;
  subtitle: string | null;
  subtitle_he: string | null;
  long_copy: string | null;
  long_copy_he: string | null;
  base_price: number;
  currency: string | null;
  includes: string[] | null;
  includes_he: string[] | null;
  duration: string | null;
  duration_he: string | null;
  min_party: number | null;
  max_party: number | null;
  region_type: string | null;
  slug: string;
  hero_image: string | null;
  category_id: string | null;
  hotels: Hotel | null;
  categories: Category | null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, lang = 'en' } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing recommendation request: "${query}" (lang: ${lang})`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published experiences with hotel and category info
    const { data: experiences, error: dbError } = await supabase
      .from('experiences')
      .select(`
        id,
        title,
        title_he,
        subtitle,
        subtitle_he,
        long_copy,
        long_copy_he,
        base_price,
        currency,
        includes,
        includes_he,
        duration,
        duration_he,
        min_party,
        max_party,
        region_type,
        slug,
        hero_image,
        category_id,
        hotels (
          name,
          name_he,
          city,
          city_he,
          region,
          region_he
        ),
        categories:category_id (
          name,
          name_he,
          slug
        )
      `)
      .eq('status', 'published');

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to fetch experiences');
    }

    // Use any type to avoid complex Supabase typing issues
    const typedExperiences = experiences as any[];

    if (!typedExperiences || typedExperiences.length === 0) {
      return new Response(
        JSON.stringify({ 
          recommendations: [], 
          message: lang === 'he' 
            ? 'אין חוויות זמינות כרגע.' 
            : 'No experiences available at the moment.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${typedExperiences.length} published experiences`);

    // Build experience summaries for the AI
    const experienceSummaries = typedExperiences.map(exp => {
      const title = lang === 'he' && exp.title_he ? exp.title_he : exp.title;
      const subtitle = lang === 'he' && exp.subtitle_he ? exp.subtitle_he : exp.subtitle;
      const hotelName = lang === 'he' && exp.hotels?.name_he ? exp.hotels.name_he : exp.hotels?.name;
      const city = lang === 'he' && exp.hotels?.city_he ? exp.hotels.city_he : exp.hotels?.city;
      const region = lang === 'he' && exp.hotels?.region_he ? exp.hotels.region_he : exp.hotels?.region;
      const categoryName = lang === 'he' && exp.categories?.name_he ? exp.categories.name_he : exp.categories?.name;
      const includes = lang === 'he' && exp.includes_he ? exp.includes_he : exp.includes;
      
      return {
        id: exp.id,
        title,
        subtitle,
        hotel: hotelName,
        location: `${city || ''}, ${region || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        category: categoryName || exp.categories?.slug,
        price: `${exp.base_price} ${exp.currency || 'ILS'}`,
        duration: lang === 'he' && exp.duration_he ? exp.duration_he : exp.duration,
        partySize: exp.min_party && exp.max_party ? `${exp.min_party}-${exp.max_party}` : null,
        includes: includes?.slice(0, 3) || [],
        slug: exp.slug,
        hero_image: exp.hero_image
      };
    });

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = lang === 'he' 
      ? `אתה יועץ נסיעות מומחה של Staymakom, פלטפורמה לחוויות מלונאות ייחודיות בישראל.
תפקידך לנתח את בקשת המשתמש ולהמליץ על 2-3 חוויות מתוך הרשימה הזמינה.

הנחיות:
- המלץ רק על חוויות מהרשימה שסופקה
- התאם את ההמלצות לפי: קטגוריה, מיקום, תקציב, גודל קבוצה, סגנון
- הסבר בקצרה למה כל חוויה מתאימה
- היה חם, אישי ומזמין
- אם הבקשה לא ברורה, המלץ על מגוון אפשרויות

החזר תשובה בפורמט JSON בלבד:
{
  "intro": "משפט פתיחה אישי המתייחס לבקשה",
  "recommendations": [
    {
      "id": "experience-uuid",
      "reason": "הסבר קצר למה זה מתאים"
    }
  ]
}`
      : `You are an expert travel advisor for Staymakom, a platform for unique hotel experiences in Israel.
Your role is to analyze the user's request and recommend 2-3 experiences from the available list.

Guidelines:
- Only recommend experiences from the provided list
- Match recommendations based on: category, location, budget, group size, style
- Briefly explain why each experience fits
- Be warm, personal, and inviting
- If the request is unclear, recommend a variety of options

Return response in JSON format only:
{
  "intro": "A personal opening sentence addressing the request",
  "recommendations": [
    {
      "id": "experience-uuid",
      "reason": "Brief explanation of why this fits"
    }
  ]
}`;

    const userPrompt = `${lang === 'he' ? 'חוויות זמינות' : 'Available experiences'}:
${JSON.stringify(experienceSummaries, null, 2)}

${lang === 'he' ? 'בקשת המשתמש' : 'User request'}: "${query}"`;

    console.log('Calling Lovable AI...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: lang === 'he' ? 'יותר מדי בקשות, נסו שוב בעוד רגע' : 'Too many requests, please try again shortly' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: lang === 'he' ? 'שגיאה בשירות' : 'Service error' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let parsedResponse;
    try {
      const content = aiData.choices?.[0]?.message?.content || '';
      // Try to parse as JSON, handling potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: return top experiences by random
      const shuffled = [...typedExperiences].sort(() => Math.random() - 0.5).slice(0, 3);
      parsedResponse = {
        intro: lang === 'he' 
          ? 'הנה כמה חוויות שאולי יתאימו לכם:' 
          : 'Here are some experiences you might enjoy:',
        recommendations: shuffled.map(exp => ({
          id: exp.id,
          reason: lang === 'he' ? 'חוויה מומלצת' : 'Recommended experience'
        }))
      };
    }

    // Enrich recommendations with full experience data
    const enrichedRecommendations = parsedResponse.recommendations
      .map((rec: { id: string; reason: string }) => {
        const exp = typedExperiences.find(e => e.id === rec.id);
        if (!exp) return null;
        
        return {
          id: exp.id,
          slug: exp.slug,
          title: lang === 'he' && exp.title_he ? exp.title_he : exp.title,
          subtitle: lang === 'he' && exp.subtitle_he ? exp.subtitle_he : exp.subtitle,
          hotel: lang === 'he' && exp.hotels?.name_he ? exp.hotels.name_he : exp.hotels?.name,
          location: `${(lang === 'he' && exp.hotels?.city_he ? exp.hotels.city_he : exp.hotels?.city) || ''}, ${(lang === 'he' && exp.hotels?.region_he ? exp.hotels.region_he : exp.hotels?.region) || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
          price: exp.base_price,
          currency: exp.currency || 'ILS',
          hero_image: exp.hero_image,
          reason: rec.reason
        };
      })
      .filter(Boolean)
      .slice(0, 3);

    // Generate session_id if not provided
    const sessionId = req.headers.get('x-session-id') || crypto.randomUUID();
    
    // Save query for analytics and return the search_id
    const recommendedIds = enrichedRecommendations.map((r: { id: string }) => r.id);
    const { data: insertedQuery, error: insertError } = await supabase
      .from('ai_search_queries')
      .insert({
        query: query,
        lang: lang,
        recommended_ids: recommendedIds,
        recommendation_count: recommendedIds.length,
        user_agent: req.headers.get('user-agent'),
        session_id: sessionId
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to save query:', insertError);
    } else {
      console.log('Query saved for analytics, id:', insertedQuery?.id);
    }

    console.log(`Returning ${enrichedRecommendations.length} recommendations`);

    return new Response(
      JSON.stringify({
        intro: parsedResponse.intro,
        recommendations: enrichedRecommendations,
        search_id: insertedQuery?.id || null,
        session_id: sessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recommend-experiences:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
