/**
 * Back office dédié à la catégorie Bateaux : liste + création/édition.
 * Réutilise StandaloneExperienceForm (même éditeur que le reste des
 * expériences standalone) via defaultCategoryId, pas de formulaire dédié.
 * Bascule liste/formulaire selon la route, même pattern que Experiences2.tsx.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { StandaloneExperienceForm } from "@/components/forms/StandaloneExperienceForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";

const BOATS_QUERY_KEY = ["admin-boat-experiences"];

export default function BoatExperiences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { experienceId } = useParams();
  const isFormView = window.location.pathname.includes("/boats/new") || window.location.pathname.includes("/boats/edit/");

  const { data: boats, isLoading } = useQuery({
    queryKey: BOATS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id, title, status, is_bookable, base_price, base_price_type, currency, updated_at")
        .eq("category_id", BOATS_CATEGORY_ID)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !isFormView,
  });

  const sortedBoats = useMemo(() => boats ?? [], [boats]);

  const handleClose = () => {
    navigate("/admin/boats");
    queryClient.invalidateQueries({ queryKey: BOATS_QUERY_KEY });
  };

  if (isFormView) {
    return (
      <div className="mx-auto p-2 sm:p-6">
        <StandaloneExperienceForm
          experienceId={experienceId}
          defaultCategoryId={BOATS_CATEGORY_ID}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Mes bateaux</h2>
          <p className="text-sm text-muted-foreground">Fiches de la catégorie Bateaux, affichées sur /boat</p>
        </div>
        <Button onClick={() => navigate("/admin/boats/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bateau
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : sortedBoats.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Titre</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Réservation</th>
                <th className="p-3 font-medium">Prix</th>
                <th className="p-3 font-medium">Mis à jour</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBoats.map((boat) => (
                <tr key={boat.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{boat.title}</td>
                  <td className="p-3"><StatusBadge status={boat.status} /></td>
                  <td className="p-3">
                    <Badge variant={boat.is_bookable === false ? "outline" : "secondary"}>
                      {boat.is_bookable === false ? "Sur demande" : "Réservable en ligne"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {boat.base_price != null ? `${boat.base_price} ${boat.currency}` : "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {boat.updated_at ? format(new Date(boat.updated_at), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/boats/edit/${boat.id}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Aucun bateau pour le moment</p>
        </div>
      )}
    </div>
  );
}
