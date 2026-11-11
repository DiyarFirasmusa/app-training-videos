import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLORS, SIZE } from './theme.ts';
import { brandBackground, ease, rtl } from './ui.tsx';

import type { Labels } from './labels.ts';

export const SummaryCard = ({ items, labels }: { items: string[]; labels: Labels }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ ...rtl, background: brandBackground, color: COLORS.ink, justifyContent: 'center', padding: '0 220px' }}>
      <div style={{ fontSize: SIZE.summaryTitle, fontWeight: 800, marginBottom: 56 }}>{labels.summary}</div>
      {items.map((item, i) => {
        const p = ease(Math.min(1, Math.max(0, (frame - 14 - i * 16) / 20)));
        return (
          <div
            key={item}
            style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: SIZE.summaryItem, fontWeight: 600, marginBottom: 34, opacity: p, transform: `translateX(${(1 - p) * 60}px)` }}
          >
            <span
              style={{ width: 64, height: 64, borderRadius: 32, background: COLORS.amber, color: COLORS.amberDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, flex: '0 0 auto' }}
            >
              ✓
            </span>
            <span>{item}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
