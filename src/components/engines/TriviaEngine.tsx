import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, CheckCircle2, XCircle, Flame, HelpCircle, ArrowRight, Award } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sounds } from '../../services/soundEffects';
import confetti from 'canvas-confetti';

interface TriviaEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  onOnlineAnswer?: (answer: string, timeRemaining: number) => void;
  onNextRound?: () => void;
  onlineGameData?: any;
  onlineStatus?: string;
  isHost?: boolean;
}

export const TriviaEngine: React.FC<TriviaEngineProps> = ({
  mode,
  players,
  currentRound,
  totalRounds,
  questionData,
  onOnlineAnswer,
  onNextRound,
  onlineGameData,
  onlineStatus,
  isHost
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [timerRunning, setTimerRunning] = useState(true);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [usedLifeline, setUsedLifeline] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Active question info
  const activeQuestion = (mode === 'online' && onlineGameData) ? onlineGameData : questionData;
  const options = activeQuestion?.options || ['الخيار 1', 'الخيار 2', 'الخيار 3', 'الخيار 4'];
  const correctAnswer = activeQuestion?.correctAnswer;
  const explanation = activeQuestion?.explanation;

  // Reset per round
  useEffect(() => {
    setSelectedOption(null);
    setTimerSeconds(15);
    setTimerRunning(true);
    setIsAnswerRevealed(false);
    setEliminatedOptions([]);
    setUsedLifeline(false);
  }, [currentRound]);

  // Offline Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (mode === 'offline' && timerRunning && timerSeconds > 0 && !isAnswerRevealed) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            handleTimeUp();
            return 0;
          }
          if (s <= 4) sounds.playTick();
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, isAnswerRevealed, mode]);

  const handleTimeUp = () => {
    setIsAnswerRevealed(true);
    sounds.playWrong();
    setStreakCount(0);
  };

  const handleSelectAnswer = (option: string) => {
    if (selectedOption !== null || isAnswerRevealed) return;
    setSelectedOption(option);
    sounds.playSpark();

    if (mode === 'online') {
      if (onOnlineAnswer) {
        onOnlineAnswer(option, timerSeconds);
      }
    } else {
      // Offline mode
      setTimerRunning(false);
      setIsAnswerRevealed(true);

      const isCorrect = option === correctAnswer;
      if (isCorrect) {
        sounds.playCorrect();
        const bonus = Math.round(timerSeconds * 6);
        const streakBonus = streakCount * 25;
        const totalAward = 100 + bonus + streakBonus;
        setStreakCount(s => s + 1);

        // In offline trivia, award to all players or active player
        if (players.length > 0) {
          players[0].score += totalAward;
        }

        confetti({ particleCount: 50, spread: 60 });
      } else {
        sounds.playWrong();
        setStreakCount(0);
      }
    }
  };

  // 50/50 Lifeline
  const handleUse5050 = () => {
    if (usedLifeline || isAnswerRevealed) return;
    setUsedLifeline(true);
    sounds.playSpark();

    const wrongOptions = options.filter((opt: string) => opt !== correctAnswer);
    const toRemove = wrongOptions.slice(0, 2);
    setEliminatedOptions(toRemove);
  };

  const isRoundResults = mode === 'online' && (onlineStatus === 'round_results' || onlineStatus === 'game_over');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-purple-400 font-bold">جولة {currentRound} من {totalRounds}</span>
            <div className="text-xs font-bold text-white">أسئلة ونقاط · {activeQuestion?.category || 'معلومات عامة'}</div>
          </div>
        </div>

        {/* Timer Bar or Count */}
        <div className="flex items-center gap-3">
          {streakCount > 1 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/40 text-xs font-bold text-orange-400">
              <Flame className="w-3.5 h-3.5" />
              <span>سلسلة ×{streakCount}</span>
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-bold text-sm ${
            timerSeconds <= 5 ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-purple-900/40 text-purple-200 border border-purple-700/40'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{mode === 'online' ? (onlineGameData?.timerSeconds || timerSeconds) : timerSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-3xl bg-gradient-to-b from-purple-950/60 to-[#0e081b] border-2 border-purple-700/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
          {activeQuestion?.question}
        </h3>

        {/* 50/50 Lifeline Button */}
        {mode === 'offline' && !isAnswerRevealed && (
          <button
            onClick={handleUse5050}
            disabled={usedLifeline}
            className={`mx-auto px-4 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              usedLifeline
                ? 'opacity-40 border-purple-900 bg-purple-950/20 text-purple-500'
                : 'border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 cursor-pointer'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>وسيلة مساعدة: حذف إجابتين (50:50)</span>
          </button>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
          {options.map((opt: string, idx: number) => {
            const isEliminated = eliminatedOptions.includes(opt);
            const isSelected = selectedOption === opt;
            const showCorrect = isAnswerRevealed || isRoundResults;
            const isThisCorrect = opt === correctAnswer;

            let btnStyle = 'bg-purple-900/30 border-purple-800/40 text-white hover:border-orange-500/60 hover:bg-purple-800/30';
            if (showCorrect) {
              if (isThisCorrect) {
                btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20';
              } else if (isSelected && !isThisCorrect) {
                btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
              } else {
                btnStyle = 'opacity-40 border-purple-900/30 bg-purple-950/20 text-purple-400';
              }
            } else if (isSelected) {
              btnStyle = 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/30';
            }

            return (
              <button
                key={idx}
                disabled={isEliminated || (selectedOption !== null && mode === 'offline') || isRoundResults}
                onClick={() => handleSelectAnswer(opt)}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-right text-sm font-bold ${btnStyle} ${
                  isEliminated ? 'opacity-20 line-through cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span>{opt}</span>
                {showCorrect && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                {showCorrect && isSelected && !isThisCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Box */}
        {(isAnswerRevealed || isRoundResults) && explanation && (
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-800/40 text-right space-y-1 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-orange-400">معلومة إضافية:</span>
            <p className="text-xs text-purple-200/90 leading-relaxed">{explanation}</p>
          </div>
        )}

        {/* Next Round Action */}
        {(isAnswerRevealed || isRoundResults) && (
          <div className="pt-2">
            <button
              onClick={() => {
                sounds.playSpark();
                if (onNextRound) onNextRound();
              }}
              className="w-full sm:w-auto py-3 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              {currentRound >= totalRounds ? 'عرض النتائج النهائية 🏆' : 'السؤال التالي ➔'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
