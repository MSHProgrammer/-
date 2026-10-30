import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Lock, Database, Activity, Trash2, Plus, Edit2, Search, CheckCircle2, XCircle, Star, ToggleLeft, ToggleRight, Users, Server, Eye, EyeOff } from 'lucide-react';
import { 
  checkAdminSession, 
  verifyAdminPin, 
  setAdminSession, 
  getAllGamesCatalog, 
  saveGameToCatalog, 
  deleteGameFromCatalog, 
  toggleGamePopular, 
  toggleGameActive,
  toggleGameOnline,
  toggleGameOffline,
  getSubmittedGames,
  reviewSubmittedGame
} from '../services/storage';
import { QUESTIONS_BANK } from '../data/questionsBank';
import { GameInfo, QuestionItem, SubmittedGame, GameCategory, DifficultyLevel } from '../types/game';
import { sounds } from '../services/soundEffects';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAdminSession());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tabs: 'games' | 'submissions' | 'questions' | 'rooms'
  const [adminTab, setAdminTab] = useState<'games' | 'submissions' | 'questions' | 'rooms'>('games');

  // Games & Submissions State
  const [catalogGames, setCatalogGames] = useState<GameInfo[]>(getAllGamesCatalog());
  const [submissions, setSubmissions] = useState<SubmittedGame[]>(getSubmittedGames());
  const [questions, setQuestions] = useState<QuestionItem[]>(QUESTIONS_BANK);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  // Add/Edit Game Modal State
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState<GameCategory>('party');
  const [formDescription, setFormDescription] = useState('');
  const [formRules, setFormRules] = useState<string>('القاعدة الأولى، القاعدة الثانية');
  const [formMinPlayers, setFormMinPlayers] = useState(3);
  const [formMaxPlayers, setFormMaxPlayers] = useState(12);
  const [formDuration, setFormDuration] = useState('10 - 15');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('متوسط');
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formSupportsOnline, setFormSupportsOnline] = useState(true);
  const [formSupportsOffline, setFormSupportsOffline] = useState(true);

  const [searchGame, setSearchGame] = useState('');

  // Handle Login using SECRET PIN 110012
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pinInput)) {
      setIsAuthenticated(true);
      setPinError(false);
      sounds.playSpark();
    } else {
      setPinError(true);
      sounds.playWrong();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminSession(false);
    sounds.playSpark();
  };

  // Sync data when authenticated
  const refreshData = () => {
    setCatalogGames(getAllGamesCatalog());
    setSubmissions(getSubmittedGames());
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      fetch('/api/admin/rooms')
        .then(r => r.json())
        .then(data => {
          if (data && data.rooms) setActiveRooms(data.rooms);
        })
        .catch(err => console.log('Rooms fetch:', err));
    }
  }, [isAuthenticated]);

  // Open Add Game Form
  const handleOpenAddGame = () => {
    setEditingGameId(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormCategory('party');
    setFormDescription('');
    setFormRules('شرح الخطوة الأولى للجولة\nشرح طريقة احتساب النقاط\nتحديد الفائز في النهاية');
    setFormMinPlayers(3);
    setFormMaxPlayers(12);
    setFormDuration('10 - 15');
    setFormDifficulty('متوسط');
    setFormIsPopular(false);
    setFormSupportsOnline(true);
    setFormSupportsOffline(true);
    setShowGameModal(true);
    sounds.playSpark();
  };

  // Open Edit Game Form
  const handleOpenEditGame = (game: GameInfo) => {
    setEditingGameId(game.id);
    setFormTitle(game.title);
    setFormSubtitle(game.subtitle);
    setFormCategory(game.category);
    setFormDescription(game.description);
    setFormRules(game.rules.join('\n'));
    setFormMinPlayers(game.minPlayers);
    setFormMaxPlayers(game.maxPlayers);
    setFormDuration(game.durationMinutes);
    setFormDifficulty(game.difficulty);
    setFormIsPopular(Boolean(game.isPopular));
    setFormSupportsOnline(game.supportsOnline !== false);
    setFormSupportsOffline(game.supportsOffline !== false);
    setShowGameModal(true);
    sounds.playSpark();
  };

  // Save Game Form Submit
  const handleSaveGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    sounds.playCorrect();
    const rulesArray = formRules.split('\n').map(r => r.trim()).filter(Boolean);
    const catLabels: Record<GameCategory, string> = {
      trivia: 'أسئلة ومعرفة',
      words: 'كلمات وتخمين',
      deduction: 'خداع واستنتاج',
      drawing: 'رسم وتمثيل',
      party: 'جمعات وضحك'
    };

    const targetId = editingGameId || ('admin_game_' + Date.now());
    const existing = catalogGames.find(g => g.id === targetId);

    const gameData: GameInfo = {
      id: targetId,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim() || 'لعبة جديدة في جَمْر',
      category: formCategory,
      categoryLabel: catLabels[formCategory],
      description: formDescription.trim(),
      rules: rulesArray.length > 0 ? rulesArray : ['اتبع تعليمات الشاشة وابدأ الجولة.'],
      minPlayers: formMinPlayers,
      maxPlayers: formMaxPlayers,
      durationMinutes: formDuration,
      difficulty: formDifficulty,
      accentColor: existing?.accentColor || '#f97316',
      bgGradient: existing?.bgGradient || 'from-orange-600/20 via-purple-900/40 to-slate-900',
      isPopular: formIsPopular,
      isNew: !editingGameId,
      isActive: existing ? (existing.isActive !== false) : true,
      tags: existing?.tags || ['تحدي', 'جمعات'],
      supportsOffline: formSupportsOffline,
      supportsOnline: formSupportsOnline,
      engineType: existing?.engineType || (formCategory === 'words' ? 'taboo' : formCategory === 'deduction' ? 'barrah_salfa' : 'trivia')
    };

    saveGameToCatalog(gameData);
    refreshData();
    setShowGameModal(false);
  };

  // Mode Toggles
  const handleToggleOnline = (id: string) => {
    sounds.playSpark();
    toggleGameOnline(id);
    refreshData();
  };

  const handleToggleOffline = (id: string) => {
    sounds.playSpark();
    toggleGameOffline(id);
    refreshData();
  };

  // Toggle Popular
  const handleTogglePopular = (id: string) => {
    sounds.playSpark();
    toggleGamePopular(id);
    refreshData();
  };

  // Toggle Active
  const handleToggleActive = (id: string) => {
    sounds.playSpark();
    toggleGameActive(id);
    refreshData();
  };

  // Delete Game
  const handleDeleteGame = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه اللعبة تماماً من المنصة؟')) {
      sounds.playSpark();
      deleteGameFromCatalog(id);
      refreshData();
    }
  };

  // Review Submissions
  const handleApproveSubmission = (id: string) => {
    sounds.playCorrect();
    reviewSubmittedGame(id, 'approve');
    refreshData();
  };

  const handleRejectSubmission = (id: string) => {
    sounds.playWrong();
    reviewSubmittedGame(id, 'reject');
    refreshData();
  };

  // Filtered games
  const filteredCatalog = catalogGames.filter(g => {
    if (!searchGame.trim()) return true;
    const s = searchGame.toLowerCase();
    return g.title.toLowerCase().includes(s) || g.subtitle.toLowerCase().includes(s) || g.categoryLabel.toLowerCase().includes(s);
  });

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Admin Authentication Gate */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto rounded-3xl bg-purple-950/40 border border-purple-800/40 p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">لوحة الإدارة والتحكم</h2>
            <p className="text-xs text-purple-200/70 mt-1">
              الوصول مقيّد لإدارة منصة جَمْر فقط.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={12}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="أدخل الرمز السري للإدارة..."
                className="w-full bg-black/60 border border-purple-700/60 rounded-xl px-4 py-3 text-center text-white font-mono tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
              {pinError && (
                <span className="text-xs text-red-400 mt-2 block font-bold">
                  الرمز السري غير صحيح!
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              دخول المشرفين
            </button>
          </form>
        </div>
      ) : (
        /* Authenticated Admin Dashboard */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">لوحة تحكم إدارة جَمْر</h1>
                <p className="text-xs text-purple-300">إدارة الألعاب، مراجعة طلبات المستخدمين، والتحكم بالمنصة</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="py-2 px-4 rounded-xl bg-purple-900/40 hover:bg-red-900/50 text-purple-200 text-xs font-bold border border-purple-800/40 transition-colors self-start sm:self-auto cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-purple-900/30 pb-3">
            <button
              onClick={() => { setAdminTab('games'); sounds.playSpark(); }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminTab === 'games'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white'
              }`}
            >
              إدارة الألعاب ({catalogGames.length})
            </button>

            <button
              onClick={() => { setAdminTab('submissions'); sounds.playSpark(); }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'submissions'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white'
              }`}
            >
              <span>مراجعة طلبات الألعاب</span>
              {pendingSubmissions.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingSubmissions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setAdminTab('questions'); sounds.playSpark(); }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminTab === 'questions'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white'
              }`}
            >
              بنك الأسئلة والمحتوى ({questions.length})
            </button>

            <button
              onClick={() => { setAdminTab('rooms'); sounds.playSpark(); }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminTab === 'rooms'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white'
              }`}
            >
              الغرف النشطة أونلاين ({activeRooms.length})
            </button>
          </div>

          {/* ================= TAB 1: GAMES MANAGEMENT ================= */}
          {adminTab === 'games' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative min-w-[280px]">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    value={searchGame}
                    onChange={(e) => setSearchGame(e.target.value)}
                    placeholder="ابحث في الألعاب..."
                    className="w-full bg-purple-950/40 border border-purple-800/40 rounded-xl pr-9 pl-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  onClick={handleOpenAddGame}
                  className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة لعبة جديدة للمنصة</span>
                </button>
              </div>

              {/* Games Table */}
              <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-purple-900/40 text-purple-400 font-bold bg-black/20">
                        <th className="p-3.5">اسم اللعبة</th>
                        <th className="p-3.5">التصنيف</th>
                        <th className="p-3.5">اللاعبين</th>
                        <th className="p-3.5 text-center">أونلاين 🌐</th>
                        <th className="p-3.5 text-center">أوفلاين 📱</th>
                        <th className="p-3.5 text-center">الأكثر لعباً</th>
                        <th className="p-3.5 text-center">الحالة</th>
                        <th className="p-3.5 text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/30">
                      {filteredCatalog.map((g) => (
                        <tr key={g.id} className="hover:bg-purple-900/10">
                          <td className="p-3.5 font-bold text-white">
                            <div>{g.title}</div>
                            <div className="text-[10px] text-purple-400 font-normal">{g.subtitle}</div>
                          </td>
                          <td className="p-3.5 text-orange-400 font-medium">{g.categoryLabel}</td>
                          <td className="p-3.5 text-purple-200">{g.minPlayers} - {g.maxPlayers}</td>
                          
                          {/* Online Toggle Column */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleOnline(g.id)}
                              title="تبديل دعم اللعب أونلاين"
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                g.supportsOnline !== false
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30'
                                  : 'bg-black/30 text-gray-500 border border-gray-800'
                              }`}
                            >
                              {g.supportsOnline !== false ? '🌐 متاح' : '✕ معطل'}
                            </button>
                          </td>

                          {/* Offline Toggle Column */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleOffline(g.id)}
                              title="تبديل دعم اللعب أوفلاين"
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                g.supportsOffline !== false
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                                  : 'bg-black/30 text-gray-500 border border-gray-800'
                              }`}
                            >
                              {g.supportsOffline !== false ? '📱 متاح' : '✕ معطل'}
                            </button>
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleTogglePopular(g.id)}
                              title="تبديل تمييز الأكثر لعباً"
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                g.isPopular ? 'text-amber-400 bg-amber-400/10' : 'text-gray-600 hover:text-gray-400'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${g.isPopular ? 'fill-amber-400' : ''}`} />
                            </button>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleActive(g.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                g.isActive !== false
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
                              }`}
                            >
                              {g.isActive !== false ? 'مفعلة' : 'معطلة'}
                            </button>
                          </td>
                          <td className="p-3.5 text-left">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleOpenEditGame(g)}
                                className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-300 hover:text-white"
                                title="تعديل اللعبة"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGame(g.id)}
                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400"
                                title="حذف اللعبة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: USER SUBMISSIONS REVIEW ================= */}
          {adminTab === 'submissions' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-400" />
                  <span>طلبات إضافة الألعاب من اللاعبين ({submissions.length})</span>
                </h3>

                {submissions.length === 0 ? (
                  <p className="text-xs text-purple-400 text-center py-8">
                    لا توجد طلبات ألعاب مرسلة حتى الآن.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-5 rounded-2xl bg-purple-900/20 border border-purple-800/30 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-white">{sub.title}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : sub.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {sub.status === 'approved' ? 'مقبولة' : sub.status === 'rejected' ? 'مرفوضة' : 'تحت المراجعة'}
                              </span>
                            </div>
                            <span className="text-xs text-purple-300">{sub.subtitle} · من قِبل: <strong>{sub.authorUsername}</strong> ({sub.submittedAt})</span>
                          </div>

                          {sub.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveSubmission(sub.id)}
                                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>قبول واعتماد</span>
                              </button>
                              <button
                                onClick={() => handleRejectSubmission(sub.id)}
                                className="py-1.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 font-bold text-xs flex items-center gap-1 border border-red-800/50 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-purple-200/90 leading-relaxed bg-black/30 p-3 rounded-xl border border-purple-900/30">
                          {sub.description}
                        </p>

                        <div className="text-[11px] text-purple-300">
                          <strong>القواعد:</strong> {sub.rules.join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: QUESTIONS BANK ================= */}
          {adminTab === 'questions' && (
            <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 space-y-4">
              <h3 className="text-base font-black text-white">إدارة بنك الأسئلة والبطاقات ({questions.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-purple-900/40 text-purple-400 font-bold">
                      <th className="p-3">#</th>
                      <th className="p-3">اللعبة</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3">السؤال / الكلمة</th>
                      <th className="p-3">الإجابة / السر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30">
                    {questions.slice(0, 30).map((q, idx) => (
                      <tr key={q.id}>
                        <td className="p-3 text-purple-400">{idx + 1}</td>
                        <td className="p-3 text-white font-bold">{q.gameId}</td>
                        <td className="p-3 text-orange-400">{q.category}</td>
                        <td className="p-3 text-purple-200 max-w-xs truncate">{q.question || q.secretWord}</td>
                        <td className="p-3 text-emerald-400">{String(q.correctAnswer ?? q.secretWord ?? '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: ROOMS ================= */}
          {adminTab === 'rooms' && (
            <div className="rounded-3xl bg-purple-950/40 border border-purple-800/40 p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>مراقبة الغرف الحية أونلاين ({activeRooms.length})</span>
              </h3>
              {activeRooms.length === 0 ? (
                <p className="text-xs text-purple-400 text-center py-8">لا توجد غرف نشطة حالياً.</p>
              ) : (
                <div className="space-y-2">
                  {activeRooms.map(rm => (
                    <div key={rm.code} className="p-3 rounded-xl bg-purple-900/20 border border-purple-800/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-orange-400 text-sm ml-2">{rm.code}</span>
                        <span className="text-purple-300">· {rm.gameId} · {rm.status}</span>
                      </div>
                      <span className="text-purple-400">{rm.playerCount} لاعبين</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= ADD / EDIT GAME MODAL ================= */}
      {showGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#140b28] border-2 border-orange-500/40 p-6 sm:p-8 space-y-5 text-right max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-white">
              {editingGameId ? 'تعديل بيانات اللعبة' : 'إضافة لعبة جديدة إلى جَمْر'}
            </h3>

            <form onSubmit={handleSaveGameSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">اسم اللعبة *:</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-black/50 border border-purple-700/50 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">الشعار المختصر:</label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full bg-black/50 border border-purple-700/50 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">التصنيف:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as GameCategory)}
                    className="w-full bg-black/50 border border-purple-700/50 rounded-xl p-2.5 text-xs font-bold text-white"
                  >
                    <option value="trivia">أسئلة ومعرفة</option>
                    <option value="words">كلمات وتخمين</option>
                    <option value="deduction">خداع واستنتاج</option>
                    <option value="party">جمعات وضحك</option>
                    <option value="drawing">رسم وتمثيل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">الصعوبة:</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full bg-black/50 border border-purple-700/50 rounded-xl p-2.5 text-xs font-bold text-white"
                  >
                    <option value="سهل">سهل</option>
                    <option value="متوسط">متوسط</option>
                    <option value="حماسي">حماسي</option>
                    <option value="صعب">صعب</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">المدة:</label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full bg-black/50 border border-purple-700/50 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">الوصف:</label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-black/50 border border-purple-700/50 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1">القواعد (كل سطر قاعدة):</label>
                <textarea
                  rows={3}
                  value={formRules}
                  onChange={(e) => setFormRules(e.target.value)}
                  className="w-full bg-black/50 border border-purple-700/50 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-purple-900/40">
                <div className="text-xs font-bold text-purple-300">طريقة وتوفر اللعب:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-900/20 border border-purple-800/40">
                    <input
                      type="checkbox"
                      id="onlineCheck"
                      checked={formSupportsOnline}
                      onChange={(e) => setFormSupportsOnline(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                    />
                    <label htmlFor="onlineCheck" className="text-xs font-bold text-white cursor-pointer select-none">
                      تفعيل اللعب أونلاين 🌐
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-900/20 border border-purple-800/40">
                    <input
                      type="checkbox"
                      id="offlineCheck"
                      checked={formSupportsOffline}
                      onChange={(e) => setFormSupportsOffline(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                    />
                    <label htmlFor="offlineCheck" className="text-xs font-bold text-white cursor-pointer select-none">
                      تفعيل اللعب أوفلاين 📱
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popCheck"
                  checked={formIsPopular}
                  onChange={(e) => setFormIsPopular(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="popCheck" className="text-xs font-bold text-amber-300 cursor-pointer select-none">
                  تمييز اللعبة ضمن "الأكثر لعباً" 🔥
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                >
                  حفظ اللعبة
                </button>
                <button
                  type="button"
                  onClick={() => setShowGameModal(false)}
                  className="px-5 py-3 rounded-xl bg-purple-900/40 text-purple-300 text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
