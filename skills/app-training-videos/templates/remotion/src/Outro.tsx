import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { COLORS } from './theme.ts';
import { brandBackground, ease, rtl } from './ui.tsx';

import type { Labels } from './labels.ts';

export const Outro = ({ nextTitle, labels }: { nextTitle: string | null; labels: Labels }) => {
  const frame = useCurrentFrame();
  const p = ease(Math.min(1, frame / 24));
  return (
    <AbsoluteFill
      style={{ ...rtl, background: brandBackground, color: COLORS.ink, justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: p }}
    >
      <div style={{ fontSize: 96, fontWeight: 800 }}>{labels.outroDone}</div>
      <div style={{ fontSize: 48, fontWeight: 600, color: COLORS.inkSoft, marginTop: 24 }}>
        {nextTitle ? labels.outroNext : labels.outroEnd}
      </div>
      {nextTitle ? (
        <div style={{ fontSize: 64, fontWeight: 700, color: COLORS.amber, marginTop: 20, maxWidth: 1500 }}>{nextTitle}</div>
      ) : (
        <div style={{ fontSize: 52, fontWeight: 600, color: COLORS.amber, marginTop: 20 }}>{labels.outroAgain}</div>
      )}
    </AbsoluteFill>
  );
};
