/*
 * AKIMS Campus — fictional demonstration data and workflow.
 * This is a regular JavaScript file so index.html also works by double-click.
 * Edit the seed below to change examples. Use Reset demo in the portal to load them.
 * All roles run in the same browser. These checks explain the workflow; they are
 * NOT authentication or security. Never add real student records or passwords.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'akims-simple-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const classes = ['BSc MLT · Semester 4', 'BSc MLT · Semester 6'];
  const actors = {
    student: { id: 'student', role: 'student', name: 'Ayesha Noor', title: 'Medical Laboratory Technology', studentId: 'S001' },
    staff: { id: 'staff', role: 'staff', name: 'Imran Malik', title: 'Anatomy laboratory attendant', departmentIds: ['D001'] },
    accounts: { id: 'accounts', role: 'accounts', name: 'Sana Ahmed', title: 'Accounts officer' },
    admin: { id: 'admin', role: 'admin', name: 'Farah Khan', title: 'Campus administrator' },
    teacher: { id: 'teacher', role: 'teacher', name: 'Dr. Hamza Ali', title: 'Faculty · Medical sciences', classes: classes.slice() },
    alumni: { id: 'alumni', role: 'alumni', name: 'Zain Hassan', title: 'Class of 2025', studentId: 'S003' }
  };
  const seed = {
    schemaVersion: 1,
    students: [
      { id: 'S001', roll: 'AK-MLT-2023-014', name: 'Ayesha Noor', program: 'BSc Medical Laboratory Technology', batch: '2023–2027', email: 'ayesha@example.invalid', phone: '', status: 'active' },
      { id: 'S002', roll: 'AK-MLT-2023-026', name: 'Ahmed Raza', program: 'BSc Medical Laboratory Technology', batch: '2023–2027', email: 'ahmed@example.invalid', phone: '', status: 'active' },
      { id: 'S003', roll: 'AK-MLT-2021-008', name: 'Zain Hassan', program: 'BSc Medical Laboratory Technology', batch: '2021–2025', email: 'zain@example.invalid', phone: '', status: 'graduated' },
      { id: 'S004', roll: 'AK-MLT-2024-031', name: 'Maryam Asif', program: 'BSc Medical Laboratory Technology', batch: '2024–2028', email: 'maryam@example.invalid', phone: '', status: 'active' },
      { id: 'S005', roll: 'AK-MLT-2024-019', name: 'Bilal Shah', program: 'BSc Medical Laboratory Technology', batch: '2024–2028', email: 'bilal@example.invalid', phone: '', status: 'active' }
    ],
    departments: [
      { id: 'D001', name: 'Anatomy laboratory', short: 'Anatomy' },
      { id: 'D002', name: 'Clinical laboratory', short: 'Clinical lab' },
      { id: 'D003', name: 'Central store', short: 'Store' }
    ],
    inventory: [
      { id: 'I001', departmentId: 'D001', name: 'Compound microscope', category: 'Equipment', unit: 'units', quantity: 18, reorderLevel: 4 },
      { id: 'I002', departmentId: 'D001', name: 'Anatomical model set', category: 'Teaching aids', unit: 'sets', quantity: 8, reorderLevel: 2 },
      { id: 'I003', departmentId: 'D001', name: 'Glass slides', category: 'Consumables', unit: 'boxes', quantity: 3, reorderLevel: 5 },
      { id: 'I004', departmentId: 'D002', name: 'Laboratory centrifuge', category: 'Equipment', unit: 'units', quantity: 6, reorderLevel: 2 },
      { id: 'I005', departmentId: 'D002', name: 'Sample collection tubes', category: 'Consumables', unit: 'boxes', quantity: 24, reorderLevel: 8 },
      { id: 'I006', departmentId: 'D003', name: 'Laboratory coats', category: 'Supplies', unit: 'units', quantity: 32, reorderLevel: 10 },
      { id: 'I007', departmentId: 'D003', name: 'Protective gloves', category: 'Supplies', unit: 'boxes', quantity: 4, reorderLevel: 8 },
      { id: 'I008', departmentId: 'D003', name: 'Glass beakers · 250 mL', category: 'Apparatus', unit: 'units', quantity: 45, reorderLevel: 12 }
    ],
    stockMovements: [],
    requests: [{
      id: 'CLR-DEMO-2025-001', studentId: 'S003', purpose: 'Graduation clearance', createdAt: '2025-09-12T09:00:00.000Z', status: 'cleared',
      requirements: ['D001', 'D002', 'D003'].map(departmentId => ({ departmentId, status: 'cleared', note: 'Fictional historical demonstration: no outstanding items.' })),
      issues: [], challan: null, correctionNote: '',
      certificate: { number: 'AKIMS-DEMO-CERT-001', issuedAt: '2025-09-15T10:00:00.000Z', revokedAt: null, reason: '', studentName: 'Zain Hassan', studentRoll: 'AK-MLT-2021-008', program: 'BSc Medical Laboratory Technology' }
    }],
    observations: [{ id: 'OBS-DEMO-001', className: classes[0], text: 'The class is making steady progress with slide preparation. A supervised revision session on specimen handling would be useful.', author: actors.teacher.name, createdAt: '2026-11-02T09:30:00.000Z' }],
    audit: [], profileUpdates: {}, classes: classes.slice(), importHistory: [],
    announcements: [
      { id: 'N001', title: 'Your clearance, one step at a time', text: 'Apply, follow departmental reviews, and complete any confirmed requirements before final authorization.', date: '2026-11-04', category: 'Student services' },
      { id: 'N002', title: 'Keep your contact details current', text: 'Check your profile before submitting a clearance request. This portal contains fictional demonstration records.', date: '2026-11-03', category: 'Campus notice' },
      { id: 'N003', title: 'A connected alumni community', text: 'Graduates can revisit their sample clearance documents and update their contact information.', date: '2026-11-02', category: 'Alumni' }
    ]
  };

  const fail = message => { throw new Error(message); };
  function text(value, label, min = 1, max = 500) {
    const result = String(value == null ? '' : value).trim();
    if (result.length < min || result.length > max) fail(label + ' must contain ' + min + '–' + max + ' characters.');
    return result;
  }
  function amount(value, label = 'Amount') {
    if (value === '' || value == null) fail('Enter ' + label.toLowerCase() + '.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 10000000 || Math.abs(n * 100 - Math.round(n * 100)) > 0.00001) fail(label + ' must be between 0 and 10,000,000, with at most two decimal places.');
    return Math.round(n * 100) / 100;
  }
  const cents = value => Math.round(value * 100);
  const uid = prefix => prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const closed = request => !!request.certificate;
  const outstanding = issue => issue.resolution === 'open' || issue.resolution === 'charged';
  function deriveStatus(request) {
    if (request.certificate) return request.certificate.revokedAt ? 'revoked' : 'cleared';
    if (request.status === 'correction_requested') return request.status;
    if (request.challan && request.challan.status === 'submitted') return 'payment_review';
    if (request.challan && request.challan.status !== 'verified') return 'payment_due';
    if (request.requirements.every(item => item.status === 'cleared') && !request.issues.some(outstanding)) return 'ready';
    if (request.requirements.every(item => item.status === 'pending') && !request.issues.length) return 'submitted';
    return 'under_review';
  }

  // Reject broken or incompatible saved data rather than silently treating it as
  // a valid database. The UI can offer Reset demo to start afresh explicitly.
  function validSaved(value) {
    if (!value || value.schemaVersion !== 1) return false;
    for (const key of ['students', 'departments', 'inventory', 'stockMovements', 'requests', 'observations', 'audit']) if (!Array.isArray(value[key])) return false;
    if (!value.students.every(s => s && typeof s.id === 'string' && typeof s.roll === 'string' && typeof s.name === 'string')) return false;
    if (!value.departments.every(d => d && typeof d.id === 'string' && typeof d.name === 'string')) return false;
    if (!value.inventory.every(i => i && Number.isInteger(i.quantity) && i.quantity >= 0 && value.departments.some(d => d.id === i.departmentId))) return false;
    if (!value.requests.every(r => r && value.students.some(s => s.id === r.studentId) && Array.isArray(r.requirements) && Array.isArray(r.issues) && r.requirements.every(d => value.departments.some(s => s.id === d.departmentId)) && r.issues.every(i => Number.isFinite(i.amount) && i.amount >= 0))) return false;
    return true;
  }

  function createStore() {
    let state = clone(seed);
    let storage = null;
    let persistenceAvailable = false;
    let persistenceWarning = '';
    try {
      storage = window.localStorage;
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed;
        try { parsed = JSON.parse(saved); } catch (_) { fail('Saved demo data could not be read.'); }
        if (!validSaved(parsed)) fail('Saved demo data is incompatible or damaged.');
        state = parsed;
        state.profileUpdates = state.profileUpdates || {};
        state.importHistory = state.importHistory || [];
        state.classes = state.classes || classes.slice();
        state.announcements = state.announcements || clone(seed.announcements);
      }
      const probe = STORAGE_KEY + '-check';
      storage.setItem(probe, '1'); storage.removeItem(probe);
      persistenceAvailable = true;
    } catch (error) {
      persistenceWarning = (error && /Saved demo/.test(error.message) ? error.message + ' Original saved data was left untouched. ' : '') + 'Changes will stay in this tab only. Export a backup before closing it, or use Reset demo to try local storage again.';
    }

    function syncAccounts() {
      for (const account of state.localAccounts || []) {
        const s = state.students.find(s => s.id === account.studentId);
        if (s) { const a = {id: account.id, role: 'student', name: s.name, title: s.program, studentId: s.id, localAccount: true}; actors[a.id] = a; window.AKIMS.actors[a.id] = a; }
      }
    }
    syncAccounts();
    function registerLocal(p) {
      if (!persistenceAvailable) fail('Enable browser storage before creating a local account.');
      const email = text(p.email, 'Email', 5, 160).toLowerCase();
      const roll = text(p.roll, 'Registration', 3, 60);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email address.');
      if (state.students.some(s => s.email.toLowerCase() === email) || (state.localAccounts || []).some(a => a.email === email)) fail('This email is already registered. Sign in or use another demo email.');
      if (state.students.some(s => s.roll.toLowerCase() === roll.toLowerCase())) fail('This registration number already exists. Use a different sample registration.');
      if (!/^[a-f0-9]{64}$/.test(p.hash) || !/^[a-f0-9]{32}$/.test(p.salt)) fail('Local credentials could not be created.');
      const next = clone(state), id = uid('LOCAL'), studentId = uid('S');
      next.students.push({id: studentId, roll, name: text(p.name, 'Name', 2, 120), program: text(p.program, 'Program', 2, 160), batch: text(p.batch, 'Batch', 2, 60), email, phone: '', status: 'active', selfDeclared: true});
      next.localAccounts = [...(next.localAccounts || []), {id, studentId, email, hash: p.hash, salt: p.salt}];
      next.audit.push({id: uid('AUD'), actorId: id, actor: p.name, role: 'student', action: 'registerLocal', detail: 'Self-declared local demonstration account; enrollment not verified.', createdAt: new Date().toISOString()});
      try { storage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) { fail('Account could not be saved. Browser storage is full or unavailable.'); }
      state = next; syncAccounts(); return id;
    }

    function persist(next) {
      if (persistenceAvailable && storage) {
        try { storage.setItem(STORAGE_KEY, JSON.stringify(next)); }
        catch (_) {
          persistenceAvailable = false;
          persistenceWarning = 'Browser storage is full or unavailable. Recent changes are in this tab only; export a backup before closing it.';
        }
      }
      state = next;
    }
    function dispatch(actorId, action, payload) {
      const actor = actors[actorId];
      if (!actor) fail('Choose a demonstration role first.');
      const p = payload || {};
      const next = clone(state);
      const now = new Date().toISOString();
      let request = null;
      let detail = '';
      const requireRole = (...roles) => { if (!roles.includes(actor.role)) fail('This action is not available to the selected demonstration role.'); };
      const student = id => next.students.find(s => s.id === id) || fail('Student record was not found.');
      const findRequest = (allowClosed = false) => {
        const r = next.requests.find(item => item.id === p.requestId) || fail('Clearance request was not found.');
        if (!allowClosed && closed(r)) fail('This clearance is closed. Its historical records cannot be changed.');
        return r;
      };
      const requireDepartment = (departmentId, r) => {
        requireRole('admin', 'staff');
        if (actor.role === 'staff' && !actor.departmentIds.includes(departmentId)) fail('You can only work in your assigned department.');
        if (r && !r.requirements.some(item => item.departmentId === departmentId)) fail('This department does not belong to the request.');
      };
      const notCorrection = r => { if (r.status === 'correction_requested') fail('The student must correct and resubmit this request first.'); };
      const ownRequest = r => { if (actor.studentId !== r.studentId) fail('You can only update your own clearance request.'); };
      const unbilled = r => { if (r.challan) fail('An issued challan is a historical record. Charges and resolutions cannot be changed after billing in this demo.'); };

      switch (action) {
        case 'createRequest': {
          requireRole('student', 'staff', 'admin');
          const targetId = p.studentId || actor.studentId;
          if (actor.role === 'student' && targetId !== actor.studentId) fail('You can only apply for your own clearance.');
          const s = student(targetId);
          if (s.status !== 'active') fail('Only an active demonstration student can start a new clearance request.');
          if (next.requests.some(r => r.studentId === s.id && !closed(r))) fail('This student already has an active clearance request.');
          // These three departments are a sample policy, not approved AKIMS rules.
          request = { id: uid('CLR'), studentId: s.id, purpose: text(p.purpose, 'Purpose', 3, 180), createdAt: now, status: 'submitted', requirements: next.departments.map(d => ({ departmentId: d.id, status: 'pending', note: '' })), issues: [], challan: null, certificate: null, correctionNote: '' };
          next.requests.push(request);
          detail = 'Clearance requested for ' + s.roll + '.';
          break;
        }
        case 'requestCorrection': {
          requireRole('admin'); request = findRequest(); unbilled(request);
          request.correctionNote = text(p.note, 'Correction instructions', 5, 1000);
          request.status = 'correction_requested';
          detail = 'Request returned for correction.';
          break;
        }
        case 'resubmit': {
          requireRole('student', 'staff', 'admin'); request = findRequest();
          if (actor.role === 'student') ownRequest(request);
          if (actor.role === 'staff' && !request.requirements.some(r => actor.departmentIds.includes(r.departmentId))) fail('This request has no department assigned to you.');
          if (request.status !== 'correction_requested') fail('Only a request awaiting correction can be resubmitted.');
          request.purpose = text(p.purpose, 'Purpose', 3, 180);
          request.status = 'submitted';
          request.correctionNote = '';
          detail = 'Corrected request resubmitted.';
          break;
        }
        case 'addIssue': {
          request = findRequest(); requireDepartment(p.departmentId, request); notCorrection(request); unbilled(request);
          const cost = amount(p.amount);
          request.issues.push({ id: uid('ISS'), departmentId: p.departmentId, description: text(p.description, 'Issue description', 5, 500), amount: cost, resolution: cost > 0 ? 'charged' : 'open', note: '', createdAt: now });
          const requirement = request.requirements.find(r => r.departmentId === p.departmentId);
          requirement.status = 'reviewed';
          requirement.note = 'An issue has been recorded. Resolve it before departmental clearance.';
          detail = cost > 0 ? 'Confirmed sample charge recorded: PKR ' + cost + '.' : 'Issue opened for investigation.';
          break;
        }
        case 'resolveIssue': {
          request = findRequest(); notCorrection(request); unbilled(request);
          const issue = request.issues.find(i => i.id === p.issueId) || fail('Issue was not found.');
          requireDepartment(issue.departmentId, request);
          if (!outstanding(issue)) fail('This issue is already resolved.');
          if (!['returned', 'waived'].includes(p.resolution)) fail('Choose returned or waived.');
          if (p.resolution === 'waived') requireRole('admin');
          issue.note = text(p.note, 'Resolution reason', 5, 1000);
          issue.resolution = p.resolution; issue.resolvedAt = now;
          detail = 'Issue ' + issue.id + ' resolved as ' + p.resolution + '.';
          break;
        }
        case 'assessDepartment': {
          request = findRequest(); requireDepartment(p.departmentId, request); notCorrection(request);
          if (!['reviewed', 'cleared'].includes(p.status)) fail('Choose an assessment result.');
          const requirement = request.requirements.find(r => r.departmentId === p.departmentId);
          if (requirement.status === 'cleared') fail('This department is already cleared.');
          if (p.status === 'cleared' && request.issues.some(i => i.departmentId === p.departmentId && outstanding(i))) fail('Resolve investigations and confirmed dues before clearing this department.');
          requirement.status = p.status; requirement.note = text(p.note || (p.status === 'cleared' ? 'No outstanding departmental requirements.' : 'Departmental assessment completed.'), 'Assessment note', 3, 1000);
          requirement.reviewedAt = now; requirement.reviewedBy = actor.name;
          detail = 'Department assessment: ' + p.status + '.';
          break;
        }
        case 'issueChallan': {
          requireRole('admin'); request = findRequest(); notCorrection(request);
          if (request.challan) return { state: clone(state), requestId: request.id };
          if (request.requirements.some(r => r.status === 'pending')) fail('Complete every departmental assessment before issuing the challan.');
          if (request.issues.some(i => i.resolution === 'open')) fail('Resolve open investigations before issuing the challan.');
          const totalCents = request.issues.filter(i => i.resolution === 'charged').reduce((sum, i) => sum + cents(i.amount), 0);
          if (!totalCents) fail('No confirmed dues exist. A zero-dues request does not need a challan.');
          request.challan = { number: uid('AKIMS-DEMO-CH'), amount: totalCents / 100, issuedAt: now, bankName: 'DEMO BANK · do not pay', accountTitle: 'AKIMS demonstration only', accountNumber: 'NOT A BANK ACCOUNT', status: 'unpaid', receipt: null, reviewNote: '' };
          detail = 'Demonstration challan issued for PKR ' + request.challan.amount + '.';
          break;
        }
        case 'submitReceipt': {
          requireRole('student'); request = findRequest(); ownRequest(request); notCorrection(request);
          const bill = request.challan;
          if (!bill || bill.status !== 'unpaid') fail('A receipt can only be submitted for an unpaid challan.');
          const types = ['application/pdf', 'image/png', 'image/jpeg'];
          if (!types.includes(p.type)) fail('Choose a PDF, PNG or JPEG sample receipt.');
          const size = Number(p.size);
          if (!Number.isInteger(size) || size < 1 || size > 5 * 1024 * 1024) fail('The sample receipt must be between 1 byte and 5 MB.');
          bill.receipt = { name: text(p.name, 'File name', 1, 200), size, type: p.type, reference: text(p.reference, 'Payment reference', 3, 100), submittedAt: now };
          bill.status = 'submitted'; bill.reviewNote = '';
          detail = 'Sample receipt metadata submitted for Accounts review.';
          break;
        }
        case 'reviewReceipt': {
          requireRole('accounts'); request = findRequest(); notCorrection(request);
          const bill = request.challan;
          if (!bill || bill.status !== 'submitted' || !bill.receipt) fail('There is no submitted receipt awaiting review.');
          if (p.decision === 'return') {
            bill.reviewNote = text(p.note, 'Return reason', 5, 1000);
            bill.status = 'unpaid';
            bill.receiptHistory = bill.receiptHistory || [];
            bill.receiptHistory.push({ ...bill.receipt, returnedAt: now, reason: bill.reviewNote });
            bill.receipt = null;
            detail = 'Sample receipt returned for correction.';
          } else if (p.decision === 'verify') {
            const reference = text(p.reference, 'Verified reference', 3, 100);
            if (reference !== bill.receipt.reference) fail('The verified reference must match the submitted payment reference.');
            if (cents(amount(p.receivedAmount, 'Received amount')) !== cents(bill.amount)) fail('The received amount must exactly match the challan total. Partial payments are not supported in this demonstration.');
            bill.status = 'verified'; bill.verifiedAt = now; bill.verifiedBy = actor.name;
            bill.reviewNote = text(p.note || 'Sample amount and reference checked in the demonstration.', 'Review note', 3, 1000);
            request.issues.filter(i => i.resolution === 'charged').forEach(i => { i.resolution = 'paid'; i.resolvedAt = now; i.note = 'Settled through verified demonstration challan ' + bill.number + '.'; });
            detail = 'Sample receipt verified. Departments still require explicit clearance.';
          } else fail('Choose verify or return.');
          break;
        }
        case 'finalize': {
          requireRole('admin'); request = findRequest(true);
          if (request.certificate) {
            if (request.certificate.revokedAt) fail('This certificate was revoked. It cannot be reissued in this demonstration.');
            return { state: clone(state), requestId: request.id };
          }
          notCorrection(request);
          if (request.requirements.some(r => r.status !== 'cleared')) fail('Every mandatory department must clear the request first.');
          if (request.issues.some(outstanding)) fail('Outstanding issues must be resolved before final authorization.');
          if (request.challan && request.challan.status !== 'verified') fail('Accounts must verify the challan payment first.');
          const s = student(request.studentId);
          request.certificate = { number: uid('AKIMS-DEMO-CERT'), issuedAt: now, revokedAt: null, reason: '', studentName: s.name, studentRoll: s.roll, program: s.program };
          detail = 'Final demonstration clearance authorized and certificate snapshot created.';
          break;
        }
        case 'revokeCertificate': {
          requireRole('admin'); request = findRequest(true);
          if (!request.certificate || request.certificate.revokedAt) fail('Only an active issued certificate can be revoked.');
          request.certificate.reason = text(p.note, 'Revocation reason', 5, 1000);
          request.certificate.revokedAt = now;
          detail = 'Certificate revoked; historical details retained.';
          break;
        }
        case 'stockMove': {
          const item = next.inventory.find(i => i.id === p.itemId) || fail('Inventory item was not found.');
          requireDepartment(item.departmentId);
          const quantity = Number(p.quantity);
          if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) fail('Enter a whole quantity between 1 and 100,000.');
          if (!['in', 'out'].includes(p.direction)) fail('Choose stock received or stock issued.');
          if (p.direction === 'out' && quantity > item.quantity) fail('There is not enough stock for this issue.');
          const reason = text(p.reason, 'Stock movement reason', 3, 500);
          item.quantity += p.direction === 'in' ? quantity : -quantity;
          next.stockMovements.push({ id: uid('MOV'), itemId: item.id, departmentId: item.departmentId, direction: p.direction, quantity, reason, balance: item.quantity, actor: actor.name, createdAt: now });
          detail = quantity + ' ' + item.unit + ' ' + (p.direction === 'in' ? 'received' : 'issued') + ': ' + item.name + '.';
          break;
        }
        case 'importStudents': {
          requireRole('admin');
          if (!Array.isArray(p.rows) || !p.rows.length || p.rows.length > 500) fail('Import between 1 and 500 valid student rows.');
          const seen = new Set(next.students.map(s => s.roll.toLowerCase()));
          const emails = new Set(next.students.map(s => s.email.toLowerCase()));
          const rows = p.rows.map((raw, index) => {
            const row = raw || {};
            const roll = text(row.roll, 'Row ' + (index + 1) + ' roll number', 3, 60);
            if (seen.has(roll.toLowerCase())) fail('Duplicate roll number: ' + roll + '. Existing students were not changed.');
            seen.add(roll.toLowerCase());
            const email = text(row.email, 'Row ' + (index + 1) + ' email', 5, 160).toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Invalid email on row ' + (index + 1) + '.');
            if (emails.has(email)) fail('Duplicate email on row ' + (index + 1) + '. Existing students were not changed.');
            emails.add(email);
            return { id: uid('S'), roll, name: text(row.name, 'Student name', 2, 120), program: text(row.program, 'Program', 2, 160), batch: text(row.batch, 'Batch', 2, 60), email, phone: '', status: 'active' };
          });
          const batchId = uid('IMP');
          rows.forEach(row => { row.importBatchId = batchId; });
          next.students.push(...rows);
          next.importHistory.push({ id: batchId, count: rows.length, actor: actor.name, createdAt: now, source: 'CSV demonstration import' });
          detail = rows.length + ' fictional student records imported without overwriting existing students.';
          break;
        }
        case 'saveObservation': {
          requireRole('teacher');
          if (!actor.classes.includes(p.className)) fail('Choose one of your assigned classes.');
          next.observations.push({ id: uid('OBS'), className: p.className, text: text(p.text, 'Class observation', 10, 2000), author: actor.name, createdAt: now });
          detail = 'Collective class observation saved for ' + p.className + '.';
          break;
        }
        case 'updateProfile': {
          requireRole('student', 'alumni');
          const s = student(actor.studentId);
          const email = text(p.email, 'Email', 5, 160).toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email address.');
          if (next.students.some(other => other.id !== s.id && other.email.toLowerCase() === email)) fail('That email is already used by another demonstration record.');
          const phone = text(p.phone || '', 'Phone number', 0, 40);
          if (phone && !/^[+\d\s().-]{5,40}$/.test(phone)) fail('Enter a valid phone number or leave it blank.');
          s.email = email; s.phone = phone;
          next.profileUpdates[s.id] = { email, phone, updatedAt: now };
          detail = 'Own profile contact details updated.';
          break;
        }
        default: fail('This demonstration action is not supported.');
      }
      if (request) request.status = deriveStatus(request);
      next.audit.push({ id: uid('AUD'), actorId: actor.id, actor: actor.name, role: actor.role, action, requestId: request ? request.id : null, detail, createdAt: now });
      persist(next);
      return { state: clone(state), requestId: request ? request.id : undefined };
    }

    return {
      getState: () => clone(state), dispatch, registerLocal,
      reset: () => {
        try { storage = window.localStorage; storage.setItem(STORAGE_KEY, JSON.stringify(seed)); persistenceAvailable = true; persistenceWarning = ''; }
        catch (_) { persistenceAvailable = false; persistenceWarning = 'Browser storage is unavailable. This reset applies to the current tab only.'; }
        for (const key of Object.keys(actors)) if (actors[key].localAccount) { delete actors[key]; delete window.AKIMS.actors[key]; }
        state = clone(seed); return clone(state);
      },
      exportJSON: () => {const copy = clone(state); delete copy.localAccounts; return JSON.stringify(copy, null, 2);},
      get persistenceAvailable() { return persistenceAvailable; },
      get persistenceWarning() { return persistenceWarning; }
    };
  }
  window.AKIMS = { seed: clone(seed), actors: clone(actors), createStore };
}());
