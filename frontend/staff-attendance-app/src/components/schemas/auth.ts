import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const registerSchema = z.object({
  business_name: z.string().trim().min(2, "Enter your business name").max(150),
  full_name: z.string().trim().min(2, "Enter your full name").max(150),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(20, "Phone number is too long").optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const acceptInviteSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;