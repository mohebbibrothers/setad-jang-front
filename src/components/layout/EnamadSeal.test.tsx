import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EnamadSeal, ENAMAD_CODE, ENAMAD_ID } from './EnamadSeal';

/**
 * تست قرارداد اینماد — خزنده‌ی صحت‌سنجی اینماد دقیقاً این امضا را در
 * HTML خام صفحه‌ی اصلی می‌کاود. هر رگرسیون در هر یک از گزاره‌های زیر
 * عملاً به معنای «از دست رفتن نماد اعتماد سایت» است؛ پس این تست به‌جای
 * سنجیدن ظاهر، رشته‌ی دقیق خروجی سرور-رندر را قفل می‌کند.
 */
describe('EnamadSeal — قرارداد صحت‌سنجی اینماد', () => {
  const html = renderToStaticMarkup(createElement(EnamadSeal));

  it('لینک به نشانی راستی‌آزمایی با id و Code یکتا اشاره می‌کند', () => {
    expect(html).toContain(
      `href='https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}'`,
    );
    expect(html).toContain("target='_blank'");
  });

  it('تصویر از logo.aspx با همان id و Code سرو می‌شود', () => {
    expect(html).toContain(
      `src='https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}'`,
    );
  });

  it('اتریبیوت قراردادی code روی <img> در HTML سروری حضور دارد', () => {
    expect(html).toContain(`code='${ENAMAD_CODE}'`);
  });

  it("referrerpolicy='origin' تمام‌کوچک، هم روی لینک است هم روی تصویر", () => {
    expect(html.match(/referrerpolicy='origin'/g)).toHaveLength(2);
  });

  it('مرجع هرگز حذف نمی‌شود — noreferrer ممنوع است (noopener کافی است)', () => {
    expect(html).not.toContain('noreferrer');
    expect(html).toContain("rel='noopener'");
  });

  it('متن جایگزین فارسی برای دسترس‌پذیری دارد و دقیقاً یک لینک و یک تصویر است', () => {
    expect(html).toContain("alt='نماد اعتماد الکترونیکی (اینماد)'");
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html.match(/<a /g)).toHaveLength(1);
  });
});
