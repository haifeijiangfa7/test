/**
 * 独立登录认证服务
 * 使用固定的用户名密码登录，不依赖Manus OAuth
 */

import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import { User } from '../../drizzle/schema';

// 固定的管理员账号
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Asd123456.';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'manus-account-manager-secret-key';

// Session有效期（7天）
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 秒

export interface AuthUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

/**
 * 验证用户名密码登录
 */
export function validateLogin(username: string, password: string): LoginResult {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const user: AuthUser = {
      id: 1,
      openId: 'admin-local',
      name: '管理员',
      email: 'admin@local',
      loginMethod: 'password',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const token = sign(
      { 
        userId: user.id, 
        username: ADMIN_USERNAME,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: SESSION_EXPIRY }
    );

    return { success: true, token, user };
  }

  return { success: false, error: '用户名或密码错误' };
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number; username: string; role: string };
    
    if (decoded.username === ADMIN_USERNAME) {
      return {
        id: decoded.userId,
        openId: 'admin-local',
        name: '管理员',
        email: 'admin@local',
        loginMethod: 'password',
        role: decoded.role as 'admin' | 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 生成Session Cookie值
 */
export function generateSessionCookie(user: AuthUser): string {
  return sign(
    { 
      userId: user.id, 
      username: ADMIN_USERNAME,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: SESSION_EXPIRY }
  );
}
