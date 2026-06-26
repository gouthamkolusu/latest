// server/src/data/products.store.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// products.json sits next to this file
const DATA_FILE = path.join(__dirname, "products.json");

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function nextId(list) {
  // If you already use numeric ids in your file, keep incrementing
  const max = list.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
  return String(max + 1);
}

export function getAll() {
  return readAll();
}

export function getById(id) {
  const all = readAll();
  return all.find((p) => String(p.id) === String(id)) || null;
}

export function add(product) {
  const all = readAll();
  const id = nextId(all);
  const now = new Date().toISOString();
  const created = { id, createdAt: now, updatedAt: now, ...product };
  all.unshift(created);
  writeAll(all);
  return created;
}

export function update(id, patch) {
  const all = readAll();
  const idx = all.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return null;
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function remove(id) {
  const all = readAll();
  const idx = all.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return false;
  all.splice(idx, 1);
  writeAll(all);
  return true;
}
