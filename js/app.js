// Main application logic for KNmetabolicUTI
(function (global) {
  "use strict";

  // ─── State ─────────────────────────────────────────────────────────────────
  let currentLang = "pt";
  let lastPayload = null; // stores last calculated result for export

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const round = (x) => Math.round(x);
  const round1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

  function parseNum(val) {
    const s = (val || "").toString().trim().replace(",", ".");
    const x = Number(s);
    return Number.isFinite(x) ? x : NaN;
  }

  function t(key) {
    return global.TRANSLATIONS[currentLang][key] || key;
  }

  // ─── Language ──────────────────────────────────────────────────────────────

  function applyTranslations() {
    const tr = global.TRANSLATIONS[currentLang];

    // Elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (tr[key] !== undefined) el.innerHTML = tr[key];
    });

    // Placeholders
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const key = el.getAttribute("data-i18n-ph");
      if (tr[key] !== undefined) el.placeholder = tr[key];
    });

    // Option text inside selects
    document.querySelectorAll("[data-i18n-opt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-opt");
      if (tr[key] !== undefined) el.textContent = tr[key];
    });

    // html lang attribute + document title
    document.documentElement.lang = currentLang === "pt" ? "pt-BR" : "en";
    document.title = tr.appTitle;

    // Skinfold site visibility depends on current sex selection
    updateSkinfoldVisibility();
  }

  function toggleLanguage() {
    currentLang = currentLang === "pt" ? "en" : "pt";
    applyTranslations();
    // Reset result area
    const out = $("out");
    const kpi = $("kpi");
    const exportBar = $("exportBar");
    out.innerHTML = `<span class="pill">${t("ready")}</span><br>${t("readyMsg")}`;
    kpi.style.display = "none";
    exportBar.style.display = "none";
    lastPayload = null;
  }

  // ─── Dynamic UI helpers ────────────────────────────────────────────────────

  /** Show/hide skinfold site inputs based on selected sex. */
  function updateSkinfoldVisibility() {
    const sex = $("sex").value;
    const menDiv = $("sf_men");
    const womenDiv = $("sf_women");
    if (menDiv) menDiv.style.display = sex === "M" ? "" : "none";
    if (womenDiv) womenDiv.style.display = sex === "F" ? "" : "none";
  }

  // ─── Form Data ─────────────────────────────────────────────────────────────

  function getFormData() {
    const sex = $("sex").value;
    const height = parseNum($("ht").value);
    const weight = parseNum($("wt").value);
    const age = parseNum($("age").value);
    const rqRaw = $("rq").value.trim();
    const rq = rqRaw === "" ? 0.85 : parseNum(rqRaw);

    const ibw = global.Methods.ibwDevine(sex || "M", height);
    const bmi =
      Number.isFinite(weight) && Number.isFinite(height) && height > 0
        ? weight / Math.pow(height / 100, 2)
        : NaN;
    const obese = Number.isFinite(bmi) && bmi >= 30;
    const adjusted =
      Number.isFinite(ibw) && Number.isFinite(weight)
        ? ibw + 0.25 * (weight - ibw)
        : NaN;

    // Exam weight basis
    const basis = $("exam_weight_basis").value;
    let examWeight = NaN;
    let examWeightLabel = "";
    if (basis === "actual") {
      examWeight = weight;
      examWeightLabel = t("weightActual");
    } else if (basis === "ideal") {
      examWeight = ibw;
      examWeightLabel = t("idealWeight");
    } else if (basis === "adjusted") {
      examWeight = adjusted;
      examWeightLabel = t("adjustedWeight");
    } else {
      if (obese && Number.isFinite(adjusted)) {
        examWeight = adjusted;
        examWeightLabel = t("autoAdjusted");
      } else {
        examWeight = weight;
        examWeightLabel = t("autoActual");
      }
    }

    return {
      sex,
      height,
      weight,
      age,
      rq,
      ibw,
      bmi,
      obese,
      adjusted,
      ic: parseNum($("ic").value),
      dxaFfm: parseNum($("dxa_ffm").value),
      dxaFm: parseNum($("dxa_fm").value),
      biaFfm: parseNum($("bia_ffm").value),
      biaFm: parseNum($("bia_fm").value),
      skinfolds: {
        chest: parseNum($("sf_chest").value),
        abdominal: parseNum($("sf_abdominal").value),
        tricep: parseNum($("sf_tricep").value),
        suprailiac: parseNum($("sf_suprailiac").value),
        thigh: parseNum($("sf_thigh").value),
      },
      ve: parseNum($("ve").value),
      paco2: parseNum($("paco2").value),
      examKcalKg: parseNum($("exam_kcalkg").value),
      examWeight,
      examWeightLabel,
    };
  }

  // ─── Calculate ─────────────────────────────────────────────────────────────

  function calc() {
    const data = getFormData();
    const methods = global.Methods.collectMethods(data, currentLang);

    const out = $("out");
    const kpi = $("kpi");
    const exportBar = $("exportBar");

    if (methods.length === 0) {
      kpi.style.display = "none";
      exportBar.style.display = "none";
      out.innerHTML = `<span class="pill">${t("noData")}</span><br>${t("noDataMsg")}`;
      lastPayload = null;
      return;
    }

    const best = methods[0];
    // Dosing weight: use adjusted for obese, otherwise actual weight
    const wtDose =
      data.obese && Number.isFinite(data.adjusted) ? data.adjusted : data.weight;
    const eePerKg =
      Number.isFinite(wtDose) && wtDose > 0 ? best.ee / wtDose : NaN;

    // ── Body composition block (from best method that has composition data)
    const withComp = methods.find((m) => m.composition);

    let compHtml = "";
    if (withComp) {
      const c = withComp.composition;
      const rows = [
        Number.isFinite(c.fatPct)
          ? `<div class="box"><div class="t">${t("fatPercent")}</div><div class="v">${round1(c.fatPct)}</div><div class="u">%</div></div>`
          : "",
        Number.isFinite(c.fatMass)
          ? `<div class="box"><div class="t">${t("fatMass")}</div><div class="v">${round1(c.fatMass)}</div><div class="u">${t("kg")}</div></div>`
          : "",
        Number.isFinite(c.ffm)
          ? `<div class="box"><div class="t">${t("ffm")}</div><div class="v">${round1(c.ffm)}</div><div class="u">${t("kg")}</div></div>`
          : "",
      ]
        .filter(Boolean)
        .join("");
      if (rows) {
        compHtml = `<div style="margin-top:10px"><span class="pill">${t("bodyComposition")}</span> <span class="small">(${withComp.key})</span><div class="kpi" style="display:grid;margin-top:6px">${rows}</div></div>`;
      }
    }

    // ── Method rows
    const methodRows = methods
      .map(
        (m, i) =>
          `${i + 1}. <b>${m.key}</b> – ${round(m.ee)} ${t("kcalDay")} <span class="small">(${m.note})</span>`
      )
      .join("<br>");

    // ── Diagnostics line
    const aux = [
      Number.isFinite(data.bmi)
        ? `${t("bmi")}: <b>${round1(data.bmi)}</b>${data.obese ? " (" + t("obesity") + ")" : ""}`
        : null,
      Number.isFinite(data.ibw)
        ? `${t("idealWeight")}: <b>${round1(data.ibw)} ${t("kg")}</b>`
        : null,
      Number.isFinite(data.adjusted)
        ? `${t("adjustedWeight")}: <b>${round1(data.adjusted)} ${t("kg")}</b>`
        : null,
    ]
      .filter(Boolean)
      .join(" • ");

    out.innerHTML =
      `<span class="pill">${t("metabolicPlan")}</span><br>` +
      `${t("prioritizedMethod")}: <b>${best.key}</b> (${t("reliabilityLevel")} ${best.reliability})<br>` +
      `${t("suggestedGoal")}: <b>${round(best.ee)} ${t("kcalDay")}</b><br><br>` +
      `<b>${t("allMethods")}:</b><br>${methodRows}<br><br>` +
      `<span class="small">${aux}</span>` +
      compHtml;

    // ── KPI boxes
    $("v_method").textContent = best.key;
    $("v_ee").textContent = round(best.ee);
    $("v_eekg").textContent = Number.isFinite(eePerKg) ? round1(eePerKg) : "—";
    $("kpi_method_label").textContent = t("recommendedMethod");
    $("kpi_ee_label").textContent = t("energyGoal");
    $("kpi_ee_unit").textContent = t("kcalDay");
    $("kpi_eekg_label").textContent = t("goalPerKg");
    $("kpi_eekg_unit").textContent = t("kcalKgDay");
    kpi.style.display = "grid";
    exportBar.style.display = "flex";

    // ── Build export payload
    lastPayload = {
      patient: {
        sex: data.sex,
        heightCm: data.height,
        weightKg: data.weight,
        age: data.age,
        bmi: data.bmi,
        ibwKg: data.ibw,
        adjustedKg: data.adjusted,
      },
      best: {
        key: best.key,
        label: best.label,
        ee: best.ee,
        eePerKg,
        composition: withComp ? withComp.composition : null,
      },
      methods: methods.map((m) => ({
        key: m.key,
        label: m.label,
        reliability: m.reliability,
        ee: m.ee,
        note: m.note,
        composition: m.composition || null,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Clear ──────────────────────────────────────────────────────────────────

  function clearAll() {
    [
      "sex", "ht", "wt", "age", "rq",
      "ic",
      "dxa_ffm", "dxa_fm",
      "bia_ffm", "bia_fm",
      "sf_chest", "sf_abdominal", "sf_tricep", "sf_suprailiac", "sf_thigh",
      "ve", "paco2",
      "exam_kcalkg",
    ].forEach((id) => { const el = $(id); if (el) el.value = ""; });
    $("exam_weight_basis").value = "auto";
    $("kpi").style.display = "none";
    $("exportBar").style.display = "none";
    $("out").innerHTML = `<span class="pill">${t("ready")}</span><br>${t("readyMsg")}`;
    lastPayload = null;
    updateSkinfoldVisibility();
  }

  // ─── Exports ────────────────────────────────────────────────────────────────

  function onExportJSON() {
    if (lastPayload) global.Exporters.exportJSON(lastPayload);
  }
  function onExportCSV() {
    if (lastPayload) global.Exporters.exportCSV(lastPayload, currentLang);
  }
  function onExportPDF() {
    if (lastPayload) global.Exporters.exportPDF(lastPayload, currentLang);
  }

  // ─── Init ──────────────────────────────────────────────────────────────────

  function init() {
    $("btn").addEventListener("click", calc);
    $("clear").addEventListener("click", clearAll);
    $("langBtn").addEventListener("click", toggleLanguage);
    $("btnExportJSON").addEventListener("click", onExportJSON);
    $("btnExportCSV").addEventListener("click", onExportCSV);
    $("btnExportPDF").addEventListener("click", onExportPDF);
    $("sex").addEventListener("change", updateSkinfoldVisibility);

    applyTranslations();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () =>
        navigator.serviceWorker.register("./sw.js").catch(() => {})
      );
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
