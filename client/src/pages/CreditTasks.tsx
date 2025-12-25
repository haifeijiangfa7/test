import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Play, Trash2, Link, User, Crown, Hash } from "lucide-react";

export default function CreditTasks() {
  const [activeTab, setActiveTab] = useState("invite_only");
  
  // 邀请链接模式
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCount, setInviteCount] = useState("1");
  
  // 普通账号模式
  const [normalAccountId, setNormalAccountId] = useState("random");
  const [normalTargetCredits, setNormalTargetCredits] = useState("2500");
  const [normalMakeCount, setNormalMakeCount] = useState("1");
  
  // 会员账号模式
  const [vipAccountId, setVipAccountId] = useState("random");
  const [vipTargetCredits, setVipTargetCredits] = useState("2500");
  const [vipMakeCount, setVipMakeCount] = useState("1");

  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.creditTasks.list.useQuery();
  const { data: accounts } = trpc.accounts.available.useQuery();
  const { data: vipAccounts } = trpc.vipAccounts.available.useQuery();
  const { data: inviteeCount } = trpc.invitees.count.useQuery();

  const createMutation = trpc.creditTasks.create.useMutation({
    onSuccess: (result) => {
      toast.success(`任务创建成功，需要邀请 ${result.requiredInvites} 次`);
      utils.creditTasks.list.invalidate();
      utils.accounts.available.invalidate();
      utils.vipAccounts.available.invalidate();
      utils.stock.normal.list.invalidate();
      utils.stock.vip.list.invalidate();
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
      utils.creditTasks.list.invalidate();
      utils.invitees.count.invalidate();
      utils.stats.get.invalidate();
      utils.stock.normal.list.invalidate();
      utils.stock.vip.list.invalidate();
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

    createMutation.mutate({
      mode: "invite_only",
      targetInviteCode: code,
      initialCredits: 0,
      targetCredits: parseInt(inviteCount) * 500,
    });
  };

  const handleCreateNormalAccount = () => {
    const makeCount = parseInt(normalMakeCount) || 1;
    
    if (normalAccountId === "random") {
      // 随机模式：创建多个任务
      for (let i = 0; i < makeCount; i++) {
        const randomAccount = accounts?.[Math.floor(Math.random() * (accounts?.length || 0))];
        if (!randomAccount || !randomAccount.inviteCode) {
          toast.error("没有可用的普通账号或账号没有邀请码");
          return;
        }
        
        createMutation.mutate({
          mode: "normal_account",
          targetInviteCode: randomAccount.inviteCode,
          targetAccountId: randomAccount.id,
          targetEmail: randomAccount.email,
          targetPassword: randomAccount.password,
          initialCredits: randomAccount.totalCredits || 0,
          targetCredits: parseInt(normalTargetCredits),
        });
      }
    } else {
      // 指定账号模式
      const account = accounts?.find(a => a.id.toString() === normalAccountId);
      if (!account || !account.inviteCode) {
        toast.error("所选账号没有邀请码");
        return;
      }

      for (let i = 0; i < makeCount; i++) {
        createMutation.mutate({
          mode: "normal_account",
          targetInviteCode: account.inviteCode,
          targetAccountId: account.id,
          targetEmail: account.email,
          targetPassword: account.password,
          initialCredits: account.totalCredits || 0,
          targetCredits: parseInt(normalTargetCredits),
        });
      }
    }
  };

  const handleCreateVipAccount = () => {
    const makeCount = parseInt(vipMakeCount) || 1;
    
    if (vipAccountId === "random") {
      // 随机模式：创建多个任务
      for (let i = 0; i < makeCount; i++) {
        const randomAccount = vipAccounts?.[Math.floor(Math.random() * (vipAccounts?.length || 0))];
        if (!randomAccount || !randomAccount.inviteCode) {
          toast.error("没有可用的会员账号或账号没有邀请码");
          return;
        }
        
        createMutation.mutate({
          mode: "vip_account",
          targetInviteCode: randomAccount.inviteCode,
          targetAccountId: randomAccount.id,
          targetEmail: randomAccount.email,
          targetPassword: randomAccount.password,
          initialCredits: randomAccount.totalCredits || 0,
          targetCredits: parseInt(vipTargetCredits),
        });
      }
    } else {
      // 指定账号模式
      const account = vipAccounts?.find(a => a.id.toString() === vipAccountId);
      if (!account || !account.inviteCode) {
        toast.error("所选账号没有邀请码");
        return;
      }

      for (let i = 0; i < makeCount; i++) {
        createMutation.mutate({
          mode: "vip_account",
          targetInviteCode: account.inviteCode,
          targetAccountId: account.id,
          targetEmail: account.email,
          targetPassword: account.password,
          initialCredits: account.totalCredits || 0,
          targetCredits: parseInt(vipTargetCredits),
        });
      }
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
        return <Badge variant="destructive">失败</Badge>;
      case "paused":
        return <Badge variant="outline">已暂停</Badge>;
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

  // 计算需要的邀请次数
  const calculateRequiredInvites = (targetCredits: number, initialCredits: number = 0) => {
    const neededCredits = targetCredits - initialCredits;
    return Math.ceil(neededCredits / 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">制作指定积分账号</h1>
        <p className="text-gray-500 mt-1">三种模式制作账号：邀请链接模式、普通账号模式、会员账号模式</p>
      </div>

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
                <p className="text-2xl font-bold">{accounts?.length || 0}</p>
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
                <p className="text-2xl font-bold">{vipAccounts?.length || 0}</p>
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
                <p className="text-2xl font-bold">{tasks?.filter(t => t.status === 'pending').length || 0}</p>
              </div>
              <Badge className="bg-green-500">任务</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
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
                邀请成功后，被邀请账号将自动添加到普通账号库存中。
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
                选择或随机获取普通账号，通过邀请增加积分到目标值。
                制作完成后账号将自动更新到库存中。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>账号来源</Label>
                  <Select value={normalAccountId} onValueChange={setNormalAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="随机获取" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">随机获取</SelectItem>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.email} (积分: {account.totalCredits || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>目标积分</Label>
                  <Select value={normalTargetCredits} onValueChange={setNormalTargetCredits}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1500">1500 积分</SelectItem>
                      <SelectItem value="2000">2000 积分</SelectItem>
                      <SelectItem value="2500">2500 积分</SelectItem>
                      <SelectItem value="3000">3000 积分</SelectItem>
                      <SelectItem value="3500">3500 积分</SelectItem>
                      <SelectItem value="4000">4000 积分</SelectItem>
                      <SelectItem value="4500">4500 积分</SelectItem>
                      <SelectItem value="5000">5000+ 积分</SelectItem>
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
                      max={accounts?.length || 1}
                      value={normalMakeCount}
                      onChange={(e) => setNormalMakeCount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                可用普通账号: {accounts?.length || 0} 个 | 
                可用被邀请账号: {inviteeCount?.count || 0} 个 |
                需要邀请: {calculateRequiredInvites(parseInt(normalTargetCredits), 1000) * parseInt(normalMakeCount || "1")} 次
              </p>
              <Button 
                onClick={handleCreateNormalAccount}
                disabled={createMutation.isPending || (accounts?.length || 0) === 0}
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
                选择或随机获取会员账号，通过邀请增加积分到目标值。
                制作完成后账号将自动更新到库存中。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>账号来源</Label>
                  <Select value={vipAccountId} onValueChange={setVipAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="随机获取" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">随机获取</SelectItem>
                      {vipAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.email} (积分: {account.totalCredits || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>目标积分</Label>
                  <Select value={vipTargetCredits} onValueChange={setVipTargetCredits}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1500">1500 积分</SelectItem>
                      <SelectItem value="2000">2000 积分</SelectItem>
                      <SelectItem value="2500">2500 积分</SelectItem>
                      <SelectItem value="3000">3000 积分</SelectItem>
                      <SelectItem value="3500">3500 积分</SelectItem>
                      <SelectItem value="4000">4000 积分</SelectItem>
                      <SelectItem value="4500">4500 积分</SelectItem>
                      <SelectItem value="5000">5000+ 积分</SelectItem>
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
                      max={vipAccounts?.length || 1}
                      value={vipMakeCount}
                      onChange={(e) => setVipMakeCount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                可用会员账号: {vipAccounts?.length || 0} 个 | 
                可用被邀请账号: {inviteeCount?.count || 0} 个 |
                需要邀请: {calculateRequiredInvites(parseInt(vipTargetCredits), 1000) * parseInt(vipMakeCount || "1")} 次
              </p>
              <Button 
                onClick={handleCreateVipAccount}
                disabled={createMutation.isPending || (vipAccounts?.length || 0) === 0}
                className="w-full bg-amber-500 hover:bg-amber-600"
              >
                <Play className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "创建中..." : `开始制作 (${vipMakeCount}个)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
          <CardDescription>查看所有制作任务的状态和进度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模式</TableHead>
                  <TableHead>目标账号</TableHead>
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
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : tasks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      暂无任务
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks?.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{getModeLabel(task.mode)}</TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {task.targetEmail || task.targetInviteCode}
                      </TableCell>
                      <TableCell>{task.targetCredits}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(task.completedInvites || 0) / task.requiredInvites * 100} 
                            className="w-20 h-2"
                          />
                          <span className="text-sm text-gray-500">
                            {task.completedInvites || 0}/{task.requiredInvites}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(task.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {task.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => executeMutation.mutate({ taskId: task.id })}
                              disabled={executeMutation.isPending}
                              title="执行任务"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate({ id: task.id })}
                            disabled={deleteMutation.isPending}
                            title="删除"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
