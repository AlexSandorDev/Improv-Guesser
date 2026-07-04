# Situation Design Guide

How to design a new situation for `src/domain/situations.md`, based on the two
reference situations already in the file: **Animal Shelter** and **Pirate
Treasure**.

## What a situation is

One player is the **guesser** and sits outside the scene. Every other player
gets a secret role (a `prompt`) and improvises in-character. The guesser
watches the scene and tries to name a single concrete outcome — the first
entry in `acceptedAnswers`, which doubles as the canonical solution. A good
situation makes that outcome discoverable through the *behavior* the roles
are pushed toward, not through anyone stating it out loud.

Both reference situations share the same three-part skeleton. Use all three
every time.

### 1. Two sides in opposition

Every situation needs a conflict between exactly two wants, held by two (or
two clusters of) roles:

- **Animal Shelter**: Parent wants a *Dog* vs. Child wants a *Cat*.
- **Pirate Treasure**: Captain wants to push into the storm for the treasure
  vs. First Mate (and crew) want to turn back to shore.

The opposition must be a want, not a fact — each side is trying to make
something happen, not just holding an opinion. Optional roles can pile onto
either side (Pirate Treasure's Helmsman and Seasick Mate reinforce "go back
to shore"; the Slimey Second Mate reinforces the Captain) or sit outside the
conflict as flavor/comic relief that can't talk (Animal Shelter's mute
animal roles). One side should be an ally who tips the balance in an
interesting or ironic way — the Animal Caretaker is bound to help the
*Parent* get their pick, yet the intended outcome is still the *Cat* the
Child wants. That tension is what makes the scene worth watching, not a
contradiction to fix.

### 2. A clear "who do I play against"

Every mandatory role's `prompt` should name the specific other role it
pushes against or answers to, using a `{Role Name}` token (see
[Role tokens](#role-tokens) below). A player reading their prompt should
immediately know who in the room they're squaring off with or reporting to:

- Parent: "You came with your child, `{Child}` ... You really want a dog."
- Captain: "... `{First Mate}` is the first mate."
- Slimey Second Mate: "You always agree with `{Captain}` ... because you
  want to go up in rank."

Don't write a role that just describes a want in isolation — always anchor
it to another role in the scene.

### 3. A concrete, guessable end goal

The `guesserPrompt` is a short, specific question ("What animal is taken
home?", "Where does the ship end up going?") with one right answer (the
first entry in `acceptedAnswers`) that could plausibly be dramatized by the
roles' actions, independent of what anyone says aloud. Good answers are:

- **Concrete nouns/places**, not abstract themes ("Cat", "Island" — not
  "Family bonding" or "Loyalty").
- **Inferable from behavior**: if the caretaker keeps steering the parent
  toward the dog cage but the child clings to the cat carrier, a guesser can
  infer "Cat" wins without anyone saying the word.
- **Backed by `acceptedAnswers`**: the first entry is the exact solution;
  the rest are realistic variants a guesser might type — synonyms, partial
  phrases, common misspellings, and answers with/without "the". See both
  reference situations' `acceptedAnswers` arrays for the pattern.

## Anatomy of the JSON block

```json
{
  "id": "kebab-case-unique-id",
  "name": "Human Readable Name",
  "guesserPrompt": "The one question the guesser is trying to answer",
  "roles": [
    {
      "name": "Role Name",
      "prompt": "Second-person instructions for this role, referencing {Other Role} by name where relevant.",
      "mandatory": true
    }
  ],
  "acceptedAnswers": [
    "Exact solution",
    "Reasonable variants a guesser might type"
  ]
}
```

- `id` — unique, kebab-case, never reused.
- `acceptedAnswers` — required, non-empty. The **first entry is the
  canonical solution** (used as `round.solution`); every other entry is a
  variant that also counts as a correct guess.
- `roles` — write these as direct second-person instructions ("You are...",
  "You want..."), the same voice as both existing situations.
- `mandatory` — `true` for roles that carry the core opposition and must
  exist for the scene to make sense at minimum player counts; `false` for
  roles that add flavor, escalate one side, or are otherwise skippable when
  the player count is low.

### Role tokens

Wrap another role's name in curly braces, e.g. `{Captain}`, inside a
`prompt` to have the app resolve it to the name of whichever player holds
that role at runtime. Use the role's `name` exactly as written elsewhere in
the same situation.

## Sizing — match the reference situations

Keep new situations in the same range as Animal Shelter and Pirate Treasure:

| | Animal Shelter | Pirate Treasure | Target range |
|---|---|---|---|
| Total roles | 6 | 5 | 5–6 |
| Mandatory roles | 4 | 2 | 2–4 |
| Chars per role prompt | 42–129 | 80–146 | ~40–150 |
| Total prompt chars (all roles) | 414 | 542 | ~400–550 |
| `guesserPrompt` length | 26 | 33 | ~25–35 chars |
| `acceptedAnswers` count | 4 | 7 | 4–7 |

Mandatory role prompts tend to run longer (they carry the opposition and
name who they're up against); optional/mute roles are usually one short
sentence.

## Checklist before adding a situation

- [ ] Exactly one central opposition between two wants, expressed through
      two roles (or role clusters).
- [ ] Every mandatory role's prompt names another role via `{Role Name}`.
- [ ] `guesserPrompt` asks one short, concrete question.
- [ ] `acceptedAnswers[0]` is a specific, dramatizable noun/place — not a
      theme — and the rest of the array lists realistic variants.
- [ ] 5–6 total roles, 2–4 marked `mandatory`.
- [ ] Role prompt lengths and total character count land in the ranges
      above.
- [ ] `id` is unique kebab-case and doesn't collide with existing entries in
      `src/domain/situations.md`.
- [ ] Run `npm run sync:situations` after editing the markdown.
