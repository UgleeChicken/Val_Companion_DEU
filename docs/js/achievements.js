// Val Companion – Erfolge. Werden nur auf diesem Gerät gespeichert, nichts geht an einen Server.
// Online zählt jedes Handy nur seinen eigenen Spieler; an einem einzelnen Handy sammelt es für alle, die daran spielen.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

const ACH_KEY = "valcompanion-erfolge";
const ACH = [
  { id: "ersterZug", i: "M9 3V14L16 15L18 18V20H8L6 17V3Z M6 10H9", t: "Der erste Schritt", d: "Beende deinen ersten Zug." },
  { id: "runenkundig", i: "M7 5V19M7 9L11 7M12 5V19M12 5L16 9L12 13M17 5V19", t: "Runenkundig", d: "Verbrauche in einem Zug alle Runensteine." },
  { id: "rast", i: "M6 3H18M6 21H18M8 3L16 21M16 3L8 21", t: "Kurze Rast", d: "Beende einen Zug, ohne alle Runensteine zu verbrauchen." },
  { id: "flink", i: "M14 2L6 13H12L10 22L18 10H12Z", t: "Flinke Hände", d: "Führe in einer Partie 4 freie Aktionen aus.", g: "free", n: 4 },
  { id: "odin", i: "M2 12L12 5L22 12L12 19Z M12 9L15 12L12 15L9 12Z", t: "Odins Gunst", d: "Würfle einen kritischen Treffer." },
  { id: "zorn", i: "M5 3H19L17.5 7L19 11H5L6.5 7Z M12 11V20 M12 20V22 M10 22H14 M10.5 14H13.5", t: "Götterzorn", d: "Würfle zwei kritische Treffer in einem Wurf." },
  { id: "loki", i: "M18 3L13 4L16 7Z M15 6L7 9L16 13L7 17L13 21", t: "Lokis Scherz", d: "Würfle mit mindestens 3 Würfeln, und alle zeigen eine Leerseite." },
  { id: "ernte", i: "M12 22V4 M12 7L8 4M12 7L16 4M12 11L8 8M12 11L16 8M12 15L8 12M12 15L16 12", t: "Reiche Ernte", d: "Würfle „Kritisches Sammeln“." },
  { id: "laut", i: "M3 9V15H7L13 20V4L7 9Z M16 8L18 12L16 16 M19 5L22 12L19 19", t: "Zu laut!", d: "Würfle „Lautes kritisches Sammeln“." },
  { id: "valkea", i: "M7 2V22 M7 13H17V22 M7 7H11", t: "Valkea", d: "Baue dein erstes Möbelstück. Ganz ohne Aufbauanleitung." },
  { id: "halle", i: "M2 12L12 3L22 12 M5 10V21H19V10 M10 21V15H14V21", t: "Herr der Halle", d: "Baue 3 Möbelstücke in einer Partie.", g: "built", n: 3 },
  { id: "kiel", i: "M2 15H22L18 21H6Z M12 15V3 M12 4L18 11H12 M2 15L4 11", t: "Kiel ins Wasser", d: "Baue ein Schiff." },
  { id: "ufer", i: "M2 18L5 15L8 18L11 15L14 18L17 15L20 18 M12 12V3 M8 7L12 3L16 7", t: "Auf zu neuen Ufern", d: "Segle 5-mal los.", c: "Lossegeln", n: 5 },
  { id: "met", i: "M5 5H15V21H5Z M15 9H19V16H15 M5 9H15", t: "Metmeister", d: "Braue 5-mal Met.", c: "Met brauen", n: 5 },
  { id: "daumen", i: "M12 22V10 M12 15L5 11V6L12 10 M12 12L19 8V3L12 7", t: "Der grüne Daumen", d: "Bestelle 3-mal ein Gartenbeet.", c: "Gartenbeet", n: 3, ext: "gf" },
  { id: "koch", i: "M4 9H20L17 21H7Z M7 9V6 M17 9V6 M10 5L11 2M14 5L13 2", t: "Küchenjarl", d: "Koche 5-mal Nahrung.", c: "Nahrung kochen", n: 5 },
  { id: "gourmet", i: "M7 2V22 M4 2V8H10V2 M17 2V22 M17 2L20 7V12H17", t: "Der Gourmet", d: "Iss 3-mal gekochte Nahrung.", c: "Gekochte Nahrung essen", n: 3 },
  { id: "haldor", i: "M12 2L20 7V17L12 22L4 17V7Z M9 8V16M15 8V16M9 12H15", t: "Haldors Stammkunde", d: "Handle 10-mal mit Haldor.", c: "Mit Haldor handeln", n: 10 },
  { id: "hinterhalt", i: "M7 2L14 12L7 22Z M2 12H21 M18 9L21 12L18 15", t: "Aus dem Hinterhalt", d: "Führe 5-mal einen Hinterhalt aus.", c: "Hinterhalt", n: 5 },
  { id: "fundbuero", i: "M6 22V9L12 3L18 9V22Z M12 9V17 M9 12H15", t: "Fundbüro Walhall", d: "Hol deine Sachen vom Grabstein zurück. Walhall war wohl noch nicht bereit für dich.", on: "Gegenstand vom Grabstein aufsammeln" },
  { id: "runenleser", i: "M5 2H19V22H5Z M9 6V12M9 7L12 9 M15 13V19M13 15L15 13L17 15", t: "Runenleser", d: "Studiere Inschriften.", ext: "rache" },
  { id: "nacht", i: "M14 2L7 5L4 12L7 19L14 22L10 16L9 12L10 8Z M19 4V10M16 7H22", t: "Lange Nacht", d: "Spiele eine Partie mit mindestens 20 Zügen, fast bis der Ereignisstapel leer ist." },
  { id: "feuer", i: "M4 21L20 16M4 16L20 21 M12 15L8 10L12 2L16 10Z", t: "Gemeinsam am Feuer", d: "Spiele eine Online-Partie mit 4 Spielern." },
  { id: "drengr", i: "M12 2L19 5L22 12L19 19L12 22L5 19L2 12L5 5Z M12 9L15 12L12 15L9 12Z M12 2V9M12 15V22M2 12H9M15 12H22", t: "Drengr", d: "Starte 3 neue Partien. Ein junger Krieger auf seinem Weg.", c: "neuePartie", n: 3 },
  { id: "veteran", i: "M12 2L14.5 5V15H9.5V5Z M12 5V13 M6 15H18 M12 15V20 M9.5 22H14.5L12 20Z", t: "Huskarl", d: "Starte 10 neue Partien. Der Jarl vertraut dir sein Leben an.", c: "neuePartie", n: 10 },
  { id: "legende", i: "M7 18V12L9 8.5L12 7.5L15 8.5L17 12V18 M7 12.5H17 M12 12.5V20 M7 11L5 6L1.5 3L2.5 7L1 9.5L3 11.5L2.5 13.5L7 14.5 M17 11L19 6L22.5 3L21.5 7L23 9.5L21 11.5L21.5 13.5L17 14.5", t: "Einherjer", d: "Starte 25 neue Partien. Die Skalden singen schon von dir, und in Walhall ist ein Platz für dich frei.", c: "neuePartie", n: 25 },
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
  if (faces.filter(f => f.n === "Kritischer Treffer").length >= 2) achUnlock("zorn");
  if (faces.length >= 3 && faces.every(f => f.n === "Leer")) achUnlock("loki");
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
  // Gespielte Züge dieser Partie (alle Spieler zusammen); eine Partie hat je nach Spielerzahl 21 bis 24 Züge
  if ((st.round - 1) * st.players.length + st.current >= 20) achUnlock("nacht");
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
    const val = !on && a.n ? Math.min(a.n, (a.c ? ach.c[a.c] : ach.g[a.g]) || 0) : 0;
    const prog = !on && a.n ? ` <span class="ach-prog">${val}/${a.n}</span>` : "";
    // Angefangene Erfolge: goldener Rand wächst mit dem Fortschritt um den Stein
    const part = val > 0 ? ` part" style="--p:${(val / a.n).toFixed(3)}` : "";
    return `<li class="ach${on ? " on" : ""}${part}"><div class="ach-stone"><div class="ach-rim"><svg class="rune ach-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${a.i}"/></svg></div></div><div class="ach-tx"><b>${tr(a.t)}</b><span>${tr(a.d)}${prog}</span></div></li>`;
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
