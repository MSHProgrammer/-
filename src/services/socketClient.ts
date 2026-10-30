import { Peer, DataConnection } from 'peerjs';
import { RoomState } from '../types/game';
import { LocalRoomCoordinator } from './localRoomCoordinator';

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
  
  // P2P / Serverless mode support (Netlify & static hosts)
  private isP2PMode: boolean = false;
  private coordinator: LocalRoomCoordinator | null = null;
  private peer: Peer | null = null;
  private peerConnections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('jamr_player_id');
      if (savedId) this.myPlayerId = savedId;
      const savedCode = sessionStorage.getItem('jamr_room_code');
      if (savedCode) this.currentRoomCode = savedCode;
    }
  }

  /**
   * Determine the WebSocket server URL.
   * If VITE_WS_URL is set, use it.
   * If on Netlify (e.g. *.netlify.app) and no custom server URL is set, we use P2P serverless mode.
   */
  private getWsUrl(): string | null {
    if (typeof window === 'undefined') return null;

    // Check custom environment or window variable
    const custom = (import.meta as any).env?.VITE_WS_URL || (window as any).__JAMR_WS_URL__;
    if (custom) return custom;

    // If running on Netlify without custom backend, WebSockets won't work on netlify.app
    const hostname = window.location.hostname;
    if (hostname.endsWith('netlify.app') || hostname.endsWith('github.io')) {
      return null;
    }

    // Default to origin WebSocket (works in Google AI Studio, Cloud Run, VPS, and local dev)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
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

      const wsUrl = this.getWsUrl();

      // If no valid WebSocket endpoint (e.g. Netlify static), activate P2P mode immediately
      if (!wsUrl) {
        this.isP2PMode = true;
        resolve(true);
        return;
      }

      try {
        this.intentionalClose = false;
        const testWs = new WebSocket(wsUrl);
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('⚡ WebSocket timeout - switching to P2P Netlify-ready mode');
            this.isP2PMode = true;
            try { testWs.close(); } catch (_) {}
            resolve(true);
          }
        }, 1500);

        testWs.onopen = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.ws = testWs;
            this.isP2PMode = false;

            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }

            // Reconnect to existing room if applicable
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
          }
        };

        testWs.onmessage = (event) => {
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

        testWs.onclose = () => {
          if (!this.intentionalClose && this.currentRoomCode && !this.isP2PMode) {
            this.reconnectTimer = setTimeout(() => {
              this.connect();
            }, 2500);
          }
        };

        testWs.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log('⚡ WebSocket unavailable on this domain - switching to P2P serverless mode for Netlify');
            this.isP2PMode = true;
            resolve(true);
          }
        };
      } catch (err) {
        console.warn('WS init error, switching to P2P mode:', err);
        this.isP2PMode = true;
        resolve(true);
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
    if (!this.isP2PMode && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return;
    }

    // In P2P Mode:
    if (this.coordinator) {
      // Local Host Coordinator handles it
      const senderId = this.myPlayerId || 'host';
      this.coordinator.handleClientMessage(senderId, payload);

      // Also forward to peer data connections & BroadcastChannel
      this.broadcastToPeers(payload);
    } else if (this.hostConnection && this.hostConnection.open) {
      // Guest sends to Host via DataConnection
      this.hostConnection.send(payload);
    } else if (this.broadcastChannel) {
      // Send via BroadcastChannel fallback
      this.broadcastChannel.postMessage({
        senderId: this.myPlayerId,
        payload
      });
    }
  }

  public async createRoom(playerName: string, avatar: string, gameId: string) {
    this.myPlayerName = playerName;
    this.myAvatar = avatar;

    // Ensure we are connected or routed
    await this.connect();

    if (!this.isP2PMode && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'create_room',
        playerName,
        avatar,
        gameId
      });
      return;
    }

    // ================= P2P SERVERLESS ROOM CREATION (NETLIFY) =================
    this.isP2PMode = true;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    this.myPlayerId = playerId;
    this.currentRoomCode = code;
    sessionStorage.setItem('jamr_player_id', playerId);
    sessionStorage.setItem('jamr_room_code', code);

    // Setup Local Host Coordinator
    this.coordinator = new LocalRoomCoordinator(
      (sanitizedRoom, forPlayerId) => {
        if (!forPlayerId || forPlayerId === this.myPlayerId) {
          this.notifyListeners({ type: 'room_state', room: sanitizedRoom });
        }
        // Send state update to peers
        this.broadcastRoomStateToPeers();
      },
      (msg, toPlayerId) => {
        if (!toPlayerId || toPlayerId === this.myPlayerId) {
          this.notifyListeners(msg);
        }
        // Forward message to specific peer
        if (toPlayerId && toPlayerId !== this.myPlayerId) {
          const conn = this.peerConnections.get(toPlayerId);
          if (conn && conn.open) conn.send(msg);
          if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({ targetPlayerId: toPlayerId, msg });
          }
        }
      }
    );

    const room = this.coordinator.createRoom(code, playerId, playerName, avatar, gameId);

    // Setup BroadcastChannel for instant local multi-tab / same-device testing
    try {
      this.setupBroadcastChannel(code, true);
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // Setup PeerJS for internet multiplayer on Netlify
    try {
      this.initHostPeer(code);
    } catch (e) {
      console.warn('PeerJS init error:', e);
    }

    // Notify listeners that room is ready immediately
    this.notifyListeners({
      type: 'joined',
      roomCode: code,
      playerId,
      room: this.coordinator.sanitizeRoom(playerId)
    });
  }

  public async joinRoom(roomCode: string, playerName: string, avatar: string) {
    const cleanCode = roomCode.trim().toUpperCase();
    this.currentRoomCode = cleanCode;
    this.myPlayerName = playerName;
    this.myAvatar = avatar;

    await this.connect();

    if (!this.isP2PMode && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'join_room',
        roomCode: cleanCode,
        playerName,
        avatar,
        existingPlayerId: this.myPlayerId
      });
      return;
    }

    // ================= P2P SERVERLESS ROOM JOIN (NETLIFY) =================
    this.isP2PMode = true;
    if (!this.myPlayerId) {
      this.myPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('jamr_player_id', this.myPlayerId);
    }
    sessionStorage.setItem('jamr_room_code', cleanCode);

    // Setup BroadcastChannel
    this.setupBroadcastChannel(cleanCode, false);

    // Broadcast join request over BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'peer_join_request',
        roomCode: cleanCode,
        playerId: this.myPlayerId,
        playerName,
        avatar
      });
    }

    // Setup PeerJS connection to Host
    this.initGuestPeer(cleanCode, playerName, avatar);
  }

  private initHostPeer(code: string) {
    const peerId = `jamr-room-${code.toLowerCase()}`;
    try {
      if (this.peer) this.peer.destroy();
      this.peer = new Peer(peerId, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        console.log(`🔥 [جَمْر P2P] مضيف الغرفة جاهز على المعرّف: ${id}`);
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          console.log(`⚡ لاعب جديد متصل عبر WebRTC: ${conn.peer}`);
        });

        conn.on('data', (data: any) => {
          this.handleIncomingPeerData(conn, data);
        });

        conn.on('close', () => {
          this.peerConnections.delete(conn.peer);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS host note:', err);
      });
    } catch (e) {
      console.warn('Host peer failed:', e);
    }
  }

  private initGuestPeer(code: string, playerName: string, avatar: string) {
    const targetPeerId = `jamr-room-${code.toLowerCase()}`;
    try {
      if (this.peer) this.peer.destroy();
      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        const conn = this.peer!.connect(targetPeerId, { reliable: true });
        this.hostConnection = conn;

        conn.on('open', () => {
          console.log('⚡ متصل بمضيف الغرفة عبر WebRTC!');
          conn.send({
            type: 'join_room',
            roomCode: code,
            playerId: this.myPlayerId,
            playerName,
            avatar
          });
        });

        conn.on('data', (data: any) => {
          if (data.type === 'joined') {
            this.currentRoomCode = data.roomCode;
            this.myPlayerId = data.playerId;
            sessionStorage.setItem('jamr_player_id', data.playerId);
            sessionStorage.setItem('jamr_room_code', data.roomCode);
          }
          this.notifyListeners(data);
        });

        conn.on('close', () => {
          console.log('انقطع الاتصال بالمضيف');
        });

        conn.on('error', (err) => {
          console.warn('Host connection error:', err);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Guest peer warning:', err);
      });
    } catch (e) {
      console.warn('Guest peer failed:', e);
    }
  }

  private handleIncomingPeerData(conn: DataConnection, data: any) {
    if (!this.coordinator) return;

    if (data.type === 'join_room') {
      const playerId = data.playerId || 'p_' + Math.random().toString(36).substring(2, 7);
      this.peerConnections.set(playerId, conn);
      this.peerConnections.set(conn.peer, conn);

      this.coordinator.joinRoom(
        data.roomCode,
        playerId,
        data.playerName,
        data.avatar,
        data.existingPlayerId
      );
    } else {
      const senderId = data.senderId || conn.peer;
      this.coordinator.handleClientMessage(senderId, data);
      this.broadcastRoomStateToPeers();
    }
  }

  private setupBroadcastChannel(code: string, isHost: boolean) {
    if (typeof BroadcastChannel === 'undefined') return;
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (_) {}
    }

    this.broadcastChannel = new BroadcastChannel(`jamr_channel_${code.toUpperCase()}`);

    this.broadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (isHost && this.coordinator) {
        if (data.type === 'peer_join_request') {
          this.coordinator.joinRoom(
            data.roomCode,
            data.playerId,
            data.playerName,
            data.avatar
          );
        } else if (data.payload && data.senderId) {
          this.coordinator.handleClientMessage(data.senderId, data.payload);
        }
      } else if (!isHost) {
        if (data.targetPlayerId && data.targetPlayerId === this.myPlayerId && data.msg) {
          if (data.msg.type === 'joined') {
            this.currentRoomCode = data.msg.roomCode;
            this.myPlayerId = data.msg.playerId;
            sessionStorage.setItem('jamr_player_id', data.msg.playerId);
            sessionStorage.setItem('jamr_room_code', data.msg.roomCode);
          }
          this.notifyListeners(data.msg);
        } else if (data.type === 'room_state' || data.type === 'joined') {
          this.notifyListeners(data);
        }
      }
    };
  }

  private broadcastToPeers(payload: any) {
    this.peerConnections.forEach((conn) => {
      if (conn.open) conn.send(payload);
    });

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }
  }

  private broadcastRoomStateToPeers() {
    if (!this.coordinator) return;

    this.peerConnections.forEach((conn, pId) => {
      if (conn.open) {
        try {
          const sanitized = this.coordinator!.sanitizeRoom(pId);
          conn.send({ type: 'room_state', room: sanitized });
        } catch (_) {}
      }
    });

    if (this.broadcastChannel) {
      try {
        const sanitized = this.coordinator.sanitizeRoom();
        this.broadcastChannel.postMessage({ type: 'room_state', room: sanitized });
      } catch (_) {}
    }
  }

  public leaveRoom() {
    this.intentionalClose = true;
    this.currentRoomCode = null;
    sessionStorage.removeItem('jamr_room_code');

    if (this.coordinator) {
      this.coordinator.destroy();
      this.coordinator = null;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }

    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (_) {}
      this.broadcastChannel = null;
    }

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

  public getIsP2PMode(): boolean {
    return this.isP2PMode;
  }
}

export const socket = new SocketClient();
