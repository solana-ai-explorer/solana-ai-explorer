import type { Plugin } from '@elizaos/core';
import { actions } from './actions/actions';
import { PlaywrightService } from './service/plugin-service';

export const PLAYWRIGHT_SERVICE_NAME = 'PLAYWRIGHT';

// 创建服务实例
const playwrightService = new PlaywrightService();

// 导出插件对象
export const playwrightPlugin: Plugin = {
  name: PLAYWRIGHT_SERVICE_NAME,
  description: 'Playwright MCP Plugin for Eliza - Browser automation using Playwright MCP',
  actions: [
    actions.navigate,
    actions.click,
    actions.type,
    actions.screenshot,
  ],
  evaluators: [],
  providers: [],
  services: [playwrightService]
};

export default playwrightPlugin;