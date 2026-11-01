import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your team."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-navy-800 hover:underline">
            Register your business
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}