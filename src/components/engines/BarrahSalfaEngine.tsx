import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, Award, Clock, Users, ArrowRight, HelpCircle, Check, Flame, Trophy, AlertTriangle, Compass, CheckCircle2, XCircle } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { BARRAH_SALFA_TOPICS, BarrahSalfaTopic } from '../../data/barrahSalfaDefaultBank';

interface BarrahSalfaProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  onOnlineVote?: (votedPlayerId: string) => void;
  onNextRound?: () => void;
  onlineGameData?: any;
  onlineStatus?: string;
  isHost?: boolean;
}

export const BarrahSalfaEngine: React.FC<BarrahSalfaProps> = ({
  mode,
  players,
  currentRound,
  totalRounds,
  questionData,
  onOnlineVote,
  onNextRound,
  onlineGameData,
  onlineStatus,
  isHost
}) => {
  // Offline State Machine:
  // 'reveal_cards' -> 'questions_stage' -> 'voting' -> 'final_chance' -> 'results'
  const [phase, setPhase] = useState<'reveal_cards' | 'questions_stage' | 'voting' | 'final_chance' | 'results'>('reveal_cards');
  const [activeTopic, setActiveTopic] = useState<BarrahSalfaTopic>(BARRAH_SALFA_TOPICS[0]);
  const [spyMode, setSpyMode] = useState<'classic' | 'oblivious_spy'>('oblivious_spy'); // الجاسوس الغفلان
  const [spyPlayerId, setSpyPlayerId] = useState<string>('');
  
  // Card reveal pass
  const [revealIndex, setRevealIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Question stage
  const [questionTurnIdx, setQuestionTurnIdx] = useState(0);

  // Voting stage
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [timerRunning, setTimerRunning] = useState(false);
  const [votes, setVotes] = useState<Record<string, string>>({}); // voterId -> targetId
  const [accusedPlayerId, setAccusedPlayerId] = useState<string>('');

  // Final chance guess (8 choices, 25s)
  const [spyGuess, setSpyGuess] = useState<string | null>(null);
  const [spyWonByGuess, setSpyWonByGuess] = useState<boolean | null>(null);

  // Initialize round
  useEffect(() => {
    const randomTopic = BARRAH_SALFA_TOPICS[Math.floor(Math.random() * BARRAH_SALFA_TOPICS.length)] || BARRAH_SALFA_TOPICS[0];
    setActiveTopic(randomTopic);

    if (players.length > 0) {
      const randomSpyIdx = Math.floor(Math.random() * players.length);
      setSpyPlayerId(players[randomSpyIdx].id);
    }

    setPhase('reveal_cards');
    setRevealIndex(0);
    setCardFlipped(false);
    setQuestionTurnIdx(0);
    setVotes({});
    setAccusedPlayerId('');
    setSpyGuess(null);
    setSpyWonByGuess(null);
  }, [currentRound, players]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            if (phase === 'voting') {
              tallyVotes();
            } else if (phase === 'final_chance') {
              setSpyWonByGuess(false);
              setPhase('results');
            }
            return 0;
          }
          if (s <= 5) sound.playTick(true);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, phase]);

  const handleStartQuestions = () => {
    sound.playClick();
    setPhase('questions_stage');
  };

  const handleStartVoting = () => {
    sound.playClick();
    setPhase('voting');
    setTimerSeconds(45);
    setTimerRunning(true);
    setVotes({});
  };

  const handleVote = (voterId: string, targetId: string) => {
    sound.playClick();
    const newVotes = { ...votes, [voterId]: targetId };
    setVotes(newVotes);

    if (Object.keys(newVotes).length >= players.length) {
      tallyVotes(newVotes);
    }
  };

  const tallyVotes = (currentVotes = votes) => {
    sound.playGong();
    setTimerRunning(false);

    const counts: Record<string, number> = {};
    Object.values(currentVotes).forEach(tid => {
      counts[tid] = (counts[tid] || 0) + 1;
    });

    let maxV = 0;
    let target = '';
    for (const [tid, cnt] of Object.entries(counts)) {
      if (cnt > maxV) {
        maxV = cnt;
        target = tid;
      }
    }

    setAccusedPlayerId(target);

    // If the accused player is indeed the spy, trigger the Final Chance (الفرصة الأخيرة)!
    if (target === spyPlayerId) {
      setPhase('final_chance');
      setTimerSeconds(25);
      setTimerRunning(true);
    } else {
      // Spy was not caught -> Spy wins directly!
      setPhase('results');
      sound.playVictory();
    }
  };

  const handleSpyGuess = (choice: string) => {
    if (spyGuess !== null) return;
    setSpyGuess(choice);
    setTimerRunning(false);

    const isCorrect = choice === activeTopic.secretWord;
    setSpyWonByGuess(isCorrect);
    setPhase('results');

    if (isCorrect) {
      sound.playVictory();
      confetti({ particleCount: 80, spread: 70 });
    } else {
      sound.playWrong();
    }
  };

  const spyPlayer = players.find(p => p.id === spyPlayerId) || players[0];
  const accusedPlayer = players.find(p => p.id === accusedPlayerId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-right pb-12">
      {/* ================= 1. REVEAL CARDS (الكروت) ================= */}
      {phase === 'reveal_cards' && players[revealIndex] && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1b0a28] to-[#0d0416] border-2 border-orange-500/50 shadow-2xl text-center space-y-6">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <span className="text-xs font-black text-amber-400">كروت السالفة ({revealIndex + 1} من {players.length})</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <Compass className="w-4 h-4 text-orange-400" />
              <span>التصنيف: {activeTopic.category}</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white">
            دور اللاعب: <span className="text-orange-400">{players[revealIndex].name}</span>
          </h2>
          <p className="text-xs text-purple-200">مرر الجهاز وتأكد من سرية كرتك قبل اللمس</p>

          <div className="py-4">
            {!cardFlipped ? (
              <button
                onClick={() => {
                  sound.playTileSelect();
                  setCardFlipped(true);
                }}
                className="w-56 h-72 mx-auto rounded-3xl bg-gradient-to-b from-purple-900/60 to-black border-2 border-orange-500/50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-105 transition-all shadow-xl"
              >
                <EyeOff className="w-12 h-12 text-orange-400 animate-pulse" />
                <span className="text-sm font-black text-orange-200">المس الكرت لرؤية كلمتك</span>
              </button>
            ) : (
              <div className="w-56 h-72 mx-auto rounded-3xl bg-gradient-to-b from-orange-950/60 via-[#1d092c] to-black border-2 border-orange-400 p-6 flex flex-col items-center justify-center gap-3 shadow-2xl animate-in zoom-in-95">
                {players[revealIndex].id === spyPlayerId ? (
                  spyMode === 'oblivious_spy' ? (
                    // وضع المحترفين: الجاسوس الغفلان
                    <div className="space-y-2">
                      <span className="text-4xl">🎭</span>
                      <div className="text-xs font-black text-amber-400">التصنيف: {activeTopic.category}</div>
                      <div className="text-2xl font-black text-white">{activeTopic.trickySpyWord}</div>
                      <p className="text-[10px] text-purple-300">أنت في السالفة! تذكر كلمتك وشارك بثقة.</p>
                    </div>
                  ) : (
                    // Classic Spy
                    <div className="space-y-2">
                      <span className="text-4xl">🕵️</span>
                      <div className="text-xl font-black text-red-400">أنت برا السالفة!</div>
                      <div className="text-xs font-bold text-amber-400">التصنيف: {activeTopic.category}</div>
                      <p className="text-[10px] text-purple-300">سلك وما تنكشف! وحاول تستنتج الكلمة من الأسئلة.</p>
                    </div>
                  )
                ) : (
                  // Regular Player
                  <div className="space-y-2">
                    <span className="text-4xl">📜</span>
                    <div className="text-xs font-black text-amber-400">التصنيف: {activeTopic.category}</div>
                    <div className="text-2xl font-black text-emerald-300">{activeTopic.secretWord}</div>
                    <p className="text-[10px] text-purple-300">أنت داخل السالفة! اسأل أسئلة ذكية ولا توضح زيادة.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {cardFlipped && (
            <button
              onClick={() => {
                sound.playClick();
                setCardFlipped(false);
                if (revealIndex + 1 < players.length) {
                  setRevealIndex(i => i + 1);
                } else {
                  handleStartQuestions();
                }
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-sm shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              {revealIndex + 1 < players.length ? 'إخفاء وتمرير للاعب التالي ➔' : 'بدء جولة الأسئلة 🎤'}
            </button>
          )}
        </div>
      )}

      {/* ================= 2. QUESTIONS STAGE (الأسئلة) ================= */}
      {phase === 'questions_stage' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170724] border-2 border-orange-500/50 shadow-2xl space-y-6 text-center">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <span className="text-xs font-black text-orange-400">مرحلة طرح الأسئلة 🎤</span>
            <span className="text-xs font-bold text-purple-300">التصنيف: {activeTopic.category}</span>
          </div>

          {/* Golden Rule Notice from Video 3 */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right space-y-1">
            <div className="text-xs font-black text-amber-400">✨ القاعدة الذهبية:</div>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              ✅ جوابك يثبت إنك تعرف السالفة.. ولكن ❌ لا توضح زيادة عشان الجاسوس ما يعرف الكلمة!
            </p>
          </div>

          {/* Current Question Pair Direction */}
          <div className="py-4 space-y-3">
            <div className="text-sm font-bold text-purple-300">الدور الحالي في السؤال:</div>
            <div className="p-4 rounded-2xl bg-black/50 border border-purple-700/40 flex items-center justify-around">
              <div className="text-center">
                <div className="text-xs text-orange-400 font-bold">السائل:</div>
                <div className="text-lg font-black text-white">{players[questionTurnIdx % players.length]?.name}</div>
              </div>
              <ArrowRight className="w-6 h-6 text-orange-400 rotate-180" />
              <div className="text-center">
                <div className="text-xs text-amber-400 font-bold">المجيب:</div>
                <div className="text-lg font-black text-white">{players[(questionTurnIdx + 1) % players.length]?.name}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
                sound.playClick();
                setQuestionTurnIdx(q => q + 1);
              }}
              className="py-3 px-6 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700 cursor-pointer"
            >
              السؤال التالي بالدور ➔
            </button>
            <button
              onClick={handleStartVoting}
              className="py-3 px-8 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm shadow-lg shadow-orange-500/30 cursor-pointer"
            >
              بدء التصويت (مين برا السالفة؟) 🗳️
            </button>
          </div>
        </div>
      )}

      {/* ================= 3. VOTING STAGE (التصويت 45 ثانية) ================= */}
      {phase === 'voting' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170724] border-2 border-orange-500/50 shadow-2xl space-y-6 text-center">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <h3 className="text-lg font-black text-white">التصويت السري: مين برا السالفة؟</h3>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/50 font-mono font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          <p className="text-xs text-purple-300">صوتوا جميعاً على الشخص المشتبه به قبل انتهاء الـ 45 ثانية</p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-right">
            {players.map(p => {
              const voteCount = Object.values(votes).filter(id => id === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => handleVote(players[0]?.id || 'v1', p.id)}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-900/40 to-black border border-purple-700/50 hover:border-orange-500 text-white font-bold text-xs flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                  </div>
                  {voteCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black font-black text-[10px]">
                      {voteCount} أصوات
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => tallyVotes()}
            className="w-full max-w-md py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm shadow-lg shadow-orange-500/30 cursor-pointer"
          >
            حسم التصويت وإعلان النتيجة ➔
          </button>
        </div>
      )}

      {/* ================= 4. FINAL CHANCE (الفرصة الأخيرة 8 كلمات 25 ثانية) ================= */}
      {phase === 'final_chance' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#1b082c] border-2 border-amber-400 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 text-xs font-black">
            ⚡ الفرصة الأخيرة لبرا السالفة!
          </div>

          <h2 className="text-2xl font-black text-white">
            انكشفت يا <span className="text-red-400">{spyPlayer.name}</span>!
          </h2>
          <p className="text-xs text-purple-200">
            أمامك 25 ثانية و8 كلمات، إذا اخترت الكلمة الأصلية تفوز وتخطف الانتصار من الجميع!
          </p>

          <div className="flex justify-center">
            <div className="px-4 py-1 rounded-2xl bg-black/60 border border-amber-500/50 text-amber-400 font-mono font-black text-xl flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          {/* 8 Word Choices Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto">
            {activeTopic.dummyOptions.map((word, idx) => (
              <button
                key={idx}
                disabled={spyGuess !== null}
                onClick={() => handleSpyGuess(word)}
                className={`p-3.5 rounded-2xl border font-black text-xs transition-all cursor-pointer ${
                  spyGuess === word
                    ? word === activeTopic.secretWord
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-red-600 border-red-400 text-white'
                    : 'bg-purple-950/60 border-purple-700/60 text-purple-100 hover:border-amber-400 hover:bg-purple-900/60'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. RESULTS SCREEN ================= */}
      {phase === 'results' && (
        <div className="p-8 rounded-3xl bg-[#150522] border-2 border-yellow-400 shadow-2xl space-y-6 text-center animate-in fade-in">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black text-white">انتهت الجولة!</h2>

          {spyWonByGuess ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 max-w-md mx-auto space-y-2">
              <div className="text-xl font-black text-emerald-400">🎉 فاز برا السالفة ({spyPlayer.name})!</div>
              <p className="text-xs text-purple-200">
                رغم كشفه بالتصويت، استغل الفرصة الأخيرة وخمن الكلمة ({activeTopic.secretWord}) بشكل صحيح وخطف الفوز!
              </p>
            </div>
          ) : accusedPlayerId === spyPlayerId ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 max-w-md mx-auto space-y-2">
              <div className="text-xl font-black text-emerald-400">🎉 فاز أصحاب السالفة!</div>
              <p className="text-xs text-purple-200">
                كشفتم برا السالفة ({spyPlayer.name}) ولم يستطع تخمين الكلمة الأصلية ({activeTopic.secretWord}).
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 max-w-md mx-auto space-y-2">
              <div className="text-xl font-black text-red-400">🎉 فاز برا السالفة بالخداع!</div>
              <p className="text-xs text-purple-200">
                صوتم بالخطأ على ({accusedPlayer?.name}) وهرب برا السالفة الحقيقي ({spyPlayer.name}) بالنقاط!
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-black/40 border border-purple-800/40 max-w-md mx-auto text-xs space-y-1.5 text-right">
            <div><span className="text-purple-400 font-bold">الكلمة الأصلية:</span> <span className="font-black text-white">{activeTopic.secretWord}</span></div>
            <div><span className="text-purple-400 font-bold">برا السالفة الحقيقي:</span> <span className="font-black text-orange-400">{spyPlayer.name}</span></div>
            {spyMode === 'oblivious_spy' && (
              <div><span className="text-purple-400 font-bold">كلمة الجاسوس الغفلان المضللة:</span> <span className="font-black text-pink-400">{activeTopic.trickySpyWord}</span></div>
            )}
          </div>

          <div className="flex gap-3 justify-center max-w-md mx-auto">
            {onNextRound && (
              <button
                onClick={onNextRound}
                className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm cursor-pointer shadow-lg shadow-orange-500/30"
              >
                الجولة التالية ➔
              </button>
            )}
            <button
              onClick={() => setPhase('reveal_cards')}
              className="flex-1 py-3.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700 cursor-pointer"
            >
              إعادة جولة جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
