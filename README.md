# Tower Draft Siege

Browser-basiertes, kompetitives Tower Defense für 2–4 Spieler mit Sabotage-Mechanik. Jeder verteidigt sein eigenes Board gegen synchronisierte Monsterwellen und schickt gleichzeitig Sabotage-Einheiten in die Boards der Gegner. Matchlänge ~10–20 Minuten.

## Online spielen (Render)

Der Server ist für Render vorbereitet — `render.yaml`, Health-Endpoint `/healthz` und `process.env.PORT` sind bereits eingerichtet.

1. Auf [render.com](https://render.com) einloggen → **New** → **Blueprint**
2. Dieses Repo auswählen; Render liest `render.yaml` und legt den Service an
3. Nach dem Build bekommst du eine öffentliche Adresse wie `https://dein-service.onrender.com`
4. Adresse an die Mitspieler geben: einer erstellt einen Raum, gibt den 5-stelligen Code weiter, die anderen treten bei

Ausführliche Anleitung inklusive Plan-Wahl: siehe [DEPLOY.md](DEPLOY.md).

**Zum Free-Plan:** Render fährt Free-Instanzen nach 15 Minuten *ohne Traffic* herunter. Während einer Partie fließt permanent WebSocket-Verkehr, dazu sendet der Client alle 25 Sekunden einen Heartbeat — laufende Matches sind dadurch nicht betroffen. Spürbar ist nur der Kaltstart: Ruft ihr die Seite nach längerer Pause auf, dauert der erste Aufruf etwa eine Minute. Einfach warten, dann lädt sie.

Wer das nicht will, stellt in `render.yaml` `plan: free` auf `plan: starter` um (ca. 7 $/Monat, kein Spin-Down).

## Lokal entwickeln

```bash
npm install
npm start
```

Danach im Browser `http://localhost:3000` öffnen — mehrfach für mehrere Spieler, oder Freunde im selben Netzwerk `http://<deine-lokale-IP>:3000` aufrufen lassen.

`localhost` gilt ausschließlich für diesen Weg. Sobald das Projekt auf Render läuft, gilt die dort vergebene öffentliche URL.

## Ablauf einer Partie

Raum erstellen → Code an Mitspieler → alle treten bei → „Spiel starten" → jeder wählt Commander und Relikt (max. 20 s) → Match läuft automatisch bis zum Timer oder bis nur noch einer steht.

## Funktionsumfang

- Lobby mit Raumcode, 2–4 Spieler
- Relikt-Draft und Commander-Wahl vor Matchstart
- Server-autoritative Simulation: synchronisierte Wellen, Wirtschaft mit Zinsen, Match-Timer
- 4 Turmtypen mit je zwei Verzweigungs-Upgradestufen
- 6 Sabotage-Einheiten mit eigenen Konter-Mechaniken
- Zielauswahl beim Sabotage-Senden inklusive Revenge-Tracking
- Elimination, Bonus-Wellen-Verteilung, Rache-Buff
- Globale Zufallsereignisse und Bounties
- Pfad-Erweiterung als Wirtschafts-/Verteidigungs-Trade-off
- Pixel-Art-Rendering auf Canvas mit Animationen, Treffer- und Todeseffekten

## Projektstruktur

```
server/    Spiellogik und WebSocket-Server (autoritativ)
  match.js       Simulation: Wellen, Kampf, Wirtschaft, Elimination
  towers.js      Turmdefinitionen und Upgrade-Zweige
  saboteurs.js   Sabotage-Einheiten
  commanders.js  Commander-Fähigkeiten
  events.js      Zufallsereignisse und Bounties
  relics.js      Relikt-Draft
  index.js       HTTP-Server, Lobby, Tick-Schleife
client/    Browser-Client
  sprites.js     Pixel-Sprites als Code-Daten
  render.js      Canvas-Renderer mit Animationen
  client.js      Netzwerk und UI
test/      Prüfskripte (Sprite-Validierung, simuliertes 3-Spieler-Match)
```

## Tests

```bash
node test/check-sprites.mjs      # prüft alle Sprites auf Gültigkeit und Vollständigkeit
node server/index.js &           # Server starten
node test/simulate.mjs           # simuliert ein komplettes 3-Spieler-Match
```

## Bekannte Grenzen

- Kein Accountsystem und keine Datenbank — Spielerfortschritt wird nicht gespeichert. Match-Zustand liegt ausschließlich im Arbeitsspeicher, ein Neustart beendet laufende Partien.
- Balancing ist ein erster Entwurf. Zentrale Stellschrauben: `server/towers.js`, `server/saboteurs.js`, `server/events.js`.
- Läuft als einzelne Server-Instanz. Für mehrere Instanzen bräuchte es eine gemeinsame Raum-Registry (z. B. Redis) und Sticky Sessions.
