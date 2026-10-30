import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { QUESTIONS_BANK } from './src/data/questionsBank.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// In-memory Room State Store
interface ServerPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  ws?: WebSocket;
  secretRole?: string;
  secretWord?: string;
  currentAnswer?: any;
  hasVoted?: boolean;
}

interface ServerRoom {
  code: string;
  gameId: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'round_results' | 'game_over';
  maxPlayers: number;
  players: ServerPlayer[];
  currentRound: number;
  totalRounds: number;
  timerSeconds: number;
  timerActive: boolean;
  gameData?: any;
  messages: Array<{ id: string; senderId: string; senderName: string; text: string; timestamp: number; isSystem?: boolean }>;
  lastActive: number;
  cleanupTimeout?: NodeJS.Timeout;
}

const rooms = new Map<string, ServerRoom>();

// Global platform stats
let totalGamesPlayedCount = 0;
let totalConnectionsEver = 0;

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function sanitizeRoomForClient(room: ServerRoom, forPlayerId?: string) {
  return {
    code: room.code,
    gameId: room.gameId,
    hostId: room.hostId,
    status: room.status,
    maxPlayers: room.maxPlayers,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    timerSeconds: room.timerSeconds,
    timerActive: room.timerActive,
    messages: room.messages,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      isHost: p.isHost,
      isReady: p.isReady,
      connected: p.connected,
      hasVoted: p.hasVoted,
      // Only reveal role if game over, round results, or for self
      secretRole: (room.status === 'round_results' || room.status === 'game_over' || p.id === forPlayerId) ? p.secretRole : undefined,
      secretWord: (room.status === 'round_results' || room.status === 'game_over' || p.id === forPlayerId) ? p.secretWord : undefined
    })),
    gameData: room.gameData ? getClientSpecificGameData(room, forPlayerId) : undefined
  };
}

function getClientSpecificGameData(room: ServerRoom, forPlayerId?: string) {
  if (!room.gameData) return undefined;
  const clone = { ...room.gameData };

  // For trivia, hide correct answer during 'playing' status
  if (room.gameId === 'trivia_spark' || room.gameId === 'fact_or_fiction') {
    if (room.status === 'playing') {
      delete clone.correctAnswer;
      delete clone.explanation;
    }
  }

  // For Barrah Salfa, if player is the odd-one-out, hide the secret word!
  if (room.gameId === 'barrah_salfa') {
    const player = room.players.find(p => p.id === forPlayerId);
    if (player && player.secretRole === 'odd_one' && room.status === 'playing') {
      clone.secretWord = '??? أنت برا السالفة! حاول تسلّك وما تنكشف! ???';
    }
  }

  return clone;
}

function broadcastRoom(room: ServerRoom) {
  room.lastActive = Date.now();
  for (const player of room.players) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      const sanitized = sanitizeRoomForClient(room, player.id);
      player.ws.send(JSON.stringify({ type: 'room_state', room: sanitized }));
    }
  }
}

// Room Timer Tick Interval (Authoritative Server Clock)
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.status === 'playing' && room.timerActive && room.timerSeconds > 0) {
      room.timerSeconds -= 1;
      if (room.timerSeconds <= 0) {
        room.timerActive = false;
        handleTimerExpired(room);
      }
      broadcastRoom(room);
    }
  }
}, 1000);

function handleTimerExpired(room: ServerRoom) {
  room.status = 'round_results';
  room.messages.push({
    id: 'sys_' + Date.now(),
    senderId: 'system',
    senderName: 'جَمْر',
    text: 'انتهى وقت الجولة! لنرى النتائج 🔥',
    timestamp: Date.now(),
    isSystem: true
  });
  broadcastRoom(room);
}

// Prepare round data depending on chosen game
function setupRoundData(room: ServerRoom) {
  room.timerActive = true;

  if (room.gameId === 'barrah_salfa') {
    const questions = QUESTIONS_BANK.filter(q => q.gameId === 'barrah_salfa');
    const selected = questions[Math.floor(Math.random() * questions.length)] || questions[0];

    // Pick 1 odd one out player randomly
    const oddIndex = Math.floor(Math.random() * room.players.length);
    room.players.forEach((p, idx) => {
      p.hasVoted = false;
      if (idx === oddIndex) {
        p.secretRole = 'odd_one';
        p.secretWord = 'أنت برا السالفة!';
      } else {
        p.secretRole = 'in_the_loop';
        p.secretWord = selected.secretWord;
      }
    });

    room.timerSeconds = 90; // 90 seconds for discussion
    room.gameData = {
      category: selected.category,
      secretCategory: selected.secretCategory,
      secretWord: selected.secretWord,
      hints: selected.hints,
      oddPlayerId: room.players[oddIndex].id,
      votes: {}
    };
  } else if (room.gameId === 'trivia_spark') {
    const questions = QUESTIONS_BANK.filter(q => q.gameId === 'trivia_spark');
    const q = questions[(room.currentRound - 1) % questions.length] || questions[0];
    room.players.forEach(p => {
      p.hasVoted = false;
      p.currentAnswer = null;
    });
    room.timerSeconds = 15;
    room.gameData = {
      questionId: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      playerAnswers: {}
    };
  } else if (room.gameId === 'taboo_words') {
    const taboos = QUESTIONS_BANK.filter(q => q.gameId === 'taboo_words');
    const t = taboos[(room.currentRound - 1) % taboos.length] || taboos[0];
    room.timerSeconds = 60;
    // Current describer
    const describer = room.players[(room.currentRound - 1) % room.players.length];
    room.gameData = {
      describerId: describer.id,
      describerName: describer.name,
      targetWord: t.question,
      category: t.category,
      forbiddenWords: t.forbiddenWords,
      hints: t.hints
    };
  } else if (room.gameId === 'who_among_us') {
    const questions = QUESTIONS_BANK.filter(q => q.gameId === 'who_among_us');
    const q = questions[(room.currentRound - 1) % questions.length] || questions[0];
    room.players.forEach(p => { p.hasVoted = false; });
    room.timerSeconds = 30;
    room.gameData = {
      question: q.question,
      category: q.category,
      votes: {}
    };
  } else if (room.gameId === 'fact_or_fiction') {
    const facts = QUESTIONS_BANK.filter(q => q.gameId === 'fact_or_fiction');
    const f = facts[(room.currentRound - 1) % facts.length] || facts[0];
    room.players.forEach(p => {
      p.hasVoted = false;
      p.currentAnswer = null;
    });
    room.timerSeconds = 12;
    room.gameData = {
      question: f.question,
      category: f.category,
      correctAnswer: f.correctAnswer,
      explanation: f.explanation,
      playerAnswers: {}
    };
  } else if (room.gameId === 'sketch_party') {
    const sketches = QUESTIONS_BANK.filter(q => q.gameId === 'sketch_party');
    const s = sketches[(room.currentRound - 1) % sketches.length] || sketches[0];
    const artist = room.players[(room.currentRound - 1) % room.players.length];
    room.timerSeconds = 75;
    room.gameData = {
      artistId: artist.id,
      artistName: artist.name,
      wordToDraw: s.question,
      hints: s.hints,
      strokes: [],
      guesses: []
    };
  } else if (room.gameId === 'this_or_that') {
    const dilemmas = QUESTIONS_BANK.filter(q => q.gameId === 'this_or_that');
    const d = dilemmas[(room.currentRound - 1) % dilemmas.length] || dilemmas[0];
    room.players.forEach(p => { p.hasVoted = false; });
    room.timerSeconds = 25;
    room.gameData = {
      question: d.question,
      category: d.category,
      optionsAB: d.optionsAB,
      votes: {}
    };
  } else {
    // Default fallback
    room.timerSeconds = 30;
    room.gameData = { generic: true };
  }
}

// WebSocket Connection Management
wss.on('connection', (ws: WebSocket) => {
  totalConnectionsEver++;
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'create_room') {
        const { playerName, avatar, gameId } = msg;
        const code = generateRoomCode();
        const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        const player: ServerPlayer = {
          id: playerId,
          name: playerName || 'مضيف جَمْر',
          avatar: avatar || '🔥',
          score: 0,
          isHost: true,
          isReady: true,
          connected: true,
          ws
        };

        const newRoom: ServerRoom = {
          code,
          gameId: gameId || 'barrah_salfa',
          hostId: playerId,
          status: 'lobby',
          maxPlayers: 12,
          players: [player],
          currentRound: 1,
          totalRounds: 5,
          timerSeconds: 0,
          timerActive: false,
          messages: [
            {
              id: 'sys_' + Date.now(),
              senderId: 'system',
              senderName: 'جَمْر',
              text: `تم إنشاء الغرفة بنجاح! شارك الرمز: ${code}`,
              timestamp: Date.now(),
              isSystem: true
            }
          ],
          lastActive: Date.now()
        };

        rooms.set(code, newRoom);
        currentRoomCode = code;
        currentPlayerId = playerId;

        ws.send(JSON.stringify({
          type: 'joined',
          roomCode: code,
          playerId,
          room: sanitizeRoomForClient(newRoom, playerId)
        }));
      }

      else if (msg.type === 'join_room') {
        const { roomCode, playerName, avatar, existingPlayerId } = msg;
        const room = rooms.get(roomCode?.toUpperCase());

        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'رمز الغرفة غير صحيح أو انتهت الجلسة!' }));
          return;
        }

        // Check if reconnecting existing player
        if (existingPlayerId) {
          const existing = room.players.find(p => p.id === existingPlayerId);
          if (existing) {
            existing.connected = true;
            existing.ws = ws;
            if (playerName) existing.name = playerName;
            if (avatar) existing.avatar = avatar;
            currentRoomCode = room.code;
            currentPlayerId = existing.id;

            ws.send(JSON.stringify({
              type: 'joined',
              roomCode: room.code,
              playerId: existing.id,
              room: sanitizeRoomForClient(room, existing.id)
            }));
            broadcastRoom(room);
            return;
          }
        }

        if (room.players.length >= room.maxPlayers) {
          ws.send(JSON.stringify({ type: 'error', message: 'الغرفة ممتلئة بالكامل!' }));
          return;
        }

        const newPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
        const newPlayer: ServerPlayer = {
          id: newPlayerId,
          name: playerName || `لاعب ${room.players.length + 1}`,
          avatar: avatar || '🎮',
          score: 0,
          isHost: false,
          isReady: false,
          connected: true,
          ws
        };

        room.players.push(newPlayer);
        currentRoomCode = room.code;
        currentPlayerId = newPlayerId;

        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'جَمْر',
          text: `انضم ${newPlayer.name} إلى السهرة! 👋`,
          timestamp: Date.now(),
          isSystem: true
        });

        ws.send(JSON.stringify({
          type: 'joined',
          roomCode: room.code,
          playerId: newPlayerId,
          room: sanitizeRoomForClient(room, newPlayerId)
        }));

        broadcastRoom(room);
      }

      else if (msg.type === 'toggle_ready') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const player = room.players.find(p => p.id === currentPlayerId);
        if (player) {
          player.isReady = !player.isReady;
          broadcastRoom(room);
        }
      }

      else if (msg.type === 'change_game') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== currentPlayerId) return;
        room.gameId = msg.gameId;
        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'جَمْر',
          text: `غيّر المضيف اللعبة إلى: ${msg.gameTitle || msg.gameId}`,
          timestamp: Date.now(),
          isSystem: true
        });
        broadcastRoom(room);
      }

      else if (msg.type === 'kick_player') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== currentPlayerId) return;
        const targetId = msg.targetPlayerId;
        const target = room.players.find(p => p.id === targetId);
        if (target && target.id !== room.hostId) {
          if (target.ws && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({ type: 'kicked', message: 'تم استبعادك من الغرفة بواسطة المضيف.' }));
          }
          room.players = room.players.filter(p => p.id !== targetId);
          broadcastRoom(room);
        }
      }

      else if (msg.type === 'start_game') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== currentPlayerId) return;

        totalGamesPlayedCount++;
        room.status = 'playing';
        room.currentRound = 1;
        room.players.forEach(p => p.score = 0);
        setupRoundData(room);
        broadcastRoom(room);
      }

      else if (msg.type === 'next_round') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== currentPlayerId) return;

        if (room.currentRound >= room.totalRounds) {
          room.status = 'game_over';
          broadcastRoom(room);
        } else {
          room.currentRound += 1;
          room.status = 'playing';
          setupRoundData(room);
          broadcastRoom(room);
        }
      }

      else if (msg.type === 'return_to_lobby') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.hostId !== currentPlayerId) return;
        room.status = 'lobby';
        room.players.forEach(p => {
          p.isReady = false;
          p.hasVoted = false;
          p.currentAnswer = null;
        });
        broadcastRoom(room);
      }

      else if (msg.type === 'submit_trivia_answer') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.status !== 'playing' || !room.gameData) return;

        const { answer, timeRemaining } = msg;
        const player = room.players.find(p => p.id === currentPlayerId);
        if (player && !player.hasVoted) {
          player.hasVoted = true;
          player.currentAnswer = answer;
          room.gameData.playerAnswers[player.id] = answer;

          // Check if correct
          const isCorrect = answer === room.gameData.correctAnswer;
          if (isCorrect) {
            const timeBonus = Math.max(10, Math.round((timeRemaining || 5) * 8));
            player.score += 100 + timeBonus;
          }

          // Check if all players answered
          const allAnswered = room.players.every(p => p.hasVoted);
          if (allAnswered) {
            room.timerActive = false;
            room.status = 'round_results';
          }
          broadcastRoom(room);
        }
      }

      else if (msg.type === 'submit_barrah_vote') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || !room.gameData) return;

        const { votedPlayerId } = msg;
        const player = room.players.find(p => p.id === currentPlayerId);
        if (player && !player.hasVoted) {
          player.hasVoted = true;
          room.gameData.votes[player.id] = votedPlayerId;

          const allVoted = room.players.every(p => p.hasVoted);
          if (allVoted) {
            // Count votes
            const counts: Record<string, number> = {};
            Object.values(room.gameData.votes).forEach((targetId: any) => {
              counts[targetId] = (counts[targetId] || 0) + 1;
            });
            let maxVotes = 0;
            let accusedPlayerId = '';
            for (const [pId, cnt] of Object.entries(counts)) {
              if (cnt > maxVotes) {
                maxVotes = cnt;
                accusedPlayerId = pId;
              }
            }

            const oddId = room.gameData.oddPlayerId;
            const caught = accusedPlayerId === oddId;

            // Score allocation
            room.players.forEach(p => {
              if (p.id !== oddId) {
                if (room.gameData.votes[p.id] === oddId) {
                  p.score += 120; // correct vote bonus
                }
              } else {
                if (!caught) {
                  p.score += 250; // odd escaped
                }
              }
            });

            room.gameData.accusedPlayerId = accusedPlayerId;
            room.gameData.caught = caught;
            room.status = 'round_results';
          }
          broadcastRoom(room);
        }
      }

      else if (msg.type === 'submit_who_among_us_vote') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || !room.gameData) return;

        const { targetPlayerId } = msg;
        const player = room.players.find(p => p.id === currentPlayerId);
        if (player && !player.hasVoted) {
          player.hasVoted = true;
          room.gameData.votes[player.id] = targetPlayerId;

          const allVoted = room.players.every(p => p.hasVoted);
          if (allVoted) {
            // Award points for most voted and those who agreed
            const counts: Record<string, number> = {};
            Object.values(room.gameData.votes).forEach((tid: any) => {
              counts[tid] = (counts[tid] || 0) + 1;
            });
            let highestTid = '';
            let maxC = 0;
            for (const [tid, c] of Object.entries(counts)) {
              if (c > maxC) { maxC = c; highestTid = tid; }
            }
            room.players.forEach(p => {
              if (room.gameData.votes[p.id] === highestTid) {
                p.score += 80;
              }
            });
            room.gameData.highestVotedPlayerId = highestTid;
            room.status = 'round_results';
          }
          broadcastRoom(room);
        }
      }

      else if (msg.type === 'taboo_score_action') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room || room.status !== 'playing' || !room.gameData) return;
        const { action } = msg; // 'correct', 'forbidden_buzz', 'skip'
        const describer = room.players.find(p => p.id === room.gameData.describerId);

        if (action === 'correct') {
          if (describer) describer.score += 50;
          // cycle to next card
          const taboos = QUESTIONS_BANK.filter(q => q.gameId === 'taboo_words');
          const nextT = taboos[Math.floor(Math.random() * taboos.length)];
          room.gameData.targetWord = nextT.question;
          room.gameData.forbiddenWords = nextT.forbiddenWords;
        } else if (action === 'forbidden_buzz') {
          if (describer) describer.score = Math.max(0, describer.score - 30);
        }
        broadcastRoom(room);
      }

      else if (msg.type === 'sketch_stroke') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room || !room.gameData || !room.gameData.strokes) return;
        room.gameData.strokes.push(msg.stroke);
        // Relay stroke to all other players in room
        for (const p of room.players) {
          if (p.id !== currentPlayerId && p.ws && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({ type: 'sketch_stroke_broadcast', stroke: msg.stroke }));
          }
        }
      }

      else if (msg.type === 'send_chat') {
        if (!currentRoomCode || !currentPlayerId) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const player = room.players.find(p => p.id === currentPlayerId);
        if (!player) return;

        const chatMsg = {
          id: 'chat_' + Date.now() + Math.random().toString(36).substring(2, 5),
          senderId: player.id,
          senderName: player.name,
          text: String(msg.text || '').substring(0, 200),
          timestamp: Date.now()
        };
        room.messages.push(chatMsg);
        if (room.messages.length > 50) room.messages.shift();
        broadcastRoom(room);
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        const player = room.players.find(p => p.id === currentPlayerId);
        if (player) {
          player.connected = false;
          player.ws = undefined;

          // If host leaves, assign next active player
          if (player.isHost) {
            const nextHost = room.players.find(p => p.id !== currentPlayerId && p.connected);
            if (nextHost) {
              player.isHost = false;
              nextHost.isHost = true;
              room.hostId = nextHost.id;
            }
          }

          broadcastRoom(room);

          // If all disconnected, schedule cleanup
          const anyConnected = room.players.some(p => p.connected);
          if (!anyConnected) {
            room.cleanupTimeout = setTimeout(() => {
              rooms.delete(currentRoomCode!);
            }, 60000); // 1 minute grace period for reconnects
          }
        }
      }
    }
  });
});

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'جَمْر | JAMR API', timestamp: Date.now() });
});

app.get('/api/stats', (req, res) => {
  res.json({
    activeRooms: rooms.size,
    totalGamesPlayed: totalGamesPlayedCount,
    totalConnectionsEver,
    questionsCount: QUESTIONS_BANK.length
  });
});

app.get('/api/admin/rooms', (req, res) => {
  const list = Array.from(rooms.values()).map(r => ({
    code: r.code,
    gameId: r.gameId,
    playerCount: r.players.length,
    status: r.status,
    currentRound: r.currentRound,
    players: r.players.map(p => ({ id: p.id, name: p.name, score: p.score, connected: p.connected }))
  }));
  res.json({ rooms: list });
});

app.post('/api/admin/rooms/:code/close', (req, res) => {
  const code = req.params.code?.toUpperCase();
  const room = rooms.get(code);
  if (room) {
    room.players.forEach(p => {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({ type: 'kicked', message: 'تم إغلاق الغرفة من قبل إدارة المنصة.' }));
      }
    });
    rooms.delete(code);
    res.json({ success: true, message: `تم إغلاق الغرفة ${code}` });
  } else {
    res.status(404).json({ error: 'الغرفة غير موجودة' });
  }
});

// Dev vs Prod Vite Integration
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 [جَمْر | JAMR] الخادم يعمل الآن على المنفذ http://0.0.0.0:${PORT}`);
  });
}

startServer();
