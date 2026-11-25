-- Journal : les photos de couverture de 9 anciens articles pointaient vers le dossier
-- "journal-images", qui est vide (fichiers perdus) ; 3 autres articles n'avaient pas de photo.
-- On leur attribue une vraie photo du catalogue (fiche expérience) en lien avec le sujet.
-- Sauvegarde avant modification : backup_20261125.journal_posts_covers

create table if not exists backup_20261125.journal_posts_covers as
  select id, slug, cover_image, og_image from public.journal_posts;

begin;

with mapping(slug, img) as (values
  ('the-journey-starts-before-the-destination', 'hero/8de9a48e-929a-41c1-917d-0d056bb0ce7f.png'),
  ('working-away-from-the-office-rethinking-work-team-retreats-and-shared-stays-in-israel', 'hero/bbc57630-ffa0-4694-ac35-ebe0150b768b.png'),
  ('why-booking-a-hotel-is-no-longer-enough', 'hero/89a87016-926d-42d7-b3aa-3cb61a7c199e.jpeg'),
  ('israel-for-israelis-rethinking-the-yom-keif-experience', 'hero/vines-among-the-dunes-ee7d996c.png'),
  ('wellness-travel-in-israel-from-desert-retreats-to-boutique-spa-hotels', 'hero/c751349e-2e9d-4359-9147-29299695d4b7.jpeg'),
  ('slow-travel-in-israel-nature-silence-and-meaningful-stays', 'hero/04810edb-a8f4-4174-a433-986b75cdd534.jpeg'),
  ('hidden-boutique-hotels-in-israel-youve-probably-never-heard-of', 'hero/c1b5c142-a1f9-4adc-88a8-5da68f784bb8.jpeg'),
  ('traveling-by-experience-not-by-city-a-new-way-to-explore-israel', 'hero/riding-the-ancient-spice-route-e313af83.png'),
  ('the-perfect-23-day-getaway-in-israel-short-trips-deep-experiences', 'hero/cc9344c4-bb43-4e05-9df1-865f8f8aac27.png'),
  ('how-to-travel-israel-differently-beyond-tel-aviv-and-jerusalem-1', 'hero/444703a4-0b9c-407e-972a-a083d6e169fc.png'),
  ('the-side-of-israel-no-one-talks-about', 'hero/bike-and-wine-tour-in-the-judean-hills-831a7a6d.png'),
  ('why-israel-needs-a-new-way-to-travel', 'hero/skydiving-over-habonim-beach-9ab1451e.png')
)
update public.journal_posts p
set cover_image = 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/experience-images/' || m.img,
    og_image = case
      when coalesce(p.og_image, '') = '' or p.og_image like '%journal-images%'
      then 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/experience-images/' || m.img
      else p.og_image end
from mapping m
where p.slug = m.slug;

commit;
