<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent and token usage

- Minimize token usage by default.
- Avoid subagents unless they are useful for narrow, bounded, independent work.
- Prefer local `rg`/file reads for small or obvious changes.
- Do not use broad subagent prompts like "understand the whole app".
- Good subagent prompts should name the specific question, relevant area, expected output, and stop conditions.
- Ask subagents for compact findings with file paths and line numbers, not large code excerpts.
- Avoid overlapping subagents that inspect the same files or answer the same question.
- Split subagents by ownership when parallel work is useful, for example API, UI, tests, or deployment.
- Prefer subagents for parallel discovery or verification; keep primary implementation local unless the write scope is clean.
- Do not fork full conversation context to a subagent unless it is needed.
- Close subagents once their result is no longer needed.

## Rebuild path

- After production-affecting changes, run `npm run build`.
- If the build passes and the app should be refreshed, run `pm2 restart 3 --update-env`.
- PM2 process `3` is `eguchi-pitch-training`; do not use process `2` for this app.
