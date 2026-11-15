// Val Companion – Start: Spielstand laden, erste Darstellung, Online-Partie fortsetzen.
// Die Dateien werden in fester Reihenfolge geladen (siehe index.html) und teilen sich einen gemeinsamen Gültigkeitsbereich.

st.log = (Array.isArray(st.log) ? st.log : []).map(l => (l && l.k) ? l : cleanLog(l, st.players.length));
if (!st.log.length) { log({ k: "act", w: "Ragnhild", x: "Ressourcen sammeln", c: 1, m: 3 }, ""); st.used = [{ n: "Ressourcen sammeln" }]; }
render();
if (FIRST_RUN && !window.VAL_NO_INTRO) showIntro(0);

// Gespeicherte Online-Partie wieder aufnehmen
try { const c = localStorage.getItem(ONLINE_KEY); if (c && !window.VAL_NO_ONLINE) startSync(c); } catch {}
if (window.VAL_NO_ONLINE) {
  $("onOff").innerHTML = `<p class="on-p">${tr("Online-Partien funktionieren in der Android-App und unter ugleechicken.github.io/Val_Companion_DEU, nicht in dieser Vorschau.")}</p>`;
}
if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/ValCompanionApp/.test(navigator.userAgent)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
