import { Terminal as TerminalNS } from '@jupyterlab/services';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { PromiseDelegate } from '@lumino/coreutils';
import { Platform } from '@lumino/domutils';
import { Message, MessageLoop } from '@lumino/messaging';
import { ISignal, Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { IGhosttyTerminal } from './tokens';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GhosttyTerm = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GhosttyFitAddon = any;

const TERMINAL_CLASS = 'jp-GhosttyTerminal';
const TERMINAL_BODY_CLASS = 'jp-GhosttyTerminal-body';

export class GhosttyTerminal
  extends Widget
  implements IGhosttyTerminal.ITerminal
{
  constructor(
    session: TerminalNS.ITerminalConnection,
    options: Partial<IGhosttyTerminal.IOptions> = {},
    translator?: ITranslator
  ) {
    super();
    translator = translator || nullTranslator;
    this._trans = translator.load('jupyterlab');
    this.session = session;

    this._options = { ...IGhosttyTerminal.defaultOptions, ...options };

    this.addClass(TERMINAL_CLASS);
    this._setThemeAttribute(this._options.theme);

    let buffer = '';
    const bufferMessage = (
      sender: TerminalNS.ITerminalConnection,
      msg: TerminalNS.IMessage
    ): void => {
      if (msg.type === 'stdout' && msg.content) {
        buffer += msg.content[0] as string;
      }
    };
    session.messageReceived.connect(bufferMessage);
    session.disposed.connect(() => {
      if (this.getOption('closeOnExit')) {
        this.dispose();
      }
    }, this);

    Private.createTerminal({
      theme: Private.getTheme(this._options.theme),
      fontSize: this._options.fontSize,
      fontFamily: this._options.fontFamily,
      scrollback: this._options.scrollback,
      cursorBlink: this._options.cursorBlink
    })
      .then(({ term, fitAddon }) => {
        this._term = term;
        this._fitAddon = fitAddon;
        this._initializeTerm();

        this.id = `jp-GhosttyTerminal-${Private.id++}`;
        this.title.label = this._trans.__('Ghostty Terminal');
        this._isReady = true;
        this._ready.resolve();

        if (buffer) {
          this._term.write(buffer);
        }
        session.messageReceived.disconnect(bufferMessage);
        session.messageReceived.connect(this._onMessage, this);

        if (session.connectionStatus === 'connected') {
          this._initialConnection();
        } else {
          session.connectionStatusChanged.connect(
            this._initialConnection,
            this
          );
        }
        this.update();
      })
      .catch(reason => {
        console.error('Failed to create Ghostty terminal.\n', reason);
        this._ready.reject(reason);
      });
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  readonly session: TerminalNS.ITerminalConnection;

  getOption<K extends keyof IGhosttyTerminal.IOptions>(
    option: K
  ): IGhosttyTerminal.IOptions[K] {
    return this._options[option];
  }

  setOption<K extends keyof IGhosttyTerminal.IOptions>(
    option: K,
    value: IGhosttyTerminal.IOptions[K]
  ): void {
    if (option !== 'theme' && this._options[option] === value) {
      return;
    }

    this._options[option] = value;

    if (!this._term) {
      return;
    }

    switch (option) {
      case 'fontFamily':
        this._term.options.fontFamily = value as string | undefined;
        break;
      case 'fontSize':
        this._term.options.fontSize = value as number | undefined;
        break;
      case 'scrollback':
        this._term.options.scrollback = value as number | undefined;
        break;
      case 'theme':
        this._term.options.theme = Private.getTheme(
          value as IGhosttyTerminal.Theme
        );
        this._setThemeAttribute(value as IGhosttyTerminal.Theme);
        this._themeChanged.emit();
        break;
      default:
        break;
    }

    this._needsResize = true;
    this.update();
  }

  dispose(): void {
    if (!this.session.isDisposed) {
      if (this.getOption('shutdownOnClose')) {
        this.session.shutdown().catch(reason => {
          console.error(`Terminal not shut down: ${reason}`);
        });
      }
    }
    void this.ready.then(() => {
      this._term?.dispose();
    });
    super.dispose();
  }

  async refresh(): Promise<void> {
    if (!this.isDisposed && this._isReady) {
      await this.session.reconnect();
      this._term?.clear();
    }
  }

  hasSelection(): boolean {
    return this._isReady ? this._term?.hasSelection() ?? false : false;
  }

  paste(data: string): void {
    if (this._isReady) {
      this._term?.paste(data);
    }
  }

  getSelection(): string | null {
    return this._isReady ? this._term?.getSelection() ?? null : null;
  }

  processMessage(msg: Message): void {
    super.processMessage(msg);
    if (msg.type === 'fit-request') {
      this.onFitRequest(msg);
    }
  }

  get themeChanged(): ISignal<this, void> {
    return this._themeChanged;
  }

  protected onAfterAttach(msg: Message): void {
    this.update();
  }

  protected onAfterShow(msg: Message): void {
    this.update();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this._offsetWidth = msg.width;
    this._offsetHeight = msg.height;
    this._needsResize = true;
    this.update();
  }

  protected onUpdateRequest(msg: Message): void {
    if (!this.isVisible || !this.isAttached || !this._isReady) {
      return;
    }

    if (!this._termOpened) {
      this._term?.open(this.node);
      const termContainer = this.node.querySelector('canvas')?.parentElement;
      if (termContainer) {
        termContainer.classList.add(TERMINAL_BODY_CLASS);
      }
      this._termOpened = true;
    }

    if (this._needsResize) {
      this._resizeTerminal();
    }
  }

  protected onFitRequest(msg: Message): void {
    MessageLoop.sendMessage(this, Widget.ResizeMessage.UnknownSize);
  }

  protected onActivateRequest(msg: Message): void {
    this._term?.focus();
  }

  private _initialConnection(): void {
    if (this.isDisposed || this.session.connectionStatus !== 'connected') {
      return;
    }

    this.title.label = this._trans.__('Ghostty %1', this.session.name);
    this._setSessionSize();

    if (this._options.initialCommand) {
      this.session.send({
        type: 'stdin',
        content: [this._options.initialCommand + '\r']
      });
    }

    this.session.connectionStatusChanged.disconnect(
      this._initialConnection,
      this
    );
  }

  private _initializeTerm(): void {
    const term = this._term!;

    term.onData((data: string) => {
      if (!this.isDisposed) {
        this.session.send({ type: 'stdin', content: [data] });
      }
    });

    term.onTitleChange((title: string) => {
      this.title.label = title;
    });

    // On non-Mac platforms, allow Ctrl+C to copy when text is selected
    if (!Platform.IS_MAC) {
      term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 'c' && term.hasSelection()) {
          return false;
        }
        return true;
      });
    }
  }

  private _onMessage(
    sender: TerminalNS.ITerminalConnection,
    msg: TerminalNS.IMessage
  ): void {
    switch (msg.type) {
      case 'stdout':
        if (msg.content) {
          this._pendingOutput += msg.content[0] as string;
          this._scheduleWrite();
        }
        break;
      case 'disconnect':
        this._term?.write('\r\n\r\n[Finished… Term Session]\r\n');
        break;
    }
  }

  private _scheduleWrite(): void {
    if (this._writeScheduled) {
      return;
    }
    this._writeScheduled = true;
    requestAnimationFrame(() => {
      if (this._pendingOutput && this._term) {
        this._term.write(this._pendingOutput);
        this._pendingOutput = '';
      }
      this._writeScheduled = false;
    });
  }

  private _resizeTerminal(): void {
    if (!this._term || !this._fitAddon) return;

    // Use FitAddon for proper terminal sizing
    if (this._options.autoFit) {
      try {
        this._fitAddon.fit();
      } catch (err) {
        console.error('Error fitting terminal:', err);
      }
    }

    if (this._offsetWidth === -1) {
      this._offsetWidth = this.node.offsetWidth;
    }
    if (this._offsetHeight === -1) {
      this._offsetHeight = this.node.offsetHeight;
    }

    this._setSessionSize();
    this._needsResize = false;
  }

  private _setSessionSize(): void {
    if (!this._term || this.isDisposed) return;

    const content = [
      this._term.rows,
      this._term.cols,
      this._offsetHeight,
      this._offsetWidth
    ];
    this.session.send({ type: 'set_size', content });
  }

  private _setThemeAttribute(theme: string | null | undefined): void {
    if (this.isDisposed) return;
    this.node.setAttribute(
      'data-term-theme',
      theme ? theme.toLowerCase() : 'inherit'
    );
  }

  private _needsResize = true;
  private _offsetWidth = -1;
  private _offsetHeight = -1;
  private _options: IGhosttyTerminal.IOptions;
  private _isReady = false;
  private _ready = new PromiseDelegate<void>();
  private _term: GhosttyTerm | null = null;
  private _fitAddon: GhosttyFitAddon | null = null;
  private _termOpened = false;
  private _trans: TranslationBundle;
  private _themeChanged = new Signal<this, void>(this);
  private _pendingOutput = '';
  private _writeScheduled = false;
}

namespace Private {
  export let id = 0;
  let initialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let GhosttyTerminal_: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let GhosttyFitAddon_: any;

  export const lightTheme: IGhosttyTerminal.IThemeObject = {
    foreground: '#000',
    background: '#fff',
    cursor: '#616161'
  };

  export const darkTheme: IGhosttyTerminal.IThemeObject = {
    foreground: '#fff',
    background: '#000',
    cursor: '#fff'
  };

  export function inheritTheme(): IGhosttyTerminal.IThemeObject {
    const bodyStyle = getComputedStyle(document.body);
    return {
      foreground: bodyStyle.getPropertyValue('--jp-ui-font-color0').trim(),
      background: bodyStyle.getPropertyValue('--jp-layout-color0').trim(),
      cursor: bodyStyle.getPropertyValue('--jp-ui-font-color1').trim()
    };
  }

  export function getTheme(
    theme: IGhosttyTerminal.Theme
  ): IGhosttyTerminal.IThemeObject {
    switch (theme) {
      case 'light':
        return lightTheme;
      case 'dark':
        return darkTheme;
      case 'inherit':
      default:
        return inheritTheme();
    }
  }

  export async function createTerminal(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any
  ): Promise<{ term: GhosttyTerm; fitAddon: GhosttyFitAddon }> {
    if (!initialized) {
      const ghostty = await import('ghostty-web');
      await ghostty.init();
      GhosttyTerminal_ = ghostty.Terminal;
      GhosttyFitAddon_ = ghostty.FitAddon;
      initialized = true;
    }
    const term = new GhosttyTerminal_(options);
    const fitAddon = new GhosttyFitAddon_();
    term.loadAddon(fitAddon);
    return { term, fitAddon };
  }
}
