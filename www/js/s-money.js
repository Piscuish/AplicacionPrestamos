/* Pantallas: Finanzas, Movimientos, Registrar movimiento, Cierre de caja y Reportes. */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, plural, goAttr, appbar, act, sheet, closeLayer, confirmBox, promptBox, toast, fmtIn } = U;
  const noPerm = (t) => ({ html: appbar({ back: true, title: t }) + `<main class="body">${C.empty("lock", "Sin permiso", "Tu usuario no tiene acceso a esta sección.")}</main>` });
  const PERIODS = [["dia", "Hoy"], ["semana", "Semana"], ["mes", "Mes"], ["anio", "Año"], ["rango", "Rango"]];
  function periodPicker(p) {
    return `${C.seg("per", PERIODS.map(([k, l]) => [k, l]), p.per || "mes", "five")}
      ${p.per === "rango" ? `<div class="grid2">${C.field({ id: "pr-from", label: "Desde", type: "date", value: p.from || G.addDays(G.today(), -30) })}${C.field({ id: "pr-to", label: "Hasta", type: "date", value: p.to || G.today() })}</div>` : ""}`;
  }
  function bindPeriod(v) {
    $$("[data-per]", v).forEach((b) => b.onclick = () => U.setParam({ per: b.dataset.per }, true));
    const f = $("#pr-from", v), t = $("#pr-to", v);
    if (f) [f, t].forEach((el) => el.onchange = () => { if (f.value && t.value && f.value <= t.value) U.setParam({ from: f.value, to: t.value }, true); });
  }
  const getPeriod = (p) => p.per === "rango" ? G.period("rango", p.from || G.addDays(G.today(), -30), p.to || G.today()) : G.period(p.per || "mes");

  // ---------------------------------------------------------------- Gráficos SVG (colores desde las variables del tema)
  function niceStep(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function bars(rows, series) {
    const W = 340, H = 170, L = 38, B = 22, T = 8;
    const max = Math.max(1, ...rows.flatMap((r) => series.map((s) => r[s.k])));
    const step = niceStep(max / 4), top = step * 4; const n = rows.length; const gw = (W - L - 4) / n; const bw = Math.max(3, Math.min(12, gw / (series.length + 1)));
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de barras">`;
    for (let i = 0; i <= 4; i++) { const y = T + (H - B - T) * (1 - i / 4); s += `<line class="grid" x1="${L}" x2="${W}" y1="${y}" y2="${y}"/><text x="${L - 5}" y="${y + 3.5}" text-anchor="end" font-size="9.5">${G.moneyShort(step * i)}</text>`; }
    rows.forEach((r, i) => {
      const cx = L + gw * i + gw / 2; const x0 = cx - (series.length * bw + (series.length - 1)) / 2;
      series.forEach((se, j) => { const h = (H - B - T) * r[se.k] / top; s += `<rect x="${x0 + j * (bw + 1)}" y="${H - B - h}" width="${bw}" height="${Math.max(0, h)}" rx="2" fill="${se.c}"><title>${esc(r.label)} · ${se.l}: ${money(r[se.k])}</title></rect>`; });
      if (n <= 12 || i % 2 === 0) s += `<text x="${cx}" y="${H - 6}" text-anchor="middle" font-size="10">${esc(r.label)}</text>`;
    });
    return s + "</svg>" + `<div class="legend">${series.map((se) => `<span><i style="background:${se.c}"></i>${se.l}</span>`).join("")}</div>`;
  }

  // ---------------------------------------------------------------- FINANZAS
  S.finanzas = (p) => {
    if (!G.can("ver.finanzas")) return noPerm("Finanzas");
    const per = getPeriod(p); const F = G.finance(per); const T = G.totals(); const fl = G.flow(per); const cash = G.cashAvailable();
    const chart = p.chart || "flujo";
    const charts = {
      flujo: [{ k: "income", l: "Ingresos", c: "var(--green)" }, { k: "expenses", l: "Gastos", c: "var(--red)" }],
      recaudo: [{ k: "collected", l: "Recaudación", c: "var(--primary)" }],
      interes: [{ k: "interest", l: "Intereses cobrados", c: "var(--green)" }, { k: "recovered", l: "Capital recuperado", c: "var(--primary)" }],
      cartera: [{ k: "lent", l: "Prestado", c: "var(--orange)" }, { k: "recovered", l: "Recuperado", c: "var(--primary)" }],
    };
    return {
      html: appbar({ back: U.stack.length > 1, title: "Finanzas", sub: per.label }) + `<main class="body">
        ${periodPicker(p)}
        <div class="kpi-main"><div class="kpi-label">Ganancia del periodo</div><div class="kpi-v ${F.profit < 0 ? "red" : ""}">${money(F.profit)}</div>
          <div class="small muted">Intereses cobrados ${money(F.interest)}${F.movIn ? " + otros ingresos " + money(F.movIn) : ""} − gastos ${money(F.expenses)}</div></div>
        <div class="stat-grid">${C.stat("Dinero disponible", money(cash), cash < 0 ? "red" : "")}${C.stat("Capital por recuperar", money(T.capitalPending))}${C.stat("Recaudado", money(F.payIncome), "green")}${C.stat("Capital recuperado", money(F.capitalRecovered))}${C.stat("Ingresos", money(F.income))}${C.stat("Gastos", money(F.expenses), F.expenses ? "red" : "")}</div>
        ${C.section("Gráficos", "", `<div class="card">${C.chips("chart", [["flujo", "Ingresos vs gastos"], ["recaudo", "Recaudación"], ["interes", "Intereses y capital"], ["cartera", "Evolución de cartera"]], chart)}<div style="margin-top:10px">${bars(fl, charts[chart])}</div></div>`)}
        ${C.section("Liquidez, capital y rentabilidad", "", C.kv([
          ["Dinero disponible (caja)", money(cash)], ["Capital prestado por recuperar", money(T.capitalPending)], ["Intereses pendientes (aún no son dinero)", money(T.interestPending)],
          ["Desembolsos en el periodo", money(F.lent)], ["Aportes / retiros en el periodo", money(F.aportes) + " / " + money(F.retiros)],
          ["Rentabilidad cobrada sobre lo prestado", F.lent ? U.pct(F.interest / F.lent) : "—"]]))}
        <p class="hint">Un préstamo entregado es salida de capital, no gasto. Solo el interés <b>cobrado</b> cuenta como ganancia; los aportes de capital no son ingreso.</p>
        <div class="grid2"><button class="btn btn-soft" ${goAttr("movimientos", { per: p.per, from: p.from, to: p.to })}>${ic("list")}Movimientos</button>${G.can("movimiento.registrar") ? `<button class="btn btn-primary" ${goAttr("movForm", { kind: "gasto" })}>${ic("plus")}Registrar</button>` : ""}</div>
      </main>`,
      bind(v) { bindPeriod(v); $$("[data-chart]", v).forEach((b) => b.onclick = () => U.setParam({ chart: b.dataset.chart }, true)); },
    };
  };

  // ---------------------------------------------------------------- MOVIMIENTOS
  S.movimientos = (p) => {
    if (!G.can("ver.finanzas")) return noPerm("Movimientos");
    const per = getPeriod(Object.assign({ per: p.loanId ? "todo" : p.per || "mes" }, p)); const f = p.f || "todos";
    let rows = G.movements({ voided: !!p.anul }).filter((m) => m.date >= per.from && m.date <= per.to);
    if (p.loanId) rows = rows.filter((m) => (m.kind === "pay" && m.ref.loanId === p.loanId) || (m.kind === "loan" && m.ref.id === p.loanId));
    const groups = { pay: "Pagos recibidos", loan: "Préstamos entregados", gasto: "Gastos", ingreso: "Otros ingresos", aporte: "Aportes", retiro: "Retiros", ajuste: "Ajustes" };
    if (f !== "todos") rows = rows.filter((m) => m.kind === f);
    const net = rows.filter((m) => !m.voided).reduce((s, m) => s + m.sign * m.amount, 0);
    let html = "", last = null;
    rows.slice(0, 400).forEach((r) => { if (r.date !== last) { if (last) html += "</div>"; html += `<div class="list"><div class="mov-day">${G.relDay(r.date) === "Hoy" ? "Hoy · " : ""}${G.fmtDate(r.date)}</div>`; last = r.date; } html += U.movRow(r); });
    if (last) html += "</div>";
    return {
      html: appbar({ back: U.stack.length > 1, title: "Movimientos", sub: p.loanId ? "Préstamo #" + (U.loanOf(p.loanId) || {}).num : per.label }) + `<main class="body pad-bottom">
        ${p.loanId ? "" : periodPicker(Object.assign({ per: "mes" }, p))}
        ${C.chips("f", [["todos", "Todos"]].concat(Object.entries(groups)), f)}
        <div class="between small"><span class="muted">${plural(rows.length, "movimiento", "movimientos")} · neto <b class="${net < 0 ? "red" : "green"}">${money(net)}</b></span><label class="row small" style="gap:6px"><input type="checkbox" id="mv-anul" ${p.anul ? "checked" : ""}>Ver anulados</label></div>
        ${html || C.empty("list", "Sin movimientos", "No hay movimientos con estos filtros.")}
        ${G.can("movimiento.registrar") ? `<div class="sticky-cta"><button class="btn btn-primary" ${goAttr("movForm", { kind: "gasto" })}>${ic("plus")}Nuevo movimiento</button></div>` : ""}
      </main>`,
      bind(v) {
        bindPeriod(v); U.bindMovRows(v);
        $$("[data-f]", v).forEach((b) => b.onclick = () => U.setParam({ f: b.dataset.f }, true));
        $("#mv-anul", v).onchange = (e) => U.setParam({ anul: e.target.checked }, true);
      },
    };
  };

  // ---------------------------------------------------------------- NUEVO MOVIMIENTO
  S.movForm = (p) => {
    if (!G.can("movimiento.registrar")) return noPerm("Movimiento");
    const kind = p.kind || "gasto";
    const cats = kind === "gasto" ? G.data.settings.expenseCategories : kind === "ingreso" ? ["Otro ingreso", "Venta", "Comisión"] : kind === "aporte" ? ["Capital inicial", "Aporte de socio"] : kind === "retiro" ? ["Retiro de ganancias", "Retiro de socio"] : ["Sobrante de caja", "Faltante de caja", "Corrección"];
    const kinds = [["gasto", "Gasto"], ["ingreso", "Ingreso"], ["aporte", "Aporte"], ["retiro", "Retiro"]].concat(G.can("caja.operar") ? [["ajuste", "Ajuste"]] : []);
    const help = { gasto: "Gastos del negocio: transporte, papelería, etc.", ingreso: "Ingresos que no son pagos de cuotas (los pagos se registran solos).", aporte: "Dinero que pones en el negocio. Aumenta el disponible, pero no es ganancia.", retiro: "Dinero que sacas del negocio. Reduce el disponible, pero no es gasto.", ajuste: "Corrección auditada de caja (sobrante o faltante). Requiere motivo." };
    if (!p.token) p.token = G.uid();
    return {
      html: appbar({ back: true, title: "Nuevo movimiento" }) + `<main class="body pad-bottom"><form class="form" id="mf" novalidate>
        <div class="chips" style="flex-wrap:wrap;margin:0;padding:0">${kinds.map(([k, l]) => `<button type="button" class="chip ${k === kind ? "active" : ""}" data-kind="${k}">${l}</button>`).join("")}</div>
        <p class="hint">${help[kind]}</p>
        ${kind === "ajuste" ? C.seg("adir", [["in", "Entra dinero (+)"], ["out", "Sale dinero (−)"]], p.adir || "in", "two") : ""}
        ${C.field({ id: "mf-amount", label: "Monto", icon: "dollar", money: true, req: true, value: p.amount })}
        ${C.field({ id: "mf-concept", label: "Concepto", icon: "note", req: true, value: p.concept || "", attrs: 'maxlength="50" list="mf-sug"' })}
        <datalist id="mf-sug">${cats.map((s) => `<option value="${esc(s)}">`).join("")}</datalist>
        <div class="chips">${cats.slice(0, 6).map((s) => `<button type="button" class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="grid2">${C.field({ id: "mf-date", label: "Fecha", type: "date", value: p.date || G.today() })}${C.select({ id: "mf-method", label: "Método", options: G.data.settings.paymentMethods.map((m) => [m, m]), value: "Efectivo" })}</div>
        ${C.field({ id: "mf-detail", label: kind === "ajuste" ? "Motivo del ajuste (obligatorio)" : "Detalle (opcional)", icon: "edit", attrs: 'maxlength="100"' })}
        <div class="sticky-cta"><button class="btn btn-primary" type="submit" id="mf-save">${ic("check")}Guardar</button></div>
      </form></main>`,
      bind(v) {
        $$("[data-kind]", v).forEach((b) => b.onclick = () => U.setParam({ kind: b.dataset.kind, amount: G.parseMoney($("#mf-amount", v).value) }, true));
        $$("[data-adir]", v).forEach((b) => b.onclick = () => { p.adir = b.dataset.adir; $$("[data-adir]", v).forEach((x) => x.classList.toggle("on", x === b)); });
        $$("[data-s]", v).forEach((b) => b.onclick = () => { $("#mf-concept", v).value = b.dataset.s; });
        $("#mf", v).onsubmit = (e) => {
          e.preventDefault(); const btn = $("#mf-save", v); if (btn.disabled) return;
          const concept = $("#mf-concept", v).value.trim(), amount = G.parseMoney($("#mf-amount", v).value), detail = $("#mf-detail", v).value.trim();
          const errs = {}; if (!(amount > 0)) errs["mf-amount"] = "Escribe el monto."; if (!concept) errs["mf-concept"] = "Escribe el concepto."; if (kind === "ajuste" && detail.length < 4) errs["mf-detail"] = "El ajuste necesita el motivo.";
          if (!U.fieldErrors(v, errs)) return;
          if (G.data.movements.some((m) => m.token === p.token)) { U.back(); return; }
          U.busy(btn, true);
          const ok = act(() => G.ops.addMovement({ kind, type: kind === "ajuste" ? (p.adir || "in") : undefined, concept, category: kind === "gasto" ? concept : undefined, amount, date: $("#mf-date", v).value || G.today(), method: $("#mf-method", v).value, detail, token: p.token }), "Movimiento guardado");
          U.busy(btn, false); if (ok) U.back();
        };
      },
    };
  };

  // ---------------------------------------------------------------- CIERRE DE CAJA
  S.caja = (p) => {
    if (!G.can("caja.operar") && !G.can("ver.finanzas")) return noPerm("Caja");
    const date = p.date || G.today(); const r = G.cashDay(date); const s = r.session; const can = G.can("caja.operar");
    const prev = G.data.cash.filter((c) => c.status === "cerrada").sort((a, b) => b.date.localeCompare(a.date));
    const lastClosed = prev.find((c) => c.date < date);
    const line = (l, val, tone) => [l, `<span class="${tone || ""}">${money(val)}</span>`];
    return {
      html: appbar({ back: true, title: "Cierre de caja", sub: G.fmtDateLong(date) }) + `<main class="body pad-bottom">
        <div class="toolbar"><button class="icon-btn" id="cj-prev" aria-label="Día anterior">${ic("left")}</button><div class="field grow" style="min-height:44px"><input id="cj-date" type="date" value="${date}" max="${G.today()}"></div><button class="icon-btn" id="cj-next" aria-label="Día siguiente" ${date >= G.today() ? "disabled" : ""}>${ic("right")}</button></div>
        ${!s ? `<div class="card stack"><div class="strong">Caja sin abrir</div><p class="hint">Abre la caja con el dinero en efectivo que tienes al iniciar el día.${lastClosed ? ` Último cierre (${G.fmtDate(lastClosed.date)}): contado ${money(lastClosed.counted)}.` : ""}</p>
            ${can ? `${C.field({ id: "cj-open", label: "Saldo inicial en efectivo", icon: "cash", money: true, value: lastClosed ? lastClosed.counted : "" })}<button class="btn btn-primary" id="cj-do-open">${ic("check")}Abrir caja</button>` : ""}</div>`
          : C.alert(s.status === "cerrada" ? "ok" : "info", s.status === "cerrada" ? "lock" : "cash", s.status === "cerrada" ? "Caja cerrada" : "Caja abierta", s.status === "cerrada" ? `Cerró ${esc(s.closedBy)} a las ${s.closedAt.slice(11, 16)}. No se puede editar; las correcciones se hacen con ajustes.` : `Abrió ${esc(s.openedBy)} a las ${new Date(s.openedAt).toTimeString().slice(0, 5)}.`)}
        ${C.section("Movimientos del día (efectivo)", "", C.kv([line("Saldo inicial", r.opening), line("Pagos recibidos en efectivo", r.payCash, "green"), line("Otros ingresos", r.income, "green"), line("Aportes de capital", r.aportes, "green"),
          line("Préstamos entregados", -r.loans, r.loans ? "red" : ""), line("Gastos", -r.expenses, r.expenses ? "red" : ""), line("Retiros", -r.retiros, r.retiros ? "red" : ""), r.ajustes ? line("Ajustes autorizados", r.ajustes) : null,
          ["Saldo esperado en caja", `<b>${money(r.expected)}</b>`, "total"]]))}
        ${r.payOther ? `<p class="hint">Además se recibieron ${money(r.payOther)} por transferencia u otros medios (no están en la caja física).</p>` : ""}
        ${s && s.status === "cerrada" ? C.kv([["Esperado al cierre", money(s.expected)], ["Dinero contado", money(s.counted)], ["Diferencia", `<b class="${s.diff ? "red" : "green"}">${s.diff > 0 ? "+" : ""}${money(s.diff)}</b>`], s.notes && ["Observaciones", esc(s.notes)]]) + (r.expected !== s.expected ? C.alert("warn", "alert", "Hubo cambios después del cierre", `Con los registros actuales el esperado sería ${money(r.expected)}. Registra un ajuste si corresponde.`) : "") : ""}
        ${s && s.status === "abierta" && can ? `<div class="card stack"><div class="strong">Cerrar caja</div>${C.field({ id: "cj-count", label: "Dinero contado", icon: "cash", money: true })}<div id="cj-diff"></div>${C.textarea({ id: "cj-notes", icon: "note", placeholder: "Observaciones (opcional)" })}<button class="btn btn-primary" id="cj-close">${ic("lock")}Cerrar caja</button></div>` : ""}
        ${s && can ? `<button class="btn btn-soft" ${goAttr("movForm", { kind: "ajuste", date })}>${ic("repeat")}Registrar ajuste</button>` : ""}
        ${prev.length ? C.section("Cierres anteriores", "", `<div class="list">${prev.slice(0, 30).map((c) => `<button class="item" data-cd="${c.date}"><span class="lead-ico ${c.diff ? "t-red" : "t-green"}">${ic("lock")}</span><div class="grow"><div class="name">${G.fmtDate(c.date)}</div><div class="sub">Contado ${money(c.counted)} · ${esc(c.closedBy)}</div></div><span class="amount ${c.diff ? "red" : "green"}">${c.diff > 0 ? "+" : ""}${money(c.diff)}</span></button>`).join("")}</div>`) : ""}
      </main>`,
      bind(v) {
        const set = (d) => U.setParam({ date: d }, true);
        $("#cj-date", v).onchange = (e) => e.target.value && set(e.target.value);
        $("#cj-prev", v).onclick = () => set(G.addDays(date, -1));
        $("#cj-next", v).onclick = () => set(G.addDays(date, 1));
        $$("[data-cd]", v).forEach((b) => b.onclick = () => set(b.dataset.cd));
        const o = $("#cj-do-open", v); if (o) o.onclick = () => { act(() => G.ops.openCash(date, G.parseMoney($("#cj-open", v).value)), "Caja abierta"); U.refresh(); };
        const cnt = $("#cj-count", v);
        if (cnt) cnt.addEventListener("input", () => { const c = G.parseMoney(cnt.value); const d = c - r.expected; $("#cj-diff", v).innerHTML = cnt.value ? C.alert(d === 0 ? "ok" : "warn", d === 0 ? "checkcircle" : "alert", d === 0 ? "Cuadra exacto" : (d > 0 ? "Sobran " : "Faltan ") + money(Math.abs(d)), "") : ""; });
        const cl = $("#cj-close", v); if (cl) cl.onclick = async () => {
          if (!cnt.value) { U.fieldErrors(v, { "cj-count": "Escribe el dinero contado." }); return; }
          const c = G.parseMoney(cnt.value);
          if (await confirmBox("¿Cerrar la caja?", `Esperado ${money(r.expected)}, contado ${money(c)}. Después no se puede editar; las correcciones se hacen con ajustes.`, "Cerrar caja")) { act(() => G.ops.closeCash(date, c, $("#cj-notes", v).value.trim()), "Caja cerrada"); U.refresh(); }
        };
      },
    };
  };

  // ---------------------------------------------------------------- REPORTES
  const REPORTS = {
    clientes: { t: "Clientes", d: "Datos, estado, saldo y cartera", rows() { return { h: ["Nombre", "Tipo doc.", "Documento", "Teléfono", "Dirección", "Barrio", "Ciudad", "Estado", "Cartera", "Ruta", "Préstamos", "Saldo"], r: G.state().clients.map((x) => [x.client.name, x.client.docType || "", x.client.doc || "", x.client.phone || "", x.client.address || "", x.client.barrio || "", x.client.city || "", G.CLIENT_STATUS[x.status].label, x.portfolio ? x.portfolio.name : "", x.route ? x.route.name : "", x.loans.length, x.debt]) }; } },
    prestamos: { t: "Préstamos", d: "Condiciones, pagado y saldo", period: true, rows(per) { return { h: ["Número", "Cliente", "Entrega", "Capital", "Modalidad", "Tasa %", "Interés", "Total", "Cuotas", "Frecuencia", "Pagado", "Saldo", "Estado", "Días atraso"], r: G.state().loans.filter((x) => x.loan.startDate >= per.from && x.loan.startDate <= per.to).map((x) => [x.loan.num, (U.client(x.loan.clientId) || {}).name, x.loan.startDate, x.loan.amount, G.INTEREST_MODES[x.loan.interestMode || "flat"].short, x.loan.rate, x.plan.interest, x.totalDue, x.loan.count, G.FREQ[x.loan.freq].label, x.paid, x.balance, x.status, x.maxDaysLate]) }; } },
    pagos: { t: "Pagos", d: "Recibos, método, capital e interés", period: true, rows(per) { const parts = new Map(); G.state().loans.forEach((x) => x.payParts.forEach((pp) => parts.set(pp.id, pp))); return { h: ["Fecha", "Recibo", "Cliente", "Préstamo", "Valor", "Capital", "Interés/recargo", "Método", "Registró", "Estado"], r: G.data.payments.filter((p) => p.amount > 0 && p.date >= per.from && p.date <= per.to).sort((a, b) => a.date.localeCompare(b.date)).map((p) => { const l = U.loanOf(p.loanId) || {}; const pp = parts.get(p.id); return [p.date, p.receiptNo || "", (U.client(l.clientId) || {}).name, l.num, p.amount, pp ? pp.capitalPart : 0, pp ? pp.interestPart : 0, p.method || "", p.user || "", p.voided ? "Anulado: " + p.voidReason : "Válido"]; }) }; } },
    carteras: { t: "Carteras", d: "Capital, saldo, vencido y mora", rows() { return { h: ["Cartera", "Clientes", "Préstamos activos", "Capital pendiente", "Saldo", "Vencido", "Clientes en mora"], r: [{ id: null, name: "Sin cartera" }].concat(G.data.portfolios).map((pf) => { const cl = G.state().clients.filter((x) => (x.client.portfolioId || null) === pf.id); const ls = G.state().loans.filter((x) => (x.loan.portfolioId || null) === pf.id); return [pf.name, cl.length, ls.filter((x) => x.status !== "finalizado").length, ls.reduce((s, x) => s + x.capitalPending, 0), ls.reduce((s, x) => s + x.balance, 0), ls.reduce((s, x) => s + x.overdueAmount, 0), cl.filter((x) => x.status === "mora").length]; }) }; } },
    rutas: { t: "Rutas y visitas", d: "Visitas y resultados por ruta", period: true, rows(per) { return { h: ["Fecha", "Ruta", "Cliente", "Resultado", "Observación", "Usuario"], r: G.data.visits.filter((x) => x.date >= per.from && x.date <= per.to).map((x) => [x.date, (G.data.routes.find((r) => r.id === x.routeId) || {}).name || "", (U.client(x.clientId) || {}).name, U.VISIT[x.result] || x.result, x.note || "", x.user || ""]) }; } },
    cobradores: { t: "Cobradores", d: "Pagos y visitas por usuario", period: true, rows(per) { const users = {}; const add = (u, k, v) => { users[u] = users[u] || { pagos: 0, valor: 0, visitas: 0 }; users[u][k] += v; }; G.data.payments.filter((p) => G.activePay(p) && p.date >= per.from && p.date <= per.to).forEach((p) => { add(p.user || "(antes del rediseño)", "pagos", 1); add(p.user || "(antes del rediseño)", "valor", p.amount); }); G.data.visits.filter((x) => x.date >= per.from && x.date <= per.to).forEach((x) => add(x.user || "", "visitas", 1)); return { h: ["Usuario", "Pagos registrados", "Valor recaudado", "Visitas"], r: Object.entries(users).map(([u, s]) => [u, s.pagos, s.valor, s.visitas]) }; } },
    morosidad: { t: "Morosidad", d: "Préstamos vencidos y días de atraso", rows() { return { h: ["Cliente", "Teléfono", "Préstamo", "Cuotas vencidas", "Valor vencido", "Días de atraso", "Saldo total"], r: G.state().loans.filter((x) => x.overdueAmount > 0).sort((a, b) => b.maxDaysLate - a.maxDaysLate).map((x) => { const c = U.client(x.loan.clientId) || {}; return [c.name, c.phone || "", x.loan.num, x.overdueCount, x.overdueAmount, x.maxDaysLate, x.balance]; }) }; } },
    finanzas: { t: "Finanzas", d: "Resumen contable por mes", period: true, rows(per) { const f = G.finance(per); return { h: ["Concepto", "Valor"], r: [["Periodo", per.label], ["Recaudado (pagos)", f.payIncome], ["Capital recuperado", f.capitalRecovered], ["Intereses cobrados", f.interest], ["Otros ingresos", f.movIn], ["Gastos", f.expenses], ["Ganancia", f.profit], ["Préstamos entregados", f.lent], ["Aportes", f.aportes], ["Retiros", f.retiros], ["Ajustes", f.ajustes], ["Flujo neto de caja", f.cashFlow]] }; } },
    movimientos: { t: "Movimientos", d: "Todos los movimientos de dinero", period: true, rows(per) { return { h: ["Fecha", "Tipo", "Concepto", "Detalle", "Entrada", "Salida", "Estado"], r: G.movements({ voided: true }).filter((m) => m.date >= per.from && m.date <= per.to).reverse().map((m) => [m.date, m.kind, m.title, m.sub, m.sign > 0 ? m.amount : "", m.sign < 0 ? m.amount : "", m.voided ? "Anulado" : ""]) }; } },
    caja: { t: "Cierres de caja", d: "Esperado, contado y diferencias", period: true, rows(per) { return { h: ["Fecha", "Saldo inicial", "Esperado", "Contado", "Diferencia", "Abrió", "Cerró", "Observaciones"], r: G.data.cash.filter((c) => c.date >= per.from && c.date <= per.to).map((c) => [c.date, c.opening, c.expected == null ? "" : c.expected, c.counted == null ? "abierta" : c.counted, c.diff == null ? "" : c.diff, c.openedBy, c.closedBy || "", c.notes || ""]) }; } },
  };
  S.reportes = (p) => {
    if (!G.can("ver.reportes")) return noPerm("Reportes");
    const tipo = p.tipo; const R = REPORTS[tipo];
    if (!R) return {
      html: appbar({ back: true, title: "Reportes" }) + `<main class="body"><div class="list">${Object.entries(REPORTS).map(([k, r]) => `<button class="item" ${goAttr("reportes", { tipo: k })}><span class="lead-ico t-green">${ic("report")}</span><div class="grow"><div class="name">${r.t}</div><div class="sub">${r.d}</div></div>${ic("right", "chev")}</button>`).join("")}</div>
        <p class="hint">Exporta a <b>CSV</b> (se abre en Excel o Google Sheets) o a <b>PDF</b>.</p></main>`,
    };
    const per = getPeriod(Object.assign({ per: "mes" }, p)); const data = R.rows(per);
    const fmt = (v) => typeof v === "number" ? fmtIn(v) || "0" : esc(v == null ? "" : v);
    return {
      html: appbar({ back: true, title: R.t, sub: R.period ? per.label : "Estado actual" }) + `<main class="body pad-bottom">
        ${R.period ? periodPicker(Object.assign({ per: "mes" }, p)) : ""}
        <p class="hint">${plural(data.r.length, "fila", "filas")}.</p>
        ${data.r.length ? `<div class="table-wrap"><table class="t"><thead><tr>${data.h.map((h, i) => `<th class="${i ? "" : "l"}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${data.r.slice(0, 200).map((row) => `<tr>${row.map((c, i) => `<td class="${typeof c === "number" ? "" : "l"}">${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${data.r.length > 200 ? `<p class="hint">Vista previa de 200 filas; el archivo incluye todas.</p>` : ""}` : C.empty("report", "Sin datos", "No hay registros para este periodo.")}
        <div class="sticky-cta"><button class="btn btn-soft" id="rp-pdf" ${data.r.length ? "" : "disabled"}>${ic("file")}PDF</button><button class="btn btn-primary" id="rp-csv" ${data.r.length ? "" : "disabled"}>${ic("download")}Excel (CSV)</button></div></main>`,
      bind(v) {
        bindPeriod(v);
        const name = `Reporte_${R.t.replace(/\s+/g, "_")}_${per.from === "0000-01-01" ? "total" : per.from + "_" + per.to}`;
        $("#rp-csv", v).onclick = () => U.shareFile(name + ".csv", U.toCSV(data.h, data.r), "text/csv", R.t);
        $("#rp-pdf", v).onclick = () => window.Docs.sharePDF(tableCanvas(R.t, R.period ? per.label : "Corte " + G.fmtDate(G.today()), data), name, R.t);
      },
    };
  };
  /* Dibuja una tabla en lienzo para exportarla a PDF (sin librerías). */
  function tableCanvas(title, sub, data) {
    if (data.r.length > 600) { data = { h: data.h, r: data.r.slice(0, 600) }; sub += " · primeras 600 filas (el CSV trae todas)"; }
    const cols = data.h.length; const W = 1600; const rowH = 44; const H = 220 + (data.r.length + 1) * rowH + 80;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
    const f = (w, s) => `${w} ${s}px system-ui, Roboto, Arial, sans-serif`;
    x.fillStyle = "#2563EB"; x.fillRect(0, 0, W, 8);
    x.fillStyle = "#172033"; x.font = f(700, 40); x.fillText(((G.Config.get() || {}).company || "") + " · " + title, 50, 80);
    x.fillStyle = "#718096"; x.font = f(400, 26); x.fillText(sub + " · generado " + G.fmtDate(G.today()), 50, 125);
    const widths = data.h.map((h, i) => Math.max(String(h).length, ...data.r.slice(0, 300).map((r) => String(typeof r[i] === "number" ? fmtIn(r[i]) : r[i] == null ? "" : r[i]).length)));
    const tot = widths.reduce((a, b) => a + Math.min(b, 40) + 2, 0); const colW = widths.map((w) => (W - 100) * (Math.min(w, 40) + 2) / tot);
    let y = 180;
    const drawRow = (row, head) => {
      let cx = 50;
      if (head) { x.fillStyle = "#F1F3F7"; x.fillRect(50, y - 30, W - 100, rowH); }
      row.forEach((v, i) => {
        const num = typeof v === "number"; const s = num ? fmtIn(v) || "0" : String(v == null ? "" : v);
        x.font = f(head ? 650 : 400, 22); x.fillStyle = head ? "#718096" : "#172033"; x.textAlign = num ? "right" : "left";
        let t = s; while (t.length > 1 && x.measureText(t).width > colW[i] - 12) t = t.slice(0, -2) + "…";
        x.fillText(t, num ? cx + colW[i] - 8 : cx + 6, y); cx += colW[i];
      });
      x.textAlign = "left"; x.fillStyle = "#E7EAF0"; x.fillRect(50, y + 14, W - 100, 1.5); y += rowH;
    };
    drawRow(data.h, true); data.r.forEach((r) => drawRow(r));
    void cols; return c;
  }
})();
