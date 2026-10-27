"use strict";
/* =====================================================================
   ПЛАТФОРМА: Telegram Mini App
   • Telegram WebApp API: язык, пауза при сворачивании, вибрация, цвет шапки,
     запрет «смахивания» окна при перетаскивании котиков, приглашения через ссылку.
   • Сохранения: Telegram CloudStorage (облако аккаунта) + копия в браузере.
   • Реклама: AdsGram — рекламная сеть для Telegram Mini Apps
     (за награду и межстраничная). Номера блоков — в файле tg-config.js.
   ===================================================================== */
const I18N = {
  SUPPORTED: ["ru","en"], FALLBACK: "en",
  lang: "ru", playerLang: "ru",
  // язык игрока из Telegram: ru/be/kk/uk/uz → русский, остальные → английский
  apply(l){ this.playerLang = l || ""; this.lang = this.playerLang ? pickLang(this.playerLang) : "ru"; setLang(this.lang); },
};
function withTimeout(p, ms, fallback){
  return new Promise(res=>{ let done = false; const t = setTimeout(()=>{ if (!done){ done = true; res(fallback); } }, ms);
    Promise.resolve(p).then(v=>{ if (!done){ done = true; clearTimeout(t); res(v); } }, ()=>{ if (!done){ done = true; clearTimeout(t); res(fallback); } }); });
}
const TGC = Object.assign({bot:"", app:"", adsReward:"", adsInter:"", adsDebug:false}, window.TG_CONFIG || {});
const CHUNK = 3800;                 // в CloudStorage одно значение — до 4096 символов, поэтому режем сохранение на части

const YG = {
  platform: "telegram",
  caps: {iap:false, leaderboards:false},
  platformMute: false,
  shareLabel: "📨 Позвать друга в Telegram",
  lang: "ru",
  sdk: null, user: null, flags: {}, payload: "",
  get on(){ return !!this.sdk; },
  ver(v){ try{ return this.sdk && this.sdk.isVersionAtLeast(v); }catch(e){ return false; } },

  async init(){
    const W = window.Telegram && window.Telegram.WebApp;
    // вне Telegram (просто в браузере) — тестовый режим: язык браузера, локальные сохранения
    if (!W || (!W.initData && (!W.platform || W.platform === "unknown"))){ I18N.apply(String(navigator.language || "ru").toLowerCase()); return; }
    this.sdk = W;
    try{ W.ready(); }catch(e){}
    try{ W.expand(); }catch(e){}
    // перетаскивание котиков вниз не должно закрывать игру
    try{ if (this.ver("7.7")) W.disableVerticalSwipes(); }catch(e){}
    this.onWorld({bg2:"#F7E3C6"});
    const u = W.initDataUnsafe || {};
    this.user = u.user || null;
    this.lang = String((this.user && this.user.language_code) || navigator.language || "ru").toLowerCase();
    I18N.apply(this.lang);
    this.payload = u.start_param || "";        // ссылка-приглашение: t.me/бот/игра?startapp=f_КОД
    // Telegram свернули / развернули — пауза и тишина, прогресс сохраняется
    try{ W.onEvent("deactivated", ()=>{ this._platPause = true; this._applyPause(); try{ Game.save(true); }catch(e){} }); }catch(e){}
    try{ W.onEvent("activated", ()=>{ this._platPause = false; this._applyPause(); this.syncCheck(); }); }catch(e){}
    document.addEventListener("visibilitychange", ()=>{ if (!document.hidden) this.syncCheck(); });
    setInterval(()=>{ if (!document.hidden && !Game.paused) this.syncCheck(); }, 45000);
    // вибрация через Telegram (navigator.vibrate не работает на iPhone)
    if (W.HapticFeedback && this.ver("6.1")){
      Snd.vibrate = ms => { if (!S.set.vibro) return; try{ Array.isArray(ms) ? W.HapticFeedback.notificationOccurred("warning") : W.HapticFeedback.impactOccurred("light"); }catch(e){} };
    }
  },
  // цвет шапки и фона Telegram под цвет мира
  onWorld(theme){
    if (!this.sdk || !this.ver("6.1")) return;
    try{ this.sdk.setHeaderColor(theme.bg2); this.sdk.setBackgroundColor(theme.bg2); }catch(e){}
  },
  _platPause:false, _adOpen:false,
  _applyPause(){ const p = this._platPause || this._adOpen; if (Game.paused !== p) Game.pause(p); },
  attachLate(){}, lateInit(){}, async initPayments(){}, async restorePurchases(){},
  ready(){}, happy(){}, gameplay(){},
  now(){ return Date.now(); },
  authorized(){ return false; }, async login(){ return false; },
  uid(){ return this.user ? String(this.user.id) : ""; },
  name(){ return this.user ? (this.user.first_name || "") : ""; },

  /* ---------- сохранение ----------
     1) Облако Telegram (CloudStorage) — общий прогресс на всех устройствах аккаунта.
        Запись по частям в один из двух слотов (a/b); в ключ "slot" пишется, какой слот целый,
        с какого устройства и когда. Оборванная запись не портит прошлое сохранение.
     2) Хранилище устройства Telegram (DeviceStorage, Telegram 2025+) — копия, которую не стирает
        очистка кэша браузера внутри Telegram.
     3) localStorage — как раньше.
     Перед каждой записью в облако игра проверяет, нет ли там более нового прогресса с другого
     устройства; если есть — загружает его, а не затирает. Каждый запрос ограничен по времени,
     поэтому «потерянный» ответ Telegram (например, при сворачивании) больше не останавливает сохранения. */
  sid: Math.random().toString(36).slice(2, 10), _bootAt:0,
  onLoaded(st){ this._bootAt = st.savedAt || 0; },
  _cs(){ return this.sdk && this.ver("6.9") && this.sdk.CloudStorage ? this.sdk.CloudStorage : null; },
  _ds(){ return this.sdk && this.ver("9.0") && this.sdk.DeviceStorage ? this.sdk.DeviceStorage : null; },
  _call(fn, ms){ return new Promise((res, rej)=>{ let done = false; const t = setTimeout(()=>{ if (!done){ done = true; rej(new Error("timeout")); } }, ms);
    try{ fn((err, v)=>{ if (done) return; done = true; clearTimeout(t); err ? rej(err) : res(v); }); }catch(e){ if (!done){ done = true; clearTimeout(t); rej(e); } } }); },
  _get(keys){ const cs = this._cs(); return this._call(cb=>cs.getItems(keys, cb), 9000).then(v=>v || {}); },
  _set(k, v){ const cs = this._cs(); return this._call(cb=>cs.setItem(k, v, cb), 9000); },
  // только ASCII: тогда длина строки = числу байт, и часть точно влезает в лимит 4096
  _pack(obj){ return JSON.stringify(obj).replace(/[\u007f-￿]/g, c=>"\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")); },
  _head(v){ const m = /^([ab]):(\d+)(?::([a-z0-9]*):(\d+))?$/.exec(v || ""); return m ? {slot:m[1], n:+m[2], sid:m[3] || "", at:+(m[4] || 0)} : null; },
  _status:{state:"", at:0, err:""},
  async _readCloud(head){
    const keys = []; for (let i=0;i<head.n;i++) keys.push(head.slot + i);
    const parts = await this._get(keys);
    return JSON.parse(keys.map(k=>parts[k] || "").join(""));
  },
  async loadCloud(){
    if (!this._cs()) return null;
    try{
      const h = this._head((await this._get(["slot"])).slot); if (!h) return null;
      this._slot = h.slot; this._base = h.at;
      return await this._readCloud(h);
    }catch(e){ console.warn("cloud load", e); this._status = {state:"err", at:Date.now(), err:String(e && e.message || e)}; return null; }
  },
  async loadDevice(){
    const ds = this._ds(); if (!ds) return null;
    try{ const v = await this._call(cb=>ds.getItem("save", cb), 4000); return v ? JSON.parse(v) : null; }catch(e){ return null; }
  },
  _devT:0,
  saveDevice(obj){
    const ds = this._ds(); if (!ds || Date.now() - this._devT < 3000) return;
    this._devT = Date.now();
    try{ ds.setItem("save", JSON.stringify(obj), ()=>{}); }catch(e){}
  },
  // в облаке более новый прогресс с другого устройства? — загрузить его
  async syncCheck(){
    if (!this._cs() || this._cloudBusy || !window.__booted) return false;
    try{
      const h = this._head((await this._get(["slot"])).slot);
      if (!h || !h.sid || h.sid === this.sid || h.at <= this._base) return false;
      const obj = await this._readCloud(h);
      if (!obj) return false;
      // облако не читалось при запуске: берём его, только если оно новее того, с чем игра стартовала
      if (!this._base && (obj.savedAt || 0) <= (this._bootAt || 0)){ this._base = h.at; return false; }
      this._slot = h.slot; this._base = h.at;
      adoptState(obj);
      UI.toast(T("☁️ Прогресс загружен с другого устройства"));
      return true;
    }catch(e){ console.warn("cloud sync", e); return false; }
  },
  _cloudBusy:false, _cloudAgain:null, _cloudLast:0, _cloudT:0, _slot:"", _base:0,
  async saveCloud(obj){
    if (!this._cs()) return;
    if (this._cloudBusy){ this._cloudAgain = obj; return; }
    this._cloudBusy = true; this._cloudLast = Date.now();
    try{
      const h = this._head((await this._get(["slot"])).slot);
      // другое устройство сохранило позже — не затираем его прогресс
      if (h && h.sid && h.sid !== this.sid && h.at > this._base){ this._cloudBusy = false; await this.syncCheck(); return; }
      const s = this._pack(obj), n = Math.ceil(s.length / CHUNK), at = Math.max(Date.now(), this._base + 1);
      const slot = (h ? h.slot : this._slot) === "a" ? "b" : "a";
      for (let i=0;i<n;i++) await this._set(slot + i, s.slice(i*CHUNK, (i+1)*CHUNK));
      await this._set("slot", `${slot}:${n}:${this.sid}:${at}`);
      this._slot = slot; this._base = at;
      this._status = {state:"ok", at:Date.now(), err:""};
    }catch(e){ console.warn("cloud save", e); this._status = {state:"err", at:Date.now(), err:String(e && e.message || e)}; }
    finally{ this._cloudBusy = false; }
    if (this._cloudAgain){ const o = this._cloudAgain; this._cloudAgain = null; this.scheduleCloud(o, 2000); }
  },
  scheduleCloud(obj, delay=2500){
    if (!this._cs()) return;
    clearTimeout(this._cloudT);
    const wait = Math.max(delay, 4000 - (Date.now() - this._cloudLast));
    this._cloudT = setTimeout(()=>this.saveCloud(obj), wait);
  },
  // строка для экрана «Настройки»
  cloudStatus(){
    if (!this.sdk) return "";
    if (!this._cs()) return T("☁️ Облако Telegram недоступно — обновите Telegram");
    const st = this._status, tm = st.at ? new Date(st.at).toLocaleTimeString(LANG === "en" ? "en-GB" : "ru-RU", {hour:"2-digit", minute:"2-digit"}) : "";
    if (st.state === "ok") return `${T("☁️ Облако Telegram: сохранено в")} ${tm}`;
    if (st.state === "err") return `${T("☁️ Облако Telegram: ошибка")} (${tm}): ${st.err}`;
    return T("☁️ Облако Telegram: подключено");
  },

  /* ---------- реклама: AdsGram ---------- */
  adBusy:false, lastInter:0, startedAt:Date.now(), _ctl:{}, _freeTold:false,
  _ad(blockId){
    if (!blockId || !window.Adsgram) return null;
    if (!this._ctl[blockId]){ try{ this._ctl[blockId] = window.Adsgram.init({blockId:String(blockId), debug:!!TGC.adsDebug}); }catch(e){ console.warn("Adsgram.init", e); return null; } }
    return this._ctl[blockId];
  },
  rewarded(onReward, onFail){
    if (this.adBusy) return;
    // вне Telegram — тестовая заглушка
    if (!this.sdk){ this.adBusy = true; UI.fakeAd(()=>{ this.adBusy = false; onReward(); }); return; }
    // блок рекламы ещё не настроен (игра ждёт одобрения AdsGram) — награда без рекламы, кнопки не «мёртвые»
    if (!TGC.adsReward){ if (!this._freeTold){ this._freeTold = true; UI.toast(T("Реклама скоро появится. А пока — подарок просто так! 🎁")); } onReward(); return; }
    const ad = this._ad(TGC.adsReward);
    if (!ad){ UI.toast(T("Реклама сейчас не загрузилась. Попробуй чуть позже")); onFail && onFail(); return; }
    this.adBusy = true; this._adOpen = true; this._applyPause();
    ad.show().then(r=>{
      if (r && r.done) onReward(); else { UI.toast(T("Видео не досмотрено — подарка нет")); onFail && onFail(); }
    }).catch(r=>{
      // ошибку загрузки AdsGram показывает сам; если игрок закрыл видео — подсказка от игры
      if (!(r && r.error)) UI.toast(T("Видео не досмотрено — подарка нет"));
      onFail && onFail();
    }).finally(()=>{ this.adBusy = false; this._adOpen = false; this._applyPause(); });
  },
  // межстраничная реклама — только в естественных паузах и не чаще раза в 3 минуты
  interstitial(){
    if (!this.sdk || this.adBusy || !TGC.adsInter) return;
    if (Date.now() - this.startedAt < 60000 || (Date.now() - this.lastInter)/1000 < CONFIG.interstitialMinGap) return;
    const ad = this._ad(TGC.adsInter); if (!ad) return;
    this.adBusy = true; this.lastInter = Date.now(); this._adOpen = true; this._applyPause();
    ad.show().catch(()=>{}).finally(()=>{ this.adBusy = false; this._adOpen = false; this._applyPause(); });
  },
  onNewCat(){ this.interstitial(); },

  /* ---------- покупок и лидербордов в этой версии нет ---------- */
  price(){ return {text:"", img:""}; },
  async buy(){ return false; },
  async setScore(){}, async entries(){ return null; },

  /* ---------- приглашения ---------- */
  inviteLink(code){
    if (!TGC.bot) return "";
    const bot = String(TGC.bot).replace(/^@/, "");
    return TGC.app ? `https://t.me/${bot}/${TGC.app}?startapp=f_${code}` : `https://t.me/${bot}?startapp=f_${code}`;
  },
  share(link, text){
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    try{ if (this.sdk) return this.sdk.openTelegramLink(url); }catch(e){}
    try{ window.open(url, "_blank"); }catch(e){}
  },
  async copy(text){
    try{ await navigator.clipboard.writeText(text); return true; }catch(e){}
    try{ const t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; }catch(e){ return false; }
  },
};

/* ---------- друзья: работает без сервера (см. CONFIG.serverUrl) ---------- */
const Social = {
  get server(){ return !!CONFIG.serverUrl; },
  async call(path, body){
    if (!this.server) return null;
    try{
      const r = await fetch(CONFIG.serverUrl.replace(/\/$/,"") + path, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(Object.assign({uid: YG.uid(), code: S.friends.code}, body||{})) });
      return r.ok ? await r.json() : null;
    }catch(e){ console.warn("social", path, e); return null; }
  },
  profile(){ return this.call("/profile", {name: YG.name(), album: Game.albumCode(), fav: S.favorite, cos: S.cos.on || ""}); },
  invited(by){ return this.call("/invite", {by}); },
  async friends(){ const r = await this.call("/friends", {list: S.friends.list.map(f=>f.code)}); return r && r.friends || null; },
  async inbox(){ const r = await this.call("/inbox"); return r && r.items || []; },
  claim(id){ return this.call("/claim", {id}); },
  gift(to){ return this.call("/gift", {to}); },
};
