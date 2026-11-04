import React, { useState, useEffect } from 'react';
import { Search, Heart, Play, Users, Clock, Flame, Info, PlusCircle, Check } from 'lucide-react';
import { GameInfo } from '../types/game';
import { CATEGORIES_LIST } from '../data/gamesCatalog';
import { sounds } from '../services/soundEffects';
import { toggleFavoriteGame, getUserProfile, getAllGamesCatalog } from '../services/storage';

interface GamesGridProps {
  onSelectGame: (game: GameInfo, mode: 'online' | 'offline') => void;
  onOpenRules: (game: GameInfo) => void;
  onOpenSubmitGame: () => void;
}

export const GamesGrid: React.FC<GamesGridProps> = ({ onSelectGame, onOpenRules, onOpenSubmitGame }) => {
  const [games, setGames] = useState<GameInfo[]>(getAllGamesCatalog());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playerFilter, setPlayerFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState(getUserProfile());

  useEffect(() => {
    setGames(getAllGamesCatalog());
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    sounds.playSpark();
    toggleFavoriteGame(gameId);
    setUserProfile(getUserProfile());
  };

  const filteredGames = games.filter((game) => {
    // Skip disabled games
    if (game.isActive === false) return false;

    if (selectedCategory !== 'all' && game.category !== selectedCategory) {
      return false;
    }
    if (favoritesOnly && !userProfile.favoriteGames.includes(game.id)) {
      return false;
    }
    if (playerFilter === '2' && game.minPlayers > 2) return false;
    if (playerFilter === '4' && game.minPlayers > 4) return false;
    if (playerFilter === '6' && game.maxPlayers < 6) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = game.title.toLowerCase().includes(q);
      const matchSub = game.subtitle.toLowerCase().includes(q);
      const matchDesc = game.description.toLowerCase().includes(q);
      const matchTag = game.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchSub || matchDesc || matchTag;
    }
    return true;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Bar & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>مكتبة الألعاب الجماعية ({filteredGames.length} لعبة متاحة)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            ألعاب الجمعات والسهرات
          </h2>
        </div>

        {/* Search Bar + Submit Your Game Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن لعبة (مثال: أسئلة، برا السالفة)..."
              className="w-full bg-purple-950/50 border border-purple-800/50 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
            />
          </div>

          <button
            onClick={() => { sounds.playSpark(); onOpenSubmitGame(); }}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>أضف لعبتك</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-900/30 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-purple-950/40 border border-purple-800/30">
          {CATEGORIES_LIST.map((cat: any) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  sounds.playSpark();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Players & Favorites Filter */}
        <div className="flex items-center gap-2">
          <select
            value={playerFilter}
            onChange={(e) => setPlayerFilter(e.target.value)}
            className="bg-purple-950/60 border border-purple-800/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-purple-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">أي عدد لاعبين</option>
            <option value="2">شخصين (2+)</option>
            <option value="4">أربعة لاعبين (4+)</option>
            <option value="6">جمعات كبيرة (6+)</option>
          </select>

          <button
            onClick={() => {
              setFavoritesOnly(!favoritesOnly);
              sounds.playSpark();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              favoritesOnly
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-red-500 text-red-500' : ''}`} />
            <span>المفضلة</span>
          </button>
        </div>
      </div>

      {/* Games Cards Grid - Clean Typography WITHOUT generic game logos */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-16 bg-purple-950/20 rounded-3xl border border-purple-900/30">
          <h3 className="text-base font-bold text-white">لا توجد ألعاب مطابقة للبحث</h3>
          <p className="text-xs text-purple-300/60 mt-1">جرّب تغيير التصنيف أو كلمات البحث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game) => {
            const isFav = userProfile.favoriteGames.includes(game.id);
            return (
              <div
                key={game.id}
                className="group relative rounded-2xl bg-gradient-to-b from-purple-950/30 via-[#100a20] to-[#0b0716] border border-purple-800/30 hover:border-orange-500/60 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 flex flex-col justify-between"
              >
                <div>
                  {/* Clean unboxed metadata header without game logos/icons */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-xs text-purple-300/80 font-medium">
                      <span className="text-orange-400 font-bold">{game.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{game.difficulty}</span>
                      {game.isPopular && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400 font-bold">الأكثر لعباً 🔥</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleFavoriteClick(e, game.id)}
                        title="إضافة للمفضلة"
                        className="p-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      <button
                        onClick={() => { sounds.playSpark(); onOpenRules(game); }}
                        title="طريقة وقواعد اللعب"
                        className="p-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Game Title & Subtitle */}
                  <h3 className="text-xl font-black text-white group-hover:text-orange-300 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-orange-400/90 font-semibold mb-2">
                    {game.subtitle}
                  </p>
                  <p className="text-xs text-purple-200/70 leading-relaxed line-clamp-2 mb-4">
                    {game.description}
                  </p>

                  {/* Specs: players & duration */}
                  <div className="flex items-center gap-4 text-[11px] text-purple-300/80 pt-2 border-t border-purple-900/30 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>{game.minPlayers} - {game.maxPlayers} لاعبين</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>{game.durationMinutes} دقيقة</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Online / Offline based on Admin configuration) */}
                <div className="mt-4 pt-3 border-t border-purple-900/30">
                  {game.supportsOnline !== false && game.supportsOffline !== false ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          sounds.playSpark();
                          onSelectGame(game, 'online');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>أونلاين</span>
                        <Play className="w-3 h-3 fill-white" />
                      </button>

                      <button
                        onClick={() => {
                          sounds.playSpark();
                          onSelectGame(game, 'offline');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-purple-900/50 hover:bg-purple-800/70 border border-purple-700/40 text-purple-100 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>أوفلاين</span>
                        <Users className="w-3 h-3 text-purple-300" />
                      </button>
                    </div>
                  ) : game.supportsOnline !== false ? (
                    <button
                      onClick={() => {
                        sounds.playSpark();
                        onSelectGame(game, 'online');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>العب أونلاين فقط 🌐</span>
                      <Play className="w-3 h-3 fill-white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playSpark();
                        onSelectGame(game, 'offline');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-100 font-bold text-xs border border-purple-700/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>العب أوفلاين فقط (جهاز واحد) 📱</span>
                      <Users className="w-3 h-3 text-purple-300" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
