import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Search } from "lucide-react";

export default function InvitationLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: logs, isLoading } = trpc.invitationLogs.list.useQuery();

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      // 状态筛选
      if (statusFilter === "success" && log.status !== "success") return false;
      if (statusFilter === "failed" && log.status !== "failed") return false;
      
      // 搜索筛选
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchInviter = log.inviterEmail?.toLowerCase().includes(query);
        const matchInvitee = log.inviteeEmail?.toLowerCase().includes(query);
        const matchCode = log.inviteCode?.toLowerCase().includes(query);
        if (!matchInviter && !matchInvitee && !matchCode) return false;
      }
      
      return true;
    });
  }, [logs, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">邀请记录</h1>
        <p className="text-gray-500 mt-1">查看所有邀请操作的详细记录</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>记录列表</CardTitle>
              <CardDescription>共 {filteredLogs.length} 条记录</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索邮箱或邀请码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-56"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邀请者邮箱</TableHead>
                  <TableHead>邀请码</TableHead>
                  <TableHead>被邀请者邮箱</TableHead>
                  <TableHead>邀请前积分</TableHead>
                  <TableHead>邀请后积分</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>错误信息</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      暂无记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {log.inviterEmail || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.inviteCode}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {log.inviteeEmail}
                      </TableCell>
                      <TableCell>{log.inviteeCreditsBefore ?? "-"}</TableCell>
                      <TableCell>{log.inviteeCreditsAfter ?? "-"}</TableCell>
                      <TableCell>
                        {log.status === "success" ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            成功
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            失败
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                        {log.errorMessage || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
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
