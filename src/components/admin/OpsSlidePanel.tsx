import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, X, ChevronLeft, Phone, Globe, ShoppingCart, Calendar, Check } from "lucide-react";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────

type ProviderType = "call" | "web" | "booking" | "purchase";
type ActionType = "manual" | "auto";
type TicketStatus = "pending" | "in_progress" | "done" | "failed";

interface Provider {
  name: string;
  type: ProviderType;
  contact?: string;
  url?: string;
  price_range?: string;
  notes?: string;
  is_backup?: boolean;
}

interface Step {
  order: number;
  label: string;
  action_type: ActionType;
}

interface ExperienceOps {
  id: string;
  experience_id: string;
  providers: Provider[];
  fulfillment_steps: Step[];
  auto_fulfillment_enabled: boolean;
}

interface OpsTicket {
  id: string;
  booking_id: string | null;
  experience_id: string | null;
  status: TicketStatus;
  steps_status: Record<string, boolean>;
  assigned_provider: Provider | null;
  confirmation_ref: string | null;
  confirmation_file_url: string | null;
  internal_notes: string | null;
  created_at: string;
}

interface Props {
  experienceId: string;
  experienceTitle: string;
  open: boolean;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PROVIDER_TYPE_ICONS: Record<ProviderType, React.ReactNode> = {
  call: <Phone className="h-3 w-3" />,
  web: <Globe className="h-3 w-3" />,
  booking: <Calendar className="h-3 w-3" />,
  purchase: <ShoppingCart className="h-3 w-3" />,
};

const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  call: "Appel",
  web: "Web",
  booking: "Réservation",
  purchase: "Achat",
};

const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  done: { label: "Traité", className: "bg-green-100 text-green-700" },
  failed: { label: "Échoué", className: "bg-red-100 text-red-700" },
};

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const cfg = TICKET_STATUS_CONFIG[status] || TICKET_STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function emptyProvider(): Provider {
  return { name: "", type: "call", contact: "", url: "", price_range: "", notes: "", is_backup: false };
}

function emptyStep(order: number): Step {
  return { order, label: "", action_type: "manual" };
}

// ── Main component ──────────────────────────────────────────────────────────

export function OpsSlidePanel({ experienceId, experienceTitle, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editProviders, setEditProviders] = useState<Provider[]>([]);
  const [editSteps, setEditSteps] = useState<Step[]>([]);
  const [editAutoEnabled, setEditAutoEnabled] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: opsData, isLoading: opsLoading } = useQuery({
    queryKey: ["experience-ops", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_ops" as any)
        .select("*")
        .eq("experience_id", experienceId)
        .maybeSingle();
      if (error) throw error;
      return data as ExperienceOps | null;
    },
    enabled: open,
  });

  const { data: tickets } = useQuery({
    queryKey: ["ops-tickets", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_ops_ticket" as any)
        .select("*")
        .eq("experience_id", experienceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OpsTicket[];
    },
    enabled: open,
  });

  const selectedTicket = tickets?.find((t) => t.id === selectedTicketId) ?? null;

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        experience_id: experienceId,
        providers: editProviders,
        fulfillment_steps: editSteps.map((s, i) => ({ ...s, order: i + 1 })),
        auto_fulfillment_enabled: editAutoEnabled,
      };
      if (opsData?.id) {
        const { error } = await supabase.from("experience_ops" as any).update(payload).eq("id", opsData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("experience_ops" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience-ops", experienceId] });
      toast.success("Template Ops enregistré");
      setIsEditingTemplate(false);
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (patch: Partial<OpsTicket>) => {
      const { error } = await supabase
        .from("booking_ops_ticket" as any)
        .update(patch)
        .eq("id", selectedTicketId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-tickets", experienceId] });
      toast.success("Ticket mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("booking_ops_ticket" as any).insert({
        experience_id: experienceId,
        status: "pending",
        steps_status: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-tickets", experienceId] });
      toast.success("Ticket créé");
    },
    onError: () => toast.error("Erreur lors de la création du ticket"),
  });

  // ── Template tab helpers ──────────────────────────────────────────────────

  const startEditing = () => {
    setEditProviders(opsData?.providers ? JSON.parse(JSON.stringify(opsData.providers)) : []);
    setEditSteps(opsData?.fulfillment_steps ? JSON.parse(JSON.stringify(opsData.fulfillment_steps)) : []);
    setEditAutoEnabled(opsData?.auto_fulfillment_enabled ?? false);
    setIsEditingTemplate(true);
  };

  const cancelEditing = () => setIsEditingTemplate(false);

  // ── Ticket detail helpers ─────────────────────────────────────────────────

  const steps: Step[] = opsData?.fulfillment_steps ?? [];

  const toggleStep = (stepOrder: number, checked: boolean) => {
    if (!selectedTicket) return;
    const newStatus = { ...selectedTicket.steps_status, [stepOrder]: checked };
    updateTicketMutation.mutate({ steps_status: newStatus });
  };

  const markDone = () => updateTicketMutation.mutate({ status: "done" });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[360px] p-0 flex flex-col overflow-hidden"
        style={{ borderLeft: "0.5px solid #E8E4DD" }}
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: "#E8E4DD" }}>
          <SheetTitle className="text-sm font-semibold truncate">{experienceTitle}</SheetTitle>
          <p className="text-xs text-muted-foreground -mt-1">Panneau Ops</p>
        </SheetHeader>

        <Tabs defaultValue="template" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="mx-4 mt-3 mb-0 shrink-0 grid grid-cols-2">
            <TabsTrigger value="template" className="text-xs">Template</TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs">
              Tickets {tickets && tickets.length > 0 && `(${tickets.length})`}
            </TabsTrigger>
          </TabsList>

          {/* ═══ TEMPLATE TAB ═══ */}
          <TabsContent value="template" className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-5 mt-0">
            {opsLoading ? (
              <p className="text-xs text-muted-foreground">Chargement...</p>
            ) : !isEditingTemplate ? (
              /* ── Read mode ── */
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prestataires</p>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={startEditing}>
                    <Edit2 className="h-3 w-3" /> Éditer
                  </Button>
                </div>

                {!opsData?.providers?.length ? (
                  <p className="text-xs text-muted-foreground italic">Aucun prestataire configuré</p>
                ) : (
                  <div className="space-y-2">
                    {opsData.providers.map((p, i) => (
                      <div key={i} className="rounded border p-2.5 text-xs space-y-1" style={{ borderColor: "#E8E4DD", background: "#FAF8F4" }}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold">{p.name}</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1A1814]/10 text-[10px] font-medium">
                            {PROVIDER_TYPE_ICONS[p.type]}
                            {PROVIDER_TYPE_LABELS[p.type]}
                          </span>
                          {p.is_backup && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Backup</span>
                          )}
                        </div>
                        {(p.contact || p.url) && (
                          <p className="text-muted-foreground">{p.contact || p.url}</p>
                        )}
                        {p.price_range && <p className="text-muted-foreground">Prix : {p.price_range}</p>}
                        {p.notes && <p className="text-muted-foreground italic">{p.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <Separator style={{ borderColor: "#E8E4DD" }} />

                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Procédure</p>
                {!opsData?.fulfillment_steps?.length ? (
                  <p className="text-xs text-muted-foreground italic">Aucune étape configurée</p>
                ) : (
                  <ol className="space-y-2">
                    {opsData.fulfillment_steps.map((s) => (
                      <li key={s.order} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#1A1814] text-white">
                          {s.order}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <span>{s.label}</span>
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${s.action_type === "auto" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                            {s.action_type === "auto" ? "Auto" : "Manuel"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                <Separator style={{ borderColor: "#E8E4DD" }} />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Fulfillment automatique</p>
                    <p className="text-[11px] text-muted-foreground">Crée un ticket à chaque réservation</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!opsData) return;
                      saveTemplateMutation.mutate();
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      opsData?.auto_fulfillment_enabled ? "bg-[#1A1814]" : "bg-gray-200"
                    }`}
                    title={opsData?.auto_fulfillment_enabled ? "Désactiver" : "Activer"}
                    onClick={() => {
                      startEditing();
                      setEditAutoEnabled(!opsData?.auto_fulfillment_enabled);
                      setTimeout(() => saveTemplateMutation.mutate(), 50);
                    }}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        opsData?.auto_fulfillment_enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </>
            ) : (
              /* ── Edit mode ── */
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prestataires</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => setEditProviders([...editProviders, emptyProvider()])}
                  >
                    <Plus className="h-3 w-3" /> Ajouter
                  </Button>
                </div>

                {editProviders.map((p, i) => (
                  <div key={i} className="rounded border p-3 space-y-2 text-xs" style={{ borderColor: "#E8E4DD", background: "#FAF8F4" }}>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nom du prestataire"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...editProviders];
                          next[i] = { ...next[i], name: e.target.value };
                          setEditProviders(next);
                        }}
                        className="h-7 text-xs flex-1"
                      />
                      <button
                        onClick={() => setEditProviders(editProviders.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Select value={p.type} onValueChange={(v) => {
                        const next = [...editProviders];
                        next[i] = { ...next[i], type: v as ProviderType };
                        setEditProviders(next);
                      }}>
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Appel</SelectItem>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="booking">Réservation</SelectItem>
                          <SelectItem value="purchase">Achat</SelectItem>
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!p.is_backup}
                          onChange={(e) => {
                            const next = [...editProviders];
                            next[i] = { ...next[i], is_backup: e.target.checked };
                            setEditProviders(next);
                          }}
                          className="h-3 w-3"
                        />
                        Backup
                      </label>
                    </div>

                    <Input
                      placeholder="Contact (email / tel)"
                      value={p.contact || ""}
                      onChange={(e) => {
                        const next = [...editProviders];
                        next[i] = { ...next[i], contact: e.target.value };
                        setEditProviders(next);
                      }}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="URL"
                      value={p.url || ""}
                      onChange={(e) => {
                        const next = [...editProviders];
                        next[i] = { ...next[i], url: e.target.value };
                        setEditProviders(next);
                      }}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="Fourchette de prix"
                      value={p.price_range || ""}
                      onChange={(e) => {
                        const next = [...editProviders];
                        next[i] = { ...next[i], price_range: e.target.value };
                        setEditProviders(next);
                      }}
                      className="h-7 text-xs"
                    />
                    <Input
                      placeholder="Notes"
                      value={p.notes || ""}
                      onChange={(e) => {
                        const next = [...editProviders];
                        next[i] = { ...next[i], notes: e.target.value };
                        setEditProviders(next);
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}

                <Separator style={{ borderColor: "#E8E4DD" }} />

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Étapes</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => setEditSteps([...editSteps, emptyStep(editSteps.length + 1)])}
                  >
                    <Plus className="h-3 w-3" /> Ajouter
                  </Button>
                </div>

                {editSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 mt-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#1A1814]/10 text-[#1A1814]">
                      {i + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Intitulé de l'étape"
                        value={s.label}
                        onChange={(e) => {
                          const next = [...editSteps];
                          next[i] = { ...next[i], label: e.target.value };
                          setEditSteps(next);
                        }}
                        className="h-7 text-xs"
                      />
                      <Select value={s.action_type} onValueChange={(v) => {
                        const next = [...editSteps];
                        next[i] = { ...next[i], action_type: v as ActionType };
                        setEditSteps(next);
                      }}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manuel</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      onClick={() => setEditSteps(editSteps.filter((_, j) => j !== i))}
                      className="mt-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <Separator style={{ borderColor: "#E8E4DD" }} />

                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Fulfillment automatique</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-muted-foreground">{editAutoEnabled ? "Activé" : "Désactivé"}</span>
                    <button
                      type="button"
                      onClick={() => setEditAutoEnabled(!editAutoEnabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editAutoEnabled ? "bg-[#1A1814]" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${editAutoEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1 bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
                    onClick={() => saveTemplateMutation.mutate()}
                    disabled={saveTemplateMutation.isPending}
                  >
                    <Save className="h-3 w-3" />
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={cancelEditing}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══ TICKETS TAB ═══ */}
          <TabsContent value="tickets" className="flex-1 overflow-y-auto mt-0">
            {selectedTicketId && selectedTicket ? (
              /* ── Ticket detail ── */
              <TicketDetail
                ticket={selectedTicket}
                steps={steps}
                providers={opsData?.providers ?? []}
                onBack={() => setSelectedTicketId(null)}
                onToggleStep={toggleStep}
                onMarkDone={markDone}
                onUpdate={(patch) => updateTicketMutation.mutate(patch)}
              />
            ) : (
              /* ── Ticket list ── */
              <div className="px-4 pt-4 pb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tickets ({tickets?.length ?? 0})
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => createTicketMutation.mutate()}
                    disabled={createTicketMutation.isPending}
                  >
                    <Plus className="h-3 w-3" /> Nouveau
                  </Button>
                </div>

                {!tickets?.length ? (
                  <p className="text-xs text-muted-foreground italic">Aucun ticket pour cette expérience.</p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        className="w-full text-left rounded border p-3 hover:bg-muted/30 transition-colors"
                        style={{ borderColor: "#E8E4DD" }}
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {ticket.booking_id ? ticket.booking_id.substring(0, 8) + "…" : "Sans réservation"}
                          </span>
                          <TicketStatusBadge status={ticket.status} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}
                        </p>
                        {steps.length > 0 && (
                          <div className="mt-1.5 flex gap-1">
                            {steps.map((s) => (
                              <div
                                key={s.order}
                                className={`h-1.5 flex-1 rounded-full ${ticket.steps_status[s.order] ? "bg-green-400" : "bg-gray-200"}`}
                                title={s.label}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ── Ticket detail sub-component ─────────────────────────────────────────────

function TicketDetail({
  ticket,
  steps,
  providers,
  onBack,
  onToggleStep,
  onMarkDone,
  onUpdate,
}: {
  ticket: OpsTicket;
  steps: Step[];
  providers: Provider[];
  onBack: () => void;
  onToggleStep: (order: number, checked: boolean) => void;
  onMarkDone: () => void;
  onUpdate: (patch: Partial<OpsTicket>) => void;
}) {
  const [ref, setRef] = useState(ticket.confirmation_ref ?? "");
  const [fileUrl, setFileUrl] = useState(ticket.confirmation_file_url ?? "");
  const [notes, setNotes] = useState(ticket.internal_notes ?? "");
  const [selectedProvider, setSelectedProvider] = useState<string>(
    ticket.assigned_provider?.name ?? "__none__"
  );

  const doneSteps = steps.filter((s) => ticket.steps_status[s.order]).length;
  const allDone = steps.length > 0 && doneSteps === steps.length;

  const handleSave = () => {
    const assigned = providers.find((p) => p.name === selectedProvider) ?? null;
    onUpdate({
      confirmation_ref: ref || null,
      confirmation_file_url: fileUrl || null,
      internal_notes: notes || null,
      assigned_provider: assigned,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 border-b shrink-0 flex items-center gap-2" style={{ borderColor: "#E8E4DD" }}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium">
          {ticket.booking_id ? `Réservation ${ticket.booking_id.substring(0, 8)}…` : "Ticket sans réservation"}
        </span>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-5">
        {/* Steps */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Avancement ({doneSteps}/{steps.length})
            </p>
            {steps.map((s) => (
              <label key={s.order} className="flex items-start gap-2 cursor-pointer">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={!!ticket.steps_status[s.order]}
                    onChange={(e) => onToggleStep(s.order, e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#1A1814]"
                  />
                </div>
                <div className="flex-1 text-xs">
                  <span className={ticket.steps_status[s.order] ? "line-through text-muted-foreground" : ""}>
                    {s.order}. {s.label}
                  </span>
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${s.action_type === "auto" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.action_type === "auto" ? "Auto" : "Manuel"}
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}

        <Separator style={{ borderColor: "#E8E4DD" }} />

        {/* Assigned provider */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prestataire</p>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Choisir un prestataire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Aucun</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name} {p.is_backup ? "(Backup)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Confirmation ref */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Référence confirmation</p>
          <Input
            placeholder="N° de confirmation, email, lien..."
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        {/* File URL */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fichier (URL)</p>
          <Input
            placeholder="Colle ici l'URL du fichier"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="h-8 text-xs"
          />
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 underline">
              Ouvrir le fichier
            </a>
          )}
        </div>

        {/* Internal notes */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes internes</p>
          <Textarea
            placeholder="Remarques, obstacles, contexte..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="text-xs resize-none"
            style={{ background: "#FAF8F4", border: "1px solid #E8E0D4" }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs gap-1 bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
            onClick={handleSave}
          >
            <Save className="h-3 w-3" /> Enregistrer
          </Button>
          {ticket.status !== "done" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs gap-1 border-green-500 text-green-700 hover:bg-green-50"
              onClick={onMarkDone}
            >
              <Check className="h-3 w-3" /> Marquer traité
            </Button>
          )}
        </div>

        {ticket.status === "done" && (
          <div className="flex items-center gap-1.5 text-xs text-green-700">
            <Check className="h-3.5 w-3.5" />
            Ticket traité
          </div>
        )}
      </div>
    </div>
  );
}
