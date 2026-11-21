// Google Ads (gtag.js) & Google AdSense Business Ad Integration Helper

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

const GTAG_SCRIPT_ATTR = 'data-google-ads-gtag';
const ADSENSE_SCRIPT_ATTR = 'data-google-adsense-client';

/**
 * Ensures `window.dataLayer` and `window.gtag` exist and loads the official
 * Google Tag (`https://www.googletagmanager.com/gtag/js?id=...`) into `<head>`.
 */
export function initGoogleAdsTag(googleTagId: string): boolean {
  if (typeof window === 'undefined' || !googleTagId.trim()) return false;
  const cleanId = googleTagId.trim();

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[${GTAG_SCRIPT_ATTR}="${cleanId}"]`
  );

  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanId)}`;
    script.setAttribute(GTAG_SCRIPT_ATTR, cleanId);
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', cleanId);
  return true;
}

/**
 * Loads official Google AdSense (`adsbygoogle.js`) script when a valid
 * `ca-pub-...` Publisher ID is provided via `VITE_GOOGLE_ADSENSE_CLIENT`.
 */
export function initGoogleAdSense(clientId?: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanClient = (
    clientId ||
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_ADSENSE_CLIENT : '') ||
    ''
  ).trim();

  if (!cleanClient || !cleanClient.startsWith('ca-pub-')) return false;

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[${ADSENSE_SCRIPT_ATTR}="${cleanClient}"]`
  );

  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      cleanClient
    )}`;
    script.setAttribute(ADSENSE_SCRIPT_ATTR, cleanClient);
    document.head.appendChild(script);
  }

  return true;
}

/**
 * Triggers an `adsbygoogle` slot render when Google AdSense is mounted.
 */
export function pushAdSenseSlot(): void {
  if (typeof window === 'undefined') return;
  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch {
    // Ignore when AdSense script is not active in preview/sandbox
  }
}

/**
 * Dispatches a Google Ads conversion event via `window.gtag('event', 'conversion', ...)`.
 */
export function dispatchGoogleAdsConversion(params: {
  googleTagId: string;
  conversionLabel: string;
  valueUsd: number;
  currency?: string;
  transactionId?: string;
}): { dispatched: boolean; sendTo: string } {
  const cleanTag = params.googleTagId.trim();
  const cleanLabel = params.conversionLabel.trim();
  const sendTo = cleanLabel ? `${cleanTag}/${cleanLabel}` : cleanTag;

  if (typeof window === 'undefined' || !cleanTag) {
    return { dispatched: false, sendTo };
  }

  if (typeof window.gtag !== 'function') {
    initGoogleAdsTag(cleanTag);
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: sendTo,
      value: Number(params.valueUsd.toFixed(2)),
      currency: params.currency || 'USD',
      transaction_id: params.transactionId || `ts_conv_${Date.now()}`,
    });
    return { dispatched: true, sendTo };
  }

  return { dispatched: false, sendTo };
}
