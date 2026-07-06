# F-001: 功能规格说明书 — 演示配置开关

**Status**: Drafted
**Version**: 0.1
**Date**: 2026-07-03

## 用户故事

### US-001: 查看演示模式状态
> 作为 **ConfigAdmin 或 Operator**，我希望在管理后台看到当前演示模式是开启还是关闭，以便了解系统当前运行模式。

**验收用例**: AT-001, AT-002, AT-012

### US-002: 切换演示模式开关
> 作为 **ConfigAdmin**，我希望切换演示模式开关并填写原因，以便在需要时快速切换模式，并留下可追溯的审计记录。

**验收用例**: AT-003, AT-004, AT-005, AT-006, AT-007, AT-008, AT-009

### US-003: 权限保护
> 作为 **系统管理员**，我希望只有 ConfigAdmin 能修改开关，Operator 仅可查看，无权限用户完全不感知此功能，以确保配置变更的安全性。

**验收用例**: AT-010, AT-011, AT-013, AT-014

## 业务规则

### BR-001: 开关值约束
- **触发条件**: 任何时候设置演示模式值
- **允许**: `true` 或 `false`
- **拒绝**: 非布尔值、null、字符串 `"ON"/"OFF"` 等
- **拒绝行为**: 返回 HTTP 400，提示"演示模式值无效，必须为 true 或 false"
- **关联验收**: AT-006

### BR-002: 原因必填且长度限制
- **触发条件**: 提交修改请求
- **允许**: 非空字符串，长度 4-200 字符
- **拒绝**: 空字符串、纯空格、null、少于 4 字符、超过 200 字符
- **拒绝行为**: HTTP 400，提示"修改演示模式必须提供原因"或"修改原因至少4个字符"
- **关联验收**: AT-007, AT-008

### BR-003: 审计记录写入
- **触发条件**: 任何成功的修改（新旧值不同）
- **记录内容**:
  - 操作人: 当前登录用户
  - 操作时间: 服务器时间
  - 旧值: 修改前的 `infra_config.value`
  - 新值: 请求中的 `enabled`
  - 原因: 请求中的 `reason`
- **存储位置**: `system_operate_log` 表
  - `type`: `"演示模式"`
  - `subType`: `"修改演示模式"`
  - `action`: `"将演示模式从【{旧值文案}】修改为【{新值文案}】，原因：【{reason}】"`
  - `extra` (JSON): `{"oldValue": "true", "newValue": "false", "reason": "..."}`
- **关联验收**: AT-004, AT-009

### BR-004: 幂等保护
- **触发条件**: 请求的 `enabled` 值与数据库中当前值相同
- **行为**: 返回成功（HTTP 200），但不执行数据库更新，不写入审计记录
- **判断方式**: 将请求值转为字符串 `"true"/"false"`，与 `infra_config` 中 `demo-mode` 行的 `value` 字段比较
- **关联验收**: AT-005

### BR-005: 角色权限边界
- **ConfigAdmin**:
  - 持有 `system:demo-mode:query` → 可调用 GET
  - 持有 `system:demo-mode:update` → 可调用 PUT
- **Operator**:
  - 持有 `system:demo-mode:query` → 可调用 GET
  - 不持有 `system:demo-mode:update` → PUT 返回 403
- **无权限用户**:
  - 两个权限均不持有 → GET/PUT 均返回 403
- **关联验收**: AT-010, AT-011, AT-013

### BR-006: 前端二次确认
- **触发条件**: 用户点击"保存"按钮且值已变更
- **确认弹窗文案**: `"确认将演示模式切换为【{开启/关闭}】？切换后所有写操作将被{禁止/允许}。"`
- **取消行为**: 关闭弹窗，不发起 API 请求，页面状态保持（开关保持新位置等待用户再次操作或手动复位）
- **关联验收**: AT-014

## 角色与权限

| 权限 Key | 名称 | 类型 | 授予角色 |
|----------|------|------|---------|
| `system:demo-mode:query` | 演示模式查询 | Button | ConfigAdmin, Operator |
| `system:demo-mode:update` | 演示模式修改 | Button | ConfigAdmin |

**数据可见范围**: 无数据级权限，所有授权用户看到相同值。

**权限不足行为**:
- 无 `system:demo-mode:query` → 菜单项不可见（动态路由不生成），页面不可达（v-hasPermi 移除）
- 无 `system:demo-mode:update` → 保存按钮不可见（v-hasPermi 移除），直接调 API 返回 403

## 数据与口径

| 字段 | 来源 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `enabled` (API 响应) | `infra_config.value` 转换 | boolean | Y | `"true"` → `true`, 其他 → `false` |
| `updatedAt` (API 响应) | `infra_config.update_time` | string (ISO 8601) | N | 首次种子数据无此字段时返回 null |
| `updatedBy` (API 响应) | `infra_config.updater` | string | N | 首次种子数据无此字段时返回 null |
| `reason` (API 请求) | 用户输入 | string | Y | 4-200 字符 |
| `enabled` (API 请求) | 用户操作 | boolean | Y | 仅 true/false |

**旧值/新值文案映射**:
- `"true"` ↔ `"开启"`
- `"false"` ↔ `"关闭"`

## 异常与降级

| 场景 | 系统行为 |
|------|---------|
| `infra_config` 中无 `demo-mode` 行 | GET 返回 `enabled: false`（默认关闭），PUT 先创建再更新 |
| 数据库不可用 | 返回 HTTP 500，不降级 |
| 审计日志写入失败 | 使用异步写入（`@Async`），失败不影响主流程 |
| 并发修改 | 乐观策略：后写者覆盖，两条审计记录均保留 |
| `reason` 包含特殊字符 | 允许，审计日志 JSON 存储需正确转义 |

## 非功能要求

| 维度 | 要求 |
|------|------|
| 性能 | GET 响应 < 200ms（单行查询 by indexed key） |
| 审计 | 记录到 `system_operate_log`，不可删除 |
| 安全 | 仅授权角色可操作，所有操作验证 Token |
| 可用性 | 服务重启后开关值不丢失（DB 持久化） |
