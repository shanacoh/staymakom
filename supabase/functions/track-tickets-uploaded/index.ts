// track-tickets-uploaded — Edge Function
// Enregistre dans Amplitude, côté serveur, qu'un admin vient de déposer des billets d'entrée sur une
// réservation. Les fichiers sont déposés directement par le back-office dans le bucket privé : cette
// fonction relit en base ce qui a vraiment été ajouté (nombre et types) avant de le compter.
// Elle n'écrit rien en base.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAdminEmail } from '../_shared/internal-auth.ts';
import { trackServerEvent } from '../_shared/amplitude.ts';

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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body.booking_id === 'string' ? body.booking_id : '';
    const ticketIds = Array.isArray(body.ticket_ids) ? body.ticket_ids.filter((id: unknown) => typeof id === 'string') : [];
    if (!bookingId || ticketIds.length === 0) return json({ error: 'booking_id ou ticket_ids manquant' }, 400);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!await getAdminEmail(req, supabase)) return json({ error: 'Action réservée aux administrateurs' }, 403);

    const { data, error } = await supabase
      .from('booking_tickets')
      .select('file_type')
      .eq('booking_id', bookingId)
      .in('id', ticketIds);
    if (error) throw error;
    if (!data || data.length === 0) return json({ success: true, tracked: false });

    await trackServerEvent('tickets_uploaded', `booking-${bookingId}`, {
      booking_id: bookingId,
      nb_fichiers: data.length,
      types: [...new Set(data.map((row) => row.file_type))].sort(),
    });
    return json({ success: true, tracked: true });
  } catch (err) {
    console.error('track-tickets-uploaded error:', err);
    return json({ error: 'Erreur interne' }, 500);
  }
});
