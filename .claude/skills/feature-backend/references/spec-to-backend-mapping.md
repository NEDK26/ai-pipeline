# 规格→实现映射指引

在 `backend-handoff.md` 中建立映射，确保每个规格项都有明确后端落点。

| 规格项 | 后端落点 | 测试落点 | 状态 |
|--------|----------|----------|------|
| 用户故事 / 业务规则 | Service / Domain / Controller | Unit / Integration / API | Pending / Done |
| 权限规则 | 权限校验位置 | 权限测试 | Pending / Done |
| 状态流转 | Enum / State Machine / Service | 状态机测试 | Pending / Done |
| 数据字段 | Entity / DTO / Migration | 数据校验测试 | Pending / Done |
| 审计要求 | Audit Log / Operation Log | 审计测试 | Pending / Done |

## 关键规则

- 每个重要业务规则必须有明确后端落点
- 禁止出现"前端已限制，因此后端无需校验"
