const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const productsFile = path.join(__dirname, 'products.json');

// GET all products
app.get('/api/products', (req, res) => {
  fs.readFile(productsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read products' });
    try {
      const products = JSON.parse(data || '[]');
      res.json(products);
    } catch (parseErr) {
      res.status(500).json({ error: 'Failed to parse products file' });
    }
  });
});

// POST new product
app.post('/api/products', (req, res) => {
  const newProduct = req.body;
  if (!newProduct.name || !newProduct.price || !newProduct.image || !newProduct.category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  fs.readFile(productsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read products file' });

    let products = [];
    try {
      products = JSON.parse(data || '[]');
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse products file' });
    }

    newProduct.id = Date.now();
    products.push(newProduct);

    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to write product' });
      res.status(201).json({ message: 'Product added', product: newProduct });
    });
  });
});

// PUT update product by ID
app.put('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const updatedProduct = req.body;

  fs.readFile(productsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read products file' });

    let products = [];
    try {
      products = JSON.parse(data || '[]');
    } catch {
      return res.status(500).json({ error: 'Failed to parse products' });
    }

    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });

    products[index] = { ...products[index], ...updatedProduct };

    fs.writeFile(productsFile, JSON.stringify(products, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to update product' });
      res.json({ message: 'Product updated', product: products[index] });
    });
  });
});

// DELETE product by ID
app.delete('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);

  fs.readFile(productsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read products file' });

    let products = [];
    try {
      products = JSON.parse(data || '[]');
    } catch {
      return res.status(500).json({ error: 'Failed to parse products' });
    }

    const filtered = products.filter(p => p.id !== productId);
    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    fs.writeFile(productsFile, JSON.stringify(filtered, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to delete product' });
      res.json({ message: 'Product deleted' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
