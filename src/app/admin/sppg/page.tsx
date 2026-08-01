"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { Check, X, Loader2, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/firebase";
import { ProfileStatus, SppgProfile } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

type FilterValue = "all" | ProfileStatus;

const STATUS_BADGE: Record<ProfileStatus, { tone: "minor" | "conform" | "major"; label: string }> = {
  pending: { tone: "minor", label: "Menunggu" },
  approved: { tone: "conform", label: "Disetujui" },
  rejected: { tone: "major", label: "Ditolak" },
};

function AdminSppgContent() {
  const [profiles, setProfiles] = useState<SppgProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [busyUid, setBusyUid] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "sppgProfiles"), orderBy("createdAt", "desc")));
    setProfiles(
      snap.docs
        .map((d) => d.data() as SppgProfile)
        .filter((p) => p.role === "sppg")
    );
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function setStatus(uid: string, status: ProfileStatus) {
    setBusyUid(uid);
    await updateDoc(doc(db, "sppgProfiles", uid), { status });
    setProfiles((ps) => ps.map((p) => (p.uid === uid ? { ...p, status } : p)));
    setBusyUid(null);
  }

  const filtered = profiles.filter((p) => filter === "all" || p.status === filter);
  const pendingCount = profiles.filter((p) => p.status === "pending").length;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold text-ink">SPPG Terdaftar</h1>
      <p className="mt-1 text-sm text-ink-soft">{profiles.length} akun total</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as FilterValue[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              filter === f
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line bg-white text-ink-soft hover:bg-paper"
            )}
          >
            {f === "pending" && `Menunggu (${pendingCount})`}
            {f === "approved" && "Disetujui"}
            {f === "rejected" && "Ditolak"}
            {f === "all" && "Semua"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-soft">
            Tidak ada SPPG pada status ini.
          </Card>
        ) : (
          filtered.map((p) => (
            <Card key={p.uid} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/sppg/${p.uid}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{p.namaSppg}</p>
                    <Badge tone={STATUS_BADGE[p.status].tone}>{STATUS_BADGE[p.status].label}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-soft">{p.wilayah}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    PIC {p.penanggungJawab} &middot; {p.telepon} &middot; {p.email}
                  </p>
                  <p className="tabular mt-1 text-xs text-ink-soft">
                    Daftar {formatDate(p.createdAt)}
                  </p>
                </Link>
                <ChevronRight className="mt-1 size-4 shrink-0 text-ink-soft" />
              </div>

              {p.status !== "approved" && (
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <Button
                    size="sm"
                    onClick={() => setStatus(p.uid, "approved")}
                    loading={busyUid === p.uid}
                  >
                    <Check className="size-4" /> Setujui
                  </Button>
                  {p.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setStatus(p.uid, "rejected")}
                      loading={busyUid === p.uid}
                    >
                      <X className="size-4" /> Tolak
                    </Button>
                  )}
                </div>
              )}
              {p.status === "approved" && (
                <div className="mt-3 border-t border-line pt-3">
                  <Button size="sm" variant="ghost" onClick={() => setStatus(p.uid, "rejected")}>
                    Cabut persetujuan
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminSppgPage() {
  return (
    <RequireAdmin>
      <AppShell variant="admin">
        <AdminSppgContent />
      </AppShell>
    </RequireAdmin>
  );
}
