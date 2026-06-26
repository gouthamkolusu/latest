// client/src/data/index.js
import products from "./products.json";

// simple fetchProducts helper (local JSON)
export async function fetchProducts() {
  return products;
}
