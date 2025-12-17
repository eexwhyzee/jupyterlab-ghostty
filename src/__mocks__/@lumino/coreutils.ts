// Mock for @lumino/coreutils
export class PromiseDelegate<T> {
  promise: Promise<T>;
  private _resolve!: (value: T) => void;
  private _reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  resolve(value: T): void {
    this._resolve(value);
  }

  reject(reason?: any): void {
    this._reject(reason);
  }
}

export class Token<_T> {
  constructor(
    public name: string,
    public description?: string
  ) {}
}
