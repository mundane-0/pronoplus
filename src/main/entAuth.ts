import { BrowserWindow, app } from 'electron';
import { appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultPawnoteFetcher } from 'pawnote';
import type { PawnoteFetcher } from 'pawnote';

/**
 * Journal de diagnostic local.
 *
 * Ces informations servent à mettre au point la connexion ENT ; elles ne sont
 * jamais affichées dans l'interface, qui ne montre que des messages clairs.
 * Le journal n'est actif que sur une exécution depuis les sources, jamais dans
 * une version publiée : `PRONOTE_DEBUG=1` permet de le forcer.
 *
 * Les URL sont volontairement expurgées : les chaînes `ticket=` et `jeton` sont
 * des jetons d'authentification réutilisables, qui ne doivent jamais être
 * écrits sur disque ni journalisés.
 */
const DEBUG =
  process.env.PRONOTE_DEBUG !== undefined
    ? process.env.PRONOTE_DEBUG === '1'
    : !app.isPackaged;

export function entLog(message: string): void {
  if (!DEBUG) return;
  console.log(`[ENT] ${new Date().toISOString().slice(11, 19)} ${redactSecrets(message)}`);
}

/**
 * Journal de bord des échanges réseau, pour poser un diagnostic à distance.
 *
 * Écrire dans la console ne suffit pas : l'utilisateur ne voit que la fenêtre,
 * et le launcher de l'application avale la sortie standard. Pire, une
 * application installée est `app.isPackaged`, donc `entLog` n'écrit rien du
 * tout — c'est pourquoi un échec de connexion ENT n'a laissé aucune trace et
 * n'a pu être qu'imaginé.
 *
 * Ce fichier est cette trace. Trois garde-fous :
 *
 * - il est **réécrit** à chaque tentative (`traceReset`), il ne grossit donc pas ;
 * - les **valeurs** de cookies n'y figurent jamais, seulement leurs noms ;
 * - le corps des réponses est tronqué à 400 caractères et expurgé des jetons
 *   (`ticket=`, `jeton`, `cleJeton`, `session`, identifiants de session).
 *
 * Il ne contient aucun mot de passe : ni EduConnect, ni Pronote.
 */
const TRACE_FILE = join(app.getPath('userData'), 'pronote-trace.log');

export function traceLog(message: string): void {
  const ligne = `${new Date().toISOString()} ${redactSecrets(message)}\n`;
  try {
    appendFileSync(TRACE_FILE, ligne);
  } catch {
    // Un journal indisponible ne doit jamais faire échouer une connexion.
  }
}

export function tracePath(): string | null {
  return TRACE_FILE;
}

/** Efface la tentative précédente : le journal ne décrit qu'un essai. */
export function traceReset(): void {
  try {
    writeFileSync(TRACE_FILE, `--- tentative ENT du ${new Date().toISOString()} ---\n`);
  } catch {
    traceLog('journal indisponible');
  }
}

/** Remplace les jetons d'authentification par une valeur neutre. */
export function redactSecrets(text: string): string {
  return text
    .replace(/(ticket|jeton|cleJeton|numeroJeton|identifiant|token|session|code)=([^&\s]+)/gi, '$1=***')
    .replace(/(ST-\d+-[A-Za-z0-9-]+)/g, '***')
    .replace(/([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})/gi, '***');
}

/**
 * Identité délivrée par l'ENT une fois l'authentification CAS réussie.
 *
 * Pronote ouvre alors une session à l'utilisateur et l'inscrit dans la page
 * mobile, via l'appel JavaScript `Start({...})` :
 *
 *   Start ({"h":915730, "e":"A12", "f":"<clé>", "a":6, "g":6, "p":1});
 *
 *  - `e` : numeroJeton, l'identifiant Pronote du compte ;
 *  - `f` : cleJeton, le secret qui remplace le mot de passe ;
 *  - `a` : genreEspace (6 = « Élève ») ;
 *  - `g` : genreAcces, l'espace réellement ouvert par l'ENT ;
 *  - `h` : numéro de session.
 *
 * Le couple (`e`, `f`) est précisément ce que Pronote attend d'une connexion
 * par jeton, avec `pourENT: true` et une clé AES sans identifiant.
 */
export interface EntIdentity {
  /** `e` — numeroJeton */
  username: string;
  /** `f` — cleJeton */
  token: string;
  /** `a` — genreEspace demandé par l'ENT, sinon `g` */
  accountTypeID: number;
  /** `h` — session ouverte par l'ENT */
  sessionID: number;
}

export interface EntLoginResult {
  success: boolean;
  identity?: EntIdentity;
  /**
   * Cookies que la fenêtre ENT a obtenus **pour le domaine Pronote seul**.
   *
   * Ils sont la trace de la validation CAS : c'est cette preuve qui manque à
   * pawnote, dont le jar est vide. Les domaines EduConnect et CAS en sont
   * naturellement exclus, `cookies.get({ url })` ne renvoyant que ce qui
   * correspond à l'URL demandée.
   */
  cookies?: Array<{ host: string; cookie: string }>;
  reason?: 'cancelled' | 'no-identity' | 'loop' | 'error-page';
}

/**
 * Extrait l'objet passé à `Start(...)` dans une page Pronote.
 *
 * Renvoie `null` si l'appel est absent. Les clés sont volontairement tolérantes
 * (`Start (` ou `Start(`) et l'objet est délimité par comptage d'accolades,
 * ce qui résiste à toute ponctuation ajoutée par le serveur.
 */
export function parseStartCall(html: string): Record<string, unknown> | null {
  const call = /Start\s*\(\s*/.exec(html);
  if (!call) return null;

  const start = html.indexOf('{', call.index + call[0].length);
  if (start < 0) return null;

  let depth = 0;
  let end = -1;
  let inString = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === '"') inString = !inString;
    else if (inString) continue;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  if (end < 0) return null;

  try {
    const raw = html.slice(start, end);
    // Le serveur écrit les clés sans guillemets dans certaines versions :
    // `Start({h:1,a:6})`. On les quote avant de passer le texte à JSON.parse.
    const json = raw
      .replace(/(['"])?([a-zA-Z_$][\w$]*)(['"])?\s*:/g, '"$2":')
      .replace(/'/g, '"');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Déduit une identité Pronote utilisable depuis l'objet `Start({...})`. */
export function identityFromStartCall(
  page: Record<string, unknown> | null,
  fallbackAccountTypeID: number
): EntIdentity | null {
  if (!page) return null;

  const username = page.e != null ? String(page.e) : '';
  const token = page.f != null ? String(page.f) : '';
  if (!username || !token) return null;

  // `g` (genreAcces) est l'espace réellement ouvert ; `a` (genreEspace) celui
  // demandé. Ils coïncident dans le cas courant.
  const accountTypeID =
    Number(page.g) || Number(page.a) || fallbackAccountTypeID || 6;
  const sessionID = Number(page.h) || 0;

  return { username, token, accountTypeID, sessionID };
}

/**
 * Ouvre la fenêtre d'authentification ENT et attend le retour de l'ENT.
 *
 * Sur un établissement en EduConnect/CAS, aucun identifiant ni mot de passe
 * Pronote n'existe : c'est le portail de l'académie qui authentifie
 * l'utilisateur. Une fois le ticket validé, le portail renvoie vers la page
 * mobile de Pronote, qui porte le `numeroJeton` et la `cleJeton` de
 * l'utilisateur.
 *
 * On lit ces deux valeurs, puis on referme le dialogue : l'application
 * s'authentifie ensuite seule, par jeton.
 */
export function openEntLoginWindow(
  parent: BrowserWindow | null,
  startUrl: string,
  pronoteRootUrl: string
): Promise<EntLoginResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: EntLoginResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const entWindow = new BrowserWindow({
      width: 560,
      height: 780,
      parent: parent ?? undefined,
      modal: parent !== null,
      title: 'Connexion à votre ENT',
      autoHideMenuBar: true,
      webPreferences: {
        // Les portails ENT ont besoin de cookies et de scripts normaux.
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    /**
     * Certains portails rebouclent entre la page de connexion et Pronote sans
     * jamais créer de session. On coupe au bout de quelques allers-retours :
     * au-delà, on martèle inutilement le serveur de l'établissement.
     */
    const MAX_ROUND_TRIPS = 12;
    let roundTrips = 0;
    let onEntPage: boolean | null = null;
    const pronoteHost = (() => {
      try {
        return new URL(pronoteRootUrl).hostname.toLowerCase();
      } catch {
        return '';
      }
    })();

    /**
     * Relit les cookies du domaine Pronote après validation du ticket CAS.
     *
     * C'est le seul endroit où l'application peut les obtenir : la fenêtre va
     * être fermée et son jar avec elle. `pronoteRootUrl` sert de filtre — sans
     * lui on renverrait à Pronote des cookies d'EduConnect, qui n'ont rien à y
     * faire et sont des identifiants d'un autre service.
     */
    const cookiesPronote = async (): Promise<
      Array<{ host: string; cookie: string }>
    > => {
      try {
        const lus = await entWindow.webContents.session.cookies.get({
          url: pronoteRootUrl
        });
        const nommes = lus
          .filter((c) => c.value !== '')
          .map((c) => `${c.name}=${c.value}`);
        entLog(
          `cookies retenus pour le domaine Pronote : ${nommes.map((c) => c.split('=')[0]).join(', ') || 'aucun'}`
        );
        return nommes.map((cookie) => ({ host: pronoteHost, cookie }));
      } catch (e) {
        entLog(`lecture des cookies impossible : ${(e as Error).message}`);
        return [];
      }
    };

    /** Lit la page courante et cherche l'identité Pronote qu'elle porte. */
    const inspect = async () => {
      if (settled) return;
      if (!entWindow || entWindow.isDestroyed()) return;

      let html = '';
      try {
        html = await entWindow.webContents.executeJavaScript(
          'document.documentElement ? document.documentElement.outerHTML : ""'
        );
      } catch {
        // Page encore en cours de chargement : on réessaiera au prochain event.
        return;
      }
      if (!html) return;

      if (/erreur-PRONOTE|pageserreur|AccesRefuse/i.test(html)) {
        entLog("Pronote renvoie sa page d'erreur : l'ENT n'a pas créé de session");
        finish({ success: false, reason: 'error-page' });
        return;
      }

      const identity = identityFromStartCall(parseStartCall(html), 6);
      if (!identity) return;

      entLog(
        `identité ENT obtenue (espace ${identity.accountTypeID}, session ${identity.sessionID})`
      );
      finish({ success: true, identity, cookies: await cookiesPronote() });
    };

    entWindow.webContents.on('will-redirect', (_event, url) => {
      const onPronote = isPronoteUrl(url, pronoteHost);
      if (onPronote !== onEntPage) {
        roundTrips++;
        onEntPage = onPronote;
        entLog(`${onPronote ? 'retour sur Pronote' : 'passage sur l ENT'} (${roundTrips})`);
        if (roundTrips > MAX_ROUND_TRIPS) {
          entLog('boucle ENT/Pronote : arrêt pour ne pas surcharger le serveur');
          entWindow.destroy();
          finish({ success: false, reason: 'loop' });
        }
      }
      // On ne bloque jamais la redirection : c'est elle qui porte le ticket
      // CAS. Recharger l'URL de base détruirait ce ticket.
    });

    const onPage = (_event: unknown, url: string) => {
      if (!isPronoteUrl(url, pronoteHost)) return;
      // Le contenu est injecté par Pronote après coup : on laisse passer.
      setTimeout(inspect, 600);
    };

    entWindow.webContents.on('did-navigate', onPage);
    entWindow.webContents.on('did-frame-finish-load', (_e, isMain) => {
      if (isMain) setTimeout(inspect, 600);
    });

    entWindow.on('closed', () => {
      entLog('fenêtre ENT fermée');
      finish({ success: false, reason: 'cancelled' });
    });

    entWindow.loadURL(startUrl).catch((e: Error) => {
      entLog(`ouverture impossible : ${e.message}`);
      finish({ success: false, reason: 'error-page' });
    });
  });
}

function isPronoteUrl(url: string, pronoteHost: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase() === pronoteHost.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Fetcher pawnote qui se souvient des cookies.
 *
 * pawnote n'a pas de jar : il n'envoie que `ielang=fr` (+ `appliMobile=1` pour
 * un jeton), et il jette les cookies que Pronote lui renvoie. La trace de
 * l'instance de démonstration le montre :
 *
 * ```
 * #2 GET  .../mobile.eleve.html?fd=1   <- cookies sortants : ielang=fr
 * #6 POST .../appelfonction/6/6144274/…  <- cookies recus : CASTGC=TGT-62544-…
 * ```
 *
 * Ce `CASTGC` est le cookie du serveur CAS : il prouve que le client est
 * passé par l'ENT. pawnote le reçoit et ne le renvoie jamais. Sur une instance
 * publique, Pronote s'en passe. Sur une instance derrière un ENT, c'est
 * précisément ce qui distingue une session déjà validée d'une requête anonyme —
 * d'où les réponses « la page a expiré » / « session » que l'utilisateur
 * rencontrait.
 *
 * Ce fetcher tient donc le jar lui-même, et y verse en plus les cookies que la
 * fenêtre ENT a obtenus pour le domaine Pronote.
 *
 * Les URL, en-têtes et cookies de pawnote sont laissés intacts : il construit
 * lui-même ses URL (le `?fd=1` de la page mobile) et analyse la réponse pour y
 * lire `Start({...})`. Le seul ajout est l'en-tête `Cookie`, fusionné avec
 * celui que pawnote demande.
 */
export function createSessionFetcher(
  seed: ReadonlyArray<{ host: string; cookie: string }> = []
): PawnoteFetcher {
  const jar = new Map<string, Map<string, string>>();

  const bucket = (host: string): Map<string, string> => {
    let b = jar.get(host);
    if (!b) {
      b = new Map();
      jar.set(host, b);
    }
    return b;
  };

  for (const { host, cookie } of seed) {
    const eq = cookie.indexOf('=');
    if (eq > 0) {
      bucket(host.toLowerCase()).set(
        cookie.slice(0, eq).trim(),
        cookie.slice(eq + 1).trim()
      );
    }
  }

  if (seed.length > 0) {
    entLog(
      `jar initialisé avec ${seed.length} cookie(s) : ${[...new Set(seed.map((s) => s.cookie.split('=')[0]))].join(', ')}`
    );
  }

  return async (url: string, options: any) => {
    const host = (() => {
      try {
        return new URL(url).hostname.toLowerCase();
      } catch {
        return '';
      }
    })();

    // Les cookies que pawnote demande explicitement d'abord, le jar ensuite :
    // `ielang` et `appliMobile` ne doivent pas être écrasés par une valeur
    // périmée, mais `CASTGC` n'est demandé par personne.
    const pairs = parseCookieHeader(options?.headers?.Cookie ?? '');
    const connus = jar.get(host);
    if (connus) {
      for (const [nom, valeur] of connus) if (!pairs.has(nom)) pairs.set(nom, valeur);
    }
    const envoi = [...pairs].map(([nom, valeur]) => `${nom}=${valeur}`);

    const reponse = await suivreRedirections(url, options, envoi);

    const recus = setCookieValues(reponse.headers);
    for (const { nom, valeur, suppression } of recus) {
      if (suppression) bucket(host).delete(nom);
      else bucket(host).set(nom, valeur);
    }

    const corps = await reponse.text();
    const statut = readStatus(reponse);

    traceLog(
      `${options?.method ?? 'GET'} ${redactSecrets(url)}\n` +
        `    -> ${statut} envoi=[${[...pairs.keys()].join(',') || '-'}] ` +
        `recu=[${recus.map((c) => c.nom).join(',') || '-'}] ${corps.length} o\n` +
        `    <- ${redactSecrets(corps.slice(0, 400))}`
    );
    entLog(
      `${options?.method ?? 'GET'} ${redactSecrets(url)} → ${statut} ` +
        `${corps.length} o, cookies ${[...pairs.keys()].join(',') || '-'}` +
        `${recus.length > 0 ? `, reçus ${recus.map((c) => c.nom).join(',')}` : ''}`
    );

    return {
      headers: reponse.headers,
      text: () => Promise.resolve(corps),
      json: <T>() => Promise.resolve(JSON.parse(corps) as T)
    } as any;
  };
}

/**
 * pawnote ne type pas ses réponses comme des `Response` : `status` peut être
 * absent selon la couche `fetch` utilisée. Le journal tolère ce cas.
 */
function readStatus(reponse: unknown): number | string {
  const s = (reponse as { status?: unknown })?.status;
  return typeof s === 'number' ? s : '?';
}

/** Nombre de redirections suivies à la main avant d'abandonner. */
const MAX_REDIRECTIONS = 5;

/**
 * Suit les redirections que pawnote laisse à la bande.
 *
 * pawnote interroge les pages en `redirect: "manual"` — pour rester maître de
 * la lecture de `Start({...})`. Sauf qu'une redirection ne contient aucun
 * corps : pawnote reçoit une page vide, ne trouve pas `Start`, et échoue sur
 * « Failed to extract session from HTML », un message qui ne dit rien du vrai
 * problème.
 *
 * C'est exactement ce que renvoie un établissement dont la page mobile renvoie
 * vers son portail, et ce que produit une session ENT déjà consommée.
 *
 * On suit donc la redirection nous-mêmes et on renvoie le corps de la page
 * d'arrivée. pawnote n'a jamais besoin de l'URL : il ne lit que le corps, et
 * l'URL qu'il a construite reste celle qu'il a demandée.
 */
async function suivreRedirections(
  url: string,
  options: any,
  envoi: string[]
): Promise<any> {
  let cible = url;
  let suivante: string | null = null;

  for (let saut = 0; saut <= MAX_REDIRECTIONS; saut++) {
    const reponse: any = await defaultPawnoteFetcher(cible, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...(envoi.length > 0 ? { Cookie: envoi.join('; ') } : {})
      }
    });

    const entete = reponse?.headers;
    const location =
      typeof entete?.get === 'function' ? entete.get('location') : null;
    if (!location) return reponse;

    suivante = new URL(location, cible).href;
    traceLog(
      `redirection ${saut + 1}/${MAX_REDIRECTIONS} : ${redactSecrets(cible)} ` +
        `-> ${redactSecrets(suivante)}`
    );
    cible = suivante;
  }

  throw new Error(
    `Trop de redirections (${MAX_REDIRECTIONS}) depuis ${redactSecrets(url)}`
  );
}

/** Découpe un en-tête `Cookie: a=1; b=2`. */
function parseCookieHeader(header: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const morceau of header.split(';')) {
    const eq = morceau.indexOf('=');
    if (eq <= 0) continue;
    out.set(morceau.slice(0, eq).trim(), morceau.slice(eq + 1).trim());
  }
  return out;
}

/**
 * Découpe un en-tête `set-cookie` pouvant contenir plusieurs cookies.
 *
 * Impossible de couper sur toutes les virgules : `expires=Thu, 01 Jan 1970`
 * en contient une. On ne coupe donc que devant un `nom=` — ce qui n'arrive pas
 * au milieu d'une date, où le groupe suivant ne contient aucun `=`.
 */
function splitSetCookie(header: string): string[] {
  return header.split(/,(?=\s*[!#$%&'*+\-.^_`|~0-9A-Za-z]+=)/);
}

function setCookieValues(
  headers: Record<string, string> | Headers
): Array<{ nom: string; valeur: string; suppression: boolean }> {
  let bruts: string[] = [];
  if (headers && typeof (headers as Headers).getSetCookie === 'function') {
    bruts = (headers as Headers).getSetCookie() as string[];
  } else {
    const brut =
      typeof (headers as Headers).get === 'function'
        ? (headers as Headers).get('set-cookie')
        : (headers as Record<string, string>)['set-cookie'];
    if (brut) bruts = splitSetCookie(brut);
  }

  const out: Array<{ nom: string; valeur: string; suppression: boolean }> = [];
  for (const brut of bruts) {
    const [paire, ...attributs] = brut.split(';');
    const eq = paire.indexOf('=');
    if (eq <= 0) continue;

    const nom = paire.slice(0, eq).trim();
    const valeur = paire.slice(eq + 1).trim();
    // Une valeur vide ou `Max-Age=0` est un effacement, pas une définition :
    // le cookie ne doit surtout pas être renvoyé ensuite.
    const expire = attributs.some((a) => {
      const t = a.trim().toLowerCase();
      return t === 'max-age=0' || t === 'max-age=00';
    });
    out.push({ nom, valeur, suppression: valeur === '' || expire });
  }
  return out;
}

/** Ferme la fenêtre ENT. */
export function closeEntWindow(): void {
  const all = BrowserWindow.getAllWindows();
  for (const w of all) {
    if (w.getTitle() === 'Connexion à votre ENT' && !w.isDestroyed()) w.destroy();
  }
}
