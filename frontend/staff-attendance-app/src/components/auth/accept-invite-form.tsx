"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { acceptInviteSchema, type AcceptInviteFormValues } from "../schemas/auth";
import { acceptInvite } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

export function AcceptInviteForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const setToken = useAuthStore((state) => state.setToken);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({ resolver: zodResolver(acceptInviteSchema) });

  if (!token) {
    return <Alert>This invite link is incomplete. Please use the link from your email.</Alert>;
  }

  async function onSubmit(values: AcceptInviteFormValues) {
    setServerError(null);
    try {
      const { access_token } = await acceptInvite({
        token: token as string,
        password: values.password,
      });
      setToken(access_token);
      router.push("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && <Alert>{serverError}</Alert>}

      <Input
        label="Create a password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirm_password?.message}
        {...register("confirm_password")}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        Join and continue
      </Button>
    </form>
  );
}