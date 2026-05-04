# Kid Test Game — Harry Potter Edition

A kid-friendly **Harry Potter–themed** character customisation and adventure game built with **Phaser 3** and **TypeScript**, bundled by **Vite**.

## Theme Direction

The game is evolving into a Harry Potter experience. The player creates their character on the select screen, then enters a living room where a magical story begins. Core narrative beats to build toward:

- **Owl delivery** — 20 seconds after entering the living room, an owl crashes into the window. A letter (Hogwarts acceptance letter style) slips through and floats down to the character.
- Future scenes: reading the letter, packing a trunk, traveling to Diagon Alley / Platform 9¾, arriving at Hogwarts.

### Theming Guidelines
- Colour palette: deep purples, golds, parchment tones, dark greens (Slytherin/Gryffindor accents).
- UI text should feel hand-written / parchment-like where possible.
- Sound design (future): owls hooting, wand whooshes, magical chimes.
- Keep the character fully customisable — the player IS the protagonist.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Phaser 3](https://phaser.io/) | ^3.87 | 2D game framework (canvas rendering, input, tweens) |
| [Vite](https://vitejs.dev/) | ^6.1 | Dev server + bundler |
| TypeScript | ^5.7 | Type safety |

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
```

## Project Structure

```
src/
  game.ts                        # Entry point – Phaser.Game config + scene list
  scenes/
    CharacterSelectScene.ts      # Scene 1: character trait picker + live preview
    LivingRoomScene.ts           # Scene 2: living room environment, movable character
index.html                       # Shell HTML – mounts #game-container
vite.config.ts                   # Vite config (base './', outDir 'dist')
tsconfig.json                    # TypeScript config (strict, bundler resolution)
```

### Key exports from `CharacterSelectScene.ts`

| Export | Description |
|--------|-------------|
| `TRAITS` | Array of 8 trait definitions (key, label, options[]) |
| `HAIR_COLORS` / `SKIN_TONES` / `EYE_COLORS` / `TOP_COLORS` / `BOTTOM_COLORS` | `Record<string, number>` hex color maps |
| `CharacterSelectScene` | Phaser.Scene subclass |

`LivingRoomScene` imports all of the above so both scenes share identical drawing logic.

## How It Works

1. **CharacterSelectScene** renders an 8-trait picker UI (two columns on desktop, single column on mobile). Selecting a trait calls `_drawCharacter()` which procedurally redraws the preview using `Phaser.GameObjects.Graphics`.
2. `_onStartGame()` passes the selections record to **LivingRoomScene** via `scene.start()`.
3. **LivingRoomScene** draws a procedural living room (wall, floor, window, TV on console, lamp, rug, couch) and places the sitting character on the couch. Arrow keys / D-pad move the character. Moving stands the character up; pressing **S** while stationary sits them back down.
4. After 20 seconds in the living room, `_spawnOwl()` triggers: an owl flies in from the right, crashes into the window (camera shake), then `_spawnLetter()` sends a parchment letter floating down to the character's head.
5. The Back button restores selections from the Phaser registry before restarting CharacterSelectScene.

## Responsive Layout

- `< 700 px` wide → mobile single-column trait list; character drawn below the list.
- `≥ 700 px` → desktop two-column layout; character drawn at fixed `cx = 400`.
- Both scenes debounce `scale.on('resize')` to gracefully handle orientation changes.

## Working with Phaser + TypeScript Tips

- `this.input.keyboard!` – keyboard plugin can be null if input is disabled; use `!` only inside `create()` after confirming input is active.
- `Phaser.Display.Color.ValueToColor(hex).darken(n).color` converts a hex integer to a darkened hex integer.
- Graphics are drawn once in `create()` (room, couch) and cleared/redrawn on trait changes (`_drawCharacter`).
- To add a new trait: add an entry to `TRAITS`, add a color map if needed, and update the drawing logic in `_drawCharacter` / `_drawSittingCharacter` / `_drawStandingCharacter`.
- Z-depth in LivingRoomScene: background=0, couch back=1, character=5, accessories=6, couch front=8 (sitting) or 2 (standing), UI/cinematics=20+.
