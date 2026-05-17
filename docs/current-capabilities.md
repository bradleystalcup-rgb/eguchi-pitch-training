# Current Capabilities

This document describes what the hosted app can do right now.

## Works Now

- `https://eguchi.evidentco.com` serves the Next.js app through nginx.
- The app runs behind PM2 on port `3002`.
- Public landing, sign-in, sign-up, dashboard, child detail, and training routes load.
- The training room plays Tone.js-generated chords in the browser.
- The training room supports local color-choice interaction for a demo learner.
- The dashboard and child detail pages show demo progress cards and skill data.
- Better Auth is wired through `/api/auth/[...all]`.
- PostgreSQL schema, Drizzle config, and the initial migration exist.
- The 14-chord Eguchi/CIM default protocol is modeled in code and docs.
- Route visibility coverage exists in Playwright.

## Demo-Only

- Dashboard progress data is hard-coded sample data.
- Child profile pages use route params but do not load database records yet.
- Training answers are stored in React state only during the session.
- Session summaries do not persist.
- Progression rules exist in code but are not yet connected to the UI flow.

## Not Implemented Yet

- Auth-gated dashboard and training routes.
- Production-verified account creation and sign-in against the deployed database.
- Child profile creation and listing.
- Persisted training sessions and trials.
- Parent-scoped authorization checks on live routes.
- Password reset, email verification, and account management.
- Anki-style spaced review scheduling.
- Custom chord colors or custom protocol editing.

## Verification Commands

```bash
npm run lint
npm run build
npm run test:e2e -- tests/e2e/route-visibility.spec.ts
```
