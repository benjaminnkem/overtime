import { init, type NimiqProvider } from "@nimiq/mini-app-sdk";

let providerPromise: Promise<NimiqProvider> | null = null;

/**
 * Resolves once `window.nimiq` is injected by the Nimiq Pay host WebView, or
 * rejects after `timeoutMs` when running in a plain browser (e.g. local dev
 * outside Nimiq Pay). Cached so repeated calls share one poll/rejection.
 */
export function getNimiqProvider(timeoutMs = 2000): Promise<NimiqProvider> {
  providerPromise ??= init({ timeout: timeoutMs });
  return providerPromise;
}
