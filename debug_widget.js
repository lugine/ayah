// Debug: dump the widget tree the script actually sets (run: node debug_widget.js)
const fs = require("fs");
const vm = require("vm");
const src = fs.readFileSync("widget_test.js", "utf8");
const top = src.split("(async () => {")[0]; // everything incl. the API seed, minus the main runner
const sandbox = { console, setTimeout, clearTimeout, setImmediate, require, process };
vm.createContext(sandbox);
vm.runInContext(top + "\nglobalThis.__run = runCase;", sandbox, { filename: "harness.js" });
(async () => {
  try {
    const w = await sandbox.__run("medium");
    const dump = (s, i) => {
      for (const c of s.children || []) {
        const label =
          c.spacer !== undefined ? "[spacer " + c.length + "]" :
          c.text !== undefined ? JSON.stringify(c.text) :
          c.image ? "[image]" : "[stack]";
        console.log(" ".repeat(i) + label);
        if (c.children) dump(c, i + 1);
      }
    };
    console.log("--- widget tree ---");
    dump(w, 0);
  } catch (e) {
    console.log("DEBUG ERR:", e && (e.stack || e.message));
  }
})();
