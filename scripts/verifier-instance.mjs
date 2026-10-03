/**
 * Validation bout-en-bout du code applicatif : on instancie le vrai
 * `PronoteManager` du processus principal (avec Electron neutralise), on se
 * connecte a l'instance de demonstration, puis on appelle les methodes de
 * donnees reellement utilisees par l'application.
 *
 * Objectif : verifier que les correspondances de champs de l'application sont
 * exactes, et non seulement que la bibliotheque repond.
 *
 * Avertissement : interroge une instance Pronote. N'utilisez que l'instance de
 * demonstration de Pronote (`https://demo.index-education.net/pronote`) ou une
 * instance dont vous etes responsable : Pronote bloque les adresses IP trop
 * sollicitees. Espacez les executions de plusieurs minutes.
 *
 * Les intervalles de dates sont specificables par variables d'environnement,
 * car l'emploi du temps de l'instance de demonstration se situe en 2027.
 *
 * Usage : npm run build:main && node scripts/verifier-instance.mjs
 */
import Module from 'node:module';
import { mkdirSync } from 'node:fs';

// --- Electron neutralise ----------------------------------------------------
const USER_DATA = '/tmp/opencode/pronoplus-test';
mkdirSync(USER_DATA, { recursive: true });

const electronStub = {
  app: { isPackaged: false, getPath: () => USER_DATA, getVersion: () => 'test' },
  ipcMain: { handle() {}, on() {}, removeHandler() {} },
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (s) => Buffer.from(s, 'utf8'),
    decryptString: (b) => b.toString('utf8')
  },
  BrowserWindow: class {
    static getAllWindows() {
      return [];
    }
  },
  Notification: class {
    constructor() {}
    show() {}
  },
  shell: { openExternal() {} }
};

const chargementOriginal = Module._load;
Module._load = function (requete, ...reste) {
  if (requete === 'electron') return electronStub;
  return chargementOriginal.call(this, requete, ...reste);
};

// --- Le vrai code de l'application -------------------------------------------
const { pronoteManager: app } = await import('../dist/main/pronote.js');

const RACINE = process.env.PRONOTE_URL ?? 'https://demo.index-education.net/pronote';
const IDENT = {
  username: process.env.PRONOTE_USER ?? 'demonstration',
  password: process.env.PRONOTE_PASS ?? 'pronotevs'
};
const DEBUT = process.env.PRONOTE_DEBUT ?? '2027-05-31';
const FIN = process.env.PRONOTE_FIN ?? '2027-06-13';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Connexion ---------------------------------------------------------------
const res = await app.login({
  url: RACINE,
  username: IDENT.username,
  password: IDENT.password,
  rememberMe: false
});
if (!res.success) {
  console.error('ECHEC de connexion :', res.error);
  process.exit(1);
}
console.log(
  'connexion   :',
  res.user?.name,
  '|',
  res.user?.class?.name,
  '|',
  res.user?.establishment?.name
);

let echecs = 0;
let total = 0;

async function verifier(titre, fn, afficher) {
  total += 1;
  await pause(2500);
  try {
    const v = await fn();
    console.log(`  OK    ${titre.padEnd(22)} ${afficher(v)}`);
  } catch (e) {
    echecs += 1;
    console.log(`  ECHEC ${titre.padEnd(22)} ${e?.message ?? e}`);
  }
}

const liste = (n) => `${n ?? 0} element(s)`;
const dateFr = (s) =>
  s ? new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '?';

console.log('\nappels de donnees de l\'application :');

await verifier(
  'fetchGrades',
  () => app.fetchGrades(),
  (g) =>
    `${liste(g.length)} | notées=${g.filter((x) => x.grade !== null).length}` +
    ` | ex: ${g.find((x) => x.grade !== null)?.subject} ` +
    `${g.find((x) => x.grade !== null)?.grade}/${g.find((x) => x.grade !== null)?.scale}`
);

await verifier(
  'fetchGradeSummary',
  () => app.fetchGradeSummary(),
  (s) =>
    `${s.averages.length} matiere(s) | generale=${s.overallAverage} | classe=${s.classAverage}`
);

await verifier(
  'fetchHomeworks',
  () => app.fetchHomeworks(),
  (h) =>
    `${liste(h.length)} | ex: ${h[0]?.subject} ${dateFr(h[0]?.dueDate)} « ${String(h[0]?.description).slice(0, 30)} »`
);

await verifier(
  'fetchTimetable',
  () => app.fetchTimetable(DEBUT, FIN),
  (t) =>
    `${liste(t.length)} | ex: ${dateFr(t[0]?.startDate)} ${t[0]?.subject} ${t[0]?.room} (${t[0]?.teacher})`
);

await verifier(
  'fetchAbsences',
  () => app.fetchAbsences(),
  (a) =>
    `${liste(a.length)} | ex: ${dateFr(a[0]?.date)} ${a[0]?.duration} min ${a[0]?.justified ? 'justifiee' : 'non justifiee'} « ${a[0]?.reason ?? ''} »`
);

await verifier(
  'fetchMessages',
  () => app.fetchMessages(),
  (m) =>
    `${liste(m.length)} | ex: [${m[0]?.type}] ${m[0]?.subject} — ${m[0]?.from}`
);

await verifier(
  'fetchInfos',
  () => app.fetchInfos(),
  (i) =>
    `${i.name} (${i.class?.name}) | ${i.address} | ${i.email} | ${i.ine ? 'INE ok' : 'pas d INE'}`
);

console.log(`\n${total - echecs}/${total} appel(s) en succes`);
process.exit(echecs === 0 ? 0 : 2);