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
  "auth/invalid-credential": "Email atau password salah.",
  "auth/user-not-found": "Email atau password salah.",
  "auth/wrong-password": "Email atau password salah.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
  "auth/operation-not-allowed":
    "Sign-in method Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method).",
  "auth/unauthorized-domain":
    "Domain ini belum diizinkan di Firebase Console (Authentication → Settings → Authorized domains).",
  "auth/configuration-not-found":
    "Konfigurasi Firebase Authentication tidak ditemukan. Pastikan Authentication sudah diaktifkan di Firebase Console.",
  "auth/network-request-failed": "Koneksi bermasalah. Periksa internet, lalu coba lagi.",
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(AUTH_ERROR_MESSAGES[err.code] ?? `Gagal masuk (${err.code}). Coba lagi.`);
      } else {
        setError("Gagal masuk. Coba lagi.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-sm">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>

        <Card className="mt-6 p-6 sm:p-7">
          <h1 className="font-display text-xl font-bold text-ink">Masuk</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Masuk ke akun SPPG atau administrator Anda.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-xl bg-major-soft px-3.5 py-2.5 text-sm text-major">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              Masuk
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-sm text-ink-soft">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-brand">
            Daftarkan SPPG
          </Link>
        </p>
      </div>
    </div>
  );
}
