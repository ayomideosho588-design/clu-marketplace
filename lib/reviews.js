"use client";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export async function addReview({ orderId, productId, productTitle, sellerUid, buyerUid, buyerName, rating, comment }) {
  await addDoc(collection(db, "reviews"), {
    orderId,
    productId,
    productTitle,
    sellerUid,
    buyerUid,
    buyerName,
    rating,
    comment: comment || "",
    createdAt: Date.now(),
  });
  await updateDoc(doc(db, "orders", orderId), { reviewed: true });
}

export function listenReviewsForSeller(sellerUid, callback) {
  if (!sellerUid) return () => {};
  const q = query(collection(db, "reviews"), where("sellerUid", "==", sellerUid));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function ratingSummary(reviews) {
  if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { avg: sum / reviews.length, count: reviews.length };
}
