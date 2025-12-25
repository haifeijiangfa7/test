import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Gift, Search, Copy } from "lucide-react";

export default function PromotionCodes() {
  const [importData, setImportData] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const { data: codes, isLoading } = trpc.promotionCodes.list.useQuery();

  const importMutation = trpc.promotionCodes.import.useMutation({
    onSuccess: (result) => {
      toast.success(`导入完成: 成功${result.success}个, 重复${result.duplicates}个`);
      setImportDialogOpen(false);
      setImportData("");
      utils.promotionCodes.list.invalidate();
    },
    onError: (error) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.promotionCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.promotionCodes.list.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleImport = () => {
    if (!importData.trim()) {
      toast.error("请输入兑换码");
      return;
    }
    importMutation.mutate({ data: importData });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("已复制兑换码");
  };

  // 筛选兑换码
  const filteredCodes = codes?.filter(code => {
    if (!searchQuery.trim()) return true;
    return code.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 统计信息
  const totalCodes = codes?.length || 0;
  const usedCodes = codes?.filter(c => c.usedCount > 0).length || 0;
  const unusedCodes = totalCodes - usedCodes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">兑换码管理</h1>
          <p className="text-gray-500 mt-1">管理和导入兑换码，兑换码可循环使用</p>
        </div>
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              批量导入
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>批量导入兑换码</DialogTitle>
              <DialogDescription>
                每行一个兑换码，系统会自动去重
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="请输入兑换码，每行一个&#10;例如：&#10;ABC123&#10;DEF456&#10;GHI789"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-[300px] font-mono"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {importMutation.isPending ? "导入中..." : "导入"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总兑换码</p>
                <p className="text-2xl font-bold">{totalCodes}</p>
              </div>
              <Badge className="bg-purple-500">总计</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已使用过</p>
                <p className="text-2xl font-bold">{usedCodes}</p>
              </div>
              <Badge className="bg-green-500">已用</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未使用过</p>
                <p className="text-2xl font-bold">{unusedCodes}</p>
              </div>
              <Badge className="bg-blue-500">可用</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 兑换码列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" />
                兑换码列表
              </CardTitle>
              <CardDescription>所有兑换码可循环使用，不会被消耗</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索兑换码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>兑换码</TableHead>
                <TableHead>使用次数</TableHead>
                <TableHead>最后使用时间</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredCodes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    暂无兑换码
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes?.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(code.code)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.usedCount > 0 ? "default" : "secondary"}>
                        {code.usedCount} 次
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {code.lastUsedAt 
                        ? new Date(code.lastUsedAt).toLocaleString("zh-CN")
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(code.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate({ id: code.id })}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
