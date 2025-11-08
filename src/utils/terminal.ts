import { release } from 'os';

export interface TerminalInfo {
  supportsColor: boolean;
  colorLevel: 0 | 1 | 2 | 3;
  isTTY: boolean;
  isCI: boolean;
  width: number;
  height: number;
  columns: number;
  rows: number;
}

const getIsCI = (): boolean => Boolean(
  process.env.CI ||
  process.env.CONTINUOUS_INTEGRATION ||
  process.env.BUILD_NUMBER ||
  process.env.RUN_ID ||
  false
);

const getColorLevel = (): 0 | 1 | 2 | 3 => {
  try {
    // Re-read env each time to ensure we get current values
    const currentEnv = process.env;
    
    if (currentEnv.NO_COLOR || currentEnv.NODE_DISABLE_COLORS) return 0;
    if (currentEnv.FORCE_COLOR === '0') return 0;
    if (currentEnv.FORCE_COLOR === '1') return 1;
    if (currentEnv.FORCE_COLOR === '2') return 2;
    if (currentEnv.FORCE_COLOR === '3') return 3;
    
    if (!process.stdout || !process.stdout.isTTY) return 0;
    
    if (process.platform === 'win32') {
      try {
        const osRelease = release().split('.');
        const majorVersion = parseInt(osRelease[0], 10);
        const buildVersion = parseInt(osRelease[2], 10);
        
        if (isNaN(majorVersion) || isNaN(buildVersion)) return 1;
        
        if (majorVersion >= 10 && buildVersion >= 10586) {
          return buildVersion >= 14931 ? 3 : 2;
        }
        return 1;
      } catch {
        return 1; // Safe fallback for Windows
      }
    }
    
    if (currentEnv.COLORTERM === 'truecolor' || currentEnv.TERM_PROGRAM === 'iTerm.app') {
      return 3;
    }
    
    if (currentEnv.TERM?.includes('256color')) return 2;
    if (currentEnv.TERM?.includes('color')) return 1;
    
    return 0;
  } catch {
    return 0; // Safe fallback
  }
};

export const getTerminalInfo = (): TerminalInfo => {
  try {
    const colorLevel = getColorLevel();
    const columns = Math.max(1, process.stdout?.columns || 80);
    const rows = Math.max(1, process.stdout?.rows || 24);
    
    return {
      supportsColor: colorLevel > 0,
      colorLevel,
      isTTY: Boolean(process.stdout?.isTTY),
      isCI: getIsCI(),
      width: columns,
      height: rows,
      columns,
      rows
    };
  } catch {
    // Safe fallback terminal info
    return {
      supportsColor: false,
      colorLevel: 0,
      isTTY: false,
      isCI: false,
      width: 80,
      height: 24,
      columns: 80,
      rows: 24
    };
  }
};

let terminalInfo: TerminalInfo | null = null;
let terminalInfoTimestamp = 0;
let resizeListener: (() => void) | null = null;

// Cache TTL in milliseconds (5 minutes)
const TERMINAL_INFO_TTL = 5 * 60 * 1000;

export const terminal = (): TerminalInfo => {
  const now = Date.now();
  
  // Check if cache is expired or doesn't exist
  if (!terminalInfo || (now - terminalInfoTimestamp) > TERMINAL_INFO_TTL) {
    terminalInfo = getTerminalInfo();
    terminalInfoTimestamp = now;
  }
  
  return terminalInfo;
};

export const updateTerminalInfo = (): void => {
  terminalInfo = getTerminalInfo();
  terminalInfoTimestamp = Date.now();
};

export const cleanup = (): void => {
  if (resizeListener && typeof process !== 'undefined' && process.stdout && typeof process.stdout.removeListener === 'function') {
    try {
      process.stdout.removeListener('resize', resizeListener);
      resizeListener = null;
    } catch {
      // Ignore cleanup errors
    }
  }
  terminalInfo = null;
};

// Safe event listener registration - prevent duplicate listeners
if (typeof process !== 'undefined' && process.stdout && typeof process.stdout.on === 'function') {
  try {
    // Only register if we haven't already
    if (!resizeListener) {
      resizeListener = updateTerminalInfo;
      process.stdout.on('resize', resizeListener);

      // Register cleanup on process exit to prevent memory leaks
      if (typeof process.once === 'function') {
        process.once('exit', cleanup);
      }
    }
  } catch {
    // Ignore event listener registration errors
  }
}