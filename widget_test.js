// Verifies scriptable-widget.js against a simulated Scriptable environment
const fs = require("fs");
const vm = require("vm");
const code = fs.readFileSync(__dirname + "/scriptable-widget.js", "utf8");

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ FAIL: " + name); }
}

/* ---- Scriptable API stubs ---- */
class FakeText {
  constructor() { this.text = ""; this.font = null; this.textColor = null; this.lineLimit = null; this.minimumScaleFactor = null; this.textOpacity = 1; }
  centerAlignText() { return this; }
}
class ListWidget {
  constructor() {
    if (ListWidget.failNext > 0) { ListWidget.failNext--; throw new Error("injected boom"); }
    this.children = []; this._url = null; this._grad = null; this._refresh = null;
  }
  addText(t) { const ft = new FakeText(); ft.text = t; this.children.push(ft); return ft; }
  addSpacer() {}
  setPadding() {}
  set url(v) { this._url = v; }
  get url() { return this._url; }
  set backgroundGradient(g) { this._grad = g; }
  set refreshAfterDate(d) { this._refresh = d; }
  presentMedium() { return Promise.resolve(); }
}
class Color { constructor(h) { this.h = h; } }
class LinearGradient { constructor() { this.colors = []; this.locations = []; } }
const Font = {
  systemFont: (s) => ({ k: "sys", s }), regularSystemFont: (s) => ({ k: "reg", s }),
  semiboldSystemFont: (s) => ({ k: "semi", s }), italicSystemFont: (s) => ({ k: "ital", s }),
  boldSystemFont: (s) => ({ k: "bold", s }),
};
class Request {
  constructor(url) { Request.lastUrl = url; }
  async loadJSON() {
    if (Request.mode === "fail") throw new Error("network down");
    return {
      verse: {
        text_imlaei: "وَأَلْقَوْا۟ سُجَّدًا",
        translations: [{ text: "And they will impart <sup foot_note=1>1</sup> to Allah &amp; more" }],
      },
    };
  }
}
const files = {};
const FileManager = {
  local: () => ({
    documentsDirectory: () => "/docs",
    joinPath: (a, b) => a + "/" + b,
    fileExists: (p) => p in files,
    readString: (p) => files[p],
    writeString: (p, s) => { files[p] = s; },
  }),
};

function runScript(family, runsInWidget) {
  let setWidgetArg = null, completed = false;
  const sandbox = {
    console, Date, Math, JSON, Promise, parseInt, String, Number,
    ListWidget, Color, LinearGradient, Font, Request, FileManager,
    config: { widgetFamily: family, runsInWidget },
    Script: { setWidget: (w) => { setWidgetArg = w; }, complete: () => { completed = true; } },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  // Script runs to completion, then awaits its own done-promise (deterministic)
  return vm.runInContext("(async () => {\n" + code + "\nawait __ayahDone;\n})()", sandbox, { filename: "scriptable-widget.js" })
    .then(() => ({ setWidgetArg, completed, files }));
}

/* ---- expected daily key from the APP itself (same formula) ---- */
const appCode = fs.readFileSync(__dirname + "/app.js", "utf8");
function makeEl() {
  return {
    checked: false, innerHTML: "", textContent: "", style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, addEventListener() {}, appendChild() {}, insertBefore() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return [] },
  };
}
function appKey() {
  const sb = {
    document: { createElement: () => makeEl(), addEventListener() {}, querySelector: () => makeEl(), querySelectorAll: () => [] },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    fetch: () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}) }),
    navigator: { onLine: true }, window: {}, location: { href: "" }, setTimeout, clearTimeout, console,
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(appCode, sb, { filename: "app.js" });
  return vm.runInContext("dailyVerseKey()", sb);
}

(async () => {
  console.log("Ayah Scriptable widget verification:");
  console.log("—");

  // 1) online + medium widget
  Request.mode = "ok";
  let r = await runScript("medium", true);
  const expectedKey = appKey();
  const header = r.setWidgetArg.children[0];
  check("runs to completion (setWidget + complete)", !!r.setWidgetArg && r.completed);
  check("widget tap opens the app", r.setWidgetArg._url === "https://lugine.github.io/ayah/");
  check("header shows today's verse (matches app: " + expectedKey + ")", header.text.includes(expectedKey));
  const arabic = r.setWidgetArg.children[1];
  check("arabic present with ornate Western number", arabic && /﴿\d+﴾/.test(arabic.text));
  const en = r.setWidgetArg.children[2];
  check("translation present & footnotes stripped", en && en.text.includes("And they will impart") && !en.text.includes("<sup") && en.text.includes("& more"));
  check("cache written with today's verse", !!r.files["/docs/ayah-widget-cache.json"] && r.files["/docs/ayah-widget-cache.json"].includes(expectedKey));

  // 2) offline: network fails, cache seeded → shows cached verse + offline footer
  Request.mode = "fail";
  r = await runScript("medium", true);
  check("offline: falls back to cache without crashing", !!r.setWidgetArg);
  check("offline: footer says offline", r.setWidgetArg.children.some((c) => c.text === "offline — tap to open"));

  // 3) small widget: header + arabic only
  Request.mode = "ok";
  r = await runScript("small", true);
  const smallTexts = r.setWidgetArg.children.map((c) => c.text);
  check("small: header + arabic only (no translation)", smallTexts.length === 2 && !smallTexts.some((t) => t.includes("impart")));

  // 4) no cache + offline → friendly message, no crash
  for (const k of Object.keys(files)) delete files[k];
  Request.mode = "fail";
  r = await runScript("large", true);
  check("first-run offline: graceful hint, no crash", r.setWidgetArg.children.some((c) => (c.text || "").includes("Open the Ayah app")));

  // 5) in-app run → preview instead of widget
  Request.mode = "ok";
  r = await runScript("medium", false);
  check("in-app run completes without setWidget", r.completed && !r.setWidgetArg);

  // 6) catastrophic failure → error widget renders on screen, still completes
  ListWidget.failNext = 1;
  r = await runScript("medium", true);
  ListWidget.failNext = 0;
  check("catastrophic error → error widget shown on screen", !!r.setWidgetArg && r.setWidgetArg.children.some((c) => (c.text || "").includes("⚠")));
  check("catastrophic error → still completes cleanly", !!r.completed);

  console.log("—");
  console.log("PASS " + pass + " / " + (pass + fail));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(1); });
