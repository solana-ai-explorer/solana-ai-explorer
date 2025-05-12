import { MCPClient } from '../client/mcp-client';
import {
  elizaLogger,
  IAgentRuntime,
  Service,
  ServiceType,
} from "@elizaos/core";

export class PlaywrightService extends Service {
  static serviceType: ServiceType = ServiceType.TRANSCRIPTION;
  private mcpClient: MCPClient;

  constructor() {
    this.mcpClient = new MCPClient({
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:13000',
      browserType: 'chromium',
      headless: true
    });
  }

  async initialize(): Promise<void> {
    await this.mcpClient.initialize();
  }

  async destroy(): Promise<void> {
    await this.mcpClient.close();
  }

  getClient(): MCPClient {
    return this.mcpClient;
  }
}
