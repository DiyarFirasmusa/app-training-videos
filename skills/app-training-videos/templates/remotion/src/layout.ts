import type { Box, Side } from './types.ts';
import { H, W } from './theme.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Placement = 'left' | 'right' | 'top' | 'bottom' | 'corner' | 'center';

export interface PanelPlacement {
  rect: Rect;
  placement: Placement;
  overlap: number;
}

const MARGIN = 28;
const GAP = 64;

export interface Camera {
  s: number;
  tx: number;
  ty: number;
}

export const IDENTITY: Camera = { s: 1, tx: 0, ty: 0 };

export const project = (box: Box | Rect, cam: Camera): Rect => ({
  x: box.x * cam.s + cam.tx,
  y: box.y * cam.s + cam.ty,
  w: box.w * cam.s,
  h: box.h * cam.s,
});

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Camera that zooms toward the target while keeping the whole target inside the frame. */
export const cameraFor = (box: Box | null, zoom: boolean): Camera => {
  if (!box || !zoom || box.w > 420 || box.h > 90) {
    return IDENTITY;
  }
  const edge = 40;
  for (let s = clamp(Math.min(760 / box.w, 300 / box.h), 1, 1.2); s >= 1.06; s -= 0.03) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const loX = Math.max(W * (1 - s), edge - box.x * s);
    const hiX = Math.min(0, W - edge - (box.x + box.w) * s);
    const loY = Math.max(H * (1 - s), edge - box.y * s);
    const hiY = Math.min(0, H - edge - (box.y + box.h) * s);
    if (loX <= hiX && loY <= hiY) {
      return { s, tx: clamp((1 - s) * cx, loX, hiX), ty: clamp((1 - s) * cy, loY, hiY) };
    }
  }
  return IDENTITY;
};

const area = (r: Rect): number => Math.max(0, r.w) * Math.max(0, r.h);

const overlapArea = (a: Rect, b: Rect): number => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
};

const pad = (b: Rect, p: number): Rect => ({ x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 });

const fit = (rect: Rect): Rect => ({
  ...rect,
  x: clamp(rect.x, MARGIN, W - MARGIN - rect.w),
  y: clamp(rect.y, MARGIN, H - MARGIN - rect.h),
});

/**
 * Put the callout next to the target without covering it. The requested side wins when it
 * fits; otherwise the side with the most free room is used, then the screen corners.
 */
export const placePanel = (
  target: Rect,
  size: { w: number; h: number },
  side: Side,
  avoid: Rect[] = [],
): PanelPlacement => {
  const keep = pad(target, 10);
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  const candidates: { placement: Placement; rect: Rect; room: number }[] = [
    {
      placement: 'left',
      rect: { x: target.x - GAP - size.w, y: cy - size.h / 2, ...size },
      room: target.x - GAP - size.w - MARGIN,
    },
    {
      placement: 'right',
      rect: { x: target.x + target.w + GAP, y: cy - size.h / 2, ...size },
      room: W - MARGIN - (target.x + target.w + GAP + size.w),
    },
    {
      placement: 'top',
      rect: { x: cx - size.w / 2, y: target.y - GAP - size.h, ...size },
      room: target.y - GAP - size.h - MARGIN,
    },
    {
      placement: 'bottom',
      rect: { x: cx - size.w / 2, y: target.y + target.h + GAP, ...size },
      room: H - MARGIN - (target.y + target.h + GAP + size.h),
    },
  ];

  const scored = candidates.map((c) => {
    const rect = fit(c.rect);
    const hit = overlapArea(rect, keep) + avoid.reduce((sum, a) => sum + overlapArea(rect, a), 0);
    return { ...c, rect, overlap: hit };
  });

  const preferred = scored.find((c) => c.placement === side && c.room >= -40 && c.overlap === 0);
  if (preferred) {
    return { rect: preferred.rect, placement: preferred.placement, overlap: 0 };
  }
  const free = scored.filter((c) => c.room >= -40 && c.overlap === 0).sort((a, b) => b.room - a.room);
  if (free[0]) {
    return { rect: free[0].rect, placement: free[0].placement, overlap: 0 };
  }

  const corners: Rect[] = [
    { x: MARGIN, y: H - MARGIN - size.h, ...size },
    { x: W - MARGIN - size.w, y: H - MARGIN - size.h, ...size },
    { x: MARGIN, y: 96, ...size },
    { x: W - MARGIN - size.w, y: 96, ...size },
    { x: (W - size.w) / 2, y: H - MARGIN - size.h, ...size },
    { x: (W - size.w) / 2, y: 96, ...size },
  ].map((r) => ({ ...r, w: size.w, h: size.h }));
  const cornerScored = corners
    .map((rect) => ({
      rect,
      overlap: overlapArea(rect, keep) + avoid.reduce((sum, a) => sum + overlapArea(rect, a), 0),
    }))
    .sort((a, b) => a.overlap - b.overlap);
  const best = cornerScored[0];
  if (best) {
    return { rect: best.rect, placement: 'corner', overlap: best.overlap };
  }
  return { rect: fit({ ...size, x: 0, y: 0 }), placement: 'center', overlap: area(keep) };
};

/** Closest point of `r` to `p`. */
export const nearestOnRect = (r: Rect, p: { x: number; y: number }): { x: number; y: number } => ({
  x: clamp(p.x, r.x, r.x + r.w),
  y: clamp(p.y, r.y, r.y + r.h),
});

/** Rough height of Arabic text wrapped to a width, at the given size. */
export const estimateLines = (text: string, width: number, fontSize: number): number => {
  const perLine = Math.max(8, Math.floor(width / (fontSize * 0.5)));
  const words = text.split(/\s+/);
  let lines = 1;
  let used = 0;
  for (const word of words) {
    const len = word.length + 1;
    if (used + len > perLine && used > 0) {
      lines += 1;
      used = len;
    } else {
      used += len;
    }
  }
  return lines;
};
