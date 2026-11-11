import type { Rect } from './layout.ts';
import { COLORS, DESIGN } from './theme.ts';

interface Props {
  ring: Rect;
  opacity: number;
  pulse: number;
  dim: boolean;
}

/** A glowing frame around the target with the rest of the picture dimmed. */
export const Spotlight = ({ ring, opacity, pulse, dim }: Props) => {
  const pad = DESIGN.ringPad;
  return (
    <div
      style={{
        position: 'absolute',
        left: ring.x - pad,
        top: ring.y - pad,
        width: ring.w + pad * 2,
        height: ring.h + pad * 2,
        boxSizing: 'border-box',
        borderRadius: 16,
        border: `${DESIGN.ringWidth}px solid ${COLORS.amber}`,
        boxShadow: `${dim && DESIGN.dim ? `0 0 0 4000px ${COLORS.scrim}, ` : ''}0 0 ${18 + pulse * 22}px ${6 + pulse * 6}px rgba(243,181,68,0.55)`,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
