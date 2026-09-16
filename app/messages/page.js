"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { listenChats } from "@/lib/chat";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const unsub = listenChats(user.uid, setChats);
    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <>
        <Header />
        <div className="wrap"><div className="empty-state"><h3>Log in to see your messages</h3></div></div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="dash-header"><h2 style={{ fontSize: 24 }}>Messages</h2></div>
        {chats.length ? (
          chats.map((c) => {
            const otherUid = c.participants.find((p) => p !== user.uid);
            const otherName = c.participantNames?.[otherUid] || "Unknown";
            return (
              <div className="chat-list-item" key={c.id} onClick={() => router.push(`/messages/${c.id}`)}>
                <div className="av">{otherName.slice(0, 2).toUpperCase()}</div>
                <div className="info">
                  <h4>{otherName}</h4>
                  <p>{c.lastMessage || "No messages yet"}</p>
                </div>
                <span className="time">{timeAgo(c.lastMessageAt)}</span>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <h3>No conversations yet</h3>
            <p>Message a seller from a listing, or a buyer from an order, to start chatting.</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
