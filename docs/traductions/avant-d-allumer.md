# Avant d'allumer l'interrupteur ES / RU / DE

L'interrupteur est `autoLocalesPublic` dans `src/config/languages.json`. Le passer à `true`
active en une fois : le sélecteur de langue, les balises hreflang, le plan du site et
l'indexation Google des pages en espagnol, russe et allemand.

Ne l'allumer que lorsque **toutes** les cases sont cochées :

- [ ] **Boutons et menus traduits** : tous les textes d'interface des pages publiques existent en
      ES / RU / DE (`src/lib/uiTranslations/`). Aucun bouton en anglais sur une page `?lang=ru`.
      Avancement (une ligne cochée = textes rapatriés dans `translations.ts` et traduits) :
  - [x] Accueil, en-tête, menu, barre du bas (téléphone), pied de page, FAQ de l'accueil (17/11/2026)
  - [x] Cartes d'expérience, d'hôtel et de bateau, badges calculés (casher, âge...) (17/11/2026)
  - [x] Champ téléphone : messages et noms de pays (17/11/2026)
  - [ ] Fiche expérience seule / bateau (`StandaloneExperience`, panneau de demande, pop-up bateau)
  - [ ] Fiche expérience avec hôtel (`Experience2`, panneau de réservation, `LeadGuestForm`)
  - [ ] Paiement et confirmation (`StandaloneCheckout`, `Checkout`, `BookingConfirmationDialog`,
        pages de confirmation), fenêtre de connexion (`AuthPromptDialog`)
  - [ ] Catégories, liste des expériences, recherche, vitrine bateaux (`/boat`)
  - [ ] Journal, À propos, Contact, Carte cadeau, formulaire sur-mesure (`TailorMadeDialog`)
  - [ ] Pages légales (conditions, confidentialité) : traduction relue, pas automatique
  - [ ] Anciennes clés de `translations.ts` encore utilisées (`missingUiKeys("ru")` doit ne
        renvoyer que des clés plus utilisées par le site)
- [ ] **Villes et régions traduites** : elles s'affichent dans la langue de la page (Иерусалим,
      Jerusalén, Totes Meer...), sans casser les filtres ni le regroupement des lieux par région.
      Aujourd'hui elles restent volontairement en anglais (voir `NEVER_OVERLAID_FIELDS` dans
      `src/lib/contentTranslations/overlay.ts`).
- [ ] **Zéro titre resté en anglais** : la requête ci-dessous ne renvoie que des noms propres
      (hôtels, partenaires, moods, STAYMAKOM, villes au nom identique).

```sql
select locale, entity_type, field, left(text, 80) as texte
from content_translations
where encode(sha256(convert_to(text, 'UTF8')), 'hex') = source_hash
  and entity_type in ('experience2', 'standalone_experience', 'journal_post', 'category')
  and field in ('title', 'title_en', 'subtitle', 'og_title_en', 'seo_title_en')
order by entity_type, texte, locale;
```

- [ ] **Relecture** : une fiche de chaque type relue par un lecteur natif dans chaque langue.
- [ ] **Demande test** depuis une page `?lang=ru` : dans le back-office, la demande affiche le
      nom anglais de l'expérience et le badge « RU ».

Après l'allumage : redéployer le site (le plan du site se régénère à la construction), puis
soumettre le plan du site dans Google Search Console.
