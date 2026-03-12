import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const ALLOWED_ORIGINS = [
  'https://staymakom.com', 'https://www.staymakom.com',
  'https://stay-makom-experiences.lovable.app',
  'http://localhost:5173', 'http://localhost:8080',
];
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the caller is authenticated and is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: hasAdminRole } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!hasAdminRole) {
      throw new Error('User is not admin');
    }

    const { action, ...params } = await req.json();

    console.log('Manage users action:', action, 'by user:', user.email);

    switch (action) {
      case 'create': {
        const { email, password, firstName, lastName, role, country, hotelId } = params;

        // Create the user in auth
        // The database trigger handle_new_user() will automatically create:
        // - user_profiles (from display_name and locale in metadata)
        // - user_roles (from role in metadata)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
            locale: 'en',
            role: role, // Trigger will create user_role from this
            hotel_id: hotelId, // Trigger will use this for hotel_admin role
            country: country, // Will be used if we extend user_profiles
          }
        });

        if (createError) {
          // Make error message more user-friendly
          if (createError.message?.includes('already been registered') || createError.code === 'email_exists') {
            throw new Error('This email address is already registered');
          }
          throw createError;
        }

        // Wait briefly for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // If customer, create customer profile
        if (role === 'customer') {
          const { error: customerError } = await supabaseAdmin
            .from('customers')
            .insert({
              user_id: newUser.user.id,
              first_name: firstName,
              last_name: lastName,
              address_country: country || null,
              default_party_size: 2,
            });

          if (customerError) {
            console.error('Customer creation error:', customerError);
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            throw new Error('Failed to create customer profile');
          }
        }

        // If hotel_admin, create hotel admin assignment
        if (role === 'hotel_admin' && hotelId) {
          const { error: hotelAdminError } = await supabaseAdmin
            .from('hotel_admins')
            .insert({
              user_id: newUser.user.id,
              hotel_id: hotelId,
            });

          if (hotelAdminError) {
            console.error('Hotel admin creation error:', hotelAdminError);
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            if (role === 'customer') {
              await supabaseAdmin.from('customers').delete().eq('user_id', newUser.user.id);
            }
            throw new Error('Failed to assign hotel to admin');
          }
        }

        return new Response(
          JSON.stringify({ success: true, userId: newUser.user.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { userId } = params;

        // Check if user has bookings
        const { data: bookings } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('customer_id', userId)
          .limit(1);

        if (bookings && bookings.length > 0) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Cannot delete user with existing bookings. Please archive the user instead.' 
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Delete the user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'toggle-status': {
        const { userId, banned } = params;

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { ban_duration: banned ? '876000h' : 'none' }
        );

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in manage-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
