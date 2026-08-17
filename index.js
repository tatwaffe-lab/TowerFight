// Tower Draft Siege — Einzeldatei-Version (automatisch erzeugt aus dem modularen Projekt)
// Enthält Spiellogik, WebSocket-Server und den kompletten Browser-Client.
// Start:  npm install && npm start
// Quelle der Wahrheit bleibt das modulare Projekt; neu erzeugen mit: node build-single.mjs

import http from 'http';
import { WebSocketServer } from 'ws';

// ==================== Eingebettete Client-Dateien ====================
const ASSETS = {
  "/index.html": { type: "text/html; charset=utf-8", body: "<!DOCTYPE html>\n<html lang=\"de\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n<title>Tower Draft Siege</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"style.css\" />\n</head>\n<body>\n<div id=\"app\">\n\n  <section id=\"screen-menu\" class=\"screen active\">\n    <h1>TOWER<span>DRAFT</span>SIEGE</h1>\n    <p class=\"subtitle\">2–4 Spieler · kompetitiv · ~10–20 Min</p>\n\n    <div class=\"card\">\n      <label>Dein Name</label>\n      <input id=\"input-name\" type=\"text\" placeholder=\"Spieler\" maxlength=\"16\" />\n    </div>\n\n    <div class=\"card-row\">\n      <div class=\"card\">\n        <h3>Raum erstellen</h3>\n        <label>Max. Spieler</label>\n        <select id=\"select-maxplayers\">\n          <option value=\"2\">2</option>\n          <option value=\"3\">3</option>\n          <option value=\"4\" selected>4</option>\n        </select>\n        <button id=\"btn-create\" class=\"big-btn\">Erstellen</button>\n      </div>\n      <div class=\"card\">\n        <h3>Beitreten</h3>\n        <label>Raumcode</label>\n        <input id=\"input-code\" type=\"text\" placeholder=\"ABCDE\" maxlength=\"5\" />\n        <button id=\"btn-join\" class=\"big-btn\">Beitreten</button>\n      </div>\n    </div>\n    <p id=\"menu-error\" class=\"error\"></p>\n  </section>\n\n  <section id=\"screen-lobby\" class=\"screen\">\n    <h2>Lobby</h2>\n    <div class=\"card code-card\">\n      <label>Raumcode — an Mitspieler weitergeben</label>\n      <div id=\"lobby-code\" class=\"code-display\"></div>\n    </div>\n    <ul id=\"lobby-players\"></ul>\n    <p id=\"lobby-hint\" class=\"subtitle\"></p>\n    <button id=\"btn-start\" class=\"big-btn\" disabled>Spiel starten</button>\n  </section>\n\n  <section id=\"screen-draft\" class=\"screen\">\n    <h2>Vorbereitung</h2>\n    <h3>Commander</h3>\n    <div id=\"commander-options\" class=\"option-row\"></div>\n    <h3>Relikt</h3>\n    <div id=\"relic-options\" class=\"option-row\"></div>\n    <p id=\"draft-status\" class=\"subtitle\"></p>\n  </section>\n\n  <section id=\"screen-match\" class=\"screen\">\n    <div id=\"match-topbar\">\n      <div id=\"match-timer\">--:--</div>\n      <div id=\"match-wave\">Welle 0</div>\n      <div id=\"match-comp\"></div>\n      <div id=\"match-event\"></div>\n    </div>\n\n    <div id=\"match-layout\">\n      <div id=\"board-column\">\n        <div id=\"own-board-container\"></div>\n        <div id=\"other-boards\"></div>\n      </div>\n\n      <div id=\"sidebar\">\n        <div id=\"hud-gold\"></div>\n        <div id=\"hud-bounty\" class=\"bounty\"></div>\n        <div id=\"commander-panel\"></div>\n        <button id=\"btn-pathtile\" class=\"ghost-btn\">Weg verlängern</button>\n\n        <div id=\"tower-panel\" class=\"panel\"></div>\n\n        <div id=\"sabotage-panel\" class=\"panel\">\n          <h4>Angriff auf: <span id=\"sabotage-target-name\">—</span></h4>\n          <div id=\"sabotage-buttons\"></div>\n        </div>\n\n        <div id=\"log-panel\"></div>\n      </div>\n    </div>\n    <div id=\"hint-bar\"></div>\n  </section>\n\n  <section id=\"screen-ended\" class=\"screen\">\n    <h2>Match beendet</h2>\n    <div id=\"ended-ranking\"></div>\n    <button onclick=\"location.reload()\" class=\"big-btn\">Zurück zum Menü</button>\n  </section>\n\n</div>\n<script type=\"module\" src=\"client.js\"></script>\n</body>\n</html>\n" },
  "/style.css": { type: "text/css; charset=utf-8", body: ":root {\n  --bg: #0d0b14;\n  --bg2: #171326;\n  --panel: #1e1a30;\n  --panel2: #262040;\n  --line: #3a3160;\n  --text: #e8e4f5;\n  --dim: #9c93bd;\n  --cyan: #7ad3ff;\n  --gold: #ffd27a;\n  --green: #6ddc8b;\n  --red: #ff5d6c;\n  --violet: #c96bff;\n}\n\n* { box-sizing: border-box; }\n\nbody {\n  margin: 0;\n  background:\n    radial-gradient(circle at 20% 0%, #251d42 0%, transparent 55%),\n    radial-gradient(circle at 85% 10%, #17304a 0%, transparent 50%),\n    var(--bg);\n  background-attachment: fixed;\n  color: var(--text);\n  font-family: 'Press Start 2P', 'Courier New', monospace;\n  font-size: 11px;\n  line-height: 1.7;\n  image-rendering: pixelated;\n}\n\ncanvas, .sprite-icon {\n  image-rendering: pixelated;\n  image-rendering: crisp-edges;\n}\n\n.screen { display: none; padding: 22px; max-width: 1180px; margin: 0 auto; }\n.screen.active { display: block; }\n\nh1 {\n  font-size: 26px;\n  letter-spacing: 2px;\n  margin: 10px 0 4px;\n  color: var(--cyan);\n  text-shadow: 3px 3px 0 #1a2b52, 6px 6px 0 rgba(0,0,0,0.35);\n}\nh1 span { color: var(--gold); margin: 0 8px; }\nh2 { font-size: 16px; color: var(--cyan); text-shadow: 2px 2px 0 #1a2b52; }\nh3 { font-size: 12px; color: var(--gold); margin: 18px 0 8px; }\nh4 { font-size: 10px; margin: 0 0 8px; color: var(--cyan); }\n.subtitle { color: var(--dim); font-size: 9px; }\nlabel { display: block; font-size: 8px; color: var(--dim); margin-bottom: 6px; }\n\n/* --- Panels / Karten --- */\n.card, .panel {\n  background: linear-gradient(180deg, var(--panel) 0%, var(--bg2) 100%);\n  border: 2px solid var(--line);\n  border-radius: 2px;\n  padding: 14px;\n  margin: 12px 0;\n  box-shadow: inset 0 0 0 2px #100e1c, 0 4px 0 rgba(0,0,0,0.4);\n}\n.card-row { display: flex; gap: 14px; flex-wrap: wrap; }\n.card-row .card { flex: 1; min-width: 240px; }\n\ninput, select {\n  width: 100%;\n  font-family: inherit;\n  font-size: 11px;\n  padding: 10px;\n  background: #0d0b16;\n  color: var(--text);\n  border: 2px solid var(--line);\n  border-radius: 2px;\n  margin-bottom: 10px;\n}\ninput:focus, select:focus { outline: none; border-color: var(--cyan); }\n#input-code { text-transform: uppercase; letter-spacing: 5px; text-align: center; }\n\n/* --- Buttons --- */\nbutton {\n  font-family: inherit;\n  font-size: 9px;\n  padding: 10px 12px;\n  color: var(--text);\n  background: linear-gradient(180deg, #35507f 0%, #223354 100%);\n  border: 2px solid #4d74b5;\n  border-radius: 2px;\n  cursor: pointer;\n  box-shadow: 0 3px 0 #14203a;\n  transition: transform 0.05s, box-shadow 0.05s;\n}\nbutton:hover:not(:disabled) { background: linear-gradient(180deg, #426399 0%, #2a4068 100%); }\nbutton:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 0 0 #14203a; }\nbutton:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: 0 3px 0 #14203a; }\n\n.big-btn { width: 100%; padding: 14px; font-size: 11px; margin-top: 6px; }\n.ghost-btn {\n  background: linear-gradient(180deg, var(--panel2) 0%, #1b1730 100%);\n  border-color: var(--line);\n  box-shadow: 0 3px 0 #100d1c;\n  width: 100%;\n}\n\n.error { color: var(--red); font-size: 9px; }\n\n/* --- Lobby --- */\n.code-card { text-align: center; }\n.code-display {\n  font-size: 34px;\n  letter-spacing: 10px;\n  color: var(--gold);\n  text-shadow: 3px 3px 0 #6b4a10;\n  padding: 10px 0;\n}\n#lobby-players { list-style: none; padding: 0; }\n#lobby-players li {\n  padding: 10px 12px;\n  background: var(--panel);\n  border-left: 4px solid var(--cyan);\n  margin-bottom: 6px;\n  font-size: 10px;\n}\n\n/* --- Draft --- */\n.option-row { display: flex; gap: 12px; flex-wrap: wrap; }\n.option-card {\n  background: linear-gradient(180deg, var(--panel) 0%, var(--bg2) 100%);\n  border: 2px solid var(--line);\n  padding: 12px;\n  width: 235px;\n  cursor: pointer;\n  box-shadow: 0 4px 0 rgba(0,0,0,0.4);\n}\n.option-card:hover { border-color: var(--cyan); transform: translateY(-2px); }\n.option-card.selected {\n  border-color: var(--gold);\n  background: linear-gradient(180deg, #3a2f14 0%, #241d10 100%);\n}\n.option-card h4 { color: var(--gold); }\n.option-card p { margin: 0; font-size: 8px; color: var(--dim); line-height: 1.8; }\n\n/* --- Match --- */\n#match-topbar {\n  display: flex; gap: 24px; align-items: center;\n  background: linear-gradient(180deg, var(--panel) 0%, var(--bg2) 100%);\n  border: 2px solid var(--line);\n  padding: 12px 18px;\n  margin-bottom: 14px;\n  box-shadow: inset 0 0 0 2px #100e1c;\n}\n#match-timer { font-size: 20px; color: var(--cyan); text-shadow: 2px 2px 0 #14304d; }\n#match-timer.urgent { color: var(--red); text-shadow: 2px 2px 0 #4d1420; animation: pulse 0.8s infinite; }\n@keyframes pulse { 50% { opacity: 0.55; } }\n#match-wave { font-size: 11px; color: var(--gold); }\n#match-event { font-size: 9px; color: var(--dim); flex: 1; }\n#match-event.active { color: var(--gold); animation: pulse 1.4s infinite; }\n\n#match-layout { display: flex; gap: 16px; align-items: flex-start; }\n#board-column { flex: 1; min-width: 0; }\n#sidebar { width: 300px; flex-shrink: 0; }\n\n.screen#screen-match { max-width: 1680px; padding: 12px 18px; }\n#own-board-container .board-panel { padding: 8px; margin-bottom: 8px; }\n#other-boards .board-panel { flex: 0 1 auto; padding: 6px; margin-bottom: 0; }\n#other-boards .board-head { margin-bottom: 3px; }\n#other-boards .hp-bar-outer { margin-bottom: 4px; }\n#match-topbar { padding: 8px 16px; margin-bottom: 10px; }\n#log-panel { max-height: 90px; }\n\n.board-panel {\n  position: relative;\n  background: linear-gradient(180deg, var(--panel) 0%, #12101f 100%);\n  border: 2px solid var(--line);\n  padding: 10px;\n  margin-bottom: 12px;\n  box-shadow: inset 0 0 0 2px #100e1c;\n}\n.board-panel.own { border-color: var(--cyan); box-shadow: inset 0 0 0 2px #100e1c, 0 0 14px rgba(122,211,255,0.18); }\n.board-panel.mini { cursor: pointer; }\n.board-panel.mini:hover { border-color: var(--gold); }\n.board-panel.is-target { border-color: #ff9d5c; box-shadow: inset 0 0 0 2px #100e1c, 0 0 12px rgba(255,157,92,0.35); }\n.board-panel.eliminated { filter: grayscale(0.85); opacity: 0.55; }\n\n.board-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }\n.pname { font-size: 10px; color: var(--text); }\n.pstats { font-size: 9px; color: var(--dim); }\n.pstats .hp { color: var(--green); }\n.pstats .gold { color: var(--gold); }\n\n.hp-bar-outer { background: #0d0b16; border: 1px solid #000; height: 7px; margin-bottom: 8px; }\n.hp-bar-inner { height: 100%; width: 100%; background: var(--green); transition: width 0.15s linear; }\n\n.board-canvas {\n  display: block;\n  width: 100%;\n  height: auto;\n  background: #3c6639;\n  border: 2px solid #0d0a14;\n  box-shadow: inset 0 0 0 1px #4d566f;\n}\n\n/* Eigenes Brett: an die Fensterhöhe angepasst, Seitenverhältnis bleibt erhalten */\n.board-canvas.main {\n  cursor: default;\n  width: auto;\n  height: calc(100vh - 250px);\n  max-height: 620px;\n  max-width: 100%;\n  margin: 0 auto;\n}\n\n/* Gegnerbretter: kompakte Reihe unter dem eigenen Brett */\n#other-boards .board-canvas {\n  width: auto;\n  height: 118px;\n  margin: 0 auto;\n}\n\n/* Turm-Panel */\n.tower-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }\n.tower-head b { display: block; font-size: 10px; color: var(--cyan); }\n.tower-head small { display: block; font-size: 7px; color: var(--dim); }\n\n.stat-grid {\n  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;\n  background: #0d0b16; border: 2px solid var(--line); padding: 8px; margin-bottom: 10px;\n}\n.stat-grid div { display: flex; justify-content: space-between; font-size: 7px; }\n.stat-grid span { color: var(--dim); }\n.stat-grid b { color: var(--text); font-size: 8px; }\n\n.unit-btn {\n  display: flex; align-items: center; gap: 9px;\n  width: 100%; text-align: left; margin-bottom: 6px;\n  background: linear-gradient(180deg, var(--panel2) 0%, #191430 100%);\n  border-color: var(--line);\n}\n.unit-btn:hover:not(:disabled) { border-color: var(--cyan); }\n.unit-btn.upgrade:hover:not(:disabled) { border-color: var(--gold); }\n.unit-btn b { display: block; font-size: 9px; color: var(--text); }\n.unit-btn small { display: block; font-size: 7px; color: var(--dim); line-height: 1.6; }\n.unit-btn span:not(.price) { flex: 1; }\n.unit-btn .price { color: var(--gold); font-size: 8px; white-space: nowrap; }\n\n.panel-hint { font-size: 8px; color: var(--dim); line-height: 1.9; margin-bottom: 8px; }\n.panel-hint.build-active { color: var(--green); }\n.panel-hint.keys { margin-top: 10px; border-top: 1px solid var(--line); padding-top: 8px; font-size: 7px; }\nkbd {\n  display: inline-block; background: #0d0b16; border: 1px solid var(--line);\n  border-bottom-width: 2px; border-radius: 2px; padding: 1px 4px;\n  font-family: inherit; font-size: 7px; color: var(--cyan); margin-right: 2px;\n}\n.unit-btn.active { border-color: var(--green); background: linear-gradient(180deg, #24512f 0%, #17301d 100%); }\n.ghost-btn.sell { margin-top: 8px; font-size: 8px; }\n\n#match-comp { font-size: 8px; color: var(--dim); }\n.next-wave { color: var(--dim); font-size: 8px; margin-left: 6px; }\n.boss-warn { color: var(--red); font-size: 9px; margin-left: 6px; animation: pulse 0.7s infinite; }\n\n.gold-label { font-size: 8px; color: var(--dim); margin-left: 6px; }\n.big-btn.ready { background: linear-gradient(180deg, #3f7a4d 0%, #24512f 100%); border-color: #5fae72; }\n\n.target-badge {\n  display: none;\n  position: absolute; top: 8px; right: 10px;\n  background: #ff9d5c; color: #2a1405;\n  font-size: 7px; padding: 3px 6px;\n}\n.board-panel.is-target .target-badge { display: block; }\n\n#other-boards { display: flex; gap: 12px; flex-wrap: wrap; }\n#other-boards .board-panel { flex: 1; min-width: 280px; }\n\n/* --- Sidebar --- */\n#hud-gold { font-size: 10px; color: var(--dim); margin-bottom: 4px; }\n.big-gold { font-size: 22px; color: var(--gold); text-shadow: 2px 2px 0 #6b4a10; }\n.bounty { font-size: 8px; color: var(--green); line-height: 1.8; margin-bottom: 10px; min-height: 20px; }\n\n.sab-btn, .tower-btn {\n  display: flex; align-items: center; gap: 10px;\n  width: 100%; text-align: left; margin-bottom: 6px;\n  background: linear-gradient(180deg, var(--panel2) 0%, #191430 100%);\n  border-color: var(--line);\n}\n.sab-btn:hover:not(:disabled), .tower-btn:hover:not(:disabled) { border-color: var(--violet); }\n.sab-btn b, .tower-btn b { display: block; font-size: 9px; color: var(--text); }\n.sab-btn small, .tower-btn small { display: block; font-size: 7px; color: var(--dim); }\n.sprite-icon { flex-shrink: 0; }\n\n#log-panel {\n  font-size: 7px; color: var(--dim); line-height: 2;\n  max-height: 130px; overflow-y: auto;\n  background: #0d0b16; border: 2px solid var(--line);\n  padding: 8px; margin-top: 12px;\n}\n\n.hidden { display: none !important; }\n\n#hint-bar {\n  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);\n  background: var(--red); color: #2a0509;\n  padding: 10px 18px; font-size: 9px;\n  opacity: 0; pointer-events: none; transition: opacity 0.2s, transform 0.2s;\n}\n#hint-bar.show { opacity: 1; transform: translateX(-50%) translateY(0); }\n\n/* --- Ende --- */\n#ended-ranking { background: var(--panel); border: 2px solid var(--line); padding: 16px; margin-bottom: 14px; }\n.rank-row {\n  display: flex; justify-content: space-between;\n  padding: 12px 8px; border-bottom: 1px solid var(--line); font-size: 10px;\n}\n.rank-row.winner { color: var(--gold); text-shadow: 2px 2px 0 #6b4a10; }\n\n@media (max-width: 900px) {\n  #match-layout { flex-direction: column; }\n  #sidebar { width: 100%; }\n}\n" },
  "/client.js": { type: "text/javascript; charset=utf-8", body: "// Tower Draft Siege — Client (Canvas-Spielfeld + DOM-Bedienoberfläche)\nimport { BoardRenderer } from './render.js';\nimport { towerSprite, monsterSprite } from './sprites.js';\n\nconst TOWER_INFO = {\n  gatling: {\n    label: 'Gatling', cost: 50, tier1Cost: 60, tier2Cost: 120,\n    role: 'Schnellfeuer gegen Schwärme',\n    tier1: { minigun: ['Minigun', '+60% Feuerrate, Einzelziel'], flak: ['Flak', 'Flächenschaden gegen Schwärme'] },\n    tier2: { railgun: ['Railgun', 'Durchschlägt Panzerung, +50% Schaden'], chainLightning: ['Chain Lightning', 'Springt auf 3 weitere Ziele'] }\n  },\n  cannon: {\n    label: 'Kanone', cost: 70, tier1Cost: 80, tier2Cost: 150,\n    role: 'Flächenschaden, langsam',\n    tier1: { siegeMortar: ['Siege-Mörser', 'Riesiger Einzeltreffer, langsam'], clusterBomb: ['Cluster-Bombe', 'Größerer Splash'] },\n    tier2: { orbitalStrike: ['Orbital-Strike', 'Massiver Flächenschaden'], napalm: ['Napalm', 'Brandschaden über Zeit'] }\n  },\n  sniper: {\n    label: 'Frost-Sniper', cost: 65, tier1Cost: 75, tier2Cost: 140,\n    role: 'Hoher Einzelschaden, verlangsamt',\n    tier1: { deepFreeze: ['Deep-Freeze', 'Chance auf Vollstun'], piercingShot: ['Piercing-Shot', 'Trifft zweites Ziel'] },\n    tier2: { cryoField: ['Cryo-Field', 'Friert Umgebung ein'], executioner: ['Executioner', '3× Schaden unter 15% HP'] }\n  },\n  support: {\n    label: 'Support', cost: 55, tier1Cost: 65, tier2Cost: 130,\n    role: 'Deckt Stealth auf, stärkt Nachbarn',\n    tier1: { detectorFocus: ['Detektor-Fokus', 'Größere Aufdeckung'], boosterFocus: ['Booster-Fokus', 'Nachbartürme +15% Schaden'] },\n    tier2: { wideNet: ['Weites Netz', 'Aufdeckung + kleiner Boost'], overclock: ['Overclock', 'Nachbartürme +30% Schaden'] }\n  }\n};\n\nconst SABOTEUR_INFO = {\n  swarmRunner: { label: 'Swarm-Runner', cost: 20, hint: '5 Stück, schnell' },\n  panzerBrute: { label: 'Panzer-Brute', cost: 80, hint: 'sehr zäh, gepanzert' },\n  stealthRunner: { label: 'Stealth-Läufer', cost: 60, hint: 'unsichtbar ohne Detektor' },\n  saboteur: { label: 'Saboteur', cost: 50, hint: 'legt Türme lahm' },\n  splitter: { label: 'Splitter', cost: 45, hint: 'teilt sich beim Tod' },\n  goldCarrier: { label: 'Golden Carrier', cost: 90, hint: 'bringt dir Bonusgold' }\n};\n\nconst COMMANDER_INFO = {\n  vanguard: { label: 'Vanguard', desc: '+20% max. Basis-HP. Aktiv: Notreparatur.' },\n  financier: { label: 'Financier', desc: '+50% Zinsen. Aktiv: Gold Surge (+40).' },\n  warlord: { label: 'Warlord', desc: 'Sabotage +10% HP. Aktiv: nächste Sabotage gratis.' },\n  engineer: { label: 'Engineer', desc: 'Turmkosten -10%. Aktiv: Rapid Deploy.' }\n};\n\nlet ws = null, heartbeatTimer = null;\nlet myId = null, myName = '';\nlet selectedCommander = null, selectedRelic = null;\nlet selectedTargetId = null;\nlet selectedTowerId = null;     // angewählter bestehender Turm\nlet buildType = null;           // gewählter Turmtyp zum Platzieren\nlet lastState = null;\n\nconst TOWER_RANGE_PREVIEW = { gatling: 100, cannon: 88, sniper: 165, support: 95 };\nlet ownRenderer = null;\nconst miniRenderers = new Map();\n\nconst $ = (id) => document.getElementById(id);\nfunction showScreen(id) {\n  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));\n  $(id).classList.add('active');\n}\n\nfunction spriteIcon(canvas, size) {\n  const c = document.createElement('canvas');\n  c.width = canvas.width; c.height = canvas.height;\n  c.getContext('2d').drawImage(canvas, 0, 0);\n  c.className = 'sprite-icon';\n  c.style.width = size + 'px';\n  c.style.height = size + 'px';\n  return c;\n}\n\n// ---------- Verbindung ----------\n\nfunction connect() {\n  const proto = location.protocol === 'https:' ? 'wss' : 'ws';\n  ws = new WebSocket(`${proto}://${location.host}`);\n  ws.addEventListener('open', () => {\n    clearInterval(heartbeatTimer);\n    heartbeatTimer = setInterval(() => sendMsg('ping'), 25000);\n  });\n  ws.addEventListener('message', (ev) => {\n    const { type, payload } = JSON.parse(ev.data);\n    handleMessage(type, payload);\n  });\n  ws.addEventListener('close', () => {\n    clearInterval(heartbeatTimer);\n    const el = $('menu-error');\n    if (el) el.textContent = 'Verbindung zum Server getrennt.';\n  });\n  return ws;\n}\n\nfunction sendMsg(type, payload = {}) {\n  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, payload }));\n}\n\nfunction handleMessage(type, payload) {\n  if (type === 'roomCreated' || type === 'roomJoined') {\n    myId = payload.playerId;\n    $('lobby-code').textContent = payload.code;\n    showScreen('screen-lobby');\n  } else if (type === 'lobby') {\n    renderLobby(payload);\n  } else if (type === 'error') {\n    $('menu-error').textContent = payload.message;\n  } else if (type === 'actionError') {\n    flashHint(payload.message);\n  } else if (type === 'state') {\n    const prevPhase = lastState?.phase;\n    lastState = payload;\n    if (payload.phase !== prevPhase) {\n      if (payload.phase === 'relicDraft') showScreen('screen-draft');\n      else if (payload.phase === 'playing') { showScreen('screen-match'); setupBoards(payload); }\n      else if (payload.phase === 'ended') showScreen('screen-ended');\n    }\n    if (payload.phase === 'relicDraft') renderDraft(payload);\n    else if (payload.phase === 'playing') syncMatch(payload);\n    else if (payload.phase === 'ended') renderEnded(payload);\n  }\n}\n\nconst HINTS = {\n  no_gold: 'Nicht genug Gold.', cell_taken: 'Hier steht schon ein Turm.',\n  bad_cell: 'Zu nah am Weg — dort kann nicht gebaut werden.',\n  max_tier: 'Turm ist voll ausgebaut.', max_extensions: 'Weg kann nicht weiter verlängert werden.',\n  on_cooldown: 'Fähigkeit lädt noch.', self_target: 'Du kannst dich nicht selbst angreifen.'\n};\nlet hintTimer = null;\nfunction flashHint(code) {\n  const el = $('hint-bar');\n  el.textContent = HINTS[code] || code;\n  el.classList.add('show');\n  clearTimeout(hintTimer);\n  hintTimer = setTimeout(() => el.classList.remove('show'), 1700);\n}\n\nfunction renderLobby(payload) {\n  $('lobby-code').textContent = payload.code;\n  const ul = $('lobby-players');\n  ul.innerHTML = '';\n  payload.players.forEach(p => {\n    const li = document.createElement('li');\n    li.textContent = p.name + (p.id === myId ? ' (du)' : '');\n    ul.appendChild(li);\n  });\n  $('btn-start').disabled = payload.players.length < 2;\n  $('lobby-hint').textContent = payload.players.length < 2\n    ? 'Warte auf mindestens einen Mitspieler…'\n    : `${payload.players.length}/${payload.maxPlayers} Spieler bereit.`;\n}\n\n// ---------- Draft ----------\n\nfunction renderDraft(state) {\n  const me = state.players.find(p => p.id === myId);\n  if (!me) return;\n\n  const cWrap = $('commander-options');\n  if (cWrap.dataset.sel !== (selectedCommander || '')) {\n    cWrap.dataset.sel = selectedCommander || '';\n    cWrap.innerHTML = '';\n    Object.entries(COMMANDER_INFO).forEach(([key, info]) => {\n      const div = document.createElement('div');\n      div.className = 'option-card' + (selectedCommander === key ? ' selected' : '');\n      div.innerHTML = `<h4>${info.label}</h4><p>${info.desc}</p>`;\n      div.onclick = () => { selectedCommander = key; sendMsg('chooseCommander', { commanderKey: key }); renderDraft(lastState); };\n      cWrap.appendChild(div);\n    });\n  }\n\n  const rWrap = $('relic-options');\n  if (rWrap.dataset.sel !== (selectedRelic || '')) {\n    rWrap.dataset.sel = selectedRelic || '';\n    rWrap.innerHTML = '';\n    me.relicChoices.forEach(r => {\n      const div = document.createElement('div');\n      div.className = 'option-card' + (selectedRelic === r.key ? ' selected' : '');\n      div.innerHTML = `<h4>${r.label}</h4><p>${r.desc}</p>`;\n      div.onclick = () => { selectedRelic = r.key; sendMsg('chooseRelic', { relicKey: r.key }); renderDraft(lastState); };\n      rWrap.appendChild(div);\n    });\n  }\n\n  $('draft-status').textContent =\n    `${state.players.filter(p => p.ready).length}/${state.players.length} bereit — Start automatisch nach 20s.`;\n}\n\n// ---------- Spielfeld aufsetzen ----------\n\nfunction setupBoards(state) {\n  const me = state.players.find(p => p.id === myId);\n  const others = state.players.filter(p => p.id !== myId);\n  if (!selectedTargetId && others.length) selectedTargetId = others[0].id;\n\n  const ownWrap = $('own-board-container');\n  ownWrap.innerHTML = '';\n  const canvas = document.createElement('canvas');\n  canvas.className = 'board-canvas main';\n  ownWrap.appendChild(boardPanel(me, canvas, true));\n  ownRenderer = new BoardRenderer(canvas, { scale: 1, interactive: true });\n\n  canvas.addEventListener('mousemove', (ev) => {\n    const cell = ownRenderer.cellAt(ev.clientX, ev.clientY);\n    ownRenderer.hoverCell = cell && ownRenderer.isBuildable(cell.cx, cell.cy) ? cell : null;\n    const onTower = cell && ownRenderer.towerAt(cell.cx, cell.cy);\n    canvas.style.cursor = (onTower || ownRenderer.hoverCell) ? 'pointer' : 'default';\n  });\n  canvas.addEventListener('mouseleave', () => { ownRenderer.hoverCell = null; });\n\n  canvas.addEventListener('click', (ev) => {\n    const cell = ownRenderer.cellAt(ev.clientX, ev.clientY);\n    if (!cell) return;\n    const tower = ownRenderer.towerAt(cell.cx, cell.cy);\n    if (buildType) {\n      // Bau-Modus bleibt aktiv, damit mehrere Türme hintereinander gesetzt werden können\n      if (tower) flashHint('cell_taken');\n      else if (!ownRenderer.isBuildable(cell.cx, cell.cy)) flashHint('bad_cell');\n      else sendMsg('buildTower', { cx: cell.cx, cy: cell.cy, towerType: buildType });\n    } else if (tower) {\n      selectedTowerId = tower.id;\n    } else {\n      selectedTowerId = null;\n    }\n    ownRenderer.selectedTowerId = selectedTowerId;\n    renderSidebar(lastState);\n  });\n\n  const otherWrap = $('other-boards');\n  otherWrap.innerHTML = '';\n  miniRenderers.clear();\n  others.forEach(p => {\n    const c = document.createElement('canvas');\n    c.className = 'board-canvas';\n    const panel = boardPanel(p, c, false);\n    panel.classList.add('mini');\n    panel.onclick = () => { selectedTargetId = p.id; renderSidebar(lastState); updateChrome(lastState); };\n    otherWrap.appendChild(panel);\n    miniRenderers.set(p.id, new BoardRenderer(c, { scale: 1 }));\n  });\n\n  renderSidebar(state);\n}\n\nfunction boardPanel(player, canvas, isOwn) {\n  const panel = document.createElement('div');\n  panel.className = 'board-panel' + (isOwn ? ' own' : '');\n  panel.dataset.pid = player.id;\n  panel.innerHTML = `\n    <div class=\"board-head\">\n      <span class=\"pname\">${player.name}${isOwn ? ' (du)' : ''}</span>\n      <span class=\"pstats\"><span class=\"hp\">${player.baseHP}</span>/<span class=\"hpmax\">${player.maxBaseHP}</span> HP · <span class=\"gold\">${player.gold}</span> G</span>\n    </div>\n    <div class=\"hp-bar-outer\"><div class=\"hp-bar-inner\"></div></div>`;\n  panel.appendChild(canvas);\n  const badge = document.createElement('div');\n  badge.className = 'target-badge';\n  badge.textContent = 'ZIEL';\n  panel.appendChild(badge);\n  return panel;\n}\n\n// ---------- Pro Server-Tick ----------\n\nfunction syncMatch(state) {\n  const me = state.players.find(p => p.id === myId);\n  if (!me || !ownRenderer) return;\n\n  ownRenderer.setState(me, state);\n  for (const p of state.players) {\n    if (p.id === myId) continue;\n    miniRenderers.get(p.id)?.setState(p, state);\n  }\n\n  const left = Math.max(0, state.matchDurationMs - state.elapsedMs);\n  $('match-timer').textContent =\n    `${Math.floor(left / 60000)}:${Math.floor((left % 60000) / 1000).toString().padStart(2, '0')}`;\n  $('match-timer').classList.toggle('urgent', left < 60000);\n\n  const nextIn = Math.ceil((state.nextWaveInMs || 0) / 1000);\n  const waveEl = $('match-wave');\n  waveEl.innerHTML = `Welle ${state.waveIndex}` +\n    (state.nextWaveIsBoss ? ` <span class=\"boss-warn\">BOSS in ${nextIn}s</span>`\n                          : ` <span class=\"next-wave\">nächste in ${nextIn}s</span>`);\n\n  const comp = (state.lastWaveComposition || []).map(c => `${c.count}× ${c.label}`).join(', ');\n  $('match-comp').textContent = comp ? `Aktuelle Welle: ${comp}` : '';\n  const ev = $('match-event');\n  ev.textContent = state.activeEvent ? `${state.activeEvent.label} — ${state.activeEvent.desc}` : '';\n  ev.classList.toggle('active', !!state.activeEvent);\n\n  updateChrome(state);\n  renderSidebar(state);\n  $('log-panel').innerHTML = state.log.map(l => `<div>${l.msg}</div>`).join('');\n}\n\nfunction updateChrome(state) {\n  for (const p of state.players) {\n    const panel = document.querySelector(`.board-panel[data-pid=\"${p.id}\"]`);\n    if (!panel) continue;\n    panel.querySelector('.hp').textContent = p.baseHP;\n    panel.querySelector('.hpmax').textContent = p.maxBaseHP;\n    panel.querySelector('.gold').textContent = p.gold;\n    const frac = Math.max(0, p.baseHP / p.maxBaseHP);\n    const bar = panel.querySelector('.hp-bar-inner');\n    bar.style.width = `${frac * 100}%`;\n    bar.style.background = frac > 0.5 ? '#58c46a' : frac > 0.25 ? '#ffd27a' : '#ff4d4d';\n    panel.classList.toggle('eliminated', p.eliminated);\n    panel.classList.toggle('is-target', p.id === selectedTargetId && p.id !== myId);\n  }\n}\n\n// ---------- Seitenleiste ----------\n\n// Die Seitenleiste wird NUR neu aufgebaut, wenn sich die Auswahl ändert.\n// Sonst würden sieben Neuaufbauten pro Sekunde die Mausklicks verschlucken.\nlet sidebarSig = '';\n\nfunction renderSidebar(state) {\n  const me = state.players.find(p => p.id === myId);\n  const others = state.players.filter(p => p.id !== myId);\n  if (!me) return;\n\n  const tower = selectedTowerId ? me.towers.find(t => t.id === selectedTowerId) : null;\n  const sig = [selectedTowerId, buildType, selectedTargetId, me.towers.length,\n               tower?.tier, tower?.level, me.commander].join('|');\n  if (sig !== sidebarSig) {\n    sidebarSig = sig;\n    buildSidebar(me);\n  }\n  updateSidebar(me, others);\n}\n\n// --- Struktur: nur bei Auswahländerung ---\nfunction buildSidebar(me) {\n  const cmd = COMMANDER_INFO[me.commander];\n  $('commander-panel').innerHTML = cmd ? `<button id=\"btn-cmd\" class=\"big-btn\"></button>` : '';\n  const b = $('btn-cmd');\n  if (b) b.onclick = () => sendMsg('useCommanderAbility');\n  $('btn-pathtile').onclick = () => sendMsg('buyPathTile');\n\n  renderTowerPanel(me);\n\n  const sw = $('sabotage-buttons');\n  sw.innerHTML = '';\n  const KEYS = ['Q', 'W', 'E', 'R', 'T', 'Z'];\n  Object.entries(SABOTEUR_INFO).forEach(([key, info], i) => {\n    const btn = document.createElement('button');\n    btn.className = 'unit-btn';\n    btn.dataset.cost = info.cost;\n    btn.appendChild(spriteIcon(monsterSprite(key, 2), 24));\n    const t = document.createElement('span');\n    t.innerHTML = `<b><kbd>${KEYS[i]}</kbd> ${info.label}</b><small>${info.hint}</small>`;\n    btn.appendChild(t);\n    const price = document.createElement('span');\n    price.className = 'price';\n    price.textContent = info.cost + 'G';\n    btn.appendChild(price);\n    btn.onclick = () => sendMsg('buySabotage', { targetId: selectedTargetId, unitType: key });\n    sw.appendChild(btn);\n  });\n}\n\n// --- Werte: jeden Tick, ohne DOM neu aufzubauen ---\nfunction updateSidebar(me, others) {\n  const goldEl = $('hud-gold');\n  if (goldEl.dataset.g !== String(me.gold)) {\n    goldEl.dataset.g = me.gold;\n    goldEl.innerHTML = `<span class=\"big-gold\">${me.gold}</span><span class=\"gold-label\">GOLD</span>`;\n  }\n  const bountyText = me.bounty ? `${me.bounty.label}: ${me.bounty.desc}` : '';\n  if ($('hud-bounty').textContent !== bountyText) $('hud-bounty').textContent = bountyText;\n\n  const cmd = COMMANDER_INFO[me.commander];\n  const b = $('btn-cmd');\n  if (b && cmd) {\n    const onCd = me.commanderCooldownRemaining > 0;\n    const label = `${cmd.label}${onCd ? ` · ${Math.ceil(me.commanderCooldownRemaining / 1000)}s` : ' · BEREIT'}`;\n    if (b.textContent !== label) b.textContent = label;\n    b.disabled = onCd;\n    b.classList.toggle('ready', !onCd);\n  }\n\n  const pt = $('btn-pathtile');\n  const maxed = me.pathExtensions >= 5;\n  const cost = 40 * (me.pathExtensions + 1);\n  const ptLabel = maxed ? 'Weg maximal verlängert' : `Weg verlängern · ${cost}G`;\n  if (pt.textContent !== ptLabel) pt.textContent = ptLabel;\n  pt.disabled = maxed || me.gold < cost;\n\n  const targetName = others.find(p => p.id === selectedTargetId)?.name || '—';\n  if ($('sabotage-target-name').textContent !== targetName) $('sabotage-target-name').textContent = targetName;\n\n  // nur die Sperrzustände anfassen, die Buttons selbst bleiben bestehen\n  for (const btn of document.querySelectorAll('#sabotage-buttons .unit-btn')) {\n    btn.disabled = !selectedTargetId || me.gold < Number(btn.dataset.cost);\n  }\n  for (const btn of document.querySelectorAll('#tower-panel .unit-btn[data-cost]')) {\n    btn.disabled = me.gold < Number(btn.dataset.cost);\n  }\n}\n\nfunction renderTowerPanel(me) {\n  const wrap = $('tower-panel');\n  const tower = selectedTowerId ? me.towers.find(t => t.id === selectedTowerId) : null;\n  wrap.innerHTML = '';\n\n  // Kein Turm angewählt -> Bau-Auswahl\n  if (!tower) {\n    wrap.insertAdjacentHTML('beforeend',\n      `<h4>Turm bauen</h4><div class=\"panel-hint\">Typ wählen, dann auf eine freie Rasterzelle klicken. Du kannst überall bauen, wo genug Abstand zum Weg ist.</div>`);\n    Object.entries(TOWER_INFO).forEach(([key, info], i) => {\n      const btn = document.createElement('button');\n      btn.className = 'unit-btn' + (buildType === key ? ' active' : '');\n      btn.dataset.cost = info.cost;\n      btn.appendChild(spriteIcon(towerSprite(key, 3), 36));\n      const t = document.createElement('span');\n      t.innerHTML = `<b><kbd>${i + 1}</kbd> ${info.label}</b><small>${info.role}</small>`;\n      btn.appendChild(t);\n      const price = document.createElement('span');\n      price.className = 'price';\n      price.textContent = info.cost + 'G';\n      btn.appendChild(price);\n      btn.onclick = () => {\n        buildType = (buildType === key) ? null : key;\n        if (ownRenderer) ownRenderer.previewRange = buildType ? TOWER_RANGE_PREVIEW[buildType] : null;\n        renderSidebar(lastState);\n      };\n      wrap.appendChild(btn);\n    });\n    if (buildType) {\n      wrap.insertAdjacentHTML('beforeend',\n        `<div class=\"panel-hint build-active\">${TOWER_INFO[buildType].label} aktiv — beliebig viele Zellen anklicken. <kbd>Esc</kbd> beendet.</div>`);\n    }\n    wrap.insertAdjacentHTML('beforeend',\n      `<div class=\"panel-hint keys\"><kbd>1</kbd>–<kbd>4</kbd> Turmtyp · <kbd>Tab</kbd> Ziel wechseln · <kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd><kbd>R</kbd><kbd>T</kbd><kbd>Z</kbd> Sabotage</div>`);\n    return;\n  }\n\n  const info = TOWER_INFO[tower.type];\n  const head = document.createElement('div');\n  head.className = 'tower-head';\n  head.appendChild(spriteIcon(towerSprite(tower.type, 3), 36));\n  head.insertAdjacentHTML('beforeend',\n    `<div><b>${info.label}</b><small>Stufe ${tower.tier}${tower.level ? ` · Ausbau +${tower.level}` : ''}</small></div>`);\n  wrap.appendChild(head);\n\n  const stats = document.createElement('div');\n  stats.className = 'stat-grid';\n  stats.innerHTML = `\n    <div><span>Schaden</span><b>${tower.damage}</b></div>\n    <div><span>Feuerrate</span><b>${tower.fireRate}/s</b></div>\n    <div><span>Reichweite</span><b>${tower.range}</b></div>\n    <div><span>Schaden/s</span><b>${(tower.damage * tower.fireRate).toFixed(1)}</b></div>`;\n  wrap.appendChild(stats);\n\n  const branches = tower.tier === 0 ? info.tier1 : tower.tier === 1 ? info.tier2 : null;\n\n  if (branches) {\n    const cost = tower.tier === 0 ? info.tier1Cost : info.tier2Cost;\n    wrap.insertAdjacentHTML('beforeend', `<h4>Ausbau wählen</h4>`);\n    Object.entries(branches).forEach(([key, [label, desc]]) => {\n      const btn = document.createElement('button');\n      btn.className = 'unit-btn upgrade';\n      btn.dataset.cost = cost;\n      btn.insertAdjacentHTML('beforeend', `<span><b>${label}</b><small>${desc}</small></span><span class=\"price\">${cost}G</span>`);\n      btn.onclick = () => sendMsg('upgradeTower', { towerId: tower.id, branchKey: key });\n      wrap.appendChild(btn);\n    });\n  } else {\n    // Endlose Feinausbauten\n    const c = tower.nextLevelCost;\n    const btn = document.createElement('button');\n    btn.className = 'unit-btn upgrade';\n    btn.insertAdjacentHTML('beforeend',\n      `<span><b>Ausbau +${tower.level + 1}</b><small>+18% Schaden, +4% Reichweite</small></span><span class=\"price\">${c}G</span>`);\n    btn.dataset.cost = c;\n    btn.onclick = () => sendMsg('upgradeTower', { towerId: tower.id, branchKey: null });\n    wrap.appendChild(btn);\n  }\n\n  const sell = document.createElement('button');\n  sell.className = 'ghost-btn sell';\n  sell.textContent = 'Turm verkaufen (60% zurück)';\n  sell.onclick = () => {\n    sendMsg('sellTower', { towerId: tower.id });\n    selectedTowerId = null;\n    if (ownRenderer) ownRenderer.selectedTowerId = null;\n  };\n  wrap.appendChild(sell);\n}\n\nfunction renderEnded(state) {\n  const wrap = $('ended-ranking');\n  wrap.innerHTML = '';\n  (state.finalRanking || []).forEach((p, i) => {\n    const row = document.createElement('div');\n    row.className = 'rank-row' + (p.id === state.winnerId ? ' winner' : '');\n    row.innerHTML = `<span>${i + 1}. ${p.name}</span><span>${p.baseHP} HP · ${p.gold} G${p.eliminated ? ' · raus' : ''}</span>`;\n    wrap.appendChild(row);\n  });\n}\n\n// ---------- 60-fps-Schleife ----------\n\nlet lastFrame = performance.now();\nfunction loop(now) {\n  const dt = Math.min(100, now - lastFrame);\n  lastFrame = now;\n  if (ownRenderer) { ownRenderer.update(dt); ownRenderer.render(); }\n  for (const r of miniRenderers.values()) { r.update(dt); r.render(); }\n  requestAnimationFrame(loop);\n}\nrequestAnimationFrame(loop);\n\n// ---------- Menü ----------\n\n$('btn-create').addEventListener('click', () => {\n  myName = $('input-name').value.trim() || 'Spieler';\n  const maxPlayers = parseInt($('select-maxplayers').value, 10);\n  connect().addEventListener('open', () => sendMsg('createRoom', { name: myName, maxPlayers }), { once: true });\n});\n\n$('btn-join').addEventListener('click', () => {\n  myName = $('input-name').value.trim() || 'Spieler';\n  const code = $('input-code').value.trim().toUpperCase();\n  if (!code) { $('menu-error').textContent = 'Bitte Raumcode eingeben.'; return; }\n  connect().addEventListener('open', () => sendMsg('joinRoom', { name: myName, code }), { once: true });\n});\n\n$('btn-start').addEventListener('click', () => sendMsg('startMatch'));\n\n// ---------- Tastenkürzel: schneller bauen ohne Klickerei ----------\n\nconst TOWER_KEYS = ['gatling', 'cannon', 'sniper', 'support'];\nconst SABO_KEYS = ['swarmRunner', 'panzerBrute', 'stealthRunner', 'saboteur', 'splitter', 'goldCarrier'];\n\ndocument.addEventListener('keydown', (ev) => {\n  if (!lastState || lastState.phase !== 'playing') return;\n  if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;\n  const me = lastState.players.find(p => p.id === myId);\n  if (!me) return;\n\n  // 1-4: Turmtyp wählen (nochmal drücken hebt die Auswahl auf)\n  if (ev.key >= '1' && ev.key <= '4') {\n    const key = TOWER_KEYS[Number(ev.key) - 1];\n    buildType = (buildType === key) ? null : key;\n    selectedTowerId = null;\n    if (ownRenderer) {\n      ownRenderer.selectedTowerId = null;\n      ownRenderer.previewRange = buildType ? TOWER_RANGE_PREVIEW[buildType] : null;\n    }\n    renderSidebar(lastState);\n    ev.preventDefault();\n  }\n  // Q-Y: Sabotage-Einheit ans gewählte Ziel schicken\n  else if ('qwertz'.includes(ev.key.toLowerCase())) {\n    const idx = 'qwertz'.indexOf(ev.key.toLowerCase());\n    if (selectedTargetId && SABO_KEYS[idx]) {\n      sendMsg('buySabotage', { targetId: selectedTargetId, unitType: SABO_KEYS[idx] });\n      ev.preventDefault();\n    }\n  }\n  // Tab: nächsten Gegner als Ziel wählen\n  else if (ev.key === 'Tab') {\n    const others = lastState.players.filter(p => p.id !== myId && !p.eliminated);\n    if (others.length) {\n      const i = others.findIndex(p => p.id === selectedTargetId);\n      selectedTargetId = others[(i + 1) % others.length].id;\n      renderSidebar(lastState);\n      updateChrome(lastState);\n    }\n    ev.preventDefault();\n  }\n  // Escape: Bau-Modus und Auswahl abbrechen\n  else if (ev.key === 'Escape') {\n    buildType = null;\n    selectedTowerId = null;\n    if (ownRenderer) { ownRenderer.previewRange = null; ownRenderer.selectedTowerId = null; }\n    renderSidebar(lastState);\n  }\n});\n" },
  "/render.js": { type: "text/javascript; charset=utf-8", body: "// Spielfeld-Renderer. Weg, Feldmaße und Rasterzellen kommen vom Server,\n// damit Optik und Trefferlogik garantiert übereinstimmen.\n\nimport { towerSprite, monsterSprite, tileSprite, baseSprite, decoSprite } from './sprites.js';\n\nconst PATH_WIDTH = 36;\nconst TOWER_PX = 48;          // 16er-Sprite in dreifacher Größe\nconst MONSTER_PX = 36;        // 12er-Sprite in dreifacher Größe\nconst PATH_CLEARANCE = 28;    // muss zu server/geometry.js passen\n\nexport class BoardRenderer {\n  constructor(canvas, { scale = 1, interactive = false } = {}) {\n    this.canvas = canvas;\n    this.scale = scale;\n    this.interactive = interactive;\n    this.ctx = canvas.getContext('2d');\n    this.ctx.imageSmoothingEnabled = false;\n\n    this.player = null;\n    this.field = null;\n    this.pathPoints = null;\n    this.segments = [];\n    this.pathTotal = 0;\n    this.decor = [];\n\n    this.time = 0;\n    this.shake = 0;\n    this.effects = [];\n    this.projectiles = [];\n    this.renderPos = new Map();\n    this.prevMonsters = new Map();\n    this.hitFlash = new Map();\n\n    this.hoverCell = null;\n    this.selectedTowerId = null;\n    this.previewRange = null;     // Reichweite des gerade gewählten Bau-Typs\n    this.pathPattern = null;\n  }\n\n  // ---------- Geometrie (vom Server geliefert) ----------\n\n  setGeometry(field, pathPoints) {\n    if (this.field && this.field.w === field.w && this.pathPoints) return;\n    this.field = field;\n    this.pathPoints = pathPoints;\n    this.canvas.width = field.w * this.scale;\n    this.canvas.height = field.h * this.scale;\n    this.ctx.imageSmoothingEnabled = false;\n\n    this.segments = [];\n    this.pathTotal = 0;\n    for (let i = 0; i < pathPoints.length - 1; i++) {\n      const a = pathPoints[i], b = pathPoints[i + 1];\n      const len = Math.hypot(b.x - a.x, b.y - a.y);\n      this.segments.push({ a, b, len, start: this.pathTotal });\n      this.pathTotal += len;\n    }\n    this.buildDecor();\n  }\n\n  pointAt(frac) {\n    const d = Math.max(0, Math.min(1, frac)) * this.pathTotal;\n    for (const s of this.segments) {\n      if (d <= s.start + s.len || s === this.segments[this.segments.length - 1]) {\n        const t = s.len ? (d - s.start) / s.len : 0;\n        return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };\n      }\n    }\n    const last = this.pathPoints[this.pathPoints.length - 1];\n    return { x: last.x, y: last.y };\n  }\n\n  distToPath(px, py) {\n    let best = Infinity;\n    for (const s of this.segments) {\n      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;\n      const l2 = dx * dx + dy * dy;\n      let t = l2 ? ((px - s.a.x) * dx + (py - s.a.y) * dy) / l2 : 0;\n      t = Math.max(0, Math.min(1, t));\n      best = Math.min(best, Math.hypot(px - (s.a.x + dx * t), py - (s.a.y + dy * t)));\n    }\n    return best;\n  }\n\n  cellCenter(cx, cy) {\n    const c = this.field.cell;\n    return { x: cx * c + c / 2, y: cy * c + c / 2 };\n  }\n\n  isBuildable(cx, cy) {\n    if (!this.field) return false;\n    if (cx < 0 || cy < 0 || cx >= this.field.cols || cy >= this.field.rows) return false;\n    const c = this.cellCenter(cx, cy);\n    return this.distToPath(c.x, c.y) >= PATH_CLEARANCE;\n  }\n\n  // Deko deterministisch platzieren, nur abseits von Weg und Bauzellen-Mitten\n  buildDecor() {\n    this.decor = [];\n    let seed = 1337;\n    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;\n    const kinds = ['tree', 'tree', 'rock', 'bush'];\n    for (let i = 0; i < 90; i++) {\n      const x = Math.floor(rnd() * this.field.w);\n      const y = Math.floor(rnd() * this.field.h);\n      if (this.distToPath(x, y) < 46) continue;\n      const c = this.field.cell;\n      const inCellCenter = Math.abs((x % c) - c / 2) < 13 && Math.abs((y % c) - c / 2) < 13;\n      if (inCellCenter) continue;\n      this.decor.push({ x: x - 14, y: y - 14, kind: kinds[Math.floor(rnd() * kinds.length)] });\n    }\n  }\n\n  // ---------- Zustand ----------\n\n  setState(player, state) {\n    this.setGeometry(state.field, state.pathPoints);\n    const prevHP = this.player ? this.player.baseHP : player.baseHP;\n    this.player = player;\n    this.state = state;\n\n    const next = new Map();\n    for (const m of player.monsters) {\n      const p = this.pointAt(m.pos / player.pathLength);\n      next.set(m.id, { ...p, isSabotage: m.isSabotage, subtype: m.subtype });\n      if (!this.renderPos.has(m.id)) this.renderPos.set(m.id, { ...p });\n    }\n\n    for (const shot of player.shots || []) {\n      const tower = player.towers.find(t => t.id === shot.towerId);\n      if (tower && next.has(shot.monsterId)) this.spawnProjectile(tower, shot);\n    }\n\n    for (const [id, prev] of this.prevMonsters) {\n      if (!next.has(id)) {\n        this.addDeath(prev.x, prev.y, prev.isSabotage, prev.subtype === 'boss');\n        this.renderPos.delete(id);\n        this.hitFlash.delete(id);\n      }\n    }\n\n    if (player.baseHP < prevHP) {\n      this.shake = Math.min(9, this.shake + 4);\n      const e = this.pointAt(1);\n      this.addBurst(e.x, e.y, ['#ff4d4d', '#ffd27a'], 16);\n    }\n    this.prevMonsters = next;\n  }\n\n  // ---------- Effekte ----------\n\n  spawnProjectile(tower, shot) {\n    const style = {\n      gatling: { color: '#bfeaff', size: 3, speed: 950, trail: 5 },\n      cannon: { color: '#ffb072', size: 5, speed: 430, trail: 8 },\n      sniper: { color: '#e8c0ff', size: 3, speed: 1400, trail: 14 },\n      support: { color: '#c2f5d2', size: 3, speed: 750, trail: 4 }\n    }[tower.type] || { color: '#fff', size: 3, speed: 800, trail: 5 };\n\n    this.projectiles.push({\n      x: tower.x, y: tower.y - 8,\n      monsterId: shot.monsterId, dmg: shot.dmg, ...style\n    });\n    this.effects.push({ type: 'flash', x: tower.x, y: tower.y - 8, ttl: 90, maxTtl: 90, color: style.color });\n  }\n\n  addBurst(x, y, colors, count) {\n    for (let i = 0; i < count; i++) {\n      const a = Math.random() * Math.PI * 2, s = 25 + Math.random() * 70;\n      this.effects.push({\n        type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20,\n        ttl: 400, maxTtl: 400, color: colors[i % colors.length]\n      });\n    }\n  }\n\n  addDeath(x, y, isSabotage, isBoss) {\n    const colors = isBoss ? ['#ff4d4d', '#ffd27a', '#ffffff']\n      : isSabotage ? ['#b06bff', '#dfc0ff'] : ['#6ec46a', '#a8e6a0'];\n    this.addBurst(x, y, [...colors, '#ffffff'], isBoss ? 30 : 12);\n    this.effects.push({ type: 'ring', x, y, ttl: isBoss ? 600 : 320, maxTtl: isBoss ? 600 : 320, color: colors[0], big: isBoss });\n    if (isBoss) this.shake = Math.min(10, this.shake + 6);\n  }\n\n  update(dt) {\n    this.time += dt;\n    const dtS = dt / 1000;\n    if (!this.player) return;\n\n    for (const m of this.player.monsters) {\n      const target = this.pointAt(m.pos / this.player.pathLength);\n      const cur = this.renderPos.get(m.id);\n      if (!cur) { this.renderPos.set(m.id, { ...target }); continue; }\n      const k = Math.min(1, dtS * 14);\n      cur.x += (target.x - cur.x) * k;\n      cur.y += (target.y - cur.y) * k;\n    }\n\n    for (const p of this.projectiles) {\n      const t = this.renderPos.get(p.monsterId);\n      const tx = t ? t.x : p.x, ty = t ? t.y : p.y;\n      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);\n      const step = p.speed * dtS;\n      if (d <= step || d < 3) {\n        p.done = true;\n        this.addBurst(tx, ty, [p.color, '#ffffff'], 5);\n        if (p.dmg > 0) this.effects.push({ type: 'damage', x: tx, y: ty - 10, vy: -24, ttl: 700, maxTtl: 700, text: String(p.dmg) });\n        this.hitFlash.set(p.monsterId, 120);\n      } else {\n        p.x += (dx / d) * step; p.y += (dy / d) * step;\n      }\n    }\n    this.projectiles = this.projectiles.filter(p => !p.done);\n\n    for (const [id, t] of this.hitFlash) {\n      const left = t - dt;\n      if (left <= 0) this.hitFlash.delete(id); else this.hitFlash.set(id, left);\n    }\n\n    for (const e of this.effects) {\n      e.ttl -= dt;\n      if (e.type === 'spark') { e.x += e.vx * dtS; e.y += e.vy * dtS; e.vy += 115 * dtS; }\n      else if (e.type === 'damage') e.y += e.vy * dtS;\n    }\n    this.effects = this.effects.filter(e => e.ttl > 0);\n    if (this.shake > 0) this.shake = Math.max(0, this.shake - dtS * 18);\n  }\n\n  // ---------- Zeichnen ----------\n\n  render() {\n    if (!this.field) return;\n    const ctx = this.ctx;\n    ctx.setTransform(1, 0, 0, 1, 0, 0);\n    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);\n    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;\n    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;\n    ctx.setTransform(this.scale, 0, 0, this.scale, sx, sy);\n    ctx.imageSmoothingEnabled = false;\n\n    this.drawGround(ctx);\n    this.drawPath(ctx);\n    if (!this.player) return;\n\n    if (this.interactive) this.drawGrid(ctx);\n    this.drawRange(ctx);\n    this.drawBase(ctx);\n    this.drawMonsters(ctx);\n    this.drawTowers(ctx);\n    this.drawProjectiles(ctx);\n    this.drawEffects(ctx);\n\n    if (this.player.eliminated) {\n      ctx.fillStyle = 'rgba(8,6,12,0.62)';\n      ctx.fillRect(0, 0, this.field.w, this.field.h);\n    }\n  }\n\n  drawGround(ctx) {\n    const g = tileSprite('grass', 1);\n    for (let y = 0; y < this.field.h; y += 16)\n      for (let x = 0; x < this.field.w; x += 16) ctx.drawImage(g, x, y);\n    for (const d of this.decor) ctx.drawImage(decoSprite(d.kind, 3), d.x, d.y);\n  }\n\n  drawPath(ctx) {\n    if (!this.pathPattern) this.pathPattern = ctx.createPattern(tileSprite('path', 1), 'repeat');\n    ctx.lineCap = 'round'; ctx.lineJoin = 'round';\n    ctx.beginPath();\n    ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);\n    for (let i = 1; i < this.pathPoints.length; i++) ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);\n    ctx.strokeStyle = '#241a10'; ctx.lineWidth = PATH_WIDTH + 6; ctx.stroke();\n    ctx.strokeStyle = this.pathPattern; ctx.lineWidth = PATH_WIDTH; ctx.stroke();\n  }\n\n  drawGrid(ctx) {\n    const c = this.field.cell;\n    for (let cy = 0; cy < this.field.rows; cy++) {\n      for (let cx = 0; cx < this.field.cols; cx++) {\n        if (!this.isBuildable(cx, cy)) continue;\n        const occupied = this.player.towers.some(t => t.cx === cx && t.cy === cy);\n        if (occupied) continue;\n        const hov = this.hoverCell && this.hoverCell.cx === cx && this.hoverCell.cy === cy;\n        ctx.save();\n        ctx.globalAlpha = hov ? 0.9 : 0.13;\n        ctx.strokeStyle = hov ? '#6ddc8b' : '#cfe3ff';\n        ctx.lineWidth = hov ? 2 : 1;\n        ctx.strokeRect(cx * c + 2.5, cy * c + 2.5, c - 5, c - 5);\n        if (hov) {\n          ctx.fillStyle = 'rgba(109,220,139,0.18)';\n          ctx.fillRect(cx * c + 3, cy * c + 3, c - 6, c - 6);\n        }\n        ctx.restore();\n      }\n    }\n  }\n\n  drawRange(ctx) {\n    let cx, cy, range, color;\n    const sel = this.player.towers.find(t => t.id === this.selectedTowerId);\n    if (sel) { cx = sel.x; cy = sel.y; range = sel.range; color = 'rgba(122,211,255,'; }\n    else if (this.hoverCell && this.previewRange) {\n      const c = this.cellCenter(this.hoverCell.cx, this.hoverCell.cy);\n      cx = c.x; cy = c.y; range = this.previewRange; color = 'rgba(109,220,139,';\n    } else return;\n\n    ctx.save();\n    ctx.beginPath();\n    ctx.arc(cx, cy, range, 0, Math.PI * 2);\n    ctx.fillStyle = color + '0.10)';\n    ctx.fill();\n    ctx.strokeStyle = color + '0.65)';\n    ctx.lineWidth = 2;\n    ctx.setLineDash([6, 4]);\n    ctx.stroke();\n    ctx.restore();\n  }\n\n  drawTowers(ctx) {\n    const half = TOWER_PX / 2;\n    for (const t of this.player.towers) {\n      if (this.selectedTowerId === t.id) {\n        ctx.save();\n        ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2;\n        ctx.strokeRect(t.x - half - 3, t.y - half - 3, TOWER_PX + 6, TOWER_PX + 6);\n        ctx.restore();\n      }\n      ctx.save();\n      ctx.globalAlpha = 0.35; ctx.fillStyle = '#0d0a14';\n      ctx.beginPath(); ctx.ellipse(t.x, t.y + half - 3, half - 3, 5, 0, 0, Math.PI * 2); ctx.fill();\n      ctx.restore();\n\n      if (t.disabled) ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.time / 90);\n      ctx.drawImage(towerSprite(t.type, 3), t.x - half, t.y - half);\n      ctx.globalAlpha = 1;\n\n      // Ausbaustufe: Sterne für Tier, Zahl für Feinausbau\n      for (let i = 0; i < t.tier; i++) {\n        ctx.fillStyle = '#ffd27a';\n        ctx.fillRect(t.x - half + 2 + i * 6, t.y - half - 6, 4, 4);\n      }\n      if (t.level > 0) {\n        ctx.font = 'bold 9px monospace'; ctx.textAlign = 'right';\n        ctx.fillStyle = '#100e18'; ctx.fillText('+' + t.level, t.x + half + 1, t.y - half - 1);\n        ctx.fillStyle = '#7ad3ff'; ctx.fillText('+' + t.level, t.x + half, t.y - half - 2);\n      }\n    }\n  }\n\n  drawMonsters(ctx) {\n    const sorted = [...this.player.monsters].sort((a, b) => a.pos - b.pos);\n    for (const m of sorted) {\n      const rp = this.renderPos.get(m.id);\n      if (!rp) continue;\n      const isBoss = m.subtype === 'boss';\n      const px = isBoss ? MONSTER_PX * 1.8 : MONSTER_PX;\n      const half = px / 2;\n      const bob = Math.sin(this.time / 110 + m.pos * 1.5) * 1.5;\n      const x = Math.round(rp.x - half), y = Math.round(rp.y - half + bob);\n\n      ctx.save();\n      ctx.globalAlpha = 0.3; ctx.fillStyle = '#0d0a14';\n      ctx.beginPath(); ctx.ellipse(rp.x, rp.y + half - 2, half - 3, 4, 0, 0, Math.PI * 2); ctx.fill();\n      ctx.restore();\n\n      ctx.globalAlpha = m.stealth ? 0.32 : 1;\n      const spr = monsterSprite(m.subtype, isBoss ? 4 : 3);\n      ctx.drawImage(spr, x, y, px, px);\n      ctx.globalAlpha = 1;\n\n      if (this.hitFlash.has(m.id)) {\n        ctx.save();\n        ctx.globalCompositeOperation = 'lighter';\n        ctx.globalAlpha = 0.5 * (this.hitFlash.get(m.id) / 120);\n        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, px, px);\n        ctx.restore();\n      }\n\n      if (m.hp < m.maxHp) {\n        const w = px - 4, frac = Math.max(0, m.hp / m.maxHp);\n        ctx.fillStyle = '#100e18'; ctx.fillRect(x + 1, y - 7, w + 2, 4);\n        ctx.fillStyle = frac > 0.5 ? '#58c46a' : frac > 0.25 ? '#ffd27a' : '#ff4d4d';\n        ctx.fillRect(x + 2, y - 6, Math.round(w * frac), 2);\n      }\n    }\n  }\n\n  drawBase(ctx) {\n    const e = this.pointAt(1);\n    ctx.drawImage(baseSprite(3), e.x - 24, e.y - 24);\n    if (this.player.baseHP / this.player.maxBaseHP < 0.35) {\n      ctx.save();\n      ctx.globalAlpha = 0.2 + 0.2 * Math.sin(this.time / 130);\n      ctx.fillStyle = '#ff4d4d'; ctx.fillRect(e.x - 16, e.y - 16, 32, 32);\n      ctx.restore();\n    }\n  }\n\n  drawProjectiles(ctx) {\n    for (const p of this.projectiles) {\n      const t = this.renderPos.get(p.monsterId);\n      if (t) {\n        const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1;\n        ctx.save();\n        ctx.globalAlpha = 0.55; ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, p.size - 1);\n        ctx.beginPath();\n        ctx.moveTo(p.x, p.y);\n        ctx.lineTo(p.x - (dx / d) * p.trail, p.y - (dy / d) * p.trail);\n        ctx.stroke();\n        ctx.restore();\n      }\n      ctx.fillStyle = p.color;\n      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);\n    }\n  }\n\n  drawEffects(ctx) {\n    for (const e of this.effects) {\n      const t = e.ttl / e.maxTtl;\n      ctx.globalAlpha = Math.max(0, t);\n      if (e.type === 'spark') {\n        ctx.fillStyle = e.color;\n        ctx.fillRect(Math.round(e.x), Math.round(e.y), 2, 2);\n      } else if (e.type === 'ring') {\n        ctx.strokeStyle = e.color; ctx.lineWidth = e.big ? 3 : 2;\n        ctx.beginPath(); ctx.arc(e.x, e.y, (1 - t) * (e.big ? 48 : 16), 0, Math.PI * 2); ctx.stroke();\n      } else if (e.type === 'flash') {\n        ctx.fillStyle = e.color;\n        ctx.beginPath(); ctx.arc(e.x, e.y, 6 * t + 2, 0, Math.PI * 2); ctx.fill();\n      } else if (e.type === 'damage') {\n        ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';\n        ctx.fillStyle = '#100e18'; ctx.fillText(e.text, e.x + 1, e.y + 1);\n        ctx.fillStyle = '#ffd27a'; ctx.fillText(e.text, e.x, e.y);\n      }\n      ctx.globalAlpha = 1;\n    }\n  }\n\n  // ---------- Maus ----------\n\n  cellAt(clientX, clientY) {\n    if (!this.field) return null;\n    const r = this.canvas.getBoundingClientRect();\n    const x = (clientX - r.left) * (this.field.w / r.width);\n    const y = (clientY - r.top) * (this.field.h / r.height);\n    const cx = Math.floor(x / this.field.cell), cy = Math.floor(y / this.field.cell);\n    if (cx < 0 || cy < 0 || cx >= this.field.cols || cy >= this.field.rows) return null;\n    return { cx, cy };\n  }\n\n  towerAt(cx, cy) {\n    return this.player?.towers.find(t => t.cx === cx && t.cy === cy) || null;\n  }\n}\n" },
  "/sprites.js": { type: "text/javascript; charset=utf-8", body: "// Pixel-Sprites als Code-Daten (16x16 bzw. 12x12), zur Laufzeit auf Offscreen-Canvases gemalt.\n// Format: { p: {zeichen: farbe}, d: [zeilen] }.  '.' = transparent.\n//\n// Externes Sprite-Sheet einhängen: siehe loadExternalSheet() am Ende der Datei.\n\nconst OUTLINE = '#100e18';\n\n// ---------- gemeinsame Paletten ----------\nconst METAL = { k: OUTLINE, d: '#39415c', m: '#5b6b8a', l: '#93a6c9' };\nconst pal = (extra) => ({ ...METAL, ...extra });\n\n// ---------- Türme (16x16) ----------\n\nexport const TOWER_SPRITES = {\n  gatling: {\n    p: pal({ c: '#7ad3ff', g: '#bfeaff' }),\n    d: [\n      '................',\n      '................',\n      '.....kkkkk......',\n      '....kdddddk.....',\n      '...kdmmmmmdk....',\n      '...kdmlllmdkkkk.',\n      '...kdmlglmdccck.',\n      '...kdmlllmdkkkk.',\n      '...kdmmmmmdk....',\n      '....kdddddk.....',\n      '.....kkkkk......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  },\n  cannon: {\n    p: pal({ c: '#ff9d5c', g: '#ffd0a8' }),\n    d: [\n      '................',\n      '................',\n      '....kkkkkk......',\n      '...kddddddk.....',\n      '..kdmmmmmmdkkkk.',\n      '..kdmlllllmdcck.',\n      '..kdmlgglllmdcck',\n      '..kdmlllllmdcck.',\n      '..kdmmmmmmdkkkk.',\n      '...kddddddk.....',\n      '....kkkkkk......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  },\n  sniper: {\n    p: pal({ c: '#c96bff', g: '#e8c0ff' }),\n    d: [\n      '................',\n      '................',\n      '.....kkkk.......',\n      '....kddddk......',\n      '....kdmmdk......',\n      '....kdmldkkkkkk.',\n      '....kdmgdcccccck',\n      '....kdmldkkkkkk.',\n      '....kdmmdk......',\n      '....kddddk......',\n      '.....kkkk.......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  },\n  support: {\n    p: pal({ c: '#6ddc8b', g: '#c2f5d2' }),\n    d: [\n      '................',\n      '.......kk.......',\n      '......kcck......',\n      '.....kcggck.....',\n      '....kcgkkgck....',\n      '....kcgkkgck....',\n      '.....kcggck.....',\n      '......kcck......',\n      '.......kk.......',\n      '.......kk.......',\n      '......kddk......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  }\n};\n\n// Tier-Marker (kleine Chevrons, die über dem Turm eingeblendet werden)\nexport const TIER_MARK = {\n  p: { k: OUTLINE, y: '#ffd27a' },\n  d: [\n    '....',\n    '.yy.',\n    'y..y',\n    '.kk.'\n  ]\n};\n\n// ---------- Monster & Sabotage-Einheiten (12x12) ----------\n\nexport const MONSTER_SPRITES = {\n  grunt: {\n    p: { k: OUTLINE, a: '#2f6b33', b: '#6ec46a', c: '#a8e6a0', e: '#ffffff', r: '#ff4d4d' },\n    d: [\n      '............',\n      '....kkkk....',\n      '..kkbbbbkk..',\n      '..kbccccbk..',\n      '.kbcekkecbk.',\n      '.kbcekkecbk.',\n      '.kbccccccbk.',\n      '.kabbbbbbak.',\n      '..kaakkaak..',\n      '...kk..kk...',\n      '............',\n      '............'\n    ]\n  },\n  elite: {\n    p: { k: OUTLINE, a: '#a33a1c', b: '#ff7a4d', c: '#ffb08a', e: '#ffffff', r: '#ffd27a' },\n    d: [\n      '..k......k..',\n      '..kk....kk..',\n      '..kbkkkkbk..',\n      '.kkbbbbbbkk.',\n      '.kbccccccbk.',\n      'kbcekkkkecbk',\n      'kbcekkkkecbk',\n      'kbcccccccbk.',\n      '.kabbbbbbak.',\n      '.kkaakkaakk.',\n      '..kk....kk..',\n      '............'\n    ]\n  },\n  bonus: {\n    p: { k: OUTLINE, a: '#7a5a2a', b: '#c9a24d', c: '#f0d68f', e: '#ffffff' },\n    d: [\n      '............',\n      '....kkkk....',\n      '..kkbbbbkk..',\n      '..kbccccbk..',\n      '.kbcekkecbk.',\n      '.kbcekkecbk.',\n      '.kbccccccbk.',\n      '.kabbbbbbak.',\n      '..kaakkaak..',\n      '...kk..kk...',\n      '............',\n      '............'\n    ]\n  },\n  swarmRunner: {\n    p: { k: OUTLINE, a: '#6a2fa0', b: '#b06bff', c: '#dfc0ff', e: '#ffffff' },\n    d: [\n      '............',\n      '............',\n      '.....kk.....',\n      '....kbbk....',\n      '...kbccbk...',\n      '..kbcekecbk.',\n      '..kbccccbk..',\n      '...kabbak...',\n      '..k.kkkk.k..',\n      '.k...kk...k.',\n      '............',\n      '............'\n    ]\n  },\n  panzerBrute: {\n    p: { k: OUTLINE, a: '#4a1f75', b: '#8a4fd0', c: '#c9a0f5', e: '#ff4d4d', s: '#5b6b8a' },\n    d: [\n      '.kkkkkkkkkk.',\n      'kssssssssssk',\n      'kskbbbbbbksk',\n      'kskbccccbksk',\n      'kkbcekkecbkk',\n      'kkbcekkecbkk',\n      'kskbccccbksk',\n      'kskbbbbbbksk',\n      'kssssssssssk',\n      '.kkaakkaakk.',\n      '..kk....kk..',\n      '............'\n    ]\n  },\n  stealthRunner: {\n    p: { k: '#2a1a3a', a: '#5a3a8a', b: '#8f6bd0', c: '#c0a8e8', e: '#7ad3ff' },\n    d: [\n      '............',\n      '....kkkk....',\n      '...kbbbbk...',\n      '..kbccccbk..',\n      '..kbekkebk..',\n      '..kbccccbk..',\n      '..kabbbbak..',\n      '...kaaaak...',\n      '..k.a..a.k..',\n      '.k..a..a..k.',\n      '............',\n      '............'\n    ]\n  },\n  saboteur: {\n    p: { k: OUTLINE, a: '#8a5a1a', b: '#e0a83a', c: '#ffe08a', e: '#ffffff', s: '#93a6c9' },\n    d: [\n      '............',\n      '.....kk.....',\n      '....kbbk....',\n      '...kbccbk...',\n      '..kbcekecbk.',\n      '..kbccccbk..',\n      '.kssabbaskk.',\n      '.ksk.aa.ksk.',\n      '..k..kk..k..',\n      '.....kk.....',\n      '............',\n      '............'\n    ]\n  },\n  splitter: {\n    p: { k: OUTLINE, a: '#2a6a5a', b: '#4fc9a0', c: '#a8f0d8', e: '#ffffff' },\n    d: [\n      '............',\n      '...kkkkkk...',\n      '..kbbkkbbk..',\n      '.kbcckkccbk.',\n      '.kbcekkecbk.',\n      '.kbcckkccbk.',\n      '.kbcckkccbk.',\n      '.kabbkkbbak.',\n      '..kaakkaak..',\n      '...kk..kk...',\n      '............',\n      '............'\n    ]\n  },\n  runner: {\n    p: { k: OUTLINE, a: '#8a5a2a', b: '#e08a3a', c: '#ffc98a', e: '#ffffff' },\n    d: [\n      '............',\n      '............',\n      '....kkkk....',\n      '...kbbbbk...',\n      '..kbccccbk..',\n      '..kbekkebk..',\n      '..kbccccbk..',\n      '...kabbak...',\n      '..kk.kk.kk..',\n      '.k...kk...k.',\n      '............',\n      '............'\n    ]\n  },\n  brute: {\n    p: { k: OUTLINE, a: '#3a5a2a', b: '#5f9440', c: '#9ed17a', e: '#ff4d4d', s: '#7a6a4a' },\n    d: [\n      '..kkkkkkkk..',\n      '.kssssssssk.',\n      'kkbbbbbbbbkk',\n      'kbcccccccckb',\n      'kbcekkkkecbk',\n      'kbcekkkkecbk',\n      'kbcccccccckb',\n      'kkbbbbbbbbkk',\n      '.kssssssssk.',\n      '..kkaakkak..',\n      '..kk....kk..',\n      '............'\n    ]\n  },\n  boss: {\n    p: { k: OUTLINE, a: '#5a1a2a', b: '#b02f4a', c: '#f06a80', e: '#ffd27a', s: '#8a8a9a', g: '#ffffff' },\n    d: [\n      'kk........kk',\n      'kbk.kkkk.kbk',\n      'kbbkbbbbkbbk',\n      'ksbbccccbbsk',\n      'kbcegkkgecbk',\n      'kbcegkkgecbk',\n      'kbccckkcccbk',\n      'ksbbccccbbsk',\n      'kbbkbbbbkbbk',\n      'kbk.kkkk.kbk',\n      'kk..kaak..kk',\n      '....kkkk....'\n    ]\n  },\n  goldCarrier: {\n    p: { k: OUTLINE, a: '#7a5a1a', b: '#d4a72c', c: '#ffd27a', e: '#ffffff', g: '#fff3c4' },\n    d: [\n      '............',\n      '...kkkk.....',\n      '..kbbbbk....',\n      '..kbccbk.kk.',\n      '.kbcekcbkggk',\n      '.kbccccbkggk',\n      '.kabbbbakgk.',\n      '..kaaaak.k..',\n      '..kk..kk....',\n      '.k......k...',\n      '............',\n      '............'\n    ]\n  }\n};\n\n// ---------- Terrain & Deko (16x16) ----------\n\nexport const TILE_SPRITES = {\n  grass: {\n    p: { a: '#3c6639', b: '#4a7c46', c: '#578a51' },\n    d: [\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbcbbbbbbbbab',\n      'bbabbbbbbbcbbbbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbbbabbbbbbcb',\n      'bcbbbbbbbbbbbbbb',\n      'bbbbbbbbbbabbbbb',\n      'bbbbbcbbbbbbbbbb',\n      'bbbbbbbbbbbbbcbb',\n      'babbbbbbbcbbbbbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbcbbbbbbbabbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbbbabbbbbbbb',\n      'bcbbbbbbbbbbcbbb',\n      'bbbbbbbbbbbbbbbb'\n    ]\n  },\n  path: {\n    p: { a: '#6f5436', b: '#8a6a44', c: '#a98455', d: '#c2a074' },\n    d: [\n      'aaaaaaaaaaaaaaaa',\n      'bbbbbbbbbbbbbbbb',\n      'bcbbbbbdbbbbbbcb',\n      'bbbbcbbbbbbdbbbb',\n      'cbbbbbbbbcbbbbbb',\n      'bbbdbbbbbbbbbcbb',\n      'bbbbbbcbbbbbbbbb',\n      'bbcbbbbbbbdbbbbb',\n      'bbbbbbbbcbbbbbbb',\n      'bdbbbbcbbbbbbbdb',\n      'bbbbbbbbbbcbbbbb',\n      'bbbbcbbbbbbbbbbb',\n      'cbbbbbbdbbbbbcbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbbbbbbbbbbbb',\n      'aaaaaaaaaaaaaaaa'\n    ]\n  },\n  platform: {\n    p: { k: OUTLINE, a: '#2b3145', b: '#39415c', c: '#4d566f' },\n    d: [\n      'kkkkkkkkkkkkkkkk',\n      'kccccccccccccc.k',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kaaaaaaaaaaaaaak',\n      'kkkkkkkkkkkkkkkk'\n    ]\n  }\n};\n\n// ---------- Landschafts-Deko (16x16) ----------\n\nexport const DECO_SPRITES = {\n  tree: {\n    p: { k: '#14200f', a: '#24501f', b: '#357029', c: '#4e9440', d: '#6fb85c', t: '#4a3520', u: '#63482c', s: '#1a2a14' },\n    d: [\n      '.....kkkkk......',\n      '...kkbbbbbkk....',\n      '..kbbbcccbbbk...',\n      '.kbbcccddcccbk..',\n      '.kbcccddddccbk..',\n      'kbbcccddddcccbk.',\n      'kbccccdddccccbk.',\n      'kabcccccccccbak.',\n      '.kabbccccccbak..',\n      '..kaabbbbbaak...',\n      '...kkattakk.....',\n      '.....ktuk.......',\n      '.....ktuk.......',\n      '....kkttkk......',\n      '...ksssssk......',\n      '................'\n    ]\n  },\n  rock: {\n    p: { k: '#1c1a22', a: '#4a4a56', b: '#6a6a78', c: '#8c8c9c' },\n    d: [\n      '..............',\n      '.....kkkk.....',\n      '....kbcckk....',\n      '...kabbccck...',\n      '..kaabbbcck...',\n      '..kaaabbbck...',\n      '...kaaabbk....',\n      '....kkkkk.....',\n      '..............'\n    ]\n  },\n  bush: {\n    p: { k: '#16260f', a: '#2f5f22', b: '#468a33', c: '#6aa84f' },\n    d: [\n      '..............',\n      '....kkk.......',\n      '..kkbcckk.....',\n      '.kabbbccck....',\n      '.kaabbbcck....',\n      '..kaabbck.....',\n      '...kkkkk......',\n      '..............'\n    ]\n  }\n};\n\n// Basis / Kern am Ende der Strecke (16x16)\nexport const BASE_SPRITE = {\n  p: { k: OUTLINE, a: '#39415c', b: '#5b6b8a', c: '#93a6c9', g: '#7ad3ff', y: '#bfeaff' },\n  d: [\n    '..kk........kk..',\n    '.kcck......kcck.',\n    '.kbbk.kkkk.kbbk.',\n    '.kbbkkcccckkbbk.',\n    '.kbbbcbbbbcbbbk.',\n    '.kbbcbggggbcbbk.',\n    '.kabcbgyygbcbak.',\n    '.kabcbgyygbcbak.',\n    '.kabcbggggbcbak.',\n    '.kabbcbbbbcbbak.',\n    '.kaabbccccbbaak.',\n    '.kaaaaabbaaaaak.',\n    '.kaaaaabbaaaaak.',\n    '.kkaaaabbaaaakk.',\n    '..kkkkkkkkkkkk..',\n    '................'\n  ]\n};\n\n// ---------- Sprite-Builder ----------\n\nconst cache = new Map();\n\nfunction buildCanvas(sprite, scale = 1, tint = null) {\n  const rows = sprite.d;\n  const h = rows.length;\n  const w = Math.max(...rows.map(r => r.length));\n  const c = document.createElement('canvas');\n  c.width = w * scale;\n  c.height = h * scale;\n  const ctx = c.getContext('2d');\n  ctx.imageSmoothingEnabled = false;\n\n  for (let y = 0; y < h; y++) {\n    const row = rows[y];\n    for (let x = 0; x < w; x++) {\n      const ch = row[x] || '.';\n      if (ch === '.') continue;\n      const color = sprite.p[ch];\n      if (!color) continue;\n      ctx.fillStyle = color;\n      ctx.fillRect(x * scale, y * scale, scale, scale);\n    }\n  }\n\n  if (tint) {\n    ctx.globalCompositeOperation = 'source-atop';\n    ctx.fillStyle = tint;\n    ctx.fillRect(0, 0, c.width, c.height);\n    ctx.globalCompositeOperation = 'source-over';\n  }\n  return c;\n}\n\nexport function getSprite(sprite, key, scale = 1, tint = null) {\n  const id = `${key}@${scale}${tint || ''}`;\n  if (!cache.has(id)) cache.set(id, buildCanvas(sprite, scale, tint));\n  return cache.get(id);\n}\n\nexport function towerSprite(type, scale) {\n  return getSprite(TOWER_SPRITES[type] || TOWER_SPRITES.gatling, 'tower_' + type, scale);\n}\n\nexport function monsterSprite(subtype, scale, ghost = false) {\n  const spr = MONSTER_SPRITES[subtype] || MONSTER_SPRITES.grunt;\n  return getSprite(spr, 'mon_' + subtype + (ghost ? '_g' : ''), scale);\n}\n\nexport function tileSprite(name, scale) {\n  return getSprite(TILE_SPRITES[name], 'tile_' + name, scale);\n}\n\nexport function baseSprite(scale) {\n  return getSprite(BASE_SPRITE, 'base', scale);\n}\n\nexport function decoSprite(name, scale) {\n  return getSprite(DECO_SPRITES[name], 'deco_' + name, scale);\n}\n\nexport function tierMarkSprite(scale) {\n  return getSprite(TIER_MARK, 'tiermark', scale);\n}\n\n// ---------- Optionaler Austausch gegen externes Sprite-Sheet ----------\n// Wenn du später ein gekauftes/heruntergeladenes Sheet nutzen willst:\n// 1. PNG nach client/assets/sheet.png legen\n// 2. Hier die Frame-Koordinaten eintragen\n// 3. loadExternalSheet() in render.js vor dem ersten Zeichnen aufrufen\n//\n// Der restliche Renderer greift ausschließlich über die Funktionen oben zu,\n// es muss also nichts anderes angepasst werden.\n\nexport const EXTERNAL_FRAMES = {\n  // beispiel: gatling: { x: 0, y: 0, w: 16, h: 16 }\n};\n\nexport async function loadExternalSheet(url = 'assets/sheet.png') {\n  if (Object.keys(EXTERNAL_FRAMES).length === 0) return false;\n  const img = await new Promise((resolve, reject) => {\n    const i = new Image();\n    i.onload = () => resolve(i);\n    i.onerror = reject;\n    i.src = url;\n  });\n  for (const [key, f] of Object.entries(EXTERNAL_FRAMES)) {\n    for (const scale of [1, 2, 3]) {\n      const c = document.createElement('canvas');\n      c.width = f.w * scale; c.height = f.h * scale;\n      const ctx = c.getContext('2d');\n      ctx.imageSmoothingEnabled = false;\n      ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, c.width, c.height);\n      cache.set(`${key}@${scale}`, c);\n    }\n  }\n  return true;\n}\n" }
};

// ==================== server/geometry.js ====================
// Gemeinsame Spielfeld-Geometrie. Der Server ist die alleinige Quelle der Wahrheit —
// der Client bekommt die Wegpunkte im Spielzustand geschickt und zeichnet danach.

const FIELD_W = 960;
const FIELD_H = 540;
const CELL = 48;              // Rastergröße fürs Bauen (passt zur Turmgröße)
const PATH_CLEARANCE = 28;    // Mindestabstand einer Bauzelle zur Wegmitte

// Vierreihige Serpentine
const PATH_POINTS = [
  { x: -30, y: 90 },
  { x: 830, y: 90 },
  { x: 830, y: 210 },
  { x: 130, y: 210 },
  { x: 130, y: 330 },
  { x: 830, y: 330 },
  { x: 830, y: 450 },
  { x: 950, y: 450 }
];

const SEGMENTS = [];
let TOTAL = 0;
for (let i = 0; i < PATH_POINTS.length - 1; i++) {
  const a = PATH_POINTS[i], b = PATH_POINTS[i + 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  SEGMENTS.push({ a, b, len, start: TOTAL });
  TOTAL += len;
}
const PATH_TOTAL_PX = TOTAL;

// Anteil [0..1] der Strecke -> Punkt auf dem Weg
function pointAtFrac(frac) {
  const d = Math.max(0, Math.min(1, frac)) * TOTAL;
  for (const s of SEGMENTS) {
    if (d <= s.start + s.len || s === SEGMENTS[SEGMENTS.length - 1]) {
      const t = s.len ? (d - s.start) / s.len : 0;
      return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
    }
  }
  const last = PATH_POINTS[PATH_POINTS.length - 1];
  return { x: last.x, y: last.y };
}

// Kürzester Abstand eines Punktes zum Weg
function distanceToPath(px, py) {
  let best = Infinity;
  for (const s of SEGMENTS) {
    const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - s.a.x) * dx + (py - s.a.y) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = s.a.x + dx * t, cy = s.a.y + dy * t;
    best = Math.min(best, Math.hypot(px - cx, py - cy));
  }
  return best;
}

const COLS = Math.floor(FIELD_W / CELL);
const ROWS = Math.floor(FIELD_H / CELL);

function cellCenter(cx, cy) {
  return { x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 };
}

// Ist eine Rasterzelle bebaubar? (im Feld und weit genug vom Weg entfernt)
function isBuildableCell(cx, cy) {
  if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
  const c = cellCenter(cx, cy);
  return distanceToPath(c.x, c.y) >= PATH_CLEARANCE;
}

function buildableCellCount() {
  let n = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (isBuildableCell(x, y)) n++;
  return n;
}

// ==================== server/towers.js ====================
// Turmdefinitionen: Basiswerte + zweistufig verzweigte Upgrades.
// dps-basiertes Modell: jeder Tick wird (dps * tickSeconds) Schaden an Ziel(en) verteilt.

const TOWER_TYPES = {
  gatling: {
    name: 'Gatling',
    buildCost: 40,
    base: { damage: 4, fireRate: 2.5, range: 100, splash: 0 },
    tier1Cost: 60,
    tier1: {
      minigun: { label: 'Minigun', desc: '+60% Feuerrate, fokussiert Einzelziele', fireRateMult: 1.6, damageMult: 0.9 },
      flak: { label: 'Flak', desc: 'Kleiner Flächenschaden gegen Schwärme', splash: 1.2, damageMult: 0.75 }
    },
    tier2Cost: 120,
    tier2: {
      railgun: { label: 'Railgun', desc: 'Durchschlägt Panzerung (Bonus vs. Panzer-Brute)', armorPierce: true, damageMult: 1.5 },
      chainLightning: { label: 'Chain Lightning', desc: 'Springt auf bis zu 3 zusätzliche Ziele', chainTargets: 3, damageMult: 0.6 }
    }
  },
  cannon: {
    name: 'Kanone',
    buildCost: 60,
    base: { damage: 14, fireRate: 0.8, range: 88, splash: 34 },
    tier1Cost: 80,
    tier1: {
      siegeMortar: { label: 'Siege-Mörser', desc: 'Riesiger Einzeltreffer, langsames Nachladen', damageMult: 2.2, fireRateMult: 0.5 },
      clusterBomb: { label: 'Cluster-Bombe', desc: 'Größerer Splash gegen Swarms', splashMult: 1.6, damageMult: 0.8 }
    },
    tier2Cost: 150,
    tier2: {
      orbitalStrike: { label: 'Orbital-Strike', desc: 'Massiver periodischer Flächenschaden', damageMult: 1.3, orbital: true },
      napalm: { label: 'Napalm', desc: 'Brandschaden über Zeit im Splashbereich', damageMult: 0.9, dot: true }
    }
  },
  sniper: {
    name: 'Frost-Sniper',
    buildCost: 55,
    base: { damage: 20, fireRate: 0.6, range: 165, slowPct: 0.3, slowDuration: 2.5 },
    tier1Cost: 75,
    tier1: {
      deepFreeze: { label: 'Deep-Freeze', desc: 'Chance auf kurzen Vollstun', stunChance: 0.25, slowPct: 0.5 },
      piercingShot: { label: 'Piercing-Shot', desc: 'Trifft ein zweites Ziel in der Linie', pierceCount: 2, damageMult: 0.8 }
    },
    tier2Cost: 140,
    tier2: {
      cryoField: { label: 'Cryo-Field', desc: 'Friert Bereich um Treffer kurz ein', freezeAoe: true },
      executioner: { label: 'Executioner-Rounds', desc: 'Bonusschaden gegen Ziele unter 15% HP', executeThreshold: 0.15, executeDamageMult: 3 }
    }
  },
  support: {
    name: 'Support/Detector',
    buildCost: 45,
    base: { range: 95, auraRange: 95, revealStealth: true },
    tier1Cost: 65,
    tier1: {
      detectorFocus: { label: 'Detektor-Fokus', desc: 'Größere Aufdeckungsreichweite', revealRangeMult: 1.5 },
      boosterFocus: { label: 'Booster-Fokus', desc: 'Benachbarte Türme +15% Schaden', damageBuffPct: 0.15 }
    },
    tier2Cost: 130,
    tier2: {
      wideNet: { label: 'Weites Netz', desc: 'Aufdeckung + Boost gleichzeitig, geringer', revealRangeMult: 1.2, damageBuffPct: 0.08 },
      overclock: { label: 'Overclock', desc: 'Boost-Effekt stark erhöht', damageBuffPct: 0.3 }
    }
  }
};

// Ab Stufe 3 endlose Feinausbauten: jede Stufe stärker und teurer.
const LEVEL_UP_BASE_COST = 90;
const LEVEL_DAMAGE_MULT = 1.18;
const LEVEL_RANGE_MULT = 1.04;

function levelUpCost(level) {
  // level = aktuelle Feinausbaustufe (0 = noch keine)
  return Math.round(LEVEL_UP_BASE_COST * Math.pow(1.45, level));
}

// Effektive Stats eines Turms berechnen (Basis + Tier1-Zweig + Tier2-Zweig + globale Multiplikatoren)
function computeTowerStats(tower, globalMods = {}) {
  const def = TOWER_TYPES[tower.type];
  let stats = { ...def.base };

  const applyMod = (mod) => {
    if (!mod) return;
    if (mod.damageMult) stats.damage = (stats.damage || 0) * mod.damageMult;
    if (mod.fireRateMult) stats.fireRate = (stats.fireRate || 0) * mod.fireRateMult;
    if (mod.splash) stats.splash = mod.splash;
    if (mod.splashMult) stats.splash = (stats.splash || 1) * mod.splashMult;
    if (mod.armorPierce) stats.armorPierce = true;
    if (mod.chainTargets) stats.chainTargets = mod.chainTargets;
    if (mod.stunChance) stats.stunChance = mod.stunChance;
    if (mod.slowPct) stats.slowPct = mod.slowPct;
    if (mod.pierceCount) stats.pierceCount = mod.pierceCount;
    if (mod.freezeAoe) stats.freezeAoe = true;
    if (mod.orbital) stats.orbital = true;
    if (mod.dot) stats.dot = true;
    if (mod.executeThreshold) { stats.executeThreshold = mod.executeThreshold; stats.executeDamageMult = mod.executeDamageMult; }
    if (mod.revealRangeMult) stats.auraRange = (stats.auraRange || 0) * mod.revealRangeMult;
    if (mod.damageBuffPct) stats.damageBuffPct = (stats.damageBuffPct || 0) + mod.damageBuffPct;
  };

  if (tower.branch1) applyMod(def.tier1[tower.branch1]);
  if (tower.branch2) applyMod(def.tier2[tower.branch2]);

  // Endlose Feinausbauten ab Stufe 3
  const lvl = tower.level || 0;
  if (lvl > 0) {
    stats.damage = (stats.damage || 0) * Math.pow(LEVEL_DAMAGE_MULT, lvl);
    stats.range = (stats.range || 0) * Math.pow(LEVEL_RANGE_MULT, lvl);
  }

  if (globalMods.towerDamageMult) stats.damage = (stats.damage || 0) * globalMods.towerDamageMult;
  if (globalMods.rangeMult) stats.range = (stats.range || 0) * globalMods.rangeMult;
  if (tower.rapidDeploy) stats.fireRate = (stats.fireRate || 0) * 1.5;

  return stats;
}

// ==================== server/saboteurs.js ====================
// Sabotage-Einheiten: gekauft von Spieler A, gespawnt auf Board von Spieler B.
// Jede Einheit hat einen klaren Kontra-Zweck gegen einen Turmtyp.

const SABOTEUR_TYPES = {
  swarmRunner: {
    label: 'Swarm-Runner', cost: 20, count: 5,
    hp: 15, speed: 1.5, damageToBaseOnLeak: 3, killGold: 2,
    desc: 'Billig, schnell, viele — kontert schwachen Flächenschaden.'
  },
  panzerBrute: {
    label: 'Panzer-Brute', cost: 80, count: 1,
    hp: 240, speed: 0.6, damageToBaseOnLeak: 25, killGold: 10, armored: true,
    desc: 'Teuer, sehr tanky — kontert Einzelzielschaden.'
  },
  stealthRunner: {
    label: 'Stealth-Läufer', cost: 60, count: 2,
    hp: 40, speed: 1.1, damageToBaseOnLeak: 10, killGold: 6,
    stealth: true, stealthRevealFrac: 0.7,
    desc: 'Unsichtbar bis kurz vorm Turm — erzwingt Detector-Investition.'
  },
  saboteur: {
    label: 'Saboteur', cost: 50, count: 1,
    hp: 20, speed: 1.0, damageToBaseOnLeak: 5, killGold: 4,
    disruptor: true, disableDuration: 3,
    desc: 'Schwach im Kampf, deaktiviert kurzzeitig Türme beim Vorbeigehen.'
  },
  splitter: {
    label: 'Splitter', cost: 45, count: 1,
    hp: 60, speed: 1.0, damageToBaseOnLeak: 8, killGold: 5,
    splitsInto: 3, splitHpFrac: 0.25,
    desc: 'Teilt sich beim Tod in schwächere Einheiten — kontert Einzelziel-Sniper.'
  },
  goldCarrier: {
    label: 'Golden Carrier', cost: 90, count: 1,
    hp: 150, speed: 0.8, damageToBaseOnLeak: 15, killGold: 8,
    bonusGoldToSenderOnLeak: 60,
    desc: 'Bringt dem Angreifer Bonusgold, wenn er die Basis erreicht.'
  }
};

// ==================== server/commanders.js ====================
// Commander: Passiv-Effekt beim Matchstart + aktive Fähigkeit mit Cooldown.

const COMMANDER_TYPES = {
  vanguard: {
    label: 'Vanguard', desc: 'Passiv: +20% max. Basis-HP. Aktiv: Notreparatur (+15% HP).',
    cooldown: 45,
    applyPassive(player) {
      player.maxBaseHP = Math.round(player.maxBaseHP * 1.2);
      player.baseHP = player.maxBaseHP;
    },
    applyActive(player) {
      player.baseHP = Math.min(player.maxBaseHP, player.baseHP + player.maxBaseHP * 0.15);
    }
  },
  financier: {
    label: 'Financier', desc: 'Passiv: +50% Zinsen. Aktiv: Gold Surge (+40 Gold sofort).',
    cooldown: 40,
    applyPassive(player) {
      player.interestMult = (player.interestMult || 1) * 1.5;
    },
    applyActive(player) {
      player.gold += 40;
    }
  },
  warlord: {
    label: 'Warlord', desc: 'Passiv: eigene Sabotage-Einheiten +10% HP. Aktiv: Overcharge (nächste Sabotage-Einheit gratis).',
    cooldown: 50,
    applyPassive(player) {
      player.sabotageHpMult = (player.sabotageHpMult || 1) * 1.1;
    },
    applyActive(player) {
      player.nextSabotageFree = true;
    }
  },
  engineer: {
    label: 'Engineer', desc: 'Passiv: Turmkosten -10%. Aktiv: Rapid Deploy (alle Türme +50% Feuerrate für 8s).',
    cooldown: 55,
    applyPassive(player) {
      player.towerCostMult = (player.towerCostMult || 1) * 0.9;
    },
    applyActive(player, match) {
      player.rapidDeployUntil = match.elapsedMs + 8000;
    }
  }
};

// ==================== server/events.js ====================
// Globale Zufallsereignisse (betreffen alle Spieler gleich) + Bounties (Nebenziele pro Spieler).

const EVENT_TYPES = {
  goldRush: {
    label: 'Gold Rush', desc: 'Doppeltes Gold für alle für 20s.',
    durationMs: 20000, mods: { goldMult: 2 }
  },
  cheapSabotage: {
    label: 'Schwarzmarkt', desc: 'Sabotage-Einheiten 30% günstiger für 20s.',
    durationMs: 20000, mods: { sabotageCostMult: 0.7 }
  },
  overclockedTowers: {
    label: 'Overclock', desc: 'Alle Türme +20% Schaden für 15s.',
    durationMs: 15000, mods: { towerDamageMult: 1.2 }
  },
  monsterRush: {
    label: 'Monster-Ansturm', desc: 'Monster 25% schneller für 15s.',
    durationMs: 15000, mods: { monsterSpeedMult: 1.25 }
  }
};

const BOUNTY_TYPES = {
  killSaboteurs: {
    label: 'Jäger', desc: 'Töte 5 Sabotage-Einheiten in Folge.', target: 5, reward: 30, track: 'sabotageKillStreak'
  },
  noLeakStreak: {
    label: 'Dichte Verteidigung', desc: 'Halte 45s ohne durchgelassenes Monster.', target: 45000, reward: 35, track: 'noLeakMs'
  },
  goldHoarder: {
    label: 'Goldhort', desc: 'Erreiche 150 Gold gleichzeitig.', target: 150, reward: 20, track: 'goldPeak'
  }
};

function rollRandomEvent() {
  const keys = Object.keys(EVENT_TYPES);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { key, ...EVENT_TYPES[key] };
}

function rollRandomBounty(excludeKey) {
  const keys = Object.keys(BOUNTY_TYPES).filter(k => k !== excludeKey);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { key, ...BOUNTY_TYPES[key] };
}

// ==================== server/relics.js ====================
// Relikt-Draft vor Matchstart: jeder Spieler bekommt 3 zufällige Optionen und wählt eine.

const RELIC_TYPES = {
  headstart: {
    label: 'Kopfstart', desc: '+50 Startgold.',
    apply(player) { player.gold += 50; }
  },
  ironbase: {
    label: 'Eisenbasis', desc: '+15% maximale Basis-HP.',
    apply(player) { player.maxBaseHP = Math.round(player.maxBaseHP * 1.15); player.baseHP = player.maxBaseHP; }
  },
  cheapSteel: {
    label: 'Billigstahl', desc: 'Turmkosten -10%.',
    apply(player) { player.towerCostMult = (player.towerCostMult || 1) * 0.9; }
  },
  sharpEye: {
    label: 'Scharfes Auge', desc: 'Turmreichweite +10%.',
    apply(player) { player.rangeMult = (player.rangeMult || 1) * 1.1; }
  },
  raiders: {
    label: 'Plünderer', desc: 'Sabotage-Kosten -15%.',
    apply(player) { player.sabotageCostMult = (player.sabotageCostMult || 1) * 0.85; }
  },
  banker: {
    label: 'Bankier', desc: '+30% Zinsen.',
    apply(player) { player.interestMult = (player.interestMult || 1) * 1.3; }
  }
};

function rollRelicChoices(n = 3) {
  const keys = Object.keys(RELIC_TYPES);
  const shuffled = [...keys].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map(key => ({ key, ...RELIC_TYPES[key] }));
}

// ==================== server/match.js ====================

const TICK_MS = 150;
const WAVE_INTERVAL_MS = 20000;
const NUM_SLOTS = 12;
const BASE_PATH_LENGTH = 24;

// Wellen-Monster: Grundwerte, die mit der Wellennummer hochskaliert werden.
const WAVE_MONSTERS = {
  grunt:  { label: 'Grunt',   hp: 18,  speed: 0.90, gold: 5,  leak: 4,  armored: false },
  runner: { label: 'Runner',  hp: 12,  speed: 1.70, gold: 5,  leak: 3,  armored: false },
  brute:  { label: 'Brute',   hp: 60,  speed: 0.50, gold: 8,  leak: 10, armored: true },
  elite:  { label: 'Elite',   hp: 95,  speed: 0.55, gold: 13, leak: 20, armored: true },
  boss:   { label: 'BOSS',    hp: 700, speed: 0.35, gold: 70, leak: 60, armored: true }
};

// Zusammensetzung einer Welle — steigende Vielfalt statt immer derselben Gruppe.
function waveComposition(waveIndex) {
  const w = waveIndex;
  if (w > 0 && w % 10 === 0) {
    return [{ type: 'boss', count: 1 }, { type: 'runner', count: 6 + w }];
  }
  if (w > 0 && w % 5 === 0) {
    return [{ type: 'elite', count: 2 + Math.floor(w / 5) }, { type: 'grunt', count: 4 + w }];
  }
  const comp = [{ type: 'grunt', count: 5 + Math.floor(w * 1.1) }];
  if (w >= 2) comp.push({ type: 'runner', count: 2 + Math.floor(w * 0.7) });
  if (w >= 4) comp.push({ type: 'brute', count: 1 + Math.floor(w / 4) });
  return comp;
}
const PATH_TILE_LENGTH = 3;
const MAX_PATH_EXTENSIONS = 5;

function freshPlayer(id, name) {
  return {
    id, name,
    gold: 240,
    maxBaseHP: 100,
    baseHP: 100,
    eliminated: false,
    towers: [],
    monsters: [],
    pathLength: BASE_PATH_LENGTH,
    pathExtensions: 0,
    commander: null,
    commanderCooldownRemaining: 0,
    relic: null,
    lastAttackedBy: null,
    sabotageKillStreak: 0,
    noLeakMs: 0,
    goldPeak: 100,
    bounty: null,
    bountyProgress: 0,
    towerCostMult: 1,
    sabotageCostMult: 1,
    rangeMult: 1,
    interestMult: 1,
    sabotageHpMult: 1,
    nextSabotageFree: false,
    rapidDeployUntil: 0,
    buffUntil: 0,
    buffTowerDamageMult: 1,
    relicChoices: [],
    ready: false
  };
}

let monsterIdCounter = 1;

class Match {
  constructor(players, opts = {}) {
    this.id = opts.id || Math.random().toString(36).slice(2, 8);
    this.matchDurationMs = opts.matchDurationMs || 12 * 60 * 1000;
    this.phase = 'relicDraft'; // relicDraft -> playing -> ended
    this.players = players.map(p => {
      const pl = freshPlayer(p.id, p.name);
      pl.ws = p.ws;
      pl.relicChoices = rollRelicChoices(3);
      return pl;
    });
    this.elapsedMs = 0;
    this.waveIndex = 0;
    this.nextWaveAt = 3000; // erste Welle nach 3s
    this.activeEvent = null;
    this.eventEndsAt = 0;
    this.nextEventAt = 60000 + Math.random() * 20000;
    this.winnerId = null;
    this.finalRanking = null;
    this.log = [];
  }

  alivePlayers() {
    return this.players.filter(p => !p.eliminated);
  }

  getPlayer(id) {
    return this.players.find(p => p.id === id);
  }

  addLog(msg) {
    this.log.push({ t: this.elapsedMs, msg });
    if (this.log.length > 50) this.log.shift();
  }

  // ---------- Aktionen (vom Client) ----------

  chooseCommander(playerId, commanderKey) {
    const p = this.getPlayer(playerId);
    if (!p || this.phase !== 'relicDraft' || !COMMANDER_TYPES[commanderKey]) return;
    p.commander = commanderKey;
  }

  chooseRelic(playerId, relicKey) {
    const p = this.getPlayer(playerId);
    if (!p || this.phase !== 'relicDraft') return;
    const choice = p.relicChoices.find(r => r.key === relicKey);
    if (!choice) return;
    p.relic = relicKey;
    p.ready = true;
    this.maybeStartMatch();
  }

  maybeStartMatch() {
    if (this.phase !== 'relicDraft') return;
    if (!this.players.every(p => p.ready)) return;
    this.startMatch();
  }

  forceStartIfTimedOut() {
    // Fallback: falls jemand nicht wählt, zufällige Wahl nach Timeout in index.js gesteuert
    for (const p of this.players) {
      if (!p.ready) {
        const rk = p.relicChoices[0]?.key;
        if (rk) { p.relic = rk; p.ready = true; }
      }
      if (!p.commander) {
        const keys = Object.keys(COMMANDER_TYPES);
        p.commander = keys[Math.floor(Math.random() * keys.length)];
      }
    }
    this.startMatch();
  }

  startMatch() {
    for (const p of this.players) {
      const relicDef = require0(this, p.relic);
      if (relicDef) relicDef.apply(p);
      const cmdDef = COMMANDER_TYPES[p.commander];
      if (cmdDef) cmdDef.applyPassive(p);
      p.bounty = rollRandomBounty();
      p.goldPeak = p.gold;
    }
    this.phase = 'playing';
    this.addLog('Match gestartet.');
  }

  // Freies Bauen: jede Rasterzelle mit genug Abstand zum Weg ist erlaubt.
  buildTower(playerId, cx, cy, type) {
    const p = this.getPlayer(playerId);
    if (!p || p.eliminated || this.phase !== 'playing') return { error: 'invalid' };
    if (!TOWER_TYPES[type]) return { error: 'unknown_type' };
    if (!isBuildableCell(cx, cy)) return { error: 'bad_cell' };
    if (p.towers.some(t => t.cx === cx && t.cy === cy)) return { error: 'cell_taken' };
    const cost = Math.round(TOWER_TYPES[type].buildCost * p.towerCostMult);
    if (p.gold < cost) return { error: 'no_gold' };
    p.gold -= cost;
    const c = cellCenter(cx, cy);
    p.towers.push({
      id: 't' + Math.random().toString(36).slice(2, 8),
      type, cx, cy, x: c.x, y: c.y,
      tier: 0, level: 0, branch1: null, branch2: null,
      cooldownRemaining: 0, disabledUntil: 0
    });
    return { ok: true };
  }

  sellTower(playerId, towerId) {
    const p = this.getPlayer(playerId);
    if (!p || p.eliminated || this.phase !== 'playing') return { error: 'invalid' };
    const idx = p.towers.findIndex(t => t.id === towerId);
    if (idx === -1) return { error: 'no_tower' };
    const t = p.towers[idx];
    const def = TOWER_TYPES[t.type];
    let spent = def.buildCost;
    if (t.tier >= 1) spent += def.tier1Cost;
    if (t.tier >= 2) spent += def.tier2Cost;
    for (let i = 0; i < (t.level || 0); i++) spent += levelUpCost(i);
    p.gold += Math.round(spent * 0.6);
    p.towers.splice(idx, 1);
    return { ok: true };
  }

  upgradeTower(playerId, towerId, branchKey) {
    const p = this.getPlayer(playerId);
    if (!p || p.eliminated || this.phase !== 'playing') return { error: 'invalid' };
    const tower = p.towers.find(t => t.id === towerId);
    if (!tower) return { error: 'no_tower' };
    const def = TOWER_TYPES[tower.type];

    if (tower.tier === 0) {
      if (!def.tier1[branchKey]) return { error: 'bad_branch' };
      const cost = Math.round(def.tier1Cost * p.towerCostMult);
      if (p.gold < cost) return { error: 'no_gold' };
      p.gold -= cost;
      tower.branch1 = branchKey;
      tower.tier = 1;
      return { ok: true };
    }
    if (tower.tier === 1) {
      if (!def.tier2[branchKey]) return { error: 'bad_branch' };
      const cost = Math.round(def.tier2Cost * p.towerCostMult);
      if (p.gold < cost) return { error: 'no_gold' };
      p.gold -= cost;
      tower.branch2 = branchKey;
      tower.tier = 2;
      return { ok: true };
    }
    // Ab hier endlose Feinausbauten
    const cost = Math.round(levelUpCost(tower.level || 0) * p.towerCostMult);
    if (p.gold < cost) return { error: 'no_gold' };
    p.gold -= cost;
    tower.level = (tower.level || 0) + 1;
    return { ok: true };
  }

  buyPathTile(playerId) {
    const p = this.getPlayer(playerId);
    if (!p || p.eliminated || this.phase !== 'playing') return { error: 'invalid' };
    if (p.pathExtensions >= MAX_PATH_EXTENSIONS) return { error: 'max_extensions' };
    const cost = 40 * (p.pathExtensions + 1);
    if (p.gold < cost) return { error: 'no_gold' };
    p.gold -= cost;
    p.pathExtensions += 1;
    p.pathLength += PATH_TILE_LENGTH;
    return { ok: true };
  }

  buySabotage(senderId, targetId, unitType) {
    const sender = this.getPlayer(senderId);
    const target = this.getPlayer(targetId);
    if (!sender || !target || sender.eliminated || target.eliminated || this.phase !== 'playing') return { error: 'invalid' };
    if (sender.id === target.id) return { error: 'self_target' };
    const def = SABOTEUR_TYPES[unitType];
    if (!def) return { error: 'unknown_type' };
    let cost = def.cost * sender.sabotageCostMult;
    if (this.activeEvent?.mods?.sabotageCostMult) cost *= this.activeEvent.mods.sabotageCostMult;
    cost = Math.round(cost);
    if (sender.nextSabotageFree) { cost = 0; sender.nextSabotageFree = false; }
    if (sender.gold < cost) return { error: 'no_gold' };
    sender.gold -= cost;
    for (let i = 0; i < def.count; i++) {
      const hp = Math.round(def.hp * sender.sabotageHpMult);
      target.monsters.push({
        id: 'm' + (monsterIdCounter++),
        subtype: unitType,
        isSabotage: true,
        sourcePlayerId: sender.id,
        pos: -i * 0.6, // leicht versetzt starten
        hp, maxHp: hp,
        speed: def.speed,
        armored: !!def.armored,
        stealth: !!def.stealth,
        stealthRevealFrac: def.stealthRevealFrac || 0,
        disruptor: !!def.disruptor,
        splitsInto: def.splitsInto || 0,
        splitHpFrac: def.splitHpFrac || 0,
        damageToBaseOnLeak: def.damageToBaseOnLeak,
        bonusGoldToSenderOnLeak: def.bonusGoldToSenderOnLeak || 0,
        killGold: def.killGold,
        slowUntil: 0, slowPct: 0, stunUntil: 0, dotUntil: 0, dotDamage: 0,
        _lastDisruptAt: 0
      });
    }
    target.lastAttackedBy = sender.id;
    this.addLog(`${sender.name} schickt ${def.label} zu ${target.name}.`);
    return { ok: true };
  }

  useCommanderAbility(playerId) {
    const p = this.getPlayer(playerId);
    if (!p || p.eliminated || this.phase !== 'playing') return { error: 'invalid' };
    if (!p.commander) return { error: 'no_commander' };
    if (p.commanderCooldownRemaining > 0) return { error: 'on_cooldown' };
    const def = COMMANDER_TYPES[p.commander];
    def.applyActive(p, this);
    p.commanderCooldownRemaining = def.cooldown * 1000;
    return { ok: true };
  }

  // ---------- Simulation ----------

  tick() {
    if (this.phase !== 'playing') return;
    const dt = TICK_MS;
    const dtS = dt / 1000;
    this.elapsedMs += dt;

    // Events
    if (this.activeEvent && this.elapsedMs >= this.eventEndsAt) {
      this.addLog(`Event beendet: ${this.activeEvent.label}`);
      this.activeEvent = null;
    }
    if (!this.activeEvent && this.elapsedMs >= this.nextEventAt) {
      this.activeEvent = rollRandomEvent();
      this.eventEndsAt = this.elapsedMs + this.activeEvent.durationMs;
      this.nextEventAt = this.elapsedMs + this.activeEvent.durationMs + 70000 + Math.random() * 20000;
      this.addLog(`Event: ${this.activeEvent.label} — ${this.activeEvent.desc}`);
    }

    // Wellen
    if (this.elapsedMs >= this.nextWaveAt) {
      this.spawnWave();
      this.waveIndex += 1;
      this.nextWaveAt = this.elapsedMs + WAVE_INTERVAL_MS;
    }

    for (const p of this.alivePlayers()) {
      this.tickCommanderCooldown(p, dt);
      this.tickPlayerBoard(p, dtS);
    }

    this.checkEliminations();
    this.checkWinCondition();
  }

  tickCommanderCooldown(p, dt) {
    if (p.commanderCooldownRemaining > 0) p.commanderCooldownRemaining = Math.max(0, p.commanderCooldownRemaining - dt);
  }

  spawnWave() {
    const comp = waveComposition(this.waveIndex);
    const scale = 1 + this.waveIndex * 0.16;
    this.lastWaveComposition = comp.map(c => ({ type: c.type, count: c.count, label: WAVE_MONSTERS[c.type].label }));
    this.isBossWave = comp.some(c => c.type === 'boss');

    for (const p of this.alivePlayers()) {
      let offset = 0;
      for (const entry of comp) {
        const def = WAVE_MONSTERS[entry.type];
        for (let i = 0; i < entry.count; i++) {
          const hp = Math.round(def.hp * scale);
          p.monsters.push({
            id: 'm' + (monsterIdCounter++),
            subtype: entry.type,
            isSabotage: false,
            sourcePlayerId: null,
            pos: -(offset++) * 0.45,
            hp, maxHp: hp,
            speed: def.speed,
            armored: def.armored,
            stealth: false, stealthRevealFrac: 0,
            disruptor: false,
            splitsInto: 0, splitHpFrac: 0,
            damageToBaseOnLeak: def.leak,
            bonusGoldToSenderOnLeak: 0,
            killGold: Math.round(def.gold + this.waveIndex * 0.4),
            slowUntil: 0, slowPct: 0, stunUntil: 0, dotUntil: 0, dotDamage: 0,
            _lastDisruptAt: 0
          });
        }
      }
    }
    // interest
    for (const p of this.alivePlayers()) {
      p.gold = Math.round(p.gold * (1 + 0.05 * p.interestMult));
      p.goldPeak = Math.max(p.goldPeak, p.gold);
    }
  }

  // Zeitlich begrenzter Buff für das ganze Brett (z. B. Rache-Buff)
  globalBuffPct(p) {
    return this.elapsedMs < p.buffUntil ? (p.buffTowerDamageMult - 1) : 0;
  }

  // Support-Türme stärken nur Türme in ihrer Aura-Reichweite
  supportBuffFor(p, tower) {
    let buff = 0;
    for (const s of p.towers) {
      if (s.type !== 'support' || s.id === tower.id) continue;
      const def = TOWER_TYPES.support;
      let pct = 0;
      if (s.branch1 && def.tier1[s.branch1]?.damageBuffPct) pct += def.tier1[s.branch1].damageBuffPct;
      if (s.branch2 && def.tier2[s.branch2]?.damageBuffPct) pct += def.tier2[s.branch2].damageBuffPct;
      if (pct === 0) continue;
      const st = computeTowerStats(s, {});
      if (Math.hypot(s.x - tower.x, s.y - tower.y) <= (st.auraRange || 95)) buff += pct;
    }
    return buff;
  }

  boardHasStealthReveal(p) {
    return p.towers.some(t => t.type === 'support');
  }

  tickPlayerBoard(p, dtS) {
    p.shots = [];   // Schuss-Ereignisse dieses Ticks, damit der Client echte Projektile zeichnen kann
    const globalDamageMult = (this.activeEvent?.mods?.towerDamageMult || 1);
    const monsterSpeedMult = (this.activeEvent?.mods?.monsterSpeedMult || 1);
    const globalBuff = this.globalBuffPct(p);
    const revealAll = this.boardHasStealthReveal(p);
    const rapidDeploy = this.elapsedMs < p.rapidDeployUntil;

    // Türme feuern
    for (const t of p.towers) {
      if (t.disabledUntil && this.elapsedMs < t.disabledUntil) continue;
      const stats = computeTowerStats(
        { ...t, rapidDeploy },
        { towerDamageMult: globalDamageMult, rangeMult: p.rangeMult }
      );
      if (t.type === 'support') continue; // Support feuert nicht, wirkt passiv

      t.cooldownRemaining = (t.cooldownRemaining || 0) - dtS;
      if (t.cooldownRemaining > 0) continue;

      // 2D-Zielerfassung: Monsterposition auf dem Weg gegen Turmposition im Raster
      const candidates = p.monsters
        .filter(m => m.hp > 0)
        .filter(m => revealAll || !m.stealth || (m.pos / p.pathLength) >= m.stealthRevealFrac)
        .map(m => {
          const mp = pointAtFrac(m.pos / p.pathLength);
          return { m, mx: mp.x, my: mp.y, d: Math.hypot(mp.x - t.x, mp.y - t.y) };
        })
        .filter(c => c.d <= stats.range)
        .sort((a, b) => b.m.pos - a.m.pos)   // das am weitesten fortgeschrittene Monster zuerst
        .map(c => Object.assign(c.m, { _px: c.mx, _py: c.my }));
      if (candidates.length === 0) continue;

      const primary = candidates[0];
      let dmg = stats.damage * (1 + globalBuff + this.supportBuffFor(p, t));
      if (stats.executeThreshold && primary.hp / primary.maxHp <= stats.executeThreshold) dmg *= stats.executeDamageMult;
      if (primary.armored && !stats.armorPierce) dmg *= 0.6;
      p.shots.push({ towerId: t.id, monsterId: primary.id, dmg: Math.round(dmg), kill: primary.hp - dmg <= 0 });
      this.damageMonster(p, primary, dmg);

      if (stats.slowPct) { primary.slowUntil = this.elapsedMs + (t.type === 'sniper' ? 2500 : 1500); primary.slowPct = stats.slowPct; }
      if (stats.stunChance && Math.random() < stats.stunChance) primary.stunUntil = this.elapsedMs + 800;
      if (stats.dot) { primary.dotUntil = this.elapsedMs + 3000; primary.dotDamage = dmg * 0.2; }

      // Splash / Chain / Pierce / Freeze-AoE: zusätzliche nahe Ziele treffen
      const extraCount = stats.chainTargets || stats.pierceCount || (stats.splash ? 99 : 0);
      if (extraCount > 0) {
        const radius = stats.splash || 40;
        const extras = candidates.slice(1)
          .filter(m => Math.hypot((m._px ?? 0) - (primary._px ?? 0), (m._py ?? 0) - (primary._py ?? 0)) <= radius)
          .slice(0, extraCount);
        for (const m of extras) {
          let extraDmg = dmg * 0.6;
          if (m.armored && !stats.armorPierce) extraDmg *= 0.6;
          this.damageMonster(p, m, extraDmg);
          if (stats.freezeAoe) { m.slowUntil = this.elapsedMs + 1500; m.slowPct = 0.4; }
        }
      }

      t.cooldownRemaining = 1 / stats.fireRate;
    }

    // DOT ticken
    for (const m of p.monsters) {
      if (m.hp > 0 && m.dotUntil > this.elapsedMs) {
        this.damageMonster(p, m, m.dotDamage * dtS);
      }
    }

    // Saboteur-Störeinheiten: Türme deaktivieren
    for (const m of p.monsters) {
      if (m.hp <= 0 || !m.disruptor) continue;
      if (this.elapsedMs - m._lastDisruptAt < 2000) continue;
      const mp = pointAtFrac(m.pos / p.pathLength);
      const nearby = p.towers.filter(t => Math.hypot(t.x - mp.x, t.y - mp.y) <= 70);
      if (nearby.length > 0) {
        const target = nearby[Math.floor(Math.random() * nearby.length)];
        target.disabledUntil = this.elapsedMs + 3000;
        m._lastDisruptAt = this.elapsedMs;
      }
    }

    // Monster bewegen
    let leakedThisTick = false;
    for (const m of p.monsters) {
      if (m.hp <= 0) continue;
      let speedMult = monsterSpeedMult;
      if (m.stunUntil > this.elapsedMs) speedMult *= 0;
      else if (m.slowUntil > this.elapsedMs) speedMult *= (1 - m.slowPct);
      m.pos += m.speed * speedMult * dtS;
      if (m.pos >= p.pathLength) {
        this.leakMonster(p, m);
        leakedThisTick = true;
      }
    }

    // Bounty-Tracking
    if (leakedThisTick) {
      p.sabotageKillStreak = 0;
      p.noLeakMs = 0;
    } else {
      p.noLeakMs += dtS * 1000;
    }
    p.goldPeak = Math.max(p.goldPeak, p.gold);
    this.checkBounty(p);

    // tote Monster entfernen
    p.monsters = p.monsters.filter(m => m.hp > 0);
  }

  damageMonster(ownerPlayer, m, dmg) {
    if (m.hp <= 0) return;
    m.hp -= dmg;
    if (m.hp <= 0) {
      ownerPlayer.gold += m.killGold;
      ownerPlayer.goldPeak = Math.max(ownerPlayer.goldPeak, ownerPlayer.gold);
      if (m.isSabotage) ownerPlayer.sabotageKillStreak += 1;
      if (m.splitsInto > 0) {
        const childHp = Math.max(1, Math.round(m.maxHp * m.splitHpFrac));
        for (let i = 0; i < m.splitsInto; i++) {
          ownerPlayer.monsters.push({
            ...m,
            id: 'm' + (monsterIdCounter++),
            hp: childHp, maxHp: childHp,
            splitsInto: 0,
            pos: Math.max(0, m.pos - i * 0.3),
            _lastDisruptAt: 0
          });
        }
      }
    }
  }

  leakMonster(p, m) {
    p.baseHP -= m.damageToBaseOnLeak;
    if (m.bonusGoldToSenderOnLeak && m.sourcePlayerId) {
      const sender = this.getPlayer(m.sourcePlayerId);
      if (sender && !sender.eliminated) sender.gold += m.bonusGoldToSenderOnLeak;
    }
    m.hp = 0;
  }

  checkBounty(p) {
    if (!p.bounty) return;
    const b = p.bounty;
    let progress = 0;
    if (b.track === 'sabotageKillStreak') progress = p.sabotageKillStreak;
    else if (b.track === 'noLeakMs') progress = p.noLeakMs;
    else if (b.track === 'goldPeak') progress = p.goldPeak;
    if (progress >= b.target) {
      p.gold += b.reward;
      this.addLog(`${p.name} erfüllt Bounty "${b.label}" (+${b.reward} Gold).`);
      p.bounty = rollRandomBounty(b.key);
      p.sabotageKillStreak = 0;
      p.noLeakMs = 0;
    }
  }

  checkEliminations() {
    for (const p of this.players) {
      if (!p.eliminated && p.baseHP <= 0) {
        p.eliminated = true;
        p.baseHP = 0;
        this.addLog(`${p.name} ist ausgeschieden.`);

        const remaining = this.alivePlayers();
        if (remaining.length > 0) {
          // Bonus-Welle an Überlebende verteilen
          const bonusHp = Math.round(20 * (1 + this.waveIndex * 0.15));
          for (const rp of remaining) {
            for (let i = 0; i < 3; i++) {
              rp.monsters.push({
                id: 'm' + (monsterIdCounter++),
                subtype: 'bonus', isSabotage: false, sourcePlayerId: null,
                pos: -i * 0.5, hp: bonusHp, maxHp: bonusHp, speed: 0.9,
                armored: false, stealth: false, stealthRevealFrac: 0, disruptor: false,
                splitsInto: 0, splitHpFrac: 0, damageToBaseOnLeak: 6, bonusGoldToSenderOnLeak: 0,
                killGold: 4, slowUntil: 0, slowPct: 0, stunUntil: 0, dotUntil: 0, dotDamage: 0, _lastDisruptAt: 0
              });
            }
          }
          // Rache-Buff für den letzten Angreifer
          if (p.lastAttackedBy) {
            const avenger = this.getPlayer(p.lastAttackedBy);
            if (avenger && !avenger.eliminated) {
              avenger.buffUntil = this.elapsedMs + 10000;
              avenger.buffTowerDamageMult = 1.2;
              this.addLog(`${avenger.name} erhält einen Rache-Buff.`);
            }
          }
        }
      }
    }
  }

  checkWinCondition() {
    if (this.phase !== 'playing') return;
    const alive = this.alivePlayers();
    if (alive.length <= 1) {
      this.endMatch(alive[0]?.id || null);
      return;
    }
    if (this.elapsedMs >= this.matchDurationMs) {
      const ranked = [...alive].sort((a, b) => (b.baseHP - a.baseHP) || (b.gold - a.gold));
      this.endMatch(ranked[0].id);
    }
  }

  endMatch(winnerId) {
    this.phase = 'ended';
    this.winnerId = winnerId;
    this.finalRanking = [...this.players].sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      return (b.baseHP - a.baseHP) || (b.gold - a.gold);
    }).map(p => ({ id: p.id, name: p.name, baseHP: p.baseHP, gold: p.gold, eliminated: p.eliminated }));
    this.addLog(winnerId ? `Match beendet. Gewinner: ${this.getPlayer(winnerId)?.name}` : 'Match beendet ohne Sieger.');
  }

  // ---------- Serialisierung fürs Client-Rendering ----------

  toClientState() {
    return {
      id: this.id,
      phase: this.phase,
      elapsedMs: this.elapsedMs,
      matchDurationMs: this.matchDurationMs,
      waveIndex: this.waveIndex,
      nextWaveInMs: Math.max(0, this.nextWaveAt - this.elapsedMs),
      nextWaveIsBoss: (this.waveIndex + 1) % 10 === 0,
      lastWaveComposition: this.lastWaveComposition || [],
      activeEvent: this.activeEvent ? { label: this.activeEvent.label, desc: this.activeEvent.desc, endsInMs: this.eventEndsAt - this.elapsedMs } : null,
      winnerId: this.winnerId,
      finalRanking: this.finalRanking,
      log: this.log.slice(-12),
      field: { w: FIELD_W, h: FIELD_H, cell: CELL, cols: COLS, rows: ROWS },
      pathPoints: PATH_POINTS,
      basePathLength: BASE_PATH_LENGTH,
      players: this.players.map(p => ({
        id: p.id, name: p.name,
        gold: p.gold, baseHP: p.baseHP, maxBaseHP: p.maxBaseHP,
        eliminated: p.eliminated,
        towers: p.towers.map(t => {
          const st = computeTowerStats(t, { rangeMult: p.rangeMult });
          return {
            id: t.id, type: t.type, cx: t.cx, cy: t.cy, x: t.x, y: t.y,
            tier: t.tier, level: t.level || 0,
            branch1: t.branch1, branch2: t.branch2,
            disabled: t.disabledUntil > this.elapsedMs,
            range: Math.round(st.range || 0),
            damage: Math.round((st.damage || 0) * 10) / 10,
            fireRate: Math.round((st.fireRate || 0) * 100) / 100,
            nextLevelCost: t.tier >= 2 ? Math.round(levelUpCost(t.level || 0) * p.towerCostMult) : null
          };
        }),
        shots: p.shots || [],
        monsters: p.monsters.filter(m => m.hp > 0).map(m => ({ id: m.id, subtype: m.subtype, isSabotage: m.isSabotage, pos: m.pos, hp: m.hp, maxHp: m.maxHp, stealth: m.stealth && !(m.pos / p.pathLength >= m.stealthRevealFrac) })),
        pathLength: p.pathLength, pathExtensions: p.pathExtensions,
        commander: p.commander, commanderCooldownRemaining: p.commanderCooldownRemaining,
        relic: p.relic, relicChoices: p.relicChoices.map(r => ({ key: r.key, label: r.label, desc: r.desc })),
        bounty: p.bounty ? { label: p.bounty.label, desc: p.bounty.desc } : null,
        lastAttackedBy: p.lastAttackedBy,
        ready: p.ready
      }))
    };
  }
}

// kleine Hilfsfunktion, um relics.js Zirkularität zu vermeiden
function require0(match, relicKey) {
  return RELIC_TYPES[relicKey];
}

// ==================== Server, Lobby, Tick-Schleife ====================

const PORT = process.env.PORT || 3000;
const RELIC_TIMEOUT_MS = 20000;


const server = http.createServer((req, res) => {
  // Health-Endpoint für Render/Fly Healthchecks und optionale Keepalive-Pings
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, uptimeSec: Math.round(process.uptime()) }));
    return;
  }

  const reqPath = (req.url === '/' ? '/index.html' : req.url).split('?')[0];
  const asset = ASSETS[reqPath];
  if (!asset) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': asset.type });
  res.end(asset.body);
});

const wss = new WebSocketServer({ server });

// Lobby-Verwaltung: Räume mit Code, Spieler warten bis 2-4 verbunden sind und der Host startet.
const rooms = new Map(); // code -> { players: [{id,name,ws}], match: Match|null, maxPlayers }

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 5; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function send(ws, type, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, payload }));
}

function broadcastRoom(room, type, payload) {
  for (const p of room.players) send(p.ws, type, payload);
}

function broadcastMatchState(room) {
  if (!room.match) return;
  const state = room.match.toClientState();
  broadcastRoom(room, 'state', state);
}

wss.on('connection', (ws) => {
  let playerId = 'p' + Math.random().toString(36).slice(2, 9);
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    const { type, payload } = msg;

    // Heartbeat: hält den Render-Free-Dienst wach und erkennt tote Verbindungen
    if (type === 'ping') { send(ws, 'pong', { t: Date.now() }); return; }

    if (type === 'createRoom') {
      const code = genCode();
      const room = { code, players: [{ id: playerId, name: payload.name || 'Spieler', ws }], match: null, maxPlayers: payload.maxPlayers || 4 };
      rooms.set(code, room);
      currentRoom = room;
      send(ws, 'roomCreated', { code, playerId, maxPlayers: room.maxPlayers });
      broadcastLobby(room);
    }

    else if (type === 'joinRoom') {
      const room = rooms.get((payload.code || '').toUpperCase());
      if (!room) { send(ws, 'error', { message: 'Raum nicht gefunden.' }); return; }
      if (room.players.length >= room.maxPlayers) { send(ws, 'error', { message: 'Raum ist voll.' }); return; }
      if (room.match) { send(ws, 'error', { message: 'Match läuft bereits.' }); return; }
      room.players.push({ id: playerId, name: payload.name || 'Spieler', ws });
      currentRoom = room;
      send(ws, 'roomJoined', { code: room.code, playerId, maxPlayers: room.maxPlayers });
      broadcastLobby(room);
    }

    else if (type === 'startMatch') {
      const room = currentRoom;
      if (!room || room.match) return;
      if (room.players.length < 2) { send(ws, 'error', { message: 'Mindestens 2 Spieler nötig.' }); return; }
      const requestedMs = Number(payload?.matchDurationMs);
      const matchDurationMs = Number.isFinite(requestedMs) ? Math.min(Math.max(requestedMs, 60000), 20 * 60000) : undefined;
      room.match = new Match(room.players.map(p => ({ id: p.id, name: p.name, ws: p.ws })), matchDurationMs ? { matchDurationMs } : {});
      broadcastMatchState(room);
      setTimeout(() => {
        if (room.match && room.match.phase === 'relicDraft') {
          room.match.forceStartIfTimedOut();
          broadcastMatchState(room);
        }
      }, RELIC_TIMEOUT_MS);
    }

    else if (type === 'chooseRelic') {
      currentRoom?.match?.chooseRelic(playerId, payload.relicKey);
      if (currentRoom) broadcastMatchState(currentRoom);
    }

    else if (type === 'chooseCommander') {
      currentRoom?.match?.chooseCommander(playerId, payload.commanderKey);
      if (currentRoom) broadcastMatchState(currentRoom);
    }

    else if (type === 'buildTower') {
      const r = currentRoom?.match?.buildTower(playerId, payload.cx, payload.cy, payload.towerType);
      if (r?.error) send(ws, 'actionError', { message: r.error });
    }

    else if (type === 'sellTower') {
      const r = currentRoom?.match?.sellTower(playerId, payload.towerId);
      if (r?.error) send(ws, 'actionError', { message: r.error });
    }

    else if (type === 'upgradeTower') {
      const r = currentRoom?.match?.upgradeTower(playerId, payload.towerId, payload.branchKey);
      if (r?.error) send(ws, 'actionError', { message: r.error });
    }

    else if (type === 'buyPathTile') {
      const r = currentRoom?.match?.buyPathTile(playerId);
      if (r?.error) send(ws, 'actionError', { message: r.error });
    }

    else if (type === 'buySabotage') {
      const r = currentRoom?.match?.buySabotage(playerId, payload.targetId, payload.unitType);
      if (r?.error) send(ws, 'actionError', { message: r.error });
    }

    else if (type === 'useCommanderAbility') {
      const r = currentRoom?.match?.useCommanderAbility(playerId);
      if (r?.error) send(ws, 'actionError', { message: r.error });
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      currentRoom.players = currentRoom.players.filter(p => p.id !== playerId);
      if (currentRoom.players.length === 0) rooms.delete(currentRoom.code);
      else broadcastLobby(currentRoom);
    }
  });
});

function broadcastLobby(room) {
  broadcastRoom(room, 'lobby', {
    code: room.code,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    maxPlayers: room.maxPlayers
  });
}

// Globale Tick-Schleife über alle laufenden Matches
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.match && room.match.phase === 'playing') {
      room.match.tick();
      broadcastMatchState(room);
    } else if (room.match && room.match.phase === 'relicDraft') {
      room.match.maybeStartMatch();
      if (room.match.phase === 'playing') broadcastMatchState(room);
    }
  }
}, TICK_MS);

server.listen(PORT, () => {
  // Auf Render/Fly setzt die Plattform PORT und stellt eine öffentliche URL davor.
  const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
  if (publicUrl) {
    console.log(`Tower Draft Siege läuft — öffentlich erreichbar unter ${publicUrl} (interner Port ${PORT})`);
  } else {
    console.log(`Tower Draft Siege läuft lokal — im Browser öffnen: http://localhost:${PORT}`);
  }
});
