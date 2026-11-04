export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionPoints = 200 | 400 | 600;

export type ChallengeType = 
  | 'normal' 
  | 'image' 
  | 'character' 
  | 'acting' 
  | 'drawing' 
  | 'number_guess' 
  | 'sound';

export interface Question {
  id: string;
  topicId: string;
  points: QuestionPoints;
  difficulty: Difficulty;
  questionText: string;
  answerText: string;
  hints: string[];
  challengeType?: ChallengeType;
  mediaUrl?: string; // Image or audio/video URL if applicable
  mediaType?: 'image' | 'video'; // Explicit media type (image or video)
  explanation?: string;
  author?: string;
  createdAt?: number;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order?: number;
  topicCount?: number;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  coverImage: string; // Distinct comic caricature illustration
  sectionId: string;  // Link topic to section (e.g. football, games, cinema, etc.)
  category: string;
  icon?: string;
  questionCount?: number;
  isPopular?: boolean;
  createdAt?: number;
}

export type LifelineType = 
  | 'two_answers'   // جاوب جوابين
  | 'call_friend'   // اتصال بصديق (+30s)
  | 'pitfall'       // الحفرة (خصم من الخصم)
  | 'bench_player'  // استريح (إبعاد لاعب من الخصم)
  | 'the_trap';     // الفخ (تحويل السؤال للخصم مع مخاطرة)

export interface Team {
  id: 'team1' | 'team2';
  name: string;
  color: string;
  accentBg: string;
  textColor: string;
  score: number;
  players: string[];
  lifelines: Record<LifelineType, boolean>; // true = available, false = used
}

export interface BoardTile {
  topicId: string;
  questionId: string;
  points: QuestionPoints;
  rowIdx: number; // 0..5 (0,1 -> 200; 2,3 -> 400; 4,5 -> 600)
  colIdx: number; // 0..5 (one of the 6 topics)
  isUsed: boolean;
  answeredBy?: 'team1' | 'team2' | 'none';
  pointsAwarded?: number;
}

export interface MatchSettings {
  timerSeconds: number; // default 30
  deductOnWrong: boolean; // deduct points when wrong
  allowSteal: boolean; // allows opponent team to steal if first team fails
  lifelinesEnabled: boolean;
  tieBreakerEnabled: boolean;
}

export interface ActiveQuestionState {
  tile: { col: number; row: number };
  question: Question;
  topic: Topic;
  choosingTeam: 'team1' | 'team2';
  answeringTeam: 'team1' | 'team2';
  status: 'question_shown' | 'answering' | 'answer_revealed' | 'scored';
  remainingSeconds: number;
  timerRunning: boolean;
  twoAnswersAttemptsLeft?: number;
  activeLifeline?: {
    type: LifelineType;
    teamId: 'team1' | 'team2';
    detail?: string;
  };
}

export interface MatchHistoryEntry {
  id: string;
  timestamp: number;
  teamId?: 'team1' | 'team2';
  action: string;
  pointsDelta?: number;
  note: string;
}

export interface JamrMatchState {
  id: string;
  code?: string;
  mode: 'local' | 'online';
  status: 'setup' | 'playing' | 'game_over';
  teams: {
    team1: Team;
    team2: Team;
  };
  currentTurn: 'team1' | 'team2';
  topics: Topic[]; // Exactly 6 topics
  board: BoardTile[][]; // 6 columns x 6 rows
  settings: MatchSettings;
  activeQuestion: ActiveQuestionState | null;
  winner?: 'team1' | 'team2' | 'tie';
  history: MatchHistoryEntry[];
}

export interface OnlinePlayer {
  id: string;
  name: string;
  team: 'team1' | 'team2' | 'spectator';
  isHost: boolean;
  isReady: boolean;
  avatar: string;
  connected: boolean;
}

export interface OnlineRoomData {
  code: string;
  hostId: string;
  match: JamrMatchState;
  players: OnlinePlayer[];
  chatMessages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    team?: string;
  }>;
}
