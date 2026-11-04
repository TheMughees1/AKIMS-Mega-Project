/*
 * AKIMS Campus — plain JavaScript interface.
 * Open index.html directly; no build command, server, framework or internet needed.
 * assets/data.js owns sample records and demonstration workflow rules.
 * This local role switcher is a demonstration, not authentication.
 */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const dialog = document.getElementById('dialog');
  const printArea = document.getElementById('print-area');
  const store = window.AKIMS.createStore();
  const actors = window.AKIMS.actors;
  let state = store.getState();
  let actorId = safeRead('akims-demo-actor') || '';
  if (!actors[actorId]) actorId = '';
  let page = safeRead('akims-demo-page') || 'dashboard';
  let selectedRequest = null;
  let importDraft = null;
  let currentDocument = '';
  let toastTimer;
  let dialogReturnFocus;

  function safeRead(key) { try { return localStorage.getItem(key); } catch (_) { return ''; } }
  function safeWrite(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* State displays a persistence warning. */ } }
  function h(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function money(value) { return 'PKR ' + Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function date(value) { return value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
  function initials(name) { return String(name).split(' ').slice(0, 2).map(x => x[0]).join(''); }
  function student(id) { return state.students.find(s => s.id === id); }
  function department(id) { return state.departments.find(d => d.id === id); }
  function actor() { return actors[actorId]; }
  function role() { return actor() && actor().role; }
  function isClosed(r) { return !!r.certificate; }
  function visibleRequests() {
    if (['student', 'alumni'].includes(role())) return state.requests.filter(r => r.studentId === actor().studentId);
    if (role() === 'staff') return state.requests.filter(r => r.requirements.some(d => actor().departmentIds.includes(d.departmentId)));
    return ['admin', 'accounts'].includes(role()) ? state.requests : [];
  }
  function visibleInventory() { return role() === 'staff' ? state.inventory.filter(i => actor().departmentIds.includes(i.departmentId)) : state.inventory; }
  function getRequest(id) {
    const r = visibleRequests().find(x => x.id === id);
    if (!r) throw new Error('This request is not available in this workspace.');
    return r;
  }
  function canReview(departmentId) { return role() === 'admin' || (role() === 'staff' && actor().departmentIds.includes(departmentId)); }
  function canNavigate(id) { return navigation[role()] && navigation[role()].some(n => n[0] === id); }
  function statusName(status) {
    return ({ submitted: 'Submitted', under_review: 'Under review', payment_due: 'Payment due', payment_review: 'Receipt in review', ready: 'Ready for approval', cleared: 'Cleared', correction_requested: 'Correction needed', revoked: 'Revoked', pending: 'Awaiting review', reviewed: 'Assessed', unpaid: 'Awaiting payment', verified: 'Verified', open: 'Investigation open', charged: 'Confirmed charge', returned: 'Item returned', waived: 'Authorized waiver', paid: 'Settled', active: 'Active', graduated: 'Graduated' })[status] || status;
  }
  function badge(status) {
    const tone = ['cleared', 'verified', 'paid', 'returned', 'waived', 'active'].includes(status) ? 'success' : ['revoked', 'open', 'correction_requested'].includes(status) ? 'danger' : ['payment_due', 'unpaid', 'charged', 'pending'].includes(status) ? 'warning' : 'info';
    return `<span class="badge ${tone}">${h(statusName(status))}</span>`;
  }
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 13 2 2 4-4"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5"/>',
    box: '<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M7 5.8l9 5"/>',
    issue: '<path d="m12 3 10 18H2zM12 9v5M12 17v1"/>',
    document: '<path d="M14 2H5a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8zM14 2v6h6M8 13h8M8 17h5"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8V5l14-3v3M21 11h-6v5h6M17 13.5h1"/>',
    book: '<path d="M12 6C8 3 4 3 2 4v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-1-10 2zM12 6v15"/>',
    chart: '<path d="M3 3v18h18M7 17v-5M12 17V7M17 17v-9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    settings: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    graduation: '<path d="m2 8 10-5 10 5-10 5zM6 10v7c4 3 8 3 12 0v-7M22 8v9"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>'
  };
  function icon(name, cls = '') { return `<svg class="${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.document}</svg>`; }
  function button(label, action, attrs = '', type = 'secondary') { return `<button type="button" class="btn ${type}" data-action="${action}" ${attrs}>${label}</button>`; }
  function empty(title, description, action = '') { return `<div class="empty-state">${icon('clipboard')}<h3>${h(title)}</h3><p>${h(description)}</p>${action}</div>`; }
  function heading(eyebrow, title, description, actions = '') { return `<div class="page-heading"><div><p class="eyebrow">${h(eyebrow)}</p><h1>${h(title)}</h1><p class="page-description">${h(description)}</p></div><div class="heading-actions">${actions}</div></div>`; }
  function panel(title, body, extra = '') { return `<section class="panel"><div class="panel-header"><h2>${h(title)}</h2>${extra}</div><div class="panel-body">${body}</div></section>`; }
  function stat(label, value, hint) { return `<div class="stat"><span class="stat-label">${h(label)}</span><strong class="stat-value">${h(value)}</strong><span class="stat-hint">${h(hint)}</span></div>`; }
  function detail(label, value) { return `<div class="detail-item"><span class="muted small">${h(label)}</span><strong>${h(value)}</strong></div>`; }
  function field(label, name, type = 'text', value = '', attributes = '') {
    return `<div class="field"><label for="field-${name}">${h(label)}</label><input id="field-${name}" name="${name}" type="${type}" value="${h(value)}" ${attributes}></div>`;
  }
  function textarea(label, name, value = '', attributes = 'required maxlength="2000"') {
    return `<div class="field"><label for="field-${name}">${h(label)}</label><textarea id="field-${name}" name="${name}" rows="4" ${attributes}>${h(value)}</textarea></div>`;
  }
  function select(label, name, options, attributes = '') {
    return `<div class="field"><label for="field-${name}">${h(label)}</label><select id="field-${name}" name="${name}" ${attributes}>${options}</select></div>`;
  }
  function option(value, label, selected = false) { return `<option value="${h(value)}" ${selected ? 'selected' : ''}>${h(label)}</option>`; }
  const navigation = {
    student: [['dashboard', 'My overview', 'home'], ['clearance', 'My clearance', 'clipboard'], ['documents', 'My documents', 'document'], ['profile', 'My profile', 'settings'], ['help', 'Help & demo guide', 'help']],
    admin: [['dashboard', 'Campus overview', 'home'], ['requests', 'Clearance desk', 'clipboard'], ['students', 'Student records', 'people'], ['inventory', 'Inventory', 'box'], ['issues', 'Breakage & issues', 'issue'], ['import', 'Import students', 'upload'], ['reports', 'Reports', 'chart'], ['audit', 'Activity log', 'clock'], ['help', 'Help & demo guide', 'help']],
    staff: [['dashboard', 'My work queue', 'clipboard'], ['requests', 'Department checks', 'check'], ['students', 'Student assistance', 'people'], ['inventory', 'My laboratory stock', 'box'], ['issues', 'My department issues', 'issue'], ['help', 'Help & demo guide', 'help']],
    accounts: [['dashboard', 'Accounts overview', 'wallet'], ['payments', 'Payment verification', 'clipboard'], ['reports', 'Payment report', 'chart'], ['help', 'Help & demo guide', 'help']],
    teacher: [['dashboard', 'Teaching overview', 'home'], ['classes', 'My classes', 'book'], ['observations', 'Class observations', 'clipboard'], ['help', 'Help & demo guide', 'help']],
    alumni: [['dashboard', 'Alumni home', 'graduation'], ['documents', 'My documents', 'document'], ['profile', 'My profile', 'settings'], ['help', 'Help & demo guide', 'help']]
  };
  const portalTitles = { student: 'Student portal', admin: 'Administration', staff: 'Staff workspace', accounts: 'Accounts workspace', teacher: 'Faculty portal', alumni: 'Alumni portal' };
  const roleDescriptions = {
    student: 'Apply for clearance, follow reviews and collect your documents.',
    admin: 'Coordinate student records, departmental checks and final approvals.',
    staff: 'Review your laboratory assignments and maintain department stock.',
    accounts: 'Review sample payment evidence and reconcile confirmed dues.',
    teacher: 'Keep collective class observations and track assigned teaching.',
    alumni: 'Stay connected and revisit your clearance document history.'
  };
  const roleIcons = { student: 'graduation', admin: 'chart', staff: 'box', accounts: 'wallet', teacher: 'book', alumni: 'people' };

  function render() {
    state = store.getState();
    document.body.classList.remove('menu-open');
    if (!actorId) { renderRolePicker(); return; }
    if (!canNavigate(page)) page = 'dashboard';
    safeWrite('akims-demo-actor', actorId); safeWrite('akims-demo-page', page);
    const nav = navigation[role()];
    const label = nav.find(n => n[0] === page)[1];
    app.innerHTML = `<div class="shell">
      <aside class="sidebar" id="sidebar" aria-label="Workspace navigation">
        <div class="sidebar-brand"><img class="brand-mark" src="assets/images/akims-mark.svg" alt="AKIMS placeholder mark"><div><strong>AKIMS<span class="brand-dot">.</span></strong><span>Campus workspace</span></div></div>
        <p class="portal-label">${h(portalTitles[role()])}</p>
        <nav class="nav-list" aria-label="${h(portalTitles[role()])}">${nav.map(n => `<button type="button" class="nav-item ${page === n[0] ? 'active' : ''}" data-page="${n[0]}" ${page === n[0] ? 'aria-current="page"' : ''}>${icon(n[2])}<span>${n[1]}</span></button>`).join('')}</nav>
        <div class="sidebar-footer"><div class="callout"><span class="eyebrow">A connected campus</span><p>One thoughtful step at a time.</p><span class="small muted">Akbar Institute of Medical Sciences</span></div>${role() === 'admin' ? '<button class="link-button" data-action="export-data">' + icon('download') + ' Export demo data</button>' : ''}<button class="link-button" data-action="reset">Reset demo</button><span class="small muted">Offline demonstration · v1.0</span></div>
      </aside>
      <button class="mobile-backdrop" aria-label="Close navigation" data-action="close-menu" hidden></button>
      <div class="workspace">
        <header class="topbar"><div class="flex gap"><button class="icon-btn menu-toggle" data-action="menu" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><div class="breadcrumb">${h(portalTitles[role()])}<span>/</span><strong>${h(label)}</strong></div></div><div class="topbar-actions"><button class="icon-btn" data-action="announcements" aria-label="Campus announcements">${icon('bell')}</button><span class="avatar" aria-hidden="true">${h(initials(actor().name))}</span><div class="user-meta"><strong>${h(actor().name)}</strong><span>${h(actor().title)}</span></div><button class="btn ghost small" data-action="switch-role">Switch demo role</button></div></header>
        <div class="demo-banner"><span class="pill">DEMO</span><span>Fictional records · changes stay in this browser · no real payments</span></div>
        <main id="main" class="content" tabindex="-1">${store.persistenceAvailable ? '' : `<div class="notice warning" role="alert">${h(store.persistenceWarning || 'Browser storage is unavailable. Changes will last only while this page is open.')}</div>`}${renderPage()}</main>
        <footer class="workspace-footer"><span>AKIMS Campus</span><span>Designed around your academic journey.</span><span>Demonstration edition</span></footer>
      </div></div>`;
    document.title = label + ' · AKIMS Campus Demo';
  }

  function renderRolePicker() {
    clearTimeout(toastTimer);
    document.getElementById('toast').textContent = '';
    document.getElementById('toast').classList.remove('visible');
    safeWrite('akims-demo-actor', '');
    app.innerHTML = `<main id="main" class="role-picker" tabindex="-1">
      <div class="entry-brand"><img class="brand-mark" src="assets/images/akims-mark.svg" alt="AKIMS placeholder mark"><div><strong>AKIMS Campus</strong><span>Akbar Institute of Medical Sciences</span></div><span class="portal-tag">Interactive demonstration</span></div>
      <div class="entry-layout"><section class="entry-intro"><p class="eyebrow">A more connected campus</p><h1>Your campus.<br>Your next chapter.</h1><p>A considered workspace for students, faculty and the people who keep the college moving.</p><div class="entry-art"><img src="assets/images/campus-line.svg" alt=""></div><div class="notice"><strong>Explore a sample workspace</strong><p>Choose a role to try the complete clearance journey. These are fictional accounts, not a sign-in service. Changes are saved only in this browser.</p></div></section>
      <section aria-label="Choose a demonstration role"><div class="section-title"><h2>Choose your workspace</h2><span class="small muted">Six perspectives. One campus.</span></div><div class="role-grid">${['student', 'admin', 'staff', 'accounts', 'teacher', 'alumni'].map(id => `<button class="role-card" data-role="${id}" type="button"><span class="action-icon">${icon(roleIcons[id])}</span><h3>${portalTitles[id]}</h3><span class="role-person">${h(actors[id].name)} · sample account</span><p>${roleDescriptions[id]}</p><span class="action-arrow" aria-hidden="true">${icon('arrow')}</span></button>`).join('')}</div></section></div>
      <footer class="entry-footer"><span>Made for the AKIMS academic community</span><span>Logo and artwork are placeholders · no internet required</span></footer></main>`;
    document.title = 'Choose your workspace · AKIMS Campus Demo';
  }

  function renderPage() {
    if (page === 'dashboard') return dashboard();
    if (page === 'clearance') return clearancePage();
    if (page === 'requests') return selectedRequest ? requestDetail(getRequest(selectedRequest)) : requestsPage();
    if (page === 'documents') return documentsPage();
    if (page === 'profile') return profilePage();
    if (page === 'inventory') return inventoryPage();
    if (page === 'issues') return issuesPage();
    if (page === 'students') return studentsPage();
    if (page === 'payments') return paymentsPage();
    if (page === 'classes') return classesPage();
    if (page === 'observations') return observationsPage();
    if (page === 'import') return importPage();
    if (page === 'reports') return reportsPage();
    if (page === 'audit') return auditPage();
    return helpPage();
  }

  function dashboard() {
    if (role() === 'student') return studentDashboard();
    if (role() === 'admin') return adminDashboard();
    if (role() === 'staff') return staffDashboard();
    if (role() === 'accounts') return accountsDashboard();
    if (role() === 'teacher') return teacherDashboard();
    return alumniDashboard();
  }
  function announcements(limit = 3) {
    return `<div class="timeline">${state.announcements.slice(0, limit).map(n => `<article class="timeline-item"><span class="eyebrow">${h(n.category)} · ${date(n.date)}</span><h3>${h(n.title)}</h3><p>${h(n.text)}</p></article>`).join('')}</div>`;
  }
  function latestOwnRequest() { return visibleRequests().slice().reverse()[0]; }
  function studentDashboard() {
    const s = student(actor().studentId), r = latestOwnRequest();
    const complete = r ? r.requirements.filter(x => x.status === 'cleared').length : 0;
    const due = r && r.challan && r.challan.status !== 'verified' ? r.challan.amount : 0;
    return heading('Student life, simplified', 'Hello, ' + s.name.split(' ')[0] + '.', 'Your next steps and campus updates, together in one place.', button(icon('settings') + ' My profile', 'go', 'data-target="profile"')) +
      `<div class="hero-grid"><section class="welcome-panel"><div class="welcome-copy"><span class="eyebrow">Your academic journey</span><h2>Clear the way<br>for what comes next.</h2><p>Apply once. Follow every department. Keep your documents close.</p>${button('View my clearance ' + icon('arrow'), 'go', 'data-target="clearance"', 'primary')}</div><img class="hero-art" src="assets/images/campus-line.svg" alt=""></section><section class="status-panel"><span class="eyebrow">At a glance</span><h2>${r ? h(statusName(r.status)) : 'Ready when you are.'}</h2><p>${r ? 'Your request is tracked across three demonstration departments.' : 'Start your clearance application when you are ready to try the workflow.'}</p><div class="progress-track">${['Apply', 'Review', 'Complete'].map((x, i) => `<div class="progress-node ${r && (i === 0 || r.status === 'cleared') ? 'done' : i === 0 ? 'current' : ''}"><span>${i + 1}</span><small>${x}</small></div>`).join('')}</div></section></div>
      <div class="stats-strip">${stat('Department checks', complete + ' / 3', 'Completed verifications')}${stat('Unpaid challan', money(due), due ? 'See your sample challan' : 'No issued unpaid challan')}${stat('Your documents', visibleRequests().reduce((n, q) => n + !!q.challan + !!q.certificate, 0), 'Challans and certificates')}</div>
      <div class="two-column"><div>${panel('Your next step', r ? nextStep(r) : empty('Begin your clearance', 'Your profile is ready. Submit a sample application to get started.', button('Apply for clearance', 'new-request', '', 'primary')))}${panel('Campus notices', announcements(2))}</div><div>${panel('Student record', `<div class="detail-grid">${detail('Student', s.name)}${detail('Registration', s.roll)}${detail('Program', s.program)}${detail('Batch', s.batch)}</div>`)}${panel('Quick links', `<div class="action-list">${actionLink('My documents', 'Print your issued documents', 'document', 'documents')}${actionLink('Help with clearance', 'Understand the demonstration steps', 'help', 'help')}</div>`)}</div></div>`;
  }
  function actionLink(title, sub, ico, target) { return `<button class="action-item" data-page="${target}"><span class="action-icon">${icon(ico)}</span><span class="action-copy"><strong>${h(title)}</strong><small>${h(sub)}</small></span><span class="action-arrow">${icon('arrow')}</span></button>`; }
  function nextStep(r) {
    const messages = { submitted: 'Departments will assess outstanding items. Switch to Administration to continue the sample review.', under_review: 'Department checks are in progress. View the request to see what remains.', payment_due: 'A sample challan is ready. Review it and submit a sample receipt reference.', payment_review: 'Accounts will compare the sample receipt with the entered amount and reference.', ready: 'All mandatory checks are complete. Administration can give final authorization.', cleared: 'Your clearance is complete. Your sample certificate is ready to print.', correction_requested: r.correctionNote, revoked: 'This certificate was revoked. Its history remains available in your documents.' };
    return `<div class="stack">${badge(r.status)}<h3>${h(r.id)}</h3><p>${h(messages[r.status] || 'Review the details of your request.')}</p>${button('Open clearance ' + icon('arrow'), 'open-request', `data-id="${h(r.id)}"`, 'primary')}</div>`;
  }

  function adminDashboard() {
    const active = state.requests.filter(r => !isClosed(r));
    const ready = active.filter(r => r.status === 'ready');
    const openIssues = state.requests.flatMap(r => r.issues).filter(i => ['open', 'charged'].includes(i.resolution));
    return heading('Administration', 'A clear view of campus.', 'Coordinate the work that moves every student forward.', button(icon('plus') + ' Start a request', 'new-request', '', 'primary')) +
      `<div class="stats-strip">${stat('Active clearances', active.length, 'Across all demo departments')}${stat('Ready for authorization', ready.length, 'Mandatory checks complete')}${stat('Outstanding issues', openIssues.length, 'Investigations and confirmed dues')}${stat('Student records', state.students.length, 'Fictional demonstration records')}</div>
      <div class="two-column"><div>${panel('Clearance desk', requestTable(active.slice().reverse()), button('View all', 'go', 'data-target="requests"', 'ghost small'))}${panel('Department progress', departmentSummary())}</div><div>${panel('Today’s priorities', `<div class="action-list">${actionLink('Review applications', active.length + ' active requests', 'clipboard', 'requests')}${actionLink('Resolve department issues', openIssues.length + ' outstanding items', 'issue', 'issues')}${actionLink('Import student records', 'Map, validate and preview a CSV', 'upload', 'import')}</div>`)}${panel('Recent activity', activityList(5))}</div></div>`;
  }
  function departmentSummary() {
    const active = state.requests.filter(r => !isClosed(r));
    return `<div class="department-list">${state.departments.map(d => {
      const checks = active.flatMap(r => r.requirements).filter(q => q.departmentId === d.id);
      const done = checks.filter(q => q.status === 'cleared').length;
      return `<div class="department-row"><div><strong>${h(d.name)}</strong><p class="small muted">${done} of ${checks.length} active checks completed</p></div><progress value="${done}" max="${checks.length || 1}" aria-label="${h(d.name)} clearance completion"></progress></div>`;
    }).join('')}</div>`;
  }
  function staffDashboard() {
    const requests = visibleRequests().filter(r => !isClosed(r));
    const waiting = requests.filter(r => r.requirements.some(d => actor().departmentIds.includes(d.departmentId) && d.status !== 'cleared'));
    const low = visibleInventory().filter(i => i.quantity <= i.reorderLevel);
    return heading('Anatomy laboratory', 'Your department, in focus.', 'Review assigned checks and keep the laboratory’s stock records up to date.', button('Assist a student', 'new-request', '', 'primary')) +
      `<div class="notice">Your sample staff account is assigned to <strong>Anatomy laboratory</strong>. Other departments are reviewed by their assigned staff or Administration.</div><div class="stats-strip">${stat('Checks to review', waiting.length, 'In your assigned department')}${stat('Stock lines', visibleInventory().length, 'Anatomy laboratory only')}${stat('Low stock lines', low.length, 'At or below reorder level')}</div><div class="two-column"><div>${panel('Your verification queue', requestTable(waiting))}</div><div>${panel('Stock attention', low.length ? `<div class="action-list">${low.map(i => actionLink(i.name, i.quantity + ' ' + i.unit + ' remaining', 'box', 'inventory')).join('')}</div>` : '<p>No low stock items.</p>')}${panel('Your responsibilities', '<ul class="check-list"><li>Check assigned department obligations.</li><li>Record documented breakage or missing items.</li><li>Clear checks after outstanding issues are resolved.</li><li>Keep each stock movement traceable.</li></ul>')}</div></div>`;
  }
  function accountsDashboard() {
    const paid = state.requests.filter(r => r.challan && r.challan.status === 'verified');
    const pending = state.requests.filter(r => r.challan && r.challan.status === 'submitted');
    const due = state.requests.filter(r => r.challan && r.challan.status !== 'verified');
    return heading('Accounts desk', 'Every payment, accounted for.', 'Review sample references independently before settling a challan.', button('Review receipts', 'go', 'data-target="payments"', 'primary')) +
      `<div class="stats-strip">${stat('Receipts to review', pending.length, 'Awaiting your verification')}${stat('Verified collections', money(paid.reduce((n, r) => n + r.challan.amount, 0)), 'Demonstration totals')}${stat('Unsettled challans', due.length, 'Unpaid or awaiting review')}</div><div class="two-column"><div>${panel('Payment review queue', paymentTable(pending))}</div><div>${panel('A deliberate check', '<div class="stack"><span class="action-icon">' + icon('wallet') + '</span><h3>Receipt submission is one step.</h3><p>In a live system, Accounts checks the actual bank record. Here, enter the sample reference and full amount to simulate that independent check.</p><div class="notice warning">This demo does not connect to a bank or process money. Never make a payment using a sample challan.</div></div>')}</div></div>`;
  }
  function teacherDashboard() {
    return heading('Faculty workspace', 'Good teaching starts with insight.', 'A space for class-level observations, shared progress and thoughtful follow-up.', button(icon('plus') + ' Add class observation', 'new-observation', '', 'primary')) +
      `<div class="two-column"><div>${panel('Your teaching assignments', classCards())}${panel('Recent class observations', observationList(3))}</div><div>${panel('Collective, constructive feedback', '<span class="eyebrow">Academic practice</span><h3>See the class as a whole.</h3><p>Record shared learning needs, laboratory readiness and suggestions for your assigned classes. Avoid individual student evaluations or sensitive personal details.</p>')}${panel('Surveys, thoughtfully introduced', '<p>Anonymous student surveys are planned for a later release, after the college approves response thresholds, confidentiality and access rules.</p><span class="badge neutral">Planned · not active</span>')}</div></div>`;
  }
  function alumniDashboard() {
    const s = student(actor().studentId);
    return heading('The AKIMS alumni community', 'A familiar place. A new chapter.', 'Keep your connection to campus and your academic documents close.', button('Update my details', 'go', 'data-target="profile"', 'primary')) +
      `<section class="welcome-panel"><div class="welcome-copy"><span class="eyebrow">Welcome back, ${h(s.name.split(' ')[0])}</span><h2>Your journey continues.</h2><p>${h(s.program)} · Class of ${h(s.batch.split('–').pop())}</p>${button('Open my documents ' + icon('arrow'), 'go', 'data-target="documents"', 'primary')}</div><img class="hero-art" src="assets/images/campus-line.svg" alt=""></section><div class="two-column"><div>${panel('Your document history', documentList())}</div><div>${panel('Stay connected', '<p>Your own contact details can be updated in this demonstration. A public alumni directory and messaging service are not enabled.</p>')}${panel('Campus notices', announcements(1))}</div></div>`;
  }

  function requestTable(requests) {
    if (!requests.length) return empty('A clear desk', 'No clearance requests match this view.');
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Student / request</th><th scope="col">Progress</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>${requests.map(r => {
      const s = student(r.studentId);
      return `<tr data-search="${h((s.name + ' ' + s.roll + ' ' + r.id + ' ' + statusName(r.status)).toLowerCase())}"><td><strong>${h(s.name)}</strong><span class="table-secondary">${h(r.id)} · ${date(r.createdAt)}</span></td><td>${r.requirements.filter(d => d.status === 'cleared').length} / ${r.requirements.length} departments</td><td>${badge(r.status)}</td><td>${button('Open ' + icon('arrow'), 'open-request', `data-id="${h(r.id)}" aria-label="Open clearance for ${h(s.name)}"`, 'ghost small')}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function searchBox(label = 'Search records') { return `<div class="table-toolbar"><div class="search-field">${icon('search')}<label class="sr-only" for="table-search">${h(label)}</label><input type="search" id="table-search" placeholder="${h(label)}" data-table-search></div><span class="small muted" id="search-count"></span></div>`; }
  function requestsPage() {
    return heading('Clearance operations', role() === 'staff' ? 'Assigned department checks' : 'Clearance desk', 'Every request retains its department checks, decisions and document history.', button(icon('plus') + ' Start a request', 'new-request', '', 'primary')) +
      panel('Applications', searchBox('Search student, request or status') + requestTable(visibleRequests().slice().reverse()));
  }
  function clearancePage() {
    const own = visibleRequests().slice().reverse();
    const r = selectedRequest ? getRequest(selectedRequest) : own[0];
    const canNew = !own.some(q => !isClosed(q));
    if (!r) return heading('Your student journey', 'My clearance', 'A single request connects your laboratory and store checks.') + panel('Get started', empty('Your next chapter starts here', 'Your sample profile is ready. Apply to begin the three-department demonstration.', button('Apply for clearance', 'new-request', '', 'primary'))) + panel('How it works', walkthrough());
    return requestDetail(r) + (own.length > 1 ? panel('Previous requests', requestTable(own.filter(q => q.id !== r.id))) : '') +
      (canNew ? '<div class="form-actions">' + button('Start another request', 'new-request') + '</div>' : '');
  }
  function requestDetail(r) {
    const s = student(r.studentId);
    const admin = role() === 'admin', staff = role() === 'staff';
    const closed = isClosed(r);
    const requirements = staff ? r.requirements.filter(q => actor().departmentIds.includes(q.departmentId)) : r.requirements;
    const issues = staff ? r.issues.filter(i => actor().departmentIds.includes(i.departmentId)) : r.issues;
    const back = ['admin', 'staff'].includes(role()) ? button('← All requests', 'request-list', '', 'ghost') : '';
    let actions = '';
    if (admin && !closed) {
      if (!r.challan) actions += button('Request correction', 'correction', `data-id="${h(r.id)}"`);
      actions += button('Final authorization', 'finalize', `data-id="${h(r.id)}"`, 'primary');
    }
    if (role() === 'student' && r.status === 'correction_requested') actions += button('Correct & resubmit', 'resubmit', `data-id="${h(r.id)}"`, 'primary');
    if (admin && r.certificate && !r.certificate.revokedAt) actions += button('Revoke certificate', 'revoke', `data-id="${h(r.id)}"`, 'danger');
    return heading('Clearance request', s.name, r.id + ' · ' + s.roll, back + actions) +
      (r.status === 'correction_requested' ? `<div class="notice warning"><strong>Correction requested</strong><p>${h(r.correctionNote)}</p></div>` : '') +
      `<div class="stats-strip">${stat('Request status', statusName(r.status), 'Submitted ' + date(r.createdAt))}${stat('Department checks', r.requirements.filter(d => d.status === 'cleared').length + ' / ' + r.requirements.length, 'Mandatory demo requirements')}${stat('Assessed charges', money(r.issues.filter(i => ['charged', 'paid'].includes(i.resolution)).reduce((n, i) => n + i.amount, 0)), r.challan ? 'Challan ' + r.challan.number : 'No challan issued')}</div>
      <div class="two-column"><div>${panel('Department verification', `<div class="department-list">${requirements.map(q => `<div class="department-row"><div><strong>${h(department(q.departmentId).name)}</strong><p class="small muted">${h(q.note || 'Assessment and item verification')}</p>${badge(q.status)}</div>${canReview(q.departmentId) && !closed && r.status !== 'correction_requested' ? `<div class="form-actions">${r.challan ? '' : button('Record issue', 'add-issue', `data-id="${h(r.id)}" data-dept="${q.departmentId}"`, 'ghost small')}${q.status !== 'cleared' ? button('Assessment complete', 'assess', `data-id="${h(r.id)}" data-dept="${q.departmentId}" data-status="reviewed"`, 'secondary small') + button('Clear department', 'assess', `data-id="${h(r.id)}" data-dept="${q.departmentId}" data-status="cleared"`, 'primary small') : ''}</div>` : ''}</div>`).join('')}</div>`)}
      ${panel('Breakage, items & resolutions', issues.length ? issues.map(i => `<article class="issue-card"><div class="flex gap"><strong>${h(i.description)}</strong>${badge(i.resolution)}</div><p class="small muted">${h(department(i.departmentId).name)} · ${h(i.id)}</p><p>${i.amount ? money(i.amount) : 'Investigation · no charge confirmed'}${i.note ? ' · ' + h(i.note) : ''}</p>${canReview(i.departmentId) && !closed && ['open', 'charged'].includes(i.resolution) && !r.challan ? `<div class="form-actions">${button('Item returned / resolved', 'resolve-issue', `data-id="${h(r.id)}" data-issue="${h(i.id)}" data-resolution="returned"`, 'secondary small')}${admin ? button('Authorize waiver', 'resolve-issue', `data-id="${h(r.id)}" data-issue="${h(i.id)}" data-resolution="waived"`, 'ghost small') : ''}</div>` : ''}</article>`).join('') : '<p class="muted">No issues have been recorded for this request.</p>')}
      </div><div>${panel('Request details', `<div class="detail-grid">${detail('Program', s.program)}${detail('Batch', s.batch)}${detail('Purpose', r.purpose)}${detail('Created', date(r.createdAt))}</div>`)}
      ${panel('Challan & payment', challanPanel(r))}
      ${r.certificate ? panel('Clearance certificate', `<div class="stack">${badge(r.certificate.revokedAt ? 'revoked' : 'cleared')}<strong>${h(r.certificate.number)}</strong><p>Issued ${date(r.certificate.issuedAt)}${r.certificate.revokedAt ? '. Revoked: ' + h(r.certificate.reason) : '. A demonstration document for your records.'}</p>${button('View certificate', 'document', `data-id="${h(r.id)}" data-kind="certificate"`, 'primary')}</div>`) : panel('Final authorization', '<p>All mandatory departments must clear the request. Open investigations and unsettled challans block certificate issuance.</p>')}
      </div></div>`;
  }
  function challanPanel(r) {
    if (role() === 'staff') return '<p>Accounts handles challan and receipt review. Your department obligations are listed under issues.</p>' + (r.challan ? badge(r.challan.status) : '<span class="badge neutral">No challan issued</span>');
    if (!r.challan) return `<p>${r.issues.some(i => i.resolution === 'charged') ? 'Confirmed charges can be compiled after every department finishes its assessment.' : 'A zero-dues request does not need a payment.'}</p>${role() === 'admin' && !isClosed(r) ? button('Issue sample challan', 'issue-challan', `data-id="${h(r.id)}"`, 'primary') : ''}`;
    const c = r.challan;
    return `<div class="stack">${badge(c.status)}<strong class="amount">${money(c.amount)}</strong><span class="small mono">${h(c.number)}</span>${button('View / print challan', 'document', `data-id="${h(r.id)}" data-kind="challan"`)}${c.reviewNote ? `<div class="notice warning">${h(c.reviewNote)}</div>` : ''}${c.receipt ? `<div class="small"><strong>Sample receipt</strong><p>${h(c.receipt.name)}<br>Reference: ${h(c.receipt.reference)}</p><span class="muted">File details only; no receipt image is stored.</span></div>` : ''}${role() === 'student' && c.status === 'unpaid' ? button('Submit sample receipt', 'receipt', `data-id="${h(r.id)}"`, 'primary') : ''}${role() === 'accounts' && c.status === 'submitted' ? button('Review receipt', 'review-receipt', `data-id="${h(r.id)}"`, 'primary') : ''}</div>`;
  }

  function documentsPage() { return heading('Your academic records', 'My documents', 'Issued sample documents remain available with their current validity status.') + panel('Document library', documentList()); }
  function documentList() {
    const rows = visibleRequests().slice().reverse().flatMap(r => ['challan', 'certificate'].filter(k => r[k]).map(kind => {
      const doc = r[kind], isCert = kind === 'certificate';
      return `<tr><td><strong>${isCert ? 'Clearance certificate' : 'Clearance challan'}</strong><span class="table-secondary">${h(doc.number)}</span></td><td>${date(doc.issuedAt)}</td><td>${badge(isCert ? (doc.revokedAt ? 'revoked' : 'cleared') : doc.status)}</td><td>${button('View document', 'document', `data-id="${h(r.id)}" data-kind="${kind}"`, 'secondary small')}</td></tr>`;
    }));
    return rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Document</th><th>Issued</th><th>Status</th><th><span class="sr-only">Open</span></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empty('Your documents will appear here', 'A challan is available after assessment. A certificate follows final authorization.');
  }
  function profilePage() {
    const s = student(actor().studentId), update = state.profileUpdates[s.id] || {};
    return heading('Your campus identity', 'My profile', 'Keep your own contact information current. Academic identity changes need an institutional review.') +
      `<div class="two-column"><div>${panel('Academic record', `<div class="detail-grid">${detail('Full name', s.name)}${detail('Registration', s.roll)}${detail('Program', s.program)}${detail('Batch', s.batch)}${detail('Enrollment status', statusName(s.status))}</div>`)}</div><div>${panel('Contact information', `<form data-form="profile"><div class="stack">${field('Email address', 'email', 'email', update.email == null ? s.email : update.email, 'required maxlength="150"')}${field('Phone number', 'phone', 'tel', update.phone == null ? s.phone : update.phone, 'maxlength="30"')}<p class="small muted">Use fictional contact details in this demonstration.</p><p class="form-error" role="alert"></p><button class="btn primary" type="submit">Save contact details</button></div></form>`)}</div></div>`;
  }

  function inventoryPage() {
    const items = visibleInventory();
    return heading('Laboratories & central store', 'Inventory', 'Useful stock records, with a reason behind every movement.', button(icon('download') + ' Export inventory', 'export-inventory')) +
      `<div class="stats-strip">${stat('Stock lines', items.length, role() === 'staff' ? 'Assigned department' : 'Across all departments')}${stat('Low stock', items.filter(i => i.quantity <= i.reorderLevel).length, 'At or below reorder level')}${stat('Recorded movements', state.stockMovements.filter(m => items.some(i => i.id === m.itemId)).length, 'Receipts and issues')}</div>` +
      panel('Stock register', searchBox('Search apparatus, category or department') + `<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Department</th><th>Available</th><th>Stock status</th><th><span class="sr-only">Movement</span></th></tr></thead><tbody>${items.map(i => `<tr data-search="${h((i.name + ' ' + i.category + ' ' + department(i.departmentId).name).toLowerCase())}"><td><strong>${h(i.name)}</strong><span class="table-secondary">${h(i.category)} · ${i.id}</span></td><td>${h(department(i.departmentId).short)}</td><td><strong>${i.quantity}</strong> ${h(i.unit)}</td><td><span class="badge ${i.quantity <= i.reorderLevel ? 'warning' : 'success'}">${i.quantity <= i.reorderLevel ? 'Reorder attention' : 'In stock'}</span></td><td>${button('Stock movement', 'stock', `data-id="${i.id}"`, 'secondary small')}</td></tr>`).join('')}</tbody></table></div>`) +
      panel('Movement history', stockHistory(items));
  }
  function stockHistory(items) {
    const rows = state.stockMovements.filter(m => items.some(i => i.id === m.itemId)).slice().reverse();
    if (!rows.length) return '<p class="muted">No movements yet. Record a stock receipt or issue to start the ledger.</p>';
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Movement</th><th>Reason</th><th>Date</th></tr></thead><tbody>${rows.map(m => `<tr><td>${h(items.find(i => i.id === m.itemId).name)}</td><td>${m.direction === 'in' ? '+' : '−'}${m.quantity}</td><td>${h(m.reason)}</td><td>${date(m.createdAt)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function issuesPage() {
    const list = visibleRequests().flatMap(r => r.issues.filter(i => role() !== 'staff' || actor().departmentIds.includes(i.departmentId)).map(i => ({ r, i })));
    return heading('Resolve with a clear record', 'Breakage & issues', 'Track documented incidents, confirmed dues and authorized resolutions.') +
      panel('Issue register', searchBox('Search student, issue or department') + (list.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Issue / student</th><th>Department</th><th>Amount</th><th>Resolution</th><th><span class="sr-only">Action</span></th></tr></thead><tbody>${list.map(({ r, i }) => `<tr data-search="${h((i.description + ' ' + student(r.studentId).name + ' ' + department(i.departmentId).name).toLowerCase())}"><td><strong>${h(i.description)}</strong><span class="table-secondary">${h(student(r.studentId).name)}</span></td><td>${h(department(i.departmentId).short)}</td><td>${money(i.amount)}</td><td>${badge(i.resolution)}</td><td>${button('Open request', 'open-request', `data-id="${h(r.id)}"`, 'ghost small')}</td></tr>`).join('')}</tbody></table></div>` : empty('No incidents recorded', 'Open a clearance request to record a department issue.')));
  }
  function studentsPage() {
    return heading('Academic records', role() === 'staff' ? 'Student assistance' : 'Student records', role() === 'staff' ? 'Find a student to initiate an assisted clearance request. This view omits private contact details.' : 'Search fictional records or import a validated CSV batch.', role() === 'admin' ? button('Import CSV', 'go', 'data-target="import"', 'primary') : '') +
      panel('Student directory', searchBox('Search name, registration or program') + `<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Program / batch</th><th>Status</th><th><span class="sr-only">Action</span></th></tr></thead><tbody>${state.students.map(s => `<tr data-search="${h((s.name + ' ' + s.roll + ' ' + s.program).toLowerCase())}"><td><strong>${h(s.name)}</strong><span class="table-secondary">${h(s.roll)}</span></td><td>${h(s.program)}<span class="table-secondary">${h(s.batch)}</span></td><td>${badge(s.status)}</td><td>${s.status === 'active' ? button('Start clearance', 'new-request', `data-student="${s.id}"`, 'secondary small') : '<span class="small muted">Archived enrollment</span>'}</td></tr>`).join('')}</tbody></table></div>`);
  }
  function paymentTable(requests) {
    if (!requests.length) return empty('No receipts awaiting review', 'A sample receipt appears here after the student submits it against an issued challan.');
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Student / challan</th><th>Amount</th><th>Status</th><th><span class="sr-only">Action</span></th></tr></thead><tbody>${requests.map(r => `<tr><td><strong>${h(student(r.studentId).name)}</strong><span class="table-secondary">${h(r.challan.number)}</span></td><td>${money(r.challan.amount)}</td><td>${badge(r.challan.status)}</td><td>${r.challan.status === 'submitted' ? button('Review receipt', 'review-receipt', `data-id="${h(r.id)}"`, 'primary small') : button('View challan', 'document', `data-id="${h(r.id)}" data-kind="challan"`, 'secondary small')}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function paymentsPage() { return heading('Accounts verification', 'Payment verification', 'Compare the sample reference and amount before settling a confirmed obligation.') + panel('Challans & receipts', paymentTable(state.requests.filter(r => r.challan).slice().reverse())); }
  function classCards() {
    return `<div class="class-list">${actor().classes.map((name, n) => `<article class="class-card"><span class="eyebrow">Assigned class 0${n + 1}</span><h3>${h(name)}</h3><p>Medical Laboratory Technology</p><div class="flex gap"><span class="badge info">${state.observations.filter(o => o.className === name).length} observations</span>${button('Add observation', 'new-observation', `data-class="${h(name)}"`, 'secondary small')}</div></article>`).join('')}</div>`;
  }
  function classesPage() { return heading('Teaching assignments', 'My classes', 'Class-level learning needs and collective academic progress.') + panel('Assigned classes', classCards()); }
  function observationList(limit) {
    const list = state.observations.filter(o => actor().classes.includes(o.className)).slice().reverse();
    return (limit ? list.slice(0, limit) : list).map(o => `<article class="timeline-item"><span class="eyebrow">${h(o.className)}</span><p>${h(o.text)}</p><span class="small muted">${h(o.author)} · ${date(o.createdAt)}</span></article>`).join('') || empty('No observations yet', 'Add a constructive collective observation for one of your assigned classes.');
  }
  function observationsPage() { return heading('Reflect, improve, follow through', 'Class observations', 'Record collective observations without individual student evaluations.', button(icon('plus') + ' Add class observation', 'new-observation', '', 'primary')) + panel('Observation journal', '<div class="timeline">' + observationList() + '</div>'); }

  function reportsPage() {
    const requests = role() === 'accounts' ? state.requests.filter(r => r.challan) : state.requests;
    return heading('Useful institutional records', role() === 'accounts' ? 'Payment report' : 'Reports', 'Download the current fictional records as readable CSV files.') +
      `<div class="three-column">${panel('Clearance summary', `<strong class="amount">${requests.length}</strong><p>${role() === 'accounts' ? 'Requests with issued challans.' : 'Requests across the demonstration.'}</p>${button('Export ' + (role() === 'accounts' ? 'payments' : 'clearance') + ' CSV', 'export-clearance', '', 'primary')}`)}${role() === 'admin' ? panel('Student records', '<p>Registration, program and batch records from this local demonstration.</p>' + button('Export students CSV', 'export-students')) + panel('Stock register', '<p>Current quantities and reorder thresholds, grouped by department.</p>' + button('Export inventory CSV', 'export-inventory')) : panel('Verification summary', `<p>Verified challans: <strong>${requests.filter(r => r.challan.status === 'verified').length}</strong></p><p>Waiting for review: <strong>${requests.filter(r => r.challan.status === 'submitted').length}</strong></p>`)}</div>` +
      panel('Current clearance records', role() === 'accounts' ? paymentTable(requests) : requestTable(requests.slice().reverse()));
  }
  function activityList(limit) {
    const events = state.audit.slice().reverse().slice(0, limit);
    return events.length ? '<div class="timeline">' + events.map(e => `<article class="timeline-item"><strong>${h(e.action.replace(/([A-Z])/g, ' $1'))}</strong><p class="small muted">${h(e.actorName || e.actor || e.actorId)} · ${date(e.createdAt || e.at)}</p><span class="small">${h(e.summary || e.targetId || '')}</span></article>`).join('') + '</div>' : '<p class="muted">Actions taken in this demo will appear here.</p>';
  }
  function auditPage() { return heading('A traceable demonstration', 'Activity log', 'A local history of workflow and stock actions. Browser data can be edited; this is not a production audit trail.') + panel('Recorded activity', activityList(200)); }

  function walkthrough() {
    const steps = [['Student', 'Apply for clearance from My clearance.'], ['Administration', 'Review departments. Record a confirmed issue, then complete every assessment.'], ['Administration', 'Issue a sample challan when confirmed charges remain.'], ['Student', 'View the challan and submit a sample receipt with a reference.'], ['Accounts', 'Enter the matching sample reference and exact full amount to verify.'], ['Administration', 'Clear all departments and authorize the sample certificate.']];
    return `<ol class="walkthrough">${steps.map(s => `<li><strong>${s[0]}</strong><p>${s[1]}</p></li>`).join('')}</ol>`;
  }
  function helpPage() {
    return heading('A little guidance', 'Explore the demo', 'Everything you need to try the workflow in one browser.') +
      `<div class="two-column"><div>${panel('Try the complete clearance journey', walkthrough())}${panel('A zero-dues shortcut', '<p>Apply as Student, switch to Administration, clear all three departments and give final authorization. A zero-dues request does not need a challan or receipt.</p>')}</div><div>${panel('What this demonstration saves', '<p>Fictional records and workflow changes are stored in this browser when local storage is available. Other devices and browsers do not share them. Clearing browser data may remove them.</p><p>Receipt submissions retain file details only. The original file is not uploaded or stored.</p>')}${panel('Before real college use', '<p>The role switcher is not authentication. Real shared records need a secure server, database, institution-approved policies and access controls. Do not enter real student information, passwords or bank details here.</p><p>Full LMS lessons, assignments and surveys are later modules; they are not implemented in this demo.</p>')}${panel('Start again', '<p>Reset restores the fictional sample records and removes the changes made in this browser.</p>' + button('Reset demonstration', 'reset', '', 'danger'))}</div></div>`;
  }

  // CSV import is deliberately a preview-first workflow. No record is overwritten.
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = []; let row = [], value = '', quoted = false, afterQuote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { value += '"'; i++; }
        else if (c === '"') { quoted = false; afterQuote = true; }
        else value += c;
      } else if (c === '"' && value === '' && !afterQuote) quoted = true;
      else if (c === ',') { row.push(value); value = ''; afterQuote = false; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(value); if (row.some(v => v.trim() !== '')) rows.push(row); row = []; value = ''; afterQuote = false;
      } else {
        if (afterQuote && c.trim()) throw new Error('Unexpected text after a quoted value. Export a standard CSV file and try again.');
        if (c === '"' && value !== '') throw new Error('Unexpected quote in a CSV field.');
        if (!afterQuote) value += c;
      }
    }
    if (quoted) throw new Error('The CSV contains an unclosed quote.');
    row.push(value); if (row.some(v => v.trim() !== '')) rows.push(row);
    if (rows.length < 2) throw new Error('Include a header row and at least one student record.');
    if (rows.length > 501) throw new Error('This demo accepts up to 500 student records per file.');
    const headers = rows.shift().map(x => x.trim());
    if (headers.some(x => !x)) throw new Error('Every CSV column needs a header.');
    if (new Set(headers.map(x => x.toLowerCase())).size !== headers.length) throw new Error('CSV column headers must be unique.');
    if (rows.some(r => r.length !== headers.length)) throw new Error('Every row must have the same number of columns as the header.');
    return { headers, rows };
  }
  const importFields = [['roll', 'Registration number'], ['name', 'Full name'], ['program', 'Program'], ['batch', 'Batch / session'], ['email', 'Email']];
  function importPage() {
    let body;
    if (!importDraft) body = `<div class="two-column"><div><span class="eyebrow">01 · Select file</span><h3>Bring your student records together.</h3><p>Choose a CSV exported from Excel. Map your actual column names in the next step.</p><form data-form="import-file" class="stack"><div class="field"><label for="csv-file">Student CSV file</label><input id="csv-file" name="csv" type="file" accept=".csv,text/csv" required></div><p class="small muted">Fictional data only · maximum 1 MB / 500 rows</p><p class="form-error" role="alert"></p><button class="btn primary" type="submit">Inspect columns</button></form></div><div class="notice"><h3>Nothing is imported yet.</h3><p>You will map the fields, review validation results and explicitly confirm the import. Existing registrations and conflicting emails are rejected.</p>${button('Download sample CSV', 'sample-csv')}</div></div>`;
    else if (!importDraft.preview) body = `<span class="eyebrow">02 · Map columns</span><h3>Match your fields</h3><p>${h(importDraft.name)} · ${importDraft.rows.length} rows. Select the source column for every field.</p><form data-form="import-map"><div class="form-grid">${importFields.map(([key, label]) => select(label, key, option('', 'Choose a source column') + importDraft.headers.map((name, i) => option(i, name, name.toLowerCase() === key)).join(''), 'required')).join('')}</div><p class="form-error" role="alert"></p><div class="form-actions">${button('Choose another file', 'import-reset')}<button class="btn primary" type="submit">Validate & preview</button></div></form>`;
    else {
      const preview = importDraft.preview;
      body = `<span class="eyebrow">03 · Review before import</span><h3>${preview.errors.length ? 'Some records need attention.' : 'Your records are ready for review.'}</h3><p>${preview.rows.length} records · ${preview.errors.length} validation errors · existing records will be preserved.</p>${preview.errors.length ? `<div class="notice warning" role="alert"><ul>${preview.errors.slice(0, 20).map(e => '<li>' + h(e) + '</li>').join('')}</ul>${preview.errors.length > 20 ? '<p>Download the error report for all errors.</p>' : ''}${button('Download error report', 'import-errors')}</div>` : '<div class="notice">Review names and registrations below. Confirm only when the data is correct.</div>'}<div class="table-wrap"><table class="data-table"><thead><tr><th>Registration</th><th>Name</th><th>Program</th><th>Batch</th><th>Email</th></tr></thead><tbody>${preview.rows.slice(0, 25).map(r => `<tr><td>${h(r.roll)}</td><td>${h(r.name)}</td><td>${h(r.program)}</td><td>${h(r.batch)}</td><td>${h(r.email)}</td></tr>`).join('')}</tbody></table></div>${preview.rows.length > 25 ? '<p class="small muted">Preview displays the first 25 records. Validation covers every row.</p>' : ''}<div class="form-actions">${button('Map again', 'import-remap')}${button('Choose another file', 'import-reset')}${preview.errors.length ? '' : button('Confirm import · ' + preview.rows.length + ' students', 'import-commit', '', 'primary')}</div>`;
    }
    return heading('Data, carefully introduced', 'Import students', 'Inspect → map → validate → preview → confirm. CSV files only in this edition.') + panel('Student import wizard', body) +
      panel('Import history', (state.importHistory || []).length ? '<div class="timeline">' + state.importHistory.slice().reverse().map(b => `<div class="timeline-item"><strong>${h(b.id)}</strong><p>${b.count || b.studentIds?.length || 0} records · ${date(b.createdAt)}</p></div>`).join('') + '</div>' : '<p class="muted">Successful batches will be recorded here.</p>');
  }

  // Dialogs use the browser's focus-trapping dialog element and labelled controls.
  function showDialog(title, content, footer = '', wide = false) {
    dialogReturnFocus = document.activeElement;
    dialog.classList.toggle('wide', wide);
    dialog.innerHTML = `<div class="modal-header"><h2 id="dialog-title">${h(title)}</h2><button class="icon-btn" type="button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><div class="modal-body">${content}</div>${footer ? '<div class="modal-footer">' + footer + '</div>' : ''}`;
    if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { dialog.close(); if (dialogReturnFocus && dialogReturnFocus.isConnected) dialogReturnFocus.focus(); }
  function showForm(title, name, body, submitLabel, attrs = '') {
    showDialog(title, `<form data-form="${name}" ${attrs}><div class="stack">${body}<p class="form-error" role="alert"></p><div class="form-actions">${button('Cancel', 'close-dialog')}<button type="submit" class="btn primary">${h(submitLabel)}</button></div></div></form>`);
  }
  function notice(message) {
    const toast = document.getElementById('toast'); clearTimeout(toastTimer);
    toast.textContent = message; toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 5500);
  }
  function dispatch(action, payload, success, keepDialog = false) {
    const result = store.dispatch(actorId, action, payload);
    state = store.getState();
    if (!keepDialog && dialog.open) closeDialog();
    render(); focusMain(); notice(success || 'Saved to this demonstration.');
    return result;
  }
  function formError(form, error) {
    let node = form.querySelector('.form-error');
    if (!node) { node = document.createElement('p'); node.className = 'form-error'; node.setAttribute('role', 'alert'); form.appendChild(node); }
    node.textContent = error.message || String(error);
    node.setAttribute('tabindex', '-1'); node.focus();
  }

  function showNewRequest(studentId) {
    const options = state.students.filter(s => s.status === 'active').map(s => option(s.id, s.name + ' · ' + s.roll, s.id === studentId)).join('');
    showForm('Start a clearance request', 'create-request',
      `<p>Three departments are included in this fictional policy: Anatomy laboratory, Clinical laboratory and Central store.</p>${role() === 'student' ? '<div class="notice">' + h(student(actor().studentId).name) + ' · ' + h(student(actor().studentId).roll) + '</div>' : select('Student', 'studentId', options, 'required')}${textarea('Reason for clearance', 'purpose', 'Graduation clearance', 'required minlength="3" maxlength="180"')}<p class="small muted">A student can have only one open request at a time.</p>`, 'Submit application');
  }
  function showIssue(r, departmentId) {
    showForm('Record a department issue', 'add-issue', `<div class="notice">${h(department(departmentId).name)} · ${h(student(r.studentId).name)}</div>${textarea('Issue description', 'description', '', 'required minlength="5" maxlength="500"')}${field('Confirmed charge (PKR)', 'amount', 'number', '0', 'required min="0" max="10000000" step="0.01"')}<p class="small muted">Enter 0 for an unresolved investigation. A positive amount represents a documented, confirmed charge in this demonstration.</p>`, 'Record issue', `data-id="${h(r.id)}" data-dept="${departmentId}"`);
  }
  function showReceipt(r) {
    showForm('Submit a sample receipt', 'receipt', `<div class="notice warning">Demonstration only. Choose a sample file. Only its name, type and size are recorded; file contents are not uploaded or saved.</div><p>Challan amount: <strong>${money(r.challan.amount)}</strong></p><div class="field"><label for="receipt-file">Sample receipt file</label><input id="receipt-file" name="receipt" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required></div>${field('Sample bank reference', 'reference', 'text', '', 'required minlength="3" maxlength="100" placeholder="For example: DEMO-PAID-001"')}<p class="small muted">PDF, PNG or JPEG · up to 5 MB. Uploading a sample does not settle the challan.</p>`, 'Submit for Accounts review', `data-id="${h(r.id)}"`);
  }
  function showReceiptReview(r) {
    const c = r.challan;
    showForm('Review sample payment', 'review-receipt', `<div class="detail-grid">${detail('Student', student(r.studentId).name)}${detail('Challan amount', money(c.amount))}${detail('Submitted reference', c.receipt.reference)}${detail('Sample file', c.receipt.name)}</div><div class="notice warning">No bank connection exists in this demo. Enter the matching sample reference and full amount to simulate an independent Accounts check.</div>${select('Decision', 'decision', option('verify', 'Verify payment') + option('return', 'Return for correction'))}${field('Reference checked by Accounts', 'reference', 'text', '', 'maxlength="100"')}${field('Amount received (PKR)', 'receivedAmount', 'number', '', 'min="0" max="10000000" step="0.01"')}${textarea('Review note (required when returning)', 'note', '', 'maxlength="500"')}`, 'Save review decision', `data-id="${h(r.id)}"`);
  }
  function showObservation(className) {
    showForm('Add a class observation', 'observation', `${select('Assigned class', 'className', actor().classes.map(c => option(c, c, c === className)).join(''), 'required')}${textarea('Collective class observation', 'text', '', 'required minlength="10" maxlength="2000"')}<p class="small muted">Discuss class-wide learning and recommendations. Do not name or evaluate individual students.</p>`, 'Save observation');
  }
  function showDocument(r, kind) {
    const doc = r[kind];
    if (!doc || !['challan', 'certificate'].includes(kind)) throw new Error('This document has not been issued.');
    const s = student(r.studentId), cert = kind === 'certificate';
    const title = cert ? 'Clearance certificate' : 'Clearance challan';
    currentDocument = `<article class="print-document"><header class="document-header"><img src="assets/images/akims-mark.svg" alt=""><div><h2>AKIMS Campus</h2><p>Akbar Institute of Medical Sciences</p></div></header><p class="document-watermark">DEMONSTRATION — ${cert ? 'NOT AN OFFICIAL CERTIFICATE' : 'NOT VALID FOR PAYMENT'}</p><h1>${title}</h1><p class="mono">${h(doc.number)}</p><div class="document-meta"><p><strong>Student:</strong> ${h(cert ? doc.studentName : s.name)}</p><p><strong>Registration:</strong> ${h(cert ? doc.studentRoll : s.roll)}</p><p><strong>Program:</strong> ${h(cert ? doc.program : s.program)}</p><p><strong>Issued:</strong> ${date(doc.issuedAt)}</p><p><strong>Request:</strong> ${h(r.id)}</p></div>${cert ? `${doc.revokedAt ? '<div class="document-revoked"><strong>REVOKED · ' + date(doc.revokedAt) + '</strong><p>' + h(doc.reason) + '</p></div>' : '<p>This fictional record demonstrates completion of the required laboratory and central store clearance checks.</p>'}<p>All mandatory demo requirements were reviewed before this document was issued. This is not an official institutional attestation.</p><div class="signature-line">Authorized signature placeholder · not signed</div>` : `<table class="document-table"><thead><tr><th>Confirmed obligation</th><th>Amount</th></tr></thead><tbody>${r.issues.filter(i => ['charged', 'paid'].includes(i.resolution)).map(i => '<tr><td>' + h(i.description) + '</td><td>' + money(i.amount) + '</td></tr>').join('')}</tbody><tfoot><tr><th>Total</th><th>${money(doc.amount)}</th></tr></tfoot></table><p><strong>Bank:</strong> ${h(doc.bankName)}</p><p><strong>Account title:</strong> ${h(doc.accountTitle)}</p><p><strong>Account:</strong> ${h(doc.accountNumber)}</p><p><strong>Demo status:</strong> ${h(statusName(doc.status))}</p><p>Do not transfer money. Bank details are placeholders. Only confirmed laboratory, apparatus and store dues are represented.</p>`}<footer class="document-footer">Fictional browser-local demonstration · current status is recorded only in this browser.<br>This copy does not provide public verification or institutional authorization.</footer></article>`;
    printArea.innerHTML = currentDocument;
    showDialog(title, '<div class="document-preview">' + currentDocument + '</div>', button(icon('download') + ' Download HTML copy', 'download-document') + button('Print / Save PDF', 'print-document', '', 'primary'), true);
  }
  function download(name, content, type) {
    const blob = new Blob([content], { type }), url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csvCell(value) {
    let text = String(value == null ? '' : value);
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function csvDownload(name, headers, rows) { download(name, '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8'); }

  document.addEventListener('click', function (event) {
    const el = event.target.closest('button');
    if (!el) return;
    try {
      if (el.dataset.role) {
        actorId = el.dataset.role; page = 'dashboard'; selectedRequest = null; importDraft = null; render(); focusMain(); window.scrollTo(0, 0); return;
      }
      if (el.dataset.page) { navigate(el.dataset.page); return; }
      const action = el.dataset.action;
      if (!action) return;
      if (action === 'close-dialog') { closeDialog(); return; }
      if (action === 'menu' || action === 'close-menu') { toggleMenu(action === 'menu'); return; }
      if (action === 'switch-role') { actorId = ''; selectedRequest = null; render(); focusMain(); window.scrollTo(0, 0); return; }
      if (action === 'go') { navigate(el.dataset.target); return; }
      if (!actorId) return;
      const id = el.dataset.id;
      if (action === 'new-request') showNewRequest(el.dataset.student);
      else if (action === 'open-request') {
        const r = getRequest(id); selectedRequest = r.id; page = role() === 'student' ? 'clearance' : 'requests'; render(); focusMain();
      }
      else if (action === 'request-list') { selectedRequest = null; render(); focusMain(); }
      else if (action === 'add-issue') showIssue(getRequest(id), el.dataset.dept);
      else if (action === 'assess') {
        const r = getRequest(id), d = el.dataset.dept, status = el.dataset.status;
        showForm(status === 'cleared' ? 'Clear department' : 'Complete assessment', 'assess', `<div class="notice">${h(department(d).name)} · ${h(student(r.studentId).name)}</div>${textarea('Verification note', 'note', status === 'cleared' ? 'Reviewed: no outstanding department obligations.' : 'Department assessment completed.', 'required minlength="3" maxlength="500"')}`, status === 'cleared' ? 'Confirm department clearance' : 'Save assessment', `data-id="${h(id)}" data-dept="${d}" data-status="${status}"`);
      }
      else if (action === 'resolve-issue') showForm(el.dataset.resolution === 'waived' ? 'Authorize an issue waiver' : 'Record item return / resolution', 'resolve', textarea('Resolution reason', 'note', '', 'required minlength="5" maxlength="500"'), 'Confirm resolution', `data-id="${h(id)}" data-issue="${h(el.dataset.issue)}" data-resolution="${el.dataset.resolution}"`);
      else if (action === 'issue-challan') dispatch('issueChallan', { requestId: id }, 'Sample challan issued.');
      else if (action === 'receipt') showReceipt(getRequest(id));
      else if (action === 'review-receipt') showReceiptReview(getRequest(id));
      else if (action === 'finalize') showForm('Final clearance authorization', 'finalize', '<p>Confirm the mandatory checks are complete. The demonstration will block issuance if any issue or payment remains unresolved.</p><div class="notice">A certificate preserves the student identity at the moment it is issued.</div>', 'Authorize & issue certificate', `data-id="${h(id)}"`);
      else if (action === 'correction') showForm('Request a correction', 'correction', textarea('What needs correction?', 'note', '', 'required minlength="5" maxlength="500"'), 'Send correction request', `data-id="${h(id)}"`);
      else if (action === 'resubmit') showForm('Correct & resubmit', 'resubmit', '<div class="notice warning">' + h(getRequest(id).correctionNote) + '</div>' + textarea('Updated reason for clearance', 'purpose', getRequest(id).purpose, 'required minlength="3" maxlength="180"'), 'Resubmit request', `data-id="${h(id)}"`);
      else if (action === 'revoke') showForm('Revoke this certificate', 'revoke', '<div class="notice warning">The issued certificate remains in history with a revoked status. This cannot be undone in this demo; a new request may be created.</div>' + textarea('Reason for revocation', 'note', '', 'required minlength="5" maxlength="500"'), 'Confirm revocation', `data-id="${h(id)}"`);
      else if (action === 'document') showDocument(getRequest(id), el.dataset.kind);
      else if (action === 'print-document') window.print();
      else if (action === 'download-document') {
        const cleaned = currentDocument.replace(/<img[^>]*>/g, '');
        download('AKIMS-demo-document.html', '<!doctype html><html lang="en"><meta charset="UTF-8"><title>AKIMS demonstration document</title><style>body{max-width:780px;margin:40px auto;padding:24px;font:16px/1.6 Georgia,serif;color:#173f35}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #ccc;padding:12px}.document-watermark,.document-revoked{padding:12px;border:2px solid #a43b3b;color:#8c2323;font-weight:bold}.document-footer{margin-top:50px;font-size:12px}.signature-line{margin-top:45px;border-top:1px solid #aaa;padding-top:10px}@media print{body{margin:0}}</style><body>' + cleaned + '</body></html>', 'text/html;charset=utf-8');
      }
      else if (action === 'stock') {
        const item = visibleInventory().find(i => i.id === id);
        if (!item) throw new Error('This stock item is not assigned to your workspace.');
        showForm('Record stock movement', 'stock', `<div class="notice"><strong>${h(item.name)}</strong><p>Available: ${item.quantity} ${h(item.unit)}</p></div>${select('Movement', 'direction', option('in', 'Stock received (+)') + option('out', 'Stock issued (−)'))}${field('Quantity', 'quantity', 'number', '', 'required min="1" max="100000" step="1"')}${textarea('Reason / reference', 'reason', '', 'required minlength="3" maxlength="500"')}`, 'Save movement', `data-id="${id}"`);
      }
      else if (action === 'new-observation') showObservation(el.dataset.class);
      else if (action === 'announcements') showDialog('Campus announcements', announcements());
      else if (action === 'reset') showForm('Reset this demonstration?', 'reset', '<p>This removes the changes made in this browser and restores the original fictional records. Download an export first if you want to inspect your current data later.</p>', 'Reset demo records');
      else if (action === 'export-data') { if (role() !== 'admin') throw new Error('Full demo exports are available in Administration.'); download('AKIMS-demo-data.json', store.exportJSON(), 'application/json'); notice('Demo data exported. This file is for inspection; there is no backup restore screen.'); }
      else if (action === 'export-inventory') csvDownload('AKIMS-demo-inventory.csv', ['Item', 'Department', 'Category', 'Quantity', 'Unit', 'Reorder level'], visibleInventory().map(i => [i.name, department(i.departmentId).name, i.category, i.quantity, i.unit, i.reorderLevel]));
      else if (action === 'export-students' && role() === 'admin') csvDownload('AKIMS-demo-students.csv', ['roll', 'name', 'program', 'batch', 'email'], state.students.map(s => [s.roll, s.name, s.program, s.batch, s.email]));
      else if (action === 'export-clearance') csvDownload('AKIMS-demo-clearance.csv', ['Request', 'Student', 'Registration', 'Status', 'Challan amount', 'Payment status'], visibleRequests().filter(r => role() !== 'accounts' || r.challan).map(r => [r.id, student(r.studentId).name, student(r.studentId).roll, r.status, r.challan ? r.challan.amount : 0, r.challan ? r.challan.status : 'No challan']));
      else if (action === 'sample-csv') csvDownload('AKIMS-sample-import.csv', ['roll', 'name', 'program', 'batch', 'email'], [['DEMO-NEW-001', 'Sample Student', 'BSc Medical Laboratory Technology', '2026–2030', 'sample.student@example.invalid']]);
      else if (action === 'import-reset') { importDraft = null; render(); }
      else if (action === 'import-remap') { delete importDraft.preview; render(); }
      else if (action === 'import-errors') download('AKIMS-import-errors.txt', importDraft.preview.errors.join('\r\n'), 'text/plain;charset=utf-8');
      else if (action === 'import-commit') {
        if (role() !== 'admin' || !importDraft || !importDraft.preview || importDraft.preview.errors.length) throw new Error('Preview a valid import before confirming.');
        const count = importDraft.preview.rows.length;
        dispatch('importStudents', { rows: importDraft.preview.rows }, count + ' fictional student records imported.');
        importDraft = null; render();
      }
    } catch (error) {
      if (dialog.open) formError(dialog.querySelector('form') || dialog.querySelector('.modal-body'), error);
      else notice(error.message || 'The action could not be completed.');
    }
  });

  document.addEventListener('submit', async function (event) {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const name = form.dataset.form, id = form.dataset.id;
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      if (name === 'create-request') {
        const result = dispatch('createRequest', { studentId: role() === 'student' ? actor().studentId : values.studentId, purpose: values.purpose }, 'Clearance request submitted.');
        selectedRequest = result.requestId; page = role() === 'student' ? 'clearance' : 'requests'; render();
      }
      else if (name === 'add-issue') dispatch('addIssue', { requestId: id, departmentId: form.dataset.dept, description: values.description, amount: values.amount }, 'Department issue recorded.');
      else if (name === 'assess') dispatch('assessDepartment', { requestId: id, departmentId: form.dataset.dept, status: form.dataset.status, note: values.note }, 'Department verification updated.');
      else if (name === 'resolve') dispatch('resolveIssue', { requestId: id, issueId: form.dataset.issue, resolution: form.dataset.resolution, note: values.note }, 'Issue resolution recorded.');
      else if (name === 'receipt') {
        const file = values.receipt;
        if (!file || !file.size) throw new Error('Choose a nonempty sample receipt file.');
        if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) || !/\.(pdf|png|jpe?g)$/i.test(file.name)) throw new Error('Choose a PDF, PNG or JPEG sample file.');
        if (file.size > 5 * 1024 * 1024) throw new Error('The sample receipt must be 5 MB or smaller.');
        dispatch('submitReceipt', { requestId: id, name: file.name, size: file.size, type: file.type, reference: values.reference }, 'Sample receipt details sent to Accounts.');
      }
      else if (name === 'review-receipt') dispatch('reviewReceipt', { requestId: id, decision: values.decision, reference: values.reference, receivedAmount: values.receivedAmount, note: values.note }, values.decision === 'verify' ? 'Sample payment verified. Departments can now complete their checks.' : 'Receipt returned for correction.');
      else if (name === 'finalize') dispatch('finalize', { requestId: id }, 'Final authorization complete. Sample certificate issued.');
      else if (name === 'correction') dispatch('requestCorrection', { requestId: id, note: values.note }, 'Correction requested.');
      else if (name === 'resubmit') dispatch('resubmit', { requestId: id, purpose: values.purpose }, 'Corrected request resubmitted.');
      else if (name === 'revoke') dispatch('revokeCertificate', { requestId: id, note: values.note }, 'Certificate marked as revoked.');
      else if (name === 'stock') dispatch('stockMove', { itemId: id, direction: values.direction, quantity: values.quantity, reason: values.reason }, 'Stock movement recorded.');
      else if (name === 'observation') dispatch('saveObservation', { className: values.className, text: values.text }, 'Class observation saved.');
      else if (name === 'profile') dispatch('updateProfile', { email: values.email, phone: values.phone }, 'Your sample contact details were updated.');
      else if (name === 'reset') { store.reset(); importDraft = null; selectedRequest = null; closeDialog(); render(); notice('Original fictional records restored.'); }
      else if (name === 'import-file') {
        if (role() !== 'admin') throw new Error('Only Administration can import records.');
        const file = values.csv;
        if (!file || !file.size || !/\.csv$/i.test(file.name)) throw new Error('Choose a nonempty .csv file exported from Excel.');
        if (file.size > 1024 * 1024) throw new Error('Choose a CSV of 1 MB or smaller.');
        importDraft = { ...parseCSV(await file.text()), name: file.name }; render();
      }
      else if (name === 'import-map') {
        const indices = importFields.map(([key]) => Number(values[key]));
        if (new Set(indices).size !== indices.length) throw new Error('Map each field to a different source column.');
        const rows = importDraft.rows.map(row => Object.fromEntries(importFields.map(([key]) => [key, row[Number(values[key])].trim()])));
        const errors = [], rolls = new Set(state.students.map(s => s.roll.toLowerCase())), emails = new Set(state.students.map(s => s.email.toLowerCase()));
        rows.forEach((row, i) => {
          const line = i + 2;
          importFields.forEach(([key, label]) => { if (!row[key]) errors.push('Row ' + line + ': ' + label + ' is required.'); });
          if (row.roll.length > 60 || row.name.length > 120 || row.program.length > 160 || row.batch.length > 60 || row.email.length > 160) errors.push('Row ' + line + ': one or more fields are too long.');
          if (row.roll.length < 3 || row.name.length < 2 || row.program.length < 2 || row.batch.length < 2 || row.email.length < 5) errors.push('Row ' + line + ': registration needs 3 characters; name, program and batch need 2; email needs 5.');
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Row ' + line + ': email format is invalid.');
          if (rolls.has(row.roll.toLowerCase())) errors.push('Row ' + line + ': duplicate registration ' + row.roll + '.');
          if (emails.has(row.email.toLowerCase())) errors.push('Row ' + line + ': duplicate email ' + row.email + '.');
          rolls.add(row.roll.toLowerCase()); emails.add(row.email.toLowerCase());
        });
        importDraft.preview = { rows, errors }; render();
      }
    } catch (error) { formError(form, error); }
    finally { if (submit && submit.isConnected) submit.disabled = false; }
  });

  document.addEventListener('input', function (event) {
    if (!event.target.matches('[data-table-search]')) return;
    const search = event.target.value.trim().toLowerCase();
    let count = 0;
    document.querySelectorAll('tr[data-search]').forEach(row => { row.hidden = !row.dataset.search.includes(search); if (!row.hidden) count++; });
    const counter = document.getElementById('search-count');
    if (counter) counter.textContent = search ? count + ' matching records' : '';
  });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
  function navigate(target) {
    if (!canNavigate(target)) throw new Error('This page is not part of your workspace.');
    page = target; selectedRequest = null; render(); focusMain(); window.scrollTo(0, 0);
  }
  function focusMain() { const main = document.getElementById('main'); if (main) main.focus({ preventScroll: true }); }
  function toggleMenu(open) {
    const sidebar = document.getElementById('sidebar'), backdrop = document.querySelector('.mobile-backdrop'), toggle = document.querySelector('.menu-toggle');
    sidebar.classList.toggle('open', open); backdrop.hidden = !open; document.body.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open));
    if (open) sidebar.querySelector('button')?.focus(); else toggle.focus();
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.getElementById('sidebar')?.classList.contains('open')) toggleMenu(false); });
  render();
})();
