// Mock for @jupyterlab/translation
export interface ITranslator {
  load(domain: string): TranslationBundle;
}

export interface TranslationBundle {
  __(msgid: string, ...args: any[]): string;
  _p(msgctxt: string, msgid: string, ...args: any[]): string;
}

export const nullTranslator: ITranslator = {
  load: () => ({
    __: (msgid: string, ...args: any[]) => {
      if (args.length > 0) {
        return msgid.replace('%1', String(args[0]));
      }
      return msgid;
    },
    _p: (_msgctxt: string, msgid: string) => msgid
  })
};
