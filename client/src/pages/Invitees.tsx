import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, Download, Copy, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Invitees() {
  const [importData, setImportData] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: invitees, isLoading } = trpc.invitees.list.useQuery();

  const importMutation = trpc.invitees.import.useMutation({
    onSuccess: (result) => {
      toast.success(`导入完成: 成功${result.success}个, 失败${result.failed}个, 删除${result.deleted}个`);
      if (result.errors.length > 0) {
        console.log("导入错误:", result.errors);
      }
      setImportDialogOpen(false);
      setImportData("");
      utils.invitees.list.invalidate();
      utils.stats.get.invalidate();
    },
    onError: (error) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  const refreshMutation = trpc.invitees.refresh.useMutation({
    onSuccess: (result) => {
      if ('transferred' in result && result.transferred) {
        toast.success(result.message);
      } else if ('error' in result && result.error) {
        toast.error(`刷新失败: ${result.error}`);
      } else {
        toast.success("刷新成功");
      }
      utils.invitees.list.invalidate();
      utils.stats.get.invalidate();
    },
    onError: (error) => {
      toast.error(`刷新失败: ${error.message}`);
    },
  });

  const refreshAllMutation = trpc.invitees.refreshAll.useMutation({
    onSuccess: (result) => {
      toast.success(`刷新完成: 成功${result.success}个, 失败${result.failed}个, 转移${result.transferred}个, 删除${result.deleted}个`);
      utils.invitees.list.invalidate();
      utils.stats.get.invalidate();
    },
    onError: (error) => {
      toast.error(`刷新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.invitees.delete.useMutation({
    onSuccess: () => {
      toast.success("删除成功");
      utils.invitees.list.invalidate();
      utils.stats.get.invalidate();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const { data: exportData } = trpc.invitees.export.useQuery();

  const handleExport = () => {
    if (exportData) {
      navigator.clipboard.writeText(exportData);
      toast.success("已复制到剪贴板");
    }
  };

  const copyAccountInfo = (email: string, password: string) => {
    navigator.clipboard.writeText(`${email}----${password}`);
    toast.success("已复制账号信息");
  };

  const filteredInvitees = invitees?.filter((invitee) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return invitee.inviteStatus === "pending";
    if (statusFilter === "sms_unverified") return !invitee.smsVerified;
    if (statusFilter === "ineligible") return invitee.inviteStatus === "ineligible";
    return true;
  });

  const getStatusBadge = (invitee: typeof invitees extends (infer T)[] | undefined ? T : never) => {
    if (invitee.isBlocked) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />已封禁</Badge>;
    }
    if (!invitee.smsVerified) {
      return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />短信未验证</Badge>;
    }
    if (invitee.freeCredits !== 1000) {
      return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />积分不符</Badge>;
    }
    if (invitee.inviteStatus === "pending") {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />符合条件</Badge>;
    }
    if (invitee.inviteStatus === "invited") {
      return <Badge variant="default" className="bg-blue-500">已邀请</Badge>;
    }
    return <Badge variant="secondary">{invitee.inviteStatus}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">被邀请账号管理</h1>
          <p className="text-gray-500 mt-1">管理待邀请的账号，系统会自动验证账号资格</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!exportData}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refreshAllMutation.mutate()}
            disabled={refreshAllMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshAllMutation.isPending ? 'animate-spin' : ''}`} />
            一键刷新
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                批量导入
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>批量导入被邀请账号</DialogTitle>
                <DialogDescription>
                  每行一个账号，格式：邮箱----密码----token
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                <Textarea
                  placeholder="example@email.com----password123----eyJhbGciOiJIUzI1NiIs..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={() => importMutation.mutate({ data: importData })}
                  disabled={!importData.trim() || importMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importMutation.isPending ? "导入中..." : "导入"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>账号列表</CardTitle>
              <CardDescription>共 {filteredInvitees?.length || 0} 个账号</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">符合条件</SelectItem>
                <SelectItem value="sms_unverified">短信未验证</SelectItem>
                <SelectItem value="ineligible">不符合条件</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>免费积分</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>最后检查</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredInvitees?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitees?.map((invitee) => (
                    <TableRow key={invitee.id}>
                      <TableCell className="font-medium">{invitee.email}</TableCell>
                      <TableCell>{invitee.freeCredits ?? "-"}</TableCell>
                      <TableCell>{getStatusBadge(invitee)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                        {invitee.eligibilityReason || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {invitee.lastCheckedAt 
                          ? new Date(invitee.lastCheckedAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyAccountInfo(invitee.email, invitee.password)}
                            title="复制账号信息"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => refreshMutation.mutate({ id: invitee.id })}
                            disabled={refreshMutation.isPending}
                            title="刷新状态"
                          >
                            <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate({ id: invitee.id })}
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
