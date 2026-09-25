// ═══════════════════════════════════════════════════════════
//  MOBİL YIKAMA CRM v2 — Tam Özellikli
// ═══════════════════════════════════════════════════════════

// ─── SABİTLER ─────────────────────────────────────────────
const SERVICES = [
  { id:'koltuk', label:'Koltuk Yıkama',     icon:'🛋️', color:'#3B82F6' },
  { id:'hali',   label:'Halı Yıkama',        icon:'🟫', color:'#8B5CF6' },
  { id:'araba',  label:'Araç İçi Temizlik',  icon:'🚗', color:'#10B981' },
  { id:'yatak',  label:'Yatak Yıkama',        icon:'🛏️', color:'#F59E0B' },
  { id:'perde',  label:'Perde Yıkama',        icon:'🪟', color:'#06B6D4' },
  { id:'koltuk_hali', label:'Koltuk + Halı', icon:'✨', color:'#EC4899' },
  { id:'diger',  label:'Diğer',              icon:'🔧', color:'#94A3B8' },
];

const SENSITIVITY = [
  { id:'yok',       label:'Hassasiyet Yok',       color:'#10B981' },
  { id:'deterjan',  label:'Deterjan Hassasiyeti',  color:'#F59E0B' },
  { id:'leke',      label:'Leke Çıkarıcı Hassas.', color:'#F97316' },
  { id:'kimyasal',  label:'Kimyasal Hassas.',       color:'#EF4444' },
  { id:'siddetli',  label:'Çok Hassas / Özel',      color:'#DC2626' },
];

const EXPENSE_CATS = [
  { id:'deterjan', label:'Deterjan / Malzeme', icon:'🧴' },
  { id:'yakit',    label:'Yakıt',               icon:'⛽' },
  { id:'ekipman',  label:'Ekipman / Alet',       icon:'🔧' },
  { id:'kira',     label:'Kira / Fatura',        icon:'🏠' },
  { id:'personel', label:'Personel',             icon:'👷' },
  { id:'diger',    label:'Diğer Gider',          icon:'📦' },
];

// ─── VERİTABANI ───────────────────────────────────────────
const DB = {
  _g: k => { try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } },
  _s: (k,v) => localStorage.setItem(k, JSON.stringify(v)),

  getCustomers:   ()  => DB._g('crm2_customers'),
  getCustomerById:(id)=> DB.getCustomers().find(c=>c.id===id)||null,
  saveCustomer:   (c) => { const a=DB.getCustomers(); const i=a.findIndex(x=>x.id===c.id); i>=0?a[i]=c:a.unshift(c); DB._s('crm2_customers',a); },
  deleteCustomer: (id)=> { DB._s('crm2_customers',DB.getCustomers().filter(c=>c.id!==id)); DB._s('crm2_appointments',DB.getAppointments().filter(a=>a.customerId!==id)); },

  getAppointments:     ()   => DB._g('crm2_appointments'),
  getAppointmentById:  (id) => DB.getAppointments().find(a=>a.id===id)||null,
  saveAppointment:     (a)  => { const all=DB.getAppointments(); const i=all.findIndex(x=>x.id===a.id); i>=0?all[i]=a:all.unshift(a); DB._s('crm2_appointments',all); },
  deleteAppointment:   (id) => DB._s('crm2_appointments',DB.getAppointments().filter(a=>a.id!==id)),
  getByCustomer:       (cId)=> DB.getAppointments().filter(a=>a.customerId===cId).sort((a,b)=>new Date(b.date)-new Date(a.date)),

  getExpenses:   ()  => DB._g('crm2_expenses'),
  saveExpense:   (e) => { const a=DB.getExpenses(); const i=a.findIndex(x=>x.id===e.id); i>=0?a[i]=e:a.unshift(e); DB._s('crm2_expenses',a); },
  deleteExpense: (id)=> DB._s('crm2_expenses',DB.getExpenses().filter(e=>e.id!==id)),
};

// ─── YARDIMCILAR ──────────────────────────────────────────
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmt = n => new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',minimumFractionDigits:0}).format(n||0);
const fmtD  = iso => new Date(iso).toLocaleDateString('tr-TR',{day:'2-digit',month:'short',year:'numeric'});
const fmtDT = iso => new Date(iso).toLocaleString('tr-TR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const fmtTime = iso => new Date(iso).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
const initials = (n='') => (n.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2))||'?';
const getSvc  = id => SERVICES.find(s=>s.id===id)||SERVICES[SERVICES.length-1];
const getSens = id => SENSITIVITY.find(s=>s.id===id)||SENSITIVITY[0];
const getExpCat = id => EXPENSE_CATS.find(e=>e.id===id)||EXPENSE_CATS[EXPENSE_CATS.length-1];
const isToday = iso => new Date(iso).toDateString()===new Date().toDateString();
const escape = s => String(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');

// ─── DURUM ────────────────────────────────────────────────
let page = 'home';
let apptFilter = 'hepsi';
let finTab = 'income';
let searchQ = '';
let detailCustomerId = null;
let detailApptId = null;

// ─── NAVİGASYON ───────────────────────────────────────────
function navigate(p, opts={}) {
  page = p;
  searchQ = '';
  apptFilter = 'hepsi';
  if (opts.customerId) detailCustomerId = opts.customerId;
  if (opts.apptId) detailApptId = opts.apptId;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const navMap = { home:'home', appointments:'appointments', customers:'customers', finance:'finance',
                   'customer-detail':'customers', 'appt-detail':'appointments' };
  const nb = document.getElementById('nav-'+(navMap[p]||p));
  if (nb) nb.classList.add('active');
  render();
}

function fabAction() {
  if (page==='customers')     openAddCustomer();
  else if (page==='finance')  finTab==='income' ? openAddIncome() : openAddExpense();
  else                        openAddAppointment();
}

// ─── RENDER ───────────────────────────────────────────────
function render() {
  const mc = document.getElementById('mainContent');
  mc.scrollTop = 0;
  updateTopBar();
  switch(page) {
    case 'home':            mc.innerHTML = renderHome(); break;
    case 'appointments':    mc.innerHTML = renderAppointments(); break;
    case 'customers':       mc.innerHTML = renderCustomers(); break;
    case 'finance':         mc.innerHTML = renderFinance(); break;
    case 'customer-detail': mc.innerHTML = renderCustomerDetail(detailCustomerId); break;
    case 'appt-detail':     mc.innerHTML = renderApptDetail(detailApptId); break;
  }
}

function updateTopBar() {
  const actions = document.getElementById('topBarActions');
  const fab = document.getElementById('fabBtn');
  if (page==='home') {
    actions.innerHTML = '';
    fab.classList.remove('hidden');
    fab.textContent = '＋';
  } else if (page==='customer-detail') {
    const c = DB.getCustomerById(detailCustomerId);
    actions.innerHTML = c ? `<button class="top-bar-btn" onclick="openEditCustomer('${c.id}')">✏️ Düzenle</button>` : '';
    fab.classList.add('hidden');
  } else if (page==='appt-detail') {
    actions.innerHTML = '';
    fab.classList.add('hidden');
  } else {
    const labels = { appointments:'➕ Randevu', customers:'👤 Müşteri', finance: finTab==='income'?'＋ Gelir':'＋ Gider' };
    actions.innerHTML = `<button class="top-bar-btn" onclick="fabAction()"><span>${labels[page]||''}</span></button>`;
    fab.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════
//  ANA SAYFA
// ═══════════════════════════════════════════════════════════
function renderHome() {
  const customers    = DB.getCustomers();
  const appointments = DB.getAppointments();
  const expenses     = DB.getExpenses();
  const now = new Date();

  const monthApps  = appointments.filter(a=>{const d=new Date(a.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const totalIncome= appointments.filter(a=>a.paymentStatus==='odendi').reduce((s,a)=>s+(+a.price||0),0);
  const monthIncome= monthApps.filter(a=>a.paymentStatus==='odendi').reduce((s,a)=>s+(+a.price||0),0);
  const monthExp   = expenses.filter(e=>{const d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,e)=>s+(+e.amount||0),0);
  const net        = monthIncome - monthExp;
  const todayApps  = appointments.filter(a=>isToday(a.date)).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const pendingRev = appointments.filter(a=>a.paymentStatus!=='odendi').reduce((s,a)=>s+(+a.price||0),0);

  return `
  <div class="stats-row">
    <div class="stat-card blue" onclick="navigate('finance')">
      <div class="stat-icon-box blue">💰</div>
      <div class="stat-label">Bu Ay Gelir</div>
      <div class="stat-value blue">${fmt(monthIncome)}</div>
    </div>
    <div class="stat-card red" onclick="navigate('finance')">
      <div class="stat-icon-box red">📉</div>
      <div class="stat-label">Bu Ay Gider</div>
      <div class="stat-value red">${fmt(monthExp)}</div>
    </div>
    <div class="stat-card green" onclick="navigate('appointments')">
      <div class="stat-icon-box green">📋</div>
      <div class="stat-label">Bu Ay İşlem</div>
      <div class="stat-value green">${monthApps.length}</div>
    </div>
    <div class="stat-card orange" onclick="navigate('appointments')">
      <div class="stat-icon-box orange">📅</div>
      <div class="stat-label">Bugünkü İşler</div>
      <div class="stat-value orange">${todayApps.length}</div>
    </div>
  </div>

  <div class="net-card">
    <div>
      <div class="net-label">🏆 Net Kazanç (Bu Ay)</div>
      <div class="net-value">${fmt(net)}</div>
      <div class="net-sub">${customers.length} müşteri · Toplam ${fmt(totalIncome)} tahsilat</div>
    </div>
    <div class="net-icon">📊</div>
  </div>

  <div class="action-btns">
    <button class="action-btn primary" onclick="openAddAppointment()">📅 Yeni Randevu Ekle</button>
  </div>
  <div class="action-btns" style="padding-top:8px">
    <button class="action-btn success" onclick="openAddIncome()">＋ Gelir Ekle</button>
    <button class="action-btn danger" onclick="openAddExpense()">－ Gider Ekle</button>
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-title">⏳ Bekleyen Tahsilat</span>
      <span class="section-link" onclick="navigate('appointments')">Tümünü Gör</span>
    </div>
    ${pendingRev>0
      ? `<div class="pending-banner">⚠️ Toplam <strong>${fmt(pendingRev)}</strong> tahsilat bekliyor</div>`
      : `<div style="color:var(--success);font-size:13px;font-weight:600;padding:4px 0">✓ Tüm ödemeler tahsil edildi!</div>`}
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-title">📅 Bugünün Randevuları (${todayApps.length})</span>
      <span class="section-link" onclick="navigate('appointments')">Tümünü Gör</span>
    </div>
    ${todayApps.length===0
      ? `<div class="empty" style="padding:24px 0"><div class="empty-icon" style="font-size:36px">📭</div><div class="empty-title" style="font-size:13px">Bugün randevu yok</div></div>`
      : todayApps.map(a=>todayCard(a)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

function todayCard(a) {
  const svc  = getSvc(a.serviceType);
  const sens = getSens(a.sensitivity);
  const paid = a.paymentStatus==='odendi';
  return `
  <div class="today-card" onclick="navigate('appt-detail',{apptId:'${a.id}'})">
    <div class="today-card-top">
      <div>
        <div class="today-card-name">${a.customerName||'—'}</div>
        <div class="today-card-meta">
          <div class="today-meta-row">🕐 ${fmtTime(a.date)} · ${svc.icon} ${svc.label}</div>
          ${a.customerAddress?`<div class="today-meta-row">📍 ${a.customerAddress}</div>`:''}
          ${a.duration?`<div class="today-meta-row">⏱️ ${a.duration}</div>`:''}
        </div>
      </div>
      <div class="today-card-right">
        <div class="today-price">${fmt(a.price)}</div>
        <span class="badge ${paid?'badge-paid':'badge-pending'}" style="margin-top:6px">${paid?'✓ Ödendi':'Bekliyor'}</span>
      </div>
    </div>
    <div class="today-card-bottom">
      ${sens.id!=='yok'?`<span class="badge badge-sens">⚠️ ${sens.label}</span>`:''}
      ${a.notes?`<span style="font-size:11px;color:var(--text-muted)">📝 ${a.notes.slice(0,45)}${a.notes.length>45?'…':''}</span>`:''}
      ${!paid?`<button class="action-btn success" style="padding:7px 14px;font-size:12px;flex:none;margin-left:auto" onclick="event.stopPropagation();markPaid('${a.id}')">✓ Tahsil Et</button>`:''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  RANDEVULAR
// ═══════════════════════════════════════════════════════════
function renderAppointments() {
  const all = DB.getAppointments().sort((a,b)=>new Date(b.date)-new Date(a.date));
  const now = new Date();
  const pendingAmt = all.filter(a=>a.paymentStatus!=='odendi').reduce((s,a)=>s+(+a.price||0),0);

  const filtered = all.filter(a=>{
    if (apptFilter==='bekliyor') return a.paymentStatus!=='odendi';
    if (apptFilter==='odendi')   return a.paymentStatus==='odendi';
    if (apptFilter==='bugun')    return isToday(a.date);
    return true;
  });

  return `
  <div class="page-header">
    <div><div class="page-h-title">📅 Randevular</div><div class="page-h-sub">${all.length} toplam işlem</div></div>
    <button class="top-bar-btn" onclick="openAddAppointment()">➕ Ekle</button>
  </div>
  ${pendingAmt>0?`<div class="pending-banner" style="margin:12px 16px 0">⏳ Bekleyen: <strong>${fmt(pendingAmt)}</strong></div>`:''}
  <div class="filter-bar" style="padding-top:12px">
    ${[['hepsi','Tümü'],['bugun','📅 Bugün'],['bekliyor','⏳ Bekliyor'],['odendi','✓ Ödendi']]
      .map(([id,l])=>`<button class="filter-chip ${apptFilter===id?'active':''}" onclick="apptFilter='${id}';render()">${l}</button>`).join('')}
  </div>
  <div style="padding:12px 16px 0">
  ${filtered.length===0
    ?`<div class="empty"><div class="empty-icon">📅</div><div class="empty-title">Bu filtrede randevu yok</div></div>`
    :filtered.map(a=>apptCard(a,false)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

function apptCard(a, inDetail) {
  const svc  = getSvc(a.serviceType);
  const sens = getSens(a.sensitivity);
  const paid = a.paymentStatus==='odendi';
  return `
  <div class="appt-item" onclick="navigate('appt-detail',{apptId:'${a.id}'})">
    <div class="appt-item-top">
      <div class="appt-svc-icon" style="background:${svc.color}20">${svc.icon}</div>
      <div class="appt-body">
        <div class="appt-svc">${svc.label}${a.serviceCustom?' — '+a.serviceCustom:''}</div>
        ${!inDetail?`<div class="appt-cust">👤 ${a.customerName||'—'}</div>`:''}
        ${a.customerAddress&&!inDetail?`<div class="appt-date">📍 ${a.customerAddress}</div>`:''}
        <div class="appt-date">🕐 ${fmtDT(a.date)}${a.duration?' · ⏱️ '+a.duration:''}</div>
      </div>
      <div class="appt-right">
        <div class="appt-price">${fmt(a.price)}</div>
        <span class="badge ${paid?'badge-paid':'badge-pending'}" style="margin-top:4px">${paid?'✓ Ödendi':'⏳ Bekliyor'}</span>
      </div>
    </div>
    <div class="appt-item-bottom">
      ${sens.id!=='yok'?`<span class="badge badge-sens">⚠️ ${sens.label}</span>`:''}
      ${a.notes?`<span style="font-size:11px;color:var(--text-muted)">📝 ${a.notes.slice(0,50)}${a.notes.length>50?'…':''}</span>`:''}
      <div style="margin-left:auto;display:flex;gap:6px">
        ${!paid?`<button class="action-btn success" style="padding:7px 12px;font-size:11px;flex:none" onclick="event.stopPropagation();markPaid('${a.id}')">✓ Tahsil Et</button>`:''}
        <button class="action-btn danger" style="padding:7px 10px;font-size:11px;flex:none" onclick="event.stopPropagation();confirmDeleteAppt('${a.id}')">🗑️</button>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  RANDEVU DETAY
// ═══════════════════════════════════════════════════════════
function renderApptDetail(id) {
  const a = DB.getAppointmentById(id);
  if (!a) return `<div class="empty"><div class="empty-title">Bulunamadı</div></div>`;
  const svc  = getSvc(a.serviceType);
  const sens = getSens(a.sensitivity);
  const paid = a.paymentStatus==='odendi';

  return `
  <div class="page-header">
    <button class="back-btn" onclick="history.go(-1)||navigate('appointments')">← Geri</button>
  </div>
  <div class="detail-hero" style="background:linear-gradient(180deg,${svc.color}15 0%,transparent 100%)">
    <div style="font-size:52px;margin-bottom:10px">${svc.icon}</div>
    <div class="detail-name">${svc.label}${a.serviceCustom?' — '+a.serviceCustom:''}</div>
    <div class="detail-sub">🕐 ${fmtDT(a.date)}${a.duration?' · ⏱️ '+a.duration:''}</div>
  </div>

  <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
    <div class="info-block" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div class="info-label">Ücret</div>
        <div style="font-size:32px;font-weight:900;color:var(--success)">${fmt(a.price)}</div>
      </div>
      <div style="text-align:right">
        <span class="badge ${paid?'badge-paid':'badge-pending'}" style="font-size:13px;padding:7px 14px">${paid?'✓ Ödendi':'⏳ Bekliyor'}</span>
        ${!paid?`<br><button class="action-btn success" style="padding:9px 16px;font-size:13px;margin-top:8px" onclick="markPaid('${a.id}');render()">✓ Tahsil Et</button>`:''}
      </div>
    </div>

    <div class="info-block">
      ${a.customerName?`<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label">Müşteri</div><div class="info-value">${a.customerName}</div></div></div>`:''}
      ${a.customerPhone?`<div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">Telefon</div><div class="info-value"><a href="tel:${a.customerPhone}" style="color:var(--primary);text-decoration:none">${a.customerPhone}</a></div></div></div>`:''}
      ${a.customerAddress?`<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label">Adres</div><div class="info-value">${a.customerAddress}</div></div></div>`:''}
      ${sens.id!=='yok'?`<div class="info-row"><div class="info-icon">⚠️</div><div><div class="info-label">Hassasiyet</div><div class="info-value" style="color:${sens.color};font-weight:700">${sens.label}</div></div></div>`:''}
      ${a.notes?`<div class="info-row"><div class="info-icon">📝</div><div><div class="info-label">Notlar</div><div class="info-value">${a.notes}</div></div></div>`:''}
    </div>

    <div style="display:flex;gap:10px">
      ${a.customerPhone?`<a href="https://wa.me/90${a.customerPhone.replace(/\D/g,'').slice(-10)}" class="action-btn success" style="flex:1;text-decoration:none">💬 WhatsApp</a>`:''}
      ${a.customerPhone?`<a href="tel:${a.customerPhone}" class="action-btn primary" style="flex:1;text-decoration:none">📞 Ara</a>`:''}
    </div>
    <button class="save-btn danger" onclick="confirmDeleteAppt('${a.id}',true)">🗑️ Bu İşlemi Sil</button>
  </div>
  <div style="height:20px"></div>`;
}

// ═══════════════════════════════════════════════════════════
//  MÜŞTERİLER
// ═══════════════════════════════════════════════════════════
function renderCustomers() {
  const all = DB.getCustomers();
  const q   = searchQ.toLowerCase();
  const list = q ? all.filter(c=>(c.name||'').toLowerCase().includes(q)||(c.phone||'').includes(q)||(c.address||'').toLowerCase().includes(q)) : all;

  return `
  <div class="page-header">
    <div><div class="page-h-title">👥 Müşteri Rehberi</div><div class="page-h-sub">${all.length} kayıtlı müşteri</div></div>
    <button class="top-bar-btn" onclick="openAddCustomer()">👤 Müşteri Ekle</button>
  </div>
  <div class="search-wrap">
    <div class="search-bar">
      <span style="font-size:16px">🔍</span>
      <input type="text" placeholder="Müşteri adı veya telefon ile ara..." value="${searchQ}"
        oninput="searchQ=this.value;render()"/>
      ${searchQ?`<span onclick="searchQ='';render()" style="cursor:pointer;color:var(--text-muted);font-size:18px;padding:0 4px">×</span>`:''}
    </div>
  </div>
  <div style="padding:8px 16px 0">
  ${list.length===0
    ?`<div class="empty"><div class="empty-icon">👥</div><div class="empty-title">${q?'Sonuç bulunamadı':'Henüz müşteri eklenmedi'}</div>${!q?`<button class="action-btn primary" style="margin-top:12px" onclick="openAddCustomer()">İlk Müşteriyi Ekle</button>`:''}</div>`
    :list.map(c=>customerCard(c)).join('')}
  </div>
  <div style="height:10px"></div>`;
}

function customerCard(c) {
  const apps = DB.getByCustomer(c.id);
  const totalPaid = apps.filter(a=>a.paymentStatus==='odendi').reduce((s,a)=>s+(+a.price||0),0);
  const hasSens = c.sensitivityNote;

  return `
  <div class="customer-card">
    <div class="customer-card-top" onclick="navigate('customer-detail',{customerId:'${c.id}'})">
      <div class="avatar">${initials(c.name)}</div>
      <div style="flex:1;min-width:0">
        <div class="cust-name">${c.name}</div>
        ${c.phone?`<div class="cust-phone">📞 ${c.phone}</div>`:''}
        ${c.address?`<div class="cust-address">📍 ${c.address}</div>`:''}
        ${hasSens?`<span class="badge badge-sens" style="margin-top:5px;font-size:10px">⚠️ ${c.sensitivityNote}</span>`:''}
        ${apps.length>0?`<div style="font-size:11px;color:var(--text-muted);margin-top:4px">🔄 ${apps.length} işlem · ${fmt(totalPaid)} ödendi</div>`:''}
      </div>
    </div>
    <div class="customer-card-actions">
      <button class="cust-btn detail" onclick="navigate('customer-detail',{customerId:'${c.id}'})">📋 Detay</button>
      ${c.phone?`<a href="https://wa.me/90${(c.phone||'').replace(/\D/g,'').slice(-10)}" class="cust-btn wa">💬 WA</a>`:''}
      ${c.phone?`<a href="tel:${c.phone}" class="cust-btn call">📞 Ara</a>`:''}
      <button class="cust-btn del" onclick="confirmDeleteCustomer('${c.id}','${escape(c.name)}')">🗑️</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  MÜŞTERİ DETAY
// ═══════════════════════════════════════════════════════════
function renderCustomerDetail(id) {
  const c = DB.getCustomerById(id);
  if (!c) return `<div class="empty"><div class="empty-title">Müşteri bulunamadı</div></div>`;
  const apps = DB.getByCustomer(id);
  const totalPaid = apps.filter(a=>a.paymentStatus==='odendi').reduce((s,a)=>s+(+a.price||0),0);
  const pending   = apps.filter(a=>a.paymentStatus!=='odendi').reduce((s,a)=>s+(+a.price||0),0);

  return `
  <div class="page-header">
    <button class="back-btn" onclick="navigate('customers')">← Geri</button>
  </div>
  <div class="detail-hero">
    <div class="avatar-xl">${initials(c.name)}</div>
    <div class="detail-name">${c.name}</div>
    <div class="detail-sub">Müşteri · ${new Date(c.createdAt).toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</div>
    <div class="detail-stats">
      <div class="d-stat"><div class="d-stat-val">${apps.length}</div><div class="d-stat-label">İşlem</div></div>
      <div class="d-stat"><div class="d-stat-val text-success" style="font-size:15px">${fmt(totalPaid)}</div><div class="d-stat-label">Ödendi</div></div>
      ${pending>0?`<div class="d-stat"><div class="d-stat-val text-warning" style="font-size:15px">${fmt(pending)}</div><div class="d-stat-label">Bekliyor</div></div>`:''}
    </div>
  </div>

  <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
    <!-- Hızlı Aksiyonlar -->
    <div style="display:flex;gap:8px">
      <button class="action-btn primary" style="flex:2" onclick="openAddAppointment('${c.id}','${escape(c.name)}','${escape(c.phone||'')}','${escape(c.address||'')}')">📅 Yeni İşlem Ekle</button>
      ${c.phone?`<a href="https://wa.me/90${(c.phone||'').replace(/\D/g,'').slice(-10)}" class="action-btn success" style="flex:1;text-decoration:none;font-size:12px">💬 WA</a>`:''}
      ${c.phone?`<a href="tel:${c.phone}" class="action-btn primary" style="flex:1;text-decoration:none;background:var(--surface2);box-shadow:none;font-size:12px">📞 Ara</a>`:''}
    </div>

    <!-- Bilgiler -->
    <div class="info-block">
      <div class="info-label" style="margin-bottom:12px">📋 İletişim Bilgileri</div>
      ${c.phone?`<div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">Telefon</div><div class="info-value"><a href="tel:${c.phone}" style="color:var(--primary);text-decoration:none">${c.phone}</a></div></div></div>`:''}
      ${c.address?`<div class="info-row"><div class="info-icon">📍</div><div><div class="info-label">Adres</div><div class="info-value">${c.address}</div></div></div>`:''}
      ${c.sensitivityNote?`<div class="info-row"><div class="info-icon">⚠️</div><div><div class="info-label">Hassasiyet Notu</div><div class="info-value" style="color:#F87171">${c.sensitivityNote}</div></div></div>`:''}
      ${c.notes?`<div class="info-row"><div class="info-icon">📝</div><div><div class="info-label">Özel Notlar</div><div class="info-value">${c.notes}</div></div></div>`:''}
      ${!c.phone&&!c.address&&!c.notes?`<div style="color:var(--text-muted);font-size:13px">Detay bilgi eklenmemiş</div>`:''}
    </div>

    <!-- İşlem Geçmişi -->
    <div style="font-size:13px;font-weight:700;color:var(--text-sec);text-transform:uppercase;letter-spacing:0.8px">
      📁 İşlem Geçmişi (${apps.length})
    </div>
    ${apps.length===0
      ?`<div class="empty" style="padding:24px 0"><div class="empty-title">Henüz işlem yok</div></div>`
      :apps.map(a=>apptCard(a,true)).join('')}
  </div>
  <div style="height:20px"></div>`;
}

// ═══════════════════════════════════════════════════════════
//  FİNANS
// ═══════════════════════════════════════════════════════════
function renderFinance() {
  const appointments = DB.getAppointments();
  const expenses     = DB.getExpenses();
  const now = new Date();

  const incomes = appointments.filter(a=>a.paymentStatus==='odendi')
    .map(a=>({id:a.id,name:a.customerName||'Müşteri',desc:a.serviceLabel||'İşlem',amount:+a.price||0,date:a.date,type:'income',icon:getSvc(a.serviceType).icon}))
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  const expList = expenses.map(e=>({...e,type:'expense',icon:getExpCat(e.category).icon,desc:getExpCat(e.category).label}))
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  const totalIncome  = incomes.reduce((s,i)=>s+i.amount,0);
  const totalExpense = expList.reduce((s,e)=>s+e.amount,0);
  const net = totalIncome - totalExpense;

  const list = finTab==='income' ? incomes : expList;

  return `
  <div class="page-header">
    <div><div class="page-h-title">💳 Kasa & Finans</div><div class="page-h-sub">Net: <strong class="${net>=0?'text-success':'text-error'}">${fmt(net)}</strong></div></div>
    <button class="top-bar-btn" onclick="${finTab==='income'?'openAddIncome()':'openAddExpense()'}">
      ${finTab==='income'?'＋ Gelir':'＋ Gider'}
    </button>
  </div>

  <!-- Özet -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 16px 0">
    <div style="background:var(--success-bg);border:1px solid rgba(16,185,129,0.2);border-radius:var(--r-md);padding:12px;text-align:center">
      <div style="font-size:10px;color:var(--success);font-weight:700;margin-bottom:4px">TOPLAM GELİR</div>
      <div style="font-size:14px;font-weight:900;color:var(--success)">${fmt(totalIncome)}</div>
    </div>
    <div style="background:var(--error-bg);border:1px solid rgba(239,68,68,0.2);border-radius:var(--r-md);padding:12px;text-align:center">
      <div style="font-size:10px;color:var(--error);font-weight:700;margin-bottom:4px">TOPLAM GİDER</div>
      <div style="font-size:14px;font-weight:900;color:var(--error)">${fmt(totalExpense)}</div>
    </div>
    <div style="background:${net>=0?'var(--success-bg)':'var(--error-bg)'};border:1px solid rgba(${net>=0?'16,185,129':'239,68,68'},0.2);border-radius:var(--r-md);padding:12px;text-align:center">
      <div style="font-size:10px;color:${net>=0?'var(--success)':'var(--error)'};font-weight:700;margin-bottom:4px">NET KAZANÇ</div>
      <div style="font-size:14px;font-weight:900;color:${net>=0?'var(--success)':'var(--error)'}">${fmt(net)}</div>
    </div>
  </div>

  <div class="fin-tabs">
    <button class="fin-tab income ${finTab==='income'?'active':''}" onclick="finTab='income';updateTopBar();render()">💰 Gelirler (${incomes.length})</button>
    <button class="fin-tab expense ${finTab==='expense'?'active':''}" onclick="finTab='expense';updateTopBar();render()">📉 Giderler (${expList.length})</button>
  </div>

  <div style="background:var(--surface);border-radius:var(--r-lg);margin:0 16px;border:1px solid var(--border);overflow:hidden">
    ${list.length===0
      ?`<div class="empty"><div class="empty-icon">${finTab==='income'?'💰':'📉'}</div><div class="empty-title">${finTab==='income'?'Henüz gelir yok':'Henüz gider kaydı yok'}</div></div>`
      :list.map(item=>`
      <div class="fin-item" onclick="${finTab==='expense'?`confirmDeleteExpense('${item.id}')`:''}" style="${finTab==='income'?'cursor:default':''}">
        <div class="fin-item-icon" style="background:${finTab==='income'?'var(--success-bg)':'var(--error-bg)'}">${item.icon}</div>
        <div class="fin-item-body">
          <div class="fin-item-name">${item.name}</div>
          <div class="fin-item-sub">
            <span>${fmtD(item.date)}</span>
            <span>·</span>
            <span>${item.desc}</span>
            ${finTab==='income'&&item.id?`<span class="badge badge-paid" style="font-size:10px;padding:2px 8px">Ödendi</span>`:''}
          </div>
        </div>
        <div class="fin-item-amount ${finTab==='income'?'income':'expense'}">
          ${finTab==='income'?'+':'-'}${fmt(item.amount)}
        </div>
        ${finTab==='expense'?`<button onclick="event.stopPropagation();confirmDeleteExpense('${item.id}')" style="background:none;border:none;color:var(--error);font-size:16px;cursor:pointer;padding:4px">🗑️</button>`:''}
      </div>`).join('')}
  </div>
  <div style="height:20px"></div>`;
}

// ═══════════════════════════════════════════════════════════
//  MODAL: RANDEVU EKLE
// ═══════════════════════════════════════════════════════════
function openAddAppointment(customerId, customerName, customerPhone, customerAddress) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0,16);
  const customers = DB.getCustomers();
  const hasCustomer = !!customerId;

  openModal('📅 Yeni Randevu', `
    <div class="form-group">
      <label class="form-label">Müşteri</label>
      ${hasCustomer
        ? `<div style="background:var(--primary-glow);border:1.5px solid var(--primary);border-radius:var(--r-md);padding:12px;font-weight:700;color:var(--primary)">👤 ${customerName}</div>
           <input type="hidden" id="a_cid" value="${customerId}">
           <input type="hidden" id="a_cname" value="${customerName}">
           <input type="hidden" id="a_cphone" value="${customerPhone||''}">
           <input type="hidden" id="a_caddr" value="${customerAddress||''}">`
        : `<select class="form-input" id="a_cid" onchange="fillCustomerInfo(this)">
             <option value="">— Müşteri Seç —</option>
             ${customers.map(c=>`<option value="${c.id}" data-phone="${escape(c.phone||'')}" data-addr="${escape(c.address||'')}">${c.name}${c.phone?' ('+c.phone+')':''}</option>`).join('')}
           </select>
           <input type="hidden" id="a_cname" value="">
           <input type="hidden" id="a_cphone" value="">
           <input type="hidden" id="a_caddr" value="">
           <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
             <span style="font-size:12px;color:var(--text-muted)">veya</span>
             <button class="top-bar-btn" onclick="closeModal();openAddCustomer()">+ Yeni Müşteri Oluştur</button>
           </div>`}
    </div>

    <div class="form-group">
      <label class="form-label">Hizmet Türü</label>
      <div class="option-grid" id="svcGrid">
        ${SERVICES.map((s,i)=>`<button class="option-pill ${i===0?'selected':''}" data-svc="${s.id}" onclick="selectPill('#svcGrid','svc','${s.id}')">${s.icon} ${s.label}</button>`).join('')}
      </div>
      <input class="form-input" id="a_svc_custom" placeholder="Ek açıklama (isteğe bağlı)" style="margin-top:10px">
    </div>

    <div class="form-row form-group">
      <div>
        <label class="form-label">Tarih & Saat</label>
        <input class="form-input" id="a_date" type="datetime-local" value="${dateStr}">
      </div>
      <div>
        <label class="form-label">Süre</label>
        <input class="form-input" id="a_dur" placeholder="Örn: 2 saat">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Deterjana Hassasiyet</label>
      <div class="option-grid" id="sensGrid">
        ${SENSITIVITY.map((s,i)=>`<button class="option-pill ${i===0?'selected':''}" data-sens="${s.id}"
          onclick="selectSensPill('${s.id}')" style="${i===0?`border-color:${s.color};background:${s.color}20;color:${s.color}`:''}">
          ${s.label}</button>`).join('')}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Tahmini Tutar (₺)</label>
      <div class="price-wrap">
        <input id="a_price" type="number" placeholder="0" min="0" step="1">
        <span class="price-wrap-unit">₺</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Ödeme Durumu</label>
      <div class="pay-toggle">
        <button class="pay-btn w" id="pb_bek" onclick="selectPay('bekliyor')">⏳ Bekliyor</button>
        <button class="pay-btn" id="pb_ode" onclick="selectPay('odendi')">✓ Ödendi</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Notlar</label>
      <textarea class="form-input" id="a_notes" placeholder="Kullanılan malzeme, özel istek, adres detayı..."></textarea>
    </div>

    <button class="save-btn" onclick="saveAppointment()">✓ Randevuyu Kaydet</button>
  `);
}

function fillCustomerInfo(sel) {
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('a_cname').value = opt.text.split(' (')[0] || '';
  document.getElementById('a_cphone').value = opt.dataset.phone || '';
  document.getElementById('a_caddr').value  = opt.dataset.addr  || '';
}

function selectPill(container, attr, val) {
  document.querySelectorAll(`${container} .option-pill`).forEach(b=>{
    b.classList.toggle('selected', b.dataset[attr]===val);
  });
}

function selectSensPill(id) {
  const s = getSens(id);
  document.querySelectorAll('#sensGrid .option-pill').forEach(b=>{
    const active = b.dataset.sens===id;
    b.classList.toggle('selected',active);
    b.style.cssText = active?`border-color:${s.color};background:${s.color}20;color:${s.color}`:'';
  });
}

function selectPay(val) {
  document.getElementById('pb_bek').className='pay-btn'+(val==='bekliyor'?' w':'');
  document.getElementById('pb_ode').className='pay-btn'+(val==='odendi'?' s':'');
}

function saveAppointment() {
  const cidEl = document.getElementById('a_cid');
  const cid   = cidEl.tagName==='SELECT' ? cidEl.value : cidEl.value;
  const cname = document.getElementById('a_cname').value || (cidEl.tagName==='SELECT' ? cidEl.options[cidEl.selectedIndex]?.text?.split(' (')[0] : '');
  const cphone= document.getElementById('a_cphone').value;
  const caddr = document.getElementById('a_caddr').value;

  if (!cname) { showToast('Müşteri seçiniz!','error'); return; }
  const svcId = document.querySelector('#svcGrid .option-pill.selected')?.dataset.svc||'diger';
  const sensId= document.querySelector('#sensGrid .option-pill.selected')?.dataset.sens||'yok';
  const paid  = document.getElementById('pb_ode').classList.contains('s') ? 'odendi':'bekliyor';
  const dateV = document.getElementById('a_date').value;
  const svc   = getSvc(svcId);

  DB.saveAppointment({
    id: uid(), customerId: cid, customerName: cname,
    customerPhone: cphone, customerAddress: caddr,
    serviceType: svcId, serviceLabel: svc.label, serviceIcon: svc.icon,
    serviceCustom: document.getElementById('a_svc_custom').value.trim(),
    sensitivity: sensId,
    price: parseFloat(document.getElementById('a_price').value)||0,
    notes: document.getElementById('a_notes').value.trim(),
    duration: document.getElementById('a_dur').value.trim(),
    paymentStatus: paid,
    date: dateV ? new Date(dateV).toISOString() : new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  closeModal(); showToast('Randevu kaydedildi ✓','success'); render();
}

// ═══════════════════════════════════════════════════════════
//  MODAL: MÜŞTERİ EKLE / DÜZENLE
// ═══════════════════════════════════════════════════════════
function openAddCustomer(editId) {
  const c = editId ? DB.getCustomerById(editId) : null;
  openModal(c?'✏️ Müşteriyi Düzenle':'👤 Yeni Müşteri', `
    <div class="form-group">
      <label class="form-label">Ad Soyad <span style="color:var(--error)">*</span></label>
      <input class="form-input" id="c_name" placeholder="Ahmet Yılmaz" value="${escape(c?.name||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Telefon Numarası</label>
      <input class="form-input" id="c_phone" type="tel" placeholder="05XX XXX XX XX" value="${escape(c?.phone||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Adres</label>
      <textarea class="form-input" id="c_addr" placeholder="Mahalle, sokak, kapı no...">${c?.address||''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Hassasiyet Notu <span style="color:var(--text-muted);font-weight:500">(leke çıkarıcı, deterjan vb.)</span></label>
      <input class="form-input" id="c_sens" placeholder="Örn: Leke çıkarıcıya hassasiyeti var" value="${escape(c?.sensitivityNote||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Özel Notlar</label>
      <textarea class="form-input" id="c_notes" placeholder="Hatırlatmalar, özel istekler...">${c?.notes||''}</textarea>
    </div>
    <button class="save-btn" onclick="saveCustomer(${editId?`'${editId}'`:'null'})">${c?'✓ Güncelle':'✓ Müşteriyi Ekle'}</button>
  `);
}

function openEditCustomer(id) { openAddCustomer(id); }

function saveCustomer(editId) {
  const name = document.getElementById('c_name').value.trim();
  if (!name) { showToast('Ad soyad zorunludur!','error'); return; }
  DB.saveCustomer({
    id: editId||uid(), name,
    phone: document.getElementById('c_phone').value.trim(),
    address: document.getElementById('c_addr').value.trim(),
    sensitivityNote: document.getElementById('c_sens').value.trim(),
    notes: document.getElementById('c_notes').value.trim(),
    createdAt: editId ? (DB.getCustomerById(editId)?.createdAt||new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  closeModal(); showToast(editId?'Müşteri güncellendi ✓':'Müşteri eklendi ✓','success'); render();
}

// ═══════════════════════════════════════════════════════════
//  MODAL: GELİR / GİDER EKLE
// ═══════════════════════════════════════════════════════════
function openAddIncome() {
  const customers = DB.getCustomers();
  const now = new Date().toISOString().slice(0,10);
  openModal('💰 Gelir Ekle', `
    <div class="form-group">
      <label class="form-label">Müşteri (isteğe bağlı)</label>
      <select class="form-input" id="i_cust">
        <option value="">— Genel Gelir —</option>
        ${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Açıklama</label>
      <input class="form-input" id="i_desc" placeholder="Koltuk yıkama, halı vb.">
    </div>
    <div class="form-group">
      <label class="form-label">Tutar (₺)</label>
      <div class="price-wrap">
        <input id="i_amt" type="number" placeholder="0" min="0" step="1">
        <span class="price-wrap-unit">₺</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="i_date" type="date" value="${now}">
    </div>
    <button class="save-btn success-btn" onclick="saveIncome()">＋ Geliri Kaydet</button>
  `);
}

function saveIncome() {
  const amt = parseFloat(document.getElementById('i_amt').value)||0;
  if (!amt) { showToast('Tutar giriniz!','error'); return; }
  const custId = document.getElementById('i_cust').value;
  const cust   = custId ? DB.getCustomerById(custId) : null;
  // Manuel geliri randevu gibi kaydet
  DB.saveAppointment({
    id: uid(),
    customerId: custId||'manuel',
    customerName: cust?.name || 'Genel Gelir',
    serviceType: 'diger',
    serviceLabel: document.getElementById('i_desc').value.trim()||'Gelir',
    serviceIcon: '💰',
    serviceCustom: '',
    sensitivity: 'yok',
    price: amt,
    notes: '',
    duration: '',
    paymentStatus: 'odendi',
    date: new Date(document.getElementById('i_date').value||new Date()).toISOString(),
    createdAt: new Date().toISOString(),
  });
  closeModal(); showToast('Gelir kaydedildi ✓','success'); render();
}

function openAddExpense() {
  const now = new Date().toISOString().slice(0,10);
  openModal('📉 Gider Ekle', `
    <div class="form-group">
      <label class="form-label">Gider Kategorisi</label>
      <div class="option-grid" id="expGrid">
        ${EXPENSE_CATS.map((e,i)=>`<button class="option-pill ${i===0?'selected':''}" data-exp="${e.id}" onclick="selectPill('#expGrid','exp','${e.id}')">${e.icon} ${e.label}</button>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Açıklama</label>
      <input class="form-input" id="e_desc" placeholder="Örn: Fairy deterjan, 5L">
    </div>
    <div class="form-group">
      <label class="form-label">Tutar (₺)</label>
      <div class="price-wrap">
        <input id="e_amt" type="number" placeholder="0" min="0" step="1">
        <span class="price-wrap-unit">₺</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tarih</label>
      <input class="form-input" id="e_date" type="date" value="${now}">
    </div>
    <button class="save-btn danger" onclick="saveExpense()">－ Gideri Kaydet</button>
  `);
}

function saveExpense() {
  const amt = parseFloat(document.getElementById('e_amt').value)||0;
  if (!amt) { showToast('Tutar giriniz!','error'); return; }
  const catId = document.querySelector('#expGrid .option-pill.selected')?.dataset.exp||'diger';
  const cat   = getExpCat(catId);
  DB.saveExpense({
    id: uid(), category: catId, label: cat.label,
    desc: document.getElementById('e_desc').value.trim(),
    amount: amt,
    date: new Date(document.getElementById('e_date').value||new Date()).toISOString(),
    createdAt: new Date().toISOString(),
  });
  closeModal(); showToast('Gider kaydedildi','info'); render();
}

// ═══════════════════════════════════════════════════════════
//  HELPER ACTIONS
// ═══════════════════════════════════════════════════════════
function markPaid(id) {
  const a = DB.getAppointmentById(id);
  if (!a) return;
  DB.saveAppointment({...a, paymentStatus:'odendi'});
  showToast('Tahsilat tamamlandı ✓','success');
  render();
}

function confirmDeleteAppt(id, goBack) {
  const a = DB.getAppointmentById(id); if (!a) return;
  openModal('🗑️ İşlemi Sil', `
    <p style="color:var(--text-sec);margin-bottom:24px;line-height:1.6">"<strong>${getSvc(a.serviceType).label}</strong>" randevusunu silmek istiyor musunuz? Bu işlem geri alınamaz.</p>
    <div style="display:flex;gap:10px">
      <button class="save-btn" style="background:var(--surface2);box-shadow:none;flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="DB.deleteAppointment('${id}');closeModal();showToast('Silindi','error');${goBack?`navigate('appointments')`:``}render()">Sil</button>
    </div>
  `);
}

function confirmDeleteCustomer(id, name) {
  openModal('🗑️ Müşteri Sil', `
    <p style="color:var(--text-sec);margin-bottom:24px;line-height:1.6">"<strong>${name}</strong>" müşterisini ve tüm işlem geçmişini silmek istiyor musunuz?</p>
    <div style="display:flex;gap:10px">
      <button class="save-btn" style="background:var(--surface2);box-shadow:none;flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="DB.deleteCustomer('${id}');closeModal();showToast('Müşteri silindi','error');render()">Sil</button>
    </div>
  `);
}

function confirmDeleteExpense(id) {
  openModal('🗑️ Gider Sil', `
    <p style="color:var(--text-sec);margin-bottom:24px">Bu gider kaydını silmek istiyor musunuz?</p>
    <div style="display:flex;gap:10px">
      <button class="save-btn" style="background:var(--surface2);box-shadow:none;flex:1" onclick="closeModal()">İptal</button>
      <button class="save-btn danger" style="flex:1" onclick="DB.deleteExpense('${id}');closeModal();showToast('Silindi','error');render()">Sil</button>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════
//  MODAL CORE
// ═══════════════════════════════════════════════════════════
function openModal(title, body) {
  document.getElementById('modal').innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-header">
      <span class="modal-title">${title}</span>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">${body}</div>`;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.style.overflow='hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow='';
}

let _toastTimer;
function showToast(msg, type='info') {
  clearTimeout(_toastTimer);
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}-t`;
  _toastTimer = setTimeout(()=>t.classList.add('hidden'), 2800);
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>render());
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
