import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

// Team side of the storefront's in-store chat. Messages live in the contact's normal message history
// (entry_flag 3), so they also show on the contact; this screen is just the quick inbox to answer them.

interface IThread {
  contact_id: number;
  name: string;
  mobile: string | null;
  last_text: string;
  last_at: string;
  needs_reply: boolean;
}
interface IMessage {
  id: number;
  from: "us" | "them";
  text: string;
  at: string;
}

const POLL_MS = 5000;

const timeOf = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const StorefrontChatInbox = ({ show, onHide }: { show: boolean; onHide: () => void }) => {
  const [threads, setThreads] = useState<IThread[]>([]);
  const [active, setActive] = useState<IThread | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const { data } = await axiosInstance.post("storefront/chat/threads", {});
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) setThreads(data.data?.item || []);
    } catch {
      // next poll retries
    }
  }, []);

  const loadMessages = useCallback(async (contactId: number) => {
    try {
      const { data } = await axiosInstance.post("storefront/chat/messages", { contact_id: contactId });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) setMessages(data.data?.item || []);
    } catch {
      // next poll retries
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    loadThreads();
    const t = setInterval(() => {
      loadThreads();
      if (active) loadMessages(active.contact_id);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [show, active, loadThreads, loadMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const openThread = (t: IThread) => {
    setActive(t);
    setMessages([]);
    loadMessages(t.contact_id);
  };

  const send = async () => {
    const message = text.trim();
    if (!active || !message || sending) return;
    setSending(true);
    try {
      const { data } = await axiosInstance.post("storefront/chat/reply", {
        contact_id: active.contact_id,
        message,
        a_application_login_id: localStorage.getItem("UUID"),
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setText("");
        await loadMessages(active.contact_id);
        loadThreads();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Customer chats</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0 }}>
        <div style={{ display: "flex", height: 460 }}>
          <div style={{ width: 240, borderRight: "1px solid #e5eaef", overflowY: "auto" }}>
            {threads.length === 0 && <div className="text-muted small p-3">No customer chats yet.</div>}
            {threads.map((t) => (
              <div
                key={t.contact_id}
                onClick={() => openThread(t)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f3f6",
                  background: active?.contact_id === t.contact_id ? "#eef3f8" : "transparent",
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <b className="text-truncate">{t.name}</b>
                  {t.needs_reply && <span className="badge bg-danger">Reply</span>}
                </div>
                <div className="text-muted small text-truncate">{t.last_text}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {timeOf(t.last_at)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {!active ? (
              <div className="text-muted p-4">Select a chat to read and reply.</div>
            ) : (
              <>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #e5eaef" }}>
                  <b>{active.name}</b>
                  {active.mobile && <span className="text-muted small ms-2">{active.mobile}</span>}
                </div>
                <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 14, background: "#f7f9fb", display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        maxWidth: "75%",
                        alignSelf: m.from === "us" ? "flex-end" : "flex-start",
                        background: m.from === "us" ? "#1070b2" : "#fff",
                        color: m.from === "us" ? "#fff" : "#1f2a37",
                        border: m.from === "us" ? "0" : "1px solid #e5eaef",
                        borderRadius: 10,
                        padding: "7px 11px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <div>{m.text}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, textAlign: "right" }}>{timeOf(m.at)}</div>
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-2 p-2" style={{ borderTop: "1px solid #e5eaef" }}>
                  <input
                    className="form-control"
                    value={text}
                    maxLength={255}
                    placeholder="Type a reply..."
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                  />
                  <Button onClick={send} disabled={sending || !text.trim()}>
                    Send
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default StorefrontChatInbox;
