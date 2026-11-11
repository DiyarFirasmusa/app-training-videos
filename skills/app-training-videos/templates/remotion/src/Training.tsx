import { useMemo } from 'react';
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { ChapterCard } from './ChapterCard.tsx';
import { Outro } from './Outro.tsx';
import { StepOverlay } from './StepOverlay.tsx';
import { SummaryCard } from './SummaryCard.tsx';
import { cameraFor, IDENTITY, type Camera } from './layout.ts';
import { COLORS, FPS, H, W } from './theme.ts';
import type { StepData, TrainingProps, VideoData } from './types.ts';
import { CHAPTER_S, OUTRO_S, buildTimeline } from './timeline.ts';
import { labelsFor, type Labels } from './labels.ts';
import { Fade, ease } from './ui.tsx';

const CAMERA_S = 0.7;

export interface Timing {
  chapterFrames: number;
  mainFrames: number;
  summaryFrames: number;
  outroFrames: number;
  total: number;
}

export const timingFor = (data: VideoData): Timing => {
  const chapterFrames = Math.round(CHAPTER_S * FPS);
  const mainFrames = buildTimeline(data).mainFrames;
  const summaryFrames = Math.round((4 + data.learn.length * 1.4) * FPS);
  const outroFrames = Math.round(OUTRO_S * FPS);
  return { chapterFrames, mainFrames, summaryFrames, outroFrames, total: chapterFrames + mainFrames + summaryFrames + outroFrames };
};

const mix = (a: Camera, b: Camera, p: number): Camera => ({
  s: a.s + (b.s - a.s) * p,
  tx: a.tx + (b.tx - a.tx) * p,
  ty: a.ty + (b.ty - a.ty) * p,
});

const cameraAt = (starts: number[], cams: Camera[], t: number): Camera => {
  let i = -1;
  for (let k = 0; k < starts.length; k += 1) {
    if ((starts[k] ?? Infinity) <= t) {
      i = k;
    }
  }
  if (i < 0) {
    return IDENTITY;
  }
  const prev = i === 0 ? IDENTITY : (cams[i - 1] ?? IDENTITY);
  const p = ease(Math.min(1, Math.max(0, (t - (starts[i] ?? 0)) / CAMERA_S)));
  return mix(prev, cams[i] ?? IDENTITY, p);
};

const Main = ({ data, labels }: { data: VideoData; labels: Labels }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const steps = data.steps;
  const timeline = useMemo(() => buildTimeline(data), [data]);
  const cams = useMemo(() => steps.map((s) => cameraFor(s.area ?? s.box, s.zoom)), [steps]);
  const starts = timeline.windows.map((w) => w.outStart);
  const cam = cameraAt(starts, cams, t);

  const index = timeline.windows.findIndex((w) => t >= w.outStart && t < w.outEnd);
  const current: StepData | null = index >= 0 ? (steps[index] ?? null) : null;
  const window = index >= 0 ? timeline.windows[index] : undefined;
  const finalCam = index >= 0 ? (cams[index] ?? IDENTITY) : IDENTITY;
  const src = staticFile(`${data.id}/${data.video}`);

  const overlay =
    current && window ? (
      <StepOverlay step={current} total={steps.length} labels={labels} cam={cam} finalCam={finalCam} local={t - window.outStart} duration={window.outEnd - window.outStart} />
    ) : null;

  const progress = current && window ? (index + Math.min(1, (t - window.outStart) / (window.outEnd - window.outStart))) / steps.length : 1;

  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: '0 0',
          transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`,
        }}
      >
        {timeline.segments.map((seg) => {
          const video = <OffthreadVideo src={src} startFrom={seg.clipFrom} muted style={{ width: W, height: H }} />;
          return (
            <Sequence key={seg.outFrom} from={seg.outFrom} durationInFrames={seg.outLen}>
              {seg.frozen ? <Freeze frame={0}>{video}</Freeze> : video}
            </Sequence>
          );
        })}
      </div>
      {overlay}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: 'rgba(0,0,0,0.18)' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, [labels.dir === 'rtl' ? 'right' : 'left']: 0, width: `${progress * 100}%`, background: COLORS.amber }} />
      </div>
    </AbsoluteFill>
  );
};

export const Training = ({ data, nextTitle, totalVideos }: TrainingProps) => {
  const labels = labelsFor(data.lang);
  const timing = timingFor(data);
  const { chapterFrames, mainFrames, summaryFrames, outroFrames } = timing;
  return (
    <AbsoluteFill style={{ background: COLORS.brandDarker, direction: labels.dir }}>
      <Sequence from={0} durationInFrames={chapterFrames}>
        <Fade frames={10}>
          <ChapterCard
            labels={labels}
            brand={data.brand ?? ''}
            number={data.number}
            total={totalVideos}
            chapter={data.chapter}
            title={data.title}
            subtitle={data.subtitle}
          />
        </Fade>
      </Sequence>
      <Sequence from={chapterFrames} durationInFrames={mainFrames}>
        <Fade frames={8}>
          <Main data={data} labels={labels} />
        </Fade>
      </Sequence>
      <Sequence from={chapterFrames + mainFrames} durationInFrames={summaryFrames}>
        <Fade frames={10}>
          <SummaryCard items={data.learn} labels={labels} />
        </Fade>
      </Sequence>
      <Sequence from={chapterFrames + mainFrames + summaryFrames} durationInFrames={outroFrames}>
        <Fade frames={10}>
          <Outro nextTitle={nextTitle} labels={labels} />
        </Fade>
      </Sequence>
    </AbsoluteFill>
  );
};
