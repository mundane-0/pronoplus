import { ipcMain, safeStorage } from 'electron';
import { PronoteApi } from 'pawnote';
import type { PronoteApiAccount, PronoteApiLoginInformations, PronoteApiGrades, PronoteApiHomeworks, PronoteApiTimetable, PronoteApiAbsences, PronoteApiMessages, PronoteApiInfos } from 'pawnote';
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
  user?: PronoteApiAccount;
  error?: string;
}

class PronoteManager {
  private currentSession: PronoteApiAccount | null = null;
  private isAuthenticated: boolean = false;

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { url, username, password, ent, rememberMe } = credentials;

      // Créer l'instance Pronote
      const pronote = new PronoteApi(url);

      // Tenter la connexion
      const loginInfo: PronoteApiLoginInformations = {
        username,
        password
      };

      // Si ENT est spécifié, utiliser l'authentification CAS
      if (ent) {
        // TODO: Implémenter la logique CAS pour les différents ENT
        // Pour l'instant, on utilise l'authentification directe
        const account = await pronote.login(loginInfo);
        this.currentSession = account;
      } else {
        const account = await pronote.login(loginInfo);
        this.currentSession = account;
      }

      this.isAuthenticated = true;

      // Sauvegarder les credentials si demandé
      if (rememberMe && this.currentSession) {
        await this.saveCredentials(credentials);
      }

      return {
        success: true,
        user: this.currentSession
      };
    } catch (error: any) {
      console.error('Erreur de connexion Pronote:', error);
      
      let errorMessage = 'Erreur de connexion';
      if (error.message?.includes('401')) {
        errorMessage = 'Identifiants incorrects';
      } else if (error.message?.includes('404')) {
        errorMessage = 'URL Pronote invalide';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Erreur réseau - Vérifiez votre connexion';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async logout(): Promise<void> {
    this.currentSession = null;
    this.isAuthenticated = false;
    
    // Supprimer les credentials sauvegardés
    await this.deleteSavedCredentials();
  }

  private async saveCredentials(credentials: LoginCredentials): Promise<void> {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        console.warn('Le chiffrement n\'est pas disponible');
        return;
      }

      const encryptedPassword = safeStorage.encryptString(credentials.password);
      
      const credRecord: CredentialsRecord = {
        id: `${credentials.url}-${credentials.username}`,
        url: credentials.url,
        username: credentials.username,
        encryptedPassword,
        ent: credentials.ent,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      dbManager.saveCredentials(credRecord);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des credentials:', error);
    }
  }

  async getSavedCredentials(): Promise<SavedCredentials | null> {
    try {
      const credRecord = dbManager.getCredentials();
      if (!credRecord) return null;

      if (!safeStorage.isEncryptionAvailable()) {
        return null;
      }

      const decryptedPassword = safeStorage.decryptString(credRecord.encryptedPassword);

      return {
        url: credRecord.url,
        username: credRecord.username,
        encryptedPassword: credRecord.encryptedPassword,
        ent: credRecord.ent || undefined,
        lastLogin: credRecord.lastLogin
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des credentials:', error);
      return null;
    }
  }

  async deleteSavedCredentials(): Promise<void> {
    dbManager.deleteCredentials();
  }

  async fetchGrades(): Promise<PronoteApiGrades[]> {
    if (!this.currentSession || !this.isAuthenticated) {
      throw new Error('Non authentifié');
    }

    try {
      const grades = await this.currentSession.getGrades();
      
      // Sauvegarder les notes dans la base de données locale
      grades.forEach(grade => {
        const gradeRecord = {
          id: `${grade.subject}-${grade.date}-${grade.id}`,
          pronoteId: grade.id,
          subject: grade.subject,
          title: grade.title,
          grade: grade.grade,
          scale: grade.scale,
          coefficient: grade.coefficient,
          classAverage: grade.classAverage,
          min: grade.min,
          max: grade.max,
          date: grade.date,
          period: grade.period,
          teacher: grade.teacher,
          comment: grade.comment,
          fetchedAt: new Date().toISOString()
        };

        dbManager.saveGrade(gradeRecord);
      });

      return grades;
    } catch (error) {
      console.error('Erreur lors de la récupération des notes:', error);
      throw error;
    }
  }

  async fetchHomeworks(): Promise<PronoteApiHomeworks[]> {
    if (!this.currentSession || !this.isAuthenticated) {
      throw new Error('Non authentifié');
    }

    try {
      const homeworks = await this.currentSession.getHomeworks();
      
      // Sauvegarder les devoirs dans la base de données locale
      homeworks.forEach(homework => {
        const homeworkRecord = {
          id: homework.id,
          pronoteId: homework.id,
          subject: homework.subject,
          title: homework.title,
          description: homework.description,
          dueDate: homework.dueDate,
          done: false,
          attachments: JSON.stringify(homework.attachments || []),
          fetchedAt: new Date().toISOString()
        };

        dbManager.saveHomework(homeworkRecord);
      });

      return homeworks;
    } catch (error) {
      console.error('Erreur lors de la récupération des devoirs:', error);
      throw error;
    }
  }

  async fetchTimetable(startDate: string, endDate: string): Promise<PronoteApiTimetable[]> {
    if (!this.currentSession || !this.isAuthenticated) {
      throw new Error('Non authentifié');
    }

    try {
      const timetable = await this.currentSession.getTimetable(
        new Date(startDate),
        new Date(endDate)
      );
      return timetable;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'emploi du temps:', error);
      throw error;
    }
  }

  async fetchAbsences(): Promise<PronoteApiAbsences[]> {
    if (!this.currentSession || !this.isAuthenticated) {
      throw new Error('Non authentifié');
    }

    try {
      const absences = await this.currentSession.getAbsences();
      return absences;
    } catch (error) {
      console.error('Erreur lors de la récupération des absences:', error);
      throw error;
    }
  }

  async fetchMessages(): Promise<PronoteApiMessages[]> {
    if (!this.currentSession || !this.isAuthenticated) {
      throw new Error('Non authentifié');
    }

    try {
      const messages = await this.currentSession.getMessages();
      return messages;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }

  async fetchInfos(): Promise<PronoteApiInfos> {
    if (!this.currentSession || !this.isAuthenticated) {
      throw new Error('Non authentifié');
    }

    try {
      const infos = await this.currentSession.getInfos();
      return infos;
    } catch (error) {
      console.error('Erreur lors de la récupération des infos:', error);
      throw error;
    }
  }

  // Méthode pour rafraîchir la session
  async refreshSession(): Promise<boolean> {
    if (!this.currentSession) return false;

    try {
      await this.currentSession.refresh();
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  getCurrentSession(): PronoteApiAccount | null {
    return this.currentSession;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated && this.currentSession !== null;
  }
}

export const pronoteManager = new PronoteManager();

// Définir les handlers IPC pour Pronote
export function setupPronoteHandlers(): void {
  // Login handler
  ipcMain.handle('login', async (_, credentials: LoginCredentials) => {
    return await pronoteManager.login(credentials);
  });

  // Logout handler
  ipcMain.handle('logout', async () => {
    await pronoteManager.logout();
  });

  // Get saved credentials handler
  ipcMain.handle('get-saved-credentials', async () => {
    return await pronoteManager.getSavedCredentials();
  });

  // Delete saved credentials handler
  ipcMain.handle('delete-saved-credentials', async () => {
    await pronoteManager.deleteSavedCredentials();
  });

  // Fetch grades handler
  ipcMain.handle('fetch-grades', async () => {
    return await pronoteManager.fetchGrades();
  });

  // Fetch homeworks handler
  ipcMain.handle('fetch-homeworks', async () => {
    return await pronoteManager.fetchHomeworks();
  });

  // Fetch timetable handler
  ipcMain.handle('fetch-timetable', async (_, { startDate, endDate }: { startDate: string, endDate: string }) => {
    return await pronoteManager.fetchTimetable(startDate, endDate);
  });

  // Fetch absences handler
  ipcMain.handle('fetch-absences', async () => {
    return await pronoteManager.fetchAbsences();
  });

  // Fetch messages handler
  ipcMain.handle('fetch-messages', async () => {
    return await pronoteManager.fetchMessages();
  });

  // Fetch infos handler
  ipcMain.handle('fetch-infos', async () => {
    return await pronoteManager.fetchInfos();
  });

  // Session status handler
  ipcMain.handle('get-session-status', async () => {
    return {
      isLoggedIn: pronoteManager.isLoggedIn(),
      session: pronoteManager.getCurrentSession()
    };
  });
}

// Types pour l'API exposée
interface SavedCredentials {
  url: string;
  username: string;
  encryptedPassword: Buffer;
  ent?: string;
  lastLogin: string;
}