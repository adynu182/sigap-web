"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ClipboardCheck, LayoutGrid, FileBarChart, ShieldCheck, Users, ListChecks } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";

const sppgLinks = [
  { href: "/assessment", label: "Isi Assessment", icon: ClipboardCheck },
  { href: "/review", label: "Peta Gap", icon: LayoutGrid },
  { href: "/results", label: "Hasil", icon: FileBarChart },
];

const adminLinks = [
  { href: "/admin", label: "Ringkasan", icon: ShieldCheck },
  { href: "/admin/sppg", label: "SPPG", icon: Users },
  { href: "/admin/questions", label: "Pertanyaan", icon: ListChecks },
];

export function AppShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "sppg" | "admin";
}) {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const links = variant === "sppg" ? sppgLinks : adminLinks;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh flex flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-soft text-brand-dark"
                      : "text-ink-soft hover:bg-black/5"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-sm font-semibold text-ink truncate max-w-40">
                {profile?.namaSppg}
              </div>
              <div className="text-xs text-ink-soft">
                {variant === "admin" ? "Administrator" : profile?.wilayah}
              </div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Keluar"
              className="flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-black/5 cursor-pointer"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6 md:pb-6">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        <div className="flex">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-brand" : "text-ink-soft"
                )}
              >
                <Icon className="size-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
