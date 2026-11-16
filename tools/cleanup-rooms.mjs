// Löscht Online-Partien, die länger als MAX_DAYS nicht benutzt wurden.
// Läuft täglich über .github/workflows/cleanup.yml und braucht keine Zusatzpakete.
//
// Umgebungsvariablen:
//   FIREBASE_SERVICE_ACCOUNT  Inhalt der Dienstkonto-JSON-Datei (GitHub-Secret)
//   DATABASE_URL              Adresse der Realtime Database
//   MAX_DAYS                  Tage ohne Benutzung bis zum Löschen (Standard 30)
//   DRY_RUN                   "true": nur anzeigen, nichts löschen
//   ACCESS_TOKEN              nur für Tests: fertiges Token statt Dienstkonto
import { createSign } from "node:crypto";

const DB = (process.env.DATABASE_URL || "").replace(/\/+$/, "");
const MAX_DAYS = Number(process.env.MAX_DAYS || 30);
const DRY = String(process.env.DRY_RUN || "").toLowerCase() === "true";

const b64url = v => Buffer.from(v).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

// Zugriffs-Token für das Dienstkonto holen (OAuth 2.0, signiertes JWT)
async function accessToken() {
  if (process.env.ACCESS_TOKEN) return process.env.ACCESS_TOKEN;
  let sa;
  try { sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || ""); }
  catch { throw new Error("FIREBASE_SERVICE_ACCOUNT fehlt oder ist kein gültiges JSON."); }
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, aud: sa.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
  }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key);
  const r = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64url(sig)}` }),
  });
  if (!r.ok) throw new Error(`Anmeldung des Dienstkontos fehlgeschlagen (${r.status}): ${await r.text()}`);
  return (await r.json()).access_token;
}

async function main() {
  if (!DB.startsWith("http")) throw new Error("DATABASE_URL fehlt.");
  if (!(MAX_DAYS >= 1)) throw new Error("MAX_DAYS muss mindestens 1 sein.");
  const token = await accessToken();
  const auth = { Authorization: `Bearer ${token}` };

  const r = await fetch(`${DB}/rooms.json`, { headers: auth });
  if (!r.ok) throw new Error(`Partien konnten nicht gelesen werden (${r.status}): ${await r.text()}`);
  const rooms = (await r.json()) || {};

  const cutoff = Date.now() - MAX_DAYS * 86400000;
  const old = [];
  for (const [code, room] of Object.entries(rooms)) {
    const last = Number(room && (room.updatedAt ?? room.createdAt));
    // Partien ohne gültigen Zeitstempel sind kaputt und werden ebenfalls entfernt.
    if (!Number.isFinite(last) || last < cutoff) old.push({ code, last });
  }
  const fmt = t => Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "ohne Datum";
  console.log(`${Object.keys(rooms).length} Partien, davon ${old.length} länger als ${MAX_DAYS} Tage unbenutzt.`);
  old.forEach(o => console.log(`  ${o.code}  zuletzt ${fmt(o.last)}`));
  if (!old.length) return;
  if (DRY) { console.log("Probelauf: nichts gelöscht."); return; }

  // In Paketen löschen (ein PATCH mit null-Werten entfernt mehrere Partien auf einmal)
  for (let i = 0; i < old.length; i += 200) {
    const patch = Object.fromEntries(old.slice(i, i + 200).map(o => [o.code, null]));
    const d = await fetch(`${DB}/rooms.json`, { method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!d.ok) throw new Error(`Löschen fehlgeschlagen (${d.status}): ${await d.text()}`);
  }
  console.log(`${old.length} Partien gelöscht.`);
}

main().catch(e => { console.error("Fehler:", e.message); process.exit(1); });
