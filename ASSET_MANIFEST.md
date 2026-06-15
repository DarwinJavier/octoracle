# ASSET_MANIFEST.md

## Purpose and authority

This file is the **single source of truth** for all production asset filenames, asset purposes, source dimensions, transparency requirements, Phaser display sizes, and anchor rules for OctoOracle 2026.

`AGENTS.md`, `PROJECT_BRIEF.md`, code, tests, and documentation must reference the filenames in this manifest exactly.

Do not rename, replace, add, or remove an asset without updating this file in the same change.

---

## Current validation result

Validation was performed against the uploaded PNG files available for this project.

| Category                                              | Expected                                       | Current result               |
| ----------------------------------------------------- | ---------------------------------------------- | ---------------------------- |
| `aquarium-far-background.png`                         | Fully opaque background                        | **Pass**                     |
| All octopus sprites                                   | Real alpha transparency                        | **Pass minimum alpha check** |
| Prediction boxes, shells, ball, bubbles, reveal burst | Real alpha transparency                        | **Pass minimum alpha check** |
| `aquarium-midground-ruins.png`                        | Real alpha transparency                        | **Pass minimum alpha check** |
| `aquarium-glass-overlay.png`                          | Real and preferably partial alpha transparency | **Fail**                     |

All files marked `Transparent` except `aquarium-glass-overlay.png` contain an alpha channel with transparent pixels. They still require the full visual composite and edge-quality checks listed below before production use.

`aquarium-glass-overlay.png` is fully opaque and visibly contains a baked checkerboard. **Do not treat the checkerboard as transparency.** Omit this layer from the prototype until it is repaired or replaced through a reviewed asset change. Its production requirement remains transparent with partial alpha.

Before production use, every file marked `Transparent` below must be validated or corrected so that:

- the PNG contains a real alpha channel
- background pixels have alpha `0`
- anti-aliased edges use partial alpha where appropriate
- the checkerboard pattern is not present in the RGB pixels
- translucent glass assets use partial alpha rather than a flattened checkerboard

The far background is intentionally opaque and is the only transparency exception.

---

## Logical game canvas and scaling

Use a **1280 × 720 logical Phaser canvas** with `Phaser.Scale.FIT` and automatic centering.

All display sizes in this file are logical canvas pixels. Phaser scales the complete canvas down or up for the browser viewport.

Rules:

- preserve each asset's aspect ratio
- use `setDisplaySize`, `setScale`, or equivalent calculations from the logical sizes below
- never stretch an image independently on the X and Y axes
- use the listed display size as a starting point, then allow at most ±10% adjustment for composition
- do not use source pixel dimensions as on-screen dimensions
- the aquarium canvas should remain readable at 320 CSS pixels wide
- essential match information must remain outside the canvas as semantic HTML

### Responsive scale rule

At runtime:

```text
canvasScale = min(viewportWidth / 1280, availableHeight / 720)
```

The logical sprite sizes below remain unchanged. The canvas scale handles viewport adaptation.

---

## Final asset inventory

### Octopus sprites

All octopus source masters are currently **1254 × 1254 px**.

| Filename                      | Purpose                                      | Transparency |         Logical display size |     Anchor |
| ----------------------------- | -------------------------------------------- | -----------: | ---------------------------: | ---------: |
| `octopus-idle-front.png`      | Primary idle and default hero pose           |  Transparent | 300 px high, max 360 px wide | `0.5, 0.5` |
| `octopus-idle-alt.png`        | Alternate idle loop pose                     |  Transparent | 300 px high, max 360 px wide | `0.5, 0.5` |
| `octopus-inspect-left.png`    | Examine Team A or left option                |  Transparent | 300 px high, max 360 px wide | `0.5, 0.5` |
| `octopus-inspect-right.png`   | Examine Team B or right option               |  Transparent | 300 px high, max 360 px wide | `0.5, 0.5` |
| `octopus-thinking.png`        | Analytical pause and suspense                |  Transparent | 300 px high, max 360 px wide | `0.5, 0.5` |
| `octopus-hesitate-center.png` | Central hesitation for close matches         |  Transparent | 300 px high, max 360 px wide | `0.5, 0.5` |
| `octopus-reconsider-turn.png` | False start, braking, or direction reversal  |  Transparent | 320 px wide, max 290 px high | `0.5, 0.5` |
| `octopus-draw-shrug.png`      | Draw prediction and neutral reaction         |  Transparent | 300 px high, max 360 px wide | `0.5, 0.5` |
| `octopus-swim-left.png`       | Travel toward Team A                         |  Transparent | 360 px wide, max 270 px high | `0.5, 0.5` |
| `octopus-swim-right.png`      | Travel toward Team B                         |  Transparent | 360 px wide, max 270 px high | `0.5, 0.5` |
| `octopus-swim-center.png`     | Travel toward the central draw shell         |  Transparent | 330 px wide, max 290 px high | `0.5, 0.5` |
| `octopus-select-left.png`     | Clean reach toward Team A; no baked UI wall  |  Transparent | 360 px wide, max 300 px high | `0.5, 0.5` |
| `octopus-select-right.png`    | Clean reach toward Team B; no baked UI door  |  Transparent | 360 px wide, max 300 px high | `0.5, 0.5` |
| `octopus-open-reveal.png`     | Open or present the chosen prediction object |  Transparent | 400 px wide, max 340 px high | `0.5, 0.5` |
| `octopus-celebrate.png`       | Prediction reveal and celebration            |  Transparent | 320 px high, max 380 px wide | `0.5, 0.5` |

### Prediction props

All current prop source masters are **1254 × 1254 px**.

| Filename                    | Purpose                                                   |                 Transparency | Logical display size |     Anchor |
| --------------------------- | --------------------------------------------------------- | ---------------------------: | -------------------: | ---------: |
| `prediction-box-closed.png` | Closed team selection container; reuse for left and right | Transparent, including glass |         315 × 315 px | `0.5, 1.0` |
| `prediction-box-open.png`   | Open selected team container; reuse for left and right    | Transparent, including glass |         330 × 330 px | `0.5, 1.0` |
| `draw-shell-closed.png`     | Retained optional source asset; not loaded in the scene   |                  Transparent |         180 × 180 px | `0.5, 1.0` |
| `draw-shell-open.png`       | Retained optional source asset; not loaded in the scene   |                  Transparent |         190 × 190 px | `0.5, 1.0` |
| `soccer-ball-bait.png`      | Food/bait equivalent inside a selection object            |                  Transparent |           52 × 52 px | `0.5, 0.5` |

Use one copy of the prediction-box assets for each team. Do not create separate left and right box files unless the visual design changes materially. Team flags must be separate overlays added in code.

The current scene uses only the two team boxes as physical choices. A predicted draw is performed through the octopus draw-shrug animation without displaying the retained draw-shell assets.

### Effects

All current effect source masters are **1254 × 1254 px**.

| Filename                      | Purpose                             | Transparency | Logical display size |     Anchor |
| ----------------------------- | ----------------------------------- | -----------: | -------------------: | ---------: |
| `bubbles-small.png`           | Small ambient bubble cluster        |  Transparent |           48 × 48 px | `0.5, 0.5` |
| `bubbles-medium.png`          | Medium ambient bubble cluster       |  Transparent |           80 × 80 px | `0.5, 0.5` |
| `bubbles-stream.png`          | Vertical bubble trail               |  Transparent |          75 × 250 px | `0.5, 1.0` |
| `prediction-reveal-burst.png` | Reveal rays, sparkles, and confetti |  Transparent |         220 × 220 px | `0.5, 0.5` |

Effects may be duplicated, mirrored, rotated, faded, or tinted by Phaser. Do not bake multiple copies into the background.

### Environment layers

All current environment masters are **1672 × 941 px**, approximately 16:9.

| Filename                       | Purpose                                          |                   Transparency | Logical display size |     Anchor |
| ------------------------------ | ------------------------------------------------ | -----------------------------: | -------------------: | ---------: |
| `aquarium-far-background.png`  | Full opaque aquarium scene                       |                         Opaque |        1280 × 720 px | `0.5, 0.5` |
| `aquarium-midground-ruins.png` | Coral, bones, rocks, sand, and side framing      |                    Transparent |        1280 × 720 px | `0.5, 0.5` |
| `aquarium-glass-overlay.png`   | Front-glass highlights, rim, and caustic accents | Transparent with partial alpha |        1280 × 720 px | `0.5, 0.5` |

Layer order:

```text
0. aquarium-far-background.png
1. aquarium-midground-ruins.png
2. prediction props
3. octopus sprite
4. bubble and reveal effects
5. aquarium-glass-overlay.png
6. semantic HTML interface outside the canvas
```

### Interface illustrations

| Filename                     | Purpose                                                       | Transparency |              Logical display size | Anchor |
| ---------------------------- | ------------------------------------------------------------- | -----------: | --------------------------------: | -----: |
| `octopus-sleeping-scene.png` | Closed-match illustration when no pre-match prediction exists |       Opaque | Responsive 16:9 panel, max 1600px |    N/A |

This illustration is semantic HTML outside the Phaser canvas. Preserve its
source aspect ratio and use it only for the closed in-progress state.

---

## Screen placement guidance

Use these default positions on the 1280 × 720 logical canvas:

| Element                |                Default position |
| ---------------------- | ------------------------------: |
| Team A scoreboard      |                 `x: 300, y: 82` |
| Team B scoreboard      |                 `x: 980, y: 82` |
| Team A box             |                `x: 360, y: 675` |
| Team B box             |                `x: 920, y: 675` |
| Octopus idle center    |                `x: 640, y: 385` |
| Left inspection point  |                `x: 420, y: 390` |
| Right inspection point |                `x: 860, y: 390` |
| Reveal burst           | Centered behind the chosen prop |
| Glass overlay          |                `x: 640, y: 360` |

Placement may shift by up to 8% of canvas width or height to avoid overlap. The two team boxes must remain visually distinct and grounded on the sand.

---

## Asset loading and performance

- Keep original masters outside the public runtime bundle when possible.
- Create optimized runtime exports from the masters.
- Recommended runtime maximums:
  - octopus sprites: 768 × 768
  - props: 512 × 512
  - small effects: 256 × 256
  - bubble stream: 256 × 512
  - environment layers: 1600 × 900 or current 1672 × 941
- Preserve alpha during optimization.
- Do not convert transparent assets to JPEG.
- Prefer lossless or high-quality WebP only after confirming Phaser and browser alpha rendering.
- Preload only the assets required for the initial state.
- Lazy-load celebration and secondary animation poses when practical.

---

## Required validation before merge

Every asset-related change must pass these checks:

1. The filename appears in this manifest exactly.
2. Source dimensions match the manifest or the manifest is updated deliberately.
3. Transparent assets use PNG or another alpha-safe format.
4. Transparent assets have an alpha channel with at least one pixel below alpha 255.
5. Opaque backgrounds do not accidentally contain alpha holes.
6. No checkerboard pattern is baked into RGB pixels.
7. The asset is composited against black, white, magenta, and green test backgrounds.
8. No pale halo or checkerboard residue appears around edges.
9. The image contains reasonable padding but not excessive empty canvas.
10. The runtime display size follows this manifest.
11. The source aspect ratio is preserved.
12. The asset works in reduced-motion mode when applicable.

### Minimum programmatic alpha check

```python
from PIL import Image

image = Image.open("public/assets/mascot/octopus-idle-front.png")
assert "A" in image.mode, "Asset has no alpha channel"
alpha = image.getchannel("A")
assert alpha.getextrema()[0] < 255, "Alpha channel is fully opaque"
```

This programmatic check is necessary but not sufficient. A visual composite check is still required.

---

## Folder structure

```text
public/
  assets/
    mascot/
      octopus-*.png
    props/
      prediction-box-*.png
      draw-shell-*.png
      soccer-ball-bait.png
    effects/
      bubbles-*.png
      prediction-reveal-burst.png
    backgrounds/
      aquarium-far-background.png
      aquarium-midground-ruins.png
    illustrations/
      octopus-sleeping-scene.png
    overlays/
      aquarium-glass-overlay.png
```

---

## Change-control rule

A coding agent must stop and request review before:

- renaming an asset
- changing a listed purpose
- changing a logical display size by more than 10%
- replacing an asset with a different composition
- adding a new production asset
- removing an existing production asset
- changing transparency expectations
- changing the logical game canvas size

Update this manifest first, then update code and tests in the same change.
