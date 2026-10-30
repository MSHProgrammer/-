export type GameCategory = 
  | 'trivia'       // أسئلة ومعرفة
  | 'words'        // كلمات وتخمين
  | 'deduction'    // خداع واستنتاج
  | 'drawing'      // رسم وتمثيل
  | 'party';       // جمعات وضحك

export type DifficultyLevel = 'سهل' | 'متوسط' | 'حماسي' | 'صعب';

export interface GameInfo {
  id: string;
  title: string;
  subtitle: string;
  category: GameCategory;
  categoryLabel: string;
  description: string;
  rules: string[];
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: string;
  difficulty: DifficultyLevel;
  icon?: string;
  accentColor: string;
  bgGradient: string;
  isPopular?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  tags: string[];
  supportsOffline: boolean;
  supportsOnline: boolean;
  engineType: 'barrah_salfa' | 'trivia' | 'taboo' | 'who_among_us' | 'fact_or_fiction' | 'sketch' | 'mafia' | 'this_or_that';
  submittedBy?: string;
  submissionStatus?: 'approved' | 'pending' | 'rejected';
}

export interface SubmittedGame {
  id: string;
  title: string;
  subtitle: string;
  category: GameCategory;
  categoryLabel: string;
  description: string;
  rules: string[];
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: string;
  difficulty: DifficultyLevel;
  tags: string[];
  authorUsername: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface UserAccount {
  username: string;
  password?: string;
  avatar: string;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost?: boolean;
  isReady?: boolean;
  score: number;
  team?: 'A' | 'B';
  secretRole?: string;
  secretWord?: string;
  isEliminated?: boolean;
  connected?: boolean;
  hasVoted?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export type RoomStatus = 'lobby' | 'playing' | 'round_results' | 'game_over';

export interface RoomState {
  code: string;
  gameId: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  timerSeconds: number;
  timerActive: boolean;
  customPackId?: string;
  gameData?: any;
  messages: ChatMessage[];
  lastActive: number;
}

export interface QuestionItem {
  id: string;
  gameId: string;
  category: string;
  question?: string;
  options?: string[];
  correctAnswer?: string | boolean | number;
  explanation?: string;
  forbiddenWords?: string[];
  hints?: string[];
  secretWord?: string;
  secretCategory?: string;
  optionsAB?: [string, string];
}

export interface CustomPack {
  id: string;
  title: string;
  author: string;
  gameType: 'trivia' | 'taboo' | 'barrah_salfa' | 'party';
  description: string;
  itemCount: number;
  items: QuestionItem[];
  createdDate: string;
  likes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: { current: number; total: number };
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  title: string;
  level: number;
  xp: number;
  matchesPlayed: number;
  matchesWon: number;
  favoriteGames: string[];
  achievements: Achievement[];
  createdPacks: CustomPack[];
  history: GameHistoryRecord[];
}

export interface GameHistoryRecord {
  id: string;
  gameId: string;
  gameTitle: string;
  mode: 'online' | 'offline';
  date: string;
  playerCount: number;
  winnerName: string;
  userScore: number;
  rank: number;
}
