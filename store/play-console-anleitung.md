# Play Store: Schritt für Schritt

Diese Anleitung führt von der fertigen App bis zum geschlossenen Test im Play Store.
Die Antworten für die Formulare sind Vorschläge – bitte vor dem Absenden prüfen, ob sie zur aktuellen App passen.

## 1. Upload-Schlüssel als GitHub-Secrets hinterlegen (einmalig)

Der Upload-Schlüssel signiert das App-Bundle für den Play Store. Er gehört **nicht** ins Repository.

1. Im Repository auf **Settings → Secrets and variables → Actions** gehen.
2. **New repository secret** anlegen:
   - Name: `UPLOAD_KEYSTORE_BASE64` – Inhalt: der komplette Text aus `val-companion-upload.base64.txt`
3. Noch ein **New repository secret**:
   - Name: `UPLOAD_KEYSTORE_PASSWORD` – Inhalt: das Passwort aus `passwort.txt`
4. Schlüsseldatei (`val-companion-upload.jks`) und Passwort zusätzlich **sicher aufbewahren** (z. B. Passwort-Manager). Geht der Schlüssel verloren, lässt er sich über den Play-Support zurücksetzen, das dauert aber einige Tage.

Ab dem nächsten Android-Build liegt im Release zusätzlich `Val-Companion.aab`. Einen Build anstoßen: **Actions → Android-App bauen → Run workflow**.

## 2. GitHub Pages einschalten (für die Datenschutzerklärung)

**Settings → Pages → Build and deployment → Deploy from a branch → Branch `main`, Ordner `/docs` → Save.**

Datenschutzerklärung danach unter:
`https://ugleechicken.github.io/Val_Companion_DEU/datenschutz.html`

## 3. App in der Play Console anlegen

**Alle Apps → App erstellen**
- App-Name: `Val Companion`
- Standardsprache: Deutsch (Deutschland)
- App oder Spiel: **App**
- Kostenlos oder kostenpflichtig: **Kostenlos**

Unter **Play App-Signatur** die von Google verwaltete Signatur verwenden (Standard). Das erste hochgeladene App-Bundle legt den Upload-Schlüssel fest.

## 4. App einrichten (Dashboard → „App einrichten“)

| Abschnitt | Vorschlag |
| --- | --- |
| Datenschutzerklärung | `https://ugleechicken.github.io/Val_Companion_DEU/datenschutz.html` |
| App-Zugriff | Alle Funktionen ohne Einschränkung verfügbar (keine Anmeldung nötig) |
| Anzeigen | **Nein**, die App enthält keine Werbung |
| Einstufung des Inhalts | Fragebogen ausfüllen: keine Gewalt, keine Glücksspiele, keine Käufe. Online-Partien: Spieler sehen die eingegebenen Spielernamen ihrer Mitspieler. |
| Zielgruppe | 13 Jahre und älter (das Brettspiel ist ab 14) |
| Nachrichten-App | Nein |
| Regierungs-App | Nein |
| Finanzfunktionen | Keine |
| Gesundheit | Keine |
| Kategorie | App → **Unterhaltung** |

### Datensicherheit (Vorschlag)

- Werden Daten erhoben oder geteilt? **Ja** (nur bei Online-Partien)
- Erhobene Datentypen:
  - **App-Aktivitäten → Sonstige nutzergenerierte Inhalte** (Spielstand mit Spielernamen) – Zweck: App-Funktionen – optional
  - **Geräte- oder sonstige IDs** (anonyme Nutzerkennung von Firebase) – Zweck: App-Funktionen – optional
- Daten werden **nicht** an Dritte weitergegeben (Firebase verarbeitet sie im Auftrag)
- Daten werden bei der Übertragung **verschlüsselt** (HTTPS): Ja
- Nutzer können die **Löschung** ihrer Daten beantragen: Ja, über den Kontakt in der Datenschutzerklärung

## 5. Store-Eintrag

Texte aus `store/play-store-de.md` (Deutsch) und `store/play-store-en.md` (Englisch, als zusätzliche Sprache).

Außerdem nötig:
- App-Symbol 512 × 512: `docs/icons/icon-512.png`
- Vorstellungsgrafik 1024 × 500
- Mindestens 2 Screenshots vom Handy

## 6. Geschlossener Test (Pflicht für neue private Konten)

1. **Testen → Geschlossener Test → Track erstellen**
2. Tester hinzufügen (E-Mail-Liste oder Google-Gruppe), **mindestens 12 Personen**
3. Release erstellen und `Val-Companion.aab` aus dem neuesten GitHub-Release hochladen
4. Tester über den Opt-in-Link einladen. Sie müssen **14 Tage am Stück** eingetragen bleiben.
5. Danach in der Play Console **Zugriff auf Produktion beantragen**.

## Vor der öffentlichen Veröffentlichung noch offen

- Impressum mit echtem Namen und Anschrift
- Erlaubnis von MOOD Publishing für Inhalte aus dem Regelheft
- Firebase App Check einrichten (erst „Nur beobachten“, später „Erzwingen“)
