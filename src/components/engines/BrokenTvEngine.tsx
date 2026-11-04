import React, { useState, useEffect, useRef } from 'react';
import { Tv, Sparkles, Trophy, Clock, Send, Palette, Trash2, ArrowRight, Eye, RefreshCw, Undo, MessageSquare } from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { Player } from '../../types/game';
import { BROKEN_TV_STARTER_PROMPTS } from '../../data/brokenTvBank';

interface BrokenTvEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  onlineRoomData?: any;
  onExit: () => void;
}

interface ChainStep {
  type: 'text' | 'drawing';
  authorName: string;
  authorAvatar: string;
  content: string; // text string or dataUrl image
}

export const BrokenTvEngine: React.FC<BrokenTvEngineProps> = ({
  mode,
  players,
  onlineRoomData,
  onExit
}) => {
  // Game Steps: 'write_prompt' -> 'draw_prompt' -> 'guess_drawing' -> 'draw_guess' -> 'album_reveal'
  const [step, setStep] = useState<'write_prompt' | 'draw_prompt' | 'guess_drawing' | 'draw_guess' | 'album_reveal'>('write_prompt');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);

  // Transformation Chain Store
  const [chain, setChain] = useState<ChainStep[]>([]);

  // Input states
  const [inputText, setInputText] = useState('');
  const [guessInput, setGuessInput] = useState('');

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#f59e0b');
  const [brushSize, setBrushSize] = useState(4);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Album reveal slideshow state
  const [albumStepIdx, setAlbumStepIdx] = useState(0);

  // Initialize random starter prompt
  useEffect(() => {
    const randomPrompt = BROKEN_TV_STARTER_PROMPTS[Math.floor(Math.random() * BROKEN_TV_STARTER_PROMPTS.length)] || 'تنين يسوي قهوة على الفحم';
    setInputText(randomPrompt);
  }, []);

  // Timer interval for drawing / guessing
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            handleAutoSubmitOnTimeout();
            return 0;
          }
          if (s <= 5) sound.playTick(true);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleAutoSubmitOnTimeout = () => {
    if (step === 'draw_prompt' || step === 'draw_guess') {
      submitDrawing();
    } else if (step === 'guess_drawing') {
      submitGuess();
    }
  };

  // 1. Submit Initial Prompt
  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sound.playClick();
    const p = players[0] || { name: 'أحمد', avatar: '🔥' };
    const firstStep: ChainStep = {
      type: 'text',
      authorName: p.name,
      authorAvatar: p.avatar,
      content: inputText.trim()
    };

    setChain([firstStep]);
    setStep('draw_prompt');
    setTimerSeconds(60);
    setTimerRunning(true);
    clearCanvas();
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
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
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    sound.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0314';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // 2. Submit Drawing
  const submitDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    sound.playClick();
    const p = players[1] || players[0] || { name: 'سارة', avatar: '🎨' };
    const drawStep: ChainStep = {
      type: 'drawing',
      authorName: p.name,
      authorAvatar: p.avatar,
      content: dataUrl
    };

    setChain(prev => [...prev, drawStep]);

    if (step === 'draw_prompt') {
      setStep('guess_drawing');
      setTimerSeconds(45);
      setTimerRunning(true);
      setGuessInput('');
    } else {
      // Completed full chain -> reveal album!
      setTimerRunning(false);
      setStep('album_reveal');
      setAlbumStepIdx(0);
      sound.playVictory();
      confetti({ particleCount: 80, spread: 70 });
    }
  };

  // 3. Submit Guess
  const submitGuess = () => {
    if (!guessInput.trim()) return;

    sound.playClick();
    const p = players[2] || players[0] || { name: 'خالد', avatar: '🧐' };
    const guessStep: ChainStep = {
      type: 'text',
      authorName: p.name,
      authorAvatar: p.avatar,
      content: guessInput.trim()
    };

    setChain(prev => [...prev, guessStep]);
    setStep('draw_guess');
    setTimerSeconds(60);
    setTimerRunning(true);
    clearCanvas();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-right pb-12">
      {/* Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0c1a2e] via-[#081020] to-[#0d2238] border-2 border-cyan-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-2xl">
            📺
          </div>
          <div>
            <div className="text-sm font-black text-white">تلفزيون خربان (رسمك خربان)</div>
            <div className="text-xs text-cyan-300 font-bold">سلسلة تحولات الأفكار والرسم المضحك!</div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
        >
          خروج
        </button>
      </div>

      {/* ================= STEP 1: WRITE PROMPT ================= */}
      {step === 'write_prompt' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#091322] border-2 border-cyan-500/50 shadow-2xl space-y-6 text-center">
          <div className="text-xs font-black text-cyan-400">الخطوة الأولى: اكتب جملة أو فكرة مضحكة ✍️</div>
          <h2 className="text-xl sm:text-2xl font-black text-white">وش تبغى خويك يرسم؟</h2>
          <p className="text-xs text-cyan-200/80 max-w-md mx-auto">
            اكتب أي فكرة غريبة أو كوميدية، وشف كيف بتتحول وتخرب لما يرسمونها!
          </p>

          <form onSubmit={handlePromptSubmit} className="space-y-4 max-w-md mx-auto">
            <textarea
              rows={3}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="اكتب فكرتك هنا (مثال: تنين يسوي قهوة سعودية على الفحم)..."
              className="w-full bg-black/60 border border-cyan-500/60 rounded-2xl p-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>أرسل الجملة للرسام التالي ➔</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= STEP 2 & 4: DRAWING CANVAS ================= */}
      {(step === 'draw_prompt' || step === 'draw_guess') && (
        <div className="p-6 rounded-3xl bg-[#091322] border-2 border-cyan-500/50 shadow-2xl space-y-4 text-center">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <div className="text-xs font-black text-cyan-300">
              {step === 'draw_prompt' ? 'المطلوب رسم الجملة التالية:' : 'ارسم التخمين التالي:'}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-mono font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          {/* The assigned text to draw */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/40 text-amber-300 font-black text-base">
            "{chain[chain.length - 1]?.content}"
          </div>

          {/* Colors and tools palette */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5">
              {['#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#8b5cf6', '#ffffff'].map(c => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                    brushColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح</span>
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/60 shadow-inner bg-[#0a0314]">
            <canvas
              ref={canvasRef}
              width={600}
              height={380}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[280px] sm:h-[350px] touch-none cursor-crosshair bg-[#0a0314]"
            />
          </div>

          <button
            onClick={submitDrawing}
            className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-xl shadow-cyan-500/25 cursor-pointer"
          >
            اعتماد الرسمة وإرسالها للتخمين ➔
          </button>
        </div>
      )}

      {/* ================= STEP 3: GUESS THE DRAWING ================= */}
      {step === 'guess_drawing' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#091322] border-2 border-cyan-500/50 shadow-2xl space-y-6 text-center">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <span className="text-xs font-black text-cyan-400">وش ذي الرسمة برأيك؟ 🤔</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-mono font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          {/* Display the drawing without text */}
          <div className="rounded-2xl border-2 border-cyan-500/40 overflow-hidden bg-black max-w-md mx-auto">
            <img
              src={chain[chain.length - 1]?.content}
              alt="تخمين الرسمة"
              className="w-full h-auto object-contain"
            />
          </div>

          <form onSubmit={e => { e.preventDefault(); submitGuess(); }} className="space-y-4 max-w-md mx-auto">
            <input
              type="text"
              value={guessInput}
              onChange={e => setGuessInput(e.target.value)}
              placeholder="اكتب تخمينك هنا (وش قاعد تشوف؟)..."
              className="w-full bg-black/60 border border-cyan-500/60 rounded-2xl px-4 py-3.5 text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center"
            />

            <button
              type="submit"
              disabled={!guessInput.trim()}
              className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-xl shadow-cyan-500/25 cursor-pointer"
            >
              أرسل التخمين للرسام التالي ➔
            </button>
          </form>
        </div>
      )}

      {/* ================= STEP 5: GRAND ALBUM REVEAL ================= */}
      {step === 'album_reveal' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#091322] border-2 border-yellow-400 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
          <h2 className="text-2xl sm:text-3xl font-black text-white">ألبوم تحولات الرسمة! 😂</h2>
          <p className="text-xs text-cyan-300">شوفوا كيف تحولت الفكرة من أول كلمة لآخر نتيجة!</p>

          <div className="space-y-4 max-w-md mx-auto text-right">
            {chain.map((c, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-black/60 border border-cyan-800/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 border-b border-cyan-950 pb-2">
                  <span>الخطوة {idx + 1} ({c.type === 'text' ? 'كتابة' : 'رسم'} بواسطة: {c.authorName})</span>
                  <span>{c.authorAvatar}</span>
                </div>

                {c.type === 'text' ? (
                  <div className="text-lg font-black text-amber-300 text-center py-2">
                    "{c.content}"
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-cyan-900 bg-black">
                    <img src={c.content} alt="رسمة" className="w-full h-auto object-contain" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={onExit}
            className="w-full max-w-md py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm shadow-xl shadow-yellow-400/30 cursor-pointer"
          >
            العودة للقائمة الرئيسية 🏆
          </button>
        </div>
      )}
    </div>
  );
};
