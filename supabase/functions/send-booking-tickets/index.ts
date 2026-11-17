// send-booking-tickets — Edge Function
// Envoie au client l'email « Vos billets » : les billets d'entrée du prestataire (fichiers originaux,
// jamais modifiés) en pièces jointes, les billets image affichés dans le corps de l'email, le lien
// vers la page billet, la note billet et les infos pratiques. Dans la langue de la réservation.
//
// Qui l'appelle : un admin connecté, depuis la fiche réservation du back-office (bouton « Envoyer
// les billets au client » ou « Renvoyer »). Jamais un visiteur.
//
// Pas d'envoi en double : le premier envoi « prend » la réservation (date d'envoi posée seulement si
// elle était vide). Un deuxième envoi n'est possible qu'en le demandant (`resend: true`, bouton « Renvoyer »).
// Cette fonction ne touche ni au paiement ni au statut de la réservation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';
import { getAdminEmail } from '../_shared/internal-auth.ts';
import { trackServerEvent } from '../_shared/amplitude.ts';
import { downloadTicketFile, loadTicketBooking, loadTicketPracticalInfo, type TicketBooking } from '../_shared/tickets/load.ts';
import { buildTicketsEmail, ticketContentId } from '../_shared/tickets/email.ts';
import { ticketAttachmentName } from '../_shared/tickets/content.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Resend accepte 40 Mo par email, pièces jointes encodées comprises : on garde de la marge.
const MAX_ATTACHMENTS_BYTES = 28 * 1024 * 1024;

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  /\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => typeof o === 'string' ? o === origin : o.test(origin));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://staymakom.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

interface ResendAttachment {
  filename: string;
  content: string;
  content_type: string;
  content_id?: string;
}

/** Les fichiers du prestataire, tels quels, prêts à joindre. Les images portent leur identifiant « cid ». */
async function buildAttachments(supabase: unknown, booking: TicketBooking): Promise<ResendAttachment[]> {
  const attachments: ResendAttachment[] = [];
  let totalBytes = 0;
  for (const ticket of booking.tickets) {
    const bytes = await downloadTicketFile(supabase, ticket);
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_ATTACHMENTS_BYTES) {
      throw new Error('Billets trop lourds pour un seul email (28 Mo maximum au total).');
    }
    attachments.push({
      filename: ticketAttachmentName(ticket.originalName, ticket.label),
      content: encodeBase64(bytes),
      content_type: ticket.mimeType,
      ...(ticket.fileType === 'image' ? { content_id: ticketContentId(ticket.id) } : {}),
    });
  }
  return attachments;
}

/** Jeton de la page billet : déjà créé au premier fichier, sinon (note seule) créé ici, une fois pour toutes. */
async function ensureToken(supabase: any, booking: TicketBooking): Promise<string> {
  if (booking.token) return booking.token;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const candidate = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await supabase.from('standalone_bookings').update({ ticket_access_token: candidate }).eq('id', booking.id).is('ticket_access_token', null);
  const { data, error } = await supabase.from('standalone_bookings').select('ticket_access_token').eq('id', booking.id).single();
  if (error || !data?.ticket_access_token) throw new Error('Jeton de la page billet impossible à créer');
  return data.ticket_access_token;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body.booking_id === 'string' ? body.booking_id : '';
    const resend = body.resend === true;
    if (!bookingId) return json({ error: 'booking_id manquant' }, 400);
    if (!RESEND_API_KEY) return json({ error: 'Email service not configured' }, 500);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const adminEmail = await getAdminEmail(req, supabase);
    if (!adminEmail) return json({ error: 'Action réservée aux administrateurs' }, 403);

    const loaded = await loadTicketBooking(supabase, { bookingId });
    if (!loaded) return json({ error: 'Réservation introuvable' }, 404);
    if (!loaded.active) return json({ error: 'Réservation annulée : aucun billet n\'est envoyé' }, 409);
    if (!loaded.customerEmail) return json({ error: 'Pas d\'email client sur la réservation' }, 409);
    if (loaded.tickets.length === 0 && !loaded.ticketNote) {
      return json({ error: 'Ajoutez au moins un billet ou une note billet avant d\'envoyer' }, 409);
    }
    if (loaded.ticketsSentAt && !resend) {
      return json({ success: true, already_sent: true, tickets_sent_at: loaded.ticketsSentAt });
    }

    const booking: TicketBooking = { ...loaded, token: await ensureToken(supabase, loaded) };
    const attachments = await buildAttachments(supabase, booking);
    const practicalInfo = await loadTicketPracticalInfo(supabase, booking);
    const email = buildTicketsEmail(booking, practicalInfo);

    // Premier envoi : on « prend » la réservation. Si quelqu'un l'a déjà prise, on ne renvoie pas.
    const sentAt = new Date().toISOString();
    if (!resend) {
      const { data: claimed, error: claimError } = await supabase
        .from('standalone_bookings')
        .update({ tickets_sent_at: sentAt })
        .eq('id', booking.id)
        .is('tickets_sent_at', null)
        .select('id');
      if (claimError) throw claimError;
      if (!claimed || claimed.length === 0) return json({ success: true, already_sent: true });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Staymakom <hello@staymakom.com>',
        reply_to: 'shana@staymakom.com',
        to: [booking.customerEmail],
        subject: email.subject,
        html: email.html,
        attachments,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('Resend error:', details);
      // L'email n'est pas parti : on libère la réservation pour qu'un nouvel essai soit possible.
      if (!resend) await supabase.from('standalone_bookings').update({ tickets_sent_at: null }).eq('id', booking.id).eq('tickets_sent_at', sentAt);
      return json({ error: 'Email send failed', details }, 500);
    }

    if (resend) await supabase.from('standalone_bookings').update({ tickets_sent_at: sentAt }).eq('id', booking.id);

    await trackServerEvent('tickets_sent', `booking-${booking.id}`, {
      booking_id: booking.id,
      nb_fichiers: booking.tickets.length,
      langue: booking.lang,
      is_resend: resend,
    });

    return json({ success: true, tickets_sent_at: sentAt, sent_to: booking.customerEmail });
  } catch (err) {
    console.error('send-booking-tickets error:', err);
    return json({ error: (err as Error).message || 'Erreur interne' }, 500);
  }
});
