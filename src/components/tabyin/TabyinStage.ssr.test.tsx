/**
 * @vitest-environment node
 *
 * تستِ دودِ SSRِ استیجِ رسانه — در محیطِ خالصِ Node (بدون DOM).
 *
 * چرا این تست وجود دارد؟ صفحه‌ی جزئیات در تولید به‌ازای محتوای رسانه‌ای
 * می‌افتاد اما محتوای متنی سالم بود؛ تنها تفاوتِ دو مسیر، رندرِ همین
 * کامپوننت است. این تست تضمین می‌کند رندرِ سمتِ سرور (renderToString)
 * برای هر چهار حالتِ رسانه هیچ‌وقت استثنا پرتاب نکند — دقیقاً همان
 * کاری که سرورِ Next در تولید هنگام SSR انجام می‌دهد.
 */
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TabyinStage, type TabyinStageAttachment } from './TabyinStage';

const VIDEO: TabyinStageAttachment = {
  id: 1,
  url: 'https://media.example.org/org/uploads/2026/07/14/clip.mp4',
  media_type: 'video',
  media_type_display: 'ویدئو',
  duration: 444,
  file_size: 1434,
};

const AUDIO: TabyinStageAttachment = {
  id: 2,
  url: 'https://media.example.org/org/uploads/pod/ep3.mp3',
  media_type: 'audio',
  media_type_display: 'صوت',
  duration: 1850,
};

const IMAGE: TabyinStageAttachment = {
  id: 3,
  url: 'https://media.example.org/org/uploads/img/pic.png',
  media_type: 'image',
  media_type_display: 'تصویر',
  size: '1280X905',
};

describe('TabyinStage — SSR smoke (node)', () => {
  it('ویدئو: بدون استثنا و با <video> رندر می‌شود', () => {
    const html = renderToString(<TabyinStage attachments={[VIDEO]} title="کلیپ نمونه" />);
    expect(html).toContain('<video');
    expect(html).toContain('/thumbnail/uploads/');
    expect(html).toContain('.gif');
  });

  it('تصویر: بدون استثنا و با <img> رندر می‌شود', () => {
    const html = renderToString(<TabyinStage attachments={[IMAGE]} title="پوستر" />);
    expect(html).toContain('<img');
    expect(html).toContain(IMAGE.url);
  });

  it('صوت + کاور: پنلِ پادکست با <audio> و کاور رندر می‌شود', () => {
    const html = renderToString(<TabyinStage attachments={[AUDIO, IMAGE]} title="قسمت سوم" />);
    expect(html).toContain('<audio');
    expect(html).toContain(IMAGE.url);
  });

  it('چند پیوست: نوارِ بندانگشتی در SSR سالم است', () => {
    const html = renderToString(
      <TabyinStage attachments={[VIDEO, AUDIO, IMAGE]} title="چندرسانه‌ای" />,
    );
    expect(html).toContain('پیوست‌ها');
  });

  it('پیوستِ سایر/ناشناخته: کارتِ دریافتِ فایل رندر می‌شود', () => {
    const html = renderToString(
      <TabyinStage
        attachments={[{ id: 9, url: 'https://media.example.org/f/doc.pdf', media_type: 'other' }]}
        title="سند"
      />,
    );
    expect(html).toContain('بازکردن فایل');
  });

  it('لیستِ خالی: خروجی‌اش ته است، نه خطا', () => {
    expect(renderToString(<TabyinStage attachments={[]} title="خالی" />)).toBe('');
  });
});
