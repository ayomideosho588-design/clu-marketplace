"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/app/components/Toast";
import { listenOrders, updateOrderStatus, pushNotification } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { ensureChat } from "@/lib/chat";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function OrdersPage() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const unsub = listenOrders(setOrders);
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <>
        <Header />
        <div className="wrap"><div className="empty-state"><h3>Log in to see your orders</h3></div></div>
        <Footer />
      </>
    );
  }

  const myOrders = orders.filter((o) => o.buyerUid === user.uid);

  async function handleCancel(order) {
    if (!confirm("Cancel this order?")) return;
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, "cancelled");
      const msg = `${order.buyerName} cancelled their order for "${order.productTitle}".`;
      await pushNotification(order.sellerUid, "status", msg);
      sendEmail(order.sellerEmail, order.sellerBusiness, "Order cancelled", msg);
      toast("Order cancelled.");
    } catch (e) {
      toast("Something went wrong — try again.");
    }
    setBusyId(null);
  }

    async function handleMessage(order) {
    if (!profile) return;
    try {
      const chatId = await ensureChat(
        user.uid,
        profile.name,
        profile.email || user.email,
        order.sellerUid,
        order.sellerBusiness,
        order.sellerEmail
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
        <div className="dash-header"><h2 style={{ fontSize: 24 }}>My orders</h2></div>
        {myOrders.length ? (
          myOrders.map((o) => (
            <div className="mylist-card" key={o.id} style={{ flexWrap: "wrap" }}>
              <img src={o.productImage || ""} onError={(e) => (e.target.style.visibility = "hidden")} alt="" />
              <div className="info">
                <h4>{o.productTitle} ×{o.qty}</h4>
                <div className="p">{money(o.total)} · from {o.sellerBusiness}</div>
              </div>
              <span className={`status-badge status-${o.status}`}>{o.status}</span>
              <button className="btn btn-outline btn-sm" style={{ marginLeft: 10 }} onClick={() => handleMessage(o)}>
                Message seller
              </button>
              {o.status === "pending" && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginLeft: 6 }}
                  disabled={busyId === o.id}
                  onClick={() => handleCancel(o)}
                >
                  {busyId === o.id ? "…" : "Cancel"}
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No orders yet</h3>
            <p>Browse the market and place your first order.</p>
            <button className="btn btn-green" style={{ marginTop: 12 }} onClick={() => router.push("/")}>Go to market</button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
