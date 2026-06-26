// server/src/config/cors.js
import cors from "cors";

export default function buildCors() {
  const allow = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // add your dev origin(s) here
  ];
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allow.includes(origin)) return cb(null, true);
      cb(null, true); // relax in dev
    },
    credentials: true,
  });
}
