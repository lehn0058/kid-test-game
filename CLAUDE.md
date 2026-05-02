# Kid Test Game

A kid-friendly character customisation game built with **Phaser 3** and **TypeScript**, bundled by **Vite**.

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
3. **LivingRoomScene** draws a procedural living room (wall, floor, window, TV, lamp, rug, couch) and places the sitting character on the couch. Arrow keys and an on-screen D-pad move the character within bounds.
4. The Back button restores selections from the Phaser registry before restarting CharacterSelectScene.

## Responsive Layout

- `< 700 px` wide → mobile single-column trait list; character drawn below the list.
- `≥ 700 px` → desktop two-column layout; character drawn at fixed `cx = 400`.
- Both scenes debounce `scale.on('resize')` to gracefully handle orientation changes.

## Working with Phaser + TypeScript Tips

- `this.input.keyboard!` – keyboard plugin can be null if input is disabled; use `!` only inside `create()` after confirming input is active.
- `Phaser.Display.Color.ValueToColor(hex).darken(n).color` converts a hex integer to a darkened hex integer.
- Graphics are drawn once in `create()` (room, couch) and cleared/redrawn on trait changes (`_drawCharacter`).
- To add a new trait: add an entry to `TRAITS`, add a color map if needed, and update the drawing logic in `_drawCharacter` / `_drawSittingCharacter`.
