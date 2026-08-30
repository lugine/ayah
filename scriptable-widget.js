/* ── Ayah Widget for Scriptable ────────────────────────────────────────
   Shows the SAME daily verse as your Ayah web app (same math, same
   translation), plus a big Western-numeral ayah marker. Tap → opens app.

   Setup:
   1. Install "Scriptable" (free) from the App Store
   2. In Scriptable: tap "+" → paste this file → name it "Ayah Widget" → ▶
   3. Home screen: long-press → "+" → Scriptable → pick a size
      → set Script = "Ayah Widget" → Add

   Notes: refreshes automatically (iOS decides timing, ~every 15-60 min);
   the verse changes at midnight UTC like the app; caches the last verse
   for offline display.
   ───────────────────────────────────────────────────────────────────── */

const API = "https://api.quran.com/api/v4";
const APP_URL = "https://lugine.github.io/ayah/";
const TRANSLATION_ID = 131; // Saheeh International — same as the app

// 114 surah ayah counts + English names (mirrors app.js SURAHS exactly)
const COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const NAMES = ["Al-Fatihah","Al-Baqarah","Aal-E-Imran","An-Nisa","Al-Ma'idah","Al-An'am","Al-A'raf","Al-Anfal","At-Tawbah","Yunus","Hud","Yusuf","Ar-Ra'd","Ibrahim","Al-Hijr","An-Nahl","Al-Isra","Al-Kahf","Maryam","Ta-Ha","Al-Anbiya","Al-Hajj","Al-Mu'minun","An-Nur","Al-Furqan","Ash-Shu'ara","An-Naml","Al-Qasas","Al-Ankabut","Ar-Rum","Luqman","As-Sajdah","Al-Ahzab","Saba","Fatir","Ya-Sin","As-Saffat","Sad","Az-Zumar","Ghafir","Fussilat","Ash-Shura","Az-Zukhruf","Ad-Dukhan","Al-Jathiyah","Al-Ahqaf","Muhammad","Al-Fath","Al-Hujurat","Qaf","Adh-Dhariyat","At-Tur","An-Najm","Al-Qamar","Ar-Rahman","Al-Waqi'ah","Al-Hadid","Al-Mujadila","Al-Hashr","Al-Mumtahanah","As-Saff","Al-Jumu'ah","Al-Munafiqun","At-Taghabun","At-Talaq","At-Tahrim","Al-Mulk","Al-Qalam","Al-Haqqah","Al-Ma'arij","Nuh","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyamah","Al-Insan","Al-Mursalat","An-Naba","An-Nazi'at","Abasa","At-Takwir","Al-Infitar","Al-Mutaffifin","Al-Inshiqaq","Al-Buruj","At-Tariq","Al-A'la","Al-Ghashiyah","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Ad-Duhaa","Ash-Sharh","At-Tin","Al-Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-Adiyat","Al-Qari'ah","At-Takathur","Al-Asr","Al-Humazah","Al-Fil","Quraysh","Al-Ma'un","Al-Kawthar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"];

/* ---------- verse selection (mirrors app.js dailyVerseKey) ---------- */
function buildOffsets() {
  const o = [];
  let acc = 0;
  for (const c of COUNTS) { o.push(acc); acc += c; }
  return o;
}
function keyFromIndex(index) {
  const offs = buildOffsets();
  const total = offs[113] + COUNTS[113]; // 6236
  const i = Math.max(0, Math.min(total - 1, index));
  let chapter = 0;
  while (chapter < 113 && offs[chapter + 1] <= i) chapter++;
  return { key: (chapter + 1) + ":" + (i - offs[chapter] + 1), chapter: chapter + 1 };
}
function dailyKey() {
  const now = new Date();
  const dayIndex = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000
  );
  return keyFromIndex(dayIndex % 6236);
}

/* ---------- data ---------- */
function clean(html) {
  return String(html || "")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")  // footnote markers
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "\u2019")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}
async function loadVerse(key) {
  const url = API + "/verses/by_key/" + encodeURIComponent(key) +
    "?translations=" + TRANSLATION_ID + "&fields=text_imlaei";
  const json = await new Request(url).loadJSON();
  const v = (json && json.verse) || (json && json.verses && json.verses[0]);
  if (!v) throw new Error("bad response");
  return {
    key: key,
    ar: v.text_imlaei || v.text_uthmani || "",
    en: clean(v.translations && v.translations[0] ? v.translations[0].text : ""),
  };
}
function readCache() {
  try {
    const fm = FileManager.local();
    const p = fm.joinPath(fm.documentsDirectory(), "ayah-widget-cache.json");
    if (fm.fileExists(p)) return JSON.parse(fm.readString(p));
  } catch (e) {}
  return null;
}
function writeCache(data) {
  try {
    const fm = FileManager.local();
    const p = fm.joinPath(fm.documentsDirectory(), "ayah-widget-cache.json");
    fm.writeString(p, JSON.stringify(data));
  } catch (e) {}
}

/* ---------- main ---------- */
const pick = dailyKey();
let data = null;
let offline = false;
try {
  data = await loadVerse(pick.key);
  writeCache(data);
} catch (e) {
  const c = readCache();
  if (c) { data = c; offline = true; }
}
if (!data) {
  data = {
    key: pick.key,
    ar: "",
    en: "Open the Ayah app once while online — then this widget works offline too.",
  };
}

const shownKey = data.key || pick.key;
const chapterNum = parseInt(shownKey.split(":")[0], 10) || pick.chapter;
const surahName = NAMES[chapterNum - 1] || "";
const ayahNum = shownKey.split(":")[1];

/* ---------- render ---------- */
const w = new ListWidget();
const grad = new LinearGradient();
grad.locations = [0, 1];
grad.colors = [new Color("#0f3d2e"), new Color("#0a2b20")];
w.backgroundGradient = grad;
w.setPadding(13, 16, 11, 16);
w.url = APP_URL; // tapping the widget opens the app

const white = new Color("#f2faf5");
const mint = new Color("#9fe8c2");
const dim = new Color("#bcd9cb");

const fam = config.widgetFamily || "medium";
const small = fam === "small";
const large = fam === "large";

// Header: surah · reference
const head = w.addText(surahName + "  ·  " + shownKey);
head.font = Font.semiboldSystemFont(small ? 10 : 11);
head.textColor = mint;
head.centerAlignText();
w.addSpacer(5);

// Arabic + big Western ayah number in ornate brackets
const arText = (data.ar ? data.ar + "  " : "") + "﴿" + ayahNum + "﴾";
const ar = w.addText(arText);
ar.font = Font.regularSystemFont(large ? 20 : small ? 15 : 17);
ar.textColor = white;
ar.centerAlignText();
ar.lineLimit(large ? 6 : small ? 3 : 4);
ar.minimumScaleFactor = 0.7;

w.addSpacer(7);

// Translation (medium + large only)
if (!small && data.en) {
  const en = w.addText(data.en);
  en.font = Font.italicSystemFont(large ? 14 : 12);
  en.textColor = dim;
  en.centerAlignText();
  en.lineLimit(large ? 8 : 4);
  en.minimumScaleFactor = 0.75;
}

w.addSpacer();

// Footer
if (!small) {
  const foot = w.addText(offline ? "offline — tap to open" : "daily ayah — tap to open");
  foot.font = Font.systemFont(9);
  foot.textColor = dim;
  foot.textOpacity = 0.7;
  foot.centerAlignText();
}

w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium(); // in-app preview
}
Script.complete();
