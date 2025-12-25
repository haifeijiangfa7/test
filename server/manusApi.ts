/**
 * Manus API 调用模块
 * 用于与Manus服务交互，获取用户信息、积分、邀请码等
 */

import axios from 'axios';

const MANUS_API_BASE = 'https://api.manus.im';

// 固定的x-client-dcr值（邀请操作必需）
const CLIENT_DCR = 'hbM4BVL9Ln4yhpoveJHyQV7zLFkAdZ8ne6gcLH8XLGHzOmD0LIgsemB3RbE7QmTsLHIzfJaoY5YlV5o3OcXcQb7cQlDrV3kXWXzvLJasd5XjU5Ymd51sLHQrfp2wCV1aPcfxPF7zOmDjX5IpBAMsOcXcQb7cQlLvLpayB5IvCVL9LqsrOXQRLlzleJIxC6YkC5YcLmseLqsrOXQRLo3vLqUseZY9e58oLmrlTAQsBV2WdJIxC5kkdVLvLpCqXpYagZYcgHonLmrlPWf4PGj5QcLbPcHcRV8CCXQOWZBlOFMmeJooeqUMCFL9LnI6QHkVU52tYX7zgHv8eYs4hpapeZXlOFMcB6MoCZ7lRqvlg5ongJjlRmH8PmDvLpkodZgrgFL9PWD7PK3vLqCsCAgze6M3Lms0LqgsCKUrLmraQcT4OFMrCZoqdKTlRmjcQA3vLqUseZYcgJIwfFL9PWf4PGj5QcLbPWj5QbzlgJowCAsyepYSCpCcCATlRl33RGE2';

// 生成22位随机x-client-id
export function generateClientId(length: number = 22): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 解析JWT Token
export function parseToken(token: string): {
  email: string;
  name: string;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    let payload = parts[1];
    // 添加Base64 padding
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) {
      payload += '='.repeat(padding);
    }
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    
    return {
      email: decoded.email || '',
      name: decoded.name || '',
      userId: decoded.user_id || '',
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000),
    };
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
}

// 获取通用请求头
function getHeaders(token: string, clientId: string, includeDcr: boolean = false) {
  const headers: Record<string, string> = {
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Origin': 'https://manus.im',
    'Referer': 'https://manus.im/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'authorization': `Bearer ${token}`,
    'connect-protocol-version': '1',
    'content-type': 'application/json',
    'x-client-id': clientId,
    'x-client-locale': 'zh-CN',
    'x-client-timezone': 'Asia/Shanghai',
    'x-client-timezone-offset': '-480',
    'x-client-type': 'web',
  };
  
  if (includeDcr) {
    headers['x-client-dcr'] = CLIENT_DCR;
  }
  
  return headers;
}

// 用户信息响应类型
export interface UserInfoResponse {
  userId?: string;
  email?: string;
  displayname?: string;
  nickname?: string;
  uid?: string;
  membershipVersion?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  membershipInterval?: string;
  membershipTier?: number;
  smsVerified?: boolean;
  registeredAt?: string;
  concurrentSessions?: number;
  // 错误响应
  code?: string;
  message?: string;
}

// 积分响应类型
export interface CreditsResponse {
  totalCredits?: number;
  freeCredits?: number;
  periodicCredits?: number;
  proMonthlyCredits?: number;
  refreshCredits?: number;
  maxRefreshCredits?: number;
  nextRefreshTime?: string;
  // 错误响应
  code?: string;
  message?: string;
}

// 邀请码响应类型
export interface InvitationCodesResponse {
  invitationCodes?: Array<{
    id: string;
    kind: string;
    inviteCode: string;
    maxUses: number;
    usedCount?: number;
    createdAt: string;
  }>;
  // 错误响应
  code?: string;
  message?: string;
}

// 获取用户信息
export async function getUserInfo(token: string, clientId: string): Promise<UserInfoResponse> {
  try {
    const response = await axios.post(
      `${MANUS_API_BASE}/user.v1.UserService/UserInfo`,
      {},
      { headers: getHeaders(token, clientId) }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw new Error(`获取用户信息失败: ${error.message}`);
  }
}

// 获取积分信息
export async function getCredits(token: string, clientId: string): Promise<CreditsResponse> {
  try {
    const response = await axios.post(
      `${MANUS_API_BASE}/user.v1.UserService/GetAvailableCredits`,
      {},
      { headers: getHeaders(token, clientId) }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw new Error(`获取积分信息失败: ${error.message}`);
  }
}

// 获取邀请码
export async function getInvitationCodes(token: string, clientId: string): Promise<InvitationCodesResponse> {
  try {
    const response = await axios.post(
      `${MANUS_API_BASE}/user.v1.UserService/GetPersonalInvitationCodes`,
      {},
      { headers: getHeaders(token, clientId) }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return { invitationCodes: [] };
  }
}

// 执行邀请（使用邀请码）
export async function checkInvitationCode(token: string, clientId: string, inviteCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await axios.post(
      `${MANUS_API_BASE}/user.v1.UserService/CheckInvitationCode`,
      { code: inviteCode },
      { headers: getHeaders(token, clientId, true) } // 必须包含x-client-dcr
    );
    
    // 返回{}表示请求成功，但需要验证积分变化
    if (response.data && Object.keys(response.data).length === 0) {
      return { success: true };
    }
    
    // 如果有错误信息
    if (response.data?.code) {
      return { success: false, error: response.data.message || response.data.code };
    }
    
    return { success: true };
  } catch (error: any) {
    if (error.response?.data) {
      return { success: false, error: error.response.data.message || error.response.data.code || 'Unknown error' };
    }
    return { success: false, error: error.message || 'Request failed' };
  }
}

// 使用邀请码（别名，兼容旧代码）
export async function useInvitationCode(token: string, clientId: string, inviteCode: string): Promise<{ success: boolean; message?: string }> {
  const result = await checkInvitationCode(token, clientId, inviteCode);
  return { success: result.success, message: result.error };
}

// 检查账号是否被封禁
export function isBlocked(response: UserInfoResponse | CreditsResponse | any): boolean {
  return response?.code === 'permission_denied' && 
         (response?.message?.includes('USER_IS_BLOCKED') || false);
}

// 检查账号是否符合邀请条件
export function checkEligibility(userInfo: UserInfoResponse, credits: CreditsResponse): {
  eligible: boolean;
  reason: string;
} {
  // 检查是否被封禁
  if (isBlocked(userInfo) || isBlocked(credits)) {
    return { eligible: false, reason: '账号已被封禁' };
  }
  
  // 检查短信验证
  if (!userInfo?.smsVerified) {
    return { eligible: false, reason: '短信未验证' };
  }
  
  // 检查免费积分（必须是1000才能被邀请）
  const freeCredits = credits?.freeCredits || 0;
  if (freeCredits !== 1000) {
    return { eligible: false, reason: `免费积分不符合(当前${freeCredits}，需要1000)` };
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

// 验证被邀请账号资格
export async function checkInviteeEligibility(token: string, clientId: string): Promise<{
  eligible: boolean;
  reason: string;
  userInfo?: UserInfoResponse;
  credits?: CreditsResponse;
}> {
  // 1. 检查用户信息（是否封禁、短信验证）
  const userInfo = await getUserInfo(token, clientId);
  
  if (isBlocked(userInfo)) {
    return { eligible: false, reason: '账号已被封禁', userInfo };
  }
  
  if (!userInfo.smsVerified) {
    return { eligible: false, reason: '短信未验证', userInfo };
  }
  
  // 2. 检查积分（免费积分必须为1000）
  const credits = await getCredits(token, clientId);
  
  if (isBlocked(credits)) {
    return { eligible: false, reason: '账号已被封禁', userInfo, credits };
  }
  
  if (credits.freeCredits !== 1000) {
    return { 
      eligible: false, 
      reason: `免费积分不符合条件（当前: ${credits.freeCredits}，需要: 1000）`, 
      userInfo, 
      credits 
    };
  }
  
  return { eligible: true, reason: '符合邀请条件', userInfo, credits };
}

// 执行完整邀请流程
export async function executeInvitation(
  inviteeToken: string,
  inviteeClientId: string,
  inviteCode: string
): Promise<{
  success: boolean;
  error?: string;
  creditsBefore?: number;
  creditsAfter?: number;
}> {
  // 1. 检查资格
  const eligibility = await checkInviteeEligibility(inviteeToken, inviteeClientId);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }
  
  const creditsBefore = eligibility.credits?.freeCredits || 0;
  
  // 2. 执行邀请
  const inviteResult = await checkInvitationCode(inviteeToken, inviteeClientId, inviteCode);
  if (!inviteResult.success) {
    return { success: false, error: inviteResult.error, creditsBefore };
  }
  
  // 3. 等待一小段时间后验证结果
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. 验证邀请结果（积分应该从1000变为1500）
  const creditsAfter = await getCredits(inviteeToken, inviteeClientId);
  
  if (isBlocked(creditsAfter)) {
    return { success: false, error: '邀请后账号被封禁', creditsBefore };
  }
  
  const newFreeCredits = creditsAfter.freeCredits || 0;
  
  if (newFreeCredits === 1500) {
    return { success: true, creditsBefore, creditsAfter: newFreeCredits };
  } else {
    return { 
      success: false, 
      error: `邀请未生效（积分: ${creditsBefore} → ${newFreeCredits}，期望: 1500）`,
      creditsBefore,
      creditsAfter: newFreeCredits
    };
  }
}
