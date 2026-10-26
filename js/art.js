"use strict";
/* =====================================================================
   ГРАФИКА: коты (SVG), аксессуары, косметика, частицы миров.
   Все рисунки оригинальные, строятся кодом — файлов картинок нет.
   ===================================================================== */

const OUTLINE = 'stroke="rgba(60,40,30,.25)" stroke-width="1.5"';

// --- аксессуары: слой -> svg ---
const ACC = {
  // ===== сзади (до тела) =====
  wings:         {z:"back", s:`<ellipse cx="28" cy="62" rx="12" ry="7" transform="rotate(-30 28 62)" fill="rgba(210,235,255,.85)" stroke="#9CC6E8" stroke-width="1.2"/><ellipse cx="72" cy="62" rx="12" ry="7" transform="rotate(30 72 62)" fill="rgba(210,235,255,.85)" stroke="#9CC6E8" stroke-width="1.2"/>`},
  butterflyWings:{z:"back", s:`<ellipse cx="24" cy="60" rx="15" ry="11" fill="#F5A3D6" stroke="#B85FA0" stroke-width="1.2"/><ellipse cx="76" cy="60" rx="15" ry="11" fill="#F5A3D6" stroke="#B85FA0" stroke-width="1.2"/><ellipse cx="27" cy="78" rx="10" ry="8" fill="#9AD0F5" stroke="#5B96C2" stroke-width="1.2"/><ellipse cx="73" cy="78" rx="10" ry="8" fill="#9AD0F5" stroke="#5B96C2" stroke-width="1.2"/><circle cx="22" cy="58" r="3.5" fill="#fff" opacity=".8"/><circle cx="78" cy="58" r="3.5" fill="#fff" opacity=".8"/>`},
  angelWings:    {z:"back", s:`<path d="M30 66 Q8 50 12 36 Q20 46 24 44 Q18 56 30 60Z" fill="#fff" stroke="#E4D2DA" stroke-width="1.2"/><path d="M70 66 Q92 50 88 36 Q80 46 76 44 Q82 56 70 60Z" fill="#fff" stroke="#E4D2DA" stroke-width="1.2"/>`},
  surfboard:     {z:"back", s:`<ellipse cx="82" cy="60" rx="8" ry="34" transform="rotate(12 82 60)" fill="#4FC3F7" stroke="#2A8CC0" stroke-width="1.5"/><path d="M84 28 L77 92" stroke="#FFD24A" stroke-width="3" transform="rotate(12 82 60)"/>`},
  cape:          {z:"back", s:`<path d="M24 62 Q50 56 76 62 L86 97 L14 97Z" fill="#B0303F" stroke="#7A1E2A" stroke-width="1.5"/><path d="M28 64 Q50 60 72 64 L78 95 L22 95Z" fill="#6A2BA0" opacity=".35"/>`},
  // ===== шея / тело =====
  tie:        {z:"neck", s:`<path d="M46 64 L54 64 L52 68 L56 84 L50 90 L44 84 L48 68Z" fill="#D9534F" stroke="#A33330" stroke-width="1"/>`},
  bowtie:     {z:"neck", s:`<path d="M50 66 L40 60 L40 72Z M50 66 L60 60 L60 72Z" fill="#D9534F" stroke="#A33330" stroke-width="1"/><circle cx="50" cy="66" r="3" fill="#A33330"/>`},
  bow:        {z:"head", s:`<path d="M70 18 L60 12 L60 24Z M70 18 L80 12 L80 24Z" fill="#F07A9A" stroke="#C04F72" stroke-width="1"/><circle cx="70" cy="18" r="3" fill="#C04F72"/>`},
  scarf:      {z:"neck", s:`<ellipse cx="50" cy="66" rx="22" ry="5.5" fill="#E0504F"/><path d="M58 66 L66 90 L58 90 L54 68Z" fill="#E0504F"/><path d="M30 65 L70 65 M59 76 L63 76 M60 83 L64 83" stroke="#fff" stroke-width="1.5" opacity=".7"/>`},
  apron:      {z:"neck", s:`<path d="M36 68 L64 68 L67 95 L33 95Z" fill="#3F8E5C" stroke="#2C6642" stroke-width="1.2"/><rect x="43" y="80" width="14" height="8" rx="2" fill="#2C6642"/>`},
  daisyCollar:{z:"neck", s:(()=>{let s="";for(let i=0;i<9;i++){const a=Math.PI*(0.1+0.8*i/8),x=50-Math.cos(a)*22,y=64+Math.sin(a)*5;s+=`<circle cx="${x}" cy="${y}" r="4.2" fill="#fff" stroke="#E8E0D0" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="1.6" fill="#FFC43D"/>`;}return s;})()},
  sailorCollar:{z:"neck",s:`<path d="M30 63 L50 74 L70 63 L67 72 L50 84 L33 72Z" fill="#2E6FB7"/><path d="M33 67 L50 77 L67 67" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M50 76 L44 84 L50 82 L56 84Z" fill="#E0504F"/>`},
  pearls:     {z:"neck", s:(()=>{let s="";for(let i=0;i<9;i++){const a=Math.PI*(0.12+0.76*i/8);s+=`<circle cx="${50-Math.cos(a)*20}" cy="${64+Math.sin(a)*6}" r="2.4" fill="#FFFDF5" stroke="#D8CFC0" stroke-width=".6"/>`;}return s;})()},
  starBadge:  {z:"neck", s:`<path d="M50 70 L53 77 L60 77 L54.5 81.5 L57 89 L50 84.5 L43 89 L45.5 81.5 L40 77 L47 77Z" fill="#FFC43D" stroke="#D69A0F" stroke-width="1"/>`},
  // ===== лицо =====
  glasses:    {z:"face", s:`<circle cx="38" cy="47" r="9" fill="rgba(255,255,255,.18)" stroke="#2B2A33" stroke-width="2.5"/><circle cx="62" cy="47" r="9" fill="rgba(255,255,255,.18)" stroke="#2B2A33" stroke-width="2.5"/><path d="M47 46 Q50 44 53 46" stroke="#2B2A33" stroke-width="2.5" fill="none"/>`},
  sunglasses: {z:"face", s:`<rect x="28" y="41" width="19" height="12" rx="5" fill="#1E1A1D"/><rect x="53" y="41" width="19" height="12" rx="5" fill="#1E1A1D"/><path d="M47 45 L53 45" stroke="#1E1A1D" stroke-width="2.5"/><path d="M31 44 L36 44" stroke="#fff" stroke-width="1.5" opacity=".6"/><path d="M56 44 L61 44" stroke="#fff" stroke-width="1.5" opacity=".6"/>`},
  eyepatch:   {z:"face", s:`<path d="M24 36 L76 30" stroke="#1E1A1D" stroke-width="2"/><ellipse cx="38" cy="47" rx="9" ry="9" fill="#1E1A1D"/>`},
  goggles:    {z:"face", s:`<path d="M20 46 L80 46" stroke="#6B4428" stroke-width="5"/><circle cx="38" cy="46" r="9" fill="rgba(160,220,255,.55)" stroke="#E08A2A" stroke-width="3"/><circle cx="62" cy="46" r="9" fill="rgba(160,220,255,.55)" stroke="#E08A2A" stroke-width="3"/>`},
  fangs:      {z:"face", s:`<path d="M45 60 L47 65 L49 60Z M51 60 L53 65 L55 60Z" fill="#fff" stroke="#ccc" stroke-width=".5"/>`},
  // ===== голова =====
  crown:      {z:"head", s:`<path d="M34 22 L36 6 L43 14 L50 3 L57 14 L64 6 L66 22Z" fill="#FFC43D" stroke="#D69A0F" stroke-width="1.5" stroke-linejoin="round"/><circle cx="50" cy="15" r="2.6" fill="#F0506E"/><circle cx="41" cy="18" r="1.8" fill="#4D9DE0"/><circle cx="59" cy="18" r="1.8" fill="#6BBF59"/>`},
  strawHat:   {z:"head", s:`<ellipse cx="50" cy="22" rx="33" ry="6" fill="#E8C77A" stroke="#B8954A" stroke-width="1.2"/><path d="M33 22 Q35 5 50 5 Q65 5 67 22Z" fill="#F0D48A" stroke="#B8954A" stroke-width="1.2"/><path d="M34 18 Q50 21 66 18 L66.5 21 Q50 24 33.5 21Z" fill="#E0504F"/>`},
  cap:        {z:"head", s:`<path d="M28 24 Q30 5 50 5 Q70 5 72 24Z" fill="#3E8ED0" stroke="#2A6AA0" stroke-width="1.2"/><ellipse cx="74" cy="24" rx="15" ry="4" fill="#2A6AA0"/><circle cx="50" cy="6" r="2.5" fill="#2A6AA0"/>`},
  policeHat:  {z:"head", s:`<path d="M26 20 L29 8 Q50 0 71 8 L74 20Z" fill="#2E3A5C" stroke="#1B2338" stroke-width="1.2"/><rect x="28" y="17" width="44" height="6" fill="#1B2338"/><ellipse cx="50" cy="24" rx="24" ry="4" fill="#111"/><path d="M50 7 L53 11 L50 15 L47 11Z" fill="#FFC43D"/>`},
  topHat:     {z:"head", s:`<rect x="36" y="-4" width="28" height="24" rx="2" fill="#2B2A33"/><ellipse cx="50" cy="20" rx="23" ry="4.5" fill="#2B2A33"/><rect x="36" y="13" width="28" height="4" fill="#D9534F"/>`},
  pirateHat:  {z:"head", s:`<path d="M16 25 Q50 -8 84 25 Q50 15 16 25Z" fill="#2B2A33" stroke="#111" stroke-width="1"/><circle cx="50" cy="12" r="3.5" fill="#fff"/><path d="M45 17 L55 21 M55 17 L45 21" stroke="#fff" stroke-width="1.5"/>`},
  captainHat: {z:"head", s:`<path d="M27 21 Q29 5 50 5 Q71 5 73 21Z" fill="#fff" stroke="#BFB5A8" stroke-width="1.2"/><rect x="28" y="17" width="44" height="6" fill="#1B2A55"/><ellipse cx="50" cy="24" rx="22" ry="4" fill="#111"/><circle cx="50" cy="13" r="3.5" fill="#FFC43D" stroke="#D69A0F"/>`},
  witchHat:   {z:"head", s:`<ellipse cx="50" cy="22" rx="31" ry="6" fill="#3A2A55"/><path d="M34 22 L60 -8 L66 22Z" fill="#3A2A55"/><path d="M36 17 L65 17 L66 21 L35 21Z" fill="#8BE07A"/>`},
  santaHat:   {z:"head", s:`<path d="M27 22 Q38 -2 68 4 Q84 8 86 20 L82 22Z" fill="#E0504F"/><ellipse cx="54" cy="22" rx="28" ry="5" fill="#fff"/><circle cx="86" cy="18" r="5" fill="#fff"/>`},
  leaf:       {z:"head", s:`<path d="M50 20 Q44 6 54 2 Q60 12 50 20Z" fill="#5DB04A" stroke="#3E8330" stroke-width="1"/><path d="M50 20 Q52 10 54 4" stroke="#3E8330" stroke-width="1" fill="none"/>`},
  wreath:     {z:"head", s:(()=>{let s="";const cols=["#FFD24A","#F7A8B8","#FFFFFF","#9AD0F5"];for(let i=0;i<9;i++){const a=Math.PI*(1.1+0.8*i/8),x=50+Math.cos(a)*27,y=40+Math.sin(a)*22;s+=`<circle cx="${x}" cy="${y}" r="4" fill="${cols[i%4]}" stroke="#6A9E3A" stroke-width="1"/>`;}return s;})()},
  flowerEar:  {z:"head", s:`<g transform="translate(70 20)"><circle cx="0" cy="-5" r="4" fill="#F58FB0"/><circle cx="5" cy="-1" r="4" fill="#F58FB0"/><circle cx="3" cy="5" r="4" fill="#F58FB0"/><circle cx="-3" cy="5" r="4" fill="#F58FB0"/><circle cx="-5" cy="-1" r="4" fill="#F58FB0"/><circle r="3" fill="#FFD24A"/></g>`},
  rose:       {z:"head", s:`<g transform="translate(69 21)"><path d="M-2 4 Q-10 8 -8 0" fill="#5DB04A"/><circle r="7" fill="#D9344F"/><path d="M-4 -1 Q0 -6 4 -1 Q0 3 -4 -1Z M-5 2 Q0 6 5 2" stroke="#9E1F35" stroke-width="1.2" fill="none"/></g>`},
  leafCrown:  {z:"head", s:(()=>{let s="";for(let i=0;i<7;i++){const a=Math.PI*(1.15+0.7*i/6),x=50+Math.cos(a)*25,y=38+Math.sin(a)*22,r=(a*180/Math.PI)+90;s+=`<ellipse cx="${x}" cy="${y}" rx="4" ry="8" transform="rotate(${r} ${x} ${y})" fill="${i%2?"#6DBB4F":"#4E9A38"}" stroke="#2F6B22" stroke-width=".8"/>`;}return s;})()},
  cactusFlower:{z:"head",s:`<g transform="translate(50 16)"><circle cx="0" cy="-5" r="4" fill="#FF7AB0"/><circle cx="5" cy="0" r="4" fill="#FF7AB0"/><circle cx="-5" cy="0" r="4" fill="#FF7AB0"/><circle r="3" fill="#FFE08A"/></g>`},
  coconutHat: {z:"head", s:`<path d="M29 23 Q50 -2 71 23Z" fill="#7A4E2E" stroke="#4E2F18" stroke-width="1.2"/><path d="M33 22 L67 22" stroke="#F3E6D0" stroke-width="2.5"/><path d="M40 12 L42 8 M50 8 L50 4 M60 12 L58 8" stroke="#4E2F18" stroke-width="1.2"/>`},
  waveCrown:  {z:"head", s:`<path d="M30 22 Q34 8 40 16 Q44 4 50 14 Q56 4 60 16 Q66 8 70 22Z" fill="#6FD3F5" stroke="#2A8CC0" stroke-width="1.5"/><circle cx="50" cy="14" r="2.5" fill="#fff"/><circle cx="40" cy="17" r="1.8" fill="#fff"/><circle cx="60" cy="17" r="1.8" fill="#fff"/>`},
  halo:       {z:"head", s:`<ellipse cx="50" cy="5" rx="18" ry="4.5" fill="none" stroke="#FFC43D" stroke-width="3"/>`},
  antenna:    {z:"head", s:`<path d="M42 20 Q38 10 34 4 M58 20 Q62 10 66 4" stroke="#3A3036" stroke-width="2" fill="none"/><circle cx="34" cy="4" r="3" fill="#3A3036"/><circle cx="66" cy="4" r="3" fill="#3A3036"/>`},
  antennaBall:{z:"head", s:`<path d="M50 19 L50 4" stroke="#8A93A3" stroke-width="2.5"/><circle cx="50" cy="4" r="4" fill="#E0504F"/>`},
  alienAntenna:{z:"head",s:`<path d="M42 20 Q36 8 32 2 M58 20 Q64 8 68 2 M50 18 L50 0" stroke="#58B048" stroke-width="2.5" fill="none"/><circle cx="32" cy="2" r="3.5" fill="#FFE08A"/><circle cx="68" cy="2" r="3.5" fill="#FFE08A"/><circle cx="50" cy="0" r="3.5" fill="#FFE08A"/>`},
  pumpkinHat: {z:"head", s:`<ellipse cx="50" cy="14" rx="17" ry="11" fill="#F28C28" stroke="#C0621A" stroke-width="1.2"/><path d="M42 5 Q40 14 42 24 M50 3 L50 25 M58 5 Q60 14 58 24" stroke="#C0621A" stroke-width="1.2" fill="none"/><path d="M50 3 Q52 -3 56 -3" stroke="#3E8330" stroke-width="3" fill="none"/>`},
  mohawk:     {z:"head", s:`<path d="M38 22 L41 4 L45 18 L49 0 L53 18 L57 3 L61 18 L64 6 L64 22Z" fill="#E0504F" stroke="#A33330" stroke-width="1"/>`},
  headphones: {z:"face", s:`<path d="M19 46 Q19 8 50 8 Q81 8 81 46" stroke="#2B2A33" stroke-width="5" fill="none"/><rect x="12" y="38" width="11" height="18" rx="5" fill="#3CF2E6" stroke="#2B2A33" stroke-width="2"/><rect x="77" y="38" width="11" height="18" rx="5" fill="#3CF2E6" stroke="#2B2A33" stroke-width="2"/>`},
  helmet:     {z:"top",  s:`<circle cx="50" cy="48" r="39" fill="rgba(190,225,255,.22)" stroke="#DCE3EE" stroke-width="4"/><path d="M26 30 Q34 18 48 14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`},
  // ===== предметы спереди =====
  can:     {z:"front", s:`<rect x="72" y="78" width="16" height="14" rx="3" fill="#6FA8DC" stroke="#3D78B0" stroke-width="1.2"/><path d="M72 82 L64 74" stroke="#3D78B0" stroke-width="3" stroke-linecap="round"/><path d="M76 78 Q80 70 86 78" stroke="#3D78B0" stroke-width="2" fill="none"/>`},
  parcel:  {z:"front", s:`<rect x="70" y="76" width="20" height="18" rx="2" fill="#C99A62" stroke="#8A6438" stroke-width="1.2"/><path d="M80 76 L80 94" stroke="#E8D3A8" stroke-width="3"/>`},
  laptop:  {z:"front", s:`<rect x="33" y="74" width="34" height="18" rx="2" fill="#4A5160" stroke="#2B2F38" stroke-width="1.2"/><circle cx="50" cy="83" r="3" fill="#3CF2E6"/><rect x="28" y="91" width="44" height="5" rx="2" fill="#8A93A3"/>`},
  cup:     {z:"front", s:`<path d="M72 80 L88 80 L86 94 L74 94Z" fill="#fff" stroke="#B9A48A" stroke-width="1.2"/><path d="M88 83 Q93 86 87 90" stroke="#B9A48A" stroke-width="2" fill="none"/><path d="M77 76 Q75 72 78 68 M83 76 Q81 72 84 68" stroke="#C9B8A8" stroke-width="1.5" fill="none"/><path d="M74 81 L86 81" stroke="#8A5A3A" stroke-width="3"/>`},
  guitar:  {z:"front", s:`<path d="M60 80 L86 52" stroke="#6B4428" stroke-width="3.5" stroke-linecap="round"/><circle cx="62" cy="84" r="9" fill="#D9844A" stroke="#8A4E22" stroke-width="1.2"/><circle cx="56" cy="78" r="6.5" fill="#D9844A" stroke="#8A4E22" stroke-width="1.2"/><circle cx="60" cy="81" r="2.5" fill="#3A2A1E"/>`},
  wrench:  {z:"front", s:`<path d="M72 92 L84 72" stroke="#9AA3B3" stroke-width="4.5" stroke-linecap="round"/><circle cx="85" cy="70" r="5" fill="none" stroke="#9AA3B3" stroke-width="4"/>`},
  trident: {z:"front", s:`<path d="M84 97 L84 50" stroke="#FFC43D" stroke-width="3"/><path d="M76 58 L76 48 M84 56 L84 42 M92 58 L92 48 M76 56 Q84 62 92 56" stroke="#FFC43D" stroke-width="3" fill="none" stroke-linecap="round"/>`},
  heart:   {z:"front", s:`<path d="M80 92 C70 84 70 76 76 76 C79 76 80 79 80 79 C80 79 81 76 84 76 C90 76 90 84 80 92Z" fill="#E0504F" stroke="#A33330" stroke-width="1"/>`},
  fishTail:{z:"tail",  s:`<path d="M68 86 Q82 90 86 76" stroke="#3FAE9D" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M86 76 L96 66 L94 80 L100 84 L86 82Z" fill="#7ED6C8" stroke="#3FAE9D" stroke-width="1.2"/>`},
  sparkles:{z:"fx",    s:`<path d="M86 20 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill="#FFD84D"/><path d="M13 62 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5Z" fill="#FFD84D"/>`},
};

// ===== аксессуары версии 2.1 =====
(function(){
  const ring = (n, cx, cy, rx, ry, a0, a1, f) => { let s=""; for (let i=0;i<n;i++){ const a = a0 + (a1-a0)*i/(n-1||1); s += f(cx+Math.cos(a)*rx, cy+Math.sin(a)*ry, a, i); } return s; };
  const star = (cx, cy, r, fill, stroke) => { let p=""; for (let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; p+=(i?"L":"M")+(cx+Math.cos(a)*rr).toFixed(1)+" "+(cy+Math.sin(a)*rr).toFixed(1)+" "; } return `<path d="${p}Z" fill="${fill}" ${stroke?`stroke="${stroke}" stroke-width="1"`:""}/>`; };
  Object.assign(ACC, {
    // --- Дом ---
    yarn:      {z:"front", s:`<path d="M72 90 Q62 97 55 92" stroke="#E86A8A" stroke-width="1.6" fill="none"/><circle cx="80" cy="88" r="8.5" fill="#E86A8A" stroke="#B8445F" stroke-width="1.2"/><path d="M73 85 Q80 80 87 86 M73 91 Q80 86 87 92 M76 81 Q83 88 78 96" stroke="#B8445F" stroke-width="1" fill="none"/>`},
    nightcap:  {z:"head",  s:`<path d="M27 23 Q34 -1 60 2 Q80 5 90 30 Q76 14 72 22Z" fill="#7FA7E0" stroke="#4E78B8" stroke-width="1.2"/><path d="M40 9 Q46 12 44 20 M56 5 Q62 10 60 20 M70 9 Q76 14 74 22" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/><ellipse cx="50" cy="22" rx="24" ry="4.5" fill="#fff" stroke="#DCE3EE" stroke-width="1"/><circle cx="90" cy="31" r="4.5" fill="#fff"/><text x="80" y="14" font-size="10" font-weight="900" fill="#4E78B8" font-family="Arial">z</text><text x="86" y="7" font-size="7" font-weight="900" fill="#4E78B8" font-family="Arial">z</text>`},
    chefHat:   {z:"head",  s:`<circle cx="39" cy="8" r="9" fill="#fff" stroke="#DDD5C8" stroke-width="1"/><circle cx="61" cy="8" r="9" fill="#fff" stroke="#DDD5C8" stroke-width="1"/><circle cx="50" cy="3" r="10" fill="#fff" stroke="#DDD5C8" stroke-width="1"/><rect x="34" y="9" width="32" height="13" rx="2" fill="#fff" stroke="#DDD5C8" stroke-width="1"/>`},
    lantern:   {z:"front", s:`<circle cx="80" cy="79" r="13" fill="#FFE08A" opacity=".35"/><path d="M74 70 Q80 61 86 70" stroke="#6B4428" stroke-width="1.6" fill="none"/><rect x="73" y="70" width="14" height="18" rx="3" fill="#FFE9A8" stroke="#6B4428" stroke-width="1.6"/><circle cx="80" cy="79" r="4" fill="#FFB020"/><path d="M73 74 L87 74 M73 84 L87 84" stroke="#6B4428" stroke-width="1"/>`},
    // --- Сад ---
    clover:    {z:"head",  s:`<g transform="translate(64 15)"><path d="M0 0 L3 10" stroke="#3E8330" stroke-width="1.6"/><circle cx="-4" cy="-3" r="4.2" fill="#5DB04A"/><circle cx="4" cy="-3" r="4.2" fill="#5DB04A"/><circle cx="-4" cy="4" r="4.2" fill="#4E9A38"/><circle cx="4" cy="4" r="4.2" fill="#4E9A38"/></g>`},
    carrotTop: {z:"head",  s:`<ellipse cx="44" cy="10" rx="3.5" ry="10" transform="rotate(-25 44 10)" fill="#5DB04A" stroke="#3E8330" stroke-width="1"/><ellipse cx="50" cy="7" rx="3.5" ry="12" fill="#6DBB4F" stroke="#3E8330" stroke-width="1"/><ellipse cx="56" cy="10" rx="3.5" ry="10" transform="rotate(25 56 10)" fill="#5DB04A" stroke="#3E8330" stroke-width="1"/>`},
    dandelion: {z:"mane",  s:ring(22, 50, 44, 38, 36, 0, Math.PI*2*21/22, (x,y)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#fff" stroke="#E6E1D8" stroke-width=".8"/>`) + ring(12, 50, 44, 43, 41, 0, Math.PI*2*11/12, (x,y,a)=>`<path d="M${(50+Math.cos(a)*34).toFixed(1)} ${(44+Math.sin(a)*32).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#CFC8BC" stroke-width=".8"/>`)},
    ladybug:   {z:"body",  s:`<path d="M49 65 Q26 65 27.5 82 Q32 95 49 95Z" fill="#E0403F" stroke="#9E2020" stroke-width="1.2"/><path d="M51 65 Q74 65 72.5 82 Q68 95 51 95Z" fill="#E0403F" stroke="#9E2020" stroke-width="1.2"/><circle cx="38" cy="74" r="3" fill="#1E1A1D"/><circle cx="36" cy="86" r="2.6" fill="#1E1A1D"/><circle cx="44" cy="81" r="2" fill="#1E1A1D"/><circle cx="62" cy="74" r="3" fill="#1E1A1D"/><circle cx="64" cy="86" r="2.6" fill="#1E1A1D"/><circle cx="56" cy="81" r="2" fill="#1E1A1D"/>`},
    mushroom:  {z:"head",  s:`<ellipse cx="50" cy="23" rx="27" ry="4.5" fill="#F3E6D0" stroke="#C9B79A" stroke-width="1"/><path d="M23 23 Q24 -3 50 -3 Q76 -3 77 23Z" fill="#E0504F" stroke="#A33330" stroke-width="1.2"/><circle cx="38" cy="8" r="3.6" fill="#fff"/><circle cx="54" cy="3" r="3" fill="#fff"/><circle cx="64" cy="13" r="3.4" fill="#fff"/><circle cx="46" cy="16" r="2.4" fill="#fff"/>`},
    snailShell:{z:"back",  s:`<g transform="translate(-50 -2)"><circle cx="74" cy="68" r="17" fill="#E8B062" stroke="#A0662A" stroke-width="1.5"/><path d="M74 68 m0 -3 a3 3 0 1 1 -3 3 a6 6 0 1 1 6 6 a10 10 0 1 1 -10 -10 a13 13 0 1 1 13 13" stroke="#A0662A" stroke-width="1.6" fill="none"/></g>`},
    frogHat:   {z:"head",  s:`<path d="M25 24 Q27 4 50 4 Q73 4 75 24Z" fill="#6DBB4F" stroke="#3E8330" stroke-width="1.2"/><circle cx="37" cy="7" r="7.5" fill="#6DBB4F" stroke="#3E8330" stroke-width="1.2"/><circle cx="63" cy="7" r="7.5" fill="#6DBB4F" stroke="#3E8330" stroke-width="1.2"/><circle cx="37" cy="6" r="4.5" fill="#fff"/><circle cx="63" cy="6" r="4.5" fill="#fff"/><circle cx="38" cy="6.5" r="2.4" fill="#1E1A1D"/><circle cx="62" cy="6.5" r="2.4" fill="#1E1A1D"/><path d="M40 20 Q50 25 60 20" stroke="#3E8330" stroke-width="1.5" fill="none"/>`},
    hedgehog:  {z:"back",  s:ring(15, 50, 58, 34, 34, Math.PI*0.85, Math.PI*2.15, (x,y,a)=>`<path d="M${(50+Math.cos(a-0.12)*26).toFixed(1)} ${(58+Math.sin(a-0.12)*26).toFixed(1)} L${(50+Math.cos(a)*44).toFixed(1)} ${(58+Math.sin(a)*44).toFixed(1)} L${(50+Math.cos(a+0.12)*26).toFixed(1)} ${(58+Math.sin(a+0.12)*26).toFixed(1)}Z" fill="#6E553C" stroke="#4A3826" stroke-width="1"/>`)},
    sunflower: {z:"mane",  s:ring(16, 50, 45, 33, 31, 0, Math.PI*2*15/16, (x,y,a)=>`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="10" transform="rotate(${(a*180/Math.PI+90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#FFD24A" stroke="#E0A526" stroke-width="1"/>`)},
    fairyWings:{z:"back",  s:`<path d="M34 66 Q8 38 14 26 Q26 30 38 58Z" fill="rgba(210,190,255,.75)" stroke="#B59BF0" stroke-width="1.2"/><path d="M66 66 Q92 38 86 26 Q74 30 62 58Z" fill="rgba(210,190,255,.75)" stroke="#B59BF0" stroke-width="1.2"/><path d="M32 72 Q12 72 14 86 Q26 86 36 76Z" fill="rgba(255,200,235,.75)" stroke="#E7A2CF" stroke-width="1.2"/><path d="M68 72 Q88 72 86 86 Q74 86 64 76Z" fill="rgba(255,200,235,.75)" stroke="#E7A2CF" stroke-width="1.2"/>`},
    ladle:     {z:"front", s:`<path d="M84 64 L74 90" stroke="#B9A48A" stroke-width="3" stroke-linecap="round"/><ellipse cx="72" cy="92" rx="7" ry="4.5" fill="#D8CFC0" stroke="#8A7A66" stroke-width="1.2"/>`},
    spaceTricorn:{z:"head", s:`<path d="M18 24 Q50 -4 82 24 Q50 16 18 24Z" fill="#3B3F8C" stroke="#1F2260" stroke-width="1.2"/><path d="M22 22 Q50 12 78 22" stroke="#3CF2E6" stroke-width="1.5" fill="none"/>` + star(50, 12, 5, "#FFD84D", "#E0A526")},
    cyberPatch:{z:"face",  s:`<path d="M26 36 L76 30" stroke="#3CF2E6" stroke-width="1.6"/><rect x="29" y="39" width="18" height="15" rx="4" fill="#1E1A1D" stroke="#3CF2E6" stroke-width="1.5"/><circle cx="38" cy="46.5" r="3" fill="#FF4F7A"/><circle cx="38" cy="46.5" r="5.5" fill="#FF4F7A" opacity=".25"/>`},
    wand:      {z:"front", s:`<path d="M76 94 L88 68" stroke="#8A5BD6" stroke-width="2.6" stroke-linecap="round"/>` + star(89, 64, 7, "#FFD84D", "#E0A526")},
    // --- Город ---
    taxiCap:   {z:"head",  s:`<path d="M28 24 Q30 5 50 5 Q70 5 72 24Z" fill="#FFD24A" stroke="#C99A00" stroke-width="1.2"/><ellipse cx="74" cy="24" rx="14" ry="4" fill="#2B2A33"/>` + [0,1,2,3,4,5,6].map(i=>`<rect x="${30+i*6}" y="17" width="6" height="5" fill="${i%2?"#fff":"#2B2A33"}"/>`).join("")},
    hardHat:   {z:"head",  s:`<ellipse cx="50" cy="23" rx="29" ry="4.5" fill="#E8931F"/><path d="M26 23 Q27 3 50 3 Q73 3 74 23Z" fill="#FFB020" stroke="#C97A10" stroke-width="1.2"/><path d="M50 3 L50 22 M40 5 Q38 14 38 22 M60 5 Q62 14 62 22" stroke="#E8931F" stroke-width="2" fill="none"/>`},
    fireHelmet:{z:"head",  s:`<path d="M20 26 Q26 30 80 26 L78 22 Q74 2 50 2 Q26 2 22 22Z" fill="#D9344F" stroke="#9E1F35" stroke-width="1.2"/><path d="M50 2 L50 22" stroke="#9E1F35" stroke-width="2"/><path d="M44 8 L56 8 L56 18 Q50 22 44 18Z" fill="#FFC43D" stroke="#C99A00" stroke-width="1"/>`},
    beret:     {z:"head",  s:`<ellipse cx="46" cy="16" rx="25" ry="8" transform="rotate(-10 46 16)" fill="#D9344F" stroke="#9E1F35" stroke-width="1.2"/><path d="M46 8 L47 3" stroke="#9E1F35" stroke-width="2.5" stroke-linecap="round"/>`},
    brush:     {z:"front", s:`<path d="M74 96 L88 70" stroke="#8A5A3A" stroke-width="3" stroke-linecap="round"/><path d="M86 72 L92 62 L94 70Z" fill="#3E8ED0" stroke="#2A6AA0" stroke-width="1"/>`},
    camera:    {z:"front", s:`<rect x="60" y="73" width="26" height="17" rx="3" fill="#3A3440" stroke="#1E1A1D" stroke-width="1"/><rect x="64" y="70" width="8" height="4" rx="1" fill="#3A3440"/><circle cx="74" cy="81.5" r="6" fill="#8FB3D9" stroke="#1E1A1D" stroke-width="2"/><circle cx="72.5" cy="80" r="1.8" fill="#fff"/><rect x="80" y="75" width="4" height="3" fill="#FFE08A"/>`},
    headMirror:{z:"head",  s:`<path d="M22 30 Q50 14 78 30" stroke="#5C5F6B" stroke-width="3" fill="none"/><circle cx="50" cy="19" r="7.5" fill="#E4EAF2" stroke="#8A93A3" stroke-width="2"/><circle cx="48" cy="17" r="2" fill="#fff"/>`},
    stethoscope:{z:"neck", s:`<path d="M36 64 Q34 80 46 82 Q58 82 60 72" stroke="#3E8ED0" stroke-width="2.4" fill="none"/><path d="M64 64 Q66 70 60 72" stroke="#3E8ED0" stroke-width="2.4" fill="none"/><circle cx="46" cy="84" r="3.5" fill="#C3CAD6" stroke="#6E747C" stroke-width="1.2"/>`},
    capBack:   {z:"head",  s:`<ellipse cx="25" cy="17" rx="10" ry="3.5" transform="rotate(-25 25 17)" fill="#C0303F"/><path d="M28 24 Q30 5 50 5 Q70 5 72 24Z" fill="#E0504F" stroke="#A33330" stroke-width="1.2"/><circle cx="50" cy="6" r="2.5" fill="#A33330"/>`},
    skateboard:{z:"front", s:`<rect x="20" y="94" width="60" height="5" rx="2.5" fill="#8E6FD8" stroke="#5E43A8" stroke-width="1"/><circle cx="30" cy="100" r="2.5" fill="#FFE08A"/><circle cx="70" cy="100" r="2.5" fill="#FFE08A"/>`},
    pinkScarf: {z:"neck",  s:`<ellipse cx="50" cy="66" rx="22" ry="5.5" fill="#F07AB8"/><path d="M58 66 L66 90 L58 90 L54 68Z" fill="#F07AB8"/><path d="M30 65 L70 65 M59 76 L63 76 M60 83 L64 83" stroke="#fff" stroke-width="1.5" opacity=".7"/>`},
    heroCape:  {z:"back",  s:`<path d="M24 62 Q50 56 76 62 L88 97 L12 97Z" fill="#E0403F" stroke="#9E2020" stroke-width="1.5"/>`},
    heroMask:  {z:"face",  s:`<path fill-rule="evenodd" d="M22 40 Q50 34 78 40 L78 52 Q50 58 22 52Z M31 47 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0Z M55 47 a7 6 0 1 0 14 0 a7 6 0 1 0 -14 0Z" fill="#26306A"/>`},
    starGlasses:{z:"face", s:star(38, 47, 11, "rgba(255,150,210,.35)", "#E0508A") + star(62, 47, 11, "rgba(255,150,210,.35)", "#E0508A") + `<path d="M47 46 L53 46" stroke="#E0508A" stroke-width="2"/>`},
    mic:       {z:"front", s:`<path d="M78 96 L82 78" stroke="#3A3440" stroke-width="4" stroke-linecap="round"/><circle cx="83" cy="73" r="6" fill="#B7B8C2" stroke="#5C5F6B" stroke-width="1.2"/><path d="M79 71 L87 71 M79 75 L87 75" stroke="#5C5F6B" stroke-width="1"/>`},
    // --- Остров ---
    lei:       {z:"neck",  s:ring(9, 50, 64, 21, 6, Math.PI*0.08, Math.PI*0.92, (x,y,a,i)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${["#F58FB0","#FFD24A","#FFFFFF","#F2A04A"][i%4]}" stroke="#D8637F" stroke-width=".6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3" fill="#E0A526"/>`)},
    pineapple: {z:"head",  s:`<path d="M42 10 L38 -4 L46 4 L50 -8 L54 4 L62 -4 L58 10Z" fill="#5DB04A" stroke="#3E8330" stroke-width="1"/><ellipse cx="50" cy="16" rx="15" ry="9" fill="#F2C94C" stroke="#C99A00" stroke-width="1.2"/><path d="M38 12 L46 22 M46 8 L58 22 M56 8 L62 16 M62 12 L54 22 M54 8 L42 22 M44 8 L38 16" stroke="#C99A00" stroke-width="1"/>`},
    claws:     {z:"front", s:`<path d="M24 80 Q10 78 10 66 Q16 70 18 66 Q14 60 20 58 Q26 64 26 74Z" fill="#EF6A4F" stroke="#B0402A" stroke-width="1.2"/><path d="M76 80 Q90 78 90 66 Q84 70 82 66 Q86 60 80 58 Q74 64 74 74Z" fill="#EF6A4F" stroke="#B0402A" stroke-width="1.2"/>`},
    turtleShell:{z:"back", s:`<ellipse cx="50" cy="70" rx="33" ry="22" fill="#5E9A43" stroke="#3E6E2A" stroke-width="1.5"/><path d="M50 50 L42 60 L50 70 L58 60Z M30 62 L42 60 M70 62 L58 60 M24 76 L36 72 L50 70 L64 72 L76 76" stroke="#3E6E2A" stroke-width="1.5" fill="none"/>`},
    diveMask:  {z:"face",  s:`<rect x="25" y="37" width="50" height="20" rx="9" fill="rgba(160,220,255,.45)" stroke="#2E6FB7" stroke-width="3"/><path d="M22 44 L25 44 M75 44 L80 44" stroke="#2B2A33" stroke-width="3"/><path d="M80 44 L84 44 L84 16 Q84 12 88 12" stroke="#FFB020" stroke-width="3" fill="none" stroke-linecap="round"/>`},
    crest:     {z:"head",  s:`<ellipse cx="42" cy="10" rx="4" ry="11" transform="rotate(-25 42 10)" fill="#FFD24A"/><ellipse cx="50" cy="6" rx="4.5" ry="13" fill="#3E8ED0"/><ellipse cx="58" cy="10" rx="4" ry="11" transform="rotate(25 58 10)" fill="#5DB04A"/>`},
    parrotWings:{z:"back", s:`<ellipse cx="27" cy="72" rx="9" ry="17" transform="rotate(25 27 72)" fill="#3E8ED0" stroke="#2A6AA0" stroke-width="1.2"/><ellipse cx="73" cy="72" rx="9" ry="17" transform="rotate(-25 73 72)" fill="#3E8ED0" stroke="#2A6AA0" stroke-width="1.2"/><ellipse cx="25" cy="80" rx="5" ry="10" transform="rotate(25 25 80)" fill="#FFD24A"/><ellipse cx="75" cy="80" rx="5" ry="10" transform="rotate(-25 75 80)" fill="#FFD24A"/>`},
    dorsalFin: {z:"back",  s:`<path d="M42 24 Q58 -8 76 16 Q62 12 56 26Z" fill="#6E93BE" stroke="#4A6E99" stroke-width="1.2"/>`},
    pearlTop:  {z:"head",  s:`<path d="M34 22 Q36 4 50 2 Q64 4 66 22Z" fill="#F7B7C3" stroke="#E0798F" stroke-width="1.2"/><path d="M40 21 L44 6 M50 21 L50 3 M60 21 L56 6" stroke="#E0798F" stroke-width="1"/><circle cx="50" cy="18" r="6.5" fill="#FFFDF8" stroke="#D6CFEE" stroke-width="1"/><circle cx="48" cy="16" r="2" fill="#fff"/>`},
    // --- Космос ---
    dish:      {z:"head",  s:`<path d="M50 20 L54 8" stroke="#8A93A3" stroke-width="2.5"/><path d="M40 10 Q52 -4 68 6 Q58 16 40 10Z" fill="#E4EAF2" stroke="#8A93A3" stroke-width="1.5"/><path d="M53 8 L60 0" stroke="#8A93A3" stroke-width="1.5"/><circle cx="60" cy="0" r="2.5" fill="#E0504F"/>`},
    rocket:    {z:"back",  s:`<g transform="translate(-66 2) rotate(-18 82 50)"><path d="M82 94 Q92 106 82 112 Q72 106 82 94Z" fill="#FFB020"/><path d="M82 98 Q87 104 82 108 Q77 104 82 98Z" fill="#FFE08A"/><path d="M72 92 L72 40 Q82 16 92 40 L92 92Z" fill="#F4F4F8" stroke="#8A93A3" stroke-width="1.5"/><path d="M72 30 Q82 10 92 30 Q82 22 72 30Z" fill="#E0504F"/><circle cx="82" cy="52" r="6" fill="#8FD0F5" stroke="#8A93A3" stroke-width="1.5"/><path d="M72 78 L62 94 L72 92Z M92 78 L102 94 L92 92Z" fill="#E0504F"/></g>`},
    ufo:       {z:"head",  s:`<ellipse cx="50" cy="8" rx="12" ry="9" fill="rgba(120,240,230,.55)" stroke="#3CF2E6" stroke-width="1.2"/><ellipse cx="50" cy="16" rx="27" ry="7" fill="#B7B8C2" stroke="#6E747C" stroke-width="1.2"/><circle cx="34" cy="17" r="2" fill="#FFE08A"/><circle cx="50" cy="19" r="2" fill="#FF7AD9"/><circle cx="66" cy="17" r="2" fill="#FFE08A"/>`},
    cometTail: {z:"tail",  s:`<path d="M68 86 Q84 82 98 56" stroke="#FF9A3C" stroke-width="12" fill="none" stroke-linecap="round" opacity=".85"/><path d="M68 86 Q84 82 97 58" stroke="#FFD24A" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M70 85 Q84 81 95 61" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`},
    wizardHat: {z:"head",  s:`<ellipse cx="50" cy="22" rx="30" ry="5.5" fill="#2E2466"/><path d="M34 22 L54 -12 L66 22Z" fill="#3E2A7A" stroke="#2E2466" stroke-width="1"/>` + star(52, 6, 4, "#FFD84D") + star(58, 16, 3, "#FFD84D") + star(45, 15, 2.5, "#FFD84D")},
    telescope: {z:"front", s:`<path d="M70 98 L78 84 L86 98" stroke="#6B4428" stroke-width="2" fill="none"/><path d="M62 86 L94 66" stroke="#C99A00" stroke-width="7" stroke-linecap="round"/><path d="M88 70 L96 65" stroke="#8A5A3A" stroke-width="9" stroke-linecap="round"/>`},
    cyborg:    {z:"face",  s:`<path d="M50 20 Q24 20 21 44 Q21 62 34 70 L50 62Z" fill="#8A93A3" stroke="#5C5F6B" stroke-width="1.5"/><circle cx="28" cy="36" r="1.6" fill="#5C5F6B"/><circle cx="30" cy="60" r="1.6" fill="#5C5F6B"/><path d="M50 22 L50 62" stroke="#5C5F6B" stroke-width="1.5"/><circle cx="38" cy="47" r="10" fill="#E0504F" opacity=".3"/><circle cx="38" cy="47" r="6" fill="#E0504F" stroke="#9E2020" stroke-width="1.5"/><circle cx="36.5" cy="45.5" r="1.8" fill="#fff"/>`},
    ring:      {z:"back",  s:`<ellipse cx="50" cy="70" rx="46" ry="11" transform="rotate(-12 50 70)" fill="none" stroke="#E8C98A" stroke-width="5"/><ellipse cx="50" cy="70" rx="46" ry="11" transform="rotate(-12 50 70)" fill="none" stroke="#C09A52" stroke-width="1.2"/>`},
    ringFront: {z:"front", s:`<path d="M5.3 78.6 A46 11 -12 0 0 94.7 61.4" transform="" fill="none" stroke="#E8C98A" stroke-width="5"/><path d="M5.3 78.6 A46 11 -12 0 0 94.7 61.4" fill="none" stroke="#C09A52" stroke-width="1.2"/>`},
    sunRays:   {z:"mane",  s:ring(14, 50, 45, 30, 28, 0, Math.PI*2*13/14, (x,y,a)=>`<path d="M${(50+Math.cos(a-0.16)*30).toFixed(1)} ${(45+Math.sin(a-0.16)*28).toFixed(1)} L${(50+Math.cos(a)*48).toFixed(1)} ${(45+Math.sin(a)*46).toFixed(1)} L${(50+Math.cos(a+0.16)*30).toFixed(1)} ${(45+Math.sin(a+0.16)*28).toFixed(1)}Z" fill="#FFB020" stroke="#E8931F" stroke-width="1"/>`)},
  });
})();

// --- косметика игрока (рисуется поверх всего) ---
const COS_ART = {
  beanie:   `<path d="M27 26 Q28 2 50 2 Q72 2 73 26Z" fill="#E06A6A" stroke="#A84444" stroke-width="1.2"/><path d="M28 22 L72 22 L73 27 L27 27Z" fill="#F4D3AE"/><path d="M38 6 L38 21 M50 2 L50 21 M62 6 L62 21" stroke="#C45252" stroke-width="1.5"/><circle cx="50" cy="1" r="5" fill="#fff"/>`,
  specs:    ACC.glasses.s,
  party:    `<path d="M40 21 L50 -6 L60 21Z" fill="#6FD3F5" stroke="#2A8CC0" stroke-width="1.2"/><path d="M44 12 L56 12 M42 17 L58 17" stroke="#FF7AB0" stroke-width="2.5"/><circle cx="50" cy="-6" r="4" fill="#FFD24A"/>`,
  cosCrown: ACC.crown.s,
  tricorn:  ACC.pirateHat.s,
  spaceHelm:ACC.helmet.s,
  horns:    `<path d="M34 20 Q28 8 36 4 Q34 12 40 18Z M66 20 Q72 8 64 4 Q66 12 60 18Z" fill="#E0504F" stroke="#A33330" stroke-width="1"/>`,
  golden:   `<path d="M20 30 Q30 20 40 22" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7" fill="none"/>` + ACC.sparkles.s,
};

function starDots(seed, area){
  let s = "", r = seed;
  const rnd = ()=>{ r = (r*9301+49297)%233280; return r/233280; };
  for (let i=0;i<14;i++){
    const [cx,cy,rx,ry] = area[i%2];
    const a = rnd()*Math.PI*2, d = Math.sqrt(rnd());
    s += `<circle cx="${(cx+Math.cos(a)*rx*d).toFixed(1)}" cy="${(cy+Math.sin(a)*ry*d).toFixed(1)}" r="${(0.6+rnd()*1.2).toFixed(1)}" fill="${i%3?"#fff":"#FFE08A"}" opacity=".9"/>`;
  }
  return s;
}

/* ---------- черты котика (v2.2): у каждого свой набор ----------
   t: "голова уши глаза рот поза хвост отметина"
   голова: o овал, r круглая, w широкая, t высокая, c щёчки
   уши:    p острые, b большие, s маленькие, r круглые, w в стороны, f вислые, l с кисточками, c загнутые
   глаза:  o круглые, B большие, h довольные ^^, z сонные, k подмигивает, s кошачьи, d бусинки, l прищур, * звёздочки
   рот:    w мур, o открытый, c «о», s улыбка, f клычок, t язычок
   поза:   s сидит, c пухлый, m стройный, l буханочка, p грушка
   хвост:  c дугой, u вверх, q колечком, s короткий, d по земле, f пушистый, w обвивает лапки, t с кончиком
   отметина: - нет, b полоска на лбу, m мордочка, k маска, a «М» на лбу, e бровки, p пятно у глаза, n подбородок, r веснушки, i грудка */
function hexMix(a, b, k){
  const p = h => { h = h.replace("#",""); if (h.length === 3) h = h.split("").map(x=>x+x).join(""); return [0,2,4].map(i=>parseInt(h.substr(i,2),16)); };
  try{ const A = p(a), B = p(b); return "#" + A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,"0")).join(""); }catch(e){ return b; }
}
function catTraits(c){
  const d = (c.t || "o p o w s c -").split(" ");
  const T = {head:d[0], ear:d[1], eye:d[2], mouth:d[3], pose:d[4], tail:d[5], mark:d[6]||"-"};
  if (c.round && !c.t) T.head = "r";
  if (c.fold) T.ear = "f";
  if (c.tufts) T.ear = "l";
  if (c.sphinx) T.ear = "b";
  if (c.persian){ T.head = "r"; T.ear = "s"; }
  if (c.sleepy) T.eye = "z";
  return T;
}
const svgCache = {};
// Главная функция рисования. gid — номер кота в общем альбоме.
const GRADS = {
  rbw:`<linearGradient id="rbw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD1E8"/><stop offset=".35" stop-color="#FFF1B8"/><stop offset=".65" stop-color="#C8F2DC"/><stop offset="1" stop-color="#C9D8FF"/></linearGradient>`,
  neb:`<linearGradient id="neb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8AD8"/><stop offset=".5" stop-color="#9A6BEA"/><stop offset="1" stop-color="#4A7BE0"/></linearGradient>`,
  prl:`<linearGradient id="prl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#FBE8F4"/><stop offset=".75" stop-color="#E4EEFF"/><stop offset="1" stop-color="#F4F1FF"/></linearGradient>`,
};
function catSVG(gid, cosmetic){
  const key = gid + "|" + (cosmetic||"");
  if (svgCache[key]) return svgCache[key];
  const c = ALBUM[gid];
  const acc = (c.acc||[]).map(a=>ACC[a]).filter(Boolean);
  const layer = z => acc.filter(a=>a.z===z).map(a=>a.s).join("");
  const main = c.tux ? c.dark : c.body;
  const out = c.neon ? `stroke="${c.neon}" stroke-width="2"` : c.outline ? 'stroke="#D8CCBF" stroke-width="2"' : OUTLINE;
  const inner = c.inner || (c.sphinx ? "#E89A90" : "#F7A8B8");
  const grad = c.rainbow ? "rbw" : c.nebula ? "neb" : c.pearly ? "prl" : "";
  const fill = grad ? `url(#${grad})` : main;
  const earC = c.siam ? c.dark : grad ? (c.rainbow ? "#FFD1E8" : c.nebula ? "#FF8AD8" : "#FBE8F4") : main;
  const earC2 = grad ? (c.rainbow ? "#C9D8FF" : c.nebula ? "#4A7BE0" : "#E4EEFF") : earC;
  const limb = c.siam ? c.dark : c.socks ? "#FFFFFF" : grad ? (c.rainbow ? "#FFF1B8" : c.nebula ? "#9A6BEA" : "#FBE8F4") : main;
  const T = catTraits(c);
  const HEAD = {o:[30,28,46], r:[34,29,46], w:[36,25,48], t:[27,31,45], c:[30,27,46]}[T.head] || [30,28,46];
  const headRx = HEAD[0], headRy = HEAD[1], hcy = HEAD[2];
  const light = hexMix(main.startsWith("#") ? main : "#FFFFFF", "#FFFFFF", 0.62);
  const deep = c.dark;
  const noLimbs = c.octo || c.jelly || c.ghost;
  let style = "";
  if (c.neon) style += `filter:drop-shadow(0 0 3px ${c.neon});`;
  if (c.ghost || c.jelly) style += "opacity:.86;";
  if (cosmetic === "golden") style += "filter:sepia(.55) saturate(2.2) hue-rotate(-8deg) brightness(1.08);";
  let s = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="${style}">`;
  if (grad) s += `<defs>${GRADS[grad]}</defs>`;
  s += `<ellipse cx="50" cy="96" rx="26" ry="4" fill="rgba(40,30,25,.14)"/>`;
  s += layer("back");
  // хвост
  const tailCol = grad ? earC2 : (c.siam ? c.dark : main);
  const TAILS = {c:"M70 84 C88 82 92 66 86 56", u:"M70 86 C86 84 84 60 84 46 C84 38 92 35 95 42", q:"M70 86 C92 88 96 64 84 62 C75 61 77 75 85 73",
                 s:"M71 86 C77 86 80 83 80 79", d:"M68 91 C80 97 92 95 97 86", f:"M70 84 C90 82 94 64 86 52", t:"M70 84 C90 84 92 62 82 50", w:"M70 88 C84 98 56 102 34 97"};
  const tailW = T.tail === "f" || c.tufts || c.fuzzy || c.persian ? 12 : c.sphinx ? 6 : T.tail === "s" ? 11 : 8;
  const tailSvg = `<path class="tail" d="${TAILS[T.tail]||TAILS.c}" fill="none" stroke="${tailCol}" stroke-width="${tailW}" stroke-linecap="round"/>` +
    (T.tail === "t" || T.tail === "f" ? `<path d="${TAILS[T.tail]}" pathLength="100" stroke-dasharray="0 72 28" fill="none" stroke="${T.tail==="f" ? light : deep}" stroke-width="${tailW}" stroke-linecap="round"/>` : "");
  if (acc.some(a=>a.z==="tail")) s += layer("tail");
  else if (!c.octo && !c.jelly && T.tail !== "w") s += tailSvg;
  // тело
  if (c.ghost) s += `<path d="M27 80 Q27 64 50 64 Q73 64 73 80 L73 94 L66 89 L58 95 L50 89 L42 95 L34 89 L27 94Z" fill="${fill}" ${out}/>`;
  else if (c.jelly){
    s += `<path d="M34 86 Q30 94 34 99 M42 88 Q40 96 44 100 M50 88 Q52 96 48 100 M58 88 Q56 96 60 100 M66 86 Q70 94 66 99" stroke="${c.dark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M27 82 Q27 64 50 64 Q73 64 73 82 Q62 90 50 88 Q38 90 27 82Z" fill="${fill}" ${out}/>`;
  }
  else if (T.pose === "c") s += `<ellipse cx="50" cy="80" rx="27" ry="17" fill="${fill}" ${out}/>`;
  else if (T.pose === "m") s += `<ellipse cx="50" cy="79" rx="18.5" ry="17" fill="${fill}" ${out}/>`;
  else if (T.pose === "l") s += `<rect x="23" y="66" width="54" height="29" rx="14.5" fill="${fill}" ${out}/>`;
  else if (T.pose === "p") s += `<path d="M37 65 Q50 61 63 65 Q77 79 73 91 Q50 99 27 91 Q23 79 37 65Z" fill="${fill}" ${out}/>`;
  else s += `<ellipse cx="50" cy="80" rx="23" ry="16" fill="${fill}" ${out}/>`;
  if (T.mark === "i" && !noLimbs) s += `<ellipse cx="50" cy="77" rx="10" ry="10" fill="${light}"/>`;
  if (c.tux) s += `<ellipse cx="50" cy="82" rx="12" ry="12" fill="${c.body}"/>`;
  if (c.socks) s += `<ellipse cx="50" cy="75" rx="10" ry="9" fill="#FFFFFF"/>`;
  if (c.tufts) s += `<path d="M34 64 Q50 78 66 64 Q62 74 50 76 Q38 74 34 64Z" fill="#F3E3CF"/>`;
  if (c.persian) s += `<path d="M27 66 Q32 80 50 80 Q68 80 73 66" stroke="${c.body}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M29 68 Q34 78 50 78 Q66 78 71 68" stroke="${c.dark}" stroke-width="1" fill="none" opacity=".5"/>`;
  if (c.bee) s += `<path d="M30 76 Q50 71 70 76 M28 84 Q50 79 72 84" stroke="${c.dark}" stroke-width="4.5" fill="none"/>`;
  if (c.calico) s += `<ellipse cx="38" cy="78" rx="8" ry="6" fill="#F2A04A"/><ellipse cx="62" cy="85" rx="7" ry="5" fill="#3A3440"/>`;
  if (c.bengal) s += [[38,76],[48,84],[60,76],[66,86],[34,86],[54,72]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="${c.body}" stroke="${c.dark}" stroke-width="1.8"/>`).join("");
  if (c.paint) s += `<circle cx="38" cy="78" r="3" fill="#3E8ED0"/><circle cx="60" cy="84" r="2.6" fill="#E0504F"/><circle cx="56" cy="73" r="2" fill="#FFD24A"/><circle cx="44" cy="88" r="2" fill="#5DB04A"/>`;
  if (c.rocky) s += `<path d="M34 74 L40 70 L44 76 L38 80Z M56 82 L64 78 L66 86 L58 88Z" fill="${c.dark}" opacity=".45"/><path d="M46 70 L50 78 L48 86" stroke="${c.dark}" stroke-width="1.2" fill="none" opacity=".6"/>`;
  if (c.hearts) s += `<path d="M40 82 c-3 -3 -3 -6 0 -6 c1.5 0 2 1.5 2 1.5 c0 0 .5 -1.5 2 -1.5 c3 0 3 3 0 6 l-2 2Z M58 78 c-3 -3 -3 -6 0 -6 c1.5 0 2 1.5 2 1.5 c0 0 .5 -1.5 2 -1.5 c3 0 3 3 0 6 l-2 2Z" fill="#E0504F"/>`;
  if (c.spots) s += `<circle cx="40" cy="78" r="3.5" fill="${c.spots}"/><circle cx="60" cy="84" r="3" fill="${c.spots}"/><circle cx="55" cy="74" r="2.2" fill="${c.spots}"/>`;
  if (c.starry) s += starDots(7, [[50,80,20,12],[50,80,20,12]]);
  if (c.cactus) s += `<path d="M40 70 L40 92 M50 66 L50 95 M60 70 L60 92" stroke="${c.dark}" stroke-width="1.5" opacity=".6"/>`;
  if (c.robot) s += `<rect x="41" y="74" width="18" height="12" rx="2" fill="${c.dark}" opacity=".5"/><circle cx="46" cy="80" r="1.8" fill="#3CF2E6"/><circle cx="54" cy="80" r="1.8" fill="#E0504F"/>`;
  if (c.icing) s += `<path d="M30 74 q3 -3 6 0 t6 0 t6 0 t6 0 t6 0 t6 0" stroke="#fff" stroke-width="2" fill="none"/>`;
  if (c.pearly) s += `<path d="M34 74 Q38 68 46 67" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".9"/>`;
  // лапки
  if (c.octo){
    s += `<path d="M32 88 Q24 96 30 99 Q34 100 34 96 M42 90 Q38 100 44 100 M58 90 Q62 100 56 100 M68 88 Q76 96 70 99 Q66 100 66 96" stroke="${main}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="31" cy="97" r="1" fill="${c.dark}"/><circle cx="69" cy="97" r="1" fill="${c.dark}"/>`;
  } else if (!c.ghost && !c.jelly){
    const PAW = {c:[36,64,7.5,4.8], m:[42,58,6,4.2], l:[37,63,5.5,3.4], p:[39,61,7,4.5]}[T.pose] || [40,60,7,4.5];
    const py = T.pose === "l" ? 94 : 93;
    s += `<ellipse cx="${PAW[0]}" cy="${py}" rx="${PAW[2]}" ry="${PAW[3]}" fill="${limb}" ${out}/><ellipse cx="${PAW[1]}" cy="${py}" rx="${PAW[2]}" ry="${PAW[3]}" fill="${limb}" ${out}/>`;
    if (T.tail === "w" && !acc.some(a=>a.z==="tail")) s += tailSvg;
  }
  s += layer("body");
  s += layer("mane");
  // уши
  if (c.robot) s += `<path d="M24 32 L26 10 L44 22Z" fill="${c.dark}" ${out}/><path d="M76 32 L74 10 L56 22Z" fill="${c.dark}" ${out}/>`;
  else if (c.fold) s += `<path d="M24 30 Q24 16 40 18 Q36 26 24 30Z" fill="${earC}" ${out}/><path d="M76 30 Q76 16 60 18 Q64 26 76 30Z" fill="${earC}" ${out}/>`;
  else if (c.sphinx){
    s += `<path d="M20 36 L20 0 L46 20Z" fill="${earC}" ${out}/><path d="M80 36 L80 0 L54 20Z" fill="${earC}" ${out}/>`;
    s += `<path d="M26 28 L25 9 L40 21Z" fill="${inner}"/><path d="M74 28 L75 9 L60 21Z" fill="${inner}"/>`;
  } else {
    const EARS = {
      p:["M23 34 L27 8 L46 22Z","M28 28 L30 15 L40 23Z"],
      b:["M20 36 L20 0 L46 20Z","M26 28 L25 9 L40 21Z"],
      s:["M26 31 L31 15 L44 23Z","M30 28 L33 20 L40 24Z"],
      r:["M22 34 Q18 8 34 9 Q42 11 46 22Z","M28 29 Q26 16 34 16 Q39 17 41 23Z"],
      w:["M21 40 L10 16 L40 24Z","M23 35 L16 22 L34 26Z"],
      l:["M24 32 L26 2 L46 22Z","M29 27 L29 10 L40 22Z"],
      c:["M25 32 Q19 4 32 3 Q41 5 45 22Z","M30 28 Q26 10 32 9 Q37 11 40 23Z"],
    };
    const E = EARS[T.ear] || EARS.p, mir = `transform="matrix(-1 0 0 1 100 0)"`;
    s += `<path d="${E[0]}" fill="${earC}" ${out}/><path d="${E[0]}" ${mir} fill="${earC2}" ${out}/>`;
    s += `<path d="${E[1]}" fill="${inner}"/><path d="${E[1]}" ${mir} fill="${inner}"/>`;
    if (T.ear === "l" && !c.tufts) s += `<path d="M26 3 L24 -3 M26 3 L29 -2 M74 3 L76 -3 M74 3 L71 -2" stroke="${deep}" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (c.tufts) s += `<path d="M26 3 L24 -4 M26 3 L29 -3 M74 3 L76 -4 M74 3 L71 -3" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round"/>`;
  // голова
  if (T.head === "c") s += `<path d="M50 19 C69 19 80 30 80 43 C80 49 86 55 82 61 C78 69 66 73 50 73 C34 73 22 69 18 61 C14 55 20 49 20 43 C20 30 31 19 50 19Z" fill="${fill}" ${out}/>`;
  else s += `<ellipse cx="50" cy="${hcy}" rx="${headRx}" ry="${headRy}" fill="${fill}" ${out}/>`;
  if (c.fuzzy || c.persian) { let f=""; for (let i=0;i<16;i++){ const a=i/16*Math.PI*2, x=50+Math.cos(a)*headRx, y=hcy+Math.sin(a)*headRy; f+=`M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a)*4).toFixed(1)} ${(Math.sin(a)*4).toFixed(1)} `; } s += `<path d="${f}" stroke="${main}" stroke-width="2.5" stroke-linecap="round"/>`; }
  if (c.cactus) s += `<path d="M22 40 l-5 -2 M22 52 l-5 1 M78 40 l5 -2 M78 52 l5 1 M36 22 l-2 -5 M64 22 l2 -5 M26 78 l-5 0 M74 78 l5 0" stroke="#F3F7E8" stroke-width="1.6" stroke-linecap="round"/>`;
  if (c.tufts) s += `<path d="M18 52 L12 56 L20 58 M82 52 L88 56 L80 58" stroke="${main}" stroke-width="5" stroke-linecap="round"/>`;
  if (c.stripes){
    s += `<path d="M50 20 L50 30 M42 21 L44 29 M58 21 L56 29" stroke="${c.dark}" stroke-width="3.2" stroke-linecap="round"/>`;
    if (c.stripes>1) s += `<path d="M22 44 L30 46 M22 51 L30 51 M78 44 L70 46 M78 51 L70 51 M38 72 L40 80 M50 70 L50 79 M62 72 L60 80" stroke="${c.dark}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  if (c.sphinx) s += `<path d="M40 24 Q50 20 60 24 M42 28.5 Q50 25.5 58 28.5 M44 33 Q50 31 56 33" stroke="${c.dark}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  if (c.calico) s += `<path d="M24 38 Q26 22 44 20 Q46 32 34 40Z" fill="#F2A04A"/><path d="M58 20 Q74 22 77 38 Q66 36 60 30Z" fill="#3A3440"/>`;
  if (c.bengal) s += [[34,32],[66,32],[28,44],[72,44],[50,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${c.body}" stroke="${c.dark}" stroke-width="1.6"/>`).join("");
  if (c.bee) s += `<path d="M36 22 Q50 18 64 22 M44 20 L44 28 M56 20 L56 28" stroke="${c.dark}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  if (c.tux) s += `<ellipse cx="50" cy="58" rx="14" ry="10" fill="${c.body}"/>`;
  if (c.socks) s += `<ellipse cx="50" cy="58" rx="13" ry="8" fill="#FFFFFF"/><path d="M50 20 L50 40" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>`;
  if (c.siam) s += `<ellipse cx="50" cy="56" rx="15" ry="12" fill="${c.dark}" opacity=".85"/>`;
  if (c.spots) s += `<circle cx="34" cy="34" r="3.5" fill="${c.spots}"/><circle cx="66" cy="32" r="2.8" fill="${c.spots}"/>`;
  if (c.craters) s += `<circle cx="32" cy="34" r="4" fill="${c.dark}" opacity=".5"/><circle cx="68" cy="60" r="3" fill="${c.dark}" opacity=".5"/><circle cx="62" cy="28" r="2.2" fill="${c.dark}" opacity=".5"/><circle cx="42" cy="82" r="3.5" fill="${c.dark}" opacity=".45"/>`;
  if (c.rocky) s += `<path d="M24 46 L30 40 L34 48Z M66 24 L74 30 L68 34Z" fill="${c.dark}" opacity=".45"/>`;
  if (c.starry) s += starDots(3, [[50,40,24,18],[50,40,24,18]]);
  if (c.swirl) s += `<path d="M50 44 m0 -3 a3 3 0 1 1 -3 3 a6 6 0 1 1 6 6 a10 10 0 1 1 -10 -10 a15 15 0 1 1 15 15" stroke="#B05BE0" stroke-width="1.8" fill="none" opacity=".75"/>`;
  if (c.robot) s += `<path d="M22 40 L30 40 M70 40 L78 40" stroke="${c.dark}" stroke-width="2"/><circle cx="26" cy="54" r="1.8" fill="${c.dark}"/><circle cx="74" cy="54" r="1.8" fill="${c.dark}"/>`;
  if (c.icing) s += `<path d="M24 32 q3 -4 6 0 t6 0 M64 32 q3 -4 6 0 t6 0" stroke="#fff" stroke-width="2" fill="none"/><circle cx="44" cy="80" r="2" fill="#E0504F"/><circle cx="56" cy="80" r="2" fill="#6FD3F5"/>`;
  if (c.hearts) s += `<path d="M31 32 c-3 -3 -3 -6 0 -6 c1.5 0 2 1.5 2 1.5 c0 0 .5 -1.5 2 -1.5 c3 0 3 3 0 6 l-2 2Z" fill="#E0504F"/>`;
  if (c.gold || c.pearly) s += `<path d="M28 34 Q34 24 44 22" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/>`;
  if (c.gold) s += `<path d="M34 74 Q38 68 46 67" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".6"/>`;
  if (c.jelly) s += `<ellipse cx="38" cy="30" rx="6" ry="3" fill="#fff" opacity=".5"/>`;
  // отметины
  const M = T.mark;
  if (M === "b") s += `<path d="M50 20 L50 44" stroke="${light}" stroke-width="7" stroke-linecap="round"/><ellipse cx="50" cy="57" rx="9" ry="6" fill="${light}"/>`;
  if (M === "m") s += `<ellipse cx="50" cy="58" rx="12.5" ry="8" fill="${light}"/>`;
  if (M === "n") s += `<ellipse cx="50" cy="66" rx="9" ry="5" fill="${light}"/>`;
  if (M === "k") s += `<ellipse cx="38" cy="47" rx="11.5" ry="9.5" fill="${deep}" opacity=".55"/><ellipse cx="62" cy="47" rx="11.5" ry="9.5" fill="${deep}" opacity=".55"/>`;
  if (M === "p") s += `<ellipse cx="62" cy="45" rx="12" ry="11" fill="${deep}" opacity=".8"/>`;
  if (M === "a") s += `<path d="M40 31 L44 24 L50 31 L56 24 L60 31" stroke="${deep}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (M === "e") s += `<ellipse cx="36" cy="35" rx="3.4" ry="2.2" fill="${deep}"/><ellipse cx="64" cy="35" rx="3.4" ry="2.2" fill="${deep}"/>`;
  if (M === "r") s += [[28,58],[32,61],[26,62],[72,58],[68,61],[74,62]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.1" fill="${deep}" opacity=".7"/>`).join("");
  // щёчки
  s += `<ellipse cx="31" cy="58" rx="5" ry="3" fill="#FF9DB0" opacity="${c.darkFace?.3:.45}"/><ellipse cx="69" cy="58" rx="5" ry="3" fill="#FF9DB0" opacity="${c.darkFace?.3:.45}"/>`;
  // глаза
  s += `<g class="eyes" style="animation-delay:${(gid*0.7)%4}s">`;
  for (const x of [38,62]){
    if (c.robot){ s += `<rect x="${x-7}" y="42" width="14" height="10" rx="3" fill="#1E1A1D"/><rect x="${x-5}" y="44" width="10" height="6" rx="2" fill="${c.eye}"/>`; continue; }
    const lid = c.darkFace ? "#E8DCEF" : "#3A2A20";
    const ev = T.eye === "k" ? (x === 62 ? "h" : "o") : T.eye;
    if (ev === "z"){ s += `<path d="M${x-7} 47 Q${x} 53 ${x+7} 47" stroke="${lid}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; continue; }
    if (ev === "h"){ s += `<path d="M${x-6.5} 50 Q${x} 41 ${x+6.5} 50" stroke="${lid}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`; continue; }
    if (ev === "d"){ s += `<circle cx="${x}" cy="47" r="5" fill="${c.eye}"/><circle cx="${x}" cy="47.5" r="3.4" fill="#1E1A1D"/><circle cx="${x-1.4}" cy="45.8" r="1.3" fill="#fff"/>`; continue; }
    if (ev === "s"){ s += `<path d="M${x-8} 47 Q${x} 37.5 ${x+8} 47 Q${x} 56.5 ${x-8} 47Z" fill="${c.eye}"/><ellipse cx="${x}" cy="47" rx="1.9" ry="6" fill="#1E1A1D"/><circle cx="${x-3}" cy="44.5" r="1.6" fill="#fff"/>`; continue; }
    if (ev === "B"){ s += `<ellipse cx="${x}" cy="47" rx="8.5" ry="9.5" fill="${c.eye}"/><ellipse cx="${x}" cy="48" rx="5.2" ry="6.8" fill="#1E1A1D"/><circle cx="${x-2.6}" cy="44" r="3.1" fill="#fff"/><circle cx="${x+2.6}" cy="51" r="1.5" fill="#fff"/>`; continue; }
    s += `<ellipse cx="${x}" cy="47" rx="7" ry="8" fill="${c.eye}"/><ellipse cx="${x}" cy="48" rx="4" ry="5.5" fill="#1E1A1D"/>`;
    if (ev === "*") s += `<path d="M${x-2} 42.2 l1 2.3 2.3 1 -2.3 1 -1 2.3 -1 -2.3 -2.3 -1 2.3 -1Z" fill="#fff"/><circle cx="${x+2.2}" cy="50.5" r="1.1" fill="#fff"/>`;
    else s += `<circle cx="${x-2.2}" cy="44.5" r="2.4" fill="#fff"/><circle cx="${x+2}" cy="50" r="1.1" fill="#fff"/>`;
    if (ev === "l") s += `<path d="M${x-8.5} 45 Q${x} 36 ${x+8.5} 45 L${x+8.5} 38 L${x-8.5} 38Z" fill="${main.startsWith("#")?main:earC}"/><path d="M${x-8} 45 Q${x} 41.5 ${x+8} 45" stroke="${lid}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  s += `</g>`;
  // нос, рот, усы
  const ny = c.persian ? 53 : 55;
  s += `<path d="M47 ${ny} L53 ${ny} L50 ${ny+3.5}Z" fill="#F07A93"/>`;
  const mc = c.darkFace ? '#CFC3D6' : '#6B5448';
  const MO = T.mouth;
  if (MO === "o") s += `<path d="M44 ${ny+5} Q50 ${ny+13} 56 ${ny+5} Q50 ${ny+7} 44 ${ny+5}Z" fill="#8A3F4A"/><ellipse cx="50" cy="${ny+9}" rx="3" ry="2" fill="#F58FA6"/>`;
  else if (MO === "c") s += `<ellipse cx="50" cy="${ny+7}" rx="2.4" ry="2.8" fill="#8A3F4A"/>`;
  else if (MO === "s") s += `<path d="M42 ${ny+4} Q50 ${ny+10} 58 ${ny+4}" fill="none" stroke="${mc}" stroke-width="1.6" stroke-linecap="round"/>`;
  else {
    s += `<path d="M50 ${ny+3.5} Q47 ${ny+7} 44 ${ny+5} M50 ${ny+3.5} Q53 ${ny+7} 56 ${ny+5}" fill="none" stroke="${mc}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (MO === "f") s += `<path d="M45.5 ${ny+5.6} L47 ${ny+9} L48.4 ${ny+6}Z" fill="#fff" stroke="#ccc" stroke-width=".4"/>`;
    if (MO === "t") s += `<ellipse cx="50" cy="${ny+7.2}" rx="2.4" ry="2.6" fill="#F58FA6"/>`;
  }
  if (!c.sphinx) s += `<path d="M22 55 L34 57 M22 60 L34 59 M78 55 L66 57 M78 60 L66 59" stroke="${c.darkFace?'#A898B0':'rgba(74,59,50,.35)'}" stroke-width="1" stroke-linecap="round"/>`;
  s += layer("neck") + layer("face") + layer("head") + layer("top") + layer("front") + layer("fx");
  if (cosmetic && COS_ART[cosmetic]) s += COS_ART[cosmetic];
  s += `</svg>`;
  return (svgCache[key] = s);
}

// Миска с кормом (бустер «Кошачий корм»)
const BOWL_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="86" rx="34" ry="6" fill="rgba(40,30,25,.15)"/>
<path d="M18 58 Q50 50 82 58 L74 82 Q50 90 26 82Z" fill="#E86A5A" stroke="#B8443A" stroke-width="2"/><ellipse cx="50" cy="58" rx="32" ry="8" fill="#F28B7C" stroke="#B8443A" stroke-width="2"/>
<ellipse cx="50" cy="57" rx="27" ry="5.5" fill="#B9793F"/>${[[36,54],[44,52],[52,55],[60,53],[66,56],[40,58],[56,58],[48,56]].map(([x,y],k)=>`<circle cx="${x}" cy="${y}" r="3.6" fill="${k%2?"#8A5424":"#C98A4E"}"/>`).join("")}
<path d="M38 72 l3 3 3 -3 M50 74 l3 3 3 -3 M62 72 l3 3 3 -3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
<path d="M44 40 q-4 -8 0 -14 M54 42 q-4 -8 0 -14 M64 40 q-4 -8 0 -14" stroke="#C9B8A8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"><animate attributeName="opacity" values=".2;.8;.2" dur="1.6s" repeatCount="indefinite"/></path></svg>`;

// Иконка-силуэт для неоткрытого кота
function lockedSVG(gid){ return `<div class="silhouette">${catSVG(gid)}</div>`; }

/* ---------- частицы миров ---------- */
function makeParticles(kind, host){
  host.innerHTML = "";
  const n = {dust:10, butterfly:6, rain:26, bubble:12, stars:34}[kind] || 0;
  for (let i=0;i<n;i++){
    const d = document.createElement("i");
    d.className = "p p-" + kind;
    d.style.left = (Math.random()*100) + "%";
    d.style.top = (Math.random()*100) + "%";
    d.style.animationDelay = (-Math.random()*12) + "s";
    d.style.animationDuration = ({dust:12, butterfly:14, rain:1.1, bubble:9, stars:3}[kind] * (0.7 + Math.random()*0.6)) + "s";
    if (kind === "butterfly") d.innerHTML = `<svg viewBox="0 0 20 16"><ellipse cx="6" cy="6" rx="5" ry="5" fill="${["#F5A3D6","#9AD0F5","#FFD24A"][i%3]}"/><ellipse cx="14" cy="6" rx="5" ry="5" fill="${["#F5A3D6","#9AD0F5","#FFD24A"][i%3]}"/><ellipse cx="7" cy="12" rx="3.5" ry="3" fill="#fff" opacity=".8"/><ellipse cx="13" cy="12" rx="3.5" ry="3" fill="#fff" opacity=".8"/><rect x="9.3" y="3" width="1.4" height="11" rx=".7" fill="#3A3036"/></svg>`;
    host.appendChild(d);
  }
}
