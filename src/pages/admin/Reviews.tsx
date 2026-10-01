import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pin, Eye, EyeOff, Link2, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trackReviewPublished } from "@/lib/analytics";

type ModerationStatus = "pending" | "published" | "hidden";
type Scope = "standalone_experience" | "experience2" | "brand" | "unassigned";
type Source = "auto_link" | "manual_whatsapp" | "manual_email" | "manual_google" | "manual_oral" | "legacy_placeholder";

interface ReviewRow {
  id: string;
  scope: Scope;
  standalone_experience_id: string | null;
  experience2_id: string | null;
  customer_first_name: string;
  customer_last_initial: string | null;
  rating: number | null;
  comment: string | null;
  consent_to_publish: boolean;
  moderation_status: ModerationStatus;
  hidden_reason: string | null;
  is_pinned: boolean;
  staff_reply: string | null;
  source: Source;
  review_date: string | null;
  booking_id: string | null;
  created_at: string;
}

type FilterTab = "pending" | "published" | "hidden" | "unassigned" | "all";

const SOURCE_LABELS: Record<Source, string> = {
  auto_link: "Lien automatique",
  manual_whatsapp: "WhatsApp",
  manual_email: "Email",
  manual_google: "Google",
  manual_oral: "Oral",
  legacy_placeholder: "Ancien système (non fiable)",
};

const SCOPE_LABELS: Record<Scope, string> = {
  standalone_experience: "Expérience standalone",
  experience2: "Hôtel + expérience",
  brand: "Marque (STAYMAKOM)",
  unassigned: "À rattacher",
};

type NewReviewForm = {
  scope: Scope;
  experienceId: string;
  customer_first_name: string;
  customer_last_initial: string;
  rating: string;
  comment: string;
  source: Source;
  review_date: string;
  consent_to_publish: boolean;
};

const emptyForm: NewReviewForm = {
  scope: "unassigned",
  experienceId: "",
  customer_first_name: "",
  customer_last_initial: "",
  rating: "",
  comment: "",
  source: "manual_whatsapp",
  review_date: "",
  consent_to_publish: false,
};

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FilterTab>("pending");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<NewReviewForm>(emptyForm);
  const [hideDialogReview, setHideDialogReview] = useState<ReviewRow | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [replyDialogReview, setReplyDialogReview] = useState<ReviewRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [attachDialogReview, setAttachDialogReview] = useState<ReviewRow | null>(null);
  const [attachScope, setAttachScope] = useState<Scope>("standalone_experience");
  const [attachExperienceId, setAttachExperienceId] = useState("");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ReviewRow[];
    },
  });

  const { data: standaloneExperiences } = useQuery({
    queryKey: ["admin-reviews-standalone-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id, title_fr, title")
        .order("title_fr");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: experiences2 } = useQuery({
    queryKey: ["admin-reviews-experience2-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select("id, title_fr, title")
        .order("title_fr");
      if (error) throw error;
      return data || [];
    },
  });

  const experienceTitle = (row: ReviewRow) => {
    if (row.scope === "standalone_experience") {
      const exp = standaloneExperiences?.find((e) => e.id === row.standalone_experience_id);
      return exp ? (exp.title_fr || exp.title) : "Expérience introuvable";
    }
    if (row.scope === "experience2") {
      const exp = experiences2?.find((e) => e.id === row.experience2_id);
      return exp ? (exp.title_fr || exp.title) : "Fiche introuvable";
    }
    if (row.scope === "brand") return "STAYMAKOM (marque)";
    return "—";
  };

  const filtered = useMemo(() => {
    if (!reviews) return [];
    if (tab === "all") return reviews;
    if (tab === "unassigned") return reviews.filter((r) => r.scope === "unassigned");
    return reviews.filter((r) => r.moderation_status === tab);
  }, [reviews, tab]);

  const pendingCount = reviews?.filter((r) => r.moderation_status === "pending").length || 0;

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        scope: form.scope,
        customer_first_name: form.customer_first_name.trim(),
        customer_last_initial: form.customer_last_initial.trim() || null,
        rating: form.rating ? Number(form.rating) : null,
        comment: form.comment.trim() || null,
        source: form.source,
        review_date: form.review_date || null,
        consent_to_publish: form.consent_to_publish,
        moderation_status: "pending",
      };
      if (form.scope === "standalone_experience") payload.standalone_experience_id = form.experienceId || null;
      if (form.scope === "experience2") payload.experience2_id = form.experienceId || null;
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Avis ajouté");
      setFormOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message || "Erreur lors de l'ajout"),
  });

  const publishMutation = useMutation({
    mutationFn: async (review: ReviewRow) => {
      if (!review.consent_to_publish) {
        throw new Error("Impossible de publier : l'accord de publication n'est pas coché.");
      }
      const { error } = await supabase
        .from("reviews")
        .update({ moderation_status: "published", hidden_reason: null })
        .eq("id", review.id);
      if (error) throw error;
    },
    onSuccess: (_data, review) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      trackReviewPublished(review.scope);
      toast.success("Avis publié");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const hideMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ moderation_status: "hidden", hidden_reason: reason })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Avis masqué");
      setHideDialogReview(null);
      setHideReason("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_pinned: pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }),
    onError: (err: any) => toast.error(err.message),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ staff_reply: reply, staff_reply_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Réponse publiée");
      setReplyDialogReview(null);
      setReplyText("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const attachMutation = useMutation({
    mutationFn: async ({ id, scope, experienceId }: { id: string; scope: Scope; experienceId: string }) => {
      const payload: Record<string, unknown> = {
        scope,
        standalone_experience_id: scope === "standalone_experience" ? experienceId : null,
        experience2_id: scope === "experience2" ? experienceId : null,
      };
      const { error } = await supabase.from("reviews").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Avis rattaché");
      setAttachDialogReview(null);
      setAttachExperienceId("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Avis clients</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0 ? `${pendingCount} avis à modérer` : "Aucun avis en attente"}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un avis
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="pending">À modérer {pendingCount > 0 && `(${pendingCount})`}</TabsTrigger>
          <TabsTrigger value="published">Publiés</TabsTrigger>
          <TabsTrigger value="hidden">Masqués</TabsTrigger>
          <TabsTrigger value="unassigned">À rattacher</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Fiche</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Avis</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Accord</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Chargement…</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Aucun avis ici</TableCell></TableRow>
              )}
              {filtered.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {review.customer_first_name} {review.customer_last_initial}
                    {review.is_pinned && <Pin className="inline h-3 w-3 ml-1 text-amber-600" />}
                    {review.booking_id && <div className="text-[10px] text-green-700">Avis vérifié</div>}
                  </TableCell>
                  <TableCell className="text-xs max-w-[180px]">
                    <div className="text-muted-foreground">{SCOPE_LABELS[review.scope]}</div>
                    <div className="truncate">{experienceTitle(review)}</div>
                  </TableCell>
                  <TableCell>
                    {review.rating != null ? (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-foreground text-foreground" /> {review.rating}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                    <p className="line-clamp-2">{review.comment}</p>
                  </TableCell>
                  <TableCell className="text-xs">{SOURCE_LABELS[review.source]}</TableCell>
                  <TableCell>
                    {review.consent_to_publish ? (
                      <Badge variant="outline" className="text-green-700 border-green-300">Oui</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Non</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {review.moderation_status === "published" && <Badge className="bg-green-600">Publié</Badge>}
                    {review.moderation_status === "pending" && <Badge variant="secondary">À modérer</Badge>}
                    {review.moderation_status === "hidden" && <Badge variant="destructive">Masqué</Badge>}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-1">
                    {review.moderation_status !== "published" && (
                      <Button
                        size="icon" variant="ghost" title="Publier"
                        disabled={!review.consent_to_publish}
                        onClick={() => publishMutation.mutate(review)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {review.moderation_status !== "hidden" && (
                      <Button size="icon" variant="ghost" title="Masquer" onClick={() => setHideDialogReview(review)}>
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon" variant="ghost" title={review.is_pinned ? "Retirer la mise en avant" : "Mettre en avant"}
                      onClick={() => pinMutation.mutate({ id: review.id, pinned: !review.is_pinned })}
                    >
                      <Pin className={`h-4 w-4 ${review.is_pinned ? "text-amber-600" : ""}`} />
                    </Button>
                    <Button
                      size="icon" variant="ghost" title="Rattacher à une fiche"
                      onClick={() => { setAttachDialogReview(review); setAttachScope(review.scope === "unassigned" ? "standalone_experience" : review.scope); }}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Répondre publiquement" onClick={() => { setReplyDialogReview(review); setReplyText(review.staff_reply || ""); }}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ajouter un avis */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ajouter un avis</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prénom</Label>
                <Input value={form.customer_first_name} onChange={(e) => setForm({ ...form, customer_first_name: e.target.value })} />
              </div>
              <div>
                <Label>Initiale du nom</Label>
                <Input value={form.customer_last_initial} onChange={(e) => setForm({ ...form, customer_last_initial: e.target.value })} placeholder="Z" maxLength={2} />
              </div>
            </div>
            <div>
              <Label>Rattaché à</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v as Scope, experienceId: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">À rattacher plus tard</SelectItem>
                  <SelectItem value="standalone_experience">Expérience standalone</SelectItem>
                  <SelectItem value="experience2">Hôtel + expérience</SelectItem>
                  <SelectItem value="brand">STAYMAKOM en général</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.scope === "standalone_experience" && (
              <div>
                <Label>Expérience</Label>
                <Select value={form.experienceId} onValueChange={(v) => setForm({ ...form, experienceId: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir une expérience" /></SelectTrigger>
                  <SelectContent>
                    {standaloneExperiences?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.title_fr || e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.scope === "experience2" && (
              <div>
                <Label>Fiche hôtel + expérience</Label>
                <Select value={form.experienceId} onValueChange={(v) => setForm({ ...form, experienceId: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir une fiche" /></SelectTrigger>
                  <SelectContent>
                    {experiences2?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.title_fr || e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Note (optionnelle)</Label>
                <Select value={form.rating} onValueChange={(v) => setForm({ ...form, rating: v })}>
                  <SelectTrigger><SelectValue placeholder="Aucune note" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} / 5</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date de l'avis</Label>
                <Input type="date" value={form.review_date} onChange={(e) => setForm({ ...form, review_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as Source })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="manual_email">Email</SelectItem>
                  <SelectItem value="manual_google">Google</SelectItem>
                  <SelectItem value="manual_oral">Oral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Texte de l'avis</Label>
              <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} />
            </div>
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                checked={form.consent_to_publish}
                onCheckedChange={(v) => setForm({ ...form, consent_to_publish: !!v })}
                id="consent"
              />
              <Label htmlFor="consent" className="font-normal leading-snug">
                Accord de publication obtenu (sans cette case, l'avis reste enregistré mais ne pourra pas être publié)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button
              disabled={!form.customer_first_name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Masquer */}
      <Dialog open={!!hideDialogReview} onOpenChange={(open) => !open && setHideDialogReview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Masquer cet avis</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rappel : on ne masque jamais un avis parce qu'il est négatif, seulement s'il est injurieux, hors sujet, ou contient des données personnelles.
          </p>
          <Textarea value={hideReason} onChange={(e) => setHideReason(e.target.value)} placeholder="Raison du masquage" rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideDialogReview(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={!hideReason.trim()}
              onClick={() => hideDialogReview && hideMutation.mutate({ id: hideDialogReview.id, reason: hideReason.trim() })}
            >
              Masquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Répondre */}
      <Dialog open={!!replyDialogReview} onOpenChange={(open) => !open && setReplyDialogReview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Répondre publiquement</DialogTitle></DialogHeader>
          <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogReview(null)}>Annuler</Button>
            <Button onClick={() => replyDialogReview && replyMutation.mutate({ id: replyDialogReview.id, reply: replyText.trim() })}>
              Publier la réponse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rattacher */}
      <Dialog open={!!attachDialogReview} onOpenChange={(open) => !open && setAttachDialogReview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rattacher à une fiche</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={attachScope} onValueChange={(v) => { setAttachScope(v as Scope); setAttachExperienceId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standalone_experience">Expérience standalone</SelectItem>
                <SelectItem value="experience2">Hôtel + expérience</SelectItem>
                <SelectItem value="brand">STAYMAKOM en général</SelectItem>
              </SelectContent>
            </Select>
            {attachScope === "standalone_experience" && (
              <Select value={attachExperienceId} onValueChange={setAttachExperienceId}>
                <SelectTrigger><SelectValue placeholder="Choisir une expérience" /></SelectTrigger>
                <SelectContent>
                  {standaloneExperiences?.map((e) => <SelectItem key={e.id} value={e.id}>{e.title_fr || e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {attachScope === "experience2" && (
              <Select value={attachExperienceId} onValueChange={setAttachExperienceId}>
                <SelectTrigger><SelectValue placeholder="Choisir une fiche" /></SelectTrigger>
                <SelectContent>
                  {experiences2?.map((e) => <SelectItem key={e.id} value={e.id}>{e.title_fr || e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachDialogReview(null)}>Annuler</Button>
            <Button
              disabled={attachScope !== "brand" && !attachExperienceId}
              onClick={() => attachDialogReview && attachMutation.mutate({ id: attachDialogReview.id, scope: attachScope, experienceId: attachExperienceId })}
            >
              Rattacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
