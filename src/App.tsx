import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { GamesGrid } from './components/GamesGrid';
import { RulesModal } from './components/RulesModal';
import { OfflineGameRunner } from './components/OfflineGameRunner';
import { OnlineGameView } from './components/OnlineGameView';
import { CustomPackCreator } from './components/CustomPackCreator';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { OnboardingModal } from './components/OnboardingModal';
import { SubmitGameModal } from './components/SubmitGameModal';
import { GameInfo } from './types/game';
import { isOnboardingCompleted } from './services/storage';
import { sounds } from './services/soundEffects';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'games' | 'packs' | 'profile' | 'admin'>('home');
  const [activeMode, setActiveMode] = useState<'online' | 'offline' | null>(null);
  const [activeGame, setActiveGame] = useState<GameInfo | null>(null);
  const [rulesModalGame, setRulesModalGame] = useState<GameInfo | null>(null);
  const [onlineAction, setOnlineAction] = useState<'create' | 'join'>('create');
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  // Modals
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingCompleted());
  const [showSubmitGame, setShowSubmitGame] = useState(false);

  // Check URL query params for direct room link (e.g. ?room=JAMR2)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomCode(roomParam.toUpperCase());
        setOnlineAction('join');
        setActiveMode('online');
      }
    }
  }, []);

  const handleStartOnline = (action: 'create' | 'join', roomCode?: string) => {
    setOnlineAction(action);
    setInitialRoomCode(roomCode || '');
    setActiveMode('online');
    sounds.playSpark();
  };

  const handleStartOffline = (game?: GameInfo) => {
    if (game) setActiveGame(game);
    setActiveMode('offline');
    sounds.playSpark();
  };

  const handleSelectGame = (game: GameInfo, mode: 'online' | 'offline') => {
    setActiveGame(game);
    if (mode === 'online') {
      handleStartOnline('create');
    } else {
      handleStartOffline(game);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0817] text-[#f5f3ff] flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setActiveMode(null);
          setCurrentTab(tab);
        }}
        onOpenSubmitGame={() => setShowSubmitGame(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* If Active Game Mode is running */}
        {activeMode === 'offline' ? (
          <OfflineGameRunner
            initialGame={activeGame}
            onExit={() => setActiveMode(null)}
          />
        ) : activeMode === 'online' ? (
          <OnlineGameView
            initialAction={onlineAction}
            initialRoomCode={initialRoomCode}
            initialGame={activeGame}
            onExit={() => {
              setActiveMode(null);
              if (window.history.pushState) {
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.pushState({ path: cleanUrl }, '', cleanUrl);
              }
            }}
          />
        ) : (
          /* Normal Tab Views */
          <>
            {currentTab === 'home' && (
              <>
                <HeroSection
                  onStartOnline={handleStartOnline}
                  onStartOffline={() => handleStartOffline()}
                />
                <GamesGrid
                  onSelectGame={handleSelectGame}
                  onOpenRules={(game) => setRulesModalGame(game)}
                  onOpenSubmitGame={() => setShowSubmitGame(true)}
                />
              </>
            )}

            {currentTab === 'games' && (
              <GamesGrid
                onSelectGame={handleSelectGame}
                onOpenRules={(game) => setRulesModalGame(game)}
                onOpenSubmitGame={() => setShowSubmitGame(true)}
              />
            )}

            {currentTab === 'packs' && (
              <CustomPackCreator
                onPlayPack={() => {
                  handleStartOffline();
                }}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard />
            )}
          </>
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal
        game={rulesModalGame}
        onClose={() => setRulesModalGame(null)}
        onPlay={(game, mode) => {
          setRulesModalGame(null);
          handleSelectGame(game, mode);
        }}
      />

      {/* Onboarding Name Entry Modal (First Visit) */}
      <OnboardingModal
        isOpen={showOnboarding}
        onSuccess={() => setShowOnboarding(false)}
      />

      {/* Submit Your Game Modal */}
      <SubmitGameModal
        isOpen={showSubmitGame}
        onClose={() => setShowSubmitGame(false)}
        onSuccess={() => {
          // keep open or notify
        }}
      />

      {/* Footer */}
      <footer className="border-t border-purple-900/30 bg-[#090513] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/aistudio/IMG_3867_3e4a1eea.png" 
              alt="شعار جمر" 
              className="w-10 h-10 rounded-xl object-contain bg-black/40 border border-orange-500/40 p-0.5" 
            />
            <div>
              <div className="text-base font-black text-white">
                جَمْر | ألعاب جماعية مع الأهل والأصدقاء
              </div>
              <div className="text-xs text-orange-400 font-medium">
                « ولّع جمعتكم » · سهرات لا تُنسى
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-purple-300/80">
            <button onClick={() => { setCurrentTab('home'); setActiveMode(null); }} className="hover:text-white transition-colors cursor-pointer">الرئيسية</button>
            <span>·</span>
            <button onClick={() => { setCurrentTab('games'); setActiveMode(null); }} className="hover:text-white transition-colors cursor-pointer">مكتبة الألعاب</button>
            <span>·</span>
            <button onClick={() => setShowSubmitGame(true)} className="hover:text-orange-400 font-bold transition-colors cursor-pointer">أضف لعبتك</button>
            <span>·</span>
            <button onClick={() => { setCurrentTab('packs'); setActiveMode(null); }} className="hover:text-white transition-colors cursor-pointer">صانع الحزم</button>
            <span>·</span>
            <button onClick={() => { setCurrentTab('profile'); setActiveMode(null); }} className="hover:text-white transition-colors cursor-pointer">الإنجازات والملف</button>
            <span>·</span>
            <button onClick={() => { setCurrentTab('admin'); setActiveMode(null); }} className="hover:text-white transition-colors cursor-pointer">لوحة الإدارة</button>
          </div>

          <div className="text-xs text-purple-400">
            جميع الحقوق محفوظة © منصة جَمْر {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
