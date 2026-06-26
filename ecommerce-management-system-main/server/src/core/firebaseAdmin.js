// server/src/core/firebaseAdmin.js
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

/**
 * We support multiple credential sources (checked in this order):
 * 1) FIREBASE_SERVICE_ACCOUNT_B64    -> base64-encoded JSON
 * 2) FIREBASE_SERVICE_ACCOUNT        -> raw JSON string
 * 3) FIREBASE_SERVICE_ACCOUNT_PATH   -> path to service-account JSON file
 * 4) GOOGLE_APPLICATION_CREDENTIALS  -> standard GCP path (let ADC load it)
 * 5) Application Default Credentials  -> with explicit projectId fallback
 */
function loadServiceAccountFromEnv() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch (e) {
      console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64/JSON:", e.message);
    }
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT is not valid JSON:", e.message);
    }
  }

  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (p) {
    try {
      const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
      const text = fs.readFileSync(abs, "utf8");
      return JSON.parse(text);
    } catch (e) {
      console.warn("⚠️  Could not read FIREBASE_SERVICE_ACCOUNT_PATH:", e.message);
    }
  }

  return null;
}

function resolveProjectId(explicitFromCreds) {
  // Prefer the project_id from the service account if present
  if (explicitFromCreds) return explicitFromCreds;

  // Otherwise use one of the standard envs
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    undefined
  );
}

if (!admin.apps || admin.apps.length === 0) {
  const sa = loadServiceAccountFromEnv();

  if (sa) {
    // Service account path/string provided
    const projectId = resolveProjectId(sa.project_id);
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      ...(projectId ? { projectId } : {}),
    });
    console.log("🔐 Firebase Admin initialized with service account.");
  } else {
    // Fall back to ADC (e.g., GOOGLE_APPLICATION_CREDENTIALS) + projectId hint
    const projectId = resolveProjectId();
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
    console.log(
      `🔐 Firebase Admin initialized with Application Default Credentials${projectId ? " (project: " + projectId + ")" : ""}.`
    );
  }
}

module.exports = admin;
