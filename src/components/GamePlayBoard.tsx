import React, { useState } from 'react';
import { JamrMatchState, LifelineType, Question } from '../types/jamr';
import { QuestionPageView } from './QuestionModal';
import { Flame, Trophy, Sparkles, RefreshCw, Flag, CheckCircle2, XCircle } from 'lucide-react';
import { sound } from '../services/soundFx';

interface GamePlayBoardProps {
  match: JamrMatchState;
  questions: Question[];
  onUpdateMatch: (updatedMatch: JamrMatchState) => void;
  onEndMatch: () => void;
  isHostOrLocal?: boolean;
  onOnlineAction?: (action: string, payload?: any) => void;
}

export const GamePlayBoard: React.FC<GamePlayBoardProps> = ({
  match,
  questions,
  onUpdateMatch,
  onEndMatch,
  isHostOrLocal = true,
  onOnlineAction
}) => {
  const [activeTileCoord, setActiveTileCoord] = useState<{ col: number; row: number } | null>(null);

  const { topics, board, teams, currentTurn } = match;

  // Handle clicking a question tile
  const handleTileClick = (colIdx: number, rowIdx: number) => {
    const tile = board[colIdx][rowIdx];
    if (tile.isUsed) return;

    sound.playTileSelect();

    const currentTopic = topics[colIdx];
    let q = questions.find(item => item.id === tile.questionId);
    if (!q) {
      q = questions.find(item => item.topicId === currentTopic.id && item.points === tile.points) || {
        id: `fb_${currentTopic.id}_${tile.points}`,
        topicId: currentTopic.id,
        points: tile.points,
        difficulty: tile.points <= 200 ? 'easy' : tile.points <= 400 ? 'medium' : 'hard',
        questionText: `سؤال في مجال ${currentTopic.title} بقيمة ${tile.points} نقطة`,
        answerText: 'الإجابة النموذجية الصحيحة',
        hints: []
      };
    }

    const updatedMatch: JamrMatchState = {
      ...match,
      activeQuestion: {
        tile: { col: colIdx, row: rowIdx },
        question: q,
        topic: currentTopic,
        choosingTeam: currentTurn,
        answeringTeam: currentTurn,
        status: 'question_shown',
        remainingSeconds: match.settings.timerSeconds || 30,
        timerRunning: true
      }
    };

    setActiveTileCoord({ col: colIdx, row: rowIdx });
    onUpdateMatch(updatedMatch);
  };

  // Close question modal
  const handleCloseModal = () => {
    const updatedMatch: JamrMatchState = {
      ...match,
      activeQuestion: null
    };
    setActiveTileCoord(null);
    onUpdateMatch(updatedMatch);
  };

  // Lifelines
  const handleUseLifeline = (type: LifelineType) => {
    if (!match.activeQuestion) return;
    const teamId = match.activeQuestion.answeringTeam;
    const teamObj = { ...match.teams[teamId] };

    teamObj.lifelines = {
      ...teamObj.lifelines,
      [type]: false
    };

    const updatedActive = { ...match.activeQuestion };
    if (type === 'call_friend') {
      updatedActive.remainingSeconds += 30;
    } else if (type === 'two_answers') {
      updatedActive.twoAnswersAttemptsLeft = 2;
    } else if (type === 'the_trap') {
      const opp = teamId === 'team1' ? 'team2' : 'team1';
      updatedActive.answeringTeam = opp;
    }

    const updatedMatch: JamrMatchState = {
      ...match,
      teams: {
        ...match.teams,
        [teamId]: teamObj
      },
      activeQuestion: updatedActive
    };

    onUpdateMatch(updatedMatch);
  };

  // Award points on answer result
  const handleAwardPoints = (resultTeam: 'team1' | 'team2' | 'pass') => {
    if (!match.activeQuestion) return;

    const { tile } = match.activeQuestion;
    const updatedBoard = match.board.map((col, c) => {
      return col.map((t, r) => {
        if (c === tile.col && r === tile.row) {
          return {
            ...t,
            isUsed: true,
            answeredBy: (resultTeam === 'pass' ? 'none' : resultTeam) as 'none' | 'team1' | 'team2',
            pointsAwarded: resultTeam === 'pass' ? 0 : t.points
          };
        }
        return t;
      });
    });

    const updatedTeams = { ...match.teams };
    const history = [...match.history];

    if (resultTeam === 'team1' || resultTeam === 'team2') {
      const awarded = match.board[tile.col][tile.row].points;
      updatedTeams[resultTeam] = {
        ...updatedTeams[resultTeam],
        score: updatedTeams[resultTeam].score + awarded
      };

      history.push({
        id: 'h_' + Date.now(),
        timestamp: Date.now(),
        teamId: resultTeam,
        action: 'إجابة صحيحة',
        pointsDelta: awarded,
        note: `أحرز ${updatedTeams[resultTeam].name} +${awarded} نقطة في موضوع ${match.activeQuestion.topic.title}`
      });
    } else if (resultTeam === 'pass' && match.settings.deductOnWrong) {
      const ansTeam = match.activeQuestion.answeringTeam;
      const penalty = match.board[tile.col][tile.row].points;
      updatedTeams[ansTeam] = {
        ...updatedTeams[ansTeam],
        score: Math.max(0, updatedTeams[ansTeam].score - penalty)
      };

      history.push({
        id: 'h_' + Date.now(),
        timestamp: Date.now(),
        teamId: ansTeam,
        action: 'خصم نقاط',
        pointsDelta: -penalty,
        note: `خصم ${penalty} نقطة من ${updatedTeams[ansTeam].name}`
      });
    }

    // Toggle turn
    const nextTurn = currentTurn === 'team1' ? 'team2' : 'team1';

    // Check if game over (all 36 tiles used)
    const allUsed = updatedBoard.every(c => c.every(t => t.isUsed));
    let winner: 'team1' | 'team2' | 'tie' | undefined = undefined;
    let status = match.status;

    if (allUsed) {
      status = 'game_over';
      if (updatedTeams.team1.score > updatedTeams.team2.score) winner = 'team1';
      else if (updatedTeams.team2.score > updatedTeams.team1.score) winner = 'team2';
      else winner = 'tie';
    }

    const updatedMatch: JamrMatchState = {
      ...match,
      board: updatedBoard,
      teams: updatedTeams,
      currentTurn: nextTurn,
      activeQuestion: null,
      history,
      status,
      winner
    };

    setActiveTileCoord(null);
    onUpdateMatch(updatedMatch);

    if (allUsed) {
      sound.playVictory();
    }
  };

  // Manual switch turn
  const handleToggleTurn = () => {
    sound.playClick();
    onUpdateMatch({
      ...match,
      currentTurn: currentTurn === 'team1' ? 'team2' : 'team1'
    });
  };

  // Change / Swap Question dynamically to an alternate question in the same topic
  const handleSwapQuestion = () => {
    if (!match.activeQuestion) return;
    const { topic, tile, question } = match.activeQuestion;

    if (match.mode === 'online' && onOnlineAction) {
      onOnlineAction('swap_question');
      return;
    }

    const availableAlternates = questions.filter(
      q => q.topicId === topic.id && q.id !== question.id
    );
    const samePoints = availableAlternates.filter(q => q.points === question.points);
    const pool = samePoints.length > 0 ? samePoints : availableAlternates;

    if (pool.length > 0) {
      const nextQ = pool[Math.floor(Math.random() * pool.length)];
      sound.playTileSelect();
      const updatedMatch: JamrMatchState = {
        ...match,
        activeQuestion: {
          ...match.activeQuestion,
          question: nextQ,
          status: 'question_shown',
          remainingSeconds: match.settings.timerSeconds || 30,
          timerRunning: true
        }
      };
      onUpdateMatch(updatedMatch);
    }
  };

  // Dedicated Question Page View (صفحة مستقلة للسؤال بدلاً من رسالة/نافذة منبثقة)
  if (match.activeQuestion) {
    return (
      <div className="min-h-[calc(100vh-140px)] py-3 sm:py-6">
        <QuestionPageView
          activeQuestion={match.activeQuestion}
          teams={teams}
          onAwardPoints={handleAwardPoints}
          onUseLifeline={handleUseLifeline}
          onClose={handleCloseModal}
          onSwapQuestion={handleSwapQuestion}
          availableQuestions={questions}
          isHostOrLocal={isHostOrLocal}
          lifelinesEnabled={match.settings.lifelinesEnabled}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 text-right select-none">
      
      {/* Top Match Scoreboard Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Team 1 Score Card */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${
            currentTurn === 'team1' 
              ? 'border-orange-500 bg-orange-50/60 shadow-md ring-2 ring-orange-400/20' 
              : 'border-slate-200 bg-slate-50/40 opacity-90'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">
                {currentTurn === 'team1' ? '🔥 دوركم الآن' : 'الفريق الأول'}
              </span>
              <span className="text-xs font-bold text-slate-500 line-clamp-1 max-w-[130px]">
                {teams.team1.players.join('، ') || 'لاعبو الفريق الأول'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">{teams.team1.name}</h3>
              <div className="text-2xl sm:text-3xl font-black text-orange-600 font-mono">
                {teams.team1.score} <span className="text-xs font-bold text-slate-500">نقطة</span>
              </div>
            </div>

            {/* Team 1 Lifelines Status (Only if lifelines are enabled) */}
            {match.settings.lifelinesEnabled && (
              <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-200/60 text-[10px]">
                <span className="text-slate-400 font-bold ml-1">الوسائل:</span>
                <span title="جوابين" className={`px-1.5 py-0.5 rounded ${teams.team1.lifelines.two_answers ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-400 line-through'}`}>جوابين</span>
                <span title="صديق" className={`px-1.5 py-0.5 rounded ${teams.team1.lifelines.call_friend ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400 line-through'}`}>صديق</span>
                <span title="الحفرة" className={`px-1.5 py-0.5 rounded ${teams.team1.lifelines.pitfall ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-400 line-through'}`}>الحفرة</span>
                <span title="استريح" className={`px-1.5 py-0.5 rounded ${teams.team1.lifelines.bench_player ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-400 line-through'}`}>استريح</span>
                <span title="الفخ" className={`px-1.5 py-0.5 rounded ${teams.team1.lifelines.the_trap ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-400 line-through'}`}>الفخ</span>
              </div>
            )}
          </div>

          {/* Center VS & Game Controller */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-black text-xs mb-2">
              <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500 animate-pulse" />
              <span>لوحة جَمْر التنافسية</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleToggleTurn}
                title="تبديل الدور يدوياً"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تبديل الدور</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onEndMatch();
                }}
                title="إنهاء المباراة وعرض النتائج"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer border border-red-200"
              >
                <Flag className="w-3 h-3" />
                <span>إنهاء المباراة</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              المتبقي: {board.flat().filter(t => !t.isUsed).length} من أصل 36 سؤالاً
            </div>
          </div>

          {/* Team 2 Score Card */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${
            currentTurn === 'team2' 
              ? 'border-red-500 bg-red-50/60 shadow-md ring-2 ring-red-400/20' 
              : 'border-slate-200 bg-slate-50/40 opacity-90'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                {currentTurn === 'team2' ? '🔥 دوركم الآن' : 'الفريق الثاني'}
              </span>
              <span className="text-xs font-bold text-slate-500 line-clamp-1 max-w-[130px]">
                {teams.team2.players.join('، ') || 'لاعبو الفريق الثاني'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">{teams.team2.name}</h3>
              <div className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
                {teams.team2.score} <span className="text-xs font-bold text-slate-500">نقطة</span>
              </div>
            </div>

            {/* Team 2 Lifelines Status (Only if lifelines are enabled) */}
            {match.settings.lifelinesEnabled && (
              <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-200/60 text-[10px]">
                <span className="text-slate-400 font-bold ml-1">الوسائل:</span>
                <span title="جوابين" className={`px-1.5 py-0.5 rounded ${teams.team2.lifelines.two_answers ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-400 line-through'}`}>جوابين</span>
                <span title="صديق" className={`px-1.5 py-0.5 rounded ${teams.team2.lifelines.call_friend ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400 line-through'}`}>صديق</span>
                <span title="الحفرة" className={`px-1.5 py-0.5 rounded ${teams.team2.lifelines.pitfall ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-400 line-through'}`}>الحفرة</span>
                <span title="استريح" className={`px-1.5 py-0.5 rounded ${teams.team2.lifelines.bench_player ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-400 line-through'}`}>استريح</span>
                <span title="الفخ" className={`px-1.5 py-0.5 rounded ${teams.team2.lifelines.the_trap ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-400 line-through'}`}>الفخ</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Board Grid: 6 Topics matching the exact design in IMG_3888_31064515.jpeg */}
      {/* 2 rows x 3 columns on desktop/tablet, responsive on small mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto pb-8">
        {topics.map((topic, colIdx) => {
          // Left side questions: row 0 (200), row 2 (400), row 4 (600)
          // Right side questions: row 1 (200), row 3 (400), row 5 (600)
          const leftRowIndices = [0, 2, 4];
          const rightRowIndices = [1, 3, 5];

          const renderPill = (rowIdx: number) => {
            const tile = board[colIdx][rowIdx];
            const isUsed = tile.isUsed;
            const answeredByTeam = tile.answeredBy;

            return (
              <button
                key={`${colIdx}-${rowIdx}`}
                disabled={isUsed}
                onClick={() => handleTileClick(colIdx, rowIdx)}
                className={`w-16 sm:w-20 h-10 sm:h-12 rounded-full flex items-center justify-center select-none transition-all duration-150 cursor-pointer shadow-xs ${
                  isUsed
                    ? answeredByTeam === 'team1'
                      ? 'bg-orange-100/90 border-2 border-orange-400 text-orange-900 cursor-not-allowed text-xs font-black'
                      : answeredByTeam === 'team2'
                        ? 'bg-red-100/90 border-2 border-red-400 text-red-900 cursor-not-allowed text-xs font-black'
                        : 'bg-slate-200/70 border border-slate-300 text-slate-400 cursor-not-allowed line-through text-xs font-bold'
                    : 'bg-[#e5e7eb] hover:bg-[#d9dee6] active:scale-95 text-[#a91d22] font-black font-mono text-base sm:text-lg border border-slate-300/80 hover:shadow-md'
                }`}
              >
                {isUsed ? (
                  answeredByTeam === 'team1' ? (
                    <span className="flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                      <span className="text-[10px] font-mono">{tile.points}</span>
                    </span>
                  ) : answeredByTeam === 'team2' ? (
                    <span className="flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-[10px] font-mono">{tile.points}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">{tile.points}</span>
                  )
                ) : (
                  <span>{tile.points}</span>
                )}
              </button>
            );
          };

          return (
            <div
              key={topic.id}
              className="bg-white/80 backdrop-blur-xs p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2 sm:gap-3"
            >
              {/* Left Column: 200, 400, 600 Pills */}
              <div className="flex flex-col gap-2.5 sm:gap-3 items-center justify-center">
                {leftRowIndices.map(rowIdx => renderPill(rowIdx))}
              </div>

              {/* Center Column: Comic / Caricature Illustration Card with Orange Bottom Strip */}
              <div className="flex-1 max-w-[150px] sm:max-w-[170px] h-38 sm:h-44 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xs flex flex-col bg-white">
                <div className="flex-1 relative overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={topic.coverImage}
                    alt={topic.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Orange Banner Strip with Topic Name */}
                <div className="bg-[#f97316] text-white py-1 px-1.5 text-center font-black text-xs sm:text-sm tracking-wide shrink-0 line-clamp-1">
                  {topic.title}
                </div>
              </div>

              {/* Right Column: 200, 400, 600 Pills */}
              <div className="flex flex-col gap-2.5 sm:gap-3 items-center justify-center">
                {rightRowIndices.map(rowIdx => renderPill(rowIdx))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
