import Link from "next/link";
import { OwnerOSLogo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <OwnerOSLogo />
      <div className="mt-8 w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Supabase Auth is used when configured. Until then, use the labeled demo workspace.
        </p>
        <AuthForm mode="login" />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Need an account?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
