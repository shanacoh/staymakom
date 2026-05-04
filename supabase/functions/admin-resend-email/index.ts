import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("booking_id requis");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch booking with related data
    const { data: booking, error: bookingError } = await adminClient
      .from('bookings_hg')
      .select('*, experiences2(title, title_he), hotels2(name, name_he)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) throw new Error("Réservation introuvable");
    if (!booking.customer_email) throw new Error("Aucun email client pour cette réservation");

    const hgRaw = booking.hg_raw_data as any;
    const guestName = hgRaw?.rooms?.[0]?.guests?.[0]?.name
      ? `${hgRaw.rooms[0].guests[0].name.first} ${hgRaw.rooms[0].guests[0].name.last}`
      : booking.customer_name || "Guest";
    const staymakomRef = hgRaw?.reference?.agency || `SM-${(booking.experience_id || "").substring(0, 8).toUpperCase()}`;

    // Call send-booking-confirmation with service role (same as process-booking does)
    const { error: emailError } = await adminClient.functions.invoke('send-booking-confirmation', {
      body: {
        to: booking.customer_email,
        guestName,
        experienceTitle: booking.experiences2?.title || "",
        hotelName: booking.hotels2?.name || "",
        roomName: booking.room_name || "",
        boardType: booking.board_type || "RO",
        checkIn: booking.checkin,
        checkOut: booking.checkout,
        nights: booking.nights,
        partySize: booking.party_size,
        totalPrice: booking.paid_amount ?? booking.sell_price,
        currency: booking.currency || "USD",
        bookingRef: staymakomRef,
        hgBookingId: booking.hg_booking_id,
        remarks: [],
        confirmationToken: booking.confirmation_token || "",
        lang: "en",
      },
    });

    if (emailError) throw emailError;

    console.log("Email renvoyé avec succès à:", booking.customer_email);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erreur admin-resend-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
