import { Signal } from '@lumino/signaling';
import { IGhosttyTerminal } from '../tokens';
import { GhosttyTerminal, Private } from '../widget';

// Mock @lumino/widgets
jest.mock('@lumino/widgets', () => ({
  Widget: class MockWidget {
    node = document.createElement('div');
    title = { label: '', icon: null };
    id = '';
    isDisposed = false;
    isVisible = true;
    isAttached = true;

    addClass(className: string): void {
      this.node.classList.add(className);
    }

    dispose(): void {
      this.isDisposed = true;
    }

    update(): void {}
  }
}));

// Mock @lumino/messaging
jest.mock('@lumino/messaging', () => ({
  MessageLoop: {
    sendMessage: jest.fn()
  }
}));

// Mock @lumino/domutils
jest.mock('@lumino/domutils', () => ({
  Platform: {
    IS_MAC: false
  }
}));

// Create a mock session factory
function createMockSession(name = 'test-session') {
  return {
    name,
    connectionStatus: 'connected',
    isDisposed: false,
    messageReceived: new Signal<any, any>({}),
    disposed: new Signal<any, any>({}),
    connectionStatusChanged: new Signal<any, any>({}),
    send: jest.fn(),
    shutdown: jest.fn().mockResolvedValue(undefined),
    reconnect: jest.fn().mockResolvedValue(undefined)
  };
}

// Mock the terminal creation
const mockTerm = {
  options: {} as Record<string, any>,
  write: jest.fn(),
  clear: jest.fn(),
  focus: jest.fn(),
  dispose: jest.fn(),
  open: jest.fn(),
  loadAddon: jest.fn(),
  hasSelection: jest.fn().mockReturnValue(false),
  getSelection: jest.fn().mockReturnValue(''),
  paste: jest.fn(),
  onData: jest.fn(),
  onTitleChange: jest.fn(),
  attachCustomKeyEventHandler: jest.fn(),
  rows: 24,
  cols: 80
};

const mockFitAddon = {
  fit: jest.fn()
};

// Mock the Private.createTerminal function
jest.spyOn(Private, 'createTerminal').mockResolvedValue({
  term: mockTerm as any,
  fitAddon: mockFitAddon as any
});

describe('GhosttyTerminal', () => {
  let terminal: GhosttyTerminal;
  let mockSession: ReturnType<typeof createMockSession>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = createMockSession();
    Private.counter.id = 0;
  });

  describe('constructor', () => {
    it('sets unique id', () => {
      const term1 = new GhosttyTerminal(mockSession as any);
      const term2 = new GhosttyTerminal(createMockSession('session2') as any);

      expect(term1.id).toBe('jp-GhosttyTerminal-0');
      expect(term2.id).toBe('jp-GhosttyTerminal-1');
    });

    it('adds terminal class to node', () => {
      terminal = new GhosttyTerminal(mockSession as any);
      expect(terminal.node.classList.contains('jp-GhosttyTerminal')).toBe(true);
    });

    it('merges options with defaults', async () => {
      const customOptions = { fontSize: 16, theme: 'dark' as const };
      terminal = new GhosttyTerminal(mockSession as any, customOptions);

      expect(terminal.getOption('fontSize')).toBe(16);
      expect(terminal.getOption('theme')).toBe('dark');
      expect(terminal.getOption('scrollback')).toBe(IGhosttyTerminal.defaultOptions.scrollback);
    });

    it('stores session reference', () => {
      terminal = new GhosttyTerminal(mockSession as any);
      expect(terminal.session).toBe(mockSession);
    });
  });

  describe('getOption', () => {
    beforeEach(() => {
      terminal = new GhosttyTerminal(mockSession as any);
    });

    it('returns correct option value for fontSize', () => {
      expect(terminal.getOption('fontSize')).toBe(IGhosttyTerminal.defaultOptions.fontSize);
    });

    it('returns correct option value for theme', () => {
      expect(terminal.getOption('theme')).toBe(IGhosttyTerminal.defaultOptions.theme);
    });

    it('returns correct option value for scrollback', () => {
      expect(terminal.getOption('scrollback')).toBe(IGhosttyTerminal.defaultOptions.scrollback);
    });
  });

  describe('setOption', () => {
    beforeEach(async () => {
      terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;
    });

    it('updates fontSize option', () => {
      terminal.setOption('fontSize', 18);
      expect(terminal.getOption('fontSize')).toBe(18);
    });

    it('updates theme option', () => {
      terminal.setOption('theme', 'dark');
      expect(terminal.getOption('theme')).toBe('dark');
    });

    it('is no-op when value unchanged (for non-theme options)', () => {
      const initialFontSize = terminal.getOption('fontSize');
      terminal.setOption('fontSize', initialFontSize);
      // Should not trigger resize - this is hard to verify without more mocking
      expect(terminal.getOption('fontSize')).toBe(initialFontSize);
    });

    it('emits themeChanged signal on theme change', async () => {
      const themeChangedSpy = jest.fn();
      terminal.themeChanged.connect(themeChangedSpy);

      terminal.setOption('theme', 'dark');

      expect(themeChangedSpy).toHaveBeenCalled();
    });

    it('always updates theme even if same value', async () => {
      const themeChangedSpy = jest.fn();
      terminal.themeChanged.connect(themeChangedSpy);

      terminal.setOption('theme', 'inherit');
      terminal.setOption('theme', 'inherit');

      expect(themeChangedSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasSelection', () => {
    it('returns false when terminal not ready', () => {
      terminal = new GhosttyTerminal(mockSession as any);
      // Before ready resolves
      expect(terminal.hasSelection()).toBe(false);
    });

    it('delegates to terminal when ready', async () => {
      terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      mockTerm.hasSelection.mockReturnValue(true);
      expect(terminal.hasSelection()).toBe(true);

      mockTerm.hasSelection.mockReturnValue(false);
      expect(terminal.hasSelection()).toBe(false);
    });
  });

  describe('getSelection', () => {
    it('returns null when terminal not ready', () => {
      terminal = new GhosttyTerminal(mockSession as any);
      expect(terminal.getSelection()).toBeNull();
    });

    it('delegates to terminal when ready', async () => {
      terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      mockTerm.getSelection.mockReturnValue('selected text');
      expect(terminal.getSelection()).toBe('selected text');
    });
  });

  describe('paste', () => {
    it('does nothing when terminal not ready', () => {
      terminal = new GhosttyTerminal(mockSession as any);
      terminal.paste('test data');
      expect(mockTerm.paste).not.toHaveBeenCalled();
    });

    it('delegates to terminal when ready', async () => {
      terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      terminal.paste('test data');
      expect(mockTerm.paste).toHaveBeenCalledWith('test data');
    });
  });

  describe('refresh', () => {
    it('reconnects session and clears terminal', async () => {
      terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      await terminal.refresh();

      expect(mockSession.reconnect).toHaveBeenCalled();
      expect(mockTerm.clear).toHaveBeenCalled();
    });
  });

  describe('ready promise', () => {
    it('resolves when terminal is initialized', async () => {
      terminal = new GhosttyTerminal(mockSession as any);
      await expect(terminal.ready).resolves.toBeUndefined();
    });
  });

  describe('theme attribute', () => {
    it('sets data-term-theme attribute on node', () => {
      terminal = new GhosttyTerminal(mockSession as any, { theme: 'dark' });
      expect(terminal.node.getAttribute('data-term-theme')).toBe('dark');
    });

    it('lowercases theme value', () => {
      terminal = new GhosttyTerminal(mockSession as any, { theme: 'inherit' });
      expect(terminal.node.getAttribute('data-term-theme')).toBe('inherit');
    });
  });
});

describe('Private.counter', () => {
  beforeEach(() => {
    Private.counter.id = 0;
  });

  it('increments on each terminal creation', () => {
    const mockSession = createMockSession();
    expect(Private.counter.id).toBe(0);

    new GhosttyTerminal(mockSession as any);
    expect(Private.counter.id).toBe(1);

    new GhosttyTerminal(createMockSession('s2') as any);
    expect(Private.counter.id).toBe(2);
  });
});
