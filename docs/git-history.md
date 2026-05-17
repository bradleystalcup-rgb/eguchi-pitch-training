# Git History

## `6c53c5c` - `chore: scaffold Next.js app`

Created the initial Next.js 16 app with TypeScript, Tailwind, ESLint, npm scripts, public assets, and repo guidance files.

## `408683a` - `feat: add auth and training persistence model`

Added Better Auth wiring, PostgreSQL/Drizzle schema, the initial production migration, DB change documentation, and the 14-chord Eguchi/CIM protocol model.

Key areas:

- `/api/auth/[...all]`
- `src/lib/db`
- `src/lib/training`
- `scripts/db/0001_initial_auth_training.sql`
- `docs/protocol.md`

## `ce12106` - `feat: add child-friendly training prototype`

Added the kid-oriented UI shell, public/auth/dashboard/training pages, dashboard components, reusable UI primitives, and Tone.js chord playback for the demo training room.

Key areas:

- `src/app`
- `src/components`
- `src/lib/training/audio.ts`

## `176b00c` - `test: add route visibility coverage`

Added Playwright config and route smoke tests for the public, auth, dashboard, and training pages.

Key areas:

- `playwright.config.ts`
- `tests/e2e/route-visibility.spec.ts`
