import React, { useState, useEffect } from 'react';
import { MessageSquareX, Clock, Check, X, SkipForward, Users, Volume2, Flame } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sounds } from '../../services/soundEffects';
import confetti from 'canvas-confetti';
import { QUESTIONS_BANK } from '../../data/questionsBank';

interface TabooEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  onScoreAction?: (action: 'correct' | 'forbidden_buzz' | 'skip') => void;
  onNextRound?: () => void;
  onlineGameData?: any;
  onlineStatus?: string;
  isHost?: boolean;
}

export const TabooEngine: React.FC<TabooEngineProps> = ({
  mode,
  players,
  currentRound,
  totalRounds,
  questionData,
  onScoreAction,
  onNextRound,
  onlineGameData,
  onlineStatus,
  isHost
}) => {
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [correctCardsCount, setCorrectCardsCount] = useState(0);
  const [foulsCount, setFoulsCount] = useState(0);
  const [isTurnOver, setIsTurnOver] = useState(false);

  // Pool of taboo cards
  const tabooCards = QUESTIONS_BANK.filter(q => q.gameId === 'taboo_words');
  const activeCard = (mode === 'online' && onlineGameData)
    ? {
        question: onlineGameData.targetWord,
        category: onlineGameData.category,
        forbiddenWords: onlineGameData.forbiddenWords || []
      }
    : tabooCards[currentCardIndex % tabooCards.length] || questionData;

  useEffect(() => {
    setTimerSeconds(60);
    setTimerRunning(true);
    setIsTurnOver(false);
    setCorrectCardsCount(0);
    setFoulsCount(0);
  }, [currentRound]);

  // Offline timer countdown
  useEffect(() => {
    let interval: any = null;
    if (mode === 'offline' && timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            setIsTurnOver(true);
            sounds.playWrong();
            return 0;
          }
          if (s <= 5) sounds.playTick();
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, mode]);

  const handleCorrect = () => {
    sounds.playCorrect();
    setCorrectCardsCount(c => c + 1);
    confetti({ particleCount: 30, spread: 50 });

    if (mode === 'online') {
      if (onScoreAction) onScoreAction('correct');
    } else {
      if (players.length > 0) {
        players[(currentRound - 1) % players.length].score += 50;
      }
      setCurrentCardIndex(c => c + 1);
    }
  };

  const handleFoul = () => {
    sounds.playWrong();
    setFoulsCount(f => f + 1);

    if (mode === 'online') {
      if (onScoreAction) onScoreAction('forbidden_buzz');
    } else {
      if (players.length > 0) {
        const p = players[(currentRound - 1) % players.length];
        p.score = Math.max(0, p.score - 30);
      }
    }
  };

  const handleSkip = () => {
    sounds.playSpark();
    if (mode === 'online') {
      if (onScoreAction) onScoreAction('skip');
    } else {
      setCurrentCardIndex(c => c + 1);
    }
  };

  const activePlayer = players[(currentRound - 1) % players.length];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-orange-400 font-bold">جولة {currentRound} من {totalRounds}</span>
          <h2 className="text-sm font-black text-white">ممنوع تقول! · دور: {activePlayer?.name}</h2>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-bold text-sm ${
          timerSeconds <= 10 ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-purple-900/40 text-purple-200 border border-purple-700/40'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{timerSeconds}s</span>
        </div>
      </div>

      {/* Main Taboo Card */}
      {!isTurnOver ? (
        <div className="rounded-3xl bg-gradient-to-b from-[#220d18] to-[#0d081b] border-2 border-red-600/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="text-xs font-bold text-orange-400 tracking-wider">
            {activeCard?.category || 'كلمات وتخمين'}
          </div>

          {/* Target Word to Describe */}
          <div className="py-4 px-6 rounded-2xl bg-black/50 border-2 border-orange-500/60 shadow-inner inline-block min-w-[260px]">
            <span className="text-xs text-purple-400 block mb-1">الكلمة المستهدفة للشرح:</span>
            <div className="text-3xl sm:text-4xl font-black text-white">
              {activeCard?.question}
            </div>
          </div>

          {/* Forbidden Words Box */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-red-400 flex items-center justify-center gap-1.5">
              <MessageSquareX className="w-4 h-4 text-red-500" />
              <span>الكلمات الممنوعة (احذر تنطقها!):</span>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2 max-w-sm mx-auto">
              {(activeCard?.forbiddenWords || []).map((word: string, idx: number) => (
                <div
                  key={idx}
                  className="py-1.5 px-3 rounded-lg bg-red-900/20 border border-red-500/20 text-sm font-bold text-red-200 flex items-center justify-between"
                >
                  <span>{word}</span>
                  <X className="w-4 h-4 text-red-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Interactive Buzzer Controls */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={handleCorrect}
              className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>صحيح (+50)</span>
            </button>

            <button
              onClick={handleFoul}
              className="py-3 px-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-5 h-5 animate-bounce" />
              <span>ممنوعة (-30)</span>
            </button>

            <button
              onClick={handleSkip}
              className="py-3 px-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs sm:text-sm border border-purple-700/40 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-5 h-5" />
              <span>تخطي</span>
            </button>
          </div>
        </div>
      ) : (
        /* Round Finished Summary */
        <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 sm:p-8 text-center space-y-6">
          <Clock className="w-16 h-16 text-orange-400 mx-auto" />
          <h3 className="text-2xl font-black text-white">انتهى وقت الدور! ⏰</h3>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 block">إجابات صحيحة</span>
              <span className="text-xl font-bold text-white">{correctCardsCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40">
              <span className="text-[10px] text-red-400 block">كلمات ممنوعة</span>
              <span className="text-xl font-bold text-white">{foulsCount}</span>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playSpark();
              if (onNextRound) onNextRound();
            }}
            className="w-full sm:w-auto py-3 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            {currentRound >= totalRounds ? 'عرض النتائج النهائية 🏆' : 'الدور التالي ➔'}
          </button>
        </div>
      )}
    </div>
  );
};
