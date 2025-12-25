import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as manusApi from "./manusApi";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ 统计信息 ============
  stats: router({
    get: publicProcedure.query(async () => {
      return await db.getAccountStats();
    }),
  }),

  // ============ 普通账号管理 ============
  accounts: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAccounts();
    }),

    available: publicProcedure.query(async () => {
      return await db.getAvailableAccounts();
    }),

    import: publicProcedure
      .input(z.object({ data: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.data.trim().split('\n').filter(line => line.trim());
        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const line of lines) {
          const parts = line.split('----');
          if (parts.length !== 3) {
            results.failed++;
            results.errors.push(`格式错误: ${line.substring(0, 50)}...`);
            continue;
          }

          const [email, password, token] = parts.map(p => p.trim());
          
          const existing = await db.getAccountByEmail(email);
          if (existing) {
            results.failed++;
            results.errors.push(`账号已存在: ${email}`);
            continue;
          }

          const tokenInfo = manusApi.parseToken(token);
          if (!tokenInfo) {
            results.failed++;
            results.errors.push(`Token解析失败: ${email}`);
            continue;
          }

          const clientId = manusApi.generateClientId();

          await db.createAccount({
            email, password, token, clientId,
            userId: tokenInfo.userId,
            username: tokenInfo.name,
            tokenIssuedAt: tokenInfo.issuedAt,
            tokenExpiresAt: tokenInfo.expiresAt,
          });
          results.success++;
        }

        return results;
      }),

    refresh: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const account = await db.getAccountById(input.id);
        if (!account) throw new Error('账号不存在');

        try {
          const userInfo = await manusApi.getUserInfo(account.token, account.clientId);
          
          if (manusApi.isBlocked(userInfo)) {
            await db.updateAccount(input.id, { isBlocked: true, lastCheckedAt: new Date() });
            return { ...account, isBlocked: true, error: '账号已被封禁' };
          }

          const credits = await manusApi.getCredits(account.token, account.clientId);
          const inviteCodes = await manusApi.getInvitationCodes(account.token, account.clientId);
          const inviteCode = inviteCodes.invitationCodes?.[0];

          const updateData: Partial<db.InsertAccount> = {
            uid: userInfo.uid,
            membershipVersion: userInfo.membershipVersion,
            membershipEndTime: userInfo.currentPeriodEnd ? new Date(parseInt(userInfo.currentPeriodEnd) * 1000) : null,
            subscriptionStatus: userInfo.subscriptionStatus,
            smsVerified: userInfo.smsVerified,
            registeredAt: userInfo.registeredAt ? new Date(userInfo.registeredAt) : null,
            totalCredits: credits.totalCredits,
            freeCredits: credits.freeCredits,
            periodicCredits: credits.periodicCredits,
            refreshCredits: credits.refreshCredits,
            inviteCode: inviteCode?.inviteCode,
            inviteUsedCount: inviteCode?.usedCount || 0,
            isBlocked: false,
            lastCheckedAt: new Date(),
          };

          await db.updateAccount(input.id, updateData);
          return { ...account, ...updateData };
        } catch (error: any) {
          return { ...account, error: error.message };
        }
      }),

    refreshAll: publicProcedure.mutation(async () => {
      const accounts = await db.getAllAccounts();
      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const account of accounts) {
        try {
          const userInfo = await manusApi.getUserInfo(account.token, account.clientId);
          
          if (manusApi.isBlocked(userInfo)) {
            await db.updateAccount(account.id, { isBlocked: true, lastCheckedAt: new Date() });
            results.success++;
            continue;
          }

          const credits = await manusApi.getCredits(account.token, account.clientId);
          const inviteCodes = await manusApi.getInvitationCodes(account.token, account.clientId);
          const inviteCode = inviteCodes.invitationCodes?.[0];

          await db.updateAccount(account.id, {
            uid: userInfo.uid,
            membershipVersion: userInfo.membershipVersion,
            membershipEndTime: userInfo.currentPeriodEnd ? new Date(parseInt(userInfo.currentPeriodEnd) * 1000) : null,
            subscriptionStatus: userInfo.subscriptionStatus,
            smsVerified: userInfo.smsVerified,
            registeredAt: userInfo.registeredAt ? new Date(userInfo.registeredAt) : null,
            totalCredits: credits.totalCredits,
            freeCredits: credits.freeCredits,
            periodicCredits: credits.periodicCredits,
            refreshCredits: credits.refreshCredits,
            inviteCode: inviteCode?.inviteCode,
            inviteUsedCount: inviteCode?.usedCount || 0,
            isBlocked: false,
            lastCheckedAt: new Date(),
          });
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${account.email}: ${error.message}`);
        }
      }

      return results;
    }),

    delete: publicProcedure
      .input(z.object({ id: z.number(), reason: z.enum(['manual', 'ineligible', 'blocked']).optional(), reasonDetail: z.string().optional() }))
      .mutation(async ({ input }) => {
        const account = await db.getAccountById(input.id);
        if (account) {
          await db.createDeletedNormalAccount({
            email: account.email,
            password: account.password,
            credits: account.totalCredits,
            sourceTable: 'accounts',
            deleteReason: input.reason || 'manual',
            deleteReasonDetail: input.reasonDetail || '手动删除',
          });
        }
        await db.deleteAccount(input.id);
        return { success: true };
      }),

    deleteAll: publicProcedure.mutation(async () => {
      const accounts = await db.getAllAccounts();
      let count = 0;
      for (const account of accounts) {
        await db.createDeletedNormalAccount({
          email: account.email,
          password: account.password,
          credits: account.totalCredits,
          sourceTable: 'accounts',
          deleteReason: 'manual',
          deleteReasonDetail: '批量删除',
        });
        await db.deleteAccount(account.id);
        count++;
      }
      return { count };
    }),

    extractRandom: publicProcedure.mutation(async () => {
      const allAccounts = await db.getAllAccounts();
      if (!allAccounts || allAccounts.length === 0) {
        throw new Error('没有可提取的账号');
      }
      const randomIndex = Math.floor(Math.random() * allAccounts.length);
      const account = allAccounts[randomIndex];
      
      await db.createExtractedNormalAccount({
        email: account.email,
        password: account.password,
        credits: account.totalCredits || 0,
        creditCategory: manusApi.getCreditCategory(account.totalCredits || 0),
      });
      
      await db.deleteAccount(account.id);
      
      return { 
        email: account.email, 
        password: account.password, 
        credits: account.totalCredits,
        inviteCode: account.inviteCode
      };
    }),

    export: publicProcedure.query(async () => {
      const accounts = await db.getAllAccounts();
      return accounts.map(a => `${a.email}----${a.password}----${a.token}`).join('\n');
    }),
  }),

  // ============ 会员账号管理 ============
  vipAccounts: router({
    list: publicProcedure.query(async () => {
      return await db.getAllVipAccounts();
    }),

    available: publicProcedure.query(async () => {
      return await db.getAvailableVipAccounts();
    }),

    import: publicProcedure
      .input(z.object({ data: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.data.trim().split('\n').filter(line => line.trim());
        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const line of lines) {
          const parts = line.split('----');
          if (parts.length !== 3) {
            results.failed++;
            results.errors.push(`格式错误: ${line.substring(0, 50)}...`);
            continue;
          }

          const [email, password, token] = parts.map(p => p.trim());
          
          const existing = await db.getVipAccountByEmail(email);
          if (existing) {
            results.failed++;
            results.errors.push(`账号已存在: ${email}`);
            continue;
          }

          const tokenInfo = manusApi.parseToken(token);
          if (!tokenInfo) {
            results.failed++;
            results.errors.push(`Token解析失败: ${email}`);
            continue;
          }

          const clientId = manusApi.generateClientId();

          await db.createVipAccount({
            email, password, token, clientId,
            userId: tokenInfo.userId,
            username: tokenInfo.name,
            tokenIssuedAt: tokenInfo.issuedAt,
            tokenExpiresAt: tokenInfo.expiresAt,
          });
          results.success++;
        }

        return results;
      }),

    refresh: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const account = await db.getVipAccountById(input.id);
        if (!account) throw new Error('账号不存在');

        try {
          const userInfo = await manusApi.getUserInfo(account.token, account.clientId);
          
          if (manusApi.isBlocked(userInfo)) {
            await db.updateVipAccount(input.id, { isBlocked: true, lastCheckedAt: new Date() });
            return { ...account, isBlocked: true, error: '账号已被封禁' };
          }

          const credits = await manusApi.getCredits(account.token, account.clientId);
          const inviteCodes = await manusApi.getInvitationCodes(account.token, account.clientId);
          const inviteCode = inviteCodes.invitationCodes?.[0];

          const updateData: Partial<db.InsertVipAccount> = {
            uid: userInfo.uid,
            membershipVersion: userInfo.membershipVersion,
            membershipEndTime: userInfo.currentPeriodEnd ? new Date(parseInt(userInfo.currentPeriodEnd) * 1000) : null,
            subscriptionStatus: userInfo.subscriptionStatus,
            smsVerified: userInfo.smsVerified,
            registeredAt: userInfo.registeredAt ? new Date(userInfo.registeredAt) : null,
            totalCredits: credits.totalCredits,
            freeCredits: credits.freeCredits,
            periodicCredits: credits.periodicCredits,
            refreshCredits: credits.refreshCredits,
            inviteCode: inviteCode?.inviteCode,
            inviteUsedCount: inviteCode?.usedCount || 0,
            isBlocked: false,
            lastCheckedAt: new Date(),
          };

          await db.updateVipAccount(input.id, updateData);
          return { ...account, ...updateData };
        } catch (error: any) {
          return { ...account, error: error.message };
        }
      }),

    refreshAll: publicProcedure.mutation(async () => {
      const accounts = await db.getAllVipAccounts();
      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const account of accounts) {
        try {
          const userInfo = await manusApi.getUserInfo(account.token, account.clientId);
          
          if (manusApi.isBlocked(userInfo)) {
            await db.updateVipAccount(account.id, { isBlocked: true, lastCheckedAt: new Date() });
            results.success++;
            continue;
          }

          const credits = await manusApi.getCredits(account.token, account.clientId);
          const inviteCodes = await manusApi.getInvitationCodes(account.token, account.clientId);
          const inviteCode = inviteCodes.invitationCodes?.[0];

          await db.updateVipAccount(account.id, {
            uid: userInfo.uid,
            membershipVersion: userInfo.membershipVersion,
            membershipEndTime: userInfo.currentPeriodEnd ? new Date(parseInt(userInfo.currentPeriodEnd) * 1000) : null,
            subscriptionStatus: userInfo.subscriptionStatus,
            smsVerified: userInfo.smsVerified,
            registeredAt: userInfo.registeredAt ? new Date(userInfo.registeredAt) : null,
            totalCredits: credits.totalCredits,
            freeCredits: credits.freeCredits,
            periodicCredits: credits.periodicCredits,
            refreshCredits: credits.refreshCredits,
            inviteCode: inviteCode?.inviteCode,
            inviteUsedCount: inviteCode?.usedCount || 0,
            isBlocked: false,
            lastCheckedAt: new Date(),
          });
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${account.email}: ${error.message}`);
        }
      }

      return results;
    }),

    delete: publicProcedure
      .input(z.object({ id: z.number(), reason: z.enum(['manual', 'ineligible', 'blocked']).optional(), reasonDetail: z.string().optional() }))
      .mutation(async ({ input }) => {
        const account = await db.getVipAccountById(input.id);
        if (account) {
          await db.createDeletedVipAccount({
            email: account.email,
            password: account.password,
            credits: account.totalCredits,
            sourceTable: 'vip_accounts',
            deleteReason: input.reason || 'manual',
            deleteReasonDetail: input.reasonDetail || '手动删除',
          });
        }
        await db.deleteVipAccount(input.id);
        return { success: true };
      }),

    deleteAll: publicProcedure.mutation(async () => {
      const accounts = await db.getAllVipAccounts();
      let count = 0;
      for (const account of accounts) {
        await db.createDeletedVipAccount({
          email: account.email,
          password: account.password,
          credits: account.totalCredits,
          sourceTable: 'vip_accounts',
          deleteReason: 'manual',
          deleteReasonDetail: '批量删除',
        });
        await db.deleteVipAccount(account.id);
        count++;
      }
      return { count };
    }),

    extractRandom: publicProcedure.mutation(async () => {
      const allAccounts = await db.getAllVipAccounts();
      if (!allAccounts || allAccounts.length === 0) {
        throw new Error('没有可提取的会员账号');
      }
      const randomIndex = Math.floor(Math.random() * allAccounts.length);
      const account = allAccounts[randomIndex];
      
      await db.createExtractedVipAccount({
        email: account.email,
        password: account.password,
        credits: account.totalCredits || 0,
        creditCategory: manusApi.getCreditCategory(account.totalCredits || 0),
      });
      
      await db.deleteVipAccount(account.id);
      
      return { 
        email: account.email, 
        password: account.password, 
        credits: account.totalCredits,
        inviteCode: account.inviteCode
      };
    }),

    export: publicProcedure.query(async () => {
      const accounts = await db.getAllVipAccounts();
      return accounts.map(a => `${a.email}----${a.password}----${a.token}`).join('\n');
    }),
  }),

  // ============ 被邀请账号管理 ============
  invitees: router({
    list: publicProcedure.query(async () => {
      return await db.getAllInvitees();
    }),

    eligible: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getEligibleInvitees(input.limit);
      }),

    count: publicProcedure.query(async () => {
      const eligible = await db.getEligibleInvitees();
      return { count: eligible.length };
    }),

    import: publicProcedure
      .input(z.object({ data: z.string() }))
      .mutation(async ({ input }) => {
        const lines = input.data.trim().split('\n').filter(line => line.trim());
        const results = { success: 0, failed: 0, deleted: 0, errors: [] as string[] };

        for (const line of lines) {
          const parts = line.split('----');
          if (parts.length !== 3) {
            results.failed++;
            results.errors.push(`格式错误: ${line.substring(0, 50)}...`);
            continue;
          }

          const [email, password, token] = parts.map(p => p.trim());
          
          const existing = await db.getInviteeByEmail(email);
          if (existing) {
            results.failed++;
            results.errors.push(`账号已存在: ${email}`);
            continue;
          }

          const tokenInfo = manusApi.parseToken(token);
          if (!tokenInfo) {
            results.failed++;
            results.errors.push(`Token解析失败: ${email}`);
            continue;
          }

          const clientId = manusApi.generateClientId();

          // 尝试获取账号信息验证资格
          try {
            const userInfo = await manusApi.getUserInfo(token, clientId);
            const credits = await manusApi.getCredits(token, clientId);
            const eligibility = manusApi.checkEligibility(userInfo, credits);

            if (!eligibility.eligible) {
              // 不符合条件，记录到已删除表
              await db.createDeletedNormalAccount({
                email, password,
                credits: credits.freeCredits,
                sourceTable: 'invitees',
                deleteReason: 'ineligible',
                deleteReasonDetail: eligibility.reason,
              });
              results.deleted++;
              results.errors.push(`${email}: ${eligibility.reason}`);
              continue;
            }

            await db.createInvitee({
              email, password, token, clientId,
              userId: tokenInfo.userId,
              username: tokenInfo.name,
              tokenIssuedAt: tokenInfo.issuedAt,
              tokenExpiresAt: tokenInfo.expiresAt,
              isBlocked: manusApi.isBlocked(userInfo),
              smsVerified: userInfo.smsVerified || false,
              freeCredits: credits.freeCredits,
              inviteStatus: 'pending',
              lastCheckedAt: new Date(),
            });
            results.success++;
          } catch (error: any) {
            // API调用失败，仍然导入但标记为待验证
            await db.createInvitee({
              email, password, token, clientId,
              userId: tokenInfo.userId,
              username: tokenInfo.name,
              tokenIssuedAt: tokenInfo.issuedAt,
              tokenExpiresAt: tokenInfo.expiresAt,
              inviteStatus: 'pending',
              eligibilityReason: `验证失败: ${error.message}`,
            });
            results.success++;
          }
        }

        return results;
      }),

    refresh: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const invitee = await db.getInviteeById(input.id);
        if (!invitee) throw new Error('账号不存在');

        try {
          const userInfo = await manusApi.getUserInfo(invitee.token, invitee.clientId);
          const credits = await manusApi.getCredits(invitee.token, invitee.clientId);
          const eligibility = manusApi.checkEligibility(userInfo, credits);

          // 如果积分变为1500，说明已被邀请成功，转移到库存
          if (credits.freeCredits === 1500) {
            await db.createNormalAccountStock({
              email: invitee.email,
              password: invitee.password,
              token: invitee.token,
              clientId: invitee.clientId,
              credits: credits.freeCredits,
              creditCategory: manusApi.getCreditCategory(credits.freeCredits),
            });
            await db.deleteInvitee(input.id);
            return { transferred: true, message: '账号已转移到普通账号库存' };
          }

          await db.updateInvitee(input.id, {
            isBlocked: manusApi.isBlocked(userInfo),
            smsVerified: userInfo.smsVerified || false,
            freeCredits: credits.freeCredits,
            inviteStatus: eligibility.eligible ? 'pending' : 'ineligible',
            eligibilityReason: eligibility.reason,
            lastCheckedAt: new Date(),
          });

          return { ...invitee, freeCredits: credits.freeCredits, eligibilityReason: eligibility.reason };
        } catch (error: any) {
          return { ...invitee, error: error.message };
        }
      }),

    refreshAll: publicProcedure.mutation(async () => {
      const invitees = await db.getAllInvitees();
      const results = { success: 0, failed: 0, transferred: 0, deleted: 0, errors: [] as string[] };

      for (const invitee of invitees) {
        try {
          const userInfo = await manusApi.getUserInfo(invitee.token, invitee.clientId);
          const credits = await manusApi.getCredits(invitee.token, invitee.clientId);
          const eligibility = manusApi.checkEligibility(userInfo, credits);

          // 如果积分变为1500，转移到库存
          if (credits.freeCredits === 1500) {
            await db.createNormalAccountStock({
              email: invitee.email,
              password: invitee.password,
              token: invitee.token,
              clientId: invitee.clientId,
              credits: credits.freeCredits,
              creditCategory: manusApi.getCreditCategory(credits.freeCredits),
            });
            await db.deleteInvitee(invitee.id);
            results.transferred++;
            continue;
          }

          // 不符合条件的删除
          if (!eligibility.eligible) {
            await db.createDeletedNormalAccount({
              email: invitee.email,
              password: invitee.password,
              credits: credits.freeCredits,
              sourceTable: 'invitees',
              deleteReason: 'ineligible',
              deleteReasonDetail: eligibility.reason,
            });
            await db.deleteInvitee(invitee.id);
            results.deleted++;
            continue;
          }

          await db.updateInvitee(invitee.id, {
            isBlocked: manusApi.isBlocked(userInfo),
            smsVerified: userInfo.smsVerified || false,
            freeCredits: credits.freeCredits,
            inviteStatus: 'pending',
            eligibilityReason: eligibility.reason,
            lastCheckedAt: new Date(),
          });
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${invitee.email}: ${error.message}`);
        }
      }

      return results;
    }),

    delete: publicProcedure
      .input(z.object({ id: z.number(), reason: z.enum(['manual', 'ineligible', 'blocked']).optional(), reasonDetail: z.string().optional() }))
      .mutation(async ({ input }) => {
        const invitee = await db.getInviteeById(input.id);
        if (invitee) {
          await db.createDeletedNormalAccount({
            email: invitee.email,
            password: invitee.password,
            credits: invitee.freeCredits,
            sourceTable: 'invitees',
            deleteReason: input.reason || 'manual',
            deleteReasonDetail: input.reasonDetail || '手动删除',
          });
        }
        await db.deleteInvitee(input.id);
        return { success: true };
      }),

    export: publicProcedure.query(async () => {
      const invitees = await db.getAllInvitees();
      return invitees.map(i => `${i.email}----${i.password}----${i.token}`).join('\n');
    }),
  }),

  // ============ 邀请操作 ============
  invitation: router({
    execute: publicProcedure
      .input(z.object({
        inviteeIds: z.array(z.number()),
        inviteCode: z.string(),
        inviterAccountId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const results = { success: 0, failed: 0, errors: [] as string[] };
        
        for (const inviteeId of input.inviteeIds) {
          const invitee = await db.getInviteeById(inviteeId);
          if (!invitee) {
            results.failed++;
            results.errors.push(`被邀请账号不存在: ID ${inviteeId}`);
            continue;
          }

          try {
            // 获取邀请前的积分
            const creditsBefore = await manusApi.getCredits(invitee.token, invitee.clientId);
            
            // 执行邀请
            const result = await manusApi.useInvitationCode(invitee.token, invitee.clientId, input.inviteCode);
            
            if (!result.success) {
              results.failed++;
              results.errors.push(`${invitee.email}: ${result.message}`);
              
              await db.createInvitationLog({
                inviterAccountId: input.inviterAccountId || 0,
                inviterEmail: '',
                inviteCode: input.inviteCode,
                inviteeId: invitee.id,
                inviteeEmail: invitee.email,
                status: 'failed',
                errorMessage: result.message,
                inviteeCreditsBefore: creditsBefore.freeCredits,
              });
              continue;
            }

            // 获取邀请后的积分
            const creditsAfter = await manusApi.getCredits(invitee.token, invitee.clientId);
            
            // 验证邀请是否成功
            const success = manusApi.verifyInvitationSuccess(creditsBefore.freeCredits || 0, creditsAfter.freeCredits || 0);

            await db.createInvitationLog({
              inviterAccountId: input.inviterAccountId || 0,
              inviterEmail: '',
              inviteCode: input.inviteCode,
              inviteeId: invitee.id,
              inviteeEmail: invitee.email,
              status: success ? 'success' : 'failed',
              inviteeCreditsBefore: creditsBefore.freeCredits,
              inviteeCreditsAfter: creditsAfter.freeCredits,
            });

            if (success) {
              // 邀请成功，转移到库存
              await db.createNormalAccountStock({
                email: invitee.email,
                password: invitee.password,
                token: invitee.token,
                clientId: invitee.clientId,
                credits: creditsAfter.freeCredits || 0,
                creditCategory: manusApi.getCreditCategory(creditsAfter.freeCredits || 0),
              });
              
              // 同时添加到accounts表，使其可以作为新的邀请者账号
              try {
                const inviteCodeResult = await manusApi.getInvitationCodes(invitee.token, invitee.clientId);
                const inviteCode = inviteCodeResult.invitationCodes?.[0]?.inviteCode || '';
                await db.createAccount({
                  email: invitee.email,
                  password: invitee.password,
                  token: invitee.token,
                  clientId: invitee.clientId,
                  totalCredits: creditsAfter.freeCredits || 0,
                  inviteCode: inviteCode,
                  inviteUsedCount: 0,
                  lastCheckedAt: new Date(),
                });
              } catch (e) {
                // 忽略添加到accounts表的错误（可能已存在）
              }
              
              await db.deleteInvitee(invitee.id);
              results.success++;
              
              // 如果有邀请者账号，刷新其积分信息
              if (input.inviterAccountId) {
                try {
                  const inviterAccount = await db.getAccountById(input.inviterAccountId);
                  if (inviterAccount) {
                    const inviterCredits = await manusApi.getCredits(inviterAccount.token, inviterAccount.clientId);
                    await db.updateAccount(input.inviterAccountId, {
                      totalCredits: inviterCredits.freeCredits || inviterAccount.totalCredits,
                      lastCheckedAt: new Date(),
                    });
                  }
                } catch (e) {
                  // 忽略刷新邀请者账号的错误
                }
              }
            } else {
              results.failed++;
              results.errors.push(`${invitee.email}: 邀请未生效`);
            }
          } catch (error: any) {
            results.failed++;
            results.errors.push(`${invitee.email}: ${error.message}`);
          }
        }

        return results;
      }),
  }),

  // ============ 制作积分任务 ============
  creditTasks: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCreditTasks();
    }),

    create: publicProcedure
      .input(z.object({
        mode: z.enum(['invite_only', 'normal_account', 'vip_account']),
        targetInviteCode: z.string(),
        targetAccountId: z.number().optional(),
        targetEmail: z.string().optional(),
        targetPassword: z.string().optional(),
        initialCredits: z.number(),
        targetCredits: z.number(),
      }))
      .mutation(async ({ input }) => {
        const requiredInvites = manusApi.calculateRequiredInvites(input.initialCredits, input.targetCredits);
        
        const taskId = await db.createCreditTask({
          mode: input.mode,
          targetInviteCode: input.targetInviteCode,
          targetAccountId: input.targetAccountId,
          targetAccountType: input.mode === 'vip_account' ? 'vip' : 'normal',
          targetEmail: input.targetEmail,
          targetPassword: input.targetPassword,
          initialCredits: input.initialCredits,
          targetCredits: input.targetCredits,
          currentCredits: input.initialCredits,
          requiredInvites,
          status: 'pending',
        });

        return { taskId, requiredInvites };
      }),

    execute: publicProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        const task = await db.getCreditTaskById(input.taskId);
        if (!task) throw new Error('任务不存在');

        await db.updateCreditTask(input.taskId, { status: 'running', startedAt: new Date() });

        const eligibleInvitees = await db.getEligibleInvitees(task.requiredInvites - (task.completedInvites || 0));
        
        if (eligibleInvitees.length === 0) {
          await db.updateCreditTask(input.taskId, { 
            status: 'failed', 
            errorMessage: '没有可用的被邀请账号' 
          });
          return { success: false, message: '没有可用的被邀请账号' };
        }

        let completed = task.completedInvites || 0;
        let failed = task.failedInvites || 0;
        const inviteeEmailsList: string[] = task.inviteeEmails ? task.inviteeEmails.split(',') : [];

        for (const invitee of eligibleInvitees) {
          if (completed >= task.requiredInvites) break;

          try {
            const creditsBefore = await manusApi.getCredits(invitee.token, invitee.clientId);
            const result = await manusApi.useInvitationCode(invitee.token, invitee.clientId, task.targetInviteCode);
            
            if (result.success) {
              const creditsAfter = await manusApi.getCredits(invitee.token, invitee.clientId);
              const success = manusApi.verifyInvitationSuccess(creditsBefore.freeCredits || 0, creditsAfter.freeCredits || 0);

              await db.createInvitationLog({
                inviterAccountId: task.targetAccountId || 0,
                inviterEmail: task.targetEmail || '',
                inviteCode: task.targetInviteCode,
                inviteeId: invitee.id,
                inviteeEmail: invitee.email,
                status: success ? 'success' : 'failed',
                inviteeCreditsBefore: creditsBefore.freeCredits,
                inviteeCreditsAfter: creditsAfter.freeCredits,
              });

              if (success) {
                completed++;
                inviteeEmailsList.push(invitee.email); // 记录被邀请者邮箱
                const newCredits = creditsAfter.freeCredits || 0;
                // 积分达到1500就添加到库存和accounts表（邀请成功后从1000变为1500）
                if (newCredits >= 1500) {
                  // 添加到库存表
                  await db.createNormalAccountStock({
                    email: invitee.email,
                    password: invitee.password,
                    token: invitee.token,
                    clientId: invitee.clientId,
                    credits: newCredits,
                    creditCategory: manusApi.getCreditCategory(newCredits),
                  });
                  // 同时添加到accounts表，作为新的邀请者账号
                  // 获取该账号的完整信息
                  const inviteeUserInfo = await manusApi.getUserInfo(invitee.token, invitee.clientId);
                  const inviteeCreditsInfo = await manusApi.getCredits(invitee.token, invitee.clientId);
                  const inviteeCodesInfo = await manusApi.getInvitationCodes(invitee.token, invitee.clientId);
                  const inviteeInviteCode = inviteeCodesInfo.invitationCodes?.[0]?.inviteCode || '';
                  const inviteeInviteUsedCount = inviteeCodesInfo.invitationCodes?.[0]?.usedCount || 0;
                  const tokenInfo = manusApi.parseToken(invitee.token);
                  
                  await db.createAccount({
                    email: invitee.email,
                    password: invitee.password,
                    token: invitee.token,
                    clientId: invitee.clientId,
                    userId: inviteeUserInfo.userId,
                    username: inviteeUserInfo.displayname || inviteeUserInfo.nickname || invitee.email.split('@')[0],
                    tokenIssuedAt: tokenInfo?.issuedAt,
                    tokenExpiresAt: tokenInfo?.expiresAt,
                    uid: inviteeUserInfo.uid,
                    membershipVersion: inviteeUserInfo.membershipVersion || 'free',
                    totalCredits: inviteeCreditsInfo.totalCredits,
                    freeCredits: inviteeCreditsInfo.freeCredits,
                    refreshCredits: inviteeCreditsInfo.refreshCredits,
                    inviteCode: inviteeInviteCode,
                    inviteUsedCount: inviteeInviteUsedCount,
                    isBlocked: false,
                    smsVerified: inviteeUserInfo.smsVerified || false,
                    registeredAt: inviteeUserInfo.registeredAt ? new Date(inviteeUserInfo.registeredAt) : new Date(),
                    lastCheckedAt: new Date(),
                  });
                  await db.deleteInvitee(invitee.id);
                } else {
                  // 积分未达到1500，更新被邀请账号的积分信息
                  await db.updateInvitee(invitee.id, {
                    freeCredits: newCredits,
                    lastCheckedAt: new Date(),
                  });
                }
              } else {
                failed++;
              }
            } else {
              failed++;
            }

            await db.updateCreditTask(input.taskId, { 
              completedInvites: completed, 
              failedInvites: failed,
              currentCredits: task.initialCredits + (completed * 500),
              inviteeEmails: inviteeEmailsList.join(','),
            });
          } catch (error) {
            failed++;
          }
        }

        const finalStatus = completed >= task.requiredInvites ? 'completed' : 'failed';
        await db.updateCreditTask(input.taskId, { 
          status: finalStatus,
          completedAt: finalStatus === 'completed' ? new Date() : undefined,
        });

        // 任务完成后，从 API 获取目标账号的真实积分并更新到库存和 accounts 表
        if (finalStatus === 'completed' && task.targetAccountId) {
          // 获取目标账号信息
          let targetAccount = null;
          if (task.mode === 'normal_account') {
            targetAccount = await db.getAccountById(task.targetAccountId);
          } else if (task.mode === 'vip_account') {
            targetAccount = await db.getVipAccountById(task.targetAccountId);
          }
          
          // 从 API 获取真实积分
          let finalCredits = task.initialCredits + (completed * 500); // 默认计算值
          if (targetAccount) {
            try {
              const realCredits = await manusApi.getCredits(targetAccount.token, targetAccount.clientId);
              finalCredits = realCredits.freeCredits || finalCredits;
            } catch (e) {
              // 获取失败时使用计算值
            }
          }
          const creditCategory = manusApi.getCreditCategory(finalCredits);
          
          if (task.mode === 'normal_account') {
            // 更新 accounts 表中的积分信息
            await db.updateAccount(task.targetAccountId, {
              totalCredits: finalCredits,
              freeCredits: finalCredits,
              lastCheckedAt: new Date(),
            });
            
            // 检查目标账号是否已在库存中
            const existingStock = await db.getNormalAccountStockByEmail(task.targetEmail || '');
            if (existingStock) {
              // 更新现有库存记录
              await db.updateNormalAccountStock(existingStock.id, {
                credits: finalCredits,
                creditCategory,
              });
            } else {
              // 从普通账号表获取完整信息并添加到库存
              const account = await db.getAccountById(task.targetAccountId);
              if (account) {
                await db.createNormalAccountStock({
                  email: account.email,
                  password: account.password,
                  token: account.token,
                  clientId: account.clientId,
                  credits: finalCredits,
                  creditCategory,
                });
              }
            }
            // 记录到账号制作日志
            await db.createNormalAccountLog({
              email: task.targetEmail || '',
              password: task.targetPassword || '',
              targetCredits: task.targetCredits,
              actualCredits: finalCredits,
              inviteCount: completed,
              taskId: task.id,
            });
          } else if (task.mode === 'vip_account') {
            // 更新 vipAccounts 表中的积分信息
            await db.updateVipAccount(task.targetAccountId, {
              totalCredits: finalCredits,
              freeCredits: finalCredits,
              lastCheckedAt: new Date(),
            });
            
            // 检查目标账号是否已在库存中
            const existingStock = await db.getVipAccountStockByEmail(task.targetEmail || '');
            if (existingStock) {
              // 更新现有库存记录
              await db.updateVipAccountStock(existingStock.id, {
                credits: finalCredits,
                creditCategory,
              });
            } else {
              // 从会员账号表获取完整信息并添加到库存
              const account = await db.getVipAccountById(task.targetAccountId);
              if (account) {
                await db.createVipAccountStock({
                  email: account.email,
                  password: account.password,
                  token: account.token,
                  clientId: account.clientId,
                  credits: finalCredits,
                  creditCategory,
                });
              }
            }
            // 记录到账号制作日志
            await db.createVipAccountLog({
              email: task.targetEmail || '',
              password: task.targetPassword || '',
              targetCredits: task.targetCredits,
              actualCredits: finalCredits,
              inviteCount: completed,
              taskId: task.id,
            });
          }
        }

        return { success: true, completed, failed };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCreditTask(input.id);
        return { success: true };
      }),
  }),

  // ============ 邀请记录 ============
  invitationLogs: router({
    list: publicProcedure.query(async () => {
      return await db.getAllInvitationLogs();
    }),
  }),

  // ============ 账号制作记录 ============
  accountLogs: router({
    normal: publicProcedure.query(async () => {
      return await db.getAllNormalAccountLogs();
    }),
    vip: publicProcedure.query(async () => {
      return await db.getAllVipAccountLogs();
    }),
  }),

  // ============ 账号库存 ============
  stock: router({
    normal: router({
      list: publicProcedure.query(async () => {
        return await db.getAllNormalAccountStock();
      }),
      byCategory: publicProcedure
        .input(z.object({ category: z.string() }))
        .query(async ({ input }) => {
          return await db.getNormalAccountStockByCategory(input.category);
        }),
      extractRandom: publicProcedure.mutation(async () => {
        const all = await db.getAllNormalAccountStock();
        if (all.length === 0) throw new Error('没有可提取的账号');
        
        const randomIndex = Math.floor(Math.random() * all.length);
        const account = all[randomIndex];
        
        await db.createExtractedNormalAccount({
          email: account.email,
          password: account.password,
          credits: account.credits,
          creditCategory: account.creditCategory,
        });
        await db.deleteNormalAccountStock(account.id);
        
        return account;
      }),
      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const account = await db.getNormalAccountStockById(input.id);
          if (account) {
            await db.createDeletedNormalAccount({
              email: account.email,
              password: account.password,
              credits: account.credits,
              creditCategory: account.creditCategory,
              sourceTable: 'normal_account_stock',
              deleteReason: 'manual',
              deleteReasonDetail: '手动删除',
            });
          }
          await db.deleteNormalAccountStock(input.id);
          return { success: true };
        }),
      deleteAll: publicProcedure.mutation(async () => {
        const all = await db.getAllNormalAccountStock();
        for (const account of all) {
          await db.createDeletedNormalAccount({
            email: account.email,
            password: account.password,
            credits: account.credits,
            creditCategory: account.creditCategory,
            sourceTable: 'normal_account_stock',
            deleteReason: 'manual',
            deleteReasonDetail: '批量删除',
          });
          await db.deleteNormalAccountStock(account.id);
        }
        return { count: all.length };
      }),
      export: publicProcedure.query(async () => {
        const all = await db.getAllNormalAccountStock();
        return all.map(a => `${a.email}----${a.password}`).join('\n');
      }),
    }),
    vip: router({
      list: publicProcedure.query(async () => {
        return await db.getAllVipAccountStock();
      }),
      byCategory: publicProcedure
        .input(z.object({ category: z.string() }))
        .query(async ({ input }) => {
          return await db.getVipAccountStockByCategory(input.category);
        }),
      extractRandom: publicProcedure.mutation(async () => {
        const all = await db.getAllVipAccountStock();
        if (all.length === 0) throw new Error('没有可提取的会员账号');
        
        const randomIndex = Math.floor(Math.random() * all.length);
        const account = all[randomIndex];
        
        await db.createExtractedVipAccount({
          email: account.email,
          password: account.password,
          credits: account.credits,
          creditCategory: account.creditCategory,
        });
        await db.deleteVipAccountStock(account.id);
        
        return account;
      }),
      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const account = await db.getVipAccountStockById(input.id);
          if (account) {
            await db.createDeletedVipAccount({
              email: account.email,
              password: account.password,
              credits: account.credits,
              creditCategory: account.creditCategory,
              sourceTable: 'vip_account_stock',
              deleteReason: 'manual',
              deleteReasonDetail: '手动删除',
            });
          }
          await db.deleteVipAccountStock(input.id);
          return { success: true };
        }),
      deleteAll: publicProcedure.mutation(async () => {
        const all = await db.getAllVipAccountStock();
        for (const account of all) {
          await db.createDeletedVipAccount({
            email: account.email,
            password: account.password,
            credits: account.credits,
            creditCategory: account.creditCategory,
            sourceTable: 'vip_account_stock',
            deleteReason: 'manual',
            deleteReasonDetail: '批量删除',
          });
          await db.deleteVipAccountStock(account.id);
        }
        return { count: all.length };
      }),
      export: publicProcedure.query(async () => {
        const all = await db.getAllVipAccountStock();
        return all.map(a => `${a.email}----${a.password}`).join('\n');
      }),
    }),
    extracted: router({
      normal: publicProcedure.query(async () => {
        return await db.getAllExtractedNormalAccounts();
      }),
      vip: publicProcedure.query(async () => {
        return await db.getAllExtractedVipAccounts();
      }),
    }),
    deleted: router({
      normal: publicProcedure.query(async () => {
        return await db.getAllDeletedNormalAccounts();
      }),
      vip: publicProcedure.query(async () => {
        return await db.getAllDeletedVipAccounts();
      }),
    }),
  }),

  // ============ 工具API ============
  utils: router({
    // 根据账号信息获取邀请码
    getInviteCode: publicProcedure
      .input(z.object({ accountInfo: z.string() }))
      .mutation(async ({ input }) => {
        // 解析账号信息: 邮箱----密码----token
        const parts = input.accountInfo.trim().split('----');
        if (parts.length !== 3) {
          throw new Error('格式错误，请使用: 邮箱----密码----token');
        }

        const [email, password, token] = parts.map(p => p.trim());
        
        // 解析token
        const tokenInfo = manusApi.parseToken(token);
        if (!tokenInfo) {
          throw new Error('Token解析失败');
        }

        // 生成clientId
        const clientId = manusApi.generateClientId();

        try {
          // 获取邀请码
          const inviteCodes = await manusApi.getInvitationCodes(token, clientId);
          const inviteCode = inviteCodes.invitationCodes?.[0]?.inviteCode;

          if (!inviteCode) {
            throw new Error('未找到邀请码');
          }

          return {
            success: true,
            email,
            inviteCode,
            inviteLink: `https://manus.im/invitation/${inviteCode}`,
          };
        } catch (error: any) {
          throw new Error(`获取邀请码失败: ${error.message}`);
        }
      }),
  }),

  // ============ 兑换码管理 ============
  promotionCodes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllPromotionCodes();
    }),

    stats: publicProcedure.query(async () => {
      return await db.getPromotionCodeStats();
    }),

    import: publicProcedure
      .input(z.object({ codes: z.string() }))
      .mutation(async ({ input }) => {
        const codeList = input.codes.trim().split('\n').filter(c => c.trim());
        return await db.importPromotionCodes(codeList);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePromotionCode(input.id);
      }),

    getRandom: publicProcedure.query(async () => {
      return await db.getRandomPromotionCode();
    }),
  }),
});

export type AppRouter = typeof appRouter;