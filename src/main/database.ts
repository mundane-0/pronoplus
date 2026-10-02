import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { app, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';

export interface GradeRecord {
  id: string;
  pronoteId: string;
  subject: string;
  title: string;
  grade: number;
  scale: number;
  coefficient: number;
  classAverage: number;
  min: number;
  max: number;
  date: string;
  period: string;
  teacher: string;
  comment?: string;
  fetchedAt: string;
}

export interface HomeworkRecord {
  id: string;
  pronoteId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  done: boolean;
  attachments: string;
  fetchedAt: string;
}

export interface GoalRecord {
  id: string;
  subject: string;
  targetGrade: number;
  currentGrade: number;
  deadline: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsRecord {
  key: string;
  value: string;
}

export interface AchievementRecord {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  metadata: string;
}

export interface CredentialsRecord {
  id: string;
  url: string;
  username: string;
  encryptedPassword: Buffer;
  ent?: string;
  lastLogin: string;
  createdAt: string;
}

class DatabaseManager {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'pronoplus.db');
  }

  async init(): Promise<void> {
    try {
      // Vérifier si le dossier existe
      const userDataPath = app.getPath('userData');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      // Initialiser SQL.js
      const SQL = await initSqlJs();
      
      // Charger la base de données existante ou en créer une nouvelle
      let dbData: Uint8Array | null = null;
      if (fs.existsSync(this.dbPath)) {
        dbData = new Uint8Array(fs.readFileSync(this.dbPath));
      }
      
      this.db = new SQL.Database(dbData || undefined);
      this.createTables();
      
      // Sauvegarder périodiquement
      setInterval(() => {
        this.saveToFile();
      }, 30000); // Sauvegarder toutes les 30 secondes
      
      console.log('Base de données initialisée:', this.dbPath);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  private saveToFile(): void {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la base de données:', error);
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Table des notes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        pronoteId TEXT NOT NULL,
        subject TEXT NOT NULL,
        title TEXT NOT NULL,
        grade REAL NOT NULL,
        scale REAL NOT NULL,
        coefficient REAL NOT NULL,
        classAverage REAL NOT NULL,
        min REAL NOT NULL,
        max REAL NOT NULL,
        date TEXT NOT NULL,
        period TEXT NOT NULL,
        teacher TEXT NOT NULL,
        comment TEXT,
        fetchedAt TEXT NOT NULL
      )
    `);

    // Index pour les recherches par matière et date
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_grades_subject_date 
      ON grades(subject, date)
    `);

    // Table des devoirs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS homeworks (
        id TEXT PRIMARY KEY,
        pronoteId TEXT NOT NULL,
        subject TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        attachments TEXT NOT NULL,
        fetchedAt TEXT NOT NULL
      )
    `);

    // Index pour les devoirs par date d'échéance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_homeworks_dueDate 
      ON homeworks(dueDate)
    `);

    // Table des objectifs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        targetGrade REAL NOT NULL,
        currentGrade REAL NOT NULL,
        deadline TEXT NOT NULL,
        progress REAL NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Table des paramètres
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Table des achievements
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        badgeId TEXT NOT NULL,
        earnedAt TEXT NOT NULL,
        metadata TEXT NOT NULL
      )
    `);

    // Table des credentials (chiffrés)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        username TEXT NOT NULL,
        encryptedPassword BLOB NOT NULL,
        ent TEXT,
        lastLogin TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Initialiser les paramètres par défaut
    this.initDefaultSettings();
  }

  private initDefaultSettings(): void {
    if (!this.db) return;

    const defaultSettings = [
      { key: 'theme', value: 'system' },
      { key: 'accentColor', value: '#3b82f6' },
      { key: 'language', value: 'fr' },
      { key: 'notifications.homeworkReminder', value: 'true' },
      { key: 'notifications.classReminder', value: 'true' },
      { key: 'notifications.gradeAlert', value: 'true' },
      { key: 'aiProvider', value: 'none' },
      { key: 'ollamaModel', value: 'llama3.2' }
    ];

    for (const setting of defaultSettings) {
      const stmt = this.db!.prepare(`
        INSERT OR IGNORE INTO settings (key, value) 
        VALUES (?, ?)
      `);
      stmt.bind([setting.key, setting.value]);
      stmt.step();
      stmt.free();
    }
  }

  // Méthodes pour les notes
  saveGrade(grade: GradeRecord): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO grades 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      grade.id,
      grade.pronoteId,
      grade.subject,
      grade.title,
      grade.grade,
      grade.scale,
      grade.coefficient,
      grade.classAverage,
      grade.min,
      grade.max,
      grade.date,
      grade.period,
      grade.teacher,
      grade.comment || null,
      grade.fetchedAt
    ]);
    stmt.step();
    stmt.free();
  }

  getGrades(): GradeRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM grades 
      ORDER BY date DESC
    `);
    
    const results: GradeRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as unknown as GradeRecord);
    }
    stmt.free();
    return results;
  }

  getGradesBySubject(subject: string): GradeRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM grades 
      WHERE subject = ? 
      ORDER BY date DESC
    `);
    stmt.bind([subject]);
    
    const results: GradeRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as unknown as GradeRecord);
    }
    stmt.free();
    return results;
  }

  // Méthodes pour les devoirs
  saveHomework(homework: HomeworkRecord): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO homeworks 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      homework.id,
      homework.pronoteId,
      homework.subject,
      homework.title,
      homework.description,
      homework.dueDate,
      homework.done ? 1 : 0,
      homework.attachments,
      homework.fetchedAt
    ]);
    stmt.step();
    stmt.free();
  }

  getHomeworks(): HomeworkRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM homeworks 
      ORDER BY dueDate ASC
    `);
    
    const results: HomeworkRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const homework = row as unknown as HomeworkRecord;
      homework.done = Boolean(row.done);
      results.push(homework);
    }
    stmt.free();
    return results;
  }

  getHomeworksDueBetween(startDate: string, endDate: string): HomeworkRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM homeworks 
      WHERE dueDate BETWEEN ? AND ? 
      ORDER BY dueDate ASC
    `);
    stmt.bind([startDate, endDate]);
    
    const results: HomeworkRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const homework = row as unknown as HomeworkRecord;
      homework.done = Boolean(row.done);
      results.push(homework);
    }
    stmt.free();
    return results;
  }

  updateHomeworkStatus(id: string, done: boolean): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      UPDATE homeworks SET done = ? WHERE id = ?
    `);
    stmt.bind([done ? 1 : 0, id]);
    stmt.step();
    stmt.free();
  }

  // Méthodes pour les paramètres
  saveSetting(key: string, value: string): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value) 
      VALUES (?, ?)
    `);
    stmt.bind([key, value]);
    stmt.step();
    stmt.free();
  }

  getSetting(key: string): string | null {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT value FROM settings WHERE key = ?
    `);
    stmt.bind([key]);
    
    let result: string | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      result = row.value as string;
    }
    stmt.free();
    return result;
  }

  getAllSettings(): SettingsRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM settings
    `);
    
    const results: SettingsRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as unknown as SettingsRecord);
    }
    stmt.free();
    return results;
  }

  // Méthodes pour les credentials
  saveCredentials(credentials: CredentialsRecord): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO credentials 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      credentials.id,
      credentials.url,
      credentials.username,
      Array.from(credentials.encryptedPassword),
      credentials.ent || null,
      credentials.lastLogin,
      credentials.createdAt
    ]);
    stmt.step();
    stmt.free();
  }

  getCredentials(url: string): CredentialsRecord | null {
    if (!this.db) return null;

    const stmt = this.db.prepare(`
      SELECT * FROM credentials WHERE url = ?
    `);
    stmt.bind([url]);
    
    let result: CredentialsRecord | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      result = {
        id: row.id as string,
        url: row.url as string,
        username: row.username as string,
        encryptedPassword: Buffer.from(row.encryptedPassword as any),
        ent: row.ent as string,
        lastLogin: row.lastLogin as string,
        createdAt: row.createdAt as string
      };
    }
    stmt.free();
    return result;
  }

  getAllCredentials(): CredentialsRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM credentials 
      ORDER BY lastLogin DESC
    `);
    
    const results: CredentialsRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        url: row.url as string,
        username: row.username as string,
        encryptedPassword: Buffer.from(row.encryptedPassword as any),
        ent: row.ent as string,
        lastLogin: row.lastLogin as string,
        createdAt: row.createdAt as string
      });
    }
    stmt.free();
    return results;
  }

  deleteCredentials(url: string): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      DELETE FROM credentials WHERE url = ?
    `);
    stmt.bind([url]);
    stmt.step();
    stmt.free();
  }

  // Méthodes pour les objectifs
  saveGoal(goal: GoalRecord): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO goals 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      goal.id,
      goal.subject,
      goal.targetGrade,
      goal.currentGrade,
      goal.deadline,
      goal.progress,
      goal.createdAt,
      goal.updatedAt
    ]);
    stmt.step();
    stmt.free();
  }

  getGoals(): GoalRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM goals 
      ORDER BY deadline ASC
    `);
    
    const results: GoalRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as unknown as GoalRecord);
    }
    stmt.free();
    return results;
  }

  // Méthodes pour les achievements
  saveAchievement(achievement: AchievementRecord): void {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO achievements 
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.bind([
      achievement.id,
      achievement.userId,
      achievement.badgeId,
      achievement.earnedAt,
      achievement.metadata
    ]);
    stmt.step();
    stmt.free();
  }

  getAchievements(userId: string): AchievementRecord[] {
    if (!this.db) return [];

    const stmt = this.db.prepare(`
      SELECT * FROM achievements 
      WHERE userId = ? 
      ORDER BY earnedAt DESC
    `);
    stmt.bind([userId]);
    
    const results: AchievementRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as unknown as AchievementRecord);
    }
    stmt.free();
    return results;
  }

  // Statistiques
  getStats(): {
    totalGrades: number;
    averageGrade: number;
    totalHomeworks: number;
    completedHomeworks: number;
  } {
    if (!this.db) {
      return {
        totalGrades: 0,
        averageGrade: 0,
        totalHomeworks: 0,
        completedHomeworks: 0
      };
    }

    // Nombre total de notes
    const gradesStmt = this.db.prepare(`
      SELECT COUNT(*) as count, AVG(grade) as avg 
      FROM grades
    `);
    gradesStmt.step();
    const gradesRow = gradesStmt.getAsObject();
    gradesStmt.free();

    // Nombre total de devoirs et devoirs terminés
    const homeworksStmt = this.db.prepare(`
      SELECT COUNT(*) as total, SUM(done) as completed 
      FROM homeworks
    `);
    homeworksStmt.step();
    const homeworksRow = homeworksStmt.getAsObject();
    homeworksStmt.free();

    return {
      totalGrades: gradesRow.count as number || 0,
      averageGrade: gradesRow.avg as number || 0,
      totalHomeworks: homeworksRow.total as number || 0,
      completedHomeworks: homeworksRow.completed as number || 0
    };
  }

  // Nettoyage
  close(): void {
    if (this.db) {
      this.saveToFile();
      this.db.close();
      this.db = null;
    }
  }
}

export default DatabaseManager;

// Singleton instance
export const dbManager = new DatabaseManager();

export function initDatabase(): Promise<void> {
  return dbManager.init();
}