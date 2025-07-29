import { Ad, AdType } from '../tag/ad';
import '@src/css/interstitial.css';

export interface CloseButtonConfig {
  text?: string;
  style?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: string;
}

export interface InterstitialAdCallbacks {
  onShow?: () => void;
  onHide?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

export class InterstitialAd {
  private _ad: Ad;
  private _overlay: HTMLElement | null = null;
  private _closeButtonConfig: CloseButtonConfig = {
    text: '×',
    position: 'top-right',
    size: '30px'
  };
  private _callbacks: InterstitialAdCallbacks = {};
  private _contentUrl?: string;
  private _isVisible = false;

  public constructor(adspotID: number, elID: string, code?: string) {
    this._ad = new Ad(adspotID, elID, code);
    this._ad.setType(AdType.interstitial);
  }

  public get ad(): Ad {
    return this._ad;
  }

  public setCallbacks(callbacks: InterstitialAdCallbacks): this {
    this._callbacks = { ...this._callbacks, ...callbacks };
    return this;
  }

  public setCloseButtonConfig(config: CloseButtonConfig): this {
    this._closeButtonConfig = { ...this._closeButtonConfig, ...config };
    return this;
  }

  public setContentUrl(url: string): this {
    this._contentUrl = url;
    return this;
  }

  public async loadContent(): Promise<string> {
    if (!this._contentUrl) {
      throw new Error('Content URL not set');
    }

    try {
      const response = await fetch(this._contentUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this._callbacks.onError?.(err);
      throw err;
    }
  }

  public show(htmlContent?: string): void {
    if (this._isVisible) {
      return;
    }

    try {
      this._createOverlay(htmlContent);
      this._isVisible = true;
      this._callbacks.onShow?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to show interstitial ad');
      this._callbacks.onError?.(err);
    }
  }

  public hide(): void {
    if (!this._isVisible || !this._overlay) {
      return;
    }

    document.body.removeChild(this._overlay);
    this._overlay = null;
    this._isVisible = false;
    this._callbacks.onHide?.();
  }

  private _createOverlay(htmlContent?: string): void {
    // Create overlay container
    this._overlay = document.createElement('div');
    this._overlay.className = 'rdn-interstitial-overlay';

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'rdn-interstitial-content';

    // Add HTML content
    if (htmlContent) {
      contentContainer.innerHTML = htmlContent;
    } else {
      contentContainer.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; font-size: 24px;">Loading...</div>';
    }

    // Create close button if not in content
    if (!this._hasCloseButtonInContent(htmlContent)) {
      const closeButton = this._createCloseButton();
      contentContainer.appendChild(closeButton);
    }

    this._overlay.appendChild(contentContainer);
    document.body.appendChild(this._overlay);

    // Prevent body scroll
    document.body.classList.add('rdn-interstitial-active');

    // Add click listener to overlay (close on background click)
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) {
        this._handleClose();
      }
    });
  }

  private _createCloseButton(): HTMLElement {
    const closeButton = document.createElement('button');
    const config = this._closeButtonConfig;
    
    closeButton.textContent = config.text || '×';
    closeButton.className = 'rdn-interstitial-close';
    
    // Apply custom styles if provided
    if (config.style) {
      closeButton.style.cssText += config.style;
    }
    
    // Apply custom size
    if (config.size) {
      closeButton.style.width = config.size;
      closeButton.style.height = config.size;
    }
    
    // Apply custom position
    if (config.position) {
      const positionStyles = this._getCloseButtonPositionStyles();
      closeButton.style.cssText += positionStyles;
    }

    closeButton.addEventListener('click', () => this._handleClose());

    return closeButton;
  }

  private _getCloseButtonPositionStyles(): string {
    const position = this._closeButtonConfig.position || 'top-right';
    switch (position) {
      case 'top-left':
        return 'top: 10px; left: 10px;';
      case 'top-right':
        return 'top: 10px; right: 10px;';
      case 'bottom-left':
        return 'bottom: 10px; left: 10px;';
      case 'bottom-right':
        return 'bottom: 10px; right: 10px;';
      default:
        return 'top: 10px; right: 10px;';
    }
  }

  private _hasCloseButtonInContent(htmlContent?: string): boolean {
    if (!htmlContent) return false;
    // Simple check for close button indicators in HTML
    const closeIndicators = [
      'data-interstitial-close',
      'close-button',
      'interstitial-close',
      'onclick="close"'
    ];
    return closeIndicators.some(indicator => 
      htmlContent.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  private _handleClose(): void {
    // Restore body scroll
    document.body.classList.remove('rdn-interstitial-active');
    
    this.hide();
    this._callbacks.onClose?.();
  }

  public isVisible(): boolean {
    return this._isVisible;
  }
}