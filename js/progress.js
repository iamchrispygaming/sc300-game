/* Identity Defender · save bridge.
   Shares the study library's save (localStorage "identityDefender.v1", schema 3). Game state lives in S.lab.game;
   learning evidence is queued in S.lab.inbox and applied by the study library's engine, which owns the mastery rules. */
(function () {
"use strict";
const KEY = "identityDefender.v1";
let storageOk = true, S = null;
function localDate(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function fresh(){
  return { schema:3, appVersion:"3.1.0", createdAt:new Date().toISOString(), xp:0,
    profile:{ difficultyMode:"adaptive", showStory:true, showClock:false },
    topics:{}, adaptLog:[], evidence:[], misconceptions:{}, reviews:{}, results:[], completed:{}, runs:{}, view:{ screen:"hub" }, session:null,
    achievements:{}, days:[], stats:{ corrections:0, certainCorrect:0, reviews:0, exams:0 }, exams:[] };
}
const blankLevel = () => ({ completed:0, levelsDone:{}, predUsed:[], best:0, history:[], adaptSent:[] });
function ensure(s){
  if (!s.lab || typeof s.lab !== "object") s.lab = {};
  const L = s.lab;
  L.seen = L.seen || {}; L.missions = L.missions || {}; L.inbox = Array.isArray(L.inbox) ? L.inbox : []; L.introduced = true;
  const G = L.game = L.game || {};
  G.settings = Object.assign({ motion:"system", labels:true }, G.settings || {});
  G.levels = G.levels || {}; G.runs = G.runs || {};
  // v3.0 kept one mission's progress in lab.missions.gates and lab.game.run: move it under the per-mission keys
  if (L.missions.gates && !G.levels.gates){ G.levels.gates = Object.assign(blankLevel(), L.missions.gates); }
  if (G.run && !G.runs.gates){ G.runs.gates = G.run; }
  delete G.run;
  if (s.view && s.view.screen === "ops") s.view = { screen:"hub" };
  return s;
}
function load(){
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e){ storageOk = false; }
  let s = null;
  if (raw){ try { s = JSON.parse(raw); } catch (e){ s = null; } }
  if (!s || typeof s !== "object") s = fresh();
  S = ensure(s); save(); return S;
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; } catch (e){ storageOk = false; } }
function markDay(){ S.days = Array.isArray(S.days) ? S.days : []; const t = localDate(); if (!S.days.includes(t)) S.days.push(t); }
function award(n){ S.xp = (S.xp || 0) + n; save(); return n; }
function queue(ev){ S.lab.inbox.push(Object.assign({ date:localDate() }, ev)); if (S.lab.inbox.length > 300) S.lab.inbox = S.lab.inbox.slice(-300); save(); }
function levelState(id){ const G = S.lab.game; return G.levels[id] || (G.levels[id] = blankLevel()); }
function savedRun(id){ return S.lab.game.runs[id] || null; }
function saveRun(id, r){ if (r) S.lab.game.runs[id] = r; else delete S.lab.game.runs[id]; save(); }
function setCurrent(id){ S.lab.game.current = id; save(); }
/* Where to start: the mission played last, else the first mission not yet completed */
function currentLevel(){
  const L = window.ID_LEVELS, G = S.lab.game;
  if (G.current && L.defs[G.current]) return G.current;
  return L.order.find(id => !(G.levels[id] && G.levels[id].completed)) || L.order[0];
}
function forceLevel(id, lvl){ levelState(id).forced = lvl; save(); }
/* Difficulty for a mission: one-off choice ("Try Advanced"), fixed setting, adaptive topic level, else Guided. */
function levelFor(def){
  const st = levelState(def.id);
  if (st.forced){ const f = st.forced; delete st.forced; save(); return f; }
  const mode = S.profile && S.profile.difficultyMode;
  if (mode && mode !== "adaptive" && [1,2,3].includes(+mode)) return +mode;
  const T = S.topics && S.topics[def.topic];
  let lvl = T && T.placed ? T.level : 1;
  // Game evidence the library hasn't processed yet: a clean solve plus a correct prediction steps up one level.
  const last = (st.history || [])[st.history.length - 1];
  if (last && last.level >= lvl && last.clean && last.predOk && lvl < 3) lvl = last.level + 1;
  return Math.max(1, Math.min(3, lvl || 1));
}
function level(xp){ let n = 1, base = 0, need = 100; while (xp >= base + need){ base += need; n++; need = 100 + (n-1)*50; } return { n, into:xp-base, need }; }
window.IDSave = { load, save, award, queue, levelFor, levelState, savedRun, saveRun, setCurrent, currentLevel, forceLevel, markDay, level, localDate, KEY,
  get state(){ return S; }, get ok(){ return storageOk; } };
})();
