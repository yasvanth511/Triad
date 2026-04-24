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
  username: z.string().min(2, "Minimum 2 characters").max(50),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAccount, isAuthenticating } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await registerAccount(data.username, data.email, data.password);
      router.replace("/onboarding");
    } catch {
      // error shown via toast
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-8 w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Create Business Account</h1>
          <p className="text-sm text-[var(--color-muted-ink)]">Start reaching Triad users with events and offers</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("username")}
            label="Display name"
            placeholder="Your name or handle"
            error={errors.username?.message}
          />
          <Input
            {...register("email")}
            type="email"
            label="Business email"
            placeholder="you@business.com"
            error={errors.email?.message}
            autoComplete="email"
          />
          <Input
            {...register("password")}
            type="password"
            label="Password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            autoComplete="new-password"
          />
          <Button type="submit" loading={isAuthenticating} className="w-full justify-center">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted-ink)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-accent)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
