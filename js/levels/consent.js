/* Mission 03 · The Consent Lure (enterprise apps: user and admin consent · SC-300 3.2.6, 3.2.1).
   Behaviour modelled (Microsoft Learn, "Configure how users consent to applications"):
   - "Do not allow user consent": users can't consent to any app.
   - "Allow user consent for apps from verified publishers, for selected permissions": only apps from verified publishers
     or registered in your tenant, and only for permissions you classified as low impact.
   - "Allow user consent for apps": any permission that doesn't require admin consent, for any app.
   - Permissions that require admin consent are never user-consentable.
   - With the admin consent workflow on, users who can't consent can send a request for admin review. */
(function () {
"use strict";
const L = window.ID_LEVELS, esc = L.esc;
const PERMS = { openid:"Sign users in", profile:"View users' basic profile", email:"View users' email address", offline_access:"Maintain access to data you have given it access to", "User.Read":"Sign in and read user profile",
  "Calendars.Read":"Read user calendars", "Mail.Read":"Read user mail", "Files.ReadWrite.All":"Have full access to all files user can access", "Directory.Read.All":"Read directory data (admin consent required)" };
const ADMIN_ONLY = ["Directory.Read.All"];
const CLASSIFIABLE = ["openid","profile","email","offline_access","User.Read","Calendars.Read","Mail.Read","Files.ReadWrite.All"];
const APPS = {
  expenses:{ name:"Halcyon Expenses", short:"Expenses app", initials:"HE", publisher:"Halcyon IT", pub:"tenant", perms1:["User.Read"], perms:["User.Read","offline_access"], door:"graph", origin:[8,23.2], wait:[16.8,11.4], tint:0xa8f0c8, legit:true, by:"Ana" },
  trippal:{ name:"TripPal", short:"TripPal", initials:"TP", publisher:"Contoso Travel", pub:"verified", perms:["openid","profile","email","User.Read"], door:"graph", origin:[13,23.2], wait:[19.2,11.4], tint:0xa8d8ff, legit:true, by:"Jun" },
  pdf:{ name:"PDF Converter Pro", short:"PDF Converter Pro", initials:"PC", publisher:"pdfconvert-pro.app (unverified)", pub:"unverified", perms:["Mail.Read","Files.ReadWrite.All","offline_access"], door:"mail", origin:[31.5,23.6], wait:[7.2,11.4], drone:"drone", legit:false, by:"Ana (from an email link)" },
  survey:{ name:"QuickPoll", short:"QuickPoll", initials:"QP", publisher:"Indie developer (unverified)", pub:"unverified", perms:["User.Read"], door:"graph", origin:[4,23.6], wait:[17.2,12.7], tint:0xffe39a, legit:true, by:"Priya" },
  reports:{ name:"Contoso Reports", short:"Contoso Reports", initials:"CR", publisher:"Contoso Ltd", pub:"verified", perms:["Directory.Read.All"], door:"graph", origin:[17,23.6], wait:[18.9,12.7], tint:0xd8c8ff, legit:true, by:"Theo" },
  mailmerge:{ name:"MailMerge Plus", short:"MailMerge Plus", initials:"MM", publisher:"Fabrikam Software", pub:"verified", perms:["User.Read","Mail.Read"], door:"mail", origin:[10.5,23.6], wait:[4.8,11.4], tint:0xffc8c8, legit:true, by:"Lena" },
  calsync:{ name:"Calendar Sync", short:"Calendar Sync", initials:"CS", publisher:"Northwind Apps", pub:"verified", perms:["User.Read","Calendars.Read"], door:"graph", origin:[8,23.2], wait:[18,13], tint:0xb8f0ff, legit:true, by:"Omar" },
  teampoll:{ name:"Team Poll", short:"Team Poll", initials:"TP", publisher:"Halcyon IT", pub:"tenant", perms:["openid","User.Read"], door:"graph", origin:[13,23.2], wait:[18,13], tint:0xc8ffc8, legit:true, by:"Lena" },
  archiver:{ name:"Mail Archiver", short:"Mail Archiver", initials:"MA", publisher:"mail-archive.io (unverified)", pub:"unverified", perms:["Mail.Read"], door:"mail", origin:[10.5,23.6], wait:[6,12.8], tint:0xffb0b0, legit:true, by:"Sam" }
};
const V = {
  1:{ actors:["expenses","trippal","pdf"], requirements:["expensesIn","tripIn","lureOut"], predictions:["teampoll","calsync","archiver"], editable:["userConsent"],
      start:{ userConsent:"all", workflow:false, lowImpact:["openid","profile","email","User.Read"] } },
  2:{ actors:["expenses","trippal","pdf","survey","reports"], requirements:["expensesIn","tripIn","lureOut","unverifiedOut","requestPath"], predictions:["teampoll","calsync","archiver"], editable:["userConsent","workflow","lowImpact"],
      start:{ userConsent:"all", workflow:false, lowImpact:["openid","profile","email","User.Read"] } },
  3:{ actors:["expenses","trippal","pdf","survey","reports","mailmerge"], requirements:["expensesIn","tripIn","lureOut","unverifiedOut","requestPath","mailReview"], predictions:["teampoll","calsync","archiver"], editable:["userConsent","workflow","lowImpact"],
      start:{ userConsent:"all", workflow:false, lowImpact:["openid","profile","email","offline_access","User.Read","Mail.Read"] } }
};
const SETTING = [["none","Do not allow user consent"],["verifiedLow","Allow user consent for apps from verified publishers, for selected permissions"],["all","Allow user consent for apps"]];
const pubLabel = a => a.pub === "verified" ? "Verified publisher ✓" : a.pub === "tenant" ? "Registered in your tenant" : "Unverified publisher";
function app(id, run){ const a = Object.assign({ id, kind:a0(id), drone:"drone_app" }, APPS[id]); if (id === "expenses" && run && run.level === 1) a.perms = a.perms1.slice();
  if (APPS[id].drone) a.drone = APPS[id].drone; a.role = a.publisher; a.logLine = `${pubLabel(a)} · ${a.perms.join(", ")}`; return a; }
function a0(id){ return APPS[id].legit === false ? "attacker" : "app"; }
function evaluate(cfg, a){
  const adminReq = a.perms.some(p => ADMIN_ONLY.includes(p));
  const notLow = a.perms.filter(p => !cfg.lowImpact.includes(p));
  let can = false, reason;
  if (adminReq){ reason = `${a.perms.filter(p => ADMIN_ONLY.includes(p)).join(", ")} requires admin consent. Users can never grant it.`; }
  else if (cfg.userConsent === "none"){ reason = "User consent is turned off."; }
  else if (cfg.userConsent === "all"){ can = true; reason = "User consent is allowed for any app and any permission that doesn't need admin consent."; }
  else { const pubOk = a.pub === "verified" || a.pub === "tenant";
    if (!pubOk) reason = "Publisher isn't verified, and the app isn't registered in your tenant.";
    else if (notLow.length) reason = `${notLow.join(", ")} ${notLow.length > 1 ? "aren't" : "isn't"} classified as low impact.`;
    else { can = true; reason = `${pubLabel(a)}, and every permission is classified low impact.`; } }
  if (can) return { outcome:"in", label:"Consent granted", why:`A user consented. ${reason}`, user:true, alarm:a.legit === false };
  if (cfg.workflow) return { outcome:"pending", icon:"env", label:"Sent for admin review", why:`Users can't consent: ${reason} The request went to the admin queue.` };
  return { outcome:"out", label:"Needs admin approval", why:`Users can't consent: ${reason} There's no way to request approval.` };
}
const def = {
  id:"consent", order:3, code:"MISSION 03", title:"The Consent Lure", domain:"Workload identities", topic:"3.2",
  objectives:["3.2.6","3.2.1"], predictObjectives:["3.2.6"], predictionIds:["teampoll","calsync","archiver"], srcKeys:["userConsent"],
  pitch:"A phishing email pushes a 'PDF converter' that wants everyone's mail. Users click Accept on anything.",
  objective:"Let safe apps through self-service and stop the consent phishing app.",
  startCoach:"Apps are queuing at the data doors. One of them came from a phishing email.",
  sign:"app",
  campus:{ console:{ title:"Enterprise apps terminal", sub:"Consent and permissions" } },
  area:{ name:"APP MARKET STREET", W:36, H:26, base:36, tint:0xffffff, bg:"#20242e", laneY:18.6,
    fills:[["tanb",0,19,36,7],["lav",21,19,8,4]],
    roads:[{ x:0, y:14, w:36, cross:[6,18,30] }],
    buildings:[{ key:"mail", label:"Mailboxes · Exchange Online", sign:"mail", x:2, y:1, roof:"A", facade:"orange", onlineLabel:"Normal", alarmLabel:"Mail leaving the building!", alarmText:"Mailboxes are being copied out!" }, { key:"graph", label:"Directory · Microsoft Graph", sign:"app", x:14, y:1, roof:"B", facade:"red", onlineLabel:"Apps connected" }, { key:"files", label:"Files · SharePoint", sign:"doc", x:26, y:1, roof:"C", facade:"red" }],
    props:[["lampB",11,10],["lampB",23,10],["mailbox",12,12],["hydrant",25,12],["tree2",0.6,2],["tree2",11.4,2],["tree2",23.4,2],["tree2",34.6,2],
      ["vending",1,19],["flowers",11,19],["vending",14,19],["crate",16,24.2],["bench",4.5,24.6],["psign",29,19],["van",32,22],["barrier",34,19],["trash",20,24.4]],
    console:{ x:25, y:21.6 },
    tags:[{ x:8.5, y:21.6, title:"App vendors", sub:"Third-party apps asking for consent", cls:"net" }, { x:33, y:21.2, title:"Unmarked van", sub:"Not ours", cls:"bad" }],
    exits:[{ edge:"west", at:[14,17], to:"gates", entry:"east" }, { edge:"south", at:[2,5], to:"pim", entry:"north", forward:true }],
    entries:{ start:[19,20.6], west:[1.2,15.5], south:[3.5,24.4] } },
  terminal:"Enterprise apps › Consent and permissions", runLabel:"Replay consent requests", log:{ title:"Consent requests", sub:"Apps users tried to approve today", short:"Apps" },
  inWord:"consented", outWord:"blocked", pendWord:"sent to admins",
  firstTip:"Today users can consent to <b>any</b> app. When a user clicks Accept, the app gets a token for the data it asked for.",
  consoleCoach:"Users can approve any app, including the phishing one. Tighten <b>User consent for applications</b>.",
  watchCoach:"Watch the apps at the doors…", winStamp:"LURE BLOCKED",
  variants:V,
  reqText:{ expensesIn:"Halcyon Expenses stays self-service", tripIn:"TripPal (verified publisher) stays self-service", lureOut:"PDF Converter Pro can't get user consent", unverifiedOut:"No unverified app gets user consent", requestPath:"Users can request admin review when they're blocked", mailReview:"No app reads mail without admin review" },
  newRun(level){ return { level, config:L.clone(V[level].start), actors:V[level].actors.slice(), requirements:V[level].requirements.slice(), bonus:[], tests:0, hints:0, phase:"play", xp:0, ui:{}, undo:[] }; },
  actor(id, run){ return app(id, run); },
  statics(){ return [{ id:"ana", name:"Ana Ortiz", short:"Ana", initials:"AO", role:"Marketing", char:1, pos:[28.2,21.6], facing:"down", kind:"person" }]; },
  staticEvidence(){ return { sub:"Marketing · clicked the PDF link", rows:[["Says","“An email said my invoice needed converting, so I clicked the link and pressed Accept. It asked to read my mail, but every app asks for something.”","information"],["Also","“TripPal and the Expenses app are fine. We use them every week. Please don't make me file a ticket for those.”","star"]] }; },
  editable(run, path){ return V[run.level].editable.includes(path.split(".")[0]); },
  editor(run, H){
    const c = run.config;
    let h = H.group("User consent for applications", H.seg("userConsent", "", SETTING, c.userConsent, { col:true }));
    h += H.group("Admin consent requests", H.toggle("workflow", "Users can request admin consent to apps they are unable to consent to", c.workflow, { on:"Yes", off:"No" }) + H.info("Reviewers", "Theo Grant (Cloud Application Administrator)"));
    h += H.group("Permission classifications · Low impact", H.checks("lowImpact", "Delegated permissions classified as low impact", CLASSIFIABLE.map(p => [p, p]), c.lowImpact, { col:false, note:"Only delegated permissions that don't require admin consent can be classified." }));
    return h;
  },
  onEdit(run, path, v){
    if (path === "userConsent" && v === "verifiedLow") return { key:"cs-low", text:"Now only apps from <b>verified publishers</b> (or your own tenant) can be approved by users, and only for <b>low impact</b> permissions." };
    if (path === "workflow" && v) return { key:"cs-wf", text:"Blocked users now get a <b>Request approval</b> button instead of a dead end." };
  },
  validate(){ return []; },
  simulate(run){
    const cfg = run.config, res = {};
    run.actors.forEach(id => { res[id] = evaluate(cfg, app(id, run)); });
    const req = {}, R = run.requirements;
    if (R.includes("expensesIn")) req.expensesIn = { ok:res.expenses.outcome === "in", why:res.expenses.why };
    if (R.includes("tripIn")) req.tripIn = { ok:res.trippal.outcome === "in", why:res.trippal.why };
    if (R.includes("lureOut")) req.lureOut = { ok:res.pdf.outcome !== "in", why:res.pdf.why };
    if (R.includes("unverifiedOut")){ const bad = run.actors.filter(id => APPS[id].pub === "unverified" && res[id].outcome === "in"); req.unverifiedOut = { ok:!bad.length, why:bad.length ? bad.map(id => APPS[id].name).join(", ") + " got user consent from an unverified publisher." : "Unverified apps can't be approved by users." }; }
    if (R.includes("requestPath")) req.requestPath = { ok:cfg.workflow, why:cfg.workflow ? "Blocked users can send a request to the reviewers." : "Blocked users hit a dead end (and start looking for workarounds)." };
    if (R.includes("mailReview")){ const bad = run.actors.filter(id => app(id, run).perms.includes("Mail.Read") && res[id].outcome === "in"); req.mailReview = { ok:!bad.length, why:bad.length ? bad.map(id => APPS[id].name).join(", ") + " can read mail through user consent alone." : "Every request to read mail goes to an admin." }; }
    return { res, req, bonus:{}, solved:R.every(k => req[k].ok) };
  },
  simulateOne(run, d){ return evaluate(run.config, d); },
  onResult(scene, a, res){
    if (res.outcome === "in" && a.data.legit === false && !a.isPrediction){ const b = scene.slotOf(a.door); scene.stream({ x:b.cx, y:(b.y + 6) * 16 }, { x:scene.van ? scene.van.x : 33 * 16, y:(22.6) * 16 }, 0xff5e5e); }
    if (res.outcome === "pending" && !a.isPrediction){ const env = scene.add.image(a.sp.x, a.sp.y - 10, "bubbles", 5).setDepth(6000); scene.tweens.add({ targets:env, x:scene.CON.x * 16, y:scene.CON.y * 16 - 20, duration:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900, onComplete:() => env.destroy() }); }
  },
  evidence(d, run, res){ return { sub:"Requested by " + d.by, rows:[["App", `${esc(d.name)}`, "home"], ["Publisher", `${esc(d.publisher)}<br><span class="${d.pub === "unverified" ? "warn" : "good"}">${pubLabel(d)}</span>`, "star"],
    ["Permissions", d.perms.map(p => `<code>${esc(p)}</code> <span class="muted small">${esc(PERMS[p])}</span>${ADMIN_ONLY.includes(p) ? ' <span class="warn">admin consent required</span>' : ""}`).join("<br>"), "locked"],
    ["Type", "Delegated permissions (acts as the signed-in user)", "singleplayer"]] }; },
  predictOptions:[["in","Users can consent: app gets in"],["pending","Request goes to admins"],["out","Blocked: no way to ask"]],
  predictActor(id, run){ return app(id, run); },
  predictTruth(res){ return res.outcome; },
  predictCard(d){ return `<b>${esc(d.name)}</b> · ${esc(pubLabel(d))}<br><span class="muted">Asks for ${d.perms.map(p => `<code>${esc(p)}</code>`).join(", ")}</span>`; },
  predictQuestion:"With <b>your</b> consent settings, what happens when a user clicks Accept?",
  predictComing(d){ return `Another app wants in: <b>${esc(d.name)}</b>.`; },
  debrief(run, results){
    const c = run.config, b = V[run.level].start, ch = [];
    if (c.userConsent !== b.userConsent) ch.push(`User consent: “${SETTING.find(x => x[0] === b.userConsent)[1]}” → “${SETTING.find(x => x[0] === c.userConsent)[1]}”`);
    if (c.workflow !== b.workflow) ch.push(`Admin consent workflow: ${c.workflow ? "on" : "off"}`);
    const add = c.lowImpact.filter(p => !b.lowImpact.includes(p)), rem = b.lowImpact.filter(p => !c.lowImpact.includes(p));
    if (add.length) ch.push("Low impact + " + add.join(", ")); if (rem.length) ch.push("Low impact − " + rem.join(", "));
    const r = results.res, list = st => run.actors.filter(id => r[id].outcome === st).map(id => APPS[id].name).join(", ") || "none";
    return [`<b>You changed</b> ${ch.length ? esc(ch.join("; ")) : "nothing"}.`, `<b>So</b> self-service: ${esc(list("in"))}. Sent to admins: ${esc(list("pending"))}. Blocked: ${esc(list("out"))}. The phishing app never got a token for anyone's mail.`,
      `<b>Exam concept · SC-300 3.2.6</b> Microsoft recommends allowing user consent only for <b>verified publishers</b> (or apps registered in your tenant) and only for permissions you classify as <b>low impact</b>. Permissions that require admin consent can never be granted by users. Turn on the <b>admin consent workflow</b> so blocked users can ask instead of finding workarounds.`];
  },
  hints:{
    1:["PDF Converter Pro has an unverified publisher. TripPal is verified, and Expenses is registered in your own tenant.", { highlight:["pdf","trippal","userConsent"] }, "Choose <b>Allow user consent for apps from verified publishers, for selected permissions</b>. Expenses (your tenant) and TripPal (verified) only ask for low-impact permissions, so users can still approve them. PDF Converter Pro is unverified and asks for <code>Mail.Read</code>, so users can't."],
    2:["Expenses now also asks for one of the basic sign-in permissions. And where do blocked requests go?", { highlight:["expenses","lowImpact","workflow"] }, "Use the verified-publisher setting, classify <code>offline_access</code> as low impact (it's part of the basic sign-in set), and turn on <b>Users can request admin consent</b>. QuickPoll and PDF Converter Pro become requests, and Contoso Reports needs <code>Directory.Read.All</code>, which is admin-only and goes to the queue."],
    3:["Someone classified a permission as low impact that shouldn't be. Inspect MailMerge Plus.", { highlight:["mailmerge","lowImpact"] }, "Remove <code>Mail.Read</code> from the low impact list. Then MailMerge Plus needs an admin, even though its publisher is verified. Also choose the verified-publisher setting and turn on the admin consent workflow."]
  },
  learnMore:`<p><b>User consent settings</b> (Enterprise apps › Consent and permissions):</p><ul><li><b>Do not allow user consent</b>: an admin has to approve every app.</li><li><b>Allow user consent for apps from verified publishers, for selected permissions</b>: allowed only for verified publishers and apps registered in your tenant, and only for permissions you classify as <b>low impact</b>. This is the setting Microsoft recommends.</li><li><b>Allow user consent for apps</b>: users can grant any permission that doesn't need admin consent, to any app.</li></ul><p>Permissions that require admin consent (for example <code>Directory.Read.All</code>) can never be granted by users. The <b>admin consent workflow</b> lets blocked users send a request to designated reviewers. Changes apply to future consent only: existing grants stay until you remove them.</p>`,
  simplifications:"Each app's publisher status and requested permissions are fixed facts here. Only Microsoft Graph delegated permissions appear. Existing consent grants, app-level settings such as assignment required, and reviewer approval of queued requests aren't simulated.",
  sources:[["Configure how users consent to applications","https://learn.microsoft.com/entra/identity/enterprise-apps/configure-user-consent"],["Configure permission classifications","https://learn.microsoft.com/entra/identity/enterprise-apps/configure-permission-classifications"],["Configure the admin consent workflow","https://learn.microsoft.com/entra/identity/enterprise-apps/configure-admin-consent-workflow"]]
};
L.register(def);
})();
