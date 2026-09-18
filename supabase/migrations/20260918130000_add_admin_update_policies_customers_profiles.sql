-- Jusqu'ici, un admin pouvait VOIR toutes les fiches clients/profils (policy SELECT existante),
-- mais aucune policy n'autorisait un admin à les MODIFIER : la base refusait silencieusement
-- la mise à jour (RLS bloque la ligne, Supabase ne renvoie pas d'erreur), donc l'admin voyait
-- "Enregistré" côté interface sans que rien ne change réellement en base.
CREATE POLICY "Admins can update all customer profiles"
ON public.customers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
