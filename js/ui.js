/* Identity Defender · HUD, world labels, console, evidence, missions, menus (DOM layer over the Phaser canvas). */
(function () {
"use strict";
const L = window.ID_LEVELS, SAVE = window.IDSave, esc = L.esc, LV = L.LV;
const $ = id => document.getElementById(id);
let W = null, open = null, tut = null, hintTier = 0, touchReady = false;
const tagEls = {};
const ICON = n => `<img class="ki" src="assets/kenney-game-icons/${n}.png" alt="">`;
const def = () => W.def, run = () => W.run;
function blocking(){ return !!open; }

/* ---------- Bind to a mission ---------- */
function bind(scene){
  W = scene;
  tut = SAVE.state.lab.game.tutorialDone ? null : "move";
  hintTier = 0; W.highlights = [];
  $("hud-level").textContent = LV[W.run.level];
  $("hud-code").textContent = def().code;
  $("hud-obj").textContent = def().objective;
  $("btn-hint").textContent = "Hint";
  $("btn-log").textContent = def().log.short || "Logs";
  document.title = "Identity Defender · " + def().title;
  refreshXP(); buildStaticTags(); refreshHUD();
  if (!touchReady) setupTouch();
}
function onLeave(){
  closePanel(true); $("banner").hidden = true; $("predict").hidden = true; open = null; $("ui").classList.remove("busy");
  Object.keys(tagEls).forEach(k => { tagEls[k].remove(); delete tagEls[k]; });
  $("tags").innerHTML = ""; $("timeskip").hidden = true;
}
function refreshXP(){ const S = SAVE.state, l = SAVE.level(S.xp || 0); $("hud-xp").textContent = `Lv ${l.n} · ${S.xp || 0} XP`; }
function refreshHUD(){
  if (!W) return;
  const r = run(), res = r.results, d = def();
  const items = r.requirements.map(k => ({ k, s:res && res.req[k] })).concat(r.bonus.map(k => ({ k, s:res && res.bonus[k], bonus:true })));
  const met = res ? r.requirements.filter(k => res.req[k].ok).length : 0;
  $("reqs").innerHTML = items.map(({ k, s, bonus }) => { const st = !s ? "pend" : s.ok ? "ok" : "no";
    return `<li class="rq ${st} ${bonus ? "bonus" : ""}" title="${esc(s ? s.why : "Not tested yet")}"><span class="ri" aria-hidden="true">${st === "ok" ? "✓" : st === "no" ? "✕" : "·"}</span><span>${esc((bonus ? "Best practice: " : "") + d.reqText[k])}</span><span class="sr-only">${st === "ok" ? "met" : st === "no" ? "not met" : "not tested"}</span></li>`; }).join("");
  $("req-count").textContent = res ? `${met}/${r.requirements.length}` : "";
  $("req-dots").innerHTML = items.filter(x => !x.bonus).map(({ s }) => `<i class="${!s ? "pend" : s.ok ? "ok" : "no"}">${!s ? "·" : s.ok ? "✓" : "✕"}</i>`).join("") + `<span class="sr-only">${met} of ${r.requirements.length} requirements met</span>`;
  $("hud-tests").textContent = r.tests ? `${r.tests} run${r.tests === 1 ? "" : "s"}` : "";
}
function coach(html, step){ const c = $("coach"); c.innerHTML = html; c.dataset.step = step || ""; c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); $("live").textContent = c.textContent; }
function toast(msg, kind){ const t = document.createElement("div"); t.className = "toast " + (kind || ""); t.textContent = msg; $("toasts").appendChild(t); setTimeout(() => t.remove(), 2800); }
function xp(n, why){ if (!n) return 0; SAVE.award(n); run().xp = (run().xp || 0) + n; toast(`+${n} XP · ${why}`, "xp"); refreshXP(); return n; }

/* ---------- Tutorial (first mission only) ---------- */
function firstStuck(){ const r = run(), res = r.results && r.results.res; return r.actors.find(id => res && res[id] && res[id].outcome !== "in" && W.actors[id] && W.actors[id].data.legit !== false) || r.actors[0]; }
function tutorial(ev){
  if (!tut) return;
  if (tut === "move" && ev === "moved"){ tut = "inspect"; const a = W.actors[firstStuck()]; coach(`Walk to <b>${esc(a.data.short || a.data.name)}</b> and press <kbd>E</kbd> to inspect.`, "inspect"); }
  else if (tut === "inspect" && ev === "inspected"){ tut = "console"; coach(`Now walk to the <b>${esc(def().campus.console.title.toLowerCase())}</b> and press <kbd>E</kbd>.`, "console"); }
  else if (tut === "console" && ev === "console"){ tut = "run"; }
  else if (tut === "run" && ev === "ran"){ tut = null; SAVE.state.lab.game.tutorialDone = true; SAVE.save(); }
}
function afterIntro(){
  refreshHUD();
  if (tut === "move") coach(def().startCoach + " Move with <kbd>WASD</kbd> / arrow keys" + (isTouch() ? " or the pad" : "") + ".", "move");
  else if (!tut) coach(def().startCoach);
}
function markerTarget(){
  if (!W || !W.ready) return null;
  if (tut === "inspect"){ const a = W.actors[firstStuck()]; return a && { x:a.sp.x, y:a.sp.y - 26 }; }
  if (tut === "console") return { x:W.console.x, y:W.console.y - 38 };
  return null;
}

/* ---------- Per-frame world labels ---------- */
function frame(scene){
  const cam = scene.cameras.main, z = cam.zoom, v = cam.worldView;
  const sx = x => (x - v.x) * z, sy = y => (y - v.y) * z, lbl = SAVE.state.lab.game.settings.labels;
  const p = $("prompt");
  if (scene.near && !open){ p.hidden = false; p.querySelector(".pt").textContent = scene.near.label; p.style.transform = `translate(${Math.round(sx(scene.near.x))}px, ${Math.round(sy(scene.near.y) - 34 * z / 3 - 36)}px) translateX(-50%)`; }
  else p.hidden = true;
  const live = new Set();
  const tagFor = (a, isStatic) => {
    live.add(a.id);
    let t = tagEls[a.id];
    if (!t){ t = document.createElement("div"); $("tags").appendChild(t); tagEls[a.id] = t; t._k = ""; }
    const res = a.result, shown = a.sp.visible && a.state !== "origin" && a.state !== "inside";
    const st = isStatic || !res || a.state === "origin" ? null : res.outcome === "in" ? "ok" : res.outcome === "pending" ? "pend" : "no";
    const hl = (W.highlights || []).includes(a.id);
    const key = [shown, st, lbl, a.state, hl, isStatic].join("|");
    if (t._k !== key){
      t._k = key;
      const sus = a.data.legit === false;
      t.className = "tag actor" + (isStatic ? " npc" : "") + (sus ? " sus" : "") + (st ? " " + st : "") + (hl ? " hl" : "") + (lbl ? "" : " min");
      t.innerHTML = `<b>${esc(a.data.short || a.data.name)}</b>${st && lbl ? `<span>${st === "ok" ? "✓ " + esc(def().inWord || "in") : st === "pend" ? "… " + esc(def().pendWord || "pending") : "✕ " + esc(def().outWord || "stopped")}</span>` : ""}`;
    }
    t.hidden = isStatic ? false : !shown;
    t.style.transform = `translate(${Math.round(sx(a.sp.x))}px, ${Math.round(sy(a.sp.y - 17))}px) translate(-50%, -100%)`;
  };
  Object.values(scene.actors).forEach(a => tagFor(a, false));
  Object.values(scene.statics).forEach(a => tagFor(a, true));
  Object.keys(tagEls).forEach(id => { if (!live.has(id)){ tagEls[id].remove(); delete tagEls[id]; } });
  document.querySelectorAll(".tag.bld").forEach(t => { const B = scene.bld[t.dataset.key]; if (B) t.style.transform = `translate(${Math.round(sx(B.b.cx))}px, ${Math.round(sy(1.2 * 16))}px) translateX(-50%)`; });
  document.querySelectorAll(".tag.zonetag").forEach((t, i) => { const Z = scene.zoneTags[i]; t.style.transform = `translate(${Math.round(sx(Z.x))}px, ${Math.round(sy(Z.y))}px) translate(-50%, -100%)`; t.hidden = !lbl && i < 2; });
  document.querySelectorAll(".tag.exit").forEach(t => { const e = scene.exits[+t.dataset.i]; if (!e) return; const p = exitPos(e);
    const ax = e.edge === "east" ? "-100%" : e.edge === "west" ? "0%" : "-50%", ay = e.edge === "north" ? "0%" : e.edge === "south" ? "-100%" : "-50%";
    t.style.transform = `translate(${Math.round(sx(p.x))}px, ${Math.round(sy(p.y))}px) translate(${ax}, ${ay})`; });
  const m = $("marker"), mt = markerTarget();
  if (mt && !open){ m.hidden = false; m.style.transform = `translate(${Math.round(sx(mt.x))}px, ${Math.round(sy(mt.y))}px) translate(-50%, -100%)`; } else m.hidden = true;
  const pb = $("predict");
  if (!pb.hidden && W._predActor){ const a = W._predActor, hw = Math.min(pb.offsetWidth, window.innerWidth - 20) / 2, ph = pb.offsetHeight;
    let x = Math.min(window.innerWidth - hw - 10, Math.max(hw + 10, sx(a.sp.x))), y = sy(a.sp.y - 30);
    if (y - ph < 10) y = Math.min(window.innerHeight - 10, sy(a.sp.y + 8) + ph);
    pb.style.transform = `translate(${Math.round(x)}px, ${Math.round(Math.max(ph + 10, y))}px) translate(-50%, -100%)`; }
  const y = $("you"); y.style.transform = `translate(${Math.round(sx(scene.player.x))}px, ${Math.round(sy(scene.player.y - 16))}px) translate(-50%, -100%)`; y.hidden = !(lbl && tut === "move");
}
function exitPos(e){ const A = W.A, mid = (e.at[0] + e.at[1] + 1) / 2 * 16;
  return e.edge === "east" ? { x:A.W * 16 - 14, y:mid } : e.edge === "west" ? { x:14, y:mid } : e.edge === "north" ? { x:mid, y:22 } : { x:mid, y:A.H * 16 - 6 }; }
function refreshExitTags(){
  if (!W) return; $("tags").querySelectorAll(".exit").forEach(x => x.remove());
  (W.exits || []).forEach((e, i) => { const t = document.createElement("div"), to = L.defs[e.to];
    t.className = "tag exit" + (e.open ? "" : " locked"); t.dataset.i = i;
    t.innerHTML = `<b>${e.edge === "west" ? "← " : e.edge === "north" ? "↑ " : e.edge === "south" ? "↓ " : ""}${esc(to.area.name)}${e.edge === "east" ? " →" : ""}</b><span>${e.open ? esc(to.title) : "🔒 Finish this mission to open"}</span>`;
    $("tags").appendChild(t); });
}
function areaSign(name, sub){ const a = $("areasign"); a.querySelector("b").textContent = name; a.querySelector("span").textContent = sub; a.classList.add("show"); clearTimeout(a._t); a._t = setTimeout(() => a.classList.remove("show"), 2600); }
function buildStaticTags(){
  $("tags").querySelectorAll(".bld, .zonetag, .exit").forEach(x => x.remove());
  refreshExitTags();
  W.zoneTags.forEach(Z => { const t = document.createElement("div"); t.className = "tag zonetag " + Z.cls; t.innerHTML = Z.html; $("tags").appendChild(t); });
  Object.keys(W.bld).forEach(k => { const t = document.createElement("div"); t.className = "tag bld"; t.dataset.key = k; $("tags").appendChild(t); });
  refreshBuildingTags();
}
function refreshBuildingTags(){
  if (!W) return;
  document.querySelectorAll(".tag.bld").forEach(t => { const B = W.bld[t.dataset.key]; if (!B) return; const s = B.status, b = B.b;
    const txt = { online:b.onlineLabel || "Online", idle:b.idleLabel || "Normal", offline:b.offlineLabel || "Offline: nobody can reach it", alarm:b.alarmLabel || "Breach: attacker inside", locked:b.lockedLabel || "Locked", unknown:"Checking…" }[s];
    t.className = "tag bld " + s; t.innerHTML = `<b>${esc(b.label)}</b><span>${s === "online" || s === "idle" ? "● " : s === "alarm" ? "▲ " : "○ "}${esc(txt)}</span>`; });
}
function floatText(x, y, text, kind){
  if (!W) return; const cam = W.cameras.main, v = cam.worldView, z = cam.zoom;
  const t = document.createElement("div"); t.className = "float " + (kind || ""); t.textContent = text;
  t.style.left = Math.round((x - v.x) * z) + "px"; t.style.top = Math.round((y - v.y) * z) + "px";
  $("tags").appendChild(t); setTimeout(() => t.remove(), 2200);
}
function timeSkip(text){ const t = $("timeskip"); t.textContent = text; t.hidden = false; t.classList.remove("go"); void t.offsetWidth; t.classList.add("go"); setTimeout(() => { t.hidden = true; }, 1500); }

/* ---------- Panels ---------- */
function openPanel(name, html, opts){
  closePanel(true);
  const p = $("panel"); p.className = "panel " + name; p.innerHTML = html; p.hidden = false; open = name; $("ui").classList.add("busy");
  p.setAttribute("aria-label", (opts && opts.label) || name);
  W && W.keys.clear();
  const f = p.querySelector("[autofocus]") || p.querySelector("button, input, select"); if (f) f.focus({ preventScroll:true });
}
function closePanel(silent){
  const p = $("panel"); if (p.hidden){ if (open !== "predict" && open !== "banner") open = null; return; }
  p.hidden = true; p.innerHTML = ""; const was = open; open = null; $("ui").classList.remove("busy");
  if (!silent && was === "console" && W && W.run.phase === "play") coach(`Press <kbd>E</kbd> at the ${esc(def().campus.console.title.toLowerCase())} to change the settings again.`);
  if (!silent) $("game").focus();
}
const resBadge = r => r ? `<span class="res ${r.outcome === "in" ? "ok" : r.outcome === "pending" ? "pend" : "no"}">${r.outcome === "in" ? "✓" : r.outcome === "pending" ? "…" : "✕"} ${esc(r.label)}</span>` : "";
function evidenceHtml(a){
  const r = run(), d = a.data, isStatic = !!a.isStatic;
  const shown = !isStatic && a.result && (r.level < 3 || r.tests > 0 || a.isPrediction && r.pred && r.pred.choice);
  const E = isStatic ? def().staticEvidence(d, r) : def().evidence(d, r, shown ? a.result : null);
  return `<header class="ev-head"><span class="av k-${d.kind || "person"}">${esc(d.initials)}</span><div><h2 id="panel-title">${esc(d.name)}</h2><p>${esc(E.sub || d.role || "")}</p></div>${shown ? resBadge(a.result) : ""}</header>
    <dl class="ev">${E.rows.map(([k, v, ic]) => `<dt>${ic ? ICON(ic) : ""}${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>
    ${shown && a.result.detail ? `<div class="ev-ca">${a.result.detail}</div>` : ""}${shown ? `<p class="ev-sum">${esc(a.result.why)}</p>` : (!isStatic && r.level >= 3 ? `<p class="muted small">Run the scenario to see the outcome.</p>` : "")}`;
}
function openEvidence(a){
  openPanel("evidence", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title">${evidenceHtml(a)}
    <div class="pact"><button class="btn" data-ui="close" autofocus>Back <kbd>Esc</kbd></button>${W.run.phase === "play" ? `<button class="btn ghost" data-ui="console">Open ${esc(def().campus.console.title.toLowerCase())}</button>` : ""}</div></div>`, { label:"Evidence" });
  if (!a.isStatic) tutorial("inspected");
}
function openLog(){
  if (open || !W) return;
  const r = run(), ids = Object.keys(W.actors), sts = Object.keys(W.statics);
  const row = (a, st) => `<li><button class="logrow" data-ui="ev" data-id="${a.id}" data-static="${st ? 1 : 0}"><span class="av k-${a.data.kind || "person"}">${esc(a.data.initials)}</span><span class="lr-main"><b>${esc(a.data.name)}</b><span>${esc(a.data.logLine || a.data.role || "")}</span></span>${st ? "" : (a.result && (r.level < 3 || r.tests) ? resBadge(a.result) : "<span class='res'>—</span>")}</button></li>`;
  openPanel("log", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("menuList")} ${esc(def().log.title)}</h2><span class="muted small">${esc(def().log.sub)}</span></header>
    <ul class="loglist">${ids.map(id => row(W.actors[id], false)).join("")}</ul>${sts.length ? `<h3>People you can talk to</h3><ul class="loglist">${sts.map(id => row(W.statics[id], true)).join("")}</ul>` : ""}
    <div class="pact"><button class="btn" data-ui="close" autofocus>Close <kbd>Esc</kbd></button></div></div>`, { label:def().log.title });
}

/* ---------- Console: controls helpers for mission editors ---------- */
const H = {
  ed(path){ return def().editable(run(), path); },
  hl(path){ return (W.highlights || []).includes(path) ? " hl" : ""; },
  seg(path, label, opts, value, o){ o = o || {};
    if (!H.ed(path)) return H.locked(label, (opts.find(x => String(x[0]) === String(value)) || [0, value])[1], path);
    return `<fieldset class="row${H.hl(path)}"><legend class="rl">${esc(label)}</legend><div class="segs${o.col ? " col" : ""}">${opts.map(([v, l]) => `<label class="seg ${String(value) === String(v) ? "on" : ""}"><input type="radio" name="p-${path}" value="${esc(v)}" ${String(value) === String(v) ? "checked" : ""} data-path="${path}" data-k="val" ${typeof v === "number" ? 'data-num="1"' : ""}>${esc(l)}</label>`).join("")}</div>${o.note ? `<p class="note">${o.note}</p>` : ""}</fieldset>`; },
  select(path, label, opts, value, o){ o = o || {};
    if (!H.ed(path)) return H.locked(label, (opts.find(x => String(x[0]) === String(value)) || [0, value])[1], path);
    return `<label class="row fldrow${H.hl(path)}">${label ? `<span class="rl">${esc(label)}</span>` : ""}<select aria-label="${esc(label || path.split(".").pop())}" data-path="${path}" data-k="val" ${o.num ? 'data-num="1"' : ""}>${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(value) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`; },
  checks(path, label, opts, arr, o){ o = o || {};
    if (!H.ed(path)) return H.locked(label, arr.length ? opts.filter(x => arr.includes(x[0])).map(x => x[1]).join(", ") : "None", path);
    return `<fieldset class="row${H.hl(path)}"><legend class="rl">${esc(label)}</legend><div class="segs${o.col ? " col" : ""}">${opts.map(([v, l]) => `<label class="seg chk ${arr.includes(v) ? "on" : ""}"><input type="checkbox" ${arr.includes(v) ? "checked" : ""} data-path="${path}" data-k="arr" data-v="${esc(v)}">${esc(l)}</label>`).join("")}</div>${o.note ? `<p class="note">${o.note}</p>` : ""}</fieldset>`; },
  toggle(path, label, value, o){ o = o || {};
    if (!H.ed(path)) return H.locked(label, value ? (o.on || "Yes") : (o.off || "No"), path);
    return `<div class="row${H.hl(path)}"><label class="seg chk wide ${value ? "on" : ""}"><input type="checkbox" ${value ? "checked" : ""} data-path="${path}" data-k="bool">${esc(label)}</label>${o.note ? `<p class="note">${o.note}</p>` : ""}</div>`; },
  locked(label, text, path){ return `<div class="row locked${path ? H.hl(path) : ""}"><span class="rl">${esc(label)}</span><span class="rv">${esc(text)} <span class="lock" aria-label="locked">${ICON("locked")}</span></span></div>`; },
  info(label, html){ return `<div class="row locked"><span class="rl">${esc(label)}</span><span class="rv">${html}</span></div>`; },
  group(title, inner){ return `<div class="grp"><h4>${esc(title)}</h4>${inner}</div>`; },
  tabs(items, sel){ return `<div class="ptabs" role="tablist">${items.map(t => `<button role="tab" class="ptab ${t.id === sel ? "sel" : ""} st-${t.state || ""}" data-ui="tab" data-id="${t.id}" aria-selected="${t.id === sel}"><b>${esc(t.code)}</b><span>${esc(t.title)}</span><i>${esc(t.status || "")}</i></button>`).join("")}</div>`; },
  btn(act, label, arg, o){ o = o || {}; return `<button class="btn small ${o.cls || ""}" data-ui="act" data-act="${act}" data-arg="${esc(arg == null ? "" : arg)}" ${o.disabled ? "disabled" : ""}>${label}</button>`; },
  code(text){ return `<pre class="rulecode">${esc(text)}</pre>`; },
  esc
};
function consoleHtml(){
  const r = run(), errs = def().validate(r), tip = !SAVE.state.lab.seen["tip-" + def().id] && def().firstTip ? `<p class="ctip">${ICON("information")}${def().firstTip}</p>` : "";
  return `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("gear")} ${esc(def().terminal)} <span class="muted">· ${esc(def().terminalSub || "Microsoft Entra admin center (simulated)")}</span></h2><button class="btn ghost small" data-ui="close" aria-label="Close console">✕</button></header>
    ${tip}<div class="ced">${def().editor(r, H)}</div>
    ${errs.length ? `<p class="err" role="alert">${esc(errs.join(" "))}</p>` : ""}
    <div class="pact"><button class="btn primary" data-ui="run" id="btn-run" ${errs.length ? "disabled" : ""}>▶ ${esc(def().runLabel || "Run")} <kbd>R</kbd></button><button class="btn" data-ui="undo" ${r.undo.length ? "" : "disabled"}>↶ Undo</button><button class="btn" data-ui="reset">Reset</button><button class="btn ghost" data-ui="close">Back <kbd>Esc</kbd></button></div></div>`;
}
function openConsole(){
  if (W.run.phase !== "play"){ toast("Mission complete. Restart it from the menu to change settings."); return; }
  if (W.running) return;
  openPanel("console", consoleHtml(), { label:def().terminal });
  tutorial("console");
  if (tut === "run" && def().consoleCoach) coach(def().consoleCoach);
}
function rerenderConsole(focusSel){
  if (open !== "console") return;
  const a = document.activeElement;
  const fs = focusSel || (a && a.dataset && (a.dataset.path ? `[data-path="${a.dataset.path}"]${a.dataset.k === "val" && a.type === "radio" ? `[value="${a.value}"]` : a.dataset.k === "arr" ? `[data-v="${a.dataset.v}"]` : ""}` : a.dataset.ui ? `[data-ui="${a.dataset.ui}"]${a.dataset.id ? `[data-id="${a.dataset.id}"]` : ""}${a.dataset.act ? `[data-act="${a.dataset.act}"][data-arg="${a.dataset.arg}"]` : ""}` : null));
  $("panel").innerHTML = consoleHtml();
  let f = null; try { f = fs && $("panel").querySelector(fs); } catch(e){}
  (f || $("panel").querySelector("#btn-run") || $("panel").querySelector("button")).focus({ preventScroll:true });
}
function change(fn){
  const r = run(); r.undo.push(L.clone(r.config)); if (r.undo.length > 40) r.undo.shift();
  fn(r); SAVE.state.lab.seen["tip-" + def().id] = true; W.persist(); rerenderConsole();
}
function doRun(){
  if (!W.runAttempts(false)) return;
  closePanel(true); tutorial("ran");
  coach(def().watchCoach || "Watch the gates…");
}
function afterRun(res){
  const r = run(); refreshHUD();
  const fails = r.requirements.filter(k => !res.req[k].ok);
  if (res.solved){
    W.celebrate();
    $("banner").innerHTML = `<div class="bn-in" role="status"><span class="stamp">${esc(def().winStamp || "MISSION COMPLETE")}</span><p>Every requirement met in ${r.tests} run${r.tests === 1 ? "" : "s"}.</p><button class="btn primary" data-ui="continue" autofocus>Continue →</button></div>`;
    $("banner").hidden = false; open = "banner"; $("banner").querySelector("button").focus();
    $("live").textContent = "Every requirement met.";
  } else {
    const k = fails[0];
    coach(`<b>${r.requirements.length - fails.length}/${r.requirements.length}</b> met. ✕ <b>${esc(def().reqText[k])}</b>: ${esc(res.req[k].why)} <span class="muted">Inspect, then adjust the console.</span>`);
  }
}

/* ---------- Hints ---------- */
function hint(){
  if (!W || W.run.phase !== "play" || (open && open !== "console")) return;
  const r = run(), hs = def().hints[r.level];
  if (hintTier >= 3){ openWorked(); return; }
  const h = hs[hintTier]; hintTier++; r.hints = Math.max(r.hints || 0, hintTier); W.persist();
  if (hintTier === 1){ coach("<b>Clue:</b> " + esc(h)); toast("Hint 1 of 3"); }
  else if (hintTier === 2){ W.highlights = h.highlight.slice(); if (h.tab) r.ui.tab = h.tab;
    coach("<b>Hint 2:</b> look at the highlighted people and the highlighted console setting."); toast("Hint 2 of 3"); if (open === "console") rerenderConsole(); }
  else openWorked();
  $("btn-hint").textContent = hintTier >= 3 ? "Answer" : `Hint ${hintTier + 1}/3`;
}
function openWorked(){
  const h = def().hints[run().level][2];
  openPanel("worked", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("information")} Worked explanation</h2></header><p>${h}</p><div class="pact"><button class="btn primary" data-ui="console" autofocus>Open console</button><button class="btn" data-ui="close">Close</button></div></div>`);
}

/* ---------- Completion: XP, prediction, debrief ---------- */
function complete(){
  $("banner").hidden = true; open = null;
  const r = run(), d = def(), st = SAVE.levelState(d.id), first = !st.levelsDone[r.level];
  xp(first ? 60 : 30, first ? "Mission complete" : "Mission complete (replay)");
  if (!r.hints) xp(10, "No hints");
  if (r.bonus.length && r.bonus.every(k => r.results.bonus[k].ok)) xp(15, "Best practice");
  // Solving is a difficulty signal only (many runs are fine: that's experimentation); it's never mastery evidence.
  const solveId = `lab-${d.itemKey || d.id}-solve-${r.level}`;
  if (!st.adaptSent.includes(solveId)){ SAVE.queue({ type:"adapt", item:solveId, correct:true, hints:r.hints || 0, conf:(r.solvedAtTest || 99) <= 4 ? "sure" : "guess" }); st.adaptSent.push(solveId); }
  st.levelsDone[r.level] = (st.levelsDone[r.level] || 0) + 1; st.completed++; st.best = Math.max(st.best || 0, r.level);
  if (W.exits && W.exits.some(e => !e.open)){ W.unlockExits(); toast("The way to the next area is open"); }
  r.phase = "predict"; W.persist();
  W._predActor = W.startPrediction();
}
function askPrediction(a){
  const d = def(), pb = $("predict");
  pb.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="pred-q"><p class="pk">Check your understanding</p><p id="pred-q">${d.predictCard(a.data)}</p>
    <p>${d.predictQuestion || "With <b>your</b> settings, what happens?"}</p><div class="popts">${d.predictOptions.map(([v, l]) => `<button class="btn" data-ui="pred" data-v="${v}">${esc(l)}</button>`).join("")}</div>
    <button class="btn ghost small" data-ui="ev" data-id="${a.id}">Inspect first</button></div>`;
  pb.hidden = false; open = "predict"; pb.querySelector("[data-ui=pred]").focus({ preventScroll:true });
  coach("Predict first, then watch.");
}
function predict(v){
  const r = run(), d = def(), st = SAVE.levelState(d.id), ok = v === r.pred.truth;
  r.pred.choice = v; if (!st.predUsed.includes(r.pred.id)) st.predUsed.push(r.pred.id);
  // A judgment on a fresh case, made before seeing the outcome: this is the mastery evidence.
  SAVE.queue({ type:"evidence", item:`lab-${d.itemKey || d.id}-predict-${r.pred.id}`, correct:ok, hints:0, conf:null });
  st.history = (st.history || []).concat({ level:r.level, clean:!r.hints && (r.solvedAtTest || 99) <= 4, predOk:ok, date:SAVE.localDate() }).slice(-30);
  W.persist();
  $("predict").hidden = true; open = null;
  const a = W._predActor;
  coach(ok ? "Locked in. Watch…" : "Locked in. Let's see…");
  W.playPrediction(a, () => {
    xp(ok ? 15 : 5, ok ? "Prediction correct" : "Prediction reviewed");
    toast((ok ? "✓ Correct: " : "✕ Not quite: ") + a.result.why, ok ? "ok" : "no");
    setTimeout(() => debrief(ok), 700);
  });
}
function nextMission(){ const o = L.order, i = o.indexOf(def().id); return o.slice(i + 1).concat(o.slice(0, i)).find(id => !SAVE.levelState(id).completed) || null; }
function allDone(){ return L.order.every(id => SAVE.levelState(id).completed); }
function debrief(predOk){
  const r = run(), d = def(), pts = d.debrief(r, r.results, predOk), nx = nextMission();
  r.phase = "debrief"; W.persist();
  const finale = allDone() && !SAVE.state.lab.game.campaignShown;
  openPanel("debrief", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title" tabindex="-1">Debrief <span class="muted">· ${esc(d.title)} · ${LV[r.level]}</span></h2><span class="stamp sm">FILED</span></header>
    <ol class="db3"><li>${pts[0]}</li><li>${pts[1]}</li><li>${pts[2]}${predOk ? "" : ' <span class="muted">Your prediction was off, so the study library marks this objective for review.</span>'}</li></ol>
    <details class="more"><summary>Learn more</summary>${d.learnMore}<p class="muted small">${esc(d.simplifications)}</p></details>
    <div class="pact">${finale ? `<button class="btn primary" data-ui="finale" autofocus>🏁 Campaign complete →</button>` : nx ? `<button class="btn primary" data-ui="close" autofocus>Walk on to the next area →</button><button class="btn" data-ui="go" data-id="${nx}">Jump to ${esc(L.defs[nx].title)}</button>` : ""}
      <button class="btn ${!finale && !nx ? "primary" : ""}" data-ui="again" ${!finale && !nx ? "autofocus" : ""}>Play again</button>${r.level < 3 ? `<button class="btn" data-ui="harder">Try ${LV[r.level + 1]}</button>` : ""}<button class="btn" data-ui="missions">Missions</button><button class="btn ghost" data-ui="close">Explore</button></div></div>`, { label:"Debrief" });
  $("panel-title").focus();
}
function finale(){
  SAVE.state.lab.game.campaignShown = true; SAVE.save();
  const S = SAVE.state, l = SAVE.level(S.xp || 0);
  openPanel("finale", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title" tabindex="-1">Campaign complete</h2><span class="stamp sm">HALCYON SECURED</span></header>
    <p>Every system on the Halcyon campus is restored, and you got there by fixing real Microsoft Entra settings. Lv ${l.n} · ${S.xp || 0} XP.</p>
    <ul class="mlist done">${L.order.map(id => { const d = L.defs[id], st = SAVE.levelState(id); return `<li><span class="mk ok">✓</span><b>${esc(d.title)}</b> <span class="muted">${esc(d.domain)} · best: ${LV[st.best || 1]}</span></li>`; }).join("")}</ul>
    <p class="muted">Next steps: replay any mission at <b>Advanced</b> (Missions › Try Advanced), then use the study library's review and exam drills to cover every SC-300 objective. Practice results are learning indicators, not a prediction of your exam score.</p>
    <div class="pact"><button class="btn primary" data-ui="missions" autofocus>Missions</button><a class="btn" href="library.html">Study library</a><button class="btn ghost" data-ui="close">Explore</button></div></div>`, { label:"Campaign complete" });
  if (W) W.celebrate();
}
function openMissions(){
  if (!W || W.running) return;
  const cur = def().id;
  openPanel("missions", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("star")} Missions</h2><span class="muted small">${L.order.filter(id => SAVE.levelState(id).completed).length}/${L.order.length} complete</span></header>
    <ul class="mlist">${L.order.map((id, i) => { const d = L.defs[id], st = SAVE.levelState(id); return `<li class="${id === cur ? "cur" : ""}">
      <img class="msign" src="assets/original/sign_${d.sign}.png" alt=""><div class="mm"><span class="mcode">${esc(d.code)} · ${esc(d.domain)}</span><b>${esc(d.title)}</b><span class="muted small">${esc(d.pitch)}</span></div>
      <div class="mr">${st.completed ? `<span class="mk ok">✓ ${LV[st.best || 1]}</span>` : `<span class="mk">New</span>`}<button class="btn small ${id === cur ? "" : "primary"}" data-ui="go" data-id="${id}">${id === cur ? "Restart" : "Play"}</button></div></li>`; }).join("")}</ul>
    <p class="muted small">Missions follow the SC-300 domains. Play them in any order; difficulty adapts per topic.</p>
    <div class="pact"><button class="btn" data-ui="close">Back <kbd>Esc</kbd></button><a class="btn ghost" href="library.html">Study library (all 98 objectives)</a></div></div>`, { label:"Missions" });
}

/* ---------- Menu ---------- */
function openMenu(){
  const S = SAVE.state, st = S.lab.game.settings, l = SAVE.level(S.xp || 0), mode = S.profile.difficultyMode || "adaptive", d = def();
  openPanel("menu", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("pause")} Paused</h2><span class="muted small">${esc(d.title)} · Lv ${l.n} · ${S.xp || 0} XP</span></header>
    <div class="mgrid">
      <section><h3>Mission</h3><div class="mcol"><button class="btn primary" data-ui="close" autofocus>Resume <kbd>Esc</kbd></button><button class="btn" data-ui="missions">Missions <kbd>M</kbd></button><button class="btn" data-ui="hint">${hintTier >= 3 ? "Worked answer" : "Hint"} <kbd>H</kbd></button><button class="btn" data-ui="restart">Restart mission</button></div>
        <h3>Without walking</h3><div class="mcol"><button class="btn" data-ui="console">Open ${esc(d.campus.console.title.toLowerCase())}</button><button class="btn" data-ui="log">${esc(d.log.title)} <kbd>L</kbd></button></div></section>
      <section><h3>Settings</h3>
        <label class="fld">Difficulty<select id="set-diff">${[["adaptive","Adaptive (recommended)"],["1","Guided"],["2","Standard"],["3","Advanced"]].map(([v, t]) => `<option value="${v}" ${String(mode) === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="fld">Motion<select id="set-motion">${[["system","Follow system setting"],["reduce","Reduced motion"],["full","Full motion"]].map(([v, t]) => `<option value="${v}" ${st.motion === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="chkl"><input type="checkbox" id="set-labels" ${st.labels ? "checked" : ""}> Name and status labels in the world</label>
        <p class="muted small">Difficulty changes apply when you restart a mission.</p></section>
      <section><h3>Learn</h3><details><summary>How this works in Microsoft Entra</summary>${d.learnMore}</details><details><summary>Simulation simplifications</summary><p>${esc(d.simplifications)}</p><p>Buildings stand for the resource you're protecting; the doors are where Microsoft Entra decides.</p></details>
        <details><summary>Sources (Microsoft Learn)</summary><ul>${d.sources.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("")}</ul></details>
        <details><summary>Credits</summary><p>Art: <b>Kenney</b> (RPG Urban Pack, Game Icons, Kenney Fonts), CC0, kenney.nl. Doors, console, racks, drones and signs: original pixel art for this game. Engine: Phaser 3 (MIT).</p><p><a href="ASSET_CREDITS.md" target="_blank">Full asset credits</a></p></details>
        <p><a class="btn" href="library.html">Open the study library</a></p><p class="muted small">Build ${window.IDGame.VERSION} · progress ${SAVE.ok ? "saves in this browser" : "can't be saved here"}.</p></section>
    </div></div>`, { label:"Pause menu" });
}

/* ---------- Touch ---------- */
function isTouch(){ return matchMedia("(pointer: coarse)").matches || "ontouchstart" in window; }
function setupTouch(){
  touchReady = true;
  const pad = $("tpad"), act = $("tact");
  if (!isTouch()){ $("touch").hidden = true; return; }
  $("touch").hidden = false;
  let id = null, cx = 0, cy = 0; const knob = pad.querySelector(".knob");
  const set = (x, y) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), m = 42, k = d > m ? m / d : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`; if (W) W.touchDir = d < 8 ? { x:0, y:0 } : { x:dx / Math.max(d, m), y:dy / Math.max(d, m) }; };
  pad.addEventListener("pointerdown", e => { id = e.pointerId; const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; try { pad.setPointerCapture(id); } catch(_){} set(e.clientX, e.clientY); e.preventDefault(); });
  pad.addEventListener("pointermove", e => { if (e.pointerId === id) set(e.clientX, e.clientY); });
  const end = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ""; if (W) W.touchDir = { x:0, y:0 }; };
  pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end);
  act.addEventListener("click", () => W && W.interact());
}

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-ui]"); if (!t || t.disabled || !W) return;
  const k = t.dataset.ui, r = run();
  if (k === "close"){ closePanel(); if (r.phase === "debrief") coach("Explore the campus, or open Missions (M) to continue."); return; }
  if (k === "console"){ closePanel(true); openConsole(); return; }
  if (k === "log"){ closePanel(true); openLog(); return; }
  if (k === "ev"){
    const a = t.dataset.static === "1" ? W.statics[t.dataset.id] : W.actors[t.dataset.id];
    if (open === "predict"){ $("predict").hidden = true; open = null; openPanel("evidence", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title">${evidenceHtml(a)}<div class="pact"><button class="btn primary" data-ui="backpred" autofocus>Back to the prediction</button></div></div>`); return; }
    closePanel(true); openEvidence(a); return; }
  if (k === "backpred"){ closePanel(true); askPrediction(W._predActor); return; }
  if (k === "tab"){ r.ui.tab = t.dataset.id; W.persist(); rerenderConsole(`[data-ui="tab"][data-id="${t.dataset.id}"]`); return; }
  if (k === "act"){ change(rr => def().action(rr, t.dataset.act, t.dataset.arg)); return; }
  if (k === "run") return doRun();
  if (k === "undo"){ if (!r.undo.length) return; r.config = r.undo.pop(); W.persist(); rerenderConsole(); return; }
  if (k === "reset"){ change(rr => { rr.config = def().newRun(rr.level).config; }); toast("Settings reset to the starting configuration"); return; }
  if (k === "continue") return complete();
  if (k === "pred") return predict(t.dataset.v);
  if (k === "hint"){ closePanel(true); hint(); return; }
  if (k === "restart" || k === "again"){ closePanel(true); W.restart(); return; }
  if (k === "harder"){ closePanel(true); W.restart(Math.min(3, r.level + 1)); return; }
  if (k === "go"){ closePanel(true); if (t.dataset.id === def().id) W.restart(); else W.goLevel(t.dataset.id); return; }
  if (k === "missions"){ closePanel(true); openMissions(); return; }
  if (k === "finale"){ closePanel(true); finale(); return; }
  if (k === "menu"){ open === "menu" ? closePanel() : openMenu(); return; }
});
document.addEventListener("change", e => {
  const t = e.target; if (!W) return;
  if (t.id === "set-diff"){ SAVE.state.profile.difficultyMode = t.value; SAVE.save(); toast("Saved. Restart the mission to apply."); return; }
  if (t.id === "set-motion"){ SAVE.state.lab.game.settings.motion = t.value; SAVE.save(); return; }
  if (t.id === "set-labels"){ SAVE.state.lab.game.settings.labels = t.checked; SAVE.save(); return; }
  if (open !== "console" || !t.dataset.path) return;
  const path = t.dataset.path, k = t.dataset.k;
  change(r => {
    const full = "config." + path;
    if (k === "val") L.set(r, full, t.dataset.num ? Number(t.value) : t.value);
    else if (k === "bool") L.set(r, full, t.checked);
    else if (k === "arr"){ const arr = (L.get(r, full) || []).slice(); const v = t.dataset.v; const i = arr.indexOf(v); if (t.checked && i < 0) arr.push(v); if (!t.checked && i >= 0) arr.splice(i, 1); L.set(r, full, arr); }
    if (def().onEdit){ const msg = def().onEdit(r, path, L.get(r, full)); if (msg && !SAVE.state.lab.seen["c-" + msg.key]){ SAVE.state.lab.seen["c-" + msg.key] = true; coach(msg.text); } }
  });
});
window.addEventListener("keydown", e => {
  if (!W) return;
  if (e.key === "Escape"){ if (open === "predict" || open === "banner") return; e.preventDefault(); if (open) closePanel(); else openMenu(); return; }
  const typing = e.target && (e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA" || (e.target.tagName === "INPUT" && !["radio","checkbox"].includes(e.target.type)));
  if (open === "console" && (e.key === "r" || e.key === "R") && !typing && !e.ctrlKey && !e.metaKey){ e.preventDefault(); if (!$("btn-run").disabled) doRun(); return; }
  if (!open && (e.key === "p" || e.key === "P")){ e.preventDefault(); openMenu(); }
  if (open && e.key === "Tab"){
    const root = open === "predict" ? $("predict") : open === "banner" ? $("banner") : $("panel");
    const f = [...root.querySelectorAll("button, input, select, a[href], summary")].filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]){ e.preventDefault(); f[0].focus(); }
  }
});

window.UI = { bind, onLeave, areaSign, refreshExitTags, blocking, refreshHUD, refreshBuildingTags, coach, toast, tutorial, afterIntro, afterRun, frame, openEvidence, openConsole, openLog, openMissions, openMenu, hint, askPrediction, floatText, timeSkip, H, get open(){ return open; } };
})();
