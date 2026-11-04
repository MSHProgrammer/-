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
import { GameInfo } from './src/types/game.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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
  }
} catch (e) {
  console.error('Failed to load jamr_data_store.json:', e);
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ sections, topics, questions, games }, null, 2), 'utf-8');
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
  const payload = JSON.stringify({
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
      p.ws.send(payload);
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

      // 1. Join Room
      if (type === 'join_room') {
        const { code, playerId, name, avatar, team } = msg;
        const normalizedCode = String(code).toUpperCase().trim();
        const room = rooms.get(normalizedCode);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'الغرفة غير موجودة' }));
          return;
        }

        currentRoomCode = normalizedCode;
        let player = room.players.find(p => p.id === playerId);
        if (!player) {
          const newPlayerId = playerId || ('p_' + Date.now() + Math.random().toString(36).substring(2, 6));
          // Balance team assignment
          const t1Count = room.players.filter(p => p.team === 'team1').length;
          const t2Count = room.players.filter(p => p.team === 'team2').length;
          const assignedTeam = team || (t1Count <= t2Count ? 'team1' : 'team2');

          player = {
            id: newPlayerId,
            name: String(name || 'لاعب جمر').trim(),
            team: assignedTeam,
            avatar: avatar || '⚡',
            isHost: room.players.length === 0,
            isReady: false,
            connected: true,
            ws
          };
          room.players.push(player);
          currentPlayerId = newPlayerId;
        } else {
          player.connected = true;
          player.ws = ws;
          currentPlayerId = player.id;
          if (name) player.name = String(name).trim();
          if (avatar) player.avatar = avatar;
        }

        ws.send(JSON.stringify({
          type: 'joined_success',
          playerId: player.id,
          isHost: player.isHost,
          team: player.team
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

      // 10. Chat & Emoji Reactions
      if (type === 'chat_message') {
        const text = String(msg.text || '').trim().substring(0, 200);
        if (text) {
          room.messages.push({
            id: 'c_' + Date.now() + Math.random().toString(36).substring(2, 5),
            senderId: player.id,
            senderName: player.name,
            team: player.team,
            text,
            timestamp: Date.now()
          });
          if (room.messages.length > 60) room.messages.shift();
          broadcastRoom(room);
        }
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
