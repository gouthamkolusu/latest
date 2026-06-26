import { Router } from "express";
import { readAll, writeAll, sameId } from "../utils/fsdb.js";

const router = Router();

// GET /api/products
router.get("/", (_req, res) => {
  try {
    res.json(readAll());
  } catch {
    res.status(500).json({ error: "Failed to read products" });
  }
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  try {
    const id = req.params.id;
    const item = readAll().find((p) => sameId(p.id ?? p._id, id));
    if (!item) return res.status(404).json({ error: "Product not found" });
    res.json(item);
  } catch {
    res.status(500).json({ error: "Failed to read products" });
  }
});

// POST /api/products  → returns the saved product object
router.post("/", (req, res) => {
  const p = req.body || {};
  // allow price 0; just ensure required fields exist
  if (!p.name || p.price == null || !p.category) {
    return res.status(400).json({
      error: "Missing required fields (name, price, category)",
    });
  }

  try {
    const products = readAll();
    // stable id if none provided
    p.id = p.id ?? Date.now();
    // normalize images/image like your client expects
    p.image = p.image || (Array.isArray(p.images) ? p.images[0] : "");
    p.images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);

    products.push(p);
    writeAll(products);
    res.status(201).json(p);
  } catch {
    res.status(500).json({ error: "Failed to write product" });
  }
});

// PUT /api/products/:id
router.put("/:id", (req, res) => {
  try {
    const id = req.params.id;
    const updated = req.body || {};
    const products = readAll();
    const idx = products.findIndex((p) => sameId(p.id ?? p._id, id));
    if (idx === -1) return res.status(404).json({ error: "Product not found" });

    const stableId = products[idx].id ?? products[idx]._id ?? id;
    const next = { ...products[idx], ...updated, id: stableId };

    // normalize image fields
    next.image = next.image || (Array.isArray(next.images) ? next.images[0] : "");
    next.images = Array.isArray(next.images) ? next.images : (next.image ? [next.image] : []);

    products[idx] = next;
    writeAll(products);
    res.json(next);
  } catch {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", (req, res) => {
  try {
    const id = req.params.id;
    const products = readAll();
    const filtered = products.filter((p) => !sameId(p.id ?? p._id, id));
    if (filtered.length === products.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    writeAll(filtered);
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
