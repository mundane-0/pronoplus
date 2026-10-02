import { app, BrowserWindow } from 'electron';
import path from 'path';
import { dbManager } from './database';
import { setupPronoteHandlers } from './pronote';
import { setupIPCHandlers } from './ipc';

// Helper pour obtenir le chemin correct dans l'asar
function getAssetPath(...paths: string[]): string {
  const dir = __dirname.startsWith('app.asar') ? path.dirname(__dirname) : __dirname;
  return path.join(dir, ...paths);
}

class Main {
  private mainWindow: BrowserWindow | null = null;

  async init() {
    await app.whenReady();
    this.createWindow();
    this.setupEventHandlers();
    
    // Initialiser la base de données
    await dbManager.init();
    
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
        preload: getAssetPath('main', 'preload.js')
      }
    });

    // Charger l'application React avec le bon chemin
    const htmlPath = getAssetPath('renderer', 'index.html');
    this.mainWindow.loadFile(htmlPath);

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