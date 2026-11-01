import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export default function AcceptInvitePage() {
  return (
    <AuthShell
      title="Join your team"
      subtitle="Set a password to activate your account."
    >
      <Suspense>
        <AcceptInviteForm />
      </Suspense>
    </AuthShell>
  );
}