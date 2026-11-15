# Vocabulario

Spanisch-Lern-App (Vokabeln + Grammatik) als einzelne Datei, live über GitHub Pages:
https://niklasehren.github.io/vocabulario/ (Branch `main`, Ordner `/`).

## Regeln
- **`index.html` ist die einzige Quelldatei der App.** Alle Änderungen direkt dort. Es gibt keine Vorlage und keinen Build-Schritt.
- Die Vokabeln stehen in `index.html` nur **verschlüsselt** (`const ENC = "..."`, entsperrt mit dem Klassencode). Die Klartext-Dateien `data.txt`/`data2.txt` liegen privat in iCloud (`Vocabulario/Quelle`) und dürfen **nie** ins Repo (öffentlich).
- Vokabeln ändern: `data.txt`/`data2.txt` in iCloud bearbeiten, dann `node tools/vokabeln.js <klassencode>`. Das Script ersetzt nur die `ENC`-Zeile.
- Vor jedem Push die Cache-Version in `sw.js` erhöhen (`vocabulario-vN`), damit alle Nutzer die neue Version bekommen.
- Supabase-URL und Publishable Key in `index.html` sind öffentlich gedacht. Punkte, Statistik, Rangliste und Supabase-Aufrufe nur ändern, wenn ausdrücklich gewünscht.
- Lokal testen: `python3 -m http.server 8000`, dann http://localhost:8000.
