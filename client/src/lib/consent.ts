/**
 * Çerez onayı (KVKK Çerez Rehberi): zorunlu olmayan çerezler (analitik) yalnızca açık rızayla.
 * Tercih bu tarayıcıda saklanır; değişince 'fc-consent' olayı yayınlanır.
 */
export type Consent = 'granted' | 'denied';

const KEY = 'fc-consent';
export const CONSENT_EVENT = 'fc-consent';
export const OPEN_CONSENT_EVENT = 'fc-consent-open';

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(v: Consent) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* depolama kapalıysa tercih yalnızca bu sayfa için geçerli */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

/** Alt bilgideki "Çerez tercihleri" bağlantısı onay çubuğunu yeniden açar */
export function openConsent() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
