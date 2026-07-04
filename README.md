# Improv Guesser

A pass-the-phone React party game where one player is the guesser and all others receive secret improv roles.

## Run

```bash
npm install
npm run dev
```

## How it works

1. Enter player names (minimum 2).
2. Hand the phone to each player as their name appears.
3. Each player taps **Reveal Role** privately, then hides and passes.
4. Start the improv scene. The guesser tries to identify the situation.

## Edit situations

All game situations are maintained in one markdown file:

- `src/domain/situations.md`

Each situation is a `json` code block in that file. Edit/add blocks there, then run:

```bash
npm run sync:situations
```

Each role now only needs:

- `name`
- `mandatory`
- `prompt`

The app auto-runs sync during `npm run dev` and `npm run build`, so in normal use you can just edit the markdown and run as usual.

## Scenario editor (author-only)

A standalone tool lets you add, edit, and delete situations without hand-editing JSON:

```bash
npm run scenario-editor
```

Then open the printed URL (`http://localhost:5544`) in any browser. It's a small
self-contained Node server + a single HTML page — no build step, no browser file-picker
permissions needed. Saving writes directly to `src/domain/situations.md` and automatically
regenerates `src/domain/situations.generated.js`, so changes show up the next time you
start (or reload) `npm run dev` — no extra sync step needed.
