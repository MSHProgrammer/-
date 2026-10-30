import React, { useState, useEffect } from 'react';
import { Scale, Users, Flame, ArrowRight, Award } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sounds } from '../../services/soundEffects';

interface ThisOrThatEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  onNextRound?: () => void;
  onlineGameData?: any;
  onlineStatus?: string;
  isHost?: boolean;
}

export const ThisOrThatEngine: React.FC<ThisOrThatEngineProps> = ({
  mode,
  players,
  currentRound,
  totalRounds,
  questionData,
  onNextRound,
  onlineGameData,
  onlineStatus,
  isHost
}) => {
  const [offlineVotes, setOfflineVotes] = useState<Record<string, 'A' | 'B'>>({});
  const [isRevealed, setIsRevealed] = useState(false);

  const activeQuestion = (mode === 'online' && onlineGameData) ? onlineGameData : questionData;
  const optionsAB = activeQuestion?.optionsAB || ['الخيار الأول الحار', 'الخيار الثاني الصعب'];

  useEffect(() => {
    setOfflineVotes({});
    setIsRevealed(false);
  }, [currentRound]);

  const handleVote = (playerId: string, choice: 'A' | 'B') => {
    sounds.playSpark();
    const updated = { ...offlineVotes, [playerId]: choice };
    setOfflineVotes(updated);

    if (Object.keys(updated).length === players.length) {
      setIsRevealed(true);
      sounds.playReveal();
    }
  };

  const countA = Object.values(offlineVotes).filter(v => v === 'A').length;
  const countB = Object.values(offlineVotes).filter(v => v === 'B').length;
  const total = Math.max(1, countA + countB);
  const pctA = Math.round((countA / total) * 100);
  const pctB = Math.round((countB / total) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 text-center">
        <span className="text-xs font-bold text-orange-400">جولة {currentRound} من {totalRounds} · هذا أو ذاك</span>
        <h2 className="text-lg font-black text-white mt-1">خيارات محرجة ومعضلات تشعل النقاش! 🔥</h2>
      </div>

      <div className="rounded-3xl bg-gradient-to-b from-[#1b122c] to-[#0c0817] border-2 border-amber-500/30 p-6 sm:p-8 space-y-6 shadow-2xl">
        <h3 className="text-xl sm:text-2xl font-black text-white text-center leading-relaxed">
          {activeQuestion?.question || 'أيهما تختار لو أُجبرت؟'}
        </h3>

        {/* The 2 Opposing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-950/50 to-purple-950/40 border-2 border-orange-500/40 text-center space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-orange-400 block mb-1">الخيار (أ)</span>
              <p className="text-base font-black text-white leading-relaxed">
                {optionsAB[0]}
              </p>
            </div>

            {isRevealed && (
              <div className="pt-4 border-t border-orange-500/30 animate-in fade-in">
                <span className="text-3xl font-black text-orange-400 font-mono">{pctA}%</span>
                <span className="text-xs text-purple-300 block">{countA} أصوات</span>
              </div>
            )}
          </div>

          {/* Card B */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-purple-950/40 border-2 border-indigo-500/40 text-center space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-400 block mb-1">الخيار (ب)</span>
              <p className="text-base font-black text-white leading-relaxed">
                {optionsAB[1]}
              </p>
            </div>

            {isRevealed && (
              <div className="pt-4 border-t border-indigo-500/30 animate-in fade-in">
                <span className="text-3xl font-black text-indigo-400 font-mono">{pctB}%</span>
                <span className="text-xs text-purple-300 block">{countB} أصوات</span>
              </div>
            )}
          </div>
        </div>

        {/* Voting by players */}
        {!isRevealed ? (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-purple-300 text-center">صوّتوا بالدور:</div>
            {players.map(p => {
              const voted = offlineVotes[p.id];
              return (
                <div key={p.id} className="p-2.5 rounded-xl bg-purple-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{p.avatar}</span>
                    <span className="text-xs font-bold text-white">{p.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVote(p.id, 'A')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        voted === 'A' ? 'bg-orange-500 text-white' : 'bg-purple-950/60 text-orange-400 hover:bg-orange-500/20'
                      }`}
                    >
                      أ
                    </button>
                    <button
                      onClick={() => handleVote(p.id, 'B')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        voted === 'B' ? 'bg-indigo-600 text-white' : 'bg-purple-950/60 text-indigo-400 hover:bg-indigo-600/20'
                      }`}
                    >
                      ب
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center pt-2">
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
