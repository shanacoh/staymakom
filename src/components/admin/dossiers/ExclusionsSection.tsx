import { useLieuxDejaUtilises } from "@/lib/dossiersVoyage/queries";
import type { DossierVoyage } from "@/lib/dossiersVoyage/types";

/** Lieux à écarter automatiquement : déjà faits par ce client dans un dossier précédent, ou explicitement exclus par lui dans sa demande. */
export function ExclusionsSection({ dossier, exclusionsClient }: { dossier: DossierVoyage; exclusionsClient: string[] }) {
  const { data: dejaUtilises } = useLieuxDejaUtilises(dossier.email, dossier.id);

  const rien = (dejaUtilises?.length ?? 0) === 0 && exclusionsClient.length === 0;
  if (rien) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Écartés automatiquement</h3>
      <ul className="space-y-0.5 text-sm text-muted-foreground">
        {dejaUtilises?.map((l) => (
          <li key={l.catalogue_item_id}>
            <span className="line-through">{l.nom}</span> · déjà séjourné en {l.annee}
          </li>
        ))}
        {exclusionsClient.map((e, idx) => (
          <li key={`client-${idx}`}>
            <span className="line-through">{e}</span> · à la demande du client
          </li>
        ))}
      </ul>
    </div>
  );
}
