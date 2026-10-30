import React, { useState } from 'react';
import { Wifi, Smartphone, ArrowLeft, PlusCircle, LogIn, Users, Flame, ShieldAlert, Sparkles, Check, Share2 } from 'lucide-react';
import { sounds } from '../services/soundEffects';

interface HeroSectionProps {
  onStartOnline: (action: 'create' | 'join', roomCode?: string) => void;
  onStartOffline: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartOnline, onStartOffline }) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length >= 4) {
      sounds.playSpark();
      onStartOnline('join', joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="relative overflow-hidden pt-8 pb-14 px-4 sm:px-6 lg:px-8">
      {/* Background ambient ember glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-orange-600/15 via-purple-700/15 to-red-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Pitch with Logo Emblem */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-10">
        <div className="flex justify-center mb-2">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 opacity-60 blur-xl group-hover:opacity-100 transition duration-500"></div>
            <img 
              src="/assets/aistudio/IMG_3867_3e4a1eea.png" 
              alt="شعار جمر - العاب جماعية مع الاهل والاصدقاء" 
              className="relative w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-3xl shadow-2xl mx-auto transform transition duration-500 hover:scale-105"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>منصة ألعاب جماعية عربية متكاملة مع الأهل والأصدقاء</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          جَمْر | <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 bg-clip-text text-transparent">ألعاب جماعية مع الأهل والأصدقاء</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-purple-200/80 leading-relaxed font-normal">
          ألعاب ذكاء، خداع، ضحك وسرعة مصممة خصيصاً للجمعات والسهريات. العب مع ربعك أونلاين بغرف خاصة فورية، أو تمرير جهاز واحد بدون نت!
        </p>
      </div>

      {/* 2 Primary Modes: Online vs Offline */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* CARD 1: PLAY ONLINE */}
        <div className="relative group rounded-3xl bg-gradient-to-b from-purple-900/40 via-[#150d28]/90 to-[#0e081c] border-2 border-purple-600/30 hover:border-orange-500/60 p-6 sm:p-8 transition-all duration-300 shadow-xl hover:shadow-orange-500/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                <Wifi className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-orange-400 tracking-wider">
                مزامنة فورية حقيقية
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white mb-2">
                العب أونلاين
              </h2>
              <p className="text-sm text-purple-200/70 leading-relaxed">
                كل واحد بجواله! أنشئ غرفة خاصة بضغطة زر، أو انضم لغرفة ربعك برمز مباشر واستمتعوا بتوقيت متزامن وسيرفر حقيقي.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="text-xs text-purple-300/80 space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-400" />
                <span>غرفة خاصة مع رابط دعوة قابل للنسخ والمشاركة</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-400" />
                <span>دخول كضيف مباشر بدون إجبار على تسجيل حساب</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-400" />
                <span>تحكم المضيف بطرد اللاعبين وبدء الجولات والدردشة</span>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  sounds.playSpark();
                  onStartOnline('create');
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنشاء غرفة جديدة</span>
              </button>

              <button
                onClick={() => {
                  sounds.playSpark();
                  setShowJoinInput(!showJoinInput);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-950/70 border border-purple-700/50 hover:bg-purple-900/60 text-purple-100 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-orange-400" />
                <span>انضمام برمز</span>
              </button>
            </div>

            {/* Quick Room Code Input Drawer */}
            {showJoinInput && (
              <form onSubmit={handleJoinSubmit} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="أدخل رمز الغرفة (مثال: JMR29)"
                  className="flex-1 bg-black/50 border border-orange-500/50 rounded-xl px-4 py-2.5 text-center font-mono font-bold tracking-widest text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={joinCode.trim().length < 4}
                  className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm transition-all cursor-pointer"
                >
                  دخول
                </button>
              </form>
            )}
          </div>
        </div>

        {/* CARD 2: PLAY OFFLINE (SINGLE DEVICE) */}
        <div className="relative group rounded-3xl bg-gradient-to-b from-indigo-950/40 via-[#120e2a]/90 to-[#0e081c] border-2 border-indigo-700/30 hover:border-purple-400/60 p-6 sm:p-8 transition-all duration-300 shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-purple-300 tracking-wider">
                100% بدون إنترنت
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white mb-2">
                العب أوفلاين (جهاز واحد)
              </h2>
              <p className="text-sm text-purple-200/70 leading-relaxed">
                مجتمعين في استراحة أو كافيه؟ جهاز واحد يكفي الجلسة كاملة! أضف أسماء اللاعبين أو الفرق ومرّر الجهاز بينهم بأدوار سرية ومحكمة.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="text-xs text-purple-300/80 space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span>ستارة أدوار سرية تمنع كشف الكلمات والبطاقات للآخرين</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span>دعم نظام الفرق والأفراد ومؤقتات جولات دقيقة</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                <span>يعمل في البر، الطيارة، أو أي مكان بدون اتصال</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => {
                sounds.playSpark();
                onStartOffline();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-bold text-sm shadow-lg shadow-purple-600/25 hover:from-purple-800 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>ابدأ جلسة على جهاز واحد الآن</span>
              <ArrowLeft className="w-4 h-4 mr-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
