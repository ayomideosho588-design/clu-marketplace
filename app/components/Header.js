"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";
import NotifBell from "./NotifBell";

function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
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
            {user && profile ? (
              <>
                <NotifBell />
                <button
                  className="user-chip"
                  onClick={() => router.push(profile.isSeller ? "/seller/dashboard" : "/become-seller")}
                  title={profile.isSeller ? "Seller dashboard" : "Become a seller"}
                >
                  <div className="av">{initials(profile.name)}</div>
                  {profile.name.split(" ")[0]}
                </button>
                <button className="nav-btn" onClick={logout}>Log out</button>
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
              className={pathname.startsWith("/seller") || pathname === "/become-seller" ? "active" : ""}
              onClick={() => (user ? router.push(profile?.isSeller ? "/seller/dashboard" : "/become-seller") : openAuth("login"))}
            >
              {profile?.isSeller ? "Sell" : "Become a Seller"}
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
