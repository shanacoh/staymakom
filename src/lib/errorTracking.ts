import { supabase } from "@/integrations/supabase/client";

/**
 * Empreinte simple (pas cryptographique) pour regrouper les occurrences d'une même erreur.
 * Basée uniquement sur le message, PAS sur la pile d'appel : les fichiers du site changent
 * de nom à chaque mise en ligne (hash dans le nom de fichier), donc une empreinte basée sur
 * la pile ferait réapparaître la même erreur non corrigée comme "nouvelle" à chaque déploiement.
 */
function fingerprint(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

let lastLoggedFingerprint = "";
let lastLoggedAt = 0;

/**
 * Enregistre une erreur survenue dans le navigateur d'un visiteur. Ne doit jamais faire
 * planter l'appelant : toute erreur ici est avalée silencieusement (on ne veut pas qu'un
 * bug dans le suivi d'erreurs en crée un nouveau).
 */
export function logClientError(error: unknown, extra?: { context?: string }) {
  try {
    const message =
      (error instanceof Error ? error.message : String(error)) || "Erreur inconnue";
    const stack = error instanceof Error ? error.stack || "" : "";
    const fp = fingerprint(message);

    // Anti-doublon très simple : si on vient de signaler exactement la même erreur il y a
    // moins de 2 secondes (ex: plusieurs composants qui paniquent en cascade), on n'insère
    // qu'une fois.
    const now = Date.now();
    if (fp === lastLoggedFingerprint && now - lastLoggedAt < 2000) return;
    lastLoggedFingerprint = fp;
    lastLoggedAt = now;

    // supabase-js renvoie un "thenable paresseux" : la requête ne part réellement que
    // lorsqu'on appelle .then() (ou qu'on l'attend) — un simple `void` sur l'appel ne
    // suffit pas à déclencher l'envoi.
    supabase
      .from("error_events")
      .insert({
        fingerprint: fp,
        message,
        stack: [extra?.context, stack].filter(Boolean).join("\n") || null,
        page_url: window.location.pathname + window.location.search,
        user_agent: navigator.userAgent,
      })
      .then(() => {}, () => {});
  } catch {
    // On ne fait jamais planter l'appelant à cause du suivi d'erreurs lui-même.
  }
}

/** À appeler une fois au démarrage de l'app pour capturer aussi les erreurs qui n'passent
 *  pas par un ErrorBoundary React (erreurs JS classiques, promesses rejetées non gérées). */
export function initGlobalErrorTracking() {
  window.addEventListener("error", (event) => {
    logClientError(event.error || event.message, { context: "window.onerror" });
  });
  window.addEventListener("unhandledrejection", (event) => {
    logClientError(event.reason, { context: "unhandledrejection" });
  });
}
