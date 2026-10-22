-- Redirection des liens vers une fiche archivée.
--
-- Les visiteurs ne peuvent lire que les fiches publiées (règles de sécurité des tables) : quand
-- une fiche est archivée, sa page ne la trouve plus. Cette fonction donne seulement de quoi
-- rediriger le visiteur (le slug du mood et celui de la région), rien d'autre de la fiche.
-- Elle ne répond que pour une fiche archivée : un brouillon reste invisible, comme avant.
--
-- p_kind : 'hotel' (hotels2), 'experience' (experiences2) ou 'standalone' (standalone_experiences).
-- Retour : {"category_slug": ..., "region_slug": ...} ou null si la fiche n'est pas archivée.

create or replace function public.archived_listing_redirect(p_kind text, p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case p_kind
    when 'hotel' then (
      select jsonb_build_object('category_slug', null, 'region_slug', r.slug)
      from hotels2 h
      left join regions r on r.id = h.region_id and r.is_active
      where h.slug = p_slug and h.status = 'archived'
      limit 1
    )
    when 'experience' then (
      select jsonb_build_object('category_slug', c.slug, 'region_slug', r.slug)
      from experiences2 e
      left join categories c on c.id = e.category_id and c.status = 'published'
      -- Région du premier hôtel du parcours, ou de l'hôtel unique des anciennes fiches.
      left join hotels2 h on h.id = coalesce(
        (select eh.hotel_id from experience2_hotels eh where eh.experience_id = e.id order by eh.position limit 1),
        e.hotel_id
      )
      left join regions r on r.id = h.region_id and r.is_active
      where e.slug = p_slug and e.status = 'archived'
      limit 1
    )
    when 'standalone' then (
      select jsonb_build_object('category_slug', c.slug, 'region_slug', r.slug)
      from standalone_experiences s
      left join categories c on c.id = s.category_id and c.status = 'published'
      left join regions r on r.id = s.region_id and r.is_active
      where s.slug = p_slug and s.status = 'archived'
      limit 1
    )
  end;
$$;

grant execute on function public.archived_listing_redirect(text, text) to anon, authenticated;
