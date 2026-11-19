/* Mission 04 · Admin for an Hour (Privileged Identity Management · SC-300 4.3.1, 4.3.4).
   Behaviour modelled (Microsoft Learn, PIM role settings): eligible vs active assignments, permanent vs time-bound
   assignments, activation maximum duration (1 to 24 hours), "On activation, require multifactor authentication",
   "Require justification on activation" and "Require approval to activate" (with approvers). Least privilege: the
   Exchange Administrator role covers Exchange Online mail flow; Global Administrator does too, with far more power. */
(function () {
"use strict";
const L = window.ID_LEVELS, esc = L.esc;
const ROLES = [["ga","Global Administrator"],["exo","Exchange Administrator"],["ua","User Administrator"],["sr","Security Reader"]];
const CAN_EXO = { ga:true, exo:true, ua:false, sr:false };
const RAVI = { char:4, tint:0xc8e0ff };
const ATT = {
  r1000:{ name:"Ravi Menon · 10:00", short:"Ravi 10:00", time:"10:00", t:0, day:0, mfaOk:true, ravi:true, legit:true, origin:[9.5,20.8], wait:[17.2,11.4], note:"Starts the 2-hour mail-flow fix. Has his phone for MFA and a ticket number." },
  r1130:{ name:"Ravi Menon · 11:30", short:"Ravi 11:30", time:"11:30", t:1.5, day:0, mfaOk:true, ravi:true, legit:true, ghost:true, origin:[10.5,20.8], wait:[18.8,11.6], note:"Still testing the fix, 90 minutes in. Uses the same activation." },
  r1300:{ name:"Ravi Menon · 13:00", short:"Ravi 13:00", time:"13:00", t:3, day:0, mfaOk:true, ravi:true, legit:true, ghost:true, origin:[11.5,20.8], wait:[17.6,12.8], note:"The job finished at 12:00. He pops back for a quick look." },
  attacker:{ name:"Ravi's password · 22:00", short:"Unknown 22:00", time:"22:00", t:12, day:0, mfaOk:false, kind:"attacker", legit:false, char:3, tint:0x8a7fd0, origin:[34,23.2], wait:[19.6,12.7], note:"Phished password, unknown laptop in another country. No access to Ravi's phone." },
  r45:{ name:"Ravi Menon · +45 days", short:"Ravi +45 days", time:"+45 days", t:0, day:45, mfaOk:true, ravi:true, legit:false, ghost:true, origin:[12.5,20.8], wait:[16.3,12.4], note:"His contract ended on day 30, but his account is still enabled." },
  next:{ name:"Ravi Menon · next day 09:45", short:"Ravi (next day)", time:"09:45", t:0.75, day:1, mfaOk:true, ravi:true, legit:true, fresh:true, origin:[9.5,20.8], wait:[18,13], note:"Activates again the next morning for a short fix, then checks back 45 minutes later." },
  late:{ name:"Ravi Menon · 23:00", short:"Ravi 23:00", time:"23:00", t:13, day:0, mfaOk:true, ravi:true, legit:true, origin:[10.5,20.8], wait:[18,13], note:"Same day, late evening. He doesn't start a new activation." },
  fatigue:{ name:"Ravi's password · MFA fatigue", short:"Unknown 02:00", time:"02:00", t:16, day:0, mfaOk:true, kind:"attacker", legit:false, char:3, tint:0x7f78c8, origin:[34,23.2], wait:[18,13], fresh:true, note:"The attacker spammed push prompts until a sleepy Ravi tapped Approve, so MFA passes." }
};
const V = {
  1:{ actors:["r1000","r1130","r1300","attacker"], requirements:["leastPriv","jit","rWorks","closes","attackerOut"], predictions:["next","late"], editable:["role","type"],
      start:{ role:"ga", type:"active", expiry:"permanent", maxHours:2, mfa:true, justification:true, approval:false } },
  2:{ actors:["r1000","r1130","r1300","attacker"], requirements:["leastPriv","jit","rWorks","closes","attackerOut","mfaOn"], predictions:["next","late","fatigue"], editable:["role","type","maxHours","mfa"],
      start:{ role:"ga", type:"active", expiry:"permanent", maxHours:8, mfa:false, justification:true, approval:false } },
  3:{ actors:["r1000","r1130","r1300","attacker","r45"], requirements:["leastPriv","jit","rWorks","closes","attackerOut","mfaOn","approval","expires"], predictions:["next","late","fatigue"], editable:["role","type","maxHours","mfa","justification","approval","expiry"],
      start:{ role:"ga", type:"active", expiry:"permanent", maxHours:8, mfa:false, justification:false, approval:false } }
};
function attempt(id){ const a = Object.assign({ id, kind:"person", door:"exo", char:RAVI.char, tint:RAVI.tint, initials:"RM", role:"Contractor · Exchange specialist" }, ATT[id]);
  if (a.kind === "attacker"){ a.initials = "??"; a.role = "Sign-in with Ravi's password"; }
  a.logLine = a.note; return a; }
const roleName = k => ROLES.find(r => r[0] === k)[1];
/* One attempt to use the admin room (Exchange admin center) */
function evaluate(cfg, a){
  const can = CAN_EXO[cfg.role], R = roleName(cfg.role);
  const res = (outcome, label, why, extra) => Object.assign({ outcome, label, why }, extra || {});
  if (a.day > 30 && cfg.expiry === "30d") return res("out", "Assignment expired", "The assignment ended with the contract on day 30, so nothing is left to activate.");
  if (cfg.type === "active"){
    if (!can) return res("out", "Wrong role", `${R} can't manage Exchange mail flow.`);
    return res("in", "Standing access", `${R} is permanently active: no activation, no MFA prompt, nothing expires.`, { alarm:a.legit === false });
  }
  // Eligible: the role has to be activated
  if (a.kind === "attacker"){
    if (cfg.mfa && !a.mfaOk) return res("out", "MFA failed", "Activation requires MFA, and the attacker doesn't have Ravi's phone.", { pre:"mfa" });
    if (cfg.approval) return res("out", "Denied by approver", "Nadia got a 2 AM activation request with no ticket and denied it.", { pre:cfg.mfa ? "mfa" : "ask", approver:"nadia", approved:false });
    if (!can) return res("out", "Wrong role", `Activated ${R}, which can't manage mail flow.`);
    return res("in", "Activated", `Activation needed only ${cfg.mfa ? "an MFA approval" : "a password"}. The attacker is an ${R} now.`, { alarm:true, pre:cfg.mfa ? "mfa" : null });
  }
  const freshAct = a.fresh || a.day > 0;   // the 10:00 activation covers that day's attempts; a new day means a new activation
  if (cfg.approval && !cfg.justification) return res("out", "Denied by approver", "The request arrived with no justification, so Nadia couldn't tell why Ravi needed admin rights and denied it.", { pre:"ask", approver:"nadia", approved:false });
  if (a.t >= cfg.maxHours) return res("out", "Activation expired", `The ${cfg.maxHours}-hour activation from ${a.day ? "that morning" : "10:00"} has ended. The role is back to eligible.`, { pre:"clock" });
  if (!can) return res("out", "Wrong role", `${R} is active, but it can't manage Exchange mail flow.`);
  const first = a.t === 0 || freshAct;
  return res("in", first ? "Activated" : "Still active", first ? `Activated ${R} for up to ${cfg.maxHours} h${cfg.mfa ? " after MFA" : ""}${cfg.justification ? " with a justification" : ""}${cfg.approval ? ", approved by Nadia" : ""}.` : `Still inside the ${cfg.maxHours}-hour activation window.`,
    first ? { pre:cfg.mfa ? "mfa" : null, approver:cfg.approval ? "nadia" : null, approved:true } : { pre:"clock" });
}
const def = {
  id:"pim", order:4, code:"MISSION 04", title:"Admin for an Hour", domain:"Identity governance", topic:"4.3",
  objectives:["4.3.1","4.3.4"], predictObjectives:["4.3.1","4.3.4"], predictionIds:["next","late","fatigue"], srcKeys:["pimSettings"],
  pitch:"A contractor needs Exchange admin rights for one job, but he's held Global Administrator for a year.",
  objective:"Give Ravi just enough admin access, just in time, and nothing more.",
  startCoach:"Night shift. Ravi's admin rights never switch off, and someone else has his password.",
  sign:"server",
  campus:{ console:{ title:"PIM terminal", sub:"Privileged Identity Management" } },
  area:{ name:"ADMIN COMPOUND", W:36, H:26, base:461, tint:0x9aa6e6, bg:"#0b0f1e", laneY:17.8, night:true,
    fills:[[36,0,10,36,4],["lav",22,14,8,4],[435,2,19,10,1],[435,22,21,12,1],[437,13,19,1,1]],
    buildings:[{ key:"idadmin", label:"Identity admin", sign:"badge", x:2, y:1, roof:"B", facade:"red" }, { key:"exo", label:"Exchange admin", sign:"server", x:14, y:1, roof:"A", facade:"orange", onlineLabel:"Mail flow being fixed", offlineLabel:"Mail flow broken", alarmLabel:"Intruder with admin rights", onlineText:"mail flow restored" }, { key:"azure", label:"Azure subscriptions", sign:"cloud", x:26, y:1, roof:"C", facade:"red" }],
    fences:[[0,25,36]],
    props:[["lampB",1,10],["lampB",13.2,11.4],["lampB",23,11.4],["lampB",34.4,10],["barrier2",31,15],["barrier2",32,15],["van",7,21],["crate",3,23.2],["crate",4,23.2],["psign",13,19.6],["lampG",20,20],["barrier",34,18]],
    console:{ x:26, y:16.6 },
    tags:[{ x:9, y:20.4, title:"Ravi's car", sub:"Contractor parking", cls:"office" }, { x:32, y:21.2, title:"Outside the VPN", sub:"Unknown networks", cls:"bad" }],
    exits:[{ edge:"north", at:[10,13], to:"consent", entry:"south" }, { edge:"west", at:[16,19], to:"review", entry:"east", forward:true }],
    entries:{ start:[19,15.2], north:[11.5,1.4], west:[1.2,17.6] } },
  terminal:"PIM › Microsoft Entra roles", runLabel:"Replay the day", log:{ title:"PIM activity", sub:"Ravi's admin room attempts", short:"Activity" },
  inWord:"in", outWord:"denied",
  firstTip:"Ravi has an <b>active, permanent Global Administrator</b> assignment, set up a year ago for a one-off job. Admin rights that never switch off are exactly what attackers want.",
  consoleCoach:"Pick the <b>least privileged role</b> for mail flow, and make it <b>Eligible</b> so Ravi has to activate it.",
  watchCoach:"Watch the Exchange admin door through the day…", winStamp:"JUST IN TIME",
  variants:V,
  reqText:{ leastPriv:"Least privilege: a role that only covers Exchange", jit:"Just in time: Ravi activates when he needs it", rWorks:"Ravi can work 10:00–12:00", closes:"Admin access is gone after the job", attackerOut:"The stolen password can't get admin rights", mfaOn:"Activation requires MFA", approval:"Nadia approves activations", expires:"Access ends when Ravi's contract ends (day 30)" },
  newRun(level){ return { level, config:L.clone(V[level].start), actors:V[level].actors.slice(), requirements:V[level].requirements.slice(), bonus:[], tests:0, hints:0, phase:"play", xp:0, ui:{}, undo:[] }; },
  actor(id){ return attempt(id); },
  statics(){ return [{ id:"nadia", name:"Nadia Okafor", short:"Nadia", initials:"NO", role:"Security lead · PIM approver", char:5, tint:0xd8c8ff, pos:[28.6,16.6], facing:"down", kind:"admin" }]; },
  staticEvidence(run){ return { sub:"Security lead · approver", rows:[["Says","“Ravi's job is mail-flow rules in Exchange Online. It takes two hours, 10:00 to 12:00.”","information"],["Also","“If I approve, I want to see why: a justification and a ticket number. I don't approve requests in the middle of the night.”","checkmark"],["And","“His contract ends in 30 days. His access should end then too.”","warning"]] }; },
  editable(run, path){ return V[run.level].editable.includes(path.split(".")[0]); },
  editor(run, H){
    const c = run.config;
    let h = H.group("Assignment · Ravi Menon", H.seg("role", "Role", ROLES, c.role, { col:false }) + H.seg("type", "Assignment type", [["eligible","Eligible"],["active","Active"]], c.type) + H.seg("expiry", "Assignment duration", [["permanent","Permanently eligible/active"],["30d","Expire after 30 days (contract end)"]], c.expiry));
    h += H.group(`Role settings · ${roleName(c.role)}`, H.seg("maxHours", "Activation maximum duration (hours)", [[1,"1"],[2,"2"],[4,"4"],[8,"8"],[24,"24"]], c.maxHours) +
      H.toggle("mfa", "On activation, require multifactor authentication", c.mfa) + H.toggle("justification", "Require justification on activation", c.justification) +
      H.toggle("approval", "Require approval to activate", c.approval) + (c.approval ? H.info("Approvers", "Nadia Okafor") : ""));
    return h;
  },
  onEdit(run, path, v){
    if (path === "type" && v === "eligible") return { key:"pim-elig", text:"<b>Eligible</b>: Ravi holds no admin rights until he activates the role, and each activation expires." };
    if (path === "approval" && v) return { key:"pim-appr", text:"Approvers see the request before the role activates. Nadia wants a <b>justification</b>." };
  },
  validate(){ return []; },
  simulate(run){
    const cfg = run.config, res = {};
    run.actors.forEach(id => { res[id] = evaluate(cfg, attempt(id)); });
    const R = run.requirements, req = {};
    req.leastPriv = { ok:cfg.role === "exo", why:cfg.role === "exo" ? "Exchange Administrator covers mail flow and nothing else." : cfg.role === "ga" ? "Global Administrator can do everything in the tenant: far more than this job needs." : `${roleName(cfg.role)} can't fix mail flow at all.` };
    req.jit = { ok:cfg.type === "eligible", why:cfg.type === "eligible" ? "Eligible: Ravi activates when he needs it." : "Active: the rights are on all the time." };
    req.rWorks = { ok:res.r1000.outcome === "in" && res.r1130.outcome === "in", why:res.r1000.outcome !== "in" ? res.r1000.why : res.r1130.why };
    req.closes = { ok:res.r1300.outcome !== "in", why:res.r1300.why };
    req.attackerOut = { ok:res.attacker.outcome !== "in", why:res.attacker.why };
    if (R.includes("mfaOn")) req.mfaOn = { ok:cfg.mfa, why:cfg.mfa ? "MFA is required on every activation." : "Activation needs only a password." };
    if (R.includes("approval")) req.approval = { ok:cfg.approval && res.r1000.outcome === "in", why:!cfg.approval ? "Nobody reviews activations." : res.r1000.outcome !== "in" ? res.r1000.why : "Nadia sees and approves each activation." };
    if (R.includes("expires")) req.expires = { ok:res.r45 && res.r45.outcome !== "in", why:res.r45 ? res.r45.why : "" };
    return { res, req, bonus:{}, solved:R.every(k => req[k].ok) };
  },
  simulateOne(run, d){ return evaluate(run.config, d); },
  evidence(d){ return { sub:d.role, rows:[["Who", d.kind === "attacker" ? `Signs in as <code>ravi.menon@halcyonfreight.com</code>` : "Ravi Menon · contractor (Fabrikam Consulting)", "singleplayer"], ["When", esc(d.time) + (d.day ? ` · day ${d.day}` : " · job day"), "star"], ["Situation", esc(d.note), "information"],
    ["MFA", d.mfaOk ? '<span class="good">Can complete MFA</span>' : '<span class="warn">Can\'t complete MFA</span>', "phone"], ["Needs", "Exchange Online mail flow rules", "wrench"]] }; },
  predictOptions:[["in","Gets into the admin room"],["out","Stays out"]],
  predictActor(id){ return attempt(id); },
  predictTruth(res){ return res.outcome; },
  predictCard(d){ return `<b>${esc(d.name)}</b><br><span class="muted">${esc(d.note)}</span>`; },
  predictQuestion:"With <b>your</b> PIM settings, what happens at the admin room?",
  predictComing(d){ return `One more attempt to check: <b>${esc(d.name)}</b>.`; },
  debrief(run, results){
    const c = run.config, b = V[run.level].start, ch = [];
    if (c.role !== b.role) ch.push(`Role: ${roleName(b.role)} → ${roleName(c.role)}`);
    if (c.type !== b.type) ch.push(`Assignment: ${b.type} → ${c.type}`);
    if (c.maxHours !== b.maxHours) ch.push(`Activation maximum duration: ${b.maxHours} h → ${c.maxHours} h`);
    ["mfa","justification","approval"].forEach(k => { if (c[k] !== b[k]) ch.push(`${{ mfa:"Require MFA", justification:"Require justification", approval:"Require approval" }[k]}: ${c[k] ? "on" : "off"}`); });
    if (c.expiry !== b.expiry) ch.push("Assignment expires after 30 days");
    const r = results.res;
    return [`<b>You changed</b> ${esc(ch.join("; ") || "nothing")}.`, `<b>So</b> Ravi activated at 10:00 and worked until 12:00, and the role switched off on its own (13:00: ${esc(r.r1300.label.toLowerCase())}). The stolen password got nowhere at 22:00: ${esc(r.attacker.label.toLowerCase())}.`,
      `<b>Exam concept · SC-300 4.3.1</b> In Privileged Identity Management, make privileged roles <b>Eligible</b>, not Active, and pick the <b>least privileged</b> role. Use role settings to limit <b>activation duration</b> (1–24 h) and to require <b>MFA</b>, a <b>justification</b> and <b>approval</b>. Time-bound assignments end access when the need does.`];
  },
  hints:{
    1:["Which role covers Exchange mail flow and nothing more? And should Ravi hold it all the time?", { highlight:["r1300","attacker","role","type"] }, "Set <b>Role</b> to <b>Exchange Administrator</b> and <b>Assignment type</b> to <b>Eligible</b>. Ravi activates at 10:00 (MFA is already required) and the 2-hour activation ends at 12:00. The attacker can't pass MFA, so the role never activates for them."],
    2:["How long is the job? And what stops a stolen password from activating the role?", { highlight:["r1300","attacker","maxHours","mfa"] }, "Exchange Administrator, <b>Eligible</b>, <b>Activation maximum duration: 2 hours</b>, and <b>On activation, require multifactor authentication</b>. With 1 hour, Ravi's 11:30 check would fail. With 4 or more, he'd still have admin rights at 13:00."],
    3:["Talk to Nadia: she wants to see a reason for every request. And look at the +45 days attempt.", { highlight:["nadia","r45","approval","justification","expiry"] }, "Exchange Administrator · Eligible · <b>Expire after 30 days</b> · 2-hour activation · require MFA · <b>require justification</b> · <b>require approval</b> (Nadia). Without a justification Nadia denies the request, and without the expiry Ravi could still activate after his contract ended."]
  },
  learnMore:`<p><b>Privileged Identity Management (PIM)</b> provides just-in-time privileged access. <b>Eligible</b> assignments have to be activated before use. <b>Active</b> assignments are always on. Assignments can be permanent or expire on a date.</p><p>Role settings include <b>Activation maximum duration</b> (1 to 24 hours), <b>On activation, require multifactor authentication</b> (or a Conditional Access authentication context), <b>Require justification</b>, <b>Require ticket information</b>, and <b>Require approval to activate</b> with chosen approvers. If you set no approvers, Privileged Role Administrators and Global Administrators are the default approvers. Requires Microsoft Entra ID P2 or Microsoft Entra ID Governance.</p>`,
  simplifications:"Times are fixed attempts on one day. Approver behaviour is scripted from what Nadia tells you. In real PIM, Ravi could extend or re-activate the role, and someone with strong authentication earlier in the session may not be prompted for MFA again. The admin room stands for the Exchange admin center.",
  sources:[["Configure Microsoft Entra role settings in PIM","https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings"],["What is Privileged Identity Management?","https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-configure"],["Least privileged roles by task","https://learn.microsoft.com/entra/identity/role-based-access-control/delegate-by-task"]]
};
L.register(def);
})();
