// =============================================================================
// src/components/admin/Experience2AddonsManager.tsx
// Gestionnaire d'addons — V3 (supports any addon type via props)
// =============================================================================

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2, DollarSign, Percent, Receipt } from "lucide-react";
import { toast } from "sonner";
import type { ExperienceAddon, AddonType } from "@/types/experience2_addons";
import { ConvertedHint } from "@/components/ui/DualPrice";
import {
  ADDON_TYPES,
  EXPERIENCE_PRICING_TYPES,
  COMMISSION_TYPES,
  TAX_TYPES,
  DEFAULT_CALCULATION_ORDER,
} from "@/types/experience2_addons";

// ---------------------------------------------------------------------------
// Local addon type (used when no experienceId yet)
// ---------------------------------------------------------------------------

export interface LocalAddonEntry {
  id: string;
  type: AddonType;
  name: string;
  name_he: string | null;
  value: number;
  is_percentage: boolean;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Experience2AddonsManagerProps {
  experienceId: string | null | undefined;
  disabled?: boolean;
  localAddons?: LocalAddonEntry[];
  onLocalAddonsChange?: (addons: LocalAddonEntry[]) => void;
  /** Which addon types this section manages */
  addonTypes?: AddonType[];
  /** Section title */
  sectionTitle?: string;
  /** Section description */
  sectionDescription?: string;
  /** Icon to display */
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Section icon helper
// ---------------------------------------------------------------------------

function getSectionIcon(addonTypes: AddonType[]) {
  if (addonTypes.some((t) => COMMISSION_TYPES.includes(t))) return <Percent className="h-4 w-4 text-orange-600" />;
  if (addonTypes.some((t) => TAX_TYPES.includes(t))) return <Receipt className="h-4 w-4 text-red-600" />;
  return <DollarSign className="h-4 w-4 text-emerald-600" />;
}

function formatBadge(addon: { type: AddonType; value: number; is_percentage: boolean }) {
  if (addon.is_percentage) return `${addon.value}%`;
  return `₪${addon.value}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Experience2AddonsManager({
  experienceId,
  disabled = false,
  localAddons = [],
  onLocalAddonsChange,
  addonTypes = EXPERIENCE_PRICING_TYPES,
  sectionTitle = "Experience Pricing",
  sectionDescription = "Fees and extras charged to travelers",
  icon,
}: Experience2AddonsManagerProps) {
  const queryClient = useQueryClient();
  const isLocalMode = !experienceId;

  // ─── State: new addon form ───
  const [newType, setNewType] = useState<AddonType>(addonTypes[0]);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonNameHe, setNewAddonNameHe] = useState("");
  const [newAddonValue, setNewAddonValue] = useState<number>(0);
  const [newIsPercentage, setNewIsPercentage] = useState(false);
  const [deleteAddonId, setDeleteAddonId] = useState<string | null>(null);

  // ─── Query: fetch addons from DB ───
  const { data: dbAddons, isLoading: isLoadingAddons } = useQuery({
    queryKey: ["experience2-addons", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("experience2_addons")
        .select("*")
        .eq("experience_id", experienceId)
        .order("calculation_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExperienceAddon[];
    },
    enabled: !!experienceId,
  });

  // Sync DB addons → local addons when they load
  useEffect(() => {
    if (dbAddons && !isLocalMode && onLocalAddonsChange) {
      const synced: LocalAddonEntry[] = dbAddons
        .filter((a) => (addonTypes as string[]).includes(a.type))
        .map((a) => ({
          id: a.id,
          type: a.type as AddonType,
          name: a.name,
          name_he: a.name_he ?? null,
          value: a.value,
          is_percentage: a.is_percentage,
          is_active: a.is_active,
        }));
      onLocalAddonsChange(synced);
    }
  }, [dbAddons, isLocalMode]);

  // ─── Mutations: DB mode ───

  const addAddonMutation = useMutation({
    mutationFn: async () => {
      if (!experienceId) throw new Error("No experience ID");
      const { error } = await supabase.from("experience2_addons").insert({
        experience_id: experienceId,
        type: newType as any,
        name: newAddonName.trim() || ADDON_TYPES[newType].label,
        name_he: newAddonNameHe.trim() || null,
        value: newAddonValue,
        is_percentage: newIsPercentage,
        calculation_order: DEFAULT_CALCULATION_ORDER[newType] ?? 0,
        is_active: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Addon added");
      resetNewForm();
      queryClient.invalidateQueries({ queryKey: ["experience2-addons", experienceId] });
    },
    onError: (err: any) => toast.error(err.message || "Error adding addon"),
  });

  const toggleAddonMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from("experience2_addons").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience2-addons", experienceId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAddonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experience2_addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Addon deleted");
      setDeleteAddonId(null);
      queryClient.invalidateQueries({ queryKey: ["experience2-addons", experienceId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // ─── Local mode helpers ───

  function resetNewForm() {
    setNewAddonName("");
    setNewAddonNameHe("");
    setNewAddonValue(0);
    setNewIsPercentage(false);
    setNewType(addonTypes[0]);
  }

  function handleAddLocal() {
    if (newAddonValue <= 0) return;
    const newEntry: LocalAddonEntry = {
      id: crypto.randomUUID(),
      type: newType,
      name: newAddonName.trim() || ADDON_TYPES[newType].label,
      name_he: newAddonNameHe.trim() || null,
      value: newAddonValue,
      is_percentage: newIsPercentage,
      is_active: true,
    };
    onLocalAddonsChange?.([...localAddons, newEntry]);
    resetNewForm();
  }

  function handleToggleLocal(id: string, isActive: boolean) {
    onLocalAddonsChange?.(localAddons.map((a) => (a.id === id ? { ...a, is_active: isActive } : a)));
  }

  function handleDeleteLocal(id: string) {
    onLocalAddonsChange?.(localAddons.filter((a) => a.id !== id));
    setDeleteAddonId(null);
  }

  // ─── Resolved addons list ───

  const filteredAddons: LocalAddonEntry[] = isLocalMode
    ? localAddons.filter((a) => (addonTypes as string[]).includes(a.type))
    : (dbAddons ?? [])
        .filter((a) => (addonTypes as string[]).includes(a.type))
        .map((a) => ({
          id: a.id,
          type: a.type as AddonType,
          name: a.name,
          name_he: a.name_he ?? null,
          value: a.value,
          is_percentage: a.is_percentage,
          is_active: a.is_active,
        }));

  // ─── Handlers ───

  function handleAdd() {
    if (isLocalMode) handleAddLocal();
    else addAddonMutation.mutate();
  }

  function handleToggle(id: string, isActive: boolean) {
    if (isLocalMode) handleToggleLocal(id, isActive);
    else toggleAddonMutation.mutate({ id, isActive });
  }

  function handleDelete(id: string) {
    if (isLocalMode) handleDeleteLocal(id);
    else deleteAddonMutation.mutate(id);
  }

  // ─── Loading ───

  if (!isLocalMode && isLoadingAddons) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const showPercentageToggle = addonTypes.some((t) => COMMISSION_TYPES.includes(t) || TAX_TYPES.includes(t));

  // ─── Render ───

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon || getSectionIcon(addonTypes)}
            {sectionTitle}
          </CardTitle>
          <CardDescription>{sectionDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing addons list */}
          {filteredAddons.length > 0 && (
            <div className="space-y-2">
              {filteredAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-md border bg-muted/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Switch
                      checked={addon.is_active}
                      onCheckedChange={(checked) => handleToggle(addon.id, checked)}
                      disabled={disabled}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{addon.name}</p>
                      {addon.name_he && (
                        <p className="text-xs text-muted-foreground truncate" dir="rtl">
                          {addon.name_he}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={addon.is_active ? "default" : "secondary"}>
                      {formatBadge(addon)}
                    </Badge>
                    {!addon.is_percentage && (
                      <ConvertedHint amount={addon.value} fromCurrency="ILS" toCurrency="EUR" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {ADDON_TYPES[addon.type]?.label ?? addon.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteAddonId(addon.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredAddons.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No addons configured for this section.</p>
          )}

          {/* Add new addon form */}
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            {/* Type selector (only if multiple types) */}
            {addonTypes.length > 1 && (
              <div className="sm:col-span-1">
                <Label className="text-xs">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as AddonType)} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {addonTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ADDON_TYPES[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={addonTypes.length > 1 ? "sm:col-span-1" : "sm:col-span-2"}>
              <Label className="text-xs">Name (EN)</Label>
              <Input
                value={newAddonName}
                onChange={(e) => setNewAddonName(e.target.value)}
                placeholder={ADDON_TYPES[newType]?.label ?? "Name"}
                disabled={disabled}
              />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-xs">Name (HE)</Label>
              <Input
                value={newAddonNameHe}
                onChange={(e) => setNewAddonNameHe(e.target.value)}
                placeholder={ADDON_TYPES[newType]?.labelHe ?? ""}
                dir="rtl"
                disabled={disabled}
              />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-xs">
                Value {showPercentageToggle && newIsPercentage ? "(%)" : "(₪)"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newAddonValue || ""}
                  onChange={(e) => setNewAddonValue(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  disabled={disabled}
                />
                {!newIsPercentage && newAddonValue > 0 && (
                  <ConvertedHint amount={newAddonValue} fromCurrency="ILS" toCurrency="EUR" />
                )}
              </div>
            </div>
            {showPercentageToggle && (
              <div className="sm:col-span-1 flex items-center gap-2 pb-1">
                <Switch
                  checked={newIsPercentage}
                  onCheckedChange={setNewIsPercentage}
                  disabled={disabled}
                />
                <Label className="text-xs">{newIsPercentage ? "%" : "Fixed"}</Label>
              </div>
            )}
            <div className="sm:col-span-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAdd}
                disabled={disabled || newAddonValue <= 0 || (!isLocalMode && addAddonMutation.isPending)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteAddonId} onOpenChange={() => setDeleteAddonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this addon?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. The addon will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAddonId && handleDelete(deleteAddonId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
