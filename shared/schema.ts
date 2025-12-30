import { z } from "zod";

// Zod Schemas (keeping similar structure)
export const insertUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(["user", "professional", "admin"]).default("user"),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  isProfessional: z.boolean().default(false),
  department: z.string().optional(),
  phone: z.string().optional(),
});

export const insertResourceSchema = z.object({
  name: z.string(),
  type: z.enum(["medication", "equipment", "staff"]),
  description: z.string().optional(),
  criticalLevel: z.number().default(10),
  recommendedStock: z.number().default(100),
});

export const insertStockSchema = z.object({
  resourceId: z.string(), // ObjectId as string
  city: z.string(),
  postalCode: z.string(),
  quantity: z.number().default(0),
  lastRestockDate: z.date().optional(),
  updatedBy: z.string().optional(),
});

export const insertStockHistorySchema = z.object({
  resourceId: z.string(),
  city: z.string(),
  previousQuantity: z.number().optional(),
  newQuantity: z.number().optional(),
  changeReason: z.enum(["restock", "request_fulfilled", "manual_adjustment", "consumption"]).optional(),
  updatedBy: z.string().optional(),
});

export const insertAlertSchema = z.object({
  type: z.enum(["shortage", "epidemic", "info", "maintenance", "urgent"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  message: z.string(),
  city: z.string().optional(),
  resourceId: z.string().optional(),
  active: z.boolean().default(true),
  createdBy: z.string().optional(),
  resolvedAt: z.date().optional(),
});

export const insertRequestSchema = z.object({
  userId: z.string(),
  resourceId: z.string(),
  quantity: z.number(),
  status: z.enum(["pending", "approved", "rejected", "fulfilled", "cancelled"]).default("pending"),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
  city: z.string().optional(),
  approvedBy: z.string().optional(),
  estimatedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(["request_update", "alert", "stock_warning", "approval_needed", "info"]),
  title: z.string(),
  message: z.string(),
  read: z.boolean().default(false),
  actionUrl: z.string().optional(),
});

export const insertAuditLogSchema = z.object({
  userId: z.string().optional(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string().optional(),
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  ipAddress: z.string().optional(),
});

export const insertDistributionPlanSchema = z.object({
  resourceId: z.string(),
  fromCity: z.string(),
  toCity: z.string(),
  quantity: z.number(),
  status: z.enum(["planned", "in_transit", "delivered", "cancelled"]).default("planned"),
  estimatedArrival: z.date().optional(),
  createdBy: z.string().optional(),
});

// Types
export type IUser = Document & {
  email?: string;
  username?: string;
  role: string;
  city?: string;
  postalCode?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isProfessional: boolean;
  department?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IResource = Document & {
  name: string;
  type: string;
  description?: string;
  criticalLevel: number;
  recommendedStock: number;
  createdAt: Date;
  updatedAt: Date;
};

export type IStock = Document & {
  resourceId: string;
  city: string;
  postalCode: string;
  quantity: number;
  lastRestockDate?: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IStockHistory = Document & {
  resourceId: string;
  city: string;
  previousQuantity?: number;
  newQuantity?: number;
  changeReason?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IAlert = Document & {
  type: string;
  severity: string;
  message: string;
  city?: string;
  resourceId?: string;
  active: boolean;
  createdBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type IRequest = Document & {
  userId: string;
  resourceId: string;
  quantity: number;
  status: string;
  urgency: string;
  city?: string;
  approvedBy?: string;
  estimatedDeliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type INotification = Document & {
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IAuditLog = Document & {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IDistributionPlan = Document & {
  resourceId: string;
  fromCity: string;
  toCity: string;
  quantity: number;
  status: string;
  estimatedArrival?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Insert Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type InsertStockHistory = z.infer<typeof insertStockHistorySchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertDistributionPlan = z.infer<typeof insertDistributionPlanSchema>;
