/* Pantallas: Cobros (del día) y Calendario (mes / semana / día). */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, avatar, plural, goAttr, appbar, act, sheet, closeLayer, confirmBox, toast } = U;

  /* Lista de cobros de un día, con acción directa de registrar pago. */
  function collectionList(rows, date) {
    if (!rows.length) return `<div class="card">${C.empty("calendar", "Sin cobros", G.noPayReason(date) ? "Día sin cobro: " + esc(G.noPayReason(date)) : "No hay cuotas para este día.")}</div>`;
    return `<div class="list">${rows.map((r) => {
      const c = r.x.client; const loanId = r.loans.find((id) => { const st = G.state().byLoan.get(id); return st && st.status !== "finalizado"; }) || r.loans[0];
      return `<div class="item">${avatar(c)}<button class="grow" style="background:none;border:0;text-align:left;padding:0;color:inherit;min-width:0" ${goAttr("cliente", { id: c.id })}>
        <div class="name">${esc(c.name)}</div><div class="sub">${esc(c.address || c.phone || "")}</div>
        <div class="sub">Debe ${money(r.owed)}${r.received ? ` · <span class="green">recibió ${money(r.received)}</span>` : ""}${r.pending && r.received ? ` · falta ${money(r.pending)}` : ""}</div></button>
        <div class="right">${C.badge(U.statusTone(r.status), U.colLabel(r.status))}
        ${r.pending > 0 && G.can("pago.registrar") && loanId ? `<button class="btn sm btn-primary" ${goAttr("pago", { loanId, date })}>${ic("dollar", "sm")}Cobrar</button>` : ""}</div></div>`;
    }).join("")}</div>`;
  }
  U.collectionList = collectionList;

  // ---------------------------------------------------------------- COBROS (pestaña)
  S.cobros = (p) => {
    const date = p.date || G.today();
    const f = p.f || "todos";
    let rows = U.myCollections(date);
    const exp = rows.reduce((s, r) => s + r.owed, 0), rec = rows.reduce((s, r) => s + r.received, 0), pend = rows.reduce((s, r) => s + r.pending, 0);
    const totalN = rows.length, base = rows;
    const cnt = (k) => base.filter((r) => k === "pendiente" ? r.pending > 0 : r.status === k).length;
    if (f === "pendiente") rows = rows.filter((r) => r.pending > 0); else if (f !== "todos") rows = rows.filter((r) => r.status === f);
    const myRoutes = G.data.routes.filter((r) => r.status !== "archivada" && (G.can("ver.todo") || r.collectorId === (G.session || {}).id || ((G.data.users.find((u) => u.id === (G.session || {}).id) || {}).routeIds || []).includes(r.id)));
    const wd = G.parseISO(date).getDay();
    const todayRoutes = myRoutes.filter((r) => !(r.days || []).length || r.days.includes(wd));
    return {
      html: appbar({ title: "Cobros", sub: G.fmtDateLong(date), right: `<button class="icon-btn" ${goAttr("calendario")} aria-label="Calendario">${ic("calendar")}</button>` }) + `<main class="body">
        <div class="toolbar"><button class="icon-btn" id="cb-prev" aria-label="Día anterior">${ic("left")}</button><div class="field grow" style="min-height:44px"><input id="cb-date" type="date" value="${date}" aria-label="Fecha"></div><button class="icon-btn" id="cb-next" aria-label="Día siguiente">${ic("right")}</button>${date !== G.today() ? `<button class="btn sm btn-soft" id="cb-today">Hoy</button>` : ""}</div>
        <div class="card" style="padding:12px 14px"><div class="grid2" style="grid-template-columns:repeat(3,1fr)">
          <div><div class="kpi-label">Esperado</div><div class="strong tnum">${money(exp)}</div></div>
          <div><div class="kpi-label">Recibido</div><div class="strong tnum green">${money(rec)}</div></div>
          <div><div class="kpi-label">Falta</div><div class="strong tnum ${pend ? "red" : ""}">${money(pend)}</div></div></div>
          <div style="margin-top:10px">${C.progress(exp ? rec / exp : 0)}</div></div>
        ${todayRoutes.length ? C.section("Rutas del día", `<button class="h-link" ${goAttr("rutas")}>Todas</button>`, `<div class="list">${todayRoutes.map((r) => `<button class="item" ${goAttr("rutaRun", { id: r.id, date })}><span class="lead-ico t-violet">${ic("route")}</span><div class="grow"><div class="name">${esc(r.name)}</div><div class="sub">${plural((r.clientIds || []).length, "cliente", "clientes")}${r.zone ? " · " + esc(r.zone) : ""}</div></div><span class="btn sm btn-soft">${ic("play", "sm")}Ejecutar</span></button>`).join("")}</div>`) : ""}
        ${C.chips("f", [["todos", "Todos " + totalN], ["pendiente", "Por cobrar " + cnt("pendiente")], ["pagado", "Pagados " + cnt("pagado")], ["parcial", "Parciales " + cnt("parcial")]], f)}
        ${collectionList(rows, date)}
        ${G.can("pago.registrar") ? `<button class="btn btn-soft" ${goAttr("recordatorios")}>${ic("whatsapp")}Recordatorios por WhatsApp</button>` : ""}
      </main>`,
      bind(v) {
        const set = (d) => U.setParam({ date: d }, true);
        $("#cb-date", v).onchange = (e) => e.target.value && set(e.target.value);
        $("#cb-prev", v).onclick = () => set(G.addDays(date, -1));
        $("#cb-next", v).onclick = () => set(G.addDays(date, 1));
        const t = $("#cb-today", v); if (t) t.onclick = () => set(G.today());
        $$("[data-f]", v).forEach((b) => b.onclick = () => U.setParam({ f: b.dataset.f }, true));
      },
    };
  };

  // ---------------------------------------------------------------- CALENDARIO
  function dayInfo(list) {
    const k = { g: 0, a: 0, r: 0, b: 0, total: 0, paid: 0 }; const t = G.today();
    for (const { c } of list) { k.total += c.due; k.paid += c.paid; if (c.status === "pagada") k.g++; else if (c.status === "parcial") k.a++; else if (c.date < t) k.r++; else k.b++; }
    return k;
  }
  const dots = (k) => ["g", "a", "r", "b"].filter((x) => k[x]).map((x) => `<i class="d-${x}"></i>`).join("");
  S.calendario = (p) => {
    const t = G.today(); const sel = p.sel || t; const view = p.view || "mes";
    const vis = G.visibleClientIds();
    const between = (a, b) => G.cuotasBetween(a, b).filter(({ st }) => !vis || vis.has(st.loan.clientId));
    const npRules = G.noPayRules([]);
    let top = "";
    if (view === "mes") {
      const ym = p.ym || sel.slice(0, 7); const [Y, M] = ym.split("-").map(Number);
      const first = new Date(Y, M - 1, 1); const off = (first.getDay() + 6) % 7;
      const gs = G.toISO(new Date(Y, M - 1, 1 - off)); const ge = G.addDays(gs, 41);
      const byDay = {}; between(gs, ge).forEach((it) => (byDay[it.c.date] = byDay[it.c.date] || []).push(it));
      let cells = "";
      for (let i = 0; i < 42; i++) {
        const d = G.addDays(gs, i); const dd = G.parseISO(d);
        cells += `<button class="cal-day ${dd.getMonth() !== M - 1 ? "out" : ""} ${G.isNoPay(d, npRules) ? "nopay" : ""} ${d === t ? "today" : ""} ${d === sel ? "sel" : ""}" data-d="${d}" aria-label="${G.fmtDate(d)}">${dd.getDate()}<span class="dots">${byDay[d] ? dots(dayInfo(byDay[d])) : ""}</span></button>`;
      }
      top = `<div class="cal"><div class="cal-head"><button class="icon-btn" data-ym="${G.toISO(new Date(Y, M - 2, 1)).slice(0, 7)}" aria-label="Mes anterior">${ic("left")}</button><h3>${G.MESES_LARGO[M - 1][0].toUpperCase() + G.MESES_LARGO[M - 1].slice(1)} ${Y}</h3><button class="icon-btn" data-ym="${G.toISO(new Date(Y, M, 1)).slice(0, 7)}" aria-label="Mes siguiente">${ic("right")}</button></div>
        <div class="cal-grid">${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}${cells}</div></div>
        <div class="legend"><span><i class="d-g"></i>Pagado</span><span><i class="d-a"></i>Parcial</span><span><i class="d-r"></i>Vencido</span><span><i class="d-b"></i>Pendiente</span></div>`;
    } else if (view === "semana") {
      const wd = (G.parseISO(sel).getDay() + 6) % 7; const ws = G.addDays(sel, -wd);
      const byDay = {}; between(ws, G.addDays(ws, 6)).forEach((it) => (byDay[it.c.date] = byDay[it.c.date] || []).push(it));
      top = `<div class="between"><button class="icon-btn" data-wk="${G.addDays(ws, -7)}" aria-label="Semana anterior">${ic("left")}</button><b>${G.fmtDateShort(ws)} – ${G.fmtDateShort(G.addDays(ws, 6))}</b><button class="icon-btn" data-wk="${G.addDays(ws, 7)}" aria-label="Semana siguiente">${ic("right")}</button></div>
        <div class="week-strip">${[0, 1, 2, 3, 4, 5, 6].map((i) => { const d = G.addDays(ws, i); const k = byDay[d] ? dayInfo(byDay[d]) : null; return `<button class="${d === sel ? "sel" : ""} ${d === t ? "today" : ""}" data-d="${d}"><small>${G.DIAS[G.parseISO(d).getDay()]}</small><b>${G.parseISO(d).getDate()}</b><span class="dots">${k ? dots(k) : ""}</span><em>${k ? G.moneyShort(k.total) : G.isNoPay(d, npRules) ? "—" : ""}</em></button>`; }).join("")}</div>`;
    } else {
      top = `<div class="toolbar"><button class="icon-btn" data-d="${G.addDays(sel, -1)}" aria-label="Día anterior">${ic("left")}</button><div class="field grow" style="min-height:44px"><input id="cal-date" type="date" value="${sel}"></div><button class="icon-btn" data-d="${G.addDays(sel, 1)}" aria-label="Día siguiente">${ic("right")}</button></div>`;
    }
    const k = dayInfo(between(sel, sel));
    const rows = U.myCollections(sel);
    const reason = G.noPayReason(sel);
    return {
      html: appbar({ back: U.stack.length > 1, title: "Calendario de cobros" }) + `<main class="body">
        ${C.seg("view", [["mes", "Mes"], ["semana", "Semana"], ["dia", "Día"]], view)}
        ${top}
        ${C.section(G.fmtDateLong(sel), "", (reason ? C.alert("info", "ban", "Día sin cobro", esc(reason)) : "") + C.kv([["Esperado del día", money(k.total)], ["Recibido de esas cuotas", `<span class="green">${money(k.paid)}</span>`], ["Saldo", money(Math.max(0, k.total - k.paid))]]))}
        ${collectionList(rows, sel)}
        ${G.can("config.editar") ? noPayActions(sel) : ""}
      </main>`,
      bind(v) {
        $$("[data-view]", v).forEach((b) => b.onclick = () => U.setParam({ view: b.dataset.view }, true));
        $$("[data-d]", v).forEach((b) => b.onclick = () => U.setParam({ sel: b.dataset.d, ym: b.dataset.d.slice(0, 7) }, true));
        $$("[data-ym]", v).forEach((b) => b.onclick = () => U.setParam({ ym: b.dataset.ym }, true));
        $$("[data-wk]", v).forEach((b) => b.onclick = () => U.setParam({ sel: b.dataset.wk }, true));
        const cd = $("#cal-date", v); if (cd) cd.onchange = (e) => e.target.value && U.setParam({ sel: e.target.value }, true);
        bindNoPay(v, sel);
      },
    };
  };
  function noPayActions(sel) {
    const np = G.data.settings.noPay;
    const fest = (np.dates || []).find((x) => (x.date || x) === sel);
    if (fest) return `<button class="btn btn-soft" id="cal-unfest">${ic("x")}Quitar día sin cobro</button>`;
    const wdRule = (np.weekdays || []).includes(G.parseISO(sel).getDay());
    const co = np.colombia !== false && G.colombiaHolidays(+sel.slice(0, 4)).map.get(sel);
    if (co && !wdRule) return (np.colombiaOff || []).includes(sel) ? `<button class="btn btn-soft" id="cal-co-on">${ic("calendar")}No cobrar este festivo</button>` : `<button class="btn btn-soft" id="cal-co-off">${ic("dollar")}Cobrar en este festivo</button>`;
    if (wdRule) return `<p class="hint center">Este día de la semana no se cobra. Cámbialo en Configuración → Finanzas.</p>`;
    return `<button class="btn btn-soft" id="cal-fest">${ic("calendar")}Marcar como día sin cobro</button>`;
  }
  function bindNoPay(v, sel) {
    const fb = $("#cal-fest", v);
    if (fb) fb.onclick = () => sheet("Día sin cobro", `<p class="hint">Nadie paga este día. Las cuotas se corren al siguiente día de cobro y no cuentan como atraso.</p><div class="form" style="margin-top:10px"><div class="field">${ic("note")}<input id="fe-note" maxlength="40" placeholder="Motivo: p. ej. Festivo"></div><button class="btn btn-primary" id="fe-ok">${ic("check")}Marcar</button></div>`, (sh) => {
      $("#fe-ok", sh).onclick = () => { closeLayer(); act(() => G.ops.addNoPayDate(sel, $("#fe-note", sh).value.trim() || "Festivo"), "Día sin cobro agregado"); G.applyMora(); U.refresh(); };
    });
    const off = $("#cal-co-off", v); if (off) off.onclick = async () => { if (await confirmBox("¿Cobrar en este festivo?", "Las cuotas que se habían corrido regresan a esa fecha.", "Cobrar este día")) { act(() => G.ops.toggleColombiaDay(sel, true), "Ese festivo ahora se cobra"); U.refresh(); } };
    const on = $("#cal-co-on", v); if (on) on.onclick = () => { act(() => G.ops.toggleColombiaDay(sel, false), "Festivo sin cobro"); G.applyMora(); U.refresh(); };
    const ub = $("#cal-unfest", v); if (ub) ub.onclick = async () => { if (await confirmBox("¿Quitar día sin cobro?", "Vuelve a ser día de cobro y las cuotas regresan a esa fecha.", "Quitar")) { act(() => G.ops.removeNoPayDate(sel), "Listo"); U.refresh(); } };
  }
})();
