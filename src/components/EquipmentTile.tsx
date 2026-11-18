import type { Listing } from "@/lib/types";

/** Placeholder visual until owners upload photos. */
export function EquipmentTile({ listing, categoryName, large = false }: { listing: Listing; categoryName: string; large?: boolean }) {
  if (listing.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={listing.image_url} alt={listing.title} className={`w-full object-cover ${large ? "h-72 rounded-xl" : "h-40"}`} />;
  }
  return (
    <div className={`relative flex w-full items-end overflow-hidden bg-brand-ink ${large ? "h-72 rounded-xl" : "h-40"}`}>
      <div className="hazard absolute inset-x-0 top-0 h-2 opacity-90" />
      <span className={`p-4 font-bold leading-none tracking-tight text-brand ${large ? "text-5xl" : "text-3xl"}`}>
        {categoryName}
      </span>
    </div>
  );
}
