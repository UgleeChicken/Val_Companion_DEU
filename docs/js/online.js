// Val Companion – Online-Partie über Firebase (REST, ohne Zusatzbibliothek).
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

// ---------- Online-Partie (Firebase über REST, ohne SDK) ----------
const FB = Object.assign({
  key: "AIzaSyDmEx4-RTrGNi1kwonQozk9u2u1HF9Li_4",
  db: "https://val-companion-default-rtdb.europe-west1.firebasedatabase.app",
  idt: "https://identitytoolkit.googleapis.com",
  secure: "https://securetoken.googleapis.com",
  // App Check: Nachweis, dass Anfragen aus der echten App kommen (reCAPTCHA Enterprise / Fraud Defense, unsichtbar)
  project: "val-companion",
  appId: "1:63772632573:web:018ec7687ee50f9a426594",
  recaptcha: "6LequCMuAAAAAH3hm8FOJymYdNMuIZjCIcN7Imui",
  appCheck: "https://content-firebaseappcheck.googleapis.com/v1",
}, window.VAL_FB || {});
const ONLINE_KEY = "valcompanion-online";
const AUTH_KEY = "valcompanion-auth";
const LOCAL_ONLY = ["bigText", "tab", "pool", "me", "allowAll", "desc", "closed", "autoDice", "autoBuild", "optsOpen", "seg", "logOpen", "achOff"];           // bleibt auf jedem Handy für sich
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne I, O, 0, 1
const net = { code: null, status: "aus", err: "", token: null, tokenExp: 0, es: null, lastShared: null, pushTimer: null, retry: null, renew: null, reconnect: null };

const fmtCode = c => c ? `${c.slice(0, 3)}-${c.slice(3)}` : "";
const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
function genCode() { let c = ""; for (let i = 0; i < 6; i++) c += CODE_CHARS[rnd(CODE_CHARS.length)]; return c; }
function sharedJson() { const o = {}; for (const k in st) if (!LOCAL_ONLY.includes(k)) o[k] = st[k]; return JSON.stringify(o); }

function setAuth(token, refresh, uid, expiresIn) {
  net.token = token; net.tokenExp = Date.now() + (Number(expiresIn) || 3600) * 1000;
  try { localStorage.setItem(AUTH_KEY, JSON.stringify({ refresh, uid })); } catch {}
}
async function authToken() {
  if (net.token && Date.now() < net.tokenExp - 120000) return net.token;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch {}
  if (saved && saved.refresh) {
    const r = await fetch(`${FB.secure}/v1/token?key=${FB.key}`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(saved.refresh)}`,
    });
    if (r.ok) { const d = await r.json(); setAuth(d.id_token, d.refresh_token, d.user_id, d.expires_in); return net.token; }
  }
  const r = await fetch(`${FB.idt}/v1/accounts:signUp?key=${FB.key}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!r.ok) throw new Error(tr("Anmeldung beim Server fehlgeschlagen."));
  const d = await r.json(); setAuth(d.idToken, d.refreshToken, d.localId, d.expiresIn); return net.token;
}
// ---------- App Check ----------
// reCAPTCHA wird erst geladen, wenn jemand online spielt. Schlägt es fehl (z. B. durch einen Blocker),
// geht die Anfrage ohne Nachweis raus; solange App Check in Firebase nicht erzwungen wird, klappt sie trotzdem.
const AC_KEY = "valcompanion-appcheck";
const ac = { token: null, exp: 0, failedAt: 0, missing: false, loading: null, noHeader: false };
// Nachweis gilt etwa einen Tag: auf dem Gerät merken, damit nicht bei jedem Start neu bei Google angefragt wird.
try { const sv = JSON.parse(localStorage.getItem(AC_KEY)); if (sv && sv.token && sv.exp > Date.now()) { ac.token = sv.token; ac.exp = sv.exp; } } catch {}
function loadRecaptcha() {
  if (window.grecaptcha && grecaptcha.enterprise && grecaptcha.enterprise.execute) return Promise.resolve();
  if (ac.loading) return ac.loading;
  ac.loading = new Promise((ok, fail) => {
    const sc = document.createElement("script");
    sc.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(FB.recaptcha)}`;
    sc.async = true; sc.onload = ok; sc.onerror = () => { ac.loading = null; sc.remove(); fail(new Error("recaptcha")); };
    document.head.appendChild(sc);
  });
  return ac.loading;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), ms))]);
async function appCheckToken() {
  if (!FB.recaptcha) return null;
  if (ac.token && Date.now() < ac.exp - 300000) return ac.token;
  if (Date.now() - ac.failedAt < 60000) return null;               // nach einem Fehlschlag kurz nicht erneut versuchen
  try {
    await withTimeout(loadRecaptcha(), 8000);
    const g = grecaptcha.enterprise;
    const rc = await withTimeout(new Promise((ok, no) => g.ready(() => g.execute(FB.recaptcha, { action: "fire_app_check" }).then(ok, no))), 8000);
    const r = await fetch(`${FB.appCheck}/projects/${FB.project}/apps/${FB.appId}:exchangeRecaptchaEnterpriseToken?key=${FB.key}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recaptcha_enterprise_token: rc }),
    });
    if (!r.ok) throw new Error("exchange " + r.status);
    const d = await r.json();
    ac.token = d.token; ac.exp = Date.now() + (parseFloat(d.ttl) || 3600) * 1000; ac.missing = false;
    try { localStorage.setItem(AC_KEY, JSON.stringify({ token: ac.token, exp: ac.exp })); } catch {}
    return ac.token;
  } catch (e) {
    ac.failedAt = Date.now(); ac.missing = true;
    try { console.warn("App Check:", e && e.message); } catch {}
    return null;
  }
}
async function dbHeaders(extra) {
  const h = Object.assign({}, extra);
  const t = ac.noHeader ? null : await appCheckToken(); if (t) h["X-Firebase-AppCheck"] = t;
  return h;
}
const deniedMsg = () => ac.missing
  ? tr("Online-Partie nicht möglich: Die App konnte nicht bestätigen, dass sie echt ist. Bitte einen Werbe- oder Tracking-Blocker für diese Seite ausschalten und erneut versuchen.")
  : tr("Der Server verweigert den Zugriff. Sind die Datenbank-Regeln eingetragen?");

const roomUrl = (code, token) => `${FB.db}/rooms/${code}.json?auth=${encodeURIComponent(token)}`;
async function dbReq(method, code, body) {
  const t = await authToken();
  let r;
  try {
    const opts = h => ({ method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    const h = await dbHeaders({ "Content-Type": "application/json" });
    try { r = await fetch(roomUrl(code, t), opts(h)); }
    catch (e) {
      // Lehnt der Browser den Zusatz-Header ab, ohne ihn erneut versuchen und für diese Sitzung weglassen.
      if (!h["X-Firebase-AppCheck"]) throw e;
      delete h["X-Firebase-AppCheck"];
      r = await fetch(roomUrl(code, t), opts(h));
      ac.noHeader = true; try { console.warn("App Check: Header abgelehnt, ohne Nachweis weiter"); } catch {}
    }
  } catch { throw new Error(tr("Keine Verbindung zum Server. Ist das Handy online?")); }
  if (r.status === 401 || r.status === 403) throw new Error(deniedMsg());
  if (!r.ok) throw new Error(tf("Der Server meldet einen Fehler ({s}).", { s: r.status }));
  return r.json();
}

function setNet(status, err = "") { net.status = status; net.err = err; renderOnline(); }
function remember(code) { try { code ? localStorage.setItem(ONLINE_KEY, code) : localStorage.removeItem(ONLINE_KEY); } catch {} }

async function createRoom() {
  setNet("verbinde");
  try {
    for (let i = 0; i < 5; i++) {
      const code = genCode();
      if (await dbReq("GET", code)) continue;            // Code schon vergeben
      const s = sharedJson();
      await dbReq("PUT", code, { state: s, createdAt: { ".sv": "timestamp" }, updatedAt: { ".sv": "timestamp" } });
      net.lastShared = s;
      return startSync(code);
    }
    throw new Error(tr("Es konnte kein freier Code gefunden werden. Bitte nochmal versuchen."));
  } catch (e) { setNet("aus", e.message); }
}

async function joinRoom(raw) {
  const code = normCode(raw);
  if (code.length !== 6 || [...code].some(ch => !CODE_CHARS.includes(ch))) return setNet("aus", tr("Der Code hat 6 Zeichen, z. B. K7M-Q2X."));
  setNet("verbinde");
  try {
    const room = await dbReq("GET", code);
    if (!room || typeof room.state !== "string") throw new Error(tf("Keine Partie mit dem Code {c} gefunden.", { c: fmtCode(code) }));
    achNewGame();
    applyRemote(room.state);
    startSync(code);
  } catch (e) { setNet("aus", e.message); }
}

function startSync(code) {
  net.code = code; remember(code);
  const inp = $("joinCode"); if (inp) inp.value = "";
  setNet("verbinde");
  openStream();
  render();
}

// Live-Verbindung als Server-Sent-Events über fetch, damit der App-Check-Nachweis als Header mitgehen kann.
function sseStream(url, headers, on) {
  const ctl = new AbortController();
  const h = { close: () => ctl.abort() };
  (async () => {
    let r;
    try { r = await fetch(url, { headers: Object.assign({ Accept: "text/event-stream" }, headers), signal: ctl.signal, cache: "no-store" }); }
    catch (e) { if (!ctl.signal.aborted) on.error(0); return; }
    if (!r.ok || !r.body) { if (!ctl.signal.aborted) on.error(r.status); return; }
    on.open();
    const rd = r.body.getReader(), dec = new TextDecoder();
    let buf = "";
    try {
      for (;;) {
        const { value, done } = await rd.read();
        if (done) break;
        buf += dec.decode(value, { stream: true }).replace(/\r\n?/g, "\n");
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const block = buf.slice(0, i); buf = buf.slice(i + 2);
          let ev = "message", data = "";
          block.split("\n").forEach(l => {
            if (l.startsWith("event:")) ev = l.slice(6).trim();
            else if (l.startsWith("data:")) data += (data ? "\n" : "") + l.slice(5).replace(/^ /, "");
          });
          on.event(ev, data);
        }
      }
    } catch {}
    if (!ctl.signal.aborted) on.error(0);
  })();
  return h;
}

function closeStream() {
  if (net.es) { net.es.close(); net.es = null; }
  clearTimeout(net.renew); clearTimeout(net.reconnect);
}
function reconnectSoon(ms) {
  clearTimeout(net.reconnect);
  net.reconnect = setTimeout(() => { if (net.code) openStream(); }, ms);
}
async function openStream() {
  closeStream();
  const code = net.code; if (!code) return;
  let t;
  try { t = await authToken(); } catch (e) { setNet("verbinde", tr("Keine Verbindung zum Server. Neuer Versuch läuft …")); return reconnectSoon(5000); }
  const headers = await dbHeaders();
  if (net.code !== code) return;
  const es = sseStream(roomUrl(code, t), headers, {
    open: () => { if (net.es !== es) return; if (net.status !== "verbunden") setNet("verbunden"); if (net.lastShared === null) pushNow(); },
    event: (ev, data) => {
      if (net.es !== es) return;
      if (ev === "put" || ev === "patch") { try { onStream(JSON.parse(data)); } catch {} }
      else if (ev === "auth_revoked") { net.token = null; reconnectSoon(0); }
      else if (ev === "cancel") { closeStream(); setNet("fehler", tr("Der Server verweigert den Zugriff auf diese Partie.")); }
    },
    error: status => {
      if (net.es !== es) return;
      es.close(); net.es = null;
      if (status === 401 || status === 403) { setNet("fehler", deniedMsg()); return reconnectSoon(30000); }
      setNet("verbinde", "");
      // Einmal prüfen, ob nur der App-Check-Header abgelehnt wurde (dbReq lässt ihn dann weg).
      if (!status && headers["X-Firebase-AppCheck"] && !ac.probed) { ac.probed = true; return dbReq("GET", code).catch(() => {}).finally(() => reconnectSoon(0)); }
      reconnectSoon(4000);
    },
  });
  net.es = es;
  // Anmelde-Token und App-Check-Nachweis laufen nach etwa einer Stunde ab: rechtzeitig neu verbinden.
  const until = Math.min(net.tokenExp, ac.token ? ac.exp : Infinity);
  net.renew = setTimeout(() => { net.token = null; openStream(); }, Math.max(60000, until - Date.now() - 180000));
}

function onStream(msg) {
  const { path, data } = msg || {};
  let s;
  if (path === "/") {
    if (data === null) { closeStream(); net.code = null; remember(null); return setNet("aus", tr("Die Partie wurde gelöscht.")); }
    s = data && data.state;
  } else if (path === "/state") s = data;
  if (typeof s === "string") applyRemote(s);
}

// Spielstand von anderen Handys nur in geprüfter Form übernehmen (Schutz vor kaputten oder manipulierten Daten).
function cleanState(o) {
  if (!o || typeof o !== "object" || !Array.isArray(o.players)) return null;
  const str = (v, max) => String(v ?? "").slice(0, max);
  const int = (v, lo, hi, d) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
  const players = o.players.slice(0, 4).map(p => str(p, 24) || "Spieler");
  if (!players.length) return null;
  const n = players.length;
  const out = {
    players,
    colors: players.map((_, i) => int(Array.isArray(o.colors) ? o.colors[i] : i, 0, COLORS.length - 1, i % COLORS.length)),
    colorsV: 2,
    current: int(o.current, 0, n - 1, 0),
    round: int(o.round, 1, 9999, 1),
    per: int(o.per, 1, 8, 3),
    used: (Array.isArray(o.used) ? o.used : []).slice(0, 30).map(u => ({
      n: str(u && u.n, 60), free: !!(u && u.free),
      build: u && FURN.some(f => f.k === u.build) ? u.build : null,
    })),
    log: (Array.isArray(o.log) ? o.log : []).slice(0, 120).map(l => cleanLog(l, n)),
    built: (Array.isArray(o.built) ? o.built : []).filter(k => FURN.some(f => f.k === k && !f.ship)),
    diceExtra: int(o.diceExtra, 0, 5, 0),
    ext: { rache: !!(o.ext && o.ext.rache), gf: !!(o.ext && o.ext.gf) },
    roll: (Array.isArray(o.roll) ? o.roll : []).slice(0, 40)
      .filter(r => r && DICE[r.d] && DICE[r.d].faces && Number.isInteger(r.f) && r.f >= 0 && r.f < DICE[r.d].faces.length)
      .map(r => ({ d: r.d, f: r.f })),
  };
  const sv = cleanStat(o.stat, n); if (sv) out.stat = sv;
  return out;
}

// Statistik der Partie (siehe stats.js): nur bekannte Würfelseiten und Zahlen übernehmen
function cleanStat(s, n) {
  if (!s || typeof s !== "object") return null;
  const num = v => { const x = Math.floor(Number(v)); return Number.isFinite(x) && x >= 0 && x < 1e7 ? x : 0; };
  const d = {}, p = {};
  for (const k in DICE) {
    const src = s.d && s.d[k]; if (!src || typeof src !== "object" || !DICE[k].faces) continue;
    const o = {}; for (const f in src) if (DICE[k].faces.some(x => x.n === f)) o[f] = num(src[f]);
    d[k] = o;
  }
  for (let i = 0; i < n; i++) { const q = s.p && s.p[i]; if (q && typeof q === "object") p[i] = { r: num(q.r), x: num(q.x), e: num(q.e), k: num(q.k), a: num(q.a) }; }
  const t0 = Number(s.t0);
  return { t0: Number.isFinite(t0) && t0 > 0 ? t0 : 0, n: num(s.n), x: num(s.x), d, p, a: num(s.a), fr: num(s.fr), sh: num(s.sh) };
}

function applyRemote(s) {
  if (s === net.lastShared) return;
  let o; try { o = cleanState(JSON.parse(s)); } catch { return; }
  if (!o) return;
  const keep = {}; LOCAL_ONLY.forEach(k => { if (k in st) keep[k] = st[k]; });
  const rolled = JSON.stringify(o.roll || []) !== JSON.stringify(st.roll || []);
  st = Object.assign(o, keep);
  net.lastShared = sharedJson();   // geprüfte Fassung, damit sie nicht zurückgesendet wird
  if (rolled && typeof tumble !== "undefined") tumble = new Set((st.roll || []).map((_, i) => i));
  render();
}

function schedulePush() {
  if (!net.code) return;
  clearTimeout(net.pushTimer);
  net.pushTimer = setTimeout(pushNow, 120);
}
async function pushNow() {
  if (!net.code) return;
  clearTimeout(net.retry);
  const s = sharedJson();
  if (s === net.lastShared) return;
  const code = net.code;
  net.lastShared = s;
  try {
    await dbReq("PATCH", code, { state: s, updatedAt: { ".sv": "timestamp" } });
    if (net.status !== "verbunden") setNet("verbunden");
  } catch (e) {
    if (net.code !== code) return;
    net.lastShared = null;                              // beim nächsten Versuch erneut senden
    setNet("verbinde", e.message + " " + tr("Neuer Versuch läuft …"));
    net.retry = setTimeout(pushNow, 5000);
  }
}

function resetDelArea() {
  const a = $("delArea"); if (a) a.innerHTML = `<button class="btn danger" id="onDelete">${tr("Partie für alle löschen")}</button>`;
}
// Löscht die Partie samt Spielstand, Spielernamen und Protokoll aus der Datenbank. Die anderen Handys werden getrennt.
async function deleteRoom() {
  const code = net.code; if (!code) return;
  try {
    await dbReq("DELETE", code);
    leaveRoom(); resetDelArea();
    setNet("aus", tr("Die Partie wurde gelöscht."));
  } catch (e) { resetDelArea(); setNet(net.status, e.message); }
}

function leaveRoom() {
  closeStream(); clearTimeout(net.pushTimer); clearTimeout(net.retry);
  net.code = null; net.lastShared = null; remember(null);
  setNet("aus");
}

function renderOnline() {
  const box = $("online"); if (!box) return;
  const on = !!net.code;
  $("onOff").hidden = on; $("onOn").hidden = !on;
  const dotCls = net.status === "verbunden" ? "ok" : net.status === "fehler" ? "bad" : "wait";
  const label = tr(net.status === "verbunden" ? "Verbunden – alle sehen denselben Spielstand" : net.status === "fehler" ? "Getrennt" : "Verbinde …");
  $("onDot").className = `dot ${dotCls}`;
  $("onStatusText").textContent = label;
  $("onCode").textContent = fmtCode(net.code);
  // In der Vorschau fehlen die Knöpfe (dort sind Online-Partien abgeschaltet)
  if ($("onCreate")) $("onCreate").disabled = net.status === "verbinde" && !on;
  if ($("onJoin")) $("onJoin").disabled = net.status === "verbinde" && !on;
  $("onErr").hidden = !net.err; $("onErr").textContent = net.err;
  const pill = $("onPill");
  if (pill) {
    pill.hidden = !on;
    pill.innerHTML = on ? `<span class="dot ${dotCls}"></span>Online · ${fmtCode(net.code)}` : "";
  }
  const mini = document.querySelector("#status .on-mini");
  if (mini) mini.innerHTML = on ? `<span class="dot ${dotCls}" title="${tf("Online-Partie {c}", { c: fmtCode(net.code) })}" style="width:8px;height:8px;border-radius:50%;display:inline-block"></span>` : "";
}

document.addEventListener("click", e => {
  const t = e.target.closest("#onCreate,#onJoin,#onLeave,#onCopy,#onPill,#onDelete,#onDelYes,#onDelNo");
  if (!t) return;
  if (t.id === "onCreate") return createRoom();
  if (t.id === "onJoin") return joinRoom($("joinCode").value);
  if (t.id === "onLeave") return leaveRoom();
  if (t.id === "onDelete") {
    $("delArea").innerHTML = `<span class="confirm">${tr("Partie und alle Online-Daten für alle Mitspieler löschen?")} <button class="btn danger" id="onDelYes">${tr("Ja, löschen")}</button><button class="btn" id="onDelNo">${tr("Abbrechen")}</button></span>`;
    return;
  }
  if (t.id === "onDelNo") return resetDelArea();
  if (t.id === "onDelYes") return deleteRoom();
  if (t.id === "onPill") return goTab("spiel");
  if (t.id === "onCopy") {
    const txt = fmtCode(net.code);
    const done = () => { t.textContent = tr("Kopiert"); setTimeout(() => { t.textContent = tr("Code kopieren"); }, 1500); };
    try { navigator.clipboard.writeText(txt).then(done, () => selectCode()); } catch { selectCode(); }
  }
});
function selectCode() { const r = document.createRange(); r.selectNodeContents($("onCode")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
document.addEventListener("keydown", e => { if (e.target && e.target.id === "joinCode" && e.key === "Enter") joinRoom(e.target.value); });
window.addEventListener("online", () => { if (net.code) { reconnectSoon(0); if (net.lastShared === null) pushNow(); } });
