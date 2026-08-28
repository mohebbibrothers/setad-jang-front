import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TabyinStage, type TabyinStageAttachment } from './TabyinStage';

/**
 * TabyinStage — قراردادِ استیجِ رسانه‌ی صفحه‌ی جزئیات:
 *   • انتخابِ اولیه‌ی هوشمند: ویدئو > صوت > تصویر؛
 *   • صوت → پنلِ پادکست با کاورِ پیوستِ تصویری (نکته‌ی کارفرما)؛
 *   • چند پیوست → نوارِ بندانگشتی که استیج را عوض می‌کند؛
 *   • چیپِ ابرداده فقط وقتی مقدار دارد؛
 *   • هیچ لینکِ منبعی رندر نمی‌شود — فقط رسانه‌های خودِ دیتابیس.
 */

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

afterEach(cleanup);

describe('TabyinStage', () => {
  it('ویدئو: پلیرِ بومی با پوسترِ GIFِ تامنیل', () => {
    const { container } = render(<TabyinStage attachments={[VIDEO]} title="کلیپ نمونه" />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video!.getAttribute('src')).toBe(VIDEO.url);
    expect(video!.getAttribute('poster')).toContain('/thumbnail/uploads/');
    expect(video!.getAttribute('poster')).toMatch(/\.gif$/);
  });

  it('تصویر: رندرِ گالری با متنِ جایگزین و چیپِ ابعاد', () => {
    render(<TabyinStage attachments={[IMAGE]} title="پوستر روایت" />);
    const img = screen.getByAltText('پوستر روایت');
    expect(img.getAttribute('src')).toBe(IMAGE.url);
    expect(screen.getByText('۱۲۸۰×۹۰۵ پیکسل')).toBeTruthy();
  });

  it('صوت + پیوستِ تصویری: آرت‌ورکِ کاور رندر می‌شود (سناریوی پادکست)', () => {
    const { container } = render(<TabyinStage attachments={[AUDIO, IMAGE]} title="قسمت سوم" />);
    // انتخابِ اولیه: صوت (ویدئو نیست و قبل از تصویر است)
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio!.getAttribute('src')).toBe(AUDIO.url);
    const cover = screen.getByAltText('قسمت سوم');
    expect(cover.getAttribute('src')).toBe(IMAGE.url);
  });

  it('چند پیوست: نوارِ بندانگشتی استیج را عوض می‌کند', () => {
    const { container } = render(
      <TabyinStage attachments={[VIDEO, IMAGE]} title="محتوای ترکیبی" />,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(2);
    // شروع با ویدئو
    expect(container.querySelector('video')).not.toBeNull();

    fireEvent.click(tabs[1]);
    expect(container.querySelector('video')).toBeNull();
    expect(screen.getByAltText('محتوای ترکیبی')).toBeTruthy();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('چیپِ ابرداده فقط برای مقادیرِ موجود رندر می‌شود', () => {
    render(<TabyinStage attachments={[VIDEO]} title="کلیپ" />);
    expect(screen.getByText('۷:۲۴')).toBeTruthy(); // ۴۴۴ ثانیه
    expect(screen.getByText('۱٫۴ مگابایت')).toBeTruthy();

    cleanup();
    const bare: TabyinStageAttachment = { url: IMAGE.url, media_type: 'image' };
    const { container } = render(<TabyinStage attachments={[bare]} title="بدون متا" />);
    expect(container.querySelector('.tabular-nums')).toBeNull();
  });

  it('ورودی تهی → هیچ‌چیز رندر نمی‌شود', () => {
    const { container } = render(<TabyinStage attachments={[]} title="خالی" />);
    expect(container.firstChild).toBeNull();
  });

  it('هیچ لینکی به منبعِ خارجی رندر نمی‌شود — فقط href رسانه‌ی خودمان', () => {
    const { container } = render(<TabyinStage attachments={[VIDEO]} title="کلیپ" />);
    const anchors = Array.from(container.querySelectorAll('a[href]')).map((a) =>
      a.getAttribute('href'),
    );
    expect(anchors.every((h) => !h || !h.includes('armansky.ir/panel'))).toBe(true);
  });
});
