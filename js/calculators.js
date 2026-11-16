// UI for calculators.html: renders calculators from SCORES registry
(function () {
  "use strict";
  let lang = "pt";
  let current = null;
  const $ = (id) => document.getElementById(id);
  const T = {
    pt: { title: "Calculadoras e Scores", sub: "Nutrição, metabolismo e terapia intensiva", lang: "English", back: "← Estimativa metabólica", search: "Buscar calculadora…",
      calc: "Calcular", clear: "Limpar", missing: "Preencha todos os campos obrigatórios.", range: "Valor fora da faixa plausível: ", select: "Selecione", ref: "Referência: ",
      disclaimer: "Ferramenta de apoio. Não substitui julgamento clínico; confira fórmulas, unidades e populações nas fontes originais antes do uso assistencial. Nenhum dado é enviado a servidores." },
    en: { title: "Calculators & Scores", sub: "Nutrition, metabolism and critical care", lang: "Português", back: "← Metabolic estimate", search: "Search calculator…",
      calc: "Calculate", clear: "Clear", missing: "Fill in all required fields.", range: "Value outside plausible range: ", select: "Select", ref: "Reference: ",
      disclaimer: "Decision-support tool. Does not replace clinical judgment; verify formulas, units and populations against original sources before clinical use. No data is sent to any server." }
  };
  const tx = (o) => (o && typeof o === "object" ? o[lang] : o);

  function parse(s) {
    const x = Number(String(s).trim().replace(",", "."));
    return s === "" || !Number.isFinite(x) ? NaN : x;
  }

  function renderList() {
    const q = $("search").value.trim().toLowerCase();
    const box = $("list");
    box.innerHTML = "";
    Object.keys(SCORES.groups).forEach((g) => {
      const items = SCORES.list.filter((c) => c.group === g && (!q || (c.name.pt + " " + c.name.en).toLowerCase().includes(q)));
      if (!items.length) return;
      const h = document.createElement("div");
      h.className = "card-title";
      h.textContent = tx(SCORES.groups[g]);
      box.appendChild(h);
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px";
      items.forEach((c) => {
        const b = document.createElement("button");
        b.className = current && current.id === c.id ? "primary" : "ghost";
        b.textContent = tx(c.name);
        b.onclick = () => { current = c; renderList(); renderForm(); };
        wrap.appendChild(b);
      });
      box.appendChild(wrap);
    });
  }

  function renderForm() {
    const f = $("form");
    f.innerHTML = "";
    $("result").innerHTML = "";
    if (!current) return;
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = tx(current.name);
    f.appendChild(title);
    const grid = document.createElement("div");
    grid.className = "row";
    current.fields.forEach((fd) => {
      const d = document.createElement("div");
      const lab = document.createElement("label");
      lab.htmlFor = "f_" + fd.id;
      lab.textContent = tx(fd.label) + (fd.unit ? " (" + fd.unit + ")" : "");
      let el;
      if (fd.type === "select") {
        el = document.createElement("select");
        el.innerHTML = '<option value="">' + T[lang].select + "</option>";
        fd.options.forEach((o) => { const op = document.createElement("option"); op.value = o.v; op.textContent = tx(o.label); el.appendChild(op); });
      } else if (fd.type === "check") {
        el = document.createElement("input");
        el.type = "checkbox";
        el.style.width = "auto";
      } else {
        el = document.createElement("input");
        el.inputMode = "decimal";
        if (fd.def !== undefined) el.value = fd.def;
      }
      el.id = "f_" + fd.id;
      if (fd.type === "check") { const row = document.createElement("label"); row.style.display = "flex"; row.style.gap = "8px"; row.append(el, tx(fd.label)); d.appendChild(row); }
      else { d.append(lab, el); }
      grid.appendChild(d);
    });
    f.appendChild(grid);
    const bar = document.createElement("div");
    bar.className = "actions";
    bar.style.marginTop = "12px";
    const go = document.createElement("button");
    go.className = "primary";
    go.textContent = T[lang].calc;
    go.onclick = run;
    const clr = document.createElement("button");
    clr.className = "ghost";
    clr.textContent = T[lang].clear;
    clr.onclick = renderForm;
    bar.append(go, clr);
    f.appendChild(bar);
    if (current.ref) {
      const s = document.createElement("div");
      s.className = "small";
      s.style.marginTop = "8px";
      s.textContent = T[lang].ref + current.ref;
      f.appendChild(s);
    }
  }

  function run() {
    const v = {};
    for (const fd of current.fields) {
      const el = $("f_" + fd.id);
      if (fd.type === "check") v[fd.id] = el.checked;
      else if (fd.type === "select") v[fd.id] = el.value === "" ? undefined : el.value;
      else {
        v[fd.id] = parse(el.value);
        if (!Number.isNaN(v[fd.id]) && ((fd.min !== undefined && v[fd.id] < fd.min) || (fd.max !== undefined && v[fd.id] > fd.max))) {
          return show('<div class="small">' + T[lang].range + tx(fd.label) + "</div>");
        }
      }
    }
    const out = current.calc(v);
    if (out.error) return show('<div class="small">' + T[lang].missing + "</div>");
    show(out.results.map((x) =>
      '<div class="box" style="margin-top:10px"><div class="t">' + esc(tx(x.label)) + '</div><div class="v">' + esc(String(x.value)) +
      ' <span class="u">' + esc(x.unit) + "</span></div>" +
      (x.note ? '<div class="small">' + esc(tx(x.note)) + "</div>" : "") + "</div>").join(""));
  }

  function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function show(html) { $("result").innerHTML = html; }

  function applyLang() {
    const t = T[lang];
    $("title").textContent = t.title;
    $("sub").textContent = t.sub;
    $("langBtn").textContent = t.lang;
    $("back").textContent = t.back;
    $("search").placeholder = t.search;
    $("disclaimer").textContent = t.disclaimer;
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    renderList();
    renderForm();
  }

  $("langBtn").onclick = () => { lang = lang === "pt" ? "en" : "pt"; applyLang(); };
  $("search").oninput = renderList;
  applyLang();
})();
