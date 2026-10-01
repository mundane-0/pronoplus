import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import path from 'path';
import { initDatabase } from './database';
import { setupPronoteHandlers } from './pronote';
import { setupIPCHandlers } from './ipc';

// Déclaration pour TypeScript
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

class Main {
  private mainWindow: BrowserWindow | null = null;

  async init() {
    await app.whenReady();
    this.createWindow();
    this.setupEventHandlers();
    
    // Initialiser la base de données
    await initDatabase();
    
    console.log('ProNote+ démarré avec succès');
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      frame: true,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../../resources/icon.png')
    });

    // Charger l'application React
    if (MAIN_WINDOW_WEBPACK_ENTRY) {
      this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Ouvrir DevTools en développement
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Gérer la fermeture
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupEventHandlers() {
    // Handlers IPC
    setupIPCHandlers();
    setupPronoteHandlers();

    // Gérer le multi-instance
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
    } else {
      app.on('second-instance', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) this.mainWindow.restore();
          this.mainWindow.focus();
        }
      });
    }

    // Quitter quand toutes les fenêtres sont fermées (sauf sur macOS)
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Réactiver la fenêtre sur macOS
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }
}

// Lancer l'application
const main = new Main();
main.init().catch(console.error);