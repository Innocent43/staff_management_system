"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";

import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field,INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useInviteEmployee } from "@/hooks/use-employee-mutations";
import { getErrorMessage } from "@/lib/errors";

// The rules for the form. Zod checks them before anything reaches the server.
const schema = z.object({
  full_name: z.string().trim().min(2, "Enter at least 2 characters").max(150),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(20, "Phone is too long"),
  role: z.enum(["manager", "employee"]),
});

// z.infer builds the TypeScript type FROM the schema, so they can never disagree
type FormValues = z.infer<typeof schema>;

export function InviteDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Invite
      </Button>
      {open && (
        <Modal title="Invite employee" onClose={() => setOpen(false)}>
          <InviteForm onDone={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const invite = useInviteEmployee();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema), // plugs Zod into the form
    defaultValues: { full_name: "", email: "", phone: "", role: "employee" },
  });

  // handleSubmit runs Zod first; onSubmit only runs when everything is valid
  function onSubmit(values: FormValues) {
    invite.mutate({ ...values, phone: values.phone || null });
  }

  if (invite.isSuccess) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-navy-700">
          Invite created for <b>{invite.data.email}</b>. They can accept it from the email we sent.
        </p>
        <Button onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {invite.error && <Alert>{getErrorMessage(invite.error)}</Alert>}

      <Field label="Full name" error={errors.full_name?.message}>
        <input className={INPUT_CLASS} {...register("full_name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" className={INPUT_CLASS} {...register("email")} />
      </Field>
      <Field label="Phone (optional)" error={errors.phone?.message}>
        <input className={INPUT_CLASS} {...register("phone")} />
      </Field>
      <Field label="Role" error={errors.role?.message}>
        <select className={INPUT_CLASS} {...register("role")}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>
      </Field>

      <Button type="submit" disabled={invite.isPending}>
        {invite.isPending ? "Sending..." : "Send invite"}
      </Button>
    </form>
  );
}