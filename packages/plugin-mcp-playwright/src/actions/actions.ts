import {
  type Action,
  type ActionExample,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from '@elizaos/core';
import { PlaywrightService } from '../service/plugin-service';

// 定义基础内容接口
interface BrowserActionContent {
  url?: string;
  selector?: string;
  text?: string;
  value?: string;
  path?: string;
  options?: Record<string, unknown>;
}

// 验证函数
function isValidBrowserAction(content: BrowserActionContent, action: string): boolean {
  console.log('Validating browser action:', action, content);

  switch (action) {
    case 'NAVIGATE':
      return typeof content.url === 'string' && content.url.length > 0;
    
    case 'CLICK':
    case 'TYPE':
    case 'SELECT':
      return typeof content.selector === 'string' && content.selector.length > 0;
    
    case 'SCREENSHOT':
      return typeof content.path === 'string' && content.path.length > 0;
    
    default:
      return false;
  }
}

// 修改 handler 实现
const getPlaywrightService = (runtime: IAgentRuntime): PlaywrightService => {
  const service = runtime.getService(PLAYWRIGHT_SERVICE_NAME);
  if (!service || !(service instanceof PlaywrightService)) {
    throw new Error('Playwright service not found');
  }
  return service;
};

// 修改 navigate handler
const navigateHandler = async (
  runtime: IAgentRuntime,
  _message: Memory,
  state: State,
  _options: { [key: string]: unknown },
  callback?: HandlerCallback
): Promise<boolean> => {
  console.log('Starting NAVIGATE handler...');

  try {
    const content = state.content as BrowserActionContent;
    
    if (!isValidBrowserAction(content, 'NAVIGATE')) {
      if (callback) {
        callback({
          text: 'Need a valid URL to navigate to.',
          content: { error: 'Invalid navigation content' },
        });
      }
      return false;
    }

    const service = getPlaywrightService(runtime);
    await service.getClient().navigate(content.url!);

    if (callback) {
      callback({
        text: `Navigated to ${content.url}`,
        content: {
          success: true,
          url: content.url,
        },
      });
    }
    return true;
  } catch (error) {
    console.error('Error during navigation:', error);
    if (callback) {
      callback({
        text: `Navigation failed: ${error.message}`,
        content: { error: error.message },
      });
    }
    return false;
  }
};

// 导航动作模板
const navigateTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response:
\`\`\`json
{
    "url": "https://example.com"
}
\`\`\`

{{recentMessages}}

Extract the URL to navigate to.`;

// 点击动作模板
const clickTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response:
\`\`\`json
{
    "selector": "#submit-button"
}
\`\`\`

{{recentMessages}}

Extract the selector of the element to click.`;

// 输入动作模板
const typeTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response:
\`\`\`json
{
    "selector": "#search-input",
    "text": "Hello World"
}
\`\`\`

{{recentMessages}}

Extract the selector of the input element and the text to type.`;

// 截图动作模板
const screenshotTemplate = `Respond with a JSON markdown block containing only the extracted values.

Example response:
\`\`\`json
{
    "path": "screenshot.png"
}
\`\`\`

{{recentMessages}}

Extract the path where to save the screenshot.`;

// 导出所有动作
export const actions = {
  // 导航动作
  navigate: {
    name: 'NAVIGATE',
    similes: [
      'GO_TO',
      'OPEN_URL',
      'VISIT',
      'BROWSE_TO',
      'LOAD_PAGE',
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => true,
    description: 'Navigate to a URL in the browser.',
    handler: navigateHandler,
    examples: [
      {
        input: 'Go to https://example.com',
        output: 'Navigating to the website...',
      },
    ] as ActionExample[],
  } as Action,

  // 点击动作
  click: {
    name: 'CLICK',
    similes: [
      'CLICK_ELEMENT',
      'PRESS_BUTTON',
      'TAP_ELEMENT',
      'SELECT_ELEMENT',
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
      console.log('Validating click from entity:', message.entityId);
      return true;
    },
    description: 'Click an element on the page.',
    handler: async (
      runtime: IAgentRuntime,
      _message: Memory,
      state: State,
      _options: { [key: string]: unknown },
      callback?: HandlerCallback
    ): Promise<boolean> => {
      console.log('Starting CLICK handler...');

      const clickPrompt = composePromptFromState({
        state: state,
        template: clickTemplate,
      });

      const result = await runtime.useModel(ModelType.TEXT_LARGE, {
        prompt: clickPrompt,
      });

      const content = parseJSONObjectFromText(result);

      if (!isValidBrowserAction(content, 'CLICK')) {
        if (callback) {
          callback({
            text: 'Need a valid selector to click.',
            content: { error: 'Invalid click content' },
          });
        }
        return false;
      }

      try {
        const plugin = runtime.getPlugin('playwright');
        const mcpClient = (plugin as any).mcpClient;
        await mcpClient.click(content.selector);

        if (callback) {
          callback({
            text: `Clicked element ${content.selector}`,
            content: {
              success: true,
              selector: content.selector,
            },
          });
        }
        return true;
      } catch (error) {
        console.error('Error during click:', error);
        if (callback) {
          callback({
            text: `Click failed: ${error.message}`,
            content: { error: error.message },
          });
        }
        return false;
      }
    },
    examples: [
      [
        {
          name: '{{name1}}',
          content: {
            text: 'Click the submit button',
          },
        },
        {
          name: '{{name2}}',
          content: {
            text: 'Clicking the button...',
            actions: ['CLICK'],
          },
        },
      ],
    ] as ActionExample[][],
  } as Action,

  // 输入动作
  type: {
    name: 'TYPE',
    similes: [
      'INPUT_TEXT',
      'ENTER_TEXT',
      'FILL_INPUT',
      'WRITE_TEXT',
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
      console.log('Validating type from entity:', message.entityId);
      return true;
    },
    description: 'Type text into an input element.',
    handler: async (
      runtime: IAgentRuntime,
      _message: Memory,
      state: State,
      _options: { [key: string]: unknown },
      callback?: HandlerCallback
    ): Promise<boolean> => {
      console.log('Starting TYPE handler...');

      const typePrompt = composePromptFromState({
        state: state,
        template: typeTemplate,
      });

      const result = await runtime.useModel(ModelType.TEXT_LARGE, {
        prompt: typePrompt,
      });

      const content = parseJSONObjectFromText(result);

      if (!isValidBrowserAction(content, 'TYPE') || !content.text) {
        if (callback) {
          callback({
            text: 'Need a valid selector and text to type.',
            content: { error: 'Invalid type content' },
          });
        }
        return false;
      }

      try {
        const plugin = runtime.getPlugin('playwright');
        const mcpClient = (plugin as any).mcpClient;
        await mcpClient.type(content.selector, content.text);

        if (callback) {
          callback({
            text: `Typed "${content.text}" into ${content.selector}`,
            content: {
              success: true,
              selector: content.selector,
              text: content.text,
            },
          });
        }
        return true;
      } catch (error) {
        console.error('Error during type:', error);
        if (callback) {
          callback({
            text: `Type failed: ${error.message}`,
            content: { error: error.message },
          });
        }
        return false;
      }
    },
    examples: [
      [
        {
          name: '{{name1}}',
          content: {
            text: 'Type "Hello World" into the search box',
          },
        },
        {
          name: '{{name2}}',
          content: {
            text: 'Typing the text...',
            actions: ['TYPE'],
          },
        },
      ],
    ] as ActionExample[][],
  } as Action,

  // 截图动作
  screenshot: {
    name: 'SCREENSHOT',
    similes: [
      'TAKE_SCREENSHOT',
      'CAPTURE_SCREEN',
      'SAVE_SCREENSHOT',
      'SCREEN_CAPTURE',
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
      console.log('Validating screenshot from entity:', message.entityId);
      return true;
    },
    description: 'Take a screenshot of the current page.',
    handler: async (
      runtime: IAgentRuntime,
      _message: Memory,
      state: State,
      _options: { [key: string]: unknown },
      callback?: HandlerCallback
    ): Promise<boolean> => {
      console.log('Starting SCREENSHOT handler...');

      const screenshotPrompt = composePromptFromState({
        state: state,
        template: screenshotTemplate,
      });

      const result = await runtime.useModel(ModelType.TEXT_LARGE, {
        prompt: screenshotPrompt,
      });

      const content = parseJSONObjectFromText(result);

      if (!isValidBrowserAction(content, 'SCREENSHOT')) {
        if (callback) {
          callback({
            text: 'Need a valid path to save the screenshot.',
            content: { error: 'Invalid screenshot content' },
          });
        }
        return false;
      }

      try {
        const plugin = runtime.getPlugin('playwright');
        const mcpClient = (plugin as any).mcpClient;
        await mcpClient.screenshot(content.path);

        if (callback) {
          callback({
            text: `Screenshot saved to ${content.path}`,
            content: {
              success: true,
              path: content.path,
            },
          });
        }
        return true;
      } catch (error) {
        console.error('Error during screenshot:', error);
        if (callback) {
          callback({
            text: `Screenshot failed: ${error.message}`,
            content: { error: error.message },
          });
        }
        return false;
      }
    },
    examples: [
      [
        {
          name: '{{name1}}',
          content: {
            text: 'Take a screenshot and save it as page.png',
          },
        },
        {
          name: '{{name2}}',
          content: {
            text: 'Taking screenshot...',
            actions: ['SCREENSHOT'],
          },
        },
      ],
    ] as ActionExample[][],
  } as Action,
};

export default actions;
