import React, { useState, useEffect } from 'react';
import { Topic, Question } from './types/jamr';
import { GameInfo } from './types/game';
import { DEFAULT_TOPICS, DEFAULT_QUESTIONS } from './data/jamrDefaultTopics';
import { JAMR_GAMES_CATALOG } from './data/gamesCatalog';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { OfflineGameRunner } from './components/OfflineGameRunner';
import { OnlineGameView } from './components/OnlineGameView';
import { AdminPanel } from './components/AdminPanel';
import { HowToPlayModal } from './components/HowToPlayModal';
import { BugReportModal } from './components/BugReportModal';
import { sound } from './services/soundFx';
import { normalizeDigits } from './services/storage';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'offline_game' | 'online_game'>('home');
  const [topics, setTopics] = useState<Topic[]>(DEFAULT_TOPICS);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [games, setGames] = useState<GameInfo[]>(JAMR_GAMES_CATALOG);
  const [selectedGame, setSelectedGame] = useState<GameInfo>(JAMR_GAMES_CATALOG[0]);

  // Player identity: stored strictly in the user's browser (localStorage), no global database name
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jamr_player_name') || '';
    }
    return '';
  });
  const [onboardingNameInput, setOnboardingNameInput] = useState<string>('');

  // Online Match State
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>('');
  const [onlineAction, setOnlineAction] = useState<'create' | 'join'>('create');

  // Modals
  const [showAdmin, setShowAdmin] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());

  // Save player name to local storage whenever it changes
  const handleUpdatePlayerName = (newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setPlayerName(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jamr_player_name', clean);
      localStorage.setItem('jamr_username', clean);
    }
  };

  // Fetch topics, questions and dynamic games catalog from server
  const loadServerData = async () => {
    try {
      // 1. Fetch Games Catalog
      try {
        const gRes = await fetch('/api/games');
        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData.games) && gData.games.length > 0) {
            setGames(gData.games);
            setSelectedGame(prev => gData.games.find((g: GameInfo) => g.id === prev.id) || gData.games[0]);
          }
        }
      } catch {
        // Fallback to default bundled games
      }

      // 2. Fetch topics
      const res = await fetch('/api/topics');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.topics) && data.topics.length > 0) {
          setTopics(data.topics);
        }
      }

      // 3. Fetch questions
      const qRes = await fetch('/api/topics');
      if (qRes.ok) {
        const topicsList = await qRes.json();
        if (topicsList.topics) {
          const allQ: Question[] = [];
          for (const t of topicsList.topics) {
            try {
              const qFetch = await fetch(`/api/topics/${t.id}/questions`);
              if (qFetch.ok) {
                const qData = await qFetch.json();
                if (Array.isArray(qData.questions)) {
                  allQ.push(...qData.questions);
                }
              }
            } catch {
              // Silently ignore individual topic fetch errors
            }
          }
          if (allQ.length > 0) {
            setQuestions(allQ);
          }
        }
      }
    } catch {
      // Fallback to default bundled topics and questions
    }
  };

  useEffect(() => {
    loadServerData();

    // Check if entered via room invite link (?room=ABCXYZ)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setOnlineRoomCode(roomParam.toUpperCase());
        setOnlineAction('join');
        setCurrentView('online_game');
      }
    }
  }, []);

  // Handle Game Selection
  const handleSelectGame = (game: GameInfo, mode: 'offline' | 'online') => {
    setSelectedGame(game);
    if (mode === 'offline') {
      setCurrentView('offline_game');
    } else {
      setOnlineAction('create');
      setCurrentView('online_game');
    }
  };

  // Handle Create Online Room
  const handleCreateOnlineRoom = (gameId?: string) => {
    if (gameId) {
      const matched = JAMR_GAMES_CATALOG.find(g => g.id === gameId);
      if (matched) setSelectedGame(matched);
    }
    setOnlineAction('create');
    setOnlineRoomCode('');
    setCurrentView('online_game');
  };

  // Handle Join Online Room
  const handleJoinOnlineRoom = (code: string) => {
    setOnlineRoomCode(code.toUpperCase());
    setOnlineAction('join');
    setCurrentView('online_game');
  };

  // Sound toggle
  const handleToggleSound = () => {
    const nextState = sound.toggleSound();
    setSoundEnabled(nextState);
  };

  return (
    <div className="min-h-screen bg-[#08040d] text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      
      {/* Global Luxury Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'home') {
            setCurrentView('home');
          }
        }}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        playerName={playerName}
        onChangePlayerName={handleUpdatePlayerName}
        inActiveMatch={currentView === 'offline_game'}
      />

      {/* Main View Router */}
      <main className={`flex-1 ${currentView === 'offline_game' && selectedGame?.id === 'jamrain' ? 'pb-0' : 'pb-12'}`}>
        {currentView === 'home' && (
          <HomeScreen
            topics={topics}
            games={games}
            playerName={playerName}
            onChangePlayerName={handleUpdatePlayerName}
            onSelectGame={handleSelectGame}
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnline={handleJoinOnlineRoom}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
            onOpenAdmin={() => setShowAdmin(true)}
          />
        )}

        {currentView === 'offline_game' && (
          <OfflineGameRunner
            initialGame={selectedGame}
            topics={topics}
            questions={questions}
            onExit={() => setCurrentView('home')}
          />
        )}

        {currentView === 'online_game' && (
          <OnlineGameView
            initialAction={onlineAction}
            initialRoomCode={onlineRoomCode}
            initialGame={selectedGame}
            defaultPlayerName={playerName}
            onExit={() => {
              setCurrentView('home');
              setOnlineRoomCode('');
            }}
          />
        )}
      </main>

      {/* Ultra-Luxury Obsidian Footer */}
      <footer className="border-t border-purple-900/30 bg-[#0c0617]/90 py-5 px-4 text-center text-xs text-purple-300/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-black text-white">جَمْر | JAMR</span>
            <span className="text-amber-500">•</span>
            <span className="gold-gradient-text font-black">ولّع جمعتكم 🔥</span>
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full mr-2">
              منصة ألعاب عربية مجانية
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-purple-300">
            <button 
              onClick={() => setShowHowToPlay(true)} 
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              طريقة وقواعد الألعاب
            </button>
            <button 
              onClick={() => setShowBugReport(true)} 
              className="hover:text-red-400 text-amber-400 font-bold transition-colors flex items-center gap-1.5 cursor-pointer bg-red-950/40 hover:bg-red-950/70 px-3 py-1 rounded-full border border-red-500/40"
              title="أرسل ملاحظة أو بلاغ عن أي خلل مباشرة للإدارة"
            >
              <span>⚠️ إبلاغ عن خلل</span>
            </button>
            <button 
              onClick={() => setShowAdmin(true)} 
              className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>لوحة الإدارة والتحكم</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal (Strictly Protected) */}
      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onRefreshData={loadServerData}
          topics={topics}
          questions={questions}
          games={games}
        />
      )}

      {/* Rules / How to play modal */}
      {showHowToPlay && (
        <HowToPlayModal
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      {/* Bug Report Modal (Direct to Admin) */}
      {showBugReport && (
        <BugReportModal
          onClose={() => setShowBugReport(false)}
          playerName={playerName}
        />
      )}

      {/* Mandatory Name Onboarding Modal (Cannot be closed without entering a name) */}
      {!playerName && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#18082c] border-2 border-amber-500 rounded-3xl p-7 text-center text-white shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30 text-3xl">
              🔥
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-amber-400 tracking-wider">مرحباً بك في منصة جَمْر</span>
              <h2 className="text-2xl font-black text-white">اكتب اسمك للبدء</h2>
              <p className="text-xs text-purple-300/90 leading-relaxed">
                ادخل اسمك أو لقبك الذي سيعرفه أصحابك في الغرف والجلسات (لا يلزم تسجيل دخول)
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const clean = onboardingNameInput.trim();
                const norm = normalizeDigits(clean);
                if (norm === '1100321') {
                  handleUpdatePlayerName('المشرف');
                  setShowAdmin(true);
                  sound.playVictory();
                  return;
                }
                if (clean) {
                  handleUpdatePlayerName(clean);
                  sound.playVictory();
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={onboardingNameInput}
                onChange={(e) => setOnboardingNameInput(e.target.value)}
                placeholder="مثلاً: محمد، حمد، خالد، سارة..."
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-purple-600 bg-black/70 text-white font-bold text-center text-base focus:border-amber-400 focus:outline-hidden placeholder:text-purple-400/50"
              />

              <button
                type="submit"
                disabled={!onboardingNameInput.trim()}
                className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all ${
                  onboardingNameInput.trim()
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-black hover:scale-[1.02] cursor-pointer'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                دخول المنصة وبدء اللعب 🔥
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
