-- Seed : avis clients pour 11 des 16 expériences publiées
-- 5 étoiles, profils diversifiés, 1 à 5 avis par expérience
-- Laissées sans avis : Peindre & trinquer Kinneret, Pique-nique Lake House,
--   Jérusalem vue du ciel, Cuisines du monde Tel Aviv, Shabbat Inbal

INSERT INTO public.experience2_reviews (experience_id, user_name, rating, comment, created_at, is_visible) VALUES

-- -------------------------------------------------------
-- 1. Rituel spa en duo, Setai Tel Aviv (3 avis)
-- -------------------------------------------------------
(
  'ab5ecfa8-4efc-4d12-84ef-741d0e50429a',
  'Sophie M.',
  5,
  'Un moment hors du temps. La prise en charge a été parfaite du début à la fin — le Setai est vraiment à la hauteur de sa réputation. On repart détendus et ressourcés.',
  '2026-04-12 14:30:00+00'
),
(
  'ab5ecfa8-4efc-4d12-84ef-741d0e50429a',
  'Julien & Clara',
  5,
  'Cadeau d''anniversaire de mariage qu''on a adoré. Le rituel est somptueux, le personnel est aux petits soins. Un incontournable pour les couples.',
  '2026-04-28 11:15:00+00'
),
(
  'ab5ecfa8-4efc-4d12-84ef-741d0e50429a',
  'Isabelle R.',
  5,
  'J''ai offert cette expérience à mon mari pour ses 40 ans. Il était sous le charme. L''hôtel est magnifique et les soins sont d''une qualité exceptionnelle.',
  '2026-05-19 09:45:00+00'
),

-- -------------------------------------------------------
-- 2. Concert aux Chandelles, Tel Aviv (2 avis)
-- -------------------------------------------------------
(
  '9e38ad07-2c06-4076-95e2-791b705e4daf',
  'Nicolas B.',
  5,
  'Une soirée féerique ! La musique classique sous les bougies dans cette belle salle… Le genre de soirée dont on se souvient longtemps.',
  '2026-04-05 21:00:00+00'
),
(
  '9e38ad07-2c06-4076-95e2-791b705e4daf',
  'Martine & Philippe',
  5,
  'Nous avons adoré cette découverte. L''ambiance est unique, la qualité musicale au rendez-vous. Bravo pour la sélection des artistes !',
  '2026-05-03 20:30:00+00'
),

-- -------------------------------------------------------
-- 3. Rituel de la Boue Noire, Mer Morte (4 avis)
-- -------------------------------------------------------
(
  '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3',
  'Émilie T.',
  5,
  'Mon corps a chanté pendant deux jours après ! L''expérience à la Mer Morte est vraiment unique au monde. La boue noire, le flottement dans l''eau… inoubliable.',
  '2026-03-22 16:00:00+00'
),
(
  '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3',
  'Rémi & Louise',
  5,
  'Une expérience hors du commun. Nous avons adoré le côté bien-être et le dépaysement total. À refaire absolument !',
  '2026-04-14 10:00:00+00'
),
(
  '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3',
  'Catherine D.',
  5,
  'Parfait pour se déconnecter complètement. Le cadre est impressionnant, le soin bien guidé. On se sent vraiment régénéré après.',
  '2026-05-02 13:20:00+00'
),
(
  '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3',
  'Thomas G.',
  5,
  'Je n''aurais jamais pensé aller à la Mer Morte sans ce programme. Quelle belle découverte ! Le rituel de la boue est spectaculaire et vraiment efficace.',
  '2026-05-25 11:30:00+00'
),

-- -------------------------------------------------------
-- 4. Saveurs du Japon, Ink Hotel Tel Aviv (3 avis)
-- -------------------------------------------------------
(
  'a85a731f-72c0-4c93-a79a-205bd35a3e2d',
  'Amélie & Pierre',
  5,
  'Un dîner d''exception. La cuisine japonaise au cœur de Tel Aviv, c''est une belle surprise. Le chef est talentueux et le cadre de l''Ink Hotel est superbe.',
  '2026-04-08 20:00:00+00'
),
(
  'a85a731f-72c0-4c93-a79a-205bd35a3e2d',
  'François L.',
  5,
  'Amateur de gastronomie japonaise, cette expérience a largement dépassé mes attentes. Fraîcheur des produits, finesse des saveurs… Un vrai régal.',
  '2026-04-30 19:45:00+00'
),
(
  'a85a731f-72c0-4c93-a79a-205bd35a3e2d',
  'Nathalie K.',
  5,
  'Soirée magnifique ! L''accord mets-ambiance est parfait. On se croirait transporté au Japon tout en restant dans une ville vibrante. Coup de cœur absolu.',
  '2026-05-21 20:15:00+00'
),

-- -------------------------------------------------------
-- 5. Nuit cinéma à Poli House, Tel Aviv (1 avis)
-- -------------------------------------------------------
(
  '30c455f0-1ec7-45de-a135-ea3007c32a99',
  'Jean-Michel & Valérie',
  5,
  'Une soirée originale et romantique. Le film en plein air, le décor du Poli House, les petites attentions… Tout était parfait. À recommander pour une sortie en amoureux.',
  '2026-05-10 23:00:00+00'
),

-- -------------------------------------------------------
-- 6. Dîner à l'heure dorée, Vieille Jaffa (5 avis)
-- -------------------------------------------------------
(
  'c4edb482-18f4-4cc8-b667-a4d977afad3c',
  'Alexandra P.',
  5,
  'Le dîner le plus romantique de ma vie ! Les lumières dorées de Jaffa au coucher du soleil, la cuisine méditerranéenne… Un tableau vivant. On s''est fiancés ce soir-là.',
  '2026-03-15 21:30:00+00'
),
(
  'c4edb482-18f4-4cc8-b667-a4d977afad3c',
  'David & Sandrine',
  5,
  'Expérience gastronomique au sommet. La Vieille Jaffa offre un cadre incomparable et le dîner était à la hauteur. Service impeccable, ambiance magique.',
  '2026-03-29 20:00:00+00'
),
(
  'c4edb482-18f4-4cc8-b667-a4d977afad3c',
  'Marine V.',
  5,
  'J''ai offert cette sortie à mes parents pour leur anniversaire de mariage. Ils ont été complètement subjugués. Un grand merci pour ce beau moment de partage.',
  '2026-04-18 19:45:00+00'
),
(
  'c4edb482-18f4-4cc8-b667-a4d977afad3c',
  'Bertrand S.',
  5,
  'Le coucher de soleil sur la mer depuis Jaffa, le verre de vin à la main… On ne pouvait pas rêver mieux. La gastronomie est excellente et le service aux petits soins.',
  '2026-05-07 21:00:00+00'
),
(
  'c4edb482-18f4-4cc8-b667-a4d977afad3c',
  'Claire & Antoine',
  5,
  'Notre soirée coup de cœur pendant notre séjour en Israël. La magie de Jaffa opère à 100% à cette heure dorée. Une adresse à ne surtout pas manquer.',
  '2026-05-27 20:30:00+00'
),

-- -------------------------------------------------------
-- 7. Aventure en famille à Eilat (2 avis)
-- -------------------------------------------------------
(
  '15defb1c-5eb2-4047-946f-cb8d7a24ed7a',
  'La famille Fontaine',
  5,
  'Vacances parfaites avec nos deux enfants (8 et 11 ans) ! Ils ont adoré chaque minute. L''équipe est fantastique avec les enfants. Un souvenir impérissable.',
  '2026-04-22 17:00:00+00'
),
(
  '15defb1c-5eb2-4047-946f-cb8d7a24ed7a',
  'Camille R.',
  5,
  'En famille avec mes beaux-parents, on a tous passé un moment extraordinaire. Eilat offre un décor incroyable et l''organisation était sans faille du début à la fin.',
  '2026-05-15 16:30:00+00'
),

-- -------------------------------------------------------
-- 8. Ressourcement en forêt, Bayit BaGalil (3 avis)
-- -------------------------------------------------------
(
  '0a9e9054-8efb-440a-a222-215ccef7760f',
  'Laurence M.',
  5,
  'Une parenthèse de sérénité absolue. La forêt de Galilée est magnifique et le Bayit BaGalil est un vrai havre de paix. Je repars complètement rechargée.',
  '2026-04-03 12:00:00+00'
),
(
  '0a9e9054-8efb-440a-a222-215ccef7760f',
  'Marc & Élodie',
  5,
  'Week-end ressourçant comme on n''en fait pas souvent. Le contact avec la nature, le calme, les activités proposées… Tout est pensé pour déconnecter vraiment.',
  '2026-05-01 11:00:00+00'
),
(
  '0a9e9054-8efb-440a-a222-215ccef7760f',
  'Véronique D.',
  5,
  'J''avais besoin de vraiment couper. Cette expérience a été exactement ce qu''il me fallait. La nature galliléenne est apaisante et le cadre très bien aménagé.',
  '2026-05-23 10:30:00+00'
),

-- -------------------------------------------------------
-- 9. Dégustation whisky et chocolat, Setai Tel Aviv (2 avis)
-- -------------------------------------------------------
(
  'f19e4042-efda-4248-a810-72c459eab75c',
  'Paul N.',
  5,
  'En amateur de whisky, j''ai été impressionné par la sélection et les accords avec le chocolat. Un duo inattendu et pourtant divin. Le cadre luxueux du Setai en bonus.',
  '2026-04-25 19:00:00+00'
),
(
  'f19e4042-efda-4248-a810-72c459eab75c',
  'Stéphanie & Gilles',
  5,
  'Soirée originale et très instructive. On a appris plein de choses sur les whiskies tout en se régalant. L''hôte est passionné et ça se ressent. On a adoré.',
  '2026-05-18 20:00:00+00'
),

-- -------------------------------------------------------
-- 10. Circuit en jeep, Parc de Timna (1 avis)
-- -------------------------------------------------------
(
  'c42e0083-1ed4-40d0-90df-1dac74f2b9a1',
  'Olivier C.',
  5,
  'Un circuit époustouflant dans le désert de Timna. Les formations rocheuses sont à couper le souffle. Le guide était passionné et connaissait le parc sur le bout des doigts.',
  '2026-05-11 14:00:00+00'
),

-- -------------------------------------------------------
-- 11. Jeep au coucher du soleil, Mont Yoash, Eilat (4 avis)
-- -------------------------------------------------------
(
  'e883f2bf-b234-4505-bdde-783a88dd3c74',
  'Benjamin L.',
  5,
  'Le coucher de soleil depuis le Mont Yoash en jeep… des images qui restent gravées. L''accès en 4x4 ajoute vraiment à l''aventure. Parfait de bout en bout.',
  '2026-04-17 19:30:00+00'
),
(
  'e883f2bf-b234-4505-bdde-783a88dd3c74',
  'Patricia & Yves',
  5,
  'Expérience inoubliable ! La vue depuis le sommet est à couper le souffle et l''aventure en jeep est palpitante. Un must absolu à Eilat.',
  '2026-04-29 20:00:00+00'
),
(
  'e883f2bf-b234-4505-bdde-783a88dd3c74',
  'Sylvie T.',
  5,
  'Je n''aurais jamais osé faire ça seule, et pourtant c''est l''une des meilleures décisions de mon voyage. Le panorama sur Eilat et la mer Rouge est quelque chose d''unique.',
  '2026-05-13 19:45:00+00'
),
(
  'e883f2bf-b234-4505-bdde-783a88dd3c74',
  'Hugo M.',
  5,
  'Mes deux fils (15 et 17 ans) ont adoré l''aventure en jeep. La vue panoramique sur Eilat et la mer Rouge au coucher du soleil est une expérience qui ne s''oublie pas. Merci !',
  '2026-05-28 20:15:00+00'
);
