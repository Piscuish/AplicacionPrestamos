/* Kit de interfaz: íconos, componentes, diálogos, navegación y tema.
   Lo usan todas las pantallas (window.UI). Sin frameworks. */
(function () {
  "use strict";
  const G = window.GP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = G.money;

  // ================= Íconos (trazo 24×24, consistentes) =================
  const P = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    whatsapp: '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3Z"/><path d="M9 8.5c0 3 3.5 6.5 6.5 6.5l1-1.6-2-1-1 1c-1.2-.5-2.4-1.7-2.9-2.9l1-1-1-2Z"/>',
    pin: '<path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    more: '<circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chart: '<path d="M4 20h16"/><rect x="5" y="12" width="3" height="8"/><rect x="10.5" y="8" width="3" height="12"/><rect x="16" y="4" width="3" height="16"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    xcircle: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>', checkcircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    repeat: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>',
    idcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16a3 3 0 0 1 6 0"/><path d="M14 10h5M14 14h4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
    down: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>', up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.5"/><path d="M3 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7"/><path d="M3 11v4c0 1.4 2.7 2.5 6 2.5 1.3 0 2.5-.2 3.5-.5"/><ellipse cx="16" cy="15" rx="5" ry="2"/><path d="M11 15v3c0 1.1 2.2 2 5 2s5-.9 5-2v-3"/>',
    hand: '<path d="M2 15h3l4 3h6a2 2 0 0 0 0-4h-4"/><path d="M5 15v-2a2 2 0 0 1 2-2h2l3 3"/><circle cx="16" cy="7" r="4"/><path d="M16 5.5v3M15 7h2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    upload: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    right: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>', chevdown: '<path d="m6 9 6 6 6-6"/>',
    wallet: '<path d="M20 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6"/><circle cx="16.5" cy="13.5" r="1.3"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    building: '<rect x="4" y="3" width="11" height="18" rx="1"/><path d="M15 9h4a1 1 0 0 1 1 1v11h-5"/><path d="M8 7h3M8 11h3M8 15h3"/>',
    note: '<path d="M4 4h16v12l-4 4H4Z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-9 9"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    report: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M8 17v-3M12 17v-6M16 17v-4"/>',
    shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>', phoneSys: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2Z"/><path d="M9 4v14M15 6v14"/>', ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>', sort: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>', drag: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    import: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>', key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M17 6l3 3M14 9l2 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', play: '<path d="m7 4 13 8-13 8Z"/>',
  };
  const ic = (n, cls) => `<svg class="ico ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ""}</svg>`;

  // ================= Utilidades =================
  function initials(name) {
    const w = String(name || "?").trim().split(/\s+/).filter(Boolean);
    return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : (w[0] || "")[1] || "")).toUpperCase();
  }
  function avColor(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return "av" + (h % 5); }
  function avatar(c, cls) {
    if (c && c.photo) return `<div class="avatar ${cls || ""}"><img src="${c.photo}" alt=""></div>`;
    return `<div class="avatar ${avColor(c ? c.id : "x")} ${cls || ""}" aria-hidden="true">${esc(initials(c ? c.name : "?"))}</div>`;
  }
  const plural = (n, a, b) => n + " " + (n === 1 ? a : b);
  const fmtIn = (n) => (n ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");
  const pct = (r) => (r * 100).toFixed(1).replace(".", ",") + " %";
  /* Documento parcialmente oculto (protección de datos): 1.234.567 → ••••4567 */
  const maskDoc = (d) => { const s = String(d || "").replace(/\D/g, ""); return s.length > 4 ? "••••" + s.slice(-4) : s; };
  function waNumber(phone) { let d = String(phone || "").replace(/\D/g, ""); if (d.length === 10 && d[0] === "3") d = "57" + d; return d; }
  function openExternal(url) {
    const L = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher;
    if (L && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) { L.openUrl({ url }).catch(() => toast("No se pudo abrir. ¿Está instalada la aplicación?")); return; }
    const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  }
  function fileToDataUrl(file, max, type) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL(type || "image/jpeg", 0.85));
        };
        img.onerror = rej; img.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }
  function moneyInput(el) { el.addEventListener("input", () => { const v = G.parseMoney(el.value); el.value = v ? fmtIn(v) : ""; }); }
  const num = (v) => parseFloat(String(v || "").replace(",", ".")) || 0;
  const client = (id) => G.data.clients.find((c) => c.id === id);
  const loanOf = (id) => G.data.loans.find((l) => l.id === id);

  // ================= Componentes (devuelven HTML) =================
  const C = {
    field(o) { // {id,label,icon,value,type,attrs,req,suffix,money,hint}
      return `<div class="field field-float">${o.icon ? ic(o.icon) : ""}<label><span>${esc(o.label)}${o.req ? ' <span class="req">*</span>' : ""}</span><input id="${o.id}" ${o.type ? `type="${o.type}"` : ""} value="${esc(o.value == null ? "" : o.money ? fmtIn(o.value) : o.value)}" ${o.money ? 'class="money" inputmode="numeric" placeholder="0"' : ""} ${o.attrs || ""}></label>${o.suffix ? `<span class="suffix">${o.suffix}</span>` : ""}</div><p class="error" data-err="${o.id}"></p>`;
    },
    select(o) { // {id,label,icon,options:[[v,l]],value,req}
      return `<div class="field field-float">${o.icon ? ic(o.icon) : ""}<label><span>${esc(o.label)}${o.req ? ' <span class="req">*</span>' : ""}</span><select id="${o.id}" ${o.attrs || ""}>${o.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(o.value == null ? "" : o.value) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>${ic("chevdown", "chev-down")}</div><p class="error" data-err="${o.id}"></p>`;
    },
    textarea(o) { return `<div class="field">${o.icon ? ic(o.icon) : ""}<textarea id="${o.id}" maxlength="${o.max || 300}" placeholder="${esc(o.placeholder || "")}">${esc(o.value || "")}</textarea></div>`; },
    empty(icon, title, text, action) { return `<div class="empty"><div class="em-ico">${ic(icon)}</div>${title ? `<b>${esc(title)}</b>` : ""}${text ? `<p>${text}</p>` : ""}${action || ""}</div>`; },
    badge(tone, label, plain) { return `<span class="badge b-${tone}${plain ? " plain" : ""}">${esc(label)}</span>`; },
    kv(rows, cls) { return `<div class="kv ${cls || ""}">${rows.filter(Boolean).map((r) => `<div class="between ${r[2] || ""}"><span>${r[0]}</span><span>${r[1]}</span></div>`).join("")}</div>`; },
    stat(label, value, tone, attrs) { return `<${attrs ? "button" : "div"} class="stat" ${attrs || ""}><div class="l">${esc(label)}</div><div class="v ${tone || ""}">${value}</div></${attrs ? "button" : "div"}>`; },
    section(title, action, body) { return `<section class="section"><div class="section-head"><h2 class="h2">${title}</h2>${action || ""}</div>${body}</section>`; },
    seg(name, opts, value, cls) { return `<div class="seg ${cls || ""}" role="tablist">${opts.map(([v, l, on]) => `<button type="button" role="tab" data-${name}="${v}" class="${String(v) === String(value) ? on || "on" : ""}" aria-selected="${String(v) === String(value)}">${l}</button>`).join("")}</div>`; },
    chips(name, opts, value) { return `<div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip ${String(v) === String(value) ? "active" : ""}" data-${name}="${v}">${l}</button>`).join("")}</div>`; },
    tabs(name, opts, value) { return `<div class="tabs" role="tablist">${opts.map(([v, l]) => `<button type="button" role="tab" class="${v === value ? "active" : ""}" data-${name}="${v}" aria-selected="${v === value}">${l}</button>`).join("")}</div>`; },
    opt(icon, tone, title, sub, attrs) { return `<button class="sheet-opt" ${attrs || ""}><span class="lead-ico t-${tone}">${ic(icon)}</span><div><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}</div></button>`; },
    progress(ratio, cls) { return `<div class="progress ${cls || ""}"><div style="width:${Math.round(Math.max(0, Math.min(1, ratio || 0)) * 100)}%"></div></div>`; },
    alert(tone, icon, title, text, attrs) { return `<${attrs ? "button" : "div"} class="alert ${tone}" ${attrs || ""}>${ic(icon)}<div class="grow"><b>${title}</b>${text ? `<span>${text}</span>` : ""}</div>${attrs ? ic("right", "chev") : ""}</${attrs ? "button" : "div"}>`; },
  };
  const STATUS_TONE = { aldia: "green", pendiente: "amber", mora: "red", sinprestamos: "grey", inactivo: "grey" };
  const clientBadge = (x) => C.badge(STATUS_TONE[x.status], G.CLIENT_STATUS[x.status].label);
  function loanBadge(st) {
    if (st.status === "finalizado") return C.badge("grey", "Finalizado");
    if (st.status === "vencido") return C.badge("red", "Vencido");
    return C.badge("green", "Al día");
  }
  function cuotaBadge(c) {
    if (c.status === "pagada") return C.badge("green", "Pagada");
    if (c.status === "parcial") return C.badge(c.overdue ? "red" : "amber", "Parcial");
    if (c.overdue) return C.badge("red", "Vencida");
    if (c.rescheduled) return C.badge("violet", "Reprogramada");
    return C.badge("grey", "Pendiente");
  }

  // ================= Capa: hojas, diálogos, avisos =================
  const layer = () => $("#layer");
  function closeLayer() { layer().innerHTML = ""; }
  function sheet(title, html, bind) {
    layer().innerHTML = `<div class="overlay"></div><div class="bsheet" role="dialog" aria-modal="true" ${title ? `aria-label="${esc(title)}"` : ""}><div class="grip"></div>${title ? `<h3>${title}</h3>` : ""}${html}</div>`;
    $(".overlay", layer()).onclick = closeLayer;
    $$("input.money", layer()).forEach(moneyInput);
    if (bind) bind($(".bsheet", layer()));
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise((resolve) => {
      layer().innerHTML = `<div class="modal" role="alertdialog" aria-modal="true"><div class="modal-card"><h3>${title}</h3><p>${text}</p>
        <div class="form"><button class="btn ${danger ? "btn-danger solid" : "btn-primary"}" data-r="1">${okLabel || "Aceptar"}</button><button class="btn btn-soft" data-r="0">Cancelar</button></div></div></div>`;
      $$("[data-r]", layer()).forEach((b) => b.onclick = () => { closeLayer(); resolve(b.dataset.r === "1"); });
    });
  }
  /* Pide un texto (p. ej. el motivo de una anulación). Devuelve null si cancela. */
  function promptBox(title, text, placeholder, okLabel, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      layer().innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="modal-card"><h3>${title}</h3><p>${text}</p>
        <div class="form"><div class="field"><input id="pb-in" type="${opts.type || "text"}" maxlength="160" placeholder="${esc(placeholder || "")}" ${opts.type === "password" ? 'autocomplete="new-password"' : ""}></div><p class="error" id="pb-err"></p>
        <button class="btn ${opts.danger ? "btn-danger solid" : "btn-primary"}" data-r="1">${okLabel || "Aceptar"}</button><button class="btn btn-soft" data-r="0">Cancelar</button></div></div></div>`;
      const inp = $("#pb-in", layer()); setTimeout(() => inp.focus(), 50);
      $$("[data-r]", layer()).forEach((b) => b.onclick = () => {
        if (b.dataset.r === "1") { const v = inp.value.trim(); if ((opts.min || 1) > v.length) { $("#pb-err", layer()).textContent = opts.minMsg || "Este dato es obligatorio."; return; } closeLayer(); resolve(v); }
        else { closeLayer(); resolve(null); }
      });
    });
  }
  function alertBox(title, text) {
    layer().innerHTML = `<div class="modal" role="alertdialog" aria-modal="true"><div class="modal-card"><h3>${title}</h3><p>${text}</p><button class="btn btn-primary" data-r>Entendido</button></div></div>`;
    $("[data-r]", layer()).onclick = closeLayer;
  }
  let toastT;
  function toast(msg, tone) {
    const t = $("#toast"); t.innerHTML = (tone === "ok" ? ic("checkcircle") : tone === "err" ? ic("alert") : "") + `<span>${esc(msg)}</span>`; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2800);
  }
  /* Ejecuta una operación de datos mostrando el error de permisos/validación sin romper la pantalla. */
  function act(fn, okMsg) {
    try { const r = fn(); if (okMsg) toast(okMsg, "ok"); return r === undefined ? true : r; }
    catch (e) { if (e && e.code === "permiso") alertBox("Sin permiso", esc(e.message)); else toast((e && e.message) || "No se pudo completar.", "err"); return false; }
  }
  async function actAsync(fn, okMsg) {
    try { const r = await fn(); if (okMsg) toast(okMsg, "ok"); return r === undefined ? true : r; }
    catch (e) { if (e && e.code === "permiso") alertBox("Sin permiso", esc(e.message)); else toast((e && e.message) || "No se pudo completar.", "err"); return false; }
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>${esc(label || "Guardando…")}`; }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }
  function fieldErrors(v, errs) {
    $$("[data-err]", v).forEach((p) => { p.textContent = ""; const f = p.previousElementSibling; if (f) f.classList.remove("invalid"); });
    let first = null;
    Object.entries(errs || {}).forEach(([k, msg]) => { const p = $(`[data-err="${k}"]`, v); if (p) { p.textContent = msg; const f = p.previousElementSibling; if (f) f.classList.add("invalid"); first = first || $("#" + k, v); } });
    if (first) first.focus();
    return !first;
  }

  // ================= Navegación =================
  const Screens = {};
  let stack = [];
  const TABS = ["inicio", "clientes", "cobros", "mas"];
  function go(name, params, replace) {
    if (stack.length) stack[stack.length - 1].scroll = window.scrollY;
    if (replace) stack.pop();
    stack.push({ name, params: params || {} });
    render(true);
  }
  function root(name, params) { stack = [{ name, params: params || {} }]; render(true); }
  function back() {
    if (layer().innerHTML) { closeLayer(); return true; }
    if (stack.length > 1) { stack.pop(); render(false); return true; }
    if (stack[0].name !== "inicio") { root("inicio"); return true; }
    return false;
  }
  function refresh() { render(false, window.scrollY); }
  const cur = () => stack[stack.length - 1];
  const params = () => cur().params;
  let afterRender = null;
  function render(top, keepY) {
    closeLayer();
    const c = cur();
    const scr = Screens[c.name];
    let out;
    try { out = scr ? scr(c.params) || {} : { html: appbar({ back: true, title: "No disponible" }) + `<main class="body">${C.empty("alert", "Pantalla no encontrada")}</main>` }; }
    catch (e) { console.error(e); out = { html: appbar({ back: true, title: "Error" }) + `<main class="body">${C.empty("alert", "No se pudo mostrar esta pantalla", esc(e.message))}</main>` }; }
    if (out.redirect) { setTimeout(out.redirect); return; }
    const rootTab = TABS.includes(c.name) && stack.length === 1;
    document.body.classList.toggle("has-tabbar", rootTab);
    $("#tabbar").hidden = !rootTab;
    $$(".tab").forEach((t) => { t.classList.toggle("active", t.dataset.tab === stack[0].name); t.setAttribute("aria-current", t.dataset.tab === stack[0].name ? "page" : "false"); });
    const view = $("#view");
    view.innerHTML = out.html;
    $$("input.money", view).forEach(moneyInput);
    if (out.bind) { try { out.bind(view, c.params); } catch (e) { console.error(e); toast("Error: " + e.message, "err"); } }
    window.scrollTo(0, keepY != null ? keepY : top ? 0 : (c.scroll || 0));
    if (afterRender) afterRender();
  }
  // Clics comunes: data-go="pantalla" data-p='{...}', data-tab, data-back
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go],[data-tab],[data-back]");
    if (!t || !$("#screen-app") || $("#screen-app").hidden) return;
    if (t.hasAttribute("data-back")) { back(); return; }
    if (t.dataset.tab) { root(t.dataset.tab); return; }
    if (t.dataset.go) { const p = t.dataset.p ? JSON.parse(t.dataset.p) : {}; closeLayer(); if (t.dataset.root) root(t.dataset.go, p); else go(t.dataset.go, p); }
  });
  const goAttr = (name, p) => `data-go="${name}"${p ? ` data-p='${esc(JSON.stringify(p))}'` : ""}`;
  function setParam(o, keepScroll) { Object.assign(cur().params, o); if (keepScroll) refresh(); else render(true); }

  function appbar(o) {
    const left = o.back ? `<button class="icon-btn" data-back aria-label="Atrás">${ic("back")}</button>` : "";
    return `<header class="appbar">${left}<div class="appbar-title">${o.brand || `<h1>${esc(o.title)}</h1>${o.sub ? `<p>${esc(o.sub)}</p>` : ""}`}</div>${o.right || ""}</header>`;
  }

  // ================= Tema (claro / oscuro / sistema) =================
  const THEME_KEY = "gp.theme";
  const Theme = {
    get() { try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; } },
    set(v) { try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* sin almacenamiento */ } this.apply(); },
    isDark() { const v = this.get(); return v === "dark" || (v === "system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); },
    apply() {
      const dark = this.isDark();
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
      const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", dark ? "#191F28" : "#FFFFFF");
    },
  };
  Theme.apply();
  if (window.matchMedia) { try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => Theme.apply()); } catch (e) { /* viejo */ } }

  // ================= CSV y archivos =================
  function csvCell(v) { const s = v == null ? "" : String(v); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  /* CSV con ";" y BOM: Excel en español (Colombia) lo abre con columnas y tildes correctas. */
  function toCSV(headers, rows) { return "﻿" + [headers].concat(rows).map((r) => r.map(csvCell).join(";")).join("\r\n"); }
  function parseCSV(text) {
    text = String(text || "").replace(/^﻿/, "");
    const first = text.split(/\r?\n/)[0] || ""; const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ";" : ",";
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  /* Guarda/comparte un archivo (CSV, PDF, JSON). En el teléfono abre el menú de compartir. */
  async function shareFile(name, content, mime, title) {
    const Cap = window.Capacitor; const Pl = Cap && Cap.Plugins;
    try {
      if (Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Pl.Filesystem && Pl.Share) {
        const isB64 = content instanceof Uint8Array;
        const r = await Pl.Filesystem.writeFile(isB64 ? { path: name, data: bytesToB64(content), directory: "CACHE" } : { path: name, data: content, directory: "CACHE", encoding: "utf8" });
        await Pl.Share.share({ title: title || name, files: [r.uri], dialogTitle: title || "Compartir" });
        return true;
      }
      const file = new File([content], name, { type: mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return true; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      toast("Archivo descargado: " + name, "ok"); return true;
    } catch (e) { if (!/cancel|abort/i.test(String(e && (e.message || e)))) toast("No se pudo compartir el archivo.", "err"); return false; }
  }
  function bytesToB64(u8) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }

  window.UI = {
    $, $$, esc, money, ic, P, initials, avatar, plural, fmtIn, pct, maskDoc, waNumber, openExternal, fileToDataUrl, moneyInput, num, client, loanOf,
    C, clientBadge, loanBadge, cuotaBadge, STATUS_TONE,
    layer, closeLayer, sheet, confirmBox, promptBox, alertBox, toast, act, actAsync, busy, fieldErrors,
    Screens, TABS, go, root, back, refresh, render, cur, params, setParam, goAttr, appbar,
    get stack() { return stack; }, set afterRender(f) { afterRender = f; },
    Theme, toCSV, parseCSV, shareFile, bytesToB64,
  };
})();
