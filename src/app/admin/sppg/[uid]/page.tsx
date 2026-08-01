"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { Loader2, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/AppShell";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase";
import { Answer, CATEGORY_TOKENS, Question, SppgProfile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function AdminSppgDetailContent() {
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const [profile, setProfile] = useState<SppgProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profileSnap, qSnap, aSnap] = await Promise.all([
        getDoc(doc(db, "sppgProfiles", uid)),
        getDocs(query(collection(db, "questions"), orderBy("order"))),
        getDocs(collection(db, "sppgProfiles", uid, "answers")),
      ]);
      setProfile(profileSnap.exists() ? (profileSnap.data() as SppgProfile) : null);
      setQuestions(qSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Question));
      const amap: Record<string, Answer> = {};
      aSnap.docs.forEach((d) => (amap[d.id] = d.data() as Answer));
      setAnswers(amap);
      setLoading(false);
    })();
  }, [uid]);

  const summary = useMemo(() => {
    const s = { Conformity: 0, Minor: 0, Major: 0, empty: 0 };
    questions.forEach((q) => {
      const cat = answers[q.id]?.category;
      if (cat) s[cat]++;
      else s.empty++;
    });
    return s;
  }, [questions, answers]);

  function exportExcel() {
    const data = questions.map((q) => {
      const a = answers[q.id];
      return {
        Klausul: q.order,
        Pertanyaan: q.text,
        Kategori: a?.category ?? "Belum diisi",
        "Catatan Temuan": a?.essay ?? "",
        "Ada Foto": a?.photoUrl ? "Ya" : "Tidak",
        "Terakhir Diperbarui": a?.updatedAt ? formatDateTime(a.updatedAt) : "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 8 }, { wch: 60 }, { wch: 12 }, { wch: 50 }, { wch: 8 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Assessment");
    XLSX.writeFile(wb, `assessment-${(profile?.namaSppg ?? uid).replace(/\s+/g, "-")}.xlsx`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!profile) {
    return <Card className="p-8 text-center text-ink-soft">SPPG tidak ditemukan.</Card>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/sppg" className="flex items-center gap-1.5 text-sm font-medium text-brand">
        <ArrowLeft className="size-4" /> Kembali ke daftar SPPG
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{profile.namaSppg}</h1>
          <p className="mt-1 text-sm text-ink-soft">{profile.wilayah}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            PIC {profile.penanggungJawab} &middot; {profile.telepon} &middot; {profile.email}
          </p>
        </div>
        <Button onClick={exportExcel} variant="secondary">
          <Download className="size-4" /> Ekspor Excel
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <SummaryStat label="Conformity" value={summary.Conformity} tone="conform" />
        <SummaryStat label="Minor" value={summary.Minor} tone="minor" />
        <SummaryStat label="Major" value={summary.Major} tone="major" />
        <SummaryStat label="Belum diisi" value={summary.empty} tone="empty" />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {questions.map((q) => {
          const a = answers[q.id];
          const token = CATEGORY_TOKENS[a?.category ?? "empty"];
          return (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="tabular text-xs font-bold text-ink-soft">Klausul {q.order}</span>
                <Badge
                  tone={
                    a?.category === "Conformity"
                      ? "conform"
                      : a?.category === "Minor"
                        ? "minor"
                        : a?.category === "Major"
                          ? "major"
                          : "empty"
                  }
                >
                  {token.label}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{q.text}</p>
              {a?.essay && (
                <p className="mt-2 rounded-lg bg-paper p-3 text-sm leading-relaxed text-ink-soft">
                  {a.essay}
                </p>
              )}
              {a?.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.photoUrl}
                  alt={`Bukti foto klausul ${q.order}`}
                  className="mt-2 h-32 rounded-lg border border-line object-cover"
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const STAT_TEXT_TONE: Record<"conform" | "minor" | "major" | "empty", string> = {
  conform: "text-conform",
  minor: "text-minor",
  major: "text-major",
  empty: "text-empty",
};

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "conform" | "minor" | "major" | "empty";
}) {
  return (
    <Card className="p-3 text-center">
      <p className={`font-display text-lg font-bold ${STAT_TEXT_TONE[tone]}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{label}</p>
    </Card>
  );
}

export default function AdminSppgDetailPage() {
  return (
    <RequireAdmin>
      <AppShell variant="admin">
        <AdminSppgDetailContent />
      </AppShell>
    </RequireAdmin>
  );
}
