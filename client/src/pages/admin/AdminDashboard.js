// client/src/pages/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../../lib/apiClient";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiGet("/api/products");
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list);
      } catch (e) {
        console.error("❌ Failed to load products:", e);
        setErr("Failed to load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await apiDelete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("❌ Failed to delete product:", e);
      alert("Failed to delete product.");
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "16px auto", padding: "0 16px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <Link
          to="/admin/add"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            textDecoration: "none",
            background: "#2563eb",
            color: "#fff",
            border: "1px solid #2563eb",
            fontWeight: 600,
          }}
        >
          + Add Product
        </Link>
      </header>

      {loading && <p>Loading…</p>}
      {!loading && err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <section>
          <h3 style={{ marginTop: 0 }}>All Products</h3>
          {(!products || products.length === 0) ? (
            <p>No products available.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {products.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {p.image && (
                      <img
                        src={p.image}
                        alt=""
                        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>
                        ${Number(p.price || 0).toFixed(2)} {p.brand ? `• ${p.brand}` : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link
                      to={`/admin/edit/${p.id}`}
                      style={{
                        textDecoration: "none",
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        color: "#111827",
                        background: "#fff",
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
