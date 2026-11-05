import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Phone, HelpCircle, Flame, ArrowRight, 
  RotateCcw, Trophy, Award, CheckCircle2, XCircle, ShieldAlert, 
  Zap, Search, Shuffle, Filter, Check, Edit3, X, Volume2, HelpCircle as HelpIcon 
} from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { ALL_100_JAMRAIN_TOPICS, JamrainTopicItem, JamrainTopicQuestion, drawRandomQuestionForTopic } from '../../data/jamrain100Topics';
import { JamrainIllustration } from './JamrainIllustrations';
import { QuestionPoints } from '../../types/jamr';

interface JamrainEngineProps {
  onExit: () => void;
  topics?: any;
  questions?: any;
}

interface TeamState {
  name: string;
  score: number;
  lifelines: {
    call_friend: boolean;
    two_answers: boolean;
    pitfall: boolean; // الحفرة
  };
}

export const JamrainEngine: React.FC<JamrainEngineProps> = ({ onExit }) => {
  // Game Phase: Start directly with Topic Selection ('pick_topics') before entering the board!
  const [gameState, setGameState] = useState<'pick_topics' | 'board'>('pick_topics');

  // 100 Topics Selection State: Each team picks 3 topics (Total = 6 topics)
  const [team1TopicIds, setTeam1TopicIds] = useState<string[]>(['t-animals', 't-science', 't-snacks']);
  const [team2TopicIds, setTeam2TopicIds] = useState<string[]>(['t-general', 't-worldcup', 't-choices']);
  const [activePickerTeam, setActivePickerTeam] = useState<0 | 1>(0);
  const [showTopicPicker, setShowTopicPicker] = useState<boolean>(false);
  const [topicSearch, setTopicSearch] = useState<string>('');
  const [topicCategoryFilter, setTopicCategoryFilter] = useState<string>('all');

  // Combined 6 topics for the board
  const selectedTopicIds = [...team1TopicIds, ...team2TopicIds];

  // Teams Setup
  const [teams, setTeams] = useState<[TeamState, TeamState]>([
    {
      name: 'فريق الصقور (أ)',
      score: 0,
      lifelines: { call_friend: true, two_answers: true, pitfall: true }
    },
    {
      name: 'فريق الذيابة (ب)',
      score: 0,
      lifelines: { call_friend: true, two_answers: true, pitfall: true }
    }
  ]);
  const [activeTeamIdx, setActiveTeamIdx] = useState<0 | 1>(0);

  // Rename team inline
  const [isRenamingTeam, setIsRenamingTeam] = useState<0 | 1 | null>(null);
  const [editTeamName, setEditTeamName] = useState('');

  // Solved Tiles: key is `${topicIdx}-${side}-${points}` => team index that won it or 'missed'
  const [solvedTiles, setSolvedTiles] = useState<Record<string, { winner: 0 | 1 | 'missed'; points: number }>>({});

  // Active question modal state
  const [activeQuestion, setActiveQuestion] = useState<{
    topic: JamrainTopicItem;
    topicIdx: number;
    side: 'left' | 'right';
    points: QuestionPoints;
    qData: JamrainTopicQuestion;
    tileKey: string;
  } | null>(null);

  // Modal Stage: 'question' -> 'answer_revealed' -> 'scoring_decision'
  const [questionStage, setQuestionStage] = useState<'question' | 'answer_revealed' | 'scoring_decision'>('question');

  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeLifeline, setActiveLifeline] = useState<'call_friend' | 'two_answers' | 'pitfall' | null>(null);
  const [winnerTeam, setWinnerTeam] = useState<string | null>(null);

  // Retrieve current active 6 topic objects
  const active6Topics: JamrainTopicItem[] = selectedTopicIds
    .map(id => ALL_100_JAMRAIN_TOPICS.find(t => t.id === id))
    .filter(Boolean) as JamrainTopicItem[];

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0 && questionStage === 'question') {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            sound.playTick(true);
            return 0;
          }
          if (s <= 5) sound.playTick(true);
          else if (s % 5 === 0) sound.playTick(false);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, questionStage]);

  // Keep track of used questions to avoid repetition
  const [usedQuestionIds] = useState<Set<string>>(() => new Set());

  // Handle tile click on board
  const handleTileClick = (topicIdx: number, side: 'left' | 'right', points: QuestionPoints) => {
    const tileKey = `${topicIdx}-${side}-${points}`;
    if (solvedTiles[tileKey]) return;

    const topic = active6Topics[topicIdx];
    if (!topic) return;

    // Draw dynamically from the 20 questions pool for that topic & difficulty tier
    const qData = drawRandomQuestionForTopic(topic, points, usedQuestionIds);

    sound.playTileSelect();
    setActiveQuestion({
      topic,
      topicIdx,
      side,
      points,
      qData,
      tileKey
    });

    setQuestionStage('question');
    setTimerSeconds(60);
    setTimerRunning(true);
    setActiveLifeline(null);
  };

  const handleUseLifeline = (type: 'call_friend' | 'two_answers' | 'pitfall') => {
    const currentTeam = teams[activeTeamIdx];
    if (!currentTeam.lifelines[type] || activeLifeline) return;

    sound.playClick();
    setActiveLifeline(type);

    setTeams(prev => {
      const next = [...prev] as [TeamState, TeamState];
      next[activeTeamIdx].lifelines[type] = false;
      return next;
    });

    if (type === 'call_friend') {
      setTimerSeconds(s => s + 30);
    }
  };

  // Resolve question with the 3 choices: 'none' (محد جاوب), 0 (فريق 1 جاوب), 1 (فريق 2 جاوب)
  const handleResolveQuestion = (winner: 'none' | 0 | 1) => {
    if (!activeQuestion) return;
    const tileKey = activeQuestion.tileKey;
    const points = activeQuestion.points;

    if (winner === 'none') {
      sound.playWrong();
      setSolvedTiles(prev => ({
        ...prev,
        [tileKey]: { winner: 'missed', points }
      }));
    } else {
      sound.playVictory();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      const opposingTeamIdx = winner === 0 ? 1 : 0;

      setTeams(prev => {
        const next = [...prev] as [TeamState, TeamState];
        if (activeLifeline === 'pitfall') {
          // Pitfall: Double points for winner, opponent loses points!
          next[winner].score += points * 2;
          next[opposingTeamIdx].score = Math.max(0, next[opposingTeamIdx].score - points);
        } else {
          next[winner].score += points;
        }
        return next;
      });

      setSolvedTiles(prev => ({
        ...prev,
        [tileKey]: { winner, points }
      }));
    }

    // Switch turn to opposing team
    setActiveTeamIdx(prev => (prev === 0 ? 1 : 0));
    setActiveQuestion(null);
  };

  // Random 3 topics for each team (Total 6)
  const handlePickRandom3ForEach = () => {
    sound.playClick();
    const shuffled = [...ALL_100_JAMRAIN_TOPICS].sort(() => 0.5 - Math.random());
    setTeam1TopicIds(shuffled.slice(0, 3).map(t => t.id));
    setTeam2TopicIds(shuffled.slice(3, 6).map(t => t.id));
    setSolvedTiles({});
  };

  // Toggle topic selection for active team (up to 3)
  const handleToggleTopic = (id: string) => {
    sound.playClick();
    if (activePickerTeam === 0) {
      if (team1TopicIds.includes(id)) {
        if (team1TopicIds.length <= 1) return;
        setTeam1TopicIds(prev => prev.filter(tId => tId !== id));
      } else {
        if (team2TopicIds.includes(id)) {
          // If already chosen by team 2, swap out
          setTeam2TopicIds(prev => prev.filter(tId => tId !== id));
        }
        if (team1TopicIds.length >= 3) {
          setTeam1TopicIds(prev => [...prev.slice(0, 2), id]);
        } else {
          setTeam1TopicIds(prev => [...prev, id]);
        }
      }
    } else {
      if (team2TopicIds.includes(id)) {
        if (team2TopicIds.length <= 1) return;
        setTeam2TopicIds(prev => prev.filter(tId => tId !== id));
      } else {
        if (team1TopicIds.includes(id)) {
          setTeam1TopicIds(prev => prev.filter(tId => tId !== id));
        }
        if (team2TopicIds.length >= 3) {
          setTeam2TopicIds(prev => [...prev.slice(0, 2), id]);
        } else {
          setTeam2TopicIds(prev => [...prev, id]);
        }
      }
    }
  };

  // Save renamed team
  const handleSaveTeamName = () => {
    if (isRenamingTeam !== null && editTeamName.trim()) {
      setTeams(prev => {
        const next = [...prev] as [TeamState, TeamState];
        next[isRenamingTeam].name = editTeamName.trim();
        return next;
      });
      setIsRenamingTeam(null);
      sound.playClick();
    }
  };

  // Check Game Winner
  const handleEndMatch = () => {
    sound.playVictory();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    if (teams[0].score > teams[1].score) {
      setWinnerTeam(teams[0].name);
    } else if (teams[1].score > teams[0].score) {
      setWinnerTeam(teams[1].name);
    } else {
      setWinnerTeam('تعادل الفريقين!');
    }
  };

  // =========================================================================
  // 1. DEDICATED TOPIC SELECTION SCREEN (FIRST STEP BEFORE BOARD)
  // =========================================================================
  if (gameState === 'pick_topics') {
    return (
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 select-none font-sans text-white text-right space-y-6 animate-in fade-in">
        {/* Top Header */}
        <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-[#240e42] via-[#16062a] to-[#2b0c38] border-2 border-amber-500/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer"
              title="الخروج للقائمة الرئيسية"
            >
              ✕
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>اختيار مواضيع جَمْرَيْن (100 موضوع)</span>
                <span className="text-xs bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-black">
                  الخطوة الأولى
                </span>
              </h2>
              <p className="text-xs text-amber-300 font-bold mt-1">
                يختار كل فريق 3 مواضيع (المجموع 6 مواضيع على اللوحة) للتنافس عليها!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePickRandom3ForEach}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/60 font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span>اختيار عشوائي للطرفين 🎲</span>
            </button>

            <button
              disabled={team1TopicIds.length !== 3 || team2TopicIds.length !== 3}
              onClick={() => {
                sound.playVictory();
                setGameState('board');
              }}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                team1TopicIds.length === 3 && team2TopicIds.length === 3
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-black hover:scale-105 shadow-orange-500/30'
                  : 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>بدء اللعبة بالمواضيع الـ 6 🔥</span>
            </button>
          </div>
        </div>

        {/* Selected Topics Slots for Both Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team 1 Slots */}
          <div
            onClick={() => { sound.playClick(); setActivePickerTeam(0); }}
            className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer ${
              activePickerTeam === 0
                ? 'bg-gradient-to-b from-[#2e144a] to-[#160829] border-amber-400 ring-2 ring-amber-400/30 shadow-2xl scale-[1.01]'
                : 'bg-[#120520] border-purple-900/50 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-purple-900/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-sm font-black text-white">{teams[0].name}</span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full">
                  {team1TopicIds.length} من 3
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setIsRenamingTeam(0);
                  setEditTeamName(teams[0].name);
                }}
                className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>تعديل الاسم</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((idx) => {
                const topicId = team1TopicIds[idx];
                const topic = ALL_100_JAMRAIN_TOPICS.find(t => t.id === topicId);
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center min-h-[90px] relative ${
                      topic
                        ? 'bg-amber-500/20 border-amber-400/80 text-white shadow-inner'
                        : 'bg-black/40 border-dashed border-purple-800/60 text-purple-400'
                    }`}
                  >
                    {topic ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTopic(topic.id);
                          }}
                          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-amber-300 hover:bg-red-600 hover:text-white flex items-center justify-center text-[10px] cursor-pointer"
                          title="إزالة الموضوع"
                        >
                          ✕
                        </button>
                        <span className="text-xl mb-1">{topic.icon}</span>
                        <span className="text-xs font-black text-amber-200 line-clamp-2 leading-tight">
                          {topic.title}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-purple-400/60">
                        + اختر موضوع {idx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team 2 Slots */}
          <div
            onClick={() => { sound.playClick(); setActivePickerTeam(1); }}
            className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer ${
              activePickerTeam === 1
                ? 'bg-gradient-to-b from-[#2e144a] to-[#160829] border-purple-400 ring-2 ring-purple-400/30 shadow-2xl scale-[1.01]'
                : 'bg-[#120520] border-purple-900/50 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-purple-900/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-sm font-black text-white">{teams[1].name}</span>
                <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded-full">
                  {team2TopicIds.length} من 3
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setIsRenamingTeam(1);
                  setEditTeamName(teams[1].name);
                }}
                className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>تعديل الاسم</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((idx) => {
                const topicId = team2TopicIds[idx];
                const topic = ALL_100_JAMRAIN_TOPICS.find(t => t.id === topicId);
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center min-h-[90px] relative ${
                      topic
                        ? 'bg-purple-600/25 border-purple-400/80 text-white shadow-inner'
                        : 'bg-black/40 border-dashed border-purple-800/60 text-purple-400'
                    }`}
                  >
                    {topic ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTopic(topic.id);
                          }}
                          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-purple-300 hover:bg-red-600 hover:text-white flex items-center justify-center text-[10px] cursor-pointer"
                          title="إزالة الموضوع"
                        >
                          ✕
                        </button>
                        <span className="text-xl mb-1">{topic.icon}</span>
                        <span className="text-xs font-black text-purple-200 line-clamp-2 leading-tight">
                          {topic.title}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-purple-400/60">
                        + اختر موضوع {idx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Categories Bar & Search Filter */}
        <div className="p-4 rounded-3xl bg-[#120520] border border-purple-900/50 space-y-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {[
              { id: 'all', label: '📌 جميع الـ 100 موضوع' },
              { id: 'sports', label: '⚽ رياضة وكورة' },
              { id: 'cinema', label: '🎬 سينما وتلفزيون' },
              { id: 'science', label: '🔬 علوم واختراعات' },
              { id: 'trivia', label: '💡 ثقافة وعامة' },
              { id: 'gaming', label: '🎮 ألعاب وجيمينج' },
              { id: 'food', label: '🍔 تسالي وأكلات' },
              { id: 'culture', label: '🏛️ تاريخ وتراث' },
              { id: 'islamic', label: '🕌 دين وسيرة' }
            ].map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { sound.playClick(); setTopicCategoryFilter(c.id); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  topicCategoryFilter === c.id
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg scale-105'
                    : 'bg-black/40 text-purple-300 hover:text-white border border-purple-800/40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute right-4 top-3.5" />
            <input
              type="text"
              value={topicSearch}
              onChange={e => setTopicSearch(e.target.value)}
              placeholder="ابحث في المواضيع بالاسم أو الوصف (كأس العالم، سبيستون، حيوانات، شيبسات، سيارات...)"
              className="w-full pr-11 pl-4 py-3 rounded-2xl bg-black/60 border border-purple-700/60 text-xs font-bold text-white placeholder:text-purple-400/40 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* 100 Topics Grid (Cards with VERY CLEAR Names) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {ALL_100_JAMRAIN_TOPICS
            .filter(t => topicCategoryFilter === 'all' || t.category === topicCategoryFilter)
            .filter(t => !topicSearch || t.title.includes(topicSearch) || t.description.includes(topicSearch))
            .map(t => {
              const isTeam1 = team1TopicIds.includes(t.id);
              const isTeam2 = team2TopicIds.includes(t.id);
              const isSelected = isTeam1 || isTeam2;

              return (
                <div
                  key={t.id}
                  onClick={() => handleToggleTopic(t.id)}
                  className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between text-right relative overflow-hidden group ${
                    isTeam1
                      ? 'border-amber-400 bg-amber-500/20 shadow-xl shadow-amber-500/20 scale-[1.02]'
                      : isTeam2
                      ? 'border-purple-400 bg-purple-600/30 shadow-xl shadow-purple-600/20 scale-[1.02]'
                      : 'border-purple-800/40 bg-[#140624] hover:border-amber-400/60 hover:bg-purple-950/40'
                  }`}
                >
                  {/* Selection Badge */}
                  {isSelected && (
                    <div className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full font-black text-[10px] shadow-md flex items-center gap-1 ${
                      isTeam1 ? 'bg-amber-400 text-black' : 'bg-purple-500 text-white'
                    }`}>
                      <Check className="w-3 h-3" />
                      <span>{isTeam1 ? teams[0].name : teams[1].name}</span>
                    </div>
                  )}

                  <div>
                    <div className="text-3xl mb-2">{t.icon || '🔥'}</div>
                    {/* Clear, Bold, Visible Title (No truncation!) */}
                    <h3 className="text-base font-black text-white leading-snug">
                      {t.title}
                    </h3>
                    <span className="text-[11px] text-amber-300 font-bold block mt-1">
                      {t.categoryLabel}
                    </span>
                  </div>

                  <p className="text-xs text-purple-200/80 leading-relaxed mt-2 pt-2 border-t border-purple-900/40">
                    {t.description}
                  </p>
                </div>
              );
            })}
        </div>

        {/* Bottom CTA to start game */}
        <div className="p-4 rounded-3xl bg-[#1a082e] border-2 border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
          <div className="text-xs text-purple-200">
            {team1TopicIds.length === 3 && team2TopicIds.length === 3 ? (
              <span className="text-emerald-400 font-black text-sm">
                ✓ اكتملت اختيارات الفريقين (3 لكل فريق = 6 مواضيع)! اضغط بدء اللعبة للانتقال للوحة.
              </span>
            ) : (
              <span className="text-amber-400 font-bold">
                متبقي: {3 - (activePickerTeam === 0 ? team1TopicIds.length : team2TopicIds.length)} مواضيع لـ {activePickerTeam === 0 ? teams[0].name : teams[1].name}
              </span>
            )}
          </div>

          <button
            disabled={team1TopicIds.length !== 3 || team2TopicIds.length !== 3}
            onClick={() => {
              sound.playVictory();
              setGameState('board');
            }}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              team1TopicIds.length === 3 && team2TopicIds.length === 3
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-black hover:scale-105 shadow-orange-500/30'
                : 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <Flame className="w-5 h-5 fill-current" />
            <span>بدء اللعبة بالمواضيع الستة المختارة 🔥</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 select-none font-sans text-slate-900">
      
      {/* ========================================================================= */}
      {/* THE MAIN JAMRAIN BOARD CONTAINER (REPLICATING THE REFERENCE SCREENSHOT)  */}
      {/* ========================================================================= */}
      <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-[#3c2a82] bg-white flex flex-col">
        
        {/* ==================== 1. TOP PURPLE HEADER BAR ==================== */}
        <div className="bg-[#4c359e] px-4 py-3 sm:py-3.5 flex items-center justify-between text-white border-b-2 border-[#3d2787]">
          {/* Left Exit Button */}
          <button
            onClick={onExit}
            title="الخروج للقائمة"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer text-white font-bold text-lg active:scale-95"
          >
            ✕
          </button>

          {/* Center Match Label (Clean, Elegant - NO logo, NO 'فانوس' logo!) */}
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow-md">
              جَمْرَيْن
            </span>
            <button
              onClick={() => { sound.playClick(); setGameState('pick_topics'); }}
              className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer border border-white/30"
              title="تغيير المواضيع من قائمة الـ 100 موضوع"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-300" />
              <span>المواضيع الـ 100 ⚙️</span>
            </button>
          </div>

          {/* Right Team Turn Badge (Exact style from screenshot: 'دور الفريق: Yousef') */}
          <div className="flex items-center gap-2">
            <div 
              onClick={() => {
                sound.playClick();
                setIsRenamingTeam(activeTeamIdx);
                setEditTeamName(teams[activeTeamIdx].name);
              }}
              className="px-4 py-1.5 rounded-full border-2 border-white/80 bg-white/10 hover:bg-white/20 cursor-pointer flex items-center gap-1.5 text-white font-black text-xs sm:text-sm shadow-sm transition-all"
              title="انقر لتعديل اسم الفريق"
            >
              <span>دور الفريق:</span>
              <span className="text-amber-300 font-black underline decoration-amber-300/60 decoration-dashed">
                {teams[activeTeamIdx].name}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== 2. MAIN 6-TOPICS BOARD (2 ROWS X 3 COLS) ==================== */}
        <div className="p-3 sm:p-6 bg-slate-50 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-4 sm:gap-x-6">
            {active6Topics.slice(0, 6).map((topic, topicIdx) => {
              return (
                <div key={topic.id} className="flex flex-col items-center">
                  
                  {/* Top Black Pill Badge with Topic Name */}
                  <div className="z-10 -mb-3 bg-black text-white px-5 py-1.5 rounded-full shadow-lg border border-black/80 font-black text-xs sm:text-sm tracking-wide text-center min-w-[130px] max-w-[200px] truncate">
                    {topic.title}
                  </div>

                  {/* Topic Card Container (Flanked by Left & Right Point Wings) */}
                  <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
                    
                    {/* LEFT WING: [200, 400, 600] Point Pills */}
                    <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 items-end">
                      {([200, 400, 600] as QuestionPoints[]).map((points) => {
                        const tileKey = `${topicIdx}-left-${points}`;
                        const solved = solvedTiles[tileKey];
                        const isSolved = !!solved;

                        let pillBg = 'bg-[#cbd5e1] hover:bg-[#94a3b8] text-[#dc2626] border-[#94a3b8] shadow-sm';
                        if (solved) {
                          if (solved.winner === 0) pillBg = 'bg-amber-400 text-black border-amber-500 line-through opacity-80';
                          else if (solved.winner === 1) pillBg = 'bg-purple-500 text-white border-purple-700 line-through opacity-80';
                          else pillBg = 'bg-gray-300 text-gray-500 line-through opacity-50';
                        }

                        return (
                          <button
                            key={points}
                            disabled={isSolved}
                            onClick={() => handleTileClick(topicIdx, 'left', points)}
                            className={`w-full max-w-[65px] sm:max-w-[85px] py-2 sm:py-2.5 rounded-full border-2 font-black font-mono text-base sm:text-xl text-center transition-all cursor-pointer active:scale-95 flex items-center justify-center ${pillBg}`}
                          >
                            <span>{points}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* CENTER PURPLE CARD WITH TOPIC ILLUSTRATION */}
                    <div className="w-[110px] h-[130px] sm:w-[140px] sm:h-[160px] bg-[#4c359e] rounded-2xl shadow-xl border-2 border-[#3c2a82] overflow-hidden p-2.5 flex items-center justify-center relative shrink-0">
                      <JamrainIllustration
                        topicTitle={topic.title}
                        type={topic.svgType}
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                      />
                    </div>

                    {/* RIGHT WING: [200, 400, 600] Point Pills */}
                    <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 items-start">
                      {([200, 400, 600] as QuestionPoints[]).map((points) => {
                        const tileKey = `${topicIdx}-right-${points}`;
                        const solved = solvedTiles[tileKey];
                        const isSolved = !!solved;

                        let pillBg = 'bg-[#cbd5e1] hover:bg-[#94a3b8] text-[#dc2626] border-[#94a3b8] shadow-sm';
                        if (solved) {
                          if (solved.winner === 0) pillBg = 'bg-amber-400 text-black border-amber-500 line-through opacity-80';
                          else if (solved.winner === 1) pillBg = 'bg-purple-500 text-white border-purple-700 line-through opacity-80';
                          else pillBg = 'bg-gray-300 text-gray-500 line-through opacity-50';
                        }

                        return (
                          <button
                            key={points}
                            disabled={isSolved}
                            onClick={() => handleTileClick(topicIdx, 'right', points)}
                            className={`w-full max-w-[65px] sm:max-w-[85px] py-2 sm:py-2.5 rounded-full border-2 font-black font-mono text-base sm:text-xl text-center transition-all cursor-pointer active:scale-95 flex items-center justify-center ${pillBg}`}
                          >
                            <span>{points}</span>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================== 3. BOTTOM PURPLE FOOTER BAR ==================== */}
        <div className="bg-[#4c359e] px-4 py-3 flex items-center justify-between text-white border-t-2 border-[#3d2787]">
          
          {/* Team 1 Score Pill (Screenshot style: rounded pill with name and score) */}
          <div 
            onClick={() => {
              sound.playClick();
              setIsRenamingTeam(0);
              setEditTeamName(teams[0].name);
            }}
            className={`px-4 py-1.5 rounded-full border-2 transition-all cursor-pointer flex items-center gap-2 font-mono font-black text-sm sm:text-base ${
              activeTeamIdx === 0
                ? 'border-amber-400 bg-amber-400 text-black shadow-lg scale-105'
                : 'border-white/60 bg-white/10 text-white hover:bg-white/20'
            }`}
            title="انقر لتعديل اسم الفريق 1"
          >
            <span className="font-sans font-black">{teams[0].name}</span>
            <span className="text-base sm:text-lg">{teams[0].score}</span>
          </div>

          {/* Center Match Subtitle */}
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-xs font-black text-white/90">جَمْرَيْن • تحدي الديوانيات الفخم</span>
            <span className="text-[10px] text-amber-300/80">36 سؤالاً في 6 مواضيع مختارة</span>
          </div>

          {/* Team 2 Score Pill */}
          <div 
            onClick={() => {
              sound.playClick();
              setIsRenamingTeam(1);
              setEditTeamName(teams[1].name);
            }}
            className={`px-4 py-1.5 rounded-full border-2 transition-all cursor-pointer flex items-center gap-2 font-mono font-black text-sm sm:text-base ${
              activeTeamIdx === 1
                ? 'border-purple-300 bg-purple-600 text-white shadow-lg scale-105'
                : 'border-white/60 bg-white/10 text-white hover:bg-white/20'
            }`}
            title="انقر لتعديل اسم الفريق 2"
          >
            <span className="font-sans font-black">{teams[1].name}</span>
            <span className="text-base sm:text-lg">{teams[1].score}</span>
          </div>

        </div>

      </div>

      {/* Lifelines Toolbar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="text-amber-400 font-black">وسائل مساعدة {teams[activeTeamIdx].name}:</span>
          <button
            onClick={() => handleUseLifeline('call_friend')}
            disabled={!teams[activeTeamIdx].lifelines.call_friend || !activeQuestion}
            className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              teams[activeTeamIdx].lifelines.call_friend
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 hover:bg-blue-600/50'
                : 'bg-black/20 text-gray-500 border-gray-700 line-through cursor-not-allowed'
            }`}
          >
            📞 صديق (+30 ثانية)
          </button>
          <button
            onClick={() => handleUseLifeline('two_answers')}
            disabled={!teams[activeTeamIdx].lifelines.two_answers || !activeQuestion}
            className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              teams[activeTeamIdx].lifelines.two_answers
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/50'
                : 'bg-black/20 text-gray-500 border-gray-700 line-through cursor-not-allowed'
            }`}
          >
            ✌️ جوابين للسؤال
          </button>
          <button
            onClick={() => handleUseLifeline('pitfall')}
            disabled={!teams[activeTeamIdx].lifelines.pitfall || !activeQuestion}
            className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              teams[activeTeamIdx].lifelines.pitfall
                ? 'bg-red-600/30 text-red-300 border-red-500/50 hover:bg-red-600/50'
                : 'bg-black/20 text-gray-500 border-gray-700 line-through cursor-not-allowed'
            }`}
          >
            🕳️ الحفرة (تدبيل وخصم)
          </button>
        </div>

        <button
          onClick={handleEndMatch}
          className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
        >
          إنهاء الجولة وإعلان الفائز 🏆
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACTIVE QUESTION MODAL (QUESTION -> REVEAL -> KAMIL -> 3 OPTIONS)       */}
      {/* ========================================================================= */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-2xl w-full bg-gradient-to-b from-[#1e1338] via-[#150a28] to-[#0c0418] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-right text-white">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4c359e] border border-purple-600/60 flex items-center justify-center p-1">
                  <JamrainIllustration
                    topicTitle={activeQuestion.topic.title}
                    type={activeQuestion.topic.svgType}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs text-amber-400 font-black">{activeQuestion.topic.title}</div>
                  <div className="text-xl font-black text-white">{activeQuestion.points} نقطة</div>
                </div>
              </div>

              {/* Timer Bar */}
              <div className={`px-4 py-1.5 rounded-2xl font-mono text-xl font-black border flex items-center gap-2 ${
                timerSeconds <= 10
                  ? 'bg-red-500/20 text-red-400 border-red-500/60 animate-pulse'
                  : 'bg-purple-900/40 text-purple-200 border-purple-700/60'
              }`}>
                <Clock className="w-5 h-5" />
                <span>{timerSeconds}s</span>
              </div>
            </div>

            {/* Turn & Team Participation Notice */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-2xl bg-black/40 border border-purple-800/40 text-xs font-bold text-center">
              <div className="flex items-center gap-1.5">
                <span className="text-purple-300">دور الإجابة:</span>
                <span className="text-amber-400 font-black">{teams[activeTeamIdx].name}</span>
              </div>
              <div className="text-[11px] text-purple-300/80 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
                💡 جواب {teams[activeTeamIdx === 0 ? 1 : 0].name} اختياري للمنافسة والتجهيز
              </div>
            </div>

            {/* Lifeline Notice */}
            {activeLifeline && (
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold text-center">
                {activeLifeline === 'call_friend' && '📞 وسيلة الاتصال بصديق مفعلة! (+30 ثانية إضافية)'}
                {activeLifeline === 'two_answers' && '✌️ وسيلة جوابين مفعلة! يحق للفريق تخمينين!'}
                {activeLifeline === 'pitfall' && '🕳️ وسيلة الحفرة مفعلة! الفوز يدبل نقاطك ويخصم من الخصم!'}
              </div>
            )}

            {/* Question Text */}
            <div className="p-5 sm:p-7 rounded-2xl bg-[#0e061c] border border-purple-800/40 shadow-inner">
              <h3 className="text-lg sm:text-2xl font-black text-white leading-relaxed text-center">
                {activeQuestion.qData.question}
              </h3>
            </div>

            {/* Hints if available and not revealed */}
            {activeQuestion.qData.hints && activeQuestion.qData.hints.length > 0 && questionStage === 'question' && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs text-purple-200">
                <span className="font-black text-amber-400 ml-1">💡 تلميح:</span>
                <span>{activeQuestion.qData.hints[0]}</span>
              </div>
            )}

            {/* ================= STAGE 1: REVEAL ANSWER BUTTON ================= */}
            {questionStage === 'question' && (
              <button
                onClick={() => {
                  sound.playClick();
                  setTimerRunning(false);
                  setQuestionStage('answer_revealed');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>👁️ إظهار الإجابة</span>
              </button>
            )}

            {/* ================= STAGE 2: ANSWER REVEALED + 'كمل' BUTTON ================= */}
            {questionStage === 'answer_revealed' && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="p-5 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500 text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-400 block">الإجابة المعتمدة لهذا السؤال:</span>
                  <div className="text-xl sm:text-2xl font-black text-white">{activeQuestion.qData.answer}</div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setQuestionStage('scoring_decision');
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:scale-[1.01] text-black font-black text-base shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>كَمّل ➔</span>
                </button>
              </div>
            )}

            {/* ================= STAGE 3: THE 3 CHOICES (محد جاوب / الفريق 1 جاوب / الفريق 2 جاوب) ================= */}
            {questionStage === 'scoring_decision' && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="text-center">
                  <h4 className="text-base font-black text-white">من جاوب على السؤال بشكل صحيح؟</h4>
                  <p className="text-xs text-purple-300 mt-0.5">
                    اختر الفريق الفائز بنقاط هذا السؤال (+{activeQuestion.points}) أو اختر "محد جاوب"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Choice 1: محد جاوب */}
                  <button
                    onClick={() => handleResolveQuestion('none')}
                    className="py-4 px-3 rounded-2xl bg-red-950/60 hover:bg-red-900/80 border-2 border-red-500/60 text-red-200 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="text-lg">❌</span>
                    <span>محد جاوب</span>
                    <span className="text-[10px] text-red-300/80 font-normal">لا تحسب نقاط</span>
                  </button>

                  {/* Choice 2: الفريق الأول جاوب */}
                  <button
                    onClick={() => handleResolveQuestion(0)}
                    className="py-4 px-3 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-2 border-amber-300 text-black font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="text-lg">🏆</span>
                    <span>{teams[0].name} جاوب</span>
                    <span className="text-[10px] text-black/80 font-bold">+{activeQuestion.points} نقطة</span>
                  </button>

                  {/* Choice 3: الفريق الثاني جاوب */}
                  <button
                    onClick={() => handleResolveQuestion(1)}
                    className="py-4 px-3 rounded-2xl bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border-2 border-purple-400 text-white font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="text-lg">🏆</span>
                    <span>{teams[1].name} جاوب</span>
                    <span className="text-[10px] text-purple-200 font-bold">+{activeQuestion.points} نقطة</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cancel & return to board */}
            <button
              onClick={() => setActiveQuestion(null)}
              className="w-full py-2 text-xs text-purple-400 hover:text-white transition-colors cursor-pointer text-center pt-2"
            >
              إلغاء السؤال والعودة للوحة
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TOPIC PICKER MODAL (100 TOPICS - 3 FOR TEAM 1 + 3 FOR TEAM 2)         */}
      {/* ========================================================================= */}
      {showTopicPicker && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#180b2a] via-[#11071e] to-[#0c0517] rounded-3xl max-w-4xl w-full border-2 border-amber-500/50 shadow-2xl p-6 text-right text-white my-auto max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>اختيار مواضيع جَمْرَيْن (100 موضوع - يختار كل فريق 3 مواضيع)</span>
                </h3>
                <p className="text-xs text-purple-300 mt-1">
                  كل فريق يختار 3 مواضيع تناسبه في جلستكم، لتصبح اللوحة مكوّنة من 6 مواضيع مشتركة!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePickRandom3ForEach}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs shadow-md hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>عشوائي (3 لكل فريق)</span>
                </button>
                <button
                  onClick={() => setShowTopicPicker(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Team Picker Tabs */}
            <div className="grid grid-cols-2 gap-3 mb-4 p-1 rounded-2xl bg-black/40 border border-purple-800/60">
              <button
                type="button"
                onClick={() => setActivePickerTeam(0)}
                className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activePickerTeam === 0
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <span>مواضيع {teams[0].name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  team1TopicIds.length === 3 ? 'bg-black text-white' : 'bg-amber-600/30 text-amber-900 font-bold'
                }`}>
                  {team1TopicIds.length} / 3
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivePickerTeam(1)}
                className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activePickerTeam === 1
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <span>مواضيع {teams[1].name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  team2TopicIds.length === 3 ? 'bg-white text-purple-900' : 'bg-purple-900/60 text-purple-200 font-bold'
                }`}>
                  {team2TopicIds.length} / 3
                </span>
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  placeholder="ابحث في الـ 100 موضوع (حيوان، سيارات، كأس العالم، سبيستون...)"
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-purple-800/60 bg-black/60 text-xs font-bold text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'الكل (100)' },
                  { id: 'science', label: 'علوم وطبيعة' },
                  { id: 'sports', label: 'رياضة وكورة' },
                  { id: 'cinema', label: 'سينما وتلفزيون' },
                  { id: 'culture', label: 'تاريخ وتراث' },
                  { id: 'trivia', label: 'ثقافة وعامة' },
                  { id: 'gaming', label: 'ألعاب وجيمينج' },
                  { id: 'food', label: 'تسالي وأكلات' },
                  { id: 'islamic', label: 'دين وسيرة' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTopicCategoryFilter(c.id)}
                    className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      topicCategoryFilter === c.id
                        ? 'bg-amber-500 text-black'
                        : 'bg-purple-950/60 text-purple-300 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Count Status */}
            <div className="p-3 mb-3 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-3">
                <span className="text-amber-400">
                  {teams[0].name}: ({team1TopicIds.length} / 3)
                </span>
                <span className="text-purple-400">
                  {teams[1].name}: ({team2TopicIds.length} / 3)
                </span>
              </div>
              {team1TopicIds.length === 3 && team2TopicIds.length === 3 ? (
                <span className="text-emerald-400">✓ اكتملت 6 مواضيع بنجاح</span>
              ) : (
                <span className="text-amber-400">
                  اختر 3 مواضيع لـ {activePickerTeam === 0 ? teams[0].name : teams[1].name}
                </span>
              )}
            </div>

            {/* 100 Topics Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-1">
              {ALL_100_JAMRAIN_TOPICS
                .filter(t => topicCategoryFilter === 'all' || t.category === topicCategoryFilter)
                .filter(t => !topicSearch || t.title.includes(topicSearch) || t.description.includes(topicSearch))
                .map((t) => {
                  const isTeam1 = team1TopicIds.includes(t.id);
                  const isTeam2 = team2TopicIds.includes(t.id);
                  const isSelected = isTeam1 || isTeam2;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTopic(t.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-right relative overflow-hidden ${
                        isTeam1
                          ? 'border-amber-400 bg-amber-500/20 shadow-lg scale-[1.02]'
                          : isTeam2
                            ? 'border-purple-400 bg-purple-600/25 shadow-lg scale-[1.02]'
                            : 'border-purple-800/40 bg-black/40 hover:border-purple-600/60'
                      }`}
                    >
                      {/* Selection Badge */}
                      {isSelected && (
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full font-black text-[10px] shadow-md ${
                          isTeam1 ? 'bg-amber-400 text-black' : 'bg-purple-600 text-white'
                        }`}>
                          {isTeam1 ? teams[0].name.slice(0, 10) : teams[1].name.slice(0, 10)}
                        </div>
                      )}

                      <div>
                        <div className="text-2xl mb-1.5">{t.icon || '🔥'}</div>
                        <h4 className="text-xs font-black text-white line-clamp-1">{t.title}</h4>
                        <span className="text-[10px] text-amber-300/80 font-bold">{t.categoryLabel}</span>
                      </div>

                      <p className="text-[10px] text-purple-300/70 line-clamp-2 mt-1">
                        {t.description}
                      </p>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-purple-900/40 mt-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setTeam1TopicIds(['t-animals', 't-science', 't-snacks']);
                  setTeam2TopicIds(['t-general', 't-worldcup', 't-choices']);
                }}
                className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
              >
                المواضيع الكلاسيكية الافتراضية
              </button>

              <button
                disabled={team1TopicIds.length !== 3 || team2TopicIds.length !== 3}
                onClick={() => {
                  sound.playClick();
                  setShowTopicPicker(false);
                }}
                className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all cursor-pointer ${
                  team1TopicIds.length === 3 && team2TopicIds.length === 3
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:from-amber-400 hover:to-orange-500'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                تطبيق والبدء بهذه المواضيع الستة 🔥
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TEAM RENAME MODAL                                                     */}
      {/* ========================================================================= */}
      {isRenamingTeam !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#180a2c] border-2 border-amber-500/50 rounded-3xl p-6 text-right text-white shadow-2xl space-y-4">
            <h4 className="text-sm font-black text-amber-300">
              تعديل اسم {isRenamingTeam === 0 ? 'الفريق الأول (أ)' : 'الفريق الثاني (ب)'}
            </h4>
            <input
              type="text"
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value)}
              placeholder="مثال: يوسف، ناصر، الصقور..."
              maxLength={25}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border border-purple-800/60 bg-black/60 text-white font-bold text-center text-sm focus:border-amber-400 focus:outline-hidden"
            />
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveTeamName}
                className="flex-1 py-2.5 bg-amber-500 text-black font-black text-xs rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
              >
                حفظ الاسم
              </button>
              <button
                onClick={() => setIsRenamingTeam(null)}
                className="px-4 py-2.5 bg-purple-950/60 text-purple-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. WINNER MODAL                                                          */}
      {/* ========================================================================= */}
      {winnerTeam && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="max-w-lg w-full bg-gradient-to-b from-[#241144] via-[#16082e] to-[#0d041c] border-2 border-amber-400 rounded-3xl p-8 text-center text-white shadow-2xl space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 shadow-xl">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="text-xs font-black text-amber-400 tracking-wider">نهاية التحدي الأسطوري</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">الفائز هو: {winnerTeam}!</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-purple-900/40 font-mono">
              <div className="text-right">
                <div className="text-xs text-purple-300 font-sans">{teams[0].name}</div>
                <div className="text-2xl font-black text-amber-400">{teams[0].score} نقطة</div>
              </div>
              <div className="text-left">
                <div className="text-xs text-purple-300 font-sans">{teams[1].name}</div>
                <div className="text-2xl font-black text-purple-400">{teams[1].score} نقطة</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setWinnerTeam(null);
                  setSolvedTiles({});
                  setTeams(prev => [
                    { ...prev[0], score: 0, lifelines: { call_friend: true, two_answers: true, pitfall: true } },
                    { ...prev[1], score: 0, lifelines: { call_friend: true, two_answers: true, pitfall: true } }
                  ]);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-xs rounded-xl shadow-lg hover:from-amber-400 hover:to-orange-500 transition-colors cursor-pointer"
              >
                جولة جديدة بنفس المواضيع 🔥
              </button>

              <button
                onClick={() => {
                  setWinnerTeam(null);
                  onExit();
                }}
                className="px-5 py-3 bg-purple-950/60 text-purple-200 font-bold text-xs rounded-xl hover:bg-purple-900/60 transition-colors cursor-pointer"
              >
                القائمة الرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
