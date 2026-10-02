# Sprint 5A : bouton « Générer avec l'IA » + traduction en un clic (formulaire expérience seule)

Contexte : la création d'une expérience prend trop de temps (chaque texte est saisi 3 fois, EN/FR/HE). On ajoute dans le formulaire actuel `StandaloneExperienceForm.tsx` :
1. un panneau « Générer avec l'IA » qui rédige un brouillon complet à partir de notes, d'un lien et/ou d'un PDF, avec la voix STAYMAKOM ;
2. un bouton « Traduire tout » : on écrit en FR, EN et HE sont générés.

Ce panneau sera réutilisé tel quel dans la refonte du formulaire (sprint 5B) et dans le formulaire hôtel (sprint 5C) : construis-le comme un composant autonome.

Travaille étape par étape et montre-moi le diff de chaque étape avant de passer à la suivante.

## RÈGLES STRICTES
- INTERDIT de toucher la logique de réservation, de prix, de paiement, de disponibilités, le checkout et les Edge Functions de paiement.
- L'IA ne remplit JAMAIS : prix (base_price, base_price_child, supplier_price_*, markup_percent, original_price, deposit_*), disponibilités (available_days, blocked_dates, whitelisted_dates, availability_*, time_slots), prestataire (supplier_*, provider_id), statut, mise en avant, ordre. Même si le document source contient des prix, ils ne sont pas écrits dans ces champs (ils peuvent être cités dans la note « À vérifier »).
- L'IA ne publie jamais et n'enregistre rien en base : elle remplit le formulaire à l'écran, Shana relit puis enregistre comme d'habitude.
- Ne modifie ni ne supprime aucune colonne existante. Aucune migration n'est nécessaire pour ce sprint ; si tu penses en avoir besoin, demande-moi.
- La clé API est côté serveur uniquement (Edge Function), jamais dans le front.
- Si une étape t'oblige à enfreindre une règle, arrête-toi et demande-moi.

## Étape 1 : consignes de rédaction (la « skill »)
- Copier `docs/claude/prompts-ia/standalone-experience.md` et `docs/claude/prompts-ia/hotel-experience.md` vers `supabase/functions/_shared/prompts/` (même nom). Ce sont les consignes de marque STAYMAKOM (ton, structure du titre, de la description, des 4 inclus, SEO…). Ne pas les réécrire.
- Ajouter en tête de chaque fichier un commentaire : « Copie de la skill Claude du même nom. Si la skill change, recopier ce fichier. »

## Étape 2 : Edge Function `generate-experience-draft`
- Nouvelle fonction sur le modèle de `generate-dossier-brief` : mêmes CORS, même contrôle « réservé aux administrateurs », même client Anthropic (`ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID` optionnel). Si `ANTHROPIC_API_KEY` n'est pas configurée, renvoyer une erreur claire « Clé IA manquante » (ne pas basculer silencieusement sur un autre fournisseur).
- Modèle : variable d'env `EXPERIENCE_DRAFT_AI_MODEL`, défaut `claude-sonnet-4-5` (la qualité d'écriture compte ici). Timeout 90 s.
- Entrée JSON : `{ type: "standalone" | "hotel", notes?: string, url?: string, pdf_base64?: string, pdf_name?: string, existing?: object }` (au moins un des trois : notes, url, pdf). PDF limité à 10 Mo.
- URL : réutiliser le module existant `_shared/lookup` (capture + safe-url) pour récupérer le texte de la page. Si la capture échoue, continuer avec les notes/PDF et le signaler dans `warnings`.
- PDF : l'envoyer à Claude comme bloc `document` (base64, application/pdf).
- Prompt système : contenu du fichier `_shared/prompts/standalone-experience.md` (ou `hotel-experience.md` si type = hotel) + consignes techniques : « Tu ne fais pas de recherche web, tu t'appuies uniquement sur les sources fournies. N'invente aucun fait : si une info manque, laisse le champ vide et ajoute-la dans to_verify. Ne produis pas les prompts photos. »
- Sortie : forcer une réponse structurée via un outil (`tool_choice` sur un outil `fill_experience_form`) dont le schéma correspond aux champs du formulaire :
  - `title`, `title_fr`, `title_he`, `subtitle`, `subtitle_fr`, `subtitle_he`, `long_copy`, `long_copy_fr`, `long_copy_he` (HTML simple : `<p>`, `<strong>`, `<em>` uniquement)
  - `category_slugs` (1 ou 2 parmi les catégories existantes, liste passée dans le prompt depuis la table des catégories)
  - `includes` : exactement 4 objets `{ title, title_fr, title_he }`
  - `extras` : liste `{ title, title_fr, title_he, description }` (sans prix)
  - `duration`, `duration_fr`, `duration_he`, `min_party`, `max_party`
  - `city`, `city_fr`, `city_he`, `region`, `region_fr`, `region_he`, `address`, `address_fr`, `address_he`, `google_maps_link`
  - `practical_info` : `{ kids: { status: "yes"|"no"|null, from_age }, kosher: "yes"|"no"|"not_relevant"|null, parking: { status } }`
  - `accessibility_info`, `accessibility_info_he`
  - `cancellation_policy`, `cancellation_policy_fr`, `cancellation_policy_he` (seulement si la source en donne une)
  - SEO : `seo_title_*`, `meta_description_*`, `og_title_*`, `og_description_*` pour en, fr, he
  - `to_verify` : liste de phrases courtes en FR (ex. « Prix fournisseur trouvé : 310 ₪/pers. », « Langue de l'atelier non précisée »)
- Réponse : `{ draft, to_verify, warnings }`. Ne rien écrire en base.

## Étape 3 : composant `AiDraftPanel`
- Nouveau composant `src/components/forms/ai/AiDraftPanel.tsx`, affiché tout en haut de `StandaloneExperienceForm` (au-dessus des onglets), replié par défaut sur une ligne « ✦ Générer avec l'IA ».
- Déplié : un champ texte « Tes notes » (grand), un champ « Lien du site » et une zone « Déposer un PDF ». Bouton « Générer le brouillon ». Pendant la génération : état de chargement avec le texte « Rédaction en cours, environ 30 secondes ».
- Au retour :
  - Si le formulaire est vide (création) : remplir tous les champs reçus.
  - Si des champs sont déjà remplis : afficher une fenêtre « X champs sont déjà remplis. Remplacer / Ne remplir que les champs vides / Annuler ». Défaut : ne remplir que les champs vides.
  - Les inclus et extras : les ajouter dans les listes du formulaire comme si Shana les avait saisis (sans photo, à compléter).
  - Chaque champ rempli par l'IA reçoit un marqueur visuel : bordure violette légère + pastille « IA » à côté du libellé. Le marqueur disparaît dès que le champ est modifié à la main ou quand on clique « Tout valider ».
  - Afficher la liste `to_verify` dans un encadré jaune « À vérifier » en haut du formulaire, chaque ligne cochable.
- Le marqueur « IA » est purement visuel (état local), rien n'est stocké en base.
- Tracking Amplitude : `ai_draft_generated` (type, sources utilisées : notes/url/pdf, durée en s, succès/échec).

## Étape 4 : bouton « Traduire tout » (FR vers EN et HE)
- Dans l'en-tête du formulaire, à côté de « Brouillon » : bouton « Traduire tout ».
- Il prend tous les champs texte FR remplis (titre, sous-titre, description, durée, ville, région, adresse, annulation, accessibilité, inclus, extras) et remplit les champs EN et HE correspondants.
- Pour un champ cible déjà rempli : même logique que l'étape 3 (demander, défaut = ne remplir que les vides).
- Traduction : nouvelle action `mode: "translate"` dans `generate-experience-draft` (même Claude, consigne : « traduction naturelle, pas mot à mot, voix STAYMAKOM, garder le HTML »). Ne pas utiliser `translate-text` pour les textes longs.
- Les champs traduits reçoivent aussi le marqueur « IA ».
- Ne pas changer pour l'instant quelle langue est obligatoire à la validation (EN reste requis) : la traduction permet de le remplir en un clic.

## Critères d'acceptation
- Avec seulement des notes (« cours de cuisine chez Citrus & Salt, Tel Aviv, 3 h, chef pro, casher, 1-10 personnes, dès 12 ans »), le panneau remplit titres, accroches, descriptions FR/EN/HE, 4 inclus, durée, groupe, ville, infos pratiques et SEO, et liste ce qui est à vérifier.
- Aucun champ de prix, de dispo ou de prestataire n'est modifié par l'IA, même avec un PDF contenant des tarifs.
- Rien n'est enregistré en base tant que Shana ne clique pas Brouillon ou Publier.
- Une expérience existante ouverte en modification n'est pas écrasée sans confirmation.
- `npm run build` passe. Déployer la fonction `generate-experience-draft` et me dire si la clé `ANTHROPIC_API_KEY` est bien présente dans les secrets Supabase.
