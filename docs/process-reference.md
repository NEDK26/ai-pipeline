# 研发流程参考

> 本文档是 CLAUDE.md 的流程细则扩展。CLAUDE.md 中的索引决定何时读取哪些章节。

---

## Loop A：需求与架构循环

### 目标

将模糊需求转化为可进入工程开发的"开发就绪规格包"。

### 推荐流程

```text
需求访谈
→ 需求澄清
→ 功能规格化
→ 原型与关键用户路径
→ 验收用例
→ 架构影响与 API 契约
→ 需求审查
→ Ready / Ready with Risks / Blocked
```

### Skill 与 Agent

| 阶段    | 默认能力                           | 输出                                 |
| ----- | ------------------------------ | ---------------------------------- |
| 需求访谈  | `grilling` 或 `grill-with-docs` | 已确认事实、假设、待确认项、关键决策                 |
| 需求规格化 | `feature-discovery`            | Feature 规格包                        |
| 需求审查  | `requirements-reviewer`        | Ready / Ready with Risks / Blocked |

只有 `/skills` 中实际存在的 Skill 才能调用。

未安装的可选 Skill 不得阻塞研发流程；此时按本文件和 Feature 文档执行同等流程。

### 开发就绪规格包

每个 Feature 使用统一目录：

```text
docs/features/<feature-id>/
├─ brief.md
├─ spec.md
├─ prototype.md
├─ acceptance-tests.md
├─ architecture-impact.md
├─ api-contract.md
└─ handoff.md
```

`handoff.md` 只有在以下结论之一时，才允许进入 Loop B：

```text
Ready
Ready with Risks
```

若为 `Blocked`：

- 不编写关键业务代码；
- 不自行猜测业务规则；
- 回流到 `feature-discovery` 或需求澄清阶段；
- 明确记录阻塞项、影响范围和需要确认的人。

---

## Loop B：工程交付循环

### 后端实现

| 阶段   | 默认能力               | 输入                 | 输出                                              |
| ---- | ------------------ | ------------------ | ----------------------------------------------- |
| 后端实现 | `feature-backend`  | Feature 规格包、API 契约 | 后端代码、测试、`backend-handoff.md`                    |
| 后端审查 | `backend-reviewer` | 后端改动、规格包、测试        | Approve / Approve with Risks / Changes Required |

后端必须作为业务规则的最终约束层。

不得仅依赖前端实现以下限制：

- 权限判断；
- 状态流转；
- 参数合法性；
- 高风险操作限制；
- 幂等与重复提交控制；
- 数据范围控制；
- 发布、删除、回滚、强制更新等操作保护。

### 前端实现

| 阶段    | 默认能力                    | 输入                    | 输出         |
| ----- | ----------------------- | --------------------- | ---------- |
| 前端实现  | `feature-frontend`      | Feature 规格包、原型、API 契约 | 页面、交互、前端测试 |
| UI 设计 | `interface-design`，如已安装 | 原型说明、现有设计系统           | 页面结构与设计一致性 |

前端不得自行定义后端业务规则。

如接口字段、错误码、状态含义不足或不明确：

- 标记为 `Contract Mismatch`；
- 记录到 Feature 缺陷或风险文档；
- 回流后端实现或需求规格阶段；
- 不得通过猜测字段语义继续实现。

### 契约变更（Contract Change Request）

API 契约有两种状态，由 `api-contract.md` Metadata 中的 `Status` 字段定义：

| Status | 含义 |
|--------|------|
| **Draft** | 契约未冻结，后端可调整 |
| **Frozen** | 契约已锁定，前后端联调基准 |
| **Superseded** | 已被新版本替代 |

**Draft → Frozen：** 后端完成 API 设计，前端确认可实现，双方确认后更新 Status 为 Frozen，Contract Version 从 `0.x.0` 升级为 `1.0.0`。

**Frozen 后变更流程：**
1. 提出方（通常是后端）创建 `docs/features/<feature-id>/contract-changes/CCR-<feature-id>-<序号>.md`
2. 填写：涉及接口、变更前后对比、前端影响页面、测试影响用例、错误码影响
3. 前后端共同确认（CCR 中签字）
4. 更新 `api-contract.md`：递增 Contract Version，记录 Change Request 编号
5. 后端实现变更 → 前端适配 → 更新验收用例
6. 标记 CCR 为 Applied

**禁止：** Frozen 后单方面修改 `api-contract.md`。违反 → `backend-reviewer` / `release-reviewer` 判定为阻塞项。

### 测试与验证

| 阶段     | 默认能力                                    | 输出                                 |
| ------ | --------------------------------------- | ---------------------------------- |
| 验收与联调  | `feature-verification`                  | 追溯矩阵、验证报告、缺陷记录                     |
| 浏览器验证  | `webapp-testing`，如已安装                   | 截图、Trace、Console 与网络证据             |
| Bug 定位 | `superpowers:systematic-debugging`，如已安装 | 根因分析与修复建议                          |
| 发布审查   | `release-reviewer`                      | Ready / Ready with Risks / Blocked |

验证交付物至少包含：

```text
docs/features/<feature-id>/
├─ test-traceability.md
├─ verification-report.md
├─ defects.md
└─ defects/
```

---

## 质量门禁

### 需求门禁

进入开发前：

- [ ] 用户、场景、问题和目标明确；
- [ ] 功能范围与非目标明确；
- [ ] 核心业务规则可执行；
- [ ] 权限与状态流转明确；
- [ ] 原型覆盖主路径与高风险路径；
- [ ] 验收用例可执行；
- [ ] 架构影响和技术风险已识别；
- [ ] API 契约或现有接口边界明确；
- [ ] `requirements-reviewer` 结论不是 Blocked。

### 后端门禁

后端完成前：

- [ ] 关键业务规则由后端实际保证；
- [ ] 高风险状态流转不可绕过；
- [ ] 权限、事务、幂等、审计已评估；
- [ ] 关键业务规则有自动化测试；
- [ ] 真实构建命令已执行；
- [ ] 真实测试命令已执行；
- [ ] `backend-handoff.md` 已更新；
- [ ] `backend-reviewer` 无阻塞问题。

`mvn clean install -DskipTests` 仅可作为构建检查，不能作为后端测试通过的证据。

### 前端门禁

前端完成前：

- [ ] 页面主流程可完成；
- [ ] 表单校验、提交中、错误、空数据和无权限状态已处理；
- [ ] 高风险操作有明确确认与反馈；
- [ ] TypeScript 检查已执行；
- [ ] 相关前端测试已执行；
- [ ] 未通过猜测方式伪造接口字段或错误码。

### 发布门禁

发布前：

- [ ] P0 / P1 验收用例已执行并通过；
- [ ] 主用户路径已完成端到端验证；
- [ ] 关键页面截图、Trace 或日志证据已保存；
- [ ] 无未解决的阻塞缺陷；
- [ ] 未执行、跳过或人工验证的项目已明确说明；
- [ ] `release-reviewer` 结论不是 Blocked；
- [ ] 由人工确认是否接受非阻塞风险并发布。

---

## 缺陷与回流规则

测试或审查发现问题时，先分类，再回流。

| 问题类别                | 回流目标                        |
| ------------------- | --------------------------- |
| 需求不清、验收不可写、业务规则冲突   | `feature-discovery`         |
| 后端规则、权限、事务、状态机、接口问题 | `feature-backend`           |
| 页面、交互、表单、状态展示问题     | `feature-frontend`          |
| 前后端字段、错误码、数据口径不一致   | 后端与前端联合处理；必要时回流需求           |
| 契约冲突（Frozen 后单方面改契约） | 阻塞 — 须 CCR 流程；`backend-reviewer` 判 Changes Required |
| 测试脚本、测试数据、环境问题      | `feature-verification`      |
| 上线后新增能力诉求           | 新建 Feature，不直接塞入已完成 Feature |

不允许把以下问题混为 Bug：

```text
规格明确要求 A，但实际实现为 B
→ Defect

规格没有定义，测试无法判断正确行为
→ Product Gap

用户提出一个新的能力诉求
→ New Feature / Enhancement
```

---

## 辅助 Skills

以下能力仅在对应 Skill 已安装并可见时使用：

| Skill                                        | 用途                    |
| -------------------------------------------- | --------------------- |
| `superpowers:brainstorming`                  | 实现前梳理方案               |
| `superpowers:writing-plans`                  | 多步骤任务规划               |
| `superpowers:executing-plans`                | 按计划执行                 |
| `superpowers:test-driven-development`        | TDD 开发                |
| `superpowers:systematic-debugging`           | Bug 根因定位              |
| `superpowers:verification-before-completion` | 完工前证据验证               |
| `superpowers:requesting-code-review`         | 请求实现级代码审查             |
| `interface-design:interface-design`          | UI/UX 设计与设计系统一致性      |
| `webapp-testing`                             | 浏览器流程、截图、Console、网络验证 |
| `deep-research`                              | 需要外部信息支撑的深度调研         |

Skill 负责执行流程和产出。
Agent 负责独立审查风险和缺口。
构建、Lint、单元测试、接口测试、端到端测试负责确定性验证。
Agent 不得替代自动化测试。
