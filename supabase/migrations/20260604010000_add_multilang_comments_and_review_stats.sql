-- Ajouter colonnes multilingues aux avis d'expériences
-- comment = version française (existante)
-- comment_en = version anglaise
-- comment_he = version hébraïque (optionnelle, laissée NULL pour l'instant)

ALTER TABLE public.experience2_reviews
  ADD COLUMN IF NOT EXISTS comment_en text,
  ADD COLUMN IF NOT EXISTS comment_he text;

-- Traductions anglaises des 28 avis existants
-- Rituel spa en duo, Setai Tel Aviv
UPDATE public.experience2_reviews SET comment_en = 'A moment outside of time. Everything was perfect from start to finish, the Setai truly lives up to its reputation. We left relaxed and recharged.' WHERE user_name = 'Sophie M.' AND experience_id = 'ab5ecfa8-4efc-4d12-84ef-741d0e50429a';
UPDATE public.experience2_reviews SET comment_en = 'A wonderful anniversary gift we absolutely loved. The ritual is sumptuous and the staff is incredibly attentive. A must for couples.' WHERE user_name = 'Julien & Clara' AND experience_id = 'ab5ecfa8-4efc-4d12-84ef-741d0e50429a';
UPDATE public.experience2_reviews SET comment_en = 'I gifted this experience to my husband for his 40th birthday. He was completely charmed. The hotel is magnificent and the treatments are exceptionally high quality.' WHERE user_name = 'Isabelle R.' AND experience_id = 'ab5ecfa8-4efc-4d12-84ef-741d0e50429a';

-- Concert aux Chandelles, Tel Aviv
UPDATE public.experience2_reviews SET comment_en = 'A magical evening! Classical music by candlelight in that beautiful venue... The kind of night you remember for a long time.' WHERE user_name = 'Nicolas B.' AND experience_id = '9e38ad07-2c06-4076-95e2-791b705e4daf';
UPDATE public.experience2_reviews SET comment_en = 'We loved discovering this. The atmosphere is one of a kind and the musical quality was excellent. Bravo for the artist selection!' WHERE user_name = 'Martine & Philippe' AND experience_id = '9e38ad07-2c06-4076-95e2-791b705e4daf';

-- Rituel de la Boue Noire, Mer Morte
UPDATE public.experience2_reviews SET comment_en = 'My body felt amazing for two days after! The Dead Sea experience is truly one of a kind. The black mud, floating in the water... unforgettable.' WHERE user_name = 'Émilie T.' AND experience_id = '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3';
UPDATE public.experience2_reviews SET comment_en = 'An extraordinary experience. We loved the wellness aspect and the complete change of scenery. Absolutely worth repeating!' WHERE user_name = 'Rémi & Louise' AND experience_id = '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3';
UPDATE public.experience2_reviews SET comment_en = 'Perfect for truly disconnecting. The setting is impressive and the treatment is well guided. You feel genuinely renewed afterwards.' WHERE user_name = 'Catherine D.' AND experience_id = '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3';
UPDATE public.experience2_reviews SET comment_en = 'I never would have thought to visit the Dead Sea without this program. What a wonderful discovery! The mud ritual is spectacular and genuinely effective.' WHERE user_name = 'Thomas G.' AND experience_id = '17473fea-ac2a-4727-9a5e-bcf4e8bf96b3';

-- Saveurs du Japon, Ink Hotel Tel Aviv
UPDATE public.experience2_reviews SET comment_en = 'An exceptional dinner. Japanese cuisine in the heart of Tel Aviv is a lovely surprise. The chef is talented and the Ink Hotel setting is gorgeous.' WHERE user_name = 'Amélie & Pierre' AND experience_id = 'a85a731f-72c0-4c93-a79a-205bd35a3e2d';
UPDATE public.experience2_reviews SET comment_en = 'As a Japanese food enthusiast, this experience far exceeded my expectations. Fresh ingredients, refined flavors... an absolute treat.' WHERE user_name = 'François L.' AND experience_id = 'a85a731f-72c0-4c93-a79a-205bd35a3e2d';
UPDATE public.experience2_reviews SET comment_en = 'Stunning evening! The food-ambiance pairing is perfect. You feel truly transported to Japan while staying in a vibrant city. Total highlight.' WHERE user_name = 'Nathalie K.' AND experience_id = 'a85a731f-72c0-4c93-a79a-205bd35a3e2d';

-- Nuit cinéma à Poli House
UPDATE public.experience2_reviews SET comment_en = 'An original and romantic evening. The outdoor film, the Poli House setting, the little touches... everything was perfect. Highly recommended for a date night.' WHERE user_name = 'Jean-Michel & Valérie' AND experience_id = '30c455f0-1ec7-45de-a135-ea3007c32a99';

-- Dîner à l'heure dorée, Vieille Jaffa
UPDATE public.experience2_reviews SET comment_en = 'The most romantic dinner of my life! The golden light of Jaffa at sunset, the Mediterranean cuisine... a living painting. We got engaged that evening.' WHERE user_name = 'Alexandra P.' AND experience_id = 'c4edb482-18f4-4cc8-b667-a4d977afad3c';
UPDATE public.experience2_reviews SET comment_en = 'A top-tier gastronomic experience. Old Jaffa offers an incomparable setting and the dinner matched it perfectly. Impeccable service, magical atmosphere.' WHERE user_name = 'David & Sandrine' AND experience_id = 'c4edb482-18f4-4cc8-b667-a4d977afad3c';
UPDATE public.experience2_reviews SET comment_en = 'I gave this outing to my parents for their wedding anniversary. They were completely blown away. Thank you so much for this beautiful shared moment.' WHERE user_name = 'Marine V.' AND experience_id = 'c4edb482-18f4-4cc8-b667-a4d977afad3c';
UPDATE public.experience2_reviews SET comment_en = 'Watching the sunset over the sea from Jaffa, wine in hand... you could not dream of anything better. Excellent food and attentive service throughout.' WHERE user_name = 'Bertrand S.' AND experience_id = 'c4edb482-18f4-4cc8-b667-a4d977afad3c';
UPDATE public.experience2_reviews SET comment_en = 'Our favorite evening during our stay in Israel. The magic of Jaffa is in full effect at golden hour. An address you absolutely must not miss.' WHERE user_name = 'Claire & Antoine' AND experience_id = 'c4edb482-18f4-4cc8-b667-a4d977afad3c';

-- Aventure en famille à Eilat
UPDATE public.experience2_reviews SET comment_en = 'Perfect vacation with our two kids (8 and 11)! They loved every single minute. The team is fantastic with children. A memory we will never forget.' WHERE user_name = 'La famille Fontaine' AND experience_id = '15defb1c-5eb2-4047-946f-cb8d7a24ed7a';
UPDATE public.experience2_reviews SET comment_en = 'Together with my in-laws, we all had an extraordinary time. Eilat offers an incredible backdrop and the organization was seamless from start to finish.' WHERE user_name = 'Camille R.' AND experience_id = '15defb1c-5eb2-4047-946f-cb8d7a24ed7a';

-- Ressourcement en forêt, Bayit BaGalil
UPDATE public.experience2_reviews SET comment_en = 'An absolute haven of serenity. The Galilee forest is stunning and Bayit BaGalil is a true sanctuary. I left feeling completely recharged.' WHERE user_name = 'Laurence M.' AND experience_id = '0a9e9054-8efb-440a-a222-215ccef7760f';
UPDATE public.experience2_reviews SET comment_en = 'A restorative weekend unlike any we have had in a long time. Nature, calm, the activities on offer... everything is designed to truly disconnect.' WHERE user_name = 'Marc & Élodie' AND experience_id = '0a9e9054-8efb-440a-a222-215ccef7760f';
UPDATE public.experience2_reviews SET comment_en = 'I really needed to switch off. This experience was exactly what I needed. The Galilean landscape is soothing and the venue is very well set up.' WHERE user_name = 'Véronique D.' AND experience_id = '0a9e9054-8efb-440a-a222-215ccef7760f';

-- Dégustation whisky et chocolat
UPDATE public.experience2_reviews SET comment_en = 'As a whisky lover, I was impressed by the selection and the chocolate pairings. An unexpected but divine combination. The Setai setting is a bonus.' WHERE user_name = 'Paul N.' AND experience_id = 'f19e4042-efda-4248-a810-72c459eab75c';
UPDATE public.experience2_reviews SET comment_en = 'An original and very educational evening. We learned so much about whiskies while enjoying every bite. Our host is passionate and it shows. We loved it.' WHERE user_name = 'Stéphanie & Gilles' AND experience_id = 'f19e4042-efda-4248-a810-72c459eab75c';

-- Circuit en jeep, Parc de Timna
UPDATE public.experience2_reviews SET comment_en = 'A breathtaking tour through the Timna desert. The rock formations are stunning. Our guide was passionate and knew the park inside out.' WHERE user_name = 'Olivier C.' AND experience_id = 'c42e0083-1ed4-40d0-90df-1dac74f2b9a1';

-- Jeep au coucher du soleil, Mont Yoash
UPDATE public.experience2_reviews SET comment_en = 'Watching the sunset from Mount Yoash in a jeep... images that stay with you. The 4x4 access truly adds to the adventure. Perfect from start to finish.' WHERE user_name = 'Benjamin L.' AND experience_id = 'e883f2bf-b234-4505-bdde-783a88dd3c74';
UPDATE public.experience2_reviews SET comment_en = 'An unforgettable experience! The view from the summit is breathtaking and the jeep adventure is thrilling. An absolute must in Eilat.' WHERE user_name = 'Patricia & Yves' AND experience_id = 'e883f2bf-b234-4505-bdde-783a88dd3c74';
