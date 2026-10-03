import { BrowserWindow, app } from 'electron';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

/**
 * Empreinte du code réellement en train de s'exécuter.
 *
 * Un journal sans cette ligne ne dit pas grand-chose : on ne sait plus si
 * l'application vient d'un déploiement ou d'une copie laissée de côté. Les
 * deux fichiers qui décident de la connexion ENT sont donc hachés à chaque
 * tentative. Toute modification de `pronote.ts` ou de `entAuth.ts` change la
 * valeur, ce qui suffit à distinguer deux déploiements.
 */
export function traceBuild(): string {
  try {
    const h = createHash('sha256');
    for (const nom of ['entAuth.js', 'pronote.js']) {
      h.update(readFileSync(join(__dirname, nom)));
    }
    return `${app.getName()} ${app.getVersion()} build ${h.digest('hex').slice(0, 8)}`;
  } catch {
    return `${app.getName()} ${app.getVersion()} build inconnu`;
  }
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
/** Le journal, pour l'afficher ou le copier. Vide s'il n'a jamais rien eu a dire. */
export function traceRead(): string {
  try {
    return readFileSync(TRACE_FILE, 'utf8');
  } catch {
    return '';
  }
}

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

    /**
     * Les portails ne vaquent pas tous directement a la page mobile. Sur le
     * portail observe, la chaine fait trois etages :
     *
     *   cas.arsene76.fr/login?selection=EDU_parent_eleve&submit=Confirm
     *     -> cas.arsene76.fr/clientredirect
     *       -> educonnect.education.gouv.fr/idp/profile/... « Je selectionne mon profil »
     *
     * L'app ouvrait la racine du CAS et s'arrêtait sur un menu a cinq entrées,
     * dont elle ne comprenait rien. On franchit donc ces deux etages.
     *
     * Ce ne sont pas des identifiants : ce sont des declarations de profil, que
     * l'utilisateur ferait lui-meme en deux clics. Le mot de passe reste saisi
     * a la main, par lui, dans la fenetre.
     *
     * Chaque page n'est franchie qu'une fois, et rien n'est fait si la page ne
     * presente pas le menu attendu : au pire, on ne change rien a ce qui se
     * passait.
     */
    const pagesFranchies = new Set<string>();

    /**
     * Un clic par page suffit, mais la meme URL peut revenir : deux chargements
     * du menu EduConnect declenchent deux clics. On borne donc le nombre total
     * d'actions, pour qu'aucune page ne puisse faire tourner la fenetre.
     */
    let franchissements = 0;
    const MAX_FRANCHISSEMENTS = 5;

    const franchir = async () => {
      if (settled || entWindow.isDestroyed()) return;
      if (franchissements >= MAX_FRANCHISSEMENTS) {
        traceLog('nombre maximal de franchissements atteint');
        return;
      }
      const ou = entWindow.webContents.getURL();
      if (pagesFranchies.has(ou)) return;

      // Menu de profil d'un CAS departemental.
      //
      // Le formulaire est soumis tel quel, jamais converti en URL : il porte
      // des champs caches — le `service`, c'est-a-dire l'adresse a laquelle le
      // CAS doit renvoyer le ticket. Fabriquer une URL a la main les perdait,
      // et le CAS répondait alors « we cannot direct you to the page
      // requested » apres avoir authentifie l'utilisateur : c'est exactement le
      // defaut que l'application doit corriger, pas reproduire.
      //
      // La detection ne soumet rien, et la soumission est lancee sans attendre
      // son resultat : naviguer detruit le contexte qui execute le script, et
      // `executeJavaScript` rejetterait alors sur une reussite.
      const menu = await entWindow.webContents.executeJavaScript(
        `(() => {
          const f = Array.from(document.querySelectorAll('form'))
            .find(f => f.querySelectorAll('input[name=selection]').length > 1);
          if (!f) return '';
          const wanted = /el[eè]ve|etudiant|étudiant|educonnect|edugouv|apprenant/i;
          const bon = Array.from(f.querySelectorAll('input[name=selection]'))
            .find(i => wanted.test(i.value || ''));
          return bon ? bon.value : '';
        })()`
      );
      if (typeof menu === 'string' && menu) {
        pagesFranchies.add(ou);
        franchissements++;
        traceLog(`menu de profil du portail franchi : selection=${redactSecrets(menu)}`);
        entWindow.webContents
          .executeJavaScript(
            `(() => {
              const f = Array.from(document.querySelectorAll('form'))
                .find(f => f.querySelectorAll('input[name=selection]').length > 1);
              if (!f) return;
              const wanted = /el[eè]ve|etudiant|étudiant|educonnect|edugouv|apprenant/i;
              const bon = Array.from(f.querySelectorAll('input[name=selection]'))
                .find(i => wanted.test(i.value || ''));
              if (!bon) return;
              bon.checked = true;
              // f.submit() ne fonctionne pas ici : le formulaire porte un
              // champ nomme submit, qui masque la methode du meme nom. On
              // passe donc par le prototype.
              HTMLFormElement.prototype.submit.call(f);
            })()`
          )
          .catch(() => undefined);
        return;
      }

      // Choix de profil EduConnect : un bouton qui appelle selectionProfil('eleve').
      // Pas de regexp ecrit dans un gabarit : `\(` y vaut `(` et `\s` y vaut
      // `s`, ce qui produit une regexp malformee et une erreur de syntaxe
      // silencieuse dans la page.
      const profil = await entWindow.webContents.executeJavaScript(
        `(() => {
          const b = Array.from(document.querySelectorAll('button,a,[onclick]'))
            .find(e => /eleve/i.test(e.getAttribute('onclick') || ''));
          return b ? (b.getAttribute('onclick') || '').slice(0, 40) : '';
        })()`
      );
      if (typeof profil === 'string' && profil) {
        pagesFranchies.add(ou);
        franchissements++;
        traceLog(`profil ÉduConnect choisi automatiquement : ${profil}`);
        entWindow.webContents
          .executeJavaScript(
            `(() => {
              const b = Array.from(document.querySelectorAll('button,a,[onclick]'))
                .find(e => /eleve/i.test(e.getAttribute('onclick') || ''));
              if (b) b.click();
            })()`
          )
          .catch(() => undefined);
        return;
      }

      // Ni menu, ni bouton : autant le dire, plutot que de laisser une fenetre
      // immobile dont personne n'explique le silence.
      if (!pagesNotees.has(ou)) {
        pagesNotees.add(ou);
        traceLog(`page non reconnue, en attente de l'utilisateur : ${urlCourt(ou)}`);
      }
    };

    /** Pages deja signalees sans lien Pronote, pour ne pas se repeter. */
    const pagesNotees = new Set<string>();

    /**
     * Note les liens vers le domaine Pronote proposés par la page courante.
     *
     * Certains portails ne ouvrent Pronote qu'après un clic dans une liste
     * d'applications, et le domaine qui sert la page mobile n'est alors pas
     * celui qu'on a ouvert. Sans cette trace, l'utilisateur doit deviner où
     * cliquer.
     */
    const noterLiensVersPronote = async () => {
      if (settled || entWindow.isDestroyed()) return;
      const ou = entWindow.webContents.getURL();
      try {
        const vus: string = await entWindow.webContents.executeJavaScript(
          `JSON.stringify(Array.from(new Set(Array.from(document.querySelectorAll('a[href]'))` +
            `.map(a => a.href).filter(h => { try { return new URL(h).hostname === ${JSON.stringify(
              pronoteHost
            )}; } catch { return false; } }))))`
        );
        const liste: string[] = JSON.parse(vus || '[]');
        if (liste.length > 0) {
          for (const l of liste.slice(0, 6)) traceLog(`lien Pronote proposé : ${urlCourt(l)}`);
          return;
        }
        if (pagesNotees.has(ou)) return;
        pagesNotees.add(ou);
        traceLog(`aucun lien Pronote sur ${urlCourt(ou)}`);
      } catch {
        // Page en cours de chargement : sans importance.
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

      const ou = entWindow.webContents.getURL();
      const surPronote = isPronoteUrl(ou, pronoteHost);

      // La page d'erreur de Pronote ne se reconnaît que sur le domaine Pronote :
      // un portail ENT peutlegitimement contenir ces mots.
      if (surPronote && /erreur-PRONOTE|pageserreur|AccesRefuse/i.test(html)) {
        entLog("Pronote renvoie sa page d'erreur : l'ENT n'a pas créé de session");
        clearInterval(battement);
        finish({ success: false, reason: 'error-page' });
        return;
      }

      const identity = identityFromStartCall(parseStartCall(html), 6);
      if (!identity) {
        // Le portail de l'établissement ne sert pas l'appel Start tant qu'on
        // n'a pas choisi l'application Pronote. On note alors les liens vers
        // Pronote qu'il propose : ils disent où aller, et sans eux on ne peut
        // que demander à l'utilisateur dedeviner.
        if (!surPronote) {
          await franchir();
          await noterLiensVersPronote();
        }
        return;
      }

      entLog(
        `identité ENT obtenue (espace ${identity.accountTypeID}, session ${identity.sessionID})`
      );
      clearInterval(battement);
      traceLog(
        `fenêtre ENT : identité obtenue (espace ${identity.accountTypeID}, session ${identity.sessionID})`
      );
      finish({ success: true, identity, cookies: await cookiesPronote() });
    };

    /**
     * Toute la conversation avec l'ENT doit laisser une trace, y compris dans
     * une application installée : c'est le seul endroit où l'on voit *où* la
     * chaîne s'arrête. `entLog` ne s'écrit qu'en développement, et une
     * installation est `app.isPackaged` — le dialogue entier était donc
     * invisible, et l'échec ne laissait que sa première ligne.
     */
    const suivre = (etape: string, url: string) =>
      traceLog(`${etape} : ${urlCourt(url)}`);

    entWindow.webContents.on('will-redirect', (_event, url) => {
      suivre('redirection', url);
      const onPronote = isPronoteUrl(url, pronoteHost);
      if (onPronote !== onEntPage) {
        roundTrips++;
        onEntPage = onPronote;
        entLog(`${onPronote ? 'retour sur Pronote' : 'passage sur l ENT'} (${roundTrips})`);
        if (roundTrips > MAX_ROUND_TRIPS) {
          entLog('boucle ENT/Pronote : arrêt pour ne pas surcharger le serveur');
          clearInterval(battement);
          entWindow.destroy();
          finish({ success: false, reason: 'loop' });
        }
      }
      // On ne bloque jamais la redirection : c'est elle qui porte le ticket
      // CAS. Recharger l'URL de base détruirait ce ticket.
    });

    const onPage = (_event: unknown, url: string) => {
      suivre('page', url);
      // Toute page est inspectee, pas seulement le domaine Pronote : l'appel
      // Start n'existe que dans une page Pronote, donc le lire partout ne peut
      // pas produire de faux positif. Ne pas le faire empechait de suivre un
      // portail ENT qui sert Pronote depuis un autre domaine.
      setTimeout(inspect, 600);
    };

    entWindow.webContents.on('did-navigate', onPage);

    entWindow.webContents.on('did-fail-load', (_e, code, description, url) => {
      // -3 = annulation par une redirection suivante : sans importance.
      if (code === -3) return;
      traceLog(`chargement impossible (${code} ${description}) : ${urlCourt(url)}`);
    });

    entWindow.webContents.on('did-frame-finish-load', (_e, isMain) => {
      if (!isMain) return;
      const courante = entWindow.webContents.getURL();
      if (courante) suivre('chargée', courante);
      setTimeout(inspect, 600);
    });

    /**
     * Sans battement, « l'utilisateur n'a rien fait » et « la chaîne est
     * bloquée » produisent le même journal vide. On note où en est la fenêtre
     * toutes les 15 s — et uniquement si elle ne bouge pas.
     */
    let dernierMouvements = '';
    const battement = setInterval(() => {
      if (settled || entWindow.isDestroyed()) return;
      const courante = entWindow.webContents.getURL();
      if (!courante) return;
      if (courante !== dernierMouvements) {
        dernierMouvements = courante;
        return;
      }
      traceLog(`toujours sur ${urlCourt(courante)}`);
    }, 15_000);

    entWindow.on('closed', () => {
      clearInterval(battement);
      entLog('fenêtre ENT fermée');
      finish({ success: false, reason: 'cancelled' });
    });

    entWindow
      .loadURL(startUrl)
      .then(() => suivre('ouverte', startUrl))
      .catch((e: Error) => {
        clearInterval(battement);
        entLog(`ouverture impossible : ${e.message}`);
        traceLog(`ouverture impossible : ${e.message}`);
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
 * Hôte et chemin d'une URL, sans la requête.
 *
 * La requête est précisément ce qu'il ne faut pas journaliser : elle porte le
 * ticket CAS, le jeton d'identification, et les identifiants de session. Or on
 * n'a besoin que de savoir *où* la fenêtre en est.
 */
function urlCourt(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url.slice(0, 60);
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
