import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const PROMISES = [
  { title: "Prices up front", body: "Every listing shows a daily rate and the full cost before you book. No \"contact for price\"." },
  { title: "Damage protection", body: "Our damage waiver covers accidental damage, so you avoid a huge deposit." },
  { title: "Paid safely", body: "Pay by card or transfer through Paystack. Owners are paid only after the equipment comes back in good shape." },
  { title: "Delivered to site", body: "We arrange haulage across Lagos and can send a vetted operator with heavy plant." },
];

export default async function Home() {
  const store = getStore();
  const [categories, listings] = await Promise.all([store.listCategories(), store.listListings({}, 8)]);
  const catName = new Map(categories.map((c) => [c.slug, c.name]));

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Lagos construction equipment hire</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Book the machine. <br />
              We handle the rest.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Excavators, cranes, mixers, scaffolding and more from vetted Lagos yards, with clear prices, damage
              protection and delivery to your site.
            </p>
            <form action="/equipment" className="mt-6 flex max-w-xl gap-2">
              <input name="q" placeholder="What do you need? e.g. excavator, mixer" className="field flex-1 py-3 text-base" />
              <button className="btn px-6">Search</button>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                href={`/equipment?category=${c.slug}`}
                className="rounded-lg border border-line px-3 py-3 text-sm font-medium hover:border-foreground hover:bg-background"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Available now</h2>
          <Link href="/equipment" className="text-sm font-medium hover:underline">
            See all equipment →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} categoryName={catName.get(l.category_slug) ?? ""} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p) => (
            <div key={p.title}>
              <div className="mb-3 h-1 w-10 bg-brand" />
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-ink p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">Own equipment that sits idle?</h2>
            <p className="mt-1 text-white/70">List it free. We find renters, handle payment and protect your machine.</p>
          </div>
          <Link href="/list" className="btn">
            List your equipment
          </Link>
        </div>
      </section>
    </>
  );
}
