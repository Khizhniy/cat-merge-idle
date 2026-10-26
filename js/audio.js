"use strict";
/* =====================================================================
   ЗВУК v2.3 — всё синтезируется в браузере, файлов нет.
   • Голоса котиков: модель «голосовые связки + рот» (формантный синтез).
     Мяу проходит путь м → и → а → у, высота голоса дугой, лёгкое дрожание,
     придыхание. Мурчание — короткие низкие толчки ~25 раз в секунду на
     выдохе и вдохе. У каждого котика свой голос.
   • Музыка: спокойный генеративный лоу-фай/эмбиент — пэд, электропиано,
     бас, колокольчики, мягкий ритм и реверберация. У каждого мира свой стиль.
   ===================================================================== */
const Snd = (() => {
  let AC = null, muted = false, focused = true, bus = null, music = null, curWorld = -1;
  const MUSIC_LEVEL = 0.4, SFX_LEVEL = 0.9;

  /* ---------- общие узлы ---------- */
  function impulse(a, sec, decay, dark){
    const sr = a.sampleRate, n = Math.floor(sr*sec), b = a.createBuffer(2, n, sr);
    for (let ch=0; ch<2; ch++){
      const d = b.getChannelData(ch); let lp = 0;
      for (let i=0;i<n;i++){ const w = Math.random()*2-1; lp += (w - lp) * dark; d[i] = lp * Math.pow(1 - i/n, decay); }
    }
    return b;
  }
  function makeBus(a){
    const comp = a.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.006; comp.release.value = 0.25;
    comp.connect(a.destination);
    const sfx = a.createGain(); sfx.gain.value = SFX_LEVEL; sfx.connect(comp);
    const room = a.createConvolver(); room.buffer = impulse(a, 0.7, 3, 0.35);
    const roomG = a.createGain(); roomG.gain.value = 0.5; room.connect(roomG).connect(sfx);
    const mus = a.createGain(); mus.gain.value = muted ? 0 : MUSIC_LEVEL; mus.connect(comp);
    const hall = a.createConvolver(); hall.buffer = impulse(a, 3.2, 2.4, 0.18);
    const hallG = a.createGain(); hallG.gain.value = 0.55; hall.connect(hallG).connect(mus);
    const noise = a.createBuffer(1, a.sampleRate*2, a.sampleRate); const nd = noise.getChannelData(0); for (let i=0;i<nd.length;i++) nd[i] = Math.random()*2-1;
    return {comp, sfx, room, mus, hall, noise};
  }
  function ctx(){
    if (!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } bus = makeBus(AC); }
    if (AC.state === "suspended" && !muted) AC.resume();
    return AC;
  }

  /* ---------- короткие звуки интерфейса (мягкие, без «пищалок») ---------- */
  function tone(freq, dur, type="sine", vol=0.15, slide=0, delay=0){
    if (!S.set.sound || muted) return; const a = ctx(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide), t+dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.012); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g).connect(bus.sfx); o.start(t); o.stop(t+dur+0.05);
  }
  function noiseHit(dur, type, freq, q, vol, delay=0, attack=0.005){
    if (!S.set.sound || muted) return; const a = ctx(); if (!a) return;
    const t = a.currentTime + delay, s = a.createBufferSource(); s.buffer = bus.noise; s.loop = true;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+attack); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    s.connect(f).connect(g).connect(bus.sfx); s.start(t, Math.random()); s.stop(t+dur+0.05);
  }
  const sfx = {
    pop(){ tone(460,.14,"sine",.16,360); tone(920,.08,"sine",.04,300,.02); },
    meow(){ }, longMeow(){ },
    coin(){ tone(1318,.18,"sine",.07); tone(1760,.24,"sine",.06,0,.06); },
    sparkle(){ [1568,1976,2349,3136].forEach((f,i)=>tone(f,.35,"sine",.045,0,i*.06)); },
    chord(){ [523,659,784].forEach(f=>tone(f,.9,"triangle",.06)); },
    fanfare(){ [523,659,784,1047].forEach((f,i)=>tone(f,.45,"triangle",.08,0,i*.12)); tone(1047,.9,"sine",.05,0,.5); },
    click(){ tone(420,.06,"sine",.07,80); },
    bad(){ tone(240,.18,"sine",.09,-70); },
    boom(){ noiseHit(.35,"lowpass",500,.7,.25); tone(90,.35,"sine",.18,-40); },
    // брызгалка: «пшш-пшш»
    spray(){ noiseHit(.22,"bandpass",4200,.9,.32,0,.01); noiseHit(.3,"bandpass",3600,.9,.28,.24,.01); },
    // корм: насыпаем сухой корм в миску
    food(){ for (let i=0;i<10;i++) noiseHit(.03,"highpass",2400+Math.random()*1800,1,.2+Math.random()*.15,i*.035+Math.random()*.02,.002); tone(330,.25,"sine",.05,60,.35); },
    // кошачья мята: волшебный шелест
    nip(){ noiseHit(.5,"bandpass",2200,2,.08,0,.15); [784,988,1175,1568].forEach((f,i)=>tone(f,.5,"sine",.045,0,.1+i*.08)); },
  };

  /* =====================================================================
     ГОЛОСА КОТИКОВ
     ===================================================================== */
  const KINDS = { meow:{word:"мяу!"}, long:{word:"мяу-у"}, mew:{word:"мяк!"}, trill:{word:"мррр?"}, purr:{word:"мурр"} };
  // форма звука: [доля длины, значение]; высота — множитель от базовой, форманты — Гц
  const SHAPES = {
    meow:  {pitch:[[0,.86],[.3,1.13],[.55,1.08],[1,.72]], F1:[[0,330],[.14,460],[.4,1050],[.72,780],[1,430]], F2:[[0,1650],[.16,2300],[.42,1900],[.78,1250],[1,900]],
            F3:[[0,2900],[.4,3300],[1,2700]], amp:[[0,0],[.07,.32],[.2,.82],[.36,1],[.7,.82],[.9,.35],[1,0]]},
    long:  {pitch:[[0,.85],[.2,1.1],[.6,1.04],[.85,.88],[1,.68]], F1:[[0,330],[.1,480],[.3,1100],[.68,980],[.9,560],[1,420]], F2:[[0,1650],[.12,2300],[.3,1950],[.7,1600],[.92,950],[1,850]],
            F3:[[0,2900],[.3,3300],[1,2700]], amp:[[0,0],[.06,.3],[.16,.85],[.3,1],[.72,.9],[.92,.3],[1,0]]},
    mew:   {pitch:[[0,1],[.25,1.16],[1,.84]], F1:[[0,480],[.3,900],[1,620]], F2:[[0,2350],[.3,2550],[1,1900]], F3:[[0,3300],[1,3000]],
            amp:[[0,0],[.1,.85],[.3,1],[.75,.55],[1,0]]},
    trill: {pitch:[[0,.8],[.6,.9],[1,1.22]], F1:[[0,360],[.7,440],[1,820]], F2:[[0,1250],[.7,1450],[1,1950]], F3:[[0,2700],[1,3100]],
            amp:[[0,0],[.1,.8],[.8,1],[1,0]], am:27, amDepth:[[0,.8],[.62,.75],[.8,.1],[1,0]]},
    grumpy:{pitch:[[0,.74],[.3,.86],[1,.56]], F1:[[0,380],[.35,820],[1,430]], F2:[[0,1250],[.35,1600],[1,850]], F3:[[0,2600],[1,2500]],
            amp:[[0,0],[.1,.9],[.6,1],[1,0]], am:38, amDepth:[[0,.4],[1,.3]], sub:.35, breath:.1},
  };
  function curve(pts, x){
    if (x <= pts[0][0]) return pts[0][1];
    for (let i=1;i<pts.length;i++){ if (x <= pts[i][0]){ const [x0,y0] = pts[i-1], [x1,y1] = pts[i]; const k = (x - x0)/(x1 - x0 || 1); const s = k*k*(3-2*k); return y0 + (y1-y0)*s; } }
    return pts[pts.length-1][1];
  }
  // резонатор (форманта): y = a·x + b·y1 + c·y2
  function reso(){ return {y1:0, y2:0, a:1, b:0, c:0}; }
  function setReso(r, f, bw, sr){ const R = Math.exp(-Math.PI*bw/sr), th = 2*Math.PI*f/sr; r.b = 2*R*Math.cos(th); r.c = -R*R; r.a = 1 - r.b - r.c; }
  function runReso(r, x){ const y = r.a*x + r.b*r.y1 + r.c*r.y2; r.y2 = r.y1; r.y1 = y; return y; }

  const HW = new Float32Array(26); for (let k=1;k<26;k++) HW[k] = 1/Math.pow(k, 1.75);
  function synthVoice(kind, P, sr){
    if (kind === "purr") return synthPurr(P, sr);
    const sh = SHAPES[kind] || SHAPES.meow, dur = P.dur, N = Math.floor(sr*(dur + 0.04));
    const out = new Float32Array(N);
    const r1 = reso(), r2 = reso(), r3 = reso(), r4 = reso();
    setReso(r4, 4300*P.bright, 600, sr);
    let ph = 0, jit = 0, hp = 0, hpx = 0, peak = 1e-6, seed = P.seed || 1;
    const rand = () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };
    const breath = (P.breath || 0.04) + (sh.breath || 0);
    let lp1 = 0, lp2 = 0; const lpk = 1 - Math.exp(-2*Math.PI*3800/sr);
    for (let i=0;i<N;i++){
      const x = Math.min(1, i/(sr*dur));
      if ((i & 31) === 0){
        const fb = P.bright;
        setReso(r1, curve(sh.F1, x)*fb, 160, sr); setReso(r2, curve(sh.F2, x)*fb, 200, sr); setReso(r3, curve(sh.F3, x)*fb, 300, sr);
      }
      jit = jit*0.996 + (rand()-.5)*0.0016;
      const vibE = x < .3 ? 0 : Math.min(1, (x-.3)*4);
      const f = P.f0 * curve(sh.pitch, x) * (1 + jit + 0.012*vibE*Math.sin(2*Math.PI*P.vib*i/sr));
      ph += 2*Math.PI*f/sr; if (ph > 2*Math.PI*64) ph -= 2*Math.PI*64;
      // «голосовые связки»: гармоники с естественным спадом
      const K = Math.min(24, Math.floor(0.4*sr/f));
      const cph = Math.cos(ph); let s0 = 0, s1 = Math.sin(ph), src = s1;
      for (let k=2;k<=K;k++){ const s2 = 2*cph*s1 - s0; src += s2*HW[k]; s0 = s1; s1 = s2; }
      if (sh.sub) src += sh.sub * Math.sin(ph/2);
      // придыхание (шум в такт голосу)
      src += (rand()*2-1) * breath * 3 * (0.6 + 0.4*Math.sin(ph));
      // «рот»: три форманты подряд + немного блеска
      let y = runReso(r3, runReso(r2, runReso(r1, src)));
      y = y + 0.15*runReso(r4, src*0.3);
      let env = curve(sh.amp, x);
      if (sh.am){ const d = curve(sh.amDepth, x); env *= 1 - d*0.5*(1 + Math.cos(2*Math.PI*sh.am*i/sr)); }
      y *= env;
      lp1 += (y - lp1)*lpk; lp2 += (lp1 - lp2)*lpk; y = lp2;
      // убрать постоянную составляющую
      hp = 0.995*(hp + y - hpx); hpx = y;
      out[i] = hp; const ay = Math.abs(hp); if (ay > peak) peak = ay;
    }
    finish(out, peak, sr, P);
    return out;
  }
  // мурчание: низкие толчки на выдохе (~26 в сек) и вдохе (~22 в сек)
  function synthPurr(P, sr){
    const dur = Math.max(0.8, P.dur), N = Math.floor(sr*(dur+0.05)), out = new Float32Array(N);
    const r1 = reso(), r2 = reso(), r3 = reso();
    const k = Math.max(.85, Math.min(1.25, P.f0/650));
    setReso(r1, 190*k, 120, sr); setReso(r2, 480*k, 260, sr); setReso(r3, 1100*k, 500, sr);
    let seed = P.seed || 7; const rand = () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };
    let t0 = 0, peak = 1e-6, hp = 0, hpx = 0, l1 = 0, l2 = 0; const pk = 1 - Math.exp(-2*Math.PI*900/sr);
    const exEnd = 0.56*dur, inStart = 0.62*dur;
    let next = 0;
    for (let i=0;i<N;i++){
      const t = i/sr;
      const exhale = t < exEnd, inhale = t >= inStart && t < dur;
      if (t >= next){ t0 = t; next = t + 1/(exhale ? 26 : 22) * (1 + (rand()-.5)*.08); }
      const pt = t - t0;
      let x = (rand()*2-1) * Math.exp(-pt/0.009) * 0.6 + (Math.sin(2*Math.PI*120*k*pt) + 0.5*Math.sin(2*Math.PI*240*k*pt)) * Math.exp(-pt/0.02);
      let seg = exhale ? curve([[0,0],[.12,1],[.85,.9],[1,0]], t/exEnd) : inhale ? 0.55*curve([[0,0],[.2,1],[.8,.9],[1,0]], (t-inStart)/(dur-inStart)) : 0;
      let y = runReso(r1, x)*1.0 + runReso(r2, x)*0.5 + runReso(r3, x)*0.1;
      y *= seg; l1 += (y - l1)*pk; l2 += (l1 - l2)*pk; y = l2;
      hp = 0.995*(hp + y - hpx); hpx = y;
      out[i] = hp; const ay = Math.abs(hp); if (ay > peak) peak = ay;
    }
    finish(out, peak, sr, P);
    return out;
  }
  function finish(out, peak, sr, P){
    const g = 0.85/peak, fade = Math.floor(sr*0.006), N = out.length;
    for (let i=0;i<N;i++){
      let v = out[i]*g;
      if (P.robot){ v = Math.round(v*7)/7; }
      if (i < fade) v *= i/fade; if (i > N-fade) v *= (N-i)/fade;
      out[i] = v;
    }
    if (P.robot){ for (let i=2;i<N;i+=3){ out[i-1] = out[i-2]; out[i] = out[i-2]*0.6 + out[i]*0.4; } }
  }

  const voiceCache = {};
  function voiceOf(gid){
    if (voiceCache[gid]) return voiceCache[gid];
    const c = ALBUM[gid] || {};
    let r = (gid * 2654435761) >>> 0;
    const rnd = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296; };
    const lv = c.lv || 12;
    // котята — тоньше, большие коты — ниже и солиднее
    let f0 = 900 - lv * 18 + (rnd() - 0.5) * 150;
    if (c.round || c.tufts || c.persian || c.fuzzy) f0 *= 0.88;
    if (c.sphinx || c.kind === "special") f0 *= 1.05;
    f0 = Math.max(430, Math.min(1050, f0));
    const kinds = lv <= 4 ? ["mew","meow","mew","trill"] : lv <= 12 ? ["meow","meow","trill","purr","long"] : ["meow","long","purr","trill","long"];
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const timbre = c.robot || (c.acc||[]).includes("cyborg") ? "robot" : (c.ghost || c.jelly) ? "breathy" : "normal";
    const v = {kind, f0, dur: 0.42 + rnd()*0.28 + (kind==="long" ? 0.35 : 0) + (kind==="mew" ? -0.12 : 0), vib: 5 + rnd()*2.5,
               bright: Math.pow(f0/650, 0.35) * (0.94 + rnd()*0.12), timbre, seed: (gid*7919+13)>>>0,
               word: timbre === "robot" ? "мяу-бип" : KINDS[kind].word};
    return (voiceCache[gid] = v);
  }
  // готовые записи голосов (держим последние 48)
  const bufCache = new Map();
  function voiceBuffer(a, gid, mode){
    const v = voiceOf(gid);
    let kind = v.kind, dur = v.dur, f0 = v.f0;
    if (mode === "grumpy"){ kind = "grumpy"; dur = 0.5; f0 *= 0.95; }
    if (mode === "pet"){ if (kind === "long") kind = "meow"; dur = kind === "purr" ? 1.0 : Math.min(dur, 0.55); }
    const key = gid + "|" + kind + "|" + dur.toFixed(2);
    if (bufCache.has(key)){ const b = bufCache.get(key); bufCache.delete(key); bufCache.set(key, b); return b; }
    const sr = 22050;
    const data = synthVoice(kind, {f0, dur, bright:v.bright, vib:v.vib, seed:v.seed, robot: v.timbre==="robot", breath: v.timbre==="breathy" ? 0.16 : 0.04}, sr);
    const b = a.createBuffer(1, data.length, sr); b.getChannelData(0).set(data);
    bufCache.set(key, b); if (bufCache.size > 48) bufCache.delete(bufCache.keys().next().value);
    return b;
  }
  let lastVoiceAt = 0;
  function voice(gid, vol=1, mode){
    if (!S.set.sound || muted) return;
    const a = ctx(); if (!a) return;
    lastVoiceAt = Date.now();
    let b; try{ b = voiceBuffer(a, gid, mode); }catch(e){ return; }
    const s = a.createBufferSource(); s.buffer = b; s.playbackRate.value = 1 + (Math.random()-.5)*0.04;
    const g = a.createGain(); g.gain.value = 0.75 * vol;
    const send = a.createGain(); send.gain.value = 0.35;
    s.connect(g); g.connect(bus.sfx); g.connect(send).connect(bus.room);
    s.start(a.currentTime + 0.01);
    s.onended = () => { try{ g.disconnect(); send.disconnect(); }catch(e){} };
  }

  /* =====================================================================
     МУЗЫКА: генеративный лоу-фай / эмбиент
     ===================================================================== */
  const mtof = n => 440*Math.pow(2,(n-69)/12);
  const CH = { maj7:[0,4,7,11], m7:[0,3,7,10], m9:[0,3,7,10,14], maj9:[0,4,7,11,14], dom7:[0,4,7,10], sus:[0,5,7,10], six:[0,4,7,9], add9:[0,4,7,14] };
  // у каждого мира: темп, свинг, аккорды (тоника midi + тип), лад мелодии, набор инструментов
  const STYLES = [
    {bpm:72, swing:.6, prog:[[53,"maj7"],[52,"m7"],[50,"m7"],[48,"add9"]], scale:[0,2,4,7,9], key:60, lead:"keys", comp:"keys", drums:"soft", vinyl:true},        // Дом: тёплый лоу-фай
    {bpm:80, swing:.52, prog:[[50,"maj7"],[47,"m7"],[43,"maj7"],[45,"six"]], scale:[0,2,4,7,9], key:62, lead:"bell", comp:"pluck", drums:"shaker", birds:true},  // Сад: гитара и колокольчики
    {bpm:84, swing:.62, prog:[[45,"m9"],[50,"m9"],[43,"dom7"],[48,"maj9"]], scale:[0,3,5,7,10], key:57, lead:"keys", comp:"keys", drums:"lofi", vinyl:true},     // Город: вечерний лоу-фай
    {bpm:92, swing:.55, prog:[[53,"maj7"],[50,"m7"],[46,"maj7"],[48,"sus"]], scale:[0,2,4,7,9], key:65, lead:"marimba", comp:"marimba", drums:"island"},          // Остров: маримба
    {bpm:60, swing:.5, prog:[[52,"maj9"],[49,"m9"],[45,"maj7"],[47,"sus"]], scale:[0,2,4,7,11], key:64, lead:"bell", comp:"pad", drums:"none"},                    // Космос: эмбиент
  ];

  function MusicEngine(a, dest, world, rngSeed){
    const st = STYLES[world] || STYLES[0];
    const out = a.createGain(); out.gain.value = 0;
    const tone = a.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 5200; tone.Q.value = 0.5;
    out.connect(tone).connect(dest);
    const hall = bus && a === AC ? bus.hall : null;
    let hallIn = null;
    if (hall){ hallIn = a.createGain(); hallIn.gain.value = 0.5; out.connect(hallIn).connect(hall); }
    else { const cv = a.createConvolver(); cv.buffer = impulse(a, 3.2, 2.4, 0.18); const cg = a.createGain(); cg.gain.value = 0.28; out.connect(cv).connect(cg).connect(dest); }
    const noise = a.createBuffer(1, a.sampleRate, a.sampleRate); { const d = noise.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1; }
    let seed = rngSeed || (world*977 + 31);
    const rnd = () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };
    const spb = 60/st.bpm, step = spb/2; // восьмые
    let nextT = a.currentTime + 0.15, idx = 0, stopped = false, vinylNode = null;

    // ---- инструменты ----
    function env(g, t, att, peak, dec, sus, rel, len){
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t+att);
      g.gain.setTargetAtTime(peak*sus, t+att, dec);
      g.gain.setTargetAtTime(0.0001, t+len, rel);
    }
    function keys(f, t, len, v){ // электропиано (FM)
      const c = a.createOscillator(), m = a.createOscillator(), mg = a.createGain(), g = a.createGain();
      c.frequency.value = f; m.frequency.value = f; mg.gain.setValueAtTime(f*1.6, t); mg.gain.exponentialRampToValueAtTime(f*0.25, t+0.7);
      m.connect(mg).connect(c.frequency);
      const tine = a.createOscillator(), tg = a.createGain(); tine.frequency.value = f*7.02; tg.gain.setValueAtTime(0.0001,t); tg.gain.exponentialRampToValueAtTime(0.05*v, t+0.004); tg.gain.exponentialRampToValueAtTime(0.0001, t+0.15);
      env(g, t, 0.006, 0.16*v, 0.5, 0.35, 0.25, len);
      c.connect(g).connect(out); tine.connect(tg).connect(out);
      [c,m,tine].forEach(o=>{ o.start(t); o.stop(t+len+1.5); });
    }
    function pad(fs, t, len, v){
      const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.6;
      lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1300, t+len*0.5); lp.frequency.linearRampToValueAtTime(700, t+len+1.5);
      const g = a.createGain(); env(g, t, Math.min(1.2,len*.4), 0.05*v, 1, 1, 0.9, len);
      lp.connect(g).connect(out);
      fs.forEach(f=>{ [-7,7].forEach(cent=>{ const o = a.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = cent; o.connect(lp); o.start(t); o.stop(t+len+4); }); });
    }
    function bass(f, t, len, v){
      const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
      o.frequency.value = f; o2.type = "triangle"; o2.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = 420;
      env(g, t, 0.012, 0.32*v, 0.35, 0.55, 0.12, len);
      o.connect(g); o2.connect(lp).connect(g); g.connect(out);
      [o,o2].forEach(x=>{ x.start(t); x.stop(t+len+0.8); });
    }
    function bell(f, t, v){ // калимба/колокольчик
      [[1,0.12,1.4],[3.01,0.03,0.35],[5.43,0.012,0.18]].forEach(([r,amp,d])=>{
        const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f*r;
        g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(amp*v, t+0.006); g.gain.exponentialRampToValueAtTime(0.0001, t+d);
        o.connect(g).connect(out); o.start(t); o.stop(t+d+0.05); });
    }
    function marimba(f, t, v){
      [[1,0.14,0.55],[3.9,0.035,0.12],[10,0.01,0.04]].forEach(([r,amp,d])=>{
        const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f*r;
        g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(amp*v, t+0.004); g.gain.exponentialRampToValueAtTime(0.0001, t+d);
        o.connect(g).connect(out); o.start(t); o.stop(t+d+0.05); });
    }
    function pluck(f, t, v){ // мягкая гитара
      const o = a.createOscillator(), lp = a.createBiquadFilter(), g = a.createGain();
      o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.Q.value = 1.2;
      lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(380, t+0.35);
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.09*v, t+0.004); g.gain.exponentialRampToValueAtTime(0.0001, t+1.1);
      o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t+1.2);
    }
    function nz(t, type, freq, q, vol, dec, att=0.002){
      const s = a.createBufferSource(); s.buffer = noise; const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = a.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol, t+att); g.gain.exponentialRampToValueAtTime(0.0001, t+dec);
      s.connect(f).connect(g).connect(out); s.start(t, rnd()*0.5); s.stop(t+dec+0.05);
    }
    function kick(t, v){ const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(115,t); o.frequency.exponentialRampToValueAtTime(48,t+0.12);
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.42*v,t+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t+0.32); o.connect(g).connect(out); o.start(t); o.stop(t+0.35); }
    function snare(t, v){ nz(t,"bandpass",1700,0.8,0.09*v,0.16); const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 185;
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.06*v,t+0.003); g.gain.exponentialRampToValueAtTime(0.0001,t+0.09); o.connect(g).connect(out); o.start(t); o.stop(t+0.1); }
    function hat(t, v){ nz(t,"highpass",7500,0.7,0.035*v,0.05); }
    function shaker(t, v){ nz(t,"bandpass",5200,1.2,0.03*v,0.09,0.03); }
    function bird(t){ const f = 2600+rnd()*900; [0,0.11].forEach((d,i)=>{ const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(f*(1+i*.08),t+d); o.frequency.exponentialRampToValueAtTime(f*1.3,t+d+0.07);
      g.gain.setValueAtTime(0.0001,t+d); g.gain.exponentialRampToValueAtTime(0.012,t+d+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.08); o.connect(g).connect(out); o.start(t+d); o.stop(t+d+0.1); }); }
    if (st.vinyl){ // тихий треск пластинки
      const n = a.sampleRate*2, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
      for (let i=0;i<n;i++) d[i] = (Math.random()<0.0007 ? (Math.random()*2-1)*0.9 : 0) + (Math.random()*2-1)*0.012;
      vinylNode = a.createBufferSource(); vinylNode.buffer = b; vinylNode.loop = true;
      const vf = a.createBiquadFilter(); vf.type = "bandpass"; vf.frequency.value = 2500; vf.Q.value = 0.5; const vg = a.createGain(); vg.gain.value = 0.35;
      vinylNode.connect(vf).connect(vg).connect(out); vinylNode.start(nextT);
    }

    // ---- мелодия: два мотива на 2 такта, форма A A B A ----
    const chordNotes = (bar) => { const [root, type] = st.prog[bar % st.prog.length]; return CH[type].map(iv => root + iv); };
    const scaleNotes = []; for (let o=0;o<2;o++) st.scale.forEach(s => scaleNotes.push(st.key + 12 + o*12 + s));
    function motif(){ const m = []; let pos = Math.floor(rnd()*scaleNotes.length*0.6);
      for (let s=0;s<16;s++){ const on = (s%4===0 ? .55 : s%2===0 ? .35 : .18) > rnd(); if (on){ pos = Math.max(0, Math.min(scaleNotes.length-1, pos + Math.round((rnd()-.5)*4))); m.push([s, pos, s%4===0 ? 1 : .75]); } }
      if (!m.length) m.push([0, 3, 1]); return m; }
    const A = motif(), B = motif();

    function sched(i, t){
      const bar = Math.floor(i/8), s8 = i%8, beat = s8/2;
      const sw = s8 % 2 ? step*(st.swing - 0.5)*2 : 0, tt = t + sw;
      const hum = () => (rnd()-.5)*0.018;
      const ch = chordNotes(bar), root = ch[0];
      const cv = (n) => { let x = n; while (x < st.key - 5) x += 12; while (x > st.key + 9) x -= 12; return x; }; // голос аккорда около тоники
      const voicing = ch.slice(1).concat([ch[0]+12]).map(cv).sort((x,y)=>x-y);
      const barLen = step*8;
      // аккомпанемент
      if (st.comp === "keys"){
        if (s8 === 0){ voicing.forEach((n,k)=>keys(mtof(n), t + k*0.012 + hum(), barLen*0.8, 0.9)); pad(voicing.slice(0,3).map(mtof), t, barLen, 0.35); }
        if (s8 === 3 && rnd() < .7) voicing.slice(1).forEach((n,k)=>keys(mtof(n), tt + k*0.01, step*1.4, 0.55));
        if (s8 === 6 && rnd() < .35) keys(mtof(voicing[voicing.length-1]), tt, step*1.5, 0.45);
      } else if (st.comp === "pluck"){
        const arp = [0,1,2,3,2,1,2,3]; pluck(mtof(voicing[arp[s8] % voicing.length]), tt + hum(), s8 === 0 ? 1 : 0.7);
        if (s8 === 0) pad(voicing.map(mtof), t, barLen, 0.7);
      } else if (st.comp === "marimba"){
        const pat = [1,0,1,1,0,1,1,0][s8]; if (pat) marimba(mtof(voicing[(s8*2+bar) % voicing.length] + (s8>4?12:0)), tt + hum(), s8 === 0 ? 1 : 0.7);
        if (s8 === 0) pad(voicing.map(mtof), t, barLen, 0.45);
      } else if (st.comp === "pad"){
        if (s8 === 0) pad(voicing.concat([voicing[0]+12]).map(mtof), t, barLen*0.98, 1.1);
      }
      // бас
      if (st.drums !== "none" || st.comp === "pad"){
        if (s8 === 0) bass(mtof(root - 12 < 33 ? root : root - 12), t, st.comp === "pad" ? barLen*0.95 : step*3, 1);
        if (st.comp !== "pad" && s8 === 5 && rnd() < .6) bass(mtof((rnd()<.5 ? root : root+7) - 12 < 33 ? root : root - 12 + (rnd()<.5?0:7)), tt, step*1.5, 0.75);
      }
      // ритм
      if (st.drums === "soft"){ if (s8 === 0) kick(t, .8); if (s8 === 4) snare(t, .7); if (s8 % 2 === 0) hat(t, .6); else if (rnd()<.4) hat(tt, .35); }
      if (st.drums === "lofi"){ if (s8 === 0 || (s8 === 5 && rnd()<.6)) kick(tt, s8 ? .65 : .9); if (s8 === 4) snare(t, .85); hat(tt, s8 % 2 ? .4 : .7); }
      if (st.drums === "shaker"){ shaker(tt, s8 % 2 ? .7 : 1); if (s8 === 0 && bar % 2 === 0) kick(t, .45); }
      if (st.drums === "island"){ shaker(tt, s8 % 2 ? 1 : .6); if (s8 === 0 || s8 === 4) kick(t, .55); if (s8 === 3 || s8 === 6) nz(tt,"bandpass",900,4,0.05,0.12); }
      if (st.birds && s8 === 0 && rnd() < .4) bird(t + rnd()*barLen);
      // мелодия (с 3-го такта, в каждой 8-тактовой фразе последние такты потише)
      const phrase = Math.floor(bar/2) % 4, mot = phrase === 2 ? B : A, ms = (bar % 2)*8 + s8;
      if (bar >= 2) for (const [s, p, vel] of mot){ if (s === ms && rnd() < .9){
        let n = scaleNotes[p]; if (rnd() < .12) n = scaleNotes[Math.min(scaleNotes.length-1, p+1)];
        const f = mtof(n), v = vel * (bar % 8 >= 6 ? .7 : 1);
        if (st.lead === "bell") bell(f, tt + hum(), v); else if (st.lead === "marimba") marimba(f, tt + hum(), v*1.1); else keys(f, tt + hum(), step*1.6, v*0.8);
      } }
    }
    function scheduleUntil(T){ while (!stopped && nextT < T){ sched(idx, nextT); idx++; nextT += step; } }
    return {
      out, scheduleUntil,
      fadeIn(t, d=1.5){ out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(1, t+d); },
      stop(){ stopped = true; const t = a.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t+0.8);
        setTimeout(()=>{ try{ if (vinylNode) vinylNode.stop(); out.disconnect(); if (hallIn) hallIn.disconnect(); }catch(e){} }, 1500); },
    };
  }
  let musicTimer = null;
  function stopMusic(){
    if (musicTimer){ clearInterval(musicTimer); musicTimer = null; }
    if (music){ music.stop(); music = null; }
    curWorld = -1;
  }
  function startMusic(){
    if (!S.set.music) return;
    const a = ctx(); if (!a) return;
    if (curWorld === S.world && music) return;
    stopMusic(); curWorld = S.world;
    music = MusicEngine(a, bus.mus, S.world);
    music.fadeIn(a.currentTime, 2);
    music.scheduleUntil(a.currentTime + 0.8);
    musicTimer = setInterval(()=>{ if (music && a.state === "running") music.scheduleUntil(a.currentTime + 0.8); }, 150);
  }
  function setMuted(m){
    muted = m;
    if (bus) bus.mus.gain.value = m ? 0 : MUSIC_LEVEL;
    if (AC){ try{ m ? AC.suspend() : AC.resume(); }catch(e){} }
  }
  // Звук выключается при любой потере фокуса (1.3), паузе от платформы, рекламе и скрытой вкладке (4.7)
  function refreshMute(){ setMuted(!!(Game.paused || document.hidden || !focused || (typeof YG !== "undefined" && YG.platformMute))); }
  function setFocus(f){ focused = f; refreshMute(); }
  function vibrate(ms){ if (S.set.vibro && navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} }

  return { sfx, startMusic, stopMusic, setMuted, refreshMute, setFocus, ctx, vibrate, voice, voiceOf,
           get lastVoiceAt(){ return lastVoiceAt; }, get muted(){ return muted; },
           _test:{ synthVoice, MusicEngine, STYLES, setBus(a){ bus = makeBus(a); return bus; } } };
})();
const SFX = Snd.sfx;
