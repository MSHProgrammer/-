import React, { useState } from 'react';
import { FolderPlus, Plus, Trash2, Edit2, Play, Save, Share2, Sparkles, Flame, Check, ArrowRight } from 'lucide-react';
import { CustomPack, QuestionItem } from '../types/game';
import { getCustomPacks, saveCustomPack, deleteCustomPack, getUserProfile } from '../services/storage';
import { sounds } from '../services/soundEffects';

interface CustomPackCreatorProps {
  onPlayPack: (pack: CustomPack) => void;
}

export const CustomPackCreator: React.FC<CustomPackCreatorProps> = ({ onPlayPack }) => {
  const [packs, setPacks] = useState<CustomPack[]>(getCustomPacks());
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const profile = getUserProfile();
  const [packTitle, setPackTitle] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [packGameType, setPackGameType] = useState<'trivia' | 'taboo' | 'barrah_salfa' | 'party'>('trivia');
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: 'q1',
      gameId: 'trivia_spark',
      category: 'عام',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: ''
    }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddQuestion = () => {
    sounds.playSpark();
    setQuestions([
      ...questions,
      {
        id: 'q_' + Date.now(),
        gameId: packGameType === 'trivia' ? 'trivia_spark' : packGameType === 'taboo' ? 'taboo_words' : 'barrah_salfa',
        category: 'مخصص',
        question: '',
        options: packGameType === 'trivia' ? ['', '', '', ''] : undefined,
        correctAnswer: '',
        forbiddenWords: packGameType === 'taboo' ? ['', '', '', ''] : undefined,
        secretWord: packGameType === 'barrah_salfa' ? '' : undefined
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
    sounds.playSpark();
  };

  const handleSavePack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packTitle.trim() || questions.length === 0) return;

    sounds.playSpark();
    const newPack: CustomPack = {
      id: 'pack_' + Date.now(),
      title: packTitle.trim(),
      author: profile.username || 'صانع محتوى',
      gameType: packGameType,
      description: packDescription.trim() || 'حزمة أسئلة وتحديات مخصصة للجلسة',
      itemCount: questions.length,
      items: questions,
      createdDate: new Date().toLocaleDateString('ar-SA'),
      likes: 1
    };

    saveCustomPack(newPack);
    setPacks(getCustomPacks());
    setIsCreating(false);
    // Reset form
    setPackTitle('');
    setPackDescription('');
  };

  const handleDelete = (packId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الحزمة؟')) {
      deleteCustomPack(packId);
      setPacks(getCustomPacks());
      sounds.playSpark();
    }
  };

  const handleSharePack = (pack: CustomPack) => {
    navigator.clipboard.writeText(JSON.stringify(pack));
    setCopiedId(pack.id);
    sounds.playSpark();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/30 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>صانع الحزم والأسئلة المخصصة</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">اصنع حزمة جلستكم الخاصة</h1>
          <p className="text-xs text-purple-200/70 mt-1">
            صمم أسئلة وتحديات من واقع ذكرياتكم وسواليف ربعكم، والعبوا بها أونلاين أو أوفلاين!
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => { setIsCreating(true); sounds.playSpark(); }}
            className="py-3 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer self-start sm:self-auto"
          >
            <FolderPlus className="w-4 h-4" />
            <span>إنشاء حزمة جديدة</span>
          </button>
        )}
      </div>

      {/* CREATE FORM */}
      {isCreating ? (
        <form onSubmit={handleSavePack} className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">بيانات الحزمة الجديدة</h2>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-purple-400 hover:text-white"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">عنوان الحزمة:</label>
              <input
                type="text"
                required
                value={packTitle}
                onChange={(e) => setPackTitle(e.target.value)}
                placeholder="مثال: أسئلة شلة الاستراحة الخاصة"
                className="w-full bg-black/50 border border-purple-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">نوع اللعبة:</label>
              <select
                value={packGameType}
                onChange={(e) => setPackGameType(e.target.value as any)}
                className="w-full bg-black/50 border border-purple-700/50 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="trivia">أسئلة ومعرفة (س/ج)</option>
                <option value="taboo">ممنوع تقول (كلمات محظورة)</option>
                <option value="barrah_salfa">برا السالفة (كلمات سرية)</option>
                <option value="party">جمعات وضحك (مين فينا)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-300 mb-1.5">وصف الحزمة:</label>
            <input
              type="text"
              value={packDescription}
              onChange={(e) => setPackDescription(e.target.value)}
              placeholder="وصف بسيط لمحتوى هذه الحزمة..."
              className="w-full bg-black/50 border border-purple-700/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Dynamic Questions Builder */}
          <div className="space-y-4 pt-4 border-t border-purple-900/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">الأسئلة والبطاقات ({questions.length})</h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="py-1.5 px-3 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-orange-400 text-xs font-bold flex items-center gap-1 border border-purple-700/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة سؤال آخر</span>
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-purple-900/20 border border-purple-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400">سؤال #{idx + 1}</span>
                    <button
                      type="button"
                      disabled={questions.length <= 1}
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-purple-400 hover:text-red-400 disabled:opacity-20 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[idx].question = e.target.value;
                      setQuestions(updated);
                    }}
                    placeholder={packGameType === 'taboo' ? 'الكلمة المستهدفة للشرح...' : 'نص السؤال أو الموقف...'}
                    className="w-full bg-black/40 border border-purple-700/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />

                  {/* Trivia options builder */}
                  {packGameType === 'trivia' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options?.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const updated = [...questions];
                            if (!updated[idx].options) updated[idx].options = ['', '', '', ''];
                            updated[idx].options![oIdx] = e.target.value;
                            if (oIdx === 0 && !updated[idx].correctAnswer) {
                              updated[idx].correctAnswer = e.target.value;
                            }
                            setQuestions(updated);
                          }}
                          placeholder={`خيار ${oIdx + 1} ${oIdx === 0 ? '(الإجابة الصحيحة)' : ''}`}
                          className={`bg-black/30 border rounded-lg px-2.5 py-1.5 text-xs text-white ${
                            oIdx === 0 ? 'border-emerald-500/50' : 'border-purple-800/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Taboo forbidden words builder */}
                  {packGameType === 'taboo' && (
                    <div className="pt-1">
                      <span className="text-[11px] text-red-400 block mb-1">الكلمات الممنوعة (مفصولة بفواصل):</span>
                      <input
                        type="text"
                        placeholder="مثال: رز، لحم، دجاج، سفرة"
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].forbiddenWords = e.target.value.split('،').map(w => w.trim()).filter(Boolean);
                          setQuestions(updated);
                        }}
                        className="w-full bg-black/30 border border-red-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الحزمة في مكتبتي</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-3.5 rounded-xl bg-purple-900/40 text-purple-300 font-bold text-xs hover:bg-purple-800 transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : (
        /* PACKS LIST VIEW */
        <div className="space-y-4">
          {packs.length === 0 ? (
            <div className="text-center py-16 bg-purple-950/20 rounded-3xl border border-purple-900/30 space-y-3">
              <FolderPlus className="w-12 h-12 text-purple-400/50 mx-auto" />
              <h3 className="text-base font-bold text-white">لم تقم بإنشاء أي حزمة بعد</h3>
              <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
                أنشئ حزمتك الأولى من الأسئلة الخاصة بالجلسة وتحدَّ بها أصدقاءك!
              </p>
              <button
                onClick={() => { setIsCreating(true); sounds.playSpark(); }}
                className="mt-2 py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء حزمتك الأولى</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="p-5 rounded-2xl bg-purple-950/40 border border-purple-800/30 hover:border-orange-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-orange-400">{pack.gameType}</span>
                      <span className="text-[10px] text-purple-400">{pack.createdDate}</span>
                    </div>
                    <h3 className="text-lg font-black text-white">{pack.title}</h3>
                    <p className="text-xs text-purple-200/70 mt-1">{pack.description}</p>
                    <div className="mt-3 text-xs text-purple-300 font-semibold">
                      عدد الأسئلة: {pack.itemCount} سؤال
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-purple-900/30">
                    <button
                      onClick={() => handleSharePack(pack)}
                      className="py-1.5 px-3 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-300 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedId === pack.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedId === pack.id ? 'تم النسخ!' : 'تصدير JSON'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(pack.id)}
                      className="text-purple-400 hover:text-red-400 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
