"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LogoWordmark } from "@/components/app/logo-wordmark";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const authSchema = z.object({
  username: z.string().trim().optional(),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type AuthFormValues = z.infer<typeof authSchema>;

export function AuthScreen() {
  const router = useRouter();
  const { signIn, register, isAuthenticating, phase, isHydrated } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isHydrated && phase === "authenticated") {
      router.replace("/discover");
    }
  }, [isHydrated, phase, router]);

  const onSubmit = handleSubmit(async (values) => {
    if (mode === "login") {
      await signIn(values.email, values.password);
      router.replace("/discover");
      return;
    }

    await register(values.username?.trim() || "", values.email, values.password);
    router.replace("/discover");
  });

  return (
    <div className="screen-wrap flex min-h-screen items-center py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="hidden space-y-6 lg:block">
          <LogoWordmark className="text-7xl" />
          <div className="max-w-xl space-y-4">
            <p className="text-3xl font-semibold leading-tight text-[var(--color-ink)]">
              The same Triad energy, now shaped for desktop, tablet, and mobile web.
            </p>
            <p className="text-base leading-8 text-[var(--color-muted-ink)]">
              Couples, singles, rich profiles, Impress Me, events, saved intent, and trust signals
              all stay intact. The web shell adapts the layout, not the product.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Discover", "Glass cards, softer gradients, and the same triaged browsing flow."],
              ["Impress Me", "Prompt-response challenges carry the playful native tone into web."],
              ["Profile Depth", "Detailed preferences and trust cues stay visible instead of hidden."],
            ].map(([title, copy]) => (
              <Card key={title} className="space-y-2">
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
                <p className="text-sm leading-6 text-[var(--color-muted-ink)]">{copy}</p>
              </Card>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-xl space-y-6 p-6 sm:p-8">
          <div className="space-y-2 text-center">
            <LogoWordmark className="text-6xl" />
            <p className="text-sm leading-6 text-[var(--color-muted-ink)]">
              Sign in to the responsive Triad web app.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/65 bg-white/50 p-1">
            {[
              { label: "Sign In", value: "login" as const },
              { label: "Create Account", value: "register" as const },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMode(item.value)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  mode === item.value
                    ? "bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] text-white"
                    : "text-[var(--color-muted-ink)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "register" ? (
              <Field label="Username" error={errors.username?.message}>
                <Input placeholder="pick-an-alias" {...registerField("username")} />
              </Field>
            ) : null}

            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="you@example.com" {...registerField("email")} />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <Input type="password" placeholder="At least 8 characters" {...registerField("password")} />
            </Field>

            <Button className="w-full" size="lg" disabled={isAuthenticating}>
              {isAuthenticating ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--color-muted-ink)]">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
