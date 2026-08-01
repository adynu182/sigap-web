"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthProvider";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Email ini sudah terdaftar. Coba masuk, atau gunakan email lain.",
  "auth/invalid-email": "Format email tidak valid.",
  "auth/weak-password": "Password minimal 6 karakter.",
  "auth/operation-not-allowed":
    "Sign-in method Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method).",
  "auth/unauthorized-domain":
    "Domain ini belum diizinkan di Firebase Console (Authentication → Settings → Authorized domains).",
  "auth/configuration-not-found":
    "Konfigurasi Firebase Authentication tidak ditemukan. Pastikan Authentication sudah diaktifkan di Firebase Console.",
  "auth/network-request-failed": "Koneksi bermasalah. Periksa internet, lalu coba lagi.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "API key Firebase tidak valid. Periksa kembali variabel lingkungan NEXT_PUBLIC_FIREBASE_*.",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    namaSppg: "",
    wilayah: "",
    penanggungJawab: "",
    telepon: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      await register(form);
      router.push("/pending");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(AUTH_ERROR_MESSAGES[err.code] ?? `Pendaftaran gagal (${err.code}). Coba lagi.`);
      } else {
        setError("Pendaftaran gagal. Coba lagi.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>

        <Card className="mt-6 p-6 sm:p-7">
          <h1 className="font-display text-xl font-bold text-ink">
            Daftarkan SPPG Anda
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Akun akan aktif setelah diverifikasi oleh administrator.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Nama SPPG"
              name="namaSppg"
              placeholder="mis. SPPG Kecamatan Cibadak"
              value={form.namaSppg}
              onChange={(e) => update("namaSppg", e.target.value)}
              required
            />
            <Input
              label="Wilayah"
              name="wilayah"
              placeholder="mis. Kabupaten Sukabumi, Jawa Barat"
              value={form.wilayah}
              onChange={(e) => update("wilayah", e.target.value)}
              required
            />
            <Input
              label="Penanggung jawab"
              name="penanggungJawab"
              placeholder="Nama kepala SPPG / PIC"
              value={form.penanggungJawab}
              onChange={(e) => update("penanggungJawab", e.target.value)}
              required
            />
            <Input
              label="Nomor telepon"
              name="telepon"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={form.telepon}
              onChange={(e) => update("telepon", e.target.value)}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="nama@sppg.id"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
            <Input
              label="Konfirmasi password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />

            {error && (
              <p className="rounded-xl bg-major-soft px-3.5 py-2.5 text-sm text-major">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              Daftar
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-ink-soft">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
