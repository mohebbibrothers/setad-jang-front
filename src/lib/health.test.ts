import { beforeEach, describe, expect, it, vi } from 'vitest';

/** پروب سلامت بک‌اند — هم مسیر endpoint مهم است هم رفتار fail-safe (null). */

const apiFetchMock = vi.fn();
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return { ...actual, apiFetch: (path: string, init?: unknown) => apiFetchMock(path, init) };
});

import { checkLiveness, checkReadiness } from './health';

const READY = { status: 'ok', checks: { db: { status: 'ok' } } };

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('checkLiveness', () => {
  it('GET /health/ بدون احراز و بدون کش', async () => {
    apiFetchMock.mockResolvedValue({ status: 'ok' });
    expect(await checkLiveness()).toEqual({ status: 'ok' });
    const [path, init] = apiFetchMock.mock.calls[0];
    expect(path).toBe('/health/');
    expect((init as { skipAuth?: boolean }).skipAuth).toBe(true);
  });

  it('خطا → null (هرگز throw نمی‌کند)', async () => {
    apiFetchMock.mockRejectedValue(new Error('down'));
    expect(await checkLiveness()).toBeNull();
  });
});

describe('checkReadiness', () => {
  it('GET /health/ready/', async () => {
    apiFetchMock.mockResolvedValue(READY);
    expect(await checkReadiness()).toEqual(READY);
    expect(apiFetchMock.mock.calls[0][0]).toBe('/health/ready/');
  });

  it('خطا → null', async () => {
    apiFetchMock.mockRejectedValue(new Error('db down'));
    expect(await checkReadiness()).toBeNull();
  });
});
