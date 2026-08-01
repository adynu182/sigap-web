"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { Loader2, Plus, Trash2, Sparkles, Pencil, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAdmin } from "@/components/RequireAdmin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { db } from "@/lib/firebase";
import { Question } from "@/lib/types";
import { SEED_QUESTIONS } from "@/lib/seed-questions";

function AdminQuestionsContent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({ order: "", text: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "questions"), orderBy("order")));
    setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Question));
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function handleSeed() {
    setSeeding(true);
    const batch = writeBatch(db);
    SEED_QUESTIONS.forEach((q) => {
      const id = `q${String(q.order).padStart(3, "0")}`;
      batch.set(doc(db, "questions", id), q);
    });
    await batch.commit();
    setSeeding(false);
    load();
  }

  function startAdd() {
    setEditing(null);
    setForm({ order: String(questions.length + 1), text: "" });
  }

  function startEdit(q: Question) {
    setEditing(q);
    setForm({ order: String(q.order), text: q.text });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const order = Number(form.order);
    const id = editing?.id ?? `q${String(order).padStart(3, "0")}`;
    await setDoc(doc(db, "questions", id), { order, text: form.text.trim() });
    setSaving(false);
    setEditing(null);
    setForm({ order: "", text: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus klausul ini? Jawaban SPPG untuk klausul ini tidak ikut terhapus.")) return;
    await deleteDoc(doc(db, "questions", id));
    load();
  }

  const showForm = editing !== null || form.text !== "" || form.order !== "";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Pertanyaan</h1>
          <p className="mt-1 text-sm text-ink-soft">{questions.length} klausul aktif</p>
        </div>
        <div className="flex gap-2">
          {questions.length === 0 && (
            <Button variant="secondary" onClick={handleSeed} loading={seeding}>
              <Sparkles className="size-4" /> Isi 141 klausul contoh
            </Button>
          )}
          {!showForm && (
            <Button onClick={startAdd}>
              <Plus className="size-4" /> Tambah
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="mt-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink">
              {editing ? `Ubah klausul ${editing.order}` : "Klausul baru"}
            </h2>
            <button
              onClick={() => {
                setEditing(null);
                setForm({ order: "", text: "" });
              }}
              className="text-ink-soft cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
            <Input
              label="Nomor urut"
              type="number"
              min={1}
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              required
            />
            <Textarea
              label="Teks pertanyaan"
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              required
            />
            <Button type="submit" loading={saving} className="self-start">
              Simpan
            </Button>
          </form>
        </Card>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
        ) : questions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-soft">
            Belum ada klausul. Gunakan &ldquo;Isi 141 klausul contoh&rdquo; untuk memulai dengan
            daftar bawaan, atau tambahkan klausul secara manual.
          </Card>
        ) : (
          questions.map((q) => (
            <Card key={q.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <span className="tabular text-xs font-bold text-ink-soft">
                  Klausul {q.order}
                </span>
                <p className="mt-0.5 text-sm leading-relaxed text-ink">{q.text}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(q)}
                  className="flex size-8 items-center justify-center rounded-lg text-ink-soft hover:bg-black/5 cursor-pointer"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="flex size-8 items-center justify-center rounded-lg text-major hover:bg-major-soft cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminQuestionsPage() {
  return (
    <RequireAdmin>
      <AppShell variant="admin">
        <AdminQuestionsContent />
      </AppShell>
    </RequireAdmin>
  );
}
