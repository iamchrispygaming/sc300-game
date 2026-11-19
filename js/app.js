/* Identity Defender: game engine. Content lives in content-*.js files; this file holds logic only. */
(function () {
"use strict";
const C = window.ID_CONTENT;
const KEY = "identityDefender.v1";            // storage key kept from v1 so saved progress carries over
const SCHEMA = 3;
const LEVEL_TITLES = ["Junior Admin","Directory Operator","Access Engineer","Identity Analyst","Policy Architect","Identity Defender","Identity Defender II","Identity Defender III","Principal Defender","Legendary Defender"];
const XP = { brief:10, mainBase:30, mainBonus:[20,10,0], transferBase:15, transferBonus:[5,0,0], wrongFirst:5, retryMain:15, retryTransfer:8, reveal:5, debrief:25,
             practiceRight:15, practiceWrong:5, reviewDone:15, examRight:10, examDone:20, achievement:25 };
const METER_KEYS = [["sec","Security posture"],["acc","Legitimate access"],["ops","Admin effort saved"]];
const CONF = [["guess","Guessing"],["unsure","Fairly sure"],["sure","Certain"]];
/* ---------- Adaptive difficulty: tune the thresholds here ---------- */
const ADAPT = {
  window: 5,             // rolling window: the last N distinct, first-time challenges in a topic
  raiseAt: 4,            // clean first attempts (correct, no hints, not a guess) in the window to step up a level
  supportAt: 3,          // missed first attempts or hinted answers in the window that trigger more support
  minBetween: 3,         // new challenges in a topic between level changes (prevents constant switching)
  placementSize: 2,      // first challenges in a topic that set its starting level
  maxChainsPerRun: 2,    // support chains (worked example, simpler challenge, return challenge) per mission run
  maxChainsPerSession: 3,
  maxStretchPerRun: 2,   // deeper "stretch" challenges added to a mission run for topics above the mission's level
  supportClearAfter: 3,  // consecutive clean answers that switch off extra Beginner support
  levelUpXP: 20          // XP for a topic stepping up a level (XP never affects mastery)
};
const SPACED_DAYS = 7;   // a repeated scenario can serve as the later review only after this many days
const EXAM_MIX = { 1:0.2, 2:0.5, 3:0.3 };   // fixed difficulty mix for exam drills
const LEVEL_NAMES = ["", "Beginner", "Intermediate", "Advanced"];
const DOMAIN_SHORT = { D1:"User identities", D2:"Authentication & access", D3:"Workload identities", D4:"Identity governance", ALL:"All domains" };
let S = null, storageOk = true, clockTimer = null, examTimer = null, toastTimer = null, lastFocus = null;

/* ---------- Utilities ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const localDate = (d = new Date()) => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const addDays = n => { const d = new Date(); d.setDate(d.getDate()+n); return localDate(d); };
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const shuffle = a => { const b = a.slice(); for (let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const daysBetween = (a, b) => Math.round((new Date(b+"T12:00:00") - new Date(a+"T12:00:00")) / 86400000);
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };

/* ---------- Content normalization ---------- */
const OBJ = {}; const OBJ_LIST = [];
C.curriculum.forEach(d => d.groups.forEach(g => g.items.forEach(([id,t]) => { OBJ[id] = { id, text:t, domain:d.id, domainName:d.name, group:g.name }; OBJ_LIST.push(OBJ[id]); })));
const objText = id => (OBJ[id] ? OBJ[id].text : id);
const topicOf = objId => String(objId).split(".").slice(0,2).join(".");
const TOPICS = []; C.curriculum.forEach((d, di) => d.groups.forEach((g, gi) => TOPICS.push({ id:(di+1)+"."+(gi+1), name:g.name, domain:d.id })));
const TOPIC_BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const TOPIC_SHORT = { "1.1":"Tenant, roles & admin units", "1.2":"Users, groups, devices & licenses", "1.3":"External identities", "1.4":"Hybrid identity",
  "2.1":"User authentication", "2.2":"Conditional Access", "2.3":"ID Protection", "2.4":"Global Secure Access",
  "3.1":"Identities for workloads", "3.2":"Enterprise apps", "3.3":"App registrations", "3.4":"Defender for Cloud Apps",
  "4.1":"Entitlement management", "4.2":"Access reviews", "4.3":"Privileged access", "4.4":"Logs & monitoring" };
const topicName = t => TOPIC_SHORT[t] || (TOPIC_BY_ID[t] ? TOPIC_BY_ID[t].name : t);
const TOPIC_ITEMS = {};
function normOpt(x){
  let imp = x.impact;
  if (!imp && Array.isArray(x.i)) imp = { sec:x.i[0]||0, acc:x.i[1]||0, ops:x.i[2]||0 };
  return { id:x.id, text:x.text ?? x.t, correct:!!(x.correct || x.c), feedback:x.feedback ?? x.f ?? "", misconception:x.misconception ?? x.m ?? "", impact:imp || {}, consequence:x.consequence ?? x.x ?? "" };
}
function derange(ids){ const r = ids.slice().reverse(); if (r.length > 2){ r.push(r.shift()); } return r; }
const ITEMS = {}, ITEM_MISSION = {}, OBJ_ITEMS = {}, OBJ_MISSIONS = {};
Object.entries(C.items).forEach(([id, it]) => {
  const o = { id, kind:it.kind || "Scenario", type:it.type, title:it.title, objectives:it.objectives || it.obj || [], main:!!it.main,
    story:it.story || "", situation:it.situation ?? it.sit ?? "", teach:it.teach || "", evidence:it.evidence || it.ev || [],
    prompt:it.prompt ?? it.q ?? "", pick:it.pick || 1, hints:it.hints || [], explanation:it.explanation ?? it.exp ?? "",
    simplification:it.simplification ?? it.simp ?? "", sources:it.sources || it.src || [], mono:!!it.mono, groupName:it.groupName, impactAll:it.impact || null };
  if (it.options || it.opts) o.options = (it.options || it.opts).map(normOpt);
  if (it.fields) o.fields = it.fields.map(f => Object.assign({}, f, { options:f.options.map(normOpt) }));
  if (it.steps){ o.steps = it.steps.map(s => ({ id:s.id, text:s.t ?? s.text, why:s.w ?? s.why ?? "" })); o.start = it.start || derange(o.steps.map(s => s.id)); }
  o.domain = OBJ[o.objectives[0]] ? OBJ[o.objectives[0]].domain : "D1";
  o.topic = topicOf(o.objectives[0]); o.difficulty = it.difficulty || 2; o.bank = !!it.bank; o.warmup = !!it.warmup; o.lab = !!it.lab;
  ITEMS[id] = o;
  if (o.lab) return;   // workspace checks are tracked for evidence but never served as questions
  (TOPIC_ITEMS[o.topic] = TOPIC_ITEMS[o.topic] || []).push(id);
  o.objectives.forEach(ob => { (OBJ_ITEMS[ob] = OBJ_ITEMS[ob] || []).push(id); });
});
const OBJ_DEPTH = {}; Object.values(ITEMS).forEach(it => { if (it.difficulty >= 2) it.objectives.forEach(o => OBJ_DEPTH[o] = true); });
const MISSIONS = {}; const MISSION_ORDER = [];
C.campaign.forEach(d => { d.missions.forEach(m => MISSION_ORDER.push(m)); MISSION_ORDER.push(d.boss); });
MISSION_ORDER.push(C.finalBoss);
Object.values(C.missions).forEach(m => {
  const steps = [{ id:"brief", type:"brief", label:"Briefing" }];
  m.groups.forEach(g => g.items.forEach(id => { if (ITEMS[id]){ steps.push({ id, type:"item", group:g.n, label:ITEMS[id].title, role:ITEMS[id].warmup ? "warmup" : undefined }); ITEM_MISSION[id] = m.id; } }));
  steps.push({ id:"debrief", type:"debrief", label:"Debrief" });
  const objectives = [...new Set(steps.filter(s => s.type === "item").flatMap(s => ITEMS[s.id].objectives))].sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
  objectives.forEach(ob => { (OBJ_MISSIONS[ob] = OBJ_MISSIONS[ob] || new Set()).add(m.id); });
  MISSIONS[m.id] = Object.assign({}, m, { steps, objectives, meterBase: m.meterBase || { sec:50, acc:40, ops:40 } });
});
const meterLabel = (m, k) => (m && m.meterLabels && m.meterLabels[k]) || METER_KEYS.find(x => x[0] === k)[1];

/* ---------- State ---------- */
function defaultState(){
  return { schema:SCHEMA, appVersion:C.meta.version, createdAt:new Date().toISOString(), xp:0,
    profile:{ examDate:"", experience:"Not set (beginner defaults)", studyTime:"", sessionLength:"10–15 minutes", showStory:true, showClock:false, difficultyMode:"adaptive" },
    topics:{}, adaptLog:[], evidence:[], misconceptions:{}, reviews:{}, results:[], completed:{}, runs:{}, view:{ screen:"ops" }, session:null, lab:{ seen:{}, missions:{}, run:null, introduced:true },
    achievements:{}, days:[], stats:{ corrections:0, certainCorrect:0, reviews:0, exams:0 }, exams:[] };
}
function migrate(d){
  if (!d || typeof d !== "object") return null;
  if (d.schema === 1){
    const out = Object.assign({}, d, { schema:2, runs:{}, view:{ screen:"hub" } });
    if (d.run && d.run.missionId){ out.runs[d.run.missionId] = d.run; }
    delete out.run;
    Object.values(out.reviews || {}).forEach(r => { r.interval = r.interval || (/Spaced/.test(r.reason||"") ? 3 : 1); r.lastCorrect = !/Missed/.test(r.reason||""); });
    d = out;
  }
  if (d.schema === 2){
    d = Object.assign({}, d, { schema:SCHEMA });
    const seen = new Set();
    const lastSeenOn = {};
    (d.evidence || []).forEach(e => { e.indep = !seen.has(e.item); e.spaced = !e.indep && lastSeenOn[e.item] && daysBetween(lastSeenOn[e.item], e.date) >= SPACED_DAYS; seen.add(e.item); lastSeenOn[e.item] = e.date; });
    d.topics = null;   // rebuilt below from evidence
    Object.values(d.runs || {}).forEach(r => { if (!r.steps && MISSIONS[r.missionId]) r.steps = legacySteps(r.missionId); });
    if (d.session) d.session.meta = d.session.meta || {};
  }
  if (d.schema !== SCHEMA) return null;
  const b = defaultState(), out = Object.assign(b, d);
  out.profile = Object.assign(defaultState().profile, d.profile || {});
  out.stats = Object.assign(defaultState().stats, d.stats || {});
  ["evidence","results","days","exams"].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  ["misconceptions","reviews","completed","runs","achievements"].forEach(k => { if (!out[k] || typeof out[k] !== "object") out[k] = {}; });
  if (!out.adaptLog || !Array.isArray(out.adaptLog)) out.adaptLog = [];
  Object.keys(out.runs).forEach(k => { const r = out.runs[k];
    if (!MISSIONS[k] || !r || typeof r.step !== "number"){ delete out.runs[k]; return; }
    if (!Array.isArray(r.steps) || r.steps.some(s => s.type === "item" && !ITEMS[s.id])) r.steps = legacySteps(k);
    r.step = clamp(r.step, 0, r.steps.length - 1); r.maxStep = clamp(r.maxStep || 0, r.step, r.steps.length - 1);
    r.chains = r.chains || 0; r.stretch = r.stretch || 0; r.notices = r.notices || []; });
  if (!out.topics || typeof out.topics !== "object") out.topics = rebuildTopics(out.evidence);
  if (out.session) out.session.meta = out.session.meta || {};
  if (!out.lab || typeof out.lab !== "object" || !out.lab.missions) out.lab = { seen:{}, missions:{}, run:null };
  if (!d.lab || !d.lab.introduced){ out.lab = Object.assign({}, out.lab, { introduced:true }); if (!out.view || out.view.screen === "hub") out.view = { screen:"ops" }; }
  if (out.lab.run && (!window.ID_LAB || !window.ID_LAB.missions[out.lab.run.mission] || !out.lab.run.policies)) out.lab.run = null;
  if (out.lab.run){ out.lab.run.animating = false; }
  if (!out.view || !["ops","hub","mission","session"].includes(out.view.screen)) out.view = { screen:"ops" };
  if (out.view.screen === "mission" && !out.runs[out.view.missionId]) out.view = { screen:"hub" };
  if (out.session && (!Array.isArray(out.session.queue) || out.session.queue.some(id => !ITEMS[id]))) out.session = null;
  if (out.view.screen === "session" && !out.session) out.view = { screen:"hub" };
  return out;
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; } catch(e){ storageOk = false; } setSaveStatus(); }
function load(){ try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch(e){ storageOk = false; } return null; }
function setSaveStatus(){
  const el = $("#savestatus"); if (!el) return;
  el.textContent = storageOk ? "Progress saves in this browser automatically. Use Progress › Export for a backup or to move devices."
                             : "Browser storage isn't available here, so progress lasts only while this page is open. Use Progress › Export to keep it.";
}
function markDay(){ const t = localDate(); if (!S.days.includes(t)) S.days.push(t); if (S.days.length > 400) S.days = S.days.slice(-400); }

/* ---------- Context: mission run or practice/exam session ---------- */
function newRun(mid){
  return { missionId:mid, runId:Date.now().toString(36), step:0, maxStep:0, items:{}, startedAt:Date.now(), xpStart:S.xp,
    replay:(S.completed[mid]||0) > 0, briefDone:false, finalized:false, finishedAt:null,
    steps:MISSIONS[mid].steps.map(s => Object.assign({}, s)), chains:0, stretch:0, notices:[] };
}
/* Runs saved before warm-ups existed keep their original step list so saved positions stay valid. */
function legacySteps(mid){ return MISSIONS[mid].steps.filter(s => !(s.type === "item" && ITEMS[s.id].warmup)).map(s => Object.assign({}, s)); }
function rebuildTopics(evidence){
  const keep = S; const tmp = { topics:{}, adaptLog:[] }; S = tmp;
  (evidence || []).forEach(e => { if (e.indep !== false && ITEMS[e.item]) adaptRecord(e.item, e.correct, e.hints || 0, e.conf, e.source || "mission", true); });
  S = keep; return tmp.topics;
}
const RUN = () => S.view.screen === "mission" ? S.runs[S.view.missionId] : null;
const MIS = () => S.view.screen === "mission" ? MISSIONS[S.view.missionId] : null;
const curStep = () => RUN().steps[RUN().step];
const curRole = () => { if (S.view.screen === "mission"){ const st = curStep(); return st.role || null; } if (S.view.screen === "session" && S.session.meta){ const m = S.session.meta[S.session.queue[S.session.idx]]; return m ? m.role : null; } return null; };
function itemStateMap(){ if (S.view.screen === "mission") return RUN().items; if (S.view.screen === "session") return S.session.items; return {}; }
function IS(id, map){
  map = map || itemStateMap();
  if (!map[id]){
    map[id] = { sel:[], fields:{}, order:null, touched:false, hints:0, attempts:0, conf:null, status:"open", firstCorrect:null, xp:0, lastEval:null, lastImpact:null, revealedXP:false, wrongXP:false };
    if (ITEMS[id].type === "order") map[id].order = ITEMS[id].start.slice();
  }
  return map[id];
}
function mode(){ if (S.view.screen === "ops") return "ops"; if (S.view.screen === "mission") return "learn"; if (S.view.screen === "session") return S.session.kind === "exam" ? "exam" : "practice"; return "hub"; }
function currentItemId(){
  if (S.view.screen === "mission"){ const st = curStep(); return st.type === "item" ? st.id : null; }
  if (S.view.screen === "session" && !S.session.finished) return S.session.queue[S.session.idx];
  return null;
}

/* ---------- XP, achievements ---------- */
/* Each level needs 50 XP more than the last (100, 150, 200, ...), so a full campaign lands around level 15. */
function level(xp){ let n = 1, base = 0, need = 100; while (xp >= base + need){ base += need; n++; need = 100 + (n-1)*50; }
  return { n, title:LEVEL_TITLES[Math.min(Math.floor((n-1)/2), LEVEL_TITLES.length-1)], into:xp-base, need, pct:Math.round(100*(xp-base)/need) }; }
function award(n, reason, st, noMul){
  const run = RUN();
  const mul = (!noMul && run && run.replay) ? 0.5 : 1;
  const v = Math.round(n * mul);
  if (v <= 0) return 0;
  S.xp += v; if (st) st.xp += v;
  toast("+"+v+" XP · "+reason+(mul < 1 ? " (replay rate)" : ""));
  renderTop();
  return v;
}
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400); }
function touchedObjectives(){ return new Set(S.evidence.flatMap(e => e.obj)); }
function checkAchievements(){
  const done = id => (S.completed[id]||0) > 0;
  const touched = touchedObjectives();
  const domainsTouched = new Set([...touched].map(o => OBJ[o] && OBJ[o].domain));
  const cond = {
    "first-mission": () => Object.values(S.completed).some(v => v > 0),
    "domain-D1": () => C.campaign[0].missions.every(done), "domain-D2": () => C.campaign[1].missions.every(done),
    "domain-D3": () => C.campaign[2].missions.every(done), "domain-D4": () => C.campaign[3].missions.every(done),
    "boss": () => C.campaign.some(d => done(d.boss)) || done(C.finalBoss), "final": () => done(C.finalBoss),
    "comeback": () => S.stats.corrections >= 5, "calibrated": () => S.stats.certainCorrect >= 10,
    "explorer": () => ["D1","D2","D3","D4"].every(d => domainsTouched.has(d)), "coverage": () => OBJ_LIST.every(o => touched.has(o.id)),
    "review": () => S.stats.reviews >= 1, "exam": () => S.stats.exams >= 1,
    "exam80": () => S.exams.some(e => e.total >= 20 && e.pct >= 80), "streak3": () => S.days.length >= 3
  };
  C.achievements.forEach(a => {
    if (!S.achievements[a.id] && cond[a.id] && cond[a.id]()){
      S.achievements[a.id] = localDate();
      setTimeout(() => { award(XP.achievement, "Achievement: "+a.title, null, true); save(); if (S.view.screen === "hub") renderRail(); }, 900);
    }
  });
}

/* ---------- Mastery ---------- */
function statusFor(objId){
  const ev = S.evidence.filter(e => e.obj.includes(objId));
  if (!ev.length) return "Not started";
  const last = ev[ev.length-1];
  if (!last.correct) return "Needs review";
  // Mastery needs independent evidence: first-time, clean answers to distinct scenarios on 2+ days
  // (the later day is the review), including real depth where the objective has deeper questions.
  const clean = ev.filter(e => e.correct && e.hints === 0 && e.conf !== "guess");
  const fresh = clean.filter(e => e.indep !== false);                       // first-time encounters only
  const items = new Set(fresh.map(e => e.item));
  const depthOk = !OBJ_DEPTH[objId] || fresh.some(e => ITEMS[e.item] && ITEMS[e.item].difficulty >= 2);
  if (items.size < 2 || !depthOk) return "Learning";
  // Later review: a clean answer on a later day than the first fresh success, either a new scenario
  // or a scenario last seen at least SPACED_DAYS earlier (retention, not short-term memory).
  const firstDay = fresh.map(e => e.date).sort()[0];
  return clean.some(e => e.date > firstDay && (e.indep !== false || e.spaced)) ? "Demonstrated" : "Learning";
}
const pillClass = s => ({ "Learning":"s-learning", "Needs review":"s-review", "Demonstrated":"s-demo" }[s] || "");
const pill = s => `<span class="pill ${pillClass(s)}">${esc(s)}</span>`;
function recordEvidence(id, correct, hints, conf, source){
  const item = ITEMS[id];
  let prev = null; for (let i = S.evidence.length - 1; i >= 0; i--) if (S.evidence[i].item === id){ prev = S.evidence[i].date; break; }
  const indep = prev === null;   // repeats are practice, not new evidence of understanding
  const spaced = !indep && daysBetween(prev, localDate()) >= SPACED_DAYS;
  S.evidence.push({ item:id, mission:ITEM_MISSION[id] || null, source, obj:item.objectives.slice(), correct, hints, conf, date:localDate(), indep, spaced });
  lastAdapt = indep ? adaptRecord(id, correct, hints, conf, source) : null;
  if (S.evidence.length > 5000) S.evidence = S.evidence.slice(-5000);
  const clean = correct && hints === 0 && conf !== "guess";
  if (!item.lab) schedule(id, clean, correct);
  if (correct && conf === "sure") S.stats.certainCorrect++;
  markDay();
}
function schedule(id, clean, correct){
  const prev = S.reviews[id] || { interval:0 }, item = ITEMS[id];
  const interval = clean ? (prev.interval >= 3 && prev.lastCorrect ? Math.round(prev.interval * 2.5) : 3) : 1;
  S.reviews[id] = { due:addDays(interval), interval, title:item.title, mission:ITEM_MISSION[id] || null, objectives:item.objectives,
    lastCorrect:correct, reason: clean ? "Spaced review" : (correct ? "Correct, but with a hint or a guess" : "Missed on first try") };
}
function logMisconceptions(item, st){
  chosenOptions(item, st).filter(o => !o.correct && o.misconception).forEach(o => {
    const m = S.misconceptions[o.misconception] || { count:0, item:item.id, objectives:item.objectives };
    m.count++; m.last = localDate(); S.misconceptions[o.misconception] = m;
  });
}
const dueReviews = () => Object.entries(S.reviews).filter(([id, r]) => ITEMS[id] && !ITEMS[id].lab && r.due <= localDate());
function lastSeen(id){ for (let i = S.evidence.length-1; i >= 0; i--) if (S.evidence[i].item === id) return S.evidence[i].date; return ""; }
function siblings(id){
  const item = ITEMS[id];
  const score = {};
  item.objectives.forEach(o => (OBJ_ITEMS[o] || []).forEach(x => { if (x !== id) score[x] = (score[x]||0) + 1; }));
  return Object.keys(score).sort((a,b) => (score[b]-score[a]) || lastSeen(a).localeCompare(lastSeen(b)));
}

/* ---------- Adaptive engine ---------- */
let lastAdapt = null;
function topicState(t){ return S.topics[t] || (S.topics[t] = { level:1, placed:false, history:[], since:0, support:false, streak:0, changes:[] }); }
const adaptiveOn = () => S.profile.difficultyMode === "adaptive";
function targetLevel(t){ return adaptiveOn() ? topicState(t).level : (+S.profile.difficultyMode || 2); }
function logAdapt(t, text){ S.adaptLog.push({ date:localDate(), topic:t, text }); if (S.adaptLog.length > 40) S.adaptLog = S.adaptLog.slice(-40); }
/* Called once per distinct, first-time challenge. Returns a short notice when the topic's level changes. */
function adaptRecord(id, correct, hints, conf, source, quiet){
  const item = ITEMS[id], t = item.topic, T = topicState(t), d = item.difficulty;
  const clean = !!correct && !hints && conf !== "guess", struggle = !correct || hints > 0;
  T.history.push({ item:id, d, clean, struggle, src:source, date:localDate() });
  if (T.history.length > 30) T.history = T.history.slice(-30);
  T.since++; T.streak = clean ? T.streak + 1 : 0; T.lastDate = localDate();
  const change = (to, why) => { T.changes.push({ date:localDate(), from:T.level, to, why }); if (T.changes.length > 20) T.changes = T.changes.slice(-20); T.level = to; T.since = 0; };
  let notice = null;
  if (!T.placed){
    if (T.history.length >= ADAPT.placementSize){
      T.placed = true; T.since = 0;
      const start = T.history.slice(-ADAPT.placementSize).every(e => e.clean) ? 2 : 1;
      if (start !== T.level) change(start, "placement");
      if (start === 2) notice = { kind:"up", text:`Let's build on that: ${topicName(t)} starts at Intermediate.` };
    }
  } else {
    const win = T.history.slice(-ADAPT.window);
    const raise = win.filter(e => e.clean && e.d >= T.level).length;      // clean answers at or above the current level
    const strug = win.filter(e => e.struggle && e.d <= T.level).length;   // misses or hints at or below it
    if (T.since >= ADAPT.minBetween && raise >= ADAPT.raiseAt && T.level < 3){
      change(T.level + 1, "strong"); T.support = false;
      notice = { kind:"up", text:`Let's build on that: ${topicName(t)} challenges move up to ${LEVEL_NAMES[T.level]}.` };
    } else if (T.since >= ADAPT.minBetween && strug >= ADAPT.supportAt){
      if (T.level > 1){ change(T.level - 1, "support"); notice = { kind:"support", text:`Let's practice ${topicName(t)} another way: more guided ${LEVEL_NAMES[T.level]} challenges for a bit.` }; }
      else if (!T.support){ T.support = true; T.since = 0; notice = { kind:"support", text:`Let's practice ${topicName(t)} another way: worked examples are switched on for this topic.` }; }
    }
    if (T.support && T.streak >= ADAPT.supportClearAfter) T.support = false;
  }
  if (notice){ logAdapt(t, notice.text); if (!quiet && notice.kind === "up" && T.changes.length && T.changes[T.changes.length-1].why === "strong") setTimeout(() => { award(ADAPT.levelUpXP, "Topic stepped up", null, true); save(); }, 600); }
  return notice;
}
function strengthOf(t){
  const h = (S.topics[t] && S.topics[t].history || []).slice(-8);
  if (!h.length) return null;
  return Math.round(100 * h.filter(e => e.clean).length / h.length);
}
const strengthLabel = v => v === null ? "Not started" : v >= 75 ? "Strong" : v >= 50 ? "Steady" : "Building";
function recommendedTopics(k){
  return TOPICS.map(t => { const T = S.topics[t.id], v = strengthOf(t.id), touched = OBJ_LIST.filter(o => topicOf(o.id) === t.id && S.evidence.some(e => e.obj.includes(o.id))).length;
      const total = OBJ_LIST.filter(o => topicOf(o.id) === t.id).length;
      const score = (T && T.support ? 0 : 10) + (v === null ? 20 : v / 5) + 10 * touched / total; return { id:t.id, score }; })
    .sort((a,b) => a.score - b.score).slice(0, k || 3).map(x => x.id);
}
/* Choose a distinct scenario in a topic near a target level. Prefers unseen items, the given objectives, and training-bank items. */
function pickItem(t, level, opts){
  opts = opts || {};
  const seen = new Set(S.evidence.map(e => e.item)), ex = opts.exclude || new Set(), pref = new Set(opts.preferObjs || []);
  const curMission = S.view.screen === "mission" ? S.view.missionId : null;
  const later = id => ITEM_MISSION[id] && !S.completed[ITEM_MISSION[id]] && ITEM_MISSION[id] !== curMission;
  let best = null, bestScore = 1e9;
  (TOPIC_ITEMS[t] || []).forEach(id => {
    if (ex.has(id) || ITEMS[id].warmup && opts.noWarmup) return;
    const it = ITEMS[id];
    if (opts.minLevel && it.difficulty < opts.minLevel) return;
    if (opts.maxLevel && it.difficulty > opts.maxLevel) return;
    if (opts.unseenOnly && seen.has(id)) return;
    const sc = Math.abs(it.difficulty - level) * 10 + (seen.has(id) ? 6 : 0) + (it.objectives.some(o => pref.has(o)) ? 0 : 3)
      + (opts.inMission && later(id) ? 4 : 0) + (it.bank ? 0 : 1) + Math.random();
    if (sc < bestScore){ bestScore = sc; best = id; }
  });
  return best;
}
/* After a first attempt, decide whether to add a support, return or stretch challenge. Returns {id, role, text} or null. */
function planFollowUp(id, ev, st, role, used, budget){
  if (!adaptiveOn()) return null;
  const item = ITEMS[id], t = item.topic, T = topicState(t), clean = ev.correct && st.hints === 0 && st.conf !== "guess";
  if (!ev.correct && role !== "support" && role !== "return" && budget.chains > 0){
    const sup = pickItem(t, Math.max(1, item.difficulty - 1), { exclude:used, preferObjs:item.objectives, maxLevel:Math.max(1, item.difficulty - 1), inMission:budget.inMission, noWarmup:true });
    if (sup) return { id:sup, role:"support", forItem:id, origLevel:item.difficulty, text:"Let's practice this concept another way. A short worked example and a related challenge are next." };
  }
  if (role === "support"){
    if (ev.correct){
      const ret = pickItem(t, budget.origLevel || item.difficulty + 1, { exclude:used, preferObjs:ITEMS[budget.forItem] ? ITEMS[budget.forItem].objectives : item.objectives, minLevel:budget.origLevel || 1, inMission:budget.inMission, noWarmup:true });
      if (ret) return { id:ret, role:"return", forItem:budget.forItem, text:`Nice. Next, a new ${LEVEL_NAMES[ITEMS[ret].difficulty]} scenario on the same idea.` };
    }
    return null;
  }
  if (clean && role !== "support" && budget.stretch > 0 && T.placed && T.level > item.difficulty){
    const str = pickItem(t, T.level, { exclude:used, minLevel:T.level, unseenOnly:true, inMission:budget.inMission, noWarmup:true });
    if (str) return { id:str, role:"stretch", forItem:id, text:"Let's build on that: a deeper challenge on this topic is next." };
  }
  return null;
}
const ROLE_LABEL = { support:"Support challenge", "return":"Back to your level", stretch:"Stretch challenge", warmup:"Warm-up", review:"Review" };

/* ---------- Evaluation ---------- */
function activeFields(item, st){ return item.fields.filter(f => !f.showIf || f.showIf.in.includes(st.fields[f.showIf.field])); }
function evaluate(item, st){
  if (item.type === "config"){
    const fields = {}; let ok = true;
    for (const f of activeFields(item, st)){ const o = f.options.find(x => x.id === st.fields[f.id]); fields[f.id] = !!(o && o.correct); if (!fields[f.id]) ok = false; }
    return { correct:ok, fields };
  }
  if (item.type === "order"){
    const want = item.steps.map(s => s.id);
    const pos = st.order.map((id, i) => id === want[i]);
    return { correct:pos.every(Boolean), pos, right:pos.filter(Boolean).length };
  }
  const want = item.options.filter(o => o.correct).map(o => o.id).sort().join(",");
  return { correct: want === [...st.sel].sort().join(",") };
}
function chosenOptions(item, st){
  if (item.type === "config") return activeFields(item, st).map(f => f.options.find(o => o.id === st.fields[f.id])).filter(Boolean);
  if (item.type === "order") return [];
  return item.options.filter(o => st.sel.includes(o.id));
}
function impactOf(item, st, ev){
  const sum = { sec:0, acc:0, ops:0 };
  if (item.type === "order"){ const src = item.impactAll ? (ev && ev.correct ? item.impactAll.correct : item.impactAll.wrong) : null; if (src) for (const k in src) sum[k] += src[k]; return sum; }
  chosenOptions(item, st).forEach(o => { for (const k in o.impact) sum[k] += o.impact[k]; });
  return sum;
}
function answerComplete(item, st){
  if (item.type === "config") return activeFields(item, st).every(f => st.fields[f.id]);
  if (item.type === "multi") return st.sel.length === item.pick;
  if (item.type === "order") return !!st.order;
  return st.sel.length === 1;
}
function canSubmit(item, st){ return st.status === "open" && answerComplete(item, st) && (st.attempts > 0 || !!st.conf); }
function submitReason(item, st){
  const need = [];
  if (!answerComplete(item, st)){
    if (item.type === "config") need.push("choose every setting");
    else if (item.type === "multi") need.push("select exactly "+item.pick+" options ("+st.sel.length+" selected)");
    else need.push("choose an option");
  }
  if (st.attempts === 0 && !st.conf) need.push("rate your confidence");
  return need.length ? "To submit: "+need.join(" and ")+"." : "";
}
function meters(){
  const m = MIS(), r = RUN(), out = Object.assign({}, m.meterBase);
  r.steps.forEach(s => { const st = s.type === "item" && r.items[s.id]; if (st && st.lastImpact) for (const k in st.lastImpact) out[k] += st.lastImpact[k]; });
  for (const k in out) out[k] = clamp(out[k], 0, 100);
  return out;
}

/* ---------- Actions: answering ---------- */
function submit(){
  const id = currentItemId(); if (!id) return;
  const item = ITEMS[id], st = IS(id), md = mode();
  if (md === "exam" || !canSubmit(item, st)) return;
  st.attempts++;
  const ev = evaluate(item, st); st.lastEval = ev;
  if (md === "learn" && item.main) st.lastImpact = impactOf(item, st, ev);
  if (st.attempts === 1){
    st.firstCorrect = ev.correct;
    recordEvidence(id, ev.correct, st.hints, st.conf, md === "learn" ? "mission" : S.session.kind);
    st.repeat = !S.evidence[S.evidence.length-1].indep;
    st.notice = lastAdapt ? lastAdapt.text : null;
    // Adaptive follow-up: support after a miss, a new scenario at the original level after support, or a stretch after a clean answer
    if (md === "learn"){
      const r = RUN(), step = curStep();
      const used = new Set(r.steps.filter(x => x.type === "item").map(x => x.id));
      const f = planFollowUp(id, ev, st, step.role, used, { chains:ADAPT.maxChainsPerRun - r.chains, stretch:ADAPT.maxStretchPerRun - r.stretch, inMission:true, forItem:step.forItem, origLevel:step.origLevel });
      if (f){
        r.steps.splice(r.step + 1, 0, { id:f.id, type:"item", group:step.group, label:ITEMS[f.id].title, role:f.role, forItem:f.forItem, origLevel:f.origLevel });
        if (f.role === "support") r.chains++; if (f.role === "stretch") r.stretch++;
        st.followUp = f.text; r.notices.push(f.text);
      } else if (step.role === "support" && !ev.correct) st.followUp = "We'll come back to this idea in a later review, with a fresh scenario.";
      if (st.notice) r.notices.push(st.notice);
    } else if (S.session.kind !== "exam"){
      const s = S.session, meta = s.meta[id] || {};
      // Exclude what's already been answered; a suitable question queued for later can be pulled forward.
      const used = new Set(s.queue.slice(0, s.idx + 1));
      const f = planFollowUp(id, ev, st, meta.role, used, { chains:ADAPT.maxChainsPerSession - (s.chains||0), stretch:0, inMission:false, forItem:meta.forItem, origLevel:meta.origLevel });
      if (f){ const later = s.queue.indexOf(f.id, s.idx + 1); if (later > -1) s.queue.splice(later, 1); s.queue.splice(s.idx + 1, 0, f.id); s.meta[f.id] = { role:f.role, forItem:f.forItem, origLevel:f.origLevel }; if (f.role === "support") s.chains = (s.chains||0) + 1; st.followUp = f.text; }
      else if (meta.role === "support" && !ev.correct) st.followUp = "We'll come back to this idea in a later review, with a fresh scenario.";
    }
    if (md !== "learn" && S.session.reviewFor && S.session.reviewFor[id] && S.session.reviewFor[id] !== id){
      const orig = S.session.reviewFor[id]; schedule(orig, ev.correct && st.conf !== "guess", ev.correct);
    }
  }
  if (!ev.correct) logMisconceptions(item, st);
  if (md === "learn"){
    if (ev.correct){
      st.status = "solved";
      if (st.attempts === 1){
        const base = item.main ? XP.mainBase : XP.transferBase, bonus = (item.main ? XP.mainBonus : XP.transferBonus)[Math.min(st.hints, 2)];
        award(base + bonus, st.hints ? "Correct with hint" : "Correct, first try", st);
      } else { award(item.main ? XP.retryMain : XP.retryTransfer, "Corrected after feedback", st); S.stats.corrections++; }
    } else {
      st.status = "wrong";
      if (!st.wrongXP){ st.wrongXP = true; award(XP.wrongFirst, "Learning from a miss", st); }
    }
  } else {
    st.status = ev.correct ? "solved" : "missed";
    const base = ev.correct ? XP.practiceRight : XP.practiceWrong;
    award(st.repeat ? Math.ceil(base / 2) : base, (ev.correct ? "Correct" : "Reviewed the explanation") + (st.repeat ? " (repeat)" : ""), st);
  }
  checkAchievements(); save(); renderAll(); focusFeedback();
}
function retry(){ const st = IS(currentItemId()); st.status = "open"; save(); renderCase(); const f = $("#case .opt input:not(:disabled), #case .seqbtns button:not(:disabled)"); if (f) f.focus(); }
function reveal(){
  const id = currentItemId(), item = ITEMS[id], st = IS(id);
  st.status = "revealed";
  if (item.type === "config") item.fields.forEach(f => { const c = f.options.find(o => o.correct); if (c) st.fields[f.id] = c.id; });
  else if (item.type === "order") st.order = item.steps.map(s => s.id);
  else st.sel = item.options.filter(o => o.correct).map(o => o.id);
  st.lastEval = evaluate(item, st);
  if (item.main) st.lastImpact = impactOf(item, st, st.lastEval);
  if (!st.revealedXP){ st.revealedXP = true; award(XP.reveal, "Studied the solution", st); }
  save(); renderAll(); focusFeedback();
}
function hint(){
  const id = currentItemId(), item = ITEMS[id], st = IS(id);
  if (mode() !== "learn" || st.hints >= item.hints.length || st.status === "solved" || st.status === "revealed") return;
  st.hints++; save(); renderCase();
  const h = $("#case .hints li:last-child"); if (h){ h.setAttribute("tabindex","-1"); h.focus(); }
}
function moveStep(t){
  const id = currentItemId(), st = IS(id), md = mode();
  if (!(st.status === "open" || md === "exam")) return;
  const sid = t.dataset.id, dir = +t.dataset.dir, i = st.order.indexOf(sid), j = i + dir;
  if (j < 0 || j >= st.order.length) return;
  [st.order[i], st.order[j]] = [st.order[j], st.order[i]]; st.touched = true;
  save(); renderCase();
  const btn = $(`#case [data-action=move][data-id="${sid}"][data-dir="${dir}"]`) || $(`#case [data-action=move][data-id="${sid}"]:not(:disabled)`);
  if (btn) btn.focus();
}

/* ---------- Actions: navigation ---------- */
function openHub(){ S.view = { screen:"hub" }; save(); renderAll(); focusTitle(); }
function openOps(){ S.view = { screen:"ops" }; markDay(); save(); renderAll(); focusTitle(); }
function openMission(mid, fresh){
  if (!MISSIONS[mid]) return;
  const r = S.runs[mid];
  if (fresh || !r || r.finalized) S.runs[mid] = newRun(mid);
  S.view = { screen:"mission", missionId:mid }; markDay(); save(); renderAll(); focusTitle();
}
function goStep(idx){ const r = RUN(); if (idx < 0 || idx > r.maxStep || idx >= r.steps.length) return; r.step = idx; save(); renderAll(); focusTitle(); }
function nextStep(){
  const r = RUN(), m = MIS();
  if (curStep().type === "brief" && !r.briefDone){ r.briefDone = true; award(XP.brief, "Briefing read"); }
  r.step = Math.min(r.step + 1, r.steps.length - 1); r.maxStep = Math.max(r.maxStep, r.step);
  if (curStep().type === "debrief" && !r.finalized) finalizeRun();
  save(); renderAll(); focusTitle();
}
function finalizeRun(){
  const r = RUN(), m = MIS();
  r.finalized = true; r.finishedAt = Date.now();
  award(XP.debrief, "Mission debrief");
  const items = r.steps.filter(s => s.type === "item" && !s.role).map(s => r.items[s.id] || {});
  S.results.push({ mission:m.id, date:localDate(), replay:r.replay, xp:S.xp - r.xpStart, firstTry:items.filter(i => i.firstCorrect).length, total:items.length,
    hints:items.reduce((a,i) => a + (i.hints||0), 0), minutes:Math.max(1, Math.round((r.finishedAt - r.startedAt)/60000)) });
  if (S.results.length > 60) S.results = S.results.slice(-60);
  S.completed[m.id] = (S.completed[m.id]||0) + 1;
  checkAchievements();
}
function replayMission(){ const mid = S.view.missionId; S.runs[mid] = newRun(mid); save(); renderAll(); focusTitle(); toast("Mission restarted. Earned XP and mastery records are kept."); }

/* ---------- Practice, review and exam sessions ---------- */
function buildReview(limit, inScope){
  inScope = inScope || (() => true);
  const due = dueReviews().filter(([id]) => inScope(ITEMS[id].topic)).sort((a,b) => (a[1].lastCorrect?1:0) - (b[1].lastCorrect?1:0) || a[1].due.localeCompare(b[1].due));
  const used = new Set(), queue = [], reviewFor = {}, meta = {};
  for (const [id] of due){
    if (queue.length >= limit) break;
    const it = ITEMS[id];
    // A different scenario on the same objectives, at the topic's current level; the same item only as a last resort
    const pick = pickItem(it.topic, targetLevel(it.topic), { exclude:new Set([...used, id]), preferObjs:it.objectives }) || (used.has(id) || ITEMS[id].lab ? null : id);
    if (!pick || used.has(pick)) continue;
    used.add(pick); queue.push(pick); reviewFor[pick] = id; meta[pick] = { role:"review", forItem:id };
  }
  return { queue, reviewFor, meta };
}
function buildPractice(domain, n, topic){
  const inScope = t => topic ? t === topic : (domain === "ALL" || TOPIC_BY_ID[t].domain === domain);
  const r = buildReview(topic ? 2 : 3, inScope);
  const used = new Set(r.queue), queue = r.queue.slice(), meta = Object.assign({}, r.meta);
  const add = (id, role) => { if (id && !used.has(id)){ used.add(id); queue.push(id); if (role) meta[id] = { role }; return true; } return false; };
  const scoped = TOPICS.filter(t => inScope(t.id));
  // Topics that asked for support first, then broad coverage: least recently practised and least covered topics, one item each per round
  scoped.filter(t => S.topics[t.id] && S.topics[t.id].support).slice(0, 2).forEach(t => add(pickItem(t.id, targetLevel(t.id), { exclude:used })));
  const untouched = t => OBJ_LIST.filter(o => topicOf(o.id) === t && !S.evidence.some(e => e.obj.includes(o.id))).map(o => o.id);
  const order = scoped.slice().sort((a,b) => ((S.topics[a.id]||{}).lastDate || "").localeCompare((S.topics[b.id]||{}).lastDate || "") || untouched(b.id).length - untouched(a.id).length);
  let guard = 0;
  while (queue.length < n && guard++ < 6){
    let added = false;
    for (const t of order){ if (queue.length >= n) break; if (add(pickItem(t.id, targetLevel(t.id), { exclude:used, preferObjs:untouched(t.id) }))) added = true; }
    if (!added) break;
  }
  const head = queue.slice(0, r.queue.length), rest = shuffle(queue.slice(r.queue.length));
  return { queue:shuffle(head.concat(rest)), reviewFor:r.reviewFor, meta };
}
/* Exam drills keep a fixed difficulty and topic mix regardless of your levels. */
function buildExam(n){
  const w = C.examWeights, keys = Object.keys(w), total = keys.reduce((a,k) => a + w[k], 0);
  const counts = {}; let sum = 0;
  keys.forEach(k => { counts[k] = Math.floor(n * w[k] / total); sum += counts[k]; });
  keys.slice().sort((a,b) => w[b]-w[a]).forEach(k => { if (sum < n){ counts[k]++; sum++; } });
  const queue = [];
  keys.forEach(k => {
    const quota = { 1:Math.round(counts[k]*EXAM_MIX[1]), 3:Math.round(counts[k]*EXAM_MIX[3]) }; quota[2] = counts[k] - quota[1] - quota[3];
    const picked = [];
    [3,2,1].forEach(d => {
      const byTopic = {}; shuffle(Object.keys(ITEMS).filter(id => ITEMS[id].domain === k && ITEMS[id].difficulty === d && !ITEMS[id].warmup && !ITEMS[id].lab)).forEach(id => (byTopic[ITEMS[id].topic] = byTopic[ITEMS[id].topic] || []).push(id));
      const ts = shuffle(Object.keys(byTopic)); let i = 0, guard = 0;
      while (picked.filter(id => ITEMS[id].difficulty === d).length < quota[d] && guard++ < 200){ const list = byTopic[ts[i % ts.length]]; if (list && list.length) picked.push(list.shift()); i++; if (ts.every(t => !byTopic[t].length)) break; }
    });
    const pool = shuffle(Object.keys(ITEMS).filter(id => ITEMS[id].domain === k && !picked.includes(id) && !ITEMS[id].warmup && !ITEMS[id].lab));
    while (picked.length < counts[k] && pool.length) picked.push(pool.shift());
    queue.push(...picked);
  });
  return shuffle(queue);
}
function startSession(kind, opts){
  opts = opts || {};
  let queue = [], reviewFor = {}, meta = {};
  if (kind === "review"){ const r = buildReview(10); queue = r.queue; reviewFor = r.reviewFor; meta = r.meta; }
  else if (kind === "practice"){ const r = buildPractice(opts.domain || "ALL", opts.n || 10, opts.topic); queue = r.queue; reviewFor = r.reviewFor; meta = r.meta; }
  else if (kind === "exam"){ queue = buildExam(opts.n || 20); }
  if (!queue.length){ toast(kind === "review" ? "No reviews are due today. Nice." : "No questions available for that choice."); return; }
  S.session = { kind, queue, idx:0, items:{}, reviewFor, meta, chains:0, topic:opts.topic || null, flagged:{}, startedAt:Date.now(), xpStart:S.xp, finished:false, domain:opts.domain || "ALL",
    timed:!!opts.timed, durationSec: opts.timed ? queue.length * 90 : 0, result:null };
  S.view = { screen:"session" }; markDay(); save(); closeModal(); renderAll(); focusTitle();
}
function sessionGo(idx){ const s = S.session; if (idx < 0 || idx >= s.queue.length) return; s.idx = idx; save(); renderAll(); focusTitle(); }
function sessionNext(){
  const s = S.session;
  if (s.idx < s.queue.length - 1){ s.idx++; save(); renderAll(); focusTitle(); return; }
  finishPractice();
}
function finishPractice(){
  const s = S.session; s.finished = true; s.finishedAt = Date.now();
  if (s.kind === "review"){ S.stats.reviews++; award(XP.reviewDone, "Review session complete", null, true); }
  checkAchievements(); save(); renderAll(); focusTitle();
}
function finishExam(auto){
  const s = S.session; if (s.finished) return;
  clearInterval(examTimer);
  let right = 0; const byDomain = {};
  const notes = [];
  s.queue.forEach(id => {
    const item = ITEMS[id], st = IS(id, s.items);
    const answered = item.type === "order" ? st.touched : answerComplete(item, st);
    const ev = answered ? evaluate(item, st) : { correct:false };
    st.lastEval = ev; st.status = ev.correct ? "solved" : "missed"; st.firstCorrect = ev.correct; st.answered = answered;
    if (answered){ recordEvidence(id, ev.correct, 0, st.conf || null, "exam"); if (lastAdapt) notes.push(lastAdapt.text); if (!ev.correct) logMisconceptions(item, st); }
    const d = item.domain; byDomain[d] = byDomain[d] || { right:0, total:0 }; byDomain[d].total++; if (ev.correct){ byDomain[d].right++; right++; }
  });
  const pct = Math.round(100 * right / s.queue.length);
  s.result = { right, total:s.queue.length, pct, byDomain, auto:!!auto, notes, seconds:Math.round((Date.now() - s.startedAt)/1000) };
  s.finished = true; s.idx = 0;
  S.exams.push({ date:localDate(), total:s.queue.length, right, pct, timed:s.timed, byDomain });
  if (S.exams.length > 50) S.exams = S.exams.slice(-50);
  S.stats.exams++;
  award(right * XP.examRight + XP.examDone, "Exam drill complete", null, true);
  checkAchievements(); save(); renderAll(); focusTitle();
  if (auto) toast("Time's up. Your drill was submitted.");
}
function endSession(){ S.session = null; clearInterval(examTimer); openHub(); }

/* ---------- Rendering: top bar ---------- */
function renderTop(){
  const l = level(S.xp);
  $("#lvl").innerHTML = `Lv ${l.n} · ${esc(l.title)}<small>${l.need - l.into} XP to next level</small>`;
  $("#xpfill").style.width = l.pct + "%";
  $("#xpnum").textContent = S.xp + " XP";
  const due = dueReviews().length;
  $("#nav-review").textContent = due ? `Review (${due})` : "Review";
  const md = mode();
  $("#mode").textContent = { learn:"Learn mode", practice: S.session && S.session.kind === "review" ? "Review" : "Practice mode", exam:"Exam mode", hub:"Study library", ops:"Ops workspace" }[md] + (md === "exam" ? " · fixed mix" : adaptiveOn() ? " · Adaptive" : " · " + LEVEL_NAMES[+S.profile.difficultyMode]);
  const c = $("#clock"); clearInterval(clockTimer);
  const run = RUN();
  c.hidden = !(S.profile.showClock && run);
  if (S.profile.showClock && run){ const tick = () => { c.textContent = "⏱ " + fmtTime(((run.finishedAt || Date.now()) - run.startedAt)/1000); }; tick(); clockTimer = setInterval(tick, 1000); }
  document.querySelectorAll("[data-nav]").forEach(b => b.setAttribute("aria-current", (b.dataset.nav === S.view.screen) ? "page" : "false"));
}

/* ---------- Rendering: rail ---------- */
function stepNodeClass(i){
  const r = RUN(), step = r.steps[i];
  if (i === r.step) return "current";
  if (step.type === "brief") return r.briefDone ? "done" : "";
  if (step.type === "debrief") return r.finalized ? "done" : "";
  const st = r.items[step.id]; if (!st) return "";
  if (st.status === "solved" || st.status === "revealed") return st.firstCorrect ? "done" : "miss";
  return st.status === "wrong" ? "miss" : "";
}
function levelChip(t){
  const T = S.topics[t];
  if (!T || !T.history.length) return `<span class="lvchip l0">New</span>`;
  if (!T.placed) return `<span class="lvchip l0">Finding your level</span>`;
  return `<span class="lvchip l${T.level}">${LEVEL_NAMES[T.level]}${T.support ? " · guided" : ""}</span>`;
}
function topicLevelsPanel(ts, title){
  return `<div class="panel"><h3>${esc(title)}</h3><ul class="objlist">` + ts.map(t => `<li><span class="oid">Topic ${esc(t)}</span>${esc(topicName(t))}<span>${levelChip(t)}</span></li>`).join("") + `</ul>
    <p class="meter-note">${adaptiveOn() ? "Levels adjust per topic from your first-try answers." : "Fixed difficulty: " + LEVEL_NAMES[+S.profile.difficultyMode] + " (change it in Settings)."}</p></div>`;
}
function objectivesPanel(ids, title){
  return `<div class="panel"><h3>${esc(title)}</h3><ul class="objlist">` + ids.map(id => `<li><span class="oid">SC-300 ${esc(id)}</span>${esc(objText(id))}<span>${pill(statusFor(id))}</span></li>`).join("") + `</ul></div>`;
}
function renderRail(){
  let html = "";
  if (S.view.screen === "ops"){ $("#rail").innerHTML = ""; return; }
  if (S.view.screen === "mission"){
    const m = MIS(), r = RUN();
    html += `<div class="panel"><h3>${esc(m.code)} · ${esc(m.title)}</h3><ol class="steps">`;
    let lastGroup = null;
    r.steps.forEach((s, i) => {
      if (s.group && s.group !== lastGroup){ const g = m.groups[s.group-1]; html += `<li class="grp">Challenge ${g.n}<span>${esc(g.title)}</span></li>`; lastGroup = s.group; }
      if (!s.group) lastGroup = null;
      const tag = s.role ? `<span class="rtag r-${s.role}">${esc(ROLE_LABEL[s.role] || s.role)}</span>` : "";
      html += `<li><button class="stepbtn ${s.role ? "sub" : ""} ${i===r.step?"current":""}" data-action="go" data-idx="${i}" ${i > r.maxStep ? "disabled" : ""} aria-current="${i===r.step?"step":"false"}"><span class="node ${stepNodeClass(i)}" aria-hidden="true"></span><span class="stxt">${esc(s.label)}${tag}</span>${i > r.maxStep ? `<span class="sr-only">(locked)</span>` : ""}</button></li>`;
    });
    html += `</ol></div>`;
    const mv = meters();
    html += `<div class="panel"><h3>Tenant health</h3>` + METER_KEYS.map(([k]) => {
      const v = mv[k], col = v >= 70 ? "var(--good)" : v >= 40 ? "var(--accent)" : "var(--bad)", label = meterLabel(m, k);
      return `<div class="meter"><div class="meter-top"><span>${esc(label)}</span><b>${v}</b></div><div class="bar" role="img" aria-label="${esc(label)} ${v} of 100"><span style="width:${v}%;background:${col}"></span></div></div>`;
    }).join("") + `<p class="meter-note">Each decision moves these. They show consequences, not your score.</p></div>`;
    html += topicLevelsPanel([...new Set(r.steps.filter(x => x.type === "item").map(x => ITEMS[x.id].topic))], "Your level in these topics");
    html += objectivesPanel(m.objectives, "Objectives in play");
  } else if (S.view.screen === "session"){
    const s = S.session;
    const objs = [...new Set(s.queue.flatMap(id => ITEMS[id].objectives))].sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    const answered = s.queue.filter(id => s.items[id] && (s.kind === "exam" ? (ITEMS[id].type === "order" ? s.items[id].touched : answerComplete(ITEMS[id], s.items[id])) : s.items[id].attempts > 0)).length;
    html += `<div class="panel"><h3>${esc(sessionTitle(s))}</h3><div class="meter"><div class="meter-top"><span>Progress</span><b>${answered}/${s.queue.length}</b></div><div class="bar"><span style="width:${Math.round(100*answered/s.queue.length)}%;background:var(--info)"></span></div></div>
      <p class="meter-note">${s.kind === "exam" ? "No feedback until you finish. Flag questions to revisit them." : s.kind === "review" ? "Missed items come back as different scenarios on the same objectives." : "Mixed questions, with feedback after each submission."}</p>
      <div class="actions" style="margin-top:10px"><button class="btn small" data-action="end-session">${s.finished ? "Back to campaign" : "Leave session"}</button></div></div>`;
    if (s.kind !== "exam") html += topicLevelsPanel([...new Set(s.queue.map(id => ITEMS[id].topic))].sort(), "Your level in these topics");
    html += objectivesPanel(objs.slice(0, 12), "Objectives in this session" + (objs.length > 12 ? ` (12 of ${objs.length})` : ""));
  } else {
    const l = level(S.xp), earned = C.achievements.filter(a => S.achievements[a.id]);
    html += `<div class="panel"><h3>Your profile</h3><div class="profile-line"><b>Lv ${l.n}</b> ${esc(l.title)}</div><div class="profile-line">${S.xp} XP · studied on ${S.days.length} day${S.days.length===1?"":"s"}</div>
      <div class="profile-line">Exam date: ${S.profile.examDate ? esc(S.profile.examDate) : `<button class="btn link small" data-action="open-settings">set it</button>`}</div></div>`;
    html += `<div class="panel"><h3>Achievements · ${earned.length}/${C.achievements.length}</h3><ul class="ach">` + C.achievements.map(a => `<li class="${S.achievements[a.id]?"got":""}" title="${esc(a.desc)}"><span class="medal" aria-hidden="true">${S.achievements[a.id] ? "★" : "☆"}</span><span><b>${esc(a.title)}</b><small>${esc(a.desc)}</small></span></li>`).join("") + `</ul></div>`;
    const weak = OBJ_LIST.filter(o => statusFor(o.id) === "Needs review").slice(0, 6);
    if (weak.length) html += objectivesPanel(weak.map(o => o.id), "Needs review");
  }
  $("#rail").innerHTML = html;
}
function sessionTitle(s){ return s.kind === "exam" ? `Exam drill · ${s.queue.length} questions` : s.kind === "review" ? "Review session" : `Practice · ${s.topic ? topicName(s.topic) : (DOMAIN_SHORT[s.domain] || "All domains")}`; }

/* ---------- Rendering: hub ---------- */
function missionStatus(mid){
  const r = S.runs[mid], done = S.completed[mid] || 0;
  if (r && !r.finalized && (r.step > 0 || r.briefDone)) return { label:"In progress", cls:"s-learning", action:"Resume" };
  if (done) return { label:"Completed" + (done > 1 ? ` ×${done}` : ""), cls:"s-demo", action:"Replay" };
  return { label:"New", cls:"", action:"Start" };
}
function bestResult(mid){ const rs = S.results.filter(r => r.mission === mid); if (!rs.length) return null; return rs.reduce((a,b) => (b.firstTry/b.total > a.firstTry/a.total ? b : a)); }
function recommended(){
  const due = dueReviews().length;
  if (due >= 5) return { kind:"review", label:`Review ${due} due item${due===1?"":"s"}`, sub:"Spaced review keeps what you've learned." };
  for (const mid of MISSION_ORDER){ const r = S.runs[mid]; if (r && !r.finalized && (r.step > 0 || r.briefDone)) return { kind:"mission", mid, label:`Resume ${MISSIONS[mid].code}: ${MISSIONS[mid].title}`, sub:"Pick up where you left off." }; }
  for (const mid of MISSION_ORDER){ if (!S.completed[mid]) return { kind:"mission", mid, label:`${MISSIONS[mid].code}: ${MISSIONS[mid].title}`, sub:MISSIONS[mid].goal }; }
  return { kind:"exam", label:"Take an exam drill", sub:"Campaign complete. Keep it sharp with timed mixed practice." };
}
function missionCard(mid){
  const m = MISSIONS[mid], st = missionStatus(mid), best = bestResult(mid);
  const cls = m.final ? "mcard final" : m.boss ? "mcard boss" : "mcard";
  return `<article class="${cls}"><div class="mc-top"><span class="mc-code">${esc(m.code)}</span><span class="pill ${st.cls}">${esc(st.label)}</span></div>
    <h4>${esc(m.title)}</h4><p>${esc(m.goal)}</p>
    <div class="mc-meta"><span>~${m.minutes} min</span><span>${m.objectives.length} objectives</span>${best ? `<span>Best first-try ${best.firstTry}/${best.total}</span>` : ""}</div>
    <button class="btn ${st.action === "Start" && mid === (recommended().mid) ? "primary" : ""} small" data-action="open-mission" data-mid="${mid}" data-fresh="${st.action === "Replay" ? "1" : ""}">${st.action}<span class="sr-only"> ${esc(m.title)}</span></button></article>`;
}
function renderTopicStrengths(){
  const rec = new Set(recommendedTopics(3));
  return `<section class="domain-sec" aria-labelledby="topics-h"><div class="dom-head"><h3 id="topics-h">Your topics</h3><div class="dom-cov"><span>${adaptiveOn() ? "Adaptive: each topic sets its own level" : "Fixed difficulty: " + LEVEL_NAMES[+S.profile.difficultyMode]}</span></div></div>
    <div class="tgrid">${TOPICS.map(t => { const v = strengthOf(t.id), lab = strengthLabel(v);
      return `<div class="tcard ${rec.has(t.id) ? "rec" : ""}"><div class="tc-top"><span class="oid">${esc(t.id)}</span>${levelChip(t.id)}</div><div class="tc-name">${esc(topicName(t.id))}</div>
        <div class="tc-bar"><div class="bar"><span style="width:${v === null ? 0 : Math.max(6, v)}%;background:${v === null ? "transparent" : v >= 75 ? "var(--good)" : v >= 50 ? "var(--info)" : "var(--accent)"}"></span></div><span class="tc-lab">${esc(lab)}</span></div>
        <div class="tc-foot">${rec.has(t.id) ? `<span class="recbadge">Recommended practice</span>` : `<span></span>`}<button class="btn small" data-action="practice-topic" data-topic="${t.id}">Practice<span class="sr-only"> ${esc(topicName(t.id))}</span></button></div></div>`; }).join("")}</div>
    <p class="simnote">Strength reflects recent first-try answers without hints in that topic. It guides practice; it isn't a grade.</p></section>`;
}
function renderHub(){
  const touched = touchedObjectives(), demo = OBJ_LIST.filter(o => statusFor(o.id) === "Demonstrated").length;
  const due = dueReviews().length, done = MISSION_ORDER.filter(mid => S.completed[mid]).length;
  const rec = recommended();
  let html = `<div class="eyebrow"><span>Halcyon Freight · Identity operations</span><span class="kind">${esc(C.meta.studyGuide)}</span></div>
    <h2 id="case-title" tabindex="-1">Study library</h2>
    <div class="opslink"><div><div class="n">OPS WORKSPACE</div><h3>Monday Morning Lockout</h3><p>Hands-on Conditional Access troubleshooting. More missions are being converted; their study versions are below.</p></div><button class="btn primary" data-action="nav-ops">Open workspace →</button></div>
    <div class="tiles">
      <div class="tile"><div class="tv">${touched.size}<small>/${OBJ_LIST.length}</small></div><div class="tl">Objectives touched</div></div>
      <div class="tile"><div class="tv">${demo}</div><div class="tl">Demonstrated</div></div>
      <div class="tile"><div class="tv">${done}<small>/${MISSION_ORDER.length}</small></div><div class="tl">Missions completed</div></div>
      <div class="tile"><div class="tv">${due}</div><div class="tl">Reviews due today</div></div>
    </div>
    <div class="nextup"><div><div class="n">UP NEXT</div><h3>${esc(rec.label)}</h3><p>${esc(rec.sub)}</p></div>
      <button class="btn primary" data-action="${rec.kind === "mission" ? "open-mission" : rec.kind === "review" ? "start-review" : "open-exam"}" data-mid="${rec.mid || ""}">Go →</button></div>
    <div class="modes">
      <div class="modecard"><h3>Practice</h3><p>10 questions with feedback after each: due reviews, topics that want support, and fresh material across the curriculum.</p>
        <div class="actions"><label class="sr-only" for="pr-domain">Practice domain</label><select id="pr-domain" class="sel">${["ALL","D1","D2","D3","D4"].map(d => `<option value="${d}">${esc(DOMAIN_SHORT[d])}</option>`).join("")}</select>
        <label class="sr-only" for="pr-diff">Difficulty</label><select id="pr-diff" class="sel">${[["adaptive","Adaptive (recommended)"],["1","Beginner"],["2","Intermediate"],["3","Advanced"]].map(([v,l]) => `<option value="${v}" ${String(S.profile.difficultyMode)===v?"selected":""}>${l}</option>`).join("")}</select>
        <button class="btn" data-action="start-practice">Start practice</button></div></div>
      <div class="modecard"><h3>Review</h3><p>${due ? `${due} item${due===1?"":"s"} due. Missed items return as different scenarios on the same objectives.` : "Nothing due today. Reviews appear 1–3 days after you answer, then spread out."}</p>
        <div class="actions"><button class="btn" data-action="start-review" ${due ? "" : "disabled"}>Start review</button></div></div>
      <div class="modecard"><h3>Exam drill</h3><p>Timed mixed practice weighted like the exam domains. Explanations after you finish.</p>
        <div class="actions"><button class="btn" data-action="open-exam">Set up drill</button></div></div>
    </div>`;
  html += renderTopicStrengths();
  C.campaign.forEach(d => {
    const dom = C.curriculum.find(x => x.id === d.domain);
    const ids = OBJ_LIST.filter(o => o.domain === d.domain);
    const t = ids.filter(o => touched.has(o.id)).length, dm = ids.filter(o => statusFor(o.id) === "Demonstrated").length;
    html += `<section class="domain-sec" aria-labelledby="dom-${d.domain}"><div class="dom-head"><h3 id="dom-${d.domain}">${esc(dom.name)} <span class="wt">${esc(dom.weight)}</span></h3>
      <div class="dom-cov"><span>${t}/${ids.length} touched · ${dm} demonstrated</span><div class="bar"><span style="width:${Math.round(100*t/ids.length)}%;background:var(--info)"></span></div></div></div>
      <div class="mgrid">${d.missions.map(missionCard).join("")}${missionCard(d.boss)}</div></section>`;
  });
  html += `<section class="domain-sec"><div class="mgrid one">${missionCard(C.finalBoss)}</div></section>
    <p class="simnote">${esc(C.meta.assumptions)}</p>`;
  return html;
}

/* ---------- Rendering: items ---------- */
function renderEvidence(evs){
  if (!evs || !evs.length) return "";
  return `<div class="evidence">` + evs.map(ev => {
    const head = `<div class="ev-head"><b>${esc(ev.title)}</b><span class="sim">SIMULATED</span></div>`;
    if (ev.kind === "kv") return `<div class="ev">${head}<div class="kv">` + ev.fields.map(([k,v]) => `<div class="k">${esc(k)}</div><div class="v ${v===""?"empty":""}">${v===""?"(not set)":esc(v)}</div>`).join("") + `</div></div>`;
    if (ev.kind === "table") return `<div class="ev">${head}<div class="tablewrap"><table class="grid"><thead><tr>${ev.columns.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${ev.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
    return "";
  }).join("") + `</div>`;
}
const showAnswers = st => st.status === "solved" || st.status === "revealed" || st.status === "missed";
function renderOptions(item, st, locked){
  const multi = item.type === "multi";
  return `<fieldset class="q"><legend>${esc(item.prompt)} <span class="req">${multi ? `Choose ${item.pick}` : "Choose 1"}</span></legend><div class="opts">` +
    item.options.map((o, i) => {
      const chosen = st.sel.includes(o.id); let cls = "opt" + (chosen ? " sel" : ""), mark = "";
      if (locked){ cls += " locked";
        if (showAnswers(st) && o.correct){ cls += " right"; mark = `<span class="mark ok">✓ correct</span>`; }
        else if (chosen && (st.status === "wrong" || showAnswers(st)) && !o.correct){ cls += " wrong"; mark = `<span class="mark no">✗ your pick</span>`; }
        else if (chosen) mark = `<span class="mark">your pick</span>`; }
      return `<label class="${cls}" for="opt-${o.id}"><input type="${multi?"checkbox":"radio"}" name="opt" id="opt-${o.id}" value="${o.id}" ${chosen?"checked":""} ${locked?"disabled":""}><span class="key">${String.fromCharCode(65+i)}</span><span class="txt">${o.text}</span>${mark}</label>`;
    }).join("") + `</div></fieldset>`;
}
function renderConfig(item, st, locked){
  const fieldsHtml = item.fields.map(f => {
    const shown = !f.showIf || f.showIf.in.includes(st.fields[f.showIf.field]);
    const res = st.lastEval && st.lastEval.fields ? st.lastEval.fields[f.id] : undefined;
    return `<fieldset class="q cfgfield" id="field-${f.id}" ${shown?"":"hidden"}><legend>${esc(f.label)} <span class="req">Choose 1</span></legend><div class="${f.mono?"opts ruleopts":"chips"}">` +
      f.options.map(o => {
        const chosen = st.fields[f.id] === o.id; let c = "opt" + (chosen ? " sel" : ""), mark = "";
        if (locked){ c += " locked";
          if (showAnswers(st) && o.correct){ c += " right"; mark = `<span class="mark ok">✓</span>`; }
          else if (chosen && (res === false || showAnswers(st)) && !o.correct){ c += " wrong"; mark = `<span class="mark no">✗</span>`; }
          else if (chosen && res === true) mark = `<span class="mark ok">✓</span>`; }
        return `<label class="${c}" for="f-${f.id}-${o.id}"><input type="radio" name="field-${f.id}" id="f-${f.id}-${o.id}" value="${o.id}" ${chosen?"checked":""} ${locked?"disabled":""}><span class="txt">${esc(o.text)}</span>${mark}</label>`;
      }).join("") + `</div></fieldset>`;
  }).join("");
  return `<div class="workshop"><div>${fieldsHtml}</div><div class="preview" id="cfg-preview" aria-live="polite">${previewHtml(item, st)}</div></div>`;
}
function previewHtml(item, st){
  const rows = item.fields.map(f => {
    const shown = !f.showIf || f.showIf.in.includes(st.fields[f.showIf.field]);
    if (!shown) return `<div><span class="ph">${esc(f.label)}:</span> <span class="ph">not applicable</span></div>`;
    const o = f.options.find(x => x.id === st.fields[f.id]);
    return `<div><span class="ph">${esc(f.label)}:</span> ${o ? `<span class="pv">${esc(o.text)}</span>` : `<span class="unset">not set</span>`}</div>`;
  }).join("");
  const extra = item.groupName ? `<div><span class="ph">Name:</span> <span class="pv">${esc(item.groupName)}</span></div>` : "";
  const tail = item.id === "c2a" ? `<div><span class="ph">License:</span> <span class="pv">Microsoft 365 E3</span></div><div><span class="ph">Enterprise app:</span> <span class="pv">BrightBoard</span></div>` : "";
  return `<h4>Configuration preview</h4>${extra}${rows}${tail}`;
}
function renderOrder(item, st, locked){
  if (!st.order) st.order = item.start.slice();
  const want = item.steps.map(s => s.id), byId = Object.fromEntries(item.steps.map(s => [s.id, s]));
  const rows = st.order.map((id, i) => {
    const s = byId[id]; let cls = "seqrow", mark = "";
    if (locked){
      const ok = id === want[i];
      if (st.status === "wrong" || st.status === "missed" && !st.lastEval.correct){ cls += ok ? " right" : " wrong"; mark = `<span class="mark ${ok?"ok":"no"}">${ok?"✓ in place":"✗ out of place"}</span>`; }
      else if (showAnswers(st)){ cls += " right"; }
    }
    return `<li class="${cls}"><span class="pos">${i+1}</span><span class="txt ${item.mono?"mono":""}">${item.mono ? esc(s.text) : s.text}</span>${mark}<span class="seqbtns">
      <button class="btn small" data-action="move" data-id="${id}" data-dir="-1" aria-label="Move up: ${esc(s.text.replace(/<[^>]*>/g,""))}" ${locked || i === 0 ? "disabled" : ""}>↑</button>
      <button class="btn small" data-action="move" data-id="${id}" data-dir="1" aria-label="Move down: ${esc(s.text.replace(/<[^>]*>/g,""))}" ${locked || i === st.order.length-1 ? "disabled" : ""}>↓</button></span></li>`;
  }).join("");
  return `<fieldset class="q"><legend>${esc(item.prompt)} <span class="req">Put in order</span></legend><ol class="seq">${rows}</ol>
    <p class="note">Move steps with the ↑ and ↓ buttons. Keyboard: Tab to a button, then Enter or Space.</p></fieldset>`;
}
function deltas(imp, m){
  const parts = METER_KEYS.filter(([k]) => imp[k]).map(([k]) => `<span class="delta ${imp[k]>0?"up":"down"}">${imp[k]>0?"+":""}${imp[k]} ${esc(meterLabel(m, k))}</span>`);
  return parts.length ? parts.join("") : `<span class="delta">No change</span>`;
}
function sourcesHtml(item){
  const srcs = (item.sources || []).map(k => C.sources[k]).filter(Boolean);
  return srcs.length ? `<div><h4>Microsoft Learn sources</h4><ul class="sources">${srcs.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join("")}</ul><p class="verified">Checked ${esc(C.meta.verified)} against ${esc(C.meta.studyGuide)}.</p></div>` : "";
}
function solutionBody(item, st, withImpact){
  const m = MIS(); let alts = "";
  if (item.type === "config") alts = item.fields.map(f => `<div><h4>${esc(f.label)}</h4><ul class="altlist">${f.options.map(o => `<li><span class="ic ${o.correct?"ok":"no"}">${o.correct?"✓":"✗"}</span><span><span class="ot ${f.mono?"mono":""}">${esc(o.text)}</span><br>${esc(o.feedback)}</span></li>`).join("")}</ul></div>`).join("");
  else if (item.type === "order") alts = `<div><h4>Correct order</h4><ol class="altlist seqsol">${item.steps.map((s, i) => `<li><span class="ic ok">${i+1}</span><span><span class="ot ${item.mono?"mono":""}">${item.mono ? esc(s.text) : s.text}</span><br>${esc(s.why)}</span></li>`).join("")}</ol></div>`;
  else alts = `<div><h4>Every option, explained</h4><ul class="altlist">${item.options.map(o => `<li><span class="ic ${o.correct?"ok":"no"}">${o.correct?"✓":"✗"}</span><span><span class="ot">${o.text}</span><br>${esc(o.feedback)}</span></li>`).join("")}</ul></div>`;
  const conseq = withImpact && item.main ? `<div><h4>Impact on Halcyon</h4><div class="impact">${deltas(st.lastImpact || impactOf(item, st, st.lastEval), m)}</div>${chosenOptions(item, st).filter(o => o.consequence).map(o => `<p class="conseq">${esc(o.consequence)}</p>`).join("")}</div>` : "";
  return `<div class="prose">${item.explanation}</div>${conseq}${alts}${item.simplification ? `<p class="simnote"><b>Simplified:</b> ${esc(item.simplification)}</p>` : ""}${sourcesHtml(item)}`;
}
function wrongBody(item, st){
  if (item.type === "config") return `<ul class="altlist">` + activeFields(item, st).map(f => { const o = f.options.find(x => x.id === st.fields[f.id]); const ok = st.lastEval.fields[f.id];
    return `<li><span class="ic ${ok?"ok":"no"}">${ok?"✓":"✗"}</span><span><span class="ot">${esc(f.label)}: ${esc(o.text)}</span><br>${ok ? "This setting is right." : esc(o.feedback)}</span></li>`; }).join("") + `</ul>`;
  if (item.type === "order") return `<p class="conseq">${st.lastEval.right} of ${item.steps.length} steps are in the right position. Steps marked ✗ are out of place.</p>`;
  const chosen = chosenOptions(item, st), right = chosen.filter(o => o.correct).length;
  const lead = item.type === "multi" ? `<p class="conseq">${right} of your ${chosen.length} picks ${right===1?"is":"are"} part of the answer. This question needs exactly ${item.pick} correct choices.</p>` : "";
  return lead + `<ul class="altlist">` + chosen.map(o => `<li><span class="ic ${o.correct?"ok":"no"}">${o.correct?"✓":"✗"}</span><span><span class="ot">${o.text}</span><br>${esc(o.feedback)}</span></li>`).join("") + `</ul>`;
}
function adaptNote(st){
  const lines = [st.notice, st.followUp].filter(Boolean);
  return lines.length ? `<div class="adapt" role="status">${lines.map(l => `<p>${esc(l)}</p>`).join("")}</div>` : "";
}
function renderFeedback(item, st, md){
  if (st.status === "open") return "";
  const m = MIS();
  if (st.status === "wrong"){
    const conseq = item.main ? `<div><h4>Impact on Halcyon</h4><div class="impact">${deltas(st.lastImpact || {}, m)}</div>${chosenOptions(item, st).filter(o => o.consequence).map(o => `<p class="conseq">${esc(o.consequence)}</p>`).join("")}</div>` : "";
    return `<section class="feedback" aria-labelledby="fb-title"><div class="fb-head bad"><h3 id="fb-title" tabindex="-1">Not quite. Here's what your choice does</h3>${st.xp ? `<span class="xpgain">+${st.xp} XP so far</span>` : ""}</div>
      <div class="fb-body"><div>${wrongBody(item, st)}</div>${adaptNote(st)}${conseq}
      <div class="actions"><button class="btn primary" data-action="retry">Try again</button><button class="btn" data-action="reveal">Show solution</button>${st.hints < item.hints.length ? `<button class="btn link" data-action="hint">Take a hint first</button>` : ""}<span class="note">A retry still earns correction XP.</span></div></div></section>`;
  }
  let title, cls, nextLabel, nextAction;
  if (md === "learn"){
    cls = st.status === "solved" ? "good" : "rev"; title = st.status === "solved" ? (st.attempts === 1 ? "Correct" : "Corrected. Nice recovery") : "Solution";
    nextLabel = RUN().step === RUN().steps.length - 2 ? "Go to debrief" : "Continue"; nextAction = "next";
  } else {
    cls = st.status === "solved" ? "good" : "bad"; title = st.status === "solved" ? "Correct" : "Not this time";
    nextLabel = S.session.idx === S.session.queue.length - 1 ? "Finish session" : "Next question"; nextAction = "session-next";
  }
  const pre = (md !== "learn" && st.status === "missed" ? `<div><h4>Your answer</h4>${wrongBody(item, st)}</div>` : "") + adaptNote(st);
  return `<section class="feedback" aria-labelledby="fb-title"><div class="fb-head ${cls}"><h3 id="fb-title" tabindex="-1">${title}</h3><span class="xpgain">+${st.xp} XP on this ${md === "learn" ? "step" : "question"}</span></div>
    <div class="fb-body">${pre}${solutionBody(item, st, md === "learn")}<div class="actions"><button class="btn primary" data-action="${nextAction}">${nextLabel} →</button></div></div></section>`;
}
function renderQuestion(item, st, locked){
  if (item.type === "config") return renderConfig(item, st, locked);
  if (item.type === "order") return renderOrder(item, st, locked);
  return renderOptions(item, st, locked);
}
function itemTags(item){ return `<div class="tags">${item.objectives.map(id => `<span class="tag">SC-300 ${esc(id)} · ${esc(objText(id))}</span>`).join("")}</div>`; }
function confRow(st, optional){
  return `<div class="conf" role="radiogroup" aria-label="Confidence"><span class="lbl">Confidence${optional ? " (optional)" : ""}:</span>${CONF.map(([v,l]) => `<label class="${st.conf===v?"sel":""}" for="conf-${v}"><input type="radio" name="conf" id="conf-${v}" value="${v}" ${st.conf===v?"checked":""}>${l}</label>`).join("")}</div>`;
}
function workedPanel(item, role){
  const T = S.topics[item.topic];
  const we = C.workedExamples && C.workedExamples[item.topic];
  if (!we) return "";
  if (role === "support") return `<div class="worked"><div class="wk-head">Let's practice this concept another way</div><div class="prose"><p class="wk-sub">Worked example: ${esc(topicName(item.topic))}</p>${we}</div></div>`;
  if (T && T.support && adaptiveOn()) return `<details class="worked mini"><summary>Worked example: ${esc(topicName(item.topic))}</summary><div class="prose">${we}</div></details>`;
  return "";
}
function itemMetaLine(item, role){
  return `<span class="dchip d${item.difficulty}" title="Challenge depth">${LEVEL_NAMES[item.difficulty]}</span>${role ? `<span class="rtag r-${role}">${esc(ROLE_LABEL[role] || role)}</span>` : ""}`;
}
function renderMissionItem(step){
  const item = ITEMS[step.id], st = IS(step.id), m = MIS(), r = RUN(), g = m.groups[step.group-1];
  const locked = st.status !== "open";
  const sub = r.steps.filter(s => s.group === step.group), pos = sub.findIndex(s => s === step) + 1;
  const T = S.topics[item.topic], lvl = T ? T.level : 1;
  const notesOpen = st.attempts === 0 && (lvl < 3 || (T && T.support));   // more scaffolding at lower levels
  let html = `<div class="eyebrow"><span>Challenge ${g.n} · Step ${pos} of ${sub.length}</span><span class="kind">${esc(item.kind)}</span></div>
    <div class="metaline">${itemMetaLine(item, step.role)}</div>
    <h2 id="case-title" tabindex="-1">${esc(item.title)}</h2>${itemTags(item)}
    ${workedPanel(item, step.role)}
    ${S.profile.showStory && item.story ? `<p class="story">${item.story}</p>` : ""}
    <div class="situation prose">${item.situation}</div>
    ${item.teach ? `<details class="notes" ${notesOpen?"open":""}><summary>Field notes · the minimum you need</summary><div class="prose">${item.teach}</div></details>` : ""}
    ${renderEvidence(item.evidence)}${renderQuestion(item, st, locked)}`;
  if (st.hints) html += `<ul class="hints" aria-label="Hints">${item.hints.slice(0, st.hints).map((h,i) => `<li><b>HINT ${i+1}</b>${esc(h)}</li>`).join("")}</ul>`;
  if (st.status === "open"){
    if (st.attempts === 0) html += confRow(st);
    const left = item.hints.length - st.hints;
    html += `<div class="actions"><button class="btn primary" id="submit-btn" data-action="submit" ${canSubmit(item, st)?"":"disabled"} aria-describedby="submit-note">Submit answer</button>
      <button class="btn" data-action="hint" ${left?"":"disabled"}>${left ? `Hint (${st.hints+1} of ${item.hints.length})` : "No hints left"}</button>
      <span class="note" id="submit-note">${esc(submitReason(item, st)) || (st.hints===0 && st.attempts===0 ? "Hints lower the first-try bonus, never your earned XP." : "")}</span></div>`;
  }
  return html + renderFeedback(item, st, "learn");
}
function renderSessionItem(){
  const s = S.session, id = s.queue[s.idx], item = ITEMS[id], st = IS(id), exam = s.kind === "exam";
  const locked = !exam && st.status !== "open";
  const origin = ITEM_MISSION[id] ? MISSIONS[ITEM_MISSION[id]] : null;
  const role = !exam && s.meta && s.meta[id] ? s.meta[id].role : null;
  let html = `<div class="eyebrow"><span>${esc(sessionTitle(s))} · Question ${s.idx+1} of ${s.queue.length}</span><span class="kind">${esc(topicName(item.topic))}${origin ? " · from "+esc(origin.code) : ""}</span></div>`;
  if (exam) html += examBar() + `<p class="simnote">Exam drills keep a fixed difficulty and topic mix. Your results update training after you finish.</p>`;
  else html += `<div class="metaline">${itemMetaLine(item, role === "review" ? null : role)}</div>`;
  html += `<h2 id="case-title" tabindex="-1">${esc(item.title)}</h2>${itemTags(item)}${exam ? "" : workedPanel(item, role)}
    <div class="situation prose">${item.situation}</div>${renderEvidence(item.evidence)}${renderQuestion(item, st, locked)}`;
  if (exam){
    html += confRow(st, true) + `<div class="actions"><button class="btn" data-action="session-go" data-idx="${s.idx-1}" ${s.idx===0?"disabled":""}>← Previous</button>
      <button class="btn" data-action="flag" aria-pressed="${s.flagged[id]?"true":"false"}">${s.flagged[id] ? "★ Flagged" : "☆ Flag for review"}</button>
      ${s.idx < s.queue.length-1 ? `<button class="btn primary" data-action="session-go" data-idx="${s.idx+1}">Next →</button>` : ""}
      <button class="btn ${s.idx === s.queue.length-1 ? "primary" : ""}" data-action="finish-ask">Finish drill</button><span class="note" id="submit-note">${answerComplete(item, st) && (item.type !== "order" || st.touched) ? "Answer saved." : "Answers save as you choose."}</span></div><div id="finish-area"></div>`;
  } else if (st.status === "open"){
    html += confRow(st) + `<div class="actions"><button class="btn primary" id="submit-btn" data-action="submit" ${canSubmit(item, st)?"":"disabled"} aria-describedby="submit-note">Submit answer</button><span class="note" id="submit-note">${esc(submitReason(item, st))}</span></div>`;
  }
  if (!exam) html += renderFeedback(item, st, "practice");
  return html;
}
function examBar(){
  const s = S.session;
  const chips = s.queue.map((id, i) => { const st = s.items[id], it = ITEMS[id]; const ans = st && (it.type === "order" ? st.touched : answerComplete(it, st));
    return `<button class="qchip ${i===s.idx?"cur":""} ${ans?"ans":""} ${s.flagged[id]?"flag":""}" data-action="session-go" data-idx="${i}" aria-label="Question ${i+1}${ans?", answered":""}${s.flagged[id]?", flagged":""}">${i+1}</button>`; }).join("");
  return `<div class="exambar">${s.timed ? `<span class="examclock" id="examclock" aria-live="off"></span>` : `<span class="examclock">Untimed</span>`}<div class="qchips">${chips}</div></div>`;
}
function renderSessionSummary(){
  const s = S.session;
  if (s.kind === "exam"){
    const r = s.result;
    let html = `<div class="eyebrow"><span>Exam drill · results</span><span class="kind">${r.auto ? "Submitted when time ran out" : "Submitted"}</span></div>
      <h2 id="case-title" tabindex="-1">${r.right} of ${r.total} correct (${r.pct}%)</h2>
      <p class="callout">Practice results are learning indicators, not a prediction of your exam score. Use the domain breakdown to choose what to study next.</p>
      <div class="section"><h3>Your training was updated</h3>${(r.notes || []).length ? `<div class="adapt">${r.notes.slice(0,5).map(n => `<p>${esc(n)}</p>`).join("")}</div>` : `<p class="simnote">Your answers were added to each topic's history. No level changes this time.</p>`}</div>
      <div class="tiles">${Object.entries(r.byDomain).map(([d,v]) => `<div class="tile"><div class="tv">${v.right}<small>/${v.total}</small></div><div class="tl">${esc(DOMAIN_SHORT[d])}</div></div>`).join("")}<div class="tile"><div class="tv">${fmtTime(r.seconds)}</div><div class="tl">Time used</div></div></div>
      <div class="section"><h3>Question review</h3><div class="review-list">`;
    s.queue.forEach((id, i) => { const item = ITEMS[id], st = s.items[id] || IS(id, s.items);
      html += `<details class="qreview"><summary><span class="${st.firstCorrect ? "ok" : "no"}">${st.firstCorrect ? "✓" : "✗"}</span> ${i+1}. ${esc(item.title)} <span class="verified">${esc(DOMAIN_SHORT[item.domain])}${st.answered ? "" : " · unanswered"}${s.flagged[id] ? " · flagged" : ""}</span></summary>
        <div class="fb-body"><div class="situation prose">${item.situation}<p><b>${esc(item.prompt)}</b></p></div>${renderEvidence(item.evidence)}${st.answered && !st.firstCorrect ? `<div><h4>Your answer</h4>${wrongBody(item, Object.assign({}, st, { lastEval:evaluate(item, st) }))}</div>` : ""}${solutionBody(item, st, false)}</div></details>`; });
    html += `</div></div><div class="actions"><button class="btn primary" data-action="open-exam">New drill</button><button class="btn" data-action="end-session">Back to campaign</button></div>`;
    return html;
  }
  const items = s.queue.map(id => s.items[id] || {}), right = items.filter(i => i.firstCorrect).length;
  const objs = [...new Set(s.queue.flatMap(id => ITEMS[id].objectives))];
  return `<div class="eyebrow"><span>${esc(sessionTitle(s))} · complete</span><span class="kind">+${S.xp - s.xpStart} XP</span></div>
    <h2 id="case-title" tabindex="-1">${right} of ${s.queue.length} correct on the first try</h2>
    <div class="section"><h3>Objectives touched</h3><ul class="objlist">${objs.map(id => `<li><span class="oid">SC-300 ${esc(id)}</span>${esc(objText(id))}<span>${pill(statusFor(id))}</span></li>`).join("")}</ul></div>
    <div class="actions"><button class="btn primary" data-action="start-practice-again">Another round</button><button class="btn" data-action="end-session">Back to campaign</button></div>`;
}
function renderBrief(){
  const m = MIS(), r = RUN();
  return `<div class="eyebrow"><span>${esc(m.code)} · about ${m.minutes} minutes</span><span class="kind">${m.boss ? "Boss mission" : "Learn mode"}</span></div>
    <h2 id="case-title" tabindex="-1">${esc(m.title)}</h2>
    ${S.profile.showStory ? `<p class="story">${m.story}</p>` : ""}
    <div class="prose"><p><b>Your goal:</b> ${esc(m.goal)}</p></div>
    <div class="brief-grid">${m.groups.map(g => `<div class="card"><div class="n">CHALLENGE ${g.n}</div><h3>${esc(g.title)}</h3><p>${esc(g.blurb)}</p></div>`).join("")}</div>
    <div class="prose"><p><b>How it works.</b> Each challenge opens with field notes (when there's something new), then a decision. You answer before anything is revealed, then see why each option works or fails. Transfer checks change the scenario to test the idea.</p>
      <ul><li><b>XP</b> rewards effort: reading, answering, correcting. Hints lower the first-try bonus but never remove XP.</li>
      <li><b>Mastery</b> is tracked separately. An objective reaches <i>Demonstrated</i> only after clean first-try answers to different questions on at least two different days.</li>
      <li><b>Confidence</b> ratings flag lucky guesses so they don't count as mastery.</li></ul>
      ${r.replay ? `<p class="callout">Replay run: XP is earned at half rate. Your answers still count as new evidence for mastery and reviews.</p>` : ""}</div>
    <div class="tags">${m.objectives.map(id => `<span class="tag">SC-300 ${esc(id)}</span>`).join("")}</div>
    <p class="simnote">${esc(C.meta.assumptions)}</p>
    <div class="actions" style="margin-top:18px"><button class="btn primary" data-action="next">Start mission →</button><button class="btn" data-action="toggle-story">${S.profile.showStory ? "Hide story text" : "Show story text"}</button><button class="btn link" data-action="hub">← Study library</button></div>`;
}
function renderDebrief(){
  const m = MIS(), r = RUN();
  const items = r.steps.filter(s => s.type === "item").map(s => ({ step:s, item:ITEMS[s.id], st:r.items[s.id] || {} }));
  const runTopics = [...new Set(items.map(i => i.item.topic))];
  const first = items.filter(i => i.st.firstCorrect).length, hints = items.reduce((a,i) => a + (i.st.hints||0), 0);
  const mins = Math.max(1, Math.round(((r.finishedAt||Date.now()) - r.startedAt)/60000));
  const over = items.filter(i => i.st.conf === "sure" && i.st.firstCorrect === false), lucky = items.filter(i => i.st.conf === "guess" && i.st.firstCorrect);
  const mv = meters(), confLabel = v => (CONF.find(c => c[0] === v) || [0,"—"])[1];
  const runMis = Object.entries(S.misconceptions).filter(([,v]) => items.some(i => i.step.id === v.item && i.st.firstCorrect !== true));
  const due = Object.entries(S.reviews).filter(([id]) => items.some(i => i.step.id === id)).sort((a,b) => a[1].due.localeCompare(b[1].due));
  const needs = m.objectives.filter(id => statusFor(id) === "Needs review");
  const next = m.next ? MISSIONS[m.next] : null;
  return `<div class="eyebrow"><span>${esc(m.code)} · Debrief</span><span class="kind">Mission complete</span></div>
    <h2 id="case-title" tabindex="-1">${esc(m.title)}: debrief <span class="stamp">FILED</span></h2>
    <div class="tiles"><div class="tile"><div class="tv">+${S.xp - r.xpStart}</div><div class="tl">XP this run</div></div><div class="tile"><div class="tv">${first}/${items.length}</div><div class="tl">Correct on first try</div></div><div class="tile"><div class="tv">${hints}</div><div class="tl">Hints used</div></div><div class="tile"><div class="tv">${mins}m</div><div class="tl">Time on mission</div></div></div>
    <div class="section"><h3>Tenant health at close</h3><div class="impact">${METER_KEYS.map(([k]) => `<span class="delta ${mv[k]>=70?"up":mv[k]<40?"down":""}">${esc(meterLabel(m,k))}: ${mv[k]}/100</span>`).join("")}</div></div>
    <div class="section"><h3>Decision log</h3><div class="tablewrap"><table class="grid log"><thead><tr><th>Step</th><th>First try</th><th>Hints</th><th>Confidence</th><th>Final</th></tr></thead><tbody>
      ${items.map(i => `<tr><td>${esc(i.item.title)}${i.step.role ? ` <span class="rtag r-${i.step.role}">${esc(ROLE_LABEL[i.step.role])}</span>` : ""}</td><td>${i.st.firstCorrect ? `<span class="ok">✓</span>` : i.st.firstCorrect === false ? `<span class="no">✗</span>` : "—"}</td><td>${i.st.hints||0}</td><td>${confLabel(i.st.conf)}</td><td>${i.st.status==="solved"?"Solved":i.st.status==="revealed"?"Studied solution":"Skipped"}</td></tr>`).join("")}</tbody></table></div></div>
    ${over.length || lucky.length ? `<div class="section"><h3>Confidence check</h3><div class="prose">${over.length ? `<p><b>Certain but wrong:</b> ${over.map(i => esc(i.item.title)).join(", ")}. These are the most valuable reviews, because confident mistakes tend to survive into the exam.</p>` : ""}${lucky.length ? `<p><b>Correct while guessing:</b> ${lucky.map(i => esc(i.item.title)).join(", ")}. These don't count toward mastery yet.</p>` : ""}</div></div>` : ""}
    <div class="section"><h3>Adaptive training</h3><ul class="objlist">${runTopics.map(t => `<li><span class="oid">Topic ${esc(t)}</span>${esc(topicName(t))}<span>${levelChip(t)}</span></li>`).join("")}</ul>
      ${(r.notices || []).length ? `<div class="adapt">${[...new Set(r.notices)].slice(-4).map(n => `<p>${esc(n)}</p>`).join("")}</div>` : `<p class="simnote">Your levels update from first-try answers. Support and stretch challenges appear when they'd help.</p>`}</div>
    <div class="section"><h3>Objectives</h3><ul class="objlist">${m.objectives.map(id => `<li><span class="oid">SC-300 ${esc(id)}</span>${esc(objText(id))}<span>${pill(statusFor(id))}</span></li>`).join("")}</ul>
      <p class="simnote" style="margin-top:10px">Demonstrated needs first-time, clean answers (no hints, retries or guesses) to at least two different scenarios on at least two different days, including a deeper question where one exists. Repeating a question you've already seen earns practice XP but never counts as new evidence.</p></div>
    ${runMis.length ? `<div class="section"><h3>Misconceptions logged</h3><ul class="prose">${runMis.map(([k,v]) => `<li>${esc(k)} <span class="verified">(${v.count}×)</span></li>`).join("")}</ul></div>` : ""}
    <div class="section"><h3>Key takeaways</h3><ul class="prose">${(m.takeaways||[]).map(t => `<li>${t}</li>`).join("")}</ul></div>
    <div class="section"><h3>Review schedule</h3><div class="tablewrap"><table class="grid log"><thead><tr><th>Item</th><th>Due</th><th>Why</th></tr></thead><tbody>${due.map(([,v]) => `<tr><td>${esc(v.title)}</td><td>${esc(v.due)}</td><td>${esc(v.reason)}</td></tr>`).join("")}</tbody></table></div></div>
    <div class="section"><h3>Next recommended</h3><div class="callout">${needs.length ? `<p style="margin:0 0 8px"><b>First:</b> a review session on or after ${esc(addDays(1))} for ${needs.map(objText).map(esc).join("; ")}. It will use different scenarios.</p>` : ""}<p style="margin:0">${next ? `<b>${esc(next.code)} · ${esc(next.title)}</b>: ${esc(next.goal)}` : "You've reached the end of the campaign. Exam drills and reviews keep it fresh."}</p></div></div>
    <div class="actions">${next ? `<button class="btn primary" data-action="open-mission" data-mid="${next.id}">Start ${esc(next.code)} →</button>` : `<button class="btn primary" data-action="open-exam">Exam drill</button>`}<button class="btn" data-action="replay">Replay mission</button><button class="btn" data-action="hub">Study library</button><button class="btn" data-action="copy-checkpoint">Chat checkpoint</button></div>`;
}
function renderCase(){
  const el = $("#case");
  document.querySelector("main.app").classList.toggle("wide", S.view.screen === "ops");
  el.classList.toggle("opsview", S.view.screen === "ops");
  if (S.view.screen === "ops"){ window.IDLab.render(el); return; }
  if (S.view.screen === "hub") el.innerHTML = renderHub();
  else if (S.view.screen === "mission"){ const s = curStep(); el.innerHTML = s.type === "brief" ? renderBrief() : s.type === "debrief" ? renderDebrief() : renderMissionItem(s); }
  else if (S.view.screen === "session") el.innerHTML = S.session.finished ? renderSessionSummary() : renderSessionItem();
  startExamTimer();
}
function renderAll(){ renderTop(); renderRail(); renderCase(); }
function focusTitle(){
  const t = $("#case-title"); if (!t) return;
  t.focus({ preventScroll:true });
  const r = t.getBoundingClientRect();
  if (r.top < 70 || r.bottom > window.innerHeight) window.scrollTo({ top:Math.max(0, window.scrollY + $("#case").getBoundingClientRect().top - 84), behavior: reduceMotion() ? "auto" : "smooth" });
}
function focusFeedback(){ const f = $("#fb-title"); if (f){ f.focus({ preventScroll:true }); f.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block:"start" }); } }
function startExamTimer(){
  clearInterval(examTimer);
  const s = S.session;
  if (!(S.view.screen === "session" && s && s.kind === "exam" && s.timed && !s.finished)) return;
  const tick = () => { const left = s.durationSec - (Date.now() - s.startedAt)/1000; const el = $("#examclock"); if (el){ el.textContent = "⏱ " + fmtTime(left) + " left"; el.classList.toggle("low", left < 120); } if (left <= 0) finishExam(true); };
  tick(); examTimer = setInterval(tick, 1000);
}
function refreshControls(){
  const id = currentItemId(); if (!id) return;
  const item = ITEMS[id], st = IS(id);
  if (item.type === "config"){
    item.fields.forEach(f => { const fs = $("#field-"+f.id); if (!fs) return; fs.hidden = !(!f.showIf || f.showIf.in.includes(st.fields[f.showIf.field])); $$(".opt", fs).forEach(l => l.classList.toggle("sel", l.querySelector("input").checked)); });
    const p = $("#cfg-preview"); if (p) p.innerHTML = previewHtml(item, st);
  } else $$("#case .opts .opt").forEach(l => l.classList.toggle("sel", l.querySelector("input").checked));
  $$("#case .conf label").forEach(l => l.classList.toggle("sel", l.querySelector("input").checked));
  const b = $("#submit-btn"); if (b) b.disabled = !canSubmit(item, st);
  const n = $("#submit-note"); if (n) n.textContent = mode() === "exam" ? (answerComplete(item, st) ? "Answer saved." : "Answers save as you choose.") : submitReason(item, st);
  if (mode() === "exam"){ const bar = $("#case .exambar"); if (bar){ bar.outerHTML = examBar(); startExamTimer(); } renderRail(); }
}

/* ---------- Learner profile, export, import ---------- */
function coverage(){
  const byDomain = {};
  C.curriculum.forEach(d => byDomain[d.name] = { "Not started":0, "Learning":0, "Needs review":0, "Demonstrated":0 });
  const list = OBJ_LIST.map(o => { const s = statusFor(o.id); byDomain[o.domainName][s]++; return { id:o.id, objective:o.text, status:s }; });
  return { byDomain, objectives:list };
}
function nextRecommendedText(){ const r = recommended(); return r.label; }
function learnerProfile(){
  const cov = coverage();
  return { examTargetDate:S.profile.examDate || null,
    studyPreferences:{ experience:S.profile.experience, studyTime:S.profile.studyTime || null, sessionLength:S.profile.sessionLength, storyText:S.profile.showStory, missionClock:S.profile.showClock },
    totals:{ xp:S.xp, level:level(S.xp).n, missionsCompleted:S.completed, daysStudied:S.days.length, achievements:Object.keys(S.achievements) },
    curriculumCoverage:cov.byDomain,
    difficultyMode:S.profile.difficultyMode,
    topicLevels:TOPICS.map(t => { const T = S.topics[t.id]; return { topic:t.id, name:t.name, level:T ? LEVEL_NAMES[T.level] : "Not started", placed:!!(T && T.placed), guided:!!(T && T.support), recentStrength:strengthOf(t.id) }; }),
    recommendedPractice:recommendedTopics(3).map(t => t+" "+topicName(t)),
    demonstratedSkills:cov.objectives.filter(o => o.status === "Demonstrated").map(o => o.id+" "+o.objective),
    learning:cov.objectives.filter(o => o.status === "Learning").map(o => o.id+" "+o.objective),
    weakAreas:cov.objectives.filter(o => o.status === "Needs review").map(o => o.id+" "+o.objective),
    misconceptions:Object.entries(S.misconceptions).map(([k,v]) => ({ misconception:k, count:v.count, last:v.last, objectives:v.objectives })),
    reviewItems:Object.entries(S.reviews).map(([id,v]) => ({ item:id, title:v.title, due:v.due, reason:v.reason })),
    recentResults:S.results.slice(-5), recentExamDrills:S.exams.slice(-5),
    nextRecommendedMission:nextRecommendedText(), curriculumVersion:C.meta.studyGuide, contentVersion:C.meta.version };
}
function exportJSON(){ return JSON.stringify({ type:"identity-defender-progress", schema:SCHEMA, exportedAt:new Date().toISOString(), learnerProfile:learnerProfile(), state:S }, null, 2); }
function checkpointText(){
  const p = learnerProfile(), cov = p.curriculumCoverage, short = x => x.split(" ")[0];
  const done = Object.entries(p.totals.missionsCompleted).filter(([,v]) => v).map(([k]) => k);
  const lastExam = p.recentExamDrills[p.recentExamDrills.length-1];
  return [
    "IDENTITY DEFENDER CHECKPOINT · "+localDate()+" · content "+C.meta.version+" · "+C.meta.studyGuide,
    "Exam date: "+(p.examTargetDate || "not set")+" | Experience: "+p.studyPreferences.experience+" | Study time: "+(p.studyPreferences.studyTime || "not set"),
    "XP "+p.totals.xp+" (Lv "+p.totals.level+") | Days studied: "+p.totals.daysStudied+" | Missions completed ("+done.length+"/"+MISSION_ORDER.length+"): "+(done.join(", ") || "none"),
    "Coverage: "+Object.entries(cov).map(([d,c]) => d.replace(/^(Implement and manage |Implement |Plan and implement |Plan and automate )/,"")+" "+(c.Learning+c["Needs review"]+c.Demonstrated)+"/"+(c["Not started"]+c.Learning+c["Needs review"]+c.Demonstrated)+" touched, "+c.Demonstrated+" demonstrated").join("; "),
    "Difficulty: "+(p.difficultyMode === "adaptive" ? "Adaptive" : "Fixed "+LEVEL_NAMES[+p.difficultyMode])+" | Topic levels: "+p.topicLevels.filter(t => t.level !== "Not started").map(t => t.topic+" "+t.level[0]+(t.guided?"(guided)":"")).join(", "),
    "Ops workspace: "+Object.entries((S.lab && S.lab.missions) || {}).map(([k,m]) => k.toUpperCase()+" solved "+m.completed+"x, best level "+(["none","Guided","Standard","Advanced"][m.best || 0])).join("; ") + (Object.keys((S.lab && S.lab.missions) || {}).length ? "" : "not started"),
    "Recommended practice: "+p.recommendedPractice.join("; "),
    "Learning: "+(p.learning.map(short).join(", ") || "none"),
    "Needs review: "+(p.weakAreas.map(short).join(", ") || "none"),
    "Demonstrated: "+(p.demonstratedSkills.map(short).join(", ") || "none"),
    "Misconceptions: "+(p.misconceptions.slice(-8).map(m => m.misconception+" ("+m.count+"x)").join("; ") || "none"),
    "Reviews due: "+(Object.entries(S.reviews).filter(([,r]) => r.due <= addDays(3)).map(([id,r]) => id+" "+r.due).slice(0,12).join(", ") || "none in the next 3 days"),
    "Last mission: "+(p.recentResults.length ? (r => r.mission+" "+r.date+" first-try "+r.firstTry+"/"+r.total+", hints "+r.hints)(p.recentResults[p.recentResults.length-1]) : "none")+" | Last drill: "+(lastExam ? lastExam.date+" "+lastExam.right+"/"+lastExam.total+" ("+lastExam.pct+"%)" : "none"),
    "Next: "+p.nextRecommendedMission
  ].join("\n");
}
async function copyText(text, msgEl, ta){
  try { await navigator.clipboard.writeText(text); if (msgEl){ msgEl.className = "msg ok"; msgEl.textContent = "Copied to clipboard."; } else toast("Copied to clipboard"); }
  catch(e){ if (ta){ ta.focus(); ta.select(); } if (msgEl){ msgEl.className = "msg err"; msgEl.textContent = "Couldn't copy automatically. The text is selected, so press Ctrl+C (or ⌘C)."; } }
}
function importJSON(text){
  let d; try { d = JSON.parse(text); } catch(e){ return "That isn't valid JSON. Paste the full export, starting with {."; }
  const st = d && d.type === "identity-defender-progress" ? d.state : (d && d.schema ? d : null);
  const m = migrate(st);
  if (!m) return "This doesn't look like an Identity Defender export.";
  S = m; save(); renderAll(); return null;
}

/* ---------- Modals ---------- */
function openModal(title, html){
  lastFocus = document.activeElement;
  $("#modal-title").textContent = title; $("#modal-body").innerHTML = html; $("#backdrop").hidden = false;
  const f = $("#modal-body button, #modal-body input, #modal-body textarea, #modal-body select, #modal-body summary") || $("#backdrop [data-action=close-modal]");
  f.focus();
}
function closeModal(){ if ($("#backdrop").hidden) return; $("#backdrop").hidden = true; $("#modal-body").innerHTML = ""; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }
function curriculumHtml(){
  const cov = coverage();
  return `<p class="simnote">Every objective from the official study guide (${esc(C.meta.studyGuide)}), checked ${esc(C.meta.verified)}. <a href="${esc(C.meta.studyGuideUrl)}" target="_blank" rel="noopener">Open the study guide</a>. Tags show the missions that cover each objective.</p>` +
    C.curriculum.map((d, di) => { const c = cov.byDomain[d.name], total = d.groups.reduce((a,g) => a + g.items.length, 0);
      return `<details class="domain" ${di===0?"open":""}><summary>${esc(d.name)} (${esc(d.weight)})<span>${c.Learning+c["Needs review"]+c.Demonstrated}/${total} touched · ${c.Demonstrated} demonstrated</span></summary>` +
        d.groups.map(g => `<div class="sub">${esc(g.name)}</div><ul>${g.items.map(([id,t]) => `<li><span><span class="oid mono">${esc(id)}</span> ${esc(t)} ${[...(OBJ_MISSIONS[id]||[])].sort((a,b) => MISSION_ORDER.indexOf(a)-MISSION_ORDER.indexOf(b)).map(mid => `<span class="m">${esc(mid)}</span>`).join("")}</span>${pill(statusFor(id))}</li>`).join("")}</ul>`).join("") + `</details>`; }).join("");
}
function progressHtml(){
  return `<div><h3>Chat checkpoint</h3><p class="simnote">Paste this into a new conversation so your coach knows where you are.</p><textarea class="io" id="cp-text" readonly>${esc(checkpointText())}</textarea><div class="actions" style="margin-top:8px"><button class="btn" data-action="copy-cp">Copy checkpoint</button><span class="msg" id="cp-msg" role="status"></span></div></div>
    <div><h3>Export backup (JSON)</h3><p class="simnote">Full learner profile plus game state. Save it in a text file to move between devices or game versions. Downloads are blocked inside this page, so copy it instead.</p><textarea class="io" id="ex-text" readonly>${esc(exportJSON())}</textarea><div class="actions" style="margin-top:8px"><button class="btn" data-action="copy-ex">Copy JSON</button><span class="msg" id="ex-msg" role="status"></span></div></div>
    <div><h3>Import backup</h3><p class="simnote">Paste an export (from this version or v0.1), or choose a .json file. This replaces the progress in this browser.</p><textarea class="io" id="im-text" placeholder='{"type":"identity-defender-progress", …}'></textarea>
      <div class="actions" style="margin-top:8px"><label class="btn" for="im-file">Choose file…</label><input type="file" id="im-file" accept=".json,application/json,text/plain" class="sr-only"><button class="btn primary" data-action="do-import">Load progress</button><span class="msg" id="im-msg" role="status"></span></div></div>
    <div><h3>Reset</h3><p class="simnote">Erases XP, mastery records, reviews and achievements from this browser. Export first if you might want them back.</p><div class="actions" id="reset-area"><button class="btn danger" data-action="reset-ask">Reset all progress…</button></div></div>
    <p class="simnote">Storage: ${storageOk ? "progress is kept in this browser's local storage. It stays on this device and browser only, and can be cleared by the browser." : "local storage isn't available in this view, so export before closing."}</p>`;
}
function settingsHtml(){
  const p = S.profile, exp = ["Not set (beginner defaults)","New to Entra / Azure / Microsoft 365","Some admin experience","Daily Entra administrator"];
  return `<div class="formrow"><label for="pf-exam">Exam target date</label><input type="date" id="pf-exam" value="${esc(p.examDate)}"></div>
    <div class="formrow"><label for="pf-exp">Experience</label><select id="pf-exp">${exp.map(e => `<option ${e===p.experience?"selected":""}>${esc(e)}</option>`).join("")}</select></div>
    <div class="formrow"><label for="pf-time">Study time available</label><input type="text" id="pf-time" placeholder="e.g. 15 min on weekdays" value="${esc(p.studyTime)}"></div>
    <div class="formrow"><label for="pf-diff">Training difficulty</label><select id="pf-diff">${[["adaptive","Adaptive (default): adjusts per topic"],["1","Beginner for all topics"],["2","Intermediate for all topics"],["3","Advanced for all topics"]].map(([v,l]) => `<option value="${v}" ${String(p.difficultyMode)===v?"selected":""}>${l}</option>`).join("")}</select></div>
    <label class="check" for="pf-story"><input type="checkbox" id="pf-story" ${p.showStory?"checked":""}> Show story text</label>
    <label class="check" for="pf-clock"><input type="checkbox" id="pf-clock" ${p.showClock?"checked":""}> Show optional mission clock (no time limits)</label>
    <p class="simnote">Modes: Learn (missions, hints, explanations after each decision), Practice and Review (feedback after each submission), Exam drill (optional timer, fixed difficulty and topic mix, explanations after finishing). Adaptive mode adds support, return and stretch challenges and picks practice questions at each topic's level. Fixed levels apply to practice and reviews; missions keep their story questions.</p>
    <div class="actions"><button class="btn primary" data-action="save-settings">Save settings</button><span class="msg" id="pf-msg" role="status"></span></div>`;
}
function examSetupHtml(){
  return `<p class="simnote">Questions are drawn across all four domains in proportion to the official weights. You can move between questions and flag them; explanations appear after you finish.</p>
    <div class="formrow"><label for="ex-n">Number of questions</label><select id="ex-n">${[10,20,40,60].map(n => `<option value="${n}" ${n===20?"selected":""}>${n}</option>`).join("")}</select></div>
    <label class="check" for="ex-timed"><input type="checkbox" id="ex-timed" checked> Timed (90 seconds per question)</label>
    <p class="simnote">Practice results are learning indicators, not a prediction of your exam score.</p>
    <div class="actions"><button class="btn primary" data-action="start-exam">Start drill</button></div>`;
}

/* ---------- Events ---------- */
const actions = {
  submit, retry, reveal, hint, next:nextStep, replay:replayMission, hub:openHub,
  "nav-hub":openHub, "nav-ops":openOps,
  go: t => goStep(+t.dataset.idx),
  move: t => moveStep(t),
  "open-mission": t => { const mid = t.dataset.mid; openMission(mid, t.dataset.fresh === "1"); },
  "toggle-story": () => { S.profile.showStory = !S.profile.showStory; save(); renderCase(); },
  "start-practice": () => startSession("practice", { domain:($("#pr-domain") || {}).value || "ALL", n:10 }),
  "start-practice-again": () => startSession(S.session && S.session.kind === "review" ? "review" : "practice", { domain:(S.session && S.session.domain) || "ALL", topic:S.session && S.session.topic, n:S.session && S.session.topic ? 6 : 10 }),
  "start-review": () => startSession("review"),
  "practice-topic": t => startSession("practice", { topic:t.dataset.topic, n:6 }),
  "open-exam": () => openModal("Exam drill", examSetupHtml()),
  "start-exam": () => startSession("exam", { n:+$("#ex-n").value, timed:$("#ex-timed").checked }),
  "session-go": t => sessionGo(+t.dataset.idx),
  "session-next": sessionNext,
  "end-session": endSession,
  flag: () => { const s = S.session, id = s.queue[s.idx]; s.flagged[id] = !s.flagged[id]; save(); renderCase(); renderRail(); const b = $("#case [data-action=flag]"); if (b) b.focus(); },
  "finish-ask": () => { const s = S.session, un = s.queue.filter(id => { const st = s.items[id], it = ITEMS[id]; return !(st && (it.type === "order" ? st.touched : answerComplete(it, st))); }).length;
    $("#finish-area").innerHTML = `<div class="callout" style="margin-top:12px"><p style="margin:0 0 8px">${un ? `${un} question${un===1?" is":"s are"} unanswered and will count as incorrect.` : "All questions answered."} Finish the drill?</p><div class="actions"><button class="btn primary" data-action="finish-yes">Finish and see results</button><button class="btn" data-action="finish-no">Keep working</button></div></div>`;
    $("#finish-area [data-action=finish-yes]").focus(); },
  "finish-yes": () => finishExam(false),
  "finish-no": () => { $("#finish-area").innerHTML = ""; },
  "open-curriculum": () => openModal("SC-300 curriculum", curriculumHtml()),
  "open-progress": () => openModal("Progress, backup and reset", progressHtml()),
  "open-settings": () => openModal("Settings and learner profile", settingsHtml()),
  "copy-checkpoint": () => openModal("Progress, backup and reset", progressHtml()),
  "close-modal": closeModal,
  "copy-cp": () => copyText($("#cp-text").value, $("#cp-msg"), $("#cp-text")),
  "copy-ex": () => copyText($("#ex-text").value, $("#ex-msg"), $("#ex-text")),
  "do-import": () => { const err = importJSON($("#im-text").value.trim()), m = $("#im-msg"); if (err){ m.className = "msg err"; m.textContent = err; } else { m.className = "msg ok"; m.textContent = "Progress loaded."; $("#cp-text").value = checkpointText(); $("#ex-text").value = exportJSON(); } },
  "reset-ask": () => { $("#reset-area").innerHTML = `<span class="msg err">This can't be undone.</span><button class="btn danger solid" data-action="reset-yes">Yes, erase my progress</button><button class="btn" data-action="reset-no">Keep my progress</button>`; $("#reset-area [data-action=reset-no]").focus(); },
  "reset-no": () => { $("#reset-area").innerHTML = `<button class="btn danger" data-action="reset-ask">Reset all progress…</button>`; },
  "reset-yes": () => { S = defaultState(); save(); closeModal(); renderAll(); focusTitle(); toast("Progress reset"); },
  "save-settings": () => { const p = S.profile; p.examDate = $("#pf-exam").value; p.experience = $("#pf-exp").value; p.studyTime = $("#pf-time").value.trim(); p.showStory = $("#pf-story").checked; p.showClock = $("#pf-clock").checked; p.difficultyMode = $("#pf-diff").value;
    save(); renderAll(); const m = $("#pf-msg"); m.className = "msg ok"; m.textContent = "Saved."; }
};
document.addEventListener("click", e => {
  const t = e.target.closest("[data-action]"); if (!t || t.disabled) return;
  const fn = actions[t.dataset.action]; if (fn){ e.preventDefault(); fn(t, e); }
});
$("#backdrop").addEventListener("click", e => { if (e.target.id === "backdrop") closeModal(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#backdrop").hidden){ closeModal(); return; }
  if (!$("#backdrop").hidden && e.key === "Tab"){
    const f = $$("#backdrop button, #backdrop input, #backdrop textarea, #backdrop select, #backdrop a[href], #backdrop summary, #backdrop label[for=im-file]").filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length-1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length-1]){ e.preventDefault(); f[0].focus(); }
  }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "im-file" && t.files && t.files[0]){ const r = new FileReader(); r.onload = () => { $("#im-text").value = String(r.result); $("#im-msg").className = "msg"; $("#im-msg").textContent = "File read. Select Load progress to apply it."; }; r.readAsText(t.files[0]); return; }
  if (t.id === "pr-diff"){ S.profile.difficultyMode = t.value; save(); renderAll(); const el = $("#pr-diff"); if (el) el.focus(); return; }
  if (!t.closest("#case")) return;
  const id = currentItemId(); if (!id) return;
  const item = ITEMS[id], st = IS(id), md = mode();
  if (st.status !== "open" && md !== "exam") return;
  if (md === "exam" && S.session.finished) return;
  if (t.name === "opt") st.sel = $$('#case input[name="opt"]:checked').map(x => x.value);
  else if (t.name && t.name.startsWith("field-")){
    st.fields[t.name.slice(6)] = t.value;
    item.fields.forEach(f => { if (f.showIf && !f.showIf.in.includes(st.fields[f.showIf.field])) delete st.fields[f.id]; });
    item.fields.forEach(f => { if (!st.fields[f.id]) $$(`#case input[name="field-${f.id}"]`).forEach(i => i.checked = false); });
  } else if (t.name === "conf") st.conf = t.value;
  save(); refreshControls();
});

/* ---------- Boot ---------- */
function start(data){
  S = (data && (data.schema === SCHEMA || data.schema === 1)) ? (migrate(data) || load() || defaultState()) : (load() || defaultState());
  save(); renderAll();
  try { window.claude?.hot?.snapshot(() => S); } catch(e){}
}
window.__ID = { get state(){ return S; }, save, award, toast, renderTop, renderAll, markDay, openLibrary:openHub, openOps, ITEMS, MISSIONS, MISSION_ORDER, TOPIC_ITEMS, ADAPT, statusFor, evaluate, exportJSON, importJSON, checkpointText, buildExam, buildReview, buildPractice, topicState, adaptRecord, pickItem, recordEvidence };
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
})();
