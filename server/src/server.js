// server/src/server.js
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

// Routers (may be CJS or ESM default/named)
const uploadRouterMod = require("./routes/upload");
const paymentsRouterMod = require("./routes/payments");
const ordersRouterMod = require("./routes/orders");
const webhooksRouterMod = require("./routes/webhooks");
const shippingRouterMod = require("./routes/shipping"); // ← NEW

const app = express();
app.get("/favicon.ico", (_req, res) => res.status(204).end());

const PORT = process.env.PORT || 4000;

/** Normalize any router export shape into a function for app.use(...) */
function resolveRouter(mod) {
  if (typeof mod === "function") return mod;                 // CJS: module.exports = router
  if (mod && typeof mod.default === "function") return mod.default; // ESM default
  if (mod && typeof mod.router === "function") return mod.router;   // named export { router }
  return null;
}
function useRoute(mountPath, mod) {
  const r = resolveRouter(mod);
  if (!r) {
    console.warn(`⚠️  Skipping route ${mountPath}: invalid router export`);
    return;
  }
  app.use(mountPath, r);
}

app.use(cors());

// --- IMPORTANT: mount webhooks BEFORE express.json() so Stripe sees the raw body ---
useRoute("/api/webhooks", webhooksRouterMod);

// Body parsers for everything else
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- static for uploaded files ----------
const uploadsDir = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

// ---------- products data file ----------
const productsFile = path.join(__dirname, "data", "products.json");

// ---------- helpers ----------
function ensureFile() {
  if (!fs.existsSync(productsFile)) {
    fs.mkdirSync(path.dirname(productsFile), { recursive: true });
    fs.writeFileSync(productsFile, "[]", "utf8");
  }
}
function readProducts() {
  ensureFile();
  const raw = fs.readFileSync(productsFile, "utf8");
  return JSON.parse(raw || "[]");
}
function writeProducts(list) {
  fs.writeFileSync(productsFile, JSON.stringify(list, null, 2), "utf8");
}
const sameId = (a, b) => String(a) === String(b);

// ---------- routes ----------

// file uploads
useRoute("/api/upload", uploadRouterMod);

// products CRUD (JSON store)
app.get("/api/products", (_req, res) => {
  try {
    res.json(readProducts());
  } catch {
    res.status(500).json({ error: "Failed to read products" });
  }
});

app.get("/api/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    const item = readProducts().find((p) => sameId(p.id ?? p._id, id));
    if (!item) return res.status(404).json({ error: "Product not found" });
    res.json(item);
  } catch {
    res.status(500).json({ error: "Failed to read products" });
  }
});

app.post("/api/products", (req, res) => {
  const p = req.body || {};
  if (!p.name || p.price == null || !p.image || !p.category) {
    return res
      .status(400)
      .json({ error: "Missing required fields (name, price, image, category)" });
  }
  try {
    const products = readProducts();
    p.id = p.id ?? Date.now();
    products.push(p);
    writeProducts(products);
    res.status(201).json(p);
  } catch {
    res.status(500).json({ error: "Failed to write product" });
  }
});

app.put("/api/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    const updated = req.body || {};
    const products = readProducts();
    const idx = products.findIndex((p) => sameId(p.id ?? p._id, id));
    if (idx === -1) return res.status(404).json({ error: "Product not found" });

    const stableId = products[idx].id ?? products[idx]._id ?? id;
    products[idx] = { ...products[idx], ...updated, id: stableId };
    writeProducts(products);
    res.json(products[idx]);
  } catch {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    const products = readProducts();
    const filtered = products.filter((p) => !sameId(p.id ?? p._id, id));
    if (filtered.length === products.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    writeProducts(filtered);
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// orders & payments
useRoute("/api/orders", ordersRouterMod);
useRoute("/api/payments", paymentsRouterMod);

// shipping (EasyPost) ← NEW
useRoute("/api/shipping", shippingRouterMod);

// JSON catch-all to avoid HTML leaking into /api/*
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
