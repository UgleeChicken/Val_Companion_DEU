# Val Companion

Aktionszähler, digitale Würfel und Spielhilfe für deine Brettspielrunde: als Android-App oder direkt im Browser, funktioniert auch offline.

## Android-App installieren

1. Auf dem Handy die neueste APK herunterladen:
   **https://github.com/UgleeChicken/Valheim_Boardgame_Companion_DEU/releases/latest/download/Val-Companion.apk**
2. Die Datei öffnen. Android fragt beim ersten Mal, ob der Browser Apps installieren darf: erlauben.
3. „Installieren“ tippen. Die App heißt **Val Companion**.

Neue Versionen werden bei jeder Änderung automatisch gebaut und lassen sich einfach über die alte App installieren. Der Spielstand bleibt dabei erhalten.

## Funktionen

Die App ist in fünf Reiter aufgeteilt (Leiste unten):

| Reiter | Inhalt |
| --- | --- |
| **Zug** | Runensteine, Zug beenden, Aktionen und freie Aktionen |
| **Würfeln** | Digitale Würfel und Würfel-Legende |
| **Bauen** | Möbelstücke und Schiff |
| **Hilfe** | Effekte, Ressourcen, Haldor |
| **Spiel** | Spieler, Aktionen pro Zug, Neues Spiel, Protokoll |


- Zählt die Aktionen pro Zug (Standard: 3, einstellbar von 1 bis 8) mit glühenden Runensteinen
- Alle 15 Aktionen mit den offiziellen deutschen Bezeichnungen, Symbol und Kurzbeschreibung; Haus-Aktionen gruppiert, „Nach den Bienen sehen“ nur 1× pro Zug
- Eigene Rubrik mit allen 11 freien Aktionen: werden protokolliert, zählen aber nicht mit
- 1 bis 4 Spieler mit änderbaren Namen und den Spielerfarben Rot, Blau, Grün und Gelb (Klick auf den Farbpunkt wechselt sie), Spielerwechsel und Rundenzähler
- Würfeln direkt in der App: Würfel auswählen, werfen, einzelne Würfel per Antippen neu werfen; Ergebnis im Protokoll (alle 5 Würfel)
- Möbelstücke bauen: alle Möbelstücke und das Schiff mit Kosten; „Bauen“ verbraucht eine Aktion, gebaute Möbel werden abgehakt und schalten ihre Aktionen frei (z. B. Fermentierer → Met brauen)
- Spielhilfe: Effekte (Tränke, Neuwurf, Feuer, Frost, Gift), alle Ressourcen und Haldors Preise
- Würfel-Legende mit allen Seiten aller 5 Würfel
- Rückgängig, Protokoll und „Neues Spiel“
- Der Spielstand wird auf dem Gerät gespeichert; in der App bleibt der Bildschirm während des Spiels an

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `docs/` | Die App selbst (HTML, Schrift, Symbole). Läuft auch direkt im Browser und als installierbare Web-App. |
| `android/` | Android-Projekt, das `docs/` als App verpackt. |
| `.github/workflows/android.yml` | Baut bei jedem Push auf `main` die APK und veröffentlicht sie als Release. |

Die APK ist mit einem öffentlichen Test-Schlüssel signiert (`android/app/debug.keystore`). Für eine Veröffentlichung im Play Store bräuchte es einen eigenen, geheimen Schlüssel.

Schriften: Averia Serif Libre und Germania One (SIL Open Font License, siehe `docs/fonts/`). Holztextur selbst erzeugt.
