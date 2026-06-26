// server/src/utils/catalog.js
const fs = require("fs");
const path = require("path");

const CANDIDATE_PATHS = [
  path.join(__dirname, "..", "data", "products.json"),            // server catalog (preferred)
  path.join(process.cwd(), "client", "src", "data", "products.json"), // client catalog (fallback)
];

let cache = { ts: 0, byId: {} };

function loadProducts() {
  for (const p of CANDIDATE_PATHS) {
    try {
      const stat = fs.statSync(p);
      if (!stat.isFile()) continue;
      // crude cache ~10s
      const now = Date.now();
      if (now - cache.ts < 10_000 && Object.keys(cache.byId).length) return cache.byId;

      const raw = fs.readFileSync(p, "utf8");
      const arr = JSON.parse(raw || "[]");
      const byId = {};
      for (const prod of arr) {
        const id = String(prod.id ?? prod._id ?? "").trim();
        if (!id) continue;
        byId[id] = prod;
      }
      cache = { ts: Date.now(), byId };
      return byId;
    } catch {
      // try next
    }
  }
  return {};
}

/** Return best image URL for a product object */
function pickImageFromProduct(prod = {}) {
  if (prod.image) return prod.image;
  if (Array.isArray(prod.images) && prod.images[0]) return prod.images[0];
  if (prod.image_url) return prod.image_url; // many of yours use this field  :contentReference[oaicite:2]{index=2}
  return null;
}

/** Given a sku/id (string/number), return best image URL from catalog, or null */
function resolveImageForSku(skuLike) {
  if (skuLike == null) return null;
  const id = String(skuLike);
  const byId = loadProducts();
  const prod = byId[id];
  return prod ? pickImageFromProduct(prod) : null;
}

module.exports = { resolveImageForSku, pickImageFromProduct, loadProducts };
