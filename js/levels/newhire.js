/* Mission 01 · New Hire Day (users, groups, group-based licensing · SC-300 1.2).
   Behaviour modelled: dynamic membership rules (user.department / user.companyName / user.userType with -eq, -ne,
   -startsWith, -contains; case-insensitive string matching; -and binds before -or), members of a dynamic group can't be
   added by hand, and a license assigned to a group goes to every member (group-based licensing). */
(function () {
"use strict";
const L = window.ID_LEVELS, esc = L.esc;
const PROPS_ = { department:"user.department", companyName:"user.companyName", userType:"user.userType" };
const VALUES = { department:["Sales","Sales Operations","Marketing","Salesforce Platform","Finance"], companyName:["Halcyon Freight","Brightwave Staffing","Lumen Logistics"], userType:["Member","Guest"] };
const OPS = [["-eq","-eq"],["-ne","-ne"],["-startsWith","-startsWith"],["-contains","-contains"]];
const PEOPLE = {
  maya:{ name:"Maya Chen", short:"Maya", initials:"MC", role:"Account Executive · starts today", department:"Sales", companyName:"Halcyon Freight", userType:"Member", note:"New hire. HR created her account this morning.", char:1, tint:0xffd6e8, origin:[31,21.3], wait:[16.4,11.5], legit:true, want:true },
  leo:{ name:"Leo Park", short:"Leo", initials:"LP", role:"Sales Ops Analyst", department:"Sales", companyName:"Halcyon Freight", userType:"Member", note:"Works on the Sales floor every day.", char:4, origin:[20.5,21.3], wait:[17.6,11.9], legit:true, want:true },
  sam:{ name:"Sam Ortiz", short:"Sam", initials:"SO", role:"Marketing Specialist", department:"Marketing", companyName:"Halcyon Freight", userType:"Member", note:"Wants a desk on the Sales floor. He's in Marketing.", char:0, tint:0xb8f0c8, origin:[1.5,12.4], wait:[19.0,11.9], legit:true, want:false },
  kai:{ name:"Kai Brooks", short:"Kai", initials:"KB", role:"Sales contractor (Brightwave Staffing)", department:"Sales", companyName:"Brightwave Staffing", userType:"Member", note:"Contractor. Brightwave licenses its own staff.", char:3, tint:0xffe39a, origin:[16.2,21.3], wait:[20.2,11.5], legit:true, want:false },
  ines:{ name:"Ines Duarte", short:"Ines", initials:"ID", role:"Partner (Lumen Logistics) · B2B guest", department:"Sales", companyName:"Lumen Logistics", userType:"Guest", note:"Guest from a partner company. Her department is copied from her home tenant.", char:5, tint:0xc8d8ff, origin:[34,21.3], wait:[16.6,12.9], legit:true, want:false },
  rui:{ name:"Rui Santos", short:"Rui", initials:"RS", role:"Salesforce Platform engineer (IT)", department:"Salesforce Platform", companyName:"Halcyon Freight", userType:"Member", note:"IT engineer who runs the CRM platform. Not on the Sales team.", char:2, origin:[14.6,21.3], wait:[19.6,12.9], legit:true, want:false },
  tom:{ name:"Tom Reyes", short:"Tom", initials:"TR", role:"Account Executive · starts next week", department:"Sales", companyName:"Halcyon Freight", userType:"Member", char:0, tint:0xffd8a8, origin:[30,21.3], wait:[18.2,13.1], legit:true, want:true },
  bea:{ name:"Bea Novak", short:"Bea", initials:"BN", role:"Sales Ops contractor (Brightwave)", department:"Sales Operations", companyName:"Brightwave Staffing", userType:"Member", char:5, tint:0xffe0a0, origin:[16.2,21.3], wait:[18.2,13.1], legit:true, want:false },
  uma:{ name:"Uma Patel", short:"Uma", initials:"UP", role:"Partner (Lumen Logistics) · B2B guest", department:"Sales Operations", companyName:"Lumen Logistics", userType:"Guest", char:1, tint:0xc8f0ff, origin:[34,21.3], wait:[18.2,13.1], legit:true, want:false }
};
const V = {
  1:{ actors:["maya","leo","sam"], requirements:["mayaIn","leoIn","samOut","dynamic"], predictions:["tom","bea"],
      editable:["membership","assigned","clauses"], start:{ membership:"assigned", assigned:["leo"], clauses:[{ prop:"department", op:"-eq", value:"Sales", join:"and" }] } },
  2:{ actors:["maya","leo","sam","kai","ines"], requirements:["mayaIn","leoIn","samOut","kaiOut","inesOut","dynamic"], predictions:["tom","bea","uma"],
      editable:["membership","assigned","clauses"], start:{ membership:"dynamic", assigned:[], clauses:[{ prop:"department", op:"-eq", value:"Sales", join:"and" }] }, leoDept:"Sales Operations" },
  3:{ actors:["maya","leo","sam","kai","ines","rui"], requirements:["mayaIn","leoIn","samOut","kaiOut","inesOut","ruiOut","dynamic"], predictions:["tom","bea","uma"],
      editable:["membership","assigned","clauses"], start:{ membership:"dynamic", assigned:[], clauses:[{ prop:"department", op:"-startsWith", value:"Sales", join:"and" }] }, leoDept:"Sales Operations" }
};
function person(id, run){ const p = Object.assign({ id, kind:"person", door:"sales" }, PEOPLE[id]); if (id === "leo" && run && V[run.level].leoDept) p.department = V[run.level].leoDept;
  p.logLine = `${p.department} · ${p.companyName} · ${p.userType}`; return p; }
/* Dynamic membership rule: string operators are case-insensitive; -and is evaluated before -or */
function clauseTrue(c, u){ const a = String(u[c.prop] || "").toLowerCase(), b = String(c.value || "").toLowerCase();
  return c.op === "-eq" ? a === b : c.op === "-ne" ? a !== b : c.op === "-startsWith" ? a.startsWith(b) : c.op === "-contains" ? a.includes(b) : false; }
function ruleTrue(clauses, u){ const groups = [[]]; clauses.forEach((c, i) => { if (i > 0 && c.join === "or") groups.push([]); groups[groups.length - 1].push(c); }); return groups.some(g => g.every(c => clauseTrue(c, u))); }
function ruleText(clauses){ return clauses.map((c, i) => (i ? ` -${c.join} ` : "") + `(${PROPS_[c.prop]} ${c.op} "${c.value}")`).join(""); }
function member(cfg, u){ return cfg.membership === "dynamic" ? ruleTrue(cfg.clauses, u) : cfg.assigned.includes(u.id); }
function outcome(cfg, u){
  const m = member(cfg, u);
  const why = cfg.membership === "dynamic" ? (m ? `The rule matches: ${u.department} · ${u.companyName} · ${u.userType}.` : `The rule doesn't match ${u.department} · ${u.companyName} · ${u.userType}.`)
    : (m ? "Added to the group by hand." : "Not on the hand-made member list.");
  return { outcome:m ? "in" : "out", label:m ? "Member · E3 licensed" : "Not a member", why:(m ? "Joined Sales Team: door opens and the group's E3 license applies. " : "Not in Sales Team: no door access, no license. ") + why, member:m };
}
const def = {
  id:"newhire", order:1, code:"MISSION 01", title:"New Hire Day", domain:"User identities", topic:"1.2",
  objectives:["1.2.1","1.2.2","1.2.6"], predictObjectives:["1.2.2","1.2.6"], predictionIds:["tom","bea","uma"], srcKeys:["dynamic"],
  pitch:"Maya starts in Sales today, but the Sales floor door won't open and she has no license.",
  objective:"Get the right people onto the Sales floor, licensed, without anyone adding them by hand.",
  startCoach:"Day one for Maya: the Sales floor door won't let her in.",
  sign:"badge",
  campus:{ console:{ title:"Directory kiosk", sub:"Groups · Sales Team" } },
  area:{ name:"HALCYON GARDENS", W:36, H:26, base:"grass", tint:0xfff1dc, bg:"#1b2a1e", laneY:14.6,
    fills:[["tan",0,11,36,3],["lav",20,15,9,4],[36,0,21,36,1],[36,16,14,4,1]],
    roads:[{ x:0, y:22, w:36, cross:[18] }],
    water:[[3,16,9,5]],
    buildings:[{ key:"eng", label:"Engineering", sign:"server", x:2, y:1, roof:"B", facade:"red" }, { key:"sales", label:"Sales floor", sign:"badge", x:14, y:1, roof:"C", facade:"orange" }, { key:"finance", label:"Finance", sign:"doc", x:26, y:1, roof:"A", facade:"red" }],
    props:[["tree",0.4,2],["tree",11.2,2],["tree",12.6,4],["tree",23.2,2],["tree",24.6,4],["tree",34.4,2],["lampG",10.6,8],["lampG",24.2,8],["autumn",0.8,16],["autumn",12.2,16.4],["tree2",1.2,19.4],
      ["flowers",12,9.8],["bench",6,15],["shelter",26,19],["lampB",35,19],["mailbox",9,21],["autumn2",33,9.6]],
    console:{ x:24.5, y:17.6 },
    tags:[{ x:30.5, y:18.6, title:"Arrivals", sub:"Bus stop · new starters", cls:"net" }, { x:7.5, y:15.6, title:"Halcyon Gardens", sub:"Campus park", cls:"office" }],
    exits:[{ edge:"east", at:[11,13], to:"gates", entry:"west", forward:true }],
    entries:{ start:[22,12.4], east:[34.6,12] } },
  terminal:"Groups › Sales Team", runLabel:"Apply membership", log:{ title:"Directory", sub:"Users who want the Sales floor", short:"Users" },
  inWord:"member", outWord:"not a member",
  firstTip:"<b>Sales Team</b> has a Microsoft 365 E3 license assigned to the group: every member gets it automatically. The door to the Sales floor also checks membership.",
  consoleCoach:"Sales Team is an <b>Assigned</b> group: someone has to add people by hand. Try <b>Dynamic User</b>.",
  watchCoach:"Watch the Sales floor door…", winStamp:"ONBOARDED",
  variants:V,
  reqText:{ mayaIn:"Maya joins Sales Team and gets her license", leoIn:"Leo keeps Sales floor access", samOut:"Sam (Marketing) isn't added", kaiOut:"Kai the contractor isn't licensed by Halcyon", inesOut:"Guest Ines isn't added", ruiOut:"Rui (Salesforce Platform, IT) isn't added", dynamic:"Future Sales hires join automatically" },
  newRun(level){ return { level, config:L.clone(V[level].start), actors:V[level].actors.slice(), requirements:V[level].requirements.slice(), bonus:[], tests:0, hints:0, phase:"play", xp:0, ui:{}, undo:[] }; },
  actor(id, run){ return person(id, run); },
  statics(){ return [{ id:"noor", name:"Noor Haddad", short:"Noor (HR)", initials:"NH", role:"HR onboarding lead", char:5, tint:0xffd6a8, pos:[27.6,16.6], facing:"down", kind:"person" }]; },
  staticEvidence(){ return { sub:"HR onboarding lead", rows:[["Says", "“Maya starts in Sales today. Everyone in a Sales department needs the Sales floor and an E3 license, and that includes Sales Operations.”", "information"],
    ["Also", "“Contractors get their licenses from their agency, and partner guests use their own company's licenses. Don't give them ours.”", "warning"], ["And", "“Please, no more adding people by hand. We hire every week.”", "menuList"]] }; },
  editable(run, path){ const k = path.split(".")[0]; return V[run.level].editable.includes(k); },
  editor(run, H){
    const c = run.config;
    let h = H.group("Properties", H.seg("membership", "Membership type", [["assigned","Assigned"],["dynamic","Dynamic User"]], c.membership) + H.info("Licenses", "Microsoft 365 E3 · assigned to this group (group-based licensing)"));
    if (c.membership === "assigned"){
      h += H.group("Members", H.checks("assigned", "Members (added by hand)", Object.keys(PEOPLE).filter(id => run.actors.includes(id)).map(id => [id, PEOPLE[id].name]), c.assigned, { note:"Every new hire has to be added here by someone." }));
    } else {
      const rows = c.clauses.map((cl, i) => `<div class="clause${H.hl("clauses")}">${i ? H.select(`clauses.${i}.join`, "", [["and","-and"],["or","-or"]], cl.join) : `<span class="cl0">Rule</span>`}
        ${H.select(`clauses.${i}.prop`, "", Object.keys(PROPS_).map(k => [k, PROPS_[k]]), cl.prop)}${H.select(`clauses.${i}.op`, "", OPS, cl.op)}${H.select(`clauses.${i}.value`, "", (VALUES[cl.prop] || []).map(v => [v, '"' + v + '"']), cl.value)}
        ${c.clauses.length > 1 ? H.btn("remove", "✕", i, { cls:"ghost" }) : ""}</div>`).join("");
      h += H.group("Dynamic membership rules", `<div class="rulebuilder">${rows}</div>${c.clauses.length < 4 ? H.btn("add", "+ Add expression") : ""}${H.code(ruleText(c.clauses))}<p class="note">String comparisons aren't case-sensitive. <code>-and</code> is evaluated before <code>-or</code>.</p>`);
    }
    return h;
  },
  action(run, act, arg){ const c = run.config.clauses;
    if (act === "add" && c.length < 4) c.push({ prop:"companyName", op:"-eq", value:"Halcyon Freight", join:"and" });
    if (act === "remove" && c.length > 1) c.splice(+arg, 1); },
  onEdit(run, path, v){
    const m = path.match(/^clauses\.(\d+)\.prop$/); if (m){ const cl = run.config.clauses[+m[1]]; if (!VALUES[cl.prop].includes(cl.value)) cl.value = VALUES[cl.prop][0]; }
    if (path === "membership" && v === "dynamic") return { key:"nh-dyn", text:"A dynamic group is managed by its rule: you <b>can't add or remove members by hand</b>." };
  },
  validate(run){ const c = run.config; return c.membership === "dynamic" && !c.clauses.length ? ["Add at least one rule expression."] : []; },
  simulate(run){
    const cfg = run.config, res = {}, ppl = {};
    run.actors.forEach(id => { ppl[id] = person(id, run); res[id] = outcome(cfg, ppl[id]); });
    const req = {}, ok = (id, want) => ({ ok:res[id].member === want, why:res[id].why });
    if (run.requirements.includes("mayaIn")) req.mayaIn = ok("maya", true);
    if (run.requirements.includes("leoIn")) req.leoIn = ok("leo", true);
    if (run.requirements.includes("samOut")) req.samOut = ok("sam", false);
    if (run.requirements.includes("kaiOut")) req.kaiOut = ok("kai", false);
    if (run.requirements.includes("inesOut")) req.inesOut = ok("ines", false);
    if (run.requirements.includes("ruiOut")) req.ruiOut = ok("rui", false);
    req.dynamic = { ok:cfg.membership === "dynamic", why:cfg.membership === "dynamic" ? "Membership is calculated from user attributes." : "Assigned membership: next week's hire waits for someone to remember." };
    return { res, req, bonus:{}, solved:run.requirements.every(k => req[k].ok) };
  },
  simulateOne(run, d){ return outcome(run.config, d); },
  onResult(scene, a, res){ if (res.outcome === "in" && !a.isPrediction) window.UI.floatText(a.sp.x, a.sp.y - 26, "E3 license ✓", "ok"); },
  evidence(d, run, res){ return { sub:d.role, rows:[["User", `${esc(d.name)} · ${esc(d.id)}@halcyonfreight.com${d.userType === "Guest" ? " <em>(#EXT# guest)</em>" : ""}`, "singleplayer"], ["Department", `<code>${esc(d.department)}</code>`, "menuList"],
    ["Company name", `<code>${esc(d.companyName)}</code>`, "home"], ["User type", `<code>${esc(d.userType)}</code>`, "information"], ["Note", esc(d.note || ""), "warning"],
    ...(res ? [["Sales Team", res.member ? '<span class="good">Member</span>' : '<span class="warn">Not a member</span>', "star"], ["License", res.member ? '<span class="good">Microsoft 365 E3 (inherited from group)</span>' : "None from Halcyon", "checkmark"]] : [])] }; },
  predictOptions:[["in","Joins Sales Team (door + E3 license)"],["out","Not a member (door stays shut)"]],
  predictActor(id, run){ return person(id, run); },
  predictTruth(res){ return res.outcome; },
  predictCard(d){ return `<b>${esc(d.name)}</b> · ${esc(d.role)}<br><span class="muted"><code>department</code> ${esc(d.department)} · <code>companyName</code> ${esc(d.companyName)} · <code>userType</code> ${esc(d.userType)}</span>`; },
  predictQuestion:"With <b>your</b> group settings, what happens?",
  predictComing(d){ return `Someone new walks up: <b>${esc(d.name)}</b>.`; },
  debrief(run, results){
    const c = run.config, base = V[run.level].start;
    const changed = c.membership !== base.membership ? `Membership type: ${base.membership === "assigned" ? "Assigned" : "Dynamic User"} → ${c.membership === "assigned" ? "Assigned" : "Dynamic User"}; rule: <code>${esc(ruleText(c.clauses))}</code>` : `Rule: <code>${esc(ruleText(base.clauses))}</code> → <code>${esc(ruleText(c.clauses))}</code>`;
    const ins = run.actors.filter(id => results.res[id].member).map(id => PEOPLE[id].short), outs = run.actors.filter(id => !results.res[id].member).map(id => PEOPLE[id].short);
    return [`<b>You changed</b> ${changed}.`, `<b>So</b> ${esc(ins.join(", "))} joined Sales Team and got E3 through group-based licensing. ${esc(outs.join(", "))} stayed out.`,
      `<b>Exam concept · SC-300 1.2.2 / 1.2.6</b> Dynamic membership rules evaluate user attributes (string matching isn't case-sensitive, and <code>-and</code> binds before <code>-or</code>). Members can't be added by hand, and a license assigned to the group follows membership automatically.`];
  },
  hints:{
    1:["Maya is brand new. Nobody added her to the group. What kind of group adds people on its own?", { highlight:["maya","membership"] }, "Set <b>Membership type</b> to <b>Dynamic User</b> and keep the rule <code>(user.department -eq \"Sales\")</code>. Every Sales user is added automatically, including Maya and next week's hires, and gets the group's E3 license through group-based licensing. Sam is in Marketing, so the rule leaves him out."],
    2:["Leo's department isn't exactly \"Sales\". Then look at Kai's company and Ines's user type.", { highlight:["leo","kai","ines","clauses"] }, "Use <code>(user.department -startsWith \"Sales\") -and (user.companyName -eq \"Halcyon Freight\")</code>. <code>-startsWith</code> picks up Sales Operations. The company check drops Kai (Brightwave) and the guest Ines (Lumen Logistics). <code>(user.userType -eq \"Member\")</code> also removes Ines, but not Kai."],
    3:["<code>-startsWith \"Sales\"</code> catches one team too many. Inspect Rui.", { highlight:["rui","clauses"] }, "Keep <code>(user.department -startsWith \"Sales\")</code>, then add <code>-and (user.department -ne \"Salesforce Platform\") -and (user.companyName -eq \"Halcyon Freight\")</code>. Because <code>-and</code> binds before <code>-or</code>, a version with <code>-or</code> needs every branch to repeat the company check."]
  },
  learnMore:`<p><b>Dynamic membership groups</b> calculate membership from user attributes. You can't add or remove members by hand. Rules combine expressions such as <code>(user.department -eq "Sales")</code> with <code>-and</code>, <code>-or</code> and <code>-not</code>. String operations aren't case-sensitive. Dynamic groups require Microsoft Entra ID P1.</p><p><b>Group-based licensing</b>: assign a license to a group, and every member gets it. When someone leaves the group, the license is removed.</p>`,
  simplifications:"Membership updates instantly here. In a real tenant, dynamic membership processing can take minutes to hours. The rule builder offers only a few properties and values, and the door stands for group-based access to the Sales floor's resources.",
  sources:[["Dynamic membership rules","https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership"],["Create or update a dynamic group","https://learn.microsoft.com/entra/identity/users/groups-create-rule"],["Assign licenses by group membership","https://learn.microsoft.com/entra/identity/users/licensing-groups-assign"]]
};
L.register(def);
})();
