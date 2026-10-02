import { Outlet, useParams } from "react-router-dom";
import { DossierListSidebar } from "@/components/admin/dossiers/DossierListSidebar";

export default function DossiersLayout() {
  const { dossierId } = useParams<{ dossierId: string }>();
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 -m-2 sm:-m-6">
      <DossierListSidebar selectedId={dossierId} />
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
