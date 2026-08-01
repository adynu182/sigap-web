"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ShieldCheck, Camera, FileSpreadsheet } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";

const TONES = ["bg-conform", "bg-minor", "bg-major"];

interface MosaicCell {
  id: number;
  tone: string;
  delay: number;
}

function buildMosaic(count: number): MosaicCell[] {
  return Array.from({ length: count }, (_, i) => {
    const roll = Math.random();
    const tone = roll < 0.62 ? "bg-empty-soft" : TONES[Math.floor(Math.random() * TONES.length)];
    return { id: i, tone, delay: Math.random() * 0.6 };
  });
}

// Cells start neutral so server and first client render match exactly; the
// random pattern is generated client-side in an effect, after hydration, so
// this never causes a hydration mismatch or an impure render computation.
function useMosaic(count: number) {
  const [cells, setCells] = useState<MosaicCell[]>(() =>
    Array.from({ length: count }, (_, i) => ({ id: i, tone: "bg-empty-soft", delay: 0 }))
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- randomizes decorative cells client-side, after hydration, on purpose
    setCells(buildMosaic(count));
  }, [count]);
  return cells;
}

function Hero() {
  const cells = useMosaic(96);
  return (
    <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
      {cells.map((cell) => (
        <span
          key={cell.id}
          className={cn("mosaic-cell aspect-square rounded-[3px] sm:rounded-md", cell.tone)}
          style={{ animationDelay: `${cell.delay}s` }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user, profile, initializing, profileLoading } = useAuth();
  const router = useRouter();
  const ready = !initializing && !profileLoading;

  useEffect(() => {
    if (!ready || !user) return;
    if (profile?.role === "admin") router.replace("/admin");
    else if (profile?.status === "approved") router.replace("/assessment");
    else if (profile) router.replace("/pending");
  }, [ready, user, profile, router]);

  if (!ready || user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-6">
        <Logo subtitle />
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Masuk</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Daftarkan SPPG</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pt-8 pb-16 sm:px-6 sm:pt-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
              141 klausul HACCP / GMP
            </span>
            <h1 className="font-display mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Petakan kesenjangan kepatuhan dapur SPPG Anda, klausul demi klausul.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              SIGAP menuntun tim SPPG mengisi self-assessment keamanan pangan satu
              klausul per layar, melampirkan bukti foto, lalu menghasilkan peta
              gap dan laporan yang siap diekspor — langsung dari ponsel.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button size="lg">
                  Daftarkan SPPG <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Masuk ke akun
                </Button>
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-6 sm:max-w-md">
              <div>
                <dt className="text-xs text-ink-soft">Kategori temuan</dt>
                <dd className="font-display mt-1 text-lg font-bold text-ink">3</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Klausul</dt>
                <dd className="font-display mt-1 text-lg font-bold text-ink">141</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Biaya</dt>
                <dd className="font-display mt-1 text-lg font-bold text-ink">Gratis</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-6">
            <Hero />
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-conform" /> Conformity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-minor" /> Minor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-major" /> Major
              </span>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <Feature
            icon={ShieldCheck}
            title="Akses per SPPG"
            body="Setiap SPPG hanya bisa melihat dan mengisi data miliknya sendiri, diverifikasi lewat akun masing-masing."
          />
          <Feature
            icon={Camera}
            title="Bukti foto terlampir"
            body="Lampirkan foto temuan langsung dari kamera ponsel pada setiap klausul, tersimpan aman per jawaban."
          />
          <Feature
            icon={FileSpreadsheet}
            title="Ekspor kapan saja"
            body="Unduh hasil assessment ke Excel sebagai cadangan data dan bahan laporan, tanpa menunggu siapa pun."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
        <Icon className="size-5" />
      </div>
      <h3 className="font-display mt-3 font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
