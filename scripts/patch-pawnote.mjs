/**
 * Patch de pawnote pour le protocole PRONOTE 2026.
 *
 * pawnote 0.13.3 cible une version anterieure du protocole. Chaque
 * correction ci-dessous a ete etablie en lisant le client officiel de
 * Pronote (mobileeleve.js) puis verifiee en direct sur l'instance de
 * demonstration publique.
 *
 *  1. Lecture de la session dans la page d'amorce
 *     pawnote coupait sur la chaine ")}catch". La page 2026 ecrit
 *     `Start ({...});}catch (...)` : apres suppression des espaces il
 *     reste `);}catch`, donc le delimiteur n'apparait jamais et
 *     JSON.parse echoue toujours. On cherche maintenant la fermeture de
 *     l'accolade correspondante, ce qui est robuste a toute ponctuation.
 *
 *  2. Drapeaux de compression et de chiffrement
 *     Le client officiel lit `CoA` et `CrA` (et non `sCoA` / `sCrA`) et
 *     ils ACTIVENT la compression et le chiffrement. Sur une page
 *     moderne, absents, la charge utile circule en clair.
 *
 *  3. Numeros d'ordre
 *     Le client officiel fait NumeroOrdreCommunication += 2 : les
 *     reponses du serveur comptent aussi. pawnote incrementait de 1.
 *     Le nombre renvoyé par le serveur n'est plus qu'un contrôle de
 *     coherence : le server chiffre sa premiere reponse avec un vecteur
 *     d'initialisation qui ne peut pas toujours être retrouvé, et une
 *     divergence n'a jamais empêche la suite des échanges de aboutir.
 *
 *  4. Corps de requete
 *     Le client officiel utilise no / id / dataSec. Les anciens noms
 *     restent envoyes en secours, au cas ou une instance les attend.
 *
 *  5. Corps de reponse
 *     Le client officiel lit no et dataSec. Idem, les deux sont acceptes.
 *
 *  6. Enveloppe de la charge utile
 *     Le client officiel deconstructionne la requete en
 *       dataSec = { Signature: { onglet }, data: <parametres> }
 *     (`ConstantesJSON.Signature = "Signature"`, et `serialiserJSON()` range
 *     les parametres sous `data`). Sans chiffrement, `dataSec` est cet objet
 *     la, non une chaine hexadecimale.
 *     pawnote imbriquait tout un cran trop bas : `dataSec.donnees` et
 *     surtout `_Signature_`, cle que Pronote 2026 ignore. Le serveur ne
 *     trouvait donc ni les parametres, ni l'onglet demande — d'ou des
 *     charges vides, ou le refus « Vos droits sont insuffisants ».
 *     On envoie desormais `Signature` ET `_Signature_` (certaines versions
 *     anciennes n'ont connu que la seconde), les parametres a la racine,
 *     sous `data` et sous `donnees`.
 *     La signature indique l'onglet sollicite (198 notes, 88 devoirs,
 *     16 emploi du temps, 19 absences, 131 messagerie, 49 compte).
 *     Elle est indispensables : sans elle le serveur ne sait pas quoi lire.
 *
 *  6b/6c/6d. Actualites
 *     Pronote 2026 a renomme `listeCategories` en `listeNatures`, et
 *     `categorie` en `nature` sur chaque actualite. Les deux noms anciens
 *     restent acceptes, et une liste d'actualites absente ne doit plus
 *     faire echouer la lecture. Pas plus qu'un sondage sans `listeQuestions` :
 *     sur Pronote 2026, ce champ n'existe que si l'actualite est vraiment
 *     une enquete, et son absence faisait echouer toute la lecture.
 *
 *  3d. Erreurs renvoyees par le serveur
 *     Une reponse refusee porte `Signature: {Erreur: true, MessageErreur}`.
 *     pawnote l'ignorait, et le lecteur echouait ensuite sur un champ
 *     absent (« Cannot read properties of undefined »), sans jamais dire ce
 *     que Pronote avait repondu. On remonte desormais le message du serveur.
 *
 *  7. Challenge
 *     Le client officiel se contente de rechiffrer la chaine recue
 *     (getNouveauChallenge). pawnote la dechiffrait puis supprimait un
 *     caractere sur deux, ce qui est rejete par Pronote 2026.
 *
 *  8. Charge utile de Authentification
 *     Le client officiel envoie genreConnexion / identifiant / pourENT
 *     / challenge, et aucun `espace`. pawnote envoyait connexion /
 *     challenge / espace.
 *
 *  9. Connexion par ENT
 *     pawnote imposait useENT: false et prefixait toujours l'identifiant
 *     par devant la cle AES. Pour un ENT, la cle vaut
 *     md5(sha256(motDePasse)) : sans identifiant. Et pourENT doit valoir
 *     true.
 *
 * Le patch echoue bruyamment si un bout de code attendu est absent ou
 * ambigu : le fichier de pawnote est minifie, on ne veut jamais ignorer
 * un divergence silencieusement.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

/**
 * pawnote publie DEUX bundles : `index.js` (CommonJS) et `index.mjs` (ESM).
 * Le processus principal d'Electron etant compile en CommonJS, c'est
 * `require()` qui tranche, et donc `index.js` qui est reellement charge a
 * l'execution. Ne corriger que le bundle ESM laisserait donc l'application
 * intacte : les deux doivent etre corriges, et verifies comme tels.
 */
const DOSSIER = resolve(process.argv[2] ?? 'node_modules/pawnote/dist');
const CIBLE_ESM = resolve(DOSSIER, 'index.mjs');
const CIBLE_CJS = resolve(DOSSIER, 'index.js');

/** [titre, attendu, remplacement, nombre d'occurrences attendu] */
const PATCHS = [
  [
    '1. lecture de la session : fermeture d accolade au lieu de ")}catch"',
    'try{const t=e.replace(/ /gu,"").replace(/\\n/gu,""),s="Start(",n=")}catch",o=t.substring(t.indexOf(s)+s.length,t.indexOf(n)).replace(/([\'"])?([a-z0-9A-Z_]+)([\'"])?:/gu,\'"$2": \').replace(/\'/gu,\'"\');return JSON.parse(o)}catch(e){throw new Error("Failed to extract session from HTML.")}',
    'try{const t=e.replace(/ /gu,"").replace(/\\n/gu,"");let ZXA=t.indexOf("Start(")+6,ZXB=-1;for(let ZXC=0,ZXD=ZXA;ZXD<t.length&&ZXB<0;ZXD++)"{"===t.charAt(ZXD)?ZXC++:"}"===t.charAt(ZXD)&&0==--ZXC&&(ZXB=ZXD+1);const o=t.substring(ZXA,ZXB<0?t.length:ZXB).replace(/([\'"])?([a-z0-9A-Z_]+)([\'"])?:/gu,\'"$2": \').replace(/\'/gu,\'"\');return JSON.parse(o)}catch(e){throw new Error("Failed to extract session from HTML.")}',
    1
  ],
  [
    '2. drapeaux CoA / CrA (ils activent compression et chiffrement)',
    'skip_compression:null!=(n=s.sCoA)&&n,skip_encryption:null!=(o=s.sCrA)&&o',
    'skip_compression:!(null!=(n=s.CoA||s.sCoA)&&n),skip_encryption:!(null!=(o=s.CrA||s.sCrA)&&o)',
    1
  ],
  [
    '3a. compteur d ordre : depart a -1 (premiere requete = 1, puis +2)',
    ',demo:null!=(a=s.d)&&a,order:0,version:h}',
    ',demo:null!=(a=s.d)&&a,order:-1,version:h}',
    1
  ],
  [
    '3b. ecriture : increment de 2',
    'writePronoteFunctionPayload(e){this.instance.order++;',
    'writePronoteFunctionPayload(e){this.instance.order+=2;',
    1
  ],
  [
    '3c. reponse : pas d increment, ordre attendu = ordre + 1, champs no / dataSec',
    'this.instance.order++;const t=JSON.parse(e);try{const{aes_iv:e,aes_key:s}=this.getAESEncryptionKeys(),n=m.decrypt(t.numeroOrdre,s,e);if(this.instance.order!==parseInt(n))throw new Error("The order number does not match.");let o=t.donneesSec;',
    'const t=JSON.parse(e);try{const{aes_iv:e,aes_key:s}=this.getAESEncryptionKeys();let n=null;try{n=m.decrypt(t.no||t.numeroOrdre,s,e)}catch(ZXE){try{n=m.decrypt(t.no||t.numeroOrdre,s,d.util.createBuffer(this.encryption.aes.iv))}catch(ZXF){n=null}}this.instance.order>1&&null!=n&&this.instance.order+1!==parseInt(n)&&console.warn("[pawnote-patch] numero d ordre inattendu :",parseInt(n),"attendu",this.instance.order+1);let o=t.dataSec||t.donneesSec;',
    1
  ],
  [
    '3d. reponse : une erreur serveur doit etre signalee, pas masquee',
    'let o=t.dataSec||t.donneesSec;if(!this.instance.skip_encryption){',
    'let o=t.dataSec||t.donneesSec;if(null!=o&&null!=o.Signature&&o.Signature.Erreur===!0)throw new Error(String(o.Signature.MessageErreur||o.Signature.Message||"Pronote a refuse cette requete."));if(!this.instance.skip_encryption){',
    1
  ],
  [
    '6. sans chiffrement, dataSec porte Signature + data a la racine',
    'if(!this.instance.skip_encryption){const e=this.instance.skip_compression?d.util.encodeUtf8(""+JSON.stringify(t)):d.util.hexToBytes(t);t=m.encrypt(e,n,s).toUpperCase()}return{order:o.toUpperCase(),data:t}}',
    'if(!this.instance.skip_encryption){const e=this.instance.skip_compression?d.util.encodeUtf8(""+JSON.stringify(t)):d.util.hexToBytes(t);t=m.encrypt(e,n,s).toUpperCase();return{order:o.toUpperCase(),data:t}}return{order:o.toUpperCase(),data:{...(void 0!==t.donnees?t.donnees:t),Signature:t._Signature_,_Signature_:t._Signature_,donnees:{...(void 0!==t.donnees?t.donnees:t),_Signature_:t._Signature_},data:{...(void 0!==t.donnees?t.donnees:t),_Signature_:t._Signature_}}}}',
    1
  ],
  [
    '6b. actualites : Pronote 2026 a renomme listeCategories en listeNatures',
    'this.categories=e.listeCategories.V.map((e=>new we(e))),this.items=e.listeModesAff[0].listeActualites.V.map((e=>new Pe(e,this.categories)))',
    'this.categories=(e.listeNatures??e.listeCategories)?.V?.map((e=>new we(e)))??[],this.items=(Array.isArray(e.listeModesAff)?e.listeModesAff:e.listeModesAff?.V??[]).flatMap((e)=>(e?.listeActualites?.V??[]).map((e=>new Pe(e,this.categories))))',
    1
  ],
  [
    '6d. actualites : un sondage sans question ne doit pas casser la lecture',
    'this.questions=e.listeQuestions.V.map((e=>new be(e)))',
    'this.questions=(e.listeQuestions?.V??[]).map((e=>new be(e)))',
    1
  ],
  [
    '6c. actualites : la nature d une actualite s appelle desormais nature',
    'this.category=t.find((t=>t.id===e.categorie.V.N)',
    'this.category=t.find((t=>t.id===(e.nature??e.categorie)?.V?.N)',
    1
  ],
  [
    '4. corps de requete : no / id / dataSec',
    'body:JSON.stringify({session:n.session_instance.session_id,numeroOrdre:n.payload.order,nom:s,donneesSec:n.payload.data})',
    'body:JSON.stringify({session:n.session_instance.session_id,no:n.payload.order,id:s,dataSec:n.payload.data,numeroOrdre:n.payload.order,nom:s,donneesSec:n.payload.data})',
    1
  ],
  [
    '6. reponse : enveloppe {data, nom, Signature}, et erreurs serveur',
    'return"string"==typeof o&&(o=d.util.decodeUtf8(o),o=JSON.parse(o)),o}catch(e)',
    'return"string"==typeof o&&(o=d.util.decodeUtf8(o),o=JSON.parse(o)),null==o||void 0!==o.donnees?o:{donnees:null!=o.data?o.data:o,Signature:o.Signature}}catch(e)',
    1
  ],
  [
    '8. Authentification : genreConnexion / identifiant / pourENT / challenge',
    'const o=s.session.writePronoteFunctionPayload({donnees:{connexion:0,challenge:s.solvedChallenge.toUpperCase(),espace:s.session.instance.account_type_id}})',
    'const o=s.session.writePronoteFunctionPayload({donnees:{genreConnexion:0,identifiant:void 0!==s.username?s.username:"",pourENT:!!s.useENT,ressourceInternet:"",nomRessource:"",genreRecherche:0,enConnexionAuto:!1,demandeConnexionAuto:!1,enConnexionAppliMobile:!1,demandeConnexionAppliMobile:!1,demandeConnexionAppliMobileJeton:!1,uuidAppliMobile:"",loginTokenSAV:"",challenge:s.solvedChallenge.toUpperCase(),connexion:0,espace:s.session.instance.account_type_id}})',
    1
  ],
  [
    '8bis. transmission de l identifiant a la requete Authentification',
    'b(r,{solvedChallenge:A,cookies:c,session:l})',
    'b(r,{solvedChallenge:A,cookies:c,session:l,username:s.username,useENT:!!s.useENT})',
    2
  ],
  [
    '7a. challenge (connexion par jeton) : rechiffrement direct',
    ',g=Ve.util.createBuffer(y),v=m.decrypt(h.donnees.challenge,g,p);let A;try{const e=Ve.util.decodeUtf8(v),t=new Array(e.length);for(let s=0;s<e.length;s+=1)s%2==0&&t.push(e.charAt(s));let s=t.join("");s=""+s,s=Ve.util.encodeUtf8(s),A=m.encrypt(s,g,p)}catch(e){throw new Error("Unable to resolve the challenge. The given token is maybe incorrect or not for t.")}',
    ',g=Ve.util.createBuffer(y),v=h.donnees.challenge;let A;try{A=m.encrypt(Ve.util.encodeUtf8(""+v),g,p)}catch(e){throw new Error("Unable to resolve the challenge.")}',
    1
  ],
  [
    '7b. challenge (QR) : rechiffrement direct',
    ',g=Ve.util.createBuffer(y),v=m.decrypt(h.donnees.challenge,g,p);let A;try{const e=Ve.util.decodeUtf8(v),t=new Array(e.length);for(let s=0;s<e.length;s+=1)s%2==0&&t.push(e.charAt(s));let s=t.join("");s=""+s,s=Ve.util.encodeUtf8(s),A=m.encrypt(s,g,p)}catch(e){throw new Error("Unable to resolve the challenge. Please check your credentials.")}',
    ',g=Ve.util.createBuffer(y),v=h.donnees.challenge;let A;try{A=m.encrypt(Ve.util.encodeUtf8(""+v),g,p)}catch(e){throw new Error("Unable to resolve the challenge.")}',
    1
  ],
  [
    '9a. ENT : useENT configurable',
    'session:l,useENT:!1,requestFirstMobileAuthentication:!1,reuseMobileAuthentication:!0,requestFromQRCode:!1,deviceUUID:s.deviceUUID});if(1===h.donnees.modeCompLog&&(s.username=s.username.toLowerCase()),1===h.donnees.modeCompMdp&&(s.token=s.token.toLowerCase())',
    'session:l,useENT:!!s.useENT,requestFirstMobileAuthentication:!1,reuseMobileAuthentication:!1,requestFromQRCode:!1,deviceUUID:s.deviceUUID});if(!s.useENT&&1===h.donnees.modeCompLog&&(s.username=s.username.toLowerCase()),!s.useENT&&1===h.donnees.modeCompMdp&&(s.token=s.token.toLowerCase())',
    1
  ],
  [
    '9b. ENT : la cle AES ne porte pas l identifiant',
    'y=s.username+f,g=Ve.util.createBuffer(y),v=h.donnees.challenge;let A;try{A=m.encrypt(Ve.util.encodeUtf8(""+v),g,p)}catch(e){throw new Error("Unable to resolve the challenge.")}const{data:N}=yield b(r,{solvedChallenge:A,cookies:c,session:l,username:s.username,useENT:!!s.useENT});if(!N.donnees.jetonConnexionAppliMobile)throw new Error("Unable to authenticate.");',
    'y=(s.useENT?"":s.username)+f,g=Ve.util.createBuffer(y),v=h.donnees.challenge;let A;try{A=m.encrypt(Ve.util.encodeUtf8(""+v),g,p)}catch(e){throw new Error("Unable to resolve the challenge.")}const{data:N}=yield b(r,{solvedChallenge:A,cookies:c,session:l,username:s.username,useENT:!!s.useENT});if(s.requestFromQRCode&&!N.donnees.jetonConnexionAppliMobile)throw new Error("Unable to authenticate.");',
    1
  ],
  [
    '9c. jeton de session : pas de jeton mobile attendu hors connexion QR',
    'if(!N.donnees.jetonConnexionAppliMobile)throw new Error("Next time token wasn\'t given.");',
    'if(s.requestFromQRCode&&!N.donnees.jetonConnexionAppliMobile)throw new Error("Next time token wasn\'t given.");',
    1
  ],
  [
    '9d. ENT : username du jeton, on garde l identifiant fourni',
    'L={username:null!=(i=h.donnees.login)?i:s.username,token:N.donnees.jetonConnexionAppliMobile}',
    'L={username:null!=(i=h.donnees.login)?i:s.username,token:N.donnees.jetonConnexionAppliMobile??null,nextTimeToken:s.nextTimeToken??null}',
    2
  ],
  [
    '10. cookies : on ne renvoie pas une entree vide ni de doublon',
    'const m=null!=(i=s.cookies)?i:[];for(const e of a.cookies)m.push(e);',
    'const m=[...new Set([...(null!=(i=s.cookies)?i:[]),...a.cookies])].filter(e=>{const Z=e.indexOf("=");return Z>0&&""!==e.slice(Z+1)});',
    1
  ],
  [
    '11. Identification : exactement la charge du client web officiel',
    'enConnexionAuto:!1,enConnexionAppliMobile:s.reuseMobileAuthentication,demandeConnexionAuto:!1,demandeConnexionAppliMobile:s.requestFirstMobileAuthentication,demandeConnexionAppliMobileJeton:s.requestFromQRCode,uuidAppliMobile:s.deviceUUID,loginTokenSAV:""',
    'enConnexionAuto:!1,enConnexionAppliMobile:!1,demandeConnexionAuto:!1,demandeConnexionAppliMobile:s.requestFromQRCode,demandeConnexionAppliMobileJeton:s.requestFromQRCode,uuidAppliMobile:s.requestFromQRCode?s.deviceUUID:"",loginTokenSAV:""',
    1
  ],
  [
    '23. Acces : 1 vaut autorisation accordee, non mot de passe errone',
    'if("number"==typeof r.donnees.Acces&&0!==r.donnees.Acces){',
    'if("number"==typeof r.donnees.Acces&&0!==r.donnees.Acces&&1!==r.donnees.Acces){',
    1
  ]
];

// 1) On corrige le bundle ESM : c'est le seul qui soit lisible, et tous les
//    correctifs ci-dessus ont ete verifies dessus.
let source = readFileSync(CIBLE_ESM, 'utf8');
const dejaAppliques = [];
const echecs = [];

for (const [titre, attendu, remplacement, nombre] of PATCHS) {
  const occurrences = source.split(attendu).length - 1;
  if (occurrences === 0 && source.includes(remplacement)) {
    dejaAppliques.push(titre);
    continue;
  }
  if (occurrences !== nombre) {
    echecs.push(`      ${occurrences} occurrence(s) au lieu de ${nombre}`);
    continue;
  }
  source = source.split(attendu).join(remplacement);
}

if (echecs.length > 0) {
  console.error('\nPATCH ECHOUE : le code de pawnote ne correspond plus.\n');
  for (const e of echecs) console.error('  - ' + e);
  process.exit(1);
}

writeFileSync(CIBLE_ESM, source, 'utf8');

// 2) On regenere le bundle CommonJS a partir du bundle ESM corrige.
//    pawnote publie `index.js` (CommonJS) et `index.mjs` (ESM) depuis la meme
//    source, mais esbuild/terser leur attribue des noms de variables locaux
//    differents : ecrire les memes correctifs deux fois serait du travail
//    Manuel a resynchroniser a chaque mise a jour de la bibliotheque.
//    Le processus principal d'Electron etant compile en CommonJS, c'est
//    `require()` qui tranche, et donc `index.js` qui est reellement charge a
//    l'execution : sans cette regeneration, l'application tournerait avec le
//    code NON corrige, alors que tous nos tests passeraient (ils importent le
//    bundle ESM). On regenere donc, et on verifie les deux.
const genere = await build({
  entryPoints: [CIBLE_ESM],
  bundle: false,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  outfile: CIBLE_CJS,
  logLevel: 'silent'
});
if (genere.errors.length > 0) {
  console.error('\nPATCH ECHOUE : le bundle CommonJS n a pas pu etre genere.\n');
  for (const e of genere.errors) console.error('  - ' + e.text);
  process.exit(1);
}

// 3) Verification : les deux bundles doivent etre charges sans erreur,
//    exposer la meme surface d'API, et contenir effectivement les correctifs.
const ATTENDU = [
  'authenticatePronoteCredentials',
  'authenticateToken',
  'authenticatePronoteQRCode',
  'getPronoteInstanceInformation',
  'defaultPawnoteFetcher'
];
// Une signature propre aux correctifs : elle doit se retrouver dans les deux
// bundles, sinon l'application chargerait du code non corrige. On ne peut pas
// la comparer litteralement : esbuild renomme les variables locales quand il
// regenere le bundle CommonJS.
const MARQUEUR = /Signature:\s*\w+\._Signature_/;

const { createRequire } = await import('node:module');
const require_ = createRequire(import.meta.url);

const surface = {};
const BUNDLES = [
  ['index.mjs', CIBLE_ESM, (f) => import(pathToFileURL(f).href)],
  ['index.js', CIBLE_CJS, (f) => require_(f)]
];
for (const [nom, fichier, charger] of BUNDLES) {
  let module;
  try {
    module = await charger(fichier);
  } catch (e) {
    console.error(`\nPATCH ECHOUE : ${nom} ne se charge pas.\n  - ${e?.message ?? e}`);
    process.exit(1);
  }
  const manquants = ATTENDU.filter((nom) => typeof module[nom] !== 'function');
  if (manquants.length > 0) {
    console.error(`\nPATCH ECHOUE : ${nom} n exporte plus ${manquants.join(', ')}.`);
    process.exit(1);
  }
  if (!MARQUEUR.test(readFileSync(fichier, 'utf8'))) {
    console.error(
      `\nPATCH ECHOUE : ${nom} ne contient pas les correctifs (marqueur absent).`
    );
    process.exit(1);
  }
  surface[nom] = ATTENDU.length;
}

console.log('\npatch pawnote applique : ' + DOSSIER);
console.log(
  `  ${PATCHS.length - dejaAppliques.length} correctif(s) applique(s), ` +
    `${dejaAppliques.length} deja present(s)`
);
for (const [nom, n] of Object.entries(surface)) {
  console.log(`  ${nom.padEnd(10)} verifie : ${n} export(s) attendu(s), correctifs presents`);
}
