import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getAllAccounts: vi.fn().mockResolvedValue([]),
  getAvailableAccounts: vi.fn().mockResolvedValue([]),
  getAccountById: vi.fn().mockResolvedValue(null),
  getAccountByEmail: vi.fn().mockResolvedValue(null),
  createAccount: vi.fn().mockResolvedValue(undefined),
  updateAccount: vi.fn().mockResolvedValue(undefined),
  deleteAccount: vi.fn().mockResolvedValue(undefined),
  getAllVipAccounts: vi.fn().mockResolvedValue([]),
  getAvailableVipAccounts: vi.fn().mockResolvedValue([]),
  getAllInvitees: vi.fn().mockResolvedValue([]),
  getEligibleInvitees: vi.fn().mockResolvedValue([]),
  getAccountStats: vi.fn().mockResolvedValue({
    accounts: 5,
    vipAccounts: 3,
    invitees: 10,
    normalStock: 20,
    vipStock: 15,
  }),
  getAllInvitationLogs: vi.fn().mockResolvedValue([]),
  getAllCreditTasks: vi.fn().mockResolvedValue([]),
  getAllNormalAccountLogs: vi.fn().mockResolvedValue([]),
  getAllVipAccountLogs: vi.fn().mockResolvedValue([]),
  getAllNormalAccountStock: vi.fn().mockResolvedValue([]),
  getAllVipAccountStock: vi.fn().mockResolvedValue([]),
  getAllExtractedNormalAccounts: vi.fn().mockResolvedValue([]),
  getAllExtractedVipAccounts: vi.fn().mockResolvedValue([]),
  getAllDeletedNormalAccounts: vi.fn().mockResolvedValue([]),
  getAllDeletedVipAccounts: vi.fn().mockResolvedValue([]),
  createDeletedNormalAccount: vi.fn().mockResolvedValue(undefined),
  createDeletedVipAccount: vi.fn().mockResolvedValue(undefined),
}));

// Mock manusApi
vi.mock("./manusApi", () => ({
  parseToken: vi.fn().mockReturnValue({
    userId: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
  }),
  generateClientId: vi.fn().mockReturnValue("test-client-id-12345678901"),
  getUserInfo: vi.fn().mockResolvedValue({
    uid: "123",
    smsVerified: true,
    isBlocked: false,
  }),
  getCredits: vi.fn().mockResolvedValue({
    totalCredits: 1000,
    freeCredits: 1000,
    periodicCredits: 0,
    refreshCredits: 0,
  }),
  getInvitationCodes: vi.fn().mockResolvedValue({
    invitationCodes: [{ inviteCode: "TEST123", usedCount: 0, maxUseCount: 10 }],
  }),
  isBlocked: vi.fn().mockReturnValue(false),
  checkEligibility: vi.fn().mockReturnValue({ eligible: true, reason: "符合条件" }),
  getCreditCategory: vi.fn().mockReturnValue("1500"),
}));

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("stats.get", () => {
  it("returns account statistics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.get();

    expect(result).toEqual({
      accounts: 5,
      vipAccounts: 3,
      invitees: 10,
      normalStock: 20,
      vipStock: 15,
    });
  });
});

describe("accounts.list", () => {
  it("returns empty array when no accounts exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.accounts.list();

    expect(result).toEqual([]);
  });
});

describe("accounts.available", () => {
  it("returns empty array when no available accounts exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.accounts.available();

    expect(result).toEqual([]);
  });
});

describe("vipAccounts.list", () => {
  it("returns empty array when no VIP accounts exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vipAccounts.list();

    expect(result).toEqual([]);
  });
});

describe("invitees.list", () => {
  it("returns empty array when no invitees exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invitees.list();

    expect(result).toEqual([]);
  });
});

describe("invitationLogs.list", () => {
  it("returns empty array when no logs exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invitationLogs.list();

    expect(result).toEqual([]);
  });
});

describe("creditTasks.list", () => {
  it("returns empty array when no tasks exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.creditTasks.list();

    expect(result).toEqual([]);
  });
});

describe("stock.normal.list", () => {
  it("returns empty array when no stock exists", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.normal.list();

    expect(result).toEqual([]);
  });
});

describe("stock.vip.list", () => {
  it("returns empty array when no VIP stock exists", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.vip.list();

    expect(result).toEqual([]);
  });
});

describe("stock.extracted.normal", () => {
  it("returns empty array when no extracted accounts exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.extracted.normal();

    expect(result).toEqual([]);
  });
});

describe("stock.deleted.normal", () => {
  it("returns empty array when no deleted accounts exist", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.deleted.normal();

    expect(result).toEqual([]);
  });
});
