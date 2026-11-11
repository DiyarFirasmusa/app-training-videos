import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { estimateLines, nearestOnRect, type PanelPlacement, type Rect } from './layout.ts';
import { COLORS, DESIGN, FONT, SIZE } from './theme.ts';
import { ease } from './ui.tsx';
import type { StepData } from './types.ts';

export const PANEL_W = DESIGN.panelWidth;
const PAD_X = 40;
const PAD_Y = 30;
const NOTE_PAD = 20;

/** Pixel size of the panel, so it can be placed before it is drawn. */
export const panelSize = (step: StepData, centered: boolean): { w: number; h: number } => {
  const w = centered ? 1000 : PANEL_W;
  const inner = w - PAD_X * 2;
  const titleLines = estimateLines(step.title, inner - 8, SIZE.title);
  const textLines = estimateLines(step.text, inner, SIZE.text);
  let h = PAD_Y * 2 + 68 + 14 + titleLines * SIZE.title * 1.3 + 8 + textLines * SIZE.text * 1.5;
  for (const note of [step.tip, step.warn]) {
    if (note) {
      const lines = estimateLines(`${note} ${note.length > 0 ? 'نصيحة' : ''}`, inner - NOTE_PAD * 2, SIZE.note);
      h += 18 + NOTE_PAD * 2 + lines * SIZE.note * 1.5;
    }
  }
  return { w, h: Math.ceil(h) + 8 };
};

import type { Labels } from './labels.ts';

interface Props {
  labels: Labels;
  step: StepData;
  total: number;
  placement: PanelPlacement;
  ring: Rect | null;
  localSeconds: number;
  duration: number;
}

const Note = ({ kind, labels, children }: { kind: 'tip' | 'warn'; labels: Labels; children: string }) => {
  const tip = kind === 'tip';
  return (
    <div
      style={{
        marginTop: 18,
        padding: `${NOTE_PAD}px`,
        borderRadius: 18,
        background: tip ? COLORS.greenDeep : COLORS.redDeep,
        border: `3px solid ${tip ? COLORS.green : COLORS.red}`,
        fontSize: SIZE.note,
        lineHeight: 1.5,
        fontWeight: 500,
        color: COLORS.ink,
      }}
    >
      <span style={{ color: tip ? COLORS.green : COLORS.red, fontWeight: 800 }}>{tip ? labels.tip : labels.warn}</span>
      {children}
    </div>
  );
};

export const StepCallout = ({ labels, step, total, placement, ring, localSeconds, duration }: Props) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  void frame;
  const appear = ease(Math.min(1, Math.max(0, (localSeconds - 0.25) / 0.4)));
  const leave = interpolate(localSeconds, [duration - 0.3, duration - 0.05], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = appear * leave;
  const { rect } = placement;
  const centered = placement.placement === 'center';

  let arrow: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (ring && !centered) {
    const ringCenter = { x: ring.x + ring.w / 2, y: ring.y + ring.h / 2 };
    const start = nearestOnRect(rect, ringCenter);
    const end = nearestOnRect(ring, start);
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    if (length > 24) {
      const ux = (end.x - start.x) / length;
      const uy = (end.y - start.y) / length;
      arrow = { x1: start.x, y1: start.y, x2: end.x - ux * 6, y2: end.y - uy * 6 };
    }
  }
  const draw = ease(Math.min(1, Math.max(0, (localSeconds - 0.45) / 0.4)));
  void fps;

  return (
    <>
      {arrow ? (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: leave }}>
          <defs>
            <marker id="head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={COLORS.amber} />
            </marker>
          </defs>
          <line
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x1 + (arrow.x2 - arrow.x1) * draw}
            y2={arrow.y1 + (arrow.y2 - arrow.y1) * draw}
            stroke={COLORS.amber}
            strokeWidth={7}
            strokeLinecap="round"
            markerEnd="url(#head)"
          />
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          boxSizing: 'border-box',
          padding: `${PAD_Y}px ${PAD_X}px`,
          fontFamily: FONT,
          color: COLORS.ink,
          background: COLORS.panel,
          border: `4px solid ${COLORS.panelEdge}`,
          borderRadius: DESIGN.panelRadius,
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          opacity,
          transform: `translateY(${(1 - appear) * 24}px)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 68 }}>
          <div
            style={{ width: 68, height: 68, borderRadius: 34, background: COLORS.amber, color: COLORS.amberDeep, fontSize: SIZE.badge, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}
          >
            {step.index}
          </div>
          <div style={{ fontSize: SIZE.label, fontWeight: 600, color: COLORS.amber }}>
            {labels.step(step.index, total)}
          </div>
        </div>
        <div style={{ fontSize: SIZE.title, fontWeight: 800, lineHeight: 1.3, marginTop: 14 }}>{step.title}</div>
        <div style={{ fontSize: SIZE.text, fontWeight: 500, lineHeight: 1.5, marginTop: 8, color: COLORS.inkSoft }}>{step.text}</div>
        {step.tip ? <Note kind="tip" labels={labels}>{step.tip}</Note> : null}
        {step.warn ? <Note kind="warn" labels={labels}>{step.warn}</Note> : null}
      </div>
    </>
  );
};
