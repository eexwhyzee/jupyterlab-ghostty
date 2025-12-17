import { IGhosttyTerminal } from '../tokens';

describe('IGhosttyTerminal.defaultOptions', () => {
  const defaults = IGhosttyTerminal.defaultOptions;

  it('has all required IOptions properties', () => {
    expect(defaults).toHaveProperty('theme');
    expect(defaults).toHaveProperty('fontSize');
    expect(defaults).toHaveProperty('shutdownOnClose');
    expect(defaults).toHaveProperty('closeOnExit');
    expect(defaults).toHaveProperty('cursorBlink');
    expect(defaults).toHaveProperty('initialCommand');
  });

  it('has fontSize within valid range (9-72)', () => {
    expect(defaults.fontSize).toBeGreaterThanOrEqual(9);
    expect(defaults.fontSize).toBeLessThanOrEqual(72);
  });

  it('has positive scrollback value', () => {
    expect(defaults.scrollback).toBeGreaterThan(0);
  });

  it('has valid theme value', () => {
    const validThemes: IGhosttyTerminal.Theme[] = ['light', 'dark', 'inherit'];
    expect(validThemes).toContain(defaults.theme);
  });

  it('has lineHeight >= 1.0', () => {
    expect(defaults.lineHeight).toBeGreaterThanOrEqual(1.0);
  });

  it('has boolean values for boolean options', () => {
    expect(typeof defaults.shutdownOnClose).toBe('boolean');
    expect(typeof defaults.closeOnExit).toBe('boolean');
    expect(typeof defaults.cursorBlink).toBe('boolean');
    expect(typeof defaults.autoFit).toBe('boolean');
  });

  it('has string value for initialCommand', () => {
    expect(typeof defaults.initialCommand).toBe('string');
  });

  it('has string value for fontFamily', () => {
    expect(typeof defaults.fontFamily).toBe('string');
    expect(defaults.fontFamily!.length).toBeGreaterThan(0);
  });

  it('defaults to inherit theme', () => {
    expect(defaults.theme).toBe('inherit');
  });

  it('defaults to closing on exit', () => {
    expect(defaults.closeOnExit).toBe(true);
  });

  it('defaults to not shutting down on close', () => {
    expect(defaults.shutdownOnClose).toBe(false);
  });

  it('defaults to auto fit enabled', () => {
    expect(defaults.autoFit).toBe(true);
  });
});

describe('IGhosttyTerminal.Theme type', () => {
  it('accepts valid theme values', () => {
    const themes: IGhosttyTerminal.Theme[] = ['light', 'dark', 'inherit'];
    expect(themes).toHaveLength(3);
  });
});
