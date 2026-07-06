# F-001: 开发交接说明 — 演示配置开关

## 功能元数据

| 字段 | 内容 |
|------|------|
| Feature ID | F-001 |
| 功能名称 | 演示配置开关 |
| 规格版本 | 0.1 |
| API 契约版本 | 0.1 (Draft) |
| 范围冻结 | 是 |
| 已接受风险 | 无 |
| 状态 | `Ready` |
| 状态理由 | requirements-reviewer 审查通过 (RR-F-001-001)，规格包完整可执行 |
| Requirements Review Link | `reviews/requirements-review.md` |
| 更新日期 | 2026-07-06 |

## Loop B 输入清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `brief.md` | ✅ | 问题、用户、范围、非目标已确认 |
| `spec.md` | ✅ | 3 条用户故事、6 条业务规则、2 个权限定义 |
| `prototype.md` | ✅ | 1 个页面、主路径 + 权限路径 + 异常路径 |
| `api-contract.md` | ✅ | 2 个接口（GET/PUT），含校验规则、错误码、幂等规则 |
| `acceptance-tests.md` | ✅ | 20 条用例（13 后端 + 7 前端），覆盖正常/权限/校验/幂等/审计 |
| `architecture-impact.md` | ✅ | 7 新增文件 + 2 修改文件，无框架层变更，低风险 |

## 开发任务建议

> 按纵向切片拆分，每片可独立验证。

### Slice 1: 后端 API + 业务逻辑 (1 day)

**范围**: DemoModeController → DemoModeService → infra_config

**产出**:
- `DemoModeRespVO.java`, `DemoModeUpdateReqVO.java`
- `DemoModeService.java` + `DemoModeServiceImpl.java`
- `DemoModeController.java`
- `ErrorCodeConstants.java` 新增 3 个错误码
- `LogRecordConstants.java` 新增 3 个常量
- `sql/demo_mode_init.sql`

**验证**: 运行 AT-001 至 AT-013（MockMvc 集成测试或 curl）

### Slice 2: 前端页面 (0.5 day)

**范围**: API 模块 + Vue 页面

**产出**:
- `src/api/system/demoMode/index.ts`
- `src/views/system/demoMode/index.vue`

**验证**: 手动验证 AT-014 至 AT-020

### Slice 3: 权限配置 + 端到端 (0.5 day)

**范围**: 数据库菜单/角色配置 + 集成验证

**产出**:
- `system_menu` 新增菜单行
- `system_role_menu` 分配权限

**验证**: 完整 20 条验收用例 + `node scripts/validate-pipeline.mjs`

## Development Ready 检查

| # | 检查项 | 状态 |
|---|--------|------|
| 1 | 用户、场景、问题已明确 | ✅ |
| 2 | 目标与范围已界定，非目标已列出 | ✅ |
| 3 | 事实、假设与待确认项已区分 | ✅ brief.md |
| 4 | 模糊词已具体化 | ✅ 全部可执行规则 |
| 5 | 每条用户故事至少关联一个验收条件 | ✅ 3 故事 → 13 后端 + 7 前端 |
| 6 | 高风险操作已定义权限、确认、影响范围和回退方式 | ✅ 无不可逆操作 |
| 7 | 状态流转已明确 | N/A（无状态机） |
| 8 | 异常流程已覆盖 | ✅ 校验失败、权限拒绝、幂等、并发 |
| 9 | 验收用例可执行 | ✅ |

## 阻塞项与待确认项

| 编号 | 问题 | 影响 | 责任人 | 建议处理 |
|------|------|------|--------|---------|
| O-001 | ConfigAdmin 角色是否已存在？还是需新建？ | Slice 3 权限配置 | 运维/开发 | 检查 `system_role` 表，若无则新建 |

## 验证建议

- **优先验收**: AT-003（正常切换）+ AT-004（审计写入）+ AT-005（幂等）+ AT-010（权限拒绝）
- **建议自动化**: AT-001 至 AT-013（后端 MockMvc 集成测试）
- **建议截图验证**: P-001 ConfigAdmin 视图 + P-001 Operator 视图
