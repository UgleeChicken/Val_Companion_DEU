// Val Companion – Bauen: Möbelstücke, Schiff, Gartenbeete.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

// ---------- Möbelstücke ----------
const RES = {
  muenze: "Münze", harz: "Harz", holz: "Holz", fell: "Fell", stein: "Stein", bronze: "Bronze", eisen: "Eisen", silber: "Silber",
};
const FURN = [
  { k: "bett", n: "Bett", i: "bed", c: { fell: 1, holz: 1 } },
  { k: "teppich", n: "Teppich", i: "rug", c: { fell: 2 } },
  { k: "thron", n: "Thron", i: "throne", c: { fell: 1, stein: 2 } },
  { k: "tisch", n: "Tisch", i: "table", c: { holz: 2, stein: 2 } },
  { k: "kochkessel", n: "Kochkessel", i: "pot", c: { bronze: 2 } },
  { k: "feuertisch", n: "Feuertisch", i: "fire", c: { harz: 2, holz: 2 } },
  { k: "bombentisch", n: "Bombentisch", i: "bomb", c: { harz: 1, holz: 1, eisen: 1 } },
  { k: "fermentierer", n: "Fermentierer", i: "mead", c: { holz: 1, bronze: 1 } },
  { k: "bienenstock", n: "Bienenstock", i: "bees", c: { harz: 1, holz: 1 } },
  { k: "schiff", n: "Schiff", i: "ship", c: { fell: 1, holz: 2 }, ship: true },
  { k: "beet-lp", n: "Gartenbeet: +1 Lebenspunkt", i: "sprout", c: { holz: 1 }, garden: true, ext: "gf" },
  { k: "beet-nw", n: "Gartenbeet: +1 Neuwurfplättchen", i: "sprout", c: { holz: 1 }, garden: true, ext: "gf" },
  { k: "beet-au", n: "Gartenbeet: +1 Ausdauer", i: "sprout", c: { holz: 1 }, garden: true, ext: "gf" },
];
const resIcon = r => `<svg class="res" viewBox="0 0 24 24" aria-hidden="true"><use href="#r-${r}"/></svg>`;
const furnName = k => FURN.find(f => f.k === k)?.n || k;

function build(k) {
  const f = FURN.find(x => x.k === k); if (!f) return;
  if (locked() || counted() >= st.per) return;
  if (!f.ship && st.built.includes(k)) return;
  const a = f.ship ? "Schiff bauen" : f.garden ? "Gartenbeet bestellen" : "Möbelstück herstellen";
  st.used.push({ n: a, build: f.ship ? null : k });
  if (!f.ship) st.built.push(k);
  achBuild(f, st.current);
  log({ k: "build", w: name(), x: f.k, c: counted(), m: st.per }, "");
  render();
}

function renderFurniture() {
  if (!Array.isArray(st.built)) st.built = [];
  const left = st.per - counted();
  $("resKey").innerHTML = Object.entries(RES).map(([r, n]) => `<span>${resIcon(r)}${tr(n)}</span>`).join("");
  $("furn").innerHTML = FURN.filter(f => !f.ext || (st.ext || {})[f.ext]).map(f => {
    const done = !f.ship && st.built.includes(f.k);
    const cost = Object.entries(f.c).map(([r, n]) => `<span title="${n}× ${tr(RES[r])}">${n}× ${resIcon(r)}</span>`).join("");
    return `<div class="fr ${done ? "built" : ""}">
      <svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${f.i}"/></svg>
      <span class="fn">${tr(f.n)}${f.ship ? `<small>${tr("nicht im Haus")}</small>` : ""}${f.ext === "gf" ? ` <span class="ext-tag">Gamefound</span>` : ""}</span>
      ${done
        ? `<span class="built-tag"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>${tr(f.garden ? "Bestellt" : "Gebaut")}<button data-unbuild="${f.k}" aria-label="${tf("{f} als nicht gebaut markieren", { f: tr(f.n) })}" title="${tr("Korrektur: als nicht gebaut markieren")}">×</button></span>`
        : `<button class="btn act-btn" data-build="${f.k}" ${left === 0 || locked() ? "disabled" : ""}>${tr(f.garden ? "Bestellen" : "Bauen")}</button>`}
      <span class="cost" aria-label="${tr("Kosten")}">${cost}</span>
    </div>`;
  }).join("");
}

document.addEventListener("click", e => {
  const t = e.target.closest("[data-build],[data-unbuild]");
  if (!t) return;
  if (t.dataset.build) return build(t.dataset.build);
  st.built = st.built.filter(k => k !== t.dataset.unbuild);
  render();
});
