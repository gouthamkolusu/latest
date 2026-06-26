// server/src/middlewares/auth.js
const admin = require("../core/firebaseAdmin");

function extractToken(req) {
  const alt = req.headers["x-access-token"];
  if (typeof alt === "string" && alt.trim()) return alt.trim();

  const header = req.headers.authorization || req.headers.Authorization || "";
  // Tolerate extra spaces / case variants
  const parts = header.trim().split(/\s+/);
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
}

async function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing or invalid Bearer token" });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email ?? null };
    next();
  } catch (e) {
    console.warn("Auth error:", e?.message || e);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = auth;
module.exports.auth = auth;
