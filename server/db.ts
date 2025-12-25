import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  accounts, InsertAccount, Account,
  vipAccounts, InsertVipAccount, VipAccount,
  invitees, InsertInvitee, Invitee,
  invitationLogs, InsertInvitationLog,
  creditTasks, InsertCreditTask,
  normalAccountLogs, InsertNormalAccountLog,
  vipAccountLogs, InsertVipAccountLog,
  normalAccountStock, InsertNormalAccountStock,
  vipAccountStock, InsertVipAccountStock,
  extractedNormalAccounts, InsertExtractedNormalAccount,
  extractedVipAccounts, InsertExtractedVipAccount,
  deletedNormalAccounts, InsertDeletedNormalAccount,
  deletedVipAccounts, InsertDeletedVipAccount,
  promotionCodes, InsertPromotionCode, PromotionCode,
} from "../drizzle/schema";
import { ENV } from './_core/env';

export type { 
  InsertAccount, Account,
  InsertVipAccount, VipAccount,
  InsertInvitee, Invitee,
  InsertInvitationLog,
  InsertCreditTask,
  InsertNormalAccountLog,
  InsertVipAccountLog,
  InsertNormalAccountStock,
  InsertVipAccountStock,
  InsertExtractedNormalAccount,
  InsertExtractedVipAccount,
  InsertDeletedNormalAccount,
  InsertDeletedVipAccount,
  InsertPromotionCode,
  PromotionCode,
};

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ Users ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Accounts (普通账号) ============
export async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
}

export async function getAvailableAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(accounts)
    .where(and(eq(accounts.isBlocked, false), sql`${accounts.inviteCode} IS NOT NULL`))
    .orderBy(desc(accounts.createdAt));
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return result[0] || null;
}

export async function getAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
  return result[0] || null;
}

export async function createAccount(data: InsertAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(accounts).values(data);
}

export async function updateAccount(id: number, data: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) return;
  await db.update(accounts).set(data).where(eq(accounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(accounts).where(eq(accounts.id, id));
}

// ============ VIP Accounts (会员账号) ============
export async function getAllVipAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vipAccounts).orderBy(desc(vipAccounts.createdAt));
}

export async function getAvailableVipAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vipAccounts)
    .where(and(eq(vipAccounts.isBlocked, false), sql`${vipAccounts.inviteCode} IS NOT NULL`))
    .orderBy(desc(vipAccounts.createdAt));
}

export async function getVipAccountById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vipAccounts).where(eq(vipAccounts.id, id)).limit(1);
  return result[0] || null;
}

export async function getVipAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vipAccounts).where(eq(vipAccounts.email, email)).limit(1);
  return result[0] || null;
}

export async function createVipAccount(data: InsertVipAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(vipAccounts).values(data);
}

export async function updateVipAccount(id: number, data: Partial<InsertVipAccount>) {
  const db = await getDb();
  if (!db) return;
  await db.update(vipAccounts).set(data).where(eq(vipAccounts.id, id));
}

export async function deleteVipAccount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vipAccounts).where(eq(vipAccounts.id, id));
}

// ============ Invitees (被邀请账号) ============
export async function getAllInvitees() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invitees).orderBy(desc(invitees.createdAt));
}

export async function getEligibleInvitees(limit?: number) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(invitees)
    .where(and(
      eq(invitees.inviteStatus, 'pending'),
      eq(invitees.isBlocked, false),
      eq(invitees.smsVerified, true),
      eq(invitees.freeCredits, 1000)
    ))
    .orderBy(desc(invitees.createdAt));
  
  if (limit) {
    return await query.limit(limit);
  }
  return await query;
}

export async function getInviteeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitees).where(eq(invitees.id, id)).limit(1);
  return result[0] || null;
}

export async function getInviteeByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(invitees).where(eq(invitees.email, email)).limit(1);
  return result[0] || null;
}

export async function createInvitee(data: InsertInvitee) {
  const db = await getDb();
  if (!db) return;
  await db.insert(invitees).values(data);
}

export async function updateInvitee(id: number, data: Partial<InsertInvitee>) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitees).set(data).where(eq(invitees.id, id));
}

export async function deleteInvitee(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(invitees).where(eq(invitees.id, id));
}

// ============ Invitation Logs ============
export async function getAllInvitationLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invitationLogs).orderBy(desc(invitationLogs.createdAt));
}

export async function createInvitationLog(data: InsertInvitationLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(invitationLogs).values(data);
}

// ============ Credit Tasks ============
export async function getAllCreditTasks() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(creditTasks).orderBy(desc(creditTasks.createdAt));
}

export async function getCreditTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(creditTasks).where(eq(creditTasks.id, id)).limit(1);
  return result[0] || null;
}

export async function createCreditTask(data: InsertCreditTask) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(creditTasks).values(data);
  return result[0]?.insertId;
}

export async function updateCreditTask(id: number, data: Partial<InsertCreditTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(creditTasks).set(data).where(eq(creditTasks.id, id));
}

export async function deleteCreditTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(creditTasks).where(eq(creditTasks.id, id));
}

// ============ Account Logs ============
export async function getAllNormalAccountLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(normalAccountLogs).orderBy(desc(normalAccountLogs.createdAt));
}

export async function createNormalAccountLog(data: InsertNormalAccountLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(normalAccountLogs).values(data);
}

export async function getAllVipAccountLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vipAccountLogs).orderBy(desc(vipAccountLogs.createdAt));
}

export async function createVipAccountLog(data: InsertVipAccountLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(vipAccountLogs).values(data);
}

// ============ Account Stock ============
export async function getAllNormalAccountStock() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(normalAccountStock).orderBy(desc(normalAccountStock.createdAt));
}

export async function getNormalAccountStockByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(normalAccountStock)
    .where(eq(normalAccountStock.creditCategory, category))
    .orderBy(desc(normalAccountStock.createdAt));
}

export async function createNormalAccountStock(data: InsertNormalAccountStock) {
  const db = await getDb();
  if (!db) return;
  await db.insert(normalAccountStock).values(data);
}

export async function deleteNormalAccountStock(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(normalAccountStock).where(eq(normalAccountStock.id, id));
}

export async function getNormalAccountStockById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(normalAccountStock).where(eq(normalAccountStock.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllVipAccountStock() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vipAccountStock).orderBy(desc(vipAccountStock.createdAt));
}

export async function getVipAccountStockByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vipAccountStock)
    .where(eq(vipAccountStock.creditCategory, category))
    .orderBy(desc(vipAccountStock.createdAt));
}

export async function createVipAccountStock(data: InsertVipAccountStock) {
  const db = await getDb();
  if (!db) return;
  await db.insert(vipAccountStock).values(data);
}

export async function deleteVipAccountStock(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vipAccountStock).where(eq(vipAccountStock.id, id));
}

export async function getVipAccountStockById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vipAccountStock).where(eq(vipAccountStock.id, id)).limit(1);
  return result[0] || null;
}

// ============ Extracted Accounts ============
export async function getAllExtractedNormalAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(extractedNormalAccounts).orderBy(desc(extractedNormalAccounts.extractedAt));
}

export async function createExtractedNormalAccount(data: InsertExtractedNormalAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(extractedNormalAccounts).values(data);
}

export async function getAllExtractedVipAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(extractedVipAccounts).orderBy(desc(extractedVipAccounts.extractedAt));
}

export async function createExtractedVipAccount(data: InsertExtractedVipAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(extractedVipAccounts).values(data);
}

// ============ Deleted Accounts ============
export async function getAllDeletedNormalAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deletedNormalAccounts).orderBy(desc(deletedNormalAccounts.deletedAt));
}

export async function createDeletedNormalAccount(data: InsertDeletedNormalAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(deletedNormalAccounts).values(data);
}

export async function getAllDeletedVipAccounts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deletedVipAccounts).orderBy(desc(deletedVipAccounts.deletedAt));
}

export async function createDeletedVipAccount(data: InsertDeletedVipAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(deletedVipAccounts).values(data);
}

// ============ Statistics ============
export async function getAccountStats() {
  const db = await getDb();
  if (!db) return { accounts: 0, vipAccounts: 0, invitees: 0, normalStock: 0, vipStock: 0 };
  
  const [accountsCount] = await db.select({ count: sql<number>`count(*)` }).from(accounts);
  const [vipAccountsCount] = await db.select({ count: sql<number>`count(*)` }).from(vipAccounts);
  const [inviteesCount] = await db.select({ count: sql<number>`count(*)` }).from(invitees);
  // normalStock现在显示accounts表的数量（与账号库存页面一致）
  const [vipStockCount] = await db.select({ count: sql<number>`count(*)` }).from(vipAccountStock);
  
  return {
    accounts: accountsCount?.count || 0,
    vipAccounts: vipAccountsCount?.count || 0,
    invitees: inviteesCount?.count || 0,
    normalStock: accountsCount?.count || 0, // 使用accounts表的数量
    vipStock: vipStockCount?.count || 0,
  };
}


// ============ Update Account Stock ============
export async function updateNormalAccountStock(id: number, data: Partial<InsertNormalAccountStock>) {
  const db = await getDb();
  if (!db) return;
  await db.update(normalAccountStock).set(data).where(eq(normalAccountStock.id, id));
}

export async function updateVipAccountStock(id: number, data: Partial<InsertVipAccountStock>) {
  const db = await getDb();
  if (!db) return;
  await db.update(vipAccountStock).set(data).where(eq(vipAccountStock.id, id));
}

export async function getNormalAccountStockByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(normalAccountStock).where(eq(normalAccountStock.email, email)).limit(1);
  return result[0] || null;
}

export async function getVipAccountStockByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vipAccountStock).where(eq(vipAccountStock.email, email)).limit(1);
  return result[0] || null;
}


// ==================== 兑换码相关函数 ====================

/**
 * 获取所有兑换码
 */
export async function getAllPromotionCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promotionCodes).orderBy(desc(promotionCodes.createdAt));
}

/**
 * 根据code获取兑换码
 */
export async function getPromotionCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(promotionCodes).where(eq(promotionCodes.code, code)).limit(1);
  return result[0] || null;
}

/**
 * 批量导入兑换码（自动去重）
 */
export async function importPromotionCodes(codes: string[]) {
  const db = await getDb();
  if (!db) return { imported: 0, duplicates: 0 };
  
  let imported = 0;
  let duplicates = 0;
  
  for (const code of codes) {
    const trimmedCode = code.trim();
    if (!trimmedCode) continue;
    
    // 检查是否已存在
    const existing = await getPromotionCodeByCode(trimmedCode);
    if (existing) {
      duplicates++;
      continue;
    }
    
    // 插入新兑换码
    await db.insert(promotionCodes).values({
      code: trimmedCode,
      status: "available",
    });
    imported++;
  }
  
  return { imported, duplicates };
}

/**
 * 删除兑换码
 */
export async function deletePromotionCode(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(promotionCodes).where(eq(promotionCodes.id, id));
  return true;
}

/**
 * 随机获取一个可用的兑换码
 */
export async function getRandomPromotionCode() {
  const db = await getDb();
  if (!db) return null;
  
  // 获取所有可用的兑换码
  const availableCodes = await db.select().from(promotionCodes).where(eq(promotionCodes.status, "available"));
  
  if (availableCodes.length === 0) return null;
  
  // 随机选择一个
  const randomIndex = Math.floor(Math.random() * availableCodes.length);
  return availableCodes[randomIndex];
}

/**
 * 标记兑换码已使用（但不改变状态，允许循环使用）
 */
export async function markPromotionCodeUsed(
  id: number, 
  accountId: number, 
  accountType: "normal" | "vip",
  email: string,
  creditsBefore: number,
  creditsAfter: number
) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(promotionCodes)
    .set({
      usedByAccountId: accountId,
      usedByAccountType: accountType,
      usedByEmail: email,
      usedAt: new Date(),
      creditsBefore,
      creditsAfter,
      // 不改变status，允许循环使用
    })
    .where(eq(promotionCodes.id, id));
  
  return true;
}

/**
 * 获取兑换码统计
 */
export async function getPromotionCodeStats() {
  const db = await getDb();
  if (!db) return { total: 0, available: 0, used: 0 };
  
  const all = await db.select().from(promotionCodes);
  const total = all.length;
  const available = all.filter(c => c.status === "available").length;
  const used = all.filter(c => c.usedAt !== null).length;
  
  return { total, available, used };
}
