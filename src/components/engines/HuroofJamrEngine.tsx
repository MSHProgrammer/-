import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, CheckCircle2, XCircle, RotateCcw, ArrowRight, Play, Settings2, Palette } from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { HUROOF_DEFAULT_BANK, HuroofQuestion } from '../../data/huroofDefaultBank';

interface HuroofJamrEngineProps {
  onExit: () => void;
}

export const HuroofJamrEngine: React.FC<HuroofJamrEngineProps> = ({ onExit }) => {
  // Game Setup State
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'round_winner' | 'match_winner'>('setup');
  const [gameTitle, setGameTitle] = useState('حروف مع جَمْر');
  const [roundsToWin, setRoundsToWin] = useState<1 | 2 | 3>(2);
  const [gridSize, setGridSize] = useState<4 | 5 | 6>(5);
  
  // Teams
  const [team1Name, setTeam1Name] = useState('الفريق البنفسجي');
  const [team2Name, setTeam2Name] = useState('الفريق الأخضر');
  const [team1Wins, setTeam1Wins] = useState(0);
  const [team2Wins, setTeam2Wins] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1);

  // Hexagonal Letter Grid
  // Letters: 25 letters for 5x5, 16 for 4x4, 36 for 6x6
  const alphabet = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
  const [gridLetters, setGridLetters] = useState<string[]>([]);
  const [cellOwnership, setCellOwnership] = useState<Record<number, 1 | 2>>({}); // cellIndex -> team (1 or 2)

  // Active question state
  const [activeCellIdx, setActiveCellIdx] = useState<number | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<HuroofQuestion | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [stolenChance, setStolenChance] = useState(false);

  // Initialize board letters
  const initBoard = () => {
    const totalCells = gridSize * gridSize;
    const shuffled: string[] = [];
    while (shuffled.length < totalCells) {
      const alphaShuffled = [...alphabet].sort(() => 0.5 - Math.random());
      shuffled.push(...alphaShuffled);
    }
    setGridLetters(shuffled.slice(0, totalCells));
    setCellOwnership({});
    setActiveCellIdx(null);
    setActiveQuestion(null);
    setAnswerRevealed(false);
  };

  const handleStartGame = () => {
    sound.playClick();
    setTeam1Wins(0);
    setTeam2Wins(0);
    setCurrentRound(1);
    setActiveTeam(1);
    initBoard();
    setGameState('playing');
  };

  // Timer Interval
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
          if (s <= 4) sound.playTick(true);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, answerRevealed]);

  const handleCellClick = (idx: number) => {
    if (cellOwnership[idx] || activeCellIdx !== null) return;
    const letter = gridLetters[idx];

    // Find question for letter
    const qList = HUROOF_DEFAULT_BANK.filter(q => q.letter === letter);
    const q = qList[Math.floor(Math.random() * qList.length)] || {
      letter,
      question: `سؤال يبدأ بحرف (${letter}): اذكر الإجابة الصحيحة بسرعة!`,
      answer: 'الإجابة المعتمدة بحرف ' + letter,
      category: 'عام'
    };

    sound.playTileSelect();
    setActiveCellIdx(idx);
    setActiveQuestion(q);
    setTimerSeconds(20);
    setTimerRunning(true);
    setAnswerRevealed(false);
    setStolenChance(false);
  };

  const handleTimeExpired = () => {
    sound.playWrong();
    if (!stolenChance) {
      setStolenChance(true);
      setTimerSeconds(15);
      setTimerRunning(true);
    } else {
      setAnswerRevealed(true);
    }
  };

  const handleScoreQuestion = (isCorrect: boolean) => {
    if (activeCellIdx === null) return;
    const capturingTeam = stolenChance ? (activeTeam === 1 ? 2 : 1) : activeTeam;

    if (isCorrect) {
      sound.playHoneycomb();
      setCellOwnership(prev => ({ ...prev, [activeCellIdx]: capturingTeam }));
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });

      // Check for round win condition (e.g. majority of cells or 8 cells captured)
      const newOwnership = { ...cellOwnership, [activeCellIdx]: capturingTeam };
      const team1Cells = Object.values(newOwnership).filter(t => t === 1).length;
      const team2Cells = Object.values(newOwnership).filter(t => t === 2).length;
      const targetWinCells = Math.ceil((gridSize * gridSize) / 2);

      if (team1Cells >= targetWinCells || team2Cells >= targetWinCells) {
        const roundWinnerTeam = team1Cells >= targetWinCells ? 1 : 2;
        handleRoundWon(roundWinnerTeam);
        return;
      }
    } else {
      sound.playWrong();
      if (!stolenChance) {
        setStolenChance(true);
        setTimerSeconds(15);
        setTimerRunning(true);
        return;
      }
    }

    setAnswerRevealed(true);
    setTimerRunning(false);
    setActiveTeam(prev => (prev === 1 ? 2 : 1));
  };

  const handleRoundWon = (winnerTeam: 1 | 2) => {
    sound.playVictory();
    confetti({ particleCount: 100, spread: 80 });

    const newTeam1Wins = winnerTeam === 1 ? team1Wins + 1 : team1Wins;
    const newTeam2Wins = winnerTeam === 2 ? team2Wins + 1 : team2Wins;

    setTeam1Wins(newTeam1Wins);
    setTeam2Wins(newTeam2Wins);

    if (newTeam1Wins >= roundsToWin || newTeam2Wins >= roundsToWin) {
      setGameState('match_winner');
    } else {
      setGameState('round_winner');
    }
  };

  const handleNextRound = () => {
    setCurrentRound(r => r + 1);
    initBoard();
    setGameState('playing');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ================= SETUP SCREEN ================= */}
      {gameState === 'setup' && (
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#260f44] via-[#16092c] to-[#0c0418] border-2 border-purple-500/60 shadow-2xl space-y-6 text-right">
          {/* Logo / Header (Matches video 1 style) */}
          <div className="text-center space-y-2">
            <div className="inline-block px-6 py-2 rounded-2xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 shadow-xl shadow-purple-500/30 transform -rotate-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-wider">حُــرُوف مَـع جَمْـر</span>
            </div>
            <p className="text-xs text-purple-300/80 font-bold">المسابقة الكلاسيكية الأشهر على خلية النحل بالحروف العربية</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">اسم اللعبة أو المسابقة:</label>
              <input
                type="text"
                value={gameTitle}
                onChange={e => setGameTitle(e.target.value)}
                placeholder="مثال: حروف مع عائلة الحميدان"
                className="w-full bg-black/50 border border-purple-600/60 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">فريق أ (اليسار):</label>
                <input
                  type="text"
                  value={team1Name}
                  onChange={e => setTeam1Name(e.target.value)}
                  className="w-full bg-purple-950/60 border border-purple-500/60 rounded-xl px-3 py-2 text-white font-bold text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">فريق ب (اليمين):</label>
                <input
                  type="text"
                  value={team2Name}
                  onChange={e => setTeam2Name(e.target.value)}
                  className="w-full bg-emerald-950/60 border border-emerald-500/60 rounded-xl px-3 py-2 text-white font-bold text-xs text-center"
                />
              </div>
            </div>

            {/* Rounds to win */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">عدد جولات الفوز:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 1, label: 'جولة واحدة' },
                  { count: 2, label: 'جولتين (شائع)' },
                  { count: 3, label: 'ثلاث جولات' }
                ].map(r => (
                  <button
                    key={r.count}
                    onClick={() => setRoundsToWin(r.count as any)}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      roundsToWin === r.count ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/30' : 'bg-black/30 border-purple-900/60 text-purple-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Size */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">حجم خلية النحل:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { size: 4, label: '4 × 4 (سريعة)' },
                  { size: 5, label: '5 × 5 (قياسية)' },
                  { size: 6, label: '6 × 6 (حماسية)' }
                ].map(g => (
                  <button
                    key={g.size}
                    onClick={() => setGridSize(g.size as any)}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      gridSize === g.size ? 'bg-amber-500 border-amber-300 text-black shadow-lg shadow-amber-500/30' : 'bg-black/30 border-purple-900/60 text-purple-400'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-base shadow-xl shadow-orange-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>بدء اللعبة وانطلاق التحدي ➔</span>
            </button>

            <button
              onClick={onExit}
              className="w-full text-center text-xs text-purple-400 hover:text-white underline cursor-pointer"
            >
              العودة للقائمة الرئيسية
            </button>
          </div>
        </div>
      )}

      {/* ================= ACTIVE GAMEPLAY SCREEN ================= */}
      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-[#210940] via-[#140628] to-[#210940] border-2 border-purple-600/40 shadow-xl flex items-center justify-between">
            {/* Team 1 Score */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
              activeTeam === 1 ? 'border-purple-400 bg-purple-600/30 shadow-lg shadow-purple-500/20' : 'border-purple-900/40 bg-black/40 opacity-70'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-xl font-black text-white shadow">
                {team1Wins}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-purple-300 font-bold">فريق أ</div>
                <div className="text-xs font-black text-white">{team1Name}</div>
              </div>
            </div>

            {/* Center Info */}
            <div className="text-center">
              <div className="text-xs font-black text-amber-400">الجولة {currentRound} من {roundsToWin * 2 - 1}</div>
              <div className="text-xs text-purple-300 font-bold">دور: <span className={activeTeam === 1 ? 'text-purple-300 font-black' : 'text-emerald-300 font-black'}>{activeTeam === 1 ? team1Name : team2Name}</span></div>
            </div>

            {/* Team 2 Score */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
              activeTeam === 2 ? 'border-emerald-400 bg-emerald-600/30 shadow-lg shadow-emerald-500/20' : 'border-emerald-900/40 bg-black/40 opacity-70'
            }`}>
              <div className="text-right">
                <div className="text-[10px] text-emerald-300 font-bold">فريق ب</div>
                <div className="text-xs font-black text-white">{team2Name}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl font-black text-white shadow">
                {team2Wins}
              </div>
            </div>
          </div>

          {/* Honeycomb Letter Grid */}
          <div className="bg-[#100620]/90 p-6 rounded-3xl border-2 border-purple-800/40 shadow-2xl flex flex-col items-center justify-center">
            <div
              className="grid gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
              }}
            >
              {gridLetters.map((letter, idx) => {
                const owner = cellOwnership[idx];
                let cellColor = 'bg-gradient-to-b from-purple-900/50 to-indigo-950/70 border-purple-500/50 text-purple-200 hover:border-amber-400 hover:scale-105 shadow-md';
                if (owner === 1) {
                  cellColor = 'bg-gradient-to-b from-purple-600 to-indigo-700 border-purple-300 text-white shadow-lg shadow-purple-600/40';
                } else if (owner === 2) {
                  cellColor = 'bg-gradient-to-b from-emerald-600 to-teal-700 border-emerald-300 text-white shadow-lg shadow-emerald-600/40';
                }

                return (
                  <button
                    key={idx}
                    disabled={!!owner || activeCellIdx !== null}
                    onClick={() => handleCellClick(idx)}
                    className={`w-12 h-14 sm:w-16 sm:h-18 md:w-20 md:h-22 rounded-2xl border-2 flex items-center justify-center font-black text-xl sm:text-2xl md:text-3xl transition-all cursor-pointer ${cellColor} ${
                      owner ? 'cursor-default' : ''
                    }`}
                  >
                    <span>{letter}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setGameState('setup')}
              className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
            >
              إلغاء والتراجع لإعدادات اللعبة
            </button>
          </div>
        </div>
      )}

      {/* ================= ACTIVE QUESTION MODAL ================= */}
      {activeCellIdx !== null && activeQuestion && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-lg w-full bg-gradient-to-b from-[#250d44] to-[#0d0418] border-2 border-purple-500/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-right">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center text-2xl font-black shadow-lg">
                  {activeQuestion.letter}
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-400">سؤال يبدأ بحرف ({activeQuestion.letter})</div>
                  <div className="text-sm font-black text-white">الدور على: {stolenChance ? (activeTeam === 1 ? team2Name : team1Name) : (activeTeam === 1 ? team1Name : team2Name)}</div>
                </div>
              </div>

              {/* Timer Bar */}
              <div className={`px-4 py-1.5 rounded-2xl font-mono text-xl font-black border flex items-center gap-1.5 ${
                timerSeconds <= 5 ? 'bg-red-500/20 text-red-400 border-red-500/60 animate-pulse' : 'bg-purple-900/40 text-purple-200 border-purple-700/60'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{timerSeconds}s</span>
              </div>
            </div>

            {/* Steal alert */}
            {stolenChance && (
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black text-center animate-pulse">
                ⚡ فرصة اقتناص الحرف للفريق المنافس!
              </div>
            )}

            {/* Question Text */}
            <div className="py-4 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
                {activeQuestion.question}
              </h3>
            </div>

            {/* Answer Display */}
            {answerRevealed && (
              <div className="p-4 rounded-2xl bg-black/50 border border-purple-500/40 space-y-1 animate-in fade-in">
                <div className="text-xs font-bold text-purple-400">الإجابة المعتمدة:</div>
                <div className="text-lg font-black text-emerald-300">{activeQuestion.answer}</div>
              </div>
            )}

            {/* Evaluation Actions */}
            <div className="flex items-center justify-between pt-2">
              {!answerRevealed ? (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => handleScoreQuestion(true)}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>إجابة صحيحة (امتلاك الحرف)</span>
                  </button>
                  <button
                    onClick={() => handleScoreQuestion(false)}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>إجابة خاطئة</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveCellIdx(null);
                    setActiveQuestion(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>متابعة لوحة الحروف ➔</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ROUND WINNER MODAL ================= */}
      {gameState === 'round_winner' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-b from-purple-950 to-[#0e041d] border-2 border-purple-500 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
            <h2 className="text-2xl font-black text-white">انتهت الجولة {currentRound}!</h2>
            <div className="text-base text-purple-300 font-bold">
              {team1Wins > team2Wins ? `تقدم ${team1Name} بـ ${team1Wins} جولات` : `تقدم ${team2Name} بـ ${team2Wins} جولات`}
            </div>
            <button
              onClick={handleNextRound}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-sm cursor-pointer shadow-lg shadow-orange-500/30"
            >
              بدء الجولة التالية ➔
            </button>
          </div>
        </div>
      )}

      {/* ================= MATCH WINNER (بطل الحروف) ================= */}
      {gameState === 'match_winner' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-b from-purple-950 via-[#18082e] to-[#0c0418] border-2 border-yellow-400 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto animate-bounce" />
            <div className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-xs font-black">
              👑 بطل الحروف والذكاء
            </div>
            <h2 className="text-3xl font-black text-white">مبروك الفوز!</h2>
            <div className="text-2xl font-black text-yellow-300">
              {team1Wins >= roundsToWin ? team1Name : team2Name}
            </div>
            <button
              onClick={onExit}
              className="w-full py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm cursor-pointer shadow-lg shadow-yellow-400/30"
            >
              العودة للقائمة الرئيسية 🏆
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
