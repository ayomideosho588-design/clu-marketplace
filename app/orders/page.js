"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { listenOrders } from "@/lib/data";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const router = useRouter();

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

  return (
    <>
      <Header />
      <div className="wrap">
        <div className="dash-header"><h2 style={{ fontSize: 24 }}>My orders</h2></div>
        {myOrders.length ? (
          myOrders.map((o) => (
            <div className="mylist-card" key={o.id}>
              <img src={o.productImage || ""} onError={(e) => (e.target.style.visibility = "hidden")} alt="" />
              <div className="info">
                <h4>{o.productTitle} ×{o.qty}</h4>
                <div className="p">{money(o.total)} · from {o.sellerBusiness}</div>
              </div>
              <span className={`status-badge status-${o.status}`}>{o.status}</span>
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
