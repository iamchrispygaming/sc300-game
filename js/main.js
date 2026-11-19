/* Identity Defender · campus world, player, NPC sign-ins and the access-gate simulation (Phaser 3). */
(function () {
"use strict";
const E = window.CAEngine, LAB = window.ID_LAB, M = LAB.missions.mml, SAVE = window.IDSave;
const TS = 16, W = 36, H = 28, VERSION = "3.0.0";
const LEVELS = ["", "Guided", "Standard", "Advanced"];
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- Motion preference ---------- */
function reduced(){ const m = SAVE.state.lab.game.settings.motion; if (m === "reduce") return true; if (m === "full") return false; return matchMedia("(prefers-reduced-motion: reduce)").matches; }

/* ---------- World layout (tile coordinates) ---------- */
const BUILDINGS = [
  { app:"sharepoint", label:"SharePoint", x:2,  roof:"B", facade:"orange", sign:"sign_doc" },
  { app:"teams",      label:"Teams",      x:14, roof:"C", facade:"red",    sign:"sign_chat" },
  { app:"outlook",    label:"Outlook",    x:26, roof:"A", facade:"red",    sign:"sign_mail" }
];
BUILDINGS.forEach(b => { b.cx = (b.x + 4) * TS; b.gateY = 9 * TS - 1; });
const ROOF = { A:[89,90,91,116,117,118,143,144,145], B:[8,9,10,35,36,37,62,63,64], C:[81,82,83,108,109,110,135,136,137] };
const FACADE = { red:[17,18,19,44,45,46,71,72,73,98,99,100], orange:[125,126,127,152,153,154,179,180,181,206,207,208] };
const CONSOLE = { x:23, y:12.6 };          // SOC console (tile coords of its feet)
const RACKS = [ { x:21.5, y:12.4 }, { x:24.5, y:12.4 } ];
const SPAWN = { x:23, y:15.2 };
/* Where each sign-in comes from (network location in the world) and where it queues */
const PLACES = {
  ana:{ origin:[28.4,21.4], wait:[29.2,10.7], char:1 },
  jun:{ origin:[6,22.5],  wait:[5.3,10.7], char:4 },
  priya:{ origin:[25.5,22.3], wait:[17.4,10.7], char:5 },
  attacker:{ origin:[31.6,26.3], wait:[31.0,11.0], char:3, tint:0x8a7fd0 },
  imap:{ origin:[34.6,20.3], wait:[27.6,11.6], drone:true },
  bg:{ origin:[24.4,21.3], wait:[7.0,11.0], char:2 },
  lena:{ origin:[27,23.3], wait:[29.8,12.4], char:1, tint:0xa8e2ff },
  omar:{ origin:[9.5,24.0], wait:[6.2,12.4], char:4, tint:0xffd8a8 },
  spray:{ origin:[30.4,26.7], wait:[18.8,12.1], char:3, tint:0x7f78c8 }
};
const DIR_COL = { left:23, down:24, up:25, right:26 };
const charFrame = (k, step, dir) => (3 * k + step) * 27 + DIR_COL[dir];

/* ---------- Mission run state ---------- */
function newRun(level){
  const v = M.variants[level];
  return { level, policies:Object.fromEntries(v.policies.map(id => [id, clone(M.basePolicies[id])])), order:v.policies.slice(),
    variantActors:v.actors.slice(), requirements:v.requirements.slice(), bonus:v.bonus.slice(),
    tests:0, hints:0, phase:"play", solvedAtTest:null, xp:0, pred:null, results:null, undo:[], startedAt:Date.now() };
}

class Boot extends Phaser.Scene {
  constructor(){ super("boot"); }
  preload(){
    const bar = document.getElementById("loadbar");
    this.load.on("progress", p => { if (bar) bar.style.width = Math.round(p * 100) + "%"; });
    const v = "?v=" + VERSION;
    this.load.spritesheet("urban", "assets/kenney-rpg-urban/tilemap_packed.png" + v, { frameWidth:16, frameHeight:16 });
    this.load.spritesheet("gate", "assets/original/gate.png" + v, { frameWidth:48, frameHeight:40 });
    this.load.spritesheet("console", "assets/original/console.png" + v, { frameWidth:32, frameHeight:32 });
    this.load.spritesheet("drone", "assets/original/drone.png" + v, { frameWidth:16, frameHeight:16 });
    this.load.spritesheet("rack", "assets/original/rack.png" + v, { frameWidth:16, frameHeight:32 });
    this.load.spritesheet("bubbles", "assets/original/bubbles.png" + v, { frameWidth:12, frameHeight:12 });
    this.load.spritesheet("lamp", "assets/original/lamp.png" + v, { frameWidth:6, frameHeight:6 });
    ["mail","doc","chat"].forEach(k => this.load.image("sign_" + k, "assets/original/sign_" + k + ".png" + v));
    this.load.image("chevron", "assets/original/chevron.png" + v);
    this.load.on("loaderror", f => { window.__ID_ERRORS = (window.__ID_ERRORS || []).concat("asset:" + f.key); });
  }
  create(){ this.scene.start("world"); }
}

class World extends Phaser.Scene {
  constructor(){ super("world"); }
  create(){
    const S = SAVE.state;
    this.S = S; this.G = S.lab.game;
    this.keys = new Set(); this.touchDir = { x:0, y:0 };
    this.makeTextures();
    this.buildMap();
    this.buildBuildings();
    this.buildGates();
    this.buildProps();
    this.makeAnims();
    // Mission run (restored if one is in progress at the same level)
    const lvl = SAVE.levelFor();
    const saved = this.G.run;
    this.run = (saved && saved.level && M.variants[saved.level] && saved.phase === "play") ? Object.assign(newRun(saved.level), saved, { undo:[], results:null }) : newRun(lvl);
    this.run.phase = "play";
    this.persist();
    this.spawnPlayer();
    this.spawnActors();
    this.setupCamera();
    this.setupInput();
    window.UI.bind(this);
    window.UI.refreshHUD();
    this.intro();
    this.scale.on("resize", () => this.fitCamera());
    window.__ID_GAME = this;       // test hook
    this.ready = true;
  }
  persist(){ const r = Object.assign({}, this.run); delete r.undo; delete r.results; this.G.run = r; SAVE.save(); }

  /* ---------- Textures made in code (glow, sparks, marker) ---------- */
  makeTextures(){
    const glow = this.textures.createCanvas("glow", 64, 64), c = glow.getContext();
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.35, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); glow.refresh();
    const gr = this.make.graphics({ x:0, y:0, add:false });
    gr.fillStyle(0xffffff, 1); gr.fillRect(0, 0, 2, 2); gr.generateTexture("spark", 2, 2); gr.clear();
    gr.fillStyle(0x5c6278, 1); gr.fillTriangle(0, 0, 10, 0, 5, 7); gr.fillStyle(0xf5c84c, 1); gr.fillTriangle(2, 1, 8, 1, 5, 5); gr.generateTexture("marker", 10, 8); gr.clear();
    gr.fillStyle(0x64e0f0, 1); gr.fillRect(0, 0, 3, 3); gr.generateTexture("packet", 3, 3); gr.destroy();
  }

  /* ---------- Tile map ---------- */
  buildMap(){
    const map = this.make.tilemap({ width:W, height:H, tileWidth:TS, tileHeight:TS });
    const ts = map.addTilesetImage("urban", "urban", 16, 16, 0, 0);
    const ground = map.createBlankLayer("ground", ts), deco = map.createBlankLayer("deco", ts);
    this.map = map; this.ground = ground; this.deco = deco;
    const put = (L, t, x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) L.putTileAt(t, x, y); };
    const block = (L, set, x0, y0, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
      const cx = x === 0 ? 0 : x === w - 1 ? 2 : 1, cy = y === 0 ? 0 : y === h - 1 ? 2 : 1; put(L, set[cy * 3 + cx], x0 + x, y0 + y); } };
    // North: grass and trees between the app buildings
    block(ground, [0,1,2,27,28,29,54,55,56], 0, 0, W, 7);
    // Sidewalk in front of buildings, then the plaza
    for (let x = 0; x < W; x++){ put(ground, 36, x, 7); put(ground, 36, x, 8); }
    block(ground, [81,82,83,108,109,110,135,136,137], 0, 9, W, 10);
    // Lanes from the plaza to each gate
    BUILDINGS.forEach(b => { for (let y = 9; y < 18; y++) for (let x = b.x + 2; x < b.x + 5; x++) put(ground, 36, x, y); });
    for (let x = 1; x < W - 1; x++) put(ground, 36, x, 16);
    // Security operations pad around the console
    block(ground, [8,9,10,35,36,37,62,63,64], 20, 10, 6, 4);
    // South-west: Halcyon office (named location), south-east: internet street
    block(ground, [89,90,91,116,117,118,143,144,145], 0, 19, 17, 9);
    block(ground, [0,1,2,27,28,29,54,55,56], 17, 19, 3, 9);
    for (let x = 20; x < W; x++){ put(ground, 36, x, 19); put(ground, 36, x, 20); put(ground, 406, x, 21); put(ground, 433, x, 22); put(ground, 433, x, 23); put(ground, 460, x, 24); put(ground, 36, x, 25); put(ground, 469 === 0 ? 36 : 461, x, 26); put(ground, 461, x, 27); }
    for (let y = 21; y < 25; y++){ put(ground, 405, 22, y); }
    // Perimeter fence with gaps for the gates
    for (let x = 0; x < W; x++){
      const gap = BUILDINGS.some(b => x >= b.x + 2 && x < b.x + 5);
      if (!gap) put(deco, x % 2 ? 356 : 355, x, 8);
    }
    // Divider hedge between plaza and the south zones, with openings
    for (let x = 0; x < W; x++){
      const open = (x >= 5 && x <= 7) || (x >= 17 && x <= 19) || (x >= 28 && x <= 31);
      if (!open){ const l = [0, 8, 20, 32].includes(x), r = [4, 16, 27, W - 1].includes(x); put(deco, l ? 328 : r ? 330 : 329, x, 18); }
    }
    // Ambient tint: a cool, late-evening campus (WebGL)
    try { ground.setTint && ground.setTint(0xc9d2f5); deco.setTint && deco.setTint(0xc9d2f5); } catch(e){}
    ground.setDepth(0); deco.setDepth(1);
    // Solid areas for the player
    this.solids = this.physics.add.staticGroup();
    const solid = (x, y, w, h) => { const r = this.add.rectangle(x * TS + w * TS / 2, y * TS + h * TS / 2, w * TS, h * TS); r.setVisible(false); this.physics.add.existing(r, true); this.solids.add(r); return r; };
    solid(0, 0, W, 8.7);                                  // buildings, sidewalk, fence and gates
    [[0,5],[8,9],[20,8],[32,4]].forEach(([x, w]) => solid(x, 18.2, w, 0.8));   // hedge segments
    solid(CONSOLE.x - 1.1, CONSOLE.y - 0.9, 2.2, 0.9);    // console desk
    RACKS.forEach(r => solid(r.x - 0.45, r.y - 0.6, 0.9, 0.6));
    this.solid = solid;
  }

  /* ---------- App buildings with visible health ---------- */
  buildBuildings(){
    const put = (t, x, y) => this.ground.putTileAt(t, x, y);
    this.bld = {};
    BUILDINGS.forEach(b => {
      const R = ROOF[b.roof], F = FACADE[b.facade];
      for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++){ const cx = x === 0 ? 0 : x === 7 ? 2 : 1; put(R[y * 3 + cx], b.x + x, y); }
      for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++){ const cx = x === 0 ? 0 : x === 7 ? 2 : 1; put(F[y * 3 + cx], b.x + x, 3 + y); }
      const deco = (t, x, y) => this.deco.putTileAt(t, x, y);
      [1, 2, 5, 6].forEach(x => deco(335, b.x + x, 4)); deco(362, b.x + 1, 5); deco(362, b.x + 6, 5);
      deco(412, b.x + 3, 5); deco(413, b.x + 4, 5);
      // window light overlays (lit = app healthy)
      const wins = [[1,4],[2,4],[5,4],[6,4],[1,5],[6,5]].map(([x, y]) => {
        const r = this.add.rectangle((b.x + x) * TS + 8, y * TS + 8, 8, 10, 0xffe39a, 0.0).setDepth(2).setBlendMode(Phaser.BlendModes.ADD); return r; });
      const sign = this.add.image(b.cx, 3 * TS + 8, b.sign).setDepth(3);
      const signGlow = this.add.image(b.cx, 3 * TS + 8, "glow").setDepth(3).setScale(1.4, 0.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setTint(0x64e0f0);
      const lamp = this.add.sprite(b.x * TS + 8 * TS - 10, 3 * TS + 6, "lamp", 0).setDepth(3);
      const dark = this.add.rectangle(b.x * TS + 4 * TS, 3.5 * TS + 8 + 8, 8 * TS, 3 * TS, 0x0a0e1c, 0).setDepth(2.5);
      this.bld[b.app] = { b, wins, sign, signGlow, lamp, dark, status:"unknown" };
    });
  }
  setBuilding(app, status){
    const B = this.bld[app]; if (!B || B.status === status) return;
    const prev = B.status; B.status = status;
    this.tweens.killTweensOf([B.sign, B.signGlow, ...B.wins, B.dark]);
    const tint = { online:0x64e0f0, offline:0x46506e, alarm:0xff5e5e }[status];
    B.lamp.setFrame(status === "online" ? 1 : 0);
    B.signGlow.setTint(tint);
    if (status === "online"){
      B.wins.forEach((w, i) => this.tweens.add({ targets:w, fillAlpha:0.55, duration: reduced() ? 0 : 300, delay: reduced() ? 0 : i * 70 }));
      this.tweens.add({ targets:B.dark, fillAlpha:0, duration: reduced() ? 0 : 400 });
      B.sign.setAlpha(1).clearTint(); B.signGlow.setAlpha(0.45);
      if (prev === "offline" || prev === "alarm"){ this.burst(B.b.cx, 4 * TS, 0x9fffd2, 26); window.UI.floatText(B.b.cx, 2.2 * TS, B.b.label + " back online", "ok"); }
    } else if (status === "offline"){
      B.wins.forEach(w => w.fillAlpha = 0); B.dark.fillAlpha = 0.35; B.sign.setTint(0x7d86a8);
      if (!reduced()) this.tweens.add({ targets:[B.sign, B.signGlow], alpha:{ from:0.55, to:0.25 }, duration:180, yoyo:true, repeat:-1, repeatDelay:1400 });
      else { B.sign.setAlpha(0.6); B.signGlow.setAlpha(0.15); }
    } else if (status === "alarm"){
      B.wins.forEach(w => { w.fillColor = 0xff5e5e; w.fillAlpha = 0.5; }); B.dark.fillAlpha = 0.1; B.sign.setTint(0xff8a8a);
      if (!reduced()) this.tweens.add({ targets:[...B.wins, B.signGlow], alpha:{ from:1, to:0.25 }, duration:260, yoyo:true, repeat:-1 });
      window.UI.floatText(B.b.cx, 2.2 * TS, "Attacker inside " + B.b.label + "!", "no");
    }
    if (status !== "alarm") B.wins.forEach(w => { w.fillColor = 0xffe39a; w.alpha = 1; });
    window.UI.refreshBuildingTags();
  }

  /* ---------- Access gates: one Conditional Access checkpoint per app ---------- */
  buildGates(){
    this.gates = {};
    BUILDINGS.forEach(b => {
      const s = this.add.sprite(b.cx, b.gateY, "gate", 0).setOrigin(0.5, 1).setDepth(b.gateY);
      const glow = this.add.image(b.cx, b.gateY - 14, "glow").setBlendMode(Phaser.BlendModes.ADD).setScale(1.3, 0.8).setAlpha(0.4).setTint(0xf5a94c).setDepth(b.gateY + 1);
      this.gates[b.app] = { b, s, glow, queue:[] };
    });
  }
  gateState(app, st){
    const g = this.gates[app]; const f = { idle:0, scan:1, open:2, denied:3 }[st];
    g.s.setFrame(f); g.glow.setTint([0xf5a94c, 0x64e0f0, 0x42dfab, 0xff5e5e][f]).setAlpha(st === "idle" ? 0.35 : 0.7);
  }

  /* ---------- Props, environment animation ---------- */
  buildProps(){
    const tall = (top, bottom, x, y) => { const d = (y + 1) * TS; this.add.image(x * TS + 8, y * TS + 8, "urban", bottom).setDepth(d - 1); this.add.image(x * TS + 8, (y - 1) * TS + 8, "urban", top).setDepth(d - 1); };
    const prop = (t, x, y, solid) => { const im = this.add.image(x * TS + 8, y * TS + 8, "urban", t).setDepth((y + 1) * TS - 2); if (solid) this.solid(x + 0.1, y + 0.4, 0.8, 0.6); return im; };
    // trees between buildings
    [[0.5,4],[11.2,4],[12.6,5],[23.2,4],[24.6,5],[34.4,4]].forEach(([x, y]) => tall(232, 259, x, y));
    // plaza furniture
    [[1,13],[33,13]].forEach(([x, y]) => { tall(162, 189, x, y); this.add.image(x * TS + 6, (y - 1) * TS + 2, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff0c0).setAlpha(0.5).setDepth(5000); this.solid(x + 0.3, y + 0.5, 0.4, 0.5); });
    [[10,14],[11,14]].forEach(([x, y], i) => prop(270 + i, x, y, true));
    prop(279, 2, 10, true); prop(286, 13.6, 14.5, true); prop(287, 33.5, 15.2, true);
    // office zone (named location)
    [[2,21],[3,21],[12,21],[13,21]].forEach(([x, y], i) => prop(i % 2 ? 271 : 270, x, y, true));
    prop(281, 15, 20, true); prop(282, 15.9, 20, true); prop(286, 1, 25.5, true); prop(287, 14.8, 25.5, true);
    // street (internet): bus shelter, van in the alley, street lamps
    [[359,360,361],[386,387,388]].forEach((row, j) => row.forEach((t, i) => this.add.image((21 + i) * TS + 8, (19 + j) * TS + 8, "urban", t).setDepth((20 + 1) * TS - 4)));
    this.solid(21, 19.5, 3, 1.2);
    [[426,427],[453,454]].forEach((row, j) => row.forEach((t, i) => this.add.image((33 + i) * TS + 8, (25 + j) * TS + 8, "urban", t).setDepth(27 * TS)));
    this.solid(33, 25.3, 2, 1.6);
    tall(168, 195, 26, 20); tall(168, 195, 35, 20);
    [[18.5,21],[18.6,25]].forEach(([x, y]) => tall(238, 265, x, y));
    // Security operations: console and server racks
    this.console = this.add.sprite(CONSOLE.x * TS, CONSOLE.y * TS, "console", 0).setOrigin(0.5, 1).setDepth(CONSOLE.y * TS);
    this.add.image(CONSOLE.x * TS, CONSOLE.y * TS - 22, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(0x64e0f0).setScale(0.9, 0.6).setAlpha(0.45).setDepth(CONSOLE.y * TS + 1);
    this.racks = RACKS.map(r => this.add.sprite(r.x * TS, r.y * TS, "rack", 0).setOrigin(0.5, 1).setDepth(r.y * TS));
    this.anims.create({ key:"rack-blink", frames:this.anims.generateFrameNumbers("rack", { start:0, end:1 }), frameRate:2, repeat:-1 });
    this.anims.create({ key:"console-run", frames:this.anims.generateFrameNumbers("console", { start:0, end:1 }), frameRate:3, repeat:-1 });
    this.anims.create({ key:"drone-fly", frames:this.anims.generateFrameNumbers("drone", { start:0, end:1 }), frameRate:6, repeat:-1 });
    this.racks.forEach((r, i) => { r.play("rack-blink"); r.anims.setProgress(i * 0.5); });
    this.console.play("console-run");
    // Data packets drifting up each lane toward its gate: the sign-in traffic
    this.packets = BUILDINGS.map(b => {
      const p = this.add.image(b.cx, 17 * TS, "packet").setDepth(3).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      if (!reduced()) this.tweens.add({ targets:p, y:9.6 * TS, alpha:{ from:0.9, to:0 }, duration:2600, repeat:-1, delay:Phaser.Math.Between(0, 1600) });
      return p;
    });
    // Zone signage (DOM labels, crisp text)
    this.zoneTags = [
      { x:8.5 * TS, y:19.6 * TS, html:"<b>Halcyon office</b><span>Named location · trusted network</span>", cls:"zone office" },
      { x:24 * TS, y:22.2 * TS, html:"<b>Internet</b><span>Home, travel, unknown networks</span>", cls:"zone net" },
      { x:CONSOLE.x * TS, y:(CONSOLE.y - 2.6) * TS, html:"<b>Security console</b><span>Conditional Access</span>", cls:"zone soc" }
    ];
  }

  makeAnims(){
    for (let k = 0; k < 6; k++) ["down","up","left","right"].forEach(dir => {
      this.anims.create({ key:`c${k}-${dir}`, frames:[1, 0, 2, 0].map(s => ({ key:"urban", frame:charFrame(k, s, dir) })), frameRate:8, repeat:-1 });
    });
  }

  /* ---------- Player ---------- */
  spawnPlayer(){
    const p = this.physics.add.sprite(SPAWN.x * TS, SPAWN.y * TS, "urban", charFrame(0, 0, "down")).setOrigin(0.5, 0.9);
    p.body.setSize(9, 5).setOffset(3.5, 9.5);
    p.setCollideWorldBounds(true); p.dir = "down"; p.k = 0;
    this.physics.world.setBounds(0, 0, W * TS, H * TS);
    this.physics.add.collider(p, this.solids);
    this.player = p;
    this.youTag = { x:0, y:0 };
  }

  /* ---------- NPC sign-ins ---------- */
  spawnActors(){
    this.actors = {};
    this.run.variantActors.forEach(id => this.makeActor(id, M.actors[id], false));
  }
  makeActor(id, data, isPrediction){
    const P = PLACES[id];
    let sp;
    if (P.drone){ sp = this.add.sprite(P.origin[0] * TS, P.origin[1] * TS, "drone", 0).setOrigin(0.5, 1); sp.play("drone-fly"); }
    else { sp = this.add.sprite(P.origin[0] * TS, P.origin[1] * TS, "urban", charFrame(P.char, 0, "up")).setOrigin(0.5, 0.9); if (P.tint) sp.setTint(P.tint); }
    if (data.kind === "attacker"){ try { if (sp.preFX) sp.preFX.addGlow(0xff4d6d, 2, 0, false, 0.1, 6); } catch(e){} }
    const shadow = this.add.ellipse(sp.x, sp.y, 10, 4, 0x000000, 0.25).setDepth(2);
    const bubble = this.add.sprite(sp.x, sp.y - 20, "bubbles", 0).setVisible(false);
    const a = { id, data, P, sp, shadow, bubble, state:"origin", result:null, isPrediction, app:data.app };
    this.actors[id] = a;
    return a;
  }
  face(a, dir){ if (a.P.drone) return; a.sp.setFrame(charFrame(a.P.char, 0, dir)); }
  /* Walk an actor along waypoints (tile coords). Reduced motion: jump to the end. */
  walk(a, pts, speed, done){
    const go = i => {
      if (i >= pts.length){ if (!a.P.drone){ a.sp.anims.stop(); this.face(a, a.endFace || "up"); } done && done(); return; }
      const tx = pts[i][0] * TS, ty = pts[i][1] * TS, dx = tx - a.sp.x, dy = ty - a.sp.y, dist = Math.hypot(dx, dy);
      if (reduced() || dist < 1){ a.sp.setPosition(tx, ty); go(i + 1); return; }
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      if (!a.P.drone) a.sp.play(`c${a.P.char}-${dir}`, true);
      this.tweens.add({ targets:a.sp, x:tx, y:ty, duration:dist / speed * 1000, onComplete:() => go(i + 1) });
    };
    go(0);
  }
  pathToWait(a){
    const [ox, oy] = a.P.origin, [wx, wy] = a.P.wait;
    const lane = BUILDINGS.find(b => b.app === a.app), lx = lane ? lane.cx / TS : wx;
    return [[ox, 19.8], [lx, 19.8], [lx, wy + 1.2], [wx, wy]];
  }
  showBubble(a, kind){ const f = { ok:0, no:1, mfa:2, ask:3 }[kind]; a.bubble.setFrame(f).setVisible(true).setScale(1);
    if (!reduced()) this.tweens.add({ targets:a.bubble, scale:{ from:0.3, to:1 }, duration:180, ease:"Back.Out" }); }

  /* ---------- Opening: this morning's sign-ins hit Friday's policies ---------- */
  intro(){
    this.showOverview(true, true); this.introCam = true;
    window.UI.coach(this.G.tutorialDone ? "Monday 9:02. Sign-ins are piling up at the gates." : "Move with <kbd>WASD</kbd> or the arrow keys.", this.G.tutorialDone ? null : "move");
    const ids = Object.keys(this.actors);
    this._arrived = 0;
    ids.forEach((id, i) => {
      const a = this.actors[id];
      const go = () => { a.endFace = "up"; this.walk(a, this.pathToWait(a), 150, () => { a.state = "waiting"; if (++this._arrived === ids.length) this.runSignins(true); }); };
      if (reduced()) go(); else this.time.delayedCall(200 + i * 160, go);
    });
  }

  /* ---------- Camera ---------- */
  setupCamera(){
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W * TS, H * TS); cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.14, 0.14);
    this.fitCamera();
  }
  playZoom(){ const w = this.scale.width, h = this.scale.height; return Phaser.Math.Clamp(Math.floor(Math.min(w / 360, h / 230)), 2, 4); }
  overviewZoom(){ const w = this.scale.width, h = this.scale.height; const z = Math.min(w / (W * TS), h / (15.5 * TS)); return z >= 2 ? Math.floor(z) : Math.max(0.5, z); }
  fitCamera(){ const cam = this.cameras.main; if (this.overview) cam.setZoom(this.overviewZoom()); else cam.setZoom(this.playZoom()); }
  endIntroCam(){ if (!this.introCam) return; this.introCam = false; this.showOverview(false); }
  showOverview(on, instant){
    const cam = this.cameras.main; this.overview = on;
    if (on){ cam.stopFollow(); cam.removeBounds(); const z = this.overviewZoom(), cy = Math.min(H * TS / 2, this.scale.height / z / 2) + 2;
      if (reduced() || instant){ cam.setZoom(z); cam.centerOn(W * TS / 2, cy); } else { cam.zoomTo(z, 450, "Sine.easeInOut"); cam.pan(W * TS / 2, cy, 450, "Sine.easeInOut"); } }
    else { const z = this.playZoom(); cam.setBounds(0, 0, W * TS, H * TS); if (reduced()) cam.setZoom(z); else cam.zoomTo(z, 400, "Sine.easeInOut"); cam.startFollow(this.player, true, 0.14, 0.14); }
  }

  /* ---------- Input (own key handling so DOM controls keep their keys) ---------- */
  setupInput(){
    const map = { ArrowUp:"up", KeyW:"up", ArrowDown:"down", KeyS:"down", ArrowLeft:"left", KeyA:"left", ArrowRight:"right", KeyD:"right" };
    this._kd = e => {
      if (window.UI.blocking() || /input|textarea|select/i.test(e.target.tagName)) return;
      if (map[e.code]){ this.keys.add(map[e.code]); e.preventDefault(); }
      else if (["KeyE","Space","Enter"].includes(e.code) && !e.repeat){ if (e.target.tagName === "BUTTON" && e.code !== "KeyE") return; e.preventDefault(); this.interact(); }
      else if (e.code === "KeyH" && !e.repeat){ window.UI.hint(); }
      else if (e.code === "KeyL" && !e.repeat){ window.UI.openLog(); }
    };
    this._ku = e => { if (map[e.code]) this.keys.delete(map[e.code]); };
    window.addEventListener("keydown", this._kd); window.addEventListener("keyup", this._ku);
    window.addEventListener("blur", () => this.keys.clear());
  }

  /* ---------- Interaction ---------- */
  interactables(){
    const list = [];
    Object.values(this.actors).forEach(a => { if (a.sp.visible && a.state !== "origin-hidden") list.push({ kind:"actor", a, x:a.sp.x, y:a.sp.y - 4, label:(a.data.kind === "attacker" ? "Inspect suspicious sign-in" : a.P.drone ? "Inspect script sign-in" : "Inspect " + a.data.name.split(" ")[0] + "'s sign-in") }); });
    list.push({ kind:"console", x:CONSOLE.x * TS, y:CONSOLE.y * TS + 4, label:"Use security console" });
    RACKS.forEach(r => list.push({ kind:"log", x:r.x * TS, y:r.y * TS + 4, label:"Read sign-in logs" }));
    return list;
  }
  nearest(){
    const p = this.player; let best = null, bd = 26;
    this.interactables().forEach(it => { const d = Math.hypot(it.x - p.x, it.y - p.y); if (d < bd){ bd = d; best = it; } });
    return best;
  }
  interact(target){
    const it = target || this.near; if (!it || window.UI.blocking()) return;
    if (it.kind === "actor") window.UI.openEvidence(it.a);
    else if (it.kind === "console") window.UI.openConsole();
    else if (it.kind === "log") window.UI.openLog();
  }

  update(time, dt){
    if (!this.ready) return;
    const p = this.player, blocked = window.UI.blocking() || this.lockPlayer;
    let vx = 0, vy = 0;
    if (!blocked){
      if (this.keys.has("left")) vx -= 1; if (this.keys.has("right")) vx += 1;
      if (this.keys.has("up")) vy -= 1; if (this.keys.has("down")) vy += 1;
      vx += this.touchDir.x; vy += this.touchDir.y;
    }
    const len = Math.hypot(vx, vy); const speed = 92;
    if (len > 0.15){
      if (this.introCam) this.endIntroCam();
      vx = vx / Math.max(1, len) * speed; vy = vy / Math.max(1, len) * speed;
      const dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
      p.dir = dir; p.anims.play(`c0-${dir}`, true);
      if (!this._moved){ this._dist = (this._dist || 0) + Math.hypot(vx, vy) * dt / 1000; if (this._dist > 26){ this._moved = true; window.UI.tutorial("moved"); } }
    } else { vx = vy = 0; if (p.anims.isPlaying){ p.anims.stop(); p.setFrame(charFrame(0, 0, p.dir)); } }
    p.setVelocity(vx, vy);
    p.setDepth(p.y);
    Object.values(this.actors).forEach(a => { a.sp.setDepth(a.sp.y); a.shadow.setPosition(a.sp.x, a.sp.y - 1).setVisible(a.sp.visible).setAlpha(a.sp.alpha * 0.25); a.bubble.setPosition(a.sp.x + 10, a.sp.y - 14).setDepth(a.sp.y + 2); });
    this.near = blocked ? null : this.nearest();
    window.UI.frame(this);
  }

  /* ---------- The sign-in simulation ---------- */
  runSignins(initial){
    if (this.running) return false;
    const errs = E.validate(this.run); if (errs.length){ window.UI.toast(errs[0], "no"); return false; }
    this.running = true;
    const results = E.runAll(M, this.run);
    if (!initial){ this.run.tests++; this.persist(); this.showOverview(true); }
    this.run.results = results;
    // Everyone returns to the queue, then each gate processes its line
    const byGate = {};
    Object.values(this.actors).filter(a => !a.isPrediction).forEach(a => {
      this.tweens.killTweensOf(a.sp); a.sp.setVisible(true).setAlpha(1); a.bubble.setVisible(false);
      if (a.state !== "origin") a.sp.setPosition(a.P.wait[0] * TS, a.P.wait[1] * TS);
      a.result = results.res[a.id]; (byGate[a.app] = byGate[a.app] || []).push(a);
    });
    BUILDINGS.forEach(b => this.gateState(b.app, "idle"));
    let pending = Object.keys(byGate).length;
    const finish = () => { if (--pending > 0) return; this.time.delayedCall(reduced() ? 50 : 350, () => this.afterRun(results, initial)); };
    if (!pending) finish();
    Object.entries(byGate).forEach(([app, line], gi) => {
      const next = i => { if (i >= line.length) return finish(); this.passGate(line[i], app, () => next(i + 1)); };
      this.time.delayedCall(reduced() ? 0 : (initial ? 0 : 500) + gi * 180, () => next(0));
    });
    window.UI.refreshHUD();
    return true;
  }
  passGate(a, app, done){
    const g = this.gates[app], res = a.result, ok = E.gotIn(res), rm = reduced();
    const front = [g.b.cx / TS + (a.P.wait[0] < g.b.cx / TS ? -0.3 : 0.3), 9.35];
    a.endFace = "up";
    this.walk(a, [front], 80, () => {
      this.gateState(app, "scan");
      this.time.delayedCall(rm ? 120 : 380, () => {
        const needPhone = res.outcome === "mfa" || (res.outcome === "failed" && res.unmet.some(u => u.control === "mfa"));
        const decide = () => {
          if (ok){
            this.gateState(app, "open"); this.showBubble(a, "ok");
            a.endFace = "up";
            this.walk(a, [[g.b.cx / TS, 7.8], [g.b.cx / TS, 6.4]], 70, () => {
              const end = () => { a.sp.setVisible(false); a.bubble.setVisible(false); a.state = "inside"; this.gateState(app, "idle");
                if (!a.isPrediction){ const B = this.bld[app]; if (!a.data.legit) this.setBuilding(app, "alarm"); else if (B.status !== "alarm") this.setBuilding(app, "online"); }
                done(); };
              if (rm) end(); else this.tweens.add({ targets:a.sp, alpha:0, duration:200, onComplete:end });
            });
          } else {
            this.gateState(app, "denied"); this.cameras.main.shake(rm ? 0 : 90, 0.0025);
            if (!rm) this.tweens.add({ targets:a.sp, x:a.sp.x + 2, duration:50, yoyo:true, repeat:3 });
            this.time.delayedCall(rm ? 60 : 380, () => {
              a.endFace = "up";
              this.walk(a, [a.P.wait], 70, () => { a.state = "waiting"; this.showBubble(a, "no"); this.gateState(app, "idle"); done(); });
            });
          }
        };
        if (needPhone){ this.showBubble(a, "mfa"); this.time.delayedCall(rm ? 120 : 520, decide); } else decide();
      });
    });
  }
  afterRun(results, initial){
    this.running = false;
    // App health: online when a legitimate user got in, alarm when an attacker did
    BUILDINGS.forEach(b => {
      const here = Object.values(this.actors).filter(a => a.app === b.app && a.result && !a.isPrediction);
      const attackIn = here.some(a => !a.data.legit && E.gotIn(a.result)), legitIn = here.some(a => a.data.legit && E.gotIn(a.result));
      this.setBuilding(b.app, attackIn ? "alarm" : (legitIn || !here.length) ? "online" : "offline");
    });
    window.UI.refreshHUD();
    if (initial){ this.endIntroCam(); window.UI.afterIntro(); return; }
    // Keep the overview so the consequences stay visible; the camera returns when the player moves.
    this.introCam = true;
    this.time.delayedCall(reduced() ? 0 : 300, () => window.UI.afterRun(results));
    if (results.solved && this.run.solvedAtTest === null){ this.run.solvedAtTest = this.run.tests; this.persist(); }
  }
  celebrate(){
    BUILDINGS.forEach((b, i) => this.time.delayedCall(reduced() ? 0 : i * 220, () => this.burst(b.cx, 7.5 * TS, [0x42dfab, 0x64e0f0, 0xf5c84c][i], 40)));
    if (!reduced()) this.cameras.main.flash(250, 160, 255, 220);
  }
  burst(x, y, tint, n){
    if (reduced()) return;
    const em = this.add.particles(x, y, "spark", { speed:{ min:30, max:110 }, angle:{ min:200, max:340 }, gravityY:140, lifespan:900, scale:{ start:1.4, end:0 }, tint, quantity:0, emitting:false, blendMode:"ADD" });
    em.setDepth(6000); em.explode(n);
    this.time.delayedCall(1200, () => em.destroy());
  }

  /* ---------- Prediction: a fresh sign-in under the player's policies ---------- */
  startPrediction(){
    const v = M.variants[this.run.level], ms = this.S.lab.missions.gates;
    const fresh = v.predictions.filter(p => !ms.predUsed.includes(p)), pool = fresh.length ? fresh : v.predictions;
    const id = pool[Math.floor(Math.random() * pool.length)];
    const data = M.predictions[id];
    const res = E.simulate(M, this.run.order.map(x => this.run.policies[x]), data);
    const truth = E.gotIn(res) ? (res.outcome === "mfa" ? "mfa" : "allowed") : "stopped";
    this.run.pred = { id, truth, choice:null }; this.run.phase = "predict"; this.persist();
    const a = this.makeActor(id, data, true); a.result = res;
    a.endFace = "up";
    this.walk(a, this.pathToWait(a), 75, () => { a.state = "waiting"; this.showBubble(a, "ask"); window.UI.askPrediction(a); });
    window.UI.coach("A new sign-in is on its way: <b>" + (data.kind === "attacker" ? "someone using Ana's password" : data.name) + "</b>.");
    return a;
  }
  playPrediction(a, done){
    this.showOverview(true);
    this.passGate(a, a.app, () => this.time.delayedCall(reduced() ? 0 : 400, () => { this.introCam = true; done(); }));
  }

  /* ---------- Config helpers used by the console ---------- */
  resetWorld(){
    Object.values(this.actors).forEach(a => { if (a.isPrediction){ a.sp.destroy(); a.shadow.destroy(); a.bubble.destroy(); delete this.actors[a.id]; } });
  }
  restart(level){
    this.resetWorld();
    Object.values(this.actors).forEach(a => { a.sp.destroy(); a.shadow.destroy(); a.bubble.destroy(); });
    this.actors = {};
    this.run = newRun(level || SAVE.levelFor()); this.persist();
    Object.values(this.bld).forEach(B => { B.status = "unknown"; });
    this.player.setPosition(SPAWN.x * TS, SPAWN.y * TS);
    this.spawnActors(); this.intro();
    window.UI.onRestart();
  }
}

/* ---------- Boot ---------- */
function start(){
  SAVE.load(); SAVE.markDay(); SAVE.save();
  const game = new Phaser.Game({
    type:Phaser.AUTO, parent:"game", backgroundColor:"#151a2a", pixelArt:true, roundPixels:true,
    scale:{ mode:Phaser.Scale.RESIZE, width:window.innerWidth, height:window.innerHeight },
    physics:{ default:"arcade", arcade:{ debug:false } },
    loader:{ imageLoadType:"HTMLImageElement" },
    scene:[Boot, World]
  });
  window.__ID_PHASER = game;
}
window.IDGame = { start, VERSION, LEVELS, BUILDINGS, PLACES, newRun, TS };
})();
