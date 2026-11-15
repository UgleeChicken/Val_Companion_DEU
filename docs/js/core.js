// Val Companion – Spielstand, Aktionen, Zug, Spieler und Darstellung des Reiters Zug.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

const ACTIONS = [
  { n: "Bewegen", s: "Bis zu 2 Felder, unerforschte Plättchen aufdecken", i: "move" },
  { n: "Ressourcen sammeln", s: "Sammelwürfel werfen, vom derzeitigen Feld einsammeln", i: "hand" },
  { n: "Ausrüstung tauschen", s: "Karten oder Verbrauchsgegenstände mit Charakteren auf deinem Feld", i: "swap" },
  { n: "Schiff bauen", s: "Angrenzend zu Wasser · öffnet den Reiter Bauen", s2: "Angrenzend zu Wasser: Ressourcen zahlen", i: "ship" },
  { n: "Lossegeln", s: "Zu einem Feld am selben Gewässer", i: "sail" },
  { n: "Mit Haldor handeln", s: "Münzen zahlen für Karten oder Ressourcen · vom Haus aus +1 Münze", i: "bag" },
  { n: "Hinterhalt", s: "Fernkampfwaffe gegen angrenzende Kreatur", i: "bow" },
  { n: "Inschriften studieren", s: "Auf einem Altarfeld: 1 Münze, 1 verdeckte Runenkarte aufdecken", i: "runecard", ext: "rache" },
  { n: "Sonstige", s: "Andere Aktion", i: "dots" },
  { n: "Möbelstück herstellen", s: "Möbelstück wählen · öffnet den Reiter Bauen", s2: "Ressourcen zahlen, aufs Haustableau", i: "hammer", h: 1 },
  { n: "Ausrüstung herstellen", s: "Ressourcen zahlen, aufs Charaktertableau", i: "anvil", h: 1 },
  { n: "Nahrung kochen", s: "Oberste Nahrungskarte aufdecken", i: "pot", h: 1 },
  { n: "Gekochte Nahrung essen", s: "Nahrungskarte abwerfen: Lebenspunkte, Ausdauer oder Neuwurfplättchen", i: "meat", h: 1 },
  { n: "Werkzeug oder Waffe entzünden", s: "Feuertisch: 1 Harz, dauerhaft 1 Feuer", i: "fire", h: 1, req: "feuertisch" },
  { n: "Met brauen", s: "Fermentierer: 1 Met deiner Wahl aufs Charaktertableau", i: "mead", h: 1, req: "fermentierer" },
  { n: "Eine Bombe basteln", s: "Bombentisch: 1 Bombe deiner Wahl aufs Charaktertableau", i: "bomb", h: 1, req: "bombentisch" },
  { n: "Gartenbeet bestellen", s: "Gartenharke nötig: 1 Holz, Gartenbeet wählen · öffnet den Reiter Bauen", s2: "Gartenharke nötig: 1 Holz, 1 Gartenbeet über die gekochte Nahrung legen", i: "sprout", h: 1, ext: "gf" },
  { n: "Nach den Bienen sehen", s: "Bienenstock: 1 zufällige Honigwabe · 1× pro Zug", i: "bees", h: 1, once: 1, req: "bienenstock" },
  { n: "Verbrauchsgegenstand nutzen", s: "1 Met oder 1 Honigwabe abwerfen, Belohnung erhalten", i: "drop", free: true },
  { n: "Mit Plättchen interagieren", s: "Jederzeit mit Plättchen auf deinem Feld", i: "token", free: true },
  { n: "Eine Bombe werfen", s: "Im Kampf: Bombe abwerfen, angegebene Würfel werfen", i: "bomb", free: true },
  { n: "Ausrüstung zerlegen", s: "Nur im Haus: Karte zurück, 1 Ressource der Kosten · 1× pro Zug", i: "dismantle", free: true, once: 1 },
  { n: "Macht Odins nutzen", s: "Ausdauer abgeben, auch außerhalb deines Zuges", i: "odin", free: true },
  { n: "Freigespielte Aufwertung nutzen", s: "Angegebene Kosten zahlen, falls vorhanden", i: "up", free: true },
  { n: "Effekt einer Ausrüstung nutzen", s: "Manche Ausrüstung: 1× pro Zug eine freie Aktion", i: "spark", free: true },
  { n: "Unterstützung im Kampf", s: "Im Zug eines anderen: 1 Ausdauer, zu einem Kampf in Bewegungsreichweite", i: "swords", free: true },
  { n: "Mitsegeln", s: "Im Zug eines anderen: 1 Ausdauer, auf ein Schiff, das gleich lossegelt", i: "sail", free: true },
  { n: "Gegenstand vom Grabstein aufsammeln", s: "Gegenstand nehmen, Grabstein dem Charakter zurückgeben", i: "grave", free: true },
  { n: "Truhe erbeuten", s: "Truhe auf deinem Feld aufdecken und nehmen, Inhalt erhalten", i: "chest", free: true },
];

const COLORS = [
  { name: "Rot", c: "#e0564b" },
  { name: "Blau", c: "#5b9be6" },
  { name: "Grün", c: "#6fc152" },
  { name: "Gelb", c: "#e8c53e" },
];
const KEY = "valcompanion-v1";
// Spielstand aus der Zeit vor der Umbenennung übernehmen
try { if (!localStorage.getItem(KEY) && localStorage.getItem("valheim-aktionszaehler-v1")) localStorage.setItem(KEY, localStorage.getItem("valheim-aktionszaehler-v1")); } catch {}
const fresh = () => ({
  players: ["Ragnhild", "Torvald"],
  colors: [0, 1], colorsV: 2,
  current: 0, round: 1, per: 3, used: [], log: [],
});
let st;
let FIRST_RUN = false;
try { FIRST_RUN = !localStorage.getItem(KEY) && !localStorage.getItem("valcompanion-intro"); } catch {}
try { st = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { st = fresh(); }
// Farben-Version 2: Rot, Blau, Grün, Gelb nach Sitzplatz (ältere Spielstände werden umgestellt)
if (!Array.isArray(st.colors) || st.colorsV !== 2) { st.colors = st.players.map((_, i) => i % COLORS.length); st.colorsV = 2; }
st.players.forEach((_, i) => { if (!(st.colors[i] >= 0 && st.colors[i] < COLORS.length)) st.colors[i] = freeColor(i); });
function freeColor(skip) {
  const taken = st.colors.filter((_, i) => i !== skip);
  const f = COLORS.findIndex((_, k) => !taken.includes(k));
  return f < 0 ? 0 : f;
}
const pc = i => COLORS[st.colors[i] ?? 0].c;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} if (typeof schedulePush === "function") schedulePush(); };

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ"];
const name = () => st.players[st.current] || "Spieler";
const counted = () => st.used.filter(a => !a.free).length;

function log(text, cls = "", p = st.current) {
  st.log.unshift(Object.assign({ t: `R${st.round}`, cls, p }, typeof text === "string" ? { text } : text));
  st.log = st.log.slice(0, 120);
}

function doAction(i) {
  const a = ACTIONS[i];
  if (!a.free && locked()) return;
  if (a.free && isOther()) { log({ k: "act", w: actorName(), x: a.n, f: 1 }, "f", actorIdx()); render(); return feedback(i, true); }
  if (!a.free && counted() >= st.per) return;
  if (a.once && st.used.some(u => u.n === a.n)) return;
  if (a.req && !(st.built || []).includes(a.req)) return;
  st.used.push({ n: a.n, free: !!a.free });
  log(a.free ? { k: "act", w: name(), x: a.n, f: 1 } : { k: "act", w: name(), x: a.n, c: counted(), m: st.per }, a.free ? "f" : "");
  render();
  feedback(i, !!a.free);
}

function undo() {
  if (locked()) return;
  const a = st.used.pop();
  if (!a) return;
  if (a.build) st.built = st.built.filter(k => k !== a.build);
  const li = st.log.findIndex(l => !l.dice);
  if (li >= 0) st.log.splice(li, 1);
  render();
}

function endTurn() {
  if (locked()) return;
  log({ k: "end", w: name(), c: counted(), m: st.per }, "e");
  st.used = [];
  st.current = (st.current + 1) % st.players.length;
  if (st.current === 0) { st.round++; log({ k: "round", r: st.round }, "e"); }
  render();
}

function render() {
  document.documentElement.classList.toggle("big-text", !!st.bigText);
  if ($("bigText")) $("bigText").checked = !!st.bigText;
  if (!Array.isArray(st.built)) st.built = [];
  if (st.current >= st.players.length) st.current = 0;
  $("round").textContent = st.round;
  document.documentElement.style.setProperty("--pc", pc(st.current));
  $("per").textContent = st.per;
  $("diceExtra").textContent = st.diceExtra | 0;
  $("dxMinus").disabled = !(st.diceExtra | 0); $("dxPlus").disabled = (st.diceExtra | 0) >= 5;

  $("players").innerHTML = st.players.map((p, i) => `
    <div class="player ${i === st.current ? "active" : ""}" style="--pc:${pc(i)}">
      <button class="dot" data-col="${i}" aria-label="${tf("Farbe von {p} wechseln ({c})", { p: esc(p), c: tr(COLORS[st.colors[i]].name) })}" title="${tf("Farbe wechseln: {c}", { c: tr(COLORS[st.colors[i]].name) })}"></button>
      <input id="pl${i}" value="${esc(p)}" aria-label="${tf("Name Spieler {n}", { n: i + 1 })}" data-i="${i}">
      ${st.players.length > 1 ? `<button class="rm" data-rm="${i}" aria-label="${tr("Spieler entfernen")}">×</button>` : ""}
    </div>`).join("") + (st.players.length < 4 ? `<button class="add" id="addP">${tr("+ Spieler")}</button>` : "");

  $("who").textContent = net.code && st.me === st.current && !st.allowAll ? tf("Du bist am Zug, {n}!", { n: name() }) : tf("{n} ist am Zug", { n: name() });
  const c = counted();
  $("pips").innerHTML = Array.from({ length: st.per }, (_, i) =>
    `<div class="pip ${i < c ? "used" : ""}" role="button" tabindex="0" data-pip="${i}" aria-label="${tf("Aktion {n}", { n: i + 1 })}">${RUNES[i % RUNES.length]}</div>`).join("");
  const left = st.per - c;
  $("left").className = "left" + (left === 0 ? " zero" : "");
  $("left").innerHTML = left === 0
    ? tr("<b>0</b> Aktionen übrig – Zug beenden")
    : tf(left === 1 ? "<b>{n}</b> Aktion übrig" : "<b>{n}</b> Aktionen übrig", { n: left });
  $("undo").disabled = st.used.length === 0 || locked();
  $("end").disabled = locked();
  // Schmale Leiste oben (erscheint, wenn die große Leiste aus dem Bild gescrollt ist)
  $("mbWho").textContent = name();
  $("mbPips").innerHTML = Array.from({ length: st.per }, (_, i) => `<i class="${i < c ? "used" : ""}"></i>`).join("");
  $("mbUndo").disabled = $("undo").disabled; $("mbEnd").disabled = $("end").disabled;

  if (!st.closed || typeof st.closed !== "object") st.closed = {};
  const actBtn = (a, i) => `<button class="act ${a.free ? "free" : ""}" data-a="${i}" ${(!a.free && locked()) || (!a.free && left === 0) || (a.once && st.used.some(u => u.n === a.n)) || (a.req && !st.built.includes(a.req)) ? "disabled" : ""} ${a.req && !st.built.includes(a.req) ? `title="${tf("Erst {f} bauen", { f: tr(furnName(a.req)) })}"` : a.h ? `title="${tr("Nur im Haus")}"` : ""}>
       <svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${a.i}"/></svg>
       <span class="n">${tr(a.n)}</span><span class="s${a.req && !st.built.includes(a.req) ? " req" : ""}">${a.req && !st.built.includes(a.req) ? tf("Erst {f} bauen", { f: tr(furnName(a.req)) }) : tr(a.s2 && st.autoBuild === false ? a.s2 : a.s)}</span></button>`;
  const grpOf = a => a.free ? "free" : a.h ? "house" : "any";
  const GROUPS = [
    ["any", tr("Überall möglich"), ""],
    ["house", `<svg class="hs" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-house"/></svg> ${tr("Nur im eigenen Haus")}`, ""],
    ["free", tf("Freie Aktionen · zählen nicht zu den {n} Aktionen", { n: st.per }), " grp-free"],
  ];
  if (!st.seg || typeof st.seg !== "object") st.seg = {};
  const cur = ["any", "house", "free"].includes(st.seg.act) ? st.seg.act : "any";
  const visible = g => ACTIONS.map((a, i) => [a, i]).filter(([a]) => grpOf(a) === g && (!a.ext || (st.ext || {})[a.ext]));
  const SEGS = [["any", tr("Überall")], ["house", `<svg class="hs" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-house"/></svg>${tr("Im Haus")}`], ["free", tr("Frei")]];
  const hint = cur === "free" ? tf("Freie Aktionen · zählen nicht zu den {n} Aktionen", { n: st.per }) : cur === "house" ? tr("Nur im eigenen Haus") : "";
  $("actions").innerHTML = `<div class="seg seg-act" role="tablist">${SEGS.map(([g, l]) =>
      `<button class="seg-b${g === "free" ? " seg-free" : ""}" data-seg="act" data-val="${g}" role="tab" aria-pressed="${g === cur}">${l}<span class="cnt">${visible(g).length}</span></button>`).join("")}</div>` +
    (hint ? `<div class="seg-hint${cur === "free" ? " grp-free" : ""}">${hint}</div>` : "") +
    visible(cur).map(([a, i]) => actBtn(a, i)).join("");
  $("actions").classList.toggle("nodesc", !st.desc);
  $("descT").checked = !!st.desc;
  $("autoDiceT").checked = st.autoDice !== false;
  $("autoBuildT").checked = st.autoBuild !== false;
  $("extRache").checked = !!(st.ext && st.ext.rache);
  document.querySelectorAll(".ext-rache").forEach(el => { el.hidden = !(st.ext && st.ext.rache); });
  document.querySelectorAll(".ext-gf").forEach(el => { el.hidden = !(st.ext && st.ext.gf); });
  $("extGf").checked = !!(st.ext && st.ext.gf);
  if ($("actOpts").open !== !!st.optsOpen) $("actOpts").open = !!st.optsOpen;
  const l0 = st.log[0];
  $("lastLog").innerHTML = l0 ? `<span class="pd" style="--pc:${pc(l0.p ?? 0)}"></span><span class="lt">${tr("Zuletzt")}: ${esc(logText(l0))}</span><span class="chev4" aria-hidden="true">${st.logOpen ? "▾" : "▸"}</span>` : "";
  $("lastLog").setAttribute("aria-expanded", String(!!st.logOpen));
  $("lastList").hidden = !(l0 && st.logOpen);
  $("lastList").innerHTML = st.logOpen ? st.log.slice(1, 6).map(l => `<div class="ll"><span class="pd" style="--pc:${pc(l.p ?? 0)}"></span><span>${esc(logText(l))}</span></div>`).join("") +
    `<button class="ll-all" id="logAll">${tr("Ganzes Protokoll")} →</button>` : "";
  $("lastLog").hidden = !l0;

  $("log").innerHTML = st.log.length
    ? st.log.map(l => `<li><span class="t">${esc(l.t)}</span><span class="pd" style="--pc:${pc(l.p ?? 0)}"></span><span class="${["f", "e"].includes(l.cls) ? l.cls : ""}">${esc(logText(l))}</span></li>`).join("")
    : `<li class="empty">${tr("Noch keine Aktionen. Wähle oben eine Aktion aus.")}</li>`;
  renderDice();
  renderFurniture();
  renderTabs();
  renderSegs();
  if (typeof renderOnline === "function") { renderOnline(); renderSeat(); }
  save();
}

document.addEventListener("click", e => {
  const t = e.target.closest("[data-a],[data-pip],[data-rm],[data-col],#addP,#undo,#end,#perMinus,#perPlus,#dxMinus,#dxPlus,#reset,#resetYes,#resetNo");
  if (!t) return;
  if (t.dataset.a) {
    const a = ACTIONS[+t.dataset.a];
    if (GOES_TO_BUILD.includes(a.n) && st.autoBuild !== false) return goTab("bauen");
    const top = st.log[0];
    doAction(+t.dataset.a);
    // Ressourcen sammeln: gleich zum Würfeln, Sammelwürfel schon ausgewählt (abschaltbar in den Einstellungen)
    if (a.n === "Ressourcen sammeln" && st.autoDice !== false && st.log[0] !== top) {
      st.pool = { red: 0, yellow: 0, blue: 0, black: 0, green: 1 };
      st.roll = [];
      goTab("wuerfeln");
    }
    return;
  }
  if (t.dataset.pip) { if (+t.dataset.pip >= counted()) doAction(ACTIONS.findIndex(a => a.n === "Sonstige")); return; }
  if (t.dataset.col) {
    const i = +t.dataset.col, others = st.colors.filter((_, k) => k !== i);
    let n = st.colors[i];
    do { n = (n + 1) % COLORS.length; } while (others.includes(n));
    st.colors[i] = n;
    return render();
  }
  if (t.dataset.rm) {
    const i = +t.dataset.rm;
    st.players.splice(i, 1); st.colors.splice(i, 1);
    if (st.current > i || st.current >= st.players.length) st.current = Math.max(0, st.current - 1);
    return render();
  }
  switch (t.id) {
    case "addP":
      st.players.push(["Sigrun", "Bjarne", "Astrid", "Halvar"][st.players.length % 4]);
      st.colors.push(freeColor(-1));
      return render();
    case "undo": return undo();
    case "end": return endTurn();
    case "perMinus": st.per = Math.max(1, st.per - 1); return render();
    case "perPlus": st.per = Math.min(8, st.per + 1); return render();
    case "dxMinus": st.diceExtra = Math.max(0, (st.diceExtra | 0) - 1); return render();
    case "dxPlus": st.diceExtra = Math.min(5, (st.diceExtra | 0) + 1); return render();
    case "reset":
      $("resetArea").innerHTML = `<span class="confirm">${tr("Alles zurücksetzen?")} <button class="btn" id="resetYes">${tr("Ja, neues Spiel")}</button><button class="btn" id="resetNo">${tr("Abbrechen")}</button></span>`;
      return;
    case "resetYes": {
      const keep = st.players, cols = st.colors, per = st.per, mine = { bigText: st.bigText, me: st.me, allowAll: st.allowAll, pool: st.pool, tab: st.tab, desc: st.desc, closed: st.closed, autoDice: st.autoDice, autoBuild: st.autoBuild, optsOpen: st.optsOpen, seg: st.seg, logOpen: st.logOpen };
      const ext = st.ext, dx = st.diceExtra | 0;
      st = fresh(); st.players = keep; st.colors = cols; st.per = per; st.ext = ext; st.diceExtra = dx; Object.assign(st, mine);
      $("resetArea").innerHTML = `<button class="btn" id="reset">${tr("Neues Spiel")}</button>`;
      return render();
    }
    case "resetNo":
      $("resetArea").innerHTML = `<button class="btn" id="reset">${tr("Neues Spiel")}</button>`; return;
  }
});
document.addEventListener("keydown", e => {
  const p = e.target.closest?.("[data-pip]");
  if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); p.click(); }
});
document.addEventListener("change", e => {
  if (e.target.dataset?.i !== undefined) {
    st.players[+e.target.dataset.i] = e.target.value.trim() || tf("Spieler {n}", { n: +e.target.dataset.i + 1 });
    render();
  }
});
