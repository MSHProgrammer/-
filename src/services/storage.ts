import { UserProfile, CustomPack, GameHistoryRecord, Achievement, GameInfo, SubmittedGame, UserAccount } from '../types/game';
import { GAMES_CATALOG } from '../data/gamesCatalog';

const PROFILE_KEY = 'jamr_user_profile';
const CUSTOM_PACKS_KEY = 'jamr_custom_packs';
const ADMIN_SESSION_KEY = 'jamr_admin_logged';
const USERS_REGISTRY_KEY = 'jamr_registered_users';
const CURRENT_USER_ACCOUNT_KEY = 'jamr_current_account';
const GAMES_CATALOG_KEY = 'jamr_games_catalog_v2';
const SUBMISSIONS_KEY = 'jamr_submitted_games';
const ONBOARDING_COMPLETED_KEY = 'jamr_onboarding_done';

// Strict Admin Secret Passcode requested by user
export const ADMIN_SECRET_PIN = '1100321';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_spark',
    title: 'شرارة البداية',
    description: 'لعب أول جولة على منصة جَمْر بنجاح',
    icon: 'Flame',
    unlocked: false
  },
  {
    id: 'master_spy',
    title: 'سيد الخداع',
    description: 'الفوز في لعبة برا السالفة دون كشفك بنجاح',
    icon: 'EyeOff',
    unlocked: false,
    progress: { current: 0, total: 3 }
  },
  {
    id: 'trivia_genius',
    title: 'موسوعة الجلسة',
    description: 'إجابة 5 أسئلة متتالية بشكل صحيح في أسئلة ونقاط',
    icon: 'Sparkles',
    unlocked: false,
    progress: { current: 0, total: 5 }
  },
  {
    id: 'fast_talker',
    title: 'فصيح السهرة',
    description: 'شرح 3 بطاقات في "ممنوع تقول" دون الوقوع في أي كلمة محظورة',
    icon: 'MessageSquareX',
    unlocked: false,
    progress: { current: 0, total: 3 }
  },
  {
    id: 'party_host',
    title: 'زعيم الجمعة',
    description: 'إنشاء غرفة جماعية واللعب مع 4 لاعبين على الأقل أونلاين',
    icon: 'Crown',
    unlocked: false,
    progress: { current: 0, total: 1 }
  },
  {
    id: 'creator_fire',
    title: 'صانع الألعاب',
    description: 'إرسال لعبة جديدة بنجاح إلى منصة جَمْر',
    icon: 'Layers',
    unlocked: false,
    progress: { current: 0, total: 1 }
  }
];

export const AVATAR_OPTIONS = [
  '🔥', '🦁', '🦅', '🐺', '🦊', '⚡', '👑', '🎯', 
  '🚀', '🎩', '🎮', '💎', '🌙', '🎪', '🌶️', '🏆'
];

export const TITLE_LEVELS = [
  { minLevel: 1, title: 'جمرة جديدة' },
  { minLevel: 3, title: 'شرارة حماس' },
  { minLevel: 5, title: 'شعلة الجلسة' },
  { minLevel: 8, title: 'لهيب الذكاء' },
  { minLevel: 12, title: 'بركان التحدي' },
  { minLevel: 20, title: 'سلطان جَمْر' },
];

// ==================== ONBOARDING & ENTRY GATE ====================
export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

export function completeOnboarding(name: string, avatar: string = '🔥'): void {
  if (typeof window === 'undefined') return;
  const cleanName = name.trim();
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');

  // Register in user registry
  registerUser(cleanName, '', avatar);

  // Setup initial clean profile
  const profile: UserProfile = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    username: cleanName,
    avatar,
    title: 'جمرة جديدة',
    level: 1,
    xp: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    favoriteGames: ['barrah_salfa', 'trivia_spark'],
    achievements: INITIAL_ACHIEVEMENTS,
    createdPacks: [],
    history: [] // Clean history with no mock records
  };
  saveUserProfile(profile);
}

// ==================== USERS & ACCOUNTS ====================
export function getRegisteredUsers(): UserAccount[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_REGISTRY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isUsernameTaken(username: string): boolean {
  const users = getRegisteredUsers();
  const clean = username.trim().toLowerCase();
  return users.some(u => u.username.toLowerCase() === clean);
}

export function registerUser(username: string, password?: string, avatar: string = '🔥'): { success: boolean; error?: string } {
  const cleanName = username.trim();
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'الاسم يجب أن يكون حرفين على الأقل' };
  }

  if (isUsernameTaken(cleanName)) {
    return { success: false, error: 'هذا الاسم مستعمل بالفعل! يرجى اختيار اسم آخر فريد' };
  }

  const users = getRegisteredUsers();
  const newAccount: UserAccount = {
    username: cleanName,
    password: password || '',
    avatar,
    createdAt: new Date().toLocaleDateString('ar-SA')
  };

  users.push(newAccount);
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_ACCOUNT_KEY, JSON.stringify(newAccount));

  return { success: true };
}

export function loginUser(username: string, password?: string): { success: boolean; error?: string } {
  const cleanName = username.trim().toLowerCase();
  const users = getRegisteredUsers();
  const account = users.find(u => u.username.toLowerCase() === cleanName);

  if (!account) {
    // Automatically register if not existing
    return registerUser(username, password);
  }

  if (account.password && password && account.password !== password) {
    return { success: false, error: 'كلمة المرور غير صحيحة لهذا الحساب' };
  }

  localStorage.setItem(CURRENT_USER_ACCOUNT_KEY, JSON.stringify(account));
  
  // Sync profile
  const profile = getUserProfile();
  profile.username = account.username;
  if (account.avatar) profile.avatar = account.avatar;
  saveUserProfile(profile);

  return { success: true };
}

export function getCurrentUserAccount(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CURRENT_USER_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ==================== USER PROFILE ====================
export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return createEmptyProfile('');
  }
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    const fresh = createEmptyProfile('ولاع_جمر');
    localStorage.setItem(PROFILE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return createEmptyProfile('ولاع_جمر');
  }
}

function createEmptyProfile(name: string): UserProfile {
  return {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    username: name || 'ولاع_جمر',
    avatar: '🔥',
    title: 'جمرة جديدة',
    level: 1,
    xp: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    favoriteGames: ['barrah_salfa', 'trivia_spark'],
    achievements: INITIAL_ACHIEVEMENTS,
    createdPacks: [],
    history: []
  };
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function addMatchToHistory(record: Omit<GameHistoryRecord, 'id' | 'date'>): UserProfile {
  const profile = getUserProfile();
  const newRecord: GameHistoryRecord = {
    ...record,
    id: 'hist_' + Date.now(),
    date: new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
  };

  profile.history.unshift(newRecord);
  if (profile.history.length > 50) {
    profile.history = profile.history.slice(0, 50);
  }

  profile.matchesPlayed += 1;
  if (record.rank === 1) {
    profile.matchesWon += 1;
  }

  const gainedXP = record.rank === 1 ? 150 : 75;
  profile.xp += gainedXP;

  const newLevel = Math.floor(profile.xp / 200) + 1;
  profile.level = newLevel;

  const matchingTitle = [...TITLE_LEVELS].reverse().find(t => newLevel >= t.minLevel);
  if (matchingTitle) {
    profile.title = matchingTitle.title;
  }

  const firstAch = profile.achievements.find(a => a.id === 'first_spark');
  if (firstAch && !firstAch.unlocked) {
    firstAch.unlocked = true;
    firstAch.unlockedAt = 'الآن';
  }

  saveUserProfile(profile);
  return profile;
}

export function toggleFavoriteGame(gameId: string): boolean {
  const profile = getUserProfile();
  const exists = profile.favoriteGames.includes(gameId);
  if (exists) {
    profile.favoriteGames = profile.favoriteGames.filter(id => id !== gameId);
  } else {
    profile.favoriteGames.push(gameId);
  }
  saveUserProfile(profile);
  return !exists;
}

// ==================== DYNAMIC GAMES CATALOG (ADMIN MANAGED) ====================
export function getAllGamesCatalog(): GameInfo[] {
  if (typeof window === 'undefined') return GAMES_CATALOG;
  const raw = localStorage.getItem(GAMES_CATALOG_KEY);
  if (!raw) {
    // Initialize with standard catalogue
    localStorage.setItem(GAMES_CATALOG_KEY, JSON.stringify(GAMES_CATALOG));
    return GAMES_CATALOG;
  }
  try {
    const list: GameInfo[] = JSON.parse(raw);
    // Ensure all base games are present if catalogue updated
    const ids = new Set(list.map(g => g.id));
    for (const base of GAMES_CATALOG) {
      if (!ids.has(base.id)) {
        list.push(base);
      }
    }
    return list;
  } catch {
    return GAMES_CATALOG;
  }
}

export function saveGameToCatalog(game: GameInfo): void {
  const games = getAllGamesCatalog();
  const idx = games.findIndex(g => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.unshift(game);
  }
  localStorage.setItem(GAMES_CATALOG_KEY, JSON.stringify(games));
}

export function toggleGamePopular(gameId: string): void {
  const games = getAllGamesCatalog();
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.isPopular = !game.isPopular;
    localStorage.setItem(GAMES_CATALOG_KEY, JSON.stringify(games));
  }
}

export function toggleGameActive(gameId: string): void {
  const games = getAllGamesCatalog();
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.isActive = game.isActive === false ? true : false;
    localStorage.setItem(GAMES_CATALOG_KEY, JSON.stringify(games));
  }
}

export function toggleGameOnline(gameId: string): void {
  const games = getAllGamesCatalog();
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.supportsOnline = !game.supportsOnline;
    localStorage.setItem(GAMES_CATALOG_KEY, JSON.stringify(games));
  }
}

export function toggleGameOffline(gameId: string): void {
  const games = getAllGamesCatalog();
  const game = games.find(g => g.id === gameId);
  if (game) {
    game.supportsOffline = !game.supportsOffline;
    localStorage.setItem(GAMES_CATALOG_KEY, JSON.stringify(games));
  }
}

export function deleteGameFromCatalog(gameId: string): void {
  const games = getAllGamesCatalog().filter(g => g.id !== gameId);
  localStorage.setItem(GAMES_CATALOG_KEY, JSON.stringify(games));
}

// ==================== SUBMITTED GAMES (COMMUNITY REVIEW) ====================
export function getSubmittedGames(): SubmittedGame[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SUBMISSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function submitNewGame(data: Omit<SubmittedGame, 'id' | 'submittedAt' | 'status'>): SubmittedGame {
  const submissions = getSubmittedGames();
  const newSubmission: SubmittedGame = {
    ...data,
    id: 'sub_' + Date.now(),
    submittedAt: new Date().toLocaleDateString('ar-SA'),
    status: 'pending'
  };

  submissions.unshift(newSubmission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

  // Unlock Creator Achievement
  const profile = getUserProfile();
  const ach = profile.achievements.find(a => a.id === 'creator_fire');
  if (ach && !ach.unlocked) {
    ach.unlocked = true;
    ach.unlockedAt = 'الآن';
    saveUserProfile(profile);
  }

  return newSubmission;
}

export function reviewSubmittedGame(submissionId: string, action: 'approve' | 'reject', rejectionReason?: string): void {
  const submissions = getSubmittedGames();
  const item = submissions.find(s => s.id === submissionId);
  if (!item) return;

  item.status = action === 'approve' ? 'approved' : 'rejected';
  if (rejectionReason) item.rejectionReason = rejectionReason;
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

  if (action === 'approve') {
    // Automatically add to active games catalog!
    const newGame: GameInfo = {
      id: 'usr_game_' + Date.now(),
      title: item.title,
      subtitle: item.subtitle,
      category: item.category,
      categoryLabel: item.categoryLabel,
      description: item.description,
      rules: item.rules,
      minPlayers: item.minPlayers,
      maxPlayers: item.maxPlayers,
      durationMinutes: item.durationMinutes,
      difficulty: item.difficulty,
      accentColor: '#f97316',
      bgGradient: 'from-orange-600/20 via-purple-900/40 to-slate-900',
      isPopular: false,
      isNew: true,
      isActive: true,
      tags: [...item.tags, 'مبتكرة من المجتمع'],
      supportsOffline: true,
      supportsOnline: true,
      engineType: item.category === 'words' ? 'taboo' : item.category === 'deduction' ? 'barrah_salfa' : item.category === 'party' ? 'who_among_us' : 'trivia',
      submittedBy: item.authorUsername,
      submissionStatus: 'approved'
    };
    saveGameToCatalog(newGame);
  }
}

// ==================== ADMIN SESSION ====================
export function checkAdminSession(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function verifyAdminPin(enteredPin: string): boolean {
  const isValid = enteredPin.trim() === ADMIN_SECRET_PIN;
  if (isValid) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  }
  return isValid;
}

export function setAdminSession(active: boolean): void {
  if (typeof window === 'undefined') return;
  if (active) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// ==================== CUSTOM PACKS ====================
export function getCustomPacks(): CustomPack[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CUSTOM_PACKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomPack(pack: CustomPack): void {
  const packs = getCustomPacks();
  const existingIndex = packs.findIndex(p => p.id === pack.id);
  if (existingIndex >= 0) {
    packs[existingIndex] = pack;
  } else {
    packs.unshift(pack);
  }
  localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(packs));
}

export function deleteCustomPack(packId: string): void {
  const packs = getCustomPacks().filter(p => p.id !== packId);
  localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(packs));
}
