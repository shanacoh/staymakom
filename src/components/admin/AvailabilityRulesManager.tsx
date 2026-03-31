import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Check, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RuleType = "days_of_week" | "date_range" | "specific_dates" | "blackout";
type OriginType = "experience" | "hotel";

interface AvailabilityRule {
  id: string;
  experience_id: string;
  origin: OriginType;
  rule_type: RuleType;
  days_of_week: number[] | null;
  date_from: string | null;
  date_to: string | null;
  specific_dates: string[] | null;
  label: string | null;
  label_he: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  origin: OriginType;
  rule_type: RuleType;
  days_of_week: number[];
  date_from: string;
  date_to: string;
  specific_dates: string; // comma-separated input
  label: string;
  label_he: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  origin: "experience",
  rule_type: "days_of_week",
  days_of_week: [],
  date_from: "",
  date_to: "",
  specific_dates: "",
  label: "",
  label_he: "",
  is_active: true,
};

const DAYS = [
  { value: 0, label: "Dim" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
];

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  days_of_week: "Jours de la semaine",
  date_range: "Période de dates",
  specific_dates: "Dates ponctuelles",
  blackout: "Dates bloquées",
};

const ORIGIN_LABELS: Record<OriginType, string> = {
  experience: "Expérience",
  hotel: "Imposé par l'hôtel",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRuleSummary(rule: AvailabilityRule): string {
  if (rule.rule_type === "days_of_week" && rule.days_of_week?.length) {
    const names = rule.days_of_week.map((d) => DAYS.find((x) => x.value === d)?.label ?? d).join(" · ");
    return names;
  }
  if ((rule.rule_type === "date_range" || rule.rule_type === "blackout") && rule.date_from && rule.date_to) {
    return `${formatDate(rule.date_from)} → ${formatDate(rule.date_to)}`;
  }
  if (rule.rule_type === "specific_dates" && rule.specific_dates?.length) {
    return rule.specific_dates.map(formatDate).join(", ");
  }
  return "—";
}

function formatDate(d: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function ruleToForm(rule: AvailabilityRule): FormState {
  return {
    origin: rule.origin,
    rule_type: rule.rule_type,
    days_of_week: rule.days_of_week ?? [],
    date_from: rule.date_from ?? "",
    date_to: rule.date_to ?? "",
    specific_dates: rule.specific_dates ? rule.specific_dates.join(", ") : "",
    label: rule.label ?? "",
    label_he: rule.label_he ?? "",
    is_active: rule.is_active,
  };
}

function formToPayload(form: FormState, experienceId: string) {
  return {
    experience_id: experienceId,
    origin: form.origin,
    rule_type: form.rule_type,
    days_of_week: form.rule_type === "days_of_week" ? form.days_of_week : null,
    date_from: (form.rule_type === "date_range" || form.rule_type === "blackout") ? form.date_from || null : null,
    date_to: (form.rule_type === "date_range" || form.rule_type === "blackout") ? form.date_to || null : null,
    specific_dates:
      form.rule_type === "specific_dates"
        ? form.specific_dates
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
    label: form.label || null,
    label_he: form.label_he || null,
    is_active: form.is_active,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  experienceId: string;
}

export default function AvailabilityRulesManager({ experienceId }: Props) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["availability_rules", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience2_availability_rules")
        .select("*")
        .eq("experience_id", experienceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as AvailabilityRule[];
    },
    enabled: !!experienceId,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["availability_rules", experienceId] });

  const addMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof formToPayload>) => {
      const { error } = await supabase.from("experience2_availability_rules").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Règle ajoutée"); invalidate(); setShowAddForm(false); setForm(EMPTY_FORM); },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ReturnType<typeof formToPayload> }) => {
      const { error } = await supabase.from("experience2_availability_rules").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Règle mise à jour"); invalidate(); setEditingId(null); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experience2_availability_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Règle supprimée"); invalidate(); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("experience2_availability_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("Erreur"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const startEdit = (rule: AvailabilityRule) => {
    setShowAddForm(false);
    setEditingId(rule.id);
    setForm(ruleToForm(rule));
  };

  const cancelEdit = () => { setEditingId(null); setShowAddForm(false); setForm(EMPTY_FORM); };

  const handleSave = (id?: string) => {
    const payload = formToPayload(form, experienceId);
    if (id) {
      updateMutation.mutate({ id, payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day].sort((a, b) => a - b),
    }));
  };

  // ── Rule Form ──────────────────────────────────────────────────────────────
  const renderForm = (id?: string) => (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Type de règle</Label>
          <Select value={form.rule_type} onValueChange={(v) => setForm((f) => ({ ...f, rule_type: v as RuleType }))}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Origin */}
        <div className="space-y-1.5">
          <Label className="text-xs">Imposé par</Label>
          <Select value={form.origin} onValueChange={(v) => setForm((f) => ({ ...f, origin: v as OriginType }))}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="experience">Cette expérience</SelectItem>
              <SelectItem value="hotel">L'hôtel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Days of week */}
      {form.rule_type === "days_of_week" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Jours disponibles</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-colors",
                  form.days_of_week.includes(d.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date range / blackout */}
      {(form.rule_type === "date_range" || form.rule_type === "blackout") && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Date de début</Label>
            <Input type="date" className="h-8 text-sm" value={form.date_from} onChange={(e) => setForm((f) => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date de fin</Label>
            <Input type="date" className="h-8 text-sm" value={form.date_to} onChange={(e) => setForm((f) => ({ ...f, date_to: e.target.value }))} />
          </div>
        </div>
      )}

      {/* Specific dates */}
      {form.rule_type === "specific_dates" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Dates (format AAAA-MM-JJ, séparées par des virgules)</Label>
          <Input
            className="h-8 text-sm font-mono"
            placeholder="2026-07-14, 2026-07-15, 2026-08-01"
            value={form.specific_dates}
            onChange={(e) => setForm((f) => ({ ...f, specific_dates: e.target.value }))}
          />
        </div>
      )}

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><span>🇬🇧</span> Message visiteur (EN)</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Available Wednesday to Friday"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><span>🇮🇱</span> Message visiteur (HE)</Label>
          <Input
            className="h-8 text-sm bg-hebrew-input"
            dir="rtl"
            placeholder="זמין מרביעי עד שישי"
            value={form.label_he}
            onChange={(e) => setForm((f) => ({ ...f, label_he: e.target.value }))}
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2">
        <Switch
          checked={form.is_active}
          onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
        />
        <Label className="text-xs">Règle active</Label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={cancelEdit} type="button">
          <X className="w-3.5 h-3.5 mr-1" /> Annuler
        </Button>
        <Button
          size="sm"
          type="button"
          onClick={() => handleSave(id)}
          disabled={addMutation.isPending || updateMutation.isPending}
        >
          <Check className="w-3.5 h-3.5 mr-1" /> {id ? "Mettre à jour" : "Ajouter"}
        </Button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span>Disponibilité de l'expérience</span>
        </div>
        {!showAddForm && editingId === null && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => { setShowAddForm(true); setForm(EMPTY_FORM); }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une règle
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && renderForm(undefined)}

      {/* List */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground py-2">Chargement…</p>
      ) : rules.length === 0 && !showAddForm ? (
        <p className="text-xs text-muted-foreground py-2 italic">
          Aucune règle de disponibilité. Cette expérience est accessible à toutes les dates.
        </p>
      ) : (
        <div className="divide-y border rounded-lg overflow-hidden">
          {rules.map((rule) => (
            <div key={rule.id}>
              {editingId === rule.id ? (
                <div className="p-3">{renderForm(rule.id)}</div>
              ) : (
                <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                  {/* Toggle */}
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(v) => toggleActiveMutation.mutate({ id: rule.id, is_active: v })}
                    className="mt-0.5 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium">{RULE_TYPE_LABELS[rule.rule_type]}</span>
                      <span className="text-xs text-muted-foreground">—</span>
                      <span className="text-xs text-muted-foreground">{formatRuleSummary(rule)}</span>
                      {rule.origin === "hotel" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">hôtel</Badge>
                      )}
                      {!rule.is_active && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">inactif</Badge>
                      )}
                    </div>
                    {rule.label && (
                      <p className="text-xs text-muted-foreground truncate">"{rule.label}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      type="button"
                      onClick={() => startEdit(rule)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      type="button"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
