// server/src/index.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import productsRouter from "./routes/products.js";
import uploadRouter from "./routes/upload.js";
import paymentsRouter from "./routes/payments.js";
import webhooksRouter from "./routes/webhooks.js";
import ordersRouter from "./routes/orders.js";
import shippingRouter from './routes/shipping.js';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---- Config ----
const PORT = Number(process.env.PORT) || 4000; // default 4000 to match client
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ---- Middleware ----
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// ---- Static uploads ----
const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

app.use("/api/orders", ordersRouter);


// ---- Routers (order matters: register before 404) ----
app.use("/api/products", productsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/payments", paymentsRouter);
app.use("/webhooks", webhooksRouter);
app.use('/api/shipping', shippingRouter);


// ---- Health ----
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---- 404 for unknown /api/* (keep last) ----
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// ---- Start ----
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
  console.log(`🗂️  Uploads served from /uploads`);
});
