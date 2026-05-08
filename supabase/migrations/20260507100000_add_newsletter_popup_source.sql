-- Ajoute newsletter_popup et tailored_request (manquants) à la contrainte sur leads.source
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source = ANY (ARRAY[
    'newsletter', 'contact', 'partners', 'corporate',
    'win_trip', 'landing_page', 'coming_soon',
    'ai_assistant_save', 'category_waitlist',
    'newsletter_popup', 'tailored_request'
  ]));
