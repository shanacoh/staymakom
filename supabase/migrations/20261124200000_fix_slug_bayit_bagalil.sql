-- Audit IA du 24/11/2026 : l'adresse de la fiche hôtel Setai Bayit Bagalil contenait une
-- coquille (« ...herbert-samuelnn »). On corrige l'identifiant d'adresse (slug).
-- L'ancienne adresse reste valable : vercel.json la redirige définitivement (301/308)
-- vers la nouvelle, pour les visiteurs comme pour Google.
-- À appliquer au moment de la mise en ligne (en même temps que la redirection).
update public.hotels2
set slug = 'bayit-bagalil-boutique-hotel-by-herbert-samuel',
    updated_at = now()
where slug = 'bayit-bagalil-boutique-hotel-by-herbert-samuelnn'
  and not exists (
    select 1 from public.hotels2 where slug = 'bayit-bagalil-boutique-hotel-by-herbert-samuel'
  );
