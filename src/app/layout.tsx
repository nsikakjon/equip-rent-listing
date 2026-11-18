import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EquipRent: construction equipment hire in Lagos",
  description:
    "Book excavators, cranes, mixers, scaffolding and more across Lagos. Clear prices, damage protection and delivery.",
};

function whatsappLink(): string | null {
  const n = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return n ? `https://wa.me/${n.replace(/\D/g, "")}?text=Hi` : null;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const wa = whatsappLink();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <div className="hazard h-1.5" />
        <header className="border-b border-line bg-surface">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-ink">E</span>
              EquipRent
            </Link>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <Link href="/equipment" className="hover:underline">
                Browse
              </Link>
              <Link href="/list" className="hover:underline">
                List equipment
              </Link>
              {wa && (
                <a href={wa} className="btn hidden sm:inline-flex" target="_blank" rel="noreferrer">
                  Book on WhatsApp
                </a>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-muted">
            <span>© {new Date().getFullYear()} EquipRent · Lagos, Nigeria</span>
            <span>Payments held until your equipment is returned and inspected.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
