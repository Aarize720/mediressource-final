import { z } from 'zod';
import { 
  insertUserSchema, insertResourceSchema, insertStockSchema, insertAlertSchema, 
  insertRequestSchema, insertNotificationSchema, insertAuditLogSchema, insertDistributionPlanSchema,
  users, resources, stocks, alerts, requests, notifications, auditLogs, distributionPlan,
  stockHistory, insertStockHistorySchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/user',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
  },
  resources: {
    list: {
      method: 'GET' as const,
      path: '/api/resources',
      input: z.object({
        type: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof resources.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/resources',
      input: insertResourceSchema,
      responses: {
        201: z.custom<typeof resources.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/resources/:id',
      responses: {
        200: z.custom<typeof resources.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  stocks: {
    list: {
      method: 'GET' as const,
      path: '/api/stocks',
      input: z.object({
        city: z.string().optional(),
        critical: z.boolean().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof stocks.$inferSelect & { resource: typeof resources.$inferSelect }>()),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/stocks',
      input: insertStockSchema,
      responses: {
        200: z.custom<typeof stocks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/stocks/:resourceId/history',
      input: z.object({
        city: z.string().optional(),
        days: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof stockHistory.$inferSelect>()),
      },
    },
  },
  alerts: {
    list: {
      method: 'GET' as const,
      path: '/api/alerts',
      input: z.object({
        active: z.boolean().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof alerts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/alerts',
      input: insertAlertSchema,
      responses: {
        201: z.custom<typeof alerts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    resolve: {
      method: 'PATCH' as const,
      path: '/api/alerts/:id',
      input: z.object({ active: z.boolean() }),
      responses: {
        200: z.custom<typeof alerts.$inferSelect>(),
      },
    },
  },
  requests: {
    list: {
      method: 'GET' as const,
      path: '/api/requests',
      input: z.object({
        status: z.string().optional(),
        userId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof requests.$inferSelect & { resource: typeof resources.$inferSelect, user: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/requests',
      input: insertRequestSchema,
      responses: {
        201: z.custom<typeof requests.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/requests/:id',
      input: z.object({ 
        status: z.enum(["pending", "approved", "rejected", "fulfilled", "cancelled"]),
        notes: z.string().optional(),
        estimatedDeliveryDate: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof requests.$inferSelect>(),
      },
    },
    findMatches: {
      method: 'GET' as const,
      path: '/api/requests/:id/matches',
      responses: {
        200: z.array(z.custom<typeof stocks.$inferSelect & { resource: typeof resources.$inferSelect }>()),
      },
    },
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      input: z.object({ unread: z.boolean().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof notifications.$inferSelect>()),
      },
    },
    markAsRead: {
      method: 'PATCH' as const,
      path: '/api/notifications/:id',
      input: z.object({ read: z.boolean() }),
      responses: {
        200: z.custom<typeof notifications.$inferSelect>(),
      },
    },
  },
  auditLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs',
      input: z.object({
        entity: z.string().optional(),
        days: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect>()),
      },
    },
  },
  distributionPlan: {
    list: {
      method: 'GET' as const,
      path: '/api/distribution-plans',
      responses: {
        200: z.array(z.custom<typeof distributionPlan.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/distribution-plans',
      input: insertDistributionPlanSchema,
      responses: {
        201: z.custom<typeof distributionPlan.$inferSelect>(),
      },
    },
  },
  analytics: {
    summary: {
      method: 'GET' as const,
      path: '/api/analytics/summary',
      responses: {
        200: z.object({
          totalResources: z.number(),
          criticalShortages: z.number(),
          pendingRequests: z.number(),
          activeAlerts: z.number(),
        }),
      },
    },
    stockTrends: {
      method: 'GET' as const,
      path: '/api/analytics/stock-trends',
      input: z.object({
        resourceId: z.string().optional(),
        city: z.string().optional(),
        days: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.object({
          date: z.string(),
          city: z.string(),
          quantity: z.number(),
          resourceName: z.string(),
        })),
      },
    },
    resourceDistribution: {
      method: 'GET' as const,
      path: '/api/analytics/distribution',
      responses: {
        200: z.array(z.object({
          city: z.string(),
          resourceType: z.string(),
          totalQuantity: z.number(),
          criticalCount: z.number(),
        })),
      },
    },
  },
  export: {
    stocks: {
      method: 'GET' as const,
      path: '/api/export/stocks',
      input: z.object({ format: z.enum(["csv", "json"]).optional() }).optional(),
      responses: {
        200: z.string(),
      },
    },
    requests: {
      method: 'GET' as const,
      path: '/api/export/requests',
      input: z.object({ format: z.enum(["csv", "json"]).optional() }).optional(),
      responses: {
        200: z.string(),
      },
    },
  },
};
