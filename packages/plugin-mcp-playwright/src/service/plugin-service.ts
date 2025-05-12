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
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:13000/sse',
      browserType: 'chromium',
      headless: true
    });
  }

  get serviceType(): ServiceType {
    return ServiceType.TRANSCRIPTION;
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
