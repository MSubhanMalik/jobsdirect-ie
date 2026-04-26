import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { createStore, publicUser, randomId, randomToken } from './store.js';
import { nowIso } from './seed.js';

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'jobsdirect-dev-secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const APP_URL = process.env.APP_URL || CLIENT_URL;
const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_AUTOMATIC_TAX = process.env.STRIPE_AUTOMATIC_TAX === 'true';

const store = createStore();
const app = express();
const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const MANAGED_USER_ROLES = new Set(['employee', 'employer', 'admin', 'super_admin']);

const PAYMENT_PLANS = {
  credits_1: {
    id: 'credits_1',
    label: '1 Job Credit',
    description: 'Post one 28-day job listing on JobsDirect.ie.',
    amount: 1500,
    currency: 'eur',
    mode: 'payment',
    kind: 'credits',
    credits: 1,
  },
  credits_5: {
    id: 'credits_5',
    label: '5 Job Credits',
    description: 'Five 28-day job listing credits for employer hiring campaigns.',
    amount: 7000,
    currency: 'eur',
    mode: 'payment',
    kind: 'credits',
    credits: 5,
  },
  credits_10: {
    id: 'credits_10',
    label: '10 Job Credits',
    description: 'Ten 28-day job listing credits for higher-volume hiring.',
    amount: 13000,
    currency: 'eur',
    mode: 'payment',
    kind: 'credits',
    credits: 10,
  },
  candidate_database_monthly: {
    id: 'candidate_database_monthly',
    label: 'Candidate Database Access',
    description: 'Monthly access to search and contact candidate profiles.',
    amount: 2000,
    currency: 'eur',
    mode: 'subscription',
    interval: 'month',
    kind: 'candidate_database',
    credits: 0,
  },
};

app.use(cors({ origin: CLIENT_URL, credentials: true }));

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ message: 'Stripe webhook secret is not configured' });
  }

  try {
    const event = verifyStripeWebhook(req.body, req.headers['stripe-signature']);
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Invalid Stripe webhook' });
  }
});

app.use(express.json({ limit: '2mb' }));

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await store.findUserById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = publicUser(user);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

function adminRequired(req, res, next) {
  if (!ADMIN_ROLES.has(req.user?.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

function collapseWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function deriveNameFromEmail(email = '') {
  const localPart = String(email).split('@')[0] || 'User';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'User';
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeManagedRole(role) {
  return MANAGED_USER_ROLES.has(role) ? role : 'employee';
}

function publicPaymentPlan(plan) {
  return {
    id: plan.id,
    label: plan.label,
    description: plan.description,
    amount: plan.amount,
    currency: plan.currency,
    mode: plan.mode,
    interval: plan.interval || null,
    kind: plan.kind,
    credits: plan.credits,
  };
}

function getPaymentPlan(planId) {
  return PAYMENT_PLANS[planId] || null;
}

function stripeConfigured() {
  return Boolean(STRIPE_SECRET_KEY);
}

async function stripeRequest(path, params, method = 'POST') {
  if (!stripeConfigured()) {
    const error = new Error('Stripe is not configured');
    error.status = 503;
    throw error;
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    },
  };

  if (params) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = params.toString();
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Stripe request failed');
    error.status = response.status;
    error.stripe = data?.error;
    throw error;
  }
  return data;
}

function appendCheckoutSessionParams(params, plan, user, employer) {
  const successUrl = process.env.STRIPE_SUCCESS_URL || `${APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || `${APP_URL}/dashboard?payment=cancelled`;

  params.set('mode', plan.mode);
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('customer_email', user.email);
  params.set('client_reference_id', user.email);
  params.set('allow_promotion_codes', 'true');
  params.set('billing_address_collection', 'auto');
  params.set('automatic_tax[enabled]', STRIPE_AUTOMATIC_TAX ? 'true' : 'false');

  params.set('metadata[plan_id]', plan.id);
  params.set('metadata[kind]', plan.kind);
  params.set('metadata[credits]', String(plan.credits || 0));
  params.set('metadata[user_email]', user.email);
  params.set('metadata[employer_id]', employer.id);

  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', plan.currency);
  params.set('line_items[0][price_data][unit_amount]', String(plan.amount));
  params.set('line_items[0][price_data][product_data][name]', plan.label);
  params.set('line_items[0][price_data][product_data][description]', plan.description);

  if (plan.mode === 'subscription') {
    params.set('line_items[0][price_data][recurring][interval]', plan.interval || 'month');
  }
}

function verifyStripeWebhook(rawBody, signatureHeader = '') {
  if (!Buffer.isBuffer(rawBody)) {
    throw new Error('Stripe webhook requires a raw request body');
  }

  const parts = String(signatureHeader)
    .split(',')
    .reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (!key || !value) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(value);
      return acc;
    }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];
  if (!timestamp || !signatures.length) {
    throw new Error('Missing Stripe signature');
  }

  const ageMs = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (!Number.isFinite(ageMs) || ageMs > 5 * 60 * 1000) {
    throw new Error('Expired Stripe signature');
  }

  const payload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(payload).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const valid = signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, 'hex');
    return signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  });

  if (!valid) {
    throw new Error('Invalid Stripe signature');
  }

  return JSON.parse(rawBody.toString('utf8'));
}

async function findEmployerForPayment(userEmail, employerId) {
  if (employerId) {
    const [employer] = await store.listEntities('Employer', { id: employerId });
    if (employer) return employer;
  }

  const [employer] = await store.listEntities('Employer', { user_email: userEmail });
  return employer || null;
}

async function createPaymentRecord({ session, plan, user, employer }) {
  const payment = {
    id: randomId('payment'),
    stripe_session_id: session.id,
    stripe_customer_id: session.customer || null,
    stripe_subscription_id: session.subscription || null,
    user_email: user.email,
    employer_id: employer.id,
    company_name: employer.company_name || null,
    plan_id: plan.id,
    kind: plan.kind,
    credits: plan.credits || 0,
    amount_total: session.amount_total || plan.amount,
    currency: session.currency || plan.currency,
    mode: plan.mode,
    status: 'checkout_created',
    checkout_url: session.url,
    created_by: user.email,
    created_date: nowIso(),
    updated_date: nowIso(),
  };
  await store.createEntity('Payment', payment);
  return payment;
}

async function fulfillCheckoutSession(session) {
  if (!session?.id) return null;
  if (session.status !== 'complete') return null;
  if (session.mode === 'payment' && session.payment_status !== 'paid') return null;

  const plan = getPaymentPlan(session.metadata?.plan_id);
  if (!plan) return null;

  const existingPayments = await store.listEntities('Payment', { stripe_session_id: session.id });
  const existingPayment = existingPayments[0] || null;
  if (existingPayment?.fulfilled_at) {
    return { payment: existingPayment, employer: await findEmployerForPayment(existingPayment.user_email, existingPayment.employer_id) };
  }

  const userEmail = session.metadata?.user_email || existingPayment?.user_email;
  const employer = await findEmployerForPayment(userEmail, session.metadata?.employer_id || existingPayment?.employer_id);
  if (!employer) return { payment: existingPayment, employer: null };

  const credits = Number(session.metadata?.credits || plan.credits || 0);
  let employerUpdates = {};
  if (plan.kind === 'credits') {
    employerUpdates = {
      credits: Number(employer.credits || 0) + credits,
    };
  }

  if (plan.kind === 'candidate_database') {
    employerUpdates = {
      candidate_database_access: true,
      candidate_database_status: 'active',
      candidate_database_subscription_id: session.subscription || existingPayment?.stripe_subscription_id || null,
      candidate_database_started_at: nowIso(),
    };
  }

  if (session.customer) {
    employerUpdates.stripe_customer_id = session.customer;
  }

  const updatedEmployer = Object.keys(employerUpdates).length
    ? await store.updateEntity('Employer', employer.id, employerUpdates)
    : employer;

  const paymentUpdates = {
    status: 'paid',
    payment_status: session.payment_status || null,
    stripe_customer_id: session.customer || existingPayment?.stripe_customer_id || null,
    stripe_subscription_id: session.subscription || existingPayment?.stripe_subscription_id || null,
    amount_total: session.amount_total || existingPayment?.amount_total || plan.amount,
    currency: session.currency || existingPayment?.currency || plan.currency,
    fulfilled_at: nowIso(),
  };

  const payment = existingPayment
    ? await store.updateEntity('Payment', existingPayment.id, paymentUpdates)
    : await store.createEntity('Payment', {
      id: randomId('payment'),
      stripe_session_id: session.id,
      user_email: userEmail,
      employer_id: employer.id,
      company_name: employer.company_name || null,
      plan_id: plan.id,
      kind: plan.kind,
      credits,
      mode: plan.mode,
      created_by: userEmail,
      created_date: nowIso(),
      updated_date: nowIso(),
      ...paymentUpdates,
    });

  return { payment, employer: updatedEmployer };
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await fulfillCheckoutSession(event.data?.object);
      break;
    case 'customer.subscription.deleted': {
      const subscription = event.data?.object;
      if (!subscription?.id) break;
      const [employer] = await store.listEntities('Employer', { candidate_database_subscription_id: subscription.id });
      if (employer) {
        await store.updateEntity('Employer', employer.id, {
          candidate_database_access: false,
          candidate_database_status: 'cancelled',
          candidate_database_cancelled_at: nowIso(),
        });
      }
      break;
    }
    default:
      break;
  }
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

  return payload.title && payload.description ? payload : null;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'jobsdirect-api', storage: store.mode });
});

app.post('/api/auth/register', async (req, res) => {
  const { full_name, email, password, role = 'employee' } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const safeRole = role === 'employer' ? 'employer' : 'employee';
  const normalizedFullName = String(full_name || '').trim() || deriveNameFromEmail(normalizedEmail);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const existing = await store.findUserByEmail(normalizedEmail);
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const user = {
    id: randomId('user'),
    email: normalizedEmail,
    password_hash: await bcrypt.hash(password, 10),
    full_name: normalizedFullName,
    role: safeRole,
    email_verified: false,
    created_date: nowIso(),
    updated_date: nowIso(),
  };

  await store.createUser(user);
  const code = generateVerificationCode();
  const expiresAt = addMinutes(new Date(), 15).toISOString();

  await store.createEmailVerification({
    email: normalizedEmail,
    code,
    expires_at: expiresAt,
    created_date: nowIso(),
  });

  res.status(201).json({
    verification_required: true,
    user: publicUser(user),
    email: normalizedEmail,
    expires_at: expiresAt,
    message: 'Verification code sent to your email.',
    demo_verification_code: code,
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await store.findUserByEmail(normalizedEmail);

  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  const ok = await bcrypt.compare(String(password || ''), user.password_hash || '');
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
  if (!user.email_verified) {
    return res.status(403).json({
      message: 'Please verify your email before signing in.',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/verify-email', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  const user = await store.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const verification = await store.findEmailVerification(email);
  if (!verification) {
    return res.status(400).json({ message: 'No active verification code found' });
  }

  if (new Date(verification.expires_at).getTime() < Date.now()) {
    await store.deleteEmailVerification(email);
    return res.status(400).json({ message: 'Verification code has expired' });
  }

  if (verification.code !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  const updatedUser = await store.updateUser(email, { email_verified: true });
  await store.deleteEmailVerification(email);

  return res.json({
    success: true,
    message: 'Email verified successfully.',
    token: signToken(updatedUser),
    user: publicUser(updatedUser),
  });
});

app.post('/api/auth/resend-verification', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await store.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.email_verified) {
    return res.status(400).json({ message: 'Email is already verified' });
  }

  const code = generateVerificationCode();
  const expiresAt = addMinutes(new Date(), 15).toISOString();
  await store.createEmailVerification({
    email,
    code,
    expires_at: expiresAt,
    created_date: nowIso(),
  });

  return res.json({
    success: true,
    message: 'Verification code sent to your email.',
    email,
    expires_at: expiresAt,
    demo_verification_code: code,
  });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json(req.user);
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true });
});

app.get('/api/payments/plans', (_req, res) => {
  res.json(Object.values(PAYMENT_PLANS).map(publicPaymentPlan));
});

app.post('/api/payments/checkout', authRequired, async (req, res) => {
  try {
    const planId = String(req.body?.plan_id || req.body?.planId || '').trim();
    const plan = getPaymentPlan(planId);
    if (!plan) {
      return res.status(400).json({ message: 'Unknown payment plan' });
    }

    const employer = await findEmployerForPayment(req.user.email, req.body?.employer_id);
    if (!employer && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Employer profile is required before checkout' });
    }

    const checkoutEmployer = employer || {
      id: 'admin',
      company_name: 'JobsDirect Admin',
      user_email: req.user.email,
    };

    const params = new URLSearchParams();
    appendCheckoutSessionParams(params, plan, req.user, checkoutEmployer);
    const session = await stripeRequest('/checkout/sessions', params);
    await createPaymentRecord({ session, plan, user: req.user, employer: checkoutEmployer });

    return res.json({
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Could not create Stripe checkout session' });
  }
});

app.post('/api/payments/sync-session', authRequired, async (req, res) => {
  try {
    const sessionId = String(req.body?.session_id || req.body?.sessionId || '').trim();
    if (!/^cs_/.test(sessionId)) {
      return res.status(400).json({ message: 'A valid Stripe Checkout Session ID is required' });
    }

    const params = new URLSearchParams();
    params.set('expand[]', 'line_items');
    const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}?${params.toString()}`, null, 'GET');
    const sessionUserEmail = session.metadata?.user_email;
    if (sessionUserEmail !== req.user.email && !ADMIN_ROLES.has(req.user.role)) {
      return res.status(403).json({ message: 'You cannot sync this payment session' });
    }

    const result = await fulfillCheckoutSession(session);
    return res.json({
      success: Boolean(result?.payment?.fulfilled_at),
      payment: result?.payment || null,
      employer: result?.employer || null,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Could not sync Stripe session' });
  }
});

app.post('/api/payments/portal', authRequired, async (req, res) => {
  try {
    const employer = await findEmployerForPayment(req.user.email, req.body?.employer_id);
    if (!employer?.stripe_customer_id) {
      return res.status(400).json({ message: 'No Stripe customer is linked to this employer account' });
    }

    const params = new URLSearchParams();
    params.set('customer', employer.stripe_customer_id);
    params.set('return_url', process.env.STRIPE_PORTAL_RETURN_URL || `${APP_URL}/dashboard`);
    const session = await stripeRequest('/billing_portal/sessions', params);
    return res.json({ url: session.url });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Could not open Stripe billing portal' });
  }
});

app.get('/api/admin/users', authRequired, adminRequired, async (_req, res) => {
  const users = await store.listUsers();
  res.json(users.map(publicUser));
});

app.post('/api/admin/users', authRequired, adminRequired, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const fullName = collapseWhitespace(req.body?.full_name || deriveNameFromEmail(email));
  const role = normalizeManagedRole(req.body?.role);
  const emailVerified = req.body?.email_verified !== false;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const existing = await store.findUserByEmail(email);
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const user = {
    id: randomId('user'),
    email,
    password_hash: await bcrypt.hash(password, 10),
    full_name: fullName,
    role,
    email_verified: emailVerified,
    created_date: nowIso(),
    updated_date: nowIso(),
  };

  await store.createUser(user);
  res.status(201).json(publicUser(user));
});

app.patch('/api/admin/users/:id', authRequired, adminRequired, async (req, res) => {
  const updates = {};

  if (req.body?.full_name !== undefined) {
    updates.full_name = collapseWhitespace(req.body.full_name);
  }
  if (req.body?.role !== undefined) {
    updates.role = normalizeManagedRole(req.body.role);
  }
  if (req.body?.email_verified !== undefined) {
    updates.email_verified = Boolean(req.body.email_verified);
  }
  if (req.body?.password) {
    const password = String(req.body.password);
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    updates.password_hash = await bcrypt.hash(password, 10);
  }

  const updated = await store.updateUserById(req.params.id, updates);
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json(publicUser(updated));
});

app.delete('/api/admin/users/:id', authRequired, adminRequired, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const deleted = await store.deleteUserById(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'User not found' });
  res.json({ success: true, user: publicUser(deleted) });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await store.findUserByEmail(email);
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists for that email, password reset instructions have been generated.',
    });
  }

  const token = randomToken();
  const expiresAt = addMinutes(new Date(), 30).toISOString();
  await store.createPasswordReset({
    token,
    email,
    expires_at: expiresAt,
    created_date: nowIso(),
  });

  return res.json({
    success: true,
    message: 'Password reset instructions have been generated.',
    reset_token: token,
    expires_at: expiresAt,
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');

  if (!token || !password) {
    return res.status(400).json({ message: 'Reset token and new password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const resetRecord = await store.findPasswordResetByToken(token);
  if (!resetRecord) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  if (new Date(resetRecord.expires_at).getTime() < Date.now()) {
    await store.deletePasswordResetByToken(token);
    return res.status(400).json({ message: 'Reset token has expired' });
  }

  const user = await store.updateUserPassword(
    resetRecord.email,
    await bcrypt.hash(password, 10),
  );

  await store.deletePasswordResetByToken(token);
  await store.deletePasswordResetsByEmail(resetRecord.email);

  if (!user) {
    return res.status(404).json({ message: 'User account no longer exists' });
  }

  return res.json({
    success: true,
    message: 'Password updated successfully',
  });
});

app.get('/api/entities/:entity', async (req, res) => {
  const items = await store.listEntities(req.params.entity, req.query);
  res.json(items);
});

app.post('/api/entities/:entity', (req, res, next) => {
  if (req.params.entity === 'ContactMessage') return next();
  return authRequired(req, res, next);
}, async (req, res) => {
  const entityName = req.params.entity;
  const payload = req.body || {};
  const item = {
    id: payload.id || randomId(entityName.toLowerCase()),
    ...payload,
    created_by: payload.created_by || req.user?.email || null,
    created_date: payload.created_date || nowIso(),
    updated_date: nowIso(),
  };

  await store.createEntity(entityName, item);
  res.status(201).json(item);
});

app.patch('/api/entities/:entity/:id', authRequired, async (req, res) => {
  const updated = await store.updateEntity(req.params.entity, req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ message: `${req.params.entity} not found` });
  res.json(updated);
});

app.delete('/api/entities/:entity/:id', authRequired, adminRequired, async (req, res) => {
  const deleted = await store.deleteEntity(req.params.entity, req.params.id);
  if (!deleted) return res.status(404).json({ message: `${req.params.entity} not found` });
  res.json({ success: true, item: deleted });
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

store.init().then(() => {
  app.listen(PORT, () => {
    console.log(`JobsDirect API running on http://localhost:${PORT} using ${store.mode} storage`);
  });
}).catch((error) => {
  console.error('Failed to initialize storage', error);
  process.exit(1);
});
