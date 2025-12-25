import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, UserCheck, Package, Crown, Send, Target } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.stats.get.useQuery(undefined, {
    refetchInterval: 5000, // 每5秒自动刷新
  });

  const statCards = [
    {
      title: "普通账号",
      value: stats?.accounts || 0,
      description: "邀请者账号总数",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/account-stock",
    },
    {
      title: "会员账号",
      value: stats?.vipAccounts || 0,
      description: "VIP账号总数",
      icon: Crown,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      path: "/account-stock",
    },
    {
      title: "被邀请账号",
      value: stats?.invitees || 0,
      description: "待邀请账号数",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/invitees",
    },
    {
      title: "普通库存",
      value: stats?.normalStock || 0,
      description: "普通账号库存",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/account-stock",
    },
    {
      title: "会员库存",
      value: stats?.vipStock || 0,
      description: "会员账号库存",
      icon: Package,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      path: "/account-stock",
    },
  ];

  const quickActions = [
    {
      title: "执行邀请",
      description: "选择被邀请账号并执行邀请操作",
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/invitation",
    },
    {
      title: "制作积分账号",
      description: "三种模式制作指定积分账号",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/credit-tasks",
    },
    {
      title: "管理被邀请账号",
      description: "导入、刷新、管理被邀请账号",
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/invitees",
    },
    {
      title: "账号库存",
      description: "查看和管理账号库存",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      path: "/account-stock",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manus账号邀请管理系统</h1>
        <p className="text-gray-500 mt-1">管理账号、执行邀请、跟踪积分账号的完整生命周期</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLocation(stat.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card 
              key={action.title}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => setLocation(action.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <CardTitle className="text-base">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">1. 账号导入格式</h3>
            <p>所有账号导入使用统一格式：<code className="bg-gray-100 px-2 py-1 rounded">邮箱----密码----token</code></p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">2. 邀请流程</h3>
            <p>导入被邀请账号 → 系统自动验证资格 → 执行邀请 → 成功后自动转移到库存</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">3. 制作积分账号</h3>
            <p>支持三种模式：邀请链接模式、普通账号模式、会员账号模式</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">4. 资格验证条件</h3>
            <p>被邀请账号需满足：短信已验证、免费积分为1000、账号未封禁</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
