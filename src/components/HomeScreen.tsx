import React, { useState } from 'react';
import { 
  Users, Globe, KeyRound, Sparkles, Shield, HelpCircle, 
  ArrowLeft, Flame, Play, Trophy, User, Check, Zap, Tv, 
  Mic, Search, Grid, Compass, Smartphone, Lock
} from 'lucide-react';
import { Topic } from '../types/jamr';
import { JAMR_GAMES_CATALOG } from '../data/gamesCatalog';
import { GameInfo } from '../types/game';
import { sound } from '../services/soundFx';

interface HomeScreenProps {
  topics: Topic[];
  games?: GameInfo[];
  playerName: string;
  onChangePlayerName: (name: string) => void;
  onSelectGame: (game: GameInfo, mode: 'offline' | 'online') => void;
  onCreateOnlineRoom: (gameId?: string) => void;
  onJoinOnline: (code: string) => void;
  onOpenHowToPlay: () => void;
  onOpenAdmin: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  topics,
  games,
  playerName,
  onChangePlayerName,
  onSelectGame,
  onCreateOnlineRoom,
  onJoinOnline,
  onOpenHowToPlay,
  onOpenAdmin
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [selectedCreateGameId, setSelectedCreateGameId] = useState('barrah_salfa');
  const [joinError, setJoinError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'offline' | 'online'>('all');
  
  // Quick Name Edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('يرجى كتابة رمز الغرفة');
      return;
    }
    sound.playClick();
    onJoinOnline(cleanCode);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onChangePlayerName(tempName.trim());
      sound.playClick();
    }
    setIsEditingName(false);
  };

  const catalog = (games && games.length > 0) ? games : JAMR_GAMES_CATALOG;

  const filteredGames = catalog.filter(game => {
    if (activeTab === 'offline') return game.supportsOffline;
    if (activeTab === 'online') return game.supportsOnline;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
      
      {/* ===================== HERO SECTION ===================== */}
      <div className="flex flex-col items-center text-center pt-4 pb-2">
        
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-red-500/15 border border-amber-500/30 text-amber-300 text-xs font-black mb-4 shadow-lg shadow-orange-500/10">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
          <span>منصة الألعاب الجماعية العربية الفخمة للجمعات والديوانيات</span>
        </div>

        {/* Brand Logo Showcase */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/30 via-amber-500/40 to-red-600/30 rounded-3xl blur-2xl transition-all duration-700 group-hover:blur-3xl group-hover:opacity-100 opacity-70" />
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-[#0e0717]/90 p-3 flex items-center justify-center">
            <img 
              src="/assets/aistudio/IMG_3867_3e4a1eea.png" 
              alt="جَمْر - ولّع جمعتكم" 
              className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)] group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-2">
          جَمْر <span className="gold-gradient-text">| JAMR</span>
        </h1>
        <p className="text-sm sm:text-lg text-amber-200/90 font-medium max-w-2xl leading-relaxed mb-6">
          ولّع جمعتكم بأقوى 6 ألعاب تفاعلية: جمرين، حروف مع جمر، مافيا بدون حكم، برا السالفة، تقليد الأصوات، وتلفزيون خربان! (تحت التعديل)
        </p>

        {/* Free Username Pill (Zero Registration Required) */}
        <div className="mb-8 p-3 rounded-2xl bg-[#140b24]/80 border border-amber-500/30 shadow-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <User className="w-4 h-4" />
          </div>
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={20}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="اسمك المستعار (مثل حمد)"
                className="bg-black/60 border border-amber-500 rounded-xl px-3 py-1 text-xs text-white font-bold focus:outline-hidden"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-amber-500 text-black font-black text-xs rounded-xl cursor-pointer"
              >
                تأكيد
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="text-[10px] text-amber-400/80 block font-bold">اسم اللاعب (بدون تسجيل دخول):</span>
                <span className="text-sm font-black text-white">{playerName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTempName(playerName);
                  setIsEditingName(true);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                تغيير
              </button>
            </div>
          )}
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold mr-2">
            مجاني 100%
          </span>
        </div>

        {/* Primary Action Gate (Fast Online Room / Join / Offline) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mb-6">
          
          {/* 1. Offline Mode Play */}
          <div 
            onClick={() => {
              sound.playClick();
              setActiveTab('offline');
              // Smooth scroll to games
              document.getElementById('jamr-games-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative bg-gradient-to-b from-[#180d2c]/90 to-[#0e071a] rounded-3xl p-6 border-2 border-amber-500/30 hover:border-amber-500 shadow-xl transition-all duration-300 cursor-pointer text-right flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-bl-full -z-0 transition-all group-hover:scale-125" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="inline-block text-[11px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full mb-2">
                جهاز واحد
              </span>
              <h3 className="text-xl font-black text-white mb-1">ألعاب أوفلاين</h3>
              <p className="text-xs text-purple-200/70 leading-relaxed">
                العب فوراً بجهاز واحد في جمعتكم: جمرين، حروف مع جمر، مافيا بدون حكم، وبرا السالفة.
              </p>
            </div>
            <div className="relative z-10 mt-5 pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <span>تصفح الألعاب الأوفلاين</span>
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Create Online Room */}
          <div 
            onClick={() => {
              sound.playClick();
              setShowCreateModal(true);
            }}
            className="group relative bg-gradient-to-b from-[#1f0f38]/90 to-[#100720] rounded-3xl p-6 border-2 border-orange-500/40 hover:border-orange-500 shadow-xl transition-all duration-300 cursor-pointer text-right flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/10 rounded-bl-full -z-0 transition-all group-hover:scale-125" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <span className="inline-block text-[11px] font-extrabold text-orange-300 bg-orange-500/20 border border-orange-500/40 px-2.5 py-0.5 rounded-full mb-2">
                أونلاين متزامن
              </span>
              <h3 className="text-xl font-black text-white mb-1">إنشاء غرفة أونلاين</h3>
              <p className="text-xs text-purple-200/70 leading-relaxed">
                أنشئ غرفة خاصة برمز دعوة فخم وشارك الرابط مع ربعك للعب المباشر عبر الإنترنت.
              </p>
            </div>
            <div className="relative z-10 mt-5 pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs font-bold text-orange-400 group-hover:text-orange-300">
              <span>إنشاء الغرفة والدعوة</span>
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Join with Room Code */}
          <div 
            onClick={() => {
              sound.playClick();
              setShowJoinModal(true);
            }}
            className="group relative bg-gradient-to-b from-[#1c0d32]/90 to-[#0e061a] rounded-3xl p-6 border-2 border-purple-500/30 hover:border-purple-400 shadow-xl transition-all duration-300 cursor-pointer text-right flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-bl-full -z-0 transition-all group-hover:scale-125" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <KeyRound className="w-6 h-6" />
              </div>
              <span className="inline-block text-[11px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-full mb-2">
                برمز الدعوة
              </span>
              <h3 className="text-xl font-black text-white mb-1">انضم لغرفة</h3>
              <p className="text-xs text-purple-200/70 leading-relaxed">
                أدخل رمز الغرفة المكون من 6 أحرف للانضمام الفوري مع أصدقائك بدون أي تعقيد.
              </p>
            </div>
            <div className="relative z-10 mt-5 pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300">
              <span>إدخال رمز الغرفة</span>
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

      </div>

      {/* ===================== THE 6 GAMES GRID ===================== */}
      <div id="jamr-games-grid" className="space-y-6 pt-4">
        
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-purple-900/40 pb-4">
          <div className="text-right w-full sm:w-auto">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>ألعاب منصة جَمْر ({catalog.length} ألعاب)</span>
            </h2>
            <p className="text-xs text-purple-300/80 mt-1">
              اختر اللعبة المفضلة لجلستكم، العب أوفلاين بجهاز واحد أو افتح غرفة أونلاين
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-[#120822] p-1.5 rounded-2xl border border-purple-800/40">
            <button
              onClick={() => { sound.playClick(); setActiveTab('all'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              الكل ({catalog.length})
            </button>
            <button
              onClick={() => { sound.playClick(); setActiveTab('offline'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'offline'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              أوفلاين بجهاز واحد
            </button>
            <button
              onClick={() => { sound.playClick(); setActiveTab('online'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'online'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              أونلاين متزامن
            </button>
          </div>
        </div>

        {/* 6 Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="group relative rounded-3xl bg-gradient-to-b from-[#180b2a] via-[#11071e] to-[#0c0517] border-2 border-purple-800/40 hover:border-amber-500/80 shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden p-6 text-right"
            >
              {/* Glow accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {game.supportsOffline && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        📱 أوفلاين
                      </span>
                    )}
                    {game.supportsOnline && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        🌐 أونلاين
                      </span>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {game.icon || '🔥'}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors mb-1">
                  {game.title}
                </h3>
                <p className="text-xs text-amber-400/80 font-bold mb-3">{game.subtitle}</p>
                <p className="text-xs text-purple-200/70 leading-relaxed mb-4 line-clamp-3">
                  {game.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {game.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/40 text-purple-300 border border-purple-800/40">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-purple-900/40 flex flex-col gap-2">
                {game.id === 'coming_soon_game' ? (
                  <button
                    onClick={() => {
                      sound.playTileSelect();
                      setShowComingSoonModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:scale-[1.02] active:scale-95 text-white font-black text-xs shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>ترقبوا اللعبة الجديدة قريباً! 🔥</span>
                  </button>
                ) : (
                  <>
                    {game.supportsOffline && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onSelectGame(game, 'offline');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>العب محلياً على جهاز واحد</span>
                      </button>
                    )}

                    {game.supportsOnline && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setSelectedCreateGameId(game.id);
                          onCreateOnlineRoom(game.id);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 hover:text-white border border-purple-700/50 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-purple-400" />
                        <span>إنشاء غرفة أونلاين</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ===================== JOIN ROOM MODAL ===================== */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1c0d32] to-[#0c0517] rounded-3xl max-w-sm w-full p-6 border-2 border-amber-500/60 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-purple-900/40 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>انضم إلى غرفة جَمْر</span>
              </h3>
              <button 
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinError('');
                }}
                className="text-purple-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-purple-200/80 mb-4 leading-relaxed">
              أدخل رمز الغرفة المكون من 6 أحرف للانضمام مع أصدقائك فوراً:
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => {
                    setJoinCodeInput(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder="مثال: JAMR99"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-amber-500/40 focus:border-amber-400 focus:outline-hidden text-center text-2xl font-black tracking-widest uppercase text-amber-300 bg-black/50"
                  autoFocus
                />
                {joinError && (
                  <p className="text-xs text-red-400 font-bold mt-1.5">{joinError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  دخول الغرفة 🔥
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-3 bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CREATE ROOM MODAL ===================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1c0d32] to-[#0c0517] rounded-3xl max-w-md w-full p-6 border-2 border-orange-500/60 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-purple-900/40 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-400" />
                <span>إنشاء غرفة أونلاين جديدة</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-purple-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-2">اختر اللعبة للغرفة:</label>
                <div className="grid grid-cols-2 gap-2">
                  {JAMR_GAMES_CATALOG.filter(g => g.supportsOnline).map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedCreateGameId(g.id);
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        selectedCreateGameId === g.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-black/40 border-purple-800/40 text-purple-300 hover:text-white'
                      }`}
                    >
                      <div className="text-xl mb-1">{g.icon}</div>
                      <div className="text-xs font-black">{g.title}</div>
                      <div className="text-[10px] opacity-70">{g.categoryLabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    onCreateOnlineRoom(selectedCreateGameId);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  إنشاء الغرفة الآن والبدء 🔥
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== COMING SOON HYPE MODAL ===================== */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#240a28] via-[#16061b] to-[#09020b] rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-rose-500/60 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-rose-500/20">
              ⏳
            </div>
            <div>
              <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                تحديث ضخم قادم
              </span>
              <h3 className="text-2xl font-black text-white mt-2">لعبة جديدة قادمة في جَمْر! 🔥</h3>
            </div>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
              يتم الآن في كواليس جَمْر تجهيز واختبار لعبة جماعية حصرية ومبتكرة ستشعل أجواء جمعاتكم وديوانياتكم بالمزيد من الحماس والتحدي والضحك!
            </p>
            <div className="p-4 rounded-2xl bg-black/50 border border-purple-900/50 text-xs text-amber-300 font-bold flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>كونوا على الموعد... الإطلاق في التحديث القريب جداً!</span>
            </div>
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs transition-all shadow-md cursor-pointer"
            >
              متحمسين ومستعدين! 🔥
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
