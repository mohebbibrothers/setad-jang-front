import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiFetch,
  apiFetchResult,
  firstErrorMessage,
  isApiError,
} from './api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('API transport', () => {
  it('unwraps the standard backend envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      success: true,
      status_code: 200,
      message: 'ok',
      data: { id: 42 },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch<{ id: number }>('/example/')).resolves.toEqual({ id: 42 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://besat.me/api/v1/example/',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('keeps envelope metadata for no-data actions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      success: true,
      status_code: 200,
      message: 'انجام شد.',
      data: null,
    })));

    await expect(apiFetchResult<null>('/action/')).resolves.toMatchObject({
      data: null,
      message: 'انجام شد.',
      statusCode: 200,
    });
  });

  it('accepts raw health payloads outside the product envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' })));
    await expect(apiFetch<{ status: string }>('/health/')).resolves.toEqual({ status: 'ok' });
  });

  it('throws a structured ApiError for backend errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      success: false,
      status_code: 422,
      message: 'ورودی نامعتبر است.',
      errors: { identifier: ['شناسه نامعتبر است.'] },
    }, 422)));

    await expect(apiFetch('/invalid/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'ورودی نامعتبر است.',
    });
  });

  it('turns network failures into status-zero errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(apiFetch('/offline/')).rejects.toMatchObject({ status: 0 });
  });

  it('preserves caller aborts for cancellable live search', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')));
    const controller = new AbortController();
    controller.abort();
    await expect(apiFetch('/search/', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});

describe('API errors', () => {
  it('recognises ApiError instances', () => {
    expect(isApiError(new ApiError('bad request', 400))).toBe(true);
    expect(isApiError(new Error('bad request'))).toBe(false);
  });

  it('extracts nested DRF serializer messages', () => {
    const error = new ApiError('invalid', 400, {
      profile: { national_code: ['کد ملی نامعتبر است.'] },
    });
    expect(firstErrorMessage(error)).toBe('کد ملی نامعتبر است.');
  });

  it('falls back to the envelope message', () => {
    expect(firstErrorMessage(new ApiError('دسترسی ندارید.', 403))).toBe('دسترسی ندارید.');
  });
});
