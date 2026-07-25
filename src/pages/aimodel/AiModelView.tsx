import React, { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { openInNewTab, useEscapeKey } from "../../common/SharedFunction";
import { useTheme } from "../../components/ThemeContext";
import useSpeechRecognition from "../voice/Voice";
import { AIAssistantResponse, askAIAssistant } from "./AiModelController";

interface IMessage {
  type: "question" | "response" | "error";
  content: string;
  errorType?: "syntax" | "timeout" | "connection" | "execution" | "unknown";
  timestamp: string;
}

interface IPropDashboardView {
  isAiModelopen: boolean;
  closeisAiModel: () => void;
}

const DashboardView: React.FC<IPropDashboardView> = ({ isAiModelopen, closeisAiModel }) => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    voice,
    startListening,
    stopListening,
    isListening,
    setVoice,
    hasRecognitionSupport,
  } = useSpeechRecognition();

  useEscapeKey(closeisAiModel);

  // Update inputValue when voice changes
  useEffect(() => {
    if (voice) {
      setInputValue(voice);
    }
  }, [voice]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleVoiceToggle = useCallback(() => {
    if (!hasRecognitionSupport) {
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          content: "Speech recognition is not supported in this browser.",
          errorType: "unknown",
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    if (isListening) {
      stopListening();
      setVoice("");
    } else {
      startListening();
    }
  }, [hasRecognitionSupport, isListening, stopListening, setVoice]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;

      const userMessage: IMessage = {
        type: "question",
        content: inputValue,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response: AIAssistantResponse = await askAIAssistant(inputValue, true);

        if (!response.success) {
          let errorType: IMessage["errorType"] = "unknown";
          let errorContent = response.message || "An error occurred";

          switch (response.errorCode) {
            case "DATABASE_ERROR":
            case "QUERY_EXECUTION_ERROR":
              errorType = "syntax";
              errorContent += "\n\nTip: Check your query syntax or database structure.";
              break;
            case "TIMEOUT_ERROR":
              errorType = "timeout";
              errorContent += "\n\nTip: Try a simpler query or try again later.";
              break;
            case "NETWORK_ERROR":
            case "AUTHENTICATION_ERROR":
            case "INVALID_UUID":
            case "API_KEY_MISSING":
              errorType = "connection";
              errorContent += "\n\nTip: Check your network connection or contact support.";
              break;
            case "RESTRICTED_QUERY":
              errorType = "execution";
              errorContent += "\n\nTip: Avoid operations like DROP or DELETE.";
              break;
            default:
              errorContent += response.error ? `\n\nDetails: ${response.error}` : "";
          }

          setMessages((prev) => [
            ...prev,
            {
              type: "error",
              content: errorContent,
              errorType,
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          let responseContent = response.query;
          if (response.results?.length) {
            responseContent += `\n\nExecution Results (${response.tenant || "unknown tenant"}):\n${JSON.stringify(
              response.results,
              null,
              2
            )}`;
          }

          setMessages((prev) => [
            ...prev,
            {
              type: "response",
              content: responseContent,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            type: "error",
            content: "Unexpected error occurred. Please try again.",
            errorType: "unknown",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
        setInputValue("");
        setVoice("");
        if (isListening) {
          stopListening();
        }
      }
    },
    [inputValue, isListening, stopListening, setVoice]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  const renderJsonTable = useCallback(
    (jsonString: string) => {
      try {
        const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return <div>Invalid JSON data</div>;

        const jsonData: any[] = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(jsonData) || jsonData.length === 0) return <div>No results found</div>;

        const headers = Object.keys(jsonData[0]);

        return (
          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "400px",
              marginTop: "12px",
              width: "100%",
              scrollbarWidth: "thin",
              scrollbarColor: darkMode ? "#4a5b7d #1f2a3a" : "#ccc #f5f5f5",
            }}
          >
            <table
              style={{
                width: "max-content",
                minWidth: "100%",
                borderCollapse: "collapse",
                backgroundColor: darkMode ? "#1f2a3a" : "#fff",
                color: darkMode ? "#ccc" : "#333",
                tableLayout: "auto",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: darkMode ? "#273049" : "#f5f5f5",
                  zIndex: 1,
                }}
              >
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      style={{
                        border: `1px solid ${darkMode ? "#273049" : "#ddd"}`,
                        padding: "8px",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        minWidth: "100px",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {header.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jsonData.map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td
                        key={header}
                        style={{
                          border: `1px solid ${darkMode ? "#273049" : "#ddd"}`,
                          padding: "8px",
                          wordBreak: "break-word",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "normal",
                          maxWidth: "200px",
                          minWidth: "100px",
                        }}
                      >
                        {row[header] instanceof Date && !isNaN(row[header].getTime())
                          ? row[header].toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })
                          : row[header] === null || row[header] === undefined
                            ? "N/A"
                            : typeof row[header] === "object" || row[header]?.toString() === "Invalid Date"
                              ? JSON.stringify(row[header])
                              : String(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } catch (error) {
        return <div>Error parsing JSON data: {(error as Error).message}</div>;
      }
    },
    [darkMode]
  );

  const formatTimestamp = useCallback((isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return isAiModelopen ? (
    <div
      style={{
        flex: "60%",
        display: "flex",
        overflow: "hidden",
        backgroundColor: darkMode ? "#141423" : "#f0f2f5",
        color: darkMode ? "#ccc" : "#333",
        height: "100%"
      }}
      id="right"
    >
      <Container
        fluid
        className="mt-2"
        style={{ display: "flex", flexDirection: "column", height: "100%", }}
      >
        <div className="col-12 text-end mb-2">
          <div className="ICON">
            <button
              style={{ marginRight: "10px", background: "none", border: "none", cursor: "pointer" }}>
              <p
                className="landing-page-text "
                style={{
                  cursor: "pointer",
                  color: "blue",
                  fontSize: "13px",
                  display: "flex",
                  justifyContent: "end",
                  alignItems: "center",
                  marginTop: "10px",
                  marginBottom: "10px",
                  gap: "10px",
                }}
                onClick={() => openInNewTab("/videoTutorial", 10)}
              >
                Learn More :
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#0000FF"
                >
                  <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                </svg>

              </p>
            </button>

            <button
              className="icons"
              onClick={clearConversation}
              title="Clear conversation"
              style={{ marginRight: "10px", background: "none", border: "none", cursor: "pointer" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" />
              </svg>
            </button>
            <button
              className="icons"
              onClick={closeisAiModel}
              title="Close AI Assistant"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z" />
              </svg>
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            backgroundColor: darkMode ? "#141423" : "#fff",
            borderRadius: "10px",
            marginBottom: "1rem",
            border: darkMode ? "1px solid #273049" : "1px solid #ddd",
          }}
        >
          {messages.length === 0 && !loading && (
            <div
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                textAlign: "center",
              }}
            >
              <h3>👋 Welcome to small-office AI Assistant</h3>
              <p>Please ask your question related to your data in simple English. We will try to generate the result for you.</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: "16px",
                fontSize: "1rem",
                backgroundColor:
                  message.type === "question"
                    ? darkMode
                      ? "#1e1e2f"
                      : "#f0f0f0"
                    : message.type === "error"
                      ? darkMode
                        ? "#2b1f1f"
                        : "#ffebee"
                      : darkMode
                        ? "#1f2a3a"
                        : "#e3f2fd",
                padding: "12px",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
                color: message.type === "error" ? "#ff6b6b" : darkMode ? "#ccc" : "#333",
                borderLeft:
                  message.type === "question"
                    ? "4px solid #3c4a7d"
                    : message.type === "error"
                      ? "4px solid #ff6b6b"
                      : "4px solid #4caf50",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>
                  {message.type === "question"
                    ? "You:"
                    : message.type === "error"
                      ? "❌ Error:"
                      : "🤖 AI:"}
                </strong>
                <span style={{ fontSize: "0.8rem", color: darkMode ? "#aaa" : "#666" }}>
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div style={{ marginTop: "4px" }}>
                {message.type === "response" && message.content.includes("Execution Results")
                  ? renderJsonTable(message.content)
                  : message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div
              style={{
                marginBottom: "16px",
                fontSize: "1rem",
                backgroundColor: darkMode ? "#1f2a3a" : "#e3f2fd",
                padding: "12px",
                borderRadius: "8px",
                borderLeft: "4px solid #4caf50",
              }}
            >
              <Skeleton
                count={1}
                height={60}
                style={{ borderRadius: "8px", opacity: darkMode ? 1 : 0.5 }}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: darkMode ? "#273049" : "#e0e0e0",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, position: "relative", minWidth: "200px" }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Example: Show me all customers from New York..."
              autoComplete="off"
              style={{
                width: "100%",
                background: darkMode ? "#1f2a3a" : "#f5f5f5",
                border: "none",
                outline: "none",
                color: darkMode ? "white" : "#333",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "1rem",
              }}
            />
            {isListening && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-20px",
                  left: "0",
                  fontSize: "0.875rem",
                  color: "#ff6b6b",
                }}
              >
                Listening...
              </div>
            )}
          </div>
          <button
            className="send_box_icons"
            onClick={handleVoiceToggle}
            style={{
              color: isListening ? "#ff6b6b" : darkMode ? "#ccc" : "#333",
              transition: "color 0.3s ease",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
            }}
            title={isListening ? "Stop Listening" : "Start Listening"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="currentColor"
            >
              <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: loading ? "#6c757d" : "#3c4a7d",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              minWidth: "100px",
            }}
          >
            {loading ? "Processing..." : "Ask"}
          </button>
        </form>
      </Container>
    </div>
  ) : null;
};

export default DashboardView;