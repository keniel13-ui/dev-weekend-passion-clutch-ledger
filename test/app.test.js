// Runs app.js against a tiny fake DOM in a Node vm, so the logic can be tested with no browser and no dependencies.
// Run: node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const KEY = "clutch-receipts-v1";

function fakeElement(tag = "div") {
  const listeners = {};
  const attrs = {};
  const el = {
    tag, listeners, attrs, dataset: {}, hidden: false, value: "", textContent: "", innerHTML: "", disabled: false,
    children: [], className: "", fills: [],
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute(name) { return attrs[name]; },
    appendChild(child) { el.children.push(child); return child; },
    remove() {}, select() {}, click() {}, reset() { el.resetCount = (el.resetCount || 0) + 1; },
    reportValidity() { el.reported = true; return false; },
    querySelector(sel) { return (el.subs ||= {})[sel] ||= fakeElement(); },
    getContext() { return fakeContext(el); },
    toBlob(cb) { cb(null); }
  };
  return el;
}

function fakeContext(canvas) {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === "measureText") return (text) => ({ width: String(text).length * 20 });
      if (prop === "createLinearGradient") return () => ({ addColorStop() {} });
      if (prop === "fillText") return (text, x, y) => canvas.fills.push({ text, y });
      if (prop in target) return target[prop];
      return () => {};
    },
    set(target, prop, value) { target[prop] = value; return true; }
  });
}

function makeStorage(initial = {}, { failWrites = false, failAll = false } = {}) {
  const data = new Map(Object.entries(initial));
  const api = {
    data,
    getItem(key) { if (failAll) throw new Error("SecurityError"); return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { if (failWrites || failAll) throw new Error("QuotaExceededError"); data.set(key, String(value)); }
  };
  return api;
}

function loadApp({ storage = makeStorage(), fetch, reduceMotion = false, confirmAnswer = true } = {}) {
  const els = {};
  const document = {
    querySelector(sel) { return (els[sel] ||= fakeElement(sel)); },
    createElement(tag) { return fakeElement(tag); },
    body: fakeElement("body"),
    execCommand() { return false; }
  };
  const context = {
    document, console, Math, Date, JSON, Object, Number, String, Array, Promise, Error, URL,
    localStorage: storage,
    matchMedia: () => ({ matches: reduceMotion }),
    requestAnimationFrame() {},
    // The Gemini timeout (45 s) fires at once so the test does not wait; short UI timers never fire.
    setTimeout(fn, ms) { if (ms >= 45000) queueMicrotask(fn); return 0; },
    clearTimeout() {},
    queueMicrotask,
    AbortController,
    confirm: () => confirmAnswer,
    navigator: { clipboard: { writeText: async () => {} } },
    FormData: class { constructor(form) { this.form = form; } get(name) { return this.form.formData[name]; } },
    fetch: fetch || (async () => { throw new Error("no network in tests"); })
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: "app.js" });
  const run = (code) => vm.runInContext(code, context);
  return { els, run, storage, context };
}

function seed(app) {
  app.els["#seed-button"].listeners.click[0]();
}

test("seed night: formula, self-grading and summary are exact", () => {
  const app = loadApp();
  seed(app);
  const call = app.run("state.modelCalls[0]");
  // Q1 31-24, FG 51-43, TO 3-6: 7*0.42 + 7*0.18 + 8*0.11 + 3*1.7 = 10.18 -> 10; final 7 + 10*3 = 37
  assert.equal(call.nextMargin, 10);
  assert.equal(call.projectedFinalMargin, 37);
  // Q2 was 27-29 (-2): missed by 12 -> "missed"
  assert.equal(call.nextGrade, "missed");
  assert.equal(call.actualNextMargin, -2);
  assert.equal(app.run("receiptStats().hitScore"), 75); // (1 cashed + 0.5 half) / 2 graded
});

test("state survives a save and reload without losing any field", () => {
  const app = loadApp();
  seed(app);
  const saved = app.storage.data.get(KEY);
  const again = loadApp({ storage: makeStorage({ [KEY]: saved }) });
  assert.deepEqual(JSON.parse(JSON.stringify(again.run("state"))), JSON.parse(saved));
});

for (const [label, raw] of [["invalid JSON", "{oops"], ["a JSON string", "\"text\""], ["null", "null"],
  ["an array", "[1,2]"], ["wrong field types", JSON.stringify({ game: 5, takes: "no", quarters: {}, modelCalls: [null, 3] })]]) {
  test(`corrupt saved state (${label}) loads as a clean default and renders`, () => {
    const app = loadApp({ storage: makeStorage({ [KEY]: raw }) });
    assert.deepEqual(JSON.parse(JSON.stringify(app.run("state.takes"))), []);
    assert.equal(app.run("state.game.teamA"), "Celtics");
    app.run("render()");
  });
}

test("hostile saved values are dropped or escaped, never injected as HTML", () => {
  const evil = "<img src=x onerror=alert(1)>";
  const saved = {
    game: { teamA: evil, teamB: "Lakers" },
    takes: [
      { id: "\"><img src=x onerror=alert(2)>", text: evil, tag: evil, confidence: evil, result: "cashed\" onclick=\"x" },
      { id: "t2", text: "   ", result: "missed" },
      { id: "t3", result: "missed" }
    ],
    quarters: [{ quarter: "<b>", aPoints: 1 }],
    modelCalls: [{ quarter: "1<img>", nextMargin: 1 }, { quarter: 2, nextGrade: "<i>", reasoning: [evil, 5] }]
  };
  const app = loadApp({ storage: makeStorage({ [KEY]: JSON.stringify(saved) }) });
  assert.equal(app.run("state.takes.length"), 1);
  assert.equal(app.run("state.takes[0].result"), "pending");
  assert.equal(app.run("state.quarters.length"), 0);
  assert.equal(app.run("state.modelCalls.length"), 1);
  assert.equal(app.run("state.modelCalls[0].nextGrade"), "pending");
  const html = app.els["#take-list"].children.map((li) => li.innerHTML).join("")
    + app.els["#model-list"].children.map((li) => li.innerHTML).join("");
  assert.doesNotMatch(html, /<img/i);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /data-id="&quot;&gt;&lt;img/);
  assert.equal(app.els["#team-a-label"].textContent, evil); // textContent, so shown literally, not parsed
});

test("a browser that refuses to save keeps working and says so", () => {
  const app = loadApp({ storage: makeStorage({}, { failWrites: true }) });
  seed(app);
  const lines = app.els["#receipt-lines"].children.map((li) => li.textContent);
  assert.ok(lines.some((line) => line.includes("not saving receipts")), lines.join(" | "));
});

test("a browser that blocks storage entirely still loads", () => {
  const app = loadApp({ storage: makeStorage({}, { failAll: true }) });
  seed(app);
  assert.equal(app.run("state.takes.length"), 3);
});

test("a whitespace-only take is not saved", () => {
  const app = loadApp();
  const form = app.els["#take-form"];
  form.formData = { take: "   \n ", tag: "Hot take", confidence: "Casual" };
  form.listeners.submit[0]({ preventDefault() {} });
  assert.equal(app.run("state.takes.length"), 0);
  assert.equal(form.reported, true);
  form.formData = { take: "  Knicks in 6  ", tag: "Hot take", confidence: "Casual" };
  form.listeners.submit[0]({ preventDefault() {} });
  assert.equal(app.run("state.takes[0].text"), "Knicks in 6");
});

test("result buttons expose their pressed state", () => {
  const app = loadApp();
  seed(app);
  const html = app.els["#take-list"].children[0].innerHTML;
  assert.match(html, /data-result="cashed" aria-pressed="true"/);
  assert.match(html, /data-result="missed" aria-pressed="false"/);
});

test("clear asks first and keeps receipts when the answer is no", () => {
  const app = loadApp({ confirmAnswer: false });
  seed(app);
  app.els["#clear-button"].listeners.click[0]();
  assert.equal(app.run("state.takes.length"), 3);
});

test("canvas gets a text description of the receipts", () => {
  const app = loadApp();
  seed(app);
  assert.equal(app.els["#court"].attrs["aria-label"],
    "Basketball receipt map: 3 takes (1 pending, 1 cashed, 1 half-right) and 1 model call.");
});

test("long text on the receipt card is capped with an ellipsis", () => {
  const app = loadApp();
  const card = fakeElement("canvas");
  const c = card.getContext();
  app.context.card = c;
  app.run("wrapText(card, 'word '.repeat(200), 0, 100, 900, 36, 3)");
  assert.equal(card.fills.length, 3);
  assert.ok(card.fills[2].text.endsWith("..."));
  assert.ok(card.fills.every((line) => line.text.length * 20 <= 900));
});

test("a stalled Gemini request times out instead of hanging", async () => {
  const fetch = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
  });
  const app = loadApp({ fetch });
  await assert.rejects(app.run("generateGeminiReadback('k')"), /after 45 seconds/);
});

test("the Gemini key is sent only as a header and never saved", async () => {
  let seen;
  const fetch = async (url, options) => {
    seen = { url, options };
    return { ok: true, json: async () => ({ output_text: "Solid night." }) };
  };
  const app = loadApp({ fetch });
  seed(app);
  const form = app.els["#gemini-form"];
  form.formData = { geminiKey: "  SECRET-KEY-123  " };
  await form.listeners.submit[0]({ preventDefault() {} });
  assert.equal(seen.options.headers["x-goog-api-key"], "SECRET-KEY-123");
  assert.doesNotMatch(seen.url + seen.options.body, /SECRET-KEY-123/);
  assert.doesNotMatch(app.storage.data.get(KEY), /SECRET-KEY-123/);
  assert.equal(app.run("state.geminiReadback"), "Solid night.");
  assert.equal(app.els["#gemini-output"].textContent, "Solid night.");
});
