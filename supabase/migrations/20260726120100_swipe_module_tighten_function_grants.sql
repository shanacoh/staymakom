-- Les fonctions de trigger ne doivent jamais être appelables directement via l'API (RPC) :
-- elles dépendent du contexte NEW/OLD fourni par Postgres lors d'un trigger, pas d'un appel direct.
REVOKE ALL ON FUNCTION public.swipe_mark_dossier_vu() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.swipe_refresh_statut_lecture() FROM PUBLIC, anon, authenticated;

-- Les fonctions RPC publiques token-scopées sont accordées par défaut à PUBLIC à la création ;
-- on retire ce droit large puis on ré-accorde explicitement seulement aux rôles voulus (anon +
-- authenticated, un client connecté pouvant aussi ouvrir un lien de swipe).
REVOKE ALL ON FUNCTION public.swipe_get_dossier_by_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.swipe_get_participants_by_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.swipe_get_or_create_participant(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.swipe_get_deck_by_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.swipe_upsert_swipe(TEXT, UUID, UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.swipe_cancel_swipe(TEXT, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.swipe_set_coup_de_coeur(TEXT, UUID, UUID, BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.swipe_get_dossier_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.swipe_get_participants_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.swipe_get_or_create_participant(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.swipe_get_deck_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.swipe_upsert_swipe(TEXT, UUID, UUID, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.swipe_cancel_swipe(TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.swipe_set_coup_de_coeur(TEXT, UUID, UUID, BOOLEAN) TO anon, authenticated;
