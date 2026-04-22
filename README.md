# JobsDirect.ie

JobsDirect.ie is now organized as a cleaner two-app repo:

- `frontend/` - React + Vite client
- `backend/` - Express API

The frontend and backend can still be developed together from the repo root, but they now have separate package manifests and deployment boundaries.

## Project Structure

```text
frontend/   Vite React app for local and Vercel deployment
backend/    Express API for local and Railway deployment
```

## Local Development

Install dependencies:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

Run both apps from the repo root:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:frontend
npm run dev:backend
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Environment Files

Frontend variables live in:

```text
frontend/.env
```

Use:

```bash
VITE_API_URL=
```

Backend variables live in:

```text
backend/.env
```

File mode for local development:

```bash
JWT_SECRET=change-this-secret
CLIENT_URL=http://localhost:5173
PORT=3001
DATA_PROVIDER=file
DATA_FILE=server/db.json
```

PostgreSQL mode for Railway/live:

```bash
JWT_SECRET=change-this-secret
CLIENT_URL=https://your-frontend-domain.vercel.app
DATA_PROVIDER=postgres
DATABASE_URL=postgresql://...
DATABASE_SSL=false
```

If your provider requires SSL, set `DATABASE_SSL=true`.

## Deployment

Frontend:

- Deploy `frontend/` to Vercel
- Set `VITE_API_URL=https://your-backend-domain`

Backend:

- Deploy `backend/` to Railway
- Start command: `npm start`
- Set backend variables from `backend/.env.example`

## Demo Accounts

- Admin: `admin@jobsdirect.ie` / `Admin123!`
- Employer: `sarah.murphy@lumenlabs.ie` / `Employer123!`
- Employee: `liam.oconnor@gmail.com` / `Employee123!`
