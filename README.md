# JobsDirect.ie Standalone

A standalone JobsDirect.ie app with:
- React + Vite frontend
- Express backend
- Real email/password auth with JWT
- File-based data store for quick local/client demos

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

- Data is stored in `server/db.json`
- JWT secret can be changed with `JWT_SECRET`
- Vite proxies `/api` to `http://localhost:3001`
