import React from 'react';
import { X, Play, Users, Clock, Flame, Shield, CheckCircle2 } from 'lucide-react';
import { GameInfo } from '../types/game';
import { sounds } from '../services/soundEffects';

interface RulesModalProps {
  game: GameInfo | null;
  onClose: () => void;
  onPlay: (game: GameInfo, mode: 'online' | 'offline') => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ game, onClose, onPlay }) => {
  if (!game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#191030] to-[#0d081b] border-2 border-purple-700/50 p-6 sm:p-8 shadow-2xl text-right overflow-hidden">
        {/* Glow accent */}
        <div 
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: game.accentColor }}
        />

        {/* Close Button */}
        <button
          onClick={() => { sounds.playSpark(); onClose(); }}
          className="absolute left-5 top-5 p-2 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: `${game.accentColor}30`, borderColor: game.accentColor, borderWidth: '1px' }}
          >
            <Flame className="w-6 h-6" style={{ color: game.accentColor }} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{game.title}</h3>
            <p className="text-xs text-orange-400 font-semibold">{game.subtitle}</p>
          </div>
        </div>

        {/* Overview & Metadata */}
        <p className="text-sm text-purple-200/80 leading-relaxed mb-5">
          {game.description}
        </p>

        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-purple-950/40 border border-purple-800/30 text-center mb-6">
          <div>
            <span className="block text-[10px] text-purple-400">عدد اللاعبين</span>
            <span className="text-xs font-bold text-white">{game.minPlayers} - {game.maxPlayers} لاعبين</span>
          </div>
          <div className="border-x border-purple-800/30">
            <span className="block text-[10px] text-purple-400">مدة الجولة</span>
            <span className="text-xs font-bold text-white">{game.durationMinutes} دقيقة</span>
          </div>
          <div>
            <span className="block text-[10px] text-purple-400">مستوى الصعوبة</span>
            <span className="text-xs font-bold text-orange-400">{game.difficulty}</span>
          </div>
        </div>

        {/* Detailed Rules List */}
        <div className="space-y-3 mb-8">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-400" />
            <span>قواعد وطريقة اللعب:</span>
          </h4>
          <ul className="space-y-2 text-xs text-purple-200/85">
            {game.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-purple-900/20 p-2.5 rounded-xl border border-purple-800/20">
                <span className="w-5 h-5 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Play Action Buttons */}
        <div className="pt-4 border-t border-purple-900/40">
          {game.supportsOnline !== false && game.supportsOffline !== false ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { sounds.playSpark(); onClose(); onPlay(game, 'online'); }}
                className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>العب أونلاين</span>
              </button>

              <button
                onClick={() => { sounds.playSpark(); onClose(); onPlay(game, 'offline'); }}
                className="py-3 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-white font-bold text-sm border border-purple-700/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>العب أوفلاين</span>
              </button>
            </div>
          ) : game.supportsOnline !== false ? (
            <button
              onClick={() => { sounds.playSpark(); onClose(); onPlay(game, 'online'); }}
              className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>العب أونلاين الآن 🌐</span>
            </button>
          ) : (
            <button
              onClick={() => { sounds.playSpark(); onClose(); onPlay(game, 'offline'); }}
              className="w-full py-3 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-white font-bold text-sm border border-purple-700/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>العب أوفلاين على جهاز واحد 📱</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
