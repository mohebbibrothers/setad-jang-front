'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  FileText,
  FileWarning,
  Loader2,
  LockKeyhole,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const fa = (n: number) => n.toLocaleString('fa-IR');

/** مقیاس‌های بزرگ‌نماییِ نمایشگر (میلی‌مترِ قرارداد روی پایه‌ی fit-width). */
const ZOOM_STEPS = [0.75, 0.9, 1, 1.15, 1.35, 1.6] as const;

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
};
type PdfPage = {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: {
    canvasContext: CanvasRenderingContext2D;
    transform?: number[] | null;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void>; cancel: () => void };
};

type Props = {
  title: string;
  /** نشانیِ استریمِ امضاشده‌ی سند (از fetchLessonMedia → resolveMediaUrl). */
  url: string;
  onClose: () => void;
  /** اوّلین رندرِ موفقِ صفحه — سیگنالِ «سند واقعاً باز شد» برای گیتِ تکمیل. */
  onFirstRender?: () => void;
};

/**
 * نمایشگرِ درون‌صفحه‌ایِ سند — «میز مطالعه‌ی بعثت مردم».
 *
 * سند به‌صورت canvas رندر می‌شود (pdf.js)؛ نه <iframe> نه <object> — پس
 * تولباری با دکمه‌ی دانلود در کار نیست و لینکِ خام هم در DOM نیست. کانتکست‌منو
 * بسته است و واترمارکِ برند روی صفحه می‌نشیند تا اسکرین-ریدیریبیوشن کم‌جاذبه
 * شود. داده با همان نشانیِ استریمِ امضاشده‌ی کوتاه‌عمر گرفته می‌شود.
 */
export function LessonPdfViewer({ title, url, onClose, onFirstRender }: Props) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [zoomIdx, setZoomIdx] = useState(2); // ۱۰۰٪
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitWidth, setFitWidth] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const firstRenderFiredRef = useRef(false);
  const docRef = useRef<PdfDoc | null>(null);

  /* ── دانلودِ بایت‌ها (استریمِ امضاشده) و ساختِ سند ── */
  const boot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { credentials: 'omit', cache: 'no-store' });
      if (!res.ok) {
        throw new Error(
          res.status === 403
            ? 'نشستِ مطالعه منقضی شده است؛ صفحه را تازه‌سازی کن تا نشانیِ تازه بگیری.'
            : 'سند در دسترس نیست؛ کمی بعد دوباره تلاش کن.',
        );
      }
      const bytes = await res.arrayBuffer();
      // legacy بیلد: همان pdf.js اما بدون وابستگی به APIهای خیلی‌تازه‌ی مرورگر
      // (Map.getOrInsertComputed و…) که در کرومیوم‌های یکی‌دو نسخه‌ی قدیمی‌تر —
      // و بسیاری از موبایل‌های کاربران — نیست؛ رندر در آن‌ها بی‌صدا سفید می‌ماند.
      const pdfjs =
        (await import('pdfjs-dist/legacy/build/pdf.min.mjs')) as unknown as typeof import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
      const loaded = (await pdfjs.getDocument({ data: bytes }).promise) as unknown as PdfDoc;
      docRef.current = loaded;
      setDoc(loaded);
      setPageNo(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'در آماده‌سازی نمایشگر مشکلی پیش آمد.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void boot();
    return () => {
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      void docRef.current?.destroy();
      docRef.current = null;
    };
  }, [boot]);

  /* ── قفلِ اسکرولِ بدنه پشت اورلی ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ── عرضِ قابل‌استفاده برای fit-width ── */
  useEffect(() => {
    const measure = () => {
      const el = scrollRef.current;
      if (el) setFitWidth(Math.max(280, el.clientWidth - 48));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [doc]);

  /* ── رندرِ صفحه‌ی جاری ── */
  useEffect(() => {
    if (!doc || fitWidth <= 0) return;
    let cancelled = false;
    const paint = async () => {
      setRendering(true);
      try {
        const page = await doc.getPage(pageNo);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const base = page.getViewport({ scale: 1 });
        const scale = (fitWidth / base.width) * ZOOM_STEPS[zoomIdx];
        const viewport = page.getViewport({ scale });
        const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        renderTaskRef.current?.cancel();
        const task = page.render({
          canvasContext: ctx,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
          viewport,
        });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled) return;
        if (!firstRenderFiredRef.current) {
          firstRenderFiredRef.current = true;
          onFirstRender?.();
        }
      } catch (renderErr) {
        // لغوِ رندرِ قبلی (ورق‌زدن/زوم سریع) طبیعی است؛ اما شکستِ واقعیِ رندر
        // نباید بی‌صدا بگذرد — کاربر صفحه‌ی سفید می‌بیند و گیتِ «باز شد» قفل
        // می‌ماند. پس خطا را با دکمه‌ی تلاشِ دوباره نشان می‌دهیم.
        const isCancel =
          renderErr instanceof Error &&
          (renderErr.name === 'RenderingCancelledException' || /cancel/i.test(renderErr.message));
        if (!cancelled && !isCancel) {
          setError('این سند در نمایشگر باز نشد؛ با «تلاش دوباره» یک بار دیگر امتحان کن.');
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };
    void paint();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [doc, pageNo, zoomIdx, fitWidth, onFirstRender]);

  const total = doc?.numPages ?? 0;
  const goto = useCallback(
    (n: number) => {
      setPageNo(Math.min(total, Math.max(1, n)));
      scrollRef.current?.scrollTo({ top: 0 });
    },
    [total],
  );

  /* ── کیبورد: ESC بستن، جهت‌نما/صفحه‌بالا‌پایین ورق‌زدن ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown' || e.key === 'PageDown') goto(pageNo + 1);
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') goto(pageNo - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goto, onClose, pageNo]);

  const zoomPercent = Math.round(ZOOM_STEPS[zoomIdx] * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`نمایشگر سند — ${title}`}
      className="fixed inset-0 z-[80] flex flex-col bg-ink-950/95 backdrop-blur-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* نوارِ بالا — کرومِ برند */}
      <div className="relative border-b border-white/10 bg-ink-950/90">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 14px)',
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
            <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-white">{title}</p>
            <p className="flex items-center gap-1 text-[10px] font-bold text-white/40">
              <LockKeyhole className="h-3 w-3" aria-hidden="true" />
              میز مطالعه‌ی امن — فقط نمایش، بدون دانلود
            </p>
          </div>

          {doc && (
            <div className="flex items-center gap-1 rounded-full bg-white/[.06] p-1 ring-1 ring-white/10">
              <CtlBtn
                label="صفحه‌ی بعد"
                onClick={() => goto(pageNo + 1)}
                disabled={pageNo >= total}
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </CtlBtn>
              <span className="min-w-[72px] text-center text-[11px] font-black tabular-nums text-white/80">
                {fa(pageNo)} از {fa(total)}
              </span>
              <CtlBtn label="صفحه‌ی قبل" onClick={() => goto(pageNo - 1)} disabled={pageNo <= 1}>
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </CtlBtn>
              <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden="true" />
              <CtlBtn
                label="کوچک‌نمایی"
                onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
                disabled={zoomIdx <= 0}
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </CtlBtn>
              <span className="min-w-[40px] text-center text-[10px] font-black tabular-nums text-mint-300">
                {fa(zoomPercent)}٪
              </span>
              <CtlBtn
                label="بزرگ‌نمایی"
                onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                disabled={zoomIdx >= ZOOM_STEPS.length - 1}
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </CtlBtn>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن نمایشگر"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[.06] text-white/70 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* بدنه‌ی اسکرول‌شونده */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-6">
        {/* واترمارکِ محوِ برند — ردیابیِ اسکرین‌شات، بدونِ اذیتِ مطالعه */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-30deg, transparent 0 140px, rgba(20,184,166,.045) 140px 142px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 grid select-none place-items-center"
        >
          <p className="rotate-[-24deg] text-[26px] font-black tracking-[.25em] text-white/[.05]">
            بعثت مردم
          </p>
        </div>

        {loading && (
          <div className="grid min-h-[300px] place-items-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-mint-400" aria-hidden="true" />
              <p className="text-[12px] font-bold text-white/60">در حال آماده‌سازی میز مطالعه…</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="grid min-h-[300px] place-items-center">
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-gold-300">
                <FileWarning className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-[13px] font-bold leading-6 text-white/75">{error}</p>
              <button
                type="button"
                onClick={() => void boot()}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint-500 px-5 text-[12.5px] font-extrabold text-ink-950 transition hover:bg-mint-400"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                تلاش دوباره
              </button>
            </div>
          </div>
        )}

        {!loading && !error && doc && (
          <div className="relative mx-auto w-fit">
            {rendering && (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/80 px-3 py-1 text-[10px] font-bold text-white/70 ring-1 ring-white/10">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  در حال آماده‌سازی صفحه…
                </span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="block select-none rounded-[10px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.85)] ring-1 ring-black/40"
              data-testid="pdf-canvas"
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* نوارِ پایین — ناوبریِ بزرگِ موبایل */}
      {doc && total > 1 && (
        <div className="border-t border-white/10 bg-ink-950/90 px-4 py-2.5 sm:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-2">
            <MobileNavBtn
              onClick={() => goto(pageNo - 1)}
              disabled={pageNo <= 1}
              label="صفحه‌ی قبل"
            />
            <span className="text-[12px] font-black tabular-nums text-white/80">
              صفحه‌ی {fa(pageNo)} از {fa(total)}
            </span>
            <MobileNavBtn
              onClick={() => goto(pageNo + 1)}
              disabled={pageNo >= total}
              label="صفحه‌ی بعد"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CtlBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-7 w-7 place-items-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function MobileNavBtn({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 min-w-[104px] items-center justify-center rounded-full bg-white/[.06] px-4 text-[12px] font-extrabold text-white ring-1 ring-white/10 transition hover:bg-white/15 disabled:opacity-30"
    >
      {label}
    </button>
  );
}
