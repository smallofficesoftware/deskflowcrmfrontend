import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { guides, onboardingGuide } from "./guides";
import { runTour, stopTour } from "./runTour";
import { Guide, GuideLang } from "./types";
import { useGuideEnabled } from "./useGuideEnabled";
import { useVoice } from "./useVoice";

const LS_LANG = "guideLang";
const LS_VOICE = "guideVoiceOn";
const LS_DONE = "guideOnboardingDone";

// Screens where the logged-in app is rendered.
const APP_PATHS = ["/", "/SideView", "/Automations", "/reviews"];

const readLs = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLs = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: preference just won't persist */
  }
};

const Mascot = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
    <circle cx="28" cy="28" r="28" fill="#4f46e5" />
    <circle cx="28" cy="30" r="19" fill="#ffffff" />
    <circle cx="21" cy="27" r="3.2" fill="#1e1b4b" />
    <circle cx="35" cy="27" r="3.2" fill="#1e1b4b" />
    <path
      d="M20 35c2.5 4 13.5 4 16 0"
      stroke="#1e1b4b"
      strokeWidth="2.2"
      fill="none"
      strokeLinecap="round"
    />
    <rect x="26.5" y="4" width="3" height="7" rx="1.5" fill="#fbbf24" />
    <circle cx="28" cy="4" r="3" fill="#fbbf24" />
  </svg>
);

const GuideAvatar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<GuideLang>(
    readLs(LS_LANG) === "hi" ? "hi" : "en"
  );
  const [voiceOn, setVoiceOn] = useState(readLs(LS_VOICE) !== "0");
  const [touring, setTouring] = useState(false);
  const [nudge, setNudge] = useState(false);
  const { supported, hasVoice, speak, cancel } = useVoice(lang);

  const loggedIn = !!readLs("token");
  const onAppScreen = APP_PATHS.some((p) =>
    p === "/" ? location.pathname === "/" : location.pathname.startsWith(p)
  );

  const enabled = useGuideEnabled(loggedIn && onAppScreen);

  // First visit: nudge once instead of forcing the tour.
  useEffect(() => {
    if (enabled && readLs(LS_DONE) !== "1") setNudge(true);
  }, [enabled]);

  useEffect(() => () => stopTour(), []);

  const start = useCallback(
    (guide: Guide) => {
      setOpen(false);
      setNudge(false);
      setTouring(true);
      runTour({
        guide,
        lang,
        voiceOn,
        navigate,
        currentPath: () => window.location.pathname,
        speak,
        cancelSpeech: cancel,
        onEnd: (completed) => {
          setTouring(false);
          if (guide.id === onboardingGuide.id) writeLs(LS_DONE, "1");
          if (!completed) cancel();
        },
      });
    },
    [lang, voiceOn, navigate, speak, cancel]
  );

  const changeLang = (next: GuideLang) => {
    setLang(next);
    writeLs(LS_LANG, next);
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    writeLs(LS_VOICE, next ? "1" : "0");
    if (!next) cancel();
  };

  if (!loggedIn || !onAppScreen || !enabled || touring) return null;

  const hi = lang === "hi";

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 2000 }}>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 68,
            width: 270,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            padding: 14,
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {hi ? "मैं आपकी कैसे मदद करूं?" : "How can I help?"}
          </div>
          {guides.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => start(g)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 6,
                cursor: "pointer",
              }}
            >
              {g.title[lang]}
            </button>
          ))}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => changeLang(hi ? "en" : "hi")}
              style={{ cursor: "pointer" }}
            >
              {hi ? "English" : "हिन्दी"}
            </button>
            {supported && (
              <button
                type="button"
                onClick={toggleVoice}
                style={{ cursor: "pointer" }}
              >
                {voiceOn ? "🔊 On" : "🔇 Off"}
              </button>
            )}
          </div>
          {supported && voiceOn && !hasVoice && (
            <div style={{ color: "#b45309", fontSize: 12, marginTop: 6 }}>
              {hi
                ? "इस ब्राउज़र में हिन्दी आवाज़ नहीं है, सिर्फ़ टेक्स्ट दिखेगा।"
                : "No English voice found in this browser; text only."}
            </div>
          )}
        </div>
      )}
      {nudge && !open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 68,
            width: 220,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            padding: 12,
            fontSize: 14,
          }}
        >
          {hi ? "क्या आप छोटा टूर देखना चाहेंगे?" : "Want a quick tour?"}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => start(onboardingGuide)}>
              {hi ? "हाँ" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNudge(false);
                writeLs(LS_DONE, "1");
              }}
            >
              {hi ? "बाद में" : "Later"}
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        aria-label="Help assistant"
        onClick={() => {
          setNudge(false);
          setOpen((o) => !o);
        }}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          borderRadius: "50%",
          boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
        }}
      >
        <Mascot />
      </button>
    </div>
  );
};

export default GuideAvatar;
