"use strict";
/* =====================================================================
   ФОНЫ МИРОВ: размытые сцены в стиле игры (рисуются кодом, SVG).
   Холст 1200×1200, обрезается по экрану: на телефоне видна середина,
   на компьютере — вся ширина. Важное — в центре, украшения — по краям.
   ===================================================================== */
const Scene = (() => {
  const seeded = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const svg = (defs, body) => `<svg viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
  const lg = (id, stops, vertical=true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical?0:1}" y2="${vertical?1:0}">${stops.map(([o,c])=>`<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  const rg = (id, stops) => `<radialGradient id="${id}">${stops.map(([o,c,op])=>`<stop offset="${o}" stop-color="${c}" stop-opacity="${op==null?1:op}"/>`).join("")}</radialGradient>`;
  const cloud = (x, y, s, c="#FFFFFF", o=1) => `<g opacity="${o}" fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${70*s}" ry="${34*s}"/><ellipse cx="${x-55*s}" cy="${y+10*s}" rx="${45*s}" ry="${26*s}"/><ellipse cx="${x+55*s}" cy="${y+8*s}" rx="${50*s}" ry="${28*s}"/><ellipse cx="${x+10*s}" cy="${y-22*s}" rx="${40*s}" ry="${28*s}"/></g>`;

  /* ---------- 🏠 Дом: уютная комната ---------- */
  function home(){
    let b = "";
    b += `<rect width="1200" height="1200" fill="#F3DDBF"/>`;
    for (let x=0; x<1200; x+=80) b += `<rect x="${x}" y="0" width="40" height="900" fill="#F7E7D2"/>`;
    for (let x=40; x<1200; x+=80) for (let y=40; y<900; y+=120) b += `<circle cx="${x+20}" cy="${y}" r="6" fill="#EBC9A6" opacity=".7"/>`;
    b += `<rect x="0" y="880" width="1200" height="26" fill="#E0BE95"/>`;
    b += `<rect x="0" y="906" width="1200" height="294" fill="url(#floor)"/>`;
    for (let y=940; y<1200; y+=46) b += `<path d="M0 ${y} L1200 ${y}" stroke="#B07E4E" stroke-width="3" opacity=".5"/>`;
    for (let i=0; i<14; i++){ const y = 920 + (i%6)*46; b += `<path d="M${(i*173)%1200} ${y} L${(i*173)%1200} ${y+46}" stroke="#B07E4E" stroke-width="3" opacity=".5"/>`; }
    // окно
    b += `<rect x="455" y="170" width="290" height="400" rx="22" fill="#FFFFFF"/><rect x="475" y="190" width="250" height="360" rx="12" fill="url(#sky)"/>`;
    b += cloud(560, 290, .9) + cloud(680, 380, .7) + `<circle cx="690" cy="250" r="34" fill="#FFE27A"/>`;
    b += `<rect x="592" y="190" width="16" height="360" fill="#FFFFFF"/><rect x="475" y="362" width="250" height="16" fill="#FFFFFF"/>`;
    b += `<rect x="430" y="565" width="340" height="24" rx="8" fill="#FFFFFF"/>`;
    b += `<path d="M400 150 Q470 170 450 330 Q430 480 470 620 L400 620Z" fill="#F28C9A"/><path d="M800 150 Q730 170 750 330 Q770 480 730 620 L800 620Z" fill="#F28C9A"/>`;
    b += `<rect x="385" y="136" width="430" height="20" rx="10" fill="#B07E4E"/>`;
    b += `<rect x="520" y="520" width="44" height="46" rx="6" fill="#E08A5A"/><ellipse cx="542" cy="505" rx="34" ry="26" fill="#6DBB4F"/><ellipse cx="520" cy="490" rx="16" ry="22" fill="#5DB04A"/>`;
    // книжная полка
    b += `<rect x="200" y="330" width="200" height="560" rx="10" fill="#A0673F"/>`;
    const cols = ["#E0504F","#3E8ED0","#FFC43D","#5DB04A","#8A5BD6","#F28C3A","#2BAE96"];
    for (let s=0; s<4; s++){ const y = 350 + s*135; b += `<rect x="212" y="${y+110}" width="176" height="12" fill="#7A4A2A"/>`;
      let x = 218; let k = s*3; while (x < 375){ const w = 18 + (k*7)%16, h = 70 + (k*13)%36; b += `<rect x="${x}" y="${y+110-h}" width="${w}" height="${h}" rx="3" fill="${cols[k%cols.length]}"/>`; x += w + 4; k++; } }
    // картины и часы
    b += `<rect x="830" y="230" width="120" height="150" rx="8" fill="#FFFFFF" stroke="#B07E4E" stroke-width="10"/><path d="M850 350 L880 300 L905 330 L920 310 L935 350Z" fill="#5DB04A"/><circle cx="905" cy="275" r="14" fill="#FFC43D"/>`;
    b += `<circle cx="120" cy="230" r="60" fill="#FFFFFF" stroke="#B07E4E" stroke-width="10"/><path d="M120 230 L120 190 M120 230 L150 240" stroke="#3B2A20" stroke-width="6" stroke-linecap="round"/>`;
    b += `<rect x="1020" y="420" width="140" height="100" rx="8" fill="#FFFFFF" stroke="#B07E4E" stroke-width="8"/><circle cx="1090" cy="470" r="26" fill="#F7A8B8"/>`;
    // диван
    b += `<rect x="330" y="700" width="540" height="130" rx="40" fill="#5FA9A3"/><rect x="300" y="760" width="600" height="150" rx="36" fill="#6BB6B0"/>`;
    b += `<rect x="290" y="720" width="80" height="190" rx="36" fill="#5FA9A3"/><rect x="830" y="720" width="80" height="190" rx="36" fill="#5FA9A3"/>`;
    b += `<rect x="390" y="730" width="140" height="90" rx="26" fill="#F7D774"/><rect x="670" y="730" width="140" height="90" rx="26" fill="#F28C9A"/>`;
    b += `<rect x="320" y="905" width="20" height="30" fill="#7A4A2A"/><rect x="860" y="905" width="20" height="30" fill="#7A4A2A"/>`;
    // ковёр, торшер, растение
    b += `<ellipse cx="600" cy="1070" rx="420" ry="90" fill="#E9A0A0"/><ellipse cx="600" cy="1070" rx="320" ry="62" fill="#F4C4B8"/>`;
    b += `<circle cx="1000" cy="560" r="150" fill="url(#glow)"/><rect x="994" y="560" width="12" height="360" fill="#7A4A2A"/><path d="M930 560 L1070 560 L1040 470 L960 470Z" fill="#FFE0A0"/><ellipse cx="1000" cy="925" rx="60" ry="14" fill="#7A4A2A"/>`;
    b += `<path d="M90 900 L150 900 L140 990 L100 990Z" fill="#E08A5A"/>` + [[-40,-90],[0,-120],[40,-95],[-60,-50],[60,-55]].map(([dx,dy])=>`<ellipse cx="${120+dx*.6}" cy="${900+dy*.6}" rx="22" ry="60" transform="rotate(${dx*.6} ${120+dx*.6} ${900+dy*.6})" fill="#5DB04A"/>`).join("");
    b += `<path d="M1080 880 L1150 880 L1140 960 L1090 960Z" fill="#8A5BD6"/><circle cx="1115" cy="840" r="46" fill="#6DBB4F"/><circle cx="1090" cy="815" r="30" fill="#5DB04A"/>`;
    const defs = lg("floor",[[0,"#C8945F"],[1,"#B07E4E"]]) + lg("sky",[[0,"#9ED8F5"],[1,"#DDF3FF"]]) + rg("glow",[[0,"#FFE9A8",.8],[1,"#FFE9A8",0]]);
    return svg(defs, b);
  }

  /* ---------- 🌳 Сад: деревья, забор, цветы ---------- */
  function garden(){
    const R = seeded(7); let b = "";
    b += `<rect width="1200" height="1200" fill="url(#gsky)"/>`;
    b += `<circle cx="960" cy="200" r="150" fill="url(#sun)"/><circle cx="960" cy="200" r="70" fill="#FFE27A"/>`;
    b += cloud(260, 180, 1.2) + cloud(700, 120, .9, "#FFFFFF", .9) + cloud(1100, 330, .8, "#FFFFFF", .8);
    b += `<path d="M0 640 Q200 520 420 620 Q640 520 860 610 Q1040 540 1200 600 L1200 1200 L0 1200Z" fill="#B7E09A"/>`;
    b += `<path d="M0 720 Q300 640 600 710 Q900 640 1200 700 L1200 1200 L0 1200Z" fill="#9BD37C"/>`;
    // деревья
    const tree = (x, y, s, c1, c2, fruit) => `<rect x="${x-14*s}" y="${y}" width="${28*s}" height="${170*s}" rx="${10*s}" fill="#8A5A3A"/><circle cx="${x}" cy="${y-20*s}" r="${110*s}" fill="${c1}"/><circle cx="${x-70*s}" cy="${y+20*s}" r="${70*s}" fill="${c2}"/><circle cx="${x+70*s}" cy="${y+15*s}" r="${75*s}" fill="${c2}"/><circle cx="${x+10*s}" cy="${y-80*s}" r="${70*s}" fill="${c2}"/>` + (fruit ? [[-40,-30],[30,-60],[60,20],[-70,30],[10,10]].map(([dx,dy])=>`<circle cx="${x+dx*s}" cy="${y+dy*s}" r="${12*s}" fill="${fruit}"/>`).join("") : "");
    b += tree(130, 560, 1.1, "#6DBB4F", "#5DB04A", "#E0504F") + tree(1080, 540, 1.2, "#6DBB4F", "#4E9A38", "#FFC43D");
    b += tree(360, 640, .7, "#7FC85E", "#6DBB4F") + tree(850, 630, .75, "#7FC85E", "#5DB04A", "#F58FB0");
    // фонтан
    b += `<ellipse cx="600" cy="800" rx="150" ry="36" fill="#9BB7C8"/><ellipse cx="600" cy="792" rx="126" ry="26" fill="#8FD0F5"/><rect x="585" y="700" width="30" height="92" fill="#B7C3CE"/><ellipse cx="600" cy="700" rx="60" ry="14" fill="#B7C3CE"/><path d="M600 690 Q560 620 530 700 M600 690 Q640 620 670 700 M600 690 L600 630" stroke="#BFE6FF" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    // забор
    b += `<rect x="0" y="840" width="1200" height="16" fill="#FFFFFF"/><rect x="0" y="890" width="1200" height="16" fill="#FFFFFF"/>`;
    for (let x=10; x<1200; x+=54) b += `<path d="M${x} 930 L${x} 830 L${x+18} 810 L${x+36} 830 L${x+36} 930Z" fill="#FFFFFF" stroke="#E6E1D8" stroke-width="3"/>`;
    // клумбы
    b += `<rect x="0" y="930" width="1200" height="270" fill="#8CCB6E"/>`;
    const fc = ["#F58FB0","#FFD24A","#FFFFFF","#E0504F","#9AD0F5","#C79BFF"];
    for (let i=0;i<140;i++){ const x = R()*1200, y = 950 + R()*240, c = fc[Math.floor(R()*fc.length)], r = 8 + R()*8;
      b += `<g><circle cx="${x-r*.7}" cy="${y}" r="${r*.6}" fill="${c}"/><circle cx="${x+r*.7}" cy="${y}" r="${r*.6}" fill="${c}"/><circle cx="${x}" cy="${y-r*.7}" r="${r*.6}" fill="${c}"/><circle cx="${x}" cy="${y+r*.7}" r="${r*.6}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r*.45}" fill="#FFC43D"/></g>`; }
    const defs = lg("gsky",[[0,"#A9DEFA"],[.6,"#E5F7FF"],[1,"#F4FFF0"]]) + rg("sun",[[0,"#FFF3B0",.9],[1,"#FFF3B0",0]]);
    return svg(defs, b);
  }

  /* ---------- 🌃 Город: вечер, дождь, неон ---------- */
  function city(){
    const R = seeded(11); let b = "";
    b += `<rect width="1200" height="1200" fill="url(#csky)"/>`;
    b += `<circle cx="880" cy="190" r="90" fill="url(#moon)"/><circle cx="880" cy="190" r="46" fill="#FFF3C8" opacity=".85"/>`;
    b += cloud(300, 170, 1.4, "#4A4478", .9) + cloud(760, 240, 1.1, "#4A4478", .85) + cloud(1100, 120, 1.2, "#4A4478", .9);
    // дальние дома
    let x = -20;
    while (x < 1220){ const w = 70 + R()*90, h = 260 + R()*260; b += `<rect x="${x}" y="${820-h}" width="${w}" height="${h+40}" fill="#3E4376"/>`;
      for (let wy=820-h+20; wy<820; wy+=36) for (let wx=x+12; wx<x+w-14; wx+=26) if (R()<.45) b += `<rect x="${wx}" y="${wy}" width="12" height="16" fill="#FFD27A" opacity=".55"/>`;
      x += w + 8; }
    // ближние дома с неоном
    x = -40;
    while (x < 1240){ const w = 130 + R()*110, h = 180 + R()*200; b += `<rect x="${x}" y="${900-h}" width="${w}" height="${h+30}" fill="#2B2F58"/>`;
      for (let wy=900-h+24; wy<880; wy+=44) for (let wx=x+16; wx<x+w-20; wx+=34) if (R()<.5) b += `<rect x="${wx}" y="${wy}" width="18" height="24" rx="3" fill="${R()<.8?"#FFC96B":"#8FD8FF"}" opacity=".75"/>`;
      if (R() < .7){ const nc = R()<.5 ? "#FF6FD8" : "#5CE1E6", nx = x + 20 + R()*(w-110), ny = 900 - h + 30 + R()*60;
        b += `<rect x="${nx}" y="${ny}" width="90" height="36" rx="12" fill="none" stroke="${nc}" stroke-width="7"/><rect x="${nx}" y="${ny}" width="90" height="36" rx="12" fill="${nc}" opacity=".25"/><circle cx="${nx+45}" cy="${ny+18}" r="70" fill="${nc}" opacity=".12"/>`; }
      x += w + 14; }
    // мокрая улица
    b += `<rect x="0" y="900" width="1200" height="300" fill="#232544"/>`;
    for (let i=0;i<26;i++){ const sx = R()*1200, c = ["#FF6FD8","#5CE1E6","#FFC96B"][i%3]; b += `<rect x="${sx}" y="${920+R()*40}" width="${8+R()*20}" height="${120+R()*140}" fill="${c}" opacity=".18"/>`; }
    b += `<rect x="0" y="1000" width="1200" height="10" fill="#FFFFFF" opacity=".12"/>`;
    for (let i=0;i<8;i++) b += `<rect x="${i*160+40}" y="1060" width="80" height="12" rx="6" fill="#FFFFFF" opacity=".25"/>`;
    // фонари
    for (const lx of [150, 600, 1050]){ b += `<circle cx="${lx}" cy="700" r="110" fill="url(#lamp)"/><rect x="${lx-6}" y="700" width="12" height="220" fill="#1B1D38"/><path d="M${lx-26} 700 L${lx+26} 700 L${lx+14} 676 L${lx-14} 676Z" fill="#FFE9A8"/>`; }
    // струи дождя
    for (let i=0;i<120;i++){ const rx = R()*1260, ry = R()*1200; b += `<path d="M${rx} ${ry} l-10 34" stroke="#BFD8FF" stroke-width="2.5" opacity=".35" stroke-linecap="round"/>`; }
    const defs = lg("csky",[[0,"#1F2350"],[.55,"#3E3A74"],[1,"#6A4F8E"]]) + rg("moon",[[0,"#FFF3C8",.7],[1,"#FFF3C8",0]]) + rg("lamp",[[0,"#FFE9A8",.55],[1,"#FFE9A8",0]]);
    return svg(defs, b);
  }

  /* ---------- 🏝️ Остров: море, пальмы, закат ---------- */
  function island(){
    const R = seeded(5); let b = "";
    b += `<rect width="1200" height="1200" fill="url(#isky)"/>`;
    b += `<circle cx="760" cy="600" r="260" fill="url(#isun)"/><circle cx="760" cy="600" r="120" fill="#FFB65C"/>`;
    b += cloud(250, 250, 1.1, "#FFFFFF", .85) + cloud(980, 190, .9, "#FFF1E0", .9);
    for (const [gx,gy] of [[420,300],[470,330],[1000,380]]) b += `<path d="M${gx} ${gy} q14 -14 28 0 q14 -14 28 0" stroke="#5A4A3A" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    b += `<path d="M120 640 Q220 560 330 640Z" fill="#6DAE8A" opacity=".7"/>`;
    b += `<rect x="0" y="630" width="1200" height="300" fill="url(#sea)"/>`;
    for (let i=0;i<40;i++){ const wx = R()*1200, wy = 660 + R()*240; b += `<path d="M${wx} ${wy} q15 -8 30 0 q15 -8 30 0" stroke="#FFFFFF" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`; }
    b += `<rect x="690" y="640" width="140" height="10" fill="#FFE3AE" opacity=".6"/><rect x="700" y="670" width="120" height="8" fill="#FFE3AE" opacity=".5"/><rect x="715" y="700" width="90" height="7" fill="#FFE3AE" opacity=".4"/>`;
    // лодка
    b += `<path d="M960 720 L1070 720 L1050 745 L980 745Z" fill="#B07E4E"/><path d="M1010 718 L1010 630 L1060 710Z" fill="#FFFFFF"/><path d="M1005 718 L1005 650 L965 710Z" fill="#F28C9A"/>`;
    // песок
    b += `<path d="M0 900 Q300 860 600 900 Q900 940 1200 890 L1200 1200 L0 1200Z" fill="#F6DCA0"/><path d="M0 900 Q300 860 600 900 Q900 940 1200 890" stroke="#FFFFFF" stroke-width="12" fill="none" opacity=".7"/>`;
    for (let i=0;i<60;i++) b += `<circle cx="${R()*1200}" cy="${930+R()*260}" r="${2+R()*3}" fill="#E0B870" opacity=".7"/>`;
    b += `<path d="M300 1080 q20 -30 40 0 Z" fill="#F7B7C3"/><circle cx="880" cy="1100" r="14" fill="#FFFFFF"/><path d="M500 1150 l12 -22 l12 22Z" fill="#F2A04A"/>`;
    // пальмы
    const palm = (x, y, s, flip) => { const d = flip ? -1 : 1;
      let p = `<path d="M${x} ${y} Q${x+d*40*s} ${y-220*s} ${x+d*10*s} ${y-440*s}" stroke="#9C6B45" stroke-width="${34*s}" fill="none" stroke-linecap="round"/>`;
      for (let k=0;k<6;k++) p += `<path d="M${x+d*10*s} ${y-440*s} l${d*(-40+k*30)*s} ${(-40+k*14)*s}" stroke="#9C6B45" stroke-width="3" opacity=".5"/>`;
      const tx = x + d*10*s, ty = y - 440*s;
      for (const [a,l] of [[-160,190],[-120,210],[-60,210],[-20,190],[20,150],[-200,150]]){ const rad = a*Math.PI/180;
        p += `<path d="M${tx} ${ty} Q${tx+Math.cos(rad)*l*.5*s} ${ty+Math.sin(rad)*l*.5*s-50*s} ${tx+Math.cos(rad)*l*s} ${ty+Math.sin(rad)*l*s+30*s}" stroke="#4E9A38" stroke-width="${36*s}" fill="none" stroke-linecap="round"/>`; }
      p += `<circle cx="${tx-14*s}" cy="${ty+16*s}" r="${14*s}" fill="#6B4428"/><circle cx="${tx+12*s}" cy="${ty+20*s}" r="${14*s}" fill="#6B4428"/>`;
      return p; };
    b += palm(170, 1060, 1.1, false) + palm(1060, 1080, 1.05, true) + palm(330, 1000, .7, false);
    const defs = lg("isky",[[0,"#7FD0F2"],[.45,"#BFE6F5"],[.55,"#FFE3B8"],[.62,"#FFD2A0"]]) + lg("sea",[[0,"#3FB5D9"],[1,"#7FDCEE"]]) + rg("isun",[[0,"#FFD08A",.9],[1,"#FFD08A",0]]);
    return svg(defs, b);
  }

  /* ---------- 🚀 Космос: вид из окна станции ---------- */
  function space(){
    const R = seeded(3); let b = "";
    b += `<rect width="1200" height="1200" fill="url(#ssky)"/>`;
    b += `<ellipse cx="300" cy="360" rx="380" ry="220" fill="url(#neb1)"/><ellipse cx="900" cy="760" rx="420" ry="240" fill="url(#neb2)"/><ellipse cx="760" cy="260" rx="260" ry="160" fill="url(#neb3)"/>`;
    for (let i=0;i<260;i++){ const r = R() < .9 ? 1.5 + R()*2 : 3 + R()*3; b += `<circle cx="${R()*1200}" cy="${R()*1200}" r="${r}" fill="${R()<.8?"#FFFFFF":"#FFE08A"}" opacity="${.5+R()*.5}"/>`; }
    // планета с кольцом
    b += `<circle cx="240" cy="930" r="190" fill="url(#planet)"/><path d="M80 880 Q240 840 400 900" stroke="#FFFFFF" stroke-width="10" opacity=".15" fill="none"/>`;
    b += `<ellipse cx="240" cy="930" rx="330" ry="60" transform="rotate(-14 240 930)" fill="none" stroke="#FFD2A0" stroke-width="16" opacity=".8"/>`;
    // луна
    b += `<circle cx="980" cy="230" r="95" fill="#E4E4EC"/><circle cx="950" cy="200" r="20" fill="#C8C8D6"/><circle cx="1010" cy="260" r="14" fill="#C8C8D6"/><circle cx="1000" cy="190" r="9" fill="#C8C8D6"/>`;
    // спутник
    b += `<g transform="rotate(-20 640 520)"><rect x="600" y="505" width="80" height="30" rx="6" fill="#C3CAD6"/><rect x="520" y="510" width="70" height="20" fill="#3E8ED0"/><rect x="690" y="510" width="70" height="20" fill="#3E8ED0"/><circle cx="640" cy="495" r="10" fill="#E0504F"/></g>`;
    // рама иллюминатора станции
    b += `<path fill-rule="evenodd" d="M0 0 H1200 V1200 H0Z M90 90 H1110 Q1150 90 1150 130 V1070 Q1150 1110 1110 1110 H90 Q50 1110 50 1070 V130 Q50 90 90 90Z" fill="#2A3060"/>`;
    b += `<rect x="50" y="90" width="1100" height="1020" rx="40" fill="none" stroke="#4A5290" stroke-width="16"/>`;
    for (let i=0;i<12;i++){ b += `<circle cx="${100+i*91}" cy="60" r="8" fill="#5A63A8"/><circle cx="${100+i*91}" cy="1140" r="8" fill="#5A63A8"/>`; }
    for (let i=0;i<12;i++){ b += `<circle cx="22" cy="${120+i*85}" r="7" fill="#5A63A8"/><circle cx="1178" cy="${120+i*85}" r="7" fill="#5A63A8"/>`; }
    const defs = lg("ssky",[[0,"#0B0E2A"],[1,"#1D1650"]]) + rg("neb1",[[0,"#FF6FD8",.45],[1,"#FF6FD8",0]]) + rg("neb2",[[0,"#6A8BFF",.45],[1,"#6A8BFF",0]]) + rg("neb3",[[0,"#9A6BEA",.4],[1,"#9A6BEA",0]]) +
      `<radialGradient id="planet" cx=".35" cy=".35"><stop offset="0" stop-color="#9FB0FF"/><stop offset="1" stop-color="#4A56B8"/></radialGradient>`;
    return svg(defs, b);
  }

  const MAKERS = {home, garden, city, island, space};
  const cache = {};
  function get(id){ return cache[id] || (cache[id] = (MAKERS[id] || home)()); }
  let current = "";
  function show(id, host){
    if (current === id) return;
    current = id;
    const layer = document.createElement("div"); layer.className = "sceneLayer"; layer.innerHTML = get(id);
    host.appendChild(layer);
    requestAnimationFrame(()=>layer.classList.add("on"));
    [...host.children].forEach(ch => { if (ch !== layer){ ch.classList.remove("on"); setTimeout(()=>ch.remove(), 700); } });
  }
  return { get, show };
})();
