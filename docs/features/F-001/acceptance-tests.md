# F-001: 验收测试用例 — 演示配置开关

**Status**: Drafted
**Date**: 2026-07-03

## 测试环境前提

- `infra_config` 表中已存在 `config_key = 'demo-mode'` 行，初始 `value = 'false'`
- 测试用户 `configadmin`: 持有 `system:demo-mode:query` + `system:demo-mode:update`
- 测试用户 `operator`: 持有 `system:demo-mode:query` 仅
- 测试用户 `noperm`: 两个权限均不持有

---

## 后端 API 测试

| 编号 | 用户故事 | 优先级 | 类型 | 前置条件 | 操作步骤 | 预期结果 | 自动化 |
|------|---------|--------|------|---------|---------|---------|--------|
| AT-001 | US-001 | P0 | 正常 | demo-mode=false | GET /system/demo-mode/get as configadmin | code=0, data.enabled=false | 建议 |
| AT-002 | US-001 | P0 | 正常 | demo-mode=true | GET /system/demo-mode/get as configadmin | code=0, data.enabled=true | 建议 |
| AT-003 | US-002 | P0 | 正常 | demo-mode=false | PUT with enabled=true, reason="测试开启" | code=0, DB value 变为 "true" | 建议 |
| AT-004 | US-002 | P0 | 正常 | demo-mode=false → 成功后 | 查询 system_operate_log | 存在 type="演示模式" 的记录，extra JSON 含 oldValue="false", newValue="true", reason="测试开启" | 建议 |
| AT-005 | US-002 | P1 | 幂等 | demo-mode=false | PUT with enabled=false, reason="确认关闭" | code=0, DB update_time 不变, 无新增审计记录 | 建议 |
| AT-006 | US-002 | P1 | 校验 | — | PUT body 中 enabled 字段缺失或非布尔 | HTTP 400 | 建议 |
| AT-007 | US-002 | P1 | 校验 | — | PUT body 中 reason 缺失或为空 | HTTP 400, "修改演示模式必须提供原因" | 建议 |
| AT-008 | US-002 | P1 | 边界 | — | PUT body 中 reason="ab" (2 字符) | HTTP 400, "修改原因至少4个字符" | 建议 |
| AT-009 | US-002 | P1 | 审计 | demo-mode 从 true 改 false | 检查审计日志 action 字段 | 包含"将演示模式从【开启】修改为【关闭】，原因：【...】" | 可选 |
| AT-010 | US-003 | P0 | 权限 | operator 用户 | PUT /system/demo-mode/update | HTTP 403 | 建议 |
| AT-011 | US-003 | P0 | 权限 | operator 用户 | GET /system/demo-mode/get | HTTP 200, 正常返回 | 建议 |
| AT-012 | US-001 | P1 | 权限 | operator 用户 | GET /system/demo-mode/get, 验证返回字段完整 | enabled + updatedAt + updatedBy 字段均存在 | 可选 |
| AT-013 | US-003 | P0 | 权限 | noperm 用户 | GET 或 PUT | HTTP 403 | 建议 |

---

## 前端页面测试

| 编号 | 用户故事 | 优先级 | 类型 | 前置条件 | 操作步骤 | 预期结果 | 自动化 |
|------|---------|--------|------|---------|---------|---------|--------|
| AT-014 | US-002 | P0 | 交互 | configadmin 登录 | 切换到开启 → 填原因 → 点保存 → 确认弹窗 → 点确认 | 弹窗关闭，成功 toast，页面刷新显示开启状态 | 可选 |
| AT-015 | US-002 | P1 | 交互 | configadmin 登录 | 切换 → 点保存 → 确认弹窗 → 点取消 | 弹窗关闭，页面不变，未发 API | 可选 |
| AT-016 | US-003 | P0 | 权限 | operator 登录 | 进入演示配置页 | Switch disabled，tooltip 提示不可修改；保存按钮不存在 | 可选 |
| AT-017 | US-003 | P0 | 权限 | noperm 登录 | 查看 System 侧边栏 | "演示配置"菜单项不存在 | 可选 |
| AT-018 | — | P1 | 表单 | configadmin 登录 | 切换开关但不填原因 → 点保存 | 表单校验失败，红色提示 | 可选 |
| AT-019 | — | P2 | 边界 | configadmin 登录 | 输入 200 字符原因 | 可正常提交，word-limit 显示 200/200 | 可选 |
| AT-020 | — | P2 | 边界 | configadmin 登录 | 输入 201 字符原因 | input 阻止输入（maxlength=200） | 可选 |

---

## 覆盖检查

| 类别 | 是否覆盖 | 对应用例 |
|------|---------|---------|
| 正常主流程 | ✅ | AT-001, AT-002, AT-003 |
| 参数校验 | ✅ | AT-006, AT-007, AT-008 |
| 权限不足 | ✅ | AT-010, AT-011, AT-013 |
| 幂等/重复提交 | ✅ | AT-005 |
| 边界数据 | ✅ | AT-008, AT-019, AT-020 |
| 审计记录 | ✅ | AT-004, AT-009 |
| 二次确认 | ✅ | AT-014, AT-015 |
| 角色视图差异 | ✅ | AT-016 |
| 无权限不可达 | ✅ | AT-017 |
| 空数据 | N/A | demo-mode 始终有种子数据 |
| 网络/服务异常 | ⚭ | 降级测试在集成环境中执行 |
