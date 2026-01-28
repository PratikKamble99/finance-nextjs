import '@testing-library/jest-dom'

// Mock IndexedDB for testing
global.indexedDB = require('fake-indexeddb')
global.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')

// Mock Web Workers
global.Worker = class Worker {
  constructor(stringUrl) {
    this.url = stringUrl
    this.onmessage = null
  }

  postMessage(msg) {
    // Mock implementation
  }

  terminate() {
    // Mock implementation
  }
}