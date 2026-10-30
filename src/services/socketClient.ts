import { RoomState } from '../types/game';

type MessageHandler = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private reconnectTimer: any = null;
  private currentRoomCode: string | null = null;
  private myPlayerId: string | null = null;
  private myPlayerName: string = '';
  private myAvatar: string = '🔥';
  private intentionalClose: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('jamr_player_id');
      if (savedId) this.myPlayerId = savedId;
    }
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        this.intentionalClose = false;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }

          // If reconnecting to existing room
          if (this.currentRoomCode && this.myPlayerId) {
            this.send({
              type: 'join_room',
              roomCode: this.currentRoomCode,
              playerName: this.myPlayerName,
              avatar: this.myAvatar,
              existingPlayerId: this.myPlayerId
            });
          }

          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'joined') {
              this.currentRoomCode = data.roomCode;
              this.myPlayerId = data.playerId;
              sessionStorage.setItem('jamr_player_id', data.playerId);
              sessionStorage.setItem('jamr_room_code', data.roomCode);
            }
            this.notifyListeners(data);
          } catch (e) {
            console.error('Failed to parse WS msg:', e);
          }
        };

        this.ws.onclose = () => {
          if (!this.intentionalClose && this.currentRoomCode) {
            this.reconnectTimer = setTimeout(() => {
              this.connect();
            }, 2500);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('WS error', err);
          resolve(false);
        };
      } catch (err) {
        console.error('WS connection error', err);
        resolve(false);
      }
    });
  }

  public subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach((fn) => fn(data));
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.connect().then((ok) => {
        if (ok && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(payload));
        }
      });
    }
  }

  public createRoom(playerName: string, avatar: string, gameId: string) {
    this.myPlayerName = playerName;
    this.myAvatar = avatar;
    this.send({
      type: 'create_room',
      playerName,
      avatar,
      gameId
    });
  }

  public joinRoom(roomCode: string, playerName: string, avatar: string) {
    this.currentRoomCode = roomCode.toUpperCase();
    this.myPlayerName = playerName;
    this.myAvatar = avatar;
    this.send({
      type: 'join_room',
      roomCode: this.currentRoomCode,
      playerName,
      avatar,
      existingPlayerId: this.myPlayerId
    });
  }

  public leaveRoom() {
    this.intentionalClose = true;
    this.currentRoomCode = null;
    sessionStorage.removeItem('jamr_room_code');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public getPlayerId(): string | null {
    return this.myPlayerId;
  }

  public getRoomCode(): string | null {
    return this.currentRoomCode;
  }
}

export const socket = new SocketClient();
