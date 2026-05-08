import { create } from 'zustand';
import type {
  SkillDependency,
  VersionHistory,
  SkillBranch,
  SkillTemplate,
  McpResource,
  McpPrompt,
  McpServiceDiscovery,
  SkillRating,
  SkillReview,
  SkillUsageStats,
  SkillFavorite,
  SecurityConfig,
  AuditLog,
  Webhook,
  WebhookDelivery,
  CloudSyncConfig,
  SyncRecord,
  KeyboardShortcut,
  Notification,
  Workflow,
  WorkflowStep,
  ScheduledTask,
  MonitoringDashboard,
  DashboardWidget,
  ExecutionRecord,
  PerformanceMetrics,
} from '../types/extended';
import { invoke } from '@tauri-apps/api/core';

interface VersionStore {
  versions: Record<string, VersionHistory>;
  isLoading: boolean;

  fetchVersionHistory: (skillId: string, skillPath: string) => Promise<VersionHistory>;
  updateSkill: (skillId: string, targetVersion?: string) => Promise<boolean>;
  rollbackSkill: (skillId: string, targetVersion: string) => Promise<boolean>;
  checkForUpdates: () => Promise<void>;
}

interface DependencyStore {
  dependencies: Record<string, SkillDependency[]>;
  missingDependencies: Record<string, SkillDependency[]>;

  resolveDependencies: (skillId: string) => Promise<void>;
  installDependency: (skillId: string, dep: SkillDependency) => Promise<boolean>;
  validateDependencies: (skillId: string) => Promise<boolean>;
}

interface TemplateStore {
  templates: SkillTemplate[];
  isLoading: boolean;

  fetchTemplates: () => Promise<void>;
  createFromTemplate: (templateId: string, variables: Record<string, string>) => Promise<string>;
  createTemplate: (template: Omit<SkillTemplate, 'id' | 'downloads' | 'createdAt'>) => Promise<SkillTemplate>;
}

interface BranchStore {
  branches: Record<string, SkillBranch[]>;

  fetchBranches: (skillId: string, skillPath: string) => Promise<SkillBranch[]>;
  createBranch: (skillId: string, name: string, fromBranch?: string) => Promise<boolean>;
  switchBranch: (skillId: string, branchName: string) => Promise<boolean>;
  deleteBranch: (skillId: string, branchName: string) => Promise<boolean>;
  mergeBranch: (skillId: string, sourceBranch: string, targetBranch: string) => Promise<boolean>;
}

interface ResourceStore {
  resources: McpResource[];
  prompts: McpPrompt[];
  isLoading: boolean;

  subscribeResource: (uri: string) => Promise<void>;
  unsubscribeResource: (uri: string) => Promise<void>;
  listResources: () => Promise<McpResource[]>;
  listPrompts: () => Promise<McpPrompt[]>;
  invokePrompt: (name: string, args: Record<string, unknown>) => Promise<string>;
}

interface DiscoveryStore {
  services: McpServiceDiscovery[];
  isScanning: boolean;

  startDiscovery: () => Promise<void>;
  stopDiscovery: () => void;
  registerService: (service: Omit<McpServiceDiscovery, 'id' | 'status' | 'lastSeen'>) => Promise<void>;
  unregisterService: (id: string) => Promise<void>;
}

interface ReviewStore {
  reviews: Record<string, SkillReview[]>;
  ratings: Record<string, SkillRating[]>;
  userRating: Record<string, SkillRating>;

  fetchReviews: (skillId: string) => Promise<void>;
  submitReview: (skillId: string, rating: number, comment?: string) => Promise<void>;
  updateReview: (reviewId: string, rating: number, comment: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  helpfulReview: (reviewId: string, helpful: boolean) => Promise<void>;
}

interface StatsStore {
  stats: Record<string, SkillUsageStats>;
  favorites: SkillFavorite[];

  recordExecution: (execution: Omit<ExecutionRecord, 'id'>) => Promise<void>;
  fetchStats: (skillId: string) => Promise<SkillUsageStats>;
  fetchAllStats: () => Promise<SkillUsageStats[]>;
  toggleFavorite: (skillId: string) => Promise<void>;
  fetchFavorites: () => Promise<SkillFavorite[]>;
}

interface SecurityStore {
  config: SecurityConfig;
  auditLogs: AuditLog[];
  isLoading: boolean;

  updateConfig: (config: Partial<SecurityConfig>) => Promise<void>;
  fetchAuditLogs: (filters?: { skillId?: string; startDate?: number; endDate?: number }) => Promise<void>;
  exportAuditLogs: (format: 'json' | 'csv') => Promise<string>;
}

interface WebhookStore {
  webhooks: Webhook[];
  deliveries: Record<string, WebhookDelivery[]>;
  isLoading: boolean;

  createWebhook: (webhook: Omit<Webhook, 'id' | 'createdAt' | 'lastTriggered'>) => Promise<Webhook>;
  updateWebhook: (id: string, updates: Partial<Webhook>) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
  toggleWebhook: (id: string) => Promise<void>;
  testWebhook: (id: string) => Promise<void>;
  fetchDeliveries: (webhookId: string) => Promise<void>;
}

interface SyncStore {
  config: CloudSyncConfig;
  records: SyncRecord[];
  isSyncing: boolean;

  updateConfig: (config: Partial<CloudSyncConfig>) => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (recordId: string, resolution: 'local' | 'remote') => Promise<void>;
  fetchRecords: () => Promise<void>;
}

interface ShortcutStore {
  shortcuts: KeyboardShortcut[];
  isEditing: boolean;

  fetchShortcuts: () => Promise<void>;
  updateShortcut: (id: string, updates: Partial<KeyboardShortcut>) => Promise<void>;
  resetShortcuts: () => Promise<void>;
  executeShortcut: (id: string) => void;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearExpired: () => void;
}

interface WorkflowStore {
  workflows: Workflow[];
  currentWorkflow?: Workflow;
  isExecuting: boolean;

  fetchWorkflows: () => Promise<void>;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>) => Promise<Workflow>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  executeWorkflow: (id: string, input?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  pauseWorkflow: (id: string) => Promise<void>;
  resumeWorkflow: (id: string) => Promise<void>;
  addStep: (workflowId: string, step: Omit<WorkflowStep, 'id'>) => void;
  removeStep: (workflowId: string, stepId: string) => void;
  reorderSteps: (workflowId: string, fromIndex: number, toIndex: number) => void;
}

interface SchedulerStore {
  tasks: ScheduledTask[];
  isRunning: boolean;

  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<ScheduledTask, 'id' | 'nextRun'>) => Promise<ScheduledTask>;
  updateTask: (id: string, updates: Partial<ScheduledTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  runTaskNow: (id: string) => Promise<void>;
}

interface MonitoringStore {
  dashboards: MonitoringDashboard[];
  currentDashboard?: MonitoringDashboard;
  metrics: Record<string, PerformanceMetrics[]>;

  fetchDashboards: () => Promise<void>;
  createDashboard: (dashboard: Omit<MonitoringDashboard, 'id' | 'createdAt'>) => Promise<MonitoringDashboard>;
  updateDashboard: (id: string, updates: Partial<MonitoringDashboard>) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  addWidget: (dashboardId: string, widget: Omit<DashboardWidget, 'id'>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  recordMetrics: (metrics: PerformanceMetrics) => void;
  fetchMetrics: (skillId: string, timeRange: { start: number; end: number }) => Promise<PerformanceMetrics[]>;
}

export const useVersionStore = create<VersionStore>((set, get) => ({
  versions: {},
  isLoading: false,

  fetchVersionHistory: async (skillId: string, skillPath: string) => {
    set({ isLoading: true });
    try {
      const history = await invoke<VersionHistory>('get_version_history', { skillId, skillPath });
      set(state => ({
        versions: { ...state.versions, [skillId]: history },
        isLoading: false,
      }));
      return history;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateSkill: async (skillId: string, targetVersion?: string) => {
    try {
      await invoke('update_skill', { skillId, targetVersion });
      await get().fetchVersionHistory(skillId, '');
      return true;
    } catch {
      return false;
    }
  },

  rollbackSkill: async (skillId: string, targetVersion: string) => {
    try {
      await invoke('rollback_skill', { skillId, targetVersion });
      await get().fetchVersionHistory(skillId, '');
      return true;
    } catch {
      return false;
    }
  },

  checkForUpdates: async () => {
    set({ isLoading: true });
    try {
      const skills = await invoke<string[]>('get_skills_with_updates');
      skills.forEach(skillId => {
        const versions = get().versions[skillId];
        if (versions) {
          set(state => ({
            versions: {
              ...state.versions,
              [skillId]: { ...versions, hasUpdate: true },
            },
          }));
        }
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export const useDependencyStore = create<DependencyStore>((set, get) => ({
  dependencies: {},
  missingDependencies: {},

  resolveDependencies: async (skillId: string) => {
    try {
      const deps = await invoke<SkillDependency[]>('resolve_dependencies', { skillId });
      set(state => ({
        dependencies: { ...state.dependencies, [skillId]: deps },
        missingDependencies: { ...state.missingDependencies, [skillId]: [] },
      }));
    } catch (error) {
      console.error('Failed to resolve dependencies:', error);
    }
  },

  installDependency: async (skillId: string, dep: SkillDependency) => {
    try {
      await invoke('install_dependency', { skillId, dependency: dep });
      await get().resolveDependencies(skillId);
      return true;
    } catch {
      return false;
    }
  },

  validateDependencies: async (skillId: string) => {
    try {
      const result = await invoke<{ valid: boolean; missing: SkillDependency[] }>('validate_dependencies', { skillId });
      set(state => ({
        missingDependencies: { ...state.missingDependencies, [skillId]: result.missing },
      }));
      return result.valid;
    } catch {
      return false;
    }
  },
}));

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  isLoading: false,

  fetchTemplates: async () => {
    set({ isLoading: true });
    try {
      const templates = await invoke<SkillTemplate[]>('fetch_skill_templates');
      set({ templates, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createFromTemplate: async (templateId: string, variables: Record<string, string>) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    try {
      const skillPath = await invoke<string>('create_skill_from_template', { template, variables });
      return skillPath;
    } catch (error) {
      throw error;
    }
  },

  createTemplate: async (template) => {
    const newTemplate: SkillTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      downloads: 0,
      createdAt: Date.now(),
    };

    set(state => ({ templates: [...state.templates, newTemplate] }));
    return newTemplate;
  },
}));

export const useBranchStore = create<BranchStore>((set, get) => ({
  branches: {},

  fetchBranches: async (skillId: string, skillPath: string) => {
    try {
      const branches = await invoke<SkillBranch[]>('fetch_skill_branches', { skillId, skillPath });
      set(state => ({ branches: { ...state.branches, [skillId]: branches } }));
      return branches;
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      return [];
    }
  },

  createBranch: async (skillId: string, name: string, fromBranch?: string) => {
    try {
      await invoke('create_skill_branch', { skillId, name, fromBranch });
      await get().fetchBranches(skillId, '');
      return true;
    } catch {
      return false;
    }
  },

  switchBranch: async (skillId: string, branchName: string) => {
    try {
      await invoke('switch_skill_branch', { skillId, branchName });
      return true;
    } catch {
      return false;
    }
  },

  deleteBranch: async (skillId: string, branchName: string) => {
    try {
      await invoke('delete_skill_branch', { skillId, branchName });
      await get().fetchBranches(skillId, '');
      return true;
    } catch {
      return false;
    }
  },

  mergeBranch: async (skillId: string, sourceBranch: string, targetBranch: string) => {
    try {
      await invoke('merge_skill_branch', { skillId, sourceBranch, targetBranch });
      return true;
    } catch {
      return false;
    }
  },
}));

export const useResourceStore = create<ResourceStore>((set) => ({
  resources: [],
  prompts: [],
  isLoading: false,

  subscribeResource: async (uri: string) => {
    try {
      await invoke('subscribe_mcp_resource', { uri });
      set(state => ({
        resources: [...state.resources, { uri, name: uri.split('/').pop() || uri }],
      }));
    } catch (error) {
      console.error('Failed to subscribe resource:', error);
    }
  },

  unsubscribeResource: async (uri: string) => {
    try {
      await invoke('unsubscribe_mcp_resource', { uri });
      set(state => ({
        resources: state.resources.filter(r => r.uri !== uri),
      }));
    } catch (error) {
      console.error('Failed to unsubscribe resource:', error);
    }
  },

  listResources: async () => {
    try {
      const resources = await invoke<McpResource[]>('list_mcp_resources');
      set({ resources });
      return resources;
    } catch (error) {
      console.error('Failed to list resources:', error);
      return [];
    }
  },

  listPrompts: async () => {
    try {
      const prompts = await invoke<McpPrompt[]>('list_mcp_prompts');
      set({ prompts });
      return prompts;
    } catch (error) {
      console.error('Failed to list prompts:', error);
      return [];
    }
  },

  invokePrompt: async (name: string, args: Record<string, unknown>) => {
    try {
      const result = await invoke<string>('invoke_mcp_prompt', { name, args });
      return result;
    } catch (error) {
      throw error;
    }
  },
}));

export const useDiscoveryStore = create<DiscoveryStore>((set) => ({
  services: [],
  isScanning: false,

  startDiscovery: async () => {
    set({ isScanning: true });
    try {
      await invoke('start_mcp_discovery');
    } catch (error) {
      console.error('Failed to start discovery:', error);
    }
  },

  stopDiscovery: () => {
    set({ isScanning: false });
    invoke('stop_mcp_discovery').catch(console.error);
  },

  registerService: async (service) => {
    try {
      const id = await invoke<string>('register_mcp_service', { service });
      set(state => ({
        services: [...state.services, { ...service, id, status: 'online' as const, lastSeen: Date.now() }],
      }));
    } catch (error) {
      console.error('Failed to register service:', error);
    }
  },

  unregisterService: async (id: string) => {
    try {
      await invoke('unregister_mcp_service', { id });
      set(state => ({
        services: state.services.filter(s => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to unregister service:', error);
    }
  },
}));

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: {},
  ratings: {},
  userRating: {},

  fetchReviews: async (skillId: string) => {
    try {
      const reviews = await invoke<SkillReview[]>('fetch_skill_reviews', { skillId });
      set(state => ({ reviews: { ...state.reviews, [skillId]: reviews } }));
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  },

  submitReview: async (skillId: string, rating: number, comment?: string) => {
    try {
      await invoke('submit_skill_review', { skillId, rating, comment });
      await useReviewStore.getState().fetchReviews(skillId);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  },

  updateReview: async (reviewId: string, rating: number, comment: string) => {
    try {
      await invoke('update_skill_review', { reviewId, rating, comment });
    } catch (error) {
      console.error('Failed to update review:', error);
    }
  },

  deleteReview: async (reviewId: string) => {
    try {
      await invoke('delete_skill_review', { reviewId });
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  },

  helpfulReview: async (reviewId: string, helpful: boolean) => {
    try {
      await invoke('mark_review_helpful', { reviewId, helpful });
    } catch (error) {
      console.error('Failed to mark review helpful:', error);
    }
  },
}));

export const useStatsStore = create<StatsStore>((set, get) => ({
  stats: {},
  favorites: [],

  recordExecution: async (execution) => {
    const record: ExecutionRecord = {
      ...execution,
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    set(state => {
      const stats = state.stats[execution.skillId] || {
        skillId: execution.skillId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        executionHistory: [],
      };

      const newExecutions = stats.totalExecutions + 1;
      const totalTime = stats.averageExecutionTime * stats.totalExecutions + execution.duration;

      return {
        stats: {
          ...state.stats,
          [execution.skillId]: {
            ...stats,
            totalExecutions: newExecutions,
            successfulExecutions: stats.successfulExecutions + (execution.success ? 1 : 0),
            failedExecutions: stats.failedExecutions + (execution.success ? 0 : 1),
            averageExecutionTime: totalTime / newExecutions,
            lastExecuted: execution.timestamp,
            executionHistory: [...stats.executionHistory.slice(-99), record],
          },
        },
      };
    });

    try {
      await invoke('record_skill_execution', { execution: record });
    } catch (error) {
      console.error('Failed to record execution:', error);
    }
  },

  fetchStats: async (skillId: string) => {
    try {
      const stats = await invoke<SkillUsageStats>('fetch_skill_stats', { skillId });
      set(state => ({ stats: { ...state.stats, [skillId]: stats } }));
      return stats;
    } catch {
      return get().stats[skillId] || {
        skillId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        executionHistory: [],
      };
    }
  },

  fetchAllStats: async () => {
    try {
      const stats = await invoke<SkillUsageStats[]>('fetch_all_skill_stats');
      const statsMap = stats.reduce((acc, s) => ({ ...acc, [s.skillId]: s }), {});
      set({ stats: statsMap });
      return stats;
    } catch (error) {
      console.error('Failed to fetch all stats:', error);
      return [];
    }
  },

  toggleFavorite: async (skillId: string) => {
    const favorites = get().favorites;
    const existing = favorites.find(f => f.skillId === skillId);

    if (existing) {
      set(state => ({
        favorites: state.favorites.filter(f => f.skillId !== skillId),
      }));
      await invoke('remove_favorite', { skillId }).catch(console.error);
    } else {
      const favorite: SkillFavorite = {
        skillId,
        userId: 'local',
        createdAt: Date.now(),
      };
      set(state => ({ favorites: [...state.favorites, favorite] }));
      await invoke('add_favorite', { favorite }).catch(console.error);
    }
  },

  fetchFavorites: async () => {
    try {
      const favorites = await invoke<SkillFavorite[]>('fetch_favorites');
      set({ favorites });
      return favorites;
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      return [];
    }
  },
}));

export const useSecurityStore = create<SecurityStore>((set, get) => ({
  config: {
    sandbox: true,
    networkPolicy: 'prompt',
    fileAccess: 'read',
    executionTimeout: 300000,
    rateLimit: { requests: 100, window: 60000 },
  },
  auditLogs: [],
  isLoading: false,

  updateConfig: async (config) => {
    set(state => ({ config: { ...state.config, ...config } }));
    try {
      await invoke('update_security_config', { config: get().config });
    } catch (error) {
      console.error('Failed to update security config:', error);
    }
  },

  fetchAuditLogs: async (filters) => {
    set({ isLoading: true });
    try {
      const logs = await invoke<AuditLog[]>('fetch_audit_logs', { filters });
      set({ auditLogs: logs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch audit logs:', error);
    }
  },

  exportAuditLogs: async (format) => {
    const logs = get().auditLogs;
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      const headers = ['timestamp', 'level', 'category', 'action', 'skillId', 'userId'];
      const rows = logs.map(log => headers.map(h => String(log[h as keyof AuditLog] || '')));
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
  },
}));

export const useWebhookStore = create<WebhookStore>((set, get) => ({
  webhooks: [],
  deliveries: {},
  isLoading: false,

  createWebhook: async (webhook) => {
    try {
      const created = await invoke<Webhook>('create_webhook', { webhook });
      set(state => ({ webhooks: [...state.webhooks, created] }));
      return created;
    } catch (error) {
      throw error;
    }
  },

  updateWebhook: async (id, updates) => {
    try {
      await invoke('update_webhook', { id, updates });
      set(state => ({
        webhooks: state.webhooks.map(w => w.id === id ? { ...w, ...updates } : w),
      }));
    } catch (error) {
      console.error('Failed to update webhook:', error);
    }
  },

  deleteWebhook: async (id) => {
    try {
      await invoke('delete_webhook', { id });
      set(state => ({
        webhooks: state.webhooks.filter(w => w.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  },

  toggleWebhook: async (id) => {
    const webhook = get().webhooks.find(w => w.id === id);
    if (webhook) {
      await get().updateWebhook(id, { active: !webhook.active });
    }
  },

  testWebhook: async (id) => {
    try {
      await invoke('test_webhook', { id });
    } catch (error) {
      console.error('Failed to test webhook:', error);
    }
  },

  fetchDeliveries: async (webhookId) => {
    try {
      const deliveries = await invoke<WebhookDelivery[]>('fetch_webhook_deliveries', { webhookId });
      set(state => ({ deliveries: { ...state.deliveries, [webhookId]: deliveries } }));
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    }
  },
}));

export const useSyncStore = create<SyncStore>((set, get) => ({
  config: {
    enabled: false,
    provider: 'local',
    syncPaths: [],
    conflictResolution: 'manual',
  },
  records: [],
  isSyncing: false,

  updateConfig: async (config) => {
    set(state => ({ config: { ...state.config, ...config } }));
    try {
      await invoke('update_sync_config', { config: get().config });
    } catch (error) {
      console.error('Failed to update sync config:', error);
    }
  },

  syncNow: async () => {
    set({ isSyncing: true });
    try {
      await invoke('perform_sync');
      await get().fetchRecords();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  resolveConflict: async (recordId, resolution) => {
    try {
      await invoke('resolve_sync_conflict', { recordId, resolution });
      await get().fetchRecords();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  },

  fetchRecords: async () => {
    try {
      const records = await invoke<SyncRecord[]>('fetch_sync_records');
      set({ records });
    } catch (error) {
      console.error('Failed to fetch sync records:', error);
    }
  },
}));

export const useShortcutStore = create<ShortcutStore>((set, get) => ({
  shortcuts: [
    { id: 'new-skill', keys: ['Ctrl', 'N'], action: 'Create new skill', description: 'Create a new skill', scope: 'global', enabled: true },
    { id: 'search', keys: ['Ctrl', 'K'], action: 'Open search', description: 'Open skill search', scope: 'global', enabled: true },
    { id: 'settings', keys: ['Ctrl', ','], action: 'Open settings', description: 'Open settings', scope: 'global', enabled: true },
    { id: 'refresh', keys: ['Ctrl', 'R'], action: 'Refresh skills', description: 'Refresh skill list', scope: 'list', enabled: true },
    { id: 'delete', keys: ['Delete'], action: 'Delete selected', description: 'Delete selected skill', scope: 'list', enabled: true },
  ],
  isEditing: false,

  fetchShortcuts: async () => {
    try {
      const shortcuts = await invoke<KeyboardShortcut[]>('fetch_keyboard_shortcuts');
      if (shortcuts.length > 0) {
        set({ shortcuts });
      }
    } catch {
    }
  },

  updateShortcut: async (id, updates) => {
    set(state => ({
      shortcuts: state.shortcuts.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
    try {
      await invoke('update_keyboard_shortcut', { id, updates });
    } catch (error) {
      console.error('Failed to update shortcut:', error);
    }
  },

  resetShortcuts: async () => {
    set({
      shortcuts: [
        { id: 'new-skill', keys: ['Ctrl', 'N'], action: 'Create new skill', description: 'Create a new skill', scope: 'global', enabled: true },
        { id: 'search', keys: ['Ctrl', 'K'], action: 'Open search', description: 'Open skill search', scope: 'global', enabled: true },
        { id: 'settings', keys: ['Ctrl', ','], action: 'Open settings', description: 'Open settings', scope: 'global', enabled: true },
        { id: 'refresh', keys: ['Ctrl', 'R'], action: 'Refresh skills', description: 'Refresh skill list', scope: 'list', enabled: true },
        { id: 'delete', keys: ['Delete'], action: 'Delete selected', description: 'Delete selected skill', scope: 'list', enabled: true },
      ],
    });
  },

  executeShortcut: (id) => {
    const shortcut = get().shortcuts.find(s => s.id === id);
    if (shortcut?.enabled) {
      console.log('Executing shortcut:', shortcut.action);
    }
  },
}));

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: Date.now(),
      read: false,
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    if (notification.expiresAt) {
      setTimeout(() => {
        get().deleteNotification(newNotification.id);
      }, notification.expiresAt - Date.now());
    }
  },

  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: (id) => {
    const notification = get().notifications.find(n => n.id === id);
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount: notification && !notification.read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
  },

  clearExpired: () => {
    const now = Date.now();
    set(state => ({
      notifications: state.notifications.filter(n =>
        !n.expiresAt || n.expiresAt > now
      ),
    }));
  },
}));

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: undefined,
  isExecuting: false,

  fetchWorkflows: async () => {
    try {
      const workflows = await invoke<Workflow[]>('fetch_workflows');
      set({ workflows });
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  },

  createWorkflow: async (workflow) => {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runCount: 0,
    };

    set(state => ({ workflows: [...state.workflows, newWorkflow] }));

    try {
      await invoke('save_workflow', { workflow: newWorkflow });
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }

    return newWorkflow;
  },

  updateWorkflow: async (id, updates) => {
    set(state => ({
      workflows: state.workflows.map(w =>
        w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
      ),
    }));

    try {
      await invoke('update_workflow', { id, updates });
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  },

  deleteWorkflow: async (id) => {
    set(state => ({
      workflows: state.workflows.filter(w => w.id !== id),
    }));

    try {
      await invoke('delete_workflow', { id });
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  },

  executeWorkflow: async (id, input) => {
    set({ isExecuting: true });

    const workflow = get().workflows.find(w => w.id === id);
    if (!workflow) {
      set({ isExecuting: false });
      throw new Error('Workflow not found');
    }

    set({ currentWorkflow: workflow });

    try {
      const result = await invoke<Record<string, unknown>>('execute_workflow', { id, input });

      set(state => ({
        workflows: state.workflows.map(w =>
          w.id === id ? { ...w, runCount: w.runCount + 1, lastRun: Date.now() } : w
        ),
        isExecuting: false,
        currentWorkflow: undefined,
      }));

      return result;
    } catch (error) {
      set({ isExecuting: false, currentWorkflow: undefined });
      throw error;
    }
  },

  pauseWorkflow: async (id) => {
    await get().updateWorkflow(id, { status: 'paused' });
  },

  resumeWorkflow: async (id) => {
    await get().updateWorkflow(id, { status: 'active' });
  },

  addStep: (workflowId, step) => {
    const newStep: WorkflowStep = {
      ...step,
      id: `step-${Date.now()}`,
    };

    set(state => ({
      workflows: state.workflows.map(w =>
        w.id === workflowId
          ? { ...w, steps: [...w.steps, newStep], updatedAt: Date.now() }
          : w
      ),
    }));
  },

  removeStep: (workflowId, stepId) => {
    set(state => ({
      workflows: state.workflows.map(w =>
        w.id === workflowId
          ? { ...w, steps: w.steps.filter(s => s.id !== stepId), updatedAt: Date.now() }
          : w
      ),
    }));
  },

  reorderSteps: (workflowId, fromIndex, toIndex) => {
    set(state => ({
      workflows: state.workflows.map(w => {
        if (w.id !== workflowId) return w;
        const steps = [...w.steps];
        const [removed] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, removed);
        return { ...w, steps, updatedAt: Date.now() };
      }),
    }));
  },
}));

export const useSchedulerStore = create<SchedulerStore>((set, get) => ({
  tasks: [],
  isRunning: false,

  fetchTasks: async () => {
    try {
      const tasks = await invoke<ScheduledTask[]>('fetch_scheduled_tasks');
      set({ tasks });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  },

  createTask: async (task) => {
    const newTask: ScheduledTask = {
      ...task,
      id: `task-${Date.now()}`,
      nextRun: calculateNextRun(task.cron),
    };

    set(state => ({ tasks: [...state.tasks, newTask] }));

    try {
      await invoke('create_scheduled_task', { task: newTask });
    } catch (error) {
      console.error('Failed to create task:', error);
    }

    return newTask;
  },

  updateTask: async (id, updates) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));

    try {
      await invoke('update_scheduled_task', { id, updates });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  },

  deleteTask: async (id) => {
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
    }));

    try {
      await invoke('delete_scheduled_task', { id });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      await get().updateTask(id, { enabled: !task.enabled });
    }
  },

  runTaskNow: async (id) => {
    try {
      await invoke('run_scheduled_task_now', { id });
    } catch (error) {
      console.error('Failed to run task:', error);
    }
  },
}));

function calculateNextRun(_cron: string): number {
  return Date.now() + 60000;
}

export const useMonitoringStore = create<MonitoringStore>((set, get) => ({
  dashboards: [],
  currentDashboard: undefined,
  metrics: {},

  fetchDashboards: async () => {
    try {
      const dashboards = await invoke<MonitoringDashboard[]>('fetch_monitoring_dashboards');
      set({ dashboards });
    } catch (error) {
      console.error('Failed to fetch dashboards:', error);
    }
  },

  createDashboard: async (dashboard) => {
    const newDashboard: MonitoringDashboard = {
      ...dashboard,
      id: `dashboard-${Date.now()}`,
      createdAt: Date.now(),
    };

    set(state => ({ dashboards: [...state.dashboards, newDashboard] }));

    try {
      await invoke('save_monitoring_dashboard', { dashboard: newDashboard });
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    }

    return newDashboard;
  },

  updateDashboard: async (id, updates) => {
    set(state => ({
      dashboards: state.dashboards.map(d =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));

    try {
      await invoke('update_monitoring_dashboard', { id, updates });
    } catch (error) {
      console.error('Failed to update dashboard:', error);
    }
  },

  deleteDashboard: async (id) => {
    set(state => ({
      dashboards: state.dashboards.filter(d => d.id !== id),
    }));

    try {
      await invoke('delete_monitoring_dashboard', { id });
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  },

  addWidget: (dashboardId, widget) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
    };

    set(state => ({
      dashboards: state.dashboards.map(d =>
        d.id === dashboardId
          ? { ...d, widgets: [...d.widgets, newWidget] }
          : d
      ),
    }));
  },

  removeWidget: (dashboardId, widgetId) => {
    set(state => ({
      dashboards: state.dashboards.map(d =>
        d.id === dashboardId
          ? { ...d, widgets: d.widgets.filter(w => w.id !== widgetId) }
          : d
      ),
    }));
  },

  recordMetrics: (metrics) => {
    set(state => ({
      metrics: {
        ...state.metrics,
        [metrics.skillId]: [
          ...(state.metrics[metrics.skillId] || []).slice(-999),
          metrics,
        ],
      },
    }));
  },

  fetchMetrics: async (skillId, timeRange) => {
    try {
      const metrics = await invoke<PerformanceMetrics[]>('fetch_performance_metrics', {
        skillId,
        start: timeRange.start,
        end: timeRange.end,
      });
      set(state => ({
        metrics: { ...state.metrics, [skillId]: metrics },
      }));
      return metrics;
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return get().metrics[skillId] || [];
    }
  },
}));