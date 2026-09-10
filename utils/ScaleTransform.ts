// utils/ScaleTransform.ts

export class ScaleTransform {
  /**
   * 根據瀏覽器與裝置 DPI，自動套用縮放修正
   * 建議用於 OnlyOffice 等座標敏感元件
   */
  static apply() {
    const dpr = window.devicePixelRatio;
    const ua = navigator.userAgent;

    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(ua);

    // Chrome：使用 zoom 修正
    if (isChrome && dpr !== 1) {
      document.body.style.zoom = `${1 / dpr}`;
    }

    // Firefox：使用 transform 修正
    if (isFirefox && dpr !== 1) {
      document.body.style.transform = `scale(${1 / dpr})`;
      document.body.style.transformOrigin = 'top left';
    }
  }

  /**
   * 取得建議的 OnlyOffice zoom 值（補償畫面縮小）
   */
  static getOnlyOfficeZoom(multiplier: number = 1.0): number {
    return 100 * window.devicePixelRatio * multiplier;
  }
  /**
   * 清除套用的縮放（若頁面重設）
   */
  static reset() {
    document.body.style.zoom = '';
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
  }
}
