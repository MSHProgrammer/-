import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Moon, Sun, Skull, HeartPulse, Search, Vote, Trophy, Clock, ArrowRight, RotateCcw, AlertTriangle, Users } from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { Player } from '../../types/game';

interface MafiaNoHakamEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  onlineRoomData?: any;
  onOnlineAction?: (action: string, payload: any) => void;
  onExit: () => void;
}

export type MafiaRole = 'mafia' | 'citizen' | 'doctor' | 'detective';

interface MafiaPlayer {
  id: string;
  name: string;
  avatar: string;
  role: MafiaRole;
  isAlive: boolean;
  votesAgainst: number;
}

export const MafiaNoHakamEngine: React.FC<MafiaNoHakamEngineProps> = ({
  mode,
  players,
  onlineRoomData,
  onOnlineAction,
  onExit
}) => {
  // Offline Setup / Match State
  const [phase, setPhase] = useState<'role_reveal' | 'night' | 'day_announcement' | 'day_discussion' | 'day_voting' | 'game_over'>('role_reveal');
  const [mafiaRoster, setMafiaRoster] = useState<MafiaPlayer[]>([]);
  const [currentRevealIdx, setCurrentRevealIdx] = useState(0);
  const [cardRevealed, setCardRevealed] = useState(false);

  // Night State
  const [nightTargetId, setNightTargetId] = useState<string | null>(null);
  const [doctorSaveId, setDoctorSaveId] = useState<string | null>(null);
  const [detectiveCheckId, setDetectiveCheckId] = useState<string | null>(null);
  const [detectiveResult, setDetectiveResult] = useState<string | null>(null);
  const [lastNightVictim, setLastNightVictim] = useState<MafiaPlayer | null>(null);
  const [doctorSavedSomeone, setDoctorSavedSomeone] = useState(false);

  // Discussion & Voting
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [votes, setVotes] = useState<Record<string, string>>({}); // voterId -> targetId
  const [eliminatedPlayer, setEliminatedPlayer] = useState<MafiaPlayer | null>(null);
  const [winner, setWinner] = useState<'citizens' | 'mafia' | null>(null);

  // Initialize Roles
  useEffect(() => {
    const list: MafiaPlayer[] = players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      role: 'citizen',
      isAlive: true,
      votesAgainst: 0
    }));

    // Assign roles:
    // 3-5 players: 1 mafia, 1 doctor, rest citizens
    // 6-8 players: 2 mafia, 1 doctor, 1 detective, rest citizens
    // 9+ players: 3 mafia, 1 doctor, 1 detective, rest citizens
    const count = list.length;
    const mafiaCount = count >= 9 ? 3 : count >= 6 ? 2 : 1;

    const indices = Array.from({ length: count }, (_, i) => i).sort(() => 0.5 - Math.random());

    for (let i = 0; i < mafiaCount; i++) {
      list[indices[i]].role = 'mafia';
    }
    if (indices[mafiaCount] !== undefined) {
      list[indices[mafiaCount]].role = 'doctor';
    }
    if (indices[mafiaCount + 1] !== undefined) {
      list[indices[mafiaCount + 1]].role = 'detective';
    }

    setMafiaRoster(list);
    setCurrentRevealIdx(0);
    setCardRevealed(false);
    setPhase('role_reveal');
  }, [players]);

  // Timer countdown for discussion
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            if (phase === 'day_discussion') {
              startVoting();
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

  const handleStartNight = () => {
    sound.playNight();
    setPhase('night');
    setNightTargetId(null);
    setDoctorSaveId(null);
    setDetectiveCheckId(null);
    setDetectiveResult(null);
  };

  const handleResolveNight = () => {
    sound.playGong();

    let victim: MafiaPlayer | null = null;
    let saved = false;

    if (nightTargetId) {
      if (nightTargetId === doctorSaveId) {
        saved = true;
      } else {
        victim = mafiaRoster.find(p => p.id === nightTargetId) || null;
      }
    }

    setDoctorSavedSomeone(saved);
    setLastNightVictim(victim);

    if (victim) {
      setMafiaRoster(prev => prev.map(p => p.id === victim!.id ? { ...p, isAlive: false } : p));
    }

    // Check win condition right after night
    checkWinCondition(victim ? victim.id : undefined);

    setPhase('day_announcement');
  };

  const startDiscussion = () => {
    sound.playClick();
    setPhase('day_discussion');
    setTimerSeconds(60);
    setTimerRunning(true);
  };

  const startVoting = () => {
    sound.playClick();
    setPhase('day_voting');
    setVotes({});
  };

  const handleCastVote = (voterId: string, targetId: string) => {
    sound.playClick();
    const newVotes = { ...votes, [voterId]: targetId };
    setVotes(newVotes);

    const alivePlayers = mafiaRoster.filter(p => p.isAlive);
    if (Object.keys(newVotes).length >= alivePlayers.length) {
      // All alive voted, tally votes
      tallyVotes(newVotes);
    }
  };

  const tallyVotes = (currentVotes: Record<string, string>) => {
    sound.playGong();
    const counts: Record<string, number> = {};
    Object.values(currentVotes).forEach(tid => {
      counts[tid] = (counts[tid] || 0) + 1;
    });

    let maxV = 0;
    let accusedId = '';
    for (const [tid, cnt] of Object.entries(counts)) {
      if (cnt > maxV) {
        maxV = cnt;
        accusedId = tid;
      }
    }

    const accused = mafiaRoster.find(p => p.id === accusedId);
    if (accused) {
      setEliminatedPlayer(accused);
      setMafiaRoster(prev => prev.map(p => p.id === accused.id ? { ...p, isAlive: false } : p));
      checkWinCondition(accused.id);
    } else {
      setEliminatedPlayer(null);
    }
  };

  const checkWinCondition = (justDiedId?: string) => {
    const updated = mafiaRoster.map(p => p.id === justDiedId ? { ...p, isAlive: false } : p);
    const aliveMafia = updated.filter(p => p.isAlive && p.role === 'mafia').length;
    const aliveCitizens = updated.filter(p => p.isAlive && p.role !== 'mafia').length;

    if (aliveMafia === 0) {
      setWinner('citizens');
      setPhase('game_over');
      sound.playVictory();
      confetti({ particleCount: 100, spread: 80 });
    } else if (aliveMafia >= aliveCitizens) {
      setWinner('mafia');
      setPhase('game_over');
      sound.playGong();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 text-right">
      {/* Header Info Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#1f092b] via-[#12051a] to-[#24082c] border-2 border-red-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-2xl">
            🕵️
          </div>
          <div>
            <div className="text-sm font-black text-white">مافيا بدون حَكَم (الراوي الآلي)</div>
            <div className="text-xs text-red-300 font-bold">الحكم الذكي يدير كل الجولات والأدوار</div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
        >
          الخروج للقائمة الرئيسية
        </button>
      </div>

      {/* ================= 1. SECRET ROLE REVEAL ================= */}
      {phase === 'role_reveal' && mafiaRoster[currentRevealIdx] && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#14061e] border-2 border-red-600/40 shadow-2xl text-center space-y-6">
          <div className="text-xs font-black text-red-400">توزيع الكروت السرية ({currentRevealIdx + 1} من {mafiaRoster.length})</div>
          <h2 className="text-2xl font-black text-white">مرر الجهاز إلى: <span className="text-amber-400">{mafiaRoster[currentRevealIdx].name}</span></h2>
          <p className="text-xs text-purple-300">تأكد أن لا أحد ينظر إلى الشاشة ثم اضغط لكشف دورك السري</p>

          <div className="py-6">
            {!cardRevealed ? (
              <button
                onClick={() => {
                  sound.playTileSelect();
                  setCardRevealed(true);
                }}
                className="w-48 h-64 mx-auto rounded-3xl bg-gradient-to-b from-purple-900/60 to-black border-2 border-red-500/50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-105 transition-all shadow-xl"
              >
                <EyeOff className="w-12 h-12 text-red-400 animate-pulse" />
                <span className="text-sm font-black text-red-200">المس هنا لكشف كرتك</span>
              </button>
            ) : (
              <div className="w-56 h-72 mx-auto rounded-3xl bg-gradient-to-b from-red-950 via-[#1c0827] to-black border-2 border-red-500 p-6 flex flex-col items-center justify-center gap-3 shadow-2xl animate-in zoom-in-95">
                <span className="text-5xl">
                  {mafiaRoster[currentRevealIdx].role === 'mafia' && '🕵️'}
                  {mafiaRoster[currentRevealIdx].role === 'doctor' && '🩺'}
                  {mafiaRoster[currentRevealIdx].role === 'detective' && '🔍'}
                  {mafiaRoster[currentRevealIdx].role === 'citizen' && '🕊️'}
                </span>
                <div className="text-xl font-black text-white">
                  {mafiaRoster[currentRevealIdx].role === 'mafia' && 'أنت من أعضاء المافيا!'}
                  {mafiaRoster[currentRevealIdx].role === 'doctor' && 'أنت الطبيب المنقذ!'}
                  {mafiaRoster[currentRevealIdx].role === 'detective' && 'أنت المحقق السري!'}
                  {mafiaRoster[currentRevealIdx].role === 'citizen' && 'أنت مواطن صالح!'}
                </div>
                <p className="text-xs text-purple-200 leading-relaxed text-center">
                  {mafiaRoster[currentRevealIdx].role === 'mafia' && 'تخفَّ بين الصالحين واكذب، واقضِ عليهم في الليل!'}
                  {mafiaRoster[currentRevealIdx].role === 'doctor' && 'أنقذ شخصاً واحداً كل ليلة من غدر المافيا.'}
                  {mafiaRoster[currentRevealIdx].role === 'detective' && 'افحص هوية شخص واحد كل ليلة واكشف هل هو مافيا.'}
                  {mafiaRoster[currentRevealIdx].role === 'citizen' && 'راقب لغة الجسد وكلام الجميع، واكشف المافيا بالتصويت!'}
                </p>
              </div>
            )}
          </div>

          {cardRevealed && (
            <button
              onClick={() => {
                sound.playClick();
                setCardRevealed(false);
                if (currentRevealIdx + 1 < mafiaRoster.length) {
                  setCurrentRevealIdx(i => i + 1);
                } else {
                  handleStartNight();
                }
              }}
              className="px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-lg shadow-red-600/30 cursor-pointer"
            >
              {currentRevealIdx + 1 < mafiaRoster.length ? 'إخفاء وتمرير للاعب التالي ➔' : 'بدء الليل الأول (نامت المدينة) 🌙'}
            </button>
          )}
        </div>
      )}

      {/* ================= 2. NIGHT PHASE (الحكم الآلي) ================= */}
      {phase === 'night' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-black border-2 border-indigo-900/60 shadow-2xl text-center space-y-6">
          <Moon className="w-16 h-16 text-indigo-400 mx-auto animate-pulse" />
          <h2 className="text-2xl font-black text-indigo-200">نامت المدينة وأغمض الجميع أعينهم 🌙</h2>
          <p className="text-xs text-indigo-300/80">الحكم الآلي يدير خطوات الليل في سرية تامة</p>

          <div className="max-w-md mx-auto space-y-4 text-right">
            {/* Step 1: Mafia Action */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-red-400">
                <span>🕵️ اختيار المافيا للضحية:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mafiaRoster.filter(p => p.isAlive).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      sound.playClick();
                      setNightTargetId(p.id);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      nightTargetId === p.id ? 'bg-red-600 text-white border-red-400' : 'bg-black/40 text-purple-300 border-purple-900/40'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Doctor Action */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                <span>🩺 اختيار الطبيب للشخص المراد علاجه:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mafiaRoster.filter(p => p.isAlive).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      sound.playClick();
                      setDoctorSaveId(p.id);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      doctorSaveId === p.id ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-black/40 text-purple-300 border-purple-900/40'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Detective Action */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-blue-400">
                <span>🔍 فحص المحقق السري:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mafiaRoster.filter(p => p.isAlive).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      sound.playClick();
                      setDetectiveCheckId(p.id);
                      setDetectiveResult(p.role === 'mafia' ? 'مافيا ⚠️' : 'مواطن صالح 🕊️');
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      detectiveCheckId === p.id ? 'bg-blue-600 text-white border-blue-400' : 'bg-black/40 text-purple-300 border-purple-900/40'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {detectiveResult && (
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-black text-center">
                  نتيجة فحص المحقق: {detectiveResult}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleResolveNight}
            className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm shadow-xl shadow-orange-500/25 cursor-pointer"
          >
            شروق الشمس وإعلان أحداث الليل ☀️
          </button>
        </div>
      )}

      {/* ================= 3. DAY ANNOUNCEMENT ================= */}
      {phase === 'day_announcement' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170624] border-2 border-amber-500/50 shadow-2xl text-center space-y-6">
          <Sun className="w-16 h-16 text-amber-400 mx-auto animate-spin" style={{ animationDuration: '20s' }} />
          <h2 className="text-2xl font-black text-white">أشرقت الشمس واستيقظت المدينة ☀️</h2>

          <div className="p-6 rounded-2xl bg-black/50 border border-purple-800/40 max-w-md mx-auto space-y-3">
            {lastNightVictim && !doctorSavedSomeone ? (
              <div className="space-y-2">
                <Skull className="w-12 h-12 text-red-500 mx-auto" />
                <div className="text-xl font-black text-red-400">لقد مات {lastNightVictim.name} الليلة الماضية!</div>
                <p className="text-xs text-purple-300">اغتالته المافيا في الظلام وخرج من اللعبة.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <HeartPulse className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-xl font-black text-emerald-400">نجت المدينة ولم يمت أحد!</div>
                <p className="text-xs text-purple-300">تدخل الطبيب في الوقت المناسب وأنقذ المستهدف بنجاح.</p>
              </div>
            )}
          </div>

          <button
            onClick={startDiscussion}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm cursor-pointer shadow-lg shadow-amber-500/30"
          >
            بدء مرحلة النقاش والاتهامات (دقيقة واحدة) ➔
          </button>
        </div>
      )}

      {/* ================= 4. DAY DISCUSSION ================= */}
      {phase === 'day_discussion' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170624] border-2 border-purple-500/50 shadow-2xl space-y-6 text-center">
          <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
            <h3 className="text-lg font-black text-white">مرحلة النقاش والتحقيق الحر</h3>
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-900/40 text-purple-200 border border-purple-700/60 font-mono font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>{timerSeconds}s</span>
            </div>
          </div>

          <p className="text-sm text-purple-200 font-bold leading-relaxed max-w-md mx-auto">
            تناقشوا واكشفوا المريبين! من غير كلامه؟ من ارتبك؟ من يحاول تشتيت الأنظار عن المافيا؟
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto">
            {mafiaRoster.map(p => (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border text-center ${
                  p.isAlive ? 'bg-purple-950/40 border-purple-700/50 text-white' : 'bg-black/60 border-gray-800 text-gray-500 line-through opacity-50'
                }`}
              >
                <div className="text-lg">{p.avatar}</div>
                <div className="text-xs font-bold">{p.name}</div>
                {!p.isAlive && <span className="text-[10px] text-red-400 font-bold">ميت</span>}
              </div>
            ))}
          </div>

          <button
            onClick={startVoting}
            className="w-full max-w-md py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-lg shadow-red-600/30 cursor-pointer"
          >
            الانتقال للتصويت السري على المتهم ➔
          </button>
        </div>
      )}

      {/* ================= 5. DAY VOTING ================= */}
      {phase === 'day_voting' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#170624] border-2 border-red-500/50 shadow-2xl space-y-6 text-center">
          <Vote className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black text-white">جلسة التصويت وطرد المشتبه به</h2>
          <p className="text-xs text-purple-300">صوّت على الشخص الأكثر ريبة لإخراجه من اللعبة وكشف هويته</p>

          <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-right">
            {mafiaRoster.filter(p => p.isAlive).map(target => (
              <button
                key={target.id}
                onClick={() => handleCastVote(players[0]?.id || 'v1', target.id)}
                className="p-3 rounded-2xl bg-gradient-to-b from-purple-900/40 to-black border border-purple-700/50 hover:border-red-500 text-white font-bold text-xs flex items-center justify-between cursor-pointer"
              >
                <span>{target.name}</span>
                <span className="text-sm">{target.avatar}</span>
              </button>
            ))}
          </div>

          {eliminatedPlayer && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/60 max-w-md mx-auto space-y-1">
              <div className="text-xs font-bold text-red-400">قرار الأغلبية:</div>
              <div className="text-lg font-black text-white">تم إعدام {eliminatedPlayer.name}!</div>
              <div className="text-xs text-amber-300 font-bold">
                اتضح أنه: {eliminatedPlayer.role === 'mafia' ? 'عضو مافيا! 🕵️ (انتصار للصالحين)' : 'مواطن بريء! 🕊️ (ضحية سوء الظن)'}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleStartNight}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              حلول الليل التالي 🌙
            </button>
          </div>
        </div>
      )}

      {/* ================= 6. GAME OVER ================= */}
      {phase === 'game_over' && (
        <div className="p-8 rounded-3xl bg-[#14041e] border-2 border-yellow-400 shadow-2xl text-center space-y-6">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
          <h2 className="text-3xl font-black text-white">انتهت اللعبة!</h2>
          <div className="text-2xl font-black text-yellow-300">
            {winner === 'citizens' ? '🎉 انتصر المواطنون الصالحون وتم القضاء على المافيا!' : '😈 فازت المافيا وسيطرت على المدينة!'}
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-black/50 border border-purple-800/40 space-y-2 text-right">
            <div className="text-xs font-bold text-purple-400 mb-2">كشف هويات جميع اللاعبين:</div>
            {mafiaRoster.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-purple-900/30">
                <span className="font-bold text-white">{p.name} ({p.avatar})</span>
                <span className={`font-black ${p.role === 'mafia' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {p.role === 'mafia' ? 'مافيا 🕵️' : p.role === 'doctor' ? 'طبيب 🩺' : p.role === 'detective' ? 'محقق 🔍' : 'مواطن 🕊️'}
                </span>
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
