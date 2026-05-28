# TODO

## Manual Practice UI Testing

Tasks:

- Test the practice room on mobile and desktop viewports.
- Verify Begin starts the session and immediately plays the first chord.
- Verify correct and incorrect answer feedback, including red border on the selected wrong color.
- Verify the Next button bottom progress fill and auto-next behavior.
- Verify pause/resume opens settings, pauses timing, and resumes cleanly.
- Verify hotkeys for color, note-set, and single-note answer modes.

## Color Accessibility Symbols

Tasks:

- Visually check the in-repo ColorADD-style SVG approximations on every color button.
- Confirm compound colors are understandable: green, orange, purple, pink, and brown.
- Confirm the Color keys student toggle persists and behaves correctly across sessions.
- Revisit official ColorADD assets only if licensed files become available.

## Future Answer-Mode UX

Tasks:

- Manually validate `note_set` mode once a learner reaches the chord-notes phase.
- Manually validate `single_note` mode once a learner reaches the single-note phase.
- Confirm note-set answers feel clear with the sharps/flats display toggle.
- Confirm single-note prompts do not visually reveal the answer.
- Decide whether note answer modes need their own feedback styling beyond the current generic correct/incorrect prompt.

## API Route Tests

Suggested commit:

```txt
test: cover practice attempt answer modes
```

Tasks:

- Add route-level tests for attempt payload validation by `answerMode`.
- Cover server-computed correctness for color choice, note set, and single note answers.
- Cover duplicate attempt handling.
- Cover completion after server-directed trials.

## Naming Cleanup

Tasks:

- Clarify that `training_sessions.trial_plan` stores issued prompts incrementally.
- Clarify that `training_trials` stores answered attempts.
- Decide whether documentation is enough or whether a future migration should rename tables/fields.

## Parent Session History

Suggested commit:

```txt
feat: add parent session history
```

Tasks:

- Add a parent-facing session history view.
- Show session counts, accuracy, response times, and recent misses.
- Show progression rationale: current level, current phase, and recent accuracy.
- Consider surfacing adaptive-review state for debugging or parent insight.

## Mobile App Readiness

Tasks:

- Keep training flow API-first so native iOS/Android clients can drive sessions.
- Document auth/session expectations for mobile clients.
- Document practice session API contracts for native usage.
- Keep browser-only code out of core training selection and persistence logic.
- Decide whether mobile clients should use the same Better Auth session model or a separate token flow.

## Post-Completion Challenge Mode

Suggested commit:

```txt
feat: add advanced challenge mode
```

Tasks:

- Unlock challenge mode only after the student reaches the final standard training stage.
- Add challenge levels using 1, 2, or 3 random notes from anywhere on the piano.
- Support simultaneous and successive note playback as a student-selectable option.
- Require the student to identify every played note correctly for the challenge item to count as correct.
- Decide whether challenge attempts reuse training session tables or get separate challenge-specific persistence.

## Deployment Hardening

Suggested commit:

```txt
docs: document production runbook
```

Tasks:

- Confirm PM2 startup is saved with `pm2 save`.
- Confirm PM2 resurrect/startup behavior after reboot.
- Confirm cert renewal check.
- Confirm nginx reload/test commands.
- Test the documented rollback path after a non-production PM2 env change.
