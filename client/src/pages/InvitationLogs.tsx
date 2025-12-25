import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle } from "lucide-react";

export default function InvitationLogs() {
  const { data: logs, isLoading } = trpc.invitationLogs.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">邀请记录</h1>
        <p className="text-gray-500 mt-1">查看所有邀请操作的详细记录</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>记录列表</CardTitle>
          <CardDescription>共 {logs?.length || 0} 条记录</CardDescription>
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
                ) : logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      暂无记录
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
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
