import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Unmount anything a test rendered, so no test inherits the previous one's DOM.
afterEach(() => {
  cleanup();
});
