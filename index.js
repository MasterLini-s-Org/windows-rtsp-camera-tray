const { app, BrowserWindow, Tray, Menu, globalShortcut, screen } = require('electron');
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegStatic = require('ffmpeg-static');

// 1. Config laden
const configPath = path.join(__dirname, 'config.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (err) {
    console.error("❌ Fehler: config.json konnte nicht geladen werden!", err.message);
    process.exit(1);
}

let tray = null;
let win = null;
let expressServer = null;

// ==================== HILFSFUNKTIONEN ====================

function getFFmpegPath() {
    let ffmpegPath = ffmpegStatic;
    if (app.isPackaged) {
        const possiblePaths = [
            path.join(process.resourcesPath, 'ffmpeg.exe'),
            path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
            path.join(app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
        ];
        for (let p of possiblePaths) {
            if (fs.existsSync(p)) return p;
        }
    }
    return ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}

// ==================== SERVER (DYNAMISCH) ====================

function startExpressServer() {
    const expressApp = express();
    
    // Statische Dateien (index.html, etc.)
    expressApp.use(express.static(path.join(__dirname, 'public')));

    // NEU: API Endpunkt fuer das Frontend, um die Kamera-Liste zu erhalten
    expressApp.get('/config', (req, res) => {
        res.json(config);
    });

    // Dynamische Endpunkte fuer JEDE Kamera in der config.json
    config.cameras.forEach((cam) => {
        const endpoint = `/live/${cam.id}`;
        
        expressApp.get(endpoint, (req, res) => {
            const now = new Date().toLocaleString();

            res.setHeader('Content-Type', 'video/mp2t');

            const ffmpeg = spawn(getFFmpegPath(), [
                '-rtsp_transport', 'tcp',
                '-i', cam.url,
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-f', 'mpegts',
                '-fflags', 'nobuffer+genpts+flush_packets', // Aggressives Flushing
                '-flags', 'low_delay',
                '-avioflags', 'direct',
                '-payload_type', '96', // Standard für H.264
                'pipe:1'
            ], { stdio: ['ignore', 'pipe', 'pipe'] });

            ffmpeg.stdout.pipe(res);

            // Beenden, wenn der Client die Verbindung trennt
            req.on('close', () => {
                ffmpeg.kill('SIGKILL');
            });

        });
    });

    expressServer = expressApp.listen(config.port, () => {});
}

// ==================== ELECTRON (GRID) ====================

function createWindow() {
    win = new BrowserWindow({
        width: 1700, height: 900, show: false, frame: false,
        alwaysOnTop: true, skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true, // Erlaubt ipcRenderer falls nötig
            contextIsolation: false, // Vereinfacht den Zugriff für lokale Tools
            webSecurity: false
        }
    });

    // Wir laden index.html erst, wenn wir es wirklich brauchen.
    win.loadURL('about:blank');

    win.on('blur', () => {
        // Nutze toggleGridWindow um alles sauber zu beenden
        if (win.isVisible()) toggleGridWindow();
    });
}

function toggleGridWindow() {
    if (!win) {
        createWindow();
    }

    if (win.isVisible()) {
        win.hide();
        win.loadURL('about:blank'); // Dies killt die FFmpeg Prozesse
    } else {
        
        // Erst Positionieren
        const cursorPoint = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(cursorPoint);
        const { width, height, x, y } = display.workArea;
        win.setBounds({
            x: Math.floor(x + (width - 1700) / 2),
            y: Math.floor(y + (height - 900) / 2),
            width: 1700, height: 900
        });

        // Dann URL laden (das triggert FFmpeg im Express-Server)
        win.loadURL(`http://localhost:${config.port}/index.html`);
        win.show();
        win.focus();
    }
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png'));

    const menuTemplate = [
        { label: '📺 Kamera Grid oeffnen', click: toggleGridWindow },
        { type: 'separator' },
        { label: 'Beenden', click: () => app.quit() }
    ];

    tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
    tray.on('click', toggleGridWindow);
}

// ==================== APP LIFECYCLE ====================

app.whenReady().then(() => {
    startExpressServer();
    createWindow();
    createTray();

    // Hotkey fuer das Grid
    globalShortcut.register(config.shortcut, toggleGridWindow);

});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (expressServer) expressServer.close();
});

process.on('SIGINT', () => app.quit());
process.on('SIGTERM', () => app.quit());