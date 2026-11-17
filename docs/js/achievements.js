// Val Companion – Erfolge. Werden nur auf diesem Gerät gespeichert, nichts geht an einen Server.
// Online zählt jedes Handy nur seinen eigenen Spieler; an einem einzelnen Handy sammelt es für alle, die daran spielen.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

const ACH_KEY = "valcompanion-erfolge";
const ACH = [
  { id: "ersterZug", t: "Der erste Schritt", d: "Beende deinen ersten Zug." },
  { id: "runenkundig", t: "Runenkundig", d: "Verbrauche in einem Zug alle Runensteine." },
  { id: "rast", t: "Kurze Rast", d: "Beende einen Zug, ohne alle Runensteine zu verbrauchen." },
  { id: "flink", t: "Flinke Hände", d: "Führe in einer Partie 4 freie Aktionen aus.", g: "free", n: 4 },
  { id: "odin", t: "Odins Gunst", d: "Würfle einen kritischen Treffer." },
  { id: "zorn", t: "Götterzorn", d: "Würfle mit 3 Schadenswürfeln drei kritische Treffer auf einmal." },
  { id: "loki", t: "Lokis Scherz", d: "Würfle mit mindestens 4 Würfeln, und alle zeigen eine Leerseite." },
  { id: "ernte", t: "Reiche Ernte", d: "Würfle „Kritisches Sammeln“." },
  { id: "laut", t: "Zu laut!", d: "Würfle „Lautes kritisches Sammeln“." },
  { id: "valkea", t: "Valkea", d: "Baue dein erstes Möbelstück. Ganz ohne Aufbauanleitung." },
  { id: "halle", t: "Herr der Halle", d: "Baue 3 Möbelstücke in einer Partie.", g: "built", n: 3 },
  { id: "kiel", t: "Kiel ins Wasser", d: "Baue ein Schiff." },
  { id: "ufer", t: "Auf zu neuen Ufern", d: "Segle 5-mal los.", c: "Lossegeln", n: 5 },
  { id: "met", t: "Metmeister", d: "Braue 5-mal Met.", c: "Met brauen", n: 5 },
  { id: "daumen", t: "Der grüne Daumen", d: "Bestelle 3-mal ein Gartenbeet.", c: "Gartenbeet", n: 3, ext: "gf" },
  { id: "koch", t: "Küchenjarl", d: "Koche 5-mal Nahrung.", c: "Nahrung kochen", n: 5 },
  { id: "gourmet", t: "Der Gourmet", d: "Iss 2-mal gekochte Nahrung.", c: "Gekochte Nahrung essen", n: 2 },
  { id: "haldor", t: "Haldors Stammkunde", d: "Handle 10-mal mit Haldor.", c: "Mit Haldor handeln", n: 10 },
  { id: "hinterhalt", t: "Aus dem Hinterhalt", d: "Führe 5-mal einen Hinterhalt aus.", c: "Hinterhalt", n: 5 },
  { id: "fundbuero", t: "Fundbüro Walhall", d: "Hol deine Sachen vom Grabstein zurück. Walhall war wohl noch nicht bereit für dich.", on: "Gegenstand vom Grabstein aufsammeln" },
  { id: "runenleser", t: "Runenleser", d: "Studiere Inschriften.", ext: "rache" },
  { id: "nacht", t: "Lange Nacht", d: "Erreiche Runde 20 in einer Partie." },
  { id: "feuer", t: "Gemeinsam am Feuer", d: "Spiele eine Online-Partie mit 4 Spielern." },
  { id: "veteran", t: "Veteran", d: "Starte 10 neue Partien.", c: "neuePartie", n: 10 },
  { id: "legende", t: "Lebende Legende", d: "Starte 50 neue Partien. Die Skalden singen schon von dir.", c: "neuePartie", n: 50 },
];

let ach = { u: {}, c: {}, g: {} };   // u: freigeschaltet (Zeitpunkt), c: Zähler über alle Partien, g: Zähler dieser Partie
try { const s = JSON.parse(localStorage.getItem(ACH_KEY)); if (s && typeof s === "object") ach = { u: s.u || {}, c: s.c || {}, g: s.g || {} }; } catch {}
const achSave = () => { try { localStorage.setItem(ACH_KEY, JSON.stringify(ach)); } catch {} };

// Zählt diese Aktion für dieses Handy? Online nur, wenn der eigene Spieler sie ausführt.
const achMine = idx => !(net && net.code) || (st.me != null && idx === st.me);

function achUnlock(id) {
  if (ach.u[id]) return;
  const a = ACH.find(x => x.id === id); if (!a) return;
  ach.u[id] = Date.now(); achSave();
  if (!st.achOff) achToast(a);
  renderAch();
}
function achCount(key, by = 1) { ach.c[key] = (ach.c[key] || 0) + by; achSave(); ACH.filter(a => a.c === key && ach.c[key] >= a.n).forEach(a => achUnlock(a.id)); }
function achGame(key) { ach.g[key] = (ach.g[key] || 0) + 1; achSave(); ACH.filter(a => a.g === key && ach.g[key] >= a.n).forEach(a => achUnlock(a.id)); }
function achNewGame() { ach.g = {}; achSave(); }

// Aufrufe aus Aktionen, Bauen, Würfeln und Zug beenden
function achAction(n, free, idx) {
  if (!achMine(idx)) return;
  if (free) achGame("free");
  else if (counted() >= st.per) achUnlock("runenkundig");
  if (n === "Inschriften studieren") achUnlock("runenleser");
  ACH.filter(a => a.on === n).forEach(a => achUnlock(a.id));
  if (ACH.some(a => a.c === n)) achCount(n);
}
function achBuild(f, idx) {
  if (!achMine(idx)) return;
  if (counted() >= st.per) achUnlock("runenkundig");
  if (f.ship) return achUnlock("kiel");
  if (f.garden) return achCount("Gartenbeet");
  achUnlock("valkea"); achGame("built");
}
function achRoll(idx) {
  if (!achMine(idx)) return;
  const faces = (st.roll || []).map(r => ({ d: r.d, n: DICE[r.d].faces[r.f].n }));
  if (faces.some(f => f.n === "Kritischer Treffer")) achUnlock("odin");
  if (faces.filter(f => f.d === "black" && f.n === "Kritischer Treffer").length >= 3) achUnlock("zorn");
  if (faces.length >= 4 && faces.every(f => f.n === "Leer")) achUnlock("loki");
  if (faces.some(f => f.n === "Kritisches Sammeln")) achUnlock("ernte");
  if (faces.some(f => f.n === "Lautes kritisches Sammeln")) achUnlock("laut");
}
function achEndTurn(idx) {
  if (!achMine(idx)) return;
  achUnlock("ersterZug");
  if (counted() < st.per) achUnlock("rast");   // wird vor dem Zurücksetzen der Runensteine aufgerufen
}
// Bei jedem Neuzeichnen: Erfolge, die am Spielstand hängen
function achTick() {
  if (st.round >= 20) achUnlock("nacht");
  if (net && net.code && net.status === "verbunden" && st.players.length === 4) achUnlock("feuer");
}

// ---------- Anzeige ----------
// Meldungen nacheinander zeigen, wenn mehrere Erfolge auf einmal freigeschaltet werden
const achQueue = [];
let achShowing = false;
function achToast(a) { achQueue.push(a); if (!achShowing) achNext(); }
function achNext() {
  const el = $("achToast"), a = achQueue.shift();
  if (!el || !a) { achShowing = false; return; }
  achShowing = true;
  el.innerHTML = `<span class="ach-tk">${tr("Erfolg freigeschaltet")}</span><b>${tr(a.t)}</b><span class="ach-td">${tr(a.d)}</span>`;
  el.hidden = false; void el.offsetWidth; el.classList.add("show");
  try { navigator.vibrate && navigator.vibrate(30); } catch {}
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => { el.hidden = true; achNext(); }, 350); }, 4200);
}
function renderAch() {
  const box = $("achBox"); if (!box) return;
  const ext = st.ext || {};
  const list = ACH.filter(a => !a.ext || ext[a.ext] || ach.u[a.id]);
  const got = list.filter(a => ach.u[a.id]).length;
  $("achCount").textContent = `${got}/${list.length}`;
  if ($("segAchCnt")) $("segAchCnt").textContent = `${got}/${list.length}`;
  if ($("achResetArea") && !$("achResetArea").firstChild) renderAchReset(false);
  $("achList").innerHTML = list.map(a => {
    const on = !!ach.u[a.id], i = ACH.indexOf(a);
    const prog = !on && a.n ? ` <span class="ach-prog">${Math.min(a.n, (a.c ? ach.c[a.c] : ach.g[a.g]) || 0)}/${a.n}</span>` : "";
    return `<li class="ach${on ? " on" : ""}"><div class="ach-stone"><div class="ach-rim">${runeSvg(i)}</div></div><div class="ach-tx"><b>${tr(a.t)}</b><span>${tr(a.d)}${prog}</span></div></li>`;
  }).join("");
}

// Alle Erfolge auf diesem Handy zurücksetzen (mit Rückfrage). Spielstand und Einstellungen bleiben.
function renderAchReset(confirm) {
  const box = $("achResetArea"); if (!box) return;
  box.innerHTML = confirm
    ? `<span class="confirm">${tr("Alle Erfolge auf diesem Handy zurücksetzen?")} <button class="btn danger" id="achResetYes">${tr("Ja, zurücksetzen")}</button><button class="btn" id="achResetNo">${tr("Abbrechen")}</button></span>`
    : `<button class="btn ach-reset-btn" id="achReset">${tr("Erfolge zurücksetzen")}</button>`;
}
document.addEventListener("click", e => {
  const t = e.target.closest("#achReset,#achResetYes,#achResetNo");
  if (!t) return;
  if (t.id === "achReset") return renderAchReset(true);
  if (t.id === "achResetYes") { ach = { u: {}, c: {}, g: {} }; achSave(); }
  renderAchReset(false); renderAch();
});
