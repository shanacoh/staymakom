-- Mise à jour de l'expérience standalone : Horseback Ride at Lev HaTeva Farm
-- Modifications : sous-titre mis à jour (ajout "30 min de Tel Aviv") + espaces entre paragraphes dans les descriptions

UPDATE public.standalone_experiences
SET
  subtitle = 'A guided horseback ride through the open fields of Moshav Ein Vered, 30 minutes from Tel Aviv, on a working farm where the horses know every trail.',
  subtitle_fr = 'Une balade à cheval guidée dans les champs du moshav Ein Vered, à 30 minutes de Tel Aviv, dans une ferme vivante où les chevaux connaissent chaque sentier.',
  subtitle_he = 'טיול רכיבה מודרך בשדות הפתוחים של מושב עין ורד, 30 דקות מתל אביב, בחווה חיה שבה הסוסים מכירים כל שביל.',

  long_copy = 'A horseback ride at Lev HaTeva Farm, Moshav Ein Vered. The Sharon fields, at ground level, at the horse''s pace.

The guide meets you at the farm before you mount. No rush. You spend a few minutes with your horse first: the guide adjusts the western saddle, shows you how to hold the reins, explains the rhythm. Then you move out onto the trails that cut through Ein Vered''s open agricultural landscape, about 30 minutes from Tel Aviv. The ride covers shaded paths and open fields, at a pace that adapts to the group. Children start in the paddock and join the trail when they feel ready. Beginners ride with the same confidence as those who have ridden before, because the horses here are calm and the guide stays close.

The farm is run by Ilan Touati and his team. What they do is not a tourist attraction layered onto a real place. The horses live here, the land is worked, and the experience has the specific weight of somewhere that functions on its own terms. Western riding, which the farm specializes in, gives a broader seat and a slower rhythm. It suits families, it suits people who have never been on a horse, and it suits anyone who wants to move through the countryside without a clock involved.

When the ride ends, the farm stays open. A petting zoo sits on the property, with goats and smaller animals that children gravitate toward without being told. Adults tend to linger in the shade. The afternoon holds itself together without any effort on your part.',

  long_copy_fr = 'Une balade à cheval à la ferme Lev HaTeva, moshav Ein Vered. Le Sharon, à hauteur de selle, au rythme de l''animal.

Le guide vous accueille à la ferme avant de monter en selle. Il prend le temps de vous présenter votre cheval, de régler l''équipement, d''expliquer les bases. Puis on part sur les sentiers qui traversent le paysage agricole d''Ein Vered, à 30 minutes de Tel Aviv. La balade alterne chemins ombragés et champs ouverts, à un rythme qui s''ajuste à la taille du groupe. Les enfants commencent dans le paddock et rejoignent la sortie quand ils sont prêts. Les débutants roulent avec la même assurance que les autres, parce que les chevaux de la ferme sont calmes et le guide ne s''éloigne pas.

La ferme est gérée par Ilan Touati et son équipe. Ce n''est pas un décor construit autour de l''expérience : les chevaux vivent ici, la terre est travaillée, et le lieu fonctionne selon ses propres règles. La spécialité de la ferme est l''équitation western : une selle plus large, un rythme plus posé, un lien plus direct avec l''animal. C''est le format idéal pour les familles, pour ceux qui n''ont jamais monté, et pour ceux qui veulent simplement avancer dans la campagne sans programme serré.

Quand la balade se termine, la ferme reste ouverte. Il y a une ferme pédagogique sur place, avec des chèvres et des petits animaux que les enfants rejoignent naturellement. Les adultes s''attardent à l''ombre. L''après-midi se tient tout seul, sans qu''on ait besoin d''y penser.',

  long_copy_he = 'רכיבה על סוסים בחוות לב הטבע, מושב עין ורד. השרון, בגובה האוכף, בקצב של הסוס.

המדריך מקבל אתכם בחווה לפני שעולים לאוכף. לא ממהרים. קודם מתוודעים לסוס: המדריך מכוון את הציוד, מסביר את הבסיס, מתאים את הקצב. אחר כך יוצאים לשבילים שחוצים את נוף השדות החקלאי של עין ורד, כחצי שעה מתל אביב. הרכיבה עוברת בין שבילים מוצלים לשדות פתוחים, בקצב שמתאים לקבוצה. ילדים מתחילים בגדר ומצטרפים למסלול כשהם מוכנים. מתחילים רוכבים בביטחון כמו כולם, כי הסוסים פה רגועים והמדריך נשאר קרוב.

החווה מנוהלת על ידי אילן טואטי וצוותו. זה לא דקור שנבנה סביב חוויה תיירותית: הסוסים חיים פה, האדמה מעובדת, והמקום פועל לפי הקצב שלו. ההתמחות היא ברכיבה מערבית: אוכף רחב יותר, קצב איטי יותר, וחיבור ישיר יותר עם הסוס. מתאים למשפחות, למי שמעולם לא רכב, ולמי שרוצה לעבור בשדות בלי שעון ביד.

כשהרכיבה נגמרת, החווה נשארת פתוחה. יש פינת חי עם עיזים וחיות קטנות שהילדים פשוט נמשכים אליהן. המבוגרים נשארים בצל. אחר הצהריים מחזיק את עצמו מבלי שצריך לתכנן.'

WHERE slug = 'balade-cheval-lev-hateva';
