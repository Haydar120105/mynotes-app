import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.getSelection for rich text editor tests
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(() => ({
    toString: () => '',
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
    getRangeAt: vi.fn(() => ({
      deleteContents: vi.fn(),
      insertNode: vi.fn(),
      surroundContents: vi.fn(),
      collapse: vi.fn(),
      extractContents: vi.fn(),
      commonAncestorContainer: document.createElement('div')
    })),
    rangeCount: 0
  }))
});

// Mock window.prompt for link insertion tests
Object.defineProperty(window, 'prompt', {
  writable: true,
  value: vi.fn(() => 'https://example.com')
});

// Mock document.execCommand for rich text formatting
Object.defineProperty(document, 'execCommand', {
  writable: true,
  value: vi.fn(() => true)
});

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Console error suppression for expected errors in tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalError.call(console, ...args);
};