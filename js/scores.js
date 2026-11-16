// Medical calculators and scores registry (pure functions, no DOM).
// Each calculator: { id, group, name:{pt,en}, ref, fields:[...], calc(values) -> {results:[...]} | {error} }
// Field types: number {id,label,unit,min,max}, select {id,label,options:[{v,label}]}, check {id,label}
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SCORES = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const L = (pt, en) => ({ pt, en });
  const num = (id, pt, en, unit, extra) => Object.assign({ type: "number", id, label: L(pt, en), unit }, extra || {});
  const sel = (id, pt, en, options) => ({ type: "select", id, label: L(pt, en), options });
  const chk = (id, pt, en) => ({ type: "check", id, label: L(pt, en) });
  const opt = (v, pt, en) => ({ v: String(v), label: L(pt, en) });
  const r = (label, value, unit, note) => ({ label, value, unit: unit || "", note: note || null });
  const fix = (x, d) => Number(x.toFixed(d === undefined ? 1 : d));
  const sexOpts = [opt("M", "Masculino", "Male"), opt("F", "Feminino", "Female")];

  function missing(v, ids) {
    for (const id of ids) {
      if (v[id] === undefined || v[id] === null || v[id] === "" || Number.isNaN(v[id])) return id;
    }
    return null;
  }
  const err = (id) => ({ error: id });

  // ─── Nutrition / anthropometry ───────────────────────────────────────────
  const bmi = {
    id: "bmi", group: "nutrition", name: L("IMC", "BMI"), ref: "WHO",
    fields: [num("wt", "Peso", "Weight", "kg", { min: 1, max: 500 }), num("ht", "Altura", "Height", "cm", { min: 30, max: 250 })],
    calc(v) {
      const m = missing(v, ["wt", "ht"]); if (m) return err(m);
      const b = v.wt / Math.pow(v.ht / 100, 2);
      const cat = b < 18.5 ? L("Baixo peso", "Underweight") : b < 25 ? L("Eutrofia", "Normal weight")
        : b < 30 ? L("Sobrepeso", "Overweight") : b < 35 ? L("Obesidade grau I", "Obesity class I")
        : b < 40 ? L("Obesidade grau II", "Obesity class II") : L("Obesidade grau III", "Obesity class III");
      return { results: [r(L("IMC", "BMI"), fix(b), "kg/m²", cat)] };
    }
  };

  const idealWeight = {
    id: "ibw", group: "nutrition", name: L("Peso ideal / ajustado", "Ideal / adjusted weight"), ref: "Devine",
    fields: [sel("sex", "Sexo", "Sex", sexOpts), num("ht", "Altura", "Height", "cm", { min: 100, max: 250 }), num("wt", "Peso atual", "Actual weight", "kg", { min: 1, max: 500 })],
    calc(v) {
      const m = missing(v, ["sex", "ht", "wt"]); if (m) return err(m);
      const inches = v.ht / 2.54;
      const ibw = (v.sex === "M" ? 50 : 45.5) + 2.3 * Math.max(inches - 60, 0);
      const adj = ibw + 0.25 * (v.wt - ibw);
      return { results: [
        r(L("Peso ideal (Devine)", "Ideal weight (Devine)"), fix(ibw), "kg"),
        r(L("Peso ajustado (PI + 0,25×(PA−PI))", "Adjusted weight (IBW + 0.25×(AW−IBW))"), fix(adj), "kg"),
        r(L("% do peso ideal", "% of ideal weight"), fix((v.wt / ibw) * 100, 0), "%")
      ] };
    }
  };

  const bsa = {
    id: "bsa", group: "nutrition", name: L("Superfície corporal", "Body surface area"), ref: "Mosteller",
    fields: [num("wt", "Peso", "Weight", "kg", { min: 1, max: 500 }), num("ht", "Altura", "Height", "cm", { min: 30, max: 250 })],
    calc(v) {
      const m = missing(v, ["wt", "ht"]); if (m) return err(m);
      return { results: [r(L("SC", "BSA"), fix(Math.sqrt((v.ht * v.wt) / 3600), 2), "m²")] };
    }
  };

  const weightLoss = {
    id: "wtloss", group: "nutrition", name: L("Perda de peso (%)", "Weight loss (%)"), ref: "",
    fields: [num("usual", "Peso habitual", "Usual weight", "kg", { min: 1, max: 500 }), num("wt", "Peso atual", "Current weight", "kg", { min: 1, max: 500 }),
      sel("period", "Período", "Period", [opt("1w", "1 semana", "1 week"), opt("1m", "1 mês", "1 month"), opt("3m", "3 meses", "3 months"), opt("6m", "6 meses", "6 months")])],
    calc(v) {
      const m = missing(v, ["usual", "wt", "period"]); if (m) return err(m);
      const p = ((v.usual - v.wt) / v.usual) * 100;
      const th = { "1w": 2, "1m": 5, "3m": 7.5, "6m": 10 }[v.period];
      const sig = p > th ? L("Perda significativa para o período", "Significant loss for the period") : L("Abaixo do limiar de perda significativa", "Below significant-loss threshold");
      return { results: [r(L("Perda de peso", "Weight loss"), fix(p), "%", sig)] };
    }
  };

  const targets = {
    id: "targets", group: "nutrition", name: L("Metas calórico-proteicas (UTI)", "ICU energy/protein targets"), ref: "ESPEN/ASPEN",
    fields: [num("wt", "Peso de referência", "Reference weight", "kg", { min: 1, max: 500 }),
      num("kcal", "Meta calórica", "Energy target", "kcal/kg", { min: 10, max: 40, def: 25 }),
      num("pmin", "Proteína mínima", "Protein min", "g/kg", { min: 0.5, max: 3, def: 1.2 }),
      num("pmax", "Proteína máxima", "Protein max", "g/kg", { min: 0.5, max: 3, def: 2 })],
    calc(v) {
      const m = missing(v, ["wt", "kcal", "pmin", "pmax"]); if (m) return err(m);
      return { results: [
        r(L("Energia", "Energy"), fix(v.wt * v.kcal, 0), "kcal/dia"),
        r(L("Proteína", "Protein"), fix(v.wt * v.pmin, 0) + "–" + fix(v.wt * v.pmax, 0), "g/dia")
      ] };
    }
  };

  const mnutric = {
    id: "mnutric", group: "nutrition", name: L("mNUTRIC", "mNUTRIC"), ref: "Heyland 2011 (sem IL-6)",
    fields: [num("age", "Idade", "Age", "anos", { min: 0, max: 120 }), num("apache", "APACHE II", "APACHE II", "pts", { min: 0, max: 71 }),
      num("sofa", "SOFA", "SOFA", "pts", { min: 0, max: 24 }), num("comorb", "Nº de comorbidades", "Comorbidities", "", { min: 0, max: 20 }),
      num("days", "Dias de internação antes da UTI", "Days in hospital before ICU", "dias", { min: 0, max: 365 })],
    calc(v) {
      const m = missing(v, ["age", "apache", "sofa", "comorb", "days"]); if (m) return err(m);
      const s = (v.age < 50 ? 0 : v.age < 75 ? 1 : 2) + (v.apache < 15 ? 0 : v.apache < 20 ? 1 : v.apache < 28 ? 2 : 3)
        + (v.sofa < 6 ? 0 : v.sofa < 10 ? 1 : 2) + (v.comorb >= 2 ? 1 : 0) + (v.days >= 1 ? 1 : 0);
      return { results: [r(L("mNUTRIC", "mNUTRIC"), s, "/9", s >= 5 ? L("Alto risco nutricional", "High nutritional risk") : L("Baixo risco nutricional", "Low nutritional risk"))] };
    }
  };

  // ─── Endocrine / metabolic ───────────────────────────────────────────────
  const homa = {
    id: "homa", group: "metabolic", name: L("HOMA-IR / HOMA-β", "HOMA-IR / HOMA-β"), ref: "Matthews 1985",
    fields: [num("glu", "Glicemia de jejum", "Fasting glucose", "mg/dL", { min: 20, max: 1000 }), num("ins", "Insulina de jejum", "Fasting insulin", "µU/mL", { min: 0.1, max: 1000 })],
    calc(v) {
      const m = missing(v, ["glu", "ins"]); if (m) return err(m);
      const out = [r("HOMA-IR", fix((v.glu * v.ins) / 405, 2), "", L("Valores de corte variam por população/método; interpretar com cautela.", "Cut-offs vary by population/assay; interpret with caution."))];
      if (v.glu > 63) out.push(r("HOMA-β", fix((360 * v.ins) / (v.glu - 63), 0), "%"));
      return { results: out };
    }
  };

  const aniongap = {
    id: "ag", group: "metabolic", name: L("Ânion gap", "Anion gap"), ref: "",
    fields: [num("na", "Sódio", "Sodium", "mEq/L"), num("cl", "Cloreto", "Chloride", "mEq/L"), num("hco3", "Bicarbonato", "Bicarbonate", "mEq/L"),
      num("alb", "Albumina (opcional)", "Albumin (optional)", "g/dL", { optional: true })],
    calc(v) {
      const m = missing(v, ["na", "cl", "hco3"]); if (m) return err(m);
      const ag = v.na - (v.cl + v.hco3);
      const out = [r(L("Ânion gap", "Anion gap"), fix(ag), "mEq/L")];
      if (v.alb !== undefined && !Number.isNaN(v.alb)) out.push(r(L("Ânion gap corrigido p/ albumina", "Albumin-corrected anion gap"), fix(ag + 2.5 * (4 - v.alb)), "mEq/L"));
      return { results: out };
    }
  };

  const corrCa = {
    id: "ca", group: "metabolic", name: L("Cálcio corrigido", "Corrected calcium"), ref: "Payne",
    fields: [num("ca", "Cálcio total", "Total calcium", "mg/dL"), num("alb", "Albumina", "Albumin", "g/dL")],
    calc(v) {
      const m = missing(v, ["ca", "alb"]); if (m) return err(m);
      return { results: [r(L("Cálcio corrigido", "Corrected calcium"), fix(v.ca + 0.8 * (4 - v.alb), 2), "mg/dL", L("Na UTI, preferir cálcio iônico.", "In ICU, prefer ionized calcium."))] };
    }
  };

  const corrNa = {
    id: "nacorr", group: "metabolic", name: L("Sódio corrigido p/ glicemia", "Glucose-corrected sodium"), ref: "Katz (1,6)",
    fields: [num("na", "Sódio", "Sodium", "mEq/L"), num("glu", "Glicemia", "Glucose", "mg/dL")],
    calc(v) {
      const m = missing(v, ["na", "glu"]); if (m) return err(m);
      return { results: [r(L("Sódio corrigido", "Corrected sodium"), fix(v.na + 1.6 * ((v.glu - 100) / 100)), "mEq/L")] };
    }
  };

  const osm = {
    id: "osm", group: "metabolic", name: L("Osmolaridade sérica", "Serum osmolality"), ref: "",
    fields: [num("na", "Sódio", "Sodium", "mEq/L"), num("glu", "Glicemia", "Glucose", "mg/dL"), num("bun", "Ureia nitrogenada (BUN)", "BUN", "mg/dL")],
    calc(v) {
      const m = missing(v, ["na", "glu", "bun"]); if (m) return err(m);
      return { results: [r(L("Osmolaridade calculada", "Calculated osmolality"), fix(2 * v.na + v.glu / 18 + v.bun / 2.8, 0), "mOsm/kg")] };
    }
  };

  const fwd = {
    id: "fwd", group: "metabolic", name: L("Déficit de água livre", "Free water deficit"), ref: "",
    fields: [sel("grp", "Grupo", "Group", [opt("0.6", "Homem adulto (0,6)", "Adult man (0.6)"), opt("0.5", "Mulher adulta / idoso (0,5)", "Adult woman / elderly man (0.5)"), opt("0.45", "Idosa (0,45)", "Elderly woman (0.45)")]),
      num("wt", "Peso", "Weight", "kg"), num("na", "Sódio sérico", "Serum sodium", "mEq/L")],
    calc(v) {
      const m = missing(v, ["grp", "wt", "na"]); if (m) return err(m);
      const tbw = Number(v.grp) * v.wt;
      return { results: [r(L("Déficit de água livre", "Free water deficit"), fix(tbw * (v.na / 140 - 1), 2), "L", L("Valor negativo = sem déficit. Corrigir Na ≤ 10–12 mEq/L/24h.", "Negative = no deficit. Limit Na correction to ≤ 10–12 mEq/L/24h."))] };
    }
  };

  // ─── Renal ───────────────────────────────────────────────────────────────
  const ckdepi = {
    id: "ckdepi", group: "renal", name: L("TFG CKD-EPI 2021", "eGFR CKD-EPI 2021"), ref: "Inker 2021",
    fields: [sel("sex", "Sexo", "Sex", sexOpts), num("age", "Idade", "Age", "anos", { min: 18, max: 120 }), num("cr", "Creatinina sérica", "Serum creatinine", "mg/dL", { min: 0.1, max: 30 })],
    calc(v) {
      const m = missing(v, ["sex", "age", "cr"]); if (m) return err(m);
      const f = v.sex === "F", k = f ? 0.7 : 0.9, a = f ? -0.241 : -0.302, q = v.cr / k;
      const egfr = 142 * Math.pow(Math.min(q, 1), a) * Math.pow(Math.max(q, 1), -1.2) * Math.pow(0.9938, v.age) * (f ? 1.012 : 1);
      const st = egfr >= 90 ? "G1" : egfr >= 60 ? "G2" : egfr >= 45 ? "G3a" : egfr >= 30 ? "G3b" : egfr >= 15 ? "G4" : "G5";
      return { results: [r("eGFR", fix(egfr, 0), "mL/min/1,73m²", L("Estágio " + st + ". Não válido em IRA/creatinina instável.", "Stage " + st + ". Not valid in AKI/unstable creatinine."))] };
    }
  };

  const cg = {
    id: "cg", group: "renal", name: L("Clearance Cockcroft-Gault", "Cockcroft-Gault clearance"), ref: "Cockcroft & Gault 1976",
    fields: [sel("sex", "Sexo", "Sex", sexOpts), num("age", "Idade", "Age", "anos"), num("wt", "Peso", "Weight", "kg"), num("cr", "Creatinina", "Creatinine", "mg/dL", { min: 0.1, max: 30 })],
    calc(v) {
      const m = missing(v, ["sex", "age", "wt", "cr"]); if (m) return err(m);
      return { results: [r("CrCl", fix(((140 - v.age) * v.wt) / (72 * v.cr) * (v.sex === "F" ? 0.85 : 1), 0), "mL/min")] };
    }
  };

  // ─── Hepatic ─────────────────────────────────────────────────────────────
  const fib4 = {
    id: "fib4", group: "hepatic", name: L("FIB-4", "FIB-4"), ref: "Sterling 2006",
    fields: [num("age", "Idade", "Age", "anos"), num("ast", "AST", "AST", "U/L"), num("alt", "ALT", "ALT", "U/L", { min: 0.1 }), num("plt", "Plaquetas", "Platelets", "10⁹/L (mil/mm³)", { min: 1 })],
    calc(v) {
      const m = missing(v, ["age", "ast", "alt", "plt"]); if (m) return err(m);
      const s = (v.age * v.ast) / (v.plt * Math.sqrt(v.alt));
      const lo = v.age >= 65 ? 2 : 1.3;
      const note = s < lo ? L("Baixo risco de fibrose avançada", "Low risk of advanced fibrosis") : s > 2.67 ? L("Alto risco de fibrose avançada", "High risk of advanced fibrosis") : L("Indeterminado", "Indeterminate");
      return { results: [r("FIB-4", fix(s, 2), "", note)] };
    }
  };

  const apri = {
    id: "apri", group: "hepatic", name: L("APRI", "APRI"), ref: "Wai 2003",
    fields: [num("ast", "AST", "AST", "U/L"), num("uln", "LSN da AST", "AST ULN", "U/L", { def: 40 }), num("plt", "Plaquetas", "Platelets", "10⁹/L", { min: 1 })],
    calc(v) {
      const m = missing(v, ["ast", "uln", "plt"]); if (m) return err(m);
      const s = (v.ast / v.uln / v.plt) * 100;
      return { results: [r("APRI", fix(s, 2), "", s > 1 ? L("Sugere fibrose significativa/cirrose", "Suggests significant fibrosis/cirrhosis") : L("Baixa probabilidade de fibrose significativa", "Low likelihood of significant fibrosis"))] };
    }
  };

  const meld = {
    id: "meld", group: "hepatic", name: L("MELD / MELD-Na", "MELD / MELD-Na"), ref: "Kamath 2001; Kim 2008",
    fields: [num("bili", "Bilirrubina total", "Total bilirubin", "mg/dL"), num("inr", "INR", "INR", ""), num("cr", "Creatinina", "Creatinine", "mg/dL"),
      num("na", "Sódio (opcional)", "Sodium (optional)", "mEq/L", { optional: true }), chk("dial", "Diálise ≥2x na última semana", "Dialysis ≥2x in past week")],
    calc(v) {
      const m = missing(v, ["bili", "inr", "cr"]); if (m) return err(m);
      const cr = v.dial ? 4 : Math.min(Math.max(v.cr, 1), 4);
      const meldv = Math.round(10 * (0.957 * Math.log(cr) + 0.378 * Math.log(Math.max(v.bili, 1)) + 1.12 * Math.log(Math.max(v.inr, 1)) + 0.643));
      const out = [r("MELD", Math.min(Math.max(meldv, 6), 40), "")];
      if (v.na !== undefined && !Number.isNaN(v.na)) {
        const na = Math.min(Math.max(v.na, 125), 137);
        const mn = meldv > 11 ? meldv + 1.32 * (137 - na) - 0.033 * meldv * (137 - na) : meldv;
        out.push(r("MELD-Na", Math.min(Math.max(Math.round(mn), 6), 40), ""));
      }
      return { results: out };
    }
  };

  // ─── Critical care ───────────────────────────────────────────────────────
  const pf = {
    id: "pf", group: "icu", name: L("Relação PaO₂/FiO₂", "PaO₂/FiO₂ ratio"), ref: "Berlin 2012",
    fields: [num("pao2", "PaO₂", "PaO₂", "mmHg"), num("fio2", "FiO₂", "FiO₂", "% (21–100)", { min: 21, max: 100 })],
    calc(v) {
      const m = missing(v, ["pao2", "fio2"]); if (m) return err(m);
      const x = v.pao2 / (v.fio2 / 100);
      const note = x > 300 ? L("Sem critério de oxigenação para SDRA", "Above ARDS oxygenation range") : x > 200 ? L("Faixa leve de SDRA (com PEEP ≥5)", "Mild ARDS range (with PEEP ≥5)") : x > 100 ? L("Faixa moderada de SDRA", "Moderate ARDS range") : L("Faixa grave de SDRA", "Severe ARDS range");
      return { results: [r("P/F", fix(x, 0), "mmHg", note)] };
    }
  };

  const qsofa = {
    id: "qsofa", group: "icu", name: L("qSOFA", "qSOFA"), ref: "Sepsis-3",
    fields: [chk("rr", "FR ≥ 22 irpm", "RR ≥ 22/min"), chk("sbp", "PAS ≤ 100 mmHg", "SBP ≤ 100 mmHg"), chk("mental", "Alteração do estado mental (Glasgow < 15)", "Altered mentation (GCS < 15)")],
    calc(v) {
      const s = (v.rr ? 1 : 0) + (v.sbp ? 1 : 0) + (v.mental ? 1 : 0);
      return { results: [r("qSOFA", s, "/3", s >= 2 ? L("Maior risco de desfecho desfavorável", "Higher risk of poor outcome") : L("Menor risco; não exclui sepse", "Lower risk; does not exclude sepsis"))] };
    }
  };

  const sofa = {
    id: "sofa", group: "icu", name: L("SOFA", "SOFA"), ref: "Vincent 1996",
    fields: [num("pao2", "PaO₂", "PaO₂", "mmHg"), num("fio2", "FiO₂", "FiO₂", "% (21–100)", { min: 21, max: 100 }), chk("vent", "Ventilação mecânica", "Mechanical ventilation"),
      num("plt", "Plaquetas", "Platelets", "10³/µL"), num("bili", "Bilirrubina", "Bilirubin", "mg/dL"),
      sel("cv", "Cardiovascular", "Cardiovascular", [opt(0, "PAM ≥ 70", "MAP ≥ 70"), opt(1, "PAM < 70", "MAP < 70"), opt(2, "Dopa ≤5 ou dobutamina", "Dopa ≤5 or dobutamine"),
        opt(3, "Dopa >5 / NE ≤0,1 / Epi ≤0,1", "Dopa >5 / NE ≤0.1 / Epi ≤0.1"), opt(4, "Dopa >15 / NE >0,1 / Epi >0,1", "Dopa >15 / NE >0.1 / Epi >0.1")]),
      num("gcs", "Glasgow", "GCS", "3–15", { min: 3, max: 15 }), num("cr", "Creatinina", "Creatinine", "mg/dL"),
      num("uo", "Diurese (opcional)", "Urine output (optional)", "mL/dia", { optional: true })],
    calc(v) {
      const m = missing(v, ["pao2", "fio2", "plt", "bili", "cv", "gcs", "cr"]); if (m) return err(m);
      const pfv = v.pao2 / (v.fio2 / 100);
      let resp = pfv >= 400 ? 0 : pfv >= 300 ? 1 : pfv >= 200 ? 2 : 3;
      if (pfv < 200 && v.vent) resp = pfv < 100 ? 4 : 3;
      else if (pfv < 200) resp = 2;
      const coag = v.plt >= 150 ? 0 : v.plt >= 100 ? 1 : v.plt >= 50 ? 2 : v.plt >= 20 ? 3 : 4;
      const liver = v.bili < 1.2 ? 0 : v.bili < 2 ? 1 : v.bili < 6 ? 2 : v.bili < 12 ? 3 : 4;
      const cv = Number(v.cv);
      const cns = v.gcs >= 15 ? 0 : v.gcs >= 13 ? 1 : v.gcs >= 10 ? 2 : v.gcs >= 6 ? 3 : 4;
      let ren = v.cr < 1.2 ? 0 : v.cr < 2 ? 1 : v.cr < 3.5 ? 2 : v.cr < 5 ? 3 : 4;
      if (v.uo !== undefined && !Number.isNaN(v.uo)) ren = Math.max(ren, v.uo < 200 ? 4 : v.uo < 500 ? 3 : 0);
      const parts = [resp, coag, liver, cv, cns, ren];
      const total = parts.reduce((a, b) => a + b, 0);
      return { results: [
        r("SOFA", total, "/24", L("Resp " + resp + " · Coag " + coag + " · Fígado " + liver + " · CV " + cv + " · SNC " + cns + " · Rim " + ren,
          "Resp " + resp + " · Coag " + coag + " · Liver " + liver + " · CV " + cv + " · CNS " + cns + " · Renal " + ren))
      ] };
    }
  };

  const list = [bmi, idealWeight, bsa, weightLoss, targets, mnutric, homa, aniongap, corrCa, corrNa, osm, fwd, ckdepi, cg, fib4, apri, meld, pf, qsofa, sofa];

  const groups = {
    nutrition: L("Nutrição", "Nutrition"), metabolic: L("Metabólico / Eletrólitos", "Metabolic / Electrolytes"),
    renal: L("Renal", "Renal"), hepatic: L("Hepático", "Hepatic"), icu: L("Terapia intensiva", "Critical care")
  };

  return { list, groups, byId: (id) => list.find((c) => c.id === id) };
});
