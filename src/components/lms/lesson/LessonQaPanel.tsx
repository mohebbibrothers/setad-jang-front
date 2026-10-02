'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronDown,
  CornerDownLeft,
  Flag,
  Loader2,
  Lock,
  MessageCircleQuestion,
  Pin,
  Reply,
  Send,
  ShieldAlert,
} from 'lucide-react';

import {
  fetchLessonQuestions,
  postAcceptAnswer,
  postAnswerReport,
  postLessonQuestion,
  postQuestionAnswer,
  postQuestionReport,
  type LessonQuestion,
  type LessonQuestionAnswer,
} from '@/lib/lms-lesson';
import { useAuth } from '@/lib/use-auth';

const fa = (n: number) => n.toLocaleString('fa-IR');

type LoadState =
  | { kind: 'boot' }
  | { kind: 'questions'; items: LessonQuestion[]; total: number; page: number }
  | { kind: 'locked' }
  | { kind: 'error' };

type ReportTarget = { kind: 'question'; id: number } | { kind: 'answer'; id: number } | null;

const REPORT_REASONS = ['توهین یا برچسب‌زنی', 'تبلیغات یا اسپم', 'محتوای نامرتبط', 'چیزِ دیگر'];

type Props = {
  lessonId: number;
  enrolled: boolean;
  isGuest: boolean;
  onLogin: () => void;
  onEnroll: () => void;
};

function timeAgoFa(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'همین حالا';
  if (min < 60) return `${fa(min)} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${fa(hr)} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${fa(day)} روز پیش`;
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(t);
}

/** حرفِ اولِ نام برای آواتارهای متنی. */
function initialOf(name: string): string {
  const ch = name.trim().charAt(0);
  return ch || '؟';
}

/**
 * پنلِ گفتگوی جلسه — کلاس‌درسِ کوچکِ زیرِ هر جلسه:
 * پرسیدن، پاسخ‌دادن به پرسشِ دیگران، و «رد» (reply) زیرِ هر پاسخ — مثل
 * یوتیوب با یک سطح تودرتو و زنجیره‌ی نمایشیِ «در پاسخ به …». قبولِ پاسخ
 * برای صاحبِ پرسش، گزارشِ تخلف روی هر پرسش/پاسخ، و بارگذاریِ صفحه‌به‌صفحه.
 */
export function LessonQaPanel({ lessonId, enrolled, isGuest, onLogin, onEnroll }: Props) {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: 'boot' });
  const [openId, setOpenId] = useState<number | null>(null);
  const [askTitle, setAskTitle] = useState('');
  const [askBody, setAskBody] = useState('');
  const [askBusy, setAskBusy] = useState(false);
  const [askErr, setAskErr] = useState<string | null>(null);
  const [askDone, setAskDone] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const canSee = enrolled;
  const load = useCallback(
    async (page = 1, append = false) => {
      if (!canSee) return;
      const res = await fetchLessonQuestions(lessonId, page);
      if (!alive.current) return;
      if (res.kind === 'ok') {
        setState((prev) => {
          const prevItems = append && prev.kind === 'questions' && page > 1 ? prev.items : [];
          return {
            kind: 'questions',
            items: [...prevItems, ...res.questions],
            total: res.total,
            page,
          };
        });
      } else if (res.kind === 'forbidden') setState({ kind: 'locked' });
      else setState({ kind: 'error' });
    },
    [canSee, lessonId],
  );

  useEffect(() => {
    if (canSee) void load();
  }, [canSee, load]);

  const reload = useCallback(() => void load(1, false), [load]);

  const ask = useCallback(async () => {
    const title = askTitle.trim();
    const body = askBody.trim();
    if (title.length < 5) {
      setAskErr('عنوان پرسش باید حداقل ۵ حرف باشد.');
      return;
    }
    if (body.length < 10) {
      setAskErr('متن پرسش باید حداقل ۱۰ حرف باشد.');
      return;
    }
    setAskBusy(true);
    setAskErr(null);
    const created = await postLessonQuestion(lessonId, { title, body });
    setAskBusy(false);
    if (!alive.current) return;
    if (created) {
      setAskTitle('');
      setAskBody('');
      setAskDone(true);
      setOpenId(created.id);
      setState((prev) =>
        prev.kind === 'questions'
          ? { ...prev, items: [created, ...prev.items], total: prev.total + 1 }
          : { kind: 'questions', items: [created], total: 1, page: 1 },
      );
      window.setTimeout(() => alive.current && setAskDone(false), 4000);
    } else {
      setAskErr('پرسش ثبت نشد؛ دوباره تلاش کن.');
    }
  }, [askBody, askTitle, lessonId]);

  const loadMore = useCallback(async () => {
    if (state.kind !== 'questions') return;
    setMoreBusy(true);
    await load(state.page + 1, true);
    if (alive.current) setMoreBusy(false);
  }, [load, state]);

  /* ── حالت‌های قفل ── */
  if (!enrolled) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-[14px] font-black text-ink-700">
          پرسش‌وپاسخ ویژه‌ی {isGuest ? 'کاربران واردشده و ' : ''}ثبت‌نام‌شده‌های کلاس است
        </p>
        <p className="mt-1 max-w-sm text-[12px] leading-6 text-ink-400">
          هر جلسه یک کلاس‌درسِ کوچک است؛ اینجا از مدرس و همراهان می‌توانی بپرسی و زیرِ پاسخِ
          همکلاسی‌ها گفتگو کنی.
        </p>
        {isGuest ? (
          <button
            type="button"
            onClick={onLogin}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-mint-500 px-6 text-[12.5px] font-extrabold text-ink-950 transition hover:bg-mint-400"
          >
            ورود | ثبت‌نام
          </button>
        ) : (
          <button
            type="button"
            onClick={onEnroll}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-mint-500 px-6 text-[12.5px] font-extrabold text-ink-950 transition hover:bg-mint-400"
          >
            ثبت‌نام رایگان در کلاس
          </button>
        )}
      </div>
    );
  }

  const questions = state.kind === 'questions' ? state.items : [];
  const remaining = state.kind === 'questions' ? state.total - state.items.length : 0;

  return (
    <div className="space-y-5">
      {/* فرم پرسیدن */}
      <div className="rounded-2xl border border-ink-100 bg-white p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-[13px] font-black text-ink-800">
          <MessageCircleQuestion className="h-4 w-4 text-brand-600" aria-hidden="true" />
          پرسش جدید درباره‌ی این جلسه
        </p>
        <input
          value={askTitle}
          onChange={(e) => setAskTitle(e.target.value)}
          placeholder="عنوان کوتاه پرسش (حداقل ۵ حرف)…"
          maxLength={255}
          className="mt-3 h-11 w-full rounded-xl border border-ink-100 bg-ink-50/50 px-3.5 text-[13px] font-bold text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        <textarea
          value={askBody}
          onChange={(e) => setAskBody(e.target.value)}
          placeholder="متن پرسش…"
          rows={3}
          className="mt-2 w-full rounded-xl border border-ink-100 bg-ink-50/50 px-3.5 py-2.5 text-[13px] font-bold leading-7 text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        {askErr && <p className="mt-1.5 text-[11.5px] font-bold text-red-600">{askErr}</p>}
        {askDone && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-mint-700">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            پرسشت ثبت شد ✓
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void ask()}
            disabled={askBusy}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-[12.5px] font-extrabold text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-60"
          >
            {askBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            ثبت پرسش
          </button>
        </div>
      </div>

      {/* فهرست */}
      {state.kind === 'boot' && (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-ink-100 bg-white p-4">
              <div className="h-3.5 w-2/3 rounded bg-ink-100" />
              <div className="mt-2 h-2.5 w-1/3 rounded bg-ink-50" />
            </div>
          ))}
        </div>
      )}
      {state.kind === 'error' && (
        <p className="py-6 text-center text-[12.5px] font-bold text-ink-400">
          در دریافت پرسش‌ها مشکلی پیش آمد.
        </p>
      )}
      {state.kind === 'questions' && questions.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-8 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-500">
            <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-[13px] font-black text-ink-700">
            هنوز پرسشی نیست — اولین نفر باش!
          </p>
          <p className="mt-1 text-[11.5px] text-ink-400">
            هر ابهامی درباره‌ی همین جلسه داری، بپرس؛ مدرس و همراهان جواب می‌دهند.
          </p>
        </div>
      )}
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          q={q}
          open={openId === q.id}
          onToggle={() => setOpenId(openId === q.id ? null : q.id)}
          onChanged={reload}
          currentUserId={
            user?.id != null && !Number.isNaN(Number(user.id)) ? Number(user.id) : null
          }
        />
      ))}
      {remaining > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={moreBusy}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-ink-100 bg-white px-5 text-[12px] font-extrabold text-ink-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700 disabled:opacity-60"
          >
            {moreBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            پرسش‌های بیشتر ({fa(remaining)} مانده)
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════ کارتِ یک پرسش + درختِ پاسخ ═══════════ */

function QuestionCard({
  q,
  open,
  onToggle,
  onChanged,
  currentUserId,
}: {
  q: LessonQuestion;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
  currentUserId: number | null;
}) {
  const [askDraft, setAskDraft] = useState('');
  const [askBusy, setAskBusy] = useState(false);
  const isMine = currentUserId != null && q.user_id === currentUserId;

  const submitAnswer = useCallback(async () => {
    const text = askDraft.trim();
    if (text.length < 5) return;
    setAskBusy(true);
    const created = await postQuestionAnswer(q.id, text);
    setAskBusy(false);
    if (created) {
      setAskDraft('');
      onChanged();
    }
  }, [askDraft, onChanged, q.id]);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition hover:bg-ink-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
      >
        <span
          className={`grid h-9 w-9 shrink-0 select-none place-items-center rounded-full text-[13px] font-black ${isMine ? 'bg-mint-100 text-mint-800' : 'bg-ink-50 text-ink-500'}`}
        >
          {initialOf(q.user_display)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[13px] font-black text-ink-800">{q.title}</span>
            {q.is_pinned && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-50 px-2 py-0.5 text-[9.5px] font-extrabold text-gold-700">
                <Pin className="h-2.5 w-2.5" aria-hidden="true" />
                سنجاق
              </span>
            )}
            {q.is_answered && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-mint-50 px-2 py-0.5 text-[9.5px] font-extrabold text-mint-700">
                <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
                پاسخ داده شد
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[10.5px] font-bold text-ink-400">
            {q.user_display} • {fa(q.answer_count)} پاسخ
            {timeAgoFa(q.last_activity_at) && <> • {timeAgoFa(q.last_activity_at)}</>}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-300 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-ink-100 bg-ink-50/40 px-3.5 py-4 sm:px-4">
          {/* متنِ پرسش + اکشن‌ها */}
          <div className="rounded-xl bg-white px-3.5 py-3 ring-1 ring-ink-100/70">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-bold leading-7 text-ink-700">{q.body}</p>
              {!isMine && (
                <ReportMenu target={{ kind: 'question', id: q.id }} className="shrink-0" />
              )}
            </div>
          </div>

          {/* درختِ پاسخ‌ها */}
          <div className="mt-3.5 space-y-3">
            {q.answers.length === 0 && (
              <p className="text-[11.5px] font-bold text-ink-400">
                هنوز پاسخی نیست — اولین پاسخ را تو بنویس.
              </p>
            )}
            {q.answers.map((a) => (
              <AnswerNode
                key={a.id}
                answer={a}
                question={q}
                isQuestionMine={isMine}
                currentUserId={currentUserId}
                onChanged={onChanged}
                depth={0}
              />
            ))}
          </div>

          {/* پاسخ به خودِ پرسش — برای همه‌ی اعضای کلاس (از جمله صاحبِ پرسش) */}
          <div className="mt-4 flex items-start gap-2">
            <textarea
              value={askDraft}
              onChange={(e) => setAskDraft(e.target.value)}
              placeholder={
                isMine ? 'توضیح/پاسخ تکمیلی درباره‌ی پرسشت…' : 'تو هم می‌توانی پاسخ بدهی…'
              }
              rows={2}
              className="min-w-0 flex-1 rounded-xl border border-ink-100 bg-white px-3 py-2 text-[12px] font-bold leading-6 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              disabled={askBusy || askDraft.trim().length < 5}
              onClick={() => void submitAnswer()}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-brand-600 px-4 text-[11.5px] font-extrabold text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {askBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              ارسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ گرهِ پاسخ (+ ردهایش) ═══════════ */

function AnswerNode({
  answer,
  question,
  isQuestionMine,
  currentUserId,
  onChanged,
  depth,
}: {
  answer: LessonQuestionAnswer;
  question: LessonQuestion;
  isQuestionMine: boolean;
  currentUserId: number | null;
  onChanged: () => void;
  depth: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const isReply = answer.parent_id != null;
  const mine = currentUserId != null && answer.user_id === currentUserId;

  const submitReply = useCallback(async () => {
    const text = draft.trim();
    if (text.length < 5) return;
    setBusy(true);
    const created = await postQuestionAnswer(question.id, text, answer.id);
    setBusy(false);
    if (created) {
      setDraft('');
      setReplyOpen(false);
      onChanged();
    }
  }, [answer.id, draft, onChanged, question.id]);

  const accept = useCallback(async () => {
    setAccepting(true);
    const ok = await postAcceptAnswer(question.id, answer.id);
    setAccepting(false);
    if (ok) onChanged();
  }, [answer.id, onChanged, question.id]);

  return (
    <div className={isReply ? 'relative ps-6 sm:ps-8' : ''}>
      {/* راهنمایِ بصریِ تودرتو (آکولادِ گفتگو) */}
      {isReply && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-4 h-[calc(100%-22px)] w-4 rounded-tr-xl border-r-2 border-t-2 border-mint-200/80"
        />
      )}
      <div
        className={`rounded-xl border p-3.5 ${
          answer.is_instructor_answer
            ? 'border-brand-200 bg-brand-50/60'
            : 'border-ink-100 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`grid h-6 w-6 select-none place-items-center rounded-full text-[10px] font-black ${
              answer.is_instructor_answer
                ? 'bg-brand-600 text-white'
                : 'bg-ink-50 text-ink-500 ring-1 ring-ink-100'
            }`}
          >
            {initialOf(answer.user_display)}
          </span>
          <span
            className={`text-[11px] font-black ${answer.is_instructor_answer ? 'text-brand-700' : 'text-ink-500'}`}
          >
            {answer.user_display}
          </span>
          {answer.is_instructor_answer && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
              پاسخ استاد
            </span>
          )}
          {answer.is_accepted && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-mint-100 px-2 py-0.5 text-[9px] font-extrabold text-mint-800">
              <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
              پاسخ پذیرفته‌شده
            </span>
          )}
          {timeAgoFa(answer.created_at) && (
            <span className="text-[9.5px] font-bold text-ink-300">
              {timeAgoFa(answer.created_at)}
            </span>
          )}
        </div>

        {answer.reply_to_display && (
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-mint-50 px-2 py-0.5 text-[9.5px] font-extrabold text-mint-800 ring-1 ring-mint-100">
            <CornerDownLeft className="h-2.5 w-2.5" aria-hidden="true" />
            در پاسخ به {answer.reply_to_display}
          </p>
        )}

        <p className="mt-1.5 text-[12.5px] font-bold leading-6 text-ink-700">{answer.body}</p>

        {/* اکشن‌ها: پاسخ (رد) + قبول + گزارش */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReplyOpen((v) => !v)}
            aria-expanded={replyOpen}
            className="inline-flex items-center gap-1 rounded-full border border-ink-100 bg-white px-2.5 py-1 text-[10px] font-extrabold text-ink-500 transition hover:border-mint-300 hover:text-mint-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
          >
            <Reply className="h-3 w-3 rtl:-scale-x-100" aria-hidden="true" />
            {replyOpen ? 'بستن' : 'پاسخ'}
          </button>
          {isQuestionMine && !answer.is_accepted && (
            <button
              type="button"
              onClick={() => void accept()}
              disabled={accepting}
              className="inline-flex items-center gap-1 rounded-full border border-mint-200 bg-mint-50 px-2.5 py-1 text-[10px] font-extrabold text-mint-800 transition hover:bg-mint-100 disabled:opacity-60"
            >
              {accepting ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-3 w-3" aria-hidden="true" />
              )}
              این پاسخ مشکل من را حل کرد
            </button>
          )}
          {!mine && <ReportMenu target={{ kind: 'answer', id: answer.id }} />}
        </div>

        {/* کمپوزرِ رد */}
        {replyOpen && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-ink-50/70 p-2.5 ring-1 ring-ink-100/70">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`رد تو به ${answer.user_display}…`}
              rows={2}
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-ink-100 bg-white px-3 py-2 text-[12px] font-bold leading-6 outline-none transition focus:border-mint-300 focus:ring-2 focus:ring-mint-100"
            />
            <button
              type="button"
              disabled={busy || draft.trim().length < 5}
              onClick={() => void submitReply()}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-mint-600 px-3.5 text-[11px] font-extrabold text-white transition hover:bg-mint-500 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              رد
            </button>
          </div>
        )}
      </div>

      {/* ردهای زیرِ این پاسخ */}
      {depth === 0 && answer.replies.length > 0 && (
        <div className="mt-2.5 space-y-2.5">
          {answer.replies.map((child) => (
            <AnswerNode
              key={child.id}
              answer={child}
              question={question}
              isQuestionMine={isQuestionMine}
              currentUserId={currentUserId}
              onChanged={onChanged}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ منوی گزارشِ تخلف ═══════════ */

const POPOVER_W = 224; // w-56
const POPOVER_MAX_H = 200;

/**
 * پاپ‌اورِ گزارش با موقعیتِ fixed محاسبه‌شده از روی مستطیلِ دکمه — کارتِ پرسش
 * `overflow-hidden` دارد و هر absoluteِ داخلش در دکمه‌های بالای کارت بریده
 * می‌شد (چیپ‌های دلیل و دکمه‌ی ارسال ناپدید می‌شدند). fixed از آن قید آزاد
 * است؛ جا نبود بالا، پایین باز می‌شود و افقاً در ویوپورت گیر می‌خورد.
 */
function ReportMenu({
  target,
  className = '',
}: {
  target: NonNullable<ReportTarget>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const compute = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      // در RTL لبه‌ی راستِ پاپ‌اور به دکمه می‌چسبد؛ سپس داخلِ ویوپورت گیر می‌خورد
      let left = r.right - POPOVER_W;
      left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_W - 8));
      let top = r.top - POPOVER_MAX_H - 8;
      if (top < 8) top = r.bottom + 8; // بالا جا نیست → پایینِ دکمه
      setPos({ top, left });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setReason(null);
  }, []);

  // بستن با Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, close]);

  const send = useCallback(async () => {
    if (!reason) return;
    setBusy(true);
    const ok =
      target.kind === 'question'
        ? await postQuestionReport(target.id, reason)
        : await postAnswerReport(target.id, reason);
    setBusy(false);
    if (ok) {
      setDone(true);
      window.setTimeout(() => setOpen(false), 1400);
    }
  }, [reason, target]);

  return (
    <span ref={anchorRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="گزارش تخلف"
        aria-expanded={open}
        title="گزارش تخلف"
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${
          open ? 'bg-red-50 text-red-500' : 'text-ink-300 hover:bg-red-50 hover:text-red-500'
        }`}
      >
        <Flag className="h-3 w-3" aria-hidden="true" />
        گزارش
      </button>
      {open && pos && (
        <>
          {/* زیرلایه‌ی شفاف برای بستن با کلیکِ بیرون */}
          <button
            type="button"
            aria-label="بستن منوی گزارش"
            onClick={close}
            className="fixed inset-0 z-[60] cursor-default"
            tabIndex={-1}
          />
          <span
            role="dialog"
            aria-label="گزارش تخلف"
            className="fixed z-[70] w-56 rounded-2xl border border-ink-100 bg-white p-3 text-right shadow-[0_18px_40px_-20px_rgba(11,53,48,.4)]"
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-black text-ink-700">
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              چرا گزارشش می‌کنی؟
            </p>
            <span className="mt-2 flex flex-wrap gap-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold transition ${
                    reason === r
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-ink-100 text-ink-500 hover:border-ink-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </span>
            <span className="mt-2.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={close}
                className="text-[10px] font-extrabold text-ink-400 transition hover:text-ink-600"
              >
                انصراف
              </button>
              {done ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-mint-700">
                  <Check className="h-3 w-3" aria-hidden="true" />
                  گزارش ثبت شد ✓
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!reason || busy}
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-red-500 px-3 text-[10.5px] font-extrabold text-white transition hover:bg-red-400 disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
                  ارسال گزارش
                </button>
              )}
            </span>
          </span>
        </>
      )}
    </span>
  );
}
