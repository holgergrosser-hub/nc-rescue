# 🆘 NC-Rescue - ISO 9001 Abweichungs-Unterstützung

Professionelle Landing Page und Kalkulator für ISO-9001-Abweichungs-Support mit automatischer PDF-Angebots-Generierung.

## 📋 Features

- ✅ **Modernes, responsives UI/UX Design**
- ✅ **Interaktiver Kalkulator** (Neben- und Hauptabweichungen)
- ✅ **Automatische PDF-Angebots-Generierung**
- ✅ **E-Mail-Bestätigung** an Kunden (mit PDF-Anhang)
- ✅ **Benachrichtigung** an Holger
- ✅ **Follow-up E-Mails** nach 1, 2 und 4 Tagen
- ✅ **Google Sheet Tracking**
- ✅ **Netlify-ready** mit automatischem Deployment

## 💰 Preise

- **Nebenabweichung:** 400 € netto (476 € inkl. MwSt.)
- **Hauptabweichung:** 800 € netto (952 € inkl. MwSt.)

---

## 🚀 Schnellstart

### Voraussetzungen

- Google Account (für Sheet und Apps Script)
- GitHub Account
- Netlify Account (kostenlos)

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/DEIN-USERNAME/nc-rescue.git
cd nc-rescue

# Dependencies installieren
npm install

# Dev-Server starten
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

### VS Code Tasks (optional)

Im Projekt sind Tasks hinterlegt, damit du nicht jedes Mal Befehle tippen musst:

- **Terminal → Run Task… →** `dev`
- **Terminal → Run Task… →** `build`
- **Terminal → Run Task… →** `preview`

---

## 📦 Komplette Setup-Anleitung

### 1️⃣ Google Sheet erstellen

1. **Neues Google Sheet** erstellen: [sheets.google.com](https://sheets.google.com)
2. Blatt umbenennen in: **`Anfragen`**
3. **Sheet-ID kopieren** (aus der URL)
   ```
   https://docs.google.com/spreadsheets/d/DIESE_ID_HIER/edit
                                           ↑↑↑↑↑↑↑↑↑↑↑↑↑↑
   ```

### 2️⃣ Google Apps Script einrichten

1. Im Google Sheet: **Erweiterungen → Apps Script**
2. Inhalt der Datei **`backend/Code.gs`** kopieren und einfügen
3. **SHEET_ID anpassen** (Zeile 10):
   ```javascript
   SHEET_ID: 'HIER_DEINE_GOOGLE_SHEET_ID',
   ```

4. **Bereitstellen → Neue Bereitstellung**
   - Typ: **Web-App**
   - Ausführen als: **Ihr Google-Account**
   - Zugriff: **Alle (auch nicht angemeldet)**
   
5. **Bereitstellen** klicken
6. Berechtigungen autorisieren (Google fragt nach Zugriff auf Gmail und Sheets)
7. ⚠️ **WICHTIG: URL kopieren!** Diese URL brauchst du im nächsten Schritt

   Die URL sieht etwa so aus:
   ```
   https://script.google.com/macros/s/ABCD1234.../exec
   ```

### 3️⃣ Frontend anpassen

In **`src/App.jsx`** Zeile 6:
```javascript
const SCRIPT_URL = 'HIER_DIE_GOOGLE_APPS_SCRIPT_URL';
```

Ersetze den Platzhalter mit der URL aus Schritt 2.7

**Testmodus (empfohlen für lokale Tests):**

- Das Frontend sendet in der lokalen Entwicklung automatisch `testMode: true`.
- Das Apps Script (siehe `backend/Code.gs`) überspringt dann E-Mails und Follow-ups und schreibt den Sheet-Status als **"Test"**.
- Damit das wirkt, musst du den aktualisierten `backend/Code.gs` in Apps Script einfügen und **neu bereitstellen** (neue Version).

### 4️⃣ Follow-up Timer einrichten (Optional)

Für automatische Follow-up E-Mails:

1. In Google Apps Script: **Trigger** (Uhr-Symbol links)
2. **Trigger hinzufügen**
   - Funktion: `checkAndSendFollowUps`
   - Ereignisquelle: **Zeitgesteuert**
   - Zeitbasierter Trigger: **Täglich**
   - Uhrzeit: **1 bis 2 Uhr morgens**
3. **Speichern**

### 5️⃣ GitHub Repository

1. **Neues Repository** auf GitHub erstellen: `nc-rescue`
2. Lokales Projekt mit GitHub verbinden:

```bash
git init
git add .
git commit -m "Initial commit: NC-Rescue App"
git remote add origin https://github.com/DEIN-USERNAME/nc-rescue.git
git push -u origin main
```

### 6️⃣ Netlify Deployment

1. **[netlify.com](https://netlify.com)** → Login
2. **Add new site** → **Import from Git**
3. **GitHub** auswählen und Repository verbinden
4. **Build-Einstellungen werden automatisch erkannt** (durch `netlify.toml`)
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

#### ✅ Testen auf Netlify ohne echte E-Mails (empfohlen)

Damit du das Formular auf Netlify testen kannst, ohne dass das Apps Script echte E-Mails verschickt, setze in Netlify eine Environment Variable:

- Name: `VITE_TEST_MODE`
- Value: `true`

Netlify Pfad: **Site settings → Build & deploy → Environment → Environment variables**

Tipp: Setze diese Variable zuerst für **Deploy Previews** (oder Branch Deploys), damit deine Live-Production-Seite später wieder „normal“ senden kann.

Optional (falls du die Apps-Script-URL ohne Code-Änderung wechseln willst):

- Name: `VITE_SCRIPT_URL`
- Value: `https://script.google.com/macros/s/.../exec`

Nach dem Setzen: **Deploy neu anstoßen** (Redeploy / neuer Commit), damit der Build die Variablen übernimmt.

5. **Deploy!** 🚀

Nach wenigen Minuten ist deine App live!

---

## 🧪 Testen

1. **Website öffnen** (Netlify-URL)
2. **Formular ausfüllen** und absenden
3. **Prüfen:**
   - ✅ Google Sheet: Neue Zeile?
   - ✅ E-Mail an Kunde: Bestätigung mit PDF erhalten?
   - ✅ E-Mail an Holger: Benachrichtigung erhalten?
   - ✅ PDF-Anhang: Korrekt formatiert?

---

## 📁 Projektstruktur

```
nc-rescue/
├── src/
│   ├── App.jsx         ← Haupt-React-Component (modernes UI)
│   ├── main.jsx        ← Entry Point
│   └── index.css       ← Global Styles
├── backend/
│   └── Code.gs         ← Google Apps Script (PDF-Gen + E-Mail)
├── public/             ← Statische Assets
├── index.html          ← HTML Template
├── package.json        ← Dependencies
├── vite.config.js      ← Vite Config (minify: 'esbuild')
├── netlify.toml        ← Netlify Config (npm install && npm run build)
├── .gitignore          ← Git ignore rules
└── README.md           ← Diese Datei
```

---

## 🎨 UI/UX Verbesserungen

Die neue Version hat folgende Verbesserungen gegenüber der alten:

### Design
- ✅ **Moderne Card-basierte Layouts**
- ✅ **Professionelle Farbpalette** (Primär: Blau #2563eb)
- ✅ **Besseres Spacing und Typography**
- ✅ **Smooth Transitions** zwischen Steps
- ✅ **Responsive Design** für alle Geräte

### UX
- ✅ **Klarere visuelle Hierarchie**
- ✅ **Farbcodierte Abweichungs-Typen** (Blau/Rot)
- ✅ **Inline-Preisanzeige** bei Anzahl-Auswahl
- ✅ **Success-State** nach Absenden
- ✅ **Bessere Error-Handling**
- ✅ **Step-Indicator** für bessere Orientierung

### Terminologie
- ✅ **Korrekte deutsche Begriffe:** "Nebenabweichungen" statt "Minor"
- ✅ **Korrekte deutsche Begriffe:** "Hauptabweichungen" statt "Major"
- ✅ **Professionelle Beschreibungen** mit Kontext

---

## 📧 E-Mail-Kommunikation

### Kunde erhält:
1. **Sofort:** Bestätigung mit PDF-Angebot
2. **Tag 1:** Kurze Nachfrage
3. **Tag 2:** Erinnerung
4. **Tag 4:** Letzte Erinnerung

### Holger erhält:
1. **Sofort:** Benachrichtigung über neue Anfrage mit allen Details

### Stop-Bedingung
Follow-up E-Mails stoppen automatisch nach 7 Tagen oder wenn Status im Sheet geändert wird.

---

## 🔧 Wichtige Hinweise

### ⚠️ **KRITISCHE KONFIGURATION**

1. **vite.config.js:** 
   ```javascript
   minify: 'esbuild'  // NICHT 'terser' verwenden!
   ```

2. **netlify.toml:**
   ```toml
   command = "npm install && npm run build"  // IMMER mit npm install!
   ```

3. **Google Apps Script:**
   - Nach Code-Änderungen: **IMMER neue Bereitstellung erstellen**
   - Dann **neue URL kopieren** und in `App.jsx` eintragen

### 📝 Content-Anpassungen

Alle Texte können in `src/App.jsx` angepasst werden:
- Herobereich (Zeilen ~290-300)
- Info-Cards (Zeilen ~310-380)
- Formular-Labels (Zeilen ~450-550)
- Footer (Zeilen ~590-600)

---

## 🤝 Support

Bei Fragen oder Problemen:

📧 holger.grosser@qm-guru.de  
📞 0911-49522541  
🌐 www.QM-Guru.de

---

## 📜 Lizenz

© 2025 Holger Grosser - QM-Dienstleistungen  
Alle Rechte vorbehalten.

---

**Made with ❤️ by Holger Grosser**
