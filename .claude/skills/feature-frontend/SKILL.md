---
name: feature-frontend
description: 根据功能规格包实现企业级前端界面。基于 Vue 3 + Element Plus + TypeScript，使用 interface-design 进行设计审查。适用于功能开发阶段的前端实现。
argument-hint: '<feature-id>'
skills:
  - interface-design
  - webapp-testing
---

# Feature Frontend：前端实现

当前功能：`$ARGUMENTS` 中的 feature-id

## 目标

读取 `docs/features/$feature_id/` 下的规格包，实现符合设计规范的前端页面。

## 前置条件

规格包必须已通过 requirements-reviewer 审查（handoff.md 状态为 Ready 或 Ready with Risks）。

## 严格边界

可以做：
- 创建和修改 Vue 组件、页面、路由、API 调用、类型定义
- 使用 `interface-design` skill 进行 UI 审查
- 使用 `webapp-testing` 截图验证

不可以：
- 修改后端代码或数据库
- 修改 API 契约（只能按 `api-contract.md` 实现）
- 跳过 prototype.md 定义的状态和交互
- 自由发挥 UI 样式（必须遵循设计规范和 prototype.md）

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

在编码前，使用 `interface-design` skill 审查 prototype.md 中的页面设计：

- 信息层级和扫描效率
- 状态覆盖（空数据、加载、错误、无权限、禁用、提交中）
- 高风险操作的确认和反馈
- 与企业管理系统既有设计模式的一致性

产出设计审查意见，确认后再开始编码。

## 第三步：实现

按 handoff.md 的纵向切片顺序实现：

### 页面结构（Vue 3 + Element Plus）

```vue
<script setup lang="ts">
// TypeScript 类型定义
// API 调用
// 响应式状态
// 权限检查
// 业务逻辑
</script>

<template>
  <!-- Element Plus 组件 -->
  <!-- 空状态 / 加载状态 / 错误状态 -->
  <!-- 表格页：筛选、重置、分页、空状态、加载状态 -->
  <!-- 表单页：必填标识、校验提示、提交中状态、防重复提交 -->
</template>
```

### API 层

按 `api-contract.md` 实现接口调用：
- 请求参数类型
- 返回类型
- 错误处理
- 分页/排序/筛选参数

### 页面约束

- 表格页必须提供：筛选、重置、分页、空状态、加载状态
- 表单页必须提供：必填标识、校验提示、提交中状态、防重复提交
- 删除、发布、回滚、强制更新等高风险操作必须二次确认
- 不新增装饰性渐变、玻璃背景、发光阴影
- 不降低表格、列表和表单的信息密度

## 第四步：截图验证

使用 `webapp-testing` 对关键页面截图验证：

- 主路径关键节点
- 空状态、加载状态、错误状态
- 高风险操作确认弹窗
- 权限不足状态

确保实现与 prototype.md 的交互说明一致。

## 第五步：输出

```markdown
## $feature_id 前端实现完成

### 已实现页面
- 页面路径：说明

### 已实现状态覆盖
- 加载 / 空 / 错误 / 无权限 / 禁用 / 提交中

### 截图证据
- 路径列表

### 未覆盖项
- 无 / 编号、原因
```
