import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, HelpCircle, Home, RotateCcw, User, Edit3, Flame, Sparkles } from 'lucide-react';
import { sound } from '../services/soundFx';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenHowToPlay: () => void;
  onOpenAdmin: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetMatch?: () => void;
  inActiveMatch?: boolean;
  playerName?: string;
  onChangePlayerName?: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenHowToPlay,
  onOpenAdmin,
  soundEnabled,
  onToggleSound,
  onResetMatch,
  inActiveMatch,
  playerName = 'حمد',
  onChangePlayerName
}) => {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onChangePlayerName?.(tempName.trim());
      sound.playClick();
    }
    setEditingName(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0716]/90 backdrop-blur-xl border-b border-amber-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Right side (RTL Start): Logo and Brand */}
        <div 
          onClick={() => {
            sound.playClick();
            onNavigate('home');
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-amber-500/40 shadow-lg bg-black/40 flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-amber-400 transition-all">
            <img 
              src="/assets/aistudio/IMG_3867_3e4a1eea.png" 
              alt="شعار جَمْر" 
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white tracking-tight">جَمْر</span>
              <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full">
                JAMR
              </span>
            </div>
            <p className="text-[11px] font-bold text-amber-400/90 flex items-center gap-1">
              <span>ولّع جمعتكم</span>
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
            </p>
          </div>
        </div>

        {/* Center: In-match quick indicator or Username Badge */}
        <div className="flex items-center gap-3">
          {inActiveMatch ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-black text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>مباراة جارية 🔥</span>
            </div>
          ) : (
            /* Player Quick Name Badge (Free, Zero Password Needed) */
            <div className="relative">
              {editingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1">
                  <input
                    type="text"
                    maxLength={15}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="اسمك (مثل حمد)"
                    className="w-28 sm:w-36 bg-black/70 border border-amber-500 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-hidden font-bold"
                    autoFocus
                  />
                  <button type="submit" className="px-2 py-1 bg-amber-500 text-black text-xs font-bold rounded-xl cursor-pointer">
                    حفظ
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempName(playerName);
                    setEditingName(true);
                  }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-amber-500/30 hover:border-amber-500 text-xs text-amber-200 transition-all cursor-pointer group"
                  title="تغيير اسم اللاعب"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">{playerName}</span>
                  <Edit3 className="w-3 h-3 text-amber-400/60 group-hover:text-amber-300" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Left side (RTL End): Actions */}
        <div className="flex items-center gap-2">
          {inActiveMatch && onResetMatch && (
            <button
              onClick={() => {
                sound.playClick();
                onResetMatch();
              }}
              title="إعادة المباراة"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-200 hover:text-white bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/50 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة</span>
            </button>
          )}

          {currentView !== 'home' && (
            <button
              onClick={() => {
                sound.playClick();
                onNavigate('home');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 rounded-xl transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onOpenHowToPlay();
            }}
            title="طريقة وقواعد اللعب"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">القواعد</span>
          </button>

          <button
            onClick={() => {
              onToggleSound();
            }}
            title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
            className="p-2 text-slate-300 hover:text-amber-400 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 rounded-xl transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAdmin();
            }}
            title="لوحة الإدارة المحمية"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-amber-300 bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 border border-amber-500/50 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">الإدارة</span>
          </button>
        </div>

      </div>
    </header>
  );
};
