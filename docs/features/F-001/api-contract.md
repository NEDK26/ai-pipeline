# F-001: API 契约 — 演示配置开关

**Feature ID**: F-001
**Version**: 0.1
**Status**: Draft
**Base Path**: `/admin-api`
**Date**: 2026-07-03

> **状态生命周期**: `Draft`（设计阶段，未锁定）→ `Frozen`（后端实现后锁定，前端联调基准）→ `Superseded`（被新版本替换）
>
> **权威规则**: 此文件是接口契约的唯一权威来源。后端按此实现，前端按此 mock/开发。与 Apifox/实际行为不一致时，以此文件为准并标记 `Contract Mismatch`。

---

## 接口 1: 查询演示模式状态

### 基本信息

| 项目 | 内容 |
|------|------|
| 方法 | `GET` |
| 路径 | `/system/demo-mode/get` |
| 说明 | 获取当前演示模式开关状态及最后修改信息 |
| 权限 | `system:demo-mode:query` |
| 状态限制 | 无 |

### 请求参数

无 Path / Query / Body 参数。

### 请求示例

```bash
curl -X GET 'https://example.com/admin-api/system/demo-mode/get' \
  -H 'Authorization: Bearer <token>'
```

### 成功响应

**HTTP 200**

```json
{
  "code": 0,
  "data": {
    "enabled": false,
    "updatedAt": "2026-07-03T14:30:00",
    "updatedBy": "admin"
  },
  "msg": "成功"
}
```

**返回字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 0 = 成功 |
| `data.enabled` | boolean | 当前演示模式状态。`true` = 开启，`false` = 关闭。若 DB 中不存在该配置行，默认返回 `false` |
| `data.updatedAt` | string \| null | 最后修改时间 (ISO 8601)。从未修改过时返回 `null` |
| `data.updatedBy` | string \| null | 最后修改人用户名。从未修改过时返回 `null` |
| `msg` | string | 提示信息 |

### 业务错误码

| 错误码 | 说明 | 触发条件 |
|--------|------|---------|
| 无 | GET 接口无业务错误 | — |

### 异常响应

| HTTP | 场景 | 示例 |
|------|------|------|
| 401 | Token 缺失或过期 | `{"code": 401, "data": null, "msg": "未登录或登录已过期"}` |
| 403 | 缺少 `system:demo-mode:query` 权限 | `{"code": 403, "data": null, "msg": "没有该操作权限"}` |

---

## 接口 2: 修改演示模式状态

### 基本信息

| 项目 | 内容 |
|------|------|
| 方法 | `PUT` |
| 路径 | `/system/demo-mode/update` |
| 说明 | 切换演示模式开关，必须填写原因 |
| 权限 | `system:demo-mode:update` |
| 状态限制 | 无 |

### 请求参数

**Body (JSON)**:

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|---------|------|
| `enabled` | boolean | Y | `@NotNull` | 目标状态。`true` = 开启，`false` = 关闭 |
| `reason` | string | Y | `@NotBlank`, `@Size(min=4, max=200)` | 操作原因。至少 4 个字符，最多 200 个字符 |

### 请求示例

```bash
curl -X PUT 'https://example.com/admin-api/system/demo-mode/update' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "enabled": true,
    "reason": "生产环境排查问题，临时开启演示模式"
  }'
```

### 成功响应

**HTTP 200**（正常修改）:

```json
{
  "code": 0,
  "data": true,
  "msg": "成功"
}
```

**HTTP 200**（幂等：值未变）:

```json
{
  "code": 0,
  "data": true,
  "msg": "成功"
}
```

> 新旧值相同时，响应体相同，但服务端不执行 DB 更新、不写入审计日志。

### 业务错误码

| 错误码 | HTTP | 说明 | 触发条件 | 用户提示 |
|--------|------|------|---------|---------|
| `1_001_001_008` | 400 | `DEMO_MODE_REASON_REQUIRED` | `reason` 为空、null 或纯空白 | "修改演示模式必须提供原因" |
| `1_001_001_009` | 400 | `DEMO_MODE_REASON_TOO_SHORT` | `reason` 长度 < 4 | "修改原因至少4个字符" |
| `1_001_001_010` | 400 | `DEMO_MODE_VALUE_INVALID` | `enabled` 为 null 或非布尔 | "演示模式值无效，必须为 true 或 false" |

### 异常响应

| HTTP | 场景 | 示例 |
|------|------|------|
| 400 | 参数校验失败 | `{"code": 400, "data": null, "msg": "修改演示模式必须提供原因"}` |
| 401 | Token 缺失或过期 | `{"code": 401, "data": null, "msg": "未登录或登录已过期"}` |
| 403 | 缺少 `system:demo-mode:update` 权限 | `{"code": 403, "data": null, "msg": "没有该操作权限"}` |
| 500 | 数据库异常 | `{"code": 500, "data": null, "msg": "服务器内部错误"}` |

### 幂等规则

| 项目 | 内容 |
|------|------|
| 幂等判断 | 请求的 `enabled` 值（转为字符串 `"true"/"false"`）与 DB 中当前 `value` 相同 |
| 重复提交行为 | 返回 HTTP 200，不更新 DB，不写入 `system_operate_log` |
| 有效期 | 无时间窗口限制，任何时候相同值均为幂等 |

### 前后端对接说明

- **后端**: 按此契约实现 `DemoModeController`，Response/Request VO 严格对齐字段名和类型
- **前端**: 按此契约编写 `src/api/system/demoMode/index.ts`，按 `data.enabled` 渲染 Switch 状态
- **Frozen 后**: 不得新增必填字段、修改字段类型、删除返回字段（允许新增可选返回字段）
