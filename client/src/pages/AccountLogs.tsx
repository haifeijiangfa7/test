import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { User, Crown } from "lucide-react";

export default function AccountLogs() {
  const [activeTab, setActiveTab] = useState("normal");

  const { data: normalLogs, isLoading: normalLoading } = trpc.accountLogs.normal.useQuery();
  const { data: vipLogs, isLoading: vipLoading } = trpc.accountLogs.vip.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">账号制作记录</h1>
        <p className="text-gray-500 mt-1">查看普通账号和会员账号的制作记录</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="normal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            普通账号记录
          </TabsTrigger>
          <TabsTrigger value="vip" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            会员账号记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="normal">
          <Card>
            <CardHeader>
              <CardTitle>普通账号制作记录</CardTitle>
              <CardDescription>共 {normalLogs?.length || 0} 条记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>目标积分</TableHead>
                      <TableHead>实际积分</TableHead>
                      <TableHead>邀请次数</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {normalLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : normalLogs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          暂无记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      normalLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.email}</TableCell>
                          <TableCell>{log.targetCredits}</TableCell>
                          <TableCell>{log.actualCredits ?? '-'}</TableCell>
                          <TableCell>{log.inviteCount}</TableCell>
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
        </TabsContent>

        <TabsContent value="vip">
          <Card>
            <CardHeader>
              <CardTitle>会员账号制作记录</CardTitle>
              <CardDescription>共 {vipLogs?.length || 0} 条记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱</TableHead>
                      <TableHead>目标积分</TableHead>
                      <TableHead>实际积分</TableHead>
                      <TableHead>邀请次数</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vipLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : vipLogs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          暂无记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      vipLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.email}</TableCell>
                          <TableCell>{log.targetCredits}</TableCell>
                          <TableCell>{log.actualCredits ?? '-'}</TableCell>
                          <TableCell>{log.inviteCount}</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
