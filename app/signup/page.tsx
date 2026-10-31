import Link from "next/link";
import { OwnerOSLogo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <OwnerOSLogo />
      <div className="mt-8 w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Create your company</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 3 wires this to Supabase. The demo workspace is ready now.
        </p>
        <AuthForm mode="signup" />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
