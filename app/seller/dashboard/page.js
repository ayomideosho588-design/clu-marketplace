"use client";
import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/app/components/Toast";
import {
  CATEGORIES,
  COMMISSION_RATE,
  resizeImageFile,
  uploadImage,
  addProduct,
  deleteProduct,
  listenProducts,
  listenOrders,
  updateOrderStatus,
  pushNotification,
} from "@/lib/data";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const u1 = listenProducts(setProducts);
    const u2 = listenOrders(setOrders);
    return () => {
      u1();
      u2();
    };
  }, []);

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

  async function handleStatusChange(order, status) {
    await updateOrderStatus(order.id, status);
    const msgs = {
      confirmed: `Your order for "${order.productTitle}" was confirmed by ${order.sellerBusiness}.`,
      shipped: `"${order.productTitle}" is on its way from ${order.sellerBusiness}.`,
      completed: `Order for "${order.productTitle}" marked complete. Enjoy!`,
      cancelled: `Your order for "${order.productTitle}" was cancelled by ${order.sellerBusiness}.`,
    };
    if (msgs[status]) await pushNotification(order.buyerUid, "status", msgs[status]);
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
          myProducts.map((p) => (
            <div className="mylist-card" key={p.id}>
              <img src={p.imageUrl || ""} onError={(e) => (e.target.style.visibility = "hidden")} alt="" />
              <div className="info">
                <h4>{p.title}</h4>
                <div className="p">{money(p.price)} · {p.category}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => confirm("Remove this listing?") && deleteProduct(p.id)}>
                Remove
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state"><h3>No listings yet</h3><p>Add your first product to start selling.</p></div>
        )}

        <div className="section-head"><h2 style={{ fontSize: 18 }}>Orders received</h2></div>
        {myOrders.length ? (
          <table>
            <thead>
              <tr><th>Order</th><th>Buyer</th><th>Total</th><th>Status</th><th>Update</th></tr>
            </thead>
            <tbody>
              {myOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.productTitle} ×{o.qty}</td>
                  <td>{o.buyerName}</td>
                  <td className="mono">{money(o.total)}</td>
                  <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                  <td>{orderActions(o, handleStatusChange)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state"><h3>No orders yet</h3><p>Once a buyer orders from you, it'll show here.</p></div>
        )}
      </div>
      <Footer />
      {modalOpen && <AddProductModal onClose={() => setModalOpen(false)} sellerUid={user.uid} businessName={profile.business.name} />}
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
    return <button className="btn btn-sm btn-green" onClick={() => onChange(o, "shipped")}>Mark shipped</button>;
  if (o.status === "shipped")
    return <button className="btn btn-sm btn-green" onClick={() => onChange(o, "completed")}>Mark complete</button>;
  return "—";
}

function AddProductModal({ onClose, sellerUid, businessName }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("20");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await resizeImageFile(file, 800, 0.72);
    setImagePreview(dataUrl);
    setImageData(dataUrl);
    toast("Photo attached.");
  }

  async function submit() {
    if (!title || !price) {
      toast("Add at least a title and price.");
      return;
    }
    setBusy(true);
    try {
      let imageUrl = null;
      if (imageData) {
        imageUrl = await uploadImage(`products/${sellerUid}/${Date.now()}.jpg`, imageData);
      }
      await addProduct({
        sellerUid,
        businessName,
        title,
        category,
        price: Number(price),
        stock: Number(stock) || 99,
        description,
        imageUrl,
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
        <input type="number" min="1" value={stock} onChange={(e) => setStock(e.target.value)} />
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <label>Photo</label>
        <div className="upload-box">
          {imagePreview && <img src={imagePreview} alt="preview" />}
          <span>{imagePreview ? "Tap to change photo" : "Tap to upload a product photo"}</span>
          <input type="file" accept="image/*" onChange={handleImage} />
        </div>
        <button className="btn btn-gold btn-block" style={{ marginTop: 20 }} disabled={busy} onClick={submit}>
          {busy ? "Publishing…" : "Publish listing"}
        </button>
      </div>
    </div>
  );
      }
