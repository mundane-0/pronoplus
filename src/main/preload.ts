import { contextBridge, ipcRenderer } from 'electron';

// Types placeholder for pawnote compatibility
type PronoteApiAccount = Record<string, any>;

// Définir les types pour l'API exposée
export interface MainAPI {
  // Auth
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => Promise<void>;
  getSavedCredentials: () => Promise<SavedCredentials | null>;
  deleteSavedCredentials: () => Promise<void>;
  
  // Pronote data
  fetchGrades: () => Promise<Grade[]>;
  fetchHomeworks: () => Promise<Homework[]>;
  fetchTimetable: (startDate: string, endDate: string) => Promise<TimetableEntry[]>;
  fetchAbsences: () => Promise<Absence[]>;
  fetchMessages: () => Promise<Message[]>;
  fetchInfos: () => Promise<SchoolInfo>;
  
  // Database
  saveGradeAnalysis: (analysis: GradeAnalysis) => Promise<void>;
  getGradeAnalysis: (subjectId: string) => Promise<GradeAnalysis | null>;
  saveGoals: (goals: Goal[]) => Promise<void>;
  getGoals: () => Promise<Goal[]>;
  
  // Settings
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  
  // Export
  exportGradesCSV: () => Promise<string>;
  exportGradesPDF: () => Promise<Buffer>;
  exportCalendarICS: (events: CalendarEvent[]) => Promise<string>;
  
  // Notifications
  scheduleNotification: (notification: NotificationData) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  
  // AI Assistant
  aiSummarize: (content: string) => Promise<string>;
  aiExplainSubject: (subject: string, context: string) => Promise<string>;
  aiGenerateQuiz: (topic: string) => Promise<Quiz>;
}

// Types pour l'API
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

interface SavedCredentials {
  url: string;
  username: string;
  encryptedPassword: Buffer;
  ent?: string;
  lastLogin: string;
}

interface Grade {
  id: string;
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
}

interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  done: boolean;
  attachments: string[];
}

interface TimetableEntry {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startDate: string;
  endDate: string;
  isCancelled: boolean;
  isModified: boolean;
  color: string;
}

interface Absence {
  id: string;
  date: string;
  duration: number;
  justified: boolean;
  reason?: string;
}

interface Message {
  id: string;
  from: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
  attachments: string[];
}

interface SchoolInfo {
  name: string;
  address: string;
  phone: string;
  director: string;
}

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

// Exposer l'API sécurisée au renderer
contextBridge.exposeInMainWorld('mainAPI', {
  // Auth
  login: (credentials: LoginCredentials) => 
    ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),
  getSavedCredentials: () => ipcRenderer.invoke('get-saved-credentials'),
  deleteSavedCredentials: () => ipcRenderer.invoke('delete-saved-credentials'),
  
  // Pronote data
  fetchGrades: () => ipcRenderer.invoke('fetch-grades'),
  fetchHomeworks: () => ipcRenderer.invoke('fetch-homeworks'),
  fetchTimetable: (startDate: string, endDate: string) => 
    ipcRenderer.invoke('fetch-timetable', { startDate, endDate }),
  fetchAbsences: () => ipcRenderer.invoke('fetch-absences'),
  fetchMessages: () => ipcRenderer.invoke('fetch-messages'),
  fetchInfos: () => ipcRenderer.invoke('fetch-infos'),
  
  // Database
  saveGradeAnalysis: (analysis: GradeAnalysis) => 
    ipcRenderer.invoke('save-grade-analysis', analysis),
  getGradeAnalysis: (subjectId: string) => 
    ipcRenderer.invoke('get-grade-analysis', subjectId),
  saveGoals: (goals: Goal[]) => ipcRenderer.invoke('save-goals', goals),
  getGoals: () => ipcRenderer.invoke('get-goals'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: AppSettings) => 
    ipcRenderer.invoke('save-settings', settings),
  
  // Export
  exportGradesCSV: () => ipcRenderer.invoke('export-grades-csv'),
  exportGradesPDF: () => ipcRenderer.invoke('export-grades-pdf'),
  exportCalendarICS: (events: CalendarEvent[]) => 
    ipcRenderer.invoke('export-calendar-ics', events),
  
  // Notifications
  scheduleNotification: (notification: NotificationData) => 
    ipcRenderer.invoke('schedule-notification', notification),
  cancelNotification: (id: string) => 
    ipcRenderer.invoke('cancel-notification', id),
  
  // AI Assistant
  aiSummarize: (content: string) => ipcRenderer.invoke('ai-summarize', content),
  aiExplainSubject: (subject: string, context: string) => 
    ipcRenderer.invoke('ai-explain-subject', { subject, context }),
  aiGenerateQuiz: (topic: string) => ipcRenderer.invoke('ai-generate-quiz', topic),
} as MainAPI);