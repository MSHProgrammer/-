import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, Award, Clock, Users, ArrowRight, HelpCircle, Check, Flame, Trophy, AlertTriangle, Compass, CheckCircle2, XCircle, Shuffle, Plus, Trash2, UserPlus, Sparkles, Dices } from 'lucide-react';
import { Player, QuestionItem } from '../../types/game';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { DEFAULT_BARRAH_CATEGORIES, BarrahCategory } from '../../data/barrahSalfaCategories';

interface BarrahSalfaProps {
  mode: 'online' | 'offline';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  questionData?: QuestionItem;
  onOnlineVote?: (votedPlayerId: string) => void;
  onNextRound?: () => void;
  onlineGameData?: any;
  onlineStatus?: string;
  isHost?: boolean;
}

export const BarrahSalfaEngine: React.FC<BarrahSalfaProps> = ({
  mode,
  players: initialPlayers,
  currentRound,
  totalRounds,
  questionData,
  onOnlineVote,
  onNextRound,
  onlineGameData,
  onlineStatus,
  isHost
}) => {
  // Pre-game roster customization
  const [roster, setRoster] = useState<Array<{ id: string; name: string; avatar: string }>>(() => {
    if (initialPlayers && initialPlayers.length >= 3) {
      return initialPlayers.map(p => ({ id: p.id, name: p.name, avatar: p.avatar || '👤' }));
    }
    return [
      { id: 'p1', name: 'حمد', avatar: '🦁' },
      { id: 'p2', name: 'محمد', avatar: '🦅' },
      { id: 'p3', name: 'خالد', avatar: '🐺' },
      { id: 'p4', name: 'سعد', avatar: '🐆' }
    ];
  });
  const [newPlayerName, setNewPlayerName] = useState('');

  // Categories (fetch from server or fallback to 20 defaults)
  const [categoriesList, setCategoriesList] = useState<BarrahCategory[]>(DEFAULT_BARRAH_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('random');

  // Game Engine Phases:
  // 'setup' -> 'reveal_cards' -> 'questions_stage' -> 'voting_pass' -> 'final_chance' -> 'results'
  const [phase, setPhase] = useState<'setup' | 'reveal_cards' | 'questions_stage' | 'voting_pass' | 'final_chance' | 'results'>('setup');
  
  // Active Round Data
  const [activeCategory, setActiveCategory] = useState<BarrahCategory>(DEFAULT_BARRAH_CATEGORIES[0]);
  const [secretWord, setSecretWord] = useState<string>('');
  const [dummyChoices, setDummyChoices] = useState<string[]>([]);
  const [spyPlayerId, setSpyPlayerId] = useState<string>('');

  // Card Reveal (Pass & Play)
  const [revealIndex, setRevealIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Question Phase: Randomized by luck
  const [currentAskerId, setCurrentAskerId] = useState<string>('');
  const [currentAnswererId, setCurrentAnswererId] = useState<string>('');

  // Turn-based secret voting (أدوار تمرير الجوال)
  const [voterIndex, setVoterIndex] = useState(0);
  const [voterSelectedTarget, setVoterSelectedTarget] = useState<string>('');
  const [voterReady, setVoterReady] = useState(false);
  const [secretVotes, setSecretVotes] = useState<Record<string, string>>({}); // voterId -> targetId
  const [accusedPlayerId, setAccusedPlayerId] = useState<string>('');

  // Final Chance
  const [timerSeconds, setTimerSeconds] = useState(25);
  const [timerRunning, setTimerRunning] = useState(false);
  const [spyGuess, setSpyGuess] = useState<string | null>(null);
  const [spyWonByGuess, setSpyWonByGuess] = useState<boolean | null>(null);

  // Fetch categories from API on mount
  useEffect(() => {
    fetch('/api/barrah/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategoriesList(data.categories);
        }
      })
      .catch(() => {
        // Fallback is already DEFAULT_BARRAH_CATEGORIES
      });
  }, []);

  // Timer countdown for Final Chance
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            if (phase === 'final_chance') {
              setSpyWonByGuess(false);
              setPhase('results');
              sound.playWrong();
            }
            return 0;
          }
          if (s <= 5) sound.playTick(true);
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, phase]);

  // Roster helpers
  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    const avatars = ['🦁', '🦅', '🐺', '🐆', '🦊', '🐯', '🐼', '🐻', '🦉', '👑'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setRoster(prev => [...prev, { id: 'p_' + Date.now(), name: trimmed, avatar: randomAvatar }]);
    setNewPlayerName('');
    sound.playClick();
  };

  const handleRemovePlayer = (id: string) => {
    if (roster.length <= 3) {
      alert('يجب أن يكون عدد اللاعبين 3 على الأقل!');
      return;
    }
    setRoster(prev => prev.filter(p => p.id !== id));
    sound.playClick();
  };

  // Start the game with chosen category and roster
  const handleStartGame = () => {
    if (roster.length < 3) {
      alert('يرجى إضافة 3 لاعبين على الأقل لبدء اللعبة!');
      return;
    }

    sound.playVictory();

    // Pick category
    let chosenCat: BarrahCategory;
    if (selectedCategoryId === 'random') {
      chosenCat = categoriesList[Math.floor(Math.random() * categoriesList.length)] || DEFAULT_BARRAH_CATEGORIES[0];
    } else {
      chosenCat = categoriesList.find(c => c.id === selectedCategoryId) || DEFAULT_BARRAH_CATEGORIES[0];
    }
    setActiveCategory(chosenCat);

    // Pick secret word
    const wordsPool = chosenCat.words && chosenCat.words.length > 0 ? chosenCat.words : ['كبسة دجاج', 'مندي لحم', 'شاورما'];
    const chosenWord = wordsPool[Math.floor(Math.random() * wordsPool.length)];
    setSecretWord(chosenWord);

    // Pick Spy randomly
    const randomSpyIdx = Math.floor(Math.random() * roster.length);
    setSpyPlayerId(roster[randomSpyIdx].id);

    // Generate 8 choices for Final Chance (the chosen word + 7 unique dummy words from same or nearby categories)
    const otherWords = wordsPool.filter(w => w !== chosenWord);
    // If not enough words, pull from all categories
    const allWords = categoriesList.flatMap(c => c.words).filter(w => w !== chosenWord);
    const shuffledDummies = [...otherWords, ...allWords].sort(() => 0.5 - Math.random());
    const selectedDummies = Array.from(new Set(shuffledDummies)).slice(0, 7);
    const final8 = [chosenWord, ...selectedDummies].sort(() => 0.5 - Math.random());
    setDummyChoices(final8);

    // Reset game state
    setPhase('reveal_cards');
    setRevealIndex(0);
    setCardFlipped(false);
    setSecretVotes({});
    setAccusedPlayerId('');
    setSpyGuess(null);
    setSpyWonByGuess(null);
  };

  // Pick lucky question pair (who asks whom randomly)
  const drawLuckyQuestionPair = () => {
    if (roster.length < 2) return;
    sound.playTileSelect();
    const askerIdx = Math.floor(Math.random() * roster.length);
    let answererIdx = Math.floor(Math.random() * roster.length);
    while (answererIdx === askerIdx && roster.length > 1) {
      answererIdx = Math.floor(Math.random() * roster.length);
    }
    setCurrentAskerId(roster[askerIdx].id);
    setCurrentAnswererId(roster[answererIdx].id);
  };

  const handleStartQuestions = () => {
    sound.playClick();
    setPhase('questions_stage');
    drawLuckyQuestionPair();
  };

  // Start turn-based secret voting
  const handleStartVoting = () => {
    sound.playClick();
    setPhase('voting_pass');
    setVoterIndex(0);
    setVoterReady(false);
    setVoterSelectedTarget('');
    setSecretVotes({});
  };

  // Submit vote for current player in turn
  const handleConfirmSecretVote = () => {
    if (!voterSelectedTarget) return;
    sound.playClick();
    const currentVoter = roster[voterIndex];
    const newVotes = { ...secretVotes, [currentVoter.id]: voterSelectedTarget };
    setSecretVotes(newVotes);

    if (voterIndex + 1 < roster.length) {
      // Pass phone to next voter
      setVoterIndex(i => i + 1);
      setVoterReady(false);
      setVoterSelectedTarget('');
    } else {
      // All players have voted -> tally!
      tallyFinalVotes(newVotes);
    }
  };

  // Tally votes after all players secretly voted
  const tallyFinalVotes = (finalVotes: Record<string, string>) => {
    sound.playGong();
    const counts: Record<string, number> = {};
    Object.values(finalVotes).forEach(targetId => {
      counts[targetId] = (counts[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let target = '';
    for (const [tid, cnt] of Object.entries(counts)) {
      if (cnt > maxVotes) {
        maxVotes = cnt;
        target = tid;
      }
    }

    setAccusedPlayerId(target);

    // If the accused player is the spy, trigger the Final Chance (الفرصة الأخيرة)!
    if (target === spyPlayerId) {
      setPhase('final_chance');
      setTimerSeconds(25);
      setTimerRunning(true);
    } else {
      // Spy was not caught -> Spy wins directly by deception!
      setPhase('results');
      sound.playVictory();
    }
  };

  // Spy final chance guess
  const handleSpyGuess = (choice: string) => {
    if (spyGuess !== null) return;
    setSpyGuess(choice);
    setTimerRunning(false);

    const isCorrect = choice === secretWord;
    setSpyWonByGuess(isCorrect);
    setPhase('results');

    if (isCorrect) {
      sound.playVictory();
      confetti({ particleCount: 90, spread: 80 });
    } else {
      sound.playWrong();
    }
  };

  const spyPlayer = roster.find(p => p.id === spyPlayerId) || roster[0];
  const accusedPlayer = roster.find(p => p.id === accusedPlayerId);
  const currentVoterPlayer = roster[voterIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-right pb-14 font-sans select-none">

      {/* ================= 0. PRE-GAME SETUP & CATEGORY PICKER ================= */}
      {phase === 'setup' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1c0a2a] via-[#12051e] to-[#0a0312] border-2 border-orange-500/50 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-purple-900/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🕵️</span>
              <div>
                <h2 className="text-xl font-black text-white">إعداد لعبة برا السالفة</h2>
                <p className="text-xs text-orange-400 font-bold">تحديد اللاعبين واختيار القسم من بين 20 قسماً</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-900/50 text-purple-300 border border-purple-700/50">
              أوفلاين (جهاز واحد)
            </span>
          </div>

          {/* Section 1: Players Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange-400" />
                <span>قائمة اللاعبين ({roster.length}):</span>
              </label>
              <span className="text-[11px] text-purple-300">الحد الأدنى 3 لاعبين</span>
            </div>

            {/* Players Tag List */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roster.map((player, idx) => (
                <div
                  key={player.id}
                  className="p-2.5 rounded-2xl bg-black/50 border border-purple-800/60 flex items-center justify-between gap-1 shadow-inner"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-base">{player.avatar}</span>
                    <span className="text-xs font-black text-white truncate">{player.name}</span>
                  </div>
                  {roster.length > 3 && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer transition-colors"
                      title="حذف اللاعب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Player Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
                placeholder="أدخل اسم لاعب جديد (مثال: فهد، ناصر...)"
                className="flex-1 bg-black/60 border border-purple-700/60 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-purple-400/40 focus:outline-hidden focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim()}
                className="px-4 py-2.5 bg-purple-900/80 hover:bg-purple-800 disabled:opacity-40 text-amber-300 font-black text-xs rounded-2xl border border-purple-600 cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </div>
          </div>

          {/* Section 2: Category Selector (20 Categories - أسماء واضحة بالكامل) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-orange-400" />
                <span>اختر قسم السالفة (20 قسماً متاحاً بأسمائها كاملة):</span>
              </label>
              <span className="text-xs text-purple-300 font-bold">
                {selectedCategoryId === 'random' ? 'تم اختيار: عشوائي من الجميع 🎲' : `المحدد: ${categoriesList.find(c => c.id === selectedCategoryId)?.name}`}
              </span>
            </div>

            {/* Categories Grid - Clear, Spacious, No Truncation! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2 rounded-2xl bg-black/40 border border-purple-900/50 scrollbar-thin">
              {/* Random Choice */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedCategoryId('random');
                }}
                className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-center gap-3 ${
                  selectedCategoryId === 'random'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-amber-300 text-white shadow-xl ring-2 ring-amber-400/40'
                    : 'bg-purple-950/40 border-purple-800/40 text-purple-200 hover:border-amber-400/60 hover:bg-purple-900/40'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">
                  🎲
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-white leading-tight">عشوائي من جميع الأقسام</div>
                  <div className="text-xs text-amber-200/90 mt-0.5">سالفة مفاجئة ومحيرة للمحترفين</div>
                </div>
                {selectedCategoryId === 'random' && (
                  <Check className="w-5 h-5 text-white shrink-0" />
                )}
              </button>

              {/* 20 Categories with FULL, CLEAR NAMES */}
              {categoriesList.map(cat => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedCategoryId(cat.id);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-amber-300 text-white shadow-xl ring-2 ring-amber-400/40 scale-[1.01]'
                        : 'bg-purple-950/40 border-purple-800/40 text-purple-200 hover:border-amber-400/60 hover:bg-purple-900/40'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-purple-900/60 flex items-center justify-center text-2xl shrink-0 mt-0.5">
                      {cat.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Full, Large, Clear Topic Title */}
                      <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                        {cat.name}
                      </h4>
                      {cat.description && (
                        <p className="text-xs text-purple-200/80 leading-relaxed mt-0.5 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                      <span className="text-[10px] font-mono text-amber-300 font-bold bg-black/40 px-2 py-0.5 rounded-md mt-1.5 inline-block">
                        {cat.words.length} سالفة
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-5 h-5 text-white shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Game Action */}
          <button
            onClick={handleStartGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-base shadow-xl shadow-orange-500/30 cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5 text-black" />
            <span>بدء توزيع الكروت بالسر 🔥</span>
          </button>
        </div>
      )}

      {/* ================= 1. REVEAL CARDS (الكروت بالسر) ================= */}
      {phase === 'reveal_cards' && roster[revealIndex] && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1c0a2a] to-[#0d0416] border-2 border-orange-500/50 shadow-2xl text-center space-y-6">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <span className="text-xs font-black text-amber-400">كروت السالفة ({revealIndex + 1} من {roster.length})</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <span>{activeCategory.icon}</span>
              <span>القسم: {activeCategory.name}</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white">
            دور اللاعب: <span className="text-orange-400">{roster[revealIndex].name}</span> {roster[revealIndex].avatar}
          </h2>
          <p className="text-xs text-purple-200">
            خذ الجوال وتأكد إن ما حد يشوف الشاشة معك، ثم اضغط على الكرت لرؤية دورك
          </p>

          <div className="py-4">
            {!cardFlipped ? (
              <button
                onClick={() => {
                  sound.playTileSelect();
                  setCardFlipped(true);
                }}
                className="w-60 h-80 mx-auto rounded-3xl bg-gradient-to-b from-purple-900/60 via-purple-950/80 to-black border-2 border-orange-500/50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-105 transition-all shadow-2xl"
              >
                <EyeOff className="w-14 h-14 text-orange-400 animate-pulse" />
                <span className="text-sm font-black text-orange-200">المس الكرت لرؤية دورك</span>
                <span className="text-[10px] text-purple-300">سري للغاية 🤫</span>
              </button>
            ) : (
              <div className="w-60 h-80 mx-auto rounded-3xl bg-gradient-to-b from-orange-950/60 via-[#1d092c] to-black border-2 border-orange-400 p-6 flex flex-col items-center justify-center gap-3 shadow-2xl animate-in zoom-in-95">
                {roster[revealIndex].id === spyPlayerId ? (
                  // STRICT USER REQUIREMENT: Person who is spy gets ONLY: «أنت برا السالفة فقط!» No fake topic!
                  <div className="space-y-3">
                    <span className="text-5xl animate-bounce">🕵️</span>
                    <div className="text-2xl font-black text-red-400 leading-tight">
                      أنت برا السالفة فقط!
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black">
                      ما عندك سالفة نهائياً 🤫
                    </div>
                    <p className="text-[11px] text-purple-200 leading-relaxed pt-1">
                      سلك وتظاهر إنك داخل السالفة! حاول تلقط الكلمة من أسئلة الباقين عشان تخطف الفوز.
                    </p>
                  </div>
                ) : (
                  // Inside the Salfa
                  <div className="space-y-3">
                    <span className="text-5xl">📜</span>
                    <div className="text-xs font-black text-amber-400 flex items-center justify-center gap-1">
                      <span>{activeCategory.icon}</span>
                      <span>القسم: {activeCategory.name}</span>
                    </div>
                    <div className="text-xs text-purple-300 font-bold">السالفة هي:</div>
                    <div className="text-2xl font-black text-emerald-300 bg-emerald-950/60 py-2 px-3 rounded-2xl border border-emerald-500/40 shadow-inner">
                      {secretWord}
                    </div>
                    <p className="text-[11px] text-purple-200 leading-relaxed">
                      أنت داخل السالفة! اثبت بجوابك إنك تعرفها ولكن لا توضح بزيادة عشان ما يفهمها الجاسوس.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {cardFlipped && (
            <button
              onClick={() => {
                sound.playClick();
                setCardFlipped(false);
                if (revealIndex + 1 < roster.length) {
                  setRevealIndex(i => i + 1);
                } else {
                  handleStartQuestions();
                }
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-sm shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              {revealIndex + 1 < roster.length ? 'إخفاء وتمرير للاعب التالي ➔' : 'بدء جولة الأسئلة 🎤'}
            </button>
          )}
        </div>
      )}

      {/* ================= 2. QUESTIONS STAGE (الأسئلة بالحظ 🎲) ================= */}
      {phase === 'questions_stage' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170724] border-2 border-orange-500/50 shadow-2xl space-y-6 text-center">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <span className="text-xs font-black text-orange-400 flex items-center gap-1">
              <Dices className="w-4 h-4 text-amber-400" />
              <span>مرحلة طرح الأسئلة (سؤال بالحظ 🎲)</span>
            </span>
            <span className="text-xs font-bold text-purple-300">
              {activeCategory.icon} {activeCategory.name}
            </span>
          </div>

          {/* Golden Rule Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right space-y-1">
            <div className="text-xs font-black text-amber-400">✨ القاعدة الذهبية:</div>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              ✅ جوابك يثبت إنك تعرف السالفة.. ولكن ❌ لا توضح زيادة عشان برا السالفة ما يعرف الكلمة!
            </p>
          </div>

          {/* Current Question Pair Generated by Luck */}
          <div className="py-4 space-y-3">
            <div className="text-xs font-bold text-purple-300">القرعة تختار مين يسأل مين بالحظ:</div>
            <div className="p-5 rounded-3xl bg-black/50 border-2 border-purple-700/60 flex items-center justify-around shadow-inner">
              <div className="text-center">
                <div className="text-xs text-orange-400 font-bold mb-1">السائل 🗣️</div>
                <div className="text-xl font-black text-white">
                  {roster.find(p => p.id === currentAskerId)?.name || roster[0]?.name}
                </div>
                <div className="text-sm">
                  {roster.find(p => p.id === currentAskerId)?.avatar || '👤'}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-6 h-6 text-amber-400 rotate-180" />
                <span className="text-[10px] text-amber-300/80 font-bold">يسأل</span>
              </div>

              <div className="text-center">
                <div className="text-xs text-emerald-400 font-bold mb-1">المجيب 🎯</div>
                <div className="text-xl font-black text-white">
                  {roster.find(p => p.id === currentAnswererId)?.name || roster[1]?.name}
                </div>
                <div className="text-sm">
                  {roster.find(p => p.id === currentAnswererId)?.avatar || '👤'}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={drawLuckyQuestionPair}
              className="py-3 px-6 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-amber-300 font-bold text-xs border border-purple-600 cursor-pointer flex items-center justify-center gap-2"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>سحب قرعة سؤال جديدة بالحظ 🎲</span>
            </button>
            <button
              onClick={handleStartVoting}
              className="py-3 px-8 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm shadow-lg shadow-orange-500/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>بدء التصويت السري (أدوار) 🗳️</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= 3. TURN-BASED SECRET VOTING (أدوار تمرير الجوال) ================= */}
      {phase === 'voting_pass' && currentVoterPlayer && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170724] border-2 border-orange-500/50 shadow-2xl space-y-6 text-center">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>التصويت السري (أدوار): مين برا السالفة؟</span>
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/50 font-mono">
              صوت {voterIndex + 1} من {roster.length}
            </span>
          </div>

          {!voterReady ? (
            /* Pass the phone cover screen */
            <div className="py-8 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/20 border-2 border-orange-500/50 flex items-center justify-center text-3xl shadow-inner">
                🤫
              </div>
              <h2 className="text-2xl font-black text-white">
                دور اللاعب: <span className="text-orange-400">{currentVoterPlayer.name}</span> {currentVoterPlayer.avatar}
              </h2>
              <p className="text-xs text-purple-200 max-w-sm mx-auto">
                مرر الجوال لـ <span className="text-amber-300 font-bold">{currentVoterPlayer.name}</span> ليصوت بالسر التام دون أن يرى أحد اختياره!
              </p>
              <button
                onClick={() => {
                  sound.playClick();
                  setVoterReady(true);
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-sm shadow-lg shadow-orange-500/30 cursor-pointer"
              >
                أنا {currentVoterPlayer.name} وجاهز للتصويت بالسر 🔒
              </button>
            </div>
          ) : (
            /* Secret voting choices for current player */
            <div className="space-y-4 animate-in fade-in">
              <div className="text-xs text-purple-300">
                يا <span className="text-amber-400 font-bold">{currentVoterPlayer.name}</span>، مين تعتقد إنه برا السالفة؟
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-right">
                {roster
                  .filter(p => p.id !== currentVoterPlayer.id) // Player cannot vote for themselves
                  .map(target => {
                    const isSelected = voterSelectedTarget === target.id;
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setVoterSelectedTarget(target.id);
                        }}
                        className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-orange-500 border-amber-300 text-black shadow-lg font-black'
                            : 'bg-black/50 border-purple-800/60 hover:border-orange-500 text-white font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{target.avatar}</span>
                          <span className="text-xs">{target.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </button>
                    );
                  })}
              </div>

              <button
                disabled={!voterSelectedTarget}
                onClick={handleConfirmSecretVote}
                className="w-full max-w-md py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 text-black font-black text-sm shadow-lg shadow-orange-500/30 cursor-pointer transition-all"
              >
                {voterIndex + 1 < roster.length
                  ? 'تأكيد وحفظ الصوت السري ➔'
                  : 'حسم التصويت وإعلان النتيجة 🏆'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 4. FINAL CHANCE (الفرصة الأخيرة 8 كلمات) ================= */}
      {phase === 'final_chance' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#1b082c] border-2 border-amber-400 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 text-xs font-black">
            ⚡ الفرصة الأخيرة لبرا السالفة!
          </div>

          <h2 className="text-2xl font-black text-white">
            انكشفت بالتصويت يا <span className="text-red-400">{spyPlayer.name}</span>!
          </h2>
          <p className="text-xs text-purple-200">
            أمامك 25 ثانية و 8 كلمات، إذا اخترت السالفة الصحيحة تفوز وتخطف الانتصار من الجميع!
          </p>

          <div className="flex justify-center">
            <div className="px-4 py-1.5 rounded-2xl bg-black/60 border border-amber-500/50 text-amber-400 font-mono font-black text-xl flex items-center gap-2 shadow-inner">
              <Clock className="w-5 h-5" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          {/* 8 Word Choices Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto">
            {dummyChoices.map((word, idx) => (
              <button
                key={idx}
                disabled={spyGuess !== null}
                onClick={() => handleSpyGuess(word)}
                className={`p-3.5 rounded-2xl border font-black text-xs transition-all cursor-pointer ${
                  spyGuess === word
                    ? word === secretWord
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                      : 'bg-red-600 border-red-400 text-white shadow-lg'
                    : 'bg-purple-950/60 border-purple-700/60 text-purple-100 hover:border-amber-400 hover:bg-purple-900/60'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. RESULTS SCREEN ================= */}
      {phase === 'results' && (
        <div className="p-8 rounded-3xl bg-[#150522] border-2 border-yellow-400 shadow-2xl space-y-6 text-center animate-in fade-in">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black text-white">انتهت الجولة!</h2>

          {spyWonByGuess ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 max-w-md mx-auto space-y-2">
              <div className="text-xl font-black text-emerald-400">🎉 فاز برا السالفة ({spyPlayer.name})!</div>
              <p className="text-xs text-purple-200">
                رغم كشفه بالتصويت، استغل الفرصة الأخيرة وخمن الكلمة ({secretWord}) بشكل صحيح وخطف الفوز!
              </p>
            </div>
          ) : accusedPlayerId === spyPlayerId ? (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 max-w-md mx-auto space-y-2">
              <div className="text-xl font-black text-emerald-400">🎉 فاز أصحاب السالفة!</div>
              <p className="text-xs text-purple-200">
                كشفتم برا السالفة ({spyPlayer.name}) ولم يستطع تخمين السالفة الأصلية ({secretWord}).
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 max-w-md mx-auto space-y-2">
              <div className="text-xl font-black text-red-400">🎉 فاز برا السالفة بالخداع!</div>
              <p className="text-xs text-purple-200">
                صوتم بالخطأ على ({accusedPlayer?.name}) وهرب برا السالفة الحقيقي ({spyPlayer.name}) بالنقاط!
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-black/40 border border-purple-800/40 max-w-md mx-auto text-xs space-y-2 text-right">
            <div>
              <span className="text-purple-400 font-bold">القسم المختار:</span>{' '}
              <span className="font-black text-white">{activeCategory.icon} {activeCategory.name}</span>
            </div>
            <div>
              <span className="text-purple-400 font-bold">السالفة الأصلية:</span>{' '}
              <span className="font-black text-emerald-300">{secretWord}</span>
            </div>
            <div>
              <span className="text-purple-400 font-bold">برا السالفة الحقيقي:</span>{' '}
              <span className="font-black text-orange-400">{spyPlayer.name} {spyPlayer.avatar}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-md mx-auto">
            {onNextRound && (
              <button
                onClick={onNextRound}
                className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm cursor-pointer shadow-lg shadow-orange-500/30"
              >
                الجولة التالية ➔
              </button>
            )}
            <button
              onClick={() => setPhase('setup')}
              className="flex-1 py-3.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700 cursor-pointer"
            >
              جولة جديدة وإعدادات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
