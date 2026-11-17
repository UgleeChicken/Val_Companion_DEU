// Val Companion – Würfeln: Würfel, Auswahl, Wurf, Neuwurf.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

// ---------- Würfeln ----------
const HAND = '<use href="#i-hand"/>';
const DICE = {
  red:    { name: "Roter Angriffswürfel", short: "rot", cls: "d-red", icon: '<use href="#i-axe"/>', faces: [
    { n: "1 Axt", svg: '<use href="#i-axe"/>' },
    { n: "1 Axt", svg: '<use href="#i-axe"/>' },
    { n: "1 Axt", svg: '<use href="#i-axe"/>' },
    { n: "1 Axt", svg: '<use href="#i-axe"/>' },
    { n: "2 Äxte", svg: '<use href="#i-axe" transform="translate(-1 -1) scale(.6)"/><use href="#i-axe" transform="translate(10 10) scale(.6)"/>' },
    { n: "Leer", svg: "" },
  ] },
  yellow: { name: "Gelber Angriffswürfel", short: "gelb", cls: "d-yellow", icon: '<use href="#i-axe"/>', faces: [
    { n: "1 Axt", svg: '<use href="#i-axe"/>' },
    { n: "1 Axt", svg: '<use href="#i-axe"/>' },
    { n: "1 Axt", svg: '<use href="#i-axe"/>' },
    { n: "2 Äxte", svg: '<use href="#i-axe" transform="translate(-1 -1) scale(.6)"/><use href="#i-axe" transform="translate(10 10) scale(.6)"/>' },
    { n: "Leer", svg: "" },
    { n: "Leer", svg: "" },
  ] },
  blue:   { name: "Blauer Verteidigungswürfel", short: "blau", cls: "d-blue", icon: '<use href="#i-shield"/>', faces: [
    { n: "1 Schild", svg: '<use href="#i-shield"/>' },
    { n: "1 Schild", svg: '<use href="#i-shield"/>' },
    { n: "1 Schild", svg: '<use href="#i-shield"/>' },
    { n: "2 Schilde", svg: '<use href="#i-shield" transform="translate(-1 -1) scale(.6)"/><use href="#i-shield" transform="translate(10 10) scale(.6)"/>' },
    { n: "Leer", svg: "" },
    { n: "Leer", svg: "" },
  ] },
  black:  { name: "Schadenswürfel", short: "schwarz", cls: "d-black", icon: '<use href="#i-claw"/>', faces: [
    { n: "Treffer", svg: '<use href="#i-claw"/>' },
    { n: "Treffer", svg: '<use href="#i-claw"/>' },
    { n: "Kritischer Treffer", svg: '<use href="#i-claw" transform="translate(9 0) rotate(30 6 6) scale(.5)"/><use href="#i-claw" transform="translate(3 11) rotate(30 6 6) scale(.5)"/>' },
    { n: "Spezialeffekt", svg: '<use href="#i-bang"/>' },
    { n: "Leer", svg: "" },
    { n: "Leer", svg: "" },
  ] },
  green:  { name: "Sammelwürfel", short: "grün", cls: "d-green", icon: HAND, faces: [
    { n: "Sammeln", svg: HAND },
    { n: "Sammeln", svg: HAND },
    { n: "Sammeln", svg: HAND },
    { n: "Lautes Sammeln", svg: '<use href="#i-hand" transform="translate(-1 1) scale(.82)"/><use href="#i-bang" transform="translate(13 4) scale(.5)"/>' },
    { n: "Lautes kritisches Sammeln", svg: '<use href="#i-hand" transform="translate(-1 -1) scale(.55)"/><use href="#i-bang" transform="translate(8.5 7) scale(.45)"/><use href="#i-hand" transform="translate(11 11) scale(.55)"/>' },
    { n: "Kritisches Sammeln", svg: '<use href="#i-hand" transform="translate(-1 -1) scale(.6)"/><use href="#i-hand" transform="translate(10 10) scale(.6)"/>' },
  ] },
};
// Würfel im Spiel: so viele gibt es von jeder Sorte. In den Einstellungen lässt sich die Zahl erhöhen.
const DICE_MAX = { red: 2, yellow: 2, blue: 2, black: 3, green: 1 };
const maxDice = k => (DICE_MAX[k] || 1) + (st.diceExtra | 0);
let tumble = new Set();

function diceState() {
  if (!st.pool || typeof st.pool !== "object") st.pool = {};
  for (const k in DICE) if (!DICE[k].faces || typeof st.pool[k] !== "number") st.pool[k] = DICE[k].faces ? (st.pool[k] | 0) : 0;
  if (!Array.isArray(st.roll)) st.roll = [];
  st.roll = st.roll.filter(r => DICE[r.d]?.faces?.[r.f]);
}
function rnd(n) {
  try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  catch { return Math.floor(Math.random() * n); }
}
const faceHtml = (d, inner, extra = "") =>
  `<span class="face ${DICE[d].cls}${inner ? "" : " blank"}${extra}"><svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg></span>`;

function rollSummary(rolls) {
  const out = [];
  for (const k in DICE) {
    const counts = {};
    rolls.filter(r => r.d === k).forEach(r => { const n = DICE[k].faces[r.f].n; counts[n] = (counts[n] || 0) + 1; });
    for (const n in counts) out.push({ n, c: counts[n], d: k });
  }
  return out;
}

function renderDice() {
  diceState();
  for (const k in st.pool) if (DICE[k] && st.pool[k] > maxDice(k)) st.pool[k] = maxDice(k);
  $("pool").innerHTML = Object.entries(DICE).map(([k, d]) => `
    <div class="dp ${d.faces ? "" : "off"}">
      ${faceHtml(k, d.icon)}
      <span class="nm">${tr(d.name)}</span>
      <span class="stepper">
        <button data-dm="${k}" aria-label="${tf("{d} weniger", { d: tr(d.name) })}" ${!d.faces || !st.pool[k] ? "disabled" : ""}>−</button>
        <span>${st.pool[k]}<small class="dmax">/${maxDice(k)}</small></span>
        <button data-dp="${k}" aria-label="${tf("{d} mehr", { d: tr(d.name) })}" ${!d.faces || st.pool[k] >= maxDice(k) ? "disabled" : ""}>+</button>
      </span>
    </div>`).join("");
  const total = Object.values(st.pool).reduce((a, b) => a + b, 0);
  $("rollBtn").disabled = total === 0;
  $("rollBtn").textContent = total ? tf(total === 1 ? "1 Würfel werfen" : "{n} Würfel werfen", { n: total }) : tr("Würfel wählen");
  $("poolClear").disabled = total === 0 && st.roll.length === 0;
  $("result").innerHTML = st.roll.map((r, i) => {
    const f = DICE[r.d].faces[r.f];
    return `<button class="face ${DICE[r.d].cls}${f.svg ? "" : " blank"}" data-rr="${i}" aria-label="${tf("{d}: {f} – neu werfen", { d: tr(DICE[r.d].name), f: tr(f.n) })}" title="${tf("{f} · antippen zum Neuwurf", { f: tr(f.n) })}"><svg viewBox="0 0 24 24" aria-hidden="true">${f.svg}</svg></button>`;
  }).join("");
  const anim = [...tumble];
  tumble = new Set();
  renderTotals();
  if (anim.length) requestAnimationFrame(() => animateRoll(anim));
  $("summary").innerHTML = rollSummary(st.roll).map(s => `<li><span class="sd ${DICE[s.d].cls}" title="${tr(DICE[s.d].name)}"></span><b>${s.c}×</b> ${tr(s.n)}</li>`).join("");
  $("diceHint").textContent = st.roll.length
    ? tr("Einzelnen Würfel antippen, um ihn neu zu werfen (z. B. mit einem Neuwurfplättchen).")
    : tr("Würfel auswählen und werfen. Das Ergebnis erscheint auch im Protokoll.");
}

function rollAll() {
  diceState();
  st.roll = [];
  for (const k in DICE) for (let i = 0; i < st.pool[k]; i++) st.roll.push({ d: k, f: rnd(DICE[k].faces.length) });
  tumble = new Set(st.roll.map((_, i) => i));
  achRoll(actorIdx());
  log({ k: "roll", w: actorName(), i: rollSummary(st.roll).map(s => ({ c: s.c, f: s.n, d: s.d })) }, "f", actorIdx());
  st.log[0].dice = true;
  render();
}

function reroll(i) {
  const r = st.roll[i]; if (!r) return;
  const before = DICE[r.d].faces[r.f].n;
  r.f = rnd(DICE[r.d].faces.length);
  tumble = new Set([i]);
  achRoll(actorIdx());
  log({ k: "reroll", w: actorName(), d: r.d, a: before, b: DICE[r.d].faces[r.f].n }, "f", actorIdx());
  st.log[0].dice = true;
  render();
}

document.addEventListener("click", e => {
  const t = e.target.closest("[data-dp],[data-dm],[data-rr],#rollBtn,#poolClear");
  if (!t) return;
  diceState();
  if (t.dataset.dp) { st.pool[t.dataset.dp] = Math.min(maxDice(t.dataset.dp), st.pool[t.dataset.dp] + 1); return render(); }
  if (t.dataset.dm) { st.pool[t.dataset.dm] = Math.max(0, st.pool[t.dataset.dm] - 1); return render(); }
  if (t.dataset.rr) return reroll(+t.dataset.rr);
  if (t.id === "rollBtn") return rollAll();
  if (t.id === "poolClear") { for (const k in st.pool) st.pool[k] = 0; st.roll = []; return render(); }
});

// Summe des Wurfs. Die einzelnen Würfel und Ergebnisse bleiben darüber und darunter sichtbar.
// Kritische Ergebnisse zählen 2, wie im Regelheft. Boni von Ausrüstung sind nicht eingerechnet.
const FACE_VALUE = {
  "1 Axt": ["att", 1], "2 Äxte": ["att", 2],
  "1 Schild": ["def", 1], "2 Schilde": ["def", 2],
  "Treffer": ["dmg", 1], "Kritischer Treffer": ["dmg", 2], "Spezialeffekt": ["spec", 1],
  "Sammeln": ["col", 1], "Lautes Sammeln": ["col", 1, "noise"], "Lautes kritisches Sammeln": ["col", 2, "noise"], "Kritisches Sammeln": ["col", 2],
};
const TOTAL_LABELS = [["att", "Angriff"], ["def", "Verteidigung"], ["dmg", "Schaden"], ["spec", "Spezialeffekt"], ["col", "Sammeln"], ["noise", "Laut (!)"]];
function renderTotals() {
  const box = $("totals"); if (!box) return;
  const sum = {}, kinds = new Set();
  for (const r of st.roll || []) {
    const f = DICE[r.d] && DICE[r.d].faces[r.f]; if (!f) continue;
    const kind = { red: "att", yellow: "att", blue: "def", black: "dmg", green: "col" }[r.d]; kinds.add(kind);
    const v = FACE_VALUE[f.n]; if (!v) continue;
    sum[v[0]] = (sum[v[0]] || 0) + v[1];
    if (v[2]) sum[v[2]] = (sum[v[2]] || 0) + 1;
  }
  const items = TOTAL_LABELS.filter(([k]) => kinds.has(k) || sum[k]).map(([k, l]) =>
    `<span class="tot tot-${k}"><b>${sum[k] || 0}</b> ${tr(l)}</span>`);
  box.hidden = !items.length;
  box.innerHTML = items.length ? `<span class="tot-l">${tr("Summe")}</span>${items.join("")}` : "";
}

// Würfel-Animation: Jeder Würfel rollt sanft mit einer leichten Drehung ein, leicht versetzt nacheinander.
// Die Summe blendet erst ein, wenn alle liegen. Bei „Bewegung reduzieren“ steht das Ergebnis sofort da.
function animateRoll(idx) {
  const tot = $("totals");
  if (!idx.length || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  tot.classList.add("pending");
  let done = 0;
  const finish = () => { if (++done === idx.length) { tot.classList.remove("pending"); try { navigator.vibrate && navigator.vibrate(15); } catch {} } };
  idx.forEach((i, n) => {
    const el = document.querySelector(`#result [data-rr="${i}"]`);
    if (!el) return finish();
    el.style.setProperty("--rot", (rnd(2) ? 1 : -1) * (60 + rnd(60)) + "deg");
    el.style.setProperty("--delay", n * 90 + "ms");
    let ended = false;
    const end = () => { if (ended) return; ended = true; el.classList.remove("roll-in"); finish(); };
    el.addEventListener("animationend", end, { once: true });
    setTimeout(end, 600 + n * 90 + 200);
    el.classList.add("roll-in");
  });
}
