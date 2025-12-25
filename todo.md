# Manus账号邀请管理系统 TODO

## 数据库设计
- [x] 账号表(accounts): 邮箱、密码、token、client_id、用户信息、会员状态、积分等
- [x] 会员账号表(vip_accounts): 存储已开通会员的账号信息
- [x] 被邀请账号表(invitees): 邮箱、密码、token、邀请状态、资格验证等
- [x] 邀请记录表(invitation_logs): 邀请者、被邀请者、邀请码、状态、时间等
- [x] 制作积分任务表(credit_tasks): 任务模式、目标积分、进度等
- [x] 普通账号制作记录表(normal_account_logs)
- [x] 会员账号制作记录表(vip_account_logs)
- [x] 普通账号库存表(normal_account_stock)
- [x] 会员账号库存表(vip_account_stock)
- [x] 已提取普通账号表(extracted_normal_accounts)
- [x] 已提取会员账号表(extracted_vip_accounts)
- [x] 已删除普通账号表(deleted_normal_accounts)
- [x] 已删除会员账号表(deleted_vip_accounts)

## 后端API
- [x] 账号批量导入API
- [x] 会员账号批量导入API
- [x] 被邀请账号批量导入API
- [x] 账号信息查询API
- [x] 账号状态刷新API
- [x] 执行邀请API
- [x] 批量邀请API
- [x] 制作指定积分账号API
- [x] 账号库存管理API
- [x] 随机提取账号API
- [x] 数据导出API
- [x] 删除账号API

## 前端界面
- [x] 侧边栏导航布局(DashboardLayout)
- [x] 被邀请账号管理页面
- [x] 执行邀请页面
- [x] 制作指定积分账号页面
- [x] 邀请记录页面
- [x] 账号制作记录页面
- [x] 账号库存页面(普通账号、会员账号、已提取、已删除)

## 核心功能逻辑
- [x] Token解析: 从JWT中提取email、exp、userId等信息
- [x] x-client-id生成: 22位随机字符串(大小写字母+数字)
- [x] Manus API调用: UserInfo、GetAvailableCredits、GetPersonalInvitationCodes、CheckInvitationCode
- [x] 邀请验证逻辑: 免费积分1000→1500表示成功
- [x] 积分计算逻辑: (目标积分-当前积分)/500 = 需要邀请次数
- [x] 账号资格验证: 短信验证、积分检查
- [x] 不符合条件账号自动删除并记录原因

## 功能特性
- [x] 账号导入时自动刷新状态
- [x] 一键更新所有账号状态
- [x] 三种制作模式(邀请链接、普通账号、会员账号)
- [x] 批量制作功能和进度显示
- [x] 按积分分类存储账号(1500-5000+)
- [x] 随机提取账号功能
- [x] 复制账号信息(账号----密码格式)
- [x] 数据导出功能
- [x] 状态筛选功能
- [x] 邀请成功后账号转移到库存

## 测试
- [x] API单元测试 (12个测试用例通过)


## Bug修复
- [x] 修复执行邀请页面Select.Item空值错误
- [x] 修复批量导入对话框文本溢出问题
- [x] 执行邀请页面增加邀请次数显示
- [x] 批量导入后延迟5秒自动刷新所有账号信息
- [x] 制作积分账号页面增加制作个数设置
- [x] 修复普通账号模式和会员账号模式页面
- [x] 邀请链接模式执行后自动刷新新增账号信息
- [x] 制作的积分账号正确记录到库存中
- [x] 推送代码到GitHub仓库
- [x] 修复账号刷新API调用404错误问题
- [x] 修复执行邀请页面邀请者账号选择显示普通账号列表
- [x] 制作积分账号页面增加手动输入积分功能
