"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3, XCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthProvider";

export default function PendingPage() {
  const { user, profile, initializing, profileLoading, logout } = useAuth();
  const router = useRouter();
  const ready = !initializing && !profileLoading;

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (profile?.role === "admin") router.replace("/admin");
    else if (profile?.status === "approved") router.replace("/assessment");
  }, [ready, user, profile, router]);

  if (!ready || !profile || profile.status === "approved") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  const rejected = profile.status === "rejected";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 py-10">
      <Logo subtitle />
      <Card className="mt-8 max-w-sm p-7 text-center">
        <div
          className={`mx-auto flex size-12 items-center justify-center rounded-full ${
            rejected ? "bg-major-soft text-major" : "bg-minor-soft text-minor"
          }`}
        >
          {rejected ? <XCircle className="size-6" /> : <Clock3 className="size-6" />}
        </div>
        <h1 className="font-display mt-4 text-lg font-bold text-ink">
          {rejected ? "Pendaftaran belum disetujui" : "Menunggu verifikasi"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {rejected
            ? "Administrator belum dapat memverifikasi akun SPPG ini. Hubungi administrator untuk informasi lebih lanjut."
            : `Akun ${profile.namaSppg} sudah terdaftar dan sedang menunggu persetujuan administrator. Halaman ini akan otomatis terbuka begitu akun disetujui.`}
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={() => logout()}>
          Keluar
        </Button>
      </Card>
    </div>
  );
}
