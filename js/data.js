"use strict";
/* =====================================================================
   CAT MERGE IDLE v2.2 — ДАННЫЕ ИГРЫ
   Все числа баланса и тексты — здесь. Меняйте смело, код их подхватит.
   ===================================================================== */

const CONFIG = {
  version: "2.4.4-tg",
  cells: 20,
  levels: 20,                   // котиков в каждом мире
  // Лидерборды — создать в Консоли с ТОЧНО такими техническими названиями
  lbWeekly: "catweekly",
  lbCollect: "catcollect",
  // Сервер друзей. Пусто = режим без сервера.
  serverUrl: "",
  boxMinInterval: 3,            // коробка: 5 сек по умолчанию, улучшениями — до 3 сек
  boxCapacityBase: 3,
  shopK: 380,                   // цена кота в лавке = shopK × доход этого кота × множитель мира × сложность
  buyGrowth: 1.03,              // рост цены с каждой покупкой (сбрасывается, когда в лавке появляется котик постарше)
  boxMaxLevel: 4,               // из коробки — котики не старше 4 уровня
  boxRareLevel: 5, boxRareChance: 0.02,   // 5 уровень — редко, только при полной «Волшебной коробке» (кристаллы)
  offlineShare: 0.07,           // пока игрока нет, котики копят 7% обычного дохода
  offlineMinSec: 60,
  freeBoxCooldown: 180,         // «Подарок за видео»
  boostAdCooldown: 240,         // бустер за видео — не чаще раза в 4 минуты
  turboMinutes: 5,
  comboMult: [1, 1.2, 1.5, 2, 3],
  comboWindowBase: 5,
  perfectWindowMs: 2000,
  newCatPaws: 3,
  questPaws: 15,
  specialBoxPaws: 20,
  interstitialMinGap: 180,
  eventAdCooldown: 600,
  meowEvery: [7, 14],           // сек. между мяуканьем котика на поле
  saveLocalEvery: 5, saveCloudEvery: 20,
  prestigeAfterWorlds: 2,
};

// Доход котов по уровням (×1,6 за уровень). Умножается на множитель мира.
const INC = [1,2,3,4,7,10,17,27,43,69,110,176,281,450,720,1150,1850,2950,4700,7550];
// Коробка: простые котики. 1 уровень, со 8-го открытого котика — 2, с 14-го — 3.
function boxBaseFor(best){ return best < 8 ? 1 : best < 14 ? 2 : 3; }
// Уровень кота в лавке = лучший открытый кот мира минус «разрыв».
// Чем дальше по цепочке, тем больше разрыв — каждый новый котик требует больше соединений.
function gapFor(best){ return best < 5 ? 3 : best < 9 ? 4 : best < 14 ? 5 : 6; }

const RARITY = [
  {n:T("Обычный"),     c:"#5FA84E", ic:"●"},
  {n:T("Необычный"),   c:"#3E8ED0", ic:"◆"},
  {n:T("Редкий"),      c:"#8A5BD6", ic:"★"},
  {n:T("Эпический"),   c:"#E27A12", ic:"✦"},
  {n:T("Легендарный"), c:"#C99A00", ic:"♛"},
  {n:T("Мифический"),  c:"linear-gradient(90deg,#e0504f,#e8931f,#4caf62,#3a86e0,#8a5bd6)", ic:"✺"},
];
const LEVEL_RARITY = [0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,4,4,4,5,5];

/* ---------- Миры ----------
   mult  — множитель дохода и цен (у каждого мира свои монеты)
   diff  — насколько дороже покупка кота
   gen   — базовый интервал коробок (сек)
   gapAdd — дополнительный разрыв уровня коробки (сложнее мир)
   res   — особый ресурс мира
*/
const WORLDS = [
  { id:"home", n:T("Дом"), e:"🏠", desc:T("Уютная квартира"), mult:1, diff:1, gen:5, gapAdd:0,
    theme:{bg1:"#FFF8EC", bg2:"#F7E3C6", board:"#EFD9B8", cell:"#FBEEDB", text:"#3B2A20", dark:false, part:"dust", tint:"rgba(255,246,232,.35)"},
    music:{chords:[[261.6,329.6,392],[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7]], wave:"triangle", tempo:2400, pluck:true},
    res:null,
    cats:[
      {n:T("Котёнок"), t:"r p B w m c -",   d:T("Маленький и смелый. С него всё начинается."), body:"#F4D3AE", dark:"#D9A877", eye:"#4B3A2E"},
      {n:T("Рыжик"), t:"o p o s s u a",     d:T("Солнечный хулиган. Любит подоконники."), body:"#F6A04D", dark:"#D9772A", eye:"#3E7C3A", stripes:1},
      {n:T("Серый"), t:"w s l w l w m",     d:T("Тихий и мудрый. Знает, где лежит корм."), body:"#A9AAB6", dark:"#7F8090", eye:"#E0A526"},
      {n:T("Белый"), t:"o r * c s f -",     d:T("Снежный пушок. Всегда чистый."), body:"#FFFFFF", dark:"#E4DAD0", eye:"#4DA3D9", outline:1},
      {n:T("Кот в носочках"), t:"t p o t s c -", d:T("Белые лапки — будто надел носочки."), body:"#7C7F8C", dark:"#5C5F6B", eye:"#8BC34A", socks:1},
      {n:T("Чёрный"), t:"o w s f m u -",    d:T("Приносит удачу. И немного монет."), body:"#3A3440", dark:"#26212B", eye:"#F2C230", inner:"#6B5A70", darkFace:1},
      {n:T("Трёхцветная кошка"), t:"c p k s c q -", d:T("Говорят, трёхцветные кошки к счастью."), body:"#FFFFFF", dark:"#E4DAD0", eye:"#6A8E3A", outline:1, calico:1},
      {n:T("Полосатый"), t:"w p o f p t a", d:T("Настоящий тигр, только маленький."), body:"#CFA67E", dark:"#8A6446", eye:"#5E8A3A", stripes:2},
      {n:T("Кот с клубком"), t:"o c h o s q r", d:T("Распутает любой клубок. Или запутает."), body:"#C8B6DA", dark:"#9C86B8", eye:"#3E7C3A", acc:["yarn"]},
      {n:T("Кот-соня"), t:"c s z w l d -",  d:T("Спит 20 часов в сутки. Остальное — дремлет."), body:"#A7C4D6", dark:"#7E9FB5", eye:"#4B3A2E", sleepy:1, acc:["nightcap"]},
      {n:T("Сиамский"), t:"t b s w m u -",  d:T("Голубые глаза и важная походка."), body:"#F3E6D0", dark:"#5B4636", eye:"#4E9BE6", siam:1},
      {n:T("Вислоухий"), t:"r f B c c s m", d:T("Ушки сложены, как у плюшевой игрушки."), body:"#B7775A", dark:"#8A5238", eye:"#E08A2A", fold:1, round:1},
      {n:T("Британец"), t:"w s o s c t e",  d:T("Круглый, мягкий и спокойный."), body:"#6F7F96", dark:"#55637A", eye:"#E08A2A", round:1},
      {n:T("Персидский"), t:"r s l c p f -", d:T("Пушистая аристократка с курносым носиком."), body:"#F6E3B4", dark:"#DCC285", eye:"#E0A526", outline:1, persian:1, round:1},
      {n:T("Сфинкс"), t:"t b B t m s -",    d:T("Совсем без шерсти, зато очень тёплый."), body:"#F2C4B8", dark:"#D8978A", eye:"#3BA37A", sphinx:1},
      {n:T("Кот-повар"), t:"c r h s s c b", d:T("Варит самую вкусную уху в доме."), body:"#7A4E3A", dark:"#553425", eye:"#F2C230", acc:["chefHat","ladle"]},
      {n:T("Бенгальский кот"), t:"t p s s p t -", d:T("Пятнистый, как маленький леопард."), body:"#E8B062", dark:"#8A5424", eye:"#3E7C3A", bengal:1},
      {n:T("Мейн-кун"), t:"w l o w c f a",  d:T("Большой пушистый добряк с кисточками."), body:"#A5724A", dark:"#6F4A2E", eye:"#C9A227", tufts:1, stripes:2},
      {n:T("Кот-домовой"), t:"c l d o p f e", d:T("Охраняет уют и светит фонариком по ночам."), body:"#5E5A66", dark:"#403C48", eye:"#FFD24A", fuzzy:1, tufts:1, acc:["lantern","sparkles"]},
      {n:T("Королевский кот"), t:"r c * s c u -", d:T("Хозяин дома. Корона настоящая!"), body:"#FFE08A", dark:"#E3B94E", eye:"#8E5BD9", acc:["crown","sparkles"]},
    ]},
  { id:"garden", n:T("Сад"), e:"🌳", desc:T("Цветы и бабочки"), mult:2, diff:1.5, gen:5, gapAdd:0,
    theme:{bg1:"#F1FAE6", bg2:"#CFEBB8", board:"#BFE0A2", cell:"#E8F6DA", text:"#24401C", dark:false, part:"butterfly", tint:"rgba(240,250,230,.3)"},
    music:{chords:[[293.7,370,440],[246.9,293.7,370],[196,246.9,293.7],[220,277.2,329.6]], wave:"sine", tempo:2600, birds:true},
    res:{id:"flower", ic:"🌸", n:T("Цветы"), minLv:3, rate:0.01, hint:T("Коты от 3 уровня выращивают цветы. Меняй цветы на лапки!")},
    cats:[
      {n:T("Садовый кот"), t:"o p o w s c a",   d:T("Любит лежать на тёплой грядке."), body:"#C9A77C", dark:"#8C6A45", eye:"#5E8A3A", stripes:1, acc:["leaf"]},
      {n:T("Кот-клевер"), t:"r r B s m u -",    d:T("Нашёл четырёхлистный клевер. Везунчик!"), body:"#DDE8C9", dark:"#B4C79A", eye:"#4E9A38", acc:["clover"]},
      {n:T("Кот с венком"), t:"w p h c s q a",  d:T("Сплёл венок из одуванчиков."), body:"#D9D6CF", dark:"#8E8A80", eye:"#6A8E3A", acc:["wreath"]},
      {n:T("Кот-морковка"), t:"t w s f p t -",  d:T("Рыжий, как морковка, и такой же хрустящий."), body:"#F28C3A", dark:"#C9651A", eye:"#3E7C3A", acc:["carrotTop"]},
      {n:T("Цветочный кот"), t:"c r k t c c -", d:T("Пахнет ромашкой и мёдом."), body:"#FBE3EA", dark:"#E7B5C4", eye:"#C0508A", acc:["flowerEar"], spots:"#F4A9C0"},
      {n:T("Кот-одуванчик"), t:"r s l w l f -", d:T("Дунешь — и пушинки полетят."), body:"#FFFFFF", dark:"#E6DED2", eye:"#E0A526", outline:1, acc:["dandelion"]},
      {n:T("Пчелиный кот"), t:"o b B o c s -",  d:T("Жужжит, но не кусается."), body:"#FFD24A", dark:"#3A3036", eye:"#3A3036", bee:1, acc:["wings","antenna"]},
      {n:T("Кот-божья коровка"), t:"w s * f m d -", d:T("Улетит на небо и вернётся с хлебом."), body:"#3A3440", dark:"#26212B", eye:"#FFD24A", darkFace:1, inner:"#6B5A70", acc:["ladybug","antenna"]},
      {n:T("Кот-грибок"), t:"c p d c p w r",    d:T("Вырос после тёплого дождика."), body:"#F0DEC2", dark:"#B89A72", eye:"#7A4E2E", acc:["mushroom"]},
      {n:T("Кот-садовник"), t:"t p l s s u m",  d:T("Поливает цветы каждое утро."), body:"#9A8F84", dark:"#72685E", eye:"#3E7C3A", acc:["strawHat","can"]},
      {n:T("Кот-улитка"), t:"o c h w l d -",    d:T("Никуда не спешит. Домик всегда с собой."), body:"#C7B8A6", dark:"#9A8A76", eye:"#6B4BC2", acc:["snailShell","antenna"]},
      {n:T("Кот-бабочка"), t:"t r B c m q -",   d:T("Лёгкий, как лепесток."), body:"#D9C8F2", dark:"#A58FD6", eye:"#6B4BC2", acc:["butterflyWings"]},
      {n:T("Кот-лягушонок"), t:"w w B o c s -", d:T("Ква-мяу! Любит прыгать по кувшинкам."), body:"#F7E8A6", dark:"#D9C46A", eye:"#3E7C3A", acc:["frogHat"]},
      {n:T("Кот-ромашка"), t:"r p * s s c n",   d:T("Белый воротник из лепестков."), body:"#FFFFFF", dark:"#E6DED2", eye:"#5BA3D9", outline:1, acc:["daisyCollar"]},
      {n:T("Кот-ёжик"), t:"c s d f p s -",      d:T("Колючки мягкие — можно гладить."), body:"#A88A6A", dark:"#6E553C", eye:"#3A3036", acc:["hedgehog"]},
      {n:T("Кот-кактус"), t:"t s o t m u -",    d:T("Колючий снаружи, добрый внутри."), body:"#8CC56A", dark:"#5E9A43", eye:"#3A3036", cactus:1, acc:["cactusFlower"]},
      {n:T("Кот-подсолнух"), t:"r w h s c c -", d:T("Всегда поворачивается к солнышку."), body:"#E8A33A", dark:"#B5761A", eye:"#5B3A1A", acc:["sunflower"]},
      {n:T("Кот-розочка"), t:"o b k s p q -",   d:T("Самый нарядный в саду."), body:"#F7B7C3", dark:"#E0798F", eye:"#8E2F4F", acc:["rose"]},
      {n:T("Кот-фея"), t:"t c * c m f -",       d:T("Взмахнёт палочкой — и цветы распустятся."), body:"#F4E8FF", dark:"#CDB5EE", eye:"#8A5BD6", outline:1, acc:["fairyWings","wand","sparkles"]},
      {n:T("Лесной кот"), t:"w l s f c f a",    d:T("Хранитель сада и леса."), body:"#7D8A6A", dark:"#4F5A40", eye:"#E8C04A", tufts:1, stripes:2, acc:["leafCrown","sparkles"]},
    ]},
  { id:"city", n:T("Город"), e:"🌃", desc:T("Вечерний мегаполис"), mult:3, diff:2.2, gen:5, gapAdd:0,
    theme:{bg1:"#3A3F6B", bg2:"#221F3D", board:"#353A66", cell:"#464D80", text:"#FFFFFF", dark:true, part:"rain", tint:"rgba(20,18,45,.28)"},
    music:{chords:[[220,261.6,329.6],[174.6,220,261.6],[261.6,329.6,392],[196,246.9,293.7]], wave:"square", tempo:2200, bass:true},
    res:{id:"coffee", ic:"☕", n:T("Кофе"), minLv:3, rate:0.015, hint:T("Коты от 3 уровня варят кофе. Продавай кофе за монеты!")},
    cats:[
      {n:T("Офисный кот"), t:"o p l w s c -",    d:T("Пьёт чай и пишет отчёты."), body:"#B7B8C2", dark:"#8C8D99", eye:"#4A7BB7", acc:["tie"]},
      {n:T("Кот-курьер"), t:"t p d s m u i",     d:T("Доставит посылку за 5 минут."), body:"#D8CBB8", dark:"#AE9E86", eye:"#3E7C3A", acc:["cap","parcel"]},
      {n:T("Кот-таксист"), t:"w r k t s q e",    d:T("Знает все короткие дороги."), body:"#6E6A63", dark:"#4E4A44", eye:"#3E7C3A", acc:["taxiCap"]},
      {n:T("Кот-строитель"), t:"c s d w c s a",  d:T("Построил домик для всех котов."), body:"#A3794F", dark:"#7A5634", eye:"#E0A526", acc:["hardHat"]},
      {n:T("Кот-полицейский"), t:"w p s w p t -",d:T("Следит за порядком во дворе."), body:"#5D6A86", dark:"#3F4A63", eye:"#E0A526", acc:["policeHat"]},
      {n:T("Кот-пожарный"), t:"r b B o c c m",   d:T("Снимает котят с деревьев."), body:"#C8624A", dark:"#9A3F2C", eye:"#3E7C3A", acc:["fireHelmet"]},
      {n:T("Кот-музыкант"), t:"o c h s s w -",   d:T("Играет на гитаре по вечерам."), body:"#F3E6D0", dark:"#C9B79A", eye:"#7A4E2E", acc:["guitar"]},
      {n:T("Кот-художник"), t:"t r * c m q -",   d:T("Рисует портреты лапкой."), body:"#F2D4C0", dark:"#D9AE92", eye:"#4A7BB7", outline:1, paint:1, acc:["beret","brush"]},
      {n:T("Кот-программист"), t:"r s d w l d -",d:T("Пишет код лапками."), body:"#8FA3A0", dark:"#687C79", eye:"#3BA37A", acc:["glasses","laptop"]},
      {n:T("Кот-фотограф"), t:"c w k s p c r",   d:T("Скажи «сы-ыр»!"), body:"#8A6450", dark:"#5E4535", eye:"#E0A526", acc:["camera"]},
      {n:T("Кот-бариста"), t:"w r h s c t m",    d:T("Рисует сердечки на пенке."), body:"#D9B08C", dark:"#B08560", eye:"#E0A526", acc:["apron","cup"]},
      {n:T("Кот-доктор"), t:"o p o w m f n",     d:T("Лечит мурчанием."), body:"#FFFFFF", dark:"#E4DAD0", eye:"#3E8ED0", outline:1, acc:["headMirror","stethoscope"]},
      {n:T("Кот-скейтер"), t:"t w B t m u -",    d:T("Катается быстрее ветра."), body:"#A9C2DE", dark:"#7F9CBF", eye:"#2E6FB7", acc:["capBack","skateboard"]},
      {n:T("Кот-бизнесмен"), t:"t s s w s t -",  d:T("Строгий костюм и цилиндр."), body:"#FFFFFF", dark:"#2B2A33", eye:"#4A7BB7", tux:1, acc:["topHat","bowtie"]},
      {n:T("Кот-модник"), t:"c c k f m q -",     d:T("Знает, что сейчас в моде."), body:"#F4B8D0", dark:"#DB8EAE", eye:"#C0508A", acc:["pinkScarf","sunglasses"]},
      {n:T("Кот-рокер"), t:"w b s f s u -",      d:T("Громкий, но добрый."), body:"#3A3440", dark:"#26212B", eye:"#F2C230", inner:"#6B5A70", darkFace:1, acc:["mohawk","sunglasses"]},
      {n:T("Кот-супергерой"), t:"r p B s c f -", d:T("Спасает город от скуки."), body:"#5B7BC9", dark:"#3E5AA3", eye:"#FFE08A", acc:["heroCape","heroMask","starBadge"]},
      {n:T("Кот-диджей"), t:"o r h o l d -",     d:T("Ставит музыку для всего города."), body:"#8E6FD8", dark:"#6448B0", eye:"#FFE08A", acc:["headphones"]},
      {n:T("Кот-кинозвезда"), t:"c r * s p f -", d:T("Его фото на всех афишах."), body:"#FFE08A", dark:"#E3B94E", eye:"#C0508A", acc:["starGlasses","mic","sparkles"]},
      {n:T("Неоновый кот"), t:"t b s c m t -",   d:T("Светится ярче витрин."), body:"#1F1B35", dark:"#12101F", eye:"#3CF2E6", neon:"#3CF2E6", darkFace:1, acc:["sparkles"]},
    ]},
  { id:"island", n:T("Остров"), e:"🏝️", desc:T("Тропический рай"), mult:5, diff:3, gen:5, gapAdd:0,
    theme:{bg1:"#C8F0FF", bg2:"#FFE3AE", board:"#F0CF8E", cell:"#FBE9C4", text:"#2E3A2A", dark:false, part:"bubble", tint:"rgba(255,248,230,.25)"},
    music:{chords:[[349.2,440,523.3],[293.7,370,440],[392,493.9,587.3],[329.6,415.3,493.9]], wave:"triangle", tempo:1800, pluck:true},
    res:{id:"shell", ic:"🐚", n:T("Ракушки"), minLv:3, rate:0.012, hint:T("Коты от 3 уровня находят ракушки. Строй из них курорт!")},
    cats:[
      {n:T("Пляжный кот"), t:"w p h s l d -",     d:T("Загорает весь день."), body:"#EBCB98", dark:"#C9A36B", eye:"#3E7C3A", acc:["sunglasses"]},
      {n:T("Гавайский кот"), t:"c r B s c q -",   d:T("Встречает гостей цветочным ожерельем."), body:"#5A4A48", dark:"#3E3230", eye:"#3E7C3A", acc:["lei"]},
      {n:T("Кот-серфер"), t:"t p o f m u a",      d:T("Ловит самые большие волны."), body:"#F4B45A", dark:"#D08A2A", eye:"#2E6FB7", acc:["surfboard"]},
      {n:T("Ананасовый кот"), t:"r c k t p c r",  d:T("Сладкий и немножко колючий."), body:"#F7D774", dark:"#D9A21A", eye:"#3E7C3A", acc:["pineapple"]},
      {n:T("Кокосовый кот"), t:"w s d w c s -",   d:T("Мохнатый, как кокос."), body:"#8A5A3A", dark:"#5E3B22", eye:"#F2C230", fuzzy:1, acc:["coconutHat"]},
      {n:T("Кот-краб"), t:"w w s o s f -",        d:T("Ходит боком и щёлкает клешнями."), body:"#EF6A4F", dark:"#C0452E", eye:"#3A3036", acc:["claws"]},
      {n:T("Кот-пират"), t:"o p s f s t a",       d:T("Ищет сундук с рыбкой."), body:"#C9793A", dark:"#94521F", eye:"#E0A526", acc:["pirateHat","eyepatch"]},
      {n:T("Кот-черепашка"), t:"r s l c l s -",   d:T("Медленно, но верно доплывёт куда угодно."), body:"#E6DCC4", dark:"#BFB08E", eye:"#3E7C3A", acc:["turtleShell"]},
      {n:T("Морской кот"), t:"o b o s m c n",     d:T("Не боится воды."), body:"#7FA7C9", dark:"#557FA3", eye:"#FFE08A", acc:["sailorCollar"]},
      {n:T("Кот-дайвер"), t:"t p o w s u -",      d:T("Нырнул за самой красивой ракушкой."), body:"#9AA0A8", dark:"#6E747C", eye:"#2E6FB7", acc:["diveMask"]},
      {n:T("Кот-попугай"), t:"c c B o m q -",     d:T("Повторяет «мяу» на разные голоса."), body:"#5DB04A", dark:"#3E8330", eye:"#3A3036", acc:["crest","parrotWings"]},
      {n:T("Кот-капитан"), t:"o w l w c t e",     d:T("Ведёт корабль к новым островам."), body:"#FFFFFF", dark:"#E0D6CC", eye:"#2E6FB7", outline:1, acc:["captainHat"]},
      {n:T("Кот-медуза"), t:"r r B c s c -",      d:T("Прозрачный и светится в темноте."), body:"#F5B8E8", dark:"#D987C6", eye:"#6B4BC2", jelly:1},
      {n:T("Коралловый кот"), t:"c b h s p c -",  d:T("Живёт среди кораллов."), body:"#FF9E88", dark:"#E0705A", eye:"#2E6FB7", spots:"#FFD1C4"},
      {n:T("Кот-осьминог"), t:"w s * o s c -",    d:T("Восемь лап — восемь обнимашек."), body:"#A76BD6", dark:"#7A45AD", eye:"#FFE08A", octo:1},
      {n:T("Русалочий кот"), t:"t r k s m c -",   d:T("Вместо хвоста — плавник."), body:"#7ED6C8", dark:"#3FAE9D", eye:"#6B4BC2", acc:["fishTail","pearls"]},
      {n:T("Кот-дельфин"), t:"r p h o c d -",     d:T("Самый весёлый в океане."), body:"#A7B4C2", dark:"#7D8C9C", eye:"#2E3A55", acc:["dorsalFin"]},
      {n:T("Золотой кот"), t:"o c * s s f -",     d:T("Нашёлся в пиратском сундуке."), body:"#F2B82E", dark:"#C98E10", eye:"#8E3B1F", gold:1, acc:["sparkles"]},
      {n:T("Жемчужный кот"), t:"r r B c p q -",   d:T("Сияет, как жемчужина на солнце."), body:"#F4F1FF", dark:"#D6CFEE", eye:"#6B4BC2", outline:1, pearly:1, acc:["pearlTop","pearls","sparkles"]},
      {n:T("Океанский кот"), t:"t l s w c f -",   d:T("Легенда морей. Повелевает волнами."), body:"#3A7BC8", dark:"#23549A", eye:"#9FF0FF", acc:["waveCrown","trident","sparkles"]},
    ]},
  { id:"space", n:T("Космос"), e:"🚀", desc:T("Космическая станция"), mult:8, diff:4, gen:5, gapAdd:0,
    theme:{bg1:"#1B2150", bg2:"#0D0F26", board:"#262C5E", cell:"#323A74", text:"#FFFFFF", dark:true, part:"stars", tint:"rgba(10,12,35,.25)"},
    music:{chords:[[196,293.7,392],[174.6,261.6,349.2],[164.8,246.9,329.6],[146.8,220,293.7]], wave:"sine", tempo:3200, pad:true},
    res:{id:"energy", ic:"🔋", n:T("Энергия"), minLv:3, rate:0.012, hint:T("Коты от 3 уровня дают энергию. Включай генераторы!")},
    cats:[
      {n:T("Кот-астронавт"), t:"r p B o s c b",  d:T("Первый кот на орбите."), body:"#F0B37E", dark:"#C98A55", eye:"#4B3A2E", acc:["helmet"]},
      {n:T("Кот-спутник"), t:"o r d w m u -",    d:T("Ловит сигналы с других планет."), body:"#CFC6B8", dark:"#A69C8C", eye:"#3E8ED0", acc:["dish"]},
      {n:T("Кот-инженер"), t:"w p l s c t -",    d:T("Чинит станцию гаечным ключом."), body:"#D4B04A", dark:"#A8862A", eye:"#3E7C3A", acc:["goggles","wrench"]},
      {n:T("Кот-метеорит"), t:"c s s f p s -",   d:T("Прилетел быстрее всех и немножко подпалил хвост."), body:"#8C7A6E", dark:"#5E5048", eye:"#FF9A3C", craters:1, rocky:1},
      {n:T("Робот-кот"), t:"o p o w c s -",      d:T("Мурлычет на батарейках."), body:"#C3CAD6", dark:"#8A93A3", eye:"#3CF2E6", robot:1, acc:["antennaBall"]},
      {n:T("Кот-ракета"), t:"t b h o m q -",     d:T("Три, два, один — мяу!"), body:"#F4D0D6", dark:"#DDA3AE", eye:"#E0504F", outline:1, acc:["rocket"]},
      {n:T("Лунный кот"), t:"r r z w l d -",     d:T("Мягкий, как лунная пыль."), body:"#E4E4EC", dark:"#B9B9C8", eye:"#6B4BC2", craters:1},
      {n:T("Кот-НЛО"), t:"o w B c s u -",        d:T("Прилетел на тарелочке. С молоком."), body:"#C8B5F2", dark:"#9A83D6", eye:"#3CF2E6", acc:["ufo"]},
      {n:T("Марсианский кот"), t:"w b s t p c -",d:T("Прилетел с красной планеты."), body:"#E0674A", dark:"#B2432A", eye:"#FFE08A"},
      {n:T("Кот-комета"), t:"t c * o m c -",     d:T("Мчится по небу с огненным хвостом."), body:"#BFE6FF", dark:"#7FBCE6", eye:"#2E6FB7", acc:["cometTail"]},
      {n:T("Инопланетный кот"), t:"c w B c c q -",d:T("Три уха — слышит всё!"), body:"#8BE07A", dark:"#58B048", eye:"#3A1F5A", acc:["alienAntenna"]},
      {n:T("Кот-звездочёт"), t:"o p l s s w e",  d:T("Знает все созвездия наизусть."), body:"#2F6E7A", dark:"#1E4E58", eye:"#FFE08A", darkFace:1, acc:["wizardHat","telescope"]},
      {n:T("Кот-киборг"), t:"t s s w s t -",     d:T("Наполовину робот, наполовину мурлыка."), body:"#6F6A78", dark:"#4E4A58", eye:"#3BA37A", acc:["cyborg"]},
      {n:T("Космический пират"), t:"w c k f c t -",d:T("Ищет звёздные сокровища."), body:"#4A4458", dark:"#2E2A38", eye:"#F2C230", darkFace:1, acc:["spaceTricorn","cyberPatch"]},
      {n:T("Кот-Сатурн"), t:"r r h s c c -",     d:T("Носит кольцо, как настоящая планета."), body:"#E8C98A", dark:"#C09A52", eye:"#7A4E2E", acc:["ring","ringFront"]},
      {n:T("Кот Чёрная дыра"), t:"c b s o l d -", d:T("Затягивает в себя все монеты."), body:"#2A1B45", dark:"#140B26", eye:"#FF7AD9", swirl:1, darkFace:1},
      {n:T("Солнечный кот"), t:"r s h s c f -",  d:T("Греет всю станцию своим теплом."), body:"#FFC43D", dark:"#E8931F", eye:"#8E3B1F", acc:["sunRays","sparkles"]},
      {n:T("Кот-туманность"), t:"t r * c m q -", d:T("Сделан из звёздной пыли и мечты."), body:"#B98BE8", dark:"#7A5AC9", eye:"#FFFFFF", nebula:1, starry:1, darkFace:1, acc:["sparkles"]},
      {n:T("Галактический кот"), t:"o l B w p f -",d:T("В шерсти — целая галактика."), body:"#2D3A8C", dark:"#1B2462", eye:"#FFE08A", starry:1, darkFace:1, acc:["sparkles"]},
      {n:T("Космический король"), t:"w p * s c f -",d:T("Правит всеми звёздами."), body:"#6A4FC9", dark:"#46319A", eye:"#FFE08A", starry:1, darkFace:1, acc:["cape","crown","sparkles"]},
    ]},
];

/* ---------- События и особые коты (только коллекция, дают бонус к доходу) ---------- */
const EVENTS = [
  { id:"halloween", n:T("Хэллоуин"), e:"🎃", cur:{ic:"🍬", n:T("Конфеты")}, from:[10,20], to:[11,5],
    cats:[
      {n:T("Ведьмин кот"), t:"o p s f m u -",  d:T("Варит зелье из молока."), body:"#3A3440", dark:"#26212B", eye:"#8BE07A", darkFace:1, inner:"#6B5A70", acc:["witchHat"], price:60},
      {n:T("Кот-вампир"), t:"t b s f s t -",   d:T("Любит томатный сок."), body:"#B7B8C2", dark:"#8C8D99", eye:"#E0504F", acc:["cape","fangs"], price:90},
      {n:T("Тыквенный кот"), t:"r r h s c q -",d:T("Спит в тыкве."), body:"#F6A04D", dark:"#D9772A", eye:"#3A3036", acc:["pumpkinHat"], price:120},
      {n:T("Призрачный кот"), t:"r r B c s c -",d:T("Бу! Не бойся, он добрый."), body:"#F4F4FF", dark:"#D8D8EE", eye:"#6B4BC2", ghost:1, price:180},
    ]},
  { id:"newyear", n:T("Новый год"), e:"🎄", cur:{ic:"❄️", n:T("Снежинки")}, from:[12,20], to:[1,12],
    cats:[
      {n:T("Снежный кот"), t:"r s B c c f -",   d:T("Слепил сам себя."), body:"#FFFFFF", dark:"#DDE6F0", eye:"#3E8ED0", outline:1, acc:["scarf"], price:60},
      {n:T("Кот в колпаке"), t:"c p h s s c m", d:T("Раздаёт подарки."), body:"#B08D74", dark:"#86664F", eye:"#3E7C3A", acc:["santaHat"], price:90},
      {n:T("Пряничный кот"), t:"w r h s s c -", d:T("Пахнет корицей."), body:"#B9793F", dark:"#8A5424", eye:"#3A3036", icing:1, price:120},
      {n:T("Ледяной кот"), t:"t c * c m q -",   d:T("Сверкает, как сосулька."), body:"#BFE6FF", dark:"#8CC8EE", eye:"#2E6FB7", acc:["sparkles"], price:180},
    ]},
  { id:"valentine", n:T("День котиков-влюблённых"), e:"💖", cur:{ic:"💖", n:T("Сердечки")}, from:[2,7], to:[2,21],
    cats:[
      {n:T("Кот-купидон"), t:"r r B s m q -", d:T("Стреляет сердечками."), body:"#FFFFFF", dark:"#F0D8E0", eye:"#C0508A", outline:1, acc:["angelWings","heart"], price:60},
      {n:T("Кот-сердечко"), t:"c b k t c c -",d:T("Весь в сердечках."), body:"#F7B7C3", dark:"#E0798F", eye:"#8E2F4F", hearts:1, price:90},
      {n:T("Ромео"), t:"o p l s s t -",       d:T("Дарит розы. Пара для Джульетты."), body:"#8C9BAE", dark:"#6E7C8F", eye:"#E08A2A", acc:["bowtie","rose"], price:120},
      {n:T("Джульетта"), t:"t r * c m f -",   d:T("Ждёт Ромео у окна."), body:"#FBE3EA", dark:"#E7B5C4", eye:"#4E9BE6", acc:["bow","flowerEar"], price:120},
    ]},
];
const SPECIAL_CATS = [
  {id:"creator", n:T("Кот Создатель"), t:"r c * s c f -", d:T("Появляется у тех, кто прошёл все миры."), body:"#FFF4D6", dark:"#E3C98A", eye:"#8E5BD9", rainbow:1, acc:["halo","sparkles"], r:5, bonus:0.10},
  {id:"patron",  n:T("Звёздный кот"), t:"o l * s s u -", d:T("Особый кот из набора «Кошачий набор»."), body:"#FFE08A", dark:"#E3B94E", eye:"#3E8ED0", gold:1, acc:["starBadge","sparkles"], r:4, bonus:0.05},
];

/* ---------- Общий альбом: единые номера котов ---------- */
// 0..99 — коты миров (мир*20 + уровень-1), 100..111 — праздничные, 112..113 — особые
const ALBUM = [];
WORLDS.forEach((w,wi)=>w.cats.forEach((c,li)=>ALBUM.push(Object.assign({gid:ALBUM.length, world:wi, lv:li+1, r:LEVEL_RARITY[li], kind:"world"}, c))));
const EVENT_BASE = ALBUM.length;
EVENTS.forEach((e,ei)=>e.cats.forEach((c,k)=>ALBUM.push(Object.assign({gid:ALBUM.length, event:ei, r:k<2?3:4, kind:"event", bonus:0.02}, c))));
const SPECIAL_BASE = ALBUM.length;
SPECIAL_CATS.forEach(c=>ALBUM.push(Object.assign({gid:ALBUM.length, kind:"special"}, c)));
function worldCatGid(w, lv){ return w*CONFIG.levels + lv - 1; }

/* ---------- Перенос сохранений версии 2.0 (10 котов в мире) ---------- */
// старый уровень кота → новый уровень того же кота в цепочке из 20
const V2_LEVEL_MAP = [
  [1,2,3,4,6,8,11,13,18,20],
  [1,3,5,7,10,12,14,16,18,20],
  [1,2,5,7,9,11,14,16,18,20],
  [1,3,7,5,9,12,16,14,18,20],
  [1,3,5,7,9,11,14,16,19,20],
];
function v2GidToV3(g){
  if (g < 50) return worldCatGid(Math.floor(g/10), V2_LEVEL_MAP[Math.floor(g/10)][g%10]);
  return g + 50;   // праздничные и особые сдвинулись на 50
}

/* ---------- Улучшения (свои в каждом мире, цена × множитель мира) ---------- */
// v2.2: улучшения дороже (цена растёт быстрее) и слабее за уровень
const AUTO_IV = [0,20,15,11,8];
const pct = v => String(Math.round(v*10)/10).replace(".", DEC());
const UPGRADES = [
  {id:"econ",  ic:"💰", n:T("Больше монет"),     max:20, base:80,   g:2.0,  per:0.05,  eff:l=>`+${l*5}${T("% к доходу")}`},
  {id:"speed", ic:"⏱️", n:T("Быстрые коробки"),  max:8,  base:100,  g:2.3,  per:0.25,   eff:l=>`${T("коробка каждые")} ${boxIntervalFor(curW(), l).toFixed(1).replace(".", DEC())} ${T("сек")}`},
  {id:"cap",   ic:"🧺", n:T("Большая лежанка"),  max:5,  base:200,  g:2.8,  per:1,     eff:l=>`${T("копится до")} ${CONFIG.boxCapacityBase+l} ${T("коробок")}`},
  {id:"merge", ic:"✨", n:T("Награда за котов"),  max:10, base:120,  g:2.2,  per:0.08,  eff:l=>`+${l*8}${T("% монет, когда соединяешь")}`},
  {id:"bulk",  ic:"🏷️", n:T("Скидка в лавке"),   max:6,  base:200,  g:2.6,  per:0.03,  eff:l=>`${T("коты в лавке дешевле на")} ${l*3}%`},
  {id:"luck",  ic:"🍀", n:T("Кошачья удача"),    max:8,  base:250,  g:2.4,  per:0.025, eff:l=>`${T("шанс")} ${pct(l*2.5)}${T("%, что кот из коробки будет на уровень старше (до")} ${CONFIG.boxMaxLevel} ${T("ур.)")}`},
  {id:"combo", ic:"🔥", n:T("Длинная серия"),    max:5,  base:400,  g:2.4,  per:1,     eff:l=>`${T("серия ждёт")} ${CONFIG.comboWindowBase+l} ${T("сек")}`},
  {id:"auto",  ic:"🤖", n:T("Автосбор"),         max:4,  base:5000, g:3.2,  per:0,     eff:l=>l? `${T("сам открывает коробку каждые")} ${AUTO_IV[l]} ${T("сек")}` : T("коробки открываешь сам")},
];
const UPG = Object.fromEntries(UPGRADES.map(u=>[u.id,u]));
// Офлайн-доход — общее улучшение для всей игры (за монеты текущего мира)
const OFFLINE_HOURS = [2,3,4,5,6];
const OFFLINE_COST = [5000, 40000, 300000, 2500000];

/* ---------- Бустеры ---------- */
// aim: на что нажать после выбора бустера (empty — свободная клетка, cat — котик); cr — цена в кристаллах
const BOOSTERS = [
  {id:"food",   ic:"🥣", s:T("Корм"),    n:T("Кошачий корм"),  d:T("Поставь миску на свободную клетку — на запах прибегут 6 котиков, как из коробки."), paws:12, cr:2, aim:"empty",
   bar:T("🥣 Нажми на свободную клетку, куда поставить миску")},
  {id:"spray",  ic:"💦", s:T("Брызги"), n:T("Брызгалка"),   d:T("Брызни водичкой на котика — он фыркнет и убежит с поля."), paws:5, cr:1, aim:"cat",
   bar:T("💦 Нажми на котика, которого прогнать")},
  {id:"nip",    ic:"🌿", s:T("Мята"),    n:T("Кошачья мята"),  d:T("Угости котика мятой — 5 минут он приносит в 1,5 раза больше монет."), paws:15, cr:2, aim:"cat",
   bar:T("🌿 Нажми на котика, которого угостить мятой")},
  {id:"wild",   ic:"🌈", s:T("Радуга"), n:T("Кот-радуга"),   d:T("Соединяется с любым котом и повышает его уровень. Нового, ещё не открытого котика не создаёт."), paws:25},
  {id:"lucky",  ic:"🎁", s:T("Сюрприз"), n:T("Счастливая коробка"), d:T("Случайный подарок: монеты, лапки, бустер или кот."), paws:15},
];
const FOOD_CATS = 6, FOOD_EVERY = 0.7;       // котиков из одной миски и пауза между ними (сек)
const NIP_MULT = 1.5, NIP_MINUTES = 5;       // кошачья мята
const QUEST_BOOST_CHANCE = 0.35;             // шанс бустера за выполненное задание
const GIFT_BOOSTS = ["food","spray","nip"];  // бустеры, которые выпадают в подарках и заданиях

/* ---------- Косметика (не влияет на баланс) ---------- */
const COSMETICS = [
  {id:"beanie",   ic:"🧶", n:T("Вязаная шапка"), paws:40},
  {id:"specs",    ic:"👓", n:T("Очки"),          paws:40},
  {id:"party",    ic:"🥳", n:T("Праздничный колпак"), paws:60},
  {id:"cosCrown", ic:"👑", n:T("Корона"),        paws:120},
  {id:"tricorn",  ic:"🏴‍☠️", n:T("Пиратская шляпа"), paws:80},
  {id:"spaceHelm",ic:"🧑‍🚀", n:T("Шлем космонавта"), paws:100},
  {id:"horns",    ic:"😈", n:T("Рожки"),         paws:60},
  {id:"golden",   ic:"✨", n:T("Золотой блеск"), paws:150},
];

/* ---------- Покупки за рубли (создать в Консоли с такими же id) ---------- */
const IAP = [
  {id:"starter_pack", ic:"🎒", n:T("Набор новичка"), d:T("Монеты, 100 лапок и доход ×2 на 1 час"), once:true, fallback:"99 ₽"},
  {id:"cat_pack",     ic:"🐱", n:T("Кошачий набор"), d:T("Звёздный кот навсегда, монеты и 100 лапок"), once:true, fallback:"199 ₽"},
  {id:"premium",      ic:"💎", n:T("Премиум"),       d:T("Без полноэкранной рекламы, +10% дохода и 20 лапок каждый день"), permanent:true, fallback:"299 ₽"},
  {id:"paws_150",     ic:"🐾", n:T("150 лапок"),     d:T("Мешочек лапок для бустеров и косметики"), fallback:"99 ₽"},
];

/* ---------- Ежедневная награда ---------- */
const DAILY = [
  {e:"🪙", t:T("Монеты"),   give:{incomeSec:120}},
  {e:"🪙", t:T("Монеты"),   give:{incomeSec:240}},
  {e:"🐾", t:T("5 лапок"),  give:{paws:5}},
  {e:"🥣", t:T("Кошачий корм"), give:{boost:"food"}},
  {e:"⚡", t:T("×2 на 10 мин"), give:{turbo:10}},
  {e:"🐾", t:T("10 лапок"), give:{paws:10}},
  {e:"🎁", t:T("Большой сундук"), give:{incomeSec:900, paws:20, boost:"wild"}},
];

/* ---------- Ежедневные задания ---------- */
const QUEST_POOL = [
  {type:"merge",   t:n=>`${T("Соедини котов")} ${n} ${T("раз")}`,        n:[10,20,30]},
  {type:"boxes",   t:n=>`${T("Открой")} ${n} ${T("коробок")}`,           n:[8,15,25]},
  {type:"buy",     t:n=>`${T("Купи")} ${n} ${T("котов в лавке")}`,       n:[3,5,8]},
  {type:"earnSec", t:n=>`${T("Заработай монет:")} ${n}`,          n:[300,600,900], money:true},
  {type:"tap",     t:n=>`${T("Погладь котиков")} ${n} ${T("раз")}`,      n:[15,30]},
  {type:"perfect", t:n=>`${T("Сделай «Отлично!»")} ${n} ${T("раз")}`,    n:[2,4]},
  {type:"combo",   t:n=>`${T("Собери серию ×")}${[0,0,1.2,1.5,2,3][n]}`, n:[3,4]},
  {type:"booster", t:n=>`${T("Используй бустер")} ${n} ${T("раз")}`,     n:[1,2]},
];

/* ---------- Престиж ---------- */
const PRESTIGE_UPG = [
  {id:"wealth", ic:"💰", n:T("Пушистое богатство"), max:20, base:5,  g:1.35, eff:l=>`+${l*5}${T("% ко всему доходу")}`},
  {id:"paws",   ic:"🐾", n:T("Быстрые лапки"),      max:5,  base:8,  g:1.6,  eff:l=>`${T("коробки быстрее на")} ${l*8}%`},
  {id:"luck",   ic:"📦", n:T("Волшебная коробка"),  max:5,  base:10, g:1.8,  eff:l=>`+${l*3}${T("% шанс котика постарше из коробки")}` + (l>=5 ? ` ${T("· иногда выпадает котик")} ${CONFIG.boxRareLevel} ${T("ур.!")}` : ` ${T("· при полной прокачке иногда котик")} ${CONFIG.boxRareLevel} ${T("ур.")}`)},
  {id:"lives",  ic:"💝", n:T("Девять жизней"),      max:3,  base:15, g:2,    eff:l=>`+${l} ${T("бесплатный бустер каждый день")}`},
  {id:"tail",   ic:"✨", n:T("Волшебный хвост"),    max:5,  base:10, g:1.6,  eff:l=>`+${l*5}${T("% шанс «Отлично!»")}`},
];

/* ---------- Недельный сезон ---------- */
const WEEKLY_CHESTS = [
  {need:500,  ic:"🥉", n:T("Бронзовый сундук"), give:{paws:15, incomeSec:300}},
  {need:2000, ic:"🥈", n:T("Серебряный сундук"), give:{paws:30, boost:"nip"}},
  {need:6000, ic:"🥇", n:T("Золотой сундук"),   give:{paws:60, boost:"wild"}},
];

/* ---------- Друзья ---------- */
const INVITE_GIFT = {paws:30, incomeSec:600, boost:"wild"};
