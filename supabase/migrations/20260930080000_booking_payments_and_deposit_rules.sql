-- Paiements multiples par réservation (acompte, solde, "chacun sa part") et
-- règle d'acompte configurable par expérience. Une réservation peut accumuler
-- plusieurs paiements Revolut distincts ; elle est "soldée" quand la somme des
-- paiements réussis atteint le prix de vente. N'affecte aucune réservation
-- existante : nouvelle table vide + nouvelles colonnes avec valeur par défaut.

create table if not exists public.standalone_booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.standalone_bookings(id) on delete cascade,
  kind text not null default 'deposit',
  amount numeric(10,2) not null,
  currency text not null default 'ILS',
  revolut_order_id text,
  checkout_url text,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.standalone_booking_payments is 'Un paiement Revolut par ligne (acompte, solde, part d''un groupe). La réservation est soldée quand la somme des paiements status=paid atteint sell_price.';
comment on column public.standalone_booking_payments.kind is 'deposit | balance | partial';
comment on column public.standalone_booking_payments.status is 'pending | paid | failed | cancelled';

create index if not exists idx_standalone_booking_payments_booking_id on public.standalone_booking_payments(booking_id);
create index if not exists idx_standalone_booking_payments_revolut_order_id on public.standalone_booking_payments(revolut_order_id);

alter table public.standalone_booking_payments enable row level security;

create policy "booking_payments_admin_all"
  on public.standalone_booking_payments for all
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

-- Règle d'acompte, réglable par expérience (aucun/fixe/pourcentage). Les bateaux
-- passent à 500₪ fixe ci-dessous ; les autres expériences restent à "aucun"
-- (comportement actuel inchangé) jusqu'à ce que Shana règle une règle spécifique.
alter table public.standalone_experiences add column if not exists deposit_type text not null default 'none';
alter table public.standalone_experiences add column if not exists deposit_amount numeric(10,2);

comment on column public.standalone_experiences.deposit_type is 'none | fixed | percentage';
comment on column public.standalone_experiences.deposit_amount is 'Montant fixe (₪) si deposit_type=fixed, ou pourcentage (0-100) si deposit_type=percentage.';

update public.standalone_experiences
set deposit_type = 'fixed', deposit_amount = 500
where category_id = '06434e23-29f4-4c6b-ba63-b61e68879520';

-- Suivi des délais de traitement d'une demande (alerte si pas envoyée au
-- prestataire après 15 min, ou pas de réponse après 1h).
alter table public.standalone_experience_requests add column if not exists sent_to_provider_at timestamptz;
alter table public.standalone_experience_requests add column if not exists provider_responded_at timestamptz;
