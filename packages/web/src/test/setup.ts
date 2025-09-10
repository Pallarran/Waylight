import 'fake-indexeddb/auto';

// Mock IndexedDB for testing
globalThis.indexedDB = require('fake-indexeddb');
globalThis.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');