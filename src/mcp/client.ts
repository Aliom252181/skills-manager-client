import type { McpServerInfo, McpTool, McpInvokeRequest, McpInvokeResponse, McpMessage, McpMessageType, McpError } from './types';

export class McpClient {
  private socket?: WebSocket;
  private url: string;
  private requestIdCounter = 0;
  private pendingRequests: Record<string, { resolve: (value: unknown) => void; reject: (error: McpError) => void }> = {};
  private serverInfo: McpServerInfo | null = null;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<McpServerInfo> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve(this.serverInfo!);
        return;
      }

      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.sendRequest('server_info').then((info) => {
          this.serverInfo = info as McpServerInfo;
          resolve(info as McpServerInfo);
        }).catch(reject);
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = () => {
        reject({ code: 'connection_error', message: 'WebSocket connection error' });
      };

      this.socket.onclose = () => {
        this.pendingRequests = {};
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    this.pendingRequests = {};
  }

  private sendRequest(type: McpMessageType, payload?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject({ code: 'not_connected', message: 'Not connected to MCP server' });
        return;
      }

      const requestId = `req-${++this.requestIdCounter}`;
      const message: McpMessage = {
        type,
        requestId,
        payload,
      };

      this.pendingRequests[requestId] = { resolve, reject };
      this.socket.send(JSON.stringify(message));
    });
  }

  private handleMessage(data: string): void {
    try {
      const message: McpMessage = JSON.parse(data);

      if (message.requestId && this.pendingRequests[message.requestId]) {
        const { resolve, reject } = this.pendingRequests[message.requestId];
        delete this.pendingRequests[message.requestId];

        if (message.error) {
          reject(message.error);
        } else {
          resolve(message.payload);
        }
      }
    } catch (error) {
      console.error('Failed to parse MCP message:', error);
    }
  }

  async getServerInfo(): Promise<McpServerInfo> {
    if (!this.serverInfo) {
      await this.connect();
    }
    return this.serverInfo!;
  }

  async invokeTool(toolName: string, arguments_: Record<string, unknown>): Promise<McpInvokeResponse> {
    const request: McpInvokeRequest = { toolName, arguments: arguments_ };
    const result = await this.sendRequest('invoke', request);
    return result as McpInvokeResponse;
  }

  async listTools(): Promise<McpTool[]> {
    const info = await this.getServerInfo();
    return info.tools;
  }

  async ping(): Promise<boolean> {
    try {
      await this.sendRequest('ping');
      return true;
    } catch {
      return false;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getUrl(): string {
    return this.url;
  }
}

export class McpClientManager {
  private clients: Record<string, McpClient> = {};

  getClient(url: string): McpClient {
    if (!this.clients[url]) {
      this.clients[url] = new McpClient(url);
    }
    return this.clients[url];
  }

  async connectClient(url: string): Promise<McpServerInfo> {
    const client = this.getClient(url);
    return client.connect();
  }

  async invokeTool(url: string, toolName: string, arguments_: Record<string, unknown>): Promise<McpInvokeResponse> {
    const client = this.getClient(url);
    return client.invokeTool(toolName, arguments_);
  }

  disconnectClient(url: string): void {
    if (this.clients[url]) {
      this.clients[url].disconnect();
      delete this.clients[url];
    }
  }

  disconnectAll(): void {
    Object.values(this.clients).forEach(client => client.disconnect());
    this.clients = {};
  }
}

export const mcpClientManager = new McpClientManager();