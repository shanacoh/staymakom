// Bouton « Aperçu » de l'email quotidien du Journal : affiche le brouillon tel qu'il paraîtra
// sur le site, sans connexion au back-office (le jeton de l'email suffit, lecture seule,
// 7 jours). Le brouillon est lu par la fonction journal-email-action. Page privée, jamais indexée.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedArticleView, type GeneratedArticleRow } from "@/components/journal/GeneratedArticleView";

type State = { kind: "loading" } | { kind: "ok"; post: GeneratedArticleRow } | { kind: "invalid" } | { kind: "error" };

const MESSAGES = {
  invalid: { title: "Lien expiré ou invalide", text: "Le lien « Aperçu » fonctionne 7 jours. Ouvre l'article depuis le Journal du back-office." },
  error: { title: "Erreur temporaire", text: "L'aperçu n'a pas pu être chargé. Réessaie dans un instant, ou passe par le back-office." },
};

const JournalPreview = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t") || "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    supabase.functions
      .invoke("journal-email-action", { body: { token, action: "preview" } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setState({ kind: "error" });
        else if (data?.result === "ok" && data.post) setState({ kind: "ok", post: data.post as GeneratedArticleRow });
        else setState({ kind: "invalid" });
      })
      .catch(() => !cancelled && setState({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "ok") {
    const post = state.post;
    return (
      <div className="min-h-screen bg-white">
        <meta name="robots" content="noindex, nofollow" />
        {/* Même cadre que la page article publiée (JournalPost). */}
        <main className="max-w-4xl mx-auto px-6 py-20">
          <div className="mb-8 rounded-lg bg-[#ad1414] text-white text-xs sm:text-sm px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="font-semibold uppercase tracking-[0.12em]">Aperçu du brouillon, non publié</span>
            <Link to={`/admin/journal/article/${post.id}`} className="underline underline-offset-2">Modifier dans le back-office</Link>
          </div>
          <GeneratedArticleView post={{ ...post, published_at: post.published_at || new Date().toISOString() }} preview />
        </main>
      </div>
    );
  }

  const message = state.kind === "loading" ? null : MESSAGES[state.kind];
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
          <p className="text-sm text-muted-foreground">Chargement de l'aperçu...</p>
        )}
      </div>
    </div>
  );
};

export default JournalPreview;
