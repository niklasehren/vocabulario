// SA-Paket verschlüsseln und in index.html einsetzen.
// Ersetzt NUR die Zeile `const SA_ENC = "..."`, der restliche App-Code bleibt unverändert.
//
// Aufruf:  node tools/sa-paket.js <klassencode> [pfad/zu/sa-paket.json]
// Standard: sa-paket.json im Projektordner (per .gitignore nie im Repo),
// sonst der private iCloud-Ordner Vocabulario/Quelle.
// Das Paket wird mit demselben Klassencode verschlüsselt wie die Vokabeln.

const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");

const code = (process.argv[2] || "").trim().toLowerCase();
const lokal = path.join(__dirname, "..", "sa-paket.json");
const icloud = path.join(os.homedir(), "Library/Mobile Documents/com~apple~CloudDocs/Vocabulario/Quelle/sa-paket.json");
const quelle = process.argv[3] || (fs.existsSync(lokal) ? lokal : icloud);
const datei = process.argv[4] || path.join(__dirname, "..", "index.html");
if (!code) { console.error("Aufruf: node tools/sa-paket.js <klassencode> [pfad/zu/sa-paket.json]"); process.exit(1); }

const schluessel = (salt) => crypto.pbkdf2Sync(Buffer.from(code, "utf8"), salt, 150000, 32, "sha256");
function entschluesseln(enc) {
  const b = Buffer.from(enc, "base64");
  const salt = b.subarray(0, 16), iv = b.subarray(16, 28), tag = b.subarray(b.length - 16), ct = b.subarray(28, b.length - 16);
  const d = crypto.createDecipheriv("aes-256-gcm", schluessel(salt), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}
function verschluesseln(text) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", schluessel(salt), iv);
  const ct = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return Buffer.concat([salt, iv, ct, c.getAuthTag()]).toString("base64");
}

const html = fs.readFileSync(datei, "utf8");
const vok = [...html.matchAll(/const ENC = "([^"]*)";/g)];
const muster = /const SA_ENC = "([^"]*)";/g;
const treffer = [...html.matchAll(muster)];
if (vok.length !== 1 || treffer.length !== 1) { console.error("Abbruch: `const ENC` oder `const SA_ENC` nicht genau einmal in " + datei + " gefunden."); process.exit(1); }

// Sicherheitscheck: Der Code muss die bisherigen Vokabeln öffnen können (Schutz vor Tippfehlern).
try { entschluesseln(vok[0][1]); }
catch (e) { console.error("Abbruch: Mit diesem Klassencode lassen sich die aktuellen Vokabeln nicht öffnen. Tippfehler?"); process.exit(1); }

let paket;
try { paket = JSON.parse(fs.readFileSync(quelle, "utf8")); }
catch (e) { console.error("Abbruch: " + quelle + " fehlt oder ist kein gültiges JSON (" + e.message + ")."); process.exit(1); }
const fehlt = ["vokabeln", "grammatik", "konnektoren", "uebungen", "mustertexte", "schreib_checkliste"].filter((k) => !Array.isArray(paket[k]));
if (fehlt.length) { console.error("Abbruch: Im Paket fehlen die Listen: " + fehlt.join(", ")); process.exit(1); }

// Inhalt unverändert, nur ohne Einrückung (kleiner)
const neu = JSON.stringify(paket);
if (treffer[0][1]) {
  try { if (entschluesseln(treffer[0][1]) === neu) { console.log("Keine Änderung: Das SA-Paket in index.html ist schon aktuell."); process.exit(0); } }
  catch (e) { /* alter Inhalt mit anderem Code: wird ersetzt */ }
}

const enc = verschluesseln(neu);
if (entschluesseln(enc) !== neu) { console.error("Abbruch: Prüfung der Verschlüsselung fehlgeschlagen."); process.exit(1); }
fs.writeFileSync(datei, html.replace(muster, () => 'const SA_ENC = "' + enc + '";'));
console.log("SA-Paket aus " + quelle + " eingesetzt (" + Buffer.byteLength(neu) + " Zeichen). Jetzt sw.js-Cache-Version erhöhen, committen, pushen.");
