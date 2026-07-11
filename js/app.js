/* Arbeitskalender – Kunden, Termine und Umsatz, gespeichert im Browser (localStorage). */
(() => {
  "use strict";

  // ===== Speicher =====
  const KEYS = { customers: "ak_customers", appts: "ak_appointments" };

  const load = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  };
  const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  let customers = load(KEYS.customers);
  let appts = load(KEYS.appts);

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ===== Helfer =====
  const $ = (sel) => document.querySelector(sel);

  const fmtEUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  const fmtDateLong = new Intl.DateTimeFormat("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const fmtMonth = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });

  const toISODate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const parseISODate = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const todayISO = () => toISODate(new Date());

  const customerById = (id) => customers.find((c) => c.id === id);

  const customerName = (appt) => {
    const c = customerById(appt.customerId);
    return c ? c.name : (appt.customerNameSnapshot || "Unbekannter Kunde");
  };

  const fmtHours = (h) =>
    `${h.toLocaleString("de-DE", { maximumFractionDigits: 2 })} Std.`;

  const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // ===== Ansichten wechseln =====
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === tab));
      document.querySelectorAll(".view").forEach((v) =>
        v.classList.toggle("is-active", v.id === `view-${tab.dataset.view}`));
    });
  });

  // ===== Kalender =====
  const MINIJOB_LIMIT = 603; // Geringfügigkeitsgrenze pro Monat (Stand 2026)
  let calCursor = new Date();      // angezeigter Monat
  let selectedDay = null;          // ISO-Datum des ausgewählten Tages

  const apptsOfDay = (iso) =>
    appts.filter((a) => a.date === iso).sort((a, b) => a.time.localeCompare(b.time));

  const revenueOfDay = (iso) =>
    apptsOfDay(iso).reduce((sum, a) => sum + (a.payment || 0), 0);

  function renderCalendar() {
    const year = calCursor.getFullYear();
    const month = calCursor.getMonth();
    $("#cal-title").textContent = fmtMonth.format(calCursor);

    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Montag = 0
    const gridStart = new Date(year, month, 1 - startOffset);

    const grid = $("#cal-grid");
    grid.innerHTML = "";

    let monthRevenue = 0;
    let monthHours = 0;
    let monthAppts = 0;
    let monthMinijob = 0;

    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const iso = toISODate(d);
      const inMonth = d.getMonth() === month;
      const dayAppts = apptsOfDay(iso);
      const revenue = dayAppts.reduce((s, a) => s + (a.payment || 0), 0);

      if (inMonth) {
        monthRevenue += revenue;
        monthHours += dayAppts.reduce((s, a) => s + (a.hours || 0), 0);
        monthAppts += dayAppts.length;
        monthMinijob += dayAppts
          .filter((a) => a.kind === "minijob")
          .reduce((s, a) => s + (a.payment || 0), 0);
      }

      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal-day";
      if (!inMonth) cell.classList.add("is-other");
      if (iso === todayISO()) cell.classList.add("is-today");
      if (iso === selectedDay) cell.classList.add("is-selected");

      let html = `<span class="day-num">${d.getDate()}</span>`;
      if (inMonth && revenue > 0) html += `<span class="day-revenue">${fmtEUR.format(revenue)}</span>`;
      if (inMonth && dayAppts.length > 0)
        html += `<span class="day-appts">${dayAppts.length} Termin${dayAppts.length > 1 ? "e" : ""}</span>`;
      cell.innerHTML = html;

      if (inMonth) {
        cell.addEventListener("click", () => {
          selectedDay = iso;
          renderCalendar();
          renderDayPanel();
        });
      } else {
        cell.disabled = true;
      }
      grid.appendChild(cell);
    }

    const overLimit = monthMinijob > MINIJOB_LIMIT;
    const minijobCard = monthMinijob > 0 ? `
      <div class="summary-card"><div class="label">davon Minijob</div>
        <div class="value ${overLimit ? "amber" : ""}">${fmtEUR.format(monthMinijob)}</div>
        <div class="label">${overLimit ? "über der Grenze von" : "Grenze"}: ${fmtEUR.format(MINIJOB_LIMIT)}</div></div>` : "";

    $("#cal-summary").innerHTML = `
      <div class="summary-card"><div class="label">Umsatz im Monat</div>
        <div class="value green">${fmtEUR.format(monthRevenue)}</div></div>${minijobCard}
      <div class="summary-card"><div class="label">Arbeitszeit im Monat</div>
        <div class="value">${fmtHours(monthHours)}</div></div>
      <div class="summary-card"><div class="label">Termine im Monat</div>
        <div class="value">${monthAppts}</div></div>`;
  }

  function renderDayPanel() {
    const panel = $("#day-panel");
    if (!selectedDay) { panel.hidden = true; return; }

    panel.hidden = false;
    const dayAppts = apptsOfDay(selectedDay);
    const revenue = revenueOfDay(selectedDay);
    $("#day-panel-title").textContent =
      `${fmtDateLong.format(parseISODate(selectedDay))}` +
      (revenue > 0 ? ` – ${fmtEUR.format(revenue)}` : "");

    const list = $("#day-panel-list");
    list.innerHTML = dayAppts.length
      ? dayAppts.map(apptCardHTML).join("")
      : `<p class="empty-state is-visible">Keine Termine an diesem Tag.</p>`;
    bindApptCardActions(list);
  }

  $("#cal-prev").addEventListener("click", () => {
    calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1);
    renderCalendar();
  });
  $("#cal-next").addEventListener("click", () => {
    calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1);
    renderCalendar();
  });
  $("#cal-today").addEventListener("click", () => {
    calCursor = new Date();
    selectedDay = todayISO();
    renderCalendar();
    renderDayPanel();
  });
  $("#btn-day-new").addEventListener("click", () => openApptDialog(null, selectedDay));

  // ===== Termin-Karten =====
  function apptCardHTML(a) {
    const isMinijob = a.kind === "minijob";
    const c = isMinijob ? null : customerById(a.customerId);
    const paid = a.payment != null;
    const worked = a.hours != null;

    let badges = "";
    if (isMinijob) badges += `<span class="badge badge-blue">Minijob</span>`;
    if (paid) badges += `<span class="badge badge-green">${fmtEUR.format(a.payment)}</span>`;
    if (worked) badges += `<span class="badge badge-gray">${fmtHours(a.hours)}</span>`;
    if (!paid && !worked) badges += `<span class="badge badge-amber">offen</span>`;

    const metaParts = [];
    if (c && c.phone) metaParts.push(`📞 ${escapeHTML(c.phone)}`);
    if (c && c.address) metaParts.push(`📍 ${escapeHTML(c.address)}`);

    const heading = isMinijob
      ? `${a.time} Uhr – ${escapeHTML(a.title || "Minijob")}`
      : `${a.time} Uhr – ${escapeHTML(customerName(a))}`;

    return `
      <div class="card" data-id="${a.id}">
        <div class="info">
          <div class="title">${heading}</div>
          ${!isMinijob && a.title ? `<div class="meta">${escapeHTML(a.title)}</div>` : ""}
          ${metaParts.length ? `<div class="meta">${metaParts.join(" · ")}</div>` : ""}
          <div style="margin-top:.3rem">${badges}</div>
        </div>
        <div class="actions">
          <button class="btn btn-sm" data-edit>Bearbeiten</button>
          <button class="btn btn-sm btn-danger" data-delete>Löschen</button>
        </div>
      </div>`;
  }

  function bindApptCardActions(root) {
    root.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".card").dataset.id;
        openApptDialog(appts.find((a) => a.id === id));
      });
    });
    root.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".card").dataset.id;
        if (!confirm("Diesen Termin wirklich löschen?")) return;
        appts = appts.filter((a) => a.id !== id);
        save(KEYS.appts, appts);
        renderAll();
      });
    });
  }

  // ===== Terminliste =====
  function renderAppts() {
    const showPast = $("#appt-show-past").checked;
    const today = todayISO();

    const visible = appts
      .filter((a) => showPast || a.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const list = $("#appt-list");
    list.innerHTML = "";

    let lastDate = null;
    for (const a of visible) {
      if (a.date !== lastDate) {
        lastDate = a.date;
        const revenue = revenueOfDay(a.date);
        const h = document.createElement("div");
        h.className = "date-heading";
        h.textContent = fmtDateLong.format(parseISODate(a.date)) +
          (revenue > 0 ? ` · ${fmtEUR.format(revenue)}` : "");
        list.appendChild(h);
      }
      list.insertAdjacentHTML("beforeend", apptCardHTML(a));
    }
    bindApptCardActions(list);
    $("#appt-empty").classList.toggle("is-visible", visible.length === 0);
  }

  $("#appt-show-past").addEventListener("change", renderAppts);

  // ===== Termin-Dialog =====
  const dlgAppt = $("#dlg-appt");
  const formAppt = $("#form-appt");
  let editingApptId = null;

  function fillCustomerSelect(selectedId) {
    const sel = $("#appt-customer-select");
    const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name, "de"));
    sel.innerHTML =
      `<option value="" disabled ${selectedId ? "" : "selected"}>Kunde wählen…</option>` +
      sorted.map((c) =>
        `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${escapeHTML(c.name)}</option>`
      ).join("");
  }

  // Bei Minijob wird kein Kunde benötigt – Auswahl ausblenden und von der Validierung ausnehmen
  function updateKindUI() {
    const isMinijob = formAppt.kind.value === "minijob";
    $("#appt-customer-label").hidden = isMinijob;
    formAppt.customerId.required = !isMinijob;
    formAppt.customerId.disabled = isMinijob;
  }

  function openApptDialog(appt, presetDate) {
    editingApptId = appt ? appt.id : null;
    $("#dlg-appt-title").textContent = appt ? "Termin bearbeiten" : "Neuer Termin";
    formAppt.reset();
    fillCustomerSelect(appt ? appt.customerId : null);
    formAppt.kind.value = appt
      ? (appt.kind || "kunde")
      : (customers.length === 0 ? "minijob" : "kunde");
    updateKindUI();
    formAppt.date.value = appt ? appt.date : (presetDate || todayISO());
    formAppt.time.value = appt ? appt.time : "09:00";
    formAppt.title.value = appt ? (appt.title || "") : "";
    formAppt.payment.value = appt && appt.payment != null ? appt.payment : "";
    formAppt.hours.value = appt && appt.hours != null ? appt.hours : "";
    dlgAppt.showModal();
  }

  formAppt.addEventListener("submit", () => {
    const f = formAppt;
    const isMinijob = f.kind.value === "minijob";
    const customer = isMinijob ? null : customerById(f.customerId.value);
    const data = {
      kind: f.kind.value,
      date: f.date.value,
      time: f.time.value,
      customerId: isMinijob ? null : f.customerId.value,
      customerNameSnapshot: customer ? customer.name : "",
      title: f.title.value.trim(),
      payment: f.payment.value === "" ? null : Math.max(0, parseFloat(f.payment.value)),
      hours: f.hours.value === "" ? null : Math.max(0, parseFloat(f.hours.value)),
    };

    if (editingApptId) {
      const i = appts.findIndex((a) => a.id === editingApptId);
      appts[i] = { ...appts[i], ...data };
    } else {
      appts.push({ id: uid(), ...data });
    }
    save(KEYS.appts, appts);
    renderAll();
  });

  $("#btn-new-appt").addEventListener("click", () => openApptDialog(null));
  formAppt.kind.addEventListener("change", updateKindUI);

  // ===== Kunden =====
  const dlgCustomer = $("#dlg-customer");
  const formCustomer = $("#form-customer");
  let editingCustomerId = null;

  function customerCardHTML(c) {
    const count = appts.filter((a) => a.customerId === c.id).length;
    const total = appts
      .filter((a) => a.customerId === c.id)
      .reduce((s, a) => s + (a.payment || 0), 0);

    const metaParts = [];
    if (c.phone) metaParts.push(`📞 <a href="tel:${escapeHTML(c.phone.replace(/\s/g, ""))}">${escapeHTML(c.phone)}</a>`);
    if (c.address) metaParts.push(`📍 ${escapeHTML(c.address)}`);

    return `
      <div class="card" data-id="${c.id}">
        <div class="info">
          <div class="title">${escapeHTML(c.name)}</div>
          ${metaParts.length ? `<div class="meta">${metaParts.join("<br>")}</div>` : ""}
          <div style="margin-top:.3rem">
            <span class="badge badge-gray">${count} Termin${count === 1 ? "" : "e"}</span>
            ${total > 0 ? `<span class="badge badge-green">${fmtEUR.format(total)} gesamt</span>` : ""}
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-sm" data-edit>Bearbeiten</button>
          <button class="btn btn-sm btn-danger" data-delete>Löschen</button>
        </div>
      </div>`;
  }

  function renderCustomers() {
    const q = $("#customer-search").value.trim().toLowerCase();
    const visible = customers
      .filter((c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.address || "").toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));

    const list = $("#customer-list");
    list.innerHTML = visible.map(customerCardHTML).join("");

    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".card").dataset.id;
        openCustomerDialog(customerById(id));
      });
    });
    list.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".card").dataset.id;
        const c = customerById(id);
        const count = appts.filter((a) => a.customerId === id).length;
        const msg = count > 0
          ? `„${c.name}“ hat ${count} Termin(e). Kunde trotzdem löschen? Die Termine bleiben erhalten.`
          : `„${c.name}“ wirklich löschen?`;
        if (!confirm(msg)) return;
        customers = customers.filter((x) => x.id !== id);
        save(KEYS.customers, customers);
        renderAll();
      });
    });

    $("#customer-empty").classList.toggle("is-visible", customers.length === 0);
  }

  function openCustomerDialog(c) {
    editingCustomerId = c ? c.id : null;
    $("#dlg-customer-title").textContent = c ? "Kunde bearbeiten" : "Neuer Kunde";
    formCustomer.reset();
    formCustomer.name.value = c ? c.name : "";
    formCustomer.phone.value = c ? (c.phone || "") : "";
    formCustomer.address.value = c ? (c.address || "") : "";
    dlgCustomer.showModal();
  }

  formCustomer.addEventListener("submit", () => {
    const f = formCustomer;
    const data = {
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      address: f.address.value.trim(),
    };
    if (!data.name) return;

    if (editingCustomerId) {
      const i = customers.findIndex((c) => c.id === editingCustomerId);
      customers[i] = { ...customers[i], ...data };
    } else {
      customers.push({ id: uid(), ...data });
    }
    save(KEYS.customers, customers);
    renderAll();
  });

  $("#btn-new-customer").addEventListener("click", () => openCustomerDialog(null));
  $("#customer-search").addEventListener("input", renderCustomers);

  // Abbrechen-Buttons schließen den jeweiligen Dialog ohne zu speichern
  document.querySelectorAll("dialog [data-close]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest("dialog").close());
  });

  // ===== Alles rendern =====
  function renderAll() {
    renderCalendar();
    renderDayPanel();
    renderAppts();
    renderCustomers();
  }

  selectedDay = todayISO();
  renderAll();
})();
