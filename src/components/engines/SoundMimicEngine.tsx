import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Trophy, Clock, Star, Play, Award, RotateCcw, ArrowRight, Activity, Users, ThumbsUp, Sparkles, Radio, MessageSquare, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { sound } from '../../services/soundFx';
import confetti from 'canvas-confetti';
import { Player } from '../../types/game';
import { MIMIC_SOUNDS_BANK, MimicSoundItem } from '../../data/mimicSoundsBank';

interface SoundMimicEngineProps {
  mode: 'online' | 'offline';
  players: Player[];
  onlineRoomData?: any;
  myPlayerId?: string;
  socket?: any;
  onOnlineScore?: (score: number) => void;
  onExit: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const SoundMimicEngine: React.FC<SoundMimicEngineProps> = ({
  mode,
  players: initialPlayers,
  onlineRoomData,
  myPlayerId,
  socket,
  onOnlineScore,
  onExit
}) => {
  // Roster setup for offline or passed players
  const [activePlayers, setActivePlayers] = useState<Player[]>(() => {
    if (initialPlayers && initialPlayers.length >= 2) {
      return initialPlayers;
    }
    const savedName = (typeof window !== 'undefined' ? localStorage.getItem('jamr_player_name') : '') || '';
    if (savedName.trim()) {
      return [{ id: 'p1', name: savedName.trim(), avatar: '🔥', score: 0 }];
    }
    return [];
  });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isGameStarted, setIsGameStarted] = useState<boolean>(() => {
    return initialPlayers && initialPlayers.length >= 2;
  });

  // Sounds Library
  const [soundsList, setSoundsList] = useState<MimicSoundItem[]>(MIMIC_SOUNDS_BANK);
  const [currentSound, setCurrentSound] = useState<MimicSoundItem>(MIMIC_SOUNDS_BANK[0]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Match State
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = Math.max(3, activePlayers.length || 3);
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);

  // Turn Stages: 'demo_listen' -> 'countdown' -> 'mimicking' -> 'voting' -> 'turn_score' -> 'match_over'
  const [stage, setStage] = useState<'demo_listen' | 'countdown' | 'mimicking' | 'voting' | 'turn_score' | 'match_over'>('demo_listen');
  const [countdownNum, setCountdownNum] = useState(3);
  const [mimicTimer, setMimicTimer] = useState(6);

  // Voting & Scoring
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [myRating, setMyRating] = useState(75);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});

  // Voice Chat Real WebRTC State
  const [myMicEnabled, setMyMicEnabled] = useState(true);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakingLevels, setSpeakingLevels] = useState<Record<string, number>>({}); // 0 to 100

  // System Mute Rule: Mute everyone during countdown & mimicking
  const isVoiceMutedBySystem = stage === 'countdown' || stage === 'mimicking';
  const prevMuteRef = useRef(isVoiceMutedBySystem);

  // WebRTC References
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const analyserMapRef = useRef<Map<string, AnalyserNode>>(new Map());

  // Effective current player ID
  const effectiveMyPlayerId = myPlayerId || (activePlayers[0]?.id ?? 'me');

  // Load latest mimic sounds from API
  useEffect(() => {
    fetch('/api/mimic/sounds')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.sounds) && data.sounds.length > 0) {
          setSoundsList(data.sounds);
          setCurrentSound(data.sounds[0]);
        }
      })
      .catch(() => {
        // Fall back to default sounds bank
      });
  }, []);

  // Sync players prop if updated externally
  useEffect(() => {
    if (initialPlayers && initialPlayers.length >= 2) {
      setActivePlayers(initialPlayers);
      setIsGameStarted(true);
    }
  }, [initialPlayers]);

  // Request real microphone on mount
  useEffect(() => {
    let isCancelled = false;

    async function initMicrophone() {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          setMicError('المتصفح لا يدعم الوصول المباشر للمايكروفون');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setMicPermissionGranted(true);
        setMicError(null);

        // Setup Audio Analyser for local voice metering
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserMapRef.current.set(effectiveMyPlayerId, analyser);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setMicPermissionGranted(false);
          setMicError('المايكروفون غير مفعل أو تم رفض الإذن. يمكنك التفعيل للمشاركة بالصوت.');
        }
      }
    }

    initMicrophone();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      remoteAudioElementsRef.current.forEach(audio => {
        audio.pause();
        audio.srcObject = null;
      });
      remoteAudioElementsRef.current.clear();
    };
  }, [effectiveMyPlayerId]);

  // Handle System Auto-Mute & User Toggle
  useEffect(() => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    const shouldLocalTrackBeActive = myMicEnabled && !isVoiceMutedBySystem;

    audioTracks.forEach(track => {
      track.enabled = shouldLocalTrackBeActive;
    });

    // Mute/Unmute all remote peer audio elements during mimic countdown & turn
    remoteAudioElementsRef.current.forEach(audioEl => {
      audioEl.muted = isVoiceMutedBySystem;
    });

    // Sound alerts when transition occurs
    if (prevMuteRef.current !== isVoiceMutedBySystem) {
      if (isVoiceMutedBySystem) {
        sound.playWrong(); // alert that voice chat is shut down
      } else {
        sound.playTileSelect(); // celebratory ping that voice chat is restored!
      }
      prevMuteRef.current = isVoiceMutedBySystem;
    }
  }, [isVoiceMutedBySystem, myMicEnabled]);

  // Monitor speaking volume in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      if (isVoiceMutedBySystem) {
        setSpeakingLevels({});
        return;
      }

      const levels: Record<string, number> = {};
      const dataArray = new Uint8Array(128);

      analyserMapRef.current.forEach((analyser, pId) => {
        try {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale to 0-100 with threshold
          const level = avg > 12 ? Math.min(100, Math.round((avg - 12) * 2.5)) : 0;
          levels[pId] = level;
        } catch {}
      });

      setSpeakingLevels(levels);
    }, 120);

    return () => clearInterval(interval);
  }, [isVoiceMutedBySystem]);

  // WebRTC Mesh with Socket Signaling
  useEffect(() => {
    if (!socket || mode !== 'online') return;

    // Helper to create or retrieve peer connection
    const getOrCreatePeerConnection = (targetPlayerId: string): RTCPeerConnection => {
      let pc = peerConnectionsRef.current.get(targetPlayerId);
      if (pc && pc.connectionState !== 'closed' && pc.connectionState !== 'failed') {
        return pc;
      }

      pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(targetPlayerId, pc);

      // Add local audio tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc?.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.send({
            type: 'voice_signal',
            toPlayerId: targetPlayerId,
            signal: { candidate: event.candidate }
          });
        }
      };

      // Handle remote incoming audio track
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        let audioEl = remoteAudioElementsRef.current.get(targetPlayerId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.setAttribute('playsinline', 'true');
          document.body.appendChild(audioEl);
          remoteAudioElementsRef.current.set(targetPlayerId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.muted = isVoiceMutedBySystem;

        // Route remote stream to AudioContext analyser to detect their volume!
        try {
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            const source = audioContextRef.current.createMediaStreamSource(remoteStream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserMapRef.current.set(targetPlayerId, analyser);
          }
        } catch {}
      };

      return pc;
    };

    // Initiate offers to peers with higher ID to avoid double-offer collisions
    activePlayers.forEach(p => {
      if (p.id !== effectiveMyPlayerId && effectiveMyPlayerId > p.id) {
        const pc = getOrCreatePeerConnection(p.id);
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.send({
              type: 'voice_signal',
              toPlayerId: p.id,
              signal: { sdp: pc.localDescription }
            });
          })
          .catch(() => {});
      }
    });

    // Subscribe to incoming voice signals
    const unsubscribe = socket.subscribe(async (msg: any) => {
      if (msg.type !== 'voice_signal') return;
      const { fromPlayerId, signal } = msg;
      if (!fromPlayerId || fromPlayerId === effectiveMyPlayerId) return;

      const pc = getOrCreatePeerConnection(fromPlayerId);

      try {
        if (signal?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send({
              type: 'voice_signal',
              toPlayerId: fromPlayerId,
              signal: { sdp: pc.localDescription }
            });
          }
        } else if (signal?.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (e) {
        console.error('WebRTC signal handling error:', e);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [socket, mode, activePlayers, effectiveMyPlayerId, isVoiceMutedBySystem]);

  // Pick random sound per turn
  useEffect(() => {
    if (!isGameStarted || soundsList.length === 0) return;
    const s = soundsList[Math.floor(Math.random() * soundsList.length)] || soundsList[0];
    setCurrentSound(s);
    setStage('demo_listen');
    setCountdownNum(3);
    setRatings({});
    setMyRating(75);
  }, [activePlayerIdx, currentRound, isGameStarted, soundsList]);

  // Play Authentic Demo Audio (Real Audio URL or Rich Synth Sound)
  const handlePlayDemo = () => {
    setIsPlayingDemo(true);

    if (currentSound.audioUrl) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(currentSound.audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlayingDemo(false);
      audio.onerror = () => {
        // Fallback to synthesized meme sound
        sound.playMemeSound(currentSound.soundType);
        setTimeout(() => setIsPlayingDemo(false), 2500);
      };
      audio.play().catch(() => {
        sound.playMemeSound(currentSound.soundType);
        setTimeout(() => setIsPlayingDemo(false), 2500);
      });
    } else {
      sound.playMemeSound(currentSound.soundType);
      setTimeout(() => {
        setIsPlayingDemo(false);
      }, (currentSound.targetDurationSec || 3) * 1000);
    }
  };

  // Turn Flow
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
    const duration = currentSound.targetDurationSec || 5;
    setMimicTimer(duration);

    let t = duration;
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

  const handleSubmitRating = () => {
    sound.playClick();
    const currPlayer = activePlayers[activePlayerIdx] || activePlayers[0];
    const newRatings = { ...ratings, [effectiveMyPlayerId]: myRating };
    setRatings(newRatings);

    const scoreVals = Object.values(newRatings);
    const avg = Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length);

    setPlayerScores(prev => ({
      ...prev,
      [currPlayer.id]: (prev[currPlayer.id] || 0) + avg
    }));

    if (onOnlineScore) {
      onOnlineScore(avg);
    }

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
    if (activePlayerIdx + 1 < activePlayers.length) {
      setActivePlayerIdx(i => i + 1);
    } else if (currentRound < totalRounds) {
      setCurrentRound(r => r + 1);
      setActivePlayerIdx(0);
    } else {
      sound.playVictory();
      setStage('match_over');
    }
  };

  // Offline player roster helpers
  const handleAddPlayer = () => {
    const clean = newPlayerName.trim();
    if (!clean) return;
    if (activePlayers.some(p => p.name.trim().toLowerCase() === clean.toLowerCase())) {
      alert('الاسم مضاف مسبقاً!');
      return;
    }
    sound.playClick();
    const avatars = ['🔥', '⚡', '👑', '💎', '🎯', '🌟', '🚀', '🦁', '🦊', '🎨'];
    const av = avatars[activePlayers.length % avatars.length];
    setActivePlayers(prev => [...prev, { id: 'p_' + Date.now(), name: clean, avatar: av, score: 0 }]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    sound.playClick();
    setActivePlayers(prev => prev.filter(p => p.id !== id));
  };

  const activePlayer = activePlayers[activePlayerIdx] || activePlayers[0] || { name: 'المقلد', avatar: '🎙️', id: 'p1' };

  // =========================================================================
  // VIEW: OFFLINE PRE-GAME ROSTER SELECTION (NO FAKE NAMES)
  // =========================================================================
  if (!isGameStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-[#160624] border-2 border-pink-500/50 rounded-3xl space-y-6 text-right select-none shadow-2xl">
        <div className="flex items-center justify-between border-b border-purple-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-2xl">
              🎙️
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إعداد لاعبي تقليد الأصوات</h2>
              <p className="text-xs text-pink-300">أضف أسماء أصدقائك الحقيقيين للبدء (لاعبين على الأقل)</p>
            </div>
          </div>
          <button onClick={onExit} className="text-xs text-purple-400 hover:text-white cursor-pointer underline">
            خروج
          </button>
        </div>

        {/* Add Player Input */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-purple-200">أضف لاعب جديد:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPlayer(); }}
              placeholder="اكتب اسم اللاعب (مثلاً: فهد)..."
              maxLength={18}
              className="flex-1 bg-black/60 border border-purple-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-500 disabled:opacity-40 hover:from-pink-400 hover:to-orange-400 text-white font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة</span>
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
            <span>اللاعبون المسجلون ({activePlayers.length}/2 كحد أدنى):</span>
            {activePlayers.length < 2 && (
              <span className="text-amber-400 text-[11px] font-medium">يلزم إضافة {2 - activePlayers.length} لاعب إضافي للبدء</span>
            )}
          </div>

          {activePlayers.length === 0 ? (
            <div className="p-8 text-center text-purple-400/60 border-2 border-dashed border-purple-900/50 rounded-2xl text-xs">
              لم تتم إضافة أي لاعب بعد. اكتب الاسم واضغط إضافة!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activePlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-black/40 border border-purple-800/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{p.avatar || '👤'}</span>
                    <div>
                      <div className="text-sm font-black text-white">{p.name}</div>
                      <div className="text-[10px] text-pink-300">اللاعب #{idx + 1}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(p.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Game Button */}
        <button
          onClick={() => {
            sound.playVictory();
            setIsGameStarted(true);
          }}
          disabled={activePlayers.length < 2}
          className="w-full py-4 rounded-2xl font-black text-base shadow-xl transition-all cursor-pointer bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:scale-[1.01] text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {activePlayers.length >= 2 ? 'ابدأ تحدي تقليد الأصوات 🎙️🔥' : `أضف لاعباً آخر للبدء (${activePlayers.length}/2)`}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 text-right pb-14 font-sans select-none">
      
      {/* Top Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#2a0c3a] via-[#160620] to-[#260934] border-2 border-pink-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-2xl">
            🎙️
          </div>
          <div>
            <div className="text-sm font-black text-white">تقليد الأصوات الحقيقي (ميميك بارتي)</div>
            <div className="text-xs text-pink-300 font-bold">دردشة صوتية مباشرة وأصوات حقيقية مع هدوء تام عند التقليد!</div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
        >
          خروج للقائمة
        </button>
      </div>

      {/* Mic error / warning banner if permissions denied */}
      {micError && (
        <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REAL VOICE CHAT BAR (محادثة صوتية حقيقية تنطفئ أثناء التقليد وترجع بعده)  */}
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
                    : '🟢 المحادثة الصوتية الحقيقية نشطة ومفتوحة للجميع'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isVoiceMutedBySystem
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isVoiceMutedBySystem ? 'كتم عام' : 'مباشر صوتياً 🎙️'}
                </span>
              </div>
              <p className="text-[11px] text-purple-200/90 leading-tight mt-0.5">
                {isVoiceMutedBySystem
                  ? `المايكروفونات مغلقة حتى ينتهي ${activePlayer.name} من تقليد الصوت، وسترجع فوراً بعده!`
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

        {/* Room Participants Voice Strip with Real Volume Meters */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-purple-900/40 scrollbar-none">
          {activePlayers.map((p) => {
            const isMimicker = p.id === activePlayer.id;
            const volumeLevel = speakingLevels[p.id] || 0;
            const isTalking = !isVoiceMutedBySystem && volumeLevel > 15;

            return (
              <div
                key={p.id}
                className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                  isMimicker && stage === 'mimicking'
                    ? 'bg-pink-600/30 border-pink-400 text-pink-200 ring-2 ring-pink-400/50 scale-105 animate-pulse'
                    : isVoiceMutedBySystem
                    ? 'bg-black/40 border-purple-900/30 text-gray-500 opacity-60'
                    : isTalking
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
                    : 'bg-black/30 border-purple-800/30 text-purple-200'
                }`}
              >
                <span className="text-sm">{p.avatar || '👤'}</span>
                <span className="truncate max-w-[90px]">{p.name}</span>

                {/* Real Sound Wave / Mic Status */}
                {isMimicker && stage === 'mimicking' ? (
                  <span className="text-[10px] text-pink-300 font-mono flex items-center gap-0.5">
                    <Mic className="w-3 h-3 text-pink-400 animate-bounce" />
                    <span>يقلد الآن</span>
                  </span>
                ) : isVoiceMutedBySystem ? (
                  <MicOff className="w-3 h-3 text-red-400" />
                ) : isTalking ? (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-emerald-300 rounded-full animate-bounce" />
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  </div>
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
              الجولة {currentRound} · الدور {activePlayerIdx + 1} من {activePlayers.length}
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
                className="px-6 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-transform active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-pink-400" />
                <span>{isPlayingDemo ? 'جاري تشغيل الصوت الأصلي...' : 'استمع للصوت الأصلي 🔊'}</span>
              </button>
            </div>
          </div>

          {/* ================= STEP 1: DEMO LISTEN ================= */}
          {stage === 'demo_listen' && (
            <div className="space-y-4 pt-2">
              <button
                onClick={handleStartCountdown}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 text-white font-black text-base shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
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
            {activePlayers
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
