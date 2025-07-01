/**
 * Global Cursor State Manager
 * Prevents cursor state corruption when multiple components control cursor visibility
 */

import { hideCursor, showCursor } from './ansi';
import { safeExecute } from './safe-utils';

export class CursorManager {
  private static instance: CursorManager;
  private hiddenBy = new Set<string>();
  private isHidden = false;

  static getInstance(): CursorManager {
    if (!this.instance) {
      this.instance = new CursorManager();
    }
    return this.instance;
  }

  /**
   * Hide cursor with reference tracking
   */
  hide(componentId: string): void {
    this.hiddenBy.add(componentId);
    
    if (!this.isHidden) {
      safeExecute(() => {
        if (typeof process !== 'undefined' && process.stdout) {
          process.stdout.write(hideCursor());
          this.isHidden = true;
        }
      }, undefined);
    }
  }

  /**
   * Show cursor only when no components need it hidden
   */
  show(componentId: string): void {
    this.hiddenBy.delete(componentId);
    
    // Only show cursor if no other components need it hidden
    if (this.hiddenBy.size === 0 && this.isHidden) {
      safeExecute(() => {
        if (typeof process !== 'undefined' && process.stdout) {
          process.stdout.write(showCursor());
          this.isHidden = false;
        }
      }, undefined);
    }
  }

  /**
   * Force show cursor (emergency cleanup)
   */
  forceShow(): void {
    this.hiddenBy.clear();
    if (this.isHidden) {
      safeExecute(() => {
        if (typeof process !== 'undefined' && process.stdout) {
          process.stdout.write(showCursor());
          this.isHidden = false;
        }
      }, undefined);
    }
  }

  /**
   * Get current cursor state
   */
  get isCurrentlyHidden(): boolean {
    return this.isHidden;
  }

  /**
   * Get list of components that have hidden the cursor
   */
  get hiddenByComponents(): string[] {
    return Array.from(this.hiddenBy);
  }
}

// Export singleton instance
export const cursorManager = CursorManager.getInstance();