import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { DEFAULT_TOPICS, DEFAULT_QUESTIONS, DEFAULT_SECTIONS } from './src/data/jamrDefaultTopics.ts';
import { JAMR_GAMES_CATALOG } from './src/data/gamesCatalog.ts';
import { Topic, Question, Section, JamrMatchState, BoardTile, LifelineType } from './src/types/jamr.ts';
import { GameInfo, GameCategory } from './src/types/game.ts';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_BARRAH_CATEGORIES, BarrahCategory } from './src/data/barrahSalfaCategories.ts';
import { MIMIC_SOUNDS_BANK, MimicSoundItem } from './src/data/mimicSoundsBank.ts';

export interface BugReport {
  id: string;
  type: string;
  gameTitle?: string;
  description: string;
  reporterName: string;
  reporterContact?: string;
  createdAt: string;
  status: 'new' | 'investigating' | 'resolved';
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('error', (err) => {
  console.error('WebSocket server warning/error:', err);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port 3000 is already in use, reusing existing socket.`);
  } else {
    console.error('HTTP server error:', err);
  }
});

app.use(express.json({ limit: '10mb' }));

// Anti-Hacking & Cybersecurity Protection Layer
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// In-Memory Rate Limiting for DDoS & Abuse Prevention
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
app.use('/api', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + 60000 };
    rateLimitMap.set(ip, record);
    return next();
  }
  record.count++;
  if (record.count > 180) {
    return res.status(429).json({ error: 'تم تجاوز الحد المسموح من الطلبات، يرجى الانتظار لحماية الخادم ضد الهجمات' });
  }
  next();
});

// Anti-Brute-Force Tracker for Admin Login
const loginAttempts = new Map<string, { failedCount: number; lockUntil: number }>();

// Input Sanitization Helper against XSS and Injections
function sanitizeText(input: any, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

// Google Search Console Site Verification
app.get('/google778ed8bd9063b365.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google778ed8bd9063b365.html');
});

// Admin Password requested by user (1100321)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1100321';
const ADMIN_TOKEN = 'jamr_admin_token_sec_' + Buffer.from(ADMIN_PASSWORD).toString('base64');

// Data Persistence Layer (File-backed memory store)
const DB_FILE = path.resolve(__dirname, 'jamr_data_store.json');

let sections: Section[] = [...DEFAULT_SECTIONS];
let topics: Topic[] = [...DEFAULT_TOPICS];
let questions: Question[] = [...DEFAULT_QUESTIONS];
let games: GameInfo[] = [...JAMR_GAMES_CATALOG];
let barrahCategories: BarrahCategory[] = [...DEFAULT_BARRAH_CATEGORIES];
let reports: BugReport[] = [];
let mimicSounds: MimicSoundItem[] = [...MIMIC_SOUNDS_BANK];

// Load persisted DB if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.sections) && parsed.sections.length > 0) {
      sections = parsed.sections;
    }
    if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
      // Reconcile topics to ensure every topic has sectionId and modern comic image
      const defMap = new Map(DEFAULT_TOPICS.map(t => [t.id, t]));
      topics = parsed.topics.map((t: Topic) => {
        const def = defMap.get(t.id);
        return {
          ...t,
          sectionId: t.sectionId || def?.sectionId || 'general',
          coverImage: t.coverImage || def?.coverImage || ''
        };
      });
      // Add any new default topics that weren't in the saved store
      for (const defT of DEFAULT_TOPICS) {
        if (!topics.some(t => t.id === defT.id)) {
          topics.push(defT);
        }
      }
    }
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      questions = parsed.questions;
      // Add any missing default questions
      for (const defQ of DEFAULT_QUESTIONS) {
        if (!questions.some(q => q.id === defQ.id)) {
          questions.push(defQ);
        }
      }
    }
    if (Array.isArray(parsed.games) && parsed.games.length > 0) {
      games = parsed.games;
      // Ensure all official default games are present
      for (const defG of JAMR_GAMES_CATALOG) {
        if (!games.some(g => g.id === defG.id)) {
          games.push(defG);
        }
      }
    }
    if (Array.isArray(parsed.barrahCategories) && parsed.barrahCategories.length > 0) {
      barrahCategories = parsed.barrahCategories;
      // Ensure all 20 default categories exist
      for (const defC of DEFAULT_BARRAH_CATEGORIES) {
        if (!barrahCategories.some(c => c.id === defC.id)) {
          barrahCategories.push(defC);
        }
      }
    }
    if (Array.isArray(parsed.mimicSounds) && parsed.mimicSounds.length > 0) {
      mimicSounds = parsed.mimicSounds;
    }
    if (Array.isArray(parsed.reports)) {
      reports = parsed.reports;
    }
  }
} catch (e) {
  console.error('Failed to load jamr_data_store.json:', e);
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ sections, topics, questions, games, barrahCategories, reports, mimicSounds }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save jamr_data_store.json:', err);
  }
}

// Online Match & Room State Store
interface ServerPlayer {
  id: string;
  name: string;
  team: 'team1' | 'team2' | 'spectator';
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  ws?: WebSocket;
}

interface ServerRoom {
  code: string;
  hostId: string;
  createdAt: number;
  lastActive: number;
  players: ServerPlayer[];
  gameId?: string;
  status?: 'lobby' | 'playing' | 'round_results' | 'game_over';
  maxPlayers?: number;
  currentRound?: number;
  totalRounds?: number;
  gameData?: any;
  match: JamrMatchState;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    team?: string;
    timestamp: number;
    isSystem?: boolean;
  }>;
  timerInterval?: NodeJS.Timeout;
}

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

// Generate the 6x6 matrix of BoardTiles for chosen 6 topics
function buildEmptyBoard(chosenTopics: Topic[], topicQuestions: Question[]): BoardTile[][] {
  const pointDistribution: (200 | 400 | 600)[] = [200, 200, 400, 400, 600, 600];
  const board: BoardTile[][] = [];

  for (let c = 0; c < 6; c++) {
    const col: BoardTile[] = [];
    const t = chosenTopics[c];
    const tQuestions = topicQuestions.filter(q => q.topicId === t.id);

    for (let r = 0; r < 6; r++) {
      const targetPoints = pointDistribution[r];
      // Find a matching question with points, or fallback
      let matchedQ = tQuestions.find(q => q.points === targetPoints);
      if (!matchedQ) {
        matchedQ = tQuestions[r] || {
          id: `gen-${t.id}-${r}`,
          topicId: t.id,
          points: targetPoints,
          difficulty: r < 2 ? 'easy' : r < 4 ? 'medium' : 'hard',
          questionText: `سؤال في موضوع ${t.title}`,
          answerText: 'الإجابة النموذجية',
          hints: []
        };
      }

      col.push({
        topicId: t.id,
        questionId: matchedQ.id,
        points: targetPoints,
        rowIdx: r,
        colIdx: c,
        isUsed: false
      });
    }
    board.push(col);
  }

  return board;
}

function createInitialMatch(chosenTopics?: Topic[], team1Name = 'الفريق الأول', team2Name = 'الفريق الثاني'): JamrMatchState {
  const selected = (chosenTopics && chosenTopics.length === 6)
    ? chosenTopics
    : topics.slice(0, 6);

  const board = buildEmptyBoard(selected, questions);

  return {
    id: 'match_' + Date.now(),
    mode: 'local',
    status: 'setup',
    teams: {
      team1: {
        id: 'team1',
        name: team1Name,
        color: '#EA580C', // Orange
        accentBg: '#FFF7ED',
        textColor: '#C2410C',
        score: 0,
        players: [],
        lifelines: {
          two_answers: true,
          call_friend: true,
          pitfall: true,
          bench_player: true,
          the_trap: true
        }
      },
      team2: {
        id: 'team2',
        name: team2Name,
        color: '#DC2626', // Crimson Red
        accentBg: '#FEF2F2',
        textColor: '#B91C1C',
        score: 0,
        players: [],
        lifelines: {
          two_answers: true,
          call_friend: true,
          pitfall: true,
          bench_player: true,
          the_trap: true
        }
      }
    },
    currentTurn: 'team1',
    topics: selected,
    board,
    settings: {
      timerSeconds: 30,
      deductOnWrong: false,
      allowSteal: true,
      lifelinesEnabled: true,
      tieBreakerEnabled: true
    },
    activeQuestion: null,
    history: []
  };
}

function broadcastRoom(room: ServerRoom) {
  room.lastActive = Date.now();

  // 1. Format for OnlineGameView (RoomState format)
  const roomStatePayload = JSON.stringify({
    type: 'room_state',
    room: {
      code: room.code,
      gameId: room.gameId || 'barrah_salfa',
      hostId: room.hostId,
      status: room.status || (room.match?.status === 'playing' ? 'playing' : 'lobby'),
      maxPlayers: room.maxPlayers || 16,
      currentRound: room.currentRound || 1,
      totalRounds: room.totalRounds || 5,
      timerSeconds: room.match?.activeQuestion?.remainingSeconds || 0,
      timerActive: !!room.match?.activeQuestion?.timerRunning,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isReady: p.isReady,
        connected: p.connected,
        score: p.team === 'team1' ? room.match?.teams?.team1?.score || 0 : p.team === 'team2' ? room.match?.teams?.team2?.score || 0 : 0,
        team: p.team
      })),
      messages: room.messages,
      lastActive: room.lastActive,
      gameData: room.gameData
    }
  });

  // 2. Format for OnlineMatchView (ServerRoom format)
  const roomUpdatePayload = JSON.stringify({
    type: 'room_update',
    room: {
      code: room.code,
      hostId: room.hostId,
      match: room.match,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        avatar: p.avatar,
        isHost: p.isHost,
        isReady: p.isReady,
        connected: p.connected
      })),
      messages: room.messages
    }
  });

  for (const p of room.players) {
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      try {
        p.ws.send(roomStatePayload);
        p.ws.send(roomUpdatePayload);
      } catch (err) {
        console.error('WebSocket send error:', err);
      }
    }
  }
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'جَمْر | JAMR - ولّع جمعتكم',
    topicsCount: topics.length,
    questionsCount: questions.length,
    activeRooms: rooms.size
  });
});

// Games Catalog Query
app.get('/api/games', (req, res) => {
  res.json({ games });
});

// Topics & Questions Public Query
app.get('/api/topics', (req, res) => {
  const result = topics.map(t => ({
    ...t,
    questionCount: questions.filter(q => q.topicId === t.id).length
  }));
  res.json({ topics: result });
});

app.get('/api/topics/:id/questions', (req, res) => {
  const tQuestions = questions.filter(q => q.topicId === req.params.id);
  res.json({ questions: tQuestions });
});

// Admin Authentication with Anti-Brute-Force Lockout
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { failedCount: 0, lockUntil: 0 };

  // Check if locked out
  if (attempt.lockUntil > now) {
    const remainingMin = Math.ceil((attempt.lockUntil - now) / 60000);
    return res.status(429).json({ 
      error: `تم حظر محاولات الدخول مؤقتاً بسبب تكرار المحاولات الخاطئة لحماية المنصة. يرجى المحاولة بعد ${remainingMin} دقيقة.` 
    });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'يرجى إدخال كلمة المرور السرية' });
  }

  if (password === ADMIN_PASSWORD) {
    // Reset lockout counter on success
    loginAttempts.delete(ip);
    return res.json({
      success: true,
      token: ADMIN_TOKEN,
      message: 'تم تسجيل الدخول بنجاح كمدير لمنصة جمر'
    });
  }

  // Failed attempt
  attempt.failedCount += 1;
  if (attempt.failedCount >= 5) {
    attempt.lockUntil = now + 15 * 60000; // 15 minutes lockout
    loginAttempts.set(ip, attempt);
    return res.status(429).json({
      error: 'تم تجاوز الحد المسموح من المحاولات (5 محاولات). تم قفل المحاولات لمدة 15 دقيقة لحماية السيرفر.'
    });
  } else {
    loginAttempts.set(ip, attempt);
    const left = 5 - attempt.failedCount;
    return res.status(401).json({ 
      error: `رمز الدخول غير صحيح! متبقي لديك ${left} محاولات قبل القفل المؤقت للأمان.` 
    });
  }
});

// Middleware for Admin Protected Endpoints
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح بالوصول' });
  }
  const token = authHeader.replace('Bearer ', '');
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'رمز الجلسة غير صالح' });
  }
  next();
}

// Sections Public Query
app.get('/api/sections', (req, res) => {
  const result = sections.map(s => ({
    ...s,
    topicCount: topics.filter(t => t.sectionId === s.id).length
  }));
  res.json({ sections: result });
});

// Admin Section Operations
app.post('/api/admin/sections', requireAdmin, (req, res) => {
  const { title, description, icon } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'اسم القسم مطلوب' });
  }
  const id = 'sec_' + Date.now() + Math.random().toString(36).substring(2, 5);
  const newSection: Section = {
    id,
    title: String(title).trim(),
    description: String(description || '').trim(),
    icon: icon || 'Sparkles',
    order: sections.length + 1
  };
  sections.push(newSection);
  saveDatabase();
  res.json({ success: true, section: newSection });
});

app.put('/api/admin/sections/:id', requireAdmin, (req, res) => {
  const idx = sections.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'القسم غير موجود' });
  }
  const { title, description, icon, order } = req.body;
  sections[idx] = {
    ...sections[idx],
    title: title ? String(title).trim() : sections[idx].title,
    description: description !== undefined ? String(description).trim() : sections[idx].description,
    icon: icon || sections[idx].icon,
    order: order !== undefined ? Number(order) : sections[idx].order
  };
  saveDatabase();
  res.json({ success: true, section: sections[idx] });
});

app.delete('/api/admin/sections/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  // If topics exist in this section, reassign them to general
  topics = topics.map(t => t.sectionId === id ? { ...t, sectionId: 'general' } : t);
  sections = sections.filter(s => s.id !== id);
  saveDatabase();
  res.json({ success: true, message: 'تم حذف القسم بنجاح' });
});

// Admin Topic Operations
app.post('/api/admin/topics', requireAdmin, (req, res) => {
  const { title, description, coverImage, sectionId, category, icon } = req.body;
  if (!title || !coverImage) {
    return res.status(400).json({ error: 'عنوان الموضوع وصورة الغلاف مطلوبة' });
  }
  const id = 'topic_' + Date.now() + Math.random().toString(36).substring(2, 5);
  const targetSectionId = sectionId || (sections[0]?.id || 'general');
  const matchedSec = sections.find(s => s.id === targetSectionId);

  const newTopic: Topic = {
    id,
    title: String(title).trim(),
    description: String(description || '').trim(),
    coverImage: String(coverImage).trim(),
    sectionId: targetSectionId,
    category: String(category || matchedSec?.title || 'عام').trim(),
    icon: icon || 'Sparkles',
    questionCount: 0,
    isPopular: false,
    createdAt: Date.now()
  };
  topics.unshift(newTopic);
  saveDatabase();
  res.json({ success: true, topic: newTopic });
});

app.put('/api/admin/topics/:id', requireAdmin, (req, res) => {
  const idx = topics.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الموضوع غير موجود' });
  }
  const { title, description, coverImage, sectionId, category, icon, isPopular } = req.body;
  const targetSectionId = sectionId || topics[idx].sectionId;
  const matchedSec = sections.find(s => s.id === targetSectionId);

  topics[idx] = {
    ...topics[idx],
    title: title ? String(title).trim() : topics[idx].title,
    description: description !== undefined ? String(description).trim() : topics[idx].description,
    coverImage: coverImage ? String(coverImage).trim() : topics[idx].coverImage,
    sectionId: targetSectionId,
    category: category ? String(category).trim() : (matchedSec?.title || topics[idx].category),
    icon: icon || topics[idx].icon,
    isPopular: isPopular !== undefined ? Boolean(isPopular) : topics[idx].isPopular
  };
  saveDatabase();
  res.json({ success: true, topic: topics[idx] });
});

app.put('/api/admin/topics/:id/image', requireAdmin, (req, res) => {
  const idx = topics.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الموضوع غير موجود' });
  }
  const { coverImage } = req.body;
  if (!coverImage) {
    return res.status(400).json({ error: 'رابط الصورة مطلوب' });
  }
  topics[idx].coverImage = String(coverImage).trim();
  saveDatabase();
  res.json({ success: true, topic: topics[idx], message: 'تم تحديث صورة الموضوع بنجاح' });
});

app.delete('/api/admin/topics/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  topics = topics.filter(t => t.id !== id);
  questions = questions.filter(q => q.topicId !== id);
  saveDatabase();
  res.json({ success: true, message: 'تم حذف الموضوع وأسئلته بنجاح' });
});

// Admin Question Operations
app.post('/api/admin/questions', requireAdmin, (req, res) => {
  const { topicId, points, questionText, answerText, hints, explanation, challengeType, mediaUrl, mediaType } = req.body;
  if (!topicId || !points || !questionText || !answerText) {
    return res.status(400).json({ error: 'الموضوع وقيمة النقاط ونص السؤال والإجابة مطلوبة' });
  }
  const qPoints = Number(points) as (200 | 400 | 600);
  const diff = qPoints <= 200 ? 'easy' : qPoints <= 400 ? 'medium' : 'hard';

  const cleanMediaUrl = mediaUrl ? String(mediaUrl).trim() : undefined;
  const inferredType = mediaType || (cleanMediaUrl ? (
    cleanMediaUrl.includes('youtube.com') || cleanMediaUrl.includes('youtu.be') || cleanMediaUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
      ? 'video'
      : 'image'
  ) : undefined);

  const newQ: Question = {
    id: 'q_' + Date.now() + Math.random().toString(36).substring(2, 6),
    topicId,
    points: qPoints,
    difficulty: diff,
    questionText: String(questionText).trim(),
    answerText: String(answerText).trim(),
    hints: Array.isArray(hints) ? hints.filter(Boolean) : [],
    explanation: explanation ? String(explanation).trim() : undefined,
    challengeType: challengeType || 'normal',
    mediaUrl: cleanMediaUrl,
    mediaType: cleanMediaUrl ? inferredType : undefined,
    createdAt: Date.now()
  };
  questions.push(newQ);
  saveDatabase();
  res.json({ success: true, question: newQ });
});

app.put('/api/admin/questions/:id', requireAdmin, (req, res) => {
  const idx = questions.findIndex(q => q.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'السؤال غير موجود' });
  }
  const { topicId, points, questionText, answerText, hints, explanation, challengeType, mediaUrl, mediaType } = req.body;
  const oldQ = questions[idx];
  const qPoints = points ? (Number(points) as (200 | 400 | 600)) : oldQ.points;
  const diff = qPoints <= 200 ? 'easy' : qPoints <= 400 ? 'medium' : 'hard';

  const targetMediaUrl = mediaUrl !== undefined ? (mediaUrl ? String(mediaUrl).trim() : undefined) : oldQ.mediaUrl;
  let targetMediaType = mediaType !== undefined ? mediaType : oldQ.mediaType;
  if (!targetMediaType && targetMediaUrl) {
    targetMediaType = (
      targetMediaUrl.includes('youtube.com') || targetMediaUrl.includes('youtu.be') || targetMediaUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
        ? 'video'
        : 'image'
    );
  }

  questions[idx] = {
    ...oldQ,
    topicId: topicId || oldQ.topicId,
    points: qPoints,
    difficulty: diff,
    questionText: questionText ? String(questionText).trim() : oldQ.questionText,
    answerText: answerText ? String(answerText).trim() : oldQ.answerText,
    hints: Array.isArray(hints) ? hints.filter(Boolean) : oldQ.hints,
    explanation: explanation !== undefined ? String(explanation).trim() : oldQ.explanation,
    challengeType: challengeType || oldQ.challengeType,
    mediaUrl: targetMediaUrl,
    mediaType: targetMediaUrl ? targetMediaType : undefined
  };
  saveDatabase();
  res.json({ success: true, question: questions[idx] });
});

app.delete('/api/admin/questions/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  questions = questions.filter(q => q.id !== id);
  saveDatabase();
  res.json({ success: true, message: 'تم حذف السؤال بنجاح' });
});

// Admin Games CRUD Operations
app.post('/api/admin/games', requireAdmin, (req, res) => {
  const { title, subtitle, category, categoryLabel, description, rules, minPlayers, maxPlayers, durationMinutes, difficulty, icon, accentColor, bgGradient, supportsOffline, supportsOnline, tags, engineType } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'اسم اللعبة مطلوب' });
  }
  const newGame: GameInfo = {
    id: 'game_' + Date.now() + Math.random().toString(36).substring(2, 6),
    title: String(title).trim(),
    subtitle: subtitle ? String(subtitle).trim() : 'لعبة جماعية ممتعة',
    category: category || 'party',
    categoryLabel: categoryLabel || 'جمعات وضحك',
    description: description ? String(description).trim() : '',
    rules: Array.isArray(rules) && rules.length > 0 ? rules.map(r => String(r).trim()).filter(Boolean) : ['اتبع تعليمات اللعبة وقواعد التنافس العادل.'],
    minPlayers: Number(minPlayers) || 2,
    maxPlayers: Number(maxPlayers) || 16,
    durationMinutes: durationMinutes ? String(durationMinutes).trim() : '15 دقيقة',
    difficulty: difficulty || 'متوسط',
    icon: icon || '🎮',
    accentColor: accentColor || '#f59e0b',
    bgGradient: bgGradient || 'from-amber-600/30 via-orange-950/40 to-black',
    tags: Array.isArray(tags) ? tags : ['لعبة جديدة'],
    supportsOffline: supportsOffline !== undefined ? Boolean(supportsOffline) : true,
    supportsOnline: supportsOnline !== undefined ? Boolean(supportsOnline) : false,
    engineType: engineType || 'trivia',
    isActive: true,
    isNew: true
  };
  games.push(newGame);
  saveDatabase();
  res.json({ success: true, game: newGame });
});

app.put('/api/admin/games/:id', requireAdmin, (req, res) => {
  const idx = games.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'اللعبة غير موجودة' });
  }
  const { title, subtitle, category, categoryLabel, description, rules, minPlayers, maxPlayers, durationMinutes, difficulty, icon, accentColor, bgGradient, supportsOffline, supportsOnline, tags, engineType, isPopular, isNew, isActive } = req.body;
  
  games[idx] = {
    ...games[idx],
    title: title ? String(title).trim() : games[idx].title,
    subtitle: subtitle !== undefined ? String(subtitle).trim() : games[idx].subtitle,
    category: category || games[idx].category,
    categoryLabel: categoryLabel || games[idx].categoryLabel,
    description: description !== undefined ? String(description).trim() : games[idx].description,
    rules: Array.isArray(rules) ? rules.map(r => String(r).trim()).filter(Boolean) : games[idx].rules,
    minPlayers: minPlayers !== undefined ? Number(minPlayers) : games[idx].minPlayers,
    maxPlayers: maxPlayers !== undefined ? Number(maxPlayers) : games[idx].maxPlayers,
    durationMinutes: durationMinutes !== undefined ? String(durationMinutes).trim() : games[idx].durationMinutes,
    difficulty: difficulty || games[idx].difficulty,
    icon: icon || games[idx].icon,
    accentColor: accentColor || games[idx].accentColor,
    bgGradient: bgGradient || games[idx].bgGradient,
    supportsOffline: supportsOffline !== undefined ? Boolean(supportsOffline) : games[idx].supportsOffline,
    supportsOnline: supportsOnline !== undefined ? Boolean(supportsOnline) : games[idx].supportsOnline,
    tags: Array.isArray(tags) ? tags : games[idx].tags,
    engineType: engineType || games[idx].engineType,
    isPopular: isPopular !== undefined ? Boolean(isPopular) : games[idx].isPopular,
    isNew: isNew !== undefined ? Boolean(isNew) : games[idx].isNew,
    isActive: isActive !== undefined ? Boolean(isActive) : games[idx].isActive
  };
  saveDatabase();
  res.json({ success: true, game: games[idx] });
});

app.delete('/api/admin/games/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  if (games.length <= 1) {
    return res.status(400).json({ error: 'لا يمكن حذف آخر لعبة في المنصة' });
  }
  games = games.filter(g => g.id !== id);
  saveDatabase();
  res.json({ success: true, message: 'تم حذف اللعبة بنجاح' });
});

app.post('/api/admin/games/reset', requireAdmin, (req, res) => {
  games = [...JAMR_GAMES_CATALOG];
  saveDatabase();
  res.json({ success: true, games });
});

// Admin AI Assistant for Generating & Modifying Games
app.post('/api/admin/ai/games', requireAdmin, async (req, res) => {
  try {
    const { prompt, action, baseGameId } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'يرجى كتابة وصف أو طلب للذكاء الاصطناعي' });
    }

    const baseGame = baseGameId ? games.find(g => g.id === baseGameId) : null;
    let generatedGame: Partial<GameInfo> | null = null;
    let explanation = '';

    // If GEMINI_API_KEY is available, use GoogleGenAI
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        const systemInstruction = `أنت مصمم ألعاب جماعية عربي محترف ومبتكر لمنصة ألعاب "جَمْر".
مهمتك: ${action === 'edit' && baseGame ? `تعديل اللعبة الموجودة حالياً (${baseGame.title}) بناءً على طلب المشرف التالي` : 'ابتكار لعبة جماعية عربية جديدة وممتعة جداً للجمعات والديوانيات بناءً على طلب المشرف'}.
يجب أن ترجع استجابتك بصيغة JSON فقط تطابق الحقول التالية:
{
  "title": "اسم اللعبة بالعربي",
  "subtitle": "شعار أو وصف فرعي جذاب",
  "category": "trivia" أو "words" أو "deduction" أو "drawing" أو "party",
  "categoryLabel": "أسئلة وتحدي" أو "كلمات وتخمين" أو "خداع واستنتاج" أو "رسم وتمثيل" أو "جمعات وضحك",
  "description": "شرح كامل للعبة وكيف تلعب بطريقة واضحة",
  "rules": ["قاعدة 1", "قاعدة 2", "قاعدة 3", "قاعدة 4"],
  "minPlayers": 2,
  "maxPlayers": 16,
  "durationMinutes": "15 - 25 دقيقة",
  "difficulty": "سهل" أو "متوسط" أو "حماسي" أو "صعب",
  "icon": "إيموجي معبر مثل 🎮 أو ⚡ أو 🦁",
  "supportsOffline": true,
  "supportsOnline": false,
  "tags": ["وسم 1", "وسم 2", "وسم 3"],
  "explanation": "شرح موجز للتعديلات أو الفكرة المبتكرة"
}`;

        const userContent = `طلب المشرف: "${prompt}".
${baseGame ? `بيانات اللعبة الأصلية:\n${JSON.stringify(baseGame, null, 2)}` : ''}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userContent,
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (parsed.title) {
          generatedGame = parsed;
          explanation = parsed.explanation || 'تم توليد وتعديل اللعبة بواسطة نموذج الذكاء الاصطناعي بنجاح';
        }
      } catch (err) {
        console.error('Gemini API call failed, falling back to smart synthesizer:', err);
      }
    }

    // Smart fallback synthesizer
    if (!generatedGame) {
      const cleanPrompt = prompt.trim();
      const isEdit = action === 'edit' && baseGame;
      const icons = ['🔥', '⚡', '🏆', '🎭', '🕵️', '🎲', '🧠', '🐝', '📺', '🚀', '🎯', '👑'];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];

      let inferredCategory: GameCategory = 'party';
      let inferredLabel = 'جمعات وضحك';
      if (cleanPrompt.includes('سؤال') || cleanPrompt.includes('معرفة') || cleanPrompt.includes('ثقافة') || cleanPrompt.includes('مسابقة')) {
        inferredCategory = 'trivia';
        inferredLabel = 'أسئلة وتحدي';
      } else if (cleanPrompt.includes('كلم') || cleanPrompt.includes('حرف') || cleanPrompt.includes('تخمين')) {
        inferredCategory = 'words';
        inferredLabel = 'كلمات وتخمين';
      } else if (cleanPrompt.includes('خداع') || cleanPrompt.includes('مافيا') || cleanPrompt.includes('جاسوس') || cleanPrompt.includes('سر')) {
        inferredCategory = 'deduction';
        inferredLabel = 'خداع واستنتاج';
      } else if (cleanPrompt.includes('رسم') || cleanPrompt.includes('تمثيل') || cleanPrompt.includes('تلفزيون')) {
        inferredCategory = 'drawing';
        inferredLabel = 'رسم وتمثيل';
      }

      const supportsOnline = cleanPrompt.includes('أونلاين') || cleanPrompt.includes('اونلاين') || cleanPrompt.includes('نت') || cleanPrompt.includes('شبكة');
      const supportsOffline = cleanPrompt.includes('أوفلاين') || cleanPrompt.includes('اوفلاين') || cleanPrompt.includes('جهاز واحد') || cleanPrompt.includes('ديوانية') || !supportsOnline;

      const baseTitle = isEdit ? baseGame.title : cleanPrompt.length <= 25 ? cleanPrompt : cleanPrompt.split(' ').slice(0, 4).join(' ');

      generatedGame = {
        title: isEdit ? `${baseGame.title} (مطور بالذكاء الاصطناعي)` : baseTitle,
        subtitle: isEdit ? `تحديث جديد: ${cleanPrompt.slice(0, 40)}` : `تحدي جماعي مشوق: ${cleanPrompt.slice(0, 40)}`,
        category: isEdit ? baseGame.category : inferredCategory,
        categoryLabel: isEdit ? baseGame.categoryLabel : inferredLabel,
        description: isEdit 
          ? `${baseGame.description} تم التطوير والتحديث وفق طلب المشرف: ${cleanPrompt}`
          : `لعبة تفاعلية مبتكرة للجمعات والأصدقاء. الفكرة: ${cleanPrompt}. مصممة لإشعال أجواء التنافس والضحك والسرعة بين اللاعبين.`,
        rules: isEdit ? [
          ...baseGame.rules,
          `قاعدة إضافية من الذكاء الاصطناعي: ${cleanPrompt}`
        ] : [
          'يجتمع اللاعبون في جلسة واحدة أو عبر غرف اللعب.',
          `يبدأ التحدي بناءً على الفكرة: ${cleanPrompt.slice(0, 50)}.`,
          'لكل جولة مؤقت سريع يتطلب الإجابة أو اتخاذ القرار فوراً.',
          'الفائز هو صاحب أعلى نقاط وسرعة بديهة في نهاية الجولات.'
        ],
        minPlayers: isEdit ? baseGame.minPlayers : 2,
        maxPlayers: isEdit ? baseGame.maxPlayers : 16,
        durationMinutes: isEdit ? baseGame.durationMinutes : '15 - 20 دقيقة',
        difficulty: 'حماسي',
        icon: isEdit ? baseGame.icon : randomIcon,
        supportsOffline: supportsOffline,
        supportsOnline: supportsOnline,
        tags: isEdit ? [...baseGame.tags, 'مطور بالذكاء الاصطناعي'] : ['ابتكار الذكاء الاصطناعي', 'جمعات وديوانيات', 'حماس']
      };
      explanation = isEdit 
        ? `تم تعديل وتطوير لعبة "${baseGame.title}" بنجاح بناءً على توجيهاتك.` 
        : `تم ابتكار وتوليد لعبة "${generatedGame.title}" بالكامل وتجهيز قواعدها وشرحها.`;
    }

    res.json({
      success: true,
      game: generatedGame,
      explanation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ في توليد اللعبة بالذكاء الاصطناعي' });
  }
});

// Admin Import & Export
app.get('/api/admin/export', requireAdmin, (req, res) => {
  res.json({
    platform: 'JAMR - جَمْر',
    exportDate: new Date().toISOString(),
    topics,
    questions,
    games
  });
});

app.post('/api/admin/import', requireAdmin, (req, res) => {
  const { importedTopics, importedQuestions, importedGames, mode } = req.body;
  if (!Array.isArray(importedTopics) && !Array.isArray(importedQuestions) && !Array.isArray(importedGames)) {
    return res.status(400).json({ error: 'البيانات غير صالحة للاستيراد' });
  }
  if (mode === 'replace') {
    if (Array.isArray(importedTopics)) topics = importedTopics;
    if (Array.isArray(importedQuestions)) questions = importedQuestions;
    if (Array.isArray(importedGames)) games = importedGames;
  } else {
    // Append unique
    if (Array.isArray(importedTopics)) {
      for (const t of importedTopics) {
        if (!topics.some(existing => existing.id === t.id)) {
          topics.push(t);
        }
      }
    }
    if (Array.isArray(importedQuestions)) {
      for (const q of importedQuestions) {
        if (!questions.some(existing => existing.id === q.id)) {
          questions.push(q);
        }
      }
    }
    if (Array.isArray(importedGames)) {
      for (const g of importedGames) {
        if (!games.some(existing => existing.id === g.id)) {
          games.push(g);
        }
      }
    }
  }
  saveDatabase();
  res.json({
    success: true,
    totalTopics: topics.length,
    totalQuestions: questions.length,
    totalGames: games.length
  });
});

// ==================== BARRAH SALFA CATEGORIES API ====================
app.get('/api/barrah/categories', (req, res) => {
  res.json({ categories: barrahCategories });
});

app.post('/api/admin/barrah/categories', requireAdmin, (req, res) => {
  const { name, icon, description, words } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'يرجى كتابة اسم القسم' });
  }
  const cleanWords = Array.isArray(words) 
    ? words.map((w: any) => sanitizeText(w, 80)).filter(Boolean)
    : [];

  const newCat: BarrahCategory = {
    id: 'c-' + Date.now(),
    name: sanitizeText(name, 80),
    icon: sanitizeText(icon || '💬', 10),
    description: sanitizeText(description || '', 200),
    words: cleanWords.length > 0 ? cleanWords : ['سالفة أولى', 'سالفة ثانية']
  };

  barrahCategories.push(newCat);
  saveDatabase();
  res.json({ success: true, category: newCat });
});

app.put('/api/admin/barrah/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = barrahCategories.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'القسم غير موجود' });
  }

  const { name, icon, description, words } = req.body;
  if (name) barrahCategories[idx].name = sanitizeText(name, 80);
  if (icon) barrahCategories[idx].icon = sanitizeText(icon, 10);
  if (description !== undefined) barrahCategories[idx].description = sanitizeText(description, 200);
  if (Array.isArray(words)) {
    barrahCategories[idx].words = words.map((w: any) => sanitizeText(w, 80)).filter(Boolean);
  }

  saveDatabase();
  res.json({ success: true, category: barrahCategories[idx] });
});

app.delete('/api/admin/barrah/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  barrahCategories = barrahCategories.filter(c => c.id !== id);
  saveDatabase();
  res.json({ success: true });
});

// ==================== MIMIC SOUNDS API ====================
app.get('/api/mimic/sounds', (req, res) => {
  res.json({ success: true, sounds: mimicSounds });
});

app.post('/api/admin/mimic/sounds', requireAdmin, (req, res) => {
  const { title, category, description, soundType, audioClipText, targetDurationSec, audioUrl, icon } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'عنوان الصوت مطلوب' });
  }
  const newSound: MimicSoundItem = {
    id: 'mimic_' + Date.now() + Math.random().toString(36).substring(2, 6),
    title: sanitizeText(title, 80),
    category: sanitizeText(category || 'ميمز وترند', 50),
    description: sanitizeText(description || '', 200),
    soundType: sanitizeText(soundType || 'bark', 40),
    audioClipText: sanitizeText(audioClipText || '', 100),
    targetDurationSec: Number(targetDurationSec) || 4,
    audioUrl: audioUrl ? String(audioUrl) : undefined,
    icon: icon ? sanitizeText(icon, 10) : '🎙️'
  };
  mimicSounds.unshift(newSound);
  saveDatabase();
  res.json({ success: true, sound: newSound });
});

app.put('/api/admin/mimic/sounds/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = mimicSounds.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الصوت غير موجود' });
  }
  const { title, category, description, soundType, audioClipText, targetDurationSec, audioUrl, icon } = req.body;
  mimicSounds[idx] = {
    ...mimicSounds[idx],
    title: title ? sanitizeText(title, 80) : mimicSounds[idx].title,
    category: category ? sanitizeText(category, 50) : mimicSounds[idx].category,
    description: description !== undefined ? sanitizeText(description, 200) : mimicSounds[idx].description,
    soundType: soundType ? sanitizeText(soundType, 40) : mimicSounds[idx].soundType,
    audioClipText: audioClipText !== undefined ? sanitizeText(audioClipText, 100) : mimicSounds[idx].audioClipText,
    targetDurationSec: targetDurationSec !== undefined ? Number(targetDurationSec) : mimicSounds[idx].targetDurationSec,
    audioUrl: audioUrl !== undefined ? (audioUrl ? String(audioUrl) : undefined) : mimicSounds[idx].audioUrl,
    icon: icon ? sanitizeText(icon, 10) : mimicSounds[idx].icon
  };
  saveDatabase();
  res.json({ success: true, sound: mimicSounds[idx] });
});

app.delete('/api/admin/mimic/sounds/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  mimicSounds = mimicSounds.filter(s => s.id !== id);
  saveDatabase();
  res.json({ success: true });
});

// ==================== BUG REPORTS API ====================
app.post('/api/reports', (req, res) => {
  const { type, gameTitle, description, reporterName, reporterContact } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'يرجى كتابة تفاصيل البلاغ عن الخلل' });
  }

  const report: BugReport = {
    id: 'rep_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type: sanitizeText(type || 'game_bug', 50),
    gameTitle: sanitizeText(gameTitle || 'عام', 80),
    description: sanitizeText(description, 1000),
    reporterName: sanitizeText(reporterName || 'لاعب مجهول', 80),
    reporterContact: sanitizeText(reporterContact || '', 100),
    createdAt: new Date().toISOString(),
    status: 'new'
  };

  reports.unshift(report);
  saveDatabase();
  res.json({ success: true, message: 'تم إرسال البلاغ للإدارة فوراً، شكراً لمساعدتك في تطوير المنصة!' });
});

app.get('/api/admin/reports', requireAdmin, (req, res) => {
  res.json({ reports });
});

app.put('/api/admin/reports/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const report = reports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: 'البلاغ غير موجود' });
  }
  if (status === 'new' || status === 'investigating' || status === 'resolved') {
    report.status = status;
    saveDatabase();
    return res.json({ success: true, report });
  }
  res.status(400).json({ error: 'حالة غير صالحة' });
});

app.delete('/api/admin/reports/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  reports = reports.filter(r => r.id !== id);
  saveDatabase();
  res.json({ success: true });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({
    totalTopics: topics.length,
    totalQuestions: questions.length,
    activeRoomsCount: rooms.size,
    rooms: Array.from(rooms.values()).map(r => ({
      code: r.code,
      hostName: r.players.find(p => p.isHost)?.name || 'غير معروف',
      playerCount: r.players.length,
      createdAt: r.createdAt,
      status: r.match.status,
      scores: {
        team1: r.match.teams.team1.score,
        team2: r.match.teams.team2.score
      }
    }))
  });
});

// Online Room Creation & Retrieval
app.post('/api/rooms/create', (req, res) => {
  const { hostName, avatar, chosenTopicIds } = req.body;
  const code = generateRoomCode();
  const hostId = 'p_' + Date.now() + Math.random().toString(36).substring(2, 6);

  let selectedTopics = topics.slice(0, 6);
  if (Array.isArray(chosenTopicIds) && chosenTopicIds.length === 6) {
    const custom = chosenTopicIds.map((id: string) => topics.find(t => t.id === id)).filter(Boolean) as Topic[];
    if (custom.length === 6) selectedTopics = custom;
  }

  const match = createInitialMatch(selectedTopics);
  match.mode = 'online';

  const hostPlayer: ServerPlayer = {
    id: hostId,
    name: hostName ? String(hostName).trim() : 'المضيف',
    team: 'team1',
    avatar: avatar || '🔥',
    isHost: true,
    isReady: true,
    connected: false
  };

  const newRoom: ServerRoom = {
    code,
    hostId,
    createdAt: Date.now(),
    lastActive: Date.now(),
    players: [hostPlayer],
    match,
    messages: [
      {
        id: 'msg_welcome',
        senderId: 'system',
        senderName: 'جَمْر',
        text: `أهلاً بكم في غرفة جمر! رمز الغرفة: ${code}`,
        timestamp: Date.now(),
        isSystem: true
      }
    ]
  };

  rooms.set(code, newRoom);
  res.json({ success: true, code, playerId: hostId, match });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code?.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'الغرفة غير موجودة أو انتهت' });
  }
  res.json({
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      team: p.team,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      connected: p.connected
    })),
    match: room.match,
    messages: room.messages
  });
});

// Realtime WebSocket Server for Live Matches
wss.on('connection', (ws) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const type = msg.type;

      // 0. Create Room over WebSocket
      if (type === 'create_room') {
        const code = generateRoomCode();
        const hostId = 'p_' + Date.now() + Math.random().toString(36).substring(2, 6);
        const hostName = String(msg.playerName || msg.name || 'المضيف').trim();
        const hostAvatar = msg.avatar || '🔥';
        const gameId = msg.gameId || 'barrah_salfa';

        currentRoomCode = code;
        currentPlayerId = hostId;

        const hostPlayer: ServerPlayer = {
          id: hostId,
          name: hostName,
          team: 'team1',
          avatar: hostAvatar,
          isHost: true,
          isReady: true,
          connected: true,
          ws
        };

        const newRoom: ServerRoom = {
          code,
          hostId,
          createdAt: Date.now(),
          lastActive: Date.now(),
          players: [hostPlayer],
          gameId,
          status: 'lobby',
          match: createInitialMatch(topics.slice(0, 6)),
          messages: [
            {
              id: 'msg_welcome',
              senderId: 'system',
              senderName: 'جَمْر',
              text: `أهلاً بكم في غرفة جمر! رمز الغرفة: ${code}`,
              timestamp: Date.now(),
              isSystem: true
            }
          ]
        };

        if (gameId === 'ism_hayawan') {
          newRoom.maxPlayers = 100;
          newRoom.totalRounds = msg.totalRounds || 5;
          newRoom.gameData = {
            currentLetter: 'س',
            stage: 'lobby',
            isJudgeRoom: Boolean(msg.isJudge),
            judgeId: msg.isJudge ? hostId : undefined,
            isStopped: false,
            submissions: {},
            totalRounds: msg.totalRounds || 5,
            currentRound: 1
          };
        }

        rooms.set(code, newRoom);

        ws.send(JSON.stringify({
          type: 'joined',
          roomCode: code,
          playerId: hostId,
          room: {
            code,
            gameId,
            hostId,
            status: 'lobby',
            maxPlayers: 16,
            players: [{
              id: hostId,
              name: hostName,
              avatar: hostAvatar,
              isHost: true,
              isReady: true,
              connected: true
            }],
            currentRound: 1,
            totalRounds: 5,
            timerSeconds: 0,
            timerActive: false,
            messages: newRoom.messages,
            lastActive: Date.now()
          }
        }));

        ws.send(JSON.stringify({
          type: 'joined_success',
          playerId: hostId,
          isHost: true,
          team: 'team1'
        }));

        broadcastRoom(newRoom);
        return;
      }

      // 1. Join Room (Allow joining even after an hour if match not ended)
      if (type === 'join_room') {
        const rawCode = msg.code || msg.roomCode || '';
        const normalizedCode = String(rawCode).toUpperCase().trim();
        const pName = String(msg.playerName || msg.name || 'لاعب جمر').trim();
        const pAvatar = msg.avatar || '⚡';
        const pId = msg.playerId || msg.existingPlayerId;

        const room = rooms.get(normalizedCode);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'الغرفة غير موجودة أو انتهت' }));
          return;
        }

        currentRoomCode = normalizedCode;
        let player = pId ? room.players.find(p => p.id === pId) : null;
        if (!player) {
          const newPlayerId = pId || ('p_' + Date.now() + Math.random().toString(36).substring(2, 6));
          const t1Count = room.players.filter(p => p.team === 'team1').length;
          const t2Count = room.players.filter(p => p.team === 'team2').length;
          const assignedTeam = msg.team || (t1Count <= t2Count ? 'team1' : 'team2');

          player = {
            id: newPlayerId,
            name: pName,
            team: assignedTeam,
            avatar: pAvatar,
            isHost: room.players.length === 0,
            isReady: false,
            connected: true,
            ws
          };
          room.players.push(player);
          currentPlayerId = newPlayerId;

          room.messages.push({
            id: 'sys_' + Date.now(),
            senderId: 'system',
            senderName: 'جَمْر',
            text: `انضم ${player.name} إلى الغرفة! 🎉`,
            timestamp: Date.now(),
            isSystem: true
          });
        } else {
          player.connected = true;
          player.ws = ws;
          currentPlayerId = player.id;
          if (pName) player.name = pName;
          if (pAvatar) player.avatar = pAvatar;
        }

        ws.send(JSON.stringify({
          type: 'joined_success',
          playerId: player.id,
          isHost: player.isHost,
          team: player.team
        }));

        ws.send(JSON.stringify({
          type: 'joined',
          roomCode: room.code,
          playerId: player.id,
          room: {
            code: room.code,
            gameId: room.gameId || 'barrah_salfa',
            hostId: room.hostId,
            status: room.status || 'lobby',
            maxPlayers: room.maxPlayers || 16,
            players: room.players.map(p => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              isHost: p.isHost,
              isReady: p.isReady,
              connected: p.connected,
              team: p.team
            })),
            currentRound: room.currentRound || 1,
            totalRounds: room.totalRounds || 5,
            timerSeconds: 0,
            timerActive: false,
            messages: room.messages,
            lastActive: Date.now(),
            gameData: room.gameData
          }
        }));

        broadcastRoom(room);
        return;
      }

      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const player = room.players.find(p => p.id === currentPlayerId);
      if (!player) return;

      // 2. Change Team / Toggle Ready
      if (type === 'set_team') {
        const { targetTeam } = msg;
        if (targetTeam === 'team1' || targetTeam === 'team2' || targetTeam === 'spectator') {
          player.team = targetTeam;
          broadcastRoom(room);
        }
        return;
      }

      if (type === 'toggle_ready') {
        player.isReady = !player.isReady;
        broadcastRoom(room);
        return;
      }

      // 3. Configure and Start Match (Host Only)
      if (type === 'start_match') {
        if (!player.isHost) return;
        const { chosenTopicIds, team1Name, team2Name, timerSeconds, deductOnWrong } = msg;

        let selected = topics.slice(0, 6);
        if (Array.isArray(chosenTopicIds) && chosenTopicIds.length === 6) {
          const custom = chosenTopicIds.map((id: string) => topics.find(t => t.id === id)).filter(Boolean) as Topic[];
          if (custom.length === 6) selected = custom;
        }

        const freshMatch = createInitialMatch(
          selected,
          team1Name || room.match.teams.team1.name,
          team2Name || room.match.teams.team2.name
        );
        freshMatch.mode = 'online';
        freshMatch.status = 'playing';
        if (timerSeconds) freshMatch.settings.timerSeconds = Number(timerSeconds);
        if (deductOnWrong !== undefined) freshMatch.settings.deductOnWrong = Boolean(deductOnWrong);

        // Populate team player lists
        freshMatch.teams.team1.players = room.players.filter(p => p.team === 'team1').map(p => p.name);
        freshMatch.teams.team2.players = room.players.filter(p => p.team === 'team2').map(p => p.name);

        room.match = freshMatch;
        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'جَمْر',
          text: '🔥 بدأت المباراة بين الفريقين! أوقدوا الحماس!',
          timestamp: Date.now(),
          isSystem: true
        });

        broadcastRoom(room);
        return;
      }

      // 4. Select Board Tile (Turn team or Host)
      if (type === 'select_tile') {
        const { col, row } = msg;
        const tile = room.match.board[col]?.[row];
        if (!tile || tile.isUsed) return;

        const q = questions.find(item => item.id === tile.questionId);
        const t = room.match.topics[col];
        if (!q || !t) return;

        room.match.activeQuestion = {
          tile: { col, row },
          question: q,
          topic: t,
          choosingTeam: room.match.currentTurn,
          answeringTeam: room.match.currentTurn,
          status: 'question_shown',
          remainingSeconds: room.match.settings.timerSeconds,
          timerRunning: true
        };

        // Clear existing timer interval if any
        if (room.timerInterval) clearInterval(room.timerInterval);

        // Start server synchronized clock
        room.timerInterval = setInterval(() => {
          if (room.match.activeQuestion && room.match.activeQuestion.timerRunning) {
            room.match.activeQuestion.remainingSeconds -= 1;
            if (room.match.activeQuestion.remainingSeconds <= 0) {
              room.match.activeQuestion.remainingSeconds = 0;
              room.match.activeQuestion.timerRunning = false;
              if (room.timerInterval) clearInterval(room.timerInterval);
            }
            broadcastRoom(room);
          }
        }, 1000);

        broadcastRoom(room);
        return;
      }

      // 5. Timer Controls (Host)
      if (type === 'timer_action') {
        if (!player.isHost) return;
        const { action } = msg;
        if (!room.match.activeQuestion) return;

        if (action === 'pause') {
          room.match.activeQuestion.timerRunning = false;
        } else if (action === 'resume') {
          room.match.activeQuestion.timerRunning = true;
        } else if (action === 'add30') {
          room.match.activeQuestion.remainingSeconds += 30;
        }
        broadcastRoom(room);
        return;
      }

      // 5b. Swap / Alternate Question dynamically
      if (type === 'swap_question') {
        if (!player.isHost) return;
        if (!room.match.activeQuestion) return;
        const currentQ = room.match.activeQuestion.question;
        const topicId = room.match.activeQuestion.topic.id;
        const alternatives = questions.filter(q => q.topicId === topicId && q.id !== currentQ.id);
        const pool = alternatives.filter(q => q.points === room.match.activeQuestion!.question.points);
        const finalPool = pool.length > 0 ? pool : alternatives;
        if (finalPool.length > 0) {
          const nextQ = finalPool[Math.floor(Math.random() * finalPool.length)];
          room.match.activeQuestion.question = nextQ;
          room.match.activeQuestion.status = 'question_shown';
          room.match.activeQuestion.remainingSeconds = room.match.settings.timerSeconds || 30;
          room.match.activeQuestion.timerRunning = true;
          broadcastRoom(room);
        }
        return;
      }

      // 6. Use Lifeline
      if (type === 'use_lifeline') {
        const { lifelineType } = msg as { lifelineType: LifelineType };
        if (!room.match.activeQuestion) return;
        const teamId = room.match.activeQuestion.answeringTeam;
        const teamObj = room.match.teams[teamId];

        if (!teamObj.lifelines[lifelineType]) {
          return; // Already used
        }

        teamObj.lifelines[lifelineType] = false;

        if (lifelineType === 'call_friend') {
          room.match.activeQuestion.remainingSeconds += 30;
        } else if (lifelineType === 'two_answers') {
          room.match.activeQuestion.twoAnswersAttemptsLeft = 2;
        } else if (lifelineType === 'the_trap') {
          // Redirect question to opposite team
          const oppTeam = teamId === 'team1' ? 'team2' : 'team1';
          room.match.activeQuestion.answeringTeam = oppTeam;
        }

        room.match.activeQuestion.activeLifeline = {
          type: lifelineType,
          teamId,
          detail: `استخدم ${teamObj.name} وسيلة: ${lifelineType}`
        };

        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'جَمْر',
          text: `⚡ أطلق ${teamObj.name} وسيلة مساعدة: ${lifelineType}`,
          timestamp: Date.now(),
          isSystem: true
        });

        broadcastRoom(room);
        return;
      }

      // 7. Reveal Answer (Host)
      if (type === 'reveal_answer') {
        if (!player.isHost) return;
        if (!room.match.activeQuestion) return;
        room.match.activeQuestion.status = 'answer_revealed';
        room.match.activeQuestion.timerRunning = false;
        if (room.timerInterval) clearInterval(room.timerInterval);
        broadcastRoom(room);
        return;
      }

      // 8. Award Points / Complete Tile (Host)
      if (type === 'award_points') {
        if (!player.isHost) return;
        const { resultTeam } = msg; // 'team1' | 'team2' | 'pass'
        const active = room.match.activeQuestion;
        if (!active) return;

        const tile = room.match.board[active.tile.col][active.tile.row];
        tile.isUsed = true;

        if (resultTeam === 'team1' || resultTeam === 'team2') {
          const awarded = tile.points;
          const winningTeam = resultTeam as 'team1' | 'team2';
          room.match.teams[winningTeam].score += awarded;
          tile.answeredBy = winningTeam;
          tile.pointsAwarded = awarded;

          room.match.history.push({
            id: 'h_' + Date.now(),
            timestamp: Date.now(),
            teamId: winningTeam,
            action: 'إجابة صحيحة',
            pointsDelta: awarded,
            note: `فاز ${room.match.teams[winningTeam].name} بـ ${awarded} نقطة في موضوع ${active.topic.title}`
          });
        } else {
          // Pass or wrong
          tile.answeredBy = 'none';
          if (room.match.settings.deductOnWrong) {
            const answeringTeam = active.answeringTeam as 'team1' | 'team2';
            room.match.teams[answeringTeam].score -= tile.points;
            room.match.history.push({
              id: 'h_' + Date.now(),
              timestamp: Date.now(),
              teamId: answeringTeam,
              action: 'خصم نقاط',
              pointsDelta: -tile.points,
              note: `خصم ${tile.points} نقطة من ${room.match.teams[answeringTeam].name}`
            });
          }
        }

        // Switch active turn to opposite team
        room.match.currentTurn = room.match.currentTurn === 'team1' ? 'team2' : 'team1';
        room.match.activeQuestion = null;

        // Check if all tiles are completed
        const allUsed = room.match.board.every(col => col.every(tile => tile.isUsed));
        if (allUsed) {
          room.match.status = 'game_over';
          const s1 = room.match.teams.team1.score;
          const s2 = room.match.teams.team2.score;
          if (s1 > s2) room.match.winner = 'team1';
          else if (s2 > s1) room.match.winner = 'team2';
          else room.match.winner = 'tie';
        }

        broadcastRoom(room);
        return;
      }

      // 9. Rematch / Reset Board (Host)
      if (type === 'rematch') {
        if (!player.isHost) return;
        const fresh = createInitialMatch(
          room.match.topics,
          room.match.teams.team1.name,
          room.match.teams.team2.name
        );
        fresh.mode = 'online';
        fresh.status = 'playing';
        fresh.teams.team1.players = room.players.filter(p => p.team === 'team1').map(p => p.name);
        fresh.teams.team2.players = room.players.filter(p => p.team === 'team2').map(p => p.name);
        room.match = fresh;
        broadcastRoom(room);
        return;
      }

      // 10. Chat & Emoji Reactions (Broadcast to all clients in the room)
      if (type === 'chat_message' || type === 'send_chat') {
        const text = String(msg.text || '').trim().substring(0, 300);
        if (text) {
          const chatMsg = {
            id: 'c_' + Date.now() + Math.random().toString(36).substring(2, 6),
            senderId: player.id,
            senderName: player.name,
            team: player.team,
            text,
            timestamp: Date.now()
          };
          room.messages.push(chatMsg);
          if (room.messages.length > 80) room.messages.shift();
          broadcastRoom(room);
        }
        return;
      }

      // 11. Kick Player (Host only, notifies kicked player and broadcasts update)
      if (type === 'kick_player') {
        if (!player.isHost) return;
        const targetId = msg.targetPlayerId || msg.playerIdToKick;
        if (!targetId) return;

        const targetPlayer = room.players.find(p => p.id === targetId);
        if (targetPlayer) {
          if (targetPlayer.ws && targetPlayer.ws.readyState === WebSocket.OPEN) {
            try {
              targetPlayer.ws.send(JSON.stringify({
                type: 'kicked',
                message: 'تم استبعادك من الغرفة بواسطة المضيف.'
              }));
            } catch (_) {}
          }

          room.players = room.players.filter(p => p.id !== targetId);
          room.messages.push({
            id: 'sys_' + Date.now(),
            senderId: 'system',
            senderName: 'جَمْر',
            text: `تم استبعاد ${targetPlayer.name} من الغرفة.`,
            timestamp: Date.now(),
            isSystem: true
          });
          broadcastRoom(room);
        }
        return;
      }

      // 12. Real WebRTC Voice Chat Signaling
      if (type === 'voice_signal') {
        const { toPlayerId, signal } = msg;
        if (toPlayerId) {
          const target = room.players.find(p => p.id === toPlayerId);
          if (target && target.ws && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'voice_signal',
              fromPlayerId: player.id,
              signal
            }));
          }
        } else {
          for (const p of room.players) {
            if (p.id !== player.id && p.ws && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: 'voice_signal',
                fromPlayerId: player.id,
                signal
              }));
            }
          }
        }
        return;
      }

      // 13. General Game Room Lifecycle (Host Actions)
      if (type === 'start_game') {
        if (!player.isHost) return;
        room.status = 'playing';
        room.currentRound = 1;
        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'جَمْر',
          text: '🔥 بدأت اللعبة للجميع! ولّعوا الحماس!',
          timestamp: Date.now(),
          isSystem: true
        });
        broadcastRoom(room);
        return;
      }

      if (type === 'change_game') {
        if (!player.isHost) return;
        room.gameId = msg.gameId;
        room.status = 'lobby';
        room.gameData = undefined;
        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'جَمْر',
          text: `تم تغيير اللعبة إلى: ${msg.gameTitle || msg.gameId}`,
          timestamp: Date.now(),
          isSystem: true
        });
        broadcastRoom(room);
        return;
      }

      if (type === 'next_round') {
        if (!player.isHost) return;
        room.currentRound = (room.currentRound || 1) + 1;
        broadcastRoom(room);
        return;
      }

      if (type === 'return_to_lobby') {
        if (!player.isHost) return;
        room.status = 'lobby';
        broadcastRoom(room);
        return;
      }

      if (type === 'submit_answer') {
        if (!room.gameData) room.gameData = {};
        if (!room.gameData.playerAnswers) room.gameData.playerAnswers = {};
        room.gameData.playerAnswers[player.id] = msg.answer;
        broadcastRoom(room);
        return;
      }

      if (type === 'vote_player') {
        if (!room.gameData) room.gameData = {};
        if (!room.gameData.votes) room.gameData.votes = {};
        const tid = msg.targetPlayerId;
        room.gameData.votes[tid] = (room.gameData.votes[tid] || 0) + 1;
        broadcastRoom(room);
        return;
      }

      // ================= ISM HAYAWAN ENGINE ACTIONS =================
      if (type === 'ism_hayawan_set_letter') {
        if (!room.gameData) room.gameData = {};
        room.gameData.currentLetter = msg.letter || 'س';
        room.gameData.stage = 'writing';
        room.gameData.isStopped = false;
        room.gameData.stoppedBy = undefined;
        room.gameData.submissions = {};
        room.gameData.currentDispute = undefined;
        room.status = 'playing';
        broadcastRoom(room);
        return;
      }

      if (type === 'ism_hayawan_stop') {
        if (!room.gameData) room.gameData = {};
        if (room.gameData.isStopped) return; // already stopped
        room.gameData.isStopped = true;
        room.gameData.stoppedBy = { id: player.id, name: player.name };
        room.gameData.stage = 'scoring';

        // Store this player's inputs
        if (!room.gameData.submissions) room.gameData.submissions = {};
        room.gameData.submissions[player.id] = {
          playerId: player.id,
          playerName: player.name,
          ...(msg.inputs || {}),
          scores: { name: 0, animal: 0, plant: 0, thing: 0, country: 0, total: 0 }
        };

        // Intelligent scoring calculation
        const targetLetter = (room.gameData.currentLetter || 'س').trim().replace('هـ', 'ه');
        const normalizeStr = (str: string) => {
          if (!str) return '';
          return str
            .trim()
            .toLowerCase()
            .replace(/[\u064B-\u0652]/g, '')
            .replace(/[إأآا]/g, 'ا')
            .replace(/[ةه]/g, 'ه')
            .replace(/[يى]/g, 'ي')
            .replace(/[\s\-_]+/g, '');
        };
        const checkStart = (word: string) => {
          if (!word || word.trim().length === 0) return false;
          const f = word.trim().charAt(0);
          if (['ا', 'أ', 'إ', 'آ'].includes(targetLetter) && ['ا', 'أ', 'إ', 'آ'].includes(f)) return true;
          if (['ه', 'ة'].includes(targetLetter) && ['ه', 'ة'].includes(f)) return true;
          return f === targetLetter;
        };

        const subsList = Object.values(room.gameData.submissions) as any[];
        const fields: Array<'name' | 'animal' | 'plant' | 'thing' | 'country'> = ['name', 'animal', 'plant', 'thing', 'country'];

        fields.forEach(field => {
          subsList.forEach(s => {
            const raw = (s[field] || '').trim();
            if (!raw || !checkStart(raw)) {
              s.scores[field] = 0;
              return;
            }
            const norm = normalizeStr(raw);
            const duplicates = subsList.filter(o => o !== s && checkStart((o[field] || '').trim()) && normalizeStr((o[field] || '').trim()) === norm);
            s.scores[field] = duplicates.length > 0 ? 5 : 10;
          });
        });

        // Sum round scores and update players' total points
        subsList.forEach(s => {
          s.scores.total = s.scores.name + s.scores.animal + s.scores.plant + s.scores.thing + s.scores.country;
          const pRecord = room.players.find(p => p.id === s.playerId);
          if (pRecord) {
            (pRecord as any).score = ((pRecord as any).score || 0) + s.scores.total;
          }
        });

        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'جَمْر',
          text: `🚨 ${player.name} ضغط ستوب! انتهى وقت الكتابة وبدأ تدقيق النقاط.`,
          timestamp: Date.now(),
          isSystem: true
        });

        broadcastRoom(room);
        return;
      }

      if (type === 'ism_hayawan_dispute') {
        if (!room.gameData) room.gameData = {};
        room.gameData.currentDispute = msg.dispute;
        broadcastRoom(room);
        return;
      }

      if (type === 'ism_hayawan_resolve_dispute') {
        if (!room.gameData || !room.gameData.currentDispute) return;
        const disp = room.gameData.currentDispute;
        const isValid = Boolean(msg.isValid);
        const sub = room.gameData.submissions?.[disp.playerId];
        if (sub) {
          const oldScore = sub.scores[disp.field] || 0;
          const newScore = isValid ? 10 : 0;
          const diff = newScore - oldScore;
          sub.scores[disp.field] = newScore;
          sub.scores.total += diff;
          const pRecord = room.players.find(p => p.id === disp.playerId);
          if (pRecord) {
            (pRecord as any).score = Math.max(0, ((pRecord as any).score || 0) + diff);
          }
        }
        room.gameData.currentDispute = undefined;
        broadcastRoom(room);
        return;
      }

      if (type === 'ism_hayawan_judge_score_adjust') {
        const isAllowed = player.isHost || (room.gameData && room.gameData.judgeId === player.id);
        if (!isAllowed) return;
        const targetP = room.players.find(p => p.id === msg.targetPlayerId);
        if (targetP) {
          (targetP as any).score = Math.max(0, ((targetP as any).score || 0) + (Number(msg.delta) || 0));
        }
        broadcastRoom(room);
        return;
      }
    } catch (err) {
      console.error('WebSocket parse error:', err);
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

          // Promote new host if host disconnects
          if (player.isHost) {
            const nextHost = room.players.find(p => p.id !== currentPlayerId && p.connected);
            if (nextHost) {
              player.isHost = false;
              nextHost.isHost = true;
              room.hostId = nextHost.id;
            }
          }
          broadcastRoom(room);
        }
      }
    }
  });
});

// Dev vs Prod Vite Integration
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
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
    console.log(`🔥 [جَمْر | JAMR] خادم اللعبة يعمل بنجاح على http://0.0.0.0:${PORT}`);
  });
}

startServer();
