import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Plus, Trash2, Search, RefreshCw } from "lucide-react";

export default function PromotionCodes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [importText, setImportText] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const { data: codes, isLoading, refetch } = trpc.promotionCodes.list.useQuery();
  const { data: stats } = trpc.promotionCodes.stats.useQuery();

  const importMutation = trpc.promotionCodes.import.useMutation({
    onSuccess: (result) => {
      toast.success(`导入成功: ${result.imported} 个, 重复跳过: ${result.duplicates} 个`);
      setImportText("");
      setIsImportDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.promotionCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("请输入兑换码");
      return;
    }
    importMutation.mutate({ codes: importText });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个兑换码吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredCodes = codes?.filter(code => 
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.usedByEmail && code.usedByEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">兑换码管理</h1>
          <p className="text-muted-foreground">管理和导入兑换码，兑换码可循环使用</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                批量导入
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>批量导入兑换码</DialogTitle>
                <DialogDescription>每行一个兑换码，系统会自动去重</DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="SV8M1A25&#10;Tenten&#10;zgm2njq&#10;..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleImport} disabled={importMutation.isPending}>
                  {importMutation.isPending ? "导入中..." : "导入"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <Badge variant="secondary" className="mt-1">总计</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">可用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.available || 0}</div>
            <Badge className="mt-1 bg-green-500">可用</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已使用过</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.used || 0}</div>
            <Badge className="mt-1 bg-purple-500">已用</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">未使用过</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{(stats?.total || 0) - (stats?.used || 0)}</div>
            <Badge className="mt-1 bg-blue-500">可用</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 兑换码列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>兑换码列表</CardTitle>
              <CardDescription>所有导入的兑换码，可循环使用</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索兑换码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无兑换码</p>
              <p className="text-sm">点击"批量导入"添加兑换码</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>兑换码</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最近使用账号</TableHead>
                  <TableHead>最近使用时间</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">{code.code}</TableCell>
                    <TableCell>
                      <Badge variant={code.status === "available" ? "default" : "secondary"}>
                        {code.status === "available" ? "可用" : code.status === "used" ? "已用" : "无效"}
                      </Badge>
                    </TableCell>
                    <TableCell>{code.usedByEmail || "-"}</TableCell>
                    <TableCell>
                      {code.usedAt ? new Date(code.usedAt).toLocaleString("zh-CN") : "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(code.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(code.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
