-- Calculette de prix d'une expérience : on retient le mode choisi par Shana
-- (« Marge % » ou « Achat + vente ») pour rouvrir la fiche exactement comme elle l'a remplie.
-- Vide = « Marge % » (comportement d'avant pour toutes les fiches existantes).
alter table public.standalone_experience_internal
  add column if not exists price_mode text;

alter table public.standalone_experience_internal
  drop constraint if exists standalone_experience_internal_price_mode_check;

alter table public.standalone_experience_internal
  add constraint standalone_experience_internal_price_mode_check
    check (price_mode is null or price_mode in ('markup', 'price'));
