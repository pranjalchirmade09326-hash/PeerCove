import { z } from "zod";

/**
 * Clean Architecture Entity Schemas for PeerCove.
 * Layer: modules / entities / schemas / peercove
 */

export const PeerCoveRoleSchema = z.enum([
  "member",
  "listener",
  "listener-supervisor",
  "safety-operations",
  "platform-administrator",
]);

export type TPeerCoveRole = z.infer<typeof PeerCoveRoleSchema>;

export const MemberSessionStatusSchema = z.enum([
  "pending",
  "active",
  "completed",
  "cancelled",
]);

export type TMemberSessionStatus = z.infer<typeof MemberSessionStatusSchema>;

export const MemberSessionItemSchema = z.object({
  id: z.string(),
  date: z.string().nullable().optional(),
  listenerName: z.string().nullable().optional(),
  status: MemberSessionStatusSchema,
  channel: z.enum(["chat", "voice", "video"]).default("chat"),
  note: z.string().nullable().optional(),
});

export type TMemberSessionItem = z.infer<typeof MemberSessionItemSchema>;

export const MemberDashboardStatsSchema = z.object({
  total: z.number().default(0),
  pending: z.number().default(0),
  completed: z.number().default(0),
  cancelled: z.number().default(0),
});

export type TMemberDashboardStats = z.infer<typeof MemberDashboardStatsSchema>;

export const ListenerQueueItemSchema = z.object({
  id: z.string(),
  memberDisplayName: z.string(),
  waitMinutes: z.number(),
  topic: z.string().optional(),
  channel: z.enum(["chat", "voice"]).default("chat"),
  urgency: z.enum(["routine", "support", "elevated"]).default("routine"),
  startedAt: z.string(),
});

export type TListenerQueueItem = z.infer<typeof ListenerQueueItemSchema>;

