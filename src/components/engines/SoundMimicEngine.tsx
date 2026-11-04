import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Trophy, Clock, Star, Play, Award, RotateCcw, ArrowRight, Activity, Users, ThumbsUp, Sparkles } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto space-y-6 text-right pb-12">
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
          خروج
        </button>
      </div>

      {/* Main Game Stage */}
      {stage !== 'match_over' ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170524] border-2 border-pink-500/50 shadow-2xl space-y-6 text-center">
          {/* Active Player Card */}
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activePlayer?.avatar || '🔥'}</span>
              <div className="text-right">
                <div className="text-[10px] text-pink-400 font-bold">اللاعب على المسرح:</div>
                <div className="text-base font-black text-white">{activePlayer?.name}</div>
              </div>
            </div>

            <div className="text-xs font-black text-purple-300">
              الجولة {currentRound} · الدور {activePlayerIdx + 1} من {players.length}
            </div>
          </div>

          {/* Sound Card Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/60 to-black border-2 border-pink-500/40 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-bold">
              {currentSound.category}
            </div>
            <h3 className="text-2xl font-black text-white">{currentSound.title}</h3>
            <p className="text-xs text-purple-300 leading-relaxed max-w-md mx-auto">{currentSound.description}</p>

            <div className="text-lg font-mono font-black text-amber-400 bg-black/40 py-2.5 px-4 rounded-2xl border border-amber-500/30 inline-block">
              "{currentSound.audioClipText}"
            </div>

            {/* Audio Wave Visualizer Simulation */}
            <div className="flex items-center justify-center gap-1.5 h-12 py-2">
              {[40, 75, 20, 90, 60, 100, 45, 80, 30, 95, 50, 85].map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isPlayingDemo || stage === 'mimicking' ? 'bg-pink-500 animate-pulse' : 'bg-purple-900/60'
                  }`}
                  style={{
                    height: isPlayingDemo || stage === 'mimicking' ? `${h}%` : '20%'
                  }}
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
            <div className="py-6 space-y-2 animate-in zoom-in-95">
              <div className="text-6xl font-black text-pink-400 animate-bounce">{countdownNum}</div>
              <div className="text-xs text-purple-300 font-bold">استعد للتقليد الآن!</div>
            </div>
          )}

          {/* ================= STEP 3: MIMICKING NOW ================= */}
          {stage === 'mimicking' && (
            <div className="py-6 space-y-3 animate-in fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 text-white font-black text-xs animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>المايك مفتوح.. قلّد الصوت الآن!</span>
              </div>
              <div className="text-4xl font-mono font-black text-white">{mimicTimer}s</div>
            </div>
          )}

          {/* ================= STEP 4: VOTING / RATING ================= */}
          {stage === 'voting' && (
            <div className="p-6 rounded-3xl bg-black/60 border border-purple-800/50 space-y-5 animate-in zoom-in-95">
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

              <div className="flex justify-center gap-2">
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
