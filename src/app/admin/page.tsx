"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, collectionGroup, getDocs } from "firebase/firestore";
import { Loader2, Users, Clock3, ListChecks, DatabaseBackup, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/AppShell";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase";
import { Answer, Question, SppgProfile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function AdminDashboardContent() {
  const [profiles, setProfiles] = useState<SppgProfile[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    (async () => {
      const [profileSnap, questionSnap] = await Promise.all([
        getDocs(collection(db, "sppgProfiles")),
        getDocs(collection(db, "questions")),
      ]);
      setProfiles(
        profileSnap.docs.map((d) => d.data() as SppgProfile).filter((p) => p.role === "sppg")
      );
      setQuestionCount(questionSnap.size);
      setLoading(false);
    })();
  }, []);

  const pending = profiles.filter((p) => p.status === "pending").length;
  const approved = profiles.filter((p) => p.status === "approved").length;

  async function handleBackupAll() {
    setBackingUp(true);
    try {
      const [questionSnap, answerSnap] = await Promise.all([
        getDocs(collection(db, "questions")),
        getDocs(collectionGroup(db, "answers")),
      ]);
      const questionMap: Record<string, Question> = {};
      questionSnap.docs.forEach((d) => {
        questionMap[d.id] = { id: d.id, ...d.data() } as Question;
      });
      const profileMap: Record<string, SppgProfile> = {};
      profiles.forEach((p) => (profileMap[p.uid] = p));

      const rows = answerSnap.docs.map((d) => {
        const a = d.data() as Answer;
        const sppgUid = d.ref.parent.parent?.id ?? "";
        const profile = profileMap[sppgUid];
        const question = questionMap[a.questionId];
        return {
          SPPG: profile?.namaSppg ?? sppgUid,
          Wilayah: profile?.wilayah ?? "",
          Klausul: question?.order ?? "",
          Pertanyaan: question?.text ?? "",
          Kategori: a.category ?? "Belum diisi",
          "Catatan Temuan": a.essay ?? "",
          "Ada Foto": a.photoUrl ? "Ya" : "Tidak",
          "Terakhir Diperbarui": a.updatedAt ? formatDateTime(a.updatedAt) : "",
        };
      });
      rows.sort((a, b) => (a.SPPG > b.SPPG ? 1 : a.SPPG < b.SPPG ? -1 : Number(a.Klausul) - Number(b.Klausul)));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 22 }, { wch: 18 }, { wch: 8 }, { wch: 55 },
        { wch: 12 }, { wch: 45 }, { wch: 8 }, { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Semua Jawaban");

      const profileWs = XLSX.utils.json_to_sheet(
        profiles.map((p) => ({
          Nama: p.namaSppg,
          Wilayah: p.wilayah,
          PIC: p.penanggungJawab,
          Telepon: p.telepon,
          Email: p.email,
          Status: p.status,
          Terdaftar: formatDateTime(p.createdAt),
        }))
      );
      XLSX.utils.book_append_sheet(wb, profileWs, "Daftar SPPG");

      XLSX.writeFile(wb, `sigap-backup-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setBackingUp(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold text-ink">Ringkasan</h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="SPPG disetujui" value={approved} />
        <StatCard icon={Clock3} label="Menunggu verifikasi" value={pending} />
        <StatCard icon={ListChecks} label="Klausul" value={questionCount} />
      </div>

      {pending > 0 && (
        <Card className="mt-4 flex items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink">
            <b>{pending} SPPG</b> menunggu verifikasi pendaftaran.
          </p>
          <Link href="/admin/sppg" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand">
            Tinjau <ArrowRight className="size-4" />
          </Link>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
            <DatabaseBackup className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-ink">Backup seluruh data</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Ekspor seluruh jawaban dari semua SPPG beserta daftar akun ke satu
              berkas Excel.
            </p>
            <Button onClick={handleBackupAll} loading={backingUp} className="mt-3" size="sm">
              Ekspor sekarang
            </Button>
          </div>
        </div>
      </Card>

      {questionCount === 0 && (
        <Card className="mt-4 p-4">
          <p className="text-sm text-ink">
            Daftar klausul masih kosong.{" "}
            <Link href="/admin/questions" className="font-semibold text-brand">
              Buka halaman Pertanyaan
            </Link>{" "}
            untuk mengisi 141 klausul contoh.
          </p>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <Icon className="size-5 text-brand" />
      <p className="font-display mt-2 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireAdmin>
      <AppShell variant="admin">
        <AdminDashboardContent />
      </AppShell>
    </RequireAdmin>
  );
}
