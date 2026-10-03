import { BrowserWindow, ipcMain, safeStorage } from 'electron';
import {
  authenticatePronoteCredentials,
  authenticateToken,
  authenticatePronoteQRCode,
  getPronoteInstanceInformation,
  defaultPawnoteFetcher
} from 'pawnote';
import { randomUUID } from 'crypto';
import { decode as decodeEntities } from 'html-entities';
import {
  createSessionFetcher,
  openEntLoginWindow,
  closeEntWindow,
  entLog,
  type EntIdentity
} from './entAuth';
import { dbManager, CredentialsRecord } from './database';
import {
  buildDemoGrades,
  buildDemoHomeworks,
  buildDemoTimetable,
  buildDemoAbsences,
  buildDemoMessages,
  buildDemoInfos
} from './demoData';

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

/**
 * Retire les accents d'une chaîne.
 *
 * Indispensable pour retrouver le compte « Élève » : le nom réel contient un
 * E accentué, et une recherche sur « eleve » échoue silencieusement.
 */
function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Vrai si le compte correspond à un profil élève. */
function isStudentAccount(name: string): boolean {
  return /eleve|student|apprenant/i.test(stripAccents(String(name)));
}

/** Libellé français des statuts que Pronote renvoie à la place d'une note. */
const GRADE_STATUS: Record<string, string> = {
  ERROR: 'note illisible',
  GRADE: '',
  ABSENT: 'absent',
  EXEMPTED: 'dispensé',
  NOT_GRADED: 'non noté',
  UNFIT: 'inadapté',
  UNRETURNED: 'non rendu',
  ABSENT_ZERO: 'absent, zéro',
  UNRETURNED_ZERO: 'non rendu, zéro',
  CONGRATULATIONS: 'felicitations'
};

/**
 * pawnote renvoie soit un nombre (`12.5`), soit une chaîne d'état
 * (`"1|ABSENT"`) lorsqu'il n'y a pas de note à proprement parler.
 * On uniformise en `null` pour tout ce qui n'est pas une note.
 */
function gradeValue(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'string' && !raw.includes('|')) {
    const n = Number(raw.replace(/,/g, '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Traduit `"1|ABSENT"` en « absent », et une vraie note en `null`. */
function gradeStatus(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.includes('|')) return null;
  const key = raw.slice(raw.indexOf('|') + 1).trim().toUpperCase();
  return GRADE_STATUS[key] ?? raw;
}

/** pawnote renvoie des `Date` ; l'interface de l'application attend une chaîne. */
function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

/** Accepte une `Date`, une chaîne ISO, ou un nombre (epoch ms). */
function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string' && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Pronote renvoie les descriptions en HTML encodé (`&lt;p&gt;Exercices&nbsp;2`).
 * L'application affiche du texte simple : on décode puis on retire le balisage,
 * en conservant les sauts de ligne.
 */
function stripHtml(input: string): string {
  return decodeEntities(
    input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]*>/g, '')
  )
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Identité fournie par l'ENT lors de la fenêtre de connexion.
 * Elle est renseignée par `login-ent-window` et consommée par `login-ent`.
 */
let entSessionStore: EntIdentity | null = null;

class PronoteManager {
  private currentSession: any | null = null;
  private isAuthenticated: boolean = false;
  /** Mode démonstration : les fetches renvoient des données factices */
  private isDemo: boolean = false;
  private demoUser: any = null;
  /** Nom de l'établissement fourni par l'instance Pronote */
  private currentSchoolName: string | null = null;

  /**
   * Connexion réelle à Pronote via pawnote.
   * L'URL est complétée automatiquement du chemin de compte (/eleve, /parent, etc.)
   * en interrogeant l'instance Pronote de l'établissement.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { url, username, password, rememberMe } = credentials;

      const baseUrl = url.trim();
      if (!baseUrl) return { success: false, error: 'URL Pronote manquante' };
      if (!username?.trim() || !password) {
        return { success: false, error: 'Identifiant et mot de passe requis' };
      }

      // 1) Interroger l'instance : types de comptes + URL racine mobile
      const instance = await getPronoteInstanceInformation(defaultPawnoteFetcher, {
        pronoteURL: baseUrl
      });

      const accounts = instance?.accounts ?? [];
      if (accounts.length === 0) {
        return {
          success: false,
          error: 'Aucun compte trouvé à cette adresse Pronote'
        };
      }

      // 2) On privilégie le compte élève, sinon le premier disponible
      const preferred =
        accounts.find((a: any) => isStudentAccount(a.name)) ||
        accounts[0];

      // L'authentification mobile se fait sur l'URL racine renvoyée par l'instance
      const rootUrl = instance.pronoteRootURL || baseUrl;

      // 3) Authentification
      const session = await authenticatePronoteCredentials(rootUrl, {
        username: username.trim(),
        password,
        accountTypeID: preferred.id,
        deviceUUID: randomUUID(),
        fetcher: defaultPawnoteFetcher
      });

      this.currentSession = session;
      this.isAuthenticated = true;
      this.isDemo = false;
      this.currentSchoolName = instance.schoolName || null;

      // 4) Identité de l'élève.
      // pawnote la met sur la session dès l'authentification
      // (`studentName`, `studentClass`) : inutile d'aller la redemander,
      // ce qui consommerait une requête et échouerait pour un compte
      // dont l'onglet « informations personnelles » n'est pas ouvert.
      const user: any = {
        id: preferred.id,
        name: session.studentName || username.trim(),
        class: { name: session.studentClass || 'Classe inconnue' },
        establishment: {
          name: instance.schoolName || new URL(baseUrl).hostname
        },
        avatar: session.studentProfilePictureURL
      };

      if (rememberMe) await this.saveCredentials(credentials);

      return { success: true, user };
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.error('Erreur de connexion Pronote:', msg);
      if (error?.stack) console.error(error.stack);

      let errorMessage = 'Erreur de connexion';
      if (/network|fetch|ENOTFOUND|ECONNREFUSED|timeout/i.test(msg)) {
        errorMessage = 'Erreur réseau - Vérifiez votre connexion et l\'URL';
      } else if (/credential|password|incorrect|401/i.test(msg)) {
        errorMessage = 'Identifiants incorrects';
      } else if (/session/i.test(msg)) {
        errorMessage =
          "Le serveur de l'établissement n'a pas renvoyé de session. Vérifiez l'URL (avec /pronote/) et utilisez le compte « Élève ».";
      } else if (/instance|not found|404/i.test(msg)) {
        errorMessage = 'URL Pronote invalide';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Connexion via l'ENT de l'établissement (authentification CAS).
   *
   * Beaucoup de collèges n'exposent aucun identifiant ni mot de passe Pronote :
   * c'est le portail ENT de l'académie qui authentifie l'élève. Le portail
   * renvoie ensuite vers la page mobile de Pronote, qui porte le
   * `numeroJeton` (`e`) et la `cleJeton` (`f`) de l'utilisateur.
   *
   * On s'authentifie alors par jeton, avec `pourENT: true` et une clé AES
   * calculée sans l'identifiant — c'est ce qu'attend Pronote 2026 d'une
   * session ouverte par un ENT.
   */
  async loginWithEnt(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const baseUrl = credentials.url.trim();
      if (!baseUrl) return { success: false, error: 'URL Pronote manquante' };

      const instance = await getPronoteInstanceInformation(defaultPawnoteFetcher, {
        pronoteURL: baseUrl
      });

      const accounts: any[] = instance?.accounts ?? [];
      const student =
        accounts.find((a: any) => isStudentAccount(a.name)) ?? accounts[0];
      if (!student) {
        return {
          success: false,
          error: "Aucun compte « Élève » n'existe à cette adresse Pronote"
        };
      }

      const entSession = entSessionStore;
      if (!entSession?.token || !entSession?.username) {
        return {
          success: false,
          error:
            "L'ENT n'a pas créé de session Pronote. Reconnecte-toi à l'ENT, puis réessaie."
        };
      }

      // L'ENT indique lui-même l'espace qu'il a ouvert (genreAcces dans la
      // page). On lui fait confiance : c'est le seul compte qui vient d'être
      // authentifié, et lui demander un autre espace serait refusé.
      const account =
        accounts.find((a: any) => a.id === entSession.accountTypeID) ?? student;

      const fetcher = createSessionFetcher();
      entLog(
        `authentification ENT sur ${instance.pronoteRootURL} (compte ${account.id})`
      );

      // `useENT` n'est pas déclaré par pawnote : sans notre correctif, la clé
      // AES serait calculée avec l'identifiant en préfixe et Pronote refuserait
      // le jeton. `scripts/patch-pawnote.mjs` rend ce drapeau effectif.
      const session = await authenticateToken(
        instance.pronoteRootURL || baseUrl,
        {
          username: entSession.username,
          token: entSession.token,
          accountTypeID: account.id,
          deviceUUID: randomUUID(),
          fetcher,
          useENT: true
        } as any
      );

      this.currentSession = session;
      this.isAuthenticated = true;
      this.isDemo = false;
      this.currentSchoolName = instance.schoolName || null;

      const user: any = {
        id: account.id,
        name: (session as any).studentName || entSession.username,
        class: { name: (session as any).studentClass || 'Classe inconnue' },
        establishment: { name: instance.schoolName || new URL(baseUrl).hostname },
        avatar: (session as any).studentProfilePictureURL
      };

      return { success: true, user };
    } catch (error: any) {
      const msg = error?.message || String(error);
      entLog(`ECHEC pawnote : ${msg}`);

      let errorMessage = "Erreur de connexion via l'ENT";
      if (/network|fetch|ENOTFOUND|ECONNREFUSED|timeout|socket/i.test(msg)) {
        errorMessage = 'Erreur réseau - Vérifiez votre connexion internet';
      } else if (/IP address is temporarily suspended|adresse IP/i.test(msg)) {
        errorMessage = "Ton adresse IP est temporairement bloquée par le serveur";
      } else if (/username or password is incorrect|challenge/i.test(msg)) {
        errorMessage =
          "L'ENT a renvoyé un jeton que Pronote refuse. Reconnecte-toi à l'ENT.";
      } else if (/rate-limited|rate limited/i.test(msg)) {
        errorMessage = 'Trop de tentatives. Patiente quelques minutes.';
      } else if (/page has expired|extract session|does not exist/i.test(msg)) {
        errorMessage =
          "Pronote n'a pas ouvert de session. Reconnecte-toi à l'ENT, puis réessaie.";
      } else {
        // Pronote 2025+ répond « Vous avez dépassé le nombre d'erreurs
        // d'authentification autorisées » : c'est son anti-brute-force, il
        // se relâche tout seul après quelques minutes.
        errorMessage =
          'Trop de tentatives de connexion. Patiente quelques minutes, puis réessaie.';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Connexion par QR code Pronote.
   * L'utilisateur se connecte au site web Pronote, demande un QR code,
   * saisit le code à 4 chiffres affiché dans l'application.
   */
  async loginWithQrCode(credentials: {
    pinCode: string;
    jeton: string;
    login: string;
    url: string;
  }): Promise<LoginResult> {
    try {
      if (!credentials?.pinCode || !credentials?.jeton) {
        return {
          success: false,
          error: 'QR code ou code à 4 chiffres manquant'
        };
      }

      const session = await authenticatePronoteQRCode({
        pinCode: credentials.pinCode.trim(),
        dataFromQRCode: {
          jeton: credentials.jeton.trim(),
          login: credentials.login.trim(),
          url: credentials.url.trim()
        },
        deviceUUID: randomUUID(),
        fetcher: createSessionFetcher()
      });

      this.currentSession = session;
      this.isAuthenticated = true;
      this.isDemo = false;

      return {
        success: true,
        user: {
          id: 'qr',
          name: credentials.login.trim(),
          class: { name: 'Classe inconnue' },
          establishment: { name: 'Établissement inconnu' }
        }
      };
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.error('Erreur de connexion QR:', msg);

      let errorMessage = 'Erreur de connexion par QR code';
      if (/pin|code/i.test(msg)) {
        errorMessage = 'Code à 4 chiffres incorrect ou expiré';
      } else if (/session/i.test(msg)) {
        errorMessage = 'QR code expiré - Générez-en un nouveau sur le site Pronote';
      }

      return { success: false, error: errorMessage };
    }
  }

  async loginDemo(credentials: LoginCredentials): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const username = credentials.username?.trim();
      const url = credentials.url?.trim();

      if (!username || !url) {
        return { success: false, error: 'Identifiant et URL Pronote sont requis' };
      }

      this.isDemo = true;
      this.isAuthenticated = true;
      this.currentSession = null;
      this.demoUser = {
        id: 'demo-user',
        name: username.toUpperCase(),
        class: { name: '2nde A', id: 'demo-class' },
        establishment: { name: 'Lycée Démo', id: 'demo-school' },
        profile: { photo: undefined }
      };

      return { success: true, user: this.demoUser };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur du mode démonstration' };
    }
  }

  async logout(): Promise<void> {
    this.currentSession = null;
    this.isAuthenticated = false;
    this.isDemo = false;
    this.demoUser = null;
    this.currentSchoolName = null;
    entSessionStore = null;

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

  async getSavedCredentials(): Promise<any | null> {
    try {
      const credRecord = dbManager.getCredentials();
      if (!credRecord) return null;
      if (!safeStorage.isEncryptionAvailable()) return null;

      return {
        url: credRecord.url,
        username: credRecord.username,
        password: safeStorage.decryptString(credRecord.encryptedPassword),
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

  private requireSession(): any {
    if (!this.currentSession || !this.isAuthenticated) {
      throw new Error('Non authentifié');
    }
    return this.currentSession;
  }

  async fetchGrades(): Promise<any[]> {
    if (this.isDemo) return buildDemoGrades() as any;

    const session = this.requireSession();

    // pawnote ne met les notes qu'avec leur valeur dans `getGradesOverview`.
    // `getEvaluations` ne renvoie que le descriptif des évaluations (nom,
    // enseignant, compétences) : sans note, inutile pour alimenter l'écran.
    const overview: any = await session.getGradesOverview();

    const grades = (overview?.grades ?? []).map((g: any) => {
      const value = gradeValue(g.value);
      const outOf = gradeValue(g.outOf) ?? gradeValue(g.defaultOutOf) ?? 20;
      return {
        id: String(g.id),
        subject: g.subject?.name ?? 'Matière',
        title: gradeStatus(value) || g.subject?.name || 'Évaluation',
        grade: value,
        scale: outOf,
        coefficient: Number(g.coefficient) || 1,
        classAverage: gradeValue(g.average),
        min: gradeValue(g.min),
        max: gradeValue(g.max),
        date: toIso(g.date),
        period: g.period?.name ?? 'Période',
        teacher: '',
        comment: g.comment ? stripHtml(String(g.comment)) : undefined,
        isBonus: Boolean(g.isBonus),
        isOptional: Boolean(g.isOptional),
        subjectId: g.subject?.id
      };
    });

    // Mise en cache locale pour l'analyse. Une entrée sans note (absent,
    // non rendu…) ne veut rien dire pour une moyenne : on l'écarte.
    grades
      .filter((g: any) => g.grade !== null)
      .forEach((g: any) => {
        try {
          dbManager.saveGrade({
            id: g.id,
            pronoteId: g.id,
            subject: g.subject,
            title: g.title,
            grade: g.grade,
            scale: g.scale,
            coefficient: g.coefficient,
            classAverage: g.classAverage ?? 0,
            min: g.min ?? 0,
            max: g.max ?? 0,
            date: g.date,
            period: String(g.period),
            teacher: g.teacher,
            comment: g.comment,
            fetchedAt: new Date().toISOString()
          });
        } catch (e) {
          console.error('Erreur de mise en cache des notes:', e);
        }
      });

    return grades;
  }

  /**
   * Moyennes par matière et moyenne générale.
   *
   * `fetchGrades` renvoie la liste des notes : la moyenne générale et les
   * moyennes de classe vivent dans une autre réponse du serveur
   * (`moyGenerale`/`moyGeneraleClasse`) et seraient perdues sinon.
   */
  async fetchGradeSummary(): Promise<any> {
    if (this.isDemo) {
      const grades = buildDemoGrades() as any[];
      const subjects = new Map<string, { sum: number; n: number }>();
      for (const g of grades) {
        const e = subjects.get(g.subject) ?? { sum: 0, n: 0 };
        e.sum += Number(g.grade) || 0;
        e.n += 1;
        subjects.set(g.subject, e);
      }
      const averages = [...subjects].map(([subject, { sum, n }]) => ({
        subject,
        name: subject,
        student: n ? sum / n : 0,
        outOf: 20,
        classAverage: n ? sum / n : 0,
        min: 0,
        max: 20
      }));
      return {
        averages,
        overallAverage: averages.length
          ? averages.reduce((s, a) => s + a.student, 0) / averages.length
          : 0,
        classAverage: 0
      };
    }

    const session = this.requireSession();
    const overview: any = await session.getGradesOverview();

    return {
      averages: (overview?.averages ?? []).map((a: any) => ({
        subject: a.subject?.name ?? 'Matière',
        name: a.subject?.name ?? 'Matière',
        student: gradeValue(a.student),
        outOf: gradeValue(a.outOf) ?? gradeValue(a.defaultOutOf) ?? 20,
        classAverage: gradeValue(a.class_average),
        min: gradeValue(a.min),
        max: gradeValue(a.max),
        color: a.backgroundColor ?? ''
      })),
      overallAverage: gradeValue(overview?.overallAverage),
      classAverage: gradeValue(overview?.classAverage)
    };
  }

  async fetchHomeworks(): Promise<any[]> {
    if (this.isDemo) return buildDemoHomeworks() as any;

    const session = this.requireSession();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 30);

    const list = await session.getHomeworkForInterval(from, to);

    // pawnote nomme l'échéance `deadline` et ne donne pas d'enseignant.
    return (list || []).map((hw: any) => ({
      id: String(hw.id),
      subject: hw.subject?.name ?? 'Devoir',
      title: hw.subject?.name ?? 'Devoir',
      description: stripHtml(String(hw.description ?? '')),
      dueDate: toIso(hw.deadline),
      date: toIso(hw.deadline),
      done: Boolean(hw.done),
      difficulty: Number(hw.difficulty) || 0,
      lengthInMinutes: Number(hw.lengthInMinutes) || 0,
      color: hw.backgroundColor ?? '',
      themes: (hw.themes ?? []).map((t: any) => t.name ?? String(t)),
      attachments: (hw.attachments ?? [])
        .map((a: any) => a.name ?? '')
        .filter(Boolean),
      hasTeacherResource: Boolean(hw.lessonResourceID),
      subjectId: hw.subject?.id
    }));
  }

  async fetchTimetable(startDate: string, endDate: string): Promise<any[]> {
    if (this.isDemo) return buildDemoTimetable() as any;

    const session = this.requireSession();

    // pawnote fournit l'emploi du temps semaine par semaine : on parcourt
    // toutes les semaines de l'intervalle demandé, sinon seules les cours de
    // la première semaine apparaîtraient.
    //
    // Attention, son `weekNumber` n'est PAS un numéro de semaine ISO : il est
    // relatif au premier lundi de l'année scolaire, que la session expose sous
    // le nom `firstMonday` (« Used to get week numbers relative to this
    // date »). Passer un numéro ISO fait返回 l'emploi du temps de la mauvaise
    // semaine, silencieusement : la reponse est valide, elle est simplement
    // celle d'une autre semaine.
    const from = new Date(startDate);
    const to = new Date(endDate);
    const lundiDe = (d: Date): Date => {
      const c = new Date(d);
      c.setHours(0, 0, 0, 0);
      c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
      return c;
    };
    const origine = lundiDe(toDate(session.firstMonday) ?? from);
    const numeroDe = (d: Date): number =>
      Math.round((lundiDe(d).getTime() - origine.getTime()) / 604_800_000) + 1;

    const weeks = new Set<number>();
    const cursor = lundiDe(from);
    while (cursor <= to) {
      weeks.add(numeroDe(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }

    const lessons: any[] = [];
    for (const week of weeks) {
      try {
        lessons.push(...((await session.getTimetableForWeek(week)) ?? []));
      } catch (e: any) {
        console.error(`Emploi du temps, semaine ${week} :`, e?.message ?? e);
      }
    }

    return lessons
      .map((l: any) => ({
        id: String(l.id),
        subject: l.subject?.name ?? 'Cours',
        teacher: (l.teacherNames ?? []).join(', '),
        room: (l.classrooms ?? []).join(', '),
        group: (l.groupNames ?? []).join(', '),
        start: toIso(l.start),
        end: toIso(l.end),
        startDate: toIso(l.start),
        endDate: toIso(l.end),
        isCancelled: Boolean(l.canceled),
        isExam: Boolean(l.test),
        isModified: false,
        color: l.backgroundColor ?? '',
        description: stripHtml(String(l.memo ?? '')),
        subjectId: l.subject?.id,
        hasLessonResource: Boolean(l.haveLessonResource)
      }))
      .filter((e: any) => {
        const t = new Date(e.start).getTime();
        return t >= from.getTime() && t <= to.getTime();
      })
      .sort((a: any, b: any) => a.start.localeCompare(b.start));
  }

  async fetchAbsences(): Promise<any[]> {
    if (this.isDemo) return buildDemoAbsences() as any;

    const session = this.requireSession();
    // pawnote mélange absences, sanctions et observations dans le même
    // tableau. `getAttendance` ne construit pas de classe nommée lisible après
    // minification : on trie sur la présence du champ `reason`, propre aux
    // absences (les sanctions portent `reasons`, les observations rien).
    const list = await session.getAttendance();

    return (list || [])
      .filter((a: any) => 'reason' in a && !('reasons' in a))
      .map((a: any) => {
        const start = toDate(a.from);
        const end = toDate(a.to);
        return {
          id: String(a.id),
          date: start ? start.toISOString() : new Date().toISOString(),
          startDate: start ? start.toISOString() : '',
          endDate: end ? end.toISOString() : '',
          duration:
            (Number(a.hoursMissed) || 0) * 60 + (Number(a.minutesMissed) || 0),
          justified: Boolean(a.justified),
          reason: a.reason || undefined,
          isReasonUnknown: Boolean(a.isReasonUnknown),
          shouldParentsJustify: Boolean(a.shouldParentsJustify),
          comment: a.reason ?? ''
        };
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  }

  async fetchMessages(): Promise<any[]> {
    if (this.isDemo) return buildDemoMessages() as any;

    const session = this.requireSession();

    // La messagerie de Pronote et les actualités sont deux choses distinctes,
    // mais l'écran « Messages » regroupe les deux.
    const [news, discussions] = await Promise.all([
      session.getNews().catch((e: any) => {
        console.error('Actualités :', e?.message ?? e);
        return null;
      }),
      session.getDiscussionsOverview().catch((e: any) => {
        console.error('Messagerie :', e?.message ?? e);
        return null;
      })
    ]);

    const fromNews = (news?.items ?? []).map((n: any) => ({
      id: `actu-${n.id}`,
      from: n.author || n.category?.name || 'Pronote',
      subject: n.title ?? 'Actualité',
      content: stripHtml(
        [
          n.category?.name ? `Catégorie : ${n.category.name}` : '',
          n.isSurvey ? 'Sondage' : '',
          n.isInformation ? 'Information' : ''
        ]
          .filter(Boolean)
          .join(' — ')
      ),
      date: toIso(n.creationDate),
      read: Boolean(n.read),
      hasAttachment: (n.questions?.length ?? 0) > 0,
      attachments: [] as string[],
      regID: String(n.id),
      sentBy: n.author || 'Pronote',
      type: 'news'
    }));

    const fromDiscussions = (discussions?.discussions ?? []).map((d: any) => ({
      id: `msg-${d.possessions?.[0] ?? d.subject}`,
      from: d.creator || d.recipientName || 'Pronote',
      subject: d.subject ?? 'Discussion',
      content: [
        d.numberOfMessages
          ? `${d.numberOfMessages} message(s)`
          : 'Aucun message',
        d.hourString ? `(${d.hourString})` : '',
        d.closed ? '(clos)' : ''
      ]
        .filter(Boolean)
        .join(' '),
      date: '',
      read: Boolean(d.read),
      hasAttachment: false,
      attachments: [] as string[],
      regID: String(d.possessions?.[0] ?? ''),
      sentBy: d.creator || 'Pronote',
      type: 'discussion'
    }));

    return [...fromDiscussions, ...fromNews];
  }

  async fetchInfos(): Promise<any> {
    if (this.isDemo) return buildDemoInfos() as any;

    const session = this.requireSession();
    // `getPersonalInformation` peut échouer (onglet compte non ouvert pour un
    // compte parent, par exemple) : l'identité de session suffit alors.
    const info: any = await session
      .getPersonalInformation()
      .catch((e: any) => {
        console.error('Informations personnelles :', e?.message ?? e);
        return null;
      });

    const address = (info?.address ?? []).filter(Boolean).join(' ');
    const full = [address, info?.postalCode, info?.city].filter(Boolean).join(' ');

    return {
      name: session.studentName || this.demoUser?.name || 'Élève',
      class: { name: session.studentClass || 'Classe inconnue' },
      establishment: { name: this.currentSchoolName ?? 'Établissement inconnu' },
      address: full,
      city: info?.city ?? '',
      postalCode: info?.postalCode ?? '',
      province: info?.province ?? '',
      country: info?.country ?? '',
      phone: info?.phone ?? '',
      email: info?.email ?? '',
      ine: info?.INE ?? '',
      profile: { photo: session.studentProfilePictureURL ?? null }
    };
  }

  setupHandlers(): void {
    ipcMain.handle('login', async (_event, credentials: LoginCredentials) =>
      this.login(credentials)
    );

    // 1) On interroge l'instance : comptes, racine mobile et URL de l'ENT
    ipcMain.handle('login-ent-open', async (_event, url: string) => {
      const baseUrl = (url || '').trim();
      if (!baseUrl) return { success: false, error: 'URL Pronote manquante' };

      let instance: any;
      try {
        instance = await getPronoteInstanceInformation(defaultPawnoteFetcher, {
          pronoteURL: baseUrl
        });
      } catch (e: any) {
        return {
          success: false,
          error: "Impossible de joindre l'adresse Pronote. Vérifie l'URL."
        };
      }

      const accounts: any[] = instance?.accounts ?? [];
      if (accounts.length === 0) {
        return {
          success: false,
          error: "Aucun compte n'existe à cette adresse Pronote"
        };
      }

      const student = accounts.find((a) => isStudentAccount(a.name));
      return {
        success: true,
        schoolName: instance?.schoolName ?? '',
        // L'ENT est déclaré par l'instance elle-même (infoMobileApp.json) :
        // c'est l'adresse du portail à ouvrir, pas celle de Pronote.
        entUrl: instance?.entURL ?? null,
        accountPath: student?.path ?? 'mobile.eleve.html'
      };
    });

    // 2) Ouverture de la fenêtre ENT : elle gère la redirection CAS et rend
    //    le numeroJeton / cleJeton de l'utilisateur.
    ipcMain.handle(
      'login-ent-window',
      async (_event, url: string, entUrl: string | null, accountPath: string) => {
        const base = (url || '').trim().replace(/\/+$/, '');
        const pronoteHost = new URL(base).hostname;
        // Sans ENT déclaré, on ouvre la page mobile de Pronote : certains
        // établissements y redirigent eux-mêmes vers leur portail.
        const startUrl = entUrl || `${base}/${accountPath || 'mobile.eleve.html'}`;

        const result = await openEntLoginWindow(
          BrowserWindow.getAllWindows()[0] ?? null,
          startUrl,
          pronoteHost
        );

        if (result.success && result.identity) {
          entSessionStore = result.identity;
        } else {
          entSessionStore = null;
        }
        return { success: result.success, reason: result.reason };
      }
    );

    // 3) Validation de la session à partir du jeton délivré par l'ENT
    ipcMain.handle('login-ent', async (_event, credentials: LoginCredentials) => {
      const res = await this.loginWithEnt(credentials);
      if (res.success) closeEntWindow();
      return res;
    });

    // Connexion par QR code
    ipcMain.handle('login-qrcode', async (_event, payload: any) =>
      this.loginWithQrCode(payload)
    );

    // Mode démonstration handler
    ipcMain.handle('login-demo', async (_event, credentials: LoginCredentials) =>
      this.loginDemo(credentials)
    );

    ipcMain.handle('logout', async () => {
      await this.logout();
    });

    ipcMain.handle('get-saved-credentials', async () =>
      this.getSavedCredentials()
    );

    ipcMain.handle('delete-saved-credentials', async () => {
      await this.deleteSavedCredentials();
    });

    ipcMain.handle('fetch-grades', async () => this.fetchGrades());
    ipcMain.handle('fetch-homeworks', async () => this.fetchHomeworks());
    ipcMain.handle('fetch-timetable', async (_e, startDate: string, endDate: string) =>
      this.fetchTimetable(startDate, endDate)
    );
    ipcMain.handle('fetch-absences', async () => this.fetchAbsences());
    ipcMain.handle('fetch-messages', async () => this.fetchMessages());
    ipcMain.handle('fetch-infos', async () => this.fetchInfos());
  }
}

export const pronoteManager = new PronoteManager();

export function setupPronoteHandlers(): void {
  pronoteManager.setupHandlers();
}
