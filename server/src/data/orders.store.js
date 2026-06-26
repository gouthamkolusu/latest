// server/src/data/orders.store.js
const fs = require("fs");
const path = require("path");

const ORDERS_FILE = path.join(__dirname, "orders.json");

function ensureFile() {
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
    fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(ORDERS_FILE, "utf8");
  try {
    const data = JSON.parse(raw || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(list, null, 2), "utf8");
}

function getById(id) {
  return readAll().find((o) => String(o.id) === String(id));
}

/** Insert or replace by id (store items as-is, including `image` and `unit_amount`) */
function upsert(order) {
  const list = readAll();
  let id = order.id || String(Date.now());
  const idx = list.findIndex((o) => String(o.id) === String(id));

  const rec = { ...order, id };
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...rec };
  } else {
    list.push(rec);
  }
  writeAll(list);
  return rec;
}

function findByUserId(uid) {
  return readAll().filter((o) => o.uid === uid);
}

function findByEmail(email) {
  const e = String(email || "").toLowerCase();
  return readAll().filter((o) => (o.email || "").toLowerCase() === e);
}

module.exports = {
  readAll,
  writeAll,
  getById,
  upsert,
  findByUserId,
  findByEmail,
};
