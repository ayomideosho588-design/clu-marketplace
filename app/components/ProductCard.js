"use client";
import { useRouter } from "next/navigation";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function ProductCard({ product }) {
  const router = useRouter();
  return (
    <div className="card" onClick={() => router.push(`/product/${product.id}`)}>
      <div className="card-img">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.title} /> : <div className="ph">no image yet</div>}
        <div className="price-tag">{money(product.price)}</div>
      </div>
      <div className="card-body">
        <h4>{product.title}</h4>
        <div className="seller">{product.businessName}</div>
        <span className="cat">{product.category}</span>
      </div>
    </div>
  );
  }
