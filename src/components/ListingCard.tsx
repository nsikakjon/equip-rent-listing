import Link from "next/link";
import { formatNaira } from "@/lib/pricing";
import type { Listing } from "@/lib/types";
import { EquipmentTile } from "./EquipmentTile";

export function ListingCard({ listing, categoryName }: { listing: Listing; categoryName: string }) {
  return (
    <Link
      href={`/equipment/${listing.id}`}
      className="group overflow-hidden rounded-xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <EquipmentTile listing={listing} categoryName={categoryName} />
      <div className="space-y-1 p-4">
        <h3 className="font-semibold leading-snug group-hover:underline">{listing.title}</h3>
        <p className="text-sm text-muted">{listing.area}</p>
        <p className="pt-1">
          <span className="text-lg font-bold">{formatNaira(listing.daily_rate_kobo)}</span>
          <span className="text-sm text-muted"> / day</span>
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
          {listing.is_own_inventory && <Badge>EquipRent stock</Badge>}
          {listing.operator_available && <Badge>Operator available</Badge>}
          {listing.delivery_available && <Badge>Delivery</Badge>}
        </div>
      </div>
    </Link>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-line px-2 py-0.5 text-muted">{children}</span>;
}
