"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function signup(name, matric, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const userDoc = {
      name,
      matric: matric || "",
      email,
      isSeller: false,
      business: null,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userDoc);
    return cred.user;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
  }

  async function becomeSeller(business) {
    if (!user) throw new Error("Not logged in");
    await setDoc(
      doc(db, "users", user.uid),
      { isSeller: true, business },
      { merge: true }
    );
  }

  return (
    <AuthCtx.Provider
      value={{ user, profile, loading, signup, login, logout, becomeSeller }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
