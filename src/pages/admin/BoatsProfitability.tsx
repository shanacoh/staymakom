import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type VariantRow = {
  id: string;
  duration_minutes: number | null;
  max_capacity: number;
  purchase_price: number | null;
  sale_price: number;
  currency: string;
  experience_id: string;
  standalone_experiences: {
    title: string;
    city: string | null;
    status: string;
  } | null;
};

const COLUMNS = [
  { minutes: 60, label: "1h" },
  { minutes: 90, label: "1h30" },
  { minutes: 120, label: "2h" },
  { minutes: 180, label: "3h" },
  { minutes: 240, label: "4h" },
];

function computeMargin(salePrice: number, purchasePrice: number | null, durationMinutes: number | null) {
  if (purchasePrice == null) return { amount: null, percent: null, perHour: null };
  const amount = Math.round((salePrice - purchasePrice) * 100) / 100;
  const percent = purchasePrice > 0 ? Math.round((amount / purchasePrice) * 1000) / 10 : null;
  const perHour = durationMinutes ? Math.round((amount / (durationMinutes / 60)) * 100) / 100 : null;
  return { amount, percent, perHour };
}

export default function AdminBoatsProfitability() {
  const [minCapacity, setMinCapacity] = useState("");
  const [city, setCity] = useState<string>("all");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-boats-profitability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experience_price_variants")
        .select("id, duration_minutes, max_capacity, purchase_price, sale_price, currency, experience_id, standalone_experiences!inner(title, city, status, category_id)")
        .eq("standalone_experiences.category_id", BOATS_CATEGORY_ID)
        .order("experience_id");
      if (error) throw error;
      return (data as unknown as VariantRow[]).filter(
        (v) => v.standalone_experiences // ignore les variantes orphelines
      );
    },
  });

  const boatRows = rows ?? [];

  const cities = useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((v) => {
      if (v.standalone_experiences?.city) set.add(v.standalone_experiences.city);
    });
    return Array.from(set).sort();
  }, [rows]);

  const minCapacityNumber = minCapacity ? parseInt(minCapacity, 10) : null;

  const grouped = useMemo(() => {
    const byExperience = new Map<string, { title: string; city: string | null; status: string; variants: Map<number, VariantRow> }>();
    for (const v of boatRows) {
      const exp = v.standalone_experiences;
      if (!exp) continue;
      if (city !== "all" && exp.city !== city) continue;
      if (!byExperience.has(v.experience_id)) {
        byExperience.set(v.experience_id, { title: exp.title, city: exp.city, status: exp.status, variants: new Map() });
      }
      const bucket = COLUMNS.reduce((closest, col) => {
        if (v.duration_minutes == null) return closest;
        return Math.abs(col.minutes - v.duration_minutes) < Math.abs(closest - v.duration_minutes) ? col.minutes : closest;
      }, COLUMNS[0].minutes);
      byExperience.get(v.experience_id)!.variants.set(bucket, v);
    }

    let list = Array.from(byExperience.entries()).map(([id, data]) => ({ id, ...data }));

    if (minCapacityNumber) {
      list = list
        .map((boat) => ({
          ...boat,
          variants: new Map(
            Array.from(boat.variants.entries()).filter(([, v]) => v.max_capacity >= minCapacityNumber)
          ),
        }))
        .filter((boat) => boat.variants.size > 0);
    }

    // Meilleur bateau/durée en premier : celui qui a la marge en ₪ la plus haute d'un coup d'œil.
    list.sort((a, b) => {
      const bestA = Math.max(0, ...Array.from(a.variants.values()).map((v) => computeMargin(v.sale_price, v.purchase_price, v.duration_minutes).amount ?? -Infinity));
      const bestB = Math.max(0, ...Array.from(b.variants.values()).map((v) => computeMargin(v.sale_price, v.purchase_price, v.duration_minutes).amount ?? -Infinity));
      return bestB - bestA;
    });

    return list;
  }, [boatRows, city, minCapacityNumber]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rentabilité bateaux</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Un bateau par ligne, une durée par colonne. Case vide = cette durée n'est pas proposée pour ce
          bateau. "Coût manquant" = prix de vente connu mais prix d'achat pas encore renseigné.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Capacité minimum</Label>
          <Input
            type="number"
            min={1}
            placeholder="Ex : 10"
            className="w-32"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Port</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les ports</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="h-8 px-3 text-left text-[10px] uppercase tracking-wider">Bateau</th>
              <th className="h-8 px-3 text-left text-[10px] uppercase tracking-wider">Port</th>
              {COLUMNS.map((col) => (
                <th key={col.minutes} className="h-8 px-3 text-center text-[10px] uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={2 + COLUMNS.length} className="text-center py-6 text-sm">Chargement...</td></tr>
            ) : grouped.length === 0 ? (
              <tr><td colSpan={2 + COLUMNS.length} className="text-center py-6 text-sm text-muted-foreground">Aucun bateau ne correspond à ces filtres</td></tr>
            ) : (
              grouped.map((boat) => (
                <tr key={boat.id} className="border-t">
                  <td className="py-2 px-3 font-medium">
                    <Link to={`/admin/boats/edit/${boat.id}`} className="hover:underline">
                      {boat.title}
                    </Link>
                    {boat.status !== "published" && (
                      <span className="ml-2 text-[10px] text-muted-foreground uppercase">{boat.status}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{boat.city || "—"}</td>
                  {COLUMNS.map((col) => {
                    const v = boat.variants.get(col.minutes);
                    if (!v) {
                      return <td key={col.minutes} className="py-2 px-3 text-center text-muted-foreground text-xs">—</td>;
                    }
                    const margin = computeMargin(v.sale_price, v.purchase_price, v.duration_minutes);
                    return (
                      <td key={col.minutes} className="py-2 px-3 text-center">
                        <div className="text-sm font-semibold">{v.sale_price} ₪</div>
                        {v.purchase_price == null ? (
                          <div className="text-[11px] text-destructive font-medium">Coût manquant</div>
                        ) : (
                          <>
                            <div className={cn("text-xs", margin.amount != null && margin.amount < 0 ? "text-destructive" : "text-primary")}>
                              {margin.amount != null ? `${margin.amount > 0 ? "+" : ""}${margin.amount}₪ · ${margin.percent}%` : "—"}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {margin.perHour != null ? `${margin.perHour}₪/h` : ""}
                            </div>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
