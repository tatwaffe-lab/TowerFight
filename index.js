// Tower Draft Siege — Einzeldatei-Version (automatisch erzeugt aus dem modularen Projekt)
// Enthält Spiellogik, WebSocket-Server und den kompletten Browser-Client.
// Start:  npm install && npm start
// Quelle der Wahrheit bleibt das modulare Projekt; neu erzeugen mit: node build-single.mjs

import http from 'http';
import { WebSocketServer } from 'ws';

// ==================== Eingebettete Client-Dateien ====================
const ASSETS = {
  "/index.html": { type: "text/html; charset=utf-8", body: "<!DOCTYPE html>\n<html lang=\"de\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n<title>Tower Draft Siege</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"style.css\" />\n</head>\n<body>\n<div id=\"app\">\n\n  <section id=\"screen-menu\" class=\"screen active\">\n    <h1>TOWER<span>DRAFT</span>SIEGE</h1>\n    <p class=\"subtitle\">2–4 Spieler · kompetitiv · ~10–20 Min</p>\n\n    <div class=\"card\">\n      <label>Dein Name</label>\n      <input id=\"input-name\" type=\"text\" placeholder=\"Spieler\" maxlength=\"16\" />\n    </div>\n\n    <div class=\"card-row\">\n      <div class=\"card\">\n        <h3>Raum erstellen</h3>\n        <label>Max. Spieler</label>\n        <select id=\"select-maxplayers\">\n          <option value=\"2\">2</option>\n          <option value=\"3\">3</option>\n          <option value=\"4\" selected>4</option>\n        </select>\n        <button id=\"btn-create\" class=\"big-btn\">Erstellen</button>\n      </div>\n      <div class=\"card\">\n        <h3>Beitreten</h3>\n        <label>Raumcode</label>\n        <input id=\"input-code\" type=\"text\" placeholder=\"ABCDE\" maxlength=\"5\" />\n        <button id=\"btn-join\" class=\"big-btn\">Beitreten</button>\n      </div>\n    </div>\n    <p id=\"menu-error\" class=\"error\"></p>\n  </section>\n\n  <section id=\"screen-lobby\" class=\"screen\">\n    <h2>Lobby</h2>\n    <div class=\"card code-card\">\n      <label>Raumcode — an Mitspieler weitergeben</label>\n      <div id=\"lobby-code\" class=\"code-display\"></div>\n    </div>\n    <ul id=\"lobby-players\"></ul>\n    <p id=\"lobby-hint\" class=\"subtitle\"></p>\n    <button id=\"btn-start\" class=\"big-btn\" disabled>Spiel starten</button>\n  </section>\n\n  <section id=\"screen-draft\" class=\"screen\">\n    <h2>Vorbereitung</h2>\n    <h3>Commander</h3>\n    <div id=\"commander-options\" class=\"option-row\"></div>\n    <h3>Relikt</h3>\n    <div id=\"relic-options\" class=\"option-row\"></div>\n    <p id=\"draft-status\" class=\"subtitle\"></p>\n  </section>\n\n  <section id=\"screen-match\" class=\"screen\">\n    <div id=\"match-topbar\">\n      <div id=\"match-timer\">--:--</div>\n      <div id=\"match-wave\">Welle 0</div>\n      <div id=\"match-event\"></div>\n    </div>\n\n    <div id=\"match-layout\">\n      <div id=\"board-column\">\n        <div id=\"own-board-container\"></div>\n        <div id=\"other-boards\"></div>\n      </div>\n\n      <div id=\"sidebar\">\n        <div id=\"hud-gold\"></div>\n        <div id=\"hud-bounty\" class=\"bounty\"></div>\n        <div id=\"commander-panel\"></div>\n        <button id=\"btn-pathtile\" class=\"ghost-btn\">Pfad verlängern</button>\n\n        <div id=\"build-menu\" class=\"panel hidden\"></div>\n        <div id=\"upgrade-menu\" class=\"panel hidden\"></div>\n\n        <div id=\"sabotage-panel\" class=\"panel\">\n          <h4>Angriff auf: <span id=\"sabotage-target-name\">—</span></h4>\n          <div id=\"sabotage-buttons\"></div>\n        </div>\n\n        <div id=\"log-panel\"></div>\n      </div>\n    </div>\n    <div id=\"hint-bar\"></div>\n  </section>\n\n  <section id=\"screen-ended\" class=\"screen\">\n    <h2>Match beendet</h2>\n    <div id=\"ended-ranking\"></div>\n    <button onclick=\"location.reload()\" class=\"big-btn\">Zurück zum Menü</button>\n  </section>\n\n</div>\n<script type=\"module\" src=\"client.js\"></script>\n</body>\n</html>\n" },
  "/style.css": { type: "text/css; charset=utf-8", body: ":root {\n  --bg: #0d0b14;\n  --bg2: #171326;\n  --panel: #1e1a30;\n  --panel2: #262040;\n  --line: #3a3160;\n  --text: #e8e4f5;\n  --dim: #9c93bd;\n  --cyan: #7ad3ff;\n  --gold: #ffd27a;\n  --green: #6ddc8b;\n  --red: #ff5d6c;\n  --violet: #c96bff;\n}\n\n* { box-sizing: border-box; }\n\nbody {\n  margin: 0;\n  background:\n    radial-gradient(circle at 20% 0%, #251d42 0%, transparent 55%),\n    radial-gradient(circle at 85% 10%, #17304a 0%, transparent 50%),\n    var(--bg);\n  background-attachment: fixed;\n  color: var(--text);\n  font-family: 'Press Start 2P', 'Courier New', monospace;\n  font-size: 11px;\n  line-height: 1.7;\n  image-rendering: pixelated;\n}\n\ncanvas, .sprite-icon {\n  image-rendering: pixelated;\n  image-rendering: crisp-edges;\n}\n\n.screen { display: none; padding: 22px; max-width: 1180px; margin: 0 auto; }\n.screen.active { display: block; }\n\nh1 {\n  font-size: 26px;\n  letter-spacing: 2px;\n  margin: 10px 0 4px;\n  color: var(--cyan);\n  text-shadow: 3px 3px 0 #1a2b52, 6px 6px 0 rgba(0,0,0,0.35);\n}\nh1 span { color: var(--gold); margin: 0 8px; }\nh2 { font-size: 16px; color: var(--cyan); text-shadow: 2px 2px 0 #1a2b52; }\nh3 { font-size: 12px; color: var(--gold); margin: 18px 0 8px; }\nh4 { font-size: 10px; margin: 0 0 8px; color: var(--cyan); }\n.subtitle { color: var(--dim); font-size: 9px; }\nlabel { display: block; font-size: 8px; color: var(--dim); margin-bottom: 6px; }\n\n/* --- Panels / Karten --- */\n.card, .panel {\n  background: linear-gradient(180deg, var(--panel) 0%, var(--bg2) 100%);\n  border: 2px solid var(--line);\n  border-radius: 2px;\n  padding: 14px;\n  margin: 12px 0;\n  box-shadow: inset 0 0 0 2px #100e1c, 0 4px 0 rgba(0,0,0,0.4);\n}\n.card-row { display: flex; gap: 14px; flex-wrap: wrap; }\n.card-row .card { flex: 1; min-width: 240px; }\n\ninput, select {\n  width: 100%;\n  font-family: inherit;\n  font-size: 11px;\n  padding: 10px;\n  background: #0d0b16;\n  color: var(--text);\n  border: 2px solid var(--line);\n  border-radius: 2px;\n  margin-bottom: 10px;\n}\ninput:focus, select:focus { outline: none; border-color: var(--cyan); }\n#input-code { text-transform: uppercase; letter-spacing: 5px; text-align: center; }\n\n/* --- Buttons --- */\nbutton {\n  font-family: inherit;\n  font-size: 9px;\n  padding: 10px 12px;\n  color: var(--text);\n  background: linear-gradient(180deg, #35507f 0%, #223354 100%);\n  border: 2px solid #4d74b5;\n  border-radius: 2px;\n  cursor: pointer;\n  box-shadow: 0 3px 0 #14203a;\n  transition: transform 0.05s, box-shadow 0.05s;\n}\nbutton:hover:not(:disabled) { background: linear-gradient(180deg, #426399 0%, #2a4068 100%); }\nbutton:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 0 0 #14203a; }\nbutton:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: 0 3px 0 #14203a; }\n\n.big-btn { width: 100%; padding: 14px; font-size: 11px; margin-top: 6px; }\n.ghost-btn {\n  background: linear-gradient(180deg, var(--panel2) 0%, #1b1730 100%);\n  border-color: var(--line);\n  box-shadow: 0 3px 0 #100d1c;\n  width: 100%;\n}\n\n.error { color: var(--red); font-size: 9px; }\n\n/* --- Lobby --- */\n.code-card { text-align: center; }\n.code-display {\n  font-size: 34px;\n  letter-spacing: 10px;\n  color: var(--gold);\n  text-shadow: 3px 3px 0 #6b4a10;\n  padding: 10px 0;\n}\n#lobby-players { list-style: none; padding: 0; }\n#lobby-players li {\n  padding: 10px 12px;\n  background: var(--panel);\n  border-left: 4px solid var(--cyan);\n  margin-bottom: 6px;\n  font-size: 10px;\n}\n\n/* --- Draft --- */\n.option-row { display: flex; gap: 12px; flex-wrap: wrap; }\n.option-card {\n  background: linear-gradient(180deg, var(--panel) 0%, var(--bg2) 100%);\n  border: 2px solid var(--line);\n  padding: 12px;\n  width: 235px;\n  cursor: pointer;\n  box-shadow: 0 4px 0 rgba(0,0,0,0.4);\n}\n.option-card:hover { border-color: var(--cyan); transform: translateY(-2px); }\n.option-card.selected {\n  border-color: var(--gold);\n  background: linear-gradient(180deg, #3a2f14 0%, #241d10 100%);\n}\n.option-card h4 { color: var(--gold); }\n.option-card p { margin: 0; font-size: 8px; color: var(--dim); line-height: 1.8; }\n\n/* --- Match --- */\n#match-topbar {\n  display: flex; gap: 24px; align-items: center;\n  background: linear-gradient(180deg, var(--panel) 0%, var(--bg2) 100%);\n  border: 2px solid var(--line);\n  padding: 12px 18px;\n  margin-bottom: 14px;\n  box-shadow: inset 0 0 0 2px #100e1c;\n}\n#match-timer { font-size: 20px; color: var(--cyan); text-shadow: 2px 2px 0 #14304d; }\n#match-timer.urgent { color: var(--red); text-shadow: 2px 2px 0 #4d1420; animation: pulse 0.8s infinite; }\n@keyframes pulse { 50% { opacity: 0.55; } }\n#match-wave { font-size: 11px; color: var(--gold); }\n#match-event { font-size: 9px; color: var(--dim); flex: 1; }\n#match-event.active { color: var(--gold); animation: pulse 1.4s infinite; }\n\n#match-layout { display: flex; gap: 16px; align-items: flex-start; }\n#board-column { flex: 1; min-width: 0; }\n#sidebar { width: 290px; flex-shrink: 0; }\n\n.board-panel {\n  position: relative;\n  background: linear-gradient(180deg, var(--panel) 0%, #12101f 100%);\n  border: 2px solid var(--line);\n  padding: 10px;\n  margin-bottom: 12px;\n  box-shadow: inset 0 0 0 2px #100e1c;\n}\n.board-panel.own { border-color: var(--cyan); box-shadow: inset 0 0 0 2px #100e1c, 0 0 14px rgba(122,211,255,0.18); }\n.board-panel.mini { cursor: pointer; }\n.board-panel.mini:hover { border-color: var(--gold); }\n.board-panel.is-target { border-color: #ff9d5c; box-shadow: inset 0 0 0 2px #100e1c, 0 0 12px rgba(255,157,92,0.35); }\n.board-panel.eliminated { filter: grayscale(0.85); opacity: 0.55; }\n\n.board-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }\n.pname { font-size: 10px; color: var(--text); }\n.pstats { font-size: 9px; color: var(--dim); }\n.pstats .hp { color: var(--green); }\n.pstats .gold { color: var(--gold); }\n\n.hp-bar-outer { background: #0d0b16; border: 1px solid #000; height: 7px; margin-bottom: 8px; }\n.hp-bar-inner { height: 100%; width: 100%; background: var(--green); transition: width 0.15s linear; }\n\n.board-canvas { display: block; width: 100%; height: auto; background: #2b3a2a; border: 1px solid #000; }\n\n.target-badge {\n  display: none;\n  position: absolute; top: 8px; right: 10px;\n  background: #ff9d5c; color: #2a1405;\n  font-size: 7px; padding: 3px 6px;\n}\n.board-panel.is-target .target-badge { display: block; }\n\n#other-boards { display: flex; gap: 12px; flex-wrap: wrap; }\n#other-boards .board-panel { flex: 1; min-width: 280px; }\n\n/* --- Sidebar --- */\n#hud-gold { font-size: 10px; color: var(--dim); margin-bottom: 4px; }\n.big-gold { font-size: 22px; color: var(--gold); text-shadow: 2px 2px 0 #6b4a10; }\n.bounty { font-size: 8px; color: var(--green); line-height: 1.8; margin-bottom: 10px; min-height: 20px; }\n\n.sab-btn, .tower-btn {\n  display: flex; align-items: center; gap: 10px;\n  width: 100%; text-align: left; margin-bottom: 6px;\n  background: linear-gradient(180deg, var(--panel2) 0%, #191430 100%);\n  border-color: var(--line);\n}\n.sab-btn:hover:not(:disabled), .tower-btn:hover:not(:disabled) { border-color: var(--violet); }\n.sab-btn b, .tower-btn b { display: block; font-size: 9px; color: var(--text); }\n.sab-btn small, .tower-btn small { display: block; font-size: 7px; color: var(--dim); }\n.sprite-icon { flex-shrink: 0; }\n\n#log-panel {\n  font-size: 7px; color: var(--dim); line-height: 2;\n  max-height: 130px; overflow-y: auto;\n  background: #0d0b16; border: 2px solid var(--line);\n  padding: 8px; margin-top: 12px;\n}\n\n.hidden { display: none !important; }\n\n#hint-bar {\n  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);\n  background: var(--red); color: #2a0509;\n  padding: 10px 18px; font-size: 9px;\n  opacity: 0; pointer-events: none; transition: opacity 0.2s, transform 0.2s;\n}\n#hint-bar.show { opacity: 1; transform: translateX(-50%) translateY(0); }\n\n/* --- Ende --- */\n#ended-ranking { background: var(--panel); border: 2px solid var(--line); padding: 16px; margin-bottom: 14px; }\n.rank-row {\n  display: flex; justify-content: space-between;\n  padding: 12px 8px; border-bottom: 1px solid var(--line); font-size: 10px;\n}\n.rank-row.winner { color: var(--gold); text-shadow: 2px 2px 0 #6b4a10; }\n\n@media (max-width: 900px) {\n  #match-layout { flex-direction: column; }\n  #sidebar { width: 100%; }\n}\n" },
  "/client.js": { type: "text/javascript; charset=utf-8", body: "// Tower Draft Siege — Client (Canvas-Rendering + DOM-UI)\nimport { BoardRenderer } from './render.js';\nimport { towerSprite, monsterSprite } from './sprites.js';\n\nconst TOWER_INFO = {\n  gatling: { label: 'Gatling', cost: 50, tier1Cost: 60, tier2Cost: 120,\n    tier1: { minigun: 'Minigun', flak: 'Flak' }, tier2: { railgun: 'Railgun', chainLightning: 'Chain Lightning' } },\n  cannon: { label: 'Kanone', cost: 70, tier1Cost: 80, tier2Cost: 150,\n    tier1: { siegeMortar: 'Siege-Mörser', clusterBomb: 'Cluster-Bombe' }, tier2: { orbitalStrike: 'Orbital-Strike', napalm: 'Napalm' } },\n  sniper: { label: 'Frost-Sniper', cost: 65, tier1Cost: 75, tier2Cost: 140,\n    tier1: { deepFreeze: 'Deep-Freeze', piercingShot: 'Piercing-Shot' }, tier2: { cryoField: 'Cryo-Field', executioner: 'Executioner' } },\n  support: { label: 'Support', cost: 55, tier1Cost: 65, tier2Cost: 130,\n    tier1: { detectorFocus: 'Detektor-Fokus', boosterFocus: 'Booster-Fokus' }, tier2: { wideNet: 'Weites Netz', overclock: 'Overclock' } }\n};\n\nconst SABOTEUR_INFO = {\n  swarmRunner: { label: 'Swarm-Runner', cost: 20, hint: 'viele, schnell' },\n  panzerBrute: { label: 'Panzer-Brute', cost: 80, hint: 'tanky' },\n  stealthRunner: { label: 'Stealth-Läufer', cost: 60, hint: 'unsichtbar' },\n  saboteur: { label: 'Saboteur', cost: 50, hint: 'legt Türme lahm' },\n  splitter: { label: 'Splitter', cost: 45, hint: 'teilt sich' },\n  goldCarrier: { label: 'Golden Carrier', cost: 90, hint: 'Bonusgold' }\n};\n\nconst COMMANDER_INFO = {\n  vanguard: { label: 'Vanguard', desc: '+20% max. Basis-HP. Aktiv: Notreparatur.' },\n  financier: { label: 'Financier', desc: '+50% Zinsen. Aktiv: Gold Surge (+40).' },\n  warlord: { label: 'Warlord', desc: 'Sabotage-Einheiten +10% HP. Aktiv: nächste Sabotage gratis.' },\n  engineer: { label: 'Engineer', desc: 'Turmkosten -10%. Aktiv: Rapid Deploy (+50% Feuerrate, 8s).' }\n};\n\nlet ws = null;\nlet myId = null;\nlet myName = '';\nlet selectedCommander = null;\nlet selectedRelic = null;\nlet selectedTargetId = null;\nlet openBuildSlot = null;\nlet openUpgradeTowerId = null;\nlet lastState = null;\n\nlet ownRenderer = null;\nconst miniRenderers = new Map(); // playerId -> { renderer, wrapper }\n\nfunction $(id) { return document.getElementById(id); }\nfunction showScreen(id) {\n  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));\n  $(id).classList.add('active');\n}\n\n// Sprite als <img>-artiges Icon für Menüs\nfunction spriteIcon(canvas, cssSize) {\n  const img = document.createElement('canvas');\n  img.width = canvas.width; img.height = canvas.height;\n  img.getContext('2d').drawImage(canvas, 0, 0);\n  img.className = 'sprite-icon';\n  img.style.width = cssSize + 'px';\n  img.style.height = cssSize + 'px';\n  return img;\n}\n\nlet heartbeatTimer = null;\n\nfunction connect() {\n  const proto = location.protocol === 'https:' ? 'wss' : 'ws';\n  ws = new WebSocket(`${proto}://${location.host}`);\n  ws.addEventListener('open', () => {\n    // Heartbeat: verhindert, dass der Render-Free-Dienst wegen Inaktivität einschläft\n    clearInterval(heartbeatTimer);\n    heartbeatTimer = setInterval(() => sendMsg('ping'), 25000);\n  });\n  ws.addEventListener('message', (ev) => {\n    const { type, payload } = JSON.parse(ev.data);\n    handleMessage(type, payload);\n  });\n  ws.addEventListener('close', () => {\n    clearInterval(heartbeatTimer);\n    const el = $('menu-error');\n    if (el) el.textContent = 'Verbindung zum Server getrennt.';\n  });\n  return ws;\n}\n\nfunction sendMsg(type, payload = {}) {\n  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, payload }));\n}\n\nfunction handleMessage(type, payload) {\n  if (type === 'roomCreated' || type === 'roomJoined') {\n    myId = payload.playerId;\n    $('lobby-code').textContent = payload.code;\n    showScreen('screen-lobby');\n  } else if (type === 'lobby') {\n    renderLobby(payload);\n  } else if (type === 'error') {\n    $('menu-error').textContent = payload.message;\n  } else if (type === 'actionError') {\n    flashHint(payload.message);\n  } else if (type === 'state') {\n    const prevPhase = lastState?.phase;\n    lastState = payload;\n    if (payload.phase !== prevPhase) {\n      if (payload.phase === 'relicDraft') showScreen('screen-draft');\n      else if (payload.phase === 'playing') { showScreen('screen-match'); setupBoards(payload); }\n      else if (payload.phase === 'ended') showScreen('screen-ended');\n    }\n    if (payload.phase === 'relicDraft') renderDraft(payload);\n    else if (payload.phase === 'playing') syncMatch(payload);\n    else if (payload.phase === 'ended') renderEnded(payload);\n  }\n}\n\nconst HINTS = {\n  no_gold: 'Nicht genug Gold.',\n  slot_taken: 'Platz ist belegt.',\n  max_tier: 'Turm ist voll ausgebaut.',\n  max_extensions: 'Pfad kann nicht weiter verlängert werden.',\n  on_cooldown: 'Fähigkeit lädt noch.',\n  self_target: 'Du kannst dich nicht selbst angreifen.'\n};\nlet hintTimer = null;\nfunction flashHint(code) {\n  const el = $('hint-bar');\n  if (!el) return;\n  el.textContent = HINTS[code] || code;\n  el.classList.add('show');\n  clearTimeout(hintTimer);\n  hintTimer = setTimeout(() => el.classList.remove('show'), 1600);\n}\n\nfunction renderLobby(payload) {\n  $('lobby-code').textContent = payload.code;\n  const ul = $('lobby-players');\n  ul.innerHTML = '';\n  payload.players.forEach(p => {\n    const li = document.createElement('li');\n    li.textContent = p.name + (p.id === myId ? ' (du)' : '');\n    ul.appendChild(li);\n  });\n  $('btn-start').disabled = payload.players.length < 2;\n  $('lobby-hint').textContent = payload.players.length < 2\n    ? 'Warte auf mindestens einen Mitspieler…'\n    : `${payload.players.length}/${payload.maxPlayers} Spieler bereit.`;\n}\n\n// ---------- Draft ----------\n\nfunction renderDraft(state) {\n  const me = state.players.find(p => p.id === myId);\n  if (!me) return;\n\n  const cWrap = $('commander-options');\n  if (cWrap.childElementCount === 0 || cWrap.dataset.sel !== selectedCommander) {\n    cWrap.dataset.sel = selectedCommander || '';\n    cWrap.innerHTML = '';\n    Object.entries(COMMANDER_INFO).forEach(([key, info]) => {\n      const div = document.createElement('div');\n      div.className = 'option-card' + (selectedCommander === key ? ' selected' : '');\n      div.innerHTML = `<h4>${info.label}</h4><p>${info.desc}</p>`;\n      div.onclick = () => {\n        selectedCommander = key;\n        sendMsg('chooseCommander', { commanderKey: key });\n        renderDraft(lastState);\n      };\n      cWrap.appendChild(div);\n    });\n  }\n\n  const rWrap = $('relic-options');\n  if (rWrap.childElementCount === 0 || rWrap.dataset.sel !== selectedRelic) {\n    rWrap.dataset.sel = selectedRelic || '';\n    rWrap.innerHTML = '';\n    me.relicChoices.forEach(r => {\n      const div = document.createElement('div');\n      div.className = 'option-card' + (selectedRelic === r.key ? ' selected' : '');\n      div.innerHTML = `<h4>${r.label}</h4><p>${r.desc}</p>`;\n      div.onclick = () => {\n        selectedRelic = r.key;\n        sendMsg('chooseRelic', { relicKey: r.key });\n        renderDraft(lastState);\n      };\n      rWrap.appendChild(div);\n    });\n  }\n\n  const readyCount = state.players.filter(p => p.ready).length;\n  $('draft-status').textContent = `${readyCount}/${state.players.length} bereit — Start automatisch nach 20s.`;\n}\n\n// ---------- Match: Canvas-Boards aufsetzen ----------\n\nfunction setupBoards(state) {\n  const me = state.players.find(p => p.id === myId);\n  const others = state.players.filter(p => p.id !== myId);\n  if (!selectedTargetId && others.length) selectedTargetId = others[0].id;\n\n  const ownWrap = $('own-board-container');\n  ownWrap.innerHTML = '';\n  const ownCanvas = document.createElement('canvas');\n  ownCanvas.className = 'board-canvas';\n  const ownPanel = boardPanel(me, ownCanvas, true);\n  ownWrap.appendChild(ownPanel);\n  ownRenderer = new BoardRenderer(ownCanvas, { scale: 2, numSlots: state.numSlots });\n\n  ownCanvas.addEventListener('click', (ev) => {\n    const slot = ownRenderer.slotAt(ev.clientX, ev.clientY);\n    if (slot === null) return;\n    const meNow = lastState.players.find(p => p.id === myId);\n    const tower = meNow.towers.find(t => t.slot === slot);\n    if (tower) { openUpgradeTowerId = tower.id; openBuildSlot = null; }\n    else { openBuildSlot = slot; openUpgradeTowerId = null; }\n    renderSidebar(lastState);\n  });\n\n  const otherWrap = $('other-boards');\n  otherWrap.innerHTML = '';\n  miniRenderers.clear();\n  others.forEach(p => {\n    const canvas = document.createElement('canvas');\n    canvas.className = 'board-canvas';\n    const panel = boardPanel(p, canvas, false);\n    panel.classList.add('mini');\n    panel.onclick = () => { selectedTargetId = p.id; renderSidebar(lastState); updateBoardChrome(lastState); };\n    otherWrap.appendChild(panel);\n    miniRenderers.set(p.id, { renderer: new BoardRenderer(canvas, { scale: 1, numSlots: state.numSlots }), panel });\n  });\n\n  renderSidebar(state);\n}\n\nfunction boardPanel(player, canvas, isOwn) {\n  const panel = document.createElement('div');\n  panel.className = 'board-panel' + (isOwn ? ' own' : '');\n  panel.dataset.pid = player.id;\n  panel.innerHTML = `\n    <div class=\"board-head\">\n      <span class=\"pname\">${player.name}${isOwn ? ' (du)' : ''}</span>\n      <span class=\"pstats\"><span class=\"hp\">${player.baseHP}</span> HP · <span class=\"gold\">${player.gold}</span> G</span>\n    </div>\n    <div class=\"hp-bar-outer\"><div class=\"hp-bar-inner\"></div></div>\n  `;\n  panel.appendChild(canvas);\n  const badge = document.createElement('div');\n  badge.className = 'target-badge';\n  badge.textContent = 'ZIEL';\n  panel.appendChild(badge);\n  return panel;\n}\n\n// ---------- Match: pro Server-Tick ----------\n\nfunction syncMatch(state) {\n  const me = state.players.find(p => p.id === myId);\n  if (!me || !ownRenderer) return;\n\n  ownRenderer.setState(me, state);\n  for (const p of state.players) {\n    if (p.id === myId) continue;\n    const entry = miniRenderers.get(p.id);\n    if (entry) entry.renderer.setState(p, state);\n  }\n\n  const remainingMs = Math.max(0, state.matchDurationMs - state.elapsedMs);\n  const mins = Math.floor(remainingMs / 60000);\n  const secs = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');\n  $('match-timer').textContent = `${mins}:${secs}`;\n  $('match-timer').classList.toggle('urgent', remainingMs < 60000);\n  $('match-wave').textContent = `Welle ${state.waveIndex}`;\n  const evEl = $('match-event');\n  evEl.textContent = state.activeEvent ? `⚡ ${state.activeEvent.label}: ${state.activeEvent.desc}` : '';\n  evEl.classList.toggle('active', !!state.activeEvent);\n\n  updateBoardChrome(state);\n  renderSidebar(state);\n  $('log-panel').innerHTML = state.log.map(l => `<div>${l.msg}</div>`).join('');\n}\n\nfunction updateBoardChrome(state) {\n  for (const p of state.players) {\n    const panel = document.querySelector(`.board-panel[data-pid=\"${p.id}\"]`);\n    if (!panel) continue;\n    panel.querySelector('.hp').textContent = p.baseHP;\n    panel.querySelector('.gold').textContent = p.gold;\n    const frac = Math.max(0, p.baseHP / p.maxBaseHP);\n    const bar = panel.querySelector('.hp-bar-inner');\n    bar.style.width = `${frac * 100}%`;\n    bar.style.background = frac > 0.5 ? '#58c46a' : frac > 0.25 ? '#ffd27a' : '#ff4d4d';\n    panel.classList.toggle('eliminated', p.eliminated);\n    panel.classList.toggle('is-target', p.id === selectedTargetId && p.id !== myId);\n  }\n}\n\nfunction renderSidebar(state) {\n  const me = state.players.find(p => p.id === myId);\n  const others = state.players.filter(p => p.id !== myId);\n  if (!me) return;\n\n  $('hud-gold').innerHTML = `<span class=\"big-gold\">${me.gold}</span> Gold`;\n  $('hud-bounty').textContent = me.bounty ? `${me.bounty.label}: ${me.bounty.desc}` : '';\n\n  const cmdInfo = COMMANDER_INFO[me.commander];\n  const cdSec = Math.ceil(me.commanderCooldownRemaining / 1000);\n  $('commander-panel').innerHTML = cmdInfo\n    ? `<button id=\"btn-commander-ability\" class=\"big-btn\" ${me.commanderCooldownRemaining > 0 ? 'disabled' : ''}>\n         ${cmdInfo.label}${me.commanderCooldownRemaining > 0 ? ` — ${cdSec}s` : ' — BEREIT'}\n       </button>` : '';\n  const cmdBtn = $('btn-commander-ability');\n  if (cmdBtn) cmdBtn.onclick = () => sendMsg('useCommanderAbility');\n\n  const ptBtn = $('btn-pathtile');\n  ptBtn.disabled = me.pathExtensions >= 5;\n  ptBtn.textContent = `Pfad verlängern (${40 * (me.pathExtensions + 1)}G)`;\n  ptBtn.onclick = () => sendMsg('buyPathTile');\n\n  $('sabotage-target-name').textContent = others.find(p => p.id === selectedTargetId)?.name || '—';\n  const sabWrap = $('sabotage-buttons');\n  sabWrap.innerHTML = '';\n  Object.entries(SABOTEUR_INFO).forEach(([key, info]) => {\n    const btn = document.createElement('button');\n    btn.className = 'sab-btn';\n    btn.appendChild(spriteIcon(monsterSprite(key, 2), 24));\n    const txt = document.createElement('span');\n    txt.innerHTML = `<b>${info.label}</b><small>${info.hint} · ${info.cost}G</small>`;\n    btn.appendChild(txt);\n    btn.disabled = !selectedTargetId || me.gold < info.cost;\n    btn.onclick = () => sendMsg('buySabotage', { targetId: selectedTargetId, unitType: key });\n    sabWrap.appendChild(btn);\n  });\n\n  renderBuildMenu(me);\n  renderUpgradeMenu(me);\n}\n\nfunction renderBuildMenu(me) {\n  const wrap = $('build-menu');\n  if (openBuildSlot === null) { wrap.classList.add('hidden'); wrap.innerHTML = ''; return; }\n  wrap.classList.remove('hidden');\n  wrap.innerHTML = `<h4>Turm bauen — Platz ${openBuildSlot + 1}</h4>`;\n  Object.entries(TOWER_INFO).forEach(([key, info]) => {\n    const btn = document.createElement('button');\n    btn.className = 'tower-btn';\n    btn.appendChild(spriteIcon(towerSprite(key, 2), 32));\n    const txt = document.createElement('span');\n    txt.innerHTML = `<b>${info.label}</b><small>${info.cost}G</small>`;\n    btn.appendChild(txt);\n    btn.disabled = me.gold < info.cost;\n    btn.onclick = () => { sendMsg('buildTower', { slot: openBuildSlot, towerType: key }); openBuildSlot = null; renderSidebar(lastState); };\n    wrap.appendChild(btn);\n  });\n  const close = document.createElement('button');\n  close.textContent = 'Abbrechen';\n  close.className = 'ghost-btn';\n  close.onclick = () => { openBuildSlot = null; renderSidebar(lastState); };\n  wrap.appendChild(close);\n}\n\nfunction renderUpgradeMenu(me) {\n  const wrap = $('upgrade-menu');\n  if (!openUpgradeTowerId) { wrap.classList.add('hidden'); wrap.innerHTML = ''; return; }\n  const tower = me.towers.find(t => t.id === openUpgradeTowerId);\n  if (!tower) { wrap.classList.add('hidden'); return; }\n  wrap.classList.remove('hidden');\n  const info = TOWER_INFO[tower.type];\n  wrap.innerHTML = '';\n  const head = document.createElement('h4');\n  head.textContent = `${info.label} — Stufe ${tower.tier}`;\n  wrap.appendChild(head);\n\n  const branches = tower.tier === 0 ? info.tier1 : tower.tier === 1 ? info.tier2 : null;\n  const cost = tower.tier === 0 ? info.tier1Cost : info.tier2Cost;\n\n  if (!branches) {\n    const p = document.createElement('p');\n    p.textContent = 'Voll ausgebaut.';\n    wrap.appendChild(p);\n  } else {\n    Object.entries(branches).forEach(([key, label]) => {\n      const btn = document.createElement('button');\n      btn.className = 'tower-btn';\n      btn.innerHTML = `<span><b>${label}</b><small>${cost}G</small></span>`;\n      btn.disabled = me.gold < cost;\n      btn.onclick = () => { sendMsg('upgradeTower', { towerId: tower.id, branchKey: key }); openUpgradeTowerId = null; renderSidebar(lastState); };\n      wrap.appendChild(btn);\n    });\n  }\n  const close = document.createElement('button');\n  close.textContent = 'Schließen';\n  close.className = 'ghost-btn';\n  close.onclick = () => { openUpgradeTowerId = null; renderSidebar(lastState); };\n  wrap.appendChild(close);\n}\n\nfunction renderEnded(state) {\n  const wrap = $('ended-ranking');\n  wrap.innerHTML = '';\n  (state.finalRanking || []).forEach((p, i) => {\n    const row = document.createElement('div');\n    row.className = 'rank-row' + (p.id === state.winnerId ? ' winner' : '');\n    row.innerHTML = `<span>${i + 1}. ${p.name}</span><span>${p.baseHP} HP · ${p.gold} G${p.eliminated ? ' · raus' : ''}</span>`;\n    wrap.appendChild(row);\n  });\n}\n\n// ---------- Render-Loop ----------\n\nlet lastFrame = performance.now();\nfunction loop(now) {\n  const dt = Math.min(100, now - lastFrame);\n  lastFrame = now;\n  if (ownRenderer) { ownRenderer.update(dt); ownRenderer.render(); }\n  for (const { renderer } of miniRenderers.values()) { renderer.update(dt); renderer.render(); }\n  requestAnimationFrame(loop);\n}\nrequestAnimationFrame(loop);\n\n// ---------- Menü ----------\n\n$('btn-create').addEventListener('click', () => {\n  myName = $('input-name').value.trim() || 'Spieler';\n  const maxPlayers = parseInt($('select-maxplayers').value, 10);\n  const sock = connect();\n  sock.addEventListener('open', () => sendMsg('createRoom', { name: myName, maxPlayers }), { once: true });\n});\n\n$('btn-join').addEventListener('click', () => {\n  myName = $('input-name').value.trim() || 'Spieler';\n  const code = $('input-code').value.trim().toUpperCase();\n  if (!code) { $('menu-error').textContent = 'Bitte Raumcode eingeben.'; return; }\n  const sock = connect();\n  sock.addEventListener('open', () => sendMsg('joinRoom', { name: myName, code }), { once: true });\n});\n\n$('btn-start').addEventListener('click', () => sendMsg('startMatch'));\n" },
  "/render.js": { type: "text/javascript; charset=utf-8", body: "// Canvas-Renderer: zeichnet ein Spielbrett als Pixel-Art-Szene.\n// Arbeitet in \"Basis-Koordinaten\" (384x64) und skaliert ganzzahlig hoch,\n// damit die Pixel scharf bleiben.\n\nimport { towerSprite, monsterSprite, tileSprite, baseSprite, tierMarkSprite } from './sprites.js';\n\nconst TILE = 16;\nconst TILES_X = 24;\nconst BASE_W = TILE * TILES_X;   // 384\nconst BASE_H = 64;\n\nconst ROW_GRASS_TOP = 0;\nconst ROW_TOWER = 16;\nconst ROW_PATH = 32;\nconst ROW_GRASS_BOT = 48;\n\nconst BASE_X = BASE_W - TILE;    // Position der Spielerbasis\nconst TRACK_END = BASE_X;        // Monster laufen von 0 bis hierhin\n\nexport class BoardRenderer {\n  constructor(canvas, { scale = 2, numSlots = 6 } = {}) {\n    this.canvas = canvas;\n    this.scale = scale;\n    this.numSlots = numSlots;\n    canvas.width = BASE_W * scale;\n    canvas.height = BASE_H * scale;\n    canvas.style.width = `${BASE_W * scale}px`;\n    canvas.style.height = `${BASE_H * scale}px`;\n    this.ctx = canvas.getContext('2d');\n    this.ctx.imageSmoothingEnabled = false;\n\n    this.player = null;\n    this.numSlotsFromState = numSlots;\n    this.effects = [];\n    this.renderPos = new Map();   // monsterId -> interpolierte x-Position (Basis-Koordinaten)\n    this.prevMonsters = new Map();\n    this.time = 0;\n    this.shake = 0;\n  }\n\n  slotX(i) {\n    return ((i + 0.5) / this.numSlotsFromState) * TRACK_END - TILE / 2;\n  }\n\n  monsterX(m, pathLength) {\n    return Math.max(0, Math.min(TRACK_END, (m.pos / pathLength) * TRACK_END));\n  }\n\n  // Neuen Serverzustand übernehmen und daraus Effekte ableiten\n  setState(player, state) {\n    this.numSlotsFromState = state.numSlots || this.numSlots;\n    const prevBaseHP = this.player ? this.player.baseHP : player.baseHP;\n    this.player = player;\n\n    const nextMap = new Map();\n    for (const m of player.monsters) {\n      const x = this.monsterX(m, player.pathLength);\n      nextMap.set(m.id, { hp: m.hp, x, subtype: m.subtype, isSabotage: m.isSabotage });\n\n      if (!this.renderPos.has(m.id)) this.renderPos.set(m.id, x);\n\n      const prev = this.prevMonsters.get(m.id);\n      if (prev && m.hp < prev.hp) {\n        // Treffer: Funken + Tracer vom nächstgelegenen Turm\n        this.addHit(x, ROW_PATH + 6);\n        const tower = this.nearestTower(x);\n        if (tower) this.addTracer(tower.x + TILE / 2, ROW_TOWER + 8, x + 6, ROW_PATH + 6, tower.type);\n      }\n    }\n\n    // Tode erkennen\n    for (const [id, prev] of this.prevMonsters) {\n      if (!nextMap.has(id)) {\n        if (prev.x < TRACK_END - 4) this.addDeath(prev.x, ROW_PATH + 4, prev.isSabotage);\n        this.renderPos.delete(id);\n      }\n    }\n\n    // Basisschaden -> Screenshake\n    if (player.baseHP < prevBaseHP) {\n      this.shake = Math.min(6, this.shake + 3);\n      this.addLeak(BASE_X, ROW_PATH);\n    }\n\n    this.prevMonsters = nextMap;\n  }\n\n  nearestTower(x) {\n    if (!this.player) return null;\n    let best = null, bestD = Infinity;\n    for (const t of this.player.towers) {\n      if (t.type === 'support') continue;\n      const tx = this.slotX(t.slot);\n      const d = Math.abs(tx + TILE / 2 - x);\n      if (d < bestD) { bestD = d; best = { x: tx, type: t.type }; }\n    }\n    return best;\n  }\n\n  addTracer(x1, y1, x2, y2, towerType) {\n    const color = { gatling: '#bfeaff', cannon: '#ffd0a8', sniper: '#e8c0ff', support: '#c2f5d2' }[towerType] || '#ffffff';\n    this.effects.push({ type: 'tracer', x1, y1, x2, y2, color, ttl: 90, maxTtl: 90 });\n  }\n\n  addHit(x, y) {\n    for (let i = 0; i < 4; i++) {\n      this.effects.push({\n        type: 'spark', x: x + 6, y,\n        vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30 - 10,\n        ttl: 260, maxTtl: 260, color: Math.random() < 0.5 ? '#ffd27a' : '#ffffff'\n      });\n    }\n  }\n\n  addDeath(x, y, isSabotage) {\n    const colors = isSabotage ? ['#b06bff', '#dfc0ff', '#ffffff'] : ['#6ec46a', '#a8e6a0', '#ffffff'];\n    for (let i = 0; i < 9; i++) {\n      this.effects.push({\n        type: 'spark', x: x + 6, y: y + 4,\n        vx: (Math.random() - 0.5) * 55, vy: -Math.random() * 45 - 5,\n        ttl: 420, maxTtl: 420, color: colors[i % colors.length]\n      });\n    }\n    this.effects.push({ type: 'ring', x: x + 6, y: y + 6, ttl: 260, maxTtl: 260, color: colors[0] });\n  }\n\n  addLeak(x, y) {\n    for (let i = 0; i < 10; i++) {\n      this.effects.push({\n        type: 'spark', x: x + 8, y: y + 8,\n        vx: (Math.random() - 0.5) * 70, vy: -Math.random() * 55,\n        ttl: 400, maxTtl: 400, color: i % 2 ? '#ff4d4d' : '#ffd27a'\n      });\n    }\n  }\n\n  update(dt) {\n    this.time += dt;\n    const dtS = dt / 1000;\n\n    // Monsterpositionen weich nachziehen (Server tickt nur alle 150ms)\n    if (this.player) {\n      for (const m of this.player.monsters) {\n        const target = this.monsterX(m, this.player.pathLength);\n        const cur = this.renderPos.get(m.id);\n        if (cur === undefined) this.renderPos.set(m.id, target);\n        else this.renderPos.set(m.id, cur + (target - cur) * Math.min(1, dtS * 12));\n      }\n    }\n\n    for (const e of this.effects) {\n      e.ttl -= dt;\n      if (e.type === 'spark') {\n        e.x += e.vx * dtS;\n        e.y += e.vy * dtS;\n        e.vy += 90 * dtS;\n      }\n    }\n    this.effects = this.effects.filter(e => e.ttl > 0);\n    if (this.shake > 0) this.shake = Math.max(0, this.shake - dtS * 14);\n  }\n\n  render() {\n    const ctx = this.ctx;\n    const s = this.scale;\n    ctx.save();\n    ctx.setTransform(1, 0, 0, 1, 0, 0);\n    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);\n\n    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;\n    const sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;\n    ctx.setTransform(s, 0, 0, s, sx, sy);\n    ctx.imageSmoothingEnabled = false;\n\n    this.drawTerrain(ctx);\n    if (!this.player) { ctx.restore(); return; }\n\n    this.drawTowers(ctx);\n    this.drawMonsters(ctx);\n    this.drawBase(ctx);\n    this.drawEffects(ctx);\n\n    if (this.player.eliminated) {\n      ctx.fillStyle = 'rgba(10,8,14,0.6)';\n      ctx.fillRect(0, 0, BASE_W, BASE_H);\n    }\n\n    ctx.restore();\n  }\n\n  drawTerrain(ctx) {\n    const grass = tileSprite('grass', 1);\n    const path = tileSprite('path', 1);\n    for (let x = 0; x < TILES_X; x++) {\n      ctx.drawImage(grass, x * TILE, ROW_GRASS_TOP);\n      ctx.drawImage(grass, x * TILE, ROW_TOWER);\n      ctx.drawImage(path, x * TILE, ROW_PATH);\n      ctx.drawImage(grass, x * TILE, ROW_GRASS_BOT);\n    }\n  }\n\n  drawTowers(ctx) {\n    const platform = tileSprite('platform', 1);\n    const mark = tierMarkSprite(1);\n    for (const t of this.player.towers) {\n      const x = this.slotX(t.slot);\n      ctx.globalAlpha = 0.55;\n      ctx.drawImage(platform, x, ROW_TOWER);\n      ctx.globalAlpha = 1;\n\n      if (t.disabled) {\n        // deaktivierter Turm blinkt und ist ausgegraut\n        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.time / 90);\n      }\n      ctx.drawImage(towerSprite(t.type, 1), x, ROW_TOWER);\n      ctx.globalAlpha = 1;\n\n      for (let i = 0; i < t.tier; i++) {\n        ctx.drawImage(mark, x + 2 + i * 5, ROW_TOWER - 5);\n      }\n    }\n  }\n\n  drawMonsters(ctx) {\n    // von hinten nach vorn, damit vordere Monster oben liegen\n    const sorted = [...this.player.monsters].sort((a, b) => a.pos - b.pos);\n    for (const m of sorted) {\n      const x = this.renderPos.get(m.id) ?? this.monsterX(m, this.player.pathLength);\n      const bob = Math.round(Math.sin((this.time / 130) + m.pos * 2)) ;\n      const y = ROW_PATH + 2 + bob;\n\n      ctx.globalAlpha = m.stealth ? 0.3 : 1;\n      ctx.drawImage(monsterSprite(m.subtype, 1), Math.round(x), y);\n      ctx.globalAlpha = 1;\n\n      // kleiner HP-Balken bei angeschlagenen/dicken Gegnern\n      if (m.hp < m.maxHp) {\n        const w = 10;\n        const frac = Math.max(0, m.hp / m.maxHp);\n        ctx.fillStyle = '#100e18';\n        ctx.fillRect(Math.round(x) + 1, y - 3, w + 2, 3);\n        ctx.fillStyle = frac > 0.5 ? '#58c46a' : frac > 0.25 ? '#ffd27a' : '#ff4d4d';\n        ctx.fillRect(Math.round(x) + 2, y - 2, Math.round(w * frac), 1);\n      }\n    }\n  }\n\n  drawBase(ctx) {\n    const frac = Math.max(0, this.player.baseHP / this.player.maxBaseHP);\n    // Basis pulsiert rot, wenn es kritisch wird\n    ctx.drawImage(baseSprite(1), BASE_X, ROW_PATH);\n    if (frac < 0.3) {\n      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(this.time / 140);\n      ctx.fillStyle = '#ff4d4d';\n      ctx.fillRect(BASE_X, ROW_PATH, TILE, TILE);\n      ctx.globalAlpha = 1;\n    }\n  }\n\n  drawEffects(ctx) {\n    for (const e of this.effects) {\n      const t = e.ttl / e.maxTtl;\n      if (e.type === 'tracer') {\n        ctx.globalAlpha = t;\n        ctx.strokeStyle = e.color;\n        ctx.lineWidth = 1;\n        ctx.beginPath();\n        ctx.moveTo(e.x1, e.y1);\n        ctx.lineTo(e.x2, e.y2);\n        ctx.stroke();\n        ctx.globalAlpha = 1;\n      } else if (e.type === 'spark') {\n        ctx.globalAlpha = Math.max(0, t);\n        ctx.fillStyle = e.color;\n        ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);\n        ctx.globalAlpha = 1;\n      } else if (e.type === 'ring') {\n        const r = (1 - t) * 7;\n        ctx.globalAlpha = Math.max(0, t * 0.8);\n        ctx.strokeStyle = e.color;\n        ctx.lineWidth = 1;\n        ctx.beginPath();\n        ctx.arc(e.x, e.y, r, 0, Math.PI * 2);\n        ctx.stroke();\n        ctx.globalAlpha = 1;\n      }\n    }\n  }\n\n  // Klick-Position (CSS-Pixel) -> Slot-Index, oder null\n  slotAt(clientX, clientY) {\n    const rect = this.canvas.getBoundingClientRect();\n    const x = (clientX - rect.left) / (rect.width / BASE_W);\n    const y = (clientY - rect.top) / (rect.height / BASE_H);\n    if (y < ROW_TOWER - 6 || y > ROW_PATH) return null;\n    for (let i = 0; i < this.numSlotsFromState; i++) {\n      const sxp = this.slotX(i);\n      if (x >= sxp - 2 && x <= sxp + TILE + 2) return i;\n    }\n    return null;\n  }\n}\n\nexport const BOARD_BASE_W = BASE_W;\nexport const BOARD_BASE_H = BASE_H;\n" },
  "/sprites.js": { type: "text/javascript; charset=utf-8", body: "// Pixel-Sprites als Code-Daten (16x16 bzw. 12x12), zur Laufzeit auf Offscreen-Canvases gemalt.\n// Format: { p: {zeichen: farbe}, d: [zeilen] }.  '.' = transparent.\n//\n// Externes Sprite-Sheet einhängen: siehe loadExternalSheet() am Ende der Datei.\n\nconst OUTLINE = '#100e18';\n\n// ---------- gemeinsame Paletten ----------\nconst METAL = { k: OUTLINE, d: '#39415c', m: '#5b6b8a', l: '#93a6c9' };\nconst pal = (extra) => ({ ...METAL, ...extra });\n\n// ---------- Türme (16x16) ----------\n\nexport const TOWER_SPRITES = {\n  gatling: {\n    p: pal({ c: '#7ad3ff', g: '#bfeaff' }),\n    d: [\n      '................',\n      '................',\n      '.....kkkkk......',\n      '....kdddddk.....',\n      '...kdmmmmmdk....',\n      '...kdmlllmdkkkk.',\n      '...kdmlglmdccck.',\n      '...kdmlllmdkkkk.',\n      '...kdmmmmmdk....',\n      '....kdddddk.....',\n      '.....kkkkk......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  },\n  cannon: {\n    p: pal({ c: '#ff9d5c', g: '#ffd0a8' }),\n    d: [\n      '................',\n      '................',\n      '....kkkkkk......',\n      '...kddddddk.....',\n      '..kdmmmmmmdkkkk.',\n      '..kdmlllllmdcck.',\n      '..kdmlgglllmdcck',\n      '..kdmlllllmdcck.',\n      '..kdmmmmmmdkkkk.',\n      '...kddddddk.....',\n      '....kkkkkk......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  },\n  sniper: {\n    p: pal({ c: '#c96bff', g: '#e8c0ff' }),\n    d: [\n      '................',\n      '................',\n      '.....kkkk.......',\n      '....kddddk......',\n      '....kdmmdk......',\n      '....kdmldkkkkkk.',\n      '....kdmgdcccccck',\n      '....kdmldkkkkkk.',\n      '....kdmmdk......',\n      '....kddddk......',\n      '.....kkkk.......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  },\n  support: {\n    p: pal({ c: '#6ddc8b', g: '#c2f5d2' }),\n    d: [\n      '................',\n      '.......kk.......',\n      '......kcck......',\n      '.....kcggck.....',\n      '....kcgkkgck....',\n      '....kcgkkgck....',\n      '.....kcggck.....',\n      '......kcck......',\n      '.......kk.......',\n      '.......kk.......',\n      '......kddk......',\n      '..kkkkkkkkkkk...',\n      '.kdddddddddddk..',\n      '.kdmmmmmmmmmmdk.',\n      '.kddddddddddddk.',\n      '..kkkkkkkkkkkk..'\n    ]\n  }\n};\n\n// Tier-Marker (kleine Chevrons, die über dem Turm eingeblendet werden)\nexport const TIER_MARK = {\n  p: { k: OUTLINE, y: '#ffd27a' },\n  d: [\n    '....',\n    '.yy.',\n    'y..y',\n    '.kk.'\n  ]\n};\n\n// ---------- Monster & Sabotage-Einheiten (12x12) ----------\n\nexport const MONSTER_SPRITES = {\n  grunt: {\n    p: { k: OUTLINE, a: '#2f6b33', b: '#6ec46a', c: '#a8e6a0', e: '#ffffff', r: '#ff4d4d' },\n    d: [\n      '............',\n      '....kkkk....',\n      '..kkbbbbkk..',\n      '..kbccccbk..',\n      '.kbcekkecbk.',\n      '.kbcekkecbk.',\n      '.kbccccccbk.',\n      '.kabbbbbbak.',\n      '..kaakkaak..',\n      '...kk..kk...',\n      '............',\n      '............'\n    ]\n  },\n  elite: {\n    p: { k: OUTLINE, a: '#a33a1c', b: '#ff7a4d', c: '#ffb08a', e: '#ffffff', r: '#ffd27a' },\n    d: [\n      '..k......k..',\n      '..kk....kk..',\n      '..kbkkkkbk..',\n      '.kkbbbbbbkk.',\n      '.kbccccccbk.',\n      'kbcekkkkecbk',\n      'kbcekkkkecbk',\n      'kbcccccccbk.',\n      '.kabbbbbbak.',\n      '.kkaakkaakk.',\n      '..kk....kk..',\n      '............'\n    ]\n  },\n  bonus: {\n    p: { k: OUTLINE, a: '#7a5a2a', b: '#c9a24d', c: '#f0d68f', e: '#ffffff' },\n    d: [\n      '............',\n      '....kkkk....',\n      '..kkbbbbkk..',\n      '..kbccccbk..',\n      '.kbcekkecbk.',\n      '.kbcekkecbk.',\n      '.kbccccccbk.',\n      '.kabbbbbbak.',\n      '..kaakkaak..',\n      '...kk..kk...',\n      '............',\n      '............'\n    ]\n  },\n  swarmRunner: {\n    p: { k: OUTLINE, a: '#6a2fa0', b: '#b06bff', c: '#dfc0ff', e: '#ffffff' },\n    d: [\n      '............',\n      '............',\n      '.....kk.....',\n      '....kbbk....',\n      '...kbccbk...',\n      '..kbcekecbk.',\n      '..kbccccbk..',\n      '...kabbak...',\n      '..k.kkkk.k..',\n      '.k...kk...k.',\n      '............',\n      '............'\n    ]\n  },\n  panzerBrute: {\n    p: { k: OUTLINE, a: '#4a1f75', b: '#8a4fd0', c: '#c9a0f5', e: '#ff4d4d', s: '#5b6b8a' },\n    d: [\n      '.kkkkkkkkkk.',\n      'kssssssssssk',\n      'kskbbbbbbksk',\n      'kskbccccbksk',\n      'kkbcekkecbkk',\n      'kkbcekkecbkk',\n      'kskbccccbksk',\n      'kskbbbbbbksk',\n      'kssssssssssk',\n      '.kkaakkaakk.',\n      '..kk....kk..',\n      '............'\n    ]\n  },\n  stealthRunner: {\n    p: { k: '#2a1a3a', a: '#5a3a8a', b: '#8f6bd0', c: '#c0a8e8', e: '#7ad3ff' },\n    d: [\n      '............',\n      '....kkkk....',\n      '...kbbbbk...',\n      '..kbccccbk..',\n      '..kbekkebk..',\n      '..kbccccbk..',\n      '..kabbbbak..',\n      '...kaaaak...',\n      '..k.a..a.k..',\n      '.k..a..a..k.',\n      '............',\n      '............'\n    ]\n  },\n  saboteur: {\n    p: { k: OUTLINE, a: '#8a5a1a', b: '#e0a83a', c: '#ffe08a', e: '#ffffff', s: '#93a6c9' },\n    d: [\n      '............',\n      '.....kk.....',\n      '....kbbk....',\n      '...kbccbk...',\n      '..kbcekecbk.',\n      '..kbccccbk..',\n      '.kssabbaskk.',\n      '.ksk.aa.ksk.',\n      '..k..kk..k..',\n      '.....kk.....',\n      '............',\n      '............'\n    ]\n  },\n  splitter: {\n    p: { k: OUTLINE, a: '#2a6a5a', b: '#4fc9a0', c: '#a8f0d8', e: '#ffffff' },\n    d: [\n      '............',\n      '...kkkkkk...',\n      '..kbbkkbbk..',\n      '.kbcckkccbk.',\n      '.kbcekkecbk.',\n      '.kbcckkccbk.',\n      '.kbcckkccbk.',\n      '.kabbkkbbak.',\n      '..kaakkaak..',\n      '...kk..kk...',\n      '............',\n      '............'\n    ]\n  },\n  goldCarrier: {\n    p: { k: OUTLINE, a: '#7a5a1a', b: '#d4a72c', c: '#ffd27a', e: '#ffffff', g: '#fff3c4' },\n    d: [\n      '............',\n      '...kkkk.....',\n      '..kbbbbk....',\n      '..kbccbk.kk.',\n      '.kbcekcbkggk',\n      '.kbccccbkggk',\n      '.kabbbbakgk.',\n      '..kaaaak.k..',\n      '..kk..kk....',\n      '.k......k...',\n      '............',\n      '............'\n    ]\n  }\n};\n\n// ---------- Terrain & Deko (16x16) ----------\n\nexport const TILE_SPRITES = {\n  grass: {\n    p: { a: '#3c6639', b: '#4a7c46', c: '#578a51' },\n    d: [\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbcbbbbbbbbab',\n      'bbabbbbbbbcbbbbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbbbabbbbbbcb',\n      'bcbbbbbbbbbbbbbb',\n      'bbbbbbbbbbabbbbb',\n      'bbbbbcbbbbbbbbbb',\n      'bbbbbbbbbbbbbcbb',\n      'babbbbbbbcbbbbbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbcbbbbbbbabbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbbbabbbbbbbb',\n      'bcbbbbbbbbbbcbbb',\n      'bbbbbbbbbbbbbbbb'\n    ]\n  },\n  path: {\n    p: { a: '#6f5436', b: '#8a6a44', c: '#a98455', d: '#c2a074' },\n    d: [\n      'aaaaaaaaaaaaaaaa',\n      'bbbbbbbbbbbbbbbb',\n      'bcbbbbbdbbbbbbcb',\n      'bbbbcbbbbbbdbbbb',\n      'cbbbbbbbbcbbbbbb',\n      'bbbdbbbbbbbbbcbb',\n      'bbbbbbcbbbbbbbbb',\n      'bbcbbbbbbbdbbbbb',\n      'bbbbbbbbcbbbbbbb',\n      'bdbbbbcbbbbbbbdb',\n      'bbbbbbbbbbcbbbbb',\n      'bbbbcbbbbbbbbbbb',\n      'cbbbbbbdbbbbbcbb',\n      'bbbbbbbbbbbbbbbb',\n      'bbbbbbbbbbbbbbbb',\n      'aaaaaaaaaaaaaaaa'\n    ]\n  },\n  platform: {\n    p: { k: OUTLINE, a: '#2b3145', b: '#39415c', c: '#4d566f' },\n    d: [\n      'kkkkkkkkkkkkkkkk',\n      'kccccccccccccc.k',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kcbbbbbbbbbbbbak',\n      'kaaaaaaaaaaaaaak',\n      'kkkkkkkkkkkkkkkk'\n    ]\n  }\n};\n\n// Basis / Kern am Ende der Strecke (16x16)\nexport const BASE_SPRITE = {\n  p: { k: OUTLINE, a: '#39415c', b: '#5b6b8a', c: '#93a6c9', g: '#7ad3ff', y: '#bfeaff' },\n  d: [\n    '..kk........kk..',\n    '.kcck......kcck.',\n    '.kbbk.kkkk.kbbk.',\n    '.kbbkkcccckkbbk.',\n    '.kbbbcbbbbcbbbk.',\n    '.kbbcbggggbcbbk.',\n    '.kabcbgyygbcbak.',\n    '.kabcbgyygbcbak.',\n    '.kabcbggggbcbak.',\n    '.kabbcbbbbcbbak.',\n    '.kaabbccccbbaak.',\n    '.kaaaaabbaaaaak.',\n    '.kaaaaabbaaaaak.',\n    '.kkaaaabbaaaakk.',\n    '..kkkkkkkkkkkk..',\n    '................'\n  ]\n};\n\n// ---------- Sprite-Builder ----------\n\nconst cache = new Map();\n\nfunction buildCanvas(sprite, scale = 1, tint = null) {\n  const rows = sprite.d;\n  const h = rows.length;\n  const w = Math.max(...rows.map(r => r.length));\n  const c = document.createElement('canvas');\n  c.width = w * scale;\n  c.height = h * scale;\n  const ctx = c.getContext('2d');\n  ctx.imageSmoothingEnabled = false;\n\n  for (let y = 0; y < h; y++) {\n    const row = rows[y];\n    for (let x = 0; x < w; x++) {\n      const ch = row[x] || '.';\n      if (ch === '.') continue;\n      const color = sprite.p[ch];\n      if (!color) continue;\n      ctx.fillStyle = color;\n      ctx.fillRect(x * scale, y * scale, scale, scale);\n    }\n  }\n\n  if (tint) {\n    ctx.globalCompositeOperation = 'source-atop';\n    ctx.fillStyle = tint;\n    ctx.fillRect(0, 0, c.width, c.height);\n    ctx.globalCompositeOperation = 'source-over';\n  }\n  return c;\n}\n\nexport function getSprite(sprite, key, scale = 1, tint = null) {\n  const id = `${key}@${scale}${tint || ''}`;\n  if (!cache.has(id)) cache.set(id, buildCanvas(sprite, scale, tint));\n  return cache.get(id);\n}\n\nexport function towerSprite(type, scale) {\n  return getSprite(TOWER_SPRITES[type] || TOWER_SPRITES.gatling, 'tower_' + type, scale);\n}\n\nexport function monsterSprite(subtype, scale, ghost = false) {\n  const spr = MONSTER_SPRITES[subtype] || MONSTER_SPRITES.grunt;\n  return getSprite(spr, 'mon_' + subtype + (ghost ? '_g' : ''), scale);\n}\n\nexport function tileSprite(name, scale) {\n  return getSprite(TILE_SPRITES[name], 'tile_' + name, scale);\n}\n\nexport function baseSprite(scale) {\n  return getSprite(BASE_SPRITE, 'base', scale);\n}\n\nexport function tierMarkSprite(scale) {\n  return getSprite(TIER_MARK, 'tiermark', scale);\n}\n\n// ---------- Optionaler Austausch gegen externes Sprite-Sheet ----------\n// Wenn du später ein gekauftes/heruntergeladenes Sheet nutzen willst:\n// 1. PNG nach client/assets/sheet.png legen\n// 2. Hier die Frame-Koordinaten eintragen\n// 3. loadExternalSheet() in render.js vor dem ersten Zeichnen aufrufen\n//\n// Der restliche Renderer greift ausschließlich über die Funktionen oben zu,\n// es muss also nichts anderes angepasst werden.\n\nexport const EXTERNAL_FRAMES = {\n  // beispiel: gatling: { x: 0, y: 0, w: 16, h: 16 }\n};\n\nexport async function loadExternalSheet(url = 'assets/sheet.png') {\n  if (Object.keys(EXTERNAL_FRAMES).length === 0) return false;\n  const img = await new Promise((resolve, reject) => {\n    const i = new Image();\n    i.onload = () => resolve(i);\n    i.onerror = reject;\n    i.src = url;\n  });\n  for (const [key, f] of Object.entries(EXTERNAL_FRAMES)) {\n    for (const scale of [1, 2, 3]) {\n      const c = document.createElement('canvas');\n      c.width = f.w * scale; c.height = f.h * scale;\n      const ctx = c.getContext('2d');\n      ctx.imageSmoothingEnabled = false;\n      ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, c.width, c.height);\n      cache.set(`${key}@${scale}`, c);\n    }\n  }\n  return true;\n}\n" }
};

// ==================== server/towers.js ====================
// Turmdefinitionen: Basiswerte + zweistufig verzweigte Upgrades.
// dps-basiertes Modell: jeder Tick wird (dps * tickSeconds) Schaden an Ziel(en) verteilt.

const TOWER_TYPES = {
  gatling: {
    name: 'Gatling',
    buildCost: 50,
    base: { damage: 4, fireRate: 2.5, range: 4, splash: 0 },
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
    buildCost: 70,
    base: { damage: 14, fireRate: 0.8, range: 3.5, splash: 1.5 },
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
    buildCost: 65,
    base: { damage: 20, fireRate: 0.6, range: 6, slowPct: 0.3, slowDuration: 2.5 },
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
    buildCost: 55,
    base: { auraRange: 3, revealStealth: true },
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
const NUM_SLOTS = 6;
const BASE_PATH_LENGTH = 24;
const PATH_TILE_LENGTH = 3;
const MAX_PATH_EXTENSIONS = 5;

function freshPlayer(id, name) {
  return {
    id, name,
    gold: 100,
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

  buildTower(playerId, slot, type) {
    const p = this.getPlayer(playerId);
    if (!p || p.eliminated || this.phase !== 'playing') return { error: 'invalid' };
    if (!TOWER_TYPES[type]) return { error: 'unknown_type' };
    if (slot < 0 || slot >= NUM_SLOTS) return { error: 'bad_slot' };
    if (p.towers.some(t => t.slot === slot)) return { error: 'slot_taken' };
    const cost = Math.round(TOWER_TYPES[type].buildCost * p.towerCostMult);
    if (p.gold < cost) return { error: 'no_gold' };
    p.gold -= cost;
    p.towers.push({ id: 't' + Math.random().toString(36).slice(2, 8), type, slot, tier: 0, branch1: null, branch2: null, cooldownRemaining: 0, disabledUntil: 0 });
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
    } else if (tower.tier === 1) {
      if (!def.tier2[branchKey]) return { error: 'bad_branch' };
      const cost = Math.round(def.tier2Cost * p.towerCostMult);
      if (p.gold < cost) return { error: 'no_gold' };
      p.gold -= cost;
      tower.branch2 = branchKey;
      tower.tier = 2;
      return { ok: true };
    }
    return { error: 'max_tier' };
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
    const isElite = this.waveIndex > 0 && this.waveIndex % 5 === 0;
    const count = isElite ? 2 : 5 + Math.floor(this.waveIndex * 1.2);
    const hp = Math.round((isElite ? 90 : 18) * (1 + this.waveIndex * 0.16));
    const speed = isElite ? 0.55 : 0.9;
    const killGold = Math.round((isElite ? 12 : 3) + this.waveIndex * 0.4);

    for (const p of this.alivePlayers()) {
      for (let i = 0; i < count; i++) {
        p.monsters.push({
          id: 'm' + (monsterIdCounter++),
          subtype: isElite ? 'elite' : 'grunt',
          isSabotage: false,
          sourcePlayerId: null,
          pos: -i * 0.5,
          hp, maxHp: hp,
          speed,
          armored: isElite,
          stealth: false, stealthRevealFrac: 0,
          disruptor: false,
          splitsInto: 0, splitHpFrac: 0,
          damageToBaseOnLeak: isElite ? 20 : 4,
          bonusGoldToSenderOnLeak: 0,
          killGold,
          slowUntil: 0, slowPct: 0, stunUntil: 0, dotUntil: 0, dotDamage: 0,
          _lastDisruptAt: 0
        });
      }
    }
    // interest
    for (const p of this.alivePlayers()) {
      p.gold = Math.round(p.gold * (1 + 0.05 * p.interestMult));
      p.goldPeak = Math.max(p.goldPeak, p.gold);
    }
  }

  boardDamageBuffPct(p) {
    let buff = 0;
    for (const t of p.towers) {
      const def = TOWER_TYPES[t.type];
      if (t.branch1 && def.tier1[t.branch1]?.damageBuffPct) buff += def.tier1[t.branch1].damageBuffPct;
      if (t.branch2 && def.tier2[t.branch2]?.damageBuffPct) buff += def.tier2[t.branch2].damageBuffPct;
    }
    if (this.elapsedMs < p.buffUntil) buff += (p.buffTowerDamageMult - 1);
    return buff;
  }

  boardHasStealthReveal(p) {
    return p.towers.some(t => t.type === 'support');
  }

  tickPlayerBoard(p, dtS) {
    const globalDamageMult = (this.activeEvent?.mods?.towerDamageMult || 1);
    const monsterSpeedMult = (this.activeEvent?.mods?.monsterSpeedMult || 1);
    const boardBuffPct = this.boardDamageBuffPct(p);
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

      const slotPos = ((t.slot + 0.5) / NUM_SLOTS) * p.pathLength;
      const candidates = p.monsters
        .filter(m => m.hp > 0 && Math.abs(m.pos - slotPos) <= stats.range)
        .filter(m => revealAll || !m.stealth || (m.pos / p.pathLength) >= m.stealthRevealFrac)
        .sort((a, b) => b.pos - a.pos);
      if (candidates.length === 0) continue;

      const primary = candidates[0];
      let dmg = stats.damage * (1 + boardBuffPct);
      if (stats.executeThreshold && primary.hp / primary.maxHp <= stats.executeThreshold) dmg *= stats.executeDamageMult;
      if (primary.armored && !stats.armorPierce) dmg *= 0.6;
      this.damageMonster(p, primary, dmg);

      if (stats.slowPct) { primary.slowUntil = this.elapsedMs + (t.type === 'sniper' ? 2500 : 1500); primary.slowPct = stats.slowPct; }
      if (stats.stunChance && Math.random() < stats.stunChance) primary.stunUntil = this.elapsedMs + 800;
      if (stats.dot) { primary.dotUntil = this.elapsedMs + 3000; primary.dotDamage = dmg * 0.2; }

      // Splash / Chain / Pierce / Freeze-AoE: zusätzliche nahe Ziele treffen
      const extraCount = stats.chainTargets || stats.pierceCount || (stats.splash ? 99 : 0);
      if (extraCount > 0) {
        const radius = stats.splash || 1.2;
        const extras = candidates.slice(1).filter(m => Math.abs(m.pos - primary.pos) <= radius).slice(0, extraCount);
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
      const nearby = p.towers.filter(t => {
        const slotPos = ((t.slot + 0.5) / NUM_SLOTS) * p.pathLength;
        return Math.abs(slotPos - m.pos) <= 1.5;
      });
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
      activeEvent: this.activeEvent ? { label: this.activeEvent.label, desc: this.activeEvent.desc, endsInMs: this.eventEndsAt - this.elapsedMs } : null,
      winnerId: this.winnerId,
      finalRanking: this.finalRanking,
      log: this.log.slice(-12),
      numSlots: NUM_SLOTS,
      basePathLength: BASE_PATH_LENGTH,
      players: this.players.map(p => ({
        id: p.id, name: p.name,
        gold: p.gold, baseHP: p.baseHP, maxBaseHP: p.maxBaseHP,
        eliminated: p.eliminated,
        towers: p.towers.map(t => ({ id: t.id, type: t.type, slot: t.slot, tier: t.tier, branch1: t.branch1, branch2: t.branch2, disabled: t.disabledUntil > this.elapsedMs })),
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
      const r = currentRoom?.match?.buildTower(playerId, payload.slot, payload.towerType);
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
