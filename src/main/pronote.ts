// Import simple - on utilise directement l'API depawnote
import { ipcMain, safeStorage } from 'electron';
import { createSessionHandle, loginCredentials, finishLoginManually } from 'pawnote';

import { dbManager, CredentialsRecord } from './database';

interface LoginCredentials {
  url: string;
  username: string;
  password: string;
  ent?: string;
  rememberMe: boolean;
}

interface LoginResult {
  success: boolean;
  user?: any;
  error?: string;
}

class PronoteManager {
  private currentSession: any | null = null;
  private isAuthenticated: boolean = false;

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { url, username, password } = credentials;

      // Crée les credentials de login
      const creds = loginCredentials(username, password);

      // Crée la session
      const session = createSessionHandle(url, creds);

      // Connecte
      const logged = await finishLoginManually(session);

      this.currentSession = session;
      this.isAuthenticated = true;

      return { success: true, user: logged };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  logout(): void {
    this.currentSession = null;
    this.isAuthenticated = false;
  }
}

const pronoteManager = new PronoteManager();

export function setupPronoteHandlers() {
  ipcMain.handle('pronote-login', async (_, credentials: LoginCredentials) => {
    return pronoteManager.login(credentials);
  });

  ipcMain.handle('pronote-logout', async () => {
    pronoteManager.logout();
    return { success: true };
  });
}
