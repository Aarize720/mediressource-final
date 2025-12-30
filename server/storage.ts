import {
  User, Resource, Stock, Alert, Request, Notification, AuditLog, StockHistory, DistributionPlan,
} from "./models";
import {
  type IUser, type InsertUser,
  type IResource, type IStock, type IAlert, type IRequest, type INotification, type IAuditLog, type IStockHistory, type IDistributionPlan,
  type InsertResource, type InsertStock, type InsertAlert, type InsertRequest, type InsertNotification, type InsertAuditLog, type InsertStockHistory, type InsertDistributionPlan
} from "@shared/schema";

export interface IStorage {
  // User
  getUser(id: string): Promise<IUser | null>;
  getUserByUsername(username: string): Promise<IUser | null>;
  createUser(user: InsertUser): Promise<IUser>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<IUser>;

  // Resources
  getResources(): Promise<IResource[]>;
  createResource(resource: InsertResource): Promise<IResource>;

  // Stocks
  getStocks(city?: string): Promise<(IStock & { resource: IResource })[]>;
  updateStock(stock: InsertStock): Promise<IStock>;

  // Alerts
  getAlerts(): Promise<IAlert[]>;
  createAlert(alert: InsertAlert): Promise<IAlert>;

  // Requests
  getRequests(): Promise<(IRequest & { resource: IResource, user: IUser })[]>;
  createRequest(request: InsertRequest): Promise<IRequest>;
  updateRequestStatus(id: string, status: string, approvedBy?: string): Promise<IRequest>;
  getRequestById(id: string): Promise<IRequest | null>;

  // Notifications
  getNotifications(userId: string, unread?: boolean): Promise<INotification[]>;
  createNotification(notification: InsertNotification): Promise<INotification>;
  markNotificationAsRead(id: string): Promise<INotification>;

  // Audit Logs
  getAuditLogs(entity?: string, days?: number): Promise<IAuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<IAuditLog>;

  // Stock History
  getStockHistory(resourceId: string, city?: string, days?: number): Promise<IStockHistory[]>;
  createStockHistory(history: InsertStockHistory): Promise<IStockHistory>;

  // Distribution Plans
  getDistributionPlans(): Promise<IDistributionPlan[]>;
  createDistributionPlan(plan: InsertDistributionPlan): Promise<IDistributionPlan>;

  // Analytics
  getCriticalStocks(): Promise<(IStock & { resource: IResource })[]>;
  getRequestStats(): Promise<{ pending: number; approved: number; fulfilled: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username });
  }

  async createUser(insertUser: InsertUser): Promise<IUser> {
    const user = new User(insertUser);
    return await user.save();
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<IUser> {
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) throw new Error('User not found');
    return user;
  }

  async getResources(): Promise<IResource[]> {
    return await Resource.find();
  }

  async createResource(resource: InsertResource): Promise<IResource> {
    const res = new Resource(resource);
    return await res.save();
  }

  async getStocks(city?: string): Promise<(IStock & { resource: IResource })[]> {
    const query = Stock.find(city ? { city } : {}).populate('resourceId');
    const results = await query;
    return results.map(stock => ({
      ...stock.toObject(),
      resource: stock.resourceId,
    })) as (IStock & { resource: IResource })[];
  }

  async updateStock(insertStock: InsertStock): Promise<IStock> {
    const stock = new Stock(insertStock);
    return await stock.save();
  }

  async getAlerts(): Promise<IAlert[]> {
    return await Alert.find().sort({ createdAt: -1 });
  }

  async createAlert(alert: InsertAlert): Promise<IAlert> {
    const newAlert = new Alert(alert);
    return await newAlert.save();
  }

  async getRequests(): Promise<(IRequest & { resource: IResource, user: IUser })[]> {
    const results = await Request.find().populate('resourceId').populate('userId').sort({ createdAt: -1 });
    return results.map(req => ({
      ...req.toObject(),
      resource: req.resourceId,
      user: req.userId,
    })) as (IRequest & { resource: IResource, user: IUser })[];
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
