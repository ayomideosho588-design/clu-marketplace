"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "./Toast";

export default function AuthModal({ initialTab = "login", onClose }) {
  const [tab, setTab] = useState(initialTab); // "login" | "signup" | "reset"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const { signup, login, loginWithGoogle, resetPassword } = useAuth();
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
        await signup(name, email, password);
        toast(`Welcome to CLU Marketplace, ${name.split(" ")[0]}!`);
      }
      onClose();
    } catch (e) {
      toast(friendlyError(e));
    }
    setBusy(false);
  }

  async function googleSignIn() {
    setBusy(true);
    try {
      const u = await loginWithGoogle();
      const first = (u?.displayName || "").split(" ")[0];
      toast(first ? `Welcome, ${first}!` : "Welcome!");
      onClose();
    } catch (e) {
      toast(friendlyError(e));
    }
    setBusy(false);
  }

  async function submitReset() {
    if (!resetEmail) {
      toast("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (e) {
      toast(friendlyError(e));
    }
    setBusy(false);
  }

  if (tab === "reset") {
    return (
      <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <button className="modal-close" onClick={onClose}>✕</button>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Reset your password</h2>
          {resetSent ? (
            <>
              <p style={{ fontSize: 13.5, color: "#4a473c", marginTop: 14, lineHeight: 1.5 }}>
                If an account exists for <strong>{resetEmail}</strong>, a password reset link has been
                sent — check your inbox (and spam folder) and follow the link to set a new password.
              </p>
              <button className="btn btn-green btn-block" style={{ marginTop: 20 }} onClick={() => setTab("login")}>
                Back to log in
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "#877f6b", marginTop: 6 }}>
                Enter your email and we'll send a link to set a new password.
              </p>
              <label>Email</label>
              <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <button className="btn btn-green btn-block" style={{ marginTop: 20 }} disabled={busy} onClick={submitReset}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
              <button
                className="btn btn-outline btn-block"
                style={{ marginTop: 10 }}
                onClick={() => setTab("login")}
              >
                Back to log in
              </button>
            </>
          )}
        </div>
      </div>
    );
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
          </>
        )}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {tab === "login" && (
          <button
            type="button"
            onClick={() => {
              setResetEmail(email);
              setResetSent(false);
              setTab("reset");
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              marginTop: 10,
              fontSize: 12.5,
              color: "#0B6B4A",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Forgot password?
          </button>
        )}

        <button className="btn btn-green btn-block" style={{ marginTop: 20 }} disabled={busy} onClick={submit}>
          {busy ? "…" : tab === "login" ? "Log in" : "Create account"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "16px 0 4px",
            fontSize: 12,
            color: "#877f6b",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#d9d4c4" }} />
          or
          <div style={{ flex: 1, height: 1, background: "#d9d4c4" }} />
        </div>

        <button
          type="button"
          className="btn btn-outline btn-block"
          style={{ marginTop: 10 }}
          disabled={busy}
          onClick={googleSignIn}
        >
          Continue with Google
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
  if (code.includes("invalid-email")) return "That doesn't look like a valid email.";
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request"))
    return "Google sign-in was cancelled.";
  if (code.includes("popup-blocked")) return "Your browser blocked the Google popup — allow popups and try again.";
  if (code.includes("unauthorized-domain"))
    return "This site isn't authorized for Google sign-in yet — add it in Firebase Authorized domains.";
  if (code.includes("operation-not-allowed")) return "Google sign-in isn't turned on in Firebase yet.";
  if (code.includes("account-exists-with-different-credential"))
    return "That email already has an account — log in with your password instead.";
  return "Something went wrong — try again.";
}
