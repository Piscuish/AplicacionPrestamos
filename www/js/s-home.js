/* Pantallas: Inicio (panel), Más (módulos) y Búsqueda global. */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, avatar, plural, goAttr, appbar } = U;
  const cfg = () => G.Config.get() || {};
  function logoHtml() {
    const l = cfg().logo;
    if (l) return `<img src="${l}" alt="">`;
    return '<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#2563EB"/><g fill="#fff"><rect x="26" y="50" width="11" height="22" rx="2.5"/><rect x="42" y="38" width="11" height="34" rx="2.5"/><rect x="58" y="26" width="11" height="46" rx="2.5"/></g></svg>';
  }
  U.logoHtml = logoHtml;

  function statusTone(s) { return s === "pagado" ? "green" : s === "parcial" ? "amber" : s === "no_pago" || s === "no_encontrado" ? "red" : "grey"; }
  const VISIT = { pago_total: "Pagó completo", pago_parcial: "Pagó parcial", no_pago: "No pagó", no_encontrado: "No encontrado", pendiente: "Visita pendiente", pagado: "Pagado", parcial: "Parcial" };
  U.VISIT = VISIT; U.statusTone = statusTone;
  /* Etiqueta del estado de cobro (en listas de cobros, "pendiente" es "Por cobrar"). */
  U.colLabel = (s) => s === "pendiente" ? "Por cobrar" : VISIT[s] || "Por cobrar";
  /* Filtra los cobros del día según lo que el usuario puede ver (cobradores: solo sus clientes). */
  U.myCollections = (date) => { const vis = G.visibleClientIds(); return G.collectionsFor(date).filter((r) => !vis || vis.has(r.clientId)); };

  // ---------------------------------------------------------------- INICIO
  S.inicio = () => {
    const T = G.totals(); const t = G.today();
    const canFin = G.can("ver.finanzas");
    const fMonth = canFin ? G.finance(G.period("mes")) : null;
    const fToday = canFin ? G.finance(G.period("dia")) : null;
    const col = U.myCollections(t);
    const exp = col.reduce((s, r) => s + r.owed, 0), rec = col.reduce((s, r) => s + r.received, 0), pend = col.reduce((s, r) => s + r.pending, 0);
    const S0 = G.state(); const vis = G.visibleClientIds();
    const mine = S0.clients.filter((x) => !vis || vis.has(x.client.id));
    const empty = !G.data.clients.length;
    const s = U.session();
    // Alertas
    const overdueClients = mine.filter((x) => x.status === "mora" || x.status === "pendiente" && x.overdue);
    const overdueAmt = mine.reduce((a, x) => a + x.loans.reduce((b, l) => b + l.overdueAmount, 0), 0);
    const soon = G.addDays(t, 3);
    const upcoming = G.upcoming().filter(({ st, c }) => c.date > t && c.date <= soon && (!vis || vis.has(st.loan.clientId)));
    const ending = S0.loans.filter((st) => st.status !== "finalizado" && st.loan.count - st.paidCount <= 1 && (!vis || vis.has(st.loan.clientId)));
    const alerts = [];
    if (overdueClients.length) alerts.push(C.alert("danger", "alert", plural(overdueClients.length, "cliente atrasado", "clientes atrasados"), "Cuotas vencidas por " + money(overdueAmt), goAttr("clientes", { st: "atrasados" })));
    if (upcoming.length) alerts.push(C.alert("info", "clock", plural(upcoming.length, "pago próximo", "pagos próximos"), "En los próximos 3 días · " + money(upcoming.reduce((a, x) => a + x.c.remaining, 0)), goAttr("calendario", { view: "semana" })));
    if (ending.length) alerts.push(C.alert("ok", "checkcircle", plural(ending.length, "préstamo por finalizar", "préstamos por finalizar"), "Les queda una cuota o menos", goAttr("prestamos", { f: "porfinalizar" })));
    const R = U.reminders ? U.reminders() : null;
    const rn = R ? R.vencidos.length + R.hoy.length + R.manana.length : 0;
    if (rn && G.can("pago.registrar")) alerts.push(C.alert("", "whatsapp", "Recordatorios por WhatsApp", `${rn} por enviar · ${R.sentCount} enviados hoy`, goAttr("recordatorios")));
    const recent = G.movements().filter((m) => !vis || (m.clientId && vis.has(m.clientId))).slice(0, 5);
    return {
      html: appbar({
        brand: `<button class="appbar-brand brand-btn" ${goAttr("mas")} data-root="1" aria-label="Más opciones"><div class="mini-logo">${logoHtml()}</div><div style="min-width:0;text-align:left"><h1 class="ellipsis">${esc(cfg().company || "Gestión de Préstamos")}</h1><p>${esc(s ? s.name : "")} · ${esc((G.ROLES[s && s.role] || {}).label || "")}</p></div></button>`,
        right: `<button class="icon-btn" ${goAttr("buscar")} aria-label="Buscar">${ic("search")}</button>`,
      }) + `<main class="body">
        ${U.updateBanner ? U.updateBanner() : ""}
        ${U.backupBanner ? U.backupBanner() : ""}
        ${canFin ? `<div class="kpi-main">
          <div class="kpi-label">${ic("wallet", "sm")}Total por cobrar</div>
          <div class="kpi-v">${money(T.pending)}</div>
          <div class="small muted">${plural(T.activeLoans, "préstamo activo", "préstamos activos")}${T.overdueLoans ? ` · <span class="red">${plural(T.overdueLoans, "vencido", "vencidos")}</span>` : ""}</div>
          <div class="kpi-row"><div><div class="kpi-label">Dinero disponible</div><div class="v ${G.cashAvailable() < 0 ? "red" : ""}">${money(G.cashAvailable())}</div></div>
            <div><div class="kpi-label">Recaudado este mes</div><div class="v">${money(fMonth.payIncome)}</div></div></div>
          <details class="kpi-more"><summary>Más indicadores ${ic("chevdown", "sm")}</summary>
            ${C.kv([["Capital prestado por recuperar", money(T.capitalPending)], ["Intereses cobrados este mes", `<span class="green">${money(fMonth.interest)}</span>`], ["Recaudado hoy", money(fToday.payIncome)],
              ["Ganancia del mes", money(fMonth.profit)], ["Intereses por cobrar", money(T.interestPending)], ["Clientes", String(T.clients)]])}
            ${G.cashAvailable() < 0 ? `<p class="hint" style="margin-top:8px">El disponible es negativo porque no hay capital inicial registrado. Regístralo como <a class="h-link" ${goAttr("movForm", { kind: "aporte" })}>aporte de capital</a>.</p>` : ""}
          </details></div>` : ""}
        ${empty ? C.empty("users", "Aún no tienes clientes", "Empieza registrando el primero y luego crea su préstamo.", G.can("cliente.editar") ? `<button class="btn btn-primary" ${goAttr("clienteForm", {})}>${ic("plus")}Nuevo cliente</button>` : "") : `
        ${C.section("Cobros de hoy", `<button class="h-link" data-tab="cobros">Ver todos</button>`, col.length ? `
          <div class="card" style="padding:12px 14px"><div class="grid2" style="grid-template-columns:repeat(3,1fr)">
            <div><div class="kpi-label">Esperado</div><div class="strong tnum">${money(exp)}</div></div>
            <div><div class="kpi-label">Recibido</div><div class="strong tnum green">${money(rec)}</div></div>
            <div><div class="kpi-label">Falta</div><div class="strong tnum ${pend ? "red" : ""}">${money(pend)}</div></div></div>
            <div style="margin-top:10px">${C.progress(exp ? rec / exp : 0)}</div></div>
          <div class="list">${col.slice(0, 5).map((r) => `<button class="item" ${goAttr("cliente", { id: r.clientId })}>${avatar(r.x.client)}<div class="grow"><div class="name">${esc(r.x.client.name)}</div><div class="sub">Debe ${money(r.owed)}${r.received ? " · recibió " + money(r.received) : ""}</div></div><div class="right">${C.badge(statusTone(r.status), U.colLabel(r.status))}${r.pending ? `<span class="amount small">${money(r.pending)}</span>` : ""}</div></button>`).join("")}</div>
          ${col.length > 5 ? `<button class="btn btn-soft" data-tab="cobros">Ver los ${col.length} cobros de hoy</button>` : ""}`
          : `<div class="card">${C.empty("checkcircle", "Sin cobros para hoy", G.noPayReason(t) ? esc(G.noPayReason(t)) : "No hay cuotas que venzan hoy.")}</div>`)}
        ${alerts.length ? C.section("Alertas", "", `<div class="stack" style="gap:8px">${alerts.join("")}</div>`) : ""}
        ${C.section("Accesos rápidos", "", `<div class="quick">
          ${G.can("cliente.editar") ? `<button ${goAttr("clienteForm", {})}>${ic("user")}Cliente</button>` : ""}
          ${G.can("prestamo.crear") ? `<button ${goAttr("prestamoForm", {})}>${ic("hand")}Préstamo</button>` : ""}
          ${G.can("pago.registrar") ? `<button id="q-pay">${ic("dollar")}Pago</button>` : ""}
          <button ${goAttr("calendario")}>${ic("calendar")}Calendario</button></div>`)}
        ${recent.length && canFin ? C.section("Actividad reciente", `<button class="h-link" ${goAttr("movimientos")}>Ver todo</button>`, `<div class="list">${recent.map(U.movRow).join("")}</div>`) : ""}`}
      </main>`,
      bind(v) {
        const q = $("#q-pay", v); if (q) q.onclick = () => U.pickLoanSheet();
        if (U.bindBanners) U.bindBanners(v);
        U.bindMovRows(v);
      },
    };
  };

  U.session = () => G.session;
  U.movRow = (r) => {
    const tone = r.kind === "loan" ? "blue" : r.kind === "ajuste" ? "violet" : r.kind === "aporte" || r.kind === "retiro" ? "grey" : r.sign > 0 ? "green" : "red";
    const icon = r.kind === "loan" ? "hand" : r.kind === "pay" ? "down" : r.kind === "ajuste" ? "repeat" : r.sign > 0 ? "down" : "up";
    const amt = `<span class="amount ${r.voided ? "muted" : r.sign > 0 ? "green" : ""}" ${r.voided ? 'style="text-decoration:line-through"' : ""}>${r.sign > 0 ? "+" : r.sign < 0 ? "−" : ""}${money(r.amount)}</span>`;
    const target = r.kind === "pay" ? `data-pay="${r.ref.id}"` : r.kind === "loan" ? goAttr("prestamo", { id: r.ref.id }) : `data-mov="${r.ref.id}"`;
    return `<button class="item" ${target}><span class="lead-ico t-${tone}">${ic(icon)}</span><div class="grow"><div class="name">${esc(r.title)}</div><div class="sub">${esc(r.sub)} · ${G.relDay(r.date)}</div></div>${amt}</button>`;
  };

  // ---------------------------------------------------------------- MÁS
  S.mas = () => {
    const s = U.session();
    const it = (perm, name, icon, tone, label, sub) => (!perm || G.can(perm)) ? `<button class="item" ${goAttr(name)}><span class="lead-ico t-${tone}">${ic(icon)}</span><div class="grow"><div class="name">${label}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>${ic("right", "chev")}</button>` : "";
    const group = (title, items) => { const h = items.join(""); return h ? `<div class="menu-group"><h3>${title}</h3><div class="list">${h}</div></div>` : ""; };
    return {
      html: appbar({ title: "Más" }) + `<main class="body">
        <div class="card row"><div class="mini-logo" style="width:48px;height:48px">${logoHtml()}</div><div class="grow"><div class="strong ellipsis">${esc(cfg().company || "")}</div><div class="small muted">${esc(s ? s.name : "")} · ${esc((G.ROLES[s && s.role] || {}).label || "")}</div></div></div>
        ${group("Operación", [it(null, "prestamos", "layers", "blue", "Préstamos", "Activos, vencidos y finalizados"), it(null, "calendario", "calendar", "blue", "Calendario de cobros"), it("pago.registrar", "recordatorios", "whatsapp", "green", "Recordatorios", "Avisos de cobro por WhatsApp")])}
        ${group("Organización", [it("ver.todo", "carteras", "folder", "violet", "Carteras", "Agrupa clientes y préstamos"), it(null, "rutas", "route", "violet", "Rutas de cobro", "Recorridos y visitas")])}
        ${group("Dinero", [it("ver.finanzas", "finanzas", "chart", "green", "Finanzas", "Ganancia, ingresos, gastos y gráficos"), it("ver.finanzas", "movimientos", "list", "green", "Movimientos"), it("caja.operar", "caja", "cash", "green", "Cierre de caja", "Apertura, cierre y diferencias"), it("ver.reportes", "reportes", "report", "green", "Reportes", "PDF y Excel (CSV)")])}
        ${group("Administración", [it("ver.usuarios", "usuarios", "users", "amber", "Usuarios y cobradores", "Roles, permisos y asignaciones"), it("ver.reportes", "auditoria", "shield", "amber", "Auditoría", "Quién hizo qué y cuándo"), it(null, "ajustes", "settings", "grey", "Configuración", "Empresa, apariencia, seguridad y datos")])}
        <button class="btn btn-soft" id="m-logout">${ic("logout")}Cerrar sesión</button>
        <p class="note">Gestión de Préstamos · versión ${esc(U.appVersion ? U.appVersion() : "")}</p>
      </main>`,
      bind(v) { $("#m-logout", v).onclick = () => U.logout && U.logout(); },
    };
  };

  // ---------------------------------------------------------------- BÚSQUEDA GLOBAL
  S.buscar = (p) => ({
    html: appbar({ back: true, title: "Buscar" }) + `<main class="body">
      <div class="search"><div class="field">${ic("search")}<input id="gq" type="search" placeholder="Cliente, documento, teléfono, préstamo, recibo…" value="${esc(p.q || "")}" autocomplete="off"></div></div>
      <div id="gres"></div></main>`,
    bind(v) {
      const inp = $("#gq", v);
      const draw = () => {
        const q = inp.value.trim().toLowerCase(); U.cur().params.q = inp.value;
        if (q.length < 2) { $("#gres", v).innerHTML = C.empty("search", "", "Escribe al menos 2 letras o números."); return; }
        const digits = q.replace(/\D/g, "");
        const vis = G.visibleClientIds();
        const cl = G.data.clients.filter((c) => (!vis || vis.has(c.id)) && ([c.name, c.email, c.barrio, c.city].some((s) => String(s || "").toLowerCase().includes(q)) || (digits.length >= 3 && [c.doc, c.phone, c.phone2].some((s) => String(s || "").replace(/\D/g, "").includes(digits))))).slice(0, 20);
        const lo = G.state().loans.filter((st) => (!vis || vis.has(st.loan.clientId)) && st.loan.num.toLowerCase().includes(q)).slice(0, 10);
        const mv = G.can("ver.finanzas") ? G.movements({ voided: true }).filter((m) => [m.title, m.sub, m.ref.receiptNo].some((s) => String(s || "").toLowerCase().includes(q))).slice(0, 15) : [];
        const blocks = [];
        if (cl.length) blocks.push(C.section("Clientes", "", `<div class="list">${cl.map((c) => { const x = G.state().byClient.get(c.id); return `<button class="item" ${goAttr("cliente", { id: c.id })}>${avatar(c)}<div class="grow"><div class="name">${esc(c.name)}</div><div class="sub">${esc([c.doc ? (c.docType || "CC") + " " + c.doc : "", c.phone].filter(Boolean).join(" · ") || "Sin datos de contacto")}</div></div>${x ? U.clientBadge(x) : ""}</button>`; }).join("")}</div>`));
        if (lo.length) blocks.push(C.section("Préstamos", "", `<div class="list">${lo.map((st) => U.loanRow(st)).join("")}</div>`));
        if (mv.length) blocks.push(C.section("Movimientos", "", `<div class="list">${mv.map(U.movRow).join("")}</div>`));
        $("#gres", v).innerHTML = blocks.join("") || C.empty("search", "Sin resultados", "No se encontró nada con «" + esc(inp.value) + "».");
        U.bindMovRows($("#gres", v));
      };
      inp.oninput = draw; draw(); setTimeout(() => inp.focus(), 60);
    },
  });
})();
