export interface HuroofQuestion {
  letter: string;
  question: string;
  answer: string;
  category: string;
  hint?: string;
}

export const HUROOF_DEFAULT_BANK: HuroofQuestion[] = [
  { letter: 'أ', question: 'عاصمة كندا الرسمية؟', answer: 'أوتاوا', category: 'جغرافيا' },
  { letter: 'ب', question: 'عاصمة دولة البحرين ومركزها المالي؟', answer: 'المنامة', category: 'جغرافيا' },
  { letter: 'ت', question: 'دولة عربية عاصمتها تونس الخضراء؟', answer: 'تونس', category: 'جغرافيا' },
  { letter: 'ث', question: 'حيوان ماكر من فصيلة الكلبيات يضرب به المثل في الخداع؟', answer: 'ثعلب', category: 'طبيعة' },
  { letter: 'ج', question: 'عروس البحر الأحمر وثاني كبرى مدن السعودية؟', answer: 'جدة', category: 'مدن ومعالم' },
  { letter: 'ح', question: 'أحد أشهر أكلات الجمعات السعودية الشعبية بلحم الحاشي؟', answer: 'حميس (أو حنيذ)', category: 'أكلات' },
  { letter: 'خ', question: 'صحابي جليل لُقب بسيف الله المسلول؟', answer: 'خالد بن الوليد', category: 'شخصيات وإسلاميات' },
  { letter: 'د', question: 'عاصمة دولة قطر ومستضيفة مونديال 2022؟', answer: 'الدوحة', category: 'مدن' },
  { letter: 'ذ', question: 'حيوان مفترس يشبه الكلب ويعوي في الليل؟', answer: 'ذئب', category: 'حيوانات' },
  { letter: 'ر', question: 'عاصمة المملكة العربية السعودية وقلب نجد؟', answer: 'الرياض', category: 'مدن' },
  { letter: 'ز', question: 'أطول حيوان بري على وجه الأرض بعنقه الشهير؟', answer: 'زرافة', category: 'حيوانات' },
  { letter: 'س', question: 'عاصمة الجمهورية اليمنية الدستورية؟', answer: 'صنعاء', category: 'مدن' },
  { letter: 'ش', question: 'أسرع حيوان بري على وجه الأرض في الانقضاض؟', answer: 'شيتة (فهد)', category: 'حيوانات' },
  { letter: 'ص', question: 'قائد معركة حطين ومحرر بيت المقدس؟', answer: 'صلاح الدين الأيوبي', category: 'تاريخ' },
  { letter: 'ض', question: 'حيوان زاحف صحراوي مشهور في الجزيرة العربية؟', answer: 'ضب', category: 'طبيعة' },
  { letter: 'ط', question: 'مدينة الورد وعروس المصايف السعودية؟', answer: 'الطائف', category: 'مدن' },
  { letter: 'ظ', question: 'حيوان ثديي رشيق سريع من فصيلة البقريات في الصحراء؟', answer: 'ظبي', category: 'حيوانات' },
  { letter: 'ع', question: 'محافظة سعودية تاريخية تشتهر بمدائن صالح وجبال الحجر؟', answer: 'العلا', category: 'آثار' },
  { letter: 'غ', question: 'آخر معاقل الأندلس وسقوط قصر الحمراء عام 1492؟', answer: 'غرناطة', category: 'تاريخ' },
  { letter: 'ف', question: 'أضخم حيوان ثديي بري يمتلك خرطوماً طويلاً؟', answer: 'فيل', category: 'حيوانات' },
  { letter: 'ق', question: 'عاصمة جمهورية مصر العربية وأكبر مدن إفريقيا؟', answer: 'القاهرة', category: 'مدن' },
  { letter: 'ك', question: 'عاصمة دولة الكويت الحبيبة؟', answer: 'الكويت', category: 'مدن' },
  { letter: 'ل', question: 'عاصمة المملكة المتحدة بريطانيا وتقع على نهر التيمز؟', answer: 'لندن', category: 'مدن' },
  { letter: 'م', question: 'أطهر بقاع الأرض وقبلة المسلمين وفيها الكعبة المشرفة؟', answer: 'مكة المكرمة', category: 'إسلاميات' },
  { letter: 'ن', question: 'أطول نهر في العالم الصالح للملاحة الطبيعية؟', answer: 'نهر النيل', category: 'طبيعة' },
  { letter: 'هـ', question: 'نادي القرن الآسيوي وزعيم الكرة السعودية؟', answer: 'الهلال', category: 'رياضة' },
  { letter: 'و', question: 'أقدم وأعرق بطولات التنس الكبرى في بريطانيا على العشب؟', answer: 'ويمبلدون', category: 'رياضة' },
  { letter: 'ي', question: 'بلد تاريخي عريق يلقب باليمن السعيد؟', answer: 'اليمن', category: 'دول' }
];
