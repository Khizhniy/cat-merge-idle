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
    if (!W || !W.initData){ I18N.apply(String(navigator.language || "ru").toLowerCase()); return; }
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
    try{ W.onEvent("activated", ()=>{ this._platPause = false; this._applyPause(); }); }catch(e){}
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

  /* ---------- сохранение: Telegram CloudStorage ----------
     Запись идёт в один из двух слотов (a/b) по частям, а в ключ "slot" — какой слот целый.
     Так оборванная запись никогда не портит прошлое сохранение. */
  _cs(){ return this.sdk && this.ver("6.9") && this.sdk.CloudStorage ? this.sdk.CloudStorage : null; },
  _get(keys){ const cs = this._cs(); return new Promise((res, rej)=>{ try{ cs.getItems(keys, (err, v)=> err ? rej(err) : res(v || {})); }catch(e){ rej(e); } }); },
  _set(k, v){ const cs = this._cs(); return new Promise((res, rej)=>{ try{ cs.setItem(k, v, (err, ok)=> err ? rej(err) : res(ok)); }catch(e){ rej(e); } }); },
  async loadCloud(){
    if (!this._cs()) return null;
    try{
      const head = await withTimeout(this._get(["slot"]), 6000, null);
      const m = head && /^([ab]):(\d+)$/.exec(head.slot || ""); if (!m) return null;
      const keys = []; for (let i=0;i<+m[2];i++) keys.push(m[1] + i);
      const parts = await withTimeout(this._get(keys), 8000, null); if (!parts) return null;
      return JSON.parse(keys.map(k=>parts[k] || "").join(""));
    }catch(e){ console.warn("cloud load", e); return null; }
  },
  _cloudBusy:false, _cloudAgain:null, _cloudLast:0, _cloudT:0, _slot:"",
  async saveCloud(obj){
    if (!this._cs()) return;
    if (this._cloudBusy){ this._cloudAgain = obj; return; }
    this._cloudBusy = true; this._cloudLast = Date.now();
    try{
      const s = JSON.stringify(obj), n = Math.ceil(s.length / CHUNK);
      if (!this._slot){ const h = await withTimeout(this._get(["slot"]), 4000, {}); this._slot = /^a:/.test((h||{}).slot || "") ? "a" : "b"; }
      const slot = this._slot === "a" ? "b" : "a";
      for (let i=0;i<n;i++) await this._set(slot + i, s.slice(i*CHUNK, (i+1)*CHUNK));
      await this._set("slot", slot + ":" + n);
      this._slot = slot;
    }catch(e){ console.warn("cloud save", e); }
    this._cloudBusy = false;
    if (this._cloudAgain){ const o = this._cloudAgain; this._cloudAgain = null; this.scheduleCloud(o, 3000); }
  },
  scheduleCloud(obj, delay=2500){
    if (!this._cs()) return;
    clearTimeout(this._cloudT);
    const wait = Math.max(delay, 4000 - (Date.now() - this._cloudLast));
    this._cloudT = setTimeout(()=>this.saveCloud(obj), wait);
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
