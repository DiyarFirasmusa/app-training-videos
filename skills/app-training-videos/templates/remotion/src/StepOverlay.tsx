import { H, W } from './theme.ts';
import { StepCallout, panelSize } from './StepCallout.tsx';
import { Spotlight } from './Spotlight.tsx';
import { placePanel, project, type Camera, type Rect } from './layout.ts';
import type { Labels } from './labels.ts';
import type { StepData } from './types.ts';
import { ease } from './ui.tsx';

interface Props {
  step: StepData;
  total: number;
  labels: Labels;
  /** Camera at this moment, and where it settles for the step (the callout is placed against the settled one). */
  cam: Camera;
  finalCam: Camera;
  /** Seconds into the step, and the step's length on screen. */
  local: number;
  duration: number;
}

/** Everything drawn over the recording for one step: dim layer, ring, arrow, callout. */
export const StepOverlay = ({ step, total, labels, cam, finalCam, local, duration }: Props) => {
  const target: Rect | null = step.area ?? step.box;
  const live = target ? project(target, cam) : null;
  const settled = target ? project(target, finalCam) : null;
  const size = panelSize(step, !target && step.action === 'none');
  const avoid = step.avoid ? [project(step.avoid, finalCam)] : [];
  const placement = settled
    ? placePanel(settled, size, step.side, avoid)
    : {
        rect:
          step.action === 'none'
            ? { x: (W - size.w) / 2, y: (H - size.h) / 2, ...size }
            : { x: (W - size.w) / 2, y: H - 40 - size.h, ...size },
        placement: 'center' as const,
        overlap: 0,
      };
  const appear = ease(Math.min(1, Math.max(0, local / 0.35)));
  const leave = Math.min(1, Math.max(0, (duration - local) / 0.25));
  const big = live ? (live.w * live.h) / (W * H) > 0.45 : false;
  return (
    <>
      {live ? <Spotlight ring={live} opacity={appear * leave} pulse={(Math.sin(local * 5) + 1) / 2} dim={!big} /> : null}
      <StepCallout labels={labels} step={step} total={total} placement={placement} ring={live} localSeconds={local} duration={duration} />
    </>
  );
};
