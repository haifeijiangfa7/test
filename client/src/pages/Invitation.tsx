import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Link } from "lucide-react";

export default function Invitation() {
  const [inviteCode, setInviteCode] = useState("");
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<number[]>([]);
  const [inviterAccountId, setInviterAccountId] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: eligibleInvitees, isLoading: inviteesLoading } = trpc.invitees.eligible.useQuery({ limit: 100 });
  const { data: accounts } = trpc.accounts.available.useQuery();
  const { data: inviteeCount } = trpc.invitees.count.useQuery();

  const executeMutation = trpc.invitation.execute.useMutation({
    onSuccess: (result) => {
      toast.success(`邀请完成: 成功${result.success}个, 失败${result.failed}个`);
      if (result.errors.length > 0) {
        console.log("邀请错误:", result.errors);
      }
      setSelectedInviteeIds([]);
      utils.invitees.eligible.invalidate();
      utils.invitees.count.invalidate();
      utils.stats.get.invalidate();
    },
    onError: (error) => {
      toast.error(`邀请失败: ${error.message}`);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInviteeIds(eligibleInvitees?.map(i => i.id) || []);
    } else {
      setSelectedInviteeIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedInviteeIds([...selectedInviteeIds, id]);
    } else {
      setSelectedInviteeIds(selectedInviteeIds.filter(i => i !== id));
    }
  };

  const handleExecute = () => {
    if (!inviteCode.trim()) {
      toast.error("请输入邀请码或邀请链接");
      return;
    }
    if (selectedInviteeIds.length === 0) {
      toast.error("请选择要邀请的账号");
      return;
    }

    // 从邀请链接中提取邀请码
    let code = inviteCode.trim();
    const match = code.match(/invitation\/([A-Za-z0-9]+)/);
    if (match) {
      code = match[1];
    }

    executeMutation.mutate({
      inviteeIds: selectedInviteeIds,
      inviteCode: code,
      inviterAccountId: inviterAccountId && inviterAccountId !== "manual" ? parseInt(inviterAccountId) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">执行邀请</h1>
        <p className="text-gray-500 mt-1">选择被邀请账号并执行邀请操作</p>
      </div>

      {/* 邀请设置 */}
      <Card>
        <CardHeader>
          <CardTitle>邀请设置</CardTitle>
          <CardDescription>设置邀请码和邀请者账号</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>邀请者账号（可选）</Label>
              <Select value={inviterAccountId} onValueChange={setInviterAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择账号或手动输入邀请码" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">手动输入邀请码</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.email} ({account.inviteCode || "无邀请码"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>邀请码或邀请链接</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="https://manus.im/invitation/XXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              onClick={handleExecute}
              disabled={executeMutation.isPending || selectedInviteeIds.length === 0 || !inviteCode.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              批量邀请 ({selectedInviteeIds.length})
            </Button>
            <span className="text-sm text-gray-500">
              已选择 {selectedInviteeIds.length} 个账号
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 符合条件的账号 */}
      <Card>
        <CardHeader>
          <CardTitle>符合条件的账号</CardTitle>
          <CardDescription>
            共 {inviteeCount?.count || 0} 个账号符合邀请条件（未封禁、已验证短信、免费积分1000）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedInviteeIds.length === eligibleInvitees?.length && eligibleInvitees?.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>免费积分</TableHead>
                  <TableHead>短信验证</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inviteesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : eligibleInvitees?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      暂无符合条件的账号
                    </TableCell>
                  </TableRow>
                ) : (
                  eligibleInvitees?.map((invitee) => (
                    <TableRow key={invitee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedInviteeIds.includes(invitee.id)}
                          onCheckedChange={(checked) => handleSelectOne(invitee.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{invitee.email}</TableCell>
                      <TableCell>{invitee.freeCredits}</TableCell>
                      <TableCell>
                        {invitee.smsVerified ? (
                          <span className="text-green-600">已验证</span>
                        ) : (
                          <span className="text-red-600">未验证</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(invitee.createdAt).toLocaleString()}
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
