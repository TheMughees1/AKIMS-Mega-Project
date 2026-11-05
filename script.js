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
  let actorId = sessionRead() || safeRead('akims-demo-actor') || '';
  if (actors[actorId]?.localAccount && sessionRead() !== actorId) actorId = '';
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
  function heading(eyebrow, title, description, actions = '') { return `<div class="page-heading"><div><h1>${h(title)}</h1><p class="page-description">${h(description)}</p></div><div class="heading-actions">${actions}</div></div>`; }
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
    const previousMenu = document.getElementById('navigation-dialog');
    if (previousMenu?.open) previousMenu.close();
    document.body.classList.remove('menu-open');
    if (!actorId) { renderRolePicker(); return; }
    if (!canNavigate(page)) page = 'dashboard';
    safeWrite('akims-demo-actor', actors[actorId]?.localAccount ? '' : actorId); safeWrite('akims-demo-page', page);
    const nav = navigation[role()];
    const label = nav.find(n => n[0] === page)[1];
    app.innerHTML = `<div class="shell">
      <aside class="sidebar" id="sidebar" aria-label="Workspace navigation">
        <div class="sidebar-brand"><img class="brand-mark" src="assets/images/akims-logo.png" alt="AKIMS Bahawalpur logo"><div><strong>AKIMS<span class="brand-dot">.</span></strong><span>Bahawalpur · Campus portal</span></div></div>
        <p class="portal-label">${h(portalTitles[role()])}</p>
        <nav class="nav-list" aria-label="${h(portalTitles[role()])}">${nav.map(n => `<button type="button" class="nav-item ${page === n[0] ? 'active' : ''}" data-page="${n[0]}" ${page === n[0] ? 'aria-current="page"' : ''}>${icon(n[2])}<span>${n[1]}</span></button>`).join('')}</nav>
        <div class="sidebar-footer"><div class="callout"><span class="eyebrow">Need a hand?</span><p>Open Help &amp; demo guide for the clearance steps.</p><span class="small muted">Akbar Institute of Medical Sciences</span></div>${role() === 'admin' ? '<button class="link-button" data-action="export-data">' + icon('download') + ' Export demo data</button>' : ''}<button class="link-button" data-action="reset">Reset demo</button><span class="small muted">Offline demonstration · v1.0</span></div>
      </aside>
      <dialog id="navigation-dialog" class="navigation-dialog" aria-label="Workspace navigation"><button type="button" class="icon-btn drawer-close" data-action="close-menu" aria-label="Close navigation">${icon('close')}</button></dialog>
      <div class="workspace">
        <header class="topbar"><div class="flex gap"><button class="icon-btn menu-toggle" data-action="menu" aria-label="Open navigation" aria-expanded="false" aria-controls="navigation-dialog">${icon('menu')}</button><div class="breadcrumb">${h(portalTitles[role()])}<span>/</span><strong>${h(label)}</strong></div></div><div class="topbar-actions"><button class="icon-btn" data-action="announcements" aria-label="Campus announcements">${icon('bell')}</button><span class="avatar" aria-hidden="true">${h(initials(actor().name))}</span><div class="user-meta"><strong>${h(actor().name)}</strong><span>${h(actor().title)}</span></div><button class="btn ghost small" data-action="switch-role">${actor()?.localAccount ? 'Sign out' : 'Switch demo role'}</button></div></header>
        <div class="demo-banner"><span class="pill">DEMO</span><span>Fictional records · changes stay in this browser · no real payments</span></div>
        <main id="main" class="content" tabindex="-1">${store.persistenceAvailable ? '' : `<div class="notice warning" role="alert">${h(store.persistenceWarning || 'Browser storage is unavailable. Changes will last only while this page is open.')}</div>`}${renderPage()}</main>
        <footer class="workspace-footer"><span>AKIMS Campus</span><span>Designed around your academic journey.</span><span>Demonstration edition</span></footer>
      </div></div>`;
    document.title = label + ' · AKIMS Campus Demo';
    if(page === 'documents' && ['student','alumni'].includes(role())) refreshUploads();
    const menu = document.getElementById('navigation-dialog');
    menu.addEventListener('cancel', event => { event.preventDefault(); toggleMenu(false); });
    menu.addEventListener('click', event => {
      const bounds = menu.getBoundingClientRect();
      if (event.target === menu && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) toggleMenu(false);
    });
  }

  let accessMode = 'signin';
  let entryMotionPlayed = false;
  let uploadFiles = [], uploadError = '', uploadLoading = false, uploadTicket = 0;
  let previewURL;
  function sessionRead() { try { return sessionStorage.getItem('akims-local-session') || ''; } catch (_) { return ''; } }
  function setSession(value) { try { if(value) sessionStorage.setItem('akims-local-session', value); else sessionStorage.removeItem('akims-local-session'); } catch (_) {} }
  function accessForm() {
    const signup = accessMode === 'signup';
    return `<div class="access-tabs" aria-label="Account access">${button('Sign in', 'access-signin', `aria-pressed="${!signup}"`)}${button('Create account', 'access-signup', `aria-pressed="${signup}"`)}</div><h2>${signup ? 'Your student account' : 'Welcome back'}</h2><p class="muted">${signup ? 'Create a local student profile to try clearance and document services.' : 'Continue to your clearance, documents and college records.'}</p><form data-form="${signup ? 'local-signup' : 'local-signin'}" class="access-form">${signup ? `<div class="form-grid">${field('Full name', 'name', 'text', '', 'required minlength="2" maxlength="120" autocomplete="name"')}${field('Registration number', 'roll', 'text', '', 'required minlength="3" maxlength="60" placeholder="DEMO-2026-001"')}</div>` : ''}${field('Email address', 'email', 'email', '', 'required maxlength="160" autocomplete="username"')}${signup ? `<div class="form-grid">${select('Program', 'program', option('Pharm-D','Pharm-D')+option('B-Category','B-Category'))}${field('Batch / session', 'batch', 'text', '', 'required minlength="2" maxlength="60" placeholder="2026–2031"')}</div>` : ''}<div class="password-field">${field('Demo password', 'password', 'password', '', `required minlength="10" maxlength="128" autocomplete="${signup ? 'new-password' : 'current-password'}" aria-describedby="password-help"`)}<button type="button" class="link-button" data-action="toggle-password" aria-pressed="false">Show password</button></div><p id="password-help" class="small muted">Use a made-up password, at least 10 characters. Do not reuse a real password.</p>${signup ? field('Confirm demo password', 'confirm', 'password', '', 'required minlength="10" maxlength="128" autocomplete="new-password"')+'<label class="consent"><input name="consent" type="checkbox" required> I am using fictional details and sample documents in this local demo.</label>' : '<button type="button" class="link-button" data-action="account-help">Trouble signing in?</button>'}<p class="form-error" role="alert"></p><button class="btn primary full-width" type="submit">${signup ? 'Create student account' : 'Sign in'}</button></form><p class="local-disclosure">Local demonstration. Accounts and files stay in this browser; they are not submitted to AKIMS.</p>`;
  }
  function renderRolePicker() {
    clearTimeout(toastTimer); safeWrite('akims-demo-actor', '');
    document.getElementById('toast').textContent = '';
    document.getElementById('toast').classList.remove('visible');
    app.innerHTML = `<main id="main" class="access-page ${entryMotionPlayed ? '' : 'has-intro-motion'}" tabindex="-1"><header class="access-header"><a class="college-identity" href="https://akims.edu.pk/" target="_blank" rel="noopener noreferrer"><img src="assets/images/akims-logo.png" alt="AKIMS crest"><span><strong>Akbar Institute of<br>Medical Sciences</strong><small>Bahawalpur</small></span></a><a class="college-website" href="https://akims.edu.pk/" target="_blank" rel="noopener noreferrer">College website ${icon('arrow')}</a></header><div class="access-layout"><section class="campus-intro"><h1 class="kinetic-title"><span class="kinetic-line"><span>Clearance.</span></span> <span class="kinetic-line"><span>Documents.</span></span> <span class="kinetic-line"><span>Made simple.</span></span></h1><p>Apply, keep your documents together and follow every department. Your next step starts here.</p><figure class="campus-cover"><img src="assets/images/akims-campus.jpeg" alt="Entrance to Akbar Institute of Medical Sciences Bahawalpur" width="1200" height="900" decoding="async" fetchpriority="high"><figcaption><span>Akbar Institute of Medical Sciences</span><span>University Road, Bahawalpur</span></figcaption></figure><div class="campus-contact-line"><span>Student services</span><a href="tel:0623086356">062-3086356</a><a href="mailto:aimsbahawalpur22@gmail.com">Contact the college</a></div></section><section class="access-desk" aria-label="Student account access">${accessForm()}</section></div><section class="campus-journal" aria-label="Life at AKIMS"><div><h2>Inside our campus</h2><p>Spaces, people and everyday learning at AKIMS.</p><a href="https://akims.edu.pk/institute-life.html" target="_blank" rel="noopener noreferrer">Explore college life</a></div>${campusPhotos()}</section><details class="demo-workspaces" open><summary>Explore demonstration workspaces <span>For trying the complete workflow</span></summary><div class="demo-role-list">${['student','admin','staff','accounts','teacher','alumni'].map(id=>`<button type="button" data-role="${id}">${icon(roleIcons[id])}<span>${portalTitles[id]}<small>Sample workspace</small></span>${icon('arrow')}</button>`).join('')}</div><p class="small muted">These role previews bypass sign-in for testing. They are not access controls for a live college system.</p></details><footer class="access-footer"><span>AKIMS Campus portal</span><span>Offline demonstration · Official college photography</span></footer></main>`;
    entryMotionPlayed = true;
    document.title = 'Student access · AKIMS Campus';
  }
  function campusPhotos() {
    return [['akims-learning.jpg','Teaching laboratory'],['akims-laboratory.jpg','Anatomy laboratory'],['akims-community.jpg','Practical learning'],['akims-academic.jpg','Computer laboratory']].map(([src,caption])=>`<figure><img src="assets/images/${src}" alt="${caption}" width="800" height="600" loading="lazy" decoding="async"><figcaption>${caption}</figcaption></figure>`).join('');
  }
  function uploadDesk() {
    if (uploadLoading) return '<p role="status">Opening your document folder…</p>';
    if (uploadError) return `<div class="notice warning" role="alert">${h(uploadError)}</div>`;
    return `<div class="document-desk"><div class="upload-intro"><h2>Personal documents</h2><p>Add sample student cards, academic records or receipts. Files stay in this browser and are not sent to the college.</p>${button(icon('upload')+' Add a document','upload-file','','primary')}<span class="small muted">PDF, JPG or PNG · 5 MB per file</span><span class="small muted">${uploadFiles.length} of 10 files · ${(uploadFiles.reduce((n,f)=>n+f.size,0)/1024/1024).toFixed(1)} of 25 MB</span></div><div>${uploadFiles.length ? `<ul class="file-list">${uploadFiles.map(f=>`<li><span class="file-symbol">${icon(f.type.startsWith('image/')?'image':'document')}</span><div><strong>${h(f.name)}</strong><span>${h(f.category)} · ${Math.max(1,Math.round(f.size/1024))} KB · ${date(f.createdAt)}</span><span class="small muted">Saved locally · not reviewed</span></div><div class="file-actions">${button(f.type.startsWith('image/')?'Preview':'Details','preview-file',`data-id="${h(f.id)}"`,'ghost small')}${button('Download','download-file',`data-id="${h(f.id)}"`,'ghost small')}${button('Remove','remove-file',`data-id="${h(f.id)}"`,'ghost small')}</div></li>`).join('')}</ul>` : '<div class="document-empty">'+icon('document')+'<h3>Your document folder is ready</h3><p>Add your first sample file. You can preview, download or remove it here.</p></div>'}</div></div>`;
  }
  async function refreshUploads() {
    const ticket = ++uploadTicket, owner = actor()?.studentId;
    uploadLoading = true; uploadError = ''; const host = document.getElementById('upload-desk'); if(host) host.innerHTML = uploadDesk();
    let files = [], failure = '';
    try { files = await AKIMSPortal.list(owner); } catch(error) { failure = error.message; }
    if(ticket !== uploadTicket || actor()?.studentId !== owner) return;
    uploadFiles = files; uploadError = failure; uploadLoading = false; const current = document.getElementById('upload-desk'); if(current) current.innerHTML = uploadDesk();
  }
  function ownedFile(id) {const file = uploadFiles.find(f=>f.id===id && f.owner===actor()?.studentId); if(!file) throw new Error('This document is not available in your workspace.'); return file;}

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
  function clearanceStatus(request) {
    const requirements = request ? request.requirements : state.departments.map(d => ({departmentId: d.id, status: 'pending'}));
    const completed = requirements.filter(r => r.status === 'cleared').length;
    return `<section class="status-panel clearance-status" aria-labelledby="clearance-status-title"><div class="status-heading"><h2 id="clearance-status-title">Department clearance</h2>${request ? badge(request.status) : '<span class="badge neutral">Not applied</span>'}</div><ul class="verification-list">${requirements.map(item => `<li><span class="verification-icon ${item.status === 'cleared' ? 'is-complete' : ''}">${icon(item.status === 'cleared' ? 'check' : 'clipboard')}</span><span>${h(department(item.departmentId).name)}</span>${request ? badge(item.status) : '<span class="small muted">Not started</span>'}</li>`).join('')}</ul><div class="verification-total"><strong>${completed} of ${requirements.length} cleared</strong><span class="small muted">Final authorization follows all checks.</span></div></section>`;
  }
  function studentDashboard() {
    const s = student(actor().studentId), r = latestOwnRequest();
    return heading('', 'Hello, ' + s.name.split(' ')[0] + '.', 'Your student services desk. Pick up where you left off.', button('My profile','go','data-target="profile"')) +
      `<div class="student-hub"><section class="clearance-desk"><div class="desk-title"><span>${icon('clipboard')} Student clearance</span>${r ? badge(r.status) : '<span class="badge neutral">Not started</span>'}</div><h2>From application<br>to final clearance.</h2><p>Apply, follow your department checks and resolve any confirmed dues. Your next action is always shown here.</p><div class="desk-next">${r ? nextStep(r) : `<h3>Ready to begin?</h3><p>Check your student profile, then send your first request.</p>${button('Apply for clearance','new-request','','primary')}`}</div><div class="desk-foot">${icon('help')} Need assistance? Open Help &amp; demo guide.</div></section><div class="student-side">${clearanceStatus(r)}<section class="student-record"><span class="small muted">Your academic record${s.selfDeclared ? ' · self-declared' : ''}</span><h2>${h(s.name)}</h2><p>${h(s.roll)}</p><div>${detail('Program',s.program)}${detail('Batch',s.batch)}</div></section></div></div><div class="student-services"><button data-action="go" data-target="documents">${icon('document')}<span><strong>My documents</strong><small>Add sample files and collect issued documents</small></span>${icon('arrow')}</button><button data-action="go" data-target="clearance">${icon('clock')}<span><strong>Clearance history</strong><small>Follow applications, payments and decisions</small></span>${icon('arrow')}</button></div><div class="student-news"><section><h2>From the student desk</h2>${announcements(2)}</section><figure><img src="assets/images/akims-campus-life.jpeg" alt="Students attending a session at AKIMS" loading="lazy"><figcaption>Learning together at AKIMS, Bahawalpur.</figcaption></figure></div>`;
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
    return heading('Administration', 'Clearance and campus records', 'Coordinate the work that moves every student forward.', button(icon('plus') + ' Start a request', 'new-request', '', 'primary')) +
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
    return heading('Accounts desk', 'Payment review', 'Review sample references independently before settling a challan.', button('Review receipts', 'go', 'data-target="payments"', 'primary')) +
      `<div class="stats-strip">${stat('Receipts to review', pending.length, 'Awaiting your verification')}${stat('Verified collections', money(paid.reduce((n, r) => n + r.challan.amount, 0)), 'Demonstration totals')}${stat('Unsettled challans', due.length, 'Unpaid or awaiting review')}</div><div class="two-column"><div>${panel('Payment review queue', paymentTable(pending))}</div><div>${panel('A deliberate check', '<div class="stack"><span class="action-icon">' + icon('wallet') + '</span><h3>Receipt submission is one step.</h3><p>In a live system, Accounts checks the actual bank record. Here, enter the sample reference and full amount to simulate that independent check.</p><div class="notice warning">This demo does not connect to a bank or process money. Never make a payment using a sample challan.</div></div>')}</div></div>`;
  }
  function teacherDashboard() {
    return heading('Faculty workspace', 'Your classes and observations', 'A space for class-level observations, shared progress and thoughtful follow-up.', button(icon('plus') + ' Add class observation', 'new-observation', '', 'primary')) +
      `<div class="two-column"><div>${panel('Your teaching assignments', classCards())}${panel('Recent class observations', observationList(3))}</div><div>${panel('Collective, constructive feedback', '<span class="eyebrow">Academic practice</span><h3>See the class as a whole.</h3><p>Record shared learning needs, laboratory readiness and suggestions for your assigned classes. Avoid individual student evaluations or sensitive personal details.</p>')}${panel('Surveys, thoughtfully introduced', '<p>Anonymous student surveys are planned for a later release, after the college approves response thresholds, confidentiality and access rules.</p><span class="badge neutral">Planned · not active</span>')}</div></div>`;
  }
  function alumniDashboard() {
    const s = student(actor().studentId);
    return heading('The AKIMS alumni community', 'Your alumni records', 'Keep your connection to campus and your academic documents close.', button('Update my details', 'go', 'data-target="profile"', 'primary')) +
      `<section class="welcome-panel"><div class="welcome-copy"><span class="eyebrow">Welcome back, ${h(s.name.split(' ')[0])}</span><h2>Your journey continues.</h2><p>${h(s.program)} · Class of ${h(s.batch.split('–').pop())}</p>${button('Open my documents ' + icon('arrow'), 'go', 'data-target="documents"', 'primary')}</div><img class="hero-art" src="assets/images/akims-campus.jpeg" alt="AKIMS campus building"></section><div class="two-column"><div>${panel('Your document history', documentList())}</div><div>${panel('Stay connected', '<p>Your own contact details can be updated in this demonstration. A public alumni directory and messaging service are not enabled.</p>')}${panel('Campus notices', announcements(1))}</div></div>`;
  }

  function requestTable(requests) {
    if (!requests.length) return empty('No clearance applications', 'Applications appear here after a student or authorized staff member submits one.', ['admin', 'staff'].includes(role()) ? button('Start a request', 'new-request', '', 'primary') : '');
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

  function documentsPage() { return heading('Your academic records', 'My documents', 'Your personal files and issued clearance documents, in one place.') + '<section id="upload-desk">'+uploadDesk()+'</section>' + panel('Issued clearance documents', documentList()); }
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
    return `<div class="class-list">${actor().classes.map((name, n) => `<article class="class-card"><h3>${h(name)}</h3><p>Medical Laboratory Technology</p><div class="flex gap"><span class="badge info">${state.observations.filter(o => o.className === name).length} observations</span>${button('Add observation', 'new-observation', `data-class="${h(name)}"`, 'secondary small')}</div></article>`).join('')}</div>`;
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
  function collegeContact() {
    return panel('AKIMS Bahawalpur', `<div class="institute-contact"><p><strong>Akbar Institute of Medical Sciences</strong><br>University Road (Hasilpur Road), Near Japan Town, Bahawalpur</p><p><a href="mailto:aimsbahawalpur22@gmail.com">aimsbahawalpur22@gmail.com</a></p><p><a href="tel:0623086356">062-3086356</a><br><a href="tel:03047753009">0304-7753009</a><br><a href="tel:03256865400">0325-6865400</a></p><p>Programs listed on the college website: <strong>Pharm-D</strong> and <strong>B-Category</strong>.</p><p><a href="https://akims.edu.pk/" target="_blank" rel="noopener noreferrer">Official college website ↗</a></p><p class="small muted">Public contact details retrieved 5 November 2026. This local demo does not send applications to the college; its academic records remain fictional examples.</p></div>`) + panel('Life at AKIMS', '<img class="campus-photo" src="assets/images/akims-campus-life.jpeg" alt="Students attending a session at AKIMS" loading="lazy"><p class="small muted">Campus photograph from the college website.</p>');
  }
  function helpPage() {
    return heading('A little guidance', 'Explore the demo', 'Everything you need to try the workflow in one browser.') +
      `<div class="two-column"><div>${panel('Try the complete clearance journey', walkthrough())}${panel('A zero-dues shortcut', '<p>Apply as Student, switch to Administration, clear all three departments and give final authorization. A zero-dues request does not need a challan or receipt.</p>')}</div><div>${panel('What this demonstration saves', '<p>Fictional records and workflow changes are stored in this browser when local storage is available. Other devices and browsers do not share them. Clearing browser data may remove them.</p><p>Receipt submissions retain file details only. The original file is not uploaded or stored.</p>')}${collegeContact()}${panel('Before real college use', '<p>The role switcher is not authentication. Real shared records need a secure server, database, institution-approved policies and access controls. Do not enter real student information, passwords or bank details here.</p><p>Full LMS lessons, assignments and surveys are later modules; they are not implemented in this demo.</p>')}${panel('Start again', '<p>Reset restores the fictional sample records and removes the changes made in this browser.</p>' + button('Reset demonstration', 'reset', '', 'danger'))}</div></div>`;
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
    dialog.setAttribute('role', 'dialog');
    dialog.removeAttribute('aria-describedby');
    dialog.classList.toggle('wide', wide);
    dialog.innerHTML = `<div class="modal-header"><h2 id="dialog-title">${h(title)}</h2><button class="icon-btn" type="button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><div class="modal-body">${content}</div>${footer ? '<div class="modal-footer">' + footer + '</div>' : ''}`;
    if (!dialog.open) dialog.showModal();
  }
  function closeDialog() { if(previewURL) {URL.revokeObjectURL(previewURL); previewURL = null;} dialog.close(); if (dialogReturnFocus && dialogReturnFocus.isConnected) dialogReturnFocus.focus(); }
  function showForm(title, name, body, submitLabel, attrs = '') {
    showDialog(title, `<form data-form="${name}" ${attrs}><div class="stack">${body}<p class="form-error" role="alert"></p><div class="form-actions">${button('Cancel', 'close-dialog')}<button type="submit" class="btn primary">${h(submitLabel)}</button></div></div></form>`);
    if (['reset', 'revoke', 'finalize', 'remove-file'].includes(name)) {
      dialog.setAttribute('role', 'alertdialog');
      const description = dialog.querySelector('.modal-body p');
      if (description) { description.id = 'dialog-description'; dialog.setAttribute('aria-describedby', description.id); }
      dialog.querySelector('.form-actions [data-action="close-dialog"]').focus();
    }
  }
  function showActionError(message) {
    document.querySelector('.action-error')?.remove();
    const main = document.getElementById('main');
    main.insertAdjacentHTML('afterbegin', `<div class="notice warning action-error" role="alert" tabindex="-1"><strong>Action needs attention</strong><p>${h(message)}</p>${button('Dismiss message', 'dismiss-error', '', 'secondary small')}</div>`);
    main.querySelector('.action-error').focus();
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
  function clearFieldError(field) {
    field.removeAttribute('aria-invalid');
    const descriptions = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id && !id.startsWith('error-'));
    if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
    else field.removeAttribute('aria-describedby');
  }
  function formError(form, error) {
    let node = form.querySelector('.form-error');
    if (!node) { node = document.createElement('p'); node.className = 'form-error'; node.setAttribute('role', 'alert'); form.appendChild(node); }
    node.textContent = error.message || String(error);
    node.id = 'error-' + (form.dataset.form || 'action');
    form.setAttribute('aria-describedby', node.id);
    const fields = Array.from(form.querySelectorAll('input, select, textarea'));
    fields.forEach(clearFieldError);
    const message = node.textContent.toLowerCase();
    const candidates = /reference/.test(message) ? ['reference'] : /amount|payment.*total/.test(message) ? ['receivedAmount', 'amount'] : /confirm password/.test(message) ? ['confirm'] : /password/.test(message) ? ['password'] : /registration/.test(message) ? ['roll'] : /email/.test(message) ? ['email'] : /phone/.test(message) ? ['phone'] : /stock|quantity/.test(message) ? ['quantity'] : /purpose|reason for clearance/.test(message) ? ['purpose'] : /description/.test(message) ? ['description'] : /reason|note/.test(message) ? ['note', 'reason'] : /csv|file/.test(message) ? ['csv', 'receipt', 'document'] : [];
    const field = fields.find(field => candidates.includes(field.name));
    if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), node.id].filter(Boolean).join(' ')); }
    node.setAttribute('tabindex', '-1');
    (field || node).focus();
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
    showForm('Submit a sample receipt', 'receipt', `<div class="notice warning">Demonstration only. Choose a sample file. Only its name, type and size are recorded; file contents are not uploaded or saved.</div><p>Challan amount: <strong>${money(r.challan.amount)}</strong></p><div class="field"><label for="receipt-file">Sample receipt file</label><input id="receipt-file" name="receipt" type="file" aria-describedby="receipt-help" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required></div>${field('Sample bank reference', 'reference', 'text', '', 'required minlength="3" maxlength="100" placeholder="For example: DEMO-PAID-001"')}<p class="small muted" id="receipt-help">PDF, PNG or JPEG · up to 5 MB. Uploading a sample does not settle the challan.</p>`, 'Submit for Accounts review', `data-id="${h(r.id)}"`);
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
    currentDocument = `<article class="print-document"><header class="document-header"><img src="assets/images/akims-logo.png" alt=""><div><h2>AKIMS Campus</h2><p>Akbar Institute of Medical Sciences</p></div></header><p class="document-watermark">DEMONSTRATION — ${cert ? 'NOT AN OFFICIAL CERTIFICATE' : 'NOT VALID FOR PAYMENT'}</p><h1>${title}</h1><p class="mono">${h(doc.number)}</p><div class="document-meta"><p><strong>Student:</strong> ${h(cert ? doc.studentName : s.name)}</p><p><strong>Registration:</strong> ${h(cert ? doc.studentRoll : s.roll)}</p><p><strong>Program:</strong> ${h(cert ? doc.program : s.program)}</p><p><strong>Issued:</strong> ${date(doc.issuedAt)}</p><p><strong>Request:</strong> ${h(r.id)}</p></div>${cert ? `${doc.revokedAt ? '<div class="document-revoked"><strong>REVOKED · ' + date(doc.revokedAt) + '</strong><p>' + h(doc.reason) + '</p></div>' : '<p>This fictional record demonstrates completion of the required laboratory and central store clearance checks.</p>'}<p>All mandatory demo requirements were reviewed before this document was issued. This is not an official institutional attestation.</p><div class="signature-line">Authorized signature placeholder · not signed</div>` : `<table class="document-table"><thead><tr><th>Confirmed obligation</th><th>Amount</th></tr></thead><tbody>${r.issues.filter(i => ['charged', 'paid'].includes(i.resolution)).map(i => '<tr><td>' + h(i.description) + '</td><td>' + money(i.amount) + '</td></tr>').join('')}</tbody><tfoot><tr><th>Total</th><th>${money(doc.amount)}</th></tr></tfoot></table><p><strong>Bank:</strong> ${h(doc.bankName)}</p><p><strong>Account title:</strong> ${h(doc.accountTitle)}</p><p><strong>Account:</strong> ${h(doc.accountNumber)}</p><p><strong>Demo status:</strong> ${h(statusName(doc.status))}</p><p>Do not transfer money. Bank details are placeholders. Only confirmed laboratory, apparatus and store dues are represented.</p>`}<footer class="document-footer">Fictional browser-local demonstration · current status is recorded only in this browser.<br>This copy does not provide public verification or institutional authorization.</footer></article>`;
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

  document.addEventListener('click', async function (event) {
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
      if (document.getElementById('navigation-dialog')?.open) toggleMenu(false);
      if (action === 'dismiss-error') { el.closest('.action-error').remove(); focusMain(); return; }
      if (action === 'switch-role') { setSession(''); actorId = ''; accessMode = 'signin'; selectedRequest = null; render(); focusMain(); window.scrollTo(0, 0); return; }
      if (action === 'go') { navigate(el.dataset.target); return; }
      if (action === 'access-signin' || action === 'access-signup') { accessMode = action === 'access-signup' ? 'signup' : 'signin'; renderRolePicker(); document.querySelector('.access-desk h2').setAttribute('tabindex','-1'); document.querySelector('.access-desk h2').focus(); return; }
      if (action === 'toggle-password') {const input = document.querySelector('[name="password"]'); input.type = input.type === 'password' ? 'text' : 'password'; el.textContent = input.type === 'text' ? 'Hide password' : 'Show password'; el.setAttribute('aria-pressed',input.type === 'text'); return;}
      if (action === 'account-help') {showDialog('Local account help', '<p>Use the email and demo password you created in this browser. Accounts do not sync between browsers or computers. Your sign-in email stays the same if you edit your profile contact email.</p><p>This offline edition cannot send reset emails. You can create another fictional account with a different registration and email, or use a sample workspace below.</p>'); return;}
      if (!actorId) return;
      const id = el.dataset.id;
      if (action === 'upload-file') showForm('Add a sample document', 'upload-file', select('Document category','category',['Student card','Academic document','Payment receipt','Other document'].map(x=>option(x,x)).join(''))+'<div class="field"><label for="sample-document">Sample file</label><input id="sample-document" name="document" type="file" accept=".pdf,.jpg,.jpeg,.png" required aria-describedby="upload-help"><p id="upload-help" class="small muted">PDF, JPEG or PNG, up to 5 MB. Use sample files only. Saving a receipt here does not verify payment.</p></div>', 'Save to my documents');
      else if (action === 'preview-file') {const f = ownedFile(id); if(previewURL) URL.revokeObjectURL(previewURL); previewURL = URL.createObjectURL(f.blob); showDialog(f.name, (f.type.startsWith('image/') ? `<img class="file-preview" src="${previewURL}" alt="Preview of ${h(f.name)}">` : '<p>Download this PDF to view it in your PDF reader.</p>')+`<p>${h(f.category)} · ${Math.ceil(f.size/1024)} KB · Saved ${date(f.createdAt)}</p>`,button('Download file','download-file',`data-id="${h(f.id)}"`));}
      else if (action === 'download-file') {const f = ownedFile(id); download(f.name,f.blob,f.type);}
      else if (action === 'remove-file') {const f = ownedFile(id); showForm('Remove this document?', 'remove-file', `<p>This permanently removes ${h(f.name)} from this browser. Download a copy first if needed.</p>`, 'Remove document', `data-id="${h(id)}"`);}
      else if (action === 'new-request') showNewRequest(el.dataset.student);
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
        const cleaned = currentDocument.replace('assets/images/akims-logo.png', 'data:image/png;base64,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');
        download('AKIMS-demo-document.html', '<!doctype html><html lang="en"><meta charset="UTF-8"><title>AKIMS demonstration document</title><style>body{max-width:780px;margin:40px auto;padding:24px;font:16px/1.6 Georgia,serif;color:#064e3b}.document-header{display:flex;align-items:center;gap:16px}.document-header img{width:64px;height:64px;object-fit:contain}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #ccc;padding:12px}.document-watermark,.document-revoked{padding:12px;border:2px solid #a43b3b;color:#8c2323;font-weight:bold}.document-footer{margin-top:50px;font-size:12px}.signature-line{margin-top:45px;border-top:1px solid #aaa;padding-top:10px}@media print{body{margin:0}}</style><body>' + cleaned + '</body></html>', 'text/html;charset=utf-8');
      }
      else if (action === 'stock') {
        const item = visibleInventory().find(i => i.id === id);
        if (!item) throw new Error('This stock item is not assigned to your workspace.');
        showForm('Record stock movement', 'stock', `<div class="notice"><strong>${h(item.name)}</strong><p>Available: ${item.quantity} ${h(item.unit)}</p></div>${select('Movement', 'direction', option('in', 'Stock received (+)') + option('out', 'Stock issued (−)'))}${field('Quantity', 'quantity', 'number', '', 'required min="1" max="100000" step="1"')}${textarea('Reason / reference', 'reason', '', 'required minlength="3" maxlength="500"')}`, 'Save movement', `data-id="${id}"`);
      }
      else if (action === 'new-observation') showObservation(el.dataset.class);
      else if (action === 'announcements') showDialog('Campus announcements', announcements());
      else if (action === 'reset') showForm('Reset this demonstration?', 'reset', '<p>This removes all local accounts, uploaded files and workflow changes in this browser, and restores the original fictional records. Download an export first if you want to inspect your current data later.</p>', 'Reset demo records');
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
      else showActionError(error.message || 'The action could not be completed.');
    }
  });

  document.addEventListener('submit', async function (event) {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const name = form.dataset.form, id = form.dataset.id;
    const submit = form.querySelector('button[type="submit"]');
    const submitLabel = submit?.textContent;
    form.setAttribute('aria-busy', 'true');
    if (submit) { submit.disabled = true; if(name.startsWith('local-') || name === 'upload-file') submit.textContent = 'Please wait…'; }
    try {
      if (name === 'local-signup') {
        if(values.password !== values.confirm) throw new Error('Confirm password must match your demo password.');
        if(!values.consent) throw new Error('Confirm that you are using sample information.');
        const credentials = await AKIMSPortal.credentials(values.password);
        actorId = store.registerLocal({...values,...credentials}); setSession(actorId); page = 'dashboard'; render(); focusMain(); notice('Local student account created. Enrollment is not verified.');
      }
      else if(name === 'local-signin') {
        const account = (store.getState().localAccounts || []).find(a=>a.email === values.email.trim().toLowerCase());
        if(!account || await AKIMSPortal.verifier(values.password,account.salt) !== account.hash) throw new Error('Email or demo password is incorrect for this browser.');
        actorId = account.id; setSession(actorId); page = 'dashboard'; render(); focusMain();
      }
      else if(name === 'upload-file') {if(!['student','alumni'].includes(role())) throw new Error('Choose your student workspace first.'); await AKIMSPortal.add(actor().studentId,values.category,values.document); closeDialog(); await refreshUploads(); notice('Document saved in this browser.');}
      else if(name === 'remove-file') {const f = ownedFile(id); await AKIMSPortal.remove(actor().studentId,f.id); closeDialog(); await refreshUploads(); notice('Document removed.');}
      else if (name === 'create-request') {
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
      else if (name === 'reset') { await AKIMSPortal.clear(); const wasLocal = actor()?.localAccount; store.reset(); for(const key of Object.keys(actors)) if(actors[key].localAccount) delete actors[key]; setSession(''); if(wasLocal) actorId=''; importDraft = null; selectedRequest = null; closeDialog(); render(); notice('Original fictional records restored.'); }
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
    finally { form.removeAttribute('aria-busy'); if (submit && submit.isConnected) { submit.disabled = false; submit.textContent = submitLabel; } }
  });

  document.addEventListener('input', function (event) {
    if (event.target.matches('[aria-invalid="true"]')) clearFieldError(event.target);
    if (!event.target.matches('[data-table-search]')) return;
    const search = event.target.value.trim().toLowerCase();
    let count = 0;
    document.querySelectorAll('tr[data-search]').forEach(row => { row.hidden = !row.dataset.search.includes(search); if (!row.hidden) count++; });
    const counter = document.getElementById('search-count');
    if (counter) counter.textContent = search ? count + ' matching records' : '';
  });
  dialog.addEventListener('close', () => { if(!dialog.open && previewURL) {URL.revokeObjectURL(previewURL); previewURL = null;} });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
  function navigate(target) {
    if (!canNavigate(target)) throw new Error('This page is not part of your workspace.');
    page = target; selectedRequest = null; render(); focusMain(); window.scrollTo(0, 0);
  }
  function focusMain() { const main = document.getElementById('main'); if (main) main.focus({ preventScroll: true }); }
  function toggleMenu(open) {
    const sidebar = document.getElementById('sidebar');
    const menu = document.getElementById('navigation-dialog');
    const toggle = document.querySelector('.menu-toggle');
    if (!sidebar || !menu || !toggle) return;
    if (open) {
      menu.append(sidebar);
      sidebar.classList.add('open');
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      menu.showModal();
    } else {
      menu.close();
      menu.before(sidebar);
      sidebar.classList.remove('open');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus({preventScroll: true});
    }
  }
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
    if (event.matches && document.getElementById('navigation-dialog')?.open) toggleMenu(false);
  });
  render();
})();
