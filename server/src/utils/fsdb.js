import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// products.json lives in server/src/data/products.json
const DATA_FILE = path.resolve(__dirname, "..", "data", "products.json");

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

export function readAll() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

export function writeAll(list) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

export function sameId(a, b) {
  return String(a) === String(b);
}
