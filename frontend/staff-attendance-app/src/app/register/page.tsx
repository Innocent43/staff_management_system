import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your business account"
      subtitle="Set up in minutes and invite your team."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-navy-800 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}