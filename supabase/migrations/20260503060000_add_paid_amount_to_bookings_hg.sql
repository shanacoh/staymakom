-- Ajout du montant réellement débité au client via Revolut.
-- sell_price stocke le prix renvoyé par HyperGuest (la chambre seule, hors extras et
-- commissions StayMakom), ce qui peut différer significativement du montant que le
-- client a vraiment payé sur sa carte. Ex : sell_price = 564 ILS, mais le client a
-- payé 714 ILS parce qu'on a ajouté des extras et commissions par-dessus.
--
-- paid_amount stocke ce que Revolut a vraiment débité, après application de la
-- gift card. C'est cette valeur qu'on doit afficher sur la page de confirmation et
-- dans l'espace client — c'est ce que le client voit sur son relevé bancaire.

ALTER TABLE public.bookings_hg
  ADD COLUMN IF NOT EXISTS paid_amount numeric NULL;

COMMENT ON COLUMN public.bookings_hg.paid_amount IS 'Montant réellement débité au client via Revolut (incluant extras et commissions, après application gift card). Source de vérité pour l''affichage client. Différent de sell_price (qui est le prix HyperGuest de la chambre seule, pour la compta avec HG).';
