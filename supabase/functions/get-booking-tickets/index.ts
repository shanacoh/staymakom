// get-booking-tickets — Edge Function
// Utilisée par la page billet client (/billet/:token), sans compte. Lit la réservation côté serveur
// à partir du jeton de la page billet (long, aléatoire, non devinable) et ne renvoie que ce que le
// client doit voir à l'entrée : nom de l'expérience, date, heure, participants, billets, note billet
// et infos pratiques. Jamais le prix, le téléphone, l'email ni les notes internes.
//
// Les fichiers sont servis par des liens signés de courte durée, fabriqués à chaque affichage :
// le bucket des billets reste privé.
// Jeton inconnu, ou réservation annulée / remboursée : `available: false`, et rien d'autre.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { trackServerEvent } from '../_shared/amplitude.ts';
import { loadTicketBooking, loadTicketPracticalInfo, signTicketFile } from '../_shared/tickets/load.ts';

// 30 minutes : le temps d'ouvrir la page devant l'entrée. Un rechargement en fabrique de nouveaux.
const SIGNED_URL_SECONDS = 30 * 60;

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

const TOKEN_FORMAT = /^[a-f0-9]{64}$/;

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    });

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim().toLowerCase() : '';
    if (!TOKEN_FORMAT.test(token)) return json({ available: false });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const booking = await loadTicketBooking(supabase, { token });
    if (!booking || !booking.active) return json({ available: false });

    const tickets = await Promise.all(booking.tickets.map(async (ticket) => ({
      id: ticket.id,
      type: ticket.fileType,
      label: ticket.label,
      name: ticket.originalName,
      url: await signTicketFile(supabase, ticket, SIGNED_URL_SECONDS),
      download_url: ticket.fileType === 'pdf' ? await signTicketFile(supabase, ticket, SIGNED_URL_SECONDS, ticket.originalName) : null,
    })));
    const practicalInfo = await loadTicketPracticalInfo(supabase, booking);

    // `preview` : ouverture depuis le back-office (« Voir la page billet »), pas comptée comme une visite client.
    if (body.preview !== true) {
      await trackServerEvent('ticket_page_viewed', `booking-${booking.id}`, { booking_id: booking.id, nb_fichiers: tickets.length, langue: booking.lang });
    }

    return json({
      available: true,
      booking: {
        lang: booking.lang,
        experience_title: booking.experienceTitle,
        date_label: booking.dateLabel,
        time_label: booking.timeLabel,
        party_size: booking.partySize,
        ticket_note: booking.ticketNote || null,
      },
      tickets: tickets.filter((ticket) => ticket.url),
      practical_info: practicalInfo,
    });
  } catch (err) {
    console.error('get-booking-tickets error:', err);
    return json({ error: 'Erreur interne' }, 500);
  }
});
