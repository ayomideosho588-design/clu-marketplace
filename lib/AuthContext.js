"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
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
      phone: "",
      photoUrl: null,
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
    await setDoc(doc(db, "users", user.uid), { isSeller: true, business }, { merge: true });
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  async function updateProfileInfo(fields) {
    if (!user) throw new Error("Not logged in");
    await setDoc(doc(db, "users", user.uid), fields, { merge: true });
  }

  async function deleteAccount(password) {
    if (!user) throw new Error("Not logged in");
    const uid = user.uid;

    // Firebase requires a recent login before allowing account deletion —
    // re-enter the password to prove it's really them.
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);

    // Remove their own listings so they stop appearing in the market.
    const q = query(collection(db, "products"), where("sellerUid", "==", uid));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "products", d.id))));

    // Remove their profile document, then the auth account itself.
    await deleteDoc(doc(db, "users", uid));
    await deleteUser(user);
  }

  return (
    <AuthCtx.Provider
      value={{
        user,
        profile,
        loading,
        signup,
        login,
        logout,
        becomeSeller,
        resetPassword,
        updateProfileInfo,
        deleteAccount,
      }}
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
