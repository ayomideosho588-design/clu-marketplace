"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useToast } from "@/app/components/Toast";
import { listenOrders, COMMISSION_RATE } from "@/lib/data";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [orders, setOrders] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const unsub = listenOrders(setOrders);
    return () => unsub();
  }, []);

  function unlock() {
    if (passcode === process.env.NEXT_PUBLIC_ADMIN_PASSCODE) setUnlocked(true);
    else toast("Wrong passcode.");
  }

  const bySeller = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      map[o.sellerUid] = map[o.sellerUid] || { name: o.sellerBusiness, revenue: 0, commission: 0, count: 0 };
      map[o.sellerUid].revenue += o.total;
      map[o.sellerUid].commission += o.commission;
      map[o.sellerUid].count += 1;
    });
    return map;
  }, [orders]);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCommission = orders.reduce((s, o) => s + o.commission, 0);

  if (!unlocked) {
    return (
      <>
        <Header />
        <div className="wrap" style={{ maxWidth: 420 }}>
          <div className="dash-header"><h2 style={{ fontSize: 22 }}>Owner ledger</h2></div>
          <p style={{ fontSize: 13, color: "#877f6b" }}>
            This tracks platform commission across every order. Enter the owner passcode to view it.
          </p>
          <label>Passcode</label>
          <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
          <button className="btn btn-green btn-block" style={{ marginTop: 16 }} onClick={unlock}>Unlock</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="wrap">
        <div className="dash-header"><h2 style={{ fontSize: 24 }}>Owner ledger</h2></div>
        <p style={{ fontSize: 12.5, color: "#877f6b", maxWidth: 560 }}>
          This is a tracked commission ledger, not a live payment account — no money actually moves here.
          Pair it with a real payment processor (e.g. Paystack/Flutterwave) when you're ready to collect for real.
        </p>
        <div className="stat-row">
          <div className="stat-card"><div className="v">{orders.length}</div><div className="l">Total orders</div></div>
          <div className="stat-card"><div className="v">{money(totalRevenue)}</div><div className="l">Gross marketplace revenue</div></div>
          <div className="stat-card"><div className="v">{money(totalCommission)}</div><div className="l">Commission owed to you ({(COMMISSION_RATE * 100) | 0}%)</div></div>
        </div>
        <div className="section-head"><h2 style={{ fontSize: 18 }}>By seller</h2></div>
        {Object.keys(bySeller).length ? (
          <table>
            <thead><tr><th>Business</th><th>Orders</th><th>Revenue</th><th>Commission</th></tr></thead>
            <tbody>
              {Object.values(bySeller).map((s, i) => (
                <tr key={i}>
                  <td>{s.name}</td>
                  <td>{s.count}</td>
                  <td className="mono">{money(s.revenue)}</td>
                  <td className="mono">{money(s.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state"><h3>No orders yet</h3></div>
        )}
      </div>
      <Footer />
    </>
  );
                                              }
