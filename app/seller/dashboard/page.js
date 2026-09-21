"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/app/components/Toast";
import {
  CATEGORIES,
  COMMISSION_RATE,
  MAX_PRODUCT_IMAGES,
  resizeImageFile,
  addProduct,
  deleteProduct,
  listenProducts,
  listenOrders,
  updateOrderStatus,
  pushNotification,
} from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { ensureChat } from "@/lib/chat";
import { listenReviewsForSeller, ratingSummary } from "@/lib/reviews";
import Stars from "@/app/components/Stars";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const u1 = listenProducts(setProducts);
    const u2 = listenOrders(setOrders);
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = listenReviewsForSeller(user.uid, setReviews);
    return () => unsub();
  }, [user]);

  if (!user || !profile) {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="empty-state"><h3>Log in first</h3></div>
        </div>
        <Footer />
      </>
    );
  }
  if (!profile.isSeller) {
    return (
      <>
        <Header />
        <div className="wrap">
          <div className="empty-state">
            <h3>You're not a seller yet</h3>
            <p>Open your stall first from "Become a Seller".</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const myProducts = products.filter((p) => p.sellerUid === user.uid);
  const myOrders = orders.filter((o) => o.sellerUid === user.uid);
  const revenue = myOrders.reduce((s, o) => s + o.total, 0);
  const commissionOwed = myOrders.reduce((s, o) => s + o.commission, 0);
  const { avg, count } = ratingSummary(reviews);

  async function handleStatusChange(order, status) {
    await updateOrderStatus(order.id, status);
    const msgs = {
      confirmed: `Your order for "${order.productTitle}" was confirmed by ${order.sellerBusiness}.`,
      completed: `Order for "${order.productTitle}" marked complete. Enjoy!`,
      cancelled: `Your order for "${order.productTitle}" was cancelled by ${order.sellerBusiness}.`,
    };
    const subjects = {
      confirmed: "Order confirmed",
      completed: "Order completed",
      cancelled: "Order cancelled",
    };
    if (msgs[status]) {
      await pushNotification(order.buyerUid, "status", msgs[status]);
      sendEmail(order.buyerEmail, order.buyerName, subjects[status], msgs[status]);
    }
  }

  async function handleMessage(order) {
    try {
      const chatId = await ensureChat(
        user.uid,
        profile.business.name,
        profile.email || user.email,
        order.buyerUid,
        order.buyerName,
        order.buyerEmail
      );
      router.push(`/messages/${chatId}`);
    } catch (e) {
      toast("Something went wrong — try again.");
    }
  }

  return (
    <>
      <Header />
      <div className="wrap">
        <div className="dash-header">
          <div>
            <h2 style={{ fontSize: 24 }}>{profile.business.name}</h2>
            <p style={{ fontSize: 13, color: "#877f6b", marginTop: 4 }}>
              {profile.business.category} · Seller dashboard
            </p>
            {count > 0 ? (
              <div style={{ marginTop: 6 }}>
                <Stars value={avg} count={count} size={14} />
              </div>
            ) : (
              <p style={{ fontSize: 11.5, color: "#877f6b", marginTop: 6 }}>No reviews yet</p>
            )}
          </div>
          <button className="btn btn-green" onClick={() => setModalOpen(true)}>+ New listing</button>
        </div>

        <div className="stat-row">
          <div className="stat-card"><div className="v">{myProducts.length}</div><div className="l">Listings</div></div>
          <div className="stat-card"><div className="v">{myOrders.length}</div><div className="l">Orders received</div></div>
          <div className="stat-card"><div className="v">{money(revenue)}</div><div className="l">Gross revenue</div></div>
          <div className="stat-card"><div className="v">{money(commissionOwed)}</div><div className="l">Platform commission ({(COMMISSION_RATE * 100) | 0}%)</div></div>
        </div>

        <div className="section-head"><h2 style={{ fontSize: 18 }}>My listings</h2></div>
        {myProducts.length ? (
          myProducts.map((p) => {
            const thumb = p.images?.length ? p.images[0] : p.imageUrl;
            return (
              <div className="mylist-card" key={p.id}>
                <img src={thumb || ""} onError={(e) => (e.target.style.visibility = "hidden")} alt="" />
                <div className="info">
                  <h4>{p.title}</h4>
                  <div className="p">{money(p.price)} · {p.category} · stock: {p.stock ?? "—"}</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => confirm("Remove this listing?") && deleteProduct(p.id)}>
                  Remove
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-state"><h3>No listings yet</h3><p>Add your first product to start selling.</p></div>
        )}

        <div className="section-head"><h2 style={{ fontSize: 18 }}>Orders received</h2></div>
               {myOrders.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Order</th><th>Buyer</th><th>Total</th><th>Status</th><th>Update</th><th></th></tr>
              </thead>
              <tbody>
                {myOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.productTitle} ×{o.qty}</td>
                    <td>{o.buyerName}</td>
                    <td className="mono">{money(o.total)}</td>
                    <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                    <td>{orderActions(o, handleStatusChange)}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => handleMessage(o)}>Message buyer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><h3>No orders yet</h3><p>Once a buyer orders from you, it'll show here.</p></div>
        )}
      </div>
      <Footer />
      {modalOpen && (
        <AddProductModal
          onClose={() => setModalOpen(false)}
          sellerUid={user.uid}
          businessName={profile.business.name}
          sellerEmail={profile.email}
        />
      )}
    </>
  );
}

function orderActions(o, onChange) {
  if (o.status === "pending")
    return (
      <>
        <button className="btn btn-sm btn-green" onClick={() => onChange(o, "confirmed")}>Confirm</button>{" "}
        <button className="btn btn-sm btn-outline" onClick={() => onChange(o, "cancelled")}>Cancel</button>
      </>
    );
  if (o.status === "confirmed")
    return <button className="btn btn-sm btn-green" onClick={() => onChange(o, "completed")}>Mark complete</button>;
  return "—";
}

function AddProductModal({ onClose, sellerUid, businessName, sellerEmail }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("20");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function handleAddImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= MAX_PRODUCT_IMAGES) {
      toast(`You can add up to ${MAX_PRODUCT_IMAGES} photos.`);
      return;
    }
    const dataUrl = await resizeImageFile(file, 700, 0.65);
    setImages((prev) => [...prev, dataUrl]);
    e.target.value = "";
  }

  function removeImage(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (!title || !price) {
      toast("Add at least a title and price.");
      return;
    }
    setBusy(true);
    try {
      await addProduct({
        sellerUid,
        businessName,
        sellerEmail: sellerEmail || null,
        title,
        category,
        price: Number(price),
        stock: Number(stock) || 99,
        description,
        images: images.length ? images : null,
        imageUrl: images[0] || null,
      });
      toast("Listing published: " + title);
      onClose();
    } catch (e) {
      toast("Something went wrong — try again.");
    }
    setBusy(false);
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 20 }}>New listing</h2>
        <label>Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Jollof rice + chicken (1 plate)" />
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label>Price (₦)</label>
        <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        <label>Stock / quantity available</label>
        <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <label>Photos (up to {MAX_PRODUCT_IMAGES})</label>
        <div className="photo-grid">
          {images.map((src, i) => (
            <div className="photo-thumb" key={i}>
              <img src={src} alt="" />
              <button type="button" onClick={() => removeImage(i)}>✕</button>
            </div>
          ))}
          {images.length < MAX_PRODUCT_IMAGES && (
            <label className="photo-add">
              +
              <input type="file" accept="image/*" onChange={handleAddImage} />
            </label>
          )}
        </div>
        <button className="btn btn-gold btn-block" style={{ marginTop: 20 }} disabled={busy} onClick={submit}>
          {busy ? "Publishing…" : "Publish listing"}
        </button>
      </div>
    </div>
  );
}
