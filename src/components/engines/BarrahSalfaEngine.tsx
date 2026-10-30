import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, Award, Clock, Users, ArrowRight, HelpCircle, Check, Flame } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sounds } from '../../services/soundEffects';
import confetti from 'canvas-confetti';

interface BarrahSalfaProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  // Online callbacks
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
  // Offline State Machine
  // 'reveal_roles' -> 'questioning' -> 'voting' -> 'odd_guess' -> 'round_summary'
  const [offlinePhase, setOfflinePhase] = useState<'reveal_roles' | 'questioning' | 'voting' | 'odd_guess' | 'round_summary'>('reveal_roles');
  const [offlinePlayerIndex, setOfflinePlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [oddPlayerId, setOddPlayerId] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [offlineVotes, setOfflineVotes] = useState<Record<string, string>>({});
  const [accusedPlayerId, setAccusedPlayerId] = useState<string>('');
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState<'success' | 'failed' | null>(null);

  // Pick odd player on offline start
  useEffect(() => {
    if (mode === 'offline' && players.length > 0) {
      const oddIdx = Math.floor(Math.random() * players.length);
      setOddPlayerId(players[oddIdx].id);
      setOfflinePhase('reveal_roles');
      setOfflinePlayerIndex(0);
      setIsRevealed(false);
      setOfflineVotes({});
      setGuessResult(null);
      setGuessInput('');
    }
  }, [currentRound, mode]);

  // Offline timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            sounds.playWrong();
            return 0;
          }
          if (s <= 5) sounds.playTick();
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Handle Offline Reveal Curtain
  const handleNextPlayerReveal = () => {
    sounds.playSpark();
    setIsRevealed(false);
    if (offlinePlayerIndex + 1 < players.length) {
      setOfflinePlayerIndex(offlinePlayerIndex + 1);
    } else {
      // All players saw their role! Move to questioning
      setOfflinePhase('questioning');
      setTimerSeconds(90);
      setTimerRunning(true);
      sounds.playCorrect();
    }
  };

  // Handle Offline Voting
  const handleVotePlayer = (voterId: string, targetId: string) => {
    sounds.playSpark();
    const updated = { ...offlineVotes, [voterId]: targetId };
    setOfflineVotes(updated);

    // If all players voted
    if (Object.keys(updated).length === players.length) {
      // Calculate accused
      const counts: Record<string, number> = {};
      Object.values(updated).forEach(tid => {
        counts[tid] = (counts[tid] || 0) + 1;
      });
      let highestCount = 0;
      let accused = '';
      for (const [tid, c] of Object.entries(counts)) {
        if (c > highestCount) {
          highestCount = c;
          accused = tid;
        }
      }
      setAccusedPlayerId(accused);

      // If accused is the odd one, give chance to guess!
      if (accused === oddPlayerId) {
        setOfflinePhase('odd_guess');
        sounds.playReveal();
      } else {
        // Odd one escaped!
        const oddPlayer = players.find(p => p.id === oddPlayerId);
        if (oddPlayer) oddPlayer.score += 250;
        setOfflinePhase('round_summary');
        confetti({ particleCount: 60, spread: 70 });
        sounds.playFanfare();
      }
    }
  };

  // Handle Odd One Word Guess
  const handleOddGuessSubmit = () => {
    sounds.playSpark();
    const secretWord = questionData?.secretWord || 'صالون الحلاقة';
    const isCorrect = guessInput.trim().toLowerCase() === secretWord.toLowerCase() ||
                      guessInput.trim().includes(secretWord) ||
                      secretWord.includes(guessInput.trim());

    if (isCorrect) {
      setGuessResult('success');
      const oddPlayer = players.find(p => p.id === oddPlayerId);
      if (oddPlayer) oddPlayer.score += 200;
      confetti({ particleCount: 80, spread: 80 });
      sounds.playFanfare();
    } else {
      setGuessResult('failed');
      // Award voters who caught odd one
      players.forEach(p => {
        if (p.id !== oddPlayerId && offlineVotes[p.id] === oddPlayerId) {
          p.score += 150;
        }
      });
      sounds.playWrong();
    }
    setOfflinePhase('round_summary');
  };

  // ONLINE MODE RENDER
  if (mode === 'online') {
    const isRoundResults = onlineStatus === 'round_results' || onlineStatus === 'game_over';
    const myPlayer = players.find(p => p.id === sessionStorage.getItem('jamr_player_id'));
    const isOdd = myPlayer?.secretRole === 'odd_one';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 text-center">
          <div className="text-xs font-bold text-orange-400 mb-1">
            جولة {currentRound} من {totalRounds} · برا السالفة
          </div>
          <h2 className="text-xl font-black text-white">
            {isRoundResults ? 'نتائج الجولة والتصويت' : 'طور الأسئلة والتحقيق'}
          </h2>
        </div>

        {/* Secret Card for Player */}
        {!isRoundResults && (
          <div className={`rounded-3xl p-6 sm:p-8 text-center border-2 transition-all shadow-2xl ${
            isOdd
              ? 'bg-gradient-to-b from-red-950/60 to-purple-950/80 border-red-500/60'
              : 'bg-gradient-to-b from-purple-950/60 to-indigo-950/80 border-purple-500/60'
          }`}>
            <span className="text-xs font-semibold text-purple-300">تصنيف السالفة</span>
            <div className="text-lg font-bold text-amber-400 mb-4">
              {onlineGameData?.secretCategory || questionData?.secretCategory || 'أماكن عامة'}
            </div>

            {isOdd ? (
              <div className="space-y-3 py-2">
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
                <h3 className="text-2xl sm:text-3xl font-black text-red-400">
                  أنت برّا السالفة! 🤫
                </h3>
                <p className="text-xs sm:text-sm text-red-200/80 max-w-md mx-auto leading-relaxed">
                  ما تدري وش السالفة! اسمع أسئلة وإجابات ربعك بدقة، وسلّك بدون ما يشك فيك أحد.
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <Eye className="w-16 h-16 text-orange-400 mx-auto" />
                <span className="text-xs text-purple-300 block">الكلمة السرية هي:</span>
                <div className="text-3xl sm:text-4xl font-black text-white bg-black/40 py-3 px-6 rounded-2xl border border-orange-500/40 inline-block">
                  {onlineGameData?.secretWord || questionData?.secretWord}
                </div>
                <p className="text-xs text-purple-200/70 max-w-md mx-auto">
                  اسأل زملاءك أسئلة ذكية مرتبطة بالمكان لكشف من لا يعرف الكلمة!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Voting Grid for Online */}
        {!isRoundResults && (
          <div className="rounded-2xl bg-purple-950/30 border border-purple-800/30 p-5">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span>صوّت: مين شاك فيه إنه برا السالفة؟</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {players.map(p => {
                const isMe = p.id === myPlayer?.id;
                return (
                  <button
                    key={p.id}
                    disabled={isMe || myPlayer?.hasVoted}
                    onClick={() => onOnlineVote && onOnlineVote(p.id)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-right ${
                      isMe 
                        ? 'opacity-40 border-purple-800/20 bg-purple-950/20'
                        : myPlayer?.hasVoted
                          ? 'border-purple-800/40 bg-purple-900/20'
                          : 'border-purple-700/50 bg-purple-900/40 hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer'
                    }`}
                  >
                    <span className="text-xl">{p.avatar}</span>
                    <span className="text-xs font-bold text-white truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
            {myPlayer?.hasVoted && (
              <p className="text-xs text-emerald-400 font-bold text-center mt-3">
                ✓ تم تسجيل صوتك بنجاح! بانتظار بقية اللاعبين...
              </p>
            )}
          </div>
        )}

        {/* Results Screen for Online */}
        {isRoundResults && (
          <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 text-center space-y-4">
            <Award className="w-14 h-14 text-amber-400 mx-auto" />
            <h3 className="text-2xl font-black text-white">
              {onlineGameData?.caught ? 'تم كشف برا السالفة بنجاح! 🎯' : 'برا السالفة خدع الجميع وهرب بالنقاط! 🏃‍♂️'}
            </h3>
            <p className="text-sm text-purple-200">
              برا السالفة كان: <span className="font-bold text-orange-400">{players.find(p => p.id === onlineGameData?.oddPlayerId)?.name}</span>
            </p>
            <div className="p-3 bg-black/40 rounded-xl inline-block text-xs text-purple-300">
              الكلمة السرية كانت: <strong className="text-white text-sm">{onlineGameData?.secretWord}</strong>
            </div>

            {isHost && (
              <div className="pt-4">
                <button
                  onClick={onNextRound}
                  className="py-3 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                >
                  الجولة التالية ➔
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==================== OFFLINE MODE (SINGLE DEVICE) ====================
  const currentPlayer = players[offlinePlayerIndex];
  const isCurrentOdd = currentPlayer?.id === oddPlayerId;
  const secretWord = questionData?.secretWord || 'صالون الحلاقة';
  const secretCat = questionData?.secretCategory || 'أماكن عامة';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Round & Game Header */}
      <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-orange-400">جولة {currentRound} من {totalRounds}</span>
          <h2 className="text-lg font-black text-white">برا السالفة (جهاز واحد)</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-900/40 border border-purple-700/40 text-xs font-bold text-purple-200">
          <Users className="w-3.5 h-3.5 text-orange-400" />
          <span>{players.length} لاعبين</span>
        </div>
      </div>

      {/* PHASE 1: PASS DEVICE & REVEAL ROLES */}
      {offlinePhase === 'reveal_roles' && (
        <div className="rounded-3xl bg-gradient-to-b from-[#191030] to-[#0d081b] border-2 border-purple-700/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-3xl mx-auto shadow-md">
            {currentPlayer?.avatar}
          </div>

          <div>
            <span className="text-xs text-purple-400 font-medium">مرّر الجهاز إلى:</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {currentPlayer?.name}
            </h3>
            <p className="text-xs text-purple-300/70 mt-1">
              تأكد ألا ينظر أحد إلى الشاشة غيرك! 🤫
            </p>
          </div>

          {/* Curtain Toggle */}
          {!isRevealed ? (
            <button
              onClick={() => {
                sounds.playReveal();
                setIsRevealed(true);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-base shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-5 h-5" />
              <span>اضغط هنا لكشف دورك السري</span>
            </button>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className={`p-6 rounded-2xl border-2 text-center ${
                isCurrentOdd 
                  ? 'bg-red-950/50 border-red-500/70' 
                  : 'bg-purple-950/60 border-orange-500/60'
              }`}>
                <div className="text-xs text-purple-300 mb-1">تصنيف السالفة: {secretCat}</div>

                {isCurrentOdd ? (
                  <div className="space-y-2">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
                    <div className="text-2xl font-black text-red-400">أنت برّا السالفة! 🤫</div>
                    <p className="text-xs text-red-200/80">
                      ما تدري وش الكلمة! اسمع أسئلة ربعك وسلّك بدون ما تنكشف.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs text-purple-300">الكلمة السرية للجلسة:</span>
                    <div className="text-3xl font-black text-white bg-black/40 py-2.5 px-4 rounded-xl border border-orange-500/40">
                      {secretWord}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleNextPlayerReveal}
                className="w-full py-3.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-sm border border-purple-700/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <EyeOff className="w-4 h-4" />
                <span>إخفاء وتمرير للاعب التالي</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 2: QUESTIONING & TIMER */}
      {offlinePhase === 'questioning' && (
        <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 sm:p-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-orange-400">
            <Clock className="w-6 h-6 animate-spin" />
            <span className="text-4xl font-black font-mono tracking-wider">{timerSeconds}s</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">ابدأوا بالأسئلة والتحقيق! 🔥</h3>
            <p className="text-sm text-purple-200/80 max-w-md mx-auto leading-relaxed">
              كل لاعب يسأل شخصاً آخر سؤالاً متعلقاً بالكلمة. انتبهوا للإجابات المترددة والغريبة!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-purple-800/30 text-xs text-purple-300 space-y-1">
            <div className="font-bold text-orange-400 mb-1">💡 نصيحة تكتيكية:</div>
            <div>• لا تسأل سؤالاً مباشراً يكشف الكلمة لبرا السالفة!</div>
            <div>• إذا كنت برا السالفة، راقب تعابير وجوه اللاعبين وردودهم.</div>
          </div>

          <button
            onClick={() => {
              setTimerRunning(false);
              setOfflinePhase('voting');
              sounds.playSpark();
            }}
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            الانتقال للتصويت وكشف برا السالفة ➔
          </button>
        </div>
      )}

      {/* PHASE 3: VOTING */}
      {offlinePhase === 'voting' && (
        <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-black text-white">حان وقت التصويت! 🗳️</h3>
            <p className="text-xs text-purple-200/70 mt-1">صوّتوا بالدور: مين تعتقدون إنه برا السالفة؟</p>
          </div>

          <div className="space-y-3">
            {players.map(voter => {
              const currentVoted = offlineVotes[voter.id];
              return (
                <div key={voter.id} className="p-3 rounded-2xl bg-purple-900/20 border border-purple-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{voter.avatar}</span>
                    <span className="text-xs font-bold text-white">{voter.name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {players.filter(p => p.id !== voter.id).map(target => (
                      <button
                        key={target.id}
                        onClick={() => handleVotePlayer(voter.id, target.id)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                          currentVoted === target.id
                            ? 'bg-orange-500 text-white'
                            : 'bg-purple-950/60 text-purple-300 hover:text-white hover:bg-purple-800'
                        }`}
                      >
                        {target.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PHASE 4: ODD PLAYER GUESS */}
      {offlinePhase === 'odd_guess' && (
        <div className="rounded-3xl bg-gradient-to-b from-red-950/40 to-purple-950/60 border-2 border-red-500/60 p-6 sm:p-8 text-center space-y-5">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h3 className="text-2xl font-black text-white">
            كشفتموها! المتهم هو: {players.find(p => p.id === accusedPlayerId)?.name}
          </h3>
          <p className="text-xs text-purple-200">
            لكن فرصة أخيرة لبرا السالفة للهروب بالنقاط: ما هي الكلمة السرية؟
          </p>

          <div className="max-w-md mx-auto space-y-3">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="اكتب الكلمة السرية هنا..."
              className="w-full bg-black/60 border border-orange-500/60 rounded-xl px-4 py-3 text-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleOddGuessSubmit}
              disabled={!guessInput.trim()}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
            >
              تأكيد التخمين
            </button>
          </div>
        </div>
      )}

      {/* PHASE 5: ROUND SUMMARY */}
      {offlinePhase === 'round_summary' && (
        <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 sm:p-8 text-center space-y-6">
          <Award className="w-16 h-16 text-amber-400 mx-auto" />
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {accusedPlayerId === oddPlayerId && guessResult !== 'success'
              ? 'كفو يا جماعة! كشفتوا برا السالفة وحصدتوا النقاط! 🎉'
              : 'برا السالفة فاز بالنقاط وهرب بنجاح! 🏃‍♂️💨'}
          </h3>

          <div className="p-4 rounded-2xl bg-black/40 max-w-sm mx-auto border border-purple-800/40 space-y-2">
            <div className="text-xs text-purple-300">
              برا السالفة كان: <strong className="text-orange-400">{players.find(p => p.id === oddPlayerId)?.name}</strong>
            </div>
            <div className="text-xs text-purple-300">
              الكلمة السرية كانت: <strong className="text-white">{secretWord}</strong>
            </div>
          </div>

          {/* Current Scoreboard Preview */}
          <div className="max-w-md mx-auto space-y-2 text-right">
            <div className="text-xs font-bold text-purple-300">جدول نقاط الجولة:</div>
            {players.map(p => (
              <div key={p.id} className="p-2.5 rounded-xl bg-purple-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{p.avatar}</span>
                  <span className="text-xs font-bold text-white">{p.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">{p.score} نقطة</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              sounds.playSpark();
              if (onNextRound) onNextRound();
            }}
            className="py-3 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            {currentRound >= totalRounds ? 'عرض النتائج النهائية والتتويج 🏆' : 'الجولة التالية ➔'}
          </button>
        </div>
      )}
    </div>
  );
};
