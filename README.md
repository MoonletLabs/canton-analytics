# Canton Analytics

A dashboard for Canton Network analytics. Dark-themed with sequential loading to avoid rate limits.

## Features

- **Dashboard** – One place for economics (latest round), activity mix, validator liveness, governance (DSO + open votes), updates over time, and operator view (tenants & SLA, reward attribution, audit).
- **Validators** – Top 20 missed rounds chart, paginated table of all validators with links to detail pages.
- **Super Validators** – DSO stats and SV node list with pagination.
- **Governance** – Open votes table and vote detail pages (e.g. `/governance/[trackingCid]`) with requester, reason, action, and vote counts.

Data is loaded **sequentially** (round → DSO → liveness → activity → open votes → updates) with delays between calls.

## Tech stack

- **Next.js 14** – App Router
- **TypeScript** – Typed API and UI
- **Tailwind CSS** – Styling (dark theme)
- **Recharts** – Charts
- **date-fns** – Date formatting

## Getting started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
npm install
```

### Environment (optional)

Copy `.env.example` to `.env` and set if needed:

- `UPSTREAM_API_URL` – Upstream API base URL for the server-side proxy (optional; has a default).

### Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build & run

```bash
npm run build
npm start
```

## Project structure

```
canton-analytics/
├── app/
│   ├── page.tsx              # Dashboard (single page, sequential load)
│   ├── layout.tsx
│   ├── globals.css
│   ├── validators/           # List + [id] detail
│   ├── super-validators/
│   ├── governance/           # List + [id] vote detail
│   ├── api/data/[...path]    # Server-side proxy for network data
│   └── ...                   # Other routes (updates, transfers, offers, etc.)
├── components/
│   ├── Navigation.tsx        # Nav: Dashboard, Validators, Super Validators, Governance
│   ├── ui/                   # Card, Button, Loading, TablePagination, etc.
│   └── ...
├── lib/
│   ├── api/
│   │   ├── scan-api.ts       # Data layer (getLatestRound, getValidatorLiveness, getOpenVotes, …)
│   │   └── api-client.ts     # Fetch + cache via /api/data proxy
│   └── utils.ts
├── .env.example
├── next.config.js
└── package.json
```

## Data source

- Network data via server-side proxy (`/api/data`). Configure upstream with `UPSTREAM_API_URL`.

## License

MIT
