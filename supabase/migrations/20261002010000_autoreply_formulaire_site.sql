-- Étape 10 du chantier "Dossier de voyage" : réponse automatique aux demandes du formulaire
-- "Créer mon voyage" du site. La banque de questions vit en base (pas en dur dans le code) pour
-- que Shana puisse l'ajuster elle-même plus tard sans redéploiement.

create table public.autoreply_question_bank (
  id uuid primary key default gen_random_uuid(),
  champ_manquant text not null check (champ_manquant in ('dates_exactes', 'regions', 'contraintes', 'budget', 'envies')),
  texte_fr text not null,
  texte_en text not null,
  texte_he text not null,
  actif boolean not null default true,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.autoreply_question_bank is 'Banque de 8 questions (maximum) pour la réponse automatique au formulaire "Créer mon voyage". Textes de départ à valider par Shana — modifiables directement ici, sans déploiement.';

alter table public.autoreply_question_bank enable row level security;

create policy autoreply_question_bank_admin_all on public.autoreply_question_bank
  for all using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Lecture nécessaire côté edge function via la clé service_role (déjà admin de fait), rien de
-- plus à ouvrir : aucun accès public direct à cette table.

insert into public.autoreply_question_bank (champ_manquant, texte_fr, texte_en, texte_he, ordre) values
  ('dates_exactes', 'As-tu déjà des dates précises en tête, ou une fourchette de dates ?', 'Do you already have exact dates in mind, or a date range?', 'האם יש לכם תאריכים מדויקים בראש, או טווח תאריכים?', 1),
  ('regions', 'Y a-t-il une région d''Israël que tu as particulièrement envie de découvrir (ou d''éviter) ?', 'Is there a region of Israel you''re especially keen to explore (or to avoid)?', 'האם יש אזור בישראל שבא לכם לגלות (או להימנע ממנו)?', 2),
  ('contraintes', 'Avez-vous des contraintes à prendre en compte (casher, mobilité réduite, allergies) ?', 'Any constraints we should know about (kosher, reduced mobility, allergies)?', 'האם יש אילוצים שכדאי שנדע עליהם (כשרות, ניידות מוגבלת, אלרגיות)?', 3),
  ('budget', 'As-tu une idée du budget que tu souhaites consacrer à ce voyage ?', 'Do you have a budget in mind for this trip?', 'האם יש לכם תקציב מסוים בראש לטיול הזה?', 4),
  ('envies', 'Qu''est-ce qui te ferait le plus plaisir pendant ce voyage (nature, gastronomie, détente, aventure) ?', 'What would you enjoy most on this trip (nature, food, relaxation, adventure)?', 'מה הכי ישמח אתכם בטיול הזה (טבע, אוכל, רוגע, הרפתקה)?', 5)
on conflict do nothing;

-- Planification de l'envoi (posée à la création du dossier par collect-lead, lue/consommée par
-- la fonction d'envoi périodique send-dossier-voyage-autoreplies).
alter table public.dossiers_voyage
  add column autoreply_envoyer_apres timestamptz,
  add column autoreply_envoye_at timestamptz;

comment on column public.dossiers_voyage.autoreply_envoyer_apres is 'Moment au plus tôt où la réponse automatique au formulaire site peut être envoyée (décalé de quelques minutes, jamais la nuit, jamais pendant Shabbat). Null = pas concerné par l''autoreply.';
