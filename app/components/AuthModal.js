"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "./Toast";

export default function AuthModal({ initialTab = "login", onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { signup, login } = useAuth();
  const toast = useToast();

  async function submit() {
    setBusy(true);
    try {
      if (tab === "login") {
        await login(email, password);
        toast("Welcome back!");
      } else {
        if (!name || !email || !password) {
          toast("Fill in all fields.");
          setBusy(false);
          return;
        }
        await signup(name, matric, email, password);
        toast(`Welcome to CLU Marketplace, ${name.split(" ")[0]}!`);
      }
      onClose();
    } catch (e) {
      toast(friendlyError(e));
    }
    setBusy(false);
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>
          {tab === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p style={{ fontSize: 13, color: "#877f6b", marginTop: 6 }}>
          Every account starts as a buyer — you can become a seller anytime from the nav.
        </p>
        <div className="tabs2">
          <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>Log in</button>
          <button className={tab === "signup" ? "active" : ""} onClick={() => setTab("signup")}>Sign up</button>
        </div>

        {tab === "signup" && (
          <>
            <label>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <label>Matric number (optional)</label>
            <input type="text" placeholder="NSC/2025/048" value={matric} onChange={(e) => setMatric(e.target.value)} />
          </>
        )}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="btn btn-green btn-block" style={{ marginTop: 20 }} disabled={busy} onClick={submit}>
          {busy ? "…" : tab === "login" ? "Log in" : "Create account"}
        </button>
      </div>
    </div>
  );
}

function friendlyError(e) {
  const code = e?.code || "";
  if (code.includes("email-already-in-use")) return "An account with that email already exists — try logging in.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Email or password doesn't match.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  return "Something went wrong — try again.";
    }
