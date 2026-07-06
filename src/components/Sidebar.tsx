"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const ALL_TABS = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/orders", label: "Sifarişlər", section: "orders" },
  { href: "/production", label: "İstehsal", section: "production" },
  { href: "/costs", label: "Maya Dəyəri", section: "costs" },
  { href: "/invoices", label: "Satış Fakturaları", section: "invoices" },
  { href: "/customers", label: "Müştərilər", section: "customers" },
  { href: "/payments", label: "Ödənişlər", section: "payments" },
  { href: "/inventory", label: "Anbar", section: "inventory" },
  { href: "/purchases", label: "Alışlar", section: "purchases" },
  { href: "/debts", label: "Borclar", section: "debts" },
  { href: "/salaries", label: "Əmək haqqı", section: "salaries" },
];

export default function Sidebar({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const visible = ALL_TABS.filter((t) => {
    if (role === "ADMIN") return true;
    if (role === "MANAGER")
      return ["dashboard", "orders", "production", "invoices", "customers", "payments"].includes(
        t.section
      );
    return ["orders", "production"].includes(t.section);
  });

  return (
    <div className="w-60 shrink-0 bg-ink text-paper flex flex-col p-4 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5 pb-4 mb-3 border-b border-paper/15">
        <div className="w-8 h-8 border-2 border-paper rounded-md rotate-[-4deg]" />
        <div>
          <div className="font-bold text-[15px] leading-tight">Bestofset</div>
          <div className="text-[10px] text-paper/55 uppercase tracking-wide">
            idarəetmə
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {visible.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`px-2.5 py-2 rounded-md text-sm font-medium transition ${
              pathname?.startsWith(t.href)
                ? "bg-paper text-ink"
                : "text-paper/70 hover:bg-paper/10 hover:text-paper"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-3 border-t border-paper/15 text-[11px] text-paper/60">
        <div className="mb-2">
          {name} · <span className="uppercase">{role}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-paper/70 hover:text-paper underline"
        >
          Çıxış
        </button>
      </div>
    </div>
  );
}
