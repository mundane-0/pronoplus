import { BrowserWindow, app } from 'electron';
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
  pronoteHost: string
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
      finish({ success: true, identity });
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
 * Fetcher pawnote.
 *
 * pawnote construit lui-même ses URL (notamment le `?fd=1` de la page mobile)
 * et analyse la réponse pour y lire l'appel `Start({...})`. Toute réécriture
 * d'URL ou d'en-tête casse cette lecture, et l'utilisateur d'un établissement
 * verrait alors « Pronote n'a pas ouvert de session ».
 *
 * On délègue donc au fetcher officiel de pawnote, sans toucher aux URL, aux
 * en-têtes ni aux cookies. Les cookies de la fenêtre ENT ne sont pas
 * transmis : ils appartiennent aux domaines CAS / EduConnect et ne doivent
 * jamais être renvoyés vers le domaine Pronote.
 */
export function createSessionFetcher(): PawnoteFetcher {
  return async (url: string, options: any) => {
    const response = await defaultPawnoteFetcher(url, options);
    const text = await response.text();
    entLog(`${options.method} ${redactSecrets(url)} → ${text.length} o`);

    return {
      headers: response.headers,
      text: () => Promise.resolve(text),
      json: <T>() => Promise.resolve(JSON.parse(text) as T)
    } as any;
  };
}

/** Ferme la fenêtre ENT. */
export function closeEntWindow(): void {
  const all = BrowserWindow.getAllWindows();
  for (const w of all) {
    if (w.getTitle() === 'Connexion à votre ENT' && !w.isDestroyed()) w.destroy();
  }
}
