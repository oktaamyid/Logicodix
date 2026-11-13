"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/app/(auth)/actions";
import { Loader2, AlertCircle } from "lucide-react";
import { GoogleAuthButton } from "@/components/operational/GoogleAuthButton";

interface LoginFormProps {
  redirectTo?: string;
  errorMessage?: string;
}

export function LoginForm({ redirectTo = "/dashboard", errorMessage }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(errorMessage || null);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }

      const target =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : res.data.redirectTo;

      router.push(target);
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

      {/* Google OAuth Login Button */}
      <GoogleAuthButton
        label="Masuk dengan Google"
        redirectTo={redirectTo}
      />

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-semibold">
            atau gunakan email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-foreground">
            Email Pemilik / Staf
          </label>
          <Input
            id="email"
            type="email"
            placeholder="nama@toko.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isPending}
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-foreground">
            Kata Sandi
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
              <span>Memverifikasi Akun...</span>
            </>
          ) : (
            <span>Masuk ke Dashboard</span>
          )}
        </Button>
      </form>
    </div>
  );
}
