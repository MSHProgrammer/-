import React, { useState, useEffect } from 'react';
import { Wifi, Copy, Check, Users, Play, Crown, LogOut, MessageSquare, Send, Sparkles, Shield, UserMinus, ArrowLeft, Flame, AlertCircle, PlusCircle, LogIn } from 'lucide-react';
import { socket } from '../services/socketClient';
import { RoomState, Player, GameInfo } from '../types/game';
import { GAMES_CATALOG } from '../data/gamesCatalog';
import { sounds } from '../services/soundEffects';
import { getUserProfile, AVATAR_OPTIONS } from '../services/storage';
import confetti from 'canvas-confetti';

// Import 4 Official Online Engines
import { BarrahSalfaEngine } from './engines/BarrahSalfaEngine';
import { MafiaNoHakamEngine } from './engines/MafiaNoHakamEngine';
import { SoundMimicEngine } from './engines/SoundMimicEngine';
import { BrokenTvEngine } from './engines/BrokenTvEngine';
import { IsmHayawanEngine } from './engines/IsmHayawanEngine';

interface OnlineGameViewProps {
  initialAction?: 'create' | 'join';
  initialRoomCode?: string;
  initialGame?: GameInfo | null;
  defaultPlayerName?: string;
  onExit: () => void;
}

export const OnlineGameView: React.FC<OnlineGameViewProps> = ({
  initialAction = 'create',
  initialRoomCode = '',
  initialGame,
  defaultPlayerName = '',
  onExit
}) => {
  const [isInRoom, setIsInRoom] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Guest Setup Form State: Use single chosen name everywhere
  const profile = getUserProfile();
  const resolvedName = (defaultPlayerName && defaultPlayerName.trim())
    || (typeof window !== 'undefined' ? localStorage.getItem('jamr_player_name') : '')
    || profile.username
    || '';

  const [mode, setMode] = useState<'create' | 'join'>(
    initialAction === 'join' || (initialRoomCode && initialRoomCode.trim().length > 0) ? 'join' : 'create'
  );
  const [playerName, setPlayerName] = useState(resolvedName);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar || '🔥');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [selectedGameId, setSelectedGameId] = useState(initialGame?.id || 'barrah_salfa');
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [ismRounds, setIsmRounds] = useState(5);

  const myPlayerId = socket.getPlayerId();

  // Connect socket and listen to events
  useEffect(() => {
    socket.connect();

    const unsubscribe = socket.subscribe((msg: any) => {
      setIsSubmitting(false);
      if (msg.type === 'joined') {
        setIsInRoom(true);
        setRoom(msg.room);
        setErrorMessage(null);
        sounds.playSpark();
      } else if (msg.type === 'room_state') {
        setRoom(msg.room);
        setIsInRoom(true);
      } else if (msg.type === 'error') {
        setErrorMessage(msg.message);
        sounds.playWrong();
      } else if (msg.type === 'kicked') {
        setErrorMessage(msg.message || 'تم استبعادك من الغرفة');
        setIsInRoom(false);
        setRoom(null);
        sounds.playWrong();
      }
    });

    if (initialAction === 'join' && initialRoomCode) {
      setRoomCodeInput(initialRoomCode);
      setMode('join');
    } else if (initialAction === 'create') {
      setMode('create');
    }

    return () => {
      unsubscribe();
    };
  }, [initialAction, initialRoomCode]);

  // Create Room Trigger
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    sounds.playSpark();
    try {
      await socket.createRoom(playerName.trim(), selectedAvatar, selectedGameId, {
        isJudge,
        totalRounds: ismRounds,
        maxPlayers: selectedGameId === 'ism_hayawan' ? 100 : 16
      });
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'حدث خطأ أثناء إنشاء الغرفة. يرجى إعادة المحاولة.');
    }
  };

  // Join Room Trigger
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCodeInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    sounds.playSpark();
    try {
      await socket.joinRoom(roomCodeInput.trim(), playerName.trim(), selectedAvatar);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'تعذر الاتصال بالغرفة، تأكد من الرمز.');
    }
  };

  // Copy share invite link
  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sounds.playSpark();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Chat message send
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.send({ type: 'send_chat', text: chatInput.trim() });
    setChatInput('');
    sounds.playSpark();
  };

  // Quick Emoji Reactions
  const handleSendEmoji = (emoji: string) => {
    socket.send({ type: 'send_chat', text: emoji });
    sounds.playSpark();
  };

  const handleLeaveRoom = () => {
    socket.leaveRoom();
    setIsInRoom(false);
    setRoom(null);
    onExit();
  };

  const isHost = room?.hostId === myPlayerId;
  const myPlayer = room?.players.find(p => p.id === myPlayerId);
  const activeGameInfo = GAMES_CATALOG.find(g => g.id === room?.gameId) || GAMES_CATALOG[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* ================= ENTRY / GUEST FORM (NOT IN ROOM) ================= */}
      {!isInRoom || !room ? (
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mx-auto">
              <Wifi className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">غرف اللعب أونلاين ⚡</h1>
            <p className="text-xs text-purple-200/70">
              ادخل كضيف بدون تسجيل أو استخدم اسمك ورمزك المفضل
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 space-y-5">
            {/* Player Name */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">اسمك المستعار في الجلسة:</label>
              <input
                type="text"
                maxLength={18}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="مثال: داهية_الليل"
                className="w-full bg-black/50 border border-purple-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-2">اختر صورتك الرمزية:</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => { setSelectedAvatar(av); sounds.playSpark(); }}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                      selectedAvatar === av
                        ? 'bg-orange-500 scale-110 shadow-md shadow-orange-500/30'
                        : 'bg-purple-900/40 hover:bg-purple-800/60'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Selector: Create Room vs Join with Code */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/60 border border-purple-800/60 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setErrorMessage(null);
                  sounds.playSpark();
                }}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'create'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنشاء غرفة جديدة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('join');
                  setErrorMessage(null);
                  sounds.playSpark();
                }}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'join'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>انضمام برمز</span>
              </button>
            </div>

            {/* If Join Mode */}
            {mode === 'join' ? (
              <form onSubmit={handleJoinRoom} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1.5">رمز الغرفة (5 خانات):</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="مثال: JMR29"
                    className="w-full bg-black/50 border border-orange-500/60 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!playerName.trim() || roomCodeInput.trim().length < 4 || isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الاتصال بالغرفة...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>انضمام للغرفة الآن ➔</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Create Room Form */
              <form onSubmit={handleCreateRoom} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1.5">اختر اللعبة الافتتاحية:</label>
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="w-full bg-purple-950/80 border border-purple-700/60 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {GAMES_CATALOG.filter(g => g.supportsOnline).map(g => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({g.categoryLabel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific Options for ism_hayawan */}
                {selectedGameId === 'ism_hayawan' && (
                  <div className="p-3.5 rounded-2xl bg-[#140624] border border-emerald-500/50 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                      <span>عدد الجولات:</span>
                      <span className="text-emerald-400 font-black">{ismRounds} جولات</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={ismRounds}
                      onChange={(e) => setIsmRounds(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />

                    {/* Judge Mode Toggle */}
                    <div
                      onClick={() => setIsJudge(!isJudge)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isJudge ? 'border-amber-400 bg-amber-500/20' : 'border-purple-800/60 bg-black/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">⚖️</span>
                        <div className="text-right">
                          <div className="text-xs font-black text-amber-300">خيار {`{بكون حكم! ⚖️}`}</div>
                          <div className="text-[10px] text-purple-300">تصلك كل الاعتراضات وترى إجابات اللاعبين وتدير النقاط</div>
                        </div>
                      </div>
                      <input type="checkbox" checked={isJudge} onChange={() => {}} className="w-4 h-4 accent-amber-500 pointer-events-none" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!playerName.trim() || isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري إنشاء الغرفة وتجهيز الجلسة...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>إنشاء الغرفة وبدء الدعوة 🔥</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <button
              onClick={onExit}
              className="w-full py-2.5 text-xs text-purple-400 hover:text-white transition-colors"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      ) : (
        /* ================= IN-ROOM ACTIVE EXPERIENCE ================= */
        <div className="space-y-6 animate-in fade-in">
          {/* Top Bar: Room Code & Controls */}
          <div className="rounded-2xl bg-purple-950/50 border border-purple-800/40 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="py-1 px-3 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center gap-2">
                <span className="text-[10px] text-orange-400 font-bold">رمز الغرفة:</span>
                <span className="text-base font-black font-mono tracking-widest text-white">{room?.code}</span>
              </div>

              <button
                onClick={handleCopyLink}
                className="py-1.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-200 text-xs font-bold flex items-center gap-1.5 border border-purple-700/40 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الدعوة'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Chat Drawer Button */}
              <button
                onClick={() => setShowChat(!showChat)}
                className="py-1.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-200 text-xs font-bold flex items-center gap-1.5 border border-purple-700/40 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                <span>الدردشة ({room?.messages.length || 0})</span>
              </button>

              <button
                onClick={() => {
                  socket.leaveRoom();
                  setIsInRoom(false);
                  setRoom(null);
                  onExit();
                }}
                className="py-1.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold flex items-center gap-1.5 border border-red-800/40 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>مغادرة الغرفة</span>
              </button>
            </div>
          </div>

          {/* ================= LOBBY PHASE ================= */}
          {room?.status === 'lobby' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: Players & Game Selection */}
              <div className="md:col-span-2 space-y-6">
                {/* Players Grid */}
                <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-400" />
                      <span>اللاعبون في الغرفة ({room.players.length} / {room.maxPlayers})</span>
                    </h3>
                    <span className="text-xs text-purple-400">
                      {isHost ? 'أنت مضيف الغرفة 👑' : 'بانتظار بدء المضيف'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {room.players.map((p) => {
                      const isMe = p.id === myPlayerId;
                      return (
                        <div
                          key={p.id}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                            isMe ? 'bg-orange-500/10 border-orange-500/50' : 'bg-purple-900/20 border-purple-800/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-2xl">{p.avatar}</span>
                            {p.isHost && (
                              <span title="المضيف">
                                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            <div className="text-xs font-bold text-white truncate">
                              {p.name} {isMe && '(أنت)'}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[10px] text-emerald-300 font-bold">
                                داخل الغرفة
                              </span>
                            </div>
                          </div>

                          {/* Host Controls: Kick player */}
                          {isHost && !isMe && (
                            <button
                              onClick={() => socket.send({ type: 'kick_player', targetPlayerId: p.id })}
                              className="mt-2 text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <UserMinus className="w-3 h-3" />
                              <span>طرد</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Start Game Action (No Ready requirement) */}
                  <div className="pt-2">
                    {/* Host Start Game Trigger */}
                    {isHost ? (
                      <button
                        onClick={() => socket.send({ type: 'start_game' })}
                        disabled={room.players.length < activeGameInfo.minPlayers}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-40 text-white font-black text-sm shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>بدء اللعبة للجميع الآن 🔥</span>
                      </button>
                    ) : (
                      <div className="text-center py-3 px-4 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-xs text-purple-200 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>أنت داخل الغرفة! في انتظار قيام المضيف ببدء المباراة...</span>
                      </div>
                    )}
                  </div>
                  {isHost && room.players.length < activeGameInfo.minPlayers && (
                    <p className="text-[11px] text-amber-400 text-center">
                      تتطلب هذه اللعبة {activeGameInfo.minPlayers} لاعبين على الأقل للبدء.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Col: Active Game Info & Host Game Selector */}
              <div className="space-y-4">
                <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-5 space-y-4">
                  <span className="text-[11px] font-bold text-orange-400 block">اللعبة المختارة للغرفة:</span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{activeGameInfo.title}</h4>
                      <p className="text-xs text-purple-300">{activeGameInfo.categoryLabel}</p>
                    </div>
                  </div>

                  <p className="text-xs text-purple-200/70 leading-relaxed">
                    {activeGameInfo.description}
                  </p>

                  {/* If Host, allow switching game */}
                  {isHost && (
                    <div className="pt-2 border-t border-purple-900/30">
                      <label className="block text-xs font-bold text-purple-300 mb-1.5">تغيير اللعبة:</label>
                      <select
                        value={room.gameId}
                        onChange={(e) => {
                          const g = GAMES_CATALOG.find(x => x.id === e.target.value);
                          socket.send({ type: 'change_game', gameId: e.target.value, gameTitle: g?.title });
                        }}
                        className="w-full bg-purple-950/90 border border-purple-700/60 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {GAMES_CATALOG.filter(g => g.supportsOnline).map(g => (
                          <option key={g.id} value={g.id}>
                            {g.title} ({g.categoryLabel})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ================= ACTIVE GAMEPLAY / ROUNDS ================= */
            <div className="space-y-6">
              {/* Host Control Bar */}
              {isHost && (
                <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-800/30 flex items-center justify-between text-xs">
                  <span className="font-bold text-orange-400">تحكم المضيف:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => socket.send({ type: 'next_round' })}
                      className="px-3 py-1 rounded-lg bg-orange-500 text-white font-bold"
                    >
                      الجولة التالية ➔
                    </button>
                    <button
                      onClick={() => socket.send({ type: 'return_to_lobby' })}
                      className="px-3 py-1 rounded-lg bg-purple-800 text-purple-200 font-bold"
                    >
                      إنهاء والعودة للوبي
                    </button>
                  </div>
                </div>
              )}

              {/* Render Respective Engine in Online Mode */}
              {room.gameId === 'barrah_salfa' && (
                <BarrahSalfaEngine
                  mode="online"
                  players={room.players}
                  currentRound={room.currentRound}
                  totalRounds={room.totalRounds}
                  onlineGameData={room.gameData}
                  onlineStatus={room.status}
                  isHost={isHost}
                  onOnlineVote={(votedPlayerId) => socket.send({ type: 'submit_barrah_vote', votedPlayerId })}
                  onNextRound={() => socket.send({ type: 'next_round' })}
                />
              )}

              {room.gameId === 'mafia_nohakam' && (
                <MafiaNoHakamEngine
                  mode="online"
                  players={room.players}
                  onlineRoomData={room.gameData}
                  onOnlineAction={(action, payload) => socket.send({ type: 'mafia_action', action, payload })}
                  onExit={handleLeaveRoom}
                />
              )}

              {room.gameId === 'sound_mimic' && (
                <SoundMimicEngine
                  mode="online"
                  players={room.players}
                  onlineRoomData={room.gameData}
                  myPlayerId={myPlayerId || undefined}
                  socket={socket}
                  onOnlineScore={(score) => socket.send({ type: 'mimic_score', score })}
                  onExit={handleLeaveRoom}
                />
              )}

              {room.gameId === 'broken_tv' && (
                <BrokenTvEngine
                  mode="online"
                  players={room.players}
                  onlineRoomData={room.gameData}
                  onExit={handleLeaveRoom}
                />
              )}

              {room.gameId === 'ism_hayawan' && (
                <IsmHayawanEngine
                  mode="online"
                  players={room.players}
                  onlineRoomData={room.gameData}
                  socket={socket}
                  myPlayerId={myPlayerId || undefined}
                  isJudge={isJudge || room.gameData?.judgeId === myPlayerId}
                  onExit={handleLeaveRoom}
                />
              )}
            </div>
          )}

          {/* ================= FLOATING IN-GAME CHAT OVERLAY DRAWER ================= */}
          {showChat && (
            <div className="fixed bottom-4 left-4 z-50 w-full max-w-sm rounded-3xl bg-[#1a082c]/95 backdrop-blur-xl border-2 border-orange-500/80 p-4 space-y-3 shadow-2xl animate-in slide-in-from-bottom-5">
              <div className="flex items-center justify-between border-b border-purple-900/60 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span>دردشة الغرفة المباشرة 🔥</span>
                </span>
                <div className="flex items-center gap-2">
                  {/* Quick Emoji Reactions Bar */}
                  <div className="flex gap-1">
                    {['🔥', '😂', '🎯', '🤔', '👏', '💀'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleSendEmoji(em)}
                        className="p-0.5 hover:scale-125 transition-transform text-sm cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 text-purple-300 hover:text-white rounded-lg bg-black/40 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="h-52 overflow-y-auto space-y-2 pr-1 text-xs">
                {room.messages.length === 0 ? (
                  <div className="text-center text-purple-400/60 py-8 text-xs">
                    لا توجد رسائل بعد... ولّع المحادثة برسالة أو إيموجي! 🔥
                  </div>
                ) : (
                  room.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded-xl max-w-[85%] text-right ${
                        m.isSystem
                          ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20 text-center mx-auto'
                          : m.senderId === myPlayerId
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white mr-auto'
                            : 'bg-purple-900/60 border border-purple-800/40 text-purple-100 ml-auto'
                      }`}
                    >
                      {!m.isSystem && (
                        <span className="text-[10px] font-bold block opacity-75">{m.senderName}</span>
                      )}
                      <span className="font-medium">{m.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Send Chat input */}
              <form onSubmit={handleSendChat} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اكتب رسالة للربع..."
                  className="flex-1 bg-black/60 border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-black font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال</span>
                </button>
              </form>
            </div>
          )}

          {/* Floating Chat Trigger Button (Always visible during match) */}
          {!showChat && (
            <button
              onClick={() => setShowChat(true)}
              className="fixed bottom-4 left-4 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 active:scale-95 text-black font-black text-xs shadow-2xl flex items-center gap-2 border-2 border-white/40 cursor-pointer transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>الدردشة الحية</span>
              {room.messages.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                  {room.messages.length}
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
