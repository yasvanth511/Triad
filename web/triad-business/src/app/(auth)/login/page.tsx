"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticating } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await signIn(data.email, data.password);
      router.replace("/dashboard");
    } catch {
      // error shown via toast in session provider
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Triad for Business</h1>
          <p className="text-sm text-[var(--color-muted-ink)]">Sign in to your business account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("email")}
            type="email"
            label="Email"
            placeholder="you@business.com"
            error={errors.email?.message}
            autoComplete="email"
          />
          <Input
            {...register("password")}
            type="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            autoComplete="current-password"
          />
          <Button type="submit" loading={isAuthenticating} className="w-full justify-center">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted-ink)]">
          No account?{" "}
          <Link href="/register" className="text-[var(--color-accent)] font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
