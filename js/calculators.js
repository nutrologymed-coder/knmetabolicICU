// UI for calculators.html: renders calculators from SCORES registry
(function () {
  "use strict";
  let lang = "pt";
  let current = null;
  const $ = (id) => document.getElementById(id);
  const T = {
    pt: { recent: "Recentes", favs: "Favoritos", noFavs: "Nenhum favorito ainda. Use ☆ na calculadora.", none: "Nenhuma calculadora encontrada.", related: "Relacionadas:", favToggle: "Favoritar", title: "Calculadoras e Scores", sub: "Nutrição, metabolismo e terapia intensiva", lang: "English", back: "← Estimativa metabólica", search: "Buscar calculadora…",
      calc: "Calcular", clear: "Limpar", missing: "Preencha todos os campos obrigatórios.", range: "Valor fora da faixa plausível: ", select: "Selecione", ref: "Referência: ",
      disclaimer: "Ferramenta de apoio. Não substitui julgamento clínico; confira fórmulas, unidades e populações nas fontes originais antes do uso assistencial. Nenhum dado é enviado a servidores." },
    en: { recent: "Recent", favs: "Favorites", noFavs: "No favorites yet. Use ☆ on a calculator.", none: "No calculators found.", related: "Related:", favToggle: "Favorite", title: "Calculators & Scores", sub: "Nutrition, metabolism and critical care", lang: "Português", back: "← Metabolic estimate", search: "Search calculator…",
      calc: "Calculate", clear: "Clear", missing: "Fill in all required fields.", range: "Value outside plausible range: ", select: "Select", ref: "Reference: ",
      disclaimer: "Decision-support tool. Does not replace clinical judgment; verify formulas, units and populations against original sources before clinical use. No data is sent to any server." }
  };
  const tx = (o) => (o && typeof o === "object" ? o[lang] : o);

  function parse(s) {
    const x = Number(String(s).trim().replace(",", "."));
    return s === "" || !Number.isFinite(x) ? NaN : x;
  }

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem("kn_" + k)) || []; } catch (e) { return []; } },
    set(k, v) { try { localStorage.setItem("kn_" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let view = "specialty";
  const views = [["specialty", "Especialidade", "Specialty"], ["az", "A–Z", "A–Z"], ["condition", "Doença / grupo", "Condition"], ["fav", "★ Favoritos", "★ Favorites"]];

  function pill(c) {
    const b = document.createElement("button");
    b.className = current && current.id === c.id ? "primary" : "ghost";
    b.textContent = tx(c.name);
    b.onclick = () => select(c.id);
    return b;
  }

  function section(box, title, items, open) {
    const d = document.createElement("details");
    d.open = open;
    const sm = document.createElement("summary");
    sm.className = "card-title";
    sm.style.cursor = "pointer";
    sm.textContent = title + " (" + items.length + ")";
    d.appendChild(sm);
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px";
    items.forEach((c) => wrap.appendChild(pill(c)));
    d.appendChild(wrap);
    box.appendChild(d);
  }

  function renderList() {
    const q = $("search").value.trim();
    const box = $("list");
    box.innerHTML = "";
    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px";
    views.forEach(([id, pt, en]) => {
      const b = document.createElement("button");
      b.className = view === id ? "primary" : "ghost";
      b.style.cssText = "font-size:13px;padding:6px 12px";
      b.textContent = lang === "pt" ? pt : en;
      b.onclick = () => { view = id; renderList(); };
      bar.appendChild(b);
    });
    box.appendChild(bar);

    const pool = q ? SCORES.search(q) : SCORES.list;
    const byName = (a, b) => tx(a.name).localeCompare(tx(b.name), lang);
    const recents = store.get("recent").map((id) => SCORES.byId(id)).filter((c) => c && pool.includes(c));
    if (recents.length && !q) section(box, T[lang].recent, recents, true);
    if (!pool.length) { box.append(T[lang].none); return; }

    if (view === "az") {
      const letters = {};
      pool.slice().sort(byName).forEach((c) => {
        const l = SCORES.strip(tx(c.name)).charAt(0).toUpperCase();
        (letters[l] = letters[l] || []).push(c);
      });
      Object.keys(letters).sort().forEach((l) => section(box, l, letters[l], true));
    } else if (view === "fav") {
      const favs = store.get("fav").map((id) => SCORES.byId(id)).filter((c) => c && pool.includes(c));
      if (favs.length) section(box, T[lang].favs, favs, true); else box.append(T[lang].noFavs);
    } else {
      const defs = view === "specialty" ? SCORES.specialties : SCORES.conditionGroups;
      const key = view === "specialty" ? "specialties" : "conditions";
      Object.keys(defs).forEach((g) => {
        const items = pool.filter((c) => c[key].includes(g)).sort(byName);
        if (items.length) section(box, tx(defs[g]), items, !!q || items.length <= 6);
      });
    }
  }

  function select(id, skipHash) {
    current = SCORES.byId(id);
    if (!current) return;
    store.set("recent", [id].concat(store.get("recent").filter((x) => x !== id)).slice(0, 5));
    if (!skipHash) history.replaceState(null, "", "#" + id);
    renderList();
    renderForm();
    $("form").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function renderForm() {
    const f = $("form");
    f.innerHTML = "";
    $("result").innerHTML = "";
    if (!current) return;
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = tx(current.name);
    const star = document.createElement("button");
    const isFav = () => store.get("fav").includes(current.id);
    star.className = "ghost";
    star.style.cssText = "float:right;font-size:14px;padding:2px 10px";
    star.textContent = isFav() ? "★" : "☆";
    star.title = T[lang].favToggle;
    star.onclick = () => {
      const fav = store.get("fav");
      store.set("fav", isFav() ? fav.filter((x) => x !== current.id) : fav.concat(current.id));
      star.textContent = isFav() ? "★" : "☆";
      if (view === "fav") renderList();
    };
    title.appendChild(star);
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
    if (current.related.length) {
      const rel = document.createElement("div");
      rel.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;align-items:center";
      rel.append(T[lang].related + " ");
      current.related.forEach((id) => {
        const c = SCORES.byId(id), b = document.createElement("button");
        b.className = "ghost";
        b.style.cssText = "font-size:12px;padding:4px 10px";
        b.textContent = tx(c.name);
        b.onclick = () => select(id);
        rel.appendChild(b);
      });
      f.appendChild(rel);
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
  window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (SCORES.byId(id)) select(id, true); });
  applyLang();
  if (SCORES.byId(location.hash.slice(1))) select(location.hash.slice(1), true);
})();
