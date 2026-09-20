/**
 * Cellule "Hôtel" de la grille de réservations hôtel : sélection d'un
 * partenaire existant (hotels2), avec une option "+ Créer «nom»" quand la
 * recherche ne correspond à aucun hôtel — création inline (nom + ville),
 * l'hôtel est alors créé en brouillon (status "draft"), à compléter plus
 * tard via la fiche hôtel complète.
 */

import { forwardRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/utils";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  value: string | null;
  displayName?: string;
  onCommit: (hotelId: string) => Promise<boolean>;
  className?: string;
}

const HotelPartnerCell = forwardRef<HTMLTableCellElement, Props>(function HotelPartnerCell(
  { value, displayName, onCommit, className },
  ref,
) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: hotels } = useQuery({
    queryKey: ["hotels2-picker"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels2").select("id, name, city").order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const filtered = (hotels || []).filter((h) =>
    (h.name || "").toLowerCase().includes(search.toLowerCase()),
  );
  const exactMatch = (hotels || []).some((h) => (h.name || "").toLowerCase() === search.trim().toLowerCase());

  const select = async (hotelId: string) => {
    setSaving(true);
    const ok = await onCommit(hotelId);
    setSaving(false);
    if (ok) setOpen(false);
  };

  const createHotel = async () => {
    const name = search.trim();
    if (!name) return;
    setCreating(true);
    const baseSlug = generateSlug(name) || `hotel-${Date.now()}`;
    let slug = baseSlug;
    const { data: existingSlug } = await supabase.from("hotels2").select("id").eq("slug", slug).maybeSingle();
    if (existingSlug) slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from("hotels2")
      .insert({ name, slug, status: "draft" } as never)
      .select("id, name")
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error("Impossible de créer l'hôtel", { description: error?.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["hotels2-picker"] });
    queryClient.invalidateQueries({ queryKey: ["hotels2-filter"] });
    toast.success(`Hôtel "${name}" créé en brouillon — à compléter dans Partenaires · Hôtels`);
    await select((data as any).id);
  };

  return (
    <TableCell ref={ref} className={cn("p-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            className="h-8 w-full justify-between font-normal text-sm px-2"
            disabled={saving}
          >
            <span className="truncate">{saving ? "..." : displayName || value ? displayName || value : "—"}</span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Rechercher un hôtel..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Aucun hôtel trouvé.</CommandEmpty>
              <CommandGroup>
                {filtered.map((hotel) => (
                  <CommandItem key={hotel.id} value={hotel.id} onSelect={() => select(hotel.id)}>
                    <Check className={cn("mr-2 h-4 w-4", value === hotel.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{hotel.name}</span>
                    {hotel.city && <span className="ml-1 text-xs text-muted-foreground">· {hotel.city}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() && !exactMatch && (
                <CommandGroup>
                  <CommandItem onSelect={createHotel} disabled={creating} className="text-primary">
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Créer «{search.trim()}»
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
});

export default HotelPartnerCell;
