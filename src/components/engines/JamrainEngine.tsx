import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Phone, HelpCircle, Flame, ArrowRight, 
  RotateCcw, Trophy, Award, CheckCircle2, XCircle, ShieldAlert, 
  Zap, Search, Shuffle, Filter, Check, Edit3, X, Volume2, HelpCircle as HelpIcon 
} from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { ALL_100_JAMRAIN_TOPICS, JamrainTopicItem, JamrainTopicQuestion } from '../../data/jamrain100Topics';
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
  // 100 Topics Selection State
  // Default first 6 match the image: عالم الحيوان, علوم, مثلجات, معلومات عامة, كأس العالم, اختيارات
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([
    't-animals',
    't-science',
    't-snacks',
    't-general',
    't-worldcup',
    't-choices'
  ]);
  const [showTopicPicker, setShowTopicPicker] = useState<boolean>(false);
  const [topicSearch, setTopicSearch] = useState<string>('');
  const [topicCategoryFilter, setTopicCategoryFilter] = useState<string>('all');

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

  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [activeLifeline, setActiveLifeline] = useState<'call_friend' | 'two_answers' | 'pitfall' | null>(null);
  const [isStealChance, setIsStealChance] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState<string | null>(null);

  // Retrieve current active 6 topic objects
  const active6Topics: JamrainTopicItem[] = selectedTopicIds
    .map(id => ALL_100_JAMRAIN_TOPICS.find(t => t.id === id))
    .filter(Boolean) as JamrainTopicItem[];

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0 && !answerRevealed) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            handleTimeExpired();
            return 0;
          }
          if (s <= 5) sound.playTick(true);
          else if (s % 5 === 0) sound.playTick(false);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, answerRevealed]);

  // Handle tile click on board
  const handleTileClick = (topicIdx: number, side: 'left' | 'right', points: QuestionPoints) => {
    const tileKey = `${topicIdx}-${side}-${points}`;
    if (solvedTiles[tileKey]) return;

    const topic = active6Topics[topicIdx];
    if (!topic) return;

    // Get specific question
    const qKey = `${side}${points}` as keyof typeof topic.questions;
    const qData = topic.questions[qKey] || {
      points,
      question: `سؤال في مجال ${topic.title} بقيمة ${points} نقطة`,
      answer: `الإجابة المعتمدة لهذا السؤال في موضوع ${topic.title}`,
      hints: ['تلميح: فكر في المعنى الأساسي أو الأثر التاريخي']
    };

    sound.playTileSelect();
    setActiveQuestion({
      topic,
      topicIdx,
      side,
      points,
      qData,
      tileKey
    });

    setTimerSeconds(60);
    setTimerRunning(true);
    setAnswerRevealed(false);
    setActiveLifeline(null);
    setIsStealChance(false);
  };

  const handleTimeExpired = () => {
    sound.playWrong();
    if (!isStealChance) {
      // Offer steal chance to the opposing team
      setIsStealChance(true);
      setTimerSeconds(30);
      setTimerRunning(true);
    } else {
      setAnswerRevealed(true);
    }
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

  const handleScoreQuestion = (isCorrect: boolean) => {
    if (!activeQuestion) return;
    const tileKey = activeQuestion.tileKey;
    const answeringTeamIdx = isStealChance ? (activeTeamIdx === 0 ? 1 : 0) : activeTeamIdx;
    const opposingTeamIdx = answeringTeamIdx === 0 ? 1 : 0;
    const points = activeQuestion.points;

    if (isCorrect) {
      sound.playCorrect();
      setTeams(prev => {
        const next = [...prev] as [TeamState, TeamState];
        if (activeLifeline === 'pitfall') {
          // Pitfall: Double points for winner, opponent loses points!
          next[answeringTeamIdx].score += points * 2;
          next[opposingTeamIdx].score = Math.max(0, next[opposingTeamIdx].score - points);
        } else {
          next[answeringTeamIdx].score += points;
        }
        return next;
      });

      setSolvedTiles(prev => ({
        ...prev,
        [tileKey]: { winner: answeringTeamIdx, points }
      }));

      // Switch turn to opposing team
      setActiveTeamIdx(prev => (prev === 0 ? 1 : 0));
      setActiveQuestion(null);
    } else {
      sound.playWrong();
      if (!isStealChance) {
        // Offer steal to opposing team
        setIsStealChance(true);
        setTimerSeconds(30);
        setTimerRunning(true);
      } else {
        // Both failed
        setSolvedTiles(prev => ({
          ...prev,
          [tileKey]: { winner: 'missed', points }
        }));
        // Switch turn
        setActiveTeamIdx(prev => (prev === 0 ? 1 : 0));
        setActiveQuestion(null);
      }
    }
  };

  // Random 6 Topics Picker
  const handlePickRandom6 = () => {
    sound.playClick();
    const shuffled = [...ALL_100_JAMRAIN_TOPICS].sort(() => 0.5 - Math.random());
    const random6 = shuffled.slice(0, 6).map(t => t.id);
    setSelectedTopicIds(random6);
    setSolvedTiles({});
  };

  // Toggle single topic selection
  const handleToggleTopic = (id: string) => {
    sound.playClick();
    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length <= 1) return;
      setSelectedTopicIds(prev => prev.filter(tId => tId !== id));
    } else {
      if (selectedTopicIds.length >= 6) {
        // Replace last
        setSelectedTopicIds(prev => [...prev.slice(0, 5), id]);
      } else {
        setSelectedTopicIds(prev => [...prev, id]);
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
              onClick={() => { sound.playClick(); setShowTopicPicker(true); }}
              className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer border border-white/30"
              title="تغيير المواضيع من قائمة الـ 100 موضوع"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-300" />
              <span>المواضيع (100)</span>
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
      {/* 4. ACTIVE QUESTION POPUP MODAL                                           */}
      {/* ========================================================================= */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-2xl w-full bg-gradient-to-b from-[#1e1338] via-[#150a28] to-[#0c0418] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-right text-white">
            
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

            {/* Steal alert if active */}
            {isStealChance && (
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-300 flex items-center justify-between text-xs font-black animate-pulse">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>فرصة سرقة النقاط لفريق: {teams[activeTeamIdx === 0 ? 1 : 0].name}!</span>
                </div>
                <span>30 ثانية</span>
              </div>
            )}

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

            {/* Hints if available */}
            {activeQuestion.qData.hints && activeQuestion.qData.hints.length > 0 && !answerRevealed && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs text-purple-200">
                <span className="font-black text-amber-400 ml-1">💡 تلميح:</span>
                <span>{activeQuestion.qData.hints[0]}</span>
              </div>
            )}

            {/* Answer Box (Hidden until revealed) */}
            {answerRevealed ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 text-center animate-in zoom-in-95">
                <div className="text-xs font-bold text-emerald-400 mb-1">الإجابة النموذجية المعتمدة:</div>
                <div className="text-xl sm:text-2xl font-black text-white">{activeQuestion.qData.answer}</div>
              </div>
            ) : (
              <button
                onClick={() => { sound.playClick(); setAnswerRevealed(true); }}
                className="w-full py-3 rounded-2xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200 font-black text-xs transition-colors cursor-pointer"
              >
                👁️ كشف الإجابة للجميع
              </button>
            )}

            {/* Scoring Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleScoreQuestion(true)}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>إجابة صحيحة (+{activeQuestion.points})</span>
              </button>

              <button
                onClick={() => handleScoreQuestion(false)}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
                <span>{isStealChance ? 'إجابة خاطئة (ضاع السؤال)' : 'إجابة خاطئة (فرصة سرقة)'}</span>
              </button>
            </div>

            {/* Close without penalty */}
            <button
              onClick={() => setActiveQuestion(null)}
              className="w-full py-2 text-xs text-purple-400 hover:text-white transition-colors cursor-pointer"
            >
              إلغاء السؤال والعودة للوحة
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TOPIC PICKER MODAL (100 TOPICS SELECTION)                             */}
      {/* ========================================================================= */}
      {showTopicPicker && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#180b2a] via-[#11071e] to-[#0c0517] rounded-3xl max-w-4xl w-full border-2 border-amber-500/50 shadow-2xl p-6 text-right text-white my-auto max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>اختيار مواضيع جَمْرَيْن (اختر 6 من أصل 100 موضوع)</span>
                </h3>
                <p className="text-xs text-purple-300 mt-1">
                  اختر المواضيع الستة التي تناسب جلستكم وديوانيتكم أو اضغط اختيار عشوائي للتشويق!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePickRandom6}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs shadow-md hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>اختيار عشوائي (6)</span>
                </button>
                <button
                  onClick={() => setShowTopicPicker(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
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

            {/* Selected Count Bar */}
            <div className="p-3 mb-3 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-between text-xs font-black">
              <span>المواضيع المختارة: ({selectedTopicIds.length} / 6)</span>
              {selectedTopicIds.length === 6 ? (
                <span className="text-emerald-400">✓ جاهز للعب اللوحة كاملة</span>
              ) : (
                <span className="text-amber-400">يرجى اختيار 6 مواضيع لبدء اللعبة</span>
              )}
            </div>

            {/* 100 Topics Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-1">
              {ALL_100_JAMRAIN_TOPICS
                .filter(t => topicCategoryFilter === 'all' || t.category === topicCategoryFilter)
                .filter(t => !topicSearch || t.title.includes(topicSearch) || t.description.includes(topicSearch))
                .map((t) => {
                  const isSelected = selectedTopicIds.includes(t.id);
                  const selectedIdx = selectedTopicIds.indexOf(t.id) + 1;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTopic(t.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-right relative overflow-hidden ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 shadow-lg scale-[1.02]'
                          : 'border-purple-800/40 bg-black/40 hover:border-purple-600/60'
                      }`}
                    >
                      {/* Selection Badge */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 text-black font-black text-xs flex items-center justify-center shadow-md">
                          {selectedIdx}
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
                onClick={() => setSelectedTopicIds(['t-animals', 't-science', 't-snacks', 't-general', 't-worldcup', 't-choices'])}
                className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
              >
                استعادة المواضيع الستة الكلاسيكية
              </button>

              <button
                disabled={selectedTopicIds.length !== 6}
                onClick={() => {
                  sound.playClick();
                  setShowTopicPicker(false);
                }}
                className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all cursor-pointer ${
                  selectedTopicIds.length === 6
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
