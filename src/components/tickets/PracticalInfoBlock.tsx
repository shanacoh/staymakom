import { practicalInfoLabels, type PracticalInfo } from "@/lib/practicalInfo";

// Bloc « Infos pratiques » de la page billet : mêmes infos et mêmes intitulés que dans les emails
// (contenu construit par le fichier partagé avec les fonctions serveur). Un champ vide n'apparaît pas.
export default function PracticalInfoBlock({ info }: { info: PracticalInfo }) {
  const t = practicalInfoLabels(info.lang);
  const rows: { label: string; body: React.ReactNode }[] = [];

  if (info.meetingPoint || info.address) {
    rows.push({
      label: info.meetingPoint ? t.meetingPoint : t.address,
      body: (
        <>
          <p>{info.meetingPoint || info.address}</p>
          {info.meetingPoint && info.address && <p className="text-neutral-500">{info.address}</p>}
          {(info.wazeUrl || info.mapsUrl) && (
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-primary">
              {info.wazeUrl && <a href={info.wazeUrl} target="_blank" rel="noreferrer">{t.waze}</a>}
              {info.mapsUrl && <a href={info.mapsUrl} target="_blank" rel="noreferrer">{t.maps}</a>}
            </p>
          )}
        </>
      ),
    });
  }
  if (info.access) rows.push({ label: t.access, body: <p>{info.access}</p> });
  if (info.arriveMinutes) rows.push({ label: t.arrival, body: <p>{t.arrive(info.arriveMinutes)}</p> });
  if (info.knowBefore) rows.push({ label: t.knowBefore, body: <p>{info.knowBefore}</p> });
  if (info.contingency) rows.push({ label: t.contingency, body: <p>{info.contingency}</p> });

  return (
    <section className="border-t border-neutral-200 pt-8">
      <h2 className="mb-5 text-[15px] font-bold text-neutral-900">{t.title}</h2>
      <dl className="space-y-5">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-neutral-400">{row.label}</dt>
            <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed">{row.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
