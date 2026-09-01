"use strict";

/* ================================================================
   Ayah — Quran Verse Widget (local rebuild, fully self-owned)
   Data: Quran.com public API. Offline fallback: curated verses.
   ================================================================ */

/* ---------- All 114 surahs: [id, english name, arabic name, ayah count, Meccan?] ---------- */
const SURAH_RAW = [
  [1, "Al-Fatihah", "الفاتحة", 7, true], [2, "Al-Baqarah", "البقرة", 286, false], [3, "Aal-E-Imran", "آل عمران", 200, false],
  [4, "An-Nisa", "النساء", 176, false], [5, "Al-Ma'idah", "المائدة", 120, false], [6, "Al-An'am", "الأنعام", 165, true],
  [7, "Al-A'raf", "الأعراف", 206, true], [8, "Al-Anfal", "الأنفال", 75, false], [9, "At-Tawbah", "التوبة", 129, false],
  [10, "Yunus", "يونس", 109, true], [11, "Hud", "هود", 123, true], [12, "Yusuf", "يوسف", 111, true],
  [13, "Ar-Ra'd", "الرعد", 43, true], [14, "Ibrahim", "إبراهيم", 52, true], [15, "Al-Hijr", "الحجر", 99, true],
  [16, "An-Nahl", "النحل", 128, true], [17, "Al-Isra", "الإسراء", 111, true], [18, "Al-Kahf", "الكهف", 110, true],
  [19, "Maryam", "مريم", 98, true], [20, "Ta-Ha", "طه", 135, true], [21, "Al-Anbiya", "الأنبياء", 112, true],
  [22, "Al-Hajj", "الحج", 78, false], [23, "Al-Mu'minun", "المؤمنون", 118, true], [24, "An-Nur", "النور", 64, false],
  [25, "Al-Furqan", "الفرقان", 77, true], [26, "Ash-Shu'ara", "الشعراء", 227, true], [27, "An-Naml", "النمل", 93, true],
  [28, "Al-Qasas", "القصص", 88, true], [29, "Al-Ankabut", "العنكبوت", 69, true], [30, "Ar-Rum", "الروم", 60, true],
  [31, "Luqman", "لقمان", 34, true], [32, "As-Sajdah", "السجدة", 30, true], [33, "Al-Ahzab", "الأحزاب", 73, false],
  [34, "Saba", "سبأ", 54, true], [35, "Fatir", "فاطر", 45, true], [36, "Ya-Sin", "يس", 83, true],
  [37, "As-Saffat", "الصافات", 182, true], [38, "Sad", "ص", 88, true], [39, "Az-Zumar", "الزمر", 75, true],
  [40, "Ghafir", "غافر", 85, true], [41, "Fussilat", "فصلت", 54, true], [42, "Ash-Shura", "الشورى", 53, true],
  [43, "Az-Zukhruf", "الزخرف", 89, true], [44, "Ad-Dukhan", "الدخان", 59, true], [45, "Al-Jathiyah", "الجاثية", 37, true],
  [46, "Al-Ahqaf", "الأحقاف", 35, true], [47, "Muhammad", "محمد", 38, false], [48, "Al-Fath", "الفتح", 29, false],
  [49, "Al-Hujurat", "الحجرات", 18, false], [50, "Qaf", "ق", 45, true], [51, "Adh-Dhariyat", "الذاريات", 60, true],
  [52, "At-Tur", "الطور", 49, true], [53, "An-Najm", "النجم", 62, true], [54, "Al-Qamar", "القمر", 55, true],
  [55, "Ar-Rahman", "الرحمن", 78, true], [56, "Al-Waqi'ah", "الواقعة", 96, true], [57, "Al-Hadid", "الحديد", 29, false]
];

const SURAHS = SURAH_RAW.map(([id, name, arabic, ayahCount, meccan]) => ({ id, name, arabic, ayahCount, meccan }));
const SURAH_RAW_2 = [
  [58, "Al-Mujadila", "المجادلة", 22, false], [59, "Al-Hashr", "الحشر", 24, false], [60, "Al-Mumtahanah", "الممتحنة", 13, false],
  [61, "As-Saff", "الصف", 14, false], [62, "Al-Jumu'ah", "الجمعة", 11, false], [63, "Al-Munafiqun", "المنافقون", 11, false],
  [64, "At-Taghabun", "التغابن", 18, false], [65, "At-Talaq", "الطلاق", 12, false], [66, "At-Tahrim", "التحريم", 12, false],
  [67, "Al-Mulk", "الملك", 30, true], [68, "Al-Qalam", "القلم", 52, true], [69, "Al-Haqqah", "الحاقة", 52, true],
  [70, "Al-Ma'arij", "المعارج", 44, true], [71, "Nuh", "نوح", 28, true], [72, "Al-Jinn", "الجن", 28, true],
  [73, "Al-Muzzammil", "المزمل", 20, true], [74, "Al-Muddaththir", "المدثر", 56, true], [75, "Al-Qiyamah", "القيامة", 40, true],
  [76, "Al-Insan", "الإنسان", 31, true], [77, "Al-Mursalat", "المرسلات", 50, true], [78, "An-Naba", "النبأ", 40, true],
  [79, "An-Nazi'at", "النازعات", 46, true], [80, "Abasa", "عبس", 42, true], [81, "At-Takwir", "التكوير", 29, true],
  [82, "Al-Infitar", "الانفطار", 19, true], [83, "Al-Mutaffifin", "المطففين", 36, true], [84, "Al-Inshiqaq", "الانشقاق", 25, true],
  [85, "Al-Buruj", "البروج", 22, true], [86, "At-Tariq", "الطارق", 17, true], [87, "Al-A'la", "الأعلى", 19, true],
  [88, "Al-Ghashiyah", "الغاشية", 26, true], [89, "Al-Fajr", "الفجر", 30, true], [90, "Al-Balad", "البلد", 20, true],
  [91, "Ash-Shams", "الشمس", 15, true], [92, "Al-Layl", "الليل", 21, true], [93, "Ad-Duhaa", "الضحى", 11, true],
  [94, "Ash-Sharh", "الشرح", 8, true], [95, "At-Tin", "التين", 8, true], [96, "Al-Alaq", "العلق", 19, true],
  [97, "Al-Qadr", "القدر", 5, true], [98, "Al-Bayyinah", "البينة", 8, false], [99, "Az-Zalzalah", "الزلزلة", 8, true],
  [100, "Al-Adiyat", "العاديات", 11, true], [101, "Al-Qari'ah", "القارعة", 11, true], [102, "At-Takathur", "التكاثر", 8, true],
  [103, "Al-Asr", "العصر", 3, true], [104, "Al-Humazah", "الهمزة", 9, true], [105, "Al-Fil", "الفيل", 5, true],
  [106, "Quraysh", "قريش", 4, true], [107, "Al-Ma'un", "الماعون", 7, true], [108, "Al-Kawthar", "الكوثر", 3, true],
  [109, "Al-Kafirun", "الكافرون", 6, true], [110, "An-Nasr", "النصر", 3, false], [111, "Al-Masad", "المسد", 5, true],
  [112, "Al-Ikhlas", "الإخلاص", 4, true], [113, "Al-Falaq", "الفلق", 5, true], [114, "An-Nas", "الناس", 6, true]
];
SURAHS.push(...SURAH_RAW_2.map(([id, name, arabic, ayahCount, meccan]) => ({ id, name, arabic, ayahCount, meccan })));
/* ---------- Offline fallback verses (Arabic simplified + English translation) ---------- */
const FALLBACK = {
  "1:1":  { ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
  "1:2":  { ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            en: "All praise is due to Allah, Lord of the worlds." },
  "1:5":  { ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
            en: "It is You we worship and You we ask for help." },
  "2:152":{ ar: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ",
            en: "So remember Me; I will remember you. And be grateful to Me and do not deny Me." },
  "2:153":{ ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
            en: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient." },
  "2:185":{ ar: "شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ وَبَيِّنَاتٍ مِّنَ الْهُدَىٰ وَالْفُرْقَانِ",
            en: "The month of Ramadan is that in which was revealed the Qur'an — a guidance for the people and clear proofs of guidance and the criterion." },
  "2:186":{ ar: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
            en: "And when My servants ask you concerning Me — indeed I am near. I respond to the invocation of the supplicant when he calls upon Me." },
  "2:255":{ ar: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
            en: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great." },
  "2:286":{ ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ",
            en: "Allah does not charge a soul except with what it can bear. It will have the consequence of what good it has gained, and it will bear the consequence of what evil it has earned." },
  "3:139":{ ar: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ",
            en: "So do not weaken and do not grieve, and you will be superior if you are true believers." },
  "3:173":{ ar: "الَّذِينَ قَالَ لَهُمُ النَّاسُ إِنَّ النَّاسَ قَدْ جَمَعُوا لَكُمْ فَاخْشَوْهُمْ فَزَادَهُمْ إِيمَانًا وَقَالُوا حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
            en: "Those to whom people said: Indeed, the people have gathered against you, so fear them. But it increased them in faith, and they said: Allah is sufficient for us, and He is the best Disposer of affairs." },
  "13:28":{ ar: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
            en: "Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured." }
};
const FALLBACK_2 = {
  "20:14":{ ar: "إِنَّنِي أَنَا اللَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدْنِي وَأَقِمِ الصَّلَاةَ لِذِكْرِي",
            en: "Indeed, I am Allah. There is no deity except Me, so worship Me and establish prayer for My remembrance." },
  "21:87":{ ar: "لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
            en: "There is no deity except You, exalted are You. Indeed, I have been of the wrongdoers." },
  "36:82":{ ar: "إِنَّمَا أَمْرُهُ إِذَا أَرَادَ شَيْئًا أَن يَقُولَ لَهُ كُن فَيَكُونُ",
            en: "His command is only when He intends a thing that He says to it: Be, and it is." },
  "39:53":{ ar: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ",
            en: "Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful." },
  "40:60":{ ar: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
            en: "And your Lord says: Call upon Me; I will respond to you." },
  "50:16":{ ar: "وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
            en: "And We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein." },
  "55:13":{ ar: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
            en: "So which of the favors of your Lord would you deny?" },
  "65:3": { ar: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
            en: "And will provide for him from where he does not expect. And whoever relies upon Allah — then He is sufficient for him." },
  "94:5": { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
            en: "For indeed, with hardship comes ease." },
  "94:6": { ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
            en: "Indeed, with hardship comes ease." },
  "103:1":{ ar: "وَالْعَصْرِ",
            en: "By time," },
  "103:2":{ ar: "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",
            en: "Indeed, mankind is in loss," },
  "103:3":{ ar: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
            en: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience." },
  "112:1":{ ar: "قُلْ هُوَ اللَّهُ أَحَدٌ",
            en: "Say: He is Allah, who is One," },
  "112:2":{ ar: "اللَّهُ الصَّمَدُ",
            en: "Allah, the Eternal Refuge." },
  "112:3":{ ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
            en: "He neither begets nor is born," },
  "112:4":{ ar: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
            en: "Nor is there to Him any equivalent." },
  "113:1":{ ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
            en: "Say: I seek refuge in the Lord of the daybreak," },
  "114:1":{ ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
            en: "Say: I seek refuge in the Lord of mankind," }
};
Object.assign(FALLBACK, FALLBACK_2);
FALLBACK_2.length = 0;
/* ================================================================
   Logic
   ================================================================ */

/* ---------- Constants ---------- */
const API_BASE = "https://api.quran.com/api/v4";
const TRANS_ID = 20; // Saheeh International translation
const LS_MEMORIZED = "ayah.memorized.v1";
const LS_LAST = "ayah.lastVerse.v1";
const LS_VERSECACHE = "ayah.verseCache.v1";
const AUDIO_BASE = "https://verses.quran.com/";
const LS_RECITER = "ayah.reciter.v1";
const LS_AUDIOCACHE = "ayah.audioCache.v2"; // v2: invalidates broken mirror URLs cached by older versions
const LS_AUTO = "ayah.auto.v1";
const LS_REPEAT = "ayah.repeat.v1";
const LS_SPEED = "ayah.speed.v1";
const LS_VERSION = "ayah.version.v1";
const LS_NAV_AT = "ayah.lastNavAt.v1";
const APP_VERSION = "v20"; // keep in sync with sw.js VERSION
const LS_DISPLAY = "ayah.display.v1";
const LS_TAFSIRCACHE = "ayah.tafsirCache.v1";
// Declared here, not in the sync section: `state` reads them at line ~224,
// long before the sync section at the bottom would execute (TDZ crash otherwise).
const LS_SYNC_META = "ayah.syncMeta.v1";
const LS_SYNC_ON = "ayah.syncOn.v1";
const LS_SYNC_TOKEN = "ayah.syncToken.v1";
const TAFSIR_ID = 169; // Ibn Kathir (Abridged) — English

/* ---------- Recitations (Quran.com audio reciters) ---------- */
const RECITERS = [
  { id: 7,  name: "Mishari Rashid al-`Afasy" },
  { id: 2,  name: "AbdulBaset AbdulSamad (Murattal)" },
  { id: 1,  name: "AbdulBaset AbdulSamad (Mujawwad)" },
  { id: 3,  name: "Abdur-Rahman as-Sudais" },
  { id: 4,  name: "Abu Bakr al-Shatri" },
  { id: 6,  name: "Mahmoud Khalil Al-Husary" },
  { id: 12, name: "Mahmoud Khalil Al-Husary (Muallim)" },
  { id: 9,  name: "Mohamed Siddiq al-Minshawi (Murattal)" },
  { id: 8,  name: "Mohamed Siddiq al-Minshawi (Mujawwad)" },
  { id: 10, name: "Sa`ud ash-Shuraym" },
  { id: 5,  name: "Hani ar-Rifai" },
  { id: 11, name: "Mohamed al-Tablawi" }
];

/* ---------- Global verse index across the whole Qur'an (1..6236) ---------- */
const OFFSETS = [];
{
  let acc = 0;
  for (const s of SURAHS) {
    OFFSETS.push(acc);
    acc += s.ayahCount;
  }
}
const TOTAL_VERSES = accChecker();

function accChecker() {
  let total = 0;
  for (const s of SURAHS) total += s.ayahCount;
  return total;
}

/* ---------- Verse key <-> global index ---------- */
function parseKey(key) {
  const [c, a] = key.split(":").map(Number);
  return { chapter: c, ayah: a };
}
function keyFromIndex(index) {
  const i = Math.max(0, Math.min(TOTAL_VERSES - 1, index));
  let chapter = 0;
  while (chapter < 113 && OFFSETS[chapter + 1] <= i) chapter++;
  return { key: `${chapter + 1}:${i - OFFSETS[chapter] + 1}`, index: i };
}
function indexFromKey(key) {
  const { chapter, ayah } = parseKey(key);
  return OFFSETS[chapter - 1] + ayah - 1;
}
function surahById(id) {
  return SURAHS.find((s) => s.id === id) || SURAHS[0];
}
function surahNameFor(key) {
  return surahById(parseKey(key).chapter).name;
}

/* ---------- Local storage helpers ---------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* full disk etc. */ }
}

/* ---------- State ---------- */
const state = {
  view: "read",
  currentKey: "1:1",
  memorized: new Set(loadJSON(LS_MEMORIZED, [])),
  installed: false,
  deferredPrompt: null,
  chapterExpanded: null,
  chapterCache: {},
  reciterId: Number(loadJSON(LS_RECITER, 7)),
  audioCache: loadJSON(LS_AUDIOCACHE, {}),
  autoPlay: loadJSON(LS_AUTO, false),
  repeat: Number(loadJSON(LS_REPEAT, 1)),
  repeatCount: 0,
  speed: Number(loadJSON(LS_SPEED, 1)),
  display: loadJSON(LS_DISPLAY, ["en"]),
  tafsirCache: loadJSON(LS_TAFSIRCACHE, {}),
  syncOn: loadJSON(LS_SYNC_ON, true),
  syncMeta: loadJSON(LS_SYNC_META, { savedAt: 0, deviceId: null }),
  syncToken: loadJSON(LS_SYNC_TOKEN, ""),
  lastNavAt: Number(loadJSON(LS_NAV_AT, 0)),
  syncBusy: false
};

/* ---------- DOM refs ---------- */
const $ = (sel) => document.querySelector(sel);
const dom = {
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  memCount: $("#memCount"),
  memHeadline: $("#memHeadline"),
  memSub: $("#memSub"),
  memList: $("#memList"),
  surahList: $("#surahList"),
  surahSearch: $("#surahSearch"),
  readCard: $("#readCard"),
  readSurah: $("#readSurah"),
  readKey: $("#readKey"),
  readArabic: $("#readArabic"),
  readTranslation: $("#readTranslation"),
  readMeta: $("#readMeta"),
  btnMemorize: $("#btnMemorize"),
  memLabel: $("#memLabel"),
  btnPrev: $("#btnPrev"),
  btnNext: $("#btnNext"),
  btnShuffle: $("#btnShuffle"),
  btnQuranCom: $("#btnQuranCom"),
  installBtn: $("#installBtn"),
  toast: $("#toast"),
  refreshBtn: $("#refreshBtn"),
  readSurahSelect: $("#readSurahSelect"),
  readAyahSelect: $("#readAyahSelect"),
  reciterSelect: $("#reciterSelect"),
  btnPlay: $("#btnPlay"),
  playIcon: $("#playIcon"),
  pauseIcon: $("#pauseIcon"),
  audioFill: $("#audioFill"),
  audioEl: $("#audioEl"),
  btnAuto: $("#btnAuto"),
  repeatSelect: $("#repeatSelect"),
  speedSelect: $("#speedSelect"),
  dispEn: $("#dispEn"),
  dispAr: $("#dispAr"),
  dispTafsir: $("#dispTafsir"),
  readTafsir: $("#readTafsir"),
  syncNow: $("#syncNow"),
  syncSetup: $("#syncSetup"),
  syncPanel: $("#syncPanel"),
  syncToken: $("#syncToken"),
  syncSave: $("#syncSave"),
  syncTest: $("#syncTest"),
  syncStatus: $("#syncStatus"),
  appVersion: $("#appVersion")
};

/* ---------- Toast helper ---------- */
let toastTimer = null;
let navPending = false; // true only when a REAL user action changed the verse
function toast(msg) {
  dom.toast && (dom.toast.textContent = msg);
  dom.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 2200);
}

function toggleDisplay(key) {
  // backwards-compat: older saved strings like "translation" / "all"
  let arr = Array.isArray(state.display) ? state.display.slice() : ["en", "ar", "tafsir"];
  if (arr.includes(key)) {
    arr = arr.filter((k) => k !== key);
  } else {
    arr.push(key);
  }
  state.display = arr;
  saveJSON(LS_DISPLAY, state.display);
  queuePush();
  renderRead();
}

function refreshDisplayCheckboxes() {
  const v = state.display || [];
  dom.dispEn.checked = v.includes("en");
  dom.dispAr.checked = v.includes("ar");
  dom.dispTafsir.checked = v.includes("tafsir");
}

function trimCache(obj, max) {
  const keys = Object.keys(obj);
  if (keys.length > max) delete obj[keys[0]];
}

/* Strip footnote markers (e.g. <sup foot_note=…>1</sup>) and flatten
   HTML into readable paragraphs. Returns plain text (safe for textContent). */
function htmlToText(html, cap) {
  if (!html) return "";
  const t = html
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")                 // footnote superscripts
    .replace(/<(h[1-6]|p|li|br|div|tr)[^>]*>/gi, "\n")     // block elements -> newlines
    .replace(/<[^>]+>/g, "");                                // any remaining tags
  const d = document.createElement("div");
  d.innerHTML = t; // decode HTML entities safely
  const lines = (d.textContent || "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  let out = lines.join("\n\n");
  if (cap && out.length > cap) out = out.slice(0, cap).trimEnd() + "…";
  return out;
}
/* ================================================================
   Verse data loading (Quran.com API with layered offline fallback)
   ================================================================ */
const verseCache = loadJSON(LS_VERSECACHE, {});

async function fetchVerse(key) {
  const url = `${API_BASE}/verses/by_key/${key}?translations=${TRANS_ID}&fields=text_imlaei`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("API error " + res.status);
  const json = await res.json();
  const v = json.verse;
  return {
    ar: v.text_imlaei || v.text_uthmani || "",
    en: (v.translations && v.translations[0] && v.translations[0].text) || "",
    meta: `${surahNameFor(key)} • ${v.verse_key}`
  };
}

async function loadVerse(key) {
  // 1) memory / localStorage cache
  if (verseCache[key]) return verseCache[key];
  // 2) network (Quran.com)
  try {
    const data = await fetchVerse(key);
    verseCache[key] = data;
    saveJSON(LS_VERSECACHE, verseCache); // keep at most ~400 entries
    const keys = Object.keys(verseCache);
    if (keys.length > 400) {
      delete verseCache[keys[0]];
      saveJSON(LS_VERSECACHE, verseCache);
    }
    return data;
  } catch (err) {
    // 3) curated offline fallback
    const fb = FALLBACK[key];
    if (fb) return { ar: fb.ar, en: fb.en, meta: `${surahNameFor(key)} • ${key}` };
    throw err;
  }
}

/* ---------- Tafsir (Ibn Kathir) ---------- */
async function loadTafsir(key) {
  if (state.tafsirCache[key]) return state.tafsirCache[key];
  try {
    const url = `${API_BASE}/tafsirs/${TAFSIR_ID}/by_ayah/${key}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("tafsir " + res.status);
    const json = await res.json();
    const txt = htmlToText(json.tafsir && json.tafsir.text, 7000);
    if (!txt) throw new Error("empty tafsir");
    state.tafsirCache[key] = txt;
    saveJSON(LS_TAFSIRCACHE, state.tafsirCache);
    trimCache(state.tafsirCache, 60);
    return txt;
  } catch {
    return null;
  }
}

/* ================================================================
   Read view
   ================================================================ */
let readToken = 0;

function updateMemButton() {
  const isMem = state.memorized.has(state.currentKey);
  dom.btnMemorize.classList.toggle("is-on", isMem);
  dom.btnMemorize.setAttribute("aria-pressed", String(isMem));
  dom.memLabel.textContent = isMem ? "Memorized ✓" : "Memorize";
}

async function renderRead() {
  const key = state.currentKey;
  const token = ++readToken;
  dom.readCard.classList.add("is-loading");
  dom.readArabic.textContent = "…";
  dom.readTranslation.textContent = "Loading verse…";
  dom.readMeta.textContent = "";
  dom.readSurah.textContent = surahNameFor(key);
  dom.readKey.textContent = key;
  dom.btnQuranCom.href = `https://quran.com/${key}`;
  const chap = parseKey(key).chapter;
  if (String(dom.readSurahSelect.value) !== String(chap)) {
    dom.readSurahSelect.value = String(chap);
    populateAyahSelect(chap);
  }
  dom.readAyahSelect.value = String(parseKey(key).ayah);
  updateMemButton();

  const wantTrans = state.display.includes("en");
  const wantTafsir = state.display.includes("tafsir");
  const wantAr = state.display.includes("ar");
  dom.readArabic.hidden = !wantAr;
  dom.readTranslation.hidden = !wantTrans;
  dom.readTafsir.hidden = !wantTafsir;
  if (!wantAr && !wantTrans && !wantTafsir) {
    dom.readMeta.textContent = "Nothing selected — tick Arabic, English or Tafsir above.";
  }

  try {
    const data = await loadVerse(key);
    if (token !== readToken) return; // stale response
    if (data.ar) {
      dom.readArabic.textContent = data.ar;
      const badge = document.createElement("span");
      badge.className = "ayah-badge";
      badge.textContent = String(parseKey(key).ayah); // Western numerals
      dom.readArabic.appendChild(badge);
    } else {
      dom.readArabic.textContent = "—";
    }
    if (wantTrans) {
      dom.readTranslation.textContent = htmlToText(data.en).trim();
      dom.readMeta.textContent = data.en
        ? `Translation: Saheeh International`
        : ((data.ar || data.en) ? "" : "Offline: showing the saved verse.");
    } else if (!wantAr && !wantTafsir) {
      dom.readMeta.textContent = "Nothing selected — tick Arabic, English or Tafsir above.";
    } else {
      dom.readMeta.textContent = "";
    }

    // Tafsir (only when asked for) — loaded separately so it never blocks the verse
    if (wantTafsir) {
      dom.readTafsir.hidden = false;
      dom.readTafsir.innerHTML = '<div class="tf-head">Tafsir · Ibn Kathir</div><p>Loading…</p>';
      loadTafsir(key).then((txt) => {
        if (token !== readToken) return;
        dom.readTafsir.innerHTML = "";
        const head = document.createElement("div");
        head.className = "tf-head";
        head.textContent = "Tafsir · Ibn Kathir";
        const body = document.createElement("p");
        body.textContent = txt || "Tafsir unavailable offline.";
        dom.readTafsir.appendChild(head);
        dom.readTafsir.appendChild(body);
      });
    }
  } catch (err) {
    if (token !== readToken) return;
    dom.readArabic.textContent = "—";
    if (wantTrans) dom.readTranslation.textContent = "Couldn't load this verse (offline, no saved copy).";
  } finally {
    if (token === readToken) dom.readCard.classList.remove("is-loading");
  }
  // Only a REAL user navigation counts as "last read". The daily verse and
  // restored positions are never pushed, so an idle/fresh device can never
  // clobber the position of the device you're actually reading on.
  if (navPending) {
    navPending = false;
    saveJSON(LS_LAST, key);
    state.lastNavAt = Date.now();
    saveJSON(LS_NAV_AT, state.lastNavAt);
    queuePush(); // last-read position follows you across devices
  }
  if (state.view === "read") updateMemButton();
  refreshAudio(key); // fire-and-forget; doesn't block the verse display
}

function populateSurahSelect() {
  const sel = dom.readSurahSelect;
  sel.innerHTML = "";
  for (const s of SURAHS) {
    const opt = document.createElement("option");
    opt.value = String(s.id);
    opt.textContent = `${s.id}. ${s.name}`;
    sel.appendChild(opt);
  }
}

function populateAyahSelect(chapterId) {
  const s = surahById(chapterId);
  const sel = dom.readAyahSelect;
  sel.innerHTML = "";
  for (let a = 1; a <= s.ayahCount; a++) {
    const opt = document.createElement("option");
    opt.value = String(a);
    opt.textContent = String(a);
    sel.appendChild(opt);
  }
}

function populateReciterSelect() {
  const sel = dom.reciterSelect;
  sel.innerHTML = "";
  for (const r of RECITERS) {
    const opt = document.createElement("option");
    opt.value = String(r.id);
    opt.textContent = r.name;
    sel.appendChild(opt);
  }
  sel.value = String(state.reciterId);
}

/* ---------- Recitation audio (like Quran.com) ---------- */
async function loadAudioUrl(key, reciterId) {
  const ck = `${reciterId}:${key}`;
  if (state.audioCache[ck]) return state.audioCache[ck];
  const url = `${API_BASE}/verses/by_key/${key}?audio=${reciterId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("audio api " + res.status);
  const json = await res.json();
  const rel = json.verse && json.verse.audio && json.verse.audio.url;
  if (!rel) throw new Error("no audio url");
  // The API returns three shapes: plain CDN paths ("Alafasy/mp3/…"),
  // protocol-relative mirrors ("//mirrors.quranicaudio.com/…") and
  // occasionally absolute URLs. Handle all three or playback breaks.
  const relStr = String(rel).trim();
  let full;
  if (relStr.startsWith("//")) full = "https:" + relStr;
  else if (/^https?:\/\//i.test(relStr)) full = relStr;
  else full = AUDIO_BASE + relStr;
  state.audioCache[ck] = full;
  saveJSON(LS_AUDIOCACHE, state.audioCache);
  trimCache(state.audioCache, 400);
  return full;
}

async function refreshAudio(key) {
  const btn = dom.btnPlay;
  btn.disabled = true;
  dom.audioFill.style.width = "0%";
  const currentSrc = dom.audioEl.src;
  const wasPlaying = !dom.audioEl.paused && !dom.audioEl.ended && currentSrc;
  try {
    const url = await loadAudioUrl(key, state.reciterId);
    btn.dataset.url = url;
    btn.disabled = false;
    btn.title = "Play verse recitation";
    if (wasPlaying) {
      // Navigating to a new verse while audio plays: keep the flow going
      dom.audioEl.src = url;
      dom.audioEl.playbackRate = state.speed;
      dom.audioEl.play().catch(() => {});
      dom.playIcon.style.display = "none";
      dom.pauseIcon.style.display = "";
    } else if (state.autoPlay) {
      // Auto-play on arrival (the user asked for #1)
      dom.audioEl.src = url;
      dom.audioEl.playbackRate = state.speed;
      dom.audioEl.play().catch(() => {
        dom.playIcon.style.display = "";
        dom.pauseIcon.style.display = "none";
      });
    }
    if (state.autoPlay || wasPlaying) {
      dom.playIcon.style.display = "none";
      dom.pauseIcon.style.display = "";
    }
  } catch {
    btn.dataset.url = "";
    btn.title = "Audio unavailable offline";
  }
}

function applySpeed() {
  if (dom.audioEl) dom.audioEl.playbackRate = state.speed;
}
function togglePlay() {
  const el = dom.audioEl;
  const url = dom.btnPlay.dataset.url;
  if (!url) { toast("Audio unavailable offline"); return; }
  if (!el.src || el.paused) {
    if (el.src !== url) el.src = url;
    el.playbackRate = state.speed;
    state.repeatCount = 0;
    el.play().then(() => {
      dom.playIcon.style.display = "none";
      dom.pauseIcon.style.display = "";
    }).catch(() => toast("Playback couldn't start (offline?)"));
  } else {
    el.pause();
    state.repeatCount = 0;
    dom.playIcon.style.display = "";
    dom.pauseIcon.style.display = "none";
  }
}

function goPrev() {
  navPending = true;
  const { index } = keyFromIndex(indexFromKey(state.currentKey));
  state.currentKey = keyFromIndex(index - 1).key;
  renderRead();
}
function goNext() {
  navPending = true;
  const { index } = keyFromIndex(indexFromKey(state.currentKey));
  state.currentKey = keyFromIndex(index + 1).key;
  renderRead();
}
function goShuffle() {
  navPending = true;
  state.currentKey = keyFromIndex(Math.floor(Math.random() * TOTAL_VERSES)).key;
  renderRead();
}
function toggleMemorize() {
  const key = state.currentKey;
  if (state.memorized.has(key)) {
    state.memorized.delete(key);
    toast("Removed from memorized");
  } else {
    state.memorized.add(key);
    toast("Marked as memorized ★");
  }
  saveJSON(LS_MEMORIZED, [...state.memorized]);
  queuePush();
  updateMemButton();
  renderMemorized();
}
/* ================================================================
   Browse view
   ================================================================ */
let browseToken = 0;

function renderBrowse(filter) {
  const query = (filter || "").trim().toLowerCase();
  const list = dom.surahList;
  list.innerHTML = "";

  const surahs = SURAHS.filter((s) => {
    if (!query) return true;
    return (
      s.name.toLowerCase().includes(query) ||
      s.arabic.includes(query) ||
      String(s.id) === query
    );
  });

  if (!surahs.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "No surah found.";
    list.appendChild(li);
    return;
  }

  for (const s of surahs) {
    const li = document.createElement("li");
    li.className = "surah-item";
    li.setAttribute("role", "button");
    li.setAttribute("tabindex", "0");
    li.innerHTML = `
      <span class="surah-num">${s.id}</span>
      <span class="surah-en">${s.name}</span>
      <span class="surah-ar">${s.arabic}</span>
      <span class="surah-count">${s.ayahCount} ayahs</span>
    `;

    const open = () => toggleChapter(s, li);
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });

    // Expandable ayah picker
    const picker = document.createElement("div");
    picker.className = "ayah-picker";
    picker.style.display = "none";
    li.appendChild(picker);
    list.appendChild(li);
  }
}

async function toggleChapter(surah, li) {
  const picker = li.querySelector(".ayah-picker");
  const isOpen = picker.style.display !== "none";
  picker.style.display = "none";
  if (isOpen) {
    li.classList.remove("surah-open");
    return;
  }

  li.classList.add("surah-open");
  if (picker.dataset.loaded === "1") {
    picker.style.display = "flex";
    return;
  }

  picker.innerHTML = '<span class="surah-count">Loading ayahs…</span>';
  picker.style.display = "flex";
  picker.dataset.loaded = "1";

  const token = ++browseToken;
  try {
    const keys = await getChapterKeys(surah.id);
    if (token !== browseToken) return;
    picker.innerHTML = "";
    for (const key of keys) {
      const chip = document.createElement("button");
      chip.className = "ayah-chip" + (state.memorized.has(key) ? " is-mem" : "");
      chip.textContent = String(parseKey(key).ayah);
      chip.title = `Go to ${surah.name} ${key.split(":")[1]}`;
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        navPending = true;
        state.currentKey = key;
        setView("read");
      });
      picker.appendChild(chip);
    }
  } catch {
    if (token !== browseToken) return;
    picker.innerHTML = '<span class="error-note">Couldn’t load ayahs offline.</span>';
  }
}

async function getChapterKeys(chapterId) {
  if (state.chapterCache[chapterId]) return state.chapterCache[chapterId];
  const s = surahById(chapterId);
  const keys = [];
  let page = 1;
  const per = 100;
  while (keys.length < s.ayahCount) {
    const url = `${API_BASE}/verses/by_chapter/${chapterId}?per_page=${per}&page=${page}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("API error " + res.status);
    const json = await res.json();
    const verses = json.verses || [];
    if (!verses.length) break;
    for (const v of verses) keys.push(v.verse_key);
    if (keys.length >= s.ayahCount) break;
    page++;
  }
  state.chapterCache[chapterId] = keys;
  return keys;
}

/* ================================================================
   Memorized view
   ================================================================ */
function renderMemorized() {
  const keys = [...state.memorized].sort((a, b) => indexFromKey(a) - indexFromKey(b));
  dom.memCount.textContent = keys.length;
  dom.memHeadline.textContent =
    keys.length === 1 ? "1 ayah memorized" : `${keys.length} ayahs memorized`;
  dom.memSub.textContent =
    keys.length ? "Keep going — review them anytime." : "Mark verses to build your list.";
  dom.memList.innerHTML = "";

  if (!keys.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.innerHTML = '<span class="big">🕌</span>Nothing memorized yet.<br/>Tap ★ on any verse to save it here.';
    dom.memList.appendChild(li);
    return;
  }

  for (const key of keys) {
    const li = document.createElement("li");
    const { chapter, ayah } = parseKey(key);
    const s = surahById(chapter);
    const cached = verseCache[key];
    li.className = "mem-item";
    li.innerHTML = `
      <span class="mem-key">${s.id}:${ayah}</span>
      <span class="mem-meaning">${cached ? escaped(cached.ar) : s.name}</span>
      <button class="mem-unmem" title="Remove from memorized" aria-label="Remove ${key}">✕</button>
    `;
    const chip = li.querySelector(".mem-meaning");
    const label = document.createElement("span");
    label.className = "mem-meta";
    label.textContent = s.name;
    li.insertBefore(label, chip);
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("mem-unmem")) {
        state.memorized.delete(key);
        saveJSON(LS_MEMORIZED, [...state.memorized]);
        renderMemorized();
        toast("Removed from memorized");
      } else {
        state.currentKey = key;
        setView("read");
      }
    });
    dom.memList.appendChild(li);
  }
}

function escaped(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
/* ================================================================
   View switching + events
   ================================================================ */
function setView(name) {
  state.view = name;
  dom.tabs.forEach((t) => {
    const on = t.dataset.view === name;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", String(on));
  });
  dom.views.forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));

  if (name === "read") renderRead();
  if (name === "browse") renderBrowse(dom.surahSearch.value);
  if (name === "memorized") renderMemorized();
}

function wireEvents() {
  dom.tabs.forEach((t) =>
    t.addEventListener("click", () => setView(t.dataset.view))
  );

  dom.btnPrev.addEventListener("click", goPrev);
  dom.btnNext.addEventListener("click", goNext);
  dom.btnShuffle.addEventListener("click", goShuffle);
  dom.btnMemorize.addEventListener("click", toggleMemorize);
  dom.btnQuranCom.addEventListener("click", () => {
    window.open(`https://quran.com/${state.currentKey}`, "_blank", "noopener");
  });

  // Keyboard arrows for quick reading
  document.addEventListener("keydown", (e) => {
    if (state.view !== "read") return;
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
  });

  // Browse search
  dom.surahSearch.addEventListener("input", (e) => renderBrowse(e.target.value));

  // Surah / ayah selector on Read
  dom.readSurahSelect.addEventListener("change", () => {
    const chap = Number(dom.readSurahSelect.value);
    populateAyahSelect(chap);
    navPending = true;
    state.currentKey = `${chap}:1`;
    renderRead();
  });
  dom.readAyahSelect.addEventListener("change", () => {
    navPending = true;
    state.currentKey = `${dom.readSurahSelect.value}:${dom.readAyahSelect.value}`;
    renderRead();
  });

  // Audio — playback continues / repeat / auto-advance
  dom.btnPlay.addEventListener("click", togglePlay);
  dom.reciterSelect.addEventListener("change", () => {
    state.reciterId = Number(dom.reciterSelect.value);
    saveJSON(LS_RECITER, state.reciterId);
    state.audioCache = {};
    saveJSON(LS_AUDIOCACHE, state.audioCache);
    queuePush();
    renderRead();
  });
  dom.btnAuto.addEventListener("click", () => {
    state.autoPlay = !state.autoPlay;
    saveJSON(LS_AUTO, state.autoPlay);
    queuePush();
    dom.btnAuto.classList.toggle("is-on", state.autoPlay);
    dom.btnAuto.setAttribute("aria-pressed", String(state.autoPlay));
    toast(state.autoPlay ? "Auto-play ON — advance to next ayah after audio" : "Auto-play OFF");
  });
  dom.refreshBtn.addEventListener("click", () => checkForUpdates(true));
  dom.repeatSelect.addEventListener("change", () => {
    state.repeat = Number(dom.repeatSelect.value);
    state.repeatCount = 0;
    saveJSON(LS_REPEAT, state.repeat);
    queuePush();
    toast(`Repeat: ${state.repeat}×`);
  });
  dom.speedSelect.addEventListener("change", () => {
    state.speed = Number(dom.speedSelect.value);
    saveJSON(LS_SPEED, state.speed);
    applySpeed();
    queuePush();
    toast(`Playback speed: ${state.speed}×`);
  });
  dom.dispEn.addEventListener("change", () => toggleDisplay("en"));
  dom.dispAr.addEventListener("change", () => toggleDisplay("ar"));
  dom.dispTafsir.addEventListener("change", () => toggleDisplay("tafsir"));

  dom.audioEl.addEventListener("ended", () => {
    if (state.repeat > 1) {
      // Repeat this ayah the chosen number of times first
      state.repeatCount++;
      if (state.repeatCount < state.repeat) {
        dom.audioEl.currentTime = 0;
        dom.audioEl.play().catch(() => {});
        return;
      }
    }
    state.repeatCount = 0; // reset for the next verse
    if (state.autoPlay) {
      goNext(); // continue to the next ayah (#2)
    } else {
      dom.playIcon.style.display = "";
      dom.pauseIcon.style.display = "none";
      dom.audioFill.style.width = "0%";
    }
  });
  dom.audioEl.addEventListener("timeupdate", () => {
    const d = dom.audioEl.duration;
    if (d && isFinite(d)) {
      dom.audioFill.style.width = `${(dom.audioEl.currentTime / d) * 100}%`;
    }
  });

  // Install button for Android / desktop Chrome-style prompts
  dom.installBtn.addEventListener("click", async () => {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      const choice = await state.deferredPrompt.userChoice;
      state.deferredPrompt = null;
      dom.installBtn.hidden = true;
      if (choice.outcome === "accepted") toast("Installed 🎉");
    } else {
      toast("On iPhone: Safari → Share → “Add to Home Screen”");
    }
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    dom.installBtn.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    state.installed = true;
    dom.installBtn.hidden = true;
  });
}

/* ================================================================
   Service worker (progressive enhancement — safe to fail)
   ================================================================ */
function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* ignore — still works without offline */
    });
  });
}

/* ---------- Update / refresh ---------- */
async function fetchRemoteVersion() {
  try {
    const res = await fetch("./sw.js?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/VERSION\s*=\s*"([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null; // offline or blocked
  }
}

async function refreshSW() {
  try {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    await navigator.serviceWorker.getRegistration().then((reg) => reg && reg.update());
  } catch { /* ignore */ }
}

async function checkForUpdates(manual) {
  const remote = await fetchRemoteVersion();
  const local = loadJSON(LS_VERSION, "");
  if (remote) saveJSON(LS_VERSION, remote);

  if (!manual) {
    // Quiet auto-check on launch: keep the service worker pointed at the latest.
    if (remote && remote !== local) refreshSW();
    return;
  }

  const btn = dom.refreshBtn;
  btn.disabled = true;
  btn.classList.add("is-spinning");
  try {
    if (!remote) {
      toast("Offline — can't check for updates");
      return;
    }
    await refreshSW();
    toast(remote !== local ? "New version " + remote + " — refreshing…" : "Up to date — refreshing…");
    setTimeout(() => location.reload(), 650);
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-spinning");
  }
}

/* ================================================================
   Sync (iPhone <-> Mac) — through your own private GitHub repo.
   Backend: lugine/ayah-sync (private) → sync.json via the GitHub
   Contents API, authorized by a personal token YOU paste per device.
   The token lives only in each device's localStorage — never in the
   code. Rules: last-write-wins for settings; memorized stars merge
   as a UNION so a star can never be lost. Fails silent, always.
   ================================================================ */
const GH_API = "https://api.github.com";
const SYNC_REPO = "lugine/ayah-sync";
const SYNC_FILE = "sync.json";
let syncSha = null; // last-known blob sha — compare-and-swap for writes
let lastRemoteMemorized = new Set(); // last set seen in the cloud — pushes never shrink stars
// LS_SYNC_META / LS_SYNC_ON / LS_SYNC_TOKEN live in the top constants block.

function syncReady() { return !!(state.syncOn && state.syncToken); }
function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64decode(str) { return decodeURIComponent(escape(String(str).replace(/\s+/g, ""))); }
function ghHeaders(extra) {
  return Object.assign({
    Authorization: "Bearer " + state.syncToken,
    Accept: "application/vnd.github+json"
  }, extra || {});
}

/* Try to pull a readable reason out of a GitHub API error response. */
async function ghErr(res) {
  try {
    const body = await res.json();
    const msg = (body && (body.message || body.error)) || res.statusText;
    return `${res.status}: ${msg}`;
  } catch {
    return String(res.status);
  }
}
async function syncFail(res, label) {
  const err = await ghErr(res);
  syncStatusMsg(`${label} (${err}) — ⚙ Setup → Test`);
  console.warn("[Ayah sync]", label, err);
}

function deviceId() {
  if (!state.syncMeta.deviceId) {
    state.syncMeta.deviceId = "dev-" + Math.random().toString(36).slice(2, 10);
    saveJSON(LS_SYNC_META, state.syncMeta);
  }
  return state.syncMeta.deviceId;
}
function syncStatusMsg(msg) {
  if (dom.syncStatus) dom.syncStatus.textContent = "Sync: " + msg;
}
function collectSyncPayload() {
  // Union local stars with the last set we saw in the cloud so a push from one
  // device can never erase a star another device added.
  const merged = new Set([...state.memorized, ...lastRemoteMemorized]);
  return {
    memorized: [...merged],
    lastVerse: loadJSON(LS_LAST, null) || undefined, // omit when no real spot
    reciterId: state.reciterId,
    repeat: state.repeat,
    speed: state.speed,
    autoPlay: state.autoPlay,
    display: state.display,
    savedAt: Date.now(),
    device: deviceId()
  };
}
let pushTimer = null;
function queuePush() {
  if (!state.syncOn) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushSync().catch(() => {}), 1500);
}
async function pushSync() {
  if (!syncReady() || state.syncBusy) return false;
  if (typeof fetch !== "function" || typeof btoa !== "function") return false;
  state.syncBusy = true;
  syncStatusMsg("syncing…");
  let ok = false;
  try {
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const body = {
        message: "Ayah sync " + new Date().toISOString(),
        content: b64encode(JSON.stringify(collectSyncPayload())),
        branch: "main"
      };
      if (syncSha) body.sha = syncSha;
      const res = await fetch(`${GH_API}/repos/${SYNC_REPO}/contents/${SYNC_FILE}`, {
        method: "PUT",
        headers: ghHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body)
      });
      if ((res.status === 409 || res.status === 422) && attempt < 2) {
        // Your other device wrote first (409) or we didn't know the sha yet (422):
        // pull the latest, union-merge locally, retry with the fresh sha.
        syncSha = null;
        const remote = await pullSync(false);
        if (remote) applyRemote(remote, false);
        continue;
      }
      if (res.status === 401) { await syncFail(res, "✗ token invalid or revoked"); break; }
      if (res.status === 403) { await syncFail(res, "✗ token can't write (needs Contents Read+write)"); break; }
      if (res.status === 404) {
        await syncFail(res, "✗ no access to the sync repo — re-create token & select 'ayah-sync'");
        break;
      }
      if (!res.ok) { await syncFail(res, "✗ sync failed"); break; }
      const done = await res.json();
      if (done && done.content && done.content.sha) syncSha = done.content.sha;
      state.syncMeta.savedAt = Date.now();
      saveJSON(LS_SYNC_META, state.syncMeta);
      const t = new Date();
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      syncStatusMsg("synced " + hh + ":" + mm);
      ok = true;
    }
  } catch (e) {
    syncStatusMsg("network error (" + (e && e.message ? e.message : "fetch failed") + ") — will retry");
  } finally {
    state.syncBusy = false;
  }
  return ok;
}
async function pullSync(applyPosition) {
  if (!syncReady() || typeof fetch !== "function") return null;
  try {
    const res = await fetch(`${GH_API}/repos/${SYNC_REPO}/contents/${SYNC_FILE}?t=${Date.now()}`, {
      headers: ghHeaders()
    });
    if (res.status === 404) {
      // GitHub returns 404 both when the file doesn't exist yet AND when the
      // token can't see the private repo. Probe the repo endpoint to tell apart.
      try {
        const rp = await fetch(`${GH_API}/repos/${SYNC_REPO}`, { headers: ghHeaders() });
        if (rp.ok) { syncSha = null; return null; } // repo visible → file not created yet; we'll create it
      } catch { /* fall through to the warning below */ }
      await syncFail(res, "✗ token can't access the sync repo — re-create token & select 'ayah-sync'");
      return null;
    }
    if (res.status === 401) { await syncFail(res, "✗ token invalid or revoked"); return null; }
    if (res.status === 403) { await syncFail(res, "✗ token can't read (needs Contents access)"); return null; }
    if (!res.ok) { await syncFail(res, "✗ pull failed"); return null; }
    const meta = await res.json();
    syncSha = meta.sha || null;
    let remote = null;
    try { remote = JSON.parse(b64decode(meta.content || "")); } catch { remote = null; }
    if (remote && typeof remote === "object") {
      applyRemote(remote, applyPosition);
      const t = new Date();
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      syncStatusMsg("synced " + hh + ":" + mm);
      return remote;
    }
    return null;
  } catch (e) {
    syncStatusMsg("network error (" + (e && e.message ? e.message : "fetch failed") + ") — will retry");
    return null;
  }
}

/* Diagnose a saved token against GitHub, step by step. Safe: the probe file
   it creates is deleted immediately after. */
async function syncTest() {
  if (!state.syncToken) { syncStatusMsg("paste a token first — ⚙ Setup"); return; }
  syncStatusMsg("testing token…");
  const parts = [];
  try {
    // 1. Is the token itself valid? Who is it?
    let r = await fetch(`${GH_API}/user`, { headers: ghHeaders() });
    if (r.ok) {
      const u = await r.json();
      parts.push("✓ token OK (“" + u.login + "”)");
    } else {
      parts.push(`✗ 401 — token invalid or revoked (${await ghErr(r)})`);
      syncStatusMsg(parts.join(" · "));
      return;
    }
    // 2. Can it see the sync repo at all?
    r = await fetch(`${GH_API}/repos/${SYNC_REPO}`, { headers: ghHeaders() });
    parts.push(r.ok ? "✓ can see lugine/ayah-sync" : `✗ ${r.status} — repo not visible → re-create token & select 'ayah-sync' (not 'ayah')`);

    // 3. Can it read the sync file?
    r = await fetch(`${GH_API}/repos/${SYNC_REPO}/contents/${SYNC_FILE}?t=${Date.now()}`, { headers: ghHeaders() });
    if (r.ok) {
      const m = await r.json();
      syncSha = m.sha || null;
      parts.push("✓ can read sync.json");
    } else if (r.status === 404) {
      parts.push("✓ read OK (file not created yet — will be)");
    } else {
      parts.push(`✗ ${r.status} — read blocked`);
    }

    // 4. Can it write? (create a tiny probe, then delete it)
    const probe = "_probe-" + deviceId() + ".txt";
    r = await fetch(`${GH_API}/repos/${SYNC_REPO}/contents/${probe}`, {
      method: "PUT",
      headers: ghHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ message: "probe", content: b64encode("1"), branch: "main" })
    });
    if (r.ok) {
      parts.push("✓ can write (probe removed)");
      const m = await r.json();
      if (m && m.content && m.content.sha) {
        fetch(`${GH_API}/repos/${SYNC_REPO}/contents/${probe}`, {
          method: "DELETE",
          headers: ghHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ message: "probe cleanup", sha: m.content.sha })
        }).catch(() => {});
      }
    } else if (r.status === 403) {
      parts.push("✗ 403 — write blocked: token needs Contents permission → Read and write (it's read-only now)");
    } else if (r.status === 404) {
      parts.push("✗ 404 — write blocked: token's 'Only select repositories' doesn't include ayah-sync");
    } else {
      parts.push(`✗ ${r.status} — write blocked (${await ghErr(r)})`);
    }
  } catch (e) {
    parts.push("network error during test (" + (e && e.message ? e.message : "fetch failed") + ")");
  }
  syncStatusMsg(parts.join(" · "));
  console.warn("[Ayah sync test]", parts.join(" · "));
}
function applyRemote(remote, applyPosition) {
  let touched = false;
  if (Array.isArray(remote.memorized)) lastRemoteMemorized = new Set(remote.memorized.filter((k) => typeof k === "string"));
  // Memorized stars: UNION — never lose a star either device made
  if (Array.isArray(remote.memorized) && remote.memorized.length) {
    const before = state.memorized.size;
    for (const k of remote.memorized) {
      if (typeof k === "string" && indexFromKey(k) >= 0 && indexFromKey(k) < TOTAL_VERSES) {
        state.memorized.add(k);
      }
    }
    if (state.memorized.size !== before) {
      saveJSON(LS_MEMORIZED, [...state.memorized]);
      renderMemorized();
      touched = true;
    }
  }
  // Settings + position: only trust a remote that is newer than our last push
  if (remote.savedAt && remote.savedAt > (state.syncMeta.savedAt || 0)) {
    const rRec = Number(remote.reciterId);
    if (rRec && RECITERS.some((r) => r.id === rRec) && rRec !== state.reciterId) {
      state.reciterId = rRec;
      saveJSON(LS_RECITER, state.reciterId);
      populateReciterSelect();
      state.audioCache = {};
      saveJSON(LS_AUDIOCACHE, state.audioCache);
      touched = true;
    }
    const rRep = Number(remote.repeat);
    if (rRep >= 1 && rRep !== state.repeat) {
      state.repeat = rRep;
      saveJSON(LS_REPEAT, state.repeat);
      if (dom.repeatSelect) dom.repeatSelect.value = String(state.repeat);
      touched = true;
    }
    const rSpeed = Number(remote.speed);
    if (rSpeed >= 0.25 && rSpeed <= 3 && rSpeed !== state.speed) {
      state.speed = rSpeed;
      saveJSON(LS_SPEED, state.speed);
      if (dom.speedSelect) dom.speedSelect.value = String(state.speed);
      applySpeed();
      touched = true;
    }
    if (typeof remote.autoPlay === "boolean" && remote.autoPlay !== state.autoPlay) {
      state.autoPlay = remote.autoPlay;
      saveJSON(LS_AUTO, state.autoPlay);
      if (dom.btnAuto) {
        dom.btnAuto.classList.toggle("is-on", state.autoPlay);
        dom.btnAuto.setAttribute("aria-pressed", String(state.autoPlay));
      }
      touched = true;
    }
    if (Array.isArray(remote.display) && remote.display.length &&
        JSON.stringify(remote.display) !== JSON.stringify(state.display)) {
      state.display = remote.display;
      saveJSON(LS_DISPLAY, state.display);
      refreshDisplayCheckboxes();
      touched = true;
    }
    if (applyPosition && typeof remote.lastVerse === "string" &&
        remote.savedAt > state.lastNavAt &&
        indexFromKey(remote.lastVerse) >= 0 && indexFromKey(remote.lastVerse) < TOTAL_VERSES &&
        remote.lastVerse !== state.currentKey) {
      // The cloud's "last read" is newer than any real navigation on this
      // device — follow it. Adopting also updates lastNavAt so an echo of the
      // same position isn't treated as new again.
      state.currentKey = remote.lastVerse;
      state.lastNavAt = Math.max(state.lastNavAt, remote.savedAt);
      saveJSON(LS_NAV_AT, state.lastNavAt);
      saveJSON(LS_LAST, remote.lastVerse);
      touched = true;
    }
  }
  if (touched) renderRead();
}
function refreshSyncStatus() {
  if (!state.syncToken) {
    syncStatusMsg("setup needed — tap ⚙ Setup");
  } else if (state.syncMeta.savedAt) {
    const t = new Date(state.syncMeta.savedAt);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    syncStatusMsg(`on — last ${hh}:${mm}`);
  } else {
    syncStatusMsg("on — first sync pending");
  }
}
function wireSync() {
  if (dom.syncSetup) {
    dom.syncSetup.addEventListener("click", () => {
      dom.syncPanel.classList.toggle("is-open");
    });
  }
  if (dom.syncSave) {
    dom.syncSave.addEventListener("click", async () => {
      const tok = (dom.syncToken.value || "").trim();
      if (!tok) { syncStatusMsg("paste the token first"); return; }
      state.syncToken = tok;
      saveJSON(LS_SYNC_TOKEN, tok);
      dom.syncToken.value = "";
      toast("Token saved — syncing…");
      syncStatusMsg("checking…");
      // If this device has a real spot it has read before, keep it — don't let
      // another device's position teleport it. A brand-new device (no saved
      // spot) still adopts the remote position so it starts where you left off.
      const hasLocalSpot = !!(loadJSON(LS_LAST, null));
      await pullSync(!hasLocalSpot);
      await pushSync();     // then write this device's state (always)
      if (dom.syncPanel) dom.syncPanel.classList.remove("is-open");
    });
  }
  if (dom.syncTest) {
    dom.syncTest.addEventListener("click", syncTest);
  }
  if (dom.syncNow) {
    dom.syncNow.addEventListener("click", async () => {
      if (!state.syncToken) {
        if (dom.syncPanel) dom.syncPanel.classList.add("is-open");
        syncStatusMsg("paste token first — see Setup");
        toast("Add your GitHub token first");
        return;
      }
      state.syncOn = true;
      saveJSON(LS_SYNC_ON, true);
      toast("Syncing…");
      await pullSync(true); // explicit "sync now" → converge on newest position
      await pushSync();
    });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncCycle();
  });
  setInterval(() => {
    if (!document.hidden) syncCycle();
  }, 90000);
  refreshSyncStatus();
}

/* Background cycle: pull the cloud — adopting a newer position (so devices
   converge on "last read wins") and unioning memorized — then only re-push if
   the remote was actually newer (otherwise we'd clobber it with stale data). */
function syncCycle() {
  if (!syncReady()) return;
  const prevSaved = state.syncMeta.savedAt || 0;
  pullSync(true).then((remote) => {
    if (remote && remote.savedAt && remote.savedAt > prevSaved) queuePush();
  }).catch(() => {});
}

/* ================================================================
   Init
   ================================================================ */
function dailyVerseKey() {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayIndex = Math.floor(start / 86400000);
  return keyFromIndex(dayIndex % TOTAL_VERSES).key;
}

function init() {
  if (dom.appVersion) dom.appVersion.textContent = APP_VERSION;
  // Restore last-viewed verse, or show today's daily verse on first run
  const last = loadJSON(LS_LAST, null);
  const daily = dailyVerseKey();
  // A saved spot that is exactly today's auto-daily verse is almost certainly
  // the seed (not a real read) — drop it so this device behaves as fresh and
  // follows wherever you actually last read (on any device).
  if (last === daily) {
    saveJSON(LS_LAST, null);
    state.currentKey = daily;
  } else if (last && indexFromKey(last) >= 0 && indexFromKey(last) < TOTAL_VERSES) {
    state.currentKey = last;
    // Existing real spot, no recorded nav-time yet → small sentinel so a stale
    // cloud position can't yank this device away before it has pushed its own.
    if (state.lastNavAt <= 0) {
      state.lastNavAt = 1;
      saveJSON(LS_NAV_AT, 1);
    }
  } else {
    state.currentKey = daily;
  }

  populateSurahSelect();
  populateReciterSelect();

  // Restore audio settings
  dom.btnAuto.classList.toggle("is-on", state.autoPlay);
  dom.btnAuto.setAttribute("aria-pressed", String(state.autoPlay));
  dom.repeatSelect.value = String(state.repeat);
  dom.speedSelect.value = String(state.speed);
  applySpeed();
  refreshDisplayCheckboxes();

  const initChap = parseKey(state.currentKey).chapter;
  populateAyahSelect(initChap);
  dom.readSurahSelect.value = String(initChap);
  dom.readAyahSelect.value = String(parseKey(state.currentKey).ayah);

  setView("read");
  renderMemorized();
  wireEvents();
  wireSync();
  registerSW();
  checkForUpdates(false); // quiet: keep the SW on the latest build

  // PUSH this device's state FIRST (so a device with a real reading spot —
  // e.g. your Mac's Al-Baqarah — claims it in the cloud), then PULL to adopt
  // anything newer. A fresh device pushes nothing for position, so it just
  // adopts wherever you actually last read on any device.
  if (syncReady()) {
    pushSync()
      .then(() => pullSync(true))
      .catch(() => {});
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}