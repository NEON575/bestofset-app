"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();
  const visible = ALL_TABS.filter((t) => {
    if (role === "ADMIN") return true;
    if (role === "MANAGER")
      return ["dashboard", "orders", "production", "invoices", "customers", "payments"].includes(
        t.section
      );
    return ["orders", "production"].includes(t.section);
  });

  return (
    <div className="w-60 shrink-0 bg-brand text-white flex flex-col p-4 sticky top-0 h-screen">
      <div className="pb-4 mb-3 border-b border-white/15">
        {/* Loqonun rəngləri (tünd yazı, narıncı işarə) sabitdir — sxem hər zaman
            ağ fonla göstərilir ki, sidebar-ın öz tünd fonunda oxunaqlı qalsın. */}
        <div className="bg-white rounded-lg p-2.5 inline-block">
          <Image src="/logo.png" alt="Bestofset" width={170} height={92} priority />
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {visible.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`relative px-2.5 py-2 rounded-md text-sm font-semibold tracking-tight transition ${
                active ? "text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-white/10 rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-3 border-t border-white/15 text-[11px] text-white/60">
        <div className="mb-2">
          {name} · <span className="uppercase">{role}</span>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-white/70 hover:text-white underline"
          >
            Çıxış
          </button>
          <button
            onClick={toggleTheme}
            aria-label="Tema dəyiş"
            className="flex items-center justify-center w-7 h-7 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
