import { Link } from "react-router-dom";
import type { ProviderLinked } from "@/lib/providers/compute";
import type { LinkedStandaloneExperience } from "@/lib/providers/types";

// Ce qui est relié à un prestataire : ses expériences, ses hôtels et ses must-haves du plan de l'offre.

const MUST_HAVE_STATUS_LABEL: Record<string, string> = {
  a_trouver: "à trouver",
  en_prospection: "en prospection",
  signe: "signé",
  en_ligne: "en ligne",
  abandonne: "abandonné",
};

const standaloneUrl = (e: LinkedStandaloneExperience) =>
  e.isBoat ? `/admin/boats/edit/${e.id}` : `/admin/experiences2/standalone/edit/${e.id}`;

function Block({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">
        {title} <span className="font-normal text-muted-foreground">{count}</span>
      </h3>
      {count === 0 ? <p className="text-xs text-muted-foreground">{empty}</p> : <ul className="space-y-1.5 text-sm">{children}</ul>}
    </div>
  );
}

function Row({ to, label, details }: { to: string; label: string; details: (string | false | null)[] }) {
  const shown = details.filter(Boolean);
  return (
    <li>
      <Link to={to} className="underline underline-offset-2 hover:text-red-600">
        {label}
      </Link>
      {shown.length > 0 && <span className="text-xs text-muted-foreground"> · {shown.join(" · ")}</span>}
    </li>
  );
}

const draftMark = (status: string) => status !== "published" && "brouillon";

export function ProviderLinkedSection({ providerId, linked }: { providerId: string; linked: ProviderLinked }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Block
        title="Expériences"
        count={linked.standalone.length + linked.hotelExperiences.length}
        empty="Aucune expérience reliée. Le lien se fait depuis la fiche de l'expérience, champ « Prestataire »."
      >
        {linked.standalone.map((e) => (
          <Row
            key={e.id}
            to={standaloneUrl(e)}
            label={e.title}
            details={[e.isBoat && "bateau", e.providerId !== providerId && "prestataire secondaire", draftMark(e.status)]}
          />
        ))}
        {linked.hotelExperiences.map((e) => (
          <Row
            key={e.id}
            to={`/admin/experiences2/edit/${e.id}`}
            label={e.title}
            details={["hôtel", e.ownProviderId !== providerId && "via son hôtel", draftMark(e.status)]}
          />
        ))}
      </Block>

      <Block title="Hôtels" count={linked.hotels.length} empty="Aucun hôtel relié. Le lien se fait depuis la fiche de l'hôtel, champ « Prestataire ».">
        {linked.hotels.map((h) => (
          <Row key={h.id} to={`/admin/hotels2/edit/${h.id}`} label={h.name} details={[draftMark(h.status)]} />
        ))}
      </Block>

      <Block
        title="Must-haves du plan de l'offre"
        count={linked.mustHaves.length}
        empty="Aucun must-have relié. Le lien se fait dans le Plan de l'offre, colonne « Partenaire »."
      >
        {linked.mustHaves.map((m) => (
          <Row key={m.id} to="/admin/offre" label={m.name} details={[MUST_HAVE_STATUS_LABEL[m.status] ?? m.status]} />
        ))}
      </Block>
    </div>
  );
}
