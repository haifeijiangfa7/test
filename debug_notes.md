# 调试笔记

## 问题
执行邀请页面的"邀请者账号"下拉框只显示"手动输入邀请码"选项，没有显示普通账号列表。

## 原因分析
1. 查询使用的是 `trpc.accounts.available.useQuery()`
2. `getAvailableAccounts()` 函数过滤条件是 `isBlocked=false AND inviteCode IS NOT NULL`
3. 数据库中的普通账号可能没有 inviteCode 字段（需要刷新后才有）

## 解决方案
修改查询逻辑，使用 `accounts.list` 而不是 `accounts.available`，或者修改 `getAvailableAccounts` 的过滤条件
