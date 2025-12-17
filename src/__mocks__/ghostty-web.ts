// Mock for ghostty-web module
export const init = jest.fn().mockResolvedValue(undefined);

export class Terminal {
  options: Record<string, any> = {};
  private _hasSelection = false;
  private _selection = '';

  constructor(options: Record<string, any> = {}) {
    this.options = { ...options };
  }

  open = jest.fn();
  write = jest.fn();
  clear = jest.fn();
  focus = jest.fn();
  dispose = jest.fn();
  loadAddon = jest.fn();

  hasSelection(): boolean {
    return this._hasSelection;
  }

  getSelection(): string {
    return this._selection;
  }

  paste = jest.fn();

  onData = jest.fn();
  onTitleChange = jest.fn();
  attachCustomKeyEventHandler = jest.fn();

  // Test helpers
  _setSelection(hasSelection: boolean, selection: string): void {
    this._hasSelection = hasSelection;
    this._selection = selection;
  }

  get rows(): number {
    return 24;
  }

  get cols(): number {
    return 80;
  }
}

export class FitAddon {
  fit = jest.fn();
}
