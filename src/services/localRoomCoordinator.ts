import { QUESTIONS_BANK } from '../data/questionsBank';
import { RoomState, QuestionItem } from '../types/game';

export interface LocalPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  secretRole?: string;
  secretWord?: string;
  currentAnswer?: any;
  hasVoted?: boolean;
}

export interface LocalRoom {
  code: string;
  gameId: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'round_results' | 'game_over';
  maxPlayers: number;
  players: LocalPlayer[];
  currentRound: number;
  totalRounds: number;
  timerSeconds: number;
  timerActive: boolean;
  gameData?: any;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
  }>;
  lastActive: number;
}

export class LocalRoomCoordinator {
  private room: LocalRoom | null = null;
  private timerInterval: any = null;
  private onStateChange: (sanitizedRoom: RoomState, forPlayerId?: string) => void;
  private onMessage: (msg: any, toPlayerId?: string) => void;

  constructor(
    onStateChange: (sanitizedRoom: RoomState, forPlayerId?: string) => void,
    onMessage: (msg: any, toPlayerId?: string) => void
  ) {
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
  }

  public getRoom(): LocalRoom | null {
    return this.room;
  }

  public createRoom(code: string, hostPlayerId: string, hostName: string, avatar: string, gameId: string): LocalRoom {
    const host: LocalPlayer = {
      id: hostPlayerId,
      name: hostName || 'مضيف جَمْر',
      avatar: avatar || '🔥',
      score: 0,
      isHost: true,
      isReady: true,
      connected: true
    };

    this.room = {
      code: code.toUpperCase(),
      gameId: gameId || 'barrah_salfa',
      hostId: hostPlayerId,
      status: 'lobby',
      maxPlayers: 12,
      players: [host],
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

    this.startTimerLoop();
    this.broadcastState();
    return this.room;
  }

  public joinRoom(roomCode: string, playerId: string, playerName: string, avatar: string, existingPlayerId?: string): boolean {
    if (!this.room || this.room.code !== roomCode.toUpperCase()) {
      return false;
    }

    const targetId = existingPlayerId || playerId;
    const existing = this.room.players.find(p => p.id === targetId);

    if (existing) {
      existing.connected = true;
      existing.name = playerName || existing.name;
      existing.avatar = avatar || existing.avatar;
    } else {
      if (this.room.players.length >= this.room.maxPlayers) {
        this.onMessage({ type: 'error', message: 'الغرفة ممتلئة بالكامل!' }, playerId);
        return false;
      }

      const newPlayer: LocalPlayer = {
        id: targetId,
        name: playerName || `لاعب ${this.room.players.length + 1}`,
        avatar: avatar || '⚡',
        score: 0,
        isHost: false,
        isReady: false,
        connected: true
      };

      this.room.players.push(newPlayer);
      this.room.messages.push({
        id: 'sys_' + Date.now(),
        senderId: 'system',
        senderName: 'جَمْر',
        text: `انضم ${newPlayer.name} إلى الغرفة! 🎉`,
        timestamp: Date.now(),
        isSystem: true
      });
    }

    this.onMessage({
      type: 'joined',
      roomCode: this.room.code,
      playerId: targetId,
      room: this.sanitizeRoom(targetId)
    }, targetId);

    this.broadcastState();
    return true;
  }

  public handleClientMessage(senderId: string, msg: any) {
    if (!this.room) return;

    switch (msg.type) {
      case 'toggle_ready': {
        const p = this.room.players.find(x => x.id === senderId);
        if (p) {
          p.isReady = !p.isReady;
          this.broadcastState();
        }
        break;
      }

      case 'start_game': {
        if (this.room.hostId === senderId) {
          this.setupRound(1);
          this.broadcastState();
        }
        break;
      }

      case 'next_round': {
        if (this.room.hostId === senderId) {
          if (this.room.currentRound >= this.room.totalRounds) {
            this.room.status = 'game_over';
            this.room.timerActive = false;
            this.broadcastState();
          } else {
            this.setupRound(this.room.currentRound + 1);
            this.broadcastState();
          }
        }
        break;
      }

      case 'submit_answer': {
        const { answer, scorePoints } = msg;
        const player = this.room.players.find(x => x.id === senderId);
        if (player) {
          player.currentAnswer = answer;
          player.hasVoted = true;
          if (scorePoints) {
            player.score += Number(scorePoints);
          }
          if (this.room.gameData) {
            if (!this.room.gameData.playerAnswers) {
              this.room.gameData.playerAnswers = {};
            }
            this.room.gameData.playerAnswers[senderId] = answer;
          }
          this.broadcastState();
        }
        break;
      }

      case 'vote_player': {
        const { targetPlayerId } = msg;
        const voter = this.room.players.find(x => x.id === senderId);
        if (voter && this.room.gameData) {
          voter.hasVoted = true;
          if (!this.room.gameData.votes) {
            this.room.gameData.votes = {};
          }
          this.room.gameData.votes[targetPlayerId] = (this.room.gameData.votes[targetPlayerId] || 0) + 1;
          this.broadcastState();
        }
        break;
      }

      case 'send_chat': {
        const { text } = msg;
        const sender = this.room.players.find(x => x.id === senderId);
        if (sender && text) {
          this.room.messages.push({
            id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            senderId,
            senderName: sender.name,
            text,
            timestamp: Date.now()
          });
          this.broadcastState();
        }
        break;
      }

      case 'voice_signal': {
        const { toPlayerId, signal } = msg;
        if (toPlayerId) {
          this.onMessage({ type: 'voice_signal', fromPlayerId: senderId, signal }, toPlayerId);
        } else {
          for (const p of this.room.players) {
            if (p.id !== senderId) {
              this.onMessage({ type: 'voice_signal', fromPlayerId: senderId, signal }, p.id);
            }
          }
        }
        break;
      }

      case 'kick_player': {
        if (this.room.hostId === senderId) {
          const targetId = msg.targetPlayerId || msg.playerIdToKick;
          const index = this.room.players.findIndex(x => x.id === targetId);
          if (index !== -1) {
            const kicked = this.room.players[index];
            this.room.players.splice(index, 1);
            this.onMessage({ type: 'kicked', message: 'تم استبعادك من الغرفة بواسطة المضيف.' }, targetId);
            this.room.messages.push({
              id: 'sys_' + Date.now(),
              senderId: 'system',
              senderName: 'جَمْر',
              text: `تم استبعاد ${kicked.name} من الغرفة.`,
              timestamp: Date.now(),
              isSystem: true
            });
            this.broadcastState();
          }
        }
        break;
      }

      case 'leave_room': {
        const index = this.room.players.findIndex(x => x.id === senderId);
        if (index !== -1) {
          const leaving = this.room.players[index];
          this.room.players.splice(index, 1);
          if (leaving.isHost && this.room.players.length > 0) {
            this.room.players[0].isHost = true;
            this.room.hostId = this.room.players[0].id;
          }
          this.broadcastState();
        }
        break;
      }
    }
  }

  private setupRound(roundNumber: number) {
    if (!this.room) return;
    this.room.currentRound = roundNumber;
    this.room.status = 'playing';
    this.room.timerActive = true;

    // Reset player answers/votes
    this.room.players.forEach(p => {
      p.currentAnswer = null;
      p.hasVoted = false;
      p.secretRole = undefined;
      p.secretWord = undefined;
    });

    if (this.room.gameId === 'barrah_salfa') {
      const oddIndex = Math.floor(Math.random() * this.room.players.length);
      const salfas = QUESTIONS_BANK.filter(q => q.gameId === 'barrah_salfa');
      const pick = salfas[(roundNumber - 1) % salfas.length] || salfas[0];

      this.room.players.forEach((p, idx) => {
        if (idx === oddIndex) {
          p.secretRole = 'odd_one';
          p.secretWord = '??? أنت برا السالفة! حاول تسلّك وما تنكشف! ???';
        } else {
          p.secretRole = 'inside';
          p.secretWord = pick.secretWord;
        }
      });

      this.room.timerSeconds = 120;
      this.room.gameData = {
        category: pick.category,
        secretWord: pick.secretWord,
        oddPlayerId: this.room.players[oddIndex]?.id,
        votes: {}
      };
    } else if (this.room.gameId === 'trivia_spark') {
      const triviaQuestions = QUESTIONS_BANK.filter(q => q.gameId === 'trivia_spark');
      const q = triviaQuestions[(roundNumber - 1) % triviaQuestions.length] || triviaQuestions[0];
      this.room.timerSeconds = 20;
      this.room.gameData = {
        questionId: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        playerAnswers: {}
      };
    } else if (this.room.gameId === 'taboo_words') {
      const taboos = QUESTIONS_BANK.filter(q => q.gameId === 'taboo_words');
      const t = taboos[(roundNumber - 1) % taboos.length] || taboos[0];
      this.room.timerSeconds = 60;
      const describer = this.room.players[(roundNumber - 1) % this.room.players.length];
      this.room.gameData = {
        describerId: describer.id,
        describerName: describer.name,
        targetWord: t.question,
        category: t.category,
        forbiddenWords: t.forbiddenWords,
        hints: t.hints
      };
    } else if (this.room.gameId === 'who_among_us') {
      const questions = QUESTIONS_BANK.filter(q => q.gameId === 'who_among_us');
      const q = questions[(roundNumber - 1) % questions.length] || questions[0];
      this.room.timerSeconds = 30;
      this.room.gameData = {
        question: q.question,
        category: q.category,
        votes: {}
      };
    } else if (this.room.gameId === 'fact_or_fiction') {
      const facts = QUESTIONS_BANK.filter(q => q.gameId === 'fact_or_fiction');
      const f = facts[(roundNumber - 1) % facts.length] || facts[0];
      this.room.timerSeconds = 15;
      this.room.gameData = {
        question: f.question,
        category: f.category,
        correctAnswer: f.correctAnswer,
        explanation: f.explanation,
        playerAnswers: {}
      };
    } else if (this.room.gameId === 'this_or_that') {
      const dilemmas = QUESTIONS_BANK.filter(q => q.gameId === 'this_or_that');
      const d = dilemmas[(roundNumber - 1) % dilemmas.length] || dilemmas[0];
      this.room.timerSeconds = 25;
      this.room.gameData = {
        question: d.question,
        category: d.category,
        optionsAB: d.optionsAB,
        votes: {}
      };
    } else {
      this.room.timerSeconds = 30;
      this.room.gameData = { generic: true };
    }
  }

  private startTimerLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.room && this.room.status === 'playing' && this.room.timerActive && this.room.timerSeconds > 0) {
        this.room.timerSeconds -= 1;
        if (this.room.timerSeconds <= 0) {
          this.room.timerActive = false;
          this.room.status = 'round_results';
          this.room.messages.push({
            id: 'sys_' + Date.now(),
            senderId: 'system',
            senderName: 'جَمْر',
            text: 'انتهى وقت الجولة! لنرى النتائج 🔥',
            timestamp: Date.now(),
            isSystem: true
          });
        }
        this.broadcastState();
      }
    }, 1000);
  }

  public sanitizeRoom(forPlayerId?: string): RoomState {
    if (!this.room) throw new Error('No active room');
    const room = this.room;

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
      lastActive: room.lastActive,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isHost: p.isHost,
        isReady: p.isReady,
        connected: p.connected,
        hasVoted: p.hasVoted,
        secretRole: (room.status === 'round_results' || room.status === 'game_over' || p.id === forPlayerId) ? p.secretRole : undefined,
        secretWord: (room.status === 'round_results' || room.status === 'game_over' || p.id === forPlayerId) ? p.secretWord : undefined
      })),
      gameData: room.gameData ? this.getClientSpecificGameData(forPlayerId) : undefined
    };
  }

  private getClientSpecificGameData(forPlayerId?: string) {
    if (!this.room?.gameData) return undefined;
    const clone = { ...this.room.gameData };

    if (this.room.gameId === 'trivia_spark' || this.room.gameId === 'fact_or_fiction') {
      if (this.room.status === 'playing') {
        delete clone.correctAnswer;
        delete clone.explanation;
      }
    }

    if (this.room.gameId === 'barrah_salfa') {
      const player = this.room.players.find(p => p.id === forPlayerId);
      if (player && player.secretRole === 'odd_one' && this.room.status === 'playing') {
        clone.secretWord = '??? أنت برا السالفة! حاول تسلّك وما تنكشف! ???';
      }
    }

    return clone;
  }

  private broadcastState() {
    if (!this.room) return;
    this.room.lastActive = Date.now();
    for (const player of this.room.players) {
      const sanitized = this.sanitizeRoom(player.id);
      this.onStateChange(sanitized, player.id);
    }
  }

  public destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.room = null;
  }
}
