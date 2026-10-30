import React, { useState, useEffect } from 'react';
import { Users, Vote, Award, ArrowRight, Flame } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sounds } from '../../services/soundEffects';
import confetti from 'canvas-confetti';

interface WhoAmongUsEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  onOnlineVote?: (targetPlayerId: string) => void;
  onNextRound?: () => void;
  onlineGameData?: any;
  onlineStatus?: string;
  isHost?: boolean;
}

export const WhoAmongUsEngine: React.FC<WhoAmongUsEngineProps> = ({
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
  const [offlineVotes, setOfflineVotes] = useState<Record<string, string>>({});
  const [isRevealed, setIsRevealed] = useState(false);
  const [mostVotedPlayer, setMostVotedPlayer] = useState<Player | null>(null);

  const activeQuestion = (mode === 'online' && onlineGameData)
    ? onlineGameData.question
    : questionData?.question || 'مين أكثر واحد يسحب على مواعيده؟';

  useEffect(() => {
    setOfflineVotes({});
    setIsRevealed(false);
    setMostVotedPlayer(null);
  }, [currentRound]);

  const handleVote = (voterId: string, targetId: string) => {
    sounds.playSpark();
    const updated = { ...offlineVotes, [voterId]: targetId };
    setOfflineVotes(updated);

    if (Object.keys(updated).length === players.length) {
      // All players voted! Calculate highest
      const counts: Record<string, number> = {};
      Object.values(updated).forEach(tid => {
        counts[tid] = (counts[tid] || 0) + 1;
      });
      let maxVotes = 0;
      let winnerId = '';
      for (const [tid, c] of Object.entries(counts)) {
        if (c > maxVotes) {
          maxVotes = c;
          winnerId = tid;
        }
      }

      const p = players.find(x => x.id === winnerId);
      setMostVotedPlayer(p || null);
      setIsRevealed(true);

      // Award points for who matched the consensus
      players.forEach(pl => {
        if (updated[pl.id] === winnerId) {
          pl.score += 80;
        }
      });

      confetti({ particleCount: 50, spread: 60 });
      sounds.playFanfare();
    }
  };

  const isRoundResults = mode === 'online' && (onlineStatus === 'round_results' || onlineStatus === 'game_over');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 text-center">
        <span className="text-xs font-bold text-orange-400">جولة {currentRound} من {totalRounds} · مين فينا؟</span>
        <h2 className="text-xl font-black text-white mt-1">كشف المستور والآراء الصريحة 😂</h2>
      </div>

      <div className="rounded-3xl bg-gradient-to-b from-[#1b0d2a] to-[#0d081b] border-2 border-purple-700/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="p-4 rounded-2xl bg-black/40 border border-orange-500/40">
          <span className="text-xs text-orange-400 block mb-1">الموقف أو السؤال:</span>
          <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
            {activeQuestion}
          </h3>
        </div>

        {/* Voting UI */}
        {!isRevealed && !isRoundResults ? (
          <div className="space-y-4">
            <p className="text-xs text-purple-200/80">
              صوّتوا بالدور: مين الشخص الأنسب لهذا الوصف في الجلسة؟
            </p>

            <div className="space-y-2">
              {players.map(voter => {
                const voted = offlineVotes[voter.id];
                return (
                  <div key={voter.id} className="p-2.5 rounded-xl bg-purple-900/30 border border-purple-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{voter.avatar}</span>
                      <span className="text-xs font-bold text-white">{voter.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {players.map(target => (
                        <button
                          key={target.id}
                          onClick={() => handleVote(voter.id, target.id)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                            voted === target.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-purple-950/60 text-purple-300 hover:text-white'
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
        ) : (
          /* Results reveal */
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <Award className="w-16 h-16 text-amber-400 mx-auto" />
            <div>
              <span className="text-xs text-purple-400">الشخص اللي اتفق عليه الجميع:</span>
              <div className="text-3xl font-black text-white mt-1">
                {mostVotedPlayer ? `${mostVotedPlayer.avatar} ${mostVotedPlayer.name}` : 'إجماع الجلسة!'}
              </div>
            </div>

            <p className="text-xs text-purple-200/80">
              حصل كل من وافق رأي الأغلبية على +80 نقطة إجماع! 🔥
            </p>

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
