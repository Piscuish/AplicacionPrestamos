/* Gestión de Préstamos — arranque de la app, barra inferior, acciones rápidas,
   copias en Drive, bloqueo de sesión y actualizaciones desde GitHub.
   Las pantallas están en s-*.js; los componentes en ui.js; los datos en core.js. */
(function () {
  "use strict";
  const G = window.GP, U = window.UI;
  const { $, $$, esc, ic, C, goAttr, sheet, closeLayer, confirmBox, promptBox, alertBox, toast } = U;
  let onLogout = null;

  // ================= Barra inferior y botón central =================
  function buildTabbar() {
    const t = { inicio: ["home", "Inicio"], clientes: ["users", "Clientes"], cobros: ["calendar", "Cobros"], mas: ["grid", "Más"] };
    $$(".tab").forEach((b) => { const [i, l] = t[b.dataset.tab]; b.innerHTML = ic(i) + `<span>${l}</span>`; b.setAttribute("aria-label", l); });
    $("#fab").innerHTML = ic("plus"); $("#fab").onclick = fabSheet;
  }
  function fabSheet() {
    const o = [];
    if (G.can("cliente.editar")) o.push(C.opt("user", "blue", "Nuevo cliente", "Solo el nombre es obligatorio", goAttr("clienteForm", {})));
    if (G.can("prestamo.crear")) o.push(C.opt("hand", "violet", "Nuevo préstamo", "Con simulación antes de guardar", goAttr("prestamoForm", {})));
    if (G.can("pago.registrar")) o.push(C.opt("dollar", "green", "Registrar pago", "Total, parcial o varias cuotas", 'id="fs-pay"'));
    if (G.can("movimiento.registrar")) { o.push(C.opt("up", "red", "Registrar gasto", "Transporte, papelería, otros", goAttr("movForm", { kind: "gasto" }))); o.push(C.opt("repeat", "grey", "Nuevo movimiento", "Ingreso, aporte, retiro o ajuste", goAttr("movForm", { kind: "ingreso" }))); }
    sheet("¿Qué quieres hacer?", o.join("") || C.empty("lock", "", "Tu usuario no tiene acciones disponibles."), (s) => { const b = $("#fs-pay", s); if (b) b.onclick = () => U.pickLoanSheet(); });
  }

  // ================= Copia de seguridad (Drive u otra app) =================
  const BK_KEY = "gp.backup.drive";
  function lastBackup() { try { return JSON.parse(localStorage.getItem(BK_KEY)) || null; } catch (e) { return null; } }
  function backupAgeDays() { const b = lastBackup(); return b ? G.diffDays(b.date, G.today()) : null; }
  U.backupAgeText = () => { const n = backupAgeDays(); return n === null ? "Nunca" : n === 0 ? "Hoy" : n === 1 ? "Ayer" : "Hace " + n + " días"; };
  function backupDue() {
    if (!G.can("datos.respaldo")) return false;
    const d = G.data; if (!d.clients.length && !d.loans.length) return false;
    const n = backupAgeDays(); if (n !== null && n < 1) return false;
    return localStorage.getItem("gp.backup.snooze") !== G.today();
  }
  U.saveBackup = async (encrypt) => {
    let json; try { json = G.ops.exportAll(); } catch (e) { alertBox("Sin permiso", esc(e.message)); return; }
    let name = "copia_prestamos_" + G.today() + ".json";
    if (encrypt) {
      const pw = await promptBox("Contraseña de la copia", "Guárdala bien: sin ella no se puede abrir la copia.", "Mínimo 6 caracteres", "Cifrar y guardar", { type: "password", min: 6, minMsg: "Mínimo 6 caracteres." });
      if (!pw) return;
      json = await G.Crypto.encrypt(json, pw); name = "copia_prestamos_" + G.today() + "_cifrada.json";
    }
    const ok = await U.shareFile(name, json, "application/json", "Copia de seguridad " + G.fmtDate(G.today()));
    if (ok) { localStorage.setItem(BK_KEY, JSON.stringify({ date: G.today(), at: new Date().toISOString(), encrypted: !!encrypt })); G.audit("respaldo", "datos", null, encrypt ? "cifrada" : "sin cifrar"); G.save(); toast("Copia lista. Si elegiste Drive, quedó en tu cuenta.", "ok"); U.refresh(); }
  };
  U.backupBanner = () => backupDue() ? `<div class="alert warn">${ic("upload")}<div class="grow"><b>${backupAgeDays() === null ? "Aún no tienes copia de seguridad" : "Última copia: " + U.backupAgeText().toLowerCase()}</b><span>Guárdala en Drive para no perder tus datos.</span>
    <div class="row" style="margin-top:8px;gap:8px"><button class="btn sm btn-primary" id="bk-now">Guardar ahora</button><button class="btn sm btn-soft" id="bk-later">Después</button></div></div></div>` : "";
  U.updateBanner = () => Update.liveReady ? `<button class="update-banner" id="live-apply">${ic("repeat")}<div><b>Actualización lista (${esc(Update.liveReady.version)})</b><span>Se aplica sola al abrir la app. Toca para aplicarla ahora.</span></div>${ic("right")}</button>`
    : Update.available ? `<button class="update-banner" ${goAttr("ajuste", { sec: "aplicacion" })}>${ic("download")}<div><b>Nueva versión ${esc(Update.available.version)}</b><span>Toca para actualizar. Tus datos no se borran.</span></div>${ic("right")}</button>` : "";
  U.bindBanners = (v) => {
    const a = $("#live-apply", v); if (a) a.onclick = () => Update.applyLiveNow();
    const b = $("#bk-now", v); if (b) b.onclick = () => U.saveBackup(false);
    const c = $("#bk-later", v); if (c) c.onclick = () => { localStorage.setItem("gp.backup.snooze", G.today()); U.refresh(); };
  };

  // ================= Sesión y bloqueo =================
  U.lockMinutes = () => { const v = localStorage.getItem("gp.lock.min"); return v == null ? 5 : +v; };
  U.logout = async () => { if (await confirmBox("¿Cerrar sesión?", "Tendrás que escribir tu usuario y contraseña para volver a entrar.", "Cerrar sesión")) doLogout(); };
  function doLogout() { G.endSession(); closeLayer(); if (onLogout) onLogout(); }
  let hiddenAt = 0;
  function onHide() { hiddenAt = Date.now(); }
  function onShow() {
    const m = U.lockMinutes();
    if (G.session && m > 0 && hiddenAt && Date.now() - hiddenAt > m * 60000) { hiddenAt = 0; doLogout(); toast("Sesión bloqueada por inactividad"); }
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) onHide(); else onShow(); });
  const AppPl = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (AppPl && AppPl.addListener) { AppPl.addListener("pause", onHide); AppPl.addListener("resume", onShow); }

  // ================= Actualizaciones desde GitHub =================
  /* REGLA PARA NO PERDER DATOS AL ACTUALIZAR:
     - El APK nuevo debe tener el mismo identificador (com.piscuish.prestamos),
       la misma firma (android/app/debug.keystore) y un número de versión mayor.
     - Nunca desinstales la app para instalar una versión nueva: eso sí borra los datos. */
  const GITHUB_REPO = "Piscuish/AplicacionPrestamos";
  const Update = {
    current: { version: "1.0", build: 0 }, available: null, latest: null, liveReady: null, liveError: null, lastAuto: 0, dismissed: null, pending: false,
    async init() {
      try { const vi = await G.versionInfo(); this.current = { version: vi.webVersion, build: vi.webBuild, nativeBuild: vi.nativeBuild, canLive: vi.canLive, live: vi.live }; } catch (e) { /* navegador */ }
      this.welcome(); this.auto();
      if (AppPl && AppPl.addListener) AppPl.addListener("resume", () => this.auto());
      document.addEventListener("visibilitychange", () => { if (!document.hidden) this.auto(); });
    },
    welcome() {
      try {
        const b = String(this.current.build || ""); if (!b || b === "0") return;
        const seen = localStorage.getItem("gp.seenBuild"); localStorage.setItem("gp.seenBuild", b);
        const from = G.updatedFrom || (seen && seen !== b ? seen : null); if (!from || from === "web") return;
        const d = G.data;
        U.layer().innerHTML = `<div class="modal"><div class="modal-card center"><div class="success" style="padding:0"><div class="ok">${ic("check")}</div></div><h3 style="margin-top:12px">¡App actualizada!</h3>
          <p>Ahora tienes la versión <b>${esc(this.current.version)}</b>. Tus datos están completos:<br><b>${d.clients.length}</b> clientes · <b>${d.loans.length}</b> préstamos · <b>${d.payments.filter((x) => x.amount > 0).length}</b> pagos</p>
          <button class="btn btn-primary" id="upd-ok">Entendido</button></div></div>`;
        $("#upd-ok", U.layer()).onclick = closeLayer; this.dismissed = this.current.build;
      } catch (e) { /* no bloquear */ }
    },
    async auto() {
      if (Date.now() - this.lastAuto < 30 * 60 * 1000) return;
      this.lastAuto = Date.now();
      const r = await this.check(false); if (!r.release) return;
      if (r.release.live) { const ok = await this.downloadLive(r.release, false); if (!ok) { r.release.live = false; r.release.liveFailed = true; } }
      const cur = U.stack.length && U.cur(); if (cur && cur.name === "inicio") U.refresh();
      if (!r.release.live) this.prompt();
    },
    async downloadLive(rel, applyNow) {
      const Up = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater; if (!Up) return false;
      try {
        let pend = null; try { pend = JSON.parse(localStorage.getItem("gp.live.pending")); } catch (e) { /* nada */ }
        if (!pend || pend.build !== rel.build) {
          if (!rel.webSha256) throw new Error("Falta la huella (checksum) del paquete");
          const b = await Up.download({ url: rel.webUrl, version: rel.version, checksum: rel.webSha256 });
          pend = { id: b.id, build: rel.build, version: rel.version };
          localStorage.setItem("gp.live.pending", JSON.stringify(pend)); localStorage.removeItem("gp.live.tried");
        }
        this.liveReady = pend;
        if (applyNow) { G.snapshot("antes de actualización en vivo → " + rel.build); await G.mirrorNow(); localStorage.setItem("gp.live.tried", String(rel.build)); await Up.set({ id: pend.id }); }
        this.liveError = null; return true;
      } catch (e) { this.liveError = String((e && (e.message || e.errorMessage)) || e || "error"); return false; }
    },
    async applyLiveNow() {
      if (!this.liveReady) return;
      if (!(await confirmBox("Aplicar actualización", "La app se reinicia en unos segundos con la versión " + esc(this.liveReady.version) + ". Tus datos no se tocan.", "Aplicar ahora"))) return;
      toast("Actualizando…"); await this.downloadLive({ build: this.liveReady.build, version: this.liveReady.version, webUrl: "" }, true);
    },
    prompt() {
      const rel = this.available; if (!rel || this.dismissed === rel.build) return;
      const cur = U.stack.length && U.cur();
      if (!cur || !U.TABS.includes(cur.name) || U.stack.length > 1 || U.layer().innerHTML) { this.pending = true; return; }
      this.pending = false;
      U.layer().innerHTML = `<div class="modal"><div class="modal-card"><h3>Nueva versión disponible</h3>
        <p>Ya está lista la versión <b>${esc(rel.version)}</b>.${rel.liveFailed ? " No se pudo descargar la actualización rápida; puedes actualizar con el APK." : ""} Tus clientes, préstamos y pagos <b>no se borran</b>.</p>
        <div class="form"><button class="btn btn-primary" id="upd-now">${ic("download")}Ver actualización</button><button class="btn btn-soft" id="upd-later">Más tarde</button></div></div></div>`;
      $("#upd-later", U.layer()).onclick = () => { this.dismissed = rel.build; closeLayer(); };
      $("#upd-now", U.layer()).onclick = () => { closeLayer(); U.go("ajuste", { sec: "aplicacion" }); };
    },
    async fetchLatest() {
      let lastErr = null;
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/updates/latest.json?t=${Date.now()}`, { cache: "no-store" });
        if (r.ok) { const j = await r.json(); if (j && j.build) return { build: +j.build, version: j.version, date: j.date, notes: j.notes || "", apkUrl: j.apkUrl, size: j.apkSize, page: j.page, web: j.webUrl && j.webSha256 ? { url: j.webUrl, minNative: +j.minNative || 0, sha256: String(j.webSha256).toLowerCase() } : null }; }
        else lastErr = r.status;
      } catch (e) { lastErr = "net"; }
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
        if (res.status === 404) return { none: true }; if (!res.ok) return { status: res.status };
        const j = await res.json(); const m = String(j.tag_name || "").match(/(\d+)\.(\d+)\.(\d+)/);
        const apk = (j.assets || []).find((x) => /\.apk$/i.test(x.name)); let web = null;
        for (const x of j.assets || []) { const w = x.name.match(/^www-(\d+)-n(\d+)(?:-h[0-9a-f]+)?\.zip$/); const d = String(x.digest || "").match(/^sha256:([0-9a-f]{64})$/i); if (w && d) web = { url: x.browser_download_url, minNative: +w[2], sha256: d[1].toLowerCase() }; }
        return { build: m ? +m[3] : 0, version: m ? m[0] : j.tag_name, date: String(j.published_at || "").slice(0, 10), notes: j.body || "", apkUrl: apk && apk.browser_download_url, size: apk && apk.size, page: j.html_url, web };
      } catch (e) { return { status: lastErr === "net" ? "net" : lastErr || "net" }; }
    },
    cleanNotes(t) { return String(t || "").split(/\n/).filter((l) => !/^(Co-Authored-By|Claude-Session|Signed-off-by)/i.test(l.trim())).join("\n").trim(); },
    async check(manual) {
      if (navigator.onLine === false) return { error: "Sin conexión a internet. Conéctate e intenta de nuevo." };
      const r = await this.fetchLatest(); localStorage.setItem("gp.update.lastCheck", String(Date.now()));
      if (r.none) return manual ? { error: "Todavía no hay versiones publicadas." } : {};
      if (r.status) { if (r.status === "net") return { error: "No se pudo conectar con GitHub. Revisa tu conexión." }; if (r.status === 403 || r.status === 429) return { error: "GitHub está limitando las consultas. Intenta en unos minutos." }; return { error: "No se pudo consultar GitHub (código " + r.status + ")." }; }
      if (r.build > this.current.build) {
        const live = !!(r.web && this.current.canLive && this.current.nativeBuild >= r.web.minNative && localStorage.getItem("gp.live.failed") !== String(r.build));
        this.available = { version: r.version, build: r.build, date: r.date || G.today(), notes: this.cleanNotes(r.notes), apkUrl: r.apkUrl, size: r.size, page: r.page, live, webUrl: r.web && r.web.url, webSha256: r.web && r.web.sha256 };
        return { release: this.available };
      }
      this.available = null; this.latest = r; return {};
    },
  };
  U.appVersion = () => Update.current.version;
  U.bindUpdateBox = (v) => {
    const box = $("#up-box", v);
    const show = (r) => {
      if (r.error) { box.innerHTML = C.alert("danger", "alert", "No se pudo revisar", esc(r.error)) + `<button class="btn btn-soft" id="up-apk">${ic("download")}Abrir página de versiones</button>`; $("#up-apk", v).onclick = () => U.openExternal(`https://github.com/${GITHUB_REPO}/releases/latest`); return; }
      if (!r.release) {
        const L = Update.latest; const oldBase = L && L.build && Update.current.nativeBuild && L.build > Update.current.nativeBuild;
        box.innerHTML = C.alert("ok", "checkcircle", "Tienes la última versión", "") + (oldBase ? `<button class="btn btn-soft" id="up-apk">${ic("download")}Instalar APK ${esc(L.version)} (opcional)</button><p class="hint">Actualiza el ícono y la base de la app. Instálalo encima, sin desinstalar.</p>` : "");
        const b = $("#up-apk", v); if (b) b.onclick = () => U.openExternal(L.apkUrl || L.page || `https://github.com/${GITHUB_REPO}/releases/latest`); return;
      }
      const rel = r.release;
      box.innerHTML = `<div class="card"><b class="blue">Nueva versión ${esc(rel.version)}</b><div class="small muted">${rel.live ? "Actualización rápida: no necesita instalar APK." : "Publicada el " + G.fmtDate(rel.date)}</div>${rel.notes ? `<div class="small" style="white-space:pre-wrap;margin-top:8px">${esc(rel.notes.slice(0, 600))}</div>` : ""}</div>
        ${rel.live ? `<button class="btn btn-primary" id="up-live">${ic("repeat")}Actualizar ahora</button>` : `<button class="btn btn-soft" id="up-bk">${ic("upload")}1. Guardar copia de seguridad</button><button class="btn btn-primary" id="up-dl">${ic("download")}2. Descargar e instalar APK</button>`}
        <button class="btn btn-soft" id="up-apk">${ic("download")}Actualizar mediante APK (opcional)</button>`;
      $("#up-apk", v).onclick = () => U.openExternal(rel.apkUrl || rel.page || `https://github.com/${GITHUB_REPO}/releases/latest`);
      const lv = $("#up-live", v); if (lv) lv.onclick = async () => { U.busy(lv, true, "Descargando…"); const ok = await Update.downloadLive(rel, false); U.busy(lv, false); if (ok) Update.applyLiveNow(); else alertBox("No se pudo descargar", "Usa «Actualizar mediante APK». Detalle: " + esc(Update.liveError || "")); };
      const bk = $("#up-bk", v); if (bk) bk.onclick = () => U.saveBackup(false);
      const dl = $("#up-dl", v); if (dl) dl.onclick = () => U.openExternal(rel.apkUrl || rel.page);
    };
    if (Update.available) show({ release: Update.available });
    $("#up-check", v).onclick = async () => { const b = $("#up-check", v); U.busy(b, true, "Buscando…"); const r = await Update.check(true); U.busy(b, false); show(r); };
  };
  U.afterRender = () => { if (Update.pending) setTimeout(() => Update.prompt(), 300); };

  // ================= Inicio =================
  let started = false;
  window.Main = {
    start(cfg, logout) {
      onLogout = logout;
      if (window.Docs) window.Docs.logoImg();
      buildTabbar(); G.applyMora();
      U.root("inicio");
      if (!started) { started = true; Update.init(); }
    },
    back() { return U.back(); },
  };
})();
