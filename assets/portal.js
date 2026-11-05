/* Local demonstration credentials and document storage. No server authentication. */
(function () {
  'use strict';
  const fail = message => { throw new Error(message); };
  const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  async function verifier(password, salt) {
    if (!window.crypto?.subtle) fail('This browser cannot create local credentials here. Try a current Chrome/Edge browser or VS Code Live Server.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return hex(await crypto.subtle.deriveBits({name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 210000, hash: 'SHA-256'}, key, 256));
  }
  async function credentials(password) {
    if (password.length < 10 || password.length > 128) fail('Use a demo password of 10–128 characters. Do not reuse a real password.');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    return {salt, hash: await verifier(password, salt)};
  }
  let connection;
  function db() {
    if (!connection) connection = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('Document storage is unavailable in this browser.'));
      const request = indexedDB.open('akims-local-documents', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files', {keyPath: 'id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Document storage could not open. Enable browser storage and try again.'));
      request.onblocked = () => reject(new Error('Close other portal tabs and try again.'));
    }).catch(error => {connection = null; throw error;});
    return connection;
  }
  async function transaction(mode, operation) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', mode); let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(new Error('Files could not be saved. Browser storage may be full or disabled. Download existing files before clearing storage.'));
      operation(tx.objectStore('files'), value => {result = value;}, tx);
    });
  }
  async function validate(file) {
    if (!file || !file.size) fail('Choose a nonempty sample document.');
    if (file.size > 5 * 1024 * 1024) fail('Choose a file of 5 MB or smaller.');
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const signature = file.type === 'application/pdf' && /\.pdf$/i.test(file.name) && String.fromCharCode(...bytes.slice(0,5)) === '%PDF-' || file.type === 'image/png' && /\.png$/i.test(file.name) && hex(bytes.slice(0,8)) === '89504e470d0a1a0a' || file.type === 'image/jpeg' && /\.jpe?g$/i.test(file.name) && hex(bytes.slice(0,3)) === 'ffd8ff';
    if (!signature) fail('Choose a genuine PDF, JPEG or PNG file. Renaming another file is not supported.');
  }
  async function list(owner) {
    return transaction('readonly', (files, done) => { const r = files.getAll(); r.onsuccess = () => done(r.result.filter(f => f.owner === owner)); });
  }
  async function add(owner, category, file) {
    if (!owner) fail('Sign in to a student workspace first.');
    if (!['Student card', 'Academic document', 'Payment receipt', 'Other document'].includes(category)) fail('Choose a document category.');
    await validate(file);
    const record = {id: crypto.randomUUID(), owner, category, name: file.name.slice(0,180), type: file.type, size: file.size, createdAt: new Date().toISOString(), blob: file};
    let limitError;
    await transaction('readwrite', (files, done) => {const r = files.getAll(); r.onsuccess = () => {
      const own = r.result.filter(f => f.owner === owner);
      if (own.length >= 10 || own.reduce((n,f) => n+f.size,0)+file.size > 25*1024*1024) {limitError = 'Limit reached: 10 files or 25 MB per student. Remove a file before adding another.'; return;}
      if (own.some(f => f.name === record.name && f.size === record.size)) {limitError = 'This file is already in your documents.'; return;}
      files.add(record); done(record.id);
    };});
    if (limitError) fail(limitError);
    return record;
  }
  async function remove(owner, id) {
    await transaction('readwrite', (files, done) => {const r = files.get(id); r.onsuccess = () => {if (r.result?.owner === owner) files.delete(id);};});
  }
  const clear = () => transaction('readwrite', files => files.clear());
  window.AKIMSPortal = {credentials, verifier, list, add, remove, clear};
}());
