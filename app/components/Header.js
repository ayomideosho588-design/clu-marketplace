"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";
import NotifBell from "./NotifBell";

function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("clu-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("clu-theme", "light");
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

export default function Header({ search, onSearch }) {
  const { user, profile, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const router = useRouter();
  const pathname = usePathname();

  function openAuth(tab) {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <div className="logo" onClick={() => router.push("/")}>
            <div className="logo-badge">CLU</div>
            <div className="logo-text">
              Chrisland Marketplace
              <span>Buy &amp; sell on campus</span>
            </div>
          </div>
          {onSearch && (
            <div className="search-bar">
              <span>🔎</span>
              <input
                placeholder="Search listings, e.g. jollof, textbooks, hair..."
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
          <div className="nav-actions">
            <ThemeToggle />
            {user && profile ? (
              <>
                <NotifBell />
                <button className="nav-btn" onClick={logout}>Log out</button>
                <button
                  className="user-chip"
                  onClick={() => router.push("/profile")}
                  title="Your profile"
                >
                  <div className="av">
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "999px" }}
                      />
                    ) : (
                      initials(profile.name)
                    )}
                  </div>
                  <span className="name-label">{profile.name.split(" ")[0]}</span>
                </button>
              </>
            ) : (
              <>
                <button className="nav-btn" onClick={() => openAuth("login")}>Log in</button>
                <button className="nav-btn primary" onClick={() => openAuth("signup")}>Sign up</button>
              </>
            )}
          </div>
        </div>
        <div className="subnav">
          <div className="subnav-inner">
            <button className={pathname === "/" ? "active" : ""} onClick={() => router.push("/")}>Market</button>
            <button className={pathname === "/orders" ? "active" : ""} onClick={() => (user ? router.push("/orders") : openAuth("login"))}>
              {user ? "My Orders" : "Orders (log in)"}
            </button>
            <button
              className={pathname.startsWith("/messages") ? "active" : ""}
              onClick={() => (user ? router.push("/messages") : openAuth("login"))}
            >
              {user ? "Messages" : "Messages (log in)"}
            </button>
            <button
              className={pathname.startsWith("/seller") || pathname === "/become-seller" ? "active" : ""}
              onClick={() => (user ? router.push(profile?.isSeller ? "/seller/dashboard" : "/become-seller") : openAuth("login"))}
            >
              {profile?.isSeller ? "Sell" : "Become a Seller"}
            </button>
            <button
              className={pathname === "/profile" ? "active" : ""}
              onClick={() => (user ? router.push("/profile") : openAuth("login"))}
            >
              {user ? "Profile" : "Profile (log in)"}
            </button>
            <button className={pathname === "/admin" ? "active" : ""} onClick={() => router.push("/admin")}>
              Owner ledger
            </button>
          </div>
        </div>
      </header>
      {authOpen && <AuthModal initialTab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  );
}
