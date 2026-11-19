/* Identity Defender · overworld engine (Phaser 3).
   Each mission is an area of the Halcyon campus with its own layout and lighting (defined in js/levels/*.js).
   Walk off an edge to reach the next area. The art (Kenney RPG Urban Pack + original sprites) and controls are shared. */
(function () {
"use strict";
const L = window.ID_LEVELS, SAVE = window.IDSave;
const TS = 16, VERSION = "3.1.0";
function reduced(){ const m = SAVE.state.lab.game.settings.motion; if (m === "reduce") return true; if (m === "full") return false; return matchMedia("(prefers-reduced-motion: reduce)").matches; }

/* ---------- Tile vocabulary (Kenney RPG Urban Pack, tilemap_packed.png) ---------- */
const SETS = { grass:[0,1,2,27,28,29,54,55,56], tan:[81,82,83,108,109,110,135,136,137], lav:[8,9,10,35,36,37,62,63,64], tanb:[89,90,91,116,117,118,143,144,145], water:[170,171,172,197,198,199,224,225,226] };
const ROOF = { A:SETS.tanb, B:SETS.lav, C:SETS.tan };
const FACADE = { red:[17,18,19,44,45,46,71,72,73,98,99,100], orange:[125,126,127,152,153,154,179,180,181,206,207,208] };
const PROPS = {   // [tiles...] laid out [[top row],[bottom row]], solid footprint (tiles) or null
  tree:{ t:[[232],[259]], solid:[0.2,1.4,0.6,0.5] }, tree2:{ t:[[238],[265]], solid:[0.25,1.4,0.5,0.5] },
  autumn:{ t:[[313],[340]], solid:[0.2,1.4,0.6,0.5] }, autumn2:{ t:[[319],[346]], solid:[0.25,1.4,0.5,0.5] },
  pot:{ t:[[286]], solid:[0.1,0.4,0.8,0.6] }, pot2:{ t:[[287]], solid:[0.1,0.4,0.8,0.6] }, potA:{ t:[[367]], solid:[0.1,0.4,0.8,0.6] },
  lamp:{ t:[[162],[189]], solid:[0.3,1.5,0.4,0.5], glow:0xfff0c0 }, lampB:{ t:[[168],[195]], solid:[0.3,1.5,0.4,0.5], glow:0x9fd8ff }, lampG:{ t:[[169],[196]], solid:[0.3,1.5,0.4,0.5], glow:0xb8ffd0 },
  bench:{ t:[[270,271]], solid:[0.1,0.4,1.8,0.6] }, trash:{ t:[[279]], solid:[0.2,0.4,0.6,0.6] }, hydrant:{ t:[[278]], solid:[0.2,0.4,0.6,0.6] },
  flowers:{ t:[[276,277]], solid:[0.1,0.4,1.8,0.6] }, mailbox:{ t:[[305]], solid:[0.15,0.3,0.7,0.7] },
  vending:{ t:[[281,282]], solid:[0,0.3,2,0.7] }, shelter:{ t:[[359,360,361],[386,387,388]], solid:[0,0.6,3,1.2] },
  van:{ t:[[426,427],[453,454]], solid:[0,0.4,2,1.6] }, barrier:{ t:[[221]], solid:[0,0.4,1,0.6] }, barrier2:{ t:[[248]], solid:[0,0.4,1,0.6] },
  psign:{ t:[[442]], solid:null }, crate:{ t:[[223]], solid:[0.1,0.4,0.8,0.6] }
};
const DIR_COL = { left:23, down:24, up:25, right:26 };
const charFrame = (k, step, dir) => (3 * k + step) * 27 + DIR_COL[dir];

class Boot extends Phaser.Scene {
  constructor(){ super("boot"); }
  preload(){
    const bar = document.getElementById("loadbar");
    this.load.on("progress", p => { if (bar) bar.style.width = Math.round(p * 100) + "%"; });
    const v = "?v=" + VERSION, o = "assets/original/";
    this.load.spritesheet("urban", "assets/kenney-rpg-urban/tilemap_packed.png" + v, { frameWidth:16, frameHeight:16 });
    this.load.spritesheet("gate", o + "gate.png" + v, { frameWidth:48, frameHeight:40 });
    this.load.spritesheet("console", o + "console.png" + v, { frameWidth:32, frameHeight:32 });
    this.load.spritesheet("drone", o + "drone.png" + v, { frameWidth:16, frameHeight:16 });
    this.load.spritesheet("drone_app", o + "drone_app.png" + v, { frameWidth:16, frameHeight:16 });
    this.load.spritesheet("rack", o + "rack.png" + v, { frameWidth:16, frameHeight:32 });
    this.load.spritesheet("bubbles", o + "bubbles.png" + v, { frameWidth:12, frameHeight:12 });
    this.load.spritesheet("lamp", o + "lamp.png" + v, { frameWidth:6, frameHeight:6 });
    ["mail","doc","chat","badge","server","vault","app","cloud"].forEach(k => this.load.image("sign_" + k, o + "sign_" + k + ".png" + v));
    this.load.on("loaderror", f => { window.__ID_ERRORS = (window.__ID_ERRORS || []).concat("asset:" + f.key); });
  }
  create(){ this.scene.start("world", { levelId:SAVE.currentLevel(), entry:"start" }); }
}

class World extends Phaser.Scene {
  constructor(){ super("world"); }
  init(data){ this.levelId = (data && data.levelId && L.defs[data.levelId]) ? data.levelId : L.order[0]; this.entry = (data && data.entry) || "start"; }
  create(){
    this.ready = false; this.leaving = false;
    const S = SAVE.state; this.S = S; this.G = S.lab.game;
    this.def = L.defs[this.levelId]; this.A = this.def.area;
    this.W = this.A.W; this.H = this.A.H;
    SAVE.setCurrent(this.levelId);
    this.keys = new Set(); this.touchDir = { x:0, y:0 }; this.fx = []; this.highlights = [];
    this.cameras.main.setBackgroundColor(this.A.bg || "#151a2a");
    this.makeTextures(); this.makeAnims();
    this.buildMap(); this.buildBuildings(); this.buildGates(); this.buildProps(); this.buildExits();
    const lvl = SAVE.levelFor(this.def), saved = SAVE.savedRun(this.levelId);
    this.run = (saved && saved.level && this.def.variants[saved.level] && saved.phase === "play") ? Object.assign(this.def.newRun(saved.level), saved, { undo:[], results:null, ui:saved.ui || {} }) : this.def.newRun(lvl);
    this.run.phase = "play"; this.run.ui = this.run.ui || {};
    this.persist();
    this.spawnPlayer(); this.spawnStatics(); this.spawnActors();
    this.setupCamera(); this.setupInput();
    window.UI.bind(this);
    this.intro();
    this.scale.on("resize", this.fitCamera, this);
    this.events.once("shutdown", () => { this.scale.off("resize", this.fitCamera, this); window.removeEventListener("keydown", this._kd); window.removeEventListener("keyup", this._ku); });
    window.__ID_GAME = this;
    if (!reduced()) this.cameras.main.fadeIn(280, 10, 14, 28);
    window.UI.areaSign(this.A.name, `${this.def.code} · ${this.def.title}`);
    this.ready = true;
  }
  persist(){ const r = Object.assign({}, this.run); delete r.undo; delete r.results; SAVE.saveRun(this.levelId, r); }
  makeTextures(){
    if (this.textures.exists("glow")) return;
    const glow = this.textures.createCanvas("glow", 64, 64), c = glow.getContext();
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.35, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); glow.refresh();
    const gr = this.make.graphics({ x:0, y:0, add:false });
    gr.fillStyle(0xffffff, 1); gr.fillRect(0, 0, 2, 2); gr.generateTexture("spark", 2, 2); gr.clear();
    gr.fillStyle(0x64e0f0, 1); gr.fillRect(0, 0, 3, 3); gr.generateTexture("packet", 3, 3); gr.destroy();
  }
  makeAnims(){
    for (let k = 0; k < 6; k++) ["down","up","left","right"].forEach(dir => { const key = `c${k}-${dir}`; if (!this.anims.exists(key)) this.anims.create({ key, frames:[1, 0, 2, 0].map(s => ({ key:"urban", frame:charFrame(k, s, dir) })), frameRate:8, repeat:-1 }); });
    const anim = (key, sheet, end, rate) => { if (!this.anims.exists(key)) this.anims.create({ key, frames:this.anims.generateFrameNumbers(sheet, { start:0, end }), frameRate:rate, repeat:-1 }); };
    anim("rack-blink", "rack", 1, 2); anim("console-run", "console", 1, 3); anim("drone-fly", "drone", 1, 6); anim("app-fly", "drone_app", 1, 6);
  }

  /* ---------- Area builder ---------- */
  buildMap(){
    const A = this.A, W = this.W, H = this.H;
    const map = this.make.tilemap({ width:W, height:H, tileWidth:TS, tileHeight:TS });
    const ts = map.addTilesetImage("urban", "urban", 16, 16, 0, 0);
    const ground = map.createBlankLayer("ground", ts), deco = map.createBlankLayer("deco", ts);
    this.map = map; this.ground = ground; this.deco = deco;
    const put = (Ly, t, x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) Ly.putTileAt(t, x, y); };
    const block = (Ly, set, x0, y0, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
      const cx = w === 1 ? 1 : x === 0 ? 0 : x === w - 1 ? 2 : 1, cy = h === 1 ? 1 : y === 0 ? 0 : y === h - 1 ? 2 : 1; put(Ly, set[cy * 3 + cx], x0 + x, y0 + y); } };
    const fill = (t, x0, y0, w, h, Ly) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(Ly || ground, t, x0 + x, y0 + y); };
    this.put = put; this.block = block; this.fill = fill;
    if (SETS[A.base]) block(ground, SETS[A.base], 0, 0, W, H); else fill(A.base, 0, 0, W, H);
    (A.fills || []).forEach(f => { if (typeof f[0] === "string") block(ground, SETS[f[0]], f[1], f[2], f[3], f[4]); else fill(f[0], f[1], f[2], f[3], f[4]); });
    (A.roads || []).forEach(r => { for (let x = r.x; x < r.x + r.w; x++){ put(ground, 406, x, r.y); put(ground, 433, x, r.y + 1); put(ground, 433, x, r.y + 2); put(ground, 460, x, r.y + 3); }
      (r.cross || []).forEach(cx => { for (let y = r.y; y < r.y + 4; y++) put(ground, 405, cx, y); }); });
    (A.hedges || []).forEach(([x, y, w]) => { for (let i = 0; i < w; i++) put(deco, w === 1 ? 332 : i === 0 ? 328 : i === w - 1 ? 330 : 329, x + i, y); });
    (A.fences || []).forEach(([x, y, w]) => { for (let i = 0; i < w; i++) put(deco, i % 2 ? 356 : 355, x + i, y); });
    (A.pickets || []).forEach(([x, y, w]) => { for (let i = 0; i < w; i++) put(deco, 383, x + i, y); });
    (A.decoTiles || []).forEach(([t, x, y]) => put(deco, t, x, y));
    try { ground.setTint && ground.setTint(A.tint); deco.setTint && deco.setTint(A.tint); } catch(e){}
    ground.setDepth(0); deco.setDepth(1);
    this.solids = this.physics.add.staticGroup();
    this.solid = (x, y, w, h) => { const r = this.add.rectangle(x * TS + w * TS / 2, y * TS + h * TS / 2, w * TS, h * TS); r.setVisible(false); this.physics.add.existing(r, true); this.solids.add(r); return r; };
    (A.hedges || []).forEach(([x, y, w]) => this.solid(x, y + 0.2, w, 0.8));
    (A.fences || []).forEach(([x, y, w]) => this.solid(x, y + 0.2, w, 0.8));
    (A.pickets || []).forEach(([x, y, w]) => this.solid(x, y + 0.2, w, 0.8));
    (A.water || []).forEach(([x, y, w, h]) => { block(ground, SETS.water, x, y, w, h); });
    (A.bridges || []).forEach(([x, y, w, h]) => block(ground, SETS.tan, x, y, w, h));
    (A.waterSolids || A.water || []).forEach(([x, y, w, h]) => this.solid(x, y, w, h));
    (A.bridges || []).forEach(([x, y, w, h]) => { /* walkable: carve the bridge out of water solids by re-adding water solids around it */ });
    (A.solids || []).forEach(s => this.solid(...s));
  }
  /* Buildings face south; each has a security door (gate) in front and a short fence */
  buildBuildings(){
    const put = (t, x, y) => this.ground.putTileAt(t, x, y), deco = (t, x, y) => this.deco.putTileAt(t, x, y);
    this.bld = {}; this.slots = [];
    this.A.buildings.forEach(spec => {
      const b = Object.assign({ roof:"A", facade:"red" }, spec);
      b.cx = (b.x + 4) * TS; b.gateY = (b.y + 9) * TS - 1; b.frontY = b.y + 9.35; b.inY = [b.y + 7.8, b.y + 6.4];
      const R = ROOF[b.roof], F = FACADE[b.facade];
      for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++){ const cx = x === 0 ? 0 : x === 7 ? 2 : 1; put(R[y * 3 + cx], b.x + x, b.y + y); }
      for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++){ const cx = x === 0 ? 0 : x === 7 ? 2 : 1; put(F[y * 3 + cx], b.x + x, b.y + 3 + y); }
      [1, 2, 5, 6].forEach(x => deco(b.win || 335, b.x + x, b.y + 4)); deco(362, b.x + 1, b.y + 5); deco(362, b.x + 6, b.y + 5);
      deco(412, b.x + 3, b.y + 5); deco(413, b.x + 4, b.y + 5);
      for (let x = b.x; x < b.x + 8; x++){ put(36, x, b.y + 7); put(36, x, b.y + 8); if (x < b.x + 2 || x > b.x + 4) deco(x % 2 ? 356 : 355, x, b.y + 8); }
      const wy = b.y * TS;
      const wins = [[1,4],[2,4],[5,4],[6,4],[1,5],[6,5]].map(([x, y]) => this.add.rectangle((b.x + x) * TS + 8, wy + y * TS + 8, 8, 10, 0xffe39a, 0.0).setDepth(2).setBlendMode(Phaser.BlendModes.ADD));
      const sign = this.add.image(b.cx, wy + 3 * TS + 8, "sign_" + b.sign).setDepth(3);
      const signGlow = this.add.image(b.cx, wy + 3 * TS + 8, "glow").setDepth(3).setScale(1.4, 0.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setTint(0x64e0f0);
      const lamp = this.add.sprite(b.x * TS + 8 * TS - 10, wy + 3 * TS + 6, "lamp", 0).setDepth(3);
      const dark = this.add.rectangle(b.x * TS + 4 * TS, wy + 3.5 * TS + 16, 8 * TS, 3 * TS, 0x0a0e1c, 0).setDepth(2.5);
      this.solid(b.x, b.y, 8, 8.7);
      this.bld[b.key] = { b, wins, sign, signGlow, lamp, dark, status:"unknown" };
      this.slots.push(b);
    });
  }
  setBuilding(key, status){
    const B = this.bld[key]; if (!B || B.status === status) return;
    const prev = B.status; B.status = status; const rm = reduced();
    this.tweens.killTweensOf([B.sign, B.signGlow, ...B.wins, B.dark]);
    B.wins.forEach(w => { w.fillColor = 0xffe39a; w.alpha = 1; });
    B.lamp.setFrame(status === "online" || status === "idle" ? 1 : 0);
    B.signGlow.setTint({ online:0x64e0f0, idle:0x64e0f0, offline:0x46506e, alarm:0xff5e5e, locked:0x46506e }[status] || 0x64e0f0);
    if (status === "online" || status === "idle"){
      B.wins.forEach((w, i) => this.tweens.add({ targets:w, fillAlpha:0.55, duration:rm ? 0 : 300, delay:rm ? 0 : i * 70 }));
      this.tweens.add({ targets:B.dark, fillAlpha:0, duration:rm ? 0 : 400 });
      B.sign.setAlpha(1).clearTint(); B.signGlow.setAlpha(0.45);
      if (status === "online" && ["offline","alarm","locked"].includes(prev)){ this.burst(B.b.cx, B.b.y * TS + 4 * TS, 0x9fffd2, 26); window.UI.floatText(B.b.cx, (B.b.y + 2.2) * TS, B.b.label + " " + (B.b.onlineText || "back online"), "ok"); }
    } else if (status === "offline" || status === "locked"){
      B.wins.forEach(w => w.fillAlpha = 0); B.dark.fillAlpha = 0.35; B.sign.setTint(0x7d86a8);
      if (!rm && status === "offline") this.tweens.add({ targets:[B.sign, B.signGlow], alpha:{ from:0.55, to:0.25 }, duration:180, yoyo:true, repeat:-1, repeatDelay:1400 });
      else { B.sign.setAlpha(0.7); B.signGlow.setAlpha(0.15); }
    } else if (status === "alarm"){
      B.wins.forEach(w => { w.fillColor = 0xff5e5e; w.fillAlpha = 0.5; }); B.dark.fillAlpha = 0.1; B.sign.setTint(0xff8a8a);
      if (!rm) this.tweens.add({ targets:[...B.wins, B.signGlow], alpha:{ from:1, to:0.25 }, duration:260, yoyo:true, repeat:-1 });
      window.UI.floatText(B.b.cx, (B.b.y + 2.2) * TS, B.b.alarmText || ("Attacker inside " + B.b.label + "!"), "no");
    }
    window.UI.refreshBuildingTags();
  }
  buildGates(){
    this.gates = {};
    this.slots.forEach(b => {
      const s = this.add.sprite(b.cx, b.gateY, "gate", 0).setOrigin(0.5, 1).setDepth(b.gateY);
      const glow = this.add.image(b.cx, b.gateY - 14, "glow").setBlendMode(Phaser.BlendModes.ADD).setScale(1.3, 0.8).setAlpha(0.4).setTint(0xf5a94c).setDepth(b.gateY + 1);
      this.gates[b.key] = { b, s, glow };
      if (!reduced()){ const p = this.add.image(b.cx, (b.y + 16) * TS, "packet").setDepth(3).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets:p, y:(b.y + 9.6) * TS, alpha:{ from:0.9, to:0 }, duration:2600, repeat:-1, delay:Phaser.Math.Between(0, 1600) }); }
    });
  }
  gateState(key, st){
    const g = this.gates[key]; if (!g) return; const f = { idle:0, scan:1, open:2, denied:3 }[st];
    g.s.setFrame(f); g.glow.setTint([0xf5a94c, 0x64e0f0, 0x42dfab, 0xff5e5e][f]).setAlpha(st === "idle" ? 0.35 : 0.7);
  }
  placeProp(type, x, y){
    const P = PROPS[type]; if (!P) return;
    const rows = P.t.length, bottom = (y + rows) * TS;
    P.t.forEach((row, j) => row.forEach((t, i) => this.add.image((x + i) * TS + 8, (y + j) * TS + 8, "urban", t).setDepth(bottom - 2).setTint(this.A.tint)));
    if (P.solid) this.solid(x + P.solid[0], y + P.solid[1] - (rows === 2 ? 0 : 0), P.solid[2], P.solid[3]);
    if (P.glow) this.add.image(x * TS + 6, y * TS + 2, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(P.glow).setAlpha(this.A.night ? 0.75 : 0.45).setScale(this.A.night ? 1.5 : 1).setDepth(5000);
  }
  buildProps(){
    const A = this.A;
    (A.props || []).forEach(([type, x, y]) => this.placeProp(type, x, y));
    const C = A.console; this.CON = C;
    this.console = this.add.sprite(C.x * TS, C.y * TS, "console", 0).setOrigin(0.5, 1).setDepth(C.y * TS);
    this.add.image(C.x * TS, C.y * TS - 22, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(0x64e0f0).setScale(0.9, 0.6).setAlpha(0.45).setDepth(C.y * TS + 1);
    this.solid(C.x - 1.1, C.y - 0.9, 2.2, 0.9);
    this.RACKS = [{ x:C.x - 1.5, y:C.y - 0.2 }, { x:C.x + 1.5, y:C.y - 0.2 }];
    this.racks = this.RACKS.map(r => { this.solid(r.x - 0.45, r.y - 0.6, 0.9, 0.6); return this.add.sprite(r.x * TS, r.y * TS, "rack", 0).setOrigin(0.5, 1).setDepth(r.y * TS); });
    this.racks.forEach((r, i) => { r.play("rack-blink"); r.anims.setProgress(i * 0.5); });
    this.console.play("console-run");
    if (A.night) this.add.rectangle(0, 0, this.W * TS, this.H * TS, 0x0b1030, 0.18).setOrigin(0, 0).setDepth(4900);
    const cn = this.def.campus.console;
    this.zoneTags = (A.tags || []).map(t => ({ x:t.x * TS, y:t.y * TS, html:`<b>${L.esc(t.title)}</b><span>${L.esc(t.sub)}</span>`, cls:"zone " + (t.cls || "") }))
      .concat([{ x:C.x * TS, y:(C.y - 2.6) * TS, html:`<b>${L.esc(cn.title)}</b><span>${L.esc(cn.sub)}</span>`, cls:"zone soc" }]);
  }
  /* ---------- Exits: walk off the edge to the next area ---------- */
  buildExits(){
    this.exits = (this.A.exits || []).map(e => {
      const ex = Object.assign({}, e), unlocked = !e.forward || SAVE.levelState(this.levelId).completed > 0;
      ex.open = unlocked; ex.locks = [];
      const cells = []; for (let i = e.at[0]; i <= e.at[1]; i++) cells.push(i);
      if (!unlocked){
        cells.forEach(i => { const [x, y] = e.edge === "east" ? [this.W - 1, i] : e.edge === "west" ? [0, i] : e.edge === "north" ? [i, 0] : [i, this.H - 1];
          ex.locks.push(this.add.image(x * TS + 8, y * TS + 8, "urban", 221).setDepth((y + 1) * TS).setTint(this.A.tint)); });
        const [x0, y0] = e.edge === "east" ? [this.W - 1, e.at[0]] : e.edge === "west" ? [0, e.at[0]] : e.edge === "north" ? [e.at[0], 0] : [e.at[0], this.H - 1];
        const horiz = e.edge === "north" || e.edge === "south", n = cells.length;
        ex.wall = this.solid(x0, y0, horiz ? n : 1, horiz ? 1 : n);
      } else ex.wall = null;
      ex.arrow = this.add.text(0, 0, "", {}).setVisible(false);
      return ex;
    });
  }
  unlockExits(){
    this.exits.filter(e => !e.open).forEach(e => {
      e.open = true; e.locks.forEach(l => { if (reduced()) l.destroy(); else this.tweens.add({ targets:l, alpha:0, y:l.y - 8, duration:400, onComplete:() => l.destroy() }); });
      if (e.wall){ this.solids.remove(e.wall, true, true); e.wall = null; }
    });
    window.UI.refreshExitTags && window.UI.refreshExitTags();
  }
  checkExit(){
    if (this.leaving || window.UI.blocking() || this.running) return;
    const p = this.player, tx = p.x / TS, ty = p.y / TS;
    for (const e of this.exits){
      if (!e.open) continue;
      const along = e.edge === "east" || e.edge === "west" ? ty : tx;
      if (along < e.at[0] - 0.2 || along > e.at[1] + 1.2) continue;
      const hit = e.edge === "east" ? tx > this.W - 0.45 : e.edge === "west" ? tx < 0.45 : e.edge === "north" ? ty < 0.75 : ty > this.H - 0.25;
      if (hit){ this.leave(e.to, e.entry); return; }
    }
  }
  leave(to, entry){
    if (this.leaving) return; this.leaving = true; this.player.setVelocity(0, 0);
    window.UI.onLeave();
    const go = () => this.scene.restart({ levelId:to, entry });
    if (reduced()) go(); else { this.cameras.main.fadeOut(260, 10, 14, 28); this.time.delayedCall(280, go); }
  }

  /* ---------- Player ---------- */
  spawnPlayer(){
    const sp = this.A.entries[this.entry] || this.A.entries.start;
    const p = this.physics.add.sprite(sp[0] * TS, sp[1] * TS, "urban", charFrame(0, 0, "down")).setOrigin(0.5, 0.9);
    p.body.setSize(9, 5).setOffset(3.5, 9.5);
    p.setCollideWorldBounds(true); p.dir = this.entry === "east" ? "left" : this.entry === "west" ? "right" : this.entry === "north" ? "down" : "up";
    p.setFrame(charFrame(0, 0, p.dir));
    this.physics.world.setBounds(0, 0, this.W * TS, this.H * TS);
    this.physics.add.collider(p, this.solids);
    this.player = p;
  }

  /* ---------- People ---------- */
  makeSprite(d, x, y){
    let sp;
    if (d.drone){ sp = this.add.sprite(x, y, d.drone, 0).setOrigin(0.5, 1); sp.play(d.drone === "drone" ? "drone-fly" : "app-fly"); if (d.tint) sp.setTint(d.tint); }
    else { sp = this.add.sprite(x, y, "urban", charFrame(d.char, 0, d.facing || "up")).setOrigin(0.5, 0.9); if (d.tint) sp.setTint(d.tint); }
    if (d.kind === "attacker" || d.glow){ try { if (sp.preFX) sp.preFX.addGlow(d.glow || 0xff4d6d, 2, 0, false, 0.1, 6); } catch(e){} }
    if (d.ghost) sp.setAlpha(0.65);
    return sp;
  }
  spawnStatics(){
    this.statics = {};
    (this.def.statics ? this.def.statics(this.run) : []).forEach(d => {
      const sp = this.makeSprite(d, d.pos[0] * TS, d.pos[1] * TS);
      const shadow = this.add.ellipse(sp.x, sp.y - 1, 10, 4, 0x000000, 0.25).setDepth(2);
      const bubble = this.add.sprite(sp.x + 10, sp.y - 14, "bubbles", 0).setVisible(false).setDepth(sp.y + 2);
      sp.setDepth(sp.y);
      this.statics[d.id] = { id:d.id, data:d, sp, shadow, bubble, isStatic:true };
      this.solid(d.pos[0] - 0.3, d.pos[1] - 0.35, 0.6, 0.35);
    });
  }
  spawnActors(){ this.actors = {}; this.run.actors.forEach(id => this.makeActor(id, this.def.actor(id, this.run), false)); }
  makeActor(id, data, isPrediction){
    const sp = this.makeSprite(data, data.origin[0] * TS, data.origin[1] * TS);
    const shadow = this.add.ellipse(sp.x, sp.y, 10, 4, 0x000000, 0.25).setDepth(2);
    const bubble = this.add.sprite(sp.x, sp.y - 20, "bubbles", 0).setVisible(false);
    const a = { id, data, sp, shadow, bubble, state:"origin", result:null, isPrediction, door:data.door, baseAlpha:sp.alpha };
    this.actors[id] = a; return a;
  }
  face(a, dir){ if (a.data.drone) return; a.sp.setFrame(charFrame(a.data.char, 0, dir)); }
  walk(a, pts, speed, done){
    const go = i => {
      if (i >= pts.length){ if (!a.data.drone){ a.sp.anims.stop(); this.face(a, a.endFace || "up"); } done && done(); return; }
      const tx = pts[i][0] * TS, ty = pts[i][1] * TS, dx = tx - a.sp.x, dy = ty - a.sp.y, dist = Math.hypot(dx, dy);
      if (reduced() || dist < 1){ a.sp.setPosition(tx, ty); go(i + 1); return; }
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      if (!a.data.drone) a.sp.play(`c${a.data.char}-${dir}`, true);
      this.tweens.add({ targets:a.sp, x:tx, y:ty, duration:dist / speed * 1000, onComplete:() => go(i + 1) });
    };
    go(0);
  }
  slotOf(key){ return this.slots.find(b => b.key === key); }
  pathToWait(a){
    if (a.data.path) return a.data.path.concat([a.data.wait]);
    const [ox] = a.data.origin, [wx, wy] = a.data.wait, s = this.slotOf(a.door), lx = s ? s.cx / TS : wx, ly = this.A.laneY;
    return [[ox, ly], [lx, ly], [lx, wy + 1.2], [wx, wy]];
  }
  showBubble(a, kind, ms){ const f = { ok:0, no:1, mfa:2, ask:3, clock:4, env:5 }[kind]; a.bubble.setFrame(f).setVisible(true).setScale(1);
    if (!reduced()) this.tweens.add({ targets:a.bubble, scale:{ from:0.3, to:1 }, duration:180, ease:"Back.Out" });
    if (ms) this.time.delayedCall(reduced() ? Math.min(ms, 400) : ms, () => a.bubble.setVisible(false)); }

  /* ---------- Arrival: this mission's people arrive and meet the current configuration ---------- */
  intro(){
    const firstVisit = !SAVE.levelState(this.levelId).completed;
    if (firstVisit){ this.showOverview(true, true); this.introCam = true; }
    window.UI.coach(this.G.tutorialDone ? this.def.startCoach : "Move with <kbd>WASD</kbd> or the arrow keys.", this.G.tutorialDone ? null : "move");
    const ids = Object.keys(this.actors); this._arrived = 0;
    if (!ids.length){ this.runAttempts(true); return; }
    ids.forEach((id, i) => {
      const a = this.actors[id];
      const go = () => { a.endFace = "up"; this.walk(a, this.pathToWait(a), 150, () => { a.state = "waiting"; if (++this._arrived === ids.length) this.runAttempts(true); }); };
      if (reduced()) go(); else this.time.delayedCall(200 + i * 160, go);
    });
  }

  /* ---------- Camera ---------- */
  setupCamera(){ const cam = this.cameras.main; cam.setBounds(0, 0, this.W * TS, this.H * TS); cam.setRoundPixels(true); cam.startFollow(this.player, true, 0.14, 0.14); this.fitCamera(); }
  playZoom(){ const w = this.scale.width, h = this.scale.height; return Phaser.Math.Clamp(Math.floor(Math.min(w / 360, h / 230)), 2, 4); }
  overviewZoom(){ const w = this.scale.width, h = this.scale.height; const z = Math.min(w / (this.W * TS), h / ((this.A.viewH || 15.5) * TS)); return z >= 2 ? Math.floor(z) : Math.max(0.5, z); }
  fitCamera(){ const cam = this.cameras.main; if (!cam) return; cam.setZoom(this.overview ? this.overviewZoom() : this.playZoom()); }
  endIntroCam(){ if (!this.introCam) return; this.introCam = false; this.showOverview(false); }
  showOverview(on, instant){
    const cam = this.cameras.main; this.overview = on;
    if (on){ cam.stopFollow(); cam.removeBounds(); const z = this.overviewZoom(), cy = this.A.viewCY != null ? this.A.viewCY * TS : Math.min(this.H * TS / 2, this.scale.height / z / 2) + 2;
      if (reduced() || instant){ cam.setZoom(z); cam.centerOn(this.W * TS / 2, cy); } else { cam.zoomTo(z, 450, "Sine.easeInOut"); cam.pan(this.W * TS / 2, cy, 450, "Sine.easeInOut"); } }
    else { const z = this.playZoom(); cam.setBounds(0, 0, this.W * TS, this.H * TS); if (reduced()) cam.setZoom(z); else cam.zoomTo(z, 400, "Sine.easeInOut"); cam.startFollow(this.player, true, 0.14, 0.14); }
  }

  /* ---------- Input ---------- */
  setupInput(){
    const map = { ArrowUp:"up", KeyW:"up", ArrowDown:"down", KeyS:"down", ArrowLeft:"left", KeyA:"left", ArrowRight:"right", KeyD:"right" };
    this._kd = e => {
      if (window.UI.blocking() || /input|textarea|select/i.test(e.target.tagName)) return;
      if (map[e.code]){ this.keys.add(map[e.code]); e.preventDefault(); }
      else if (["KeyE","Space","Enter"].includes(e.code) && !e.repeat){ if (e.target.tagName === "BUTTON" && e.code !== "KeyE") return; e.preventDefault(); this.interact(); }
      else if (e.code === "KeyH" && !e.repeat) window.UI.hint();
      else if (e.code === "KeyL" && !e.repeat) window.UI.openLog();
      else if (e.code === "KeyM" && !e.repeat) window.UI.openMissions();
    };
    this._ku = e => { if (map[e.code]) this.keys.delete(map[e.code]); };
    window.addEventListener("keydown", this._kd); window.addEventListener("keyup", this._ku);
    if (!window.__ID_BLUR){ window.__ID_BLUR = true; window.addEventListener("blur", () => window.__ID_GAME && window.__ID_GAME.keys.clear()); }
  }
  interactables(){
    const list = [];
    Object.values(this.actors).forEach(a => { if (a.sp.visible) list.push({ kind:"actor", a, x:a.sp.x, y:a.sp.y - 4, label:"Inspect " + (a.data.short || a.data.name) }); });
    Object.values(this.statics).forEach(s => list.push({ kind:"static", a:s, x:s.sp.x, y:s.sp.y - 4, label:"Talk to " + s.data.short }));
    list.push({ kind:"console", x:this.CON.x * TS, y:this.CON.y * TS + 4, label:"Use " + this.def.campus.console.title.toLowerCase() });
    this.RACKS.forEach(r => list.push({ kind:"log", x:r.x * TS, y:r.y * TS + 4, label:"Read " + this.def.log.title.toLowerCase() }));
    return list;
  }
  nearest(){ const p = this.player; let best = null, bd = 26; this.interactables().forEach(it => { const d = Math.hypot(it.x - p.x, it.y - p.y); if (d < bd){ bd = d; best = it; } }); return best; }
  interact(target){
    const it = target || this.near; if (!it || window.UI.blocking()) return;
    if (it.kind === "actor" || it.kind === "static") window.UI.openEvidence(it.a);
    else if (it.kind === "console") window.UI.openConsole();
    else if (it.kind === "log") window.UI.openLog();
  }
  update(time, dt){
    if (!this.ready || this.leaving) return;
    const p = this.player, blocked = window.UI.blocking();
    let vx = 0, vy = 0;
    if (!blocked){
      if (this.keys.has("left")) vx -= 1; if (this.keys.has("right")) vx += 1;
      if (this.keys.has("up")) vy -= 1; if (this.keys.has("down")) vy += 1;
      vx += this.touchDir.x; vy += this.touchDir.y;
    }
    const len = Math.hypot(vx, vy), speed = 92;
    if (len > 0.15){
      if (this.introCam && !this.running) this.endIntroCam();
      vx = vx / Math.max(1, len) * speed; vy = vy / Math.max(1, len) * speed;
      const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
      p.dir = dir; p.anims.play(`c0-${dir}`, true);
      if (!this._moved){ this._dist = (this._dist || 0) + Math.hypot(vx, vy) * dt / 1000; if (this._dist > 26){ this._moved = true; window.UI.tutorial("moved"); } }
    } else { vx = vy = 0; if (p.anims.isPlaying){ p.anims.stop(); p.setFrame(charFrame(0, 0, p.dir)); } }
    p.setVelocity(vx, vy); p.setDepth(p.y);
    Object.values(this.actors).forEach(a => { a.sp.setDepth(a.sp.y); a.shadow.setPosition(a.sp.x, a.sp.y - 1).setVisible(a.sp.visible).setAlpha(a.sp.alpha * 0.25); a.bubble.setPosition(a.sp.x + 10, a.sp.y - 14).setDepth(a.sp.y + 2); });
    this.near = blocked ? null : this.nearest();
    this.checkExit();
    window.UI.frame(this);
  }

  /* ---------- Running the scenario ---------- */
  clearFx(){ this.fx.forEach(f => { try { f.destroy(); } catch(e){} }); this.fx = []; }
  runAttempts(initial){
    if (this.running) return false;
    const errs = this.def.validate(this.run); if (errs.length){ window.UI.toast(errs[0], "no"); return false; }
    this.running = true; this.clearFx();
    const results = this.def.simulate(this.run);
    if (!initial){ this.run.tests++; this.persist(); this.showOverview(true); }
    this.run.results = results;
    const byDoor = {};
    Object.values(this.actors).filter(a => !a.isPrediction).forEach(a => {
      this.tweens.killTweensOf(a.sp); a.sp.setVisible(true).setAlpha(a.baseAlpha); a.bubble.setVisible(false);
      if (a.state !== "origin") a.sp.setPosition(a.data.wait[0] * TS, a.data.wait[1] * TS);
      a.state = "waiting"; a.result = results.res[a.id]; (byDoor[a.door] = byDoor[a.door] || []).push(a);
    });
    this.slots.forEach(b => this.gateState(b.key, "idle"));
    const start = () => {
      let pending = Object.keys(byDoor).length;
      const finish = () => { if (--pending > 0) return; this.time.delayedCall(reduced() ? 50 : 350, () => this.afterRun(results, initial)); };
      if (!pending){ pending = 1; finish(); return; }
      Object.entries(byDoor).forEach(([door, line], gi) => {
        const next = i => { if (i >= line.length) return finish(); this.passGate(line[i], door, () => next(i + 1)); };
        this.time.delayedCall(reduced() ? 0 : (initial ? 0 : 500) + gi * 180, () => next(0));
      });
    };
    if (this.def.prelude && !initial) this.def.prelude(this, this.run, results, start); else start();
    window.UI.refreshHUD();
    return true;
  }
  passGate(a, key, done){
    const g = this.gates[key], b = g.b, res = a.result, ok = res.outcome === "in", rm = reduced();
    const front = [b.cx / TS + (a.data.wait[0] < b.cx / TS ? -0.3 : 0.3), b.frontY];
    a.endFace = "up";
    const go = () => this.walk(a, [front], 80, () => {
      this.gateState(key, "scan");
      this.time.delayedCall(rm ? 120 : 380, () => {
        const decide = () => {
          if (res.outcome === "pending"){
            this.gateState(key, "idle"); this.showBubble(a, res.icon || "env");
            if (this.def.onResult) this.def.onResult(this, a, res);
            this.time.delayedCall(rm ? 60 : 500, () => { a.endFace = "up"; this.walk(a, [a.data.wait], 70, () => { a.state = "waiting"; done(); }); });
          } else if (ok){
            this.gateState(key, "open"); this.showBubble(a, "ok");
            this.walk(a, [[b.cx / TS, b.inY[0]], [b.cx / TS, b.inY[1]]], 70, () => {
              const end = () => { a.sp.setVisible(false); a.bubble.setVisible(false); a.state = "inside"; this.gateState(key, "idle");
                if (!a.isPrediction){ const B = this.bld[key]; if (res.alarm || a.data.legit === false) this.setBuilding(key, "alarm"); else if (B.status !== "alarm") this.setBuilding(key, "online"); }
                if (this.def.onResult) this.def.onResult(this, a, res);
                done(); };
              if (rm) end(); else this.tweens.add({ targets:a.sp, alpha:0, duration:200, onComplete:end });
            });
          } else {
            this.gateState(key, "denied"); this.cameras.main.shake(rm ? 0 : 90, 0.0025);
            if (!rm) this.tweens.add({ targets:a.sp, x:a.sp.x + 2, duration:50, yoyo:true, repeat:3 });
            if (this.def.onResult) this.def.onResult(this, a, res);
            this.time.delayedCall(rm ? 60 : 380, () => { a.endFace = "up"; this.walk(a, [a.data.wait], 70, () => { a.state = "waiting"; this.showBubble(a, "no"); this.gateState(key, "idle"); done(); }); });
          }
        };
        const steps = [];
        if (res.pre) steps.push(cb => { this.showBubble(a, res.pre); this.time.delayedCall(rm ? 120 : 520, cb); });
        if (res.approver && this.statics[res.approver]) steps.push(cb => { const s = this.statics[res.approver]; this.showBubble(s, res.approved ? "ok" : "no", 1400); window.UI.floatText(s.sp.x, s.sp.y - 18, res.approved ? "Approved" : "Denied", res.approved ? "ok" : "no"); this.time.delayedCall(rm ? 120 : 600, cb); });
        const runSteps = i => i < steps.length ? steps[i](() => runSteps(i + 1)) : decide();
        runSteps(0);
      });
    });
    if (a.data.time){ window.UI.floatText(b.cx, (b.y + 10.2) * TS, a.data.time, "time"); if (!rm){ this.time.delayedCall(450, go); return; } }
    go();
  }
  afterRun(results, initial){
    this.running = false;
    const st = this.def.status ? this.def.status(this.run, results) : null;
    this.slots.forEach(b => {
      if (st && st[b.key]) return this.setBuilding(b.key, st[b.key]);
      const here = Object.values(this.actors).filter(a => a.door === b.key && a.result && !a.isPrediction);
      const attackIn = here.some(a => a.result.outcome === "in" && (a.result.alarm || a.data.legit === false)), legitIn = here.some(a => a.data.legit !== false && a.result.outcome === "in");
      this.setBuilding(b.key, attackIn ? "alarm" : (legitIn || !here.length) ? (here.length ? "online" : "idle") : "offline");
    });
    window.UI.refreshHUD();
    if (initial){ this.endIntroCam(); window.UI.afterIntro(); return; }
    this.introCam = true;
    if (results.solved && this.run.solvedAtTest == null){ this.run.solvedAtTest = this.run.tests; this.persist(); }
    this.time.delayedCall(reduced() ? 0 : 300, () => window.UI.afterRun(results));
  }
  stream(from, to, tint){
    if (reduced()){ const l = this.add.line(0, 0, from.x, from.y, to.x, to.y, tint, 0.6).setOrigin(0, 0).setDepth(5500); this.fx.push(l); return; }
    for (let i = 0; i < 6; i++){
      const p = this.add.image(from.x, from.y, "spark").setTint(tint).setDepth(5500).setScale(2);
      this.tweens.add({ targets:p, x:to.x, y:to.y, duration:1400, repeat:-1, delay:i * 230 }); this.fx.push(p);
    }
  }
  timeSkip(text, done){ window.UI.timeSkip(text); this.time.delayedCall(reduced() ? 300 : 1300, done); }
  celebrate(){
    this.slots.forEach((b, i) => this.time.delayedCall(reduced() ? 0 : i * 220, () => this.burst(b.cx, (b.y + 7.5) * TS, [0x42dfab, 0x64e0f0, 0xf5c84c][i % 3], 40)));
    if (!reduced()) this.cameras.main.flash(250, 160, 255, 220);
  }
  burst(x, y, tint, n){
    if (reduced()) return;
    const em = this.add.particles(x, y, "spark", { speed:{ min:30, max:110 }, angle:{ min:200, max:340 }, gravityY:140, lifespan:900, scale:{ start:1.4, end:0 }, tint, quantity:0, emitting:false, blendMode:"ADD" });
    em.setDepth(6000); em.explode(n); this.time.delayedCall(1200, () => em.destroy());
  }

  /* ---------- Prediction: a fresh case under the player's own configuration ---------- */
  startPrediction(){
    const d = this.def, run = this.run, st = SAVE.levelState(this.levelId);
    const pool0 = d.variants[run.level].predictions, fresh = pool0.filter(p => !st.predUsed.includes(p)), pool = fresh.length ? fresh : pool0;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const data = d.predictActor(id, run), res = d.simulateOne(run, data);
    run.pred = { id, truth:d.predictTruth(res), choice:null }; run.phase = "predict"; this.persist();
    const a = this.makeActor("pred-" + id, data, true); a.result = res; a.endFace = "up";
    this.walk(a, this.pathToWait(a), 75, () => { a.state = "waiting"; this.showBubble(a, "ask"); window.UI.askPrediction(a); });
    window.UI.coach(d.predictComing(data));
    return a;
  }
  playPrediction(a, done){ this.showOverview(true); this.passGate(a, a.door, () => this.time.delayedCall(reduced() ? 0 : 400, () => { this.introCam = true; done(); })); }
  restart(level){ SAVE.saveRun(this.levelId, null); if (level) SAVE.forceLevel(this.levelId, level); window.UI.onLeave(); this.scene.restart({ levelId:this.levelId, entry:"start" }); }
  goLevel(id){ window.UI.onLeave(); this.scene.restart({ levelId:id, entry:"start" }); }
}

function start(){
  SAVE.load(); SAVE.markDay(); SAVE.save();
  window.__ID_PHASER = new Phaser.Game({
    type:Phaser.AUTO, parent:"game", backgroundColor:"#151a2a", pixelArt:true, roundPixels:true,
    scale:{ mode:Phaser.Scale.RESIZE, width:window.innerWidth, height:window.innerHeight },
    physics:{ default:"arcade", arcade:{ debug:false } },
    loader:{ imageLoadType:"HTMLImageElement" },
    scene:[Boot, World]
  });
}
window.IDGame = { start, VERSION, TS, PROPS };
})();
