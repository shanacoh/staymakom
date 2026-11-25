// Lien « Rejeter » de l'email quotidien du Journal : un seul clic depuis l'email suffit.
// La page appelle tout de suite la fonction journal-email-action avec le jeton de l'adresse
// (usage unique, 24 h) et affiche le résultat. Page privée, jamais indexée.
import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const MESSAGES: Record<string, { title: string; text: string }> = {
  rejected: { title: "Article rejeté", text: "Il ne sera pas publié (et s'il l'était déjà, il a été retiré du site)." },
  already_used: { title: "Lien déjà utilisé", text: "Cet article a déjà été rejeté avec ce lien." },
  invalid: { title: "Lien expiré ou invalide", text: "Le lien « Rejeter » fonctionne 24 h. Ouvre l'article dans le back-office pour le rejeter." },
  error: { title: "Erreur temporaire", text: "Le rejet n'a pas pu être enregistré. Réessaie dans un instant, ou passe par le back-office." },
};

const JournalAction = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const token = searchParams.get("t") || "";
    supabase.functions
      .invoke("journal-email-action", { body: { token } })
      .then(({ data, error }) => setResult(error ? "error" : data?.result || "error"))
      .catch(() => setResult("error"));
  }, [searchParams]);

  const message = result ? MESSAGES[result] || MESSAGES.error : null;
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FAF9F6" }}>
      <meta name="robots" content="noindex, nofollow" />
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-muted-foreground mb-2">Journal STAYMAKOM</p>
        {message ? (
          <>
            <h1 className="text-xl font-bold mb-2" style={{ color: "#ad1414" }}>{message.title}</h1>
            <p className="text-sm text-muted-foreground mb-6">{message.text}</p>
            <Link to="/admin/journal" className="text-sm underline">Ouvrir le Journal dans le back-office</Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Rejet en cours...</p>
        )}
      </div>
    </div>
  );
};

export default JournalAction;
