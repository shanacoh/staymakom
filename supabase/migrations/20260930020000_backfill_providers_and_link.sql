-- Reprend les prestataires déjà présents dans les données (texte libre, à 3 endroits)
-- pour créer leur fiche dans la nouvelle table providers, puis relie ces 3 endroits
-- à la fiche via un provider_id. Les anciens champs texte ne sont PAS supprimés :
-- ils restent en lecture pour comparaison, jusqu'au nettoyage final validé par Shana.

-- 1) Une fiche par prestataire distinct trouvé dans les données existantes.
insert into public.providers (name, whatsapp, internal_notes, policy_validated)
values
  ('BALAGUNA', '+972543051127', null, false),
  ('MARK', '+972505331837', null, false),
  ('SIMONA', null, null, false),
  ('YAM SAILING', null, null, false),
  ('B.OZ', null, 'Lien produit récupéré de l''ancien champ contact : https://www.b-oz.co.il/product/%D7%94%D7%A4%D7%9C%D7%92%D7%94-%D7%91%D7%99%D7%90%D7%9B%D7%98%D7%AA-%D7%A7%D7%98%D7%9E%D7%A8%D7%9F-%D7%A2%D7%93-14-%D7%90%D7%99%D7%A9-%D7%AA%D7%9C-%D7%90%D7%91%D7%99%D7%91/', false)
on conflict do nothing;

-- 2) Colonnes de lien (nullable, ne cassent rien), sur les 3 endroits identifiés.
alter table public.standalone_experience_suppliers add column if not exists provider_id uuid references public.providers(id);
alter table public.standalone_experiences add column if not exists provider_id uuid references public.providers(id);
alter table public.standalone_bookings add column if not exists provider_id uuid references public.providers(id);

-- 3) Rattachement automatique par correspondance de nom (insensible à la casse/espaces).
update public.standalone_experience_suppliers s
set provider_id = p.id
from public.providers p
where s.provider_id is null
  and upper(trim(s.supplier_name)) = upper(trim(p.name));

update public.standalone_experiences e
set provider_id = p.id
from public.providers p
where e.provider_id is null
  and e.supplier_name is not null
  and upper(trim(e.supplier_name)) = upper(trim(p.name));

update public.standalone_bookings b
set provider_id = p.id
from public.providers p
where b.provider_id is null
  and b.supplier_name is not null
  and upper(trim(b.supplier_name)) = upper(trim(p.name));
