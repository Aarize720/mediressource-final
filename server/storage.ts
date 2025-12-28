import { db } from "./db";
import {
  users, resources, stocks, alerts, requests, notifications, auditLogs, stockHistory, distributionPlan,
  type User, type InsertUser,
  type Resource, type Stock, type Alert, type Request, type Notification, type AuditLog, type StockHistory, type DistributionPlan,
  type InsertResource, type InsertStock, type InsertAlert, type InsertRequest, type InsertNotification, type InsertAuditLog, type InsertStockHistory, type InsertDistributionPlan
} from "@shared/schema";
import { eq, desc, and, lt, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Resources
  getResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;

  // Stocks
  getStocks(city?: string): Promise<(Stock & { resource: Resource })[]>;
  updateStock(stock: InsertStock): Promise<Stock>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;

  // Requests
  getRequests(): Promise<(Request & { resource: Resource, user: User })[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequestStatus(id: number, status: string, approvedBy?: string): Promise<Request>;
  getRequestById(id: number): Promise<Request | undefined>;

  // Notifications
  getNotifications(userId: string, unread?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;

  // Audit Logs
  getAuditLogs(entity?: string, days?: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Stock History
  getStockHistory(resourceId: number, city?: string, days?: number): Promise<StockHistory[]>;
  createStockHistory(history: InsertStockHistory): Promise<StockHistory>;

  // Distribution Plans
  getDistributionPlans(): Promise<DistributionPlan[]>;
  createDistributionPlan(plan: InsertDistributionPlan): Promise<DistributionPlan>;

  // Analytics
  getCriticalStocks(): Promise<(Stock & { resource: Resource })[]>;
  getRequestStats(): Promise<{ pending: number; approved: number; fulfilled: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [res] = await db.insert(resources).values(resource).returning();
    return res;
  }

  async getStocks(city?: string): Promise<(Stock & { resource: Resource })[]> {
    const query = db.select({
      id: stocks.id,
      resourceId: stocks.resourceId,
      city: stocks.city,
      postalCode: stocks.postalCode,
      quantity: stocks.quantity,
      updatedAt: stocks.updatedAt,
      resource: resources,
    })
    .from(stocks)
    .innerJoin(resources, eq(stocks.resourceId, resources.id));

    if (city) {
      query.where(eq(stocks.city, city));
    }
    
    // Execute query and cast the result to match the expected type
    const results = await query;
    return results as (Stock & { resource: Resource })[];
  }

  async updateStock(insertStock: InsertStock): Promise<Stock> {
    // Check if stock exists for this resource in this city
    const existing = await db.select()
      .from(stocks)
      .where(eq(stocks.resourceId, insertStock.resourceId));
    
    // Simple logic: just insert for now to track history or multiple entries, 
    // or update if we wanted to be stricter. Let's insert to keep it simple.
    const [stock] = await db.insert(stocks).values(insertStock).returning();
    return stock;
  }

  async getAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async getRequests(): Promise<(Request & { resource: Resource, user: User })[]> {
    const results = await db.select({
      id: requests.id,
      userId: requests.userId,
      resourceId: requests.resourceId,
      quantity: requests.quantity,
      status: requests.status,
      urgency: requests.urgency,
      createdAt: requests.createdAt,
      resource: resources,
      user: users,
    })
    .from(requests)
    .innerJoin(resources, eq(requests.resourceId, resources.id))
    .innerJoin(users, eq(requests.userId, users.id))
    .orderBy(desc(requests.createdAt));

    return results as (Request & { resource: Resource, user: User })[];
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const [req] = await db.insert(requests).values(request).returning();
    return req;
  }

  async updateRequestStatus(id: number, status: string, approvedBy?: string): Promise<Request> {
    const updateData: any = { status, updatedAt: new Date() };
    if (approvedBy) updateData.approvedBy = approvedBy;
    const [req] = await db.update(requests).set(updateData).where(eq(requests.id, id)).returning();
    return req;
  }

  async getRequestById(id: number): Promise<Request | undefined> {
    const [req] = await db.select().from(requests).where(eq(requests.id, id));
    return req;
  }

  async getNotifications(userId: string, unread?: boolean): Promise<Notification[]> {
    const query = db.select().from(notifications).where(eq(notifications.userId, userId));
    if (unread) query.where(eq(notifications.read, false));
    return await query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(notification).returning();
    return notif;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [notif] = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
    return notif;
  }

  async getAuditLogs(entity?: string, days?: number): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    if (entity) query.where(eq(auditLogs.entity, entity));
    if (days) {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      query.where(gte(auditLogs.createdAt, cutoffDate));
    }
    return await query.orderBy(desc(auditLogs.createdAt));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [audit] = await db.insert(auditLogs).values(log).returning();
    return audit;
  }

  async getStockHistory(resourceId: number, city?: string, days?: number): Promise<StockHistory[]> {
    let query = db.select().from(stockHistory).where(eq(stockHistory.resourceId, resourceId));
    if (city) query.where(eq(stockHistory.city, city));
    if (days) {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      query.where(gte(stockHistory.createdAt, cutoffDate));
    }
    return await query.orderBy(desc(stockHistory.createdAt));
  }

  async createStockHistory(history: InsertStockHistory): Promise<StockHistory> {
    const [sh] = await db.insert(stockHistory).values(history).returning();
    return sh;
  }

  async getDistributionPlans(): Promise<DistributionPlan[]> {
    return await db.select().from(distributionPlan).orderBy(desc(distributionPlan.createdAt));
  }

  async createDistributionPlan(plan: InsertDistributionPlan): Promise<DistributionPlan> {
    const [dp] = await db.insert(distributionPlan).values(plan).returning();
    return dp;
  }

  async getCriticalStocks(): Promise<(Stock & { resource: Resource })[]> {
    const results = await db.select({
      id: stocks.id,
      resourceId: stocks.resourceId,
      city: stocks.city,
      postalCode: stocks.postalCode,
      quantity: stocks.quantity,
      updatedAt: stocks.updatedAt,
      lastRestockDate: stocks.lastRestockDate,
      updateddBy: stocks.updateddBy,
      resource: resources,
    })
    .from(stocks)
    .innerJoin(resources, eq(stocks.resourceId, resources.id))
    .where(sql`${stocks.quantity} <= ${resources.criticalLevel}`);
    
    return results as (Stock & { resource: Resource })[];
  }

  async getRequestStats(): Promise<{ pending: number; approved: number; fulfilled: number }> {
    const stats = await db.select({
      status: requests.status,
      count: sql<number>`count(*)`,
    })
    .from(requests)
    .groupBy(requests.status);

    return {
      pending: stats.find(s => s.status === 'pending')?.count || 0,
      approved: stats.find(s => s.status === 'approved')?.count || 0,
      fulfilled: stats.find(s => s.status === 'fulfilled')?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
