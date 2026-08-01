"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/AppShell";
import { RequireApprovedSppg } from "@/components/RequireApprovedSppg";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { Answer, CATEGORY_TOKENS, Category, Question } from "@/lib/types";
import { formatDateTime, cn } from "@/lib/utils";

type FilterValue = "all" | Category | "empty";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "Conformity", label: "Conformity" },
  { value: "Minor", label: "Minor" },
  { value: "Major", label: "Major" },
  { value: "empty", label: "Belum diisi" },
];

function ResultsContent() {
  const { user, profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const qSnap = await getDocs(query(collection(db, "questions"), orderBy("order")));
      const qs = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Question);
      const aSnap = await getDocs(collection(db, "sppgProfiles", user.uid, "answers"));
      const amap: Record<string, Answer> = {};
      aSnap.docs.forEach((d) => (amap[d.id] = d.data() as Answer));
      setQuestions(qs);
      setAnswers(amap);
      setLoading(false);
    })();
  }, [user]);

  const rows = useMemo(() => {
    return questions
      .map((q) => ({ question: q, answer: answers[q.id] as Answer | undefined }))
      .filter(({ answer }) => {
        if (filter === "all") return true;
        if (filter === "empty") return !answer?.category;
        return answer?.category === filter;
      });
  }, [questions, answers, filter]);

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
    const filename = `assessment-${profile?.namaSppg ?? "sppg"}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename.replace(/\s+/g, "-"));
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Hasil Assessment</h1>
          <p className="mt-1 text-sm text-ink-soft">{profile?.namaSppg}</p>
        </div>
        <Button onClick={exportExcel} variant="secondary">
          <Download className="size-4" /> Ekspor Excel
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              filter === f.value
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-line bg-white text-ink-soft hover:bg-paper"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {rows.length === 0 && (
          <Card className="p-6 text-center text-sm text-ink-soft">
            Tidak ada klausul pada kategori ini.
          </Card>
        )}
        {rows.map(({ question, answer }) => {
          const token = CATEGORY_TOKENS[answer?.category ?? "empty"];
          return (
            <Card key={question.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="tabular text-xs font-bold text-ink-soft">
                  Klausul {question.order}
                </span>
                <Badge
                  tone={
                    answer?.category === "Conformity"
                      ? "conform"
                      : answer?.category === "Minor"
                        ? "minor"
                        : answer?.category === "Major"
                          ? "major"
                          : "empty"
                  }
                >
                  {token.label}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{question.text}</p>
              {answer?.essay && (
                <p className="mt-2 rounded-lg bg-paper p-3 text-sm leading-relaxed text-ink-soft">
                  {answer.essay}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <RequireApprovedSppg>
      <AppShell variant="sppg">
        <ResultsContent />
      </AppShell>
    </RequireApprovedSppg>
  );
}
