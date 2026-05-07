export interface SkillVersion {
  version: string;
  semver: {
    major: number;
    minor: number;
    patch: number;
  };
  commitHash: string;
  releaseDate: number;
  changelog?: string;
  downloadUrl?: string;
}

export interface SkillDependency {
  name: string;
  versionRange: string;
  optional?: boolean;
  resolved?: string;
}

export interface SkillManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
 engines?: {
    [key: string]: string;
  };
  publishConfig?: {
    registry?: string;
    access?: 'public' | 'restricted';
  };
}

export interface VersionHistory {
  versions: SkillVersion[];
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
}

export interface SkillBranch {
  name: string;
  commit: string;
  isDefault: boolean;
  isRemote: boolean;
  lastCommitDate?: number;
}

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'api' | 'data' | 'security' | 'devops' | 'custom';
  files: {
    path: string;
    content: string;
  }[];
  variables: {
    name: string;
    description: string;
    default?: string;
    required: boolean;
  }[];
  tags: string[];
  downloads: number;
  author: string;
  createdAt: number;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  size?: number;
  lastModified?: number;
}

export interface McpPrompt {
  name: string;
  description: string;
  arguments: McpToolParameter[];
}

export interface McpToolParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: unknown;
  enum?: string[];
  properties?: Record<string, McpToolParameter>;
  items?: McpToolParameter;
}

export interface McpServiceDiscovery {
  id: string;
  name: string;
  url: string;
  capabilities: ('tools' | 'resources' | 'prompts')[];
  status: 'online' | 'offline' | 'connecting';
  lastSeen?: number;
  metadata?: Record<string, unknown>;
}

export interface SkillRating {
  skillId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SkillReview {
  id: string;
  skillId: string;
  author: string;
  authorAvatar?: string;
  rating: number;
  title: string;
  content: string;
  likes: number;
  dislikes: number;
  verified: boolean;
  createdAt: number;
  replies?: SkillReviewReply[];
}

export interface SkillReviewReply {
  id: string;
  reviewId: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface SkillUsageStats {
  skillId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecuted?: number;
  executionHistory: ExecutionRecord[];
}

export interface ExecutionRecord {
  id: string;
  skillId: string;
  timestamp: number;
  duration: number;
  success: boolean;
  input: string;
  output?: string;
  error?: string;
  platform: string;
  userId?: string;
}

export interface SkillFavorite {
  skillId: string;
  userId: string;
  createdAt: number;
  notes?: string;
}

export interface SkillComment {
  id: string;
  skillId: string;
  author: string;
  content: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
  likes: number;
}

export interface SecurityConfig {
  sandbox: boolean;
  networkPolicy: 'allow' | 'deny' | 'prompt';
  fileAccess: 'read' | 'write' | 'none';
  executionTimeout: number;
  maxMemory?: number;
  maxCpu?: number;
  rateLimit: {
    requests: number;
    window: number;
  };
  allowedDomains?: string[];
  blockedDomains?: string[];
}

export interface SecurityAudit {
  id: string;
  skillId: string;
  action: string;
  timestamp: number;
  userId?: string;
  ipAddress?: string;
  result: 'success' | 'blocked' | 'failed';
  details?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'execution' | 'security' | 'system' | 'user';
  action: string;
  skillId?: string;
  userId?: string;
  details: Record<string, unknown>;
  stackTrace?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
  createdAt: number;
  lastTriggered?: number;
}

export type WebhookEvent =
  | 'skill.installed'
  | 'skill.uninstalled'
  | 'skill.executed'
  | 'skill.updated'
  | 'security.blocked'
  | 'system.started'
  | 'system.stopped';

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastError?: string;
}

export interface CloudSyncConfig {
  enabled: boolean;
  provider: 'local' | 'icloud' | 'dropbox' | 'onedrive' | 'gdrive';
  syncPaths: string[];
  lastSync?: number;
  conflictResolution: 'local' | 'remote' | 'manual';
}

export interface SyncRecord {
  id: string;
  path: string;
  direction: 'upload' | 'download';
  timestamp: number;
  status: 'success' | 'failed' | 'conflict';
  checksum?: string;
}

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  action: string;
  description: string;
  scope: 'global' | 'editor' | 'list' | 'dialog';
  enabled: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'update';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    url?: string;
    callback?: string;
  };
  expiresAt?: number;
}

export interface WorkflowStep {
  id: string;
  skillId: string;
  skillName: string;
  input: Record<string, unknown>;
  condition?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: unknown;
  };
  retry?: {
    maxAttempts: number;
    delay: number;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  trigger: WorkflowTrigger;
  status: 'draft' | 'active' | 'paused' | 'error';
  createdAt: number;
  updatedAt: number;
  lastRun?: number;
  runCount: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'webhook' | 'event';
  config: Record<string, unknown>;
}

export interface ScheduledTask {
  id: string;
  name: string;
  workflowId?: string;
  skillId?: string;
  cron: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  config: Record<string, unknown>;
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  layout: {
    columns: number;
    rows: number;
  };
  refreshInterval: number;
  createdAt: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stats' | 'table' | 'log' | 'gauge';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
  dataSource: {
    type: 'skillUsage' | 'executionHistory' | 'errorRate' | 'custom';
    query?: string;
  };
}

export interface ChartData {
  labels?: string[];
  values?: number[];
  data?: { name: string; value: number }[];
  type?: 'bar' | 'line' | 'pie' | 'area';
  colors?: string[];
}

export interface PerformanceMetrics {
  skillId: string;
  timestamp: number;
  executionTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  skillId?: string;
  auth?: {
    type: 'none' | 'apiKey' | 'bearer' | 'basic';
    key?: string;
  };
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface ApiRequest {
  id: string;
  endpointId: string;
  timestamp: number;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
  response?: {
    status: number;
    body: unknown;
    duration: number;
  };
  userId?: string;
  ipAddress?: string;
}

export interface TeamSpace {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  sharedSkills: string[];
  permissions: TeamPermissions;
  createdAt: number;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
}

export interface TeamPermissions {
  canEdit: string[];
  canView: string[];
  canDelete: string[];
  canManage: boolean;
}