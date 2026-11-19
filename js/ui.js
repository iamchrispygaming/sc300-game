/* Identity Defender · HUD, world labels, console, evidence, menus (DOM layer over the Phaser canvas). */
(function () {
"use strict";
const E = window.CAEngine, M = window.ID_LAB.missions.mml, SAVE = window.IDSave;
const esc = E.esc, LEVELS = ["", "Guided", "Standard", "Advanced"];
const $ = s => document.querySelector(s);
let W = null;                       // the World scene
let open = null;                    // current panel name
let tut = null;                     // tutorial step
let hintTier = 0;
const tagEls = {};

const ICON = n => `<img class="ki" src="assets/kenney-game-icons/${n}.png" alt="">`;
const OUT = { allowed:["ok","Signed in"], mfa:["ok","Signed in after MFA"], blocked:["no","Blocked"], failed:["no","Couldn't sign in"] };
const who = a => a.kind === "attacker" ? "Unknown sign-in" : a.principal === "bg" ? "Emergency access" : a.name;

function el(id){ return document.getElementById(id); }
function blocking(){ return !!open; }

/* ---------- Binding & HUD ---------- */
function bind(scene){
  W = scene;
  tut = SAVE.state.lab.game.tutorialDone ? null : "move";
  el("hud-level").textContent = LEVELS[W.run.level];
  el("hud-level").title = "Adapted to your Conditional Access level. Change it in the menu.";
  refreshXP();
  setupTouch();
}
function run(){ return W.run; }
function refreshXP(){ const S = SAVE.state, l = SAVE.level(S.xp || 0); el("hud-xp").textContent = `Lv ${l.n} · ${S.xp || 0} XP`; }
function refreshHUD(){
  const r = run(), res = r.results;
  const items = r.requirements.map(k => ({ k, d:M.requirementDefs[k], s:res && res.req[k] }))
    .concat(r.bonus.map(k => ({ k, d:M.requirementDefs[k], s:res && res.bonus[k], bonus:true })));
  const met = res ? r.requirements.filter(k => res.req[k].ok).length : 0;
  el("reqs").innerHTML = items.map(({ k, d, s, bonus }) => {
    const st = !s ? "pend" : s.ok ? "ok" : "no";
    return `<li class="rq ${st} ${bonus ? "bonus" : ""}" title="${esc(s ? s.why : "Not tested yet")}"><span class="ri" aria-hidden="true">${st === "ok" ? "✓" : st === "no" ? "✕" : "·"}</span><span>${esc(bonus ? "Best practice: emergency account excluded" : d.text)}</span><span class="sr-only">${st === "ok" ? "met" : st === "no" ? "not met" : "not tested"}</span></li>`;
  }).join("");
  el("req-count").textContent = res ? `${met}/${r.requirements.length}` : "";
  el("req-dots").innerHTML = items.filter(x => !x.bonus).map(({ s }) => `<i class="${!s ? "pend" : s.ok ? "ok" : "no"}">${!s ? "·" : s.ok ? "✓" : "✕"}</i>`).join("") + `<span class="sr-only">${met} of ${r.requirements.length} requirements met</span>`;
  el("hud-tests").textContent = r.tests ? `${r.tests} run${r.tests === 1 ? "" : "s"}` : "";
}
function coach(html, step){ const c = el("coach"); c.innerHTML = html; c.dataset.step = step || ""; c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); el("live").textContent = c.textContent; }
function toast(msg, kind){ const t = document.createElement("div"); t.className = "toast " + (kind || ""); t.textContent = msg; el("toasts").appendChild(t); setTimeout(() => t.remove(), 2600); }
function xp(n, why){ if (!n) return 0; SAVE.award(n); run().xp += n; toast(`+${n} XP · ${why}`, "xp"); refreshXP(); return n; }

/* ---------- Tutorial (taught through action) ---------- */
function firstStuck(){ const r = run(); return r.variantActors.find(id => M.actors[id].legit && r.results && !E.gotIn(r.results.res[id])) || "ana"; }
function tutorial(ev){
  if (!tut) return;
  if (tut === "move" && ev === "moved"){ tut = "inspect"; const a = M.actors[firstStuck()]; coach(`Walk to <b>${esc(a.name.split(" ")[0])}</b> at the ${esc(M.apps.find(x => x.id === a.app).label)} gate and press <kbd>E</kbd> to inspect the sign-in.`, "inspect"); }
  else if (tut === "inspect" && ev === "inspected"){ tut = "console"; coach("The gates enforce Conditional Access. Walk to the <b>security console</b> and press <kbd>E</kbd>.", "console"); }
  else if (tut === "console" && ev === "console"){ tut = "run"; }
  else if (tut === "run" && ev === "ran"){ tut = null; SAVE.state.lab.game.tutorialDone = true; SAVE.save(); }
}
function afterIntro(){
  refreshHUD();
  if (tut === "move") coach("Monday 9:02: people are stuck at the gates. Move with <kbd>WASD</kbd> / arrow keys" + (isTouch() ? " or the pad" : "") + ".", "move");
  else if (!tut) coach("Sign-ins are failing. Inspect the stuck people, then fix the policies at the security console.");
  else tutorial("noop");
}
function markerTarget(){
  if (!W) return null;
  if (hintTier >= 2 && run().phase === "play"){ return null; }
  if (tut === "inspect"){ const a = W.actors[firstStuck()]; return a && { x:a.sp.x, y:a.sp.y - 26 }; }
  if (tut === "console") return { x:W.console.x, y:W.console.y - 38 };
  return null;
}

/* ---------- Per-frame world labels ---------- */
function frame(scene){
  const cam = scene.cameras.main, z = cam.zoom, v = cam.worldView;
  const sx = x => (x - v.x) * z, sy = y => (y - v.y) * z;
  const lbl = SAVE.state.lab.game.settings.labels;
  // interaction prompt
  const p = el("prompt");
  if (scene.near && !open){
    p.hidden = false; p.querySelector(".pt").textContent = scene.near.label;
    p.style.transform = `translate(${Math.round(sx(scene.near.x))}px, ${Math.round(sy(scene.near.y) - 34 * z / 3 - 36)}px) translateX(-50%)`;
  } else p.hidden = true;
  // actor tags
  const live = new Set();
  Object.values(scene.actors).forEach(a => {
    live.add(a.id);
    let t = tagEls[a.id];
    if (!t){ t = document.createElement("div"); t.className = "tag actor"; el("tags").appendChild(t); tagEls[a.id] = t; t._k = ""; }
    const res = a.result, shown = a.sp.visible && a.state !== "origin";
    const st = !res || a.state === "origin" ? null : E.gotIn(res) ? "ok" : "no";
    const key = [shown, st, lbl, a.state, (W.highlights || []).includes(a.id)].join("|");
    if (t._k !== key){
      t._k = key;
      const name = a.P.drone ? "Mail script" : a.data.kind === "attacker" ? "Unknown" : a.data.name.split(" ")[0];
      t.className = "tag actor" + (a.data.kind === "attacker" || a.P.drone ? " sus" : "") + (st ? " " + st : "") + ((W.highlights || []).includes(a.id) ? " hl" : "") + (lbl ? "" : " min");
      t.innerHTML = `<b>${esc(name)}</b>${st && lbl ? `<span>${st === "ok" ? "✓ in" : "✕ stopped"}</span>` : ""}`;
    }
    t.hidden = !shown && a.state !== "inside";
    if (a.state === "inside") t.hidden = true;
    t.style.transform = `translate(${Math.round(sx(a.sp.x))}px, ${Math.round(sy(a.sp.y - 17))}px) translate(-50%, -100%)`;
  });
  Object.keys(tagEls).forEach(id => { if (!live.has(id)){ tagEls[id].remove(); delete tagEls[id]; } });
  // building tags and zone signs
  document.querySelectorAll(".tag.bld").forEach(t => { const B = scene.bld[t.dataset.app]; t.style.transform = `translate(${Math.round(sx(B.b.cx))}px, ${Math.round(sy(1.2 * 16))}px) translateX(-50%)`; });
  document.querySelectorAll(".tag.zonetag").forEach((t, i) => { const Z = scene.zoneTags[i]; t.style.transform = `translate(${Math.round(sx(Z.x))}px, ${Math.round(sy(Z.y))}px) translate(-50%, -100%)`; t.hidden = !lbl && i < 2; });
  // tutorial / hint marker
  const m = el("marker"), mt = markerTarget();
  if (mt && !open){ m.hidden = false; m.style.transform = `translate(${Math.round(sx(mt.x))}px, ${Math.round(sy(mt.y))}px) translate(-50%, -100%)`; } else m.hidden = true;
  // prediction bubble follows its actor
  const pb = el("predict");
  if (!pb.hidden && W._predActor){ const a = W._predActor, hw = Math.min(pb.offsetWidth, window.innerWidth - 20) / 2, ph = pb.offsetHeight;
    let x = Math.min(window.innerWidth - hw - 10, Math.max(hw + 10, sx(a.sp.x))), y = sy(a.sp.y - 30);
    if (y - ph < 10) y = Math.min(window.innerHeight - 10, sy(a.sp.y + 8) + ph);   // no room above: show it below the person
    pb.style.transform = `translate(${Math.round(x)}px, ${Math.round(Math.max(ph + 10, y))}px) translate(-50%, -100%)`; }
  // you are here
  const y = el("you"); y.style.transform = `translate(${Math.round(sx(scene.player.x))}px, ${Math.round(sy(scene.player.y - 16))}px) translate(-50%, -100%)`; y.hidden = !(lbl && tut === "move");
}
function buildStaticTags(){
  el("tags").querySelectorAll(".bld, .zonetag").forEach(x => x.remove());
  W.zoneTags.forEach(Z => { const t = document.createElement("div"); t.className = "tag zonetag " + Z.cls; t.innerHTML = Z.html; el("tags").appendChild(t); });
  Object.keys(W.bld).forEach(app => { const t = document.createElement("div"); t.className = "tag bld"; t.dataset.app = app; el("tags").appendChild(t); });
  refreshBuildingTags();
}
function refreshBuildingTags(){
  if (!W) return;
  document.querySelectorAll(".tag.bld").forEach(t => { const B = W.bld[t.dataset.app], s = B.status;
    const txt = { online:"Online", offline:"Offline: nobody can reach it", alarm:"Breach: attacker inside", unknown:"Checking…" }[s];
    t.className = "tag bld " + s; t.innerHTML = `<b>${esc(B.b.label)}</b><span>${s === "online" ? "● " : s === "alarm" ? "▲ " : "○ "}${txt}</span>`; });
}

/* ---------- Panels ---------- */
function openPanel(name, html, opts){
  closePanel(true);
  const p = el("panel"); p.className = "panel " + name + " " + ((opts && opts.cls) || ""); p.innerHTML = html; p.hidden = false; open = name; el("ui").classList.add("busy");
  p.setAttribute("aria-label", (opts && opts.label) || name);
  W && W.keys.clear();
  const f = p.querySelector("[autofocus]") || p.querySelector("button, input"); if (f) f.focus({ preventScroll:true });
}
function closePanel(silent){
  const p = el("panel"); if (p.hidden) { open = null; return; }
  p.hidden = true; p.innerHTML = ""; const was = open; open = null; el("ui").classList.remove("busy");
  if (!silent && was === "console" && W && W.run.phase === "play") coach(W.run.tests ? "Press <kbd>E</kbd> at the console to adjust the policies again." : "Use the console to change the policies, then run the sign-ins.");
  if (!silent) el("game").focus();
}

/* Evidence card: the sign-in log entry for one attempt */
function evidenceHtml(a, compact){
  const d = a.data, res = a.result, r = run();
  const showRes = res && (r.level < 3 || r.tests > 0 || a.isPrediction && r.pred && r.pred.choice);
  const groups = d.groups.length ? d.groups.map(g => E.principalLabel(M, g)).join(", ") : (d.principal === "bg" ? "Excluded-by-design account" : "—");
  const rows = [
    ["User", d.kind === "attacker" ? `${d.account} <em>(account used)</em>` : `${esc(d.name)} · ${esc(d.role)}`, "singleplayer"],
    ["Groups", esc(groups), "menuList"],
    ["Network", `${esc(d.location.label)} · ${esc(d.location.ip)}<br><span class="${d.location.named ? "good" : "warn"}">${d.location.named ? "Named location: Halcyon offices (trusted)" : "Not a named location"}</span>`, "target"],
    ["Device", `${esc(d.device.label)} · ${esc(d.device.platform)}<br><span class="${d.device.compliant ? "good" : "warn"}">${esc(d.device.state)}</span>`, d.device.icon === "tablet" ? "tablet" : "power"],
    ["App", `${esc((M.apps.find(x => x.id === d.app) || {}).label)} · ${esc(d.clientLabel)}${d.client === "legacy" ? ' <span class="warn">legacy authentication</span>' : ""}`, "home"],
    ["Sign-in", d.auth === "passkey" ? "Passkey (FIDO2) · counts as MFA" : "Password", "locked"],
    ["MFA", `<span class="${d.mfa ? "good" : "warn"}">${esc(d.mfaLabel)}</span>`, "phone"],
    ["Risk", d.riskLabel ? `<span class="${d.risk === "high" ? "bad" : "warn"}">${esc(d.riskLabel)}</span>` : "None", "warning"]
  ];
  return `<header class="ev-head"><span class="av k-${d.kind}">${esc(d.initials)}</span><div><h2 id="panel-title">${esc(who(d))}</h2><p>${d.kind === "attacker" ? "Suspicious sign-in" : d.principal === "bg" ? "Break-glass account test by Nadia" : esc(d.role)}</p></div>
    ${showRes ? `<span class="res ${OUT[res.outcome][0]}">${OUT[res.outcome][0] === "ok" ? "✓" : "✕"} ${OUT[res.outcome][1]}</span>` : ""}</header>
    <dl class="ev">${rows.map(([k, v, ic]) => `<dt>${ICON(ic)}${k}</dt><dd>${v}</dd>`).join("")}</dl>
    ${showRes ? `<div class="ev-ca"><h3>Conditional Access</h3><ul>${res.per.map(p => `<li class="${p.applies ? (p.block || !p.ok ? "pno" : "pok") : "pna"}${p.state === "report" ? " prep" : ""}"><b>${esc(p.id)}</b> ${p.state === "report" && p.applies ? "Report-only · " : ""}${esc(p.why)}</li>`).join("")}</ul>
      <p class="ev-sum">${esc(E.describe(M, d, res))}</p></div>` : `<p class="muted small">${r.level >= 3 ? "Run the sign-ins to see which policies applied." : ""}</p>`}`;
}
function openEvidence(a){
  openPanel("evidence", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title">${evidenceHtml(a)}
    <div class="pact"><button class="btn" data-ui="close" autofocus>Back to the plaza <kbd>Esc</kbd></button>${W.run.phase === "play" ? `<button class="btn ghost" data-ui="console">Open console</button>` : ""}</div></div>`, { label:"Sign-in evidence" });
  if (!W.seenInspect){ W.seenInspect = true; }
  tutorial("inspected");
}
/* Sign-in log: every attempt, as a list (also the no-walking alternative for inspecting) */
function openLog(){
  if (open) return;
  const r = run(), ids = Object.keys(W.actors);
  openPanel("log", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("menuList")} Sign-in logs</h2><span class="muted small">This morning · ${ids.length} attempts</span></header>
    <ul class="loglist">${ids.map(id => { const a = W.actors[id], res = a.result, d = a.data, o = res && OUT[res.outcome];
      return `<li><button class="logrow" data-ui="ev" data-id="${id}"><span class="av k-${d.kind}">${esc(d.initials)}</span><span class="lr-main"><b>${esc(who(d))}</b><span>${esc(d.location.label)} · ${esc(d.device.label)} · ${esc((M.apps.find(x => x.id === d.app) || {}).label)}</span></span><span class="res ${o ? o[0] : ""}">${o && (r.level < 3 || r.tests) ? (o[0] === "ok" ? "✓ " : "✕ ") + o[1] : "—"}</span></button></li>`; }).join("")}</ul>
    <div class="pact"><button class="btn" data-ui="close" autofocus>Close <kbd>Esc</kbd></button></div></div>`, { label:"Sign-in logs" });
}

/* ---------- Security console: the Conditional Access policy editor ---------- */
function canEdit(pid, f){ const e = M.variants[run().level].editable[pid]; return e === "all" || (Array.isArray(e) && e.includes(f)); }
function seg(pid, f, value){
  const opts = E.OPT[f], name = `f-${pid}-${f}`, hl = (W.highlights || []).includes(pid + "." + f) ? " hl" : "";
  if (!canEdit(pid, f)) return `<div class="row locked${hl}"><span class="rl">${E.FIELD_LABEL[f]}</span><span class="rv">${esc(E.optLabel(f, value))} <span class="lock" aria-label="locked">${ICON("locked")}</span></span></div>`;
  return `<fieldset class="row${hl}"><legend class="rl">${E.FIELD_LABEL[f]}</legend><div class="segs">${opts.map(([v, l]) => `<label class="seg ${value === v ? "on" : ""}"><input type="radio" name="${name}" value="${v}" ${value === v ? "checked" : ""} data-f="${pid}.${f}">${esc(l)}</label>`).join("")}</div></fieldset>`;
}
function consoleHtml(){
  const r = run(), pid = W.selPolicy && r.policies[W.selPolicy] ? W.selPolicy : (r.order.includes("CA02") ? "CA02" : r.order[0]); W.selPolicy = pid;
  const p = r.policies[pid], lvl = r.level, errs = E.validate(r), hl = k => (W.highlights || []).includes(pid + "." + k) ? " hl" : "";
  const apps = p.apps === "all" ? "All resources (formerly 'All cloud apps')" : p.apps.map(a => M.apps.find(x => x.id === a).label).join(", ");
  let ed = `<div class="ped-head"><h3>${esc(pid === "NEW" ? "New policy" : pid + " · " + p.name)}</h3>${p.changedBy ? `<span class="changed">${ICON("warning")}Changed by ${esc(p.changedBy)}</span>` : ""}</div>`;
  ed += seg(pid, "state", p.state);
  ed += `<div class="grp"><h4>Assignments</h4>` + seg(pid, "include", p.include);
  ed += canEdit(pid, "exclude") ? `<fieldset class="row${hl("exclude")}"><legend class="rl">Exclude</legend><div class="segs">${M.principals.map(x => `<label class="seg chk ${p.exclude.includes(x.id) ? "on" : ""}"><input type="checkbox" ${p.exclude.includes(x.id) ? "checked" : ""} data-ex="${pid}.${x.id}">${esc(x.label)}</label>`).join("")}</div></fieldset>`
    : `<div class="row locked"><span class="rl">Exclude</span><span class="rv">${p.exclude.length ? esc(p.exclude.map(x => E.principalLabel(M, x)).join(", ")) : "None"} <span class="lock">${ICON("locked")}</span></span></div>`;
  ed += `<div class="row locked"><span class="rl">Target resources</span><span class="rv">${esc(apps)}</span></div></div>`;
  ed += `<div class="grp"><h4>Conditions</h4>` + seg(pid, "network", p.network) + seg(pid, "client", p.client) + (lvl >= 2 || p.risk !== "any" ? seg(pid, "risk", p.risk) : "") + `</div>`;
  ed += `<div class="grp"><h4>Access controls</h4>`;
  if (canEdit(pid, "grant")){
    ed += `<fieldset class="row${hl("grant")}"><legend class="rl">Grant</legend><div class="segs">${E.OPT.grant.map(([v, l]) => `<label class="seg ${p.grant === v ? "on" : ""}"><input type="radio" name="g-${pid}" value="${v}" ${p.grant === v ? "checked" : ""} data-f="${pid}.grant">${l}</label>`).join("")}</div></fieldset>`;
    if (p.grant === "grant"){
      ed += `<fieldset class="row${hl("controls")}"><legend class="rl">Controls</legend><div class="segs col">${E.CTRL.filter(c => c[0] !== "hybrid" || lvl >= 2).map(([k, l]) => `<label class="seg chk ${p.controls[k] ? "on" : ""}"><input type="checkbox" ${p.controls[k] ? "checked" : ""} data-ctl="${pid}.${k}">${l}</label>`).join("")}</div></fieldset>`;
      ed += seg(pid, "op", p.op);
    }
  } else ed += `<div class="row locked${hl("grant")}"><span class="rl">Grant</span><span class="rv">${p.grant === "block" ? "Block access" : E.CTRL.filter(c => p.controls[c[0]]).map(c => c[1]).join(p.op === "and" ? " AND " : " OR ")} <span class="lock">${ICON("locked")}</span></span></div>`;
  ed += `</div>`;
  const tabs = r.order.map(id => { const q = r.policies[id]; return `<button role="tab" class="ptab ${id === pid ? "sel" : ""} st-${q.state}" data-ui="pol" data-id="${id}" aria-selected="${id === pid}"><b>${esc(id === "NEW" ? "New" : id)}</b><span>${esc(q.name)}</span><i>${q.state === "on" ? "● On" : q.state === "report" ? "◐ Report-only" : "○ Off"}</i></button>`; }).join("");
  const tip = !SAVE.state.lab.seen.gconsole ? `<p class="ctip">${ICON("information")}Every enabled policy that matches a sign-in applies. <b>Block</b> in any of them wins; otherwise every grant must be met.</p>` : "";
  return `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("gear")} Conditional Access <span class="muted">· Microsoft Entra admin center (simulated)</span></h2><button class="btn ghost small" data-ui="close" aria-label="Close console">✕</button></header>
    ${tip}<div class="cgrid"><div class="ptabs" role="tablist" aria-label="Policies">${tabs}</div><div class="ped">${ed}</div></div>
    ${errs.length ? `<p class="err" role="alert">${esc(errs.join(" "))}</p>` : ""}
    <div class="pact"><button class="btn primary" data-ui="run" id="btn-run" ${errs.length ? "disabled" : ""}>▶ Run sign-ins <kbd>R</kbd></button><button class="btn" data-ui="undo" ${r.undo.length ? "" : "disabled"}>↶ Undo</button><button class="btn" data-ui="reset">Reset policies</button><button class="btn ghost" data-ui="close">Back <kbd>Esc</kbd></button></div></div>`;
}
function openConsole(){
  if (W.run.phase !== "play"){ toast("The mission is complete. Restart it from the menu to change policies.", ""); return; }
  openPanel("console", consoleHtml(), { label:"Conditional Access console" });
  tutorial("console");
  if (tut === "run") coach("Friday's <b>CA02</b> blocks everything outside the office network. Change it, then <b>Run sign-ins</b>.");
}
function rerenderConsole(focusSel){
  if (open !== "console") return;
  const a = document.activeElement, fs = focusSel || (a && a.dataset && (a.dataset.f ? `[data-f="${a.dataset.f}"][value="${a.value}"]` : a.dataset.ex ? `[data-ex="${a.dataset.ex}"]` : a.dataset.ctl ? `[data-ctl="${a.dataset.ctl}"]` : a.dataset.ui ? `[data-ui="${a.dataset.ui}"]${a.dataset.id ? `[data-id="${a.dataset.id}"]` : ""}` : null));
  el("panel").innerHTML = consoleHtml();
  const f = fs && el("panel").querySelector(fs); (f || el("panel").querySelector("#btn-run") || el("panel").querySelector("button")).focus({ preventScroll:true });
}
function change(fn){ const r = run(); r.undo.push(JSON.parse(JSON.stringify(r.policies))); if (r.undo.length > 40) r.undo.shift(); fn(r); SAVE.state.lab.seen.gconsole = true; W.persist(); rerenderConsole(); }
function doRun(){
  if (!W.runSignins(false)) return;
  closePanel(true); tutorial("ran");
  coach("Watch the gates…");
}
function afterRun(res){
  const r = run();
  refreshHUD();
  const fails = r.requirements.filter(k => !res.req[k].ok);
  if (res.solved){
    W.celebrate();
    el("banner").innerHTML = `<div class="bn-in" role="status"><span class="stamp">ACCESS RESTORED</span><p>Every requirement met in ${r.tests} run${r.tests === 1 ? "" : "s"}.</p><button class="btn primary" data-ui="continue" autofocus>Continue →</button></div>`;
    el("banner").hidden = false; open = "banner"; el("banner").querySelector("button").focus();
    el("live").textContent = "Access restored. Every requirement met.";
  } else {
    const k = fails[0], d = M.requirementDefs[k];
    coach(`<b>${r.requirements.length - fails.length}/${r.requirements.length}</b> met. ✕ <b>${esc(d.text)}</b>: ${esc(res.req[k].why)} <span class="muted">Inspect, then adjust the console.</span>`);
  }
}

/* ---------- Hints: clue → highlight → worked explanation ---------- */
function hint(){
  if (!W || W.run.phase !== "play" || open && open !== "console") return;
  const r = run(), hs = M.variants[r.level].hints;
  if (hintTier >= 3){ openWorked(); return; }
  const h = hs[hintTier]; hintTier++; r.hints = Math.max(r.hints, hintTier); W.persist();
  if (hintTier === 1){ coach("<b>Clue:</b> " + esc(h)); toast("Hint 1 of 3", ""); }
  else if (hintTier === 2){ W.highlights = h.highlight.slice(); const pol = h.highlight.find(x => x.includes(".")); if (pol) W.selPolicy = pol.split(".")[0];
    coach("<b>Hint 2:</b> look at the highlighted people and the highlighted console setting."); toast("Hint 2 of 3", ""); if (open === "console") rerenderConsole(); }
  else openWorked();
  el("btn-hint").textContent = hintTier >= 3 ? "Worked answer" : `Hint ${hintTier + 1}/3`;
}
function openWorked(){
  const h = M.variants[run().level].hints[2];
  openPanel("worked", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("information")} Worked explanation</h2></header><p>${h}</p><div class="pact"><button class="btn primary" data-ui="console" autofocus>Open console</button><button class="btn" data-ui="close">Close</button></div></div>`);
}

/* ---------- Completion: XP, prediction, debrief ---------- */
function complete(){
  el("banner").hidden = true; open = null;
  const r = run(), ms = SAVE.state.lab.missions.gates, first = !ms.levelsDone[r.level];
  xp(first ? 60 : 30, first ? "Gates restored" : "Gates restored (replay)");
  if (!r.hints) xp(10, "No hints");
  if (r.bonus.every(k => r.results.bonus[k].ok)) xp(15, "Best practice");
  // Solving is a difficulty signal only (many runs are fine: that's experimentation). It is not mastery evidence.
  const solveId = "lab-mml-solve-" + r.level;
  if (!(ms.adaptSent || []).includes(solveId)){ SAVE.queue({ type:"adapt", item:solveId, correct:true, hints:r.hints, conf: r.solvedAtTest <= 4 ? "sure" : "guess" }); ms.adaptSent = (ms.adaptSent || []).concat(solveId); }
  ms.levelsDone[r.level] = (ms.levelsDone[r.level] || 0) + 1; ms.completed++; ms.best = Math.max(ms.best || 0, r.level);
  r.phase = "predict"; W.persist();
  W._predActor = W.startPrediction();
}
function askPrediction(a){
  const d = a.data, pb = el("predict");
  pb.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="pred-q"><p class="pk">Check your understanding</p><p id="pred-q"><b>${esc(d.kind === "attacker" ? "Ana's password, " + d.location.label : d.name + ", " + d.location.label)}</b><br><span class="muted">${esc(d.device.label)} (${esc(d.device.state)}) · ${esc(M.apps.find(x => x.id === d.app).label)} · ${esc(d.mfaLabel)}${d.riskLabel ? " · risk " + esc(d.riskLabel) : ""}</span></p>
    <p>With <b>your</b> policies, what happens at the gate?</p><div class="popts">${[["allowed","Gets in, no prompt"],["mfa","Gets in after MFA"],["stopped","Stopped"]].map(([v, l]) => `<button class="btn" data-ui="pred" data-v="${v}">${l}</button>`).join("")}</div>
    <button class="btn ghost small" data-ui="ev" data-id="${a.id}">Inspect first</button></div>`;
  pb.hidden = false; open = "predict"; pb.querySelector("[data-ui=pred]").focus({ preventScroll:true });
  coach("Predict first, then watch the gate.");
}
function predict(v){
  const r = run(), ms = SAVE.state.lab.missions.gates, ok = v === r.pred.truth;
  r.pred.choice = v; if (!ms.predUsed.includes(r.pred.id)) ms.predUsed.push(r.pred.id);
  // A judgment on a fresh scenario, made before seeing the result: this is the mastery evidence.
  SAVE.queue({ type:"evidence", item:"lab-mml-predict-" + r.pred.id, correct:ok, hints:0, conf:null });
  ms.history = (ms.history || []).concat({ level:r.level, clean: r.hints === 0 && r.solvedAtTest <= 4, predOk:ok, date:SAVE.localDate() }).slice(-30);
  W.persist();
  el("predict").hidden = true; open = null;
  const a = W._predActor;
  coach(ok ? "Locked in. Watch…" : "Locked in. Let's see…");
  W.playPrediction(a, () => {
    xp(ok ? 15 : 5, ok ? "Prediction correct" : "Prediction reviewed");
    const res = a.result;
    toast((ok ? "✓ Correct: " : "✕ Not quite: ") + E.describe(M, a.data, res), ok ? "ok" : "no");
    setTimeout(() => debrief(ok), 700);
  });
}
function diffLines(){
  const r = run(), base = M.basePolicies, out = [];
  r.order.forEach(id => { const p = r.policies[id], b = base[id], nm = id === "NEW" ? "New policy" : id;
    ["state","include","network","client","risk"].forEach(k => { if (p[k] !== b[k]) out.push(`${nm} ${E.FIELD_LABEL[k]}: ${E.optLabel(k, b[k])} → ${E.optLabel(k, p[k])}`); });
    if (p.grant !== b.grant || JSON.stringify(p.controls) !== JSON.stringify(b.controls) || (p.grant === "grant" && p.op !== b.op)){
      const g = q => q.grant === "block" ? "Block access" : E.CTRL.filter(c => q.controls[c[0]]).map(c => c[1].replace("Require ", "")).join(q.op === "and" ? " AND " : " OR ");
      out.push(`${nm} Grant: ${g(b)} → ${g(p)}`); }
    const add = p.exclude.filter(x => !b.exclude.includes(x)), rem = b.exclude.filter(x => !p.exclude.includes(x));
    if (add.length) out.push(`${nm} Exclude: + ${add.map(x => E.principalLabel(M, x)).join(", ")}`);
    if (rem.length) out.push(`${nm} Exclude: − ${rem.map(x => E.principalLabel(M, x)).join(", ")}`);
  });
  return out;
}
function debrief(predOk){
  const r = run(), res = r.results, ch = diffLines();
  const legit = r.variantActors.filter(id => M.actors[id].legit), bad = r.variantActors.filter(id => !M.actors[id].legit);
  const how = id => { const x = res.res[id]; return x.outcome === "mfa" ? "after MFA" : M.actors[id].auth === "passkey" ? "with a passkey" : x.usedDevice ? "on a compliant device" : "without a prompt"; };
  const legitTxt = legit.map(id => `${who(M.actors[id]).split(" ")[0]} ${how(id)}`).join(", ");
  const badTxt = bad.map(id => { const x = res.res[id]; return `${M.actors[id].P ? "" : ""}${id === "imap" ? "the IMAP script" : "the leaked password"} ${x.outcome === "blocked" ? "was blocked by " + x.blockedBy.join(", ") : "failed " + x.unmet.map(u => u.policy).join(", ") + "'s grant"}`; }).join("; ");
  const bonusOk = r.bonus.every(k => res.bonus[k].ok);
  r.phase = "debrief"; W.persist();
  openPanel("debrief", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title" tabindex="-1">Debrief <span class="muted">· ${LEVELS[r.level]}</span></h2><span class="stamp sm">FILED</span></header>
    <ol class="db3">
      <li><b>You changed</b> ${ch.length ? ch.map(esc).join("; ") : "nothing"}.</li>
      <li><b>So</b> ${esc(legitTxt)} got in, and ${esc(badTxt)}.${bonusOk ? "" : ' <span class="warn">Tip: exclude the emergency access account from every policy (Microsoft guidance for break-glass accounts).</span>'}</li>
      <li><b>Exam concept · SC-300 2.2.3</b> Every matching Conditional Access policy applies: <b>Block wins</b>, otherwise <b>all</b> grant controls must be met, and <b>exclusions beat inclusions</b>. Your prediction was ${predOk ? "right" : "off, so the study library marks this objective for review"}.</li>
    </ol>
    <details class="more"><summary>Learn more</summary>${M.learnMore}<p class="muted small">${esc(M.simplifications)}</p></details>
    <div class="pact"><button class="btn primary" data-ui="again" autofocus>Play again</button>${r.level < 3 ? `<button class="btn" data-ui="harder">Try ${LEVELS[r.level + 1]}</button>` : ""}<a class="btn" href="library.html">Study library</a><button class="btn ghost" data-ui="close">Explore</button></div></div>`, { label:"Debrief" });
  el("panel-title").focus();
}

/* ---------- Menu ---------- */
function openMenu(){
  const S = SAVE.state, st = S.lab.game.settings, l = SAVE.level(S.xp || 0), mode = S.profile.difficultyMode || "adaptive";
  openPanel("menu", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header class="ph"><h2 id="panel-title">${ICON("pause")} Paused</h2><span class="muted small">Lv ${l.n} · ${S.xp || 0} XP</span></header>
    <div class="mgrid">
      <section><h3>Mission</h3><div class="mcol"><button class="btn primary" data-ui="close" autofocus>Resume <kbd>Esc</kbd></button><button class="btn" data-ui="hint">${hintTier >= 3 ? "Worked answer" : "Hint"} <kbd>H</kbd></button><button class="btn" data-ui="restart">Restart mission</button></div>
        <h3>Without walking</h3><div class="mcol"><button class="btn" data-ui="console">Open security console</button><button class="btn" data-ui="log">Sign-in logs <kbd>L</kbd></button></div></section>
      <section><h3>Settings</h3>
        <label class="fld">Difficulty<select id="set-diff">${[["adaptive","Adaptive (recommended)"],["1","Guided"],["2","Standard"],["3","Advanced"]].map(([v, t]) => `<option value="${v}" ${String(mode) === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="fld">Motion<select id="set-motion">${[["system","Follow system setting"],["reduce","Reduced motion"],["full","Full motion"]].map(([v, t]) => `<option value="${v}" ${st.motion === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="chkl"><input type="checkbox" id="set-labels" ${st.labels ? "checked" : ""}> Name and status labels in the world</label>
        <p class="muted small">Difficulty changes apply when you restart the mission.</p></section>
      <section><h3>Learn</h3><details><summary>How Conditional Access decides</summary>${M.learnMore}</details><details><summary>Simulation simplifications</summary><p>${esc(M.simplifications)}</p><p>Physical gates stand in for app access: each gate is a sign-in to that app, checked by the same Conditional Access policies.</p></details>
        <details><summary>Sources (Microsoft Learn)</summary><ul>${M.sources.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("")}</ul></details>
        <details><summary>Credits</summary><p>Art: <b>Kenney</b> (RPG Urban Pack, Game Icons, Kenney Fonts), CC0, kenney.nl. Gates, console, racks, drone and signs: original pixel art for this game. Engine: Phaser 3 (MIT).</p><p><a href="ASSET_CREDITS.md" target="_blank">Full asset credits</a></p></details>
        <p><a class="btn" href="library.html">Open the study library</a></p><p class="muted small">Build ${window.IDGame.VERSION} · progress ${SAVE.ok ? "saves in this browser" : "can't be saved here"}.</p></section>
    </div></div>`, { label:"Pause menu" });
}

/* ---------- Touch controls ---------- */
function isTouch(){ return matchMedia("(pointer: coarse)").matches || "ontouchstart" in window; }
function setupTouch(){
  const pad = el("tpad"), act = el("tact");
  if (!isTouch()){ el("touch").hidden = true; return; }
  el("touch").hidden = false;
  let id = null, cx = 0, cy = 0;
  const knob = pad.querySelector(".knob");
  const set = (x, y) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), m = 42, k = d > m ? m / d : 1;
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`; W.touchDir = d < 8 ? { x:0, y:0 } : { x:dx / Math.max(d, m), y:dy / Math.max(d, m) }; };
  pad.addEventListener("pointerdown", e => { id = e.pointerId; const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; try { pad.setPointerCapture(id); } catch(_){} set(e.clientX, e.clientY); e.preventDefault(); });
  pad.addEventListener("pointermove", e => { if (e.pointerId === id) set(e.clientX, e.clientY); });
  const end = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ""; W.touchDir = { x:0, y:0 }; };
  pad.addEventListener("pointerup", end); pad.addEventListener("pointercancel", end);
  act.addEventListener("click", () => W.interact());
}

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-ui]"); if (!t || t.disabled || !W) return;
  const k = t.dataset.ui, r = run();
  if (k === "close"){ if (open === "debrief" || open === "worked" || open === "menu" || open === "evidence" || open === "log") { closePanel(); if (r.phase === "debrief") coach("Explore the campus, or open the menu to play again."); return; } closePanel(); return; }
  if (k === "console"){ closePanel(true); openConsole(); return; }
  if (k === "log"){ closePanel(true); openLog(); return; }
  if (k === "ev"){ const a = W.actors[t.dataset.id]; if (open === "predict"){ el("predict").hidden = true; open = null; openPanel("evidence", `<div class="pbody" role="dialog" aria-modal="true" aria-labelledby="panel-title">${evidenceHtml(a)}<div class="pact"><button class="btn primary" data-ui="backpred" autofocus>Back to the prediction</button></div></div>`); return; } closePanel(true); openEvidence(a); return; }
  if (k === "backpred"){ closePanel(true); askPrediction(W._predActor); return; }
  if (k === "pol"){ W.selPolicy = t.dataset.id; rerenderConsole(`[data-ui="pol"][data-id="${t.dataset.id}"]`); return; }
  if (k === "run") return doRun();
  if (k === "undo"){ if (!r.undo.length) return; r.policies = r.undo.pop(); W.persist(); rerenderConsole(); return; }
  if (k === "reset"){ r.undo.push(JSON.parse(JSON.stringify(r.policies))); const fresh = window.IDGame.newRun(r.level); r.policies = fresh.policies; W.persist(); rerenderConsole(); toast("Policies reset to Friday's configuration"); return; }
  if (k === "continue") return complete();
  if (k === "pred") return predict(t.dataset.v);
  if (k === "hint"){ closePanel(true); hint(); return; }
  if (k === "restart" || k === "again"){ closePanel(true); W.restart(); return; }
  if (k === "harder"){ closePanel(true); W.restart(Math.min(3, r.level + 1)); return; }
  if (k === "menu"){ open === "menu" ? closePanel() : openMenu(); return; }
});
document.addEventListener("change", e => {
  const t = e.target; if (!W) return;
  if (t.id === "set-diff"){ SAVE.state.profile.difficultyMode = t.value; SAVE.save(); toast("Saved. Restart the mission to apply."); return; }
  if (t.id === "set-motion"){ SAVE.state.lab.game.settings.motion = t.value; SAVE.save(); return; }
  if (t.id === "set-labels"){ SAVE.state.lab.game.settings.labels = t.checked; SAVE.save(); return; }
  if (open !== "console") return;
  if (t.dataset.f){ const [pid, f] = t.dataset.f.split("."); change(r => { r.policies[pid][f] = t.value; if (f === "grant" && t.value === "grant" && !E.CTRL.some(c => r.policies[pid].controls[c[0]])) r.policies[pid].controls.mfa = true; });
    if (f === "state" && t.value === "report" && !SAVE.state.lab.seen.greport){ SAVE.state.lab.seen.greport = true; coach("Report-only policies are evaluated and logged, but <b>never enforced</b>."); } return; }
  if (t.dataset.ex){ const [pid, x] = t.dataset.ex.split("."); change(r => { const ex = r.policies[pid].exclude; if (t.checked){ if (!ex.includes(x)) ex.push(x); } else ex.splice(ex.indexOf(x), 1); });
    if (!SAVE.state.lab.seen.gexclude){ SAVE.state.lab.seen.gexclude = true; coach("Exclusions always beat inclusions."); } return; }
  if (t.dataset.ctl){ const [pid, c] = t.dataset.ctl.split("."); change(r => { r.policies[pid].controls[c] = t.checked; }); }
});
window.addEventListener("keydown", e => {
  if (!W) return;
  if (e.key === "Escape"){ if (open === "predict" || open === "banner") return; if (open){ e.preventDefault(); closePanel(); } else { e.preventDefault(); openMenu(); } return; }
  const typing = e.target && (e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA" || (e.target.tagName === "INPUT" && !["radio","checkbox"].includes(e.target.type)));
  if (open === "console" && (e.key === "r" || e.key === "R") && !typing && !e.ctrlKey && !e.metaKey){ e.preventDefault(); if (!el("btn-run").disabled) doRun(); return; }
  if (!open && (e.key === "p" || e.key === "P")){ e.preventDefault(); openMenu(); }
  // focus trap inside panels
  if (open && e.key === "Tab"){
    const root = open === "predict" ? el("predict") : open === "banner" ? el("banner") : el("panel");
    const f = [...root.querySelectorAll("button, input, select, a[href], summary")].filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]){ e.preventDefault(); f[0].focus(); }
  }
});
function floatText(x, y, text, kind){
  if (!W) return; const cam = W.cameras.main, v = cam.worldView, z = cam.zoom;
  const t = document.createElement("div"); t.className = "float " + (kind || ""); t.textContent = text;
  t.style.left = Math.round((x - v.x) * z) + "px"; t.style.top = Math.round((y - v.y) * z) + "px";
  el("tags").appendChild(t); setTimeout(() => t.remove(), 2200);
}
function onRestart(){ hintTier = 0; W.highlights = []; W.selPolicy = null; el("btn-hint").textContent = "Hint"; el("hud-level").textContent = LEVELS[W.run.level]; el("banner").hidden = true; el("predict").hidden = true; open = null; refreshHUD(); }

window.UI = { bind:b => { bind(b); buildStaticTags(); }, blocking, refreshHUD, refreshBuildingTags, coach, toast, tutorial, afterIntro, afterRun, frame, openEvidence, openConsole, openLog, hint, askPrediction, floatText, onRestart, openMenu, get open(){ return open; } };
})();
