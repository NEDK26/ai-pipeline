# ExRobot Development Workflow

适用于 **Spring Boot + MyBatis-Plus + Vue 3 + Element Plus** 的企业后台项目研发工作流。

基于 Claude Code 的 Skill → Agent → Gate 双 Loop 流程，将模糊需求转化为可验证、可追溯、可审查的功能交付。

## 解决什么问题

- **需求到代码的断层**：从"用户说"到"开发者写"之间缺少结构化传递
- **前后端契约漂移**：后端静默改接口，前端按旧字段开发，联调时才发现
- **审查缺失或形式化**：无独立审查环节，质量问题在发布后才暴露
- **验证不可追溯**：测试结果分散，无法回答"哪些验收条件已通过、哪些未覆盖"

本仓库提供了一套 Claude Code 可执行的 Skill 和 Agent，配合质量门禁，形成可复现的研发闭环。

## 适用技术栈

| 层 | 技术 |
|---|------|
| 后端 | Spring Boot 3.4 + Java 17 + MyBatis-Plus + Redis/Redisson + MQTT/EMQX |
| 前端 | Vue 3 + Vite 5 + Element Plus 2.9 + TypeScript + Pinia + UnoCSS |
| 数据库 | MySQL 8.x |
| 包管理 | Maven (后端) + pnpm (前端) |
| CI | GitHub Actions |

## 目录结构

```
.
├── .claude/
│   ├── CLAUDE.md              # AI 角色 + 全局规则 + 文件索引
│   ├── skills/                # 6 个本地 Skill（流程执行）
│   │   ├── project-bootstrap/ # 项目初始化
│   │   ├── grill-with-docs/   # 需求访谈 + 文档沉淀
│   │   ├── feature-discovery/ # 需求规格化 → 规格包
│   │   ├── feature-backend/   # 后端实现
│   │   ├── feature-frontend/  # 前端实现
│   │   └── feature-verification/ # 验收与验证
│   ├── agents/                # 3 个审查 Agent（独立审查）
│   │   ├── requirements-reviewer.md
│   │   ├── backend-reviewer.md
│   │   └── release-reviewer.md
│   └── rules/                 # 路径匹配规则
│       ├── product-docs.md
│       ├── architecture-docs.md
│       └── frontend-ui.md
├── docs/
│   ├── process-reference.md   # 双 Loop 流程细则
│   ├── project-reference.md   # 项目技术栈/构建命令（由 bootstrap 生成）
│   ├── project-reference-template.md
│   └── features/              # 按 Feature 组织的规格包 + 交付物
│       └── <feature-id>/
├── scripts/
│   └── validate-pipeline.mjs  # 管道完整性检查器
├── .github/workflows/
│   └── validate-pipeline.yml  # CI：每次提交自动校验
└── .gitignore                 # 白名单策略
```

## 外部 Skills 推荐安装

本仓库只包含流程核心 Skills。以下为推荐安装的辅助 Skills：

| Skill | 用途 | 优先级 |
|-------|------|--------|
| `grilling` | 需求访谈与压力测试（与 grill-with-docs 二选一） | 高 |
| `superpowers:brainstorming` | 实现前方案梳理 | 高 |
| `superpowers:test-driven-development` | TDD 开发 | 高 |
| `superpowers:verification-before-completion` | 完工前证据验证 | 高 |
| `superpowers:requesting-code-review` | 请求实现级代码审查 | 高 |
| `superpowers:systematic-debugging` | Bug 根因定位 | 中 |
| `superpowers:writing-plans` | 多步骤任务规划 | 中 |
| `superpowers:executing-plans` | 按计划执行 | 中 |
| `interface-design:interface-design` | UI/UX 设计与设计系统一致性 | 中 |
| `webapp-testing` | 浏览器流程、截图、Console、网络验证 | 中 |
| `deep-research` | 外部信息深度调研 | 低 |
| `andrej-karpathy-skills-1.0.0` | 减少 LLM 编码常见错误 | 低 |

安装方式：`/plugin install <skill-name>` 或通过 Claude Code 插件市场。

## 首次使用

### 1. 初始化项目参考文件

```
/project-bootstrap
```

这会扫描项目结构，基于 `docs/project-reference-template.md` 生成 `docs/project-reference.md`，后续所有 Skill 依赖此文件识别技术栈、构建命令和编码规范。

### 2. 运行管道校验

```bash
node scripts/validate-pipeline.mjs
```

确认 0 error（WARNING 可接受）。CI 会在每次 push/PR 时自动执行。

### 3. 开始第一个 Feature

见下方 F-001 完整示例。

## /project-bootstrap 说明

`/project-bootstrap` 是项目初始化 Skill。它：

1. 扫描顶层目录和子项目（`pom.xml`、`package.json`、`build.gradle` 等）
2. 读取中间件配置（`application*.yml`、`.mcp.json`、`.env`）
3. 基于 `docs/project-reference-template.md` 逐节填充
4. 无法自动确认的字段标记 `<!-- TODO: 需人工确认 -->`
5. 写入 `docs/project-reference.md`

若 `project-reference.md` 已存在，只补充新发现的子项目或配置变更，不覆盖人工已确认内容。

## F-001：从需求到发布完整示例

以"用户管理列表页"为例。

### Loop A：需求循环

```bash
# 1. 需求访谈
/grill-with-docs "需要一个用户管理页面，支持搜索、分页、启用/禁用"

# 2. 生成规格包
/feature-discovery F-001 "用户管理"

# 产出：docs/features/F-001/
#   brief.md, spec.md, prototype.md, acceptance-tests.md,
#   architecture-impact.md, api-contract.md, handoff.md
```

`handoff.md` 输出 `Drafted` / `Pending Review` 后，由 `requirements-reviewer` 审查。审查结论不是 `Blocked` 即可进入 Loop B。

### Loop B：后端

```bash
# 3. 实现后端
/feature-backend F-001

# 产出：Controller、Service、Mapper、Entity、DTO、
#       测试代码、backend-handoff.md
# api-contract.md Status → Frozen

# 4. 后端审查
# 调用 backend-reviewer Agent，判定 Approve / Changes Required
```

### Loop B：前端

```bash
# 5. 实现前端（可与后端并行，但需 Frozen 契约）
/feature-frontend F-001

# 产出：Vue 组件、页面、路由、API 调用层、类型定义
```

### Loop B：验证与发布

```bash
# 6. 验收验证
/feature-verification F-001

# 产出：test-traceability.md、verification-report.md、defects.md

# 7. 发布审查
# 调用 release-reviewer Agent，判定 Ready / Blocked
# 人工确认后发布
```

### 过程中遇到问题？

| 问题类型 | 回流方向 |
|----------|----------|
| 需求不清 | `/feature-discovery F-001` |
| 后端规则/接口问题 | `/feature-backend F-001` |
| 页面/交互问题 | `/feature-frontend F-001` |
| 前后端字段不一致 | 后端创建 CCR，双方确认 |
| 上线后新需求 | 新建 Feature（如 F-002），不塞入 F-001 |

## 研发流程图

```
┌─ Loop A：需求与架构 ──────────────────────────────┐
│                                                    │
│  /grill-with-docs → /feature-discovery             │
│       → requirements-reviewer → 规格包 Ready        │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─ /feature-backend ──┐   ┌─ /feature-frontend ──┐
│  → backend-reviewer  │   │  (Frozen 契约后开始)   │
└──────────┬───────────┘   └──────────┬─────────────┘
           │                          │
           └────────┬─────────────────┘
                    ▼
          ┌─ /feature-verification ──┐
          │  → release-reviewer      │
          │  → 人工确认发布            │
          └──────────────────────────┘
                    │
                    ▼
          线上反馈 / 新需求 → 回到 Loop A
```

## 管道校验

```bash
node scripts/validate-pipeline.mjs
```

检查 6 项：
1. SKILL.md frontmatter 可解析
2. `$feature_id` 使用与 `arguments` 声明一致
3. "详见" / templates / references / checklists 引用文件存在
4. process-reference 声明的 Agent/Skill 存在
5. Rule 的 paths 覆盖实际文件
6. 模板仓库具备 .gitignore + project-bootstrap

Exit 0 = 通过，Exit 1 = 有 ERROR。CI 自动执行。

## 许可

内部使用。ExRobot 项目研发流程。
