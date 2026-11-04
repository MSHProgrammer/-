import React, { useState } from 'react';
import { HelpCircle, Sparkles, Clock, Flame, Award, Users, Smartphone, Globe, CheckCircle2, Shield } from 'lucide-react';
import { sound } from '../services/soundFx';
import { JAMR_GAMES_CATALOG } from '../data/gamesCatalog';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const [selectedGameId, setSelectedGameId] = useState<string>('jamrain');
  const activeGame = JAMR_GAMES_CATALOG.find(g => g.id === selectedGameId) || JAMR_GAMES_CATALOG[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#180b2a] to-[#0c0517] rounded-3xl max-w-3xl w-full border-2 border-amber-500/40 shadow-2xl overflow-hidden text-right my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#10061d] border-b border-purple-900/40 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">دليل وقواعد ألعاب جَمْر | JAMR</h2>
              <p className="text-xs text-amber-300">قواعد الألعاب الـ 6 الرسمية بالتفصيل</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-purple-400 hover:text-white text-sm font-bold w-8 h-8 rounded-full bg-purple-950/60 border border-purple-800/40 flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Game Selector Tabs */}
        <div className="flex overflow-x-auto gap-1.5 p-3 bg-black/40 border-b border-purple-900/40 shrink-0">
          {JAMR_GAMES_CATALOG.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                sound.playClick();
                setSelectedGameId(g.id);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedGameId === g.id
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white border border-purple-900/40'
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.title}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Rules Content for Selected Game */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs leading-relaxed text-purple-200">
          
          {/* Game Overview Card */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white flex items-center gap-2">
                <span className="text-xl">{activeGame.icon}</span>
                <span>{activeGame.title} - {activeGame.subtitle}</span>
              </span>
              <div className="flex items-center gap-1">
                {activeGame.supportsOffline && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
                    أوفلاين
                  </span>
                )}
                {activeGame.supportsOnline && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                    أونلاين
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-purple-300/90 leading-relaxed">
              {activeGame.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-amber-400 font-bold border-t border-purple-900/40">
              <span>👥 عدد اللاعبين: {activeGame.minPlayers} - {activeGame.maxPlayers} لاعبين</span>
              <span>⏱️ مدة الجولة: {activeGame.durationMinutes} دقيقة</span>
              <span>🔥 المستوى: {activeGame.difficulty}</span>
            </div>
          </div>

          {/* Rules List */}
          <div>
            <h4 className="text-sm font-black text-amber-400 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>خطوات وقواعد اللعب:</span>
            </h4>
            <div className="space-y-2">
              {activeGame.rules.map((rule, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/40 border border-purple-900/40 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-xs text-purple-200/90 leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Mechanic Highlights */}
          {activeGame.id === 'jamrain' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <h5 className="font-black text-xs text-amber-300">💡 وسائل المساعدة الثلاث في جمرين:</h5>
              <ul className="space-y-1.5 text-[11px] text-amber-200/80 list-disc list-inside">
                <li><strong>اتصال بصديق:</strong> يمنح الفريق 30 ثانية إضافية كاملة للتشاور.</li>
                <li><strong>جوابين للسؤال:</strong> يمنح الفريق محاولتين إذا أخطأ بالأولى.</li>
                <li><strong>الحفرة:</strong> إذا أجاب الفريق صحيحة تضاف النقاط له وتُخصم من الخصم مباشرة!</li>
              </ul>
            </div>
          )}

          {activeGame.id === 'huroof_jamr' && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
              <h5 className="font-black text-xs text-purple-300">🐝 سر الفوز في حروف مع جمر:</h5>
              <p className="text-[11px] text-purple-200/80">
                الفائز ليس فقط من يجيب أسئلة أكثر، بل من يستطيع ربط خط متصل من طرف الخلية إلى الطرف المقابل بلونه الخاص، أو السيطرة على أكثرية خلايا اللوحة.
              </p>
            </div>
          )}

          {activeGame.id === 'mafia_nohakam' && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
              <h5 className="font-black text-xs text-red-300">🕵️ الراوي الآلي بدون حكم بشري:</h5>
              <p className="text-[11px] text-red-200/80">
                التطبيق يتولى دور الراوي والحكم بالكامل؛ حيث يدير مراحل الليل والنهار والأدوار السرية، مما يتيح لجميع الحضور اللعب والمشاركة دون استبعاد أي شخص ليكون حكماً!
              </p>
            </div>
          )}

          {activeGame.id === 'barrah_salfa' && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
              <h5 className="font-black text-xs text-orange-300">🎭 وضع الجاسوس الغفلان والفرصة الأخيرة:</h5>
              <p className="text-[11px] text-orange-200/80">
                في وضع الجاسوس الغفلان، يحصل الدخيل على كلمة قريبة تشتته (مثلاً صيدلية بدل مستشفى)! وإذا انكشف في التصويت، لديه 25 ثانية و8 خيارات لتخمين الكلمة الأصلية وسرقة الفوز!
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#10061d] border-t border-purple-900/40 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow-lg transition-all"
          >
            فهمت القواعد، جاهز للعب! 🔥
          </button>
        </div>

      </div>
    </div>
  );
};
