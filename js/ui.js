"use strict";
/* =====================================================================
   ИНТЕРФЕЙС: поле, панели, окна, обучение, запуск игры.
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const UI = {
  cells: [],
  sheet: null, tab: null,

  /* ================= ПОЛЕ ================= */
  init(){
    const board = $("board");
    for (let i=0;i<CONFIG.cells;i++){ const d = document.createElement("div"); d.className = "cell"; d.dataset.i = i; board.appendChild(d); }
    this.cells = [...board.children];
    // бустеры справа
    $("rightCol").innerHTML = BOOSTERS.map(b=>`<button class="sBtn" data-b="${b.id}" aria-label="${b.n}"><span>${b.ic}</span><small>${b.s}</small><i class="cnt" id="bc_${b.id}">0</i></button>`).join("");
    $("rightCol").querySelectorAll("[data-b]").forEach(el=>el.onclick=()=>{ SFX.click(); Game.useBooster(el.dataset.b); this.update(); });
    this.bindDrag();
    const fit = ()=>{ const r = $("boardWrap").getBoundingClientRect(); const w = Math.max(120, Math.min(r.width, (r.height-6)*0.8)); board.style.width = w+"px"; board.style.height = (w*1.25)+"px"; };
    this.fitBoard = fit;
    try{ new ResizeObserver(fit).observe($("boardWrap")); }catch(e){ window.addEventListener("resize", fit); }
    window.addEventListener("resize", ()=>this.renderSides());
    fit();
    $("boxBtn").onclick = ()=>{ this.wake(); Game.takeBox(false); };
    $("buyBtn").onclick = ()=>{ this.wake(); Game.buyCat(); };
    $("freeBtn").onclick = ()=>this.freeGift();
    $("turboBtn").onclick = ()=>this.turboOffer();
    $("resBtn").onclick = ()=>this.openSheet("res");
    $("evBtn").onclick = $("evPill").onclick = ()=>this.openSheet("event");
    $("rewBtn").onclick = ()=>this.openSheet("rewards");
    $("socBtn").onclick = ()=>this.openSheet("social");
    $("setBtn").onclick = ()=>this.openSheet("settings");
    $("coinsPill").onclick = ()=>this.toast(`${T("Котики приносят")} ${fmt(incomePerSec())} ${T("монет каждую секунду")}`);
    $("pawsPill").onclick = ()=>this.toast(T("🐾 Лапки — редкие монетки. За них — бустеры и наряды в Магазине"));
    $("sheetClose").onclick = ()=>this.closeSheet();
    $("sheet").addEventListener("pointerdown", e=>{ if (e.target.id === "sheet") this.closeSheet(); });
    $("aimCancel").onclick = ()=>Game.setAim(null);
    document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>{ SFX.click(); b.dataset.p === "board" ? this.closeSheet() : this.openSheet(b.dataset.p); });
    $("tip").onclick = ()=>{ $("tip").style.display = "none"; };
  },
  wake(){ Snd.ctx(); Snd.startMusic(); },
  catHTML(l, anim){
    if (l === 99) return `<div class="cat wild ${anim||""}"><span class="lv">★</span><div class="wildCat">🐱</div></div>`;
    if (l === FOOD) return `<div class="cat bowl ${anim||""}">${BOWL_SVG}</div>`;
    return `<div class="cat ${anim||""}"><span class="lv">${l}</span>${catSVG(worldCatGid(S.world, l), S.cos.on)}</div>`;
  },
  renderCell(i, anim){
    const l = W().grid[i], el = this.cells[i];
    if (!l){ el.innerHTML = ""; return; }
    el.innerHTML = this.catHTML(l, anim);
    if (nipOn(i)) el.firstChild.insertAdjacentHTML("beforeend", `<span class="nipTag">🌿</span>`), el.firstChild.classList.add("nipped");
    const svg = el.querySelector("svg"); if (svg && !anim) svg.style.animationDelay = `-${(i*0.37)%2.6}s`;
  },
  renderBoard(){ for (let i=0;i<CONFIG.cells;i++) this.renderCell(i); },
  bounce(i){ const c = this.cells[i].querySelector(".cat"); if (c){ c.classList.remove("boing","pop","spawn"); void c.offsetWidth; c.classList.add("boing"); } },
  puff(i){ const r = this.cells[i].getBoundingClientRect(); this.sparks(r.left+r.width/2, r.top+r.height/2, "#888"); },
  bindDrag(){
    const board = $("board"), ghost = $("ghost");
    let drag = null;
    board.addEventListener("pointerdown", e=>{
      this.wake();
      const cell = e.target.closest(".cell"); if (!cell) return;
      const i = +cell.dataset.i;
      if (aim){ Game.aimAt(i); return; }
      if (!W().grid[i] || W().grid[i] === FOOD) return;
      drag = {i, x:e.clientX, y:e.clientY, moved:false, over:null};
      e.preventDefault();
    });
    window.addEventListener("pointermove", e=>{
      if (!drag) return;
      const dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      if (!drag.moved && dx*dx+dy*dy > 64){
        drag.moved = true;
        const l = W().grid[drag.i];
        ghost.innerHTML = l === 99 ? `<div class="wildCat">🐱</div>` : catSVG(worldCatGid(S.world, l), S.cos.on);
        ghost.style.display = "block";
        const w = this.cells[0].getBoundingClientRect().width; ghost.style.width = ghost.style.height = w+"px";
        const c = this.cells[drag.i].querySelector(".cat"); if (c) c.classList.add("dim");
      }
      if (drag.moved){
        ghost.style.left = e.clientX+"px"; ghost.style.top = e.clientY+"px";
        const t = this.cellAt(e.clientX, e.clientY);
        if (drag.over !== null && drag.over !== t) this.cells[drag.over].classList.remove("hl","bad");
        drag.over = t;
        if (t !== null && t !== drag.i){
          const a = W().grid[drag.i], b = W().grid[t];
          const L = CONFIG.levels, tl = a===99 ? b : a;
          const ok = (a===b && a!==99 && a<L) || ((a===99)!==(b===99) && b!==0 && tl<L && tl+1<=bestLevel());
          this.cells[t].classList.add(ok || !b ? "hl" : (a===b ? "bad" : "hl"));
        }
      }
    });
    window.addEventListener("pointerup", e=>{
      if (!drag) return;
      const d = drag; drag = null; ghost.style.display = "none";
      if (d.over !== null) this.cells[d.over].classList.remove("hl","bad");
      if (!d.moved){ Game.tap(d.i, e.clientX, e.clientY); this.update(); return; }
      Game.drop(d.i, this.cellAt(e.clientX, e.clientY)); this.update();
    });
    window.addEventListener("pointercancel", ()=>{ if (drag){ ghost.style.display="none"; this.renderCell(drag.i); drag = null; } });
  },
  cellAt(x,y){
    for (let i=0;i<this.cells.length;i++){ const r = this.cells[i].getBoundingClientRect(); if (x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return i; }
    return null;
  },
  setAim(id){
    const b = id && BOOSTERS.find(x=>x.id===id);
    $("aimBar").classList.toggle("hidden", !b); if (b) $("aimText").textContent = b.bar;
    $("board").className = b ? "aim-" + b.aim : "";
    document.querySelectorAll("#rightCol [data-b]").forEach(el=>el.classList.toggle("armed", el.dataset.b === id));
  },
  // брызгалка: котик фыркает и убегает с поля
  runAway(i, l){
    const cell = this.cells[i], r = cell.getBoundingClientRect();
    const ghost = document.createElement("div"); ghost.className = "runaway"; ghost.innerHTML = l === 99 ? `<div class="wildCat">🐱</div>` : catSVG(worldCatGid(S.world, l), S.cos.on);
    ghost.style.left = r.left+"px"; ghost.style.top = r.top+"px"; ghost.style.width = r.width+"px"; ghost.style.height = r.height+"px";
    ghost.style.setProperty("--dx", (r.left + r.width/2 < innerWidth/2 ? -1 : 1) * (innerWidth*0.6) + "px");
    document.body.appendChild(ghost); setTimeout(()=>ghost.remove(), 1100);
    for (let k=0;k<7;k++){ const d = document.createElement("i"); d.className = "drop"; d.textContent = "💧";
      d.style.left = (r.left + r.width*(0.2+Math.random()*0.6))+"px"; d.style.top = (r.top + r.height*0.2)+"px"; d.style.animationDelay = (k*0.04)+"s";
      document.body.appendChild(d); setTimeout(()=>d.remove(), 900); }
    this.renderCell(i);
  },
  nipFx(i){ const r = this.cells[i].getBoundingClientRect(); this.sparks(r.left+r.width/2, r.top+r.height/2, "#5DB04A"); this.floatText(r.left+r.width/2, r.top, `×${String(NIP_MULT).replace(".", DEC())} ${T("на")} ${NIP_MINUTES} ${T("мин")}`); },
  onMerge(a, b, nl, reward, perfect, cm, extra, auto){
    this.renderCell(a); this.renderCell(b, "pop");
    const r = this.cells[b].getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
    this.sparks(cx, cy, perfect ? "#8466F0" : "#FFC43D");
    this.floatText(cx, cy-10, `+${fmt(reward)} 🪙`);
    if (perfect) setTimeout(()=>this.floatText(cx, cy-36, T("Отлично!"), "perfect"), 120);
    if (extra) setTimeout(()=>this.floatText(cx, cy-60, extra), 280);
    SFX.pop(); Snd.vibrate(15);
    const rr = LEVEL_RARITY[nl-1];
    setTimeout(()=>{ Snd.voice(worldCatGid(S.world, nl), 0.75); this.meowBubble(b, worldCatGid(S.world, nl)); }, 90);
    if (rr >= 2) setTimeout(SFX.sparkle, 150);
    if (rr >= 4) setTimeout(SFX.chord, 260);
    this.showCombo(cm);
    this.update();
  },
  // неверная попытка соединения: котик недовольно мяукает, перетаскиваемый возвращается на место
  grumble(a, b, msg){
    this.renderCell(a);
    const l = W().grid[b], gid = l && l !== 99 ? worldCatGid(S.world, l) : worldCatGid(S.world, 1);
    Snd.voice(gid, 0.9, "grumpy");
    const el = this.cells[b].querySelector(".cat"); if (el){ el.classList.remove("angry"); void el.offsetWidth; el.classList.add("angry"); }
    const ea = this.cells[a].querySelector(".cat"); if (ea){ ea.classList.remove("angry"); void ea.offsetWidth; ea.classList.add("angry"); }
    this.meowBubble(b, gid, "grumpy");
    Snd.vibrate([20,40,20]);
    if (msg && now() - (this._grumbleTipAt||0) > 5000){ this._grumbleTipAt = now(); this.toast("😾 " + msg); }
  },
  // облачко с «мяу» над котиком
  meowBubble(i, gid, mood){
    const cell = this.cells[i]; if (!cell) return;
    const v = Snd.voiceOf(gid);
    const b = document.createElement("div");
    b.className = "meow" + (mood === "grumpy" ? " grumpy" : "");
    b.textContent = mood === "grumpy" ? T("мяв!") : T(v.word);
    const r = cell.getBoundingClientRect();
    b.style.left = (r.left + r.width/2) + "px"; b.style.top = (r.top + 4) + "px";
    document.body.appendChild(b); setTimeout(()=>b.remove(), 1300);
  },
  // котики на поле иногда мяукают — по одному, своим голосом
  _meowT: 0,
  ambientMeow(){
    const [a, b] = CONFIG.meowEvery;
    clearTimeout(this._meowT);
    this._meowT = setTimeout(()=>{
      this.ambientMeow();
      if (Game.paused || document.hidden || !S.set.sound || $("modal").classList.contains("on") || this.sheet || aim) return;
      if (now() - Snd.lastVoiceAt < 2500) return;
      const cells = []; W().grid.forEach((l,i)=>{ if (l && l !== 99 && l !== FOOD) cells.push(i); });
      if (!cells.length) return;
      const i = pick(cells), gid = worldCatGid(S.world, W().grid[i]);
      Snd.voice(gid, 0.55);
      this.meowBubble(i, gid);
      const el = this.cells[i].querySelector(".cat"); if (el){ el.classList.remove("boing"); void el.offsetWidth; el.classList.add("boing"); }
    }, rnd(a, b) * 1000);
  },
  showCombo(m){
    const el = $("comboTag");
    if (combo.n >= 2){ el.textContent = `${T("🔥 Серия ×")}${String(m).replace(".", DEC())}`; el.classList.add("on"); } else el.classList.remove("on");
  },

  /* ================= ВЕРХНЯЯ ЧАСТЬ И ЦЕЛИ ================= */
  update(){
    const w = W();
    $("coins").textContent = fmt(S.coins);
    $("cps").textContent = `+${fmt(incomePerSec())} ${T("в сек")}`;
    $("paws").textContent = fmt(S.paws);
    const ev = activeEvent();
    $("evPill").classList.toggle("hidden", ev === null); $("evBtn").classList.toggle("hidden", ev === null);
    if (ev !== null){ $("evIc").textContent = EVENTS[ev].cur.ic; $("evAmt").textContent = fmt(S.ev.amt); $("evBtnIc").textContent = EVENTS[ev].e; }
    $("boxCount").textContent = w.boxes;
    const full = w.boxes >= boxCap();
    $("boxInfo").textContent = full ? T("лежанка полная") : `${T("ещё одна через")} ${fmtSec(boxInterval()-w.boxTimer)}`;
    $("boxProg").style.width = full ? "100%" : (w.boxTimer/boxInterval()*100)+"%";
    $("buyCost").textContent = fmt(shopPrice());
    $("buyBtn").disabled = S.coins < shopPrice();
    const fl = (S.freeBoxAt - now())/1000;
    $("freeLbl").textContent = fl > 0 ? fmtClock(fl) : T("Подарок");
    $("freeBtn").disabled = fl > 0;
    const tl = (S.turboUntil - now())/1000;
    $("turboTag").classList.toggle("hidden", tl <= 0);
    $("turboLeft").textContent = tl > 0 ? fmtClock(tl) : "";
    $("turboBtn").disabled = tl > 0;
    if (WD().res){ $("resAmt").textContent = fmt(w.res); }
    BOOSTERS.forEach(b=>{ const c = $("bc_"+b.id), n = S.boost[b.id]||0; c.textContent = n || "+"; c.classList.toggle("zero", !n); });
    $("rewDot").classList.toggle("on", Game.dailyAvailable() || Quests.claimable() || WEEKLY_CHESTS.some((c,i)=>!S.weekly.claimed[i] && S.weekly.score >= c.need));
    $("upDot").classList.toggle("on", UPGRADES.some(u=>w.upg[u.id] < u.max && S.coins >= upgCost(u)));
    $("worldDot").classList.toggle("on", S.unlocked-1 > S.world && !S.W[S.unlocked-1]);
    this.goals();
    // кнопки в открытой панели
    if (this.sheet) $("sheetBody").querySelectorAll("[data-need]").forEach(el=>{
      const [k, v] = el.dataset.need.split(":"); const have = k==="coins"?S.coins:k==="paws"?S.paws:k==="crystals"?S.crystals:k==="res"?W().res:k==="ev"?S.ev.amt:0;
      el.disabled = have < +v;
    });
    this.autoTips();
  },
  goals(){
    const w = W(), d = WD();
    const k = w.found.indexOf(false);
    if (k > 0){
      const have = w.grid.filter(l=>l===k).length;
      $("g1t").innerHTML = `<b>${T("Новый кот")}</b>${T("Соедини 2 × «")}${esc(d.cats[k-1].n)}»`;
      $("g1b").style.width = Math.min(100, have/2*100)+"%";
    } else { $("g1t").innerHTML = `<b>${T("Все коты собраны!")}</b>${T("Самый старший:")} ${Math.max(0,...w.grid.filter(l=>l!==99))} ${T("ур.")}`; $("g1b").style.width = "100%"; }
    const cand = UPGRADES.filter(u=>w.upg[u.id]<u.max).sort((a,b)=>upgCost(a)-upgCost(b))[0];
    if (cand){
      const c = upgCost(cand), left = c - S.coins;
      $("g2t").innerHTML = `<b>${cand.ic} ${esc(cand.n)}</b>` + (left > 0 ? `${T("ещё")} ${fmt(left)} 🪙` : `${T("можно улучшить!")}`);
      $("g2b").style.width = Math.min(100, S.coins/c*100)+"%";
    } else { $("g2t").innerHTML = `<b>${T("Улучшения")}</b>${T("все куплены ✓")}`; $("g2b").style.width = "100%"; }
    const f = w.found.filter(Boolean).length, next = WORLDS[S.world+1];
    const LV = CONFIG.levels;
    if (!w.done) $("g3t").innerHTML = `<b>${T("Коллекция")} ${f} ${T("из")} ${LV}</b>` + (next ? `${T("ещё")} ${LV-f} ${T("до")} ${next.e} ${esc(next.n)}` : `${T("ещё")} ${LV-f} ${T("до конца")}`);
    else if (Game.prestigeAvailable()) $("g3t").innerHTML = `<b>${T("Мир собран ✓")}</b>${T("Можно переродиться 💎")}`;
    else $("g3t").innerHTML = next && S.unlocked > S.world+1 ? `<b>${T("Мир собран ✓")}</b>${T("Лети в")} ${next.e} ${esc(next.n)}!` : `<b>${T("Мир собран ✓")}</b>${T("Все миры пройдены!")}`;
    $("g3b").style.width = f/LV*100+"%";
  },

  /* ================= МИР ================= */
  applyWorld(anim){
    const d = WD(), t = d.theme, root = document.documentElement.style;
    $("tip").style.display = "none";
    root.setProperty("--bg1", t.bg1); root.setProperty("--bg2", t.bg2); root.setProperty("--board", t.board);
    root.setProperty("--cell", t.cell); root.setProperty("--wtext", t.text); root.setProperty("--tint", t.tint || "transparent");
    Scene.show(d.id, $("scene"));
    $("app").classList.toggle("dark", t.dark);
    makeParticles(t.part, $("fx"));
    this.renderSides();
    $("worldTitle").innerHTML = `${d.e} ${esc(d.n)} <small>${T("· мир")} ${S.world+1} ${T("из")} ${WORLDS.length}</small>`;
    $("resBtn").classList.toggle("hidden", !d.res);
    if (d.res) $("resIc").textContent = d.res.ic;
    this.renderBoard(); this.update();
    if (anim){ const b = $("board"); b.animate([{opacity:0, transform:"scale(.9)"},{opacity:1, transform:"scale(1)"}], {duration:500, easing:"ease-out"}); }
    Snd.stopMusic(); if (S.set.music) Snd.startMusic();
    if (YG.onWorld) YG.onWorld(t);
    if (d.res && !S.tips["res"+S.world]){ S.tips["res"+S.world] = 1; setTimeout(()=>this.tip(`${d.res.ic} ${d.res.hint} ${T("Кнопка слева.")}`), 900); }
  },

  renderSides(){
    if (window.innerWidth < 760) return;
    const d = WD(), w = W(), f = w.found.filter(Boolean).length;
    const top = Math.max(1, ...w.found.map((x,i)=>x?i+1:0));
    const cat = (l, cls) => `<div class="bigCat ${cls||""}">${w.found[l-1] ? catSVG(worldCatGid(S.world, l), S.cos.on) : lockedSVG(worldCatGid(S.world, l))}</div>`;
    const L = $("sideL"), R = $("sideR");
    L.querySelector(".sIn").innerHTML = `<div class="wName">${d.e} ${esc(d.n)}<small>${esc(d.desc)}</small></div>${cat(top)}${cat(Math.max(1,top-3),"s2")}`;
    const next = w.found.indexOf(false);
    R.querySelector(".sIn").innerHTML = `${cat(next > 0 ? next+1 : CONFIG.levels, "s2")}${cat(Math.max(1, top-1))}<div class="prog">${T("📖 Коллекция:")} ${f} ${T("из")} ${CONFIG.levels}</div>`;
    const part = d.theme.part;
    if (L.dataset.part !== part){ L.dataset.part = R.dataset.part = part; makeParticles(part, L.querySelector(".sfx")); makeParticles(part, R.querySelector(".sfx")); }
  },

  /* ================= ЭФФЕКТЫ ================= */
  floatText(x,y,t,cls=""){
    const d = document.createElement("div"); d.className = "float "+cls; d.textContent = t; d.style.left = x+"px"; d.style.top = y+"px";
    document.body.appendChild(d); setTimeout(()=>d.remove(), 1000);
  },
  sparks(x,y,color){
    for (let k=0;k<12;k++){
      const d = document.createElement("div"); d.className = "spark"; const a = k/12*Math.PI*2, r = rnd(30,60);
      d.style.left = x+"px"; d.style.top = y+"px"; d.style.background = k%2 ? color : "#fff";
      d.style.setProperty("--dx", Math.cos(a)*r+"px"); d.style.setProperty("--dy", Math.sin(a)*r+"px");
      document.body.appendChild(d); setTimeout(()=>d.remove(), 650);
    }
  },
  _toastT:null,
  toast(t){ const el = $("toast"); el.textContent = t; el.style.display = "block"; clearTimeout(this._toastT); this._toastT = setTimeout(()=>el.style.display="none", 2600); },
  _tipT:null,
  tip(t){ const el = $("tip"); el.innerHTML = `💡 ${t}`; el.style.display = "block"; clearTimeout(this._tipT); this._tipT = setTimeout(()=>el.style.display="none", 7000); },
  autoTips(){
    if (S.tutorial < 3 || $("modal").classList.contains("on")) return;
    const once = (k, cond, text)=>{ if (!S.tips[k] && cond){ S.tips[k] = 1; this.tip(text); return true; } return false; };
    const cheap = Math.min(...UPGRADES.map(u=>W().upg[u.id]<u.max ? upgCost(u) : Infinity));
    once("upg", S.coins >= cheap, T("Хватает монет на улучшение! Нажми ⬆️ «Улучшить» внизу экрана."))
    || once("boost", S.stats.merges >= 8, T("Справа — бустеры: 🥣 корм приманит котиков, 💦 брызгалка прогонит лишнего, 🌿 мята — больше монет от котика."))
    || once("buy", S.stats.merges >= 5 && S.coins >= shopPrice(), T("Котика можно купить за монеты — жёлтая кнопка 🛒 внизу."))
    || once("full", !emptyCells().length, T("Поле занято. Соединяй одинаковых котиков — место освободится!"))
    || once("gift", S.stats.merges >= 15, T("Кнопка 🎬 слева — подарок за короткое видео. После видео поле заполнится котятами!"));
  },

  /* ================= ОКНА ================= */
  queue: [],
  showModal(html, btns=[]){
    const box = $("modalBox"); box.innerHTML = html + `<div class="mBtns"></div>`;
    const wrap = box.querySelector(".mBtns");
    btns.forEach(b=>{ const e = document.createElement("button"); e.className = "btn "+(b.c||""); e.innerHTML = b.t; e.onclick = ()=>{ SFX.click(); b.f(); }; wrap.appendChild(e); });
    $("modal").classList.add("on");
  },
  closeModal(){ $("modal").classList.remove("on"); setTimeout(()=>this.runQueue(), 60); },
  enqueue(fn){ this.queue.push(fn); this.runQueue(); },
  runQueue(){ if ($("modal").classList.contains("on")) return; const f = this.queue.shift(); if (f) f(); },
  rewardModal(title, lines, extraBtns){
    this.enqueue(()=>this.showModal(`<h2>${title}</h2><div class="lines">${lines.map(esc).join("<br>")}</div>`, extraBtns || [{t:T("Отлично!"), c:"primary", f:()=>this.closeModal()}]));
  },
  newCatModal(gid, isNew){
    const c = ALBUM[gid], rr = RARITY[c.r];
    if (isNew) setTimeout(()=>this.renderSides(), 50);
    this.enqueue(()=>{
      if (isNew){ SFX.sparkle(); setTimeout(()=>Snd.voice(gid, 1), 350); }
      this.showModal(`<h2>${isNew ? T("Новый котик! 🎉") : esc(c.n)}</h2><div class="pic">${catSVG(gid, S.cos.on)}</div>
        ${isNew ? `<div class="big" style="font-size:1.4rem">${esc(c.n)}</div>` : ""}
        <span class="rar" style="background:${rr.c}">${rr.ic} ${rr.n}</span><p>${esc(c.d)}</p>
        ${c.kind==="world" ? `<p>${T("Приносит")} <b>${fmt(INC[c.lv-1]*WORLDS[c.world].mult)} 🪙</b> ${T("в секунду")}${isNew?` · +${CONFIG.newCatPaws} 🐾`:""}</p>` : ""}
        ${c.bonus ? `<p>${T("Бонус:")} <b>+${Math.round(c.bonus*100)}%</b> ${T("ко всему доходу")}</p>` : ""}`,
        isNew ? [{t:T("Ура!"), c:"primary", f:()=>{ this.closeModal(); if (YG.onNewCat) YG.onNewCat(); }}]
              : [{t: S.favorite===gid ? T("⭐ Это твой любимчик") : T("⭐ Сделать любимым"), c:"accent", f:()=>{ S.favorite = gid; Game.pushCollect(); Game.save(); this.closeModal(); this.toast(T("Этого котика увидят другие игроки")); if (this.sheet==="album") this.renderSheet(); }},
                 {t:T("Закрыть"), c:"", f:()=>this.closeModal()}]);
    });
  },
  worldDoneModal(w, lines, next, creator){
    const d = WORLDS[w];
    this.enqueue(()=>{ SFX.fanfare(); this.showModal(`<h2>${T("Мир «")}${esc(d.n)}${T("» собран! 🏆")}</h2><div class="pic">${catSVG(worldCatGid(w,CONFIG.levels))}</div>
      <p>${T("Все")} ${CONFIG.levels} ${T("котиков в альбоме")}</p><div class="lines">${lines.map(esc).join("<br>")}</div><p>${T("И ещё")} <b>+10%</b> ${T("к доходу этого мира навсегда")}</p>`,
      next >= 0 ? [{t:`${T("Полетели в")} ${WORLDS[next].e} ${esc(WORLDS[next].n)}!`, c:"primary", f:()=>{ this.closeModal(); this.closeSheet(); Game.travel(next); this.toast(`${T("Добро пожаловать:")} ${WORLDS[next].e} ${WORLDS[next].n}!`); }},
                  {t:T("Остаться здесь"), c:"", f:()=>{ this.closeModal(); YG.interstitial(); }}]
                : [{t:T("Ура!"), c:"primary", f:()=>{ this.closeModal(); YG.interstitial(); }}]); });
    if (creator) this.newCatModal(SPECIAL_BASE, true);
    if (Game.prestigeAvailable() && !S.tips.prest){ S.tips.prest = 1; this.enqueue(()=>this.showModal(`<h2>${T("Открыто перерождение 💎")}</h2><p>${T("Можно начать путь заново и получить кристаллы. Кристаллы дают бонусы")} <b>${T("навсегда")}</b>${T(". Альбом, наряды и лапки останутся.")}</p>`, [{t:T("Посмотреть"), c:"premium", f:()=>{ this.closeModal(); this.openSheet("upgrades","prestige"); }}, {t:T("Позже"), c:"", f:()=>this.closeModal()}])); }
  },
  boosterEmpty(id){
    const b = BOOSTERS.find(x=>x.id===id);
    this.showModal(`<h2>${b.ic} ${esc(b.n)}</h2><p>${esc(b.d)}</p><p>${T("Бустеры закончились. Возьми ещё один:")}</p>`,
      [{t:T("🎬 Бесплатно за видео"), c:"premium", f:()=>{ this.closeModal(); Game.rewarded(()=>{ S.boost[id]++; this.toast(`${b.ic} +1 ${b.n}`); }); }},
       {t:`${T("Купить за 🐾")} ${b.paws}`, c:"accent", f:()=>{ this.closeModal(); Game.buyWithPaws("booster", id); }},
       ...(b.cr ? [{t:`${T("Купить за 💎")} ${b.cr}`, c:"premium", f:()=>{ this.closeModal(); Game.buyBoosterCrystals(id); }}] : []),
       {t:T("Не сейчас"), c:"", f:()=>this.closeModal()}]);
  },
  noPaws(){ this.toast(T("Не хватает лапок 🐾. Их дают за новых котиков, задания и ежедневные подарки")); SFX.bad(); },
  fakeAd(done){
    const el = $("adFake"); el.style.display = "flex"; Game.pause(true); let t = 2; $("adFakeT").textContent = t;
    const iv = setInterval(()=>{ t--; $("adFakeT").textContent = t; if (t <= 0){ clearInterval(iv); el.style.display = "none"; Game.pause(false); done(); } }, 1000);
  },
  freeGift(){
    if (S.freeBoxAt > now()) return;
    this.showModal(`<h2>${T("🎬 Подарок за видео")}</h2><p>${T("Посмотри короткое видео и получи:")}</p><div class="lines">${T("🐱 Котика постарше")}<br>${T("🐾 +2 лапки")}<br>${T("✨ Котята на все пустые клетки")}</div>`,
      [{t:T("🎬 Смотреть видео"), c:"premium", f:()=>{ this.closeModal(); Game.rewarded(()=>{ S.freeBoxAt = now() + CONFIG.freeBoxCooldown*1000; S.paws += 2; placeCat(bonusLevel(1)); SFX.sparkle(); }); }},
       {t:T("Не сейчас"), c:"", f:()=>this.closeModal()}]);
  },
  turboOffer(){
    if (S.turboUntil > now()) return;
    this.showModal(`<h2>${T("⚡ Турбо")}</h2><p>${T("Все котики будут приносить")} <b>${T("в 2 раза больше монет")}</b> ${CONFIG.turboMinutes} ${T("минут.")}</p><p>${T("А после видео котята займут все пустые клетки!")}</p>`,
      [{t:T("🎬 Смотреть видео"), c:"premium", f:()=>{ this.closeModal(); Game.rewarded(()=>{ S.turboUntil = now()+CONFIG.turboMinutes*60000; SFX.fanfare(); this.toast(T("⚡ Доход ×2 на 5 минут!")); }); }},
       {t:T("Не сейчас"), c:"", f:()=>this.closeModal()}]);
  },

  /* ================= ПАНЕЛИ ================= */
  get titles(){ return {upgrades:T("⬆️ Улучшения"), shop:T("🛒 Магазин"), album:T("📖 Альбом"), worlds:T("🌍 Карта миров"), rewards:T("🎁 Награды"), social:(YG.caps.leaderboards ? T("👥 Друзья и рейтинг") : T("👥 Друзья")), settings:T("⚙️ Настройки"), res:"", event:""}; },
  get tabsOf(){ return {
    upgrades:[["world",T("Этот мир")],["prestige",T("Навсегда 💎")]],
    shop:[["boost",T("Бустеры")],["coins",T("Монеты")],["special",T("Особое")],["cos",T("Наряды")],...(YG.caps.iap ? [["premium",T("Премиум")]] : [])],
    album:()=>[...WORLDS.map((w,i)=>[String(i), w.e+" "+w.n]),["ev",T("🎉 События")],["sp",T("✨ Особые")]],
    rewards:[["daily",T("Каждый день")],["quests",T("Задания")],["weekly",T("Неделя")]],
    social:YG.caps.leaderboards ? [["friends",T("Друзья")],["weekly",T("Рейтинг недели")],["collect",T("Коллекционеры")]] : null,
  }; },
  openSheet(id, tab){
    this.sheet = id;
    document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on", b.dataset.p===id));
    let tabs = this.tabsOf[id]; if (typeof tabs === "function") tabs = tabs();
    this.tab = tab || (tabs ? (id==="album" ? String(S.world) : tabs[0][0]) : null);
    $("sheetTabs").innerHTML = tabs ? tabs.map(([k,n])=>`<button data-t="${k}" class="${k===this.tab?"on":""}">${n}</button>`).join("") : "";
    $("sheetTabs").querySelectorAll("button").forEach(b=>b.onclick=()=>{ SFX.click(); this.tab = b.dataset.t; $("sheetTabs").querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b)); this.renderSheet(); });
    const on = $("sheetTabs").querySelector(".on"); if (on){ const tb = $("sheetTabs"); tb.scrollLeft = Math.max(0, on.offsetLeft - tb.clientWidth/2 + on.offsetWidth/2); }
    $("sheet").classList.add("on");
    this.renderSheet();
  },
  closeSheet(){ this.sheet = null; $("sheet").classList.remove("on"); document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on", b.dataset.p==="board")); },
  renderSheet(){
    const id = this.sheet; if (!id) return;
    const body = $("sheetBody"), top = body.scrollTop;
    const r = this["sheet_"+id].call(this, this.tab);
    if (typeof r === "string"){ body.innerHTML = r; }
    body.scrollTop = top;
    let t = this.titles[id];
    if (id === "res") t = `${WD().res.ic} ${WD().res.n}`;
    if (id === "event"){ const e = activeEvent(); t = e !== null ? `${EVENTS[e].e} ${EVENTS[e].n}` : T("Событие"); }
    $("sheetTitle").textContent = t;
    body.querySelectorAll("[data-act]").forEach(el=>el.onclick=()=>{ SFX.click(); this.act(el.dataset.act, el.dataset.arg, el); });
    this.update();
  },
  refresh(){ if (this.sheet) this.renderSheet(); },
  act(a, arg, el){
    const G = Game;
    switch(a){
      case "upg": G.buyUpgrade(arg); break;
      case "offline": G.buyOffline(); break;
      case "pupg": G.buyPrestige(arg); break;
      case "prestige": return this.prestigeConfirm();
      case "boost": G.buyWithPaws("booster", arg); break;
      case "boostCr": G.buyBoosterCrystals(arg); break;
      case "boostAd": if (S.boostAdAt > now()) { this.toast(`${T("Следующий бустер за видео через")} ${fmtSec((S.boostAdAt-now())/1000)}`); return; }
        return G.rewarded(()=>{ S.boost[arg]++; S.boostAdAt = now() + CONFIG.boostAdCooldown*1000; this.toast(T("+1 бустер")); this.refresh(); });
      case "coins": G.buyWithPaws("coins", arg.split(",").map(Number)); break;
      case "special": G.buyWithPaws("special"); break;
      case "turbo30": G.buyWithPaws("turbo30"); break;
      case "cos": G.buyWithPaws("cos", arg); break;
      case "iap": return YG.buy(arg).then(()=>this.refresh());
      case "travel": this.closeSheet(); G.travel(+arg); return;
      case "cat": return this.newCatModal(+arg, false);
      case "daily": { const r = G.claimDaily(1); if (r) this.rewardModal(`${T("День")} ${r.idx+1}${T(": награда! 🎁")}`, r.lines); break; }
      case "daily2": return G.rewarded(()=>{ const r = G.claimDaily(2); if (r) this.rewardModal(`${T("День")} ${r.idx+1}${T(": двойная награда! 🎁")}`, r.lines); this.refresh(); });
      case "streak": return G.rewarded(()=>{ S.daily.last = dayStr(-1); this.toast(T("Серия дней восстановлена! 💪")); this.refresh(); });
      case "quest": { const q = S.quests.list[+arg]; if (q && !q.claimed && q.prog >= q.target){ q.claimed = true; const ev = activeEvent(); const bonus = Math.random() < QUEST_BOOST_CHANCE ? pick(GIFT_BOOSTS) : null; const l = G.give({paws:CONFIG.questPaws, ev: ev!==null?10:0, boost: bonus || undefined}); SFX.coin(); this.toast(`${T("Задание выполнено:")} ${l.join(", ")}`); G.save(); } break; }
      case "qchest": if (!S.quests.chest && S.quests.list.every(q=>q.claimed)){ S.quests.chest = true; const l = G.give({incomeSec:300, paws:10, boost:pick(GIFT_BOOSTS.concat(["wild","lucky"]))}); this.rewardModal(T("Сундук дня 🧰"), l); G.save(true); } break;
      case "wchest": { const l = G.claimWeekly(+arg); if (l) this.rewardModal(WEEKLY_CHESTS[+arg].n, l); break; }
      case "res": G.resAction(arg.split(":")[0], +arg.split(":")[1]); break;
      case "evbuy": { const e = activeEvent(); if (e===null) break; const gid = EVENT_BASE + e*4 + (+arg); const c = ALBUM[gid]; if (S.album[gid]) break; if (S.ev.amt < c.price){ this.toast(`${T("Нужно")} ${EVENTS[e].cur.ic} ${c.price}`); break; } S.ev.amt -= c.price; S.album[gid] = true; this.newCatModal(gid, true); G.pushCollect(); G.save(true); break; }
      case "evad": return G.rewarded(()=>{ S.eventAdAt = now() + CONFIG.eventAdCooldown*1000; S.ev.amt += 15; this.toast(T("+15 за видео")); this.refresh(); });
      case "copy": return YG.copy(arg).then(ok=>this.toast(ok ? T("Ссылка скопирована! Отправь её другу") : T("Не получилось скопировать. Продиктуй другу свой код")));
      case "share": { const txt = `${T("Заходи в Cat Merge Idle! Мой код друга:")} ${S.friends.code}`;
        if (YG.share) return YG.share(arg, txt);
        try{ navigator.share({title:"Cat Merge Idle", text:txt, url:arg}); }catch(e){} return; }
      case "redeem": { const v = $("codeIn").value; const r = G.redeemInvite(v, false); if (r.err) this.toast(r.err); else if (r.gift) this.rewardModal(T("Подарок от друга! 🎁"), r.gift); else this.toast(T("Друг добавлен в список")); break; }
      case "login": return YG.login().then(ok=>{ this.toast(ok ? T("Вход выполнен!") : T("Вход отменён")); G.pushCollect(); G.pushWeekly(); this.refresh(); });
      case "viewPlayer": return this.viewPlayer(+arg);
      case "set": S.set[arg] = !S.set[arg]; if (arg==="music"){ S.set.music ? Snd.startMusic() : Snd.stopMusic(); } if (arg==="big") document.documentElement.classList.toggle("big", S.set.big); G.save(); break;
      case "help": return this.help();
      case "reset": return this.showModal(`<h2>${T("Начать всё заново?")}</h2><p>${T("Котики, монеты, альбом и улучшения удалятся. Вернуть их будет нельзя.")}</p>`,
        [{t:T("Да, удалить всё"), c:"danger", f:()=>{ const set = S.set; S = defaultState(); S.set = set; born.fill(0); Game.ensureCode(); Quests.ensure(); this.closeModal(); this.closeSheet(); newGame(); Game.save(true); }},
         {t:T("Нет, оставить"), c:"primary", f:()=>this.closeModal()}]);
    }
    this.refresh();
  },

  /* ---------- улучшения ---------- */
  sheet_upgrades(tab){
    if (tab === "prestige") return this.prestigeHTML();
    const w = W();
    let h = `<p class="note">${T("Улучшения работают в мире")} ${WD().e} ${esc(WD().n)}${T(". В каждом мире — свои.")}</p>`;
    for (const u of UPGRADES){
      const l = w.upg[u.id], max = l >= u.max, c = upgCost(u);
      h += `<div class="row"><div class="ic">${u.ic}</div><div class="tx"><b>${esc(u.n)} · ${l} ${T("из")} ${u.max}</b>${u.eff(l)}${max?"":`<br><span class="nx">→ ${u.eff(l+1)}</span>`}</div>
        <button class="btn ${max?"":"accent"}" data-act="upg" data-arg="${u.id}" ${max?"disabled":`data-need="coins:${c}"`}>${max?T("Готово ✓"):"🪙 "+fmt(c)}</button></div>`;
    }
    const ol = S.offlineLv, omax = ol >= OFFLINE_COST.length, oc = omax ? 0 : OFFLINE_COST[ol]*mult();
    h += `<div class="sec">${T("ДЛЯ ВСЕХ МИРОВ")}</div><div class="row"><div class="ic">🌙</div><div class="tx"><b>${T("Пока тебя нет ·")} ${ol} ${T("из")} ${OFFLINE_COST.length}</b>${T("Котики копят монеты до")} ${OFFLINE_HOURS[ol]} ${T("ч")}${omax?"":`<br><span class="nx">${T("→ до")} ${OFFLINE_HOURS[ol+1]} ${T("ч")}</span>`}</div>
      <button class="btn ${omax?"":"accent"}" data-act="offline" ${omax?"disabled":`data-need="coins:${oc}"`}>${omax?T("Готово ✓"):"🪙 "+fmt(oc)}</button></div>`;
    return h;
  },
  prestigeHTML(){
    let h = `<div class="row" style="display:block;text-align:center"><div class="big">💎 ${fmt(S.crystals)}</div><div class="note" style="margin:0">${T("Кристаллы дают бонусы навсегда — даже после перерождения.")}</div></div>`;
    if (Game.prestigeAvailable()){
      h += `<div class="row iap"><div class="ic">🌟</div><div class="tx"><b>${T("Перерождение")}</b>${T("Начни с Дома и получи")} <b>💎 ${Game.prestigeGain()}</b>${T(". Альбом, наряды, лапки и кристаллы останутся.")}</div><button class="btn premium" data-act="prestige">${T("Переродиться")}</button></div>`;
    } else {
      const d = Game.doneWorlds();
      h += `<div class="row dim"><div class="ic">🔒</div><div class="tx"><b>${T("Перерождение")}</b>${T("Откроется, когда соберёшь")} ${CONFIG.prestigeAfterWorlds} ${T("мира. Сейчас:")} ${d} ${T("из")} ${CONFIG.prestigeAfterWorlds}.</div></div>`;
    }
    h += `<div class="sec">${T("БОНУСЫ НАВСЕГДА")}</div>`;
    for (const u of PRESTIGE_UPG){
      const l = S.prestige.upg[u.id], max = l >= u.max, c = prestigeCost(u);
      h += `<div class="row"><div class="ic">${u.ic}</div><div class="tx"><b>${esc(u.n)} · ${l} ${T("из")} ${u.max}</b>${u.eff(l)}${max?"":`<br><span class="nx">→ ${u.eff(l+1)}</span>`}</div>
        <button class="btn ${max?"":"premium"}" data-act="pupg" data-arg="${u.id}" ${max?"disabled":`data-need="crystals:${c}"`}>${max?T("Готово ✓"):"💎 "+c}</button></div>`;
    }
    return h;
  },
  prestigeConfirm(){
    const g = Game.prestigeGain();
    this.showModal(`<h2>${T("Переродиться? 🌟")}</h2><div class="big">💎 ${g}</div>
      <p><b>${T("Начнётся заново:")}</b> ${T("котики на полях, монеты, улучшения миров, открытые миры.")}</p>
      <p><b>${T("Останется:")}</b> ${T("альбом, лапки, бустеры, наряды, кристаллы и бонусы навсегда.")}</p>`,
      [{t:T("Да, переродиться"), c:"premium", f:()=>{ this.closeModal(); this.closeSheet(); const got = Game.doPrestige(); this.rewardModal(T("Новая жизнь! 🌟"), [`💎 +${got}`, T("Потрать кристаллы в «Улучшить → Навсегда»")]); }},
       {t:T("Нет, позже"), c:"", f:()=>this.closeModal()}]);
  },

  /* ---------- магазин ---------- */
  sheet_shop(tab){
    let h = `<div class="row" style="justify-content:center;font-weight:900;font-size:1.1rem">${T("У тебя: 🐾")} ${fmt(S.paws)}${tab === "boost" ? ` · 💎 ${fmt(S.crystals)}` : ""}</div>`;
    if (tab === "boost"){
      for (const b of BOOSTERS) h += `<div class="row"><div class="ic">${b.ic}</div><div class="tx"><b>${esc(b.n)} ${T("· есть")} ${S.boost[b.id]||0}</b>${esc(b.d)}</div>
        <div style="display:flex;flex-direction:column;gap:.3rem"><button class="btn accent" data-act="boost" data-arg="${b.id}" data-need="paws:${b.paws}">🐾 ${b.paws}</button>${b.cr ? `<button class="btn primary" data-act="boostCr" data-arg="${b.id}" data-need="crystals:${b.cr}">💎 ${b.cr}</button>` : ""}<button class="btn premium" data-act="boostAd" data-arg="${b.id}" ${S.boostAdAt > now() ? "disabled" : ""}>${S.boostAdAt > now() ? "🎬 "+fmtClock((S.boostAdAt-now())/1000) : T("🎬 За видео")}</button></div></div>`;
    }
    if (tab === "coins"){
      h += `<p class="note">${T("Меняй лапки на монеты. Чем больше доход, тем больше монет.")}</p>`;
      for (const [p, sec, n] of [[10,300,T("Мешок монет")],[25,900,T("Сундук монет")],[60,2700,T("Гора монет")]])
        h += `<div class="row"><div class="ic">🪙</div><div class="tx"><b>${n}</b>🪙 ${fmt(incomeSecCoins(sec))}</div><button class="btn accent" data-act="coins" data-arg="${p},${sec}" data-need="paws:${p}">🐾 ${p}</button></div>`;
    }
    if (tab === "special"){
      h += `<div class="row"><div class="ic">💝</div><div class="tx"><b>${T("Особая коробка")}</b>${T("Котик на 2 уровня старше обычного")}</div><button class="btn accent" data-act="special" data-need="paws:${CONFIG.specialBoxPaws}">🐾 ${CONFIG.specialBoxPaws}</button></div>`;
      h += `<div class="row"><div class="ic">⚡</div><div class="tx"><b>${T("Долгое турбо")}</b>${T("Доход ×2 на 30 минут")}</div><button class="btn accent" data-act="turbo30" data-need="paws:30">🐾 30</button></div>`;
    }
    if (tab === "cos"){
      h += `<p class="note">${T("Наряды надеваются на всех котиков. Это только для красоты — на доход не влияют. Нажми ещё раз, чтобы снять.")}</p><div class="colGrid">`;
      for (const c of COSMETICS){
        const own = S.cos.owned[c.id], on = S.cos.on === c.id;
        h += `<div class="card ${on?"fav":""}"><div class="pic">${catSVG(worldCatGid(S.world,1), c.id)}</div><b>${esc(c.n)}</b>
          <button class="btn ${own?(on?"primary":""):"accent"}" style="margin-top:.3rem;width:100%;min-height:2.3rem;padding:.3rem" data-act="cos" data-arg="${c.id}" ${own?"":`data-need="paws:${c.paws}"`}>${own?(on?T("Надет ✓"):T("Надеть")):"🐾 "+c.paws}</button></div>`;
      }
      h += `</div>`;
    }
    if (tab === "premium"){
      h += `<p class="note">${T("Всех котиков и все миры можно открыть бесплатно. Покупки только ускоряют игру и радуют.")}</p>`;
      for (const p of IAP){
        const done = (p.once && S.iapOnce[p.id]) || (p.permanent && S.premium);
        const pr = YG.price(p.id);
        h += `<div class="row iap ${done?"dim":""}"><div class="ic">${p.ic}</div><div class="tx"><b>${esc(p.n)}</b>${esc(p.d)}</div>
          <button class="btn premium" data-act="iap" data-arg="${p.id}" ${done?"disabled":""}>${done?T("Куплено ✓"):`<span class="price">${pr.img?`<img src="${esc(pr.img)}" alt="">`:""}${esc(pr.text)}</span>`}</button></div>`;
      }
    }
    return h;
  },

  /* ---------- альбом ---------- */
  sheet_album(tab){
    const total = ALBUM.length, have = albumCount();
    let worldsDone = 0; WORLDS.forEach((_,i)=>{ if (albumWorldDone(i)) worldsDone++; });
    let h = `<div class="row" style="display:block"><b style="font-size:1.1rem">${T("Всего котиков:")} ${have} ${T("из")} ${total}</b><div class="bar p"><i style="width:${have/total*100}%"></i></div>
      <div class="note" style="margin:.4rem 0 0">${T("Собранный мир: +10% к его доходу. 3 мира: +5% ко всему. Все 5 миров:")} <b>${T("Кот Создатель")}</b>${T(". Коты событий: +2% каждый.")}<br>${T("⭐ Любимого котика видят другие игроки.")}</div></div>`;
    let list = [];
    if (/^\d$/.test(tab)) list = WORLDS[+tab].cats.map((_,l)=>worldCatGid(+tab, l+1));
    else if (tab === "ev") list = ALBUM.filter(c=>c.kind==="event").map(c=>c.gid);
    else list = ALBUM.filter(c=>c.kind==="special").map(c=>c.gid);
    h += `<div class="colGrid">`;
    let lastEv = -1;
    for (const g of list){
      const c = ALBUM[g], ok = albumHas(g), rr = RARITY[c.r];
      if (tab === "ev" && c.event !== lastEv){ lastEv = c.event; h += `<div style="grid-column:1/-1;font-weight:900;margin-top:.3rem">${EVENTS[c.event].e} ${esc(EVENTS[c.event].n)}</div>`; }
      h += `<div class="card ${S.favorite===g?"fav":""}" ${ok?`data-act="cat" data-arg="${g}"`:""}>
        <div class="pic">${ok ? catSVG(g) : lockedSVG(g)}</div><b>${ok?esc(c.n):"???"}</b>${c.kind==="world"?`${c.lv} ${T("ур.")}`:""}
        <br><span class="rar" style="background:${rr.c}">${rr.ic} ${rr.n}</span>${S.favorite===g?"<br>⭐":""}</div>`;
    }
    return h + `</div>`;
  },

  /* ---------- карта миров ---------- */
  sheet_worlds(){
    let h = `<div class="map"><div style="font-size:1.8rem">🌌</div>`;
    for (let i=WORLDS.length-1; i>=0; i--){
      const d = WORLDS[i], open = i < S.unlocked, cur = i === S.world, ws = S.W[i];
      const f = ws ? ws.found.filter(Boolean).length : 0;
      let sub = open ? (ws && ws.done ? T("Собран ✓ · можно вернуться") : `${d.desc} ${T("· котиков")} ${f} ${T("из")} ${CONFIG.levels}`) : `${T("🔒 Откроется, когда соберёшь «")}${esc(WORLDS[i-1].n)}»`;
      if (cur) sub = `${T("Ты здесь · котиков")} ${f} ${T("из")} ${CONFIG.levels}`;
      const isNew = open && !ws;
      h += `<button class="mapNode ${open?"open":""} ${cur?"cur":""} ${isNew?"new":""}" ${open&&!cur?`data-act="travel" data-arg="${i}"`:""}><span class="e">${d.e}</span><div>${esc(d.n)}${d.res?` <span style="font-size:.9rem">${d.res.ic}</span>`:""}<small>${sub}</small></div></button>`;
      if (i) h += `<div class="mapLine"></div>`;
    }
    return h + `</div><p class="note" style="text-align:center">${T("В каждом мире свои котики, улучшения и особый ресурс.")}</p>`;
  },

  /* ---------- награды ---------- */
  sheet_rewards(tab){
    const G = Game;
    if (tab === "daily"){
      const idx = G.dailyIndex(), avail = G.dailyAvailable(), broken = G.streakBroken();
      let h = `<p class="note">${T("Заходи каждый день — подарки растут. Если пропустить день, всё начнётся с первого дня.")}</p>`;
      if (broken && avail) h += `<div class="row"><div class="ic">💔</div><div class="tx"><b>${T("Серия прервалась")}</b>${T("Было дней подряд:")} ${S.daily.day}${T(". Можно вернуть!")}</div><button class="btn premium" data-act="streak">${T("🎬 Вернуть за видео")}</button></div>`;
      h += `<div class="days">` + DAILY.map((d,i)=>{ const done = i < idx || (!avail && i === idx), cur = avail && i === idx;
        return `<div class="day ${done?"done":""} ${cur?"today":""} ${i===6?"big7":""}">${T("День")} ${i+1}<span class="e">${d.e}</span>${esc(d.t)}${done?" ✓":""}</div>`; }).join("") + `</div>`;
      h += avail ? `<div class="mBtns"><button class="btn primary" data-act="daily">${T("Забрать подарок")}</button><button class="btn premium" data-act="daily2">${T("🎬 Забрать ×2 за видео")}</button></div>`
                 : `<p style="text-align:center;font-weight:800;margin-top:1rem">${T("Сегодня подарок уже получен. Приходи завтра! 🐱")}</p>`;
      return h;
    }
    if (tab === "quests"){
      Quests.ensure();
      let h = `<p class="note">${T("Три задания на сегодня. За каждое — 🐾")} ${CONFIG.questPaws}${T(". Выполни все — открой сундук дня!")}</p>`;
      S.quests.list.forEach((q,i)=>{
        const ready = q.prog >= q.target && !q.claimed;
        h += `<div class="row ${q.claimed?"dim":""}"><div class="ic">${q.claimed?"✅":"📋"}</div><div class="tx"><b>${esc(Quests.text(q))}</b>
          <div class="bar"><i style="width:${Math.min(100,q.prog/q.target*100)}%"></i></div>${q.type==="combo"?"":`${fmt(Math.min(q.prog,q.target))} ${T("из")} ${fmt(q.target)}`}</div>
          <button class="btn ${ready?"primary":""}" data-act="quest" data-arg="${i}" ${ready?"":"disabled"}>${q.claimed?T("Готово"):T("Забрать")}</button></div>`;
      });
      const all = S.quests.list.every(q=>q.claimed);
      h += `<div class="row iap"><div class="ic">🧰</div><div class="tx"><b>${T("Сундук дня")}</b>${T("Монеты, лапки и бустер")}</div><button class="btn premium" data-act="qchest" ${all && !S.quests.chest ? "" : "disabled"}>${S.quests.chest?T("Открыт ✓"):T("Открыть")}</button></div>`;
      return h;
    }
    if (tab === "weekly"){
      let h = `<div class="row" style="display:block;text-align:center"><div class="note" style="margin:0">${T("Очки недели — за каждое соединение котиков")}</div><div class="big">🏅 ${fmt(S.weekly.score)}</div><div class="note" style="margin:0">${T("Новая неделя через")} ${fmtSec(weekEndsIn())}</div></div>`;
      WEEKLY_CHESTS.forEach((c,i)=>{
        const ok = S.weekly.score >= c.need, got = S.weekly.claimed[i];
        h += `<div class="row ${got?"dim":""}"><div class="ic">${c.ic}</div><div class="tx"><b>${esc(c.n)}</b>${T("Нужно очков:")} ${fmt(c.need)}<div class="bar y"><i style="width:${Math.min(100,S.weekly.score/c.need*100)}%"></i></div></div>
          <button class="btn ${ok&&!got?"primary":""}" data-act="wchest" data-arg="${i}" ${ok&&!got?"":"disabled"}>${got?T("Получен"):T("Открыть")}</button></div>`;
      });
      return h + (YG.caps.leaderboards ? `<p class="note">${T("Рейтинг недели смотри в разделе 👥 «Друзья и рейтинг».")}</p>` : "");
    }
  },

  /* ---------- друзья и рейтинги ---------- */
  sheet_social(tab){
    if (tab === "friends" || !YG.caps.leaderboards) return this.friendsHTML();
    const body = $("sheetBody");
    const lb = tab === "weekly" ? CONFIG.lbWeekly : CONFIG.lbCollect;
    setTimeout(()=>this.loadLB(tab, lb), 0);
    return `<p class="note">${tab==="weekly" ? `${T("Лучшие игроки этой недели. В понедельник — новый сезон!")}<br>${T("Твои очки:")} <b>${fmt(S.weekly.score)}</b>` : `${T("Лучшие коллекционеры котиков. Нажми на игрока — увидишь его альбом.")}<br>${T("Твоя коллекция:")} <b>${albumCount()} ${T("из")} ${ALBUM.length}</b>`}</p><div id="lbList">${T("Загрузка…")}</div>`;
  },
  lbCache:{},
  async loadLB(tab, lb){
    const el = $("lbList"); if (!el) return;
    if (!YG.on){ el.innerHTML = `<div class="row"><div class="ic">🏆</div><div class="tx"><b>${T("Рейтинг")}</b>${T("Появится, когда игра будет открыта на Яндекс Играх.")}</div></div>` + (tab==="collect" ? this.demoCollectors() : ""); this.bindActs(el); return; }
    const auth = YG.authorized();
    if (tab === "weekly") await Game.pushWeekly(); else await Game.pushCollect();
    const res = await YG.entries(lb, {quantityTop:20, includeUser:auth, quantityAround:5});
    if (this.sheet !== "social" || this.tab !== tab) return;
    if (!res){ el.innerHTML = `<p class="note">${T("Не получилось загрузить рейтинг. Попробуй позже.")}</p>`; return; }
    const me = YG.uid(), wk = weekIndex();
    let rows = res.entries;
    if (tab === "weekly") rows = rows.filter(e=>Math.floor(e.score/1e8) === wk);
    this.lbCache[tab] = rows;
    let h = rows.length ? "" : `<p class="note">${T("Пока здесь никого нет — стань первым!")}</p>`;
    rows.forEach((e,k)=>{
      const isMe = me && e.player.uniqueID === me;
      let av = ""; try{ av = e.player.getAvatarSrc("small"); }catch(_){}
      const info = tab === "collect" ? this.parseExtra(e.extraData) : null;
      const score = tab === "weekly" ? e.score % 1e8 : e.score;
      const pic = info && info.fav != null && ALBUM[info.fav] ? `<span class="av">${catSVG(info.fav, info.cos)}</span>` : (av ? `<img class="av" src="${esc(av)}" alt="">` : `<span class="av">🐱</span>`);
      h += `<div class="lb ${isMe?"me":""} ${info?"click":""}" ${info?`data-act="viewPlayer" data-arg="${k}"`:""}><span class="r">${e.rank}</span>${pic}
        <span class="n">${esc(e.player.publicName || T("Игрок скрыт"))}${info?`<small>${T("Альбом →")}</small>`:""}</span><b>${fmt(score)}${tab==="collect"?" 🐱":""}</b></div>`;
    });
    if (!auth) h += `<div class="mBtns"><button class="btn primary" data-act="login">${T("Войти, чтобы попасть в рейтинг")}</button></div>`;
    el.innerHTML = h; this.bindActs(el);
  },
  bindActs(root){ root.querySelectorAll("[data-act]").forEach(x=>x.onclick=()=>{ SFX.click(); this.act(x.dataset.act, x.dataset.arg, x); }); },
  parseExtra(s){
    if (!s) return null;
    const v3 = s.startsWith("v3|"), v2 = s.startsWith("v2|");
    if (!v3 && !v2) return null;
    let [, alb, fav, cos, code] = s.split("|");
    const set = {};
    if (v3){
      (alb||"").split(".").forEach((part, bi)=>{ let v = parseInt(part,36)||0; for (let k=0; k<30 && v>0; k++){ if (v % 2) set[bi*30+k] = true; v = Math.floor(v/2); } });
    } else {  // старый формат версии 2.0
      const [a, b] = (alb||"0.0").split(".").map(x=>parseInt(x,36)||0);
      for (let g=0; g<32; g++) if (a & (1<<g)) set[v2GidToV3(g)] = true;
      for (let g=32; g<64; g++) if (b & (1<<(g-32))) set[v2GidToV3(g)] = true;
      if (fav !== "") fav = String(v2GidToV3(+fav));
    }
    const ci = +cos;
    return {album:set, fav: fav === "" ? null : +fav, cos: ci >= 0 && COSMETICS[ci] ? COSMETICS[ci].id : "", code};
  },
  demoCollectors(){ return ""; },
  viewPlayer(k){
    const e = (this.lbCache.collect||[])[k]; if (!e) return;
    const info = this.parseExtra(e.extraData); if (!info) return;
    this.showAlbumOf(e.player.publicName || T("Игрок"), info);
  },
  showAlbumOf(name, info){
    const n = Object.keys(info.album).length;
    let h = `<h2>${T("Альбом:")} ${esc(name)}</h2>${info.fav!=null && ALBUM[info.fav] ? `<div class="pic">${catSVG(info.fav, info.cos)}</div><p>${T("Любимчик:")} <b>${esc(ALBUM[info.fav].n)}</b></p>` : ""}
      <p>${T("Котиков:")} <b>${n} ${T("из")} ${ALBUM.length}</b> ${T("· у тебя:")} ${albumCount()}</p><div class="colGrid" style="grid-template-columns:repeat(6,1fr);gap:.2rem">`;
    ALBUM.forEach(c=>{ const ok = info.album[c.gid]; h += `<div title="${ok?esc(c.n):"???"}" style="height:2.4rem">${ok ? catSVG(c.gid) : lockedSVG(c.gid)}</div>`; });
    h += `</div>`;
    this.showModal(h, [{t:T("Закрыть"), c:"primary", f:()=>this.closeModal()}]);
    $("modalBox").querySelectorAll(".colGrid svg").forEach(s=>{ s.style.height = "100%"; s.style.width = "100%"; });
  },
  friendsHTML(){
    const code = S.friends.code, link = YG.inviteLink(code);
    let h = `<p class="note">${T("Позови друга в игру! Друг получит подарок: 🐾")} ${INVITE_GIFT.paws}${T(", монеты и 🌈 Кота-радугу.")}</p>
      <div class="note" style="margin-bottom:.2rem;text-align:center">${T("Твой код друга:")}</div><div class="codeBox">${esc(code)}</div>`;
    h += `<div class="mBtns" style="margin-top:0">`;
    if (link && YG.share) h += `<button class="btn primary" data-act="share" data-arg="${esc(link)}">${T(YG.shareLabel || "📤 Поделиться")}</button>`;
    if (link) h += `<button class="btn ${YG.share ? "" : "primary"}" data-act="copy" data-arg="${esc(link)}">${T("🔗 Скопировать ссылку-приглашение")}</button>`;
    else h += `<button class="btn primary" data-act="copy" data-arg="${esc(code)}">${T("📋 Скопировать код")}</button>`;
    if (link && !YG.share && navigator.share) h += `<button class="btn" data-act="share" data-arg="${esc(link)}">${T("📤 Поделиться")}</button>`;
    h += `</div>`;
    if (!S.friends.invitedBy){
      h += `<div class="sec">${T("ЕСТЬ КОД ДРУГА?")}</div><input class="code" id="codeIn" maxlength="8" placeholder="${T("Например: K7M2QX")}"><div class="mBtns"><button class="btn accent" data-act="redeem">${T("Получить подарок")}</button></div>`;
    } else {
      h += `<div class="sec">${T("ДОБАВИТЬ ДРУГА ПО КОДУ")}</div><input class="code" id="codeIn" maxlength="8" placeholder="${T("Код друга")}"><div class="mBtns"><button class="btn" data-act="redeem">${T("Добавить")}</button></div>`;
    }
    h += `<div class="sec">${T("МОИ ДРУЗЬЯ ·")} ${S.friends.list.length}</div>`;
    if (!S.friends.list.length) h += `<p class="note">${T("Пока пусто. Отправь другу ссылку или код!")}</p>`;
    const known = {}; (this.lbCache.collect||[]).forEach((e,k)=>{ const i = this.parseExtra(e.extraData); if (i && i.code) known[i.code] = k; });
    S.friends.list.forEach(f=>{
      const k = known[f.code];
      h += `<div class="lb ${k!=null?"click":""}" ${k!=null?`data-act="viewPlayer" data-arg="${k}"`:""}><span class="av">🐱</span><span class="n">${T("Друг")} ${esc(f.code)}<small>${f.code===S.friends.invitedBy?T("пригласил тебя"):T("добавлен по коду")}${k!=null?T(" · Альбом →"):""}</small></span></div>`;
    });
    if (!Social.server) h += `<p class="note" style="margin-top:.8rem">${T("Скоро: подарки друзьям каждый день и награда за каждого приглашённого друга.")}</p>`;
    return h;
  },

  /* ---------- ресурс мира ---------- */
  sheet_res(){
    const d = WD(), w = W(), r = d.res, rate = Game.resRate();
    let h = `<div class="row" style="display:block;text-align:center"><div class="big">${r.ic} ${fmt(w.res)}</div><div class="note" style="margin:0">${esc(r.hint)}<br>${T("Сейчас: +")}${(rate*60).toFixed(1).replace(".", DEC())} ${T("в минуту")}</div></div>`;
    if (d.id === "garden"){
      h += `<div class="row"><div class="ic">🐾</div><div class="tx"><b>${T("Обменять на лапки")}</b>50 🌸 = ${T("1 🐾 (меняем всё сразу)")}</div><button class="btn accent" data-act="res" data-arg="flowersToPaws:0" data-need="res:50">${T("Обменять")}</button></div>`;
      h += `<div class="row"><div class="ic">💐</div><div class="tx"><b>${T("Продать букет")}</b>20 🌸 = 🪙 ${fmt(incomeSecCoins(30))}</div><button class="btn accent" data-act="res" data-arg="bouquet:0" data-need="res:20">${T("Продать")}</button></div>`;
    }
    if (d.id === "city"){
      h += `<div class="row"><div class="ic">☕</div><div class="tx"><b>${T("Кафе")}</b>${T("Одна чашка")} = 🪙 ${fmt(Game.coffeePrice())}${T(". Цена растёт вместе с доходом.")}</div><button class="btn accent" data-act="res" data-arg="sellCoffee:0" data-need="res:1">${T("Продать всё")}</button></div>`;
    }
    if (d.id === "island"){
      const names = [["⛱️",T("Шезлонги")],["🍹",T("Бар")],["🏊",T("Бассейн")],["🏨",T("Отель")],["🗼",T("Маяк")]];
      h += `<p class="note">${T("Каждый этаж курорта: +4% к доходу острова. Сейчас:")} <b>+${Math.round((resortBonus()-1)*100)}%</b></p>`;
      names.forEach(([ic,n],i)=>{ const l = w.resort[i], max = l >= 5, c = Game.resortCost(i);
        h += `<div class="row"><div class="ic">${ic}</div><div class="tx"><b>${n} · ${l} ${T("из 5")}</b>${"★".repeat(l)}${"☆".repeat(5-l)}</div><button class="btn ${max?"":"accent"}" data-act="res" data-arg="build:${i}" ${max?"disabled":`data-need="res:${c}"`}>${max?T("Готово ✓"):"🐚 "+c}</button></div>`; });
    }
    if (d.id === "space"){
      const left = (w.genUntil - now())/1000;
      h += `<div class="row"><div class="ic">🤖</div><div class="tx"><b>${T("Генератор")}</b>${T("Сам соединяет котиков 3 минуты")}${left>0?`<br><span class="nx">${T("Работает ещё")} ${fmtSec(left)}</span>`:""}</div><button class="btn accent" data-act="res" data-arg="generator:0" data-need="res:60">🔋 60</button></div>`;
      h += `<div class="row"><div class="ic">📦</div><div class="tx"><b>${T("Зарядка лежанки")}</b>${T("Сразу полная лежанка коробок")}</div><button class="btn accent" data-act="res" data-arg="charge:0" data-need="res:40">🔋 40</button></div>`;
    }
    return h;
  },

  /* ---------- событие ---------- */
  sheet_event(){
    const e = activeEvent(); if (e === null) return `<p class="note">${T("Сейчас событий нет. Следи за праздниками!")}</p>`;
    const E = EVENTS[e];
    const cd = (S.eventAdAt - now())/1000;
    let h = `<div class="row" style="display:block;text-align:center"><div class="big">${E.cur.ic} ${fmt(S.ev.amt)}</div><div class="note" style="margin:0">${esc(E.cur.n)} ${T("выпадают, когда соединяешь котиков, за задания, подарки и видео.")}<br>${T("После праздника")} ${esc(E.cur.n.toLowerCase())} ${T("исчезнут, а котики останутся в альбоме навсегда.")}</div></div>`;
    h += `<div class="row"><div class="ic">🎬</div><div class="tx"><b>+15 ${E.cur.ic} ${T("за видео")}</b>${cd>0?`${T("Можно через")} ${fmtSec(cd)}`:T("Можно сейчас")}</div><button class="btn premium" data-act="evad" ${cd>0?"disabled":""}>${T("🎬 Смотреть видео")}</button></div>`;
    h += `<div class="sec">${T("ПРАЗДНИЧНЫЕ КОТИКИ · +2% ДОХОДА КАЖДЫЙ")}</div><div class="colGrid">`;
    E.cats.forEach((c,k)=>{ const gid = EVENT_BASE + e*4 + k, own = albumHas(gid);
      h += `<div class="card"><div class="pic">${catSVG(gid)}</div><b>${esc(c.n)}</b><button class="btn ${own?"":"accent"}" style="margin-top:.3rem;width:100%;min-height:2.3rem;padding:.3rem" data-act="evbuy" data-arg="${k}" ${own?"disabled":`data-need="ev:${c.price}"`}>${own?T("Есть ✓"):E.cur.ic+" "+c.price}</button></div>`; });
    return h + `</div>`;
  },

  /* ---------- настройки ---------- */
  sheet_settings(){
    const row = (ic,t,k,d)=>`<div class="row"><div class="ic">${ic}</div><div class="tx"><b>${t}</b>${d||""}</div><button class="toggle ${S.set[k]?"on":""}" data-act="set" data-arg="${k}" aria-label="${t}"></button></div>`;
    return row("🔊",T("Звуки"),"sound") + row("🎵",T("Музыка"),"music") + row("📳",T("Вибрация"),"vibro",T("на телефоне")) + row("🔎",T("Крупный текст"),"big",T("всё станет крупнее")) +
      `<div class="mBtns" style="margin:.4rem 0 .8rem"><button class="btn" data-act="help">${T("❓ Как играть")}</button></div>
      <div class="sec">${T("СТАТИСТИКА")}</div><div class="row" style="display:block;font-size:.95rem;line-height:1.75">
      ${T("Соединено котиков:")} <b>${fmt(S.stats.merges)}</b><br>${T("Открыто коробок:")} <b>${fmt(S.stats.boxes)}</b><br>${T("Всего заработано:")} <b>${fmt(S.stats.earned)} 🪙</b><br>
      ${T("Котиков в альбоме:")} <b>${albumCount()} ${T("из")} ${ALBUM.length}</b><br>${T("Перерождений:")} <b>${S.prestige.count}</b><br>${T("Твой код друга:")} <b>${esc(S.friends.code)}</b></div>
      <div class="mBtns"><button class="btn ghostBtn" data-act="reset">${T("Начать всё заново")}</button></div>${YG.cloudStatus && YG.cloudStatus() ? `<p class="note" style="text-align:center;font-size:.8rem">${esc(YG.cloudStatus())}</p>` : ""}<p class="note" style="text-align:center">${T("Версия")} ${CONFIG.version}</p>`;
  },
  help(){
    this.showModal(`<h2>${T("Как играть ❓")}</h2><div style="text-align:left;font-size:1rem;line-height:1.5;color:var(--text)">
      <p>🐱 <b>${T("Перетащи")}</b> ${T("котика на такого же — получится котик постарше.")}</p>
      <p>${T("🪙 Каждый котик на поле")} <b>${T("сам приносит монеты")}</b>.</p>
      <p>📦 <b>${T("Коробки")}</b> ${T("появляются сами. Нажми — выпадет котёнок.")}</p>
      <p>${T("⬆️ Трать монеты на")} <b>${T("улучшения")}</b>.</p>
      <p>${T("📖 Собери всех")} ${CONFIG.levels} ${T("котиков мира — откроется")} <b>${T("новый мир")}</b>.</p>
      <p>${T("🛒 Котиков постарше можно купить в лавке за монеты.")}</p><p>${T("🥣 💦 🌿 Бустеры справа: корм приманит котиков, брызгалка прогонит лишнего, мята прибавит монет.")}</p>
      <p>${T("😾 Разных котиков соединить нельзя — они обидятся.")}</p>
      <p>${T("🎁 Заходи каждый день за")} <b>${T("подарками")}</b> ${T("и заданиями.")}</p>
      <p>${T("👆 Можно просто")} <b>${T("погладить")}</b> ${T("котика — он даст монетку.")}</p></div>`,
      [{t:T("Понятно!"), c:"primary", f:()=>this.closeModal()}]);
  },

  /* ================= ОБУЧЕНИЕ ================= */
  _handAnim:null,
  showHint(text, fromEl, toEl){
    this._hintArgs = [text, fromEl, toEl];
    if (!this._hintRs){ this._hintRs = true; window.addEventListener("resize", ()=>{ if ($("hint").style.display === "block" && this._hintArgs) setTimeout(()=>{ if ($("hint").style.display === "block") this.showHint(...this._hintArgs); }, 120); }); }
    $("hintText").textContent = text; const h = $("hint"); h.style.display = "block";
    const br = $("board").getBoundingClientRect(), ar = $("app").getBoundingClientRect();
    h.style.top = Math.max(0, br.top - ar.top - 12) + "px";
    if (matchMedia("(max-width:1px)").matches){ h.style.left = (br.left - ar.left - 30) + "px"; h.style.width = (br.width + 60) + "px"; h.style.right = "auto"; }
    else { h.style.left = "0"; h.style.right = "0"; h.style.width = ""; }
    const hand = $("hand"); hand.style.display = "block"; cancelAnimationFrame(this._handAnim);
    const loop = t=>{
      const a = fromEl.getBoundingClientRect(), b = (toEl||fromEl).getBoundingClientRect(), ar2 = $("app").getBoundingClientRect();
      const p = (t % 1800)/1800, k = Math.min(1, p*1.4), e = k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
      hand.style.left = (a.left + (b.left-a.left)*e + a.width/2 - ar2.left - 12)+"px";
      hand.style.top = (a.top + (b.top-a.top)*e + a.height/2 - ar2.top - 4)+"px";
      hand.style.opacity = p > .85 ? 0 : 1;
      this._handAnim = requestAnimationFrame(loop);
    };
    this._handAnim = requestAnimationFrame(loop);
  },
  hideHint(){ $("hint").style.display = "none"; $("hand").style.display = "none"; cancelAnimationFrame(this._handAnim); },
  tutorialStep(){
    if (S.tutorial === 0){
      const idx = []; W().grid.forEach((l,i)=>{ if (l===1) idx.push(i); });
      if (idx.length >= 2) this.showHint(T("Перетащи котика на такого же 🐱"), this.cells[idx[0]], this.cells[idx[1]]);
      else S.tutorial = 3;
    } else if (S.tutorial === 1 || S.tutorial === 2){
      S.tutorial = 2; if (W().boxes < 1) W().boxes = 1; this.update();
      this.showHint(T("Нажми «Коробка» — выпадет котёнок 📦"), $("boxBtn"), $("boxBtn"));
    }
  },
  tutorialMerged(){
    S.tutorial = 1; addCoins(100); this.hideHint();
    setTimeout(()=>this.enqueue(()=>this.showModal(`<h2>${T("Молодец! 🎉")}</h2><div class="big">+100 🪙</div><p>${T("Из двух одинаковых котиков получается новый. Каждый котик на поле приносит монеты — даже когда ты отдыхаешь.")}</p>`,
      [{t:T("Дальше"), c:"primary", f:()=>{ this.closeModal(); this.tutorialStep(); }}])), 400);
  },
  tutorialBoxed(){ S.tutorial = 3; this.hideHint(); Game.save(); setTimeout(()=>this.tip(T("Отлично! Соединяй котиков, открывай коробки и собирай коллекцию. Подсказки будут появляться здесь.")), 600); },
};

/* ================= ЗАПУСК ================= */
function newGame(){
  const w = W(); w.grid[9] = 1; w.grid[10] = 1; born[9] = born[10] = 0; w.boxes = 2;
  UI.applyWorld(); setTimeout(()=>UI.tutorialStep(), 450);
}
async function boot(){
  $("loadCat").innerHTML = catSVG(0);
  UI.init();
  await YG.init();
  const saved = await loadState();
  if (saved) S = saved;
  if (YG.onLoaded) YG.onLoaded(S);
  document.documentElement.classList.toggle("big", !!S.set.big);
  Game.ensureCode();
  Quests.ensure();
  const wl = Game.weeklyCheck();
  const ev = activeEvent(); const evId = ev === null ? "" : EVENTS[ev].id; if (S.ev.id !== evId) S.ev = {id:evId, amt:0};
  let off = null;
  if (saved && S.wasReset){
    S.wasReset = false; UI.applyWorld(); Game.save(true);
    UI.enqueue(()=>UI.showModal(`<h2>${T("Новый старт! 🐾")}</h2><p>${T("Мы обновили игру, и прогресс всех игроков начался заново. Котики уже ждут тебя в «Доме»!")}</p><p style="font-size:.9rem">${T("Настройки и покупки сохранены.")}</p>`, [{t:T("Играть"), c:"primary", f:()=>UI.closeModal()}]));
  }
  else if (saved){ off = offlineGain(); UI.applyWorld(); if (S.tutorial < 3) setTimeout(()=>UI.tutorialStep(), 500); }
  else newGame();
  if (!S.resetEpoch) S.resetEpoch = resetEpoch();   // новые игроки не попадают под уже прошедший сброс
  if (off){
    UI.enqueue(()=>UI.showModal(`<h2>${T("С возвращением! 😺")}</h2><p>${T("Тебя не было")} ${fmtSec(off.sec)}${T(". Котики заработали:")}</p><div class="big">🪙 ${fmt(off.gain)}</div><p style="font-size:.9rem">${T("Котики копят монеты до")} ${offlineHours()} ${T("ч. Больше — в «Улучшить».")}</p>`,
      [{t:`${T("🎬 Забрать ×2 за видео —")} ${fmt(off.gain*2)}`, c:"premium", f:()=>{ UI.closeModal(); Game.rewarded(()=>{ addCoins(off.gain*2); SFX.coin(); }, ()=>{ addCoins(off.gain); UI.update(); }); }},
       {t:T("Забрать"), c:"primary", f:()=>{ addCoins(off.gain); SFX.coin(); UI.closeModal(); UI.update(); Game.save(true); }}]));
  }
  if (YG.payload && YG.payload.startsWith("f_") && !S.friends.invitedBy){
    const r = Game.redeemInvite(YG.payload, true);
    if (r.gift) UI.rewardModal(T("Тебя пригласил друг! 🎁"), r.gift);
  }
  const bon = Game.dayBonuses(); if (bon.length) UI.rewardModal(T("Ежедневные бонусы ☀️"), bon);
  if (wl) UI.rewardModal(T("Сундуки прошлой недели 🏅"), wl);
  if (Game.dailyAvailable() && S.tutorial >= 3) UI.enqueue(()=>UI.openSheet("rewards","daily"));
  UI.update();
  $("loading").style.display = "none";
  window.__booted = true;
  YG.ready();                                  // Game Ready: игрок может начинать (1.19.2)
  YG.initPayments().then(()=>YG.restorePurchases()).then(()=>{ UI.update(); if (UI.sheet === "shop") UI.renderSheet(); });
  lastTick = now();
  setInterval(tick, 100);
  setInterval(()=>{ if (!Game.paused) UI.update(); }, 300);
  setInterval(()=>{ if (UI.sheet === "res" || UI.sheet === "event") UI.renderSheet(); }, 2000);
  UI.ambientMeow();
  setTimeout(()=>{ Game.pushCollect(); Game.pushWeekly(); }, 3000);
}
document.addEventListener("visibilitychange", ()=>{
  if (document.hidden) Game.save(true); else lastTick = now();
  Snd.refreshMute();
});
window.addEventListener("blur", ()=>Snd.setFocus(false));
window.addEventListener("focus", ()=>Snd.setFocus(true));
window.addEventListener("pointerdown", ()=>{ if (!document.hidden) Snd.setFocus(true); }, true);
window.addEventListener("pagehide", ()=>Game.save(true));
boot();
