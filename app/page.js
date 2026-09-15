"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { listenProducts, CATEGORIES } from "@/lib/data";
import { useAuth } from "@/lib/AuthContext";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { profile } = useAuth();

  useEffect(() => {
    const unsub = listenProducts((list) => {
      setProducts(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const haystack = [p.title, p.description, p.businessName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchSearch = !q || haystack.includes(q);
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  return (
    <>
      <Header search={search} onSearch={setSearch} />
      <div style={{ flex: 1 }}>
        <div className="hero">
          <div className="hero-inner">
            <h1>
              Everything Chrislandites sell, <span className="accent">in one campus market.</span>
            </h1>
            <p>
              List your business, sell to real students, and get in-app reminders the moment an
              order moves — no more chasing buyers on WhatsApp.
            </p>
          </div>
        </div>

        <div className="wrap">
          <div className="chips">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="section-head">
            <h2>{category === "All" ? "All listings" : category}</h2>
            <span className="mono" style={{ fontSize: 12, color: "#877f6b" }}>
              {loading ? "loading…" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <span className="spinner"></span>
            </div>
          ) : filtered.length ? (
            <div className="grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Nothing here yet</h3>
              <p>Be the first to list something in this category.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
