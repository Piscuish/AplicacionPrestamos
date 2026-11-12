/* Núcleo: datos, fechas, dinero y cálculos del negocio.
   Todo se guarda en el teléfono (almacenamiento local de la app). */
(function () {
  "use strict";

  const DATA_KEY = "gp.data.v1";
  const CONFIG_KEY = "gp.config.v1";

  // ================= Fechas =================
  const pad = (n) => String(n).padStart(2, "0");
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const DIAS_LARGO = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function toISO(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function today() { return toISO(new Date()); }
  function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
  function addMonths(iso, n) {
    const d = parseISO(iso); const day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last)); return toISO(d);
  }
  function diffDays(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  function fmtDate(iso) { if (!iso) return ""; const d = parseISO(iso); return d.getDate() + " " + MESES[d.getMonth()] + " " + d.getFullYear(); }
  function fmtDateShort(iso) { const d = parseISO(iso); return d.getDate() + " " + MESES[d.getMonth()]; }
  function fmtDateLong(iso) { const d = parseISO(iso); return DIAS_LARGO[d.getDay()][0].toUpperCase() + DIAS_LARGO[d.getDay()].slice(1) + ", " + d.getDate() + " de " + MESES_LARGO[d.getMonth()] + " " + d.getFullYear(); }
  function relDay(iso) {
    const n = diffDays(today(), iso);
    if (n === 0) return "Hoy"; if (n === 1) return "Mañana"; if (n === -1) return "Ayer";
    return fmtDateShort(iso);
  }

  // ================= Dinero =================
  function money(n) {
    const v = Math.round(Number(n) || 0);
    return (v < 0 ? "-$" : "$") + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function moneyShort(n) {
    const v = Math.abs(n);
    if (v >= 1e6) return (n / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(".", ",").replace(",0", "") + "M";
    if (v >= 1e3) return Math.round(n / 1e3) + "K";
    return String(Math.round(n));
  }
  function parseMoney(s) { return Number(String(s || "").replace(/[^\d]/g, "")) || 0; }

  // ================= Almacenamiento =================
  const EMPTY = () => ({
    clients: [], loans: [], payments: [], movements: [],
    settings: { mora: { enabled: false, type: "percent", value: 5, graceDays: 0, since: null } },
    seq: { loan: 0 },
  });
  let data = load();
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(DATA_KEY));
      if (d && d.clients) { const e = EMPTY(); return Object.assign(e, d, { settings: Object.assign(e.settings, d.settings || {}) }); }
    } catch (e) { /* datos dañados: se empieza vacío */ }
    return EMPTY();
  }
  function save() { localStorage.setItem(DATA_KEY, JSON.stringify(data)); cache = null; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  const Config = {
    get() { try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; } },
    set(v) { localStorage.setItem(CONFIG_KEY, JSON.stringify(v)); },
  };

  // ================= Préstamos: cuotas =================
  const FREQ = {
    diaria: { label: "Diaria", unit: ["día", "días"], cuota: "Cuota diaria" },
    semanal: { label: "Semanal", unit: ["semana", "semanas"], cuota: "Cuota semanal" },
    quincenal: { label: "Quincenal", unit: ["quincena", "quincenas"], cuota: "Cuota quincenal" },
    mensual: { label: "Mensual", unit: ["mes", "meses"], cuota: "Cuota mensual" },
  };
  function dueDate(start, i, freq) {
    if (freq === "diaria") return addDays(start, i);
    if (freq === "semanal") return addDays(start, 7 * i);
    if (freq === "quincenal") return addDays(start, 15 * i);
    return addMonths(start, i);
  }
  function plan(amount, rate, count, freq, start) {
    const interest = Math.round(amount * rate / 100);
    const total = amount + interest;
    const base = Math.floor(total / count);
    const cuotas = [];
    for (let i = 1; i <= count; i++) {
      cuotas.push({ n: i, date: dueDate(start, i, freq), base: i === count ? total - base * (count - 1) : base });
    }
    return { interest, total, cuotaValue: base, cuotas, end: cuotas[count - 1].date };
  }

  function moraAmount(base) {
    const m = data.settings.mora;
    return m.type === "fixed" ? Math.round(m.value) : Math.round(base * m.value / 100);
  }

  /* Calcula el estado de un préstamo: los pagos se aplican en orden a las cuotas
     (si sobra, pasa a la siguiente). */
  function computeLoan(loan, opts) {
    const t = today();
    const p = plan(loan.amount, loan.rate, loan.count, loan.freq, loan.startDate);
    const charges = loan.charges || [];
    const pays = data.payments.filter((x) => x.loanId === loan.id && x.amount > 0)
      .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
    const cuotas = p.cuotas.map((c) => {
      const ch = charges.filter((x) => x.cuota === c.n).reduce((s, x) => s + x.amount, 0);
      return Object.assign({}, c, { charge: ch, due: c.base + ch, paid: 0, paidDate: null });
    });
    // aplicar pagos en cascada
    let ci = 0; let cumulative = 0;
    const payParts = [];
    for (const pay of pays) {
      let left = pay.amount;
      // parte de interés de este pago (proporcional sobre el total pactado; lo que exceda es recargo)
      const inBase = Math.max(0, Math.min(left, p.total - cumulative));
      const interestPart = inBase * (p.interest / p.total) + (left - inBase);
      cumulative += left;
      const part = { id: pay.id, interestPart, capitalPart: left - interestPart, cuotas: [] };
      payParts.push(part);
      while (left > 0 && ci < cuotas.length) {
        const c = cuotas[ci]; const need = c.due - c.paid; const take = Math.min(need, left);
        c.paid += take; left -= take; part.cuotas.push(c.n);
        if (c.paid >= c.due) { c.paidDate = pay.date; ci++; }
      }
    }
    const paid = pays.reduce((s, x) => s + x.amount, 0);
    const totalDue = cuotas.reduce((s, c) => s + c.due, 0);
    const chargesTotal = charges.reduce((s, x) => s + x.amount, 0);
    for (const pp of payParts) pp.balanceAfter = Math.max(0, totalDue - pays.slice(0, payParts.indexOf(pp) + 1).reduce((s, x) => s + x.amount, 0));
    for (const c of cuotas) {
      c.status = c.paid >= c.due ? "pagada" : c.paid > 0 ? "parcial" : "pendiente";
      c.overdue = c.status !== "pagada" && c.date < t;
      c.remaining = c.due - c.paid;
    }
    const balance = Math.max(0, totalDue - paid);
    const paidCount = cuotas.filter((c) => c.status === "pagada").length;
    const overdueCuotas = cuotas.filter((c) => c.overdue);
    const next = cuotas.find((c) => c.status !== "pagada") || null;
    const status = balance <= 0 ? "finalizado" : overdueCuotas.length ? "vencido" : "aldia";
    return {
      loan, plan: p, cuotas, paid, totalDue, chargesTotal, balance, paidCount, next, status,
      overdueCount: overdueCuotas.length, overdueAmount: overdueCuotas.reduce((s, c) => s + c.remaining, 0),
      payParts, interestCollected: payParts.reduce((s, x) => s + x.interestPart, 0),
    };
  }

  /* Aplica recargos por atraso (si están activados). Se aplica una sola vez por cuota. */
  function applyMora() {
    const m = data.settings.mora;
    if (!m.enabled || !m.since || !(m.value > 0)) return false;
    const t = today(); let changed = false;
    for (const loan of data.loans) {
      for (let guard = 0; guard < 3; guard++) {
        const st = computeLoan(loan);
        let added = false;
        for (const c of st.cuotas) {
          const limit = addDays(c.date, m.graceDays || 0);
          if (limit < m.since) continue;
          if ((loan.charges || []).some((x) => x.cuota === c.n)) continue;
          if ((loan.waived || []).includes(c.n)) continue;
          const late = (c.paidDate === null && t > limit) || (c.paidDate !== null && c.paidDate > limit);
          if (late) {
            loan.charges = loan.charges || [];
            loan.charges.push({ cuota: c.n, amount: moraAmount(c.base), date: addDays(limit, 1) });
            added = changed = true;
          }
        }
        if (!added) break;
      }
    }
    if (changed) save();
    return changed;
  }

  // ================= Vistas calculadas =================
  let cache = null;
  function state() {
    if (cache) return cache;
    const loans = data.loans.map((l) => computeLoan(l));
    const byLoan = new Map(loans.map((x) => [x.loan.id, x]));
    const clients = data.clients.map((c) => {
      const ls = loans.filter((x) => x.loan.clientId === c.id);
      const debt = ls.reduce((s, x) => s + x.balance, 0);
      const lent = ls.reduce((s, x) => s + x.loan.amount, 0);
      const paid = ls.reduce((s, x) => s + x.paid, 0);
      const overdue = ls.some((x) => x.status === "vencido");
      const active = ls.some((x) => x.status !== "finalizado");
      return { client: c, loans: ls, debt, lent, paid, overdue, active };
    }).sort((a, b) => a.client.name.localeCompare(b.client.name, "es"));
    const byClient = new Map(clients.map((x) => [x.client.id, x]));
    cache = { loans, byLoan, clients, byClient };
    return cache;
  }

  function totals() {
    const s = state();
    const lent = s.loans.reduce((a, x) => a + x.loan.amount, 0);
    const collected = s.loans.reduce((a, x) => a + x.paid, 0);
    const pending = s.loans.reduce((a, x) => a + x.balance, 0);
    const interest = s.loans.reduce((a, x) => a + x.interestCollected, 0);
    const interestAgreed = s.loans.reduce((a, x) => a + x.plan.interest + x.chargesTotal, 0);
    return {
      lent, collected, pending, interest, interestAgreed,
      interestPending: Math.max(0, interestAgreed - interest),
      recovered: collected - interest,
      clients: data.clients.length,
      activeLoans: s.loans.filter((x) => x.status !== "finalizado").length,
      overdueLoans: s.loans.filter((x) => x.status === "vencido").length,
      overdueAmount: s.loans.reduce((a, x) => a + x.overdueAmount, 0),
    };
  }

  /* Lista de cuotas en un rango de fechas (para calendario y próximos pagos). */
  function cuotasBetween(from, to) {
    const out = [];
    for (const st of state().loans) {
      if (st.status === "finalizado" && !(from <= st.plan.end)) continue;
      for (const c of st.cuotas) {
        if (c.date >= from && c.date <= to) out.push({ st, c });
      }
    }
    return out.sort((a, b) => a.c.date.localeCompare(b.c.date));
  }

  function upcoming(limit) {
    const out = [];
    for (const st of state().loans) {
      if (st.status === "finalizado" || !st.next) continue;
      out.push({ st, c: st.next });
    }
    return out.sort((a, b) => a.c.date.localeCompare(b.c.date)).slice(0, limit || 999);
  }

  /* Finanzas por período */
  function period(key) {
    const t = parseISO(today());
    let from, to = today(), label;
    if (key === "mes") { from = toISO(new Date(t.getFullYear(), t.getMonth(), 1)); label = "Este mes (" + MESES[t.getMonth()] + " " + t.getFullYear() + ")"; }
    else if (key === "mesant") {
      const a = new Date(t.getFullYear(), t.getMonth() - 1, 1); from = toISO(a);
      to = toISO(new Date(t.getFullYear(), t.getMonth(), 0)); label = "Mes anterior (" + MESES[a.getMonth()] + " " + a.getFullYear() + ")";
    }
    else if (key === "anio") { from = t.getFullYear() + "-01-01"; label = "Este año (" + t.getFullYear() + ")"; }
    else { from = "0000-01-01"; label = "Todo el tiempo"; }
    return { key, from, to, label };
  }

  function finance(per) {
    const s = state();
    const inP = (d) => d >= per.from && d <= per.to;
    const parts = new Map();
    s.loans.forEach((x) => x.payParts.forEach((pp) => parts.set(pp.id, pp)));
    const pays = data.payments.filter((p) => p.amount > 0 && inP(p.date));
    const payIncome = pays.reduce((a, p) => a + p.amount, 0);
    const interest = pays.reduce((a, p) => a + (parts.get(p.id) ? parts.get(p.id).interestPart : 0), 0);
    const movIn = data.movements.filter((m) => m.type === "in" && inP(m.date)).reduce((a, m) => a + m.amount, 0);
    const movOut = data.movements.filter((m) => m.type === "out" && inP(m.date)).reduce((a, m) => a + m.amount, 0);
    const lent = data.loans.filter((l) => inP(l.startDate)).reduce((a, l) => a + l.amount, 0);
    return {
      income: payIncome + movIn, expenses: movOut, lent, interest,
      profit: interest + movIn - movOut, payIncome, movIn,
    };
  }

  /* Flujo por semanas (mes) o por meses (año/todo) */
  function flow(per) {
    const buckets = [];
    if (per.key === "mes" || per.key === "mesant") {
      const start = parseISO(per.from); const end = parseISO(per.to);
      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let w = 0; w * 7 < lastDay; w++) {
        const a = toISO(new Date(start.getFullYear(), start.getMonth(), 1 + w * 7));
        const b = toISO(new Date(start.getFullYear(), start.getMonth(), Math.min(lastDay, 7 + w * 7)));
        buckets.push({ label: "Sem " + (w + 1), from: a, to: b });
      }
      void end;
    } else {
      const t = parseISO(today());
      const n = per.key === "anio" ? t.getMonth() + 1 : 6;
      for (let i = n - 1; i >= 0; i--) {
        const a = new Date(t.getFullYear(), t.getMonth() - i, 1);
        const b = new Date(a.getFullYear(), a.getMonth() + 1, 0);
        buckets.push({ label: MESES[a.getMonth()], from: toISO(a), to: toISO(b) });
      }
    }
    return buckets.map((b) => {
      const f = finance(b);
      return { label: b.label, income: f.income, expenses: f.expenses };
    });
  }

  /* Movimientos: pagos, préstamos entregados, ingresos y gastos manuales */
  function movements() {
    const s = state(); const out = [];
    for (const p of data.payments) {
      const st = s.byLoan.get(p.loanId); if (!st) continue;
      const c = data.clients.find((x) => x.id === st.loan.clientId);
      if (p.amount > 0) out.push({ kind: "pay", sign: 1, amount: p.amount, date: p.date, title: "Pago de cuota", sub: (c ? c.name : "") + " • #" + st.loan.num, ref: p, ts: p.createdAt });
    }
    for (const l of data.loans) {
      const c = data.clients.find((x) => x.id === l.clientId);
      out.push({ kind: "loan", sign: 0, amount: l.amount, date: l.startDate, title: "Préstamo entregado", sub: (c ? c.name : "") + " • #" + l.num, ref: l, ts: l.createdAt });
    }
    for (const m of data.movements) {
      out.push({ kind: m.type === "in" ? "in" : "out", sign: m.type === "in" ? 1 : -1, amount: m.amount, date: m.date, title: m.concept, sub: m.detail || (m.type === "in" ? "Ingreso" : "Gasto"), ref: m, ts: m.createdAt });
    }
    return out.sort((a, b) => (b.date + (b.ts || "")).localeCompare(a.date + (a.ts || "")));
  }

  // ================= Operaciones =================
  const ops = {
    saveClient(c) {
      if (c.id) { const i = data.clients.findIndex((x) => x.id === c.id); data.clients[i] = Object.assign(data.clients[i], c); }
      else { c.id = uid(); c.createdAt = c.createdAt || today(); data.clients.push(c); }
      save(); return c;
    },
    deleteClient(id) {
      if (data.loans.some((l) => l.clientId === id)) return false;
      data.clients = data.clients.filter((x) => x.id !== id); save(); return true;
    },
    createLoan(l) {
      data.seq.loan = (data.seq.loan || 0) + 1;
      l.id = uid(); l.num = "P-" + String(data.seq.loan).padStart(4, "0"); l.charges = []; l.createdAt = new Date().toISOString();
      data.loans.push(l); save(); return l;
    },
    deleteLoan(id) {
      data.loans = data.loans.filter((x) => x.id !== id);
      data.payments = data.payments.filter((x) => x.loanId !== id); save();
    },
    addPayment(p) { p.id = uid(); p.createdAt = new Date().toISOString(); data.payments.push(p); save(); applyMora(); return p; },
    deletePayment(id) { data.payments = data.payments.filter((x) => x.id !== id); save(); },
    removeCharge(loanId, cuota) {
      const l = data.loans.find((x) => x.id === loanId);
      l.charges = (l.charges || []).filter((x) => x.cuota !== cuota);
      l.waived = (l.waived || []).concat(cuota); save();
    },
    addMovement(m) { m.id = uid(); m.createdAt = new Date().toISOString(); data.movements.push(m); save(); return m; },
    deleteMovement(id) { data.movements = data.movements.filter((x) => x.id !== id); save(); },
    saveMora(m) {
      const cur = data.settings.mora;
      if (m.enabled && !cur.enabled) m.since = today();
      if (!m.enabled) m.since = null;
      else if (!m.since) m.since = cur.since || today();
      data.settings.mora = m; save(); applyMora();
    },
    exportAll() { return JSON.stringify({ app: "GestionPrestamos", version: 1, exportedAt: new Date().toISOString(), config: Config.get(), data }, null, 1); },
    importAll(json) {
      const o = JSON.parse(json);
      if (!o || o.app !== "GestionPrestamos" || !o.data || !o.data.clients) throw new Error("archivo");
      data = Object.assign(EMPTY(), o.data); save();
      if (o.config && o.config.passwordHash) Config.set(o.config);
    },
  };

  window.GP = {
    get data() { return data; }, save, uid, Config,
    today, toISO, parseISO, addDays, addMonths, diffDays, fmtDate, fmtDateShort, fmtDateLong, relDay,
    MESES, MESES_LARGO, DIAS,
    money, moneyShort, parseMoney,
    FREQ, plan, computeLoan, applyMora, state, totals, cuotasBetween, upcoming,
    period, finance, flow, movements, ops,
  };
})();
