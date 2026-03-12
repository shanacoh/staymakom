ALTER TABLE public.leads DROP CONSTRAINT leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check 
  CHECK (source = ANY (ARRAY[
    'newsletter', 'contact', 'partners', 'corporate', 
    'win_trip', 'landing_page', 'coming_soon', 
    'ai_assistant_save', 'category_waitlist'
  ]));