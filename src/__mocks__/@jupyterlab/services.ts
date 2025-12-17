// Mock for @jupyterlab/services
export namespace Terminal {
  export interface ITerminalConnection {
    name: string;
    connectionStatus: string;
    isDisposed: boolean;
    messageReceived: any;
    disposed: any;
    connectionStatusChanged: any;
    send(message: any): void;
    shutdown(): Promise<void>;
    reconnect(): Promise<void>;
  }

  export interface IMessage {
    type: string;
    content?: any[];
  }

  export interface IModel {
    name: string;
  }
}
