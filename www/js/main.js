/* Gestión de Préstamos — pantallas de la aplicación */
(function () {
  "use strict";
  const G = window.GP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = G.money;

  // ================= Íconos =================
  const P = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    whatsapp: '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3Z"/><path d="M9 8.5c0 3 3.5 6.5 6.5 6.5l1-1.6-2-1-1 1c-1.2-.5-2.4-1.7-2.9-2.9l1-1-1-2Z"/>',
    pin: '<path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    more: '<circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 5 9-5" opacity=".0"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chart: '<path d="M4 20h16"/><rect x="5" y="12" width="3" height="8"/><rect x="10.5" y="8" width="3" height="12"/><rect x="16" y="4" width="3" height="16"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    xcircle: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    checkcircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    repeat: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>',
    idcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16a3 3 0 0 1 6 0"/><path d="M14 10h5M14 14h4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
    down: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.5"/><path d="M3 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7"/><path d="M3 11v4c0 1.4 2.7 2.5 6 2.5 1.3 0 2.5-.2 3.5-.5"/><ellipse cx="16" cy="15" rx="5" ry="2"/><path d="M11 15v3c0 1.1 2.2 2 5 2s5-.9 5-2v-3"/>',
    hand: '<path d="M2 15h3l4 3h6a2 2 0 0 0 0-4h-4"/><path d="M5 15v-2a2 2 0 0 1 2-2h2l3 3"/><circle cx="16" cy="7" r="4"/><path d="M16 5.5v3M15 7h2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    upload: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    chevdown: '<path d="m6 9 6 6 6-6"/>',
    wallet: '<path d="M20 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6"/><circle cx="16.5" cy="13.5" r="1.3"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    building: '<rect x="4" y="3" width="11" height="18" rx="1"/><path d="M15 9h4a1 1 0 0 1 1 1v11h-5"/><path d="M8 7h3M8 11h3M8 15h3"/>',
    note: '<path d="M4 4h16v12l-4 4H4Z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-9 9"/>',
  };
  const ic = (n, cls) => `<svg class="ico ${cls || ""}" viewBox="0 0 24 24">${P[n] || ""}</svg>`;

  // ================= Utilidades =================
  function initials(name) {
    const w = String(name || "?").trim().split(/\s+/).filter(Boolean);
    return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : (w[0] || "")[1] || "")).toUpperCase();
  }
  function avColor(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return "av" + (h % 6); }
  function avatar(c, cls) {
    if (c && c.photo) return `<div class="avatar ${cls || ""}"><img src="${c.photo}" alt=""></div>`;
    return `<div class="avatar ${avColor(c ? c.id : "x")} ${cls || ""}">${esc(initials(c ? c.name : "?"))}</div>`;
  }
  const client = (id) => G.data.clients.find((c) => c.id === id);
  const loanOf = (id) => G.data.loans.find((l) => l.id === id);
  function statusBadge(st) {
    if (st.status === "finalizado") return '<span class="badge b-grey">Finalizado</span>';
    if (st.status === "vencido") return '<span class="badge b-red">Vencido</span>';
    return '<span class="badge b-green">Al día</span>';
  }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b); }
  function waNumber(phone) {
    let d = String(phone || "").replace(/\D/g, "");
    if (d.length === 10 && d[0] === "3") d = "57" + d;
    return d;
  }
  function openExternal(url) {
    const L = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher;
    if (L && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      L.openUrl({ url }).catch(() => toast("No se pudo abrir. ¿Está instalada la aplicación?"));
      return;
    }
    const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }
  function fileToDataUrl(file, max, type) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL(type || "image/jpeg", 0.85));
        };
        img.onerror = rej; img.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }
  function moneyInput(el) {
    el.addEventListener("input", () => {
      const v = G.parseMoney(el.value);
      el.value = v ? v.toLocaleString("es-CO").replace(/,/g, ".") : "";
    });
  }
  const fmtIn = (n) => (n ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");

  // ================= Capa de diálogos / hojas =================
  const layer = () => $("#layer");
  function closeLayer() { layer().innerHTML = ""; }
  function sheet(title, html, bind) {
    layer().innerHTML = `<div class="overlay"></div><div class="bsheet"><div class="grip"></div>${title ? `<h3>${title}</h3>` : ""}${html}</div>`;
    $(".overlay", layer()).onclick = closeLayer;
    if (bind) bind($(".bsheet", layer()));
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise((resolve) => {
      layer().innerHTML = `<div class="modal"><div class="modal-card"><h3>${title}</h3><p>${text}</p>
        <div class="form"><button class="btn ${danger ? "btn-primary" : "btn-primary"}" data-r="1" ${danger ? 'style="background:#d33a3a;box-shadow:none"' : ""}>${okLabel || "Aceptar"}</button>
        <button class="btn btn-soft" data-r="0">Cancelar</button></div></div></div>`;
      $$("[data-r]", layer()).forEach((b) => b.onclick = () => { closeLayer(); resolve(b.dataset.r === "1"); });
    });
  }
  function alertBox(title, text) {
    layer().innerHTML = `<div class="modal"><div class="modal-card"><h3>${title}</h3><p>${text}</p><button class="btn btn-primary" data-r>Entendido</button></div></div>`;
    $("[data-r]", layer()).onclick = closeLayer;
  }
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2800);
  }

  // ================= Navegación =================
  let stack = [];
  let config = null;
  let onLogout = null;
  const TABS = ["inicio", "clientes", "prestamos", "calendario"];
  const ROOTS = ["inicio", "clientes", "prestamos", "calendario", "finanzas", "movimientos", "ajustes"];

  function go(name, params, replace) {
    if (stack.length) stack[stack.length - 1].scroll = window.scrollY;
    if (replace) stack.pop();
    stack.push({ name, params: params || {} });
    render(true);
  }
  function root(name) { stack = [{ name, params: {} }]; render(true); }
  function back() {
    if (layer().innerHTML) { closeLayer(); return true; }
    if (stack.length > 1) { stack.pop(); render(false); return true; }
    if (stack[0].name !== "inicio") { root("inicio"); return true; }
    return false;
  }
  function refresh() { const y = window.scrollY; render(false, y); }

  function render(top, keepY) {
    closeLayer();
    const cur = stack[stack.length - 1];
    const scr = Screens[cur.name];
    const out = scr(cur.params) || {};
    const isTabRoot = TABS.includes(cur.name) && stack.length === 1;
    document.body.classList.toggle("has-tabbar", isTabRoot);
    $("#tabbar").hidden = !isTabRoot;
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === cur.name));
    const view = $("#view");
    view.innerHTML = out.html;
    $$("input.money", view).forEach(moneyInput);
    if (out.bind) out.bind(view);
    window.scrollTo(0, keepY != null ? keepY : top ? 0 : (cur.scroll || 0));
    if (typeof Update !== "undefined" && Update.pending) setTimeout(() => Update.prompt(), 300);
  }

  // Delegación de clics comunes
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go],[data-tab],[data-back],[data-menu]");
    if (!t || !$("#screen-app") || $("#screen-app").hidden) return;
    if (t.hasAttribute("data-back")) { back(); return; }
    if (t.hasAttribute("data-menu")) { drawer(); return; }
    if (t.dataset.tab) { root(t.dataset.tab); return; }
    if (t.dataset.go) {
      const params = t.dataset.p ? JSON.parse(t.dataset.p) : {};
      closeLayer();
      if (ROOTS.includes(t.dataset.go) && !t.dataset.p) root(t.dataset.go); else go(t.dataset.go, params);
    }
  });
  const goAttr = (name, params) => `data-go="${name}"${params ? ` data-p='${esc(JSON.stringify(params))}'` : ""}`;

  function appbar(o) {
    const left = o.back ? `<button class="icon-btn" data-back aria-label="Atrás">${ic("back")}</button>`
      : `<button class="icon-btn" data-menu aria-label="Menú">${ic("menu")}</button>`;
    return `<header class="appbar">${left}<div class="appbar-title">${o.brand || `<h1>${esc(o.title)}</h1>${o.sub ? `<p>${esc(o.sub)}</p>` : ""}`}</div>${o.right || ""}</header>`;
  }

  function logoHtml() {
    if (config.logo) return `<img src="${config.logo}" alt="">`;
    return '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#123a7a"/><g fill="#fff"><rect x="26" y="50" width="11" height="22" rx="2.5"/><rect x="42" y="38" width="11" height="34" rx="2.5"/><rect x="58" y="26" width="11" height="46" rx="2.5"/></g><path d="M18 74c18 10 50 8 64-22-10 18-36 26-60 18Z" fill="#7fb2ff"/></svg>';
  }

  function drawer() {
    const cur = stack[0].name;
    const item = (n, i, l) => `<button class="${cur === n && stack.length === 1 ? "active" : ""}" data-go="${n}">${ic(i)}${l}</button>`;
    layer().innerHTML = `<div class="overlay"></div><aside class="drawer">
      <div class="drawer-head"><div class="company-logo">${logoHtml()}</div><h3>${esc(config.company)}</h3><p>Usuario: ${esc(config.username)}</p><p style="font-size:12.5px;opacity:.65;margin-top:6px">Versión ${esc(Update.current.version)}</p></div>
      <nav>${item("inicio", "home", "Inicio")}${item("clientes", "users", "Clientes")}${item("prestamos", "layers", "Préstamos")}${item("calendario", "calendar", "Calendario de cobros")}
      ${item("finanzas", "chart", "Finanzas")}${item("movimientos", "list", "Movimientos")}<hr>${item("ajustes", "settings", "Configuración")}
      <button id="dr-logout">${ic("logout")}Cerrar sesión</button></nav></aside>`;
    $(".overlay", layer()).onclick = closeLayer;
    $("#dr-logout").onclick = () => { closeLayer(); onLogout && onLogout(); };
  }

  function fabSheet() {
    sheet("¿Qué quieres hacer?", `
      <button class="sheet-opt" data-go="clienteForm" data-p='{}'><span class="t-ico c-blue">${ic("user")}</span><div><b>Nuevo cliente</b><span>Registra una persona</span></div></button>
      <button class="sheet-opt" data-go="prestamoForm" data-p='{}'><span class="t-ico c-violet">${ic("hand")}</span><div><b>Nuevo préstamo</b><span>Presta dinero a un cliente</span></div></button>
      <button class="sheet-opt" id="fs-pay"><span class="t-ico c-green">${ic("dollar")}</span><div><b>Registrar pago</b><span>Abono total o parcial de una cuota</span></div></button>
      <button class="sheet-opt" data-go="movForm" data-p='{"type":"out"}'><span class="t-ico c-red">${ic("up")}</span><div><b>Registrar gasto o ingreso</b><span>Transporte, papelería, otros</span></div></button>`,
      (s) => { $("#fs-pay", s).onclick = pickLoanSheet; });
  }
  function pickLoanSheet() {
    const items = G.upcoming();
    if (!items.length) { sheet("Registrar pago", `<div class="empty">${ic("layers")}<p>No hay préstamos activos.</p><button class="btn btn-primary" data-go="prestamoForm" data-p='{}'>${ic("plus")}Nuevo préstamo</button></div>`); return; }
    sheet("¿De qué préstamo es el pago?", `<div class="search" style="margin-bottom:10px"><div class="field">${ic("search")}<input id="pl-q" placeholder="Buscar cliente…"></div></div><div class="list" id="pl-list"></div>`, (s) => {
      const draw = (q) => {
        q = (q || "").toLowerCase();
        $("#pl-list", s).innerHTML = items.filter(({ st }) => { const c = client(st.loan.clientId); return !q || (c && c.name.toLowerCase().includes(q)) || st.loan.num.toLowerCase().includes(q); })
          .map(({ st, c }) => { const cl = client(st.loan.clientId); return `<button class="item" ${goAttr("pago", { loanId: st.loan.id })}>${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">#${st.loan.num} · Cuota ${c.n} · ${G.relDay(c.date)}</div></div><div class="right"><div class="amount">${money(c.remaining)}</div></div></button>`; }).join("") || `<div class="empty"><p>Sin resultados</p></div>`;
      };
      draw(); $("#pl-q", s).oninput = (e) => draw(e.target.value);
    });
  }

  // ================= Pantallas =================
  const Screens = {};

  // ---------- INICIO ----------
  Screens.inicio = () => {
    setTimeout(() => { const b = $("#live-apply"); if (b) b.onclick = () => Update.applyLiveNow(); });
    const T = G.totals();
    const up = G.upcoming(6);
    const empty = !G.data.clients.length;
    return {
      html: appbar({
        brand: `<button class="appbar-brand brand-btn" data-go="ajustes" aria-label="Configuración"><div class="mini-logo">${logoHtml()}</div><div style="min-width:0;text-align:left"><h1>${esc(config.company)}</h1><p>Gestión de Préstamos</p></div></button>`,
        right: `<button class="icon-btn" data-go="ajustes" aria-label="Configuración">${ic("settings")}</button>`,
      }) + `<main class="body">
        ${Update.liveReady ? `<button class="update-banner" id="live-apply">${ic("repeat")}<div><b>Actualización lista (${esc(Update.liveReady.version)})</b><span>Se aplica sola la próxima vez que abras la app. Toca para aplicarla ahora.</span></div>${ic("right")}</button>`
          : Update.available ? `<button class="update-banner" data-go="ajustes">${ic("download")}<div><b>Nueva versión disponible (${esc(Update.available.version)})</b><span>Toca para actualizar. Tus datos no se borran.</span></div>${ic("right")}</button>` : ""}
        <p class="greet">Hola, <b>${esc(config.username)}</b></p>
        <div class="hero-card"><div class="lbl">Por cobrar</div><div class="big">${money(T.pending)}</div>
          <div class="meta"><span>${plural(T.activeLoans, "préstamo activo", "préstamos activos")}</span>${T.overdueLoans ? `<span>⚠ ${plural(T.overdueLoans, "vencido", "vencidos")}</span>` : ""}</div>
          <div class="deco">${ic("hand")}</div></div>
        <div class="grid2">
          <button class="tile" data-go="finanzas"><span class="t-ico c-green">${ic("hand")}</span><div><div class="t-lbl">Prestado</div><div class="t-val">${money(T.lent)}</div></div></button>
          <button class="tile" data-go="finanzas"><span class="t-ico c-violet">${ic("coins")}</span><div><div class="t-lbl">Recaudado</div><div class="t-val">${money(T.collected)}</div></div></button>
          <button class="tile" data-go="finanzas"><span class="t-ico c-amber">${ic("percent")}</span><div><div class="t-lbl">Intereses (ganancia)</div><div class="t-val">${money(T.interest)}</div></div></button>
          <button class="tile" data-tab="clientes"><span class="t-ico c-blue">${ic("users")}</span><div><div class="t-lbl">Clientes</div><div class="t-val">${T.clients}</div></div></button>
          <button class="tile" data-tab="prestamos"><span class="t-ico c-teal">${ic("layers")}</span><div><div class="t-lbl">Préstamos activos</div><div class="t-val">${T.activeLoans}</div></div></button>
          <button class="tile" data-go="prestamos" data-p='{"f":"vencido"}'><span class="t-ico c-red">${ic("alert")}</span><div><div class="t-lbl">Pagos vencidos</div><div class="t-val ${T.overdueAmount ? "red" : ""}">${money(T.overdueAmount)}</div></div></button>
        </div>
        ${empty ? `<div class="empty">${ic("users")}<p>Aún no tienes clientes.<br>Empieza registrando el primero.</p><button class="btn btn-primary" ${goAttr("clienteForm", {})}>${ic("plus")}Nuevo cliente</button></div>` : `
        <div class="between"><h2 class="h2">Próximos pagos</h2><button class="h-link" data-tab="calendario">Ver todos</button></div>
        ${up.length ? `<div class="list">${up.map(({ st, c }) => { const cl = client(st.loan.clientId); const late = c.overdue; const today = c.date === G.today();
          return `<button class="item" ${goAttr("pago", { loanId: st.loan.id })}>${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">#${st.loan.num} · Cuota ${c.n} de ${st.loan.count}</div></div>
          <div class="right"><span class="badge ${late ? "b-red" : today ? "b-green" : "b-blue"}">${late ? "Vencida " + G.fmtDateShort(c.date) : G.relDay(c.date)}</span><div class="amount" style="margin-top:4px">${money(c.remaining)}</div></div></button>`; }).join("")}</div>`
          : `<div class="empty">${ic("checkcircle")}<p>No hay pagos pendientes.</p></div>`}`}
      </main>`,
    };
  };

  // ---------- CLIENTES ----------
  Screens.clientes = (p) => {
    const S = G.state();
    const f = p.f || "todos";
    const counts = {
      todos: S.clients.length, activos: S.clients.filter((x) => x.active).length,
      deuda: S.clients.filter((x) => x.debt > 0).length, vencidos: S.clients.filter((x) => x.overdue).length,
    };
    const chip = (k, l) => `<button class="chip ${f === k ? "active" : ""}" data-f="${k}">${l} (${counts[k]})</button>`;
    return {
      html: appbar({ title: "Clientes", sub: "Gestiona tus clientes" }) + `<main class="body">
        <div class="search"><div class="field">${ic("search")}<input id="cq" type="search" placeholder="Buscar cliente…" value="${esc(p.q || "")}"></div>
          <button class="icon-btn solid" ${goAttr("clienteForm", {})} aria-label="Nuevo cliente">${ic("plus")}</button></div>
        <div class="chips">${chip("todos", "Todos")}${chip("activos", "Activos")}${chip("deuda", "Con deuda")}${chip("vencidos", "Vencidos")}</div>
        <div id="clist"></div></main>`,
      bind(v) {
        const draw = () => {
          const q = $("#cq", v).value.trim().toLowerCase();
          let rows = S.clients;
          if (f === "activos") rows = rows.filter((x) => x.active);
          if (f === "deuda") rows = rows.filter((x) => x.debt > 0);
          if (f === "vencidos") rows = rows.filter((x) => x.overdue);
          if (q) rows = rows.filter((x) => [x.client.name, x.client.phone, x.client.doc].some((s) => String(s || "").toLowerCase().includes(q)));
          stack[stack.length - 1].params.q = $("#cq", v).value;
          $("#clist", v).innerHTML = rows.length ? `<div class="list">${rows.map((x) => `<button class="item" ${goAttr("cliente", { id: x.client.id })}>${avatar(x.client)}
            <div class="grow"><div class="name">${esc(x.client.name)}</div><div class="sub">${x.client.phone ? ic("phone") + esc(x.client.phone) : x.client.doc ? "C.C. " + esc(x.client.doc) : "Sin teléfono"}</div></div>
            <div class="right">${x.debt > 0 ? `<span class="badge ${x.overdue ? "b-red" : "b-amber"}">${x.overdue ? "Vencido" : "Debe"}<b>${money(x.debt)}</b></span>` : x.loans.length ? '<span class="badge b-green">Al día</span>' : '<span class="badge b-grey">Sin préstamos</span>'}</div>${ic("right", "chev")}</button>`).join("")}</div>`
            : S.clients.length ? `<div class="empty">${ic("search")}<p>No se encontraron clientes.</p></div>`
            : `<div class="empty">${ic("users")}<p>Todavía no has registrado clientes.</p><button class="btn btn-primary" ${goAttr("clienteForm", {})}>${ic("plus")}Nuevo cliente</button></div>`;
        };
        $("#cq", v).oninput = draw;
        $$("[data-f]", v).forEach((b) => b.onclick = () => { stack[stack.length - 1].params.f = b.dataset.f; refresh(); });
        draw();
      },
    };
  };

  // ---------- FORMULARIO CLIENTE ----------
  Screens.clienteForm = (p) => {
    const c = p.id ? Object.assign({}, client(p.id)) : { createdAt: G.today() };
    const fld = (id, icon, label, val, attrs, req) => `<div class="field field-float">${ic(icon)}<label><span>${label}${req ? ' <span class="req">*</span>' : ""}</span><input id="${id}" value="${esc(val || "")}" ${attrs || ""}></label></div>`;
    return {
      html: appbar({ back: true, title: p.id ? "Editar cliente" : "Nuevo cliente" }) + `<main class="body"><form class="form" id="cf" novalidate>
        <div class="photo-pick"><button type="button" class="avatar-btn" id="cf-photo">${c.photo ? `<img src="${c.photo}">` : ic("camera")}</button>
          <div><h3>Datos del cliente</h3><p>Solo el nombre es obligatorio. La foto es opcional.</p></div></div>
        <input type="file" id="cf-file" accept="image/*" hidden>
        ${fld("cf-name", "user", "Nombre completo", c.name, 'maxlength="60" autocapitalize="words"', true)}
        <p class="error" id="cf-err"></p>
        ${fld("cf-doc", "idcard", "Documento", c.doc, 'inputmode="numeric" maxlength="20"')}
        ${fld("cf-phone", "phone", "Teléfono", c.phone, 'type="tel" maxlength="20"')}
        ${fld("cf-addr", "pin", "Dirección", c.address, 'maxlength="100"')}
        ${fld("cf-mail", "mail", "Correo", c.email, 'type="email" maxlength="80" autocapitalize="none"')}
        <div class="field field-float">${ic("calendar")}<label><span>Fecha de registro</span><input id="cf-date" type="date" value="${c.createdAt}"></label></div>
        <div class="field">${ic("note")}<textarea id="cf-notes" placeholder="Notas (opcional): referencias, negocio, quién lo recomendó…">${esc(c.notes || "")}</textarea></div>
        <button class="btn btn-primary" type="submit">${ic("check")}Guardar cliente</button>
        ${p.id ? `<button type="button" class="btn danger-btn" id="cf-del">${ic("trash")}Eliminar cliente</button>` : ""}
      </form></main>`,
      bind(v) {
        let photo = c.photo || null;
        $("#cf-photo", v).onclick = () => $("#cf-file", v).click();
        $("#cf-file", v).onchange = async (e) => {
          const f = e.target.files[0]; if (!f) return;
          try { photo = await fileToDataUrl(f, 320); $("#cf-photo", v).innerHTML = `<img src="${photo}">`; } catch { toast("No se pudo leer la imagen."); }
        };
        $("#cf-name", v).oninput = () => { $("#cf-err", v).textContent = ""; $("#cf-name", v).closest(".field").classList.remove("invalid"); };
        $("#cf", v).onsubmit = (e) => {
          e.preventDefault();
          const name = $("#cf-name", v).value.trim().replace(/\s+/g, " ");
          if (name.length < 2) { $("#cf-err", v).textContent = "Escribe el nombre del cliente."; $("#cf-name", v).closest(".field").classList.add("invalid"); $("#cf-name", v).focus(); return; }
          const saved = G.ops.saveClient({
            id: p.id, name, photo, doc: $("#cf-doc", v).value.trim(), phone: $("#cf-phone", v).value.trim(),
            address: $("#cf-addr", v).value.trim(), email: $("#cf-mail", v).value.trim(),
            createdAt: $("#cf-date", v).value || G.today(), notes: $("#cf-notes", v).value.trim(),
          });
          toast(p.id ? "Cliente actualizado" : "Cliente guardado");
          if (p.id) back(); else if (p.thenLoan) go("prestamoForm", { clientId: saved.id }, true); else go("cliente", { id: saved.id }, true);
        };
        if (p.id) $("#cf-del", v).onclick = () => deleteClient(p.id);
      },
    };
  };
  async function deleteClient(id) {
    if (G.data.loans.some((l) => l.clientId === id)) { alertBox("No se puede eliminar", "Este cliente tiene préstamos registrados. Elimina primero sus préstamos."); return; }
    if (await confirmBox("¿Eliminar cliente?", "Se borrarán sus datos. Esta acción no se puede deshacer.", "Eliminar", true)) {
      G.ops.deleteClient(id); toast("Cliente eliminado"); root("clientes");
    }
  }

  // ---------- PERFIL CLIENTE ----------
  Screens.cliente = (p) => {
    const x = G.state().byClient.get(p.id);
    if (!x) { setTimeout(back); return { html: "" }; }
    const c = x.client; const tab = p.t || "resumen";
    const pays = G.data.payments.filter((pp) => x.loans.some((l) => l.loan.id === pp.loanId)).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    const chip = (k, l) => `<button class="chip ${tab === k ? "active" : ""}" data-t="${k}">${l}</button>`;
    let content = "";
    if (tab === "resumen") {
      content = `<div class="grid2">
        <div class="tile"><span class="t-ico ${x.overdue ? "c-red" : "c-blue"}">${ic("wallet")}</span><div><div class="t-lbl">Debe</div><div class="t-val ${x.debt ? (x.overdue ? "red" : "") : "green"}">${money(x.debt)}</div></div></div>
        <div class="tile"><span class="t-ico c-amber">${ic("layers")}</span><div><div class="t-lbl">Préstamos</div><div class="t-val">${x.loans.length}</div></div></div></div>
        <div class="kv"><div class="between"><span>Total prestado</span><span>${money(x.lent)}</span></div>
        <div class="between"><span>Total pagado</span><span class="green">${money(x.paid)}</span></div>
        <div class="between"><span>Saldo pendiente</span><span class="${x.debt ? "red" : ""}">${money(x.debt)}</span></div>
        <div class="between"><span>Cliente desde</span><span>${G.fmtDate(c.createdAt)}</span></div></div>
        ${c.email ? `<div class="kv"><div class="between"><span>Correo</span><span style="font-weight:500">${esc(c.email)}</span></div></div>` : ""}
        ${c.notes ? `<div class="kv" style="padding:12px 14px"><div class="mini-lbl">Notas</div><div style="white-space:pre-wrap;margin-top:4px">${esc(c.notes)}</div></div>` : ""}`;
    } else if (tab === "prestamos") {
      content = x.loans.length ? `<div class="list">${x.loans.slice().reverse().map((st) => loanRow(st, true)).join("")}</div>` : `<div class="empty">${ic("layers")}<p>Este cliente no tiene préstamos.</p></div>`;
    } else {
      content = pays.length ? `<div class="list">${pays.map((pp) => { const st = G.state().byLoan.get(pp.loanId);
        return pp.amount > 0 ? `<button class="item" ${goAttr("prestamo", { id: pp.loanId })}><span class="mov-ico c-green">${ic("down")}</span><div class="grow"><div class="name" style="font-size:15px">Pago · #${st.loan.num}</div><div class="sub">${G.fmtDate(pp.date)} · ${esc(pp.method || "")}</div></div><div class="amount green">+${money(pp.amount)}</div></button>`
        : `<button class="item" ${goAttr("prestamo", { id: pp.loanId })}><span class="mov-ico c-red">${ic("x")}</span><div class="grow"><div class="name" style="font-size:15px">No pagó · #${st.loan.num}</div><div class="sub">${G.fmtDate(pp.date)}${pp.note ? " · " + esc(pp.note) : ""}</div></div></button>`; }).join("")}</div>`
        : `<div class="empty">${ic("coins")}<p>Aún no hay pagos registrados.</p></div>`;
    }
    return {
      html: appbar({ back: true, title: "Cliente", right: `<button class="icon-btn" ${goAttr("clienteForm", { id: c.id })} aria-label="Editar">${ic("edit")}</button><button class="icon-btn" id="cl-more" aria-label="Más">${ic("more")}</button>` }) + `<main class="body pad-bottom">
        <div class="profile">${avatar(c, "lg")}<div style="min-width:0"><h2>${esc(c.name)}</h2>
          ${c.phone ? `<div class="line">${ic("phone")}${esc(c.phone)}</div>` : ""}${c.doc ? `<div class="line">${ic("idcard")}C.C. ${esc(c.doc)}</div>` : ""}${c.address ? `<div class="line">${ic("pin")}${esc(c.address)}</div>` : ""}</div></div>
        <div class="actions3">
          <button class="act" id="a-call" ${c.phone ? "" : "disabled"}>${ic("phone")}Llamar</button>
          <button class="act wa" id="a-wa" ${c.phone ? "" : "disabled"}>${ic("whatsapp")}WhatsApp</button>
          <button class="act" id="a-map" ${c.address ? "" : "disabled"}>${ic("pin")}Ubicación</button></div>
        <div class="chips">${chip("resumen", "Resumen")}${chip("prestamos", `Préstamos (${x.loans.length})`)}${chip("pagos", "Pagos")}</div>
        ${content}
        <div style="position:fixed;left:16px;right:16px;bottom:calc(16px + var(--safe-bottom));z-index:7"><button class="btn btn-primary" ${goAttr("prestamoForm", { clientId: c.id })}>${ic("plus")}Nuevo préstamo</button></div>
      </main>`,
      bind(v) {
        $$("[data-t]", v).forEach((b) => b.onclick = () => { stack[stack.length - 1].params.t = b.dataset.t; refresh(); });
        if (c.phone) {
          $("#a-call", v).onclick = () => openExternal("tel:" + c.phone.replace(/[^\d+]/g, ""));
          $("#a-wa", v).onclick = () => openExternal("https://wa.me/" + waNumber(c.phone));
        }
        if (c.address) $("#a-map", v).onclick = () => openExternal("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.address));
        $("#cl-more", v).onclick = () => sheet(null, `
          <button class="sheet-opt" ${goAttr("clienteForm", { id: c.id })}><span class="t-ico c-blue">${ic("edit")}</span><div><b>Editar cliente</b></div></button>
          <button class="sheet-opt" id="so-del"><span class="t-ico c-red">${ic("trash")}</span><div><b>Eliminar cliente</b><span>Solo si no tiene préstamos</span></div></button>`,
          (s) => { $("#so-del", s).onclick = () => { closeLayer(); deleteClient(c.id); }; });
      },
    };
  };

  function loanRow(st, hideName) {
    const cl = client(st.loan.clientId);
    return `<button class="item" ${goAttr("prestamo", { id: st.loan.id })}>${hideName ? `<span class="mov-ico c-violet">${ic("layers")}</span>` : avatar(cl)}
      <div class="grow"><div class="name">${hideName ? "#" + st.loan.num + " · " + money(st.loan.amount) : esc(cl ? cl.name : "")}</div>
      <div class="sub">${hideName ? G.fmtDate(st.loan.startDate) : "#" + st.loan.num + " · " + money(st.loan.amount)}</div>
      <div class="sub">${st.status === "finalizado" ? "Pagado completo" : "Saldo " + money(st.balance)}</div></div>
      <div class="right">${statusBadge(st)}<div class="sub" style="justify-content:flex-end;margin-top:4px">${st.paidCount}/${st.loan.count} cuotas</div></div>${ic("right", "chev")}</button>`;
  }

  // ---------- PRÉSTAMOS ----------
  Screens.prestamos = (p) => {
    const S = G.state(); const f = p.f || "activos";
    const groups = {
      activos: S.loans.filter((x) => x.status !== "finalizado"),
      vencido: S.loans.filter((x) => x.status === "vencido"),
      finalizado: S.loans.filter((x) => x.status === "finalizado"),
      todos: S.loans,
    };
    const rows = groups[f].slice().sort((a, b) => (a.next ? a.next.date : "9999").localeCompare(b.next ? b.next.date : "9999") || b.loan.createdAt.localeCompare(a.loan.createdAt));
    const chip = (k, l) => `<button class="chip ${f === k ? "active" : ""}" data-f="${k}">${l} (${groups[k].length})</button>`;
    return {
      html: appbar({ title: "Préstamos", sub: "Controla tus préstamos", right: `<button class="icon-btn solid" ${goAttr("prestamoForm", {})} aria-label="Nuevo préstamo">${ic("plus")}</button>` }) + `<main class="body">
        <div class="chips">${chip("activos", "Activos")}${chip("vencido", "Vencidos")}${chip("finalizado", "Finalizados")}${chip("todos", "Todos")}</div>
        ${rows.length ? `<div class="list">${rows.map((st) => loanRow(st)).join("")}</div>` : `<div class="empty">${ic("layers")}<p>${S.loans.length ? "No hay préstamos en esta lista." : "Todavía no has creado préstamos."}</p>${S.loans.length ? "" : `<button class="btn btn-primary" ${goAttr("prestamoForm", {})}>${ic("plus")}Nuevo préstamo</button>`}</div>`}
      </main>`,
      bind(v) { $$("[data-f]", v).forEach((b) => b.onclick = () => { stack[stack.length - 1].params.f = b.dataset.f; refresh(); }); },
    };
  };

  // ---------- NUEVO PRÉSTAMO ----------
  Screens.prestamoForm = (p) => {
    const clients = G.data.clients.slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!clients.length) {
      return { html: appbar({ back: true, title: "Nuevo préstamo" }) + `<main class="body"><div class="empty">${ic("users")}<p>Primero registra al cliente que recibirá el préstamo.</p><button class="btn btn-primary" ${goAttr("clienteForm", { thenLoan: true })}>${ic("plus")}Nuevo cliente</button></div></main>` };
    }
    const d = p.draft || { clientId: p.clientId || "", amount: "", rate: 10, count: 4, freq: "semanal", start: G.today() };
    const opts = clients.map((c) => `<option value="${c.id}" ${c.id === d.clientId ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    const freqOpts = Object.entries(G.FREQ).map(([k, f]) => `<option value="${k}" ${k === d.freq ? "selected" : ""}>${f.label}</option>`).join("");
    return {
      html: appbar({ back: true, title: "Nuevo préstamo" }) + `<main class="body"><form class="form" id="lf" novalidate>
        <div class="field field-float">${ic("users")}<label><span>Cliente <span class="req">*</span></span><select id="lf-client"><option value="">Selecciona un cliente…</option>${opts}</select></label>${ic("chevdown", "chev-down")}</div>
        <button type="button" class="h-link" style="align-self:flex-start;margin-top:-6px" id="lf-newc">+ Registrar cliente nuevo</button>
        <div class="field field-float">${ic("dollar")}<label><span>Monto del préstamo <span class="req">*</span></span><input id="lf-amount" class="money" inputmode="numeric" placeholder="0" value="${fmtIn(d.amount)}"></label></div>
        <div class="field field-float">${ic("percent")}<label><span>Porcentaje de interés <span class="req">*</span></span><input id="lf-rate" inputmode="decimal" value="${d.rate}"></label><span class="suffix">%</span></div>
        <p class="hint">El interés se cobra una sola vez sobre el monto prestado.</p>
        <div class="field field-float">${ic("repeat")}<label><span>Frecuencia de cobro <span class="req">*</span></span><select id="lf-freq">${freqOpts}</select></label>${ic("chevdown", "chev-down")}</div>
        <div class="field field-float">${ic("list")}<label><span>Plazo (número de cuotas) <span class="req">*</span></span><input id="lf-count" inputmode="numeric" value="${d.count}"></label><span class="suffix" id="lf-unit"></span></div>
        <div class="field field-float">${ic("calendar")}<label><span>Fecha de entrega del dinero</span><input id="lf-start" type="date" value="${d.start}"></label></div>
        <div class="calc" id="lf-calc"></div>
        <p class="error" id="lf-err"></p>
        <button class="btn btn-primary" type="submit">${ic("coins")}Crear préstamo</button>
      </form></main>`,
      bind(v) {
        const read = () => ({
          clientId: $("#lf-client", v).value, amount: G.parseMoney($("#lf-amount", v).value),
          rate: parseFloat(String($("#lf-rate", v).value).replace(",", ".")) || 0,
          count: parseInt($("#lf-count", v).value, 10) || 0, freq: $("#lf-freq", v).value, start: $("#lf-start", v).value || G.today(),
        });
        const calc = () => {
          const r = read(); const F = G.FREQ[r.freq];
          $("#lf-unit", v).textContent = r.count === 1 ? F.unit[0] : F.unit[1];
          if (r.amount > 0 && r.count > 0) {
            const pl = G.plan(r.amount, r.rate, Math.min(r.count, 1000), r.freq, r.start);
            $("#lf-calc", v).innerHTML = `<div class="between"><span>Interés total (${String(r.rate).replace(".", ",")}%)</span><b>${money(pl.interest)}</b></div>
              <div class="between"><span>Total a pagar</span><b>${money(pl.total)}</b></div>
              <div class="between"><span>Primer cobro</span><b>${G.fmtDate(pl.cuotas[0].date)}</b></div>
              <div class="between"><span>Último cobro</span><b>${G.fmtDate(pl.end)}</b></div>
              <div class="between hl"><span>${F.cuota}</span><span>${money(pl.cuotaValue)}</span></div>`;
          } else $("#lf-calc", v).innerHTML = `<div class="between"><span class="muted">Escribe el monto y el plazo para ver el cálculo.</span></div>`;
          stack[stack.length - 1].params.draft = r;
        };
        $$("input,select", v).forEach((el) => el.addEventListener("input", calc));
        $("#lf-newc", v).onclick = () => go("clienteForm", { thenLoan: true });
        calc();
        $("#lf", v).onsubmit = async (e) => {
          e.preventDefault();
          const r = read(); const err = $("#lf-err", v);
          if (!r.clientId) { err.textContent = "Selecciona el cliente."; return; }
          if (!(r.amount > 0)) { err.textContent = "Escribe el monto del préstamo."; return; }
          if (r.rate < 0 || r.rate > 1000) { err.textContent = "Revisa el porcentaje de interés."; return; }
          if (!(r.count >= 1 && r.count <= 365)) { err.textContent = "El plazo debe ser entre 1 y 365 cuotas."; return; }
          err.textContent = "";
          const l = G.ops.createLoan({ clientId: r.clientId, amount: r.amount, rate: r.rate, count: r.count, freq: r.freq, startDate: r.start });
          G.applyMora();
          toast("Préstamo #" + l.num + " creado");
          go("prestamo", { id: l.id }, true);
        };
      },
    };
  };

  // ---------- DETALLE PRÉSTAMO ----------
  Screens.prestamo = (p) => {
    const st = G.state().byLoan.get(p.id);
    if (!st) { setTimeout(back); return { html: "" }; }
    const l = st.loan; const cl = client(l.clientId); const F = G.FREQ[l.freq];
    const pays = G.data.payments.filter((x) => x.loanId === l.id).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    const pct = Math.round(Math.min(1, st.paid / st.totalDue) * 100);
    const cuotaRow = (c) => {
      const cls = c.status === "pagada" ? "ok" : c.status === "parcial" ? "part" : c.overdue ? "late" : "";
      const badge = c.status === "pagada" ? '<span class="badge b-green">Pagada</span>'
        : c.status === "parcial" ? `<span class="badge b-amber">Falta ${money(c.remaining)}</span>`
        : c.overdue ? '<span class="badge b-red">Vencida</span>' : '<span class="badge b-grey">Pendiente</span>';
      return `<button class="item cuota" data-cuota="${c.n}"><span class="st ${cls}">${c.status === "pagada" ? ic("check") : ""}</span>
        <div class="grow"><div class="name" style="font-size:15px">Cuota ${c.n}</div><div class="sub">${G.fmtDate(c.date)}${c.charge ? ` · <span class="red">+${money(c.charge)} recargo</span>` : ""}</div></div>
        <div class="right"><div class="amount" style="font-size:15px">${money(c.due)}</div>${badge}</div></button>`;
    };
    return {
      html: appbar({ back: true, title: "Préstamo #" + l.num, sub: cl ? cl.name : "", right: `<button class="icon-btn" id="lo-more" aria-label="Más">${ic("more")}</button>` }) + `<main class="body">
        <button class="item" style="padding:0" ${goAttr("cliente", { id: l.clientId })}>${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">${cl && cl.phone ? ic("phone") + esc(cl.phone) : "Ver perfil"}</div></div>${ic("right", "chev")}</button>
        <div class="loan-head"><span class="t-ico c-blue">${ic("hand")}</span><div class="grow" style="flex:1">
          <div class="between"><div><div class="mini-lbl">Monto prestado</div><div class="big-val">${money(l.amount)}</div></div>${statusBadge(st)}</div>
          <div class="between" style="margin-top:8px"><div><div class="mini-lbl">Interés</div><b>${String(l.rate).replace(".", ",")} %</b></div><div style="text-align:right"><div class="mini-lbl">Total a pagar</div><b style="font-size:18px">${money(st.totalDue)}</b></div></div>
          ${st.chargesTotal ? `<div class="small red" style="margin-top:4px;text-align:right">Incluye ${money(st.chargesTotal)} de recargos</div>` : ""}</div></div>
        <div class="facts">
          <div class="fact">${ic("calendar")}<div><span class="mini-lbl">Inicio</span><b>${G.fmtDate(l.startDate)}</b></div></div>
          <div class="fact">${ic("calendar")}<div><span class="mini-lbl">Fin</span><b>${G.fmtDate(st.plan.end)}</b></div></div>
          <div class="fact">${ic("repeat")}<div><span class="mini-lbl">Frecuencia</span><b>${F.label}</b></div></div>
          <div class="fact">${ic("layers")}<div><span class="mini-lbl">Cuotas</span><b>${l.count} (${money(st.plan.cuotaValue)} c/u)</b></div></div></div>
        <div><div class="between" style="margin-bottom:8px"><b>Progreso del pago</b><span class="small muted">${st.paidCount} de ${l.count} cuotas</span></div>
          <div class="progress"><div style="width:${pct}%"></div></div>
          <div class="between small" style="margin-top:8px"><span>Pagado: <b class="green">${money(st.paid)}</b></span><span>Saldo: <b class="${st.balance ? "red" : ""}">${money(st.balance)}</b></span></div></div>
        <div class="between"><h2 class="h2">Cuotas</h2>${st.status !== "finalizado" ? `<button class="btn btn-primary" style="width:auto;min-height:40px;font-size:15px;padding:0 14px" ${goAttr("pago", { loanId: l.id })}>${ic("plus")}Registrar pago</button>` : ""}</div>
        <div class="list">${st.cuotas.map(cuotaRow).join("")}</div>
        <h2 class="h2">Historial de pagos</h2>
        ${pays.length ? `<div class="list">${pays.map((x) => x.amount > 0
          ? `<button class="item" data-pay="${x.id}"><span class="mov-ico c-green">${ic("down")}</span><div class="grow"><div class="name" style="font-size:15px">${money(x.amount)}</div><div class="sub">${G.fmtDate(x.date)} · ${esc(x.method || "")}${x.note ? " · " + esc(x.note) : ""}</div></div>${ic("file", "chev")}</button>`
          : `<button class="item" data-pay="${x.id}"><span class="mov-ico c-red">${ic("x")}</span><div class="grow"><div class="name" style="font-size:15px">No pagó</div><div class="sub">${G.fmtDate(x.date)}${x.note ? " · " + esc(x.note) : ""}</div></div>${ic("more", "chev")}</button>`).join("")}</div>`
          : `<div class="empty" style="padding:16px">${ic("coins")}<p>Aún no hay pagos registrados.</p></div>`}
      </main>`,
      bind(v) {
        $$("[data-cuota]", v).forEach((b) => b.onclick = () => {
          const c = st.cuotas[b.dataset.cuota - 1];
          const opts = [];
          if (c.status !== "pagada") opts.push(`<button class="sheet-opt" ${goAttr("pago", { loanId: l.id })}><span class="t-ico c-green">${ic("dollar")}</span><div><b>Registrar pago</b><span>Falta ${money(c.remaining)} de esta cuota</span></div></button>`);
          if (c.charge) opts.push(`<button class="sheet-opt" id="so-waive"><span class="t-ico c-amber">${ic("percent")}</span><div><b>Quitar recargo</b><span>Perdonar ${money(c.charge)} de esta cuota</span></div></button>`);
          sheet(`Cuota ${c.n} · ${G.fmtDate(c.date)}`, `<div class="kv" style="margin-bottom:10px"><div class="between"><span>Valor</span><span>${money(c.base)}</span></div>${c.charge ? `<div class="between"><span>Recargo por atraso</span><span class="red">${money(c.charge)}</span></div>` : ""}<div class="between"><span>Pagado</span><span class="green">${money(c.paid)}</span></div><div class="between"><span>Falta</span><span>${money(c.remaining)}</span></div></div>${opts.join("")}`, (s) => {
            const w = $("#so-waive", s);
            if (w) w.onclick = async () => { closeLayer(); if (await confirmBox("¿Quitar recargo?", `Se quitará el recargo de ${money(c.charge)} de la cuota ${c.n}.`, "Quitar recargo")) { G.ops.removeCharge(l.id, c.n); toast("Recargo quitado"); refresh(); } };
          });
        });
        $$("[data-pay]", v).forEach((b) => b.onclick = () => {
          const pay = G.data.payments.find((x) => x.id === b.dataset.pay);
          sheet(pay.amount > 0 ? `Pago de ${money(pay.amount)}` : "Visita sin pago", `
            ${pay.amount > 0 ? `<button class="sheet-opt" ${goAttr("pagoOk", { id: pay.id, view: true })}><span class="t-ico c-blue">${ic("file")}</span><div><b>Ver comprobante</b></div></button>
            <button class="sheet-opt" id="so-send"><span class="t-ico c-green">${ic("whatsapp")}</span><div><b>Enviar comprobante</b><span>Por WhatsApp u otra app</span></div></button>` : ""}
            <button class="sheet-opt" id="so-delp"><span class="t-ico c-red">${ic("trash")}</span><div><b>Eliminar registro</b><span>Si lo anotaste por error</span></div></button>`, (s) => {
            const sd = $("#so-send", s); if (sd) sd.onclick = () => { closeLayer(); sendReceipt(pay.id); };
            $("#so-delp", s).onclick = async () => { closeLayer(); if (await confirmBox("¿Eliminar este registro?", "El saldo del préstamo se recalculará.", "Eliminar", true)) { G.ops.deletePayment(pay.id); toast("Registro eliminado"); refresh(); } };
          });
        });
        $("#lo-more", v).onclick = () => sheet(null, `
          <button class="sheet-opt" ${goAttr("cliente", { id: l.clientId })}><span class="t-ico c-blue">${ic("user")}</span><div><b>Ver cliente</b></div></button>
          <button class="sheet-opt" id="so-dell"><span class="t-ico c-red">${ic("trash")}</span><div><b>Eliminar préstamo</b><span>También borra sus pagos</span></div></button>`, (s) => {
          $("#so-dell", s).onclick = async () => { closeLayer(); if (await confirmBox("¿Eliminar préstamo #" + l.num + "?", "Se borrarán el préstamo y todos sus pagos. No se puede deshacer.", "Eliminar", true)) { G.ops.deleteLoan(l.id); toast("Préstamo eliminado"); back(); } };
        });
      },
    };
  };

  // ---------- REGISTRAR PAGO ----------
  const METHODS = ["Efectivo", "Transferencia", "Nequi", "Daviplata", "Otro"];
  Screens.pago = (p) => {
    const st = G.state().byLoan.get(p.loanId);
    if (!st) { setTimeout(back); return { html: "" }; }
    const l = st.loan; const cl = client(l.clientId); const c = st.next;
    if (!c) return { html: appbar({ back: true, title: "Registrar pago" }) + `<main class="body"><div class="empty">${ic("checkcircle")}<p>Este préstamo ya está pagado completo.</p></div></main>` };
    const mode = p.mode || "total";
    return {
      html: appbar({ back: true, title: "Registrar pago" }) + `<main class="body"><form class="form" id="pf" novalidate>
        <div class="item" style="padding:0">${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">Préstamo #${l.num}</div></div>${statusBadge(st)}</div>
        <div class="kv"><div class="between"><span>Cuota a pagar</span><span>Cuota ${c.n} de ${l.count}</span></div>
          <div class="between"><span>Vence</span><span class="${c.overdue ? "red" : ""}">${G.fmtDate(c.date)}${c.overdue ? " (vencida)" : ""}</span></div>
          <div class="between"><span>Valor de la cuota</span><span>${money(c.due)}${c.charge ? ` <small class="red">(incl. recargo)</small>` : ""}</span></div>
          ${c.paid ? `<div class="between"><span>Ya abonado</span><span class="green">${money(c.paid)}</span></div>` : ""}
          <div class="between"><span>Saldo total del préstamo</span><span>${money(st.balance)}</span></div></div>
        <b style="margin-top:4px">Estado del cobro</b>
        <div class="seg">
          <button type="button" data-m="total" class="${mode === "total" ? "on-g" : ""}">${ic("check")}Pagó total</button>
          <button type="button" data-m="parcial" class="${mode === "parcial" ? "on-a" : ""}">${ic("clock")}Pago parcial</button>
          <button type="button" data-m="nopago" class="${mode === "nopago" ? "on-r" : ""}">${ic("xcircle")}No pagó</button></div>
        ${mode !== "nopago" ? `
        <div class="field field-float">${ic("dollar")}<label><span>${mode === "total" ? "Monto a pagar" : "Monto recibido"}</span><input id="pf-amount" class="money" inputmode="numeric" value="${mode === "total" ? fmtIn(c.remaining) : ""}" placeholder="0"></label></div>
        <div id="pf-info"></div>
        <div class="field field-float">${ic("calendar")}<label><span>Fecha del pago</span><input id="pf-date" type="date" value="${G.today()}"></label></div>
        <div class="field field-float">${ic("wallet")}<label><span>Método de pago</span><select id="pf-method">${METHODS.map((m) => `<option>${m}</option>`).join("")}</select></label>${ic("chevdown", "chev-down")}</div>
        <div class="field">${ic("note")}<input id="pf-note" maxlength="120" placeholder="Nota (opcional)"></div>
        ${cl && cl.phone ? `<label class="check"><input type="checkbox" id="pf-send" checked>Enviar comprobante por WhatsApp</label>` : ""}`
        : `<div class="field field-float">${ic("calendar")}<label><span>Fecha de la visita</span><input id="pf-date" type="date" value="${G.today()}"></label></div>
        <div class="field">${ic("note")}<textarea id="pf-note" maxlength="200" placeholder="Observación: ej. pidió pagar el próximo jueves"></textarea></div>`}
        <p class="error" id="pf-err"></p>
        <button class="btn btn-primary" type="submit">${ic("check")}${mode === "nopago" ? "Guardar visita" : "Registrar pago"}</button>
      </form></main>`,
      bind(v) {
        $$("[data-m]", v).forEach((b) => b.onclick = () => { stack[stack.length - 1].params.mode = b.dataset.m; refresh(); });
        const amt = $("#pf-amount", v);
        const info = () => {
          if (!amt) return;
          const a = G.parseMoney(amt.value);
          const box = $("#pf-info", v);
          if (!a) { box.innerHTML = ""; return; }
          if (a > st.balance) box.innerHTML = `<div class="total-row" style="background:#fdecec;color:#b42a2a">El monto supera el saldo del préstamo (${money(st.balance)}).</div>`;
          else if (a < c.remaining) box.innerHTML = `<div class="total-row" style="background:#fff3dc;color:#8a5600" class="between"><div class="between"><span>Queda pendiente de esta cuota</span><span>${money(c.remaining - a)}</span></div></div>`;
          else if (a > c.remaining) box.innerHTML = `<div class="total-row"><div class="between"><span>Abona también a siguientes cuotas</span><span>${money(a - c.remaining)}</span></div></div>`;
          else box.innerHTML = "";
        };
        if (amt) { amt.addEventListener("input", info); info(); }
        $("#pf", v).onsubmit = (e) => {
          e.preventDefault();
          const err = $("#pf-err", v); const date = $("#pf-date", v).value || G.today();
          if (mode === "nopago") {
            G.ops.addPayment({ loanId: l.id, amount: 0, type: "nopago", date, note: $("#pf-note", v).value.trim() });
            toast("Visita registrada"); back(); return;
          }
          const a = G.parseMoney(amt.value);
          if (!(a > 0)) { err.textContent = "Escribe el monto recibido."; return; }
          if (a > st.balance) { err.textContent = "El monto no puede ser mayor que el saldo (" + money(st.balance) + ")."; return; }
          const pay = G.ops.addPayment({ loanId: l.id, amount: a, date, method: $("#pf-method", v).value, note: $("#pf-note", v).value.trim() });
          const send = $("#pf-send", v) && $("#pf-send", v).checked;
          go("pagoOk", { id: pay.id, autoSend: send }, true);
        };
      },
    };
  };

  // ---------- PAGO REGISTRADO / COMPROBANTE ----------
  Screens.pagoOk = (p) => {
    const pay = G.data.payments.find((x) => x.id === p.id);
    if (!pay) { setTimeout(back); return { html: "" }; }
    const st = G.state().byLoan.get(pay.loanId);
    const cl = client(st.loan.clientId);
    if (p.view) {
      return {
        html: appbar({ back: true, title: "Comprobante", sub: "Préstamo #" + st.loan.num }) + `<main class="body"><img class="receipt-img" id="rc-img" alt="Comprobante">
          <button class="btn btn-wa" id="rc-send">${ic("whatsapp")}Enviar comprobante</button></main>`,
        bind(v) { $("#rc-img", v).src = receiptCanvas(pay.id).toDataURL("image/png"); $("#rc-send", v).onclick = () => sendReceipt(pay.id); },
      };
    }
    return {
      html: `<main class="body" style="margin-top:0;border-radius:0;padding-top:calc(var(--safe-top) + 40px)">
        <div class="success"><div class="ok">${ic("check")}</div><h2>Pago registrado</h2>
          <p>El pago de <b>${money(pay.amount)}</b> de ${esc(cl ? cl.name : "")} se registró correctamente.</p>
          <p class="small">${st.balance ? "Saldo pendiente: <b>" + money(st.balance) + "</b>" : "<b class='green'>¡El préstamo quedó pagado completo!</b>"}</p></div>
        <div class="form" style="margin-top:12px">
          <button class="btn btn-wa" id="ok-send">${ic("whatsapp")}Enviar comprobante por WhatsApp</button>
          <button class="btn btn-primary" ${goAttr("pagoOk", { id: pay.id, view: true })}>${ic("file")}Ver comprobante</button>
          <button class="link-btn" id="ok-back">Volver al préstamo</button></div></main>`,
      bind(v) {
        $("#ok-send", v).onclick = () => sendReceipt(pay.id);
        $("#ok-back", v).onclick = () => { stack.pop(); if (!stack.length || stack[stack.length - 1].name !== "prestamo") stack.push({ name: "prestamo", params: { id: st.loan.id } }); render(true); };
        if (p.autoSend) { p.autoSend = false; setTimeout(() => sendReceipt(pay.id), 400); }
      },
    };
  };

  function receiptInfo(payId) {
    const pay = G.data.payments.find((x) => x.id === payId);
    const st = G.computeLoan(loanOf(pay.loanId));
    const part = st.payParts.find((x) => x.id === payId) || { cuotas: [], balanceAfter: st.balance };
    const cl = client(st.loan.clientId);
    const cu = part.cuotas.length ? (part.cuotas.length === 1 ? part.cuotas[0] : part.cuotas[0] + " a " + part.cuotas[part.cuotas.length - 1]) + " de " + st.loan.count : "-";
    return { pay, st, cl, cu, balance: part.balanceAfter };
  }

  function receiptCanvas(payId) {
    const { pay, st, cl, cu, balance } = receiptInfo(payId);
    const W = 900, H = 1180, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const font = (w, s) => `${w} ${s}px system-ui, -apple-system, Roboto, Arial, sans-serif`;
    const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
    // logo
    const logoImg = $("#rc-logo-cache");
    x.save(); rr(60, 56, 120, 120, 26); x.clip();
    if (logoImg && logoImg.complete && logoImg.naturalWidth) {
      x.fillStyle = "#fff"; x.fillRect(60, 56, 120, 120);
      const s = Math.min(120 / logoImg.naturalWidth, 120 / logoImg.naturalHeight); const w = logoImg.naturalWidth * s, h = logoImg.naturalHeight * s;
      x.drawImage(logoImg, 60 + (120 - w) / 2, 56 + (120 - h) / 2, w, h);
    } else {
      x.fillStyle = "#123a7a"; x.fillRect(60, 56, 120, 120); x.fillStyle = "#fff";
      [[90, 116, 14, 32], [112, 100, 14, 48], [134, 84, 14, 64]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h));
    }
    x.restore();
    x.fillStyle = "#0f1c33"; x.font = font(800, 44); x.fillText(fit(x, config.company, 640), 210, 112);
    x.fillStyle = "#4a5872"; x.font = font(400, 30); x.fillText("Gestión de Préstamos", 210, 154);
    // banda
    x.fillStyle = "#0b2a5b"; rr(60, 220, W - 120, 92, 18); x.fill();
    x.fillStyle = "#fff"; x.font = font(750, 40); x.textAlign = "center"; x.fillText("Comprobante de Pago", W / 2, 280); x.textAlign = "left";
    x.fillStyle = "#19a04a"; x.beginPath(); x.arc(W - 90, 230, 36, 0, 7); x.fill();
    x.strokeStyle = "#fff"; x.lineWidth = 8; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath(); x.moveTo(W - 106, 230); x.lineTo(W - 94, 242); x.lineTo(W - 72, 218); x.stroke();
    // filas
    const rows = [["Cliente:", cl ? cl.name : ""], cl && cl.doc ? ["Documento:", cl.doc] : null, ["Préstamo:", "#" + st.loan.num], ["Cuota:", cu],
      ["Monto pagado:", money(pay.amount), true], ["Fecha de pago:", G.fmtDate(pay.date)], ["Método de pago:", pay.method || "-"], ["Saldo pendiente:", money(balance)]].filter(Boolean);
    let y = 350;
    for (const [k, val, hl] of rows) {
      if (hl) { x.fillStyle = "#dbe8fd"; x.fillRect(60, y, W - 120, 86); }
      x.fillStyle = "#0f1c33"; x.font = font(hl ? 750 : 400, hl ? 36 : 32); x.fillText(k, 84, y + 54);
      x.textAlign = "right"; x.font = font(hl ? 800 : 600, hl ? 40 : 32); x.fillText(fit(x, String(val), 460), W - 84, y + 55); x.textAlign = "left";
      y += 86; x.fillStyle = "#e3e9f2"; x.fillRect(60, y - 1, W - 120, 2);
    }
    if (pay.note) { x.fillStyle = "#4a5872"; x.font = font(400, 28); x.fillText(fit(x, "Nota: " + pay.note, W - 168), 84, y + 50); y += 70; }
    y += 30;
    x.fillStyle = "#e6efff"; rr(60, y, W - 120, 100, 20); x.fill();
    x.fillStyle = "#1d5bd8"; x.font = font("italic 750", 40); x.textAlign = "center"; x.fillText("¡Gracias por tu pago!", W / 2, y + 63);
    x.fillStyle = "#8a97ad"; x.font = font(400, 24); x.fillText("Generado el " + G.fmtDate(G.today()) + " · " + config.company, W / 2, y + 160); x.textAlign = "left";
    // recortar alto
    const out = document.createElement("canvas"); out.width = W; out.height = Math.min(H, y + 200);
    out.getContext("2d").drawImage(c, 0, 0); return out;
  }
  function fit(ctx, text, max) {
    if (ctx.measureText(text).width <= max) return text;
    let t = text; while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1); return t + "…";
  }

  async function sendReceipt(payId) {
    const { pay, st, cl, cu, balance } = receiptInfo(payId);
    const first = cl ? cl.name.split(" ")[0] : "";
    const msg = `Hola${first ? ", " + first : ""} 👋\nTe envío el comprobante de tu pago de ${money(pay.amount)} (cuota ${cu}) del préstamo #${st.loan.num}.\nSaldo pendiente: ${money(balance)}.\n¡Gracias!\n— ${config.company}`;
    const dataUrl = receiptCanvas(payId).toDataURL("image/png");
    const name = `Comprobante_${st.loan.num}_${pay.date}.png`;
    const Cap = window.Capacitor; const Pl = Cap && Cap.Plugins;
    const hasPhone = cl && cl.phone;
    sheet("Enviar comprobante", `
      <button class="sheet-opt" id="sr-img"><span class="t-ico c-green">${ic("image")}</span><div><b>Compartir imagen del comprobante</b><span>Elige WhatsApp y luego el chat del cliente</span></div></button>
      ${hasPhone ? `<button class="sheet-opt" id="sr-chat"><span class="t-ico c-green">${ic("whatsapp")}</span><div><b>Abrir chat de ${esc(first)}</b><span>Mensaje con el resumen del pago (${esc(cl.phone)})</span></div></button>` : ""}`, (s) => {
      $("#sr-img", s).onclick = async () => {
        closeLayer();
        try {
          if (Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Pl.Filesystem && Pl.Share) {
            const r = await Pl.Filesystem.writeFile({ path: name, data: dataUrl.split(",")[1], directory: "CACHE" });
            await Pl.Share.share({ title: "Comprobante de pago", text: msg, files: [r.uri], dialogTitle: "Enviar comprobante" });
            return;
          }
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], name, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: msg }); return; }
          const a = document.createElement("a"); a.href = dataUrl; a.download = name; a.click();
          toast("Comprobante descargado");
        } catch (e) { if (!/cancel|abort/i.test(String(e && (e.message || e)))) toast("No se pudo compartir el comprobante."); }
      };
      const ch = $("#sr-chat", s);
      if (ch) ch.onclick = () => { closeLayer(); openExternal("https://wa.me/" + waNumber(cl.phone) + "?text=" + encodeURIComponent(msg)); };
    });
  }

  // ---------- CALENDARIO ----------
  Screens.calendario = (p) => {
    const t = G.today();
    const sel = p.sel || t;
    const sd = G.parseISO(sel);
    const ym = p.ym || sel.slice(0, 7);
    const [Y, M] = ym.split("-").map(Number);
    const first = new Date(Y, M - 1, 1);
    const startOffset = (first.getDay() + 6) % 7; // lunes primero
    const gridStart = G.toISO(new Date(Y, M - 1, 1 - startOffset));
    const days = 42;
    const gridEnd = G.addDays(gridStart, days - 1);
    const items = G.cuotasBetween(gridStart, gridEnd);
    const byDay = {};
    for (const it of items) (byDay[it.c.date] = byDay[it.c.date] || []).push(it);
    const dotsFor = (list) => {
      const k = { g: 0, a: 0, r: 0, b: 0 };
      for (const { c } of list) { if (c.status === "pagada") k.g++; else if (c.status === "parcial") k.a++; else if (c.date <= t) k.r++; else k.b++; }
      return ["g", "a", "r", "b"].filter((x) => k[x]).map((x) => `<i class="d-${x}"></i>`).join("");
    };
    let cells = "";
    for (let i = 0; i < days; i++) {
      const d = G.addDays(gridStart, i); const dd = G.parseISO(d);
      cells += `<button class="cal-day ${dd.getMonth() !== M - 1 ? "out" : ""} ${d === t ? "today" : ""} ${d === sel ? "sel" : ""}" data-d="${d}">${dd.getDate()}<span class="dots">${byDay[d] ? dotsFor(byDay[d]) : ""}</span></button>`;
    }
    const daySum = summarizeDay(G.cuotasBetween(sel, sel));
    void sd;
    return {
      html: appbar({ title: "Calendario de cobros", sub: "Controla los cobros de tus clientes" }) + `<main class="body">
        <div class="cal"><div class="cal-head"><button class="icon-btn" id="cal-prev" aria-label="Mes anterior">${ic("left")}</button><h3>${G.MESES_LARGO[M - 1][0].toUpperCase() + G.MESES_LARGO[M - 1].slice(1)} ${Y}</h3><button class="icon-btn" id="cal-next" aria-label="Mes siguiente">${ic("right")}</button></div>
          <div class="cal-grid">${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}${cells}</div></div>
        <div class="legend" style="justify-content:center;flex-wrap:wrap"><span><i class="d-g"></i>Pagado</span><span><i class="d-a"></i>Parcial</span><span><i class="d-r"></i>Pendiente</span><span><i class="d-b"></i>Próximo</span></div>
        <div class="kv" style="padding:14px">
          <div class="row" style="margin-bottom:10px"><span class="t-ico c-blue" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center">${ic("calendar")}</span><div><b style="font-size:17px">${G.fmtDateLong(sel).replace(/ \d{4}$/, "")}</b><div class="small muted">${plural(daySum.count, "cobro programado", "cobros programados")}</div></div></div>
          ${daySum.count ? `<div class="between" style="padding:9px 0"><span class="row" style="gap:8px">${ic("checkcircle", "green")}${daySum.paid.n} Pagados</span><b>${money(daySum.paid.v)}</b></div>
          <div class="between" style="padding:9px 0"><span class="row" style="gap:8px">${ic("clock", "amber")}${daySum.part.n} Parciales</span><b>${money(daySum.part.v)}</b></div>
          <div class="between" style="padding:9px 0"><span class="row" style="gap:8px">${ic("xcircle", "red")}${daySum.pend.n} Pendientes</span><b>${money(daySum.pend.v)}</b></div>
          <div class="between total-row" style="margin-top:6px"><span>Total del día</span><span>${money(daySum.total)}</span></div>` : `<p class="muted" style="margin:0">No hay cobros este día.</p>`}
        </div>
        ${daySum.count ? `<button class="btn btn-primary" ${goAttr("dia", { date: sel })}>${ic("list")}Ver cobros del día</button>` : ""}
      </main>`,
      bind(v) {
        const set = (o) => { Object.assign(stack[stack.length - 1].params, o); refresh(); };
        $$("[data-d]", v).forEach((b) => b.onclick = () => set({ sel: b.dataset.d, ym: b.dataset.d.slice(0, 7) }));
        $("#cal-prev", v).onclick = () => set({ ym: G.toISO(new Date(Y, M - 2, 1)).slice(0, 7) });
        $("#cal-next", v).onclick = () => set({ ym: G.toISO(new Date(Y, M, 1)).slice(0, 7) });
      },
    };
  };
  function summarizeDay(list) {
    const s = { count: list.length, paid: { n: 0, v: 0 }, part: { n: 0, v: 0 }, pend: { n: 0, v: 0 }, total: 0 };
    for (const { c } of list) {
      s.total += c.due;
      if (c.status === "pagada") { s.paid.n++; s.paid.v += c.due; }
      else if (c.status === "parcial") { s.part.n++; s.part.v += c.paid; s.pend.v += 0; }
      else { s.pend.n++; s.pend.v += c.remaining; }
    }
    return s;
  }

  // ---------- COBROS DEL DÍA ----------
  Screens.dia = (p) => {
    const list = G.cuotasBetween(p.date, p.date);
    const s = summarizeDay(list);
    return {
      html: appbar({ back: true, title: "Cobros del día" }) + `<main class="body">
        <div class="between"><span class="row" style="gap:8px">${ic("calendar")}<b>${G.fmtDateLong(p.date)}</b></span><span class="badge b-blue">${plural(s.count, "cobro", "cobros")}</span></div>
        <div class="sum3"><div style="background:#e5f6ec"><div class="n green">${ic("checkcircle")}${s.paid.n}</div><div class="l">Pagados</div><div class="v">${money(s.paid.v)}</div></div>
          <div style="background:#fff6df"><div class="n amber">${ic("clock")}${s.part.n}</div><div class="l">Parcial</div><div class="v">${money(s.part.v)}</div></div>
          <div style="background:#fdecec"><div class="n red">${ic("xcircle")}${s.pend.n}</div><div class="l">Pendientes</div><div class="v">${money(s.pend.v)}</div></div></div>
        ${list.length ? `<div class="list">${list.map(({ st, c }) => { const cl = client(st.loan.clientId);
          const badge = c.status === "pagada" ? `<span class="badge b-green">Pagado</span>` : c.status === "parcial" ? `<span class="badge b-amber">Parcial</span><div class="sub" style="justify-content:flex-end">Pagó ${money(c.paid)}</div><div class="sub red" style="justify-content:flex-end">Falta ${money(c.remaining)}</div>` : `<span class="badge ${c.date < G.today() ? "b-red" : "b-grey"}">${c.date < G.today() ? "Vencido" : "Pendiente"}</span>`;
          return `<button class="item" ${goAttr(c.status === "pagada" ? "prestamo" : "pago", c.status === "pagada" ? { id: st.loan.id } : { loanId: st.loan.id })}>${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">Préstamo #${st.loan.num}</div><div class="sub">Cuota ${c.n}: ${money(c.due)}</div></div><div class="right">${badge}</div>${ic("right", "chev")}</button>`; }).join("")}</div>`
          : `<div class="empty">${ic("calendar")}<p>No hay cobros este día.</p></div>`}
      </main>`,
    };
  };

  // ---------- FINANZAS ----------
  Screens.finanzas = (p) => {
    const per = G.period(p.per || "mes");
    const F = G.finance(per); const T = G.totals(); const fl = G.flow(per);
    const capital = T.lent; const intAg = T.interestAgreed; const tot = capital + intAg;
    const rent = capital ? (intAg / capital) * 100 : 0;
    return {
      html: appbar({ title: "Finanzas", sub: "Resumen del negocio", right: `<button class="icon-btn" data-go="movimientos" aria-label="Movimientos">${ic("list")}</button>` }) + `<main class="body">
        <div class="field selectbox">${ic("calendar")}<select id="fi-per">${[["mes", "Este mes"], ["mesant", "Mes anterior"], ["anio", "Este año"], ["todo", "Todo el tiempo"]].map(([k, l]) => `<option value="${k}" ${k === per.key ? "selected" : ""}>${k === per.key ? per.label : l}</option>`).join("")}</select>${ic("chevdown", "chev-down")}</div>
        <div class="hero-card dark"><div class="row"><span class="t-ico" style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.12);display:grid;place-items:center">${ic("coins")}</span>
          <div><div class="lbl">Ganancia del periodo</div><div class="big" style="font-size:30px">${money(F.profit)}</div></div></div>
          <div class="meta"><span>Intereses cobrados ${money(F.interest)}</span>${F.movIn ? `<span>Otros ingresos ${money(F.movIn)}</span>` : ""}<span>Gastos ${money(F.expenses)}</span></div></div>
        <div class="grid2">
          <div class="tile"><span class="t-ico c-green">${ic("down")}</span><div><div class="t-lbl">Ingresos</div><div class="t-val">${money(F.income)}</div></div></div>
          <div class="tile"><span class="t-ico c-red">${ic("up")}</span><div><div class="t-lbl">Gastos</div><div class="t-val">${money(F.expenses)}</div></div></div>
          <div class="tile"><span class="t-ico c-blue">${ic("layers")}</span><div><div class="t-lbl">Prestado</div><div class="t-val">${money(F.lent)}</div></div></div>
          <div class="tile"><span class="t-ico c-violet">${ic("clock")}</span><div><div class="t-lbl">Por cobrar (hoy)</div><div class="t-val">${money(T.pending)}</div></div></div></div>
        <div class="between"><h2 class="h2">Flujo de dinero</h2><div class="legend"><span><i style="background:#1fa37a"></i>Ingresos</span><span><i style="background:#f06262"></i>Gastos</span></div></div>
        ${barChart(fl)}
        <h2 class="h2">Estado actual</h2>
        <div class="kv">
          <div class="between"><span class="row" style="gap:10px">${ic("layers", "blue")}Total prestado</span><span>${money(T.lent)}</span></div>
          <div class="between"><span class="row" style="gap:10px">${ic("repeat", "blue")}Capital recuperado</span><span>${money(T.recovered)}</span></div>
          <div class="between"><span class="row" style="gap:10px">${ic("percent", "green")}Intereses cobrados</span><span class="green">${money(T.interest)}</span></div>
          <div class="between"><span class="row" style="gap:10px">${ic("percent", "blue")}Intereses por cobrar</span><span>${money(T.interestPending)}</span></div>
          <div class="between"><span class="row" style="gap:10px">${ic("clock", "blue")}Saldo por cobrar</span><span>${money(T.pending)}</span></div></div>
        ${tot ? `<h2 class="h2">Distribución del dinero</h2>
        <div class="donut-wrap">${donut(capital, intAg)}<div class="donut-legend">
          <div><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#2d6be4;margin-right:6px"></i>Capital (${pctFmt(capital / tot)})</span><b>${money(capital)}</b></div>
          <div><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#22b35e;margin-right:6px"></i>Intereses (${pctFmt(intAg / tot)})</span><b>${money(intAg)}</b></div></div></div>
        <div class="rent"><span class="t-ico">${ic("trend")}</span><div><span class="small">Rentabilidad</span><b>${rent.toFixed(1).replace(".", ",")} %</b><span class="small muted">Sobre el capital prestado</span></div></div>` : ""}
        <div class="grid2"><button class="btn btn-soft" data-go="movimientos">${ic("list")}Movimientos</button><button class="btn btn-primary" ${goAttr("movForm", { type: "out" })}>${ic("plus")}Registrar</button></div>
      </main>`,
      bind(v) { $("#fi-per", v).onchange = (e) => { stack[stack.length - 1].params.per = e.target.value; refresh(); }; },
    };
  };
  const pctFmt = (r) => (r * 100).toFixed(1).replace(".", ",") + "%";
  function barChart(rows) {
    const W = 340, H = 180, L = 40, B = 24, T = 10;
    const max = Math.max(1, ...rows.map((r) => Math.max(r.income, r.expenses)));
    const step = niceStep(max / 4); const top = step * 4;
    const n = rows.length; const gw = (W - L - 6) / n; const bw = Math.min(16, gw / 3);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" font-family="system-ui,Roboto,sans-serif">`;
    for (let i = 0; i <= 4; i++) {
      const y = T + (H - B - T) * (1 - i / 4);
      s += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="#e6ecf5"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#6b7890">${G.moneyShort(step * i)}</text>`;
    }
    rows.forEach((r, i) => {
      const cx = L + gw * i + gw / 2; const h1 = (H - B - T) * r.income / top; const h2 = (H - B - T) * r.expenses / top;
      s += `<rect x="${cx - bw - 1}" y="${H - B - h1}" width="${bw}" height="${h1}" rx="3" fill="#1fa37a"/><rect x="${cx + 1}" y="${H - B - h2}" width="${bw}" height="${h2}" rx="3" fill="#f06262"/>`;
      s += `<text x="${cx}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#4a5872">${r.label}</text>`;
    });
    return s + "</svg>";
  }
  function niceStep(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function donut(a, b) {
    const r = 54, C = 2 * Math.PI * r, t = a + b, fa = C * a / t;
    return `<svg viewBox="0 0 150 150"><g transform="rotate(-90 75 75)"><circle cx="75" cy="75" r="${r}" fill="none" stroke="#22b35e" stroke-width="22"/>
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="#2d6be4" stroke-width="22" stroke-dasharray="${fa} ${C}"/></g>
      <text x="75" y="74" text-anchor="middle" font-size="15" font-weight="800" fill="#0f1c33" font-family="system-ui,Roboto,sans-serif">${G.moneyShort(a)}</text>
      <text x="75" y="92" text-anchor="middle" font-size="11" fill="#4a5872" font-family="system-ui,Roboto,sans-serif">Prestado</text></svg>`;
  }

  // ---------- MOVIMIENTOS ----------
  Screens.movimientos = (p) => {
    const f = p.f || "todos";
    let rows = G.movements();
    if (f === "in") rows = rows.filter((r) => r.sign > 0);
    if (f === "out") rows = rows.filter((r) => r.sign < 0);
    if (f === "loan") rows = rows.filter((r) => r.kind === "loan");
    let html = ""; let lastDay = null;
    for (const r of rows) {
      if (r.date !== lastDay) {
        if (lastDay !== null) html += "</div>";
        const rel = G.relDay(r.date);
        html += `<div class="list"><div class="mov-day">${rel === "Hoy" || rel === "Ayer" ? rel + ", " : ""}${G.fmtDate(r.date)}</div>`;
        lastDay = r.date;
      }
      const ico = r.kind === "loan" ? `<span class="mov-ico c-blue">${ic("hand")}</span>` : r.sign > 0 ? `<span class="mov-ico c-green">${ic("down")}</span>` : `<span class="mov-ico c-red">${ic("up")}</span>`;
      const amt = r.kind === "loan" ? `<span class="amount blue">${money(r.amount)}</span>` : r.sign > 0 ? `<span class="amount green">+${money(r.amount)}</span>` : `<span class="amount red">-${money(r.amount)}</span>`;
      const target = r.kind === "pay" || r.kind === "loan" ? goAttr("prestamo", { id: r.kind === "pay" ? r.ref.loanId : r.ref.id }) : `data-mov="${r.ref.id}"`;
      html += `<button class="item" ${target}>${ico}<div class="grow"><div class="name" style="font-size:15.5px">${esc(r.title)}</div><div class="sub">${esc(r.sub)}</div></div>${amt}</button>`;
    }
    if (lastDay !== null) html += "</div>";
    const chip = (k, l, cls) => `<button class="chip ${cls || ""} ${f === k ? "active" : ""}" data-f="${k}">${l}</button>`;
    return {
      html: appbar({ back: stack.length > 1, title: "Movimientos", sub: "Pagos, préstamos, ingresos y gastos" }) + `<main class="body pad-bottom">
        <div class="chips">${chip("todos", "Todos")}${chip("in", "Ingresos", "g")}${chip("out", "Gastos", "r")}${chip("loan", "Préstamos")}</div>
        ${html || `<div class="empty">${ic("list")}<p>No hay movimientos.</p></div>`}
        <div style="position:fixed;left:16px;right:16px;bottom:calc(16px + var(--safe-bottom));z-index:7"><button class="btn btn-primary" ${goAttr("movForm", { type: "out" })}>${ic("plus")}Registrar movimiento</button></div>
      </main>`,
      bind(v) {
        $$("[data-f]", v).forEach((b) => b.onclick = () => { stack[stack.length - 1].params.f = b.dataset.f; refresh(); });
        $$("[data-mov]", v).forEach((b) => b.onclick = () => {
          const m = G.data.movements.find((x) => x.id === b.dataset.mov);
          sheet(`${m.type === "in" ? "Ingreso" : "Gasto"}: ${esc(m.concept)}`, `<div class="kv" style="margin-bottom:10px"><div class="between"><span>Monto</span><span>${money(m.amount)}</span></div><div class="between"><span>Fecha</span><span>${G.fmtDate(m.date)}</span></div>${m.detail ? `<div class="between"><span>Detalle</span><span>${esc(m.detail)}</span></div>` : ""}</div>
            <button class="sheet-opt" id="so-delm"><span class="t-ico c-red">${ic("trash")}</span><div><b>Eliminar movimiento</b></div></button>`, (s) => {
            $("#so-delm", s).onclick = async () => { closeLayer(); if (await confirmBox("¿Eliminar movimiento?", "Esta acción no se puede deshacer.", "Eliminar", true)) { G.ops.deleteMovement(m.id); toast("Movimiento eliminado"); refresh(); } };
          });
        });
      },
    };
  };

  // ---------- REGISTRAR MOVIMIENTO ----------
  Screens.movForm = (p) => {
    const type = p.type || "out";
    const sug = type === "out" ? ["Transporte", "Papelería", "Comida", "Celular / recargas", "Arriendo", "Servicios", "Pago a cobrador"] : ["Aporte de capital", "Otro ingreso"];
    return {
      html: appbar({ back: true, title: "Registrar movimiento" }) + `<main class="body"><form class="form" id="mf" novalidate>
        <div class="seg two"><button type="button" data-t="out" class="${type === "out" ? "on-r" : ""}">${ic("up")}Gasto</button><button type="button" data-t="in" class="${type === "in" ? "on-g" : ""}">${ic("down")}Ingreso</button></div>
        <p class="hint">${type === "out" ? "Gastos del negocio: transporte, papelería, etc." : "Otros ingresos que no son pagos de préstamos. Los pagos de cuotas se registran solos."}</p>
        <div class="field field-float">${ic("note")}<label><span>Concepto <span class="req">*</span></span><input id="mf-concept" list="mf-sug" maxlength="50" placeholder="${sug[0]}"></label></div>
        <datalist id="mf-sug">${sug.map((s) => `<option value="${s}">`).join("")}</datalist>
        <div class="chips">${sug.slice(0, 5).map((s) => `<button type="button" class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="field field-float">${ic("dollar")}<label><span>Monto <span class="req">*</span></span><input id="mf-amount" class="money" inputmode="numeric" placeholder="0"></label></div>
        <div class="field field-float">${ic("calendar")}<label><span>Fecha</span><input id="mf-date" type="date" value="${G.today()}"></label></div>
        <div class="field">${ic("edit")}<input id="mf-detail" maxlength="80" placeholder="Detalle (opcional)"></div>
        <p class="error" id="mf-err"></p>
        <button class="btn btn-primary" type="submit">${ic("check")}Guardar ${type === "out" ? "gasto" : "ingreso"}</button>
      </form></main>`,
      bind(v) {
        $$("[data-t]", v).forEach((b) => b.onclick = () => { stack[stack.length - 1].params.type = b.dataset.t; refresh(); });
        $$("[data-s]", v).forEach((b) => b.onclick = () => { $("#mf-concept", v).value = b.dataset.s; });
        $("#mf", v).onsubmit = (e) => {
          e.preventDefault();
          const concept = $("#mf-concept", v).value.trim(); const amount = G.parseMoney($("#mf-amount", v).value);
          if (!concept) { $("#mf-err", v).textContent = "Escribe el concepto."; return; }
          if (!(amount > 0)) { $("#mf-err", v).textContent = "Escribe el monto."; return; }
          G.ops.addMovement({ type, concept, amount, date: $("#mf-date", v).value || G.today(), detail: $("#mf-detail", v).value.trim() });
          toast(type === "out" ? "Gasto registrado" : "Ingreso registrado"); back();
        };
      },
    };
  };

  // ---------- CONFIGURACIÓN ----------
  Screens.ajustes = () => {
    const m = G.data.settings.mora;
    return {
      html: appbar({ back: stack.length > 1, title: "Configuración" }) + `<main class="body">
        <div class="setting-card"><h3>${ic("building")}Empresa</h3>
          <div class="photo-pick"><button type="button" class="avatar-btn" id="aj-logo" style="background:#fff;box-shadow:0 0 0 1px #e6ecf5">${logoHtml()}</button>
            <div><p style="margin:0">Toca la imagen para cambiar el logo.</p>${config.logo ? '<button class="link-btn" id="aj-logo-del" style="color:#d33a3a;padding:6px 0 0">Quitar logo</button>' : ""}</div></div>
          <input type="file" id="aj-file" accept="image/png,image/jpeg,image/webp" hidden>
          <div class="field field-float">${ic("building")}<label><span>Nombre de la empresa</span><input id="aj-name" maxlength="40" value="${esc(config.company)}"></label></div>
          <button class="btn btn-soft" id="aj-save-co">Guardar nombre</button></div>

        <div class="setting-card"><h3>${ic("repeat")}Actualizaciones</h3>
          <div class="kv"><div class="between"><span>Versión instalada</span><span id="up-cur">${esc(Update.current.version)}</span></div></div>
          <div id="up-box"></div>
          <button class="btn btn-primary" id="up-check">${ic("search")}Buscar actualizaciones</button>
          <p class="hint" style="margin:0">La app busca actualizaciones sola cada vez que la abres. Las actualizaciones normales se descargan y aplican solas, sin instalar APK; solo los cambios grandes (ícono, permisos) piden instalar APK. Al actualizar se conservan todos tus clientes, préstamos y pagos; aun así, te recomendamos guardar una copia antes.</p></div>

        <div class="setting-card"><div class="between"><h3>${ic("percent")}Recargo por atraso</h3><label class="switch"><input type="checkbox" id="aj-mora" ${m.enabled ? "checked" : ""}><span></span></label></div>
          <p class="hint" style="margin:0">Si está activado, cuando una cuota se vence se le suma un recargo una sola vez. Solo aplica a cuotas que se venzan desde que lo actives.</p>
          <div id="aj-mora-box" ${m.enabled ? "" : "hidden"} class="form">
            <div class="seg two"><button type="button" data-mt="percent" class="${m.type === "percent" ? "on-b" : ""}">Porcentaje (%)</button><button type="button" data-mt="fixed" class="${m.type === "fixed" ? "on-b" : ""}">Valor fijo ($)</button></div>
            <div class="field field-float">${ic(m.type === "fixed" ? "dollar" : "percent")}<label><span>${m.type === "fixed" ? "Valor del recargo" : "Porcentaje sobre la cuota"}</span><input id="aj-mval" ${m.type === "fixed" ? 'class="money"' : ""} inputmode="numeric" value="${m.type === "fixed" ? fmtIn(m.value) : m.value}"></label>${m.type === "fixed" ? "" : '<span class="suffix">%</span>'}</div>
            <div class="field field-float">${ic("clock")}<label><span>Días de gracia</span><input id="aj-grace" inputmode="numeric" value="${m.graceDays || 0}"></label><span class="suffix">días</span></div>
          </div>
          <button class="btn btn-soft" id="aj-save-mora">Guardar recargo</button></div>

        <div class="setting-card"><h3>${ic("lock")}Usuario y contraseña</h3>
          <div class="field field-float">${ic("user")}<label><span>Usuario</span><input id="aj-user" maxlength="30" autocapitalize="none" value="${esc(config.username)}"></label></div>
          <div class="field field-float">${ic("lock")}<label><span>Contraseña actual</span><input id="aj-p0" type="password"></label></div>
          <div class="field field-float">${ic("lock")}<label><span>Nueva contraseña (opcional)</span><input id="aj-p1" type="password" placeholder="Mínimo 6 caracteres"></label></div>
          <div class="field field-float">${ic("lock")}<label><span>Confirmar nueva contraseña</span><input id="aj-p2" type="password"></label></div>
          <p class="error" id="aj-perr"></p>
          <button class="btn btn-soft" id="aj-save-pw">Guardar cambios</button></div>

        <div class="setting-card"><h3>${ic("download")}Copia de seguridad</h3>
          <p class="hint" style="margin:0">Tus datos se guardan solo en este teléfono. Guarda una copia de vez en cuando (por ejemplo, envíatela por WhatsApp o a tu correo) para no perder nada si cambias o pierdes el celular.</p>
          <button class="btn btn-primary" id="aj-export">${ic("share")}Guardar copia</button>
          <button class="btn btn-soft" id="aj-import">${ic("upload")}Restaurar una copia</button>
          <input type="file" id="aj-ifile" accept="application/json,.json" hidden>
          <button class="btn btn-soft" id="aj-auto">${ic("clock")}Copias automáticas (${G.snapshots().length})</button></div>
        <p class="note">Gestión de Préstamos · versión ${esc(Update.current.version)}</p>
      </main>`,
      bind(v) {
        // Empresa
        $("#aj-logo", v).onclick = () => $("#aj-file", v).click();
        $("#aj-file", v).onchange = async (e) => {
          const f = e.target.files[0]; if (!f) return;
          if (f.size > 2 * 1024 * 1024) { toast("La imagen pesa más de 2 MB."); return; }
          try { config.logo = await fileToDataUrl(f, 512, "image/png"); saveConfig(); toast("Logo actualizado"); refresh(); } catch { toast("No se pudo leer la imagen."); }
        };
        const ld = $("#aj-logo-del", v); if (ld) ld.onclick = () => { config.logo = null; saveConfig(); refresh(); };
        $("#aj-save-co", v).onclick = () => { const n = $("#aj-name", v).value.trim(); if (n.length < 2) { toast("Escribe el nombre de la empresa."); return; } config.company = n; saveConfig(); toast("Nombre guardado"); };
        // Recargo
        const mstate = Object.assign({}, m);
        $("#aj-mora", v).onchange = (e) => { mstate.enabled = e.target.checked; $("#aj-mora-box", v).hidden = !e.target.checked; };
        $$("[data-mt]", v).forEach((b) => b.onclick = () => {
          G.data.settings.mora = Object.assign({}, G.data.settings.mora, { type: b.dataset.mt, value: b.dataset.mt === "fixed" ? 5000 : 5 }); refreshKeep();
        });
        $("#aj-save-mora", v).onclick = () => {
          const val = m.type === "fixed" ? G.parseMoney($("#aj-mval", v).value) : parseFloat(String($("#aj-mval", v).value).replace(",", ".")) || 0;
          const grace = parseInt($("#aj-grace", v).value, 10) || 0;
          if (mstate.enabled && !(val > 0)) { toast("Escribe el valor del recargo."); return; }
          G.ops.saveMora({ enabled: mstate.enabled, type: G.data.settings.mora.type, value: val, graceDays: Math.max(0, grace), since: G.data.settings.mora.since });
          toast(mstate.enabled ? "Recargo por atraso activado" : "Recargo por atraso desactivado");
        };
        function refreshKeep() { G.save(); refresh(); }
        // Usuario/contraseña
        $("#aj-save-pw", v).onclick = async () => {
          const err = $("#aj-perr", v); err.textContent = "";
          const u = $("#aj-user", v).value.trim(); const p0 = $("#aj-p0", v).value; const p1 = $("#aj-p1", v).value; const p2 = $("#aj-p2", v).value;
          if (u.length < 3 || /\s/.test(u)) { err.textContent = "El usuario debe tener al menos 3 caracteres y sin espacios."; return; }
          if (!p0) { err.textContent = "Escribe tu contraseña actual para confirmar."; return; }
          if ((await hash(p0, config.salt)) !== config.passwordHash) { err.textContent = "La contraseña actual no es correcta."; return; }
          if (p1 || p2) {
            if (p1.length < 6) { err.textContent = "La nueva contraseña debe tener al menos 6 caracteres."; return; }
            if (p1 !== p2) { err.textContent = "Las contraseñas nuevas no coinciden."; return; }
            config.passwordHash = await hash(p1, config.salt);
          }
          config.username = u; saveConfig(); toast("Cambios guardados");
          ["#aj-p0", "#aj-p1", "#aj-p2"].forEach((s) => ($(s, v).value = ""));
        };
        // Actualizaciones
        const upBox = $("#up-box", v);
        const showUpdate = (r) => {
          if (r.error) { upBox.innerHTML = `<div class="total-row" style="background:#fdecec;color:#b42a2a">${esc(r.error)}</div>`; return; }
          if (!r.release) { upBox.innerHTML = `<div class="total-row" style="background:#e5f6ec;color:#11743a">✓ Tienes la última versión.</div>`; return; }
          const rel = r.release;
          if (rel.live) {
            upBox.innerHTML = `<div class="kv" style="padding:12px 14px;border-color:#b9d0f7;background:#f4f8ff">
              <b class="blue">Nueva versión ${esc(rel.version)}</b><div class="small muted" style="margin-top:2px">Actualización rápida: no necesita instalar APK.</div>
              ${rel.notes ? `<div class="small" style="white-space:pre-wrap;margin-top:8px">${esc(rel.notes.slice(0, 600))}</div>` : ""}</div>
              <button class="btn btn-primary" id="up-live">${ic("repeat")}Actualizar ahora</button>
              <p class="hint" style="margin:0">La app se reinicia en unos segundos con la versión nueva. Tus datos no se tocan y antes se guarda una copia automática.</p>`;
            $("#up-live", v).onclick = async () => {
              const b = $("#up-live", v); b.disabled = true; b.lastChild.textContent = "Descargando…";
              const ok = await Update.downloadLive(rel, false);
              b.disabled = false; b.lastChild.textContent = "Actualizar ahora";
              if (ok) Update.applyLiveNow(); else toast("No se pudo descargar. Revisa tu conexión.");
            };
            return;
          }
          upBox.innerHTML = `<div class="kv" style="padding:12px 14px;border-color:#b9d0f7;background:#f4f8ff">
            <b class="blue">Nueva versión ${esc(rel.version)}</b><div class="small muted" style="margin-top:2px">Publicada el ${G.fmtDate(rel.date)}${rel.size ? " · " + (rel.size / 1048576).toFixed(1).replace(".", ",") + " MB" : ""}</div>
            ${rel.notes ? `<div class="small" style="white-space:pre-wrap;margin-top:8px">${esc(rel.notes.slice(0, 600))}</div>` : ""}</div>
            <button class="btn btn-soft" id="up-backup">${ic("share")}1. Guardar copia de seguridad</button>
            <button class="btn btn-wa" id="up-dl">${ic("download")}2. Descargar e instalar</button>
            <p class="hint" style="margin:0">Se descargará el archivo .apk. Ábrelo y toca <b>Actualizar</b>. Si Android lo pide, permite instalar apps desde esa fuente.</p>`;
          $("#up-backup", v).onclick = () => $("#aj-export", v).click();
          $("#up-dl", v).onclick = () => openExternal(rel.apkUrl || rel.page);
        };
        if (Update.available) showUpdate({ release: Update.available });
        if (stack[stack.length - 1].params.update) setTimeout(() => $("#up-box", v).closest(".setting-card").scrollIntoView({ behavior: "smooth", block: "start" }), 150);
        $("#up-check", v).onclick = async () => {
          const b = $("#up-check", v); b.disabled = true; b.lastChild.textContent = "Buscando…";
          const r = await Update.check(true);
          b.disabled = false; b.lastChild.textContent = "Buscar actualizaciones";
          showUpdate(r);
        };

        // Copia de seguridad
        $("#aj-export", v).onclick = async () => {
          const json = G.ops.exportAll(); const name = "copia_prestamos_" + G.today() + ".json";
          const Cap = window.Capacitor; const Pl = Cap && Cap.Plugins;
          try {
            if (Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Pl.Filesystem && Pl.Share) {
              const r = await Pl.Filesystem.writeFile({ path: name, data: json, directory: "CACHE", encoding: "utf8" });
              await Pl.Share.share({ title: "Copia de seguridad", files: [r.uri], dialogTitle: "Guardar copia de seguridad" });
              return;
            }
            const file = new File([json], name, { type: "application/json" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; }
            const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; a.click(); toast("Copia descargada");
          } catch (e) { if (!/cancel|abort/i.test(String(e && (e.message || e)))) toast("No se pudo guardar la copia."); }
        };
        $("#aj-auto", v).onclick = () => {
          const list = G.snapshots();
          sheet("Copias automáticas", `<p class="hint" style="margin:0 0 10px">La app guarda sola una copia cada día y antes de cada actualización. Restaurar una copia reemplaza los datos actuales (antes se guarda una copia de lo actual).</p>
            ${list.length ? `<div class="list">${list.map((x, i) => `<button class="item" data-snap="${i}"><span class="mov-ico c-blue">${ic("clock")}</span><div class="grow"><div class="name" style="font-size:15px">${G.fmtDate(x.at.slice(0, 10))} · ${x.at.slice(11, 16)}</div><div class="sub">${esc(x.reason)} · ${x.data.clients.length} clientes · ${x.data.loans.length} préstamos</div></div></button>`).join("")}</div>` : `<div class="empty"><p>Aún no hay copias automáticas.</p></div>`}`, (sh) => {
            $$("[data-snap]", sh).forEach((b) => b.onclick = async () => {
              const x = list[b.dataset.snap]; closeLayer();
              if (await confirmBox("¿Restaurar esta copia?", `Se volverá a los datos del ${G.fmtDate(x.at.slice(0, 10))} (${x.data.clients.length} clientes, ${x.data.loans.length} préstamos).`, "Restaurar", true)) {
                G.restoreSnapshot(Number(b.dataset.snap)); toast("Copia restaurada"); root("inicio");
              }
            });
          });
        };
        $("#aj-import", v).onclick = () => $("#aj-ifile", v).click();
        $("#aj-ifile", v).onchange = async (e) => {
          const f = e.target.files[0]; e.target.value = ""; if (!f) return;
          if (!(await confirmBox("¿Restaurar copia?", "Se reemplazarán TODOS los datos actuales (clientes, préstamos, pagos) por los de la copia. El usuario y la contraseña también serán los de la copia.", "Restaurar", true))) return;
          try { G.ops.importAll(await f.text()); config = window.GP.Config.get(); toast("Copia restaurada"); root("inicio"); }
          catch { alertBox("Archivo no válido", "Ese archivo no es una copia de seguridad de esta aplicación."); }
        };
      },
    };
  };
  function saveConfig() { G.Config.set(config); setLogoCache(); }
  async function hash(password, salt) {
    const data = new TextEncoder().encode(salt + ":" + password);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function setLogoCache() {
    let img = $("#rc-logo-cache");
    if (!img) { img = new Image(); img.id = "rc-logo-cache"; img.hidden = true; document.body.appendChild(img); }
    if (config.logo) img.src = config.logo; else img.removeAttribute("src");
  }

  // ================= Actualizaciones desde GitHub =================
  /* REGLA PARA NO PERDER DATOS AL ACTUALIZAR:
     - El APK nuevo debe tener el mismo identificador (com.piscuish.prestamos),
       la misma firma (android/app/debug.keystore) y un número de versión mayor.
     - Así Android lo instala como ACTUALIZACIÓN y conserva los datos de la app.
     - Nunca desinstales la app para instalar una versión nueva: eso sí borra los datos. */
  const GITHUB_REPO = "Piscuish/AplicacionPrestamos";
  const Update = {
    current: { version: "1.0", build: 0 },
    available: null,
    async init() {
      try {
        const vi = await G.versionInfo();
        this.current = { version: vi.webVersion, build: vi.webBuild, nativeBuild: vi.nativeBuild, canLive: vi.canLive, live: vi.live };
      } catch (e) { /* navegador */ }
      this.welcome();
      // Revisión automática: al abrir la app y al volver a ella (máximo cada 30 min)
      this.auto();
      const A2 = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (A2 && A2.addListener) A2.addListener("resume", () => this.auto());
      document.addEventListener("visibilitychange", () => { if (!document.hidden) this.auto(); });
    },
    welcome() {
      try {
        const b = String(this.current.build || "");
        if (!b || b === "0") return;
        const seen = localStorage.getItem("gp.seenBuild");
        localStorage.setItem("gp.seenBuild", b);
        const from = G.updatedFrom || (seen && seen !== b ? seen : null);
        if (!from || from === "web") return;
        const d = G.data;
        layer().innerHTML = `<div class="modal"><div class="modal-card" style="text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;background:#19a04a;color:#fff;display:grid;place-items:center;margin:0 auto 12px">${ic("check")}</div>
          <h3>¡App actualizada!</h3>
          <p>Ahora tienes la versión <b>${esc(this.current.version)}</b>.<br><br>Tus datos están completos:<br>
          <b>${d.clients.length}</b> clientes · <b>${d.loans.length}</b> préstamos · <b>${d.payments.filter((x) => x.amount > 0).length}</b> pagos</p>
          <button class="btn btn-primary" id="upd-ok">Entendido</button></div></div>`;
        $("#upd-ok", layer()).onclick = closeLayer;
        this.dismissed = this.current.build;
      } catch (e) { /* no bloquear */ }
    },
    lastAuto: 0,
    dismissed: null,
    async auto() {
      if (Date.now() - this.lastAuto < 30 * 60 * 1000) return;
      this.lastAuto = Date.now();
      const r = await this.check(false);
      if (!r.release) return;
      if (r.release.live) { await this.downloadLive(r.release, false); }
      const cur = stack.length && stack[stack.length - 1];
      if (cur && cur.name === "inicio") refresh();
      if (!r.release.live) this.prompt();
    },
    /* Descarga la actualización en vivo (sin APK). Queda lista y se aplica
       la próxima vez que se abra la app, o al tocar "Aplicar ahora". */
    liveReady: null,
    async downloadLive(rel, applyNow) {
      const U = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater;
      if (!U) return false;
      try {
        let pend = null; try { pend = JSON.parse(localStorage.getItem("gp.live.pending")); } catch (e) { /* nada */ }
        if (!pend || pend.build !== rel.build) {
          const b = await U.download({ url: rel.webUrl, version: rel.version });
          pend = { id: b.id, build: rel.build, version: rel.version };
          localStorage.setItem("gp.live.pending", JSON.stringify(pend));
          localStorage.removeItem("gp.live.tried");
        }
        this.liveReady = pend;
        if (applyNow) {
          G.snapshot("antes de actualización en vivo → " + rel.build);
          await G.mirrorNow();
          localStorage.setItem("gp.live.tried", String(rel.build));
          await U.set({ id: pend.id });
        }
        return true;
      } catch (e) {
        return false;
      }
    },
    async applyLiveNow() {
      if (!this.liveReady) return;
      if (!(await confirmBox("Aplicar actualización", "La app se reiniciará en unos segundos con la versión " + esc(this.liveReady.version) + ". Tus datos no se tocan. Tendrás que volver a iniciar sesión.", "Aplicar ahora"))) return;
      toast("Actualizando…");
      await this.downloadLive({ build: this.liveReady.build, version: this.liveReady.version, webUrl: "" }, true);
    },
    prompt() {
      const rel = this.available;
      if (!rel || this.dismissed === rel.build) return;
      const cur = stack.length && stack[stack.length - 1];
      // No interrumpir si está llenando un formulario: se avisa al volver a una pantalla principal
      if (!cur || !TABS.includes(cur.name) || stack.length > 1 || layer().innerHTML) { this.pending = true; return; }
      this.pending = false;
      layer().innerHTML = `<div class="modal"><div class="modal-card" style="text-align:center">
        <div style="width:64px;height:64px;border-radius:18px;background:#e6efff;color:#1d5bd8;display:grid;place-items:center;margin:0 auto 12px">${ic("download")}</div>
        <h3>Nueva versión disponible</h3>
        <p>Ya está lista la versión <b>${esc(rel.version)}</b>.${rel.notes ? `<br><span class="small">${esc(rel.notes.slice(0, 160))}</span>` : ""}<br><br>Tus clientes, préstamos y pagos <b>no se borran</b> al actualizar.</p>
        <div class="form"><button class="btn btn-primary" id="upd-now">${ic("download")}Actualizar ahora</button><button class="btn btn-soft" id="upd-later">Más tarde</button></div></div></div>`;
      $("#upd-later", layer()).onclick = () => { this.dismissed = rel.build; closeLayer(); };
      $("#upd-now", layer()).onclick = () => { closeLayer(); go("ajustes", { update: true }); };
    },
    async check(manual) {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
        localStorage.setItem("gp.update.lastCheck", String(Date.now()));
        if (res.status === 404) return manual ? { error: "Todavía no hay versiones publicadas en GitHub." } : {};
        if (!res.ok) return { error: "No se pudo consultar GitHub (código " + res.status + "). Intenta más tarde." };
        const j = await res.json();
        const m = String(j.tag_name || "").match(/(\d+)\.(\d+)\.(\d+)/);
        const build = m ? parseInt(m[3], 10) : 0;
        const apk = (j.assets || []).find((a) => /\.apk$/i.test(a.name));
        let web = null;
        for (const a of j.assets || []) { const w = a.name.match(/^www-(\d+)-n(\d+)(?:-h[0-9a-f]+)?\.zip$/); if (w) web = { url: a.browser_download_url, minNative: +w[2] }; }
        if (build > this.current.build) {
          const live = !!(web && this.current.canLive && this.current.nativeBuild >= web.minNative && localStorage.getItem("gp.live.failed") !== String(build));
          this.available = { version: m ? m[0] : j.tag_name, build, date: String(j.published_at || "").slice(0, 10) || G.today(), notes: j.body || "", apkUrl: apk && apk.browser_download_url, size: apk && apk.size, page: j.html_url, live, webUrl: web && web.url };
          return { release: this.available };
        }
        this.available = null; return {};
      } catch (e) {
        return { error: "Sin conexión a internet. Conéctate e intenta de nuevo." };
      }
    },
  };

  // ================= Inicio =================
  function buildTabbar() {
    const t = { inicio: ["home", "Inicio"], clientes: ["users", "Clientes"], prestamos: ["layers", "Préstamos"], calendario: ["calendar", "Calendario"] };
    $$(".tab").forEach((b) => { const [i, l] = t[b.dataset.tab]; b.innerHTML = ic(i) + l; });
    $("#fab").innerHTML = ic("plus");
    $("#fab").onclick = fabSheet;
  }

  window.Main = {
    start(cfg, logout) {
      config = cfg; onLogout = logout;
      setLogoCache(); buildTabbar(); G.applyMora();
      root("inicio");
      Update.init();
    },
    back() { return back(); },
  };
})();
