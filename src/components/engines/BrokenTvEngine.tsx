import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, Sparkles, Trophy, Clock, Send, Palette, Trash2, ArrowRight, 
  Eye, RefreshCw, Undo, MessageSquare, ChevronRight, ChevronLeft, 
  Smile, Flame, ThumbsUp, Check, Users, Play 
} from 'lucide-react';
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

export interface BookStep {
  type: 'text' | 'drawing';
  stageLabel: string; // 'الفكرة الأصلية' | 'رسم الفكرة' | 'تخمين الرسمة' | 'رسم التخمين'
  authorName: string;
  authorAvatar: string;
  content: string; // text sentence or base64 canvas image data URL
}

export interface PlayerBook {
  ownerName: string;
  ownerAvatar: string;
  steps: BookStep[];
}

export const BrokenTvEngine: React.FC<BrokenTvEngineProps> = ({
  mode,
  players,
  onlineRoomData,
  onExit
}) => {
  // Roster of active participants (defaults to provided players or fun group)
  const [participants, setParticipants] = useState<Array<{ name: string; avatar: string }>>(() => {
    if (players && players.length >= 2) {
      return players.map(p => ({ name: p.name, avatar: p.avatar || '🔥' }));
    }
    return [
      { name: 'محمد', avatar: '😎' },
      { name: 'حمد', avatar: '🔥' },
      { name: 'خالد', avatar: '🚀' },
      { name: 'سارة', avatar: '✨' }
    ];
  });

  // Flow Phases: 'setup' -> 'write_all' -> 'draw_all' -> 'guess_all' -> 'grand_reveal'
  const [phase, setPhase] = useState<'setup' | 'write_all' | 'draw_all' | 'guess_all' | 'grand_reveal'>('write_all');
  
  // Current active player index within the current phase
  const [currentActorIdx, setCurrentActorIdx] = useState(0);

  // All Books: each participant starts a book that travels through the chain
  const [books, setBooks] = useState<PlayerBook[]>([]);

  // Input states
  const [currentPromptInput, setCurrentPromptInput] = useState('');
  const [currentGuessInput, setCurrentGuessInput] = useState('');

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#06b6d4');
  const [brushSize, setBrushSize] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Grand Reveal State
  const [activeBookIdx, setActiveBookIdx] = useState(0);
  const [reactions, setReactions] = useState<Record<string, number>>({});

  // Seed random starter prompt for the input helper
  const getRandomSuggestion = () => {
    return BROKEN_TV_STARTER_PROMPTS[Math.floor(Math.random() * BROKEN_TV_STARTER_PROMPTS.length)] || 'تنين يسوي قهوة على الفحم';
  };

  useEffect(() => {
    setCurrentPromptInput(getRandomSuggestion());
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            handleAutoSubmitTimeout();
            return 0;
          }
          if (s <= 5) sound.playTick(true);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleAutoSubmitTimeout = () => {
    if (phase === 'draw_all') submitCurrentDrawing();
    else if (phase === 'guess_all') submitCurrentGuess();
  };

  // =========================================================================
  // 1. PHASE: WRITE ALL INITIAL PROMPTS
  // =========================================================================
  const submitCurrentPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = currentPromptInput.trim();
    if (!clean) return;

    sound.playClick();
    const author = participants[currentActorIdx];
    const newStep: BookStep = {
      type: 'text',
      stageLabel: 'من كتب الفكرة الأصلية؟',
      authorName: author.name,
      authorAvatar: author.avatar,
      content: clean
    };

    const newBook: PlayerBook = {
      ownerName: author.name,
      ownerAvatar: author.avatar,
      steps: [newStep]
    };

    const nextBooks = [...books, newBook];
    setBooks(nextBooks);

    if (currentActorIdx + 1 < participants.length) {
      // Next player writes their prompt
      setCurrentActorIdx(currentActorIdx + 1);
      setCurrentPromptInput(getRandomSuggestion());
    } else {
      // All players wrote prompts! Move to DRAWING PHASE!
      sound.playVictory();
      setPhase('draw_all');
      setCurrentActorIdx(0);
      setTimerSeconds(60);
      setTimerRunning(true);
      clearCanvas();
    }
  };

  // =========================================================================
  // 2. PHASE: DRAW ALL (Each draws the prompt of the preceding player)
  // =========================================================================
  // In rotation: Actor i draws the book of ((i - 1 + N) % N)
  const getDrawingTargetBook = (actorIdx: number) => {
    const N = participants.length;
    const targetBookIdx = (actorIdx - 1 + N) % N;
    return { book: books[targetBookIdx], targetBookIdx };
  };

  const submitCurrentDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    sound.playClick();
    const dataUrl = canvas.toDataURL('image/png');
    const artist = participants[currentActorIdx];
    const { targetBookIdx } = getDrawingTargetBook(currentActorIdx);

    const drawingStep: BookStep = {
      type: 'drawing',
      stageLabel: 'من رسم هذه الفكرة؟',
      authorName: artist.name,
      authorAvatar: artist.avatar,
      content: dataUrl
    };

    const updatedBooks = [...books];
    updatedBooks[targetBookIdx].steps.push(drawingStep);
    setBooks(updatedBooks);

    if (currentActorIdx + 1 < participants.length) {
      setCurrentActorIdx(currentActorIdx + 1);
      setTimerSeconds(60);
      setTimerRunning(true);
      clearCanvas();
    } else {
      // All players drew! Move to GUESSING PHASE!
      sound.playVictory();
      setPhase('guess_all');
      setCurrentActorIdx(0);
      setCurrentGuessInput('');
      setTimerSeconds(45);
      setTimerRunning(true);
    }
  };

  // =========================================================================
  // 3. PHASE: GUESS ALL (Each guesses the drawing of another player)
  // =========================================================================
  // In rotation: Actor i guesses book ((i - 2 + N) % N)
  const getGuessTargetBook = (actorIdx: number) => {
    const N = participants.length;
    const targetBookIdx = (actorIdx - 2 + N) % N;
    return { book: books[targetBookIdx], targetBookIdx };
  };

  const submitCurrentGuess = () => {
    const clean = currentGuessInput.trim() || 'رسمة غريبة وغير مفهومة 😂';
    sound.playClick();
    const guesser = participants[currentActorIdx];
    const { targetBookIdx } = getGuessTargetBook(currentActorIdx);

    const guessStep: BookStep = {
      type: 'text',
      stageLabel: 'ماذا خمن هذا اللاعب؟',
      authorName: guesser.name,
      authorAvatar: guesser.avatar,
      content: clean
    };

    const updatedBooks = [...books];
    updatedBooks[targetBookIdx].steps.push(guessStep);
    setBooks(updatedBooks);

    if (currentActorIdx + 1 < participants.length) {
      setCurrentActorIdx(currentActorIdx + 1);
      setCurrentGuessInput('');
      setTimerSeconds(45);
      setTimerRunning(true);
    } else {
      // Completed all phases -> REVEAL GRAND GALLERY!
      sound.playVictory();
      confetti({ particleCount: 150, spread: 100 });
      setPhase('grand_reveal');
      setActiveBookIdx(0);
      setTimerRunning(false);
    }
  };

  // Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

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
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

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
    ctx.fillStyle = '#0a0314';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Reactions for results
  const addReaction = (bookIdx: number, type: string) => {
    sound.playClick();
    const key = `${bookIdx}-${type}`;
    setReactions(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  // Active book during reveal
  const currentRevealedBook = books[activeBookIdx];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right pb-12 font-sans select-none">
      
      {/* Top Header Bar */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0c1a2e] via-[#091526] to-[#0a1e36] border-2 border-cyan-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-2xl">
            📺
          </div>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>تلفزيون خربان | BROKEN TV</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 font-bold">
                سلسلة التحريف الممتعة
              </span>
            </div>
            <div className="text-xs text-cyan-300 font-bold mt-0.5">
              الكل يكتب فكرة، والكل يرسم، ونشوف كيف تخرب الفكرة في النهاية! 😂
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
        >
          الخروج للقائمة الرئيسية
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PHASE: WRITE ALL (Everyone writes a prompt)                            */}
      {/* ========================================================================= */}
      {phase === 'write_all' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#091322] border-2 border-cyan-500/50 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <span className="text-xs font-black text-cyan-400">
              المرحلة 1: كتابة الأفكار ({currentActorIdx + 1} من {participants.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-300 font-bold">الكاتب الحالي:</span>
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/40">
                {participants[currentActorIdx].avatar} {participants[currentActorIdx].name}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">وش فكرتك العجيبة للرسم؟ ✍️</h2>
            <p className="text-xs text-cyan-200/80 max-w-md mx-auto">
              اكتب جملة أو موقفاً كوميدياً وغريباً ليحاول اللاعب التالي رسمه بدقة!
            </p>
          </div>

          <form onSubmit={submitCurrentPrompt} className="space-y-4 max-w-lg mx-auto">
            <textarea
              rows={3}
              value={currentPromptInput}
              onChange={e => setCurrentPromptInput(e.target.value)}
              placeholder="مثال: جمل لابس شماغ يشرب كرك في القطب الشمالي..."
              maxLength={90}
              autoFocus
              className="w-full bg-black/60 border border-cyan-500/60 rounded-2xl p-4 text-white font-bold text-base focus:outline-hidden focus:border-cyan-400 text-center"
            />

            <div className="flex items-center justify-between text-xs text-cyan-400/80">
              <button
                type="button"
                onClick={() => setCurrentPromptInput(getRandomSuggestion())}
                className="underline hover:text-white cursor-pointer"
              >
                🎲 اقتراح فكرة عشوائية مضحكة
              </button>
              <span>{currentPromptInput.length} / 90 حرف</span>
            </div>

            <button
              type="submit"
              disabled={!currentPromptInput.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-black text-sm shadow-xl shadow-cyan-500/25 cursor-pointer transition-transform hover:scale-[1.01]"
            >
              {currentActorIdx + 1 < participants.length 
                ? `اعتماد الفكرة والانتقال للاعب (${participants[currentActorIdx + 1].name}) ➔` 
                : 'اعتماد الفكرة وبدء مرحلة الرسم للجميع 🔥'}
            </button>
          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PHASE: DRAW ALL (Each draws someone else's prompt)                     */}
      {/* ========================================================================= */}
      {phase === 'draw_all' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#091322] border-2 border-cyan-500/50 shadow-2xl space-y-5 text-right animate-in zoom-in-95">
          
          {/* Top Bar with Artist Info & Timer */}
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-300 font-bold">الرسام:</span>
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/40">
                {participants[currentActorIdx].avatar} {participants[currentActorIdx].name}
              </span>
              <span className="text-xs text-purple-400">({currentActorIdx + 1} من {participants.length})</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-bold text-xs border ${
              timerSeconds <= 10 ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timerSeconds}ث</span>
            </div>
          </div>

          {/* The Prompt To Draw */}
          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/40 text-center space-y-1">
            <span className="text-[11px] text-cyan-400 font-bold">ارسم هذه الفكرة بأسرع وأوضح ما تقدر:</span>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              "{getDrawingTargetBook(currentActorIdx).book?.steps[0]?.content}"
            </div>
          </div>

          {/* Drawing Tools Palette */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-cyan-900/40">
            <div className="flex items-center gap-1.5">
              {['#ffffff', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#8b5cf6'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBrushColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    brushColor === c ? 'scale-125 border-white ring-2 ring-cyan-400' : 'border-transparent'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-300 font-bold">حجم الفرشاة:</span>
              {[3, 6, 12].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setBrushSize(sz)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    brushSize === sz ? 'bg-cyan-500 text-black' : 'bg-black/60 text-purple-300'
                  }`}
                >
                  {sz === 3 ? 'رفيع' : sz === 6 ? 'متوسط' : 'عريض'}
                </button>
              ))}
              <button
                type="button"
                onClick={clearCanvas}
                className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-xs flex items-center gap-1 border border-red-800/40 cursor-pointer mr-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح</span>
              </button>
            </div>
          </div>

          {/* Canvas Box */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/60 shadow-inner bg-[#0a0314]">
            <canvas
              ref={canvasRef}
              width={700}
              height={380}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[280px] sm:h-[360px] touch-none cursor-crosshair bg-[#0a0314]"
            />
          </div>

          <button
            type="button"
            onClick={submitCurrentDrawing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-black text-sm shadow-xl shadow-cyan-500/25 cursor-pointer"
          >
            {currentActorIdx + 1 < participants.length 
              ? `اعتماد الرسمة والانتقال للرسام (${participants[currentActorIdx + 1].name}) ➔` 
              : 'اعتماد الرسمة والانتقال لمرحلة التخمين 🔥'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PHASE: GUESS ALL (Everyone guesses someone else's drawing)              */}
      {/* ========================================================================= */}
      {phase === 'guess_all' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#091322] border-2 border-cyan-500/50 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
          
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-300 font-bold">المخمن:</span>
              <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/40">
                {participants[currentActorIdx].avatar} {participants[currentActorIdx].name}
              </span>
              <span className="text-xs text-purple-400">({currentActorIdx + 1} من {participants.length})</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-bold text-xs border ${
              timerSeconds <= 10 ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timerSeconds}ث</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">وش قاعد تشوف في ذي الرسمة؟ 🤔</h3>
            <p className="text-xs text-cyan-300">بدون ما تعرف وش كان النص الأصلي، خمن وش كان يقصد الرسام!</p>
          </div>

          {/* Drawing to guess */}
          <div className="rounded-2xl border-2 border-cyan-500/50 overflow-hidden bg-[#0a0314] max-w-lg mx-auto shadow-xl">
            <img
              src={getGuessTargetBook(currentActorIdx).book?.steps[1]?.content}
              alt="رسمة للتخمين"
              className="w-full h-[260px] sm:h-[320px] object-contain"
            />
          </div>

          <form onSubmit={e => { e.preventDefault(); submitCurrentGuess(); }} className="space-y-4 max-w-lg mx-auto">
            <input
              type="text"
              value={currentGuessInput}
              onChange={e => setCurrentGuessInput(e.target.value)}
              placeholder="اكتب تخمينك هنا (مثلاً: بطريق يتزلج، أو خروف يطير...)"
              maxLength={80}
              autoFocus
              className="w-full bg-black/60 border border-cyan-500/60 rounded-2xl px-4 py-3.5 text-white font-black text-sm focus:outline-hidden focus:border-cyan-400 text-center"
            />

            <button
              type="submit"
              disabled={!currentGuessInput.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-black text-sm shadow-xl shadow-cyan-500/25 cursor-pointer"
            >
              {currentActorIdx + 1 < participants.length 
                ? `إرسال التخمين والانتقال لـ (${participants[currentActorIdx + 1].name}) ➔` 
                : 'إرسال التخمين وعرض النتائج الكبرى للمعرض! 🏆'}
            </button>
          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PHASE: GRAND RESULTS REVEAL (من كتب هذا، ومن رسم هذا، وماذا رسم)         */}
      {/* ========================================================================= */}
      {phase === 'grand_reveal' && currentRevealedBook && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#130626] via-[#0b0c24] to-[#040817] border-2 border-amber-400 shadow-2xl space-y-7 animate-in zoom-in-95">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>معرض تحولات التلفزيون الخربان الكبرى 🔥</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              شوفوا كيف خربت الفكرة وتغيرت! 😂
            </h2>
            <p className="text-xs text-purple-200">
              تابع السلسلة بالترتيب وشوف من كتب هذا ومن رسم هذا وماذا خمن هذا
            </p>
          </div>

          {/* Storyline Tabs (Select player notebook) */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {books.map((b, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sound.playClick();
                  setActiveBookIdx(idx);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeBookIdx === idx
                    ? 'bg-amber-400 text-black shadow-lg scale-105 ring-2 ring-white/60'
                    : 'bg-black/50 text-purple-300 border border-purple-800/50 hover:bg-black/70'
                }`}
              >
                <span>{b.ownerAvatar}</span>
                <span>سلسلة فكرة {b.ownerName}</span>
              </button>
            ))}
          </div>

          {/* Active Story Progression Cards */}
          <div className="space-y-5 max-w-2xl mx-auto">
            {currentRevealedBook.steps.map((stepItem, stepIdx) => {
              const isWriting = stepItem.type === 'text';

              return (
                <div
                  key={stepIdx}
                  className="p-5 rounded-3xl bg-[#140828] border-2 border-purple-800/60 shadow-xl space-y-3 relative overflow-hidden"
                >
                  {/* Step Header Badge */}
                  <div className="flex items-center justify-between border-b border-purple-900/50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center justify-center shadow">
                        {stepIdx + 1}
                      </span>
                      <div>
                        <span className="text-[11px] text-amber-300 font-black block">
                          {stepItem.stageLabel}
                        </span>
                        <span className="text-xs text-white font-bold">
                          بواسطة: {stepItem.authorAvatar} {stepItem.authorName}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-full border border-purple-700/50 font-bold">
                      {isWriting ? '✍️ نص وكتابة' : '🎨 رسم إبداعي'}
                    </span>
                  </div>

                  {/* Step Content */}
                  {isWriting ? (
                    <div className="p-4 rounded-2xl bg-black/60 border border-purple-900/60 text-center">
                      <span className="text-lg sm:text-xl font-black text-amber-300">
                        "{stepItem.content}"
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-purple-700/60 overflow-hidden bg-[#0a0314] shadow-inner">
                      <img
                        src={stepItem.content}
                        alt="رسمة التلفزيون الخربان"
                        className="w-full h-[240px] sm:h-[300px] object-contain"
                      />
                    </div>
                  )}

                  {/* Arrow Indicator between steps */}
                  {stepIdx < currentRevealedBook.steps.length - 1 && (
                    <div className="text-center text-purple-400 text-xs font-bold pt-1">
                      ⬇️ ثم استلم الفكرة اللاعب التالي ⬇️
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Distortion Comparison Banner */}
            {currentRevealedBook.steps.length >= 2 && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-red-950/60 via-amber-950/40 to-red-950/60 border-2 border-amber-500/60 text-center space-y-3">
                <span className="text-xs font-black text-amber-400 tracking-wider">
                  مقارنة البداية بالنهاية 😂
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <div className="p-3 rounded-xl bg-black/50 border border-purple-800">
                    <span className="text-purple-300 block mb-1">أول جملة كتبها {currentRevealedBook.steps[0].authorName}:</span>
                    <span className="text-amber-300 font-black">"{currentRevealedBook.steps[0].content}"</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-purple-800">
                    <span className="text-purple-300 block mb-1">
                      آخر تخمين وصل له {currentRevealedBook.steps[currentRevealedBook.steps.length - 1].authorName}:
                    </span>
                    <span className="text-orange-400 font-black">
                      "{currentRevealedBook.steps[currentRevealedBook.steps.length - 1].content}"
                    </span>
                  </div>
                </div>

                {/* Reaction Buttons */}
                <div className="pt-2 flex items-center justify-center gap-3">
                  {[
                    { emoji: '😂', label: 'موت ضحك' },
                    { emoji: '🎨', label: 'رسام داهية' },
                    { emoji: '💀', label: 'تحريف 100%' }
                  ].map(r => {
                    const count = reactions[`${activeBookIdx}-${r.label}`] || 0;
                    return (
                      <button
                        key={r.label}
                        onClick={() => addReaction(activeBookIdx, r.label)}
                        className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-amber-500/40 text-white text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      >
                        <span>{r.emoji}</span>
                        <span>{r.label}</span>
                        {count > 0 && <span className="text-amber-300 font-mono">({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between max-w-2xl mx-auto pt-4 border-t border-purple-900/60">
            <button
              disabled={activeBookIdx === 0}
              onClick={() => {
                sound.playClick();
                setActiveBookIdx(activeBookIdx - 1);
              }}
              className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السلسلة السابقة</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setPhase('write_all');
                setCurrentActorIdx(0);
                setBooks([]);
                setCurrentPromptInput(getRandomSuggestion());
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-xs shadow-lg cursor-pointer"
            >
              جولة جديدة من البداية 🔄
            </button>

            <button
              disabled={activeBookIdx === books.length - 1}
              onClick={() => {
                sound.playClick();
                setActiveBookIdx(activeBookIdx + 1);
              }}
              className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>السلسلة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
