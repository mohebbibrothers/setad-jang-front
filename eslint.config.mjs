// @ts-check
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ESLint — flat config (ESLint 9)
 *
 *  چیدمان لایه‌ها، از پایین به بالا:
 *    1. قواعد پایه‌ی JS
 *    2. قواعد TypeScript (نسخه‌ی سبک، بدون type-checking کامل تا لینت سریع بماند)
 *    3. قواعد Next.js — از طریق FlatCompat، چون eslint-config-next هنوز
 *       eslintrc-محور است و مستقیماً flat نیست
 *    4. سیاست‌های اختصاصی این پروژه
 *    5. prettier آخر از همه، تا قواعد سبک‌نویسیِ متضاد را خاموش کند
 * ─────────────────────────────────────────────────────────────────────────────
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'next-env.d.ts',
      'src/types/api.ts', // تولید خودکار از OpenAPI — لینت نمی‌شود
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('next/core-web-vitals'),

  {
    name: 'besat/project-rules',
    rules: {
      // متغیرهای بلااستفاده خطا هستند، مگر عمداً با _ شروع شوند
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // any فقط هشدار — تا مهاجرت تدریجی به تایپ‌های OpenAPI ممکن باشد
      '@typescript-eslint/no-explicit-any': 'warn',
      // نکته: consistent-type-imports عمداً فعال نشده — به type-information
      // نیاز دارد و با parser مخصوص eslint-config-next تداخل می‌کند؛ فعال‌کردنش
      // لینت را چند برابر کند می‌کرد بدون سود متناسب.
      // console فقط برای warn/error مجاز است
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['warn', 'always'],
    },
  },

  {
    name: 'besat/tests',
    files: ['**/*.test.ts', '**/*.test.tsx', 'vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  {
    name: 'besat/scripts',
    files: ['scripts/**/*.mjs', '*.config.{js,mjs,ts}'],
    rules: { 'no-console': 'off' },
  },

  prettier,
);
