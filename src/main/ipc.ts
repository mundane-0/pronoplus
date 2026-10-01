import { ipcMain, Notification, nativeImage, BrowserWindow } from 'electron';
import { dbManager } from './database';
import { createIcs } from 'ics';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// Types
interface GradeAnalysis {
  subjectId: string;
  average: number;
  trend: 'up' | 'down' | 'stable';
  predictions: Prediction[];
  strengths: string[];
  weaknesses: string[];
}

interface Prediction {
  date: string;
  predictedGrade: number;
  confidence: number;
}

interface Goal {
  id: string;
  subject: string;
  targetGrade: number;
  currentGrade: number;
  deadline: string;
  progress: number;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  language: 'fr' | 'en';
  notifications: {
    homeworkReminder: boolean;
    classReminder: boolean;
    gradeAlert: boolean;
  };
  aiProvider: 'ollama' | 'openai' | 'none';
  openaiApiKey?: string;
  ollamaModel: string;
}

interface NotificationData {
  id?: string;
  title: string;
  body: string;
  scheduleAt: string;
  type: 'homework' | 'class' | 'grade' | 'general';
}

interface CalendarEvent {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
}

interface Quiz {
  questions: QuizQuestion[];
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Map des notifications planifiées
const scheduledNotifications = new Map<string, NodeJS.Timeout>();

export function setupIPCHandlers(): void {
  // Database handlers
  ipcMain.handle('save-grade-analysis', async (_, analysis: GradeAnalysis) => {
    // TODO: Implémenter la logique de sauvegarde d'analyse
    console.log('Saving grade analysis:', analysis);
  });

  ipcMain.handle('get-grade-analysis', async (_, subjectId: string) => {
    // TODO: Implémenter la logique de récupération d'analyse
    console.log('Getting grade analysis for subject:', subjectId);
    return null;
  });

  ipcMain.handle('save-goals', async (_, goals: Goal[]) => {
    goals.forEach(goal => {
      const goalRecord = {
        id: goal.id,
        subject: goal.subject,
        targetGrade: goal.targetGrade,
        currentGrade: goal.currentGrade,
        deadline: goal.deadline,
        progress: goal.progress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dbManager.saveGoal(goalRecord);
    });
  });

  ipcMain.handle('get-goals', async () => {
    return dbManager.getGoals();
  });

  // Settings handlers
  ipcMain.handle('get-settings', async () => {
    const theme = dbManager.getSetting('theme') as 'light' | 'dark' | 'system';
    const accentColor = dbManager.getSetting('accentColor') || '#3b82f6';
    const language = dbManager.getSetting('language') as 'fr' | 'en';
    const aiProvider = dbManager.getSetting('aiProvider') as 'ollama' | 'openai' | 'none';
    const ollamaModel = dbManager.getSetting('ollamaModel') || 'llama3.2';
    const openaiApiKey = dbManager.getSetting('openaiApiKey');

    const settings: AppSettings = {
      theme: theme || 'system',
      accentColor,
      language: language || 'fr',
      notifications: {
        homeworkReminder: dbManager.getSetting('notifications.homeworkReminder') === 'true',
        classReminder: dbManager.getSetting('notifications.classReminder') === 'true',
        gradeAlert: dbManager.getSetting('notifications.gradeAlert') === 'true'
      },
      aiProvider: aiProvider || 'none',
      ollamaModel,
      openaiApiKey
    };

    return settings;
  });

  ipcMain.handle('save-settings', async (_, settings: AppSettings) => {
    // Sauvegarder chaque paramètre
    dbManager.saveSetting('theme', settings.theme);
    dbManager.saveSetting('accentColor', settings.accentColor);
    dbManager.saveSetting('language', settings.language);
    dbManager.saveSetting('notifications.homeworkReminder', settings.notifications.homeworkReminder.toString());
    dbManager.saveSetting('notifications.classReminder', settings.notifications.classReminder.toString());
    dbManager.saveSetting('notifications.gradeAlert', settings.notifications.gradeAlert.toString());
    dbManager.saveSetting('aiProvider', settings.aiProvider);
    dbManager.saveSetting('ollamaModel', settings.ollamaModel);
    
    if (settings.openaiApiKey) {
      dbManager.saveSetting('openaiApiKey', settings.openaiApiKey);
    }
  });

  // Export handlers
  ipcMain.handle('export-grades-csv', async () => {
    const grades = dbManager.getGrades();
    
    let csv = 'Matière,Intitulé,Note,Barème,Coefficient,Moyenne classe,Min,Max,Date,Professeur\n';
    
    grades.forEach(grade => {
      csv += `"${grade.subject}","${grade.title}",${grade.grade},${grade.scale},${grade.coefficient},${grade.classAverage},${grade.min},${grade.max},"${grade.date}","${grade.teacher}"\n`;
    });

    return csv;
  });

  ipcMain.handle('export-grades-pdf', async () => {
    const grades = dbManager.getGrades();
    
    // Créer un document PDF
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', chunk => chunks.push(chunk));
    
    // En-tête
    doc.fontSize(20).text('Bulletin de Notes ProNote+', { align: 'center' });
    doc.moveDown();
    
    // Date
    const now = new Date();
    doc.fontSize(12).text(`Exporté le: ${now.toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown(2);
    
    // Tableau des notes
    doc.fontSize(14).text('Notes détaillées:', { underline: true });
    doc.moveDown();
    
    let yPosition = doc.y;
    
    // En-tête du tableau
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Matière', 50, yPosition);
    doc.text('Note', 200, yPosition);
    doc.text('Coeff.', 250, yPosition);
    doc.text('Date', 300, yPosition);
    
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;
    
    // Données
    doc.font('Helvetica');
    grades.forEach(grade => {
      doc.text(grade.subject, 50, yPosition);
      doc.text(`${grade.grade}/${grade.scale}`, 200, yPosition);
      doc.text(grade.coefficient.toString(), 250, yPosition);
      doc.text(new Date(grade.date).toLocaleDateString('fr-FR'), 300, yPosition);
      yPosition += 15;
    });
    
    doc.end();
    
    // Attendre la fin de l'écriture
    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  });

  ipcMain.handle('export-calendar-ics', async (_, events: CalendarEvent[]) => {
    const icsEvents = events.map(event => ({
      start: event.startDate.split('T')[0].split('-') as [number, number, number],
      startInputType: 'utc' as const,
      end: event.endDate.split('T')[0].split('-') as [number, number, number],
      endInputType: 'utc' as const,
      title: event.title,
      description: event.description,
      location: event.location
    }));

    const { error, value } = createIcs(icsEvents);
    
    if (error) {
      throw new Error(`Erreur lors de la création du fichier ICS: ${error}`);
    }

    return value;
  });

  // Notification handlers
  ipcMain.handle('schedule-notification', async (_, notification: NotificationData) => {
    const notificationId = notification.id || `notification-${Date.now()}`;
    const scheduleTime = new Date(notification.scheduleAt).getTime();
    const now = Date.now();
    
    if (scheduleTime <= now) {
      // Notification immédiate
      showNotification(notification.title, notification.body);
      return notificationId;
    }
    
    // Planifier la notification
    const delay = scheduleTime - now;
    const timeout = setTimeout(() => {
      showNotification(notification.title, notification.body);
      scheduledNotifications.delete(notificationId);
    }, delay);
    
    scheduledNotifications.set(notificationId, timeout);
    return notificationId;
  });

  ipcMain.handle('cancel-notification', async (_, id: string) => {
    const timeout = scheduledNotifications.get(id);
    if (timeout) {
      clearTimeout(timeout);
      scheduledNotifications.delete(id);
    }
  });

  // AI Assistant handlers (stubs - à implémenter avec Ollama/OpenAI)
  ipcMain.handle('ai-summarize', async (_, content: string) => {
    // TODO: Implémenter avec Ollama/OpenAI
    return `Résumé généré pour le contenu: ${content.substring(0, 100)}...`;
  });

  ipcMain.handle('ai-explain-subject', async (_, { subject, context }: { subject: string, context: string }) => {
    // TODO: Implémenter avec Ollama/OpenAI
    return `Explication générée pour ${subject} basée sur: ${context.substring(0, 50)}...`;
  });

  ipcMain.handle('ai-generate-quiz', async (_, topic: string) => {
    // TODO: Implémenter avec Ollama/OpenAI
    const quiz: Quiz = {
      questions: [
        {
          question: `Qu'est-ce que ${topic}?`,
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 0,
          explanation: 'Explication de la réponse correcte'
        }
      ],
      topic,
      difficulty: 'medium'
    };
    
    return quiz;
  });

  // Utility handlers
  ipcMain.handle('get-app-version', async () => {
    const { version } = require('../../package.json');
    return version;
  });

  ipcMain.handle('get-platform', async () => {
    return process.platform;
  });

  ipcMain.handle('open-external-url', async (_, url: string) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
  });
}

// Fonction helper pour afficher des notifications
function showNotification(title: string, body: string): void {
  const notification = new Notification({
    title,
    body,
    icon: nativeImage.createFromPath(path.join(__dirname, '../../resources/icon.png'))
  });

  notification.show();
}

// Nettoyer les notifications planifiées au démarrage
function cleanupScheduledNotifications(): void {
  scheduledNotifications.forEach(timeout => {
    clearTimeout(timeout);
  });
  scheduledNotifications.clear();
}

// Appeler au démarrage
cleanupScheduledNotifications();