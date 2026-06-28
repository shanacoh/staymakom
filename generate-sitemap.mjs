import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const BASE_URL = 'https://staymakom.com';

// Lecture du fichier .env (sans dépendance externe)
const env = {};
try {
  const envContent = readFileSync(join(ROOT, '.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Z_]+)\s*=\s*"?([^"#\n]*)"?\s*$/);
    if (match) env[match[1]] = match[2].trim();
  }
} catch {
  // .env absent, on utilise les variables d'environnement du process
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables Supabase manquantes (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)');
  process.exit(1);
}

async function fetchSlugs(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=slug${params}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    console.warn(`⚠️  ${table} : erreur ${res.status}, table ignorée`);
    return [];
  }
  const data = await res.json();
  return data.filter(r => r.slug);
}

const today = new Date().toISOString().split('T')[0];

function urlEntry(loc, priority, changefreq) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

const STATIC_PAGES = [
  { path: '/',                    priority: '1.0', changefreq: 'weekly'  },
  { path: '/experiences',         priority: '0.9', changefreq: 'daily'   },
  { path: '/journal',             priority: '0.7', changefreq: 'weekly'  },
  { path: '/about',               priority: '0.6', changefreq: 'monthly' },
  { path: '/contact',             priority: '0.5', changefreq: 'monthly' },
  { path: '/companies',           priority: '0.5', changefreq: 'monthly' },
  { path: '/partners',            priority: '0.4', changefreq: 'monthly' },
  { path: '/consulting',          priority: '0.4', changefreq: 'monthly' },
  { path: '/terms',               priority: '0.2', changefreq: 'yearly'  },
  { path: '/privacy',             priority: '0.2', changefreq: 'yearly'  },
  { path: '/cancellation-policy', priority: '0.2', changefreq: 'yearly'  },
  { path: '/cookies',             priority: '0.2', changefreq: 'yearly'  },
];

const [experiences, hotels, categories, standalones, journals] = await Promise.all([
  fetchSlugs('experiences2', '&status=eq.published'),
  fetchSlugs('hotels2',      '&status=eq.published'),
  fetchSlugs('categories',   ''),
  fetchSlugs('standalone_experiences', '&status=eq.published').catch(() => []),
  fetchSlugs('journal_posts', '&status=eq.published'),
]);

const entries = [
  ...STATIC_PAGES.map(({ path, priority, changefreq }) =>
    urlEntry(`${BASE_URL}${path}`, priority, changefreq)
  ),
  ...categories.map(r => urlEntry(`${BASE_URL}/category/${r.slug}`, '0.8', 'weekly')),
  ...experiences.map(r => urlEntry(`${BASE_URL}/experience/${r.slug}`, '0.9', 'weekly')),
  ...hotels.map(r => urlEntry(`${BASE_URL}/hotel/${r.slug}`, '0.8', 'weekly')),
  ...standalones.map(r => urlEntry(`${BASE_URL}/standalone-experience/${r.slug}`, '0.8', 'weekly')),
  ...journals.map(r => urlEntry(`${BASE_URL}/journal/${r.slug}`, '0.7', 'monthly')),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries,
  '</urlset>',
].join('\n');

writeFileSync(join(ROOT, 'public', 'sitemap.xml'), xml, 'utf-8');

console.log(`✅ Sitemap généré : ${entries.length} URLs`);
console.log(`   - ${STATIC_PAGES.length} pages statiques`);
console.log(`   - ${categories.length} catégories`);
console.log(`   - ${experiences.length} expériences`);
console.log(`   - ${hotels.length} hôtels`);
console.log(`   - ${standalones.length} expériences standalone`);
console.log(`   - ${journals.length} articles de journal`);
