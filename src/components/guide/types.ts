export type GuideLang = "en" | "hi";

export interface GuideText {
  en: string;
  hi: string;
}

export interface GuideStep {
  /** CSS selector of the element to point at. Omit for a centred message. */
  selector?: string;
  /** Route to navigate to before highlighting. */
  route?: string;
  /** Selector to click first (e.g. to open a dropdown) so the target exists. */
  clickFirst?: string;
  title: GuideText;
  text: GuideText;
  side?: "top" | "right" | "bottom" | "left";
}

export interface Guide {
  id: string;
  title: GuideText;
  steps: GuideStep[];
}
