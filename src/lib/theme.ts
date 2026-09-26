/**
 * SAMBO palette — the site's dark green-gradient theme (Sambo-web
 * src/index.css), converted from oklch to hex for React Native.
 */
export const colors = {
  ink: '#EFF8F2',
  inkMuted: '#C4D5CB',
  inkSubtle: '#9FB3A7',
  accent: '#74E0A1',
  accentStrong: '#3EC57D',
  onAccent: '#0B2A1C',
  danger: '#FF8F86',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  dangerLine: 'rgba(248, 113, 113, 0.32)',
  gold: '#E6BC3D',
  canvas: '#06120C',
  line: 'rgba(255, 255, 255, 0.10)',
  lineStrong: 'rgba(255, 255, 255, 0.20)',
  glass: 'rgba(255, 255, 255, 0.06)',
  glassStrong: 'rgba(12, 32, 22, 0.86)',
  bubble: 'rgba(255, 255, 255, 0.10)',
  online: '#22C55E',
  offline: '#9CA3AF',
  sambo950: '#0b1a12',
  sambo900: '#12291e',
  sambo700: '#245038',
} as const

/** Background gradient stops, same as the site's body::before. */
export const gradient = ['#050d09', '#0b2016', '#06120c'] as const

export const radius = { sm: 10, md: 16, lg: 22, full: 999 } as const
