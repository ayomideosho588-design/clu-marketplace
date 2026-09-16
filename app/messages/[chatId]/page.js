"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { listenMessages, sendMessage } from "@/lib/chat";

function timeLabel(ts) {
  const d = new Date(ts);
  return d.toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ChatThreadPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (snap.exists()) setChat({ id: snap.id, ...snap.data() });
    })();
  }, [chatId]);

  useEffect(() => {
    const unsub = listenMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!user) {
    return (
      <>
        <Header />
        <div className="wrap"><div className="empty-state"><h3>Log in to view this conversation</h3></div></div>
        <Footer />
      </>
    );
  }

  const otherUid = chat?.participants?.find((p) => p !== user.uid);
  const otherName = chat?.participantNames?.[otherUid] || "…";

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(chatId, user.uid, text.trim());
      setText("");
    } catch (e) {
      // silent — chat isn't critical enough to interrupt with a toast per failed send
    }
    setSending(false);
  }

  return (
    <>
      <Header />
      <div className="wrap" style={{ maxWidth: 640, display: "flex", flexDirection: "column", minHeight: "60vh" }}>
        <div className="dash-header" style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: 20 }}>{otherName}</h2>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            background: "var(--white)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 14,
            minHeight: 320,
            maxHeight: "55vh",
            overflowY: "auto",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: "#877f6b", fontSize: 13, textAlign: "center", margin: "auto" }}>
              Say hello — this starts the conversation.
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.senderUid === user.uid;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    background: mine ? "var(--green)" : "var(--paper-dim)",
                    color: mine ? "var(--white)" : "var(--ink)",
                    padding: "8px 12px",
                    borderRadius: 12,
                    borderBottomRightRadius: mine ? 3 : 12,
                    borderBottomLeftRadius: mine ? 12 : 3,
                    fontSize: 13.5,
                  }}
                >
                  <div>{m.text}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>{timeLabel(m.createdAt)}</div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 30 }}>
          <input
            type="text"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-green" disabled={sending} onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
