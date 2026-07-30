-- Message d'accueil du dossier NAS DAILY : explique les 3 catégories de propositions au client,
-- affiché juste avant qu'il donne son prénom.

UPDATE public.dossiers SET
  message_intro = 'On vous a préparé trois façons de vivre ce séjour, selon le temps que vous avez.

🌙 Une escapade avec une nuit d''hôtel quelque part dans le pays, pour un vrai break.
🚗 Une journée complète en dehors de Tel Aviv, pour découvrir sans y passer la nuit.
☀️ Une expérience à vivre sur place, si le temps manque.

À vous de swiper ce qui vous tente !',
  message_intro_en = 'We''ve put together three ways to experience this trip, depending on how much time you have.

🌙 An overnight escape at a hotel somewhere in the country, for a real break.
🚗 A full day out beyond Tel Aviv, to explore without staying the night.
☀️ A single experience close by, if time is short.

Swipe through and see what speaks to you!',
  message_intro_he = 'הכנו לכם שלוש דרכים לחוות את הטיול הזה, בהתאם לזמן שיש לכם.

🌙 בריחה עם לינה במלון אי-שם בארץ, להפסקה אמיתית.
🚗 יום שלם מחוץ לתל אביב, לגלות בלי ללון בחוץ.
☀️ חוויה אחת קרובה, אם הזמן קצר.

תסחפו ותבחרו את מה שמדבר אליכם!'
WHERE token_public = 'b89b39d676a2ead0172c978893955178';
