import Phaser from 'phaser';
import {
  TRAITS,
  HAIR_COLORS,
  SKIN_TONES,
  EYE_COLORS,
  TOP_COLORS,
  BOTTOM_COLORS,
} from './CharacterSelectScene';

// Offset used to convert the sitting character's head-centre Y back to the
// "feet-level baseY" coordinate system that _drawHair expects.
// Derived from CharacterSelectScene: head centre = baseY − 265.
const HEAD_TO_BASE_OFFSET = 265;

type DPadDirection = 'up' | 'down' | 'left' | 'right';

interface CouchDimensions {
  floorY: number;
  couchW: number;
  cx: number;
  armW: number;
  seatH: number;
  backH: number;
  seatY: number;
}

export class LivingRoomScene extends Phaser.Scene {
  private _sel: Record<string, number> = {};
  private _charG!: Phaser.GameObjects.Graphics;
  private _accG!: Phaser.GameObjects.Graphics;
  private _cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private _dpadState: Record<DPadDirection, boolean> = { up: false, down: false, left: false, right: false };
  private _dpadElements: Phaser.GameObjects.GameObject[] = [];
  private _dpadResizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super({ key: 'LivingRoomScene' });
  }

  init(data: Record<string, number>): void {
    this._sel = data ?? {};
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    // Layer order: room background → couch back → character → couch front
    const bgG = this.add.graphics();
    this._drawRoom(bgG, W, H);

    this._charG = this.add.graphics();
    this._accG = this.add.graphics();
    this._drawSittingCharacter(this._charG, this._accG, W, H);

    // Draw couch front face on top so it partially overlaps the character's legs
    const fgG = this.add.graphics();
    this._drawCouchFront(fgG, W, H);

    // Scene title
    this.add
      .text(W / 2, 26, '🎮  Game Start!', {
        fontSize: '22px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#3a2800',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Back button
    const btn = this.add
      .text(W / 2, H - 28, '◀  Back to Character Select', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#5a3fa0',
        padding: { x: 16, y: 8 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#7a5fc0' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#5a3fa0' }));
    btn.on('pointerdown', () => {
      this.registry.set('_selections', { ...this._sel });
      this.scene.start('CharacterSelectScene');
    });

    // Keyboard arrow keys
    this._cursors = this.input.keyboard!.createCursorKeys();

    // D-pad touch state
    this._dpadState = { up: false, down: false, left: false, right: false };
    this._dpadElements = [];
    this._createDPad(W, H);

    // Reposition D-pad when the viewport changes (orientation change, browser chrome).
    this._dpadResizeTimer = null;
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this._dpadResizeTimer) clearTimeout(this._dpadResizeTimer);
      this._dpadResizeTimer = setTimeout(() => {
        this._dpadElements.forEach(el => el.destroy());
        this._dpadElements = [];
        this._dpadState = { up: false, down: false, left: false, right: false };
        this._createDPad(gameSize.width, gameSize.height);
        this._dpadResizeTimer = null;
      }, 100);
    }, this);

    // Fade the scene in
    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 500,
    });
  }

  update(): void {
    const speed = 3;
    let dx = 0;
    let dy = 0;

    if (this._cursors.left.isDown  || this._dpadState.left)  dx -= speed;
    if (this._cursors.right.isDown || this._dpadState.right) dx += speed;
    if (this._cursors.up.isDown    || this._dpadState.up)    dy -= speed;
    if (this._cursors.down.isDown  || this._dpadState.down)  dy += speed;

    if (dx !== 0 || dy !== 0) {
      const W = this.scale.width;
      const H = this.scale.height;
      const maxDX = W * 0.4;
      const maxDY = H * 0.2;
      this._charG.x = Phaser.Math.Clamp(this._charG.x + dx, -maxDX, maxDX);
      this._charG.y = Phaser.Math.Clamp(this._charG.y + dy, -maxDY, maxDY);
      this._accG.x  = this._charG.x;
      this._accG.y  = this._charG.y;
    }
  }

  private _createDPad(W: number, H: number): void {
    const btnSize = 50;
    const padX = 24;
    // 80 px gives comfortable clearance above browser chrome on all common devices.
    const padY = 80;
    const cx = padX + btnSize * 1.5;
    const cy = H - padY - btnSize * 1.5;

    // Semi-transparent background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.35);
    bg.fillCircle(cx, cy, btnSize * 1.9);
    bg.setDepth(9);
    this._dpadElements.push(bg);

    const dirs: Array<{ key: DPadDirection; label: string; ox: number; oy: number }> = [
      { key: 'up',    label: '▲', ox: 0,        oy: -btnSize },
      { key: 'down',  label: '▼', ox: 0,        oy:  btnSize },
      { key: 'left',  label: '◀', ox: -btnSize, oy: 0 },
      { key: 'right', label: '▶', ox:  btnSize, oy: 0 },
    ];

    dirs.forEach(({ key, label, ox, oy }) => {
      const btn = this.add
        .text(cx + ox, cy + oy, label, {
          fontSize: '26px',
          fontFamily: 'Arial',
          color: '#ffffff',
          backgroundColor: '#334466',
          padding: { x: 12, y: 9 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.85)
        .setDepth(10);

      btn.on('pointerdown',      () => { this._dpadState[key] = true;  btn.setAlpha(1); });
      btn.on('pointerup',        () => { this._dpadState[key] = false; btn.setAlpha(0.85); });
      btn.on('pointerupoutside', () => { this._dpadState[key] = false; btn.setAlpha(0.85); });
      btn.on('pointerout',       () => { this._dpadState[key] = false; btn.setAlpha(0.85); });
      btn.on('pointerover',      () => btn.setAlpha(1));

      this._dpadElements.push(btn);
    });
  }

  // ---------------------------------------------------------------------------
  // Shared couch geometry (keeps everything in sync)
  // ---------------------------------------------------------------------------
  private _couchDimensions(W: number, H: number): CouchDimensions {
    const floorY = Math.round(H * 0.72);
    const couchW = Math.min(420, Math.round(W * 0.78));
    const cx = Math.round(W / 2);
    const armW = Math.round(couchW * 0.1);
    const seatH = 36;
    const backH = 110;
    const seatY = floorY - seatH - 12;
    return { floorY, couchW, cx, armW, seatH, backH, seatY };
  }

  // ---------------------------------------------------------------------------
  // Room background (wall, floor, window, TV, lamp, rug, couch back)
  // ---------------------------------------------------------------------------
  private _drawRoom(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    const { floorY } = this._couchDimensions(W, H);

    // ── Wall ──────────────────────────────────────────────────────────────────
    g.fillStyle(0xf2e4c8);
    g.fillRect(0, 0, W, floorY);

    // Crown moulding strip at ceiling
    g.fillStyle(0xe4d4b0);
    g.fillRect(0, 0, W, 14);

    // Baseboard
    g.fillStyle(0xd8c8a4);
    g.fillRect(0, floorY - 16, W, 16);

    // ── Floor ─────────────────────────────────────────────────────────────────
    g.fillStyle(0xb87a2a);
    g.fillRect(0, floorY, W, H - floorY);

    // Plank lines
    g.lineStyle(1, 0x9a6618, 0.5);
    for (let y = floorY + 20; y < H; y += 20) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.strokePath();
    }

    // ── Window (right side of wall) ───────────────────────────────────────────
    const winCX = Math.round(W * 0.75);
    const winW = 130;
    const winH = 110;
    const winTop = 60;

    // Curtain rod
    g.fillStyle(0x8b7355);
    g.fillRect(winCX - winW / 2 - 32, winTop - 12, winW + 64, 8);

    // Curtains (drawn before frame so frame sits on top)
    g.fillStyle(0xc05030);
    g.fillTriangle(
      winCX - winW / 2 - 2,  winTop - 4,
      winCX - winW / 2 - 2,  winTop + winH + 8,
      winCX - winW / 2 - 30, winTop - 4
    );
    g.fillTriangle(
      winCX - winW / 2 - 2,  winTop + winH + 8,
      winCX - winW / 2 - 30, winTop - 4,
      winCX - winW / 2 - 30, winTop + winH + 8
    );
    g.fillTriangle(
      winCX + winW / 2 + 2,  winTop - 4,
      winCX + winW / 2 + 2,  winTop + winH + 8,
      winCX + winW / 2 + 30, winTop - 4
    );
    g.fillTriangle(
      winCX + winW / 2 + 2,  winTop + winH + 8,
      winCX + winW / 2 + 30, winTop - 4,
      winCX + winW / 2 + 30, winTop + winH + 8
    );

    // Window frame
    g.fillStyle(0xffffff);
    g.fillRect(winCX - winW / 2 - 6, winTop - 6, winW + 12, winH + 12);

    // Sky
    g.fillStyle(0x87ceeb);
    g.fillRect(winCX - winW / 2, winTop, winW, winH);

    // Clouds
    g.fillStyle(0xffffff);
    g.fillEllipse(winCX - 20, winTop + 35, 52, 22);
    g.fillEllipse(winCX + 30, winTop + 55, 40, 18);

    // Window cross-bars
    g.fillStyle(0xeeeeee);
    g.fillRect(winCX - 3, winTop, 6, winH);
    g.fillRect(winCX - winW / 2, winTop + winH / 2 - 3, winW, 6);

    // ── TV (left side of wall) ─────────────────────────────────────────────────
    const tvCX = Math.round(W * 0.18);
    const tvW = 140;
    const tvH = 88;
    const tvTop = 85;

    g.fillStyle(0x888888);
    g.fillRect(tvCX - 4, tvTop + tvH + 8, 8, 26);
    g.fillEllipse(tvCX, tvTop + tvH + 36, 36, 10);

    g.fillStyle(0x1c1c1c);
    g.fillRect(tvCX - tvW / 2 - 8, tvTop - 8, tvW + 16, tvH + 16);

    g.fillStyle(0x0d1b2a);
    g.fillRect(tvCX - tvW / 2, tvTop, tvW, tvH);

    g.fillStyle(0x1a3a5c);
    g.fillRect(tvCX - tvW / 2, tvTop, tvW / 2, tvH / 2);

    g.fillStyle(0xffffff);
    g.fillRect(tvCX - tvW / 2 + 6, tvTop + 6, 18, 10);

    // ── Floor lamp (far right) ─────────────────────────────────────────────────
    const lampX = Math.round(W * 0.9);
    const lampBaseY = floorY - 4;

    g.fillStyle(0x777777);
    g.fillEllipse(lampX, lampBaseY, 32, 12);
    g.fillRect(lampX - 4, lampBaseY - 155, 8, 155);

    g.fillStyle(0xf0c86a);
    g.fillTriangle(
      lampX - 30, lampBaseY - 157,
      lampX + 30, lampBaseY - 157,
      lampX,      lampBaseY - 215
    );

    g.fillStyle(0xffee88);
    g.fillCircle(lampX, lampBaseY - 178, 26);
    g.setAlpha(0.12);
    g.fillCircle(lampX, lampBaseY - 130, 65);
    g.setAlpha(1);

    // ── Decorative rug ────────────────────────────────────────────────────────
    const rugCX = Math.round(W / 2);
    const rugY = floorY + Math.round((H - floorY) * 0.35);
    g.fillStyle(0x7030a0);
    g.fillEllipse(rugCX, rugY, Math.round(W * 0.65), Math.round((H - floorY) * 0.55));
    g.fillStyle(0x9040c8);
    g.fillEllipse(rugCX, rugY, Math.round(W * 0.48), Math.round((H - floorY) * 0.38));
    g.lineStyle(2, 0xb060e0);
    g.strokeEllipse(rugCX, rugY, Math.round(W * 0.56), Math.round((H - floorY) * 0.46));

    // ── Couch back half ────────────────────────────────────────────────────────
    this._drawCouchBack(g, W, H);
  }

  // ── Couch back (drawn before character) ──────────────────────────────────────
  private _drawCouchBack(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    const { couchW, cx, armW, seatH, backH, seatY } = this._couchDimensions(W, H);
    const couchX = cx - couchW / 2;

    const couchMain  = 0x7b4f1e;
    const couchDark  = 0x5a380d;
    const couchLight = 0xa06828;
    const cushionC   = 0x8b5a20;

    g.fillStyle(couchMain);
    g.fillRect(couchX, seatY - backH, couchW, backH);

    g.fillStyle(couchDark);
    g.fillRect(couchX, seatY - backH, couchW, 10);

    const third = Math.round(couchW / 3);
    g.fillStyle(couchDark);
    g.fillRect(couchX + third - 2,     seatY - backH + 10, 4, backH - 10);
    g.fillRect(couchX + third * 2 - 2, seatY - backH + 10, 4, backH - 10);

    g.fillStyle(cushionC);
    g.fillRect(couchX + armW, seatY, couchW - armW * 2, seatH);

    g.fillStyle(couchDark);
    g.fillRect(cx - 2, seatY, 4, seatH);

    g.fillStyle(couchMain);
    g.fillRect(couchX,                 seatY - backH, armW, backH + seatH);
    g.fillRect(couchX + couchW - armW, seatY - backH, armW, backH + seatH);

    g.fillStyle(couchLight);
    g.fillEllipse(couchX + armW / 2,          seatY - backH, armW + 6, 14);
    g.fillEllipse(couchX + couchW - armW / 2, seatY - backH, armW + 6, 14);
  }

  // ── Couch front face (drawn on top of character to show seat edge) ─────────
  private _drawCouchFront(g: Phaser.GameObjects.Graphics, W: number, H: number): void {
    const { floorY, couchW, cx, armW, seatH, seatY } = this._couchDimensions(W, H);
    const couchX = cx - couchW / 2;

    const couchDark = 0x5a380d;

    g.fillStyle(couchDark);
    g.fillRect(couchX + armW, seatY + seatH, couchW - armW * 2, 20);

    g.fillStyle(0x4a2d0d);
    g.fillRect(couchX,                 seatY + seatH, armW, 20);
    g.fillRect(couchX + couchW - armW, seatY + seatH, armW, 20);

    g.fillStyle(0x3e2408);
    g.fillRect(couchX + armW + 8,           floorY - 14, 14, 14);
    g.fillRect(couchX + couchW - armW - 22, floorY - 14, 14, 14);
  }

  // ---------------------------------------------------------------------------
  // Sitting character
  // ---------------------------------------------------------------------------
  private _drawSittingCharacter(g: Phaser.GameObjects.Graphics, ag: Phaser.GameObjects.Graphics, W: number, H: number): void {
    const { seatY, cx } = this._couchDimensions(W, H);
    const sel = this._sel;

    const hairStyleOpt = TRAITS[0].options[sel['hairStyle'] ?? 0];
    const hairColor    = HAIR_COLORS[TRAITS[1].options[sel['hairColor'] ?? 0]];
    const skinColor    = SKIN_TONES[TRAITS[2].options[sel['skinTone'] ?? 0]];
    const eyeColor     = EYE_COLORS[TRAITS[3].options[sel['eyeColor'] ?? 0]];
    const topOpt       = TRAITS[4].options[sel['top'] ?? 0];
    const topColor     = TOP_COLORS[TRAITS[5].options[sel['topColor'] ?? 0]];
    const bottomOpt    = TRAITS[6].options[sel['bottom'] ?? 0];
    const bottomColor  = BOTTOM_COLORS[bottomOpt];
    const accessoryOpt = TRAITS[7].options[sel['accessory'] ?? 0];

    const hipY   = seatY + 4;
    const thighW = 52;
    const thighH = 25;
    const calfW  = 22;
    const calfH  = 62;

    // ── Sitting legs ───────────────────────────────────────────────────────────
    g.fillStyle(bottomColor);

    if (bottomOpt === 'Skirt') {
      g.fillRect(cx - 55, hipY - 25, 110, 30);
      g.fillTriangle(
        cx - 55, hipY + 5,
        cx + 55, hipY + 5,
        cx - 65, hipY + 52
      );
      g.fillTriangle(
        cx - 55, hipY + 5,
        cx + 55, hipY + 5,
        cx + 65, hipY + 52
      );
      g.fillStyle(skinColor);
      g.fillRect(cx - 58, hipY + 50, calfW, calfH - 12);
      g.fillRect(cx + 36, hipY + 50, calfW, calfH - 12);
      g.fillStyle(0x333333);
      g.fillEllipse(cx - 47, hipY + 102, 30, 12);
      g.fillEllipse(cx + 47, hipY + 102, 30, 12);

    } else if (bottomOpt === 'Shorts') {
      g.fillRect(cx - thighW - 12, hipY, thighW, thighH);
      g.fillRect(cx + 12,          hipY, thighW, thighH);
      g.fillStyle(skinColor);
      g.fillRect(cx - thighW - 1,  hipY + thighH, calfW, calfH);
      g.fillRect(cx + thighW - 10, hipY + thighH, calfW, calfH);
      g.fillStyle(0x333333);
      g.fillEllipse(cx - thighW + 10, hipY + thighH + calfH + 8, 30, 13);
      g.fillEllipse(cx + thighW + 12, hipY + thighH + calfH + 8, 30, 13);

    } else {
      g.fillRect(cx - thighW - 12, hipY, thighW, thighH);
      g.fillRect(cx + 12,          hipY, thighW, thighH);
      g.fillRect(cx - thighW - 1,  hipY + thighH, calfW, calfH);
      g.fillRect(cx + thighW - 10, hipY + thighH, calfW, calfH);
      g.fillStyle(0x333333);
      g.fillEllipse(cx - thighW + 10, hipY + thighH + calfH + 8, 30, 13);
      g.fillEllipse(cx + thighW + 12, hipY + thighH + calfH + 8, 30, 13);
    }

    // ── Torso ──────────────────────────────────────────────────────────────────
    const torsoH   = 80;
    const torsoTop = hipY - torsoH;

    g.fillStyle(topColor);
    if (topOpt === 'Dress') {
      g.fillRect(cx - 28, torsoTop, 56, torsoH + 30);
    } else {
      g.fillRect(cx - 28, torsoTop, 56, torsoH);
    }

    if (topOpt === 'Hoodie') {
      g.fillStyle(Phaser.Display.Color.ValueToColor(topColor).darken(20).color);
      g.fillRect(cx - 4, torsoTop, 8, 60);
    } else if (topOpt === 'Jacket') {
      g.fillStyle(Phaser.Display.Color.ValueToColor(topColor).darken(30).color);
      g.fillRect(cx - 28, torsoTop, 10, 80);
      g.fillRect(cx + 18, torsoTop, 10, 80);
    }

    // ── Arms ──────────────────────────────────────────────────────────────────
    g.fillStyle(topColor);
    g.fillRect(cx - 52, torsoTop + 5, 22, 58);
    g.fillRect(cx + 30, torsoTop + 5, 22, 58);

    g.fillStyle(skinColor);
    g.fillEllipse(cx - 41, torsoTop + 68, 18, 20);
    g.fillEllipse(cx + 41, torsoTop + 68, 18, 20);

    // ── Neck ──────────────────────────────────────────────────────────────────
    g.fillStyle(skinColor);
    g.fillRect(cx - 10, torsoTop - 16, 20, 20);

    // ── Head ──────────────────────────────────────────────────────────────────
    g.fillStyle(skinColor);
    const headCY = torsoTop - 56;
    g.fillEllipse(cx, headCY, 80, 90);

    g.fillStyle(0xffffff);
    g.fillEllipse(cx - 18, headCY - 5, 20, 14);
    g.fillEllipse(cx + 18, headCY - 5, 20, 14);
    g.fillStyle(eyeColor);
    g.fillCircle(cx - 18, headCY - 5, 6);
    g.fillCircle(cx + 18, headCY - 5, 6);
    g.fillStyle(0x000000);
    g.fillCircle(cx - 18, headCY - 5, 3);
    g.fillCircle(cx + 18, headCY - 5, 3);

    g.fillStyle(0xcc5555);
    g.fillEllipse(cx, headCY + 15, 22, 10);

    const noseDark = Phaser.Display.Color.ValueToColor(skinColor).darken(15).color;
    g.fillStyle(noseDark);
    g.fillTriangle(cx - 5, headCY + 5, cx + 5, headCY + 5, cx, headCY + 15);

    // ── Hair ──────────────────────────────────────────────────────────────────
    this._drawHair(g, hairStyleOpt, cx, headCY + HEAD_TO_BASE_OFFSET, hairColor);

    // ── Accessories ───────────────────────────────────────────────────────────
    if (accessoryOpt === 'Hat' || accessoryOpt === 'Hat + Glasses') {
      ag.fillStyle(0x5a3a1a);
      ag.fillEllipse(cx, headCY - 45, 96, 18);
      ag.fillRect(cx - 36, headCY - 87, 72, 42);
      ag.fillStyle(0x331a00);
      ag.fillRect(cx - 36, headCY - 53, 72, 8);
    }

    if (accessoryOpt === 'Glasses' || accessoryOpt === 'Hat + Glasses') {
      ag.lineStyle(3, 0x333333);
      ag.strokeCircle(cx - 18, headCY - 5, 11);
      ag.strokeCircle(cx + 18, headCY - 5, 11);
      ag.beginPath();
      ag.moveTo(cx - 7,  headCY - 5);
      ag.lineTo(cx + 7,  headCY - 5);
      ag.strokePath();
      ag.beginPath();
      ag.moveTo(cx - 29, headCY - 5);
      ag.lineTo(cx - 42, headCY - 3);
      ag.strokePath();
      ag.beginPath();
      ag.moveTo(cx + 29, headCY - 5);
      ag.lineTo(cx + 42, headCY - 3);
      ag.strokePath();
    }
  }

  // ---------------------------------------------------------------------------
  // Hair drawing – identical logic to CharacterSelectScene._drawHair.
  // Pass (headCY + 265) as baseY to keep offsets consistent.
  // ---------------------------------------------------------------------------
  private _drawHair(g: Phaser.GameObjects.Graphics, style: string, cx: number, baseY: number, color: number): void {
    g.fillStyle(color);
    switch (style) {
      case 'Short':
        g.fillEllipse(cx, baseY - 295, 84, 50);
        break;
      case 'Long':
        g.fillEllipse(cx, baseY - 295, 84, 50);
        g.fillRect(cx - 42, baseY - 290, 14, 90);
        g.fillRect(cx + 28, baseY - 290, 14, 90);
        break;
      case 'Curly Short':
        g.fillCircle(cx, baseY - 310, 44);
        g.fillCircle(cx - 30, baseY - 295, 26);
        g.fillCircle(cx + 30, baseY - 295, 26);
        break;
      case 'Curly Long':
        g.fillCircle(cx, baseY - 310, 44);
        g.fillCircle(cx - 30, baseY - 295, 26);
        g.fillCircle(cx + 30, baseY - 295, 26);
        g.fillCircle(cx - 44, baseY - 270, 18);
        g.fillCircle(cx - 46, baseY - 245, 16);
        g.fillCircle(cx - 44, baseY - 222, 15);
        g.fillCircle(cx - 42, baseY - 200, 14);
        g.fillCircle(cx + 44, baseY - 270, 18);
        g.fillCircle(cx + 46, baseY - 245, 16);
        g.fillCircle(cx + 44, baseY - 222, 15);
        g.fillCircle(cx + 42, baseY - 200, 14);
        break;
      case 'Spiky':
        for (let i = -2; i <= 2; i++) {
          g.fillTriangle(
            cx + i * 16 - 8, baseY - 300,
            cx + i * 16 + 8, baseY - 300,
            cx + i * 16,     baseY - 340
          );
        }
        g.fillEllipse(cx, baseY - 295, 84, 30);
        break;
      default:
        g.fillEllipse(cx, baseY - 295, 84, 50);
    }
  }
}
