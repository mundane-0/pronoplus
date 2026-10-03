/**
 * Pilotage de l'application empaquetee par le protocole DevTools.
 *
 * Sert a verifier la chaine complete — page -> IPC -> processus principal ->
 * reseau — a travers la vraie interface, et non seulement les fonctions du
 * processus principal isolees.
 */
import http from 'node:http';

const PORT = process.env.CDP_PORT ?? '9222';

function listerPages() {
  return new Promise((res) => {
    http.get(`http://127.0.0.1:${PORT}/json/list`, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res(JSON.parse(d).find((p) => p.type === 'page')));
    });
  });
}

async function evaluer(page, expression) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const envoyer = (method, params) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params: params || {} }));
    });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  };
  await new Promise((res) => (ws.onopen = res));
  const m = await envoyer('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  ws.close();
  return m?.result?.value;
}

const page = await listerPages();
if (!page) {
  console.error('Aucune page accessible sur le port ' + PORT);
  process.exit(1);
}

const requete = process.argv[2];
const argument = process.argv[3];

console.log('page    :', page.url);
if (!requete) process.exit(0);

switch (requete) {
  case 'etat':
    console.log('route   :', await evaluer(page, 'location.hash'));
    console.log('boutons :', await evaluer(page,
      "[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).join(' ~ ')"));
    console.log('champs  :', await evaluer(page,
      "[...document.querySelectorAll('input')].map(i=>i.type+':'+(i.placeholder||i.name||i.id)).join(' ~ ')"));
    break;

  case 'texte':
    console.log(await evaluer(page, 'document.body.innerText'));
    break;

  case 'remplir':
    // Remplit le champ dont le libellé contient `argument`.
    console.log('remplissage :', await evaluer(page, `(() => {
      const cible = [...document.querySelectorAll('label,div,span,p')]
        .map(e => e.textContent)
        .find(t => t && t.includes(${JSON.stringify(argument)}));
      const boite = cible ? cible.closest('div').querySelector('input') : null;
      if (!boite) return 'champ introuvable : ' + ${JSON.stringify(argument)};
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(boite, 'x');
      boite.dispatchEvent(new Event('input', { bubbles: true }));
      return 'ok';
    })()`));
    break;

  case 'connecter': {
    // Remplit le formulaire puis declenche le bouton demande : on pilote la
    // vraie interface, donc toute la chaine (page -> IPC -> processus
    // principal -> reseau) est exercee, pas seulement les fonctions isolees.
    const url = process.env.PRONOTE_URL ?? 'https://demo.index-education.net/pronote/';
    const ident = process.env.PRONOTE_USER ?? 'demonstration';
    const pass = process.env.PRONOTE_PASS ?? 'pronotevs';
    const bouton = argument ?? 'Mode démonstration';

    const remplir = (placeholder, valeur) => `(() => {
      const b = [...document.querySelectorAll('input')]
        .find(i => (i.placeholder || '').includes(${JSON.stringify(placeholder)}));
      if (!b) return 'introuvable: ' + ${JSON.stringify(placeholder)};
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      s.call(b, ${JSON.stringify(valeur)});
      b.dispatchEvent(new Event('input', { bubbles: true }));
      return 'ok';
    })()`;

    console.log('url  :', await evaluer(page, remplir('votre-etablissement', url)));
    console.log('ident:', await evaluer(page, remplir('identifiant', ident)));
    console.log('mdp  :', await evaluer(page, remplir('mot de passe', pass)));

    console.log('clic :', await evaluer(page, `(() => {
      const cible = [...document.querySelectorAll('button')]
        .find(b => b.textContent.trim().includes(${JSON.stringify(bouton)}));
      if (!cible) return 'bouton introuvable: ' + ${JSON.stringify(bouton)};
      cible.click();
      return 'declenche';
    })()`));

    // La connexion va sur le reseau : on laisse le temps a la reponse.
    const delai = Number(process.env.PILOTER_DELAI ?? '20000');
    await new Promise((r) => setTimeout(r, delai));

    console.log('route :', await evaluer(page, 'location.hash'));
    console.log('texte :');
    console.log(await evaluer(page,
      'document.body.innerText.replace(/\\n{2,}/g, \'\\n\').slice(0, 1200)'));
    break;
  }

  default:
    console.error('requete inconnue :', requete);
    process.exit(2);
}

process.exit(0);
