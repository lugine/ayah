// Standalone unit test for Ayah's data + index logic (runs under Node).
const fs = require("fs");
const vm = require("vm");

const code = fs.readFileSync("app.js", "utf8");

function makeEl() {
  return {
    textContent: "", innerHTML: "", style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, addEventListener() {}, appendChild() {}, insertBefore() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; }
  };
}

const sandbox = {
  document: {
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    createElement() { return makeEl(); },
    addEventListener() {}
  },
  localStorage: (() => { const m = {}; return { getItem(k){ return (k in m) ? m[k] : null; }, setItem(k, v){ m[k] = String(v); }, removeItem(k){ delete m[k]; }, __store: m }; })(),
  navigator: {},
  window: { addEventListener() {}, open() {} },
  fetch() { return Promise.reject(new Error("no net")); },
  setTimeout, clearTimeout, console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const {
  SURAHS, FALLBACK, TOTAL_VERSES, keyFromIndex, indexFromKey, dailyVerseKey, parseKey
} = vm.runInContext(
  "({SURAHS, FALLBACK, TOTAL_VERSES, keyFromIndex, indexFromKey, dailyVerseKey, parseKey})",
  sandbox
);

let pass = true;
const check = (label, cond) => { console.log((cond ? "PASS" : "FAIL") + " - " + label); if (!cond) pass = false; };

check("Surah count is 114", SURAHS.length === 114);
check("Total verses is 6236", TOTAL_VERSES === 6236);
check("Surah 1 is Al-Fatihah, 7 ayahs", SURAHS[0].name === "Al-Fatihah" && SURAHS[0].ayahCount === 7);
check("Surah 114 is An-Nas, 6 ayahs", SURAHS[113].name === "An-Nas" && SURAHS[113].ayahCount === 6);

let roundTrip = true;
for (let i = 0; i < TOTAL_VERSES; i++) {
  const k = keyFromIndex(i).key;
  if (indexFromKey(k) !== i) { roundTrip = false; console.log("   mismatch at", i, k); break; }
}
check("Index<->key round-trips all 6236 verses", roundTrip);

const keysOk = Object.keys(FALLBACK).every(k => {
  const p = parseKey(k);
  return p.chapter >= 1 && p.chapter <= 114 && p.ayah >= 1 && p.ayah <= SURAHS[p.chapter - 1].ayahCount;
});
check("All fallback verse keys exist in the corpus", keysOk);

const dk = dailyVerseKey();
const dp = parseKey(dk);
check("Daily verse key is valid", dp.chapter >= 1 && dp.chapter <= 114);
check("keyFromIndex(0)==1:1", keyFromIndex(0).key === "1:1");
check("keyFromIndex(6235)==114:6", keyFromIndex(6235).key === "114:6");

  const { RECITERS } = vm.runInContext("({RECITERS})", sandbox);
  check("Reciter list non-empty (>=12)", Array.isArray(RECITERS) && RECITERS.length >= 12);
  check("Reciter ids are unique", new Set(RECITERS.map((r) => r.id)).size === RECITERS.length);
  check("Reciter ids are positive integers", RECITERS.every((r) => Number.isInteger(r.id) && r.id > 0));

  // htmlToText footnote/strip logic
  sandbox.document = {
    createElement() {
      const node = { _h: "" };
      Object.defineProperty(node, "innerHTML", {
        get() { return this._h; },
        set(v) { this._h = String(v); }
      });
      Object.defineProperty(node, "textContent", {
        get() { return this._h.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); },
        set() {}
      });
      return node;
    }
  };
  const { htmlToText } = vm.runInContext("({htmlToText})", sandbox);
  check("htmlToText strips sup footnotes",
    htmlToText('In the name of Allāh,<sup foot_note=195932>1</sup> the Merciful.<sup foot_note=9>2</sup>', 2000)
      === "In the name of Allāh, the Merciful.");
  check("htmlToText flattens block tags to paragraphs",
    htmlToText('<h1>Intro</h1><p>First para.</p><p>Second para.</p>', 2000)
      .includes("First para.") && htmlToText('<h1>Intro</h1><p>First para.</p><p>Second para.</p>', 2000)
      .includes("Second para."));
  check("htmlToText caps long text",
    htmlToText("word ".repeat(400), 120).length <= 121);
check("Total surah ayah counts sum matches offsets", OFFSETS_END() === TOTAL_VERSES);

function OFFSETS_END() {
  let acc = 0;
  for (const s of SURAHS) acc += s.ayahCount;
  return acc;
}

console.log("\n--- Integration: verse loading pipeline ---");
(async () => {
  // Fake a real Quran.com response (same shape as verified via curl)
  const fakeResponse = {
    verse: {
      verse_key: "1:5",
      text_imlaei: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      translations: [{ resource_id: 20, text: "It is You we worship and You we ask for help." }]
    }
  };

  sandbox.fetch = (url) => {
    if (url.includes("by_key/1:5")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(fakeResponse) });
    }
    if (url.includes("/tafsirs/169/by_ayah/1:5")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tafsir: { resource_id: 169, text: "<p>Explanation here.</p><sup foot_note=7>1</sup>" } })
      });
    }
    return Promise.reject(new Error("network down"));
  };

  const { loadVerse, loadTafsir } = vm.runInContext("({loadVerse, loadTafsir})", sandbox);

  // 1) network path
  const fromNetwork = await loadVerse("1:5");
  check("Online verse loads Arabic from API", fromNetwork.ar.includes("إِيَّاكَ"));
  check("Online verse loads English translation", fromNetwork.en.includes("It is You we worship"));

  // 2) fallback path (no network, but curated verse exists)
  const fromFallback = await loadVerse("2:286");
  check("Offline curated verse falls back", fromFallback.ar.length > 10 && fromFallback.en.length > 10);

  // 3) truly unavailable verse offline -> throws
  let threw = false;
  try { await loadVerse("3:200"); } catch { threw = true; }
  check("Missing verse throws when offline (graceful error state)", threw);

  // 4) tafsir: flattened + footnote-free, and cached
  const tf1 = await loadTafsir("1:5");
  check("loadTafsir flattens HTML + strips footnotes", tf1 === "Explanation here.");
  const tf2 = await loadTafsir("1:5");
  check("loadTafsir served from cache", tf2 === tf1);

  // --- Sync anti-clobber invariants (v23) ---
  const { collectSyncPayload, isDailySeed, dailyVerseKey: dvk } = vm.runInContext(
    "({collectSyncPayload, isDailySeed, dailyVerseKey})", sandbox);
  const todaySeed = dvk();
  const yestSeed = dvk(-1);
  check("today's auto-daily verse counts as a seed", isDailySeed(todaySeed));
  check("yesterday's auto-daily verse counts as a seed", isDailySeed(yestSeed));
  check("a real reading spot (2:50) is NOT a seed", isDailySeed("2:50") === false);

  sandbox.localStorage.__store["ayah.lastVerse.v1"] = JSON.stringify(todaySeed);
  const payloadSeed = vm.runInContext("collectSyncPayload()", sandbox);
  check("payload omits an idle daily-seed position", payloadSeed.lastVerse === undefined);

  sandbox.localStorage.__store["ayah.lastVerse.v1"] = JSON.stringify("2:50");
  const payloadReal = vm.runInContext("collectSyncPayload()", sandbox);
  check("payload carries a real reading position", payloadReal.lastVerse === "2:50");

  const base = vm.runInContext("lastRemoteMemorized", sandbox);
  check("union baseline is a Set (never null)", !!base && typeof base.has === "function");

  // --- Position carry-forward (v25): an empty device must NOT erase the cloud's position ---
  sandbox.localStorage.__store["ayah.lastVerse.v1"] = JSON.stringify(null);
  vm.runInContext("lastRemotePos = { verse: \"2:50\", savedAt: 123 };", sandbox);
  const payloadCarry = vm.runInContext("collectSyncPayload()", sandbox);
  check("empty device CARRY-FORWARDS the cloud position (2:50)", payloadCarry.lastVerse === "2:50");

  sandbox.localStorage.__store["ayah.lastVerse.v1"] = JSON.stringify("2:55");
  const payloadLocal = vm.runInContext("collectSyncPayload()", sandbox);
  check("a device with a real local spot pushes ITS position (2:55)", payloadLocal.lastVerse === "2:55");

  console.log("\n" + (pass ? "ALL TESTS PASSED ✔" : "SOME TESTS FAILED ✘"));
})();