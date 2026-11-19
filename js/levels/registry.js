/* Identity Defender · mission registry. Each mission file calls ID_LEVELS.register(def).
   Missions are pure data + logic (no Phaser), so the study library can load them to know their evidence items. */
(function () {
"use strict";
const C = window.ID_CONTENT = window.ID_CONTENT || { items:{} };
const LV = ["", "Guided", "Standard", "Advanced"];
const defs = {}, order = [];
function register(def){
  defs[def.id] = def; order.push(def.id); order.sort((a, b) => defs[a].order - defs[b].order);
  // Hidden evidence items: the solve (difficulty signal) and each prediction (mastery evidence). Never served as questions.
  [1, 2, 3].forEach(l => {
    const id = `lab-${def.itemKey || def.id}-solve-${l}`;
    if (!C.items[id]) C.items[id] = { lab:true, kind:"Game mission", type:"lab", title:`${def.title} (${LV[l]})`, obj:def.objectives.slice(), difficulty:l, hints:["—"], exp:"—", sit:"—", src:(def.srcKeys || []).slice(0, 1) };
  });
  (def.predictionIds || []).forEach(p => {
    const id = `lab-${def.itemKey || def.id}-predict-${p}`;
    if (!C.items[id]) C.items[id] = { lab:true, kind:"Prediction", type:"lab", title:`${def.title}: predict ${p}`, obj:(def.predictObjectives || def.objectives).slice(), difficulty:2, hints:["—"], exp:"—", sit:"—", src:(def.srcKeys || []).slice(0, 1) };
  });
}
/* small helpers shared by missions */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const get = (o, path) => path.split(".").reduce((x, k) => x == null ? x : x[k], o);
function set(o, path, v){ const ks = path.split("."); let x = o; while (ks.length > 1){ const k = ks.shift(); if (x[k] == null) x[k] = {}; x = x[k]; } x[ks[0]] = v; }
window.ID_LEVELS = { register, defs, order, LV, esc, clone, get, set };
})();
