import React, { useState, useEffect, useRef } from 'react';
import { JamrMatchState, OnlinePlayer, Topic, Question, LifelineType } from '../types/jamr';
import { GamePlayBoard } from './GamePlayBoard';
import { Copy, Check, Users, MessageSquare, Send, Globe, Play, Sparkles, Flame, Shield, ArrowRight } from 'lucide-react';
import { sound } from '../services/soundFx';

interface OnlineMatchViewProps {
  roomCode: string;
  initialPlayerId?: string;
  initialIsHost?: boolean;
  availableTopics: Topic[];
  allQuestions: Question[];
  onExit: () => void;
}

export const OnlineMatchView: React.FC<OnlineMatchViewProps> = ({
  roomCode,
  initialPlayerId,
  initialIsHost = false,
  availableTopics,
  allQuestions,
  onExit
}) => {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('jamr_player_name') || 'لاعب جَمْر');
  const [hasJoined, setHasJoined] = useState(false);
  const [playerId, setPlayerId] = useState<string>(initialPlayerId || '');
  const [isHost, setIsHost] = useState(initialIsHost);
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | 'spectator'>('team1');

  // Room State
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [match, setMatch] = useState<JamrMatchState | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Host configuration for match start
  const [chosenTopicIds, setChosenTopicIds] = useState<string[]>(availableTopics.slice(0, 6).map(t => t.id));

  const wsRef = useRef<WebSocket | null>(null);

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Auto join if name is saved
      const storedName = localStorage.getItem('jamr_player_name');
      if (storedName || initialPlayerId) {
        ws.send(JSON.stringify({
          type: 'join_room',
          code: roomCode,
          playerId: initialPlayerId,
          name: storedName || playerName,
          team: selectedTeam
        }));
        setHasJoined(true);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'joined_success') {
          setPlayerId(data.playerId);
          setIsHost(Boolean(data.isHost));
          setSelectedTeam(data.team);
          setHasJoined(true);
        } else if (data.type === 'room_update') {
          const room = data.room;
          setPlayers(room.players || []);
          setMatch(room.match || null);
          setMessages(room.messages || []);
          const self = room.players.find((p: any) => p.id === playerId);
          if (self) {
            setIsHost(Boolean(self.isHost));
          }
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomCode]);

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim() || 'لاعب جَمْر';
    localStorage.setItem('jamr_player_name', cleanName);
    sound.playClick();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_room',
        code: roomCode,
        playerId,
        name: cleanName,
        team: selectedTeam
      }));
      setHasJoined(true);
    }
  };

  const handleTeamChange = (team: 'team1' | 'team2' | 'spectator') => {
    sound.playClick();
    setSelectedTeam(team);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'set_team',
        targetTeam: team
      }));
    }
  };

  const handleStartOnlineMatch = () => {
    if (!isHost) return;
    sound.playTileSelect();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start_match',
        chosenTopicIds,
        timerSeconds: 30
      }));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        text: chatInput.trim()
      }));
      setChatInput('');
    }
  };

  const handleSendReaction = (emoji: string) => {
    sound.playClick();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        text: emoji
      }));
    }
  };

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    sound.playClick();
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // If match has started and is playing
  if (match && match.status === 'playing') {
    return (
      <div className="min-h-screen">
        <div className="bg-amber-100/70 border-b border-amber-300 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-amber-900">مباراة أونلاين مباشرة | الغرفة: <strong className="font-mono text-sm tracking-wider text-orange-600">{roomCode}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {isHost && (
              <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-bold text-[10px]">
                أنت المضيف (Host)
              </span>
            )}
            <button
              onClick={onExit}
              className="text-xs font-bold text-slate-600 hover:text-red-600 cursor-pointer"
            >
              مغادرة الغرفة
            </button>
          </div>
        </div>

        <GamePlayBoard
          match={match}
          questions={allQuestions}
          isHostOrLocal={isHost}
          onUpdateMatch={(updated) => {
            // Forward tile click to server
            if (updated.activeQuestion && !match.activeQuestion) {
              const tile = updated.activeQuestion.tile;
              wsRef.current?.send(JSON.stringify({
                type: 'select_tile',
                col: tile.col,
                row: tile.row
              }));
            }
          }}
          onOnlineAction={(action, payload) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: action, ...payload }));
            }
          }}
          onEndMatch={() => {
            wsRef.current?.send(JSON.stringify({ type: 'rematch' }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 text-right">
      
      {/* Top back button */}
      <button
        onClick={() => {
          sound.playClick();
          onExit();
        }}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للرئيسية</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-orange-200/90 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-2">
              <Globe className="w-3.5 h-3.5 text-orange-600" />
              <span>غرفة جَمْر أونلاين</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              غرفة الانتظار والمباراة
            </h1>
            <p className="text-xs text-slate-500 mt-1">انضم مع أصدقائك ووزعوا الفرق لبدء التحدي</p>
          </div>

          {/* Room Code Showcase */}
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200 flex flex-col items-center">
            <span className="text-[10px] font-bold text-orange-700 mb-0.5">رمز الغرفة للمشاركة:</span>
            <div className="text-3xl font-black font-mono tracking-widest text-slate-900 mb-2">
              {roomCode}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 text-xs font-bold bg-white hover:bg-orange-100 border border-orange-200 rounded-lg text-orange-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'تم النسخ' : 'نسخ الرمز'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3 py-1 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط الدعوة'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Join Form Modal if not joined */}
      {!hasJoined ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-md mx-auto text-center">
          <h3 className="text-lg font-black text-slate-900 mb-2">اكتب اسمك للانضمام</h3>
          <p className="text-xs text-slate-500 mb-4">اختر اسماً مميزاً يظهر لجميع المتسابقين</p>

          <form onSubmit={handleJoinLobby} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسمك:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="مثال: صقر جَمْر"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-hidden text-sm font-bold text-slate-800 bg-slate-50"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اختر فريقك المبدئي:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeam('team1')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTeam === 'team1'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  الفريق الأول 🔥
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeam('team2')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTeam === 'team2'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  الفريق الثاني ⚡
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              دخول الغرفة الآن 🔥
            </button>
          </form>
        </div>
      ) : (
        /* Lobby Interface */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Teams and Players list (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Team Switching Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-600 block mb-2">تغيير فريقك:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleTeamChange('team1')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTeam === 'team1'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-orange-50 text-slate-700'
                  }`}
                >
                  الانضمام للفريق 1
                </button>
                <button
                  onClick={() => handleTeamChange('team2')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTeam === 'team2'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-red-50 text-slate-700'
                  }`}
                >
                  الانضمام للفريق 2
                </button>
                <button
                  onClick={() => handleTeamChange('spectator')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTeam === 'spectator'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  مشاهد / حكم
                </button>
              </div>
            </div>

            {/* Teams Roster */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Team 1 Roster */}
              <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-100">
                  <span className="text-xs font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                    الفريق الأول
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {players.filter(p => p.team === 'team1').length} لاعبين
                  </span>
                </div>

                <div className="space-y-1.5 min-h-[100px]">
                  {players.filter(p => p.team === 'team1').map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-orange-50/50 text-xs">
                      <span className="font-bold text-slate-900">{p.name} {p.id === playerId && '(أنت)'}</span>
                      {p.isHost && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-600 text-white">
                          مضيف
                        </span>
                      )}
                    </div>
                  ))}
                  {players.filter(p => p.team === 'team1').length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">لا يوجد لاعبين في هذا الفريق حتى الآن</p>
                  )}
                </div>
              </div>

              {/* Team 2 Roster */}
              <div className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-100">
                  <span className="text-xs font-black text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    الفريق الثاني
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {players.filter(p => p.team === 'team2').length} لاعبين
                  </span>
                </div>

                <div className="space-y-1.5 min-h-[100px]">
                  {players.filter(p => p.team === 'team2').map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-red-50/50 text-xs">
                      <span className="font-bold text-slate-900">{p.name} {p.id === playerId && '(أنت)'}</span>
                      {p.isHost && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white">
                          مضيف
                        </span>
                      )}
                    </div>
                  ))}
                  {players.filter(p => p.team === 'team2').length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">لا يوجد لاعبين في هذا الفريق حتى الآن</p>
                  )}
                </div>
              </div>

            </div>

            {/* Host Start Match Action */}
            {isHost ? (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900">أنت مضيف هذه الغرفة</h4>
                  <p className="text-xs text-slate-600">عند اكتمال انضمام الأصدقاء، انقر لبدء لوحة المسابقة فوراً</p>
                </div>

                <button
                  onClick={handleStartOnlineMatch}
                  className="px-8 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>انطلاق المباراة أونلاين 🔥</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center text-xs text-slate-600">
                في انتظار مضيف الغرفة لبدء المباراة... استعد للتحدي!
              </div>
            )}

          </div>

          {/* Live Room Chat & Reactions (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-[450px]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-orange-600" />
                <span>محادثة الغرفة</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{messages.length} رسالة</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 text-xs pr-1">
              {messages.map(m => (
                <div key={m.id} className={`p-2 rounded-xl text-right ${
                  m.isSystem 
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold text-center' 
                    : m.senderId === playerId 
                      ? 'bg-orange-50 border border-orange-200 text-slate-800' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}>
                  {!m.isSystem && (
                    <span className="block text-[10px] font-black text-slate-500 mb-0.5">
                      {m.senderName}:
                    </span>
                  )}
                  <span>{m.text}</span>
                </div>
              ))}
            </div>

            {/* Quick Emoji Reactions */}
            <div className="flex items-center justify-between gap-1 mb-2">
              {['🔥', '👏', '😱', '⚡', '🏆'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReaction(emoji)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-base transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب رسالة..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:outline-hidden text-xs text-slate-800 bg-slate-50"
              />
              <button
                type="submit"
                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
