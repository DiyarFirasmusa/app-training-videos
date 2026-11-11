import config from '../training.config.ts';

/** Headings for the generated markdown files, in the language of the videos. */
const TEXT = {
  ar: {
    scriptSteps: 'الخطوات', learned: 'ماذا تعلّمت', chapter: 'المجموعة', role: 'الحساب المستخدم', oneLine: 'وصف سطر واحد',
    seconds: 'مدة التسجيل (ثانية)', tip: 'نصيحة', warn: 'تنبيه', playlist: 'قائمة التشغيل',
    playlistIntro: 'شغّل الفيديوهات بالترتيب. لا يوجد صوت: كل الشرح مكتوب على الشاشة.',
    columns: ['#', 'الفيديو', 'المدة', 'الخطوات', 'ماذا يتعلّم المشاهد'], total: (n: number, t: string) => `المجموع: ${n} فيديو، ${t} دقيقة.`,
    guide: 'دليل المستخدم المكتوب', guideIntro: 'هذا الدليل مولَّد من نفس خطوات الفيديوهات، مع لقطة الشاشة لكل خطوة.', contents: 'المحتويات',
  },
  en: {
    scriptSteps: 'Steps', learned: 'What you learned', chapter: 'Group', role: 'Signed in as', oneLine: 'One line',
    seconds: 'Recording length (s)', tip: 'Tip', warn: 'Careful', playlist: 'Playlist',
    playlistIntro: 'Watch the videos in order. There is no sound: everything is explained on screen.',
    columns: ['#', 'Video', 'Length', 'Steps', 'What the viewer learns'], total: (n: number, t: string) => `Total: ${n} videos, ${t}.`,
    guide: 'Written user guide', guideIntro: 'Generated from the same steps as the videos, with a screenshot for each step.', contents: 'Contents',
  },
} as const;

export const text = TEXT[config.lang];
