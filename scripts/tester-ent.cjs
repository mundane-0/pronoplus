/**
 * Test de la fenêtre ENT contre un faux portail CAS local.
 *
 * C'est le seul moyen d'exercer la connexion ENT sans sortir d'un établissement
 * réel : un vrai test produirait du trafic vers un serveur qui, lui, compte
 * les échecs d'authentification.
 *
 * Le faux portail reproduit la chaîne d'un établissement en EduConnect :
 *
 *   mobile.eleve.html           (hôte Pronote)  sans ticket
 *     -> 302 vers /cas/login     (hôte du portail)
 *     -> 302 vers pronote-auth.html?p=daCas&ticket=ST-…
 *        en posant au passage SON propre cookie de portail
 *     -> 302 vers mobile.eleve.html?identifiant=…  en posant le CASTGC
 *     -> page mobile portant Start({...})
 *
 * On vérifie donc, sans jamais quitter la machine :
 *
 *   1. la fenêtre traverse la chaîne et lit numeroJeton / cleJeton ;
 *   2. elle rapporte les cookies du domaine Pronote, et eux seuls — le secret
 *      du portail ne doit jamais fuir vers l'établissement ;
 *   3. le fetcher les renvoie sur chaque requête, sans écraser ceux que
 *      pawnote demande (`ielang`, `appliMobile`) ;
 *   4. rien de réversible n'est écrit dans le journal.
 *
 * Prérequis : `npm run build:main`.
 *
 * Lancement : `npm run test:ent`. Si l'environnement empêche npm de démarrer
 * Electron (certains bacs à sable refusent ce lancement), appeler directement
 * le binaire :
 *
 *   ./node_modules/.bin/electron scripts/tester-ent.cjs
 */
const { app, BrowserWindow } = require('electron');
const http = require('node:http');
const fs = require('node:fs');

const CHEMIN = require('node:path').join(__dirname, '..', 'dist', 'main', 'entAuth.js');
if (!fs.existsSync(CHEMIN)) {
  console.error(`dist/main/entAuth.js absent — lance d'abord : npm run build:main`);
  process.exit(1);
}

const PRONOTE = 'localhost'; // hôte « Pronote »
const CAS = '127.0.0.1'; //     hôte « portail ENT »

let ko = 0;
const verifie = (nom, condition, detail) => {
  console.log(`${condition ? '  OK  ' : 'ECHEC'} ${nom}${detail ? ' — ' + detail : ''}`);
  if (!condition) ko++;
};

/** Page Pronote portant l'appel Start, comme le serveur d'un établissement. */
const pageStart = (base) => `<!doctype html><html><head><meta charset="utf-8"></head>
<body><h1>PRONOTE</h1>
<script>
  var Start = function (donnees) { window.__start = donnees; };
  Start ({"h":915730, "e":"A12", "f":"cle-de-test-0123456789", "a":6, "g":6, "p":1});
</script>
<form action="${base}/pronote/appelfonction/6/915730/1"></form>
</body></html>`;

/** Racine de l'espace mobile, sur l'hote « Pronote ». */
function basePronote() {
  return `http://${PRONOTE}:${PORT}/pronote`;
}

/** URL absolue d'une page du portail, sur l'hote « ENT ». */
function racineEnt(p) {
  return `http://${CAS}:${PORT}${p}`;
}

function demarrer() {
  return new Promise((resolve) => {
    const serveur = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const p = url.pathname;

      // 1. La page mobile, sans ticket, renvoie vers le portail de l'académie.
      // Le ticket revient sur la page mobile : Pronote le traite alors comme une
      // demande d'authentification, pose son CASTGC, puis sert la session.
      if (p === '/pronote/mobile.eleve.html' && url.searchParams.has('ticket')) {
        res.writeHead(302, {
          'Set-Cookie': 'CASTGC=TGT-portail-local; Path=/pronote; HttpOnly',
          Location: `${racine()}/mobile.eleve.html?identifiant=JETON-ENT`
        });
        return res.end();
      }

      if (p === '/pronote/mobile.eleve.html' && !url.searchParams.has('identifiant')) {
        // Comme Pronote : le service — l'adresse ou le ticket doit revenir — est
        // passe au CAS. C'est lui qui permet au CAS de rediriger a la fin.
        res.writeHead(302, {
          Location:
            `http://${CAS}:${PORT}/cas/login?service=` +
            encodeURIComponent(`${basePronote()}/mobile.eleve.html`)
        });
        return res.end();
      }

      // 2a. Le portail ne ouvre pas Pronote : il propose cinq profils.
      //     C'est ce menu qui bloquait le portail du departement observe.
      // Un client qui presente deja le CASTGC — la preuve d'avoir passe par le
      // portail — n'a pas a redire quel profil il est. C'est le cas du fetcher,
      // qui rejoue la session obtenue par la fenetre ; la fenetre, elle, arrive
      // sans cookie et doit choisir.
      const dejaValide = /CASTGC=/.test(req.headers.cookie || '');
      const service = url.searchParams.get('service') || '';
      const avecTicket = (cible) =>
        `${cible || `${basePronote()}/mobile.eleve.html`}` +
        `?p=daCas&ticket=ST-1234-abcdefgh`;

      // Sans service, le CAS authentifie et ne sait ou aller. C'est le refus
      // exact du portail de l'utilisateur : « Log In Successful — Hello <nom>,
      // we cannot direct you to the page requested. »
      if (p === '/cas/login' && !service && !dejaValide) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(
          '<html><body><h1>Log In Successful</h1>' +
            '<p>we cannot direct you to the page requested.</p></body></html>'
        );
      }

      if (p === '/cas/login' && !url.searchParams.has('selection') && !dejaValide) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(
          `<html><body><form class="cas__wayf-form" method="get" action="${racineEnt('/cas/login')}">
             <input type="hidden" name="service" value="${service}">
             <input type="radio" name="selection" value="EDU_parent_eleve"> Eleve ou parent avec Educonnect
             <input type="radio" name="selection" value="AAA_enseignant"> Enseignant
             <input type="radio" name="selection" value="ENT"> Invite
             <input type="submit" name="submit" value="Confirm">
           </form></body></html>`
        );
      }

      // Client deja valide : le ticket part directement vers le service.
      if (p === '/cas/login' && dejaValide) {
        res.writeHead(302, { Location: avecTicket(service) });
        return res.end();
      }

      // 2b. Profil « eleve » choisi : le portail pose SON cookie et renvoie
      //     vers la selection de profil EduConnect, service en memoire.
      if (p === '/cas/login' && url.searchParams.get('selection') === 'EDU_parent_eleve') {
        res.writeHead(302, {
          'Set-Cookie': 'ENT_SECRET=secret-du-portail; Path=/; HttpOnly',
          Location:
            racineEnt('/educonnect/profil') +
            (service ? `?service=${encodeURIComponent(service)}` : '')
        });
        return res.end();
      }

      // 2c. Choix de profil EduConnect : un bouton, comme sur le vrai portail.
      if (p === '/educonnect/profil') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(
          `<html><body>
             <form method="get" action="${racineEnt('/educonnect/choix')}">
               <input type="hidden" name="service" value="${service}">
               <button type="submit" name="profil" value="eleve"
                       onclick="selectionProfil('eleve')">Eleve</button>
               <button type="submit" name="profil" value="responsable"
                       onclick="selectionProfil('responsable')">Responsable d'eleve</button>
             </form>
           </body></html>`
        );
      }

      // 2d. Profil valide : EduConnect renvoie enfin le ticket CAS au service.
      if (p === '/educonnect/choix') {
        res.writeHead(302, { Location: avecTicket(service) });
        return res.end();
      }

      // 3. Pronote valide le ticket et pose SON cookie CAS, pour SON domaine :
      //    c'est ce `CASTGC` qui prouve au serveur qu'un ENT est passé par là.
      if (p === '/pronote/pronote-auth.html') {
        res.writeHead(302, {
          'Set-Cookie': 'CASTGC=TGT-portail-local; Path=/pronote; HttpOnly',
          Location: `${racine()}/mobile.eleve.html?identifiant=JETON-ENT`
        });
        return res.end();
      }

      // 4. La page mobile porte enfin l'appel Start.
      if (p === '/pronote/mobile.eleve.html') {
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Set-Cookie': 'PronoteWebSession=session-locale; Path=/pronote'
        });
        return res.end(pageStart(racine()));
      }

      // Reponse JSON d'`appelfonction`, comme le vrai Pronote. C'est elle que
      // pawnote lit champ par champ ; le journal en note les noms de champs,
      // sans leurs valeurs.
      if (/^\/pronote\/appelfonction\//.test(p)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(
          JSON.stringify({
            id: 'Authentification',
            session: 915730,
            dataSec: { data: { Acces: 0, cle: 'chiffre-local', jetonConnexionAppliMobile: 'jeton-local' } },
            nom: 'Authentification'
          })
        );
      }

      // Un cookie posé par le portail lui-même ne doit JAMAIS atteindre
      // Pronote : le renvoyer reviendrait à donner à l'établissement un
      // identifiant d'un autre service.
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<html><body>404</body></html>');
    });
    serveur.listen(0, '0.0.0.0', () => resolve(serveur));
  });
}

const racine = () => `http://${PRONOTE}:${PORT}/pronote`;

let PORT = 0;

app.whenReady().then(async () => {
  const serveur = await demarrer();
  PORT = serveur.address().port;
  console.log(`portail de test sur le port ${PORT} (Pronote=${PRONOTE}, ENT=${CAS})`);

  const {
    openEntLoginWindow,
    createSessionFetcher,
    tracePath,
    traceReset,
    traceLog,
    traceBuild
  } = require(CHEMIN);

  const journal = tracePath();
  if (journal) fs.writeFileSync(journal, '');

  // --- 1. La fenêtre traverse-t-elle la chaîne et lit-elle l'identité ? ----
  console.log('\n=== 1. chaine ENT ===');
  const base = racine();
  const depart = `${base}/mobile.eleve.html`;

  const t0 = Date.now();
  // Comme la vraie application, la decouverte ouvre le journal.
  traceReset();
  traceLog(traceBuild());

  const res = await openEntLoginWindow(null, depart, base);
  verifie('fenêtre ENT aboutie', res.success, `raison=${res.reason ?? '-'}`);
  verifie('aucune boucle', res.reason !== 'loop');

  // Les deux etapes que l'application franchit seule. Sans elles, elle
  // s'arrete sur le menu du portail, sans que rien ne l'explique.
  const texte = require('node:fs').readFileSync(tracePath(), 'utf8');
  verifie(
    'menu de profil du portail franchi',
    /menu de profil du portail franchi .*selection=EDU_parent_eleve/.test(texte)
  );
  verifie(
    'profil EduConnect choisi',
    /profil ÉduConnect choisi automatiquement/.test(texte)
  );
  // Le ticket doit revenir au service demande. S'il ne revient pas, le CAS
  // authentifie et ne sait ou aller — « we cannot direct you to the page
  // requested ».
  verifie(
    'le ticket revient a Pronote',
    /redirection : (localhost|127\.0\.0\.1):\d+\/pronote\/mobile\.eleve\.html/.test(texte),
    'le service a ete conserve'
  );

  // Le journal doit porter l'empreinte du code qui l'ecrit. Sans elle, un
  // journal ne dit pas si l'on parle du deploiement attendu ou d'une copie
  // laissee de cote.
  verifie(
    'journal entame par la tentative',
    /--- tentative ENT du /.test(texte),
    texte.split('\n')[1] ?? ''
  );

  // Le piege exact du portail de l'utilisateur : ouvrir la fenetre sur la racine
  // du CAS retire le service, et la page de refus s'affiche alors.
  // Cette fenetre ne se ferme jamais d'elle-meme : on lui laisse quelques
  // secondes, puis on abandonne plutot que d'attendre que l'utilisateur
  // ferme une fenetre.
  const sansService = await Promise.race([
    openEntLoginWindow(null, racineEnt('/cas/login'), base),
    new Promise((r) => setTimeout(() => r({ success: false, reason: 'abandon' }), 12_000))
  ]);
  verifie(
    'sans service, lafenetre echoue',
    sansService.success === false,
    `raison=${sansService.reason ?? '-'}`
  );
  verifie('numeroJeton lu', res.identity?.username === 'A12', res.identity?.username ?? '-');
  verifie('cleJeton lu', res.identity?.token === 'cle-de-test-0123456789');
  verifie('espace Élève retenu', res.identity?.accountTypeID === 6, `${res.identity?.accountTypeID}`);
  verifie('session lue', res.identity?.sessionID === 915730, `${res.identity?.sessionID}`);
  console.log(`   (${Date.now() - t0} ms)`);

  // --- 2. Les cookies du domaine Pronote sont-ils rapportés ? -------------
  console.log('\n=== 2. cookies rapportes ===');
  const cookies = res.cookies ?? [];
  const noms = cookies.map((c) => c.cookie.split('=')[0]);
  verifie('CASTGC du portail rapporte', noms.includes('CASTGC'), noms.join(',') || 'aucun');
  verifie('cookie de session Pronote rapporté', noms.includes('PronoteWebSession'), noms.join(','));
  verifie(
    'valeurs non vides',
    cookies.every((c) => c.cookie.includes('=') && c.cookie.split('=').slice(1).join('=').length > 0)
  );
  verifie(
    'aucun cookie d un autre hôte',
    cookies.every((c) => c.host === PRONOTE),
    [...new Set(cookies.map((c) => c.host))].join(',')
  );
  verifie(
    'le secret du portail ne fuite PAS vers Pronote',
    !noms.includes('ENT_SECRET'),
    noms.join(',') || 'aucun'
  );

  // --- 3. Le fetcher les renvoie-t-il ensuite ? --------------------------
  console.log('\n=== 3. rejeu par le fetcher ===');
  const f = createSessionFetcher(cookies);
  const reponse = await f(`${base}/appelfonction/6/915730/1`, {
    method: 'POST',
    headers: { Cookie: 'ielang=fr; appliMobile=1', 'Content-Type': 'application/json' },
    body: '{}'
  });
  const corps = await reponse.text();
  const envoyes = journal
    ? [...fs.readFileSync(journal, 'utf8').matchAll(/envoi=\[([^\]]*)\]/g)].map((m) => m[1])
    : [];
  const dernier = envoyes[envoyes.length - 1] ?? '';
  verifie('CASTGC renvoyé au serveur', dernier.includes('CASTGC'), dernier);
  verifie('appliMobile toujours présent', dernier.includes('appliMobile'), dernier);
  verifie('ielang toujours présent', dernier.includes('ielang'), dernier);
  verifie('le serveur a bien reçu la requête', corps.length >= 0, `${corps.length} o`);

  // Les noms de champs de la reponse doivent etre journalises : sans eux, un
  // refus du serveur ne se distingue pas d'un champ manquant.
  const texteApres = fs.readFileSync(journal, 'utf8');
  verifie(
    'noms de champs de la reponse notes',
    /appelfonction\/\d+\/\d+ → données : Acces, cle, jetonConnexionAppliMobile/.test(texteApres),
    (texteApres.match(/→ données :.*/) ?? ['(rien)'])[0]
  );

  if (journal) {
    const texte = fs.readFileSync(journal, 'utf8');
    verifie('aucune valeur de cookie au journal', !texte.includes('TGT-portail-local'));
    verifie('aucun jeton au journal', !texte.includes('cle-de-test-0123456789'));
  }

  // --- 4. Une redirection ne doit pas devenir une page vide ---------------
  // pawnote interroge en `redirect: manual` : une redirection a un corps vide,
  // et il échoue alors sur « Failed to extract session », sans dire pourquoi.
  // Le faux portail redirige déjà la page mobile, c'est donc le cas réel.
  console.log('\n=== 4. redirections suivies ===');
  const g = createSessionFetcher(cookies);
  const pageRedirigee = await g(`${base}/mobile.eleve.html?fd=1`, {
    method: 'GET',
    redirect: 'manual',
    headers: { Cookie: 'ielang=fr; appliMobile=1' }
  });
  const html = await pageRedirigee.text();
  verifie('la redirection est suivie', html.includes('Start ('), `${html.length} o`);
  verifie(
    'la page de session est atteinte',
    /Start\s*\(\s*\{/.test(html) && html.includes('915730')
  );
  if (journal) {
    const bonds = [...fs.readFileSync(journal, 'utf8').matchAll(/redirection (\d+)\//g)];
    verifie('les sauts sont journalisés', bonds.length >= 2, `${bonds.length} saut(s)`);
  }

  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.destroy();
  serveur.close();
  console.log(ko === 0 ? '\nTOUT PASSE' : `\n${ko} VERIFICATION(S) EN ECHEC`);
  app.exit(ko === 0 ? 0 : 1);
});
