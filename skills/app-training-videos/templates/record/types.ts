import type { Locator, Page } from 'playwright';
import type { Helpers } from './helpers.ts';

/** Physical sides (the layout is right-to-left). 'auto' picks the side with the most room. */
export type Side = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center';

export type TargetFn = (page: Page) => Locator;

export type ActFn = (h: Helpers, target: Locator | null) => Promise<void>;

/** What the cursor does in a step. Clicks run after the reading pause; the rest run first. */
export type Act = 'click' | 'hover' | 'none' | { fill: string } | { type: string } | ActFn;

export interface StepDef {
  /** At most six words. */
  title: string;
  /** At most two short lines. */
  text: string;
  tip?: string;
  warn?: string;
  /** The element to point at. Without one the step is a centred card over the screen. */
  target?: TargetFn;
  act?: Act;
  /** Run before the cursor moves (not shown as an action): open a page, wait for data. */
  before?: (h: Helpers) => Promise<void>;
  /** Extra seconds to hold after the reading time. */
  extraHold?: number;
  /** Where the callout sits relative to the target. Default: auto. */
  side?: Side;
  /** Zoom into the target. Default: on for small targets. */
  zoom?: boolean;
  /** Highlight a bigger area than the target (e.g. a whole card). */
  area?: TargetFn;
  /**
   * When the click happens. 'late' (default) clicks after the reading time, which suits
   * clicks that change the page. 'early' clicks while the callout is still up, so the viewer
   * sees what opened (menus, popovers, dialogs).
   */
  clickAt?: 'early' | 'late';
  /** Something that appears after the action (a popover). The callout is kept clear of it. */
  avoid?: TargetFn;
}

export interface VideoDef {
  id: string;
  number: number;
  title: string;
  chapter: string;
  /** Who is signed in when the video starts (a key your `signIn` understands). 'none' = nobody, start on the login page. */
  role: string;
  startPath: string;
  /** What the viewer learned, shown on the summary card. */
  learn: string[];
  /** One line shown on the chapter card under the title. */
  subtitle: string;
  steps: StepDef[];
  /** Runs once after the mock is reset, before recording (for example to switch on a fault). */
  prepare?: (h: Helpers) => Promise<void> | void;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StepRecord {
  index: number;
  title: string;
  text: string;
  tip?: string;
  warn?: string;
  /** Seconds from the start of the recording. */
  tStart: number;
  tClick: number | null;
  tEnd: number;
  /** Fast mode: seconds the viewer needs to read the step, added by the renderer. */
  hold?: number;
  /** Fast mode: recording time the renderer freezes on while the viewer reads. */
  tFreeze?: number;
  box: Box | null;
  area: Box | null;
  avoid: Box | null;
  side: Side;
  zoom: boolean;
  shot: string;
  action: string;
}

export interface VideoRecord {
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
  steps: StepRecord[];
}
