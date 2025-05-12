import { MCPClient } from '../client/mcp-client';
import {
  elizaLogger,
  IAgentRuntime,
  Service,
  ServiceType,
} from "@elizaos/core";

export class PlaywrightService extends Service {
  private mcpClient: MCPClient;

  constructor() {
    super();
    this.mcpClient = new MCPClient({
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:13000/mcp',
      browserType: 'chromium',
      headless: true
    });
  }

  get serviceType(): ServiceType {
    return ServiceType.TRANSCRIPTION;
  }

  async initialize(): Promise<void> {
    try {
      await this.mcpClient.initialize();
      elizaLogger.info('PlaywrightService initialized successfully');
    } catch (error) {
      elizaLogger.error('Failed to initialize PlaywrightService:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    try {
      await this.mcpClient.close();
      elizaLogger.info('PlaywrightService destroyed successfully');
    } catch (error) {
      elizaLogger.error('Error destroying PlaywrightService:', error);
      throw error;
    }
  }

  getClient(): MCPClient {
    return this.mcpClient;
  }
}
