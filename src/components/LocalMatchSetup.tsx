import React, { useState } from 'react';
import { Topic, JamrMatchState } from '../types/jamr';
import { Check, Flame, Shuffle, ArrowRight, Settings, Users, Clock, ShieldAlert } from 'lucide-react';
import { sound } from '../services/soundFx';

interface LocalMatchSetupProps {
  availableTopics: Topic[];
  onStartMatch: (match: JamrMatchState) => void;
  onBack: () => void;
}

export const LocalMatchSetup: React.FC<LocalMatchSetupProps> = ({
  availableTopics,
  onStartMatch,
  onBack
}) => {
  const [team1Name, setTeam1Name] = useState('نمور جَمْر');
  const [team1Players, setTeam1Players] = useState('أحمد، سارة، فيصل');
  const [team2Name, setTeam2Name] = useState('صقور النار');
  const [team2Players, setTeam2Players] = useState('خالد، نورة، عمر');

  // Selected 6 topics
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() => {
    return availableTopics.slice(0, 6).map(t => t.id);
  });

  // Settings
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [deductOnWrong, setDeductOnWrong] = useState<boolean>(false);
  const [allowSteal, setAllowSteal] = useState<boolean>(true);
  const [lifelinesEnabled, setLifelinesEnabled] = useState<boolean>(true);
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const toggleTopic = (id: string) => {
    sound.playClick();
    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length <= 1) return; // keep at least 1
      setSelectedTopicIds(selectedTopicIds.filter(tid => tid !== id));
    } else {
      if (selectedTopicIds.length >= 6) {
        // Replace last one if already 6
        const copy = [...selectedTopicIds];
        copy[5] = id;
        setSelectedTopicIds(copy);
      } else {
        setSelectedTopicIds([...selectedTopicIds, id]);
      }
    }
  };

  const handleRandomizeTopics = () => {
    sound.playClick();
    const shuffled = [...availableTopics].sort(() => 0.5 - Math.random());
    setSelectedTopicIds(shuffled.slice(0, 6).map(t => t.id));
  };

  const handleLaunchMatch = () => {
    if (selectedTopicIds.length !== 6) return;
    sound.playTileSelect();

    const chosenTopics = selectedTopicIds
      .map(id => availableTopics.find(t => t.id === id))
      .filter(Boolean) as Topic[];

    const pointDistribution: (200 | 400 | 600)[] = [200, 200, 400, 400, 600, 600];
    const board = chosenTopics.map((topic, c) => {
      return pointDistribution.map((points, r) => ({
        topicId: topic.id,
        questionId: `match_q_${topic.id}_${r}`,
        points,
        rowIdx: r,
        colIdx: c,
        isUsed: false
      }));
    });

    const t1PlayersList = team1Players.split(/[,،]+/).map(p => p.trim()).filter(Boolean);
    const t2PlayersList = team2Players.split(/[,،]+/).map(p => p.trim()).filter(Boolean);

    const match: JamrMatchState = {
      id: 'local_' + Date.now(),
      mode: 'local',
      status: 'playing',
      teams: {
        team1: {
          id: 'team1',
          name: team1Name.trim() || 'الفريق الأول',
          color: '#EA580C',
          accentBg: '#FFF7ED',
          textColor: '#C2410C',
          score: 0,
          players: t1PlayersList.length > 0 ? t1PlayersList : ['الفريق الأول'],
          lifelines: {
            two_answers: lifelinesEnabled,
            call_friend: lifelinesEnabled,
            pitfall: lifelinesEnabled,
            bench_player: lifelinesEnabled,
            the_trap: lifelinesEnabled
          }
        },
        team2: {
          id: 'team2',
          name: team2Name.trim() || 'الفريق الثاني',
          color: '#DC2626',
          accentBg: '#FEF2F2',
          textColor: '#B91C1C',
          score: 0,
          players: t2PlayersList.length > 0 ? t2PlayersList : ['الفريق الثاني'],
          lifelines: {
            two_answers: lifelinesEnabled,
            call_friend: lifelinesEnabled,
            pitfall: lifelinesEnabled,
            bench_player: lifelinesEnabled,
            the_trap: lifelinesEnabled
          }
        }
      },
      currentTurn: 'team1',
      topics: chosenTopics,
      board,
      settings: {
        timerSeconds,
        deductOnWrong,
        allowSteal,
        lifelinesEnabled,
        tieBreakerEnabled: true
      },
      activeQuestion: null,
      history: [
        {
          id: 'h_init',
          timestamp: Date.now(),
          action: 'انطلاق المباراة',
          note: `بدأت المواجهة بين ${team1Name} و ${team2Name}`
        }
      ]
    };

    onStartMatch(match);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 text-right">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-600 fill-orange-500" />
            <span>إعداد مباراة جَمْر المحلية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">اضبط أسماء الفريقين واختر 6 مواضيع منوعة لبدء التحدي</p>
        </div>

        <button
          onClick={handleLaunchMatch}
          disabled={selectedTopicIds.length !== 6}
          className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <span>ولّع المباراة 🔥</span>
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Teams Setup Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Team 1 Card */}
          <div className="bg-white rounded-2xl p-5 border-2 border-orange-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg">
                الفريق الأول (البداية)
              </span>
              <Users className="w-5 h-5 text-orange-600" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفريق الأول:</label>
                <input
                  type="text"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-orange-200 focus:border-orange-500 focus:outline-hidden text-sm font-bold text-slate-800 bg-orange-50/30"
                  placeholder="مثال: نمور جَمْر"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">أسماء اللاعبين (اختياري، مفصولة بفواصل):</label>
                <input
                  type="text"
                  value={team1Players}
                  onChange={(e) => setTeam1Players(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-hidden text-xs text-slate-700 bg-slate-50/50"
                  placeholder="أحمد، سارة، فيصل"
                />
              </div>
            </div>
          </div>

          {/* Team 2 Card */}
          <div className="bg-white rounded-2xl p-5 border-2 border-red-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black px-2.5 py-1 bg-red-100 text-red-800 rounded-lg">
                الفريق الثاني
              </span>
              <Users className="w-5 h-5 text-red-600" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفريق الثاني:</label>
                <input
                  type="text"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-red-200 focus:border-red-500 focus:outline-hidden text-sm font-bold text-slate-800 bg-red-50/30"
                  placeholder="مثال: صقور النار"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">أسماء اللاعبين (اختياري، مفصولة بفواصل):</label>
                <input
                  type="text"
                  value={team2Players}
                  onChange={(e) => setTeam2Players(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-red-500 focus:outline-hidden text-xs text-slate-700 bg-slate-50/50"
                  placeholder="خالد، نورة، عمر"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Topic Selection Grid */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">اختر 6 مواضيع للمباراة</h3>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  selectedTopicIds.length === 6 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {selectedTopicIds.length} من 6 مختارة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">ستشكل هذه المواضيع الستة أعمدة اللوحة (لكل موضوع 6 أسئلة بقيم 200 و400 و600)</p>
            </div>

            <button
              onClick={handleRandomizeTopics}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-700 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>اختيار عشوائي 6 مواضيع</span>
            </button>
          </div>

          {/* Section Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-3 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setSectionFilter('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sectionFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              جميع الأقسام ({availableTopics.length})
            </button>
            {Array.from(new Set(availableTopics.map(t => t.category))).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSectionFilter(cat);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sectionFilter === cat
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableTopics
              .filter(topic => sectionFilter === 'all' || topic.category === sectionFilter || topic.sectionId === sectionFilter)
              .map((topic) => {
              const isSelected = selectedTopicIds.includes(topic.id);
              const selectionIndex = selectedTopicIds.indexOf(topic.id) + 1;

              return (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer select-none text-right flex flex-col ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-400/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="relative h-20 w-full overflow-hidden bg-slate-100">
                    <img
                      src={topic.coverImage}
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black shadow-md">
                        {selectionIndex}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                      {topic.category}
                    </span>
                  </div>

                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">
                      {topic.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">6 أسئلة</span>
                      {isSelected ? (
                        <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>مختار</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">انقر للتحديد</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Match Rules & Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <h3 className="text-base font-black text-slate-900">إعدادات وقواعد المباراة</h3>
          </div>

          {/* Prominent Optional Lifelines Choice */}
          <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="block text-xs font-black text-slate-900 mb-0.5">وسائل المساعدة (المساعدات):</span>
              <span className="text-[11px] text-slate-600 leading-relaxed">
                المساعدات اختيارية تماماً وليست إجبارية. يمكنك إيقافها لخوض تحدٍ نقي يعتمد كلياً على المعلومات والسرعة.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setLifelinesEnabled(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  lifelinesEnabled
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مفعلة 🔥 (5 وسائل)
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setLifelinesEnabled(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  !lifelinesEnabled
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                بدون مساعدات 🚫 (لعب صافي)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Timer Selection */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span>مؤقت الإجابة:</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setTimerSeconds(sec);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timerSeconds === sec
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {sec}ث
                  </button>
                ))}
              </div>
            </div>

            {/* Deduct points on wrong answer */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-800">خصم النقاط عند الخطأ:</span>
                <span className="text-[10px] text-slate-500">خصم قيمة السؤال إن أخطأ الفريق</span>
              </div>
              <input
                type="checkbox"
                checked={deductOnWrong}
                onChange={(e) => {
                  sound.playClick();
                  setDeductOnWrong(e.target.checked);
                }}
                className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
              />
            </div>

            {/* Steal question */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-800">إمكانية السرقة:</span>
                <span className="text-[10px] text-slate-500">يحق للخصم الإجابة إن تعثر الفريق</span>
              </div>
              <input
                type="checkbox"
                checked={allowSteal}
                onChange={(e) => {
                  sound.playClick();
                  setAllowSteal(e.target.checked);
                }}
                className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Start Game Button (Mobile & Desktop) */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLaunchMatch}
            disabled={selectedTopicIds.length !== 6}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-orange-500/25 transition-all transform active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Flame className="w-6 h-6 fill-white animate-pulse" />
            <span>ولّع المباراة وابدأ اللعب! 🔥</span>
          </button>
        </div>

      </div>
    </div>
  );
};
