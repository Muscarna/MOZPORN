import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

export const creatorProfileSchema = z.object({
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/),
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1000),
});
