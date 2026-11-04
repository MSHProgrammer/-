import React, { useState } from 'react';
import { AlertTriangle, Send, X, CheckCircle2, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { sound } from '../services/soundFx';

interface BugReportModalProps {
  onClose: () => void;
  defaultGame?: string;
  playerName?: string;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({
  onClose,
  defaultGame = 'عام',
  playerName = ''
}) => {
  const [reportType, setReportType] = useState('خلل في لعبة');
  const [gameTitle, setGameTitle] = useState(defaultGame);
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [name, setName] = useState(playerName || (typeof window !== 'undefined' ? localStorage.getItem('jamr_player_name') || '' : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('يرجى كتابة وصف للخلل أو المشكلة التي واجهتك');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    sound.playClick();

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          gameTitle: gameTitle,
          description: description.trim(),
          reporterName: name.trim() || 'لاعب مجهول',
          reporterContact: contact.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playVictory();
        setIsSuccess(true);
      } else {
        setErrorMessage(data.error || 'فشل إرسال البلاغ، يرجى المحاولة لاحقاً');
      }
    } catch {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans text-right">
      <div className="max-w-lg w-full bg-gradient-to-b from-[#210933] via-[#150624] to-[#0d0317] border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-5 animate-in zoom-in-95 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-purple-300 hover:text-white bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-black text-white">وصل بلاغك للإدارة بنجاح! 🚀</h3>
            <p className="text-xs text-purple-200 leading-relaxed max-w-sm mx-auto">
              شكراً جزيلاً لاهتمامك ومساعدتنا في جعل منصة جَمْر بأفضل جودة ممكنة. سيتم فحص الخلل وحله في أقرب وقت.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-sm rounded-xl shadow-lg cursor-pointer"
            >
              إغلاق ومتابعة اللعب 🔥
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-purple-900/60 pb-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  <span>الإبلاغ عن خلل أو مشكلة</span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                    مباشر للإدارة
                  </span>
                </h3>
                <p className="text-xs text-purple-300">
                  واجهت مشكلة في لعبة أو سؤال أو زر؟ أبلغنا وسنصلحه فوراً!
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-red-300 text-xs font-bold text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">نوع البلاغ:</label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value)}
                    className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-white font-bold focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="خلل في لعبة">خلل أو توقف في لعبة</option>
                    <option value="خطأ في سؤال أو إجابة">خطأ في سؤال أو إجابة</option>
                    <option value="مشكلة في الأزرار أو العرض">مشكلة في الأزرار أو الشاشة</option>
                    <option value="مشكلة في الغرف أو الأونلاين">مشكلة في غرف الأونلاين</option>
                    <option value="اقتراح فكرة جديدة">اقتراح فكرة أو لعبة جديدة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">اللعبة المعنية:</label>
                  <select
                    value={gameTitle}
                    onChange={e => setGameTitle(e.target.value)}
                    className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-white font-bold focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="عام">الموقع العام / عام</option>
                    <option value="جمرين">لعبة جَمْرَيْن</option>
                    <option value="حروف مع جمر">لعبة حروف مع جَمْر</option>
                    <option value="برا السالفة">لعبة برا السالفة</option>
                    <option value="مافيا بدون حكم">لعبة مافيا بدون حكم</option>
                    <option value="تقليد الأصوات">لعبة تقليد الأصوات</option>
                    <option value="تلفزيون خربان">لعبة تلفزيون خربان</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-200 mb-1">وصف الخلل بالتفصيل:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="اشرح وش صار معك بالضبط؟ مثلاً: علق السؤال، أو النتيجة ما احتسبت، أو الزر ما يضغط..."
                  className="w-full bg-black/60 border border-purple-700/60 rounded-2xl p-3 text-white font-medium focus:outline-hidden focus:border-amber-400 placeholder:text-purple-400/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-200 mb-1">اسمك أو لقبك:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: محمد"
                    className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-white font-bold focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-200 mb-1">حساب تواصل (اختياري للرد عليك):</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder="يوزر إكس / تليجرام / رقم أو إيميل"
                    className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-white font-bold focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSubmitting || !description.trim()
                    ? 'bg-purple-950/60 text-purple-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-black hover:scale-[1.01]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال البلاغ للإدارة...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال البلاغ للإدارة فوراً ⚠️</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
