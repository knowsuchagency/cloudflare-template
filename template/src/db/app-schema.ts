import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// Hand-written app tables. Unlike schema.ts (regenerated wholesale by
// `bun run auth:generate`), this file is never touched by the Better Auth
// CLI — put custom tables here, not in schema.ts.

// Per-user AI token usage, bucketed by UTC calendar month ("YYYY-MM").
// This is the free-tier gate and the UI meter for everyone. It is NOT the
// billing source of truth for subscribers — Stripe's meter aggregates the
// same events over the real billing period and prices the overage.
export const aiUsage = sqliteTable(
  "ai_usage",
  {
    userId: text("user_id").notNull(),
    period: text("period").notNull(),
    tokensUsed: integer("tokens_used").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.period] })],
);
