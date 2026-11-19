/* Identity Defender · Conditional Access evaluation engine (shared by the game and tests).
   Semantics follow Microsoft Entra Conditional Access: every enabled policy whose assignments all match applies;
   exclusions beat inclusions; any applying Block wins; otherwise every applying policy's grant must be met;
   report-only policies are evaluated and logged but never enforced; legacy authentication can't satisfy MFA/device controls. */
(function () {
"use strict";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const FIELD_LABEL = { state:"State", include:"Users", exclude:"Exclude", network:"Network", client:"Client apps", risk:"Sign-in risk", grant:"Grant", controls:"Grant", op:"For multiple controls" };
const OPT = {
  state:[["on","On"],["report","Report-only"],["off","Off"]],
  include:[["all","All users"],["remote","Remote staff"],["office","Office staff"]],
  network:[["any","Any network or location"],["outside","Any network, exclude Halcyon offices"],["inside","Selected: Halcyon offices"]],
  client:[["any","Not configured (all clients)"],["legacy","Legacy: Exchange ActiveSync + Other clients"],["modern","Browser + Mobile apps and desktop clients"]],
  risk:[["any","Not configured"],["high","High"],["medhigh","High and Medium"]],
  grant:[["block","Block access"],["grant","Grant access"]],
  op:[["and","Require all the selected controls"],["or","Require one of the selected controls"]]
};
const CTRL = [["mfa","Require multifactor authentication"],["compliant","Require device to be marked as compliant"],["hybrid","Require Microsoft Entra hybrid joined device"]];
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
  r.why = "Applied: " + sel.map(k => ({mfa:"MFA", compliant:"compliant device", hybrid:"hybrid joined device"})[k]).join(p.op === "and" ? " + " : " or ") + (r.ok ? " → met" : " → not met");
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


window.CAEngine = { OPT, CTRL, FIELD_LABEL, optLabel, evalPolicy, simulate, runAll, validate, describe, gotIn, principalLabel, capable, checkRequirement, esc };
})();
