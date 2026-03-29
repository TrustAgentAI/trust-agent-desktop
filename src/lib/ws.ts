/**
 * WebSocket client for Trust Agent Desktop.
 * Auto-reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s).
 * Exports singleton wsClient.
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.trust-agent.ai/ws';
const MIN_BACKOFF = 1000;
const MAX_BACKOFF = 30000;

type WSStatus = 'connected' | 'connecting' | 'disconnected';

type WSEventType =
  | 'agent-response'
  | 'agent-thinking'
  | 'agent-error'
  | 'agent:token'
  | 'agent:done'
  | 'agent:speaking'
  | 'audit:event'
  | 'task-update'
  | 'session-end'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  // Shared study session events
  | 'shared-session-start'
  | 'shared-message'
  | 'member-joined'
  | 'member-left'
  | 'shared-session-end';

type WSSendType =
  | 'user-message'
  | 'start-session'
  | 'cancel-task'
  | 'agent:message'
  // Shared study session send types
  | 'shared:join-session'
  | 'shared:leave-session'
  | 'shared:send-message';

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
  private status: WSStatus = 'disconnected';
  private currentBackoff = MIN_BACKOFF;

  connect(token: string): void {
    if (this.status === 'connecting' || this.status === 'connected') {
      return;
    }

    this.token = token;
    this.shouldReconnect = true;
    this.status = 'connecting';

    try {
      this.ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.currentBackoff = MIN_BACKOFF;
        this.notify('connected', null);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: WSMessage = JSON.parse(event.data as string);
          this.notify(msg.type, msg.payload);
        } catch {
          // Ignore malformed messages - log but do not crash
        }
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.ws = null;
        this.notify('disconnected', null);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.status = 'disconnected';
        // onclose will fire after onerror, reconnection handled there
      };
    } catch {
      this.status = 'disconnected';
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.token = null;
    this.currentBackoff = MIN_BACKOFF;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status = 'disconnected';
  }

  getStatus(): WSStatus {
    return this.status;
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
    return this.status === 'connected';
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || !this.token) return;

    this.notify('reconnecting', null);
    this.reconnectTimer = setTimeout(() => {
      if (this.token && this.shouldReconnect) {
        this.connect(this.token);
      }
    }, this.currentBackoff);

    // Exponential backoff: 1s, 2s, 4s, 8s, ... max 30s
    this.currentBackoff = Math.min(this.currentBackoff * 2, MAX_BACKOFF);
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
