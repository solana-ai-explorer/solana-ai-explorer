import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { elizaLogger } from "@elizaos/core";

export interface MCPClientConfig {
  serverUrl: string;
  browserType: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
}

export class MCPClient {
  private client: Client;
  private transport: SSEClientTransport;
  private config: MCPClientConfig;
  private isInitialized: boolean = false;

  constructor(config: MCPClientConfig) {
    this.config = config;
    const baseUrl = new URL(config.serverUrl);
    
    // 确保使用 SSE 端点
    if (!baseUrl.pathname.endsWith('/sse')) {
      baseUrl.pathname = '/sse';
    }

    this.transport = new SSEClientTransport(baseUrl);
    this.client = new Client({
      name: 'elizaos-playwright-plugin',
      version: '1.0.0'
    });

    this.client.onerror = (error) => {
      elizaLogger.error('MCP client error:', error);
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.client.connect(this.transport);
      elizaLogger.info('Successfully connected to MCP server');
      
      // 验证连接
      const tools = await this.listTools();
      elizaLogger.info('Available tools:', tools);
      
      this.isInitialized = true;
    } catch (error) {
      elizaLogger.error('Failed to initialize MCP client:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.transport.close();
      this.isInitialized = false;
    }
  }

  async listTools() {
    const result = await this.client.request({
      method: 'tools/list',
      params: {}
    });
    return result.tools;
  }

  async callTool(name: string, args: Record<string, any>) {
    const result = await this.client.request({
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    });
    return result;
  }

  async startBrowser() {
    return this.callTool('start-browser', {
      browserType: this.config.browserType,
      headless: this.config.headless
    });
  }

  async navigate(url: string) {
    return this.callTool('navigate', { url });
  }

  async getScreenshot() {
    return this.callTool('screenshot', {});
  }

  async getPageContent() {
    return this.callTool('get-page-content', {});
  }
}
