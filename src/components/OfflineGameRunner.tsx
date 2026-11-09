import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Flame } from 'lucide-react';
import { GameInfo } from '../types/game';
import { Topic, Question } from '../types/jamr';
import { DEFAULT_TOPICS, DEFAULT_QUESTIONS } from '../data/jamrDefaultTopics';
import { JAMR_GAMES_CATALOG } from '../data/gamesCatalog';

// The 4 Official Offline Engines
import { JamrainEngine } from './engines/JamrainEngine';
import { HuroofJamrEngine } from './engines/HuroofJamrEngine';
import { MafiaNoHakamEngine } from './engines/MafiaNoHakamEngine';
import { BarrahSalfaEngine } from './engines/BarrahSalfaEngine';
import { SoundMimicEngine } from './engines/SoundMimicEngine';
import { IsmHayawanEngine } from './engines/IsmHayawanEngine';

interface OfflineGameRunnerProps {
  initialGame?: GameInfo | null;
  topics?: Topic[];
  questions?: Question[];
  onExit: () => void;
}

export const OfflineGameRunner: React.FC<OfflineGameRunnerProps> = ({
  initialGame,
  topics = DEFAULT_TOPICS,
  questions = DEFAULT_QUESTIONS,
  onExit
}) => {
  const [selectedGame, setSelectedGame] = useState<GameInfo>(
    initialGame || JAMR_GAMES_CATALOG.find(g => g.id === 'jamrain') || JAMR_GAMES_CATALOG[0]
  );

  if (selectedGame.engineType === 'jamrain') {
    return (
      <div className="w-full min-h-screen">
        <JamrainEngine
          topics={topics}
          questions={questions}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-purple-900/40">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="px-3.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-700/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xl">{selectedGame.icon}</span>
            <span className="text-sm font-black text-white">{selectedGame.title}</span>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              أوفلاين بجهاز واحد
            </span>
          </div>
        </div>

        {/* Switch offline game dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-purple-300 hidden md:inline">تبديل اللعبة:</label>
          <select
            value={selectedGame.id}
            onChange={(e) => {
              const matched = JAMR_GAMES_CATALOG.find(g => g.id === e.target.value);
              if (matched) setSelectedGame(matched);
            }}
            className="bg-[#140a24] border border-purple-700/60 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 focus:outline-hidden"
          >
            {JAMR_GAMES_CATALOG.filter(g => g.supportsOffline).map(g => (
              <option key={g.id} value={g.id}>
                {g.title} ({g.subtitle})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedGame.engineType === 'huroof' && (
        <HuroofJamrEngine
          onExit={onExit}
        />
      )}

      {selectedGame.engineType === 'mafia' && (
        <MafiaNoHakamEngine
          mode="offline"
          players={[]}
          onExit={onExit}
        />
      )}

      {selectedGame.engineType === 'barrah_salfa' && (
        <BarrahSalfaEngine
          mode="offline"
          players={[]}
          currentRound={1}
          totalRounds={5}
          onNextRound={() => {}}
        />
      )}

      {selectedGame.engineType === 'sound_mimic' && (
        <SoundMimicEngine
          mode="offline"
          players={[]}
          onExit={onExit}
        />
      )}

      {selectedGame.engineType === 'ism_hayawan' && (
        <IsmHayawanEngine
          mode="offline"
          players={[]}
          onExit={onExit}
        />
      )}
    </div>
  );
};
