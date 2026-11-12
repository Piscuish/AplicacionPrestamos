/* Gestión de Préstamos — configuración inicial e inicio de sesión
   Los datos se guardan solo en el teléfono (almacenamiento local de la app). */
(function () {
  "use strict";

  const STORE_KEY = "gp.config.v1";
  const MAX_LOGO_BYTES = 2 * 1024 * 1024;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ---------- Almacenamiento ----------
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; } },
    set(v) { localStorage.setItem(STORE_KEY, JSON.stringify(v)); },
  };

  // ---------- Contraseñas (se guardan cifradas con SHA-256 + sal, nunca en texto) ----------
  const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  function randomSalt() { const a = new Uint8Array(16); crypto.getRandomValues(a); return toHex(a); }
  async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(salt + ":" + password);
    return toHex(await crypto.subtle.digest("SHA-256", data));
  }

  // ---------- Navegación entre pantallas ----------
  let current = null;
  function show(name) {
    $$(".screen").forEach((s) => (s.hidden = true));
    document.body.classList.toggle("has-tabbar", false);
    $("#screen-" + name).hidden = false;
    current = name;
    window.scrollTo(0, 0);
  }

  // ---------- Utilidades de UI ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }
  function dialog(title, text) {
    $("#modal-title").textContent = title; $("#modal-text").textContent = text; $("#modal").hidden = false;
  }
  $("#modal-ok").addEventListener("click", () => ($("#modal").hidden = true));

  const EYE_OPEN = '<svg class="ico" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg class="ico" viewBox="0 0 24 24"><path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/><path d="m2 2 20 20"/></svg>';
  $$(".eye").forEach((b) => {
    const input = document.getElementById(b.dataset.eye);
    b.innerHTML = EYE_OFF;
    b.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      b.innerHTML = visible ? EYE_OFF : EYE_OPEN;
      b.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
    });
  });

  // Logo por defecto (cuando la empresa no sube uno)
  const DEFAULT_LOGO =
    '<svg viewBox="0 0 100 100"><defs><linearGradient id="dl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#123a7a"/><stop offset="1" stop-color="#071d42"/></linearGradient></defs>' +
    '<rect width="100" height="100" rx="22" fill="url(#dl)"/>' +
    '<g fill="#fff"><rect x="26" y="50" width="11" height="22" rx="2.5"/><rect x="42" y="38" width="11" height="34" rx="2.5"/><rect x="58" y="26" width="11" height="46" rx="2.5"/></g>' +
    '<path d="M18 74c18 10 50 8 64-22-10 18-36 26-60 18Z" fill="#7fb2ff"/></svg>';
  function renderLogo(el, dataUrl) {
    el.innerHTML = "";
    if (dataUrl) { const img = new Image(); img.alt = "Logo"; img.src = dataUrl; el.appendChild(img); }
    else el.innerHTML = DEFAULT_LOGO;
  }

  // ---------- 1. Bienvenida ----------
  $$("[data-go='setup']").forEach((b) => b.addEventListener("click", () => { goStep(0); show("setup"); }));
  $("#btn-have-account").addEventListener("click", () =>
    toast("Todavía no hay una cuenta en este teléfono. Toca «Configurar ahora»."));

  // ---------- 2. Asistente de configuración ----------
  const draft = { logo: null };
  let step = 0;
  const steps = $$(".step");
  const stepperItems = $$("#stepper li");

  function goStep(n) {
    step = n;
    steps.forEach((s, i) => (s.hidden = i !== n));
    stepperItems.forEach((li, i) => { li.classList.toggle("active", i === n); li.classList.toggle("done", i < n); });
    $("#setup-next").firstChild.textContent = n === 2 ? "Finalizar " : "Continuar ";
    if (n === 2) {
      renderLogo($("#sum-logo"), draft.logo);
      $("#sum-company").textContent = $("#company").value.trim();
      $("#sum-user").textContent = $("#username").value.trim();
    }
    window.scrollTo(0, 0);
  }

  function setError(key, msg) {
    const p = $(`[data-error="${key}"]`); if (p) p.textContent = msg || "";
    const input = document.getElementById(key);
    if (input) input.closest(".field").classList.toggle("invalid", !!msg);
  }
  ["company", "username", "password", "password2"].forEach((k) =>
    document.getElementById(k).addEventListener("input", () => setError(k, "")));

  function validateStep(n) {
    let ok = true;
    if (n === 0) {
      const c = $("#company").value.trim();
      if (c.length < 2) { setError("company", "Escribe el nombre de la empresa."); ok = false; }
    }
    if (n === 1) {
      const u = $("#username").value.trim();
      const p = $("#password").value;
      const p2 = $("#password2").value;
      if (u.length < 3) { setError("username", "El usuario debe tener al menos 3 caracteres."); ok = false; }
      else if (/\s/.test(u)) { setError("username", "El usuario no puede tener espacios."); ok = false; }
      if (p.length < 6) { setError("password", "La contraseña debe tener al menos 6 caracteres."); ok = false; }
      if (p2 !== p) { setError("password2", "Las contraseñas no coinciden."); ok = false; }
      else if (!p2) { setError("password2", "Confirma la contraseña."); ok = false; }
    }
    return ok;
  }

  function setupBack() {
    if (step > 0) goStep(step - 1); else show("welcome");
  }
  $("#setup-back").addEventListener("click", setupBack);

  $("#setup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    if (step < 2) { goStep(step + 1); return; }

    const btn = $("#setup-next"); btn.disabled = true;
    try {
      const salt = randomSalt();
      const config = {
        company: $("#company").value.trim(),
        logo: draft.logo,
        username: $("#username").value.trim(),
        salt,
        passwordHash: await hashPassword($("#password").value, salt),
        createdAt: new Date().toISOString(),
      };
      store.set(config);
      $("#setup-form").reset();
      openLogin(config);
      toast("¡Empresa configurada! Ya puedes iniciar sesión.");
    } catch (err) {
      dialog("No se pudo guardar", "Ocurrió un problema al guardar la configuración. Intenta de nuevo.");
    } finally { btn.disabled = false; }
  });

  // Logo: selección, validación y reducción de tamaño
  const logoInput = $("#logo-input");
  $("#logo-pick").addEventListener("click", () => logoInput.click());
  $("#logo-preview").addEventListener("click", () => logoInput.click());
  $("#logo-remove").addEventListener("click", () => setDraftLogo(null));

  function setDraftLogo(dataUrl) {
    draft.logo = dataUrl;
    const box = $("#logo-preview");
    if (dataUrl) { box.innerHTML = ""; const img = new Image(); img.src = dataUrl; img.alt = "Logo"; box.appendChild(img); }
    else box.innerHTML = '<svg class="ico ico-lg" viewBox="0 0 24 24"><rect x="3" y="4" width="16" height="14" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m19 15-4-4-8 7"/></svg>';
    $("#logo-remove").hidden = !dataUrl;
  }

  logoInput.addEventListener("change", () => {
    const file = logoInput.files && logoInput.files[0];
    logoInput.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { toast("Formato no válido. Usa PNG, JPG o WEBP."); return; }
    if (file.size > MAX_LOGO_BYTES) { toast("La imagen pesa más de 2 MB. Elige una más liviana."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 512;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        setDraftLogo(c.toDataURL("image/png"));
      };
      img.onerror = () => toast("No se pudo leer la imagen.");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // ---------- 3. Inicio de sesión ----------
  let failed = 0;
  function openLogin(config) {
    renderLogo($("#login-logo"), config.logo);
    $("#login-company").textContent = config.company;
    $("#login-user").value = "";
    $("#login-pass").value = "";
    $("#login-error").textContent = "";
    show("login");
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const config = store.get();
    const user = $("#login-user").value.trim();
    const pass = $("#login-pass").value;
    const err = $("#login-error");
    if (!user || !pass) { err.textContent = "Escribe tu usuario y contraseña."; return; }
    const hash = await hashPassword(pass, config.salt);
    if (user.toLowerCase() === config.username.toLowerCase() && hash === config.passwordHash) {
      failed = 0;
      openHome(config);
    } else {
      failed++;
      err.textContent = "Usuario o contraseña incorrectos.";
      $("#login-pass").value = "";
      if (failed >= 5) {
        const btn = e.submitter || $("#login-form .btn-primary");
        btn.disabled = true; err.textContent = "Demasiados intentos. Espera 30 segundos.";
        setTimeout(() => { btn.disabled = false; failed = 0; err.textContent = ""; }, 30000);
      }
    }
  });
  $("#login-pass").addEventListener("input", () => ($("#login-error").textContent = ""));
  $("#login-user").addEventListener("input", () => ($("#login-error").textContent = ""));

  $("#btn-forgot").addEventListener("click", () =>
    dialog("¿Olvidaste tu contraseña?",
      "Por seguridad, la contraseña está guardada cifrada en este teléfono y no se puede ver. " +
      "Más adelante agregaremos una forma segura de restablecerla."));

  // ---------- 4. Entrar a la app ----------
  function openHome(config) {
    show("app");
    window.Main.start(config, () => openLogin(store.get()));
  }

  // ---------- Botón "atrás" de Android ----------
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (App) {
    App.addListener("backButton", () => {
      if (!$("#modal").hidden) { $("#modal").hidden = true; return; }
      if (current === "setup") { setupBack(); return; }
      if (current === "app" && window.Main.back()) return;
      App.exitApp();
    });
  }

  // ---------- Inicio ----------
  const config = store.get();
  if (config && config.passwordHash) openLogin(config);
  else show("welcome");
})();
