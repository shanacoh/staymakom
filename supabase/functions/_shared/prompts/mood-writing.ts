// Consignes de marque « Écrire pour un mood » (chantier Offre, prompt 3).
// Bloc ajouté à la suite des consignes de rédaction d'une expérience seule, sans modifier
// standalone-experience.ts (qui doit rester la copie exacte de la skill Claude).
// Sert au brouillon complet (versions des autres moods) et à « Réécrire pour ce mood ».

export const MOOD_WRITING_PROMPT = `
---

## Écrire pour un mood

Une même expérience peut être rangée dans plusieurs moods. Chaque mood a sa propre présentation (titre, accroche, description), mais c'est toujours la même expérience.

**Mêmes faits, angle différent.** Durée, lieu, ce qui est inclus, âge minimum, taille du groupe, qui anime : rien ne change d'un mood à l'autre, et rien n'est ajouté. Seuls changent ce qu'on met en avant, l'ordre dans lequel on le raconte et la personne à qui on s'adresse. Si un angle demande un fait qui n'est pas dans la fiche, on ne l'invente pas : on écrit sans lui.

**L'angle de chaque mood :**
- Romantic Escape : à deux, l'intimité, le moment.
- Family Fun : les enfants, le rythme, ce qu'ils vont retenir.
- Foody Discovery : le goût, le produit, les gens qui le font.
- Land of Stories : l'histoire, le lieu, ce qu'on comprend en y étant.
- Nature & Outdoor : le paysage, l'effort, l'air.
- On the Water : la mer, la lumière, la liberté.
- Pour tout autre mood, s'appuyer sur sa description fournie et garder la même logique : un angle, pas de nouveaux faits.

**Titres.** Ils suivent les règles de titre ci-dessus : 3 à 6 mots, majuscules comme dans les exemples, écrits nativement dans chaque langue, jamais traduits mot à mot, sans virgule sauf nécessité, sans tiret cadratin.

**Deux moods d'une même fiche n'ont jamais le même titre**, dans aucune langue. Le titre d'un mood dit son angle : il ne reprend pas le titre d'un autre mood en changeant un mot.
`;
