// Fiche d'un article du blog automatique : points à vérifier en haut, aperçu tel qu'il
// apparaîtra sur le site, modification de tous les champs, et boutons Publier maintenant /
// Programmer / Régénérer / Rejeter / Dépublier. Ouverte depuis l'email du jour
// (?tab=preview pour l'aperçu, ?action=publish pour confirmer la publication).
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GeneratedArticleView, type GeneratedArticleRow } from "@/components/journal/GeneratedArticleView";
import { LANG_LABELS, PIPELINE_LABELS, formatIsrael, startGeneration, waitForRun } from "@/components/admin/journal/journalAdmin";
import { articlePath } from "../../../api/_seo/journalArticle";

type Post = GeneratedArticleRow & Record<string, any>;

const paragraphsToText = (p: string[]) => p.join("\n\n");
const textToParagraphs = (s: string) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

/** Date-heure locale (champ datetime-local) → ISO, interprétée à l'heure du navigateur. */
const localToIso = (v: string) => (v ? new Date(v).toISOString() : null);

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={`text-xs ${value.length > max ? "text-red-700 font-medium" : "text-muted-foreground"}`}>{value.length} / {max}</span>;
}

const JournalArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<Post | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "publish" | "reject" | "unpublish" | "regenerate">(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const { data: post, refetch } = useQuery({
    queryKey: ["admin-journal-article", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_posts" as any).select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as Post;
    },
  });

  useEffect(() => {
    if (post) setForm(post);
  }, [post]);

  // Lien « Publier maintenant » de l'email : on demande confirmation.
  useEffect(() => {
    if (post && searchParams.get("action") === "publish" && post.pipeline_status !== "published") setConfirm("publish");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  if (!form || !post) return <div className="py-12 text-center">Chargement...</div>;

  const set = (fields: Partial<Post>) => setForm({ ...form, ...fields });
  const status = PIPELINE_LABELS[post.pipeline_status] || PIPELINE_LABELS.draft;
  const isRTL = form.lang === "he";
  const dir = isRTL ? "rtl" : undefined;

  const editableFields = () => ({
    title: form.title.trim(),
    slug: form.slug.trim(),
    seo_title: (form.seo_title || "").trim() || null,
    meta_description: (form.meta_description || "").trim() || null,
    intro: form.intro,
    body: form.body,
    booking_intro: form.booking_intro,
    linked_listings: form.linked_listings,
    faq: form.faq,
    conclusion: form.conclusion,
    cover_image: form.cover_image,
    cover_alt: form.cover_alt,
    primary_keyword: form.primary_keyword,
    secondary_keywords: form.secondary_keywords,
    to_verify: form.to_verify,
    topic_group: form.topic_group || null,
  });

  const run = async (label: string, action: () => Promise<void>, success: string) => {
    setBusy(label);
    try {
      await action();
      toast.success(success);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-journal-posts"] });
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  const update = async (fields: Record<string, unknown>) => {
    const { error } = await supabase.from("journal_posts" as any).update(fields).eq("id", post.id);
    if (error) throw new Error(error.code === "23505" ? "Ce slug ou ce mot-clé est déjà utilisé par un autre article" : error.message);
  };

  const save = () => run("save", () => update(editableFields()), "Article enregistré");
  const publishNow = () =>
    run(
      "publish",
      async () => {
        await update(editableFields());
        const { error } = await supabase.rpc("journal_publish_now" as any, { p_post_id: post.id });
        if (error) throw new Error(error.code === "23505" ? "Un article sur le même mot-clé est déjà publié dans cette langue" : error.message);
        setSearchParams({}, { replace: true });
      },
      "Article publié"
    );
  const schedule = () =>
    run(
      "schedule",
      async () => {
        const iso = localToIso(scheduleAt);
        if (!iso) throw new Error("Choisis une date et une heure");
        await update({ ...editableFields(), pipeline_status: "scheduled", scheduled_at: iso, block_reason: null });
      },
      "Article programmé"
    );
  const reject = () => run("reject", () => update({ pipeline_status: "rejected" }), "Article rejeté");
  const unpublish = () => run("unpublish", () => update({ pipeline_status: "draft" }), "Article retiré du site (brouillon)");
  const regenerate = async () => {
    setBusy("regenerate");
    setConfirm(null);
    try {
      const runId = await startGeneration({ post_id: post.id });
      toast.info("Nouvelle rédaction en cours (1 à 3 minutes)...");
      const result = await waitForRun(runId);
      if (result.status === "failed") throw new Error(result.error || "La génération n'a pas abouti");
      await refetch();
      toast.success("Article régénéré");
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setBusy(null);
    }
  };

  const publicUrl = articlePath(post.slug, (post.lang as "en" | "he" | "fr") || "en");
  const meta = (post.generation_meta || {}) as Record<string, any>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/journal")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Journal
        </Button>
        <Badge variant="outline" className={`border-0 ${status.className}`}>{status.label}</Badge>
        <Badge variant="outline">{LANG_LABELS[post.lang]}</Badge>
        {post.pipeline_status === "scheduled" && <span className="text-sm">Publication prévue : {formatIsrael(post.scheduled_at)} (heure d'Israël)</span>}
        {post.pipeline_status === "published" && (
          <Link to={publicUrl} target="_blank" className="text-sm inline-flex items-center gap-1 underline">
            Voir sur le site <ExternalLink className="w-3 h-3" />
          </Link>
        )}
        {meta.cost_usd != null && (
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {meta.word_count} mots · {meta.attempts} tentative(s) · {Number(meta.cost_usd).toFixed(2)} $
          </span>
        )}
      </div>

      {post.block_reason && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="font-medium text-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Bloqué : ne sera pas publié tout seul</p>
          <ul className="list-disc pl-5 mt-2 text-sm text-red-800 space-y-0.5">
            {post.block_reason.split("\n").map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
        <p className="font-medium text-amber-900">Points à vérifier</p>
        {form.to_verify?.length ? (
          <ul className="list-disc pl-5 mt-2 text-sm text-amber-900 space-y-0.5">
            {form.to_verify.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-amber-900 mt-1">Rien de signalé.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={!!busy}>{busy === "save" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Enregistrer</Button>
        {post.pipeline_status !== "published" && (
          <Button variant="outline" onClick={() => setConfirm("publish")} disabled={!!busy}>Publier maintenant</Button>
        )}
        {post.pipeline_status !== "published" && (
          <div className="flex items-center gap-1">
            <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="w-[200px]" />
            <Button variant="outline" onClick={schedule} disabled={!!busy || !scheduleAt}>Programmer</Button>
          </div>
        )}
        {post.pipeline_status !== "published" && post.topic_id && (
          <Button variant="outline" onClick={() => setConfirm("regenerate")} disabled={!!busy}>
            {busy === "regenerate" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Régénérer
          </Button>
        )}
        {post.pipeline_status !== "rejected" && post.pipeline_status !== "published" && (
          <Button variant="outline" className="text-red-700" onClick={() => setConfirm("reject")} disabled={!!busy}>Rejeter</Button>
        )}
        {post.pipeline_status === "published" && (
          <Button variant="outline" className="text-red-700" onClick={() => setConfirm("unpublish")} disabled={!!busy}>Dépublier</Button>
        )}
      </div>

      <Tabs value={searchParams.get("tab") === "preview" ? "preview" : "edit"} onValueChange={(v) => setSearchParams(v === "preview" ? { tab: "preview" } : {}, { replace: true })}>
        <TabsList>
          <TabsTrigger value="edit">Modifier</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <div className="border rounded-lg bg-white px-4 sm:px-8 py-10">
            <GeneratedArticleView post={{ ...form, published_at: form.published_at || new Date().toISOString() }} preview />
          </div>
        </TabsContent>

        <TabsContent value="edit" className="mt-4 space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Titre (H1)</Label>
              <Input dir={dir} value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div>
              <div className="flex justify-between"><Label>Titre SEO</Label><Counter value={form.seo_title || ""} max={60} /></div>
              <Input dir={dir} value={form.seo_title || ""} onChange={(e) => set({ seo_title: e.target.value })} />
            </div>
            <div>
              <Label>Adresse (slug)</Label>
              <Input dir={dir} value={form.slug} onChange={(e) => set({ slug: e.target.value })} disabled={post.pipeline_status === "published"} />
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-between"><Label>Meta description</Label><Counter value={form.meta_description || ""} max={155} /></div>
              <Textarea dir={dir} rows={2} value={form.meta_description || ""} onChange={(e) => set({ meta_description: e.target.value })} />
            </div>
            <div>
              <Label>Mot-clé principal</Label>
              <Input dir={dir} value={form.primary_keyword || ""} onChange={(e) => set({ primary_keyword: e.target.value })} />
            </div>
            <div>
              <Label>Mots-clés secondaires (virgules)</Label>
              <Input dir={dir} value={(form.secondary_keywords || []).join(", ")} onChange={(e) => set({ secondary_keywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
            </div>
          </div>

          <div>
            <Label>Intro (40 à 60 mots)</Label>
            <Textarea dir={dir} rows={3} value={form.intro || ""} onChange={(e) => set({ intro: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Liens : [texte](/experience/slug). Gras : **texte**.</p>
          </div>

          <div className="space-y-4">
            <Label>Sections (H2)</Label>
            {form.body.map((section, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input dir={dir} value={section.heading} onChange={(e) => set({ body: form.body.map((s, j) => (j === i ? { ...s, heading: e.target.value } : s)) })} />
                  <Button variant="ghost" size="sm" onClick={() => set({ body: form.body.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea dir={dir} rows={6} value={paragraphsToText(section.paragraphs)} onChange={(e) => set({ body: form.body.map((s, j) => (j === i ? { ...s, paragraphs: textToParagraphs(e.target.value) } : s)) })} />
                <Textarea dir={dir} rows={2} placeholder="Puces (une par ligne, facultatif)" value={(section.bullets || []).join("\n")} onChange={(e) => set({ body: form.body.map((s, j) => (j === i ? { ...s, bullets: lines(e.target.value) } : s)) })} />
                <Textarea dir={dir} rows={3} placeholder="Paragraphes après les puces (facultatif, séparés par une ligne vide)" value={paragraphsToText(section.paragraphs_after || [])} onChange={(e) => set({ body: form.body.map((s, j) => (j === i ? { ...s, paragraphs_after: textToParagraphs(e.target.value) } : s)) })} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => set({ body: [...form.body, { heading: "", paragraphs: [] }] })}><Plus className="w-4 h-4 mr-1" />Section</Button>
            <p className="text-xs text-muted-foreground">Paragraphes séparés par une ligne vide.</p>
          </div>

          <div className="space-y-2">
            <Label>Bloc « À réserver » : phrase d'introduction</Label>
            <Textarea dir={dir} rows={2} value={form.booking_intro || ""} onChange={(e) => set({ booking_intro: e.target.value })} />
            <p className="text-sm text-muted-foreground">Fiches affichées en cartes :</p>
            <ul className="text-sm space-y-1">
              {(form.linked_listings || []).map((l, i) => (
                <li key={l.id} className="flex items-center gap-2">
                  <Link to={l.path} target="_blank" className="underline">{l.path}</Link>
                  <Button variant="ghost" size="sm" onClick={() => set({ linked_listings: (form.linked_listings || []).filter((_, j) => j !== i) })}><Trash2 className="w-3 h-3" /></Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Label>FAQ</Label>
            {(form.faq || []).map((f, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <Input dir={dir} value={f.question} onChange={(e) => set({ faq: (form.faq || []).map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} />
                  <Button variant="ghost" size="sm" onClick={() => set({ faq: (form.faq || []).filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea dir={dir} rows={3} value={f.answer} onChange={(e) => set({ faq: (form.faq || []).map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => set({ faq: [...(form.faq || []), { question: "", answer: "" }] })}><Plus className="w-4 h-4 mr-1" />Question</Button>
          </div>

          <div>
            <Label>Conclusion</Label>
            <Textarea dir={dir} rows={3} value={form.conclusion || ""} onChange={(e) => set({ conclusion: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Image de couverture (adresse)</Label>
              <Input value={form.cover_image || ""} onChange={(e) => set({ cover_image: e.target.value })} />
              {form.cover_image && <img src={form.cover_image} alt="" className="mt-2 rounded w-full max-w-xs aspect-video object-cover" />}
            </div>
            <div>
              <Label>Texte alternatif de l'image</Label>
              <Input dir={dir} value={form.cover_alt || ""} onChange={(e) => set({ cover_alt: e.target.value })} />
              <Label className="mt-4 block">Groupe de sujet (hreflang)</Label>
              <Input value={form.topic_group || ""} onChange={(e) => set({ topic_group: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Points à vérifier (un par ligne)</Label>
            <Textarea rows={4} value={(form.to_verify || []).join("\n")} onChange={(e) => set({ to_verify: lines(e.target.value) })} />
          </div>

          <Button onClick={save} disabled={!!busy}>Enregistrer</Button>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "publish" && "Publier cet article maintenant ?"}
              {confirm === "reject" && "Rejeter cet article ?"}
              {confirm === "unpublish" && "Retirer cet article du site ?"}
              {confirm === "regenerate" && "Régénérer cet article ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "publish" && "Tes modifications sont enregistrées, puis l'article est mis en ligne tout de suite et signalé à Bing."}
              {confirm === "reject" && "Il ne sera jamais publié. Tu pourras le régénérer plus tard."}
              {confirm === "unpublish" && "Il redevient un brouillon et disparaît du site et du plan du site."}
              {confirm === "regenerate" && "Le texte actuel (et tes modifications non enregistrées) seront remplacés par une nouvelle rédaction."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirm === "publish") publishNow();
                if (confirm === "reject") reject();
                if (confirm === "unpublish") unpublish();
                if (confirm === "regenerate") regenerate();
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JournalArticleEditor;
