"use client";

import { useActionState, useState } from "react";
import { submitListing, type FormState } from "@/app/actions";
import type { Category } from "@/lib/types";

export function ListingForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitListing, {});
  const [operator, setOperator] = useState(false);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto mb-4 h-1 w-12 bg-brand" />
        <p className="text-lg font-semibold">Listing received</p>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6 rounded-xl border border-line bg-surface p-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-semibold">About you</legend>
        <Field id="ownerName" label="Your name" required />
        <Field id="business" label="Business name (optional)" />
        <Field id="phone" label="Phone (WhatsApp)" required placeholder="0803 123 4567" inputMode="tel" />
        <Field id="email" label="Email (optional)" type="email" />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-semibold">The equipment</legend>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" required className="field" defaultValue="">
            <option value="" disabled>Choose…</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <Field id="title" label="Title" required placeholder="e.g. CAT 320D excavator, 20 t" />
        <Field id="area" label="Where it's kept" required placeholder="e.g. Ikorodu" />
        <Field id="dailyRate" label="Daily rate (₦)" required placeholder="e.g. 290,000" inputMode="decimal" />
        <Field id="equipmentValue" label="Approx. value (₦, optional)" placeholder="e.g. 60m" />
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="field" placeholder="Model, year, condition, attachments, hours per day…" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="deliveryAvailable" defaultChecked /> Can be delivered to site
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="operatorAvailable" checked={operator} onChange={(e) => setOperator(e.target.checked)} /> I can supply an operator
        </label>
        {operator && <Field id="operatorRate" label="Operator daily rate (₦)" placeholder="e.g. 12,000" />}
      </fieldset>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button className="btn w-full py-3 text-base" disabled={pending}>
        {pending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}

function Field({ id, label, ...rest }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} name={id} className="field" {...rest} />
    </div>
  );
}
