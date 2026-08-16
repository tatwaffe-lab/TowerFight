# Deploy auf Render

Alles ist vorbereitet (`render.yaml`, Health-Endpoint `/healthz`, `PORT` aus Umgebungsvariable). Du musst nur noch deployen — das muss aus deinem eigenen Account passieren.

## Schritte

1. **Code auf GitHub bringen** (Render deployt aus einem Git-Repo):

   ```bash
   cd tower-draft-siege
   git init
   git add .
   git commit -m "Tower Draft Siege"
   git branch -M main
   git remote add origin https://github.com/<dein-user>/tower-draft-siege.git
   git push -u origin main
   ```

2. **Auf render.com** einloggen → **New** → **Blueprint** → dein Repo auswählen. Render liest `render.yaml` und legt den Service automatisch an.

   Alternativ ohne Blueprint: **New** → **Web Service** → Repo wählen → Build Command `npm install`, Start Command `npm start`, Health Check Path `/healthz`.

3. Nach dem Build bekommst du eine URL wie `https://tower-draft-siege.onrender.com`. Die gibst du deinen Mitspielern — der Client verbindet sich automatisch per `wss://` zur selben Domain, es ist nichts weiter zu konfigurieren.

## Warum nicht der Free-Plan

Render fährt Free-Instanzen nach **15 Minuten ohne Traffic** herunter und schließt dabei **alle offenen Verbindungen ohne Vorwarnung**. Da dieses Spiel den kompletten Match-State im Arbeitsspeicher hält und über dauerhafte WebSocket-Verbindungen läuft, bedeutet das: laufende Partien brechen ab und sind weg. Das Hochfahren dauert danach knapp eine Minute.

In `render.yaml` steht deshalb `plan: starter` (kostenpflichtig, ca. 7 $/Monat). Zum reinen Ausprobieren kannst du `free` eintragen — dann aber mit dem Wissen, dass Matches beim Einschlafen sterben.

## Alternativen ohne Spin-Down

- **Fly.io** — `fly launch` im Projektordner, gutes Preismodell für kleine Dauerläufer.
- **Railway** — ähnlich einfach wie Render, kein Spin-Down auf dem bezahlten Plan.
- **Eigener VPS** (Hetzner, DigitalOcean) — mehr Aufwand, dafür volle Kontrolle.

## Wenn du später mehrere Server-Instanzen brauchst

Aktuell liegt der State im RAM eines einzelnen Prozesses. Das ist für den Anfang völlig in Ordnung, skaliert aber nicht über mehrere Instanzen — Räume wären dann je nach Instanz unterschiedlich sichtbar. Sobald das relevant wird: Redis für Room-Registry und Sticky Sessions, oder ein Match-State-Store außerhalb des Prozesses.
