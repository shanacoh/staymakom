-- Prépare la grille d'édition rapide (vue tableur) des réservations standalone :
-- on ajoute le nom du fournisseur (texte libre pour l'instant, deviendra une FK
-- vers une table suppliers dédiée plus tard) et le statut de paiement au
-- fournisseur, distinct du paiement du client (payment_status).
alter table standalone_bookings
  add column if not exists supplier_name text,
  add column if not exists supplier_payment_status text not null default 'pending';

comment on column standalone_bookings.supplier_name is 'Nom du fournisseur (texte libre pour l''instant, deviendra une FK vers une table suppliers dédiée plus tard)';
comment on column standalone_bookings.supplier_payment_status is 'Statut du paiement au fournisseur, distinct de payment_status qui suit le paiement du client (pending / paid)';
