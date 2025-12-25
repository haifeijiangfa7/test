import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Play, Trash2, Link, User, Crown, Hash, AlertTriangle, Search, Gift } from "lucide-react";

// 积分分类：从1500开始，每次+500
const CREDIT_CATEGORIES = [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

// 根据积分值获取分类
const getCreditCategory = (credits: number): number => {
  // 向下取整到最近的分类
  for (let i = CREDIT_CATEGORIES.length - 1; i >= 0; i--) {
    if (credits >= CREDIT_CATEGORIES[i]) {
      return CREDIT_CATEGORIES[i];
    }
  }
  return 0; // 小于1500的账号不在分类中
};

export default function CreditTasks() {
  const [activeTab, setActiveTab] = useState("invite_only");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  
  // 邀请链接模式
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCount, setInviteCount] = useState("1");
  
  // 普通账号模式
  const [normalSourceCategory, setNormalSourceCategory] = useState(""); // 账号来源分类
  const [normalTargetCredits, setNormalTargetCredits] = useState("2000"); // 目标积分
  const [normalMakeCount, setNormalMakeCount] = useState("1");
  
  // 会员账号模式
  const [vipSourceCategory, setVipSourceCategory] = useState(""); // 账号来源分类
  const [vipTargetCredits, setVipTargetCredits] = useState("2000"); // 目标积分
  const [vipMakeCount, setVipMakeCount] = useState("1");

  // 兑换码模式
  const [redeemAccountType, setRedeemAccountType] = useState<'normal' | 'vip'>('normal');
  const [redeemSourceCategory, setRedeemSourceCategory] = useState("");
  const [redeemCount, setRedeemCount] = useState("1");

  // 警告弹窗
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.creditTasks.list.useQuery();
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: vipAccounts } = trpc.vipAccounts.list.useQuery();
  const { data: inviteeCount } = trpc.invitees.count.useQuery();
  const { data: promotionCodeStats } = trpc.promotionCodes.stats.useQuery();

  // 兑换码批量执行mutation
  const redeemBatchMutation = trpc.promotionCodes.redeemBatch.useMutation({
    onSuccess: (result) => {
      toast.success(`兑换完成: 成功${result.success}个, 失败${result.failed}个`);
      if (result.errors.length > 0) {
        console.log("兑换错误:", result.errors);
      }
      utils.accounts.list.invalidate();
      utils.vipAccounts.list.invalidate();
      utils.promotionCodes.stats.invalidate();
      utils.stats.get.invalidate();
    },
    onError: (error) => {
      toast.error(`兑换失败: ${error.message}`);
    },
  });

  // 按积分分类统计普通账号
  const normalAccountsByCategory = useMemo(() => {
    const categories: Record<number, NonNullable<typeof accounts>> = {};
    accounts?.forEach(account => {
      const category = getCreditCategory(account.totalCredits || 0);
      if (category > 0) {
        if (!categories[category]) categories[category] = [];
        categories[category]!.push(account);
      }
    });
    return categories;
  }, [accounts]);

  // 按积分分类统计会员账号
  const vipAccountsByCategory = useMemo(() => {
    const categories: Record<number, NonNullable<typeof vipAccounts>> = {};
    vipAccounts?.forEach(account => {
      const category = getCreditCategory(account.totalCredits || 0);
      if (category > 0) {
        if (!categories[category]) categories[category] = [];
        categories[category]!.push(account);
      }
    });
    return categories;
  }, [vipAccounts]);

  // 获取可选的账号来源分类（必须小于目标积分）
  const getAvailableSourceCategories = (targetCredits: number, accountsByCategory: Record<number, any[]>) => {
    return CREDIT_CATEGORIES.filter(cat => cat < targetCredits && accountsByCategory[cat]?.length > 0);
  };

  // 计算需要的邀请次数
  const calculateRequiredInvites = (targetCredits: number, sourceCategory: number) => {
    return Math.ceil((targetCredits - sourceCategory) / 500);
  };

  const createMutation = trpc.creditTasks.create.useMutation({
    onSuccess: (result) => {
      toast.success(`任务创建成功，需要邀请 ${result.requiredInvites} 次，正在自动执行...`);
      utils.creditTasks.list.invalidate();
      utils.accounts.list.invalidate();
      utils.vipAccounts.list.invalidate();
      utils.stock.normal.list.invalidate();
      utils.stock.vip.list.invalidate();
      // 任务创建成功后自动执行
      if (result.taskId !== null && result.taskId !== undefined) {
        const taskIdToExecute = result.taskId;
        setTimeout(() => {
          executeMutation.mutate({ taskId: taskIdToExecute });
        }, 500);
      }
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const executeMutation = trpc.creditTasks.execute.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`执行完成: 成功${result.completed}次, 失败${result.failed}次`);
      } else {
        toast.error(result.message);
      }
      // 刷新所有相关数据
      utils.creditTasks.list.invalidate();
      utils.invitees.count.invalidate();
      utils.invitees.eligible.invalidate();
      utils.invitees.list.invalidate();
      utils.stats.get.invalidate();
      utils.stock.normal.list.invalidate();
      utils.stock.vip.list.invalidate();
      utils.accounts.list.invalidate();
      utils.vipAccounts.list.invalidate();
    },
    onError: (error) => {
      toast.error(`执行失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.creditTasks.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.creditTasks.list.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleCreateInviteOnly = () => {
    if (!inviteUrl.trim()) {
      toast.error("请输入邀请链接");
      return;
    }
    
    let code = inviteUrl.trim();
    const match = code.match(/invitation\/([A-Za-z0-9]+)/);
    if (match) {
      code = match[1];
    }

    const requiredInvites = parseInt(inviteCount);
    if ((inviteeCount?.count || 0) < requiredInvites) {
      setWarningMessage(`被邀请账号不足！需要 ${requiredInvites} 个，当前只有 ${inviteeCount?.count || 0} 个`);
      setShowWarning(true);
      return;
    }

    createMutation.mutate({
      mode: "invite_only",
      targetInviteCode: code,
      initialCredits: 0,
      targetCredits: requiredInvites * 500,
    });
  };

  const handleCreateNormalAccount = () => {
    const makeCount = parseInt(normalMakeCount) || 1;
    const targetCredits = parseInt(normalTargetCredits);
    const sourceCategory = parseInt(normalSourceCategory);

    if (!normalSourceCategory) {
      toast.error("请选择账号来源分类");
      return;
    }

    const availableAccounts = normalAccountsByCategory[sourceCategory] || [];
    if (availableAccounts.length === 0) {
      toast.error("所选分类没有可用账号");
      return;
    }

    if (availableAccounts.length < makeCount) {
      setWarningMessage(`所选分类账号不足！需要 ${makeCount} 个，当前只有 ${availableAccounts.length} 个`);
      setShowWarning(true);
      return;
    }

    const requiredInvitesPerAccount = calculateRequiredInvites(targetCredits, sourceCategory);
    const totalRequiredInvites = requiredInvitesPerAccount * makeCount;

    if ((inviteeCount?.count || 0) < totalRequiredInvites) {
      setWarningMessage(`被邀请账号不足！需要 ${totalRequiredInvites} 个，当前只有 ${inviteeCount?.count || 0} 个`);
      setShowWarning(true);
      return;
    }

    // 随机选择账号
    const shuffled = [...availableAccounts].sort(() => Math.random() - 0.5);
    const selectedAccounts = shuffled.slice(0, makeCount);

    for (const account of selectedAccounts) {
      if (!account.inviteCode) {
        toast.error(`账号 ${account.email} 没有邀请码，请先刷新获取`);
        continue;
      }

      createMutation.mutate({
        mode: "normal_account",
        targetInviteCode: account.inviteCode,
        targetAccountId: account.id,
        targetEmail: account.email,
        targetPassword: account.password,
        initialCredits: account.totalCredits || 0,
        targetCredits: targetCredits,
      });
    }
  };

  const handleCreateVipAccount = () => {
    const makeCount = parseInt(vipMakeCount) || 1;
    const targetCredits = parseInt(vipTargetCredits);
    const sourceCategory = parseInt(vipSourceCategory);

    if (!vipSourceCategory) {
      toast.error("请选择账号来源分类");
      return;
    }

    const availableAccounts = vipAccountsByCategory[sourceCategory] || [];
    if (availableAccounts.length === 0) {
      toast.error("所选分类没有可用账号");
      return;
    }

    if (availableAccounts.length < makeCount) {
      setWarningMessage(`所选分类账号不足！需要 ${makeCount} 个，当前只有 ${availableAccounts.length} 个`);
      setShowWarning(true);
      return;
    }

    const requiredInvitesPerAccount = calculateRequiredInvites(targetCredits, sourceCategory);
    const totalRequiredInvites = requiredInvitesPerAccount * makeCount;

    if ((inviteeCount?.count || 0) < totalRequiredInvites) {
      setWarningMessage(`被邀请账号不足！需要 ${totalRequiredInvites} 个，当前只有 ${inviteeCount?.count || 0} 个`);
      setShowWarning(true);
      return;
    }

    // 随机选择账号
    const shuffled = [...availableAccounts].sort(() => Math.random() - 0.5);
    const selectedAccounts = shuffled.slice(0, makeCount);

    for (const account of selectedAccounts) {
      if (!account.inviteCode) {
        toast.error(`账号 ${account.email} 没有邀请码，请先刷新获取`);
        continue;
      }

      createMutation.mutate({
        mode: "vip_account",
        targetInviteCode: account.inviteCode,
        targetAccountId: account.id,
        targetEmail: account.email,
        targetPassword: account.password,
        initialCredits: account.totalCredits || 0,
        targetCredits: targetCredits,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">待执行</Badge>;
      case "running":
        return <Badge className="bg-blue-500">执行中</Badge>;
      case "completed":
        return <Badge className="bg-green-500">已完成</Badge>;
      case "failed":
        return <Badge variant="destructive">邀请失败</Badge>;
      case "paused":
        return <Badge variant="outline">已暂停</Badge>;
      case "invite_failed":
        return <Badge variant="destructive">邀请失败</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "invite_only":
        return <span className="flex items-center gap-1"><Link className="w-3 h-3" /> 邀请链接</span>;
      case "normal_account":
        return <span className="flex items-center gap-1"><User className="w-3 h-3" /> 普通账号</span>;
      case "vip_account":
        return <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> 会员账号</span>;
      default:
        return mode;
    }
  };

  // 普通账号模式：可选的来源分类
  const normalAvailableCategories = getAvailableSourceCategories(
    parseInt(normalTargetCredits) || 2300,
    normalAccountsByCategory
  );

  // 会员账号模式：可选的来源分类
  const vipAvailableCategories = getAvailableSourceCategories(
    parseInt(vipTargetCredits) || 2300,
    vipAccountsByCategory
  );

  // 计算普通账号模式需要的邀请次数
  const normalRequiredInvites = normalSourceCategory
    ? calculateRequiredInvites(parseInt(normalTargetCredits), parseInt(normalSourceCategory)) * (parseInt(normalMakeCount) || 1)
    : 0;

  // 计算会员账号模式需要的邀请次数
  const vipRequiredInvites = vipSourceCategory
    ? calculateRequiredInvites(parseInt(vipTargetCredits), parseInt(vipSourceCategory)) * (parseInt(vipMakeCount) || 1)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">制作指定积分账号</h1>
        <p className="text-gray-500 mt-1">三种模式制作账号：邀请链接模式、普通账号模式、会员账号模式</p>
      </div>

      {/* 警告弹窗 */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              资源不足
            </DialogTitle>
            <DialogDescription>{warningMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">可用被邀请账号</p>
                <p className="text-2xl font-bold">{inviteeCount?.count || 0}</p>
              </div>
              <Badge variant="secondary">待使用</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">可用普通账号</p>
                <p className="text-2xl font-bold">{accounts?.filter(a => a.inviteCode).length || 0}</p>
              </div>
              <Badge className="bg-blue-500">普通</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">可用会员账号</p>
                <p className="text-2xl font-bold">{vipAccounts?.filter(a => a.inviteCode).length || 0}</p>
              </div>
              <Badge className="bg-amber-500">会员</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待执行任务</p>
                <p className="text-2xl font-bold">{tasks?.filter(t => t.status === "pending").length || 0}</p>
              </div>
              <Badge className="bg-orange-500">任务</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invite_only" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            邀请链接模式
          </TabsTrigger>
          <TabsTrigger value="normal_account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            普通账号模式
          </TabsTrigger>
          <TabsTrigger value="vip_account" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            会员账号模式
          </TabsTrigger>
          <TabsTrigger value="redeem_code" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            兑换码模式
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invite_only">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                邀请链接模式
              </CardTitle>
              <CardDescription>
                只需提供邀请链接，设置邀请次数即可执行邀请。
                邀请成功后，被邀请账号积分达到1800将自动添加到普通账号库存中。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>邀请链接</Label>
                  <Input
                    placeholder="https://manus.im/invitation/XXXXX"
                    value={inviteUrl}
                    onChange={(e) => setInviteUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>邀请次数</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      value={inviteCount}
                      onChange={(e) => setInviteCount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                当前可用被邀请账号: {inviteeCount?.count || 0} 个 | 
                预计增加积分: {parseInt(inviteCount) * 500}
                {(inviteeCount?.count || 0) < parseInt(inviteCount) && (
                  <span className="text-red-500 ml-2">（被邀请账号不足！）</span>
                )}
              </p>
              <Button 
                onClick={handleCreateInviteOnly}
                disabled={createMutation.isPending || !inviteUrl.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "创建中..." : "执行邀请"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="normal_account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                普通账号模式
              </CardTitle>
              <CardDescription>
                选择账号积分分类，系统将从该分类中随机选择账号进行邀请。
                账号来源积分必须小于目标积分。制作完成后账号将自动更新到库存中。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>目标积分</Label>
                  <Select 
                    value={normalTargetCredits} 
                    onValueChange={(val) => {
                      setNormalTargetCredits(val);
                      setNormalSourceCategory(""); // 重置来源分类
                    }}
                  >
                    <SelectTrigger className="relative z-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {CREDIT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat.toString()}>
                          {cat} 积分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>账号来源分类</Label>
                  <Select value={normalSourceCategory} onValueChange={setNormalSourceCategory}>
                    <SelectTrigger className="relative z-10">
                      <SelectValue placeholder="选择积分分类" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {normalAvailableCategories.length === 0 ? (
                        <SelectItem value="none" disabled>没有可用分类</SelectItem>
                      ) : (
                        normalAvailableCategories.map((cat) => (
                          <SelectItem key={cat} value={cat.toString()}>
                            {cat}积分账号 ({normalAccountsByCategory[cat]?.length || 0}个)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>制作个数</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      max={normalSourceCategory ? (normalAccountsByCategory[parseInt(normalSourceCategory)]?.length || 1) : 1}
                      value={normalMakeCount}
                      onChange={(e) => setNormalMakeCount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  可用分类: {normalAvailableCategories.map(cat => `${cat}积分(${normalAccountsByCategory[cat]?.length || 0}个)`).join(", ") || "无"}
                </p>
                <p>
                  可用被邀请账号: {inviteeCount?.count || 0} 个 |
                  需要邀请: {normalRequiredInvites} 次
                  {normalSourceCategory && (inviteeCount?.count || 0) < normalRequiredInvites && (
                    <span className="text-red-500 ml-2">（被邀请账号不足！）</span>
                  )}
                </p>
              </div>
              <Button 
                onClick={handleCreateNormalAccount}
                disabled={createMutation.isPending || !normalSourceCategory || normalAvailableCategories.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "创建中..." : `开始制作 (${normalMakeCount}个)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vip_account">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                会员账号模式
              </CardTitle>
              <CardDescription>
                选择账号积分分类，系统将从该分类中随机选择会员账号进行邀请。
                账号来源积分必须小于目标积分。制作完成后账号将自动更新到库存中。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>目标积分</Label>
                  <Select 
                    value={vipTargetCredits} 
                    onValueChange={(val) => {
                      setVipTargetCredits(val);
                      setVipSourceCategory(""); // 重置来源分类
                    }}
                  >
                    <SelectTrigger className="relative z-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {CREDIT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat.toString()}>
                          {cat} 积分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>账号来源分类</Label>
                  <Select value={vipSourceCategory} onValueChange={setVipSourceCategory}>
                    <SelectTrigger className="relative z-10">
                      <SelectValue placeholder="选择积分分类" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {vipAvailableCategories.length === 0 ? (
                        <SelectItem value="none" disabled>没有可用分类</SelectItem>
                      ) : (
                        vipAvailableCategories.map((cat) => (
                          <SelectItem key={cat} value={cat.toString()}>
                            {cat}积分账号 ({vipAccountsByCategory[cat]?.length || 0}个)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>制作个数</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      max={vipSourceCategory ? (vipAccountsByCategory[parseInt(vipSourceCategory)]?.length || 1) : 1}
                      value={vipMakeCount}
                      onChange={(e) => setVipMakeCount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  可用分类: {vipAvailableCategories.map(cat => `${cat}积分(${vipAccountsByCategory[cat]?.length || 0}个)`).join(", ") || "无"}
                </p>
                <p>
                  可用被邀请账号: {inviteeCount?.count || 0} 个 |
                  需要邀请: {vipRequiredInvites} 次
                  {vipSourceCategory && (inviteeCount?.count || 0) < vipRequiredInvites && (
                    <span className="text-red-500 ml-2">（被邀请账号不足！）</span>
                  )}
                </p>
              </div>
              <Button 
                onClick={handleCreateVipAccount}
                disabled={createMutation.isPending || !vipSourceCategory || vipAvailableCategories.length === 0}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "创建中..." : `开始制作 (${vipMakeCount}个)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem_code">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-500" />
                兑换码模式
              </CardTitle>
              <CardDescription>
                使用兑换码为账号增加积分。选择账号类型和积分分类，系统将随机选择兑换码执行兑换。
                可用兑换码: {promotionCodeStats?.available || 0} / 总计: {promotionCodeStats?.total || 0}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>账号类型</Label>
                  <Select 
                    value={redeemAccountType} 
                    onValueChange={(val: 'normal' | 'vip') => {
                      setRedeemAccountType(val);
                      setRedeemSourceCategory("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">普通账号</SelectItem>
                      <SelectItem value="vip">会员账号</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>账号来源分类</Label>
                  <Select value={redeemSourceCategory} onValueChange={setRedeemSourceCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择积分分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDIT_CATEGORIES.map((cat) => {
                        const categoryAccounts = redeemAccountType === 'normal' 
                          ? normalAccountsByCategory[cat] 
                          : vipAccountsByCategory[cat];
                        const count = categoryAccounts?.length || 0;
                        return (
                          <SelectItem key={cat} value={cat.toString()} disabled={count === 0}>
                            {cat}积分账号 ({count}个)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>执行个数</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      max={Math.min(
                        promotionCodeStats?.available || 1,
                        redeemSourceCategory 
                          ? (redeemAccountType === 'normal' 
                              ? normalAccountsByCategory[parseInt(redeemSourceCategory)]?.length 
                              : vipAccountsByCategory[parseInt(redeemSourceCategory)]?.length) || 1
                          : 1
                      )}
                      value={redeemCount}
                      onChange={(e) => setRedeemCount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  可用兑换码: {promotionCodeStats?.available || 0} 个（可循环利用）
                </p>
                <p>
                  {redeemAccountType === 'normal' ? '普通' : '会员'}账号分类: 
                  {CREDIT_CATEGORIES.map(cat => {
                    const count = redeemAccountType === 'normal' 
                      ? normalAccountsByCategory[cat]?.length || 0
                      : vipAccountsByCategory[cat]?.length || 0;
                    return count > 0 ? `${cat}积分(${count}个)` : null;
                  }).filter(Boolean).join(", ") || "无"}
                </p>
              </div>
              <Button 
                onClick={() => {
                  if (!redeemSourceCategory) {
                    toast.error("请选择账号来源分类");
                    return;
                  }
                  if ((promotionCodeStats?.available || 0) === 0) {
                    toast.error("没有可用的兑换码");
                    return;
                  }
                  redeemBatchMutation.mutate({
                    accountType: redeemAccountType,
                    creditCategory: redeemSourceCategory,
                    count: parseInt(redeemCount) || 1,
                  });
                }}
                disabled={redeemBatchMutation.isPending || !redeemSourceCategory || (promotionCodeStats?.available || 0) === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Gift className="w-4 h-4 mr-2" />
                {redeemBatchMutation.isPending ? "执行中..." : `执行兑换码 (${redeemCount}个)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>任务列表</CardTitle>
              <CardDescription>查看所有制作任务的状态和进度</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索邮箱或邀请码..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="pl-10 w-56"
                />
              </div>
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending">待执行</SelectItem>
                  <SelectItem value="running">执行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模式</TableHead>
                <TableHead>目标账号</TableHead>
                <TableHead>被邀请者</TableHead>
                <TableHead>目标积分</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : (() => {
                const filteredTasks = tasks?.filter((task) => {
                  // 状态筛选
                  if (taskStatusFilter !== "all" && task.status !== taskStatusFilter) return false;
                  // 搜索筛选
                  if (taskSearchQuery.trim()) {
                    const query = taskSearchQuery.toLowerCase();
                    const matchEmail = task.targetEmail?.toLowerCase().includes(query);
                    const matchCode = task.targetInviteCode?.toLowerCase().includes(query);
                    const matchInvitees = task.inviteeEmails?.toLowerCase().includes(query);
                    if (!matchEmail && !matchCode && !matchInvitees) return false;
                  }
                  return true;
                });
                return filteredTasks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      暂无任务
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks?.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{getModeLabel(task.mode)}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={task.targetEmail || task.targetInviteCode}>
                      {task.targetEmail || task.targetInviteCode}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {task.inviteeEmails ? (
                        <div className="text-xs text-gray-600">
                          {task.inviteeEmails.split(',').map((email, idx) => (
                            <div key={idx} className="truncate" title={email}>
                              {email}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{task.targetCredits}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={((task.completedInvites || 0) / task.requiredInvites) * 100} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm text-gray-500">
                          {task.completedInvites || 0}/{task.requiredInvites}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(task.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {task.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => executeMutation.mutate({ taskId: task.id })}
                            disabled={executeMutation.isPending}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate({ id: task.id })}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                );
              })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
