import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// === AUTH TABLES (Mandatory for Replit Auth) ===
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: text("username").unique(),
  role: text("role", { enum: ["user", "professional", "admin"] }).default("user").notNull(),
  city: text("city"),
  postalCode: text("postal_code"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  isProfessional: boolean("is_professional").default(false),
  department: text("department"), // Hospital/Clinic name
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === APP TABLES ===
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["medication", "equipment", "staff"] }).notNull(),
  description: text("description"),
  criticalLevel: integer("critical_level").default(10), // Alert threshold
  recommendedStock: integer("recommended_stock").default(100), // Target stock
});

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  quantity: integer("quantity").notNull().default(0),
  lastRestockDate: timestamp("last_restock_date"),
  updateddBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockHistory = pgTable("stock_history", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  city: text("city").notNull(),
  previousQuantity: integer("previous_quantity"),
  newQuantity: integer("new_quantity"),
  changeReason: text("change_reason", { enum: ["restock", "request_fulfilled", "manual_adjustment", "consumption"] }),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["shortage", "epidemic", "info", "maintenance", "urgent"] }).notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  message: text("message").notNull(),
  city: text("city"),
  resourceId: integer("resource_id").references(() => resources.id),
  active: boolean("active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "fulfilled", "cancelled"] }).default("pending"),
  urgency: text("urgency", { enum: ["low", "medium", "high"] }).default("medium"),
  city: text("city"),
  approvedBy: varchar("approved_by").references(() => users.id),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["request_update", "alert", "stock_warning", "approval_needed", "info"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // create, update, delete
  entity: text("entity").notNull(), // resource, stock, alert, request
  entityId: integer("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const distributionPlan = pgTable("distribution_plan", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status", { enum: ["planned", "in_transit", "delivered", "cancelled"] }).default("planned"),
  estimatedArrival: timestamp("estimated_arrival"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true });
export const insertStockSchema = createInsertSchema(stocks).omit({ id: true, updatedAt: true });
export const insertStockHistorySchema = createInsertSchema(stockHistory).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertDistributionPlanSchema = createInsertSchema(distributionPlan).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = InsertUser;
export type Resource = typeof resources.$inferSelect;
export type Stock = typeof stocks.$inferSelect;
export type StockHistory = typeof stockHistory.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type DistributionPlan = typeof distributionPlan.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type InsertStockHistory = z.infer<typeof insertStockHistorySchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertDistributionPlan = z.infer<typeof insertDistributionPlanSchema>;
