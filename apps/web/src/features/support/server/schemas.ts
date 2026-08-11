import { z } from "zod";

export const ticketCategory = z.enum([
  "JOB",
  "PAYMENT",
  "WALLET",
  "SECURITY",
  "DISPUTE",
  "GENERAL",
]);
export const ticketStatus = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
]);
export const ticketPriority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

export const createTicketSchema = z.object({
  subject: z.string().trim().min(5).max(160),
  category: ticketCategory,
  referenceId: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((value) => value || undefined),
  message: z.string().trim().min(10).max(5000),
});

export const createMessageSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  internal: z.boolean().optional().default(false),
});

export const updateTicketSchema = z
  .object({
    status: ticketStatus.optional(),
    priority: ticketPriority.optional(),
    assignedTo: z.string().uuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one ticket update.");
