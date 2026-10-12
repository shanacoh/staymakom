import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Plus, Search, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProviderPolicyBadge } from "@/components/admin/ProviderPolicyBadge";
import { ProviderStatusBadge } from "@/components/admin/providers/ProviderBadges";
import { QuickProviderDialog } from "@/components/admin/providers/QuickProviderDialog";
import { RegionSelect } from "@/components/forms/shared/RegionSelect";
import { errorMessage } from "@/lib/catalogue/queries";
import { experienceCountByProvider } from "@/lib/providers/compute";
import { useProviderLinks, useProviders } from "@/lib/providers/queries";
import {
  PROVIDER_STATUS_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  providerTypeLabel,
  providerUrl,
  type ProviderStatus,
  type ProviderType,
} from "@/lib/providers/types";
import { useRegionList } from "@/lib/regionList/queries";

const ALL = "all";

// Note moyenne et nombre d'avis publiés par prestataire, pour repérer une note qui baisse.
function useReviewStats() {
  return useQuery({
    queryKey: ["admin-providers-review-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("provider_id, rating")
        .eq("moderation_status", "published")
        .not("provider_id", "is", null);
      if (error) throw error;
      const stats: Record<string, { sum: number; count: number }> = {};
      (data || []).forEach((r: { provider_id: string; rating: number | null }) => {
        if (r.rating == null) return;
        if (!stats[r.provider_id]) stats[r.provider_id] = { sum: 0, count: 0 };
        stats[r.provider_id].sum += r.rating;
        stats[r.provider_id].count += 1;
      });
      return stats;
    },
  });
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function AdminProviders() {
  const navigate = useNavigate();
  const { providers, isLoading, error } = useProviders();
  const { links } = useProviderLinks();
  const { data: reviewStats } = useReviewStats();
  const regionList = useRegionList();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<ProviderType | null>(null);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const experienceCounts = useMemo(() => experienceCountByProvider(links), [links]);
  const regionName = useMemo(() => new Map(regionList.regions.map((r) => [r.id, r.name_fr])), [regionList]);

  const visible = useMemo(() => {
    const needle = normalize(search.trim());
    return providers.filter(
      (p) =>
        (!type || p.provider_type === type) &&
        (!status || p.status === status) &&
        (!regionId || p.region_id === regionId) &&
        (!needle || normalize([p.name, p.contact_name, p.email, p.whatsapp, p.legal_name].filter(Boolean).join(" ")).includes(needle)),
    );
  }, [providers, search, type, status, regionId]);

  const hasFilters = !!search.trim() || !!type || !!status || !!regionId;
  const clearFilters = () => {
    setSearch("");
    setType(null);
    setStatus(null);
    setRegionId(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Partenaires</h1>
          <p className="text-sm text-muted-foreground">
            Les prestataires : ceux qui réalisent vraiment l'expérience, l'hôtel ou la sortie bateau. Jamais visibles côté client.
          </p>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Prestataire
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Rechercher un prestataire"
            placeholder="Rechercher (nom, contact, email…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-64 pl-8 text-xs"
          />
        </div>
        <Select value={type ?? ALL} onValueChange={(v) => setType(v === ALL ? null : (v as ProviderType))}>
          <SelectTrigger aria-label="Filtrer par type" className="h-8 w-auto min-w-32 gap-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les types</SelectItem>
            {PROVIDER_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status ?? ALL} onValueChange={(v) => setStatus(v === ALL ? null : (v as ProviderStatus))}>
          <SelectTrigger aria-label="Filtrer par statut" className="h-8 w-auto min-w-36 gap-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les statuts</SelectItem>
            {PROVIDER_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <RegionSelect
          aria-label="Filtrer par région"
          value={regionId}
          onChange={setRegionId}
          emptyLabel="Toutes les régions"
          triggerClassName="h-8 w-auto min-w-40 gap-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">
          {visible.length} prestataire{visible.length > 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Impossible de charger les prestataires : {errorMessage(error)}
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun prestataire pour l'instant. Ajoute le premier avec « + Prestataire ».
        </div>
      ) : visible.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <p>Aucun prestataire ne correspond à ces filtres.</p>
          {hasFilters && (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              Tout effacer
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Prestataire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Expériences liées</TableHead>
                <TableHead>Politique</TableHead>
                <TableHead>Avis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((p) => {
                const stats = reviewStats?.[p.id];
                const average = stats && stats.count > 0 ? stats.sum / stats.count : null;
                return (
                  <TableRow
                    key={p.id}
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => navigate(providerUrl(p.id))}
                    onKeyDown={(e) => e.key === "Enter" && navigate(providerUrl(p.id))}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs">{providerTypeLabel(p.provider_type)}</TableCell>
                    <TableCell>
                      <ProviderStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-xs">{(p.region_id && regionName.get(p.region_id)) || "–"}</TableCell>
                    <TableCell className="text-xs">
                      {p.contact_name || p.whatsapp || p.email ? (
                        <>
                          {p.contact_name && <div>{p.contact_name}</div>}
                          <div className="text-muted-foreground">{p.whatsapp || p.email}</div>
                        </>
                      ) : (
                        "–"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{experienceCounts.get(p.id) ?? 0}</TableCell>
                    <TableCell>
                      {p.policy_validated ? (
                        <span className="text-xs text-muted-foreground">Validée</span>
                      ) : (
                        <ProviderPolicyBadge policyValidated={false} />
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {average === null ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        <span className={`flex items-center gap-1 ${average < 4 ? "text-destructive" : ""}`}>
                          {average < 4 && <AlertTriangle className="h-3 w-3" />}
                          <Star className="h-3 w-3 fill-current" /> {average.toFixed(1)} ({stats!.count})
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {creating && (
        <QuickProviderDialog
          onClose={() => setCreating(false)}
          onCreated={(provider) => {
            setCreating(false);
            navigate(providerUrl(provider.id));
          }}
        />
      )}
    </div>
  );
}
