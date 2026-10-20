/**
 * Privacy-friendly analytics wrapper.
 *
 * - No cookies, no cross-site identifiers, no fingerprinting.
 * - Events are only sent after the visitor accepts analytics cookies
 *   (see `CookieBanner`), unless the site is configured to be essential-only.
 * - Plausible is used as the default provider; the queue is discarded when
 *   consent is missing so nothing leaks from the first paint.
 */

const CONSENT_KEY = "cancha-analytics-consent";

export type AnalyticsEvent =
  | { name: "cta_click"; props: { placement: string; variant?: string } }
  | { name: "trial_form_start" }
  | { name: "trial_form_submit"; props: { courts?: string } }
  | { name: "trial_form_success" }
  | { name: "trial_form_error" }
  | { name: "demo_video_play" }
  | { name: "faq_open"; props: { index: number } }
  | { name: "theme_toggle"; props: { theme: string } }
  | { name: "country_change"; props: { country: string } }
  | { name: "roadmap_notify" };

type PlausibleWindow = Window & {
  plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
};

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(value: "accepted" | "essential") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable */
  }
}

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  const plausible = (window as PlausibleWindow).plausible;
  if (!plausible) return;

  plausible(event.name, "props" in event ? { props: event.props } : undefined);
}
