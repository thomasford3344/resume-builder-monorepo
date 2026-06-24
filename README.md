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

## Adding a new AI model version

Model options are defined in two places. Keep the `value` strings in sync between frontend and backend.

### 1. Frontend (dropdown labels)

Edit `apps/frontend/src/constants/aiModels.ts`:

- Add an entry to `OPENAI_MODELS` or `CLAUDE_MODELS`:
  - `label` — display name in the model selector and resume list
  - `value` — stored as `aiVersion` and sent to the API
- Optionally update defaults in the same file:
  - `DEFAULT_OPENAI_VERSION` / `DEFAULT_CLAUDE_VERSION` — pre-selected model on Generate Resume
  - `DEFAULT_FROM_JSON_AI_VERSION` — pre-selected model on From JSON
  - `DEFAULT_AI_PROVIDER` — default provider toggle

`AiModelSelector` reads these arrays automatically; no component changes are required.

### 2. Backend (API model ID mapping)

Edit `apps/backend/src/ai/ai-models.ts`:

- Add the same `value` key to `OPENAI_MODEL_API_IDS` or `CLAUDE_MODEL_API_IDS`
- Map it to the provider's real API model ID (used by `resolveApiModelId()`)

**OpenAI:** multiple UI variants can map to one base model:

```ts
'gpt-5.5-instant': 'gpt-5.5',
'gpt-5.5-thinking': 'gpt-5.5',
'gpt-5.5-pro': 'gpt-5.5-pro',
```

**Claude:** usually 1:1 — use the exact Anthropic model string for both key and value.

### 3. Optional — change app-wide defaults

Only if the new model should be the default everywhere:

| File | Purpose |
|------|---------|
| `apps/frontend/src/constants/aiModels.ts` | UI pre-selection |
| `apps/backend/src/resumes/schemas/resume.schema.ts` | DB default when `aiVersion` is missing |
| `apps/backend/src/openai/openai.service.ts` | Service fallback when `aiVersion` is omitted |
| `apps/backend/src/resumes/resumes.service.ts` | Same fallback in resume generation |

### Example

To add **GPT-5.6 Thinking**:

```ts
// apps/frontend/src/constants/aiModels.ts
{ label: "GPT-5.6 Thinking", value: "gpt-5.6-thinking" },

// apps/backend/src/ai/ai-models.ts
'gpt-5.6-thinking': 'gpt-5.6',
```

No DTO or schema enum updates are needed — `aiVersion` is validated as a non-empty string.

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
