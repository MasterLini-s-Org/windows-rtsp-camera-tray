## Was ist RTSP Camera Tray?

RTSP Camera Tray ist eine kleine Electron‑App, die im **System‑Tray** läuft und dir per **Global Shortcut** ein **Always‑On‑Top Fenster** mit einem Grid aus deinen RTSP‑Kameras anzeigt.  
Die Streams werden über einen lokalen **Express‑Server** bereitgestellt und mit **FFmpeg** aus den RTSP‑URLs gezogen.

Typische Use‑Cases:
- Schnell mehrere IP‑Kameras im Blick behalten (Einfahrt, Garten, Büro)
- Überwachung auf einem separaten Monitor
- Temporäres Overlay beim Zocken/Arbeiten

***

## Voraussetzungen

- **Windows 10 oder neuer**
- **Node.js (LTS)** installiert und im Pfad verfügbar
- RTSP‑fähige IP‑Kameras (beliebiger Hersteller)

***

## Konfiguration (`config.json`)

Vor der Nutzung musst du die Datei **`config.json`** im Projektverzeichnis anpassen.  

Beispiel:

```json
{
  "port": 59123,
  "hotkey": "Control+Alt+G",
  "cameras": [
    {
      "id": "cam1",
      "name": "Einfahrt",
      "url": "rtsp://user:pass@192.168.1.10:554/Streaming/Channels/101"
    },
    {
      "id": "cam2",
      "name": "Garten",
      "url": "rtsp://user:pass@192.168.1.11:554/Streaming/Channels/101"
    }
  ]
}
```

- `port`: Port, auf dem der lokale Express‑Server läuft (z. B. `59123`).
- `hotkey`: Globaler Shortcut, um das Kamera‑Grid zu toggeln (z. B. `Control+Alt+G`). 
- `cameras[]`:
  - `id`: Technische ID für den Stream‑Endpoint (`/live/<id>`).
  - `name`: Anzeigename im UI.
  - `url`: RTSP‑URL deiner Kamera (inkl. Benutzer/Passwort, falls nötig).  


***

## Installation (aus Source)

1. **Repository klonen**

   ```bash
   git clone https://github.com/MasterLini-s-Org/windows-rtsp-camera-tray.git
   cd windows-rtsp-camera-tray
   ```

2. **Abhängigkeiten installieren**

   ```bash
   npm install
   ```

3. **App bauen**

   ```bash
   npm run build
   ```

   - Dabei wird `electron-builder` ausgeführt und erzeugt im Ordner `dist/` eine Windows‑Installer‑EXE. 

4. **Installer ausführen**

   - Öffne den `dist/`‑Ordner.
   - Starte die erzeugte `.exe` (NSIS‑Installer) und folge dem Installations‑Assistenten.

***

## Bedienung

Nach der Installation und korrekter `config.json`:

- Starte **RTSP Camera Tray** über die installierte App/EXE.
- Im System‑Tray erscheint ein Icon.  

**Steuerung:**
- **Globaler Shortcut** (z. B. `Strg + Alt + G`):  
  Öffnet bzw. schließt das Overlay‑Fenster mit dem Kamera‑Grid.
- **Linksklick auf das Tray‑Icon**:  
  Toggelt ebenfalls das Kamera‑Grid (je nach Implementierung).
- **Rechtsklick auf das Tray‑Icon**:  
  Öffnet ein Kontextmenü zum Beenden der App oder weiteren Optionen (falls implementiert).  

**Overlay‑Fenster:**
- Always‑On‑Top (bleibt über anderen Fenstern).
- Rahmenlos und nicht in der Taskleiste sichtbar.
- Kann automatisch wieder geschlossen werden, wenn es den Fokus verliert.  
