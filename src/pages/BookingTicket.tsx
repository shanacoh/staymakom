import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STAYMAKOM_WHATSAPP_URL, type PracticalInfo, type PracticalLang } from "@/lib/practicalInfo";
import { TICKET_TEXTS, ticketSummaryLine, type TicketFileType } from "@/lib/tickets";
import PdfFirstPage from "@/components/tickets/PdfFirstPage";
import PracticalInfoBlock from "@/components/tickets/PracticalInfoBlock";

interface TicketView {
  id: string;
  type: TicketFileType;
  label: string | null;
  name: string;
  url: string;
  download_url: string | null;
}

interface TicketPayload {
  available: boolean;
  booking?: {
    lang: PracticalLang;
    experience_title: string;
    date_label: string;
    time_label: string;
    party_size: number;
    ticket_note: string | null;
  };
  tickets?: TicketView[];
  practical_info?: PracticalInfo | null;
}

// Langue de la page avant d'avoir lu la réservation (et pour « billet indisponible ») : celle du téléphone.
function deviceLang(): PracticalLang {
  const code = (navigator.language || "").slice(0, 2).toLowerCase();
  return code === "fr" ? "fr" : code === "he" || code === "iw" ? "he" : "en";
}

/** Rend les liens d'une note billet cliquables (ex. lien de billetterie du prestataire). */
function linkify(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="break-all font-semibold text-primary underline">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

// Page billet (/billet/:token), sans compte, à montrer à l'entrée depuis un téléphone.
// Tout est lu côté serveur ; les fichiers arrivent par des liens signés de courte durée.
export default function BookingTicket() {
  const { token = "" } = useParams();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get("apercu") === "1";

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = "STAYMAKOM";
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking-ticket", token],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-booking-tickets", { body: { token, preview } });
      if (error) throw error;
      return data as TicketPayload;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    // Les liens signés durent 30 minutes : on les renouvelle avant qu'ils n'expirent.
    refetchInterval: 20 * 60 * 1000,
  });

  const lang = data?.booking?.lang ?? deviceLang();
  const rtl = lang === "he";

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={lang} className="min-h-screen bg-white font-sans text-neutral-900">
      <main className="mx-auto max-w-md px-4 pb-16 pt-8">
        <p className="mb-10 text-center text-[15px] font-bold uppercase tracking-[-0.04em]">STAYMAKOM</p>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : isError || !data?.available || !data.booking ? (
          <Unavailable lang={lang} />
        ) : (
          <TicketContent payload={data} lang={lang} />
        )}
      </main>
    </div>
  );
}

function Unavailable({ lang }: { lang: PracticalLang }) {
  const texts = TICKET_TEXTS[lang];
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-bold text-neutral-900">{texts.unavailableTitle}</h1>
      <p className="mt-3 text-sm text-neutral-500">{texts.unavailableBody}</p>
      <a
        href={STAYMAKOM_WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-block rounded-full bg-primary px-8 py-3.5 text-[13px] font-bold uppercase tracking-[0.15em] text-white"
      >
        {texts.questionLink}
      </a>
    </div>
  );
}

function TicketContent({ payload, lang }: { payload: TicketPayload; lang: PracticalLang }) {
  const t = TICKET_TEXTS[lang];
  const booking = payload.booking!;
  const tickets = payload.tickets ?? [];
  const summary = ticketSummaryLine({ date: booking.date_label, time: booking.time_label, partySize: booking.party_size }, lang);
  return (
    <>
      <header className="text-center">
        <p className={`text-[11px] font-semibold uppercase text-primary ${lang === "he" ? "text-[13px]" : "tracking-[0.3em]"}`}>{t.eyebrow}</p>
        <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.02em] text-neutral-900">{booking.experience_title}</h1>
        {summary && <p className="mt-3 text-sm text-neutral-500">{summary}</p>}
      </header>

      {tickets.length > 0 && (
        <>
          <div className="mt-8 space-y-6">
            {tickets.map((ticket, index) => (
              <TicketCard key={ticket.id} ticket={ticket} index={index} total={tickets.length} lang={lang} />
            ))}
          </div>
          <p className="mt-6 text-center text-[13px] text-neutral-400">{t.showCode}</p>
          <p className="mt-1 text-center text-[13px] text-neutral-400">{t.brightnessTip}</p>
        </>
      )}

      {booking.ticket_note && (
        <p className="mt-8 whitespace-pre-line text-center text-sm leading-relaxed">{linkify(booking.ticket_note)}</p>
      )}

      <div className="mt-10 space-y-8">
        {payload.practical_info && <PracticalInfoBlock info={payload.practical_info} />}
        <p className="border-t border-neutral-200 pt-6 text-center text-[13px] text-neutral-500">
          {t.question} ·{" "}
          <a href={STAYMAKOM_WHATSAPP_URL} target="_blank" rel="noreferrer" className="font-semibold text-primary">
            {t.questionLink}
          </a>
        </p>
      </div>
    </>
  );
}

function TicketCard({ ticket, index, total, lang }: { ticket: TicketView; index: number; total: number; lang: PracticalLang }) {
  const t = TICKET_TEXTS[lang];
  const [pdfFailed, setPdfFailed] = useState(false);
  const button = "inline-block rounded-full bg-primary px-8 py-3.5 text-[13px] font-bold uppercase tracking-[0.15em] text-white";

  return (
    <article className="rounded-xl border border-neutral-200 p-4">
      {(ticket.label || total > 1) && (
        <div className={`mb-3 flex items-center justify-between text-[11px] font-semibold uppercase text-neutral-400 ${lang === "he" ? "text-[13px]" : "tracking-[0.2em]"}`}>
          <span>{ticket.label}</span>
          {total > 1 && <span className="tabular-nums">{index + 1} / {total}</span>}
        </div>
      )}

      {ticket.type === "image" && <img src={ticket.url} alt={ticket.label || ticket.name} className="mx-auto block h-auto w-full" />}

      {ticket.type === "pdf" && (
        <>
          {!pdfFailed && <PdfFirstPage url={ticket.url} alt={ticket.label || ticket.name} loadingLabel={t.loading} onError={() => setPdfFailed(true)} />}
          <div className="mt-4 text-center">
            <a href={ticket.download_url || ticket.url} className={button}>
              {t.downloadPdf}
            </a>
          </div>
        </>
      )}

      {ticket.type === "pkpass" && (
        <div className="py-6 text-center">
          <a href={ticket.url} className={button}>
            {t.addToWallet}
          </a>
        </div>
      )}
    </article>
  );
}
