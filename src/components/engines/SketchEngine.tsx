import React, { useRef, useState, useEffect } from 'react';
import { Palette, Trash2, Clock, Check, Eye, EyeOff, Award, Sparkles, Flame } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sounds } from '../../services/soundEffects';
import confetti from 'canvas-confetti';

interface SketchEngineProps {
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

export const SketchEngine: React.FC<SketchEngineProps> = ({
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(4);
  const [timerSeconds, setTimerSeconds] = useState(75);
  const [isWordRevealed, setIsWordRevealed] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [hasGuessedCorrect, setHasGuessedCorrect] = useState(false);

  const artist = players[(currentRound - 1) % players.length];
  const wordToDraw = (mode === 'online' && onlineGameData)
    ? onlineGameData.wordToDraw
    : questionData?.question || 'برج المملكة';

  useEffect(() => {
    setTimerSeconds(75);
    setIsWordRevealed(false);
    setGuessInput('');
    setHasGuessedCorrect(false);
    clearCanvas();
  }, [currentRound]);

  // Timer
  useEffect(() => {
    let interval: any = null;
    if (timerSeconds > 0 && !hasGuessedCorrect) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            sounds.playWrong();
            return 0;
          }
          if (s <= 5) sounds.playTick();
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds, hasGuessedCorrect]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;

    const cleanInput = guessInput.trim().toLowerCase();
    const cleanWord = wordToDraw.toLowerCase();

    if (cleanInput === cleanWord || cleanInput.includes(cleanWord) || cleanWord.includes(cleanInput)) {
      setHasGuessedCorrect(true);
      sounds.playCorrect();
      confetti({ particleCount: 70, spread: 70 });
      if (players.length > 0) {
        artist.score += 80;
        const guesser = players.find(p => p.id !== artist.id) || players[0];
        guesser.score += 100 + timerSeconds * 2;
      }
    } else {
      sounds.playWrong();
    }
  };

  const colors = ['#ffffff', '#f97316', '#ef4444', '#10b981', '#3b82f6', '#eab308', '#a855f7'];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="rounded-2xl bg-purple-950/40 border border-purple-800/40 p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-orange-400 font-bold">جولة {currentRound} من {totalRounds}</span>
          <h2 className="text-sm font-black text-white">ارسم وخمن السريعة · الرسام: {artist?.name}</h2>
        </div>
        <div className="px-3 py-1 rounded-xl bg-purple-900/40 border border-purple-700/40 text-xs font-mono font-bold text-purple-200">
          <Clock className="w-3.5 h-3.5 inline ml-1" />
          <span>{timerSeconds}s</span>
        </div>
      </div>

      {/* Secret Word for the Artist */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playSpark(); setIsWordRevealed(!isWordRevealed); }}
            className="p-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-300"
          >
            {isWordRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-orange-400" />}
          </button>
          <span className="text-xs text-purple-300">الكلمة المطلوب رسمها:</span>
        </div>
        <span className="text-sm font-black text-white">
          {isWordRevealed ? wordToDraw : '•••••••• (خاص بالرسام)'}
        </span>
      </div>

      {/* Drawing Board Container */}
      <div className="rounded-3xl bg-[#0a0614] border-2 border-purple-800/50 p-4 shadow-2xl space-y-3">
        {/* Color Palette & Tools */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-900/30">
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); sounds.playSpark(); }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="bg-purple-950/60 border border-purple-800/40 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value={2}>خط رفيع</option>
              <option value={5}>خط متوسط</option>
              <option value={10}>خط عريض</option>
            </select>

            <button
              onClick={() => { clearCanvas(); sounds.playSpark(); }}
              title="مسح اللوحة"
              className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/70 text-red-300 border border-red-800/40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HTML5 Canvas */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#120b22] border border-purple-900/40 touch-none">
          <canvas
            ref={canvasRef}
            width={600}
            height={360}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-64 sm:h-80 cursor-crosshair"
          />
        </div>

        {/* Guessing Input */}
        {!hasGuessedCorrect ? (
          <form onSubmit={handleGuessSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="اكتب تخمينك للرسمة هنا..."
              className="flex-1 bg-purple-950/40 border border-purple-800/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              تخمين
            </button>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500 text-center space-y-2 animate-in zoom-in-95">
            <Check className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-xl font-black text-white">تخمين صحيح! كفو يا فنان! 🎉</h4>
            <p className="text-xs text-emerald-300">الكلمة كانت: {wordToDraw}</p>
          </div>
        )}

        {(hasGuessedCorrect || timerSeconds === 0) && (
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                sounds.playSpark();
                if (onNextRound) onNextRound();
              }}
              className="py-3 px-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              {currentRound >= totalRounds ? 'عرض النتائج النهائية 🏆' : 'الجولة التالية ➔'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
