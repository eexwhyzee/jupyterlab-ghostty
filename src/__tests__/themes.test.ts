import type { IGhosttyTerminal } from '../tokens';
import { Private } from '../widget';

describe('Theme Functions', () => {
  describe('lightTheme', () => {
    it('has all required IThemeObject properties', () => {
      expect(Private.lightTheme.foreground).toBeDefined();
      expect(Private.lightTheme.background).toBeDefined();
    });

    it('has valid hex color values', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      expect(Private.lightTheme.foreground).toMatch(hexColorRegex);
      expect(Private.lightTheme.background).toMatch(hexColorRegex);
      expect(Private.lightTheme.cursor).toMatch(hexColorRegex);
    });

    it('has all ANSI colors defined', () => {
      const ansiColors = [
        'black',
        'red',
        'green',
        'yellow',
        'blue',
        'magenta',
        'cyan',
        'white',
        'brightBlack',
        'brightRed',
        'brightGreen',
        'brightYellow',
        'brightBlue',
        'brightMagenta',
        'brightCyan',
        'brightWhite'
      ] as const;

      for (const color of ansiColors) {
        expect(Private.lightTheme[color]).toBeDefined();
        expect(Private.lightTheme[color]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('has light background color', () => {
      // Light theme background should be bright (high luminance)
      expect(Private.lightTheme.background).toBe('#ffffff');
    });
  });

  describe('darkTheme', () => {
    it('has all required IThemeObject properties', () => {
      expect(Private.darkTheme.foreground).toBeDefined();
      expect(Private.darkTheme.background).toBeDefined();
    });

    it('has valid hex color values', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      expect(Private.darkTheme.foreground).toMatch(hexColorRegex);
      expect(Private.darkTheme.background).toMatch(hexColorRegex);
      expect(Private.darkTheme.cursor).toMatch(hexColorRegex);
    });

    it('has all ANSI colors defined', () => {
      const ansiColors = [
        'black',
        'red',
        'green',
        'yellow',
        'blue',
        'magenta',
        'cyan',
        'white',
        'brightBlack',
        'brightRed',
        'brightGreen',
        'brightYellow',
        'brightBlue',
        'brightMagenta',
        'brightCyan',
        'brightWhite'
      ] as const;

      for (const color of ansiColors) {
        expect(Private.darkTheme[color]).toBeDefined();
        expect(Private.darkTheme[color]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('has dark background color', () => {
      // Dark theme background should be dark (low luminance)
      expect(Private.darkTheme.background).toBe('#1e1e1e');
    });
  });

  describe('getTheme', () => {
    it('returns lightTheme for "light"', () => {
      expect(Private.getTheme('light')).toBe(Private.lightTheme);
    });

    it('returns darkTheme for "dark"', () => {
      expect(Private.getTheme('dark')).toBe(Private.darkTheme);
    });

    it('calls inheritTheme for "inherit"', () => {
      const result = Private.getTheme('inherit');
      // inheritTheme returns a new object, not the same reference
      expect(result).toHaveProperty('foreground');
      expect(result).toHaveProperty('background');
    });

    it('calls inheritTheme for unknown values', () => {
      const result = Private.getTheme('unknown' as IGhosttyTerminal.Theme);
      expect(result).toHaveProperty('foreground');
      expect(result).toHaveProperty('background');
    });
  });

  describe('inheritTheme', () => {
    const originalGetComputedStyle = window.getComputedStyle;

    afterEach(() => {
      window.getComputedStyle = originalGetComputedStyle;
    });

    it('detects dark theme from CSS variables', () => {
      window.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            '--jp-layout-color0': '#1e1e1e',
            '--jp-ui-font-color0': '#cccccc',
            '--jp-ui-font-color1': '#ffffff',
            '--jp-editor-selected-background': '#264f78'
          };
          return values[prop] || '';
        }
      });

      const theme = Private.inheritTheme();
      expect(theme.background).toBe('#1e1e1e');
      expect(theme.foreground).toBe('#cccccc');
    });

    it('detects light theme from CSS variables', () => {
      window.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            '--jp-layout-color0': '#ffffff',
            '--jp-ui-font-color0': '#000000',
            '--jp-ui-font-color1': '#616161',
            '--jp-editor-selected-background': '#add6ff'
          };
          return values[prop] || '';
        }
      });

      const theme = Private.inheritTheme();
      expect(theme.background).toBe('#ffffff');
      expect(theme.foreground).toBe('#000000');
    });

    it('falls back to light theme when CSS variables are missing', () => {
      window.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: () => ''
      });

      const theme = Private.inheritTheme();
      // When bg is empty, isDark is falsy, so lightTheme is used as base
      expect(theme.foreground).toBe(Private.lightTheme.foreground);
      expect(theme.background).toBe(Private.lightTheme.background);
    });

    it('uses base theme ANSI colors', () => {
      window.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: (prop: string) => {
          if (prop === '--jp-layout-color0') return '#1e1e1e';
          return '';
        }
      });

      const theme = Private.inheritTheme();
      // ANSI colors should come from darkTheme base
      expect(theme.red).toBe(Private.darkTheme.red);
      expect(theme.green).toBe(Private.darkTheme.green);
      expect(theme.blue).toBe(Private.darkTheme.blue);
    });
  });
});
