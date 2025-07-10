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

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
