export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Side = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface StepData {
  index: number;
  title: string;
  text: string;
  tip?: string;
  warn?: string;
  tStart: number;
  tClick: number | null;
  tEnd: number;
  /** Seconds the viewer needs to read the step (fast-mode recordings). */
  hold?: number;
  /** Recording time to freeze on while the viewer reads (fast-mode recordings). */
  tFreeze?: number;
  box: Box | null;
  area: Box | null;
  avoid?: Box | null;
  side: Side;
  zoom: boolean;
  shot: string;
  action: string;
}

export interface VideoData {
  lang?: 'ar' | 'en';
  brand?: string;
  id: string;
  number: number;
  title: string;
  chapter: string;
  subtitle: string;
  learn: string[];
  role: string;
  video: string;
  width: number;
  height: number;
  duration: number;
  steps: StepData[];
}

export type TrainingProps = {
  data: VideoData;
  nextTitle: string | null;
  totalVideos: number;
};
