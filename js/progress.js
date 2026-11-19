/* Identity Defender · save bridge.
   Shares the study library's save (localStorage "identityDefender.v1", schema 3). The game stores its own state under
   S.lab.game and queues learning evidence in S.lab.inbox; the study library's engine turns that inbox into mastery
   evidence and topic difficulty the next time it opens (it owns those rules). */
(function () {
"use strict";
const KEY = "identityDefender.v1";
let storageOk = true, S = null;
function localDate(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function fresh(){
  return { schema:3, appVersion:"3.0.0", createdAt:new Date().toISOString(), xp:0,
    profile:{ difficultyMode:"adaptive", showStory:true, showClock:false },
    topics:{}, adaptLog:[], evidence:[], misconceptions:{}, reviews:{}, results:[], completed:{}, runs:{}, view:{ screen:"hub" }, session:null,
    achievements:{}, days:[], stats:{ corrections:0, certainCorrect:0, reviews:0, exams:0 }, exams:[] };
}
function ensure(s){
  if (!s.lab || typeof s.lab !== "object") s.lab = {};
  const L = s.lab;
  L.seen = L.seen || {}; L.missions = L.missions || {}; L.inbox = Array.isArray(L.inbox) ? L.inbox : [];
  L.introduced = true;
  L.game = L.game || { tutorialDone:false, settings:{ motion:"system", labels:true }, run:null };
  L.game.settings = Object.assign({ motion:"system", labels:true }, L.game.settings || {});
  L.missions.gates = L.missions.gates || { completed:0, levelsDone:{}, predUsed:[], best:0, history:[] };
  if (s.view && s.view.screen === "ops") s.view = { screen:"hub" };
  return s;
}
function load(){
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e){ storageOk = false; }
  let s = null;
  if (raw){ try { s = JSON.parse(raw); } catch (e){ s = null; } }
  // Older schemas are upgraded by the study library; keep them intact here and only add the game's own fields.
  if (!s || typeof s !== "object") s = fresh();
  S = ensure(s);
  save();
  return S;
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; } catch (e){ storageOk = false; } }
function markDay(){ S.days = Array.isArray(S.days) ? S.days : []; const t = localDate(); if (!S.days.includes(t)) S.days.push(t); }
function award(n){ S.xp = (S.xp || 0) + n; save(); return n; }
function queue(ev){ S.lab.inbox.push(Object.assign({ date:localDate() }, ev)); if (S.lab.inbox.length > 200) S.lab.inbox = S.lab.inbox.slice(-200); save(); }
/* Level for the Conditional Access topic (2.2): fixed setting, else the adaptive topic level, else Guided. */
function levelFor(){
  const mode = S.profile && S.profile.difficultyMode;
  if (mode && mode !== "adaptive" && [1,2,3].includes(+mode)) return +mode;
  const T = S.topics && S.topics["2.2"];
  let lvl = T && T.placed ? T.level : 1;
  // Game evidence not yet processed by the library: a clean, unhinted solve plus a correct prediction suggests the next level.
  const h = S.lab.missions.gates.history || [];
  const last = h[h.length - 1];
  if (last && last.level >= lvl && last.clean && last.predOk && lvl < 3) lvl = last.level + 1;
  return Math.max(1, Math.min(3, lvl || 1));
}
function level(xp){ let n = 1, base = 0, need = 100; while (xp >= base + need){ base += need; n++; need = 100 + (n-1)*50; } return { n, into:xp-base, need }; }
window.IDSave = { load, save, award, queue, levelFor, markDay, level, get state(){ return S; }, get ok(){ return storageOk; }, localDate, KEY };
})();
