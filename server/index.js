import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSeedData, nowIso } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'db.json');
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'jobsdirect-dev-secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function ensureDb() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(buildSeedData(), null, 2));
  }
  const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(parsed.users)) parsed.users = [];
  return parsed;
}

function writeDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

async function seedPasswords() {
  const db = ensureDb();
  const defaults = {
    'admin@jobsdirect.ie': 'Admin123!',
    'sarah.murphy@lumenlabs.ie': 'Employer123!',
    'liam.oconnor@gmail.com': 'Employee123!',
  };
  let changed = false;
  for (const user of db.users) {
    if (!user.password_hash && defaults[user.email]) {
      user.password_hash = await bcrypt.hash(defaults[user.email], 10);
      changed = true;
    }
  }
  if (changed) writeDb(db);
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = ensureDb();
    const user = db.users.find((item) => item.id === payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = publicUser(user);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

function sortItems(items, order = '-created_date') {
  const desc = order.startsWith('-');
  const field = desc ? order.slice(1) : order;
  return [...items].sort((a, b) => {
    const av = a?.[field] ?? '';
    const bv = b?.[field] ?? '';
    if (av === bv) return 0;
    return desc ? (av < bv ? 1 : -1) : (av > bv ? 1 : -1);
  });
}

function filterItems(items, query) {
  const filters = { ...query };
  delete filters.order;
  delete filters.limit;
  return items.filter((item) => Object.entries(filters).every(([key, value]) => String(item?.[key]) === String(value)));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'jobsdirect-api' });
});

app.post('/api/auth/register', async (req, res) => {
  const { full_name, email, password, role = 'employee' } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password || !full_name) {
    return res.status(400).json({ message: 'Full name, email, and password are required' });
  }
  const db = ensureDb();
  const existing = db.users.find((item) => item.email === normalizedEmail);
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const user = {
    id: randomId('user'),
    email: normalizedEmail,
    password_hash: await bcrypt.hash(password, 10),
    full_name: full_name.trim(),
    role,
    created_date: nowIso(),
    updated_date: nowIso(),
  };
  db.users.unshift(user);
  writeDb(db);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const db = ensureDb();
  const user = db.users.find((item) => item.email === normalizedEmail);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  const ok = await bcrypt.compare(String(password || ''), user.password_hash || '');
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json(req.user);
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true });
});

app.get('/api/entities/:entity', (req, res) => {
  const db = ensureDb();
  const items = db[req.params.entity] || [];
  const filtered = filterItems(items, req.query);
  const sorted = sortItems(filtered, String(req.query.order || '-created_date'));
  const limit = req.query.limit ? Number(req.query.limit) : null;
  res.json(limit ? sorted.slice(0, limit) : sorted);
});

app.post('/api/entities/:entity', (req, res, next) => {
  if (req.params.entity === 'ContactMessage') return next();
  return authRequired(req, res, next);
}, (req, res) => {
  const db = ensureDb();
  const entityName = req.params.entity;
  const collection = db[entityName] || [];
  const payload = req.body || {};
  const item = {
    id: payload.id || randomId(entityName.toLowerCase()),
    ...payload,
    created_by: payload.created_by || req.user.email,
    created_date: payload.created_date || nowIso(),
    updated_date: nowIso(),
  };
  db[entityName] = [item, ...collection];
  writeDb(db);
  res.status(201).json(item);
});

app.patch('/api/entities/:entity/:id', authRequired, (req, res) => {
  const db = ensureDb();
  const entityName = req.params.entity;
  const collection = db[entityName] || [];
  const index = collection.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: `${entityName} not found` });
  const updated = { ...collection[index], ...req.body, updated_date: nowIso() };
  collection[index] = updated;
  db[entityName] = collection;
  writeDb(db);
  res.json(updated);
});

app.post('/api/functions/scrapeJobsIreland', authRequired, (req, res) => {
  const ref = String(req.body?.ref || '0000000');
  const titleSeed = Number(ref.slice(-2)) || 42;
  const categories = ['technology', 'healthcare', 'finance', 'education', 'engineering', 'sales'];
  const locations = ['Dublin', 'Cork', 'Galway', 'Limerick'];
  const data = {
    title: `Imported Role ${ref}`,
    short_description: 'Imported from the JobsDirect.ie JobsIreland compatibility layer.',
    description: `This is a server-side generated JobsDirect.ie import for JobsIreland reference ${ref}. Review the role details before publishing.`,
    location: locations[titleSeed % locations.length],
    job_type: titleSeed % 2 === 0 ? 'full_time' : 'contract',
    category: categories[titleSeed % categories.length],
    salary_min: 35000 + titleSeed * 100,
    salary_max: 45000 + titleSeed * 150,
    salary_period: 'annual',
    benefits: 'Flexible working, pension contribution, learning stipend',
    application_method: 'platform',
    application_url: `https://jobsireland.ie/en-US/job-Details?id=${ref}`,
    slug: slugify(`Imported Role ${ref}`),
  };
  res.json({ success: true, data, source_url: data.application_url });
});

seedPasswords().then(() => {
  app.listen(PORT, () => {
    console.log(`JobsDirect API running on http://localhost:${PORT}`);
  });
});
