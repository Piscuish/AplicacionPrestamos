/* Pruebas de la lógica de negocio (www/js/core.js).
   Ejecutar:  node --test tests/
   No necesita instalar nada: carga core.js en un entorno simulado del navegador. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CORE = fs.readFileSync(path.join(__dirname, "..", "www", "js", "core.js"), "utf8");

function boot(store) {
  const mem = Object.assign({}, store || {});
  const localStorage = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
  const window = {};
  const ctx = { window, localStorage, crypto: globalThis.crypto, TextEncoder, TextDecoder, console, setTimeout, clearTimeout, Date, Math, JSON };
  vm.createContext(ctx);
  vm.runInContext(CORE, ctx);
  const G = window.GP;
  return { G, mem };
}
async function admin(store) {
  const env = boot(Object.assign({ "gp.config.v1": JSON.stringify(await adminConfig()) }, store || {}));
  const s = await env.G.login("admin", "secreto1");
  assert.ok(s, "login admin");
  return env;
}
let cfgCache = null;
async function adminConfig() {
  if (cfgCache) return cfgCache;
  const salt = "abc123";
  const hex = (b) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
  const h = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":secreto1")));
  cfgCache = { company: "Prueba", username: "admin", salt, passwordHash: h };
  return cfgCache;
}
const sumBy = (a, f) => a.reduce((s, x) => s + f(x), 0);
const plain = (v) => JSON.parse(JSON.stringify(v)); // objetos creados dentro del entorno simulado

// ---------------------------------------------------------------- clientes
test("1. crear cliente (solo el nombre es obligatorio)", async () => {
  const { G } = await admin();
  const c = G.ops.saveClient({ name: "Ana Pérez" });
  assert.ok(c.id);
  assert.equal(G.data.clients.length, 1);
  assert.equal(c.status, "activo");
  assert.throws(() => G.ops.saveClient({ name: "A" }), /nombre/i);
});

test("2. editar cliente guarda historial de cambios (campo, antes, después, usuario)", async () => {
  const { G } = await admin();
  const c = G.ops.saveClient({ name: "Ana Pérez", phone: "3001234567" });
  G.ops.saveClient({ id: c.id, name: "Ana María Pérez", phone: "3001234567", barrio: "Centro" });
  const a = G.data.audit.find((x) => x.entity === "cliente" && x.action === "editar");
  assert.ok(a);
  assert.equal(a.user, "admin");
  const nameChange = a.changes.find((x) => x.field === "name");
  assert.deepEqual([nameChange.from, nameChange.to], ["Ana Pérez", "Ana María Pérez"]);
  assert.ok(a.changes.some((x) => x.field === "barrio" && x.to === "Centro"));
  assert.ok(!a.changes.some((x) => x.field === "phone"), "no registra campos sin cambio");
});

test("documento duplicado se rechaza", async () => {
  const { G } = await admin();
  G.ops.saveClient({ name: "Uno", doc: "1.234.567", docType: "CC" });
  assert.throws(() => G.ops.saveClient({ name: "Dos", doc: "1234567", docType: "CC" }), /documento/);
});

// ---------------------------------------------------------------- préstamos
function newLoan(G, o) {
  const c = G.ops.saveClient({ name: "Cliente " + Math.random().toString(36).slice(2, 6) });
  return G.ops.createLoan(Object.assign({ clientId: c.id, amount: 100000, rate: 20, count: 4, freq: "semanal", startDate: G.today() }, o || {}));
}

test("3-5. crear préstamo, interés único y cuotas", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  const st = G.computeLoan(l);
  assert.equal(l.num, "P-0001");
  assert.equal(l.interestMode, "flat");
  assert.equal(st.plan.interest, 20000);
  assert.equal(st.plan.total, 120000);
  assert.equal(st.cuotas.length, 4);
  assert.equal(sumBy(st.cuotas, (c) => c.base), 120000, "las cuotas suman el total exacto");
  assert.equal(sumBy(st.cuotas, (c) => c.capital), 100000, "capital de la tabla = monto prestado");
  assert.equal(sumBy(st.cuotas, (c) => c.interest), 20000, "interés de la tabla = interés pactado");
  st.cuotas.forEach((c, i) => { if (i) assert.ok(c.date > st.cuotas[i - 1].date); });
});

test("cuotas que no dividen exacto: la última absorbe el residuo (pesos enteros)", async () => {
  const { G } = await admin();
  const p = G.plan(100000, 10, 3, "semanal", G.today(), [], {});
  assert.deepEqual(plain(p.cuotas.map((c) => c.base)), [36666, 36666, 36668]);
  p.cuotas.forEach((c) => assert.ok(Number.isInteger(c.base) && Number.isInteger(c.capital) && Number.isInteger(c.interest)));
});

test("interés mensual simple: 5% mensual, 8 cuotas semanales ≈ 1,87 meses", async () => {
  const { G } = await admin();
  const i = G.interestFor(1000000, 5, 8, "semanal", "mensual");
  assert.equal(i, Math.round(1000000 * 0.05 * (8 * 7 / 30)));
  assert.equal(G.interestFor(1000000, 5, 8, "semanal", "flat"), 50000);
});

test("fecha del primer pago se respeta", async () => {
  const { G } = await admin();
  const first = G.addDays(G.today(), 10);
  const l = newLoan(G, { freq: "mensual", firstDate: first });
  const st = G.computeLoan(l);
  assert.ok(st.cuotas[0].date >= first && G.diffDays(first, st.cuotas[0].date) <= 3);
});

test("validación legal: tasa E.A. contra la tasa de usura configurada", async () => {
  const { G } = await admin();
  const p = G.plan(1000000, 20, 4, "semanal", G.today(), [], {});
  const ea = G.effectiveAnnualRate(1000000, p.cuotas, G.today());
  assert.ok(ea > 100, "20% en un mes es una tasa E.A. altísima");
  G.ops.saveSettings({ legal: { usuryEA: 25, block: true } });
  const c = G.ops.saveClient({ name: "Legal" });
  assert.throws(() => G.ops.createLoan({ clientId: c.id, amount: 1000000, rate: 20, count: 4, freq: "semanal", startDate: G.today() }), /usura/);
});

// ---------------------------------------------------------------- pagos
test("6. pago completo de una cuota", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today(), method: "Efectivo" });
  const st = G.computeLoan(l);
  assert.equal(st.cuotas[0].status, "pagada");
  assert.equal(st.balance, 90000);
});

test("7. pago parcial: la cuota NO queda pagada si queda saldo", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  G.ops.addPayment({ loanId: l.id, amount: 29999, date: G.today() });
  const c = G.computeLoan(l).cuotas[0];
  assert.equal(c.status, "parcial");
  assert.equal(c.remaining, 1);
});

test("8-9. pago mayor a la cuota: el excedente pasa a las siguientes", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  const pv = G.previewPayment(l.id, 75000, G.today());
  assert.deepEqual(plain(pv.applied.map((a) => [a.n, a.amount, a.complete])), [[1, 30000, true], [2, 30000, true], [3, 15000, false]]);
  assert.equal(pv.before, 120000); assert.equal(pv.after, 45000);
  assert.equal(G.data.payments.length, 0, "la vista previa no guarda nada");
  G.ops.addPayment({ loanId: l.id, amount: 75000, date: G.today() });
  const st = G.computeLoan(l);
  assert.deepEqual(plain(st.cuotas.map((c) => c.status)), ["pagada", "pagada", "parcial", "pendiente"]);
});

test("10. saldo pendiente y abonos no alteran el capital original", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  G.ops.addPayment({ loanId: l.id, amount: 10000, date: G.today() });
  G.ops.addPayment({ loanId: l.id, amount: 20000, date: G.today(), token: "b" });
  const st = G.computeLoan(l);
  assert.equal(l.amount, 100000);
  assert.equal(st.plan.total, 120000);
  assert.equal(st.balance, 90000);
  assert.equal(st.interestCollected + st.capitalRecovered, 30000);
  assert.equal(st.interestCollected, 5000, "interés proporcional: 30.000 × 20.000/120.000");
});

test("no se puede pagar más que el saldo", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  assert.throws(() => G.ops.addPayment({ loanId: l.id, amount: 120001, date: G.today() }), /saldo/);
});

test("un pago NUNCA se cuenta dos veces (token y doble toque)", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  const a = G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today(), token: "t1" });
  const b = G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today(), token: "t1" });
  assert.equal(a.id, b.id);
  assert.throws(() => G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today(), token: "t2" }), /ya se registró/);
  assert.equal(G.data.payments.length, 1);
  const pays = G.movements().filter((m) => m.kind === "pay");
  assert.equal(pays.length, 1);
  assert.equal(G.finance(G.period("todo")).payIncome, 30000);
});

test("anular un pago: queda auditado y deja de contar", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  const p = G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today() });
  assert.throws(() => G.ops.voidPayment(p.id, ""), /motivo/);
  G.ops.voidPayment(p.id, "Se registró al cliente equivocado");
  assert.equal(G.data.payments.length, 1, "no se borra");
  assert.equal(G.computeLoan(l).balance, 120000);
  assert.equal(G.finance(G.period("todo")).payIncome, 0);
  assert.ok(G.data.audit.some((a) => a.action === "anular" && /equivocado/.test(a.detail)));
});

test("préstamo con pagos no se puede eliminar", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today() });
  assert.throws(() => G.ops.deleteLoan(l.id), /pagos/);
});

// ---------------------------------------------------------------- mora y estados
test("11. identificar mora y estados del cliente", async () => {
  const { G } = await admin();
  const start = G.addDays(G.today(), -40);
  const l = newLoan(G, { startDate: start, freq: "semanal", count: 4 });
  const x = G.state().byClient.get(l.clientId);
  assert.equal(x.status, "mora");
  assert.ok(x.maxLate > 3);
  const ok = newLoan(G);
  assert.equal(G.state().byClient.get(ok.clientId).status, "aldia");
  const c = G.ops.saveClient({ name: "Sin préstamo" });
  assert.equal(G.state().byClient.get(c.id).status, "sinprestamos");
  G.ops.setClientStatus(c.id, "inactivo");
  assert.equal(G.state().byClient.get(c.id).status, "inactivo");
});

// ---------------------------------------------------------------- finanzas
test("12-14. recaudación, capital disponible, ingresos y gastos (reglas contables)", async () => {
  const { G } = await admin();
  G.ops.addMovement({ kind: "aporte", concept: "Capital inicial", amount: 500000, date: G.today(), method: "Efectivo" });
  const l = newLoan(G); // sale 100.000
  G.ops.addPayment({ loanId: l.id, amount: 60000, date: G.today(), method: "Efectivo" });
  G.ops.addMovement({ kind: "gasto", concept: "Transporte", amount: 8000, date: G.today(), method: "Efectivo" });
  G.ops.addMovement({ kind: "ingreso", concept: "Otro", amount: 2000, date: G.today(), method: "Efectivo" });
  const f = G.finance(G.period("todo"));
  assert.equal(f.payIncome, 60000, "recaudación");
  assert.equal(f.interest, 10000, "60.000 × 20/120");
  assert.equal(f.capitalRecovered, 50000);
  assert.equal(f.income, 62000, "pagos + otros ingresos (el aporte NO es ingreso)");
  assert.equal(f.expenses, 8000, "el préstamo entregado NO es gasto");
  assert.equal(f.profit, 10000 + 2000 - 8000, "ganancia = interés cobrado + otros ingresos − gastos");
  assert.equal(G.cashAvailable(), 500000 - 100000 + 60000 - 8000 + 2000);
  const T = G.totals();
  assert.equal(T.interestPending, 10000, "interés pendiente no es dinero recibido");
  assert.equal(T.capitalPending, 50000);
});

test("finanzas cuadran con los movimientos reales", async () => {
  const { G } = await admin();
  G.ops.addMovement({ kind: "aporte", concept: "Capital", amount: 300000, date: G.today() });
  const l = newLoan(G);
  G.ops.addPayment({ loanId: l.id, amount: 45000, date: G.today() });
  G.ops.addMovement({ kind: "gasto", concept: "Papelería", amount: 5000, date: G.today() });
  const net = G.movements().reduce((s, m) => s + m.sign * m.amount, 0);
  assert.equal(net, G.cashAvailable());
});

// ---------------------------------------------------------------- caja
test("15. cerrar caja: esperado, contado, diferencia y bloqueo", async () => {
  const { G } = await admin();
  const d = G.today();
  G.ops.openCash(d, 200000);
  const l = newLoan(G, { method: "Efectivo" });
  G.ops.addPayment({ loanId: l.id, amount: 30000, date: d, method: "Efectivo" });
  G.ops.addPayment({ loanId: l.id, amount: 25000, date: d, method: "Transferencia", token: "x" });
  G.ops.addMovement({ kind: "gasto", concept: "Almuerzo", amount: 10000, date: d, method: "Efectivo" });
  const r = G.cashDay(d);
  assert.equal(r.expected, 200000 - 100000 + 30000 - 10000, "la transferencia no entra a la caja física");
  assert.equal(r.payOther, 25000);
  const s = G.ops.closeCash(d, 119000, "faltan mil");
  assert.equal(s.diff, -1000);
  assert.throws(() => G.ops.addMovement({ kind: "gasto", concept: "x", amount: 1000, date: d }), /cerrada/);
  assert.throws(() => G.ops.closeCash(d, 1, ""), /cerrada/);
  G.ops.addMovement({ kind: "ajuste", type: "in", concept: "Ajuste", detail: "Se encontró el billete", amount: 1000, date: d });
  assert.equal(G.data.cash.find((c) => c.date === d).counted, 119000, "el cierre no se edita");
});

// ---------------------------------------------------------------- carteras y rutas
test("16. asociar clientes a carteras sin tocar condiciones financieras", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  const before = JSON.stringify(G.computeLoan(l).cuotas);
  const p = G.ops.savePortfolio({ name: "Norte" });
  G.ops.assignPortfolio([l.clientId], p.id);
  assert.equal(G.data.clients.find((c) => c.id === l.clientId).portfolioId, p.id);
  assert.equal(G.data.loans[0].portfolioId, p.id);
  assert.equal(JSON.stringify(G.computeLoan(l).cuotas), before);
  assert.throws(() => G.ops.savePortfolio({ name: "norte" }), /existe/);
});

test("17. asignar clientes a rutas: un cliente en una sola ruta", async () => {
  const { G } = await admin();
  const a = G.ops.saveClient({ name: "Cliente A" }), b = G.ops.saveClient({ name: "Cliente B" });
  const r1 = G.ops.saveRoute({ name: "Ruta 1", days: [1], clientIds: [a.id, b.id] });
  const r2 = G.ops.saveRoute({ name: "Ruta 2", days: [2], clientIds: [b.id] });
  assert.deepEqual(plain(G.data.routes.find((r) => r.id === r1.id).clientIds), [a.id]);
  assert.deepEqual(plain(r2.clientIds), [b.id]);
  assert.equal(G.state().byClient.get(b.id).route.id, r2.id);
});

test("cobros del día: esperado, recibido y faltante", async () => {
  const { G } = await admin();
  const l = newLoan(G, { freq: "diaria", count: 10, startDate: G.addDays(G.today(), -1) });
  const day = G.computeLoan(l).cuotas[0].date;
  G.ops.addPayment({ loanId: l.id, amount: 5000, date: day });
  const r = G.collectionsFor(day).find((x) => x.clientId === l.clientId);
  assert.equal(r.expected, 12000);
  assert.equal(r.received, 5000);
  assert.equal(r.pending, 7000);
  assert.equal(r.status, "parcial");
});

// ---------------------------------------------------------------- permisos
test("permisos reales: un cobrador no puede crear préstamos ni anular pagos", async () => {
  const env = await admin();
  const { G } = env;
  const l = newLoan(G);
  const c = G.data.clients[0];
  G.ops.saveRoute({ name: "Ruta centro", clientIds: [c.id] });
  const u = await G.ops.saveUser({ username: "cobra1", role: "cobrador", routeIds: [G.data.routes[0].id] }, "clave123");
  assert.ok(!u.passwordHash.includes("clave"), "contraseña cifrada");
  assert.equal(u.algo, "pbkdf2");
  G.endSession();
  assert.ok(await G.login("cobra1", "clave123"));
  assert.throws(() => G.ops.createLoan({ clientId: c.id, amount: 1, rate: 0, count: 1, freq: "diaria", startDate: G.today() }), /permiso/);
  const p = G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today() });
  assert.throws(() => G.ops.voidPayment(p.id, "porque sí"), /permiso/);
  assert.throws(() => G.ops.exportAll(), /permiso/);
  const vis = G.visibleClientIds();
  assert.ok(vis.has(c.id));
  assert.equal(await G.login("cobra1", "mala"), null);
});

// ---------------------------------------------------------------- estado de cuenta
test("18. estado de cuenta: totales del cliente coinciden con sus préstamos", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  G.ops.createLoan({ clientId: l.clientId, amount: 50000, rate: 10, count: 2, freq: "quincenal", startDate: G.today() });
  G.ops.addPayment({ loanId: l.id, amount: 40000, date: G.today() });
  const x = G.state().byClient.get(l.clientId);
  assert.equal(x.lent, 150000);
  assert.equal(x.paid, 40000);
  assert.equal(x.debt, 120000 + 55000 - 40000);
});

// ---------------------------------------------------------------- respaldos y migración
test("19-20. respaldo y restauración completos", async () => {
  const { G } = await admin();
  const l = newLoan(G);
  G.ops.addPayment({ loanId: l.id, amount: 30000, date: G.today() });
  const json = G.ops.exportAll();
  const env2 = await admin();
  env2.G.ops.importAll(json);
  assert.equal(env2.G.data.clients.length, 1);
  assert.equal(env2.G.data.payments.length, 1);
  assert.equal(env2.G.computeLoan(env2.G.data.loans[0]).balance, 90000);
});

test("respaldo cifrado: solo abre con la contraseña correcta", async () => {
  const { G } = await admin();
  newLoan(G);
  const enc = await G.Crypto.encrypt(G.ops.exportAll(), "clave-copia");
  assert.ok(!enc.includes("Cliente"));
  const dec = await G.Crypto.decrypt(enc, "clave-copia");
  assert.equal(JSON.parse(dec).data.loans.length, 1);
  await assert.rejects(G.Crypto.decrypt(enc, "otra"));
});

test("migración 1 → 2: no elimina datos y los préstamos conservan sus cálculos", async () => {
  // Datos con el formato anterior (esquema 1), tal como los guarda la versión publicada
  const t = new Date(); const iso = (d) => d.toISOString().slice(0, 10);
  const start = iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() - 20));
  const v1 = {
    schema: 1,
    clients: [{ id: "c1", name: "Pedro Gómez", doc: "123", phone: "3001112233", createdAt: start }],
    loans: [{ id: "l1", clientId: "c1", amount: 200000, rate: 20, count: 10, freq: "diaria", startDate: start, num: "P-0001", charges: [], skipDates: [], createdAt: start + "T10:00:00.000Z" }],
    payments: [{ id: "p1", loanId: "l1", amount: 48000, date: start, method: "Efectivo", createdAt: start + "T11:00:00.000Z" }, { id: "p2", loanId: "l1", amount: 0, type: "nopago", date: start, createdAt: start + "T12:00:00.000Z" }],
    movements: [{ id: "m1", type: "out", concept: "Transporte", amount: 5000, date: start, createdAt: start }, { id: "m2", type: "in", concept: "Aporte de capital", amount: 1000000, date: start, createdAt: start }],
    settings: { mora: { enabled: false, type: "percent", value: 5, graceDays: 0, since: null }, noPay: { weekdays: [0], dates: [], colombia: true, colombiaOff: [] } },
    seq: { loan: 1 },
  };
  // Cálculo con la versión anterior = mismo algoritmo con modo "flat"
  const old = boot({ "gp.data.v1": JSON.stringify(v1) });
  const { G, mem } = old;
  assert.equal(G.data.schema, 2);
  assert.equal(G.data.clients.length, 1);
  assert.equal(G.data.loans.length, 1);
  assert.equal(G.data.payments.length, 2);
  assert.equal(G.data.movements.length, 2);
  assert.equal(G.data.loans[0].interestMode, "flat");
  assert.equal(G.data.movements.find((m) => m.id === "m2").kind, "aporte");
  assert.equal(G.data.movements.find((m) => m.id === "m1").kind, "gasto");
  const st = G.computeLoan(G.data.loans[0]);
  assert.equal(st.plan.total, 240000);
  assert.equal(st.paid, 48000);
  assert.equal(st.balance, 192000);
  const snaps = JSON.parse(mem["gp.backup.auto"]);
  assert.match(snaps[0].reason, /antes de migrar/);
  assert.equal(snaps[0].data.schema, 1, "la copia guarda los datos originales intactos");
  // Volver a cargar ya migrado no duplica nada
  await G.ready();
  const again = boot({ "gp.data.v1": mem["gp.data.v1"], "gp.backup.auto": mem["gp.backup.auto"] });
  assert.equal(again.G.data.clients.length, 1);
  assert.equal(again.G.data.payments.length, 2);
});

test("datos dañados no se sobrescriben: se apartan y se recupera la copia", async () => {
  const good = { schema: 2, clients: [{ id: "x", name: "Copia" }], loans: [], payments: [], movements: [] };
  const { G, mem } = boot({ "gp.data.v1": "{dañado", "gp.backup.auto": JSON.stringify([{ at: new Date().toISOString(), reason: "diaria", data: good }]) });
  assert.equal(G.data.clients[0].name, "Copia");
  assert.ok(Object.keys(mem).some((k) => k.startsWith("gp.data.damaged.")));
});

/* ===================== Migración de datos reales de la 1.0.118 =====================
   tests/fixtures/datos-v118.json se generó con el código de la versión 1.0.118
   (esquema 1). Cualquier versión nueva debe abrir esos datos y calcular EXACTAMENTE
   los mismos saldos, cuotas, fechas, pagos y recargos. Si esta prueba falla, la
   actualización pondría en riesgo los datos de los usuarios: no se publica. */
test("migración: datos de la 1.0.118 se conservan con los mismos saldos y cuotas", async () => {
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "datos-v118.json"), "utf8"));
  const { G, mem } = await admin({ "gp.data.v1": JSON.stringify(fx.data) });
  const E = fx.expected;
  assert.equal(G.data.schema, G.SCHEMA, "se migró al esquema actual");
  assert.equal(G.data.clients.length, E.clients, "mismos clientes");
  assert.equal(G.data.payments.length, E.payments, "mismos pagos");
  const plain = (x) => JSON.parse(JSON.stringify(x)); // listas creadas dentro del entorno simulado
  assert.deepEqual(plain(G.data.movements.map((m) => m.type + ":" + m.amount).sort()), E.movements, "mismos movimientos");
  assert.equal(G.data.loans.length, E.loans.length, "mismos préstamos");
  for (const exp of E.loans) {
    const loan = G.data.loans.find((l) => l.num === exp.num);
    assert.ok(loan, "existe " + exp.num);
    const st = G.computeLoan(loan);
    assert.equal(st.totalDue, exp.total, exp.num + " total");
    assert.equal(st.paid, exp.paid, exp.num + " pagado");
    assert.equal(st.balance, exp.balance, exp.num + " saldo");
    assert.equal(st.chargesTotal, exp.charges, exp.num + " recargos");
    assert.deepEqual(plain(st.cuotas.map((c) => [c.n, c.date, c.due, c.paid])), exp.cuotas, exp.num + " cuotas (fecha, valor, pagado)");
  }
  // La copia previa a la migración guarda los datos originales intactos.
  const snaps = G.snapshots();
  assert.ok(snaps.some((s) => /antes de migrar/.test(s.reason)), "hay copia antes de migrar");
  assert.ok(mem["gp.data.v1"], "los datos siguen guardados");
});

/* Teléfono simulado: archivos en memoria (como el complemento Filesystem). */
function bootPhone(store, files) {
  const mem = Object.assign({}, store || {});
  const localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  const fsx = {
    writeFile: async (o) => { files[o.path] = o.data; return { uri: "file:///" + o.path }; },
    readFile: async (o) => { if (!(o.path in files)) throw new Error("no existe"); return { data: files[o.path] }; },
    deleteFile: async (o) => { if (!(o.path in files)) throw new Error("no existe"); delete files[o.path]; },
    rename: async (o) => { if (!(o.from in files)) throw new Error("no existe"); files[o.to] = files[o.from]; delete files[o.from]; },
  };
  const window = { Capacitor: { isNativePlatform: () => true, Plugins: { Filesystem: fsx } } };
  const ctx = { window, localStorage, crypto: globalThis.crypto, TextEncoder, TextDecoder, console, setTimeout, clearTimeout, Date, Math, JSON };
  vm.createContext(ctx); vm.runInContext(CORE, ctx);
  return { G: window.GP, mem, files };
}
test("almacenamiento: datos grandes pasan a archivo, se recuperan al reabrir y sobreviven a un archivo dañado", async () => {
  const files = {};
  const cfg = JSON.stringify(await adminConfig());
  const a = bootPhone({ "gp.config.v1": cfg }, files);
  await a.G.ready(); assert.ok(await a.G.login("admin", "secreto1"));
  const photo = "data:image/jpeg;base64," + "A".repeat(50000);
  for (let i = 0; i < 50; i++) {
    const c = a.G.ops.saveClient({ name: "Cliente " + i, photo });
    const l = a.G.ops.createLoan({ clientId: c.id, amount: 400000, rate: 20, count: 10, freq: "diaria", startDate: "2026-03-02" });
    for (let d = 0; d < 5; d++) a.G.ops.addPayment({ loanId: l.id, amount: 48000, date: a.G.addDays("2026-03-03", d), method: "Efectivo" });
  }
  await a.G.persistNow();
  const sum = (G) => JSON.stringify([G.data.clients.length, G.data.loans.length, G.data.payments.length, G.totals().pending]);
  const expected = sum(a.G);
  assert.equal(a.mem["gp.data.store"], "file", "pasó a modo archivo");
  assert.equal(a.mem["gp.data.v1"], undefined, "liberó el espacio web limitado");
  assert.ok(files["gp-data.json"].length > 2000000, "todo quedó en el archivo");
  // Reabrir la app
  const b = bootPhone(a.mem, files);
  assert.throws(() => b.G.save(), /cargando/, "no se guarda nada antes de leer el archivo");
  await b.G.ready(); assert.ok(await b.G.login("admin", "secreto1"));
  assert.equal(sum(b.G), expected, "mismos datos al reabrir");
  b.G.ops.addPayment({ loanId: b.G.data.loans[0].id, amount: 48000, date: "2026-03-09", method: "Efectivo" });
  await b.G.persistNow();
  // Archivo principal dañado: se usa el anterior (gp-data.prev.json)
  files["gp-data.json"] = "{dañado";
  const c = bootPhone(b.mem, files);
  await c.G.ready(); assert.ok(await c.G.login("admin", "secreto1"));
  assert.ok(c.G.data.payments.length >= 250, "recuperó los datos desde la versión anterior del archivo");
});

test("cobros de hoy: lo atrasado descuenta los abonos parciales ya hechos", async () => {
  const { G } = await admin();
  const t = G.today();
  const c = G.ops.saveClient({ name: "Abono Parcial" });
  const l = G.ops.createLoan({ clientId: c.id, amount: 300000, rate: 0, count: 3, freq: "semanal", startDate: G.addDays(t, -22) });
  G.ops.addPayment({ loanId: l.id, amount: 150000, date: G.addDays(t, -10), method: "Efectivo" }); // cuota 1 completa + 50.000 de la 2
  const st = G.computeLoan(l);
  const row = G.collectionsFor(t).find((r) => r.clientId === c.id);
  assert.ok(row, "aparece en cobros de hoy");
  assert.equal(row.overdue + row.expected, st.overdueAmount + st.cuotas.filter((q) => q.date === t).reduce((a, q) => a + q.remaining, 0), "atrasado + hoy = lo realmente pendiente");
  assert.equal(row.overdue, st.overdueAmount, "atrasado = vencido real (sin contar lo ya abonado)");
});
