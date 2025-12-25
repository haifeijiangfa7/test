import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Gift, Upload, Trash2, Search, RefreshCw } from "lucide-react";

interface PromotionCode {
  id: number;
  code: string;
  isUsed: boolean;
  usedByEmail: string | null;
  usedAt: Date | null;
  createdAt: Date;
}

export default function PromotionCodes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const utils = trpc.useUtils();

  // 查询兑换码列表
  const { data: codes, isLoading, refetch } = trpc.promotionCodes.list.useQuery();

  // 批量导入mutation - 使用import而不是importBatch
  const importMutation = trpc.promotionCodes.import.useMutation({
    onSuccess: (result) => {
      toast.success(`成功导入 ${result.success} 个兑换码${result.failed > 0 ? `，${result.failed} 个失败` : ""}`);
      setImportDialogOpen(false);
      setImportText("");
      refetch();
    },
    onError: (error) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  // 删除mutation
  const deleteMutation = trpc.promotionCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 处理批量导入
  const handleImport = () => {
    const text = importText.trim();
    if (!text) {
      toast.error("请输入兑换码");
      return;
    }
    importMutation.mutate({ codes: text });
  };

  // 过滤兑换码
  const filteredCodes = codes?.filter((code: PromotionCode) =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 统计
  const totalCodes = codes?.length || 0;
  const usedCodes = codes?.filter((c: PromotionCode) => c.isUsed).length || 0;
  const availableCodes = totalCodes - usedCodes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">兑换码管理</h1>
        <p className="text-muted-foreground">管理Manus兑换码，支持批量导入和删除</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总计兑换码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">可用兑换码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已使用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{usedCodes}</div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                兑换码列表
              </CardTitle>
              <CardDescription>管理所有兑换码</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                刷新
              </Button>
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    批量导入
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>批量导入兑换码</DialogTitle>
                    <DialogDescription>
                      每行一个兑换码，系统会自动去重
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="每行一个兑换码..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
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
        </CardHeader>
        <CardContent>
          {/* 搜索框 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索兑换码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 兑换码表格 */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredCodes && filteredCodes.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>兑换码</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>使用账号</TableHead>
                    <TableHead>使用时间</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.map((code: PromotionCode) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code}</TableCell>
                      <TableCell>
                        {code.isUsed ? (
                          <Badge variant="secondary">已使用</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500">可用</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {code.usedByEmail || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {code.usedAt ? new Date(code.usedAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(code.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除兑换码 &quot;{code.code}&quot; 吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: code.id })}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "没有找到匹配的兑换码" : "暂无兑换码，请点击\"批量导入\"添加"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
