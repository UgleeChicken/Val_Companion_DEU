# Val Companion

Inoffizielle Begleit-App für **Valheim – Das Brettspiel**: Aktionszähler, digitale Würfel und Spielhilfe, als Android-App oder direkt im Browser, funktioniert auch offline.

> **Hinweis:** Diese App ist ein inoffizielles Fan-Projekt. Sie steht in keiner Verbindung zu Iron Gate Studio, Coffee Stain Publishing oder MOOD Publishing, dem Verlag von Valheim – Das Brettspiel, und wird von diesen weder unterstützt noch geprüft. Valheim ist eine eingetragene Marke von Iron Gate Studio. Alle Marken gehören ihren jeweiligen Inhabern.

## Android-App installieren

1. Auf dem Handy die neueste APK herunterladen:
   **https://github.com/UgleeChicken/Val_Companion_DEU/releases/latest/download/Val-Companion.apk**
2. Die Datei öffnen. Android fragt beim ersten Mal, ob der Browser Apps installieren darf: erlauben.
3. „Installieren“ tippen. Die App heißt **Val Companion**.

Die APK muss nur einmal installiert werden. Neue Versionen bietet die App beim Start selbst an („Neue Version verfügbar“), ein Tipp auf **Aktualisieren** genügt. Der Spielstand bleibt dabei erhalten.

## Updates

Es gibt zwei Arten von Updates, beide werden auf GitHub automatisch gebaut:

| Änderung an | Was passiert |
| --- | --- |
| `docs/` (die eigentliche App) | Ein Release **web-vN** mit `web.zip` und `web.json` wird veröffentlicht. Die Android-App findet es beim nächsten Start und lädt es auf Nachfrage herunter. Die Website auf GitHub Pages ist sofort aktuell. |
| `android/` | Eine neue APK wird gebaut und als Release **app-vN** veröffentlicht. Sie muss wie bisher neu installiert werden. Das ist nur nötig, wenn sich an der Android-App selbst etwas ändert. |

Die heruntergeladene Version liegt im internen Speicher der App. Klappt der Download nicht, läuft einfach die bisherige Version weiter. Nach einer neuen APK wird wieder die darin eingebaute Version benutzt.

Braucht die Website irgendwann eine neue Funktion der Android-App, in `.github/workflows/web.yml` bei `MIN_APP` die Build-Nummer dieser APK eintragen. Ältere Apps bekommen das Web-Update dann nicht angeboten.

## Sprachen

Die App gibt es auf **Deutsch** und **Englisch**. Beim ersten Start richtet sie sich nach der Sprache des Geräts; umschalten lässt sie sich im Reiter **Spiel → Sprache · Language**. In Online-Partien sieht jeder das Protokoll in seiner eigenen Sprache.

## Online-Partien

Mehrere Handys können eine gemeinsame Partie spielen: Im Reiter **Spiel → Online-Partie** erstellt einer die Partie und bekommt einen Code (z. B. `K7M-Q2X`), die anderen treten mit diesem Code bei. Alle sehen dann live denselben Spielstand. Ohne Online-Partie funktioniert die App wie gewohnt offline.

Jedes Handy wählt einmal, welcher Spieler es ist (**Ich spiele als …**). Aktionen, Bauen, Rückgängig und Zug beenden kann nur, wer am Zug ist. Würfeln und freie Aktionen gehen jederzeit und werden mit dem eigenen Namen protokolliert. Mit **Alle dürfen alles** lässt sich die Sperre auf einem Handy aufheben, z. B. wenn jemand für einen Mitspieler ohne Handy spielt.

Technik: Firebase (anonyme Anmeldung + Realtime Database in `europe-west1`), angesprochen über die REST-Schnittstelle ohne zusätzliche Bibliothek. Die Datenbank-Regeln liegen in `firebase/database.rules.json` und werden in der Firebase-Konsole unter **Realtime Database → Regeln** eingefügt und veröffentlicht.

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
| `firebase/` | Datenbank-Regeln für die Online-Partien. |
| `android/` | Android-Projekt, das `docs/` als App verpackt und Web-Updates herunterlädt. |
| `store/` | Texte für den Store-Eintrag auf Deutsch und Englisch (inklusive Hinweis). |
| `.github/workflows/android.yml` | Baut bei Änderungen an `android/` die APK und veröffentlicht sie als Release. |
| `.github/workflows/web.yml` | Veröffentlicht bei Änderungen an `docs/` ein Web-Update für die App. |

Die APK ist mit einem öffentlichen Test-Schlüssel signiert (`android/app/debug.keystore`). Für eine Veröffentlichung im Play Store bräuchte es einen eigenen, geheimen Schlüssel.

## Kontakt

Entwickelt von **UgleeChicken** · https://wonderl.ink/@ugleechicken

Schriften: Averia Serif Libre und Germania One (SIL Open Font License, siehe `docs/fonts/`). Holztextur selbst erzeugt.
