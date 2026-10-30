import React, { useState } from 'react';
import { Users, Plus, Trash2, ArrowLeft, RotateCcw, Trophy, Sparkles, Flame, Check, Play, Shuffle } from 'lucide-react';
import { Player, GameInfo, QuestionItem } from '../types/game';
import { GAMES_CATALOG } from '../data/gamesCatalog';
import { QUESTIONS_BANK } from '../data/questionsBank';
import { sounds } from '../services/soundEffects';
import { addMatchToHistory, AVATAR_OPTIONS } from '../services/storage';
import confetti from 'canvas-confetti';

// Import All Engines
import { BarrahSalfaEngine } from './engines/BarrahSalfaEngine';
import { TriviaEngine } from './engines/TriviaEngine';
import { TabooEngine } from './engines/TabooEngine';
import { WhoAmongUsEngine } from './engines/WhoAmongUsEngine';
import { FactOrFictionEngine } from './engines/FactOrFictionEngine';
import { SketchEngine } from './engines/SketchEngine';
import { ThisOrThatEngine } from './engines/ThisOrThatEngine';

interface OfflineGameRunnerProps {
  initialGame?: GameInfo | null;
  onExit: () => void;
}

export const OfflineGameRunner: React.FC<OfflineGameRunnerProps> = ({ initialGame, onExit }) => {
  const [selectedGame, setSelectedGame] = useState<GameInfo>(initialGame || GAMES_CATALOG[0]);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'game_over'>('setup');

  // Player roster
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'سعود', avatar: '🔥', score: 0 },
    { id: 'p2', name: 'ريان', avatar: '⚡', score: 0 },
    { id: 'p3', name: 'ريم', avatar: '👑', score: 0 },
    { id: 'p4', name: 'نورة', avatar: '💎', score: 0 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);

  // Add player
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    const p: Player = {
      id: 'p_' + Date.now(),
      name: newPlayerName.trim(),
      avatar: randomAvatar,
      score: 0
    };
    setPlayers([...players, p]);
    setNewPlayerName('');
    sounds.playSpark();
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 2) return;
    setPlayers(players.filter(p => p.id !== id));
    sounds.playSpark();
  };

  const handleStartGame = () => {
    if (players.length < selectedGame.minPlayers) {
      alert(`هذه اللعبة تتطلب ${selectedGame.minPlayers} لاعبين على الأقل!`);
      return;
    }
    sounds.playSpark();
    setPlayers(players.map(p => ({ ...p, score: 0 })));
    setCurrentRound(1);
    setGameState('playing');
  };

  const handleNextRound = () => {
    if (currentRound >= totalRounds) {
      // Game Over! Save match to profile
      const sorted = [...players].sort((a, b) => b.score - a.score);
      addMatchToHistory({
        gameId: selectedGame.id,
        gameTitle: selectedGame.title,
        mode: 'offline',
        playerCount: players.length,
        winnerName: sorted[0]?.name || 'غير محدد',
        userScore: sorted[0]?.score || 0,
        rank: 1
      });

      setGameState('game_over');
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      sounds.playFanfare();
    } else {
      setCurrentRound(r => r + 1);
    }
  };

  // Get question for current round
  const currentQuestions = QUESTIONS_BANK.filter(q => q.gameId === selectedGame.id);
  const questionForRound = currentQuestions[(currentRound - 1) % currentQuestions.length] || currentQuestions[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ======================= SETUP SCREEN ======================= */}
      {gameState === 'setup' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>إعداد جلسة أوفلاين (جهاز واحد)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                تجهيز السهرة وإضافة اللاعبين
              </h1>
            </div>

            <button
              onClick={onExit}
              className="px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>خروج للرئيسية</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Players Roster */}
            <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <span>اللاعبون المشاركون ({players.length})</span>
                </h3>
                <span className="text-xs text-purple-400">الحد الأدنى: {selectedGame.minPlayers} لاعبين</span>
              </div>

              {/* Add player form */}
              <form onSubmit={handleAddPlayer} className="flex gap-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="اسم اللاعب الجديد..."
                  className="flex-1 bg-black/50 border border-purple-700/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </form>

              {/* Player List Chips */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-purple-900/20 border border-purple-800/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.avatar}</span>
                      <span className="text-sm font-bold text-white">{p.name}</span>
                    </div>

                    <button
                      onClick={() => handleRemovePlayer(p.id)}
                      disabled={players.length <= 2}
                      className="text-purple-400 hover:text-red-400 disabled:opacity-20 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Game & Rounds Config */}
            <div className="space-y-6">
              {/* Selected Game Card */}
              <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 space-y-4">
                <span className="text-xs font-bold text-orange-400 block">اللعبة المختارة:</span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{selectedGame.title}</h3>
                    <p className="text-xs text-purple-300">{selectedGame.subtitle}</p>
                  </div>
                </div>

                {/* Change game dropdown */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-purple-300 mb-1.5">تغيير اللعبة:</label>
                  <select
                    value={selectedGame.id}
                    onChange={(e) => {
                      const g = GAMES_CATALOG.find(x => x.id === e.target.value);
                      if (g) {
                        setSelectedGame(g);
                        sounds.playSpark();
                      }
                    }}
                    className="w-full bg-purple-950/80 border border-purple-700/60 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {GAMES_CATALOG.filter(g => g.supportsOffline).map(g => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({g.categoryLabel} · {g.minPlayers}-{g.maxPlayers} لاعبين)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rounds count selector */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-purple-300 mb-1.5">عدد الجولات:</label>
                  <div className="flex gap-2">
                    {[3, 5, 7, 10].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => { setTotalRounds(cnt); sounds.playSpark(); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          totalRounds === cnt
                            ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                            : 'bg-purple-900/30 border-purple-800/40 text-purple-300 hover:text-white'
                        }`}
                      >
                        {cnt} جولات
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-base shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>ابدأ اللعب الآن («ولّعها!»)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= PLAYING SCREEN ======================= */}
      {gameState === 'playing' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Quit / Header Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من إنهاء الجلسة والعودة للإعدادات؟')) {
                  setGameState('setup');
                }
              }}
              className="text-xs font-bold text-purple-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إنهاء اللعبة</span>
            </button>

            {/* Quick Live Scoreboard Bar */}
            <div className="flex items-center gap-3">
              {players.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 text-xs text-purple-200">
                  <span>{p.avatar}</span>
                  <span className="font-bold text-white">{p.name}:</span>
                  <span className="font-mono text-amber-400 font-bold">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Render Active Engine */}
          {selectedGame.engineType === 'barrah_salfa' && (
            <BarrahSalfaEngine
              mode="offline"
              players={players}
              currentRound={currentRound}
              totalRounds={totalRounds}
              questionData={questionForRound}
              onNextRound={handleNextRound}
            />
          )}

          {selectedGame.engineType === 'trivia' && (
            <TriviaEngine
              mode="offline"
              players={players}
              currentRound={currentRound}
              totalRounds={totalRounds}
              questionData={questionForRound}
              onNextRound={handleNextRound}
            />
          )}

          {selectedGame.engineType === 'taboo' && (
            <TabooEngine
              mode="offline"
              players={players}
              currentRound={currentRound}
              totalRounds={totalRounds}
              questionData={questionForRound}
              onNextRound={handleNextRound}
            />
          )}

          {selectedGame.engineType === 'who_among_us' && (
            <WhoAmongUsEngine
              mode="offline"
              players={players}
              currentRound={currentRound}
              totalRounds={totalRounds}
              questionData={questionForRound}
              onNextRound={handleNextRound}
            />
          )}

          {selectedGame.engineType === 'fact_or_fiction' && (
            <FactOrFictionEngine
              mode="offline"
              players={players}
              currentRound={currentRound}
              totalRounds={totalRounds}
              questionData={questionForRound}
              onNextRound={handleNextRound}
            />
          )}

          {selectedGame.engineType === 'sketch' && (
            <SketchEngine
              mode="offline"
              players={players}
              currentRound={currentRound}
              totalRounds={totalRounds}
              questionData={questionForRound}
              onNextRound={handleNextRound}
            />
          )}

          {selectedGame.engineType === 'this_or_that' && (
            <ThisOrThatEngine
              mode="offline"
              players={players}
              currentRound={currentRound}
              totalRounds={totalRounds}
              questionData={questionForRound}
              onNextRound={handleNextRound}
            />
          )}
        </div>
      )}

      {/* ======================= GAME OVER / PODIUM SCREEN ======================= */}
      {gameState === 'game_over' && (
        <div className="rounded-3xl bg-gradient-to-b from-purple-950/60 to-[#0c0817] border-2 border-orange-500/50 p-8 text-center space-y-8 animate-in zoom-in-95 shadow-2xl">
          <div className="space-y-2">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              انتهت السهرة! مبروك للفائز 👑
            </h2>
            <p className="text-sm text-purple-200">
              تم تسجيل نتيجة المباراة في سجل إنجازاتك واكتساب نقاط الخبرة (XP)!
            </p>
          </div>

          {/* Podium (1st, 2nd, 3rd) */}
          <div className="max-w-md mx-auto grid grid-cols-3 items-end gap-2 pt-6">
            {/* 2nd place */}
            {players.length > 1 && (
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">{[...players].sort((a,b)=>b.score-a.score)[1]?.avatar}</span>
                <span className="text-xs font-bold text-white truncate max-w-[80px]">{[...players].sort((a,b)=>b.score-a.score)[1]?.name}</span>
                <span className="text-xs font-mono text-purple-300 font-bold">{[...players].sort((a,b)=>b.score-a.score)[1]?.score}</span>
                <div className="w-full h-24 rounded-t-2xl bg-purple-900/60 border-t-2 border-purple-500 flex items-center justify-center font-black text-lg text-purple-300 mt-2">
                  2
                </div>
              </div>
            )}

            {/* 1st place (Champion) */}
            <div className="flex flex-col items-center -translate-y-4">
              <span className="text-3xl mb-1">{[...players].sort((a,b)=>b.score-a.score)[0]?.avatar}</span>
              <span className="text-sm font-black text-amber-300 truncate max-w-[100px]">{[...players].sort((a,b)=>b.score-a.score)[0]?.name}</span>
              <span className="text-xs font-mono text-amber-400 font-bold">{[...players].sort((a,b)=>b.score-a.score)[0]?.score} نقطة</span>
              <div className="w-full h-32 rounded-t-2xl bg-gradient-to-t from-orange-600 to-amber-500 border-t-2 border-yellow-300 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-orange-500/30 mt-2">
                👑 1
              </div>
            </div>

            {/* 3rd place */}
            {players.length > 2 && (
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">{[...players].sort((a,b)=>b.score-a.score)[2]?.avatar}</span>
                <span className="text-xs font-bold text-white truncate max-w-[80px]">{[...players].sort((a,b)=>b.score-a.score)[2]?.name}</span>
                <span className="text-xs font-mono text-purple-300 font-bold">{[...players].sort((a,b)=>b.score-a.score)[2]?.score}</span>
                <div className="w-full h-16 rounded-t-2xl bg-purple-950 border-t-2 border-purple-700 flex items-center justify-center font-black text-base text-purple-400 mt-2">
                  3
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
            <button
              onClick={() => {
                sounds.playSpark();
                setPlayers(players.map(p => ({ ...p, score: 0 })));
                setCurrentRound(1);
                setGameState('playing');
              }}
              className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>جولة جديدة مع نفس الربع</span>
            </button>

            <button
              onClick={() => setGameState('setup')}
              className="py-3 px-6 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-white font-bold text-sm border border-purple-700/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>تغيير اللعبة أو اللاعبين</span>
            </button>

            <button
              onClick={onExit}
              className="py-3 px-6 rounded-xl bg-black/40 hover:bg-black/60 text-purple-300 font-bold text-sm border border-purple-900/50 transition-all cursor-pointer"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
