-- Fiche prestataire : contact du jour J « identique au contact principal » et bloc « Paiement prestataire ».
--
-- 1. `day_contact_same_as_main` : coché par défaut. Les prestataires qui ont déjà un contact du jour J
--    à eux sont décochés, pour que rien ne change pour eux.
--    Quand un contact du jour J est saisi (par l'équipe ou par le prestataire dans son espace),
--    la case se décoche toute seule : ce qui vient d'être saisi n'est jamais ignoré.
-- 2. Paiement prestataire : mode de paiement habituel et, pour un virement, les coordonnées bancaires.
--    Infos internes : la table `providers` n'est lisible que par les admins, et les fonctions
--    `partner_*` de l'espace partenaire ne renvoient pas ces colonnes.
-- La raison sociale et le numéro fiscal (`legal_name`, `tax_id`) restent en base, intacts :
-- ils sont seulement retirés de l'écran.

alter table public.providers
  add column day_contact_same_as_main boolean not null default true,
  add column payment_method text
    check (payment_method in ('card_on_site', 'bank_transfer', 'bit_paybox', 'cash_on_site')),
  add column bank_account_holder text,
  add column bank_name text,
  add column bank_account_number text;

update public.providers
set day_contact_same_as_main = false
where nullif(btrim(day_contact_name), '') is not null
   or nullif(btrim(day_contact_whatsapp), '') is not null;

create function public.providers_day_contact_unset_same()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (nullif(btrim(new.day_contact_name), '') is not null
        and new.day_contact_name is distinct from old.day_contact_name)
     or (nullif(btrim(new.day_contact_whatsapp), '') is not null
        and new.day_contact_whatsapp is distinct from old.day_contact_whatsapp) then
    new.day_contact_same_as_main := false;
  end if;
  return new;
end;
$$;

create trigger providers_day_contact_unset_same
  before update of day_contact_name, day_contact_whatsapp on public.providers
  for each row execute function public.providers_day_contact_unset_same();
