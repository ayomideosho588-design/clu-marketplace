"use client";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

export const CATEGORIES = [
  "Food",
  "Fashion",
  "Electronics",
  "Books & Notes",
  "Beauty",
  "Services",
  "Snacks & Drinks",
  "Other",
];

export const COMMISSION_RATE = 0.05;

export function resizeImageFile(file, maxW = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(path, dataUrl) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, "data_url");
  return getDownloadURL(storageRef);
}

export function listenProducts(callback) {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addProduct(data) {
  await addDoc(collection(db, "products"), {
    ...data,
    createdAt: Date.now(),
  });
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}

export function listenOrders(callback) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function placeOrder(order) {
  await addDoc(collection(db, "orders"), { ...order, createdAt: Date.now() });
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, "orders", orderId), { status });
}

export function listenNotifications(uid, callback) {
  if (!uid) return () => {};
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function pushNotification(uid, type, message) {
  await addDoc(collection(db, "users", uid, "notifications"), {
    type,
    message,
    read: false,
    createdAt: Date.now(),
  });
}

export async function markNotificationsRead(uid, notifications) {
  await Promise.all(
    notifications
      .filter((n) => !n.read)
      .map((n) =>
        updateDoc(doc(db, "users", uid, "notifications", n.id), {
          read: true,
        })
      )
  );
}
