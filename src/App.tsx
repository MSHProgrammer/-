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
import { sound } from './services/soundFx';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'offline_game' | 'online_game'>('home');
  const [topics, setTopics] = useState<Topic[]>(DEFAULT_TOPICS);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [games, setGames] = useState<GameInfo[]>(JAMR_GAMES_CATALOG);
  const [selectedGame, setSelectedGame] = useState<GameInfo>(JAMR_GAMES_CATALOG[0]);

  // Player identity (100% free, zero login wall - defaults to 'حمد' or stored name)
  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jamr_player_name') || 'حمد';
    }
    return 'حمد';
  });

  // Online Match State
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>('');
  const [onlineAction, setOnlineAction] = useState<'create' | 'join'>('create');

  // Modals
  const [showAdmin, setShowAdmin] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
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
      <main className="flex-1 pb-12">
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
          <div className="flex items-center gap-5 text-purple-300">
            <button 
              onClick={() => setShowHowToPlay(true)} 
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              طريقة وقواعد الألعاب
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

    </div>
  );
}
