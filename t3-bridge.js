// T3 Code × Obsidian Prism Full Optical Suite Bridge v2.0 (t3-bridge.js)
// Directly mounts unmodified Obsidian Prism engines onto T3 Code:
//   1. ripple-core.js + home-ripple-host.js (300Hz WebGL2 ASCII Matrix + Horizon Glow)
//   2. dual-mascot-rig.js (Clawd, Purple Cat, Mini Crabs, Dragon, Whale physics stage)
//   3. prism-rim-canvas.js (GPU Canvas pointer-proximity prism border rim)
//   4. smooth-caret.js (FastDOM zero-reflow glowing smooth caret)
// Plus native T3 Code adaptations:
//   - CSS.highlights 5-tier ink stream fade-in
//   - Smoked Obsidian composer buttons (pill model button, specular send orb, orbiting conic stop ring)
//   - 4 Palettes (Obsidian / Warm / Crystal / Alabaster) + 5 Accent Tones + Alt+P Optical Settings Panel
(function (root) {
  'use strict';
  const G = root || (typeof globalThis !== 'undefined' ? globalThis : window);
  const D = G.document;
  if (!D) return;

  // Idempotent teardown if re-injected
  try {
    G.__t3ObsidianPrism?.dispose?.();
  } catch {}

  const STYLE_ID = 't3-op-runtime-style';
  const PANEL_ID = 't3-op-settings-panel';
  const FAB_ID = 't3-op-settings-fab';
  const STAGE_ATTR = 'data-t3-op-stage';
  const ANCHOR_ATTR = 'data-ag-cs-crab-anchor';
  const CFG_KEY = 't3_obsidian_prism_cfg_v2';

  const DEFAULT_CFG = {
    preset: 'obsidian', // 'obsidian' | 'warm' | 'crystal' | 'alabaster'
    accent: 'follow',   // 'follow' | 'cobalt' | 'iris' | 'amber' | 'mono'
    mascot: 'crab',     // 'crab' | 'minis' | 'quad' | 'quad-minis' | 'off'
    ambient: 1,         // 0 | 0.35 | 0.7 | 1
    smoothCaret: true,
    inkStream: true,
    prismRim: true,
    effortSlider: true,
  };

  const PRESETS = {
    obsidian: {
      label: '深空黑曜',
      dark: true,
      palette: 'obsidian',
      lightPreset: 'crystal',
      bg: '#0B0B0E',
      sidebar: '#09090B',
      header: 'rgba(9, 10, 14, 0.72)',
      composerBg: 'rgba(16, 18, 24, 0.78)',
      composerFocusBg: 'rgba(18, 20, 27, 0.86)',
      bubbleBg: 'rgba(19, 20, 26, 0.84)',
      codeBg: 'rgba(13, 15, 20, 0.88)',
      fg: '#F2F2F5',
      muted: '#8A8A98',
      accent: '#669DF6',
      border: 'rgba(218, 228, 255, 0.085)',
      cardBorder: 'rgba(218, 228, 255, 0.115)',
      specular: 'rgba(255, 255, 255, 0.11)',
      pillBg: 'rgba(28, 29, 38, 0.78)',
      rippleInk: '#92949C',
      rippleWave: '#D6DAE4',
      sheen: 'linear-gradient(172deg, rgba(255,255,255,0.055) 0%, rgba(140,175,255,0.022) 38%, rgba(8,10,16,0.28) 100%)',
      orbitConic: 'conic-gradient(#4285F4 0deg, #9B72CB 95deg, #EA4335 185deg, #FBBC04 275deg, #34A853 325deg, #4285F4 360deg)',
    },
    warm: {
      label: '暖炭玄岩',
      dark: true,
      palette: 'warm',
      lightPreset: 'alabaster',
      bg: '#141413',
      sidebar: '#10100F',
      header: 'rgba(16, 16, 15, 0.76)',
      composerBg: 'rgba(26, 25, 23, 0.82)',
      composerFocusBg: 'rgba(30, 28, 26, 0.88)',
      bubbleBg: 'rgba(29, 27, 24, 0.86)',
      codeBg: 'rgba(16, 15, 13, 0.88)',
      fg: '#F2EFE9',
      muted: '#A39E93',
      accent: '#D97757',
      border: 'rgba(245, 240, 230, 0.082)',
      cardBorder: 'rgba(245, 240, 230, 0.12)',
      specular: 'rgba(255, 248, 236, 0.10)',
      pillBg: 'rgba(38, 35, 31, 0.80)',
      rippleInk: '#B4AEA2',
      rippleWave: '#D97757',
      sheen: 'linear-gradient(172deg, rgba(255,248,236,0.048) 0%, rgba(217,119,87,0.02) 38%, rgba(16,15,13,0.26) 100%)',
      orbitConic: 'conic-gradient(#8C3F27 0deg, #D97757 150deg, #F0A37E 240deg, #F6BD60 315deg, #FFF3EA 348deg, #8C3F27 360deg)',
    },
    crystal: {
      label: '白昼冷晶',
      dark: false,
      palette: 'obsidian',
      lightPreset: 'crystal',
      bg: '#F4F7FB',
      sidebar: '#E8EEF6',
      header: 'rgba(244, 247, 251, 0.84)',
      composerBg: 'rgba(255, 255, 255, 0.88)',
      composerFocusBg: 'rgba(255, 255, 255, 0.96)',
      bubbleBg: 'rgba(234, 241, 251, 0.90)',
      codeBg: 'rgba(236, 241, 249, 0.92)',
      fg: '#0F172A',
      muted: '#5B6B82',
      accent: '#2563EB',
      border: 'rgba(15, 23, 42, 0.10)',
      cardBorder: 'rgba(15, 23, 42, 0.14)',
      specular: 'rgba(255, 255, 255, 0.94)',
      pillBg: 'rgba(238, 243, 250, 0.92)',
      rippleInk: '#556682',
      rippleWave: '#2563EB',
      sheen: 'linear-gradient(176deg, rgba(255,255,255,0.96) 0%, rgba(241,246,255,0.55) 100%)',
      orbitConic: 'conic-gradient(#2563EB 0deg, #7C3AED 108deg, #EA4335 212deg, #D97706 304deg, #2563EB 360deg)',
    },
    alabaster: {
      label: '暖白画册',
      dark: false,
      palette: 'warm',
      lightPreset: 'alabaster',
      bg: '#F6F4EE',
      sidebar: '#EBE6DC',
      header: 'rgba(246, 244, 238, 0.86)',
      composerBg: 'rgba(255, 255, 255, 0.90)',
      composerFocusBg: 'rgba(255, 255, 255, 0.97)',
      bubbleBg: 'rgba(239, 236, 226, 0.92)',
      codeBg: 'rgba(241, 238, 230, 0.92)',
      fg: '#1C1814',
      muted: '#6B6257',
      accent: '#C25934',
      border: 'rgba(42, 32, 20, 0.10)',
      cardBorder: 'rgba(42, 32, 20, 0.145)',
      specular: 'rgba(255, 255, 255, 0.94)',
      pillBg: 'rgba(242, 239, 231, 0.92)',
      rippleInk: '#665C4E',
      rippleWave: '#C25934',
      sheen: 'linear-gradient(176deg, rgba(255,255,255,0.97) 0%, rgba(250,246,238,0.58) 100%)',
      orbitConic: 'conic-gradient(#C25934 0deg, #EA580C 120deg, #D97706 245deg, #9A3412 325deg, #C25934 360deg)',
    },
  };

  const ACCENT_OVERRIDES = {
    follow: null,
    cobalt: { dark: '#4F8BFF', light: '#2563EB' },
    iris: { dark: '#A58AF8', light: '#7C3AED' },
    amber: { dark: '#F2B84B', light: '#D97706' },
    mono: { dark: '#D4DCE8', light: '#334155' },
  };

  let cfg = { ...DEFAULT_CFG };
  try {
    const raw = G.localStorage?.getItem?.(CFG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (PRESETS[parsed.preset]) cfg.preset = parsed.preset;
        if (parsed.accent in ACCENT_OVERRIDES) cfg.accent = parsed.accent;
        if (/^(crab|minis|quad|quad-minis|off|r:[ckdw0-4,+m]+)$/.test(String(parsed.mascot || ''))) cfg.mascot = parsed.mascot;
        if ([0, 0.35, 0.7, 1].includes(Number(parsed.ambient))) cfg.ambient = Number(parsed.ambient);
        if (typeof parsed.smoothCaret === 'boolean') cfg.smoothCaret = parsed.smoothCaret;
        if (typeof parsed.inkStream === 'boolean') cfg.inkStream = parsed.inkStream;
        if (typeof parsed.prismRim === 'boolean') cfg.prismRim = parsed.prismRim;
        if (typeof parsed.effortSlider === 'boolean') cfg.effortSlider = parsed.effortSlider;
      }
    }
  } catch {}

  const saveCfg = () => {
    try { G.localStorage?.setItem?.(CFG_KEY, JSON.stringify(cfg)); } catch {}
  };

  const getPreset = () => PRESETS[cfg.preset] || PRESETS.obsidian;
  const getAccentColor = () => {
    const p = getPreset();
    const ov = ACCENT_OVERRIDES[cfg.accent];
    return ov ? (p.dark ? ov.dark : ov.light) : p.accent;
  };

  const buildRuntimeCss = () => {
    const p = getPreset();
    const acc = getAccentColor();
    const isDark = p.dark;
    const shadowComposer = isDark
      ? '0 2px 6px rgba(0,0,0,0.44), 0 12px 32px -8px rgba(0,0,0,0.56), 0 24px 54px -16px rgba(10,18,42,0.65)'
      : '0 1px 3px rgba(15,23,42,0.06), 0 10px 28px -6px rgba(30,58,138,0.10), 0 0 0 1px rgba(15,23,42,0.06)';
    const sendBg = isDark ? '#F2F3F7' : '#0F172A';
    const sendFg = isDark ? '#0E0F14' : '#F8FAFC';
    const stopCore = isDark
      ? 'radial-gradient(120% 120% at 50% 0%, #1C1E28 0%, #101117 100%)'
      : 'radial-gradient(120% 120% at 50% 0%, #FFFFFF 0%, #EEF3FA 100%)';

    return `
/* Suppress static CSS fallback mascots once real physics engine is live */
html[data-t3-op-active="1"] [data-slot="composer-host"]::before,
html[data-t3-op-active="1"] [data-slot="composer-host"]::after {
  content: none !important;
  display: none !important;
}

html[data-t3-op-active="1"] {
  --ag-ambient-mul: ${cfg.ambient};
  --ag-accent-prism-mul: ${cfg.prismRim ? 1 : 0};
  --ag-prism-strength: ${cfg.prismRim ? cfg.ambient : 0};
  --_lm: 1;
  --ag-cs-accent: ${acc};
  --ag-cs-ripple-ink: ${p.rippleInk};
  --ag-cs-ripple-wave: ${cfg.accent === 'follow' ? p.rippleWave : acc};
  --ag-cs-specular: ${p.specular};
  --ag-cs-border-1: ${p.border};
  --ag-cs-border-2: ${p.cardBorder};
  --ag-cs-pill-bg: ${p.pillBg};
  --ag-ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
  color-scheme: ${isDark ? 'dark' : 'light'};
}

/* Sidebar & Main Surface Palette Sync */
html[data-t3-op-active="1"] [data-slot="sidebar"],
html[data-t3-op-active="1"] [data-slot="sidebar-inner"] {
  background-color: ${p.sidebar} !important;
  border-color: ${p.border} !important;
  color: ${p.fg} !important;
}

html[data-t3-op-active="1"] [data-chat-header] {
  background-color: ${p.header} !important;
  backdrop-filter: blur(10px) !important;
  border-bottom: 1px solid ${p.border} !important;
}

/* Official WebGL2 ASCII Matrix + Horizon Glow Backdrop */
html[data-t3-op-active="1"] [data-workspace-area="conversation"].agy-home {
  position: relative !important;
  isolation: isolate !important;
  background-color: ${p.bg} !important;
  background-image: none !important;
  color: ${p.fg} !important;
}

html[data-t3-op-active="1"] [data-workspace-area="conversation"].agy-home > :not(.ag-cs-ripple-host) {
  position: relative !important;
  z-index: 1 !important;
  background-color: transparent !important;
  background-image: none !important;
}

html[data-t3-op-active="1"] [data-workspace-area="conversation"].agy-home .messages-timeline-scroll {
  background-color: transparent !important;
  background-image: none !important;
}

html[data-t3-op-active="1"] .ag-cs-ripple-host {
  position: absolute !important;
  inset: 0 !important;
  z-index: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}

html[data-t3-op-active="1"] .ag-cs-brand-glow {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  pointer-events: none !important;
  z-index: 0 !important;
}

html[data-t3-op-active="1"] .ag-cs-ripple-canvas {
  position: relative !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
  z-index: 1 !important;
}

/* Optical Smoked Obsidian Composer Card */
html[data-t3-op-active="1"] [data-chat-composer-form] {
  overflow: visible !important;
  background: transparent !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"][data-ag-cs-crab-anchor="composer"] {
  position: relative !important;
  overflow: visible !important;
  border-radius: 14px !important;
  background-color: ${p.composerBg} !important;
  background-image: ${p.sheen} !important;
  backdrop-filter: blur(12px) saturate(1.15) !important;
  -webkit-backdrop-filter: blur(12px) saturate(1.15) !important;
  border: 1px solid ${p.cardBorder} !important;
  box-shadow: inset 0 1px 0 ${p.specular}, ${shadowComposer} !important;
  transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"][data-ag-cs-crab-anchor="composer"]:focus-within {
  border-color: color-mix(in srgb, ${acc} 44%, ${p.cardBorder}) !important;
  background-color: ${p.composerFocusBg} !important;
  box-shadow:
    inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.98)'},
    0 0 0 1px color-mix(in srgb, ${acc} 22%, transparent),
    ${shadowComposer} !important;
}

/* Composer Pill Model Selector (1:1 Obsidian Prism Style) */
html[data-t3-op-active="1"] [data-slot="composer-host"] button[data-slot="popover-trigger"] {
  height: 28px !important;
  padding: 0 11px !important;
  border-radius: 999px !important;
  background: ${p.pillBg} !important;
  border: 1px solid ${p.cardBorder} !important;
  box-shadow: inset 0 1px 0 ${p.specular} !important;
  transition: background-color 130ms ease, border-color 130ms ease, transform 120ms var(--ag-ease-spring) !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[data-slot="popover-trigger"]:hover {
  border-color: color-mix(in srgb, ${acc} 42%, ${p.cardBorder}) !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[data-slot="popover-trigger"]:active {
  transform: scale(0.96) !important;
}

/* Specular Send Orb Button */
html[data-t3-op-active="1"] [data-slot="composer-host"] button[type="submit"]:not(:disabled),
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="发送"]:not(:disabled),
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Send"]:not(:disabled) {
  border-radius: 999px !important;
  background-color: ${sendBg} !important;
  background-image: linear-gradient(rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 58%) !important;
  color: ${sendFg} !important;
  box-shadow: inset 0 1px 0 #FFF, 0 2px 8px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.14) !important;
  transition: transform 140ms var(--ag-ease-spring), box-shadow 160ms ease !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[type="submit"]:not(:disabled):hover {
  transform: translateY(-1px) !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[type="submit"]:not(:disabled):active {
  transform: scale(0.92) !important;
}

/* Orbiting Conic Rainbow Stop Button (1:1 port of style.css L442) */
@keyframes ag-cs-orbit-spin {
  to { transform: rotate(360deg); }
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label="停止生成"],
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Stop"],
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Interrupt"] {
  position: relative !important;
  overflow: hidden !important;
  border-radius: 999px !important;
  background-color: ${isDark ? '#121319' : '#FFFFFF'} !important;
  background-image: none !important;
  box-shadow: 0 0 12px -2px color-mix(in srgb, ${acc} 48%, transparent), 0 2px 6px rgba(0,0,0,0.42) !important;
  border: 0 !important;
  transition: transform 140ms var(--ag-ease-spring) !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label="停止生成"]::before,
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Stop"]::before,
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Interrupt"]::before {
  content: "" !important;
  position: absolute !important;
  inset: -42% !important;
  background: ${p.orbitConic} !important;
  will-change: transform !important;
  animation: ag-cs-orbit-spin 1.9s linear infinite !important;
  pointer-events: none !important;
  z-index: 0 !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label="停止生成"]::after,
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Stop"]::after,
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Interrupt"]::after {
  content: "" !important;
  position: absolute !important;
  inset: 2px !important;
  border-radius: 999px !important;
  background: ${stopCore} !important;
  pointer-events: none !important;
  z-index: 1 !important;
}

html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label="停止生成"] > *,
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Stop"] > *,
html[data-t3-op-active="1"] [data-slot="composer-host"] button[aria-label*="Interrupt"] > * {
  position: relative !important;
  z-index: 2 !important;
  color: ${isDark ? '#F4F5F8' : '#0F172A'} !important;
  filter: drop-shadow(0 0 5px rgba(255,255,255,0.35));
}

/* Smoked Glass User Bubble & Code Blocks */
html[data-t3-op-active="1"] [data-user-message-bubble] {
  background-color: ${p.bubbleBg} !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid ${p.border} !important;
  color: ${p.fg} !important;
  box-shadow: inset 0 1px 0 ${p.specular}, 0 8px 24px -10px rgba(0, 0, 0, ${isDark ? 0.52 : 0.14}) !important;
}

html[data-t3-op-active="1"] .chat-markdown-codeblock {
  background-color: ${p.codeBg} !important;
  backdrop-filter: blur(6px) !important;
  border: 1px solid ${p.border} !important;
  box-shadow: inset 0 1px 0 ${p.specular} !important;
}

html[data-t3-op-active="1"] .chat-markdown blockquote {
  border-left: 2px solid color-mix(in srgb, ${acc} 48%, transparent) !important;
  background: linear-gradient(90deg, color-mix(in srgb, ${acc} 8%, transparent) 0%, transparent 72%) !important;
}

/* Give breathing room at bottom of chat timeline for mascots */
html[data-t3-op-active="1"][data-ag-cs-has-crab="1"] .messages-timeline-scroll {
  padding-bottom: 56px !important;
}

/* Official Smooth Caret Styles (1:1 port from style.css L328, L330, L663-674) */
html[data-t3-op-active="1"] [data-ag-cs-caret-host="1"] {
  position: relative !important;
}

html[data-t3-op-active="1"] [contenteditable="true"][data-ag-cs-smooth-caret="1"] {
  caret-color: transparent !important;
}

@keyframes ag-cs-caret-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ag-cs-smooth-caret {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 20px;
  border-radius: 1px;
  background: ${acc};
  box-shadow: 0 0 6px color-mix(in srgb, ${acc} 58%, transparent);
  pointer-events: none;
  z-index: 18;
  opacity: 0;
  visibility: hidden;
  transition: transform 55ms cubic-bezier(.22, 1, .36, 1), opacity 70ms ease;
}

.ag-cs-smooth-caret[data-ag-cs-caret-visible="1"] {
  opacity: 1;
  visibility: visible;
  will-change: transform;
  animation: ag-cs-caret-blink 1.05s step-end infinite;
}

.ag-cs-smooth-caret[data-ag-cs-caret-visible="1"][data-ag-cs-caret-typing="1"] {
  animation: none;
  opacity: 1;
}

/* Official 5-Tier CSS.highlights Ink Stream Fade (1:1 port of style.css L750-754) */
:root::highlight(t3-op-stream-f0) { color: color-mix(in srgb, ${p.fg} 18%, transparent); }
:root::highlight(t3-op-stream-f1) { color: color-mix(in srgb, ${p.fg} 42%, transparent); }
:root::highlight(t3-op-stream-f2) { color: color-mix(in srgb, ${p.fg} 66%, transparent); }
:root::highlight(t3-op-stream-f3) { color: color-mix(in srgb, ${p.fg} 85%, transparent); }
:root::highlight(t3-op-stream-f4) { color: color-mix(in srgb, ${p.fg} 94%, transparent); }

/* Official Dual Mascot Stage (1:1 port from style.css L527-533) */
.ag-cs-crab.ag-cs-dual-stage {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  width: auto !important;
  bottom: calc(100% - 9px) !important;
  height: 84px !important;
  z-index: 30 !important;
  visibility: visible !important;
  pointer-events: none !important;
  user-select: none !important;
  overflow: visible !important;
}

.ag-cs-crab.ag-cs-dual-stage .ag-v2-mascot-actor {
  position: absolute !important;
  left: 0;
  bottom: 0;
  width: 96px;
  height: 84px;
  pointer-events: auto !important;
  cursor: grab !important;
  touch-action: none !important;
  transition: transform 220ms cubic-bezier(.22, 1, .36, 1);
  outline: none !important;
}

.ag-cs-crab.ag-cs-dual-stage .ag-v2-mascot-actor::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 5px;
  width: 44px;
  height: 8px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, ${isDark ? 0.42 : 0.20}) 0%, rgba(0, 0, 0, ${isDark ? 0.16 : 0.07}) 58%, transparent);
  pointer-events: none;
  z-index: 0;
}

.ag-cs-crab.ag-cs-dual-stage .ag-v2-mascot-actor:active,
.ag-cs-crab.ag-cs-dual-stage .ag-v2-mascot-actor[data-direct="1"] {
  transition: none !important;
  will-change: transform;
}

.ag-cs-crab.ag-cs-dual-stage .ag-v2-mascot-actor:active,
.ag-cs-crab.ag-cs-dual-stage .ag-v2-mascot-actor[data-dragging="1"] {
  cursor: grabbing !important;
}

.ag-cs-crab.ag-cs-dual-stage .ag-v2-mascot-canvas {
  position: relative;
  z-index: 1;
  width: 96px;
  height: 84px;
  display: block;
  image-rendering: pixelated;
  pointer-events: none;
}

.ag-cs-crab.ag-cs-dual-stage .ag-v2-mini-pile {
  position: absolute;
  left: 12px;
  bottom: 7px;
  height: 32px;
  display: none;
  align-items: flex-end;
  pointer-events: none;
  z-index: 20;
}

.ag-cs-crab.ag-cs-dual-stage .ag-v2-mini-crab-canvas {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 32px;
  image-rendering: pixelated;
  pointer-events: none;
  transition: transform 160ms steps(2, end);
}

/* Official GPU Prism Rim Overlay */
[data-slot="composer-host"] > .ag-cs-prism-rim-cv {
  position: absolute !important;
  inset: -1px !important;
  width: calc(100% + 2px) !important;
  height: calc(100% + 2px) !important;
  box-sizing: border-box !important;
  border-radius: inherit !important;
  pointer-events: none !important;
  z-index: 7 !important;
  opacity: calc(var(--ag-prism-strength, 1) * var(--_lm, 1));
  transition: opacity 220ms ease;
}

/* Obsidian Prism Quick Settings Trigger & Popover */
#${FAB_ID} {
  position: fixed;
  left: 112px;
  bottom: 10px;
  z-index: 80;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid ${p.cardBorder};
  background: ${p.pillBg};
  color: ${acc};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: inset 0 1px 0 ${p.specular}, 0 2px 8px rgba(0,0,0,0.32);
  transition: transform 130ms var(--ag-ease-spring), border-color 140ms ease, background-color 140ms ease;
  font-size: 12px;
  line-height: 1;
  padding: 0;
}

#${FAB_ID}:hover {
  transform: translateY(-1px) scale(1.06);
  border-color: ${acc};
}

#${PANEL_ID} {
  position: fixed;
  left: 16px;
  bottom: 44px;
  z-index: 95;
  width: 318px;
  padding: 14px;
  border-radius: 14px;
  background: ${isDark ? 'rgba(15, 16, 22, 0.94)' : 'rgba(255, 255, 255, 0.96)'};
  background-image: ${p.sheen};
  backdrop-filter: blur(18px) saturate(1.2);
  border: 1px solid ${p.cardBorder};
  box-shadow: inset 0 1px 0 ${p.specular}, 0 20px 52px -12px rgba(0,0,0,0.68);
  color: ${p.fg};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei UI", sans-serif;
  font-size: 12px;
  user-select: none;
  display: none;
}

#${PANEL_ID}[data-open="1"] { display: block; }

#${PANEL_ID} .op-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${p.border};
}

#${PANEL_ID} .op-title {
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

#${PANEL_ID} .op-sub {
  font-size: 10.5px;
  color: ${p.muted};
}

#${PANEL_ID} .op-sec {
  margin-bottom: 10px;
}

#${PANEL_ID} .op-lbl {
  font-size: 11px;
  color: ${p.muted};
  margin-bottom: 6px;
  font-weight: 500;
}

#${PANEL_ID} .op-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

#${PANEL_ID} .op-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

#${PANEL_ID} .op-chip {
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid ${p.border};
  background: ${isDark ? 'rgba(255,255,255,0.035)' : 'rgba(15,23,42,0.04)'};
  color: ${p.fg};
  font-size: 11.5px;
  cursor: pointer;
  transition: all 120ms ease;
  text-align: center;
}

#${PANEL_ID} .op-chip:hover {
  border-color: color-mix(in srgb, ${acc} 50%, ${p.cardBorder});
}

#${PANEL_ID} .op-chip[data-active="1"] {
  border-color: ${acc};
  background: color-mix(in srgb, ${acc} 18%, transparent);
  box-shadow: inset 0 1px 0 ${p.specular};
  font-weight: 600;
}

#${PANEL_ID} .op-toggles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid ${p.border};
}

#${PANEL_ID} .op-tgl {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 3px 2px;
}

#${PANEL_ID} .op-tgl input {
  accent-color: ${acc};
  cursor: pointer;
}

/* Official Effort Starfield Slider & Orchestrator Crystal Bar inside T3 Code Model Popover */
html[data-t3-op-active="1"] [data-t3-op-hidden-radio="1"] {
  display: none !important;
}

.t3-op-effort-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 2px 10px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  user-select: none;
}

.t3-op-effort-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.2;
  min-width: 0;
}

.t3-op-effort-title {
  color: ${p.muted};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.t3-op-effort-val {
  color: ${acc};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.t3-op-effort-slot {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: 30px;
  box-sizing: border-box;
}

.t3-op-effort-slot .ces-root,
.t3-op-effort-slot .ces-track {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.t3-op-effort-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  font-size: 10px;
  color: ${p.muted};
  padding: 0 1px;
  min-width: 0;
}

.t3-op-effort-labels span[data-active="1"] {
  color: ${p.fg};
  font-weight: 600;
}

.t3-op-crystal-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  pointer-events: none;
  z-index: 4;
}
`;
  };

  let destroyed = false;
  let stageEl = null;
  let rig = null;
  let anchorEl = null;
  let convEl = null;
  let rimCtl = null;
  let rippleCtl = null;
  let caretCtl = null;
  let mo = null;
  let syncTimer = 0;
  let statePollTimer = 0;
  let lastCamp = 'gemini';
  let isStreamingNow = false;
  let panelOpen = false;

  // ── Official Effort Starfield Slider & Orchestrator Crystal Adapter ───
  const EFFORT_PATTERNS = [
    { key: 'off', re: /^(off|none|关闭|关)$/i },
    { key: 'minimal', re: /^(minimal|min|极低|最低|极简)$/i },
    { key: 'low', re: /^(low|低)$/i },
    { key: 'medium', re: /^(medium|med|中|中等)$/i },
    { key: 'high', re: /^(high|高)$/i },
    { key: 'xhigh', re: /^(extra|extra\s*high|xhigh|超高|极高)$/i },
    { key: 'max', re: /^(max|最高|极限)$/i },
  ];

  const parseEffortRadioKey = (text) => {
    const t = String(text || '').trim();
    for (const p of EFFORT_PATTERNS) {
      if (p.re.test(t)) return p.key;
    }
    return null;
  };

  // Motion-unblocked window proxy so Windows "reduced motion" never strips starfield particles
  const motionUnblockedWin = new Proxy(G, {
    get(target, prop) {
      if (prop === 'matchMedia') {
        return (q) => {
          if (String(q || '').includes('prefers-reduced-motion')) {
            return { matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {} };
          }
          return target.matchMedia ? target.matchMedia(q) : { matches: false };
        };
      }
      const val = target[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });

  let effortMount = null; // { popup, parent, section, slot, valEl, labelsEl, sliderApi, crystalApi, crystalRaf, sig, radios }

  const unmountEffortSlider = () => {
    if (!effortMount) return;
    const em = effortMount;
    effortMount = null;
    if (em.crystalRaf) { G.cancelAnimationFrame?.(em.crystalRaf); em.crystalRaf = 0; }
    try { em.crystalApi?.dispose?.(); } catch {}
    try { em.sliderApi?.unmount?.(); } catch {}
    try { em.section?.remove?.(); } catch {}
    if (em.radios) {
      for (const b of em.radios) {
        try { b.removeAttribute('data-t3-op-hidden-radio'); } catch {}
      }
    }
  };

  const detectActiveModelInPopup = (popup) => {
    try {
      const trigger = D.querySelector('[data-slot="composer-host"] button[data-slot="popover-trigger"]');
      const aria = trigger?.getAttribute('aria-label') || trigger?.textContent || '';
      const selectedOpt = popup?.querySelector?.('[role="option"][aria-selected="true"], [role="option"][data-selected="true"]');
      return (selectedOpt?.textContent || aria || '').trim();
    } catch {
      return '';
    }
  };

  const syncEffortSlider = () => {
    if (destroyed || !cfg.effortSlider) {
      unmountEffortSlider();
      return;
    }
    const sliderLib = G.AntigravityCodexEffortSlider;
    if (!sliderLib || typeof sliderLib.mountCodexEffortSlider !== 'function') return;

    // Locate open T3 Code model selector popup containing effort radio buttons
    const popups = D.querySelectorAll('[data-slot="popover-popup"]');
    let targetPopup = null;
    let matchedRadios = [];
    for (const pop of popups) {
      const radios = Array.from(pop.querySelectorAll('button[role="radio"]'));
      const effRadios = radios.filter((b) => parseEffortRadioKey(b.textContent) !== null);
      if (effRadios.length >= 2) {
        targetPopup = pop;
        matchedRadios = effRadios;
        break;
      }
    }

    if (!targetPopup || matchedRadios.length < 2) {
      unmountEffortSlider();
      return;
    }

    const parent = matchedRadios[0].parentElement;
    if (!parent) return;

    const modelName = detectActiveModelInPopup(targetPopup);
    const isOrch = /orchestrator/i.test(modelName);
    const items = matchedRadios.map((btn) => ({
      btn,
      key: parseEffortRadioKey(btn.textContent),
      label: String(btn.textContent || '').trim(),
      checked: btn.getAttribute('aria-checked') === 'true',
    }));
    const activeIdx = Math.max(0, items.findIndex((x) => x.checked));
    const sig = `${items.map((x) => x.key).join(',')}|${modelName}|${cfg.preset}|${cfg.accent}`;

    const updateHeaderLabels = (em, idx) => {
      if (!em) return;
      const cur = items[idx] || items[0];
      if (em.valEl && cur) em.valEl.textContent = cur.label;
      if (em.labelsEl) {
        const spans = em.labelsEl.querySelectorAll('span');
        spans.forEach((sp, i) => sp.setAttribute('data-active', i === idx ? '1' : '0'));
      }
    };

    // Hide native radio buttons without removing them from React tree
    for (const b of matchedRadios) {
      if (b.getAttribute('data-t3-op-hidden-radio') !== '1') b.setAttribute('data-t3-op-hidden-radio', '1');
    }

    if (effortMount && effortMount.popup === targetPopup && effortMount.parent === parent && effortMount.section.isConnected && effortMount.sig === sig) {
      effortMount.radios = matchedRadios;
      effortMount.items = items;
      effortMount.activeIdx = activeIdx;
      updateHeaderLabels(effortMount, activeIdx);
      try { effortMount.sliderApi?.refresh?.(); } catch {}
      return;
    }

    unmountEffortSlider();
    for (const b of matchedRadios) b.setAttribute('data-t3-op-hidden-radio', '1');

    const section = D.createElement('div');
    section.className = 't3-op-effort-section';
    section.setAttribute('data-t3-op-effort-slider', '1');

    const hdr = D.createElement('div');
    hdr.className = 't3-op-effort-hdr';
    const titleEl = D.createElement('span');
    titleEl.className = 't3-op-effort-title';
    titleEl.textContent = isOrch ? '切工水晶 · 推理强度' : '星轨推理等级';
    const valEl = D.createElement('span');
    valEl.className = 't3-op-effort-val';
    valEl.textContent = items[activeIdx]?.label || '';
    hdr.appendChild(titleEl);
    hdr.appendChild(valEl);

    const slot = D.createElement('div');
    slot.className = 't3-op-effort-slot';

    const labelsEl = D.createElement('div');
    labelsEl.className = 't3-op-effort-labels';
    items.forEach((it, i) => {
      const sp = D.createElement('span');
      sp.textContent = it.label;
      sp.setAttribute('data-active', i === activeIdx ? '1' : '0');
      labelsEl.appendChild(sp);
    });

    section.appendChild(hdr);
    section.appendChild(slot);
    section.appendChild(labelsEl);
    parent.insertBefore(section, matchedRadios[0]);

    const mountRec = {
      popup: targetPopup,
      parent,
      section,
      slot,
      valEl,
      labelsEl,
      radios: matchedRadios,
      items,
      activeIdx,
      sig,
      isOrch,
      sliderApi: null,
      crystalApi: null,
      crystalRaf: 0,
    };

    const seat = {
      _read() {
        const curItems = mountRec.items || items;
        const curIdx = Math.max(0, curItems.findIndex((x) => x.btn?.getAttribute('aria-checked') === 'true'));
        return {
          baseName: modelName || 'Gemini',
          effortLevels: curItems.map((x) => x.key),
          currentEffort: (curItems[curIdx] || curItems[0]).key,
          locked: false,
          isClaude: /claude|sonnet|opus|haiku/i.test(modelName),
        };
      },
      selectEffort(effortKey, idx) {
        const curItems = mountRec.items || items;
        const targetItem = curItems[idx] || curItems.find((x) => x.key === effortKey);
        if (targetItem?.btn) {
          targetItem.btn.click();
          const newIdx = curItems.indexOf(targetItem);
          if (newIdx >= 0) updateHeaderLabels(mountRec, newIdx);
          notifyMascot('effort-tier', { tier: targetItem.key });
        }
      },
    };

    try {
      mountRec.sliderApi = sliderLib.mountCodexEffortSlider({
        container: slot,
        seat,
        document: D,
        window: motionUnblockedWin,
        onCommit(item, idx) {
          if (typeof idx === 'number') updateHeaderLabels(mountRec, idx);
        },
      });
    } catch (e) {
      console.warn('[t3-obsidian-prism] effort slider mount error:', e);
    }

    // If Orchestrator model is active, mount WebGL2 cut-crystal refraction bar on the slider track
    if (isOrch && G.__agCrystalPrismCore?.mountCrystalPrismBar) {
      const track = slot.querySelector('.ces-track');
      if (track) {
        try {
          const cv = D.createElement('canvas');
          cv.className = 't3-op-crystal-canvas';
          track.appendChild(cv);
          const crystal = G.__agCrystalPrismCore.mountCrystalPrismBar(cv, {
            dark: isDarkTheme(),
            accent: cfg.accent,
            ambientIntensity: cfg.ambient,
          });
          mountRec.crystalApi = crystal;
          let lastT = performance.now();
          const stepCrystal = (now) => {
            if (destroyed || effortMount !== mountRec || !cv.isConnected) return;
            const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
            lastT = now;
            try { crystal.draw?.(now, dt, { dark: isDarkTheme(), accent: cfg.accent, ambientIntensity: cfg.ambient }); } catch {}
            mountRec.crystalRaf = G.requestAnimationFrame(stepCrystal);
          };
          mountRec.crystalRaf = G.requestAnimationFrame(stepCrystal);
          track.addEventListener('pointermove', (ev) => {
            try { crystal.setPointerClient?.(ev.clientX, ev.clientY); } catch {}
          }, { passive: true });
        } catch {}
      }
    }

    effortMount = mountRec;
  };

  // ── 5-Tier CSS.highlights Ink Stream Engine (Zero DOM mutation) ────────
  const INK_NAMES = ['t3-op-stream-f0', 't3-op-stream-f1', 't3-op-stream-f2', 't3-op-stream-f3', 't3-op-stream-f4'];
  const inkEntries = []; // { range, startedAt }
  let inkRaf = 0;
  const INK_DURATION_MS = 280;

  const clearInkHighlights = () => {
    if (inkRaf) { G.cancelAnimationFrame?.(inkRaf); inkRaf = 0; }
    inkEntries.length = 0;
    if (G.CSS && G.CSS.highlights) {
      for (const n of INK_NAMES) G.CSS.highlights.delete(n);
    }
  };

  const pumpInkHighlights = () => {
    inkRaf = 0;
    if (destroyed || !cfg.inkStream || !G.CSS?.highlights) {
      clearInkHighlights();
      return;
    }
    const now = performance.now();
    const buckets = [[], [], [], [], []];
    let alive = 0;
    for (let i = inkEntries.length - 1; i >= 0; i--) {
      const e = inkEntries[i];
      const age = now - e.startedAt;
      if (age >= INK_DURATION_MS || !e.range.startContainer?.isConnected) {
        inkEntries.splice(i, 1);
        continue;
      }
      const tier = Math.min(4, Math.floor((age / INK_DURATION_MS) * 5));
      buckets[tier].push(e.range);
      alive++;
    }
    for (let t = 0; t < 5; t++) {
      if (buckets[t].length > 0) {
        try { G.CSS.highlights.set(INK_NAMES[t], new G.Highlight(...buckets[t])); } catch {}
      } else {
        G.CSS.highlights.delete(INK_NAMES[t]);
      }
    }
    if (alive > 0 && !inkRaf) {
      inkRaf = G.requestAnimationFrame(pumpInkHighlights);
    }
  };

  const queueInkTextNode = (textNode, startOffset = 0) => {
    if (!cfg.inkStream || !G.CSS?.highlights || typeof G.Highlight !== 'function') return;
    const len = textNode?.nodeValue?.length || 0;
    if (len <= startOffset || len - startOffset > 400) return;
    try {
      const r = D.createRange();
      r.setStart(textNode, startOffset);
      r.setEnd(textNode, len);
      inkEntries.push({ range: r, startedAt: performance.now() });
      if (inkEntries.length > 48) inkEntries.splice(0, inkEntries.length - 48);
      if (!inkRaf) inkRaf = G.requestAnimationFrame(pumpInkHighlights);
    } catch {}
  };

  const html = () => D.documentElement;
  const isDarkTheme = () => getPreset().dark;
  const motionReduced = () => false;

  const ensureStyle = () => {
    let el = D.getElementById(STYLE_ID);
    if (!el) {
      el = D.createElement('style');
      el.id = STYLE_ID;
      (D.head || D.documentElement).appendChild(el);
    }
    const nextCss = buildRuntimeCss();
    if (el.textContent !== nextCss) el.textContent = nextCss;
  };

  const syncHtmlAttrs = () => {
    const h = html();
    if (!h) return;
    const p = getPreset();
    h.setAttribute('data-t3-op-active', '1');
    h.setAttribute('data-ag-cs-style', '1');
    h.setAttribute('data-ag-cs-theme', p.dark ? 'dark' : 'light');
    h.setAttribute('data-ag-cs-palette', p.palette);
    h.setAttribute('data-ag-cs-light-preset', p.lightPreset);
    h.setAttribute('data-ag-cs-accent', cfg.accent);
    h.setAttribute('data-ag-cs-ambient', String(cfg.ambient));
    h.setAttribute('data-ag-cs-motion', 'full');
  };

  const findComposerHost = () => D.querySelector('[data-slot="composer-host"]') || D.querySelector('[data-chat-composer-form]') || null;
  const findConversationArea = () => D.querySelector('[data-workspace-area="conversation"]') || null;

  const detectT3State = (host) => {
    let streaming = false;
    let camp = lastCamp;
    try {
      const form = host?.closest?.('[data-chat-composer-form]') || host;
      if (form) {
        const btns = form.querySelectorAll('button');
        for (const b of btns) {
          const aria = (b.getAttribute('aria-label') || b.getAttribute('title') || '').toLowerCase();
          if (aria.includes('stop') || aria.includes('interrupt') || aria.includes('cancel') || aria.includes('停止') || aria.includes('中断')) {
            streaming = true;
            break;
          }
          const cls = typeof b.className === 'string' ? b.className : '';
          if (cls.includes('bg-destructive') || cls.includes('bg-red-')) {
            streaming = true;
            break;
          }
        }
        const txt = (form.textContent || '').toLowerCase();
        if (txt.includes('claude') || txt.includes('sonnet') || txt.includes('opus') || txt.includes('haiku')) camp = 'claude';
        else if (txt.includes('gemini') || txt.includes('neon') || txt.includes('flash') || txt.includes('pro')) camp = 'gemini';
      }
      if (!streaming) {
        const activeThread = D.querySelector('[data-thread-item][aria-current="page"], [data-thread-item][data-active="true"]');
        const t = (activeThread?.textContent || '').toLowerCase();
        if (t.includes('运行中') || t.includes('running') || t.includes('working')) streaming = true;
      }
    } catch {}
    lastCamp = camp;
    isStreamingNow = streaming;
    return { streaming, camp };
  };

  const buildRigState = (host) => {
    const st = detectT3State(host);
    return {
      camp: st.camp,
      mascot: cfg.mascot,
      streaming: st.streaming,
      streamTier: 3,
      hasError: false,
      yieldMode: 'none',
      leapOffsetY: 0,
      popoverRightWidth: 0,
      miniPileEnabled: /minis$|\+m$/.test(cfg.mascot),
      orchestrator: false,
      reducedMotion: false,
    };
  };

  const notifyMascot = (eventName, payload) => {
    try { rig?.notify?.(eventName, payload || {}); } catch {}
  };

  const initRippleController = () => {
    if (rippleCtl) return;
    const rippleCore = G.__agCsRippleCore || G.__agPrismRipple;
    if (rippleCore && !G.__agPrismRipple) G.__agPrismRipple = rippleCore;
    const hostMod = G.__agPrismHomeRippleHost;
    if (!rippleCore || !hostMod || typeof hostMod.createHomeRippleController !== 'function') return;
    try {
      rippleCtl = hostMod.createHomeRippleController({
        rippleCore,
        isDestroyed: () => destroyed,
        isAllowed: () => cfg.ambient > 0,
        isConvAllowed: () => false,
        getConvLevel: () => 'off',
        isConvRunning: () => false,
        isDarkTheme,
        motionReduced,
        getMinFrameGapMs: () => 8,
        getAmbientIntensity: () => cfg.ambient,
        getAccentTone: () => cfg.accent,
        setAttrIfChanged: (el, k, v) => { if (el && el.getAttribute(k) !== String(v)) el.setAttribute(k, String(v)); },
        onPointerPressMascot: (clientX) => {
          if (!stageEl) return;
          try {
            const r = stageEl.getBoundingClientRect();
            if (r.width > 10) notifyMascot('ripple', { x: clientX - r.left });
          } catch {}
        },
      });
    } catch (e) {
      console.warn('[t3-obsidian-prism] ripple init error:', e);
      rippleCtl = null;
    }
  };

  const initRimController = () => {
    if (rimCtl) return;
    const mod = G.__agPrismRimCanvas;
    if (!mod || typeof mod.createPrismRimCanvasController !== 'function') return;
    try {
      rimCtl = mod.createPrismRimCanvasController({
        isDestroyed: () => destroyed,
        isDarkTheme,
        motionReduced,
        getMinFrameGapMs: () => 8,
        getAmbientIntensity: () => (cfg.prismRim ? cfg.ambient : 0),
        getAccentTone: () => cfg.accent,
        canMountRealCanvas: (el) => Boolean(el && el.isConnected !== false),
        setAttrIfChanged: (el, k, v) => { if (el && el.getAttribute(k) !== String(v)) el.setAttribute(k, String(v)); },
        runGuardedMut: (fn) => { try { fn(); } catch {} },
        getActiveCrystalTrack: () => null,
        setCrystalPointerClient: () => {},
        onPointerActivity: () => {},
        onComposerRimUpdate: (info) => { if (info && rig) notifyMascot('rim-glow', info); },
      });
    } catch {
      rimCtl = null;
    }
  };

  const initSmoothCaret = () => {
    if (caretCtl) return;
    const mod = G.__agPrismSmoothCaret;
    if (!mod || typeof mod.createSmoothCaretController !== 'function') return;
    try {
      caretCtl = mod.createSmoothCaretController({
        isDestroyed: () => destroyed,
        isEnabled: () => Boolean(cfg.smoothCaret),
        setAttrIfChanged: (el, k, v) => { if (el && el.getAttribute(k) !== String(v)) el.setAttribute(k, String(v)); },
        runGuardedMut: (fn) => { try { fn(); } catch {} },
      });
    } catch {
      caretCtl = null;
    }
  };

  const unmountMascot = () => {
    try { rig?.dispose?.(); } catch {}
    rig = null;
    if (stageEl && stageEl.parentNode) stageEl.parentNode.removeChild(stageEl);
    stageEl = null;
    if (anchorEl) {
      anchorEl.removeAttribute(ANCHOR_ATTR);
      anchorEl.removeAttribute('data-ag-cs-prism-box');
      if (anchorEl.getAttribute('data-testid') === 'agent-input-box') anchorEl.removeAttribute('data-testid');
      anchorEl.classList.remove('surface-composer-card');
      anchorEl = null;
    }
    html()?.removeAttribute('data-ag-cs-has-crab');
  };

  // ── Optical Settings Floating Panel (Alt+P or bottom-left prism button) ──
  const renderPanelContent = (panel) => {
    const chip = (group, val, label, active) =>
      `<button type="button" class="op-chip" data-op-group="${group}" data-op-val="${val}" data-active="${active ? '1' : '0'}">${label}</button>`;
    panel.innerHTML = `
      <div class="op-hdr">
        <div class="op-title"><span>◆</span><span>Obsidian Prism · 黑曜棱镜</span></div>
        <span class="op-sub">Alt+P</span>
      </div>
      <div class="op-sec">
        <div class="op-lbl">四套配色预设</div>
        <div class="op-grid">
          ${Object.entries(PRESETS).map(([k, v]) => chip('preset', k, v.label, cfg.preset === k)).join('')}
        </div>
      </div>
      <div class="op-sec">
        <div class="op-lbl">强调色光谱</div>
        <div class="op-row">
          ${chip('accent', 'follow', '跟随', cfg.accent === 'follow')}
          ${chip('accent', 'cobalt', '钴蓝', cfg.accent === 'cobalt')}
          ${chip('accent', 'iris', '鸢尾紫', cfg.accent === 'iris')}
          ${chip('accent', 'amber', '琥珀金', cfg.accent === 'amber')}
          ${chip('accent', 'mono', '纯银钛', cfg.accent === 'mono')}
        </div>
      </div>
      <div class="op-sec">
        <div class="op-lbl">像素伙伴阵容</div>
        <div class="op-row">
          ${chip('mascot', 'crab', '双宠', cfg.mascot === 'crab')}
          ${chip('mascot', 'minis', '双宠+迷你蟹', cfg.mascot === 'minis')}
          ${chip('mascot', 'quad', '四宠全员', cfg.mascot === 'quad')}
          ${chip('mascot', 'quad-minis', '全家福', cfg.mascot === 'quad-minis')}
          ${chip('mascot', 'off', '关闭', cfg.mascot === 'off')}
        </div>
      </div>
      <div class="op-sec">
        <div class="op-lbl">WebGL2 波纹与地平线极光浓度</div>
        <div class="op-row">
          ${chip('ambient', '0', '关闭', cfg.ambient === 0)}
          ${chip('ambient', '0.35', '35%', cfg.ambient === 0.35)}
          ${chip('ambient', '0.7', '70%', cfg.ambient === 0.7)}
          ${chip('ambient', '1', '100%', cfg.ambient === 1)}
        </div>
      </div>
      <div class="op-toggles">
        <label class="op-tgl"><span>推理等级星空滑块 (模型菜单内)</span><input type="checkbox" data-op-tgl="effortSlider" ${cfg.effortSlider ? 'checked' : ''} /></label>
        <label class="op-tgl"><span>丝滑发光光标 (Smooth Caret)</span><input type="checkbox" data-op-tgl="smoothCaret" ${cfg.smoothCaret ? 'checked' : ''} /></label>
        <label class="op-tgl"><span>五级水墨流式吐字 (CSS.highlights)</span><input type="checkbox" data-op-tgl="inkStream" ${cfg.inkStream ? 'checked' : ''} /></label>
        <label class="op-tgl"><span>输入框指针彩虹棱镜边框光</span><input type="checkbox" data-op-tgl="prismRim" ${cfg.prismRim ? 'checked' : ''} /></label>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid ${getPreset().border};font-size:10px;line-height:1.45;color:${getPreset().muted};">
        非官方 T3 Code 移植版 · 遵循 GPL-3.0<br/>
        原作：<b>Obsidian Prism</b> by <b>RMvdesi</b> (github.com/RMvdesi/obsidian-prism)<br/>
        滑块上游：<b>月上寒 / LLYSH-HANNARI</b>
      </div>
    `;
  };

  const applyConfigAndRefresh = (patch = {}) => {
    Object.assign(cfg, patch);
    saveCfg();
    ensureStyle();
    syncHtmlAttrs();
    if (!cfg.inkStream) clearInkHighlights();
    if (!cfg.smoothCaret) try { caretCtl?.teardown?.(); } catch {}
    if (cfg.mascot === 'off') unmountMascot();
    syncMount();
    try { rippleCtl?.refreshTheme?.(); } catch {}
    try { rimCtl?.invalidateMetrics?.(); } catch {}
    const panel = D.getElementById(PANEL_ID);
    if (panel) renderPanelContent(panel);
  };

  const ensureSettingsUi = () => {
    if (!D.body) return;
    let fab = D.getElementById(FAB_ID);
    if (!fab) {
      fab = D.createElement('button');
      fab.id = FAB_ID;
      fab.type = 'button';
      fab.title = 'Obsidian Prism 外观设置 (Alt+P)';
      fab.textContent = '◆';
      fab.addEventListener('click', (ev) => {
        ev.stopPropagation();
        togglePanel();
      });
      D.body.appendChild(fab);
    }
    let panel = D.getElementById(PANEL_ID);
    if (!panel) {
      panel = D.createElement('div');
      panel.id = PANEL_ID;
      renderPanelContent(panel);
      panel.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const chip = ev.target?.closest?.('.op-chip');
        if (chip) {
          const g = chip.getAttribute('data-op-group');
          const v = chip.getAttribute('data-op-val');
          if (g === 'ambient') applyConfigAndRefresh({ ambient: Number(v) });
          else if (g) applyConfigAndRefresh({ [g]: v });
        }
      });
      panel.addEventListener('change', (ev) => {
        const inp = ev.target?.closest?.('input[data-op-tgl]');
        if (inp) {
          const k = inp.getAttribute('data-op-tgl');
          applyConfigAndRefresh({ [k]: Boolean(inp.checked) });
        }
      });
      D.body.appendChild(panel);
    }
    panel.setAttribute('data-open', panelOpen ? '1' : '0');
  };

  const togglePanel = (forceState) => {
    panelOpen = typeof forceState === 'boolean' ? forceState : !panelOpen;
    ensureSettingsUi();
  };

  const syncMount = () => {
    if (destroyed) return;
    ensureStyle();
    syncHtmlAttrs();
    ensureSettingsUi();

    // 1. Mount WebGL2 ASCII Matrix + Horizon Glow onto T3 Code conversation canvas
    const conv = findConversationArea();
    if (conv) {
      if (convEl && convEl !== conv) convEl.classList.remove('agy-home');
      convEl = conv;
      if (!conv.classList.contains('agy-home')) conv.classList.add('agy-home');
      initRippleController();
      if (rippleCtl) {
        try { rippleCtl.sync(); } catch {}
      }
    }

    // 2. Mount Dual Mascot Physics Rig + GPU Prism Rim + Smooth Caret onto composer
    const host = findComposerHost();
    if (!host) {
      if (stageEl && stageEl.parentNode) {
        stageEl.parentNode.removeChild(stageEl);
        try { rig?.syncPowerState?.(); } catch {}
      }
      return;
    }

    if (anchorEl !== host) {
      if (anchorEl) {
        anchorEl.removeAttribute(ANCHOR_ATTR);
        anchorEl.removeAttribute('data-ag-cs-prism-box');
        if (anchorEl.getAttribute('data-testid') === 'agent-input-box') anchorEl.removeAttribute('data-testid');
        anchorEl.classList.remove('surface-composer-card');
      }
      anchorEl = host;
    }
    if (host.getAttribute(ANCHOR_ATTR) !== 'composer') host.setAttribute(ANCHOR_ATTR, 'composer');
    if (host.getAttribute('data-ag-cs-prism-box') !== '1') host.setAttribute('data-ag-cs-prism-box', '1');
    if (!host.getAttribute('data-testid')) host.setAttribute('data-testid', 'agent-input-box');
    if (!host.classList.contains('surface-composer-card')) host.classList.add('surface-composer-card');

    if (cfg.mascot !== 'off') {
      html()?.setAttribute('data-ag-cs-has-crab', '1');
      if (!stageEl) {
        stageEl = D.createElement('div');
        stageEl.className = 'ag-cs-crab ag-cs-dual-stage';
        stageEl.setAttribute('data-mascot-stage', 'true');
        stageEl.setAttribute(STAGE_ATTR, '1');
        stageEl.setAttribute('aria-hidden', 'true');
      }

      let reattached = false;
      if (stageEl.parentNode !== host) {
        host.appendChild(stageEl);
        reattached = true;
      }

      const rigMod = G.__agDualMascotRig;
      const mountFn = rigMod && (rigMod.mountDualMascotStage || rigMod.createDualMascotRig);
      const nextState = buildRigState(host);

      if (!rig && mountFn) {
        try { rig = mountFn(stageEl, nextState); } catch (e) { console.warn('[t3-obsidian-prism] mascot mount error:', e); rig = null; }
      } else if (rig) {
        try { rig.setState?.(nextState); } catch {}
        if (reattached) try { rig.syncPowerState?.(); } catch {}
      }

      initRimController();
      if (rimCtl && reattached) try { rimCtl.markDirty(); } catch {}
    } else {
      unmountMascot();
      initRimController();
      if (rimCtl) try { rimCtl.markDirty(); } catch {}
    }

    initSmoothCaret();
    if (caretCtl && cfg.smoothCaret) {
      try { caretCtl.schedule?.({ refreshMetrics: false }); } catch {}
    }
    syncEffortSlider();
  };

  const scheduleSync = () => {
    if (destroyed || syncTimer) return;
    syncTimer = G.setTimeout(() => {
      syncTimer = 0;
      syncMount();
    }, 80);
  };

  // Interactive event listeners
  const onPointerMove = (ev) => {
    if (destroyed) return;
    try { rimCtl?.onPointerMove?.(ev); } catch {}
    try { rippleCtl?.getMount?.()?.onMove?.(ev); } catch {}
  };

  const onPointerDown = (ev) => {
    if (destroyed) return;
    if (panelOpen) {
      const panel = D.getElementById(PANEL_ID);
      const fab = D.getElementById(FAB_ID);
      if (panel && !panel.contains(ev.target) && (!fab || !fab.contains(ev.target))) {
        togglePanel(false);
      }
    }
    try { rippleCtl?.getMount?.()?.onPress?.(ev); } catch {}
    if (!stageEl || stageEl.contains(ev.target)) return;
    try {
      const r = stageEl.getBoundingClientRect();
      if (r.width > 10) notifyMascot('ripple', { x: ev.clientX - r.left });
    } catch {}
  };

  const onPointerLeave = () => {
    if (destroyed) return;
    try { rippleCtl?.getMount?.()?.onLeave?.(); } catch {}
  };

  const onKeyDown = (ev) => {
    if (destroyed) return;
    if (ev.altKey && !ev.ctrlKey && !ev.metaKey && (ev.key === 'p' || ev.key === 'P')) {
      ev.preventDefault();
      togglePanel();
      return;
    }
    if (ev.key === 'Escape' && panelOpen) {
      togglePanel(false);
      return;
    }
    const t = ev.target;
    if (!t || !anchorEl || !anchorEl.contains(t)) return;
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      notifyMascot('send', {});
      try { rippleCtl?.triggerLiftoffBurst?.(anchorEl.getBoundingClientRect()); } catch {}
    } else if (ev.key.length === 1 || ev.key === 'Backspace') {
      notifyMascot('activity', {});
      try { caretCtl?.schedule?.({ typing: true }); } catch {}
    }
  };

  const onSelectionOrInput = () => {
    if (destroyed || !cfg.smoothCaret) return;
    try { caretCtl?.schedule?.({ typing: true }); } catch {}
  };

  const onClick = (ev) => {
    if (destroyed) return;
    const btn = ev.target?.closest?.('button');
    if (!btn) return;
    const label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent || '').toLowerCase();
    if (label.includes('copy') || label.includes('复制')) {
      notifyMascot('code-copied', {});
    } else if (anchorEl && anchorEl.contains(btn) && (btn.type === 'submit' || label.includes('send') || label.includes('发送'))) {
      notifyMascot('send', {});
      try { rippleCtl?.triggerLiftoffBurst?.(anchorEl.getBoundingClientRect()); } catch {}
    }
  };

  const onResize = () => {
    if (destroyed) return;
    try { rimCtl?.invalidateMetrics?.(); } catch {}
    try { caretCtl?.bumpMetricsEpoch?.(); caretCtl?.schedule?.({ refreshMetrics: true }); } catch {}
  };

  G.addEventListener('pointermove', onPointerMove, { passive: true });
  G.addEventListener('pointerdown', onPointerDown, { passive: true });
  D.documentElement.addEventListener('pointerleave', onPointerLeave, { passive: true });
  D.addEventListener('keydown', onKeyDown, true);
  D.addEventListener('input', onSelectionOrInput, true);
  D.addEventListener('selectionchange', onSelectionOrInput, true);
  D.addEventListener('focusin', onSelectionOrInput, true);
  D.addEventListener('focusout', onSelectionOrInput, true);
  D.addEventListener('click', onClick, true);
  G.addEventListener('resize', onResize, { passive: true });

  mo = new MutationObserver((muts) => {
    if (destroyed) return;
    let needSync = false;
    for (const m of muts) {
      if (m.target === stageEl || (stageEl && stageEl.contains(m.target))) continue;
      if (m.target?.classList?.contains?.('ag-cs-ripple-host')) continue;
      if (effortMount?.section && (m.target === effortMount.section || effortMount.section.contains(m.target))) continue;
      if (m.target?.id === PANEL_ID || m.target?.id === FAB_ID) continue;

      // 5-tier ink stream highlight on newly streamed assistant markdown text
      if (cfg.inkStream && isStreamingNow) {
        if (m.type === 'characterData' && m.target?.nodeType === 3) {
          const parentMd = m.target.parentElement?.closest?.('.chat-markdown');
          if (parentMd && !m.target.parentElement?.closest?.('pre, code')) {
            const oldLen = (m.oldValue || '').length;
            const curLen = (m.target.nodeValue || '').length;
            if (curLen > oldLen) queueInkTextNode(m.target, oldLen);
          }
        } else if (m.type === 'childList' && m.addedNodes?.length) {
          const targetEl = m.target?.nodeType === 1 ? m.target : m.target?.parentElement;
          if (targetEl?.closest?.('.chat-markdown') && !targetEl.closest('pre, code')) {
            for (const n of m.addedNodes) {
              if (n.nodeType === 3) queueInkTextNode(n, 0);
              else if (n.nodeType === 1 && !n.matches?.('pre, code')) {
                const tw = D.createTreeWalker(n, 4 /* NodeFilter.SHOW_TEXT */);
                let tn;
                while ((tn = tw.nextNode())) queueInkTextNode(tn, 0);
              }
            }
          }
        }
      }

      if (m.type === 'childList' || m.attributeName === 'class') needSync = true;
    }
    if (needSync) scheduleSync();
  });
  mo.observe(D.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  statePollTimer = G.setInterval(() => {
    if (destroyed || D.hidden) return;
    syncMount();
  }, 1500);

  // Initial mount
  syncMount();
  if (rimCtl) try { rimCtl.markDirty(); } catch {}
  if (rippleCtl) try { rippleCtl.triggerTideSwell(); } catch {}

  const dispose = () => {
    destroyed = true;
    if (syncTimer) { G.clearTimeout(syncTimer); syncTimer = 0; }
    if (statePollTimer) { G.clearInterval(statePollTimer); statePollTimer = 0; }
    clearInkHighlights();
    try { mo?.disconnect?.(); } catch {}
    mo = null;
    G.removeEventListener('pointermove', onPointerMove);
    G.removeEventListener('pointerdown', onPointerDown);
    D.documentElement.removeEventListener('pointerleave', onPointerLeave);
    D.removeEventListener('keydown', onKeyDown, true);
    D.removeEventListener('input', onSelectionOrInput, true);
    D.removeEventListener('selectionchange', onSelectionOrInput, true);
    D.removeEventListener('focusin', onSelectionOrInput, true);
    D.removeEventListener('focusout', onSelectionOrInput, true);
    D.removeEventListener('click', onClick, true);
    G.removeEventListener('resize', onResize);
    try { caretCtl?.teardown?.(); } catch {}
    caretCtl = null;
    unmountEffortSlider();
    try { rippleCtl?.unmount?.(); } catch {}
    rippleCtl = null;
    if (convEl) { convEl.classList.remove('agy-home'); convEl = null; }
    try { rimCtl?.teardown?.(); } catch {}
    rimCtl = null;
    unmountMascot();
    D.getElementById(FAB_ID)?.remove?.();
    D.getElementById(PANEL_ID)?.remove?.();
    D.getElementById(STYLE_ID)?.remove?.();
    html()?.removeAttribute('data-t3-op-active');
    html()?.removeAttribute('data-ag-cs-style');
    if (G.__t3ObsidianPrism?.dispose === dispose) delete G.__t3ObsidianPrism;
  };

  G.__t3ObsidianPrism = {
    version: '2.0.0',
    sourceVersion: 'obsidian-prism@1.0.8-beta.2',
    getConfig: () => ({ ...cfg }),
    setConfig: applyConfigAndRefresh,
    setMascot: (mode) => applyConfigAndRefresh({ mascot: mode }),
    setPreset: (preset) => PRESETS[preset] && applyConfigAndRefresh({ preset }),
    togglePanel,
    notify: notifyMascot,
    sync: syncMount,
    status() {
      const rm = rippleCtl?.getMount?.() || null;
      const miniPile = stageEl ? stageEl.querySelector('.ag-v2-mini-pile') : null;
      return {
        ok: true,
        version: '2.0.0',
        active: !destroyed,
        config: { ...cfg },
        hasRippleCore: Boolean(G.__agCsRippleCore || G.__agPrismRipple),
        hasHomeRippleHost: Boolean(G.__agPrismHomeRippleHost),
        rippleMounted: Boolean(rm && rm.host && rm.host.isConnected),
        rippleMode: rm?.field?.mode || null,
        glowCanvasSize: rm?.glowCanvas ? `${rm.glowCanvas.width}x${rm.glowCanvas.height}` : null,
        rippleCanvasSize: rm?.canvas ? `${rm.canvas.width}x${rm.canvas.height}` : null,
        hasDualMascotRig: Boolean(G.__agDualMascotRig),
        hasPrismRimCanvas: Boolean(G.__agPrismRimCanvas),
        hasSmoothCaret: Boolean(G.__agPrismSmoothCaret),
        smoothCaretReady: Boolean(caretCtl),
        hasEffortSliderLib: Boolean(G.AntigravityCodexEffortSlider?.mountCodexEffortSlider),
        hasCrystalPrismCore: Boolean(G.__agCrystalPrismCore?.mountCrystalPrismBar),
        effortSliderMountedNow: Boolean(effortMount && effortMount.section?.isConnected),
        inkHighlightSupported: Boolean(G.CSS?.highlights && typeof G.Highlight === 'function'),
        settingsUiMounted: Boolean(D.getElementById(FAB_ID) && D.getElementById(PANEL_ID)),
        mounted: Boolean(rig && stageEl && stageEl.isConnected),
        anchorFound: Boolean(anchorEl && anchorEl.isConnected),
        actorCount: stageEl ? stageEl.querySelectorAll('.ag-v2-mascot-actor').length : 0,
        miniPileVisible: Boolean(miniPile && G.getComputedStyle(miniPile).display !== 'none'),
        rimControllerReady: Boolean(rimCtl),
        streaming: isStreamingNow,
        darkTheme: isDarkTheme(),
      };
    },
    dispose,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
