/* Tests for the Mac-widget page logic (widget-page.js).
   Verifies the resize-proof behavior stays correct: daily-verse parity
   with the app, index math clamps, and footnote cleaning. */
const fs = require("fs");
const vm = require("vm");

const code = fs.readFileSync("widget-page.js", "utf8");
function makeEl() {
  return {
    textContent: "", innerHTML: "", style: {}, dataset: {}, value: "",
    hidden: false, children: [], checked: false, disabled: false,
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, addEventListener() {}, appendChild() {}, insertBefore() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
  };
}
const stubs = {
  document: {
    getElementById: () => makeEl(),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    createElement: () => makeEl(),
    addEventListener() {},
    hidden: true,
  },
  window: { addEventListener() {} },
  navigator: {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  location: { search: "" },
  fetch: () => Promise.reject(new Error("no fetch in test")),
  URLSearchParams,
  console,
};
const ctx = vm.createContext(stubs);
vm.runInContext(code, ctx);
const I = ctx.__widgetInternals;
if (!I) { console.error("FAIL - internals not exposed"); process.exit(1); }

let pass = true;
const check = (label, cond, extra) => {
  console.log((cond ? "PASS" : "FAIL") + " - " + label + (cond || !extra ? "" : "  [" + extra + "]"));
  if (!cond) pass = false;
};

// 1. daily verse parity with the app (both roll over at midnight UTC)
const appCode = fs.readFileSync("app.js", "utf8");
const appCtx = vm.createContext({ ...stubs, navigator: {}, window: { addEventListener() {} } });
vm.runInContext(appCode + ";globalThis.__appDaily = dailyVerseKey;", appCtx);
const appDaily = appCtx.__appDaily;
check("daily verse matches the app's daily verse", I.dailyKey() === appDaily(),
  "widget=" + I.dailyKey() + " app=" + appDaily());

// 2. index math + clamping (resize can't break the math)
check("index 0 = 1:1", I.keyFromIndex(0) === "1:1");
check("last index = 114:6", I.keyFromIndex(6235) === "114:6");
check("out-of-range clamps to 114:6", I.keyFromIndex(7777) === "114:6");

// 3. footnote cleaning (same contract as the app)
check("strips sup footnotes", I.clean('Allāh<sup foot_note=1>1</sup> is Great') === "Allāh is Great");
check("decodes entities", I.clean("A &quot;sign&quot; &amp; more") === 'A "sign" & more');
check("null-safe", I.clean(null) === "");

console.log(pass ? "\nALL WIDGET-PAGE TESTS PASSED ✔" : "\nFAILURES ✘");
process.exit(pass ? 0 : 1);
