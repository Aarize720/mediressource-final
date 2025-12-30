import mongoose, { Schema } from "mongoose";


const sessionSchema = new Schema({
  sid: { type: String, required: true, unique: true },
  sess: { type: Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true },
}, { timestamps: false });
sessionSchema.index({ expire: 1 });

const userSchema = new Schema({
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "professional", "admin"], default: "user", required: true },
  city: String,
  postalCode: String,
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  isProfessional: { type: Boolean, default: false },
  department: String, // Hospital/Clinic name
  phone: String,
}, { timestamps: true });

// === APP SCHEMAS ===
const resourceSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["medication", "equipment", "staff"], required: true },
  description: String,
  criticalLevel: { type: Number, default: 10 }, // Alert threshold
  recommendedStock: { type: Number, default: 100 }, // Target stock
}, { timestamps: true });

const stockSchema = new Schema({
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  lastRestockDate: Date,
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const stockHistorySchema = new Schema({
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  city: { type: String, required: true },
  previousQuantity: Number,
  newQuantity: Number,
  changeReason: { type: String, enum: ["restock", "request_fulfilled", "manual_adjustment", "consumption"] },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const alertSchema = new Schema({
  type: { type: String, enum: ["shortage", "epidemic", "info", "maintenance", "urgent"], required: true },
  severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
  message: { type: String, required: true },
  city: String,
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource' },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
}, { timestamps: true });

const requestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "fulfilled", "cancelled"], default: "pending" },
  urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  city: String,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  estimatedDeliveryDate: Date,
  notes: String,
}, { timestamps: true });

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ["request_update", "alert", "stock_warning", "approval_needed", "info"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  actionUrl: String,
}, { timestamps: true });

const auditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // create, update, delete
  entity: { type: String, required: true }, // resource, stock, alert, request
  entityId: Schema.Types.ObjectId,
  oldValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  ipAddress: String,
}, { timestamps: true });

const distributionPlanSchema = new Schema({
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  fromCity: { type: String, required: true },
  toCity: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ["planned", "in_transit", "delivered", "cancelled"], default: "planned" },
  estimatedArrival: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Models
export const Session = mongoose.model('Session', sessionSchema);
export const User = mongoose.model('User', userSchema);
export const Resource = mongoose.model('Resource', resourceSchema);
export const Stock = mongoose.model('Stock', stockSchema);
export const StockHistory = mongoose.model('StockHistory', stockHistorySchema);
export const Alert = mongoose.model('Alert', alertSchema);
export const Request = mongoose.model('Request', requestSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const DistributionPlan = mongoose.model('DistributionPlan', distributionPlanSchema);