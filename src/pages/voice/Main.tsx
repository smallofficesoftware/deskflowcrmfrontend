import { useEffect, useState } from "react";
import useSpeechRecognition from "./Voice"; // Assuming you have a custom hook for speech recognition

const VoiceCommandsHandler = () => {
 
  const {
    voice,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useSpeechRecognition(0); 

  return (
    <div>
    <h2>Speech Recognition ({isListening ? "Listening" : "Idle"})</h2>
    <p><strong>Transcript:</strong> {voice}</p>
    {hasRecognitionSupport ? (
      <>
        <button onClick={startListening}>Start</button>
        <button onClick={stopListening}>Stop</button>
      </>
    ) : (
      <p>Your browser doesn't support speech recognition.</p>
    )}
  </div>
  );
};



export default VoiceCommandsHandler;
