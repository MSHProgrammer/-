import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Flame, 
  Trophy, 
  RotateCcw, 
  Check, 
  X, 
  AlertTriangle, 
  Gavel, 
  ShieldAlert, 
  Clock, 
  User, 
  Award, 
  ChevronRight, 
  HelpCircle,
  Eye,
  Send,
  Sliders,
  Volume2
} from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';

const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
  'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

export interface IsmHayawanPlayerSubmission {
  playerId: string;
  playerName: string;
  name: string;
  animal: string;
  plant: string;
  thing: string;
  country: string;
  scores: {
    name: number;
    animal: number;
    plant: number;
    thing: number;
    country: number;
    total: number;
  };
  disputed?: {
    name?: boolean;
    animal?: boolean;
    plant?: boolean;
    thing?: boolean;
    country?: boolean;
  };
}

export interface IsmHayawanEngineProps {
  mode: 'offline' | 'online';
  players?: Array<{ id: string; name: string; avatar?: string; score?: number; isHost?: boolean }>;
  onlineRoomData?: any;
  socket?: any;
  myPlayerId?: string;
  isJudge?: boolean;
  onExit?: () => void;
}

// Smart Arabic string normalizer for duplicate checking
export function normalizeArabicWord(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Strip Arabic diacritics / tashkeel
    .replace(/[\u064B-\u0652]/g, '')
    // Normalize Alef
    .replace(/[إأآا]/g, 'ا')
    // Normalize Taa Marbuta & Haa
    .replace(/[ةه]/g, 'ه')
    // Normalize Yaa & Alef Maksura
    .replace(/[يى]/g, 'ي')
    // Remove punctuation & extra spaces
    .replace(/[\s\-_]+/g, '');
}

// Check if word starts with target letter (with intelligent Alef/Haa tolerance)
export function wordStartsWithLetter(word: string, letter: string): boolean {
  if (!word || !letter) return false;
  const cleanWord = word.trim();
  if (cleanWord.length === 0) return false;
  
  const targetChar = letter.trim().replace('هـ', 'ه');
  const firstChar = cleanWord.charAt(0);

  // Alef variations
  if (['ا', 'أ', 'إ', 'آ'].includes(targetChar) && ['ا', 'أ', 'إ', 'آ'].includes(firstChar)) {
    return true;
  }
  // Haa variations
  if (['ه', 'ة'].includes(targetChar) && ['ه', 'ة'].includes(firstChar)) {
    return true;
  }
  return firstChar === targetChar;
}

export const IsmHayawanEngine: React.FC<IsmHayawanEngineProps> = ({
  mode,
  players = [],
  onlineRoomData,
  socket,
  myPlayerId,
  isJudge: initialIsJudge = false,
  onExit
}) => {
  // Offline Local Players State
  const [offlinePlayers, setOfflinePlayers] = useState<Array<{ id: string; name: string; score: number }>>([
    { id: 'p1', name: 'اللاعب 1', score: 0 },
    { id: 'p2', name: 'اللاعب 2', score: 0 }
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Match Configuration
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [isJudgeMode, setIsJudgeMode] = useState(initialIsJudge || onlineRoomData?.isJudgeRoom || false);

  // Round State
  const [gameState, setGameState] = useState<'lobby' | 'letter_spin' | 'writing' | 'scoring' | 'leaderboard' | 'game_over'>('lobby');
  const [currentLetter, setCurrentLetter] = useState('س');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDisplayLetter, setSpinDisplayLetter] = useState('أ');

  // Input fields for current player
  const [inputs, setInputs] = useState({
    name: '',
    animal: '',
    plant: '',
    thing: '',
    country: ''
  });

  // Stopped status
  const [isStopped, setIsStopped] = useState(false);
  const [stoppedByName, setStoppedByName] = useState<string | null>(null);

  // Submissions for scoring
  const [submissions, setSubmissions] = useState<IsmHayawanPlayerSubmission[]>([]);

  // Active Dispute (Object feature)
  const [activeDispute, setActiveDispute] = useState<{
    playerId: string;
    playerName: string;
    field: 'name' | 'animal' | 'plant' | 'thing' | 'country';
    fieldLabel: string;
    word: string;
  } | null>(null);

  // Judge manual score adjustments
  const [selectedPlayerToEdit, setSelectedPlayerToEdit] = useState<string | null>(null);

  // Sync with Online Room Data if in online mode
  useEffect(() => {
    if (mode === 'online' && onlineRoomData) {
      if (onlineRoomData.currentLetter) setCurrentLetter(onlineRoomData.currentLetter);
      if (onlineRoomData.stage) setGameState(onlineRoomData.stage);
      if (onlineRoomData.currentRound) setCurrentRound(onlineRoomData.currentRound);
      if (onlineRoomData.totalRounds) setTotalRounds(onlineRoomData.totalRounds);
      if (onlineRoomData.isStopped !== undefined) setIsStopped(onlineRoomData.isStopped);
      if (onlineRoomData.stoppedBy) setStoppedByName(onlineRoomData.stoppedBy.name);
      if (onlineRoomData.submissions) {
        setSubmissions(Object.values(onlineRoomData.submissions));
      }
      if (onlineRoomData.currentDispute) {
        setActiveDispute(onlineRoomData.currentDispute);
      }
      if (onlineRoomData.isJudgeRoom !== undefined) {
        setIsJudgeMode(onlineRoomData.isJudgeRoom);
      }
    }
  }, [mode, onlineRoomData]);

  // High-Energy Random Letter Spinner
  const startLetterSpin = (preselectedLetter?: string) => {
    sound.playClick();
    setGameState('letter_spin');
    setIsSpinning(true);
    setIsStopped(false);
    setStoppedByName(null);
    setInputs({ name: '', animal: '', plant: '', thing: '', country: '' });

    const target = preselectedLetter || ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      const randomChar = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
      setSpinDisplayLetter(randomChar);
      sound.playClick();

      if (counter > 24) {
        clearInterval(interval);
        setSpinDisplayLetter(target);
        setCurrentLetter(target);
        setIsSpinning(false);
        sound.playVictory();

        // After 1.5 seconds, start the writing phase
        setTimeout(() => {
          setGameState('writing');
          if (mode === 'online' && socket) {
            socket.send({
              type: 'ism_hayawan_set_letter',
              letter: target
            });
          }
        }, 1200);
      }
    }, 80);
  };

  // STOP Button Handler
  const handleStopClick = () => {
    if (isStopped) return;
    sound.playVictory();
    setIsStopped(true);

    const activeUser = mode === 'online' 
      ? players.find(p => p.id === myPlayerId)?.name || 'أحد اللاعبين'
      : offlinePlayers[0]?.name || 'اللاعب';

    setStoppedByName(activeUser);

    if (mode === 'online' && socket) {
      socket.send({
        type: 'ism_hayawan_stop',
        inputs
      });
    } else {
      // Offline calculation
      calculateOfflineScores(inputs);
    }
  };

  // Calculate scores offline
  const calculateOfflineScores = (currentInputs: typeof inputs) => {
    // Generate dummy opposing player answers for exciting diwaniya challenge if solo
    const mockP2Inputs = {
      name: wordStartsWithLetter('سارة', currentLetter) ? 'سارة' : `${currentLetter}الم`,
      animal: wordStartsWithLetter('سنجاب', currentLetter) ? 'سنجاب' : `${currentLetter}لحفاة`,
      plant: wordStartsWithLetter('سمسم', currentLetter) ? 'سمسم' : `${currentLetter}بيلة`,
      thing: wordStartsWithLetter('سيارة', currentLetter) ? 'سيارة' : `${currentLetter}لم`,
      country: wordStartsWithLetter('سوريا', currentLetter) ? 'سوريا' : `${currentLetter}ويد`
    };

    const p1Sub: IsmHayawanPlayerSubmission = {
      playerId: 'p1',
      playerName: offlinePlayers[0]?.name || 'اللاعب 1',
      ...currentInputs,
      scores: { name: 0, animal: 0, plant: 0, thing: 0, country: 0, total: 0 }
    };

    const p2Sub: IsmHayawanPlayerSubmission = {
      playerId: 'p2',
      playerName: offlinePlayers[1]?.name || 'المنافس',
      ...mockP2Inputs,
      scores: { name: 0, animal: 0, plant: 0, thing: 0, country: 0, total: 0 }
    };

    const allSubs = [p1Sub, p2Sub];

    // Scoring logic for each category
    const categories: Array<'name' | 'animal' | 'plant' | 'thing' | 'country'> = ['name', 'animal', 'plant', 'thing', 'country'];
    
    categories.forEach(cat => {
      const words = allSubs.map(s => ({
        sub: s,
        word: s[cat].trim(),
        norm: normalizeArabicWord(s[cat]),
        validFirst: wordStartsWithLetter(s[cat], currentLetter)
      }));

      words.forEach(w => {
        if (!w.validFirst || w.word.length === 0) {
          w.sub.scores[cat] = 0;
          return;
        }

        // Check if duplicate among other valid words
        const duplicates = words.filter(other => other !== w && other.validFirst && other.norm === w.norm);
        if (duplicates.length > 0) {
          w.sub.scores[cat] = 5; // مكرر = 5 نقاط
        } else {
          w.sub.scores[cat] = 10; // فريد = 10 نقاط
        }
      });
    });

    // Sum totals
    allSubs.forEach(s => {
      s.scores.total = s.scores.name + s.scores.animal + s.scores.plant + s.scores.thing + s.scores.country;
    });

    setSubmissions(allSubs);

    // Update cumulative player scores
    setOfflinePlayers(prev => prev.map(p => {
      const sub = allSubs.find(s => s.playerId === p.id);
      return { ...p, score: p.score + (sub?.scores.total || 0) };
    }));

    setGameState('scoring');
  };

  // Object / Dispute on a word
  const handleRaiseDispute = (sub: IsmHayawanPlayerSubmission, field: 'name' | 'animal' | 'plant' | 'thing' | 'country') => {
    sound.playClick();
    const fieldLabels = {
      name: 'اسم',
      animal: 'حيوان',
      plant: 'نبات',
      thing: 'جماد',
      country: 'بلاد'
    };

    const disputeData = {
      playerId: sub.playerId,
      playerName: sub.playerName,
      field,
      fieldLabel: fieldLabels[field],
      word: sub[field]
    };

    setActiveDispute(disputeData);

    if (mode === 'online' && socket) {
      socket.send({
        type: 'ism_hayawan_dispute',
        dispute: disputeData
      });
    }
  };

  // Resolve Dispute
  const handleResolveDispute = (isValid: boolean) => {
    if (!activeDispute) return;
    if (isValid) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    if (mode === 'online' && socket) {
      socket.send({
        type: 'ism_hayawan_resolve_dispute',
        dispute: activeDispute,
        isValid
      });
    } else {
      // Offline resolution
      setSubmissions(prev => prev.map(s => {
        if (s.playerId === activeDispute.playerId) {
          const oldScore = s.scores[activeDispute.field];
          const newScore = isValid ? 10 : 0;
          const diff = newScore - oldScore;
          return {
            ...s,
            scores: {
              ...s.scores,
              [activeDispute.field]: newScore,
              total: s.scores.total + diff
            }
          };
        }
        return s;
      }));

      // Adjust player total
      setOfflinePlayers(prev => prev.map(p => {
        if (p.id === activeDispute.playerId) {
          return { ...p, score: p.score + (isValid ? 10 : -p.score) };
        }
        return p;
      }));
    }

    setActiveDispute(null);
  };

  // Next Round / Finish Match
  const handleNextRound = () => {
    sound.playClick();
    if (currentRound >= totalRounds) {
      sound.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setGameState('game_over');
    } else {
      setCurrentRound(prev => prev + 1);
      startLetterSpin();
    }
  };

  // Judge Manual Score Edit
  const handleJudgeAdjustScore = (playerId: string, delta: number) => {
    sound.playClick();
    if (mode === 'online' && socket) {
      socket.send({
        type: 'ism_hayawan_judge_score_adjust',
        targetPlayerId: playerId,
        delta
      });
    } else {
      setOfflinePlayers(prev => prev.map(p => p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p));
    }
  };

  // Add Offline Player
  const handleAddOfflinePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    sound.playClick();
    setOfflinePlayers(prev => [
      ...prev,
      { id: 'p_' + Date.now(), name: newPlayerName.trim(), score: 0 }
    ]);
    setNewPlayerName('');
  };

  return (
    <div className="w-full min-h-screen bg-[#07030e] text-slate-100 flex flex-col font-sans select-none text-right">
      
      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <div className="bg-[#120520] border-b border-emerald-500/30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-black transition-colors cursor-pointer"
            title="الخروج للقائمة"
          >
            ✕
          </button>
          <div>
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <span>اسم حيوان نبات جماد بلاد</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-bold">
              الجولة {currentRound} من {totalRounds} • {mode === 'online' ? 'أونلاين جماعي' : 'أوفلاين بجهاز واحد'}
            </div>
          </div>
        </div>

        {/* Current Round Badge & Judge Indicator */}
        <div className="flex items-center gap-2">
          {isJudgeMode && (
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-xs flex items-center gap-1.5 shadow-sm">
              <Gavel className="w-3.5 h-3.5 text-amber-400" />
              <span>وضع الحكم ⚖️</span>
            </div>
          )}
          <div className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs sm:text-sm">
            {gameState === 'writing' ? `الحرف: ${currentLetter}` : `جولة ${currentRound}/${totalRounds}`}
          </div>
        </div>
      </div>

      {/* ==================== 1. LOBBY / SETUP SCREEN ==================== */}
      {gameState === 'lobby' && (
        <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-center space-y-6 animate-in fade-in">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-4xl shadow-xl mx-auto border-2 border-emerald-300">
              📝
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              اسم حيوان نبات جماد بلاد
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed max-w-md mx-auto">
              أسرع تحدي حروف وكلمات! أول من يكمل يضغط <span className="text-red-400 font-black">"🛑 ستوب!"</span> لإيقاف الجميع فوراً. 10 نقاط للكلمة الفريدة، 5 للمكررة، مع إمكانية الاعتراض ووضع الحكم!
            </p>
          </div>

          {/* Game Settings */}
          <div className="p-5 rounded-3xl bg-[#140624] border border-purple-800/60 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>إعدادات التحدي</span>
            </h3>

            {/* Rounds Selector (1 to 50) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                <span>عدد الجولات المطلوبة:</span>
                <span className="text-emerald-400 font-black text-sm">{totalRounds} جولات</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-purple-400/60 font-mono">
                <span>1 جولة</span>
                <span>5 جولات (الافتراضي)</span>
                <span>25 جولة</span>
                <span>50 جولة</span>
              </div>
            </div>

            {/* Judge Mode Toggle */}
            <div 
              onClick={() => setIsJudgeMode(!isJudgeMode)}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                isJudgeMode 
                  ? 'border-amber-400 bg-amber-500/15' 
                  : 'border-purple-800/60 bg-black/40 hover:border-purple-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
                  ⚖️
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>تفعيل وضع الحكم! (بكون حكم)</span>
                  </div>
                  <div className="text-[10px] text-purple-300/80 mt-0.5">
                    تصلك كل الاعتراضات للبَت فيها وتستطيع رؤية إجابات الجميع وتعديل النقاط
                  </div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={isJudgeMode} 
                onChange={() => {}} 
                className="w-5 h-5 accent-amber-500 pointer-events-none" 
              />
            </div>
          </div>

          {/* Offline Players Setup (if in offline mode) */}
          {mode === 'offline' && (
            <div className="p-5 rounded-3xl bg-[#140624] border border-purple-800/60 space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-black text-purple-200">
                <span>أسماء اللاعبين المتنافسين: ({offlinePlayers.length})</span>
                <span className="text-[10px] text-purple-400">يسع حتى 100 لاعب</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {offlinePlayers.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2 bg-purple-950/80 border border-purple-700/60 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
                    <span>{p.name}</span>
                    {offlinePlayers.length > 2 && (
                      <button
                        onClick={() => setOfflinePlayers(prev => prev.filter(x => x.id !== p.id))}
                        className="text-red-400 hover:text-red-300 font-black cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddOfflinePlayer} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="أضف اسم لاعب جديد..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-black/60 border border-purple-700/60 text-xs font-bold text-white placeholder:text-purple-400/40 focus:outline-hidden focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={!newPlayerName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  + إضافة
                </button>
              </form>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={() => startLetterSpin()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:scale-[1.02] text-black font-black text-base shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>بدء اللعبة واختيار الحرف العشوائي 🔥</span>
          </button>
        </div>
      )}

      {/* ==================== 2. LETTER SPINNER ANIMATION SCREEN ==================== */}
      {gameState === 'letter_spin' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in zoom-in-95">
          <div className="text-xs text-amber-300 font-black tracking-widest uppercase">
            الجولة {currentRound} • جاري اختيار الحرف عشوائياً
          </div>

          {/* 3D Glowing Letter Wheel Carousel */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-emerald-900/60 via-purple-900/40 to-teal-900/60 border-4 border-emerald-400 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]">
            <div className={`text-7xl sm:text-8xl font-black text-white font-mono drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
              isSpinning ? 'animate-bounce text-amber-300' : 'scale-110 text-emerald-300'
            }`}>
              {spinDisplayLetter}
            </div>

            {/* Rotating border particles */}
            <div className="absolute inset-2 border-2 border-dashed border-emerald-400/50 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">
              {isSpinning ? 'العجلة تدور لاختيار الحرف...' : `الحرف المختار: ${currentLetter}!`}
            </h3>
            <p className="text-xs text-purple-300">
              {isSpinning ? 'استعد للكتابة السريعة فور توقف العجلة!' : 'استعدوا... ستفتح خانات الكتابة فوراً!'}
            </p>
          </div>
        </div>
      )}

      {/* ==================== 3. RAPID WRITING & STOP PHASE ==================== */}
      {gameState === 'writing' && (
        <div className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-between space-y-5 animate-in fade-in">
          
          {/* Header Bar with Letter Alert & Stopped Notice */}
          <div className="p-4 rounded-3xl bg-[#140624] border-2 border-emerald-400/60 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-black font-black text-3xl flex items-center justify-center shadow-lg font-mono">
                {currentLetter}
              </div>
              <div>
                <div className="text-xs text-emerald-400 font-bold">الحرف المطلوب لهذه الجولة:</div>
                <div className="text-base sm:text-lg font-black text-white">
                  يجب أن تبدأ جميع الكلمات بحرف ({currentLetter})
                </div>
              </div>
            </div>

            {/* Stop Indicator Badge */}
            {isStopped ? (
              <div className="px-4 py-2 rounded-2xl bg-red-600 text-white font-black text-xs sm:text-sm animate-pulse shadow-lg flex items-center gap-2">
                <span>🚨 {stoppedByName} ضغط ستوب!</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-purple-300/80">
                أسرع لاعب يضغط "ستوب!" 🛑
              </div>
            )}
          </div>

          {/* Stopped Banner Overlay Notice */}
          {isStopped && (
            <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 text-center animate-in slide-in-from-top-3 shadow-2xl">
              <div className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-2">
                <span>🛑 تم إيقاف الكتابة بواسطة:</span>
                <span className="text-amber-300 underline font-black">{stoppedByName}</span>
              </div>
              <p className="text-xs text-red-200 mt-1">
                توقفت الخانات الآن، جاري الانتقال لمرحلة مراجعة الكلمات وحساب النقاط...
              </p>
            </div>
          )}

          {/* The 5 Fields (اسم، حيوان، نبات، جماد، بلاد) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { key: 'name', label: '1. اسم شخص', placeholder: `مثال بحرف (${currentLetter}): سارة، سامي...`, icon: '👤' },
              { key: 'animal', label: '2. حيوان', placeholder: `مثال بحرف (${currentLetter}): سنجاب، سمكة...`, icon: '🦁' },
              { key: 'plant', label: '3. نبات', placeholder: `مثال بحرف (${currentLetter}): سمسم، سدر...`, icon: '🌿' },
              { key: 'thing', label: '4. جماد', placeholder: `مثال بحرف (${currentLetter}): سيارة، ساعة...`, icon: '🚗' },
              { key: 'country', label: '5. بلاد / مدينة', placeholder: `مثال بحرف (${currentLetter}): سوريا، سويد...`, icon: '🌍' }
            ].map(field => {
              const val = inputs[field.key as keyof typeof inputs];
              const isValidFirst = wordStartsWithLetter(val, currentLetter);

              return (
                <div 
                  key={field.key} 
                  className={`p-3.5 rounded-2xl border-2 transition-all ${
                    field.key === 'country' ? 'sm:col-span-2' : ''
                  } ${
                    val.length > 0 && isValidFirst 
                      ? 'bg-emerald-950/30 border-emerald-500/70' 
                      : val.length > 0 && !isValidFirst
                      ? 'bg-red-950/30 border-red-500/70'
                      : 'bg-[#120520] border-purple-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>{field.icon}</span>
                      <span>{field.label}</span>
                    </label>

                    {val.length > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isValidFirst ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isValidFirst ? `✓ يبدأ بـ (${currentLetter})` : `✕ لا يبدأ بـ (${currentLetter})`}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    disabled={isStopped}
                    value={val}
                    onChange={(e) => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-purple-700/60 text-sm font-bold text-white placeholder:text-purple-400/30 focus:outline-hidden focus:border-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              );
            })}
          </div>

          {/* THE GIANT "🛑 ستوب! (STOP!)" BUZZER BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isStopped}
              onClick={handleStopClick}
              className={`w-full py-5 rounded-3xl font-black text-xl sm:text-2xl shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-3 ${
                isStopped
                  ? 'bg-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/40 hover:scale-[1.02] active:scale-95 animate-pulse'
              }`}
            >
              <span className="text-3xl">🛑</span>
              <span>سـتـوب! (STOP!) 🚨</span>
            </button>
            <div className="text-center text-[11px] text-purple-300/70 mt-2">
              اضغط ستوب فور انتهائك لإيقاف جميع اللاعبين في الغرفة ومنعهم من إكمال الكلمات!
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. SCORING & DISPUTE REVIEW PHASE ==================== */}
      {gameState === 'scoring' && (
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6 animate-in fade-in">
          
          {/* Header Scoring Summary */}
          <div className="p-4 rounded-3xl bg-[#140624] border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>مراجعة النقاط للجولة {currentRound} (حرف: {currentLetter})</span>
              </h3>
              <p className="text-xs text-purple-300 mt-0.5">
                10 نقاط للكلمة الفريدة • 5 نقاط للكلمة المكررة (مع مطابقة هـ/ة وأ/إ) • 0 للخطأ
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setGameState('leaderboard');
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs sm:text-sm shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>عرض جدول الترتيب 🏆</span>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          </div>

          {/* Submissions Cards */}
          <div className="space-y-4">
            {submissions.map((sub, sIdx) => (
              <div 
                key={sub.playerId || sIdx}
                className="p-4 sm:p-5 rounded-3xl bg-[#120520] border border-purple-800/60 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-900/60 text-purple-200 font-black text-sm flex items-center justify-center">
                      #{sIdx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{sub.playerName}</div>
                      <div className="text-[10px] text-purple-400">نقاط الجولة: +{sub.scores.total}</div>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-black text-base">
                    +{sub.scores.total} نقطة
                  </div>
                </div>

                {/* 5 Words Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                  {[
                    { key: 'name', label: 'اسم', icon: '👤' },
                    { key: 'animal', label: 'حيوان', icon: '🦁' },
                    { key: 'plant', label: 'نبات', icon: '🌿' },
                    { key: 'thing', label: 'جماد', icon: '🚗' },
                    { key: 'country', label: 'بلاد', icon: '🌍' }
                  ].map(f => {
                    const word = sub[f.key as keyof typeof inputs] || '—';
                    const score = sub.scores[f.key as keyof typeof sub.scores];
                    const isValid = wordStartsWithLetter(word, currentLetter);

                    return (
                      <div 
                        key={f.key}
                        className={`p-2.5 rounded-2xl border flex flex-col justify-between text-right relative ${
                          score === 10 
                            ? 'bg-emerald-950/40 border-emerald-500/50' 
                            : score === 5
                            ? 'bg-amber-950/40 border-amber-500/50'
                            : 'bg-red-950/30 border-red-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-purple-300 mb-1">
                          <span>{f.icon} {f.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] font-black ${
                            score === 10 ? 'bg-emerald-500 text-black' : score === 5 ? 'bg-amber-400 text-black' : 'bg-red-500 text-white'
                          }`}>
                            +{score}
                          </span>
                        </div>

                        <div className="text-xs font-black text-white break-words py-1">
                          {word}
                        </div>

                        {/* Objection / Dispute Button */}
                        {word !== '—' && (
                          <button
                            type="button"
                            onClick={() => handleRaiseDispute(sub, f.key as any)}
                            className="mt-1 w-full py-1 rounded-xl bg-black/40 hover:bg-amber-500/20 text-purple-300 hover:text-amber-300 border border-purple-800/40 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="الاعتراض على هذه الكلمة"
                          >
                            <span>✋ اعتراض</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Active Dispute Resolution Modal / Popup */}
          {activeDispute && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
              <div className="max-w-md w-full bg-[#1c0a32] border-2 border-amber-400 rounded-3xl p-6 text-center text-white space-y-4 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto border border-amber-400/50">
                  ✋
                </div>

                <div>
                  <span className="text-xs text-amber-300 font-bold tracking-wider">اعتراض على كلمة لاعب</span>
                  <h4 className="text-lg font-black text-white mt-1">
                    هل كلمة "{activeDispute.word}" تعتبر ({activeDispute.fieldLabel}) صحيحة؟
                  </h4>
                  <p className="text-xs text-purple-300 mt-1">
                    اللاعب: <span className="text-white font-bold">{activeDispute.playerName}</span> • الحرف: <span className="text-amber-300 font-bold font-mono">({currentLetter})</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleResolveDispute(true)}
                    className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>صحيحة (+10)</span>
                  </button>

                  <button
                    onClick={() => handleResolveDispute(false)}
                    className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                    <span>خاطئة (0 نقطة)</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveDispute(null)}
                  className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
                >
                  إلغاء الاعتراض
                </button>
              </div>
            </div>
          )}

          {/* Judge Special Controls Bar (if isJudgeMode) */}
          {isJudgeMode && (
            <div className="p-4 rounded-3xl bg-[#1a082e] border-2 border-amber-500/50 space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-black text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Gavel className="w-4 h-4" />
                  <span>لوحة تحكم الحكم المباشرة ⚖️</span>
                </span>
                <span className="text-[10px] text-purple-300">تستطيع تعديل نقاط أي لاعب فوراً</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(mode === 'online' ? players : offlinePlayers).map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-black/60 border border-purple-800/60 p-2 rounded-2xl text-xs">
                    <span className="font-bold text-white">{p.name}:</span>
                    <button
                      onClick={() => handleJudgeAdjustScore(p.id, 5)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[10px] cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleJudgeAdjustScore(p.id, 10)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[10px] cursor-pointer"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleJudgeAdjustScore(p.id, -5)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg text-[10px] cursor-pointer"
                    >
                      -5
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 5. ROUND LEADERBOARD ==================== */}
      {gameState === 'leaderboard' && (
        <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-between space-y-6 animate-in fade-in">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-3xl mx-auto text-amber-400">
              🏆
            </div>
            <h3 className="text-2xl font-black text-white">
              ترتيب اللاعبين بعد الجولة {currentRound}
            </h3>
            <p className="text-xs text-purple-300">
              مجموع النقاط التراكمية في التحدي
            </p>
          </div>

          {/* Ranked Players List */}
          <div className="space-y-2.5">
            {(mode === 'online' ? players : offlinePlayers)
              .slice()
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((p, rank) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = rank < 3 ? medals[rank] : `#${rank + 1}`;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                      rank === 0
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-[#140624] border-purple-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-mono">{medal}</span>
                      <div>
                        <div className="text-sm font-black text-white">{p.name}</div>
                        <div className="text-[10px] text-purple-400">الترتيب {rank + 1}</div>
                      </div>
                    </div>

                    <div className="text-base sm:text-xl font-mono font-black text-amber-300">
                      {p.score || 0} نقطة
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Action to advance or complete */}
          <button
            onClick={handleNextRound}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] text-black font-black text-base shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{currentRound >= totalRounds ? 'إعلان الفائز النهائي 🏆' : `بدء الجولة ${currentRound + 1} من ${totalRounds} ➔`}</span>
          </button>
        </div>
      )}

      {/* ==================== 6. GRAND VICTORY GAME OVER ==================== */}
      {gameState === 'game_over' && (
        <div className="flex-1 max-w-lg mx-auto w-full p-6 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-2xl animate-bounce">
            👑
          </div>

          <div>
            <span className="text-xs text-amber-300 font-bold tracking-widest uppercase">نهاية التحدي الأسطوري</span>
            <h2 className="text-3xl font-black text-white mt-1">
              مبروك للفائز بالمركز الأول!
            </h2>
          </div>

          {/* Podium Winner Card */}
          {(() => {
            const sorted = (mode === 'online' ? players : offlinePlayers)
              .slice()
              .sort((a, b) => (b.score || 0) - (a.score || 0));
            const winner = sorted[0];

            return (
              <div className="w-full p-6 rounded-3xl bg-gradient-to-b from-[#25103d] to-[#120520] border-2 border-amber-400 shadow-2xl space-y-3">
                <div className="text-4xl">🥇</div>
                <div className="text-xl font-black text-white">{winner?.name}</div>
                <div className="text-3xl font-black text-amber-300 font-mono">
                  {winner?.score || 0} نقطة
                </div>
                <p className="text-xs text-purple-200/80">
                  تفوق بالسرعة ودقة الكلمات الفريدة عبر {totalRounds} جولات!
                </p>
              </div>
            );
          })()}

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => {
                sound.playClick();
                setCurrentRound(1);
                setOfflinePlayers(prev => prev.map(p => ({ ...p, score: 0 })));
                setGameState('lobby');
              }}
              className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              لعبة جديدة 🔄
            </button>
            <button
              onClick={onExit}
              className="px-6 py-3.5 rounded-2xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              القائمة الرئيسية
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
