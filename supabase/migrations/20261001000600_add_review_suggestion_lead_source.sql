-- Une suggestion/question laissée sur la page d'avis (/avis/:token) est enregistrée
-- dans les leads existants (source) pour que Shana la voie dans /admin/leads, sans
-- créer un nouveau système de messages en parallèle.

ALTER TABLE public.leads DROP CONSTRAINT leads_source_check;

ALTER TABLE public.leads ADD CONSTRAINT leads_source_check
  CHECK (source = ANY (ARRAY[
    'newsletter', 'contact', 'partners', 'corporate', 'win_trip', 'landing_page',
    'coming_soon', 'ai_assistant_save', 'category_waitlist', 'newsletter_popup',
    'tailored_request', 'experience_only', 'reservation', 'account', 'review_suggestion'
  ]));
