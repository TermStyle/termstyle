import { Plugin, TermStyleAPI, EffectFunction, HelperFunction, Theme } from '../types';
import { EventEmitter } from 'events';

export class PluginManager extends EventEmitter {
  private plugins = new Map<string, Plugin>();
  private effects = new Map<string, EffectFunction>();
  private helpers = new Map<string, HelperFunction>();
  private styles = new Map<string, string[]>();
  private api: PluginAPI;

  constructor(private getTheme: () => Theme, private setTheme: (theme: Theme) => void) {
    super();
    this.api = new PluginAPI(this);
  }

  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    // Validate plugin
    this.validatePlugin(plugin);

    // Install plugin
    try {
      // Set current plugin context
      (this.api as PluginAPI).setCurrentPlugin(plugin.name);
      
      await plugin.install(this.api);
      this.plugins.set(plugin.name, plugin);
      this.emit('plugin:registered', plugin);
      
      // Clear plugin context
      (this.api as PluginAPI).setCurrentPlugin('unknown');
    } catch (error) {
      throw new Error(`Failed to install plugin '${plugin.name}': ${(error as Error).message}`);
    }
  }

  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin '${name}' is not registered`);
    }

    // Uninstall if method exists
    if (plugin.uninstall) {
      try {
        await plugin.uninstall();
      } catch (error) {
        // Log uninstall errors for debugging but don't block unregistration
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(`Plugin '${name}' uninstall error:`, error);
        }
      }
    }

    // Clean up plugin additions
    this.cleanupPlugin(name);
    this.plugins.delete(name);
    this.emit('plugin:unregistered', plugin);
  }

  private validatePlugin(plugin: Plugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a valid version');
    }

    if (typeof plugin.install !== 'function') {
      throw new Error('Plugin must have an install method');
    }

    // Validate version format (semver)
    if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
      throw new Error('Plugin version must follow semver format');
    }
  }

  private cleanupPlugin(name: string): void {
    // Remove effects added by this plugin
    for (const [effectName, effect] of this.effects.entries()) {
      if ((effect as any).__plugin === name) {
        this.effects.delete(effectName);
      }
    }

    // Remove helpers added by this plugin
    for (const [helperName, helper] of this.helpers.entries()) {
      if ((helper as any).__plugin === name) {
        this.helpers.delete(helperName);
      }
    }

    // Remove styles added by this plugin
    for (const [styleName, style] of this.styles.entries()) {
      if ((style as any).__plugin === name) {
        this.styles.delete(styleName);
      }
    }
  }

  getEffect(name: string): EffectFunction | undefined {
    return this.effects.get(name);
  }

  getHelper(name: string): HelperFunction | undefined {
    return this.helpers.get(name);
  }

  getStyle(name: string): string[] | undefined {
    return this.styles.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  getAPI(): TermStyleAPI {
    return this.api;
  }
}

// Internal API implementation
class PluginAPI implements TermStyleAPI {
  constructor(private manager: PluginManager, private currentPlugin: string = 'unknown') {}

  addStyle(name: string, codes: string[]): void {
    if (this.manager['styles'].has(name)) {
      throw new Error(`Style '${name}' already exists`);
    }
    
    // Mark with plugin source
    (codes as any).__plugin = this.currentPlugin;
    this.manager['styles'].set(name, codes);
    this.manager.emit('style:added', { name, codes });
  }

  addEffect(name: string, effect: EffectFunction): void {
    if (this.manager['effects'].has(name)) {
      throw new Error(`Effect '${name}' already exists`);
    }
    
    // Mark with plugin source
    (effect as any).__plugin = this.currentPlugin;
    this.manager['effects'].set(name, effect);
    this.manager.emit('effect:added', { name, effect });
  }

  addHelper(name: string, helper: HelperFunction): void {
    if (this.manager['helpers'].has(name)) {
      throw new Error(`Helper '${name}' already exists`);
    }
    
    // Mark with plugin source
    (helper as any).__plugin = this.currentPlugin;
    this.manager['helpers'].set(name, helper);
    this.manager.emit('helper:added', { name, helper });
  }

  getTheme(): Theme {
    return this.manager['getTheme']();
  }

  setTheme(theme: Theme): void {
    this.manager['setTheme'](theme);
    this.manager.emit('theme:changed', theme);
  }

  setCurrentPlugin(plugin: string): void {
    this.currentPlugin = plugin;
  }
}

// Example plugin structure
export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract version: string;

  abstract install(api: TermStyleAPI): void | Promise<void>;
  
  uninstall?(): void | Promise<void> {
    // Default empty implementation
  }
}

// Built-in plugins
export class EmojiPlugin extends BasePlugin {
  name = 'emoji';
  version = '1.0.0';

  private emojiMap = new Map([
    [':smile:', '😊'],
    [':heart:', '❤️'],
    [':check:', '✓'],
    [':cross:', '✗'],
    [':star:', '⭐'],
    [':fire:', '🔥'],
    [':rocket:', '🚀'],
    [':warning:', '⚠️'],
    [':error:', '❌'],
    [':info:', 'ℹ️']
  ]);

  install(api: TermStyleAPI): void {
    api.addEffect('emoji', (text: string) => {
      let result = text;
      for (const [code, emoji] of this.emojiMap) {
        result = result.replace(new RegExp(code, 'g'), emoji);
      }
      return result;
    });

    api.addHelper('emoji', (code: string) => {
      return this.emojiMap.get(code) || code;
    });
  }
}

export class MarkdownPlugin extends BasePlugin {
  name = 'markdown';
  version = '1.0.0';

  install(api: TermStyleAPI): void {
    api.addEffect('markdown', (text: string) => {
      return text
        .replace(/\*\*(.+?)\*\*/g, '\u001B[1m$1\u001B[22m') // Bold
        .replace(/\*(.+?)\*/g, '\u001B[3m$1\u001B[23m')     // Italic
        .replace(/`(.+?)`/g, '\u001B[7m$1\u001B[27m')       // Code
        .replace(/~~(.+?)~~/g, '\u001B[9m$1\u001B[29m')     // Strikethrough
        .replace(/^# (.+)$/gm, '\u001B[1;4m$1\u001B[0m')    // H1
        .replace(/^## (.+)$/gm, '\u001B[1m$1\u001B[0m')     // H2
        .replace(/^### (.+)$/gm, '\u001B[4m$1\u001B[0m');   // H3
    });

    api.addStyle('heading1', ['bold', 'underline']);
    api.addStyle('heading2', ['bold']);
    api.addStyle('heading3', ['underline']);
    api.addStyle('code', ['inverse']);
    api.addStyle('emphasis', ['italic']);
    api.addStyle('strong', ['bold']);
  }
}

export class TablePlugin extends BasePlugin {
  name = 'table';
  version = '1.0.0';

  install(api: TermStyleAPI): void {
    api.addEffect('table', (text: string, options?: any) => {
      // Parse JSON data from text
      let data: any[];
      try {
        // Fix: Protect against excessively large JSON payloads (DoS protection)
        const MAX_JSON_SIZE = 1024 * 1024; // 1MB limit
        if (text.length > MAX_JSON_SIZE) {
          return text; // Return original text if too large
        }
        data = JSON.parse(text);
      } catch {
        // If not JSON, treat as CSV or return empty
        return text;
      }
      
      if (!Array.isArray(data) || data.length === 0) {
        return '';
      }

      const headers = options?.headers || Object.keys(data[0]);
      const rows = data.map((row: any) => 
        headers.map((h: string) => String(row[h] ?? ''))
      );

      // Calculate column widths
      const widths = headers.map((h: string, i: number) => {
        const headerWidth = h.length;
        const maxDataWidth = Math.max(...rows.map((r: string[]) => r[i].length));
        return Math.max(headerWidth, maxDataWidth) + 2;
      });

      // Build table
      const lines: string[] = [];
      
      // Header
      lines.push(this.buildRow(headers, widths));
      lines.push(this.buildSeparator(widths));
      
      // Data rows
      for (const row of rows) {
        lines.push(this.buildRow(row, widths));
      }

      return lines.join('\n');
    });
  }

  private buildRow(cells: string[], widths: number[]): string {
    return '│' + cells.map((cell, i) => 
      ` ${cell.padEnd(widths[i] - 2)} `
    ).join('│') + '│';
  }

  private buildSeparator(widths: number[]): string {
    return '├' + widths.map(w => '─'.repeat(w)).join('┼') + '┤';
  }
}