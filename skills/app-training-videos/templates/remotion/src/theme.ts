import { loadFont } from '@remotion/google-fonts/Cairo';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['arabic', 'latin'],
});

export const FONT = `${fontFamily}, 'Geeza Pro', 'Segoe UI', sans-serif`;

export { FPS } from './timeline.ts';
export const W = 1920;
export const H = 1080;

export const COLORS = {
  brand: '#6E2C3F',
  brandDeep: '#2A0F18',
  brandDarker: '#1A0A10',
  panel: '#1D0E14',
  panelEdge: '#F3B544',
  ink: '#FFFFFF',
  inkSoft: '#F0E4E8',
  amber: '#F3B544',
  amberDeep: '#3B2A07',
  green: '#4ADE80',
  greenDeep: '#0F3A22',
  red: '#FF8A8A',
  redDeep: '#4A1318',
  scrim: 'rgba(12, 5, 8, 0.34)',
} as const;

export const SIZE = {
  chapterNumber: 52,
  chapterTitle: 104,
  chapterSub: 48,
  title: 54,
  text: 40,
  note: 36,
  label: 36,
  badge: 40,
  summaryTitle: 84,
  summaryItem: 52,
} as const;
