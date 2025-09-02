// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const productsFile = path.join(__dirname, 'products.json');

// ---------- helpers ----------
function ensureFile() {
  if (!fs.existsSync(productsFile)) fs.writeFileSync(productsFile, '[]', 'utf8');
}
function readProducts() {
  ensureFile();
  const raw = fs.readFileSync(productsFile, 'utf8');
  return JSON.parse(raw || '[]');
}
function writeProducts(list) {
  fs.writeFileSync(productsFile, JSON.stringify(list, null, 2), 'utf8');
}
const sameId = (a, b) => String(a) === String(b);

// ---------- routes ----------

// GET all
app.get('/api/products', (_req, res) => {
  try {
    res.json(readProducts());
  } catch {
    res.status(500).json({ error: 'Failed to read products' });
  }
});

// GET by id  ✅
app.get('/api/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    const item = readProducts().find(p => sameId(p.id ?? p._id, id));
    if (!item) return res.status(404).json({ error: 'Product not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to read products' });
  }
});

// POST create
app.post('/api/products', (req, res) => {
  const p = req.body || {};
  // allow price 0, reject only null/undefined
  if (!p.name || p.price == null || !p.image || !p.category) {
    return res.status(400).json({ error: 'Missing required fields (name, price, image, category)' });
  }
  try {
    const products = readProducts();
    p.id = p.id ?? Date.now(); // stable id
    products.push(p);
    writeProducts(products);
    res.status(201).json({ message: 'Product added', product: p });
  } catch {
    res.status(500).json({ error: 'Failed to write product' });
  }
});

// PUT update
app.put('/api/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    const updated = req.body || {};
    const products = readProducts();
    const idx = products.findIndex(p => sameId(p.id ?? p._id, id));
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const stableId = products[idx].id ?? products[idx]._id ?? id;
    products[idx] = { ...products[idx], ...updated, id: stableId };
    writeProducts(products);
    res.json({ message: 'Product updated', product: products[idx] });
  } catch {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE
app.delete('/api/products/:id', (req, res) => {
  try {
    const id = req.params.id;
    const products = readProducts();
    const filtered = products.filter(p => !sameId(p.id ?? p._id, id));
    if (filtered.length === products.length) return res.status(404).json({ error: 'Product not found' });
    writeProducts(filtered);
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Always return JSON for unknown /api/* (prevents HTML in frontend)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
