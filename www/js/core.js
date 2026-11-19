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
  const LIST_KEYS = ["clients", "loans", "payments", "movements", "portfolios", "routes", "visits", "users", "cash", "audit"];
  const DEFAULT_METHODS = ["Efectivo", "Transferencia", "Consignación", "Nequi", "Daviplata", "Otro"];
  const DEFAULT_EXPENSES = ["Transporte", "Papelería", "Comida", "Celular / recargas", "Arriendo", "Servicios", "Pago a cobrador", "Otro"];
  const EMPTY = () => ({
    clients: [], loans: [], payments: [], movements: [],
    portfolios: [], routes: [], visits: [], users: [], cash: [], audit: [],
    settings: {
      mora: { enabled: false, type: "percent", value: 5, graceDays: 0, since: null },
      noPay: { weekdays: [0], dates: [], colombia: true, colombiaOff: [] },
      paymentMethods: DEFAULT_METHODS.slice(), expenseCategories: DEFAULT_EXPENSES.slice(),
      // Tasa de usura certificada por la Superfinanciera (E.A. en %). Cambia cada mes: la escribe el usuario.
      legal: { usuryEA: null, usurySince: null, block: false },
      moraDays: 3, defaultInterestMode: "flat",
    },
    seq: { loan: 0, receipt: 0 },
  });
  /* =====================================================================
     PROTECCIÓN DE DATOS (PRIORIDAD MÁXIMA)
     1. Los datos viven en el almacenamiento interno de la app, que Android
        CONSERVA al instalar una actualización (misma firma + mismo id).
     2. Cada vez que se guarda, se escribe además una copia espejo en un
        archivo interno (gp-data.json). Si el almacenamiento web se perdiera,
        la app se restaura sola desde ese archivo al abrir.
     3. Al detectar una versión nueva de la app se hace una copia automática
        antes de tocar nada, y se guardan las últimas copias diarias.
     4. Los cambios de formato se hacen SOLO con migraciones que agregan
        campos; nunca se borran clientes, préstamos ni pagos.
     5. Si un archivo de datos está dañado, NO se sobrescribe: se aparta
        y se intenta recuperar desde el espejo o las copias.
     ===================================================================== */
  const SCHEMA = 2;
  const MIGRATIONS = {
    /* 2: rediseño. SOLO AGREGA campos y listas nuevas; no borra ni cambia montos.
       - Préstamos existentes quedan con interestMode "flat" (el interés de siempre:
         una sola vez sobre el monto), así sus cuotas y saldos no cambian.
       - Movimientos existentes reciben "kind" (gasto / ingreso / aporte) según su tipo. */
    2: (d) => {
      d.clients.forEach((c) => {
        if (!c.status) c.status = "activo";
        if (c.docType == null) c.docType = c.doc ? "CC" : "";
        if (!Array.isArray(c.refs)) c.refs = [];
      });
      d.loans.forEach((l) => { if (!l.interestMode) l.interestMode = "flat"; });
      d.movements.forEach((m) => {
        if (!m.kind) m.kind = m.type === "out" ? "gasto" : /aporte/i.test(m.concept || "") ? "aporte" : "ingreso";
      });
      d.migrations = (d.migrations || []).concat({ to: 2, at: new Date().toISOString(), clients: d.clients.length, loans: d.loans.length, payments: d.payments.length, movements: d.movements.length });
    },
  };
  function normalize(d) {
    const e = EMPTY();
    const out = Object.assign(e, d, { settings: Object.assign(e.settings, d.settings || {}) });
    out.settings.mora = Object.assign(EMPTY().settings.mora, (d.settings || {}).mora || {});
    out.settings.noPay = Object.assign(EMPTY().settings.noPay, (d.settings || {}).noPay || {});
    out.settings.legal = Object.assign(EMPTY().settings.legal, (d.settings || {}).legal || {});
    ["paymentMethods", "expenseCategories"].forEach((k) => { if (!Array.isArray(out.settings[k]) || !out.settings[k].length) out.settings[k] = EMPTY().settings[k]; });
    LIST_KEYS.forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
    out.loans.forEach((l) => { if (!Array.isArray(l.skipDates)) l.skipDates = []; });
    out.seq = Object.assign({ loan: 0, receipt: 0 }, d.seq || {});
    let v = Number(out.schema) || 1;
    while (v < SCHEMA) { v++; if (MIGRATIONS[v]) MIGRATIONS[v](out); }
    out.schema = SCHEMA;
    return out;
  }
  /* Antes de migrar datos de un esquema anterior se guarda una copia intacta
     (tal cual estaban) en las copias automáticas. */
  function snapshotRaw(obj, reason) {
    try {
      const list = snapshots();
      list.unshift({ at: new Date().toISOString(), reason, data: obj });
      for (let n = 6; n > 0; n--) { try { localStorage.setItem(SNAP_KEY_(), JSON.stringify(list.slice(0, n))); return true; } catch (e) { /* espacio */ } }
    } catch (e) { /* nunca bloquear */ }
    return false;
  }
  let preMigration = null;
  let data = load();
  function load() {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return EMPTY();
    try {
      const d = JSON.parse(raw);
      if (d && d.clients) {
        if ((Number(d.schema) || 1) < SCHEMA) {
          snapshotRaw(JSON.parse(raw), "antes de migrar datos al esquema " + SCHEMA);
          preMigration = { from: Number(d.schema) || 1, raw }; // además se escribe a un archivo en ready()
        }
        return normalize(d);
      }
    } catch (e) { /* dañado */ }
    // Nunca sobrescribir datos que no se pudieron leer: se apartan.
    try { localStorage.setItem("gp.data.damaged." + Date.now(), raw); } catch (e) { /* lleno */ }
    const b = latestSnapshot();
    if (b) { try { return normalize(JSON.parse(b).data); } catch (e) { /* sigue */ } }
    return EMPTY();
  }
  function isEmpty(d) { return !d.clients.length && !d.loans.length && !d.payments.length && !d.movements.length; }
  function save() {
    data.schema = SCHEMA;
    localStorage.setItem(DATA_KEY, JSON.stringify(data)); cache = null;
    mirrorSoon();
  }

  // ----- Espejo en archivo interno de la app (solo en el teléfono) -----
  const MIRROR_FILE = "gp-data.json";
  const FS = () => { const C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Filesystem; };
  let mirrorT = null;
  function mirrorSoon() { clearTimeout(mirrorT); mirrorT = setTimeout(mirrorNow, 600); }
  async function mirrorNow() {
    const F = FS(); if (!F) return;
    const cfg = Config.get();
    if (!cfg && isEmpty(data)) return; // no pisar un espejo bueno con nada
    try {
      await F.writeFile({ path: MIRROR_FILE, directory: "DATA", encoding: "utf8",
        data: JSON.stringify({ app: "GestionPrestamos", savedAt: new Date().toISOString(), config: cfg, data }) });
    } catch (e) { /* se reintenta en el próximo guardado */ }
  }
  async function readMirror() {
    const F = FS(); if (!F) return null;
    try { const r = await F.readFile({ path: MIRROR_FILE, directory: "DATA", encoding: "utf8" }); return JSON.parse(r.data); }
    catch (e) { return null; }
  }

  // ----- Copias automáticas (en el almacenamiento de la app) -----
  function SNAP_KEY_() { return "gp.backup.auto"; }
  function snapshots() { try { return JSON.parse(localStorage.getItem(SNAP_KEY_())) || []; } catch (e) { return []; } }
  function latestSnapshot() { const s = snapshots(); return s.length ? JSON.stringify(s[0]) : null; }
  function snapshot(reason) {
    if (isEmpty(data)) return;
    const list = snapshots();
    const item = { at: new Date().toISOString(), reason, data: JSON.parse(JSON.stringify(data)) };
    // una por día + todas las de actualización, máximo 5
    const day = item.at.slice(0, 10);
    const filtered = list.filter((x) => !(x.reason === "diaria" && reason === "diaria" && x.at.slice(0, 10) === day));
    filtered.unshift(item);
    for (let n = 5; n > 1; n--) {
      try { localStorage.setItem(SNAP_KEY_(), JSON.stringify(filtered.slice(0, n))); return; } catch (e) { /* sin espacio: guardar menos */ }
    }
  }

  /* ----- Versiones -----
     nativeBuild: versión del APK instalado.
     webBuild: versión de las pantallas/lógica en uso (puede ser más nueva si
     llegó una actualización en vivo sin APK). */
  let verPromise = null;
  function versionInfo() {
    if (verPromise) return verPromise;
    verPromise = (async () => {
      const C = window.Capacitor; const Pl = C && C.Plugins;
      const native = !!(C && C.isNativePlatform && C.isNativePlatform());
      const v = { nativeBuild: 0, nativeVersion: "1.0", webBuild: 0, webVersion: "1.0", live: false, canLive: false };
      try { if (Pl && Pl.App && Pl.App.getInfo) { const i = await Pl.App.getInfo(); v.nativeBuild = parseInt(i.build, 10) || 0; v.nativeVersion = i.version; } } catch (e) { /* navegador */ }
      v.webBuild = v.nativeBuild; v.webVersion = v.nativeVersion;
      try {
        if (native && Pl && Pl.CapacitorUpdater) {
          v.canLive = true;
          const c = await Pl.CapacitorUpdater.current();
          if (c && c.bundle && c.bundle.id !== "builtin") {
            const m = String(c.bundle.version || "").match(/(\d+)\.(\d+)\.(\d+)/);
            if (m && +m[3] > v.nativeBuild) { v.webBuild = +m[3]; v.webVersion = m[0]; v.live = true; }
          }
        }
      } catch (e) { /* sin complemento */ }
      return v;
    })();
    return verPromise;
  }

  /* Si hay una actualización en vivo ya descargada, se aplica al ABRIR la app
     (nunca en medio del trabajo). Si esa versión falló antes, no se reintenta. */
  async function applyPendingLive() {
    const C = window.Capacitor; const U = C && C.Plugins && C.Plugins.CapacitorUpdater;
    let pend = null; try { pend = JSON.parse(localStorage.getItem("gp.live.pending")); } catch (e) { /* nada */ }
    if (!U || !pend) return false;
    const v = await versionInfo();
    if (v.webBuild >= pend.build) { localStorage.removeItem("gp.live.pending"); localStorage.removeItem("gp.live.tried"); return false; }
    if (localStorage.getItem("gp.live.tried") === String(pend.build)) {
      // Ya se intentó y la app volvió sola a la versión anterior: esa versión falló.
      localStorage.setItem("gp.live.failed", String(pend.build));
      localStorage.removeItem("gp.live.pending"); localStorage.removeItem("gp.live.tried");
      return false;
    }
    localStorage.setItem("gp.live.tried", String(pend.build));
    snapshot("antes de actualización en vivo → " + pend.build);
    await mirrorNow();
    try { await U.set({ id: pend.id }); return true; } catch (e) { localStorage.removeItem("gp.live.pending"); return false; }
  }

  /* Se llama al abrir la app (antes del login). Recupera datos si hiciera falta
     y hace la copia automática cuando cambia la versión instalada. */
  async function ready() {
    if (preMigration) {
      const F = FS();
      if (F) { try { await F.writeFile({ path: "gp-data-antes-esquema-" + SCHEMA + ".json", directory: "DATA", encoding: "utf8", data: preMigration.raw }); } catch (e) { /* queda la copia automática */ } }
      // Guardar ya el formato nuevo (la copia de lo anterior quedó en Copias automáticas)
      try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch (e) { /* se reintenta al guardar */ }
      preMigration = null;
    }
    try {
      const mirror = await readMirror();
      const hasCfg = !!localStorage.getItem(CONFIG_KEY);
      if (mirror && mirror.data) {
        const mData = normalize(mirror.data);
        const mCount = mData.clients.length + mData.loans.length + mData.payments.length;
        const lCount = data.clients.length + data.loans.length + data.payments.length;
        if (!hasCfg && mirror.config) localStorage.setItem(CONFIG_KEY, JSON.stringify(mirror.config));
        if (isEmpty(data) && !isEmpty(mData)) { data = mData; localStorage.setItem(DATA_KEY, JSON.stringify(data)); cache = null; }
        else if (mCount > lCount && lCount === 0) { data = mData; save(); }
      } else if (!isEmpty(data) || hasCfg) {
        mirrorNow(); // primera vez con esta protección: crear el espejo
      }
    } catch (e) { /* nunca bloquear el inicio */ }
    try { if (await applyPendingLive()) return "reloading"; } catch (e) { /* seguir */ }
    try {
      const v = await versionInfo();
      const build = v.webBuild ? String(v.webBuild) : "web";
      const last = localStorage.getItem("gp.lastBuild");
      if (last && last !== build) { snapshot("actualización " + last + " → " + build); window.GP.updatedFrom = last; }
      else snapshot("diaria");
      localStorage.setItem("gp.lastBuild", build);
    } catch (e) { /* ignorar */ }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  const Config = {
    get() { try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; } },
    set(v) { localStorage.setItem(CONFIG_KEY, JSON.stringify(v)); if (typeof mirrorSoon === "function") mirrorSoon(); },
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
  /* ----- Días sin cobro -----
     - Días de la semana sin cobro para todos (por defecto: domingo).
     - Fechas sin cobro para todos (festivos).
     - Fechas sin cobro de un préstamo en particular ("quitar días" a un cliente).
     Una cuota nunca cae en un día sin cobro: se corre al siguiente día válido,
     así que esos días no cuentan como atraso. */
  /* ----- Festivos de Colombia (Ley 51 de 1983, "Ley Emiliani") -----
     Se calculan solos para cualquier año:
     - Fijos: 1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic.
     - Se pasan al lunes siguiente: Reyes (6 ene), San José (19 mar),
       San Pedro y San Pablo (29 jun), Asunción (15 ago), Día de la Raza (12 oct),
       Todos los Santos (1 nov), Independencia de Cartagena (11 nov).
     - Según la Pascua: Jueves y Viernes Santo; Ascensión (+43 días),
       Corpus Christi (+64) y Sagrado Corazón (+71), ya en lunes. */
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return toISO(new Date(y, mo - 1, da));
  }
  const coCache = {};
  function colombiaHolidays(y) {
    if (coCache[y]) return coCache[y];
    const fx = (m, d) => toISO(new Date(y, m - 1, d));
    const monday = (iso) => { const wd = parseISO(iso).getDay(); return wd === 1 ? iso : addDays(iso, (8 - wd) % 7); };
    const E = easter(y);
    const list = [
      [fx(1, 1), "Año Nuevo"], [monday(fx(1, 6)), "Día de los Reyes Magos"], [monday(fx(3, 19)), "Día de San José"],
      [addDays(E, -3), "Jueves Santo"], [addDays(E, -2), "Viernes Santo"], [fx(5, 1), "Día del Trabajo"],
      [addDays(E, 43), "Ascensión del Señor"], [addDays(E, 64), "Corpus Christi"], [addDays(E, 71), "Sagrado Corazón"],
      [monday(fx(6, 29)), "San Pedro y San Pablo"], [fx(7, 20), "Día de la Independencia"], [fx(8, 7), "Batalla de Boyacá"],
      [monday(fx(8, 15)), "La Asunción de la Virgen"], [monday(fx(10, 12)), "Día de la Raza"], [monday(fx(11, 1)), "Todos los Santos"],
      [monday(fx(11, 11)), "Independencia de Cartagena"], [fx(12, 8), "Inmaculada Concepción"], [fx(12, 25), "Navidad"],
      // Festivos adicionales pedidos por el negocio (fecha fija todos los años)
      [fx(7, 12), "12 de julio"],
    ].map(([date, name]) => ({ date, name })).sort((a, b) => a.date.localeCompare(b.date));
    coCache[y] = { list, map: new Map(list.map((x) => [x.date, x.name])) };
    return coCache[y];
  }
  /* Nombre del festivo de Colombia en esa fecha (si está activado y no se marcó para cobrar). */
  function colombiaHoliday(iso, np) {
    np = np || (data.settings && data.settings.noPay) || {};
    if (np.colombia === false) return null;
    if ((np.colombiaOff || []).includes(iso)) return null;
    return colombiaHolidays(+iso.slice(0, 4)).map.get(iso) || null;
  }

  function noPayRules(loanSkip) {
    const np = (data.settings && data.settings.noPay) || { weekdays: [0], dates: [] };
    let wd = (np.weekdays || []).filter((x) => x >= 0 && x <= 6);
    if (wd.length >= 7) wd = [];
    return { np, weekdays: new Set(wd), dates: new Set([...(np.dates || []).map((x) => x.date || x), ...(loanSkip || [])]) };
  }
  function isNoPay(iso, rules) { return rules.weekdays.has(parseISO(iso).getDay()) || rules.dates.has(iso) || !!colombiaHoliday(iso, rules.np); }
  function nextPayDay(iso, rules) { let d = iso; for (let k = 0; k < 400 && isNoPay(d, rules); k++) d = addDays(d, 1); return d; }
  function noPayReason(iso, loan) {
    const np = data.settings.noPay || {};
    const g = (np.dates || []).find((x) => (x.date || x) === iso);
    if (g) return g.note || "Festivo / día sin cobro";
    const co = colombiaHoliday(iso);
    if (co) return "Festivo: " + co;
    if (loan && (loan.skipDates || []).includes(iso)) return "Día quitado a este cliente";
    if ((np.weekdays || []).includes(parseISO(iso).getDay()) && (np.weekdays || []).length < 7) { const w = DIAS_LARGO[parseISO(iso).getDay()]; return "No se cobra los " + (w.endsWith("s") ? w : w + "s"); }
    return null;
  }

  /* Modalidades de interés (explícitas por préstamo):
     - "flat": la de siempre. Un porcentaje que se cobra UNA sola vez sobre el monto.
       Todos los préstamos creados antes del rediseño usan esta.
     - "mensual": porcentaje MENSUAL simple sobre el capital, por la duración del plazo
       (meses = cuotas × días del periodo / 30). */
  const INTEREST_MODES = {
    flat: { label: "Interés único sobre el monto", short: "único" },
    mensual: { label: "Interés mensual simple", short: "mensual" },
  };
  const PERIOD_DAYS = { diaria: 1, semanal: 7, quincenal: 15, mensual: 30 };
  function termMonths(count, freq) { return count * (PERIOD_DAYS[freq] || 30) / 30; }
  function interestFor(amount, rate, count, freq, mode) {
    if (mode === "mensual") return Math.round(amount * rate / 100 * termMonths(count, freq));
    return Math.round(amount * rate / 100);
  }
  function plan(amount, rate, count, freq, start, loanSkip, opts) {
    opts = opts || {};
    const interest = interestFor(amount, rate, count, freq, opts.mode);
    const total = amount + interest;
    const base = Math.floor(total / count);
    const rules = noPayRules(loanSkip);
    const cuotas = [];
    const first = opts.firstDate && opts.firstDate >= start ? opts.firstDate : null;
    let prev = start, cur = start;
    for (let i = 1; i <= count; i++) {
      let d;
      if (freq === "diaria") { cur = nextPayDay(first && i === 1 ? first : addDays(cur, 1), rules); d = cur; }
      else {
        d = nextPayDay(first ? dueDate(first, i - 1, freq) : dueDate(start, i, freq), rules);
        if (i > 1 && d <= prev) d = nextPayDay(addDays(prev, 1), rules);
        if (i === 1 && !first && d <= prev) d = nextPayDay(addDays(prev, 1), rules);
      }
      prev = d;
      const value = i === count ? total - base * (count - 1) : base;
      // Parte de capital e interés de cada cuota (proporcional, cuadra exacto en la última)
      const capital = i === count ? amount - Math.floor(amount / count) * (count - 1) : Math.floor(amount / count);
      cuotas.push({ n: i, date: d, base: value, capital, interest: value - capital });
    }
    return { interest, total, cuotaValue: base, cuotas, end: cuotas[count - 1].date, mode: opts.mode || "flat" };
  }
  function loanPlan(l) { return plan(l.amount, l.rate, l.count, l.freq, l.startDate, l.skipDates, { mode: l.interestMode || "flat", firstDate: l.firstDate }); }

  /* Tasa efectiva anual (E.A.) de un préstamo con cuotas iguales: TIR del flujo
     (−capital en la entrega, +cuota en cada fecha). Sirve para comparar con la
     tasa de usura certificada por la Superintendencia Financiera. */
  function effectiveAnnualRate(amount, cuotas, start) {
    if (!(amount > 0) || !cuotas.length) return 0;
    const flows = cuotas.map((c) => ({ t: diffDays(start, c.date) / 365, v: c.base }));
    const npv = (r) => flows.reduce((s, f) => s + f.v / Math.pow(1 + r, f.t), -amount);
    let lo = -0.99, hi = 1000;
    if (npv(hi) > 0) return hi * 100;
    for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; if (npv(mid) > 0) lo = mid; else hi = mid; }
    return ((lo + hi) / 2) * 100;
  }
  function legalCheck(amount, cuotas, start) {
    const L = data.settings.legal || {};
    const ea = effectiveAnnualRate(amount, cuotas, start);
    const limit = Number(L.usuryEA) || null;
    return { ea, limit, configured: !!limit, exceeds: !!limit && ea > limit + 1e-9, block: !!L.block };
  }

  function moraAmount(base) {
    const m = data.settings.mora;
    return m.type === "fixed" ? Math.round(m.value) : Math.round(base * m.value / 100);
  }

  /* Calcula el estado de un préstamo: los pagos se aplican en orden a las cuotas
     (si sobra, pasa a la siguiente). */
  const activePay = (x) => x.amount > 0 && !x.voided;
  function computeLoan(loan, opts) {
    const t = today();
    const p = loanPlan(loan);
    const charges = loan.charges || [];
    const extra = opts && opts.extraPayment ? [opts.extraPayment] : [];
    const pays = data.payments.filter((x) => x.loanId === loan.id && activePay(x)).concat(extra)
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
      // Pesos enteros: el interés acumulado se redondea sobre el total pagado, así la suma
      // de las partes de interés de todos los pagos da exactamente el interés pactado.
      const intCum = (v) => Math.round(Math.min(v, p.total) * p.interest / p.total);
      const inBase = Math.max(0, Math.min(left, p.total - cumulative));
      const interestPart = intCum(cumulative + inBase) - intCum(cumulative) + (left - inBase);
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
      c.daysLate = c.overdue ? diffDays(c.date, t) : 0;
    }
    const balance = Math.max(0, totalDue - paid);
    const paidCount = cuotas.filter((c) => c.status === "pagada").length;
    const overdueCuotas = cuotas.filter((c) => c.overdue);
    const next = cuotas.find((c) => c.status !== "pagada") || null;
    const status = balance <= 0 ? "finalizado" : overdueCuotas.length ? "vencido" : "aldia";
    const interestCollected = payParts.reduce((s, x) => s + x.interestPart, 0);
    return {
      loan, plan: p, cuotas, paid, totalDue, chargesTotal, balance, paidCount, next, status,
      overdueCount: overdueCuotas.length, overdueAmount: overdueCuotas.reduce((s, c) => s + c.remaining, 0),
      maxDaysLate: overdueCuotas.reduce((m, c) => Math.max(m, c.daysLate), 0),
      payParts, interestCollected, capitalRecovered: paid - interestCollected,
      capitalPending: Math.max(0, loan.amount - (paid - interestCollected)),
    };
  }
  /* Simula un pago SIN guardarlo: saldo anterior, aplicación por cuotas y saldo nuevo. */
  function previewPayment(loanId, amount, date) {
    const loan = data.loans.find((l) => l.id === loanId); if (!loan) return null;
    const before = computeLoan(loan);
    const fake = { id: "__preview", loanId, amount, date: date || today(), createdAt: "9999" };
    const after = computeLoan(loan, { extraPayment: fake });
    const applied = [];
    after.cuotas.forEach((c, i) => { const d = c.paid - before.cuotas[i].paid; if (d > 0) applied.push({ n: c.n, amount: d, complete: c.status === "pagada", remaining: c.remaining }); });
    const part = after.payParts.find((x) => x.id === "__preview") || { interestPart: 0, capitalPart: 0 };
    return { before: before.balance, after: after.balance, applied, overpay: Math.max(0, amount - before.balance), interestPart: part.interestPart, capitalPart: part.capitalPart };
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

  // ================= Sesión, permisos y auditoría =================
  /* Roles. Los permisos se revisan en las operaciones (ops), no solo en la pantalla. */
  const ROLES = {
    admin: { label: "Administrador", perms: ["*"] },
    supervisor: { label: "Supervisor", perms: ["ver.todo", "ver.finanzas", "ver.reportes", "ver.usuarios"] },
    cobrador: { label: "Cobrador", perms: ["pago.registrar", "visita.registrar"] },
  };
  const PERM_LABELS = {
    "cliente.editar": "Crear y editar clientes", "prestamo.crear": "Crear préstamos", "pago.registrar": "Registrar pagos",
    "pago.anular": "Anular pagos", "visita.registrar": "Registrar visitas", "movimiento.registrar": "Registrar gastos e ingresos",
    "caja.operar": "Abrir y cerrar caja", "cartera.gestionar": "Gestionar carteras", "ruta.gestionar": "Gestionar rutas",
    "usuario.gestionar": "Gestionar usuarios", "config.editar": "Cambiar configuración", "datos.respaldo": "Copias y restauración",
    "ver.todo": "Ver todos los clientes y préstamos", "ver.finanzas": "Ver finanzas", "ver.reportes": "Ver reportes", "ver.usuarios": "Ver cobradores",
  };
  let session = null; // { id, username, name, role }
  function can(perm) {
    if (!session) return false;
    const r = ROLES[session.role] || ROLES.cobrador;
    if (r.perms.includes("*")) return true;
    if (r.perms.includes(perm)) return true;
    const u = data.users.find((x) => x.id === session.id);
    return !!(u && Array.isArray(u.extraPerms) && u.extraPerms.includes(perm));
  }
  function need(perm) { if (!can(perm)) { const e = new Error("Tu usuario no tiene permiso para esta acción."); e.code = "permiso"; throw e; } }
  function who() { return session ? session.username : "sistema"; }
  /* Clientes que el usuario actual puede ver: todos, o solo los de sus rutas y carteras asignadas. */
  function visibleClientIds() {
    if (!session || can("ver.todo")) return null; // null = todos
    const u = data.users.find((x) => x.id === session.id) || {};
    const ids = new Set();
    data.routes.filter((r) => r.collectorId === session.id || (u.routeIds || []).includes(r.id)).forEach((r) => (r.clientIds || []).forEach((id) => ids.add(id)));
    data.clients.filter((c) => c.portfolioId && (u.portfolioIds || []).includes(c.portfolioId)).forEach((c) => ids.add(c.id));
    return ids;
  }
  function canSeeClient(id) { const v = visibleClientIds(); return !v || v.has(id); }
  const AUDIT_MAX = 3000;
  function audit(action, entity, id, detail, changes) {
    data.audit.unshift({ id: uid(), at: new Date().toISOString(), user: who(), action, entity, ref: id || null, detail: detail || "", changes: changes || null });
    if (data.audit.length > AUDIT_MAX) data.audit.length = AUDIT_MAX;
  }

  // ================= Vistas calculadas =================
  let cache = null;
  const CLIENT_STATUS = {
    aldia: { label: "Al día", tone: "green" }, pendiente: { label: "Con pagos pendientes", tone: "amber" },
    mora: { label: "En mora", tone: "red" }, sinprestamos: { label: "Sin préstamos activos", tone: "grey" },
    inactivo: { label: "Inactivo", tone: "grey" },
  };
  function state() {
    if (cache) return cache;
    const t = today();
    const moraDays = Number(data.settings.moraDays) || 0;
    const loans = data.loans.map((l) => computeLoan(l));
    const byLoan = new Map(loans.map((x) => [x.loan.id, x]));
    const routeOf = new Map();
    data.routes.forEach((r) => (r.clientIds || []).forEach((id) => { if (!routeOf.has(id)) routeOf.set(id, r); }));
    const clients = data.clients.map((c) => {
      const ls = loans.filter((x) => x.loan.clientId === c.id);
      const debt = ls.reduce((s, x) => s + x.balance, 0);
      const lent = ls.reduce((s, x) => s + x.loan.amount, 0);
      const paid = ls.reduce((s, x) => s + x.paid, 0);
      const overdue = ls.some((x) => x.status === "vencido");
      const active = ls.some((x) => x.status !== "finalizado");
      const maxLate = ls.reduce((m, x) => Math.max(m, x.maxDaysLate), 0);
      const dueToday = ls.some((x) => x.cuotas.some((q) => q.date === t && q.status !== "pagada"));
      const next = ls.map((x) => x.next).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
      let status;
      if (c.status === "inactivo" || c.status === "archivado") status = "inactivo";
      else if (!active) status = "sinprestamos";
      else if (overdue && maxLate > moraDays) status = "mora";
      else if (overdue || dueToday) status = "pendiente";
      else status = "aldia";
      const route = routeOf.get(c.id) || null;
      return { client: c, loans: ls, debt, lent, paid, overdue, active, maxLate, next, status, route, portfolio: data.portfolios.find((p) => p.id === c.portfolioId) || null };
    }).sort((a, b) => a.client.name.localeCompare(b.client.name, "es"));
    const byClient = new Map(clients.map((x) => [x.client.id, x]));
    cache = { loans, byLoan, clients, byClient };
    return cache;
  }

  function totals(filter) {
    const s = state();
    const ls = filter ? s.loans.filter(filter) : s.loans;
    const lent = ls.reduce((a, x) => a + x.loan.amount, 0);
    const collected = ls.reduce((a, x) => a + x.paid, 0);
    const pending = ls.reduce((a, x) => a + x.balance, 0);
    const interest = ls.reduce((a, x) => a + x.interestCollected, 0);
    const interestAgreed = ls.reduce((a, x) => a + x.plan.interest + x.chargesTotal, 0);
    return {
      lent, collected, pending, interest, interestAgreed,
      interestPending: Math.max(0, interestAgreed - interest),
      recovered: collected - interest,
      capitalPending: ls.reduce((a, x) => a + x.capitalPending, 0),
      clients: data.clients.length,
      activeLoans: ls.filter((x) => x.status !== "finalizado").length,
      overdueLoans: ls.filter((x) => x.status === "vencido").length,
      overdueAmount: ls.reduce((a, x) => a + x.overdueAmount, 0),
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

  /* Cobros de un día: por cliente, cuánto debía pagar ese día (cuotas de ese día
     + vencidas que arrastra), cuánto se recibió ese día y cuánto falta. */
  function collectionsFor(date) {
    const s = state(); const rows = new Map();
    for (const st of s.loans) {
      for (const c of st.cuotas) {
        const dueThatDay = c.date === date;
        const carried = c.date < date && (c.status !== "pagada" || (c.paidDate && c.paidDate >= date));
        if (!dueThatDay && !carried) continue;
        if (st.status === "finalizado" && !(c.paidDate && c.paidDate >= date)) continue;
        const id = st.loan.clientId;
        const r = rows.get(id) || { clientId: id, expected: 0, received: 0, overdue: 0, loans: new Set(), cuotas: [] };
        if (dueThatDay) r.expected += c.due; else r.overdue += c.due - (c.paidDate && c.paidDate < date ? c.due : 0);
        r.loans.add(st.loan.id); r.cuotas.push({ st, c });
        rows.set(id, r);
      }
    }
    const pays = data.payments.filter((p) => activePay(p) && p.date === date);
    for (const p of pays) {
      const st = s.byLoan.get(p.loanId); if (!st) continue;
      const id = st.loan.clientId;
      const r = rows.get(id) || { clientId: id, expected: 0, received: 0, overdue: 0, loans: new Set(), cuotas: [] };
      r.received += p.amount; r.loans.add(st.loan.id); rows.set(id, r);
    }
    const visits = data.visits.filter((v) => v.date === date);
    const out = [];
    for (const r of rows.values()) {
      const x = s.byClient.get(r.clientId); if (!x) continue;
      const owed = r.expected + Math.max(0, r.overdue);
      r.pending = Math.max(0, owed - r.received);
      const v = visits.filter((q) => q.clientId === r.clientId).sort((a, b) => b.at.localeCompare(a.at))[0];
      r.visit = v || null;
      r.status = r.pending <= 0 && owed > 0 ? "pagado" : r.received > 0 ? "parcial" : v ? v.result : "pendiente";
      r.owed = owed; r.x = x; r.loans = [...r.loans];
      out.push(r);
    }
    return out.sort((a, b) => a.x.client.name.localeCompare(b.x.client.name, "es"));
  }

  /* Finanzas por período */
  function period(key, from, to) {
    const t = parseISO(today());
    let label; to = to || today();
    if (key === "dia") { from = today(); label = "Hoy"; }
    else if (key === "semana") { const wd = (t.getDay() + 6) % 7; from = addDays(today(), -wd); label = "Esta semana"; }
    else if (key === "mes") { from = toISO(new Date(t.getFullYear(), t.getMonth(), 1)); label = "Este mes (" + MESES[t.getMonth()] + " " + t.getFullYear() + ")"; }
    else if (key === "mesant") {
      const a = new Date(t.getFullYear(), t.getMonth() - 1, 1); from = toISO(a);
      to = toISO(new Date(t.getFullYear(), t.getMonth(), 0)); label = "Mes anterior (" + MESES[a.getMonth()] + " " + a.getFullYear() + ")";
    }
    else if (key === "anio") { from = t.getFullYear() + "-01-01"; label = "Este año (" + t.getFullYear() + ")"; }
    else if (key === "rango" && from) { label = fmtDate(from) + " – " + fmtDate(to); }
    else { from = "0000-01-01"; label = "Todo el tiempo"; key = "todo"; }
    return { key, from, to, label };
  }

  const MOV_KINDS = {
    gasto: { label: "Gasto", sign: -1 }, ingreso: { label: "Otro ingreso", sign: 1 }, aporte: { label: "Aporte de capital", sign: 1 },
    retiro: { label: "Retiro", sign: -1 }, ajuste: { label: "Ajuste", sign: 0 },
  };
  const movSign = (m) => m.kind === "ajuste" ? (m.type === "out" ? -1 : 1) : (MOV_KINDS[m.kind] || {}).sign || (m.type === "out" ? -1 : 1);
  const activeMov = (m) => !m.voided;

  /* Reglas contables (estrictas):
     - Entregar un préstamo es DESEMBOLSO de capital: sale dinero, no es gasto ni ganancia.
     - Un pago se divide en recuperación de capital + interés cobrado (+ recargo, que es ingreso).
     - Solo el interés COBRADO es ganancia; el pendiente no es dinero recibido.
     - Aportes y retiros mueven la caja pero no son ingreso ni gasto.
     - Un pago anulado no cuenta en nada. */
  function finance(per) {
    const s = state();
    const inP = (d) => d >= per.from && d <= per.to;
    const parts = new Map();
    s.loans.forEach((x) => x.payParts.forEach((pp) => parts.set(pp.id, pp)));
    const pays = data.payments.filter((p) => activePay(p) && inP(p.date));
    const payIncome = pays.reduce((a, p) => a + p.amount, 0);
    const interest = pays.reduce((a, p) => a + (parts.get(p.id) ? parts.get(p.id).interestPart : 0), 0);
    const movs = data.movements.filter((m) => activeMov(m) && inP(m.date));
    const sum = (k) => movs.filter((m) => m.kind === k).reduce((a, m) => a + m.amount, 0);
    const movIn = sum("ingreso"), movOut = sum("gasto"), aportes = sum("aporte"), retiros = sum("retiro");
    const ajustes = movs.filter((m) => m.kind === "ajuste").reduce((a, m) => a + movSign(m) * m.amount, 0);
    const lent = data.loans.filter((l) => inP(l.startDate)).reduce((a, l) => a + l.amount, 0);
    return {
      income: payIncome + movIn, expenses: movOut, lent, interest, capitalRecovered: payIncome - interest,
      profit: interest + movIn - movOut, payIncome, movIn, aportes, retiros, ajustes,
      cashFlow: payIncome + movIn + aportes - movOut - retiros - lent + ajustes,
    };
  }
  /* Dinero disponible (liquidez) = todo lo que entró − todo lo que salió, desde siempre. */
  function cashAvailable() { return finance(period("todo")).cashFlow; }

  /* Flujo por semanas (mes) o por meses (año/todo) */
  function flow(per) {
    const buckets = [];
    if (per.key === "mes" || per.key === "mesant") {
      const start = parseISO(per.from);
      const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let w = 0; w * 7 < lastDay; w++) {
        const a = toISO(new Date(start.getFullYear(), start.getMonth(), 1 + w * 7));
        const b = toISO(new Date(start.getFullYear(), start.getMonth(), Math.min(lastDay, 7 + w * 7)));
        buckets.push({ label: "Sem " + (w + 1), from: a, to: b });
      }
    } else if (per.key === "semana" || per.key === "dia" || per.key === "rango" && diffDays(per.from, per.to) <= 14) {
      for (let d = per.key === "dia" ? addDays(per.from, -6) : per.from; d <= per.to; d = addDays(d, 1)) buckets.push({ label: DIAS[parseISO(d).getDay()], from: d, to: d });
    } else {
      const t = parseISO(per.key === "rango" ? per.to : today());
      const n = per.key === "anio" ? t.getMonth() + 1 : 6;
      for (let i = n - 1; i >= 0; i--) {
        const a = new Date(t.getFullYear(), t.getMonth() - i, 1);
        const b = new Date(a.getFullYear(), a.getMonth() + 1, 0);
        buckets.push({ label: MESES[a.getMonth()], from: toISO(a), to: toISO(b) });
      }
    }
    return buckets.map((b) => {
      const f = finance(b);
      return { label: b.label, from: b.from, to: b.to, income: f.income, expenses: f.expenses, interest: f.interest, recovered: f.capitalRecovered, collected: f.payIncome, lent: f.lent };
    });
  }

  /* Movimientos: pagos, préstamos entregados, ingresos y gastos manuales (sin duplicar pagos). */
  function movements(opts) {
    const s = state(); const out = [];
    const withVoided = opts && opts.voided;
    for (const p of data.payments) {
      const st = s.byLoan.get(p.loanId); if (!st || !(p.amount > 0)) continue;
      if (p.voided && !withVoided) continue;
      const c = data.clients.find((x) => x.id === st.loan.clientId);
      out.push({ kind: "pay", sign: 1, amount: p.amount, date: p.date, title: "Pago de cuota" + (p.voided ? " (anulado)" : ""), sub: (c ? c.name : "") + " • #" + st.loan.num + (p.method ? " • " + p.method : ""), ref: p, ts: p.createdAt, voided: !!p.voided, clientId: st.loan.clientId });
    }
    for (const l of data.loans) {
      const c = data.clients.find((x) => x.id === l.clientId);
      out.push({ kind: "loan", sign: -1, amount: l.amount, date: l.startDate, title: "Préstamo entregado", sub: (c ? c.name : "") + " • #" + l.num, ref: l, ts: l.createdAt, clientId: l.clientId });
    }
    for (const m of data.movements) {
      if (m.voided && !withVoided) continue;
      const sg = movSign(m);
      out.push({ kind: m.kind || (m.type === "in" ? "ingreso" : "gasto"), sign: sg, amount: m.amount, date: m.date, title: m.concept + (m.voided ? " (anulado)" : ""), sub: (MOV_KINDS[m.kind] || {}).label + (m.detail ? " • " + m.detail : ""), ref: m, ts: m.createdAt, voided: !!m.voided });
    }
    return out.sort((a, b) => (b.date + (b.ts || "")).localeCompare(a.date + (a.ts || "")));
  }

  // ================= Caja diaria =================
  /* Resumen de caja de un día. Solo el dinero en EFECTIVO afecta lo que debe haber en caja;
     los pagos por transferencia se muestran aparte. */
  function cashDay(date) {
    const isCash = (m) => !m || /efectivo/i.test(m);
    const pays = data.payments.filter((p) => activePay(p) && p.date === date);
    const movs = data.movements.filter((m) => activeMov(m) && m.date === date);
    const loans = data.loans.filter((l) => l.startDate === date);
    const sumM = (k) => movs.filter((m) => m.kind === k && isCash(m.method)).reduce((a, m) => a + m.amount, 0);
    const s = data.cash.find((c) => c.date === date) || null;
    const r = {
      session: s, date,
      payCash: pays.filter((p) => isCash(p.method)).reduce((a, p) => a + p.amount, 0),
      payOther: pays.filter((p) => !isCash(p.method)).reduce((a, p) => a + p.amount, 0),
      income: sumM("ingreso"), aportes: sumM("aporte"),
      loans: loans.filter((l) => isCash(l.method)).reduce((a, l) => a + l.amount, 0),
      expenses: sumM("gasto"), retiros: sumM("retiro"),
      ajustes: movs.filter((m) => m.kind === "ajuste").reduce((a, m) => a + movSign(m) * m.amount, 0),
      count: { pays: pays.length, loans: loans.length, movs: movs.length },
    };
    r.entries = r.payCash + r.income + r.aportes + Math.max(0, r.ajustes);
    r.exits = r.loans + r.expenses + r.retiros + Math.max(0, -r.ajustes);
    r.opening = s ? s.opening : 0;
    r.expected = r.opening + r.entries - r.exits;
    return r;
  }
  function isDayClosed(date) { const s = data.cash.find((c) => c.date === date); return !!(s && s.status === "cerrada"); }

  // ================= Validaciones =================
  function validateClient(c) {
    const e = {};
    if (!c.name || c.name.trim().length < 2) e.name = "Escribe el nombre completo.";
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = "El correo no parece válido.";
    if (c.phone && String(c.phone).replace(/\D/g, "").length < 7) e.phone = "El teléfono parece incompleto.";
    if (c.doc) {
      const dup = data.clients.find((x) => x.id !== c.id && x.doc && String(x.doc).replace(/\D/g, "") === String(c.doc).replace(/\D/g, "") && (x.docType || "CC") === (c.docType || "CC"));
      if (dup) e.doc = "Ya existe un cliente con ese documento: " + dup.name + ".";
    }
    return e;
  }
  const CLIENT_FIELDS = { name: "Nombre", docType: "Tipo de documento", doc: "Documento", phone: "Teléfono", phone2: "Teléfono 2", address: "Dirección", barrio: "Barrio", city: "Ciudad", email: "Correo", notes: "Observaciones", photo: "Fotografía", refs: "Referencias", portfolioId: "Cartera", status: "Estado" };

  // ================= Operaciones =================
  /* Toda escritura pasa por aquí: revisa permisos, valida, audita y guarda. */
  const ops = {
    saveClient(c) {
      need("cliente.editar");
      const err = validateClient(c); if (Object.keys(err).length) { const e = new Error(Object.values(err)[0]); e.fields = err; throw e; }
      if (c.id) {
        const i = data.clients.findIndex((x) => x.id === c.id);
        const old = data.clients[i]; const changes = [];
        Object.keys(CLIENT_FIELDS).forEach((k) => {
          if (!(k in c)) return;
          const a = old[k] == null ? "" : old[k], b = c[k] == null ? "" : c[k];
          if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({ field: k, label: CLIENT_FIELDS[k], from: k === "photo" ? (a ? "(foto)" : "") : a, to: k === "photo" ? (b ? "(foto nueva)" : "(sin foto)") : b });
        });
        data.clients[i] = Object.assign(old, c);
        if (changes.length) audit("editar", "cliente", c.id, old.name, changes);
      } else {
        c.id = uid(); c.createdAt = c.createdAt || today(); c.status = c.status || "activo"; c.refs = c.refs || [];
        data.clients.push(c); audit("crear", "cliente", c.id, c.name);
      }
      save(); return c;
    },
    setClientStatus(id, status) {
      need("cliente.editar");
      const c = data.clients.find((x) => x.id === id); const from = c.status || "activo";
      c.status = status; audit("estado", "cliente", id, c.name, [{ field: "status", label: "Estado", from, to: status }]); save();
    },
    /* Solo se elimina un cliente SIN operaciones financieras; si las tiene, se archiva. */
    deleteClient(id) {
      need("cliente.editar");
      if (data.loans.some((l) => l.clientId === id)) return false;
      const c = data.clients.find((x) => x.id === id);
      data.clients = data.clients.filter((x) => x.id !== id);
      data.routes.forEach((r) => { r.clientIds = (r.clientIds || []).filter((x) => x !== id); });
      audit("eliminar", "cliente", id, c ? c.name : ""); save(); return true;
    },
    createLoan(l) {
      need("prestamo.crear");
      if (!data.clients.some((c) => c.id === l.clientId)) throw new Error("El cliente no existe.");
      if (!(l.amount > 0) || !(l.count >= 1) || l.rate < 0) throw new Error("Revisa monto, interés y plazo.");
      const p = plan(l.amount, l.rate, l.count, l.freq, l.startDate, [], { mode: l.interestMode, firstDate: l.firstDate });
      const lc = legalCheck(l.amount, p.cuotas, l.startDate);
      if (lc.exceeds && lc.block) throw new Error("La tasa efectiva (" + lc.ea.toFixed(2) + "% E.A.) supera la tasa de usura configurada (" + lc.limit + "% E.A.).");
      data.seq.loan = (data.seq.loan || 0) + 1;
      l.id = uid(); l.num = "P-" + String(data.seq.loan).padStart(4, "0"); l.charges = []; l.skipDates = l.skipDates || []; l.createdAt = new Date().toISOString();
      l.interestMode = l.interestMode || "flat"; l.createdBy = who();
      l.eaAtCreation = Math.round(lc.ea * 100) / 100;
      if (!l.portfolioId) { const c = data.clients.find((x) => x.id === l.clientId); l.portfolioId = c && c.portfolioId || null; }
      data.loans.push(l); audit("crear", "prestamo", l.id, l.num + " · " + money(l.amount)); save(); return l;
    },
    /* Un préstamo con pagos NO se elimina (se perdería historia financiera). */
    deleteLoan(id) {
      need("prestamo.crear");
      if (data.payments.some((x) => x.loanId === id && x.amount > 0 && !x.voided)) throw new Error("Este préstamo tiene pagos registrados; no se puede eliminar.");
      const l = data.loans.find((x) => x.id === id);
      data.loans = data.loans.filter((x) => x.id !== id);
      data.payments.filter((x) => x.loanId === id).forEach((x) => { x.voided = true; x.voidReason = x.voidReason || "Préstamo eliminado"; });
      audit("eliminar", "prestamo", id, l ? l.num : ""); save();
    },
    /* Registrar pago. Evita duplicados: el mismo "token" de formulario no se guarda dos
       veces, y un pago idéntico (mismo préstamo, monto y fecha) en menos de 20 s se rechaza. */
    addPayment(p) {
      need(p.amount > 0 ? "pago.registrar" : "visita.registrar");
      const loan = data.loans.find((l) => l.id === p.loanId); if (!loan) throw new Error("El préstamo no existe.");
      if (!canSeeClient(loan.clientId)) need("ver.todo");
      if (p.token) { const prev = data.payments.find((x) => x.token === p.token); if (prev) return prev; }
      if (p.amount > 0) {
        const now = Date.now();
        const dup = data.payments.find((x) => !x.voided && x.loanId === p.loanId && x.amount === p.amount && x.date === p.date && now - Date.parse(x.createdAt) < 20000);
        if (dup) { const e = new Error("Ese pago ya se registró hace unos segundos."); e.code = "duplicado"; throw e; }
        const st = computeLoan(loan);
        if (p.amount > st.balance) throw new Error("El monto supera el saldo del préstamo (" + money(st.balance) + ").");
        if (!Number.isInteger(p.amount)) throw new Error("El monto debe ser en pesos enteros.");
        data.seq.receipt = (data.seq.receipt || 0) + 1;
        p.receiptNo = "R-" + String(data.seq.receipt).padStart(6, "0");
      }
      p.id = uid(); p.createdAt = new Date().toISOString(); p.user = who();
      data.payments.push(p);
      audit(p.amount > 0 ? "pago" : "visita", "pago", p.id, loan.num + (p.amount > 0 ? " · " + money(p.amount) : " · no pagó"));
      save(); applyMora(); return p;
    },
    /* Los pagos confirmados no se borran: se ANULAN con motivo (queda en auditoría). */
    voidPayment(id, reason) {
      need("pago.anular");
      if (!reason || reason.trim().length < 4) throw new Error("Escribe el motivo de la anulación.");
      const p = data.payments.find((x) => x.id === id); if (!p || p.voided) return false;
      p.voided = true; p.voidReason = reason.trim(); p.voidedAt = new Date().toISOString(); p.voidedBy = who();
      const l = data.loans.find((x) => x.id === p.loanId);
      audit("anular", "pago", id, (l ? l.num : "") + " · " + money(p.amount) + " · " + p.voidReason);
      save(); return true;
    },
    deletePayment(id) { return this.voidPayment(id, "Registro eliminado por el usuario"); },
    removeCharge(loanId, cuota) {
      need("prestamo.crear");
      const l = data.loans.find((x) => x.id === loanId);
      const ch = (l.charges || []).find((x) => x.cuota === cuota);
      l.charges = (l.charges || []).filter((x) => x.cuota !== cuota);
      l.waived = (l.waived || []).concat(cuota);
      audit("perdonar recargo", "prestamo", loanId, l.num + " · cuota " + cuota + (ch ? " · " + money(ch.amount) : "")); save();
    },
    skipLoanDate(loanId, iso) {
      need("prestamo.crear");
      const l = data.loans.find((x) => x.id === loanId); l.skipDates = l.skipDates || [];
      if (!l.skipDates.includes(iso)) l.skipDates.push(iso);
      l.skipDates.sort(); audit("reprogramar", "prestamo", loanId, l.num + " · sin cobro " + iso); save();
    },
    unskipLoanDate(loanId, iso) {
      need("prestamo.crear");
      const l = data.loans.find((x) => x.id === loanId); l.skipDates = (l.skipDates || []).filter((x) => x !== iso);
      audit("reprogramar", "prestamo", loanId, l.num + " · vuelve a cobrar " + iso); save();
    },
    closeLoanNote(loanId, note) { need("prestamo.crear"); const l = data.loans.find((x) => x.id === loanId); l.notes = note; audit("nota", "prestamo", loanId, l.num); save(); },
    setNoPayWeekdays(arr) { need("config.editar"); data.settings.noPay.weekdays = arr.slice().sort(); save(); },
    addNoPayDate(iso, note) {
      need("config.editar");
      const np = data.settings.noPay; np.dates = (np.dates || []).filter((x) => (x.date || x) !== iso);
      np.dates.push({ date: iso, note: note || "" }); np.dates.sort((a, b) => a.date.localeCompare(b.date)); save();
    },
    setColombia(on) { need("config.editar"); data.settings.noPay.colombia = !!on; save(); },
    toggleColombiaDay(iso, collect) {
      need("config.editar");
      const np = data.settings.noPay; np.colombiaOff = (np.colombiaOff || []).filter((x) => x !== iso);
      if (collect) np.colombiaOff.push(iso);
      save();
    },
    removeNoPayDate(iso) { need("config.editar"); const np = data.settings.noPay; np.dates = (np.dates || []).filter((x) => (x.date || x) !== iso); save(); },
    addMovement(m) {
      need("movimiento.registrar");
      if (!(m.amount > 0) || !Number.isInteger(m.amount)) throw new Error("Escribe un monto válido en pesos.");
      if (!m.kind) m.kind = m.type === "in" ? "ingreso" : "gasto";
      if (m.kind === "ajuste" && (!m.detail || m.detail.trim().length < 4)) throw new Error("Un ajuste necesita el motivo.");
      if (m.kind === "ajuste") need("caja.operar");
      if (!m.type) m.type = movSign(m) < 0 ? "out" : "in";
      if (isDayClosed(m.date) && m.kind !== "ajuste") throw new Error("La caja del " + fmtDate(m.date) + " ya está cerrada. Registra un ajuste.");
      m.id = uid(); m.createdAt = new Date().toISOString(); m.user = who();
      data.movements.push(m); audit("crear", "movimiento", m.id, (MOV_KINDS[m.kind] || {}).label + " · " + m.concept + " · " + money(m.amount)); save(); return m;
    },
    voidMovement(id, reason) {
      need("movimiento.registrar");
      if (!reason || reason.trim().length < 4) throw new Error("Escribe el motivo de la anulación.");
      const m = data.movements.find((x) => x.id === id); if (!m || m.voided) return false;
      if (isDayClosed(m.date)) throw new Error("La caja de ese día está cerrada. Registra un ajuste en lugar de anular.");
      m.voided = true; m.voidReason = reason.trim(); m.voidedAt = new Date().toISOString(); m.voidedBy = who();
      audit("anular", "movimiento", id, m.concept + " · " + money(m.amount) + " · " + m.voidReason); save(); return true;
    },
    deleteMovement(id) { return this.voidMovement(id, "Eliminado por el usuario"); },
    saveMora(m) {
      need("config.editar");
      const cur = data.settings.mora;
      if (m.enabled && !cur.enabled) m.since = today();
      if (!m.enabled) m.since = null;
      else if (!m.since) m.since = cur.since || today();
      data.settings.mora = m; audit("configurar", "mora", null, m.enabled ? (m.type === "fixed" ? money(m.value) : m.value + "%") : "desactivado"); save(); applyMora();
    },
    saveSettings(patch) {
      need("config.editar");
      Object.keys(patch).forEach((k) => { data.settings[k] = patch[k]; });
      audit("configurar", "ajustes", null, Object.keys(patch).join(", ")); save();
    },
    // ----- Carteras -----
    savePortfolio(p) {
      need("cartera.gestionar");
      if (!p.name || p.name.trim().length < 2) throw new Error("Escribe el nombre de la cartera.");
      if (data.portfolios.some((x) => x.id !== p.id && x.name.trim().toLowerCase() === p.name.trim().toLowerCase())) throw new Error("Ya existe una cartera con ese nombre.");
      if (p.id) { const o = data.portfolios.find((x) => x.id === p.id); Object.assign(o, p); audit("editar", "cartera", p.id, p.name); }
      else { p.id = uid(); p.status = p.status || "activa"; p.createdAt = today(); data.portfolios.push(p); audit("crear", "cartera", p.id, p.name); }
      save(); return p;
    },
    /* Cambiar de cartera NO toca montos, tasas ni cuotas: solo la agrupación. */
    assignPortfolio(clientIds, portfolioId) {
      need("cartera.gestionar");
      clientIds.forEach((id) => {
        const c = data.clients.find((x) => x.id === id); if (!c) return;
        const from = c.portfolioId || null; if (from === portfolioId) return;
        c.portfolioId = portfolioId || null;
        data.loans.filter((l) => l.clientId === id && computeLoan(l).status !== "finalizado").forEach((l) => { l.portfolioId = portfolioId || null; });
        audit("cartera", "cliente", id, c.name, [{ field: "portfolioId", label: "Cartera", from: (data.portfolios.find((p) => p.id === from) || {}).name || "", to: (data.portfolios.find((p) => p.id === portfolioId) || {}).name || "" }]);
      });
      save();
    },
    // ----- Rutas -----
    saveRoute(r) {
      need("ruta.gestionar");
      if (!r.name || r.name.trim().length < 2) throw new Error("Escribe el nombre de la ruta.");
      r.clientIds = (r.clientIds || []).filter((id, i, a) => a.indexOf(id) === i && data.clients.some((c) => c.id === id));
      // Un cliente pertenece a una sola ruta: se quita de las demás.
      data.routes.forEach((o) => { if (o.id !== r.id) o.clientIds = (o.clientIds || []).filter((id) => !r.clientIds.includes(id)); });
      if (r.id) { const o = data.routes.find((x) => x.id === r.id); Object.assign(o, r); audit("editar", "ruta", r.id, r.name); }
      else { r.id = uid(); r.status = r.status || "activa"; r.createdAt = today(); data.routes.push(r); audit("crear", "ruta", r.id, r.name); }
      save(); return r;
    },
    addVisit(v) {
      need("visita.registrar");
      v.id = uid(); v.at = new Date().toISOString(); v.user = who(); v.date = v.date || today();
      data.visits.push(v);
      const c = data.clients.find((x) => x.id === v.clientId);
      audit("visita", "cliente", v.clientId, (c ? c.name : "") + " · " + v.result); save(); return v;
    },
    // ----- Caja -----
    openCash(date, opening) {
      need("caja.operar");
      if (data.cash.some((c) => c.date === date)) throw new Error("Ya hay una caja para ese día.");
      if (!(opening >= 0) || !Number.isInteger(opening)) throw new Error("Saldo inicial no válido.");
      const s = { id: uid(), date, opening, openedBy: who(), openedAt: new Date().toISOString(), status: "abierta" };
      data.cash.push(s); audit("abrir caja", "caja", s.id, fmtDate(date) + " · " + money(opening)); save(); return s;
    },
    closeCash(date, counted, notes) {
      need("caja.operar");
      const s = data.cash.find((c) => c.date === date); if (!s) throw new Error("No hay caja abierta ese día.");
      if (s.status === "cerrada") throw new Error("Esta caja ya está cerrada.");
      const r = cashDay(date);
      Object.assign(s, { status: "cerrada", counted, expected: r.expected, diff: counted - r.expected, notes: notes || "", closedAt: new Date().toISOString(), closedBy: who(),
        summary: { entries: r.entries, exits: r.exits, payCash: r.payCash, payOther: r.payOther, loans: r.loans, expenses: r.expenses, income: r.income, aportes: r.aportes, retiros: r.retiros, ajustes: r.ajustes } });
      audit("cerrar caja", "caja", s.id, fmtDate(date) + " · esperado " + money(r.expected) + " · contado " + money(counted)); save(); return s;
    },
    // ----- Usuarios -----
    async saveUser(u, password) {
      need("usuario.gestionar");
      const cfg = Config.get() || {};
      const uname = String(u.username || "").trim();
      if (uname.length < 3 || /\s/.test(uname)) throw new Error("El usuario debe tener al menos 3 caracteres y sin espacios.");
      if ((cfg.username || "").toLowerCase() === uname.toLowerCase() || data.users.some((x) => x.id !== u.id && x.username.toLowerCase() === uname.toLowerCase())) throw new Error("Ese nombre de usuario ya existe.");
      if (!ROLES[u.role]) throw new Error("Rol no válido.");
      let o = u.id ? data.users.find((x) => x.id === u.id) : null;
      if (!o) { if (!password || password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres."); o = { id: uid(), createdAt: new Date().toISOString(), active: true }; data.users.push(o); audit("crear", "usuario", o.id, uname + " · " + u.role); }
      else audit("editar", "usuario", o.id, uname + " · " + u.role);
      Object.assign(o, { username: uname, name: (u.name || "").trim(), role: u.role, phone: u.phone || "", routeIds: u.routeIds || [], portfolioIds: u.portfolioIds || [], extraPerms: u.extraPerms || [], active: u.active !== false });
      if (password) { if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres."); Object.assign(o, await Crypto.newHash(password)); }
      save(); return o;
    },
    /* Cambiar la propia contraseña (y el usuario, si es el administrador). Verifica la actual. */
    async changeOwnPassword(current, next, newUsername) {
      if (!session) throw new Error("Inicia sesión.");
      if (next && next.length < 6) throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
      if (session.id === "admin") {
        const cfg = Config.get();
        if (!(await Crypto.verify(cfg, current))) throw new Error("La contraseña actual no es correcta.");
        if (newUsername && newUsername !== cfg.username) {
          if (newUsername.length < 3 || /\s/.test(newUsername)) throw new Error("El usuario debe tener al menos 3 caracteres y sin espacios.");
          if (data.users.some((x) => x.username.toLowerCase() === newUsername.toLowerCase())) throw new Error("Ese nombre de usuario ya existe.");
          cfg.username = newUsername; session.username = newUsername; session.name = newUsername;
        }
        // El administrador conserva el formato de siempre (SHA-256 con sal) para que una
        // versión anterior de la app pueda seguir abriendo si se vuelve atrás.
        if (next) cfg.passwordHash = await Crypto.sha(next, cfg.salt);
        Config.set(cfg);
      } else {
        const u = data.users.find((x) => x.id === session.id);
        if (!u || !(await Crypto.verify(u, current))) throw new Error("La contraseña actual no es correcta.");
        if (next) Object.assign(u, await Crypto.newHash(next));
      }
      audit("contraseña", "usuario", session.id, session.username); save(); return true;
    },
    exportAll() { need("datos.respaldo"); return JSON.stringify({ app: "GestionPrestamos", version: SCHEMA, exportedAt: new Date().toISOString(), config: Config.get(), data }, null, 1); },
    importAll(json) {
      need("datos.respaldo");
      const o = JSON.parse(json);
      if (!o || o.app !== "GestionPrestamos" || !o.data || !o.data.clients) throw new Error("archivo");
      snapshot("antes de restaurar copia");
      data = normalize(o.data); cache = null; audit("restaurar", "datos", null, "copia del " + String(o.exportedAt || "").slice(0, 10)); save();
      if (o.config && o.config.passwordHash) Config.set(o.config);
    },
    /* Importar clientes desde CSV ya validado (filas sin errores). */
    importClients(rows) {
      need("cliente.editar");
      let n = 0;
      rows.forEach((r) => { const c = Object.assign({ id: uid(), createdAt: today(), status: "activo", refs: [] }, r); data.clients.push(c); n++; });
      audit("importar", "cliente", null, n + " clientes desde CSV"); save(); return n;
    },
  };

  // ================= Cifrado (contraseñas y copias) =================
  const Crypto = {
    hex(buf) { return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""); },
    unhex(h) { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; },
    salt(n) { const a = new Uint8Array(n || 16); crypto.getRandomValues(a); return a; },
    /* Contraseñas de usuarios nuevos: PBKDF2-SHA256, 150.000 iteraciones. */
    async pbkdf2(password, saltHex, iter) {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
      return this.hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: this.unhex(saltHex), iterations: iter }, key, 256));
    },
    async newHash(password) { const salt = this.hex(this.salt()); const iter = 150000; return { salt, iter, algo: "pbkdf2", passwordHash: await this.pbkdf2(password, salt, iter) }; },
    async sha(password, salt) { return this.hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + password))); },
    async verify(rec, password) {
      if (!rec || !rec.passwordHash) return false;
      const h = rec.algo === "pbkdf2" ? await this.pbkdf2(password, rec.salt, rec.iter || 150000) : await this.sha(password, rec.salt);
      return h === rec.passwordHash;
    },
    /* Copias cifradas: AES-GCM con clave derivada de una contraseña (PBKDF2). */
    async encrypt(text, password) {
      const salt = this.salt(16), iv = this.salt(12);
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 150000 }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
      const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
      return JSON.stringify({ app: "GestionPrestamos", encrypted: "AES-GCM", kdf: "PBKDF2-SHA256", iter: 150000, salt: this.hex(salt), iv: this.hex(iv), data: this.hex(ct) });
    },
    async decrypt(json, password) {
      const o = typeof json === "string" ? JSON.parse(json) : json;
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: this.unhex(o.salt), iterations: o.iter || 150000 }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: this.unhex(o.iv) }, key, this.unhex(o.data));
      return new TextDecoder().decode(pt);
    },
  };

  /* Inicia sesión: el administrador (configuración inicial) o un usuario creado. */
  async function login(username, password) {
    const cfg = Config.get();
    const u = String(username || "").trim().toLowerCase();
    if (cfg && cfg.username && cfg.username.toLowerCase() === u) {
      if (await Crypto.verify(cfg, password)) return startSession({ id: "admin", username: cfg.username, name: cfg.username, role: "admin" });
      return null;
    }
    const rec = data.users.find((x) => x.username.toLowerCase() === u && x.active !== false);
    if (rec && await Crypto.verify(rec, password)) return startSession({ id: rec.id, username: rec.username, name: rec.name || rec.username, role: rec.role });
    return null;
  }
  function startSession(s) { session = s; cache = null; audit("ingreso", "sesion", s.id, s.username); save(); return s; }
  function endSession() { if (session) { audit("salida", "sesion", session.id, session.username); save(); } session = null; }

  function restoreSnapshot(i) {
    need("datos.respaldo");
    const s = snapshots()[i]; if (!s) return false;
    snapshot("antes de restaurar copia automática");
    data = normalize(s.data); cache = null; audit("restaurar", "datos", null, "copia automática del " + s.at.slice(0, 10)); save(); return true;
  }

  /* ----- Huella / biometría (complemento NativeBiometric) ----- */
  const BIO_KEY = "gp.bio.v1";
  window.Bio = {
    plugin() { const C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.NativeBiometric; },
    enabled() { try { return !!(JSON.parse(localStorage.getItem(BIO_KEY)) || {}).enabled; } catch (e) { return false; } },
    setEnabled(on, userId) { if (on) localStorage.setItem(BIO_KEY, JSON.stringify({ enabled: true, since: today(), userId: userId || "admin" })); else localStorage.removeItem(BIO_KEY); },
    userId() { try { return (JSON.parse(localStorage.getItem(BIO_KEY)) || {}).userId || "admin"; } catch (e) { return "admin"; } },
    async available() {
      const B = this.plugin(); if (!B) return false;
      try { const r = await B.isAvailable({ useFallback: false }); return !!(r && r.isAvailable); } catch (e) { return false; }
    },
    async verify(title, subtitle) {
      const B = this.plugin(); if (!B) return { ok: false, error: "La huella no está disponible en este celular." };
      try {
        await B.verifyIdentity({ title, subtitle, reason: "Confirma tu identidad", description: "Pon tu dedo en el lector de huella", negativeButtonText: "Usar contraseña", maxAttempts: 5 });
        return { ok: true };
      } catch (e) {
        const m = String((e && (e.message || e.code)) || e || "");
        if (/cancel|negative|user/i.test(m)) return { ok: false };
        if (/lockout|too many/i.test(m)) return { ok: false, error: "Demasiados intentos con huella. Usa tu contraseña." };
        return { ok: false, error: "No se reconoció la huella. Intenta de nuevo o usa tu contraseña." };
      }
    },
  };

  window.GP = {
    get data() { return data; }, save, uid, Config, ready, snapshots, restoreSnapshot, versionInfo, mirrorNow, snapshot,
    today, toISO, parseISO, addDays, addMonths, diffDays, fmtDate, fmtDateShort, fmtDateLong, relDay,
    MESES, MESES_LARGO, DIAS,
    money, moneyShort, parseMoney,
    FREQ, plan, computeLoan, noPayRules, isNoPay, noPayReason, colombiaHolidays, colombiaHoliday, DIAS_LARGO, applyMora, state, totals, cuotasBetween, upcoming,
    period, finance, flow, movements, ops,
    // rediseño (esquema 2)
    SCHEMA, INTEREST_MODES, PERIOD_DAYS, termMonths, interestFor, loanPlan, effectiveAnnualRate, legalCheck, previewPayment,
    ROLES, PERM_LABELS, can, need, visibleClientIds, canSeeClient, audit, login, endSession, startSession,
    get session() { return session; }, CLIENT_STATUS, CLIENT_FIELDS, validateClient, collectionsFor, cashAvailable, cashDay, isDayClosed,
    MOV_KINDS, movSign, Crypto, activePay,
  };
})();
