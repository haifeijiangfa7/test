import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 账号表 - 存储邀请者账号信息（普通账号）
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  token: text("token").notNull(),
  clientId: varchar("clientId", { length: 22 }).notNull(),
  userId: varchar("userId", { length: 50 }),
  username: varchar("username", { length: 100 }),
  tokenIssuedAt: timestamp("tokenIssuedAt"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  uid: varchar("uid", { length: 50 }),
  membershipVersion: varchar("membershipVersion", { length: 20 }),
  membershipEndTime: timestamp("membershipEndTime"),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }),
  totalCredits: int("totalCredits"),
  freeCredits: int("freeCredits"),
  periodicCredits: int("periodicCredits"),
  refreshCredits: int("refreshCredits"),
  inviteCode: varchar("inviteCode", { length: 30 }),
  inviteUsedCount: int("inviteUsedCount").default(0),
  isBlocked: boolean("isBlocked").default(false),
  smsVerified: boolean("smsVerified").default(false),
  registeredAt: timestamp("registeredAt"),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * 会员账号表 - 存储已开通会员的账号信息
 */
export const vipAccounts = mysqlTable("vip_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  token: text("token").notNull(),
  clientId: varchar("clientId", { length: 22 }).notNull(),
  userId: varchar("userId", { length: 50 }),
  username: varchar("username", { length: 100 }),
  tokenIssuedAt: timestamp("tokenIssuedAt"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  uid: varchar("uid", { length: 50 }),
  membershipVersion: varchar("membershipVersion", { length: 20 }),
  membershipEndTime: timestamp("membershipEndTime"),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }),
  totalCredits: int("totalCredits"),
  freeCredits: int("freeCredits"),
  periodicCredits: int("periodicCredits"),
  refreshCredits: int("refreshCredits"),
  inviteCode: varchar("inviteCode", { length: 30 }),
  inviteUsedCount: int("inviteUsedCount").default(0),
  isBlocked: boolean("isBlocked").default(false),
  smsVerified: boolean("smsVerified").default(false),
  registeredAt: timestamp("registeredAt"),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VipAccount = typeof vipAccounts.$inferSelect;
export type InsertVipAccount = typeof vipAccounts.$inferInsert;

/**
 * 被邀请账号表 - 存储待邀请的账号信息
 */
export const invitees = mysqlTable("invitees", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  token: text("token").notNull(),
  clientId: varchar("clientId", { length: 22 }).notNull(),
  userId: varchar("userId", { length: 50 }),
  username: varchar("username", { length: 100 }),
  tokenIssuedAt: timestamp("tokenIssuedAt"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isBlocked: boolean("isBlocked").default(false),
  smsVerified: boolean("smsVerified").default(false),
  freeCredits: int("freeCredits"),
  inviteStatus: mysqlEnum("inviteStatus", ["pending", "invited", "failed", "ineligible"]).default("pending").notNull(),
  eligibilityReason: text("eligibilityReason"),
  invitedByCode: varchar("invitedByCode", { length: 30 }),
  invitedAt: timestamp("invitedAt"),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invitee = typeof invitees.$inferSelect;
export type InsertInvitee = typeof invitees.$inferInsert;

/**
 * 邀请记录表 - 记录每次邀请操作
 */
export const invitationLogs = mysqlTable("invitation_logs", {
  id: int("id").autoincrement().primaryKey(),
  inviterAccountId: int("inviterAccountId").notNull(),
  inviterEmail: varchar("inviterEmail", { length: 320 }).notNull(),
  inviteCode: varchar("inviteCode", { length: 30 }).notNull(),
  inviteeId: int("inviteeId").notNull(),
  inviteeEmail: varchar("inviteeEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  inviterCreditsBefore: int("inviterCreditsBefore"),
  inviterCreditsAfter: int("inviterCreditsAfter"),
  inviteeCreditsBefore: int("inviteeCreditsBefore"),
  inviteeCreditsAfter: int("inviteeCreditsAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvitationLog = typeof invitationLogs.$inferSelect;
export type InsertInvitationLog = typeof invitationLogs.$inferInsert;

/**
 * 制作积分任务表 - 记录制作指定积分账号的任务
 */
export const creditTasks = mysqlTable("credit_tasks", {
  id: int("id").autoincrement().primaryKey(),
  mode: mysqlEnum("mode", ["invite_only", "normal_account", "vip_account"]).default("invite_only").notNull(),
  targetAccountId: int("targetAccountId"),
  targetAccountType: mysqlEnum("targetAccountType", ["normal", "vip"]),
  targetInviteCode: varchar("targetInviteCode", { length: 30 }).notNull(),
  targetEmail: varchar("targetEmail", { length: 320 }),
  targetPassword: varchar("targetPassword", { length: 255 }),
  initialCredits: int("initialCredits").notNull(),
  targetCredits: int("targetCredits").notNull(),
  currentCredits: int("currentCredits"),
  requiredInvites: int("requiredInvites").notNull(),
  completedInvites: int("completedInvites").default(0),
  failedInvites: int("failedInvites").default(0),
  inviteeEmails: text("inviteeEmails"), // 存储被邀请者邮箱列表，用逗号分隔
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "paused"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditTask = typeof creditTasks.$inferSelect;
export type InsertCreditTask = typeof creditTasks.$inferInsert;

/**
 * 普通账号制作记录表
 */
export const normalAccountLogs = mysqlTable("normal_account_logs", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  targetCredits: int("targetCredits").notNull(),
  actualCredits: int("actualCredits"),
  inviteCount: int("inviteCount").default(0),
  taskId: int("taskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NormalAccountLog = typeof normalAccountLogs.$inferSelect;
export type InsertNormalAccountLog = typeof normalAccountLogs.$inferInsert;

/**
 * 会员账号制作记录表
 */
export const vipAccountLogs = mysqlTable("vip_account_logs", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  targetCredits: int("targetCredits").notNull(),
  actualCredits: int("actualCredits"),
  inviteCount: int("inviteCount").default(0),
  taskId: int("taskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VipAccountLog = typeof vipAccountLogs.$inferSelect;
export type InsertVipAccountLog = typeof vipAccountLogs.$inferInsert;

/**
 * 普通账号库存表
 */
export const normalAccountStock = mysqlTable("normal_account_stock", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  token: text("token"),
  clientId: varchar("clientId", { length: 22 }),
  credits: int("credits").notNull(),
  creditCategory: varchar("creditCategory", { length: 20 }).notNull(),
  membershipVersion: varchar("membershipVersion", { length: 20 }),
  inviteCode: varchar("inviteCode", { length: 30 }),
  inviteUsedCount: int("inviteUsedCount").default(0),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  batchId: varchar("batchId", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NormalAccountStock = typeof normalAccountStock.$inferSelect;
export type InsertNormalAccountStock = typeof normalAccountStock.$inferInsert;

/**
 * 会员账号库存表
 */
export const vipAccountStock = mysqlTable("vip_account_stock", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  token: text("token"),
  clientId: varchar("clientId", { length: 22 }),
  credits: int("credits").notNull(),
  creditCategory: varchar("creditCategory", { length: 20 }).notNull(),
  membershipVersion: varchar("membershipVersion", { length: 20 }),
  inviteCode: varchar("inviteCode", { length: 30 }),
  inviteUsedCount: int("inviteUsedCount").default(0),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  batchId: varchar("batchId", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VipAccountStock = typeof vipAccountStock.$inferSelect;
export type InsertVipAccountStock = typeof vipAccountStock.$inferInsert;

/**
 * 已提取普通账号表
 */
export const extractedNormalAccounts = mysqlTable("extracted_normal_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  credits: int("credits").notNull(),
  creditCategory: varchar("creditCategory", { length: 20 }),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
});

export type ExtractedNormalAccount = typeof extractedNormalAccounts.$inferSelect;
export type InsertExtractedNormalAccount = typeof extractedNormalAccounts.$inferInsert;

/**
 * 已提取会员账号表
 */
export const extractedVipAccounts = mysqlTable("extracted_vip_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  credits: int("credits").notNull(),
  creditCategory: varchar("creditCategory", { length: 20 }),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
});

export type ExtractedVipAccount = typeof extractedVipAccounts.$inferSelect;
export type InsertExtractedVipAccount = typeof extractedVipAccounts.$inferInsert;

/**
 * 已删除普通账号表
 */
export const deletedNormalAccounts = mysqlTable("deleted_normal_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  credits: int("credits"),
  creditCategory: varchar("creditCategory", { length: 20 }),
  sourceTable: varchar("sourceTable", { length: 50 }),
  deleteReason: mysqlEnum("deleteReason", ["manual", "ineligible", "blocked", "extracted"]).default("manual"),
  deleteReasonDetail: text("deleteReasonDetail"),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
});

export type DeletedNormalAccount = typeof deletedNormalAccounts.$inferSelect;
export type InsertDeletedNormalAccount = typeof deletedNormalAccounts.$inferInsert;

/**
 * 已删除会员账号表
 */
export const deletedVipAccounts = mysqlTable("deleted_vip_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  credits: int("credits"),
  creditCategory: varchar("creditCategory", { length: 20 }),
  sourceTable: varchar("sourceTable", { length: 50 }),
  deleteReason: mysqlEnum("deleteReason", ["manual", "ineligible", "blocked", "extracted"]).default("manual"),
  deleteReasonDetail: text("deleteReasonDetail"),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
});

export type DeletedVipAccount = typeof deletedVipAccounts.$inferSelect;
export type InsertDeletedVipAccount = typeof deletedVipAccounts.$inferInsert;


/**
 * 兑换码表 - 存储可循环使用的兑换码
 */
export const promotionCodes = mysqlTable("promotion_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  status: mysqlEnum("status", ["available", "used", "invalid"]).default("available").notNull(),
  usedByAccountId: int("usedByAccountId"),
  usedByAccountType: mysqlEnum("usedByAccountType", ["normal", "vip"]),
  usedByEmail: varchar("usedByEmail", { length: 320 }),
  usedAt: timestamp("usedAt"),
  creditsBefore: int("creditsBefore"),
  creditsAfter: int("creditsAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromotionCode = typeof promotionCodes.$inferSelect;
export type InsertPromotionCode = typeof promotionCodes.$inferInsert;
