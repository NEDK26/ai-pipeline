---
name: feature-backend
description: 基于已通过需求评审的功能规格包，实现后端领域逻辑、接口、数据访问、权限、事务、审计与自动化测试。适用于 Spring Boot、MyBatis-Plus、MySQL 类企业后台项目。
argument-hint: '<feature-id> [slice]'
arguments:
  - feature_id
  - slice
disable-model-invocation: true
---

# Feature Backend：后端功能交付

当前功能：$feature_id
实现范围：$slice

## 目标

基于已确认的 Feature 规格包，实现可测试、可联调、可审查的后端功能。
交付覆盖：领域对象与业务规则、状态机与合法状态流转、API 契约、数据模型与数据访问、权限控制、事务/幂等/并发安全、审计与错误处理、自动化测试、前端联调说明。

## 可选协作

可叠加 Skill：`superpowers:test-driven-development`、`superpowers:verification-before-completion`、`ponytail`、`andrej-karpathy-skills-1.0.0`。详见 `references/collaboration-skills.md`。

## 前置条件

开始前必须读取：
1. `.claude/CLAUDE.md`
2. `docs/features/<feature-id>/spec.md`
3. `docs/features/<feature-id>/acceptance-tests.md`
4. `docs/features/<feature-id>/architecture-impact.md`
5. `docs/features/<feature-id>/handoff.md`
6. 当前 Feature 相关的已有代码、接口、数据库表、枚举和测试
7. 项目已有构建、测试、迁移和代码规范配置

进入 Loop B 条件：`docs/features/<feature-id>/handoff.md` Metadata `Status` 为 `Ready` 或 `Ready with Risks`。

（`Status` 由 `requirements-reviewer` 审查后写入。`Drafted` / `Pending Review` / `Blocked` 状态不允许开始 Loop B。）

若不满足 → 不写业务代码，列出阻塞项，建议回流到 `feature-discovery` 或 `requirements-reviewer`。

## 严格边界

可以：新增/修改当前 Feature 相关后端代码、测试和数据迁移；执行构建/测试/静态检查命令。

不可以：改变产品范围；自行修改关键业务规则；绕开已有领域模型或状态机；删断言/跳测试/弱化校验以通过测试；修改无关模块；自动提交/推送/发布/操作生产数据库；将前端校验视为后端校验的替代品。

**API 契约修改权限：**

- 当 `api-contract.md` Metadata `Status = Draft`：可更新契约，递增 Contract Version。
- 当 `Status = Frozen`：**不得直接修改 `api-contract.md`**。如实现发现契约问题：
  1. 创建 `docs/features/$feature_id/contract-changes/CCR-<feature-id>-<序号>.md`（模板见 `templates/contract-change-request.md`）；
  2. 说明变更原因、影响接口、影响前端页面、影响验收用例；
  3. 将状态标记为 `Contract Mismatch`；
  4. 经需求/架构确认后，生成新版本契约；
  5. 前后端同步后才继续。
- 当 `Status = Superseded`：指向新契约版本，不修改已归档版本。

冻结后单方面改契约 → 阻塞项，`backend-reviewer` 判定为 Changes Required。

## 第一步：建立实现映射

创建或更新 `docs/features/<feature-id>/backend-handoff.md`，填充 `templates/backend-handoff.md` 中的"规格→实现映射"表。
每个重要业务规则必须有明确后端落点。禁止出现"前端已限制，因此后端无需校验"。

## 第二步：检查契约状态

读取 `docs/features/<feature-id>/api-contract.md` 顶部 Metadata，确认 `Status` 字段：

- **Draft**：继续第三步，可以定义和调整 API 契约。
- **Frozen**：按现有契约实现。如需变更 → 创建 `docs/features/<feature-id>/contract-changes/CCR-<feature-id>-<序号>.md`，填写影响分析，前后端确认后更新契约。
- **Superseded**：定位新契约版本，按新版本执行。

## 第三步：先定义后端设计

修改代码前确认：

**领域与数据**：需新增/调整的 Entity、DTO、VO、Enum；数据库字段、索引、唯一约束或迁移；空值/默认值/历史数据兼容；审计字段；逻辑删除/乐观锁。

**状态机**：涉及发布、回滚、删除、审批、退款、库存、名额、任务执行等状态变化时——定义状态枚举、允许转移、禁止转移、转移前置条件、失败后状态、回退或补偿方式；禁止 Controller 直接更新状态字段。

**API 契约**：请求路径与方法、DTO、VO、参数校验、权限要求、成功/错误响应、分页/筛选/排序/时间字段口径、幂等要求。

## 第四步：按 TDD 实现

优先使用项目已有测试框架与风格。实现顺序：为关键业务规则写失败测试 → 实现最小可通过业务逻辑 → 运行测试 → 重构 → 继续下一条。

测试覆盖要求见 `checklists/backend-test-coverage.md`。

## 第五步：实现要求

**Controller**：只负责请求接收、DTO 校验、权限入口和统一响应；不写复杂业务规则；不直接调用 Mapper；不返回 Entity；不暴露内部异常。

**Service**：承担业务规则、状态校验、事务边界和审计逻辑；多表修改/状态切换/金额/库存/发布/回滚时必须正确使用事务；不允许绕过状态机直接更新关键状态。

**Mapper / Repository**：仅负责数据访问；更新删除必须有明确条件，禁止无条件批量操作；分页必须有稳定排序；避免 `select *` 和 N+1 查询。

**通用约束**：金额用 `BigDecimal`，时间用 `LocalDateTime`，状态/类型/策略用 Enum，禁止魔法数字和散落字符串状态。

**高风险操作权限与审计**：发布、停止发布、回滚、删除、权限调整、强制更新、金额变更——必须后端权限校验 + 状态前置校验 + 操作影响范围明确 + 审计记录完整 + 必要时二次确认参数或幂等键 + 可追踪操作人/时间/对象/结果。

## 第六步：测试与联调

执行项目真实测试命令，不要猜命令。测试覆盖要求见 `checklists/backend-test-coverage.md`。
在 `backend-handoff.md` 中补充：已实现接口、请求参数、返回字段、错误码、空值与默认值语义、分页与排序规则、接口是否已可供前端联调、未完成或有风险的接口。

## 第七步：完成标准

- [ ] 每条关键业务规则都有后端实现落点
- [ ] 状态流转不可被直接绕过
- [ ] 高风险操作有后端权限校验
- [ ] 关键写操作具备合理事务边界
- [ ] 重复请求与并发风险已评估
- [ ] 数据更新/删除均有明确条件
- [ ] API 契约与规格一致
- [ ] 关键业务规则已有自动化测试
- [ ] 测试命令已真实执行
- [ ] 前端联调说明已更新
- [ ] 没有为了通过测试而削弱业务校验

存在未解决风险必须写入 `backend-handoff.md`，不得标记为无风险完成。

## 最终回复格式

完成后只输出：

## <feature-id>：后端交付结果

### 实现范围
- 新增或修改的领域对象：
- 新增或修改的接口：
- 新增或修改的数据结构：
- 新增或修改的业务规则：

### 测试结果
- 已执行命令：
- 通过：
- 失败：
- 未执行：

### 联调信息
- 可供前端联调的接口：
- 关键错误码：
- 特殊字段或状态说明：

### 风险与待审查项
- 无 / 风险说明

### 下一步
1. 调用 `backend-reviewer` 审查当前后端实现；
2. 无阻塞问题后，进入 `feature-frontend` 或 `feature-verification`；
3. 联调完成后由 `feature-verification` 汇总证据。
