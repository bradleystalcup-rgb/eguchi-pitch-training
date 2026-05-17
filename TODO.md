# TODO

## Next Milestone: Real Parent And Child Data

Suggested commit:

```txt
feat: persist parent child profiles
```

Tasks:

- Confirm production `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.
- Run the initial database migration.
- Make `/dashboard` require a signed-in parent.
- Add child profile create/list behavior.
- Replace demo learner cards with parent-scoped database records.
- Add authorization checks so parents only access their own child profiles.

Verification:

```bash
npm run lint
npm run build
```

## Training Persistence

Suggested commit:

```txt
feat: record training sessions
```

Tasks:

- Start a database-backed session from `/train/[childId]`.
- Record each trial answer with prompt chord, selected answer, correctness, and response time.
- Complete a session and update child progress rollups.
- Show persisted session count and accuracy on the dashboard.

Verification:

```bash
npm run lint
npm run build
npm run test:e2e -- tests/e2e/route-visibility.spec.ts
```

## Adaptive Review

Suggested commit:

```txt
feat: add spaced chord review scheduling
```

Tasks:

- Add a `child_chord_reviews` table.
- Track ease, due date, interval, lapses, and response speed per child/chord.
- Keep Eguchi progression as the unlock gate.
- Use spaced review only to choose among the currently active chord set.

## Deployment Hardening

Suggested commit:

```txt
docs: document production runbook
```

Tasks:

- Confirm PM2 startup is saved with `pm2 save`.
- Confirm PM2 resurrect/startup behavior after reboot.
- Document cert renewal check.
- Document nginx reload/test commands.
- Add a short rollback note.
