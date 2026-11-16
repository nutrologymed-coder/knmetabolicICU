// Guard: every calculator must have a validation-registry entry with a source and valid status.
const assert = require("assert");
const S = require("../js/scores.js");
const reg = require("../validation/registry.json").calculators;

S.list.forEach((c) => {
  const e = reg[c.id];
  assert(e, "No validation registry entry for calculator: " + c.id);
  assert(e.source && e.source.length > 3, "Missing source for " + c.id);
  assert(["pending_review", "reviewed"].includes(e.status), "Invalid status for " + c.id);
  if (e.status === "reviewed") {
    const ids = Array.isArray(e.reviewers) ? e.reviewers : [];
    assert(ids.every((r) => typeof r === "string" && r.trim().length > 1), c.id + ": reviewers must be non-empty identifiers");
    assert(new Set(ids.map((r) => r.trim().toLowerCase())).size >= 2, c.id + ": reviewed requires >= 2 distinct reviewers");
  }
});
Object.keys(reg).forEach((id) => assert(S.byId(id), "Registry entry without calculator: " + id));
console.log("Validation registry consistent (" + S.list.length + " calculators)");
