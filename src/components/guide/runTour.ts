import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Guide, GuideLang } from "./types";

interface RunTourOptions {
  guide: Guide;
  lang: GuideLang;
  voiceOn: boolean;
  navigate: (path: string) => void;
  currentPath: () => string;
  speak: (text: string) => void;
  cancelSpeech: () => void;
  onEnd?: (completed: boolean) => void;
}

const WAIT_TIMEOUT_MS = 5000;

const isVisible = (el: Element) => el.getClientRects().length > 0;

// Resolves once the selector matches a rendered (non display:none) element.
const waitForElement = (selector: string): Promise<Element | null> =>
  new Promise((resolve) => {
    const found = document.querySelector(selector);
    if (found && isVisible(found)) return resolve(found);
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el && isVisible(el)) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, WAIT_TIMEOUT_MS);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  });

let activeDriver: Driver | null = null;

export const stopTour = () => {
  activeDriver?.destroy();
  activeDriver = null;
};

export const runTour = ({
  guide,
  lang,
  voiceOn,
  navigate,
  currentPath,
  speak,
  cancelSpeech,
  onEnd,
}: RunTourOptions) => {
  stopTour();

  const { steps } = guide;
  const d = driver({
    animate: true,
    allowClose: true,
    overlayOpacity: 0.6,
    stagePadding: 6,
  });
  activeDriver = d;

  let finished = false;
  const finish = (completed: boolean) => {
    if (finished) return;
    finished = true;
    cancelSpeech();
    d.destroy();
    if (activeDriver === d) activeDriver = null;
    onEnd?.(completed);
  };

  const goTo = async (index: number): Promise<void> => {
    cancelSpeech();
    if (index >= steps.length) return finish(true);
    if (index < 0) return;

    const step = steps[index];
    const last = index === steps.length - 1;

    if (step.route && currentPath() !== step.route) navigate(step.route);

    let element: Element | null = null;
    if (step.selector) {
      element = document.querySelector(step.selector);
      // Target may exist but be hidden (closed dropdown): open it first.
      if ((!element || !isVisible(element)) && step.clickFirst) {
        (document.querySelector(step.clickFirst) as HTMLElement | null)?.click();
      }
      element = await waitForElement(step.selector);
      // Target missing (feature hidden by rights/plan): skip to the next step.
      if (!element) return goTo(index + 1);
    }

    if (finished) return;

    d.highlight({
      element: element || undefined,
      popover: {
        title: `${step.title[lang]} (${index + 1}/${steps.length})`,
        description: step.text[lang],
        side: step.side,
        showButtons: ["previous", "next", "close"],
        nextBtnText: last ? (lang === "hi" ? "पूरा हुआ" : "Done") : lang === "hi" ? "आगे" : "Next",
        prevBtnText: lang === "hi" ? "पीछे" : "Back",
        onNextClick: () => goTo(index + 1),
        onPrevClick: () => goTo(index - 1),
        onCloseClick: () => finish(false),
      },
    });

    if (voiceOn) speak(`${step.title[lang]}. ${step.text[lang]}`);
  };

  goTo(0);
};
