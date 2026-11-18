import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export default async function Browse({ searchParams }: PageProps<"/equipment">) {
  const sp = await searchParams;
  const filter = { category: one(sp.category), area: one(sp.area), q: one(sp.q) };
  const store = getStore();
  const [categories, listings] = await Promise.all([store.listCategories(), store.listListings(filter, 60)]);
  const catName = new Map(categories.map((c) => [c.slug, c.name]));
  const heading = filter.category ? catName.get(filter.category) ?? "Equipment" : "All equipment";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <form className="space-y-3">
          {filter.category && <input type="hidden" name="category" value={filter.category} />}
          <div>
            <label className="label" htmlFor="q">Search</label>
            <input id="q" name="q" defaultValue={filter.q} placeholder="e.g. mixer" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="area">Area</label>
            <input id="area" name="area" defaultValue={filter.area} placeholder="e.g. Lekki" className="field" />
          </div>
          <button className="btn w-full">Apply</button>
        </form>
        <nav>
          <p className="label">Categories</p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/equipment" className={!filter.category ? "font-semibold" : "text-muted hover:text-foreground"}>
                All equipment
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/equipment?category=${c.slug}`}
                  className={filter.category === c.slug ? "font-semibold" : "text-muted hover:text-foreground"}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mb-6 text-sm text-muted">
          {listings.length} listing{listings.length === 1 ? "" : "s"}
          {filter.area ? ` in ${filter.area}` : " across Lagos"}
          {filter.q ? ` matching "${filter.q}"` : ""}
        </p>
        {listings.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} categoryName={catName.get(l.category_slug) ?? ""} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
            Nothing matches yet. Try another area or category.
          </div>
        )}
      </section>
    </div>
  );
}
