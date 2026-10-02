import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import {
  useEnvoyerRetours,
  usePropositionHeader,
  usePropositionLignes,
  useResoudreDossierVoyage,
  useSetReaction,
  type PropositionLigne,
} from "@/lib/dossierVoyagePublic/queries";

type Lang = "fr" | "en" | "he";

const TEXTES: Record<string, Record<Lang, string>> = {
  titre: { fr: "Votre voyage sur mesure", en: "Your tailor-made trip", he: "הטיול המותאם אישית שלך" },
  intro: {
    fr: "Voici un avant-goût de ce qu'on vous prépare. Dites-nous ce que vous en pensez !",
    en: "Here's a taste of what we're preparing for you. Let us know what you think!",
    he: "הנה טעימה ממה שאנחנו מכינים לכם. ספרו לנו מה דעתכם!",
  },
  jour: { fr: "Jour", en: "Day", he: "יום" },
  jaime: { fr: "J'adore", en: "Love it", he: "אוהב/ת" },
  autreChose: { fr: "Autre chose ?", en: "Something else?", he: "משהו אחר?" },
  commentairePlaceholder: { fr: "Dites-nous ce que vous préféreriez...", en: "Tell us what you'd prefer...", he: "ספרו לנו מה הייתם מעדיפים..." },
  envoyer: { fr: "Envoyer mes retours", en: "Send my feedback", he: "שלח משוב" },
  retoursEnvoyes: { fr: "Merci, vos retours ont été envoyés !", en: "Thank you, your feedback has been sent!", he: "תודה, המשוב שלך נשלח!" },
  prixTotal: { fr: "Prix total du voyage", en: "Total trip price", he: "מחיר כולל לטיול" },
  reserver: { fr: "Réserver ce voyage", en: "Book this trip", he: "הזמן את הטיול הזה" },
  onEnParle: { fr: "On en parle ?", en: "Let's talk?", he: "נדבר?" },
  environ: { fr: "environ", en: "about", he: "בערך" },
  lienInvalideTitre: { fr: "Lien introuvable", en: "Link not found", he: "הקישור לא נמצא" },
  lienInvalideSousTitre: {
    fr: "Ce lien n'est plus valide ou a expiré. Contacte Shana si tu penses qu'il y a une erreur.",
    en: "This link is no longer valid or has expired. Contact Shana if you think this is a mistake.",
    he: "הקישור הזה אינו תקף עוד. פנו לשנה אם לדעתכם מדובר בטעות.",
  },
  vide: { fr: "Le programme est encore en préparation, repasse bientôt !", en: "The program is still being prepared, check back soon!", he: "התוכנית עדיין בהכנה, חזרו בקרוב!" },
  carnetTitre: { fr: "Carnet de voyage", en: "Travel journal", he: "יומן המסע" },
  carnetSousTitre: { fr: "Cette page arrive bientôt.", en: "This page is coming soon.", he: "העמוד הזה יגיע בקרוב." },
};

function t(key: keyof typeof TEXTES, lang: Lang): string {
  return TEXTES[key][lang] ?? TEXTES[key].fr;
}

function localise(fr: string | null, en: string | null, he: string | null, lang: Lang): string {
  if (lang === "en" && en) return en;
  if (lang === "he" && he) return he;
  return fr ?? en ?? he ?? "";
}

function LigneCard({ ligne, lang, reaction, onReagir }: {
  ligne: PropositionLigne;
  lang: Lang;
  reaction: { reaction: "jaime" | "mitige" | "non"; commentaire: string } | undefined;
  onReagir: (reaction: "jaime" | "mitige" | "non", commentaire: string) => void;
}) {
  const [commentaireOuvert, setCommentaireOuvert] = useState(false);
  const [commentaire, setCommentaire] = useState("");

  const titre = ligne.texte_libre || localise(ligne.nom_code, ligne.nom_code_en, ligne.nom_code_he, lang) || "—";
  const description = localise(ligne.description_sensorielle, ligne.description_sensorielle_en, ligne.description_sensorielle_he, lang);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      {ligne.visuel_url && <img src={ligne.visuel_url} alt="" className="h-40 w-full object-cover" />}
      <div className="space-y-2 p-4">
        <p className="text-lg font-semibold text-[#1a1a1a]">{titre}</p>
        {description && <p className="text-sm text-[#1a1a1a]/70">{description}</p>}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#1a1a1a]/50">
          {ligne.secteur_libelle && (
            <span>
              {ligne.secteur_libelle}
              {ligne.secteur_rayon_km ? ` (± ${ligne.secteur_rayon_km} km)` : ""}
            </span>
          )}
          {ligne.casher && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">Casher</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onReagir("jaime", "")}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              reaction?.reaction === "jaime" ? "border-[#ad1414] bg-[#ad1414] text-white" : "border-black/10 text-[#1a1a1a]/70 hover:bg-black/5"
            }`}
          >
            ♥ {t("jaime", lang)}
          </button>
          <button
            type="button"
            onClick={() => setCommentaireOuvert((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              reaction?.reaction && reaction.reaction !== "jaime" ? "border-[#ad1414] bg-[#ad1414] text-white" : "border-black/10 text-[#1a1a1a]/70 hover:bg-black/5"
            }`}
          >
            {t("autreChose", lang)}
          </button>
        </div>

        {commentaireOuvert && (
          <div className="flex gap-2 pt-1">
            <input
              className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
              placeholder={t("commentairePlaceholder", lang)}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg bg-[#ad1414] px-3 py-2 text-sm text-white"
              onClick={() => {
                onReagir("mitige", commentaire);
                setCommentaireOuvert(false);
              }}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PropositionView({ token, nomDestinataire, objectif, langParam }: { token: string; nomDestinataire: string; objectif: string; langParam: string | null }) {
  const lang = (langParam === "en" || langParam === "he" ? langParam : "fr") as Lang;
  const { data: header } = usePropositionHeader(token, true);
  const { data: lignes, isLoading } = usePropositionLignes(token, true);
  const setReaction = useSetReaction();
  const envoyerRetours = useEnvoyerRetours();

  const [reactions, setReactions] = useState<Record<string, { reaction: "jaime" | "mitige" | "non"; commentaire: string }>>({});
  const [retoursEnvoyes, setRetoursEnvoyes] = useState(false);

  const joursPresents = useMemo(() => Array.from(new Set((lignes ?? []).map((l) => l.jour))).sort((a, b) => a - b), [lignes]);

  const reagir = (ligneId: string, reaction: "jaime" | "mitige" | "non", commentaire: string) => {
    setReactions((r) => ({ ...r, [ligneId]: { reaction, commentaire } }));
    setReaction.mutate({ token, ligneId, reaction, commentaire: commentaire || null });
  };

  const envoyer = async () => {
    try {
      await envoyerRetours.mutateAsync(token);
      setRetoursEnvoyes(true);
      toast.success(t("retoursEnvoyes", lang));
    } catch {
      toast.error("—");
    }
  };

  const messageWhatsapp = encodeURIComponent(
    objectif === "collab"
      ? `Bonjour Shana ! Je souhaite discuter de la collaboration proposée (${nomDestinataire}).`
      : `Bonjour Shana ! Je souhaite réserver le voyage proposé (${nomDestinataire}).`
  );

  return (
    <div dir={lang === "he" ? "rtl" : "ltr"} className="min-h-dvh bg-[#FAF8F4] font-sans">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">{t("titre", lang)}</h1>
        <p className="mt-1 text-sm text-[#1a1a1a]/60">{t("intro", lang)}</p>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#ad1414]" />
          </div>
        )}

        {!isLoading && joursPresents.length === 0 && <p className="py-12 text-center text-sm text-[#1a1a1a]/60">{t("vide", lang)}</p>}

        <div className="mt-6 space-y-6">
          {joursPresents.map((jour) => (
            <div key={jour} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#ad1414]">
                {t("jour", lang)} {jour}
              </p>
              {(lignes ?? [])
                .filter((l) => l.jour === jour)
                .map((l) => (
                  <LigneCard key={l.ligne_id} ligne={l} lang={lang} reaction={reactions[l.ligne_id]} onReagir={(r, c) => reagir(l.ligne_id, r, c)} />
                ))}
            </div>
          ))}
        </div>

        {header?.prix_total_vente != null && (
          <div className="mt-8 rounded-2xl border border-black/5 bg-white p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[#1a1a1a]/50">{t("prixTotal", lang)}</p>
            <p className="text-2xl font-bold text-[#1a1a1a]">
              {t("environ", lang)} {header.prix_total_vente} {header.devise ?? ""}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {!retoursEnvoyes && joursPresents.length > 0 && (
            <button
              type="button"
              onClick={envoyer}
              disabled={envoyerRetours.isPending || Object.keys(reactions).length === 0}
              className="rounded-full border border-[#ad1414] px-4 py-3 text-sm font-medium text-[#ad1414] disabled:opacity-40"
            >
              {t("envoyer", lang)}
            </button>
          )}
          {retoursEnvoyes && <p className="text-center text-sm text-green-700">{t("retoursEnvoyes", lang)}</p>}

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${messageWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#ad1414] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            {objectif === "collab" ? t("onEnParle", lang) : t("reserver", lang)}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VoyagePublic() {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLanguage();
  const { data: etat, isLoading, isFetched } = useResoudreDossierVoyage(token);

  if (isLoading || !isFetched) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#FAF8F4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ad1414]" />
      </div>
    );
  }

  if (!etat) {
    return (
      <div dir={lang === "he" ? "rtl" : "ltr"} className="flex h-dvh flex-col items-center justify-center bg-[#FAF8F4] px-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">{t("lienInvalideTitre", lang as Lang)}</h1>
        <p className="text-[#1a1a1a]/60">{t("lienInvalideSousTitre", lang as Lang)}</p>
      </div>
    );
  }

  if (etat.etape === "explorer") {
    return <Navigate to={`/swipe/${token}`} replace />;
  }

  if (etat.etape === "carnet") {
    return (
      <div dir={lang === "he" ? "rtl" : "ltr"} className="flex h-dvh flex-col items-center justify-center bg-[#FAF8F4] px-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a]">{t("carnetTitre", lang as Lang)}</h1>
        <p className="text-[#1a1a1a]/60">{t("carnetSousTitre", lang as Lang)}</p>
      </div>
    );
  }

  return <PropositionView token={token as string} nomDestinataire={etat.nom_destinataire} objectif={etat.objectif} langParam={lang} />;
}
