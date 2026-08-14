-- Corrige le prix de vente public de l'expérience standalone "Drink & Paint" (Tel Aviv).
-- Shana avait saisi 185 dans le champ "Tarif fournisseur" (coût) par erreur,
-- pensant modifier le prix de vente. Ici Staymakom est le fournisseur direct
-- (marge 0, déjà à markup_percent = 0), donc le prix de vente doit être égal
-- au tarif fournisseur : 185.
UPDATE standalone_experiences
SET base_price = 185.00
WHERE id = 'c7ade269-2499-4db2-afdc-15a40fa56dd6';
