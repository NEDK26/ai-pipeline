---
name: feature-discovery
description: 将已澄清的产品需求整理为可交付给开发循环的功能规格包。仅在完成需求澄清或已有充分的需求决策与项目文档时使用。不会编写业务代码。
argument-hint: '<feature-id> "<feature-name>"'
arguments:
  - feature_id
  - feature_name
disable-model-invocation: true
---

# Feature Discovery：开发就绪规格包

当前功能编号：<feature-id>
当前功能名称：<feature-name>

## 前置检查：需求澄清工具

执行前检查当前环境是否具备需求澄清能力：

1. 如果存在 `/grill-with-docs` 自定义命令 → 直接使用。
2. 如果只有 `grilling` skill → 先用 `grilling` 完成需求访谈，再回到本 skill。
3. 如果两者都没有 → 提示用户安装建议：

> 未检测到需求澄清工具。建议安装：
> - `grilling` skill（已内置）：用于需求访谈和压力测试
> - 或创建 `/grill-with-docs` 自定义命令：将 grilling 输出自动沉淀为文档

## 目标

将已澄清的需求整理为可进入开发 Loop 的功能规格包，使开发者、测试人员和 Claude Code 无需猜测：
- 为什么做、谁使用、做什么不做什么
- 用户如何完成任务
- 业务规则、权限和状态如何定义
- 哪些情况允许、拒绝、提示或回退
- 如何验收
- 对现有架构、数据、接口和运行风险的影响

默认中文输出。业务术语、接口名、代码名保持原样。

## 前置条件

至少满足其一：
1. 当前会话已完成需求澄清（grilling 或 /grill-with-docs）
2. 已存在明确的需求说明、会议纪要、用户反馈或决策记录
3. 项目中已有 CONTEXT.md、ADR、PRD、Issue 或原型说明

无法确认核心业务规则、用户目标、范围或验收方式时：
- 不要虚构完整需求
- 不要输出"Ready"
- 只提出一个最关键的阻塞问题，说明推荐答案及影响，等待用户回答

## 严格边界

只创建和更新需求规格文档。禁止：编写/修改/删除业务代码、数据库迁移、接口实现、安装依赖、启动服务、执行发布。不将猜测写成已确认事实。不直接修改根目录 CONTEXT.md 或现有 ADR。

如需新增架构决策，在 `architecture-impact.md` 中提出"待确认的架构决策请求"。

## 流程

### 第一步：读取与核验上下文

依次读取：`.claude/CLAUDE.md` → CONTEXT.md / CONTEXT-MAP.md → `docs/adr/` → 已有 PRD/Issue/会议纪要 → 相关代码/接口/数据模型 → 当前会话已确认结论。

区分四类信息：

| 类型 | 定义 | 文档标记 |
|------|------|----------|
| 已确认事实 | 用户、代码、已有文档或明确决策已证实 | Confirmed |
| 合理假设 | 当前推断合理，但尚未被确认 | Assumption |
| 待确认项 | 会影响范围、实现或验收的未决问题 | Open Question |
| 明确非目标 | 本期明确不做 | Out of Scope |

### 第二步：创建功能目录

```
docs/features/<feature-id>/
├─ brief.md                 ← 模板: templates/brief.md
├─ spec.md                  ← 模板: templates/spec.md
├─ prototype.md             ← 模板: templates/prototype.md
├─ api-contract.md          ← 模板: templates/api-contract.md
├─ acceptance-tests.md      ← 模板: templates/acceptance-tests.md
├─ architecture-impact.md   ← 模板: templates/architecture-impact.md
├─ handoff.md               ← 模板: templates/handoff.md
└─ reviews/                 ← 模板: templates/review.md
   ├─ requirements-review.md
   ├─ backend-review.md
   └─ release-review.md
```

已有文件时先阅读保留有效内容，最小化更新。不覆盖人工已确认内容。新旧结论冲突时标注冲突写入 handoff.md "待确认冲突"区域。

### 第三步～第八步：按模板生成各文件

每个文件的具体结构和填写要求见 `templates/` 目录下对应模板。

关键约束：
- **spec.md**: 禁止"支持灵活配置""合理提示""自动处理"等模糊词，必须改成可执行规则
- **prototype.md**: 企业管理端优先信息层级、任务路径、数据密度和操作效率，不用装饰性词汇
- **api-contract.md**: 后端实现接口的唯一契约，前端 mock/真实接口开发的唯一依据。路径、参数、返回字段、错误码、权限、状态限制、分页排序筛选、幂等规则、异常响应必须完整。契约权威来源规则见模板 `templates/api-contract.md`。
- **acceptance-tests.md**: 一条用例只验证一个主要行为，预期结果可观察
- **architecture-impact.md**: 不替代 ADR，不擅自做最终架构决定。无影响时明确写"未发现需要新增架构决策的事项"
- **handoff.md**: 按纵向切片拆分任务，不按"前端、后端、数据库"机械拆分

## 最终质量门禁

1. 是否把猜测写成事实
2. 是否存在无法测试的业务规则
3. 是否存在没有验收用例的用户故事
4. 是否存在没有页面或接口落点的关键流程
5. 是否存在没有权限定义的高风险操作
6. 是否存在没有失败处理的状态转换
7. 是否存在没有来源或口径的数据指标
8. 是否存在被遗漏的架构约束
9. Loop B 是否仍需要猜测关键业务决策

全部通过 → `Drafted` | 非阻塞风险 → `Pending Review` | 关键未决问题 → `Blocked`

## 最终回复格式

```markdown
## <feature-id>：规格包完成情况

### 结论
Drafted / Pending Review / Blocked

### 已创建或更新的文件
- 文件路径：一句话说明

### 已确认的关键决策
- 决策编号：结论

### 阻塞项
- 无 / 编号、问题、需要谁确认

### 建议进入 Loop B 的第一项任务
- 任务名称
- 对应验收用例
- 预期可验证结果
```
