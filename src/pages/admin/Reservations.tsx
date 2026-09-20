/**
 * Point d'entrée unique de la zone "Réservations" du back-office — fusionne
 * les 3 anciennes pages redondantes en une seule interface à onglets, sur le
 * modèle visuel déjà validé pour Comptes/CRM (pastille rouge arrondie pour
 * l'onglet actif, bouton d'action principal au même niveau que les onglets).
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ExperienceBookingsGrid from "@/components/admin/ReservationsHub/ExperienceBookingsGrid";
import HotelBookingsGrid from "@/components/admin/ReservationsHub/HotelBookingsGrid";
import ItineraryRequestsTable from "@/components/admin/ReservationsHub/ItineraryRequestsTable";

type TabValue = "hotels" | "experiences" | "itineraries";

const TAB_TRIGGER_CLASS =
  "rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none";

const AdminReservations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabValue = tabParam === "experiences" ? "experiences" : tabParam === "itineraries" ? "itineraries" : "hotels";
  const [hotelCreateOpen, setHotelCreateOpen] = useState(false);
  const [experienceCreateOpen, setExperienceCreateOpen] = useState(false);

  const handleTabChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réservations</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          La grille remplace l'Excel de suivi — édition cellule par cellule, sauvegarde automatique.
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-3">
          <TabsList className="rounded-full bg-muted p-1 h-auto">
            <TabsTrigger value="hotels" className={TAB_TRIGGER_CLASS}>
              Hôtels
            </TabsTrigger>
            <TabsTrigger value="experiences" className={TAB_TRIGGER_CLASS}>
              Expériences &amp; bateaux
            </TabsTrigger>
            <TabsTrigger value="itineraries" className={TAB_TRIGGER_CLASS}>
              Itinéraires
            </TabsTrigger>
          </TabsList>

          {tab !== "itineraries" && (
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => (tab === "hotels" ? setHotelCreateOpen(true) : setExperienceCreateOpen(true))}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle réservation
            </Button>
          )}
        </div>

        <TabsContent value="hotels" className="mt-4">
          <HotelBookingsGrid createOpen={hotelCreateOpen} onCreateOpenChange={setHotelCreateOpen} />
        </TabsContent>

        <TabsContent value="experiences" className="mt-4">
          <ExperienceBookingsGrid createOpen={experienceCreateOpen} onCreateOpenChange={setExperienceCreateOpen} />
        </TabsContent>

        <TabsContent value="itineraries" className="mt-4">
          <ItineraryRequestsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReservations;
