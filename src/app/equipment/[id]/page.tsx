import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { EquipmentTile } from "@/components/EquipmentTile";
import { Badge } from "@/components/ListingCard";
import { lagosTodayIso } from "@/lib/bookings";
import { formatNaira } from "@/lib/pricing";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: PageProps<"/equipment/[id]">) {
  const { id } = await params;
  const store = getStore();
  const listing = /^\d+$/.test(id) ? await store.getListing(Number(id)) : null;
  if (!listing || listing.status !== "active") notFound();
  const [category, owner] = await Promise.all([
    store.getCategory(listing.category_slug),
    listing.owner_id ? store.getOwner(listing.owner_id) : null,
  ]);
  const minDate = lagosTodayIso();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/equipment" className="hover:underline">Equipment</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/equipment?category=${category.slug}`} className="hover:underline">{category.name}</Link>
          </>
        )}
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <EquipmentTile listing={listing} categoryName={category?.name ?? ""} large />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">{listing.title}</h1>
          <p className="mt-1 text-muted">{listing.area}, Lagos</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {listing.is_own_inventory ? <Badge>EquipRent stock</Badge> : owner?.verified && <Badge>Verified owner</Badge>}
            {listing.operator_available && <Badge>Operator available</Badge>}
            {listing.delivery_available && <Badge>Delivery across Lagos</Badge>}
          </div>
          {listing.description && <p className="mt-6 max-w-prose leading-relaxed">{listing.description}</p>}
          <div className="mt-8 grid max-w-prose gap-4 text-sm sm:grid-cols-2">
            <Info title="How it works">
              Request a booking and pay through Paystack. We confirm with the owner, arrange delivery and send an operator if you
              asked for one. Owner contact details are shared once you&apos;ve paid.
            </Info>
            <Info title="Protection">
              The damage waiver covers accidental damage during your hire. Your deposit is refunded after the equipment is
              returned and inspected.
            </Info>
          </div>
        </div>
        <aside className="h-fit rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-6">
          <p className="mb-4">
            <span className="text-2xl font-bold">{formatNaira(listing.daily_rate_kobo)}</span>
            <span className="text-muted"> / day</span>
          </p>
          <BookingForm listing={listing} commissionRate={category?.commission_rate ?? 0} minDate={minDate} />
        </aside>
      </div>
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h2 className="mb-1 font-semibold">{title}</h2>
      <p className="text-muted">{children}</p>
    </div>
  );
}
