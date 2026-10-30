import React, { useState } from 'react';
import { Flame, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { isUsernameTaken, completeOnboarding, AVATAR_OPTIONS } from '../services/storage';
import { sounds } from '../services/soundEffects';

interface OnboardingModalProps {
  isOpen: boolean;
  onSuccess: (name: string, avatar: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onSuccess }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🔥');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('يرجى كتابة اسم مكون من حرفين على الأقل');
      sounds.playWrong();
      return;
    }

    if (isUsernameTaken(cleanName)) {
      setError('هذا الاسم مستعمل بالفعل! يرجى اختيار اسم مميز وغير مستخدم');
      sounds.playWrong();
      return;
    }

    sounds.playCorrect();
    completeOnboarding(cleanName, selectedAvatar);
    onSuccess(cleanName, selectedAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#180f2d] to-[#0c0817] border-2 border-orange-500/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Emblem */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black/60 border-2 border-orange-500/60 shadow-xl shadow-orange-500/20">
            <img 
              src="/assets/aistudio/IMG_3867_3e4a1eea.png" 
              alt="جمر" 
              className="w-full h-full object-cover scale-110"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-white">
            مرحباً بك في منصة جَمْر 🔥
          </h2>
          <p className="text-xs text-purple-200/80 leading-relaxed">
            قبل أن نبدأ، اكتب اسمك المستعار للدخول إلى الجلسات والمباريات. يجب أن يكون الاسم فريداً وغير مستعمل.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-xs text-red-200 flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-purple-300 mb-1.5">
              اسمك في المنصة:
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="مثال: سلطان_الجمعة"
              className="w-full bg-black/50 border border-purple-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-300 mb-2">
              اختر صورتك الرمزية:
            </label>
            <div className="flex flex-wrap justify-center gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => { setSelectedAvatar(av); sounds.playSpark(); }}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    selectedAvatar === av
                      ? 'bg-orange-500 scale-110 shadow-md shadow-orange-500/30'
                      : 'bg-purple-900/40 hover:bg-purple-800'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <span>دخول المنصة وبدء اللعب</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
