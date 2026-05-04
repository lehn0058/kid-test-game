import Phaser from 'phaser';

// ---------------------------------------------------------------------------
// Character customisation options (8 traits)
// ---------------------------------------------------------------------------
export interface Trait {
  key: string;
  label: string;
  options: string[];
}

export const TRAITS: Trait[] = [
  {
    key: 'hairStyle',
    label: 'Hair Style',
    options: ['Short', 'Long', 'Curly Short', 'Curly Long', 'Spiky'],
  },
  {
    key: 'hairColor',
    label: 'Hair Color',
    options: ['Blonde', 'Brown', 'Black', 'Red'],
  },
  {
    key: 'skinTone',
    label: 'Skin Tone',
    options: ['Light', 'Medium', 'Tan', 'Dark'],
  },
  {
    key: 'eyeColor',
    label: 'Eye Color',
    options: ['Blue', 'Brown', 'Green', 'Gray'],
  },
  {
    key: 'top',
    label: 'Top',
    options: ['T-Shirt', 'Hoodie', 'Jacket', 'Dress'],
  },
  {
    key: 'topColor',
    label: 'Top Color',
    options: ['Red', 'Blue', 'Green', 'Yellow'],
  },
  {
    key: 'bottom',
    label: 'Bottom',
    options: ['Jeans', 'Shorts', 'Skirt', 'Leggings'],
  },
  {
    key: 'accessory',
    label: 'Accessory',
    options: ['None', 'Hat', 'Glasses', 'Hat + Glasses'],
  },
];

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------
export const HAIR_COLORS: Record<string, number> = {
  Blonde: 0xffd700,
  Brown: 0x8b4513,
  Black: 0x1a1a1a,
  Red: 0xcc2200,
};

export const SKIN_TONES: Record<string, number> = {
  Light: 0xffe0bd,
  Medium: 0xd4a574,
  Tan: 0xc68642,
  Dark: 0x7c4a1e,
};

export const EYE_COLORS: Record<string, number> = {
  Blue: 0x4169e1,
  Brown: 0x6b3a2a,
  Green: 0x228b22,
  Gray: 0x808080,
};

export const TOP_COLORS: Record<string, number> = {
  Red: 0xe03c3c,
  Blue: 0x3c6ee0,
  Green: 0x3cb84a,
  Yellow: 0xe0c03c,
};

export const BOTTOM_COLORS: Record<string, number> = {
  Jeans: 0x4a6fa5,
  Shorts: 0x8b6914,
  Skirt: 0xd4649a,
  Leggings: 0x2d2d2d,
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const MOBILE_BREAKPOINT = 700;   // px – below this width use single-column layout
const MOBILE_ROW_START_Y = 140;  // px – y position of first trait row on mobile (shifted to make room for name bar)
const MOBILE_ROW_HEIGHT = 46;    // px – height per trait row on mobile
const MOBILE_CHAR_HEIGHT = 310;  // px – approximate character drawing height
const MOBILE_BTN_MARGIN = 60;    // px – bottom margin above the Start button

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export class CharacterSelectScene extends Phaser.Scene {
  private _selections: Record<string, number> = {};
  private _characterGraphics!: Phaser.GameObjects.Graphics;
  private _accessoryGraphics!: Phaser.GameObjects.Graphics;
  private _optionLabels: Phaser.GameObjects.Text[] = [];
  private _swatches: Record<string, Phaser.GameObjects.Rectangle> = {};
  private _nameInput: Phaser.GameObjects.DOMElement | null = null;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    TRAITS.forEach((t) => {
      this._selections[t.key] = 0;
    });

    // Restore selections saved before a resize-restart
    const saved = this.registry.get('_selections') as Record<string, number> | undefined;
    if (saved) {
      this._selections = saved;
      this.registry.remove('_selections');
    }

    this._characterGraphics = this.add.graphics();
    this._accessoryGraphics = this.add.graphics();

    this._buildUI();
    this._drawCharacter();

    // Rebuild UI when viewport changes (mobile browser chrome show/hide)
    let resizeTimer: Phaser.Time.TimerEvent | null = null;
    const onResize = (): void => {
      if (resizeTimer !== null) {
        resizeTimer.remove(false);
        resizeTimer = null;
      }
      resizeTimer = this.time.delayedCall(250, () => {
        resizeTimer = null;
        this.registry.set('_selections', { ...this._selections });
        this.scene.restart();
      });
    };
    this.scale.on('resize', onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', onResize, this));
  }

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------
  private _buildUI(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const isMobile = W < MOBILE_BREAKPOINT;

    // ── Name bar ─────────────────────────────────────────────────────────────
    this.add
      .text(W / 2, 12, 'YOUR NAME', {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#aaaacc',
        fontStyle: 'bold',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.placeholder = 'Enter your name…';
    inputEl.maxLength = 20;
    inputEl.value = localStorage.getItem('kid-game-player-name') ?? '';
    inputEl.style.cssText = [
      'width:220px',
      'padding:5px 14px',
      'border-radius:20px',
      'border:2px solid #7a5fc0',
      'background:#1a1a3e',
      'color:#ffffff',
      'font-size:16px',
      'font-family:Arial,sans-serif',
      'outline:none',
      'text-align:center',
      'box-sizing:border-box',
    ].join(';');
    inputEl.addEventListener('input', () => {
      localStorage.setItem('kid-game-player-name', inputEl.value);
    });
    this._nameInput = this.add.dom(W / 2, 38, inputEl);

    // Title
    this.add
      .text(W / 2, 82, 'Create Your Character', {
        fontSize: isMobile ? '22px' : '26px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(W / 2, 112, 'Customise 8 traits and watch your character update!', {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#aaaacc',
      })
      .setOrigin(0.5);

    if (isMobile) {
      // Mobile: single column of all 8 traits
      const pad = 8;
      const rowWidth = W - pad * 2;

      TRAITS.forEach((trait, i) => {
        this._buildTraitRow(
          trait,
          i,
          pad,
          MOBILE_ROW_START_Y + i * MOBILE_ROW_HEIGHT,
          rowWidth
        );
      });
    } else {
      // Desktop: two columns of 4
      const rowStartY = 154;
      const rowHeight = 58;
      const colX = [20, 420]; // left / right column x

      TRAITS.forEach((trait, i) => {
        const col = i < 4 ? 0 : 1;
        const row = i % 4;
        const x = colX[col];
        const y = rowStartY + row * rowHeight;

        this._buildTraitRow(trait, i, x, y, 370);
      });
    }

    // Confirm / Start button
    const btnY = H - 44;
    const btn = this.add
      .text(W / 2, btnY, '▶  Start Game', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#5a3fa0',
        padding: { x: 24, y: 10 },
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#7a5fc0' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#5a3fa0' }));
    btn.on('pointerdown', () => this._onStartGame());
  }

  private _buildTraitRow(trait: Trait, traitIndex: number, x: number, y: number, rowWidth = 370): void {
    // Trait label
    this.add.text(x + 8, y + 8, trait.label, {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#ccccff',
      fontStyle: 'bold',
    });

    // Background pill
    this.add
      .rectangle(x + rowWidth / 2, y + 36, rowWidth, 30, 0x2a2a4a)
      .setOrigin(0.5);

    // Left arrow
    const leftArrow = this.add
      .text(x + 18, y + 36, '◀', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffdd44',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leftArrow.on('pointerover', () =>
      leftArrow.setStyle({ color: '#ffffff' })
    );
    leftArrow.on('pointerout', () =>
      leftArrow.setStyle({ color: '#ffdd44' })
    );
    leftArrow.on('pointerdown', () =>
      this._cycleOption(traitIndex, -1)
    );

    // Option label (will be updated)
    const optLabel = this.add
      .text(x + rowWidth / 2, y + 36, trait.options[0], {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Right arrow
    const rightArrow = this.add
      .text(x + rowWidth - 18, y + 36, '▶', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffdd44',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    rightArrow.on('pointerover', () =>
      rightArrow.setStyle({ color: '#ffffff' })
    );
    rightArrow.on('pointerout', () =>
      rightArrow.setStyle({ color: '#ffdd44' })
    );
    rightArrow.on('pointerdown', () =>
      this._cycleOption(traitIndex, 1)
    );

    this._optionLabels[traitIndex] = optLabel;

    // Color swatch (shown for color traits)
    if (
      trait.key === 'hairColor' ||
      trait.key === 'topColor' ||
      trait.key === 'eyeColor'
    ) {
      this._swatches[trait.key] = this.add.rectangle(
        x + rowWidth - 50,
        y + 36,
        16,
        16,
        this._swatchColor(trait, 0)
      );
    }
  }

  private _swatchColor(trait: Trait, idx: number): number {
    if (trait.key === 'hairColor') return HAIR_COLORS[trait.options[idx]] ?? 0xffffff;
    if (trait.key === 'topColor')  return TOP_COLORS[trait.options[idx]]  ?? 0xffffff;
    if (trait.key === 'eyeColor')  return EYE_COLORS[trait.options[idx]]  ?? 0xffffff;
    return 0xffffff;
  }

  // -------------------------------------------------------------------------
  // Option cycling
  // -------------------------------------------------------------------------
  private _cycleOption(traitIndex: number, direction: number): void {
    const trait = TRAITS[traitIndex];
    const len = trait.options.length;
    this._selections[trait.key] =
      (this._selections[trait.key] + direction + len) % len;

    const idx = this._selections[trait.key];
    this._optionLabels[traitIndex].setText(trait.options[idx]);

    if (this._swatches[trait.key]) {
      this._swatches[trait.key].setFillStyle(
        this._swatchColor(trait, idx)
      );
    }

    this._drawCharacter();
  }

  // -------------------------------------------------------------------------
  // Character drawing
  // -------------------------------------------------------------------------
  private _drawCharacter(): void {
    const g = this._characterGraphics;
    const ag = this._accessoryGraphics;
    g.clear();
    ag.clear();

    const sel = this._selections;

    const hairStyleOpt = TRAITS[0].options[sel['hairStyle']];
    const hairColor    = HAIR_COLORS[TRAITS[1].options[sel['hairColor']]];
    const skinColor    = SKIN_TONES[TRAITS[2].options[sel['skinTone']]];
    const eyeColor     = EYE_COLORS[TRAITS[3].options[sel['eyeColor']]];
    const topOpt       = TRAITS[4].options[sel['top']];
    const topColor     = TOP_COLORS[TRAITS[5].options[sel['topColor']]];
    const bottomOpt    = TRAITS[6].options[sel['bottom']];
    const bottomColor  = BOTTOM_COLORS[bottomOpt];
    const accessoryOpt = TRAITS[7].options[sel['accessory']];

    const W = this.scale.width;
    const H = this.scale.height;
    const isMobile = W < MOBILE_BREAKPOINT;

    const cx = isMobile ? W / 2 : 400;
    const mobileTrailsBottom = MOBILE_ROW_START_Y + TRAITS.length * MOBILE_ROW_HEIGHT;
    const baseY = isMobile
      ? Math.min(H - MOBILE_BTN_MARGIN, mobileTrailsBottom + MOBILE_CHAR_HEIGHT)
      : 480;

    // --- Shoes ---
    g.fillStyle(0x333333);
    g.fillEllipse(cx - 22, baseY, 30, 12);
    g.fillEllipse(cx + 22, baseY, 30, 12);

    // --- Legs / bottom ---
    g.fillStyle(bottomColor);
    if (bottomOpt === 'Shorts') {
      g.fillRect(cx - 24, baseY - 120, 22, 40);
      g.fillRect(cx + 2, baseY - 120, 22, 40);
    } else if (bottomOpt === 'Skirt') {
      g.fillTriangle(
        cx - 28, baseY - 120,
        cx + 28, baseY - 120,
        cx - 38, baseY - 5
      );
      g.fillTriangle(
        cx - 28, baseY - 120,
        cx + 28, baseY - 120,
        cx + 38, baseY - 5
      );
    } else {
      g.fillRect(cx - 24, baseY - 130, 22, 80);
      g.fillRect(cx + 2, baseY - 130, 22, 80);
    }

    // --- Torso / top ---
    g.fillStyle(topColor);
    if (topOpt === 'Dress') {
      g.fillRect(cx - 28, baseY - 200, 56, 120);
      g.fillTriangle(
        cx - 28, baseY - 80,
        cx + 28, baseY - 80,
        cx - 42, baseY - 5
      );
      g.fillTriangle(
        cx - 28, baseY - 80,
        cx + 28, baseY - 80,
        cx + 42, baseY - 5
      );
    } else {
      g.fillRect(cx - 28, baseY - 200, 56, 80);
    }

    // Hoodie / Jacket details
    if (topOpt === 'Hoodie') {
      g.fillStyle(Phaser.Display.Color.ValueToColor(topColor).darken(20).color);
      g.fillRect(cx - 4, baseY - 200, 8, 60);
    } else if (topOpt === 'Jacket') {
      g.fillStyle(Phaser.Display.Color.ValueToColor(topColor).darken(30).color);
      g.fillRect(cx - 28, baseY - 200, 10, 80);
      g.fillRect(cx + 18, baseY - 200, 10, 80);
    }

    // --- Arms ---
    g.fillStyle(topColor);
    g.fillRect(cx - 44, baseY - 195, 18, 60);
    g.fillRect(cx + 26, baseY - 195, 18, 60);

    // Skin on hands
    g.fillStyle(skinColor);
    g.fillEllipse(cx - 35, baseY - 135, 18, 20);
    g.fillEllipse(cx + 35, baseY - 135, 18, 20);

    // --- Neck ---
    g.fillStyle(skinColor);
    g.fillRect(cx - 10, baseY - 220, 20, 20);

    // --- Head ---
    g.fillStyle(skinColor);
    g.fillEllipse(cx, baseY - 265, 80, 90);

    // --- Eyes ---
    g.fillStyle(0xffffff);
    g.fillEllipse(cx - 18, baseY - 270, 20, 14);
    g.fillEllipse(cx + 18, baseY - 270, 20, 14);

    g.fillStyle(eyeColor);
    g.fillCircle(cx - 18, baseY - 270, 6);
    g.fillCircle(cx + 18, baseY - 270, 6);

    g.fillStyle(0x000000);
    g.fillCircle(cx - 18, baseY - 270, 3);
    g.fillCircle(cx + 18, baseY - 270, 3);

    // --- Mouth ---
    g.fillStyle(0xcc5555);
    g.fillEllipse(cx, baseY - 250, 22, 10);

    // --- Nose ---
    const noseDark = Phaser.Display.Color.ValueToColor(skinColor).darken(15).color;
    g.fillStyle(noseDark);
    g.fillTriangle(cx - 5, baseY - 258, cx + 5, baseY - 258, cx, baseY - 248);

    // --- Hair ---
    g.fillStyle(hairColor);
    this._drawHair(g, hairStyleOpt, cx, baseY, hairColor);

    // --- Accessories (drawn last / on top) ---
    if (accessoryOpt === 'Hat' || accessoryOpt === 'Hat + Glasses') {
      ag.fillStyle(0x5a3a1a);
      ag.fillEllipse(cx, baseY - 310, 96, 18);
      ag.fillRect(cx - 36, baseY - 350, 72, 42);
      ag.fillStyle(0x331a00);
      ag.fillRect(cx - 36, baseY - 318, 72, 8);
    }

    if (accessoryOpt === 'Glasses' || accessoryOpt === 'Hat + Glasses') {
      ag.lineStyle(3, 0x333333);
      ag.strokeCircle(cx - 18, baseY - 270, 11);
      ag.strokeCircle(cx + 18, baseY - 270, 11);
      ag.beginPath();
      ag.moveTo(cx - 7, baseY - 270);
      ag.lineTo(cx + 7, baseY - 270);
      ag.strokePath();
      ag.beginPath();
      ag.moveTo(cx - 29, baseY - 270);
      ag.lineTo(cx - 42, baseY - 268);
      ag.strokePath();
      ag.beginPath();
      ag.moveTo(cx + 29, baseY - 270);
      ag.lineTo(cx + 42, baseY - 268);
      ag.strokePath();
    }
  }

  _drawHair(g: Phaser.GameObjects.Graphics, style: string, cx: number, baseY: number, color: number): void {
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

  // -------------------------------------------------------------------------
  // Start button handler
  // -------------------------------------------------------------------------
  private _onStartGame(): void {
    const name =
      ((this._nameInput?.node as HTMLInputElement | undefined)?.value ?? '').trim() ||
      localStorage.getItem('kid-game-player-name') ||
      'Player';
    localStorage.setItem('kid-game-player-name', name);
    this.scene.start('LivingRoomScene', { ...this._selections, playerName: name });
  }
}
