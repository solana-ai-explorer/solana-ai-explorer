import { Client } from "@modelcontextprotocol/sdk";
import { 
  CallToolRequest, 
  CallToolResultSchema,
  LoggingMessageNotificationSchema,
  ResourceListChangedNotificationSchema,
  ListResourcesRequest,
  ListResourcesResultSchema
} from "@modelcontextprotocol/sdk";
import { elizaLogger } from "@elizaos/core";

export class MCPClient {
  private client: Client | null = null;
  private sessionId: string | undefined;
  private lastEventId: string | undefined;
  private serverUrl: string;
  private browserType: string;
  private headless: boolean;

  constructor(options: {
    serverUrl: string;
    browserType: string;
    headless: boolean;
  }) {
    this.serverUrl = options.serverUrl;
    this.browserType = options.browserType;
    this.headless = options.headless;
  }

  async initialize(): Promise<void> {
    try {
      // 创建新的客户端
      this.client = new Client({
        name: 'playwright-mcp-client',
        version: '1.0.0',
        serverUrl: this.serverUrl
      });

      // 设置错误处理
      this.client.onerror = (error) => {
        elizaLogger.error('MCP client error:', error);
      };

      // 设置通知处理器
      this.setupNotificationHandlers();

      // 连接客户端
      await this.client.connect();
      this.sessionId = this.client.sessionId;
      elizaLogger.info('Connected to MCP server with session ID:', this.sessionId);

    } catch (error) {
      elizaLogger.error('Failed to initialize MCP client:', error);
      throw error;
    }
  }

  private setupNotificationHandlers(): void {
    if (!this.client) return;

    // 处理日志消息通知
    this.client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
      elizaLogger.info(`MCP notification: ${notification.params.level} - ${notification.params.data}`);
    });

    // 处理资源列表变更通知
    this.client.setNotificationHandler(ResourceListChangedNotificationSchema, async () => {
      elizaLogger.info('Resource list changed notification received');
      try {
        if (!this.client) return;
        const request: ListResourcesRequest = {
          method: 'resources/list',
          params: {}
        };
        const result = await this.client.request(request, ListResourcesResultSchema);
        elizaLogger.info('Available resources count:', result.resources.length);
      } catch (error) {
        elizaLogger.error('Failed to list resources after change notification:', error);
      }
    });
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name,
          arguments: args
        }
      };

      const onLastEventIdUpdate = (event: string) => {
        this.lastEventId = event;
      };

      const result = await this.client.request(request, CallToolResultSchema, {
        resumptionToken: this.lastEventId,
        onresumptiontoken: onLastEventIdUpdate
      });

      return result;
    } catch (error) {
      elizaLogger.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        // 尝试终止会话
        if (this.client.sessionId) {
          await this.client.terminateSession();
          elizaLogger.info('Session terminated successfully');
        }
        
        // 关闭客户端
        await this.client.disconnect();
        this.client = null;
        this.sessionId = undefined;
        this.lastEventId = undefined;
      } catch (error) {
        elizaLogger.error('Error closing MCP client:', error);
        throw error;
      }
    }
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }
}
