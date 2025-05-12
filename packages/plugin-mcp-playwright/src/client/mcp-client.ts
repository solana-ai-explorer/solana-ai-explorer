import axios from 'axios';
import { logger } from '@elizaos/core';

export interface MCPClientConfig {
  serverUrl?: string;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
}

export class MCPClient {
  private serverUrl: string;
  private config: MCPClientConfig;
  private sessionId: string | null = null;

  constructor(config: MCPClientConfig = {}) {
    this.serverUrl = config.serverUrl || 'http://localhost:18080';
    this.config = {
      browserType: 'chromium',
      headless: true,
      viewport: { width: 1280, height: 720 },
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      const response = await axios.post(`${this.serverUrl}/session`, {
        browserType: this.config.browserType,
        headless: this.config.headless,
        viewport: this.config.viewport
      });
      
      this.sessionId = response.data.sessionId;
      logger.log('MCP session initialized:', this.sessionId);
    } catch (error) {
      logger.error('Failed to initialize MCP session:', error);
      throw error;
    }
  }

  async navigate(url: string): Promise<void> {
    await this.post('/navigate', { url });
  }

  async click(selector: string): Promise<void> {
    await this.post('/click', { selector });
  }

  async type(selector: string, text: string): Promise<void> {
    await this.post('/type', { selector, text });
  }

  async select(selector: string, value: string): Promise<void> {
    await this.post('/select', { selector, value });
  }

  async screenshot(path: string): Promise<void> {
    const response = await this.post('/screenshot', {});
    // 保存截图
    await this.saveScreenshot(response.data, path);
  }

  async waitForSelector(selector: string, options?: { timeout?: number }): Promise<void> {
    await this.post('/waitForSelector', { selector, options });
  }

  async evaluate(script: string): Promise<any> {
    const response = await this.post('/evaluate', { script });
    return response.data;
  }

  async close(): Promise<void> {
    if (this.sessionId) {
      await axios.delete(`${this.serverUrl}/session/${this.sessionId}`);
      this.sessionId = null;
    }
  }

  private async post(endpoint: string, data: any): Promise<any> {
    if (!this.sessionId) {
      throw new Error('MCP session not initialized');
    }

    try {
      const response = await axios.post(
        `${this.serverUrl}/session/${this.sessionId}${endpoint}`,
        data
      );
      return response.data;
    } catch (error) {
      logger.error(`MCP request failed (${endpoint}):`, error);
      throw error;
    }
  }

  private async saveScreenshot(data: string, path: string): Promise<void> {
    // 实现截图保存逻辑
    // 这里需要将 base64 数据转换为文件
  }
}
