import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Link, Hash, Play, Search, Key, Loader2, Gift } from "lucide-react";

export default function Invitation() {
  const [inviteCode, setInviteCode] = useState("");
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<number[]>([]);
  const [inviterAccountId, setInviterAccountId] = useState<string>("");
  const [inviteCount, setInviteCount] = useState<number>(1);
  const [quickInviteCount, setQuickInviteCount] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountInfo, setAccountInfo] = useState("");
  const [redeemAccountType, setRedeemAccountType] = useState<'normal' | 'vip'>('normal');
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemAccountId, setRedeemAccountId] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: eligibleInvitees, isLoading: inviteesLoading } = trpc.invitees.eligible.useQuery({ limit: 100 });
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: vipAccounts } = trpc.vipAccounts.list.useQuery();
  const { data: promotionCodeStats } = trpc.promotionCodes.stats.useQuery();
  const { data: inviteeCountData } = trpc.invitees.count.useQuery();
  const { data: stats } = trpc.stats.get.useQuery(undefined, {
    refetchInterval: 5000, // 每5秒自动刷新
  });

  const executeMutation = trpc.invitation.execute.useMutation({
    onSuccess: (result) => {
      toast.success(`邀请完成: 成功${result.success}个, 失败${result.failed}个`);
      if (result.errors.length > 0) {
        console.log("邀请错误:", result.errors);
      }
      setSelectedInviteeIds([]);
      // 刷新所有相关数据
      utils.invitees.eligible.invalidate();
      utils.invitees.count.invalidate();
      utils.invitees.list.invalidate();
      utils.stats.get.invalidate();
      utils.stock.normal.list.invalidate();
      utils.stock.vip.list.invalidate();
      utils.accounts.list.invalidate();
      utils.vipAccounts.list.invalidate();
      utils.creditTasks.list.invalidate();
    },
    onError: (error) => {
      toast.error(`邀请失败: ${error.message}`);
    },
  });

  // 兑换码兑换mutation
  const redeemMutation = trpc.promotionCodes.redeem.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`兑换成功！使用兑换码: ${result.promotionCode}，新积分: ${result.newCredits}`);
        // 刷新数据
        utils.accounts.list.invalidate();
        utils.vipAccounts.list.invalidate();
        utils.promotionCodes.stats.invalidate();
        utils.stats.get.invalidate();
      } else {
        toast.error(`兑换失败: ${result.message}`);
      }
    },
    onError: (error) => {
      toast.error(`兑换失败: ${error.message}`);
    },
  });

  // 获取邀请码的mutation
  const getInviteCodeMutation = trpc.utils.getInviteCode.useMutation({
    onSuccess: (result) => {
      if (result.inviteLink) {
        setInviteCode(result.inviteLink);
        toast.success(`获取邀请码成功: ${result.inviteCode}`);
      }
    },
    onError: (error) => {
      toast.error(`获取邀请码失败: ${error.message}`);
    },
  });

  // 筛选符合条件的账号
  const filteredInvitees = useMemo(() => {
    if (!eligibleInvitees) return [];
    if (!searchQuery.trim()) return eligibleInvitees;
    const query = searchQuery.toLowerCase();
    return eligibleInvitees.filter(invitee => 
      invitee.email.toLowerCase().includes(query)
    );
  }, [eligibleInvitees, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInviteeIds(filteredInvitees.map(i => i.id));
    } else {
      setSelectedInviteeIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedInviteeIds([...selectedInviteeIds, id]);
    } else {
      setSelectedInviteeIds(selectedInviteeIds.filter(i => i !== id));
    }
  };

  // 提取邀请码
  const extractInviteCode = (input: string): string => {
    const code = input.trim();
    const match = code.match(/invitation\/([A-Za-z0-9]+)/);
    return match ? match[1] : code;
  };

  // 批量邀请（选中的账号）
  const handleExecute = () => {
    if (!inviteCode.trim()) {
      toast.error("请输入邀请码或邀请链接");
      return;
    }
    if (selectedInviteeIds.length === 0) {
      toast.error("请选择要邀请的账号");
      return;
    }

    const code = extractInviteCode(inviteCode);

    executeMutation.mutate({
      inviteeIds: selectedInviteeIds,
      inviteCode: code,
      inviterAccountId: inviterAccountId && inviterAccountId !== "manual" ? parseInt(inviterAccountId) : undefined,
    });
  };

  // 快速邀请（自动选择指定数量的账号）
  const handleQuickInvite = () => {
    if (!inviteCode.trim()) {
      toast.error("请输入邀请码或邀请链接");
      return;
    }
    if (!eligibleInvitees || eligibleInvitees.length === 0) {
      toast.error("没有可用的被邀请账号");
      return;
    }
    
    const count = Math.min(quickInviteCount, eligibleInvitees.length);
    if (count <= 0) {
      toast.error("请输入有效的邀请数量");
      return;
    }

    const code = extractInviteCode(inviteCode);
    const inviteeIds = eligibleInvitees.slice(0, count).map(i => i.id);

    executeMutation.mutate({
      inviteeIds,
      inviteCode: code,
      inviterAccountId: inviterAccountId && inviterAccountId !== "manual" ? parseInt(inviterAccountId) : undefined,
    });
  };

  // 处理账号信息输入，自动获取邀请码
  const handleAccountInfoChange = (value: string) => {
    setAccountInfo(value);
    
    // 检查格式是否正确：邮箱----密码----token
    const trimmedValue = value.trim();
    if (trimmedValue && trimmedValue.includes('----')) {
      const parts = trimmedValue.split('----');
      if (parts.length === 3 && parts[2].length > 50) {
        // 格式正确，自动获取邀请码
        getInviteCodeMutation.mutate({ accountInfo: trimmedValue });
      }
    }
  };

  // 获取选中的邀请者账号信息
  const selectedAccount = accounts?.find(a => a.id.toString() === inviterAccountId);
  const isInviteCodeValid = inviteCode.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">执行邀请</h1>
        <p className="text-gray-500 mt-1">选择被邀请账号并执行邀请操作</p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待邀请账号</p>
                <p className="text-2xl font-bold">{inviteeCountData?.count || 0}</p>
              </div>
              <Badge variant="secondary">符合条件</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">普通账号库存</p>
                <p className="text-2xl font-bold">{stats?.normalStock || 0}</p>
              </div>
              <Badge className="bg-blue-500">普通</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">会员账号库存</p>
                <p className="text-2xl font-bold">{stats?.vipStock || 0}</p>
              </div>
              <Badge className="bg-amber-500">会员</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已选择</p>
                <p className="text-2xl font-bold">{selectedInviteeIds.length}</p>
              </div>
              <Badge className="bg-green-500">待邀请</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 邀请设置 */}
      <Card>
        <CardHeader>
          <CardTitle>邀请设置</CardTitle>
          <CardDescription>设置邀请码和邀请者账号</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 账号信息输入框 - 自动获取邀请码 */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-purple-900">快速获取邀请码</h3>
              {getInviteCodeMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-purple-800">输入账号信息（邮箱----密码----token）</Label>
              <Textarea
                placeholder="例如: example@outlook.com----password123----eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={accountInfo}
                onChange={(e) => handleAccountInfoChange(e.target.value)}
                className="min-h-[80px] font-mono text-sm"
                style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
              />
              <p className="text-xs text-purple-600">
                输入完整的账号信息后，系统将自动获取邀请码并填写到下方
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>邀请者账号（可选）</Label>
              <Select value={inviterAccountId} onValueChange={(value) => {
                setInviterAccountId(value);
                // 选择账号后自动填入邀请码
                if (value && value !== "manual") {
                  const account = accounts?.find(a => a.id.toString() === value);
                  if (account?.inviteCode) {
                    setInviteCode(`https://manus.im/invitation/${account.inviteCode}`);
                  }
                }
              }}>
                <SelectTrigger className="relative z-10">
                  <SelectValue placeholder="选择账号或手动输入邀请码" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-[300px] overflow-y-auto">
                  <SelectItem value="manual">手动输入邀请码</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.email} ({account.inviteCode || "无邀请码"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>邀请码或邀请链接</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="https://manus.im/invitation/XXXXX 或邀请码"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* 快速邀请区域 */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-3">快速邀请</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label className="text-blue-800">邀请数量</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    min={1}
                    max={inviteeCountData?.count || 100}
                    value={quickInviteCount}
                    onChange={(e) => setQuickInviteCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="pl-10 w-32"
                  />
                </div>
              </div>
              <Button
                onClick={handleQuickInvite}
                disabled={executeMutation.isPending || !isInviteCodeValid || !eligibleInvitees?.length}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {executeMutation.isPending ? "执行中..." : `执行邀请`}
              </Button>
              <span className="text-sm text-blue-700">
                将自动选择前 {Math.min(quickInviteCount, inviteeCountData?.count || 0)} 个账号进行邀请，预计增加 {Math.min(quickInviteCount, inviteeCountData?.count || 0) * 500} 积分
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 兑换码兑换 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            兑换码兑换
          </CardTitle>
          <CardDescription>
            使用兑换码为账号增加积分（可用兑换码: {promotionCodeStats?.available || 0} / 总计: {promotionCodeStats?.total || 0}）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>账号类型</Label>
              <Select value={redeemAccountType} onValueChange={(value: 'normal' | 'vip') => {
                setRedeemAccountType(value);
                setRedeemAccountId("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择账号类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">普通账号</SelectItem>
                  <SelectItem value="vip">会员账号</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>选择账号</Label>
              <Select value={redeemAccountId} onValueChange={setRedeemAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要兑换的账号" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {redeemAccountType === 'normal' ? (
                    accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.email} (积分: {account.freeCredits || 0})
                      </SelectItem>
                    ))
                  ) : (
                    vipAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.email} (积分: {account.freeCredits || 0})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>兑换码（可选，留空则随机选择）</Label>
              <Input
                placeholder="输入兑换码或留空"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => {
              const selectedAccount = redeemAccountType === 'normal' 
                ? accounts?.find(a => a.id.toString() === redeemAccountId)
                : vipAccounts?.find(a => a.id.toString() === redeemAccountId);
              
              if (!selectedAccount) {
                toast.error('请选择账号');
                return;
              }
              
              redeemMutation.mutate({
                token: selectedAccount.token,
                clientId: selectedAccount.clientId,
                email: selectedAccount.email,
                accountType: redeemAccountType,
                promotionCode: redeemCode || undefined,
              });
            }}
            disabled={redeemMutation.isPending || !redeemAccountId || (promotionCodeStats?.available || 0) === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Gift className="w-4 h-4 mr-2" />
            {redeemMutation.isPending ? "兑换中..." : "执行兑换"}
          </Button>
        </CardContent>
      </Card>

      {/* 符合条件的账号 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>符合条件的账号</CardTitle>
              <CardDescription>
                共 {inviteeCountData?.count || 0} 个账号符合邀请条件（未封禁、已验证短信、免费积分1000）
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 批量操作区域 */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                已选择 <span className="font-bold text-blue-600">{selectedInviteeIds.length}</span> 个账号
              </span>
              <div className="flex items-center gap-2">
                <Label className="text-sm">每账号邀请次数:</Label>
                <Input
                  type="number"
                  min={1}
                  value={inviteCount}
                  onChange={(e) => setInviteCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-8"
                />
              </div>
            </div>
            <Button
              onClick={handleExecute}
              disabled={executeMutation.isPending || selectedInviteeIds.length === 0 || !isInviteCodeValid}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {executeMutation.isPending ? "邀请中..." : `批量邀请选中账号 (${selectedInviteeIds.length}个)`}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedInviteeIds.length === filteredInvitees.length && filteredInvitees.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>免费积分</TableHead>
                  <TableHead>短信验证</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inviteesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredInvitees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {searchQuery ? "没有匹配的账号" : "暂无符合条件的账号"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitees.map((invitee) => (
                    <TableRow key={invitee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInviteeIds.includes(invitee.id)}
                          onCheckedChange={(checked) => handleSelectOne(invitee.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invitee.email}</TableCell>
                      <TableCell>{invitee.freeCredits}</TableCell>
                      <TableCell>
                        {invitee.smsVerified ? (
                          <span className="text-green-600">已验证</span>
                        ) : (
                          <span className="text-red-600">未验证</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(invitee.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
