"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { listenNotifications, markNotificationsRead } from "@/lib/data";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export default function NotifBell() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenNotifications(user.uid, setNotifs);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!user) return null;
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="bell-btn"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unread > 0) markNotificationsRead(user.uid, notifs);
        }}
      >
        🔔 {unread > 0 && <span className="bell-dot">{unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          {notifs.length === 0 ? (
            <div className="notif-empty">No reminders yet — activity on your orders will show up here.</div>
          ) : (
            notifs.map((n) => (
              <div className={`ticket ${n.read ? "" : "unread"}`} key={n.id}>
                <div className="t-top">
                  <span className="t-type">{n.type}</span>
                  <span className="t-time">{timeAgo(n.createdAt)}</span>
                </div>
                <div className="t-msg">{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
