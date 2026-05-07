export interface McpToolParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  enum?: string[];
  properties?: Record<string, McpToolParameter>;
  items?: McpToolParameter;
}

export interface McpTool {
  name: string;
  description: string;
  parameters: McpToolParameter[];
  returnType?: string;
}

export interface McpServerInfo {
  name: string;
  version: string;
  description?: string;
  tools: McpTool[];
}

export interface McpInvokeRequest {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface McpInvokeResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface McpExecuteResult {
  output: string;
  toolCalls?: McpToolCall[];
}

export interface McpToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface McpError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type McpMessageType = 'invoke' | 'result' | 'error' | 'ping' | 'pong' | 'server_info';

export interface McpMessage {
  type: McpMessageType;
  requestId?: string;
  payload?: unknown;
  error?: McpError;
}

export interface SkillExecutionContext {
  skillId: string;
  skillPath: string;
  variables: Record<string, unknown>;
  history: McpToolCall[];
  output: string[];
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  toolCalls?: McpToolCall[];
}