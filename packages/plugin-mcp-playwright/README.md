# @elizaos/plugin-mcp-playwright

ElizaOS plugin for browser automation using Playwright MCP.

## Installation

```bash
npm install @elizaos/plugin-mcp-playwright
```

## Usage

```typescript
import { PlaywrightPlugin } from '@elizaos/plugin-mcp-playwright'

const plugin = new PlaywrightPlugin({
  browserType: 'chromium',
  headless: true,
  viewport: {
    width: 1280,
    height: 720
  }
})

// Initialize the plugin
await plugin.initialize({})

// Navigate to a website
await plugin.execute('navigate', { url: 'https://example.com' })

// Click an element
await plugin.execute('click', { selector: '#submit-button' })

// Type text
await plugin.execute('type', { 
  selector: '#search-input',
  text: 'Hello World'
})

// Take a screenshot
await plugin.execute('screenshot', { path: 'screenshot.png' })

// Clean up
await plugin.destroy()
```

## Available Actions

- `navigate`: Navigate to a URL
- `click`: Click an element
- `type`: Type text into an input
- `select`: Select an option from a dropdown
- `screenshot`: Take a screenshot
- `waitForSelector`: Wait for an element to appear
- `evaluate`: Execute JavaScript in the page context

## Configuration

- `browserType`: 'chromium' | 'firefox' | 'webkit' (default: 'chromium')
- `headless`: boolean (default: true)
- `viewport`: { width: number, height: number } (default: { width: 1280, height: 720 })
