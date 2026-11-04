import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { JamrMatchState } from '../types/jamr';
import { Trophy, Flame, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import { sound } from '../services/soundFx';

interface MatchResultsProps {
  match: JamrMatchState;
  onRematch: () => void;
  onHome: () => void;
}

export const MatchResults: React.FC<MatchResultsProps> = ({
  match,
  onRematch,
  onHome
}) => {
  const { teams, winner } = match;
  const isTie = winner === 'tie' || teams.team1.score === teams.team2.score;
  const winnerTeam = winner === 'team1' ? teams.team1 : winner === 'team2' ? teams.team2 : null;

  useEffect(() => {
    sound.playVictory();
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 400);
    } catch {
      // Confetti fallback
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 text-center animate-in fade-in zoom-in duration-300">
      
      {/* Trophy & Winner Badge */}
      <div className="relative inline-block mb-6">
        <div className="absolute -inset-4 bg-gradient-to-r from-orange-400/20 via-amber-300/30 to-red-400/20 rounded-full blur-xl" />
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-2xl mx-auto border-4 border-white">
          <Trophy className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md animate-bounce" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-3 border border-orange-200">
        <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
        <span>انتهت المباراة واشتعل التحدي!</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
        {isTie ? 'تعادل ناري ومثير بين الفريقين!' : `مبروك الفوز لـ ${winnerTeam?.name}!`}
      </h1>
      <p className="text-sm text-slate-600 font-medium max-w-md mx-auto mb-8">
        {isTie 
          ? 'قدم الفريقان أداءً أسطورياً متكافئاً حتى آخر سؤال في اللوحة.'
          : `حسم ${winnerTeam?.name} اللقب بفضل ذكاء وسرعة لاعبيه!`
        }
      </p>

      {/* Scores Compare Card */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xl mb-8">
        <div className="grid grid-cols-2 gap-4 divide-x divide-x-reverse divide-slate-100">
          
          {/* Team 1 Result */}
          <div className="p-2 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-xs font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                الفريق الأول
              </span>
              {winner === 'team1' && <Award className="w-4 h-4 text-amber-500 fill-amber-400" />}
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{teams.team1.name}</h3>
            <div className="text-4xl sm:text-5xl font-black text-orange-600 font-mono tracking-tight">
              {teams.team1.score}
            </div>
            <span className="text-xs text-slate-500 font-bold block mt-1">نقطة</span>
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
              {teams.team1.players.join('، ') || 'لاعبو الفريق الأول'}
            </p>
          </div>

          {/* Team 2 Result */}
          <div className="p-2 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-xs font-black text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                الفريق الثاني
              </span>
              {winner === 'team2' && <Award className="w-4 h-4 text-amber-500 fill-amber-400" />}
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{teams.team2.name}</h3>
            <div className="text-4xl sm:text-5xl font-black text-red-600 font-mono tracking-tight">
              {teams.team2.score}
            </div>
            <span className="text-xs text-slate-500 font-bold block mt-1">نقطة</span>
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
              {teams.team2.players.join('، ') || 'لاعبو الفريق الثاني'}
            </p>
          </div>

        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => {
            sound.playClick();
            onRematch();
          }}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>مباراة ثأر جديدة 🔥</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onHome();
          }}
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
        >
          <Home className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>
      </div>

    </div>
  );
};
