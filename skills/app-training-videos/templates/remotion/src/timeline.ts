import type { VideoData } from './types.ts';

export const FPS = 30;

export const CHAPTER_S = 4.5;
export const OUTRO_S = 4;
const LEAD_S = 0.4;
const TAIL_S = 0.6;

/** A stretch of the output. Frozen stretches show one frame of the recording for reading time. */
export interface Segment {
  outFrom: number;
  outLen: number;
  clipFrom: number;
  frozen: boolean;
}

export interface Timeline {
  segments: Segment[];
  /** Seconds in the output where each step is on screen. */
  windows: { outStart: number; outEnd: number }[];
  mainFrames: number;
}

const frames = (seconds: number): number => Math.round(seconds * FPS);

/**
 * Recordings made in fast mode carry `hold` (seconds to read) and `tFreeze` (the moment to
 * freeze on), so reading time is added here instead of being waited for while recording.
 * Older recordings have neither, and play through unchanged.
 */
export const buildTimeline = (data: VideoData): Timeline => {
  const steps = data.steps;
  const first = steps[0]?.tStart ?? 0;
  const trim = Math.max(0, first - LEAD_S);
  const segments: Segment[] = [];
  const windows: { outStart: number; outEnd: number }[] = [];
  let out = 0;
  const push = (clipFrom: number, outLen: number, frozen: boolean): void => {
    if (outLen <= 0) {
      return;
    }
    segments.push({ outFrom: out, outLen, clipFrom: frames(clipFrom), frozen });
    out += outLen;
  };
  let v = trim;
  for (const step of steps) {
    push(v, frames(step.tStart - v), false);
    const freeze = Math.min(step.tEnd, Math.max(step.tStart, step.tFreeze ?? step.tEnd));
    const start = out;
    push(step.tStart, frames(freeze - step.tStart), false);
    push(freeze, frames(Math.max(0, (step.hold ?? 0) - (step.tEnd - step.tStart))), true);
    push(freeze, frames(step.tEnd - freeze), false);
    windows.push({ outStart: start / FPS, outEnd: out / FPS });
    v = step.tEnd;
  }
  const end = Math.min(data.duration, v + TAIL_S);
  push(v, frames(end - v), false);
  return { segments, windows, mainFrames: out };
};
