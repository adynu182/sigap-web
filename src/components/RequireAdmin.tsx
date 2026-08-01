"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, profile, initializing, profileLoading } = useAuth();
  const router = useRouter();
  const ready = !initializing && !profileLoading;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (!profile || profile.role !== "admin") {
      router.replace("/assessment");
    }
  }, [ready, user, profile, router]);

  if (!ready || !user || !profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
