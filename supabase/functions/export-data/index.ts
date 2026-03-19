// Export Data Edge Function
// Exports all Supabase data as JSON for migration to a new Supabase project
// Requires admin role

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(o =>
    typeof o === 'string' ? o === origin : o.test(origin)
  );
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://staymakom.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// All tables to export, grouped by priority
const TABLE_GROUPS: Record<string, string[]> = {
  auth_users: [
    'user_profiles',
    'user_roles',
    'customers',
    'hotel_admins',
  ],
  hotels: [
    'hotels2',
    'hotel2_extras',
    'hotels',   // V1 backup
  ],
  experiences: [
    'experiences2',
    'experience2_addons',
    'experience2_hotels',
    'experience2_extras',
    'experience2_reviews',
    'experience2_date_options',
    'experience2_includes',
    'experience2_highlight_tags',
    'experience2_practical_info',
    'experiences',  // V1 backup
    'experience_extras',
    'experience_includes',
    'experience_highlight_tags',
    'experience_reviews',
  ],
  bookings: [
    'bookings_hg',
    'bookings',
    'booking_extras',
  ],
  content: [
    'categories',
    'highlight_tags',
    'journal_posts',
    'global_settings',
    'extras',
    'packages',
  ],
  crm: [
    'leads',
    'gift_cards',
    'saved_carts',
    'wishlist',
    'loyalty_points',
  ],
  analytics: [
    'ai_search_events',
    'ai_search_queries',
    'audit_logs',
  ],
  system: [
    'health_checks',
    'alerts',
    'diagnostic_runs',
  ],
};

async function verifyAdmin(supabase: any, authHeader: string): Promise<boolean> {
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  return !!role;
}

async function exportTable(supabase: any, tableName: string): Promise<{ table: string; count: number; data: any[]; error?: string }> {
  try {
    // Fetch all rows with pagination (Supabase limits to 1000 per request)
    const allRows: any[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: true, nullsFirst: true });

      if (error) {
        // Some tables don't have created_at, try without ordering
        const { data: data2, error: error2 } = await supabase
          .from(tableName)
          .select('*')
          .range(offset, offset + pageSize - 1);

        if (error2) {
          return { table: tableName, count: 0, data: [], error: error2.message };
        }
        if (data2) allRows.push(...data2);
        if (!data2 || data2.length < pageSize) break;
      } else {
        if (data) allRows.push(...data);
        if (!data || data.length < pageSize) break;
      }
      offset += pageSize;
    }

    return { table: tableName, count: allRows.length, data: allRows };
  } catch (err: any) {
    return { table: tableName, count: 0, data: [], error: err.message };
  }
}

async function exportSchema(supabase: any): Promise<any> {
  // Get all migrations for schema recreation
  try {
    const { data, error } = await supabase
      .rpc('pg_catalog.current_database');
    // Can't directly export schema via Supabase client, but we can export enum values
  } catch {}

  // Export enum values that are useful for migration
  const enums: Record<string, string[]> = {};
  const enumQueries = [
    { name: 'app_role', values: ['admin', 'hotel_admin', 'customer'] },
    { name: 'hotel_status', values: ['draft', 'published', 'archived'] },
    { name: 'booking_status', values: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] },
    { name: 'locale', values: ['en', 'he', 'fr'] },
  ];
  enumQueries.forEach(e => { enums[e.name] = e.values; });

  return { enums };
}

async function getStorageFiles(supabase: any, bucket: string): Promise<{ name: string; url: string }[]> {
  const files: { name: string; url: string }[] = [];

  try {
    const { data: items, error } = await supabase.storage.from(bucket).list('', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'asc' },
    });

    if (error || !items) return files;

    for (const item of items) {
      if (item.id) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(item.name);
        files.push({ name: item.name, url: urlData?.publicUrl || '' });
      }
    }

    // Also check subfolders
    const folders = items.filter((i: any) => !i.id);
    for (const folder of folders) {
      const { data: subItems } = await supabase.storage.from(bucket).list(folder.name, { limit: 1000 });
      if (subItems) {
        for (const sub of subItems) {
          if (sub.id) {
            const path = `${folder.name}/${sub.name}`;
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
            files.push({ name: path, url: urlData?.publicUrl || '' });
          }
        }
      }
    }
  } catch {}

  return files;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify admin
  const authHeader = req.headers.get('Authorization') || '';
  const isAdmin = await verifyAdmin(supabase, authHeader);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Parse request
  let body: { action: string; group?: string; table?: string } = { action: 'inventory' };
  try {
    body = await req.json();
  } catch {}

  // ── ACTION: inventory ──────────────────────────────────
  // Returns table counts without data (fast overview)
  if (body.action === 'inventory') {
    const inventory: Record<string, { table: string; count: number; error?: string }[]> = {};

    for (const [group, tables] of Object.entries(TABLE_GROUPS)) {
      inventory[group] = [];
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          inventory[group].push({
            table,
            count: error ? -1 : (count || 0),
            error: error?.message,
          });
        } catch (err: any) {
          inventory[group].push({ table, count: -1, error: err.message });
        }
      }
    }

    // Storage
    const storageFiles = await getStorageFiles(supabase, 'experience-images');
    // Also check category-images
    const categoryFiles = await getStorageFiles(supabase, 'category-images');

    return new Response(JSON.stringify({
      success: true,
      action: 'inventory',
      timestamp: new Date().toISOString(),
      project_id: supabaseUrl.match(/\/\/([^.]+)/)?.[1] || 'unknown',
      groups: inventory,
      storage: {
        'experience-images': { count: storageFiles.length },
        'category-images': { count: categoryFiles.length },
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── ACTION: export-group ───────────────────────────────
  // Exports all tables in a group
  if (body.action === 'export-group' && body.group) {
    const tables = TABLE_GROUPS[body.group];
    if (!tables) {
      return new Response(JSON.stringify({ error: `Unknown group: ${body.group}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, any> = {};
    for (const table of tables) {
      results[table] = await exportTable(supabase, table);
    }

    return new Response(JSON.stringify({
      success: true,
      action: 'export-group',
      group: body.group,
      timestamp: new Date().toISOString(),
      tables: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── ACTION: export-table ───────────────────────────────
  // Exports a single table
  if (body.action === 'export-table' && body.table) {
    const result = await exportTable(supabase, body.table);

    return new Response(JSON.stringify({
      success: true,
      action: 'export-table',
      timestamp: new Date().toISOString(),
      ...result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── ACTION: export-storage ─────────────────────────────
  // Returns all storage file URLs
  if (body.action === 'export-storage') {
    const experienceFiles = await getStorageFiles(supabase, 'experience-images');
    const categoryFiles = await getStorageFiles(supabase, 'category-images');

    return new Response(JSON.stringify({
      success: true,
      action: 'export-storage',
      timestamp: new Date().toISOString(),
      buckets: {
        'experience-images': { count: experienceFiles.length, files: experienceFiles },
        'category-images': { count: categoryFiles.length, files: categoryFiles },
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── ACTION: export-schema ──────────────────────────────
  // Returns schema info (enums, table structure from types)
  if (body.action === 'export-schema') {
    const schema = await exportSchema(supabase);

    return new Response(JSON.stringify({
      success: true,
      action: 'export-schema',
      timestamp: new Date().toISOString(),
      schema,
      table_groups: TABLE_GROUPS,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── ACTION: export-all ─────────────────────────────────
  // Full dump (can be large!)
  if (body.action === 'export-all') {
    const allData: Record<string, Record<string, any>> = {};

    for (const [group, tables] of Object.entries(TABLE_GROUPS)) {
      allData[group] = {};
      for (const table of tables) {
        allData[group][table] = await exportTable(supabase, table);
      }
    }

    const storageExp = await getStorageFiles(supabase, 'experience-images');
    const storageCat = await getStorageFiles(supabase, 'category-images');
    const schema = await exportSchema(supabase);

    return new Response(JSON.stringify({
      success: true,
      action: 'export-all',
      timestamp: new Date().toISOString(),
      project_id: supabaseUrl.match(/\/\/([^.]+)/)?.[1] || 'unknown',
      schema,
      groups: allData,
      storage: {
        'experience-images': { count: storageExp.length, files: storageExp },
        'category-images': { count: storageCat.length, files: storageCat },
      },
      _meta: {
        format_version: '1.0',
        source: 'staymakom-supabase-export',
        description: 'Full export for migration to new Supabase project',
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    error: 'Unknown action. Use: inventory, export-group, export-table, export-storage, export-schema, export-all',
  }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
