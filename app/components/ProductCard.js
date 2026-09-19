"use client";
import { useRouter } from "next/navigation";

function money(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export default function ProductCard({ product }) {
  const router = useRouter();
  const thumb = product.images?.length ? product.images[0] : product.imageUrl;
  return (
    <div className="card" onClick={() => router.push(`/product/${product.id}`)}>
      <div className="card-img">
        {thumb ? <img src={thumb} alt={product.title} /> : <div className="ph">no image yet</div>}
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
