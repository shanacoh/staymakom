import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderPolicyBadge } from "@/components/admin/ProviderPolicyBadge";
import { ProviderStatusBadge } from "@/components/admin/providers/ProviderBadges";
import { ProviderBookingsSection } from "@/components/admin/providers/ProviderBookingsSection";
import { ProviderForm } from "@/components/admin/providers/ProviderForm";
import { ProviderLinkedSection } from "@/components/admin/providers/ProviderLinkedSection";
import { errorMessage } from "@/lib/catalogue/queries";
import { linkedTo } from "@/lib/providers/compute";
import {
  PROVIDERS_QUERY_KEY,
  deleteProvider,
  updateProvider,
  useProviderBookings,
  useProviderLinks,
  useProviderMutation,
  useProviders,
} from "@/lib/providers/queries";
import { providerTypeLabel, type Provider, type ProviderDraft } from "@/lib/providers/types";

const LIST_URL = "/admin/partenaires";

function toDraft({ id: _id, is_active: _active, terms_accepted_at: _at, terms_version: _version, ...draft }: Provider): ProviderDraft {
  return draft;
}

export default function AdminProviderDetails() {
  const { providerId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { providers, isLoading, error } = useProviders();
  const { links, isSuccess: linksLoaded } = useProviderLinks();
  const provider = providers.find((p) => p.id === providerId) ?? null;

  // Tant qu'on n'a rien modifié, le brouillon est la fiche enregistrée elle-même.
  const [edited, setEdited] = useState<ProviderDraft | null>(null);
  const draft = edited ?? (provider ? toDraft(provider) : null);
  const dirty = edited !== null;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const linked = useMemo(() => linkedTo(providerId, links), [providerId, links]);
  const bookingScope = useMemo(
    () => ({
      providerId,
      // Une réservation sans prestataire noté revient au prestataire principal de l'expérience.
      experiences: linked.standalone.filter((e) => e.providerId === providerId).map((e) => ({ id: e.id, title: e.title })),
      hotels: linked.hotels.map((h) => ({ id: h.id, name: h.name })),
    }),
    [providerId, linked],
  );
  const bookings = useProviderBookings(bookingScope, !!provider && linksLoaded);

  const saveMutation = useProviderMutation((patch: ProviderDraft) => updateProvider(providerId, patch));
  const deleteMutation = useProviderMutation(() => deleteProvider(providerId));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-3" aria-busy="true">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error || !provider || !draft) {
    return (
      <div className="mx-auto max-w-7xl space-y-3">
        <Link to={LIST_URL} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Partenaires
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error ? `Impossible de charger ce prestataire : ${errorMessage(error)}` : "Ce prestataire n'existe pas ou a été supprimé."}
        </div>
      </div>
    );
  }

  const canSave = dirty && draft.name.trim() !== "" && !saveMutation.isPending;
  const save = () =>
    saveMutation.mutate(
      { ...draft, name: draft.name.trim() },
      {
        onSuccess: (_result, saved) => {
          // La liste en mémoire prend tout de suite les valeurs enregistrées, sans attendre la relecture.
          queryClient.setQueryData<Provider[]>(PROVIDERS_QUERY_KEY, (list) =>
            list?.map((p) => (p.id === providerId ? { ...p, ...saved } : p)),
          );
          setEdited(null);
          toast.success("Prestataire enregistré");
        },
        onError: (e) => toast.error(`Enregistrement impossible : ${errorMessage(e)}`),
      },
    );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <Link to={LIST_URL} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Partenaires
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{provider.name}</h1>
            <ProviderStatusBadge status={provider.status} />
            <span className="text-xs text-muted-foreground">{providerTypeLabel(provider.provider_type)}</span>
            <ProviderPolicyBadge policyValidated={provider.policy_validated} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled title="Bientôt : invitation à l'espace partenaire">
              <Send className="mr-1.5 h-4 w-4" />
              Inviter
            </Button>
            <Button type="button" disabled={!canSave} onClick={save}>
              {saveMutation.isPending ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
            </Button>
          </div>
        </div>
      </div>

      <ProviderForm
        key={provider.id}
        draft={draft}
        provider={provider}
        hotels={linked.hotels}
        onChange={(patch) => setEdited((current) => ({ ...(current ?? toDraft(provider)), ...patch }))}
      />

      <ProviderLinkedSection providerId={provider.id} linked={linked} />

      <ProviderBookingsSection bookings={bookings.data} isLoading={bookings.isLoading} error={bookings.error} />

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirmingDelete(true)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Supprimer ce prestataire
        </Button>
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {provider.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Si ce prestataire est encore relié à une expérience, un hôtel ou une réservation, la
              suppression sera refusée : il faut d'abord le détacher. Pour un prestataire avec qui on ne travaille plus, préfère le
              statut « Arrêté ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Prestataire supprimé");
                    navigate(LIST_URL);
                  },
                  onError: () =>
                    toast.error("Suppression refusée : ce prestataire est encore relié à une expérience, un hôtel ou une réservation."),
                })
              }
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
