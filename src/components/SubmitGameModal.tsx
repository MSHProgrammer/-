import React, { useState } from 'react';
import { X, Plus, ShieldCheck, CheckCircle2, Lock, User, ArrowLeft, AlertCircle, Flame, Send } from 'lucide-react';
import { GameCategory, DifficultyLevel } from '../types/game';
import { getCurrentUserAccount, loginUser, submitNewGame, getUserProfile } from '../services/storage';
import { sounds } from '../services/soundEffects';

interface SubmitGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitGameModal: React.FC<SubmitGameModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const currentAccount = getCurrentUserAccount();
  const profile = getUserProfile();

  // Auth step state
  const [authName, setAuthName] = useState(currentAccount?.username || profile.username || '');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticatedForGame, setIsAuthenticatedForGame] = useState(Boolean(currentAccount && currentAccount.password));

  // Game Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GameCategory>('party');
  const [rules, setRules] = useState<string[]>([
    'يشرح اللاعب الفكرة في وقت محدد.',
    'يبدأ التحدي والتصويت بين المشاركين.',
    'صاحب أعلى نقاط يفوز بالجولة.'
  ]);
  const [minPlayers, setMinPlayers] = useState(3);
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [durationMinutes, setDurationMinutes] = useState('10 - 15');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('متوسط');
  const [tagsInput, setTagsInput] = useState('حماس، جمعات، ضحك');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle Auth / Registration
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim()) {
      setAuthError('يرجى كتابة الاسم');
      return;
    }
    if (!authPassword.trim() || authPassword.trim().length < 4) {
      setAuthError('كلمة المرور يجب أن تكون 4 خانات على الأقل');
      return;
    }

    const res = loginUser(authName.trim(), authPassword.trim());
    if (res.success) {
      setIsAuthenticatedForGame(true);
      setAuthError(null);
      sounds.playSpark();
    } else {
      setAuthError(res.error || 'حدث خطأ في المصادقة');
      sounds.playWrong();
    }
  };

  // Handle Game Form Submission
  const handleGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    sounds.playCorrect();
    const cleanRules = rules.filter(r => r.trim().length > 0);
    const categoryLabels: Record<GameCategory, string> = {
      trivia: 'أسئلة ومعرفة',
      words: 'كلمات وتخمين',
      deduction: 'خداع واستنتاج',
      drawing: 'رسم وتمثيل',
      party: 'جمعات وضحك'
    };

    submitNewGame({
      title: title.trim(),
      subtitle: subtitle.trim() || 'لعبة مجتمعية مبتكرة',
      category,
      categoryLabel: categoryLabels[category],
      description: description.trim(),
      rules: cleanRules.length > 0 ? cleanRules : ['اتبع تعليمات الشاشة وابدأ الجولة.'],
      minPlayers,
      maxPlayers,
      durationMinutes,
      difficulty,
      tags: tagsInput.split('،').map(t => t.trim()).filter(Boolean),
      authorUsername: authName || profile.username || 'مبتكر ألعاب'
    });

    setSubmittedSuccess(true);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#180e2f] to-[#0c0817] border-2 border-purple-700/50 p-6 sm:p-8 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute left-5 top-5 p-2 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: AUTHENTICATION CHECK */}
        {!isAuthenticatedForGame && !submittedSuccess ? (
          <div className="max-w-md mx-auto py-6 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">تسجيل الدخول لإضافة لعبتك</h2>
              <p className="text-xs text-purple-200/80 mt-1">
                لضمان حقوق المبتكرين ومتابعة مراجعة اللعبة من الإدارة، أدخل اسمك وكلمة المرور (إذا كان الحساب جديداً سيتم إنشاؤه فوراً بنفس الطريقة).
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-xs text-red-200 flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">الاسم المستعار:</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="اسمك في المنصة..."
                  className="w-full bg-black/50 border border-purple-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">كلمة السر (4 خانات على الأقل):</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-purple-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer mt-2"
              >
                المتابعة إلى نموذج اللعبة ➔
              </button>
            </form>
          </div>
        ) : submittedSuccess ? (
          /* STEP 3: SUCCESS STATE */
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-black text-white">تم إرسال لعبتك بنجاح! 🎉</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto leading-relaxed">
              لعبتك <strong className="text-orange-400">«{title}»</strong> الآن <span className="underline font-bold text-amber-300">تحت المراجعة</span> لدى إدارة جَمْر. فور اعتمادها ومطابقتها للمعايير، ستظهر مباشرة في مكتبة الألعاب لجميع اللاعبين!
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="py-3 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                إغلاق والعودة للألعاب
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: GAME SUBMISSION FORM */
          <form onSubmit={handleGameSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>إضافة لعبة جديدة إلى جَمْر</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">تفاصيل لعبتك المقترحة</h2>
              <p className="text-xs text-purple-300/80 mt-1">
                سيتم إرسال اللعبة للإدارة للمراجعة والتدقيق قبل نشرها رسمياً.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">اسم اللعبة *:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: من الأسرع؟"
                  className="w-full bg-black/50 border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">شعار أو وصف مختصر:</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="مثال: سرعة بديهة وضحك مستمر"
                  className="w-full bg-black/50 border border-purple-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">التصنيف:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GameCategory)}
                  className="w-full bg-black/50 border border-purple-700/60 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="party">جمعات وضحك</option>
                  <option value="trivia">أسئلة ومعرفة</option>
                  <option value="words">كلمات وتخمين</option>
                  <option value="deduction">خداع واستنتاج</option>
                  <option value="drawing">رسم وتمثيل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">الصعوبة:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full bg-black/50 border border-purple-700/60 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="سهل">سهل</option>
                  <option value="متوسط">متوسط</option>
                  <option value="حماسي">حماسي</option>
                  <option value="صعب">صعب</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">عدد اللاعبين:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(Number(e.target.value))}
                    className="w-16 bg-black/50 border border-purple-700/60 rounded-xl p-2 text-center text-xs text-white"
                  />
                  <span className="text-xs text-purple-400">إلى</span>
                  <input
                    type="number"
                    min={minPlayers}
                    max={20}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-16 bg-black/50 border border-purple-700/60 rounded-xl p-2 text-center text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">شرح فكرة اللعبة بالتفصيل *:</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح كيف تُلعب هذه اللعبة وما هو الهدف منها..."
                className="w-full bg-black/50 border border-purple-700/60 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-300 mb-2">قواعد اللعبة (خطوات متتالية):</label>
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => {
                        const next = [...rules];
                        next[idx] = e.target.value;
                        setRules(next);
                      }}
                      placeholder={`قاعدة #${idx + 1}`}
                      className="flex-1 bg-black/40 border border-purple-800/40 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال اللعبة للمراجعة والاعتماد</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 rounded-xl bg-purple-900/40 text-purple-300 font-bold text-xs hover:bg-purple-800 transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
