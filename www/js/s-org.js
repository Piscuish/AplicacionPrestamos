/* Pantallas: Carteras y Rutas de cobro. */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, avatar, plural, goAttr, appbar, act, sheet, closeLayer, confirmBox, promptBox, toast } = U;
  const COLORS = ["#2563EB", "#16A34A", "#EA8A20", "#DC4545", "#6D5BD0", "#0E9AA7", "#718096"];
  const DAYS = [[1, "Lun"], [2, "Mar"], [3, "Mié"], [4, "Jue"], [5, "Vie"], [6, "Sáb"], [0, "Dom"]];
  const noPerm = (t) => ({ html: appbar({ back: true, title: t }) + `<main class="body">${C.empty("lock", "Sin permiso", "Tu usuario no tiene acceso a esta sección.")}</main>` });

  function pfStats(pid) {
    const S0 = G.state(); const m = G.period("mes");
    const cl = S0.clients.filter((x) => (x.client.portfolioId || null) === pid);
    const loans = S0.loans.filter((x) => (x.loan.portfolioId || null) === pid);
    const ids = new Set(loans.map((x) => x.loan.id));
    const collected = G.data.payments.filter((p) => G.activePay(p) && ids.has(p.loanId) && p.date >= m.from && p.date <= m.to).reduce((s, p) => s + p.amount, 0);
    return { cl, loans, capital: loans.reduce((s, x) => s + x.capitalPending, 0), balance: loans.reduce((s, x) => s + x.balance, 0), overdue: loans.reduce((s, x) => s + x.overdueAmount, 0), collected, mora: cl.filter((x) => x.status === "mora").length };
  }

  // ---------------------------------------------------------------- CARTERAS
  S.carteras = (p) => {
    if (!G.can("ver.todo") && !G.can("cartera.gestionar")) return noPerm("Carteras");
    const showArch = p.arch;
    const list = G.data.portfolios.filter((x) => showArch ? x.status === "archivada" : x.status !== "archivada");
    const none = pfStats(null);
    return {
      html: appbar({ back: true, title: "Carteras", sub: plural(list.length, "cartera", "carteras"), right: G.can("cartera.gestionar") ? `<button class="icon-btn" ${goAttr("carteraForm", {})} aria-label="Nueva cartera">${ic("plus")}</button>` : "" }) + `<main class="body">
        <p class="hint">Una cartera agrupa clientes y sus préstamos (por zona, socio o responsable). Cambiar de cartera nunca cambia montos ni cuotas.</p>
        ${list.length ? `<div class="list">${list.map((pf) => { const s = pfStats(pf.id); return `<button class="item" ${goAttr("cartera", { id: pf.id })}><span class="lead-ico" style="background:${pf.color || "var(--surface-2)"}22;color:${pf.color || "var(--text-2)"}">${ic("folder")}</span>
          <div class="grow"><div class="name">${esc(pf.name)}</div><div class="sub">${plural(s.cl.length, "cliente", "clientes")} · cobrado mes ${money(s.collected)}</div>${s.overdue ? `<div class="sub red">Vencido ${money(s.overdue)}</div>` : ""}</div>
          <div class="right"><span class="amount">${money(s.capital)}</span><span class="xs muted">capital pendiente</span></div></button>`; }).join("")}</div>`
          : C.empty("folder", showArch ? "Sin carteras archivadas" : "Aún no hay carteras", "Crea una para agrupar clientes por zona o responsable.", !showArch && G.can("cartera.gestionar") ? `<button class="btn btn-primary" ${goAttr("carteraForm", {})}>${ic("plus")}Nueva cartera</button>` : "")}
        ${!showArch && none.cl.length ? `<div class="card between"><div><div class="strong">Sin cartera</div><div class="small muted">${plural(none.cl.length, "cliente", "clientes")} · ${money(none.capital)} capital pendiente</div></div>${G.can("cartera.gestionar") && list.length ? `<button class="btn sm btn-soft" id="pf-assign">Asignar</button>` : ""}</div>` : ""}
        <button class="link-btn" id="pf-arch">${showArch ? "Ver carteras activas" : "Ver archivadas"}</button>
      </main>`,
      bind(v) {
        $("#pf-arch", v).onclick = () => U.setParam({ arch: !showArch }, true);
        const a = $("#pf-assign", v); if (a) a.onclick = () => U.go("asignarClientes", { kind: "pf", fromNone: true });
      },
    };
  };

  S.carteraForm = (p) => {
    if (!G.can("cartera.gestionar")) return noPerm("Cartera");
    const pf = p.id ? Object.assign({}, G.data.portfolios.find((x) => x.id === p.id)) : { color: COLORS[G.data.portfolios.length % COLORS.length], status: "activa" };
    const users = [{ id: "admin", username: (G.Config.get() || {}).username }].concat(G.data.users.filter((u) => u.active !== false));
    return {
      html: appbar({ back: true, title: p.id ? "Editar cartera" : "Nueva cartera" }) + `<main class="body pad-bottom"><form class="form" id="pff" novalidate>
        ${C.field({ id: "pf-name", label: "Nombre", icon: "folder", value: pf.name, req: true, attrs: 'maxlength="40"' })}
        ${C.field({ id: "pf-desc", label: "Descripción (opcional)", icon: "note", value: pf.description, attrs: 'maxlength="120"' })}
        ${C.select({ id: "pf-owner", label: "Responsable", icon: "user", options: [["", "Sin responsable"]].concat(users.map((u) => [u.id, u.username])), value: pf.ownerId || "" })}
        <div class="fieldset-title">Color</div><div class="swatches">${COLORS.map((c) => `<button type="button" data-color="${c}" class="${c === pf.color ? "on" : ""}" style="background:${c}" aria-label="Color ${c}"></button>`).join("")}</div>
        ${p.id ? C.seg("pst", [["activa", "Activa"], ["archivada", "Archivada"]], pf.status, "two") : ""}
        <div class="sticky-cta"><button class="btn btn-primary" type="submit">${ic("check")}Guardar cartera</button></div></form></main>`,
      bind(v) {
        let color = pf.color, status = pf.status;
        $$("[data-color]", v).forEach((b) => b.onclick = () => { color = b.dataset.color; $$("[data-color]", v).forEach((x) => x.classList.toggle("on", x === b)); });
        $$("[data-pst]", v).forEach((b) => b.onclick = () => { status = b.dataset.pst; $$("[data-pst]", v).forEach((x) => x.classList.toggle("on", x === b)); });
        $("#pff", v).onsubmit = (e) => {
          e.preventDefault();
          const name = $("#pf-name", v).value.trim(); if (!U.fieldErrors(v, name.length < 2 ? { "pf-name": "Escribe el nombre." } : {})) return;
          const r = act(() => G.ops.savePortfolio({ id: p.id, name, description: $("#pf-desc", v).value.trim(), ownerId: $("#pf-owner", v).value || null, color, status }), "Cartera guardada");
          if (r) { if (p.id) U.back(); else U.go("cartera", { id: r.id }, true); }
        };
      },
    };
  };

  S.cartera = (p) => {
    const pf = G.data.portfolios.find((x) => x.id === p.id); if (!pf) return { redirect: U.back };
    const s = pfStats(pf.id); const tab = p.t || "resumen";
    const ids = new Set(s.loans.map((x) => x.loan.id));
    let content = "";
    if (tab === "resumen") {
      content = `<div class="stat-grid">${C.stat("Capital pendiente", money(s.capital))}${C.stat("Saldo por cobrar", money(s.balance))}${C.stat("Recaudado este mes", money(s.collected), "green")}${C.stat("Saldo vencido", money(s.overdue), s.overdue ? "red" : "")}${C.stat("Clientes", String(s.cl.length))}${C.stat("Préstamos activos", String(s.loans.filter((x) => x.status !== "finalizado").length))}</div>
        ${C.kv([["Morosidad (clientes en mora)", s.cl.length ? Math.round(s.mora / s.cl.length * 100) + " %" : "0 %"], ["Responsable", esc((pf.ownerId === "admin" ? (G.Config.get() || {}).username : (G.data.users.find((u) => u.id === pf.ownerId) || {}).username) || "—")], ["Estado", pf.status === "archivada" ? "Archivada" : "Activa"], pf.description && ["Descripción", esc(pf.description)]])}`;
    } else if (tab === "clientes") {
      content = s.cl.length ? `<div class="list">${s.cl.map((x) => `<button class="item" ${goAttr("cliente", { id: x.client.id })}>${avatar(x.client)}<div class="grow"><div class="name">${esc(x.client.name)}</div><div class="sub">${x.debt ? "Debe " + money(x.debt) : "Sin saldo"}</div></div>${U.clientBadge(x)}</button>`).join("")}</div>` : C.empty("users", "Sin clientes", "Agrega clientes a esta cartera.");
    } else if (tab === "prestamos") {
      content = s.loans.length ? `<div class="list">${s.loans.map((st) => U.loanRow(st)).join("")}</div>` : C.empty("layers", "Sin préstamos", "");
    } else if (tab === "mora") {
      const late = s.loans.filter((x) => x.overdueAmount > 0).sort((a, b) => b.maxDaysLate - a.maxDaysLate);
      content = late.length ? `<div class="list">${late.map((st) => { const c = U.client(st.loan.clientId); return `<button class="item" ${goAttr("prestamo", { id: st.loan.id })}>${avatar(c)}<div class="grow"><div class="name">${esc(c ? c.name : "")}</div><div class="sub">#${st.loan.num} · ${st.maxDaysLate} días · ${plural(st.overdueCount, "cuota", "cuotas")}</div></div><span class="amount red">${money(st.overdueAmount)}</span></button>`; }).join("")}</div>` : C.empty("checkcircle", "Sin morosidad", "Ningún préstamo de esta cartera está vencido.");
    } else {
      const mv = G.movements().filter((m) => (m.kind === "pay" && ids.has(m.ref.loanId)) || (m.kind === "loan" && ids.has(m.ref.id))).slice(0, 60);
      content = mv.length ? `<div class="list">${mv.map(U.movRow).join("")}</div>` : C.empty("list", "Sin movimientos", "");
    }
    return {
      html: appbar({ back: true, title: pf.name, sub: "Cartera", right: G.can("cartera.gestionar") ? `<button class="icon-btn" id="pf-more" aria-label="Más">${ic("more")}</button>` : "" }) + `<main class="body">
        ${C.tabs("t", [["resumen", "Resumen"], ["clientes", `Clientes (${s.cl.length})`], ["prestamos", "Préstamos"], ["mora", "Morosidad"], ["movs", "Movimientos"]], tab)}
        ${content}
        ${G.can("ver.reportes") ? `<button class="btn btn-soft" ${goAttr("reportes", { tipo: "carteras" })}>${ic("report")}Reporte de carteras</button>` : ""}
      </main>`,
      bind(v) {
        $$("[data-t]", v).forEach((b) => b.onclick = () => U.setParam({ t: b.dataset.t }, true));
        U.bindMovRows(v);
        const m = $("#pf-more", v); if (m) m.onclick = () => sheet(null, C.opt("users", "blue", "Agregar o cambiar clientes", "Elige qué clientes pertenecen a esta cartera", goAttr("asignarClientes", { kind: "pf", id: pf.id })) + C.opt("edit", "grey", "Editar cartera", "", goAttr("carteraForm", { id: pf.id })) +
          (pf.status !== "archivada" ? C.opt("archive", "amber", "Archivar cartera", "Los clientes conservan sus datos y préstamos", 'id="pf-arch"') : ""), (sh) => {
          const a = $("#pf-arch", sh); if (a) a.onclick = async () => { closeLayer(); if (await confirmBox("¿Archivar cartera?", "Deja de aparecer en las listas. Sus clientes y préstamos no cambian.", "Archivar")) { act(() => G.ops.savePortfolio(Object.assign({}, pf, { status: "archivada" })), "Cartera archivada"); U.back(); } };
        });
      },
    };
  };

  /* Selección múltiple de clientes para una cartera o ruta. */
  S.asignarClientes = (p) => {
    const isPf = p.kind === "pf";
    if (!G.can(isPf ? "cartera.gestionar" : "ruta.gestionar")) return noPerm("Asignar clientes");
    const target = isPf ? G.data.portfolios.find((x) => x.id === p.id) : G.data.routes.find((x) => x.id === p.id);
    const sel = p.sel || new Set(isPf ? G.data.clients.filter((c) => p.id && c.portfolioId === p.id).map((c) => c.id) : (target ? target.clientIds || [] : []));
    p.sel = sel; p.pid = p.pid || (isPf ? p.id : null);
    const all = G.state().clients.filter((x) => x.client.status !== "archivado");
    const q = (p.q || "").toLowerCase();
    const rows = all.filter((x) => !q || x.client.name.toLowerCase().includes(q) || (x.client.barrio || "").toLowerCase().includes(q));
    return {
      html: appbar({ back: true, title: isPf ? "Clientes de la cartera" : "Clientes de la ruta", sub: target ? target.name : (isPf ? "Elige la cartera" : "") }) + `<main class="body pad-bottom">
        ${isPf && !p.id ? C.select({ id: "as-pf", label: "Cartera destino", icon: "folder", options: [["", "Selecciona…"]].concat(G.data.portfolios.filter((x) => x.status !== "archivada").map((x) => [x.id, x.name])), value: p.pid || "" }) : ""}
        <div class="search"><div class="field">${ic("search")}<input id="as-q" type="search" placeholder="Buscar por nombre o barrio" value="${esc(p.q || "")}"></div></div>
        <p class="hint">${sel.size} seleccionados.${!isPf ? " Un cliente solo puede estar en una ruta: si ya tiene otra, se moverá a esta." : " Un cliente pertenece a una sola cartera."}</p>
        <div class="list">${rows.map((x) => { const other = isPf ? (x.portfolio && x.portfolio.id !== p.pid ? x.portfolio.name : "") : (x.route && x.route.id !== p.id ? x.route.name : "");
          return `<label class="item"><input type="checkbox" data-cid="${x.client.id}" ${sel.has(x.client.id) ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--primary)">${avatar(x.client)}<div class="grow"><div class="name">${esc(x.client.name)}</div><div class="sub">${esc(x.client.barrio || x.client.address || "")}${other ? ` · <span class="amber">en ${esc(other)}</span>` : ""}</div></div></label>`; }).join("") || C.empty("users", "Sin clientes", "")}</div>
        <div class="sticky-cta"><button class="btn btn-primary" id="as-save">${ic("check")}Guardar (${sel.size})</button></div></main>`,
      bind(v) {
        $$("[data-cid]", v).forEach((b) => b.onchange = () => { if (b.checked) sel.add(b.dataset.cid); else sel.delete(b.dataset.cid); $("#as-save", v).lastChild.textContent = "Guardar (" + sel.size + ")"; });
        $("#as-q", v).oninput = (e) => { p.q = e.target.value; clearTimeout(p._t); p._t = setTimeout(() => { U.refresh(); const i = $("#as-q"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); };
        const sp = $("#as-pf", v); if (sp) sp.onchange = (e) => { p.pid = e.target.value; };
        $("#as-save", v).onclick = () => {
          if (isPf) {
            const pid = p.pid; if (!pid) { toast("Elige la cartera.", "err"); return; }
            const before = G.data.clients.filter((c) => c.portfolioId === pid).map((c) => c.id);
            const removed = before.filter((id) => !sel.has(id));
            if (act(() => { G.ops.assignPortfolio([...sel], pid); if (removed.length) G.ops.assignPortfolio(removed, null); }, "Cartera actualizada")) U.back();
          } else {
            const r = G.data.routes.find((x) => x.id === p.id);
            const ordered = (r.clientIds || []).filter((id) => sel.has(id)).concat([...sel].filter((id) => !(r.clientIds || []).includes(id)));
            if (act(() => G.ops.saveRoute(Object.assign({}, r, { clientIds: ordered })), "Ruta actualizada")) U.back();
          }
        };
      },
    };
  };

  // ---------------------------------------------------------------- RUTAS
  function routeStats(r, date) {
    const ids = new Set(r.clientIds || []);
    const col = G.collectionsFor(date).filter((x) => ids.has(x.clientId));
    return { col, expected: col.reduce((s, x) => s + x.owed, 0), received: col.reduce((s, x) => s + x.received, 0) };
  }
  const myRoute = (r) => { const s = G.session || {}; if (G.can("ver.todo")) return true; const u = G.data.users.find((x) => x.id === s.id) || {}; return r.collectorId === s.id || (u.routeIds || []).includes(r.id); };
  const userName = (id) => id === "admin" ? (G.Config.get() || {}).username : (G.data.users.find((u) => u.id === id) || {}).username;
  S.rutas = () => {
    const list = G.data.routes.filter((r) => r.status !== "archivada" && myRoute(r)); const t = G.today();
    return {
      html: appbar({ back: true, title: "Rutas de cobro", right: G.can("ruta.gestionar") ? `<button class="icon-btn" ${goAttr("rutaForm", {})} aria-label="Nueva ruta">${ic("plus")}</button>` : "" }) + `<main class="body">
        ${list.length ? `<div class="list">${list.map((r) => { const s = routeStats(r, t); const today = !(r.days || []).length || r.days.includes(G.parseISO(t).getDay());
          return `<button class="item" ${goAttr("ruta", { id: r.id })}><span class="lead-ico t-violet">${ic("route")}</span><div class="grow"><div class="name">${esc(r.name)}</div>
            <div class="sub">${esc(r.zone || "Sin zona")} · ${(r.days || []).length ? DAYS.filter(([d]) => r.days.includes(d)).map(([, n]) => n).join(", ") : "Todos los días"}</div>
            <div class="sub">${plural((r.clientIds || []).length, "cliente", "clientes")}${r.collectorId ? " · " + esc(userName(r.collectorId) || "") : ""}</div></div>
            <div class="right">${today ? `<span class="amount">${money(s.expected)}</span><span class="xs green">${money(s.received)} recibido</span>` : C.badge("grey", "Hoy no")}</div></button>`; }).join("")}</div>`
          : C.empty("route", "Aún no hay rutas", "Una ruta organiza el recorrido de cobro: orden de visita, días y cobrador.", G.can("ruta.gestionar") ? `<button class="btn btn-primary" ${goAttr("rutaForm", {})}>${ic("plus")}Nueva ruta</button>` : "")}
      </main>`,
    };
  };

  S.rutaForm = (p) => {
    if (!G.can("ruta.gestionar")) return noPerm("Ruta");
    const r = p.draft || (p.id ? JSON.parse(JSON.stringify(G.data.routes.find((x) => x.id === p.id))) : { days: [], clientIds: [], status: "activa" });
    p.draft = r;
    const collectors = [{ id: "admin", username: (G.Config.get() || {}).username, role: "admin" }].concat(G.data.users.filter((u) => u.active !== false));
    return {
      html: appbar({ back: true, title: p.id ? "Editar ruta" : "Nueva ruta" }) + `<main class="body pad-bottom"><form class="form" id="rf" novalidate>
        ${C.field({ id: "rf-name", label: "Nombre", icon: "route", value: r.name, req: true, attrs: 'maxlength="40"' })}
        ${C.field({ id: "rf-zone", label: "Barrio o zona", icon: "pin", value: r.zone, attrs: 'maxlength="60"' })}
        ${C.field({ id: "rf-desc", label: "Descripción (opcional)", icon: "note", value: r.description, attrs: 'maxlength="120"' })}
        <div class="fieldset-title">Días de cobro (vacío = todos)</div>
        <div class="chips" style="flex-wrap:wrap;margin:0;padding:0">${DAYS.map(([d, n]) => `<button type="button" class="chip ${(r.days || []).includes(d) ? "active" : ""}" data-day="${d}">${n}</button>`).join("")}</div>
        ${C.select({ id: "rf-col", label: "Cobrador responsable (opcional)", icon: "user", options: [["", "Sin asignar"]].concat(collectors.map((u) => [u.id, u.username + " · " + G.ROLES[u.role].label])), value: r.collectorId || "" })}
        ${p.id ? C.seg("rst", [["activa", "Activa"], ["archivada", "Archivada"]], r.status, "two") : ""}
        <p class="hint">${p.id ? "Los clientes y su orden de visita se cambian desde el detalle de la ruta." : "Después de guardar podrás agregar los clientes y ordenar las visitas."}</p>
        <div class="sticky-cta"><button class="btn btn-primary" type="submit">${ic("check")}Guardar ruta</button></div></form></main>`,
      bind(v) {
        $$("[data-day]", v).forEach((b) => b.onclick = () => { const d = +b.dataset.day; r.days = r.days.includes(d) ? r.days.filter((x) => x !== d) : r.days.concat(d); b.classList.toggle("active"); });
        $$("[data-rst]", v).forEach((b) => b.onclick = () => { r.status = b.dataset.rst; $$("[data-rst]", v).forEach((x) => x.classList.toggle("on", x === b)); });
        $("#rf", v).onsubmit = (e) => {
          e.preventDefault();
          const name = $("#rf-name", v).value.trim(); if (!U.fieldErrors(v, name.length < 2 ? { "rf-name": "Escribe el nombre." } : {})) return;
          const out = act(() => G.ops.saveRoute(Object.assign(r, { id: p.id, name, zone: $("#rf-zone", v).value.trim(), description: $("#rf-desc", v).value.trim(), collectorId: $("#rf-col", v).value || null })), "Ruta guardada");
          if (out) { if (p.id) U.back(); else U.go("asignarClientes", { kind: "rt", id: out.id }, true); }
        };
      },
    };
  };

  S.ruta = (p) => {
    const r = G.data.routes.find((x) => x.id === p.id); if (!r || !myRoute(r)) return { redirect: U.back };
    const t = G.today(); const s = routeStats(r, t); const byC = new Map(s.col.map((x) => [x.clientId, x]));
    const canEdit = G.can("ruta.gestionar");
    const clients = (r.clientIds || []).map((id) => G.state().byClient.get(id)).filter(Boolean);
    return {
      html: appbar({ back: true, title: r.name, sub: (r.zone || "Ruta de cobro"), right: canEdit ? `<button class="icon-btn" id="rt-more" aria-label="Más">${ic("more")}</button>` : "" }) + `<main class="body pad-bottom">
        ${C.kv([["Días", (r.days || []).length ? DAYS.filter(([d]) => r.days.includes(d)).map(([, n]) => n).join(", ") : "Todos"], ["Cobrador", esc(userName(r.collectorId) || "Sin asignar")], ["Esperado hoy", money(s.expected)], ["Recaudado hoy", `<span class="green">${money(s.received)}</span>`], r.description && ["Descripción", esc(r.description)]])}
        ${C.section(`Orden de visita <span class="muted">· ${clients.length}</span>`, canEdit ? `<button class="h-link" ${goAttr("asignarClientes", { kind: "rt", id: r.id })}>Agregar / quitar</button>` : "", clients.length ? `<div class="list">${clients.map((x, i) => { const c = byC.get(x.client.id);
          return `<div class="item"><span class="lead-ico t-grey" style="font-weight:700">${i + 1}</span><button class="grow" style="background:none;border:0;text-align:left;padding:0;color:inherit;min-width:0" ${goAttr("cliente", { id: x.client.id })}><div class="name">${esc(x.client.name)}</div><div class="sub">${esc([x.client.address, x.client.barrio].filter(Boolean).join(", ") || "Sin dirección")}</div><div class="sub">${x.client.phone ? esc(x.client.phone) + " · " : ""}${c ? "Hoy " + money(c.owed) : "Sin cuota hoy"}</div></button>
            ${canEdit ? `<div class="right" style="flex-direction:row;gap:0"><button class="icon-btn" data-mv="${i}" data-dir="-1" ${i ? "" : "disabled"} aria-label="Subir">${ic("up")}</button><button class="icon-btn" data-mv="${i}" data-dir="1" ${i < clients.length - 1 ? "" : "disabled"} aria-label="Bajar">${ic("down")}</button></div>` : ""}</div>`; }).join("")}</div>` : C.empty("users", "Ruta sin clientes", "Agrega clientes para empezar a cobrar.", canEdit ? `<button class="btn btn-primary" ${goAttr("asignarClientes", { kind: "rt", id: r.id })}>${ic("plus")}Agregar clientes</button>` : ""))}
        ${clients.some((x) => x.client.address) ? `<button class="btn btn-soft" id="rt-map">${ic("map")}Abrir recorrido en Google Maps</button><p class="hint">Se abre la app de mapas con las direcciones en orden. Requiere internet; las direcciones se envían a Google Maps. No se inventan ubicaciones: los clientes sin dirección se omiten.</p>` : ""}
        ${clients.length ? `<div class="sticky-cta"><button class="btn btn-primary" ${goAttr("rutaRun", { id: r.id, date: t })}>${ic("play")}Ejecutar ruta de hoy</button></div>` : ""}
      </main>`,
      bind(v) {
        $$("[data-mv]", v).forEach((b) => b.onclick = () => {
          const i = +b.dataset.mv, j = i + +b.dataset.dir; const ids = r.clientIds.slice(); [ids[i], ids[j]] = [ids[j], ids[i]];
          act(() => G.ops.saveRoute(Object.assign({}, r, { clientIds: ids }))); U.refresh();
        });
        const mp = $("#rt-map", v); if (mp) mp.onclick = () => U.openRouteMap(clients.map((x) => x.client));
        const m = $("#rt-more", v); if (m) m.onclick = () => sheet(null, C.opt("edit", "grey", "Editar ruta", "Nombre, zona, días y cobrador", goAttr("rutaForm", { id: r.id })) + C.opt("users", "blue", "Agregar o quitar clientes", "", goAttr("asignarClientes", { kind: "rt", id: r.id })));
      },
    };
  };
  U.openRouteMap = (clients) => {
    const addr = clients.map((c) => [c.address, c.barrio, c.city].filter(Boolean).join(", ")).filter((a) => a && a.length > 3);
    if (!addr.length) { toast("Ningún cliente tiene dirección.", "err"); return; }
    const dest = addr[addr.length - 1]; const way = addr.slice(0, -1).slice(0, 9);
    U.openExternal("https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(dest) + (way.length ? "&waypoints=" + encodeURIComponent(way.join("|")) : ""));
    if (addr.length > 10) toast("Google Maps admite 10 paradas; se abrieron las primeras.");
  };

  /* Ejecutar ruta: visitar en orden y marcar el resultado de cada cliente. */
  S.rutaRun = (p) => {
    const r = G.data.routes.find((x) => x.id === p.id); if (!r || !myRoute(r)) return { redirect: U.back };
    const date = p.date || G.today(); const s = routeStats(r, date); const byC = new Map(s.col.map((x) => [x.clientId, x]));
    const visits = G.data.visits.filter((x) => x.routeId === r.id && x.date === date);
    const lastVisit = (cid) => visits.filter((x) => x.clientId === cid).sort((a, b) => b.at.localeCompare(a.at))[0];
    const clients = (r.clientIds || []).map((id) => G.state().byClient.get(id)).filter(Boolean);
    const done = clients.filter((x) => lastVisit(x.client.id) || (byC.get(x.client.id) || {}).received).length;
    return {
      html: appbar({ back: true, title: r.name, sub: "Ruta · " + G.fmtDateLong(date) }) + `<main class="body">
        <div class="card"><div class="between"><div><div class="kpi-label">Visitados</div><div class="strong">${done} de ${clients.length}</div></div><div style="text-align:right"><div class="kpi-label">Recaudado / esperado</div><div class="strong tnum"><span class="green">${money(s.received)}</span> / ${money(s.expected)}</div></div></div><div style="margin-top:10px">${C.progress(clients.length ? done / clients.length : 0, "blue")}</div></div>
        <div class="list">${clients.map((x, i) => { const c = x.client; const col = byC.get(c.id); const vis = lastVisit(c.id);
          const stKey = col && col.received > 0 ? (col.pending > 0 ? "pago_parcial" : "pago_total") : vis ? vis.result : "pendiente";
          const tone = stKey === "pago_total" ? "green" : stKey === "pago_parcial" ? "amber" : stKey === "pendiente" ? "grey" : "red";
          const loan = x.loans.find((l) => l.status !== "finalizado");
          return `<div class="item" style="align-items:flex-start"><span class="lead-ico t-${tone}" style="font-weight:700">${i + 1}</span><div class="grow">
            <div class="name">${esc(c.name)}</div><div class="sub">${esc([c.address, c.barrio].filter(Boolean).join(", ") || "Sin dirección")}</div>
            <div class="sub">${col ? `Cuota ${money(col.owed)}${col.received ? ` · <span class="green">recibió ${money(col.received)}</span>` : ""}` : loan ? "Sin cuota hoy · saldo " + money(x.debt) : "Sin préstamo activo"}</div>
            ${vis && vis.note ? `<div class="sub">${ic("note")}${esc(vis.note)}</div>` : ""}
            <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">${C.badge(tone, U.VISIT[stKey])}
              ${loan && G.can("pago.registrar") ? `<button class="btn sm btn-primary" ${goAttr("pago", { loanId: loan.loan.id, routeId: r.id, date })}>${ic("dollar", "sm")}Pago</button>` : ""}
              ${G.can("visita.registrar") ? `<button class="btn sm btn-soft" data-visit="${c.id}">Marcar</button>` : ""}
              ${c.phone ? `<button class="btn sm btn-ghost" data-call="${esc(c.phone)}" aria-label="Llamar">${ic("phone", "sm")}</button>` : ""}
              ${c.address ? `<button class="btn sm btn-ghost" data-map="${esc([c.address, c.barrio, c.city].filter(Boolean).join(", "))}" aria-label="Mapa">${ic("pin", "sm")}</button>` : ""}</div></div></div>`; }).join("") || C.empty("users", "Ruta sin clientes", "")}</div>
      </main>`,
      bind(v) {
        $$("[data-call]", v).forEach((b) => b.onclick = () => U.openExternal("tel:" + b.dataset.call.replace(/[^\d+]/g, "")));
        $$("[data-map]", v).forEach((b) => b.onclick = () => U.openExternal("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(b.dataset.map)));
        $$("[data-visit]", v).forEach((b) => b.onclick = () => {
          const cid = b.dataset.visit; const c = U.client(cid);
          sheet("Resultado de la visita · " + esc(c.name.split(" ")[0]), `${C.opt("xcircle", "red", "No pagó", "La cuota sigue pendiente", 'data-res="no_pago"')}${C.opt("ban", "grey", "No encontrado", "No estaba en la dirección", 'data-res="no_encontrado"')}${C.opt("clock", "amber", "Visita pendiente", "Volver más tarde", 'data-res="pendiente"')}
            <div class="field" style="margin-top:8px">${ic("note")}<input id="vs-note" maxlength="120" placeholder="Observación (opcional)"></div>`, (sh) => {
            $$("[data-res]", sh).forEach((x) => x.onclick = () => { const note = $("#vs-note", sh).value.trim(); closeLayer(); act(() => G.ops.addVisit({ clientId: cid, routeId: r.id, date, result: x.dataset.res, note }), "Visita registrada"); U.refresh(); });
          });
        });
      },
    };
  };
})();
