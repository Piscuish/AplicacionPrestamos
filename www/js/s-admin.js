/* Pantallas: Usuarios y cobradores, Auditoría y Configuración. */
(function () {
  "use strict";
  const G = window.GP, U = window.UI, S = U.Screens;
  const { $, $$, esc, money, ic, C, plural, goAttr, appbar, act, actAsync, sheet, closeLayer, confirmBox, promptBox, alertBox, toast, fmtIn } = U;
  const noPerm = (t) => ({ html: appbar({ back: true, title: t }) + `<main class="body">${C.empty("lock", "Sin permiso", "Tu usuario no tiene acceso a esta sección.")}</main>` });
  const cfg = () => G.Config.get() || {};

  // ---------------------------------------------------------------- USUARIOS
  S.usuarios = () => {
    if (!G.can("ver.usuarios")) return noPerm("Usuarios");
    const t = G.today(); const m = G.period("mes");
    const stats = (uname) => { const ps = G.data.payments.filter((p) => G.activePay(p) && p.user === uname && p.date >= m.from); return { n: ps.length, v: ps.reduce((s, p) => s + p.amount, 0), today: ps.filter((p) => p.date === t).reduce((s, p) => s + p.amount, 0) }; };
    const admin = { id: "admin", username: cfg().username, name: cfg().username, role: "admin", active: true };
    const list = [admin].concat(G.data.users);
    return {
      html: appbar({ back: true, title: "Usuarios y cobradores", right: G.can("usuario.gestionar") ? `<button class="icon-btn" ${goAttr("usuarioForm", {})} aria-label="Nuevo usuario">${ic("plus")}</button>` : "" }) + `<main class="body">
        ${C.alert("info", "info", "Usuarios en este teléfono", "Cada persona entra con su usuario y ve solo lo que su rol permite. Los datos NO se sincronizan entre teléfonos: eso requiere un servidor que esta app todavía no tiene.")}
        <div class="list">${list.map((u) => { const s = stats(u.username); return `<button class="item" ${u.id === "admin" ? "" : goAttr("usuarioForm", { id: u.id })}>${U.avatar({ id: u.id, name: u.name || u.username })}<div class="grow"><div class="name">${esc(u.name || u.username)}</div><div class="sub">@${esc(u.username)} · ${G.ROLES[u.role].label}${u.active === false ? " · inactivo" : ""}</div>
          ${u.role === "cobrador" ? `<div class="sub">Rutas: ${esc(G.data.routes.filter((r) => r.collectorId === u.id || (u.routeIds || []).includes(r.id)).map((r) => r.name).join(", ") || "ninguna")}</div>` : ""}</div>
          <div class="right"><span class="amount small">${money(s.v)}</span><span class="xs muted">${plural(s.n, "pago", "pagos")} este mes</span></div></button>`; }).join("")}</div>
        <p class="hint">El administrador es la cuenta creada en la configuración inicial; se edita en Configuración → Seguridad.</p>
      </main>`,
    };
  };
  S.usuarioForm = (p) => {
    if (!G.can("usuario.gestionar")) return noPerm("Usuario");
    const u = p.draft || (p.id ? JSON.parse(JSON.stringify(G.data.users.find((x) => x.id === p.id))) : { role: "cobrador", routeIds: [], portfolioIds: [], extraPerms: [], active: true });
    p.draft = u;
    const base = G.ROLES[u.role].perms;
    const extraOpts = Object.keys(G.PERM_LABELS).filter((k) => !base.includes("*") && !base.includes(k));
    const acts = p.id ? G.data.audit.filter((a) => a.user === u.username).slice(0, 15) : [];
    return {
      html: appbar({ back: true, title: p.id ? "Editar usuario" : "Nuevo usuario" }) + `<main class="body pad-bottom"><form class="form" id="uf" novalidate autocomplete="off">
        ${C.field({ id: "uf-name", label: "Nombre", icon: "user", value: u.name, attrs: 'maxlength="50"' })}
        ${C.field({ id: "uf-user", label: "Usuario (para entrar)", icon: "key", value: u.username, req: true, attrs: 'maxlength="30" autocapitalize="none" spellcheck="false"' })}
        ${C.field({ id: "uf-phone", label: "Teléfono", icon: "phone", value: u.phone, type: "tel", attrs: 'maxlength="20"' })}
        ${C.field({ id: "uf-pass", label: p.id ? "Nueva contraseña (opcional)" : "Contraseña", icon: "lock", type: "password", req: !p.id, attrs: 'maxlength="64" autocomplete="new-password"' })}
        <div class="fieldset-title">Rol</div>
        ${C.seg("role", [["cobrador", "Cobrador"], ["supervisor", "Supervisor"], ["admin", "Administrador"]], u.role)}
        <p class="hint">${u.role === "cobrador" ? "Ve solo los clientes de sus rutas y carteras asignadas. Registra pagos y visitas. No crea préstamos ni anula pagos." : u.role === "supervisor" ? "Consulta todo (clientes, rutas, carteras, finanzas y reportes) sin poder modificar." : "Control total del negocio."}</p>
        ${u.role !== "admin" ? `<div class="fieldset-title">Rutas asignadas</div>
          ${G.data.routes.length ? `<div class="list">${G.data.routes.map((r) => `<label class="item compact"><input type="checkbox" data-rt="${r.id}" ${(u.routeIds || []).includes(r.id) || r.collectorId === u.id ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--primary)"><div class="grow"><div class="name">${esc(r.name)}</div><div class="sub">${plural((r.clientIds || []).length, "cliente", "clientes")}</div></div></label>`).join("")}</div>` : `<p class="hint">No hay rutas creadas.</p>`}
          <div class="fieldset-title">Carteras asignadas</div>
          ${G.data.portfolios.length ? `<div class="list">${G.data.portfolios.map((x) => `<label class="item compact"><input type="checkbox" data-pf="${x.id}" ${(u.portfolioIds || []).includes(x.id) ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--primary)"><div class="grow"><div class="name">${esc(x.name)}</div></div></label>`).join("")}</div>` : `<p class="hint">No hay carteras creadas.</p>`}
          <details class="more"><summary>Permisos adicionales ${ic("chevdown")}</summary><div>${extraOpts.map((k) => `<label class="check"><input type="checkbox" data-perm="${k}" ${(u.extraPerms || []).includes(k) ? "checked" : ""}>${esc(G.PERM_LABELS[k])}</label>`).join("")}</div></details>` : ""}
        ${p.id ? C.seg("act", [["1", "Activo"], ["0", "Inactivo"]], u.active === false ? "0" : "1", "two") : ""}
        ${acts.length ? C.section("Actividad reciente", "", `<div class="card timeline">${acts.map((a) => `<div class="ev"><div class="grow"><div class="small"><b>${esc(a.action)}</b> · ${esc(a.detail)}</div><div class="when">${G.fmtDate(a.at.slice(0, 10))} ${a.at.slice(11, 16)}</div></div></div>`).join("")}</div>`) : ""}
        <div class="sticky-cta"><button class="btn btn-primary" type="submit" id="uf-save">${ic("check")}Guardar usuario</button></div>
      </form></main>`,
      bind(v) {
        const read = () => { u.name = $("#uf-name", v).value.trim(); u.username = $("#uf-user", v).value.trim(); u.phone = $("#uf-phone", v).value.trim(); };
        $$("[data-role]", v).forEach((b) => b.onclick = () => { read(); u.role = b.dataset.role; U.refresh(); });
        $$("[data-act]", v).forEach((b) => b.onclick = () => { u.active = b.dataset.act === "1"; $$("[data-act]", v).forEach((x) => x.classList.toggle("on", x === b)); });
        $("#uf", v).onsubmit = async (e) => {
          e.preventDefault(); read();
          u.routeIds = $$("[data-rt]", v).filter((x) => x.checked).map((x) => x.dataset.rt);
          u.portfolioIds = $$("[data-pf]", v).filter((x) => x.checked).map((x) => x.dataset.pf);
          u.extraPerms = $$("[data-perm]", v).filter((x) => x.checked).map((x) => x.dataset.perm);
          const pass = $("#uf-pass", v).value;
          const errs = {}; if (u.username.length < 3 || /\s/.test(u.username)) errs["uf-user"] = "Mínimo 3 caracteres, sin espacios."; if ((!p.id || pass) && pass.length < 6) errs["uf-pass"] = "Mínimo 6 caracteres.";
          if (!U.fieldErrors(v, errs)) return;
          const btn = $("#uf-save", v); U.busy(btn, true, "Cifrando…");
          const ok = await actAsync(() => G.ops.saveUser(Object.assign({}, u, { id: p.id }), pass), "Usuario guardado");
          U.busy(btn, false); if (ok) U.back();
        };
      },
    };
  };

  // ---------------------------------------------------------------- AUDITORÍA
  S.auditoria = (p) => {
    if (!G.can("ver.reportes")) return noPerm("Auditoría");
    const f = p.f || "todo"; const q = (p.q || "").toLowerCase();
    const groups = { todo: null, pago: ["pago", "anular"], cliente: ["crear", "editar", "estado", "cartera"], caja: ["abrir caja", "cerrar caja"], sesion: ["ingreso", "salida"], config: ["configurar", "restaurar", "importar"] };
    let rows = G.data.audit;
    if (groups[f]) rows = rows.filter((a) => groups[f].includes(a.action) && (f !== "cliente" || a.entity === "cliente"));
    if (q) rows = rows.filter((a) => [a.user, a.detail, a.action, a.entity].some((s) => String(s || "").toLowerCase().includes(q)));
    return {
      html: appbar({ back: true, title: "Auditoría", sub: plural(G.data.audit.length, "registro", "registros") }) + `<main class="body">
        <div class="search"><div class="field">${ic("search")}<input id="au-q" type="search" placeholder="Usuario, cliente, préstamo…" value="${esc(p.q || "")}"></div></div>
        ${C.chips("f", [["todo", "Todo"], ["pago", "Pagos y anulaciones"], ["cliente", "Clientes"], ["caja", "Caja"], ["sesion", "Sesiones"], ["config", "Configuración"]], f)}
        ${rows.length ? `<div class="card timeline">${rows.slice(0, 200).map((a) => `<div class="ev"><span class="lead-ico ${a.action === "anular" ? "t-red" : a.action === "pago" ? "t-green" : ""}">${ic(a.action === "pago" ? "dollar" : a.action === "anular" ? "ban" : a.action === "editar" ? "edit" : a.entity === "sesion" ? "key" : "history")}</span><div class="grow">
          <div class="small"><b>${esc(a.action)}</b> · ${esc(a.entity)}${a.detail ? " · " + esc(a.detail) : ""}</div>
          ${(a.changes || []).map((c) => `<div class="xs muted">${esc(c.label)}: ${esc(String(c.from || "(vacío)"))} → ${esc(String(c.to || "(vacío)"))}</div>`).join("")}
          <div class="when">${G.fmtDate(a.at.slice(0, 10))} ${a.at.slice(11, 16)} · ${esc(a.user)}</div></div></div>`).join("")}</div>` : C.empty("shield", "Sin registros", "")}
        <p class="hint">Se guardan los últimos 3.000 registros. Las operaciones anteriores al rediseño no tienen auditoría.</p>
      </main>`,
      bind(v) {
        $$("[data-f]", v).forEach((b) => b.onclick = () => U.setParam({ f: b.dataset.f }, true));
        $("#au-q", v).oninput = (e) => { p.q = e.target.value; clearTimeout(p._t); p._t = setTimeout(() => { U.refresh(); const i = $("#au-q"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); };
      },
    };
  };

  // ---------------------------------------------------------------- CONFIGURACIÓN (menú)
  const SECS = [
    ["empresa", "building", "Empresa", "Nombre, logo y datos comerciales", "config.editar"],
    ["apariencia", "sun", "Apariencia", "Tema claro, oscuro o del sistema", null],
    ["seguridad", "lock", "Seguridad", "Contraseña, bloqueo, huella y actividad", null],
    ["finanzas", "percent", "Finanzas", "Métodos de pago, gastos, intereses, mora, usura y días sin cobro", "config.editar"],
    ["datos", "download", "Datos", "Copias de seguridad, restaurar y exportar", "datos.respaldo"],
    ["aplicacion", "info", "Aplicación", "Versión, actualizaciones y acerca de", null],
  ];
  S.ajustes = (p) => {
    if (p.sec) return { redirect: () => U.go("ajuste", { sec: p.sec }, true) };
    return {
      html: appbar({ back: true, title: "Configuración" }) + `<main class="body"><div class="list">${SECS.filter((s) => !s[4] || G.can(s[4])).map(([k, i, t, d]) => `<button class="item" ${goAttr("ajuste", { sec: k })}><span class="lead-ico t-blue">${ic(i)}</span><div class="grow"><div class="name">${t}</div><div class="sub">${d}</div></div>${ic("right", "chev")}</button>`).join("")}</div>
        <p class="note">Gestión de Préstamos · versión ${esc(U.appVersion())}</p></main>`,
    };
  };
  S.ajuste = (p) => {
    const sec = SECS.find((s) => s[0] === p.sec) || SECS[1];
    if (sec[4] && !G.can(sec[4])) return noPerm(sec[2]);
    const out = SEC[sec[0]](p);
    return { html: appbar({ back: true, title: sec[2] }) + `<main class="body pad-bottom">${out.html}</main>`, bind: out.bind };
  };

  const SEC = {};
  SEC.empresa = () => {
    const c = cfg();
    return {
      html: `<div class="setting-card"><div class="photo-pick"><button type="button" class="avatar-btn" id="aj-logo" style="border-radius:16px" aria-label="Cambiar logo">${U.logoHtml()}</button><div><h3>Logo</h3><p>PNG, JPG o WEBP, máximo 2 MB.</p>${c.logo ? '<button class="link-btn" id="aj-logo-del" style="color:var(--red);padding:4px 0">Quitar logo</button>' : ""}</div></div><input type="file" id="aj-file" accept="image/png,image/jpeg,image/webp" hidden></div>
        <div class="form">${C.field({ id: "co-name", label: "Nombre de la empresa", icon: "building", value: c.company, req: true, attrs: 'maxlength="40"' })}
        ${C.field({ id: "co-nit", label: "NIT o documento (opcional)", icon: "idcard", value: c.nit, attrs: 'maxlength="20"' })}
        ${C.field({ id: "co-phone", label: "Teléfono", icon: "phone", value: c.phone, type: "tel", attrs: 'maxlength="20"' })}
        ${C.field({ id: "co-addr", label: "Dirección", icon: "pin", value: c.address, attrs: 'maxlength="80"' })}
        <p class="hint">Estos datos aparecen en los comprobantes y estados de cuenta.</p></div>
        <div class="sticky-cta"><button class="btn btn-primary" id="co-save">${ic("check")}Guardar</button></div>`,
      bind(v) {
        $("#aj-logo", v).onclick = () => $("#aj-file", v).click();
        $("#aj-file", v).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) { toast("La imagen pesa más de 2 MB.", "err"); return; } try { const c2 = cfg(); c2.logo = await U.fileToDataUrl(f, 512, "image/png"); saveCfg(c2, "logo"); toast("Logo actualizado", "ok"); U.refresh(); } catch (er) { toast("No se pudo leer la imagen.", "err"); } };
        const ld = $("#aj-logo-del", v); if (ld) ld.onclick = () => { const c2 = cfg(); c2.logo = null; saveCfg(c2, "logo"); U.refresh(); };
        $("#co-save", v).onclick = () => {
          const n = $("#co-name", v).value.trim(); if (!U.fieldErrors(v, n.length < 2 ? { "co-name": "Escribe el nombre." } : {})) return;
          const c2 = cfg(); Object.assign(c2, { company: n, nit: $("#co-nit", v).value.trim(), phone: $("#co-phone", v).value.trim(), address: $("#co-addr", v).value.trim() }); saveCfg(c2, "empresa"); toast("Datos guardados", "ok");
        };
      },
    };
  };
  function saveCfg(c, what) { G.need("config.editar"); G.Config.set(c); G.audit("configurar", "empresa", null, what); G.save(); if (window.Docs) window.Docs.logoImg(); }

  SEC.apariencia = () => ({
    html: `<div class="setting-card"><h3>${ic("sun")}Tema</h3>${C.seg("th", [["light", ic("sun") + "Claro"], ["dark", ic("moon") + "Oscuro"], ["system", ic("phoneSys") + "Sistema"]], U.Theme.get())}<p class="hint">«Sistema» sigue el modo claro u oscuro del teléfono. La preferencia se guarda en este teléfono.</p></div>`,
    bind(v) { $$("[data-th]", v).forEach((b) => b.onclick = () => { U.Theme.set(b.dataset.th); U.refresh(); }); },
  });

  SEC.seguridad = () => {
    const s = G.session; const isAdmin = s && s.id === "admin"; const lock = U.lockMinutes();
    return {
      html: `<div class="setting-card"><h3>${ic("key")}Mi contraseña</h3><p class="hint">Usuario: <b>${esc(s ? s.username : "")}</b></p>
          ${isAdmin ? C.field({ id: "aj-user", label: "Usuario del administrador", icon: "user", value: cfg().username, attrs: 'maxlength="30" autocapitalize="none"' }) : ""}
          ${C.field({ id: "aj-p0", label: "Contraseña actual", icon: "lock", type: "password" })}${C.field({ id: "aj-p1", label: "Nueva contraseña", icon: "lock", type: "password", attrs: 'autocomplete="new-password"' })}${C.field({ id: "aj-p2", label: "Confirmar nueva contraseña", icon: "lock", type: "password" })}
          <button class="btn btn-soft" id="aj-save-pw">Guardar</button></div>
        <div class="setting-card"><h3>${ic("clock")}Bloqueo de sesión</h3><p class="hint">Pide la contraseña (o huella) otra vez si la app estuvo en segundo plano más de:</p>
          ${C.seg("lock", [["1", "1 min"], ["5", "5 min"], ["15", "15 min"], ["0", "Nunca"]], String(lock), "four")}</div>
        <div class="setting-card"><div class="between"><h3>${ic("shield")}Entrar con huella</h3><label class="switch"><input type="checkbox" id="aj-bio" ${window.Bio && window.Bio.enabled() && window.Bio.userId() === (s && s.id) ? "checked" : ""}><span></span></label></div><p class="hint">La huella queda ligada a tu usuario en este teléfono. La contraseña sigue funcionando.</p></div>
        ${G.can("ver.reportes") ? `<button class="btn btn-soft" ${goAttr("auditoria", { f: "sesion" })}>${ic("history")}Historial de actividad</button>` : ""}`,
      bind(v) {
        $$("[data-lock]", v).forEach((b) => b.onclick = () => { localStorage.setItem("gp.lock.min", b.dataset.lock); U.refresh(); toast("Guardado", "ok"); });
        $("#aj-save-pw", v).onclick = async () => {
          const p0 = $("#aj-p0", v).value, p1 = $("#aj-p1", v).value, p2 = $("#aj-p2", v).value; const nu = isAdmin ? $("#aj-user", v).value.trim() : null;
          const errs = {}; if (!p0) errs["aj-p0"] = "Escribe tu contraseña actual."; if (p1 && p1.length < 6) errs["aj-p1"] = "Mínimo 6 caracteres."; if (p1 !== p2) errs["aj-p2"] = "No coinciden."; if (!p1 && !(isAdmin && nu !== cfg().username)) errs["aj-p1"] = "Escribe la nueva contraseña.";
          if (isAdmin && (nu.length < 3 || /\s/.test(nu))) errs["aj-user"] = "Mínimo 3 caracteres, sin espacios.";
          if (!U.fieldErrors(v, errs)) return;
          if (await actAsync(() => G.ops.changeOwnPassword(p0, p1 || null, nu), "Cambios guardados")) ["#aj-p0", "#aj-p1", "#aj-p2"].forEach((k) => ($(k, v).value = ""));
        };
        $("#aj-bio", v).onchange = async (e) => {
          const el = e.target;
          if (!el.checked) { window.Bio.setEnabled(false); toast("Huella desactivada"); return; }
          el.checked = false;
          if (!window.Bio.plugin()) { alertBox("Huella no disponible", "Este dispositivo o versión no tiene el complemento de huella."); return; }
          if (!(await window.Bio.available())) { alertBox("Huella no disponible", "Registra una huella en los ajustes del teléfono y vuelve a intentarlo."); return; }
          const r = await window.Bio.verify("Activar huella", "Confirma con tu huella");
          if (r.ok) { window.Bio.setEnabled(true, s.id); el.checked = true; toast("Listo: ya puedes entrar con tu huella", "ok"); } else if (r.error) toast(r.error, "err");
        };
      },
    };
  };

  SEC.finanzas = () => {
    const st = G.data.settings; const m = st.mora; const L = st.legal || {};
    const listEditor = (id, title, items) => `<div class="setting-card"><h3>${ic("list")}${title}</h3><div class="chips" style="flex-wrap:wrap;margin:0;padding:0">${items.map((x, i) => `<span class="chip">${esc(x)}<button type="button" class="icon-btn" style="width:22px;height:22px" data-rm-${id}="${i}" aria-label="Quitar ${esc(x)}">${ic("x", "sm")}</button></span>`).join("")}</div>
      <div class="search"><div class="field"><input id="add-${id}" maxlength="30" placeholder="Agregar…"></div><button type="button" class="icon-btn solid" id="btn-${id}" aria-label="Agregar">${ic("plus")}</button></div></div>`;
    return {
      html: `${listEditor("pm", "Métodos de pago", st.paymentMethods)}${listEditor("ec", "Categorías de gastos", st.expenseCategories)}
        <div class="setting-card"><h3>${ic("percent")}Intereses</h3><p class="hint">Modalidad propuesta al crear préstamos. Los préstamos existentes conservan la suya.</p>${C.seg("dim", Object.entries(G.INTEREST_MODES).map(([k, x]) => [k, x.label]), st.defaultInterestMode || "flat", "two")}</div>
        <div class="setting-card"><h3>${ic("shield")}Validación legal (Colombia)</h3>
          <p class="hint">La tasa de usura la certifica cada mes la Superintendencia Financiera (consulta superfinanciera.gov.co). Escríbela aquí en % efectivo anual; cada préstamo nuevo se compara con ella.</p>
          ${C.field({ id: "lg-ea", label: "Tasa de usura vigente (% E.A.)", icon: "percent", value: L.usuryEA || "", attrs: 'inputmode="decimal" maxlength="6"', suffix: "%" })}
          ${C.field({ id: "lg-since", label: "Vigente desde", type: "date", value: L.usurySince || "" })}
          <label class="check"><input type="checkbox" id="lg-block" ${L.block ? "checked" : ""}>Bloquear préstamos que superen la tasa</label>
          <button class="btn btn-soft" id="lg-save">Guardar</button></div>
        <div class="setting-card"><div class="between"><h3>${ic("alert")}Recargo por atraso</h3><label class="switch"><input type="checkbox" id="mo-on" ${m.enabled ? "checked" : ""}><span></span></label></div>
          <p class="hint">Se suma una sola vez a cada cuota que se vence después de activarlo.</p>
          <div class="form" id="mo-box" ${m.enabled ? "" : "hidden"}>${C.seg("mt", [["percent", "Porcentaje"], ["fixed", "Valor fijo"]], m.type, "two")}
            <div class="grid2">${m.type === "fixed" ? C.field({ id: "mo-val", label: "Valor", money: true, value: m.value }) : C.field({ id: "mo-val", label: "% de la cuota", value: m.value, suffix: "%", attrs: 'inputmode="decimal"' })}${C.field({ id: "mo-grace", label: "Días de gracia", value: m.graceDays || 0, attrs: 'inputmode="numeric"' })}</div></div>
          ${C.field({ id: "mo-days", label: "Días de atraso para considerar «en mora»", value: st.moraDays == null ? 3 : st.moraDays, attrs: 'inputmode="numeric" maxlength="3"', suffix: "días" })}
          <button class="btn btn-soft" id="mo-save">Guardar reglas de mora</button></div>
        <div class="setting-card"><h3>${ic("calendar")}Días sin cobro</h3>
          <div class="chips" style="flex-wrap:wrap;margin:0;padding:0">${[[1, "Lun"], [2, "Mar"], [3, "Mié"], [4, "Jue"], [5, "Vie"], [6, "Sáb"], [0, "Dom"]].map(([d, n]) => `<button type="button" class="chip ${st.noPay.weekdays.includes(d) ? "active" : ""}" data-wd="${d}">${n}</button>`).join("")}</div>
          <p class="hint">${esc(U.noPayText())}</p>
          <div class="between"><div><b>Festivos de Colombia</b><div class="small muted">Se calculan solos cada año (Ley Emiliani).</div></div><label class="switch"><input type="checkbox" id="np-co" ${st.noPay.colombia !== false ? "checked" : ""}><span></span></label></div>
          <p class="hint">Para marcar un día puntual o cobrar un festivo, tócalo en el Calendario.</p></div>`,
      bind(v) {
        const listBind = (id, key) => {
          $$(`[data-rm-${id}]`, v).forEach((b) => b.onclick = () => { const arr = st[key].slice(); arr.splice(+b.getAttribute(`data-rm-${id}`), 1); if (!arr.length) { toast("Debe quedar al menos uno."); return; } act(() => G.ops.saveSettings({ [key]: arr })); U.refresh(); });
          $("#btn-" + id, v).onclick = () => { const t = $("#add-" + id, v).value.trim(); if (!t) return; if (st[key].some((x) => x.toLowerCase() === t.toLowerCase())) { toast("Ya existe."); return; } act(() => G.ops.saveSettings({ [key]: st[key].concat(t) })); U.refresh(); };
        };
        listBind("pm", "paymentMethods"); listBind("ec", "expenseCategories");
        $$("[data-dim]", v).forEach((b) => b.onclick = () => { act(() => G.ops.saveSettings({ defaultInterestMode: b.dataset.dim }), "Guardado"); U.refresh(); });
        $("#lg-save", v).onclick = () => {
          const ea = U.num($("#lg-ea", v).value);
          if ($("#lg-ea", v).value && !(ea > 0 && ea < 200)) { U.fieldErrors(v, { "lg-ea": "Revisa la tasa (por ejemplo 25,5)." }); return; }
          act(() => G.ops.saveSettings({ legal: { usuryEA: ea || null, usurySince: $("#lg-since", v).value || null, block: $("#lg-block", v).checked } }), "Validación legal guardada");
        };
        $("#mo-on", v).onchange = (e) => { $("#mo-box", v).hidden = !e.target.checked; };
        $$("[data-mt]", v).forEach((b) => b.onclick = () => { G.data.settings.mora = Object.assign({}, m, { type: b.dataset.mt, value: b.dataset.mt === "fixed" ? 5000 : 5 }); U.refresh(); });
        $("#mo-save", v).onclick = () => {
          const on = $("#mo-on", v).checked; const val = m.type === "fixed" ? G.parseMoney($("#mo-val", v).value) : U.num($("#mo-val", v).value);
          if (on && !(val > 0)) { U.fieldErrors(v, { "mo-val": "Escribe el valor." }); return; }
          const days = Math.max(0, parseInt($("#mo-days", v).value, 10) || 0);
          act(() => { G.ops.saveMora({ enabled: on, type: m.type, value: val, graceDays: Math.max(0, parseInt($("#mo-grace", v).value, 10) || 0), since: m.since }); G.ops.saveSettings({ moraDays: days }); }, "Reglas de mora guardadas");
        };
        $$("[data-wd]", v).forEach((b) => b.onclick = () => { const d = +b.dataset.wd; let wd = st.noPay.weekdays.slice(); wd = wd.includes(d) ? wd.filter((x) => x !== d) : wd.concat(d); if (wd.length >= 7) { toast("Debe haber al menos un día de cobro."); return; } act(() => G.ops.setNoPayWeekdays(wd)); G.applyMora(); U.refresh(); });
        $("#np-co", v).onchange = (e) => { act(() => G.ops.setColombia(e.target.checked), "Guardado"); G.applyMora(); U.refresh(); };
      },
    };
  };

  SEC.datos = () => ({
    html: `<div class="setting-card"><h3>${ic("upload")}Copia de seguridad</h3>
        <p class="hint">Tus datos viven en este teléfono. Guarda una copia en Google Drive (u otro lugar) para no perder nada si el teléfono se daña o cambias de equipo.</p>
        ${C.kv([["Última copia guardada", esc(U.backupAgeText())], ["Clientes / préstamos / pagos", `${G.data.clients.length} / ${G.data.loans.length} / ${G.data.payments.filter((p) => p.amount > 0).length}`]])}
        <label class="check"><input type="checkbox" id="bk-enc">Cifrar la copia con contraseña (recomendado)</label>
        <button class="btn btn-primary" id="bk-save">${ic("upload")}Guardar copia</button>
        <p class="hint">Se abre el menú de compartir: elige <b>Drive</b> y toca Guardar. Una copia cifrada solo se puede abrir con su contraseña; si la olvidas, no hay forma de recuperarla.</p></div>
      <div class="setting-card"><h3>${ic("download")}Restaurar</h3><p class="hint">Reemplaza TODOS los datos actuales por los de la copia. Antes se guarda automáticamente una copia de lo actual.</p>
        <button class="btn btn-soft" id="bk-restore">${ic("download")}Restaurar desde archivo</button><input type="file" id="bk-file" accept="application/json,.json" hidden>
        <button class="btn btn-soft" id="bk-auto">${ic("history")}Copias automáticas (${G.snapshots().length})</button></div>
      <div class="setting-card"><h3>${ic("report")}Exportar e importar</h3>
        <button class="btn btn-soft" ${goAttr("reportes")}>${ic("download")}Exportar datos (Excel / PDF)</button>
        ${G.can("cliente.editar") ? `<button class="btn btn-soft" ${goAttr("importar")}>${ic("import")}Importar clientes desde CSV</button>` : ""}</div>
      <div class="setting-card"><h3>${ic("shield")}Protección de datos personales</h3><p class="hint">La app solo pide el nombre como dato obligatorio. En comprobantes el documento se muestra parcialmente oculto. Los datos no salen del teléfono salvo cuando tú compartes un archivo o abres WhatsApp. Si manejas datos de terceros, cumple la Ley 1581 de 2012 (habeas data): pide autorización al cliente.</p></div>`,
    bind(v) {
      $("#bk-save", v).onclick = () => U.saveBackup($("#bk-enc", v).checked);
      $("#bk-restore", v).onclick = () => $("#bk-file", v).click();
      $("#bk-file", v).onchange = async (e) => {
        const f = e.target.files[0]; e.target.value = ""; if (!f) return;
        let text = await f.text(); let o; try { o = JSON.parse(text); } catch (er) { alertBox("Archivo no válido", "No es una copia de esta aplicación."); return; }
        if (o.encrypted) { const pw = await promptBox("Copia cifrada", "Escribe la contraseña con la que se guardó.", "Contraseña", "Abrir", { type: "password" }); if (!pw) return; try { text = await G.Crypto.decrypt(o, pw); } catch (er) { alertBox("Contraseña incorrecta", "No se pudo abrir la copia."); return; } o = JSON.parse(text); }
        if (!o || o.app !== "GestionPrestamos" || !o.data) { alertBox("Archivo no válido", "No es una copia de esta aplicación."); return; }
        if (!(await confirmBox("¿Restaurar copia?", `Copia del ${G.fmtDate(String(o.exportedAt || "").slice(0, 10) || G.today())}: ${o.data.clients.length} clientes, ${o.data.loans.length} préstamos. Se reemplazarán los datos actuales (se guarda una copia antes). El usuario y la contraseña serán los de la copia.`, "Restaurar", true))) return;
        if (act(() => G.ops.importAll(text), "Copia restaurada")) { if (window.Docs) window.Docs.logoImg(); U.root("inicio"); }
      };
      $("#bk-auto", v).onclick = () => {
        const list = G.snapshots();
        sheet("Copias automáticas", `<p class="hint" style="margin-bottom:10px">Se guardan solas cada día, antes de cada actualización y antes de migrar o restaurar datos.</p>${list.length ? `<div class="list">${list.map((x, i) => `<button class="item" data-snap="${i}"><span class="lead-ico">${ic("clock")}</span><div class="grow"><div class="name">${G.fmtDate(x.at.slice(0, 10))} · ${x.at.slice(11, 16)}</div><div class="sub">${esc(x.reason)} · ${(x.data.clients || []).length} clientes · ${(x.data.loans || []).length} préstamos</div></div></button>`).join("")}</div>` : C.empty("history", "Aún no hay copias", "")}`, (sh) => {
          $$("[data-snap]", sh).forEach((b) => b.onclick = async () => { const x = list[b.dataset.snap]; closeLayer(); if (await confirmBox("¿Restaurar esta copia?", `Se vuelve a los datos del ${G.fmtDate(x.at.slice(0, 10))}. Antes se guarda una copia de lo actual.`, "Restaurar", true)) { if (act(() => G.restoreSnapshot(+b.dataset.snap), "Copia restaurada")) U.root("inicio"); } });
        });
      };
    },
  });

  SEC.aplicacion = () => ({
    html: `${C.kv([["Versión", esc(U.appVersion())], ["Formato de datos", "Esquema " + G.SCHEMA], ["Datos guardados en", "Este teléfono (más copia espejo interna)"]])}
      <div class="setting-card"><h3>${ic("repeat")}Actualizaciones</h3><div id="up-box"></div><button class="btn btn-primary" id="up-check">${ic("search")}Buscar actualizaciones</button>
        <p class="hint">La app busca actualizaciones sola al abrirse. Al actualizar se conservan todos los datos; antes se guarda una copia automática.</p></div>
      <div class="setting-card"><h3>${ic("info")}Acerca de</h3><p class="hint">Gestión de Préstamos: clientes, préstamos, pagos, carteras, rutas, caja y finanzas. Funciona sin internet; internet solo se usa para actualizaciones, WhatsApp y mapas.</p></div>`,
    bind(v) { if (U.bindUpdateBox) U.bindUpdateBox(v); },
  });
})();
