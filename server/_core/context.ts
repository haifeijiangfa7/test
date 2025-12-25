import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import * as authService from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 解析cookie
    const cookieHeader = opts.req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader);
      const sessionCookie = cookies[COOKIE_NAME];
      
      if (sessionCookie) {
        // 验证JWT token
        const authUser = authService.verifyToken(sessionCookie);
        if (authUser) {
          // 转换为User类型
          user = {
            id: authUser.id,
            openId: authUser.openId,
            name: authUser.name,
            email: authUser.email,
            loginMethod: authUser.loginMethod,
            role: authUser.role,
            createdAt: authUser.createdAt,
            updatedAt: authUser.updatedAt,
            lastSignedIn: authUser.lastSignedIn,
          };
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
