export type AlertType = 'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
  id: string;
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

type AlertListener = (config: AlertConfig | null) => void;

class AlertServiceClass {
  private listeners: Set<AlertListener> = new Set();
  private currentAlert: AlertConfig | null = null;

  public subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    if (this.currentAlert) {
      listener(this.currentAlert);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public alert(
    optionsOrTitle: string | { title: string; message?: string; buttons?: AlertButton[]; type?: AlertType },
    message?: string,
    buttons?: AlertButton[],
    explicitType?: AlertType
  ): void {
    let title = '';
    let msg: string | undefined;
    let btns: AlertButton[] | undefined;
    let typeArg: AlertType | undefined;

    if (typeof optionsOrTitle === 'object' && optionsOrTitle !== null) {
      title = optionsOrTitle.title;
      msg = optionsOrTitle.message;
      btns = optionsOrTitle.buttons;
      typeArg = optionsOrTitle.type;
    } else {
      title = optionsOrTitle;
      msg = message;
      btns = buttons;
      typeArg = explicitType;
    }

    // Infer alert type if not explicitly provided
    let inferredType: AlertType = typeArg || 'INFO';
    if (!typeArg) {
      const lower = `${title} ${msg || ''}`.toLowerCase();
      if (
        lower.includes('saved') ||
        lower.includes('success') ||
        lower.includes('approved') ||
        lower.includes('recorded') ||
        lower.includes('complete') ||
        lower.includes('restored')
      ) {
        inferredType = 'SUCCESS';
      } else if (
        lower.includes('delete') ||
        lower.includes('clear') ||
        lower.includes('remove') ||
        lower.includes('failed') ||
        lower.includes('error')
      ) {
        inferredType = 'DANGER';
      } else if (
        lower.includes('required') ||
        lower.includes('missing') ||
        lower.includes('invalid') ||
        lower.includes('limit') ||
        lower.includes('warning') ||
        lower.includes('no line items') ||
        lower.includes('unsaved')
      ) {
        inferredType = 'WARNING';
      }
    }

    const defaultButtons: AlertButton[] = btns && btns.length > 0
      ? btns
      : [{ text: 'OK', style: 'default' }];

    const config: AlertConfig = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      message: msg,
      type: inferredType,
      buttons: defaultButtons,
    };

    this.currentAlert = config;
    this.listeners.forEach((listener) => listener(config));
  }

  public dismiss(): void {
    this.currentAlert = null;
    this.listeners.forEach((listener) => listener(null));
  }
}

export const AlertService = new AlertServiceClass();
