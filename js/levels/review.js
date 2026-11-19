/* Mission 05 · Who Still Needs This? (access reviews · SC-300 4.2.1, 4.2.2, 4.2.4).
   Behaviour modelled (Microsoft Learn, "Create an access review of groups and applications"): reviewers (Group owner(s),
   Selected user(s) or group(s), Users review their own access, Managers of users), fallback reviewers when a user has no
   manager, "If reviewers don't respond" (No change / Remove access / Approve access / Take recommendations),
   "Auto apply results to resource", and the "No sign-in within 30 days" recommendation. */
(function () {
"use strict";
const L = window.ID_LEVELS, esc = L.esc;
const MEMBERS = {
  ana:{ name:"Ana Ortiz", short:"Ana", initials:"AO", role:"Payroll analyst · Finance", manager:"omarA", lastSignIn:0, note:"Runs payroll every two weeks.", need:true, char:1, origin:[8,21.8], wait:[16.8,11.4] },
  elif:{ name:"Elif Kaya", short:"Elif", initials:"EK", role:"Accountant · Finance", manager:"omarL", lastSignIn:1, note:"Uses the payroll vault for month-end close.", need:true, char:5, origin:[11,21.8], wait:[19.2,11.4] },
  jun:{ name:"Jun Park", short:"Jun", initials:"JP", role:"Moved to Marketing 3 months ago", manager:"lena", lastSignIn:0, note:"Still signs in every day, to Marketing apps. Never removed from Finance-Payroll.", need:false, char:4, origin:[26,21.8], wait:[17.2,12.7] },
  kai:{ name:"Kai Brooks", short:"Kai", initials:"KB", role:"Former contractor · contract ended 40 days ago", manager:null, lastSignIn:40, note:"No manager in the directory. The account is still enabled.", need:false, char:3, tint:0xffe39a, origin:[30,22.4], wait:[18.9,12.7] },
  ines:{ name:"Ines Duarte", short:"Ines", initials:"ID", role:"Guest auditor (Lumen Logistics) · project ended", manager:null, lastSignIn:95, note:"B2B guest added for last year's audit.", need:false, char:5, tint:0xc8d8ff, origin:[33,23.4], wait:[16.2,13.7] },
  ella:{ name:"Ella Novak", short:"Ella", initials:"EN", role:"Payroll specialist · on parental leave", manager:"omarL", lastSignIn:60, note:"Back next month and needs payroll access on day one.", need:true, char:1, tint:0xffd0e0, origin:[5,23.4], wait:[19.8,13.7] },
  pia:{ name:"Pia Lund", short:"Pia", initials:"PL", role:"Moved from Finance to Legal last month", manager:"lena", lastSignIn:2, note:"Her new manager is Lena.", need:false, char:5, tint:0xe0ffd0, origin:[26,21.8], wait:[18,13] },
  dev:{ name:"Dev Shah", short:"Dev", initials:"DS", role:"Finance analyst · on a 6-week sabbatical", manager:"omarL", lastSignIn:45, note:"Still in Finance. Omar is on leave too.", need:true, char:4, tint:0xd8e8ff, origin:[11,21.8], wait:[18,13] },
  zoe:{ name:"Zoe Grant", short:"Zoe", initials:"ZG", role:"Former intern · left 2 months ago", manager:null, lastSignIn:62, note:"Her manager field was cleared when she left.", need:false, char:1, tint:0xfff0b0, origin:[30,22.4], wait:[18,13] }
};
const V = {
  1:{ actors:["ana","elif","jun","kai"], requirements:["anaKeeps","elifKeeps","junRemoved","kaiRemoved"], predictions:["pia","dev"], editable:["reviewers","noResponse"],
      start:{ reviewers:"owners", fallback:false, noResponse:"nochange", autoApply:true, recs:true } },
  2:{ actors:["ana","elif","jun","kai","ines"], requirements:["anaKeeps","elifKeeps","junRemoved","kaiRemoved","inesRemoved","applied"], predictions:["pia","dev","zoe"], editable:["reviewers","noResponse","fallback","autoApply"],
      start:{ reviewers:"owners", fallback:false, noResponse:"approve", autoApply:false, recs:true } },
  3:{ actors:["ana","elif","jun","kai","ines","ella"], requirements:["anaKeeps","elifKeeps","junRemoved","kaiRemoved","inesRemoved","ellaKeeps","applied"], predictions:["pia","dev","zoe"], editable:["reviewers","noResponse","fallback","autoApply","recs"],
      start:{ reviewers:"self", fallback:false, noResponse:"recommend", autoApply:false, recs:false } }
};
const REVIEWERS = [["owners","Group owner(s)"],["selected","Selected user(s) or group(s): Nadia"],["self","Users review their own access"],["managers","Managers of users"]];
const NORESP = [["nochange","No change"],["remove","Remove access"],["approve","Approve access"],["recommend","Take recommendations"]];
const STAFF = { omar:"Omar (manager, on leave)", lena:"Lena (Marketing manager)", theo:"Theo (group owner)", nadia:"Nadia (security)" };
function member(id){ const m = Object.assign({ id, kind:"person", door:"vault" }, MEMBERS[id]); m.logLine = `${m.role} · last sign-in ${m.lastSignIn ? m.lastSignIn + " days ago" : "today"}`; return m; }
const recommend = m => m.lastSignIn > 30 ? "deny" : "approve";   // "No sign-in within 30 days"
/* Who reviews, and what they decide. Behaviour comes from what each person tells you in the game. */
function decide(cfg, m){
  const nadia = () => cfg.recs ? { by:"nadia", d:recommend(m), why:`Nadia followed the recommendation (${m.lastSignIn > 30 ? "no sign-in for " + m.lastSignIn + " days" : "signed in recently"}).` } : { by:"nadia", d:"none", why:"Nadia doesn't know this person's job and had no recommendation to go on, so she didn't respond." };
  if (cfg.reviewers === "owners") return { by:"theo", d:"approve", why:"Theo (owner) approved everyone without checking." };
  if (cfg.reviewers === "selected") return nadia();
  if (cfg.reviewers === "self") return m.lastSignIn <= 30 || m.id === "ella" ? (m.id === "ella" ? { by:null, d:"none", why:"Ella is on leave and didn't see the review email." } : { by:null, d:"approve", why:`${m.short} approved their own access.` }) : { by:null, d:"none", why:`${m.short} no longer works here and didn't respond.` };
  // Managers of users
  if (!m.manager) return cfg.fallback ? Object.assign(nadia(), { why:"No manager in the directory, so the review went to the fallback reviewer. " + nadia().why }) : { by:null, d:"none", why:"No manager in the directory and no fallback reviewer, so nobody reviewed." };
  if (m.manager === "omarA") return { by:"omar", d:"approve", why:"Omar approved before going on leave: Ana runs payroll." };
  if (m.manager === "omarL") return { by:"omar", d:"none", why:"Omar is on leave and didn't respond." };
  if (m.manager === "lena") return { by:"lena", d:"deny", why:`Lena (${m.short}'s manager now) denied: Marketing doesn't need payroll.` };
  return { by:null, d:"none", why:"No response." };
}
function outcome(cfg, m){
  const r = decide(cfg, m);
  let final = r.d, why = r.why;
  if (r.d === "none"){
    final = cfg.noResponse === "remove" ? "deny" : cfg.noResponse === "approve" ? "approve" : cfg.noResponse === "recommend" ? recommend(m) : "approve";
    why += ` If reviewers don't respond: ${NORESP.find(x => x[0] === cfg.noResponse)[1]}${cfg.noResponse === "recommend" ? ` (${recommend(m)}: ${m.lastSignIn > 30 ? "no sign-in within 30 days" : "signed in recently"})` : ""}.`;
  }
  const removed = final === "deny" && cfg.autoApply;
  if (final === "deny" && !cfg.autoApply) why += " Denied, but auto apply is off, so nobody removed the access.";
  return { outcome:removed ? "out" : "in", label:removed ? "Access removed" : final === "deny" ? "Denied, not applied" : "Access kept", why, reviewer:r.by, decision:r.d, final };
}
const def = {
  id:"review", order:5, code:"MISSION 05", title:"Who Still Needs This?", domain:"Identity governance", topic:"4.2",
  objectives:["4.2.1","4.2.2","4.2.4"], predictObjectives:["4.2.2"], predictionIds:["pia","dev","zoe"], srcKeys:["arCreate"],
  pitch:"Finance-Payroll has collected people who left, moved teams or finished projects. Set up a review that cleans it up.",
  objective:"Set up an access review that removes stale payroll access and keeps the people who need it.",
  startCoach:"Quarter end: everyone in Finance-Payroll can still open the vault.",
  sign:"vault",
  campus:{ console:{ title:"Review desk", sub:"Access reviews · Finance-Payroll" } },
  area:{ name:"FINANCE CANAL", W:36, H:26, base:"tan", tint:0xffdcc4, bg:"#2a1d18", laneY:21.8,
    fills:[["grass",0,19,36,7],["tan",0,21,36,2]],
    water:[[0,16,36,3]], waterSolids:[[0,16,16,3],[21,16,15,3]], bridges:[[16,16,5,3]],
    buildings:[{ key:"finoffice", label:"Finance office", sign:"doc", x:2, y:1, roof:"C", facade:"orange" }, { key:"vault", label:"Payroll vault", sign:"vault", x:14, y:1, roof:"A", facade:"red", onlineLabel:"Right people only", alarmLabel:"Stale access inside", offlineLabel:"Payroll stalled", alarmText:"Someone who shouldn't be here got in!" }, { key:"records", label:"Records", sign:"server", x:26, y:1, roof:"B", facade:"red" }],
    props:[["autumn",0.4,2],["autumn",11.2,2],["autumn",12.6,4],["autumn",23.2,2],["autumn",24.6,4],["autumn",34.4,2],["bench",3,14.4],["bench",8,14.4],["lampG",15,13.4],["lampG",20.6,13.4],
      ["autumn",1.4,19],["autumn2",14,23.6],["tree",22,19.2],["autumn",34,19],["flowers",28,24.4],["bench",19,24.4],["potA",10,24.4]],
    console:{ x:27, y:13.6 },
    tags:[{ x:7.5, y:19.4, title:"Finance Canal", sub:"Where the team works", cls:"office" }],
    exits:[{ edge:"east", at:[20,23], to:"pim", entry:"west" }],
    entries:{ start:[20.5,12.4], east:[34.6,21.8] } },
  terminal:"Identity Governance › Access reviews", runLabel:"Run the review", log:{ title:"Group members", sub:"Finance-Payroll · 14-day review", short:"Members" },
  inWord:"kept", outWord:"removed",
  firstTip:"An access review asks someone to confirm whether each member still needs the group. Who answers, and what happens when nobody does, decides the outcome.",
  consoleCoach:"Theo, the owner, approves everyone. Choose reviewers who actually know what each person does.",
  watchCoach:"Reviewers decide, two weeks pass, then everyone tries the vault…", winStamp:"ACCESS CERTIFIED",
  variants:V,
  reqText:{ anaKeeps:"Ana keeps payroll access", elifKeeps:"Elif keeps access (her manager is on leave)", junRemoved:"Jun (moved to Marketing) loses access", kaiRemoved:"Kai (contract ended) loses access", inesRemoved:"Guest Ines loses access", ellaKeeps:"Ella (on leave, returning) keeps access", applied:"Results are applied, not just recorded" },
  newRun(level){ return { level, config:L.clone(V[level].start), actors:V[level].actors.slice(), requirements:V[level].requirements.slice(), bonus:[], tests:0, hints:0, phase:"play", xp:0, ui:{}, undo:[] }; },
  actor(id){ return member(id); },
  statics(){ return [
    { id:"omar", name:"Omar Haddad", short:"Omar (on leave)", initials:"OH", role:"Finance manager", char:4, tint:0xffd8a8, pos:[22.4,14.6], facing:"down", ghost:true, kind:"person" },
    { id:"lena", name:"Lena Fischer", short:"Lena", initials:"LF", role:"Marketing manager", char:1, tint:0xa8e2ff, pos:[24,15.2], facing:"down", kind:"person" },
    { id:"theo", name:"Theo Grant", short:"Theo (owner)", initials:"TG", role:"IT · Finance-Payroll group owner", char:0, tint:0xe0e0ff, pos:[30.6,14.6], facing:"down", kind:"person" },
    { id:"nadia", name:"Nadia Okafor", short:"Nadia", initials:"NO", role:"Security lead", char:5, tint:0xd8c8ff, pos:[32.2,15.2], facing:"down", kind:"admin" }]; },
  staticEvidence(d){ const t = { omar:[["Status","Out of office for the next three weeks, so he won't answer reviews.","warning"],["Before leaving","“Ana and Elif run payroll. Ella's back from parental leave next month and needs her access.”","information"]],
    lena:[["Says","“Jun moved to my Marketing team three months ago. He has no reason to be in payroll.”","information"]],
    theo:[["Says","“I own Finance-Payroll, but I don't know who does what in Finance. I'd just approve everyone.”","warning"]],
    nadia:[["Says","“I can review people nobody else covers, but I don't know their jobs. Give me the sign-in recommendations and I'll follow them.”","information"]] }[d.id];
    return { sub:d.role, rows:t }; },
  editable(run, path){ return V[run.level].editable.includes(path.split(".")[0]); },
  editor(run, H){
    const c = run.config;
    let h = H.group("Review · Finance-Payroll members · 14 days", H.seg("reviewers", "Select reviewers", REVIEWERS, c.reviewers, { col:true }) +
      (c.reviewers === "managers" ? H.toggle("fallback", "Fallback reviewer: Nadia Okafor (when a user has no manager)", c.fallback) : H.info("Fallback reviewers", "Available only with Managers of users or Group owner(s)")));
    h += H.group("Upon completion settings", H.toggle("autoApply", "Auto apply results to resource", c.autoApply) + H.seg("noResponse", "If reviewers don't respond", NORESP, c.noResponse));
    h += H.group("Enable reviewer decision helpers", H.toggle("recs", "No sign-in within 30 days (recommendation)", c.recs));
    return h;
  },
  onEdit(run, path, v){
    if (path === "noResponse" && v === "recommend") return { key:"ar-rec", text:"<b>Take recommendations</b>: if nobody answers, people with no sign-in in 30 days are denied and active people are approved." };
    if (path === "reviewers" && v === "managers") return { key:"ar-mgr", text:"Managers know who still does the job. Watch out for people who have <b>no manager</b>." };
  },
  validate(){ return []; },
  simulate(run){
    const cfg = run.config, res = {};
    run.actors.forEach(id => { res[id] = outcome(cfg, member(id)); });
    const req = {}, R = run.requirements, keep = id => ({ ok:res[id].outcome === "in", why:res[id].why }), gone = id => ({ ok:res[id].outcome === "out", why:res[id].why });
    if (R.includes("anaKeeps")) req.anaKeeps = keep("ana"); if (R.includes("elifKeeps")) req.elifKeeps = keep("elif"); if (R.includes("ellaKeeps")) req.ellaKeeps = keep("ella");
    if (R.includes("junRemoved")) req.junRemoved = gone("jun"); if (R.includes("kaiRemoved")) req.kaiRemoved = gone("kai"); if (R.includes("inesRemoved")) req.inesRemoved = gone("ines");
    if (R.includes("applied")) req.applied = { ok:cfg.autoApply, why:cfg.autoApply ? "Denied users are removed when the review ends." : "Decisions are recorded, but someone has to apply them by hand." };
    return { res, req, bonus:{}, solved:R.every(k => req[k].ok) };
  },
  simulateOne(run, d){ return outcome(run.config, d); },
  prelude(scene, run, results, done){
    const ids = run.actors, rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches || SAVE_MOTION();
    let i = 0;
    const step = () => {
      if (i >= ids.length){ scene.timeSkip(`14 days later · review complete${run.config.autoApply ? " · results applied" : " · results NOT applied"}`, done); return; }
      const id = ids[i++], r = results.res[id], s = r.reviewer && scene.statics[r.reviewer], a = scene.actors[id];
      const kind = r.decision === "approve" ? "ok" : r.decision === "deny" ? "no" : "ask";
      if (s){ scene.showBubble(s, kind, 900); window.UI.floatText(s.sp.x, s.sp.y - 20, `${a.data.short}: ${r.decision === "none" ? "no response" : r.decision}`, kind === "no" ? "no" : kind === "ok" ? "ok" : "time"); }
      else window.UI.floatText(a.sp.x, a.sp.y - 24, r.decision === "none" ? "No response" : r.decision === "approve" ? "Self-approved" : "Denied", "time");
      scene.time.delayedCall(rm ? 80 : 520, step);
    };
    step();
  },
  evidence(d, run, res){ return { sub:d.role, rows:[["Member", `${esc(d.name)}`, "singleplayer"], ["Manager", d.manager ? esc({ omarA:"Omar Haddad", omarL:"Omar Haddad (on leave)", lena:"Lena Fischer" }[d.manager]) : '<span class="warn">None in the directory</span>', "menuList"],
    ["Last sign-in", d.lastSignIn ? `<span class="${d.lastSignIn > 30 ? "warn" : ""}">${d.lastSignIn} days ago</span>` : "Today", "target"], ["Note", esc(d.note), "information"],
    ...(res ? [["Review", `${esc(res.why)}`, "star"]] : [])] }; },
  predictOptions:[["in","Keeps payroll access"],["out","Access removed"]],
  predictActor(id){ return member(id); },
  predictTruth(res){ return res.outcome; },
  predictCard(d){ return `<b>${esc(d.name)}</b> · ${esc(d.role)}<br><span class="muted">Manager: ${d.manager ? esc({ omarA:"Omar", omarL:"Omar (on leave)", lena:"Lena" }[d.manager]) : "none"} · last sign-in ${d.lastSignIn ? d.lastSignIn + " days ago" : "today"}</span>`; },
  predictQuestion:"Next quarter's review uses <b>your</b> settings. What happens to this member?",
  predictComing(d){ return `Next quarter, a new name on the list: <b>${esc(d.name)}</b>.`; },
  debrief(run, results){
    const c = run.config, b = V[run.level].start, ch = [];
    if (c.reviewers !== b.reviewers) ch.push(`Reviewers: ${REVIEWERS.find(x => x[0] === b.reviewers)[1]} → ${REVIEWERS.find(x => x[0] === c.reviewers)[1]}`);
    if (c.fallback !== b.fallback) ch.push("Fallback reviewer: Nadia");
    if (c.noResponse !== b.noResponse) ch.push(`If reviewers don't respond: ${NORESP.find(x => x[0] === c.noResponse)[1]}`);
    if (c.autoApply !== b.autoApply) ch.push(`Auto apply results: ${c.autoApply ? "on" : "off"}`);
    if (c.recs !== b.recs) ch.push(`Sign-in recommendations: ${c.recs ? "on" : "off"}`);
    const r = results.res, kept = run.actors.filter(id => r[id].outcome === "in").map(id => MEMBERS[id].short), gone = run.actors.filter(id => r[id].outcome === "out").map(id => MEMBERS[id].short);
    return [`<b>You changed</b> ${esc(ch.join("; ") || "nothing")}.`, `<b>So</b> ${esc(gone.join(", "))} lost the vault, and ${esc(kept.join(", "))} kept it. Managers judged their own people, and the fallback or default handled everyone nobody answered for.`,
      `<b>Exam concept · SC-300 4.2.2</b> Choose reviewers who know the business (often <b>Managers of users</b>), add a <b>fallback reviewer</b> for users with no manager, decide what happens <b>if reviewers don't respond</b> (Take recommendations uses “no sign-in within 30 days”), and turn on <b>Auto apply results to resource</b> so denials actually remove access.`];
  },
  hints:{
    1:["Theo approves everyone. Who actually knows what Jun does now? And what happens to Kai, who has no manager?", { highlight:["jun","kai","reviewers","noResponse"] }, "Set reviewers to <b>Managers of users</b>. Lena denies Jun, and Omar approves Ana before his leave. Set <b>If reviewers don't respond</b> to <b>Take recommendations</b>: Elif signed in yesterday, so she's approved, and Kai hasn't signed in for 40 days, so he's denied. Choosing Remove access would cut off Elif."],
    2:["Denials only matter if they're applied. And who reviews Kai and Ines, who have no manager?", { highlight:["kai","ines","autoApply","fallback"] }, "Use <b>Managers of users</b>, turn on <b>Auto apply results to resource</b>, and either choose <b>Take recommendations</b> or add <b>Nadia as fallback reviewer</b>. Nadia follows the 30-day recommendation, so she denies Kai and Ines."],
    3:["Taking recommendations would also remove Ella, who's on leave. Who could judge Kai and Ines instead?", { highlight:["ella","nadia","fallback","recs","noResponse"] }, "Use <b>Managers of users</b> with <b>Nadia as fallback</b>, turn on the <b>No sign-in within 30 days</b> helper so Nadia can decide, set <b>If reviewers don't respond</b> to <b>No change</b> so Elif and Ella keep their access while Omar is away, and turn on <b>Auto apply</b>."]
  },
  learnMore:`<p><b>Access reviews</b> (Microsoft Entra ID Governance) ask reviewers to confirm continued access to groups, apps or roles, once or on a schedule.</p><ul><li><b>Reviewers:</b> Group owner(s), Selected user(s) or groups, Users review their own access, or Managers of users. Fallback reviewers cover users with no manager (or groups with no owner).</li><li><b>If reviewers don't respond:</b> No change, Remove access, Approve access, or Take recommendations.</li><li><b>Auto apply results to resource:</b> removes denied users when the review ends. Without it, someone has to apply the results by hand.</li><li><b>Decision helpers:</b> “No sign-in within 30 days” recommends denial for inactive users. User-to-Group Affiliation is another helper.</li></ul>`,
  simplifications:"Reviewer behaviour is scripted from what each person tells you (Theo approves everyone, Nadia follows recommendations only when they're shown). The 14-day review passes instantly. Real reviews also send email reminders, can run in multiple stages, and keep an audit history.",
  sources:[["Create an access review of groups and applications","https://learn.microsoft.com/entra/id-governance/create-access-review"],["What are access reviews?","https://learn.microsoft.com/entra/id-governance/access-reviews-overview"],["Complete an access review","https://learn.microsoft.com/entra/id-governance/complete-access-review"]]
};
function SAVE_MOTION(){ const s = window.IDSave && window.IDSave.state; return !!(s && s.lab && s.lab.game && s.lab.game.settings.motion === "reduce"); }
L.register(def);
})();
