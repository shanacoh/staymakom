> **INTERRUPTEUR ALLUMÉ le 19/11/2026** à la demande de Shana (`autoLocalesPublic: true`) : espagnol, russe et
> allemand visibles dans le sélecteur, annoncés à Google (hreflang) et présents dans le plan du site.

# Avant d'allumer l'interrupteur ES / RU / DE

L'interrupteur est `autoLocalesPublic` dans `src/config/languages.json`. Le passer à `true`
active en une fois : le sélecteur de langue, les balises hreflang, le plan du site et
l'indexation Google des pages en espagnol, russe et allemand.

Ne l'allumer que lorsque **toutes** les cases sont cochées (sauf les pages légales, voir plus bas), et seulement à la demande de Shana :

- [ ] **Boutons et menus traduits** : tous les textes d'interface des pages publiques existent en
      ES / RU / DE (`src/lib/uiTranslations/`). Aucun bouton en anglais sur une page `?lang=ru`.
      Avancement (une ligne cochée = textes rapatriés dans `translations.ts` et traduits) :
  - [x] Accueil, en-tête, menu, barre du bas (téléphone), pied de page, FAQ de l'accueil (17/11/2026)
  - [x] Cartes d'expérience, d'hôtel et de bateau, badges calculés (casher, âge...) (17/11/2026)
  - [x] Champ téléphone : messages et noms de pays (17/11/2026)
  - [x] Fiche expérience seule / bateau (`StandaloneExperience`, panneau de demande, pop-up bateau) (17/11/2026)
  - [x] Fiche expérience avec hôtel (`Experience2`, panneau de réservation, `LeadGuestForm`) (17/11/2026)
  - [x] Paiement et confirmation (`StandaloneCheckout`, `Checkout`, `BookingConfirmationDialog`,
        pages de confirmation), fenêtre de connexion (`AuthPromptDialog`), menu du compte,
        bandeau cookies, conditions d'annulation hôtel, calendriers et dates (17/11/2026)
  - [x] Catégories, liste des expériences, vitrine bateaux (`/boat`) (19/11/2026)
  - [x] Journal, À propos, Contact, Carte cadeau, formulaire sur-mesure (`TailorMadeDialog`), page 404,
        fenêtre newsletter (19/11/2026)
  - [ ] Pages légales (conditions, confidentialité, annulation, cookies, mentions légales) :
        traduction automatique + mention en tête, dans chaque langue : « En cas de divergence, la
        version anglaise fait foi » (décision de Shana du 17/11/2026). NE BLOQUE PAS l'interrupteur
        (décision du 19/11/2026) : en espagnol, russe et allemand elles restent en anglais pour l'instant,
        traduction après la mise à jour du texte anglais par Shana
  - [x] Espace client (`/account` : mes réservations, favoris, cartes cadeaux, profil, questionnaire
        d'accueil) (19/11/2026)
  - [x] Recherche : pas de page de recherche sur le site actuel (l'assistant de recherche IA n'existe que
        sur l'ancienne page `/home`, non visible des clients) ; le tri et les filtres des catégories sont traduits
  - [x] Étiquette de catégorie des articles du Journal (« STORIES »...) : traduite à l'affichage
        (`src/lib/journalCategories.ts`), aussi en français et en hébreu (19/11/2026)
  - [x] Anciennes clés de `translations.ts` encore utilisées (vérifié le 19/11/2026) : page
        Entreprises (`/companies`), page hôtel (`/hotel/...`) traduites. Les clés encore sans russe sont
        soit volontairement identiques (noms des moods, marques, « 2h », titre de l'accueil), soit
        utilisées seulement par d'anciennes pages plus accessibles (`/home`, `/hotel-old`,
        `/experiences-old`, ancien en-tête et ancien pied de page) ou par le back-office
- [x] **Villes et régions traduites** (19/11/2026) : elles s'affichent dans la langue de la page
      (Иерусалим, Jerusalén, Totes Meer...) grâce au dictionnaire `src/lib/placeNames.ts`, appliqué
      seulement à l'affichage : les filtres et le regroupement par région utilisent toujours le nom
      anglais. Un nouveau lieu absent du dictionnaire s'affiche en anglais : vérifier avec
      `docs/traductions/lieux-publies.sql` et l'ajouter.
- [x] **Zéro titre resté en anglais** (vérifié le 19/11/2026 : 6 titres allemands et 3 titres russes corrigés à la main, marqués « reviewed ») : la requête ci-dessous ne renvoie que des noms propres
      (hôtels, partenaires, moods, STAYMAKOM, villes au nom identique).

```sql
select locale, entity_type, field, left(text, 80) as texte
from content_translations
where encode(sha256(convert_to(text, 'UTF8')), 'hex') = source_hash
  and entity_type in ('experience2', 'standalone_experience', 'journal_post', 'category')
  and field in ('title', 'title_en', 'subtitle', 'og_title_en', 'seo_title_en')
order by entity_type, texte, locale;
```

- [x] **Options payantes des fiches avec hôtel** (« Late Check-out », « Wine in Room »...) : elles
      viennent de `hotel2_extras`, ajoutée à la carte le 17/11/2026 (entité `hotel2_extra`).
      Traduites le 19/11/2026 : 294 options des 29 hôtels publiés, coût 0,88 $.
- [x] **Emails client dans la langue du client** (ES / RU / DE, 19/11/2026) : confirmation
      d'expérience, confirmation hôtel, billets (email et page billet), rappel de la veille, accusé
      de réception du formulaire Contact. Langue = `client_locale` de la réservation, sinon
      `preferred_lang`. Textes des fiches traduits via `_shared/translations/translateRow.ts` (seulement
      si la traduction correspond à l'anglais actuel). Il n'existe pas d'email « demande reçue » pour
      les demandes d'expérience, de bateau ou sur-mesure (voir problemes-hors-traduction.md).
- [ ] **Relecture** : une fiche de chaque type relue par un lecteur natif dans chaque langue.
- [ ] **Demande test** depuis une page `?lang=ru` : dans le back-office, la demande affiche le
      nom anglais de l'expérience et le badge « RU ».

Après l'allumage : redéployer le site (le plan du site se régénère à la construction), puis
soumettre le plan du site dans Google Search Console.

> Format des titres SEO des fiches expérience : « Titre | Ville », la ville une seule fois (décision de
> Shana du 19/11/2026). Les titres en « Titre, Ville | Ville » ont été corrigés le 19/11/2026 (anglais,
> français, hébreu et traductions). Requête de contrôle : `docs/traductions/titres-ville-en-double.sql`.
> Un titre où la ville fait naturellement partie du titre (« Zip Line Over the Old City of Jerusalem |
> Jerusalem ») reste tel quel (décision du 19/11/2026).
