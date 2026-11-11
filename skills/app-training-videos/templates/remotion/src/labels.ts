export type Lang = 'ar' | 'en';

export interface Labels {
  dir: 'rtl' | 'ltr';
  step: (index: number, total: number) => string;
  tip: string;
  warn: string;
  chapter: (chapter: string, number: number, total: number) => string;
  summary: string;
  outroDone: string;
  outroNext: string;
  outroEnd: string;
  outroAgain: string;
  course: (brand: string) => string;
}

export const LABELS: Record<Lang, Labels> = {
  ar: {
    dir: 'rtl',
    step: (i, n) => `الخطوة ${i} من ${n}`,
    tip: 'نصيحة: ',
    warn: 'تنبيه: ',
    chapter: (c, n, t) => `${c} · الفيديو ${n} من ${t}`,
    summary: 'ماذا تعلّمت في هذا الفيديو؟',
    outroDone: 'أحسنت!',
    outroNext: 'في الفيديو التالي',
    outroEnd: 'انتهت هذه السلسلة',
    outroAgain: 'أعد أي فيديو متى احتجت إليه',
    course: (brand) => `${brand} · دورة تدريبية للمستخدم الجديد`,
  },
  en: {
    dir: 'ltr',
    step: (i, n) => `Step ${i} of ${n}`,
    tip: 'Tip: ',
    warn: 'Careful: ',
    chapter: (c, n, t) => `${c} · Video ${n} of ${t}`,
    summary: 'What you learned in this video',
    outroDone: 'Well done!',
    outroNext: 'Next video',
    outroEnd: 'End of the series',
    outroAgain: 'Replay any video whenever you need it',
    course: (brand) => `${brand} · Training course for new users`,
  },
};

export const labelsFor = (lang: Lang | undefined): Labels => LABELS[lang ?? 'ar'];
