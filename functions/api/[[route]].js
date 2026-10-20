// Devo Productions CRM API (Cloudflare Pages Function, D1 binding: DB)
const enc = new TextEncoder();
const STAGES = ['new', 'contacted', 'quoted', 'booked', 'planning', 'done', 'lost'];
const COOKIE = 'devo_crm';
const SESSION_DAYS = 30;

const TEMPLATES = {
  wedding: ['Deposit', 'Wedding planning form', 'Ceremony and reception timeline', 'Must-play and do-not-play lists', 'Special dances and announcements', 'Venue contact and load-in details', 'Planning meeting 1', 'Planning meeting 2', 'Final headcount', 'Final payment'],
  event: ['Deposit', 'Event timeline', 'Music preferences', 'Venue contact and load-in details', 'Planning meeting', 'Final payment'],
  church: ['Walkthrough scheduled', 'Room details and current equipment', 'Budget range', 'Key contact', 'Proposal sent', 'Install date set', 'Training session scheduled'],
  training: ['Date and time', 'Who is attending', 'Board and equipment details', 'Topics wanted', 'Payment'],
  other: ['Follow up call', 'Details confirmed'],
};
const SERVICE_KEY = (s = '') => {
  s = s.toLowerCase();
  if (s.includes('wedding')) return 'wedding';
  if (s.includes('church')) return 'church';
  if (s.includes('training')) return 'training';
  if (s.includes('party') || s.includes('event')) return 'event';
  return 'other';
};

const J = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

// ---------- crypto ----------
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function hashPass(pass, saltB64) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: 100000 }, key, 256);
  return b64(bits);
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function getSetting(db, k) {
  const r = await db.prepare('SELECT value FROM settings WHERE key=?').bind(k).first();
  return r ? r.value : null;
}
async function setSetting(db, k, v) {
  await db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k, v).run();
}
function cookieOf(request, name) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
async function makeSession(db) {
  const secret = await getSetting(db, 'session_secret');
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `${exp}.${await hmac(secret, String(exp))}`;
}
async function isAuthed(request, db) {
  const t = cookieOf(request, COOKIE);
  if (!t) return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const secret = await getSetting(db, 'session_secret');
  if (!secret) return false;
  return safeEq(sig, await hmac(secret, exp));
}
const sessionCookie = (val, maxAge) => `${COOKIE}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

async function tooManyAttempts(db, kind, limit, windowMs) {
  const since = Date.now() - windowMs;
  await db.prepare('DELETE FROM attempts WHERE ts < ?').bind(Date.now() - 864e5).run();
  const r = await db.prepare('SELECT COUNT(*) c FROM attempts WHERE kind=? AND ts>?').bind(kind, since).first();
  return r.c >= limit;
}
const logAttempt = (db, kind) => db.prepare('INSERT INTO attempts (kind, ts) VALUES (?,?)').bind(kind, Date.now()).run();

// ---------- helpers ----------
async function seedNeeds(db, contactId, service) {
  const labels = TEMPLATES[SERVICE_KEY(service)];
  const t = now();
  await db.batch(labels.map((l, i) => db.prepare('INSERT INTO needs (id,contact_id,label,done,sort,created_at) VALUES (?,?,?,?,?,?)').bind(uid(), contactId, l, 0, i, t)));
}
const addNote = (db, contactId, text, kind = 'note') =>
  db.prepare('INSERT INTO notes (id,contact_id,text,kind,created_at) VALUES (?,?,?,?,?)').bind(uid(), contactId, text, kind, now()).run();


// ---------- planning form ----------
let planReady = false;
async function ensurePlans(db) {
  if (planReady) return;
  await db.prepare('CREATE TABLE IF NOT EXISTS plans (contact_id TEXT PRIMARY KEY, data TEXT, updated_at TEXT)').run();
  try { await db.prepare('ALTER TABLE contacts ADD COLUMN paid INTEGER DEFAULT 0').run(); } catch (e) { /* column already exists */ }
  for (const col of ['token TEXT', 'submitted_at TEXT', 'updated_by TEXT']) {
    try { await db.prepare('ALTER TABLE plans ADD COLUMN ' + col).run(); } catch (e) { /* column already exists */ }
  }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_plans_token ON plans(token)').run(); } catch (e) { /* ignore */ }
  planReady = true;
}
const has = (v) => v !== undefined && String(v).trim() !== '' && String(v).trim() !== '[]';
const PLAN_RULES = {
  'Ceremony and reception timeline': (p) => (p.cer_time || p.cer_start) && (p.cocktail_time || p.cocktail_start) && p.dinner_time,
  'Must-play and do-not-play lists': (p) => has(p.must_list) || has(p.dont_list) || p.must_play || p.dont_play,
  'Special dances and announcements': (p) => p.dance_bg_t || p.dance_bg_a || p.first_dance,
  'Venue contact and load-in details': (p, c) => c.venue && (p.dayof_n || p.dayof_p || p.dayof) && p.setup_time,
  'Final headcount': (p) => p.guests,
  'Wedding planning form': (p) => Object.values(p).filter((v) => has(v)).length >= (has(p.sec_off) ? 20 : 35),
};

async function savePlan(db, contactId, inc, who) {
  const cur = await db.prepare('SELECT data FROM plans WHERE contact_id=?').bind(contactId).first();
  const plan = cur ? JSON.parse(cur.data || '{}') : {};
  const prev = { ...plan };
  for (const [k, v] of Object.entries(inc || {})) {
    if (!/^[a-z0-9_]{1,48}$/.test(k)) continue;
    if (who === 'couple' && k.startsWith('quote_')) continue; // only Cade edits the quote
    const val = clip(v, /_list$/.test(k) ? 12000 : 2000);
    if (val) plan[k] = val; else delete plan[k];
  }
  const json = JSON.stringify(plan);
  if (json.length > 90000 || Object.keys(plan).length > 260) throw new Error('too big');
  if (cur) await db.prepare('UPDATE plans SET data=?, updated_at=?, updated_by=? WHERE contact_id=?').bind(json, now(), who || null, contactId).run();
  else await db.prepare('INSERT INTO plans (contact_id,data,updated_at,updated_by) VALUES (?,?,?,?)').bind(contactId, json, now(), who || null).run();
  // push useful answers back onto the customer record
  const c = await db.prepare('SELECT venue,phone FROM contacts WHERE id=?').bind(contactId).first();
  if (c) {
    if (plan.venue1 && plan.venue1 !== prev.venue1 && (!c.venue || c.venue === prev.venue1)) await db.prepare('UPDATE contacts SET venue=?, updated_at=? WHERE id=?').bind(clip(plan.venue1, 200), now(), contactId).run();
    if (plan.couple_phone && !c.phone) await db.prepare('UPDATE contacts SET phone=?, updated_at=? WHERE id=?').bind(clip(plan.couple_phone, 40), now(), contactId).run();
  }
  return reconcileNeeds(db, contactId, plan);
}
const nameToken = (name) => {
  let slug = String(name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/g, '');
  if (slug.length < 3) slug = 'planning-form';
  const a = crypto.getRandomValues(new Uint8Array(16));
  let r = ''; for (const x of a) r += '0123456789abcdefghijklmnopqrstuvwxyz'[x % 36];
  return slug + '-' + r;
};
const newToken = () => b64(crypto.getRandomValues(new Uint8Array(18))).replace(/\+/g, '-').replace(/\//g, '_');

async function reconcileNeeds(db, contactId, plan) {
  const c = await db.prepare('SELECT venue FROM contacts WHERE id=?').bind(contactId).first();
  if (!c) return [];
  const needs = (await db.prepare('SELECT id,label,done FROM needs WHERE contact_id=?').bind(contactId).all()).results;
  const hit = [];
  for (const n of needs) {
    const rule = PLAN_RULES[n.label];
    if (!n.done && rule && rule(plan, c)) {
      await db.prepare('UPDATE needs SET done=1, done_at=? WHERE id=?').bind(now(), n.id).run();
      hit.push(n.label);
    }
  }
  if (hit.length) await addNote(db, contactId, 'Checked off from the planning form: ' + hit.join(', '), 'system');
  return hit;
}

const CONTACT_FIELDS = { name: 120, email: 160, phone: 40, service: 60, event_date: 20, venue: 200, message: 4000, source: 40 };

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return J({ error: 'Database not connected' }, 500);
  const route = Array.isArray(params.route) ? params.route : [params.route];
  const method = request.method;
  const [a, b, c] = route;

  try {
    // ----- public: website form -----
    if (a === 'lead' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body.botcheck || body.website) return J({ ok: true }); // honeypot
      const name = clip(body.name, 120);
      const email = clip(body.email, 160);
      if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) return J({ error: 'Name and a valid email are required.' }, 400);
      if (await tooManyAttempts(db, 'lead', 25, 3600e3)) return J({ error: 'Too many requests.' }, 429);
      await logAttempt(db, 'lead');
      const id = uid(), t = now();
      const service = clip(body.service, 60);
      await db.prepare('INSERT INTO contacts (id,name,email,phone,service,event_date,venue,message,stage,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, name, email, clip(body.phone, 40), service, clip(body.event_date, 20), clip(body.venue, 200), clip(body.message, 4000), 'new', 'website', t, t).run();
      await seedNeeds(db, id, service);
      await addNote(db, id, 'Inquiry received from the website form.', 'system');
      return J({ ok: true });
    }

    // ----- public: couple's planning form (private link) -----
    if (a === 'plan' && b) {
      if (!/^[A-Za-z0-9_-]{20,64}$/.test(b)) return J({ error: 'This link is not valid.' }, 404);
      if (await tooManyAttempts(db, 'plantoken', 60, 3600e3)) return J({ error: 'Too many requests.' }, 429);
      await ensurePlans(db);
      const row = await db.prepare('SELECT p.contact_id, p.data, p.submitted_at, c.name, c.event_date, c.venue, c.value FROM plans p JOIN contacts c ON c.id=p.contact_id WHERE p.token=?').bind(b).first();
      if (!row) { await logAttempt(db, 'plantoken'); return J({ error: 'This link is not valid.' }, 404); }
      if (method === 'GET') {
        const all = JSON.parse(row.data || '{}');
        const data = {}, quote = all.quote_shown === 'yes' && row.value != null ? { price: row.value, items: all.quote_list || '[]', note: all.quote_note || '' } : null;
        for (const [k, v] of Object.entries(all)) if (!k.startsWith('quote_')) data[k] = v; // quote is only shown once Cade turns it on
        return J({ name: row.name, event_date: row.event_date, venue: row.venue, submitted_at: row.submitted_at, data, quote });
      }
      if (!(request.headers.get('Content-Type') || '').includes('application/json')) return J({ error: 'Bad request.' }, 400);
      const pb = await request.json().catch(() => ({}));
      if (method === 'PATCH' && !c) {
        try { await savePlan(db, row.contact_id, pb.data && typeof pb.data === 'object' ? pb.data : {}, 'couple'); } catch (e) { return J({ error: 'Too much data.' }, 400); }
        return J({ ok: true });
      }
      if (method === 'POST' && c === 'submit') {
        await db.prepare('UPDATE plans SET submitted_at=? WHERE contact_id=?').bind(now(), row.contact_id).run();
        await addNote(db, row.contact_id, 'The couple sent in their planning form.', 'system');
        return J({ ok: true });
      }
      return J({ error: 'Not found.' }, 404);
    }

    // ----- auth -----
    if (a === 'auth') {
      if (b === 'status' && method === 'GET') {
        return J({ setup: !!(await getSetting(db, 'pass_hash')), authed: await isAuthed(request, db) });
      }
      if (b === 'setup' && method === 'POST') {
        if (await getSetting(db, 'pass_hash')) return J({ error: 'Already set up.' }, 409);
        const { passcode } = await request.json().catch(() => ({}));
        if (!passcode || passcode.length < 8) return J({ error: 'Use at least 8 characters.' }, 400);
        const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
        await setSetting(db, 'pass_salt', salt);
        await setSetting(db, 'pass_hash', await hashPass(passcode, salt));
        await setSetting(db, 'session_secret', b64(crypto.getRandomValues(new Uint8Array(32))));
        return J({ ok: true }, 200, { 'Set-Cookie': sessionCookie(await makeSession(db), SESSION_DAYS * 86400) });
      }
      if (b === 'login' && method === 'POST') {
        if (await tooManyAttempts(db, 'login', 8, 15 * 60e3)) return J({ error: 'Too many tries. Wait 15 minutes.' }, 429);
        const { passcode } = await request.json().catch(() => ({}));
        const salt = await getSetting(db, 'pass_salt'), hash = await getSetting(db, 'pass_hash');
        if (!salt || !hash) return J({ error: 'Not set up.' }, 400);
        if (!passcode || !safeEq(await hashPass(String(passcode), salt), hash)) {
          await logAttempt(db, 'login');
          return J({ error: 'That passcode is not right.' }, 401);
        }
        return J({ ok: true }, 200, { 'Set-Cookie': sessionCookie(await makeSession(db), SESSION_DAYS * 86400) });
      }
      if (b === 'logout' && method === 'POST') return J({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
    }

    // ----- everything below needs login -----
    if (!(await isAuthed(request, db))) return J({ error: 'Not signed in.' }, 401);
    if (method !== 'GET' && !(request.headers.get('Content-Type') || '').includes('application/json')) return J({ error: 'Bad request.' }, 400);
    await ensurePlans(db);
    const body = method === 'GET' || method === 'DELETE' ? {} : await request.json().catch(() => ({}));

    if (a === 'auth' && b === 'change' && method === 'POST') {
      const salt = await getSetting(db, 'pass_salt'), hash = await getSetting(db, 'pass_hash');
      if (!safeEq(await hashPass(String(body.current || ''), salt), hash)) return J({ error: 'Current passcode is not right.' }, 401);
      if (!body.next || body.next.length < 8) return J({ error: 'Use at least 8 characters.' }, 400);
      const ns = b64(crypto.getRandomValues(new Uint8Array(16)));
      await setSetting(db, 'pass_salt', ns);
      await setSetting(db, 'pass_hash', await hashPass(body.next, ns));
      await setSetting(db, 'session_secret', b64(crypto.getRandomValues(new Uint8Array(32))));
      return J({ ok: true }, 200, { 'Set-Cookie': sessionCookie(await makeSession(db), SESSION_DAYS * 86400) });
    }

    if (a === 'data' && method === 'GET') {
      await ensurePlans(db);
      const [contacts, needs, notes, plans] = await Promise.all([
        db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all(),
        db.prepare('SELECT * FROM needs ORDER BY sort ASC, created_at ASC').all(),
        db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all(),
        db.prepare('SELECT * FROM plans').all(),
      ]);
      return J({ contacts: contacts.results, needs: needs.results, notes: notes.results, plans: plans.results, stages: STAGES });
    }

    if (a === 'contacts') {
      if (!b && method === 'POST') {
        const name = clip(body.name, 120);
        if (!name) return J({ error: 'Name required.' }, 400);
        const id = uid(), t = now();
        await db.prepare('INSERT INTO contacts (id,name,email,phone,service,event_date,venue,message,stage,source,created_at,updated_at,paid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .bind(id, name, clip(body.email, 160), clip(body.phone, 40), clip(body.service, 60), clip(body.event_date, 20), clip(body.venue, 200), clip(body.message, 4000), STAGES.includes(body.stage) ? body.stage : 'new', 'manual', t, t, body.paid ? 1 : 0).run();
        await seedNeeds(db, id, body.service);
        await addNote(db, id, 'Added manually.', 'system');
        return J({ id }, 201);
      }
      if (b && !c && method === 'PATCH') {
        const sets = [], vals = [];
        for (const [k, n] of Object.entries(CONTACT_FIELDS)) if (body[k] !== undefined) { sets.push(k + '=?'); vals.push(clip(body[k], n)); }
        if (body.paid !== undefined) { sets.push('paid=?'); vals.push(body.paid ? 1 : 0); }
        if (body.value !== undefined) { sets.push('value=?'); vals.push(body.value === null || body.value === '' ? null : Number(body.value) || 0); }
        if (body.stage !== undefined) {
          if (!STAGES.includes(body.stage)) return J({ error: 'Bad stage.' }, 400);
          const cur = await db.prepare('SELECT stage FROM contacts WHERE id=?').bind(b).first();
          if (cur && cur.stage !== body.stage) await addNote(db, b, `Stage: ${cur.stage} → ${body.stage}`, 'system');
          sets.push('stage=?'); vals.push(body.stage);
        }
        if (!sets.length) return J({ ok: true });
        sets.push('updated_at=?'); vals.push(now()); vals.push(b);
        await db.prepare(`UPDATE contacts SET ${sets.join(',')} WHERE id=?`).bind(...vals).run();
        return J({ ok: true });
      }
      if (b && !c && method === 'DELETE') {
        await db.batch([
          db.prepare('DELETE FROM needs WHERE contact_id=?').bind(b),
          db.prepare('DELETE FROM notes WHERE contact_id=?').bind(b),
          db.prepare('DELETE FROM plans WHERE contact_id=?').bind(b),
          db.prepare('DELETE FROM contacts WHERE id=?').bind(b),
        ]);
        return J({ ok: true });
      }
      if (b && c === 'needs' && method === 'POST') {
        const label = clip(body.label, 160);
        if (!label) return J({ error: 'Label required.' }, 400);
        const mx = await db.prepare('SELECT COALESCE(MAX(sort),0)+1 n FROM needs WHERE contact_id=?').bind(b).first();
        const id = uid();
        await db.prepare('INSERT INTO needs (id,contact_id,label,done,due,sort,created_at) VALUES (?,?,?,?,?,?,?)').bind(id, b, label, 0, clip(body.due, 20) || null, mx.n, now()).run();
        return J({ id }, 201);
      }
      if (b && c === 'plan' && method === 'GET') {
        await ensurePlans(db);
        const r = await db.prepare('SELECT data, updated_at, updated_by, submitted_at FROM plans WHERE contact_id=?').bind(b).first();
        return J(r ? { data: JSON.parse(r.data || '{}'), updated_at: r.updated_at, updated_by: r.updated_by, submitted_at: r.submitted_at } : { data: {}, updated_at: null, updated_by: null, submitted_at: null });
      }
      if (b && c === 'plan' && method === 'PATCH') {
        const inc = body.data && typeof body.data === 'object' ? body.data : {};
        let auto;
        try { auto = await savePlan(db, b, inc, 'cade'); } catch (e) { return J({ error: 'Too much data.' }, 400); }
        return J({ ok: true, auto });
      }
      if (b && c === 'plan-link' && method === 'POST') {
        const row = await db.prepare('SELECT token FROM plans WHERE contact_id=?').bind(b).first();
        if (body.revoke) {
          if (row) await db.prepare('UPDATE plans SET token=NULL WHERE contact_id=?').bind(b).run();
          return J({ token: null });
        }
        if (row && row.token && !body.renew) return J({ token: row.token });
        const cn = await db.prepare('SELECT name FROM contacts WHERE id=?').bind(b).first();
        const t = nameToken(cn && cn.name);
        if (row) await db.prepare('UPDATE plans SET token=? WHERE contact_id=?').bind(t, b).run();
        else await db.prepare("INSERT INTO plans (contact_id,data,updated_at,token) VALUES (?,?,?,?)").bind(b, '{}', now(), t).run();
        await addNote(db, b, 'Created a private planning form link for the couple.', 'system');
        return J({ token: t });
      }
      if (b && c === 'notes' && method === 'POST') {
        const text = clip(body.text, 4000);
        if (!text) return J({ error: 'Note required.' }, 400);
        await addNote(db, b, text);
        return J({ ok: true }, 201);
      }
    }

    if (a === 'needs' && b) {
      if (method === 'PATCH') {
        const sets = [], vals = [];
        if (body.label !== undefined) { sets.push('label=?'); vals.push(clip(body.label, 160)); }
        if (body.due !== undefined) { sets.push('due=?'); vals.push(clip(body.due, 20) || null); }
        if (body.done !== undefined) { sets.push('done=?', 'done_at=?'); vals.push(body.done ? 1 : 0, body.done ? now() : null); }
        if (!sets.length) return J({ ok: true });
        vals.push(b);
        await db.prepare(`UPDATE needs SET ${sets.join(',')} WHERE id=?`).bind(...vals).run();
        return J({ ok: true });
      }
      if (method === 'DELETE') { await db.prepare('DELETE FROM needs WHERE id=?').bind(b).run(); return J({ ok: true }); }
    }
    if (a === 'notes' && b && method === 'DELETE') { await db.prepare("DELETE FROM notes WHERE id=? AND kind='note'").bind(b).run(); return J({ ok: true }); }

    return J({ error: 'Not found.' }, 404);
  } catch (e) {
    console.error('crm api', e && e.stack || e);
    return J({ error: 'Server error.' }, 500);
  }
}
