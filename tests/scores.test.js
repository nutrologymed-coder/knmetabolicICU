// Run: node tests/scores.test.js
const assert = require("assert");
const S = require("../js/scores.js");

const val = (id, v, i = 0) => S.byId(id).calc(v).results[i].value;
const near = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b}`);

near(val("bmi", { wt: 70, ht: 170 }), 24.2, 0.05, "BMI");
near(val("ibw", { sex: "M", ht: 170, wt: 95 }), 65.9, 0.1, "IBW male");
near(val("bsa", { wt: 70, ht: 175 }), 1.84, 0.01, "BSA");
near(val("homa", { glu: 90, ins: 9 }), 2.0, 0.01, "HOMA-IR");
near(val("fib4", { age: 50, ast: 40, alt: 40, plt: 200 }), 1.58, 0.01, "FIB-4");
near(val("ckdepi", { sex: "M", age: 50, cr: 1.0 }), 92, 1, "CKD-EPI male");
near(val("ckdepi", { sex: "F", age: 60, cr: 0.8 }), 84, 1, "CKD-EPI female");
near(val("cg", { sex: "M", age: 60, wt: 80, cr: 1.2 }), 74, 1, "Cockcroft-Gault");
near(val("ag", { na: 140, cl: 100, hco3: 24, alb: 2 }), 16, 0.01, "AG");
near(val("ag", { na: 140, cl: 100, hco3: 24, alb: 2 }, 1), 21, 0.01, "AG corrected");
near(val("ca", { ca: 8, alb: 2 }), 9.6, 0.01, "Corrected Ca");
near(val("osm", { na: 140, glu: 90, bun: 14 }), 290, 1, "Osm");
near(val("pf", { pao2: 90, fio2: 50 }), 180, 0.1, "P/F");
assert.strictEqual(val("meld", { bili: 2, inr: 1.5, cr: 1.5 }), 17, "MELD");
assert.strictEqual(val("meld", { bili: 0.5, inr: 1, cr: 0.8 }), 6, "MELD floor");
assert.strictEqual(val("qsofa", { rr: true, sbp: true }), 2, "qSOFA");
assert.strictEqual(val("mnutric", { age: 76, apache: 20, sofa: 10, comorb: 2, days: 1 }), 2 + 2 + 2 + 1 + 1, "mNUTRIC");
assert.strictEqual(val("sofa", { pao2: 80, fio2: 100, vent: true, plt: 90, bili: 2.5, cv: "3", gcs: 12, cr: 2.1 }), 4 + 2 + 2 + 3 + 2 + 2, "SOFA");
assert.strictEqual(S.byId("bmi").calc({ wt: 70 }).error, "ht", "missing field reported");

console.log("All score tests passed (" + S.list.length + " calculators registered)");
