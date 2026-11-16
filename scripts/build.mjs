// Copies only the public site files into dist/ (tests, docs, supabase etc. are never deployed).
import { cpSync, rmSync, mkdirSync, existsSync } from "node:fs";

export const PUBLIC = [
  "index.html", "calculators.html", "manifest.webmanifest", "sw.js", "_headers",
  "icon-192.png", "icon-512.png", "js", "css"
];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const p of PUBLIC) {
  if (!existsSync(p)) throw new Error("Missing public file: " + p);
  cpSync(p, "dist/" + p, { recursive: true });
}
console.log("Built dist/ with:", PUBLIC.join(", "));
