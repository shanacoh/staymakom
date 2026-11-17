# Avant d'allumer l'interrupteur ES / RU / DE

L'interrupteur est `autoLocalesPublic` dans `src/config/languages.json`. Le passer à `true`
active en une fois : le sélecteur de langue, les balises hreflang, le plan du site et
l'indexation Google des pages en espagnol, russe et allemand.

Ne l'allumer que lorsque **toutes** les cases sont cochées :

- [ ] **Boutons et menus traduits** : tous les textes d'interface des pages publiques (accueil,
      fiches, catégories, recherche, Journal, panneau de réservation, paiement, confirmation)
      existent en ES / RU / DE dans `src/lib/translations.ts`. Aucun bouton en anglais sur une
      page `?lang=ru`.
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
