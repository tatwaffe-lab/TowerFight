# Tower Draft Siege

Browser-basiertes, kompetitives 2-4 Spieler Tower Defense mit Sabotage-Mechanik. Siehe `design-doc.md` (im übergeordneten Ordner) für das volle Konzept.

## Lokal starten

```bash
cd tower-draft-siege
npm install
npm start
```

Server läuft danach auf `http://localhost:3000`. Öffne die Seite im Browser (mehrfach für mehrere Spieler, oder Freunde im gleichen Netzwerk lassen `http://<deine-IP>:3000` öffnen).

Ablauf: Raum erstellen → Code an Mitspieler geben → alle beitreten → "Spiel starten" → jeder wählt Commander + Relikt (max. 20s) → Match läuft automatisch.

## Online mit Freunden spielen

Dieser Server läuft nur lokal in dieser Sandbox — für echtes Online-Spielen mit Freunden musst du ihn selbst hosten, z. B. auf:

- **Render** oder **Railway**: Repo hochladen, `npm start` als Startbefehl, Port aus `process.env.PORT` (ist bereits im Code berücksichtigt).
- **Fly.io**: `fly launch` im Projektordner.

Danach die vergebene URL statt `localhost` verwenden.

## Umgesetzter Funktionsumfang

- Lobby mit Raumcode, 2-4 Spieler
- Relikt-Draft + Commander-Wahl vor Matchstart
- Server-autoritative Simulation: synchronisierte Wellen, Wirtschaft mit Zinsen, Match-Timer
- 4 Turmtypen mit je zwei Verzweigungs-Upgrade-Stufen
- 6 Sabotage-Einheiten mit individuellen Konter-Mechaniken
- Ziel-Auswahl beim Sabotage-Senden inkl. Revenge-Tracking
- Elimination, Bonus-Wellen-Verteilung, Rache-Buff
- Globale Zufallsereignisse und Bounties
- Pfad-Erweiterung (Bautiles) als Wirtschafts-/Verteidigungs-Trade-off

## Bekannte Einschränkungen des Prototyps

- Rendering ist DOM-basiert (keine Grafik/Animationen), Fokus liegt auf funktionierender Spiellogik.
- Balancing ist ein erster Entwurf und nicht durch Playtests verifiziert — Zahlen in `server/towers.js`, `server/saboteurs.js`, `server/events.js` sind die zentralen Stellen zum Tunen.
- Kein Accountsystem/Persistenz (Season-Rang, Unlocks) — aktuell nur Einzelmatches über Raumcodes.
