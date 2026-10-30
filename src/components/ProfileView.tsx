import React, { useState } from 'react';
import { Trophy, Award, Flame, Star, History, Heart, Edit3, Check, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { getUserProfile, saveUserProfile, AVATAR_OPTIONS, TITLE_LEVELS } from '../services/storage';
import { sounds } from '../services/soundEffects';

export const ProfileView: React.FC = () => {
  const [profile, setProfile] = useState(getUserProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.username);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const updated = {
      ...profile,
      username: editName.trim(),
      avatar: editAvatar
    };
    saveUserProfile(updated);
    setProfile(updated);
    setIsEditing(false);
    sounds.playSpark();
  };

  const winRate = profile.matchesPlayed > 0 
    ? Math.round((profile.matchesWon / profile.matchesPlayed) * 100) 
    : 0;

  const nextLevelXP = profile.level * 200;
  const currentLevelBaseXP = (profile.level - 1) * 200;
  const progressInLevel = Math.max(0, profile.xp - currentLevelBaseXP);
  const xpNeeded = 200;
  const progressPct = Math.min(100, Math.round((progressInLevel / xpNeeded) * 100));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-gradient-to-b from-purple-950/60 via-[#160d2e] to-[#0c0817] border-2 border-purple-700/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500/30 to-purple-800/40 border-2 border-orange-500/50 flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
              {profile.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.username}</h1>
                <span className="text-xs font-bold text-orange-400 font-mono">#{profile.id.substring(4, 8)}</span>
              </div>
              <p className="text-xs sm:text-sm text-purple-300 font-semibold mt-0.5">
                مستوى {profile.level} · {profile.title}
              </p>
            </div>
          </div>

          <button
            onClick={() => { setIsEditing(!isEditing); sounds.playSpark(); }}
            className="py-2.5 px-4 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-700/40 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-orange-400" />
            <span>تعديل الملف</span>
          </button>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-6 border-t border-purple-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>مستوى {profile.level} ({profile.title})</span>
            </span>
            <span className="text-purple-300 font-mono font-bold">
              {profile.xp} / {nextLevelXP} XP ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-purple-950 border border-purple-800/40 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Edit Modal / Inline */}
        {isEditing && (
          <form onSubmit={handleSaveEdit} className="mt-6 p-4 rounded-2xl bg-black/50 border border-orange-500/40 space-y-4 animate-in zoom-in-95">
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">الاسم المستعار:</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-purple-950/60 border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1.5">الصورة الرمزية:</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setEditAvatar(av)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                      editAvatar === av ? 'bg-orange-500 scale-110' : 'bg-purple-900/40'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-orange-500 text-white font-bold text-xs"
              >
                حفظ التغييرات
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2 px-4 text-purple-400 text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/30 text-center space-y-1">
          <span className="text-[10px] text-purple-400 font-bold block">مباريات ملعوبة</span>
          <span className="text-2xl font-black text-white font-mono">{profile.matchesPlayed}</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/30 text-center space-y-1">
          <span className="text-[10px] text-orange-400 font-bold block">مرات الفوز 🏆</span>
          <span className="text-2xl font-black text-orange-400 font-mono">{profile.matchesWon}</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/30 text-center space-y-1">
          <span className="text-[10px] text-emerald-400 font-bold block">نسبة الفوز</span>
          <span className="text-2xl font-black text-emerald-400 font-mono">{winRate}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/30 text-center space-y-1">
          <span className="text-[10px] text-amber-400 font-bold block">إجمالي الخبرة</span>
          <span className="text-2xl font-black text-amber-400 font-mono">{profile.xp} XP</span>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-400" />
            <span>الأوسمة والإنجازات ({profile.achievements.filter(a => a.unlocked).length} / {profile.achievements.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {profile.achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                ach.unlocked
                  ? 'bg-purple-900/30 border-orange-500/40 shadow-sm'
                  : 'bg-black/20 border-purple-900/30 opacity-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                ach.unlocked ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800/40 text-gray-500'
              }`}>
                <Flame className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white">{ach.title}</h4>
                  {ach.unlocked && <span className="text-[10px] text-emerald-400">✓ مكتمل</span>}
                </div>
                <p className="text-[11px] text-purple-300/80 leading-relaxed mt-0.5">
                  {ach.description}
                </p>
                {ach.progress && !ach.unlocked && (
                  <span className="text-[10px] text-orange-400 font-mono mt-1 block">
                    التقدم: {ach.progress.current} / {ach.progress.total}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Match History */}
      <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <span>سجل المباريات الأخيرة</span>
          </h3>
        </div>

        {profile.history.length === 0 ? (
          <p className="text-xs text-purple-400 text-center py-4">لم تلعب أي مباراة مسجلة حتى الآن.</p>
        ) : (
          <div className="space-y-2">
            {profile.history.map((hist) => (
              <div
                key={hist.id}
                className="p-3.5 rounded-xl bg-purple-900/20 border border-purple-800/30 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{hist.gameTitle}</span>
                    <span className="text-[10px] text-purple-400">
                      {hist.mode === 'online' ? 'أونلاين' : 'أوفلاين'} · {hist.playerCount} لاعبين · {hist.date}
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <span className={`font-bold block ${hist.rank === 1 ? 'text-amber-400' : 'text-purple-300'}`}>
                    {hist.rank === 1 ? '👑 المركز الأول' : `المركز ${hist.rank}`}
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono">{hist.userScore} نقطة</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
