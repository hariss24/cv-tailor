const HISTORY_KEY = 'cv-history';
const IDB_DB      = 'html-to-pdf-snapshots';
const IDB_HTML    = 'cv-html-store';
let entries = [];

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function el(tag, attrs, children) {
  attrs    = attrs    || {};
  children = children || [];
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class')        node.className   = v;
    else if (k === 'onclick') node.onclick      = v;
    else if (k === 'text')    node.textContent  = v;
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  }
  return node;
}

// ---- IndexedDB helpers (autonomes, sans dépendance à app.js) ---------------

function _openHistoryIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 2);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', { keyPath: 'ts' });
      }
      if (!db.objectStoreNames.contains(IDB_HTML)) {
        db.createObjectStore(IDB_HTML, { keyPath: 'id' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function _deleteHtmlFromIDB(id) {
  try {
    const db = await _openHistoryIDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_HTML, 'readwrite');
      tx.objectStore(IDB_HTML).delete(id);
      tx.oncomplete = res;
      tx.onerror    = e => rej(e.target.error);
    });
  } catch (_) {}
}

async function _loadHtmlFromIDB(id) {
  try {
    const db = await _openHistoryIDB();
    return await new Promise((res, rej) => {
      const tx  = db.transaction(IDB_HTML, 'readonly');
      const req = tx.objectStore(IDB_HTML).get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror   = e => rej(e.target.error);
    });
  } catch (_) { return null; }
}

async function _getAllHtmlFromIDB() {
  try {
    const db = await _openHistoryIDB();
    return await new Promise((res, rej) => {
      const tx  = db.transaction(IDB_HTML, 'readonly');
      const req = tx.objectStore(IDB_HTML).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror   = e => rej(e.target.error);
    });
  } catch (_) { return []; }
}

// ---- Rendu ----------------------------------------------------------------

function buildRow(e) {
  const id         = e.id;
  const reloadHref = '/?load=' + encodeURIComponent(id);
  const actions = [
    el('a',      { class: 'btn',          href: reloadHref, text: 'Recharger' }),
    el('button', { class: 'ghost danger', onclick: () => del(id), text: 'Supprimer' }),
  ];

  return el('tr', { 'data-id': id }, [
    el('td', { text: fmtDate(e.created_at) }),
    el('td', {}, [el('span', { class: 'badge', text: e.doc_type || '' })]),
    el('td', { text: e.company || '-' }),
    el('td', { title: e.job_desc || '', text: e.role || '-' }),
    el('td', { class: 'filename', title: e.filename, text: e.filename || '' }),
    el('td', { class: 'actions' }, actions),
  ]);
}

function render(filter) {
  filter = filter || '';
  const f        = filter.toLowerCase();
  const filtered = !f ? entries : entries.filter(e =>
    (e.company  || '').toLowerCase().includes(f) ||
    (e.role     || '').toLowerCase().includes(f) ||
    (e.doc_type || '').toLowerCase().includes(f) ||
    (e.notes    || '').toLowerCase().includes(f) ||
    (e.job_desc || '').toLowerCase().includes(f) ||
    (e.filename || '').toLowerCase().includes(f)
  );
  const root = document.getElementById('root');
  root.replaceChildren();
  if (!filtered.length) {
    root.appendChild(el('div', { class: 'empty', text: 'Aucun document.' }));
    return;
  }
  const head = el('thead', {}, [el('tr', {}, [
    el('th', { text: 'Date' }),
    el('th', { text: 'Type' }),
    el('th', { text: 'Entreprise' }),
    el('th', { text: 'Poste' }),
    el('th', { text: 'Fichier' }),
    el('th'),
  ])]);
  const body = el('tbody', {}, filtered.map(buildRow));
  root.appendChild(el('table', {}, [head, body]));
}

function showError(msg) {
  const root = document.getElementById('root');
  root.replaceChildren();
  root.appendChild(el('div', { class: 'error', text: msg }));
}

// ---- Chargement -----------------------------------------------------------

async function load() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    entries = raw ? JSON.parse(raw) : [];
    render(document.getElementById('search').value);
  } catch (_) {
    showError("Impossible de lire l'historique.");
  }
}

// ---- Suppression ----------------------------------------------------------

async function del(id) {
  if (!confirm('Supprimer cette entrée ?')) return;
  try {
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').filter(e => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  } catch (_) {}
  await _deleteHtmlFromIDB(id);
  await load();
}

// ---- Export ---------------------------------------------------------------

async function exportData() {
  const meta = [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) meta.push(...JSON.parse(raw));
  } catch (_) {}

  const htmlEntries = await _getAllHtmlFromIDB();
  const htmlMap = {};
  for (const h of htmlEntries) htmlMap[h.id] = { html: h.html, css: h.css };

  const payload = {
    exported_at: new Date().toISOString(),
    entries: meta.map(e => ({ ...e, ...(htmlMap[e.id] || {}) })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cv-archive-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---- Événements -----------------------------------------------------------

document.getElementById('search').addEventListener('input', e => render(e.target.value));
document.getElementById('btn-export').addEventListener('click', exportData);
load();
