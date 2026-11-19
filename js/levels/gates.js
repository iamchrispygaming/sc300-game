/* Mission 02 · Restore the Access Gates (Conditional Access, SC-300 2.2). Data: js/lab-missions.js · rules: js/ca-engine.js */
(function () {
"use strict";
const L = window.ID_LEVELS, esc = L.esc, M = window.ID_LAB.missions.mml;
const E = () => window.CAEngine;
const PLACES = {
  ana:{ origin:[28.4,21.4], wait:[29.2,10.7], char:1, short:"Ana" },
  jun:{ origin:[6,22.5], wait:[5.3,10.7], char:4, short:"Jun" },
  priya:{ origin:[25.5,22.3], wait:[17.4,10.7], char:5, short:"Priya" },
  attacker:{ origin:[31.6,26.3], wait:[31.0,11.0], char:3, tint:0x8a7fd0, short:"Unknown" },
  imap:{ origin:[34.6,20.3], wait:[27.6,11.6], drone:"drone", short:"Mail script" },
  bg:{ origin:[24.4,21.3], wait:[7.0,11.0], char:2, short:"Emergency" },
  lena:{ origin:[27,23.3], wait:[29.8,12.4], char:1, tint:0xa8e2ff, short:"Lena" },
  omar:{ origin:[9.5,24.0], wait:[6.2,12.4], char:4, tint:0xffd8a8, short:"Omar" },
  spray:{ origin:[30.4,26.7], wait:[18.8,12.1], char:3, tint:0x7f78c8, short:"Unknown" }
};
const OUT = { allowed:"Signed in", mfa:"Signed in after MFA", blocked:"Blocked", failed:"Couldn't sign in" };
const appLabel = id => (M.apps.find(x => x.id === id) || {}).label;
function actorData(id, src){
  const d = src[id], P = PLACES[id];
  return Object.assign({}, d, P, { id, door:d.app, legit:d.legit, name:d.kind === "attacker" ? (P.drone ? "IMAP mail script" : "Unknown sign-in") : d.principal === "bg" ? "Emergency access account" : d.name,
    logLine:`${d.location.label} · ${d.device.label} · ${appLabel(d.app)}` });
}
function caRun(run){ return { policies:run.config.policies, order:run.config.order, variantActors:run.actors, requirements:run.requirements, bonus:run.bonus }; }
function mapRes(r, data){
  const e = E();
  const viaMfa = r.outcome === "mfa" || (r.outcome === "failed" && r.unmet.some(u => u.control === "mfa"));
  return { outcome:e.gotIn(r) ? "in" : "out", pre:viaMfa ? "mfa" : null, label:OUT[r.outcome], why:e.describe(M, data, r), raw:r,
    detail:`<h3>Conditional Access</h3><ul>${r.per.map(p => `<li class="${p.applies ? (p.block || !p.ok ? "pno" : "pok") : "pna"}${p.state === "report" ? " prep" : ""}"><b>${esc(p.id)}</b> ${p.state === "report" && p.applies ? "Report-only · " : ""}${esc(p.why)}</li>`).join("")}</ul>` };
}
const def = {
  id:"gates", itemKey:"mml", order:2, code:"MISSION 02", title:"Restore the Access Gates", domain:"Access management", topic:"2.2",
  objectives:["2.2.1","2.2.2","2.2.3","2.2.4"], predictObjectives:["2.2.4","2.2.3"], predictionIds:["lena","omar","spray"], srcKeys:["caOverview"],
  pitch:"A Friday policy change locked remote staff out, while a leaked password tries the doors.",
  objective:"Restore employee access and stop the suspicious sign-in.",
  startCoach:"Monday 9:02: people are stuck at the gates.",
  campus:{ console:{ title:"Security console", sub:"Conditional Access" } },
  area:{ name:"GATE PLAZA", W:36, H:28, base:"grass", tint:0xc9d2f5, bg:"#151a2a", laneY:19.8, viewCY:null,
    fills:[[36,0,7,36,2],["tan",0,9,36,10],[36,4,9,3,9],[36,16,9,3,9],[36,28,9,3,9],[36,1,16,34,1],["lav",20,10,6,4],["tanb",0,19,17,9],[36,20,19,16,2],[36,20,25,16,1],[461,20,26,16,2]],
    roads:[{ x:20, y:21, w:16, cross:[22] }],
    fences:[[0,8,2],[10,8,4],[22,8,4],[34,8,2]],
    hedges:[[0,18,5],[8,18,9],[20,18,8],[32,18,4]],
    buildings:[{ key:"sharepoint", label:"SharePoint", sign:"doc", x:2, y:0, roof:"B", facade:"orange" }, { key:"teams", label:"Teams", sign:"chat", x:14, y:0, roof:"C", facade:"red" }, { key:"outlook", label:"Outlook", sign:"mail", x:26, y:0, roof:"A", facade:"red" }],
    props:[["tree",0.5,3],["tree",11.2,3],["tree",12.6,4],["tree",23.2,3],["tree",24.6,4],["tree",34.4,3],["lamp",1,15],["lamp",33,12],["bench",10,14],["trash",2,10],["pot",13.6,14.5],["pot2",33.5,15.2],
      ["bench",2,21],["bench",12,21],["vending",15,20],["pot",1,25.5],["pot2",14.8,25.5],["shelter",21,19],["van",33,25],["lampB",26,19],["lampB",35,19],["tree2",18.5,20],["tree2",18.6,24]],
    console:{ x:23, y:12.6 },
    tags:[{ x:8.5, y:19.6, title:"Halcyon office", sub:"Named location · trusted network", cls:"office" }, { x:24, y:22.2, title:"Internet", sub:"Home, travel, unknown networks", cls:"net" }],
    exits:[{ edge:"west", at:[10,14], to:"newhire", entry:"east" }, { edge:"east", at:[21,24], to:"consent", entry:"west", forward:true }],
    entries:{ start:[23,15.2], west:[1.2,12], east:[34.6,22.5] } },

  sign:"mail",
  terminal:"Conditional Access", runLabel:"Run sign-ins", log:{ title:"Sign-in logs", sub:"This morning", short:"Logs" },
  firstTip:"Every enabled policy that matches a sign-in applies. <b>Block</b> in any of them wins; otherwise every grant must be met.",
  consoleCoach:"Friday's <b>CA02</b> blocks everything outside the office network. Change it, then <b>Run sign-ins</b>.",
  watchCoach:"Watch the gates…", winStamp:"ACCESS RESTORED",
  variants:M.variants,
  reqText:Object.fromEntries(Object.entries(M.requirementDefs).map(([k, d]) => [k, d.text])),
  newRun(level){ const v = M.variants[level];
    return { level, config:{ policies:Object.fromEntries(v.policies.map(id => [id, L.clone(M.basePolicies[id])])), order:v.policies.slice() },
      actors:v.actors.slice(), requirements:v.requirements.slice(), bonus:v.bonus.slice(), tests:0, hints:0, phase:"play", xp:0, ui:{}, undo:[] }; },
  actor(id){ return actorData(id, M.actors); },
  editable(run, path){ const [, pid, f] = path.split("."); const e = M.variants[run.level].editable[pid]; const field = f === "controls" ? "grant" : f; return e === "all" || (Array.isArray(e) && e.includes(field)); },
  editor(run, H){
    const e = E(), c = run.config, pid = run.ui.tab && c.policies[run.ui.tab] ? run.ui.tab : (c.order.includes("CA02") ? "CA02" : c.order[0]), p = c.policies[pid], base = `policies.${pid}`;
    const tabs = H.tabs(c.order.map(id => ({ id, code:id === "NEW" ? "New" : id, title:c.policies[id].name, state:c.policies[id].state, status:{ on:"● On", report:"◐ Report-only", off:"○ Off" }[c.policies[id].state] })), pid);
    const apps = p.apps === "all" ? "All resources (formerly 'All cloud apps')" : p.apps.map(appLabel).join(", ");
    let ed = `<div class="ped-head"><h3>${esc(pid === "NEW" ? "New policy" : pid + " · " + p.name)}</h3>${p.changedBy ? `<span class="changed">Changed by ${esc(p.changedBy)}</span>` : ""}</div>`;
    ed += H.seg(base + ".state", "State", e.OPT.state, p.state);
    ed += H.group("Assignments", H.seg(base + ".include", "Users", e.OPT.include, p.include) + H.checks(base + ".exclude", "Exclude", M.principals.map(x => [x.id, x.label]), p.exclude) + H.info("Target resources", esc(apps)));
    ed += H.group("Conditions", H.seg(base + ".network", "Network", e.OPT.network, p.network) + H.seg(base + ".client", "Client apps", e.OPT.client, p.client) + (run.level >= 2 || p.risk !== "any" ? H.seg(base + ".risk", "Sign-in risk", e.OPT.risk, p.risk) : ""));
    let ac = H.seg(base + ".grant", "Grant", e.OPT.grant, p.grant);
    if (p.grant === "grant"){
      const ctl = e.CTRL.filter(x => x[0] !== "hybrid" || run.level >= 2);
      ac += H.ed(base + ".grant") ? `<fieldset class="row${H.hl(base + ".controls")}"><legend class="rl">Controls</legend><div class="segs col">${ctl.map(([k, l]) => `<label class="seg chk ${p.controls[k] ? "on" : ""}"><input type="checkbox" ${p.controls[k] ? "checked" : ""} data-path="${base}.controls.${k}" data-k="bool">${esc(l)}</label>`).join("")}</div></fieldset>`
        : H.locked("Controls", ctl.filter(x => p.controls[x[0]]).map(x => x[1]).join(" AND "), base + ".controls");
      ac += H.seg(base + ".op", "For multiple controls", e.OPT.op, p.op);
    }
    ed += H.group("Access controls", ac);
    return `<div class="cgrid">${tabs}<div class="ped">${ed}</div></div>`;
  },
  onEdit(run, path, v){
    const [, pid, f] = path.split("."), p = run.config.policies[pid];
    if (f === "grant" && v === "grant" && !E().CTRL.some(c => p.controls[c[0]])) p.controls.mfa = true;
    if (f === "state" && v === "report") return { key:"report", text:"Report-only policies are evaluated and logged, but <b>never enforced</b>." };
    if (f === "exclude") return { key:"exclude", text:"Exclusions always beat inclusions." };
  },
  validate(run){ return E().validate(caRun(run)); },
  simulate(run){
    const out = E().runAll(M, caRun(run)), res = {};
    run.actors.forEach(id => { res[id] = mapRes(out.res[id], M.actors[id]); });
    return { res, req:out.req, bonus:out.bonus, solved:out.solved };
  },
  simulateOne(run, data){ return mapRes(E().simulate(M, run.config.order.map(x => run.config.policies[x]), data), data); },
  evidence(d, run, res){
    const groups = d.groups.length ? d.groups.map(g => E().principalLabel(M, g)).join(", ") : (d.principal === "bg" ? "Emergency access account" : "—");
    return { sub:d.kind === "attacker" ? (d.drone ? "Legacy protocol sign-in" : "Suspicious sign-in") : d.principal === "bg" ? "Break-glass account test by Nadia" : d.role,
      rows:[
        ["User", d.kind === "attacker" ? `${esc(d.account)} <em>(account used)</em>` : `${esc(d.name)} · ${esc(d.role)}`, "singleplayer"],
        ["Groups", esc(groups), "menuList"],
        ["Network", `${esc(d.location.label)} · ${esc(d.location.ip)}<br><span class="${d.location.named ? "good" : "warn"}">${d.location.named ? "Named location: Halcyon offices (trusted)" : "Not a named location"}</span>`, "target"],
        ["Device", `${esc(d.device.label)} · ${esc(d.device.platform)}<br><span class="${d.device.compliant ? "good" : "warn"}">${esc(d.device.state)}</span>`, d.device.icon === "tablet" ? "tablet" : "power"],
        ["App", `${esc(appLabel(d.app))} · ${esc(d.clientLabel)}${d.client === "legacy" ? ' <span class="warn">legacy authentication</span>' : ""}`, "home"],
        ["Sign-in", d.auth === "passkey" ? "Passkey (FIDO2) · counts as MFA" : "Password", "locked"],
        ["MFA", `<span class="${d.mfa ? "good" : "warn"}">${esc(d.mfaLabel)}</span>`, "phone"],
        ["Risk", d.riskLabel ? `<span class="${d.risk === "high" ? "bad" : "warn"}">${esc(d.riskLabel)}</span>` : "None", "warning"]] };
  },
  predictOptions:[["allowed","Gets in, no prompt"],["mfa","Gets in after MFA"],["stopped","Stopped"]],
  predictActor(id){ return actorData(id, M.predictions); },
  predictTruth(res){ return res.outcome === "in" ? (res.raw.outcome === "mfa" ? "mfa" : "allowed") : "stopped"; },
  predictCard(d){ return `<b>${esc(d.kind === "attacker" ? "Ana's password, " + d.location.label : d.name + ", " + d.location.label)}</b><br><span class="muted">${esc(d.device.label)} (${esc(d.device.state)}) · ${esc(appLabel(d.app))} · ${esc(d.mfaLabel)}${d.riskLabel ? " · risk " + esc(d.riskLabel) : ""}</span>`; },
  predictComing(d){ return "A new sign-in is on its way: <b>" + esc(d.kind === "attacker" ? "someone using Ana's password" : d.name) + "</b>."; },
  debrief(run, results){
    const e = E(), base = M.basePolicies, out = [];
    run.config.order.forEach(id => { const p = run.config.policies[id], b = base[id], nm = id === "NEW" ? "New policy" : id;
      ["state","include","network","client","risk"].forEach(k => { if (p[k] !== b[k]) out.push(`${nm} ${e.FIELD_LABEL[k]}: ${e.optLabel(k, b[k])} → ${e.optLabel(k, p[k])}`); });
      if (p.grant !== b.grant || JSON.stringify(p.controls) !== JSON.stringify(b.controls) || (p.grant === "grant" && p.op !== b.op)){
        const g = q => q.grant === "block" ? "Block access" : e.CTRL.filter(c => q.controls[c[0]]).map(c => c[1].replace("Require ", "")).join(q.op === "and" ? " AND " : " OR ");
        out.push(`${nm} Grant: ${g(b)} → ${g(p)}`); }
      const add = p.exclude.filter(x => !b.exclude.includes(x)); if (add.length) out.push(`${nm} Exclude: + ${add.map(x => e.principalLabel(M, x)).join(", ")}`);
    });
    const r = results.res, how = id => r[id].raw.outcome === "mfa" ? "after MFA" : M.actors[id].auth === "passkey" ? "with a passkey" : r[id].raw.usedDevice ? "on a compliant device" : "without a prompt";
    const legit = run.actors.filter(id => M.actors[id].legit).map(id => `${PLACES[id].short} ${how(id)}`).join(", ");
    const bad = run.actors.filter(id => !M.actors[id].legit).map(id => `${id === "imap" ? "the IMAP script" : "the leaked password"} ${r[id].raw.outcome === "blocked" ? "was blocked by " + r[id].raw.blockedBy.join(", ") : "failed " + r[id].raw.unmet.map(u => u.policy).join(", ") + "'s grant"}`).join("; ");
    const bonusOk = run.bonus.every(k => results.bonus[k].ok);
    return [`<b>You changed</b> ${out.length ? out.map(esc).join("; ") : "nothing"}.`,
      `<b>So</b> ${esc(legit)} got in, and ${esc(bad)}.${bonusOk ? "" : ' <span class="warn">Tip: exclude the emergency access account from every policy.</span>'}`,
      `<b>Exam concept · SC-300 2.2.3</b> Every matching Conditional Access policy applies: <b>Block wins</b>, otherwise <b>all</b> grant controls must be met, and <b>exclusions beat inclusions</b>.`];
  },
  hints:Object.fromEntries([1, 2, 3].map(l => [l, M.variants[l].hints.map(h => h && h.highlight ? { highlight:h.highlight.map(x => x.includes(".") ? "policies." + x : x), tab:(h.highlight.find(x => x.includes(".")) || "").split(".")[0] || null } : h)])),
  learnMore:M.learnMore, simplifications:M.simplifications, sources:M.sources
};
L.register(def);
})();
