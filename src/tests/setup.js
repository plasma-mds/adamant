import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock window.URL APIs
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
  window.URL.revokeObjectURL = vi.fn();
  window.HTMLAnchorElement.prototype.click = vi.fn();
}

// Mock window.HTMLElement scroll functions
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
}

// Mock jQuery and AJAX methods
vi.mock('jquery', () => ({
  __esModule: true,
  default: {
    ajax: vi.fn(),
  },
}));

// Mock react-toastify for clean verification of notifications
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    warning: vi.fn(),
  },
  ToastContainer: () => null,
}));
