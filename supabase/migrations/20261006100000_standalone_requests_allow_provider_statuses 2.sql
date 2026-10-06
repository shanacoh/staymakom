-- Les boutons « Envoyer au prestataire » et « Dispo OK » du back-office écrivent les
-- statuts 'sent_to_provider' et 'availability_confirmed', que la règle d'origine refusait.
-- On remplace la règle dans une seule transaction pour ne jamais laisser la table sans contrôle.
begin;
alter table public.standalone_experience_requests
  drop constraint standalone_experience_requests_status_check;
alter table public.standalone_experience_requests
  add constraint standalone_experience_requests_status_check
  check (status in ('new', 'sent_to_provider', 'availability_confirmed', 'contacted', 'converted', 'closed'));
commit;
