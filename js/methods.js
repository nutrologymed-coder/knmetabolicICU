// Modular calculation methods for KNmetabolicUTI
// Each method returns: { key, label, reliability, ee, composition, note }
// composition (nullable): { fatPct, fatMass, ffm }
(function (global) {
  "use strict";

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function isFinitePos(v) {
    return Number.isFinite(v) && v > 0;
  }

  /**
   * Ideal Body Weight – Devine formula.
   * @param {string} sex  "M" or "F"
   * @param {number} hCm  Height in centimetres
   * @returns {number} IBW in kg, or NaN
   */
  function ibwDevine(sex, hCm) {
    if (!isFinitePos(hCm) || hCm < 100) return NaN;
    const inches = hCm / 2.54;
    const over5ft = Math.max(0, inches - 60);
    return sex === "F" ? 45.5 + 2.3 * over5ft : 50 + 2.3 * over5ft;
  }

  // ─── Method 1: Indirect Calorimetry ───────────────────────────────────────

  /**
   * Indirect Calorimetry – direct measured REE.
   * @param {number} icKcalDay  Measured kcal/day
   * @param {string} lang       Current language key
   */
  function calcIC(icKcalDay, lang) {
    const t = global.TRANSLATIONS[lang];
    if (!isFinitePos(icKcalDay)) return null;
    return {
      key: "IC",
      label: t.method_ic,
      reliability: 1,
      ee: icKcalDay,
      composition: null,
      note: t.noteIC,
    };
  }

  // ─── Method 2: DXA ────────────────────────────────────────────────────────

  /**
   * DXA – Cunningham (1980) REE equation: REE = 500 + 22 × FFM.
   * EE = REE × 1.1 (stress/activity factor for ICU).
   * @param {number} ffm     Fat-free mass in kg
   * @param {number|null} fm Fat mass in kg (optional, for body composition)
   * @param {number} weight  Body weight in kg (used if fm not provided)
   * @param {string} lang
   */
  function calcDXA(ffm, fm, weight, lang) {
    const t = global.TRANSLATIONS[lang];
    if (!isFinitePos(ffm)) return null;
    const ree = 500 + 22 * ffm;
    const ee = ree * 1.1;
    const fatMass = isFinitePos(fm) ? fm : isFinitePos(weight) ? weight - ffm : NaN;
    const fatPct = isFinitePos(weight) && isFinitePos(fatMass) ? (fatMass / weight) * 100 : NaN;
    return {
      key: "DXA",
      label: t.method_dxa,
      reliability: 2,
      ee,
      composition: {
        fatPct: Number.isFinite(fatPct) ? fatPct : NaN,
        fatMass: Number.isFinite(fatMass) ? fatMass : NaN,
        ffm,
      },
      note: t.noteDXA,
    };
  }

  // ─── Method 3: BIA ────────────────────────────────────────────────────────

  /**
   * BIA – Cunningham (1980) REE equation: REE = 500 + 22 × FFM.
   * EE = REE × 1.1.
   * @param {number} ffm     Fat-free mass in kg
   * @param {number|null} fm Fat mass in kg (optional)
   * @param {number} weight  Body weight in kg
   * @param {string} lang
   */
  function calcBIA(ffm, fm, weight, lang) {
    const t = global.TRANSLATIONS[lang];
    if (!isFinitePos(ffm)) return null;
    const ree = 500 + 22 * ffm;
    const ee = ree * 1.1;
    const fatMass = isFinitePos(fm) ? fm : isFinitePos(weight) ? weight - ffm : NaN;
    const fatPct = isFinitePos(weight) && isFinitePos(fatMass) ? (fatMass / weight) * 100 : NaN;
    return {
      key: "BIA",
      label: t.method_bia,
      reliability: 3,
      ee,
      composition: {
        fatPct: Number.isFinite(fatPct) ? fatPct : NaN,
        fatMass: Number.isFinite(fatMass) ? fatMass : NaN,
        ffm,
      },
      note: t.noteBIA,
    };
  }

  // ─── Method 4: Skinfold Measurements (Pregas Cutâneas) ───────────────────

  /**
   * Jackson-Pollock 3-site skinfold equation.
   *
   * Men   (sites: chest, abdominal, thigh):
   *   Density = 1.10938 − 0.0008267·S + 0.0000016·S² − 0.0002574·A
   * Women (sites: tricep, suprailiac, thigh):
   *   Density = 1.0994921 − 0.0009929·S + 0.0000023·S² − 0.0001392·A
   * % fat = (495 / density) − 450   (Siri, 1956)
   *
   * EE computed via Cunningham: REE = 500 + 22 × FFM; EE = REE × 1.1
   *
   * @param {string} sex          "M" or "F"
   * @param {number} age          Age in years
   * @param {object} sites        Skinfold sites in mm (see properties below)
   *   For men:   { chest, abdominal, thigh }
   *   For women: { tricep, suprailiac, thigh }
   * @param {number} weight       Body weight in kg
   * @param {string} lang
   */
  function calcSkinfolds(sex, age, sites, weight, lang) {
    const t = global.TRANSLATIONS[lang];
    if (!isFinitePos(age) || !isFinitePos(weight)) return null;

    let sum, density;
    if (sex === "M") {
      const { chest, abdominal, thigh } = sites;
      if (!isFinitePos(chest) || !isFinitePos(abdominal) || !isFinitePos(thigh)) return null;
      sum = chest + abdominal + thigh;
      density = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age;
    } else if (sex === "F") {
      const { tricep, suprailiac, thigh } = sites;
      if (!isFinitePos(tricep) || !isFinitePos(suprailiac) || !isFinitePos(thigh)) return null;
      sum = tricep + suprailiac + thigh;
      density = 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
    } else {
      return null;
    }

    if (!isFinitePos(density) || density < 0.9 || density > 1.15) return null;

    const fatPct = 495 / density - 450;
    if (!Number.isFinite(fatPct) || fatPct < 0 || fatPct > 70) return null;

    const fatMass = weight * (fatPct / 100);
    const ffm = weight - fatMass;
    if (!isFinitePos(ffm)) return null;

    const ree = 500 + 22 * ffm;
    const ee = ree * 1.1;

    return {
      key: "SF",
      label: t.method_skinfolds,
      reliability: 4,
      ee,
      composition: { fatPct, fatMass, ffm },
      note: t.noteSF,
    };
  }

  // ─── Method 5: VCO₂ / Weir ───────────────────────────────────────────────

  /**
   * Indirect EE estimate from expired CO₂ via Weir equation.
   * VCO₂ (mL/min) = VE × (PaCO₂ / 863) × 1000
   * EE (kcal/day) = 1.44 × [3.941 × VO₂ + 1.106 × VCO₂]
   * VO₂ = VCO₂ / RQ
   *
   * @param {number} ve    Minute ventilation in L/min
   * @param {number} paco2 Arterial CO₂ in mmHg
   * @param {number} rq    Respiratory quotient (0.60–1.20)
   * @param {string} lang
   */
  function calcVCO2(ve, paco2, rq, lang) {
    const t = global.TRANSLATIONS[lang];
    if (
      !isFinitePos(ve) ||
      !isFinitePos(paco2) ||
      !Number.isFinite(rq) ||
      rq < 0.6 ||
      rq > 1.2
    )
      return null;
    const vco2 = (ve * paco2 / 863) * 1000; // mL/min
    const vo2 = vco2 / rq;
    const ee = 1.44 * (3.941 * vo2 + 1.106 * vco2);
    return {
      key: "VCO2",
      label: t.method_vco2,
      reliability: 5,
      ee,
      composition: null,
      note: t.noteVCO2,
    };
  }

  // ─── Method 6: Physical Examination ─────────────────────────────────────

  /**
   * Simple kcal/kg/day clinical estimate.
   * @param {number} kcalKg    22, 25 or 30 kcal/kg/day
   * @param {number} weight    Dosing weight in kg
   * @param {string} weightLbl Human-readable weight basis label
   * @param {string} lang
   */
  function calcExam(kcalKg, weight, weightLbl, lang) {
    const t = global.TRANSLATIONS[lang];
    if (!isFinitePos(kcalKg) || !isFinitePos(weight)) return null;
    const ee = kcalKg * weight;
    return {
      key: "EXAM",
      label: t.method_exam,
      reliability: 6,
      ee,
      composition: null,
      note: `${t.noteExam} (${weightLbl})`,
    };
  }

  // ─── Collector ────────────────────────────────────────────────────────────

  /**
   * Collect all applicable methods from form data.
   * Returns an array sorted by reliability (ascending = most reliable first).
   *
   * @param {object} data  Parsed form values
   * @param {string} lang  Current language
   */
  function collectMethods(data, lang) {
    const results = [];

    const push = (m) => { if (m) results.push(m); };

    push(calcIC(data.ic, lang));
    push(calcDXA(data.dxaFfm, data.dxaFm, data.weight, lang));
    push(calcBIA(data.biaFfm, data.biaFm, data.weight, lang));
    push(calcSkinfolds(data.sex, data.age, data.skinfolds, data.weight, lang));
    push(calcVCO2(data.ve, data.paco2, data.rq, lang));
    push(calcExam(data.examKcalKg, data.examWeight, data.examWeightLabel, lang));

    return results.sort((a, b) => a.reliability - b.reliability);
  }

  // ─── Exports ──────────────────────────────────────────────────────────────
  global.Methods = {
    ibwDevine,
    calcIC,
    calcDXA,
    calcBIA,
    calcSkinfolds,
    calcVCO2,
    calcExam,
    collectMethods,
  };
})(window);
