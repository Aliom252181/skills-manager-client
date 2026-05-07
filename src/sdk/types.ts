export interface AcpMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'tool' | 'card';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AcpCard {
  id: string;
  type: 'chart' | 'table' | 'image' | 'code' | 'stats' | 'custom';
  title?: string;
  data: unknown;
  actions?: AcpCardAction[];
  metadata?: Record<string, unknown>;
}

export interface AcpCardAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'input';
  onClick?: () => void;
  href?: string;
  icon?: string;
}

export interface AcpTool {
  id: string;
  name: string;
  description: string;
  parameters: AcpToolParameter[];
  returns: AcpToolReturn;
}

export interface AcpToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
}

export interface AcpToolReturn {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'void';
  description?: string;
}

export interface AcpSession {
  id: string;
  messages: AcpMessage[];
  context: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface AcpStreamEvent {
  type: 'message' | 'tool_call' | 'tool_result' | 'card' | 'error' | 'done';
  data: unknown;
}

export interface AcpSdkConfig {
  serverUrl: string;
  apiKey?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface AcpRegisterCardOptions {
  id: string;
  type: AcpCard['type'];
  title?: string;
  render: (data: unknown, container: HTMLElement) => void;
  update?: (data: unknown) => void;
  destroy?: () => void;
}

export interface AcpRegisterToolOptions {
  id: string;
  name: string;
  description: string;
  parameters: AcpToolParameter[];
  execute: (args: Record<string, unknown>, context: Record<string, unknown>) => Promise<unknown>;
}

export interface AcpChatOptions {
  sessionId?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export type AcpEventHandler = (event: AcpStreamEvent) => void;