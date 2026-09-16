"use client";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { sendEmail } from "./email";

export function getChatId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

// Creates the chat thread if it doesn't exist yet, and returns its id.
// nameForA/emailForA is how participant A is labeled and reached — e.g. a
// business name + business email on the seller side, a personal name +
// login email on the buyer side.
export async function ensureChat(uidA, nameForA, emailForA, uidB, nameForB, emailForB) {
  const chatId = getChatId(uidA, uidB);
  const ref = doc(db, "chats", chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [uidA, uidB],
      participantNames: { [uidA]: nameForA, [uidB]: nameForB },
      participantEmails: { [uidA]: emailForA || null, [uidB]: emailForB || null },
      lastMessage: "",
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });
  }
  return chatId;
}

export function listenChats(uid, callback) {
  const q = query(collection(db, "chats"), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    callback(list);
  });
}

export function listenMessages(chatId, callback) {
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendMessage(chatId, senderUid, text) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderUid,
    text,
    createdAt: Date.now(),
  });
  await setDoc(doc(db, "chats", chatId), { lastMessage: text, lastMessageAt: Date.now() }, { merge: true });

  // Email the other person that a new message is waiting for them.
  try {
    const snap = await getDoc(doc(db, "chats", chatId));
    if (snap.exists()) {
      const chat = snap.data();
      const recipientUid = chat.participants.find((p) => p !== senderUid);
      const recipientEmail = chat.participantEmails?.[recipientUid];
      const recipientName = chat.participantNames?.[recipientUid];
      const senderName = chat.participantNames?.[senderUid] || "Someone";
      sendEmail(
        recipientEmail,
        recipientName,
        "New message on CLU Marketplace",
        `${senderName} sent you a message: "${text}"`
      );
    }
  } catch (e) {
    // Never let an email hiccup block the message from sending.
  }
}
