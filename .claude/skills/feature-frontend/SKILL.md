---
name: feature-frontend
description: 根据功能规格包实现企业级前端界面。
argument-hint: '<feature-id> [slice]'
arguments:
  - feature_id
  - slice
disable-model-invocation: true
---

# Feature Frontend：前端实现

当前功能：$feature_id

## 目标

读取 `docs/features/$feature_id/` 规格包，实现符合设计规范的前端页面。

## 前置条件

规格包必须已通过 requirements-reviewer 审查（handoff.md 状态为 Ready 或 Ready with Risks）。

**契约状态检查：** 读取 `docs/features/$feature_id/api-contract.md` 顶部 Metadata：

| Status | 前端行为 |
|--------|----------|
| **Draft** | 不开始实现。提示后端先冻结契约。可提前阅读 prototype.md 做设计准备 |
| **Frozen** | 基于本版本实现。发现字段不足/错误码缺失 → 标记为 Contract Mismatch，要求后端创建 CCR |
| **Superseded** | 定位新契约版本，按新版本执行 |

## 可选协作

若已安装，可手动叠加：
- `interface-design`：实现前设计审查
- `webapp-testing`：浏览器路径、截图、Console、网络验证

详见 `references/collaboration-capabilities.md`。

## 严格边界

可以做：创建和修改 Vue 组件/页面/路由/API 调用/类型定义。

不可以：修改后端代码或数据库；修改 API 契约（只能按 `api-contract.md` Frozen 版本实现）；跳过 prototype.md 定义的状态和交互；自由发挥 UI 样式。

发现 Frozen 契约的字段、类型、错误码与实际接口不一致 → 不猜测，不自行适配。标记为 `Contract Mismatch`，要求后端通过 CCR（Contract Change Request）流程解决。

## 第一步：读取规格包与项目规范

1. `.claude/CLAUDE.md` — 技术栈约束、构建命令
2. `.claude/rules/frontend-ui.md` — 前端 UI 规则
3. `docs/features/$feature_id/brief.md` — 背景和目标
4. `docs/features/$feature_id/spec.md` — 业务规则和权限
5. `docs/features/$feature_id/prototype.md` — 页面清单、交互路径、状态
6. `docs/features/$feature_id/api-contract.md` — 接口契约
7. `docs/features/$feature_id/acceptance-tests.md` — 验收条件
8. `docs/features/$feature_id/handoff.md` — 开发任务拆分

## 第二步：设计审查

编码前审查 prototype.md 页面设计：信息层级和扫描效率；状态覆盖（空/加载/错误/无权限/禁用/提交中）；高风险操作确认和反馈；与既有设计模式一致性。

## 第三步：实现

按 handoff.md 纵向切片顺序实现。Vue 3 + Element Plus 组件结构见 `references/vue-component-template.md`。

**API 层**：按 `api-contract.md` 实现——请求参数类型、返回类型、错误处理、分页/排序/筛选参数。

**页面约束**：
- 表格页：筛选、重置、分页、空状态、加载状态
- 表单页：必填标识、校验提示、提交中状态、防重复提交
- 删除/发布/回滚/强制更新等高风险操作必须二次确认
- 不新增装饰性渐变、玻璃背景、发光阴影
- 不降低表格、列表和表单信息密度

## 第四步：截图验证

对关键页面截图验证：主路径关键节点；空状态/加载/错误状态；高风险操作确认弹窗；权限不足状态。
确保实现与 prototype.md 交互说明一致。

## 第五步：输出

见 `references/output-template.md`。
