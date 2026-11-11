import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, SIZE } from './theme.ts';
import { brandBackground, ease, rtl } from './ui.tsx';

import type { Labels } from './labels.ts';

interface Props {
  labels: Labels;
  brand: string;
  number: number;
  total: number;
  chapter: string;
  title: string;
  subtitle: string;
}

export const ChapterCard = ({ labels, brand, number, total, chapter, title, subtitle }: Props) => {
  const frame = useCurrentFrame();
  const rise = (delay: number) => {
    const p = ease(Math.min(1, Math.max(0, (frame - delay) / 24)));
    return { opacity: p, transform: `translateY(${(1 - p) * 40}px)` };
  };
  const barWidth = interpolate(frame, [0, 40], [0, 520], { extrapolateRight: 'clamp', easing: ease });
  return (
    <AbsoluteFill
      style={{ ...rtl, background: brandBackground, color: COLORS.ink, justifyContent: 'center', padding: '0 180px' }}
    >
      <div style={{ ...rise(4), fontSize: SIZE.chapterNumber, fontWeight: 600, color: COLORS.amber }}>
        {labels.chapter(chapter, number, total)}
      </div>
      <div style={{ height: 8, width: barWidth, background: COLORS.amber, borderRadius: 4, margin: '28px 0' }} />
      <div style={{ ...rise(12), fontSize: SIZE.chapterTitle, fontWeight: 800, lineHeight: 1.25, maxWidth: 1500 }}>
        {title}
      </div>
      <div style={{ ...rise(22), fontSize: SIZE.chapterSub, fontWeight: 500, color: COLORS.inkSoft, marginTop: 28, maxWidth: 1400 }}>
        {subtitle}
      </div>
      <div style={{ position: 'absolute', bottom: 70, insetInlineStart: 180, fontSize: 40, fontWeight: 600, color: COLORS.inkSoft, opacity: 0.85 }}>
        {labels.course(brand)}
      </div>
    </AbsoluteFill>
  );
};
