-- Corrige la migration précédente (20260717000000) : les items "ce qui est inclus"
-- doivent rester des phrases courtes et précises (quelques mots), pas des paragraphes.

-- 1. Surf à Tel Aviv
UPDATE public.standalone_experience_includes SET title = $t$Private one-on-one surf lesson with a certified instructor$t$, title_fr = $t$Cours de surf privé avec moniteur certifié$t$, title_he = $t$שיעור גלישה פרטי עם מדריך מוסמך$t$ WHERE id = '9164bb39-6b00-430d-9b28-201e1e8a56d2';
UPDATE public.standalone_experience_includes SET title = $t$Surfboard and wetsuit included$t$, title_fr = $t$Planche et combinaison incluses$t$, title_he = $t$לוח גלישה וחליפה כלולים$t$ WHERE id = 'babb9a22-9e70-4a89-a2be-796d3743c810';
UPDATE public.standalone_experience_includes SET title = $t$Private showers and changing rooms at Beach Club TLV$t$, title_fr = $t$Douches et vestiaires privés au Beach Club TLV$t$, title_he = $t$מקלחות ומלתחות פרטיות בביץ' קלאב TLV$t$ WHERE id = 'fa3ddb55-9d8d-419c-a526-c5fad1bb7bbb';
UPDATE public.standalone_experience_includes SET title = $t$About one hour in the water$t$, title_fr = $t$Environ une heure dans l'eau$t$, title_he = $t$כשעה אחת במים$t$ WHERE id = '0fe9dabc-1e1b-4f26-9026-c4e987dabc6b';

-- 2. Bateau à fond de verre, Eilat
UPDATE public.standalone_experience_includes SET title = $t$Two-hour glass-bottom boat tour$t$, title_fr = $t$Excursion de deux heures en bateau à fond de verre$t$, title_he = $t$שייט של שעתיים בסירת זכוכית$t$ WHERE id = '675cbc56-5467-4a6d-861d-2e2da20274c6';
UPDATE public.standalone_experience_includes SET title = $t$Underwater viewing deck, two meters below the surface$t$, title_fr = $t$Pont d'observation sous-marin, deux mètres sous l'eau$t$, title_he = $t$סיפון תצפית תת-ימי, שני מטרים מתחת למים$t$ WHERE id = 'b1b9eeaf-2e69-41da-8cf4-04315907f324';
UPDATE public.standalone_experience_includes SET title = $t$Live commentary from the captain$t$, title_fr = $t$Commentaires en direct du capitaine$t$, title_he = $t$הסברים חיים מהקברניט$t$ WHERE id = 'c2b3dace-4a43-457e-bf1f-0c9f9f1fc962';
UPDATE public.standalone_experience_includes SET title = $t$Shaded seating, sun deck, and snack bar on board$t$, title_fr = $t$Places ombragées, pont ensoleillé et bar à bord$t$, title_he = $t$ישיבה מוצלת, סיפון שמש ובר על הסירה$t$ WHERE id = 'a0fd68af-4504-40be-9ed3-0c7762302b7e';

-- 3. Plongée Dolphin Reef, Eilat
UPDATE public.standalone_experience_includes SET title = $t$One-on-one dive instructor$t$, title_fr = $t$Moniteur de plongée personnel$t$, title_he = $t$מדריך צלילה אישי$t$ WHERE id = '148b4aba-11c6-49f9-818a-fde5bbad0825';
UPDATE public.standalone_experience_includes SET title = $t$Full scuba gear, wetsuit and fins included$t$, title_fr = $t$Équipement de plongée complet, combinaison et palmes inclus$t$, title_he = $t$ציוד צלילה מלא, חליפה וסנפירים כלולים$t$ WHERE id = 'a834200c-6c05-4ae1-901c-794ce50c0fab';
UPDATE public.standalone_experience_includes SET title = $t$Dive to six meters in the open reef$t$, title_fr = $t$Plongée à six mètres dans le récif ouvert$t$, title_he = $t$צלילה לעומק שישה מטרים בשונית הפתוחה$t$ WHERE id = '7be29628-2331-439b-9d32-cd2cbb49733b';
UPDATE public.standalone_experience_includes SET title = $t$On-land briefing before entering the water$t$, title_fr = $t$Briefing à terre avant l'entrée dans l'eau$t$, title_he = $t$תדריך ביבשה לפני הכניסה למים$t$ WHERE id = '26596992-7864-48fa-96f1-ad551cd285be';

-- 4. Snorkeling avec dauphins, Eilat
UPDATE public.standalone_experience_includes SET title = $t$Small-group snorkeling with a personal guide$t$, title_fr = $t$Snorkeling en petit groupe avec guide dédié$t$, title_he = $t$שנורקלינג בקבוצה קטנה עם מדריך צמוד$t$ WHERE id = '80c3a2f1-e8f7-43b7-a604-27828ea85e25';
UPDATE public.standalone_experience_includes SET title = $t$Mask, snorkel, fins and wetsuit included$t$, title_fr = $t$Masque, tuba, palmes et combinaison inclus$t$, title_he = $t$מסכה, שנורקל, סנפירים וחליפה כלולים$t$ WHERE id = 'b906cdeb-4512-4366-bcef-98af1cce1a55';
UPDATE public.standalone_experience_includes SET title = $t$Swim to open water to observe dolphins, fish and coral$t$, title_fr = $t$Sortie en eau libre pour observer dauphins, poissons et coraux$t$, title_he = $t$שחייה למים פתוחים לצפייה בדולפינים, דגים ואלמוגים$t$ WHERE id = '31aa24bf-1b27-4e6c-8d08-e75e7737b398';
UPDATE public.standalone_experience_includes SET title = $t$On-land briefing before entering the water$t$, title_fr = $t$Briefing à terre avant l'entrée dans l'eau$t$, title_he = $t$תדריך ביבשה לפני הכניסה למים$t$ WHERE id = '915c70cd-f733-47ef-8d49-295fefd33acc';

-- 5. Vélo anti jet-lag, Tel Aviv
UPDATE public.standalone_experience_includes SET title = $t$Private 3-hour bike tour, up to 4 people$t$, title_fr = $t$Tour privé à vélo de 3 heures, jusqu'à 4 personnes$t$, title_he = $t$סיור אופניים פרטי של 3 שעות, עד 4 אנשים$t$ WHERE id = 'a8a2d61c-feb0-4dd4-a91b-2b0482134145';
UPDATE public.standalone_experience_includes SET title = $t$Bike and helmet provided$t$, title_fr = $t$Vélo et casque fournis$t$, title_he = $t$אופניים וקסדה כלולים$t$ WHERE id = '40491a54-d53e-4c91-b414-7ed7ea7d7d87';
UPDATE public.standalone_experience_includes SET title = $t$Three routes: seafront, HaYarkon Park and Old Jaffa$t$, title_fr = $t$Trois itinéraires : front de mer, parc HaYarkon et vieille Jaffa$t$, title_he = $t$שלושה מסלולים: טיילת החוף, פארק הירקון ויפו העתיקה$t$ WHERE id = '6645597e-7d53-4ad1-8381-92a0c87cf665';
UPDATE public.standalone_experience_includes SET title = $t$Optional coffee stop along the way$t$, title_fr = $t$Arrêt café optionnel en chemin$t$, title_he = $t$עצירת קפה אופציונלית בדרך$t$ WHERE id = 'c23161aa-2105-4ee3-9226-2b65cc849629';

-- 6. Tel Aviv à vélo
UPDATE public.standalone_experience_includes SET title = $t$Guided 3-hour bike tour with frequent stops$t$, title_fr = $t$Tour guidé de 3 heures avec arrêts fréquents$t$, title_he = $t$סיור מודרך של 3 שעות עם עצירות תכופות$t$ WHERE id = '4532e83c-1fa2-470e-b2a6-1e2a15f04c31';
UPDATE public.standalone_experience_includes SET title = $t$Bike rental and insurance included$t$, title_fr = $t$Location de vélo et assurance incluses$t$, title_he = $t$השכרת אופניים וביטוח כלולים$t$ WHERE id = '5ceeeb4b-d002-432d-8ae8-55399a3dd1dd';
UPDATE public.standalone_experience_includes SET title = $t$Route through Tachana, Neve Tzedek, Rothschild Blvd and Rabin Square$t$, title_fr = $t$Parcours entre Tachana, Neve Tzedek, boulevard Rothschild et place Rabin$t$, title_he = $t$מסלול דרך תחנה, נווה צדק, שדרות רוטשילד וכיכר רבין$t$ WHERE id = '30f90e80-ce98-4076-b709-2b09004a04ae';
UPDATE public.standalone_experience_includes SET title = $t$Photographer accompanying the ride$t$, title_fr = $t$Photographe accompagnant la balade$t$, title_he = $t$צלם מלווה את הסיור$t$ WHERE id = '1b8f7a13-127f-40a5-a17d-c3035ce8484a';

-- 7. Chocolat dans le noir, Jaffa
UPDATE public.standalone_experience_includes SET title = $t$90-minute chocolate tasting in complete darkness$t$, title_fr = $t$Dégustation de chocolat de 90 minutes dans le noir complet$t$, title_he = $t$טעימת שוקולד של 90 דקות בחושך מוחלט$t$ WHERE id = 'ba43a8c6-fe85-425e-b432-f8e6495b7445';
UPDATE public.standalone_experience_includes SET title = $t$Led by a chocolatier and blind or visually impaired guides$t$, title_fr = $t$Animée par un chocolatier et des guides aveugles ou malvoyants$t$, title_he = $t$בהובלת שוקולטייר ומדריכים עיוורים או לקויי ראייה$t$ WHERE id = 'dc65821f-0131-44d2-9e47-86524e4f6f92';
UPDATE public.standalone_experience_includes SET title = $t$Exotic pralines, spiced truffles and more$t$, title_fr = $t$Pralines exotiques, truffes épicées et plus$t$, title_he = $t$פרלינים אקזוטיים, טראפלס מתובלים ועוד$t$ WHERE id = '5725cd86-64e8-475f-8d60-206676039956';
UPDATE public.standalone_experience_includes SET title = $t$Conversation with the instructors after the workshop$t$, title_fr = $t$Échange avec les instructeurs après l'atelier$t$, title_he = $t$שיחה עם המדריכים בתום הסדנה$t$ WHERE id = 'b60d0044-343b-4a4c-932d-90de634e164e';

-- 8. Dîner dans le noir, Jaffa
UPDATE public.standalone_experience_includes SET title = $t$Three-course kosher-dairy meal in total darkness$t$, title_fr = $t$Repas casher-lacté en trois services dans le noir total$t$, title_he = $t$ארוחה כשרה-חלבית בשלושה מנות בחושך מוחלט$t$ WHERE id = 'd76363c4-13e3-400d-b56e-87f3134657b8';
UPDATE public.standalone_experience_includes SET title = $t$Blind or visually impaired waiter throughout the meal$t$, title_fr = $t$Serveur aveugle ou malvoyant pendant tout le repas$t$, title_he = $t$מלצר עיוור או לקוי ראייה לאורך כל הארוחה$t$ WHERE id = 'de3813d3-5e1b-4950-8f13-b876070f8beb';
UPDATE public.standalone_experience_includes SET title = $t$Choice of fish, vegetarian or surprise menu$t$, title_fr = $t$Choix entre menu poisson, végétarien ou surprise$t$, title_he = $t$בחירה בין תפריט דג, צמחוני או הפתעה$t$ WHERE id = '046c03d5-a5e7-41c1-9e01-364e04905046';
UPDATE public.standalone_experience_includes SET title = $t$Secure locker for phones and light-emitting items$t$, title_fr = $t$Casier sécurisé pour téléphones et objets lumineux$t$, title_he = $t$לוקר מאובטח לטלפונים ולפריטים מאירים$t$ WHERE id = 'aa024e03-0951-400b-bfee-739529e00b97';

-- 9. Vélo et vin, collines de Judée
UPDATE public.standalone_experience_includes SET title = $t$Four-hour guided bike tour with a local guide$t$, title_fr = $t$Randonnée guidée de 4 heures avec un guide local$t$, title_he = $t$סיור אופניים מודרך של 4 שעות עם מדריך מקומי$t$ WHERE id = '158e09b0-63e3-40c5-a034-d9dff4502ef8';
UPDATE public.standalone_experience_includes SET title = $t$All-terrain bike and helmet included$t$, title_fr = $t$Vélo tout-terrain et casque inclus$t$, title_he = $t$אופני שטח וקסדה כלולים$t$ WHERE id = '92383b14-d781-4447-8cb3-2a86887c089f';
UPDATE public.standalone_experience_includes SET title = $t$Visit to ancient burial caves and a Bar Kochba-era columbarium$t$, title_fr = $t$Visite de grottes funéraires antiques et d'un columbarium de l'époque de Bar Kochba$t$, title_he = $t$ביקור במערות קבורה עתיקות ובקולומבריום מתקופת בר כוכבא$t$ WHERE id = 'a009e6a3-1bde-40f4-9ce6-9f199f9a0c03';
UPDATE public.standalone_experience_includes SET title = $t$Wine tasting at a local winery$t$, title_fr = $t$Dégustation de vin dans un domaine local$t$, title_he = $t$טעימת יין ביקב מקומי$t$ WHERE id = 'd6c2ca4b-3b5d-4744-81ec-4f52b3ab35ff';

-- 10. Jérusalem de nuit à vélo
UPDATE public.standalone_experience_includes SET title = $t$Guided night bike ride, Old and New Jerusalem$t$, title_fr = $t$Balade guidée de nuit entre Vieille Ville et Jérusalem moderne$t$, title_he = $t$רכיבה מודרכת בלילה בין העיר העתיקה לירושלים החדשה$t$ WHERE id = 'e2804f4f-4401-43b9-8553-a8a1d8050800';
UPDATE public.standalone_experience_includes SET title = $t$Stops at the Holy Sepulcher, Christian and Jewish Quarters, Mount Zion$t$, title_fr = $t$Arrêts au Saint-Sépulcre, quartiers chrétien et juif, Mont Sion$t$, title_he = $t$עצירות בכנסיית הקבר, ברובעים הנוצרי והיהודי ובהר ציון$t$ WHERE id = '35ee6c19-1c22-4a6e-b8b6-e5e44869740c';
UPDATE public.standalone_experience_includes SET title = $t$Storytelling and historical commentary throughout$t$, title_fr = $t$Récits et commentaires historiques tout au long$t$, title_he = $t$סיפורים והסברים היסטוריים לאורך כל הרכיבה$t$ WHERE id = 'ddaa6dc2-c7ed-45fe-89ee-cbbb77359ff3';
UPDATE public.standalone_experience_includes SET title = $t$Suitable for anyone comfortable on a bike$t$, title_fr = $t$Accessible à toute personne à l'aise à vélo$t$, title_he = $t$מתאים לכל מי שנוח לו לרכוב על אופניים$t$ WHERE id = '0e8c04f9-e558-4ffa-9544-4d6f5534d100';

-- 11. Cours de cuisine, Citrus & Salt, Tel Aviv
UPDATE public.standalone_experience_includes SET title = $t$3-hour hands-on class with a professional chef$t$, title_fr = $t$Atelier de 3 heures avec un chef professionnel$t$, title_he = $t$סדנה בת 3 שעות בהובלת שף מקצועי$t$ WHERE id = '2e2915a1-1763-40d0-9c20-2fe3b14be5cb';
UPDATE public.standalone_experience_includes SET title = $t$All ingredients and equipment provided$t$, title_fr = $t$Tous les ingrédients et le matériel fournis$t$, title_he = $t$כל המצרכים והציוד כלולים$t$ WHERE id = '1ce0ba0b-ff76-434c-9149-2ff47e5e4344';
UPDATE public.standalone_experience_includes SET title = $t$One cuisine per session: Israeli, Thai, Italian, Indian and more$t$, title_fr = $t$Une cuisine par session : israélienne, thaïlandaise, italienne, indienne et plus$t$, title_he = $t$מטבח אחד בכל מפגש: ישראלי, תאילנדי, איטלקי, הודי ועוד$t$ WHERE id = 'ad974771-ae21-4830-82f7-0ce5f82775b5';
UPDATE public.standalone_experience_includes SET title = $t$Shared meal at the end with what the group cooked$t$, title_fr = $t$Repas partagé à la fin avec ce que le groupe a cuisiné$t$, title_he = $t$ארוחה משותפת בסוף עם מה שהקבוצה בישלה$t$ WHERE id = 'c69234f8-ce47-4e45-aa9d-16412a6d51a0';

-- 12. Poterie, JClay, Jérusalem
UPDATE public.standalone_experience_includes SET title = $t$A piece of pottery for each family member$t$, title_fr = $t$Une pièce de céramique par membre de la famille$t$, title_he = $t$כלי קרמיקה לכל בן משפחה$t$ WHERE id = 'fcf829a5-a6d3-464c-8e5f-32b487687d68';
UPDATE public.standalone_experience_includes SET title = $t$Brushes, glazes and a quick how-to$t$, title_fr = $t$Pinceaux, émaux et une prise en main rapide$t$, title_he = $t$מברשות, זיגוגים והדרכה קצרה$t$ WHERE id = 'beb97b24-b6ce-4767-b33a-855c0cea6179';
UPDATE public.standalone_experience_includes SET title = $t$Two unhurried hours in the studio$t$, title_fr = $t$Deux heures sans contrainte de temps dans l'atelier$t$, title_he = $t$שעתיים ללא לחץ זמן בסטודיו$t$ WHERE id = 'da4b90c6-e77c-451e-add9-15899335ca53';

-- 13. Dîner Imersion, Tel Aviv
UPDATE public.standalone_experience_includes SET title = $t$Secret address revealed the day before$t$, title_fr = $t$Adresse secrète dévoilée la veille$t$, title_he = $t$כתובת סודית שנחשפת יום לפני$t$ WHERE id = '5e8fdc7c-c282-4f8f-85b2-9b2856e059b7';
UPDATE public.standalone_experience_includes SET title = $t$Shuttle pickup to the hidden venue$t$, title_fr = $t$Prise en charge en minibus jusqu'au lieu caché$t$, title_he = $t$איסוף במיניבס עד למקום הנסתר$t$ WHERE id = '5792acef-25ee-4f3b-b096-7d2d75b47791';
UPDATE public.standalone_experience_includes SET title = $t$Welcome cocktail chosen in advance$t$, title_fr = $t$Cocktail de bienvenue choisi en amont$t$, title_he = $t$קוקטייל קבלת פנים שנבחר מראש$t$ WHERE id = 'd88ddd9f-ef6b-43c4-8c19-5b7b4ff7c4fe';
UPDATE public.standalone_experience_includes SET title = $t$Seven-course kosher tasting menu with 360° projection mapping$t$, title_fr = $t$Menu dégustation casher en sept services avec projections à 360°$t$, title_he = $t$תפריט טעימות כשר בן שבע מנות עם הקרנת מיפוי 360 מעלות$t$ WHERE id = '83d33776-be8d-44c5-99fc-2fb18bbce9f7';

-- 14. Time Elevator, Jérusalem
UPDATE public.standalone_experience_includes SET title = $t$Motion-seat theatre with 360° screens$t$, title_fr = $t$Salle à sièges dynamiques avec écrans à 360°$t$, title_he = $t$אולם כיסאות תנועה עם מסכי 360 מעלות$t$ WHERE id = 'a442c50a-5583-4a82-a1bf-39325967ab9c';
UPDATE public.standalone_experience_includes SET title = $t$Guided journey through 3,000 years of Jerusalem history$t$, title_fr = $t$Parcours guidé à travers 3000 ans d'histoire de Jérusalem$t$, title_he = $t$מסע מודרך בן שלושת אלפים שנות היסטוריה של ירושלים$t$ WHERE id = '98d52b05-01c3-4759-bff1-98a80551baf0';
UPDATE public.standalone_experience_includes SET title = $t$Access included inside Mamilla Mall, steps from the Old City$t$, title_fr = $t$Accès inclus depuis le centre commercial Mamilla, à deux pas de la vieille ville$t$, title_he = $t$כניסה כלולה מתוך קניון ממילא, במרחק דקות מהעיר העתיקה$t$ WHERE id = '3ec3eb9e-00f1-4f91-a34f-dd4996034c99';
