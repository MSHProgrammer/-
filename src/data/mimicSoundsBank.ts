export interface MimicSoundItem {
  id: string;
  title: string;
  category: 'ميمز وترند' | 'أصوات حيوانات' | 'كرتون وأفلام' | 'مواقف ومؤثرات' | string;
  description: string;
  soundType: 'bark' | 'meow' | 'rooster' | 'car_horn' | 'laugh' | 'boing' | 'gasp' | 'scream' | string;
  audioClipText: string;
  targetDurationSec: number;
  audioUrl?: string;
  icon?: string;
}

export const MIMIC_SOUNDS_BANK: MimicSoundItem[] = [
  {
    id: 'mimic-1',
    title: 'نباح الكلب المصدوم (Aha Meme)',
    category: 'ميمز وترند',
    description: 'نباح متقطع وسريع صار ترند عالمي بكل تيك توك!',
    soundType: 'bark',
    audioClipText: 'آهاهاهاهاهاها! 🐶',
    targetDurationSec: 5
  },
  {
    id: 'mimic-2',
    title: 'مياو القطة الجائعة',
    category: 'أصوات حيوانات',
    description: 'مياو ناعم مع مدة حزينة تكسر الخاطر',
    soundType: 'meow',
    audioClipText: 'ميااااااو.. ميااو! 🐱',
    targetDurationSec: 4
  },
  {
    id: 'mimic-3',
    title: 'صياح الديك وقت الفجر',
    category: 'أصوات حيوانات',
    description: 'صياح قوي يهز الديوانية ويصحي النايمين',
    soundType: 'rooster',
    audioClipText: 'كوكوكووووووو! 🐓',
    targetDurationSec: 5
  },
  {
    id: 'mimic-4',
    title: 'بوري الددسن القديم (بيم بيم)',
    category: 'مواقف ومؤثرات',
    description: 'بوري مزعج بنغمتين حادتين في شارع ضيق',
    soundType: 'car_horn',
    audioClipText: 'تيت تييييييت! 🚗',
    targetDurationSec: 4
  },
  {
    id: 'mimic-5',
    title: 'ضحكة الشريرة الكرتونية',
    category: 'كرتون وأفلام',
    description: 'ضحكة قهقهة متصاعدة وشريرة من الأعماق',
    soundType: 'laugh',
    audioClipText: 'مواهاهاهاهاهاها! 😈',
    targetDurationSec: 6
  },
  {
    id: 'mimic-6',
    title: 'أوووه ماي قاد (Ooh My God)',
    category: 'ميمز وترند',
    description: 'صرخة الميم الشهيرة بالعيون المفتوحة',
    soundType: 'scream',
    audioClipText: 'أووووووه ماي قاااااد! 😱',
    targetDurationSec: 4
  },
  {
    id: 'mimic-7',
    title: 'صوت الزنبرك والقفزة (Boing!)',
    category: 'مواقف ومؤثرات',
    description: 'صوت قفزة كرتونية مطاطية ترتفع في النغمة',
    soundType: 'boing',
    audioClipText: 'بوييييينغ طرااااخ! 🌀',
    targetDurationSec: 3
  },
  {
    id: 'mimic-8',
    title: 'شهقة الصدمة والخرعة',
    category: 'مواقف ومؤثرات',
    description: 'شهقة قوية سريعة تسحب الهواء مع فتح الفم',
    soundType: 'gasp',
    audioClipText: 'شهههههقة مع تصفيق يدين! 😳',
    targetDurationSec: 3
  }
];
