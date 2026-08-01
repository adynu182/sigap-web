"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Info,
  LayoutGrid,
  Check,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireApprovedSppg } from "@/components/RequireApprovedSppg";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/context/AuthProvider";
import { db, storage, isStorageConfigured } from "@/lib/firebase";
import { Answer, Category, Question } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS: { value: Category; label: string; tone: string; active: string }[] = [
  { value: "Conformity", label: "Conformity", tone: "border-conform/30 text-conform hover:bg-conform-soft", active: "bg-conform-soft border-conform text-conform" },
  { value: "Minor", label: "Minor", tone: "border-minor/30 text-minor hover:bg-minor-soft", active: "bg-minor-soft border-minor text-minor" },
  { value: "Major", label: "Major", tone: "border-major/30 text-major hover:bg-major-soft", active: "bg-major-soft border-major text-major" },
];

function AssessmentContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [essay, setEssay] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const current = questions[index];
  const currentAnswer = current ? answers[current.id] : undefined;
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.category).length,
    [questions, answers]
  );

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
      const jumpTo = Number(searchParams.get("i"));
      if (Number.isInteger(jumpTo) && jumpTo >= 0 && jumpTo < qs.length) {
        setIndex(jumpTo);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the textarea to the new clause's saved essay when the question changes
    setEssay(currentAnswer?.essay ?? "");
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(
    async (patch: Partial<Answer>) => {
      if (!user || !current) return;
      const next: Answer = {
        questionId: current.id,
        category: answers[current.id]?.category ?? null,
        essay: answers[current.id]?.essay ?? "",
        photoUrl: answers[current.id]?.photoUrl ?? null,
        updatedAt: Date.now(),
        ...patch,
      };
      setAnswers((a) => ({ ...a, [current.id]: next }));
      await setDoc(doc(db, "sppgProfiles", user.uid, "answers", current.id), next);
    },
    [user, current, answers]
  );

  async function handleCategoryClick(cat: Category) {
    await persist({ category: cat });
    flashSaved();
  }

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  async function handleSaveAndNext() {
    setSaving(true);
    await persist({ essay });
    setSaving(false);
    flashSaved();
    if (index < questions.length - 1) setIndex((i) => i + 1);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !current || !storage) return;
    setUploading(true);
    try {
      const path = `evidence/${user.uid}/${current.id}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await persist({ photoUrl: url });
    } catch (err) {
      console.error("Upload foto gagal:", err);
      alert("Gagal mengunggah foto. Periksa koneksi, lalu coba lagi.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!current) {
    return (
      <Card className="p-8 text-center text-ink-soft">
        Belum ada pertanyaan. Minta administrator menambahkan klausul assessment.
      </Card>
    );
  }

  const activeCategory = answers[current.id]?.category ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <ProgressBar value={index + 1} total={questions.length} className="flex-1" />
        <Link
          href="/review"
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand"
        >
          <LayoutGrid className="size-4" /> Peta
        </Link>
      </div>
      <p className="tabular mt-2 text-xs text-ink-soft">
        {answeredCount} dari {questions.length} klausul terisi
      </p>

      <Card className="mt-5 p-5 sm:p-6">
        <span className="tabular inline-block rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-dark">
          Klausul {current.order}
        </span>
        <p className="mt-3 text-[15px] leading-relaxed text-ink">{current.text}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleCategoryClick(opt.value)}
              className={cn(
                "rounded-xl border py-3 text-sm font-semibold transition-colors cursor-pointer",
                activeCategory === opt.value ? opt.active : cn("bg-white border-line", opt.tone)
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowHelper((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-ink-soft"
        >
          <Info className="size-3.5" /> Panduan menulis temuan (PLOR)
        </button>
        {showHelper && (
          <div className="mt-2 rounded-xl bg-paper p-3.5 text-xs leading-relaxed text-ink-soft">
            <b className="text-ink">Problem</b> — apa yang tidak sesuai.{" "}
            <b className="text-ink">Location</b> — di titik/area mana ditemukan.{" "}
            <b className="text-ink">Objective evidence</b> — bukti yang benar-benar
            teramati (angka, kondisi, dokumen).{" "}
            <b className="text-ink">Reference</b> — klausul atau standar yang jadi acuan.
          </div>
        )}

        <div className="mt-4">
          <Textarea
            label="Catatan temuan"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Jelaskan temuan menggunakan pola PLOR..."
            rows={4}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-ink">Bukti foto</label>
          {!isStorageConfigured() ? (
            <p className="mt-1.5 rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink-soft">
              Upload foto belum aktif untuk project ini (Firebase Storage memerlukan paket
              Blaze). Catatan temuan di atas tetap bisa diisi seperti biasa.
            </p>
          ) : (
            <div className="mt-1.5 flex items-center gap-3">
              {currentAnswer?.photoUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentAnswer.photoUrl}
                    alt="Bukti foto temuan"
                    className="size-20 rounded-xl border border-line object-cover"
                  />
                  <label className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-white cursor-pointer">
                    <Camera className="size-3.5" />
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                  </label>
                </div>
              ) : (
                <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-ink-soft hover:border-brand hover:text-brand">
                  {uploading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="size-5" />
                      <span className="text-[10px]">Ambil foto</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhoto}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-5 flex items-center gap-3">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="size-4" /> Sebelumnya
        </Button>
        <Button size="lg" className="flex-1" onClick={handleSaveAndNext} loading={saving}>
          {savedFlash ? (
            <>
              <Check className="size-4" /> Tersimpan
            </>
          ) : index === questions.length - 1 ? (
            "Simpan"
          ) : (
            <>
              Simpan &amp; Lanjut <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <RequireApprovedSppg>
      <AppShell variant="sppg">
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          }
        >
          <AssessmentContent />
        </Suspense>
      </AppShell>
    </RequireApprovedSppg>
  );
}
