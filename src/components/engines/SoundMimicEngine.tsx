import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Trophy, Clock, Star, Play, Award, RotateCcw, ArrowRight, Activity, Users, ThumbsUp, Sparkles, Radio, MessageSquare } from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { Player } from '../../types/game';
import { MIMIC_SOUNDS_BANK, MimicSoundItem } from '../../data/mimicSoundsBank';

interface SoundMimicEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  onlineRoomData?: any;
  onOnlineScore?: (score: number) => void;
  onExit: () => void;
}

export const SoundMimicEngine: React.FC<SoundMimicEngineProps> = ({
  mode,
  players,
  onlineRoomData,
  onOnlineScore,
  onExit
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.max(3, players.length);
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);

  // Active Sound Item
  const [currentSound, setCurrentSound] = useState<MimicSoundItem>(MIMIC_SOUNDS_BANK[0]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  // Turn Stages: 'demo_listen' -> 'countdown' -> 'mimicking' -> 'voting' -> 'turn_score' -> 'match_over'
  const [stage, setStage] = useState<'demo_listen' | 'countdown' | 'mimicking' | 'voting' | 'turn_score' | 'match_over'>('demo_listen');
  const [countdownNum, setCountdownNum] = useState(3);
  const [mimicTimer, setMimicTimer] = useState(6);

  // Voting
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [myRating, setMyRating] = useState(75);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});

  // Voice Chat Feature State
  // Requirement: "اضف محادثة صوتية في تقليد الاصوات ولكن تنطفئ المحادثة عندما يقلد شخص الصوت وترجع بعد انتهائه"
  const [myMicEnabled, setMyMicEnabled] = useState(true);
  const [simulatedTalkingMap, setSimulatedTalkingMap] = useState<Record<string, boolean>>({});
  const isVoiceMutedBySystem = stage === 'countdown' || stage === 'mimicking';
  const prevMuteRef = useRef(isVoiceMutedBySystem);

  // Monitor voice chat mute/unmute transition
  useEffect(() => {
    if (prevMuteRef.current !== isVoiceMutedBySystem) {
      if (isVoiceMutedBySystem) {
        sound.playWrong(); // subtle alert that voice chat is turned off
      } else {
        sound.playTileSelect(); // sound notification that voice chat is back on!
      }
      prevMuteRef.current = isVoiceMutedBySystem;
    }
  }, [isVoiceMutedBySystem]);

  // Simulated voice chat activity when active (speech waves)
  useEffect(() => {
    if (isVoiceMutedBySystem) {
      // All other players are muted
      setSimulatedTalkingMap({});
      return;
    }

    const interval = setInterval(() => {
      const map: Record<string, boolean> = {};
      players.forEach(p => {
        // Randomly simulate who is talking in the room when voice chat is open
        map[p.id] = Math.random() > 0.45;
      });
      setSimulatedTalkingMap(map);
    }, 1200);

    return () => clearInterval(interval);
  }, [isVoiceMutedBySystem, players]);

  // Pick random sound per turn
  useEffect(() => {
    const s = MIMIC_SOUNDS_BANK[Math.floor(Math.random() * MIMIC_SOUNDS_BANK.length)] || MIMIC_SOUNDS_BANK[0];
    setCurrentSound(s);
    setStage('demo_listen');
    setCountdownNum(3);
    setRatings({});
    setMyRating(75);
  }, [activePlayerIdx, currentRound]);

  // Demo audio play
  const handlePlayDemo = () => {
    setIsPlayingDemo(true);
    sound.playMemeSound(currentSound.soundType);
    setTimeout(() => {
      setIsPlayingDemo(false);
    }, (currentSound.targetDurationSec || 3) * 1000);
  };

  // Start Mimic Turn (Countdown 3 -> 2 -> 1 -> GO)
  const handleStartCountdown = () => {
    sound.playMicBeep(false);
    setStage('countdown');
    setCountdownNum(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        sound.playMicBeep(false);
        setCountdownNum(count);
      } else {
        clearInterval(interval);
        sound.playMicBeep(true);
        startMimicAction();
      }
    }, 1000);
  };

  const startMimicAction = () => {
    setStage('mimicking');
    setMimicTimer(currentSound.targetDurationSec || 5);

    let t = currentSound.targetDurationSec || 5;
    const timerInt = setInterval(() => {
      t -= 1;
      setMimicTimer(t);
      if (t <= 0) {
        clearInterval(timerInt);
        sound.playClick();
        setStage('voting');
      }
    }, 1000);
  };

  // Submit Rating (0 to 100)
  const handleSubmitRating = () => {
    sound.playClick();
    const currPlayer = players[activePlayerIdx] || players[0];
    const newRatings = { ...ratings, ['judge_1']: myRating };
    setRatings(newRatings);

    // Calculate average
    const scoreVals = Object.values(newRatings);
    const avg = Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length);

    setPlayerScores(prev => ({
      ...prev,
      [currPlayer.id]: (prev[currPlayer.id] || 0) + avg
    }));

    if (avg >= 70) {
      sound.playCorrect();
      confetti({ particleCount: 50, spread: 60 });
    } else {
      sound.playWrong();
    }

    setStage('turn_score');
  };

  const handleNextTurn = () => {
    sound.playClick();
    if (activePlayerIdx + 1 < players.length) {
      setActivePlayerIdx(i => i + 1);
    } else if (currentRound < totalRounds) {
      setCurrentRound(r => r + 1);
      setActivePlayerIdx(0);
    } else {
      sound.playVictory();
      setStage('match_over');
    }
  };

  const activePlayer = players[activePlayerIdx] || players[0];

  return (
    <div className="max-w-3xl mx-auto space-y-5 text-right pb-14 font-sans select-none">
      
      {/* Top Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#2a0c3a] via-[#160620] to-[#260934] border-2 border-pink-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-2xl">
            🎙️
          </div>
          <div>
            <div className="text-sm font-black text-white">تقليد الأصوات (ميميك بارتي)</div>
            <div className="text-xs text-pink-300 font-bold">استمع للصوت، قلّده بدقة، والجمهور يقيّم!</div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
        >
          خروج للقائمة
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VOICE CHAT BAR (محادثة صوتية ذكية تنطفئ أثناء التقليد وترجع بعده)         */}
      {/* ========================================================================= */}
      <div className={`p-4 rounded-3xl border-2 transition-all shadow-xl space-y-3 ${
        isVoiceMutedBySystem
          ? 'bg-gradient-to-r from-red-950/80 via-black to-red-950/80 border-red-500/60 ring-2 ring-red-500/30'
          : 'bg-gradient-to-r from-[#170826] via-black to-[#170826] border-emerald-500/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Status Message */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0 ${
              isVoiceMutedBySystem
                ? 'bg-red-600/30 text-red-400 border border-red-500/50 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}>
              {isVoiceMutedBySystem ? <VolumeX className="w-5 h-5 text-red-400" /> : <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  {isVoiceMutedBySystem
                    ? '🔴 انطفأت المحادثة الصوتية للجميع تلقائياً (هدوء تام على المسرح)'
                    : '🟢 المحادثة الصوتية نشطة ومفتوحة للجميع'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isVoiceMutedBySystem
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isVoiceMutedBySystem ? 'كتم عام' : 'مباشر 🎙️'}
                </span>
              </div>
              <p className="text-[11px] text-purple-200/90 leading-tight mt-0.5">
                {isVoiceMutedBySystem
                  ? `المايكروفونات مقفلة حتى ينتهي ${activePlayer.name} من تقليد الصوت، وسترجع فوراً بعده!`
                  : 'تحدثوا وتناقشوا بحرية وشاركوا الضحك أثناء الاستماع والتقييم!'}
              </p>
            </div>
          </div>

          {/* User Mic Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={isVoiceMutedBySystem}
              onClick={() => {
                sound.playClick();
                setMyMicEnabled(!myMicEnabled);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                isVoiceMutedBySystem
                  ? 'bg-red-950/60 text-red-300 border border-red-700/50 opacity-60 cursor-not-allowed'
                  : myMicEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
              }`}
            >
              {isVoiceMutedBySystem ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>مكتوم بالنظام 🔇</span>
                </>
              ) : myMicEnabled ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-white" />
                  <span>مايكك شغال ✓</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>مايكك مكتوم</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Room Participants Voice Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-purple-900/40 scrollbar-none">
          {players.map((p) => {
            const isMimicker = p.id === activePlayer.id;
            const isTalking = !isVoiceMutedBySystem && !!simulatedTalkingMap[p.id];

            return (
              <div
                key={p.id}
                className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  isMimicker && stage === 'mimicking'
                    ? 'bg-pink-600/30 border-pink-400 text-pink-200 ring-2 ring-pink-400/50 scale-105 animate-pulse'
                    : isVoiceMutedBySystem
                    ? 'bg-black/40 border-purple-900/30 text-gray-500 opacity-60'
                    : isTalking
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-400/30'
                    : 'bg-black/30 border-purple-800/30 text-purple-200'
                }`}
              >
                <span className="text-sm">{p.avatar || '👤'}</span>
                <span className="truncate max-w-[90px]">{p.name}</span>

                {/* Mic Status Icon */}
                {isMimicker && stage === 'mimicking' ? (
                  <span className="text-[10px] text-pink-300 font-mono flex items-center gap-0.5">
                    <Mic className="w-3 h-3 text-pink-400 animate-bounce" />
                    <span>يقلد الآن</span>
                  </span>
                ) : isVoiceMutedBySystem ? (
                  <MicOff className="w-3 h-3 text-red-400" />
                ) : isTalking ? (
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                ) : (
                  <Mic className="w-3 h-3 text-purple-400 opacity-60" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Game Stage */}
      {stage !== 'match_over' ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170524] border-2 border-pink-500/50 shadow-2xl space-y-6 text-center">
          {/* Active Player Card */}
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{activePlayer?.avatar || '🔥'}</span>
              <div className="text-right">
                <div className="text-xs text-pink-400 font-bold">اللاعب على المسرح:</div>
                <div className="text-lg font-black text-white">{activePlayer?.name}</div>
              </div>
            </div>

            <div className="text-xs font-black text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/50">
              الجولة {currentRound} · الدور {activePlayerIdx + 1} من {players.length}
            </div>
          </div>

          {/* Sound Card Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/60 to-black border-2 border-pink-500/40 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-bold">
              {currentSound.category}
            </div>

            <div className="text-3xl font-black text-pink-300">{currentSound.audioClipText}</div>
            <h3 className="text-2xl font-black text-white">{currentSound.title}</h3>
            <p className="text-xs text-purple-200 leading-relaxed max-w-md mx-auto">{currentSound.description}</p>

            {/* Visual audio sound bars */}
            <div className="flex justify-center items-center gap-1.5 py-2">
              {[40, 70, 95, 60, 85, 45, 90, 75, 55, 80, 65, 95].map((h, i) => (
                <div
                  key={i}
                  style={{ height: isPlayingDemo ? `${h}%` : '20%' }}
                  className={`w-1.5 sm:w-2 rounded-full transition-all duration-150 ${
                    isPlayingDemo ? 'bg-pink-400 shadow-md shadow-pink-500/50' : 'bg-purple-900/50'
                  }`}
                />
              ))}
            </div>

            {/* Listen Demo Button */}
            <div className="flex justify-center gap-3 pt-2">
              <button
                disabled={isPlayingDemo || stage === 'mimicking'}
                onClick={handlePlayDemo}
                className="px-6 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-pink-400" />
                <span>{isPlayingDemo ? 'جاري الاستماع...' : 'استمع للصوت الأصلي 🔊'}</span>
              </button>
            </div>
          </div>

          {/* ================= STEP 1: DEMO LISTEN ================= */}
          {stage === 'demo_listen' && (
            <div className="space-y-4 pt-2">
              <button
                onClick={handleStartCountdown}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 text-white font-black text-base shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                <span>جاهز للتقليد! ابدأ العد التنازلي ➔</span>
              </button>
            </div>
          )}

          {/* ================= STEP 2: COUNTDOWN ================= */}
          {stage === 'countdown' && (
            <div className="py-6 space-y-3 animate-in zoom-in-95">
              <div className="text-7xl font-black text-pink-400 animate-bounce">{countdownNum}</div>
              <div className="text-sm text-red-300 font-black animate-pulse">
                انطفأت المحادثة الصوتية.. هدوء للجميع! 🤫
              </div>
            </div>
          )}

          {/* ================= STEP 3: MIMICKING NOW ================= */}
          {stage === 'mimicking' && (
            <div className="py-6 space-y-4 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 text-white font-black text-sm shadow-xl shadow-red-600/50 animate-pulse">
                <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                <span>المايك مفتوح لـ {activePlayer.name} فقط.. قلّد الصوت الآن!</span>
              </div>
              <div className="text-5xl font-mono font-black text-white">{mimicTimer}s</div>
              <p className="text-xs text-red-300/80">المحادثة الصوتية مقفلة تلقائياً حتى ينتهي الوقت</p>
            </div>
          )}

          {/* ================= STEP 4: VOTING / RATING ================= */}
          {stage === 'voting' && (
            <div className="p-6 rounded-3xl bg-black/60 border border-purple-800/50 space-y-5 animate-in zoom-in-95">
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>عادت المحادثة الصوتية للجميع! تناقشوا وقيموا أداء ({activePlayer.name}) 🗣️</span>
              </div>

              <h4 className="text-base font-black text-white">قيّم أداء ({activePlayer.name}) من 0 إلى 100:</h4>

              <div className="space-y-2">
                <div className="text-4xl font-mono font-black text-pink-400">{myRating} / 100</div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={myRating}
                  onChange={e => setMyRating(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-2 bg-purple-950 rounded-lg"
                />
              </div>

              <div className="flex justify-center gap-2 flex-wrap">
                {[
                  { val: 20, label: 'ما جابها 😂' },
                  { val: 50, label: 'نص ونص' },
                  { val: 80, label: 'قريب جداً 🔥' },
                  { val: 100, label: 'نسخة طبق الأصل! 👑' }
                ].map(b => (
                  <button
                    key={b.val}
                    onClick={() => setMyRating(b.val)}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 border border-purple-700/60 text-[11px] font-bold text-purple-200 cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmitRating}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm shadow-lg shadow-pink-500/25 cursor-pointer"
              >
                اعتماد التقييم وحساب النقاط ➔
              </button>
            </div>
          )}

          {/* ================= STEP 5: TURN SCORE REVEAL ================= */}
          {stage === 'turn_score' && (
            <div className="p-6 rounded-3xl bg-black/60 border border-purple-800/50 space-y-4 animate-in zoom-in-95">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
              <h4 className="text-xl font-black text-white">نتيجة تقليد {activePlayer.name}:</h4>
              <div className="text-4xl font-mono font-black text-emerald-400">+{myRating} نقطة</div>

              <button
                onClick={handleNextTurn}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg shadow-amber-500/30 cursor-pointer"
              >
                الدور التالي ➔
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= MATCH OVER / LEADERBOARD ================= */
        <div className="p-8 rounded-3xl bg-[#14041e] border-2 border-yellow-400 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black text-white">انتهت مسابقة تقليد الأصوات!</h2>
          <div className="text-xs text-purple-300 font-bold">لوحة صدارة مقلدي الأصوات والميمز</div>

          <div className="max-w-md mx-auto space-y-2">
            {players
              .slice()
              .sort((a, b) => (playerScores[b.id] || 0) - (playerScores[a.id] || 0))
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-black ${
                    idx === 0 ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300' : 'bg-black/40 border-purple-900/40 text-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                    <span>{p.name}</span>
                  </div>
                  <span className="font-mono text-sm">{playerScores[p.id] || 0} نقطة</span>
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
