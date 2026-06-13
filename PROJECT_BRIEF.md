# PROJECT_BRIEF.md

## Project

**OctoOracle 2026**

A playful but credible World Cup 2026 web app where an animated octopus predicts the next match outcome based on public consensus and structured statistical signals.

---

## Why this file exists

This file is the human-readable product and build brief.

Use it together with:

- `AGENTS.md` for engineering rules and system-level instructions
- this `PROJECT_BRIEF.md` for product context, creative direction, UX decisions, and development priorities
- `ASSET_MANIFEST.md` for final production filenames, asset purposes, source dimensions, transparency requirements, Phaser display sizes, anchors, and layer order

If there is any conflict:

1. security and engineering rules in `AGENTS.md` win
2. `ASSET_MANIFEST.md` is authoritative for all asset names and asset-use details
3. product intent and UX direction in this file shape implementation choices

---

## Core concept

Inspired by Paul the Octopus from 2010, the app presents a stylized aquarium scene where an octopus predicts the **next scheduled World Cup 2026 match** and keeps it featured while it is active.

The octopus does not make a random choice.

Instead, the back end:

1. knows the current date and time
2. identifies the featured match and the next scheduled official match
3. gathers safe, public, approved information
4. derives a consensus-based prediction
5. calculates outcome probabilities and a likely score
6. freezes the prediction exactly at kickoff using server UTC
7. drives the front-end animation so the octopus visibly “chooses” the result

---

## Product decisions already validated

### 1. Draw handling

For group-stage matches, a draw is a valid outcome.

Recommended visual treatment:

- left transparent box = Team A
- right transparent box = Team B
- the octopus performs a visual shrug or ambiguous neutral action when the model predicts a draw
- no central draw chest or shell appears in the aquarium

### 2. Knockout logic

Separate:

- **predicted score after 90 minutes**
- **predicted team to advance**

Example:

- 90-minute prediction: Germany 1-1 Mexico
- predicted to advance: Germany

### 3. Freeze / in-progress behavior

Refined rule from latest guidance:

- prediction can update before kickoff
- once the match is underway, the app should stop pretending to predict it as if it had not started
- at kickoff, freeze the prediction and show an in-progress state
- keep the active match featured until its final status is known

Recommended UX copy:

> Game in progress. No new prediction now. Go watch the match.

Implementation recommendation:

- freeze the public prediction exactly at kickoff using server UTC
- change the front-end state to `in_progress` at kickoff
- do not generate fresh public predictions after the game has started
- allow the already frozen pre-match prediction to remain visible while the match is active
- never use live match events to recalculate the public prediction

---

## Experience goal

The app should feel:

- playful
- stylish
- sports-oriented
- social-shareable
- more aligned with a typical soccer fan than with children’s animation

This is **not** a preschool mascot.
It should feel like a charismatic sports fan character.

---

## Creative direction

### Octopus character direction

The chosen direction is:

- confident
- mischievous
- competitive
- game-day energy
- expressive eyes and brows
- polished game-art finish
- fan-oriented attitude

Visual traits:

- purple octopus
- cyan / teal suction cups
- teal and dark striped scarf
- soccer ball used as prop in some frames
- transparent background assets for Phaser integration

Avoid:

- overly babyish proportions
- ultra-kawaii expressions
- overly soft preschool aesthetic
- photorealistic marine-animal styling

### Audience feel

Think:

- sports app mascot
- fantasy-football side character
- slick mobile game art
- soccer fan sticker pack

Not:

- toddler cartoon
- aquarium learning app

---

## Front-end visual direction

### Style

- 2D game-like experience
- polished and readable on mobile
- layered aquarium environment
- clear separation between character, interactables, and background

### Scene structure

Recommended layers:

1. **background layer**
   - underwater backdrop
   - coral and distant scenery
   - mostly static or very subtle motion

2. **midground / decorative layer**
   - aquarium frame
   - bubbles
   - coral border
   - bones, props, or side framing elements
   - optional small ambient animation

3. **interactive layer**
   - prediction boxes
   - holographic / selection UI if needed
   - octopus character

4. **effects layer**
   - confetti
   - highlight glow
   - selection emphasis
   - small bubble bursts

---

## Production asset system

The final production inventory is maintained in `ASSET_MANIFEST.md`.

Do not duplicate the full filename list in this brief. This prevents asset names, purposes, dimensions, and scene rules from drifting across documents.

`ASSET_MANIFEST.md` defines:

- every approved production asset
- exact filenames and folder locations
- each asset's purpose
- source dimensions
- required alpha transparency
- logical display sizes on the 1280 × 720 Phaser canvas
- anchor points
- default scene positions
- layer order
- optimization guidance
- validation and change-control rules

### Critical transparency rule

A visible checkerboard is only an editor preview convention. It is not proof that an image is transparent.

Every octopus sprite, prop, effect, midground layer, and glass overlay must contain real alpha transparency and must not contain a checkerboard pattern in visible RGB pixels. The far aquarium background is intentionally opaque.

The current uploaded sprites pass the minimum alpha requirement except for `aquarium-glass-overlay.png`, which is fully opaque and contains a baked checkerboard. Omit the glass overlay from the prototype until it is repaired or replaced through a reviewed asset change.

### Scene sizing rule

Use a 1280 × 720 logical Phaser canvas with `Phaser.Scale.FIT`. Use the logical display dimensions from `ASSET_MANIFEST.md`; do not display source images at their native pixel dimensions and do not distort aspect ratios.

## Suggested animation state mapping

```text
idle -> octopus-idle-front.png / octopus-idle-alt.png
inspect_team_a -> octopus-inspect-left.png
inspect_team_b -> octopus-inspect-right.png
inspect_draw -> octopus-draw-shrug.png
hesitate -> octopus-thinking.png / octopus-hesitate-center.png
choose_team_a -> octopus-swim-left.png / octopus-select-left.png
choose_team_b -> octopus-swim-right.png / octopus-select-right.png
choose_draw -> octopus-swim-center.png / octopus-draw-shrug.png
open_container -> octopus-select-left.png / octopus-select-right.png
celebrate -> octopus-celebrate.png
```

`octopus-open-reveal.png` contains a shell and is not used in the current
two-team-box sequence.

Optional future additions:

- blink frame
- tentacle bob frame
- idle variant A/B
- separate right-side select frame
- dedicated in-progress frame
- disappointed / wrong-prediction frame

---

## Functional MVP

### Main screen should show

- app name / brand
- current stage
- next match
- both team names
- flags
- kickoff time
- countdown
- octopus aquarium scene
- call to action to trigger prediction reveal
- predicted result
- predicted score
- confidence level
- explanation snippet
- last updated time
- in-progress message when relevant

### Match logic

The MVP must always answer:

1. what is the next match?
2. what is the app’s predicted outcome?
3. what score is predicted?
4. if knockout, who is predicted to advance?
5. is the game already in progress?

---

## Data and prediction behavior

The app should use:

- official or licensed fixture data for schedule and status
- safe, public, allowlisted sources for consensus research
- versioned prediction logic
- transparent explanation summaries

Do not:

- scrape arbitrary websites
- trust unvalidated pages
- generate new public predictions once the game is underway
- present outcomes as certain

---

## UX states

### Before kickoff

- show next match
- allow the octopus prediction experience
- reveal winner/draw + score + confidence

### Just after kickoff / in progress

- stop prediction flow
- clearly label the match as live or in progress
- show guidance such as:
  - “Game in progress”
  - “No new prediction right now”
  - “Go watch the game”

### After result

Optional for later phase:

- show actual result
- compare predicted vs actual
- show prediction accuracy history

---

## Recommended document structure in repo

Use the following docs:

- `AGENTS.md` → agent and engineering operating instructions
- `PROJECT_BRIEF.md` → product context, scope, creative direction, and decision log
- `ASSET_MANIFEST.md` → single source of truth for filenames, purposes, dimensions, transparency, display sizes, anchors, and layer order
- `README.md` → setup and run instructions
- `docs/ARCHITECTURE.md` → technical architecture
- `docs/ASSET_LICENSES.md` → ownership and licensing records
- `docs/PREDICTION_MODEL.md` → scoring logic and rules
- `docs/SECURITY.md` → safe ingestion and prompt-injection rules

---

## Why `PROJECT_BRIEF.md` is the best name

This is the clearest vibe-coding-friendly name because it:

- is easy for both humans and AI tools to understand
- clearly differs from `AGENTS.md`
- indicates product intent, not just technical rules
- works well as a single source of business + UX context
- can be referenced by builders, designers, and coding agents

Alternative acceptable names:

- `PRODUCT_BRIEF.md`
- `BUILD_BRIEF.md`
- `PROJECT_CONTEXT.md`

Preferred choice: **`PROJECT_BRIEF.md`**

---

## Immediate next build steps

1. validate every transparent asset and correct or re-export any asset that fails
2. omit `aquarium-glass-overlay.png` from the prototype until it passes the manifest requirements
3. validate filenames, dimensions, alpha, display sizes, anchors, and layer order against `ASSET_MANIFEST.md`
4. wire assets into Phaser scene states using the manifest's logical sizes
5. implement separate featured-match and next-scheduled-match resolvers
6. implement the in-progress state rule
7. integrate prediction boxes and the neutral draw-shrug treatment
8. connect reveal state to stored prediction output
9. add mobile-first UI shell around aquarium scene

---

## Notes for future iterations

Future enhancements may include:

- audio reactions
- subtle idle motion via code tweening
- team-specific flag panels
- shareable prediction cards
- results accuracy dashboard
- bracket or tournament path views after MVP
