#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  تولید تایپ‌های TypeScript از اسکیمای OpenAPI بک‌اند
 *
 *      npm run api:types
 *
 *  منبع اسکیما به این ترتیب انتخاب می‌شود:
 *    1. آرگومان خط فرمان        →  npm run api:types -- ./schema.yaml
 *    2. متغیر محیطی SCHEMA_SRC  →  SCHEMA_SRC=http://127.0.0.1:8000/api/schema/
 *    3. پیش‌فرض                 →  https://besat.me/api/schema/
 *
 *  خروجی در `src/types/api.ts` نوشته می‌شود و کامیت می‌شود، تا:
 *    • بیلد روی سرور به شبکه یا در دسترس بودن بک‌اند وابسته نباشد
 *    • هر تغییر قرارداد API در diff گیت دیده شود (نه اینکه بی‌صدا رد شود)
 *
 *  فایل موجود فقط وقتی بازنویسی می‌شود که تولید تازه موفق باشد؛ در غیر این
 *  صورت نسخه‌ی قبلی دست‌نخورده می‌ماند تا یک بک‌اند موقتاً down باعث خراب‌شدن
 *  تایپ‌ها نشود.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import openapiTS, { astToString } from 'openapi-typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/types/api.ts');
const DEFAULT_SRC = 'https://besat.me/api/schema/';

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const source = process.argv[2] ?? process.env.SCHEMA_SRC ?? DEFAULT_SRC;
const isUrl = /^https?:\/\//i.test(source);

console.log(`${c.bold('تولید تایپ‌های API')}`);
console.log(`  منبع : ${source}`);
console.log(`  خروجی: ${OUT.replace(ROOT + '/', '')}`);

if (!isUrl && !existsSync(source)) {
  console.error(c.red(`\n✘ فایل اسکیما پیدا نشد: ${source}`));
  process.exit(1);
}

const header = `/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ⚠️  این فایل به‌صورت خودکار تولید شده است — دستی ویرایشش نکن.
 *
 *  بازتولید:   npm run api:types
 *  منبع:       ${source}
 *  تولید در:   ${new Date().toISOString()}
 *
 *  برای مصرف راحت و تایپ‌شده‌ی این تعاریف از \`src/lib/typed-api.ts\` استفاده
 *  کن، نه از \`paths\`/\`components\` به‌طور مستقیم.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* eslint-disable */
/* prettier-ignore-start */

`;

try {
  // openapi-typescript یک رشته‌ی ساده را «محتوای اسکیما» فرض می‌کند،
  // پس مسیر محلی باید به file:// URL تبدیل شود.
  const input = isUrl ? new URL(source) : pathToFileURL(resolve(source));
  const ast = await openapiTS(input, {
    alphabetize: true,
    emptyObjectsUnknown: true,
    defaultNonNullable: true,
    excludeDeprecated: false, // منسوخ‌ها را نگه می‌داریم تا در تایپ دیده و آگاهانه پرهیز شوند
  });

  const body = astToString(ast);
  const next = header + body + '\n/* prettier-ignore-end */\n';

  const prevHash = existsSync(OUT)
    ? createHash('sha256')
        .update(stripHeader(readFileSync(OUT, 'utf8')))
        .digest('hex')
    : null;
  const nextHash = createHash('sha256').update(stripHeader(next)).digest('hex');

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, next, 'utf8');

  const kb = (statSync(OUT).size / 1024).toFixed(0);
  const ops = (body.match(/^\s{8}(get|put|post|delete|patch)\??:/gm) ?? []).length;

  if (prevHash === nextHash) {
    console.log(c.dim(`\n• بدون تغییر — قرارداد API همان قبلی است (${kb} kB)`));
  } else if (prevHash === null) {
    console.log(c.green(`\n✔ ساخته شد — ${kb} kB، حدود ${ops} عملیات`));
  } else {
    console.log(c.yellow(`\n✔ به‌روزرسانی شد — قرارداد API تغییر کرده است (${kb} kB)`));
    console.log(c.dim('  حتماً `git diff src/types/api.ts` را ببین.'));
  }
} catch (err) {
  console.error(c.red(`\n✘ تولید تایپ‌ها شکست خورد: ${err?.message ?? err}`));
  if (existsSync(OUT)) console.error(c.dim('  نسخه‌ی قبلی دست‌نخورده باقی ماند.'));
  process.exit(1);
}

/** هدر متغیر (تاریخ تولید) را کنار می‌گذارد تا مقایسه فقط روی محتوای واقعی باشد. */
function stripHeader(text) {
  const marker = '/* eslint-disable */';
  const i = text.indexOf(marker);
  return i === -1 ? text : text.slice(i);
}
