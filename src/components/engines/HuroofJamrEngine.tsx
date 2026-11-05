import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Trophy, Clock, CheckCircle2, XCircle, RotateCcw, 
  ArrowRight, Settings, Volume2, VolumeX, HelpCircle, X, Shield, Award 
} from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { HUROOF_DEFAULT_BANK, HuroofQuestion } from '../../data/huroofDefaultBank';

interface HuroofJamrEngineProps {
  onExit: () => void;
}

// 5x5 Honeycomb Grid Definition (5 columns, 5 rows = 25 cells)
const COLS = 5;
const ROWS = 5;

// Arabic Alphabet pool for cells
const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
  'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

interface CellData {
  col: number;
  row: number;
  letter: string;
  owner: 1 | 2 | null; // 1 = Green Team, 2 = Orange Team
}

export const HuroofJamrEngine: React.FC<HuroofJamrEngineProps> = ({ onExit }) => {
  // Game state
  const [currentRound, setCurrentRound] = useState(1);
  const [team1Score, setTeam1Score] = useState(0); // Green (Horizontal)
  const [team2Score, setTeam2Score] = useState(0); // Orange (Vertical)
  const [activeTeam, setActiveTeam] = useState<1 | 2>(1); // 1 = Green, 2 = Orange
  const [team1Name, setTeam1Name] = useState('الفريق الأخضر');
  const [team2Name, setTeam2Name] = useState('الفريق البرتقالي');

  // Grid Cells
  const [cells, setCells] = useState<CellData[]>([]);

  // Active question modal state
  const [activeCell, setActiveCell] = useState<CellData | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<HuroofQuestion | null>(null);
  const [huroofStage, setHuroofStage] = useState<'question' | 'revealed' | 'decision'>('question');
  const [timerSeconds, setTimerSeconds] = useState(25);
  const [timerRunning, setTimerRunning] = useState(false);

  // Modals
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [roundWinner, setRoundWinner] = useState<{ team: 1 | 2; name: string } | null>(null);

  // Initialize board for current round
  const initBoard = () => {
    const shuffledLetters = [...ARABIC_LETTERS].sort(() => 0.5 - Math.random());
    const newCells: CellData[] = [];
    let letterIdx = 0;

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const letter = shuffledLetters[letterIdx % shuffledLetters.length];
        letterIdx++;
        newCells.push({
          col: c,
          row: r,
          letter,
          owner: null
        });
      }
    }

    setCells(newCells);
    setActiveCell(null);
    setActiveQuestion(null);
    setHuroofStage('question');
    setRoundWinner(null);
  };

  // Run on mount
  useEffect(() => {
    initBoard();
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (timerRunning && timerSeconds > 0 && huroofStage === 'question') {
      timer = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            sound.playTick(true);
            return 0;
          }
          if (s <= 5) sound.playTick(true);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timerSeconds, huroofStage]);

  // Click a letter cell
  const handleCellClick = (cell: CellData) => {
    if (cell.owner !== null || activeCell !== null || roundWinner) return;

    // Find questions starting with this letter
    const bank = HUROOF_DEFAULT_BANK.filter(q => q.letter === cell.letter);
    const question = bank.length > 0 
      ? bank[Math.floor(Math.random() * bank.length)]
      : {
          letter: cell.letter,
          question: `سؤال يبدأ بحرف (${cell.letter}): اذكر الإجابة الصحيحة بسرعة!`,
          answer: `الإجابة المعتمدة بحرف ${cell.letter}`,
          category: 'عام'
        };

    sound.playTileSelect();
    setActiveCell(cell);
    setActiveQuestion(question);
    setHuroofStage('question');
    setTimerSeconds(25);
    setTimerRunning(true);
  };

  const handleTimeExpired = () => {
    sound.playWrong();
    setTimerRunning(false);
    setHuroofStage('revealed');
  };

  // Check victory condition
  // Team 1 (Green) wins if they complete a full horizontal row (all 5 cells in any row)
  // Team 2 (Orange) wins if they complete a full vertical column (all 5 cells in any column)
  const checkVictory = (currentCells: CellData[]): (1 | 2) | null => {
    // 1. Check Horizontal Win for Team 1 (Green): any row 0..4 fully owned by Team 1
    for (let r = 0; r < ROWS; r++) {
      const rowCells = currentCells.filter(c => c.row === r);
      if (rowCells.length === COLS && rowCells.every(c => c.owner === 1)) {
        return 1;
      }
    }

    // 2. Check Vertical Win for Team 2 (Orange): any col 0..4 fully owned by Team 2
    for (let c = 0; c < COLS; c++) {
      const colCells = currentCells.filter(cell => cell.col === c);
      if (colCells.length === ROWS && colCells.every(cell => cell.owner === 2)) {
        return 2;
      }
    }

    // 3. Alternative path connectivity check (Team 1 left-to-right path, Team 2 top-to-bottom path)
    if (hasConnectedHorizontal(currentCells, 1)) return 1;
    if (hasConnectedVertical(currentCells, 2)) return 2;

    return null;
  };

  // Helper: check if Team 1 connected col 0 to col 4 through adjacent cells
  const hasConnectedHorizontal = (grid: CellData[], team: 1): boolean => {
    const visited = new Set<string>();
    const startNodes = grid.filter(c => c.col === 0 && c.owner === team);
    if (startNodes.length === 0) return false;

    const queue = [...startNodes];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const key = `${curr.col},${curr.row}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (curr.col === COLS - 1) return true; // reached other side!

      // Find adjacent honeycomb neighbors
      const neighbors = getHoneyNeighbors(curr, grid).filter(n => n.owner === team && !visited.has(`${n.col},${n.row}`));
      queue.push(...neighbors);
    }
    return false;
  };

  // Helper: check if Team 2 connected row 0 to row 4 through adjacent cells
  const hasConnectedVertical = (grid: CellData[], team: 2): boolean => {
    const visited = new Set<string>();
    const startNodes = grid.filter(c => c.row === 0 && c.owner === team);
    if (startNodes.length === 0) return false;

    const queue = [...startNodes];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const key = `${curr.col},${curr.row}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (curr.row === ROWS - 1) return true; // reached bottom!

      const neighbors = getHoneyNeighbors(curr, grid).filter(n => n.owner === team && !visited.has(`${n.col},${n.row}`));
      queue.push(...neighbors);
    }
    return false;
  };

  const getHoneyNeighbors = (cell: CellData, grid: CellData[]): CellData[] => {
    // Honeycomb staggered columns adjacency
    const isOddCol = cell.col % 2 !== 0;
    const deltas = isOddCol 
      ? [
          { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
          { dc: -1, dr: 0 }, { dc: -1, dr: 1 },
          { dc: 1, dr: 0 }, { dc: 1, dr: 1 }
        ]
      : [
          { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
          { dc: -1, dr: -1 }, { dc: -1, dr: 0 },
          { dc: 1, dr: -1 }, { dc: 1, dr: 0 }
        ];

    return deltas
      .map(d => grid.find(c => c.col === cell.col + d.dc && c.row === cell.row + d.dr))
      .filter(Boolean) as CellData[];
  };

  // Score the question: true = 'جاوب صح', false = 'جاوب خطأ / محد جاوب'
  const handleResolveHuroof = (isCorrect: boolean) => {
    if (!activeCell) return;
    const scoringTeam = activeTeam;

    if (isCorrect) {
      sound.playHoneycomb();
      const updatedCells = cells.map(c => 
        c.col === activeCell.col && c.row === activeCell.row ? { ...c, owner: scoringTeam } : c
      );
      setCells(updatedCells);

      // Check if winning condition met
      const winner = checkVictory(updatedCells);
      if (winner) {
        sound.playVictory();
        confetti({ particleCount: 120, spread: 90 });
        if (winner === 1) setTeam1Score(s => s + 1);
        else setTeam2Score(s => s + 1);

        setRoundWinner({
          team: winner,
          name: winner === 1 ? team1Name : team2Name
        });
        setActiveCell(null);
        setTimerRunning(false);
        return;
      }
    } else {
      sound.playWrong();
    }

    // Switch turn to opposing team
    setActiveTeam(prev => (prev === 1 ? 2 : 1));
    setActiveCell(null);
    setTimerRunning(false);
  };

  const handleNextRound = () => {
    sound.playClick();
    setCurrentRound(r => r + 1);
    initBoard();
  };

  // Round label in Arabic
  const getRoundLabel = (round: number) => {
    if (round === 1) return { line1: 'الجولة', line2: 'الأولى' };
    if (round === 2) return { line1: 'الجولة', line2: 'الثانية' };
    if (round === 3) return { line1: 'الجولة', line2: 'الثالثة' };
    if (round === 4) return { line1: 'الجولة', line2: 'الرابعة' };
    return { line1: 'الجولة', line2: `رقم ${round}` };
  };

  const roundName = getRoundLabel(currentRound);

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-[#3c1464] bg-[#22073e] select-none text-right font-sans my-2">
      
      {/* ========================================================================= */}
      {/* MASTER TV SPLIT VIEW (EXACT VISUAL FROM IMG_3926.jpeg)                    */}
      {/* Left: 4-Zone Triangle Split Playfield with Honeycomb Grid                 */}
      {/* Right: Deep Purple Sidebar with 'خيارات', 3D Round Title, & Score Badges  */}
      {/* ========================================================================= */}
      <div className="flex flex-col-reverse lg:flex-row min-h-[580px] sm:min-h-[640px]">
        
        {/* ======================================================= */}
        {/* LEFT PLAYFIELD (approx 70% width)                       */}
        {/* Split Green (Top/Bottom) & Orange (Left/Right)          */}
        {/* ======================================================= */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-[#16a34a]">
          
          {/* Background Triangular Split matching IMG_3926 */}
          {/* Top & Bottom: Vivid Green (#16a34a / #22c55e) */}
          {/* Left & Right: Vivid Orange (#ea580c / #f97316) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                linear-gradient(135deg, #ea580c 0%, #ea580c 25%, transparent 25%, transparent 75%, #ea580c 75%, #ea580c 100%),
                linear-gradient(45deg, #ea580c 0%, #ea580c 25%, #16a34a 25%, #16a34a 75%, #ea580c 75%, #ea580c 100%)
              `
            }}
          />

          {/* Fallback cleanly drawn SVG 4-zone backdrop to guarantee 100% exact match */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Top Green Triangle */}
            <polygon points="0,0 100,0 50,50" fill="#22c55e" />
            {/* Bottom Green Triangle */}
            <polygon points="0,100 100,100 50,50" fill="#22c55e" />
            {/* Left Orange Triangle */}
            <polygon points="0,0 0,100 50,50" fill="#f97316" />
            {/* Right Orange Triangle */}
            <polygon points="100,0 100,100 50,50" fill="#f97316" />
          </svg>

          {/* Goal Indicator Labels */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xs text-white text-[11px] font-black px-4 py-1 rounded-full border border-white/20 z-10">
            🎯 هدف {team1Name}: صف أفقي كامل (من اليمين لليسار)
          </div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-left bg-black/40 backdrop-blur-xs text-white text-[10px] font-black px-3 py-0.5 rounded-full border border-white/20 z-10">
            🎯 هدف {team2Name}: صف عمودي كامل
          </div>

          {/* ===================================================== */}
          {/* HONEYCOMB HEXAGONAL GRID (5 COLUMNS X 5 ROWS - غير متداخلة) */}
          {/* ===================================================== */}
          <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 max-w-full overflow-x-auto py-8 px-3">
            {[0, 1, 2, 3, 4].map((colIdx) => {
              const isOffset = colIdx % 2 !== 0;
              const colCells = cells.filter(c => c.col === colIdx).sort((a, b) => a.row - b.row);

              return (
                <div 
                  key={colIdx} 
                  className={`flex flex-col gap-2 sm:gap-2.5 md:gap-3 transition-all ${isOffset ? 'translate-y-5 sm:translate-y-7 md:translate-y-8' : ''}`}
                >
                  {colCells.map((cell) => {
                    const isClaimedBy1 = cell.owner === 1; // Green
                    const isClaimedBy2 = cell.owner === 2; // Orange
                    const isUnclaimed = cell.owner === null;

                    let bgClass = 'bg-white text-[#4a1572] hover:scale-105 shadow-lg border-2 border-purple-900';
                    if (isClaimedBy1) {
                      bgClass = 'bg-[#22c55e] text-white shadow-xl shadow-green-700/40 border-2 border-[#15803d] ring-2 ring-white/60';
                    } else if (isClaimedBy2) {
                      bgClass = 'bg-[#f97316] text-white shadow-xl shadow-orange-700/40 border-2 border-[#c2410c] ring-2 ring-white/60';
                    }

                    return (
                      <button
                        key={`${cell.col}-${cell.row}`}
                        disabled={!isUnclaimed || !!roundWinner}
                        onClick={() => handleCellClick(cell)}
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        }}
                        className={`w-14 h-16 sm:w-20 sm:h-22 md:w-22 md:h-24 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 select-none ${bgClass}`}
                      >
                        {/* Arabic Letter inside Hexagon */}
                        <span className={`font-black text-2xl sm:text-3xl md:text-4xl drop-shadow-xs ${
                          isUnclaimed ? 'text-[#521d84]' : 'text-white'
                        }`}>
                          {cell.letter}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>

        {/* ======================================================= */}
        {/* RIGHT SIDEBAR (approx 30% width)                        */}
        {/* Deep Royal Purple matching IMG_3926.jpeg                */}
        {/* ======================================================= */}
        <div className="w-full lg:w-[320px] bg-[#4a1c7c] p-6 flex flex-col justify-between items-center text-center relative border-b-4 lg:border-b-0 lg:border-r-4 border-purple-900/40 shadow-inner">
          
          {/* Top: 'خيارات' Pill Button (Exact copy of image) */}
          <div className="w-full flex justify-end">
            <button
              onClick={() => setShowOptionsMenu(true)}
              className="px-8 py-2 rounded-full bg-white hover:bg-slate-100 text-[#4a1c7c] font-black text-sm sm:text-base shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              خيارات
            </button>
          </div>

          {/* Center: Bold 3D Multi-Tone Pop-Art Typography */}
          {/* 'الجولة' in Red/Coral 3D pop */}
          {/* 'الأولى' in Lime/Gold 3D pop */}
          <div className="my-6 lg:my-auto flex flex-col items-center">
            <span 
              className="font-black text-6xl sm:text-7xl tracking-wide select-none"
              style={{
                color: '#ef4444',
                textShadow: `
                  0 2px 0 #b91c1c,
                  0 4px 0 #991b1b,
                  0 6px 0 #7f1d1d,
                  0 8px 12px rgba(0,0,0,0.5)
                `,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {roundName.line1}
            </span>
            <span 
              className="font-black text-6xl sm:text-7xl tracking-wide -mt-2 select-none"
              style={{
                color: '#facc15',
                textShadow: `
                  0 2px 0 #ca8a04,
                  0 4px 0 #a16207,
                  0 6px 0 #713f12,
                  0 8px 12px rgba(0,0,0,0.5)
                `,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {roundName.line2}
            </span>

            {/* Current Turn Indicator Pill */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/20 text-white text-xs font-bold">
              <span>الدور الآن:</span>
              <span className={activeTeam === 1 ? 'text-emerald-300 font-black' : 'text-amber-400 font-black'}>
                {activeTeam === 1 ? team1Name : team2Name}
              </span>
            </div>
          </div>

          {/* Bottom: Two Score Hexagons (Exact copy of image) */}
          {/* Left: Green Hexagon (Team 1) | Right: Orange Hexagon (Team 2) */}
          <div className="flex items-center justify-center gap-5 sm:gap-6 pt-4">
            
            {/* Green Hexagon Score (Team 1) */}
            <div className="flex flex-col items-center gap-1">
              <div
                style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
                className={`w-14 h-16 sm:w-16 sm:h-18 bg-[#22c55e] border-2 border-green-700 flex items-center justify-center shadow-lg transition-transform ${
                  activeTeam === 1 ? 'scale-110 ring-4 ring-green-300/60' : 'opacity-90'
                }`}
              >
                <span className="font-mono font-black text-2xl sm:text-3xl text-white drop-shadow-md">
                  {team1Score}
                </span>
              </div>
              <span className="text-[11px] text-white/90 font-bold max-w-[80px] truncate">
                {team1Name}
              </span>
            </div>

            {/* Orange Hexagon Score (Team 2) */}
            <div className="flex flex-col items-center gap-1">
              <div
                style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
                className={`w-14 h-16 sm:w-16 sm:h-18 bg-[#f97316] border-2 border-orange-700 flex items-center justify-center shadow-lg transition-transform ${
                  activeTeam === 2 ? 'scale-110 ring-4 ring-orange-300/60' : 'opacity-90'
                }`}
              >
                <span className="font-mono font-black text-2xl sm:text-3xl text-white drop-shadow-md">
                  {team2Score}
                </span>
              </div>
              <span className="text-[11px] text-white/90 font-bold max-w-[80px] truncate">
                {team2Name}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ACTIVE QUESTION MODAL                                                    */}
      {/* ========================================================================= */}
      {activeCell && activeQuestion && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#1e0838] border-2 border-purple-500 rounded-3xl p-6 sm:p-8 text-right text-white shadow-2xl space-y-6 animate-in zoom-in-95">
            
            {/* Top Bar: Letter Badge & Timer */}
            <div className="flex items-center justify-between border-b border-purple-800/50 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  className="w-12 h-14 bg-amber-400 text-black font-black text-2xl flex items-center justify-center shadow-lg"
                >
                  {activeCell.letter}
                </div>
                <div>
                  <span className="text-[11px] text-purple-300 font-bold">سؤال بحرف</span>
                  <h3 className="text-xl font-black text-white">حرف ({activeCell.letter})</h3>
                </div>
              </div>

              {/* Timer Countdown */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-xl font-black border ${
                timerSeconds <= 5 
                  ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' 
                  : 'bg-black/40 text-amber-300 border-amber-500/40'
              }`}>
                <Clock className="w-5 h-5 text-amber-400" />
                <span>{timerSeconds}ث</span>
              </div>
            </div>

            {/* Team Turn Banner */}
            <div className={`p-3 rounded-2xl border text-center font-black text-xs ${
              activeTeam === 1 ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-orange-950/40 border-orange-500 text-orange-300'
            }`}>
              <span>دور الإجابة: {activeTeam === 1 ? team1Name : team2Name}</span>
            </div>

            {/* The Question */}
            <div className="p-5 rounded-2xl bg-black/50 border border-purple-900/60 min-h-[100px] flex items-center justify-center text-center">
              <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {activeQuestion.question}
              </p>
            </div>

            {/* ================= STAGE 1: REVEAL ANSWER BUTTON ================= */}
            {huroofStage === 'question' && (
              <button
                onClick={() => {
                  sound.playClick();
                  setTimerRunning(false);
                  setHuroofStage('revealed');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>👁️ إظهار الإجابة</span>
              </button>
            )}

            {/* ================= STAGE 2: ANSWER REVEALED + 'كمل' BUTTON ================= */}
            {huroofStage === 'revealed' && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="p-4 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500 text-center space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold block">الإجابة المعتمدة لهذا السؤال:</span>
                  <div className="text-xl sm:text-2xl font-black text-white">{activeQuestion.answer}</div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setHuroofStage('decision');
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:scale-[1.01] text-black font-black text-base shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>كَمّل ➔</span>
                </button>
              </div>
            )}

            {/* ================= STAGE 3: THE 2 CHOICES (جاوب صح / جاوب خطأ) ================= */}
            {huroofStage === 'decision' && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="text-center">
                  <h4 className="text-base font-black text-white">
                    هل كانت إجابة {activeTeam === 1 ? team1Name : team2Name} صحيحة؟
                  </h4>
                  <p className="text-xs text-purple-300 mt-0.5">
                    اختر ما إذا كان الفريق قد أجاب بالكلمة المطلوبة لامتلاك هذه الخلية
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleResolveHuroof(true)}
                    className="py-4 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ جاوب صح (امتلاك الخلية)</span>
                  </button>

                  <button
                    onClick={() => handleResolveHuroof(false)}
                    className="py-4 px-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>❌ جاوب خطأ / محد جاوب</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cancel & return */}
            <button
              onClick={() => {
                setActiveCell(null);
                setTimerRunning(false);
              }}
              className="w-full py-2 text-xs text-purple-400 hover:text-white transition-colors cursor-pointer text-center pt-2"
            >
              إلغاء والعودة للوحة
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROUND WINNER MODAL                                                       */}
      {/* ========================================================================= */}
      {roundWinner && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="max-w-md w-full bg-gradient-to-b from-[#320f5c] via-[#210940] to-[#120424] border-2 border-amber-400 rounded-3xl p-8 text-center text-white shadow-2xl space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 shadow-xl">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="text-xs font-black text-amber-400 tracking-wider">اكتمل خط الفوز!</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                فاز في {roundName.line1} {roundName.line2}:
              </h2>
              <div className="text-xl font-black text-amber-300 mt-2">
                🏆 {roundWinner.name}
              </div>
              <p className="text-xs text-purple-200 mt-2">
                {roundWinner.team === 1 
                  ? 'أكمل الفريق الأخضر صفاً أفقياً كاملاً بنجاح! 🟢' 
                  : 'أكمل الفريق البرتقالي صفاً عمودياً كاملاً بنجاح! 🟠'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-black/40 border border-purple-800/40 font-mono">
              <div>
                <span className="text-[11px] text-purple-300 block">{team1Name}</span>
                <span className="text-2xl font-black text-emerald-400">{team1Score}</span>
              </div>
              <span className="text-xl text-purple-500">:</span>
              <div>
                <span className="text-[11px] text-purple-300 block">{team2Name}</span>
                <span className="text-2xl font-black text-orange-400">{team2Score}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleNextRound}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-sm rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                الانتقال للجولة التالية ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTIONS MODAL ('خيارات')                                                 */}
      {/* ========================================================================= */}
      {showOptionsMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1f0a35] border-2 border-purple-500 rounded-3xl p-6 text-right text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-purple-800/60 pb-3">
              <h3 className="text-base font-black text-amber-400">خيارات وإعدادات حروف مع جمر</h3>
              <button 
                onClick={() => setShowOptionsMenu(false)} 
                className="p-1 rounded-lg text-purple-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Team Names Editing */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">اسم الفريق الأخضر (الأفقي):</label>
                <input
                  type="text"
                  value={team1Name}
                  onChange={e => setTeam1Name(e.target.value)}
                  className="w-full bg-black/50 border border-emerald-500/60 rounded-xl px-3 py-2 text-white font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-300 mb-1">اسم الفريق البرتقالي (العمودي):</label>
                <input
                  type="text"
                  value={team2Name}
                  onChange={e => setTeam2Name(e.target.value)}
                  className="w-full bg-black/50 border border-orange-500/60 rounded-xl px-3 py-2 text-white font-bold text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-purple-800/60">
              <button
                onClick={() => {
                  sound.playClick();
                  initBoard();
                  setShowOptionsMenu(false);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة توزيع حروف الجولة الحالية</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setTeam1Score(0);
                  setTeam2Score(0);
                  setCurrentRound(1);
                  initBoard();
                  setShowOptionsMenu(false);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>تصفير النقاط والبدء من الجولة الأولى</span>
              </button>

              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-black/50 text-purple-300 hover:text-white font-bold text-xs cursor-pointer text-center"
              >
                الخروج للقائمة الرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
