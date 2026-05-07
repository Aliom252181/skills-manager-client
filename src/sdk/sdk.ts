import type {
  AcpSdkConfig,
  AcpMessage,
  AcpCard,
  AcpSession,
  AcpStreamEvent,
  AcpRegisterCardOptions,
  AcpRegisterToolOptions,
  AcpChatOptions,
  AcpEventHandler,
  AcpTool,
} from './types';

export class AcpSdk {
  private config: AcpSdkConfig;
  private socket?: WebSocket;
  private session?: AcpSession;
  private eventHandlers: Set<AcpEventHandler> = new Set();
  private cardRenderers: Map<string, AcpRegisterCardOptions> = new Map();
  private toolHandlers: Map<string, AcpRegisterToolOptions> = new Map();
  private reconnectAttempts = 0;
  private isConnecting = false;

  constructor(config: AcpSdkConfig) {
    this.config = {
      autoConnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...config,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      this.isConnecting = true;

      const url = new URL(this.config.serverUrl);
      if (this.config.apiKey) {
        url.searchParams.set('apiKey', this.config.apiKey);
      }

      this.socket = new WebSocket(url.toString());

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit({ type: 'done', data: { event: 'connected' } });
        resolve();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (error) => {
        this.isConnecting = false;
        this.emit({ type: 'error', data: { message: 'WebSocket error', error } });
        reject(error);
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.attemptReconnect();
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    this.session = undefined;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < (this.config.maxReconnectAttempts ?? 5)) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect().catch(() => {});
      }, this.config.reconnectInterval);
    }
  }

  private handleMessage(data: string): void {
    try {
      const event = JSON.parse(data) as AcpStreamEvent;
      this.emit(event);

      if (event.type === 'tool_call' && this.toolHandlers.has((event.data as { tool: string }).tool)) {
        this.handleToolCall(event.data as { id: string; tool: string; args: Record<string, unknown> });
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private async handleToolCall(call: { id: string; tool: string; args: Record<string, unknown> }): Promise<void> {
    const tool = this.toolHandlers.get(call.tool);
    if (!tool) {
      this.sendToolResult(call.id, null, `Tool ${call.tool} not found`);
      return;
    }

    try {
      const result = await tool.execute(call.args, this.session?.context || {});
      this.sendToolResult(call.id, result);
    } catch (error) {
      this.sendToolResult(call.id, null, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private sendToolResult(id: string, result: unknown, error?: string): void {
    this.send({
      type: 'tool_result',
      data: { id, result, error },
    });
  }

  private send(event: AcpStreamEvent): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    }
  }

  private emit(event: AcpStreamEvent): void {
    this.eventHandlers.forEach((handler) => handler(event));
  }

  onEvent(handler: AcpEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  async sendMessage(content: string, options?: AcpChatOptions): Promise<AcpMessage> {
    await this.connect();

    const message: AcpMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: 'user',
      content,
      timestamp: Date.now(),
    };

    this.send({
      type: 'message',
      data: {
        message,
        options: {
          systemPrompt: options?.systemPrompt,
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 2048,
        },
      },
    });

    if (!this.session) {
      this.session = {
        id: message.id,
        messages: [],
        context: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    this.session.messages.push(message);
    this.session.updatedAt = Date.now();

    return message;
  }

  getSession(): AcpSession | undefined {
    return this.session;
  }

  setContext(key: string, value: unknown): void {
    if (this.session) {
      this.session.context[key] = value;
    }
  }

  getContext(key: string): unknown {
    return this.session?.context[key];
  }

  clearContext(): void {
    if (this.session) {
      this.session.context = {};
    }
  }

  registerCard(options: AcpRegisterCardOptions): void {
    this.cardRenderers.set(options.id, options);
  }

  unregisterCard(id: string): void {
    this.cardRenderers.delete(id);
  }

  renderCard(card: AcpCard, container: HTMLElement): void {
    const renderer = this.cardRenderers.get(card.id);
    if (renderer) {
      renderer.render(card.data, container);
    } else {
      this.defaultCardRenderer(card, container);
    }
  }

  private defaultCardRenderer(card: AcpCard, container: HTMLElement): void {
    container.innerHTML = `
      <div class="acp-card acp-card-${card.type}">
        ${card.title ? `<div class="acp-card-title">${card.title}</div>` : ''}
        <div class="acp-card-content">${JSON.stringify(card.data, null, 2)}</div>
        ${card.actions?.length ? `<div class="acp-card-actions">${card.actions.map(a => 
          `<button data-action="${a.id}">${a.label}</button>`
        ).join('')}</div>` : ''}
      </div>
    `;

    container.querySelectorAll('[data-action]').forEach((el) => {
      const actionId = el.getAttribute('data-action');
      const action = card.actions?.find((a) => a.id === actionId);
      if (action?.onClick) {
        el.addEventListener('click', action.onClick);
      }
    });
  }

  registerTool(options: AcpRegisterToolOptions): void {
    this.toolHandlers.set(options.id, options);
  }

  unregisterTool(id: string): void {
    this.toolHandlers.delete(id);
  }

  getRegisteredTools(): AcpTool[] {
    return Array.from(this.toolHandlers.values()).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      returns: { type: 'void' as const },
    }));
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

let sdkInstance: AcpSdk | null = null;

export function createAcpSdk(config: AcpSdkConfig): AcpSdk {
  if (sdkInstance) {
    sdkInstance.disconnect();
  }
  sdkInstance = new AcpSdk(config);
  return sdkInstance;
}

export function getAcpSdk(): AcpSdk | null {
  return sdkInstance;
}

export function destroyAcpSdk(): void {
  if (sdkInstance) {
    sdkInstance.disconnect();
    sdkInstance = null;
  }
}