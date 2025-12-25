import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Download, Copy, User, Crown, Package, History, AlertCircle, Shuffle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AccountStock() {
  const [activeTab, setActiveTab] = useState("normal-accounts");
  const [importData, setImportData] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"normal" | "vip">("normal");

  const utils = trpc.useUtils();

  // 普通账号
  const { data: accounts, isLoading: accountsLoading } = trpc.accounts.list.useQuery();
  const importAccountsMutation = trpc.accounts.import.useMutation({
    onSuccess: (result) => {
      toast.success(`导入完成: 成功${result.success}个, 失败${result.failed}个`);
      setImportDialogOpen(false);
      setImportData("");
      utils.accounts.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const refreshAccountMutation = trpc.accounts.refresh.useMutation({
    onSuccess: () => {
      toast.success("刷新成功");
      utils.accounts.list.invalidate();
    },
  });
  const refreshAllAccountsMutation = trpc.accounts.refreshAll.useMutation({
    onSuccess: (result) => {
      toast.success(`刷新完成: 成功${result.success}个, 失败${result.failed}个`);
      utils.accounts.list.invalidate();
    },
  });
  const deleteAccountMutation = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.accounts.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const extractAccountMutation = trpc.accounts.extractRandom.useMutation({
    onSuccess: (result) => {
      navigator.clipboard.writeText(`${result.email}----${result.password}`);
      toast.success(`已提取并复制: ${result.email}`);
      utils.accounts.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const { data: accountsExport } = trpc.accounts.export.useQuery();

  // 会员账号
  const { data: vipAccounts, isLoading: vipAccountsLoading } = trpc.vipAccounts.list.useQuery();
  const importVipAccountsMutation = trpc.vipAccounts.import.useMutation({
    onSuccess: (result) => {
      toast.success(`导入完成: 成功${result.success}个, 失败${result.failed}个`);
      setImportDialogOpen(false);
      setImportData("");
      utils.vipAccounts.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const refreshVipAccountMutation = trpc.vipAccounts.refresh.useMutation({
    onSuccess: () => {
      toast.success("刷新成功");
      utils.vipAccounts.list.invalidate();
    },
  });
  const refreshAllVipAccountsMutation = trpc.vipAccounts.refreshAll.useMutation({
    onSuccess: (result) => {
      toast.success(`刷新完成: 成功${result.success}个, 失败${result.failed}个`);
      utils.vipAccounts.list.invalidate();
    },
  });
  const deleteVipAccountMutation = trpc.vipAccounts.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.vipAccounts.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const extractVipAccountMutation = trpc.vipAccounts.extractRandom.useMutation({
    onSuccess: (result) => {
      navigator.clipboard.writeText(`${result.email}----${result.password}`);
      toast.success(`已提取并复制: ${result.email}`);
      utils.vipAccounts.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const { data: vipAccountsExport } = trpc.vipAccounts.export.useQuery();

  // 普通库存
  const { data: normalStock, isLoading: normalStockLoading } = trpc.stock.normal.list.useQuery();
  const extractNormalStockMutation = trpc.stock.normal.extractRandom.useMutation({
    onSuccess: (result) => {
      navigator.clipboard.writeText(`${result.email}----${result.password}`);
      toast.success(`已提取并复制: ${result.email}`);
      utils.stock.normal.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const deleteNormalStockMutation = trpc.stock.normal.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.stock.normal.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const { data: normalStockExport } = trpc.stock.normal.export.useQuery();

  // 会员库存
  const { data: vipStock, isLoading: vipStockLoading } = trpc.stock.vip.list.useQuery();
  const extractVipStockMutation = trpc.stock.vip.extractRandom.useMutation({
    onSuccess: (result) => {
      navigator.clipboard.writeText(`${result.email}----${result.password}`);
      toast.success(`已提取并复制: ${result.email}`);
      utils.stock.vip.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const deleteVipStockMutation = trpc.stock.vip.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.stock.vip.list.invalidate();
      utils.stats.get.invalidate();
    },
  });
  const { data: vipStockExport } = trpc.stock.vip.export.useQuery();

  // 已提取和已删除记录
  const { data: extractedNormal } = trpc.stock.extracted.normal.useQuery();
  const { data: extractedVip } = trpc.stock.extracted.vip.useQuery();
  const { data: deletedNormal } = trpc.stock.deleted.normal.useQuery();
  const { data: deletedVip } = trpc.stock.deleted.vip.useQuery();

  const handleImport = () => {
    if (importType === "normal") {
      importAccountsMutation.mutate({ data: importData });
    } else {
      importVipAccountsMutation.mutate({ data: importData });
    }
  };

  const handleExport = (data: string | undefined) => {
    if (data) {
      navigator.clipboard.writeText(data);
      toast.success("已复制到剪贴板");
    }
  };

  const copyAccountInfo = (email: string, password: string) => {
    navigator.clipboard.writeText(`${email}----${password}`);
    toast.success("已复制账号信息");
  };

  const getCreditCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      "1500": "bg-gray-500",
      "2000": "bg-blue-500",
      "2500": "bg-green-500",
      "3000": "bg-yellow-500",
      "3500": "bg-orange-500",
      "4000": "bg-red-500",
      "4500": "bg-purple-500",
      "5000+": "bg-pink-500",
    };
    return <Badge className={colors[category] || "bg-gray-500"}>{category}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">账号库存管理</h1>
        <p className="text-gray-500 mt-1">管理普通账号、会员账号和积分账号库存</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="normal-accounts" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            普通账号
          </TabsTrigger>
          <TabsTrigger value="vip-accounts" className="flex items-center gap-1">
            <Crown className="w-4 h-4" />
            会员账号
          </TabsTrigger>
          <TabsTrigger value="normal-stock" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            普通库存
          </TabsTrigger>
          <TabsTrigger value="vip-stock" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            会员库存
          </TabsTrigger>
          <TabsTrigger value="extracted" className="flex items-center gap-1">
            <History className="w-4 h-4" />
            已提取
          </TabsTrigger>
          <TabsTrigger value="deleted" className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            已删除
          </TabsTrigger>
        </TabsList>

        {/* 普通账号 */}
        <TabsContent value="normal-accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>普通账号</CardTitle>
                <CardDescription>共 {accounts?.length || 0} 个账号</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport(accountsExport)}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
                <Button variant="outline" onClick={() => extractAccountMutation.mutate()} disabled={extractAccountMutation.isPending}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  随机提取
                </Button>
                <Button variant="outline" onClick={() => refreshAllAccountsMutation.mutate()} disabled={refreshAllAccountsMutation.isPending}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshAllAccountsMutation.isPending ? 'animate-spin' : ''}`} />
                  一键刷新
                </Button>
                <Dialog open={importDialogOpen && importType === "normal"} onOpenChange={(open) => { setImportDialogOpen(open); setImportType("normal"); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      批量导入
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>批量导入普通账号</DialogTitle>
                      <DialogDescription>每行一个账号，格式：邮箱----密码----token</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px] w-full">
                      <Textarea
                        placeholder="example@email.com----password123----eyJhbGciOiJIUzI1NiIs..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        rows={10}
                        className="font-mono text-sm w-full break-all"
                        style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                      />
                    </ScrollArea>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setImportDialogOpen(false)}>取消</Button>
                      <Button onClick={handleImport} disabled={!importData.trim() || importAccountsMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {importAccountsMutation.isPending ? "导入中..." : "导入"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>邀请码</TableHead>
                      <TableHead>已用/总数</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>最后检查</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">加载中...</TableCell></TableRow>
                    ) : accounts?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                    ) : (
                      accounts?.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.email}</TableCell>
                          <TableCell>{account.totalCredits || "-"}</TableCell>
                          <TableCell className="font-mono text-sm">{account.inviteCode || "-"}</TableCell>
                          <TableCell>{account.inviteUsedCount || 0}/10</TableCell>
                          <TableCell>
                            {account.isBlocked ? (
                              <Badge variant="destructive">已封禁</Badge>
                            ) : (
                              <Badge className="bg-green-500">正常</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {account.lastCheckedAt ? new Date(account.lastCheckedAt).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(account.email, account.password)} title="复制">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => refreshAccountMutation.mutate({ id: account.id })} disabled={refreshAccountMutation.isPending} title="刷新">
                                <RefreshCw className={`w-4 h-4 ${refreshAccountMutation.isPending ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteAccountMutation.mutate({ id: account.id })} className="text-red-500 hover:text-red-600" title="删除">
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
        </TabsContent>

        {/* 会员账号 */}
        <TabsContent value="vip-accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>会员账号</CardTitle>
                <CardDescription>共 {vipAccounts?.length || 0} 个账号</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport(vipAccountsExport)}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
                <Button variant="outline" onClick={() => extractVipAccountMutation.mutate()} disabled={extractVipAccountMutation.isPending}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  随机提取
                </Button>
                <Button variant="outline" onClick={() => refreshAllVipAccountsMutation.mutate()} disabled={refreshAllVipAccountsMutation.isPending}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshAllVipAccountsMutation.isPending ? 'animate-spin' : ''}`} />
                  一键刷新
                </Button>
                <Dialog open={importDialogOpen && importType === "vip"} onOpenChange={(open) => { setImportDialogOpen(open); setImportType("vip"); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4 mr-2" />
                      批量导入
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>批量导入会员账号</DialogTitle>
                      <DialogDescription>每行一个账号，格式：邮箱----密码----token</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px] w-full">
                      <Textarea
                        placeholder="example@email.com----password123----eyJhbGciOiJIUzI1NiIs..."
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        rows={10}
                        className="font-mono text-sm w-full break-all"
                        style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                      />
                    </ScrollArea>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setImportDialogOpen(false)}>取消</Button>
                      <Button onClick={handleImport} disabled={!importData.trim() || importVipAccountsMutation.isPending} className="bg-amber-500 hover:bg-amber-600">
                        {importVipAccountsMutation.isPending ? "导入中..." : "导入"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>邀请码</TableHead>
                      <TableHead>已用/总数</TableHead>
                      <TableHead>会员到期</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vipAccountsLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">加载中...</TableCell></TableRow>
                    ) : vipAccounts?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                    ) : (
                      vipAccounts?.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.email}</TableCell>
                          <TableCell>{account.totalCredits || "-"}</TableCell>
                          <TableCell className="font-mono text-sm">{account.inviteCode || "-"}</TableCell>
                          <TableCell>{account.inviteUsedCount || 0}/10</TableCell>
                          <TableCell className="text-sm">
                            {account.membershipEndTime ? new Date(account.membershipEndTime).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            {account.isBlocked ? (
                              <Badge variant="destructive">已封禁</Badge>
                            ) : (
                              <Badge className="bg-amber-500">VIP</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(account.email, account.password)} title="复制">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => refreshVipAccountMutation.mutate({ id: account.id })} disabled={refreshVipAccountMutation.isPending} title="刷新">
                                <RefreshCw className={`w-4 h-4 ${refreshVipAccountMutation.isPending ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteVipAccountMutation.mutate({ id: account.id })} className="text-red-500 hover:text-red-600" title="删除">
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
        </TabsContent>

        {/* 普通库存 */}
        <TabsContent value="normal-stock">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>普通账号库存</CardTitle>
                <CardDescription>共 {normalStock?.length || 0} 个账号</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport(normalStockExport)}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
                <Button variant="outline" onClick={() => extractNormalStockMutation.mutate()} disabled={extractNormalStockMutation.isPending}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  随机提取
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>积分分类</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {normalStockLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">加载中...</TableCell></TableRow>
                    ) : normalStock?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                    ) : (
                      normalStock?.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.email}</TableCell>
                          <TableCell>{account.credits}</TableCell>
                          <TableCell>{getCreditCategoryBadge(account.creditCategory)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(account.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(account.email, account.password)} title="复制">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteNormalStockMutation.mutate({ id: account.id })} className="text-red-500 hover:text-red-600" title="删除">
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
        </TabsContent>

        {/* 会员库存 */}
        <TabsContent value="vip-stock">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>会员账号库存</CardTitle>
                <CardDescription>共 {vipStock?.length || 0} 个账号</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport(vipStockExport)}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
                <Button variant="outline" onClick={() => extractVipStockMutation.mutate()} disabled={extractVipStockMutation.isPending}>
                  <Shuffle className="w-4 h-4 mr-2" />
                  随机提取
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>积分分类</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vipStockLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">加载中...</TableCell></TableRow>
                    ) : vipStock?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                    ) : (
                      vipStock?.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.email}</TableCell>
                          <TableCell>{account.credits}</TableCell>
                          <TableCell>{getCreditCategoryBadge(account.creditCategory)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(account.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(account.email, account.password)} title="复制">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteVipStockMutation.mutate({ id: account.id })} className="text-red-500 hover:text-red-600" title="删除">
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
        </TabsContent>

        {/* 已提取记录 */}
        <TabsContent value="extracted">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>已提取普通账号</CardTitle>
                <CardDescription>共 {extractedNormal?.length || 0} 条记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>提取时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedNormal?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-4 text-gray-500">暂无记录</TableCell></TableRow>
                      ) : (
                        extractedNormal?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell>{record.credits}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.extractedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>已提取会员账号</CardTitle>
                <CardDescription>共 {extractedVip?.length || 0} 条记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>提取时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedVip?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-4 text-gray-500">暂无记录</TableCell></TableRow>
                      ) : (
                        extractedVip?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell>{record.credits}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.extractedAt).toLocaleString()}
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
        </TabsContent>

        {/* 已删除记录 */}
        <TabsContent value="deleted">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>已删除普通账号</CardTitle>
                <CardDescription>共 {deletedNormal?.length || 0} 条记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>删除原因</TableHead>
                        <TableHead>删除时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedNormal?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-4 text-gray-500">暂无记录</TableCell></TableRow>
                      ) : (
                        deletedNormal?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                              {record.deleteReasonDetail || record.deleteReason}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.deletedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>已删除会员账号</CardTitle>
                <CardDescription>共 {deletedVip?.length || 0} 条记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>删除原因</TableHead>
                        <TableHead>删除时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedVip?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-4 text-gray-500">暂无记录</TableCell></TableRow>
                      ) : (
                        deletedVip?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                              {record.deleteReasonDetail || record.deleteReason}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.deletedAt).toLocaleString()}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
