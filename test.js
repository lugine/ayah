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
  localStorage: { getItem() { return null; }, setItem() {} },
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
    return Promise.reject(new Error("network down"));
  };

  const { loadVerse } = vm.runInContext("({loadVerse})", sandbox);

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

  console.log("\n" + (pass ? "ALL TESTS PASSED ✔" : "SOME TESTS FAILED ✘"));
})();