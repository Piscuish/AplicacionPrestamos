/* Pantallas: Préstamos (lista, nuevo préstamo con simulación, detalle y tabla de amortización). */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, avatar, plural, goAttr, appbar, act, sheet, closeLayer, confirmBox, promptBox, toast, fmtIn } = U;

  U.loanRow = (st, hideName) => {
    const cl = U.client(st.loan.clientId);
    return `<button class="item" ${goAttr("prestamo", { id: st.loan.id })}>${hideName ? `<span class="lead-ico t-blue">${ic("layers")}</span>` : avatar(cl)}
      <div class="grow"><div class="name">${hideName ? "#" + st.loan.num + " · " + money(st.loan.amount) : esc(cl ? cl.name : "")}</div>
      <div class="sub">${hideName ? G.fmtDate(st.loan.startDate) : "#" + st.loan.num + " · " + money(st.loan.amount)} · ${st.paidCount}/${st.loan.count} cuotas</div></div>
      <div class="right">${st.status === "finalizado" ? "" : `<span class="amount">${money(st.balance)}</span>`}${U.loanBadge(st)}</div></button>`;
  };

  // ---------------------------------------------------------------- LISTA
  S.prestamos = (p) => {
    const vis = G.visibleClientIds();
    const all = G.state().loans.filter((x) => !vis || vis.has(x.loan.clientId));
    const f = p.f || "activos", pf = p.pf || "";
    const groups = {
      activos: (x) => x.status !== "finalizado", vencido: (x) => x.status === "vencido", porfinalizar: (x) => x.status !== "finalizado" && x.loan.count - x.paidCount <= 1,
      finalizado: (x) => x.status === "finalizado", todos: () => true,
    };
    let rows = all.filter(groups[f] || groups.activos);
    if (pf) rows = rows.filter((x) => pf === "-" ? !x.loan.portfolioId : x.loan.portfolioId === pf);
    rows.sort((a, b) => (a.next ? a.next.date : "9999").localeCompare(b.next ? b.next.date : "9999") || b.loan.createdAt.localeCompare(a.loan.createdAt));
    const n = (k) => all.filter(groups[k]).length;
    const tot = rows.reduce((s, x) => s + x.balance, 0);
    return {
      html: appbar({ back: U.stack.length > 1, title: "Préstamos", sub: plural(rows.length, "préstamo", "préstamos") + (tot ? " · saldo " + money(tot) : ""), right: G.can("prestamo.crear") ? `<button class="icon-btn" ${goAttr("prestamoForm", {})} aria-label="Nuevo préstamo">${ic("plus")}</button>` : "" }) + `<main class="body">
        ${C.chips("f", [["activos", "Activos " + n("activos")], ["vencido", "Vencidos " + n("vencido")], ["porfinalizar", "Por finalizar " + n("porfinalizar")], ["finalizado", "Finalizados " + n("finalizado")], ["todos", "Todos"]], f)}
        ${G.data.portfolios.length ? `<div class="toolbar"><select class="select-sm" id="lp-pf"><option value="">Cartera: todas</option>${G.data.portfolios.map((x) => `<option value="${x.id}" ${x.id === pf ? "selected" : ""}>${esc(x.name)}</option>`).join("")}<option value="-" ${pf === "-" ? "selected" : ""}>Sin cartera</option></select></div>` : ""}
        ${rows.length ? `<div class="list">${rows.map((st) => U.loanRow(st)).join("")}</div>` : C.empty("layers", all.length ? "No hay préstamos en esta lista" : "Todavía no hay préstamos", "", !all.length && G.can("prestamo.crear") ? `<button class="btn btn-primary" ${goAttr("prestamoForm", {})}>${ic("plus")}Nuevo préstamo</button>` : "")}
      </main>`,
      bind(v) { $$("[data-f]", v).forEach((b) => b.onclick = () => U.setParam({ f: b.dataset.f }, true)); const s = $("#lp-pf", v); if (s) s.onchange = (e) => U.setParam({ pf: e.target.value }, true); },
    };
  };

  // ---------------------------------------------------------------- NUEVO PRÉSTAMO
  S.prestamoForm = (p) => {
    if (!G.can("prestamo.crear")) return { html: appbar({ back: true, title: "Nuevo préstamo" }) + `<main class="body">${C.empty("lock", "Sin permiso", "Tu usuario no puede crear préstamos.")}</main>` };
    const clients = G.data.clients.filter((c) => c.status !== "inactivo" && c.status !== "archivado").sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!clients.length) return { html: appbar({ back: true, title: "Nuevo préstamo" }) + `<main class="body">${C.empty("users", "Primero registra al cliente", "El préstamo necesita un cliente.", `<button class="btn btn-primary" ${goAttr("clienteForm", { thenLoan: true })}>${ic("plus")}Nuevo cliente</button>`)}</main>` };
    const def = G.data.settings.defaultInterestMode || "flat";
    const d = p.draft || { clientId: p.clientId || "", amount: "", rate: 10, mode: def, count: 4, freq: "semanal", start: G.today(), first: "", method: "Efectivo", notes: "" };
    const c0 = d.clientId && U.client(d.clientId);
    if (!d.pfTouched && c0) d.portfolioId = c0.portfolioId || "";
    const L = G.data.settings.legal || {};
    return {
      html: appbar({ back: true, title: "Nuevo préstamo" }) + `<main class="body pad-bottom"><form class="form" id="lf" novalidate>
        ${C.select({ id: "lf-client", label: "Cliente", icon: "user", req: true, options: [["", "Selecciona un cliente…"]].concat(clients.map((c) => [c.id, c.name])), value: d.clientId })}
        <button type="button" class="h-link" style="align-self:flex-start;margin-top:-10px" id="lf-newc">+ Registrar cliente nuevo</button>
        ${G.data.portfolios.length ? C.select({ id: "lf-pf", label: "Cartera", icon: "folder", options: [["", "Sin cartera"]].concat(G.data.portfolios.filter((x) => x.status !== "archivada").map((x) => [x.id, x.name])), value: d.portfolioId || "" }) : ""}
        <div class="fieldset-title">Condiciones</div>
        ${C.field({ id: "lf-amount", label: "Capital prestado", icon: "dollar", value: d.amount, money: true, req: true })}
        ${C.seg("mode", Object.entries(G.INTEREST_MODES).map(([k, m]) => [k, m.label]), d.mode, "two")}
        <div class="grid2">${C.field({ id: "lf-rate", label: d.mode === "mensual" ? "Interés mensual" : "Interés total", value: d.rate, suffix: "%", req: true, attrs: 'inputmode="decimal" maxlength="6"' })}
          ${C.field({ id: "lf-count", label: "Número de cuotas", value: d.count, req: true, attrs: 'inputmode="numeric" maxlength="3"', suffix: '<span id="lf-unit"></span>' })}</div>
        ${C.seg("freq", Object.entries(G.FREQ).map(([k, f]) => [k, f.label]), d.freq, "four")}
        <div class="grid2">${C.field({ id: "lf-start", label: "Fecha de entrega", type: "date", value: d.start })}${C.field({ id: "lf-first", label: "Primer pago (opcional)", type: "date", value: d.first })}</div>
        <p class="hint">${esc(U.noPayText())} Las cuotas que caigan en esos días se corren al siguiente día de cobro.</p>
        <div class="fieldset-title">Simulación</div>
        <div id="lf-calc"></div>
        <details class="more"><summary>Entrega y observaciones ${ic("chevdown")}</summary><div>
          ${C.select({ id: "lf-method", label: "¿Cómo se entregó el dinero?", icon: "wallet", options: G.data.settings.paymentMethods.map((m) => [m, m]), value: d.method })}
          ${C.textarea({ id: "lf-notes", icon: "note", value: d.notes, placeholder: "Observaciones del préstamo (opcional)" })}</div></details>
        <p class="error" id="lf-err"></p>
        <div class="sticky-cta"><button class="btn btn-primary" type="submit" id="lf-save">${ic("check")}Crear préstamo</button></div>
      </form></main>`,
      bind(v) {
        const read = () => ({
          clientId: $("#lf-client", v).value, amount: G.parseMoney($("#lf-amount", v).value), rate: U.num($("#lf-rate", v).value), mode: d.mode,
          count: parseInt($("#lf-count", v).value, 10) || 0, freq: d.freq, start: $("#lf-start", v).value || G.today(), first: $("#lf-first", v).value || "",
          method: $("#lf-method", v).value, notes: $("#lf-notes", v).value.trim(), portfolioId: $("#lf-pf", v) ? $("#lf-pf", v).value : "", pfTouched: d.pfTouched,
        });
        const calc = () => {
          const r = read(); const F = G.FREQ[r.freq];
          $("#lf-unit", v).textContent = (r.count === 1 ? F.unit[0] : F.unit[1]);
          U.cur().params.draft = Object.assign(d, r);
          if (!(r.amount > 0 && r.count > 0 && r.count <= 400)) { $("#lf-calc", v).innerHTML = `<div class="card">${C.empty("percent", "", "Escribe el capital y el número de cuotas para ver el cálculo.")}</div>`; return null; }
          const pl = G.plan(r.amount, r.rate, r.count, r.freq, r.start, [], { mode: r.mode, firstDate: r.first });
          const lc = G.legalCheck(r.amount, pl.cuotas, r.start);
          const months = G.termMonths(r.count, r.freq);
          $("#lf-calc", v).innerHTML = C.kv([["Capital", money(r.amount)], ["Interés" + (r.mode === "mensual" ? ` (${String(r.rate).replace(".", ",")}% × ${months.toFixed(1).replace(".", ",")} meses)` : ` (${String(r.rate).replace(".", ",")}%)`), money(pl.interest)],
            ["Total a pagar", `<b>${money(pl.total)}</b>`, "total"], ["Cuotas", `${r.count} cuotas ${({diaria:"diarias",semanal:"semanales",quincenal:"quincenales",mensual:"mensuales"})[r.freq]} de <b>${money(pl.cuotaValue)}</b>${pl.cuotas[r.count - 1].base !== pl.cuotaValue ? ` (última ${money(pl.cuotas[r.count - 1].base)})` : ""}`],
            ["Primer cobro", G.fmtDate(pl.cuotas[0].date)], ["Finaliza", G.fmtDate(pl.end)], ["Tasa efectiva anual", lc.ea >= 1000 ? "más de 1.000 % E.A." : lc.ea.toFixed(2).replace(".", ",") + " % E.A."]])
            + (lc.configured ? (lc.exceeds ? C.alert("danger", "alert", "Supera la tasa de usura", `Configurada: ${String(lc.limit).replace(".", ",")} % E.A.${L.usurySince ? " (vigente desde " + G.fmtDate(L.usurySince) + ")" : ""}. Cobrar por encima del límite legal puede ser delito de usura (art. 305 Código Penal).${lc.block ? " No se permitirá crear el préstamo." : ""}`) : C.alert("ok", "shield", "Dentro de la tasa de usura", `Límite configurado: ${String(lc.limit).replace(".", ",")} % E.A.`))
              : C.alert("warn", "info", "Validación legal sin configurar", `Escribe la tasa de usura vigente (Superintendencia Financiera) en <a class="h-link" ${goAttr("ajustes", { sec: "finanzas" })}>Configuración → Finanzas</a> para comparar cada préstamo.`));
          return { r, pl, lc };
        };
        $$("input,select,textarea", v).forEach((el) => el.addEventListener("input", calc));
        const pfs = $("#lf-pf", v); if (pfs) pfs.addEventListener("change", () => { d.pfTouched = true; });
        $("#lf-client", v).addEventListener("change", (e) => { const c = U.client(e.target.value); if (c && pfs && !d.pfTouched) pfs.value = c.portfolioId || ""; });
        $$("[data-mode]", v).forEach((b) => b.onclick = () => { calc(); d.mode = b.dataset.mode; U.refresh(); });
        $$("[data-freq]", v).forEach((b) => b.onclick = () => { calc(); d.freq = b.dataset.freq; U.refresh(); });
        $("#lf-newc", v).onclick = () => U.go("clienteForm", { thenLoan: true });
        calc();
        let sending = false;
        $("#lf", v).onsubmit = async (e) => {
          e.preventDefault(); if (sending) return;
          const res = calc(); const r = read(); const errs = {};
          if (!r.clientId) errs["lf-client"] = "Selecciona el cliente.";
          if (!(r.amount > 0)) errs["lf-amount"] = "Escribe el capital prestado.";
          if (!(r.rate >= 0 && r.rate <= 100)) errs["lf-rate"] = "El interés debe estar entre 0 y 100 %.";
          if (!(r.count >= 1 && r.count <= 400)) errs["lf-count"] = "Entre 1 y 400 cuotas.";
          if (r.first && r.first < r.start) errs["lf-first"] = "No puede ser antes de la entrega.";
          if (!U.fieldErrors(v, errs)) return;
          if (res && res.lc.exceeds && !res.lc.block && !(await confirmBox("Tasa por encima de la usura", `La tasa efectiva (${res.lc.ea.toFixed(2).replace(".", ",")} % E.A.) supera el límite configurado (${res.lc.limit} % E.A.). ¿Crear de todos modos?`, "Crear de todos modos", true))) return;
          const cl = U.client(r.clientId);
          if (!(await confirmBox("¿Crear el préstamo?", `${esc(cl.name)} recibe <b>${money(r.amount)}</b> y paga <b>${money(res.pl.total)}</b> en ${r.count} cuotas de ${money(res.pl.cuotaValue)}.`, "Crear préstamo"))) return;
          sending = true;
          const l = act(() => G.ops.createLoan({ clientId: r.clientId, amount: r.amount, rate: r.rate, interestMode: r.mode, count: r.count, freq: r.freq, startDate: r.start, firstDate: r.first || null, method: r.method, notes: r.notes, portfolioId: r.portfolioId || null }));
          sending = false;
          if (!l) return;
          G.applyMora(); toast("Préstamo #" + l.num + " creado", "ok"); U.go("prestamo", { id: l.id }, true);
        };
      },
    };
  };

  // ---------------------------------------------------------------- DETALLE
  S.prestamo = (p) => {
    const st = G.state().byLoan.get(p.id);
    if (!st || !G.canSeeClient(st.loan.clientId)) return { redirect: U.back };
    const l = st.loan; const cl = U.client(l.clientId); const F = G.FREQ[l.freq]; const tab = p.t || "cuotas";
    const pays = G.data.payments.filter((x) => x.loanId === l.id).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    const pct = Math.min(1, st.paid / st.totalDue);
    const pf = G.data.portfolios.find((x) => x.id === l.portfolioId);
    // tabla de amortización con saldo pendiente acumulado
    let run = st.totalDue;
    const basePlan = (l.skipDates || []).length ? G.plan(l.amount, l.rate, l.count, l.freq, l.startDate, [], { mode: l.interestMode, firstDate: l.firstDate }) : null;
    const amort = st.cuotas.map((c) => { run -= c.paid; c.rescheduled = !!basePlan && c.date !== basePlan.cuotas[c.n - 1].date; return Object.assign({}, c, { after: Math.max(0, run) }); });
    let content = "";
    if (tab === "cuotas") {
      content = `<div class="table-wrap"><table class="t"><thead><tr><th>#</th><th class="l">Vence</th><th>Capital</th><th>Interés</th><th>Valor</th><th>Pagado</th><th>Saldo</th><th class="l">Estado</th></tr></thead><tbody>
        ${amort.map((c) => `<tr class="tap" data-cuota="${c.n}"><td>${c.n}</td><td class="l ${c.overdue ? "red" : ""}">${G.fmtDateShort(c.date)}</td><td>${fmtIn(c.capital) || 0}</td><td>${fmtIn(c.interest + c.charge) || 0}</td><td><b>${fmtIn(c.due)}</b></td><td class="${c.paid ? "green" : "muted"}">${fmtIn(c.paid) || "–"}</td><td>${fmtIn(c.after) || "0"}</td><td class="l">${U.cuotaBadge(c)}</td></tr>`).join("")}
        </tbody><tfoot><tr><td></td><td class="l">Total</td><td>${fmtIn(l.amount)}</td><td>${fmtIn(st.plan.interest + st.chargesTotal)}</td><td>${fmtIn(st.totalDue)}</td><td>${fmtIn(st.paid)}</td><td>${fmtIn(st.balance) || "0"}</td><td></td></tr></tfoot></table></div>
        <p class="hint">Toca una cuota para registrar su pago, reprogramarla o quitar un recargo. Capital e interés de cada cuota se reparten en proporción.</p>`;
    } else if (tab === "pagos") {
      content = pays.length ? `<div class="list">${pays.map((x) => x.amount > 0
        ? `<button class="item" data-pay="${x.id}"><span class="lead-ico ${x.voided ? "t-grey" : "t-green"}">${ic(x.voided ? "ban" : "down")}</span><div class="grow"><div class="name" ${x.voided ? 'style="text-decoration:line-through"' : ""}>${money(x.amount)}</div><div class="sub">${G.fmtDate(x.date)} · ${esc(x.method || "")}${x.voided ? " · anulado: " + esc(x.voidReason || "") : x.note ? " · " + esc(x.note) : ""}</div></div><span class="xs muted">${x.receiptNo || ""}</span></button>`
        : `<div class="item"><span class="lead-ico t-red">${ic("x")}</span><div class="grow"><div class="name">No pagó</div><div class="sub">${G.fmtDate(x.date)}${x.note ? " · " + esc(x.note) : ""}</div></div></div>`).join("")}</div>`
        : C.empty("coins", "Sin pagos", "Aún no hay pagos registrados.");
    } else {
      const ev = G.data.audit.filter((a) => a.ref === l.id || (a.entity === "pago" && pays.some((x) => x.id === a.ref)));
      content = ev.length ? `<div class="card timeline">${ev.map((a) => `<div class="ev"><span class="lead-ico">${ic(a.action === "pago" ? "dollar" : a.action === "anular" ? "ban" : "history")}</span><div class="grow"><div class="strong">${esc(a.action[0].toUpperCase() + a.action.slice(1))}</div><div class="small muted">${esc(a.detail)}</div><div class="when">${G.fmtDate(a.at.slice(0, 10))} ${a.at.slice(11, 16)} · ${esc(a.user)}</div></div></div>`).join("")}</div>`
        : C.empty("history", "Sin historial registrado", "Los préstamos creados antes de esta versión no tienen historial detallado.");
    }
    return {
      html: appbar({ back: true, title: "Préstamo #" + l.num, sub: cl ? cl.name : "", right: `<button class="icon-btn" id="lo-more" aria-label="Más acciones">${ic("more")}</button>` }) + `<main class="body pad-bottom">
        <button class="item card" style="padding:10px 12px" ${goAttr("cliente", { id: l.clientId })}>${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">${cl && cl.phone ? esc(cl.phone) : "Ver perfil"}</div></div>${ic("right", "chev")}</button>
        <div class="kpi-main"><div class="between"><div class="kpi-label">Saldo pendiente</div>${U.loanBadge(st)}</div>
          <div class="kpi-v ${st.status === "vencido" ? "red" : ""}">${money(st.balance)}</div>
          <div style="margin-top:10px">${C.progress(pct)}</div><div class="meter-line"><span>Pagado ${money(st.paid)} · ${Math.round(pct * 100)}%</span><span>${st.paidCount} de ${l.count} cuotas</span></div>
          ${st.overdueAmount ? `<div class="small red" style="margin-top:6px">${plural(st.overdueCount, "cuota vencida", "cuotas vencidas")} · ${money(st.overdueAmount)} · ${st.maxDaysLate} días de atraso</div>` : ""}</div>
        ${C.kv([["Capital", money(l.amount)], ["Intereses pactados", `${money(st.plan.interest)} <span class="muted small">(${String(l.rate).replace(".", ",")}% ${G.INTEREST_MODES[l.interestMode || "flat"].short})</span>`], st.chargesTotal ? ["Recargos por atraso", `<span class="red">${money(st.chargesTotal)}</span>`] : null,
          ["Total acordado", `<b>${money(st.totalDue)}</b>`, "total"], ["Frecuencia", `${F.label} · ${l.count} cuotas de ${money(st.plan.cuotaValue)}`], ["Fechas", `${G.fmtDate(l.startDate)} → ${G.fmtDate(st.plan.end)}`],
          ["Capital recuperado", money(st.capitalRecovered)], ["Interés cobrado", `<span class="green">${money(st.interestCollected)}</span>`], pf ? ["Cartera", esc(pf.name)] : null, l.notes ? ["Observaciones", esc(l.notes)] : null])}
        ${C.tabs("t", [["cuotas", "Tabla de cuotas"], ["pagos", `Pagos (${pays.filter((x) => x.amount > 0).length})`], ["historial", "Historial"]], tab)}
        ${content}
        ${(l.skipDates || []).length ? C.section("Días sin cobro de este préstamo", "", `<div class="list">${l.skipDates.map((dd) => `<div class="item compact"><span class="lead-ico t-violet">${ic("calendar")}</span><div class="grow"><div class="name">${G.fmtDateLong(dd)}</div></div>${G.can("prestamo.crear") ? `<button class="icon-btn" data-unskip="${dd}" aria-label="Volver a cobrar">${ic("x")}</button>` : ""}</div>`).join("")}</div>`) : ""}
        <div class="sticky-cta">${st.status !== "finalizado" && G.can("pago.registrar") ? `<button class="btn btn-primary" ${goAttr("pago", { loanId: l.id })}>${ic("dollar")}Registrar pago</button>` : `<button class="btn btn-soft" ${goAttr("estado", { id: l.clientId })}>${ic("file")}Estado de cuenta</button>`}</div>
      </main>`,
      bind(v) {
        $$("[data-t]", v).forEach((b) => b.onclick = () => U.setParam({ t: b.dataset.t }, true));
        U.bindMovRows(v);
        $$("[data-cuota]", v).forEach((b) => b.onclick = () => {
          const c = st.cuotas[b.dataset.cuota - 1]; const opts = [];
          if (c.status !== "pagada" && G.can("pago.registrar")) opts.push(C.opt("dollar", "green", "Registrar pago", "Falta " + money(c.remaining) + " de esta cuota", goAttr("pago", { loanId: l.id })));
          if (c.status !== "pagada" && G.can("prestamo.crear")) opts.push(C.opt("calendar", "violet", "Reprogramar: no cobrar este día", "La cuota y las siguientes se corren al próximo día de cobro, sin atraso", 'id="so-skip"'));
          if (c.charge && G.can("prestamo.crear")) opts.push(C.opt("percent", "amber", "Quitar recargo", "Perdonar " + money(c.charge), 'id="so-waive"'));
          sheet(`Cuota ${c.n} · ${G.fmtDate(c.date)}`, C.kv([["Capital", money(c.capital)], ["Interés", money(c.interest)], c.charge ? ["Recargo por atraso", `<span class="red">${money(c.charge)}</span>`] : null, ["Valor esperado", `<b>${money(c.due)}</b>`], ["Pagado", `<span class="green">${money(c.paid)}</span>`], ["Falta", money(c.remaining)], ["Estado", U.cuotaBadge(c)]]) + `<div style="margin-top:8px">${opts.join("")}</div>`, (s) => {
            const sk = $("#so-skip", s);
            if (sk) sk.onclick = async () => { closeLayer(); if (await confirmBox("¿No cobrar el " + G.fmtDate(c.date) + "?", `La cuota ${c.n} y las siguientes se corren al próximo día de cobro. Los montos no cambian.`, "Reprogramar")) { if (act(() => G.ops.skipLoanDate(l.id, c.date))) { const n = G.computeLoan(U.loanOf(l.id)); toast("Cuota " + c.n + " ahora vence el " + G.fmtDate(n.cuotas[c.n - 1].date), "ok"); U.refresh(); } } };
            const w = $("#so-waive", s);
            if (w) w.onclick = async () => { closeLayer(); if (await confirmBox("¿Quitar recargo?", `Se perdona el recargo de ${money(c.charge)} de la cuota ${c.n}. Queda registrado en la auditoría.`, "Quitar recargo")) { act(() => G.ops.removeCharge(l.id, c.n), "Recargo quitado"); U.refresh(); } };
          });
        });
        $$("[data-unskip]", v).forEach((b) => b.onclick = async () => { if (await confirmBox("¿Volver a cobrar este día?", G.fmtDateLong(b.dataset.unskip) + " vuelve a ser día de cobro.", "Volver a cobrar")) { act(() => G.ops.unskipLoanDate(l.id, b.dataset.unskip), "Día restablecido"); U.refresh(); } });
        const hasPays = pays.some((x) => x.amount > 0 && !x.voided);
        $("#lo-more", v).onclick = () => sheet(null, `
          ${C.opt("file", "blue", "Estado de cuenta", "Compartir PDF, imagen o WhatsApp", goAttr("estado", { id: l.clientId }))}
          ${G.can("ver.finanzas") ? C.opt("list", "green", "Movimientos del préstamo", "", goAttr("movimientos", { loanId: l.id })) : ""}
          ${G.can("prestamo.crear") && st.status !== "finalizado" ? C.opt("calendar", "violet", "Quitar un día de cobro", "Reprogramar sin cambiar montos", 'id="so-skipday"') : ""}
          ${G.can("prestamo.crear") ? C.opt("note", "grey", "Observaciones", l.notes ? esc(l.notes.slice(0, 40)) : "Agregar nota", 'id="so-note"') : ""}
          ${G.can("prestamo.crear") && !hasPays ? C.opt("trash", "red", "Eliminar préstamo", "Solo porque no tiene pagos", 'id="so-dell"') : ""}`, (s) => {
          const dl = $("#so-dell", s); if (dl) dl.onclick = async () => { closeLayer(); if (await confirmBox("¿Eliminar préstamo #" + l.num + "?", "No tiene pagos. Queda registrado en la auditoría.", "Eliminar", true)) { if (act(() => G.ops.deleteLoan(l.id), "Préstamo eliminado")) U.back(); } };
          const nt = $("#so-note", s); if (nt) nt.onclick = async () => { const t = await promptBox("Observaciones", "Nota interna del préstamo.", l.notes || "", "Guardar", { min: 0 }); if (t != null) { act(() => G.ops.closeLoanNote(l.id, t), "Nota guardada"); U.refresh(); } };
          const sd = $("#so-skipday", s); if (sd) sd.onclick = () => {
            const def = st.next ? st.next.date : G.today();
            sheet("Quitar un día de cobro", `<p class="hint">El cliente no paga ese día. La cuota se corre al siguiente día de cobro y no cuenta como atraso.</p><div class="form" style="margin-top:10px">${C.field({ id: "sk-date", label: "Día que no paga", type: "date", value: def })}<p class="hint" id="sk-info"></p><button class="btn btn-primary" id="sk-ok">${ic("check")}Quitar este día</button></div>`, (sh) => {
              const info = () => { const dd = $("#sk-date", sh).value; if (!dd) return; const r = G.noPayReason(dd, l); const hit = st.cuotas.find((c) => c.date === dd && c.status !== "pagada"); $("#sk-info", sh).textContent = r ? "Ese día ya es sin cobro: " + r + "." : hit ? `Ese día vence la cuota ${hit.n}; se correrá.` : "Ese día no vence ninguna cuota."; };
              $("#sk-date", sh).oninput = info; info();
              $("#sk-ok", sh).onclick = () => { const dd = $("#sk-date", sh).value; if (!dd) return; closeLayer(); act(() => G.ops.skipLoanDate(l.id, dd), "Día quitado: " + G.fmtDate(dd)); U.refresh(); };
            });
          };
        });
      },
    };
  };

  U.noPayText = () => {
    const np = G.data.settings.noPay; const wd = np.weekdays || [];
    const names = [[1, "lunes"], [2, "martes"], [3, "miércoles"], [4, "jueves"], [5, "viernes"], [6, "sábados"], [0, "domingos"]].filter(([dd]) => wd.includes(dd)).map(([, n]) => n);
    const parts = []; if (names.length) parts.push("los " + names.join(", ")); if (np.colombia !== false) parts.push("los festivos de Colombia");
    const f = (np.dates || []).filter((x) => (x.date || x) >= G.today()).length; if (f) parts.push(plural(f, "día especial", "días especiales"));
    return parts.length ? "No se cobra " + parts.join(", ").replace(/, ([^,]*)$/, " ni $1") + "." : "Se cobra todos los días.";
  };
})();
