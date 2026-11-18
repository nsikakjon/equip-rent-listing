import { ListingForm } from "@/components/ListingForm";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "List your equipment · EquipRent" };

export default async function ListPage() {
  const categories = await getStore().listCategories();
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earn from idle equipment</h1>
        <p className="mt-3 text-muted">Listing is free. We only earn when your equipment is rented.</p>
        <ul className="mt-6 space-y-4 text-sm">
          <Point title="Renters pay up front">Every booking is paid through Paystack before your equipment leaves the yard.</Point>
          <Point title="Protected hires">Renters take a damage waiver or pay a deposit, and we hold payment until the equipment is back and inspected.</Point>
          <Point title="Simple commission">12% on heavy plant and 20% on small tools and site equipment, taken from the rental. Operator pay goes to you in full.</Point>
          <Point title="We find the work">Contractors find you on the web and on WhatsApp. We handle the calls, invoices and delivery.</Point>
        </ul>
      </div>
      <ListingForm categories={categories} />
    </div>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="border-l-4 border-brand pl-3">
      <p className="font-semibold">{title}</p>
      <p className="text-muted">{children}</p>
    </li>
  );
}
