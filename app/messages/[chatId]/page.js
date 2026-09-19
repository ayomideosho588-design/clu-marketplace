"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
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
      <div className="wrap chat-wrap" style={{ paddingBottom: 40 }}>
        <div className="chat-shell">
          <div className="chat-header">
            <button className="back" onClick={() => router.push("/messages")}>←</button>
            <div className="av">{otherName.slice(0, 2).toUpperCase()}</div>
            <div className="meta">
              <h3>{otherName}</h3>
              <span>Campus chat</span>
            </div>
          </div>

          <div className="chat-body">
            {messages.length === 0 ? (
              <div className="chat-empty">Say hello — this starts the conversation.</div>
            ) : (
              messages.map((m) => {
                const mine = m.senderUid === user.uid;
                return (
                  <div key={m.id} className={`bubble ${mine ? "mine" : "theirs"}`}>
                    <div>{m.text}</div>
                    <span className="time">{timeLabel(m.createdAt)}</span>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="chat-send-btn" disabled={sending} onClick={handleSend}>
              ➤
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
