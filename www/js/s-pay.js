/* Pantallas: Registrar pago, comprobante y recordatorios por WhatsApp. */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, avatar, plural, goAttr, appbar, act, sheet, closeLayer, confirmBox, promptBox, alertBox, toast, fmtIn } = U;

  /* Elegir préstamo para registrar pago (opcionalmente de un cliente). */
  U.pickLoanSheet = (clientId) => {
    const vis = G.visibleClientIds();
    const items = G.upcoming().filter(({ st }) => (!clientId || st.loan.clientId === clientId) && (!vis || vis.has(st.loan.clientId)));
    if (items.length === 1 && clientId) { U.go("pago", { loanId: items[0].st.loan.id }); return; }
    if (!items.length) { sheet("Registrar pago", C.empty("layers", "Sin préstamos activos", clientId ? "Este cliente no tiene saldo pendiente." : "No hay préstamos con saldo.")); return; }
    sheet("¿De qué préstamo es el pago?", `<div class="search" style="margin-bottom:10px"><div class="field">${ic("search")}<input id="pl-q" placeholder="Buscar cliente o préstamo…" autocomplete="off"></div></div><div class="list" id="pl-list"></div>`, (s) => {
      const draw = (q) => {
        q = (q || "").toLowerCase();
        $("#pl-list", s).innerHTML = items.filter(({ st }) => { const c = U.client(st.loan.clientId); return !q || (c && c.name.toLowerCase().includes(q)) || st.loan.num.toLowerCase().includes(q); }).slice(0, 80)
          .map(({ st, c }) => { const cl = U.client(st.loan.clientId); return `<button class="item" ${goAttr("pago", { loanId: st.loan.id })}>${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">#${st.loan.num} · cuota ${c.n} · ${c.overdue ? '<span class="red">vencida</span>' : G.relDay(c.date)}</div></div><span class="amount">${money(c.remaining)}</span></button>`; }).join("") || C.empty("search", "", "Sin resultados");
      };
      draw(); $("#pl-q", s).oninput = (e) => draw(e.target.value);
    });
  };

  // ---------------------------------------------------------------- REGISTRAR PAGO
  S.pago = (p) => {
    const st = G.state().byLoan.get(p.loanId);
    if (!st) return { redirect: U.back };
    if (!G.can("pago.registrar") && !G.can("visita.registrar")) return { html: appbar({ back: true, title: "Registrar pago" }) + `<main class="body">${C.empty("lock", "Sin permiso", "")}</main>` };
    const l = st.loan; const cl = U.client(l.clientId); const c = st.next;
    if (!c) return { html: appbar({ back: true, title: "Registrar pago" }) + `<main class="body">${C.empty("checkcircle", "Préstamo pagado", "Este préstamo ya está pagado completo.")}</main>` };
    if (!p.token) p.token = G.uid(); // evita doble registro si se toca dos veces
    const mode = p.mode || "pago";
    const methods = G.data.settings.paymentMethods;
    const quick = [["Cuota " + c.n, c.remaining]];
    if (st.overdueAmount && st.overdueAmount !== c.remaining) quick.push(["Todo lo vencido", st.overdueAmount]);
    if (st.balance !== c.remaining) quick.push(["Saldo total", st.balance]);
    const amount = p.amount != null ? p.amount : c.remaining;
    return {
      html: appbar({ back: true, title: "Registrar pago", sub: "Préstamo #" + l.num }) + `<main class="body pad-bottom"><form class="form" id="pf" novalidate>
        <div class="item card" style="padding:10px 12px">${avatar(cl)}<div class="grow"><div class="name">${esc(cl ? cl.name : "")}</div><div class="sub">Saldo ${money(st.balance)} · cuota ${c.n} de ${l.count} ${c.overdue ? '· <span class="red">vencida</span>' : "· vence " + G.relDay(c.date).toLowerCase()}</div></div></div>
        ${C.seg("mode", [["pago", ic("dollar") + "Recibí un pago", "on-g"], ["nopago", ic("xcircle") + "No pagó", "on-r"]], mode, "two")}
        ${mode === "pago" ? `
          ${C.field({ id: "pf-amount", label: "Valor recibido", icon: "dollar", value: amount, money: true, req: true })}
          <div class="chips" style="margin-top:-4px">${quick.map(([lb, val]) => `<button type="button" class="chip" data-q="${val}">${esc(lb)} · ${money(val)}</button>`).join("")}</div>
          <div id="pf-prev"></div>
          <div class="grid2">${C.field({ id: "pf-date", label: "Fecha", type: "date", value: p.date || G.today(), attrs: `max="${G.today()}"` })}${C.select({ id: "pf-method", label: "Método", options: methods.map((m) => [m, m]), value: p.method || methods[0] })}</div>
          ${C.field({ id: "pf-note", label: "Observación (opcional)", icon: "note", value: p.note || "", attrs: 'maxlength="120"' })}
          ${cl && cl.phone ? `<label class="check"><input type="checkbox" id="pf-send" ${localStorage.getItem("gp.pay.autosend") === "0" ? "" : "checked"}>Enviar comprobante al WhatsApp de ${esc(cl.name.split(" ")[0])}</label>` : ""}`
        : `${C.field({ id: "pf-date", label: "Fecha de la visita", type: "date", value: G.today() })}
          ${C.seg("vr", [["no_pago", "No pagó"], ["no_encontrado", "No lo encontré"]], p.vr || "no_pago", "two")}
          ${C.textarea({ id: "pf-note", icon: "note", placeholder: "Observación: p. ej. pidió pagar el jueves", value: "" })}
          <p class="hint">La cuota sigue pendiente; no cambia ningún saldo.</p>`}
        <p class="error" id="pf-err"></p>
        <div class="sticky-cta"><button class="btn ${mode === "pago" ? "btn-primary" : "btn-soft"}" type="submit" id="pf-save">${ic("check")}${mode === "nopago" ? "Guardar visita" : "Confirmar pago"}</button></div>
      </form></main>`,
      bind(v) {
        $$("[data-mode]", v).forEach((b) => b.onclick = () => U.setParam({ mode: b.dataset.mode }, true));
        $$("[data-vr]", v).forEach((b) => b.onclick = () => U.setParam({ vr: b.dataset.vr }, true));
        const amt = $("#pf-amount", v);
        const prev = () => {
          if (!amt) return;
          const a = G.parseMoney(amt.value); const box = $("#pf-prev", v);
          U.cur().params.amount = a;
          if (!a) { box.innerHTML = ""; return; }
          if (a > st.balance) { box.innerHTML = C.alert("danger", "alert", "Supera el saldo", "El saldo del préstamo es " + money(st.balance) + ". No se puede recibir más."); return; }
          const pv = G.previewPayment(l.id, a, $("#pf-date", v).value);
          box.innerHTML = C.kv([["Saldo anterior", money(pv.before)], ["Valor recibido", `<span class="green">− ${money(a)}</span>`],
            ["Se aplica a", pv.applied.map((x) => `Cuota ${x.n}: ${money(x.amount)}${x.complete ? " ✓" : ` <span class="amber">(falta ${money(x.remaining)})</span>`}`).join("<br>")],
            ["Capital / interés", `${money(pv.capitalPart)} / ${money(pv.interestPart)}`], ["Saldo nuevo", `<b>${money(pv.after)}</b>`, "total"]]);
        };
        if (amt) { amt.addEventListener("input", prev); $("#pf-date", v).addEventListener("input", prev); prev(); }
        $$("[data-q]", v).forEach((b) => b.onclick = () => { amt.value = fmtIn(+b.dataset.q); prev(); });
        $("#pf", v).onsubmit = async (e) => {
          e.preventDefault();
          const btn = $("#pf-save", v); if (btn.disabled) return;
          const date = $("#pf-date", v).value || G.today();
          if (mode === "nopago") {
            const note = $("#pf-note", v).value.trim(); const vr = p.vr || "no_pago";
            U.busy(btn, true);
            const ok = act(() => { G.ops.addPayment({ loanId: l.id, amount: 0, type: "nopago", date, note, token: p.token }); G.ops.addVisit({ clientId: l.clientId, routeId: p.routeId || null, date, result: vr, note }); });
            U.busy(btn, false);
            if (ok) { toast("Visita registrada", "ok"); U.back(); }
            return;
          }
          const a = G.parseMoney(amt.value);
          if (!U.fieldErrors(v, a > 0 ? (a > st.balance ? { "pf-amount": "Supera el saldo (" + money(st.balance) + ")." } : {}) : { "pf-amount": "Escribe el valor recibido." })) return;
          if (date > G.today()) { U.fieldErrors(v, { "pf-date": "La fecha no puede ser futura." }); return; }
          if (G.isDayClosed(date) && !(await confirmBox("Caja cerrada ese día", `La caja del ${G.fmtDate(date)} ya se cerró. El pago se registrará igual, pero no cambiará ese cierre; revisa la diferencia con un ajuste.`, "Registrar igual"))) return;
          U.busy(btn, true);
          const pay = act(() => G.ops.addPayment({ loanId: l.id, amount: a, date, method: $("#pf-method", v).value, note: $("#pf-note", v).value.trim(), token: p.token }));
          if (pay && p.routeId) { const after = G.computeLoan(U.loanOf(l.id)); act(() => G.ops.addVisit({ clientId: l.clientId, routeId: p.routeId, date, result: a >= c.remaining || after.status === "finalizado" ? "pago_total" : "pago_parcial", paymentId: pay.id })); }
          U.busy(btn, false);
          const sendCk = $("#pf-send", v);
          if (sendCk) { try { localStorage.setItem("gp.pay.autosend", sendCk.checked ? "1" : "0"); } catch (er) { /* sin espacio */ } }
          if (pay) U.go("pagoOk", { id: pay.id, autoSend: !!(sendCk && sendCk.checked) }, true);
        };
      },
    };
  };

  // ---------------------------------------------------------------- PAGO REGISTRADO / COMPROBANTE
  S.pagoOk = (p) => {
    const pay = G.data.payments.find((x) => x.id === p.id);
    if (!pay) return { redirect: U.back };
    const st = G.state().byLoan.get(pay.loanId); const cl = U.client(st.loan.clientId);
    const info = window.Docs.receiptInfo(pay.id);
    return {
      html: `<main class="body" style="padding-top:calc(var(--safe-top) + 24px)">
        <div class="success"><div class="ok">${ic("check")}</div><h2>Pago registrado</h2>
          <p><b>${money(pay.amount)}</b> de ${esc(cl ? cl.name : "")} · recibo ${esc(info.number)}</p></div>
        ${C.kv([["Préstamo", "#" + st.loan.num], ["Cuota", info.cu], ["Método", esc(pay.method || "")], ["Saldo pendiente", info.balance ? `<b>${money(info.balance)}</b>` : '<b class="green">Pagado completo</b>']])}
        <div class="form">
          <button class="btn btn-wa" id="ok-send">${ic("whatsapp")}Enviar comprobante</button>
          <button class="btn btn-soft" ${goAttr("comprobante", { id: pay.id })}>${ic("file")}Ver comprobante</button>
          <button class="link-btn" id="ok-back">Listo</button></div></main>`,
      bind(v) {
        $("#ok-send", v).onclick = () => window.Docs.sendReceipt(pay.id);
        $("#ok-back", v).onclick = () => U.back();
        // Casilla "Enviar comprobante al WhatsApp": se abre el chat del cliente con el comprobante listo
        if (p.autoSend) { p.autoSend = false; setTimeout(() => window.Docs.sendReceipt(pay.id, true), 400); }
      },
    };
  };
  S.comprobante = (p) => {
    const pay = G.data.payments.find((x) => x.id === p.id);
    if (!pay) return { redirect: U.back };
    const info = window.Docs.receiptInfo(pay.id);
    return {
      html: appbar({ back: true, title: "Comprobante " + info.number, sub: "Préstamo #" + info.st.loan.num }) + `<main class="body pad-bottom"><div class="loading" id="rc-load"></div><img class="receipt-img" id="rc-img" alt="Comprobante de pago" hidden>
        ${pay.voided ? C.alert("danger", "ban", "Pago anulado", esc(pay.voidReason || "") + " · " + esc(pay.voidedBy || "")) : ""}
        <div class="sticky-cta"><button class="btn btn-soft" id="rc-pdf">${ic("file")}PDF</button><button class="btn btn-wa" id="rc-send">${ic("whatsapp")}Enviar</button></div></main>`,
      bind(v) {
        setTimeout(() => { const cv = window.Docs.receiptCanvas(pay.id); $("#rc-img", v).src = cv.toDataURL("image/png"); $("#rc-img", v).hidden = false; $("#rc-load", v).remove(); }, 30);
        $("#rc-send", v).onclick = () => window.Docs.sendReceipt(pay.id);
        $("#rc-pdf", v).onclick = () => window.Docs.sharePDF(window.Docs.receiptCanvas(pay.id), "Comprobante_" + info.number, "Comprobante");
      },
    };
  };
  /* Acciones sobre un pago o movimiento en cualquier lista (data-pay / data-mov). */
  U.bindMovRows = (v) => {
    $$("[data-pay]", v).forEach((b) => b.onclick = () => {
      const pay = G.data.payments.find((x) => x.id === b.dataset.pay); if (!pay) return;
      sheet(`Pago de ${money(pay.amount)} · ${G.fmtDate(pay.date)}`, `${pay.voided ? C.alert("danger", "ban", "Anulado", esc(pay.voidReason || "")) : ""}
        ${C.opt("file", "blue", "Ver comprobante", pay.receiptNo || "", goAttr("comprobante", { id: pay.id }))}
        ${!pay.voided ? C.opt("whatsapp", "green", "Enviar comprobante", "WhatsApp, imagen o PDF", 'id="so-send"') : ""}
        ${C.opt("layers", "violet", "Ver préstamo", "", goAttr("prestamo", { id: pay.loanId }))}
        ${!pay.voided && G.can("pago.anular") ? C.opt("ban", "red", "Anular pago", "Queda registrado con el motivo; no se borra", 'id="so-void"') : ""}`, (s) => {
        const sd = $("#so-send", s); if (sd) sd.onclick = () => { closeLayer(); window.Docs.sendReceipt(pay.id); };
        const vd = $("#so-void", s); if (vd) vd.onclick = async () => {
          const r = await promptBox("Anular pago de " + money(pay.amount), "El saldo del préstamo se recalcula. El pago queda visible como anulado en el historial y la auditoría.", "Motivo (obligatorio)", "Anular pago", { danger: true, min: 4, minMsg: "Escribe el motivo (mínimo 4 letras)." });
          if (r) { act(() => G.ops.voidPayment(pay.id, r), "Pago anulado"); U.refresh(); }
        };
      });
    });
    $$("[data-mov]", v).forEach((b) => b.onclick = () => {
      const m = G.data.movements.find((x) => x.id === b.dataset.mov); if (!m) return;
      sheet(esc((G.MOV_KINDS[m.kind] || {}).label || "Movimiento") + ": " + esc(m.concept), C.kv([["Monto", money(m.amount)], ["Fecha", G.fmtDate(m.date)], m.category && ["Categoría", esc(m.category)], m.method && ["Método", esc(m.method)], m.detail && ["Detalle", esc(m.detail)], ["Registró", esc(m.user || "—")], m.voided && ["Anulado", esc(m.voidReason)]]) +
        (!m.voided && G.can("movimiento.registrar") ? `<div style="margin-top:8px">${C.opt("ban", "red", "Anular movimiento", "Queda registrado con el motivo", 'id="so-vm"')}</div>` : ""), (s) => {
        const vm = $("#so-vm", s); if (vm) vm.onclick = async () => { const r = await promptBox("Anular movimiento", "Se conserva en el historial como anulado.", "Motivo (obligatorio)", "Anular", { danger: true, min: 4, minMsg: "Escribe el motivo." }); if (r) { act(() => G.ops.voidMovement(m.id, r), "Movimiento anulado"); U.refresh(); } };
      });
    });
  };

  // ---------------------------------------------------------------- RECORDATORIOS
  const RM_KEY = "gp.remind.sent";
  function sentToday() { try { const o = JSON.parse(localStorage.getItem(RM_KEY)) || {}; return o.date === G.today() ? o : { date: G.today(), ids: {} }; } catch (e) { return { date: G.today(), ids: {} }; } }
  function markSent(id) { const o = sentToday(); o.ids[id] = new Date().toTimeString().slice(0, 5); localStorage.setItem(RM_KEY, JSON.stringify(o)); }
  function clientDue(clientId) {
    const x = G.state().byClient.get(clientId); if (!x) return null;
    const t = G.today(), m = G.addDays(t, 1);
    const r = { client: x.client, debt: x.debt, overdue: 0, overdueN: 0, today: 0, todayItems: [], tomorrow: 0, tomorrowItems: [], next: x.next ? { date: x.next.date, v: x.next.remaining } : null };
    for (const st of x.loans) {
      if (st.status === "finalizado") continue;
      for (const c of st.cuotas) {
        if (c.status === "pagada") continue;
        const it = { num: st.loan.num, n: c.n, count: st.loan.count, v: c.remaining };
        if (c.date < t) { r.overdue += c.remaining; r.overdueN++; } else if (c.date === t) { r.today += c.remaining; r.todayItems.push(it); } else if (c.date === m) { r.tomorrow += c.remaining; r.tomorrowItems.push(it); }
      }
    }
    r.kind = r.overdue ? "vencido" : r.today ? "hoy" : r.tomorrow ? "manana" : null;
    return r;
  }
  U.reminders = () => {
    const out = { vencidos: [], hoy: [], manana: [], sentCount: 0 }; const sent = sentToday().ids; const vis = G.visibleClientIds();
    for (const x of G.state().clients) {
      if (!(x.debt > 0) || (vis && !vis.has(x.client.id))) continue;
      const r = clientDue(x.client.id); if (!r || !r.kind) continue;
      r.sentAt = sent[x.client.id] || null; if (r.sentAt) out.sentCount++;
      (r.kind === "vencido" ? out.vencidos : r.kind === "hoy" ? out.hoy : out.manana).push(r);
    }
    out.vencidos.sort((a, b) => b.overdue - a.overdue);
    return out;
  };
  function reminderText(r) {
    const first = r.client.name.split(" ")[0]; const company = (G.Config.get() || {}).company || "";
    const cuotas = (items) => items.map((i) => `cuota ${i.n} de ${i.count} del préstamo #${i.num} (${money(i.v)})`).join(" y ");
    let msg = `Hola, ${first} 👋\n`;
    if (r.overdue) { msg += `Te recordamos que tienes ${r.overdueN === 1 ? "una cuota vencida" : r.overdueN + " cuotas vencidas"} por *${money(r.overdue)}*.`; if (r.today) msg += `\nAdemás, hoy vence la ${cuotas(r.todayItems)}.`; msg += `\nPor favor ponte al día lo antes posible.`; }
    else if (r.today) msg += `Te recordamos que *hoy* vence tu ${cuotas(r.todayItems)}.`;
    else if (r.tomorrow) { const d = G.parseISO(G.addDays(G.today(), 1)); msg += `Te recordamos que *mañana* (${G.DIAS_LARGO[d.getDay()]} ${d.getDate()}) vence tu ${cuotas(r.tomorrowItems)}.`; }
    else if (r.next) msg += `Tu próxima cuota es de ${money(r.next.v)} el ${G.fmtDate(r.next.date)}.`;
    return msg + `\n\nSaldo total pendiente: *${money(r.debt)}*.\n¡Gracias!\n— ${company}`;
  }
  U.sendReminder = (clientId) => {
    const r = clientDue(clientId); if (!r) return;
    if (!r.client.phone) { alertBox("Sin teléfono", "Agrega el teléfono del cliente en Editar cliente para enviarle recordatorios."); return; }
    const msg = reminderText(r);
    sheet("Recordatorio para " + esc(r.client.name.split(" ")[0]), `<div class="card" style="white-space:pre-wrap;font-size:14px;line-height:1.45;margin-bottom:10px">${esc(msg).replace(/\*([^*]+)\*/g, "<b>$1</b>")}</div>
      <div class="form"><button class="btn btn-wa" id="rm-go">${ic("whatsapp")}Abrir WhatsApp</button><button class="btn btn-soft" id="rm-st">${ic("file")}Enviar con estado de cuenta</button></div>
      <p class="hint" style="margin-top:8px">WhatsApp se abre con el mensaje escrito; tú decides si lo envías.</p>`, (sh) => {
      $("#rm-go", sh).onclick = () => { closeLayer(); markSent(clientId); U.openExternal("https://wa.me/" + U.waNumber(r.client.phone) + "?text=" + encodeURIComponent(msg)); U.refresh(); };
      $("#rm-st", sh).onclick = () => { closeLayer(); window.Docs.sendStatement(clientId, () => { markSent(clientId); U.refresh(); }); };
    });
  };
  S.recordatorios = () => {
    const R = U.reminders();
    const row = (r) => {
      const amt = r.kind === "vencido" ? r.overdue : r.kind === "hoy" ? r.today : r.tomorrow;
      const sub = r.kind === "vencido" ? plural(r.overdueN, "cuota vencida", "cuotas vencidas") : r.kind === "hoy" ? "Vence hoy" : "Vence mañana";
      return `<div class="item">${avatar(r.client)}<div class="grow"><div class="name">${esc(r.client.name)}</div><div class="sub">${sub}</div><div class="sub">Debe en total ${money(r.debt)}</div>${r.sentAt ? `<div class="sub green">${ic("check")}Enviado hoy ${r.sentAt}</div>` : ""}</div>
        <div class="right"><span class="amount ${r.kind === "vencido" ? "red" : ""}">${money(amt)}</span>${r.client.phone ? `<button class="btn sm ${r.sentAt ? "btn-soft" : "btn-wa"}" data-rm="${r.client.id}">${ic("whatsapp", "sm")}${r.sentAt ? "Otra vez" : "Enviar"}</button>` : `<span class="xs muted">Sin teléfono</span>`}</div></div>`;
    };
    const group = (title, list) => list.length ? C.section(`${title} <span class="muted">· ${list.length}</span>`, "", `<div class="list">${list.map(row).join("")}</div>`) : "";
    const total = R.vencidos.length + R.hoy.length + R.manana.length;
    return {
      html: appbar({ back: U.stack.length > 1, title: "Recordatorios", sub: `${R.sentCount} de ${total} enviados hoy` }) + `<main class="body">
        ${total ? `<p class="hint">Toca <b>Enviar</b>: se abre WhatsApp con el mensaje listo. Nada se envía sin tu confirmación.</p>${group("Vencidos", R.vencidos)}${group("Vencen hoy", R.hoy)}${group("Vencen mañana", R.manana)}`
          : C.empty("checkcircle", "Todo al día", "No hay cuotas vencidas, ni para hoy ni para mañana.")}
      </main>`,
      bind(v) { $$("[data-rm]", v).forEach((b) => b.onclick = () => U.sendReminder(b.dataset.rm)); },
    };
  };
})();
