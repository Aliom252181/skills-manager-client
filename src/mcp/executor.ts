import type { McpTool, SkillExecutionContext, ExecutionResult, McpInvokeResponse } from './types';
import { mcpClientManager } from './client';

export class SkillExecutor {
  private context: SkillExecutionContext;
  private serverUrl: string;

  constructor(serverUrl: string, skillId: string, skillPath: string) {
    this.serverUrl = serverUrl;
    this.context = {
      skillId,
      skillPath,
      variables: {},
      history: [],
      output: [],
    };
  }

  async execute(input: string, variables?: Record<string, unknown>): Promise<ExecutionResult> {
    if (variables) {
      this.context.variables = { ...this.context.variables, ...variables };
    }

    try {
      const result = await mcpClientManager.invokeTool(this.serverUrl, 'execute_skill', {
        skillId: this.context.skillId,
        skillPath: this.context.skillPath,
        input,
        variables: this.context.variables,
      });

      if (result.success && result.result) {
        const executeResult = result.result as ExecutionResult;
        this.context.output.push(executeResult.output || '');

        if (executeResult.toolCalls) {
          this.context.history.push(...executeResult.toolCalls);
        }

        return executeResult;
      }

      return { success: false, error: result.error || 'Unknown error' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async invokeToolDirectly(toolName: string, arguments_: Record<string, unknown>): Promise<McpInvokeResponse> {
    return mcpClientManager.invokeTool(this.serverUrl, toolName, arguments_);
  }

  async getAvailableTools(): Promise<McpTool[]> {
    return mcpClientManager.connectClient(this.serverUrl).then(info => info.tools);
  }

  getContext(): SkillExecutionContext {
    return { ...this.context };
  }

  setVariable(name: string, value: unknown): void {
    this.context.variables[name] = value;
  }

  getVariable(name: string): unknown {
    return this.context.variables[name];
  }

  clearContext(): void {
    this.context = {
      skillId: this.context.skillId,
      skillPath: this.context.skillPath,
      variables: {},
      history: [],
      output: [],
    };
  }
}

export class SkillExecutorManager {
  private executors: Record<string, SkillExecutor> = {};

  getExecutor(serverUrl: string, skillId: string, skillPath: string): SkillExecutor {
    const key = `${serverUrl}-${skillId}`;
    if (!this.executors[key]) {
      this.executors[key] = new SkillExecutor(serverUrl, skillId, skillPath);
    }
    return this.executors[key];
  }

  async executeSkill(serverUrl: string, skillId: string, skillPath: string, input: string, variables?: Record<string, unknown>): Promise<ExecutionResult> {
    const executor = this.getExecutor(serverUrl, skillId, skillPath);
    return executor.execute(input, variables);
  }

  async invokeTool(serverUrl: string, toolName: string, arguments_: Record<string, unknown>): Promise<McpInvokeResponse> {
    return mcpClientManager.invokeTool(serverUrl, toolName, arguments_);
  }

  async getTools(serverUrl: string): Promise<McpTool[]> {
    return mcpClientManager.connectClient(serverUrl).then(info => info.tools);
  }

  getExecutorContext(serverUrl: string, skillId: string): SkillExecutionContext | null {
    const key = `${serverUrl}-${skillId}`;
    return this.executors[key]?.getContext() || null;
  }

  clearExecutor(serverUrl: string, skillId: string): void {
    const key = `${serverUrl}-${skillId}`;
    delete this.executors[key];
  }

  clearAllExecutors(): void {
    this.executors = {};
  }
}

export const skillExecutorManager = new SkillExecutorManager();