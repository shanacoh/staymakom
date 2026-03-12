ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check 
  CHECK (source IN ('landing_page', 'ai_assistant_save', 'coming_soon', 'category_waitlist', 'tailored_request', 'contact', 'corporate', 'partners'));