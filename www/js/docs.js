/* Documentos: comprobante de pago y estado de cuenta (imagen y PDF),
   y envío por WhatsApp. WhatsApp se abre SOLO cuando el usuario toca un botón. */
(function () {
  "use strict";
  const G = window.GP, U = window.UI;
  const { $, esc, money, ic, plural, maskDoc, waNumber, openExternal, sheet, closeLayer, toast } = U;
  const cfg = () => G.Config.get() || { company: "" };

  // ================= Lienzo =================
  const W = 1000;
  const COL = { bg: "#F7F8FA", card: "#FFFFFF", ink: "#172033", ink2: "#718096", line: "#E7EAF0", primary: "#2563EB", dark: "#163B70", green: "#16A34A", greenSoft: "#E8F6EE", orange: "#B86A12", orangeSoft: "#FDF2E4", red: "#DC4545", redSoft: "#FCECEC" };
  function docCanvas(h) {
    const c = document.createElement("canvas"); c.width = W; c.height = h || 4200;
    const x = c.getContext("2d");
    const font = (w, s) => `${w} ${s}px system-ui, -apple-system, Roboto, "Segoe UI", Arial, sans-serif`;
    const rr = (X, Y, w, hh, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + hh, r); x.arcTo(X + w, Y + hh, X, Y + hh, r); x.arcTo(X, Y + hh, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    const text = (t, X, Y, f, color, align, max) => { x.font = f; x.fillStyle = color; x.textAlign = align || "left"; x.fillText(max ? fit(x, String(t), max) : String(t), X, Y); x.textAlign = "left"; };
    x.fillStyle = COL.bg; x.fillRect(0, 0, W, c.height);
    return { c, x, font, rr, text };
  }
  function fit(ctx, t, max) { if (ctx.measureText(t).width <= max) return t; while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1); return t + "…"; }
  function logoImg() {
    let img = $("#rc-logo-cache");
    if (!img) { img = new Image(); img.id = "rc-logo-cache"; img.hidden = true; document.body.appendChild(img); }
    const l = cfg().logo; if (l && img.getAttribute("src") !== l) img.src = l; if (!l) img.removeAttribute("src");
    return img;
  }
  function header(d, title, number, dateText) {
    const { x, rr, text, font } = d; const C = cfg();
    x.fillStyle = COL.card; x.fillRect(0, 0, W, 300);
    x.fillStyle = COL.primary; x.fillRect(0, 0, W, 10);
    const img = logoImg();
    x.save(); rr(56, 56, 112, 112, 24); x.fillStyle = "#fff"; x.fill(); x.strokeStyle = COL.line; x.lineWidth = 2; x.stroke(); x.clip();
    if (img && img.complete && img.naturalWidth) { const s = Math.min(100 / img.naturalWidth, 100 / img.naturalHeight); const w = img.naturalWidth * s, h = img.naturalHeight * s; x.drawImage(img, 56 + (112 - w) / 2, 56 + (112 - h) / 2, w, h); }
    else { x.fillStyle = COL.primary; [[84, 120, 14, 30], [105, 104, 14, 46], [126, 88, 14, 62]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h)); }
    x.restore();
    text(C.company || "", 196, 104, font(750, 40), COL.ink, "left", 560);
    const sub = [C.nit ? "NIT " + C.nit : "", C.phone || "", C.address || ""].filter(Boolean).join("  ·  ");
    text(sub || "Gestión de Préstamos", 196, 148, font(400, 25), COL.ink2, "left", 740);
    text(title, 56, 236, font(750, 28), COL.primary);
    if (number) text("N.º " + number, W - 56, 236, font(650, 28), COL.ink, "right");
    text(dateText, 56, 272, font(400, 24), COL.ink2);
    x.fillStyle = COL.line; x.fillRect(0, 298, W, 2);
    return 300;
  }
  function card(d, y, h) { const { x, rr } = d; rr(40, y, W - 80, h, 22); x.fillStyle = COL.card; x.fill(); x.strokeStyle = COL.line; x.lineWidth = 2; x.stroke(); }
  function bar(d, X, Y, w, ratio, color) { const { x, rr } = d; rr(X, Y, w, 16, 8); x.fillStyle = "#E7EAF0"; x.fill(); if (ratio > 0) { rr(X, Y, Math.max(16, w * Math.min(1, ratio)), 16, 8); x.fillStyle = color || COL.green; x.fill(); } }
  function rows(d, y, list, X, w) {
    const { x, text, font } = d;
    list.forEach(([k, v, color], i) => {
      if (i) { x.fillStyle = COL.line; x.fillRect(X, y - 2, w, 2); }
      text(k, X, y + 44, font(400, 28), COL.ink2);
      text(v, X + w, y + 44, font(650, 28), color || COL.ink, "right", w * 0.62);
      y += 68;
    });
    return y;
  }
  function footer(d, y, line) {
    const { x, text, font } = d;
    x.strokeStyle = "#CBD2DD"; x.setLineDash([12, 10]); x.lineWidth = 2; x.beginPath(); x.moveTo(60, y); x.lineTo(W - 60, y); x.stroke(); x.setLineDash([]);
    if (line) text(line, W / 2, y + 66, font(650, 34), COL.primary, "center");
    text("Generado el " + G.fmtDate(G.today()) + " · " + (cfg().company || ""), W / 2, y + (line ? 116 : 56), font(400, 22), COL.ink2, "center", W - 120);
    return y + (line ? 160 : 100);
  }
  function crop(d, h) { const o = document.createElement("canvas"); o.width = W; o.height = Math.ceil(h); o.getContext("2d").drawImage(d.c, 0, 0); return o; }

  // ================= Comprobante =================
  function receiptInfo(payId) {
    const pay = G.data.payments.find((x) => x.id === payId);
    const st = G.computeLoan(U.loanOf(pay.loanId));
    const part = st.payParts.find((x) => x.id === payId) || { cuotas: [], balanceAfter: st.balance };
    const cl = U.client(st.loan.clientId);
    const cu = part.cuotas.length ? (part.cuotas.length === 1 ? part.cuotas[0] : part.cuotas[0] + " a " + part.cuotas[part.cuotas.length - 1]) + " de " + st.loan.count : "-";
    const idx = st.payParts.findIndex((x) => x.id === payId) + 1;
    return { pay, st, cl, cu, balance: part.balanceAfter, number: pay.receiptNo || st.loan.num + "-" + String(Math.max(1, idx)).padStart(2, "0") };
  }
  function receiptCanvas(payId) {
    const { pay, st, cl, cu, balance, number } = receiptInfo(payId);
    const d = docCanvas(2600); const { x, text, font, rr } = d;
    let y = header(d, pay.voided ? "COMPROBANTE ANULADO" : "COMPROBANTE DE PAGO", number, G.fmtDateLong(pay.date));
    y += 32; card(d, y, 220);
    text("Valor recibido", W / 2, y + 70, font(500, 28), COL.ink2, "center");
    text(money(pay.amount), W / 2, y + 160, font(750, 84), pay.voided ? COL.red : COL.ink, "center", W - 140);
    y += 220 + 24;
    const list = [["Cliente", cl ? cl.name : ""]];
    if (cl && cl.doc) list.push(["Documento", (cl.docType || "CC") + " " + maskDoc(cl.doc)]);
    list.push(["Préstamo", "#" + st.loan.num], ["Cuota", cu], ["Método de pago", pay.method || "-"]);
    card(d, y, list.length * 68 + 32); y = rows(d, y + 16, list, 84, W - 168) + 16 + 24;
    const totalDue = st.totalDue; const paidAfter = Math.max(0, totalDue - balance);
    card(d, y, 210);
    text("Estado del préstamo", 84, y + 58, font(650, 30), COL.ink);
    text(Math.round(paidAfter / totalDue * 100) + "% pagado", W - 84, y + 58, font(600, 26), COL.green, "right");
    bar(d, 84, y + 86, W - 168, paidAfter / totalDue);
    text("Pagado: " + money(paidAfter), 84, y + 154, font(400, 26), COL.ink2);
    text("Total: " + money(totalDue), W - 84, y + 154, font(400, 26), COL.ink2, "right");
    y += 210 + 20;
    rr(40, y, W - 80, 92, 20); x.fillStyle = balance ? COL.orangeSoft : COL.greenSoft; x.fill();
    text(balance ? "Saldo pendiente" : "Préstamo pagado completo", 84, y + 58, font(650, 30), balance ? COL.orange : COL.green);
    if (balance) text(money(balance), W - 84, y + 59, font(750, 36), COL.orange, "right");
    y += 92;
    if (pay.note) { y += 24; text("Nota: " + pay.note, 64, y + 30, font(400, 24), COL.ink2, "left", W - 128); y += 40; }
    if (pay.voided) { y += 24; text("Anulado: " + (pay.voidReason || ""), 64, y + 30, font(600, 24), COL.red, "left", W - 128); y += 40; }
    y = footer(d, y + 44, pay.voided ? null : "¡Gracias por tu pago!");
    return crop(d, y);
  }

  // ================= Estado de cuenta =================
  function statementCanvas(clientId) {
    const xS = G.state().byClient.get(clientId); const cl = xS.client;
    const d = docCanvas(1500 + xS.loans.length * 510 + 1800); const { x, text, font, rr } = d;
    let y = header(d, "ESTADO DE CUENTA", null, "Corte: " + G.fmtDateLong(G.today()));
    y += 32; const lines = [cl.doc ? (cl.docType || "CC") + " " + maskDoc(cl.doc) : "", cl.phone || "", [cl.address, cl.barrio, cl.city].filter(Boolean).join(", ")].filter(Boolean);
    card(d, y, 84 + lines.length * 38);
    text(cl.name, 84, y + 60, font(750, 38), COL.ink, "left", W - 168);
    lines.forEach((l, i) => text(l, 84, y + 104 + i * 38, font(400, 25), COL.ink2, "left", W - 168));
    y += 84 + lines.length * 38 + 24;
    const overdue = xS.loans.reduce((s, l) => s + l.overdueAmount, 0);
    const tiles = [["Total prestado", money(xS.lent), COL.ink, "#EEF2F8"], ["Total pagado", money(xS.paid), COL.green, COL.greenSoft],
      ["Saldo pendiente", money(xS.debt), xS.debt ? COL.orange : COL.green, xS.debt ? COL.orangeSoft : COL.greenSoft], ["Vencido", money(overdue), overdue ? COL.red : COL.ink2, overdue ? COL.redSoft : "#EEF0F4"]];
    const tw = (W - 80 - 20) / 2;
    tiles.forEach(([k, v, col, bg], i) => {
      const X = 40 + (i % 2) * (tw + 20), Y = y + Math.floor(i / 2) * 140;
      rr(X, Y, tw, 120, 20); x.fillStyle = bg; x.fill();
      text(k, X + 28, Y + 46, font(500, 25), COL.ink2); text(v, X + 28, Y + 96, font(750, 38), col, "left", tw - 56);
    });
    y += 2 * 140 + 8;
    for (const st of xS.loans.slice().reverse()) {
      const late = st.status === "vencido", done = st.status === "finalizado";
      const top = y, h = late ? 480 : 440; card(d, y, h);
      text("Préstamo #" + st.loan.num, 84, y + 58, font(750, 32), COL.ink);
      rr(W - 84 - 170, y + 26, 170, 44, 22); x.fillStyle = done ? "#EEF0F4" : late ? COL.redSoft : COL.greenSoft; x.fill();
      text(done ? "Pagado" : late ? "Vencido" : "Al día", W - 84 - 85, y + 57, font(650, 24), done ? COL.ink2 : late ? COL.red : COL.green, "center");
      text(G.fmtDate(st.loan.startDate) + " → " + G.fmtDate(st.plan.end) + "  ·  " + G.FREQ[st.loan.freq].label + "  ·  " + st.loan.count + " cuotas de " + money(st.plan.cuotaValue), 84, y + 104, font(400, 24), COL.ink2, "left", W - 168);
      const yy = rows(d, y + 116, [["Capital inicial", money(st.loan.amount)], ["Intereses pactados" + (st.chargesTotal ? " + recargos" : ""), money(st.plan.interest + st.chargesTotal)], ["Pagado", money(st.paid), COL.green], ["Saldo", money(st.balance), late ? COL.red : COL.ink]], 84, W - 168);
      bar(d, 84, yy + 12, W - 168, st.paid / st.totalDue);
      if (late) text(plural(st.overdueCount, "cuota vencida", "cuotas vencidas") + " · " + money(st.overdueAmount), 84, yy + 70, font(600, 23), COL.red);
      y = top + h + 24;
    }
    const next = [];
    for (const st of xS.loans) if (st.status !== "finalizado") for (const c of st.cuotas) if (c.status !== "pagada") next.push({ st, c });
    next.sort((a, b) => a.c.date.localeCompare(b.c.date));
    const show = next.slice(0, 10);
    if (show.length) {
      text("Próximos vencimientos", 48, y + 40, font(750, 30), COL.ink); y += 62;
      card(d, y, show.length * 68 + 20); let yy = y + 10;
      show.forEach(({ st, c }, i) => {
        if (i) { x.fillStyle = COL.line; x.fillRect(84, yy, W - 168, 2); }
        const late = c.overdue;
        text(G.fmtDate(c.date), 84, yy + 46, font(600, 26), late ? COL.red : COL.ink);
        text("#" + st.loan.num + " · Cuota " + c.n + (late ? " · vencida" : c.status === "parcial" ? " · parcial" : ""), 320, yy + 46, font(400, 24), late ? COL.red : COL.ink2, "left", 380);
        text(money(c.remaining), W - 84, yy + 46, font(650, 27), late ? COL.red : COL.ink, "right");
        yy += 68;
      });
      y += show.length * 68 + 20;
      if (next.length > show.length) { text("y " + plural(next.length - show.length, "cuota más", "cuotas más"), W / 2, y + 38, font(400, 23), COL.ink2, "center"); y += 48; }
    }
    const ids = new Set(xS.loans.map((l) => l.loan.id));
    const pays = G.data.payments.filter((p) => ids.has(p.loanId) && G.activePay(p)).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 12);
    if (pays.length) {
      y += 16; text("Pagos y abonos recientes", 48, y + 40, font(750, 30), COL.ink); y += 62;
      card(d, y, pays.length * 64 + 20); let yy = y + 10;
      pays.forEach((p, i) => {
        if (i) { x.fillStyle = COL.line; x.fillRect(84, yy, W - 168, 2); }
        const l = U.loanOf(p.loanId);
        text(G.fmtDate(p.date), 84, yy + 44, font(500, 25), COL.ink);
        text("#" + (l ? l.num : "") + " · " + (p.method || ""), 320, yy + 44, font(400, 23), COL.ink2, "left", 380);
        text(money(p.amount), W - 84, yy + 44, font(650, 26), COL.green, "right");
        yy += 64;
      });
      y += pays.length * 64 + 20;
    }
    y = footer(d, y + 44, xS.debt ? null : "¡Estás al día!");
    return crop(d, y);
  }

  // ================= PDF (sin librerías: imágenes JPEG en páginas A4) =================
  function canvasToPDF(canvas) {
    const pw = 595.28, ph = 841.89, margin = 0;
    const scale = (pw - margin * 2) / canvas.width;
    const slice = Math.floor((ph - margin * 2) / scale);
    const pages = [];
    for (let y0 = 0; y0 < canvas.height; y0 += slice) {
      const h = Math.min(slice, canvas.height - y0);
      const c = document.createElement("canvas"); c.width = canvas.width; c.height = h;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, h); x.drawImage(canvas, 0, -y0);
      const b64 = c.toDataURL("image/jpeg", 0.88).split(",")[1];
      const bin = atob(b64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      pages.push({ bytes, w: c.width, h, dh: h * scale });
    }
    const enc = (s) => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };
    const parts = []; const offsets = []; let len = 0;
    const push = (u) => { parts.push(u); len += u.length; };
    const obj = (n, body) => { offsets[n] = len; push(enc(n + " 0 obj\n")); body.forEach(push); push(enc("\nendobj\n")); };
    push(enc("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
    const n = pages.length; const kids = pages.map((_, i) => (3 + i * 3) + " 0 R").join(" ");
    obj(1, [enc("<< /Type /Catalog /Pages 2 0 R >>")]);
    obj(2, [enc(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`)]);
    pages.forEach((p, i) => {
      const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2;
      obj(pid, [enc(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im${i} ${iid} 0 R >> >> /Contents ${cid} 0 R >>`)]);
      const cs = `q ${pw.toFixed(2)} 0 0 ${p.dh.toFixed(2)} 0 ${(ph - p.dh).toFixed(2)} cm /Im${i} Do Q`;
      obj(cid, [enc(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`)]);
      obj(iid, [enc(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`), p.bytes, enc("\nendstream")]);
    });
    const total = 3 + n * 3; const xref = len;
    let xr = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) xr += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    push(enc(xr + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
    const out = new Uint8Array(len); let o = 0; parts.forEach((u) => { out.set(u, o); o += u.length; });
    return out;
  }
  function sharePDF(canvas, name, title) { return U.shareFile(name.replace(/\.png$/i, "") + ".pdf", canvasToPDF(canvas), "application/pdf", title); }

  // ================= Compartir imagen / WhatsApp =================
  function waPlugin() { const C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.WhatsAppShare; }
  async function shareImageGeneric(o) {
    const Cap = window.Capacitor; const Pl = Cap && Cap.Plugins;
    const dataUrl = o.canvas().toDataURL("image/png");
    try {
      if (Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Pl.Filesystem && Pl.Share) {
        const r = await Pl.Filesystem.writeFile({ path: o.file, data: dataUrl.split(",")[1], directory: "CACHE" });
        await Pl.Share.share({ title: o.title, text: o.msg, files: [r.uri], dialogTitle: o.title }); return;
      }
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], o.file, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: o.msg }); return; }
      const a = document.createElement("a"); a.href = dataUrl; a.download = o.file; a.click(); toast("Imagen descargada", "ok");
    } catch (e) { if (!/cancel|abort/i.test(String(e && (e.message || e)))) toast("No se pudo compartir la imagen.", "err"); }
  }
  async function shareImageDirect(o, app) {
    const Wp = waPlugin(); const cl = o.client;
    try { await Wp.shareImage({ phone: waNumber(cl.phone), base64: o.canvas().toDataURL("image/png"), text: o.msg, fileName: o.file, app: app || "" }); if (o.onSent) o.onSent(); }
    catch (e) {
      const code = String((e && (e.code || e.message)) || e);
      if (/not_installed/.test(code)) { toast("WhatsApp no está instalado. Elige otra app."); shareImageGeneric(o); }
      else toast("No se pudo abrir WhatsApp. Intenta con «Otra app».", "err");
    }
  }
  /* Hoja de opciones: el usuario elige cómo enviar. Nunca se abre WhatsApp sin un toque. */
  async function shareSheet(o) {
    const cl = o.client; const first = cl ? cl.name.split(" ")[0] : "";
    const Wp = waPlugin();
    let apps = { whatsapp: false, business: false };
    if (Wp && cl && cl.phone) { try { apps = await Wp.available(); } catch (e) { /* sin datos */ } }
    const direct = !!(Wp && cl && cl.phone && (apps.whatsapp || apps.business));
    const both = direct && apps.whatsapp && apps.business;
    sheet(o.title, `
      ${direct ? U.C.opt("whatsapp", "green", "Enviar al WhatsApp de " + esc(first), "Se abre su chat (" + esc(cl.phone) + ") con la imagen lista", 'id="sr-direct"')
        + (both ? U.C.opt("whatsapp", "green", "Enviar con WhatsApp Business", "Mismo chat, desde WhatsApp Business", 'id="sr-direct-b"') : "") : ""}
      ${U.C.opt("share", "blue", direct ? "Otra app o contacto" : "Compartir imagen", "Elige la app y el contacto", 'id="sr-img"')}
      ${U.C.opt("file", "violet", "Exportar PDF", "Guardar o enviar como documento PDF", 'id="sr-pdf"')}
      ${cl && cl.phone ? U.C.opt("note", "grey", "Solo mensaje de texto", "Abre el chat de " + esc(first) + " con el resumen", 'id="sr-chat"') : ""}`, (s) => {
      const dd = $("#sr-direct", s); if (dd) dd.onclick = () => { closeLayer(); shareImageDirect(o, apps.whatsapp ? "com.whatsapp" : "com.whatsapp.w4b"); };
      const db = $("#sr-direct-b", s); if (db) db.onclick = () => { closeLayer(); shareImageDirect(o, "com.whatsapp.w4b"); };
      $("#sr-img", s).onclick = () => { closeLayer(); shareImageGeneric(o); };
      $("#sr-pdf", s).onclick = () => { closeLayer(); sharePDF(o.canvas(), o.file, o.title); };
      const ch = $("#sr-chat", s); if (ch) ch.onclick = () => { closeLayer(); if (o.onSent) o.onSent(); openExternal("https://wa.me/" + waNumber(cl.phone) + "?text=" + encodeURIComponent(o.msg)); };
    });
  }
  function sendReceipt(payId) {
    const { pay, st, cl, cu, balance } = receiptInfo(payId);
    const first = cl ? cl.name.split(" ")[0] : "";
    shareSheet({
      title: "Enviar comprobante", client: cl, canvas: () => receiptCanvas(payId),
      file: `Comprobante_${pay.receiptNo || st.loan.num}_${pay.date}.png`,
      msg: `Hola${first ? ", " + first : ""} 👋\nTe envío el comprobante ${pay.receiptNo ? pay.receiptNo + " " : ""}de tu pago de ${money(pay.amount)} (cuota ${cu}) del préstamo #${st.loan.num}, del ${G.fmtDate(pay.date)}.\nSaldo pendiente: ${money(balance)}.\n¡Gracias!\n— ${cfg().company}`,
    });
  }
  function sendStatement(clientId, onSent) {
    const xS = G.state().byClient.get(clientId); const cl = xS.client;
    const first = cl.name.split(" ")[0];
    const overdue = xS.loans.reduce((s, l) => s + l.overdueAmount, 0);
    shareSheet({
      title: "Enviar estado de cuenta", client: cl, canvas: () => statementCanvas(clientId), onSent,
      file: `Estado_de_cuenta_${cl.name.replace(/\s+/g, "_")}_${G.today()}.png`,
      msg: `Hola, ${first} 👋\nEste es tu estado de cuenta al ${G.fmtDate(G.today())}:\n• Total pagado: ${money(xS.paid)}\n• Saldo pendiente: ${money(xS.debt)}` +
        (overdue ? `\n• Vencido: ${money(overdue)}` : "") + (xS.next ? `\n• Próximo pago: ${money(xS.next.remaining)} el ${G.fmtDate(xS.next.date)}` : "") + `\n— ${cfg().company}`,
    });
  }

  window.Docs = { receiptInfo, receiptCanvas, statementCanvas, canvasToPDF, sharePDF, shareSheet, sendReceipt, sendStatement, logoImg };
})();
