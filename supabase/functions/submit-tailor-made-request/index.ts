// submit-tailor-made-request — Edge Function
// Reçoit le formulaire « Tailor-made request » du site (3 étapes), vérifie les réponses, puis
// enregistre la demande en une seule opération (fonction SQL create_tailor_made_request) : un
// dossier de voyage au statut « Demande sur-mesure », visible dans la page Réservations.
// Prévient ensuite l'équipe par email. L'email est secondaire : s'il échoue, la demande reste
// enregistrée et le client voit sa confirmation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = 'shana@staymakom.com';

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'https://staymakom.com',
  'https://www.staymakom.com',
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  // Versions de test du site (liens de prévisualisation Vercel du projet staymakom).
  /^https:\/\/staymakom-[a-z0-9-]+\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
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

const escapeHTML = (str: string): string =>
  (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Libellés français : ce que Shana lit dans le back-office et dans l'email.
const TYPES_SEJOUR: Record<string, string> = {
  trip_sur_mesure: 'Trip sur-mesure',
  romantic_getaway: 'Romantic Getaway',
  proposal: 'Proposal',
  celebration: 'Celebration',
  friends_group: 'Friends & Group',
  autre: 'Autre',
};
const BUDGETS: Record<string, string> = {
  moins_500: 'Moins de 500 €',
  '500_1000': '500 à 1 000 €',
  '1000_2000': '1 000 à 2 000 €',
  '2000_4000': '2 000 à 4 000 €',
  plus_4000: '4 000 € et plus',
  ne_sait_pas: 'Ne sait pas encore',
};
const MOODS: Record<string, string> = {
  romantic: 'Romantique',
  famille: 'Famille',
  amis: 'Amis',
  entreprise: 'Entreprise',
  autre: 'Autre',
};
const REGIONS: Record<string, string> = {
  tlv: 'Tel Aviv et la côte',
  jlm: 'Jérusalem',
  gal: 'Galilée et Golan',
  car: 'Carmel et Haïfa',
  neg: 'Néguev et mer Morte',
  eil: 'Eilat et Arava',
};
const CONTRAINTES: Record<string, string> = {
  kasher: 'Kasher',
  shabbat: 'Shabbat',
  accessibilite: 'Accessibilité',
};
const LANGUES = ['fr', 'en', 'he'];
const SOURCE_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer', 'landing_page'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const PHONE = /^\+\d{8,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
const int = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) ? value : null;
const knownList = (value: unknown, known: Record<string, string>): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string' && v in known))] : [];

type Validation = { ok: true; payload: Record<string, unknown> } | { ok: false; errors: string[] };

/** Vérifie les réponses et ne garde que les champs attendus, nettoyés. */
function validate(body: Record<string, unknown>): Validation {
  const errors: string[] = [];

  const firstName = text(body.first_name, 80);
  if (!firstName) errors.push('first_name');
  const whatsapp = text(body.whatsapp, 20).replace(/[\s().-]/g, '');
  if (!PHONE.test(whatsapp)) errors.push('whatsapp');
  const email = text(body.email, 255).toLowerCase();
  if (email && !EMAIL.test(email)) errors.push('email');
  const langue = text(body.langue, 2);
  if (!LANGUES.includes(langue)) errors.push('langue');

  const typeSejour = text(body.type_sejour, 40);
  if (!(typeSejour in TYPES_SEJOUR)) errors.push('type_sejour');
  const typeSejourAutre = typeSejour === 'autre' ? text(body.type_sejour_autre, 200) : '';
  if (typeSejour === 'autre' && !typeSejourAutre) errors.push('type_sejour_autre');

  const datesMode = text(body.dates_mode, 10);
  const dates: Record<string, unknown> = { dates_mode: datesMode };
  if (datesMode === 'precises') {
    const debut = text(body.date_debut, 10);
    const fin = text(body.date_fin, 10);
    if (!ISO_DATE.test(debut) || !ISO_DATE.test(fin) || fin < debut) errors.push('dates');
    dates.date_debut = debut;
    dates.date_fin = fin;
  } else if (datesMode === 'flexibles') {
    const mois = text(body.mois, 7);
    const nuits = int(body.nb_nuits);
    if (!ISO_MONTH.test(mois) || nuits === null || nuits < 1 || nuits > 60) errors.push('dates');
    dates.mois = mois;
    dates.nb_nuits = nuits;
  } else {
    errors.push('dates_mode');
  }

  const adultes = int(body.adultes);
  const enfants = int(body.enfants) ?? 0;
  if (adultes === null || adultes < 1 || adultes > 30) errors.push('adultes');
  if (enfants < 0 || enfants > 15) errors.push('enfants');
  const ages = Array.isArray(body.ages_enfants) ? body.ages_enfants.map(int) : [];
  if (ages.length !== enfants || ages.some((a) => a === null || a < 0 || a > 17)) errors.push('ages_enfants');

  const budget = text(body.budget, 20);
  if (!(budget in BUDGETS)) errors.push('budget');

  const moods = knownList(body.moods, MOODS);
  const moodAutre = moods.includes('autre') ? text(body.mood_autre, 200) : '';

  const surprenezMoi = body.surprenez_moi === true;
  const regions = surprenezMoi ? [] : knownList(body.regions, REGIONS);
  if (!surprenezMoi && regions.length === 0) errors.push('regions');

  if (typeof body.premier_voyage !== 'boolean') errors.push('premier_voyage');

  const rawSource = (body.source && typeof body.source === 'object' ? body.source : {}) as Record<string, unknown>;
  const source: Record<string, string> = {};
  for (const key of SOURCE_KEYS) {
    const value = text(rawSource[key], 500);
    if (value) source[key] = value;
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      first_name: firstName,
      whatsapp,
      email: email || null,
      langue,
      type_sejour: typeSejour,
      type_sejour_autre: typeSejourAutre || null,
      ...dates,
      adultes,
      enfants,
      ages_enfants: ages,
      budget,
      moods,
      mood_autre: moodAutre || null,
      regions,
      regions_libelles: surprenezMoi ? ['Surprenez-moi'] : regions.map((r) => REGIONS[r]),
      surprenez_moi: surprenezMoi,
      contraintes: knownList(body.contraintes, CONTRAINTES),
      contrainte_autre: text(body.contrainte_autre, 300) || null,
      premier_voyage: body.premier_voyage,
      message: text(body.message, 2000) || null,
      source,
    },
  };
}

function datesLabel(p: Record<string, any>): string {
  if (p.dates_mode === 'flexibles') return `Flexibles : ${p.mois}, ${p.nb_nuits} nuit${p.nb_nuits > 1 ? 's' : ''}`;
  return `Du ${p.date_debut} au ${p.date_fin}`;
}

function travellersLabel(p: Record<string, any>): string {
  const adults = `${p.adultes} adulte${p.adultes > 1 ? 's' : ''}`;
  if (!p.enfants) return adults;
  return `${adults}, ${p.enfants} enfant${p.enfants > 1 ? 's' : ''} (${p.ages_enfants.join(', ')} ans)`;
}

/** Email interne à l'équipe : même habillage simple que les autres notifications de demande. */
function buildNotification(p: Record<string, any>, id: string, reference: string) {
  const typeLabel = p.type_sejour_autre || TYPES_SEJOUR[p.type_sejour];
  const constraints = [...p.contraintes.map((c: string) => CONTRAINTES[c]), p.contrainte_autre].filter(Boolean).join(', ');
  const source = p.source.utm_source
    ? [p.source.utm_source, p.source.utm_medium, p.source.utm_campaign].filter(Boolean).join(' / ')
    : p.source.referrer || 'Accès direct';
  const row = (label: string, value: string) =>
    value ? `<tr><td style="color:#999;padding-right:12px;vertical-align:top;">${label}</td><td>${escapeHTML(value)}</td></tr>` : '';

  const subject = `Nouvelle demande sur-mesure ${reference} : ${p.first_name}, ${typeLabel}`;
  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6;">
      <p style="font-size:17px;font-weight:700;">Nouvelle demande sur-mesure ${escapeHTML(reference)}</p>
      <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
        ${row('Client', p.first_name)}
        ${row('WhatsApp', p.whatsapp)}
        ${row('Email', p.email || '')}
        ${row('Langue', p.langue.toUpperCase())}
        ${row('Type de séjour', typeLabel)}
        ${row('Dates', datesLabel(p))}
        ${row('Voyageurs', travellersLabel(p))}
        ${row('Budget', BUDGETS[p.budget])}
        ${row('Envies', p.moods.map((m: string) => (m === 'autre' && p.mood_autre) || MOODS[m]).join(', '))}
        ${row('Régions', p.regions_libelles.join(', '))}
        ${row('Contraintes', constraints)}
        ${row('Premier voyage en Israël', p.premier_voyage ? 'Oui' : 'Non')}
        ${row('Source', source)}
      </table>
      ${p.message ? `<p style="color:#999;margin-bottom:4px;">Message</p><p style="white-space:pre-line;">${escapeHTML(p.message)}</p>` : ''}
      <p style="margin-top:24px;">
        <a href="https://staymakom.com/admin/dossiers/${id}" style="display:inline-block;background:#ad1414;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:700;">
          Voir la demande
        </a>
      </p>
    </div>`;
  return { subject, html };
}

async function notifyTeam(p: Record<string, any>, id: string, reference: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured, notification skipped');
    return;
  }
  const { subject, html } = buildNotification(p, id, reference);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'StayMakom <hello@staymakom.com>',
      ...(p.email ? { reply_to: p.email } : {}),
      to: [NOTIFY_EMAIL],
      subject,
      html,
    }),
  });
  if (!response.ok) console.error('Resend error (non-blocking):', await response.text());
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const validation = validate(body && typeof body === 'object' ? body : {});
    if (!validation.ok) return json({ success: false, error: 'Validation failed', fields: validation.errors }, 400);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await supabase.rpc('create_tailor_made_request', { p: validation.payload });
    if (error || !data?.id) {
      console.error('create_tailor_made_request failed:', error);
      return json({ success: false, error: 'Failed to save request' }, 500);
    }

    try {
      await notifyTeam(validation.payload, data.id, data.reference);
    } catch (notifyError) {
      console.error('Notification failed (non-blocking):', notifyError);
    }

    return json({ success: true, reference: data.reference }, 201);
  } catch (err) {
    console.error('submit-tailor-made-request error:', err);
    return json({ success: false, error: 'Internal error' }, 500);
  }
});
