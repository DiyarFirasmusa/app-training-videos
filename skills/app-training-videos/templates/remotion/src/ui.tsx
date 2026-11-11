import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT } from './theme.ts';

export const ease = Easing.bezier(0.22, 1, 0.36, 1);

export const rtl: CSSProperties = { fontFamily: FONT };

/** Fades a block in and out at the edges of its sequence. */
export const Fade = ({ frames = 10, children }: { frames?: number; children: ReactNode }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, frames, durationInFrames - frames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return <div style={{ position: 'absolute', inset: 0, opacity }}>{children}</div>;
};

export const brandBackground = `radial-gradient(1200px 700px at 80% 10%, #8a3a52 0%, transparent 60%), linear-gradient(135deg, ${COLORS.brandDeep} 0%, ${COLORS.brandDarker} 100%)`;
