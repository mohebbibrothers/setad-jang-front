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

/** پیش‌رندرِ صفحه‌ها کمی پیش از رسیدنِ کاربر — مطالعه‌ی پیوسته بدونِ لگ. */
const PRE_RENDER_MARGIN = '900px 0px';

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
  /** اوّلین رندرِ موفقِ صفحه‌ی ۱ — سیگنالِ «سند واقعاً باز شد» برای گیتِ تکمیل. */
  onFirstRender?: () => void;
};

function isRenderCancel(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'RenderingCancelledException' || /cancel/i.test(err.message))
  );
}

/**
 * نمایشگرِ درون‌صفحه‌ایِ سند — «میز مطالعه‌ی بعثت مردم».
 *
 * سند به‌صورت canvas رندر می‌شود (pdf.js)؛ نه <iframe> نه <object> — پس
 * تولباری با دکمه‌ی دانلود در کار نیست و لینکِ خام هم در DOM نیست. کانتکست‌منو
 * بسته است و واترمارکِ برند روی هر صفحه می‌نشیند تا اسکرین-ریدیریبیوشن
 * کم‌جاذبه شود. داده با همان نشانیِ استریمِ امضاشده‌ی کوتاه‌عمر گرفته می‌شود.
 *
 * مطالعه «پیوسته» است: همه‌ی صفحه‌ها پشت‌سرِهم در یک ستونِ اسکرول‌شونده
 * رندر می‌شوند و کاربر با اسکرولِ طبیعی (لمس/چرخِ موس) بین صفحه‌ها حرکت
 * می‌کند — مثل خواندنِ یک سندِ واقعی. دکمه‌ها و کیبورد هم هنوز کار می‌کنند،
 * اما به‌جای «جایگزین‌کردنِ صفحه»، روان به همان صفحه اسکرول می‌کنند و
 * نشانگرِ «N از M» زنده با جریانِ اسکرول به‌روز می‌شود. رندرِ هر صفحه با
 * IntersectionObserver تنبل است (فقط صفحه‌های نزدیک به دید) تا حافظه و CPU
 * در اسنادِ بلند هم آرام بماند.
 *
 * ریشه‌ی رندرِ تمیزِ متن: standardFontDataUrl و cMapUrl از مسیرِ خودِ سایت
 * (/vendor/… — کپیِ postinstall از همان نسخه‌ی نصب‌شده‌ی pdfjs-dist) داده
 * می‌شود تا اسنادی که فونت را embed نکرده‌اند با فونتِ استاندارد درست و
 * نگاشتِ یونیکدِ کامل رندر شوند، نه با fallbackِ سیستمیِ به‌هم‌ریخته.
 */
export function LessonPdfViewer({ title, url, onClose, onFirstRender }: Props) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [pageNo, setPageNo] = useState(1);
  const [zoomIdx, setZoomIdx] = useState(2); // ۱۰۰٪
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fitWidth, setFitWidth] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef(new Map<number, HTMLElement>());
  const pageNoRef = useRef(1);
  const firstRenderFiredRef = useRef(false);
  const docRef = useRef<PdfDoc | null>(null);
  const firstAspectRef = useRef(1.414); // نسبتِ A4 تا وقتی صفحه‌ی اول سنجیده شود

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
      const loaded = (await pdfjs.getDocument({
        data: bytes,
        // فونت‌ها و cMapها از دامنه‌ی خودمان — ریشه‌ی رفعِ «متنِ فارسیِ زشت»:
        // اسنادِ بدونِ فونتِ embedشده به‌جای fallbackِ سیستمیِ ناقص، با
        // فونتِ استانداردِ خودِ pdf.js و نگاشتِ یونیکدِ کامل رندر می‌شوند.
        standardFontDataUrl: '/vendor/pdf-fonts/',
        cMapUrl: '/vendor/pdf-cmaps/',
        cMapPacked: true,
        fontExtraProperties: true,
      }).promise) as unknown as PdfDoc;
      docRef.current = loaded;
      // نسبتِ ابعادِ صفحه‌ی اول به‌عنوان برآوردِ همه‌ی صفحه‌ها (اسکرولِ پایدار
      // پیش از رندر) — هر صفحه هنگامِ رندرِ واقعی اگر متفاوت بود اصلاح می‌شود.
      const first = await loaded.getPage(1);
      const vp = first.getViewport({ scale: 1 });
      if (vp.width > 0) firstAspectRef.current = vp.height / vp.width;
      setDoc(loaded);
      setPageNo(1);
      pageNoRef.current = 1;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'در آماده‌سازی نمایشگر مشکلی پیش آمد.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void boot();
    return () => {
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

  const total = doc?.numPages ?? 0;
  const pageWidth = fitWidth * ZOOM_STEPS[zoomIdx];

  /* ── اسکرولِ روان به یک صفحه ── */
  const scrollToPage = useCallback((n: number, smooth = true) => {
    const container = scrollRef.current;
    const el = pageRefs.current.get(n);
    if (!container || !el) return;
    const target = Math.max(
      0,
      container.scrollTop +
        (el.getBoundingClientRect().top - container.getBoundingClientRect().top) -
        10,
    );
    container.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
    if (smooth) {
      // محیط‌های prefers-reduced-motion انیمیشنِ smooth را بی‌صدا نادیده
      // می‌گیرند (scrollTo می‌ماند همان‌جا). اگر پس از یک نفسِ کوتاه اسکرول
      // نرسیده بود، دقیق و بدونِ انیمیشن به هدف می‌رویم — رفتارِ قطعی.
      window.setTimeout(() => {
        const sc = scrollRef.current;
        if (sc && Math.abs(sc.scrollTop - target) > 48) {
          sc.scrollTo({ top: target, behavior: 'auto' });
        }
      }, 650);
    }
  }, []);

  /* ناوبریِ صفحه: فقط اسکرول — نشانگرِ «N از M» را ردیابِ موقعیت (اسکرول‌لیسنر)
     می‌نویسد، نه منظِ ما. اگر اینجا خوش‌بینانه setPageNo کنیم و انیمیشنِ
     smooth وسطِ راه خفه شود (اسکرولِ هم‌زمانِ کاربر/برنامه)، جایگاه و
     نشانگر برای همیشه از هم جدا می‌مانند؛ اعتماد به موقعیت یعنی نشانگر
     همیشه حقیقت را می‌گوید — حتی با چرخِ موس و کشیدنِ اسکرول‌بار. */
  const goto = useCallback(
    (n: number) => {
      const clamped = Math.min(total, Math.max(1, n));
      scrollToPage(clamped);
    },
    [total, scrollToPage],
  );

  /* ── ردیابیِ زنده‌ی صفحه‌ی جاری از روی جریانِ اسکرول ── */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || total <= 0) return;
    let raf = 0;
    const syncFromScroll = () => {
      raf = 0;
      const probe = container.scrollTop + container.clientHeight * 0.35;
      const cTop = container.getBoundingClientRect().top;
      let current = total;
      for (let n = 1; n <= total; n += 1) {
        const el = pageRefs.current.get(n);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const start = container.scrollTop + (rect.top - cTop);
        if (start + rect.height > probe) {
          current = n;
          break;
        }
        current = n;
      }
      if (current !== pageNoRef.current) {
        pageNoRef.current = current;
        setPageNo(current);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(syncFromScroll);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [total]);

  /* ── کیبورد: ESC بستن، جهت‌نما/صفحه‌بالا‌پایین حرکت بین صفحه‌ها ──
     preventDefault حیاتی است: پیش‌فرضِ مرورگر برای ArrowDown/Up اسکرولِ خطیِ
     همان کانتینر است که انیمیشنِ smoothِ برنامه‌ریزی‌شده‌ی ما را وسطِ راه
     لغو (وکیل) می‌کند — نتیجه: نشانگر جابه‌جا می‌شد ولی صفحه نمی‌رفت. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goto(pageNo + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goto(pageNo - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goto, onClose, pageNo]);

  /* ── زوم: بعد از اعمال، همان صفحه‌ی جاری را در دید نگه می‌داریم ── */
  const changeZoom = useCallback(
    (nextIdx: number) => {
      const clamped = Math.min(ZOOM_STEPS.length - 1, Math.max(0, nextIdx));
      if (clamped === zoomIdx) return;
      const anchor = pageNoRef.current;
      setZoomIdx(clamped);
      // صبر تا لِی‌اوتِ جدید بنشیند، بعد لنگرِ صفحه‌ی جاری (بدونِانیمیشن، دقیق).
      requestAnimationFrame(() => scrollToPage(anchor, false));
    },
    [zoomIdx, scrollToPage],
  );

  /* onFirstRender را در ref نگه می‌داریم: والد (LessonTextStage) آن را به‌صورت
     لامبدای تازه می‌دهد؛ اگر مستقیم در deps بنشیند، هر رندرِ والد هندلرِ
     نقاشی را عوض می‌کند، افکتِ رندرِ صفحه‌ی ۱ لغو/تکرار می‌شود و سیگنالِ
     «سند باز شد» (media_opened) هرگز روی سیم نمی‌رود. با ref، هویتِ
     هندلر برای همیشه پایدار است و آخرین نسخه‌ی کال‌بک فراخوانی می‌شود. */
  const onFirstRenderRef = useRef(onFirstRender);
  useEffect(() => {
    onFirstRenderRef.current = onFirstRender;
  });

  const handlePainted = useCallback((n: number) => {
    if (n === 1 && !firstRenderFiredRef.current) {
      firstRenderFiredRef.current = true;
      onFirstRenderRef.current?.();
    }
  }, []);

  const registerPage = useCallback((n: number, el: HTMLElement | null) => {
    if (el) pageRefs.current.set(n, el);
    else pageRefs.current.delete(n);
  }, []);

  const zoomPercent = Math.round(ZOOM_STEPS[zoomIdx] * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`نمایشگر سند — ${title}`}
      className="fixed inset-0 z-[80] flex flex-col bg-ink-950/95 backdrop-blur-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* هَچِ موربِ برند — ثابت روی کلِ دیالوگ، پشتِ صفحه‌ها */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-30deg, transparent 0 140px, rgba(20,184,166,.045) 140px 142px)',
        }}
      />

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
              <span
                className="min-w-[72px] text-center text-[11px] font-black tabular-nums text-white/80"
                aria-live="polite"
              >
                {fa(pageNo)} از {fa(total)}
              </span>
              <CtlBtn label="صفحه‌ی قبل" onClick={() => goto(pageNo - 1)} disabled={pageNo <= 1}>
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </CtlBtn>
              <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden="true" />
              <CtlBtn
                label="کوچک‌نمایی"
                onClick={() => changeZoom(zoomIdx - 1)}
                disabled={zoomIdx <= 0}
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </CtlBtn>
              <span className="min-w-[40px] text-center text-[10px] font-black tabular-nums text-mint-300">
                {fa(zoomPercent)}٪
              </span>
              <CtlBtn
                label="بزرگ‌نمایی"
                onClick={() => changeZoom(zoomIdx + 1)}
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

      {/* بسترِ اسکرولِ پیوسته — همه‌ی صفحه‌ها پشت‌سرِهم */}
      <div
        ref={scrollRef}
        data-testid="pdf-scroll"
        className="qa-scroll relative flex-1 overflow-y-auto overscroll-contain px-4 py-6"
      >
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

        {!loading && !error && doc && fitWidth > 0 && (
          <div className="relative mx-auto flex w-fit flex-col items-stretch gap-6">
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
              <PdfPageView
                key={n}
                doc={doc}
                pageNumber={n}
                totalPages={total}
                cssWidth={pageWidth}
                fallbackAspect={firstAspectRef.current}
                registerRef={registerPage}
                onPainted={handlePainted}
              />
            ))}
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

/* ─────────────────────────── یک صفحه‌ی سند ─────────────────────────── */

function PdfPageView({
  doc,
  pageNumber,
  totalPages,
  cssWidth,
  fallbackAspect,
  registerRef,
  onPainted,
}: {
  doc: PdfDoc;
  pageNumber: number;
  totalPages: number;
  cssWidth: number;
  fallbackAspect: number;
  registerRef: (n: number, el: HTMLElement | null) => void;
  onPainted: (n: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const taskRef = useRef<{ cancel: () => void } | null>(null);
  const lastWidthRef = useRef(0);
  const [near, setNear] = useState(false);
  // وضعیتِ رندر هم state (برای UI) هم ref (برای گاردِ افکت) است: اگر status
  // در deps افکتِ رندر می‌بود، setStatus('rendering') در همان افکت، افکت را
  // دوباره اجرا و رندرِ درپرواز را وسطِ کار لغو می‌کرد — قفلِ ابدیِ
  // skeleton و نرسیدنِ سیگنالِ media_opened.
  const [status, setStatusState] = useState<'idle' | 'rendering' | 'done' | 'error'>('idle');
  const statusRef = useRef<'idle' | 'rendering' | 'done' | 'error'>('idle');
  const setStatus = useCallback((s: 'idle' | 'rendering' | 'done' | 'error') => {
    statusRef.current = s;
    setStatusState(s);
  }, []);
  const [aspect, setAspect] = useState(fallbackAspect);
  const aspectRef = useRef(fallbackAspect);

  /* ثبت/لغویِ ref برای ناوبریِ scrollToPage و ردیابیِ صفحه‌ی جاری */
  useEffect(() => {
    registerRef(pageNumber, wrapRef.current);
    return () => registerRef(pageNumber, null);
  }, [pageNumber, registerRef]);

  /* رصدِ نزدیک‌شدن به دید — رندرِ تنبل */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === el && entry.isIntersecting) setNear(true);
        }
      },
      { root: null, rootMargin: PRE_RENDER_MARGIN },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* اگر عرض عوض شد (زوم/ریسایز)، بیت‌مپِ رندرشده کهنه است → بازنشانی به idle.
     نزدیک‌به‌دید؟ افکتِ رندر بلافاصله دوباره نقاشی می‌کند؛ دور از دید؟ بیت‌مپ
     آزاد می‌شود تا حافظه در اسنادِ بلند آرام بماند و ورودِ بعدی تازه رندر شود. */
  useEffect(() => {
    if (status !== 'done' || lastWidthRef.current === cssWidth) return;
    taskRef.current?.cancel();
    if (!near) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
    setStatus('idle');
  }, [near, status, cssWidth, setStatus]);

  /* رندرِ واقعیِ صفحه وقتی نزدیک به دید است. توجه: status عمداً در deps نیست —
     گارد از statusRef خوانده می‌شود تا setStatus درونِ خودِ افکت، افکت را
     بازنشانی نکند. cleanup هر لغوِ درپرواز را به idle برمی‌گرداند تا اجرای
     بعدیِ افکت (deps تازه) رندر را از سر بگیرد. */
  useEffect(() => {
    if (!near || statusRef.current !== 'idle' || cssWidth <= 0) return;
    let cancelled = false;
    const paint = async () => {
      setStatus('rendering');
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const base = page.getViewport({ scale: 1 });
        const realAspect = base.height / base.width;
        if (Math.abs(realAspect - aspectRef.current) > 0.01) {
          aspectRef.current = realAspect;
          setAspect(realAspect);
        }
        const scale = cssWidth / base.width;
        const viewport = page.getViewport({ scale });
        const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        taskRef.current?.cancel();
        const task = page.render({
          canvasContext: ctx,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
          viewport,
        });
        taskRef.current = task;
        await task.promise;
        taskRef.current = null;
        if (cancelled) return;
        lastWidthRef.current = cssWidth;
        setStatus('done');
        onPainted(pageNumber);
      } catch (renderErr) {
        // شکستِ واقعیِ رندر نباید بی‌صدا بگذرد — کاربر صفحه‌ی سفید می‌بیند و
        // گیتِ «باز شد» قفل می‌ماند؛ پس خطا به‌همراهِ تلاشِ دوباره نشان داده
        // می‌شود. (لغوِ رندرِ قبلی هنگامِ زوم/اسکرولِ سریع طبیعی است.)
        if (!cancelled && !isRenderCancel(renderErr)) setStatus('error');
        else if (!cancelled && statusRef.current === 'rendering') setStatus('idle');
      }
    };
    void paint();
    return () => {
      cancelled = true;
      taskRef.current?.cancel();
      taskRef.current = null;
      if (statusRef.current === 'rendering') setStatus('idle');
    };
  }, [near, cssWidth, doc, pageNumber, onPainted, setStatus]);

  return (
    <figure
      ref={wrapRef}
      data-page={pageNumber}
      className="relative mx-auto select-none"
      style={{ width: `${Math.floor(cssWidth)}px` }}
    >
      <div className="relative" style={{ aspectRatio: `1 / ${aspect}` }}>
        <canvas
          ref={canvasRef}
          data-testid={pageNumber === 1 ? 'pdf-canvas' : `pdf-page-${pageNumber}`}
          className="block h-full w-full select-none rounded-[10px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.85)] ring-1 ring-black/40"
          draggable={false}
        />
        {/* واترمارکِ برند روی هر صفحه — مهرِ «بعثت مردم» روی برگه‌ی مطالعه */}
        {status === 'done' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid select-none place-items-center overflow-hidden rounded-[10px]"
          >
            <p className="rotate-[-24deg] text-[26px] font-black tracking-[.25em] text-ink-950/[.07]">
              بعثت مردم
            </p>
          </div>
        )}
        {(status === 'idle' || status === 'rendering') && (
          <div className="absolute inset-0 grid place-items-center rounded-[10px] bg-white/[.04] ring-1 ring-white/10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/80 px-3 py-1 text-[10px] font-bold text-white/70 ring-1 ring-white/10">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              {status === 'rendering' ? 'در حال آماده‌سازی صفحه…' : 'به‌زودی اینجا می‌رسد…'}
            </span>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 grid place-items-center rounded-[10px] bg-white/[.04] ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="inline-flex items-center gap-1.5 rounded-full bg-mint-500 px-4 py-2 text-[11px] font-extrabold text-ink-950 transition hover:bg-mint-400"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              این صفحه باز نشد — تلاش دوباره
            </button>
          </div>
        )}
      </div>
      <figcaption className="mt-2 text-center text-[10px] font-bold tabular-nums text-white/30">
        صفحه‌ی {fa(pageNumber)} از {fa(totalPages)}
      </figcaption>
    </figure>
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
