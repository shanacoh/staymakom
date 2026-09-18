-- Ajoute 'account' à la liste des origines possibles d'un lead, pour les
-- fiches créées automatiquement pour un compte qui n'a jamais rempli aucun
-- formulaire (ex : Candero, qui a un compte mais aucune trace de lead).
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source = ANY (ARRAY[
    'newsletter', 'contact', 'partners', 'corporate',
    'win_trip', 'landing_page', 'coming_soon',
    'ai_assistant_save', 'category_waitlist',
    'newsletter_popup', 'tailored_request',
    'experience_only', 'reservation', 'account'
  ]));
