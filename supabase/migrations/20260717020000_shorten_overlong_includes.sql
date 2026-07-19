-- Raccourcit les items "ce qui est inclus" qui dépassaient ~55 caractères
-- et débordaient donc de la carte à 2 lignes (une fois le bug d'affichage
-- de WhatsIncludedPhotos2.tsx corrigé, ces textes-là restaient trop longs).

UPDATE public.standalone_experience_includes SET title = $t$Stops at Holy Sepulcher, Jewish Quarter, Mount Zion$t$, title_fr = $t$Arrêts au Saint-Sépulcre, quartier juif, Mont Sion$t$, title_he = $t$עצירות בכנסיית הקבר, ברובע היהודי ובהר ציון$t$ WHERE id = '35ee6c19-1c22-4a6e-b8b6-e5e44869740c';

UPDATE public.standalone_experience_includes SET title = $t$Route via Tachana, Neve Tzedek and Rothschild Blvd$t$, title_fr = $t$Parcours via Tachana, Neve Tzedek et Rothschild$t$, title_he = $t$מסלול דרך תחנה, נווה צדק ושדרות רוטשילד$t$ WHERE id = '30f90e80-ce98-4076-b709-2b09004a04ae';

UPDATE public.standalone_experience_includes SET title = $t$Choose a cuisine: Israeli, Thai, Italian, more$t$, title_fr = $t$Une cuisine par session : israélienne, thaï, plus$t$, title_he = $t$מטבח אחד לבחירה בכל מפגש$t$ WHERE id = 'ad974771-ae21-4830-82f7-0ce5f82775b5';

UPDATE public.standalone_experience_includes SET title = $t$Ancient burial caves from the Bar Kochba revolt$t$, title_fr = $t$Grottes funéraires de l'époque de Bar Kochba$t$, title_he = $t$מערות קבורה מתקופת מרד בר כוכבא$t$ WHERE id = 'a009e6a3-1bde-40f4-9ce6-9f199f9a0c03';

UPDATE public.standalone_experience_includes SET title = $t$Seven-course kosher menu with 360° projections$t$, title_fr = $t$Menu casher 7 services, projections 360°$t$, title_he = $t$תפריט כשר בן שבע מנות עם הקרנות 360°$t$ WHERE id = '83d33776-be8d-44c5-99fc-2fb18bbce9f7';

UPDATE public.standalone_experience_includes SET title = $t$Inside Mamilla Mall, steps from the Old City$t$, title_fr = $t$Dans le centre Mamilla, près de la vieille ville$t$, title_he = $t$בתוך קניון ממילא, קרוב לעיר העתיקה$t$ WHERE id = '3ec3eb9e-00f1-4f91-a34f-dd4996034c99';

UPDATE public.standalone_experience_includes SET title = $t$Private lesson with a certified surf instructor$t$ WHERE id = '9164bb39-6b00-430d-9b28-201e1e8a56d2';

UPDATE public.standalone_experience_includes SET title = $t$Guided by a chocolatier and blind guides$t$, title_fr = $t$Guidé par un chocolatier et des guides malvoyants$t$, title_he = $t$בהובלת שוקולטייר ומדריכים עיוורים$t$ WHERE id = 'dc65821f-0131-44d2-9e47-86524e4f6f92';

UPDATE public.standalone_experience_includes SET title = $t$A journey through 3,000 years of Jerusalem$t$, title_fr = $t$Voyage à travers 3000 ans d'histoire de Jérusalem$t$, title_he = $t$מסע בן שלושת אלפים שנות היסטוריה$t$ WHERE id = '98d52b05-01c3-4759-bff1-98a80551baf0';

UPDATE public.standalone_experience_includes SET title = $t$Swim out to see dolphins, fish and coral$t$, title_fr = $t$Nage en mer pour observer dauphins et coraux$t$, title_he = $t$שחייה לצפייה בדולפינים, דגים ואלמוגים$t$ WHERE id = '31aa24bf-1b27-4e6c-8d08-e75e7737b398';

UPDATE public.standalone_experience_includes SET title = $t$Three routes: seafront, HaYarkon Park, Jaffa$t$, title_fr = $t$Trois parcours : bord de mer, parc HaYarkon, Jaffa$t$, title_he = $t$שלושה מסלולים: טיילת, פארק הירקון, יפו$t$ WHERE id = '6645597e-7d53-4ad1-8381-92a0c87cf665';

UPDATE public.standalone_experience_includes SET title_fr = $t$Dégustation de chocolat, 90 min dans le noir$t$ WHERE id = 'ba43a8c6-fe85-425e-b432-f8e6495b7445';

UPDATE public.standalone_experience_includes SET title_fr = $t$Balade de nuit entre Vieille Ville et Jérusalem$t$ WHERE id = 'e2804f4f-4401-43b9-8553-a8a1d8050800';

UPDATE public.standalone_experience_includes SET title_fr = $t$Équipement de plongée complet fourni$t$ WHERE id = 'a834200c-6c05-4ae1-901c-794ce50c0fab';
