# JobsDirect.ie Standalone

A standalone JobsDirect.ie app with:
- React + Vite frontend
- Express backend
- Real email/password auth with JWT
- File-based local development store
- PostgreSQL support for live environments such as Railway

## Run locally

Install dependencies:

```bash
npm install
```

Start frontend and backend together:

```bash
npm run dev:full
```

Frontend:
- http://localhost:5173

Backend:
- http://localhost:3001

## Demo accounts

- Admin: `admin@jobsdirect.ie` / `Admin123!`
- Employer: `sarah.murphy@lumenlabs.ie` / `Employer123!`
- Employee: `liam.oconnor@gmail.com` / `Employee123!`

## Useful scripts

```bash
npm run dev:client
npm run dev:server
npm run build
npm run server
```

## Notes

- Local mode can store data in `server/db.json`
- Live mode can use PostgreSQL with `DATA_PROVIDER=postgres`
- JWT secret can be changed with `JWT_SECRET`
- Vite proxies `/api` to `http://localhost:3001`

## Storage Modes

### Local file mode

Use:

```bash
DATA_PROVIDER=file
DATA_FILE=server/db.json
```

### PostgreSQL mode

Use:

```bash
DATA_PROVIDER=postgres
DATABASE_URL=postgresql://...
DATABASE_SSL=false
```

If your database provider requires SSL, set:

```bash
DATABASE_SSL=true
```
