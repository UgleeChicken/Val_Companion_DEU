// Val Companion – Zahlen der laufenden Partie (Würfel, Aktionen) für den Rückblick beim Start einer neuen Partie.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.
// Die Zahlen liegen in st.stat und werden bei einer Online-Partie wie der übrige Spielstand geteilt.

const newStat = () => ({ t0: Date.now(), n: 0, x: 0, d: {}, p: {}, a: 0, fr: 0, sh: 0 });
function stat() { if (!st.stat || typeof st.stat !== "object" || !st.stat.p) st.stat = newStat(); return st.stat; }
// Nur lesen, für Anzeige und Rückblick: legt nichts im Spielstand an
const statView = () => (st.stat && typeof st.stat === "object" && st.stat.p) ? st.stat : newStat();
const statP = i => { const s = stat(); return (s.p[i] = s.p[i] || { r: 0, x: 0, e: 0, k: 0, a: 0 }); };

// Wurf (alle Würfel) oder Neuwurf eines einzelnen Würfels
function statRoll(rolls, idx, single) {
  const s = stat(), p = statP(idx);
  if (!single) { s.n++; p.r++; }
  for (const r of rolls) {
    const f = DICE[r.d]?.faces?.[r.f]; if (!f) continue;
    const d = (s.d[r.d] = s.d[r.d] || {});
    d[f.n] = (d[f.n] || 0) + 1; s.x++; p.x++;
    if (f.n === "Leer") p.e++;
    if (f.n === "Kritischer Treffer") p.k++;
  }
}
// Am Zugende: genutzte Aktionen dieses Zuges zählen (Rückgängig ist dann schon berücksichtigt)
function statTurn(idx, used) {
  const s = stat(), p = statP(idx);
  s.a += used.length; p.a += used.length;
  s.fr += used.filter(u => u.free).length;
  s.sh += used.filter(u => u.n === "Schiff bauen").length;
}
// Freie Aktion eines anderen Spielers während des Zuges
function statFree(idx) { const s = stat(); s.a++; s.fr++; statP(idx).a++; }

// ---------- Rückblick ----------
function recapHtml() {
  const s = statView();
  const turns = (st.round - 1) * st.players.length + st.current;
  const acts = s.a + st.used.length;
  const ships = s.sh + st.used.filter(u => u.n === "Schiff bauen").length;
  if (!acts && !s.n && !turns) return "";
  const pa = i => (s.p[i]?.a || 0) + (i === st.current ? st.used.length : 0);
  // Ehrentitel: nur bei mehreren Spielern und eindeutigen Werten
  const best = (val, min = 1) => {
    const v = st.players.map((_, i) => val(i));
    const m = Math.max(...v);
    if (!(m >= min)) return null;
    const who = st.players.map((n, i) => v[i] === m ? `<b style="color:${pc(i)}">${esc(n)}</b>` : null).filter(Boolean);
    return who.length < st.players.length ? { who: who.join(" & "), m } : null;
  };
  const honors = [];
  if (st.players.length > 1) {
    const h1 = best(pa, 1); if (h1) honors.push(tf(h1.m === 1 ? "Fleißigste Hand: {w} mit 1 Aktion" : "Fleißigste Hand: {w} mit {n} Aktionen", { w: h1.who, n: h1.m }));
    const h2 = best(i => (s.p[i]?.x >= 6 ? s.p[i].e / s.p[i].x : 0), 0.01);
    if (h2) honors.push(tf("Pechvogel: {w} mit {p} % leeren Würfeln", { w: h2.who, p: Math.round(h2.m * 100) }));
    const h3 = best(i => s.p[i]?.k || 0, 1); if (h3) honors.push(tf(h3.m === 1 ? "Am härtesten getroffen: {w} mit 1 kritischen Treffer" : "Am härtesten getroffen: {w} mit {n} kritischen Treffern", { w: h3.who, n: h3.m }));
  }
  const built = (st.built || []).map(k => tr(furnName(k)));
  const blank = Object.values(s.p).reduce((a, p) => a + (p.e || 0), 0);
  const tiles = [[st.round, "Runden"], [turns, "Züge"], [acts, "Aktionen"], [s.n, "Würfe"]]
    .map(([n, l]) => `<div class="rc-tile"><b>${n}</b><span>${tr(l)}</span></div>`).join("");
  const lines = [];
  if (built.length) lines.push(`<b>${tr("Gebaut")}:</b> ${built.join(", ")}`);
  if (ships) lines.push(tf(ships === 1 ? "<b>1</b> Schiff gebaut" : "<b>{n}</b> Schiffe gebaut", { n: ships }));
  if (s.fr) lines.push(tf("<b>{n}</b> freie Aktionen", { n: s.fr }));
  if (s.x) lines.push(tf("<b>{x}</b> Würfel geworfen, davon {e} leer", { x: s.x, e: blank }));
  const achNew = (typeof ACH !== "undefined" && !st.achOff) ? ACH.filter(a => s.t0 && ach.u[a.id] >= s.t0).map(a => tr(a.t)) : [];
  return `<div class="intro-card recap" role="dialog" aria-modal="true" aria-labelledby="recapT">
    <h2 id="recapT">${tr("Rückblick")}</h2>
    <p class="intro-lead">${tr("So lief eure letzte Partie.")}</p>
    <div class="rc-tiles">${tiles}</div>
    ${lines.length ? `<ul class="intro-list">${lines.map(l => `<li>${l}</li>`).join("")}</ul>` : ""}
    ${honors.length ? `<h3 class="rc-h">${tr("Ehrentitel")}</h3><ul class="intro-list">${honors.map(l => `<li>${l}</li>`).join("")}</ul>` : ""}
    ${achNew.length ? `<h3 class="rc-h">${tr("Neue Erfolge")}</h3><p class="rc-ach">${achNew.join(" · ")}</p>` : ""}
    <div class="intro-row"><span></span><button class="btn primary" id="recapOk">${tr("Neue Partie starten")}</button></div></div>`;
}
function showRecap(html) {
  const box = $("recap"); if (!box || !html) return;
  box.innerHTML = html; box.hidden = false; $("recapOk").focus();
}
document.addEventListener("click", e => {
  const box = $("recap"); if (!box || box.hidden) return;
  if (e.target.closest("#recapOk") || e.target === box) { box.hidden = true; box.innerHTML = ""; }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("recap") && !$("recap").hidden) $("recapOk").click(); });
