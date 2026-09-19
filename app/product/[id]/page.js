"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/app/components/Toast";
import { COMMISSION_RATE, placeOrder, pushNotification, decrementStock } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { ensureChat } from "@/lib/chat";
import { listenReviewsForSeller, ratingSummary } from "@/lib/reviews";
import Stars from "@/app/components/Stars";

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
  const [messaging, setMessaging] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "products", id));
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!product?.sellerUid) return;
    const unsub = listenReviewsForSeller(product.sellerUid, setReviews);
    return () => unsub();
  }, [product?.sellerUid]);

  const gallery = product?.images?.length ? product.images : product?.imageUrl ? [product.imageUrl] : [];
  const stock = typeof product?.stock === "number" ? product.stock : 99;
  const outOfStock = stock <= 0;
  const { avg, count } = ratingSummary(reviews);

  async function handleOrder() {
    if (!user || !profile) {
      toast("Log in to order.");
      return;
    }
    if (outOfStock) {
      toast("This item is out of stock.");
      return;
    }
    setBusy(true);
    try {
      const total = product.price * qty;
      const commission = Math.round(total * COMMISSION_RATE);
      const order = {
        productId: product.id,
        productTitle: product.title,
        productImage: gallery[0] || null,
        price: product.price,
        qty,
        total,
        commission,
        buyerUid: user.uid,
        buyerName: profile.name,
        buyerEmail: profile.email || user.email || null,
        sellerUid: product.sellerUid,
        sellerBusiness: product.businessName,
        sellerEmail: product.sellerEmail || null,
        status: "pending",
        reviewed: false,
      };
      await placeOrder(order);
      await decrementStock(product.id, qty);

      const buyerMsg = `Order placed for "${product.title}" — ${money(total)}. We'll remind you here as ${product.businessName} updates it.`;
      const sellerMsg = `New order! ${profile.name} wants ${qty} × "${product.title}" — ${money(total)}.`;

      await pushNotification(user.uid, "order", buyerMsg);
      await pushNotification(product.sellerUid, "order", sellerMsg);

      sendEmail(order.buyerEmail, profile.name, "Order placed", buyerMsg);
      sendEmail(order.sellerEmail, product.businessName, "New order received", sellerMsg);

      toast("Order placed! Check your notifications for updates.");
      router.push("/orders");
    } catch (e) {
      toast("Something went wrong — try again.");
    }
    setBusy(false);
  }

  async function handleMessageSeller() {
    if (!user || !profile) {
      toast("Log in to message the seller.");
      return;
    }
    if (user.uid === product.sellerUid) {
      toast("This is your own listing.");
      return;
    }
    setMessaging(true);
    try {
      const chatId = await ensureChat(
        user.uid,
        profile.name,
        profile.email || user.email,
        product.sellerUid,
        product.businessName,
        product.sellerEmail
      );
      router.push(`/messages/${chatId}`);
    } catch (e) {
      toast("Something went wrong — try again.");
    }
    setMessaging(false);
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
            <div>
              <div className="pd-img">
                {gallery.length ? <img src={gallery[activeImg]} alt={product.title} /> : <div className="ph">No image</div>}
              </div>
              {gallery.length > 1 && (
                <div className="pd-thumbs">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      className={`pd-thumb ${i === activeImg ? "active" : ""}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
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
                  {count > 0 ? (
                    <Stars value={avg} count={count} size={13} />
                  ) : (
                    <div style={{ fontSize: 11.5, color: "#877f6b" }}>No reviews yet</div>
                  )}
                </div>
              </div>
              {user && (
                <button
                  className="btn btn-outline btn-block"
                  style={{ marginBottom: 10 }}
                  disabled={messaging}
                  onClick={handleMessageSeller}
                >
                  {messaging ? "…" : "Message seller"}
                </button>
              )}
              {user ? (
                outOfStock ? (
                  <button className="btn btn-outline btn-block" disabled>
                    Out of stock
                  </button>
                ) : (
                  <>
                    <div className="qty-row">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))}>–</button>
                      <span className="mono" style={{ fontWeight: 700 }}>{qty}</span>
                      <button onClick={() => setQty((q) => Math.min(stock, q + 1))}>+</button>
                      <span style={{ fontSize: 12, color: "#877f6b" }}>in stock: {stock}</span>
                    </div>
                    <button className="btn btn-gold btn-block" disabled={busy} onClick={handleOrder}>
                      {busy ? "Placing…" : `Place order — ${money(product.price * qty)}`}
                    </button>
                  </>
                )
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
