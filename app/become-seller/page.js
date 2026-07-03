"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "../components/Toast";
import { CATEGORIES, resizeImageFile, uploadImage } from "@/lib/data";

export default function BecomeSellerPage() {
  const { user, profile, becomeSeller } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImageFile(file, 700, 0.7);
    setImagePreview(dataUrl);
    setImageData(dataUrl);
  }

  async function submit() {
    if (!name || !description) {
      toast("Give your stall a name and short description.");
      return;
    }
    setBusy(true);
    try {
      let imageUrl = null;
      if (imageData) {
        imageUrl = await uploadImage(`business/${user.uid}.jpg`, imageData);
      }
      await becomeSeller({ name, category, description, imageUrl });
      toast("You're a seller now! Add your first listing.");
      router.push("/seller/dashboard");
    } catch (e) {
      toast("Something went wrong — try again.");
    }
    setBusy(false);
  }

  if (!user) {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="empty-state">
            <h3>Log in first</h3>
            <p>Create a buyer account, then come back here to open a stall.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (profile?.isSeller) {
    router.push("/seller/dashboard");
    return null;
  }

  return (
    <>
      <Header />
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="dash-header">
          <h2 style={{ fontSize: 24 }}>Open your stall</h2>
        </div>
        <p style={{ fontSize: 13.5, color: "#4a473c" }}>
          This turns your buyer account into a seller account too. Fill in your business details below.
        </p>
        <label>Business name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ada's Kitchen" />
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label>What do you sell? (short description)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell buyers what your stall is about" />
        <label>Business image</label>
        <div className="upload-box">
          {imagePreview && <img src={imagePreview} alt="preview" />}
          <span>{imagePreview ? "Tap to change photo" : "Tap to upload a photo of your business/products"}</span>
          <input type="file" accept="image/*" onChange={handleImage} />
        </div>
        <button className="btn btn-gold btn-block" style={{ marginTop: 22 }} disabled={busy} onClick={submit}>
          {busy ? "Opening…" : "Open my stall"}
        </button>
      </div>
      <Footer />
    </>
  );
      }
