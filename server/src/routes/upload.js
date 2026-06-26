import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Ensure uploads directory at project root: server/../uploads
const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}-${safe}`);
  },
});
const upload = multer({ storage });

// POST /api/upload  (field name: "images")
router.post("/", upload.array("images", 10), (req, res) => {
  const files = req.files || [];
  const urls = files.map((f) => `/uploads/${path.basename(f.path)}`);
  res.json({ ok: true, urls });
});

export default router;
