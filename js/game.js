"use strict";
/* =====================================================================
   ИГРОВАЯ ЛОГИКА: состояние, экономика, поле, соединение котов,
   бустеры, ресурсы миров, задания, события, престиж, сохранение.
   ===================================================================== */

/* ---------- форматирование (понятно для всех возрастов) ---------- */
function fmt(n){
  n = Math.floor(n || 0);
  if (n < 10000) return n.toLocaleString(LANG === "en" ? "en-US" : "ru-RU");
  const u = [[1e12,T("трлн")],[1e9,T("млрд")],[1e6,T("млн")],[1e3,T("тыс")]];
  for (const [v,s] of u) if (n >= v){ const x = n/v; return (x < 100 ? x.toFixed(1).replace(".0","").replace(".", DEC()) : Math.floor(x)) + " " + s; }
  return String(n);
}
function fmtSec(s){
  s = Math.max(0, Math.ceil(s));
  if (s < 60) return `${s} ${T("сек")}`;
  const m = Math.floor(s/60), r = s%60;
  if (m < 60) return r ? `${m} ${T("мин")} ${r} ${T("сек")}` : `${m} ${T("мин")}`;
  const h = Math.floor(m/60), mm = m%60;
  return mm ? `${h} ${T("ч")} ${mm} ${T("мин")}` : `${h} ${T("ч")}`;
}
function fmtClock(s){ s = Math.max(0, Math.ceil(s)); const m = Math.floor(s/60); return `${m}:${String(s%60).padStart(2,"0")}`; }
const now = () => Date.now();
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

/* ---------- состояние ---------- */
function newWorldState(w){
  return { grid:new Array(CONFIG.cells).fill(0), boxes:2, boxTimer:0, autoTimer:0, bought:0, shopLv:1, coins:0,
    upg:Object.fromEntries(UPGRADES.map(u=>[u.id,0])),
    found:new Array(CONFIG.levels).fill(false).map((_,i)=>i===0), done:false,
    res:0, resort:[0,0,0,0,0], genUntil:0, genTimer:0, food:null, nip:{} };
}
function defaultState(){
  return {
    v:3, coins:0, paws:0, crystals:0, world:0, unlocked:1,
    W:[newWorldState(0)], album:{0:true}, favorite:0,
    boost:{food:1, spray:1, nip:1, wild:0, lucky:1},
    turboUntil:0, freeBoxAt:0, eventAdAt:0, boostAdAt:0,
    cos:{owned:{}, on:""},
    premium:false, iapOnce:{},
    offlineLv:0,
    prestige:{count:0, upg:Object.fromEntries(PRESTIGE_UPG.map(u=>[u.id,0]))},
    runEarned:0,
    daily:{day:0, last:""}, bonusDay:"",
    quests:{date:"", list:[], chest:false},
    weekly:{week:0, score:0, claimed:[false,false,false]},
    ev:{id:"", amt:0},
    friends:{code:"", invitedBy:"", list:[]},
    set:{sound:true, music:true, vibro:true, big:false},
    stats:{merges:0, earned:0, boxes:0, ads:0, bought:0, taps:0},
    tutorial:0, tips:{}, lastSeen:now(), savedAt:0, resetEpoch:"", wasReset:false,
  };
}
let S = defaultState();
let born = new Array(CONFIG.cells).fill(0);
let combo = {n:0, last:0};
let aim = null;              // выбранный бустер, который ждёт нажатия на поле (food / spray / nip)
const FOOD = 98;             // миска с кормом на клетке

const curW = () => S.world;
const W = () => S.W[S.world];
const WD = () => WORLDS[S.world];
const mult = (w=S.world) => WORLDS[w].mult;

/* ---------- экономика ---------- */
function boxIntervalFor(w, lvl){
  const base = Math.max(CONFIG.boxMinInterval, WORLDS[w].gen - lvl*UPG.speed.per);
  return Math.max(2.5, base / (1 + S.prestige.upg.paws*0.08));
}
function boxInterval(){ return boxIntervalFor(S.world, W().upg.speed); }
function boxCap(){ return CONFIG.boxCapacityBase + W().upg.cap; }
function albumHas(gid){ return !!S.album[gid]; }
function albumWorldDone(w){ for (let l=1;l<=CONFIG.levels;l++) if (!albumHas(worldCatGid(w,l))) return false; return true; }
function albumCount(){ return Object.keys(S.album).length; }
function globalBonus(){
  let b = 1 + S.prestige.upg.wealth*0.05;
  let worldsDone = 0; for (let w=0; w<WORLDS.length; w++) if (albumWorldDone(w)) worldsDone++;
  if (worldsDone >= 3) b += 0.05;
  for (let g=EVENT_BASE; g<ALBUM.length; g++) if (albumHas(g)) b += ALBUM[g].bonus || 0;
  if (S.premium) b += 0.10;
  return b;
}
function resortBonus(){ return 1 + (W().resort||[]).reduce((a,b)=>a+b,0)*0.04; }
function incomeMult(noTurbo){
  let m = (1 + W().upg.econ*UPG.econ.per) * (W().done ? 1.10 : 1) * globalBonus();
  if (S.world === 3) m *= resortBonus();
  if (!noTurbo && now() < S.turboUntil) m *= 2;
  return m;
}
function catIncome(l){ return l >= 1 && l <= CONFIG.levels ? INC[l-1]*mult() : 0; }
function nipOn(i){ const u = W().nip && W().nip[i]; return !!u && u > now(); }
function cellIncome(i){ return catIncome(W().grid[i]) * (nipOn(i) ? NIP_MULT : 1); }
function baseIncome(){ let s=0; const g = W().grid; for (let i=0;i<g.length;i++) s += cellIncome(i); return s; }
function incomePerSec(noTurbo){ return baseIncome()*incomeMult(noTurbo); }
function incomeSecCoins(sec){ return Math.max(sec * incomePerSec(true), sec * 3 * mult()); }
function upgCost(u){ return Math.ceil(u.base * Math.pow(u.g, W().upg[u.id]) * mult()); }
function prestigeCost(u){ return Math.ceil(u.base * Math.pow(u.g, S.prestige.upg[u.id])); }
// лучший открытый котик мира и уровень котят из коробок/лавки
function bestLevel(){ const f = W().found; let b = 1; for (let i=0;i<f.length;i++) if (f[i]) b = i+1; return b; }
function spawnBase(){ const b = bestLevel(); return Math.max(1, b - gapFor(b) - (WD().gapAdd||0)); }
function shopLevel(){ return spawnBase(); }
function shopPrice(){
  const w = W(), lv = shopLevel();
  if (w.shopLv !== lv){ w.shopLv = lv; w.bought = 0; }   // новый уровень котят — рост цены начинается заново
  return Math.ceil(mult() * WD().diff * CONFIG.shopK * INC[shopLevel()-1] * (1 - W().upg.bulk*UPG.bulk.per) * Math.pow(CONFIG.buyGrowth, W().bought));
}
function comboWindow(){ return (CONFIG.comboWindowBase + W().upg.combo) * 1000; }
function offlineHours(){ return OFFLINE_HOURS[S.offlineLv]; }
// котик из коробки: простой (1–3 ур.), с удачей — на уровень старше, но не старше 4;
// 5 уровень — редкость, только при полностью прокачанной «Волшебной коробке» (кристаллы)
function boxBase(){ return Math.min(boxBaseFor(bestLevel()), CONFIG.boxMaxLevel); }
function boxRareOn(){ const u = PRESTIGE_UPG.find(x=>x.id==="luck"); return S.prestige.upg.luck >= u.max; }
function spawnLevel(){
  let l = boxBase();
  const luck = W().upg.luck*UPG.luck.per + S.prestige.upg.luck*0.03;
  if (boxRareOn() && Math.random() < CONFIG.boxRareChance) l = CONFIG.boxRareLevel;
  else if (Math.random() < luck) l = Math.min(CONFIG.boxMaxLevel, l + 1);
  return Math.max(1, Math.min(l, bestLevel()));
}
// котик «постарше» из подарков — никогда не старше уже открытого
function bonusLevel(plus){ return Math.min(bestLevel(), spawnBase() + plus); }
function addCoins(v){ v = Math.max(0, v); S.coins += v; S.stats.earned += v; S.runEarned += v; Quests.progress("earnSec", v); }

/* ---------- поле ---------- */
function emptyCells(){ const r=[]; W().grid.forEach((l,i)=>{ if(!l) r.push(i); }); return r; }
function discover(level){
  const w = W(); if (level < 1 || level > CONFIG.levels || w.found[level-1]) return;
  w.found[level-1] = true;
  const gid = worldCatGid(S.world, level);
  if (!S.album[gid]){ S.album[gid] = true; S.paws += CONFIG.newCatPaws; UI.newCatModal(gid, true); Game.pushCollect(); }
  Game.checkWorldDone();
}
function placeCat(level, opts={}){
  const e = emptyCells(); if (!e.length) return -1;
  const i = opts.cell != null ? opts.cell : pick(e);
  W().grid[i] = level; born[i] = now();
  UI.renderCell(i, "spawn");
  if (level !== 99) discover(level);
  return i;
}
function fillBoard(){
  const e = emptyCells(); if (!e.length) return 0;
  const lv = boxBase();                 // за рекламу — простые котики, как из коробки
  e.forEach((i,k)=>setTimeout(()=>{ if (!W().grid[i]){ W().grid[i]=lv; born[i]=now(); UI.renderCell(i,"spawn"); } }, k*45));
  discover(lv);
  return e.length;
}

/* ---------- задания ---------- */
const Quests = {
  ensure(){
    const d = dayStr(0);
    if (S.quests.date === d) return;
    const types = [...QUEST_POOL].sort(()=>Math.random()-.5).slice(0,3);
    S.quests = {date:d, chest:false, list: types.map(q=>{
      let n = pick(q.n);
      const target = q.money ? Math.max(Math.round(incomeSecCoins(n)/100)*100, 500*mult()) : n;
      return {type:q.type, n, target, prog:0, claimed:false};
    })};
  },
  progress(type, amount){
    if (!S.quests.list) return;
    for (const q of S.quests.list){
      if (q.type !== type || q.claimed) continue;
      if (type === "combo") q.prog = Math.max(q.prog, amount >= q.n ? q.target : 0);
      else q.prog = Math.min(q.target, q.prog + (type==="earnSec" ? amount : amount));
    }
  },
  text(q){ const d = QUEST_POOL.find(x=>x.type===q.type); return d.t(q.money ? fmt(q.target) : q.n); },
  claimable(){ return S.quests.list.some(q=>!q.claimed && q.prog >= q.target) || (!S.quests.chest && S.quests.list.length && S.quests.list.every(q=>q.claimed)); },
};

/* ---------- даты / недели ---------- */
function mskDate(offsetDays=0){ return new Date(YG.now() + 3*3600e3 + offsetDays*864e5); }
function dayStr(offsetDays=0){ const d = mskDate(offsetDays); return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`; }
function weekIndex(){ return Math.floor(((YG.now() + 3*3600e3)/864e5 + 3) / 7); }
function weekEndsIn(){ const t = (YG.now()+3*3600e3)/864e5 + 3; return ((Math.floor(t/7)+1)*7 - t) * 86400; }

/* ---------- события ---------- */
function activeEvent(){
  const f = YG.flags && YG.flags.event;
  const q = new URLSearchParams(location.search).get("event");
  const force = q || (f && f !== "auto" ? f : "");
  if (force === "off") return null;
  if (force){ const e = EVENTS.findIndex(x=>x.id===force); return e >= 0 ? e : null; }
  const d = mskDate(0), md = (d.getUTCMonth()+1)*100 + d.getUTCDate();
  for (let i=0;i<EVENTS.length;i++){
    const e = EVENTS[i], a = e.from[0]*100+e.from[1], b = e.to[0]*100+e.to[1];
    if (a <= b ? (md >= a && md <= b) : (md >= a || md <= b)) return i;
  }
  return null;
}

/* ---------- главный объект игры ---------- */
const Game = {
  paused:false,
  pause(p){ this.paused = p; Snd.refreshMute(); if (!p) lastTick = now(); },

  merge(a, b, auto){
    const w = W(), la = w.grid[a], lb = w.grid[b];
    let nl;
    if (la === 99 && lb === 99) return false;
    if (la === 99 || lb === 99) nl = Math.min(CONFIG.levels, (la === 99 ? lb : la) + 1);
    else nl = la + 1;
    const t = now();
    const perfect = Math.max(born[a], born[b]) > t - CONFIG.perfectWindowMs || Math.random() < S.prestige.upg.tail*0.05;
    w.grid[a] = 0; w.grid[b] = nl; born[a] = 0; born[b] = t;
    const na = w.nip[a] || 0, nb = w.nip[b] || 0; delete w.nip[a]; if (Math.max(na, nb) > t) w.nip[b] = Math.max(na, nb); else delete w.nip[b];
    combo.n = (t - combo.last <= comboWindow()) ? combo.n + 1 : 1; combo.last = t;
    const cm = CONFIG.comboMult[Math.min(combo.n, CONFIG.comboMult.length) - 1];
    const reward = Math.floor((INC[nl-1]*3 + 5) * mult() * cm * (1 + w.upg.merge*UPG.merge.per) * (perfect ? 1.2 : 1));
    addCoins(reward);
    S.stats.merges++;
    S.weekly.score += Math.round(nl * 10 * cm * (perfect ? 1.2 : 1));
    Quests.progress("merge", 1); Quests.progress("combo", Math.min(combo.n, 5));
    if (perfect) Quests.progress("perfect", 1);
    let extra = "";
    if (perfect && Math.random() < 0.15){ S.paws++; extra = "+1 🐾"; }
    const ev = activeEvent();
    if (ev !== null && Math.random() < (perfect ? 0.5 : 0.25)){ S.ev.amt++; extra = (extra?extra+"  ":"") + "+1 " + EVENTS[ev].cur.ic; }
    UI.onMerge(a, b, nl, reward, perfect, cm, extra, auto);
    discover(nl);
    if (S.tutorial === 0) UI.tutorialMerged();
    Game.save();
    return true;
  },
  tap(i, x, y){
    const l = W().grid[i]; if (!l || l === 99 || l === FOOD) return;
    const v = Math.max(1, Math.floor(cellIncome(i) * incomeMult()));
    addCoins(v); S.stats.taps++; Quests.progress("tap", 1);
    UI.floatText(x, y-20, `+${fmt(v)}`); Snd.voice(worldCatGid(S.world, l), 0.8, "pet"); UI.bounce(i); UI.meowBubble(i, worldCatGid(S.world, l));
  },
  drop(a, b){
    const g = W().grid;
    if (b === null || a === b){ UI.renderCell(a); return; }
    const la = g[a], lb = g[b];
    if (la === FOOD || lb === FOOD){ UI.renderCell(a); return; }
    if (!lb){ g[b]=la; g[a]=0; born[b]=born[a]; born[a]=0; const w = W(); if (w.nip[a]){ w.nip[b] = w.nip[a]; delete w.nip[a]; } UI.renderCell(a); UI.renderCell(b); SFX.click(); return; }
    const L = CONFIG.levels;
    if (la === lb && la !== 99 && la < L){ this.merge(a, b); return; }
    if ((la === 99) !== (lb === 99)){
      const t = la === 99 ? lb : la;
      if (t < L && t + 1 <= bestLevel()){ this.merge(a, b); return; }
      UI.grumble(a, b, t >= L ? T("Это самый старший котик мира!") : T("Кот-радуга не создаёт нового, ещё не открытого котика"));
      return;
    }
    if (la === lb && la >= L){ UI.grumble(a, b, T("Это самый старший котик мира!")); return; }
    UI.grumble(a, b, la === 99 && lb === 99 ? T("Две радуги не соединяются") : T("Соединяются только одинаковые котики"));
  },
  takeBox(auto){
    const w = W();
    if (w.boxes <= 0){ if (!auto){ UI.toast(T("Коробки пока нет. Подожди немного или купи котика")); SFX.bad(); } return false; }
    if (!emptyCells().length){ if (!auto){ UI.toast(T("Поле занято. Соедини одинаковых котиков!")); SFX.bad(); } return false; }
    w.boxes--; S.stats.boxes++; Quests.progress("boxes", 1);
    placeCat(spawnLevel(), {fromBox:true}); if (!auto) SFX.pop();
    if (S.tutorial === 2) UI.tutorialBoxed();
    UI.update(); if (!auto) this.save(); return true;
  },
  buyCat(){
    const p = shopPrice();
    if (S.coins < p){ UI.toast(T("Пока не хватает монет")); SFX.bad(); return; }
    if (!emptyCells().length){ UI.toast(T("Поле занято. Соедини одинаковых котиков!")); SFX.bad(); return; }
    S.coins -= p; W().bought++; S.stats.bought++; Quests.progress("buy", 1);
    placeCat(shopLevel(), {fromBox:true}); SFX.coin(); UI.update(); this.save();
  },
  buyUpgrade(id){
    const u = UPGRADES.find(x=>x.id===id), c = upgCost(u);
    if (W().upg[id] >= u.max || S.coins < c) return;
    S.coins -= c; W().upg[id]++; SFX.coin(); SFX.sparkle(); this.save();
  },
  buyOffline(){
    if (S.offlineLv >= OFFLINE_COST.length) return;
    const c = OFFLINE_COST[S.offlineLv] * mult();
    if (S.coins < c) return;
    S.coins -= c; S.offlineLv++; SFX.coin(); this.save();
  },

  /* ---------- бустеры ---------- */
  useBooster(id){
    if ((S.boost[id]||0) <= 0){ UI.boosterEmpty(id); return; }
    const bd = BOOSTERS.find(x=>x.id===id);
    if (bd.aim){
      if (aim === id){ this.setAim(null); return; }
      if (id === "food" && W().food){ UI.toast(T("Котики ещё едят из миски 🥣")); return; }
      if (bd.aim === "empty" && !emptyCells().length){ UI.toast(T("Нужна свободная клетка")); return; }
      this.setAim(id); return;
    }
    if (id === "wild"){
      if (!emptyCells().length){ UI.toast(T("Нужна свободная клетка")); return; }
      S.boost.wild--; placeCat(99); UI.toast(T("🌈 Кот-радуга соединится с любым котиком")); }
    if (id === "lucky"){ S.boost.lucky--; this.luckyBox(); }
    Quests.progress("booster", 1); SFX.sparkle(); UI.update(); this.save();
  },
  setAim(id){ aim = id; UI.setAim(id); },
  // нажатие на клетку, когда выбран корм / брызгалка / мята
  aimAt(i){
    const id = aim, w = W(), l = w.grid[i];
    if (!id) return;
    if (id === "food"){
      if (l){ UI.toast(T("Поставь миску на свободную клетку")); SFX.bad(); return; }
      w.grid[i] = FOOD; w.food = {cell:i, left:FOOD_CATS, t:0, idle:0};
      SFX.food(); UI.renderCell(i, "spawn");
    } else {
      if (!l || l === FOOD){ UI.toast(T("Нажми на котика")); SFX.bad(); return; }
      if (id === "spray"){
        const gid = l === 99 ? worldCatGid(S.world, 1) : worldCatGid(S.world, l);
        w.grid[i] = 0; delete w.nip[i];
        SFX.spray(); setTimeout(()=>Snd.voice(gid, 0.9, "grumpy"), 120); UI.runAway(i, l);
      }
      if (id === "nip"){
        if (l === 99){ UI.toast(T("Кот-радуга не ест мяту — выбери обычного котика")); return; }
        w.nip[i] = Math.max(now(), w.nip[i]||0) + NIP_MINUTES*60000;
        SFX.nip(); setTimeout(()=>Snd.voice(worldCatGid(S.world, l), 0.8, "pet"), 250); UI.renderCell(i, "pop"); UI.nipFx(i);
      }
    }
    S.boost[id]--; this.setAim(null);
    Quests.progress("booster", 1); UI.update(); this.save();
  },
  // миска: котики прибегают по одному в ближайшие свободные клетки
  foodStep(dt){
    const w = W(), f = w.food; if (!f) return;
    if (w.grid[f.cell] !== FOOD){ w.food = null; return; }
    f.t += dt; if (f.t < FOOD_EVERY) return; f.t = 0;
    const e = emptyCells();
    if (!e.length){ f.idle += FOOD_EVERY; if (f.idle < 8) return; f.left = 0; }
    else {
      const cx = f.cell % 4, cy = Math.floor(f.cell / 4);
      e.sort((p,q)=>((p%4-cx)**2 + (Math.floor(p/4)-cy)**2) - ((q%4-cx)**2 + (Math.floor(q/4)-cy)**2));
      placeCat(spawnLevel(), {cell:e[0]}); SFX.pop(); f.left--; f.idle = 0;
    }
    if (f.left <= 0){ w.grid[f.cell] = 0; w.food = null; UI.renderCell(f.cell); UI.puff(f.cell); }
  },
  buyBoosterCrystals(id){
    const b = BOOSTERS.find(x=>x.id===id); if (!b || !b.cr) return;
    if (S.crystals < b.cr){ UI.toast(T("Не хватает кристаллов 💎 — они даются за перерождение")); return; }
    S.crystals -= b.cr; S.boost[id] = (S.boost[id]||0) + 1; SFX.coin(); UI.toast(`${b.ic} +1 ${b.n}`); UI.update(); this.save();
  },
  luckyBox(){
    const r = Math.random();
    if (r < 0.4){ const c = incomeSecCoins(180); addCoins(c); UI.rewardModal(T("🎁 Счастливая коробка"), [`🪙 ${fmt(c)}`]); }
    else if (r < 0.65){ const p = 5 + Math.floor(Math.random()*6); S.paws += p; UI.rewardModal(T("🎁 Счастливая коробка"), [`🐾 ${p}`]); }
    else if (r < 0.85){ const b = pick(GIFT_BOOSTS.concat(["wild"])); S.boost[b]++; const d = BOOSTERS.find(x=>x.id===b); UI.rewardModal(T("🎁 Счастливая коробка"), [`${d.ic} ${d.n}`]); }
    else { if (emptyCells().length){ const l = bonusLevel(2); placeCat(l); UI.rewardModal(T("🎁 Счастливая коробка"), [`${T("Котик")} ${l} ${T("уровня!")}`]); } else { S.paws += 8; UI.rewardModal(T("🎁 Счастливая коробка"), ["🐾 8"]); } }
  },

  /* ---------- награды ---------- */
  give(g, mult=1){
    const lines = [];
    if (g.incomeSec){ const c = incomeSecCoins(g.incomeSec)*mult; addCoins(c); lines.push(`🪙 ${fmt(c)}`); }
    if (g.coins){ addCoins(g.coins*mult); lines.push(`🪙 ${fmt(g.coins*mult)}`); }
    if (g.paws){ S.paws += g.paws*mult; lines.push(`🐾 ${g.paws*mult}`); }
    if (g.boost){ S.boost[g.boost] = (S.boost[g.boost]||0) + mult; const d = BOOSTERS.find(x=>x.id===g.boost); lines.push(`${d.ic} ${d.n}${mult>1?" ×"+mult:""}`); }
    if (g.turbo){ S.turboUntil = Math.max(now(), S.turboUntil) + g.turbo*60000*mult; lines.push(`${T("⚡ Доход ×2 на")} ${g.turbo*mult} ${T("мин")}`); }
    if (g.ev){ S.ev.amt += g.ev*mult; }
    return lines;
  },
  // любая реклама за награду: сначала подарок, потом поле заполняется котятами
  rewarded(onReward, onFail){
    YG.rewarded(()=>{
      S.stats.ads++;
      onReward();
      const ev = activeEvent(); if (ev !== null) S.ev.amt += 5;
      const n = fillBoard();
      if (n) setTimeout(()=>UI.toast(`${T("🐱 Бонус:")} ${n} ${T("котят прыгнули на поле!")}`), 600);
      UI.update(); this.save(true);
    }, onFail);
  },

  /* ---------- ежедневная награда ---------- */
  dailyAvailable(){ return S.daily.last !== dayStr(0); },
  streakBroken(){ return S.daily.day > 0 && S.daily.last !== dayStr(0) && S.daily.last !== dayStr(-1); },
  dailyIndex(){
    if (!S.daily.last || this.streakBroken()) return 0;
    if (S.daily.last === dayStr(0)) return (S.daily.day - 1 + 7) % 7;
    return S.daily.day % 7;
  },
  claimDaily(m){
    if (!this.dailyAvailable()) return null;
    const idx = this.dailyIndex(), lines = this.give(DAILY[idx].give, m);
    if (activeEvent() !== null){ S.ev.amt += 10*m; }
    S.daily = {day: idx + 1, last: dayStr(0)};
    SFX.fanfare(); this.save(true);
    return {idx, lines};
  },
  // ежедневные бонусы премиума и «Девяти жизней»
  dayBonuses(){
    const d = dayStr(0); if (S.bonusDay === d) return [];
    S.bonusDay = d; const lines = [];
    if (S.premium){ S.paws += 20; lines.push(T("💎 Премиум: 🐾 20")); }
    for (let i=0;i<S.prestige.upg.lives;i++){ const b = pick(GIFT_BOOSTS.concat(["wild","lucky"])); S.boost[b]++; const bd = BOOSTERS.find(x=>x.id===b); lines.push(`${T("💝 Девять жизней:")} ${bd.ic} ${bd.n}`); }
    return lines;
  },

  /* ---------- недели ---------- */
  weeklyCheck(){
    const wk = weekIndex();
    if (S.weekly.week === wk) return null;
    let lines = null;
    if (S.weekly.week){ // выдать неполученные сундуки прошлой недели
      lines = [];
      WEEKLY_CHESTS.forEach((c,i)=>{ if (!S.weekly.claimed[i] && S.weekly.score >= c.need) lines.push(...this.give(c.give)); });
    }
    S.weekly = {week:wk, score:0, claimed:[false,false,false]};
    return lines && lines.length ? lines : null;
  },
  claimWeekly(i){
    const c = WEEKLY_CHESTS[i];
    if (S.weekly.claimed[i] || S.weekly.score < c.need) return null;
    S.weekly.claimed[i] = true; SFX.fanfare(); const l = this.give(c.give); this.save(true); return l;
  },

  /* ---------- миры ---------- */
  checkWorldDone(){
    const w = W();
    if (w.done || !w.found.every(Boolean)) return;
    w.done = true; YG.happy();
    const lines = this.give({incomeSec:600, paws:50});
    const next = S.world + 1;
    let unlocked = false;
    if (next < WORLDS.length && S.unlocked <= next){ S.unlocked = next + 1; unlocked = true; }
    let creator = false;
    const cg = SPECIAL_BASE; // Кот Создатель
    if (!S.album[cg] && WORLDS.every((_,i)=>albumWorldDone(i))){ S.album[cg] = true; creator = true; }
    this.save(true); this.pushCollect();
    UI.worldDoneModal(S.world, lines, unlocked ? next : -1, creator);
  },
  travel(w){
    if (w >= S.unlocked || w === S.world) return;
    this.save();
    W().coins = S.coins;                 // у каждого мира свои монеты
    S.world = w;
    if (!S.W[w]) S.W[w] = newWorldState(w);
    S.coins = W().coins || 0;
    born = new Array(CONFIG.cells).fill(0); combo = {n:0, last:0};
    UI.applyWorld(true);
    YG.interstitial();
    this.save(true);
  },

  /* ---------- ресурсы миров ---------- */
  resRate(){
    const r = WD().res; if (!r) return 0;
    let s = 0; for (const l of W().grid) if (l >= r.minLv && l <= CONFIG.levels) s += 1 + 0.1*(l - r.minLv);
    return s * r.rate;
  },
  coffeePrice(){ return Math.max(5*mult(), Math.round(incomePerSec(true)*0.2)); },
  resortCost(i){ return Math.ceil(25 * Math.pow(W().resort[i]+1, 1.6)); },
  resAction(kind, arg){
    const w = W();
    if (kind === "flowersToPaws"){ const n = Math.floor(w.res/50); if (!n) return UI.toast(T("Нужно 50 🌸")); w.res -= n*50; S.paws += n; UI.toast(`${T("Получено 🐾")} ${n}`); }
    if (kind === "bouquet"){ if (w.res < 20) return UI.toast(T("Нужно 20 🌸")); w.res -= 20; const c = incomeSecCoins(30); addCoins(c); UI.toast(`${T("Букет продан: 🪙")} ${fmt(c)}`); }
    if (kind === "sellCoffee"){ const n = Math.floor(w.res); if (!n) return UI.toast(T("Кофе пока нет")); const c = n*this.coffeePrice(); w.res -= n; addCoins(c); UI.toast(`${T("Продано ☕")} ${n}: 🪙 ${fmt(c)}`); }
    if (kind === "build"){ const c = this.resortCost(arg); if (w.resort[arg] >= 5) return; if (w.res < c) return UI.toast(`${T("Нужно 🐚")} ${c}`); w.res -= c; w.resort[arg]++; SFX.sparkle(); }
    if (kind === "generator"){ if (w.res < 60) return UI.toast(T("Нужно 60 🔋")); w.res -= 60; w.genUntil = Math.max(now(), w.genUntil) + 180000; UI.toast(T("🤖 Генератор сам соединяет котиков 3 минуты!")); }
    if (kind === "charge"){ if (w.res < 40) return UI.toast(T("Нужно 40 🔋")); w.res -= 40; w.boxes = boxCap(); UI.toast(T("📦 Лежанка заполнена коробками!")); }
    SFX.coin(); UI.update(); this.save();
  },
  autoMergeStep(){
    const g = W().grid; let best = null;
    for (let l=1; l<CONFIG.levels && !best; l++){ const idx = []; g.forEach((v,i)=>{ if (v===l) idx.push(i); }); if (idx.length >= 2) best = idx; }
    if (best) this.merge(best[0], best[1], true);
  },

  /* ---------- престиж ---------- */
  doneWorlds(){ return S.W.filter(w=>w && w.done).length; },
  prestigeAvailable(){ return this.doneWorlds() >= CONFIG.prestigeAfterWorlds; },
  prestigeGain(){ return 10*this.doneWorlds() + Math.floor(Math.sqrt(S.runEarned/1000)); },
  doPrestige(){
    if (!this.prestigeAvailable()) return;
    const gain = this.prestigeGain();
    S.crystals += gain; S.prestige.count++;
    S.W = [newWorldState(0)]; S.world = 0; S.unlocked = 1; S.coins = 0; aim = null; S.runEarned = 0; S.turboUntil = 0;
    born = new Array(CONFIG.cells).fill(0);
    SFX.fanfare(); UI.applyWorld(true); this.save(true);
    return gain;
  },
  buyPrestige(id){
    const u = PRESTIGE_UPG.find(x=>x.id===id), c = prestigeCost(u);
    if (S.prestige.upg[id] >= u.max || S.crystals < c) return;
    S.crystals -= c; S.prestige.upg[id]++; SFX.sparkle(); this.save(true);
  },

  /* ---------- магазин ---------- */
  buyWithPaws(kind, id){
    if (kind === "booster"){ const b = BOOSTERS.find(x=>x.id===id); if (S.paws < b.paws) return UI.noPaws(); S.paws -= b.paws; S.boost[id]++; }
    if (kind === "coins"){ const [p, sec] = id; if (S.paws < p) return UI.noPaws(); S.paws -= p; addCoins(incomeSecCoins(sec)); }
    if (kind === "special"){ if (S.paws < CONFIG.specialBoxPaws) return UI.noPaws(); if (!emptyCells().length) return UI.toast(T("Нужна свободная клетка")); S.paws -= CONFIG.specialBoxPaws; placeCat(bonusLevel(2)); }
    if (kind === "turbo30"){ if (S.paws < 30) return UI.noPaws(); S.paws -= 30; S.turboUntil = Math.max(now(), S.turboUntil) + 30*60000; }
    if (kind === "cos"){ const c = COSMETICS.find(x=>x.id===id); if (S.cos.owned[id]){ S.cos.on = S.cos.on===id ? "" : id; UI.renderBoard(); this.pushCollect(); this.save(); return; } if (S.paws < c.paws) return UI.noPaws(); S.paws -= c.paws; S.cos.owned[id] = true; S.cos.on = id; UI.renderBoard(); this.pushCollect(); }
    SFX.coin(); UI.toast(T("Готово!")); UI.update(); this.save();
  },
  grantIAP(id){
    const lines = [];
    if (id === "starter_pack"){ S.iapOnce.starter_pack = true; lines.push(...this.give({coins:Math.max(50000*mult(), incomeSecCoins(1800)), paws:100})); S.turboUntil = Math.max(now(), S.turboUntil) + 3600e3; lines.push(T("⚡ Доход ×2 на 1 час")); }
    if (id === "cat_pack"){ S.iapOnce.cat_pack = true; S.album[SPECIAL_BASE+1] = true; lines.push(T("⭐ Звёздный кот в альбоме"), ...this.give({coins:Math.max(100000*mult(), incomeSecCoins(3600)), paws:100})); this.pushCollect(); }
    if (id === "premium"){ S.premium = true; lines.push(T("💎 Премиум включён навсегда")); }
    if (id === "paws_150"){ lines.push(...this.give({paws:150})); }
    SFX.fanfare(); UI.rewardModal(T("Спасибо за покупку! 💛"), lines); UI.update();
  },

  /* ---------- альбом и лидерборды ---------- */
  // альбом в компактном виде: блоки по 30 котиков в base36
  albumCode(){
    const parts = [];
    for (let base=0; base<ALBUM.length; base+=30){
      let v = 0; for (let k=0; k<30 && base+k<ALBUM.length; k++) if (S.album[base+k]) v += Math.pow(2, k);
      parts.push(v.toString(36));
    }
    return parts.join(".");
  },
  pushCollect(){
    const cosI = COSMETICS.findIndex(c=>c.id===S.cos.on);
    const extra = `v3|${this.albumCode()}|${S.favorite}|${cosI}|${S.friends.code}`;
    Social.profile();
    return YG.setScore(CONFIG.lbCollect, albumCount(), extra);
  },
  pushWeekly(){ return YG.setScore(CONFIG.lbWeekly, S.weekly.week*1e8 + Math.min(S.weekly.score, 99999999)); },

  /* ---------- друзья ---------- */
  ensureCode(){
    if (S.friends.code) return;
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = "";
    for (let i=0;i<6;i++) c += abc[Math.floor(Math.random()*abc.length)];
    S.friends.code = c;
  },
  redeemInvite(code, viaLink){
    code = (code||"").trim().toUpperCase().replace(/^F_/,"");
    if (!/^[A-Z0-9]{6}$/.test(code)) return {err:T("Код — это 6 букв и цифр")};
    if (code === S.friends.code) return {err:T("Это твой собственный код 🙂")};
    if (!S.friends.list.some(f=>f.code===code)) S.friends.list.push({code, at:now(), via: viaLink ? "link" : "code"});
    if (S.friends.invitedBy) { this.save(); return {added:true}; }
    S.friends.invitedBy = code;
    const lines = this.give(INVITE_GIFT);
    Social.invited(code);
    this.save(true);
    return {gift:lines};
  },

  /* ---------- сохранение ---------- */
  snapshot(){ S.lastSeen = now(); S.savedAt = now(); if (W()) W().coins = S.coins; return S; },
  save(cloud){
    this.snapshot();
    try{ localStorage.setItem("catMergeIdle_v3", JSON.stringify(S)); }catch(e){}
    if (YG.saveDevice) YG.saveDevice(S);          // копия в хранилище устройства платформы (если есть)
    if (cloud === true) return YG.saveCloud(S);
    if (cloud !== "local") YG.scheduleCloud(S);   // прогресс уходит в облако сразу после действия игрока (1.9)
    return Promise.resolve();
  },
};

/* ---------- загрузка и миграция ---------- */
function deepMerge(def, obj){
  if (!obj || typeof obj !== "object") return def;
  for (const k in obj){
    if (!(k in def)) { if (k === "album") def[k] = obj[k]; continue; }
    const dv = def[k], ov = obj[k];
    if (ov === null || ov === undefined) continue;
    if (dv === null){ def[k] = ov; continue; }
    if (Array.isArray(dv)) { if (Array.isArray(ov)) def[k] = ov; }
    else if (typeof dv === "object") { if (typeof ov === "object") def[k] = (k==="album"||k==="owned"||k==="tips"||k==="iapOnce"||k==="nip") ? Object.assign({}, ov) : deepMerge(dv, ov); }
    else if (typeof dv === typeof ov) def[k] = ov;
  }
  return def;
}
function normalizeState(st){
  st.W = (st.W || []).map((w,i)=> w ? deepMerge(newWorldState(i), w) : null);
  if (!st.W[0]) st.W[0] = newWorldState(0);
  st.W.forEach(w=>{ if (!w) return;
    if (w.grid.length !== CONFIG.cells) w.grid = new Array(CONFIG.cells).fill(0);
    if (!w.food || w.grid[w.food.cell] !== FOOD) w.food = null;
    w.grid = w.grid.map((l,i) => l === 99 ? 99 : (l === FOOD && w.food && w.food.cell === i) ? FOOD : Math.max(0, Math.min(CONFIG.levels, l|0)));
    if (!w.nip || typeof w.nip !== "object") w.nip = {};
    if (w.found.length !== CONFIG.levels) w.found = newWorldState(0).found;
    for (const u of UPGRADES) w.upg[u.id] = Math.max(0, Math.min(u.max, w.upg[u.id]|0)); });
  st.offlineLv = Math.max(0, Math.min(OFFLINE_COST.length, st.offlineLv|0));
  st.world = Math.min(st.world, st.unlocked-1);
  if (!st.W[st.world]) st.W[st.world] = newWorldState(st.world);
  return st;
}
function migrateV1(o){
  const s = defaultState();
  s.coins = o.coins||0; s.paws = o.paws||0; s.tutorial = 3;
  const w = s.W[0], M = V2_LEVEL_MAP[0];
  if (Array.isArray(o.grid) && o.grid.length === 20) w.grid = o.grid.map(l => l ? M[Math.min(10,l)-1] : 0);
  if (Array.isArray(o.found)) o.found.forEach((f,i)=>{ if (f && i < 10){ w.found[M[i]-1]=true; s.album[worldCatGid(0, M[i])]=true; } });
  if (o.upg) for (const k in w.upg) if (o.upg[k]) w.upg[k] = Math.min(o.upg[k], UPGRADES.find(u=>u.id===k).max);
  w.coins = s.coins;
  if (o.daily) s.daily = o.daily;
  s.set.sound = o.sound !== false; s.set.music = o.music !== false;
  return s;
}
// версия 2.0 → 2.1: 10 котиков в мире → 20, свои монеты у каждого мира
function migrateV2(o){
  const worlds = (o.W || []).map((w, wi) => {
    if (!w) return null;
    const M = V2_LEVEL_MAP[wi];
    const found = new Array(CONFIG.levels).fill(false); found[0] = true;
    (w.found || []).forEach((f,i)=>{ if (f && i < 10) found[M[i]-1] = true; });
    const grid = (w.grid || []).map(l => l === 99 ? 99 : (l ? M[Math.min(10,l)-1] : 0));
    const upg = Object.assign({}, w.upg || {}); delete upg.qual;
    return Object.assign({}, w, {grid, found, upg, coins: wi === o.world ? (o.coins||0) : 0});
  });
  const album = {}; for (const k in (o.album || {})) album[v2GidToV3(+k)] = true;
  return Object.assign({}, o, {v:3, W:worlds, album, favorite: v2GidToV3(o.favorite||0)});
}
function resetEpoch(){ const f = YG.flags && YG.flags.reset; const v = f == null ? "" : String(f).trim(); return v && v !== "0" ? v : ""; }
function resetSave(old, epoch){
  const s = defaultState();
  s.set = old.set || s.set;                                   // настройки звука и шрифта сохраняем
  s.friends = Object.assign(s.friends, {code: (old.friends && old.friends.code) || ""});
  s.premium = !!old.premium;                                  // премиум куплен за деньги — оставляем (ещё проверяется через getPurchases)
  s.iapOnce = old.iapOnce || {};
  s.tutorial = 3; s.resetEpoch = epoch; s.wasReset = true; s.savedAt = now();
  return s;
}
async function loadState(){
  let local = null, cloud = null;
  try{ local = JSON.parse(localStorage.getItem("catMergeIdle_v3")); }catch(e){}
  if (!local){ try{ const v2 = JSON.parse(localStorage.getItem("catMergeIdle_v2")); if (v2) local = migrateV2(v2); }catch(e){} }
  if (!local){ try{ const v1 = JSON.parse(localStorage.getItem("catMergeIdle_v1")); if (v1) local = migrateV1(v1); }catch(e){} }
  cloud = await YG.loadCloud();
  const device = YG.loadDevice ? await YG.loadDevice() : null;
  if (cloud && cloud.v === 2) cloud = migrateV2(cloud);
  else if (cloud && !cloud.v && cloud.grid) cloud = migrateV1(cloud);
  let best = [local, cloud, device].filter(Boolean).sort((a,b)=>(b.savedAt||0)-(a.savedAt||0))[0];
  // 2.3: магнит → кошачий корм, бомба → брызгалка
  if (best && best.boost && ("magnet" in best.boost || "bomb" in best.boost)){
    const o = best.boost; o.food = (o.food||0) + (o.magnet||0); o.spray = (o.spray||0) + (o.bomb||0); delete o.magnet; delete o.bomb;
    if (o.nip == null) o.nip = 1;
  }
  // Сброс прогресса всех игроков (только админ): флаг reset в «Удалённой конфигурации» Консоли.
  // Новое значение флага (1, 2, 3…) = один сброс у каждого игрока при следующем входе.
  const epoch = resetEpoch();
  if (best && epoch && String(best.resetEpoch || "") !== epoch) best = resetSave(best, epoch);
  return best ? normalizeState(deepMerge(defaultState(), best)) : null;
}

// загрузить прогресс, пришедший с другого устройства (облако платформы), прямо во время игры
function adoptState(obj){
  S = normalizeState(deepMerge(defaultState(), obj));
  born = new Array(CONFIG.cells).fill(0); combo = {n:0, last:0}; aim = null;
  try{ localStorage.setItem("catMergeIdle_v3", JSON.stringify(S)); }catch(e){}
  if (YG.saveDevice) YG.saveDevice(S);
  document.documentElement.classList.toggle("big", !!S.set.big);
  UI.setAim(null); UI.closeSheet(); UI.applyWorld(); UI.update();
}

/* ---------- офлайн-доход ---------- */
function offlineGain(){
  const away = (now() - (S.lastSeen || now()))/1000;
  if (away < CONFIG.offlineMinSec) return null;
  const sec = Math.min(away, offlineHours()*3600);
  const gain = Math.floor(incomePerSec(true) * sec * CONFIG.offlineShare);
  W().boxes = Math.min(boxCap(), W().boxes + Math.floor(sec / boxInterval()));
  if (WD().res) W().res += Game.resRate() * sec * CONFIG.offlineShare;
  return gain > 0 ? {gain, sec} : null;
}

/* ---------- главный цикл ---------- */
let lastTick = now(), saveT = 0, cloudT = 0, lbT = 0, genT = 0;
function tick(){
  const t = now(); let dt = (t - lastTick)/1000; lastTick = t;
  if (Game.paused || dt <= 0) return;
  dt = Math.min(dt, 5);
  const w = W();
  addCoins(incomePerSec()*dt);
  if (w.boxes < boxCap()){
    w.boxTimer += dt; const iv = boxInterval();
    while (w.boxTimer >= iv && w.boxes < boxCap()){ w.boxTimer -= iv; w.boxes++; }
  } else w.boxTimer = 0;
  if (w.upg.auto){ w.autoTimer += dt; if (w.autoTimer >= AUTO_IV[w.upg.auto]){ w.autoTimer = 0; Game.takeBox(true); } }
  if (WD().res) w.res += Game.resRate()*dt;
  if (w.food) Game.foodStep(dt);
  for (const k in w.nip){ if (w.nip[k] <= t){ delete w.nip[k]; UI.renderCell(+k); } }
  if (w.genUntil > t){ genT += dt; if (genT >= 3){ genT = 0; Game.autoMergeStep(); } }
  if (combo.n && t - combo.last > comboWindow()){ combo.n = 0; UI.showCombo(1); }
  saveT += dt; cloudT += dt; lbT += dt;
  if (saveT >= CONFIG.saveLocalEvery){ saveT = 0; Game.save("local"); }
  if (cloudT >= CONFIG.saveCloudEvery){ cloudT = 0; Game.save(true); }
  if (lbT >= 60){ lbT = 0; Game.pushWeekly(); }
  // смена дня / недели прямо во время игры
  if (S.quests.date !== dayStr(0)){ Quests.ensure(); const b = Game.dayBonuses(); if (b.length) UI.rewardModal(T("Новый день! ☀️"), b); }
  const wl = Game.weeklyCheck(); if (wl) UI.rewardModal(T("Новая неделя! Сундуки прошлой недели"), wl);
  // событие закончилось — валюта исчезает
  const ev = activeEvent(), evId = ev === null ? "" : EVENTS[ev].id;
  if (S.ev.id !== evId){ S.ev = {id:evId, amt:0}; UI.update(); }
}
