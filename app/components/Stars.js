"use client";

export default function Stars({ value, count, size = 14, showNumber = true }) {
  const rounded = Math.round(value * 2) / 2; // nearest half star
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ display: "flex", fontSize: size, lineHeight: 1, color: "var(--gold)" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} style={{ opacity: n <= rounded ? 1 : 0.28 }}>★</span>
        ))}
      </div>
      {showNumber && (
        <span className="mono" style={{ fontSize: size - 1, color: "#877f6b" }}>
          {value.toFixed(1)} {typeof count === "number" ? `(${count})` : ""}
        </span>
      )}
    </div>
  );
}
