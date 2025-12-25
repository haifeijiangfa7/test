import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Download, Copy, User, Crown, History, AlertCircle, Shuffle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AccountStock() {
  const [activeTab, setActiveTab] = useState("normal-accounts");
  const [importData, setImportData] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"normal" | "vip">("normal");
  const [normalCreditFilter, setNormalCreditFilter] = useState("all");
  const [vipCreditFilter, setVipCreditFilter] = useState("all");
  const [vipExpiryFilter, setVipExpiryFilter] = useState("all");
  const [normalSearchQuery, setNormalSearchQuery] = useState("");
  const [vipSearchQuery, setVipSearchQuery] = useState("");

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

  // 已提取和已删除记录
  const { data: extractedNormal } = trpc.stock.extracted.normal.useQuery();
  const { data: extractedVip } = trpc.stock.extracted.vip.useQuery();
  const { data: deletedNormal } = trpc.stock.deleted.normal.useQuery();
  const { data: deletedVip } = trpc.stock.deleted.vip.useQuery();

  // 已提取记录删除mutations
  const deleteExtractedNormalMutation = trpc.stock.extracted.deleteNormal.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.stock.extracted.normal.invalidate();
    },
  });
  const deleteExtractedVipMutation = trpc.stock.extracted.deleteVip.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.stock.extracted.vip.invalidate();
    },
  });
  const deleteAllExtractedNormalMutation = trpc.stock.extracted.deleteAllNormal.useMutation({
    onSuccess: () => {
      toast.success("已清空所有已提取普通账号记录");
      utils.stock.extracted.normal.invalidate();
    },
  });
  const deleteAllExtractedVipMutation = trpc.stock.extracted.deleteAllVip.useMutation({
    onSuccess: () => {
      toast.success("已清空所有已提取会员账号记录");
      utils.stock.extracted.vip.invalidate();
    },
  });

  // 已删除记录删除mutations
  const deleteDeletedNormalMutation = trpc.stock.deleted.deleteNormal.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.stock.deleted.normal.invalidate();
    },
  });
  const deleteDeletedVipMutation = trpc.stock.deleted.deleteVip.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.stock.deleted.vip.invalidate();
    },
  });
  const deleteAllDeletedNormalMutation = trpc.stock.deleted.deleteAllNormal.useMutation({
    onSuccess: () => {
      toast.success("已清空所有已删除普通账号记录");
      utils.stock.deleted.normal.invalidate();
    },
  });
  const deleteAllDeletedVipMutation = trpc.stock.deleted.deleteAllVip.useMutation({
    onSuccess: () => {
      toast.success("已清空所有已删除会员账号记录");
      utils.stock.deleted.vip.invalidate();
    },
  });

  // 删除原因中文化
  const getDeleteReasonChinese = (reason: string | null | undefined): string => {
    if (!reason) return "-";
    const reasonMap: Record<string, string> = {
      'ineligible': '不符合条件',
      'blocked': '已封禁',
      'expired': '已过期',
      'manual': '手动删除',
      'no_sms': '未短信验证',
      'low_credits': '积分不足',
      'invalid_token': 'Token无效',
      'api_error': 'API错误',
      'duplicate': '重复账号',
      'unknown': '未知原因',
    };
    return reasonMap[reason.toLowerCase()] || reason;
  };

  // 页面加载时自动刷新所有账号数据
  const hasAutoRefreshed = useRef(false);
  useEffect(() => {
    if (!hasAutoRefreshed.current && accounts && accounts.length > 0) {
      hasAutoRefreshed.current = true;
      // 静默刷新所有账号，不显示toast
      refreshAllAccountsMutation.mutate(undefined, {
        onSuccess: () => {
          utils.accounts.list.invalidate();
          utils.stats.get.invalidate();
        },
        onError: () => {
          // 静默失败
        },
      });
    }
  }, [accounts]);

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

  // 计算会员到期剩余天数
  const getMembershipDaysLeft = (endTime: Date | string | null | undefined): number | null => {
    if (!endTime) return null;
    const end = new Date(endTime);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 获取会员到期分类（7654321天筛选）
  const getExpiryCategory = (endTime: Date | string | null | undefined): string => {
    const daysLeft = getMembershipDaysLeft(endTime);
    if (daysLeft === null) return "未知";
    if (daysLeft <= 0) return "已过期";
    if (daysLeft === 1) return "1天";
    if (daysLeft === 2) return "2天";
    if (daysLeft === 3) return "3天";
    if (daysLeft === 4) return "4天";
    if (daysLeft === 5) return "5天";
    if (daysLeft === 6) return "6天";
    if (daysLeft === 7) return "7天";
    return "7天以上";
  };

  // 获取会员状态标签
  const getMembershipStatusBadge = (endTime: Date | string | null | undefined) => {
    const daysLeft = getMembershipDaysLeft(endTime);
    if (daysLeft === null) return <Badge variant="outline">未知</Badge>;
    if (daysLeft <= 0) return <Badge variant="destructive">已过期</Badge>;
    if (daysLeft <= 7) return <Badge className="bg-red-500">即将到期</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-yellow-500">即将到期</Badge>;
    return <Badge className="bg-green-500">有效</Badge>;
  };

  // 根据实际积分获取分类（从1500开始，每次+500）
  const getCreditCategory = (credits: number | null | undefined): string => {
    if (!credits) return "未知";
    if (credits < 1500) return `${credits}`;
    if (credits < 2000) return "1500";
    if (credits < 2500) return "2000";
    if (credits < 3000) return "2500";
    if (credits < 3500) return "3000";
    if (credits < 4000) return "3500";
    if (credits < 4500) return "4000";
    if (credits < 5000) return "4500";
    return "5000+";
  };

  const getCreditCategoryBadge = (credits: number | null | undefined) => {
    const category = getCreditCategory(credits);
    const colors: Record<string, string> = {
      "未知": "bg-gray-400",
      "1500": "bg-gray-500",
      "2000": "bg-blue-500",
      "2500": "bg-green-500",
      "3000": "bg-yellow-500",
      "3500": "bg-orange-500",
      "4000": "bg-red-500",
      "4500": "bg-purple-500",
      "5000+": "bg-pink-500",
    };
    // 对于非标准分类（如500、1000等），使用实际积分值显示
    const displayCategory = colors[category] ? category : `${credits}`;
    return <Badge className={colors[category] || "bg-gray-400"}>{displayCategory}</Badge>;
  };

  // 获取普通账号的所有积分分类
  const normalCreditCategories = useMemo(() => {
    if (!accounts) return [];
    const categories = new Set<string>();
    accounts.forEach(account => {
      const category = getCreditCategory(account.totalCredits);
      categories.add(category);
    });
    return Array.from(categories).sort((a, b) => {
      if (a === "未知") return -1;
      if (b === "未知") return 1;
      if (a === "5000+") return 1;
      if (b === "5000+") return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [accounts]);

  // 获取会员账号的所有积分分类
  const vipCreditCategories = useMemo(() => {
    if (!vipAccounts) return [];
    const categories = new Set<string>();
    vipAccounts.forEach(account => {
      const category = getCreditCategory(account.totalCredits);
      categories.add(category);
    });
    return Array.from(categories).sort((a, b) => {
      if (a === "未知") return -1;
      if (b === "未知") return 1;
      if (a === "5000+") return 1;
      if (b === "5000+") return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [vipAccounts]);

  // 根据筛选条件过滤普通账号
  const filteredNormalAccounts = useMemo(() => {
    if (!accounts) return [];
    let filtered = accounts;
    // 按积分分类筛选
    if (normalCreditFilter !== "all") {
      filtered = filtered.filter(account => getCreditCategory(account.totalCredits) === normalCreditFilter);
    }
    // 按搜索关键词筛选
    if (normalSearchQuery.trim()) {
      const query = normalSearchQuery.toLowerCase();
      filtered = filtered.filter(account => 
        account.email.toLowerCase().includes(query) ||
        account.inviteCode?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [accounts, normalCreditFilter, normalSearchQuery]);

  // 根据筛选条件过滤会员账号
  const filteredVipAccounts = useMemo(() => {
    if (!vipAccounts) return [];
    let filtered = vipAccounts;
    // 按积分分类筛选
    if (vipCreditFilter !== "all") {
      filtered = filtered.filter(account => getCreditCategory(account.totalCredits) === vipCreditFilter);
    }
    // 按到期时间筛选
    if (vipExpiryFilter !== "all") {
      filtered = filtered.filter(account => getExpiryCategory(account.membershipEndTime) === vipExpiryFilter);
    }
    // 按搜索关键词筛选
    if (vipSearchQuery.trim()) {
      const query = vipSearchQuery.toLowerCase();
      filtered = filtered.filter(account => 
        account.email.toLowerCase().includes(query) ||
        account.inviteCode?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [vipAccounts, vipCreditFilter, vipExpiryFilter, vipSearchQuery]);

  // 获取会员账号的所有到期分类
  const vipExpiryCategories = useMemo(() => {
    if (!vipAccounts) return [];
    const categories = new Set<string>();
    vipAccounts.forEach(account => {
      const category = getExpiryCategory(account.membershipEndTime);
      categories.add(category);
    });
    const order = ["已过期", "1天", "2天", "3天", "4天", "5天", "6天", "7天", "7天以上", "未知"];
    return Array.from(categories).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [vipAccounts]);

  // 统计各到期分类的账号数量
  const vipExpiryCategoryStats = useMemo(() => {
    if (!vipAccounts) return {};
    const stats: Record<string, number> = {};
    vipAccounts.forEach(account => {
      const category = getExpiryCategory(account.membershipEndTime);
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }, [vipAccounts]);

  // 统计各分类的账号数量
  const normalCategoryStats = useMemo(() => {
    if (!accounts) return {};
    const stats: Record<string, number> = {};
    accounts.forEach(account => {
      const category = getCreditCategory(account.totalCredits);
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }, [accounts]);

  const vipCategoryStats = useMemo(() => {
    if (!vipAccounts) return {};
    const stats: Record<string, number> = {};
    vipAccounts.forEach(account => {
      const category = getCreditCategory(account.totalCredits);
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }, [vipAccounts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">账号库存管理</h1>
        <p className="text-gray-500 mt-1">管理普通账号、会员账号，按积分分类查看</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="normal-accounts" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            普通账号 ({accounts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="vip-accounts" className="flex items-center gap-1">
            <Crown className="w-4 h-4" />
            会员账号 ({vipAccounts?.length || 0})
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
                <CardTitle>普通账号库存</CardTitle>
                <CardDescription>
                  共 {accounts?.length || 0} 个账号
                  {normalCreditFilter !== "all" && ` (筛选: ${normalCreditFilter}积分 - ${filteredNormalAccounts.length}个)`}
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={normalCreditFilter} onValueChange={setNormalCreditFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="按积分筛选" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">全部积分</SelectItem>
                    {normalCreditCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}积分 ({normalCategoryStats[category] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {/* 搜索和筛选 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  {normalCreditCategories.map(category => (
                    <Badge 
                      key={category} 
                      variant={normalCreditFilter === category ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setNormalCreditFilter(normalCreditFilter === category ? "all" : category)}
                    >
                      {category}积分: {normalCategoryStats[category] || 0}
                    </Badge>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索邮箱或邀请码..."
                    value={normalSearchQuery}
                    onChange={(e) => setNormalSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>积分分类</TableHead>
                      <TableHead>邀请码</TableHead>
                      <TableHead>已用次数</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>最后检查</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountsLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">加载中...</TableCell></TableRow>
                    ) : filteredNormalAccounts.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                    ) : (
                      filteredNormalAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.email}</TableCell>
                          <TableCell>{account.totalCredits || "-"}</TableCell>
                          <TableCell>{getCreditCategoryBadge(account.totalCredits)}</TableCell>
                          <TableCell className="font-mono text-sm">{account.inviteCode || "-"}</TableCell>
                          <TableCell>{account.inviteUsedCount || 0}</TableCell>
                          <TableCell>
                            {account.isBlocked ? (
                              <Badge variant="destructive">已封禁</Badge>
                            ) : (
                              <Badge className="bg-green-500">正常</Badge>
                            )}
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
                <CardTitle>会员账号库存</CardTitle>
                <CardDescription>
                  共 {vipAccounts?.length || 0} 个账号
                  {vipCreditFilter !== "all" && ` (筛选: ${vipCreditFilter}积分 - ${filteredVipAccounts.length}个)`}
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={vipCreditFilter} onValueChange={setVipCreditFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="按积分筛选" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">全部积分</SelectItem>
                    {vipCreditCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}积分 ({vipCategoryStats[category] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={vipExpiryFilter} onValueChange={setVipExpiryFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="按到期筛选" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">全部状态</SelectItem>
                    {vipExpiryCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category} ({vipExpiryCategoryStats[category] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {/* 搜索和筛选 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  {vipCreditCategories.map(category => (
                    <Badge 
                      key={category} 
                      variant={vipCreditFilter === category ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setVipCreditFilter(vipCreditFilter === category ? "all" : category)}
                    >
                      {category}积分: {vipCategoryStats[category] || 0}
                    </Badge>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索邮箱或邀请码..."
                    value={vipSearchQuery}
                    onChange={(e) => setVipSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>积分分类</TableHead>
                      <TableHead>会员到期</TableHead>
                      <TableHead>剩余天数</TableHead>
                      <TableHead>会员状态</TableHead>
                      <TableHead>邀请码</TableHead>
                      <TableHead>账号状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vipAccountsLoading ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">加载中...</TableCell></TableRow>
                    ) : filteredVipAccounts.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                    ) : (
                      filteredVipAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.email}</TableCell>
                          <TableCell>{account.totalCredits || "-"}</TableCell>
                          <TableCell>{getCreditCategoryBadge(account.totalCredits)}</TableCell>
                          <TableCell className="text-sm">
                            {account.membershipEndTime ? new Date(account.membershipEndTime).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const daysLeft = getMembershipDaysLeft(account.membershipEndTime);
                              if (daysLeft === null) return "-";
                              if (daysLeft <= 0) return <span className="text-red-500 font-medium">已过期</span>;
                              if (daysLeft <= 7) return <span className="text-red-500 font-medium">{daysLeft}天</span>;
                              if (daysLeft <= 30) return <span className="text-yellow-600 font-medium">{daysLeft}天</span>;
                              return <span className="text-green-600 font-medium">{daysLeft}天</span>;
                            })()}
                          </TableCell>
                          <TableCell>{getMembershipStatusBadge(account.membershipEndTime)}</TableCell>
                          <TableCell className="font-mono text-sm">{account.inviteCode || "-"}</TableCell>
                          <TableCell>
                            {account.isBlocked ? (
                              <Badge variant="destructive">已封禁</Badge>
                            ) : (
                              <Badge className="bg-green-500">正常</Badge>
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

        {/* 已提取记录 */}
        <TabsContent value="extracted">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>已提取普通账号</CardTitle>
                  <CardDescription>共 {extractedNormal?.length || 0} 条记录</CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteAllExtractedNormalMutation.mutate()}
                  disabled={deleteAllExtractedNormalMutation.isPending || !extractedNormal?.length}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  一键清空
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>积分分类</TableHead>
                        <TableHead>提取时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedNormal?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                      ) : (
                        extractedNormal?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell>{record.credits}</TableCell>
                            <TableCell>{getCreditCategoryBadge(record.credits)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.extractedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(record.email, record.password)} title="复制">
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteExtractedNormalMutation.mutate({ id: record.id })} className="text-red-500 hover:text-red-600" title="删除">
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>已提取会员账号</CardTitle>
                  <CardDescription>共 {extractedVip?.length || 0} 条记录</CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteAllExtractedVipMutation.mutate()}
                  disabled={deleteAllExtractedVipMutation.isPending || !extractedVip?.length}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  一键清空
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>积分分类</TableHead>
                        <TableHead>提取时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedVip?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                      ) : (
                        extractedVip?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell>{record.credits}</TableCell>
                            <TableCell>{getCreditCategoryBadge(record.credits)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.extractedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(record.email, record.password)} title="复制">
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteExtractedVipMutation.mutate({ id: record.id })} className="text-red-500 hover:text-red-600" title="删除">
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
        </TabsContent>

        {/* 已删除记录 */}
        <TabsContent value="deleted">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>已删除普通账号</CardTitle>
                  <CardDescription>共 {deletedNormal?.length || 0} 条记录</CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteAllDeletedNormalMutation.mutate()}
                  disabled={deleteAllDeletedNormalMutation.isPending || !deletedNormal?.length}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  一键清空
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>删除原因</TableHead>
                        <TableHead>删除时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedNormal?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                      ) : (
                        deletedNormal?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell>{record.credits}</TableCell>
                            <TableCell>{getDeleteReasonChinese(record.deleteReason)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.deletedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(record.email, record.password)} title="复制">
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteDeletedNormalMutation.mutate({ id: record.id })} className="text-red-500 hover:text-red-600" title="删除">
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>已删除会员账号</CardTitle>
                  <CardDescription>共 {deletedVip?.length || 0} 条记录</CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteAllDeletedVipMutation.mutate()}
                  disabled={deleteAllDeletedVipMutation.isPending || !deletedVip?.length}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  一键清空
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>删除原因</TableHead>
                        <TableHead>删除时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedVip?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">暂无数据</TableCell></TableRow>
                      ) : (
                        deletedVip?.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.email}</TableCell>
                            <TableCell>{record.credits}</TableCell>
                            <TableCell>{getDeleteReasonChinese(record.deleteReason)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(record.deletedAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => copyAccountInfo(record.email, record.password)} title="复制">
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteDeletedVipMutation.mutate({ id: record.id })} className="text-red-500 hover:text-red-600" title="删除">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
