// WebSocket client for Trust Agent Desktop - real-time agent communication

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.trust-agent.ai/ws';
const RECONNECT_DELAY = 3000;

type WSEventType =
  | 'agent-response'
  | 'agent-thinking'
  | 'agent-error'
  | 'task-update'
  | 'session-end'
  | 'connected'
  | 'disconnected'
  | 'reconnecting';

type WSSendType = 'user-message' | 'start-session' | 'cancel-task';

type EventHandler = (data: unknown) => void;

interface WSMessage {
  type: string;
  payload: unknown;
}

export class TrustAgentWS {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private token: string | null = null;
  private shouldReconnect = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  connect(token: string): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.token = token;
    this.shouldReconnect = true;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.notify('connected', null);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: WSMessage = JSON.parse(event.data as string);
          this.notify(msg.type, msg.payload);
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        this.notify('disconnected', null);

        if (this.shouldReconnect && this.token) {
          this.notify('reconnecting', null);
          this.reconnectTimer = setTimeout(() => {
            if (this.token) {
              this.connect(this.token);
            }
          }, RECONNECT_DELAY);
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        // onclose will fire after onerror, reconnection handled there
      };
    } catch {
      this.isConnecting = false;
      if (this.shouldReconnect && this.token) {
        this.reconnectTimer = setTimeout(() => {
          if (this.token) {
            this.connect(this.token);
          }
        }, RECONNECT_DELAY);
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.token = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: WSEventType, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: WSEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(type: WSSendType, payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const msg: WSMessage = { type, payload };
    this.ws.send(JSON.stringify(msg));
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private notify(event: string, data: unknown): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch {
          // Prevent handler errors from breaking the event loop
        }
      });
    }
  }
}

// Singleton instance
export const wsClient = new TrustAgentWS();
export default wsClient;
