/**
 * Manus API 调用模块
 * 用于与Manus服务交互，获取用户信息、积分、邀请码等
 */

const MANUS_API_BASE = 'https://api.manus.im';

// 生成22位随机clientId
export function generateClientId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 22; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 解析JWT Token
export function parseToken(token: string): {
  userId: string;
  email: string;
  name: string;
  issuedAt: Date;
  expiresAt: Date;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    
    return {
      userId: payload.sub || payload.user_id || '',
      email: payload.email || '',
      name: payload.name || payload.username || '',
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : new Date(),
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : new Date(),
    };
  } catch (error) {
    console.error('Token解析失败:', error);
    return null;
  }
}

// 获取用户信息
export async function getUserInfo(token: string, clientId: string): Promise<any> {
  try {
    const response = await fetch(`${MANUS_API_BASE}/user/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取用户信息失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

// 获取积分信息
export async function getCredits(token: string, clientId: string): Promise<{
  totalCredits: number;
  freeCredits: number;
  periodicCredits: number;
  refreshCredits: number;
}> {
  try {
    const response = await fetch(`${MANUS_API_BASE}/credit/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取积分信息失败: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      totalCredits: data.totalCredits || 0,
      freeCredits: data.freeCredits || 0,
      periodicCredits: data.periodicCredits || 0,
      refreshCredits: data.refreshCredits || 0,
    };
  } catch (error) {
    console.error('获取积分信息失败:', error);
    throw error;
  }
}

// 获取邀请码
export async function getInvitationCodes(token: string, clientId: string): Promise<{
  invitationCodes: Array<{
    inviteCode: string;
    usedCount: number;
    maxUseCount: number;
  }>;
}> {
  try {
    const response = await fetch(`${MANUS_API_BASE}/invitation/codes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`获取邀请码失败: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取邀请码失败:', error);
    return { invitationCodes: [] };
  }
}

// 验证邀请码
export async function checkInvitationCode(token: string, clientId: string, inviteCode: string): Promise<{
  valid: boolean;
  message?: string;
}> {
  try {
    const response = await fetch(`${MANUS_API_BASE}/invitation/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inviteCode }),
    });
    
    if (!response.ok) {
      return { valid: false, message: `验证失败: ${response.status}` };
    }
    
    const data = await response.json();
    return { valid: data.valid || false, message: data.message };
  } catch (error) {
    console.error('验证邀请码失败:', error);
    return { valid: false, message: '验证请求失败' };
  }
}

// 使用邀请码
export async function useInvitationCode(token: string, clientId: string, inviteCode: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await fetch(`${MANUS_API_BASE}/invitation/use`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inviteCode }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || `使用邀请码失败: ${response.status}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('使用邀请码失败:', error);
    return { success: false, message: '请求失败' };
  }
}

// 检查账号是否被封禁
export function isBlocked(userInfo: any): boolean {
  return userInfo?.isBlocked === true || userInfo?.status === 'blocked';
}

// 检查账号是否符合邀请条件
export function checkEligibility(userInfo: any, credits: { freeCredits: number }): {
  eligible: boolean;
  reason: string;
} {
  // 检查是否被封禁
  if (isBlocked(userInfo)) {
    return { eligible: false, reason: '账号已被封禁' };
  }
  
  // 检查短信验证
  if (!userInfo?.smsVerified) {
    return { eligible: false, reason: '短信未验证' };
  }
  
  // 检查免费积分（必须是1000才能被邀请）
  if (credits.freeCredits !== 1000) {
    return { eligible: false, reason: `免费积分不符合(当前${credits.freeCredits}，需要1000)` };
  }
  
  return { eligible: true, reason: '符合条件' };
}

// 验证邀请是否成功（通过积分变化判断）
export function verifyInvitationSuccess(creditsBefore: number, creditsAfter: number): boolean {
  // 邀请成功后，被邀请者的免费积分从1000变为1500
  return creditsBefore === 1000 && creditsAfter === 1500;
}

// 计算需要的邀请次数
export function calculateRequiredInvites(currentCredits: number, targetCredits: number): number {
  const diff = targetCredits - currentCredits;
  if (diff <= 0) return 0;
  return Math.ceil(diff / 500);
}

// 获取积分分类
export function getCreditCategory(credits: number): string {
  if (credits >= 5000) return '5000+';
  if (credits >= 4500) return '4500';
  if (credits >= 4000) return '4000';
  if (credits >= 3500) return '3500';
  if (credits >= 3000) return '3000';
  if (credits >= 2500) return '2500';
  if (credits >= 2000) return '2000';
  return '1500';
}

// 从邀请链接中提取邀请码
export function extractInviteCodeFromUrl(url: string): string | null {
  try {
    // 支持格式: https://manus.im/invitation/XXXXX 或 直接邀请码
    const match = url.match(/invitation\/([A-Za-z0-9]+)/);
    if (match) return match[1];
    
    // 如果是纯邀请码
    if (/^[A-Za-z0-9]{10,20}$/.test(url.trim())) {
      return url.trim();
    }
    
    return null;
  } catch {
    return null;
  }
}
