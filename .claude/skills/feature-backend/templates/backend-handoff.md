# $feature_id：后端交接说明

## 规格→实现映射

| 规格项 | 后端落点 | 测试落点 | 状态 |
|--------|----------|----------|------|
| 用户故事 / 业务规则 | Service / Domain / Controller | Unit / Integration / API | Pending / Done |
| 权限规则 | 权限校验位置 | 权限测试 | Pending / Done |
| 状态流转 | Enum / State Machine / Service | 状态机测试 | Pending / Done |
| 数据字段 | Entity / DTO / Migration | 数据校验测试 | Pending / Done |
| 审计要求 | Audit Log / Operation Log | 审计测试 | Pending / Done |

## 已实现接口

| 方法 | 路径 | 对应 API 编号 | 状态 |
|------|------|-------------|------|

## 新增数据表

| 表名 | 迁移文件 | 说明 |
|------|----------|------|

## 状态机

| 状态 | 允许转换 | 禁止转换 |
|------|----------|----------|

## 权限

| 接口 | 所需权限 | 缓存 Key |
|------|----------|----------|

## 测试结果

- 单元测试：通过 X / 失败 X
- 集成测试：通过 X / 失败 X

## 未覆盖项

- 无 / 编号、原因

## 注意事项

- 权限修改后的 Redis 清除 Key：
- MQTT Topic 变更：
- 依赖的外部服务：
