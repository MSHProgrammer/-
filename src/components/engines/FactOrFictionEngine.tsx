import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Award, HelpCircle } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sounds } from '../../services/soundEffects';
import confetti from 'canvas-confetti';

interface FactOrFictionProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  onOnlineAnswer?: (answer: boolean, timeRemaining: number) => void;
  onNextRound?: () => void;
  onlineGameData?: any;
  onlineStatus?: string;
  isHost?: boolean;
}

export const FactOrFictionEngine: React.FC<FactOrFictionProps> = ({
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
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const activeQuestion = (mode === 'online' && onlineGameData) ? onlineGameData : questionData;
  const correctAnswer = activeQuestion?.correctAnswer;
  const explanation = activeQuestion?.explanation;

  useEffect(() => {
    setSelectedAnswer(null);
    setTimerSeconds(10);
    setIsAnswerRevealed(false);
  }, [currentRound]);

  useEffect(() => {
    let interval: any = null;
    if (mode === 'offline' && timerSeconds > 0 && !isAnswerRevealed) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setIsAnswerRevealed(true);
            sounds.playWrong();
            return 0;
          }
          if (s <= 4) sounds.playTick();
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds, isAnswerRevealed, mode]);

  const handleChoose = (ans: boolean) => {
    if (selectedAnswer !== null || isAnswerRevealed) return;
    setSelectedAnswer(ans);
    sounds.playSpark();

    if (mode === 'online') {
      if (onOnlineAnswer) onOnlineAnswer(ans, timerSeconds);
    } else {
      setIsAnswerRevealed(true);
      const isRight = ans === correctAnswer;
      if (isRight) {
        sounds.playCorrect();
        if (players.length > 0) {
          players[0].score += 100 + timerSeconds * 10;
        }
        confetti({ particleCount: 40, spread: 50 });
      } else {
        sounds.playWrong();
      }
    }
  };

  const isRoundResults = mode === 'online' && (onlineStatus === 'round_results' || onlineStatus === 'game_over');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-orange-400 font-bold">جولة {currentRound} من {totalRounds}</span>
          <h2 className="text-sm font-black text-white">صح أم خطأ الخادعة</h2>
        </div>
        <div className="px-3 py-1 rounded-xl bg-purple-900/40 border border-purple-700/40 text-xs font-mono font-bold text-purple-200">
          <Clock className="w-3.5 h-3.5 inline ml-1" />
          <span>{timerSeconds}s</span>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-b from-[#131b2a] to-[#0c0817] border-2 border-emerald-500/30 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <span className="text-xs font-bold text-emerald-400 block">
          {activeQuestion?.category || 'غرائب ومعلومات'}
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
          {activeQuestion?.question}
        </h3>

        {/* 2 Big Choice Buttons: صح vs خطأ */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            disabled={selectedAnswer !== null && mode === 'offline'}
            onClick={() => handleChoose(true)}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
              (isAnswerRevealed || isRoundResults)
                ? correctAnswer === true
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/25 scale-102'
                  : selectedAnswer === true
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'opacity-40 border-purple-900 bg-purple-950/20 text-purple-400'
                : selectedAnswer === true
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-emerald-950/40 border-emerald-600/40 hover:bg-emerald-900/50 text-white'
            }`}
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-black">صح (حقيقة)</span>
          </button>

          <button
            disabled={selectedAnswer !== null && mode === 'offline'}
            onClick={() => handleChoose(false)}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
              (isAnswerRevealed || isRoundResults)
                ? correctAnswer === false
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/25 scale-102'
                  : selectedAnswer === false
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'opacity-40 border-purple-900 bg-purple-950/20 text-purple-400'
                : selectedAnswer === false
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-red-950/40 border-red-600/40 hover:bg-red-900/50 text-white'
            }`}
          >
            <XCircle className="w-8 h-8 text-red-400" />
            <span className="text-xl font-black">خطأ (خرافة)</span>
          </button>
        </div>

        {/* Explanation */}
        {(isAnswerRevealed || isRoundResults) && explanation && (
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-800/40 text-right space-y-1 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-orange-400">الحقيقة العلمية الكاملة:</span>
            <p className="text-xs text-purple-200/90 leading-relaxed">{explanation}</p>
          </div>
        )}

        {(isAnswerRevealed || isRoundResults) && (
          <div className="pt-2">
            <button
              onClick={() => {
                sounds.playSpark();
                if (onNextRound) onNextRound();
              }}
              className="py-3 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              {currentRound >= totalRounds ? 'عرض النتائج النهائية 🏆' : 'السؤال التالي ➔'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
