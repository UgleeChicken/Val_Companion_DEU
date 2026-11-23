// Val Companion – Spielerwahl, Protokolltexte, Erweiterungen, Unterreiter, Einführung, Reiter.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

// ---------- Wer bin ich? (nur bei Online-Partien) ----------
// Jedes Handy wählt seinen Spieler. Aktionen, Bauen, Rückgängig und Zug beenden kann nur,
// wer am Zug ist. Würfeln und freie Aktionen gehen jederzeit und laufen unter dem eigenen Namen.
function locked() { return !!(net && net.code) && !st.allowAll && st.me !== st.current; }
function isOther() { return !!(net && net.code) && !st.allowAll && st.me != null && st.me !== st.current; }
function actorIdx() { return isOther() ? st.me : st.current; }
function actorName() { return st.players[actorIdx()] || name(); }

function renderSeat() {
  if (!$("seatPick")) return;
  const on = !!net.code;
  if (st.me != null && !(st.me >= 0 && st.me < st.players.length)) st.me = null;
  const chips = st.players.map((p, i) =>
    `<button class="seat-btn ${st.me === i ? "on" : ""}" data-me="${i}" style="--pc:${pc(i)}" aria-pressed="${st.me === i}"><span class="sd2"></span>${esc(p)}</button>`).join("");
  $("seatPick").innerHTML = chips;
  $("allowAll").checked = !!st.allowAll;
  const wa = $("whoami");
  wa.hidden = !(on && st.me == null && !st.allowAll);
  wa.innerHTML = wa.hidden ? "" : `<p>${tr("Online-Partie: Wer bist du auf diesem Handy?")}</p><div class="seat-row">${chips}</div>`;
  const wm = $("waitMsg"), lk = locked();
  wm.hidden = !(on && st.me != null && lk);
  wm.innerHTML = wm.hidden ? "" : tf("Du spielst als {n}. Warte, bis du am Zug bist. Würfeln und freie Aktionen gehen jederzeit.", { n: `<b style="color:${pc(st.me)}">${esc(st.players[st.me])}</b>` });
  document.body.classList.toggle("is-locked", lk);
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-me]");
  if (!t) return;
  st.me = +t.dataset.me;
  render();
});
document.addEventListener("change", e => {
  if (e.target && e.target.id === "allowAll") { st.allowAll = e.target.checked; render(); }
});


// Protokolleinträge werden in der Sprache des jeweiligen Handys angezeigt.
function logText(l) {
  switch (l.k) {
    case "act": return `${l.w}: ${tr(l.x)}${l.f ? " " + tr("(frei)") : ` – ${l.c}/${l.m}`}`;
    case "end": return tf("{w} beendet den Zug ({c}/{m} Aktionen)", l);
    case "round": return tf("Runde {r} beginnt", l);
    case "roll": return tf("{w} würfelt: {i}", { w: l.w, i: (l.i || []).map(s => `${s.c}× ${tr(s.f)} (${tr((DICE[s.d] || {}).short || "")})`).join(", ") });
    case "reroll": return tf("{w} wirft neu ({d}): {a} → {b}", { w: l.w, d: tr((DICE[l.d] || {}).name || ""), a: tr(l.a), b: tr(l.b) });
    case "build": if (/^beet-/.test(l.x)) return tf("{w}: {f} bestellt – {c}/{m}", { w: l.w, c: l.c, m: l.m, f: tr(furnName(l.x)) });
      return l.x === "schiff" ? tf("{w}: Schiff gebaut – {c}/{m}", l) : tf("{w}: {f} gebaut – {c}/{m}", { w: l.w, c: l.c, m: l.m, f: tr(furnName(l.x)) });
    default: return l.text || "";
  }
}
// Ältere Protokolleinträge (fertiger deutscher Text) in das neue Format umwandeln, damit sie übersetzt werden können.
const DE_SHORT = { rot: "red", gelb: "yellow", blau: "blue", schwarz: "black", "grün": "green" };
const OLD_DIE_NAMES = { "Schadenswürfel": "black" };
// Aktionsnamen aus früheren Versionen
const OLD_ACTIONS = { "Sammeln": "Ressourcen sammeln", "Segeln": "Lossegeln", "Möbel herstellen": "Möbelstück herstellen", "Essen kochen": "Nahrung kochen",
  "Essen essen": "Gekochte Nahrung essen", "Entzünden": "Werkzeug oder Waffe entzünden", "Bombe bauen": "Eine Bombe basteln", "Bienen prüfen": "Nach den Bienen sehen",
  "Verbrauchsgut nutzen": "Verbrauchsgegenstand nutzen", "Marker auf deinem Feld": "Mit Plättchen interagieren", "Bombe werfen": "Eine Bombe werfen",
  "Odins Kraft nutzen": "Macht Odins nutzen", "Ausbau-Fertigkeit nutzen": "Freigespielte Aufwertung nutzen", "Ausrüstungseffekt nutzen": "Effekt einer Ausrüstung nutzen",
  "Im Kampf helfen": "Unterstützung im Kampf", "Grabstein plündern": "Gegenstand vom Grabstein aufsammeln", "Truhe plündern": "Truhe erbeuten", "Möbel": "Möbelstück herstellen" };
const actName = x => ACTIONS.some(a => a.n === x) ? x : (OLD_ACTIONS[x] || null);
function parseLegacy(t) {
  let m;
  if (!t) return null;
  if ((m = t.match(/^Runde (\d+) beginnt$/))) return { k: "round", r: +m[1] };
  if ((m = t.match(/^(.+?) beendet den Zug \((\d+)\/(\d+) Aktionen\)$/))) return { k: "end", w: m[1], c: +m[2], m: +m[3] };
  if ((m = t.match(/^(.+?) würfelt: (.+)$/))) {
    const i = m[2].split(", ").map(p => {
      const q = p.match(/^(\d+)× (.+?)(?: \((rot|gelb|blau|schwarz|grün)\))?$/);
      if (!q) return null;
      const d = q[3] ? DE_SHORT[q[3]] : Object.keys(DICE).find(k => DICE[k].faces.some(x => x.n === q[2]));
      return d ? { c: +q[1], f: q[2], d } : null;
    });
    return i.every(Boolean) ? { k: "roll", w: m[1], i } : null;
  }
  if ((m = t.match(/^(.+?) wirft neu \((.+?)\): (.+?) → (.+)$/))) {
    const d = OLD_DIE_NAMES[m[2]] || Object.keys(DICE).find(k => DICE[k].name === m[2]);
    return d ? { k: "reroll", w: m[1], d, a: m[3], b: m[4] } : null;
  }
  if ((m = t.match(/^(.+?): Schiff gebaut – (\d+)\/(\d+)$/))) return { k: "build", w: m[1], x: "schiff", c: +m[2], m: +m[3] };
  if ((m = t.match(/^(.+?): (.+?) gebaut – (\d+)\/(\d+)$/))) { const fu = FURN.find(x => x.n === m[2]); return fu ? { k: "build", w: m[1], x: fu.k, c: +m[3], m: +m[4] } : null; }
  if ((m = t.match(/^(.+?): (.+?) \(frei\)$/))) return actName(m[2]) ? { k: "act", w: m[1], x: actName(m[2]), f: 1 } : null;
  if ((m = t.match(/^(.+?): (.+?) – (\d+)\/(\d+)$/))) return actName(m[2]) ? { k: "act", w: m[1], x: actName(m[2]), c: +m[3], m: +m[4] } : null;
  return null;
}
const LOG_KINDS = ["act", "end", "round", "roll", "reroll", "build"];
function cleanLog(l, n) {
  const str = (v, max) => String(v ?? "").slice(0, max);
  const int = (v, lo, hi, d) => { const x = Math.floor(Number(v)); return Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  l = l || {};
  const e = { t: str(l.t, 8), cls: ["f", "e"].includes(l.cls) ? l.cls : "", p: int(l.p, 0, n - 1, 0), dice: !!l.dice };
  if (LOG_KINDS.includes(l.k)) {
    Object.assign(e, { k: l.k, w: str(l.w, 24), x: str(l.x, 60), c: int(l.c, 0, 99, 0), m: int(l.m, 0, 99, 0), r: int(l.r, 0, 9999, 0), f: l.f ? 1 : 0,
      d: DICE[l.d] ? l.d : "", a: str(l.a, 40), b: str(l.b, 40),
      i: (Array.isArray(l.i) ? l.i : []).slice(0, 40).map(s => ({ c: int(s && s.c, 0, 99, 0), f: str(s && s.f, 40), d: s && DICE[s.d] ? s.d : "" })) });
  } else {
    const pl = parseLegacy(str(l.text, 300));
    if (pl) return cleanLog(Object.assign({}, l, pl), n);
    e.text = str(l.text, 300);
  }
  return e;
}

// Aktionsgruppen auf- und zuklappen, Beschreibungen ein- und ausblenden, letzter Eintrag führt zum Protokoll
document.addEventListener("click", e => {
  const g = e.target.closest("[data-grp]");
  if (g) { st.closed = st.closed || {}; st.closed[g.dataset.grp] = !st.closed[g.dataset.grp]; return render(); }
  if (e.target.closest("#lastLog")) { st.logOpen = !st.logOpen; return render(); }
  if (e.target.closest("#logAll")) { goTab("spiel"); const lg = $("log"); if (lg) lg.scrollIntoView({ block: "center" }); }
});
document.addEventListener("change", e => {
  if (e.target && e.target.id === "descT") { st.desc = e.target.checked; render(); }
  if (e.target && e.target.id === "autoDiceT") { st.autoDice = e.target.checked; render(); }
  if (e.target && e.target.id === "autoBuildT") { st.autoBuild = e.target.checked; render(); }
});

// Bereich „Optionen“ auf- und zuklappen und merken
document.addEventListener("toggle", e => {
}, true);

// Erweiterung „Rache des Verlassenen“ (gilt für die ganze Partie, auch online)
document.addEventListener("change", e => {
  if (e.target && e.target.id === "extRache") { st.ext = Object.assign({}, st.ext, { rache: e.target.checked }); render(); }
  if (e.target && e.target.id === "extGf") { st.ext = Object.assign({}, st.ext, { gf: e.target.checked }); render(); }
});

// ---------- Unterreiter (Hilfe, Aktionen) ----------
function renderSegs() {
  if (!st.seg || typeof st.seg !== "object") st.seg = {};
  if (!["kampf", "eq", "eff", "res", "hal"].includes(st.seg.help)) st.seg.help = "kampf";
  document.querySelectorAll('[data-seg="help"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.val === st.seg.help)));
  document.querySelectorAll("[data-sub]").forEach(el => { const [k, v] = el.dataset.sub.split(":"); el.hidden = st.seg[k] !== v; });
  // Reiter Spiel: Partie / Erfolge / App (Erfolge entfallen, wenn sie ausgeschaltet sind)
  if (!["party", "ach", "app"].includes(st.seg.game) || (st.achOff && st.seg.game === "ach")) st.seg.game = "party";
  document.querySelectorAll('[data-seg="game"]').forEach(b => b.setAttribute("aria-pressed", String(b.dataset.val === st.seg.game)));
  if ($("segAch")) $("segAch").hidden = !!st.achOff;
  if (st.tab === "spiel") document.querySelectorAll("[data-game]").forEach(el => { el.hidden = el.dataset.game !== st.seg.game; });
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-seg]");
  if (!b) return;
  st.seg = Object.assign({}, st.seg, { [b.dataset.seg]: b.dataset.val });
  render();
});

// Schmale Leiste: erscheint oben, sobald die große Zug-Leiste aus dem Bild gescrollt ist.
// Sie schwebt über dem Inhalt, dadurch verschiebt sich beim Ein- und Ausblenden nichts.
(() => {
  const bar = $("miniBar"), board = document.querySelector(".board");
  if (!bar || !board || !("IntersectionObserver" in window)) return;
  // Gleiche Breite und Position wie die große Zug-Leiste (und damit wie die Statusleiste der anderen Reiter)
  const align = () => { const r = board.getBoundingClientRect(); if (!r.width) return;
    bar.style.left = Math.round(r.left) + "px"; bar.style.width = Math.round(r.width) + "px"; };
  window.addEventListener("resize", align, { passive: true });
  align();
  const show = on => { if (on) align(); bar.classList.toggle("show", on); bar.setAttribute("aria-hidden", String(!on));
    bar.querySelectorAll("button").forEach(b => b.tabIndex = on ? 0 : -1); };
  new IntersectionObserver(([en]) => show(!en.isIntersecting && !board.hidden && en.boundingClientRect.top < 0),
    { threshold: 0, rootMargin: "-60px 0px 0px 0px" }).observe(board);
  document.addEventListener("click", e => {
    if (e.target.closest("#mbUndo")) return undo();
    if (e.target.closest("#mbEnd")) return endTurn();
  });
})();

// Kurze Rückmeldung nach einer Aktion: Runenstein leuchtet auf, Kachel blinkt, Handy vibriert kurz
function feedback(actIdx, free) {
  requestAnimationFrame(() => {
    const pip = free ? null : document.querySelector(`[data-pip="${counted() - 1}"]`);
    const btn = actIdx != null ? document.querySelector(`[data-a="${actIdx}"]`) : null;
    [pip, btn].forEach(el => { if (!el) return; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); });
  });
  try { navigator.vibrate && navigator.vibrate(15); } catch {}
}


// ---------- Einführung (beim ersten Start, später unter Einstellungen) ----------
const INTRO = [
  {"t": "Willkommen bei Val Companion", "l": "Deine inoffizielle Begleit-App für Valheim – Das Brettspiel.", "b": ["<b>Aktionen zählen</b>, ohne mitzurechnen", "<b>Würfeln</b> mit allen Würfeln digital", "<b>Spielhilfe</b> für Kampf, Symbole, Effekte und Haldor"], "n": "Das Brettspiel braucht ihr trotzdem."},
  {"t": "Drei Runensteine pro Zug", "l": "Jede Aktion verbraucht einen Runenstein.", "b": ["<b>Aktion antippen</b> im Reiter „Zug“", "<b>Freie Aktionen</b> verbrauchen keinen Stein", "<b>Zug beenden</b> gibt an den Nächsten weiter, auch früher, wenn du nicht alle Aktionen nutzt", "<b>↶</b> macht die letzte Aktion rückgängig", "<b>Kampf</b> ist keine Aktion und kostet keinen Stein"], "n": ""},
  {"t": "Reiter unten", "l": "Alles Weitere findest du in der Leiste unten. Du kannst auch nach links und rechts wischen.", "b": ["<b>Würfeln</b>: alle Würfel digital werfen, einzelne Würfel antippen zum Neuwerfen", "<b>Bauen</b>: Möbelstücke und Schiffe", "<b>Hilfe</b>: Kampf, Ausrüstung, Effekte, Ressourcen, Haldor", "<b>Spiel</b>: Spieler, Online-Partie, Erfolge und Einstellungen"], "n": ""},
  {"t": "Spieler und Online-Partie", "l": "Im Reiter „Spiel“ legt ihr los.", "b": ["<b>Namen eintragen</b> und Farben wählen", "<b>Online-Partie</b>: auf mehreren Handys zusammen spielen", "<b>Erfolge</b>: Runensteine für besondere Momente im Spiel sammeln", "<b>Neues Spiel</b>: mit Rückblick auf die letzte Partie", "<b>Einstellungen</b>: Sprache, Erweiterungen und mehr"], "n": "Diese Einführung findest du jederzeit unter Spiel → Einstellungen."}
];
let introStep = -1;
function showIntro(step) {
  introStep = step;
  const box = $("intro");
  if (step < 0 || step >= INTRO.length) {
    box.hidden = true;
    try { localStorage.setItem("valcompanion-intro", "1"); } catch {}
    return;
  }
  const c = INTRO[step];
  box.hidden = false;
  box.innerHTML = `<div class="intro-card" role="dialog" aria-modal="true" aria-labelledby="introT">
    <div class="intro-dots">${INTRO.map((_, i) => `<i class="${i === step ? "on" : ""}"></i>`).join("")}</div>
    <h2 id="introT">${tr(c.t)}</h2>
    <p class="intro-lead">${tr(c.l)}</p>
    <ul class="intro-list">${c.b.map(x => `<li>${tr(x)}</li>`).join("")}</ul>
    ${c.n ? `<p class="intro-note">${tr(c.n)}</p>` : ""}
    <div class="intro-row">${step < INTRO.length - 1 ? `<button class="btn" id="introSkip">${tr("Überspringen")}</button>` : "<span></span>"}
    <button class="btn primary" id="introNext">${tr(step === INTRO.length - 1 ? "Los geht's" : "Weiter")}</button></div></div>`;
  $("introNext").focus();
}
document.addEventListener("click", e => {
  if (e.target.closest("#introNext")) return showIntro(introStep + 1);
  if (e.target.closest("#introSkip")) return showIntro(-1);
  if (e.target.closest("#introShow")) return showIntro(0);
});

// ---------- Reiter ----------
const TABS = ["zug", "wuerfeln", "bauen", "hilfe", "spiel"];
const GOES_TO_BUILD = ["Möbelstück herstellen", "Schiff bauen", "Gartenbeet bestellen"];
function renderTabs() {
  if (!TABS.includes(st.tab)) st.tab = "zug";
  document.querySelectorAll("[data-tab]").forEach(el => { el.hidden = el.dataset.tab !== st.tab; });
  document.querySelectorAll("[data-tab-not]").forEach(el => { el.hidden = el.dataset.tabNot === st.tab; });
  document.querySelectorAll("#tabbar [data-go]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.go === st.tab)));
  const c = counted(), left = st.per - c;
  $("status").innerHTML = `<span class="sn">${esc(name())}</span>
    <span class="mini">${Array.from({ length: st.per }, (_, i) => `<i class="${i < c ? "used" : ""}"></i>`).join("")}</span>
    <span class="sl">${tf(left === 1 ? "{n} Aktion übrig" : "{n} Aktionen übrig", { n: left })}</span>
    <span class="on-mini"></span>
    <span class="sr">${tr("Runde")} <b>${st.round}</b></span>`;
}
function goTab(t) {
  $("miniBar") && $("miniBar").classList.remove("show");
  st.tab = t; render();
  try { window.scrollTo({ top: 0 }); } catch { window.scrollTo(0, 0); }
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-go],#status");
  if (!t) return;
  goTab(t.id === "status" ? "zug" : t.dataset.go);
});

// Wischen zwischen den Reitern: nach links = nächster Reiter, nach rechts = vorheriger.
// Nur klare waagerechte Bewegungen zählen; am Bildschirmrand (Zurück-Geste), in Eingabefeldern
// und bei offener Einführung wird nicht gewechselt.
(() => {
  const order = [...document.querySelectorAll("[data-go]")].map(b => b.dataset.go);
  let sx = 0, sy = 0, st0 = 0, on = false;
  document.addEventListener("touchstart", e => {
    on = false;
    if (e.touches.length !== 1 || !$("intro").hidden) return;
    const t = e.touches[0];
    if (t.clientX < 28 || t.clientX > window.innerWidth - 28) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    sx = t.clientX; sy = t.clientY; st0 = Date.now(); on = true;
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (on && e.touches.length !== 1) on = false;
  }, { passive: true });
  document.addEventListener("touchend", e => {
    if (!on) return; on = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Date.now() - st0 > 700 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
    const sel = window.getSelection && String(window.getSelection()); if (sel) return;
    const i = order.indexOf(st.tab), j = i + (dx < 0 ? 1 : -1);
    if (i < 0 || j < 0 || j >= order.length) return;
    goTab(order[j]);
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cls = dx < 0 ? "swipe-from-right" : "swipe-from-left";
    document.querySelectorAll(".wrap > [data-tab]:not([hidden])").forEach(el => {
      el.classList.remove("swipe-from-right", "swipe-from-left"); void el.offsetWidth;
      el.classList.add(cls);
      el.addEventListener("animationend", () => el.classList.remove(cls), { once: true });
    });
  }, { passive: true });
})();

// Große Schrift (pro Handy)
document.addEventListener("change", e => {
  if (e.target && e.target.id === "bigText") { st.bigText = e.target.checked; render(); }
  if (e.target && e.target.id === "achShow") { st.achOff = !e.target.checked; render(); }
});

// Bildschirm bleibt während des Spiels an (Browser-Version; die Android-App macht das selbst)
(() => {
  if (!("wakeLock" in navigator) || /ValCompanionApp/.test(navigator.userAgent)) return;
  let lock = null;
  const request = async () => {
    if (document.visibilityState !== "visible" || lock) return;
    try { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); } catch {}
  };
  document.addEventListener("visibilitychange", request);
  // Manche Browser erlauben es erst nach einer Berührung
  document.addEventListener("pointerdown", request, { passive: true });
  request();
})();

// Sprung aus der Spielhilfe in einen anderen Reiter (eigenes Attribut, damit die Wisch-Reihenfolge der Reiter unverändert bleibt)
document.addEventListener("click", e => { const t = e.target.closest("[data-jump]"); if (t) { goTab(t.dataset.jump); window.scrollTo(0, 0); } });

// ---------- Kleines Geheimnis: 3-mal auf das App-Symbol unter „Über die App“ tippen ----------
// Dank an die Tester, die die App mit Kritik, Rückmeldungen und Ideen mitgeformt haben.
const TESTERS = ["Björn", "Lisa", "„Neytiri487“", "Nadine", "Tilas", "Jana", "Alex „c0unter“", "Alex", "„Skov“", "Julse", "„Lav“", "„Aran“", "Mario", "Lukas", "Flo"];
let thanksTaps = 0, thanksTimer = null;
function showThanks() {
  const box = $("thanks"); if (!box) return;
  box.innerHTML = `<div class="intro-card thanks-card" role="dialog" aria-modal="true" aria-labelledby="thanksT">
    <div class="runeline" aria-hidden="true">ᚠᚢᚦᚨᚱᚲᚷᚹ</div>
    <h2 id="thanksT">${tr("Skål, ihr Tester!")}</h2>
    <p class="intro-lead">${tr("Großen Dank an alle Tester, die die App mit viel konstruktiver Kritik, Feedback und Ideen mit mir zu dem geformt haben, was sie heute ist.")}</p>
    <ul class="thanks-list">${TESTERS.map(n => `<li>${esc(n)}</li>`).join("")}</ul>
    <p class="thanks-sign">– UgleeChicken</p>
    <div class="intro-row"><span></span><button class="btn primary" id="thanksOk">${tr("Skål!")}</button></div></div>`;
  box.hidden = false; $("thanksOk").focus();
  try { navigator.vibrate && navigator.vibrate([20, 60, 20]); } catch {}
}
function hideThanks() { const box = $("thanks"); if (box) { box.hidden = true; box.innerHTML = ""; } }
document.addEventListener("click", e => {
  if (e.target.closest("#thanksOk") || e.target.id === "thanks") return hideThanks();
  const ic = e.target.closest(".about-brand .app-icon"); if (!ic) return;
  ic.classList.remove("tap"); void ic.offsetWidth; ic.classList.add("tap");   // kleines Wackeln als Rückmeldung
  clearTimeout(thanksTimer); thanksTimer = setTimeout(() => { thanksTaps = 0; }, 1500);
  if (++thanksTaps >= 3) { thanksTaps = 0; showThanks(); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("thanks") && !$("thanks").hidden) hideThanks(); });
