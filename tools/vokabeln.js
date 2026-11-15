// Vokabeln neu verschlüsseln und in index.html einsetzen.
// Ersetzt NUR die Zeile `const ENC = "..."`, der restliche App-Code bleibt unverändert.
//
// Aufruf:  node tools/vokabeln.js <klassencode> [quellordner]
// quellordner enthält data.txt (Buch b3) und data2.txt (Buch c2).
// Standard: der private iCloud-Ordner Vocabulario/Quelle. Die Klartext-Vokabeln
// gehören NICHT ins (öffentliche) Repo.

const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");

const code = (process.argv[2] || "").trim().toLowerCase();
const quelle = process.argv[3] || path.join(os.homedir(), "Library/Mobile Documents/com~apple~CloudDocs/Vocabulario/Quelle");
const datei = process.argv[4] || path.join(__dirname, "..", "index.html");
if (!code) { console.error("Aufruf: node tools/vokabeln.js <klassencode> [quellordner]"); process.exit(1); }

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
const muster = /const ENC = "([^"]*)";/g;
const treffer = [...html.matchAll(muster)];
if (treffer.length !== 1) { console.error("Abbruch: `const ENC = \"...\"` nicht genau einmal in " + datei + " gefunden."); process.exit(1); }

// Sicherheitscheck: Der Code muss die bisherigen Vokabeln öffnen können (Schutz vor Tippfehlern).
let alt;
try { alt = entschluesseln(treffer[0][1]); }
catch (e) { console.error("Abbruch: Mit diesem Klassencode lassen sich die aktuellen Vokabeln nicht öffnen. Tippfehler?"); process.exit(1); }

const neu = "@ b3\n" + fs.readFileSync(path.join(quelle, "data.txt"), "utf8") + "\n@ c2\n" + fs.readFileSync(path.join(quelle, "data2.txt"), "utf8");
if (neu === alt) { console.log("Keine Änderung: Die Vokabeln in index.html sind schon aktuell."); process.exit(0); }

const enc = verschluesseln(neu);
if (entschluesseln(enc) !== neu) { console.error("Abbruch: Prüfung der Verschlüsselung fehlgeschlagen."); process.exit(1); }
fs.writeFileSync(datei, html.replace(muster, () => 'const ENC = "' + enc + '";'));
console.log("Vokabeln aktualisiert (" + Buffer.byteLength(neu) + " Zeichen). Jetzt sw.js-Cache-Version erhöhen, committen, pushen.");
