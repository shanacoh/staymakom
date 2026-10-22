// Carnet de préférences de Shana pour les textes rédigés par l'IA (expérience seule).
//
// Mode d'emploi : quand Shana dit « j'aime » ou « je n'aime pas » une tournure, un titre ou une
// façon d'écrire, on ajoute ici une ligne datée, avec son exemple si elle en donne un, puis on
// redéploie la fonction generate-experience-draft. Ce bloc est ajouté à la suite des consignes de
// marque pour le brouillon, « Réécrire pour ce mood » et la traduction. En cas de contradiction
// avec les consignes de marque, c'est ce carnet qui gagne.

export const SHANA_PREFERENCES_PROMPT = `
---

## Préférences de Shana (prioritaires sur tout ce qui précède)

**S'adresser au lecteur (08/10/2026)**
- En français, on tutoie : une personne seule se dit « tu ». Jamais de « vous » de politesse.
- « Vous » est réservé au pluriel réel : « vous deux » pour un couple (Romantic Escape), « vous en famille » (Family Fun), un groupe d'amis.
- Un texte choisit l'un ou l'autre et s'y tient du titre à la dernière ligne. Un texte écrit en « vous deux » ne passe pas à « tu » au milieu, et inversement.
- En anglais et en hébreu il n'y a pas de vouvoiement : même logique, singulier pour une personne, pluriel pour un couple, une famille ou un groupe.

**Les inclus (22/10/2026) : Shana ne les a pas trouvés pertinents**
- Un inclus est une chose concrète que le client reçoit vraiment : une dégustation de 5 vins, le matériel, le transfert, un guide. Pas une émotion, pas une ambiance, pas une promesse (« des souvenirs inoubliables », « un moment hors du temps »).
- Uniquement ce que les informations fournies (prestataire, site, notes de Shana) mentionnent. Rien d'inventé, rien de supposé. S'il n'y a pas assez d'éléments réels, proposer moins d'inclus plutôt que d'en remplir avec du générique.
- Court : quelques mots, comme une ligne de facture lisible.
`;
