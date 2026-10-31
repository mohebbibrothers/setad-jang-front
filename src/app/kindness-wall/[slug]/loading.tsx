/**
 * اسکلتِ صفحهٔ آگهی — همان چیدمانِ نهایی با بلوک‌های skeleton.
 *
 * چرا اینجا؟ Next هنگامِ ناوبریِ نرم (هایپرلینک از تخته) این را فوراً نشان
 * می‌دهد تا کاربر «پرشِ محتوا» یا صفحهٔ سفید نبیند. ابعاد عمداً با نسخهٔ
 * واقعی هم‌اندازه‌اند تا پس از رسیدنِ داده هیچ جابه‌جایی رخ ندهد (CLS ≈ ۰).
 */
export default function KindnessListingLoading() {
  return (
    <main className="bg-white" aria-busy="true" aria-live="polite">
      <section className="relative overflow-hidden bg-ink-950 pb-20 pt-6">
        <div className="container-edge">
          <div className="skeleton h-3 w-56 rounded-md opacity-30" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-9">
            <div className="skeleton aspect-[4/3] w-full rounded-[24px] opacity-25 sm:aspect-[16/10]" />
            <div className="space-y-3">
              <div className="skeleton h-8 w-40 rounded-2xl opacity-25" />
              <div className="skeleton h-9 w-4/5 rounded-xl opacity-25" />
              <div className="skeleton h-4 w-3/5 rounded-lg opacity-20" />
              <div className="skeleton h-4 w-2/3 rounded-lg opacity-20" />
              <div className="mt-6 flex gap-2.5">
                <div className="skeleton h-[52px] w-44 rounded-2xl opacity-25" />
                <div className="skeleton h-[52px] w-36 rounded-2xl opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container-edge relative z-10 -mt-12 pb-20">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <div className="space-y-5">
            <div className="rounded-[24px] border border-ink-100 bg-white p-6">
              <div className="skeleton h-4 w-32 rounded-md" />
              <div className="mt-4 space-y-2.5">
                {[100, 96, 88, 72].map((w) => (
                  <div key={w} className="skeleton h-3.5 rounded-md" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-ink-100 bg-white p-5">
              <div className="skeleton h-4 w-40 rounded-md" />
              <div className="mt-4 space-y-2">
                <div className="skeleton h-14 w-full rounded-2xl" />
                <div className="skeleton h-14 w-full rounded-2xl" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-28 w-full rounded-[22px]" />
            <div className="skeleton h-56 w-full rounded-[22px]" />
          </div>
        </div>
      </section>
    </main>
  );
}
