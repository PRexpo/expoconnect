/* ═══════════════════════════════════════════════════
   supabase.js — ExpoConnect Database Layer
   Replace SUPABASE_URL and SUPABASE_ANON_KEY below
   ═══════════════════════════════════════════════════

   TABLES REQUIRED IN SUPABASE:
   ─────────────────────────────
   expos:
     id, name, city, state, venue, category, description,
     start_date, end_date, ticket_price (int, 0=free),
     total_stalls, status (live|upcoming|past),
     thumb_grad (css string), emoji, organizer_id,
     created_at, approved (bool)

   organizers:
     id, name, org_name, email, phone, city, state,
     category, experience (years), website, description,
     created_at, status (pending|approved|rejected)

   stalls:
     id, expo_id, business_name, category, products (text[]),
     description, phone, email, whatsapp, stall_type,
     stall_number, contact_name, city,
     created_at, status (pending|approved|rejected)

   visitors:
     id, name, email, phone, city, expo_id, ticket_count,
     interests (text[]), created_at

   contacts:
     id, name, email, phone, subject, message, created_at, replied (bool)

   admins:
     id, email, password_hash (use Supabase Auth instead), name, role
*/

// ── CONFIG — replace with your real keys ──────────────────────
const SUPABASE_URL      =  'https://ialogqpmndmrehhcmtlc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4BC12rpvLQFEJrheK50iyQ_Ud-GyCLA';
// ──────────────────────────────────────────────────────────────

// Lazy-init: only run if Supabase SDK is loaded
let _sb = null;
function sb() {
  if (!_sb) {
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('Supabase SDK not loaded. Add the CDN script before supabase.js');
      return null;
    }
    _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _sb;
}

/* ────────────────────────────────────────────────────
   GENERIC HELPERS
   ──────────────────────────────────────────────────── */
async function dbInsert(table, data) {
  const client = sb();
  if (!client) return { data: null, error: { message: 'Supabase not configured' } };
  const { data: res, error } = await client.from(table).insert([data]).select().single();
  return { data: res, error };
}

async function dbSelect(table, filters = {}, options = {}) {
  const client = sb();
  if (!client) return { data: [], error: null };
  let q = client.from(table).select(options.select || '*');
  Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
  if (options.order)  q = q.order(options.order, { ascending: options.asc ?? false });
  if (options.limit)  q = q.limit(options.limit);
  const { data, error } = await q;
  return { data: data || [], error };
}

async function dbUpdate(table, id, data) {
  const client = sb();
  if (!client) return { data: null, error: { message: 'Supabase not configured' } };
  const { data: res, error } = await client.from(table).update(data).eq('id', id).select().single();
  return { data: res, error };
}

/* ────────────────────────────────────────────────────
   EXPOS
   ──────────────────────────────────────────────────── */
const Expos = {
  async getAll(status = null) {
    const filters = status ? { status, approved: true } : { approved: true };
    return dbSelect('expos', filters, { order: 'start_date', asc: true });
  },
  async getById(id) {
    const client = sb();
    if (!client) return { data: null, error: null };
    const { data, error } = await client.from('expos').select('*').eq('id', id).single();
    return { data, error };
  },
  async getNames() {
    // For dropdown population
    const client = sb();
    if (!client) return [];
    const { data } = await client.from('expos').select('id, name, status').eq('approved', true).order('start_date');
    return data || [];
  },
};

/* ────────────────────────────────────────────────────
   ORGANIZERS
   ──────────────────────────────────────────────────── */
const Organizers = {
  async register(formData) {
    return dbInsert('organizers', { ...formData, status: 'pending' });
  },
  async getAll() {
    return dbSelect('organizers', {}, { order: 'created_at' });
  },
  async approve(id) {
    return dbUpdate('organizers', id, { status: 'approved' });
  },
  async reject(id) {
    return dbUpdate('organizers', id, { status: 'rejected' });
  },
};

/* ────────────────────────────────────────────────────
   STALLS / EXHIBITORS
   ──────────────────────────────────────────────────── */
const Stalls = {
  async register(formData) {
    return dbInsert('stalls', { ...formData, status: 'pending' });
  },
  async getByExpo(expoId) {
    return dbSelect('stalls', { expo_id: expoId, status: 'approved' }, { order: 'created_at' });
  },
  async getAll() {
    return dbSelect('stalls', {}, { order: 'created_at' });
  },
  async approve(id) {
    return dbUpdate('stalls', id, { status: 'approved' });
  },
  async reject(id) {
    return dbUpdate('stalls', id, { status: 'rejected' });
  },
};

/* ────────────────────────────────────────────────────
   VISITORS
   ──────────────────────────────────────────────────── */
const Visitors = {
  async register(formData) {
    return dbInsert('visitors', formData);
  },
  async getByExpo(expoId) {
    return dbSelect('visitors', { expo_id: expoId }, { order: 'created_at' });
  },
};

/* ────────────────────────────────────────────────────
   CONTACTS
   ──────────────────────────────────────────────────── */
const Contacts = {
  async submit(formData) {
    return dbInsert('contacts', { ...formData, replied: false });
  },
  async getAll() {
    return dbSelect('contacts', {}, { order: 'created_at' });
  },
};

/* ────────────────────────────────────────────────────
   AUTH (Admin)
   ──────────────────────────────────────────────────── */
const Auth = {
  async signIn(email, password) {
    const client = sb();
    if (!client) return { error: { message: 'Supabase not configured' } };
    return client.auth.signInWithPassword({ email, password });
  },
  async signOut() {
    const client = sb();
    if (!client) return;
    return client.auth.signOut();
  },
  async getSession() {
    const client = sb();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session || null;
  },
  async requireAuth() {
    const session = await Auth.getSession();
    if (!session) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  },
};
