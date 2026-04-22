import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { buildSeedData, nowIso } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.join(__dirname, 'db.json');
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'jobsdirect-dev-secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
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

function collapseWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function parseFirstNumber(value = '') {
  const match = String(value).match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function parseMoneyValues(value = '') {
  const matches = [...String(value).matchAll(/(?:€|EUR|Euro)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})(?:\.\d{1,2})?/gi)];
  const nums = matches.map((match) => Number(match[1].replace(/,/g, ''))).filter(Number.isFinite);
  if (!nums.length) return { min: null, max: null };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function inferSalaryPeriod(value = '') {
  const normalized = String(value).toLowerCase();
  if (/(annually|annual|per year|\/year|\bpa\b|p\.a)/i.test(normalized)) return 'annual';
  if (/(monthly|per month|\/month)/i.test(normalized)) return 'monthly';
  if (/(weekly|per week|\/week)/i.test(normalized)) return 'weekly';
  if (/(hourly|per hour|\/hour)/i.test(normalized)) return 'hourly';
  return null;
}

function extractCityTown(locationText = '') {
  const parts = String(locationText)
    .split(',')
    .map((part) => collapseWhitespace(part))
    .filter(Boolean);
  if (!parts.length) return '';
  const countyIndex = parts.findIndex((part) => /^co\.?\s+/i.test(part));
  if (countyIndex > 0) return parts[countyIndex - 1];
  const fallback = parts.find((part) => /^[A-Za-z][A-Za-z\s'.-]+$/.test(part) && !/^(co\.?|ireland)$/i.test(part));
  return fallback || parts[parts.length - 1];
}

function extractEmail(value = '') {
  const match = String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : '';
}

function extractJobsIrelandData(html, sourceUrl) {
  const $ = cheerio.load(html);
  const title = collapseWhitespace($('.job-details h3').first().text());
  const description = collapseWhitespace($('.job-description pre').first().text());
  const shortDescription = description ? description.slice(0, 200) : '';
  const details = $('.job-details ul li')
    .map((_, li) => ({
      alt: collapseWhitespace($(li).find('img').attr('alt') || ''),
      text: collapseWhitespace($(li).text()),
    }))
    .get()
    .filter((item) => item.text);

  const locationItem = details.find((item) => /location/i.test(item.alt)) || details.find((item) => /co\.\s|ireland/i.test(item.text));
  const locationFull = locationItem?.text || '';
  const cityTown = extractCityTown(locationFull);
  const positionsItem = details.find((item) => /positions?/i.test(item.text));
  const hoursItem = details.find((item) => /hours?\s*per\s*week/i.test(item.text));
  const salaryItem = details.find((item) => /euro|€|salary/i.test(item.text));
  const careerLevel = collapseWhitespace(
    $('h4')
      .filter((_, h4) => collapseWhitespace($(h4).text()).toLowerCase() === 'career level')
      .first()
      .nextAll('ul')
      .first()
      .find('li')
      .first()
      .text(),
  );

  const sourceText = `${description} ${salaryItem?.text || ''}`;
  const salary = parseMoneyValues(sourceText);
  const salaryPeriod = inferSalaryPeriod(sourceText);
  const applicationEmail = extractEmail(description) || extractEmail($.root().text());
  const payload = {
    title,
    description,
    short_description: shortDescription,
    location: cityTown || locationFull,
    city_town: cityTown || null,
    location_full: locationFull || null,
    country: 'Ireland',
    hours_per_week: parseFirstNumber(hoursItem?.text || ''),
    positions_count: parseFirstNumber(positionsItem?.text || ''),
    salary_min: salary.min,
    salary_max: salary.max,
    salary_type: salary.min || salary.max ? 'fixed' : null,
    salary_period: salaryPeriod || null,
    career_level: careerLevel || null,
    application_email: applicationEmail || null,
    application_method: applicationEmail ? 'email' : 'platform',
    application_url: sourceUrl,
    source_url: sourceUrl,
  };

  const hasCoreData = payload.title && payload.description;
  return hasCoreData ? payload : null;
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

app.post('/api/functions/scrapeJobsIreland', authRequired, async (req, res) => {
  const ref = String(req.body?.ref || '').trim();
  if (!/^\d{6,10}$/.test(ref)) {
    return res.status(400).json({ message: 'A valid numeric JobsIreland reference ID is required' });
  }

  const sourceUrl = `https://jobsireland.ie/en-US/job-Details?id=${encodeURIComponent(ref)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'JobsDirect.ie Import Bot/1.0 (+https://jobsdirect.ie)',
      },
    });

    if (!response.ok) {
      return res.status(404).json({ message: `JobsIreland job not found for reference ${ref}` });
    }

    const html = await response.text();
    const data = extractJobsIrelandData(html, sourceUrl);
    if (!data) {
      return res.status(422).json({ message: 'Could not extract job details from JobsIreland page' });
    }

    return res.json({ success: true, data, source_url: sourceUrl });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ message: 'Timed out while contacting JobsIreland' });
    }
    return res.status(500).json({ message: 'Failed to import JobsIreland job data' });
  } finally {
    clearTimeout(timeout);
  }
});

seedPasswords().then(() => {
  app.listen(PORT, () => {
    console.log(`JobsDirect API running on http://localhost:${PORT}`);
  });
});
