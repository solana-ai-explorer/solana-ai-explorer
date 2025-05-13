import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PlaywrightPlugin } from '../src'

describe('PlaywrightPlugin', () => {
  let plugin: PlaywrightPlugin

  beforeAll(() => {
    plugin = new PlaywrightPlugin({
      headless: true
    })
  })

  afterAll(async () => {
    await plugin.destroy()
  })

  it('should initialize successfully', async () => {
    await expect(plugin.initialize({})).resolves.not.toThrow()
  })

  it('should navigate to a website', async () => {
    await plugin.initialize({})
    await expect(plugin.execute('navigate', { 
      url: 'https://example.com' 
    })).resolves.not.toThrow()
  })

  it('should take a screenshot', async () => {
    await plugin.initialize({})
    await plugin.execute('navigate', { url: 'https://example.com' })
    await expect(plugin.execute('screenshot', {
      path: 'test-screenshot.png'
    })).resolves.not.toThrow()
  })
})
