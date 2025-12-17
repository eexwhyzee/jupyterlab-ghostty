// Mock for @lumino/signaling
export interface ISignal<T, U> {
  connect(slot: (sender: T, args: U) => void, thisArg?: any): boolean;
  disconnect(slot: (sender: T, args: U) => void, thisArg?: any): boolean;
}

export class Signal<T, U> implements ISignal<T, U> {
  private _slots: Array<{ slot: (sender: T, args: U) => void; thisArg?: any }> = [];

  constructor(private _sender: T) {}

  connect(slot: (sender: T, args: U) => void, thisArg?: any): boolean {
    this._slots.push({ slot, thisArg });
    return true;
  }

  disconnect(slot: (sender: T, args: U) => void, thisArg?: any): boolean {
    const index = this._slots.findIndex(s => s.slot === slot && s.thisArg === thisArg);
    if (index !== -1) {
      this._slots.splice(index, 1);
      return true;
    }
    return false;
  }

  emit(args: U): void {
    for (const { slot, thisArg } of this._slots) {
      slot.call(thisArg, this._sender, args);
    }
  }
}
