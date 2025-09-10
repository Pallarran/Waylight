import 'fake-indexeddb/auto';

// Mock IndexedDB for testing
// eslint-disable-next-line @typescript-eslint/no-require-imports
globalThis.indexedDB = require('fake-indexeddb');
// eslint-disable-next-line @typescript-eslint/no-require-imports
globalThis.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');