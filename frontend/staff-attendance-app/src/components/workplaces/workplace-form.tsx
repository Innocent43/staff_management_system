"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useSaveWorkplace } from "@/hooks/use-workplace-mutations";
import { getErrorMessage } from "@/lib/errors";
import type { Workplace } from "@/types/workplaces";


const schema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(100, "Max 100 characters"),
});

type FormValues = z.infer<typeof schema>;

type Props = { workplace?: Workplace; onClose: () => void };

export function WorkplaceForm({ workplace, onClose }: Props) {
  const save = useSaveWorkplace(workplace);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: workplace?.name ?? "" },
  });

  function onSubmit(values: FormValues) {
    save.mutate({ name: values.name }, { onSuccess: onClose });
  }

  return (
    <Modal title={workplace ? "Rename workplace" : "New workplace"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {save.error && <Alert>{getErrorMessage(save.error)}</Alert>}

        <Field label="Name" error={errors.name?.message}>
          <input
            className={INPUT_CLASS}
            placeholder="e.g. Main shop, Factory gate"
            {...register("name")}
          />
        </Field>

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </Modal>
  );
}