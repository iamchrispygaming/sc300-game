/* Identity Defender · Ops workspace: Conditional Access simulator and mission loop. */
(function () {
"use strict";
const LAB = window.ID_LAB;
const API = () => window.__ID;
const ST = () => API().state;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clone = o => JSON.parse(JSON.stringify(o));
const LEVELS = ["", "Guided", "Standard", "Advanced"];
const FIELD_LABEL = { state:"State", include:"Users", exclude:"Exclude", network:"Network", client:"Client apps", risk:"Sign-in risk", grant:"Grant", controls:"Grant", op:"For multiple controls" };
const OPT = {
  state:[["on","On"],["report","Report-only"],["off","Off"]],
  include:[["all","All users"],["remote","Remote staff"],["office","Office staff"]],
  network:[["any","Any network"],["outside","Outside Halcyon offices"],["inside","Halcyon offices only"]],
  client:[["any","Any client app"],["legacy","Legacy authentication"],["modern","Modern clients only"]],
  risk:[["any","Not configured"],["high","High"],["medhigh","Medium and high"]],
  grant:[["block","Block access"],["grant","Grant access"]],
  op:[["and","Require all selected"],["or","Require one selected"]]
};
const CTRL = [["mfa","Require multifactor authentication"],["compliant","Require compliant device"],["hybrid","Require hybrid joined device"]];
const optLabel = (k, v) => ((OPT[k] || []).find(o => o[0] === v) || [v, v])[1];

/* ===================== Simulation engine ===================== */
function matches(actor, id){ return actor.groups.includes(id) || actor.principal === id; }
function principalLabel(M, id){ const p = M.principals.find(x => x.id === id); return p ? p.label : id; }
function capable(actor){
  const modern = actor.client !== "legacy";   // legacy protocols can't satisfy interactive controls
  return { mfa: modern && (actor.mfa || actor.auth === "passkey"), compliant: modern && actor.device.compliant, hybrid: modern && actor.device.hybrid };
}
function evalPolicy(M, p, a){
  const r = { id:p.id, name:p.name, state:p.state, applies:false, why:"", block:false, ok:true, used:{}, unmet:[] };
  if (p.state === "off"){ r.why = "Policy is off"; return r; }
  const ex = p.exclude.find(x => matches(a, x));
  if (ex){ r.why = "Not applied: excluded (" + principalLabel(M, ex) + ")"; return r; }
  if (p.include !== "all" && !matches(a, p.include)){ r.why = "Not applied: user isn't in " + optLabel("include", p.include); return r; }
  if (p.apps !== "all" && !p.apps.includes(a.app)){ r.why = "Not applied: app isn't targeted"; return r; }
  if (p.network === "outside" && a.location.named === "offices"){ r.why = "Not applied: Halcyon offices are excluded"; return r; }
  if (p.network === "inside" && a.location.named !== "offices"){ r.why = "Not applied: not in Halcyon offices"; return r; }
  if (p.client === "legacy" && a.client !== "legacy"){ r.why = "Not applied: client app isn't legacy"; return r; }
  if (p.client === "modern" && a.client === "legacy"){ r.why = "Not applied: legacy client isn't targeted"; return r; }
  if (p.risk === "high" && a.risk !== "high"){ r.why = "Not applied: sign-in risk is " + a.risk; return r; }
  if (p.risk === "medhigh" && !["medium","high"].includes(a.risk)){ r.why = "Not applied: sign-in risk is " + a.risk; return r; }
  r.applies = true;
  if (p.grant === "block"){ r.block = true; r.why = "Applied: Block"; return r; }
  const can = capable(a), sel = CTRL.map(c => c[0]).filter(k => p.controls[k]);
  if (p.op === "and"){ r.ok = sel.every(k => can[k]); sel.forEach(k => can[k] ? r.used[k] = true : r.unmet.push(k)); }
  else { r.ok = sel.some(k => can[k]); const dev = sel.find(k => k !== "mfa" && can[k]); if (dev) r.used[dev] = true; else if (can.mfa && sel.includes("mfa")) r.used.mfa = true; if (!r.ok) r.unmet = sel; }
  r.why = "Applied: " + sel.map(k => CTRL.find(c => c[0] === k)[1].replace("Require ", "")).join(p.op === "and" ? " + " : " or ") + (r.ok ? " → met" : " → not met");
  return r;
}
function unmetReason(a, k){
  if (a.client === "legacy") return "legacy authentication can't do " + (k === "mfa" ? "MFA" : "device checks");
  if (k === "mfa") return a.kind === "attacker" ? "MFA not completed (no access to the real user's factor)" : "MFA not available";
  if (k === "compliant") return a.device.label + " isn't compliant";
  return a.device.label + " isn't hybrid joined";
}
function simulate(M, policies, a){
  const per = policies.map(p => evalPolicy(M, p, a));
  const live = per.filter(r => r.applies && r.state === "on"), shadow = per.filter(r => r.applies && r.state === "report");
  const res = { per, outcome:"allowed", blockedBy:[], unmet:[], usedMfa:a.auth === "passkey", usedDevice:false, reportOnly:shadow.map(r => r.id + (r.block ? " would block" : r.ok ? " would grant" : " would fail")) };
  const blocks = live.filter(r => r.block);
  if (blocks.length){ res.outcome = "blocked"; res.blockedBy = blocks.map(r => r.id); return res; }
  const bad = live.filter(r => !r.ok);
  if (bad.length){ res.outcome = "failed"; bad.forEach(r => r.unmet.forEach(k => res.unmet.push({ policy:r.id, control:k, text:unmetReason(a, k) }))); return res; }
  live.forEach(r => { if (r.used.mfa) res.usedMfa = true; if (r.used.compliant || r.used.hybrid) res.usedDevice = true; });
  res.outcome = live.some(r => r.used.mfa) && a.auth !== "passkey" ? "mfa" : "allowed";
  return res;
}
const OUTCOME = { allowed:{ icon:"✓", label:"Signed in", cls:"ok" }, mfa:{ icon:"✓", label:"Signed in after MFA", cls:"ok" }, blocked:{ icon:"✕", label:"Blocked", cls:"no" }, failed:{ icon:"✕", label:"Couldn't sign in", cls:"no" } };
const gotIn = r => r.outcome === "allowed" || r.outcome === "mfa";
function describe(M, a, r){
  if (r.outcome === "blocked") return "Blocked by " + r.blockedBy.map(id => id).join(", ") + ".";
  if (r.outcome === "failed") return r.unmet.map(u => u.policy + ": " + u.text).join("; ") + ".";
  const how = a.auth === "passkey" ? "with a passkey" : r.outcome === "mfa" ? "after MFA" : r.usedDevice ? "on a compliant device" : "with just a password";
  return "Signed in " + how + (r.reportOnly.length ? " (" + r.reportOnly.join(", ") + ", report-only)" : "") + ".";
}
function checkRequirement(M, key, res, policies, actors){
  const d = M.requirementDefs[key], a = d.actor && M.actors[d.actor], r = d.actor && res[d.actor];
  if (d.kind === "allowed"){ const ok = gotIn(r); return { ok, why: ok ? describe(M, a, r) : a.name.split(" ")[0] + ": " + (r.outcome === "blocked" ? "blocked by " + r.blockedBy.join(", ") + "." : r.unmet.map(u => u.policy + ", " + u.text).join("; ") + ".") }; }
  if (d.kind === "stopped"){ const ok = !gotIn(r); let why = ok ? describe(M, a, r) : "Got in " + (r.outcome === "mfa" ? "after MFA" : "with just the password") + ".";
    if (!ok && r.reportOnly.length) why += " Report-only policies log results but don't enforce them.";
    return { ok, why }; }
  if (d.kind === "remoteStrong"){
    const weak = actors.filter(id => { const x = M.actors[id]; return x.legit && x.location.named !== "offices" && gotIn(res[id]) && !res[id].usedMfa && !res[id].usedDevice; });
    return { ok:!weak.length, why: weak.length ? weak.map(id => M.actors[id].name.split(" ")[0]).join(", ") + " got in from outside the office with only a password." : "Every off-site sign-in that got in used MFA, a passkey or a compliant device." };
  }
  if (d.kind === "blockedByPolicy"){ const ok = r.outcome === "blocked"; return { ok, why: ok ? "Blocked by " + r.blockedBy.join(", ") + "." : (gotIn(r) ? "The risky sign-in got in." : "It failed MFA, but no policy blocks high-risk sign-ins outright.") }; }
  if (d.kind === "excludedEverywhere"){ const miss = policies.filter(p => p.state !== "off" && !p.exclude.includes(d.principal)).map(p => p.id); return { ok:!miss.length, why: miss.length ? "Not excluded from " + miss.join(", ") + "." : "Excluded from every active policy." }; }
  return { ok:false, why:"" };
}
function runAll(M, run){
  const pols = run.order.map(id => run.policies[id]), res = {};
  run.variantActors.forEach(id => { res[id] = simulate(M, pols, M.actors[id]); });
  const req = {}; run.requirements.forEach(k => { req[k] = checkRequirement(M, k, res, pols, run.variantActors); });
  const bonus = {}; run.bonus.forEach(k => { bonus[k] = checkRequirement(M, k, res, pols, run.variantActors); });
  return { res, req, bonus, solved: run.requirements.every(k => req[k].ok) };
}
function validate(run){
  const errs = [];
  run.order.forEach(id => { const p = run.policies[id]; if (p.state !== "off" && p.grant === "grant" && !CTRL.some(c => p.controls[c[0]])) errs.push(p.id + ": choose at least one grant control, or Block."); });
  return errs;
}

/* ===================== State ===================== */
function labState(){ const S = ST(); if (!S.lab) S.lab = { seen:{}, missions:{}, run:null }; return S.lab; }
function missionState(id){ const L = labState(); return L.missions[id] || (L.missions[id] = { completed:0, levelsDone:{}, predUsed:[], best:null }); }
function levelFor(M){
  const S = ST(), mode = S.profile.difficultyMode;
  if (mode && mode !== "adaptive") return +mode;
  const T = S.topics && S.topics[M.topic];
  return T && T.placed ? T.level : 1;
}
function newRun(mid, level){
  const M = LAB.missions[mid], v = M.variants[level];
  return { mission:mid, level, policies:Object.fromEntries(v.policies.map(id => [id, clone(M.basePolicies[id])])), order:v.policies.slice(),
    variantActors:v.actors.slice(), requirements:v.requirements.slice(), bonus:v.bonus.slice(), undo:[], results:null, tests:0, hints:0,
    selected:{ type:"policy", id:v.policies.includes("CA02") ? "CA02" : v.policies[0] }, actorSel:null, phase:"play", pred:null, stale:false,
    seen:{}, concept:"start", startedAt:Date.now(), solvedAtTest:null, xp:0, highlights:[] };
}
function run(){ return labState().run; }
function mission(){ return LAB.missions[run().mission]; }
function ensureRun(){
  const L = labState();
  if (!L.run || !LAB.missions[L.run.mission]) L.run = newRun("mml", levelFor(LAB.missions.mml));
  return L.run;
}
function persist(){ API().save(); }
function concept(key){ const r = run(); if (r.seen[key] && key !== "retest") return; r.seen[key] = true; r.concept = key; }

/* ===================== Rendering ===================== */
const ICON = {
  person:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0z"/>',
  attacker:'<path d="M12 3c-3.5 0-6 2.6-6 6v3l-2 3h16l-2-3V9c0-3.4-2.5-6-6-6zm-3 9a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 9 12zm6 0a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 15 12zM8 17h8l-1 3H9z"/>',
  admin:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5zm0 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-4 9a4 4 0 0 1 8 0z"/>',
  laptop:'<path d="M4 5h16v10H4zM2 17h20v2H2z"/>', tablet:'<path d="M6 2h12v20H6zm5 17h2v1h-2z"/>', unknown:'<path d="M4 5h16v10H4zM2 17h20v2H2zM11 13h2v-1.5c1.6-.5 2.5-1.6 2.5-3a3.5 3.5 0 0 0-7 0h2a1.5 1.5 0 1 1 3 0c0 .9-1.5 1.2-2.5 1.8z"/>',
  mail:'<path d="M3 5h18v14H3zm2 2v.5l7 4.5 7-4.5V7z"/>', doc:'<path d="M6 2h8l5 5v15H6zm8 1v5h5"/>', chat:'<path d="M3 4h18v12H8l-5 4z"/>',
  shield:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/>', loc:'<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'
};
const svgIcon = (k, cls) => `<svg class="ico ${cls||""}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ICON.person}</svg>`;

function render(el){
  ensureRun();
  const r = run(), M = mission();
  const focusId = document.activeElement && document.activeElement.id;
  el.innerHTML = `<div class="ops ${r.phase !== "play" ? "dim" : ""}" id="ops">${headHtml(M, r)}${checklistHtml(M, r)}
    <div class="ops-grid">
      <section class="ops-col sign" aria-labelledby="sg-h"><h3 id="sg-h" class="ops-h">${svgIcon("person")} Sign-ins</h3><div class="cards">${r.variantActors.map(id => actorCard(M, r, id)).join("")}</div></section>
      <section class="ops-col mapcol" aria-label="Access map and test">${mapHtml(M, r)}${resultBanner(M, r)}${inspectorHtml(M, r)}</section>
      <section class="ops-col tools" aria-labelledby="pol-h"><h3 id="pol-h" class="ops-h">${svgIcon("shield")} Policies</h3>${policyTabs(M, r)}${policyEditor(M, r)}</section>
    </div>${r.phase === "predict" ? predictHtml(M, r) : ""}${r.phase === "debrief" ? debriefHtml(M, r) : ""}
    <p class="sr-only" id="ops-live" aria-live="polite"></p></div>`;
  if (r.phase !== "play"){
    el.querySelectorAll(".ops-head, .checklist, .ops-grid").forEach(x => x.setAttribute("inert", ""));
    const f = focusId && document.getElementById(focusId);
    if (f && f.closest(".overlay")) f.focus({ preventScroll:true });
    else { const g = el.querySelector(".overlay .pred-opt:not(:disabled)") || el.querySelector("#lab-debrief") || el.querySelector("#db-h"); if (g) g.focus({ preventScroll:true }); }
  } else if (focusId){ const f = document.getElementById(focusId); if (f) f.focus({ preventScroll:true }); }
  drawMarks(M, r, false);
}
function headHtml(M, r){
  const msg = r.hintText ? `<span class="coach-hint">${r.hintText}</span>` : (M.concepts[r.concept] || "");
  return `<header class="ops-head"><div class="oh-left"><span class="oh-code">${esc(M.code)}</span><h2 id="case-title" tabindex="-1">${esc(M.title)}</h2><span class="lvchip l${r.level}" title="Adapted to your Conditional Access level">${LEVELS[r.level]}</span></div>
    <p class="oh-brief">${esc(M.briefing)} <b>${esc(M.objective)}</b></p>
    <div class="oh-bar"><div class="coach" role="status">${svgIcon("shield","coach-ico")}<span>${msg}</span></div>
      <div class="oh-tools"><button class="btn primary big" id="lab-test" data-lab="test" ${validate(r).length || r.phase !== "play" ? "disabled" : ""} aria-keyshortcuts="t">▶ Test</button>
      <button class="btn" id="lab-hint" data-lab="hint" ${r.hints >= 3 || r.phase !== "play" ? "disabled" : ""} aria-keyshortcuts="h">Hint ${r.hints < 3 ? `(${r.hints + 1}/3)` : ""}</button>
      <button class="btn" id="lab-undo" data-lab="undo" ${r.undo.length && r.phase === "play" ? "" : "disabled"} aria-keyshortcuts="u">↶ Undo</button>
      <button class="btn" id="lab-reset" data-lab="reset" ${r.phase === "play" ? "" : "disabled"}>Reset</button></div></div>
    ${validate(r).length ? `<p class="lab-err" role="alert">${esc(validate(r).join(" "))}</p>` : ""}
    ${r.worked ? `<div class="worked-hint"><b>Worked explanation</b><p>${r.worked}</p></div>` : ""}</header>`;
}
function checklistHtml(M, r){
  const res = r.results;
  const item = (k, bonus) => { const d = M.requirementDefs[k], s = res && (bonus ? res.bonus[k] : res.req[k]);
    const st = !res ? "pending" : s.ok ? "ok" : "no", ico = st === "ok" ? "✓" : st === "no" ? "✕" : "○";
    return `<li class="rq ${st} ${bonus ? "bonus" : ""}"><button class="req-btn" data-lab="req" data-key="${k}" id="req-${k}" aria-describedby="reqd-${k}"><span class="ri" aria-hidden="true">${ico}</span><span class="rt">${esc(d.text)}</span><span class="sr-only">${st === "ok" ? "met" : st === "no" ? "not met" : "not tested"}</span></button>${res ? `<span class="rwhy" id="reqd-${k}">${esc(s.why)}</span>` : `<span class="rwhy" id="reqd-${k}"></span>`}</li>`; };
  const met = res ? r.requirements.filter(k => res.req[k].ok).length : 0;
  return `<section class="checklist" aria-labelledby="cl-h"><h3 id="cl-h" class="ops-h">Requirements <span class="cl-count">${res ? `${met}/${r.requirements.length} met` : "not tested yet"}</span></h3>
    <ul>${r.requirements.map(k => item(k)).join("")}${r.bonus.map(k => item(k, true)).join("")}</ul></section>`;
}
function actorCard(M, r, id){
  const a = M.actors[id], res = r.results && r.results.res[id], o = res && OUTCOME[res.outcome];
  const hl = r.highlights.includes(id) ? " hl" : "", sel = r.actorSel === id ? " sel" : "", stale = r.stale && res ? " stale" : "";
  return `<button class="acard k-${a.kind}${hl}${sel}${stale}" id="actor-${id}" data-lab="actor" data-id="${id}" aria-pressed="${r.actorSel === id}">
    <span class="av">${svgIcon(a.kind)}<span class="ini">${esc(a.initials)}</span></span>
    <span class="ac-main"><span class="ac-name">${esc(a.name)}</span><span class="ac-sub">${svgIcon("loc","sm")}${esc(a.location.label)} · ${esc(a.device.label)} · ${esc(M.apps.find(x => x.id === a.app).label)}${a.client === "legacy" ? " (IMAP)" : ""}</span>
      ${a.ticket && !res ? `<span class="ticket">“${esc(a.ticket)}”</span>` : ""}</span>
    <span class="ac-stat ${o ? o.cls : "pend"}">${o ? `<b aria-hidden="true">${o.icon}</b> ${esc(o.label)}` : "Untested"}</span></button>`;
}
function inspectorHtml(M, r){
  if (!r.actorSel) return `<div class="inspector empty"><p>${svgIcon("person","sm")} Select a sign-in to see its evidence.</p></div>`;
  const a = M.actors[r.actorSel], res = r.results && r.results.res[r.actorSel], hl = k => r.highlights.includes(r.actorSel + "." + k) ? " hl" : "";
  const rows = [["User", a.kind === "attacker" ? `${a.account} (account used)` : a.name + " · " + a.role],
    ["Groups", a.groups.length ? a.groups.map(g => principalLabel(M, g)).join(", ") : (a.principal ? "Emergency access account" : "—")],
    ["Location", a.location.label + " · " + a.location.ip + (a.location.named ? " · named: Halcyon offices" : "")],
    ["Device", a.device.label + " · " + a.device.platform + " · " + a.device.state],
    ["Client app", a.clientLabel], ["Sign-in method", a.auth === "passkey" ? "Passkey (counts as MFA)" : "Password"],
    ["MFA", a.mfaLabel], ["Sign-in risk", a.riskLabel || "None"]];
  return `<div class="inspector" aria-labelledby="ins-h"><div class="ins-head"><h3 id="ins-h">${svgIcon(a.kind,"sm")} ${esc(a.name)}</h3>${res ? `<span class="ac-stat ${OUTCOME[res.outcome].cls}"><b aria-hidden="true">${OUTCOME[res.outcome].icon}</b> ${OUTCOME[res.outcome].label}</span>` : ""}<button class="btn small link" data-lab="close-ins" aria-label="Close evidence">Close</button></div>
    <dl class="ev-grid">${rows.map(([k,v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
    ${res ? `<h4>Conditional Access results</h4><ul class="pres">${res.per.map(p => `<li class="${p.applies ? (p.block || !p.ok ? "p-no" : "p-ok") : "p-na"} ${p.state === "report" ? "p-rep" : ""}"><b>${esc(p.id)}</b> ${p.state === "report" && p.applies ? "Report-only · " : ""}${esc(p.why)}</li>`).join("")}</ul>
      <p class="ins-out">${esc(describe(M, a, res))}</p>
      <details class="why"><summary>Why?</summary><p>Every enabled policy whose assignments all match applies to this sign-in. A Block in any of them wins; otherwise each one's grant controls must be met. Policies that didn't apply show the first assignment that didn't match.</p></details>` : `<p class="ins-out muted">Run a test to see which policies apply.</p>`}</div>`;
}
function resultBanner(M, r){
  if (!r.results) return `<div class="rbanner idle"><span>Press <b>▶ Test</b> to replay sign-ins against the current policies.</span></div>`;
  const met = r.requirements.filter(k => r.results.req[k].ok).length, all = r.results.solved;
  if (r.stale) return `<div class="rbanner stale"><span>Policies changed since the last test. Press <b>▶ Test</b> again.</span></div>`;
  return `<div class="rbanner ${all ? "win" : "part"}" role="status">${all ? `<span class="stamp-ok">ALL CLEAR</span><span>Every requirement met in ${r.tests} test${r.tests === 1 ? "" : "s"}.</span><button class="btn primary" id="lab-continue" data-lab="continue">Continue →</button>` : `<span><b>${met} of ${r.requirements.length}</b> requirements met. Select a ✕ requirement or sign-in to see why.</span>`}</div>`;
}
/* Access map: people → Conditional Access → apps */
function layout(M, r){
  const ids = r.variantActors, n = ids.length, H = 40 + n * 66, gy = H / 2;
  const apps = M.apps.map((a, i) => ({ ...a, x:600, y: gy + (i - 1) * Math.min(100, H / 3.2) }));
  const actors = ids.map((id, i) => ({ id, x:34, y: 40 + i * 66 }));
  return { H, gate:{ x:360, y:gy }, apps, actors };
}
function mapHtml(M, r){
  const L = layout(M, r), path1 = a => `M${a.x+24},${a.y} C${a.x+150},${a.y} ${L.gate.x-140},${L.gate.y} ${L.gate.x-34},${L.gate.y}`;
  const path2 = (ap) => `M${L.gate.x+34},${L.gate.y} C${L.gate.x+120},${L.gate.y} ${ap.x-120},${ap.y} ${ap.x-26},${ap.y}`;
  return `<div class="mapwrap"><svg class="amap" id="amap" viewBox="0 0 660 ${L.H}" role="img" aria-label="Access map: sign-ins pass through Conditional Access to apps. Results are listed in the sign-in cards.">
    <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${L.actors.map(a => `<path class="lane" id="lane-${a.id}" d="${path1(a)}"/>`).join("")}
    ${L.apps.map(ap => `<path class="lane out" id="out-${ap.id}" d="${path2(ap)}"/>`).join("")}
    ${L.actors.map(a => { const A = M.actors[a.id]; return `<g class="node actor k-${A.kind} ${r.highlights.includes(a.id) ? "hl" : ""}" data-lab="actor" data-id="${a.id}" transform="translate(${a.x},${a.y})"><circle r="22"/><g transform="translate(-11,-11) scale(.92)"><g class="nico">${ICON[A.kind]}</g></g><text x="0" y="36" class="nl c">${esc(A.name.split(" ")[0] + (A.kind === "attacker" ? "?" : ""))}</text><g class="mark" id="mark-${a.id}"></g></g>`; }).join("")}
    <g class="gate" id="gate" transform="translate(${L.gate.x},${L.gate.y})"><path class="gshield" d="M0,-40 L32,-28 L32,2 C32,22 18,36 0,44 C-18,36 -32,22 -32,2 L-32,-28 Z"/><text y="-2" class="gt">CA</text><text y="14" class="gs">${r.order.filter(id => r.policies[id].state !== "off").length} active</text><text y="64" class="gl">Microsoft Entra ID</text></g>
    ${L.apps.map(ap => `<g class="node app" id="app-${ap.id}" transform="translate(${ap.x},${ap.y})"><rect x="-24" y="-20" width="48" height="40" rx="9"/><g transform="translate(-10,-10) scale(.85)"><g class="nico">${ICON[ap.icon]}</g></g><text y="36" class="nl c">${esc(ap.label)}</text><g class="amark" id="amark-${ap.id}"></g></g>`).join("")}
    <g id="fx"></g></svg>
    <div class="legend" aria-hidden="true"><span><b class="lg ok">✓</b> signed in</span><span><b class="lg mfa">MFA</b> challenged</span><span><b class="lg no">✕</b> stopped</span></div></div>`;
}
function markSvg(kind){
  if (kind === "ok") return `<circle r="10" class="m-ok"/><path d="M-5,0 L-1,4 L6,-4" class="m-tick"/>`;
  if (kind === "mfa") return `<circle r="10" class="m-mfa"/><text y="3.5" class="m-t">MFA</text>`;
  return `<circle r="10" class="m-no"/><path d="M-4,-4 L4,4 M4,-4 L-4,4" class="m-x"/>`;
}
function drawMarks(M, r, animateNow){
  if (!r.results || animateNow) return;
  r.variantActors.forEach(id => { const g = document.getElementById("mark-" + id), res = r.results.res[id]; if (!g) return;
    g.setAttribute("transform", "translate(18,-16)"); g.innerHTML = markSvg(gotIn(res) ? (res.outcome === "mfa" ? "mfa" : "ok") : "no");
    const lane = document.getElementById("lane-" + id); if (lane) lane.setAttribute("class", "lane " + (gotIn(res) ? "lok" : "lno") + (r.stale ? " lstale" : ""));
  });
  const used = new Set(r.variantActors.filter(id => gotIn(r.results.res[id])).map(id => M.actors[id].app));
  M.apps.forEach(ap => { const o = document.getElementById("out-" + ap.id); if (o) o.setAttribute("class", "lane out " + (used.has(ap.id) ? "lok" : "")); const m = document.getElementById("amark-" + ap.id); if (m){ m.setAttribute("transform", "translate(20,-18)"); m.innerHTML = used.has(ap.id) ? markSvg("ok") : ""; } });
}
/* Animate access attempts traveling through Conditional Access */
function animateTest(M, r, done){
  const svg = document.getElementById("amap");
  if (!svg || reduceMotion()){ done(); return; }
  const fx = document.getElementById("fx"), NS = "http://www.w3.org/2000/svg", L = layout(M, r);
  const ids = r.variantActors; let finished = 0;
  const along = (path, t) => { const len = path.getTotalLength(); return path.getPointAtLength(len * t); };
  const tween = (ms, step, end) => { const t0 = performance.now(); const f = now => { const t = Math.min(1, (now - t0) / ms); step(t); if (t < 1) requestAnimationFrame(f); else end(); }; requestAnimationFrame(f); };
  document.getElementById("gate").classList.add("busy");
  ids.forEach((id, i) => setTimeout(() => {
    const res = r.results.res[id], ok = gotIn(res), dot = document.createElementNS(NS, "circle");
    dot.setAttribute("r", "6"); dot.setAttribute("class", "pkt"); fx.appendChild(dot);
    const lane = document.getElementById("lane-" + id), out = document.getElementById("out-" + M.actors[id].app);
    tween(520, t => { const p = along(lane, t); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); }, () => {
      const badge = document.createElementNS(NS, "g"); badge.setAttribute("transform", `translate(${L.gate.x - 46},${L.gate.y - 4 + (i - ids.length / 2) * 6})`);
      badge.innerHTML = markSvg(ok ? (res.outcome === "mfa" ? "mfa" : "ok") : "no"); badge.setAttribute("class", "pop"); fx.appendChild(badge);
      setTimeout(() => badge.remove(), 900);
      if (ok){ dot.setAttribute("class", "pkt pok"); tween(460, t => { const p = along(out, t); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); }, () => { dot.remove(); const ap = document.getElementById("app-" + M.actors[id].app); if (ap){ ap.classList.add("hit"); setTimeout(() => ap.classList.remove("hit"), 500); } fin(); }); }
      else { dot.setAttribute("class", "pkt pno"); tween(380, t => { const p = along(lane, 1 - t * 0.35); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("opacity", String(1 - t)); }, () => { dot.remove(); fin(); }); }
    });
  }, i * 240));
  function fin(){ if (++finished === ids.length){ const g = document.getElementById("gate"); if (g) g.classList.remove("busy"); done(); } }
}
/* Policy tool panel */
function policyTabs(M, r){
  return `<div class="ptabs" role="tablist" aria-label="Policies">${r.order.map(id => { const p = r.policies[id], sel = r.selected.id === id;
    return `<button role="tab" class="ptab ${sel ? "sel" : ""} st-${p.state} ${r.highlights.some(h => h.startsWith(id + ".")) ? "hl" : ""}" id="ptab-${id}" data-lab="policy" data-id="${id}" aria-selected="${sel}" aria-controls="ped"><span class="pid">${esc(id === "NEW" ? "New" : id)}</span><span class="pnm">${esc(p.name)}</span><span class="pst">${p.state === "on" ? "● On" : p.state === "report" ? "◐ Report-only" : "○ Off"}</span></button>`; }).join("")}</div>`;
}
function canEdit(r, pid, field){ const e = LAB.missions[r.mission].variants[r.level].editable[pid]; return e === "all" || (Array.isArray(e) && e.includes(field)); }
function seg(r, pid, field, value, opts){
  const ed = canEdit(r, pid, field) && r.phase === "play", name = `f-${pid}-${field}`, hl = r.highlights.includes(pid + "." + field) ? " hl" : "";
  if (!ed) return `<div class="prow locked${hl}"><span class="pl">${FIELD_LABEL[field]}</span><span class="pv">${esc(optLabel(field, value))} <span class="lock" title="Locked in this version" aria-label="locked">🔒</span></span></div>`;
  return `<fieldset class="prow${hl}"><legend class="pl">${FIELD_LABEL[field]}</legend><div class="segs">${opts.map(([v,l]) => `<label class="seg ${value === v ? "on" : ""}" for="${name}-${v}"><input type="radio" id="${name}-${v}" name="${name}" value="${v}" ${value === v ? "checked" : ""} data-lab-field="${pid}.${field}">${esc(l)}</label>`).join("")}</div></fieldset>`;
}
function policyEditor(M, r){
  const pid = r.selected.id, p = r.policies[pid], lvl = r.level;
  const exEd = canEdit(r, pid, "exclude") && r.phase === "play", grEd = canEdit(r, pid, "grant") && r.phase === "play";
  const hl = k => r.highlights.includes(pid + "." + k) ? " hl" : "";
  const apps = p.apps === "all" ? "All resources" : p.apps.map(a => M.apps.find(x => x.id === a).label).join(", ");
  let h = `<div class="ped" id="ped" role="tabpanel" aria-labelledby="ptab-${pid}"><div class="ped-head"><b>${esc(pid === "NEW" ? "New policy" : pid + " · " + p.name)}</b>${p.changedBy ? `<span class="changed">Changed by ${esc(p.changedBy)}</span>` : ""}</div>`;
  h += seg(r, pid, "state", p.state, OPT.state);
  h += `<div class="pgroup"><div class="pg-h">Assignments</div>`;
  h += seg(r, pid, "include", p.include, OPT.include);
  h += exEd ? `<fieldset class="prow${hl("exclude")}"><legend class="pl">Exclude</legend><div class="segs">${M.principals.map(x => `<label class="seg chk ${p.exclude.includes(x.id) ? "on" : ""}" for="ex-${pid}-${x.id}"><input type="checkbox" id="ex-${pid}-${x.id}" ${p.exclude.includes(x.id) ? "checked" : ""} data-lab-ex="${pid}.${x.id}">${esc(x.label)}</label>`).join("")}</div></fieldset>`
    : `<div class="prow locked${hl("exclude")}"><span class="pl">Exclude</span><span class="pv">${p.exclude.length ? esc(p.exclude.map(x => principalLabel(M, x)).join(", ")) : "None"} <span class="lock" aria-label="locked">🔒</span></span></div>`;
  h += `<div class="prow locked"><span class="pl">Resources</span><span class="pv">${esc(apps)}</span></div>`;
  h += seg(r, pid, "network", p.network, OPT.network);
  h += seg(r, pid, "client", p.client, OPT.client);
  if (lvl >= 2 || p.risk !== "any") h += seg(r, pid, "risk", p.risk, OPT.risk);
  h += `</div><div class="pgroup"><div class="pg-h">Access controls</div>`;
  if (grEd){
    h += `<fieldset class="prow${hl("grant")}"><legend class="pl">Grant</legend><div class="segs">${OPT.grant.map(([v,l]) => `<label class="seg ${p.grant === v ? "on" : ""}" for="g-${pid}-${v}"><input type="radio" id="g-${pid}-${v}" name="g-${pid}" value="${v}" ${p.grant === v ? "checked" : ""} data-lab-field="${pid}.grant">${l}</label>`).join("")}</div></fieldset>`;
    if (p.grant === "grant"){
      h += `<fieldset class="prow${hl("controls")}"><legend class="pl">Controls</legend><div class="segs col">${CTRL.filter(c => c[0] !== "hybrid" || lvl >= 2).map(([k,l]) => `<label class="seg chk ${p.controls[k] ? "on" : ""}" for="c-${pid}-${k}"><input type="checkbox" id="c-${pid}-${k}" ${p.controls[k] ? "checked" : ""} data-lab-ctl="${pid}.${k}">${l}</label>`).join("")}</div></fieldset>`;
      h += seg(r, pid, "op", p.op, OPT.op);
    }
  } else h += `<div class="prow locked${hl("grant")}"><span class="pl">Grant</span><span class="pv">${p.grant === "block" ? "Block access" : CTRL.filter(c => p.controls[c[0]]).map(c => c[1]).join(p.op === "and" ? " + " : " or ")} <span class="lock" aria-label="locked">🔒</span></span></div>`;
  h += `</div>${r.phase === "play" ? `<button class="btn primary ped-test" id="lab-test2" data-lab="test" ${validate(r).length ? "disabled" : ""}>▶ Test changes</button>` : ""}`;
  return h + `</div>`;
}
function predictHtml(M, r){
  const P = M.predictions[r.pred.id], ans = r.pred.choice;
  const opts = [["allowed","Gets in, no extra prompt"],["mfa","Gets in after MFA"],["stopped","Stopped"]];
  const truth = r.pred.truth;
  return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="pred-h"><div class="ov-card"><div class="oh-code">Check your understanding</div><h3 id="pred-h">A new sign-in hits your policies</h3>
    <div class="acard static k-${P.kind}"><span class="av">${svgIcon(P.kind)}<span class="ini">${esc(P.initials)}</span></span><span class="ac-main"><span class="ac-name">${esc(P.name)}${P.kind === "attacker" ? "" : " · " + esc(P.role)}</span><span class="ac-sub">${esc(P.location.label)} · ${esc(P.device.label)} (${esc(P.device.state)}) · ${esc(M.apps.find(a => a.id === P.app).label)} · ${esc(P.mfaLabel)}${P.riskLabel ? " · risk " + esc(P.riskLabel) : ""}</span></span></div>
    <p class="pq">With <b>your</b> configuration, what happens?</p>
    <div class="pred-opts">${opts.map(([v,l]) => `<button class="btn pred-opt ${ans ? (v === truth ? "right" : v === ans ? "wrong" : "") : ""}" id="pred-${v}" data-lab="predict" data-v="${v}" ${ans ? "disabled" : ""}>${ans && v === truth ? "✓ " : ans && v === ans ? "✕ " : ""}${l}</button>`).join("")}</div>
    ${ans ? `<div class="pred-res ${ans === truth ? "ok" : "no"}" role="status"><b>${ans === truth ? "Exactly right." : "Not quite, and that's useful to know."}</b> ${esc(describe(M, P, r.pred.res))}<ul class="pres">${r.pred.res.per.map(p => `<li class="${p.applies ? (p.block || !p.ok ? "p-no" : "p-ok") : "p-na"}"><b>${esc(p.id)}</b> ${esc(p.why)}</li>`).join("")}</ul></div>
      <div class="actions"><button class="btn primary" id="lab-debrief" data-lab="debrief">See debrief →</button></div>` : `<p class="muted small">Unscored practice signals don't count here: this one answer is your evidence.</p>`}</div></div>`;
}
function diffList(M, r){
  const out = [], base = M.basePolicies;
  r.order.forEach(id => { const p = r.policies[id], b = base[id], nm = id === "NEW" ? "New policy" : id;
    ["state","include","network","client","risk","grant","op"].forEach(k => { if (p[k] !== b[k] && !(k === "op" && p.grant === "block")) out.push(`${nm} · ${FIELD_LABEL[k]}: ${optLabel(k, b[k])} → ${optLabel(k, p[k])}`); });
    const add = p.exclude.filter(x => !b.exclude.includes(x)), rem = b.exclude.filter(x => !p.exclude.includes(x));
    if (add.length) out.push(`${nm} · Exclude: + ${add.map(x => principalLabel(M, x)).join(", ")}`);
    if (rem.length) out.push(`${nm} · Exclude: − ${rem.map(x => principalLabel(M, x)).join(", ")}`);
    if (p.grant === "grant"){ const c = CTRL.filter(x => p.controls[x[0]]).map(x => x[1].replace("Require ", "")).join(", "), cb = CTRL.filter(x => b.controls[x[0]]).map(x => x[1].replace("Require ", "")).join(", "); if (c !== cb || b.grant !== "grant") out.push(`${nm} · Controls: ${c}`); }
  });
  return out;
}
function debriefHtml(M, r){
  const changes = diffList(M, r), res = r.results;
  const who = a => a.kind === "attacker" ? "Attack on " + a.account + "'s account" : a.kind === "admin" ? "Emergency access" : a.name.split(" ")[0];
  const why = r.variantActors.map(id => { const a = M.actors[id], g = gotIn(res.res[id]), good = a.legit ? g : !g;
    return `<li><span class="${good ? "ok" : "no"}" aria-hidden="true">${good ? "✓" : "✕"}</span> <b>${esc(who(a))}</b> ${a.legit ? (g ? "got in" : "was locked out") : (g ? "got in" : "stopped")}: ${esc(describe(M, a, res.res[id]))}</li>`; }).join("");
  const bonusOk = r.bonus.every(k => res.bonus[k].ok);
  const T = ST().topics && ST().topics[M.topic];
  const next = r.level < 3 ? `<button class="btn" data-lab="harder">Try the ${LEVELS[r.level + 1]} version</button>` : "";
  return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="db-h"><div class="ov-card wide"><div class="oh-code">Debrief · ${esc(M.code)} · ${LEVELS[r.level]}</div><h3 id="db-h" tabindex="-1">Systems restored <span class="stamp">FILED</span></h3>
    <div class="db-grid"><div><h4>What you changed</h4><ul class="db-list">${changes.map(c => `<li>${esc(c)}</li>`).join("") || "<li>No changes</li>"}</ul></div>
      <div><h4>Why it worked</h4><ul class="db-list">${why}</ul></div></div>
    <div><h4>Exam concept</h4><p class="db-concept">Conditional Access applies every matching policy: <b>Block wins</b>, otherwise <b>all</b> grant requirements must be met, and <b>exclusions beat inclusions</b>. ${M.objectives.map(o => `<span class="tag">SC-300 ${o}</span>`).join(" ")}</p>
      <details class="why"><summary>Learn more</summary>${M.learnMore}<p class="muted small">${esc(M.simplifications)}</p><ul class="sources">${M.sources.map(([t,u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("")}</ul></details></div>
    <div class="db-stats"><span><b>${r.tests}</b> test${r.tests === 1 ? "" : "s"}</span><span><b>${r.hints}</b> hint${r.hints === 1 ? "" : "s"}</span><span>Prediction <b>${r.pred && r.pred.choice === r.pred.truth ? "✓" : "✕"}</b></span><span>Best practice <b>${bonusOk ? "✓" : "—"}</b></span><span>+<b>${r.xp}</b> XP</span><span>Conditional Access level: <b>${T && T.placed ? ["","Beginner","Intermediate","Advanced"][T.level] : "finding your level"}</b></span></div>
    ${!bonusOk ? `<p class="muted small">Tip: ${esc(res.bonus.bgExcluded ? res.bonus.bgExcluded.why : "")} Microsoft recommends excluding emergency access accounts from Conditional Access policies (and protecting them with phishing-resistant credentials).</p>` : ""}
    <div class="actions"><button class="btn primary" data-lab="again">Play again</button>${next}<button class="btn" data-lab="library">Study library</button></div>
    <div class="upcoming"><h4>Next in the workspace</h4><ul>${LAB.upcoming.map(u => `<li><b>${esc(u.title)}</b> · ${esc(u.type)} <span class="soon">in conversion · study version in the library</span></li>`).join("")}</ul></div></div></div>`;
}

/* ===================== Actions ===================== */
function rerender(){ API().renderAll(); }
function pushUndo(){ const r = run(); r.undo.push(clone(r.policies)); if (r.undo.length > 40) r.undo.shift(); }
function changed(conceptKey){ const r = run(); r.stale = !!r.results; if (conceptKey) concept(conceptKey); else concept("retest"); if (r.stale && !r.seen.retestShown){ r.seen.retestShown = true; } persist(); rerender(); pulseGate(); }
function pulseGate(){ const g = document.getElementById("gate"); if (g && !reduceMotion()){ g.classList.remove("pulse"); void g.getBBox(); g.classList.add("pulse"); } }
function test(){
  const r = run(), M = mission();
  if (validate(r).length || r.phase !== "play" || r.animating) return;
  r.tests++; r.results = runAll(M, r); r.stale = false; r.hintText = null; r.animating = true;
  if (!r.seen.inspect) concept("inspect"); else if (!r.seen.evaluate) concept("evaluate");
  persist();
  // Clear marks, then animate, then show final state
  document.querySelectorAll("#amap .mark, #amap .amark").forEach(g => g.innerHTML = "");
  document.querySelectorAll("#amap .lane").forEach(l => l.setAttribute("class", l.id.startsWith("out-") ? "lane out" : "lane"));
  ["lab-test","lab-test2"].forEach(id => { const btn = document.getElementById(id); if (btn) btn.disabled = true; });
  animateTest(M, r, () => {
    r.animating = false;
    if (r.results.solved && r.solvedAtTest === null) r.solvedAtTest = r.tests;
    rerender();
    const live = document.getElementById("ops-live"); const met = r.requirements.filter(k => r.results.req[k].ok).length;
    if (live) live.textContent = r.results.solved ? "All requirements met." : `${met} of ${r.requirements.length} requirements met.`;
    if (window.innerWidth < 760){ const bn = document.querySelector(".rbanner"); if (bn) bn.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block:"center" }); }
    if (r.results.solved){ const o = document.getElementById("ops"); if (o && !reduceMotion()) o.classList.add("win"); const c = document.getElementById("lab-continue"); if (c) c.focus(); }
  });
}
function hint(){
  const r = run(), M = mission(), hs = M.variants[r.level].hints;
  if (r.hints >= 3) return;
  const h = hs[r.hints]; r.hints++;
  if (typeof h === "string" && r.hints === 1) r.hintText = "Clue: " + h;
  else if (h && h.highlight){ r.highlights = h.highlight.slice(); r.hintText = "Look at the highlighted evidence and policy settings.";
    const pol = h.highlight.find(x => x.includes(".")); if (pol) r.selected = { type:"policy", id:pol.split(".")[0] };
    const act = h.highlight.find(x => !x.includes(".")); if (act) r.actorSel = act; }
  else { r.worked = h; r.hintText = "Worked explanation below."; }
  persist(); rerender();
}
function complete(){
  const r = run(), M = mission(), ms = missionState(M.id), A = API();
  const pool = M.variants[r.level].predictions, fresh = pool.filter(p => !ms.predUsed.includes(p));
  const id = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh : pool).length)];
  const res = simulate(M, r.order.map(x => r.policies[x]), M.predictions[id]);
  r.pred = { id, res, truth: gotIn(res) ? res.outcome === "mfa" ? "mfa" : "allowed" : "stopped", choice:null };
  r.phase = "predict";
  // Mission performance is a difficulty signal only: many test runs are exploration (neutral), hints are support.
  const solveId = "lab-mml-solve-" + r.level, T = A.topicState(M.topic);
  if (!T.history.some(e => e.item === solveId)) A.adaptRecord(solveId, true, r.hints, r.solvedAtTest <= 4 ? "sure" : "guess", "ops");
  const first = !ms.levelsDone[r.level];
  r.xp += A.award(first ? 60 : 30, first ? "Mission solved" : "Mission solved (replay)", null, true) || 0;
  if (r.hints === 0) r.xp += A.award(10, "Solved without hints", null, true) || 0;
  if (r.bonus.every(k => r.results.bonus[k].ok)) r.xp += A.award(15, "Best practice", null, true) || 0;
  ms.levelsDone[r.level] = (ms.levelsDone[r.level] || 0) + 1; ms.completed++; ms.best = Math.max(ms.best || 0, r.level);
  A.markDay(); persist(); rerender();
}
function predict(v){
  const r = run(), M = mission(), A = API(), ms = missionState(M.id);
  if (!r.pred || r.pred.choice) return;
  r.pred.choice = v; const ok = v === r.pred.truth;
  if (!ms.predUsed.includes(r.pred.id)) ms.predUsed.push(r.pred.id);
  // The prediction is independent evidence: a new scenario judged before seeing the result.
  A.recordEvidence("lab-mml-predict-" + r.pred.id, ok, 0, null, "ops");
  r.xp += A.award(ok ? 15 : 5, ok ? "Prediction correct" : "Prediction reviewed", null, true) || 0;
  persist(); rerender();
  const b = document.getElementById("lab-debrief"); if (b) b.focus();
}
function act(t){
  const k = t.dataset.lab, r = run(), M = mission();
  if (k === "test") return test();
  if (k === "hint") return hint();
  if (k === "undo"){ if (!r.undo.length) return; r.policies = r.undo.pop(); return changed(); }
  if (k === "reset"){ const keep = { tests:r.tests, hints:r.hints, seen:r.seen }; const n = newRun(r.mission, r.level); Object.assign(n, keep); n.concept = "start"; labState().run = n; persist(); rerender(); API().toast("Mission reset to Friday's configuration"); return; }
  if (k === "actor"){ r.actorSel = r.actorSel === t.dataset.id ? null : t.dataset.id; if (r.results && !r.seen.evaluate) concept("evaluate"); persist(); rerender(); const ins = document.querySelector(".inspector:not(.empty)"); if (ins && window.innerWidth < 900) ins.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block:"nearest" }); return; }
  if (k === "close-ins"){ r.actorSel = null; persist(); rerender(); return; }
  if (k === "policy"){ r.selected = { type:"policy", id:t.dataset.id }; persist(); rerender(); return; }
  if (k === "req"){ const d = M.requirementDefs[t.dataset.key]; if (d.actor){ r.actorSel = d.actor; persist(); rerender(); } return; }
  if (k === "continue") return complete();
  if (k === "predict") return predict(t.dataset.v);
  if (k === "debrief"){ r.phase = "debrief"; persist(); rerender(); const h = document.getElementById("db-h"); if (h) h.focus(); return; }
  if (k === "again" || k === "harder"){ const lvl = k === "harder" ? Math.min(3, r.level + 1) : levelFor(M); labState().run = newRun(r.mission, lvl); persist(); rerender(); const tb = document.getElementById("lab-test"); if (tb) tb.focus(); return; }
  if (k === "library"){ API().openLibrary(); return; }
}
function onChange(t){
  const r = run(); if (!r || r.phase !== "play") return;
  if (t.dataset.labField){ const [pid, f] = t.dataset.labField.split("."); pushUndo(); r.policies[pid][f] = t.value;
    if (f === "grant" && t.value === "grant" && !CTRL.some(c => r.policies[pid].controls[c[0]])) r.policies[pid].controls.mfa = true;
    return changed(f === "state" && t.value === "report" ? "report" : f === "grant" ? "grant" : null); }
  if (t.dataset.labEx){ const [pid, x] = t.dataset.labEx.split("."); pushUndo(); const ex = r.policies[pid].exclude; if (t.checked){ if (!ex.includes(x)) ex.push(x); } else ex.splice(ex.indexOf(x), 1); return changed("exclude"); }
  if (t.dataset.labCtl){ const [pid, c] = t.dataset.labCtl.split("."); pushUndo(); r.policies[pid].controls[c] = t.checked; return changed("grant"); }
}
document.addEventListener("click", e => { const t = e.target.closest("[data-lab]"); if (!t || t.disabled || !t.closest("#ops")) return; e.preventDefault(); act(t); });
document.addEventListener("change", e => { const t = e.target; if (t.closest && t.closest("#ops")) onChange(t); });
document.addEventListener("keydown", e => {
  if (!document.getElementById("ops") || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target.tagName || "").toLowerCase(); if (tag === "input" && e.target.type === "text" || tag === "textarea" || tag === "select") return;
  if (!document.getElementById("backdrop").hidden) return;
  const k = e.key.toLowerCase(), r = run(); if (!r || r.phase !== "play") return;
  if (k === "t"){ e.preventDefault(); test(); } else if (k === "h"){ e.preventDefault(); hint(); } else if (k === "u" && r.undo.length){ e.preventDefault(); r.policies = r.undo.pop(); changed(); }
});

window.IDLab = { render, simulate:(mid, pols, actor) => simulate(LAB.missions[mid], pols, actor), runAll:(r) => runAll(LAB.missions[r.mission], r), newRun, ensureRun, levelFor:() => levelFor(LAB.missions.mml) };
})();
