import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Upload, Trash2, Search, Gift, CheckCircle, XCircle, Clock,
  RefreshCw
} from "lucide-react";

export default function PromotionCodes() {
  
  const [importData, setImportData] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: codes, refetch, isLoading } = trpc.promotionCodes.list.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.promotionCodes.stats.useQuery();

  const importMutation = trpc.promotionCodes.import.useMutation({
    onSuccess: (result) => {
      toast.success(`导入完成: 成功${result.success}个, 重复${result.duplicate}个, 失败${result.failed}个`);
      setImportData("");
      refetch();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.promotionCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      refetch();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const batchDeleteMutation = trpc.batchDelete.accounts.useMutation({
    onSuccess: (result) => {
      toast.success(`批量删除成功: 已删除 ${result.count} 条记录`);
      setSelectedIds([]);
      refetch();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`批量删除失败: ${error.message}`);
    },
  });

  // 筛选和搜索
  const filteredCodes = useMemo(() => {
    if (!codes) return [];
    return codes.filter(code => {
      // 状态筛选
      if (statusFilter !== "all" && code.status !== statusFilter) return false;
      // 搜索
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return code.code.toLowerCase().includes(query) ||
               (code.usedByEmail && code.usedByEmail.toLowerCase().includes(query));
      }
      return true;
    });
  }, [codes, statusFilter, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCodes.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个兑换码吗？`)) return;
    
    // 逐个删除
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync({ id });
    }
    setSelectedIds([]);
    refetch();
    refetchStats();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500"><Clock className="w-3 h-3 mr-1" />可用</Badge>;
      case 'used':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />已使用</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />无效</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">兑换码管理</h1>
          <p className="text-muted-foreground">管理和导入兑换码</p>
        </div>
        <Button variant="outline" onClick={() => { refetch(); refetchStats(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总数</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>可用</CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats?.available || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已使用</CardDescription>
            <CardTitle className="text-3xl text-blue-500">{stats?.used || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>无效</CardDescription>
            <CardTitle className="text-3xl text-red-500">{stats?.invalid || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 导入区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            批量导入兑换码
          </CardTitle>
          <CardDescription>每行一个兑换码，系统会自动去重</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="请输入兑换码，每行一个..."
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            rows={6}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              共 {importData.trim().split('\n').filter(l => l.trim()).length} 个兑换码
            </span>
            <Button 
              onClick={() => importMutation.mutate({ data: importData })}
              disabled={!importData.trim() || importMutation.isPending}
            >
              <Gift className="w-4 h-4 mr-2" />
              {importMutation.isPending ? "导入中..." : "导入兑换码"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 兑换码列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>兑换码列表</CardTitle>
              <CardDescription>共 {filteredCodes.length} 个兑换码</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* 状态筛选 */}
              <select
                className="border rounded px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="available">可用</option>
                <option value="used">已使用</option>
                <option value="invalid">无效</option>
              </select>
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索兑换码或邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 批量操作栏 */}
          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm">已选择 {selectedIds.length} 项</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                批量删除
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无兑换码</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredCodes.length && filteredCodes.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left">兑换码</th>
                    <th className="p-3 text-left">状态</th>
                    <th className="p-3 text-left">使用者</th>
                    <th className="p-3 text-left">积分变化</th>
                    <th className="p-3 text-left">使用时间</th>
                    <th className="p-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((code) => (
                    <tr key={code.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.includes(code.id)}
                          onCheckedChange={(checked) => handleSelect(code.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-3 font-mono text-sm">{code.code}</td>
                      <td className="p-3">{getStatusBadge(code.status)}</td>
                      <td className="p-3 text-sm">{code.usedByEmail || '-'}</td>
                      <td className="p-3 text-sm">
                        {code.creditsBefore !== null && code.creditsAfter !== null ? (
                          <span className="text-green-600">
                            {code.creditsBefore} → {code.creditsAfter} (+{code.creditsAfter - code.creditsBefore})
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {code.usedAt ? new Date(code.usedAt).toLocaleString() : '-'}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('确定要删除这个兑换码吗？')) {
                              deleteMutation.mutate({ id: code.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
