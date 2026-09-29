'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  MessageCircleQuestion,
  Pin,
  Send,
  UserRound,
} from 'lucide-react';

import {
  fetchLessonQuestions,
  postAcceptAnswer,
  postLessonQuestion,
  postQuestionAnswer,
  type LessonQuestion,
} from '@/lib/lms-lesson';
import { useAuth } from '@/lib/use-auth';

const fa = (n: number) => n.toLocaleString('fa-IR');

type LoadState =
  | { kind: 'boot' }
  | { kind: 'questions'; items: LessonQuestion[] }
  | { kind: 'locked' }
  | { kind: 'error' };

type Props = {
  lessonId: number;
  enrolled: boolean;
  isGuest: boolean;
  onLogin: () => void;
  onEnroll: () => void;
};

/**
 * پنلِ پرسش‌وپاسخِ جلسه — دکلِ کاملِ discussion بک‌اند:
 * لیست (سوال + جواب‌های تو در تو)، پرسیدن (title+body)، پاسخ‌دادن به پرسشِ دیگران،
 * و «قبول‌کردن پاسخ» برای صاحبِ پرسش. نشان‌های وضعیت: سنجاق/پاسخ‌داده‌شده/پاسخ استاد.
 * دکل‌ها فقط برای ثبت‌نام‌شده باز است (403 گرا‎نولار از سرور).
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
  const [answerBusy, setAnswerBusy] = useState<number | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const canSee = enrolled;
  const load = useCallback(async () => {
    if (!canSee) return;
    const res = await fetchLessonQuestions(lessonId);
    if (!alive.current) return;
    if (res.kind === 'ok') setState({ kind: 'questions', items: res.questions });
    else if (res.kind === 'forbidden') setState({ kind: 'locked' });
    else setState({ kind: 'error' });
  }, [canSee, lessonId]);

  useEffect(() => {
    if (canSee) void load();
  }, [canSee, load]);

  const ask = useCallback(async () => {
    const title = askTitle.trim();
    const body = askBody.trim();
    if (title.length < 5) {
      setAskErr('عنوان پرسش باید حداقل ۵ حرف باشد.');
      return;
    }
    if (!body) {
      setAskErr('متن پرسش خالی است.');
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
      setState((prev) =>
        prev.kind === 'questions' ? { kind: 'questions', items: [created, ...prev.items] } : prev,
      );
      window.setTimeout(() => alive.current && setAskDone(false), 4000);
    } else {
      setAskErr('پرسش ثبت نشد؛ دوباره تلاش کن.');
    }
  }, [askBody, askTitle, lessonId]);

  const answer = useCallback(
    async (qid: number, text: string) => {
      setAnswerBusy(qid);
      const created = await postQuestionAnswer(qid, text);
      setAnswerBusy(null);
      if (created && alive.current) void load();
    },
    [load],
  );

  const accept = useCallback(
    async (q: LessonQuestion, answerId: number) => {
      await postAcceptAnswer(q.id, answerId);
      if (alive.current) void load();
    },
    [load],
  );

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
          هر جلسه یک کلاس‌درسِ کوچک است؛ اینجا از مدرس و همراهان می‌توانی بپرسی.
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
        <div className="grid place-items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-mint-500" aria-hidden="true" />
        </div>
      )}
      {state.kind === 'error' && (
        <p className="py-6 text-center text-[12.5px] font-bold text-ink-400">
          در دریافت پرسش‌ها مشکلی پیش آمد.
        </p>
      )}
      {state.kind === 'questions' && state.items.length === 0 && (
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
      {state.kind === 'questions' &&
        state.items.map((q) => {
          const open = openId === q.id;
          return (
            <QuestionCard
              key={q.id}
              q={q}
              open={open}
              onToggle={() => setOpenId(open ? null : q.id)}
              onAnswer={answer}
              onAccept={accept}
              answerBusy={answerBusy === q.id}
              currentUserId={
                user?.id != null && !Number.isNaN(Number(user.id)) ? Number(user.id) : null
              }
            />
          );
        })}
    </div>
  );
}

/* ── کارتِ یک پرسش ── */

function QuestionCard({
  q,
  open,
  onToggle,
  onAnswer,
  onAccept,
  answerBusy,
  currentUserId,
}: {
  q: LessonQuestion;
  open: boolean;
  onToggle: () => void;
  onAnswer: (qid: number, text: string) => Promise<void>;
  onAccept: (q: LessonQuestion, answerId: number) => Promise<void>;
  answerBusy: boolean;
  currentUserId: number | null;
}) {
  const [draft, setDraft] = useState('');
  const isMine = currentUserId != null && q.user_id === currentUserId;
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition hover:bg-ink-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-50 text-ink-400">
          <UserRound className="h-4 w-4" aria-hidden="true" />
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
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-300 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-ink-100 bg-ink-50/40 px-4 py-4">
          <p className="text-[13px] font-bold leading-7 text-ink-700">{q.body}</p>

          <div className="mt-4 space-y-3">
            {q.answers.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border p-3.5 ${
                  a.is_instructor_answer
                    ? 'border-brand-200 bg-brand-50/60'
                    : 'border-ink-100 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-black ${a.is_instructor_answer ? 'text-brand-700' : 'text-ink-500'}`}
                  >
                    {a.user_display}
                  </span>
                  {a.is_instructor_answer && (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                      پاسخ استاد
                    </span>
                  )}
                  {a.is_accepted && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-mint-100 px-2 py-0.5 text-[9px] font-extrabold text-mint-800">
                      <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
                      پاسخ پذیرفته‌شده
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[12.5px] font-bold leading-6 text-ink-700">{a.body}</p>
                {isMine && !a.is_accepted && (
                  <button
                    type="button"
                    onClick={() => void onAccept(q, a.id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-mint-200 bg-mint-50 px-3 py-1 text-[10.5px] font-extrabold text-mint-800 transition hover:bg-mint-100"
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                    این پاسخ مشکل من را حل کرد
                  </button>
                )}
              </div>
            ))}
            {q.answers.length === 0 && (
              <p className="text-[11.5px] font-bold text-ink-400">هنوز پاسخی نیست.</p>
            )}
          </div>

          {/* پاسخ‌دادن به پرسشِ دیگران */}
          {!isMine && (
            <div className="mt-4 flex items-start gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="تو هم می‌توانی پاسخ بدهی…"
                className="h-10 min-w-0 flex-1 rounded-xl border border-ink-100 bg-white px-3 text-[12px] font-bold outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                disabled={answerBusy || !draft.trim()}
                onClick={() => {
                  const t = draft.trim();
                  setDraft('');
                  void onAnswer(q.id, t);
                }}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-brand-600 px-4 text-[11.5px] font-extrabold text-white transition hover:bg-brand-500 disabled:opacity-50"
              >
                {answerBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                ارسال
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
