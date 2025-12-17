// Mock for @lumino/widgets
export interface Message {
  type: string;
}

export class Widget {
  node: HTMLElement;
  title: { label: string; icon: any };
  id: string;
  isDisposed: boolean;
  isVisible: boolean;
  isAttached: boolean;

  constructor() {
    this.node = document.createElement('div');
    this.title = { label: '', icon: null };
    this.id = '';
    this.isDisposed = false;
    this.isVisible = true;
    this.isAttached = true;
  }

  addClass(className: string): void {
    this.node.classList.add(className);
  }

  removeClass(className: string): void {
    this.node.classList.remove(className);
  }

  dispose(): void {
    this.isDisposed = true;
  }

  update(): void {}

  processMessage(_msg: Message): void {}
}

export namespace Widget {
  export interface ResizeMessage extends Message {
    width: number;
    height: number;
  }

  export const ResizeMessage = {
    UnknownSize: { type: 'resize', width: -1, height: -1 } as ResizeMessage
  };
}
