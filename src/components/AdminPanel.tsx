import React, { useState, useEffect, useRef } from 'react';
import { Topic, Question, Section, Difficulty, QuestionPoints } from '../types/jamr';
import { GameInfo, GameCategory, DifficultyLevel } from '../types/game';
import { JAMR_GAMES_CATALOG } from '../data/gamesCatalog';
import { COMIC_PRESETS } from '../data/comicAssets';
import { DEFAULT_BARRAH_CATEGORIES, BarrahCategory } from '../data/barrahSalfaCategories';
import { Shield, Plus, Trash2, Edit2, Download, Upload, Eye, Check, X, Flame, Search, ArrowRight, Layers, FileQuestion, Users, RefreshCw, FolderOpen, Image, Palette, Camera, UploadCloud, CheckCircle2, AlertCircle, Loader2, Video, Film, PlayCircle, Gamepad2, Globe, Laptop, Sparkles, Bot, Wand2, AlertTriangle, Bug, MessageSquare } from 'lucide-react';
import { sound } from '../services/soundFx';
import { isVideoContent, getYouTubeEmbedUrl, detectMediaType } from '../utils/media';

/**
 * Helper to process, downscale, and compress studio/device images to high-quality base64 JPEG
 * Ensures fast loading, zero lag in network & database, and sharp rendering on game cards.
 */
function processStudioImageFile(
  file: File,
  onSuccess: (dataUrl: string) => void,
  onError?: (err: string) => void
) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    onError?.('الرجاء اختيار ملف صورة صالح (JPEG, PNG, WebP, GIF)');
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    onError?.('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 25 ميغابايت');
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => onError?.('فشل في قراءة ملف الصورة من الاستوديو');
  reader.onload = (e) => {
    const rawUrl = e.target?.result as string;
    if (!rawUrl) return;

    if (file.type === 'image/svg+xml') {
      onSuccess(rawUrl);
      return;
    }

    const img = new window.Image();
    img.onerror = () => onSuccess(rawUrl);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onSuccess(rawUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        onSuccess(compressed);
      } catch {
        onSuccess(rawUrl);
      }
    };
    img.src = rawUrl;
  };
  reader.readAsDataURL(file);
}

interface AdminPanelProps {
  onClose: () => void;
  onRefreshData: () => void;
  topics: Topic[];
  questions: Question[];
  games?: GameInfo[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  onRefreshData,
  topics,
  questions,
  games
}) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'games' | 'sections' | 'topics' | 'questions' | 'barrah_categories' | 'reports' | 'export_import' | 'rooms'>('games');

  // Games State
  const [gamesList, setGamesList] = useState<GameInfo[]>(games || JAMR_GAMES_CATALOG);
  const [editingGame, setEditingGame] = useState<GameInfo | null>(null);
  const [gameTitle, setGameTitle] = useState('');
  const [gameSubtitle, setGameSubtitle] = useState('');
  const [gameCategory, setGameCategory] = useState<GameCategory>('party');
  const [gameCategoryLabel, setGameCategoryLabel] = useState('جمعات وضحك');
  const [gameDescription, setGameDescription] = useState('');
  const [gameRules, setGameRules] = useState('');
  const [gameMinPlayers, setGameMinPlayers] = useState<number>(2);
  const [gameMaxPlayers, setGameMaxPlayers] = useState<number>(16);
  const [gameDuration, setGameDuration] = useState('15 - 25');
  const [gameDifficulty, setGameDifficulty] = useState<DifficultyLevel>('حماسي');
  const [gameIcon, setGameIcon] = useState('🎮');
  const [gameSupportsOffline, setGameSupportsOffline] = useState(true);
  const [gameSupportsOnline, setGameSupportsOnline] = useState(false);
  const [gameTags, setGameTags] = useState('');
  const [gameMsg, setGameMsg] = useState('');
  const [gameSearch, setGameSearch] = useState('');

  // AI Game Assistant State
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMode, setAiMode] = useState<'create' | 'modify'>('create');
  const [aiTargetGameId, setAiTargetGameId] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedGame, setAiGeneratedGame] = useState<GameInfo | null>(null);
  const [aiMsg, setAiMsg] = useState('');

  // Sections State
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [secTitle, setSecTitle] = useState('');
  const [secDescription, setSecDescription] = useState('');
  const [secIcon, setSecIcon] = useState('Sparkles');
  const [secMsg, setSecMsg] = useState('');

  // Topics Form State
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicCategory, setTopicCategory] = useState('عام');
  const [topicSectionId, setTopicSectionId] = useState('sports');
  const [topicCoverImage, setTopicCoverImage] = useState('');
  const [topicMsg, setTopicMsg] = useState('');
  const [formIsProcessing, setFormIsProcessing] = useState(false);
  const [formProcessError, setFormProcessError] = useState('');
  const formFileInputRef = useRef<HTMLInputElement>(null);

  // Image Customization Modal
  const [imageChangeTopic, setImageChangeTopic] = useState<Topic | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageChangeMsg, setImageChangeMsg] = useState('');
  const [modalIsProcessing, setModalIsProcessing] = useState(false);
  const [modalProcessError, setModalProcessError] = useState('');
  const [modalUploadedFromStudio, setModalUploadedFromStudio] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Questions Form State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qTopicId, setQTopicId] = useState(topics[0]?.id || '');
  const [qPoints, setQPoints] = useState<QuestionPoints>(200);
  const [qText, setQText] = useState('');
  const [qAnswer, setQAnswer] = useState('');
  const [qHints, setQHints] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qMediaUrl, setQMediaUrl] = useState('');
  const [qMediaType, setQMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [qImageProcessing, setQImageProcessing] = useState(false);
  const [qImageError, setQImageError] = useState('');
  const [questionMsg, setQuestionMsg] = useState('');
  const qFileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter
  const [topicSearch, setTopicSearch] = useState('');
  const [qSearch, setQSearch] = useState('');
  const [filterTopicId, setFilterTopicId] = useState<string>('all');

  // Rooms Monitor
  const [roomsList, setRoomsList] = useState<any[]>([]);

  // Barrah Salfa Categories State (20+ Categories & Sawaalif)
  const [barrahCategories, setBarrahCategories] = useState<BarrahCategory[]>(DEFAULT_BARRAH_CATEGORIES);
  const [editingBarrahCat, setEditingBarrahCat] = useState<BarrahCategory | null>(null);
  const [barrahCatName, setBarrahCatName] = useState('');
  const [barrahCatIcon, setBarrahCatIcon] = useState('🍲');
  const [barrahCatDesc, setBarrahCatDesc] = useState('');
  const [barrahCatWordsInput, setBarrahCatWordsInput] = useState('');
  const [barrahMsg, setBarrahMsg] = useState('');
  const [selectedBarrahCatId, setSelectedBarrahCatId] = useState<string>('c-food');
  const [newWordText, setNewWordText] = useState('');

  // Bug Reports State
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'new' | 'investigating' | 'resolved'>('all');
  const [reportMsg, setReportMsg] = useState('');

  // Load sections from API
  const loadSections = async () => {
    try {
      const res = await fetch('/api/sections');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sections)) {
          setSections(data.sections);
          if (data.sections[0] && !topicSectionId) {
            setTopicSectionId(data.sections[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGames = async () => {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.games) && data.games.length > 0) {
          setGamesList(data.games);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBarrahCategories = async () => {
    try {
      const res = await fetch('/api/barrah/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setBarrahCategories(data.categories);
          if (!selectedBarrahCatId && data.categories[0]) {
            setSelectedBarrahCatId(data.categories[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadReports = async (token = authToken) => {
    if (!token) return;
    setReportsLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reports)) {
          setReportsList(data.reports);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  };

  // Check existing token
  useEffect(() => {
    loadGames();
    loadSections();
    loadBarrahCategories();
    const saved = sessionStorage.getItem('jamr_admin_token');
    if (saved) {
      setAuthToken(saved);
      setIsAuthenticated(true);
      loadReports(saved);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCorrect();
        setIsAuthenticated(true);
        setAuthToken(data.token);
        sessionStorage.setItem('jamr_admin_token', data.token);
        loadGames();
        loadBarrahCategories();
        loadReports(data.token);
      } else {
        sound.playWrong();
        setAuthError(data.error || 'رمز الدخول غير صحيح');
      }
    } catch {
      setAuthError('حدث خطأ في الاتصال بالخادم');
    }
  };

  const handleUpdateReportStatus = async (id: string, status: string) => {
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/reports/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البلاغ؟')) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        loadReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBarrahCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barrahCatName.trim()) {
      setBarrahMsg('يرجى كتابة اسم القسم');
      return;
    }
    sound.playClick();
    try {
      const words = barrahCatWordsInput
        .split('\n')
        .map(w => w.trim())
        .filter(Boolean);

      const url = editingBarrahCat ? `/api/admin/barrah/categories/${editingBarrahCat.id}` : '/api/admin/barrah/categories';
      const method = editingBarrahCat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: barrahCatName,
          icon: barrahCatIcon || '📦',
          description: barrahCatDesc,
          words: words.length > 0 ? words : (editingBarrahCat?.words || ['سالفة 1', 'سالفة 2'])
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCorrect();
        setBarrahMsg('تم حفظ القسم بنجاح');
        setEditingBarrahCat(null);
        setBarrahCatName('');
        setBarrahCatDesc('');
        setBarrahCatWordsInput('');
        loadBarrahCategories();
      } else {
        setBarrahMsg(data.error || 'حدث خطأ في حفظ القسم');
      }
    } catch {
      setBarrahMsg('تعذر الاتصال بالخادم');
    }
  };

  const handleDeleteBarrahCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم وكل السوالف داخله؟')) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/barrah/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        loadBarrahCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWordToCategory = async (catId: string) => {
    const trimmed = newWordText.trim();
    if (!trimmed) return;
    const cat = barrahCategories.find(c => c.id === catId);
    if (!cat) return;
    if (cat.words.includes(trimmed)) {
      alert('هذه السالفة موجودة مسبقاً في هذا القسم');
      return;
    }
    const updatedWords = [...cat.words, trimmed];
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/barrah/categories/${catId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          words: updatedWords
        })
      });
      if (res.ok) {
        setNewWordText('');
        loadBarrahCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWordFromCategory = async (catId: string, wordToDelete: string) => {
    const cat = barrahCategories.find(c => c.id === catId);
    if (!cat) return;
    const updatedWords = cat.words.filter(w => w !== wordToDelete);
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/barrah/categories/${catId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          words: updatedWords
        })
      });
      if (res.ok) {
        loadBarrahCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    sound.playClick();
    setIsAuthenticated(false);
    setAuthToken(null);
    sessionStorage.removeItem('jamr_admin_token');
  };

  // Game CRUD Handlers
  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) {
      setGameMsg('يرجى كتابة اسم اللعبة');
      return;
    }
    if (!gameSupportsOffline && !gameSupportsOnline) {
      setGameMsg('يجب تفعيل خيار أوفلاين أو أونلاين على الأقل');
      return;
    }
    sound.playClick();
    try {
      const url = editingGame ? `/api/admin/games/${editingGame.id}` : '/api/admin/games';
      const method = editingGame ? 'PUT' : 'POST';
      const parsedRules = gameRules.split('\n').map(r => r.trim()).filter(Boolean);
      const parsedTags = gameTags.split(',').map(t => t.trim()).filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: gameTitle.trim(),
          subtitle: gameSubtitle.trim() || 'لعبة جماعية ممتعة',
          category: gameCategory,
          categoryLabel: gameCategoryLabel,
          description: gameDescription.trim(),
          rules: parsedRules.length > 0 ? parsedRules : ['اتبع تعليمات اللعبة وقواعد التنافس العادل.'],
          minPlayers: Number(gameMinPlayers) || 2,
          maxPlayers: Number(gameMaxPlayers) || 16,
          durationMinutes: gameDuration.trim() || '15 دقيقة',
          difficulty: gameDifficulty,
          icon: gameIcon.trim() || '🎮',
          supportsOffline: gameSupportsOffline,
          supportsOnline: gameSupportsOnline,
          tags: parsedTags.length > 0 ? parsedTags : ['لعبة تفاعلية']
        })
      });
      const data = await res.json();
      if (res.ok && (data.success || data.game)) {
        sound.playCorrect();
        setGameMsg('تم حفظ اللعبة بنجاح');
        handleCancelEditGame();
        loadGames();
        onRefreshData();
      } else {
        setGameMsg(data.error || 'فشل حفظ اللعبة');
      }
    } catch {
      setGameMsg('تعذر الاتصال بالخادم لحفظ اللعبة');
    }
  };

  const handleStartEditGame = (g: GameInfo) => {
    sound.playClick();
    setEditingGame(g);
    setGameTitle(g.title);
    setGameSubtitle(g.subtitle || '');
    setGameCategory(g.category || 'party');
    setGameCategoryLabel(g.categoryLabel || 'جمعات وضحك');
    setGameDescription(g.description || '');
    setGameRules((g.rules || []).join('\n'));
    setGameMinPlayers(g.minPlayers || 2);
    setGameMaxPlayers(g.maxPlayers || 16);
    setGameDuration(g.durationMinutes || '15 - 25');
    setGameDifficulty(g.difficulty || 'حماسي');
    setGameIcon(g.icon || '🎮');
    setGameSupportsOffline(g.supportsOffline ?? true);
    setGameSupportsOnline(g.supportsOnline ?? false);
    setGameTags((g.tags || []).join(', '));
    setGameMsg('');
    document.getElementById('game-admin-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEditGame = () => {
    setEditingGame(null);
    setGameTitle('');
    setGameSubtitle('');
    setGameCategory('party');
    setGameCategoryLabel('جمعات وضحك');
    setGameDescription('');
    setGameRules('');
    setGameMinPlayers(2);
    setGameMaxPlayers(16);
    setGameDuration('15 - 25');
    setGameDifficulty('حماسي');
    setGameIcon('🎮');
    setGameSupportsOffline(true);
    setGameSupportsOnline(false);
    setGameTags('');
    setGameMsg('');
  };

  // AI Game Assistant Handlers
  const handleGenerateGameWithAI = async () => {
    if (!aiPrompt.trim()) {
      setAiMsg('يرجى كتابة وصف للعبة أو التعديل المطلوب');
      return;
    }
    setAiLoading(true);
    setAiMsg('');
    sound.playClick();
    try {
      const res = await fetch('/api/admin/ai/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mode: aiMode,
          prompt: aiPrompt.trim(),
          targetGameId: aiMode === 'modify' ? aiTargetGameId : undefined,
          authToken
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.game) {
        sound.playVictory();
        setAiGeneratedGame(data.game);
        setAiMsg('✨ نجح الذكاء الاصطناعي في إعداد وتصميم اللعبة! يمكنك مراجعتها وحفظها الآن');
      } else {
        setAiMsg(data.error || 'حدث خطأ أثناء معالجة الذكاء الاصطناعي');
      }
    } catch {
      setAiMsg('تعذر الاتصال بالخادم');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiGameToForm = (game: GameInfo) => {
    sound.playClick();
    if (aiMode === 'modify') {
      const existing = gamesList.find(g => g.id === game.id);
      if (existing) setEditingGame(existing);
    } else {
      setEditingGame(null);
    }
    setGameTitle(game.title);
    setGameSubtitle(game.subtitle || '');
    setGameCategory(game.category);
    setGameCategoryLabel(game.categoryLabel);
    setGameDescription(game.description);
    setGameRules(Array.isArray(game.rules) ? game.rules.join('\n') : '');
    setGameMinPlayers(game.minPlayers);
    setGameMaxPlayers(game.maxPlayers);
    setGameDuration(game.durationMinutes);
    setGameDifficulty(game.difficulty);
    setGameIcon(game.icon || '🎮');
    setGameSupportsOffline(game.supportsOffline ?? true);
    setGameSupportsOnline(game.supportsOnline ?? false);
    setGameTags(Array.isArray(game.tags) ? game.tags.join(', ') : '');
    setShowAiAssistant(false);
    document.getElementById('game-admin-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDirectSaveAiGame = async (game: GameInfo) => {
    sound.playClick();
    try {
      const isExisting = gamesList.some(g => g.id === game.id);
      const url = isExisting ? `/api/admin/games/${game.id}` : '/api/admin/games';
      const method = isExisting ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(game)
      });
      const data = await res.json();
      if (res.ok && (data.success || data.game)) {
        sound.playVictory();
        setGameMsg('تم حفظ اللعبة المولدة بالذكاء الاصطناعي بنجاح في قاعدة البيانات!');
        setAiGeneratedGame(null);
        setShowAiAssistant(false);
        loadGames();
        onRefreshData();
      } else {
        setAiMsg(data.error || 'فشل حفظ اللعبة');
      }
    } catch {
      setAiMsg('تعذر الاتصال بالخادم');
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه اللعبة من المنصة؟')) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/games/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCorrect();
        loadGames();
        onRefreshData();
      } else {
        alert(data.error || 'فشل حذف اللعبة');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  const handleResetGames = async () => {
    if (!confirm('هل تريد استعادة جميع ألعاب منصة جمر الأصلية الافتراضية؟')) return;
    sound.playClick();
    try {
      const res = await fetch('/api/admin/games/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        sound.playCorrect();
        loadGames();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Section CRUD
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) {
      setSecMsg('يرجى إدخال اسم القسم');
      return;
    }
    sound.playClick();
    try {
      const url = editingSection ? `/api/admin/sections/${editingSection.id}` : '/api/admin/sections';
      const method = editingSection ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: secTitle.trim(),
          description: secDescription.trim(),
          icon: secIcon
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCorrect();
        setSecMsg('تم حفظ القسم بنجاح');
        setEditingSection(null);
        setSecTitle('');
        setSecDescription('');
        loadSections();
        onRefreshData();
      } else {
        setSecMsg(data.error || 'فشل حفظ القسم');
      }
    } catch {
      setSecMsg('تعذر الاتصال بالخادم');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم نقل مواضيعه تلقائياً للقسم العام.')) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/sections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        sound.playCorrect();
        loadSections();
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Direct Topic Image Save
  const handleSaveTopicImage = async () => {
    if (!imageChangeTopic || !customImageUrl.trim()) {
      setImageChangeMsg('يرجى اختيار أو إدخال رابط الصورة');
      return;
    }
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/topics/${imageChangeTopic.id}/image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ coverImage: customImageUrl.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCorrect();
        setImageChangeMsg('تم تحديث صورة الموضوع بنجاح!');
        setTimeout(() => {
          setImageChangeTopic(null);
          setCustomImageUrl('');
          setImageChangeMsg('');
        }, 800);
        onRefreshData();
      } else {
        setImageChangeMsg(data.error || 'فشل تحديث الصورة');
      }
    } catch {
      setImageChangeMsg('تعذر الاتصال بالخادم');
    }
  };

  // Topic Save
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicCoverImage.trim()) {
      setTopicMsg('يرجى كتابة عنوان الموضوع ورابط صورة الغلاف');
      return;
    }
    sound.playClick();
    try {
      const url = editingTopic ? `/api/admin/topics/${editingTopic.id}` : '/api/admin/topics';
      const method = editingTopic ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: topicTitle,
          description: topicDescription,
          category: topicCategory,
          sectionId: topicSectionId,
          coverImage: topicCoverImage
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTopicMsg('تم حفظ الموضوع بنجاح');
        setEditingTopic(null);
        setTopicTitle('');
        setTopicDescription('');
        setTopicCoverImage('');
        onRefreshData();
        loadSections();
      } else {
        setTopicMsg(data.error || 'حدث خطأ في حفظ الموضوع');
      }
    } catch {
      setTopicMsg('تعذر الاتصال بالخادم');
    }
  };

  // Delete Topic
  const handleDeleteTopic = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموضوع وجميع أسئلته؟')) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Question Save
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qAnswer.trim()) {
      setQuestionMsg('يرجى ملء نص السؤال والإجابة النموذجية');
      return;
    }
    sound.playClick();
    try {
      const hintsArray = qHints.split('\n').map(h => h.trim()).filter(Boolean);
      const url = editingQuestion ? `/api/admin/questions/${editingQuestion.id}` : '/api/admin/questions';
      const method = editingQuestion ? 'PUT' : 'POST';

      const cleanMediaUrl = qMediaUrl.trim();
      const detectedType = cleanMediaUrl 
        ? (qMediaType !== 'none' ? qMediaType : (isVideoContent(cleanMediaUrl) ? 'video' : 'image'))
        : undefined;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          topicId: qTopicId || topics[0]?.id,
          points: qPoints,
          questionText: qText,
          answerText: qAnswer,
          hints: hintsArray,
          explanation: qExplanation,
          mediaUrl: cleanMediaUrl || undefined,
          mediaType: detectedType
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCorrect();
        setQuestionMsg('تم حفظ السؤال بنجاح');
        setEditingQuestion(null);
        setQText('');
        setQAnswer('');
        setQHints('');
        setQExplanation('');
        setQMediaUrl('');
        setQMediaType('none');
        setQImageError('');
        onRefreshData();
      } else {
        setQuestionMsg(data.error || 'تعذر حفظ السؤال');
      }
    } catch {
      setQuestionMsg('تعذر الاتصال بالخادم');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (q: Question) => {
    const confirmMessage = `هل أنت متأكد من حذف هذا السؤال نهائياً؟\n\nالسؤال: "${q.questionText}"`;
    if (!confirm(confirmMessage)) return;
    sound.playClick();
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sound.playCorrect();
        setQuestionMsg('تم حذف السؤال بنجاح');
        if (editingQuestion?.id === q.id) {
          setEditingQuestion(null);
          setQText('');
          setQAnswer('');
          setQHints('');
          setQExplanation('');
          setQMediaUrl('');
          setQMediaType('none');
          setQImageError('');
        }
        onRefreshData();
      } else {
        alert(data.error || 'تعذر حذف السؤال');
      }
    } catch (err) {
      console.error(err);
      alert('تعذر الاتصال بالخادم لحذف السؤال');
    }
  };

  // Export JSON
  const handleExport = async () => {
    sound.playClick();
    try {
      const res = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jamr_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch {
      alert('فشل التصدير');
    }
  };

  // Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            importedTopics: parsed.topics,
            importedQuestions: parsed.questions,
            mode: 'append'
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sound.playCorrect();
          alert(`تم الاستيراد بنجاح! الإجمالي: ${data.totalTopics} موضوع و ${data.totalQuestions} سؤال.`);
          onRefreshData();
        } else {
          alert(data.error || 'فشل الاستيراد');
        }
      } catch {
        alert('الملف غير صالح');
      }
    };
    reader.readAsText(file);
  };

  // Load active rooms
  const loadRooms = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.rooms) {
        setRoomsList(data.rooms);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'rooms') {
      loadRooms();
    }
  }, [isAuthenticated, activeTab]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#180b2a] via-[#11071e] to-[#0c0517] rounded-3xl max-w-5xl w-full border-2 border-amber-500/50 shadow-2xl overflow-hidden text-right my-auto max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="bg-[#10061d] border-b border-purple-900/40 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-black flex items-center justify-center shadow-lg font-black">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>لوحة تحكم إدارة جَمْر | JAMR</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                  محمي برمز سري
                </span>
              </h2>
              <p className="text-xs text-amber-300">تعديل الأسئلة، المواضيع، الأصوات، حماية الخادم، والغرف المباشرة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-black text-red-300 bg-red-950/60 hover:bg-red-900/80 rounded-xl transition-colors cursor-pointer border border-red-700/50"
              >
                تسجيل الخروج
              </button>
            )}
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
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          /* Login Form with Secret Password */
          <div className="p-8 max-w-md mx-auto w-full my-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/40 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">تسجيل الدخول للإدارة</h3>
            <p className="text-xs text-purple-300/80 mb-6">أدخل الرمز السري المخصص لإدارة المنصة للمتابعة</p>

            <form onSubmit={handleLogin} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">الرمز السري المخصص:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-amber-500/40 focus:border-amber-400 focus:outline-hidden text-center text-xl font-mono font-black tracking-widest text-amber-300 bg-black/60 shadow-inner"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-red-400 font-bold mt-1.5 text-center animate-pulse">{authError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer"
              >
                دخول لوحة التحكم 🔥
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Views */
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 shrink-0 overflow-x-auto">
              <button
                onClick={() => { sound.playClick(); setActiveTab('games'); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'games'
                    ? 'border-amber-500 text-amber-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-amber-600" />
                <span>إدارة الألعاب ({gamesList.length})</span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('sections'); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'sections'
                    ? 'border-orange-600 text-orange-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-orange-600" />
                <span>إدارة الأقسام ({sections.length})</span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('topics'); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'topics'
                    ? 'border-orange-600 text-orange-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>إدارة المواضيع ({topics.length})</span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('questions'); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'questions'
                    ? 'border-orange-600 text-orange-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                <span>بنك الأسئلة ({questions.length})</span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('barrah_categories'); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'barrah_categories'
                    ? 'border-orange-600 text-orange-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="text-sm">🕵️</span>
                <span>أقسام برا السالفة ({barrahCategories.length})</span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('reports'); loadReports(); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>البلاغات والشكاوى ⚠️</span>
                {reportsList.filter(r => r.status !== 'resolved').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                    {reportsList.filter(r => r.status !== 'resolved').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('export_import'); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'export_import'
                    ? 'border-orange-600 text-orange-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>تصدير واستيراد البيانات</span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveTab('rooms'); }}
                className={`py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'rooms'
                    ? 'border-orange-600 text-orange-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>الغرف المباشرة النشطة</span>
              </button>
            </div>

            {/* Tab: Games Management (الألعاب) */}
            {activeTab === 'games' && (
              <div className="p-6 space-y-6">
                
                {/* Header & Quick Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-amber-400" />
                      <span>إدارة جميع ألعاب منصة جَمْر (أونلاين وأوفلاين)</span>
                    </h3>
                    <p className="text-xs text-purple-200/80 mt-1">
                      يمكنك تعديل اسم أي لعبة، وتحديد ما إذا كانت تعمل أوفلاين بجهاز واحد، أونلاين عبر الإنترنت، أو كلاهما، وإضافة ألعاب جديدة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAiAssistant(!showAiAssistant)}
                      className="px-3.5 py-1.5 text-xs font-black text-purple-950 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-yellow-300 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 fill-purple-950" />
                      <span>{showAiAssistant ? 'إخفاء الذكاء الاصطناعي' : '✨ الذكاء الاصطناعي للألعاب'}</span>
                    </button>
                    <button
                      onClick={handleResetGames}
                      className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-black/40 hover:bg-black/60 border border-purple-800/60 rounded-xl transition-colors cursor-pointer"
                    >
                      استعادة الألعاب الافتراضية
                    </button>
                    <button
                      onClick={() => {
                        handleCancelEditGame();
                        document.getElementById('game-admin-form')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 text-xs font-black text-black bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة يدوية</span>
                    </button>
                  </div>
                </div>

                {/* ================= GEMINI AI GAME MAKER ASSISTANT ================= */}
                {showAiAssistant && (
                  <div className="p-5 rounded-3xl bg-gradient-to-b from-[#2a0e4a] via-[#1b0833] to-[#120524] border-2 border-amber-400 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between border-b border-purple-800/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                            <span>مساعد الذكاء الاصطناعي لإدارة وتصميم الألعاب</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Gemini Pro</span>
                          </h4>
                          <p className="text-[11px] text-purple-300">
                            اكتب وصف اللعبة التي ترغب بإضافتها أو حدد لعبة حالية واطلب من الذكاء الاصطناعي تعديلها
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAiAssistant(false)}
                        className="text-purple-400 hover:text-white text-xs cursor-pointer p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-black/40 border border-purple-800/40">
                      <button
                        type="button"
                        onClick={() => {
                          setAiMode('create');
                          setAiGeneratedGame(null);
                          setAiMsg('');
                        }}
                        className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          aiMode === 'create'
                            ? 'bg-amber-400 text-black shadow-md'
                            : 'text-purple-300 hover:text-white'
                        }`}
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>إنشاء لعبة جديدة بالكامل بالوصف</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAiMode('modify');
                          setAiGeneratedGame(null);
                          setAiMsg('');
                          if (!aiTargetGameId && gamesList[0]) setAiTargetGameId(gamesList[0].id);
                        }}
                        className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          aiMode === 'modify'
                            ? 'bg-amber-400 text-black shadow-md'
                            : 'text-purple-300 hover:text-white'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل وتطوير لعبة حالية</span>
                      </button>
                    </div>

                    {/* If Modify Mode: Pick Target Game */}
                    {aiMode === 'modify' && (
                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">اختر اللعبة المراد تعديلها:</label>
                        <select
                          value={aiTargetGameId}
                          onChange={(e) => setAiTargetGameId(e.target.value)}
                          className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-hidden focus:border-amber-400"
                        >
                          {gamesList.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.icon || '🎮'} {g.title} ({g.categoryLabel})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Description Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-purple-200 mb-1.5">
                        {aiMode === 'create' 
                          ? 'صف فكرة اللعبة وقواعدها ونوعها (مثلاً: لعبة تحدي الأمثال، أو لعبة كشف الجاسوس...):'
                          : 'ما هي التعديلات التي تريد إجراؤها على هذه اللعبة؟ (تغيير الاسم، القواعد، عدد اللاعبين...):'}
                      </label>
                      <textarea
                        rows={3}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={
                          aiMode === 'create'
                            ? 'مثال: اصنع لعبة ديوانية جديدة اسمها سكة سفر، يشارك فيها 3 إلى 10 لاعبين، تقوم على تمثيل وتخمين محطات السفر والمواقف المضحكة في المطار...'
                            : 'مثال: قم بتطوير لعبة مافيا لتصبح تدعم 20 لاعباً وتكون أسرع وأكثر إثارة واكتب 5 قواعد حماسية...'
                        }
                        className="w-full bg-black/60 border border-purple-700/60 rounded-2xl p-3 text-xs text-white focus:outline-hidden focus:border-amber-400 placeholder:text-purple-400/40"
                      />
                    </div>

                    {/* AI Feedback Banner */}
                    {aiMsg && (
                      <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold text-center">
                        {aiMsg}
                      </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={aiLoading || !aiPrompt.trim()}
                        onClick={handleGenerateGameWithAI}
                        className={`flex-1 py-3 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          aiLoading || !aiPrompt.trim()
                            ? 'bg-purple-950/60 text-purple-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-black hover:scale-[1.01]'
                        }`}
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>الذكاء الاصطناعي يقوم بتصميم وصياغة اللعبة الآن...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>{aiMode === 'create' ? 'توليد وتصميم اللعبة بالذكاء الاصطناعي 🔥' : 'تطبيق التعديلات بالذكاء الاصطناعي 🔥'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Generated Game Preview Card */}
                    {aiGeneratedGame && (
                      <div className="p-4 rounded-2xl bg-black/60 border-2 border-emerald-500/60 space-y-3">
                        <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                          <span className="text-xs font-black text-emerald-400">معاينة نتيجة الذكاء الاصطناعي</span>
                          <span className="text-2xl">{aiGeneratedGame.icon || '🎮'}</span>
                        </div>

                        <div>
                          <h5 className="text-base font-black text-white">{aiGeneratedGame.title}</h5>
                          <span className="text-xs text-amber-300 font-bold">{aiGeneratedGame.subtitle}</span>
                          <p className="text-xs text-purple-200 mt-1">{aiGeneratedGame.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-900/60 text-purple-200 border border-purple-700/50">
                            👥 {aiGeneratedGame.minPlayers} - {aiGeneratedGame.maxPlayers} لاعب
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-purple-900/60 text-purple-200 border border-purple-700/50">
                            ⏱️ {aiGeneratedGame.durationMinutes}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                            {aiGeneratedGame.supportsOffline ? '✓ أوفلاين' : '✗ غير مدعوم أوفلاين'}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-700/50">
                            {aiGeneratedGame.supportsOnline ? '✓ أونلاين' : '✗ غير مدعوم أونلاين'}
                          </span>
                        </div>

                        {/* Actions for generated game */}
                        <div className="flex items-center gap-2 pt-2 border-t border-purple-900/60">
                          <button
                            type="button"
                            onClick={() => handleDirectSaveAiGame(aiGeneratedGame)}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg transition-all cursor-pointer"
                          >
                            اعتماد وحفظ اللعبة فوراً في قاعدة البيانات 🔥
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyAiGameToForm(aiGeneratedGame)}
                            className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs cursor-pointer"
                          >
                            تعديل في النموذج اليدوي
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Game Form (Add or Edit) */}
                <div id="game-admin-form" className="bg-[#140a24] rounded-2xl p-5 border-2 border-amber-500/40 text-slate-100 shadow-xl">
                  <h4 className="text-sm font-black text-white mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-amber-400" />
                      <span>{editingGame ? `تعديل بيانات لعبة: ${editingGame.title}` : 'إضافة لعبة جديدة للمنصة'}</span>
                    </span>
                    {editingGame && (
                      <button
                        onClick={handleCancelEditGame}
                        className="text-xs text-purple-400 hover:text-white underline cursor-pointer"
                      >
                        إلغاء التعديل والبدء من جديد
                      </button>
                    )}
                  </h4>

                  {gameMsg && (
                    <div className="p-3 mb-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold text-center">
                      {gameMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveGame} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-200 mb-1">اسم اللعبة *:</label>
                        <input
                          type="text"
                          value={gameTitle}
                          onChange={(e) => setGameTitle(e.target.value)}
                          placeholder="مثال: جمرين أو مافيا..."
                          className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs font-bold text-white focus:border-amber-400 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-purple-200 mb-1">الوصف الفرعي (العنوان الجذاب):</label>
                        <input
                          type="text"
                          value={gameSubtitle}
                          onChange={(e) => setGameSubtitle(e.target.value)}
                          placeholder="مثال: تحدي ديوانيات وزوارات..."
                          className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-200 mb-1">الأيقونة / الإيموجي:</label>
                        <input
                          type="text"
                          value={gameIcon}
                          onChange={(e) => setGameIcon(e.target.value)}
                          placeholder="🎮"
                          className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-center text-sm text-white focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-200 mb-1">التصنيف:</label>
                        <select
                          value={gameCategory}
                          onChange={(e) => {
                            const val = e.target.value as GameCategory;
                            setGameCategory(val);
                            const labels: Record<GameCategory, string> = {
                              trivia: 'أسئلة وتحدي',
                              words: 'كلمات وتخمين',
                              deduction: 'خداع واستنتاج',
                              drawing: 'رسم وتمثيل',
                              party: 'جمعات وضحك'
                            };
                            setGameCategoryLabel(labels[val] || 'جمعات وضحك');
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                        >
                          <option value="trivia">أسئلة وتحدي</option>
                          <option value="words">كلمات وتخمين</option>
                          <option value="deduction">خداع واستنتاج</option>
                          <option value="drawing">رسم وتمثيل</option>
                          <option value="party">جمعات وضحك</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-200 mb-1">الصعوبة:</label>
                        <select
                          value={gameDifficulty}
                          onChange={(e) => setGameDifficulty(e.target.value as DifficultyLevel)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                        >
                          <option value="سهل">سهل</option>
                          <option value="متوسط">متوسط</option>
                          <option value="حماسي">حماسي</option>
                          <option value="صعب">صعب</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-200 mb-1">اللاعبين (من - إلى):</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={gameMinPlayers}
                            onChange={(e) => setGameMinPlayers(Number(e.target.value))}
                            className="w-1/2 px-2 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-center text-white"
                          />
                          <span className="text-purple-400 text-xs">-</span>
                          <input
                            type="number"
                            min={2}
                            max={50}
                            value={gameMaxPlayers}
                            onChange={(e) => setGameMaxPlayers(Number(e.target.value))}
                            className="w-1/2 px-2 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-center text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-200 mb-1">المدة التقريبية:</label>
                        <input
                          type="text"
                          value={gameDuration}
                          onChange={(e) => setGameDuration(e.target.value)}
                          placeholder="مثال: 15 - 25 دقيقة"
                          className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Mode Toggles (Online & Offline Flags) */}
                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/50 space-y-2">
                      <div className="text-xs font-black text-amber-300 mb-2">أوضاع اللعب المدعومة في هذه اللعبة:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-purple-800/50 cursor-pointer hover:border-amber-500/60 transition-colors">
                          <input
                            type="checkbox"
                            checked={gameSupportsOffline}
                            onChange={(e) => setGameSupportsOffline(e.target.checked)}
                            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-black text-white flex items-center gap-1.5">
                              <Laptop className="w-3.5 h-3.5 text-amber-400" />
                              <span>دعم اللعب أوفلاين (بجهاز واحد)</span>
                            </div>
                            <div className="text-[11px] text-purple-300/80">مناسبة للديوانيات والتجمعات بشاشة هاتف أو تابلت واحدة</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-purple-800/50 cursor-pointer hover:border-amber-500/60 transition-colors">
                          <input
                            type="checkbox"
                            checked={gameSupportsOnline}
                            onChange={(e) => setGameSupportsOnline(e.target.checked)}
                            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-black text-white flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-blue-400" />
                              <span>دعم اللعب أونلاين (غرف متزامنة عبر الإنترنت)</span>
                            </div>
                            <div className="text-[11px] text-purple-300/80">إنشاء غرفة برمز دعوة وتزامن حقيقي عبر الشبكة</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-200 mb-1">وصف اللعبة:</label>
                      <textarea
                        rows={2}
                        value={gameDescription}
                        onChange={(e) => setGameDescription(e.target.value)}
                        placeholder="نبذة تشويقية عن اللعبة وكيفية اللعب..."
                        className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-200 mb-1">قواعد اللعبة (كل سطر قاعدة منفصلة):</label>
                      <textarea
                        rows={3}
                        value={gameRules}
                        onChange={(e) => setGameRules(e.target.value)}
                        placeholder="1. يجتمع اللاعبون في دائرة&#10;2. التطبيق يوزع الأدوار سراً&#10;3. تبدأ مرحلة النقاش والتحقيق..."
                        className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white font-mono focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-purple-200 mb-1">الوسوم (مفصولة بفواصل):</label>
                      <input
                        type="text"
                        value={gameTags}
                        onChange={(e) => setGameTags(e.target.value)}
                        placeholder="أوفلاين, ديوانية, ذكاء, سرعة..."
                        className="w-full px-3 py-2 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                      >
                        {editingGame ? 'حفظ تعديلات اللعبة' : 'إضافة اللعبة إلى المنصة'}
                      </button>

                      {editingGame && (
                        <button
                          type="button"
                          onClick={handleCancelEditGame}
                          className="px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Games List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white flex items-center gap-2">
                      <span>الألعاب الحالية في المنصة ({gamesList.length})</span>
                    </h4>
                    <div className="w-64">
                      <input
                        type="text"
                        value={gameSearch}
                        onChange={(e) => setGameSearch(e.target.value)}
                        placeholder="بحث عن لعبة..."
                        className="w-full px-3 py-1.5 rounded-xl border border-purple-800/60 bg-black/60 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gamesList
                      .filter(g => !gameSearch || g.title.includes(gameSearch) || g.subtitle.includes(gameSearch))
                      .map((g) => (
                        <div
                          key={g.id}
                          className={`p-4 rounded-2xl border-2 transition-all text-right flex flex-col justify-between ${
                            editingGame?.id === g.id
                              ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                              : 'border-purple-800/40 bg-black/40 hover:border-purple-600/60'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{g.icon || '🎮'}</span>
                                <div>
                                  <h5 className="text-sm font-black text-white">{g.title}</h5>
                                  <p className="text-[11px] text-purple-300/80">{g.subtitle}</p>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 font-bold border border-purple-700/40">
                                {g.categoryLabel || g.category}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                              {g.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {g.supportsOffline && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Laptop className="w-3 h-3" />
                                  <span>أوفلاين بجهاز واحد</span>
                                </span>
                              )}
                              {g.supportsOnline && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>أونلاين بالإنترنت</span>
                                </span>
                              )}
                              <span className="text-[10px] text-purple-400">
                                {g.minPlayers}-{g.maxPlayers} لاعبين
                              </span>
                              <span className="text-[10px] text-purple-400">•</span>
                              <span className="text-[10px] text-purple-400">{g.durationMinutes}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/40">
                            <button
                              onClick={() => handleStartEditGame(g)}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>
                            <button
                              onClick={() => handleDeleteGame(g.id)}
                              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-700/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 0: Sections Management (الأقسام) */}
            {activeTab === 'sections' && (
              <div className="p-6 space-y-6">
                
                {/* Section Add/Edit Form */}
                <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-200">
                  <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-600" />
                    <span>{editingSection ? 'تعديل بيانات القسم' : 'إضافة قسم رئيسي جديد (مثل: الكرة والرياضة، سينما، ألعاب...)'}</span>
                  </h3>

                  <form onSubmit={handleSaveSection} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم القسم:</label>
                        <input
                          type="text"
                          value={secTitle}
                          onChange={(e) => setSecTitle(e.target.value)}
                          placeholder="مثال: الكرة والرياضة"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">وصف القسم:</label>
                        <input
                          type="text"
                          value={secDescription}
                          onChange={(e) => setSecDescription(e.target.value)}
                          placeholder="وصف مختصر لمحتوى ومواضيع هذا القسم..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {editingSection ? 'حفظ تعديل القسم' : 'إضافة القسم'}
                      </button>

                      {editingSection && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSection(null);
                            setSecTitle('');
                            setSecDescription('');
                          }}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      )}

                      {secMsg && <span className="text-xs text-emerald-700 font-bold">{secMsg}</span>}
                    </div>
                  </form>
                </div>

                {/* Sections List */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-3">الأقسام الحالية ({sections.length}):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {sections.map((s) => {
                      const count = topics.filter(t => t.sectionId === s.id).length;
                      return (
                        <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <FolderOpen className="w-4 h-4 text-orange-600" />
                                <span>{s.title}</span>
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                                {count} مواضيع
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {s.description || 'لا يوجد وصف'}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">معرف: {s.id}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setEditingSection(s);
                                  setSecTitle(s.title);
                                  setSecDescription(s.description || '');
                                }}
                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg cursor-pointer"
                                title="تعديل القسم"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSection(s.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="حذف القسم"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 1: Topics Management */}
            {activeTab === 'topics' && (
              <div className="p-6 space-y-6">
                
                {/* Topic Add/Edit Form */}
                <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-200">
                  <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-600" />
                    <span>{editingTopic ? 'تعديل الموضوع' : 'إضافة موضوع جديد (مع صورة هزلية أو كاريكاتير)'}</span>
                  </h3>

                  <form onSubmit={handleSaveTopic} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الموضوع:</label>
                        <input
                          type="text"
                          value={topicTitle}
                          onChange={(e) => setTopicTitle(e.target.value)}
                          placeholder="مثال: ملاعب وأندية"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">القسم التابع له:</label>
                        <select
                          value={topicSectionId}
                          onChange={(e) => {
                            setTopicSectionId(e.target.value);
                            const found = sections.find(s => s.id === e.target.value);
                            if (found) setTopicCategory(found.title);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        >
                          {sections.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف النصي:</label>
                        <input
                          type="text"
                          value={topicCategory}
                          onChange={(e) => setTopicCategory(e.target.value)}
                          placeholder="رياضة، سينما، علوم..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">صورة الغلاف:</label>
                          <button
                            type="button"
                            onClick={() => formFileInputRef.current?.click()}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>إدراج من الاستوديو 📱</span>
                          </button>
                        </div>

                        <input
                          type="file"
                          ref={formFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setFormIsProcessing(true);
                            setFormProcessError('');
                            processStudioImageFile(
                              file,
                              (dataUrl) => {
                                setFormIsProcessing(false);
                                setTopicCoverImage(dataUrl);
                                sound.playCorrect();
                              },
                              (err) => {
                                setFormIsProcessing(false);
                                setFormProcessError(err);
                              }
                            );
                            e.target.value = '';
                          }}
                        />

                        <input
                          type="text"
                          value={topicCoverImage}
                          onChange={(e) => setTopicCoverImage(e.target.value)}
                          placeholder="رابط مباشر أو تم الرفع من الاستوديو"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        />

                        {formIsProcessing && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-orange-600 font-bold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جارِ قراءة وضغط الصورة من الاستوديو...</span>
                          </div>
                        )}

                        {formProcessError && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-red-600 font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{formProcessError}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Pick Comic presets inside form */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="block text-[11px] font-bold text-slate-700">
                          أو اختر رسمة هزلية / كاريكاتير جاهزة للغلاف:
                        </span>
                        <button
                          type="button"
                          onClick={() => formFileInputRef.current?.click()}
                          className="text-[10px] font-bold text-slate-500 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
                        >
                          <UploadCloud className="w-3 h-3" />
                          <span>رفع من ألبوم الصور</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {COMIC_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setTopicCoverImage(p.url);
                            }}
                            className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              topicCoverImage === p.url
                                ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span>🎨 {p.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الوصف:</label>
                      <input
                        type="text"
                        value={topicDescription}
                        onChange={(e) => setTopicDescription(e.target.value)}
                        placeholder="نبذة سريعة عن أسئلة هذا الموضوع..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                      />
                    </div>

                    {topicCoverImage && (
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 w-fit">
                        <span className="text-[10px] text-slate-500 font-bold">معاينة الصورة:</span>
                        <img src={topicCoverImage} alt="معاينة" className="w-14 h-10 object-cover rounded-lg" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {editingTopic ? 'حفظ التعديلات' : 'إضافة الموضوع'}
                      </button>

                      {editingTopic && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTopic(null);
                            setTopicTitle('');
                            setTopicDescription('');
                            setTopicCoverImage('');
                          }}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}

                      {topicMsg && <span className="text-xs text-emerald-700 font-bold">{topicMsg}</span>}
                    </div>
                  </form>
                </div>

                {/* Topics List Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-slate-800">قائمة المواضيع الحالية ({topics.length}):</h4>
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        placeholder="بحث في المواضيع..."
                        className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {topics
                      .filter(t => t.title.includes(topicSearch) || t.category.includes(topicSearch))
                      .map((t) => (
                        <div key={t.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-2xs">
                          <div className="flex gap-3 p-3">
                            <img src={t.coverImage} alt={t.title} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200" />
                            <div className="flex-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{t.category}</span>
                              <h5 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{t.title}</h5>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{t.description}</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold text-orange-600">
                              {questions.filter(q => q.topicId === t.id).length} أسئلة
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setImageChangeTopic(t);
                                  setCustomImageUrl(t.coverImage);
                                  setImageChangeMsg('');
                                  setModalUploadedFromStudio(false);
                                  setModalProcessError('');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg cursor-pointer transition-colors"
                                title="تغيير وتخصيص صورة الموضوع من الاستوديو أو الرسوم"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>تغيير الصورة 🎨</span>
                              </button>
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setEditingTopic(t);
                                  setTopicTitle(t.title);
                                  setTopicDescription(t.description);
                                  setTopicCategory(t.category);
                                  setTopicSectionId(t.sectionId || 'sports');
                                  setTopicCoverImage(t.coverImage);
                                }}
                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="تعديل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTopic(t.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Questions Bank */}
            {activeTab === 'questions' && (
              <div className="p-6 space-y-6">
                
                {/* Question Add/Edit Form */}
                <div className="bg-orange-50/40 rounded-2xl p-5 border border-orange-200">
                  <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-600" />
                    <span>{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد إلى بنك الأسئلة'}</span>
                  </h3>

                  <form onSubmit={handleSaveQuestion} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الموضوع التابع له:</label>
                        <select
                          value={qTopicId}
                          onChange={(e) => setQTopicId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        >
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">قيمة النقاط ومستوى الصعوبة:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[200, 400, 600].map(pts => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => setQPoints(pts as QuestionPoints)}
                              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                qPoints === pts
                                  ? 'bg-orange-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {pts} نقطة ({pts === 200 ? 'سهل' : pts === 400 ? 'متوسط' : 'صلب'})
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نص السؤال:</label>
                      <textarea
                        rows={2}
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        placeholder="اكتب السؤال باللغة العربية بوضوح..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الإجابة النموذجية الصحيحة:</label>
                      <input
                        type="text"
                        value={qAnswer}
                        onChange={(e) => setQAnswer(e.target.value)}
                        placeholder="الإجابة الصحيحة الصريحة..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-900 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">تلميحات مساعدة (تلميح في كل سطر):</label>
                        <textarea
                          rows={2}
                          value={qHints}
                          onChange={(e) => setQHints(e.target.value)}
                          placeholder="تلميح 1&#10;تلميح 2"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">معلومات إضافية / شرح للإجابة:</label>
                        <textarea
                          rows={2}
                          value={qExplanation}
                          onChange={(e) => setQExplanation(e.target.value)}
                          placeholder="تفاصيل إضافية تعرض بعد الإجابة..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
                        />
                      </div>
                    </div>

                    {/* Media Attachment for Question: Image (Studio or URL) / Video (YouTube or Direct URL) */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-slate-800 block">إرفاق وسائط مع السؤال (صورة أو فيديو):</span>
                          <p className="text-[11px] text-slate-500">تظهر الصورة أو الفيديو تلقائياً للمتسابقين عند اختيار السؤال</p>
                        </div>

                        {/* Media Type Switcher */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setQMediaType('none');
                              setQMediaUrl('');
                              setQImageError('');
                            }}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              qMediaType === 'none' && !qMediaUrl
                                ? 'bg-white text-slate-800 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            بدون وسائط
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setQMediaType('image');
                            }}
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                              qMediaType === 'image' || (!qMediaType && qMediaUrl && !isVideoContent(qMediaUrl))
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-orange-600'
                            }`}
                          >
                            <Image className="w-3 h-3" />
                            <span>صورة 🖼️</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setQMediaType('video');
                            }}
                            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                              qMediaType === 'video' || (!qMediaType && qMediaUrl && isVideoContent(qMediaUrl))
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-orange-600'
                            }`}
                          >
                            <Video className="w-3 h-3" />
                            <span>فيديو 🎬</span>
                          </button>
                        </div>
                      </div>

                      {/* Hidden file input for question image upload from device/studio */}
                      <input
                        type="file"
                        ref={qFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setQImageProcessing(true);
                          setQImageError('');
                          processStudioImageFile(
                            file,
                            (dataUrl) => {
                              setQImageProcessing(false);
                              setQMediaUrl(dataUrl);
                              setQMediaType('image');
                              sound.playCorrect();
                            },
                            (err) => {
                              setQImageProcessing(false);
                              setQImageError(err);
                            }
                          );
                          e.target.value = '';
                        }}
                      />

                      {/* If Image mode */}
                      {(qMediaType === 'image' || (!qMediaType && qMediaUrl && !isVideoContent(qMediaUrl))) && (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button
                              type="button"
                              onClick={() => qFileInputRef.current?.click()}
                              className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                            >
                              <Camera className="w-3.5 h-3.5 text-orange-600" />
                              <span>إدراج صورة من الاستوديو 📱</span>
                            </button>

                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={qMediaUrl}
                                onChange={(e) => {
                                  setQMediaUrl(e.target.value);
                                  setQMediaType('image');
                                }}
                                placeholder="أو الصق رابط صورة مباشر (URL)..."
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white"
                              />
                              {qMediaUrl && (
                                <button
                                  type="button"
                                  onClick={() => setQMediaUrl('')}
                                  className="absolute left-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {qImageProcessing && (
                            <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جارِ معالجة وضغط الصورة من الاستوديو...</span>
                            </div>
                          )}

                          {qImageError && (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{qImageError}</span>
                            </div>
                          )}

                          {/* Image Preview */}
                          {qMediaUrl && (
                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 w-fit">
                              <span className="text-[11px] font-bold text-slate-600">معاينة الصورة المرفقة:</span>
                              <img
                                src={qMediaUrl}
                                alt="معاينة صورة السؤال"
                                className="w-16 h-14 object-cover rounded-lg border border-slate-200 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setQMediaUrl('')}
                                className="text-[11px] text-red-600 hover:text-red-700 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              >
                                إزالة الصورة
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* If Video mode */}
                      {(qMediaType === 'video' || (!qMediaType && qMediaUrl && isVideoContent(qMediaUrl))) && (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <div className="relative">
                            <input
                              type="text"
                              value={qMediaUrl}
                              onChange={(e) => {
                                setQMediaUrl(e.target.value);
                                setQMediaType('video');
                              }}
                              placeholder="ضع رابط فيديو (يوتيوب أو رابط مباشر MP4 / WebM)..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white"
                            />
                            {qMediaUrl && (
                              <button
                                type="button"
                                onClick={() => setQMediaUrl('')}
                                className="absolute left-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-500 font-medium">
                            💡 يدعم روابط يوتيوب (بما فيها Shorts ورابط youtu.be) أو ملفات الفيديو المباشرة (.mp4, .webm).
                          </p>

                          {/* Video Preview */}
                          {qMediaUrl && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-w-sm">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <Film className="w-3.5 h-3.5 text-orange-600" />
                                  <span>معاينة الفيديو:</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQMediaUrl('')}
                                  className="text-[10px] text-red-600 hover:text-red-700 font-bold cursor-pointer"
                                >
                                  إزالة الفيديو
                                </button>
                              </div>

                              {getYouTubeEmbedUrl(qMediaUrl) ? (
                                <div className="aspect-video rounded-lg overflow-hidden border border-slate-300">
                                  <iframe
                                    src={getYouTubeEmbedUrl(qMediaUrl)!}
                                    title="معاينة فيديو السؤال"
                                    className="w-full h-full border-0"
                                  />
                                </div>
                              ) : (
                                <video
                                  src={qMediaUrl}
                                  controls
                                  playsInline
                                  className="w-full max-h-36 rounded-lg object-contain bg-black"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {editingQuestion ? 'حفظ تعديل السؤال' : 'إضافة السؤال'}
                      </button>

                      {editingQuestion && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(null);
                            setQText('');
                            setQAnswer('');
                            setQHints('');
                            setQExplanation('');
                            setQMediaUrl('');
                            setQMediaType('none');
                            setQImageError('');
                          }}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}

                      {questionMsg && <span className="text-xs text-emerald-700 font-bold">{questionMsg}</span>}
                    </div>
                  </form>
                </div>

                {/* Filter and Questions List */}
                <div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={filterTopicId}
                        onChange={(e) => setFilterTopicId(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                      >
                        <option value="all">جميع المواضيع ({questions.length})</option>
                        {topics.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({questions.filter(q => q.topicId === t.id).length})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={qSearch}
                        onChange={(e) => setQSearch(e.target.value)}
                        placeholder="بحث في نص السؤال أو الإجابة..."
                        className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {questions
                      .filter(q => filterTopicId === 'all' || q.topicId === filterTopicId)
                      .filter(q => q.questionText.includes(qSearch) || q.answerText.includes(qSearch))
                      .map((q) => {
                        const topicObj = topics.find(t => t.id === q.topicId);
                        const hasVideo = isVideoContent(q.mediaUrl, q.mediaType);
                        const hasImage = Boolean(q.mediaUrl && !hasVideo);

                        return (
                          <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-orange-200 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                                  {q.points} نقطة
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold">
                                  {topicObj?.title || 'موضوع غير معروف'}
                                </span>
                                {hasVideo && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                                    <Film className="w-3 h-3 text-purple-600" />
                                    <span>فيديو</span>
                                  </span>
                                )}
                                {hasImage && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                                    <Image className="w-3 h-3 text-sky-600" />
                                    <span>صورة</span>
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-xs text-slate-900">{q.questionText}</h5>
                              <p className="text-[11px] font-bold text-emerald-700 mt-1">
                                الإجابة: {q.answerText}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setEditingQuestion(q);
                                  setQTopicId(q.topicId);
                                  setQPoints(q.points);
                                  setQText(q.questionText);
                                  setQAnswer(q.answerText);
                                  setQHints(q.hints.join('\n'));
                                  setQExplanation(q.explanation || '');
                                  setQMediaUrl(q.mediaUrl || '');
                                  setQMediaType(q.mediaType || (q.mediaUrl ? (isVideoContent(q.mediaUrl) ? 'video' : 'image') : 'none'));
                                  setQImageError('');
                                }}
                                className="p-1.5 text-slate-500 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 rounded-lg cursor-pointer border border-slate-200"
                                title="تعديل السؤال"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q)}
                                className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 bg-red-50 rounded-lg cursor-pointer border border-red-200 transition-colors"
                                title="حذف هذا السؤال نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 3: Export & Import */}
            {activeTab === 'export_import' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Export Box */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                        <Download className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-black text-slate-900 mb-1">تصدير قاعدة بيانات جَمْر</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        قم بتنزيل ملف JSON كامل يحتوي على جميع المواضيع والأسئلة الحالية كنسخة احتياطية أو لنقلها لأي بيئة أخرى.
                      </p>
                    </div>

                    <button
                      onClick={handleExport}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل نسخة JSON الاحتياطية</span>
                    </button>
                  </div>

                  {/* Import Box */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-black text-slate-900 mb-1">استيراد بنك أسئلة ومواضيع</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        اختر ملف JSON متوافق لإضافة المزيد من الأسئلة والمواضيع إلى المنصة بشكل تراكمي فوري.
                      </p>
                    </div>

                    <div>
                      <label className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>اختيار ملف JSON للاستيراد</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab 4: Rooms Monitor */}
            {activeTab === 'rooms' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-slate-900">الغرف النشطة حالياً على الخادم ({roomsList.length}):</h4>
                  <button
                    onClick={loadRooms}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تحديث</span>
                  </button>
                </div>

                {roomsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا توجد غرف نشطة حالياً. بمجرد أن ينشئ لاعب غرفة ستظهر هنا فوراً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {roomsList.map(r => (
                      <div key={r.code} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-orange-600 font-mono tracking-widest">{r.code}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {r.status === 'playing' ? 'مباراة نشطة' : 'في الانتظار'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">المضيف: {r.hostName}</p>
                        <p className="text-xs text-slate-500">اللاعبين: {r.playerCount}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-bold flex justify-between">
                          <span className="text-orange-600">ف1: {r.scores?.team1 || 0}</span>
                          <span className="text-red-600">ف2: {r.scores?.team2 || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Barrah Salfa Categories Management (أقسام برا السالفة والسوالف) */}
            {activeTab === 'barrah_categories' && (
              <div className="p-6 space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                      <span className="text-xl">🕵️</span>
                      <span>إدارة أقسام وسوالف لعبة برا السالفة ({barrahCategories.length} قسماً)</span>
                    </h3>
                    <p className="text-xs text-purple-200/80 mt-1">
                      يمكنك هنا إضافة أقسام جديدة، وتعديل الأقسام العشرين الحالية، وإضافة أو حذف الكلمات (السوالف) داخل كل قسم.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingBarrahCat(null);
                      setBarrahCatName('');
                      setBarrahCatIcon('📦');
                      setBarrahCatDesc('');
                      setBarrahCatWordsInput('');
                      setBarrahMsg('');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قسم جديد</span>
                  </button>
                </div>

                {/* Category Form */}
                <div className="bg-black/40 border border-purple-800/60 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-amber-400">
                    {editingBarrahCat ? `تعديل قسم: ${editingBarrahCat.name}` : 'إضافة قسم جديد لبرا السالفة:'}
                  </h4>

                  <form onSubmit={handleSaveBarrahCategory} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-bold text-purple-300 mb-1">الأيقونة (Emoji):</label>
                        <input
                          type="text"
                          value={barrahCatIcon}
                          onChange={e => setBarrahCatIcon(e.target.value)}
                          placeholder="🍲"
                          className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-center text-lg text-white focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-purple-300 mb-1">اسم القسم:</label>
                        <input
                          type="text"
                          value={barrahCatName}
                          onChange={e => setBarrahCatName(e.target.value)}
                          placeholder="مثال: ألعاب شعبية، رحلات وكشتات، مقاهي مشهورة..."
                          className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-300 mb-1">وصف مختصر للقسم:</label>
                      <input
                        type="text"
                        value={barrahCatDesc}
                        onChange={e => setBarrahCatDesc(e.target.value)}
                        placeholder="وصف يساعد اللاعبين على معرفة نوع الكلمات في هذا القسم"
                        className="w-full bg-black/60 border border-purple-700/60 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-300 mb-1">
                        السوالف (الكلمات السرية) داخل هذا القسم (كل سالفة في سطر):
                      </label>
                      <textarea
                        rows={3}
                        value={barrahCatWordsInput}
                        onChange={e => setBarrahCatWordsInput(e.target.value)}
                        placeholder="كبسة حاشي&#10;شاورما دجاج&#10;مظبي لحم..."
                        className="w-full bg-black/60 border border-purple-700/60 rounded-2xl p-3 text-xs text-white focus:outline-hidden focus:border-amber-400 placeholder:text-purple-400/40"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-xs rounded-xl shadow-md cursor-pointer"
                      >
                        {editingBarrahCat ? 'حفظ تعديلات القسم' : 'إضافة القسم الآن'}
                      </button>
                      {editingBarrahCat && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBarrahCat(null);
                            setBarrahCatName('');
                            setBarrahCatIcon('📦');
                            setBarrahCatDesc('');
                            setBarrahCatWordsInput('');
                          }}
                          className="px-4 py-2.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                      {barrahMsg && <span className="text-xs font-bold text-emerald-400 mr-2">{barrahMsg}</span>}
                    </div>
                  </form>
                </div>

                {/* Categories Grid & Word Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1 & 2: Categories List */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="text-xs font-black text-white">الأقسام الحالية (اضغط على قسم لعرض وإضافة السوالف):</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto p-1">
                      {barrahCategories.map(cat => {
                        const isSelected = selectedBarrahCatId === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => {
                              sound.playClick();
                              setSelectedBarrahCatId(cat.id);
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-orange-500/20 border-orange-400 shadow-md ring-1 ring-orange-500/40'
                                : 'bg-black/40 border-purple-800/40 hover:border-purple-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="text-2xl">{cat.icon}</span>
                              <div className="truncate">
                                <div className="text-xs font-black text-white truncate">{cat.name}</div>
                                <div className="text-[10px] text-purple-300 font-mono">{cat.words.length} سالفة</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playClick();
                                  setEditingBarrahCat(cat);
                                  setBarrahCatName(cat.name);
                                  setBarrahCatIcon(cat.icon);
                                  setBarrahCatDesc(cat.description || '');
                                  setBarrahCatWordsInput(cat.words.join('\n'));
                                }}
                                className="p-1.5 text-purple-300 hover:text-white rounded-lg bg-purple-950/60 cursor-pointer"
                                title="تعديل القسم"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBarrahCategory(cat.id)}
                                className="p-1.5 text-red-400 hover:text-red-300 rounded-lg bg-red-950/60 cursor-pointer"
                                title="حذف القسم"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 3: Sawaalif (Words) of Selected Category */}
                  <div className="bg-black/50 border border-purple-800/50 p-4 rounded-2xl space-y-3">
                    {(() => {
                      const cur = barrahCategories.find(c => c.id === selectedBarrahCatId) || barrahCategories[0];
                      if (!cur) return <div className="text-xs text-purple-400">اختر قسماً لعرض سوالفه</div>;
                      return (
                        <>
                          <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl">{cur.icon}</span>
                              <span className="text-xs font-black text-amber-300 truncate">{cur.name}</span>
                            </div>
                            <span className="text-[11px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full">
                              {cur.words.length} سالفة
                            </span>
                          </div>

                          {/* Add single word */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newWordText}
                              onChange={e => setNewWordText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddWordToCategory(cur.id)}
                              placeholder="أضف سالفة جديدة هنا..."
                              className="flex-1 bg-black/60 border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder:text-purple-400/40 focus:outline-hidden focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddWordToCategory(cur.id)}
                              disabled={!newWordText.trim()}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs rounded-xl cursor-pointer"
                            >
                              إضافة
                            </button>
                          </div>

                          {/* Words Chips */}
                          <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto p-1">
                            {cur.words.map((w, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-700/50 text-xs font-bold text-white shadow-xs"
                              >
                                <span>{w}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWordFromCategory(cur.id, w)}
                                  className="text-red-400 hover:text-red-300 cursor-pointer p-0.5"
                                  title="حذف هذه السالفة"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Bug Reports (البلاغات والشكاوى) */}
            {activeTab === 'reports' && (
              <div className="p-6 space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-950/30 border border-red-500/30 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-black text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span>صندوق بلاغات وشكاوى اللاعبين (إبلاغ عن خلل)</span>
                    </h3>
                    <p className="text-xs text-purple-200/80 mt-1">
                      تصلك هنا فوراً جميع بلاغات الخلل والملاحظات المرسلة من اللاعبين في أسفل الموقع.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadReports()}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-900/60 hover:bg-purple-800 rounded-xl cursor-pointer flex items-center gap-1.5 border border-purple-700/50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? 'animate-spin' : ''}`} />
                      <span>تحديث البلاغات</span>
                    </button>
                  </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: `الكل (${reportsList.length})` },
                    { id: 'new', label: `جديد (${reportsList.filter(r => r.status === 'new').length})` },
                    { id: 'investigating', label: `قيد المتابعة (${reportsList.filter(r => r.status === 'investigating').length})` },
                    { id: 'resolved', label: `تم الحل (${reportsList.filter(r => r.status === 'resolved').length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setReportFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                        reportFilter === f.id
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-black/40 text-purple-300 hover:text-white border border-purple-800/40'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Reports List */}
                {reportsList.length === 0 ? (
                  <div className="text-center py-12 text-purple-400 font-bold text-xs bg-black/30 rounded-2xl border border-dashed border-purple-900/40">
                    لا توجد بلاغات مرسلة حالياً. عندما يبلغ أحد اللاعبين ستظهر رسالته هنا مباشرة.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportsList
                      .filter(r => (reportFilter === 'all' ? true : r.status === reportFilter))
                      .map(report => (
                        <div
                          key={report.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            report.status === 'resolved'
                              ? 'bg-black/30 border-purple-900/40 opacity-75'
                              : report.status === 'investigating'
                              ? 'bg-amber-950/20 border-amber-600/40'
                              : 'bg-red-950/20 border-red-500/50 shadow-md'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/30 pb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  report.status === 'resolved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : report.status === 'investigating'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                }`}
                              >
                                {report.status === 'resolved'
                                  ? 'تم الحل ✓'
                                  : report.status === 'investigating'
                                  ? 'قيد المتابعة ⏳'
                                  : 'بلاغ جديد ⚠️'}
                              </span>

                              <span className="text-xs font-black text-white">
                                {report.category || 'خلل فني'}
                              </span>

                              {report.gameName && (
                                <span className="text-[10px] bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700/50">
                                  🎮 {report.gameName}
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-mono text-purple-400">
                              {new Date(report.createdAt).toLocaleString('ar-SA')}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-purple-100 leading-relaxed bg-black/40 p-3 rounded-xl border border-purple-900/30">
                            {report.description}
                          </p>

                          {/* Reporter Details & Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                            <div className="text-[11px] text-purple-300">
                              <span>المُبلّغ: </span>
                              <span className="font-black text-white">{report.reporterName || 'مجهول'}</span>
                              {report.contact && (
                                <span className="mr-3 font-mono text-amber-300">({report.contact})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {report.status !== 'resolved' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                                >
                                  وضع كـ تم الحل ✓
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReportStatus(report.id, 'investigating')}
                                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                                >
                                  إعادة فتح البلاغ ⏳
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                                title="حذف البلاغ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Image Customization Modal */}
            {imageChangeTopic && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border-2 border-orange-200 shadow-2xl text-right animate-in fade-in zoom-in duration-200 my-auto">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-orange-600" />
                      <h3 className="text-base font-black text-slate-900">
                        تخصيص صورة موضوع: {imageChangeTopic.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setImageChangeTopic(null);
                        setCustomImageUrl('');
                        setImageChangeMsg('');
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Live Preview matching board card */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-200">
                      <div className="w-28 h-36 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md flex flex-col bg-white shrink-0">
                        <div className="flex-1 overflow-hidden bg-slate-100">
                          <img
                            src={customImageUrl || imageChangeTopic.coverImage}
                            alt="معاينة"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="bg-[#f97316] text-white py-1 px-1 text-center font-black text-xs shrink-0">
                          {imageChangeTopic.title}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-black text-slate-900">المعاينة الحية على اللوحة:</p>
                        <p>ستظهر هذه الصورة بالأسلوب الهزلي والكاريكاتيري داخل البطاقة مع الشريط البرتقالي كما في تصميم اللعبة تماماً.</p>
                        {imageChangeMsg && (
                          <p className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            {imageChangeMsg}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Primary Option: Upload from Studio / Device Gallery */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-2xl border-2 border-dashed border-orange-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-black text-slate-900">
                              إدراج صورة من استوديو الصور / المعرض 📱🖼️
                            </span>
                            <span className="text-[11px] text-slate-600 font-medium">
                              اختر صورة من ألبوم هاتفك أو جهازك وسيتم تجهيزها وملاءمتها للعبة فوراً
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={modalFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setModalIsProcessing(true);
                          setModalProcessError('');
                          setModalUploadedFromStudio(false);
                          processStudioImageFile(
                            file,
                            (dataUrl) => {
                              setModalIsProcessing(false);
                              setCustomImageUrl(dataUrl);
                              setModalUploadedFromStudio(true);
                              sound.playCorrect();
                            },
                            (err) => {
                              setModalIsProcessing(false);
                              setModalProcessError(err);
                            }
                          );
                          e.target.value = '';
                        }}
                      />

                      {/* Drag / Drop / Click Area */}
                      <div
                        onClick={() => modalFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (!file) return;
                          setModalIsProcessing(true);
                          setModalProcessError('');
                          setModalUploadedFromStudio(false);
                          processStudioImageFile(
                            file,
                            (dataUrl) => {
                              setModalIsProcessing(false);
                              setCustomImageUrl(dataUrl);
                              setModalUploadedFromStudio(true);
                              sound.playCorrect();
                            },
                            (err) => {
                              setModalIsProcessing(false);
                              setModalProcessError(err);
                            }
                          );
                        }}
                        className="mt-2 py-4 px-4 bg-white hover:bg-orange-50/50 rounded-xl border border-orange-200 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                      >
                        {modalIsProcessing ? (
                          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs py-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>جارِ قراءة وضغط الصورة من الاستوديو بجودة عالية...</span>
                          </div>
                        ) : modalUploadedFromStudio ? (
                          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs py-1">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>تم إدراج الصورة من الاستوديو بنجاح! راجع المعاينة واضغط حفظ بالأسفل.</span>
                            <span className="text-[10px] text-slate-500 underline mr-2">(اضغط لتغييرها)</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-orange-600 font-black text-xs group-hover:scale-105 transition-transform">
                              <UploadCloud className="w-5 h-5" />
                              <span>اضغط هنا لاختيار صورة من الاستوديو أو اسحب الصورة هنا</span>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                              يدعم JPG، PNG، WebP، SVG من ألبوم الكاميرا أو الهاتف مباشرة
                            </span>
                          </>
                        )}
                      </div>

                      {modalProcessError && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{modalProcessError}</span>
                        </div>
                      )}
                    </div>

                    {/* Comic Caricature Presets Gallery */}
                    <div>
                      <span className="block text-xs font-black text-slate-800 mb-2">
                        🎨 أو اختر من مكتبة الرسومات الهزلية والكاريكاتير:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1">
                        {COMIC_PRESETS.map((p) => {
                          const isPicked = customImageUrl === p.url;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                sound.playClick();
                                setCustomImageUrl(p.url);
                                setModalUploadedFromStudio(false);
                              }}
                              className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                                isPicked
                                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400/20 shadow-xs'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-100 mb-1.5 border border-slate-200">
                                <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{p.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom URL Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">أو أدخل رابط صورة مخصص (URL):</label>
                      <input
                        type="text"
                        value={customImageUrl}
                        onChange={(e) => {
                          setCustomImageUrl(e.target.value);
                          setModalUploadedFromStudio(false);
                        }}
                        placeholder="https://... أو data:image/..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleSaveTopicImage}
                        className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        حفظ وتطبيق الصورة فوراً
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageChangeTopic(null);
                          setCustomImageUrl('');
                          setImageChangeMsg('');
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

