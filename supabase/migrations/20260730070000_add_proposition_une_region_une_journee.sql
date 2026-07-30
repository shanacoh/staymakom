-- Ajoute une 4e proposition "excursion à la journée" au dossier "NAS DAILY" (swipe) : une journée
-- guidée sur-mesure, région au choix du client. Même chapitre que les 3 précédentes ("ESCAPE TEL
-- AVIV 🚗", id 8dd76082-9295-40c3-ac44-d85e411f4465), même logique (voir migration 20260730060000).

WITH ins AS (
  INSERT INTO public.propositions (
    titre, titre_en, titre_he,
    description, description_en, description_he,
    categorie_id, region, tags,
    mode_reservation, statut
  ) VALUES (
    'UNE RÉGION, UNE JOURNÉE', 'ONE REGION, ONE DAY', 'אזור אחד, יום אחד',
    'Une journée guidée dans la région de votre choix. Galilée pour les cascades et les vignes, Jérusalem pour la vieille ville et les marchés, Tel Aviv pour Jaffa et l''architecture Bauhaus, le Néguev pour le cratère et la randonnée.',
    'A guided day in the region of your choice. Galilee for waterfalls and vineyards, Jerusalem for the old city and markets, Tel Aviv for Jaffa and Bauhaus architecture, the Negev for the crater and hiking.',
    'יום מודרך באזור שתבחרו. הגליל למפלים ולכרמים, ירושלים לעיר העתיקה ולשווקים, תל אביב ליפו ולאדריכלות הבאוהאוס, הנגב למכתש ולטיולים רגליים.',
    '8dd76082-9295-40c3-ac44-d85e411f4465', 'Galilée / Jérusalem / Tel Aviv / Néguev (à préciser selon le choix)',
    ARRAY['région', 'découverte', 'guide', 'sur-mesure'],
    'demande_necessaire', 'actif'
  )
  RETURNING id
)
INSERT INTO public.dossier_propositions (dossier_id, proposition_id, ordre)
SELECT '3d3d2d3b-ff6f-4319-a3fa-352c0e1672ad', id, 18 FROM ins;
