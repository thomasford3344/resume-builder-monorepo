# Resume Builder

Monorepo for the AI resume tailor application.

## Structure

```
resume-builder/
├── apps/
│   ├── backend/    # NestJS API (MongoDB, OpenAI, Claude)
│   └── frontend/   # React + Vite UI
├── package.json    # Workspace root
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB
- OpenAI API key (required)
- Anthropic API key (optional, for Claude models)

## Setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Configure the backend environment in `apps/backend/.env`:

```env
DATABASE_URL=mongodb://localhost:27017/resumes
ENCRYPTION_KEY=your_32_byte_hex_encryption_key
PORT=3000
```

Each user adds their own OpenAI and Anthropic API keys in **Profile** settings. Keys are encrypted at rest in the database.

3. (Optional) Configure the frontend in `apps/frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Leave `VITE_API_BASE_URL` empty during local dev to use the Vite proxy to `http://localhost:3000`.

## Development

Run both apps:

```bash
npm run dev
```

Or run individually:

```bash
npm run dev:backend
npm run dev:frontend
```

Frontend only with host (same as before):

```bash
npm run dev -w resume-builder-frontend
# or from apps/frontend:
# npm run dev
```

- Backend API: http://localhost:3000/api
- Frontend: http://localhost:5173 (network-accessible via `--host`)

## Build

```bash
npm run build
```

## Workspaces

| Package | Path | Description |
|---------|------|-------------|
| `resume-builder-backend` | `apps/backend` | NestJS API |
| `resume-builder-frontend` | `apps/frontend` | React frontend |

Run a script in one workspace:

```bash
npm run start:dev -w resume-builder-backend
npm run dev -w resume-builder-frontend
```
