import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * MyStoriesManager — داشبوردِ «روایت‌های من» (/tabyin/mine):
 *   گیتِ احراز، آمار/فیلتر، کارت‌ها، و حلقه‌ی کاملِ حذف با تأیید.
 * (سرویس‌های لایه‌ی lib/studio موک می‌شوند تا تست به شبکه گره نخورد.)
 */

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetchAll: vi.fn(),
  fetchDetail: vi.fn(),
  deleteOne: vi.fn(),
  fetchConfig: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock('@/lib/use-auth', () => ({
  useAuth: () => mocks.auth(),
}));

vi.mock('@/lib/studio', async () => {
  const actual = await vi.importActual<typeof import('@/lib/studio')>('@/lib/studio');
  return {
    ...actual,
    fetchAllMySubmissions: (...args: unknown[]) => mocks.fetchAll(...args),
    fetchMySubmissionDetail: (...args: unknown[]) => mocks.fetchDetail(...args),
    deleteMySubmission: (...args: unknown[]) => mocks.deleteOne(...args),
    updateMySubmission: (...args: unknown[]) => mocks.updateOne(...args),
    fetchStudioUploadConfig: (...args: unknown[]) => mocks.fetchConfig(...args),
  };
});

import { STUDIO_UPLOAD_FALLBACK } from '@/lib/studio';
import { MyStoriesManager } from './MyStoriesManager';

const authed = () =>
  mocks.auth.mockReturnValue({
    isAuthenticated: true,
    loading: false,
    user: { id: 1, full_name: 'سارا محمدی', primary_identifier: 'sara@example.com' },
  });

const items = [
  {
    id: 11,
    external_id: 'ext-11',
    title: 'روایتِ بارانِ تهران',
    submission_status: 'approved',
    attachments_count: 2,
    created_at: '2026-08-20T10:00:00Z',
    admin_note: '',
  },
  {
    id: 12,
    external_id: 'ext-12',
    title: 'روایتِ صبحِ پایانه',
    submission_status: 'pending_review',
    attachments_count: 0,
    created_at: '2026-08-25T10:00:00Z',
    admin_note: '',
  },
];

describe('MyStoriesManager — گیتِ احراز و فهرست', () => {
  beforeEach(() => {
    authed();
    mocks.fetchAll.mockResolvedValue({ items, total: items.length });
    mocks.fetchConfig.mockResolvedValue(STUDIO_UPLOAD_FALLBACK);
    mocks.deleteOne.mockResolvedValue(null);
    mocks.fetchDetail.mockResolvedValue({
      id: 11,
      external_id: 'ext-11',
      title: 'روایتِ بارانِ تهران',
      description: 'شرحِ کاملِ روایتِ باران.',
      submission_status: 'approved',
      attachments: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('مهمان با پنلِ قفل روبه‌رو می‌شود', () => {
    mocks.auth.mockReturnValue({ isAuthenticated: false, loading: false, user: null });
    render(<MyStoriesManager />);
    expect(screen.getByText('برای دیدنِ روایت‌هایت وارد شو')).toBeTruthy();
    expect(mocks.fetchAll).not.toHaveBeenCalled();
  });

  it('فهرستِ خالی، وضعیتِ خالیِ دلگرم‌کننده می‌سازد', async () => {
    mocks.fetchAll.mockResolvedValue({ items: [], total: 0 });
    render(<MyStoriesManager />);
    await waitFor(() => expect(screen.getByText('هنوز روایتی ننوشته‌ای')).toBeTruthy());
  });

  it('کارت‌ها با آمارِ زنده‌ی وضعیت رندر می‌شوند', async () => {
    render(<MyStoriesManager />);
    await waitFor(() => expect(screen.getByText('روایتِ بارانِ تهران')).toBeTruthy());
    expect(screen.getByText('روایتِ صبحِ پایانه')).toBeTruthy();
    // آمار: همه=۲، منتشر=۱، درانتظار=۱
    expect(screen.getAllByText('۲').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('تأیید و منتشر شده').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('در انتظار بررسی').length).toBeGreaterThanOrEqual(1);
  });

  it('فیلترِ «منتشر شده» فقط کارتِ مرتبط را نگه می‌دارد', async () => {
    render(<MyStoriesManager />);
    await waitFor(() => expect(screen.getByText('روایتِ بارانِ تهران')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /منتشر شده/ }));
    // انیمیشنِ خروجِ framer-motion: کارت به‌صورت async از DOM می‌رود
    await waitFor(() => expect(screen.queryByText('روایتِ صبحِ پایانه')).toBeNull());
    expect(screen.getByText('روایتِ بارانِ تهران')).toBeTruthy();
  });

  it('جست‌وجو روی عنوان، فهرست را زنده محدود می‌کند', async () => {
    render(<MyStoriesManager />);
    await waitFor(() => expect(screen.getByText('روایتِ بارانِ تهران')).toBeTruthy());

    fireEvent.change(screen.getByLabelText('جست‌وجو در روایت‌های من'), {
      target: { value: 'پایانه' },
    });
    await waitFor(() => expect(screen.queryByText('روایتِ بارانِ تهران')).toBeNull());
    expect(screen.getByText('روایتِ صبحِ پایانه')).toBeTruthy();
  });
});

describe('MyStoriesManager — حلقه‌ی حذف با تأیید', () => {
  beforeEach(() => {
    authed();
    mocks.fetchAll.mockResolvedValue({ items, total: items.length });
    mocks.fetchConfig.mockResolvedValue(STUDIO_UPLOAD_FALLBACK);
    mocks.deleteOne.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('حذفِ تأییدشده، روایت را از فهرست می‌برد و toast می‌دهد', async () => {
    render(<MyStoriesManager />);
    await waitFor(() => expect(screen.getByText('روایتِ بارانِ تهران')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /حذف «روایتِ بارانِ تهران»/ }));
    await waitFor(() => expect(screen.getByText('روایت برای همیشه حذف شود؟')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /بله، حذف کن/ }));
    await waitFor(() => expect(mocks.deleteOne).toHaveBeenCalledWith(11));

    await waitFor(() => expect(screen.queryByText('روایتِ بارانِ تهران')).toBeNull());
    expect(screen.getByText(/برای همیشه حذف شد/)).toBeTruthy();
  });

  it('انصرافِ دیالوگ، هیچ حذفی نمی‌کند', async () => {
    render(<MyStoriesManager />);
    await waitFor(() => expect(screen.getByText('روایتِ بارانِ تهران')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /حذف «روایتِ بارانِ تهران»/ }));
    await waitFor(() => expect(screen.getByText('روایت برای همیشه حذف شود؟')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'انصراف' }));
    expect(mocks.deleteOne).not.toHaveBeenCalled();
    expect(screen.getByText('روایتِ بارانِ تهران')).toBeTruthy();
  });
});

describe('MyStoriesManager — مودالِ مشاهده', () => {
  beforeEach(() => {
    authed();
    mocks.fetchAll.mockResolvedValue({ items, total: items.length });
    mocks.fetchConfig.mockResolvedValue(STUDIO_UPLOAD_FALLBACK);
    mocks.fetchDetail.mockResolvedValue({
      id: 12,
      external_id: 'ext-12',
      title: 'روایتِ صبحِ پایانه',
      description: 'شرحِ کامل از صبحِ پایانه.',
      submission_status: 'pending_review',
      attachments: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('با «مشاهده»، مودالِ جزئیات با شرحِ کامل باز می‌شود', async () => {
    render(<MyStoriesManager />);
    await waitFor(() => expect(screen.getByText('روایتِ صبحِ پایانه')).toBeTruthy());

    const card = screen.getByText('روایتِ صبحِ پایانه').closest('article') as HTMLElement;
    const viewButton = Array.from(card.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('مشاهده'),
    ) as HTMLButtonElement;
    fireEvent.click(viewButton);

    await waitFor(() => expect(mocks.fetchDetail).toHaveBeenCalledWith(12));
    await waitFor(() => expect(screen.getByText('شرحِ کامل از صبحِ پایانه.')).toBeTruthy());
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
