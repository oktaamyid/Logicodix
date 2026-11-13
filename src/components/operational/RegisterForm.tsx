"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/app/(auth)/actions";
import { Loader2, AlertCircle } from "lucide-react";
import { GoogleAuthButton } from "@/components/operational/GoogleAuthButton";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok dengan kata sandi");
      return;
    }

    startTransition(async () => {
      const res = await registerAction({
        fullName,
        email,
        password,
        confirmPassword,
      });

      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }

      router.push(res.data.redirectTo);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google OAuth Register Button */}
      <GoogleAuthButton
        label="Daftar dengan Google"
        redirectTo="/onboarding"
      />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-semibold">
            atau daftar dengan email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-xs font-semibold text-foreground">
            Nama Lengkap Pengelola
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="Contoh: Budi Santoso"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isPending}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-xs font-semibold text-foreground">
            Alamat Email Aktif
          </label>
          <Input
            id="reg-email"
            type="email"
            placeholder="budi@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isPending}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-xs font-semibold text-foreground">
            Kata Sandi (Min. 6 Karakter)
          </label>
          <Input
            id="reg-password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={isPending}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
            Ulangi Kata Sandi
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={isPending}
            className="min-h-[44px]"
          />
        </div>

        <Button
          type="submit"
          className="w-full min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Mendaftarkan Akun...</span>
            </>
          ) : (
            <span>Daftar Sekarang</span>
          )}
        </Button>
      </form>
    </div>
  );
}
