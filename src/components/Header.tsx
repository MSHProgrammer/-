import React, { useState } from 'react';
import { Flame, Volume2, VolumeX, ShieldCheck, Sparkles, FolderPlus, Trophy, Menu, X, Users, Compass } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { getUserProfile } from '../services/storage';

interface HeaderProps {
  currentTab: 'home' | 'games' | 'packs' | 'profile' | 'admin';
  setCurrentTab: (tab: 'home' | 'games' | 'packs' | 'profile' | 'admin') => void;
  onOpenQuickPlay?: (mode: 'online' | 'offline') => void;
  onOpenSubmitGame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onOpenSubmitGame }) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profile = getUserProfile();

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
    if (!next) sounds.playSpark();
  };

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Flame },
    { id: 'games', label: 'مكتبة الألعاب', icon: Compass },
    { id: 'packs', label: 'اصنع حزمتك', icon: FolderPlus },
    { id: 'profile', label: 'إنجازاتي', icon: Trophy },
    { id: 'admin', label: 'الإدارة', icon: ShieldCheck },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0c0817]/85 border-b border-purple-900/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo with Uploaded Image */}
        <div 
          onClick={() => { setCurrentTab('home'); sounds.playSpark(); }}
          className="flex items-center gap-3.5 cursor-pointer group select-none"
        >
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-black/60 border-2 border-orange-500/50 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
            <img 
              src="/assets/aistudio/IMG_3867_3e4a1eea.png" 
              alt="جمر - العاب جماعية" 
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                جَمْر
              </span>
              <span className="text-[11px] font-bold text-orange-400/90 tracking-wider">
                ألعاب جماعية
              </span>
            </div>
            <p className="text-[11px] text-purple-300/80 font-medium tracking-wide">
              مع الأهل والأصدقاء · « ولّع جمعتكم »
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-purple-950/40 border border-purple-800/30">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  sounds.playSpark();
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-purple-200/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {onOpenSubmitGame && (
            <button
              onClick={() => { sounds.playSpark(); onOpenSubmitGame(); }}
              className="hidden lg:flex items-center gap-1.5 py-2 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>أضف لعبتك</span>
            </button>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت'}
            className="w-10 h-10 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/30 flex items-center justify-center text-purple-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-orange-400" />}
          </button>

          {/* User Profile Mini Badge */}
          <div 
            onClick={() => { setCurrentTab('profile'); sounds.playSpark(); }}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-slate-900/80 border border-purple-700/40 hover:border-orange-500/50 cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-lg">
              {profile.avatar}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white leading-tight">
                {profile.username}
              </div>
              <div className="text-[10px] text-orange-400 font-medium">
                مستوى {profile.level} · {profile.title}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0e091b] border-b border-purple-900/50 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                  sounds.playSpark();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-purple-200 hover:bg-purple-900/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
