/* Kleidung Tracker – An- & Verkauf von Kleidung tracken.
 * Reine Client-App: Daten liegen im localStorage des Browsers. */

'use strict';

const STORAGE_KEY = 'kleidung-tracker/orders/v1';

/* ---------- Formatierung ---------- */
const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const fmtMoney = (n) => eur.format(n || 0);
const fmtWeight = (g) => `${Math.round(g || 0)} g`;
const fmtDate = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('de-DE') : '—');

/* ---------- Persistenz ---------- */
function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

let orders = loadOrders();

/* ---------- Berechnungen ---------- */
// Anteilige Versandkosten eines Stücks: Stückgewicht / Gesamtgewicht * Versandkosten gesamt.
function itemShipping(order, item) {
  const total = Number(order.totalWeight) || 0;
  if (total <= 0) return 0;
  return ((Number(item.weight) || 0) / total) * (Number(order.shipping) || 0);
}
// Gewinn = Verkaufspreis − Kaufpreis − anteilige Versandkosten.
function itemProfit(order, item) {
  return (Number(item.sell) || 0) - (Number(item.buy) || 0) - itemShipping(order, item);
}
const isSold = (item) => !!item.soldDate && (Number(item.sell) || 0) > 0;

/* ---------- Ansichten wechseln ---------- */
function switchView(name) {
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('is-active', t.dataset.view === name)
  );
  document.querySelectorAll('.view').forEach((v) =>
    v.classList.toggle('is-active', v.id === `view-${name}`)
  );
  if (name === 'stats') renderStats();
}

/* ---------- Bestellübersicht rendern ---------- */
function renderOrders() {
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');
  list.innerHTML = '';

  empty.hidden = orders.length > 0;

  // Übersichts-Kacheln
  let invested = 0, revenue = 0, realized = 0, openCount = 0;
  orders.forEach((o) =>
    o.items.forEach((it) => {
      invested += (Number(it.buy) || 0) + itemShipping(o, it);
      if (isSold(it)) {
        revenue += Number(it.sell) || 0;
        realized += itemProfit(o, it);
      } else {
        openCount++;
      }
    })
  );
  document.getElementById('orders-summary').innerHTML = [
    card('Bestellungen', String(orders.length)),
    card('Umsatz (verkauft)', fmtMoney(revenue)),
    card('Realisierter Gewinn', fmtMoney(realized), realized),
    card('Noch nicht verkauft', String(openCount)),
  ].join('');

  // sortiert nach Kaufdatum absteigend
  const sorted = [...orders].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  for (const order of sorted) {
    list.appendChild(orderCard(order));
  }
}

function card(label, value, signable) {
  let cls = '';
  if (typeof signable === 'number') cls = signable >= 0 ? 'pos' : 'neg';
  return `<div class="stat-card"><div class="label">${label}</div><div class="value ${cls}">${value}</div></div>`;
}

function orderCard(order) {
  const el = document.createElement('div');
  el.className = 'order-card';

  const rows = order.items
    .map((it) => {
      const ship = itemShipping(order, it);
      const profit = itemProfit(order, it);
      const sold = isSold(it);
      const pClass = profit >= 0 ? 'profit-pos' : 'profit-neg';
      return `<tr>
        <td>${escapeHtml(it.category) || '—'}</td>
        <td>${escapeHtml(it.name) || '—'}</td>
        <td>${fmtWeight(it.weight)}</td>
        <td>${fmtMoney(it.buy)}</td>
        <td>${fmtMoney(ship)}</td>
        <td>${sold ? fmtMoney(it.sell) : '—'}</td>
        <td class="${sold ? pClass : ''}">${sold ? fmtMoney(profit) : '—'}</td>
        <td>${sold
          ? `<span class="badge sold">verkauft ${fmtDate(it.soldDate)}</span>`
          : '<span class="badge open">offen</span>'}</td>
      </tr>`;
    })
    .join('');

  el.innerHTML = `
    <div class="order-card-head">
      <div class="order-meta">
        <div class="m"><span>Kaufdatum</span><strong>${fmtDate(order.date)}</strong></div>
        <div class="m"><span>Gesamtgewicht</span><strong>${fmtWeight(order.totalWeight)}</strong></div>
        <div class="m"><span>Versandkosten</span><strong>${fmtMoney(order.shipping)}</strong></div>
        ${order.label ? `<div class="m"><span>Bezeichnung</span><strong>${escapeHtml(order.label)}</strong></div>` : ''}
        <div class="m"><span>Stücke</span><strong>${order.items.length}</strong></div>
      </div>
      <div class="order-actions">
        <button class="icon-btn" data-edit="${order.id}" title="Bearbeiten">✏️</button>
        <button class="icon-btn" data-del="${order.id}" title="Löschen">🗑</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Art</th><th>Name</th><th>Gewicht</th><th>Kaufpreis</th>
            <th>Versand (anteilig)</th><th>Verkaufspreis</th><th>Gewinn</th><th>Status</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="8">Keine Kleidungsstücke</td></tr>'}</tbody>
      </table>
    </div>`;
  return el;
}

/* ---------- Statistik rendern ---------- */
function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Montag = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function renderStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let pToday = 0, pWeek = 0, pMonth = 0, pTotal = 0;
  let soldCount = 0, openCount = 0, revenue = 0;

  const sales = []; // {date: Date, profit}
  for (const o of orders) {
    for (const it of o.items) {
      if (!isSold(it)) { openCount++; continue; }
      soldCount++;
      const profit = itemProfit(o, it);
      revenue += Number(it.sell) || 0;
      pTotal += profit;
      const d = new Date(it.soldDate + 'T00:00:00');
      sales.push({ date: d, profit });
      if (d >= today) pToday += profit;
      if (d >= weekStart) pWeek += profit;
      if (d >= monthStart) pMonth += profit;
    }
  }

  document.getElementById('stats-cards').innerHTML = [
    card('Gewinn heute', fmtMoney(pToday), pToday),
    card('Diese Woche', fmtMoney(pWeek), pWeek),
    card('Dieser Monat', fmtMoney(pMonth), pMonth),
    card('Gesamt', fmtMoney(pTotal), pTotal),
  ].join('');

  const avg = soldCount ? pTotal / soldCount : 0;
  document.getElementById('stats-extra').innerHTML = [
    card('Umsatz gesamt', fmtMoney(revenue)),
    card('Verkaufte Stücke', String(soldCount)),
    card('Offene Stücke', String(openCount)),
    card('Ø Gewinn / Stück', fmtMoney(avg), avg),
  ].join('');

  renderChart(sales, now);
}

function renderChart(sales, now) {
  // Buckets für die letzten 6 Monate (inkl. aktuellem Monat)
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      profit: 0,
    });
  }
  for (const s of sales) {
    const b = buckets.find((x) => x.year === s.date.getFullYear() && x.month === s.date.getMonth());
    if (b) b.profit += s.profit;
  }

  const max = Math.max(1, ...buckets.map((b) => Math.abs(b.profit)));
  const chart = document.getElementById('stats-chart');
  chart.innerHTML = buckets
    .map((b) => {
      const h = Math.round((Math.abs(b.profit) / max) * 100);
      return `<div class="chart-col">
        <div class="chart-val">${b.profit ? fmtMoney(b.profit) : ''}</div>
        <div class="chart-bar ${b.profit < 0 ? 'neg' : ''}" style="height:${h}%"></div>
        <div class="chart-label">${b.label}</div>
      </div>`;
    })
    .join('');
}

/* ---------- Modal / Formular ---------- */
const modal = document.getElementById('order-modal');
const form = document.getElementById('order-form');
const itemsContainer = document.getElementById('items-container');

function addItemRow(item = {}) {
  const tpl = document.getElementById('item-row-template').content.cloneNode(true);
  const row = tpl.querySelector('.item-row');
  row.querySelector('.i-category').value = item.category || '';
  row.querySelector('.i-name').value = item.name || '';
  row.querySelector('.i-weight').value = item.weight ?? '';
  row.querySelector('.i-buy').value = item.buy ?? '';
  row.querySelector('.i-sell').value = item.sell ?? '';
  row.querySelector('.i-solddate').value = item.soldDate || '';
  row.querySelector('.item-remove').addEventListener('click', () => row.remove());
  itemsContainer.appendChild(row);
}

function openModal(order = null) {
  form.reset();
  itemsContainer.innerHTML = '';
  document.getElementById('order-id').value = order ? order.id : '';
  document.getElementById('modal-title').textContent = order ? 'Bestellung bearbeiten' : 'Neue Bestellung';

  if (order) {
    document.getElementById('order-date').value = order.date || '';
    document.getElementById('order-weight').value = order.totalWeight ?? '';
    document.getElementById('order-shipping').value = order.shipping ?? '';
    document.getElementById('order-label').value = order.label || '';
    order.items.forEach(addItemRow);
  } else {
    document.getElementById('order-date').value = new Date().toISOString().slice(0, 10);
    addItemRow();
  }
  modal.hidden = false;
}
function closeModal() {
  modal.hidden = true;
}

function collectItems() {
  return [...itemsContainer.querySelectorAll('.item-row')]
    .map((row) => ({
      category: row.querySelector('.i-category').value.trim(),
      name: row.querySelector('.i-name').value.trim(),
      weight: numOrNull(row.querySelector('.i-weight').value),
      buy: numOrNull(row.querySelector('.i-buy').value),
      sell: numOrNull(row.querySelector('.i-sell').value),
      soldDate: row.querySelector('.i-solddate').value || '',
    }))
    // Leere Zeilen (nichts eingetragen) verwerfen
    .filter((it) => it.category || it.name || it.weight || it.buy || it.sell);
}
const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('order-id').value;
  const data = {
    id: id || uid(),
    date: document.getElementById('order-date').value,
    totalWeight: Number(document.getElementById('order-weight').value) || 0,
    shipping: Number(document.getElementById('order-shipping').value) || 0,
    label: document.getElementById('order-label').value.trim(),
    items: collectItems(),
  };
  if (data.items.length === 0) {
    alert('Bitte mindestens ein Kleidungsstück eintragen.');
    return;
  }

  if (id) {
    const i = orders.findIndex((o) => o.id === id);
    if (i !== -1) orders[i] = data;
  } else {
    orders.push(data);
  }
  saveOrders();
  renderOrders();
  closeModal();
});

/* ---------- Event-Verdrahtung ---------- */
document.querySelectorAll('.tab').forEach((t) =>
  t.addEventListener('click', () => switchView(t.dataset.view))
);
document.getElementById('btn-new-order').addEventListener('click', () => openModal());
document.getElementById('btn-add-item').addEventListener('click', () => addItemRow());
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.getElementById('orders-list').addEventListener('click', (e) => {
  const editId = e.target.closest('[data-edit]')?.dataset.edit;
  const delId = e.target.closest('[data-del]')?.dataset.del;
  if (editId) {
    const order = orders.find((o) => o.id === editId);
    if (order) openModal(order);
  } else if (delId) {
    if (confirm('Diese Bestellung wirklich löschen?')) {
      orders = orders.filter((o) => o.id !== delId);
      saveOrders();
      renderOrders();
    }
  }
});

/* ---------- Sicherheit: HTML escapen ---------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* ---------- Start ---------- */
renderOrders();
