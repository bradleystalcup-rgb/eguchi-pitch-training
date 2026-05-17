# Eguchi Pitch Training

A Next.js app for kid-friendly pitch practice.

## Current Scaffold

The app shell and basic routes are wired with a child-friendly prototype:

- `/` - public landing page
- `/sign-in` - Better Auth email/password sign-in form
- `/sign-up` - parent account creation form
- `/dashboard` - family dashboard prototype
- `/dashboard/children/[childId]` - child progress prototype
- `/train/[childId]` - Tone.js chord-color practice room

The v1 protocol defaults to the 14 essential Eguchi/CIM chords: nine white-key
color chords, then five black-key tone-name chords after white-key mastery.

## Development

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

## Verification

```bash
npm run lint
npm run build
```
