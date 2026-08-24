import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // پلاگین React: ترانسفورم JSX/TSX در زنجیره‌ی تست. بدون آن، به‌خاطر
  // "jsx": "preserve" در tsconfig (پیش‌فرض Next)، هر تستی که راستی‌آزمایی
  // کامپوننت انجام دهد با خطای import-analysis می‌ایستد.
  plugins: [react()],
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
      // اسکوپ آستانه = «لایه‌ی منطق» (کلاینت احراز هویت، نرمالایزرها،
      // ابزارها، هوک‌ها). دو فایل زیر آداپتور مرز شبکه‌اند (HTTP → مدل
      // کارت، ~۱۴۰۰ خط) و مکانِ درستِ راستی‌آزمایی‌شان تست‌های
      // integration با سرور ساختگی در مایلستون آداپتورهاست — نه mocks
      // کم‌ارزشِ گذرا؛ تا آن زمان، قراردادشان را typed-api + بیلد SSR +
      // اسکریپت site-audit پوشش می‌دهد.
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/lib/**/*.test.ts',
        'src/types/**',
        'src/lib/home-data.ts',
        'src/lib/global-search.ts',
      ],
      // آستانه‌ها عمداً روی «لایه‌ی منطق» تنظیم شده‌اند، نه روی کل UI؛
      // هدف، گارد روی قراردادهاست نه عددسازی پوشش.
      thresholds: { lines: 55, functions: 55, branches: 70, statements: 55 },
    },
  },
});
