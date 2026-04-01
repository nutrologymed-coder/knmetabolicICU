// Export module for KNmetabolicUTI
// Provides PDF (via window.print), CSV and JSON download helpers.
(function (global) {
  "use strict";

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function r1(v) {
    return Number.isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : "—";
  }
  function ri(v) {
    return Number.isFinite(v) ? String(Math.round(v)) : "—";
  }

  /** Trigger a file download in the browser. */
  function download(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  /**
   * Export full result set as a JSON file.
   * @param {object} payload  The structured result object to serialise.
   */
  function exportJSON(payload) {
    const content = JSON.stringify(payload, null, 2);
    download("metabolic_report.json", content, "application/json");
  }

  // ─── CSV Export ───────────────────────────────────────────────────────────

  /**
   * Export result set as a CSV file.
   * @param {object} payload  Same object used for JSON export.
   * @param {string} lang     Language key for header labels.
   */
  function exportCSV(payload, lang) {
    const t = global.TRANSLATIONS[lang];
    const lines = [];

    // Section: Patient
    lines.push(["", ""]);
    lines.push(["=== " + t.cardDemographics + " ===", ""]);
    lines.push([t.sex, payload.patient.sex || "—"]);
    lines.push([t.height + " (cm)", ri(payload.patient.heightCm)]);
    lines.push([t.weight + " (kg)", r1(payload.patient.weightKg)]);
    lines.push([t.age, ri(payload.patient.age)]);
    lines.push([t.bmi, r1(payload.patient.bmi)]);
    lines.push([t.idealWeight + " (kg)", r1(payload.patient.ibwKg)]);
    lines.push([t.adjustedWeight + " (kg)", r1(payload.patient.adjustedKg)]);

    // Section: Best result
    lines.push(["", ""]);
    lines.push(["=== " + t.metabolicPlan + " ===", ""]);
    lines.push([t.recommendedMethod, payload.best.key]);
    lines.push([t.energyGoal + " (" + t.kcalDay + ")", ri(payload.best.ee)]);
    lines.push([t.goalPerKg + " (" + t.kcalKgDay + ")", r1(payload.best.eePerKg)]);

    // Section: Body composition (if available)
    if (payload.best.composition) {
      lines.push(["", ""]);
      lines.push(["=== " + t.bodyComposition + " ===", ""]);
      lines.push([t.fatPercent + " (%)", r1(payload.best.composition.fatPct)]);
      lines.push([t.fatMass + " (kg)", r1(payload.best.composition.fatMass)]);
      lines.push([t.ffm + " (kg)", r1(payload.best.composition.ffm)]);
    }

    // Section: All methods
    lines.push(["", ""]);
    lines.push(["=== " + t.allMethods + " ===", ""]);
    lines.push(["#", t.recommendedMethod, t.energyGoal + " " + t.kcalDay, "Note"]);
    payload.methods.forEach((m, i) => {
      lines.push([i + 1, m.key, ri(m.ee), m.note]);
    });

    const csv = lines.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    download("metabolic_report.csv", csv, "text/csv;charset=utf-8;");
  }

  // ─── PDF Export ───────────────────────────────────────────────────────────

  /**
   * Open a new window with a print-ready HTML report and trigger the print dialog.
   * @param {object} payload  Structured result object.
   * @param {string} lang
   */
  function exportPDF(payload, lang) {
    const t = global.TRANSLATIONS[lang];

    const compSection = payload.best.composition
      ? `<h2>${t.bodyComposition}</h2>
         <table>
           <tr><td>${t.fatPercent}</td><td>${r1(payload.best.composition.fatPct)} %</td></tr>
           <tr><td>${t.fatMass}</td><td>${r1(payload.best.composition.fatMass)} ${t.kg}</td></tr>
           <tr><td>${t.ffm}</td><td>${r1(payload.best.composition.ffm)} ${t.kg}</td></tr>
         </table>`
      : "";

    const methodRows = payload.methods
      .map(
        (m, i) =>
          `<tr><td>${i + 1}</td><td>${m.key}</td><td>${ri(m.ee)}</td><td>${m.note}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="${lang === "pt" ? "pt-BR" : "en"}">
<head>
  <meta charset="UTF-8"/>
  <title>${t.appTitle} – ${t.metabolicPlan}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:20mm}
    h1{font-size:18px;margin-bottom:4px}
    h2{font-size:14px;margin-top:16px;margin-bottom:4px;border-bottom:1px solid #bbb;padding-bottom:2px}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    td,th{border:1px solid #ccc;padding:5px 8px;text-align:left}
    th{background:#f0f0f0;font-weight:bold}
    .footer{font-size:10px;color:#777;margin-top:20px;border-top:1px solid #ddd;padding-top:6px}
    @media print{body{margin:10mm}}
  </style>
</head>
<body>
  <h1>${t.appTitle}</h1>
  <p style="margin:0;color:#555">${t.appSubtitle}</p>
  <p style="font-size:11px;color:#888">${new Date().toLocaleString(lang === "pt" ? "pt-BR" : "en-US")}</p>

  <h2>${t.cardDemographics}</h2>
  <table>
    <tr><td>${t.sex}</td><td>${payload.patient.sex === "M" ? t.male : payload.patient.sex === "F" ? t.female : "—"}</td></tr>
    <tr><td>${t.height}</td><td>${ri(payload.patient.heightCm)} cm</td></tr>
    <tr><td>${t.weight}</td><td>${r1(payload.patient.weightKg)} ${t.kg}</td></tr>
    <tr><td>${t.age}</td><td>${ri(payload.patient.age)}</td></tr>
    <tr><td>${t.bmi}</td><td>${r1(payload.patient.bmi)}</td></tr>
    <tr><td>${t.idealWeight}</td><td>${r1(payload.patient.ibwKg)} ${t.kg}</td></tr>
    <tr><td>${t.adjustedWeight}</td><td>${r1(payload.patient.adjustedKg)} ${t.kg}</td></tr>
  </table>

  <h2>${t.metabolicPlan}</h2>
  <table>
    <tr><td>${t.recommendedMethod}</td><td><b>${payload.best.key}</b> — ${payload.best.label}</td></tr>
    <tr><td>${t.energyGoal}</td><td><b>${ri(payload.best.ee)} ${t.kcalDay}</b></td></tr>
    <tr><td>${t.goalPerKg}</td><td>${r1(payload.best.eePerKg)} ${t.kcalKgDay}</td></tr>
  </table>

  ${compSection}

  <h2>${t.allMethods}</h2>
  <table>
    <thead><tr><th>#</th><th>${t.recommendedMethod}</th><th>${t.energyGoal} (kcal/day)</th><th>Note</th></tr></thead>
    <tbody>${methodRows}</tbody>
  </table>

  <p class="footer">
    ${t.priorityNote}<br>
    ${t.obesityNote}
  </p>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      alert("Habilite pop-ups para exportar PDF. / Enable pop-ups to export PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  // ─── Exports ──────────────────────────────────────────────────────────────
  global.Exporters = { exportJSON, exportCSV, exportPDF };
})(window);
