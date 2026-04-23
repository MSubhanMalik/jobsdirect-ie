import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { buildSeedData, nowIso } from './seed.js';

const { Pool } = pg;

const DEFAULT_PASSWORDS = {
  'admin@jobsdirect.ie': 'Admin123!',
  'sarah.murphy@lumenlabs.ie': 'Employer123!',
  'liam.oconnor@gmail.com': 'Employee123!',
};

export function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
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

export function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

function resolveStorageMode() {
  if (process.env.DATA_PROVIDER) return process.env.DATA_PROVIDER;
  return process.env.DATABASE_URL ? 'postgres' : 'file';
}

function createFileStore() {
  const dataFile = process.env.DATA_FILE
    ? path.resolve(process.env.DATA_FILE)
    : path.resolve(process.cwd(), 'server', 'db.json');

  function ensureDb() {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify(buildSeedData(), null, 2));
    }
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!Array.isArray(parsed.password_resets)) parsed.password_resets = [];
    if (!Array.isArray(parsed.email_verifications)) parsed.email_verifications = [];
    return parsed;
  }

  function writeDb(db) {
    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
  }

  return {
    mode: 'file',
    async init() {
      const db = ensureDb();
      let changed = false;
      for (const user of db.users) {
        if (!user.password_hash && DEFAULT_PASSWORDS[user.email]) {
          user.password_hash = await bcrypt.hash(DEFAULT_PASSWORDS[user.email], 10);
          changed = true;
        }
        if (typeof user.email_verified !== 'boolean') {
          user.email_verified = true;
          changed = true;
        }
      }
      if (changed) writeDb(db);
    },
    async findUserById(id) {
      const db = ensureDb();
      return db.users.find((item) => item.id === id) || null;
    },
    async findUserByEmail(email) {
      const db = ensureDb();
      return db.users.find((item) => item.email === email) || null;
    },
    async createUser(payload) {
      const db = ensureDb();
      db.users.unshift(payload);
      writeDb(db);
      return payload;
    },
    async createPasswordReset(payload) {
      const db = ensureDb();
      db.password_resets = [
        payload,
        ...db.password_resets.filter((item) => item.email !== payload.email),
      ];
      writeDb(db);
      return payload;
    },
    async findPasswordResetByToken(token) {
      const db = ensureDb();
      return db.password_resets.find((item) => item.token === token) || null;
    },
    async deletePasswordResetByToken(token) {
      const db = ensureDb();
      const next = db.password_resets.filter((item) => item.token !== token);
      db.password_resets = next;
      writeDb(db);
    },
    async deletePasswordResetsByEmail(email) {
      const db = ensureDb();
      db.password_resets = db.password_resets.filter((item) => item.email !== email);
      writeDb(db);
    },
    async updateUserPassword(email, passwordHash) {
      const db = ensureDb();
      const index = db.users.findIndex((item) => item.email === email);
      if (index === -1) return null;
      const updated = {
        ...db.users[index],
        password_hash: passwordHash,
        updated_date: nowIso(),
      };
      db.users[index] = updated;
      writeDb(db);
      return updated;
    },
    async updateUser(email, updates) {
      const db = ensureDb();
      const index = db.users.findIndex((item) => item.email === email);
      if (index === -1) return null;
      const updated = {
        ...db.users[index],
        ...updates,
        updated_date: nowIso(),
      };
      db.users[index] = updated;
      writeDb(db);
      return updated;
    },
    async createEmailVerification(payload) {
      const db = ensureDb();
      db.email_verifications = [
        payload,
        ...db.email_verifications.filter((item) => item.email !== payload.email),
      ];
      writeDb(db);
      return payload;
    },
    async findEmailVerification(email) {
      const db = ensureDb();
      return db.email_verifications.find((item) => item.email === email) || null;
    },
    async deleteEmailVerification(email) {
      const db = ensureDb();
      db.email_verifications = db.email_verifications.filter((item) => item.email !== email);
      writeDb(db);
    },
    async listEntities(entityName, query = {}) {
      const db = ensureDb();
      const items = db[entityName] || [];
      const filtered = filterItems(items, query);
      const sorted = sortItems(filtered, String(query.order || '-created_date'));
      const limit = query.limit ? Number(query.limit) : null;
      return limit ? sorted.slice(0, limit) : sorted;
    },
    async createEntity(entityName, payload) {
      const db = ensureDb();
      const collection = db[entityName] || [];
      db[entityName] = [payload, ...collection];
      writeDb(db);
      return payload;
    },
    async updateEntity(entityName, id, updates) {
      const db = ensureDb();
      const collection = db[entityName] || [];
      const index = collection.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const updated = { ...collection[index], ...updates, updated_date: nowIso() };
      collection[index] = updated;
      db[entityName] = collection;
      writeDb(db);
      return updated;
    },
  };
}

function createPostgresStore() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DATA_PROVIDER=postgres');
  }

  const shouldUseSsl = process.env.PGSSLMODE === 'require' || process.env.DATABASE_SSL === 'true';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  });

  async function query(text, params = []) {
    const result = await pool.query(text, params);
    return result;
  }

  async function seedUsersIfNeeded() {
    const countResult = await query('SELECT COUNT(*)::int AS count FROM users');
    if (countResult.rows[0]?.count > 0) return;

    const seed = buildSeedData();
    for (const user of seed.users) {
      const password = DEFAULT_PASSWORDS[user.email] || randomId('pwd');
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, created_date, updated_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.id,
          user.email,
          await bcrypt.hash(password, 10),
          user.full_name,
          user.role,
          user.created_date,
          user.updated_date,
        ],
      );
    }

    for (const [entityName, records] of Object.entries(seed)) {
      if (entityName === 'users') continue;
      for (const record of records) {
        await query(
          `INSERT INTO entity_records (entity_name, record_id, payload, created_date, updated_date, created_by)
           VALUES ($1, $2, $3::jsonb, $4, $5, $6)
           ON CONFLICT (entity_name, record_id) DO NOTHING`,
          [
            entityName,
            record.id,
            JSON.stringify(record),
            record.created_date || nowIso(),
            record.updated_date || nowIso(),
            record.created_by || null,
          ],
        );
      }
    }
  }

  return {
    mode: 'postgres',
    async init() {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'employee',
          created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS entity_records (
          entity_name TEXT NOT NULL,
          record_id TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_by TEXT NULL,
          PRIMARY KEY (entity_name, record_id)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS password_resets (
          token TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          email TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await seedUsersIfNeeded();
    },
    async findUserById(id) {
      const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return result.rows[0] || null;
    },
    async findUserByEmail(email) {
      const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
      return result.rows[0] || null;
    },
    async createUser(payload) {
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, created_date, updated_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          payload.id,
          payload.email,
          payload.password_hash,
          payload.full_name,
          payload.role,
          payload.created_date,
          payload.updated_date,
        ],
      );
      return payload;
    },
    async createPasswordReset(payload) {
      await query('DELETE FROM password_resets WHERE email = $1', [payload.email]);
      await query(
        `INSERT INTO password_resets (token, email, expires_at, created_date)
         VALUES ($1, $2, $3, $4)`,
        [payload.token, payload.email, payload.expires_at, payload.created_date || nowIso()],
      );
      return payload;
    },
    async findPasswordResetByToken(token) {
      const result = await query(
        'SELECT token, email, expires_at, created_date FROM password_resets WHERE token = $1 LIMIT 1',
        [token],
      );
      return result.rows[0] || null;
    },
    async deletePasswordResetByToken(token) {
      await query('DELETE FROM password_resets WHERE token = $1', [token]);
    },
    async deletePasswordResetsByEmail(email) {
      await query('DELETE FROM password_resets WHERE email = $1', [email]);
    },
    async updateUserPassword(email, passwordHash) {
      const result = await query(
        `UPDATE users
         SET password_hash = $2, updated_date = $3
         WHERE email = $1
         RETURNING *`,
        [email, passwordHash, nowIso()],
      );
      return result.rows[0] || null;
    },
    async updateUser(email, updates) {
      const fields = Object.entries(updates || {}).filter(([, value]) => value !== undefined);
      if (!fields.length) return this.findUserByEmail(email);

      const assignments = fields.map(([key], index) => `${key} = $${index + 2}`);
      const values = fields.map(([, value]) => value);
      const result = await query(
        `UPDATE users
         SET ${assignments.join(', ')}, updated_date = $${fields.length + 2}
         WHERE email = $1
         RETURNING *`,
        [email, ...values, nowIso()],
      );
      return result.rows[0] || null;
    },
    async createEmailVerification(payload) {
      await query('DELETE FROM email_verifications WHERE email = $1', [payload.email]);
      await query(
        `INSERT INTO email_verifications (email, code, expires_at, created_date)
         VALUES ($1, $2, $3, $4)`,
        [payload.email, payload.code, payload.expires_at, payload.created_date || nowIso()],
      );
      return payload;
    },
    async findEmailVerification(email) {
      const result = await query(
        'SELECT email, code, expires_at, created_date FROM email_verifications WHERE email = $1 LIMIT 1',
        [email],
      );
      return result.rows[0] || null;
    },
    async deleteEmailVerification(email) {
      await query('DELETE FROM email_verifications WHERE email = $1', [email]);
    },
    async listEntities(entityName, queryParams = {}) {
      const result = await query(
        'SELECT payload FROM entity_records WHERE entity_name = $1',
        [entityName],
      );
      const items = result.rows.map((row) => row.payload);
      const filtered = filterItems(items, queryParams);
      const sorted = sortItems(filtered, String(queryParams.order || '-created_date'));
      const limit = queryParams.limit ? Number(queryParams.limit) : null;
      return limit ? sorted.slice(0, limit) : sorted;
    },
    async createEntity(entityName, payload) {
      await query(
        `INSERT INTO entity_records (entity_name, record_id, payload, created_date, updated_date, created_by)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
        [
          entityName,
          payload.id,
          JSON.stringify(payload),
          payload.created_date || nowIso(),
          payload.updated_date || nowIso(),
          payload.created_by || null,
        ],
      );
      return payload;
    },
    async updateEntity(entityName, id, updates) {
      const existing = await query(
        'SELECT payload FROM entity_records WHERE entity_name = $1 AND record_id = $2 LIMIT 1',
        [entityName, id],
      );
      const current = existing.rows[0]?.payload;
      if (!current) return null;

      const updated = { ...current, ...updates, updated_date: nowIso() };
      await query(
        `UPDATE entity_records
         SET payload = $3::jsonb, updated_date = $4
         WHERE entity_name = $1 AND record_id = $2`,
        [entityName, id, JSON.stringify(updated), updated.updated_date],
      );
      return updated;
    },
  };
}

export function createStore() {
  const mode = resolveStorageMode();
  if (mode === 'postgres') return createPostgresStore();
  return createFileStore();
}
