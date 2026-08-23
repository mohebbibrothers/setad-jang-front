import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.test.ts', 'src/types/**'],
      // آستانه‌ها عمداً روی «لایه‌ی منطق» تنظیم شده‌اند، نه روی کل UI؛
      // هدف، گارد روی قراردادهاست نه عددسازی پوشش.
      thresholds: { lines: 55, functions: 55, branches: 70, statements: 55 },
    },
  },
});
