/* Pantallas: Clientes (lista, formulario, perfil, estado de cuenta, importar CSV). */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, avatar, plural, goAttr, appbar, act, sheet, closeLayer, confirmBox, alertBox, toast } = U;
  const DOC_TYPES = [["CC", "Cédula de ciudadanía"], ["CE", "Cédula de extranjería"], ["TI", "Tarjeta de identidad"], ["PPT", "Permiso por protección temporal"], ["PAS", "Pasaporte"], ["NIT", "NIT"]];

  // ---------------------------------------------------------------- LISTA
  S.clientes = (p) => {
    const St = G.state(); const vis = G.visibleClientIds();
    const all = St.clients.filter((x) => !vis || vis.has(x.client.id));
    const st = p.st || "todos", sort = p.sort || "nombre", pf = p.pf || "", rt = p.rt || "";
    const count = (k) => all.filter((x) => k === "atrasados" ? x.overdue : x.status === k).length;
    const stOpts = [["todos", "Todos " + all.length], ["aldia", "Al día"], ["pendiente", "Pendientes"], ["mora", "En mora"], ["sinprestamos", "Sin préstamos"], ["inactivo", "Inactivos"], ["atrasados", "Atrasados"]]
      .filter(([k]) => k === "todos" || count(k) || k === st).map(([k, l]) => [k, k === "todos" ? l : l + " " + count(k)]);
    return {
      html: appbar({ title: "Clientes", sub: plural(all.length, "cliente", "clientes"), right: G.can("cliente.editar") ? `<button class="icon-btn" id="cl-menu" aria-label="Opciones">${ic("more")}</button>` : "" }) + `<main class="body pad-bottom">
        <div class="search"><div class="field">${ic("search")}<input id="cq" type="search" placeholder="Nombre, documento o teléfono" value="${esc(p.q || "")}" autocomplete="off"></div></div>
        ${C.chips("st", stOpts, st)}
        <div class="toolbar">
          <select class="select-sm" id="cf-sort" aria-label="Ordenar">${[["nombre", "Ordenar: nombre"], ["deuda", "Ordenar: deuda"], ["venc", "Ordenar: vencimiento"]].map(([v, l]) => `<option value="${v}" ${v === sort ? "selected" : ""}>${l}</option>`).join("")}</select>
          ${G.data.portfolios.length ? `<select class="select-sm" id="cf-pf" aria-label="Cartera"><option value="">Cartera: todas</option>${G.data.portfolios.map((x) => `<option value="${x.id}" ${x.id === pf ? "selected" : ""}>${esc(x.name)}</option>`).join("")}<option value="-" ${pf === "-" ? "selected" : ""}>Sin cartera</option></select>` : ""}
          ${G.data.routes.length ? `<select class="select-sm" id="cf-rt" aria-label="Ruta"><option value="">Ruta: todas</option>${G.data.routes.map((x) => `<option value="${x.id}" ${x.id === rt ? "selected" : ""}>${esc(x.name)}</option>`).join("")}<option value="-" ${rt === "-" ? "selected" : ""}>Sin ruta</option></select>` : ""}
        </div>
        <div id="clist"></div>
        ${G.can("cliente.editar") ? `<div class="sticky-cta" style="bottom:calc(64px + var(--safe-bottom));background:transparent;border:0;padding-bottom:12px;pointer-events:none;justify-content:flex-end"><button class="fab" style="pointer-events:auto" ${goAttr("clienteForm", {})} aria-label="Nuevo cliente">${ic("plus")}</button></div>` : ""}
      </main>`,
      bind(v) {
        const draw = () => {
          const q = $("#cq", v).value.trim().toLowerCase(); const qd = q.replace(/\D/g, "");
          U.cur().params.q = $("#cq", v).value;
          let rows = all;
          if (st === "atrasados") rows = rows.filter((x) => x.overdue); else if (st !== "todos") rows = rows.filter((x) => x.status === st);
          if (pf) rows = rows.filter((x) => pf === "-" ? !x.client.portfolioId : x.client.portfolioId === pf);
          if (rt) rows = rows.filter((x) => rt === "-" ? !x.route : x.route && x.route.id === rt);
          if (q) rows = rows.filter((x) => x.client.name.toLowerCase().includes(q) || (qd.length >= 3 && [x.client.doc, x.client.phone, x.client.phone2].some((s) => String(s || "").replace(/\D/g, "").includes(qd))));
          if (sort === "deuda") rows = rows.slice().sort((a, b) => b.debt - a.debt);
          if (sort === "venc") rows = rows.slice().sort((a, b) => (a.next ? a.next.date : "9999").localeCompare(b.next ? b.next.date : "9999"));
          $("#clist", v).innerHTML = rows.length ? `<div class="list">${rows.slice(0, 300).map((x) => `<button class="item" ${goAttr("cliente", { id: x.client.id })}>${avatar(x.client)}
            <div class="grow"><div class="name">${esc(x.client.name)}</div><div class="sub">${esc([x.client.phone, x.client.doc ? (x.client.docType || "CC") + " " + x.client.doc : ""].filter(Boolean).join(" · ") || "Sin datos de contacto")}</div></div>
            <div class="right">${x.debt > 0 ? `<span class="amount">${money(x.debt)}</span>` : ""}${U.clientBadge(x)}</div></button>`).join("")}</div>${rows.length > 300 ? `<p class="hint center">Mostrando 300 de ${rows.length}. Usa el buscador.</p>` : ""}`
            : all.length ? C.empty("search", "Sin resultados", "Prueba con otro nombre o quita los filtros.")
            : C.empty("users", "Todavía no hay clientes", "Registra tu primer cliente. Solo el nombre es obligatorio.", G.can("cliente.editar") ? `<button class="btn btn-primary" ${goAttr("clienteForm", {})}>${ic("plus")}Nuevo cliente</button>` : "");
        };
        $("#cq", v).oninput = draw;
        $$("[data-st]", v).forEach((b) => b.onclick = () => U.setParam({ st: b.dataset.st }, true));
        $("#cf-sort", v).onchange = (e) => U.setParam({ sort: e.target.value }, true);
        const a = $("#cf-pf", v); if (a) a.onchange = (e) => U.setParam({ pf: e.target.value }, true);
        const b = $("#cf-rt", v); if (b) b.onchange = (e) => U.setParam({ rt: e.target.value }, true);
        const m = $("#cl-menu", v); if (m) m.onclick = () => sheet(null, C.opt("plus", "blue", "Nuevo cliente", "", goAttr("clienteForm", {})) + C.opt("import", "violet", "Importar clientes desde CSV", "Desde Excel, con vista previa", goAttr("importar")) + (G.can("ver.reportes") ? C.opt("download", "green", "Exportar clientes (CSV)", "", goAttr("reportes", { tipo: "clientes" })) : ""));
        draw();
      },
    };
  };

  // ---------------------------------------------------------------- FORMULARIO
  S.clienteForm = (p) => {
    if (!G.can("cliente.editar")) return { html: appbar({ back: true, title: "Cliente" }) + `<main class="body">${C.empty("lock", "Sin permiso", "Tu usuario no puede crear ni editar clientes.")}</main>` };
    const c = p.id ? JSON.parse(JSON.stringify(U.client(p.id) || {})) : (p.draft || { docType: "CC", refs: [] });
    const refs = c.refs && c.refs.length ? c.refs : [];
    const pfOpts = [["", "Sin cartera"]].concat(G.data.portfolios.filter((x) => x.status !== "archivada" || x.id === c.portfolioId).map((x) => [x.id, x.name]));
    const refRow = (r, i) => `<div class="card stack" style="padding:10px" data-ref="${i}"><div class="between"><b class="small">Referencia ${i + 1}</b><button type="button" class="icon-btn" data-rmref="${i}" aria-label="Quitar referencia">${ic("x")}</button></div>
      <div class="field"><input data-rf="name" placeholder="Nombre" value="${esc(r.name || "")}" maxlength="60"></div><div class="grid2"><div class="field"><input data-rf="phone" type="tel" placeholder="Teléfono" value="${esc(r.phone || "")}" maxlength="20"></div><div class="field"><input data-rf="relation" placeholder="Parentesco" value="${esc(r.relation || "")}" maxlength="30"></div></div></div>`;
    const hasMore = c.phone2 || c.barrio || c.city || c.email || refs.length || c.notes;
    return {
      html: appbar({ back: true, title: p.id ? "Editar cliente" : "Nuevo cliente" }) + `<main class="body pad-bottom"><form class="form" id="cf" novalidate>
        <div class="photo-pick"><button type="button" class="avatar-btn" id="cf-photo" aria-label="Agregar fotografía">${c.photo ? `<img src="${c.photo}" alt="">` : ic("camera")}</button>
          <div><h3>${p.id ? esc(c.name) : "Datos del cliente"}</h3><p>Solo el nombre es obligatorio. Lo demás puedes completarlo después.</p>${c.photo ? '<button type="button" class="link-btn" id="cf-nophoto" style="padding:4px 0;color:var(--red)">Quitar foto</button>' : ""}</div></div>
        <input type="file" id="cf-file" accept="image/*" hidden>
        ${C.field({ id: "name", label: "Nombre completo", icon: "user", value: c.name, req: true, attrs: 'maxlength="60" autocapitalize="words" autocomplete="off"' })}
        <div class="grid2" style="grid-template-columns:120px 1fr">${C.select({ id: "docType", label: "Tipo", options: DOC_TYPES.map(([v]) => [v, v]), value: c.docType || "CC" })}${C.field({ id: "doc", label: "Número de documento", value: c.doc, attrs: 'inputmode="numeric" maxlength="20"' })}</div>
        ${C.field({ id: "phone", label: "Teléfono principal", icon: "phone", value: c.phone, type: "tel", attrs: 'maxlength="20"' })}
        ${C.field({ id: "address", label: "Dirección", icon: "pin", value: c.address, attrs: 'maxlength="100"' })}
        ${G.data.portfolios.length ? C.select({ id: "portfolioId", label: "Cartera", icon: "folder", options: pfOpts, value: c.portfolioId || "" }) : ""}
        <details class="more" ${hasMore ? "open" : ""}><summary>Más datos (opcional) ${ic("chevdown")}</summary><div>
          ${C.field({ id: "phone2", label: "Teléfono secundario", icon: "phone", value: c.phone2, type: "tel", attrs: 'maxlength="20"' })}
          <div class="grid2">${C.field({ id: "barrio", label: "Barrio", value: c.barrio, attrs: 'maxlength="50"' })}${C.field({ id: "city", label: "Ciudad", value: c.city, attrs: 'maxlength="50"' })}</div>
          ${C.field({ id: "email", label: "Correo electrónico", icon: "mail", value: c.email, type: "email", attrs: 'maxlength="80" autocapitalize="none"' })}
          <div id="cf-refs" class="stack" style="gap:8px">${refs.map(refRow).join("")}</div>
          <button type="button" class="btn btn-soft" id="cf-addref">${ic("plus")}Agregar referencia personal</button>
          ${C.textarea({ id: "notes", icon: "note", value: c.notes, placeholder: "Observaciones: negocio, quién lo recomendó…" })}
        </div></details>
        <p class="error" id="cf-err"></p>
        <div class="sticky-cta"><button class="btn btn-primary" type="submit" id="cf-save">${ic("check")}${p.id ? "Guardar cambios" : "Guardar cliente"}</button></div>
      </form></main>`,
      bind(v) {
        let photo = c.photo || null;
        $("#cf-photo", v).onclick = () => $("#cf-file", v).click();
        const np = $("#cf-nophoto", v); if (np) np.onclick = () => { photo = null; $("#cf-photo", v).innerHTML = ic("camera"); np.remove(); };
        $("#cf-file", v).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { photo = await U.fileToDataUrl(f, 320); $("#cf-photo", v).innerHTML = `<img src="${photo}" alt="">`; } catch (er) { toast("No se pudo leer la imagen.", "err"); } };
        const readRefs = () => $$("[data-ref]", v).map((el) => ({ name: $('[data-rf="name"]', el).value.trim(), phone: $('[data-rf="phone"]', el).value.trim(), relation: $('[data-rf="relation"]', el).value.trim() })).filter((r) => r.name || r.phone);
        const redrawRefs = (list) => { $("#cf-refs", v).innerHTML = list.map(refRow).join(""); $$("[data-rmref]", v).forEach((b) => b.onclick = () => { const l = readRefs(); l.splice(+b.dataset.rmref, 1); redrawRefs(l); }); };
        redrawRefs(refs);
        $("#cf-addref", v).onclick = () => { const l = readRefs(); if (l.length >= 3) { toast("Máximo 3 referencias."); return; } l.push({}); redrawRefs(l); };
        $("#cf", v).onsubmit = (e) => {
          e.preventDefault();
          const val = (k) => { const el = $("#" + k, v); return el ? el.value.trim().replace(/\s+/g, " ") : undefined; };
          const o = { id: p.id, name: val("name"), docType: val("docType"), doc: val("doc"), phone: val("phone"), address: val("address"), phone2: val("phone2"), barrio: val("barrio"), city: val("city"), email: val("email"), notes: $("#notes", v).value.trim(), photo, refs: readRefs() };
          if ($("#portfolioId", v)) o.portfolioId = val("portfolioId") || null;
          const errs = G.validateClient(o);
          if (!U.fieldErrors(v, errs)) { if (errs.email || errs.phone2) $("details.more", v).open = true; return; }
          const pfChange = p.id && "portfolioId" in o && (U.client(p.id).portfolioId || null) !== o.portfolioId;
          if (pfChange) { const pid = o.portfolioId; delete o.portfolioId; if (!act(() => G.ops.assignPortfolio([p.id], pid))) return; }
          const saved = act(() => G.ops.saveClient(o), p.id ? "Cliente actualizado" : "Cliente guardado");
          if (!saved) return;
          if (p.id) U.back(); else if (p.thenLoan) U.go("prestamoForm", { clientId: saved.id }, true); else U.go("cliente", { id: saved.id }, true);
        };
      },
    };
  };

  // ---------------------------------------------------------------- PERFIL
  S.cliente = (p) => {
    const x = G.state().byClient.get(p.id);
    if (!x || !G.canSeeClient(p.id)) return { redirect: U.back };
    const c = x.client; const tab = p.t || "resumen";
    const ids = new Set(x.loans.map((l) => l.loan.id));
    const pays = G.data.payments.filter((pp) => ids.has(pp.loanId)).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    const inactive = c.status === "inactivo" || c.status === "archivado";
    let content = "";
    if (tab === "resumen") {
      content = C.kv([["Estado", U.clientBadge(x)], ["Saldo pendiente", `<span class="${x.overdue ? "red" : ""}">${money(x.debt)}</span>`], ["Capital pendiente", money(x.loans.reduce((s, l) => s + l.capitalPending, 0))],
        ["Total prestado", money(x.lent)], ["Total pagado", `<span class="green">${money(x.paid)}</span>`], ["Préstamos", `${x.loans.filter((l) => l.status !== "finalizado").length} activos · ${x.loans.length} en total`],
        ["Próximo vencimiento", x.next ? `${G.fmtDate(x.next.date)} · ${money(x.next.remaining)}` : "—"], ["Cartera", x.portfolio ? esc(x.portfolio.name) : "—"], ["Ruta", x.route ? esc(x.route.name) : "—"]])
        + C.kv([c.doc && ["Documento", esc((c.docType || "CC") + " " + c.doc)], c.phone2 && ["Teléfono 2", esc(c.phone2)], (c.barrio || c.city) && ["Barrio / ciudad", esc([c.barrio, c.city].filter(Boolean).join(", "))], c.email && ["Correo", esc(c.email)], ["Cliente desde", G.fmtDate(c.createdAt)]])
        + ((c.refs || []).length ? C.section("Referencias", "", `<div class="list">${c.refs.map((r) => `<div class="item compact"><span class="lead-ico">${ic("user")}</span><div class="grow"><div class="name">${esc(r.name)}</div><div class="sub">${esc([r.relation, r.phone].filter(Boolean).join(" · "))}</div></div>${r.phone ? `<button class="icon-btn" data-tel="${esc(r.phone)}" aria-label="Llamar">${ic("phone")}</button>` : ""}</div>`).join("")}</div>`) : "")
        + (c.notes ? C.section("Observaciones", "", `<div class="card" style="white-space:pre-wrap">${esc(c.notes)}</div>`) : "");
    } else if (tab === "prestamos") {
      content = x.loans.length ? `<div class="list">${x.loans.slice().reverse().map((st) => U.loanRow(st, true)).join("")}</div>` : C.empty("layers", "Sin préstamos", "Este cliente aún no tiene préstamos.");
    } else if (tab === "pagos") {
      content = pays.length ? `<div class="list">${pays.map((pp) => { const st = G.state().byLoan.get(pp.loanId);
        return pp.amount > 0 ? `<button class="item" data-pay="${pp.id}"><span class="lead-ico ${pp.voided ? "t-grey" : "t-green"}">${ic(pp.voided ? "ban" : "down")}</span><div class="grow"><div class="name">${money(pp.amount)}${pp.voided ? " · anulado" : ""}</div><div class="sub">${G.fmtDate(pp.date)} · #${st.loan.num} · ${esc(pp.method || "")}</div></div>${pp.receiptNo ? `<span class="xs muted">${pp.receiptNo}</span>` : ""}</button>`
        : `<div class="item"><span class="lead-ico t-red">${ic("x")}</span><div class="grow"><div class="name">No pagó</div><div class="sub">${G.fmtDate(pp.date)} · #${st.loan.num}${pp.note ? " · " + esc(pp.note) : ""}</div></div></div>`; }).join("")}</div>`
        : C.empty("coins", "Sin pagos", "Aún no hay pagos registrados.");
    } else {
      const ev = G.data.audit.filter((a) => a.ref === c.id || (a.entity === "pago" && pays.some((q) => q.id === a.ref)) || (a.entity === "prestamo" && ids.has(a.ref)));
      const vs = G.data.visits.filter((q) => q.clientId === c.id).map((q) => ({ at: q.at, user: q.user, action: "visita", detail: U.VISIT[q.result] + (q.note ? " · " + q.note : "") }));
      const all = ev.concat(vs.filter((q) => !ev.some((a) => a.action === "visita" && a.at === q.at))).sort((a, b) => b.at.localeCompare(a.at));
      content = all.length ? `<div class="card timeline">${all.slice(0, 100).map((a) => `<div class="ev"><span class="lead-ico">${ic(a.action === "editar" ? "edit" : a.action === "pago" ? "dollar" : a.action === "anular" ? "ban" : a.action === "visita" ? "pin" : "history")}</div><div class="grow"><div class="strong">${esc(a.action[0].toUpperCase() + a.action.slice(1))} ${a.entity && a.entity !== "cliente" ? "· " + esc(a.entity) : ""}</div>
        ${(a.changes || []).map((ch) => `<div class="small"><span class="muted">${esc(ch.label)}:</span> <s class="muted">${esc(fmtVal(ch.from))}</s> → ${esc(fmtVal(ch.to))}</div>`).join("") || `<div class="small muted">${esc(a.detail || "")}</div>`}
        <div class="when">${G.fmtDate(a.at.slice(0, 10))} ${a.at.slice(11, 16)} · ${esc(a.user || "")}</div></div></div>`).join("")}</div>` : C.empty("history", "Sin historial", "Aquí verás cada cambio, pago y visita.");
    }
    const canEdit = G.can("cliente.editar");
    return {
      html: appbar({ back: true, title: "Cliente", right: (canEdit ? `<button class="icon-btn" ${goAttr("clienteForm", { id: c.id })} aria-label="Editar cliente">${ic("edit")}</button>` : "") + `<button class="icon-btn" id="cl-more" aria-label="Más acciones">${ic("more")}</button>` }) + `<main class="body pad-bottom">
        <div class="profile">${avatar(c, "lg")}<div class="grow"><h2>${esc(c.name)}</h2>
          ${c.phone ? `<div class="line">${ic("phone")}${esc(c.phone)}</div>` : ""}${c.address ? `<div class="line">${ic("pin")}${esc(c.address)}${c.barrio ? ", " + esc(c.barrio) : ""}</div>` : ""}
          <div style="margin-top:6px">${U.clientBadge(x)}</div></div></div>
        ${inactive ? C.alert("warn", "archive", "Cliente " + (c.status === "archivado" ? "archivado" : "inactivo"), "Se conservan sus préstamos y pagos. No se le pueden crear préstamos nuevos hasta reactivarlo (menú ⋮).") : ""}
        <div class="actions">
          <button class="act" id="a-call" ${c.phone ? "" : "disabled"}>${ic("phone")}Llamar</button>
          <button class="act wa" id="a-wa" ${c.phone ? "" : "disabled"}>${ic("whatsapp")}WhatsApp</button>
          <button class="act" id="a-map" ${c.address ? "" : "disabled"}>${ic("pin")}Ubicación</button>
          <button class="act" ${x.loans.length ? goAttr("estado", { id: c.id }) : "disabled"}>${ic("file")}Estado</button></div>
        ${C.tabs("t", [["resumen", "Resumen"], ["prestamos", `Préstamos (${x.loans.length})`], ["pagos", "Pagos"], ["historial", "Historial"]], tab)}
        ${content}
        <div class="sticky-cta">${x.active && G.can("pago.registrar") ? `<button class="btn btn-soft" id="cl-pay">${ic("dollar")}Registrar pago</button>` : ""}${G.can("prestamo.crear") && !inactive ? `<button class="btn btn-primary" ${goAttr("prestamoForm", { clientId: c.id })}>${ic("plus")}Préstamo</button>` : ""}</div>
      </main>`,
      bind(v) {
        $$("[data-t]", v).forEach((b) => b.onclick = () => U.setParam({ t: b.dataset.t }, true));
        $$("[data-tel]", v).forEach((b) => b.onclick = () => U.openExternal("tel:" + b.dataset.tel.replace(/[^\d+]/g, "")));
        if (c.phone) { $("#a-call", v).onclick = () => U.openExternal("tel:" + c.phone.replace(/[^\d+]/g, "")); $("#a-wa", v).onclick = () => U.openExternal("https://wa.me/" + U.waNumber(c.phone)); }
        if (c.address) $("#a-map", v).onclick = () => U.openExternal("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([c.address, c.barrio, c.city].filter(Boolean).join(", ")));
        const pb = $("#cl-pay", v); if (pb) pb.onclick = () => U.pickLoanSheet(c.id);
        U.bindMovRows(v);
        $("#cl-more", v).onclick = () => sheet(null, `
          ${x.debt > 0 && G.can("pago.registrar") ? C.opt("whatsapp", "green", "Enviar recordatorio de pago", "Cuánto debe, próxima cuota y vencido", 'id="so-remind"') : ""}
          ${x.loans.length ? C.opt("file", "blue", "Estado de cuenta", "Ver, exportar PDF o enviar", goAttr("estado", { id: c.id })) : ""}
          ${canEdit ? C.opt("edit", "blue", "Editar cliente", "", goAttr("clienteForm", { id: c.id })) : ""}
          ${G.can("cartera.gestionar") && G.data.portfolios.length ? C.opt("folder", "violet", "Cambiar de cartera", x.portfolio ? "Actual: " + esc(x.portfolio.name) : "Sin cartera", 'id="so-pf"') : ""}
          ${canEdit ? (inactive ? C.opt("checkcircle", "green", "Reactivar cliente", "", 'id="so-act"') : C.opt("archive", "amber", x.loans.length ? "Desactivar / archivar" : "Desactivar cliente", "Se conserva todo su historial", 'id="so-arch"')) : ""}
          ${canEdit && !x.loans.length ? C.opt("trash", "red", "Eliminar cliente", "Solo es posible porque no tiene operaciones", 'id="so-del"') : ""}`, (s) => {
          const r = $("#so-remind", s); if (r) r.onclick = () => { closeLayer(); U.sendReminder(c.id); };
          const a = $("#so-act", s); if (a) a.onclick = () => { closeLayer(); act(() => G.ops.setClientStatus(c.id, "activo"), "Cliente reactivado"); U.refresh(); };
          const ar = $("#so-arch", s); if (ar) ar.onclick = () => sheet("Desactivar cliente", C.opt("ban", "amber", "Inactivo", "Temporalmente sin operaciones", 'data-sv="inactivo"') + C.opt("archive", "grey", "Archivado", "Ya no trabaja contigo; se guarda su historial", 'data-sv="archivado"'), (s2) => {
            $$("[data-sv]", s2).forEach((b) => b.onclick = () => { closeLayer(); act(() => G.ops.setClientStatus(c.id, b.dataset.sv), "Estado actualizado"); U.refresh(); });
          });
          const pf = $("#so-pf", s); if (pf) pf.onclick = () => U.pickPortfolio(c.portfolioId, (id) => { act(() => G.ops.assignPortfolio([c.id], id), "Cartera actualizada"); U.refresh(); });
          const d = $("#so-del", s); if (d) d.onclick = async () => { closeLayer(); if (await confirmBox("¿Eliminar cliente?", "Se borrarán sus datos. No tiene préstamos ni pagos. No se puede deshacer.", "Eliminar", true)) { if (act(() => G.ops.deleteClient(c.id), "Cliente eliminado")) U.root("clientes"); } };
        });
      },
    };
  };
  function fmtVal(v) { if (v == null || v === "") return "(vacío)"; if (Array.isArray(v)) return v.map((r) => r.name || "").filter(Boolean).join(", ") || "(vacío)"; return String(v); }

  /* Selector de cartera (hoja). */
  U.pickPortfolio = (current, cb) => {
    sheet("Elegir cartera", `<div class="list">${[{ id: "", name: "Sin cartera" }].concat(G.data.portfolios.filter((p) => p.status !== "archivada")).map((p) => `<button class="item" data-pid="${p.id}"><span class="color-dot" style="background:${p.color || "var(--border-2)"}"></span><div class="grow"><div class="name">${esc(p.name)}</div></div>${(current || "") === p.id ? ic("check", "blue") : ""}</button>`).join("")}</div>`, (s) => {
      $$("[data-pid]", s).forEach((b) => b.onclick = () => { closeLayer(); cb(b.dataset.pid || null); });
    });
  };

  // ---------------------------------------------------------------- ESTADO DE CUENTA
  S.estado = (p) => {
    const xS = G.state().byClient.get(p.id);
    if (!xS) return { redirect: U.back };
    return {
      html: appbar({ back: true, title: "Estado de cuenta", sub: xS.client.name }) + `<main class="body pad-bottom"><div class="loading" id="ec-load"></div><img class="receipt-img" id="ec-img" alt="Estado de cuenta de ${esc(xS.client.name)}" hidden>
        <div class="sticky-cta"><button class="btn btn-soft" id="ec-pdf">${ic("file")}PDF</button><button class="btn btn-wa" id="ec-send">${ic("whatsapp")}Enviar</button></div></main>`,
      bind(v) {
        setTimeout(() => { const cv = window.Docs.statementCanvas(p.id); $("#ec-img", v).src = cv.toDataURL("image/png"); $("#ec-img", v).hidden = false; $("#ec-load", v).remove(); }, 30);
        $("#ec-send", v).onclick = () => window.Docs.sendStatement(p.id);
        $("#ec-pdf", v).onclick = () => window.Docs.sharePDF(window.Docs.statementCanvas(p.id), `Estado_de_cuenta_${xS.client.name.replace(/\s+/g, "_")}_${G.today()}`, "Estado de cuenta");
      },
    };
  };

  // ---------------------------------------------------------------- IMPORTAR CSV
  const COLS = { name: ["nombre", "nombre completo", "cliente"], docType: ["tipo", "tipo documento", "tipo de documento"], doc: ["documento", "cedula", "cédula", "numero documento", "número de documento", "cc"], phone: ["telefono", "teléfono", "celular", "telefono principal"], phone2: ["telefono 2", "teléfono 2", "telefono secundario"], address: ["direccion", "dirección"], barrio: ["barrio"], city: ["ciudad", "municipio"], email: ["correo", "email", "correo electronico"], notes: ["observaciones", "notas"] };
  S.importar = (p) => {
    const rows = p.rows || null;
    return {
      html: appbar({ back: true, title: "Importar clientes" }) + `<main class="body pad-bottom">
        ${!rows ? `<div class="card stack"><p class="hint">Sube un archivo <b>CSV</b> (en Excel: Archivo → Guardar como → CSV). La primera fila debe tener los títulos. Columnas reconocidas: <b>Nombre</b> (obligatoria), Tipo documento, Documento, Teléfono, Teléfono 2, Dirección, Barrio, Ciudad, Correo, Observaciones.</p>
          <button class="btn btn-primary" id="im-pick">${ic("upload")}Elegir archivo CSV</button><button class="btn btn-soft" id="im-tpl">${ic("download")}Descargar plantilla</button><input type="file" id="im-file" accept=".csv,text/csv,text/plain" hidden></div>`
        : (() => { const ok = rows.filter((r) => !r.err.length), bad = rows.filter((r) => r.err.length);
          return `${C.kv([["Filas leídas", rows.length], ["Listas para importar", `<span class="green">${ok.length}</span>`], ["Con errores (no se importan)", `<span class="${bad.length ? "red" : ""}">${bad.length}</span>`]])}
            <div class="list">${rows.slice(0, 200).map((r) => `<div class="item compact"><span class="lead-ico ${r.err.length ? "t-red" : "t-green"}">${ic(r.err.length ? "alert" : "check")}</span><div class="grow"><div class="name">${esc(r.c.name || "(sin nombre)")}</div><div class="sub">${r.err.length ? `<span class="red">${esc(r.err.join(" "))}</span>` : esc([r.c.doc, r.c.phone, r.c.city].filter(Boolean).join(" · "))}</div></div><span class="xs muted">fila ${r.line}</span></div>`).join("")}</div>
            <div class="sticky-cta"><button class="btn btn-soft" id="im-cancel">Cancelar</button><button class="btn btn-primary" id="im-go" ${ok.length ? "" : "disabled"}>${ic("check")}Importar ${ok.length}</button></div>`; })()}
      </main>`,
      bind(v) {
        if (!rows) {
          $("#im-pick", v).onclick = () => $("#im-file", v).click();
          $("#im-tpl", v).onclick = () => U.shareFile("plantilla_clientes.csv", U.toCSV(["Nombre", "Tipo documento", "Documento", "Teléfono", "Teléfono 2", "Dirección", "Barrio", "Ciudad", "Correo", "Observaciones"], [["Ana Pérez", "CC", "1020304050", "3001234567", "", "Cra 1 # 2-3", "Centro", "Medellín", "", ""]]), "text/csv", "Plantilla");
          $("#im-file", v).onchange = async (e) => {
            const f = e.target.files[0]; e.target.value = ""; if (!f) return;
            const data = U.parseCSV(await f.text()); if (data.length < 2) { toast("El archivo no tiene filas.", "err"); return; }
            const head = data[0].map((h) => h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
            const idx = {}; Object.entries(COLS).forEach(([k, names]) => { const i = head.findIndex((h) => names.map((n) => n.normalize("NFD").replace(/[̀-ͯ]/g, "")).includes(h)); if (i >= 0) idx[k] = i; });
            if (idx.name == null) { alertBox("Falta la columna Nombre", "La primera fila debe tener un título «Nombre»."); return; }
            const seen = new Set(); const out = [];
            data.slice(1).forEach((r, i) => {
              const c = {}; Object.entries(idx).forEach(([k, j]) => { c[k] = String(r[j] || "").trim(); });
              if (c.docType) c.docType = c.docType.toUpperCase(); else if (c.doc) c.docType = "CC";
              const err = Object.values(G.validateClient(c));
              const key = c.doc ? (c.docType + c.doc.replace(/\D/g, "")) : null;
              if (key && seen.has(key)) err.push("Documento repetido en el archivo."); if (key) seen.add(key);
              out.push({ c, err, line: i + 2 });
            });
            U.setParam({ rows: out });
          };
        } else {
          $("#im-cancel", v).onclick = () => U.setParam({ rows: null });
          $("#im-go", v).onclick = () => { const ok = rows.filter((r) => !r.err.length).map((r) => r.c); const n = act(() => G.ops.importClients(ok)); if (n) { toast(plural(n, "cliente importado", "clientes importados"), "ok"); U.root("clientes"); } };
        }
      },
    };
  };
})();
