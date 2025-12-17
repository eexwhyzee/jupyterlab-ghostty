/**
 * Platform-specific tests for GhosttyTerminal
 *
 * These tests verify the Ctrl+C copy behavior differs between Mac and non-Mac platforms.
 * On non-Mac platforms, Ctrl+C should copy when text is selected (instead of sending SIGINT).
 * On Mac, Cmd+C is used for copy, so Ctrl+C always sends SIGINT.
 */

import { Signal } from '@lumino/signaling';

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

// Create fresh mock terminal for each test
function createMockTerm() {
  return {
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
}

const mockFitAddon = { fit: jest.fn() };

describe('GhosttyTerminal platform-specific behavior', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('on non-Mac platforms (IS_MAC = false)', () => {
    let GhosttyTerminal: any;
    let Private: any;
    let mockTerm: ReturnType<typeof createMockTerm>;

    beforeEach(async () => {
      mockTerm = createMockTerm();

      // Mock modules before importing widget
      jest.doMock('@lumino/domutils', () => ({
        Platform: { IS_MAC: false }
      }));

      jest.doMock('@lumino/widgets', () => ({
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

      jest.doMock('@lumino/messaging', () => ({
        MessageLoop: { sendMessage: jest.fn() }
      }));

      // Import widget module with mocks applied
      const widgetModule = await import('../widget');
      GhosttyTerminal = widgetModule.GhosttyTerminal;
      Private = widgetModule.Private;

      // Mock createTerminal
      jest.spyOn(Private, 'createTerminal').mockResolvedValue({
        term: mockTerm as any,
        fitAddon: mockFitAddon as any
      });

      Private.counter.id = 0;
    });

    it('attaches custom key event handler for Ctrl+C copy', async () => {
      const mockSession = createMockSession();
      const terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      expect(mockTerm.attachCustomKeyEventHandler).toHaveBeenCalled();
    });

    it('returns false for Ctrl+C when text is selected (allows browser copy)', async () => {
      const mockSession = createMockSession();
      const terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      const handler = mockTerm.attachCustomKeyEventHandler.mock.calls[0][0];
      mockTerm.hasSelection.mockReturnValue(true);

      const ctrlCEvent = { ctrlKey: true, key: 'c' } as KeyboardEvent;
      expect(handler(ctrlCEvent)).toBe(false);
    });

    it('returns true for Ctrl+C when no text is selected (sends to terminal)', async () => {
      const mockSession = createMockSession();
      const terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      const handler = mockTerm.attachCustomKeyEventHandler.mock.calls[0][0];
      mockTerm.hasSelection.mockReturnValue(false);

      const ctrlCEvent = { ctrlKey: true, key: 'c' } as KeyboardEvent;
      expect(handler(ctrlCEvent)).toBe(true);
    });

    it('returns true for other key combinations', async () => {
      const mockSession = createMockSession();
      const terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      const handler = mockTerm.attachCustomKeyEventHandler.mock.calls[0][0];

      // Ctrl+V should pass through
      expect(handler({ ctrlKey: true, key: 'v' } as KeyboardEvent)).toBe(true);

      // Regular keys should pass through
      expect(handler({ ctrlKey: false, key: 'a' } as KeyboardEvent)).toBe(true);

      // Ctrl+other keys should pass through
      expect(handler({ ctrlKey: true, key: 'z' } as KeyboardEvent)).toBe(true);
    });
  });

  describe('on Mac platforms (IS_MAC = true)', () => {
    let GhosttyTerminal: any;
    let Private: any;
    let mockTerm: ReturnType<typeof createMockTerm>;

    beforeEach(async () => {
      mockTerm = createMockTerm();

      // Mock modules with IS_MAC = true
      jest.doMock('@lumino/domutils', () => ({
        Platform: { IS_MAC: true }
      }));

      jest.doMock('@lumino/widgets', () => ({
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

      jest.doMock('@lumino/messaging', () => ({
        MessageLoop: { sendMessage: jest.fn() }
      }));

      // Import widget module with mocks applied
      const widgetModule = await import('../widget');
      GhosttyTerminal = widgetModule.GhosttyTerminal;
      Private = widgetModule.Private;

      // Mock createTerminal
      jest.spyOn(Private, 'createTerminal').mockResolvedValue({
        term: mockTerm as any,
        fitAddon: mockFitAddon as any
      });

      Private.counter.id = 0;
    });

    it('does not attach custom key event handler', async () => {
      const mockSession = createMockSession();
      const terminal = new GhosttyTerminal(mockSession as any);
      await terminal.ready;

      // On Mac, Cmd+C is used for copy, so no custom handler is needed
      // Ctrl+C always sends SIGINT to the terminal
      expect(mockTerm.attachCustomKeyEventHandler).not.toHaveBeenCalled();
    });
  });
});
