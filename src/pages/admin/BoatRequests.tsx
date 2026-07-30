/**
 * Demandes reçues pour les expériences de la catégorie Bateaux uniquement —
 * réutilise StandaloneRequestsTable (même table que la vue générique
 * "Demandes à traiter" de /admin/standalone-bookings), filtrée par catégorie.
 */
import StandaloneRequestsTable from "@/components/admin/StandaloneRequestsTable";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";

export default function BoatRequests() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Demandes — Bateaux</h2>
        <p className="text-sm text-muted-foreground">Demandes reçues via le formulaire "Demander la réservation" sur /boat</p>
      </div>
      <StandaloneRequestsTable categoryId={BOATS_CATEGORY_ID} showWhatsAppLink />
    </div>
  );
}
