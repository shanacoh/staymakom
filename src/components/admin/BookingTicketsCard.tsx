import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ExternalLink, FileText, Loader2, Send, Ticket, Trash2, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PdfFirstPage from "@/components/tickets/PdfFirstPage";
import { TICKETS_TO_SEND_QUERY_KEY } from "@/lib/reservations/ticketAlerts";
import { TICKET_ACCEPT } from "@/lib/tickets";
import {
  deleteBookingTicket,
  listBookingTickets,
  reorderBookingTickets,
  sendTicketsEmail,
  signAdminTicketUrl,
  updateTicketLabel,
  updateTicketNote,
  uploadBookingTickets,
  type AdminTicket,
} from "@/lib/tickets/adminTickets";

interface Props {
  booking: {
    id: string;
    is_cancelled: boolean;
    payment_status: string | null;
    ticket_note: string | null;
    tickets_sent_at: string | null;
    ticket_access_token: string | null;
  };
  /** La fiche indique que le prestataire envoie un billet d'entrée : bloc mis en avant. */
  requiresEntryTicket: boolean;
  bookingQueryKey: unknown[];
}

// Bloc « Billets d'entrée » de la fiche réservation : déposer les billets du prestataire (fichiers
// originaux), les nommer, les ordonner, puis les envoyer au client en un email « Vos billets ».
export default function BookingTicketsCard({ booking, requiresEntryTicket, bookingQueryKey }: Props) {
  const queryClient = useQueryClient();
  const ticketsKey = ["admin-booking-tickets", booking.id];
  const [dragOver, setDragOver] = useState(false);
  const [note, setNote] = useState(booking.ticket_note ?? "");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => setNote(booking.ticket_note ?? ""), [booking.ticket_note]);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ticketsKey,
    queryFn: () => listBookingTickets(booking.id),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ticketsKey });
    queryClient.invalidateQueries({ queryKey: bookingQueryKey });
  };

  const upload = useMutation({
    mutationFn: (files: File[]) => uploadBookingTickets(booking.id, files, tickets.length),
    onSuccess: ({ added, rejected }) => {
      if (added.length) toast.success(added.length > 1 ? `${added.length} billets ajoutés` : "Billet ajouté");
      rejected.forEach((r) => toast.error(`${r.name} refusé`, { description: r.reason }));
      refresh();
    },
    onError: (error: Error) => toast.error("Dépôt impossible", { description: error.message }),
  });

  const remove = useMutation({
    mutationFn: deleteBookingTicket,
    onSuccess: () => {
      toast.success("Billet supprimé");
      refresh();
    },
    onError: (error: Error) => toast.error("Suppression impossible", { description: error.message }),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderBookingTickets(booking.id, ids),
    onSuccess: refresh,
    onError: (error: Error) => toast.error("Ordre non enregistré", { description: error.message }),
  });

  const saveNote = useMutation({
    mutationFn: () => updateTicketNote(booking.id, note),
    onSuccess: () => {
      toast.success("Note billet enregistrée");
      queryClient.invalidateQueries({ queryKey: bookingQueryKey });
    },
    onError: (error: Error) => toast.error("Note non enregistrée", { description: error.message }),
  });

  const send = useMutation({
    mutationFn: (resend: boolean) => sendTicketsEmail(booking.id, resend),
    onSuccess: (data) => {
      toast.success(data.already_sent ? "Les billets étaient déjà partis" : "Billets envoyés au client");
      queryClient.invalidateQueries({ queryKey: bookingQueryKey });
      queryClient.invalidateQueries({ queryKey: TICKETS_TO_SEND_QUERY_KEY });
    },
    onError: (error: Error) => toast.error("Envoi impossible", { description: error.message }),
  });

  const move = (index: number, delta: number) => {
    const ids = tickets.map((t) => t.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  const addFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length) upload.mutate(files);
  };

  const noteDirty = note.trim() !== (booking.ticket_note ?? "").trim();
  const canSend = !booking.is_cancelled && (tickets.length > 0 || !!(booking.ticket_note ?? "").trim()) && !noteDirty;
  const highlighted = requiresEntryTicket && !booking.tickets_sent_at;

  return (
    <div className={`rounded-lg border p-4 space-y-4 ${highlighted ? "border-action/60 bg-action/5" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          <h3 className="font-semibold">Billets d'entrée</h3>
          {requiresEntryTicket && !booking.tickets_sent_at && <Badge variant="destructive">Billet à envoyer</Badge>}
        </div>
        {booking.ticket_access_token && (tickets.length > 0 || booking.tickets_sent_at) && (
          <a
            href={`/billet/${booking.ticket_access_token}?apercu=1`}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline inline-flex items-center gap-1"
          >
            Voir la page billet <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {!requiresEntryTicket && tickets.length === 0 && (
        <p className="text-xs text-muted-foreground">
          La fiche n'indique pas de billet d'entrée. Si le prestataire en envoie un quand même, déposez-le ici.
        </p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInput.current?.click()}
        className={`cursor-pointer rounded-md border-2 border-dashed p-5 text-center text-sm transition-colors ${dragOver ? "border-action bg-action/5" : "border-muted-foreground/25 hover:bg-muted/40"}`}
      >
        {upload.isPending ? (
          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Dépôt en cours…</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Upload className="h-4 w-4" /> Glissez les billets ici ou cliquez (PDF, PNG, JPG, .pkpass, plusieurs à la fois)
          </span>
        )}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={TICKET_ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        tickets.length > 0 && (
          <ul className="space-y-2">
            {tickets.map((ticket, index) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                isFirst={index === 0}
                isLast={index === tickets.length - 1}
                busy={reorder.isPending || remove.isPending}
                onMove={(delta) => move(index, delta)}
                onDelete={() => {
                  if (window.confirm(`Supprimer « ${ticket.label || ticket.original_name} » ?`)) remove.mutate(ticket);
                }}
                onLabelSaved={() => queryClient.invalidateQueries({ queryKey: ticketsKey })}
              />
            ))}
          </ul>
        )
      )}

      <div className="space-y-1.5">
        <Label htmlFor="ticket_note">Note billet (montrée au client)</Label>
        <Textarea
          id="ticket_note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex. Référence prestataire : AB12345, ou lien de billetterie si le prestataire n'envoie pas de fichier"
        />
        {noteDirty && (
          <Button size="sm" variant="outline" onClick={() => saveNote.mutate()} disabled={saveNote.isPending}>
            {saveNote.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer la note
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        {booking.tickets_sent_at ? (
          <>
            <p className="text-sm">
              Envoyés le {format(parseISO(booking.tickets_sent_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
            <Button size="sm" variant="outline" onClick={() => send.mutate(true)} disabled={!canSend || send.isPending}>
              {send.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Renvoyer
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => send.mutate(false)} disabled={!canSend || send.isPending}>
            {send.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Envoyer les billets au client
          </Button>
        )}
        {noteDirty && <p className="text-xs text-muted-foreground">Enregistrez la note avant d'envoyer.</p>}
        {booking.is_cancelled && <p className="text-xs text-muted-foreground">Réservation annulée : aucun billet n'est envoyé.</p>}
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  isFirst,
  isLast,
  busy,
  onMove,
  onDelete,
  onLabelSaved,
}: {
  ticket: AdminTicket;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onMove: (delta: number) => void;
  onDelete: () => void;
  onLabelSaved: () => void;
}) {
  const [label, setLabel] = useState(ticket.label ?? "");
  const { data: url } = useQuery({
    queryKey: ["admin-ticket-url", ticket.id],
    queryFn: () => signAdminTicketUrl(ticket),
    enabled: ticket.file_type !== "pkpass",
    staleTime: 5 * 60 * 1000,
  });

  const saveLabel = async () => {
    if (label.trim() === (ticket.label ?? "").trim()) return;
    try {
      await updateTicketLabel(ticket.id, label);
      onLabelSaved();
    } catch (error) {
      toast.error("Libellé non enregistré", { description: (error as Error).message });
    }
  };

  return (
    <li className="flex items-center gap-3 rounded-md border p-2">
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-muted"
        title="Ouvrir le fichier"
      >
        {ticket.file_type === "image" && url && <img src={url} alt="" className="h-full w-full object-cover" />}
        {ticket.file_type === "pdf" && url && <PdfFirstPage url={url} alt="" className="w-full" />}
        {ticket.file_type === "pdf" && !url && <FileText className="h-5 w-5 text-muted-foreground" />}
        {ticket.file_type === "pkpass" && <Wallet className="h-5 w-5 text-muted-foreground" />}
      </a>
      <div className="min-w-0 flex-1 space-y-1">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="Libellé (ex. Adulte 1)"
          className="h-8"
        />
        <p className="truncate text-xs text-muted-foreground">
          {ticket.original_name} · {ticket.file_type === "pkpass" ? "Wallet" : ticket.file_type.toUpperCase()}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isFirst || busy} onClick={() => onMove(-1)} aria-label="Monter">
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isLast || busy} onClick={() => onMove(1)} aria-label="Descendre">
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={busy} onClick={onDelete} aria-label="Supprimer">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
