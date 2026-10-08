// Qui appelle une fonction serveur ? Deux cas reconnus ici :
//  - un admin connecté au back-office (son jeton de connexion est vérifié, puis son rôle) ;
//  - la tâche planifiée de la base (elle présente un secret rangé dans le coffre de la base,
//    que seule la clé de service peut faire vérifier).

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

/** Email de l'admin connecté qui fait l'appel, ou `null` si l'appelant n'est pas un admin. */
export async function getAdminEmail(req: Request, serviceClient: ServiceClient): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: { user } } = await serviceClient.auth.getUser(token);
  if (!user?.email) return null;
  const { data: adminRole } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return adminRole ? user.email : null;
}

/** Vrai si l'appel vient de la tâche planifiée de la base (secret du coffre présenté et valide). */
export async function isInternalCron(req: Request, serviceClient: ServiceClient): Promise<boolean> {
  const candidate = req.headers.get("x-cron-secret");
  if (!candidate) return false;
  const { data, error } = await serviceClient.rpc("check_internal_cron_secret", { candidate });
  return !error && data === true;
}

/** Vrai si cette adresse est celle d'un admin (un aperçu ne part jamais ailleurs). */
export async function isAdminEmail(serviceClient: ServiceClient, email: string): Promise<boolean> {
  const { data, error } = await serviceClient.rpc("is_admin_email", { candidate: email });
  return !error && data === true;
}
