import Link from 'next/link';

export const metadata = { title: 'ارسال روایت | جهاد تبیین' };

export default function NewTabyinPage() {
  return (
    <main className="bg-white">
      <section className="container-edge py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-extrabold text-brand-700">جهاد تبیین</p>
          <h1 className="mt-3 text-2xl font-black text-ink-900">ارسال روایت مردمی</h1>
          <p className="mt-4 leading-8 text-ink-600">فرم ارسال روایت در نسخه بعدی فعال می‌شود. فعلاً می‌توانید آرشیو محتوای تبیین را مشاهده کنید.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/tabyin" className="btn-primary btn-md">مشاهده آرشیو</Link>
            <Link href="/#tabyin" className="btn-outline btn-md">بازگشت به خانه</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
