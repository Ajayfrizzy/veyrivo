# ProofPay

ProofPay is a worker and client agreement platform for milestone-based jobs and protected CKB payments.

## Prerequisites

- Node.js 22 or newer
- npm
- Docker, for the local PostgreSQL database

## Local setup

```bash
npm install
cp .env.example apps/web/.env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

The web application runs at `http://localhost:3000` by default.

## Useful commands

```bash
npm run dev          # Start the Next.js development server
npm run build        # Create a production build
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript
npm test             # Run the test suite
npm run db:generate  # Generate a Drizzle migration
npm run db:migrate   # Apply database migrations
npm run db:seed      # Create local demo data
```

## Repository map

```text
apps/web/src/
├── app/                 Next.js pages and API route entry points
├── components/
│   ├── layout/          Application shell and page-level layout
│   └── ui/              Reusable, feature-independent UI
├── features/            UI, fixtures, validation, and services by product feature
├── server/              Shared server infrastructure and compatibility exports
├── styles/              Global styles and design tokens
packages/domain/src/     Framework-independent domain types and rules
apps/web/drizzle/        Generated database migrations
docs/                    Product and architecture documentation
scripts/                 Repository maintenance and document-generation scripts
```

See [the source organization guide](apps/web/src/README.md) before adding a new feature.

## Environment

Copy `.env.example` to `apps/web/.env`. The example contains safe local defaults for PostgreSQL, session configuration, testnet CKB, sandbox identity verification, and local file storage. Google OAuth values are optional for local development.

Do not commit `apps/web/.env` or other files containing credentials.

## Demo accounts

Password: `ProofPayDemo!2026`

- `client@proofpay.local`
- `worker@proofpay.local`
- `admin@proofpay.local`
- `support@proofpay.local`

## Code organization rules

- Keep files under `app/` focused on routing, request parsing, and composing screens.
- Put code owned by one product area under `features/<feature>`.
- Put components in `components/ui` only when they are reusable across features.
- Keep database access and secrets out of client components.
- Colocate focused tests with the module they cover.
- Export shared domain types through `@proofpay/domain`; do not import its internal files from the web app.
- Do not edit files under `drizzle/` manually. Generate migrations with `npm run db:generate`.
