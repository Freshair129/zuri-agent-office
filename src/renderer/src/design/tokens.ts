// Design tokens — single source of truth. Mirrors tokens.css for non-styled consumers (Pixi).
// Any change here must also update tokens.css.

export const colors = {
  cream: {
    50: 0xffffff,
    100: 0xf7f8fa,
    200: 0xeff1f3,
    300: 0xe5e7eb
  },
  paper: {
    100: 0xffffff,
    200: 0xeff1f3
  },
  ink: {
    900: 0x1f2937,
    700: 0x374151,
    500: 0x6b7280,
    300: 0x8a929f,
    100: 0xe5e7eb
  },
  // Zuri Heritage palette (mirrors tokens.css).
  accent: {
    coral: 0xc84b4b,
    coralLight: 0xfce7e7,
    mint: 0x238553,
    mintLight: 0xdef3e7,
    sky: 0x3d7a9e,
    skyLight: 0xd6ecfa,
    lemon: 0xe8820c,
    lemonLight: 0xfde8d0,
    lilac: 0xc6a052,
    lilacLight: 0xf5ecd7,
    peach: 0xb7791f,
    peachLight: 0xfde8d0
  },
  status: {
    idle: 0x6b7280,
    thinking: 0x3d7a9e,
    working: 0xe8820c,
    blocked: 0xc84b4b,
    success: 0x238553,
    ghost: 0xd1d5db
  },
  world: {
    grassLight: 0xd4eab0,
    grassDark: 0xb5d589,
    woodLight: 0xe5c896,
    woodDark: 0xc9a66b,
    path: 0xe8d8b0,
    wall: 0x8b6f47
  }
} as const;

export const space = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64
} as const;

/** CSS token counterparts for Motion consumers; durations are milliseconds. */
export const motionTokens = {
  press: 80, hover: 120, selection: 180, content: 180, enter: 240, exit: 180,
  ease: [0.2, 0.8, 0.2, 1] as const,
  dialogDistance: 8, contentDistance: 4, pressScale: 0.98
} as const;

export const glassTokens = {
  light: { surface: 'rgba(255, 255, 255, 0.88)', fallback: '#FFFFFF', border: 'rgba(107, 114, 128, 0.24)', textMuted: '#515A67', shadow: '0 8px 28px rgba(31, 41, 55, 0.12)' },
  dark: { surface: 'rgba(26, 26, 31, 0.90)', fallback: '#1A1A1F', border: 'rgba(179, 176, 172, 0.24)', textMuted: '#B3B0AC', shadow: '0 8px 28px rgba(0, 0, 0, 0.28)' },
  blurShell: 12, blurDialog: 16, saturation: 1.1
} as const;

export const radius = { control: 8, card: 12, dialog: 16 } as const;

export const type = {
  display: '"Segoe UI", "Leelawadee UI", Tahoma, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Geeza Pro", "Noto Naskh Arabic", "Segoe UI Historic", monospace',
  ui: '"Segoe UI", "Leelawadee UI", Tahoma, "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Geeza Pro", "Noto Naskh Arabic", "Segoe UI Historic", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, "PingFang SC", "Microsoft YaHei", "Noto Sans Mono CJK SC", "Noto Sans CJK SC", "Geeza Pro", "Noto Naskh Arabic", "Segoe UI Historic", monospace'
} as const;

export const tileSize = 32; // px — the world is built from 32×32 tiles

export type AccentColorName =
  | 'coral' | 'mint' | 'sky' | 'lemon' | 'lilac' | 'peach';

export const accentByName: Record<AccentColorName, number> = {
  coral: colors.accent.coral,
  mint:  colors.accent.mint,
  sky:   colors.accent.sky,
  lemon: colors.accent.lemon,
  lilac: colors.accent.lilac,
  peach: colors.accent.peach
};

export const accentLightByName: Record<AccentColorName, number> = {
  coral: colors.accent.coralLight,
  mint:  colors.accent.mintLight,
  sky:   colors.accent.skyLight,
  lemon: colors.accent.lemonLight,
  lilac: colors.accent.lilacLight,
  peach: colors.accent.peachLight
};

// Convert 0xRRGGBB to "#RRGGBB"
export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0').toUpperCase();
}
