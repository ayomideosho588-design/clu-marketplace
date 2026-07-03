"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/app/components/Toast";
import { COMMISSION_RATE, placeOrder, pushNotification } from "@/lib/data";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "products", id));
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
      setLoading(false);
    })();
  }, [id]);

  async function handleOrder() {
    if (!user || !profile) {
      toast("Log in to order.");
      return;
    }
    setBusy(true);
    try {
      const total = product.price * qty;
      const commission = Math.round(total * COMMISSION_RATE);
      const order = {
        productId: product.id,
        productTitle: product.title,
        productImage: product.imageUrl || null,
        price: product.price,
        qty,
        total,
        commission,
        buyerUid: user.uid,
        buyerName: profile.name,
        sellerUid: product.sellerUid,
        sellerBusiness: product.businessName,
        status: "pending",
      };
      await placeOrder(order);
      await pushNotification(
        user.uid,
        "order",
        `Order placed for "${product.title}" — ${money(total)}. We'll remind you here as ${product.businessName} updates it.`
      );
      await pushNotification(
        product.sellerUid,
        "order",
        `New order! ${profile.name} wants ${qty} × "${product.title}" — ${money(total)}.`
      );
      toast("Order placed! Check your notifications for updates.");
      router.push("/orders");
    } catch (e) {
      toast("Something went wrong — try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <Header />
      <div className="wrap" style={{ paddingTop: 30, paddingBottom: 40 }}>
        {loading ? (
          <div className="empty-state"><span className="spinner"></span></div>
        ) : !product ? (
          <div className="empty-state"><h3>Listing not found</h3></div>
        ) : (
          <div className="pd-grid">
            <div className="pd-img">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.title} /> : <div className="ph">No image</div>}
            </div>
            <div>
              <span className="cat">{product.category}</span>
              <h2 style={{ marginTop: 10, fontSize: 24 }}>{product.title}</h2>
              <div className="pd-price">{money(product.price)}</div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "#4a473c" }}>{product.description}</p>
              <div className="seller-strip">
                <div className="av">{product.businessName?.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{product.businessName}</div>
                  <div style={{ fontSize: 11.5, color: "#877f6b" }}>Campus seller</div>
                </div>
              </div>
              {user ? (
                <>
                  <div className="qty-row">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}>–</button>
                    <span className="mono" style={{ fontWeight: 700 }}>{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)}>+</button>
                    <span style={{ fontSize: 12, color: "#877f6b" }}>in stock: {product.stock}</span>
                  </div>
                  <button className="btn btn-gold btn-block" disabled={busy} onClick={handleOrder}>
                    {busy ? "Placing…" : `Place order — ${money(product.price * qty)}`}
                  </button>
                </>
              ) : (
                <button className="btn btn-green btn-block" onClick={() => toast("Log in from the top bar to order.")}>
                  Log in to order
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
