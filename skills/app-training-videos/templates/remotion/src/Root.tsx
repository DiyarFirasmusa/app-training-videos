import { Composition } from 'remotion';
import { Training, timingFor } from './Training.tsx';
import { FPS, H, W } from './theme.ts';
import type { TrainingProps } from './types.ts';

const placeholder: TrainingProps = {
  totalVideos: 1,
  nextTitle: null,
  data: {
    id: 'placeholder',
    number: 1,
    title: 'عنوان الفيديو',
    chapter: 'البداية',
    subtitle: 'وصف قصير',
    learn: ['نقطة أولى'],
    role: 'none',
    video: 'raw.webm',
    width: W,
    height: H,
    duration: 10,
    steps: [],
  },
};

export const Root = () => (
  <Composition
    id="Training"
    component={Training}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={300}
    defaultProps={placeholder}
    calculateMetadata={({ props }) => ({ durationInFrames: timingFor(props.data).total })}
  />
);
