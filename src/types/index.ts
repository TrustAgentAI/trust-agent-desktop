export interface AgentRole {
  id: string;
  name: string;
  persona: string;
  avatar: string;
  trustScore: number;
  status: 'online' | 'offline' | 'thinking';
  tier: 'free' | 'pro' | 'enterprise';
  description: string;
  capabilities: string[];
  hiredAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  agentId?: string;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  path?: string;
}

export interface TaskStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  reasoning?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  agentId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: TaskStep[];
  createdAt: string;
  completedAt?: string;
}

export interface FolderPermission {
  id: string;
  path: string;
  accessLevel: 'read' | 'read-write';
  grantedTo: string;
  grantedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export type NavItem = 'chat' | 'tasks' | 'marketplace' | 'permissions' | 'settings';
