// Guard: every calculator must have a validation-registry entry with a source and valid status.
const assert = require("assert");
const S = require("../js/scores.js");
const reg = require("../validation/registry.json").calculators;

S.list.forEach((c) => {
  const e = reg[c.id];
  assert(e, "No validation registry entry for calculator: " + c.id);
  assert(e.source && e.source.length > 3, "Missing source for " + c.id);
  assert(["pending_review", "reviewed"].includes(e.status), "Invalid status for " + c.id);
  if (e.status === "reviewed") assert(Array.isArray(e.reviewers) && e.reviewers.length >= 2, c.id + ": reviewed requires >= 2 reviewers");
});
Object.keys(reg).forEach((id) => assert(S.byId(id), "Registry entry without calculator: " + id));
console.log("Validation registry consistent (" + S.list.length + " calculators)");
