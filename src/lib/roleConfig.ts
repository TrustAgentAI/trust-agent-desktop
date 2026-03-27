// Role configuration types for Trust Agent Desktop

export type RoleTier = 'starter' | 'professional' | 'enterprise';
export type MessageRole = 'user' | 'agent';
export type SessionStatus = 'idle' | 'active' | 'ended' | 'error';
export type TaskStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RoleConfig {
  roleId: string;
  name: string;
  title: string;
  tier: RoleTier;
  persona: string;
  systemPrompt: string;
  capabilities: string[];
  skills: string[];
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TaskStep {
  id: string;
  description: string;
  status: TaskStepStatus;
  startedAt?: number;
  completedAt?: number;
}

export interface RoleSession {
  sessionId: string;
  roleHireId: string;
  startedAt: number;
  messages: Message[];
  status: SessionStatus;
  apiKey?: string;
  taskSteps?: TaskStep[];
}

export interface HiredRole {
  id: string;
  roleId: string;
  name: string;
  title: string;
  tier: RoleTier;
  persona: string;
  capabilities: string[];
  hiredAt: number;
}

export interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  price: number;
  capabilities: string[];
  avatar?: string;
}

export interface MarketplaceSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  compatibleRoles: string[];
  price: number;
}

export interface WalletBalance {
  credits: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: number;
  reference?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface FilePermissionGrant {
  id: string;
  roleHireId: string;
  path: string;
  permissions: ('read' | 'write' | 'execute')[];
  grantedAt: number;
  expiresAt?: number;
}
