"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireApprovedSppg } from "@/components/RequireApprovedSppg";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { Answer, Category, Question } from "@/lib/types";
import { cn } from "@/lib/utils";

const CELL_TONE: Record<Category | "empty", string> = {
  Conformity: "bg-conform",
  Minor: "bg-minor",
  Major: "bg-major",
  empty: "bg-empty-soft border border-line",
};

function ReviewContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);

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

  const summary = useMemo(() => {
    const s = { Conformity: 0, Minor: 0, Major: 0, empty: 0 };
    questions.forEach((q) => {
      const cat = answers[q.id]?.category;
      if (cat) s[cat]++;
      else s.empty++;
    });
    return s;
  }, [questions, answers]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-xl font-bold text-ink">Peta Gap</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Ketuk kotak untuk membuka klausul tersebut. Warna menunjukkan kategori temuan.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Legend tone="bg-conform" label={`Conformity (${summary.Conformity})`} />
        <Legend tone="bg-minor" label={`Minor (${summary.Minor})`} />
        <Legend tone="bg-major" label={`Major (${summary.Major})`} />
        <Legend tone="bg-empty-soft border border-line" label={`Belum diisi (${summary.empty})`} />
      </div>

      <Card className="mt-5 p-4 sm:p-5">
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
          {questions.map((q, i) => {
            const cat = answers[q.id]?.category;
            return (
              <button
                key={q.id}
                onClick={() => router.push(`/assessment?i=${i}`)}
                title={q.text}
                className={cn(
                  "tabular flex aspect-square items-center justify-center rounded-md text-[11px] font-bold text-white/90 transition-transform hover:scale-105 cursor-pointer",
                  CELL_TONE[cat ?? "empty"],
                  !cat && "text-ink-soft"
                )}
              >
                {q.order}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
      <span className={cn("size-2.5 rounded-[2px]", tone)} /> {label}
    </span>
  );
}

export default function ReviewPage() {
  return (
    <RequireApprovedSppg>
      <AppShell variant="sppg">
        <ReviewContent />
      </AppShell>
    </RequireApprovedSppg>
  );
}
