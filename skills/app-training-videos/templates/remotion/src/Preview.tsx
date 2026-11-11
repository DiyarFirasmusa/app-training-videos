import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ChapterCard } from './ChapterCard.tsx';
import { Outro } from './Outro.tsx';
import { SummaryCard } from './SummaryCard.tsx';
import { StepOverlay } from './StepOverlay.tsx';
import { cameraFor, IDENTITY } from './layout.ts';
import { labelsFor, type Lang } from './labels.ts';
import { COLORS, H, W } from './theme.ts';
import type { StepData } from './types.ts';

export type PreviewProps = {
  kind: 'chapter' | 'summary' | 'outro' | 'below-tip' | 'left-warn' | 'welcome' | 'zoom';
  lang: Lang;
  /** A screenshot (path inside the public dir) to use as the app picture; none = a plain placeholder. */
  background: string | null;
  brand: string;
};

const COPY = {
  ar: {
    title: 'عنوان الخطوة هنا', text: 'شرح قصير في سطرين على الأكثر، بكلمات بسيطة.', tip: 'نصيحة قصيرة تساعد المستخدم.', warn: 'تنبيه من خطأ شائع.',
    video: 'عنوان الفيديو', sub: 'سطر واحد يصف ما سيتعلمه المشاهد', learn: ['النقطة الأولى', 'النقطة الثانية', 'النقطة الثالثة'], chapter: 'المجموعة',
  },
  en: {
    title: 'Step title goes here', text: 'A short explanation in two lines at most, in plain words.', tip: 'A short tip that helps the user.', warn: 'A warning about a common mistake.',
    video: 'Video title', sub: 'One line saying what the viewer will learn', learn: ['First point', 'Second point', 'Third point'], chapter: 'Group',
  },
} as const;

const base = (index: number, copy: (typeof COPY)[Lang]): StepData => ({
  index, title: copy.title, text: copy.text, tStart: 0, tClick: null, tEnd: 8, box: null, area: null, side: 'auto', zoom: false, shot: '', action: 'click',
});

/** One design sample, drawn at a settled moment. Used by tools/design-preview.ts, never in a real video. */
export const Preview = ({ kind, lang, background, brand }: PreviewProps) => {
  const labels = labelsFor(lang);
  const copy = COPY[lang];
  if (kind === 'chapter') {
    return <ChapterCard labels={labels} brand={brand} number={3} total={18} chapter={copy.chapter} title={copy.video} subtitle={copy.sub} />;
  }
  if (kind === 'summary') {
    return <SummaryCard items={[...copy.learn]} labels={labels} />;
  }
  if (kind === 'outro') {
    return <Outro nextTitle={copy.video} labels={labels} />;
  }
  const rtl = labels.dir === 'rtl';
  const sx = (x: number, w: number) => (rtl ? W - x - w : x);
  const steps: Record<string, StepData> = {
    'below-tip': { ...base(2, copy), tip: copy.tip, box: { x: sx(560, 420), y: 260, w: 420, h: 56 }, side: 'bottom' },
    'left-warn': { ...base(5, copy), warn: copy.warn, box: { x: sx(1500, 300), y: 520, w: 300, h: 54 }, side: rtl ? 'right' : 'left' },
    welcome: { ...base(1, copy), box: null, action: 'none' },
    zoom: { ...base(7, copy), box: { x: sx(1180, 200), y: 120, w: 200, h: 48 }, side: 'bottom', zoom: true },
  };
  const step = steps[kind] ?? steps.welcome!;
  const cam = cameraFor(step.area ?? step.box, step.zoom);
  const camera = cam ?? IDENTITY;
  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden', direction: labels.dir }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.s})` }}>
        {background ? (
          <Img src={staticFile(background)} style={{ width: W, height: H }} />
        ) : (
          <div style={{ width: W, height: H, background: 'repeating-linear-gradient(0deg,#f3eef0 0 70px,#ece5e8 70px 72px)' }} />
        )}
      </div>
      <StepOverlay step={step} total={18} labels={labels} cam={camera} finalCam={camera} local={3} duration={8} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: COLORS.amber, opacity: 0.4 }} />
    </AbsoluteFill>
  );
};
