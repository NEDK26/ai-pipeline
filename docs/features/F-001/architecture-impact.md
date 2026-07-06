# F-001: 架构影响与待决事项 — 演示配置开关

**Status**: Drafted
**Date**: 2026-07-03

## 已有约束

| 约束 | 说明 |
|------|------|
| 领域模型 | `ConfigDO` → `infra_config` 表，已有 `configKey` 唯一索引 |
| 已有接口 | `ConfigService.getConfigByKey()` / `updateConfig()` |
| 审计框架 | `@LogRecord` 注解 → `LogRecordServiceImpl` → `system_operate_log` |
| 权限模型 | `@PreAuthorize("@ss.hasPermission('...')")` + `system_menu.permission` |
| 前端框架 | Element Plus 2.9, Vue 3.5, v-hasPermi 指令, useMessage() |

## 影响分析

### 新增文件

| 层级 | 文件 | 说明 |
|------|------|------|
| Backend - API | `exrobot-module-api/.../controller/admin/system/demo/DemoModeController.java` | REST 控制器 |
| Backend - API | `exrobot-module-api/.../controller/admin/system/demo/vo/DemoModeRespVO.java` | GET 响应 VO |
| Backend - API | `exrobot-module-api/.../controller/admin/system/demo/vo/DemoModeUpdateReqVO.java` | PUT 请求 VO |
| Backend - Infra | `exrobot-module-infra/.../service/config/DemoModeService.java` | 业务接口 |
| Backend - Infra | `exrobot-module-infra/.../service/config/DemoModeServiceImpl.java` | 业务实现（含 @LogRecord） |
| Backend - SQL | `exbot-sys/sql/demo_mode_init.sql` | 种子数据 |
| Frontend - API | `rsp-vue/src/api/system/demoMode/index.ts` | API 调用层 |
| Frontend - View | `rsp-vue/src/views/system/demoMode/index.vue` | 页面组件 |

### 修改文件

| 层级 | 文件 | 变更 |
|------|------|------|
| Backend - Infra | `ErrorCodeConstants.java` | 新增 3 个错误码 |
| Backend - System | `LogRecordConstants.java` | 新增 3 个常量 |

### 未修改

- ❌ 无框架层 (framework) 变更
- ❌ 无数据库 schema 变更（复用 `infra_config` 和 `system_operate_log`）
- ❌ 无 DemoFilter 修改
- ❌ 无启动配置变更

### 权限模型影响

- 新增 2 个权限字符串: `system:demo-mode:query`, `system:demo-mode:update`
- 需在 `system_menu` 注册，在 `system_role_menu` 分配
- 菜单项父节点: System 菜单 (通过数据库配置)

### 审计与可观测性

- 复用 `system_operate_log`，无新表
- 使用 `@LogRecord` 异步写入（`@Async`），不阻塞主请求
- 日志级别: 不额外打 INFO/WARN 日志

### 性能/容量/成本

- GET: 单行查询 `SELECT * FROM infra_config WHERE config_key = 'demo-mode'`（有索引，< 1ms）
- PUT: 单行更新 + 一条审计日志插入（< 5ms）
- 审计日志增长: 低频操作，预估 < 100 条/年

## 待确认架构决策

无。本 Feature 完全复用现有基础设施，无需新增架构决策或 ADR。

## 技术风险

| 风险 | 触发条件 | 影响 | 缓解措施 | 阻塞？ |
|------|---------|------|---------|--------|
| `demo-mode` 种子行不存在 | 未执行 init SQL | GET 返回 enabled=false（默认），PUT 正常（Service 处理不存在时创建） | init SQL 幂等，可随时执行 | 否 |
| ConfigAdmin 角色不存在 | 测试环境未预配 | 无人能修改开关 | 在 `system_role` 和 `system_role_menu` 中配置 | 否（运维配置） |
| 审计日志表满 | 长期未清理 | 插入变慢 | 异步写入不阻塞主流程；运维定期归档 | 否 |

**总体风险等级**: 🟢 低
