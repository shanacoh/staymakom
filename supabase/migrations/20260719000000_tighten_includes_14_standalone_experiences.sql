-- Resserre l'ensemble des 54 items "ce qui est inclus" à une longueur sûre
-- (les mots longs enchaînés empêchaient un bon retour à la ligne même sous 50
-- caractères), pour qu'ils tiennent sur 2 lignes sans coupure sur la carte.

-- 1. Surf à Tel Aviv
UPDATE public.standalone_experience_includes SET title = $t$Private lesson, certified instructor$t$ WHERE id = '9164bb39-6b00-430d-9b28-201e1e8a56d2';
UPDATE public.standalone_experience_includes SET title = $t$Private showers at Beach Club TLV$t$, title_fr = $t$Douches privées au Beach Club TLV$t$, title_he = $t$מקלחות פרטיות בביץ' קלאב TLV$t$ WHERE id = 'fa3ddb55-9d8d-419c-a526-c5fad1bb7bbb';

-- 2. Bateau à fond de verre, Eilat
UPDATE public.standalone_experience_includes SET title_fr = $t$Croisière de 2h en bateau à fond de verre$t$ WHERE id = '675cbc56-5467-4a6d-861d-2e2da20274c6';
UPDATE public.standalone_experience_includes SET title = $t$Underwater deck, two meters down$t$, title_fr = $t$Pont sous-marin, deux mètres sous l'eau$t$, title_he = $t$סיפון תת-ימי, שני מטרים מתחת למים$t$ WHERE id = 'b1b9eeaf-2e69-41da-8cf4-04315907f324';
UPDATE public.standalone_experience_includes SET title = $t$Shaded seats, sun deck, snack bar$t$, title_fr = $t$Places ombragées, pont et bar à bord$t$, title_he = $t$ישיבה מוצלת, סיפון ובר על הסירה$t$ WHERE id = 'a0fd68af-4504-40be-9ed3-0c7762302b7e';

-- 3. Plongée Dolphin Reef, Eilat
UPDATE public.standalone_experience_includes SET title = $t$Full scuba gear included$t$, title_he = $t$ציוד צלילה מלא כלול$t$ WHERE id = 'a834200c-6c05-4ae1-901c-794ce50c0fab';
UPDATE public.standalone_experience_includes SET title = $t$Briefing on land before the dive$t$, title_fr = $t$Briefing à terre avant la plongée$t$, title_he = $t$תדריך ביבשה לפני הצלילה$t$ WHERE id = '26596992-7864-48fa-96f1-ad551cd285be';

-- 4. Snorkeling avec dauphins, Eilat
UPDATE public.standalone_experience_includes SET title = $t$Small-group snorkeling with a guide$t$, title_fr = $t$Snorkeling en petit groupe avec guide$t$ WHERE id = '80c3a2f1-e8f7-43b7-a604-27828ea85e25';
UPDATE public.standalone_experience_includes SET title = $t$Mask, snorkel, fins, wetsuit included$t$, title_fr = $t$Masque, tuba, palmes, combinaison inclus$t$ WHERE id = 'b906cdeb-4512-4366-bcef-98af1cce1a55';
UPDATE public.standalone_experience_includes SET title = $t$Swim with dolphins, fish and coral$t$, title_fr = $t$Nager avec dauphins, poissons, coraux$t$, title_he = $t$לשחות עם דולפינים, דגים ואלמוגים$t$ WHERE id = '31aa24bf-1b27-4e6c-8d08-e75e7737b398';
UPDATE public.standalone_experience_includes SET title = $t$Briefing on land before the water$t$, title_fr = $t$Briefing à terre avant l'eau$t$, title_he = $t$תדריך ביבשה לפני המים$t$ WHERE id = '915c70cd-f733-47ef-8d49-295fefd33acc';

-- 5. Vélo anti jet-lag, Tel Aviv
UPDATE public.standalone_experience_includes SET title = $t$Private 3-hour tour, up to 4 people$t$, title_fr = $t$Tour privé de 3h, jusqu'à 4 personnes$t$ WHERE id = 'a8a2d61c-feb0-4dd4-a91b-2b0482134145';
UPDATE public.standalone_experience_includes SET title = $t$Three routes: seafront, park, Jaffa$t$, title_fr = $t$Trois parcours : mer, parc, Jaffa$t$, title_he = $t$שלושה מסלולים: טיילת, פארק, יפו$t$ WHERE id = '6645597e-7d53-4ad1-8381-92a0c87cf665';

-- 6. Tel Aviv à vélo
UPDATE public.standalone_experience_includes SET title = $t$Guided 3-hour tour, frequent stops$t$, title_fr = $t$Tour guidé de 3h, arrêts fréquents$t$ WHERE id = '4532e83c-1fa2-470e-b2a6-1e2a15f04c31';
UPDATE public.standalone_experience_includes SET title = $t$Tachana, Neve Tzedek, Rothschild Blvd$t$, title_fr = $t$Tachana, Neve Tzedek, Rothschild$t$, title_he = $t$תחנה, נווה צדק ושדרות רוטשילד$t$ WHERE id = '30f90e80-ce98-4076-b709-2b09004a04ae';

-- 7. Chocolat dans le noir, Jaffa
UPDATE public.standalone_experience_includes SET title = $t$90-minute tasting in complete darkness$t$, title_fr = $t$Dégustation de 90 min dans le noir$t$, title_he = $t$טעימה של 90 דקות בחושך מוחלט$t$ WHERE id = 'ba43a8c6-fe85-425e-b432-f8e6495b7445';
UPDATE public.standalone_experience_includes SET title = $t$Led by a chocolatier and blind guides$t$, title_fr = $t$Chocolatier et guides malvoyants$t$ WHERE id = 'dc65821f-0131-44d2-9e47-86524e4f6f92';
UPDATE public.standalone_experience_includes SET title = $t$Exotic pralines and spiced truffles$t$, title_fr = $t$Pralines exotiques et truffes épicées$t$, title_he = $t$פרלינים אקזוטיים וטראפלס מתובלים$t$ WHERE id = '5725cd86-64e8-475f-8d60-206676039956';
UPDATE public.standalone_experience_includes SET title = $t$Conversation with instructors after$t$ WHERE id = 'b60d0044-343b-4a4c-932d-90de634e164e';

-- 8. Dîner dans le noir, Jaffa
UPDATE public.standalone_experience_includes SET title = $t$Three-course meal in total darkness$t$, title_fr = $t$Repas en trois services dans le noir$t$, title_he = $t$ארוחה בשלושה מנות בחושך מוחלט$t$ WHERE id = 'd76363c4-13e3-400d-b56e-87f3134657b8';
UPDATE public.standalone_experience_includes SET title = $t$Blind waiter throughout the meal$t$, title_fr = $t$Serveur aveugle pendant tout le repas$t$, title_he = $t$מלצר עיוור לאורך כל הארוחה$t$ WHERE id = 'de3813d3-5e1b-4950-8f13-b876070f8beb';
UPDATE public.standalone_experience_includes SET title = $t$Fish, vegetarian or surprise menu$t$, title_fr = $t$Menu poisson, végétarien ou surprise$t$, title_he = $t$תפריט דג, צמחוני או הפתעה$t$ WHERE id = '046c03d5-a5e7-41c1-9e01-364e04905046';
UPDATE public.standalone_experience_includes SET title = $t$Secure locker for phones and lights$t$, title_fr = $t$Casier sécurisé pour objets lumineux$t$, title_he = $t$לוקר מאובטח לטלפונים ופריטים מאירים$t$ WHERE id = 'aa024e03-0951-400b-bfee-739529e00b97';

-- 9. Vélo et vin, collines de Judée
UPDATE public.standalone_experience_includes SET title = $t$Four-hour guided ride with a local guide$t$, title_fr = $t$Randonnée de 4h avec un guide local$t$, title_he = $t$סיור אופניים של 4 שעות עם מדריך מקומי$t$ WHERE id = '158e09b0-63e3-40c5-a034-d9dff4502ef8';
UPDATE public.standalone_experience_includes SET title = $t$Bar Kochba-era burial caves$t$, title_fr = $t$Grottes de l'époque de Bar Kochba$t$, title_he = $t$מערות קבורה מתקופת בר כוכבא$t$ WHERE id = 'a009e6a3-1bde-40f4-9ce6-9f199f9a0c03';
UPDATE public.standalone_experience_includes SET title_fr = $t$Dégustation de vin locale$t$, title_he = $t$טעימת יין ביקב מקומי$t$ WHERE id = 'd6c2ca4b-3b5d-4744-81ec-4f52b3ab35ff';

-- 10. Jérusalem de nuit à vélo
UPDATE public.standalone_experience_includes SET title = $t$Holy Sepulcher and Mount Zion$t$, title_fr = $t$Saint-Sépulcre et Mont Sion$t$, title_he = $t$כנסיית הקבר והר ציון$t$ WHERE id = '35ee6c19-1c22-4a6e-b8b6-e5e44869740c';
UPDATE public.standalone_experience_includes SET title = $t$Stories and history along the way$t$, title_fr = $t$Récits et histoire en chemin$t$, title_he = $t$סיפורים והיסטוריה לאורך הדרך$t$ WHERE id = 'ddaa6dc2-c7ed-45fe-89ee-cbbb77359ff3';
UPDATE public.standalone_experience_includes SET title = $t$No cycling expertise needed$t$, title_fr = $t$Aucune expertise requise$t$, title_he = $t$לא נדרשת מומחיות ברכיבה$t$ WHERE id = '0e8c04f9-e558-4ffa-9544-4d6f5534d100';

-- 11. Cours de cuisine, Citrus & Salt, Tel Aviv
UPDATE public.standalone_experience_includes SET title = $t$3-hour class with a professional chef$t$, title_fr = $t$Atelier de 3h avec un chef pro$t$ WHERE id = '2e2915a1-1763-40d0-9c20-2fe3b14be5cb';
UPDATE public.standalone_experience_includes SET title = $t$One cuisine per session$t$, title_fr = $t$Une cuisine au choix par session$t$ WHERE id = 'ad974771-ae21-4830-82f7-0ce5f82775b5';
UPDATE public.standalone_experience_includes SET title = $t$Shared meal with what you cooked$t$, title_fr = $t$Repas partagé avec ce que vous avez cuisiné$t$, title_he = $t$ארוחה משותפת עם מה שבישלתם$t$ WHERE id = 'c69234f8-ce47-4e45-aa9d-16412a6d51a0';

-- 12. Poterie, JClay, Jérusalem
UPDATE public.standalone_experience_includes SET title = $t$A piece of pottery for each family$t$, title_fr = $t$Une pièce de céramique par famille$t$ WHERE id = 'fcf829a5-a6d3-464c-8e5f-32b487687d68';
UPDATE public.standalone_experience_includes SET title_fr = $t$Pinceaux, émaux et prise en main rapide$t$ WHERE id = 'beb97b24-b6ce-4767-b33a-855c0cea6179';
UPDATE public.standalone_experience_includes SET title_fr = $t$Deux heures sans contrainte de temps$t$ WHERE id = 'da4b90c6-e77c-451e-add9-15899335ca53';

-- 13. Dîner Imersion, Tel Aviv
UPDATE public.standalone_experience_includes SET title_fr = $t$Prise en charge en minibus$t$ WHERE id = '5792acef-25ee-4f3b-b096-7d2d75b47791';
UPDATE public.standalone_experience_includes SET title = $t$Seven-course menu with 360° projections$t$ WHERE id = '83d33776-be8d-44c5-99fc-2fb18bbce9f7';

-- 14. Time Elevator, Jérusalem
UPDATE public.standalone_experience_includes SET title_fr = $t$Sièges dynamiques et écrans 360°$t$, title_he = $t$כיסאות תנועה ומסכי 360 מעלות$t$ WHERE id = 'a442c50a-5583-4a82-a1bf-39325967ab9c';
UPDATE public.standalone_experience_includes SET title = $t$3,000 years of Jerusalem history$t$, title_fr = $t$3000 ans d'histoire de Jérusalem$t$ WHERE id = '98d52b05-01c3-4759-bff1-98a80551baf0';
UPDATE public.standalone_experience_includes SET title = $t$Inside Mamilla Mall, near Old City$t$, title_fr = $t$Dans Mamilla, près de la vieille ville$t$ WHERE id = '3ec3eb9e-00f1-4f91-a34f-dd4996034c99';
