-- La liste des paiements non aboutis expose le nom de l'expérience en anglais et en hébreu,
-- pour que le message de relance WhatsApp cite le bon nom selon la langue choisie.
-- Hébreu absent : on retombe sur l'anglais. Deux colonnes ajoutées en fin de vue, rien d'autre ne change.
create or replace view public.admin_unfinished_payments
with (security_invoker = true) as
with attempts as (
  select
    lower(b.customer_email) as customer_email,
    b.standalone_experience_id as experience_id,
    (array_agg(b.customer_name order by b.created_at desc))[1] as client,
    (array_agg(b.customer_phone order by b.created_at desc) filter (where b.customer_phone is not null))[1] as customer_phone,
    array_remove(array_agg(distinct b.customer_phone), null) as phones,
    max(b.custom_experience_title) as custom_title,
    count(*)::int as attempts,
    max(b.sell_price)::numeric as amount,
    max(coalesce(b.currency, 'ILS')) as currency,
    max(b.booking_date) as service_date,
    min(b.created_at) as first_attempt_at,
    max(b.created_at) as last_attempt_at,
    case when bool_or(b.payment_status = 'failed') then 'failed' else 'unfinished' end as kind
  from public.standalone_bookings b
  where b.status = 'pending'
    and (b.payment_status = 'failed' or b.created_at < now() - interval '24 hours')
  group by lower(b.customer_email), b.standalone_experience_id
)
select
  a.customer_email,
  a.experience_id,
  a.client,
  a.customer_phone,
  coalesce(e.title_fr, e.title, a.custom_title, 'Expérience') as product,
  a.attempts,
  a.amount,
  a.currency,
  a.service_date,
  a.last_attempt_at,
  a.kind,
  exists (
    select 1
    from public.standalone_bookings c
    where c.status = 'confirmed'
      and not coalesce(c.is_cancelled, false)
      and c.created_at >= a.first_attempt_at
      and (lower(c.customer_email) = a.customer_email or c.customer_phone = any (a.phones))
  ) as converted,
  coalesce(nullif(e.title, ''), a.custom_title, nullif(e.title_fr, ''), 'Experience') as product_en,
  coalesce(nullif(e.title_he, ''), nullif(e.title, ''), a.custom_title, nullif(e.title_fr, ''), 'Experience') as product_he
from attempts a
left join public.standalone_experiences e on e.id = a.experience_id;
