// Mock for @lumino/messaging
export interface Message {
  type: string;
}

export const MessageLoop = {
  sendMessage: jest.fn()
};
