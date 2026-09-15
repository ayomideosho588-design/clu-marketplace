"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/app/components/Toast";
import { resizeImageFile } from "@/lib/data";

export default function ProfilePage() {
  const { user, profile, updateProfileInfo, deleteAccount, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(profile?.name || "");
  const [matric, setMatric] = useState(profile?.matric || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [photoPreview, setPhotoPreview] = useState(profile?.photoUrl || null);
  const [photoData, setPhotoData] = useState(null);
  const [busy, setBusy] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  if (!user || !profile) {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="empty-state"><h3>Log in to see your profile</h3></div>
        </div>
        <Footer />
      </>
    );
  }

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImageFile(file, 400, 0.6);
    setPhotoPreview(dataUrl);
    setPhotoData(dataUrl);
  }

  async function saveProfile() {
    if (!name.trim()) {
      toast("Name can't be empty.");
      return;
    }
    setBusy(true);
    try {
      const fields = { name: name.trim(), matric: matric.trim(), phone: phone.trim() };
      if (photoData) fields.photoUrl = photoData;
      await updateProfileInfo(fields);
      toast("Profile updated.");
    } catch (e) {
      toast("Something went wrong — try again.");
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!deletePassword) {
      toast("Enter your password to confirm.");
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePassword);
      toast("Account deleted.");
      router.push("/");
    } catch (e) {
      const code = e?.code || "";
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        toast("That password doesn't match.");
      } else {
        toast("Something went wrong — try again.");
      }
    }
    setDeleteBusy(false);
  }

  return (
    <>
      <Header />
      <div className="wrap" style={{ maxWidth: 640, paddingBottom: 60 }}>
        <div className="dash-header">
          <h2 style={{ fontSize: 24 }}>Your profile</h2>
        </div>

        <label>Profile photo</label>
        <div className="upload-box">
          {photoPreview && (
            <img
              src={photoPreview}
              alt="preview"
              style={{ borderRadius: "999px", width: 96, height: 96, objectFit: "cover" }}
            />
          )}
          <span>{photoPreview ? "Tap to change photo" : "Tap to add a profile photo"}</span>
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </div>

        <label>Full name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />

        <label>Matric number</label>
        <input type="text" value={matric} onChange={(e) => setMatric(e.target.value)} placeholder="NSC/2025/048" />

        <label>Phone number</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803 000 0000" />

        <label>Email</label>
        <input type="email" value={profile.email || ""} disabled style={{ opacity: 0.6 }} />
        <p style={{ fontSize: 11.5, color: "#877f6b", marginTop: 4 }}>
          Email is tied to your login and can't be changed here.
        </p>

        <button className="btn btn-green btn-block" style={{ marginTop: 22 }} disabled={busy} onClick={saveProfile}>
          {busy ? "Saving…" : "Save profile"}
        </button>

        <div className="section-head"><h2 style={{ fontSize: 18 }}>Selling on CLU Marketplace</h2></div>
        {profile.isSeller ? (
          <div className="mylist-card" style={{ alignItems: "center" }}>
            <div className="av" style={{ width: 48, height: 48, borderRadius: 8, background: "var(--paper-dim)", overflow: "hidden", flexShrink: 0 }}>
              {profile.business?.image ? (
                <img src={profile.business.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
            </div>
            <div className="info">
              <h4>{profile.business?.name}</h4>
              <div className="p" style={{ color: "#877f6b" }}>{profile.business?.category}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => router.push("/seller/dashboard")}>
              Manage stall
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <h3>You're not selling yet</h3>
            <p>Open a stall to list products and start receiving orders.</p>
            <button className="btn btn-gold" style={{ marginTop: 12 }} onClick={() => router.push("/become-seller")}>
              Become a seller
            </button>
          </div>
        )}

        <div className="section-head"><h2 style={{ fontSize: 18, color: "var(--red)" }}>Danger zone</h2></div>
        <div className="empty-state" style={{ border: "1.5px solid var(--red)", borderRadius: 10, padding: 20 }}>
          <h3>Delete account</h3>
          <p>This permanently deletes your account, your profile, and your listings if you're a seller. This can't be undone.</p>
          <button className="btn btn-red" style={{ marginTop: 12 }} onClick={() => setDeleteOpen(true)}>
            Delete my account
          </button>
        </div>
      </div>
      <Footer />

      {deleteOpen && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setDeleteOpen(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setDeleteOpen(false)}>✕</button>
            <h2 style={{ fontSize: 20 }}>Confirm account deletion</h2>
            <p style={{ fontSize: 13.5, color: "#4a473c", marginTop: 10, lineHeight: 1.5 }}>
              Enter your password to confirm. Your account, profile, and any listings will be
              permanently removed.
            </p>
            <label>Password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <button className="btn btn-red btn-block" style={{ marginTop: 20 }} disabled={deleteBusy} onClick={handleDelete}>
              {deleteBusy ? "Deleting…" : "Permanently delete my account"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
