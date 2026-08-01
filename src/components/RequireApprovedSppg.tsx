"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";

export function RequireApprovedSppg({ children }: { children: React.ReactNode }) {
  const { user, profile, initializing, profileLoading } = useAuth();
  const router = useRouter();
  const ready = !initializing && !profileLoading;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (profile?.role === "admin") {
      router.replace("/admin");
    } else if (!profile || profile.status === "pending") {
      router.replace("/pending");
    } else if (profile.status === "rejected") {
      router.replace("/pending");
    }
  }, [ready, user, profile, router]);

  if (!ready || !user || !profile || profile.status !== "approved" || profile.role === "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
