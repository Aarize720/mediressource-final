import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcrypt";
import { User } from "./models";
import session from "express-session";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Session setup
  app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
  }));

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const hashedPassword = await bcrypt.hash(input.password, 10);

      const userData = {
        ...input,
        password: hashedPassword,
      };

      const newUser = new User(userData);
      await newUser.save();

      (req.session as any).userId = newUser._id.toString();

      res.status(201).json({
        user: { ...newUser.toObject(), password: undefined },
        message: "User registered successfully"
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      if (err.code === 11000) { // Duplicate key
        return res.status(400).json({ message: "Email or username already exists" });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);

      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user._id.toString();

      res.json({
        user: { ...user.toObject(), password: undefined },
        message: "Login successful"
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.get(api.auth.user.path, async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById((req.session as any).userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({ ...user.toObject(), password: undefined });
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Resources
  app.get(api.resources.list.path, async (req, res) => {
    const resourceType = req.query.type as string | undefined;
    let resources = await storage.getResources();
    if (resourceType) {
      resources = resources.filter(r => r.type === resourceType);
    }
    res.json(resources);
  });

  app.post(api.resources.create.path, async (req, res) => {
    try {
      const input = api.resources.create.input.parse(req.body);
      const resource = await storage.createResource(input);
      res.status(201).json(resource);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // Stocks
  app.get(api.stocks.list.path, async (req, res) => {
    const city = req.query.city as string | undefined;
    const critical = req.query.critical === 'true';
    
    let stocks = await storage.getStocks(city);
    if (critical) {
      stocks = stocks.filter(s => s.quantity <= (s.resource.criticalLevel || 10));
    }
    res.json(stocks);
  });

  app.post(api.stocks.update.path, async (req, res) => {
    try {
      const input = api.stocks.update.input.parse(req.body);
      const stock = await storage.updateStock(input);
      
      // Log to history
      await storage.createStockHistory({
        resourceId: input.resourceId,
        city: input.city,
        newQuantity: input.quantity,
        changeReason: "restock",
      });
      
      res.json(stock);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.get(api.stocks.history.path, async (req, res) => {
    const resourceId = Number(req.params.resourceId);
    const city = req.query.city as string | undefined;
    const days = req.query.days ? Number(req.query.days) : undefined;
    
    const history = await storage.getStockHistory(resourceId, city, days);
    res.json(history);
  });

  // Alerts
  app.get(api.alerts.list.path, async (req, res) => {
    const activeOnly = req.query.active !== 'false';
    let alerts = await storage.getAlerts();
    if (activeOnly) {
      alerts = alerts.filter(a => a.active);
    }
    res.json(alerts);
  });

  app.post(api.alerts.create.path, async (req, res) => {
    try {
      const input = api.alerts.create.input.parse(req.body);
      const alert = await storage.createAlert(input);
      res.status(201).json(alert);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.patch(api.alerts.resolve.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { active } = z.object({ active: z.boolean() }).parse(req.body);
      const alerts = await storage.getAlerts();
      const alert = alerts.find(a => a.id === id);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      // Update alert (simplified - in real app would use update method)
      res.json({ ...alert, active });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // Requests
  app.get(api.requests.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    let requests = await storage.getRequests();
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    res.json(requests);
  });

  app.post(api.requests.create.path, async (req, res) => {
    try {
      const input = api.requests.create.input.parse(req.body);
      const request = await storage.createRequest(input);
      
      // Create notification for admins
      // In real app, fetch all admin users and create notifications
      
      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.patch(api.requests.updateStatus.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status, notes, estimatedDeliveryDate } = z.object({
        status: z.enum(["pending", "approved", "rejected", "fulfilled", "cancelled"]),
        notes: z.string().optional(),
        estimatedDeliveryDate: z.string().optional(),
      }).parse(req.body);
      
      const request = await storage.updateRequestStatus(id, status);
      res.json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.get(api.requests.findMatches.path, async (req, res) => {
    const requestId = Number(req.params.id);
    const request = await storage.getRequestById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    
    // Find matching stocks
    let stocks = await storage.getStocks();
    const matches = stocks.filter(s => 
      s.resourceId === request.resourceId && 
      s.quantity >= request.quantity
    );
    
    res.json(matches);
  });

  // Notifications
  app.get(api.notifications.list.path, async (req, res) => {
    // In real app, get userId from auth session
    const userId = "user-id";
    const unread = req.query.unread === 'true';
    const notifications = await storage.getNotifications(userId, unread);
    res.json(notifications);
  });

  app.patch(api.notifications.markAsRead.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { read } = z.object({ read: z.boolean() }).parse(req.body);
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // Audit Logs
  app.get(api.auditLogs.list.path, async (req, res) => {
    const entity = req.query.entity as string | undefined;
    const days = req.query.days ? Number(req.query.days) : undefined;
    const logs = await storage.getAuditLogs(entity, days);
    res.json(logs);
  });

  // Distribution Plans
  app.get(api.distributionPlan.list.path, async (req, res) => {
    const plans = await storage.getDistributionPlans();
    res.json(plans);
  });

  app.post(api.distributionPlan.create.path, async (req, res) => {
    try {
      const input = api.distributionPlan.create.input.parse(req.body);
      const plan = await storage.createDistributionPlan(input);
      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // Analytics
  app.get(api.analytics.summary.path, async (req, res) => {
    const resources = await storage.getResources();
    const criticalStocks = await storage.getCriticalStocks();
    const alerts = await storage.getAlerts();
    const requests = await storage.getRequests();
    const stats = await storage.getRequestStats();
    
    res.json({
      totalResources: resources.length,
      criticalShortages: criticalStocks.length,
      pendingRequests: stats.pending,
      activeAlerts: alerts.filter(a => a.active).length,
    });
  });

  app.get(api.analytics.stockTrends.path, async (req, res) => {
    const resourceId = req.query.resourceId ? Number(req.query.resourceId) : undefined;
    const city = req.query.city as string | undefined;
    const days = req.query.days ? Number(req.query.days) : 30;
    
    // Simplified: return current stocks as trend data
    const stocks = await storage.getStocks(city);
    const trends = stocks
      .filter(s => !resourceId || s.resourceId === resourceId)
      .map(s => ({
        date: new Date().toISOString().split('T')[0],
        city: s.city,
        quantity: s.quantity,
        resourceName: s.resource.name,
      }));
    
    res.json(trends);
  });

  app.get(api.analytics.resourceDistribution.path, async (req, res) => {
    const stocks = await storage.getStocks();
    const distribution = new Map<string, any>();
    
    stocks.forEach(stock => {
      const key = `${stock.city}-${stock.resource.type}`;
      if (!distribution.has(key)) {
        distribution.set(key, {
          city: stock.city,
          resourceType: stock.resource.type,
          totalQuantity: 0,
          criticalCount: 0,
        });
      }
      const item = distribution.get(key)!;
      item.totalQuantity += stock.quantity;
      if (stock.quantity <= (stock.resource.criticalLevel || 10)) {
        item.criticalCount++;
      }
    });
    
    res.json(Array.from(distribution.values()));
  });

  // Export
  app.get(api.export.stocks.path, async (req, res) => {
    const format = (req.query.format as string) || "csv";
    const stocks = await storage.getStocks();
    
    if (format === "csv") {
      const csv = [
        ["ID", "Resource", "City", "Postal Code", "Quantity", "Updated At"],
        ...stocks.map(s => [
          s.id,
          s.resource.name,
          s.city,
          s.postalCode,
          s.quantity,
          s.updatedAt,
        ]),
      ]
        .map(row => row.join(","))
        .join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=stocks.csv");
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.json(stocks);
    }
  });

  app.get(api.export.requests.path, async (req, res) => {
    const format = (req.query.format as string) || "csv";
    const requests = await storage.getRequests();
    
    if (format === "csv") {
      const csv = [
        ["ID", "User", "Resource", "Quantity", "Status", "Urgency", "Created At"],
        ...requests.map(r => [
          r.id,
          r.user.firstName + " " + r.user.lastName,
          r.resource.name,
          r.quantity,
          r.status,
          r.urgency,
          r.createdAt,
        ]),
      ]
        .map(row => row.join(","))
        .join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=requests.csv");
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.json(requests);
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const resources = await storage.getResources();
  if (resources.length === 0) {
    console.log("Seeding database...");
    
    // Create Resources
    const r1 = await storage.createResource({ 
      name: "Masques FFP2", 
      type: "equipment", 
      description: "Masques de protection respiratoire",
    });
    const r2 = await storage.createResource({ 
      name: "Doliprane 1000mg", 
      type: "medication", 
      description: "Paracétamol",
    });
    const r3 = await storage.createResource({ 
      name: "Infirmier(e)", 
      type: "staff", 
      description: "Personnel soignant diplômé",
    });
    const r4 = await storage.createResource({ 
      name: "Respirateur", 
      type: "equipment", 
      description: "Ventilateur médical",
    });

    // Create Stocks
    await storage.updateStock({ resourceId: r1.id, city: "Paris", postalCode: "75001", quantity: 5000 });
    await storage.updateStock({ resourceId: r1.id, city: "Lyon", postalCode: "69001", quantity: 2000 });
    await storage.updateStock({ resourceId: r2.id, city: "Marseille", postalCode: "13001", quantity: 150 });
    await storage.updateStock({ resourceId: r2.id, city: "Paris", postalCode: "75001", quantity: 40 });
    await storage.updateStock({ resourceId: r3.id, city: "Bordeaux", postalCode: "33000", quantity: 5 });
    await storage.updateStock({ resourceId: r4.id, city: "Lille", postalCode: "59000", quantity: 8 });

    // Create Alerts
    await storage.createAlert({ 
      type: "shortage", 
      severity: "high", 
      message: "Pénurie de Doliprane à Marseille", 
      city: "Marseille",
      resourceId: r2.id,
    });
    await storage.createAlert({ 
      type: "epidemic", 
      severity: "medium", 
      message: "Pic de grippe en Île-de-France", 
      city: "Paris" 
    });
    await storage.createAlert({ 
      type: "maintenance", 
      severity: "low", 
      message: "Maintenance des respirateurs prévue", 
      city: "Lille",
      resourceId: r4.id,
    });
    
    console.log("Database seeded!");
  }
}
