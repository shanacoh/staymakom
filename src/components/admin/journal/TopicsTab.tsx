// Onglet « File de sujets » : liste des sujets du blog automatique, ajout, modification,
// priorité (monter / descendre), écarter ou remettre à faire, générer un sujet tout de suite.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Ban, Loader2, Pencil, Plus, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LANG_LABELS, TOPIC_STATUS_LABELS, TOPIC_TYPES, startGeneration, waitForRun } from "./journalAdmin";

interface Topic {
  id?: string;
  lang: string;
  primary_keyword: string;
  monthly_volume: number | null;
  difficulty: number | null;
  topic_type: string;
  working_title: string;
  angle: string | null;
  link_regions: string[];
  link_moods: string[];
  link_cities: string[];
  link_note: string | null;
  desired_date: string | null;
  priority: number;
  status: string;
  topic_group: string | null;
}

const EMPTY: Topic = {
  lang: "en",
  primary_keyword: "",
  monthly_volume: null,
  difficulty: null,
  topic_type: "guide",
  working_title: "",
  angle: null,
  link_regions: [],
  link_moods: [],
  link_cities: [],
  link_note: null,
  desired_date: null,
  priority: 100,
  status: "a_faire",
  topic_group: null,
};

const toList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function TopicsTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [langFilter, setLangFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("a_faire");
  const [editing, setEditing] = useState<Topic | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { data: topics, isLoading } = useQuery({
    queryKey: ["admin-blog-topics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_topics" as any).select("*").order("priority").order("monthly_volume", { ascending: false });
      if (error) throw error;
      return data as unknown as Topic[];
    },
  });
  const { data: regions } = useQuery({
    queryKey: ["admin-regions-slugs"],
    queryFn: async () => (await supabase.from("regions").select("slug,name").order("display_order")).data || [],
  });
  const { data: moods } = useQuery({
    queryKey: ["admin-moods-slugs"],
    queryFn: async () => (await supabase.from("categories").select("slug,name").order("display_order")).data || [],
  });

  const visible = useMemo(
    () => (topics || []).filter((t) => (langFilter === "all" || t.lang === langFilter) && (statusFilter === "all" || t.status === statusFilter)),
    [topics, langFilter, statusFilter]
  );
  const todoCount = (topics || []).filter((t) => t.status === "a_faire").length;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-blog-topics"] });

  const save = useMutation({
    mutationFn: async (t: Topic) => {
      const { id, ...fields } = t;
      const res = id
        ? await supabase.from("blog_topics" as any).update(fields).eq("id", id)
        : await supabase.from("blog_topics" as any).insert(fields);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      refresh();
      setEditing(null);
      toast.success("Sujet enregistré");
    },
    onError: (e: any) => toast.error(e?.code === "23505" ? "Ce mot-clé existe déjà dans cette langue" : e?.message || "Erreur"),
  });

  const patch = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<Topic> }) => {
      const { error } = await supabase.from("blog_topics" as any).update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error("Mise à jour impossible"),
  });

  // Monter / descendre : échange de priorité avec le voisin de la même langue.
  const move = (topic: Topic, direction: -1 | 1) => {
    const sameLang = (topics || []).filter((t) => t.lang === topic.lang && t.status === "a_faire");
    const index = sameLang.findIndex((t) => t.id === topic.id);
    const other = sameLang[index + direction];
    if (!other) return;
    const a = topic.priority === other.priority ? topic.priority + direction : other.priority;
    const b = topic.priority === other.priority ? other.priority : topic.priority;
    patch.mutate({ id: topic.id!, fields: { priority: a } });
    patch.mutate({ id: other.id!, fields: { priority: b } });
  };

  const generate = async (topic: Topic) => {
    setGeneratingId(topic.id!);
    try {
      const runId = await startGeneration({ topic_id: topic.id });
      toast.info("Rédaction en cours (1 à 3 minutes)...");
      const run = await waitForRun(runId);
      refresh();
      if (run.status === "failed") toast.error(run.error || "La génération n'a pas abouti");
      else if (run.post_id) navigate(`/admin/journal/article/${run.post_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes langues</SelectItem>
            <SelectItem value="en">Anglais</SelectItem>
            <SelectItem value="he">Hébreu</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(TOPIC_STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className={`text-sm ${todoCount < 10 ? "text-red-700 font-medium" : "text-muted-foreground"}`}>
          {todoCount} sujet(s) à faire{todoCount < 10 ? " : pense à en ajouter" : ""}
        </span>
        <Button size="sm" className="sm:ml-auto" onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="w-4 h-4 mr-1.5" />
          Ajouter un sujet
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>Mot-clé / titre de travail</TableHead>
                <TableHead>Langue</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vol. / KD</TableHead>
                <TableHead>Date souhaitée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-[340px]">
                    <p className="font-medium" dir={t.lang === "he" ? "rtl" : undefined}>
                      {t.primary_keyword}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1" dir={t.lang === "he" ? "rtl" : undefined}>
                      {t.working_title}
                    </p>
                  </TableCell>
                  <TableCell>{LANG_LABELS[t.lang]}</TableCell>
                  <TableCell className="capitalize">{t.topic_type}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {t.monthly_volume ?? "n.d."} / {t.difficulty ?? "n.d."}
                  </TableCell>
                  <TableCell>{t.desired_date || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TOPIC_STATUS_LABELS[t.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {t.status === "a_faire" && (
                        <>
                          <Button variant="ghost" size="sm" title="Monter" onClick={() => move(t, -1)}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Descendre" onClick={() => move(t, 1)}>
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Générer maintenant" disabled={!!generatingId} onClick={() => generate(t)}>
                            {generatingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" title="Modifier" onClick={() => setEditing(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {t.status === "ecarte" ? (
                        <Button variant="ghost" size="sm" title="Remettre à faire" onClick={() => patch.mutate({ id: t.id!, fields: { status: "a_faire" } })}>
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      ) : t.status === "a_faire" ? (
                        <Button variant="ghost" size="sm" title="Écarter" onClick={() => patch.mutate({ id: t.id!, fields: { status: "ecarte" } })}>
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun sujet avec ces filtres
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier le sujet" : "Nouveau sujet"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Langue</Label>
                <Select value={editing.lang} onValueChange={(v) => setEditing({ ...editing, lang: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">Anglais</SelectItem>
                    <SelectItem value="he">Hébreu</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editing.topic_type} onValueChange={(v) => setEditing({ ...editing, topic_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPIC_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Mot-clé principal</Label>
                <Input value={editing.primary_keyword} onChange={(e) => setEditing({ ...editing, primary_keyword: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Titre de travail</Label>
                <Input value={editing.working_title} onChange={(e) => setEditing({ ...editing, working_title: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Angle (facultatif)</Label>
                <Textarea rows={2} value={editing.angle || ""} onChange={(e) => setEditing({ ...editing, angle: e.target.value || null })} />
              </div>
              <div>
                <Label>Volume mensuel</Label>
                <Input type="number" value={editing.monthly_volume ?? ""} onChange={(e) => setEditing({ ...editing, monthly_volume: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label>Difficulté (KD sur 100)</Label>
                <Input type="number" value={editing.difficulty ?? ""} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Régions à lier (séparées par des virgules)</Label>
                <Input value={editing.link_regions.join(", ")} onChange={(e) => setEditing({ ...editing, link_regions: toList(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">Possibles : {(regions || []).map((r: any) => r.slug).join(", ")}. Vide = toutes régions.</p>
              </div>
              <div className="sm:col-span-2">
                <Label>Moods à lier</Label>
                <Input value={editing.link_moods.join(", ")} onChange={(e) => setEditing({ ...editing, link_moods: toList(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">Possibles : {(moods || []).map((m: any) => m.slug).join(", ")}</p>
              </div>
              <div>
                <Label>Villes à lier</Label>
                <Input value={editing.link_cities.join(", ")} onChange={(e) => setEditing({ ...editing, link_cities: toList(e.target.value) })} />
              </div>
              <div>
                <Label>Date de publication souhaitée</Label>
                <Input type="date" value={editing.desired_date || ""} onChange={(e) => setEditing({ ...editing, desired_date: e.target.value || null })} />
              </div>
              <div>
                <Label>Priorité (plus petit = plus tôt)</Label>
                <Input type="number" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) || 100 })} />
              </div>
              <div>
                <Label>Groupe de sujet (relie 2 langues)</Label>
                <Input value={editing.topic_group || ""} onChange={(e) => setEditing({ ...editing, topic_group: e.target.value.trim() || null })} placeholder="ex. tel-aviv-things-to-do" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button
              disabled={!editing?.primary_keyword.trim() || !editing?.working_title.trim() || save.isPending}
              onClick={() => editing && save.mutate(editing)}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
