import { useCallback, useEffect, useRef, useState } from "react";
import { GuideLang } from "./types";

const LANG_TAG: Record<GuideLang, string> = { en: "en-IN", hi: "hi-IN" };

const synth: SpeechSynthesis | undefined =
  typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : undefined;

const pickVoice = (
  voices: SpeechSynthesisVoice[],
  lang: GuideLang
): SpeechSynthesisVoice | undefined => {
  const tag = LANG_TAG[lang];
  const prefix = lang;
  const matches = voices.filter(
    (v) => v.lang === tag || v.lang.replace("_", "-").startsWith(prefix)
  );
  // Prefer Microsoft voices (Edge/Windows), then exact locale match.
  return (
    matches.find((v) => /microsoft/i.test(v.name) && v.lang === tag) ||
    matches.find((v) => /microsoft/i.test(v.name)) ||
    matches.find((v) => v.lang === tag) ||
    matches[0]
  );
};

export const useVoice = (lang: GuideLang) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    if (!synth) return;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener("voiceschanged", load);
  }, []);

  const supported = !!synth;
  const hasVoice = !!pickVoice(voices, lang);

  const cancel = useCallback(() => {
    synth?.cancel();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(synth.getVoices(), langRef.current);
      utterance.lang = LANG_TAG[langRef.current];
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      synth.speak(utterance);
    },
    []
  );

  return { supported, hasVoice, speak, cancel };
};
