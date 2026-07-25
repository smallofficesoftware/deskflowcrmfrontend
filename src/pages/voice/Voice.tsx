
import { useEffect, useRef, useState } from "react";

// Web Speech API types
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

const useSpeechRecognition = (flag: number = 1) => {
  const [voice, setVoice] = useState("");
  const [isListening, setIsListening] = useState(false);
  const transcriptHistoryRef = useRef<string[]>([]);
  const recognition: SpeechRecognition | null =
    typeof window !== "undefined" && "webkitSpeechRecognition" in window
      ? new window.webkitSpeechRecognition()
      : null;

  useEffect(() => {
    if (!recognition) return;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (result.isFinal) {
          if (flag === 1) {
            transcriptHistoryRef.current = [...transcriptHistoryRef.current, transcript];
            const finalCombined = transcriptHistoryRef.current.join(" ");
            setVoice(finalCombined);
          } else if (flag === 0) {
            setVoice(transcript);
          }
        } else if (flag === 1) {
          interimTranscript += transcript;
        }
      }
      if (flag === 1) {
        const finalCombined = transcriptHistoryRef.current.join(" ");
        setVoice(finalCombined + (interimTranscript ? " " + interimTranscript : ""));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) recognition.start(); // Auto-restart if still active
    };
  }, [recognition, isListening, flag]);

  const startListening = () => {
    if (!recognition || isListening) return;
    setVoice("");
    transcriptHistoryRef.current = [];
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    if (!recognition || !isListening) return;
    recognition.stop();
    setIsListening(false);
  };

  return {
    voice,
    isListening,
    startListening,
    stopListening,
    setVoice,
    hasRecognitionSupport: !!recognition,
  };
};

export default useSpeechRecognition;
